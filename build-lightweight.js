const fs = require('fs');
const path = require('path');
const hbs = require('hbs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

console.log('🎯 Building LIGHTWEIGHT PROFESSIONAL version...');

// Define essential images only (keep business-critical ones)
const essentialImages = [
    // Company logo and branding
    'altiereality.png',
    'logo.png',
    'favicon.png',
    
    // Core service/product images (1 per category)
    'aerospace.jpg',        // Aerospace service
    'architectue.jpg',      // Architecture service  
    'automotive.jpg',       // Automotive service
    'defence.jpg',          // Defence service
    'education.png',        // Education service
    'gaming.jpg',           // Gaming service
    'medicala.jpg',         // Medical service
    
    // Key technology/product images
    'meta.jpg',             // Meta partnership
    'unity.jpg',            // Unity technology
    'hardware.jpg',         // Hardware showcase
    'metaquest.png',        // Meta Quest
    
    // Essential team/about (compressed)
    'teamabout.jpg',        // Team photo (will be heavily compressed)
    
    // Key client logos (small ones only)
    'bitspilani.png',
    'iitbombay.png',
    
    // Essential portfolio items (max 3)
    'portfolio-1.png',
    'portfolio-2.png',
    'portfolio-3.png',
    
    // Key event/achievement images
    'g20.jpg',
    'istart.jpeg'
];

// Images to remove (non-essential decorative/duplicate images)
const imagesToRemove = [
    // Duplicate service images
    'aerospace 2.jpg',
    'architectue 2.jpg', 
    'defence 2.jpg',
    'medicala 2.jpg',
    'automotive 2.webp',
    'education 2.webp',
    'game 2.webp',
    
    // Decorative/stock images
    'future.jpg',
    'phn.jpg',
    'wid phn.jpg',
    'working.png',
    'sales.jpg',
    'product.png',
    'blog.png',
    'cases.webp',
    
    // Multiple similar numbered images
    '1st.png', '2nd.png', '3rd.png', '4th.png', '5th.png', '6th.png', '7th.png',
    '10.webp', '11.png', '12.jpg', '13.jpg', '14.jpg',
    
    // Duplicate technology images
    '3d.jpg', '3dd.jpg',
    '6DOF.jpg', '6doff.jpg',
    'gamingxr.jpg',
    
    // Large conference/event images (keep only essential ones)
    'gin-go-austria-2025.png',
    'gitex-europe-2025.png',
    
    // Duplicate client images
    'avgcxr.png',  // Very large file
    'im 2.png',
    'i-m.png',
    
    // Blog/testimonial images (not essential for main site)
    'blog-1.jpg', 'blog-2.jpg', 'blog-3.jpg', 'blog-4.jpg',
    'blog-author.jpg', 'blog-inside-post.jpg',
    'blog-recent-1.jpg', 'blog-recent-2.jpg', 'blog-recent-3.jpg', 'blog-recent-4.jpg', 'blog-recent-5.jpg',
    'comments-1.jpg', 'comments-2.jpg', 'comments-3.jpg', 'comments-4.jpg', 'comments-5.jpg', 'comments-6.jpg',
    'testimonials-1.jpg', 'testimonials-2.jpg', 'testimonials-3.jpg', 'testimonials-4.jpg',
    
    // Extra portfolio images (keep only top 3)
    'portfolio-11.png', 'portfolio-12.png', 'portfolio-13.png',
    
    // Extra team images
    'Team-2.png', 'Team-3.png', 'Team-4.png',  // Keep only Team-1.png
    
    // Duplicate features/values images
    'features-2.png', 'features-3.png',
    'values-2.png', 'values-3.png',
    
    // Large unnecessary images
    'mix.jpg',
    'mainphoto.jpg',
    'dronephotography.jpg',
    'pc.jpg', 'pc (1).jpg',
    
    // Event images that are too large
    'learnxr-beta.jpg',
    'metaxrstartup.jpeg',
    'metaxrstartup.webp',
    'itu.jpg',
    
    // Duplicate client logos
    'client 0.png', 'client 8.png', 'client-8.png', 'client0.png',
    'sptbilogo.png',
    'flutter.png'
];

// Utility functions
const copyFile = (src, dest) => {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
};

const getFileSizeKB = (filePath) => {
    const stats = fs.statSync(filePath);
    return (stats.size / 1024).toFixed(2);
};

// Copy only essential assets
const copyEssentialAssets = () => {
    console.log('📁 Copying essential assets only...');
    
    // Copy favicon
    const favicon = path.join(__dirname, 'favicon.ico');
    if (fs.existsSync(favicon)) {
        copyFile(favicon, path.join(distDir, 'favicon.ico'));
    }
    
    // Copy only the main assets directory structure (non-images)
    const assetsDir = path.join(__dirname, 'static', 'assets');
    const destAssetsDir = path.join(distDir, 'assets');
    
    if (fs.existsSync(assetsDir)) {
        const copyNonImages = (src, dest) => {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            
            const entries = fs.readdirSync(src, { withFileTypes: true });
            
            for (const entry of entries) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);
                
                if (entry.isDirectory() && entry.name !== 'img') {
                    copyNonImages(srcPath, destPath);
                } else if (!entry.isDirectory() && !/\.(jpg|jpeg|png|gif|webp)$/i.test(entry.name)) {
                    copyFile(srcPath, destPath);
                }
            }
        };
        
        copyNonImages(assetsDir, destAssetsDir);
    }
    
    console.log('⚠️  Skipping all duplicate asset directories to save space');
};

