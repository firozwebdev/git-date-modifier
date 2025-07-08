import boxen from "boxen";
import chalk from "chalk";
import inquirer from "inquirer";
import simpleGit from "simple-git";
import { isGitRepo } from "./utils.js";

export default async function psf() {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  const git = simpleGit();
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: boxen(chalk.yellow("Are you sure you want to force push?"), {
        padding: 1,
        borderStyle: "round",
        borderColor: "yellow",
        margin: 1,
      }),
      default: false,
    },
  ]);
  if (!confirm) {
    console.log(
      boxen(chalk.blue("Force push cancelled."), {
        padding: 1,
        borderStyle: "round",
        borderColor: "blue",
        margin: 1,
      })
    );
    return;
  }
  try {
    await git.push(["--force"]);
    console.log(
      boxen(chalk.green("✔ Force push completed!"), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
  } catch (err) {
    console.error(
      boxen(chalk.red("Error during force push: ") + err.message, {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
  }
}
