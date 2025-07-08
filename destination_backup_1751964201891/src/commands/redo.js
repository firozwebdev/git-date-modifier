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
export default async function redo() {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  inquirer = await getInquirer();
  const git = simpleGit();
  const last = history.getLastUndone();
  if (!last) {
    console.log(
      boxen(chalk.yellow("No actions to redo."), {
        padding: 1,
        borderStyle: "round",
        borderColor: "yellow",
        margin: 1,
      })
    );
    return;
  }
  if (last.type === "branch-delete") {
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Re-delete branch '${last.branch}'?`,
        default: true,
      },
    ]);
    if (!confirm) return;
    try {
      await git.deleteLocalBranch(last.branch);
      history.popLastUndone();
      history.addAction(last);
      console.log(
        boxen(chalk.green(`✔ Branch '${last.branch}' re-deleted.`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
    } catch (err) {
      console.error(
        boxen(chalk.red("Error re-deleting branch: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
    return;
  }
  if (last.type === "tag-delete") {
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Re-delete tag '${last.tag}'?`,
        default: true,
      },
    ]);
    if (!confirm) return;
    try {
      await git.raw(["tag", "-d", last.tag]);
      history.popLastUndone();
      history.addAction(last);
      console.log(
        boxen(chalk.green(`✔ Tag '${last.tag}' re-deleted.`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
    } catch (err) {
      console.error(
        boxen(chalk.red("Error re-deleting tag: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
    return;
  }
  if (last.type === "stash-pop" || last.type === "stash-drop") {
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Re-pop/drop stash with message: '${last.message}'?`,
        default: true,
      },
    ]);
    if (!confirm) return;
    try {
      // Find stash by message
      const stashes = await git.stashList();
      const idx = stashes.all.findIndex((s) => s.message === last.message);
      if (idx === -1) throw new Error("Stash not found");
      const ref = `stash@{${idx}}`;
      if (last.type === "stash-pop") {
        await git.stash(["pop", ref]);
      } else {
        await git.stash(["drop", ref]);
      }
      history.popLastUndone();
      history.addAction(last);
      console.log(
        boxen(
          chalk.green(
            `✔ Stash ${last.type === "stash-pop" ? "popped" : "dropped"}: '${
              last.message
            }'`
          ),
          {
            padding: 1,
            borderStyle: "round",
            borderColor: "green",
            margin: 1,
          }
        )
      );
    } catch (err) {
      console.error(
        boxen(chalk.red("Error redoing stash action: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
    return;
  }
  if (last.type === "remote-branch-delete") {
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Re-delete remote branch '${last.branch}'?`,
        default: true,
      },
    ]);
    if (!confirm) return;
    try {
      await git.push(["origin", "--delete", last.branch]);
      history.popLastUndone();
      history.addAction(last);
      console.log(
        boxen(chalk.green(`✔ Remote branch '${last.branch}' re-deleted.`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
    } catch (err) {
      console.error(
        boxen(chalk.red("Error re-deleting remote branch: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
    return;
  }
  if (last.type === "reset-hard") {
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Redo hard reset? Reset again to ${last.to.substr(0, 7)}?`,
        default: true,
      },
    ]);
    if (!confirm) return;
    try {
      await git.reset(["--hard", last.to]);
      history.popLastUndone();
      history.addAction(last);
      console.log(
        boxen(chalk.green(`✔ Hard reset again to ${last.to.substr(0, 7)}`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
    } catch (err) {
      console.error(
        boxen(chalk.red("Error redoing hard reset: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
    return;
  }
  if (last.type === "unstage") {
    // Redo unstage: unstage the file again
    await git.reset(["HEAD", last.file]);
    console.log(
      boxen(chalk.green(`✔ Redo: unstaged file ${last.file}`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
    return;
  }
  if (last.type === "stash-create") {
    // Redo stash create: create the stash again
    await git.stash(["push", "-m", last.message]);
    console.log(
      boxen(chalk.green(`✔ Redo: stashed changes (${last.message})`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
    return;
  }
  if (last.type === "config") {
    await git.raw(["config", last.key, last.value]);
    console.log(
      boxen(chalk.green(`✔ Redo: set ${last.key} to '${last.value}'`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
    return;
  }
  if (last.type === "merge") {
    await git.merge([last.branch]);
    console.log(
      boxen(chalk.green(`✔ Redo: merged '${last.branch}' again`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
    return;
  }
  console.log(
    boxen(chalk.yellow("No redo available for last action."), {
      padding: 1,
      borderStyle: "round",
      borderColor: "yellow",
      margin: 1,
    })
  );
}
