#!/bin/bash

echo "🖼️  Starting Image Optimization..."
mkdir -p static/images-optimized

echo "📂 Processing largest images first..."

# Process the biggest images (2MB+)
large_images=("iitbombay.png" "avgcxr.png" "bitspilani.png" "architectue.jpg" "hardware.jpg")

for img in "${large_images[@]}"; do
    if [[ -f "$img" ]]; then
        echo "🔄 Processing: $img"
        name_without_ext="${img%.*}"
        
        # Convert to WebP with lower quality for large images
        cwebp -q 75 "$img" -o "static/images-optimized/${name_without_ext}.webp" 2>/dev/null
        
        # Create fallback optimized version
        if [[ "$img" =~ \.jpg$ ]]; then
            magick "$img" -quality 80 -strip "static/images-optimized/$img"
        elif [[ "$img" =~ \.png$ ]]; then
            magick "$img" -quality 85 -strip "static/images-optimized/$img"
        fi
        
        echo "✅ Optimized $img"
    fi
done

echo "📂 Processing medium-sized images..."

# Process medium images (100KB - 2MB)
for img in *.{jpg,jpeg,png,gif}; do
    if [[ -f "$img" ]]; then
        # Skip if already processed
        skip=false
        for large in "${large_images[@]}"; do
            if [[ "$img" == "$large" ]]; then
                skip=true
                break
            fi
        done
        
        if [[ "$skip" == false ]]; then
            name_without_ext="${img%.*}"
            
            # Skip if already optimized
            if [[ ! -f "static/images-optimized/${name_without_ext}.webp" ]]; then
                echo "🔄 Processing: $img"
                cwebp -q 85 "$img" -o "static/images-optimized/${name_without_ext}.webp" 2>/dev/null
            fi
        fi
    fi
done

echo ""
echo "🎉 Image Optimization Complete!"
echo "📊 Check static/images-optimized/ for results"

# Show size comparison
echo ""
echo "📈 Size Comparison:"
original_size=$(du -sh . | cut -f1)
optimized_size=$(du -sh static/images-optimized/ | cut -f1)
echo "Original images: ~$original_size (in root)"
echo "Optimized images: $optimized_size"
