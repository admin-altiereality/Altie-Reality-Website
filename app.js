const express = require("express");
const app = express();
const favicon = require("serve-favicon");
const bcrypt = require("bcrypt");
const path = require("path");
const hbs = require("hbs"); //only needed for using varible thing or using common template to other hbs files or else without including this we can run normal hbs files just by setting our engine template to hbs
const cookieParser = require("cookie-parser"); //to get cookie from users browse
require("./mongoose");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer'); // Import nodemailer
const connectDB = require('./db'); // Import the database connection module
const { isDBConnected } = require('./db');
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');

// Performance and security middleware
app.set('trust proxy', 1);
app.use(helmet({
    contentSecurityPolicy: false, // Disable for now to avoid breaking existing functionality
    crossOriginEmbedderPolicy: false
}));
app.use(compression()); // Enable gzip compression

const port = 3000;
app.use(favicon(path.join(__dirname, "favicon.ico")));
app.use(express.json());
app.use(
    express.urlencoded({
        extended: false,
    })
);


//if use below files then only static files will run and if we dont use these then we can use dynamic files with pug or hbs
//Note:: also if there is not index.html file found in static folder then also by default it will run below code

const staticpath = path.join(__dirname, "static");
// Serve static files with caching headers
app.use(express.static(staticpath, {
    maxAge: '1y', // Cache static assets for 1 year
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Set different cache times for different file types
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for HTML
        } else if (path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day for JS/CSS
        } else if (path.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year for images
        }
    }
}));
app.use(cookieParser()); //to get cookie from browser
const templatepath = path.join(__dirname, "/templates/views");
const commonfiledir = path.join(__dirname, "/templates/common");

// View engine and partials are configured before the routers mount so that
// every route renders against a fully registered template environment.
hbs.registerPartials(commonfiledir);
app.set("view engine", "hbs");
app.set("views", templatepath);

// Company facts, navigation and page metadata defaults for every view.
const { viewLocals } = require("./content/helpers");
app.use(viewLocals);

app.use(require("./routing/pages"));
app.use(require("./routing/signinsignuplogout"));
app.use(require("./routing/resetpassword"));
app.use(require("./routing/verifyemail"));
app.use(require("./routing/google-signin").router); //matlab abhi tak jo jum views folder mai doondh rahe the vo ab tum templatepath naam ke folder mai  doondho... and we know view is default name for folder for template engine or view engine which is now not found in locally as we have moved it inside templates folder so we have to do this

// Connect to MongoDB
connectDB(); // Call the connection function

// Define a schema for subscribers
const subscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
});

const Subscriber = mongoose.model('Subscriber', subscriberSchema);

app.use(cors({
    origin: ['https://altiereality.com', 'https://www.altiereality.com']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Handle POST request to /subscribe
app.post('/subscribe', async (req, res) => {
    if (!isDBConnected()) {
        return res.status(503).json({
            message: "Newsletter signup is temporarily unavailable. Please email us instead."
        });
    }

    const email = req.body.email;
    if (email) {
        try {
            const newSubscriber = new Subscriber({ email });
            await newSubscriber.save();
            console.log(`New subscription: ${email}`);
            return res.status(200).json({ message: "Subscription successful!" });
        } catch (error) {
            console.error('Error saving subscriber:', error);
            return res.status(400).json({ message: "Email already subscribed or invalid." });
        }
    }
    return res.status(400).json({ message: "Invalid email address." });
});

// Handle GET request to /subscribers
app.get('/subscribers', async (req, res) => {
    if (!isDBConnected()) {
        return res.status(503).json({ message: 'Database unavailable.' });
    }

    try {
        const allSubscribers = await Subscriber.find();
        res.status(200).json(allSubscribers);
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 8 // limit each IP to 5 requests per windowMs
});

// Handle POST request to /api/contact for the contact form
app.post('/api/contact', limiter, async (req, res) => {
    console.log('Received form data:', req.body);

    const { name, email, subject, message } = req.body;

    // Debug log to check if environment variables are loaded
    console.log('Email credentials loaded:', {
        user: process.env.EMAIL_USER ? 'Present' : 'Missing',
        pass: process.env.EMAIL_PASS ? 'Present' : 'Missing'
    });

    // Validate required fields
    if (!name || !email || !message) {
        return res.status(400).json({ 
            message: "Please provide all required fields." 
        });
    }

    // Set up nodemailer transporter with more secure settings
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        debug: true, // Enable debug logs
        logger: true  // Log to console
    });

    const mailOptions = {
        from: {
            name: name,
            address: process.env.EMAIL_USER
        },
        replyTo: email,
        to: process.env.EMAIL_USER,
        subject: subject || 'New Contact Form Submission',
        text: `
Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}
        `,
        html: `
<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<p><strong>Message:</strong> ${message}</p>
        `
    };

    try {
        // Verify transporter connection
        await transporter.verify();
        console.log('Transporter verified successfully');
        
        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return res.status(200).json({ 
            message: "Email sent successfully!" 
        });
    } catch (error) {
        console.error('Error sending email:', error);
        
        // More detailed error response
        if (error.code === 'EAUTH') {
            return res.status(500).json({ 
                message: "Email authentication failed. Please check credentials.",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
        
        return res.status(500).json({ 
            message: "Error sending email. Please try again later." 
        });
    }
});

// 404 — must be registered after every route.
app.use((req, res) => {
    res.status(404).render("404", {
        meta: {
            title: "Page not found — Altie Reality",
            description: "The page you are looking for does not exist.",
            canonical: "https://www.altiereality.com" + req.originalUrl,
            image: "https://www.altiereality.com/assets/img/logo.png",
            ogType: "website",
        },
    });
});

process.on('unhandledRejection', (reason) => {
    // Log rather than exit: a background failure must not take the site down.
    console.error('Unhandled rejection:', reason);
});

app.listen(port, "localhost", () => {
    console.log(`working on port ${port}`);
});
