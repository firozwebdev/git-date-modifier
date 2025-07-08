import boxen from "boxen";
import chalk from "chalk";
import simpleGit from "simple-git";

export default async function psa() {
  const git = simpleGit();
  try {
    await git.push(["--all", "origin"]);
    console.log(
      boxen(chalk.green("✔ All branches pushed to origin!"), {
        padding: 1,
        borderStyle: "round",
        borderColor: "green",
        margin: 1,
      })
    );
  } catch (err) {
    console.error(
      boxen(chalk.red("Error pushing all branches: ") + err.message, {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
  }
}
