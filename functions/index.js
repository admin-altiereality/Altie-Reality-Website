/**
 * Contact and newsletter endpoints.
 *
 * The site is a static export, so these run as Cloud Functions behind Firebase
 * Hosting rewrites at /api/contact and /subscribe.
 *
 * Every submission is written to Firestore first. Email delivery is optional:
 * if the EMAIL_USER and EMAIL_PASS secrets are configured the function also
 * sends a notification, but a missing or failing mailbox never loses a
 * message and never fails the request.
 */
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const EMAIL_USER = defineSecret("EMAIL_USER");
const EMAIL_PASS = defineSecret("EMAIL_PASS");

const ALLOWED_ORIGINS = [
  "https://altiereality.com",
  "https://www.altiereality.com",
  "https://lexrn1.web.app",
  "https://lexrn1.firebaseapp.com",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Max-Age", "3600");
}

/** Trims and length-caps a field so a single request cannot store megabytes. */
function clean(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

/**
 * Rejects a client that has submitted too often in the last hour.
 * Uses a Firestore transaction so concurrent requests cannot race past it.
 */
async function rateLimited(kind, ip, max = 5) {
  const ref = db.collection("rateLimits").doc(`${kind}_${ip.replace(/[^\w.:-]/g, "_")}`);
  const hourAgo = Date.now() - 3600_000;

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const hits = (snap.exists ? snap.data().hits || [] : []).filter((t) => t > hourAgo);
    if (hits.length >= max) return true;
    hits.push(Date.now());
    tx.set(ref, { hits });
    return false;
  });
}

async function sendMail(subject, text, replyTo) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    logger.info("Email secrets not configured; stored in Firestore only.");
    return;
  }
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  await transporter.sendMail({ from: user, to: user, replyTo, subject, text });
}

exports.contact = onRequest(
  { region: "asia-south1", secrets: [EMAIL_USER, EMAIL_PASS], cors: false },
  async (req, res) => {
    applyCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed." });

    const name = clean(req.body?.name, 120);
    const email = clean(req.body?.email, 200);
    const subject = clean(req.body?.subject, 200);
    const message = clean(req.body?.message, 5000);

    if (!name || !message || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Please provide your name, a valid email and a message." });
    }

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
    if (await rateLimited("contact", ip)) {
      return res.status(429).json({ message: "Too many messages from this address. Please try again later." });
    }

    try {
      await db.collection("contactSubmissions").add({
        name, email, subject, message, ip,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      logger.error("Failed to store contact submission", err);
      return res.status(500).json({ message: "We could not record your message. Please email us directly." });
    }

    try {
      await sendMail(
        subject || "New contact form submission",
        `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
        email
      );
    } catch (err) {
      // The message is already saved, so a mail failure is not a client error.
      logger.error("Stored submission but email delivery failed", err);
    }

    return res.status(200).json({ message: "Message received." });
  }
);

exports.subscribe = onRequest(
  { region: "asia-south1", cors: false },
  async (req, res) => {
    applyCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed." });

    const email = clean(req.body?.email, 200).toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
    if (await rateLimited("subscribe", ip, 10)) {
      return res.status(429).json({ message: "Too many attempts. Please try again later." });
    }

    try {
      // The email is the document id, so re-subscribing is idempotent.
      await db.collection("subscribers").doc(email).set(
        { email, createdAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    } catch (err) {
      logger.error("Failed to store subscriber", err);
      return res.status(500).json({ message: "Subscription failed. Please try again." });
    }

    return res.status(200).json({ message: "Subscribed." });
  }
);
