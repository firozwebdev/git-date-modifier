import fs from "fs";
import path from "path";

function getHistoryPath() {
  return path.resolve(process.cwd(), ".gitmat-history.json");
}

function readHistory() {
  const file = getHistoryPath();
  if (!fs.existsSync(file)) return { actions: [], undone: [] };
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return { actions: [], undone: [] };
  }
}

function writeHistory(data) {
  fs.writeFileSync(getHistoryPath(), JSON.stringify(data, null, 2));
}

// Supports all action types: commit, branch, tag, stash, reset, unstage, stash-create, etc.
function addAction(action) {
  const data = readHistory();
  data.actions.push(action);
  writeHistory(data);
}

function getLastAction() {
  const data = readHistory();
  return data.actions[data.actions.length - 1];
}

function popLastAction() {
  const data = readHistory();
  const action = data.actions.pop();
  writeHistory(data);
  return action;
}

function addUndone(action) {
  const data = readHistory();
  data.undone.push(action);
  writeHistory(data);
}

function getLastUndone() {
  const data = readHistory();
  return data.undone[data.undone.length - 1];
}

function popLastUndone() {
  const data = readHistory();
  const action = data.undone.pop();
  writeHistory(data);
  return action;
}

export default {
  addAction,
  getLastAction,
  popLastAction,
  addUndone,
  getLastUndone,
  popLastUndone,
};
