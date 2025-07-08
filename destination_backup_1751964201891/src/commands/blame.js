import boxen from "boxen";
import chalk from "chalk";
import simpleGit from "simple-git";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}

export default async function blameCommand(file) {
  inquirer = await getInquirer();
  if (!file) {
    console.log(
      boxen(chalk.red("Please specify a file to blame."), {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
    return;
  }
  const git = simpleGit();
  let output;
  try {
    output = await git.raw(["blame", "--line-porcelain", file]);
  } catch (err) {
    console.log(
      boxen(chalk.red(`Error: ${err.message}`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
    return;
  }
  // Parse blame output
  const lines = output.split("\n");
  let blameLines = [];
  let current = {};
  for (let line of lines) {
    if (/^[0-9a-f]{40} /.test(line)) {
      if (current.line) blameLines.push(current);
      const [hash] = line.split(" ");
      current = { hash };
    } else if (line.startsWith("author ")) {
      current.author = line.replace("author ", "");
    } else if (line.startsWith("author-time ")) {
      const ts = parseInt(line.replace("author-time ", ""), 10);
      current.date = new Date(ts * 1000).toLocaleString();
    } else if (line.startsWith("summary ")) {
      current.summary = line.replace("summary ", "");
    } else if (line.startsWith("\t")) {
      current.line = line.replace("\t", "");
    }
  }
  if (current.line) blameLines.push(current);

  // Paginate if long
  const pageSize = 20;
  let page = 0;
  const totalPages = Math.ceil(blameLines.length / pageSize);
  while (true) {
    console.clear();
    console.log(
      boxen(chalk.blue(`Blame for ${file} (Page ${page + 1}/${totalPages})`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "blue",
        margin: 1,
      })
    );
    for (
      let i = page * pageSize;
      i < Math.min((page + 1) * pageSize, blameLines.length);
      i++
    ) {
      const b = blameLines[i];
      console.log(
        chalk.yellow(b.hash.slice(0, 8)) +
          " " +
          chalk.green(b.author) +
          " " +
          chalk.cyan(b.date) +
          " " +
          chalk.magenta(b.summary || "") +
          " | " +
          chalk.white(b.line)
      );
    }
    if (totalPages === 1) break;
    const { nav } = await inquirer.prompt([
      {
        type: "list",
        name: "nav",
        message: "Navigation:",
        choices: [
          {
            name: "Next page",
            value: "next",
            disabled: page >= totalPages - 1,
          },
          { name: "Previous page", value: "prev", disabled: page === 0 },
          { name: "Exit", value: "exit" },
        ],
      },
    ]);
    if (nav === "next") page++;
    else if (nav === "prev") page--;
    else break;
  }
}
