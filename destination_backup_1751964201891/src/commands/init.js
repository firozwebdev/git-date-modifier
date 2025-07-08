import boxen from "boxen";
import chalk from "chalk";
import simpleGit from "simple-git";
let inquirer;
async function getInquirer() {
  if (!inquirer) inquirer = (await import("inquirer")).default;
  return inquirer;
}
export default async function init() {
  const git = simpleGit();
  try {
    const isRepo = await git.checkIsRepo();
    if (isRepo) {
      console.log(
        boxen(chalk.yellow("This directory is already a git repository."), {
          padding: 1,
          borderStyle: "round",
          borderColor: "yellow",
          margin: 1,
        })
      );
      return;
    }
    await git.init();
    console.log(
      boxen(
        chalk.green("✔ Initialized a new git repository in this directory!"),
        {
          padding: 1,
          borderStyle: "round",
          borderColor: "green",
          margin: 1,
        }
      )
    );
    try {
      // --- Begin context-aware config logic (menu loop, polished UX) ---
      let done = false;
      let name = null, email = null, nameSrc = 'none', emailSrc = 'none';
      let globalName = null, globalEmail = null;
      // Use --local to check for local config only
      try {
        name = (await git.raw(["config", "--local", "--get", "user.name"]))?.trim();
        if (name) nameSrc = 'local';
      } catch {}
      try {
        email = (await git.raw(["config", "--local", "--get", "user.email"]))?.trim();
        if (email) emailSrc = 'local';
      } catch {}
      // Check global config
      try {
        globalName = (await git.raw(["config", "--get", "--global", "user.name"]))?.trim();
      } catch {}
      try {
        globalEmail = (await git.raw(["config", "--get", "--global", "user.email"]))?.trim();
      } catch {}
      // If not found locally, use global config
      if (!name && globalName) {
        name = globalName;
        nameSrc = 'global';
      }
      if (!email && globalEmail) {
        email = globalEmail;
        emailSrc = 'global';
      }
      const inq = await getInquirer();
      while (!done) {
        // Compose a professional, clear message for the user
        let configContext = '';
        let configDisplay = '';
        if (nameSrc === 'local' || emailSrc === 'local') {
          configContext = '\n\nNote: Local config applies only to this repository and overrides global config.';
          configDisplay = `Current Git user configuration for this repository:${configContext}\n\n  Name: ${name || '(not set)'}  [${nameSrc}]\n  Email: ${email || '(not set)'}  [${emailSrc}]`;
          if (globalName || globalEmail) {
            configDisplay += `\n\nGlobal config (available if local is cleared):\n  Name: ${globalName || '(not set)'}  [global]\n  Email: ${globalEmail || '(not set)'}  [global]`;
          }
        } else if (nameSrc === 'global' || emailSrc === 'global') {
          configContext = '\n\nNote: Global config applies to all repositories on this machine unless overridden locally.';
          configDisplay = `Current Git user configuration for this repository:${configContext}\n\n  Name: ${name || '(not set)'}  [${nameSrc}]\n  Email: ${email || '(not set)'}  [${emailSrc}]`;
        } else {
          configDisplay = `Current Git user configuration for this repository:\n\n  Name: ${name || '(not set)'}  [${nameSrc}]\n  Email: ${email || '(not set)'}  [${emailSrc}]`;
        }
        if (nameSrc === 'local' || emailSrc === 'local') {
          // Local config exists, offer keep/reset/clear
          const { action } = await inq.prompt([
            {
              type: "list",
              name: "action",
              message: `${configDisplay}\n\nWhat would you like to do?`,
              choices: [
                { name: "Keep current config (recommended if correct)", value: "keep" },
                { name: "Set a new name/email for this repository", value: "reset" },
                { name: "Clear local config (revert to global/system config)", value: "clear" }
              ]
            }
          ]);
          if (action === "reset") {
            try { await git.raw(["config", "--unset", "user.name"]); } catch {}
            try { await git.raw(["config", "--unset", "user.email"]); } catch {}
            const answers = await inq.prompt([
              {
                type: "input",
                name: "name",
                message: "Enter your name for this repository:",
                validate: v => v.trim() ? true : "Name cannot be empty."
              },
              {
                type: "input",
                name: "email",
                message: "Enter your email for this repository:",
                validate: v => /.+@.+\..+/.test(v) ? true : "Please enter a valid email address."
              }
            ]);
            await git.addConfig("user.name", answers.name);
            await git.addConfig("user.email", answers.email);
            console.log(boxen(chalk.green("✔ Git user config updated for this repository."), {
              padding: 1,
              borderStyle: "round",
              borderColor: "green",
              margin: 1,
            }));
            name = answers.name;
            email = answers.email;
            nameSrc = 'local';
            emailSrc = 'local';
            done = true;
          } else if (action === "clear") {
            const prevLocalName = nameSrc === 'local' ? name : null;
            const prevLocalEmail = emailSrc === 'local' ? email : null;
            try { await git.raw(["config", "--unset", "user.name"]); } catch {}
            try { await git.raw(["config", "--unset", "user.email"]); } catch {}
            let gName = null, gEmail = null;
            let gNameSrc = 'none', gEmailSrc = 'none';
            try {
              gName = (await git.raw(["config", "--local", "--get", "user.name"]))?.trim();
              if (gName) gNameSrc = 'local';
            } catch {}
            try {
              gEmail = (await git.raw(["config", "--local", "--get", "user.email"]))?.trim();
              if (gEmail) gEmailSrc = 'local';
            } catch {}
            if (!gName) {
              try {
                gName = (await git.raw(["config", "--get", "--global", "user.name"]))?.trim();
                if (gName) gNameSrc = 'global';
              } catch {}
            }
            if (!gEmail) {
              try {
                gEmail = (await git.raw(["config", "--get", "--global", "user.email"]))?.trim();
                if (gEmail) gEmailSrc = 'global';
              } catch {}
            }
            let msg = "Local config cleared.\n";
            msg += "\nPrevious local values:";
            msg += `\n  Name: ${prevLocalName || '(not set)'}`;
            msg += `\n  Email: ${prevLocalEmail || '(not set)'}`;
            msg += "\n\nNow using global/system config:";
            msg += `\n  Name: ${gName || '(not set)'}  [${gNameSrc}]`;
            msg += `\n  Email: ${gEmail || '(not set)'}  [${gEmailSrc}]`;
            if (gName || gEmail) {
              console.log(boxen(chalk.yellow(msg), {
                padding: 1,
                borderStyle: "round",
                borderColor: "yellow",
                margin: 1,
              }));
              name = gName;
              email = gEmail;
              nameSrc = gNameSrc;
              emailSrc = gEmailSrc;
            } else {
              console.log(boxen(chalk.yellow(msg + "\n\nNo global/system config found. Please set new values."), {
                padding: 1,
                borderStyle: "round",
                borderColor: "yellow",
                margin: 1,
              }));
              const answers = await inq.prompt([
                {
                  type: "input",
                  name: "name",
                  message: "Enter your name for this repository:",
                  validate: v => v.trim() ? true : "Name cannot be empty."
                },
                {
                  type: "input",
                  name: "email",
                  message: "Enter your email for this repository:",
                  validate: v => /.+@.+\..+/.test(v) ? true : "Please enter a valid email address."
                }
              ]);
              await git.addConfig("user.name", answers.name);
              await git.addConfig("user.email", answers.email);
              console.log(boxen(chalk.green("✔ Git user config set for this repository."), {
                padding: 1,
                borderStyle: "round",
                borderColor: "green",
                margin: 1,
              }));
              name = answers.name;
              email = answers.email;
              nameSrc = 'local';
              emailSrc = 'local';
              done = true;
            }
          } else {
            done = true;
          }
        } else if (name || email) {
          // Only global config exists, offer keep/reset
          const { action } = await inq.prompt([
            {
              type: "list",
              name: "action",
              message: `${configDisplay}\n\nWould you like to keep this config or set new values?`,
              choices: [
                { name: "Keep current config (recommended if correct)", value: "keep" },
                { name: "Set a new name/email for this repository", value: "reset" }
              ]
            }
          ]);
          if (action === "reset") {
            const answers = await inq.prompt([
              {
                type: "input",
                name: "name",
                message: "Enter your name for this repository:",
                validate: v => v.trim() ? true : "Name cannot be empty."
              },
              {
                type: "input",
                name: "email",
                message: "Enter your email for this repository:",
                validate: v => /.+@.+\..+/.test(v) ? true : "Please enter a valid email address."
              }
            ]);
            await git.addConfig("user.name", answers.name);
            await git.addConfig("user.email", answers.email);
            console.log(boxen(chalk.green("✔ Git user config updated for this repository."), {
              padding: 1,
              borderStyle: "round",
              borderColor: "green",
              margin: 1,
            }));
            name = answers.name;
            email = answers.email;
            nameSrc = 'local';
            emailSrc = 'local';
            done = true;
          } else {
            done = true;
          }
        } else {
          // Neither exists, prompt to set new
          console.log(boxen(chalk.yellow("No Git user.name or user.email is set for this repository or globally. Please provide your information."), {
            padding: 1,
            borderStyle: "round",
            borderColor: "yellow",
            margin: 1,
          }));
          const answers = await inq.prompt([
            {
              type: "input",
              name: "name",
              message: "Enter your name for this repository:",
              validate: v => v.trim() ? true : "Name cannot be empty."
            },
            {
              type: "input",
              name: "email",
              message: "Enter your email for this repository:",
              validate: v => /.+@.+\..+/.test(v) ? true : "Please enter a valid email address."
            }
          ]);
          await git.addConfig("user.name", answers.name);
          await git.addConfig("user.email", answers.email);
          console.log(boxen(chalk.green("✔ Git user config set for this repository."), {
            padding: 1,
            borderStyle: "round",
            borderColor: "green",
            margin: 1,
          }));
          name = answers.name;
          email = answers.email;
          nameSrc = 'local';
          emailSrc = 'local';
          done = true;
        }
      }
      // --- End context-aware config logic (menu loop, polished UX) ---
    } catch (e) {
      console.error("Error in config prompt logic:", e);
    }
  } catch (err) {
    console.error(
      boxen(chalk.red("Error initializing git repository: ") + err.message, {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
        margin: 1,
      })
    );
  }
}
