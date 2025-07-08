import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import os from "os";

function quoteIfNeeded(p) {
  // Only quote if not already quoted
  if (p.startsWith('"') && p.endsWith('"')) return p;
  return p.includes(" ") ? `"${p}"` : p;
}

function findTsxBin() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // On Windows, the local binary is tsx.cmd
  const isWin = os.platform() === "win32";
  const localTsx = path.resolve(__dirname, "../../node_modules/.bin/tsx" + (isWin ? ".cmd" : ""));
  if (fs.existsSync(localTsx)) {
    return quoteIfNeeded(localTsx);
  }
  // Fallback to global tsx
  return "tsx";
}

export default async function rcEdit() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const rcEditPath = quoteIfNeeded(path.resolve(__dirname, "../../bin/rc-edit.jsx"));
  const tsxBin = findTsxBin();

  // Build the command as a single string for shell: true
  const cmd = `${tsxBin} ${rcEditPath}`;

  const result = spawnSync(cmd, {
    stdio: "inherit",
    shell: true,
  });

  process.exit(result.status || 0);
}
