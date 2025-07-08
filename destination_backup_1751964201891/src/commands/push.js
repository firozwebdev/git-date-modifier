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
export default async function push(remote, branch) {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  const git = simpleGit();
  const spinner = ora({
    text:
      remote && branch
        ? `Pushing to ${remote}/${branch}...`
        : "Pushing to remote...",
    color: "cyan",
  }).start();
  try {
    if (remote && branch) {
      await git.push(remote, branch);
      spinner.succeed(`✔ Changes pushed to ${remote}/${branch}!`);
    } else {
      await git.push();
      spinner.succeed("✔ Changes pushed to remote!");
    }
  } catch (err) {
    spinner.fail("Push failed.");
    console.error(
      boxen(chalk.red("Error pushing: ") + err.message, {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
  }
}
