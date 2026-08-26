#!/usr/bin/env node
/**
 * Colour contrast check against WCAG 2.1 AA.
 *
 * Reads the design tokens straight out of system.css so the check can never
 * drift from the palette it is meant to guard.
 *
 * Usage: node scripts/check-contrast.js
 */
const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(
  path.join(__dirname, "..", "static", "design", "system.css"),
  "utf8"
);

function token(name) {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!m) throw new Error(`token --${name} not found`);
  return m[1];
}

function luminance(hex) {
  const c = hex.replace("#", "");
  const v = [0, 2, 4]
    .map((i) => parseInt(c.substr(i, 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

function ratio(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// [label, foreground token, background token, minimum]
// 3.0 is the AA minimum for large text (>=24px, or >=18.7px bold).
const PAIRS = [
  ["body text on page", "text-1", "ink-000", 4.5],
  ["secondary text on page", "text-2", "ink-000", 4.5],
  ["tertiary text on page", "text-3", "ink-000", 4.5],
  ["secondary text on raised", "text-2", "ink-050", 4.5],
  ["accent text on page", "brand-bright", "ink-000", 4.5],
  ["signal text on page", "signal", "ink-000", 4.5],
  ["body text on paper", "text-1-inv", "paper-000", 4.5],
  ["secondary text on paper", "text-2-inv", "paper-000", 4.5],
  ["tertiary text on paper", "text-3-inv", "paper-000", 4.5],
  ["accent text on paper", "brand-deep", "paper-000", 4.5],
];

let failed = 0;

PAIRS.forEach(([label, fg, bg, min]) => {
  const r = ratio(token(fg), token(bg));
  const pass = r >= min;
  if (!pass) failed++;
  console.log(
    `${pass ? "  ✓" : "  ✗"} ${label.padEnd(28)} ${r.toFixed(2)}:1 (min ${min})`
  );
});

// Filled button: white label on the brand surface.
[["primary button", "brand"], ["primary button hover", "brand-hover"]].forEach(
  ([label, tok]) => {
    const r = ratio("#ffffff", token(tok));
    const pass = r >= 4.5;
    if (!pass) failed++;
    console.log(
      `${pass ? "  ✓" : "  ✗"} ${label.padEnd(28)} ${r.toFixed(2)}:1 (min 4.5)`
    );
  }
);

console.log(
  failed
    ? `\n${failed} pair(s) below WCAG AA.`
    : "\nAll token pairs meet WCAG 2.1 AA."
);
if (failed) process.exitCode = 1;
