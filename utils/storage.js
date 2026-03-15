const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function fileFor(key) {
  ensureDir();
  return path.join(dataDir, `${key}.json`);
}

function readJson(key, fallback = {}) {
  try {
    const file = fileFor(key);
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function writeJson(key, value) {
  const file = fileFor(key);
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

module.exports = {
  readJson,
  writeJson
};
