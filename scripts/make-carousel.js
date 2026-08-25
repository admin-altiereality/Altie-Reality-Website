#!/usr/bin/env node
/**
 * Generates the hero carousel textures.
 *
 * The sector images vary in size and aspect; the carousel wants a consistent
 * card ratio and small files, since all of them load before the hero settles.
 *
 * Requires ImageMagick.
 *
 * Usage: node scripts/make-carousel.js
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const STATIC = path.join(ROOT, "static");
const OUT = path.join(STATIC, "media", "carousel");

const { industries } = require("../content/site");

// Card face ratio; 16:10 reads well at the sizes the wheel renders.
const W = 640;
const H = 400;

fs.mkdirSync(OUT, { recursive: true });

let total = 0;
let built = 0;
const missing = [];

for (const industry of industries) {
  // Map the page's /media/... reference back to the original under static/.
  const bare = decodeURIComponent(industry.image).replace(/^\/media\//, "/");
  const stem = path.join(STATIC, bare.replace(/^\//, "")).replace(/\.[^.]+$/, "");
  const src = [".webp", ".jpg", ".jpeg", ".png"]
    .map((e) => stem + e)
    .find((f) => fs.existsSync(f));

  if (!src) {
    missing.push(industry.slug + " → " + bare);
    continue;
  }

  const dest = path.join(OUT, industry.slug + ".webp");
  const fresh =
    fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs;

  if (!fresh) {
    execFileSync("magick", [
      src,
      "-resize", `${W}x${H}^`,
      "-gravity", "center",
      "-extent", `${W}x${H}`,
      "-quality", "80",
      "-strip",
      dest,
    ]);
    built++;
  }
  total += fs.statSync(dest).size;
}

if (missing.length) {
  console.error("Missing carousel sources:");
  missing.forEach((m) => console.error("  " + m));
  process.exitCode = 1;
}

console.log(`${industries.length} carousel textures (${Math.round(total / 1024)} KB total)`);
console.log(`${built} rebuilt.`);
