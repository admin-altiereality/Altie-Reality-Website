#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Updating HTML templates for optimized images...');

// Helper function to create WebP picture tags
function createPictureTag(imagePath, alt = '', className = '', lazy = true) {
    const ext = path.extname(imagePath);
    const nameWithoutExt = imagePath.replace(ext, '');
    const webpPath = nameWithoutExt + '.webp';
    
    const lazyAttr = lazy ? 'loading="lazy"' : '';
    
    return `<picture${className ? ` class="${className}"` : ''}>
    <source srcset="static/images-optimized/${path.basename(webpPath)}" type="image/webp">
    <img src="${imagePath}" alt="${alt}" ${lazyAttr}>
</picture>`;
}

// Function to update image references in HTML files
function updateImageReferences(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;
        
        // Replace large image references with WebP picture tags
        const largeImages = [
            'iitbombay.png',
            'avgcxr.png', 
            'bitspilani.png',
            'architectue.jpg',
            'hardware.jpg',
            'aerospace.jpg',
            'defence.jpg'
        ];
        
        largeImages.forEach(image => {
            const regex = new RegExp(`<img[^>]*src=["']([^"']*${image})["'][^>]*>`, 'gi');
            content = content.replace(regex, (match) => {
                // Extract alt text and class from original img tag
                const altMatch = match.match(/alt=["']([^"']*)["']/i);
                const classMatch = match.match(/class=["']([^"']*)["']/i);
                
                const alt = altMatch ? altMatch[1] : '';
                const className = classMatch ? classMatch[1] : '';
                
                updated = true;
                return createPictureTag(`static/images-optimized/${image}`, alt, className);
            });
        });
        
        // Add lazy loading to remaining images
        content = content.replace(/<img([^>]*src=["'][^"']*\.(jpg|jpeg|png|gif)["'][^>]*)>/gi, (match, attrs) => {
            if (!match.includes('loading=')) {
                updated = true;
                return `<img${attrs} loading="lazy">`;
            }
            return match;
        });
        
        if (updated) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Updated: ${filePath}`);
            return true;
        }
        
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
    }
    
    return false;
}

// Find and update all HBS template files
const templatesDir = path.join(__dirname, 'templates/views');
if (fs.existsSync(templatesDir)) {
    const files = fs.readdirSync(templatesDir);
    let updatedCount = 0;
    
    files.forEach(file => {
        if (file.endsWith('.hbs')) {
            const filePath = path.join(templatesDir, file);
            if (updateImageReferences(filePath)) {
                updatedCount++;
            }
        }
    });
    
    console.log(`\n🎉 Template optimization complete!`);
    console.log(`📊 Updated ${updatedCount} template files`);
    console.log(`\n📝 Benefits:`);
    console.log(`✅ WebP images with fallbacks for better compression`);
    console.log(`✅ Lazy loading for improved initial page load`);
    console.log(`✅ Responsive image loading`);
    
} else {
    console.log('❌ Templates directory not found');
}

console.log('\n⚡ Performance improvements applied!');
