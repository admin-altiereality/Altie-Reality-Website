const fs = require('fs');
const path = require('path');
const hbs = require('hbs');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminWebp = require('imagemin-webp');
const CleanCSS = require('clean-css');
const { minify } = require('terser');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

console.log('🚀 Starting optimized build process...');

// Utility function to copy files
const copyFile = (src, dest) => {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
};

// Utility function to get file size in KB
const getFileSizeKB = (filePath) => {
    const stats = fs.statSync(filePath);
    return (stats.size / 1024).toFixed(2);
};

// Optimize images
const optimizeImages = async (srcDir, destDir) => {
    console.log('🖼️  Optimizing images...');
    let originalSize = 0;
    let optimizedSize = 0;
    
    const processDirectory = async (dir, outputDir) => {
        if (!fs.existsSync(dir)) return;
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(dir, entry.name);
            const destPath = path.join(outputDir, entry.name);
            
            if (entry.isDirectory()) {
                await processDirectory(srcPath, destPath);
            } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
                // Track original size
                originalSize += fs.statSync(srcPath).size;
                
                // Optimize image
                const outputDir = path.dirname(destPath);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                
                try {
                    await imagemin([srcPath], {
                        destination: outputDir,
                        plugins: [
                            imageminMozjpeg({ quality: 80 }),
                            imageminPngquant({ quality: [0.6, 0.8] })
                        ]
                    });
                    
                    // Track optimized size
                    if (fs.existsSync(destPath)) {
                        optimizedSize += fs.statSync(destPath).size;
                        console.log(`✓ Optimized ${entry.name}: ${getFileSizeKB(srcPath)}KB → ${getFileSizeKB(destPath)}KB`);
                    }
                } catch (error) {
                    console.warn(`⚠️  Could not optimize ${entry.name}, copying original`);
                    copyFile(srcPath, destPath);
                    optimizedSize += fs.statSync(srcPath).size;
                }
            } else if (/\.(webp|gif|svg)$/i.test(entry.name)) {
                // Copy other image formats as-is
                copyFile(srcPath, destPath);
                originalSize += fs.statSync(srcPath).size;
                optimizedSize += fs.statSync(srcPath).size;
            }
        }
    };
    
    await processDirectory(srcDir, destDir);
    
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    console.log(`📊 Image optimization complete: ${(originalSize/1024/1024).toFixed(2)}MB → ${(optimizedSize/1024/1024).toFixed(2)}MB (${savings}% reduction)`);
};

// Minify CSS
const minifyCSS = (srcDir, destDir) => {
    console.log('🎨 Minifying CSS files...');
    let totalSavings = 0;
    
    const processDirectory = (dir, outputDir) => {
        if (!fs.existsSync(dir)) return;
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(dir, entry.name);
            const destPath = path.join(outputDir, entry.name);
            
            if (entry.isDirectory()) {
                processDirectory(srcPath, destPath);
            } else if (entry.name.endsWith('.css') && !entry.name.endsWith('.min.css')) {
                const originalSize = fs.statSync(srcPath).size;
                const css = fs.readFileSync(srcPath, 'utf8');
                const minified = new CleanCSS({
                    level: 2,
                    returnPromise: false
                }).minify(css);
                
                const outputDir = path.dirname(destPath);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                
                // Save as .min.css
                const minDestPath = destPath.replace('.css', '.min.css');
                fs.writeFileSync(minDestPath, minified.styles);
                
                const newSize = fs.statSync(minDestPath).size;
                const savings = originalSize - newSize;
                totalSavings += savings;
                
                console.log(`✓ Minified ${entry.name}: ${(originalSize/1024).toFixed(2)}KB → ${(newSize/1024).toFixed(2)}KB`);
            } else {
                // Copy already minified files or other files
                copyFile(srcPath, destPath);
            }
        }
    };
    
    processDirectory(srcDir, destDir);
    console.log(`📊 CSS minification saved: ${(totalSavings/1024).toFixed(2)}KB`);
};

