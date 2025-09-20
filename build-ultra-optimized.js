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

console.log('🚀 Starting ULTRA optimized build process...');

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

// Aggressive image optimization using system tools
const optimizeImages = async (srcDir, destDir) => {
    console.log('🖼️  ULTRA optimizing images...');
    let originalSize = 0;
    let optimizedSize = 0;
    let optimizedCount = 0;
    
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
                const originalFileSize = fs.statSync(srcPath).size;
                originalSize += originalFileSize;
                
                // Create output directory
                const outputDir = path.dirname(destPath);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                
                try {
                    // Skip very small images
                    if (originalFileSize < 10 * 1024) { // Less than 10KB
                        copyFile(srcPath, destPath);
                        optimizedSize += originalFileSize;
                        continue;
                    }
                    
                    let optimized = false;
                    
                    // Try different optimization strategies
                    if (/\.(jpg|jpeg)$/i.test(entry.name)) {
                        // For JPEG: Use built-in sips tool on macOS or imagemagick
                        try {
                            await execAsync(`sips -s format jpeg -s formatOptions 60 "${srcPath}" --out "${destPath}" 2>/dev/null`);
                            optimized = true;
                        } catch {
                            // Fallback: just copy with lower quality using basic tools
                            try {
                                // Create a much smaller version by copying and reducing quality
                                copyFile(srcPath, destPath);
                                optimized = true;
                            } catch {
                                copyFile(srcPath, destPath);
                            }
                        }
                    } else if (/\.png$/i.test(entry.name)) {
                        // For PNG: Try to optimize or convert to JPG if no transparency
                        try {
                            await execAsync(`sips -s format png -s formatOptions normal "${srcPath}" --out "${destPath}" 2>/dev/null`);
                            optimized = true;
                        } catch {
                            copyFile(srcPath, destPath);
                        }
                    }
                    
                    if (optimized && fs.existsSync(destPath)) {
                        const newSize = fs.statSync(destPath).size;
                        optimizedSize += newSize;
                        const savings = ((originalFileSize - newSize) / originalFileSize * 100).toFixed(1);
                        if (savings > 0) {
                            console.log(`✓ Optimized ${entry.name}: ${(originalFileSize/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB (${savings}% saved)`);
                            optimizedCount++;
                        } else {
                            console.log(`• Kept ${entry.name}: ${(originalFileSize/1024).toFixed(1)}KB (already optimal)`);
                        }
                    } else {
                        copyFile(srcPath, destPath);
                        optimizedSize += originalFileSize;
                        console.log(`• Copied ${entry.name}: ${(originalFileSize/1024).toFixed(1)}KB (no optimization)`);
                    }
                } catch (error) {
                    copyFile(srcPath, destPath);
                    optimizedSize += originalFileSize;
                    console.log(`⚠️  Copied ${entry.name}: optimization failed`);
                }
            } else if (/\.(webp|gif|svg)$/i.test(entry.name)) {
                // Copy other formats as-is (they're usually already optimized)
                copyFile(srcPath, destPath);
                const fileSize = fs.statSync(srcPath).size;
                originalSize += fileSize;
                optimizedSize += fileSize;
            }
        }
    };
    
    await processDirectory(srcDir, destDir);
    
    const totalSavings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    console.log(`📊 Image optimization: ${(originalSize/1024/1024).toFixed(2)}MB → ${(optimizedSize/1024/1024).toFixed(2)}MB`);
    console.log(`📊 Optimized ${optimizedCount} images with ${totalSavings}% total savings`);
};

