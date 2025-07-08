#!/usr/bin/env node
import fs from "fs";
import { Box, render, Text, useApp, useInput } from "ink";
import TableModule from "ink-table";
import path from "path";
import React, { useState } from "react";
const Table = TableModule.default || TableModule;

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

const rcPath = path.resolve(process.cwd(), ".gitmatrc");
function loadShortcuts() {
  if (fs.existsSync(rcPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(rcPath, "utf8"));
      return config.shortcuts || {};
    } catch {
      return {};
    }
  }
  return {};
}
function saveShortcuts(shortcuts) {
  fs.writeFileSync(rcPath, JSON.stringify({ shortcuts }, null, 2));
}

const MainMenu = ({ onSelect }) => {
  const options = [
    "Add or update a shortcut",
    "Remove a shortcut",
    "View current shortcuts",
    "Exit",
  ];
  const [selected, setSelected] = useState(0);
  useInput((input, key) => {
    if (key.downArrow) setSelected((s) => Math.min(s + 1, options.length - 1));
    else if (key.upArrow) setSelected((s) => Math.max(s - 1, 0));
    else if (key.return) onSelect(selected);
  });
  return (
    <Box flexDirection="column">
      <Text bold>What would you like to do with .gitmatrc?</Text>
      {options.map((opt, i) => (
        <Text key={opt} color={i === selected ? "cyan" : undefined}>
          {i === selected ? "> " : "  "}
          {opt}
        </Text>
      ))}
      <Text color="gray">
        Use ↑/↓ to move, Enter to select, Ctrl+C to quit.
      </Text>
    </Box>
  );
};

const CommandPicker = ({ onPick, onCancel }) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  // Non-fuzzy search: only startsWith
  let filtered = commands.filter(
    (c) =>
      query === "" ||
      c.command.toLowerCase().startsWith(query.toLowerCase()) ||
      c.description.toLowerCase().startsWith(query.toLowerCase())
  );
  // Pin 'save' to the top if present
  const saveIdx = filtered.findIndex((c) => c.command === "save");
  if (saveIdx > 0) {
    const [saveCmd] = filtered.splice(saveIdx, 1);
    filtered.unshift(saveCmd);
  }
  useInput((input, key) => {
    if (key.downArrow) setSelected((s) => Math.min(s + 1, filtered.length - 1));
    else if (key.upArrow) setSelected((s) => Math.max(s - 1, 0));
    else if (key.return) onPick(filtered[selected].command);
    else if (key.escape) onCancel();
    else if (key.backspace || key.delete) {
      setQuery((q) => q.slice(0, -1));
      setSelected(0);
    } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
      setQuery((q) => q + input);
      setSelected(0);
    }
  });
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        🔍 Search Commands
      </Text>
      <Text color="gray">Type to filter: {query || " "}</Text>
      <Box marginTop={1}>
        <Table
          data={filtered.map((c, i) => ({
            Command: i === selected ? `▶ ${c.command}` : `  ${c.command}`,
            Description: c.description,
          }))}
        />
      </Box>
      <Box marginTop={1}>
        <Text color="yellow">
          ↑/↓ Navigate • Type to search • Enter to select • Esc to cancel
        </Text>
      </Box>
    </Box>
  );
};

const ShortcutNameInput = ({ onSubmit, onCancel }) => {
  const [input, setInput] = useState("");
  useInput((ch, key) => {
    if (key.return && input.trim()) onSubmit(input.trim());
    else if (key.escape) onCancel();
    else if (key.backspace || key.delete) setInput((i) => i.slice(0, -1));
    else if (ch && ch.length === 1 && !key.ctrl && !key.meta)
      setInput((i) => i + ch);
  });
  return (
    <Box flexDirection="column">
      <Text>Shortcut name (e.g., out):</Text>
      <Text color="cyan">{input || " "}</Text>
      <Text color="gray">Enter to confirm, Esc to cancel.</Text>
    </Box>
  );
};

const CustomCommandInput = ({ onSubmit, onCancel }) => {
  const [input, setInput] = useState("");
  useInput((ch, key) => {
    if (key.return && input.trim()) onSubmit(input.trim());
    else if (key.escape) onCancel();
    else if (key.backspace || key.delete) setInput((i) => i.slice(0, -1));
    else if (ch && ch.length === 1 && !key.ctrl && !key.meta)
      setInput((i) => i + ch);
  });
  return (
    <Box flexDirection="column">
      <Text>Enter a custom command (e.g., git push):</Text>
      <Text color="cyan">{input || " "}</Text>
      <Text color="gray">Enter to confirm, Esc to cancel.</Text>
    </Box>
  );
};

const RemoveShortcut = ({ shortcuts, onRemove, onCancel }) => {
  const keys = Object.keys(shortcuts);
  const [selected, setSelected] = useState(0);

  useInput((input, key) => {
    if (key.downArrow) setSelected((s) => Math.min(s + 1, keys.length - 1));
    else if (key.upArrow) setSelected((s) => Math.max(s - 1, 0));
    else if (key.return) onRemove(keys[selected]);
    else if (key.escape) onCancel();
  });

  // Build table data with descriptions
  const tableData = keys.map((key, index) => {
    const command = shortcuts[key];
    // Try to extract the base command for description lookup
    let baseCmd = command.replace(/^gmt\s+/, "").split(" ")[0];
    const descObj = commands.find((c) => c.command === baseCmd);
    const desc = descObj ? descObj.description : "";

    return {
      Shortcut: index === selected ? `🗑️  ${key}` : `   ${key}`,
      Command: command,
      Description: desc,
    };
  });

  return (
    <Box flexDirection="column">
      <Text bold color="red">
        🗑️ Select a shortcut to remove:
      </Text>
      <Box marginTop={1}>
        <Table data={tableData} />
      </Box>
      <Box marginTop={1}>
        <Text color="yellow">
          ↑/↓ Navigate • Enter to remove • Esc to cancel
        </Text>
      </Box>
    </Box>
  );
};

