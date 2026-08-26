#!/usr/bin/env node
/**
 * Vendors the three.js ES module build into static/design/vendor/.
 *
 * There is no frontend bundler here, and Firebase serves dist/ built locally,
 * so the library has to be committed rather than resolved from node_modules at
 * runtime. It is versioned by directory name — three.module.min.js hard-codes
 * a relative import of ./three.core.min.js, so the two files must stay together
 * and must not be renamed.
 *
 * Usage: node scripts/vendor-three.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const version = require(path.join(ROOT, "node_modules/three/package.json")).version;
const src = path.join(ROOT, "node_modules/three/build");
const out = path.join(ROOT, "static/design/vendor", "three-" + version);

const FILES = ["three.module.min.js", "three.core.min.js"];

fs.mkdirSync(out, { recursive: true });

let total = 0;
for (const f of FILES) {
  const from = path.join(src, f);
  if (!fs.existsSync(from)) {
    console.error("Missing " + from + " — run npm install first.");
    process.exit(1);
  }
  fs.copyFileSync(from, path.join(out, f));
  total += fs.statSync(from).size;
}

// Older vendored versions would otherwise linger in the repo and in dist/.
for (const dir of fs.readdirSync(path.join(ROOT, "static/design/vendor"))) {
  if (dir.startsWith("three-") && dir !== "three-" + version) {
    fs.rmSync(path.join(ROOT, "static/design/vendor", dir), { recursive: true, force: true });
    console.log("removed stale " + dir);
  }
}

// The scene modules import by exact path, so record the version for them.
fs.writeFileSync(
  path.join(ROOT, "static/design/vendor/three-version.json"),
  JSON.stringify({ version: version }, null, 2) + "\n"
);

console.log(`three ${version} vendored (${Math.round(total / 1024)} KB raw)`);
