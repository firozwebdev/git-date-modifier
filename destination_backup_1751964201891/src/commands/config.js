const inquirer = require("inquirer");
const simpleGit = require("simple-git");
const chalk = require("chalk");
const boxen = require("boxen");
const history = require("./history");

const configKeys = [
  { key: "user.name", label: "User Name", bn: "ইউজার নাম" },
  { key: "user.email", label: "User Email", bn: "ইউজার ইমেইল" },
  { key: "alias", label: "Aliases", bn: "এলিয়াস" },
];

module.exports = async function configCommand() {
  const git = simpleGit();
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What do you want to do? (আপনি কী করতে চান?)",
      choices: [
        { name: "View config (কনফিগ দেখুন)", value: "view" },
        { name: "Set config (কনফিগ সেট করুন)", value: "set" },
        { name: "Exit (বের হন)", value: "exit" },
      ],
    },
  ]);
  if (action === "exit") return;

  if (action === "view") {
    const config = await git.raw(["config", "--list"]);
    console.log(
      boxen(chalk.cyan(config), {
        padding: 1,
        borderStyle: "round",
        borderColor: "cyan",
        margin: 1,
      })
    );
    return;
  }

  // Set config
  const { key } = await inquirer.prompt([
    {
      type: "list",
      name: "key",
      message: "Which config do you want to set? (কোন কনফিগ সেট করতে চান?)",
      choices: configKeys.map((c) => ({
        name: `${c.label} (${c.bn})`,
        value: c.key,
      })),
    },
  ]);

  let valuePrompt = "Enter value";
  if (key === "user.name") valuePrompt = "Enter user name (ইউজার নাম দিন)";
  if (key === "user.email") valuePrompt = "Enter user email (ইউজার ইমেইল দিন)";
  if (key === "alias") valuePrompt = "Enter alias (এলিয়াস দিন)";

  const { value } = await inquirer.prompt([
    {
      type: "input",
      name: "value",
      message: valuePrompt,
    },
  ]);

  // Get previous value for undo
  let prev = null;
  try {
    prev = (await git.raw(["config", "--get", key])).trim();
  } catch {}

  // Set config
  await git.raw(["config", key, value]);
  history.addAction({ type: "config", key, prev, value });
  console.log(
    boxen(chalk.green(`✔ Set ${key} to '${value}'`), {
      padding: 1,
      borderStyle: "round",
      borderColor: "green",
      margin: 1,
    })
  );
};
