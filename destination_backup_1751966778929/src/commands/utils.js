import fs from "fs";
import path from "path";

/**
 * Checks if the current or any parent directory is a git repository.
 * @param {string} [startDir=process.cwd()] - Directory to start searching from.
 * @returns {string|false} - The path to the git repo root, or false if not found.
 */
export function isGitRepo(startDir = process.cwd()) {
  let dir = path.resolve(startDir);
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, ".git"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return false;
} 