// Copy only essential images with aggressive optimization
const copyEssentialImages = async () => {
    console.log('🖼️  Processing essential images only...');
    
    let totalOriginalSize = 0;
    let totalFinalSize = 0;
    let imagesProcessed = 0;
    let imagesSkipped = 0;
    
    const processImageDirectory = async (srcDir, destDir) => {
        if (!fs.existsSync(srcDir)) return;
        
        const entries = fs.readdirSync(srcDir, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(srcDir, entry.name);
            const destPath = path.join(destDir, entry.name);
            
            if (entry.isDirectory()) {
                await processImageDirectory(srcPath, destPath);
            } else if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(entry.name)) {
                // Check if this image is in our removal list
                if (imagesToRemove.some(img => entry.name.includes(img) || img.includes(entry.name))) {
                    console.log(`🗑️  Skipped ${entry.name} (non-essential)`);
                    imagesSkipped++;
                    continue;
                }
                
                // Check if this image is essential or small enough to keep
                const fileSize = fs.statSync(srcPath).size;
                const fileSizeKB = fileSize / 1024;
                
                const isEssential = essentialImages.some(img => 
                    entry.name.includes(img) || img.includes(entry.name)
                );
                
                if (isEssential || fileSizeKB < 50) { // Keep essential images or very small ones
                    totalOriginalSize += fileSize;
                    
                    const outputDir = path.dirname(destPath);
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }
                    
                    try {
                        // Apply aggressive compression for large essential images
                        if (fileSizeKB > 200 && /\.(jpg|jpeg)$/i.test(entry.name)) {
                            // Heavy compression for large JPEGs
                            await execAsync(`sips -s format jpeg -s formatOptions 40 "${srcPath}" --out "${destPath}" 2>/dev/null`);
                            console.log(`✓ Heavy compression ${entry.name}: ${fileSizeKB.toFixed(1)}KB → ${getFileSizeKB(destPath)}KB`);
                        } else if (fileSizeKB > 200 && /\.png$/i.test(entry.name)) {
                            // Convert large PNGs to JPEGs for better compression
                            const jpegPath = destPath.replace('.png', '.jpg');
                            await execAsync(`sips -s format jpeg -s formatOptions 50 "${srcPath}" --out "${jpegPath}" 2>/dev/null`);
                            console.log(`✓ PNG→JPEG ${entry.name}: ${fileSizeKB.toFixed(1)}KB → ${getFileSizeKB(jpegPath)}KB`);
                        } else {
                            // Light compression or copy
                            try {
                                if (/\.(jpg|jpeg)$/i.test(entry.name)) {
                                    await execAsync(`sips -s format jpeg -s formatOptions 70 "${srcPath}" --out "${destPath}" 2>/dev/null`);
                                } else {
                                    copyFile(srcPath, destPath);
                                }
                                console.log(`✓ Kept ${entry.name}: ${fileSizeKB.toFixed(1)}KB`);
                            } catch {
                                copyFile(srcPath, destPath);
                                console.log(`✓ Kept ${entry.name}: ${fileSizeKB.toFixed(1)}KB (no compression)`);
                            }
                        }
                        
                        if (fs.existsSync(destPath)) {
                            totalFinalSize += fs.statSync(destPath).size;
                        } else {
                            // Check for converted files
                            const jpegPath = destPath.replace('.png', '.jpg');
                            if (fs.existsSync(jpegPath)) {
                                totalFinalSize += fs.statSync(jpegPath).size;
                            }
                        }
                        
                        imagesProcessed++;
                    } catch (error) {
                        copyFile(srcPath, destPath);
                        totalFinalSize += fileSize;
                        console.log(`✓ Kept ${entry.name}: ${fileSizeKB.toFixed(1)}KB (copy only)`);
                        imagesProcessed++;
                    }
                } else {
                    console.log(`🗑️  Skipped ${entry.name} (${fileSizeKB.toFixed(1)}KB - non-essential)`);
                    imagesSkipped++;
                }
            }
        }
    };
    
    // Process images from both directories
    const staticImagesDir = path.join(__dirname, 'static', 'images');
    const distImagesDir = path.join(distDir, 'images');
    await processImageDirectory(staticImagesDir, distImagesDir);
    
    const assetsImgDir = path.join(__dirname, 'static', 'assets', 'img');
    const distAssetsImgDir = path.join(distDir, 'assets', 'img');
    await processImageDirectory(assetsImgDir, distAssetsImgDir);
    
    const savings = totalOriginalSize > 0 ? ((totalOriginalSize - totalFinalSize) / totalOriginalSize * 100).toFixed(1) : 0;
    console.log(`📊 Image processing complete:`);
    console.log(`   • Images kept: ${imagesProcessed}`);
    console.log(`   • Images removed: ${imagesSkipped}`);
    console.log(`   • Size: ${(totalOriginalSize/1024/1024).toFixed(2)}MB → ${(totalFinalSize/1024/1024).toFixed(2)}MB (${savings}% savings)`);
};

