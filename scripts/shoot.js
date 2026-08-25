#!/usr/bin/env node
/**
 * Responsive screenshot + layout audit.
 *
 * Loads every page at each breakpoint, captures a full-page screenshot, and
 * reports real layout faults: horizontal overflow, elements wider than the
 * viewport, tap targets under 44px, and console errors.
 *
 * Usage: node scripts/shoot.js [--widths=375,1440] [--out=dir]
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : fallback;
};

const OUT = arg("out", path.join(__dirname, "..", ".screens"));
// Full-page captures of long pages are very large; opt in when needed.
const FULL = process.argv.includes("--full");
const PROFILE = fs.mkdtempSync(
  path.join(require("os").tmpdir(), "altie-shoot-")
);
const WIDTHS = arg("widths", "320,375,430,768,1024,1440,1920")
  .split(",")
  .map(Number);

const PAGES = [
  ["home", "/"],
  ["journey", "/blog"],
  ["technology", "/technology"],

  ["career", "/career"],
  ["contact", "/contact"],
  ["education", "/education"],
  ["privacy", "/privacy"],
  ["404", "/nope"],
];

const findings = [];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    protocolTimeout: 120000,
    // A throwaway profile keeps this out of the user's real Chrome session
    // and avoids a stale lock when a previous run did not exit cleanly.
    userDataDir: PROFILE,
    args: [
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      ],
  });

  for (const width of WIDTHS) {
    for (const [name, route] of PAGES) {
      const page = await browser.newPage();
      const errors = [];
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      page.on("pageerror", (e) => errors.push(String(e)));

      await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
      await page.goto(BASE + route, { waitUntil: "networkidle2", timeout: 45000 });

      // Reveal everything so the capture shows the settled page.
      await page.evaluate(() => {
        document.documentElement.classList.remove("js-reveal");
        document
          .querySelectorAll("[data-reveal]")
          .forEach((el) => el.classList.add("is-visible"));
      });

      // Scroll the whole page so loading="lazy" images actually fetch, then
      // return to the top before capturing.
      await page.evaluate(async () => {
        // Bounded pass: tall pages would otherwise exceed the CDP timeout.
        const total = document.body.scrollHeight;
        const steps = Math.min(50, Math.ceil(total / window.innerHeight));
        for (let i = 0; i <= steps; i++) {
          window.scrollTo(0, (total / steps) * i);
          await new Promise((r) => setTimeout(r, 70));
        }
        window.scrollTo(0, 0);
      });
      // Wait for in-flight images, but never block on one that stalls.
      await page.evaluate(
        () =>
          new Promise((done) => {
            const pending = Array.from(document.images).filter((i) => !i.complete);
            if (!pending.length) return done();
            let left = pending.length;
            const tick = () => { if (--left <= 0) done(); };
            pending.forEach((i) => { i.onload = i.onerror = tick; });
            setTimeout(done, 9000);
          })
      );
      await new Promise((r) => setTimeout(r, 600));

      const audit = await page.evaluate((vw) => {
        const out = { overflow: null, wide: [], smallTargets: [] };

        const de = document.documentElement;
        if (de.scrollWidth > vw + 1) {
          out.overflow = { scrollWidth: de.scrollWidth, viewport: vw };
        }

        // Which elements actually stick out past the viewport?
        document.querySelectorAll("body *").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          if (r.right > vw + 1 || r.left < -1) {
            const style = getComputedStyle(el);
            if (style.position === "fixed") return;
            out.wide.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className || "").toString().slice(0, 60),
              left: Math.round(r.left),
              right: Math.round(r.right),
            });
          }
        });
        out.wide = out.wide.slice(0, 6);

        // Interactive targets should be reachable on touch.
        if (vw <= 768) {
          document.querySelectorAll("a, button, input, textarea").forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return;
            if (getComputedStyle(el).display === "contents") return;
            if (r.height < 24) {
              out.smallTargets.push({
                tag: el.tagName.toLowerCase(),
                text: (el.textContent || "").trim().slice(0, 34),
                h: Math.round(r.height),
              });
            }
          });
          out.smallTargets = out.smallTargets.slice(0, 8);
        }
        return out;
      }, width);

      if (audit.overflow)
        findings.push({ width, name, kind: "overflow", detail: audit.overflow });
      audit.wide.forEach((w) =>
        findings.push({ width, name, kind: "sticks-out", detail: w })
      );
      audit.smallTargets.forEach((t) =>
        findings.push({ width, name, kind: "tap-target", detail: t })
      );
      // The 404 route logs a console error for its own status code.
      if (name !== "404") {
        errors.forEach((e) =>
          findings.push({ width, name, kind: "console", detail: e.slice(0, 160) })
        );
      }

      await page.screenshot({
        path: path.join(OUT, `${width}-${name}.jpg`),
        type: "jpeg",
        quality: 72,
        fullPage: FULL,
      });
      await page.close();
    }
    process.stdout.write(`${width}px `);
  }

  await browser.close();
  fs.rmSync(PROFILE, { recursive: true, force: true });
  console.log("\n");

  if (!findings.length) {
    console.log("✓ No layout, tap-target or console problems found.");
    return;
  }
  const grouped = {};
  findings.forEach((f) => {
    const key = `${f.width}px · ${f.name}`;
    (grouped[key] = grouped[key] || []).push(f);
  });
  Object.entries(grouped).forEach(([k, items]) => {
    console.log(`\n${k}`);
    items.forEach((i) => console.log(`  [${i.kind}] ${JSON.stringify(i.detail)}`));
  });
  console.log(`\n${findings.length} finding(s).`);
  process.exitCode = 1;
})();
