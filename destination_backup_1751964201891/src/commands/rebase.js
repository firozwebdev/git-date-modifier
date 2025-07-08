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
export default async function rebase() {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  const git = simpleGit();
  let branches;
  try {
    branches = await git.branchLocal();
  } catch (err) {
    console.error(
      boxen(chalk.red("Error reading branches: ") + err.message, {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
    return;
  }
  const { mode } = await inquirer.prompt([
    {
      type: "list",
      name: "mode",
      message: "What kind of rebase would you like to do?",
      choices: [
        { name: "Rebase current branch onto another branch", value: "onto" },
        {
          name: "Interactive rebase (edit/reorder last N commits)",
          value: "interactive",
        },
        { name: "Cancel", value: "cancel" },
      ],
    },
  ]);
  if (mode === "cancel") return;
  if (mode === "onto") {
    const { target } = await inquirer.prompt([
      {
        type: "list",
        name: "target",
        message: "Select branch to rebase onto:",
        choices: branches.all.filter((b) => b !== branches.current),
      },
    ]);
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Rebase ${branches.current} onto ${target}?`,
        default: true,
      },
    ]);
    if (!confirm) return;
    const spinner = ora({
      text: `Rebasing ${branches.current} onto ${target}...`,
      color: "cyan",
    }).start();
    try {
      await git.rebase([target]);
      spinner.succeed(`Rebased ${branches.current} onto ${target}`);
      console.log(
        boxen(
          chalk.green(`\u2714 Rebased ${branches.current} onto ${target}`),
          {
            padding: 1,
            borderStyle: "round",
            borderColor: "green",
            margin: 1,
            title: "Rebase Result",
            titleAlignment: "center",
          }
        )
      );
    } catch (err) {
      spinner.fail("Error during rebase");
      console.error(
        boxen(chalk.red("Error during rebase: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
  } else if (mode === "interactive") {
    const { n } = await inquirer.prompt([
      {
        type: "input",
        name: "n",
        message: "How many last commits to interactively rebase?",
        default: 3,
        validate: (v) =>
          !isNaN(v) && Number(v) > 0 ? true : "Enter a positive number",
      },
    ]);
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Start interactive rebase for last ${n} commits? (This will open your git editor)`,
        default: true,
      },
    ]);
    if (!confirm) return;
    const spinner = ora({
      text: `Starting interactive rebase for last ${n} commits...`,
      color: "cyan",
    }).start();
    try {
      await git.raw(["rebase", "-i", `HEAD~${n}`]);
      spinner.succeed(`Interactive rebase started for last ${n} commits.`);
      console.log(
        boxen(
          chalk.green(
            `\u2714 Interactive rebase started for last ${n} commits.`
          ),
          {
            padding: 1,
            borderStyle: "round",
            borderColor: "green",
            margin: 1,
            title: "Rebase Result",
            titleAlignment: "center",
          }
        )
      );
    } catch (err) {
      spinner.fail("Error during interactive rebase");
      console.error(
        boxen(chalk.red("Error during interactive rebase: ") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
  }
}