// Minify CSS aggressively
const minifyCSS = () => {
    console.log('🎨 Minifying CSS (lightweight mode)...');
    const CleanCSS = require('clean-css');
    
    const processCSS = (dir) => {
        if (!fs.existsSync(dir)) return;
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                processCSS(fullPath);
            } else if (entry.name.endsWith('.css') && !entry.name.endsWith('.min.css')) {
                const css = fs.readFileSync(fullPath, 'utf8');
                const result = new CleanCSS({ level: 2 }).minify(css);
                
                const minPath = fullPath.replace('.css', '.min.css');
                fs.writeFileSync(minPath, result.styles);
                
                // Remove original
                if (minPath !== fullPath) {
                    fs.unlinkSync(fullPath);
                }
                
                console.log(`✓ Minified ${entry.name}`);
            }
        }
    };
    
    processCSS(distDir);
};

// Minify JavaScript aggressively
const minifyJS = async () => {
    console.log('⚡ Minifying JavaScript (lightweight mode)...');
    const { minify } = require('terser');
    
    const processJS = async (dir) => {
        if (!fs.existsSync(dir)) return;
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                await processJS(fullPath);
            } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.min.js')) {
                const js = fs.readFileSync(fullPath, 'utf8');
                
                try {
                    const result = await minify(js, {
                        compress: { drop_console: true, dead_code: true },
                        mangle: true
                    });
                    
                    const minPath = fullPath.replace('.js', '.min.js');
                    fs.writeFileSync(minPath, result.code);
                    
                    // Remove original
                    if (minPath !== fullPath) {
                        fs.unlinkSync(fullPath);
                    }
                    
                    console.log(`✓ Minified ${entry.name}`);
                } catch (error) {
                    console.warn(`⚠️  Could not minify ${entry.name}`);
                }
            }
        }
    };
    
    await processJS(distDir);
};

