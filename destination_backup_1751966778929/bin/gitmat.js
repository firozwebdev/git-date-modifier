#!/usr/bin/env node

import boxen from "boxen";
import chalk from "chalk";
import { program } from "commander";
import figlet from "figlet";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

// Command imports (to be implemented)
import bisect from "../src/commands/bisect.js";
import branch from "../src/commands/branch.js";
import cherryPick from "../src/commands/cherry-pick.js";
import deleteBranch from "../src/commands/delete-branch.js";
import fetchCmd from "../src/commands/fetch.js";
import init from "../src/commands/init.js";
import logViewer from "../src/commands/log.js";
import merge from "../src/commands/merge.js";
import psa from "../src/commands/psa.js";
import psd from "../src/commands/psd.js";
import psf from "../src/commands/psf.js";
import psfl from "../src/commands/psfl.js";
import pst from "../src/commands/pst.js";
import push from "../src/commands/push.js";
import quick from "../src/commands/quick.js";
import rcEdit from "../src/commands/rc-edit.js";
import rebase from "../src/commands/rebase.js";
import remoteInit from "../src/commands/remote-init.js";
import resetHard from "../src/commands/reset-hard.js";
import resetRecover from "../src/commands/reset-recover.js";
import save from "../src/commands/save.js";
import smart from "../src/commands/smart.js";
import stash from "../src/commands/stash.js";
import status from "../src/commands/status.js";
import tag from "../src/commands/tag.js";
import undo from "../src/commands/undo.js";
import unstage from "../src/commands/unstage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8")
);

program
  .name("gitmat")
  .description("Your smart Git companion")
  .version(packageJson.version);

program
  .command("st")
  .description("Enhanced git status (banner, box, color)")
  .action(status);
program
  .command("status")
  .description("Enhanced git status (banner, box, color)")
  .action(status);

program
  .command("save [message]")
  .description(
    'Stage all changes and commit with the message (default: "savepoint")'
  )
  .action((message) => save(message));

program
  .command("undo")
  .description("Undo last commit (soft reset)")
  .action(undo);

program
  .command("branch")
  .description("Interactive branch switcher")
  .action(branch);

program
  .command("init")
  .description("Initialize a new git repository in the current directory")
  .action(init);

program
  .command("delete-branch")
  .description("Interactively delete a local branch (excluding current)")
  .action(deleteBranch);

program
  .command("db [branch]")
  .description(
    "Delete a local branch by name (with confirmation), or interactively if not specified"
  )
  .action((branch) => deleteBranch(branch));

program
  .command("del [branch]")
  .description(
    "Delete a local branch by name (with confirmation), or interactively if not specified"
  )
  .action((branch) => deleteBranch(branch));

program
  .command("br")
  .description("Interactive branch switcher (shortcut for branch)")
  .action(branch);

program
  .command("stash")
  .description("Interactive stash manager (create, list, apply, drop)")
  .action(stash);

program
  .command("smart")
  .description("Smart contextual actions based on repo state")
  .action(smart);

program
  .command("ps [remote] [branch]")
  .description(
    "Push current branch to remote, or specify remote and branch (e.g., gmt ps origin main)"
  )
  .action((remote, branch) => push(remote, branch));

program
  .command("remote-init")
  .description(
    "Add remote, set main branch, and push to origin main (interactive)"
  )
  .action(remoteInit);

program
  .command("rc-edit")
  .description("Create or edit .gitmatrc shortcuts interactively")
  .action(rcEdit);

program
  .command("log")
  .description(
    "Pretty, colorized, paginated git log with commit details (alias for l)"
  )
  .action(() => logViewer());
program
  .command("lo")
  .description("Show git log --oneline (shortcut for log oneline)")
  .action(() => logViewer({ mode: "oneline" }));
program
  .command("log-graph")
  .description("Show git log --oneline --graph --all")
  .action(() => logViewer({ mode: "graph" }));
program
  .command("log-file <filename>")
  .description("Show git log for a specific file")
  .action((filename) => logViewer({ mode: "file", filename }));
program
  .command("log-since <time>")
  .description('Show git log --since="<time>"')
  .action((time) => logViewer({ mode: "since", time }));
