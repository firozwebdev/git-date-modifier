import boxen from "boxen";
import chalk from "chalk";
import simpleGit from "simple-git";
import { isGitRepo } from "./utils.js";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}
export default async function smart() {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  inquirer = await getInquirer();
  const git = simpleGit();
  let status, stashes, log;
  try {
    status = await git.status();
    stashes = await git.stashList();
    log = await git.log({ n: 5 });
  } catch (err) {
    console.error(
      boxen(chalk.red("Error reading repo state: ") + err.message, {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
    return;
  }

  // Compose smart summary
  let summary = "";
  summary += chalk.blue("On branch: ") + chalk.white(status.current) + "\n";
  if (status.ahead || status.behind) {
    summary +=
      chalk.yellow(`Ahead: ${status.ahead}, Behind: ${status.behind}`) + "\n";
  }
  if (status.staged.length > 0) {
    summary += chalk.green("Staged files: ") + status.staged.join(", ") + "\n";
  }
  if (status.modified.length > 0) {
    summary += chalk.red("Changed files: ") + status.modified.join(", ") + "\n";
  }
  if (stashes.all.length > 0) {
    summary += chalk.cyan(`Stashes: ${stashes.all.length}`) + "\n";
  }
  summary += chalk.gray(`Recent commits: ${log.total}`);

  console.log(
    boxen(summary, {
      padding: 1,
      borderStyle: "round",
      borderColor: "cyan",
      margin: 1,
      title: "Smart Repo State",
      titleAlignment: "center",
    })
  );

  // Build contextual actions
  const actions = [];
  if (status.ahead > 0) actions.push({ name: "Push changes", value: "push" });
  if (status.behind > 0)
    actions.push({ name: "Pull (or rebase) from remote", value: "pull" });
  if (status.staged.length > 0)
    actions.push({ name: "Commit staged changes", value: "commit" });
  if (status.modified.length > 0)
    actions.push({ name: "Add all & commit", value: "save" });
  if (stashes.all.length > 0)
    actions.push({ name: "Apply latest stash", value: "applyStash" });
  actions.push({ name: "Open git log", value: "log" });
  actions.push({ name: "Exit", value: "exit" });

  const { selected } = await inquirer.prompt([
    {
      type: "list",
      name: "selected",
      message: boxen(chalk.cyan("What do you want to do?"), {
        padding: 1,
        borderStyle: "round",
        borderColor: "cyan",
        margin: 1,
      }),
      choices: actions,
    },
  ]);

  // Handle actions
  if (selected === "push") {
    try {
      await git.push();
      console.log(
        boxen(chalk.green("✔ Changes pushed to remote!"), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
    } catch (err) {
      console.error(
        boxen(chalk.red("Error pushing: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
  } else if (selected === "pull") {
    try {
      await git.pull();
      console.log(
        boxen(chalk.green("✔ Pulled latest changes from remote!"), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
    } catch (err) {
      console.error(
        boxen(chalk.red("Error pulling: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
  } else if (selected === "commit") {
    const { message } = await inquirer.prompt([
      {
        type: "input",
        name: "message",
        message: "Enter commit message:",
        default: "Smart commit",
      },
    ]);
    try {
      await git.commit(message);
      console.log(
        boxen(chalk.green("✔ Staged changes committed!"), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
    } catch (err) {
      console.error(
        boxen(chalk.red("Error committing: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
  } else if (selected === "save") {
    const { message } = await inquirer.prompt([
      {
        type: "input",
        name: "message",
        message: "Enter commit message:",
        default: "Savepoint",
      },
    ]);
    try {
      await git.add(".");
      await git.commit(message);
      console.log(
        boxen(chalk.green("✔ All changes added and committed!"), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
    } catch (err) {
      console.error(
        boxen(chalk.red("Error saving: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
  } else if (selected === "applyStash") {
    try {
      await git.stash(["pop"]);
      console.log(
        boxen(chalk.green("✔ Latest stash applied!"), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
    } catch (err) {
      console.error(
        boxen(chalk.red("Error applying stash: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
  } else if (selected === "log") {
    // Show last 5 commits
    let logMsg = "";
    log.all.forEach((commit, idx) => {
      logMsg +=
        chalk.yellow(`#${idx + 1}`) + " " + chalk.white(commit.message) + "\n";
      logMsg +=
        chalk.gray(
          "  " +
            commit.hash.substr(0, 7) +
            " | " +
            commit.author_name +
            " | " +
            commit.date
        ) + "\n";
    });
    console.log(
      boxen(logMsg, {
        padding: 1,
        borderStyle: "round",
        borderColor: "cyan",
        margin: 1,
        title: "Recent Commits",
        titleAlignment: "center",
      })
    );
  } else {
    console.log(
      boxen(chalk.blue("Exited smart menu."), {
        padding: 1,
        borderStyle: "round",
        borderColor: "blue",
        margin: 1,
      })
    );
  }
}