// Minify JavaScript
const minifyJS = async (srcDir, destDir) => {
    console.log('⚡ Minifying JavaScript files...');
    let totalSavings = 0;
    
    const processDirectory = async (dir, outputDir) => {
        if (!fs.existsSync(dir)) return;
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(dir, entry.name);
            const destPath = path.join(outputDir, entry.name);
            
            if (entry.isDirectory()) {
                await processDirectory(srcPath, destPath);
            } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.min.js')) {
                const originalSize = fs.statSync(srcPath).size;
                const js = fs.readFileSync(srcPath, 'utf8');
                
                try {
                    const minified = await minify(js, {
                        compress: {
                            dead_code: true,
                            drop_console: false,
                            drop_debugger: true,
                            keep_classnames: false,
                            keep_fnames: false,
                            keep_infinity: true
                        },
                        mangle: {
                            keep_classnames: false,
                            keep_fnames: false
                        }
                    });
                    
                    const outputDir = path.dirname(destPath);
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }
                    
                    // Save as .min.js
                    const minDestPath = destPath.replace('.js', '.min.js');
                    fs.writeFileSync(minDestPath, minified.code);
                    
                    const newSize = fs.statSync(minDestPath).size;
                    const savings = originalSize - newSize;
                    totalSavings += savings;
                    
                    console.log(`✓ Minified ${entry.name}: ${(originalSize/1024).toFixed(2)}KB → ${(newSize/1024).toFixed(2)}KB`);
                } catch (error) {
                    console.warn(`⚠️  Could not minify ${entry.name}, copying original`);
                    copyFile(srcPath, destPath);
                }
            } else {
                // Copy already minified files or other files
                copyFile(srcPath, destPath);
            }
        }
    };
    
    await processDirectory(srcDir, destDir);
    console.log(`📊 JavaScript minification saved: ${(totalSavings/1024).toFixed(2)}KB`);
};

// Copy only essential files (avoid duplicates)
const copyEssentialAssets = () => {
    console.log('📁 Copying essential assets...');
    
    // Copy favicon
    const favicon = path.join(__dirname, 'favicon.ico');
    if (fs.existsSync(favicon)) {
        copyFile(favicon, path.join(distDir, 'favicon.ico'));
    }
    
    // Copy only the main assets directory (avoid duplicates)
    const assetsDir = path.join(__dirname, 'static', 'assets');
    const destAssetsDir = path.join(distDir, 'assets');
    
    if (fs.existsSync(assetsDir)) {
        // Copy non-image assets first
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
};

// Update HTML templates to use optimized assets
const updateHTMLTemplates = () => {
    console.log('📝 Building optimized HTML templates...');
    
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
    
    // Build each page with optimization hints
    const templatesDir = path.join(__dirname, 'templates', 'views');
    
    pages.forEach(page => {
        const templatePath = path.join(templatesDir, page.template);
        
        if (fs.existsSync(templatePath)) {
            try {
                let templateContent = fs.readFileSync(templatePath, 'utf8');
                
                // Replace CSS references with minified versions
                templateContent = templateContent.replace(/\.css"/g, '.min.css"');
                templateContent = templateContent.replace(/\.js"/g, '.min.js"');
                
                // Add lazy loading to images
                templateContent = templateContent.replace(
                    /<img([^>]*?)src=/gi, 
                    '<img$1loading="lazy" src='
                );
                
                const template = hbs.compile(templateContent);
                const context = {};
                const html = template(context);
                
                // Minify HTML
                const minifiedHTML = html
                    .replace(/>\s+</g, '><')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                const outputPath = path.join(distDir, page.output);
                fs.writeFileSync(outputPath, minifiedHTML);
                
                console.log(`✓ Built optimized ${page.output}`);
            } catch (error) {
                console.error(`✗ Error building ${page.template}:`, error.message);
            }
        }
    });
};

// Main build process
const build = async () => {
    const startTime = Date.now();
    
    try {
        // 1. Copy essential assets (non-images)
        copyEssentialAssets();
        
        // 2. Optimize images
        const staticImagesDir = path.join(__dirname, 'static', 'images');
        const distImagesDir = path.join(distDir, 'images');
        await optimizeImages(staticImagesDir, distImagesDir);
        
        const assetsImgDir = path.join(__dirname, 'static', 'assets', 'img');
        const distAssetsImgDir = path.join(distDir, 'assets', 'img');
        await optimizeImages(assetsImgDir, distAssetsImgDir);
        
        // 3. Minify CSS
        const staticDir = path.join(__dirname, 'static');
        minifyCSS(staticDir, distDir);
        
        // 4. Minify JavaScript
        await minifyJS(staticDir, distDir);
        
        // 5. Build optimized HTML templates
        updateHTMLTemplates();
        
        // 6. Calculate final size
        const finalSize = await new Promise((resolve) => {
            const { exec } = require('child_process');
            exec(`du -sh "${distDir}"`, (error, stdout) => {
                if (error) resolve('Unknown');
                else resolve(stdout.split('\t')[0]);
            });
        });
        
        const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\\n🎉 Optimized build completed!');
        console.log(`📦 Final size: ${finalSize}`);
        console.log(`⏱️  Build time: ${buildTime}s`);
        console.log('\\n🚀 Your website is now optimized for fast loading!');
        
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
};

// Run the build
build();
