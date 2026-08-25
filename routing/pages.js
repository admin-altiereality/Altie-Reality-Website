const express = require("express");
const router = express.Router();
const auth = require("../autorisation/auth");

const { company, products, industries } = require("../content/site");
const { milestones, recognition } = require("../content/timeline");
const {
  team,
  capabilities,
  roles,
  testimonials,
} = require("../content/company");
const {
  pageMeta,
  organizationSchema,
  breadcrumbSchema,
  SITE_URL,
} = require("../content/helpers");

const productBySlug = Object.fromEntries(products.map((p) => [p.slug, p]));

/* ------------------------------------------------------------------ Home */
router.get("/", (req, res) => {
  res.render("home", {
    meta: pageMeta(req, {
      title: null,
      description:
        "Altie Reality builds extended reality experiences for Meta Quest — LearnXR for immersive classrooms and Digital Twins of real environments. Jaipur, India.",
      image: "/assets/img/teamabout.jpg",
    }),
    schema: [
      organizationSchema(),
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: company.brandName,
        url: SITE_URL,
        publisher: { "@type": "Organization", name: company.legalName },
      },
    ],
    recognition,
    capabilities,
    team,
    testimonials,
    featured: milestones.filter((m) => m.featured).slice(0, 4),
    // Hero carousel cards, one per published sector.
    carousel: industries.map((i) => ({
      src: `/media/carousel/${i.slug}.webp`,
      label: i.name,
    })),
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
    // Range comes from the data, so it can never claim a year with no
    // milestone behind it.
    yearFrom: byYear[byYear.length - 1].year,
    yearTo: byYear[0].year,
    recognition,
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
  "/company": "/#company",
  "/about": "/#company",
  "/products/learnxr": "https://learnxr.altiereality.com",
  "/products/reliconnect": "/",
  "/products/metamatch": "/",
  "/XRtouch": "/technology",
  "/aerospace": "/automotive",
  "/industrial-machinery": "/automotive",
  "/blog-single": "/blog",
  "/portfolio-details": "https://learnxr.altiereality.com",
  "/xrsense": "/technology",
  "/forms/contact.php": "/contact",
  "/services": "/technology",
  "/terms": "/termsandconditions",
};

Object.entries(redirects).forEach(([from, to]) => {
  router.get(from, (req, res) => res.redirect(301, to));
});

/* ---------------------------------------------------------- SEO plumbing */
router.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(
    ["User-agent: *", "Allow: /", "", `Sitemap: ${SITE_URL}/sitemap.xml`, ""].join("\n")
  );
});

router.get("/sitemap.xml", (req, res) => {
  const urls = [
    { loc: "/", priority: "1.0" },
    { loc: "/technology", priority: "0.8" },
    { loc: "/blog", priority: "0.8" },
    { loc: "/career", priority: "0.6" },
    { loc: "/contact", priority: "0.7" },
    ...industries.map((i) => ({ loc: i.route, priority: "0.7" })),
    ...legalPages.map((p) => ({ loc: p.route, priority: "0.3" })),
  ];

  const body = urls
    .map(
      (u) =>
        `  <url><loc>${SITE_URL}${u.loc}</loc><priority>${u.priority}</priority></url>`
    )
    .join("\n");

  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  );
});

module.exports = router;
