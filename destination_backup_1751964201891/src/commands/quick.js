import chalk from "chalk";
import figlet from "figlet";
import simpleGit from "simple-git";
import history from "./history.js";
import redoCmd from "./redo.js";
import { isGitRepo } from "./utils.js";

// Import commands
import bisectCmd from "./bisect.js";
import branchCmd from "./branch.js";
import cherryPickCmd from "./cherry-pick.js";
import logCmd from "./log.js";
import pushCmd from "./push.js";
import rebaseCmd from "./rebase.js";
import saveCmd from "./save.js";
import stashCmd from "./stash.js";
import statusCmd from "./status.js";
import undoCmd from "./undo.js";
// Placeholders for new features
// const redoCmd = require('./redo');
// const cherryPickCmd = require('./cherry-pick');
// const rebaseCmd = require('./rebase');
// const bisectCmd = require('./bisect');
// const tagCmd = require('./tag');

let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}

export default async function quick() {
  if (!isGitRepo()) {
    console.error(
      "\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m"
    );
    process.exit(1);
  }
  const git = simpleGit();
  const status = await git.status();
  const log = await git.log({ n: 1 });
  const stashes = await git.stashList();
  const branches = await git.branch();

  // Banner
  const banner = chalk.cyan(
    figlet.textSync("GitMat", { horizontalLayout: "default", width: 60 })
  );
  console.log(banner);

  // Build context-aware menu
  const actions = [{ name: "Status (view repo status)", value: "status" }];
  if (
    status.staged.length > 0 ||
    status.modified.length > 0 ||
    status.not_added.length > 0
  ) {
    actions.push({ name: "Save (stage & commit all changes)", value: "save" });
  }
  if (status.ahead > 0) {
    actions.push({ name: "Push (upload commits to remote)", value: "push" });
  }
  actions.push(
    { name: "Branch (switch/create/delete branches)", value: "branch" },
    { name: "Log (view commit history)", value: "log" },
    { name: "Stash (manage stashes)", value: "stash" }
  );
  if (log.total && log.total > 0) {
    if (history.getLastAction()) {
      actions.push({
        name: "Undo (restore last deleted branch/tag or undo last commit)",
        value: "undo",
      });
    }
    if (history.getLastUndone()) {
      actions.push({
        name: "Redo (re-delete last restored branch/tag)",
        value: "redo",
      });
    }
    actions.push({
      name: "Cherry-pick (apply commit from another branch)",
      value: "cherry-pick",
    });
  }
  if (branches && branches.all && branches.all.length > 1) {
    actions.push({
      name: "Rebase (onto branch or interactive)",
      value: "rebase",
    });
  }
  if (branches && branches.all && branches.all.length > 1) {
    actions.push({
      name: "Bisect (find commit that introduced a bug)",
      value: "bisect",
    });
  }
  // Future: add redo, cherry-pick, rebase, bisect, tag
  // actions.push({ name: 'Redo (revert last undo)', value: 'redo' });
  // actions.push({ name: 'Cherry-pick (apply commit from another branch)', value: 'cherry-pick' });
  // actions.push({ name: 'Rebase (reapply commits on top of another base)', value: 'rebase' });
  // actions.push({ name: 'Bisect (find commit that introduced a bug)', value: 'bisect' });
  // actions.push({ name: 'Tag (manage tags)', value: 'tag' });
  actions.push({ name: "Exit (select and press Enter)", value: "exit" });

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message:
        "Quick Menu: What would you like to do?\n(Use arrow keys to select, Enter to confirm, Ctrl+C to quit.)",
      choices: actions,
      pageSize: 12,
    },
  ]);

  if (action === "status") {
    await statusCmd();
  } else if (action === "save") {
    const { message } = await inquirer.prompt([
      {
        type: "input",
        name: "message",
        message: "Enter a commit message:",
        default: "savepoint",
      },
    ]);
    await saveCmd(message);
  } else if (action === "push") {
    await pushCmd();
  } else if (action === "branch") {
    await branchCmd();
  } else if (action === "log") {
    await logCmd();
  } else if (action === "stash") {
    await stashCmd();
  } else if (action === "undo") {
    await undoCmd();
  } else if (action === "redo") {
    await redoCmd();
  } else if (action === "cherry-pick") {
    await cherryPickCmd();
  } else if (action === "rebase") {
    await rebaseCmd();
  } else if (action === "bisect") {
    await bisectCmd();
  } else {
    return;
  }
}
