#!/bin/bash

# Image Optimization Script for Altie Reality Website
echo "🖼️  Starting Image Optimization..."

# Create optimized directory
mkdir -p static/images-optimized

# Counter for tracking
count=0
total_saved=0

# Function to optimize images
optimize_image() {
    local input_file="$1"
    local filename=$(basename "$input_file")
    local name_without_ext="${filename%.*}"
    local extension="${filename##*.}"
    
    # Skip if already optimized
    if [[ -f "static/images-optimized/${name_without_ext}.webp" ]]; then
        echo "⏭️  Skipping $filename (already optimized)"
        return
    fi
    
    echo "🔄 Processing: $filename"
    
    # Get original size
    original_size=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file" 2>/dev/null)
    
    # Convert to WebP with quality 85 (good balance of quality/size)
    if [[ "$extension" =~ ^(jpg|jpeg|png|gif)$ ]]; then
        cwebp -q 85 "$input_file" -o "static/images-optimized/${name_without_ext}.webp" 2>/dev/null
        
        # Also create a fallback optimized version
        if [[ "$extension" =~ ^(jpg|jpeg)$ ]]; then
            convert "$input_file" -quality 85 -strip "static/images-optimized/${filename}"
        elif [[ "$extension" == "png" ]]; then
            convert "$input_file" -quality 95 -strip "static/images-optimized/${filename}"
        fi
        
        # Calculate savings
        if [[ -f "static/images-optimized/${name_without_ext}.webp" ]]; then
            new_size=$(stat -f%z "static/images-optimized/${name_without_ext}.webp" 2>/dev/null || stat -c%s "static/images-optimized/${name_without_ext}.webp" 2>/dev/null)
            saved=$((original_size - new_size))
            total_saved=$((total_saved + saved))
            
            # Convert bytes to human readable
            if [[ $saved -gt 1048576 ]]; then
                saved_mb=$((saved / 1048576))
                echo "✅ Saved ${saved_mb}MB on $filename"
            elif [[ $saved -gt 1024 ]]; then
                saved_kb=$((saved / 1024))
                echo "✅ Saved ${saved_kb}KB on $filename"
            fi
        fi
        
        count=$((count + 1))
    fi
}

# Process images in static/images/
echo "📂 Processing images in static/images/..."
for img in static/images/*.{jpg,jpeg,png,gif}; do
    [[ -f "$img" ]] && optimize_image "$img"
done

# Process images in other static directories
for dir in "static/home static/homephoto" "static/contact static/contactusphoto" "static/login static/loginphoto"; do
    if [[ -d "$dir" ]]; then
        echo "📂 Processing images in $dir..."
        for img in "$dir"/*.{jpg,jpeg,png,gif}; do
            [[ -f "$img" ]] && optimize_image "$img"
        done
    fi
done

# Process template images
if [[ -d "templates/views/assets2/img" ]]; then
    echo "📂 Processing template images..."
    for img in templates/views/assets2/img/*.{jpg,jpeg,png,gif}; do
        [[ -f "$img" ]] && optimize_image "$img"
    done
fi

# Summary
echo ""
echo "🎉 Image Optimization Complete!"
echo "📊 Processed: $count images"
if [[ $total_saved -gt 1048576 ]]; then
    total_saved_mb=$((total_saved / 1048576))
    echo "💾 Total Space Saved: ${total_saved_mb}MB"
elif [[ $total_saved -gt 1024 ]]; then
    total_saved_kb=$((total_saved / 1024))
    echo "💾 Total Space Saved: ${total_saved_kb}KB"
fi
echo ""
echo "🔍 Optimized images are in: static/images-optimized/"
echo "📝 Next: Update your HTML templates to use WebP with fallbacks"
