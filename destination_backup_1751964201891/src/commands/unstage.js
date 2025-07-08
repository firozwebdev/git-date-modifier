import simpleGit from "simple-git";
import chalk from "chalk";
import boxen from "boxen";
import history from "./history.js";
import { isGitRepo } from "./utils.js";

export default async function unstage(file) {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  const git = simpleGit();
  if (!file) {
    console.log(
      boxen(chalk.red("Please specify a file to unstage."), {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
    return;
  }
  // Get staged hash for the file
  let hash = null;
  try {
    const { stdout } = await git.raw(["ls-files", "--stage", file]);
    hash = stdout.split(" ")[1];
  } catch {}
  try {
    await git.reset(["HEAD", file]);
    if (hash) {
      history.addAction({ type: "unstage", file, hash });
    }
    console.log(
      boxen(chalk.green(`✔ Unstaged file: ${file}`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
  } catch (err) {
    console.error(
      boxen(chalk.red("Error unstaging file: ") + err.message, {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
  }
}
