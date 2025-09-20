#!/bin/bash

echo "🧹 Starting Asset Cleanup..."

# Create backup
echo "📦 Creating backup of current static directory..."
cp -r static/ static-backup/

echo "🔍 Analyzing duplicate directories..."

# Remove duplicate asset directories (keeping only the main 'assets' directory)
echo "🗑️  Removing duplicate asset directories..."

if [[ -d "static/assets2" ]]; then
    echo "Removing static/assets2/ (duplicate)"
    rm -rf static/assets2/
fi

if [[ -d "static/assetsoriginal" ]]; then
    echo "Removing static/assetsoriginal/ (duplicate)" 
    rm -rf static/assetsoriginal/
fi

# Clean up the messy directory structure
echo "📁 Organizing directory structure..."

# Move images from root to proper location
if [[ -d "static/images" ]]; then
    echo "Moving images to proper location..."
    
    # Move all images from root to static/images/
    for img in *.{jpg,jpeg,png,gif,webp}; do
        if [[ -f "$img" && "$img" != "optimize-images.sh" ]]; then
            mv "$img" static/images/ 2>/dev/null
        fi
    done
fi

# Remove unnecessary files
echo "🗑️  Removing unnecessary files..."

# Remove duplicate image files in static/assets/img/ that exist in static/images/
if [[ -d "static/assets/img" ]]; then
    echo "Checking for duplicate images in assets/img..."
    
    # Remove duplicates (keep the optimized versions)
    duplicate_images=("aerospace.jpg" "architectue.jpg" "automotive.jpg" "defence.jpg" "education.png" "game.jpg" "gaming.jpg")
    
    for img in "${duplicate_images[@]}"; do
        if [[ -f "static/assets/img/$img" && -f "static/images/$img" ]]; then
            echo "Removing duplicate: static/assets/img/$img"
            rm -f "static/assets/img/$img"
        fi
    done
fi

# Remove empty directories
echo "📂 Removing empty directories..."
find static/ -type d -empty -delete 2>/dev/null

# Clean up the weird "static/" directory names with spaces
echo "🔧 Fixing directory names with spaces..."

if [[ -d "static/contact static" ]]; then
    mv "static/contact static" "static/contact-assets"
fi

if [[ -d "static/home static" ]]; then
    mv "static/home static" "static/home-assets"  
fi

if [[ -d "static/login static" ]]; then
    mv "static/login static" "static/login-assets"
fi

if [[ -d "static/resetpassword static" ]]; then
    mv "static/resetpassword static" "static/resetpassword-assets"
fi

if [[ -d "static/verifyemail static" ]]; then
    mv "static/verifyemail static" "static/verifyemail-assets"
fi

if [[ -d "static/random photo" ]]; then
    mv "static/random photo" "static/random-photos"
fi

# Show results
echo ""
echo "🎉 Asset Cleanup Complete!"
echo "📊 Directory structure cleaned up"
echo "🔍 Current static directory size:"
du -sh static/

echo ""
echo "📝 Summary of changes:"
echo "✅ Removed duplicate asset directories (assets2, assetsoriginal)"
echo "✅ Organized images into proper directories"
echo "✅ Fixed directory names with spaces"
echo "✅ Removed duplicate image files"
echo "✅ Created backup in static-backup/"
echo ""
echo "⚠️  Remember to update your HTML templates to use the new paths!"
