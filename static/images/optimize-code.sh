#!/bin/bash

echo "⚡ Starting Code Optimization..."

# Create minified directory
mkdir -p static/assets/dist

echo "📜 Minifying CSS files..."

# Find and minify large CSS files
css_files=(
    "static/assets/css/style.css"
    "static/assets/css/pagesStyle.css"
    "static/assets/css/careersStyle.css"
    "static/contact-assets/base.css"
    "static/home-assets/base.css"
    "static/home-assets/home.css"
    "static/login-assets/index.css"
)

for css_file in "${css_files[@]}"; do
    if [[ -f "$css_file" ]]; then
        filename=$(basename "$css_file" .css)
        echo "🔄 Minifying: $css_file"
        npx cleancss -o "static/assets/dist/${filename}.min.css" "$css_file"
    fi
done

echo ""
echo "📜 Minifying JavaScript files..."

# Find and minify JS files
js_files=(
    "static/assets/js/main.js"
    "static/contact-assets/contactus.js"
    "static/home-assets/home.js"
    "static/login-assets/index.js"
    "static/login-assets/g-api.js"
)

for js_file in "${js_files[@]}"; do
    if [[ -f "$js_file" ]]; then
        filename=$(basename "$js_file" .js)
        echo "🔄 Minifying: $js_file"
        npx uglifyjs "$js_file" -o "static/assets/dist/${filename}.min.js" -c -m
    fi
done

echo ""
echo "📦 Creating combined CSS file..."

# Combine critical CSS files
cat > static/assets/dist/critical.min.css << 'CSS_EOF'
/* Critical CSS - Above the fold styles */
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:0;padding:0}
.navbar{background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.1)}
.hero{min-height:50vh;display:flex;align-items:center}
.btn-primary{background:#007bff;border:#007bff;padding:10px 20px;color:#fff;text-decoration:none;border-radius:5px}
CSS_EOF

echo ""
echo "🎉 Code Optimization Complete!"
echo "📊 Minified files created in: static/assets/dist/"
echo ""
echo "📝 Next steps:"
echo "1. Update HTML templates to use minified files"
echo "2. Load critical CSS inline"
echo "3. Defer non-critical CSS and JS"

# Show file sizes
echo ""
echo "📈 File sizes:"
ls -lah static/assets/dist/
