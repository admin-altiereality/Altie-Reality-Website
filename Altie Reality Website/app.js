const express = require("express");
const app = express();
const favicon = require("serve-favicon");
const bcrypt = require("bcrypt");
const path = require("path");
const hbs = require("hbs"); //only needed for using varible thing or using common template to other hbs files or else without including this we can run normal hbs files just by setting our engine template to hbs
const cookieParser = require("cookie-parser"); //to get cookie from users browse
// require("./mongoose");
// const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer'); // Import nodemailer
// const connectDB = require('./db'); // Import the database connection module
require('dotenv').config();
const rateLimit = require('express-rate-limit');
app.set('trust proxy', 1);

const port = process.env.PORT || 3000;
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
app.use(express.static(staticpath));
app.use(cookieParser()); //to get cookie from browser
const templatepath = path.join(__dirname, "/templates/views");
const commonfiledir = path.join(__dirname, "/templates/common");
app.use(require("./routing/pages"));
app.use(require("./routing/signinsignuplogout"));
app.use(require("./routing/resetpassword"));
app.use(require("./routing/verifyemail"));
app.use(require("./routing/google-signin").router);
hbs.registerPartials(commonfiledir);
app.set("view engine", "hbs");
app.set("views", templatepath); //matlab abhi tak jo jum views folder mai doondh rahe the vo ab tum templatepath naam ke folder mai  doondho... and we know view is default name for folder for template engine or view engine which is now not found in locally as we have moved it inside templates folder so we have to do this

// Connect to MongoDB
// connectDB(); // Call the connection function

// Comment out MongoDB schema and model
/*
const subscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
});

const Subscriber = mongoose.model('Subscriber', subscriberSchema);
*/

// Enable CORS for all origins in development
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://altiereality.com', 'https://www.altiereality.com']
        : '*',
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Modify the subscribe endpoint to work without MongoDB
app.post('/subscribe', async (req, res) => {
    const email = req.body.email;
    if (email) {
        console.log(`New subscription attempt: ${email}`);
        return res.status(200).json({ message: "Subscription successful!" });
    }
    return res.status(400).json({ message: "Invalid email address." });
});

// Modify the subscribers endpoint to work without MongoDB
app.get('/subscribers', async (req, res) => {
    res.status(200).json({ message: "Database connection not available" });
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

// Add this with your other routes
app.get('/learnxr-labs', (req, res) => {
  res.render('learnxr-labs');
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Server is accessible from other devices on your network`);
});
