import boxen from "boxen";
import chalk from "chalk";
import Table from "cli-table3";
import simpleGit from "simple-git";
import history from "./history.js";
import { isGitRepo } from "./utils.js";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}
export default async function deleteBranch(branchArg) {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  const inquirer = await getInquirer();
  const git = simpleGit();
  try {
    const branchSummary = await git.branchLocal();
    const current = branchSummary.current;
    const branches = branchSummary.all.filter((b) => b !== current);

    // Show branch list as a table if interactive
    if (!branchArg) {
      const table = new Table({
        head: [chalk.cyan("Branch")],
        style: { head: [], border: [] },
        chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
      });
      branches.forEach((b) => {
        table.push([b]);
      });
      if (branches.length > 0) {
        console.log(
          boxen(table.toString(), {
            padding: 1,
            borderStyle: "round",
            borderColor: "cyan",
            margin: 1,
            title: "Deletable Branches",
            titleAlignment: "center",
          })
        );
      }
    }

    // If a branch name is provided as argument
    if (branchArg && typeof branchArg === "string") {
      const branch = branchArg.trim();
      if (!branches.includes(branch)) {
        console.log(
          boxen(
            chalk.red(
              `Branch '${branch}' does not exist or is the current branch.`
            ),
            {
              padding: 1,
              borderStyle: "round",
              borderColor: "red",
              margin: 1,
            }
          )
        );
        return;
      }
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: boxen(
            chalk.yellow(`Are you sure you want to delete branch '${branch}'?`),
            {
              padding: 1,
              borderStyle: "round",
              borderColor: "yellow",
              margin: 1,
            }
          ),
          default: false,
        },
      ]);
      if (!confirm) {
        console.log(
          boxen(chalk.blue("Delete branch cancelled."), {
            padding: 1,
            borderStyle: "round",
            borderColor: "blue",
            margin: 1,
          })
        );
        return;
      }
      await git.deleteLocalBranch(branch);
      // Record for undo
      let hash = null;
      try {
        const log = await git.log({ from: branch, to: branch, n: 1 });
        hash = log.latest ? log.latest.hash : null;
      } catch {}
      if (hash) {
        history.addAction({ type: "branch-delete", branch: branch, hash });
      }
      console.log(
        boxen(chalk.green(`✔ Branch '${branch}' deleted.`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
      return;
    }

    // Interactive mode if no branch argument
    if (branches.length === 0) {
      console.log(
        boxen(
          chalk.yellow("No branches to delete (cannot delete current branch)."),
          {
            padding: 1,
            borderStyle: "round",
            borderColor: "yellow",
            margin: 1,
          }
        )
      );
      return;
    }
    const { branch } = await inquirer.prompt([
      {
        type: "list",
        name: "branch",
        message: "Select a branch to delete:",
        choices: branches,
      },
    ]);
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: boxen(
          chalk.yellow(`Are you sure you want to delete branch '${branch}'?`),
          {
            padding: 1,
            borderStyle: "round",
            borderColor: "yellow",
            margin: 1,
          }
        ),
        default: false,
      },
    ]);
    if (!confirm) {
      console.log(
        boxen(chalk.blue("Delete branch cancelled."), {
          padding: 1,
          borderStyle: "round",
          borderColor: "blue",
          margin: 1,
        })
      );
      return;
    }
    await git.deleteLocalBranch(branch);
    // Record for undo
    let hash = null;
    try {
      const log = await git.log({ from: branch, to: branch, n: 1 });
      hash = log.latest ? log.latest.hash : null;
    } catch {}
    if (hash) {
      history.addAction({ type: "branch-delete", branch: branch, hash });
    }
    console.log(
      boxen(chalk.green(`✔ Branch '${branch}' deleted.`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
  } catch (err) {
    console.error(
      boxen(chalk.red("Error deleting branch: ") + err.message, {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
  }
}
