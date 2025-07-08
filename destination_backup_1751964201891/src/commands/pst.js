import boxen from "boxen";
import chalk from "chalk";
import simpleGit from "simple-git";
import { isGitRepo } from "./utils.js";

export default async function pst() {
  if (!isGitRepo()) {
    console.error("\x1b[31mError: Not a git repository. Please run this command inside a git project.\x1b[0m");
    process.exit(1);
  }
  const git = simpleGit();
  try {
    await git.push(["--tags"]);
    console.log(
      boxen(chalk.green("✔ All tags pushed!"), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
  } catch (err) {
    console.error(
      boxen(chalk.red("Error pushing tags: ") + err.message, {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
  }
}
