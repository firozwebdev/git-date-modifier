import boxen from "boxen";
import chalk from "chalk";
import simpleGit from "simple-git";
import history from "./history.js";
import { isGitRepo } from "./utils.js";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}
export default async function stash() {
  if (!isGitRepo()) {
    console.error(
      "\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m"
    );
    process.exit(1);
  }
  const git = simpleGit();
  inquirer = await getInquirer();

  // Main menu
  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: boxen(
          chalk.cyan("Stash Management - What would you like to do?"),
          {
            padding: 1,
            borderStyle: "round",
            borderColor: "cyan",
            margin: 1,
            title: "GitMat Stash",
            titleAlignment: "center",
          }
        ),
        choices: [
          { name: "Create new stash", value: "create" },
          { name: "List/apply/drop stashes", value: "list" },
          { name: "⬅ Back", value: "back" },
          { name: "Exit", value: "exit" },
        ],
      },
    ]);

    if (action === "exit" || action === "back") return;

    if (action === "create") {
      const { message } = await inquirer.prompt([
        {
          type: "input",
          name: "message",
          message: "Enter a description for this stash:",
          default: "WIP",
        },
      ]);
      await createStash(message);
      continue;
    }

    // List stashes
    const stashes = await git.stashList();
    if (!stashes.all.length) {
      console.log(
        boxen(chalk.yellow("No stashes found."), {
          padding: 1,
          borderStyle: "round",
          borderColor: "yellow",
          margin: 1,
        })
      );
      continue;
    }

    // Show stashes in a table
    const Table = (await import("cli-table3")).default;
    const table = new Table({
      head: [chalk.cyan("Index"), chalk.cyan("Message")],
      style: { head: [], border: [] },
      chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
    });
    stashes.all.forEach((stash, idx) => {
      table.push([chalk.white(idx), chalk.white(stash.message)]);
    });
    console.log(
      boxen(table.toString(), {
        padding: 1,
        borderStyle: "round",
        borderColor: "cyan",
        margin: 1,
        title: "Stash List",
        titleAlignment: "center",
      })
    );

    // Select a stash to act on
    const { selectedIdx } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedIdx",
        message: "Select a stash to manage:",
        choices: [
          ...stashes.all.map((stash, idx) => ({
            name: `${idx}: ${stash.message}`,
            value: idx,
          })),
          { name: "⬅ Back", value: "back" },
        ],
      },
    ]);
    if (selectedIdx === "back") continue;

    const { stashAction } = await inquirer.prompt([
      {
        type: "list",
        name: "stashAction",
        message: "What do you want to do with this stash?",
        choices: [
          { name: "Apply (pop) this stash", value: "apply" },
          { name: "Drop (delete) this stash", value: "drop" },
          { name: "View details", value: "view" },
          { name: "⬅ Back", value: "back" },
          { name: "Cancel", value: "cancel" },
        ],
      },
    ]);
    if (stashAction === "back" || stashAction === "cancel") continue;

    const ref = `stash@{${selectedIdx}}`;

    if (stashAction === "apply") {
      try {
        // Get patch and message before popping
        const patch = (await git.raw(["stash", "show", "-p", ref])).toString();
        const message = stashes.all[selectedIdx].message;
        await git.stash(["pop", ref]);
        history.addAction({
          type: "stash-pop",
          index: selectedIdx,
          message,
          patch,
        });
        console.log(
          boxen(chalk.green(`✔ Applied and removed ${ref}`), {
            padding: 1,
            borderStyle: "round",
            borderColor: "green",
            margin: 1,
          })
        );
      } catch (err) {
        console.error(
          boxen(chalk.red("Error applying stash: ") + err.message, {
            padding: 1,
            borderStyle: "round",
            borderColor: "red",
            margin: 1,
          })
        );
      }
    } else if (stashAction === "drop") {
      try {
        // Get patch and message before dropping
        const patch = (await git.raw(["stash", "show", "-p", ref])).toString();
        const message = stashes.all[selectedIdx].message;
        await git.stash(["drop", ref]);
        history.addAction({
          type: "stash-drop",
          index: selectedIdx,
          message,
          patch,
        });
        console.log(
          boxen(chalk.green(`✔ Dropped ${ref}`), {
            padding: 1,
            borderStyle: "round",
            borderColor: "green",
            margin: 1,
          })
        );
      } catch (err) {
        console.error(
          boxen(chalk.red("Error dropping stash: ") + err.message, {
            padding: 1,
            borderStyle: "round",
            borderColor: "red",
            margin: 1,
          })
        );
      }
    } else if (stashAction === "view") {
      // Show details (git stash show -p)
      try {
        const { stdout } = await git.raw(["stash", "show", "-p", ref]);
        console.log(
          boxen(chalk.white(stdout || "No diff available."), {
            padding: 1,
            borderStyle: "round",
            borderColor: "cyan",
            margin: 1,
            title: `Details for ${ref}`,
            titleAlignment: "center",
          })
        );
      } catch (err) {
        console.error(
          boxen(chalk.red("Error showing stash: ") + err.message, {
            padding: 1,
            borderStyle: "round",
            borderColor: "red",
            margin: 1,
          })
        );
      }
    }
  }
}

async function createStash(message) {
  const git = simpleGit();
  try {
    const result = await git.stash(["push", "-m", message]);
    // Get the latest stash ref
    const { stdout } = await git.raw(["stash", "list"]);
    const ref = stdout.split("\n")[0].split(":")[0];
    history.addAction({ type: "stash-create", ref, message });
    console.log(
      boxen(chalk.green("✔ Stashed changes: " + message), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
  } catch (err) {
    console.error(
      boxen(chalk.red("Error creating stash: ") + err.message, {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
  }
}
