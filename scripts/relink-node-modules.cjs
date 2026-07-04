// npm install replaces the node_modules symlink with a real directory, which
// would put tens of thousands of files back inside OneDrive sync. This
// postinstall hook moves them to ~/dev-cache/act-app and re-links.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const projectNm = path.join(__dirname, "..", "node_modules");
const cacheDir = path.join(os.homedir(), "dev-cache", "act-app");
const cacheNm = path.join(cacheDir, "node_modules");

const stat = fs.lstatSync(projectNm, { throwIfNoEntry: false });
if (!stat || stat.isSymbolicLink()) process.exit(0);

fs.mkdirSync(cacheDir, { recursive: true });
fs.rmSync(cacheNm, { recursive: true, force: true });
fs.renameSync(projectNm, cacheNm);
fs.symlinkSync(cacheNm, projectNm);
console.log("node_modules moved to ~/dev-cache/act-app and re-symlinked (OneDrive-safe)");