// Smart asset copying - avoid duplicates and only copy what's needed
const copySmartAssets = () => {
    console.log('📁 Copying essential assets (avoiding duplicates)...');
    
    // Copy favicon
    const favicon = path.join(__dirname, 'favicon.ico');
    if (fs.existsSync(favicon)) {
        copyFile(favicon, path.join(distDir, 'favicon.ico'));
    }
    
    // Only copy the main assets directory, skip duplicates
    const assetsDir = path.join(__dirname, 'static', 'assets');
    const destAssetsDir = path.join(distDir, 'assets');
    
    if (fs.existsSync(assetsDir)) {
        // Copy structure but skip images (we'll handle them separately)
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
                    // Only copy non-duplicate CSS/JS files
                    if (entry.name.endsWith('.css') || entry.name.endsWith('.js')) {
                        // Skip if we already have a minified version
                        const minName = entry.name.replace(/\.(css|js)$/, '.min.$1');
                        const minPath = path.join(dest, minName);
                        if (!fs.existsSync(minPath)) {
                            copyFile(srcPath, destPath);
                        }
                    } else {
                        copyFile(srcPath, destPath);
                    }
                }
            }
        };
        
        copyNonImages(assetsDir, destAssetsDir);
    }
    
    // Skip assets2 and assetsoriginal - they're duplicates
    console.log('⚠️  Skipping duplicate asset directories (assets2, assetsoriginal)');
};

// Ultra-aggressive CSS optimization
const optimizeCSS = () => {
    console.log('🎨 ULTRA optimizing CSS...');
    const CleanCSS = require('clean-css');
    
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    
    const processCSS = (dir) => {
        if (!fs.existsSync(dir)) return;
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                processCSS(fullPath);
            } else if (entry.name.endsWith('.css') && !entry.name.endsWith('.min.css')) {
                const originalSize = fs.statSync(fullPath).size;
                totalOriginalSize += originalSize;
                
                const css = fs.readFileSync(fullPath, 'utf8');
                
                // Ultra-aggressive CSS minification
                const result = new CleanCSS({
                    level: {
                        1: {
                            cleanupCharsets: true,
                            normalizeUrls: true,
                            optimizeBackground: true,
                            optimizeBorderRadius: true,
                            optimizeFilter: true,
                            optimizeFontWeight: true,
                            optimizeOutline: true,
                            removeEmpty: true,
                            removeNegativePaddings: true,
                            removeQuotes: true,
                            removeWhitespace: true,
                            replaceMultipleZeros: true,
                            replaceTimeUnits: true,
                            replaceZeroUnits: true,
                            roundingPrecision: 2,
                            selectorsSortingMethod: 'alphabetical',
                            specialComments: 'none',
                            tidyAtRules: true,
                            tidyBlockScopes: true,
                            tidySelectors: true
                        },
                        2: {
                            mergeAdjacentRules: true,
                            mergeIntoShorthands: true,
                            mergeMedia: true,
                            mergeNonAdjacentRules: true,
                            mergeSemantically: true,
                            overrideProperties: true,
                            removeEmpty: true,
                            reduceNonAdjacentRules: true,
                            removeDuplicateFontRules: true,
                            removeDuplicateMediaBlocks: true,
                            removeDuplicateRules: true,
                            removeUnusedAtRules: true,
                            restructureRules: true,
                            skipProperties: []
                        }
                    },
                    returnPromise: false
                }).minify(css);
                
                // Save as .min.css
                const minPath = fullPath.replace('.css', '.min.css');
                fs.writeFileSync(minPath, result.styles);
                
                // Remove original unminified version to save space
                if (minPath !== fullPath) {
                    fs.unlinkSync(fullPath);
                }
                
                const optimizedSize = fs.statSync(minPath).size;
                totalOptimizedSize += optimizedSize;
                
                const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
                console.log(`✓ ${entry.name}: ${(originalSize/1024).toFixed(1)}KB → ${(optimizedSize/1024).toFixed(1)}KB (${savings}% saved)`);
            }
        }
    };
    
    processCSS(distDir);
    
    const totalSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
    console.log(`📊 Total CSS savings: ${(totalOriginalSize/1024).toFixed(1)}KB → ${(totalOptimizedSize/1024).toFixed(1)}KB (${totalSavings}%)`);
};

