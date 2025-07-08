import boxen from "boxen";
import chalk from "chalk";
import Table from "cli-table3";
import simpleGit from "simple-git";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}

export default async function branch() {
  const inquirer = await getInquirer();
  const git = simpleGit();
  const branchSummary = await git.branchLocal();
  const branches = branchSummary.all;
  const current = branchSummary.current;

  // If only the current branch exists
  if (branches.length === 1 && branches[0] === current) {
    console.log(
      chalk.yellow(`You are already on the only branch ('${current}').`)
    );
    const { createNew } = await inquirer.prompt([
      {
        type: "confirm",
        name: "createNew",
        message: "Would you like to create a new branch?",
        default: false,
      },
    ]);
    if (!createNew) {
      console.log(
        boxen(chalk.blue("No new branch created. Exiting."), {
          padding: 1,
          borderStyle: "round",
          borderColor: "blue",
          margin: 1,
        })
      );
      return;
    }
    const { newBranch } = await inquirer.prompt([
      {
        type: "input",
        name: "newBranch",
        message: "Enter new branch name:",
        validate: (input) =>
          input.trim() ? true : "Branch name cannot be empty",
      },
    ]);
    try {
      await git.checkoutLocalBranch(newBranch);
      console.log(
        boxen(chalk.green(`✔ Switched to new branch '${newBranch}'`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
    } catch (err) {
      console.error(
        boxen(chalk.red("Error creating branch:") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
    }
    return;
  }

  // Show branch list as a table
  const table = new Table({
    head: [chalk.cyan("Branch"), chalk.cyan("Current")],
    style: { head: [], border: [] },
    chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
  });
  branches.forEach((b) => {
    table.push([
      b === current ? chalk.bold.white(b) : b,
      b === current ? chalk.green("✔") : "",
    ]);
  });
  console.log(
    boxen(table.toString(), {
      padding: 1,
      borderStyle: "round",
      borderColor: "cyan",
      margin: 1,
      title: "Local Branches",
      titleAlignment: "center",
    })
  );

  while (true) {
    const choices = [
      ...branches.map((b) => ({
        name: b === current ? chalk.green(`✔ ${b}`) : b,
        value: b,
        short: b,
        disabled: b === current ? "Current branch" : false,
      })),
      new inquirer.Separator(),
      { name: "Create new branch...", value: "__create__" },
      { name: "⬅ Back", value: "__back__" },
      { name: "Exit", value: "__exit__" },
    ];

    // Find the first enabled branch for default selection
    const defaultIndex = choices.findIndex(
      (c) => !c.disabled && typeof c.value === "string" && c.value !== "__exit__"
    );

    const tip = chalk.gray(
      "Tip: You can always exit with Ctrl+C, Esc, or by selecting Exit."
    );

    // Handle Ctrl+C (SIGINT) for a friendly exit message
    const sigintHandler = () => {
      console.log(
        "\n" +
          boxen(chalk.blue("Exited without switching branches (Ctrl+C)."), {
            padding: 1,
            borderStyle: "round",
            borderColor: "blue",
            margin: 1,
          })
      );
      process.exit(0);
    };
    process.once("SIGINT", sigintHandler);

    const { selected } = await inquirer.prompt([
      {
        type: "list",
        name: "selected",
        message: `Select a branch to switch to, or Exit:` + "\n" + tip,
        choices,
        pageSize: 10,
        default: defaultIndex >= 0 ? defaultIndex : undefined,
      },
    ]);
    process.removeListener("SIGINT", sigintHandler);

    if (selected === "__exit__" || selected === "__back__") {
      console.log(
        boxen(chalk.blue("Exited without switching branches."), {
          padding: 1,
          borderStyle: "round",
          borderColor: "blue",
          margin: 1,
        })
      );
      console.log(
        chalk.gray("Tip: You can always exit with Esc or by selecting Exit.")
      );
      return;
    }

    if (selected === current) {
      console.log(
        boxen(
          chalk.yellow(`You are already on '${current}'. No branch switched.`),
          { padding: 1, borderStyle: "round", borderColor: "yellow", margin: 1 }
        )
      );
      console.log(
        chalk.gray("Tip: You can always exit with Esc or by selecting Exit.")
      );
      continue;
    }

    if (selected === "__create__") {
      const { newBranch } = await inquirer.prompt([
        {
          type: "input",
          name: "newBranch",
          message: "Enter new branch name:",
          validate: (input) =>
            input.trim() ? true : "Branch name cannot be empty",
        },
      ]);
      try {
        await git.checkoutLocalBranch(newBranch);
        console.log(
          boxen(chalk.green(`✔ Switched to new branch '${newBranch}'`), {
            padding: 1,
            borderStyle: "round",
            borderColor: "green",
            margin: 1,
          })
        );
      } catch (err) {
        console.error(
          boxen(chalk.red("Error creating branch:") + err.message, {
            padding: 1,
            borderStyle: "round",
            borderColor: "red",
            margin: 1,
          })
        );
      }
      continue;
    }

    // Switch branch
    try {
      await git.checkout(selected);
      console.log(
        boxen(chalk.green(`✔ Switched to branch '${selected}'`), {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        })
      );
      return;
    } catch (err) {
      console.error(
        boxen(chalk.red("Error switching branch:") + err.message, {
          padding: 1,
          borderStyle: "round",
          borderColor: "red",
          margin: 1,
        })
      );
      continue;
    }
  }
}
