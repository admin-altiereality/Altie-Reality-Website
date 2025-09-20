const fs = require('fs');
const path = require('path');
const hbs = require('hbs');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy static assets
const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
};

// Copy static directory to dist
console.log('Copying static assets...');
const staticDir = path.join(__dirname, 'static');
if (fs.existsSync(staticDir)) {
    copyDir(staticDir, distDir);
}

// Copy favicon
const favicon = path.join(__dirname, 'favicon.ico');
if (fs.existsSync(favicon)) {
    fs.copyFileSync(favicon, path.join(distDir, 'favicon.ico'));
}

// Register partials
const partialsDir = path.join(__dirname, 'templates', 'common');
if (fs.existsSync(partialsDir)) {
    hbs.registerPartials(partialsDir);
}

// Define pages to build
const pages = [
    { template: 'home.hbs', output: 'index.html' },
    { template: 'altiereality.hbs', output: 'altiereality.html' },
    { template: 'architecture.hbs', output: 'architecture.html' },
    { template: 'automotive.hbs', output: 'automotive.html' },
    { template: 'blog.hbs', output: 'blog.html' },
    { template: 'career.hbs', output: 'career.html' },
    { template: 'defence.hbs', output: 'defence.html' },
    { template: 'education.hbs', output: 'education.html' },
    { template: 'gaming.hbs', output: 'gaming.html' },
    { template: 'medical.hbs', output: 'medical.html' },
    { template: 'privacy.hbs', output: 'privacy.html' },
    { template: 'termsandconditions.hbs', output: 'termsandconditions.html' },
    { template: 'creditsandlicenses.hbs', output: 'creditsandlicenses.html' },
    { template: 'xrsense.hbs', output: 'xrsense.html' },
    { template: 'xrtouch.hbs', output: 'xrtouch.html' },
    { template: 'realestatexr.hbs', output: 'realestatexr.html' },
    { template: 'portfolio-details.hbs', output: 'portfolio-details.html' },
    { template: 'reliconnectprivacy.hbs', output: 'reliconnectprivacy.html' },
    { template: 'reliconnecttermsandconditions.hbs', output: 'reliconnecttermsandconditions.html' },
    { template: '404.hbs', output: '404.html' }
];

// Build each page
console.log('Building HTML pages...');
const templatesDir = path.join(__dirname, 'templates', 'views');

pages.forEach(page => {
    const templatePath = path.join(templatesDir, page.template);
    
    if (fs.existsSync(templatePath)) {
        try {
            const templateContent = fs.readFileSync(templatePath, 'utf8');
            const template = hbs.compile(templateContent);
            
            // You can add context data here if needed
            const context = {
                // Add any dynamic data your templates might need
            };
            
            const html = template(context);
            const outputPath = path.join(distDir, page.output);
            
            fs.writeFileSync(outputPath, html);
            console.log(`✓ Built ${page.output}`);
        } catch (error) {
            console.error(`✗ Error building ${page.template}:`, error.message);
        }
    } else {
        console.warn(`⚠ Template not found: ${page.template}`);
    }
});

console.log('Build completed! Files are ready in the dist directory.');
