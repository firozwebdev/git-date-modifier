import boxen from "boxen";
import chalk from "chalk";
import simpleGit from "simple-git";
import { isGitRepo } from "./utils.js";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}
export default async function remoteInit() {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  inquirer = await getInquirer();
  const git = simpleGit();
  try {
    const { remoteUrl } = await inquirer.prompt([
      {
        type: "input",
        name: "remoteUrl",
        message: "Enter remote repository URL:",
        validate: (input) =>
          input.trim() ? true : "Remote URL cannot be empty",
      },
    ]);
    await git.addRemote("origin", remoteUrl);
    console.log(
      boxen(chalk.green(`✔ Remote 'origin' added: ${remoteUrl}`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
    await git.branch(["-M", "main"]);
    console.log(
      boxen(chalk.green(`✔ Branch renamed to 'main'`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
    await git.push(["-u", "origin", "main"]);
    console.log(
      boxen(chalk.green(`✔ Pushed 'main' to 'origin' and set upstream`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
  } catch (err) {
    console.error(
      boxen(chalk.red("Error during remote init: ") + err.message, {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
  }
}
