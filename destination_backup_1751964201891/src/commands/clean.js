import boxen from "boxen";
import chalk from "chalk";
import cliProgress from "cli-progress";
import simpleGit from "simple-git";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}
export default async function cleanCommand() {
  inquirer = await getInquirer();
  const git = simpleGit();
  let status;
  try {
    status = await git.status();
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
  const untracked = status.not_added;
  if (!untracked.length) {
    console.log(
      boxen(chalk.green("No untracked files to clean."), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
    return;
  }
  console.log(
    boxen(chalk.yellow("Untracked files:"), {
      padding: 1,
      borderStyle: "round",
      borderColor: "yellow",
      margin: 1,
    })
  );
  untracked.forEach((f) => console.log(chalk.white(f)));

  const { dryRun } = await inquirer.prompt([
    {
      type: "confirm",
      name: "dryRun",
      message: "Do a dry run first (show what would be deleted)?",
      default: true,
    },
  ]);
  if (dryRun) {
    try {
      const { stdout } = await git.raw(["clean", "-nd"]);
      console.log(
        boxen(chalk.cyan("Dry run result:"), {
          padding: 1,
          borderStyle: "round",
          borderColor: "cyan",
          margin: 1,
        })
      );
      console.log(stdout);
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
  }
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Delete all untracked files? This cannot be undone!",
      default: false,
    },
  ]);
  if (!confirm) {
    console.log(
      boxen(chalk.yellow("Clean cancelled."), {
        padding: 1,
        borderStyle: "round",
        borderColor: "yellow",
        margin: 1,
      })
    );
    return;
  }
  // Progress bar for file deletion
  const bar = new cliProgress.SingleBar({
    format: `${chalk.cyan(
      "Cleaning"
    )} |{bar}| {percentage}% || {value}/{total} files deleted`,
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  });
  bar.start(untracked.length, 0);
  let deletedCount = 0;
  try {
    // Delete each file individually to show progress
    for (const file of untracked) {
      await git.raw(["clean", "-f", file]);
      deletedCount++;
      bar.update(deletedCount);
    }
    bar.stop();
    console.log(
      boxen(chalk.green("✔ Untracked files deleted."), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
  } catch (err) {
    bar.stop();
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