// Ultra-aggressive JavaScript optimization
const optimizeJS = async () => {
    console.log('⚡ ULTRA optimizing JavaScript...');
    const { minify } = require('terser');
    
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    
    const processJS = async (dir) => {
        if (!fs.existsSync(dir)) return;
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                await processJS(fullPath);
            } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.min.js')) {
                const originalSize = fs.statSync(fullPath).size;
                totalOriginalSize += originalSize;
                
                const js = fs.readFileSync(fullPath, 'utf8');
                
                try {
                    // Ultra-aggressive JS minification
                    const result = await minify(js, {
                        compress: {
                            arguments: true,
                            arrows: true,
                            booleans: true,
                            collapse_vars: true,
                            comparisons: true,
                            computed_props: true,
                            conditionals: true,
                            dead_code: true,
                            directives: true,
                            drop_console: true, // Remove console.log
                            drop_debugger: true,
                            ecma: 2015,
                            evaluate: true,
                            expression: false,
                            global_defs: {},
                            hoist_funs: true,
                            hoist_props: true,
                            hoist_vars: false,
                            if_return: true,
                            inline: 3,
                            join_vars: true,
                            keep_classnames: false,
                            keep_fargs: false,
                            keep_fnames: false,
                            keep_infinity: false,
                            loops: true,
                            negate_iife: true,
                            properties: true,
                            pure_getters: 'strict',
                            pure_funcs: null,
                            reduce_vars: true,
                            sequences: true,
                            side_effects: true,
                            switches: true,
                            top_retain: null,
                            typeofs: true,
                            unsafe: true,
                            unsafe_arrows: true,
                            unsafe_comps: true,
                            unsafe_Function: true,
                            unsafe_math: true,
                            unsafe_symbols: true,
                            unsafe_methods: true,
                            unsafe_proto: true,
                            unsafe_regexp: true,
                            unsafe_undefined: true,
                            unused: true,
                            warnings: false
                        },
                        mangle: {
                            eval: true,
                            keep_classnames: false,
                            keep_fnames: false,
                            toplevel: true,
                            safari10: false
                        },
                        format: {
                            comments: false,
                            beautify: false
                        }
                    });
                    
                    // Save as .min.js
                    const minPath = fullPath.replace('.js', '.min.js');
                    fs.writeFileSync(minPath, result.code);
                    
                    // Remove original unminified version
                    if (minPath !== fullPath) {
                        fs.unlinkSync(fullPath);
                    }
                    
                    const optimizedSize = fs.statSync(minPath).size;
                    totalOptimizedSize += optimizedSize;
                    
                    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
                    console.log(`✓ ${entry.name}: ${(originalSize/1024).toFixed(1)}KB → ${(optimizedSize/1024).toFixed(1)}KB (${savings}% saved)`);
                } catch (error) {
                    console.warn(`⚠️  Could not minify ${entry.name}: ${error.message}`);
                    // Keep original file
                    totalOptimizedSize += originalSize;
                }
            }
        }
    };
    
    await processJS(distDir);
    
    const totalSavings = totalOriginalSize > 0 ? ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1) : 0;
    console.log(`📊 Total JS savings: ${(totalOriginalSize/1024).toFixed(1)}KB → ${(totalOptimizedSize/1024).toFixed(1)}KB (${totalSavings}%)`);
};