program
  .command("log-author <author>")
  .description('Show git log --author="<author>"')
  .action((author) => logViewer({ mode: "author", author }));
program
  .command("log-name-only")
  .description("Show git log --name-only")
  .action(() => logViewer({ mode: "name-only" }));
program
  .command("ldi")
  .description("Show git log -p")
  .action(() => logViewer({ mode: "diff" }));
program
  .command("log-limit <n>")
  .description("Show git log -n <n>")
  .action((n) => logViewer({ mode: "limit", n }));
program
  .command("log-format <format>")
  .description('Show git log --pretty=format:"<format>"')
  .action((format) => logViewer({ mode: "format", format }));

program.command("psf").description("Force push (git push --force)").action(psf);
program
  .command("psfl")
  .description("Force push with lease (git push --force-with-lease)")
  .action(psfl);
program
  .command("psa")
  .description("Push all branches (git push --all origin)")
  .action(psa);
program
  .command("pst")
  .description("Push all tags (git push --tags)")
  .action(pst);
program
  .command("psd <branch>")
  .description("Delete remote branch (git push origin --delete <branch>)")
  .action(psd);

program
  .command("unst <file>")
  .description("Unstage a file (git reset HEAD <file>)")
  .action(unstage);
program
  .command("reha")
  .description("Hard reset to previous commit (git reset --hard HEAD~1)")
  .action(resetHard);
program
  .command("rere")
  .description("Recover from bad reset (git reset --hard ORIG_HEAD)")
  .action(resetRecover);

program
  .command("quick")
  .description("Quick menu for all major git actions (interactive palette)")
  .action(quick);

program
  .command("chpi")
  .description(
    "Interactively cherry-pick commit(s) from any branch (shortcut for cherry-pick)"
  )
  .action(cherryPick);

program
  .command("rebase")
  .description("Interactively rebase onto a branch or rebase last N commits")
  .action(rebase);

program
  .command("rbs")
  .description(
    "Interactively rebase onto a branch or rebase last N commits (shortcut for rebase)"
  )
  .action(rebase);

program
  .command("bisect")
  .description(
    "Interactive git bisect wizard (find commit that introduced a bug)"
  )
  .action(bisect);

program
  .command("bsc")
  .description("Interactive git bisect wizard (shortcut for bisect)")
  .action(bisect);

program
  .command("tag")
  .description("Interactive tag management (list, create, delete, push tags)")
  .action(tag);

program
  .command("tg")
  .description("Interactive tag management (shortcut for tag)")
  .action(tag);

program
  .command("fetch [remote]")
  .description(
    "Fetch all or a specific remote, show summary, suggest next actions"
  )
  .action((remote) => fetchCmd(remote));

program
  .command("merge [branch]")
  .description(
    "Merge a branch into the current branch (interactive if no branch specified)"
  )
  .action((branch) => merge(branch));

