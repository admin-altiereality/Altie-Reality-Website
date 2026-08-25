const express = require("express");
const router = express.Router();
const auth = require("../autorisation/auth");

const { company, products, industries } = require("../content/site");
const { milestones, recognition } = require("../content/timeline");
const {
  team,
  capabilities,
  learnxrFeatures,
  learnxrPillars,
  xrtouchFeatures,
  xrtouchUseCases,
  roles,
  testimonials,
} = require("../content/company");
const {
  pageMeta,
  organizationSchema,
  breadcrumbSchema,
} = require("../content/helpers");

const productBySlug = Object.fromEntries(products.map((p) => [p.slug, p]));

/* ------------------------------------------------------------------ Home */
router.get("/", (req, res) => {
  res.render("home", {
    meta: pageMeta(req, {
      title: null,
      description:
        "Altie Reality builds immersive learning platforms, XR interaction hardware and enterprise simulation — shipping on Meta Quest, Android and the web from Jaipur, India.",
      image: "/assets/img/portfolio/portfolio-1.png",
    }),
    schema: [
      organizationSchema(),
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: company.brandName,
        url: company.domain,
        publisher: { "@type": "Organization", name: company.legalName },
      },
    ],
    recognition,
    capabilities,
    learnxrFeatures,
    team,
    testimonials,
    featured: milestones.filter((m) => m.featured).slice(0, 4),
  });
});

/* -------------------------------------------------------------- Journey */
router.get("/blog", (req, res) => {
  // Group milestones by year, newest first, preserving the site's own order.
  const byYear = [];
  milestones
    .slice()
    .sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1))
    .forEach((m) => {
      let group = byYear.find((g) => g.year === m.year);
      if (!group) {
        group = { year: m.year, entries: [] };
        byYear.push(group);
      }
      group.entries.push({
        ...m,
        // Lowercased haystack powers the client-side filter.
        search: [m.title, m.summary, m.place, m.kind, (m.tags || []).join(" ")]
          .join(" ")
          .toLowerCase(),
      });
    });

  res.render("journey", {
    meta: pageMeta(req, {
      title: "Journey & Achievements",
      description:
        "Milestones from Altie Reality: the Meta XR Startup Program, G20-DIA Summit, GITEX EUROPE, ViennaUP, NIDHI PRAYAS and the launch of LearnXR on the Meta Quest Store.",
      image: "/images/gitex-europe-2025.png",
    }),
    schema: [
      breadcrumbSchema([
        { name: "Home", href: "/" },
        { name: "Journey", href: "/blog" },
      ]),
    ],
    byYear,
    total: milestones.length,
    recognition,
  });
});

/* ------------------------------------------------------------- Products */
router.get("/products/learnxr", (req, res) => {
  const product = productBySlug.learnxr;
  res.render("product-learnxr", {
    meta: pageMeta(req, {
      title: "LearnXR™ — XR + AI learning platform",
      description:
        "LearnXR delivers interactive, self-paced, curriculum-aligned learning on Meta Quest 2 & 3, Android and Cardboard VR, with teacher tooling and learning analytics.",
      image: "/assets/img/portfolio/portfolio-1.png",
      ogType: "product",
    }),
    schema: [
      breadcrumbSchema([
        { name: "Home", href: "/" },
        { name: "Products", href: "/products/learnxr" },
        { name: "LearnXR", href: "/products/learnxr" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "LearnXR",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Meta Quest, Android",
        url: "https://learnxr.altiereality.com",
        publisher: { "@type": "Organization", name: company.legalName },
      },
    ],
    product,
    learnxrFeatures,
    learnxrPillars,
    testimonials,
  });
});

router.get("/XRtouch", (req, res) => {
  res.render("product-xrtouch", {
    meta: pageMeta(req, {
      title: "XRtouch — 6DoF controller for XR",
      description:
        "XRtouch is a wireless handheld controller that pairs with a head-mounted display to navigate virtual and augmented environments through buttons, sensors and haptic feedback.",
      image: "/images/6DOF.jpg",
      ogType: "product",
    }),
    schema: [
      breadcrumbSchema([
        { name: "Home", href: "/" },
        { name: "Products", href: "/XRtouch" },
        { name: "XRtouch", href: "/XRtouch" },
      ]),
    ],
    product: productBySlug.xrtouch,
    xrtouchFeatures,
    xrtouchUseCases,
  });
});

// Products whose depth lives on an external property get a concise page
// rather than an invented one.
["reliconnect", "metamatch"].forEach((slug) => {
  router.get(`/products/${slug}`, (req, res) => {
    const product = productBySlug[slug];
    res.render("product-simple", {
      meta: pageMeta(req, {
        title: `${product.name} — ${product.summary}`,
        description: product.blurb,
        image: product.image,
        ogType: "product",
      }),
      schema: [
        breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Products", href: product.href },
          { name: product.name, href: product.href },
        ]),
      ],
      product,
    });
  });
});

/* ----------------------------------------------------------- Technology */
router.get("/technology", (req, res) => {
  res.render("technology", {
    meta: pageMeta(req, {
      title: "Technology",
      description:
        "AR, VR and mixed reality, applied AI, real-time 3D, multi-user environments and XR input hardware — the capabilities behind every Altie Reality product.",
      image: "/images/6doff.jpg",
    }),
    schema: [
      breadcrumbSchema([
        { name: "Home", href: "/" },
        { name: "Technology", href: "/technology" },
      ]),
    ],
    capabilities,
  });
});