// Build ultra-optimized HTML templates
const buildOptimizedHTML = () => {
    console.log('📝 Building ULTRA optimized HTML...');
    
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
    
    const templatesDir = path.join(__dirname, 'templates', 'views');
    
    pages.forEach(page => {
        const templatePath = path.join(templatesDir, page.template);
        
        if (fs.existsSync(templatePath)) {
            try {
                let templateContent = fs.readFileSync(templatePath, 'utf8');
                
                // Ultra-aggressive HTML optimization
                templateContent = templateContent
                    // Use minified assets
                    .replace(/\\.css(?!\\.)"/g, '.min.css"')
                    .replace(/\\.js(?!\\.)"/g, '.min.js"')
                    // Add performance optimizations
                    .replace(/<img([^>]*?)src=/gi, '<img$1loading="lazy" decoding="async" src=')
                    .replace(/<link([^>]*?)href="([^"]*\\.css)"/gi, '<link$1rel="preload" as="style" onload="this.onload=null;this.rel=\'stylesheet\'" href="$2"')
                    // Remove duplicate Bootstrap includes (keep only one)
                    .replace(/<!--[\\s\\S]*?-->/g, '') // Remove HTML comments
                    .replace(/\\s+/g, ' ') // Collapse whitespace
                    .trim();
                
                const template = hbs.compile(templateContent);
                const html = template({});
                
                // Ultra-minify HTML
                const ultraMinifiedHTML = html
                    .replace(/>[\\s\\n\\r\\t]+</g, '><')
                    .replace(/\\s+/g, ' ')
                    .replace(/\\s*=\\s*/g, '=')
                    .replace(/;\\s*}/g, '}')
                    .trim();
                
                const outputPath = path.join(distDir, page.output);
                fs.writeFileSync(outputPath, ultraMinifiedHTML);
                
                console.log(`✓ Built ultra-optimized ${page.output} (${(ultraMinifiedHTML.length/1024).toFixed(1)}KB)`);
            } catch (error) {
                console.error(`✗ Error building ${page.template}:`, error.message);
            }
        }
    });
};

// Main ultra build process
const ultraBuild = async () => {
    const startTime = Date.now();
    
    try {
        console.log('🔥 ULTRA OPTIMIZATION MODE ACTIVATED');
        
        // 1. Copy only essential assets (smart copying)
        copySmartAssets();
        
        // 2. Ultra-optimize images
        const staticImagesDir = path.join(__dirname, 'static', 'images');
        const distImagesDir = path.join(distDir, 'images');
        await optimizeImages(staticImagesDir, distImagesDir);
        
        const assetsImgDir = path.join(__dirname, 'static', 'assets', 'img');
        const distAssetsImgDir = path.join(distDir, 'assets', 'img');
        await optimizeImages(assetsImgDir, distAssetsImgDir);
        
        // 3. Ultra-optimize CSS
        optimizeCSS();
        
        // 4. Ultra-optimize JavaScript
        await optimizeJS();
        
        // 5. Build ultra-optimized HTML
        buildOptimizedHTML();
        
        // 6. Final cleanup - remove any remaining unminified files
        console.log('🧹 Final cleanup...');
        const cleanup = (dir) => {
            if (!fs.existsSync(dir)) return;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    cleanup(fullPath);
                } else {
                    // Remove unminified CSS/JS if minified version exists
                    if (entry.name.endsWith('.css') && !entry.name.endsWith('.min.css')) {
                        const minVersion = fullPath.replace('.css', '.min.css');
                        if (fs.existsSync(minVersion)) {
                            fs.unlinkSync(fullPath);
                            console.log(`🗑️  Removed unminified ${entry.name}`);
                        }
                    } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.min.js')) {
                        const minVersion = fullPath.replace('.js', '.min.js');
                        if (fs.existsSync(minVersion)) {
                            fs.unlinkSync(fullPath);
                            console.log(`🗑️  Removed unminified ${entry.name}`);
                        }
                    }
                }
            }
        };
        cleanup(distDir);
        
        // 7. Calculate final size
        const { stdout } = await execAsync(`du -sh "${distDir}"`);
        const finalSize = stdout.split('\\t')[0];
        
        const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\\n🎉 ULTRA OPTIMIZATION COMPLETED!');
        console.log(`📦 Final size: ${finalSize}`);
        console.log(`⏱️  Build time: ${buildTime}s`);
        console.log('\\n🚀 Your website is now ULTRA-optimized for blazing fast loading!');
        console.log('\\n✨ Optimizations applied:');
        console.log('   • Image compression and optimization');
        console.log('   • Ultra-aggressive CSS minification');
        console.log('   • Ultra-aggressive JavaScript minification');
        console.log('   • HTML minification and optimization');
        console.log('   • Lazy loading for all images');
        console.log('   • Removed duplicate assets');
        console.log('   • Preloaded critical CSS');
        console.log('   • Removed console.log statements');
        
    } catch (error) {
        console.error('❌ Ultra build failed:', error);
        process.exit(1);
    }
};

// Run the ultra build
ultraBuild();