program
  .command("help")
  .description("Show detailed help and usage for all commands")
  .action(() => {
    const banner = figlet.textSync("GitMat", {
      horizontalLayout: "default",
      width: 60,
    });
    const cyan = (msg) => `\x1b[36m${msg}\x1b[0m`;
    const yellow = (msg) => `\x1b[33m${msg}\x1b[0m`;
    const green = (msg) => `\x1b[32m${msg}\x1b[0m`;
    const magenta = (msg) => `\x1b[35m${msg}\x1b[0m`;
    const white = (msg) => `\x1b[37m${msg}\x1b[0m`;
    console.log(`\n${cyan(banner)}`);
    console.log(magenta("Your smart Git companion\n"));
    console.log(yellow("USAGE:") + "    " + white("gmt <command> [options]\n"));
    console.log(green("Core Commands:"));
    console.log(
      "  " + cyan("init") + "                Initialize a git repository"
    );
    console.log(
      "  " +
        cyan("remote-init") +
        "         Add remote, set main branch, and push to origin main"
    );
    console.log(
      "  " +
        cyan("st") +
        "," +
        cyan(" status") +
        "         Enhanced git status (banner, box, color)"
    );
    console.log(
      "  " +
        cyan("save [msg]") +
        '           Stage all changes and commit (default: "savepoint")'
    );
    console.log(
      "  " +
        cyan("undo") +
        "                Undo last commit (with confirmation)"
    );
    console.log("");
    console.log(green("Branch Management:"));
    console.log(
      "  " +
        cyan("br") +
        "," +
        cyan(" branch") +
        "         Interactive branch switcher (table, create, switch)"
    );
    console.log(
      "  " +
        cyan("del [branch]") +
        "," +
        cyan(" db [branch]") +
        "  Delete a branch by name (with confirmation)"
    );
    console.log(
      "  " + cyan("delete-branch") + "         Interactively delete a branch"
    );
    console.log("");
    console.log(green("Stash & Smart:"));
    console.log(
      "  " +
        cyan("stash") +
        "               Interactive stash manager (create, list, apply, drop, view)"
    );
    console.log(
      "  " +
        cyan("smart") +
        "               Smart contextual actions based on repo state"
    );
    console.log("");
    console.log(green("Remote:"));
    console.log(
      "  " +
        cyan("ps [remote] [branch]") +
        "  Push current branch to remote, or specify remote and branch"
    );
    console.log("");
    console.log(green("Other:"));
    console.log("  " + cyan("help") + "                Show this help message");
    console.log(
      "  rc-edit          Create or edit .gitmatrc shortcuts interactively"
    );
    console.log("  <shortcut>       Run a custom shortcut from .gitmatrc");
    console.log(
      "  l, log                Pretty, colorized, paginated git log with commit details"
    );
    console.log(
      "  lo, log oneline        Show git log --oneline (one-line log)"
    );
    console.log("  ldi, log diff          Show git log -p (log with diffs)");
    console.log("");
    console.log(yellow("EXAMPLES:"));
    console.log("  " + white("gmt st"));
    console.log("  " + white('gmt save "Initial commit"'));
    console.log("  " + white("gmt br"));
    console.log("  " + white("gmt del feature-branch"));
    console.log("  " + white("gmt stash"));
    console.log("  " + white("gmt smart"));
    console.log("  " + white("gmt ps origin main"));
    console.log("  " + white("gmt remote-init"));
    console.log("");
    console.log(magenta("For more details, see the README.md."));
    console.log("  psf             Force push (git push --force)");
    console.log(
      "  psfl            Force push with lease (git push --force-with-lease)"
    );
    console.log("  psa             Push all branches (git push --all origin)");
    console.log("  pst             Push all tags (git push --tags)");
    console.log(
      "  psd <branch>    Delete remote branch (git push origin --delete <branch>)"
    );
    console.log(
      "  unst <file>, unstage <file>   Unstage a file (git reset HEAD <file>)"
    );
    console.log(
      "  reha, reset-hard              Hard reset to previous commit (git reset --hard HEAD~1)"
    );
    console.log(
      "  rere, reset-recover           Recover from bad reset (git reset --hard ORIG_HEAD)"
    );
    console.log(
      "  quick                 Quick menu for all major git actions (interactive palette)"
    );
    console.log(
      "  cherry-pick, chpi     Interactively cherry-pick commit(s) from any branch"
    );
    console.log(
      "  rebase, rbs           Interactively rebase onto a branch or rebase last N commits"
    );
    console.log(
      "  bisect, bsc           Interactive git bisect wizard (find commit that introduced a bug)"
    );
    console.log(
      "  tag, tg               Interactive tag management (list, create, delete, push tags)"
    );
  });

// Custom help colors (fix: only use supported hooks)
program.configureHelp({
  optionTerm: (option) => chalk.magenta(option),
  argumentTerm: (arg) => chalk.cyan(arg),
  commandTerm: (cmd) => chalk.yellow(cmd.name()),
});

// Add extra color to the help description
program.addHelpText("beforeAll", () =>
  chalk.bold.green("\nGitMat CLI - Your smart Git companion\n")
);