const ViewShortcuts = ({ shortcuts, onExit }) => {
  useInput(() => onExit());

  if (Object.keys(shortcuts).length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="yellow" bold>
          📝 No shortcuts defined
        </Text>
        <Text color="gray">Press any key to return.</Text>
      </Box>
    );
  }

  // Build table data with descriptions
  const tableData = Object.entries(shortcuts).map(([key, command]) => {
    // Try to extract the base command for description lookup
    let baseCmd = command.replace(/^gmt\s+/, "").split(" ")[0];
    const descObj = commands.find((c) => c.command === baseCmd);
    const desc = descObj ? descObj.description : "";

    return {
      Shortcut: `⚡ ${key}`,
      Command: command,
      Description: desc,
    };
  });

  return (
    <Box flexDirection="column">
      <Text bold color="green">
        📋 Current Shortcuts
      </Text>
      <Box marginTop={1}>
        <Table data={tableData} />
      </Box>
      <Box marginTop={1}>
        <Text color="gray">Press any key to return to menu</Text>
      </Box>
    </Box>
  );
};

// Add PickTypeComponent for pickType mode
const PickTypeComponent = ({ onSelect, onCancel }) => {
  const opts = [
    "Pick from available GitMate commands",
    "Enter a custom command (free text)",
  ];
  const [selected, setSelected] = useState(0);
  useInput((input, key) => {
    if (key.downArrow) setSelected((s) => Math.min(s + 1, opts.length - 1));
    else if (key.upArrow) setSelected((s) => Math.max(s - 1, 0));
    else if (key.return) onSelect(selected);
    else if (key.escape) onCancel();
  });
  return (
    <Box flexDirection="column">
      <Text bold>How do you want to specify the command?</Text>
      {opts.map((opt, i) => (
        <Text key={opt} color={i === selected ? "cyan" : undefined}>
          {i === selected ? "> " : "  "}
          {opt}
        </Text>
      ))}
      <Text color="gray">
        Use ↑/↓ to move, Enter to select, Esc to cancel, Ctrl+C to quit.
      </Text>
    </Box>
  );
};

const MessageComponent = ({ message, onExit }) => {
  useInput(() => onExit());
  return (
    <Box flexDirection="column">
      <Text color="green">{message}</Text>
      <Text color="gray">Press any key to return to menu.</Text>
    </Box>
  );
};

const App = () => {
  const { exit } = useApp();
  const [shortcuts, setShortcuts] = useState(loadShortcuts());
  const [mode, setMode] = useState("menu");
  const [message, setMessage] = useState("");
  const [pendingKey, setPendingKey] = useState("");

  // Handle returning from view
  useInput(
    () => {
      if (mode === "view") setMode("menu");
    },
    { isActive: mode === "view" }
  );

  // Main menu selection
  const handleMenu = (idx) => {
    if (idx === 0) setMode("inputKey"); // Start with asking for shortcut name
    else if (idx === 1) setMode("remove");
    else if (idx === 2) setMode("view");
    else exit();
  };

  // Add/update shortcut flow
  const handleKeyInput = (ch) => {
    if (!ch.trim()) return;
    setPendingKey(ch.trim());
    setMode("pickType"); // After getting shortcut name, show command type picker
  };
  const handlePickType = (idx) => {
    if (idx === 0) setMode("pickCmd");
    else setMode("customCmd");
  };
  const handlePickCmd = (cmd) => {
    setShortcuts((s) => {
      const next = { ...s, [pendingKey]: `gmt ${cmd}` };
      saveShortcuts(next);
      return next;
    });
    setMessage(`✔ Shortcut '${pendingKey}' set to: gmt ${cmd}`);
    setMode("message");
  };
  const handleCustomCmd = (cmd) => {
    setShortcuts((s) => {
      const next = { ...s, [pendingKey]: cmd };
      saveShortcuts(next);
      return next;
    });
    setMessage(`✔ Shortcut '${pendingKey}' set to: ${cmd}`);
    setMode("message");
  };
  const handleRemove = (key) => {
    setShortcuts((s) => {
      const next = { ...s };
      delete next[key];
      saveShortcuts(next);
      return next;
    });
    setMessage(`✔ Shortcut '${key}' removed.`);
    setMode("message");
  };

  // UI rendering
  if (mode === "menu") return <MainMenu onSelect={handleMenu} />;
  if (mode === "inputKey")
    return (
      <ShortcutNameInput
        onSubmit={handleKeyInput}
        onCancel={() => setMode("menu")}
      />
    );
  if (mode === "pickType")
    return (
      <PickTypeComponent
        onSelect={handlePickType}
        onCancel={() => setMode("menu")}
      />
    );
  if (mode === "pickCmd")
    return (
      <CommandPicker onPick={handlePickCmd} onCancel={() => setMode("menu")} />
    );
  if (mode === "customCmd")
    return (
      <CustomCommandInput
        onSubmit={handleCustomCmd}
        onCancel={() => setMode("menu")}
      />
    );
  if (mode === "remove")
    return (
      <RemoveShortcut
        shortcuts={shortcuts}
        onRemove={handleRemove}
        onCancel={() => setMode("menu")}
      />
    );
  if (mode === "view")
    return (
      <ViewShortcuts shortcuts={shortcuts} onExit={() => setMode("menu")} />
    );
  if (mode === "message")
    return (
      <MessageComponent message={message} onExit={() => setMode("menu")} />
    );
  return null;
};

render(<App />);
