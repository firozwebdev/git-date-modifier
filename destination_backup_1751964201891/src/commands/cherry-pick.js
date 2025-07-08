import boxen from "boxen";
import chalk from "chalk";
import ora from "ora";
import simpleGit from "simple-git";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}
export default async function cherryPick() {
  const git = simpleGit();
  let log;
  try {
    log = await git.log({ n: 30 }); // Show last 30 commits
  } catch (err) {
    console.error(
      boxen(chalk.red("Error reading git log: ") + err.message, {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
    return;
  }
  const choices = log.all.map((c) => ({
    name: `${chalk.yellow(c.hash.substr(0, 7))} ${chalk.green(
      c.author_name
    )}: ${chalk.white(c.message)}`,
    value: c.hash,
  }));
  const { picks } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "picks",
      message: "Select commit(s) to cherry-pick:",
      choices,
      pageSize: 15,
      validate: (arr) => arr.length > 0 || "Select at least one commit.",
    },
  ]);
  if (!picks || picks.length === 0) return;
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Cherry-pick ${picks.length} commit(s)?`,
      default: true,
    },
  ]);
  if (!confirm) return;
  let results = "";
  for (const hash of picks) {
    const spinner = ora({
      text: `Cherry-picking ${hash.substr(0, 7)}...`,
      color: "cyan",
    }).start();
    try {
      await git.raw(["cherry-pick", hash]);
      spinner.succeed(`Cherry-picked ${hash.substr(0, 7)}`);
      results += chalk.green(`\u2714 Cherry-picked ${hash.substr(0, 7)}\n`);
    } catch (err) {
      spinner.fail(`Failed to cherry-pick ${hash.substr(0, 7)}`);
      results += chalk.red(
        `\u2717 Failed to cherry-pick ${hash.substr(0, 7)}: ${err.message}\n`
      );
      break; // Stop on first failure
    }
  }
  console.log(
    boxen(results, {
      padding: 1,
      borderStyle: "round",
      borderColor: "cyan",
      margin: 1,
      title: "Cherry-pick Results",
      titleAlignment: "center",
    })
  );
}
