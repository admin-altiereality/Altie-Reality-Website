#!/usr/bin/env node
/**
 * Generates Open Graph share images.
 *
 * Social platforms want a ~1200x630 JPEG or PNG. Pointing og:image at a
 * source photograph ships multi-megabyte files, and WebP is unreliable across
 * scrapers, so each page's share image gets a cropped JPEG derivative in
 * static/media/og/.
 *
 * Requires ImageMagick (brew install imagemagick).
 *
 * Usage: node scripts/make-og.js
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const STATIC = path.join(ROOT, "static");
const OUT = path.join(STATIC, "media", "og");

const { ogSource, ogPath } = require("../content/og");

// Every distinct share image the site asks for, as a source path under static/.
const SOURCES = [...new Set(Object.values(ogSource))];

fs.mkdirSync(OUT, { recursive: true });

let built = 0;
let total = 0;
const missing = [];

for (const src of SOURCES) {
  const file = path.join(STATIC, src.replace(/^\//, ""));
  if (!fs.existsSync(file)) {
    missing.push(src);
    continue;
  }
  const dest = path.join(ROOT, "static", ogPath(src).replace(/^\//, ""));
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  const fresh =
    fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(file).mtimeMs;

  if (!fresh) {
    execFileSync("magick", [
      file,
      "-resize", "1200x630^",
      "-gravity", "center",
      "-extent", "1200x630",
      "-quality", "82",
      "-strip",
      dest,
    ]);
    built++;
  }
  total += fs.statSync(dest).size;
}

if (missing.length) {
  console.error("Missing OG sources:");
  missing.forEach((m) => console.error("  " + m));
  process.exitCode = 1;
}

console.log(`${SOURCES.length} share images (${Math.round(total / 1024)} KB total)`);
console.log(`${built} rebuilt.`);
