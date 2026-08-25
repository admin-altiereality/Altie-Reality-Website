#!/usr/bin/env node
/**
 * Static export.
 *
 * Boots the Express app, fetches every route, and writes the rendered HTML
 * into dist/ alongside a copy of static/. The result is a plain static site
 * that Firebase Hosting can serve, with real per-route HTML rather than a
 * single catch-all page.
 *
 * Usage:
 *   node scripts/prerender.js --site-url=https://lexrn1.web.app [--out=dist]
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : fallback;
};

const ROOT = path.join(__dirname, "..");
const OUT = path.resolve(ROOT, arg("out", "dist"));
const SITE_URL = arg("site-url", "https://www.altiereality.com").replace(/\/$/, "");
const PORT = Number(arg("port", "4321"));
// app.js binds to "localhost", which resolves to ::1 on some hosts, so
// address it by name rather than by 127.0.0.1.
const BASE = `http://localhost:${PORT}`;

const { industries } = require("../content/site");

const ROUTES = [
  "/",
  "/blog",
  "/technology",

  "/career",
  "/contact",
  ...industries.map((i) => i.route),
  "/privacy",
  "/termsandconditions",
  "/reliconnectprivacy",
  "/reliconnecttermsandconditions",
  "/creditsandlicenses",
];

const FILES = ["/robots.txt", "/sitemap.xml"];

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

function bytes(n) {
  return n > 1048576 ? (n / 1048576).toFixed(2) + " MB" : Math.round(n / 1024) + " KB";
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  console.log(`Static export → ${path.relative(ROOT, OUT)}/`);
  console.log(`Site URL      → ${SITE_URL}\n`);

  const server = spawn(process.execPath, [path.join(ROOT, "app.js")], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(PORT),
      ALTIE_STATIC: "1",
      ALTIE_SITE_URL: SITE_URL,
      NODE_ENV: "production",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const serverLog = [];
  server.stdout.on("data", (d) => serverLog.push(String(d)));
  server.stderr.on("data", (d) => serverLog.push(String(d)));

  // Wait for the port to answer.
  let up = false;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(BASE + "/", { signal: AbortSignal.timeout(1500) });
      if (r.ok) { up = true; break; }
    } catch (_) { /* not listening yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!up) {
    server.kill();
    console.error("Server did not start.\n" + serverLog.join(""));
    process.exit(1);
  }

  let total = 0;
  let count = 0;

  async function write(route, filePath) {
    const res = await fetch(BASE + route, { redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      throw new Error(
        `${route} redirects to ${res.headers.get("location")} — remove it from ROUTES`
      );
    }
    if (res.status !== 200) throw new Error(`${route} → HTTP ${res.status}`);
    const body = await res.text();
    if (/<title>\s*<\/title>/.test(body)) throw new Error(`${route} rendered without a title`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, body);
    total += Buffer.byteLength(body);
    count++;
  }

  try {
    for (const route of ROUTES) {
      // Each route becomes a directory index so paths resolve without
      // relying on Hosting's cleanUrls rewriting.
      const target =
        route === "/"
          ? path.join(OUT, "index.html")
          : path.join(OUT, route.replace(/^\//, ""), "index.html");
      await write(route, target);
      process.stdout.write(".");
    }

    for (const file of FILES) {
      await write(file, path.join(OUT, file.replace(/^\//, "")));
      process.stdout.write(".");
    }

    // The 404 page must be a top-level file for Hosting's errorPage.
    const res = await fetch(BASE + "/__not_found__");
    if (res.status !== 404) throw new Error("404 handler did not return 404");
    fs.writeFileSync(path.join(OUT, "404.html"), await res.text());
    count++;
    process.stdout.write(".\n");
  } catch (err) {
    server.kill();
    console.error("\nPrerender failed: " + err.message);
    process.exit(1);
  }

  server.kill();

  // Copy only the assets the rendered pages actually reference. Copying
  // static/ wholesale would ship ~80 MB of superseded originals.
  const referenced = new Set(["/favicon.ico"]);
  const ASSET_RE =
    /(?:src|href)="(\/[^"]+?\.(?:png|jpe?g|webp|svg|css|js|ico|woff2?))(?:\?[^"]*)?"/g;
  const META_RE =
    /<meta[^>]+(?:property="og:image"|name="twitter:image")[^>]+content="([^"]+)"/g;
  // Assets can also be named inside inline JSON — the hero carousel declares
  // its textures that way — so quoted absolute paths are collected too.
  const JSON_RE =
    /"(\/(?:media|images|assets)\/[^"\\]+?\.(?:png|jpe?g|webp|svg|ico|woff2?))"/g;

  (function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { scan(full); continue; }
      if (!/\.(html|css)$/.test(entry.name)) continue;
      const text = fs.readFileSync(full, "utf8");
      let m;
      ASSET_RE.lastIndex = 0;
      while ((m = ASSET_RE.exec(text))) {
        referenced.add(decodeURIComponent(m[1].split("?")[0]));
      }

      // Social share images live in meta content attributes as absolute
      // URLs, so they are invisible to the src/href scan above.
      JSON_RE.lastIndex = 0;
      while ((m = JSON_RE.exec(text))) {
        referenced.add(decodeURIComponent(m[1]));
      }

      META_RE.lastIndex = 0;
      while ((m = META_RE.exec(text))) {
        const url = m[1].startsWith(SITE_URL)
          ? m[1].slice(SITE_URL.length)
          : m[1];
        if (url.startsWith("/")) referenced.add(decodeURIComponent(url.split("?")[0]));
      }
    }
  })(OUT);

  let copied = 0;
  const missingAssets = [];
  for (const ref of referenced) {
    const src =
      ref === "/favicon.ico"
        ? path.join(ROOT, "favicon.ico")
        : path.join(ROOT, "static", ref.replace(/^\//, ""));
    if (!fs.existsSync(src)) { missingAssets.push(ref); continue; }
    const dest = path.join(OUT, ref.replace(/^\//, ""));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    copied++;
  }

  if (missingAssets.length) {
    console.error("\nMissing assets:");
    missingAssets.forEach((a) => console.error("  " + a));
    process.exit(1);
  }

  // A build that ships no stylesheet or script is broken even though every
  // page rendered, so assert the essentials rather than trusting the scan.
  const REQUIRED = [
    ...industries.map((i) => `media/carousel/${i.slug}.webp`),
    "design/system.css",
    "design/components.css",
    "design/site.js",
    "design/hero.js",
    "assets/img/logo.png",
  ];
  const absent = REQUIRED.filter((r) => !fs.existsSync(path.join(OUT, r)));
  if (absent.length) {
    console.error("\nBuild is missing required assets:");
    absent.forEach((a) => console.error("  " + a));
    process.exit(1);
  }

  function measure(dir) {
    let n = 0;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      n += e.isDirectory() ? measure(p) : fs.statSync(p).size;
    }
    return n;
  }

  console.log(`\n${count} pages rendered (${bytes(total)} of HTML)`);
  console.log(`${copied} assets copied`);
  console.log(`dist total: ${bytes(measure(OUT))}`);
})();
