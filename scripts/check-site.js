/**
 * Site QA crawler.
 *
 * Fetches every route, then checks:
 *  - HTTP status of each page
 *  - every internal asset and link resolves (no 404s)
 *  - images have alt attributes
 *  - each page has exactly one <h1>, a title, a description and a canonical
 *  - no duplicate element ids
 *
 * Usage: node scripts/check-site.js [baseUrl]
 */
const BASE = process.argv[2] || "http://localhost:3000";

const { products, industries } = require("../content/site");

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
  "/robots.txt",
  "/sitemap.xml",
  "/this-route-does-not-exist",
];

const problems = [];
const assetCache = new Map();

function note(route, kind, detail) {
  problems.push({ route, kind, detail });
}

async function headOk(url) {
  if (assetCache.has(url)) return assetCache.get(url);
  let ok = false;
  try {
    const res = await fetch(url, { method: "GET" });
    ok = res.status >= 200 && res.status < 400;
  } catch (err) {
    ok = false;
  }
  assetCache.set(url, ok);
  return ok;
}

function attrs(html, tag, attr) {
  const re = new RegExp(`<${tag}\\b[^>]*?\\b${attr}\\s*=\\s*"([^"]*)"`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

async function checkRoute(route) {
  const expected404 = route === "/this-route-does-not-exist";
  let res, html;
  try {
    res = await fetch(BASE + route);
    html = await res.text();
  } catch (err) {
    note(route, "fetch", err.message);
    return;
  }

  const wanted = expected404 ? 404 : 200;
  if (res.status !== wanted) {
    note(route, "status", `expected ${wanted}, got ${res.status}`);
  }

  if (route.endsWith(".txt") || route.endsWith(".xml")) return;

  // --- head metadata ---
  if (!/<title>[^<]{5,}<\/title>/i.test(html)) note(route, "seo", "missing or empty <title>");
  if (!/name="description" content="[^"]{20,}"/i.test(html))
    note(route, "seo", "missing meta description");
  if (!expected404 && !/rel="canonical"/i.test(html))
    note(route, "seo", "missing canonical link");

  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1s !== 1) note(route, "a11y", `expected 1 <h1>, found ${h1s}`);

  // --- duplicate ids ---
  const ids = attrs(html, "[a-z][a-z0-9-]*", "id");
  const seen = new Set();
  ids.forEach((id) => {
    if (seen.has(id)) note(route, "html", `duplicate id "${id}"`);
    seen.add(id);
  });

  // --- images ---
  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  for (const tag of imgTags) {
    if (!/\balt\s*=/.test(tag)) {
      note(route, "a11y", `img without alt: ${tag.slice(0, 90)}`);
    }
    const src = (tag.match(/\bsrc\s*=\s*"([^"]*)"/) || [])[1];
    if (src && src.startsWith("/")) {
      if (!(await headOk(BASE + src))) note(route, "asset", `broken image ${src}`);
    }
  }

  // --- stylesheets and scripts ---
  for (const href of attrs(html, "link", "href")) {
    if (href.startsWith("/") && !(await headOk(BASE + href)))
      note(route, "asset", `broken stylesheet/icon ${href}`);
  }
  for (const src of attrs(html, "script", "src")) {
    if (src.startsWith("/") && !(await headOk(BASE + src)))
      note(route, "asset", `broken script ${src}`);
  }

  // --- internal links ---
  for (const href of attrs(html, "a", "href")) {
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const path = href.split("#")[0];
    if (!path) continue;
    if (!(await headOk(BASE + path))) note(route, "link", `broken internal link ${href}`);
  }

  // --- external links must carry rel=noopener ---
  const anchors = html.match(/<a\b[^>]*target="_blank"[^>]*>/gi) || [];
  anchors.forEach((a) => {
    if (!/rel="[^"]*noopener/i.test(a))
      note(route, "security", `target=_blank without rel=noopener: ${a.slice(0, 80)}`);
  });
}

(async () => {
  for (const route of ROUTES) {
    process.stdout.write(".");
    await checkRoute(route);
  }
  process.stdout.write("\n\n");

  if (!problems.length) {
    console.log(`✓ ${ROUTES.length} routes checked, no problems found.`);
    return;
  }

  const byRoute = {};
  problems.forEach((p) => {
    (byRoute[p.route] = byRoute[p.route] || []).push(p);
  });

  Object.entries(byRoute).forEach(([route, items]) => {
    console.log(`\n${route}`);
    items.forEach((i) => console.log(`  [${i.kind}] ${i.detail}`));
  });
  console.log(`\n${problems.length} problem(s) across ${Object.keys(byRoute).length} route(s).`);
  process.exitCode = 1;
})();
