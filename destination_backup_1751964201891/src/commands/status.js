import boxen from "boxen";
import chalk from "chalk";
import figlet from "figlet";
import simpleGit from "simple-git";
import history from "./history.js";
import { isGitRepo } from "./utils.js";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}
// Use dynamic import for command modules to avoid hoisting/circular issues
async function getSaveCmd() {
  return (await import("./save.js")).default;
}
async function getPushCmd() {
  return (await import("./push.js")).default;
}
async function getLogCmd() {
  return (await import("./log.js")).default;
}
async function getUndoCmd() {
  return (await import("./undo.js")).default;
}

export default async function status() {
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
  const prettyMs = (await import("pretty-ms")).default;
  const git = simpleGit();
  const gitStatus = await git.status();
  let log;
  try {
    log = await git.log({ n: 10 }); // Fetch more commits for context
  } catch (e) {
    log = { latest: null, total: 0, all: [] };
  }
  const stashes = await git.stashList();
  const remotes = await git.getRemotes(true);

  // Banner
  const banner = chalk.cyan(
    figlet.textSync("GitMat", { horizontalLayout: "default", width: 60 })
  );

  let output = "";
  // Branch and remote tracking
  output += chalk.blue("On branch: ") + chalk.white(gitStatus.current);
  if (gitStatus.tracking) {
    output += chalk.gray(` (tracking ${gitStatus.tracking})`);
  }
  output += "\n";
  output +=
    chalk.yellow(`Ahead: ${gitStatus.ahead}, Behind: ${gitStatus.behind}`) +
    "\n";

  // Last commit info
  if (log.latest) {
    const c = log.latest;
    const timeAgo = c.date
      ? ` (${prettyMs(Date.now() - new Date(c.date), { compact: true })} ago)`
      : "";
    output +=
      chalk.magenta("Last commit: ") +
      chalk.white(c.hash.substr(0, 7)) +
      chalk.gray(" by ") +
      chalk.green(c.author_name) +
      chalk.gray(" - ") +
      chalk.white(c.message) +
      chalk.gray(timeAgo) +
      "\n";
  }

  // Staged files
  if (gitStatus.staged.length > 0) {
    output +=
      chalk.green("Staged files: ") + gitStatus.staged.join(", ") + "\n";
  } else {
    output += chalk.green("Staged files: ") + "None\n";
  }
  // Changed files
  if (gitStatus.modified.length > 0) {
    output +=
      chalk.red("Changed files: ") + gitStatus.modified.join(", ") + "\n";
  } else {
    output += chalk.red("Changed files: ") + "None\n";
  }
  // Untracked files
  if (gitStatus.not_added.length > 0) {
    output +=
      chalk.yellow("Untracked files: ") + gitStatus.not_added.join(", ") + "\n";
  } else {
    output += chalk.yellow("Untracked files: ") + "None\n";
  }
  // Stash count
  output += chalk.cyan("Stashes: ") + stashes.all.length + "\n";

  // Clean/dirty indicator
  if (
    gitStatus.staged.length === 0 &&
    gitStatus.modified.length === 0 &&
    gitStatus.not_added.length === 0
  ) {
    output += chalk.green("✔ Working directory clean\n");
  } else {
    output += chalk.red("✗ You have changes\n");
  }

  // Context-aware next actions
  let next = [];

  // Staged files
  if (gitStatus.staged.length > 0) {
    next.push({ name: "Commit staged files", value: "save" });
    next.push({ name: "Unstage files", value: "unstage" });
    next.push({
      name: "Discard staged changes (reset)",
      value: "reset-staged",
    });
  }
  // Modified (unstaged) files
  if (gitStatus.modified.length > 0) {
    next.push({ name: "Stage all changes", value: "stage-all" });
    next.push({ name: "Discard changes in files", value: "discard-changes" });
  }
  // Untracked files
  if (gitStatus.not_added.length > 0) {
    next.push({ name: "Add untracked files", value: "add-untracked" });
    next.push({ name: "Ignore file(s) (.gitignore)", value: "ignore-files" });
    next.push({
      name: "Remove untracked files (clean)",
      value: "clean-untracked",
    });
  }
  // Stashes
  if (stashes.all.length > 0) {
    next.push({ name: "Apply latest stash", value: "apply-stash" });
    next.push({
      name: "Manage stashes (list/apply/drop)",
      value: "manage-stash",
    });
  }
  // Commits ahead/behind
  if (gitStatus.ahead > 0) {
    next.push({ name: "Push commits", value: "push" });
    next.push({ name: "Push all branches", value: "push-all" });
  }
  if (gitStatus.behind > 0) {
    next.push({ name: "Pull/fetch changes", value: "pull" });
  }
  // Branches
  const branchSummary = await git.branchLocal();
  if (branchSummary.all.length > 1) {
    next.push({ name: "Switch branch", value: "switch-branch" });
    next.push({ name: "Create new branch", value: "create-branch" });
    next.push({ name: "Delete branch", value: "delete-branch" });
    next.push({ name: "Merge branch", value: "merge-branch" });
  } else {
    next.push({ name: "Create new branch", value: "create-branch" });
  }
  // Undo/Redo
  const lastAction = history.getLastAction();
  if (lastAction || (log.total && log.total > 1)) {
    next.push({
      name: "Undo (soft reset last commit or tracked action)",
      value: "undo",
    });
  }
  // Log and status always available
  next.push({ name: "View log (commit history)", value: "log" });
  next.push({ name: "Show status", value: "status" });
  next.push({ name: "Exit (select and press Enter)", value: "exit" });

  // Add a nice box around the output
  const boxed = boxen(output, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "cyan",
    title: "GitMat Status",
    titleAlignment: "center",
  });

  console.log(banner + "\n" + boxed);

  // Interactive next actions
  if (next.length > 0) {
    const inquirer = await getInquirer();
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message:
          "What would you like to do next?\n(Use arrow keys to select, Enter to confirm, Ctrl+C to quit.)",
        choices: next,
        loop: false,
        pageSize: 12,
      },
    ]);
    if (action === "save") {
      const { message } = await (
        await getInquirer()
      ).prompt([
        {
          type: "input",
          name: "message",
          message: "Enter a commit message:",
          default: "savepoint",
        },
      ]);
      await (
        await getSaveCmd()
      )(message);
    } else if (action === "unstage") {
      // Interactive unstage
      const { file } = await inquirer.prompt([
        {
          type: "input",
          name: "file",
          message: "Enter the file to unstage (or leave blank to go back):",
        },
      ]);
      if (!file) return await status();
      const unstageCmd = (await import("./unstage.js")).default;
      await unstageCmd(file);
      return await status();
    } else if (action === "reset-staged") {
      // Discard all staged changes
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message:
            "Are you sure you want to discard all staged changes? This cannot be undone!",
          default: false,
        },
      ]);
      if (!confirm) return await status();
      const resetHardCmd = (await import("./reset-hard.js")).default;
      await resetHardCmd();
      return await status();
    } else if (action === "stage-all") {
      // Stage all changes
      await git.add(".");
      console.log(
        boxen(chalk.green("✔ All changes staged."), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
      return await status();
    } else if (action === "discard-changes") {
      // Discard all unstaged changes
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message:
            "Are you sure you want to discard all unstaged changes? This cannot be undone!",
          default: false,
        },
      ]);
      if (!confirm) return await status();
      await git.checkout(["--", "."]);
      console.log(
        boxen(chalk.green("✔ All unstaged changes discarded."), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
      return await status();
    } else if (action === "add-untracked") {
      // Add all untracked files
      await git.add(gitStatus.not_added);
      console.log(
        boxen(chalk.green("✔ Untracked files added."), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
      return await status();
    } else if (action === "ignore-files") {
      // Open rc-edit for .gitignore
      const rcEditCmd = (await import("./rc-edit.js")).default;
      await rcEditCmd();
      return await status();
    } else if (action === "clean-untracked") {
      // Remove untracked files
      const cleanCmd = (await import("./clean.js")).default;
      await cleanCmd();
      return await status();
    } else if (action === "apply-stash") {
      // Apply latest stash
      if (stashes.all.length > 0) {
        await git.stash(["pop"]);
        console.log(
          boxen(chalk.green("✔ Latest stash applied."), {
            padding: 1,
            borderStyle: "round",
            borderColor: "green",
            margin: 1,
          })
        );
      }
      return await status();
    } else if (action === "manage-stash") {
      // Open stash manager
      const stashCmd = (await import("./stash.js")).default;
      await stashCmd();
      return await status();
    } else if (action === "push") {
      await (
        await getPushCmd()
      )();
      return await status();
    } else if (action === "push-all") {
      const psaCmd = (await import("./psa.js")).default;
      await psaCmd();
      return await status();
    } else if (action === "pull") {
      const fetchCmd = (await import("./fetch.js")).default;
      await fetchCmd();
      return await status();
    } else if (action === "switch-branch") {
      const branchCmd = (await import("./branch.js")).default;
      await branchCmd();
      return await status();
    } else if (action === "create-branch") {
      const branchCmd = (await import("./branch.js")).default;
      await branchCmd();
      return await status();
    } else if (action === "delete-branch") {
      const deleteBranchCmd = (await import("./delete-branch.js")).default;
      await deleteBranchCmd();
      return await status();
    } else if (action === "merge-branch") {
      const mergeCmd = (await import("./merge.js")).default;
      await mergeCmd();
      return await status();
    } else if (action === "undo") {
      await (
        await getUndoCmd()
      )();
      return await status();
    } else if (action === "log") {
      const logCmd = await getLogCmd();
      await logCmd({}, status);
      return await status();
    } else if (action === "status") {
      return await status();
    } else {
      // Exit
      return;
    }
  }
}
