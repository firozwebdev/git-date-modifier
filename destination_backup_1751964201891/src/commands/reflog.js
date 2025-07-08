const simpleGit = require("simple-git");
const chalk = require("chalk");
const boxen = require("boxen");
const inquirer = require("inquirer");
const { isGitRepo } = require("./utils.js");

module.exports = async function reflogCommand() {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  const git = simpleGit();
  let reflog;
  try {
    reflog = await git.raw(["reflog"]);
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
  const entries = reflog
    .trim()
    .split("\n")
    .map((line, idx) => {
      const match = line.match(/([a-f0-9]{7,})\s+\(([^)]+)\)\s(.+)/);
      if (match) {
        return { idx, hash: match[1], ref: match[2], msg: match[3], raw: line };
      } else {
        return { idx, hash: null, ref: null, msg: line, raw: line };
      }
    });
  const pageSize = 15;
  let page = 0;
  const totalPages = Math.ceil(entries.length / pageSize);
  while (true) {
    console.clear();
    console.log(
      boxen(chalk.blue(`Git Reflog (Page ${page + 1}/${totalPages})`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "blue",
        margin: 1,
      })
    );
    for (
      let i = page * pageSize;
      i < Math.min((page + 1) * pageSize, entries.length);
      i++
    ) {
      const e = entries[i];
      console.log(
        chalk.yellow(`#${e.idx}`) +
          " " +
          chalk.green(e.hash || "-") +
          " " +
          chalk.cyan(e.ref || "") +
          " | " +
          chalk.white(e.msg)
      );
    }
    const { nav } = await inquirer.prompt([
      {
        type: "list",
        name: "nav",
        message: "Navigation:",
        choices: [
          {
            name: "Next page",
            value: "next",
            disabled: page >= totalPages - 1,
          },
          { name: "Previous page", value: "prev", disabled: page === 0 },
          { name: "Checkout entry", value: "checkout" },
          { name: "Reset --hard to entry", value: "reset" },
          { name: "Exit", value: "exit" },
        ],
      },
    ]);
    if (nav === "next") page++;
    else if (nav === "prev") page--;
    else if (nav === "checkout" || nav === "reset") {
      const { idx } = await inquirer.prompt([
        {
          type: "input",
          name: "idx",
          message: `Enter entry # to ${nav}:`,
          validate: (v) => !isNaN(v) && v >= 0 && v < entries.length,
        },
      ]);
      const entry = entries[parseInt(idx, 10)];
      if (!entry.hash) {
        console.log(
          boxen(chalk.red("Invalid entry."), {
            padding: 1,
            borderStyle: "round",
            borderColor: "red",
            margin: 1,
          })
        );
        continue;
      }
      if (nav === "checkout") {
        await git.checkout(entry.hash);
        console.log(
          boxen(chalk.green(`✔ Checked out ${entry.hash}`), {
            padding: 1,
            borderStyle: "round",
            borderColor: "green",
            margin: 1,
          })
        );
        break;
      } else if (nav === "reset") {
        await git.raw(["reset", "--hard", entry.hash]);
        console.log(
          boxen(chalk.green(`✔ Reset --hard to ${entry.hash}`), {
            padding: 1,
            borderStyle: "round",
            borderColor: "green",
            margin: 1,
          })
        );
        break;
      }
    } else break;
  }
};
