import boxen from "boxen";
import chalk from "chalk";
import ora from "ora";
import simpleGit from "simple-git";
import history from "./history.js";
import { isGitRepo } from "./utils.js";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}
async function getHistory() {
  if (!history) history = (await import("./history.js")).default;
  return history;
}
export default async function mergeCommand(targetBranch) {
  if (!isGitRepo()) {
    console.error(
      boxen(
        chalk.red.bold(
          "Error: Not a git repository.\nPlease run this command inside a git project."
        ),
        {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
          title: "GitMat Error",
          titleAlignment: "center",
        }
      )
    );
    process.exit(1);
  }
  const git = simpleGit();
  const inquirer = await getInquirer();
  const history = await getHistory();
  // Get current branch
  const status = await git.status();
  const currentBranch = status.current;
  // Get list of branches
  const branches = (await git.branch()).all.filter((b) => b !== currentBranch);
  let branch = targetBranch;
  if (!branch) {
    const { selected } = await inquirer.prompt([
      {
        type: "list",
        name: "selected",
        message:
          "Select branch to merge: (Use arrow keys, Enter to select, Ctrl+C to cancel)",
        choices: branches,
      },
    ]);
    branch = selected;
    if (!branch) return; // User cancelled
  }
  // Show merge summary
  let behind;
  try {
    // Only count commits in target branch not in current branch
    const countStr = await git.raw([
      "rev-list",
      "--count",
      `^${currentBranch}`,
      branch,
    ]);
    behind = parseInt(countStr.trim(), 10) || 0;
  } catch (e) {
    behind = 0;
  }
  console.log(
    boxen(
      chalk.cyan(
        `Merging '${branch}' into '${currentBranch}'\nCommits to merge: ${behind}`
      ),
      { padding: 1, borderStyle: "round", borderColor: "cyan", margin: 1 }
    )
  );

  if (behind === 0) {
    console.log(
      boxen(chalk.green("Already up to date. No merge necessary."), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
    return;
  }
  // Save pre-merge HEAD for undo
  const preMergeHead = await git.raw(["rev-parse", "HEAD"]);
  // Confirm merge
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Proceed with merge?`,
      default: true,
    },
  ]);
  if (!confirm) return;
  const spinner = ora({
    text: `Merging '${branch}' into '${currentBranch}'...`,
    color: "cyan",
  }).start();
  try {
    await git.merge([branch]);
    history.addAction({
      type: "merge",
      branch,
      preMergeHead: preMergeHead.trim(),
    });
    spinner.succeed(`✔ Merged '${branch}' into '${currentBranch}'`);
  } catch (err) {
    spinner.fail("Merge failed");
    // Handle conflicts
    const mergeStatus = await git.status();
    if (mergeStatus.conflicted.length > 0) {
      console.log(
        boxen(
          chalk.red(
            `Merge conflict detected!\nConflicted files: ${mergeStatus.conflicted.join(
              ", "
            )}`
          ),
          { padding: 1, borderStyle: "round", borderColor: "red", margin: 1 }
        )
      );
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "Resolve conflict:",
          choices: [
            { name: "Abort merge", value: "abort" },
            {
              name: "I have resolved the conflicts manually. Continue.",
              value: "continue",
            },
          ],
        },
      ]);
      if (action === "abort") {
        const abortSpinner = ora({
          text: "Aborting merge...",
          color: "yellow",
        }).start();
        try {
          await git.merge(["--abort"]);
          abortSpinner.succeed("Merge aborted.");
        } catch (abortErr) {
          abortSpinner.fail("Failed to abort merge.");
          console.error(abortErr);
        }
      } else {
        console.log(
          boxen(
            chalk.yellow(
              "Please add resolved files and commit them to finalize the merge."
            ),
            {
              padding: 1,
              borderStyle: "round",
              borderColor: "yellow",
              margin: 1,
            }
          )
        );
      }
    } else {
      console.error(
        boxen(chalk.red(err.message), {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
  }
}
