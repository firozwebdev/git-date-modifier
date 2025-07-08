import boxen from "boxen";
import chalk from "chalk";
import Table from "cli-table3";
import simpleGit from "simple-git";
import { isGitRepo } from "./utils.js";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}
export default async function logViewer(options = {}, parentMenu) {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  inquirer = await getInquirer();
  const git = simpleGit();
  let log;
  const chalkBox = (msg, color = "cyan", title = "", borderColor = "cyan") =>
    boxen(msg, {
      padding: 1,
      borderStyle: "round",
      borderColor,
      margin: 1,
      title,
      titleAlignment: "center",
    });

  // Handle new modes
  if (options && options.mode) {
    let cmd = ["log"];
    if (options.mode === "oneline") cmd.push("--oneline");
    else if (options.mode === "graph")
      cmd.push("--oneline", "--graph", "--all");
    else if (options.mode === "file" && options.filename)
      cmd.push(options.filename);
    else if (options.mode === "since" && options.time)
      cmd.push(`--since=\"${options.time}\"`);
    else if (options.mode === "author" && options.author)
      cmd.push(`--author=\"${options.author}\"`);
    else if (options.mode === "name-only") cmd.push("--name-only");
    else if (options.mode === "diff") cmd.push("-p");
    else if (options.mode === "limit" && options.n)
      cmd.push(`-n`, String(options.n));
    else if (options.mode === "format" && options.format)
      cmd.push(`--pretty=format:${options.format}`);
    else cmd = null;
    if (cmd) {
      try {
        const { stdout } = await git.raw(cmd);
        console.log(
          chalkBox(
            chalk.white(stdout.length ? stdout : "No log output."),
            "cyan",
            "Git Log",
            "cyan"
          )
        );
      } catch (err) {
        console.error(
          chalkBox(
            chalk.red("Error running git log: ") + err.message,
            "red",
            "Error",
            "red"
          )
        );
      }
      return;
    }
  }

  try {
    log = await git.log({ n: 50 }); // Fetch up to 50 commits
  } catch (err) {
    let msg;
    if (err.message && err.message.includes("does not have any commits yet")) {
      msg = chalk.yellow("This repository has no commits yet.");
    } else {
      msg = chalk.red("Error reading git log: ") + err.message;
    }
    console.error(
      chalkBox(
        msg,
        err.message && err.message.includes("does not have any commits yet") ? "yellow" : "red",
        err.message && err.message.includes("does not have any commits yet") ? "Info" : "Error",
        err.message && err.message.includes("does not have any commits yet") ? "yellow" : "red"
      )
    );
    if (parentMenu) await parentMenu();
    return;
  }

  const commits = log.all;
  const pageSize = 10;
  let page = 0;
  let exit = false;

  while (!exit) {
    const start = page * pageSize;
    const end = Math.min(start + pageSize, commits.length);
    const table = new Table({
      head: [
        chalk.cyan("Index"),
        chalk.cyan("Hash"),
        chalk.cyan("Author"),
        chalk.cyan("Date"),
        chalk.cyan("Message"),
      ],
      style: { head: [], border: [] },
      chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
    });
    for (let i = start; i < end; i++) {
      const c = commits[i];
      table.push([
        chalk.yellow(i + 1),
        chalk.white(c.hash.substr(0, 7)),
        chalk.green(c.author_name),
        chalk.gray(new Date(c.date).toLocaleString()),
        chalk.white(c.message),
      ]);
    }
    console.log(
      chalkBox(
        table.toString(),
        "cyan",
        `Git Log [${start + 1}-${end} of ${commits.length}]`,
        "cyan"
      )
    );

    const choices = [];
    if (page > 0) choices.push({ name: "Previous page", value: "prev" });
    if (end < commits.length)
      choices.push({ name: "Next page", value: "next" });
    for (let i = start; i < end; i++) {
      choices.push({
        name: `View details for #${i + 1} (${commits[i].hash.substr(0, 7)})`,
        value: i,
      });
    }
    choices.push({ name: "Back", value: "back" });
    choices.push({ name: "Exit (select and press Enter)", value: "exit" });

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message:
          "Select an action: (Use arrow keys to select, Enter to confirm, Back to return, Ctrl+C to quit.)",
        choices,
        pageSize: 15,
      },
    ]);

    if (action === "next") {
      page++;
    } else if (action === "prev") {
      page--;
    } else if (action === "exit") {
      exit = true;
    } else if (action === "back") {
      if (parentMenu) await parentMenu();
      return;
    } else if (typeof action === "number") {
      const c = commits[action];
      let msg = "";
      msg += chalk.yellow("Commit: ") + chalk.white(c.hash) + "\n";
      msg +=
        chalk.yellow("Author: ") +
        chalk.green(c.author_name) +
        " <" +
        chalk.green(c.author_email) +
        ">\n";
      msg +=
        chalk.yellow("Date: ") +
        chalk.gray(new Date(c.date).toLocaleString()) +
        "\n";
      msg += chalk.yellow("Message: ") + chalk.white(c.message) + "\n";
      msg += chalk.yellow("Refs: ") + chalk.cyan(c.refs || "-") + "\n";
      // Show diff for this commit
      try {
        const { stdout } = await git.raw(["show", "--stat", "--color", c.hash]);
        msg += "\n" + chalk.white(stdout);
      } catch (err) {
        msg += "\n" + chalk.red("Error loading diff: ") + err.message;
      }
      console.log(
        chalkBox(msg, "magenta", `Commit Details #${action + 1}`, "magenta")
      );
      // Wait for user to continue or go back
      const { cont } = await inquirer.prompt([
        {
          type: "list",
          name: "cont",
          message: "Press Enter to return to log, or Back to return to previous menu:",
          choices: [
            { name: "Back", value: "back" },
            { name: "Return to log", value: "log" },
          ],
        },
      ]);
      if (cont === "back") {
        if (parentMenu) await parentMenu();
        return;
      }
      // Otherwise, just return to log view
    }
  }
  if (parentMenu) await parentMenu();
}