// Custom, colorful help output
program.helpInformation = function () {
  // Banner
  const banner = chalk.cyan(
    figlet.textSync("GitMat", { horizontalLayout: "default" })
  );
  const welcome = chalk.bold.magenta(
    "Welcome to GitMat! Your smart Git companion."
  );
  const boxed = boxen(`${banner}\n${welcome}`, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "green",
  });

  // Usage
  const usage =
    chalk.bold.green("\nUsage: ") + chalk.yellow("gmt [options] [command]");

  // Options
  const optionsHeader = chalk.bold.underline.green("\nOptions:");
  const options = this.options
    .map(
      (opt) =>
        "  " +
        chalk.magenta(opt.flags.padEnd(25)) +
        chalk.white(opt.description)
    )
    .join("\n");

  // Commands
  const commandsHeader = chalk.bold.underline.green("\nCommands:");
  const commands = this.commands
    .filter((cmd) => !cmd._hidden)
    .map(
      (cmd) =>
        "  " +
        chalk.yellow(cmd.name().padEnd(20)) +
        chalk.white(cmd.description())
    )
    .join("\n");

  // Footer
  const footer =
    chalk.gray("\nFor more details, see the README or run ") +
    chalk.yellow("gmt <command> --help") +
    chalk.gray(" for command-specific help.\n");

  return `${boxed}\n${usage}\n${optionsHeader}\n${options}\n${commandsHeader}\n${commands}\n${footer}\n`;
};

// TODO: Add more commands here

program.exitOverride();

// Helper to split command string into args (handles quotes)
function parseArgs(str) {
  const re = /(?:[^"]\S*|"[^"]*"|'[^']*')+/g;
  const arr = [];
  let match;
  while ((match = re.exec(str)) !== null) {
    arr.push(match[0].replace(/^['"]|['"]$/g, ""));
  }
  return arr;
}

function loadShortcuts() {
  let shortcuts = {};
  // Load from home directory
  const homeRc = path.resolve(os.homedir(), ".gitmatrc");
  if (fs.existsSync(homeRc)) {
    try {
      const config = JSON.parse(fs.readFileSync(homeRc, "utf8"));
      Object.assign(shortcuts, config.shortcuts || {});
    } catch {}
  }
  // Load from current directory (overrides home)
  const localRc = path.resolve(process.cwd(), ".gitmatrc");
  if (fs.existsSync(localRc)) {
    try {
      const config = JSON.parse(fs.readFileSync(localRc, "utf8"));
      Object.assign(shortcuts, config.shortcuts || {});
    } catch {}
  }
  return shortcuts;
}

async function runShortcutIfExists() {
  const shortcuts = loadShortcuts();
  const userArgs = process.argv.slice(2);
  if (userArgs.length > 0 && shortcuts[userArgs[0]]) {
    const shortcutCmd = shortcuts[userArgs[0]];
    const args = parseArgs(shortcutCmd);
    if (args[0] === "gmt" || args[0] === "gt" || args[0] === "gitmat") {
      const { spawnSync } = await import("child_process");
      const result = spawnSync(
        process.argv[0],
        [process.argv[1], ...args.slice(1)],
        {
          stdio: "inherit",
          shell: false,
        }
      );
      process.exit(result.status || 0);
    } else {
      const { spawnSync } = await import("child_process");
      const result = spawnSync(shortcutCmd, { stdio: "inherit", shell: true });
      process.exit(result.status || 0);
    }
    return true;
  }
  return false;
}

(async () => {
  if (await runShortcutIfExists()) return;

  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Show banner and a short message
    const banner = chalk.cyan(
      figlet.textSync("GitMat", { horizontalLayout: "default" })
    );
    const welcome = chalk.bold.magenta(
      "Welcome to GitMat! Your smart Git companion."
    );
    const tip =
      chalk.green("Type ") +
      chalk.yellow("gmt help") +
      chalk.green(" to see all commands and options.");
    const boxed = boxen(`${banner}\n${welcome}\n\n${tip}`, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "cyan",
    });
    console.log(boxed + "\n");
    process.exit(0);
  }

  const showBanner =
    args.length === 1 && (args[0] === "-h" || args[0] === "--help");
  if (showBanner) {
    const banner = chalk.cyan(
      figlet.textSync("GitMat", { horizontalLayout: "default" })
    );
    const welcome = chalk.bold.magenta(
      "Welcome to GitMat! Your smart Git companion."
    );
    const boxed = boxen(`${banner}\n${welcome}`, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "cyan",
    });
    console.log(boxed + "\n");
  }

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err.code === "commander.version" || err.code === "commander.help") {
      process.exit(0);
    }
    throw err;
  }
})();
