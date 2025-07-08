import boxen from "boxen";
import chalk from "chalk";
import simpleGit from "simple-git";
import { isGitRepo } from "./utils.js";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}
export default async function worktreeCommand() {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  inquirer = await getInquirer();
  const git = simpleGit();
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Worktree action:",
      choices: [
        { name: "List worktrees", value: "list" },
        { name: "Add worktree", value: "add" },
        { name: "Remove worktree", value: "remove" },
        { name: "Exit", value: "exit" },
      ],
    },
  ]);
  if (action === "exit") return;

  if (action === "list") {
    try {
      const { stdout } = await git.raw(["worktree", "list", "--porcelain"]);
      const entries = stdout.trim().split(/\n(?=worktree )/);
      entries.forEach((e) => {
        const path = e.match(/worktree (.+)/)?.[1];
        const branch = e.match(/branch (.+)/)?.[1];
        const bare = e.includes("bare");
        let status = `Path: ${path}`;
        if (branch) status += ` | Branch: ${branch}`;
        if (bare) status += " | (bare)";
        console.log(
          boxen(chalk.cyan(status), {
            padding: 1,
            borderStyle: "round",
            borderColor: "cyan",
            margin: 1,
          })
        );
      });
    } catch (err) {
      console.log(
        boxen(chalk.red(`Error: ${err.message}`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
    return;
  }

  if (action === "add") {
    const { path, branch } = await inquirer.prompt([
      { type: "input", name: "path", message: "Worktree path:" },
      { type: "input", name: "branch", message: "Branch (existing or new):" },
    ]);
    try {
      await git.raw(["worktree", "add", path, branch]);
      console.log(
        boxen(chalk.green(`✔ Worktree added at ${path} for branch ${branch}`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
    } catch (err) {
      console.log(
        boxen(chalk.red(`Error: ${err.message}`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
    return;
  }

  if (action === "remove") {
    let worktrees = [];
    try {
      const { stdout } = await git.raw(["worktree", "list", "--porcelain"]);
      worktrees = stdout
        .trim()
        .split(/\n(?=worktree )/)
        .map((e) => e.match(/worktree (.+)/)?.[1])
        .filter(Boolean);
    } catch (err) {
      console.log(
        boxen(chalk.red(`Error: ${err.message}`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
      return;
    }
    if (!worktrees.length) {
      console.log(
        boxen(chalk.yellow("No worktrees found."), {
          padding: 1,
          borderStyle: "round",
          borderColor: "yellow",
          margin: 1,
        })
      );
      return;
    }
    const { selected } = await inquirer.prompt([
      {
        type: "list",
        name: "selected",
        message: "Select worktree to remove:",
        choices: worktrees,
      },
    ]);
    try {
      await git.raw(["worktree", "remove", selected]);
      console.log(
        boxen(chalk.green(`✔ Worktree removed: ${selected}`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
    } catch (err) {
      console.log(
        boxen(chalk.red(`Error: ${err.message}`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
    return;
  }
}
