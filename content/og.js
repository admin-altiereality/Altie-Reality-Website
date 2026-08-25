/**
 * Share-image sources, keyed by the image a page asks for.
 *
 * Pages reference content images that may be WebP or very large; social
 * scrapers need a modest JPEG. pageMeta() maps through here so a page never
 * has to know about the derivative.
 */
const path = require("path");

// Page image → the original file the share image is cut from.
const ogSource = {
  default: "/assets/img/teamabout.jpg",
  "/assets/img/teamabout.jpg": "/assets/img/teamabout.jpg",
  "/media/images/education%202.webp": "/images/education 2.webp",
  "/media/images/medicala%202.webp": "/images/medicala 2.jpg",
  "/media/images/defence%202.webp": "/images/defence 2.webp",
  "/media/images/architectue.webp": "/images/architectue.jpg",
  "/media/images/automotive%202.webp": "/images/automotive 2.webp",
  "/media/images/game.webp": "/images/game.jpg",
  "/media/images/3dd.webp": "/images/3dd.jpg",
  "/images/gitex-europe-2025.png": "/images/gitex-europe-2025.png",
  "/images/6doff.jpg": "/images/6doff.jpg",
  "/images/unity.jpg": "/images/unity.jpg",
};

/** Derivative path for a given source, e.g. /media/og/teamabout.jpg */
function ogPath(source) {
  const base = path
    .basename(decodeURIComponent(source))
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase();
  return `/media/og/${base}.jpg`;
}

/** Resolves whatever a page passed as its image to a share-ready JPEG. */
function shareImage(image) {
  const source = ogSource[image] || ogSource.default;
  return ogPath(source);
}

module.exports = { ogSource, ogPath, shareImage };
