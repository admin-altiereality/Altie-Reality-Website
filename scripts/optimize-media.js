#!/usr/bin/env node
/**
 * Generates WebP derivatives for every image the site references.
 *
 * Originals under static/images and static/assets are never modified. Output
 * lands in static/media/, mirroring the source path with a .webp extension,
 * and is committed so production needs no build step.
 *
 * Requires cwebp (brew install webp).
 *
 * Usage: node scripts/optimize-media.js [--check]
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const STATIC = path.join(ROOT, "static");
const OUT_ROOT = path.join(STATIC, "media");

// Widest the largest slot ever renders, doubled for high-density screens.
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1600;
const QUALITY = 80;

const SCAN_DIRS = [path.join(ROOT, "content"), path.join(ROOT, "templates")];

// Templates left over from the previous site that no route renders. They are
// kept for history but their (already broken) image refs are not our concern.
const LEGACY_VIEWS = new Set([
  "altiereality.hbs",
  "homecopy.hbs",
  "homeold.hbs",
  "profile.hbs",
  "portfolio-details.hbs",
  "blog.hbs",
  "login.hbs",
  "newpassword.hbs",
  "verifyemail.hbs",
  "navbar.hbs",
  "footer.hbs",
]);
const REF_RE = /["'](\/(?:images|assets)\/[^"']+\.(?:png|jpe?g|webp))["']/gi;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function collectRefs() {
  const refs = new Set();
  for (const dir of SCAN_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const file of walk(dir)) {
      if (!/\.(js|hbs)$/.test(file)) continue;
      if (LEGACY_VIEWS.has(path.basename(file))) continue;
      const text = fs.readFileSync(file, "utf8");
      let m;
      REF_RE.lastIndex = 0;
      while ((m = REF_RE.exec(text))) refs.add(decodeURIComponent(m[1]));
    }
  }
  return [...refs].sort();
}

function mb(bytes) {
  return (bytes / 1048576).toFixed(2) + " MB";
}

const refs = collectRefs();
const check = process.argv.includes("--check");

let srcTotal = 0;
let outTotal = 0;
let built = 0;
const missing = [];

for (const ref of refs) {
  const src = path.join(STATIC, ref.replace(/^\//, ""));
  if (!fs.existsSync(src)) {
    missing.push(ref);
    continue;
  }

  const dest = path.join(OUT_ROOT, ref.replace(/^\//, "").replace(/\.[^.]+$/, ".webp"));
  srcTotal += fs.statSync(src).size;

  const fresh =
    fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs;

  if (!fresh && !check) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    execFileSync("cwebp", [
      "-quiet",
      "-q", String(QUALITY),
      "-resize", String(MAX_WIDTH), "0",
      "-metadata", "none",
      src,
      "-o", dest,
    ]);
    // cwebp's -resize enlarges smaller sources; keep the original instead.
    if (fs.statSync(dest).size > fs.statSync(src).size) {
      execFileSync("cwebp", ["-quiet", "-q", String(QUALITY), "-metadata", "none", src, "-o", dest]);
    }
    built++;
  }

  if (fs.existsSync(dest)) outTotal += fs.statSync(dest).size;
}

console.log(`${refs.length} referenced images`);
if (missing.length) {
  console.log(`\nMISSING (${missing.length}):`);
  missing.forEach((m) => console.log("  " + m));
}
console.log(`\noriginals : ${mb(srcTotal)}`);
console.log(`webp      : ${mb(outTotal)}`);
if (srcTotal) {
  console.log(`saving    : ${(100 - (outTotal / srcTotal) * 100).toFixed(1)}%`);
}
if (!check) console.log(`\n${built} file(s) encoded.`);
if (missing.length) process.exitCode = 1;