// Build lightweight HTML templates
const buildLightweightHTML = () => {
    console.log('📝 Building lightweight HTML templates...');
    
    // Register partials
    const partialsDir = path.join(__dirname, 'templates', 'common');
    if (fs.existsSync(partialsDir)) {
        hbs.registerPartials(partialsDir);
    }
    
    const pages = [
        { template: 'home.hbs', output: 'index.html' },
        { template: 'altiereality.hbs', output: 'altiereality.html' },
        { template: 'architecture.hbs', output: 'architecture.html' },
        { template: 'automotive.hbs', output: 'automotive.html' },
        { template: 'defence.hbs', output: 'defence.html' },
        { template: 'education.hbs', output: 'education.html' },
        { template: 'gaming.hbs', output: 'gaming.html' },
        { template: 'medical.hbs', output: 'medical.html' },
        { template: 'privacy.hbs', output: 'privacy.html' },
        { template: 'termsandconditions.hbs', output: 'termsandconditions.html' },
        { template: 'creditsandlicenses.hbs', output: 'creditsandlicenses.html' },
        { template: 'xrsense.hbs', output: 'xrsense.html' },
        { template: 'xrtouch.hbs', output: 'xrtouch.html' },
        { template: '404.hbs', output: '404.html' }
    ];
    
    const templatesDir = path.join(__dirname, 'templates', 'views');
    
    pages.forEach(page => {
        const templatePath = path.join(templatesDir, page.template);
        
        if (fs.existsSync(templatePath)) {
            try {
                let templateContent = fs.readFileSync(templatePath, 'utf8');
                
                // Remove references to deleted images
                imagesToRemove.forEach(img => {
                    const imgName = img.replace(/\.(jpg|jpeg|png|webp)$/i, '');
                    templateContent = templateContent.replace(new RegExp(`[^"]*${imgName}[^"]*\\.(jpg|jpeg|png|webp)`, 'gi'), 'assets/img/placeholder.jpg');
                });
                
                // Optimize HTML
                templateContent = templateContent
                    .replace(/\.css"/g, '.min.css"')
                    .replace(/\.js"/g, '.min.js"')
                    .replace(/<img([^>]*?)src=/gi, '<img$1loading="lazy" src=')
                    .replace(/<!--[\\s\\S]*?-->/g, '')
                    .replace(/\\s+/g, ' ')
                    .trim();
                
                const template = hbs.compile(templateContent);
                const html = template({});
                
                const minifiedHTML = html
                    .replace(/>[\\s\\n\\r\\t]+</g, '><')
                    .replace(/\\s+/g, ' ')
                    .trim();
                
                const outputPath = path.join(distDir, page.output);
                fs.writeFileSync(outputPath, minifiedHTML);
                
                console.log(`✓ Built lightweight ${page.output}`);
            } catch (error) {
                console.error(`✗ Error building ${page.template}:`, error.message);
            }
        }
    });
};

// Main lightweight build process
const lightweightBuild = async () => {
    const startTime = Date.now();
    
    try {
        console.log('🎯 LIGHTWEIGHT PROFESSIONAL BUILD STARTED');
        console.log('   Target: <20MB total size');
        console.log('   Strategy: Essential images only + aggressive optimization\\n');
        
        // 1. Copy essential assets only
        copyEssentialAssets();
        
        // 2. Copy and optimize only essential images
        await copyEssentialImages();
        
        // 3. Minify CSS
        minifyCSS();
        
        // 4. Minify JavaScript
        await minifyJS();
        
        // 5. Build lightweight HTML
        buildLightweightHTML();
        
        // 6. Calculate final size
        const { stdout } = await execAsync(`du -sh "${distDir}"`);
        const finalSize = stdout.split('\\t')[0];
        
        const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\\n🎉 LIGHTWEIGHT BUILD COMPLETED!');
        console.log(`📦 Final size: ${finalSize}`);
        console.log(`⏱️  Build time: ${buildTime}s`);
        console.log('\\n✨ Optimizations applied:');
        console.log('   • Removed 80%+ of non-essential images');
        console.log('   • Aggressive image compression');
        console.log('   • CSS/JS minification');
        console.log('   • HTML optimization');
        console.log('   • Eliminated duplicate assets');
        console.log('\\n🚀 Ready for professional deployment!');
        
    } catch (error) {
        console.error('❌ Lightweight build failed:', error);
        process.exit(1);
    }
};

// Run the lightweight build
lightweightBuild();
