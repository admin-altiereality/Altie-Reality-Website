const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imageDir = path.join(__dirname, 'static/images');

async function convertToWebP() {
    try {
        const files = fs.readdirSync(imageDir);
        
        for (const file of files) {
            if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
                const inputPath = path.join(imageDir, file);
                const outputPath = path.join(imageDir, `${path.parse(file).name}.webp`);
                
                // Skip if WebP version already exists
                if (fs.existsSync(outputPath)) {
                    console.log(`WebP version already exists for ${file}`);
                    continue;
                }
                
                console.log(`Converting ${file} to WebP...`);
                
                await sharp(inputPath)
                    .webp({ quality: 80 }) // Adjust quality as needed (0-100)
                    .toFile(outputPath);
                
                console.log(`Successfully converted ${file} to WebP`);
            }
        }
    } catch (error) {
        console.error('Error converting images:', error);
    }
}

convertToWebP(); 