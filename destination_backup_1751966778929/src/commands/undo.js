import boxen from "boxen";
import chalk from "chalk";
import simpleGit from "simple-git";
import history from "./history.js";
import { isGitRepo } from "./utils.js";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}

export default async function undo() {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  inquirer = await getInquirer();
  const git = simpleGit();
  const last = history.getLastAction();
  let handled = false;
  if (last) {
    if (last.type === "branch-delete") {
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `Restore deleted branch '${last.branch}' at ${last.hash.substr(0,7)}?`,
          default: true,
        },
      ]);
      if (!confirm) return;
      try {
        await git.raw(["branch", last.branch, last.hash]);
        history.popLastAction();
        history.addUndone(last);
        console.log(boxen(chalk.green(`✔ Branch '${last.branch}' restored at ${last.hash.substr(0,7)}`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        }));
      } catch (err) {
        console.error(boxen(chalk.red("Error restoring branch: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        }));
      }
      handled = true;
    } else if (last.type === "tag-delete") {
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `Re-create deleted tag '${last.tag}' at ${last.hash.substr(0,7)}?`,
          default: true,
        },
      ]);
      if (!confirm) return;
      try {
        await git.raw(["tag", last.tag, last.hash]);
        history.popLastAction();
        history.addUndone(last);
        console.log(boxen(chalk.green(`✔ Tag '${last.tag}' re-created at ${last.hash.substr(0,7)}`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        }));
      } catch (err) {
        console.error(boxen(chalk.red("Error re-creating tag: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        }));
      }
      handled = true;
    } else if (last.type === "stash-pop" || last.type === "stash-drop") {
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `Re-create stash with message: '${last.message}'?`,
          default: true,
        },
      ]);
      if (!confirm) return;
      try {
        // Apply patch and create stash
        await git.raw(["apply", "--index"], { input: last.patch });
        await git.stash(["push", "-m", last.message]);
        history.popLastAction();
        history.addUndone(last);
        console.log(boxen(chalk.green(`✔ Stash re-created: '${last.message}'`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        }));
      } catch (err) {
        console.error(boxen(chalk.red("Error re-creating stash: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        }));
      }
      handled = true;
    } else if (last.type === "reset-hard") {
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: `Undo hard reset? Reset back to ${last.from.substr(0,7)}?`,
          default: true,
        },
      ]);
      if (!confirm) return;
      try {
        await git.reset(["--hard", last.from]);
        history.popLastAction();
        history.addUndone(last);
        console.log(boxen(chalk.green(`✔ Reset back to ${last.from.substr(0,7)}`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        }));
      } catch (err) {
        console.error(boxen(chalk.red("Error undoing hard reset: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        }));
      }
      handled = true;
    } else if (last.type === "unstage") {
      // Re-stage the file to the recorded hash
      await git.add([last.file]);
      // Optionally, reset file to the staged hash (advanced)
      console.log(boxen(chalk.green(`✔ Undo: re-staged file ${last.file}`), { padding: 1, borderStyle: "round", borderColor: "green", margin: 1 }));
      handled = true;
    } else if (last.type === "stash-create") {
      // Undo stash create: apply and drop the stash
      await git.stash(["apply", last.ref]);
      await git.stash(["drop", last.ref]);
      console.log(boxen(chalk.green(`✔ Undo: unstashed changes from ${last.ref}`), { padding: 1, borderStyle: "round", borderColor: "green", margin: 1 }));
      handled = true;
    } else if (last.type === "config") {
      if (last.prev) {
        await git.raw(["config", last.key, last.prev]);
        console.log(boxen(chalk.green(`✔ Undo: restored ${last.key} to '${last.prev}'`), { padding: 1, borderStyle: "round", borderColor: "green", margin: 1 }));
      } else {
        await git.raw(["config", "--unset", last.key]);
        console.log(boxen(chalk.green(`✔ Undo: unset ${last.key}`), { padding: 1, borderStyle: "round", borderColor: "green", margin: 1 }));
      }
      handled = true;
    } else if (last.type === "merge") {
      await git.raw(["reset", "--hard", last.preMergeHead]);
      console.log(boxen(chalk.green(`✔ Undo: reset to pre-merge state (${last.preMergeHead})`), { padding: 1, borderStyle: "round", borderColor: "green", margin: 1 }));
      handled = true;
    }
  }
  if (!handled) {
    // Fallback: last commit undo (soft reset)
    try {
      const log = await git.log();
      if (!log.total || log.total === 0) {
        console.log(
          boxen(chalk.yellow("No actions to undo. (No tracked actions or commits)"), {
            padding: 1,
            borderStyle: "round",
            borderColor: "yellow",
            margin: 1,
          })
        );
        return;
      }
      if (log.total === 1) {
        console.log(
          boxen(
            chalk.yellow("Cannot undo the first (and only) commit. There is no previous commit to reset to."),
            {
              padding: 1,
              borderStyle: "round",
              borderColor: "yellow",
              margin: 1,
            }
          )
        );
        return;
      }
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: boxen(
            chalk.yellow(
              "Are you sure you want to undo the last commit? (soft reset)"
            ),
            {
              padding: 1,
              borderStyle: "round",
              borderColor: "yellow",
              margin: 1,
            }
          ),
          default: false,
        },
      ]);
      if (!confirm) {
        console.log(
          boxen(chalk.blue("Undo cancelled."), {
            padding: 1,
            borderStyle: "round",
            borderColor: "blue",
            margin: 1,
          })
        );
        return;
      }
      await git.reset(["--soft", "HEAD~1"]);
      console.log(
        boxen(chalk.green("✔ Last commit has been undone (soft reset)."), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
    } catch (err) {
      console.error(
        boxen(chalk.red("Error during undo: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
  }
};
