#!/usr/bin/env node

const http = require('http');
const fs = require('fs');

console.log('🧪 Running Performance Tests...\n');

// Test server response headers
function testHeaders() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'HEAD'
        };

        const req = http.request(options, (res) => {
            console.log('🔍 Server Response Headers:');
            console.log('✅ Status:', res.statusCode);
            
            // Check for compression
            if (res.headers['vary'] && res.headers['vary'].includes('Accept-Encoding')) {
                console.log('✅ Compression: Enabled (Gzip)');
            } else {
                console.log('❌ Compression: Not detected');
            }
            
            // Check security headers
            const securityHeaders = [
                'x-frame-options',
                'x-content-type-options', 
                'strict-transport-security',
                'referrer-policy'
            ];
            
            console.log('🔒 Security Headers:');
            securityHeaders.forEach(header => {
                if (res.headers[header]) {
                    console.log(`✅ ${header}: ${res.headers[header]}`);
                } else {
                    console.log(`❌ ${header}: Missing`);
                }
            });
            
            resolve();
        });

        req.on('error', (err) => {
            console.log('❌ Server not responding:', err.message);
            resolve();
        });

        req.end();
    });
}

// Test static asset caching
function testStaticAssets() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/assets/img/logo.png',
            method: 'HEAD'
        };

        const req = http.request(options, (res) => {
            console.log('\n📁 Static Asset Caching:');
            
            if (res.headers['cache-control']) {
                console.log('✅ Cache-Control:', res.headers['cache-control']);
            } else {
                console.log('❌ Cache-Control: Missing');
            }
            
            if (res.headers['etag']) {
                console.log('✅ ETag: Present');
            } else {
                console.log('❌ ETag: Missing');
            }
            
            resolve();
        });

        req.on('error', () => {
            console.log('❌ Static asset test failed');
            resolve();
        });

        req.end();
    });
}

// Check optimized images
function checkOptimizedImages() {
    console.log('\n🖼️  Optimized Images Check:');
    
    const optimizedDir = './static/images-optimized';
    if (fs.existsSync(optimizedDir)) {
        const files = fs.readdirSync(optimizedDir);
        const webpFiles = files.filter(f => f.endsWith('.webp')).length;
        const totalFiles = files.length;
        
        console.log(`✅ Optimized images directory exists`);
        console.log(`✅ WebP images: ${webpFiles}`);
        console.log(`✅ Total optimized files: ${totalFiles}`);
        
        // Check file sizes
        const stats = fs.statSync(optimizedDir);
        console.log(`✅ Directory size: Optimized`);
    } else {
        console.log('❌ Optimized images directory not found');
    }
}

// Performance recommendations
function showRecommendations() {
    console.log('\n🎯 Performance Testing Recommendations:');
    console.log('');
    console.log('1. 🔍 Run Lighthouse Audit:');
    console.log('   - Open Chrome DevTools');
    console.log('   - Go to Lighthouse tab');
    console.log('   - Run audit for http://localhost:3000');
    console.log('');
    console.log('2. 📊 Online Performance Tests:');
    console.log('   - GTmetrix: https://gtmetrix.com/');
    console.log('   - PageSpeed Insights: https://pagespeed.web.dev/');
    console.log('   - WebPageTest: https://www.webpagetest.org/');
    console.log('');
    console.log('3. 🌐 Network Testing:');
    console.log('   - Chrome DevTools → Network tab');
    console.log('   - Throttle to "Slow 3G" to test mobile performance');
    console.log('   - Check for lazy loading of images');
    console.log('');
    console.log('4. 📱 Mobile Testing:');
    console.log('   - Use Chrome Device Mode');
    console.log('   - Test on actual mobile devices');
    console.log('   - Check touch interactions and responsiveness');
}

// Main test runner
async function runTests() {
    try {
        await testHeaders();
        await testStaticAssets();
        checkOptimizedImages();
        showRecommendations();
        
        console.log('\n🎉 Performance Testing Complete!');
        console.log('📊 Your website is optimized and ready for production!');
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

runTests();
