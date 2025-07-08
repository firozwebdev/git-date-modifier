# GitMat

[![npm version](https://img.shields.io/npm/v/gitmat.svg?style=flat)](https://www.npmjs.com/package/gitmat)
[View on npm](https://www.npmjs.com/package/gitmat)

## 🚀 Installation (Recommended: Global via npm)

Install from the official npm registry: [https://www.npmjs.com/package/gitmat](https://www.npmjs.com/package/gitmat)

Install GitMat globally using npm (recommended for most users):

```sh
npm install -g gitmat
```

After installation, you can use **any** of the following commands anywhere:

- `gitmat` (main command, always available)
- `gmt` (alias, recommended for speed)
- `gt` (alias, short and convenient)

> **Note:** On Windows, a batch alias is used for `gitmat` to ensure it always works, even if npm shims have issues. All three commands are official and fully supported.

## Installation

All dependencies, including `tsx`, are installed automatically when you install this package globally or locally. No manual setup is required for `tsx`.

---

## 🧩 Overview

**GitMat** is a CLI tool that wraps common Git workflows with:

- Human-friendly commands
- Interactive CLI (TUI coming soon)
- Smart presets
- Customizable behavior (via `.gitmatrc`)

---

## 🚀 Features

- Enhanced status summary: `gitmat status` / `gmt status` / `gt status`
- Quick savepoint commit: `gitmat save` / `gmt save` / `gt save`
- Undo last commit (with confirmation): `gitmat undo` / `gmt undo` / `gt undo`
- Interactive branch switcher: `gitmat branch` / `gmt branch` / `gt branch`
- (Aliases: You can use `gitmat`, `gmt`, or `gt` for all commands)

---

## 🛠️ Commands & Usage

| Command                                         | Description                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `gitmat init` / `gmt init` / `gt init`          | Initialize a git repository                                        |
| `gitmat remote-init`                            | Add remote, set main branch, and push to origin main (interactive) |
| `gitmat st` or `gitmat status`                  | Enhanced git status (banner, box, color)                           |
| `gitmat save [message]`                         | Stage all changes and commit (default: "savepoint")                |
| `gitmat undo`                                   | Undo last commit (with confirmation)                               |
| `gitmat br` or `gitmat branch`                  | Interactive branch switcher (table, create, switch)                |
| `gitmat del [branch]`                           | Delete a branch by name (with confirmation)                        |
| `gitmat db [branch]`                            | Delete a branch by name (with confirmation)                        |
| `gitmat delete-branch`                          | Interactively delete a branch                                      |
| `gitmat stash`                                  | Interactive stash manager (create, list, apply, drop, view)        |
| `gitmat smart`                                  | Smart contextual actions based on repo state                       |
| `gitmat ps [remote] [branch]`                   | Push current branch to remote, or specify remote and branch        |
| `gitmat rc-edit`                                | Create or edit .gitmatrc shortcuts interactively                   |
| `gitmat <shortcut>`                             | Run a custom shortcut from .gitmatrc                               |
| `gitmat l`, `gitmat log`                        | Pretty, colorized, paginated git log with commit details           |
| `gitmat lo`, `gitmat log oneline`               | Show git log --oneline (one-line log)                              |
| `gitmat ldi`, `gitmat log diff`                 | Show git log -p (log with diffs)                                   |
| `gitmat help`                                   | Show all commands and usage                                        |
| `gitmat psf`                                    | Force push (git push --force)                                      |
| `gitmat psfl`                                   | Force push with lease (git push --force-with-lease)                |
| `gitmat psa`                                    | Push all branches (git push --all origin)                          |
| `gitmat pst`                                    | Push all tags (git push --tags)                                    |
| `gitmat psd <branch>`                           | Delete remote branch (git push origin --delete <branch>)           |
| `gitmat unst <file>` or `gitmat unstage <file>` | Unstage a file (git reset HEAD <file>)                             |
| `gitmat reha` or `gitmat reset-hard`            | Hard reset to previous commit (git reset --hard HEAD~1)            |
| `gitmat rere` or `gitmat reset-recover`         | Recover from bad reset (git reset --hard ORIG_HEAD)                |
| `gitmat quick`                                  | Quick menu for all major git actions (interactive palette)         |
| `gitmat cherry-pick` or `gitmat chpi`           | Interactively cherry-pick commit(s) from any branch                |
| `gitmat rebase` or `gitmat rbs`                 | Interactively rebase onto a branch or rebase last N commits        |
| `gitmat bisect` or `gitmat bsc`                 | Interactive git bisect wizard (find commit that introduced a bug)  |
| `gitmat tag` or `gitmat tg`                     | Interactive tag management (list, create, delete, push tags)       |
| `gitmat config`                                 | View/set git config (user/email/alias) interactively               |
| `gitmat merge [branch]`                         | Interactive merge with conflict handling, undo/redo                |
| `gitmat submodule`                              | Manage git submodules (list, add, update, init, sync, remove)      |
| `gitmat reflog`                                 | Show git reflog, checkout/reset to previous states                 |
| `gitmat fetch [remote]`                         | Fetch all or specific remote, show summary, suggest next actions   |
| `gitmat clean`                                  | Preview and delete untracked files, dry-run, confirm before delete |
| `gitmat notes`                                  | Add, show, edit, remove notes on commits (interactive)             |
| `gitmat worktree`                               | List, add, remove worktrees (interactive)                          |

---

> **All three commands (`gitmat`, `gmt`, `gt`) are official and fully supported. Use whichever you prefer!**

---

## 🖥️ Cross-Platform Alias Script (gmt)

To use `gmt` as a shortcut for `gitmat` on any OS, this project provides two scripts:

- `bin/gmt` (for Linux/macOS/Unix)
- `bin/gmt.cmd` (for Windows)

### **How to use:**

#### **On Linux/macOS/Unix:**

1. Copy `bin/gmt` to a directory in your PATH (e.g., `/usr/local/bin`):
   ```sh
   cp bin/gmt /usr/local/bin/gmt
   chmod +x /usr/local/bin/gmt
   ```
2. Now you can use `gmt` in any terminal.

#### **On Windows:**

1. Copy `bin/gmt.cmd` to a directory that is already in your PATH (e.g., `C:\Windows`).

   ```cmd
   copy bin\gmt.cmd C:\Windows\gmt.cmd
   ```

   Now you can use `gmt` in any Command Prompt or PowerShell.

2. **If you want to use a custom directory (e.g., your own tools folder or your project bin):**
   - For example, to use your project bin folder: `D:\current workings\gitMate\bin`
   - Add that folder to your system PATH:
     1. Open System Properties → Advanced → Environment Variables.
     2. Under "System variables", find `Path`, select it, and click "Edit".
     3. Click "New" and add the full path: `D:\current workings\gitMate\bin`
     4. Click OK to save. Restart your terminal.
   - Now you can use `gmt` in any Command Prompt or PowerShell, from any directory.

---

## 🛠️ Commands & Usage

| Command                     | Description                                                        |     |
| --------------------------- | ------------------------------------------------------------------ | --- |
| `gmt init`                  | Initialize a git repository                                        |     |
| `gmt remote-init`           | Add remote, set main branch, and push to origin main (interactive) |     |
| `gmt st` or `gmt status`    | Enhanced git status (banner, box, color)                           |     |
| `gmt save [message]`        | Stage all changes and commit (default: "savepoint")                |     |
| `gmt undo`                  | Undo last commit (with confirmation)                               |     |
| `gmt br` or `gmt branch`    | Interactive branch switcher (table, create, switch)                |     |
| `gmt del [branch]`          | Delete a branch by name (with confirmation)                        |     |
| `gmt db [branch]`           | Delete a branch by name (with confirmation)                        |     |
| `gmt delete-branch`         | Interactively delete a branch                                      |     |
| `gmt stash`                 | Interactive stash manager (create, list, apply, drop, view)        |     |
| `gmt smart`                 | Smart contextual actions based on repo state                       |     |
| `gmt ps [remote] [branch]`  | Push current branch to remote, or specify remote and branch        |     |
| `gmt rc-edit`               | Create or edit .gitmaterc shortcuts interactively                  |     |
| `gmt <shortcut>`            | Run a custom shortcut from .gitmaterc                              |     |
| `gmt l`, `gmt log`          | Pretty, colorized, paginated git log with commit details           |     |
| `gmt lo`, `gmt log oneline` | Show git log --oneline (one-line log)                              |     |
| `gmt ldi`, `gmt log diff`   | Show git log -p (log with diffs)                                   |     |
| `gmt help`                  | Show all commands and usage                                        |     |
| `gmt psf`                   | Force push (git push --force)                                      |     |
| `gmt psfl`                  | Force push with lease (git push --force-with-lease)                |     |
| `gmt psa`                   | Push all branches (git push --all origin)                          |     |
| `gmt pst`                   | Push all tags (git push --tags)                                    |     |
| `gmt psd <branch>`          | Delete remote branch (git push origin --delete <branch>)           |     |

| `gmt unst <file>` or `gmt unstage <file>`
