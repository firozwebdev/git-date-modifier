import boxen from "boxen";
import chalk from "chalk";
import simpleGit from "simple-git";
import { isGitRepo } from "./utils.js";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}
export default async function notesCommand() {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  const git = simpleGit();
  inquirer = await getInquirer();
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Notes action:",
      choices: [
        { name: "Show notes", value: "show" },
        { name: "Add note", value: "add" },
        { name: "Edit note", value: "edit" },
        { name: "Remove note", value: "remove" },
        { name: "Exit", value: "exit" },
      ],
    },
  ]);
  if (action === "exit") return;

  // Helper: select commit
  async function selectCommit() {
    const log = await git.log({ n: 20 });
    const { commit } = await inquirer.prompt([
      {
        type: "list",
        name: "commit",
        message: "Select commit:",
        choices: log.all.map((c) => ({
          name: `${c.hash.slice(0, 8)} ${c.message}`,
          value: c.hash,
        })),
      },
    ]);
    return commit;
  }

  if (action === "show") {
    const commit = await selectCommit();
    try {
      const { stdout } = await git.raw(["notes", "show", commit]);
      console.log(
        boxen(chalk.cyan(stdout || "No note for this commit."), {
          padding: 1,
          borderStyle: "round",
          borderColor: "cyan",
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

  if (action === "add") {
    const commit = await selectCommit();
    const { note } = await inquirer.prompt([
      { type: "input", name: "note", message: "Enter note:" },
    ]);
    try {
      await git.raw(["notes", "add", "-m", note, commit]);
      console.log(
        boxen(chalk.green("✔ Note added."), {
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

  if (action === "edit") {
    const commit = await selectCommit();
    let current = "";
    try {
      const { stdout } = await git.raw(["notes", "show", commit]);
      current = stdout;
    } catch {}
    const { note } = await inquirer.prompt([
      { type: "input", name: "note", message: "Edit note:", default: current },
    ]);
    try {
      await git.raw(["notes", "add", "-f", "-m", note, commit]);
      console.log(
        boxen(chalk.green("✔ Note updated."), {
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
    const commit = await selectCommit();
    try {
      await git.raw(["notes", "remove", commit]);
      console.log(
        boxen(chalk.green("✔ Note removed."), {
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
