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
export default async function fetchCommand(remoteArg) {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  inquirer = await getInquirer();
  const git = simpleGit();
  let remotes = [];
  try {
    remotes = (await git.getRemotes(true)).map((r) => r.name);
  } catch {}
  let remote = remoteArg;
  if (!remote) {
    if (remotes.length === 0) {
      console.log(
        boxen(chalk.red("No remotes found."), {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
      return;
    }
    const { selected } = await inquirer.prompt([
      {
        type: "list",
        name: "selected",
        message: "Select remote to fetch:",
        choices: ["All remotes", ...remotes],
      },
    ]);
    remote = selected === "All remotes" ? null : selected;
  }
  const spinner = ora({
    text: `Fetching${remote ? ` from ${remote}` : " from all remotes"}...`,
    color: "cyan",
  }).start();
  try {
    let fetchResult;
    if (!remote) {
      fetchResult = await git.fetch();
    } else {
      fetchResult = await git.fetch(remote);
    }
    spinner.succeed("✔ Fetch complete.");
    // Show summary of changes
    const status = await git.status();
    let summary = `Current branch: ${status.current}\n`;
    if (status.behind > 0) summary += `Behind by ${status.behind} commits\n`;
    if (status.ahead > 0) summary += `Ahead by ${status.ahead} commits\n`;
    if (status.behind > 0) summary += `You may want to pull, merge, or rebase.`;
    console.log(
      boxen(chalk.cyan(summary), {
        padding: 1,
        borderStyle: "round",
        borderColor: "cyan",
        margin: 1,
      })
    );
  } catch (err) {
    spinner.fail("Fetch failed.");
    console.log(
      boxen(chalk.red(`Error: ${err.message}`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
  }
}