/* -------------------------------------------------------------- Company */
router.get("/company", (req, res) => {
  res.render("company", {
    meta: pageMeta(req, {
      title: "Company",
      description:
        "Altie Reality Private Limited builds immersive products from Bhamashah Technohub, Jaipur — recognised by the Meta XR Startup Program, MeitY, FITT IIT Delhi, iStart Rajasthan and SPTBI Mumbai.",
      image: "/assets/img/teamabout.jpg",
    }),
    schema: [
      organizationSchema(),
      breadcrumbSchema([
        { name: "Home", href: "/" },
        { name: "Company", href: "/company" },
      ]),
    ],
    team,
    recognition,
    featured: milestones.filter((m) => m.featured),
  });
});

/* -------------------------------------------------------------- Careers */
router.get("/career", (req, res) => {
  res.render("career", {
    meta: pageMeta(req, {
      title: "Careers",
      description:
        "Internships at Altie Reality in Unity development, Flutter, 3D art, business development and sales — building immersive products in Jaipur.",
      image: "/images/unity.jpg",
    }),
    schema: [
      breadcrumbSchema([
        { name: "Home", href: "/" },
        { name: "Careers", href: "/career" },
      ]),
    ],
    roles,
  });
});

/* -------------------------------------------------------------- Contact */
router.get("/contact", (req, res) => {
  res.render("contact", {
    meta: pageMeta(req, {
      title: "Contact",
      description:
        "Talk to Altie Reality about immersive learning, XR hardware or enterprise simulation. Bhamashah Technohub, Jaipur.",
    }),
    schema: [
      organizationSchema(),
      breadcrumbSchema([
        { name: "Home", href: "/" },
        { name: "Contact", href: "/contact" },
      ]),
    ],
  });
});

/* ------------------------------------------------------------ Solutions */
industries.forEach((industry) => {
  router.get(industry.route, (req, res) => {
    res.render("industry", {
      meta: pageMeta(req, {
        title: industry.title,
        description: industry.lead.slice(0, 155),
        image: industry.image,
      }),
      schema: [
        breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Solutions", href: industry.route },
          { name: industry.name, href: industry.route },
        ]),
      ],
      industry,
      related: industry.relatedProduct
        ? productBySlug[industry.relatedProduct]
        : null,
      others: industries.filter((i) => i.slug !== industry.slug).slice(0, 3),
    });
  });
});

/* ------------------------------------------------------- Legal & static */
const legalPages = [
  { route: "/privacy", view: "privacy", title: "Privacy Policy" },
  {
    route: "/termsandconditions",
    view: "termsandconditions",
    title: "Terms and Conditions",
  },
  {
    route: "/reliconnectprivacy",
    view: "reliconnectprivacy",
    title: "ReliconnectVR Privacy Policy",
  },
  {
    route: "/reliconnecttermsandconditions",
    view: "reliconnecttermsandconditions",
    title: "ReliconnectVR Terms and Conditions",
  },
  {
    route: "/creditsandlicenses",
    view: "creditsandlicenses",
    title: "Credits and Licenses",
  },
];

legalPages.forEach(({ route, view, title }) => {
  router.get(route, (req, res) => {
    res.render(view, {
      meta: pageMeta(req, { title, description: `${title} — ${company.legalName}.` }),
      schema: [
        breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: title, href: route },
        ]),
      ],
      pageTitle: title,
    });
  });
});

/* ------------------------------------------------ Preserved auth routes */
router.get("/contactus", auth, (req, res) => {
  // Kept for backwards compatibility with the previous authenticated route.
  res.redirect(301, "/contact");
});

router.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.clearCookie("google-token");
  res.redirect("/");
});

/* ------------------------------------------------------------ Redirects */
// Routes the old site linked to but never had a template for, plus renamed
// paths. Redirecting preserves any inbound links and search equity.
const redirects = {
  "/aerospace": "/automotive",
  "/industrial-machinery": "/automotive",
  "/blog-single": "/blog",
  "/portfolio-details": "/products/learnxr",
  "/xrsense": "/XRtouch",
  "/forms/contact.php": "/contact",
  "/about": "/company",
  "/services": "/technology",
  "/terms": "/termsandconditions",
};

Object.entries(redirects).forEach(([from, to]) => {
  router.get(from, (req, res) => res.redirect(301, to));
});

/* ---------------------------------------------------------- SEO plumbing */
router.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(
    ["User-agent: *", "Allow: /", "", `Sitemap: ${company.domain}/sitemap.xml`, ""].join("\n")
  );
});

router.get("/sitemap.xml", (req, res) => {
  const urls = [
    { loc: "/", priority: "1.0" },
    { loc: "/products/learnxr", priority: "0.9" },
    { loc: "/XRtouch", priority: "0.8" },
    { loc: "/products/reliconnect", priority: "0.7" },
    { loc: "/products/metamatch", priority: "0.7" },
    { loc: "/technology", priority: "0.8" },
    { loc: "/company", priority: "0.8" },
    { loc: "/blog", priority: "0.8" },
    { loc: "/career", priority: "0.6" },
    { loc: "/contact", priority: "0.7" },
    ...industries.map((i) => ({ loc: i.route, priority: "0.7" })),
    ...legalPages.map((p) => ({ loc: p.route, priority: "0.3" })),
  ];

  const body = urls
    .map(
      (u) =>
        `  <url><loc>${company.domain}${u.loc}</loc><priority>${u.priority}</priority></url>`
    )
    .join("\n");

  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  );
});

module.exports = router;
