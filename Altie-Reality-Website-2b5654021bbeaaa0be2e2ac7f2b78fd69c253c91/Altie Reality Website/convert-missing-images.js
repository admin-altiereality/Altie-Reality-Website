const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// List of images to convert
const imagesToConvert = [
  // From static/images
  'igdc.png',
  'metaxrstartup.jpeg',
  'hardware.jpg',
  'bitspilani.png',
  'avgcxr.png',
  'iitbombay.png',
  'sptbilogo.png',
  'istart.jpeg',
  'game.jpg',
  'automotive 2.webp',
  'defence.jpg',
  // From static/assets/img
  'logo.png',
  'hero-img.gif',
  'features.png',
  'teamabout.jpg'
];

// Directories
const imagesDir = path.join(__dirname, 'static/images');
const assetsDir = path.join(__dirname, 'static/assets/img');

// Function to convert images
async function convertImages() {
  for (const image of imagesToConvert) {
    const inputPath = path.join(imagesDir, image);
    const outputPath = path.join(imagesDir, image.replace(/\.(png|jpeg|jpg|gif)$/, '.webp'));

    // Check if the image exists in static/images
    if (fs.existsSync(inputPath)) {
      try {
        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(outputPath);
        console.log(`Converted ${image} to WebP format.`);
      } catch (error) {
        console.error(`Error converting ${image}:`, error);
      }
    } else {
      // Check if the image exists in static/assets/img
      const assetInputPath = path.join(assetsDir, image);
      const assetOutputPath = path.join(assetsDir, image.replace(/\.(png|jpeg|jpg|gif)$/, '.webp'));

      if (fs.existsSync(assetInputPath)) {
        try {
          await sharp(assetInputPath)
            .webp({ quality: 80 })
            .toFile(assetOutputPath);
          console.log(`Converted ${image} to WebP format in assets directory.`);
        } catch (error) {
          console.error(`Error converting ${image} in assets directory:`, error);
        }
      } else {
        console.error(`Image ${image} not found in either directory.`);
      }
    }
  }
}

convertImages(); 