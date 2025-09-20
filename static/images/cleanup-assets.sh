#!/bin/bash

echo "🧹 Starting Asset Cleanup..."

# Create backup first
echo "📦 Creating backup..."
cp -r static/ static-backup/ 2>/dev/null || echo "Backup creation skipped"

echo "🗑️  Removing duplicate directories..."

# Remove duplicate directories
if [[ -d "static/assets2" ]]; then
    echo "Removing static/assets2/"
    rm -rf static/assets2/
fi

if [[ -d "static/assetsoriginal" ]]; then
    echo "Removing static/assetsoriginal/"
    rm -rf static/assetsoriginal/
fi

# Fix directory names with spaces
echo "🔧 Fixing directory names..."

if [[ -d "static/contact static" ]]; then
    mv "static/contact static" "static/contact-assets"
    echo "Renamed: contact static -> contact-assets"
fi

if [[ -d "static/home static" ]]; then
    mv "static/home static" "static/home-assets"
    echo "Renamed: home static -> home-assets"
fi

if [[ -d "static/login static" ]]; then
    mv "static/login static" "static/login-assets"
    echo "Renamed: login static -> login-assets"
fi

if [[ -d "static/resetpassword static" ]]; then
    mv "static/resetpassword static" "static/resetpassword-assets"
    echo "Renamed: resetpassword static -> resetpassword-assets"
fi

if [[ -d "static/verifyemail static" ]]; then
    mv "static/verifyemail static" "static/verifyemail-assets"
    echo "Renamed: verifyemail static -> verifyemail-assets"
fi

if [[ -d "static/random photo" ]]; then
    mv "static/random photo" "static/random-photos"
    echo "Renamed: random photo -> random-photos"
fi

echo ""
echo "🎉 Asset Cleanup Complete!"
echo "📊 New static directory size:"
du -sh static/
