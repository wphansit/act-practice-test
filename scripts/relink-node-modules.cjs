// OPTIONAL dev-only workaround for developing inside a file-syncing folder
// (OneDrive, Dropbox, iCloud, …), where a real node_modules directory gets
// synced by the client and can break the install or slow it to a crawl. It
// relocates node_modules to ~/dev-cache/act-app and symlinks it back.
//
// OPT-IN BY DESIGN: this only does anything on a machine that already has that
// cache directory. A normal `npm install` for contributors (no cache dir) is a
// complete no-op, so nobody's node_modules is ever moved unexpectedly.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const cacheDir = path.join(os.homedir(), "dev-cache", "act-app");
if (!fs.existsSync(cacheDir)) process.exit(0); // not opted in on this machine

const projectNm = path.join(__dirname, "..", "node_modules");
const cacheNm = path.join(cacheDir, "node_modules");

const stat = fs.lstatSync(projectNm, { throwIfNoEntry: false });
if (!stat || stat.isSymbolicLink()) process.exit(0); // already linked

fs.rmSync(cacheNm, { recursive: true, force: true });
fs.renameSync(projectNm, cacheNm);
fs.symlinkSync(cacheNm, projectNm);
console.log("dev: node_modules relocated to ~/dev-cache/act-app and re-symlinked");
