#!/usr/bin/env node
import { Box, render, Text, useApp, useInput } from "ink";
import Table from "ink-table";
import React, { useState } from "react";

const commands = [
  { command: "init", description: "Initialize a git repository" },
  {
    command: "remote-init",
    description:
      "Add remote, set main branch, and push to origin main (interactive)",
  },
  { command: "st", description: "Enhanced git status (banner, box, color)" },
  {
    command: "status",
    description: "Enhanced git status (banner, box, color)",
  },
  {
    command: "save",
    description: 'Stage all changes and commit (default: "savepoint")',
  },
  { command: "undo", description: "Undo last commit (with confirmation)" },
  {
    command: "br",
    description: "Interactive branch switcher (table, create, switch)",
  },
  {
    command: "branch",
    description: "Interactive branch switcher (table, create, switch)",
  },
  {
    command: "del",
    description: "Delete a branch by name (with confirmation)",
  },
  { command: "db", description: "Delete a branch by name (with confirmation)" },
  { command: "delete-branch", description: "Interactively delete a branch" },
  {
    command: "stash",
    description: "Interactive stash manager (create, list, apply, drop, view)",
  },
  {
    command: "smart",
    description: "Smart contextual actions based on repo state",
  },
  {
    command: "ps",
    description: "Push current branch to remote, or specify remote and branch",
  },
  { command: "psf", description: "Force push (git push --force)" },
  {
    command: "psfl",
    description: "Force push with lease (git push --force-with-lease)",
  },
  { command: "psa", description: "Push all branches (git push --all origin)" },
  { command: "pst", description: "Push all tags (git push --tags)" },
  {
    command: "psd",
    description: "Delete remote branch (git push origin --delete <branch>)",
  },
  { command: "unst", description: "Unstage a file (git reset HEAD <file>)" },
  { command: "unstage", description: "Unstage a file (git reset HEAD <file>)" },
  {
    command: "reha",
    description: "Hard reset to previous commit (git reset --hard HEAD~1)",
  },
  {
    command: "reset-hard",
    description: "Hard reset to previous commit (git reset --hard HEAD~1)",
  },
  {
    command: "rere",
    description: "Recover from bad reset (git reset --hard ORIG_HEAD)",
  },
  {
    command: "reset-recover",
    description: "Recover from bad reset (git reset --hard ORIG_HEAD)",
  },
  {
    command: "quick",
    description: "Quick menu for all major git actions (interactive palette)",
  },
  {
    command: "cherry-pick",
    description: "Interactively cherry-pick commit(s) from any branch",
  },
  {
    command: "chpi",
    description: "Interactively cherry-pick commit(s) from any branch",
  },
  {
    command: "rebase",
    description: "Interactively rebase onto a branch or rebase last N commits",
  },
  {
    command: "rbs",
    description: "Interactively rebase onto a branch or rebase last N commits",
  },
  {
    command: "bisect",
    description:
      "Interactive git bisect wizard (find commit that introduced a bug)",
  },
  {
    command: "bsc",
    description:
      "Interactive git bisect wizard (find commit that introduced a bug)",
  },
  {
    command: "tag",
    description: "Interactive tag management (list, create, delete, push tags)",
  },
  {
    command: "tg",
    description: "Interactive tag management (list, create, delete, push tags)",
  },
  {
    command: "config",
    description: "View/set git config (user/email/alias) interactively",
  },
  {
    command: "merge",
    description: "Interactive merge with conflict handling, undo/redo",
  },
  {
    command: "submodule",
    description:
      "Manage git submodules (list, add, update, init, sync, remove)",
  },
  {
    command: "reflog",
    description: "Show git reflog, checkout/reset to previous states",
  },
  {
    command: "fetch",
    description:
      "Fetch all or specific remote, show summary, suggest next actions",
  },
  {
    command: "clean",
    description:
      "Preview and delete untracked files, dry-run, confirm before delete",
  },
  {
    command: "notes",
    description: "Add, show, edit, remove notes on commits (interactive)",
  },
  {
    command: "worktree",
    description: "List, add, remove worktrees (interactive)",
  },
  {
    command: "log",
    description: "Pretty, colorized, paginated git log with commit details",
  },
  {
    command: "l",
    description: "Pretty, colorized, paginated git log with commit details",
  },
  { command: "lo", description: "Show git log --oneline (one-line log)" },
  { command: "ldi", description: "Show git log -p (log with diffs)" },
];

const TablePicker = () => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const { exit } = useApp();

  // Filter commands by query
  const filtered = commands.filter(
    (c) =>
      c.command.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase())
  );

  useInput((input, key) => {
    if (key.downArrow) {
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (key.upArrow) {
      setSelected((s) => Math.max(s - 1, 0));
    } else if (key.return) {
      // Output the selected command and exit
      // eslint-disable-next-line no-console
      console.log(filtered[selected].command);
      exit();
    } else if (key.backspace || key.delete) {
      setQuery((q) => q.slice(0, -1));
      setSelected(0);
    } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
      setQuery((q) => q + input);
      setSelected(0);
    }
  });

  return (
    <Box flexDirection="column">
      <Text>{`Search: ${query}`}</Text>
      <Table
        data={filtered.map((c, i) => ({
          Command: i === selected ? `> ${c.command}` : `  ${c.command}`,
          Description: c.description,
        }))}
      />
      <Text color="gray">
        Use ↑/↓ to move, type to search, Enter to select.
      </Text>
    </Box>
  );
};

render(<TablePicker />);
