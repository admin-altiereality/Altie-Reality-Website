/**
 * Handlebars helpers and shared view locals.
 *
 * Registering locals once as middleware keeps every route handler free of
 * boilerplate — routes stay declarative, content stays in content/.
 */
const fs = require("fs");
const path = require("path");
const hbs = require("hbs");

const { company, social, products, industries } = require("./site");

/**
 * Fingerprint for the design assets.
 *
 * Static files are served with a one-year/one-day cache, so without a
 * changing URL a deploy would not reach returning visitors. Stamping the
 * newest mtime of the design bundle makes every change a new URL.
 */
const DESIGN_DIR = path.join(__dirname, "..", "static", "design");

function assetVersion() {
  try {
    const newest = fs
      .readdirSync(DESIGN_DIR)
      .map((f) => fs.statSync(path.join(DESIGN_DIR, f)).mtimeMs)
      .reduce((a, b) => Math.max(a, b), 0);
    return Math.floor(newest).toString(36);
  } catch (err) {
    return "0";
  }
}

// Computed once per boot in production; recomputed per request in development
// so edits are picked up without a restart.
const STATIC_VERSION = assetVersion();
const isDev = process.env.NODE_ENV !== "production";

hbs.registerHelper("eq", (a, b) => a === b);
hbs.registerHelper("json", (value) => JSON.stringify(value));

// 1-based index, zero-padded — used for numbered card sequences.
hbs.registerHelper("num", (index) => String(index + 1).padStart(2, "0"));

// Renders a value as raw JSON-LD, escaping the sequences that could break
// out of a <script> element.
hbs.registerHelper("jsonld", (value) =>
  new hbs.SafeString(
    JSON.stringify(value)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
  )
);

/**
 * Express middleware: attaches company facts and page defaults to res.locals.
 */
// A static export has no Node runtime behind it, so the templates need to
// know which mode they are rendering for.
const STATIC_MODE = process.env.ALTIE_STATIC === "1";
const SITE_URL = process.env.ALTIE_SITE_URL || company.domain;

function viewLocals(req, res, next) {
  const url = `${SITE_URL}${req.originalUrl.split("?")[0]}`;

  res.locals.company = company;
  res.locals.social = social;
  res.locals.products = products;
  res.locals.industries = industries;
  res.locals.year = new Date().getFullYear();
  res.locals.v = isDev ? assetVersion() : STATIC_VERSION;
  res.locals.staticMode = STATIC_MODE;
  res.locals.apiOrigin = company.apiOrigin;
  res.locals.hasBackend = company.hasBackend;

  // Per-page metadata; every view overrides what it needs.
  res.locals.meta = {
    title: "Altie Reality — Immersive technology for the spatial computing era",
    description: company.boilerplate.slice(0, 155),
    canonical: url,
    image: `${SITE_URL}/assets/img/logo.png`,
    ogType: "website",
  };

  next();
}

/**
 * Builds a page's <head> metadata, falling back to the site defaults.
 */
function pageMeta(req, overrides = {}) {
  const path = req.originalUrl.split("?")[0];
  return {
    title: overrides.title
      ? `${overrides.title} — Altie Reality`
      : "Altie Reality — Immersive technology for the spatial computing era",
    description: overrides.description || company.boilerplate.slice(0, 155),
    canonical: `${SITE_URL}${path}`,
    image: overrides.image
      ? `${SITE_URL}${overrides.image}`
      : `${SITE_URL}/assets/img/logo.png`,
    ogType: overrides.ogType || "website",
  };
}

/** Organization schema, reused across every page. */
function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.legalName,
    alternateName: company.brandName,
    url: SITE_URL,
    logo: `${SITE_URL}/assets/img/logo.png`,
    email: company.email,
    telephone: company.phone,
    foundingDate: company.founded,
    description: company.boilerplate,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${company.address.line1}, ${company.address.line2}`,
      addressLocality: company.address.city,
      addressRegion: company.address.region,
      postalCode: company.address.postalCode,
      addressCountry: company.address.countryCode,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: company.email,
      telephone: company.phone,
      areaServed: "IN",
      availableLanguage: ["en", "hi"],
    },
    sameAs: social.map((s) => s.url),
  };
}

/** Breadcrumb schema from a list of { name, href } pairs. */
function breadcrumbSchema(crumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.href}`,
    })),
  };
}

module.exports = {
  viewLocals,
  pageMeta,
  organizationSchema,
  breadcrumbSchema,
  SITE_URL,
  STATIC_MODE,
};
