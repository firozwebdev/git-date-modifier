import boxen from "boxen";
import chalk from "chalk";
import ora from "ora";
import simpleGit from "simple-git";
import { isGitRepo } from "./utils.js";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}
export default async function bisect() {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  const git = simpleGit();
  let bisectActive = false;
  try {
    // Check if bisect is already running
    const { stdout } = await git.raw(["bisect", "log"]);
    if (stdout && !stdout.includes("no bisect state")) {
      bisectActive = true;
    }
  } catch (err) {
    // If error, assume not active
  }

  const mainMenu = [
    { name: "Start bisect", value: "start" },
    { name: "Mark current commit as good", value: "good" },
    { name: "Mark current commit as bad", value: "bad" },
    { name: "Show bisect log", value: "log" },
    { name: "Reset bisect", value: "reset" },
    { name: "Exit", value: "exit" },
  ];

  let done = false;
  while (!done) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message:
          "Bisect Menu: What would you like to do?\n(Use arrow keys to select, Enter to confirm, Ctrl+C to quit.)",
        choices: mainMenu,
      },
    ]);
    if (action === "start") {
      const { good, bad } = await inquirer.prompt([
        {
          type: "input",
          name: "good",
          message: "Enter known good commit (hash, tag, or ref):",
        },
        {
          type: "input",
          name: "bad",
          message: "Enter known bad commit (hash, tag, or ref):",
        },
      ]);
      const spinner = ora({
        text: `Starting bisect...`,
        color: "cyan",
      }).start();
      try {
        await git.raw(["bisect", "start", bad, good]);
        bisectActive = true;
        spinner.succeed("Bisect started!");
        console.log(
          boxen(chalk.green("\u2714 Bisect started!"), {
            padding: 1,
            borderStyle: "round",
            borderColor: "green",
            margin: 1,
            title: "Bisect",
            titleAlignment: "center",
          })
        );
      } catch (err) {
        spinner.fail("Error starting bisect");
        console.error(
          boxen(chalk.red("Error starting bisect: ") + err.message, {
            padding: 1,
            borderStyle: "round",
            borderColor: "red",
            margin: 1,
          })
        );
      }
    } else if (action === "good" || action === "bad") {
      const spinner = ora({
        text: `Marking current commit as ${action}...`,
        color: "cyan",
      }).start();
      try {
        await git.raw(["bisect", action]);
        spinner.succeed(`Marked current commit as ${action}`);
        console.log(
          boxen(chalk.green(`\u2714 Marked current commit as ${action}`), {
            padding: 1,
            borderStyle: "round",
            borderColor: "green",
            margin: 1,
            title: "Bisect",
            titleAlignment: "center",
          })
        );
      } catch (err) {
        spinner.fail(`Error marking commit as ${action}`);
        console.error(
          boxen(chalk.red("Error marking commit: ") + err.message, {
            padding: 1,
            borderStyle: "round",
            borderColor: "red",
            margin: 1,
          })
        );
      }
    } else if (action === "log") {
      try {
        const { stdout } = await git.raw(["bisect", "log"]);
        console.log(
          boxen(chalk.white(stdout), {
            padding: 1,
            borderStyle: "round",
            borderColor: "cyan",
            margin: 1,
            title: "Bisect Log",
            titleAlignment: "center",
          })
        );
      } catch (err) {
        console.error(
          boxen(chalk.red("Error showing bisect log: ") + err.message, {
            padding: 1,
            borderStyle: "round",
            borderColor: "red",
            margin: 1,
          })
        );
      }
    } else if (action === "reset") {
      const spinner = ora({
        text: `Resetting bisect...`,
        color: "cyan",
      }).start();
      try {
        await git.raw(["bisect", "reset"]);
        bisectActive = false;
        spinner.succeed("Bisect reset!");
        console.log(
          boxen(chalk.green("\u2714 Bisect reset!"), {
            padding: 1,
            borderStyle: "round",
            borderColor: "green",
            margin: 1,
            title: "Bisect",
            titleAlignment: "center",
          })
        );
      } catch (err) {
        spinner.fail("Error resetting bisect");
        console.error(
          boxen(chalk.red("Error resetting bisect: ") + err.message, {
            padding: 1,
            borderStyle: "round",
            borderColor: "red",
            margin: 1,
          })
        );
      }
    } else {
      done = true;
    }
  }
}
