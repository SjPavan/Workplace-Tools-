#!/usr/bin/env node

/**
 * PWA Test Script for Workplace Tools
 * 
 * This script performs basic checks to verify PWA functionality
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - Missing: ${filePath}`, 'red');
    return false;
  }
}

function checkManifest() {
  log('\n📋 Checking PWA Manifest...', 'yellow');
  
  const manifestPath = path.join(__dirname, 'manifest.json');
  if (!checkFile(manifestPath, 'manifest.json exists')) return false;
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'background_color', 'theme_color'];
    let allValid = true;
    
    requiredFields.forEach(field => {
      if (manifest[field]) {
        log(`  ✓ ${field}: ${manifest[field]}`, 'green');
      } else {
        log(`  ❌ Missing field: ${field}`, 'red');
        allValid = false;
      }
    });
    
    if (manifest.icons && manifest.icons.length > 0) {
      log(`  ✓ Icons: ${manifest.icons.length} icons defined`, 'green');
    } else {
      log(`  ⚠️  No icons defined`, 'yellow');
    }
    
    return allValid;
  } catch (error) {
    log(`❌ Invalid manifest.json: ${error.message}`, 'red');
    return false;
  }
}

function checkServiceWorker() {
  log('\n🔧 Checking Service Worker...', 'yellow');
  
  const swPath = path.join(__dirname, 'sw.js');
  if (!checkFile(swPath, 'sw.js exists')) return false;
  
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  const checks = [
    { pattern: /addEventListener\(['"]install['"]/, message: 'Install event listener' },
    { pattern: /addEventListener\(['"]activate['"]/, message: 'Activate event listener' },
    { pattern: /addEventListener\(['"]fetch['"]/, message: 'Fetch event listener' },
    { pattern: /caches\.open/, message: 'Cache API usage' },
    { pattern: /CACHE_NAME/, message: 'Cache versioning' }
  ];
  
  let allValid = true;
  checks.forEach(check => {
    if (check.pattern.test(swContent)) {
      log(`  ✓ ${check.message}`, 'green');
    } else {
      log(`  ❌ Missing: ${check.message}`, 'red');
      allValid = false;
    }
  });
  
  return allValid;
}

function checkHTMLFiles() {
  log('\n📄 Checking HTML Files...', 'yellow');
  
  const htmlFiles = [
    { path: 'index.html', description: 'Main page' },
    { path: 'tools/case-converter.html', description: 'Case converter tool' },
    { path: 'tools/title-converter.html', description: 'Title converter tool' },
    { path: 'tools/virtual-browser.html', description: 'Virtual browser tool' },
    { path: 'tools/clipboard-helper.html', description: 'Clipboard helper tool' }
  ];
  
  let allValid = true;
  htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file.path);
    if (checkFile(filePath, file.description)) {
      // Check for service worker registration
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('serviceWorker') && content.includes('register')) {
        log(`  ✓ Service worker registration in ${file.path}`, 'green');
      } else {
        log(`  ⚠️  No service worker registration in ${file.path}`, 'yellow');
      }
    } else {
      allValid = false;
    }
  });
  
  return allValid;
}

function checkOfflineSupport() {
  log('\n📱 Checking Offline Support...', 'yellow');
  
  // Check if service worker has offline fallback
  const swPath = path.join(__dirname, 'sw.js');
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  let offlineSupport = true;
  
  if (swContent.includes('caches.match')) {
    log('  ✓ Cache-first strategy implemented', 'green');
  } else {
    log('  ❌ No cache strategy found', 'red');
    offlineSupport = false;
  }
  
  if (swContent.includes('catch') && swContent.includes('offline')) {
    log('  ✓ Offline fallback handling', 'green');
  } else {
    log('  ⚠️  Limited offline fallback', 'yellow');
  }
  
  return offlineSupport;
}

function main() {
  log('🧪 PWA Test Suite for Workplace Tools', 'bright');
  log('=====================================', 'bright');
  
  const results = {
    manifest: checkManifest(),
    serviceWorker: checkServiceWorker(),
    htmlFiles: checkHTMLFiles(),
    offlineSupport: checkOfflineSupport()
  };
  
  log('\n📊 Test Results Summary:', 'bright');
  log('========================', 'bright');
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${test.padEnd(15)}: ${status}`, color);
  });
  
  log(`\nOverall: ${passedTests}/${totalTests} tests passed`, 
       passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('\n🎉 All PWA requirements met!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Deploy to a static hosting service', 'cyan');
    log('2. Test in browser with DevTools', 'cyan');
    log('3. Run Lighthouse PWA audit', 'cyan');
    log('4. Test installation on mobile/desktop', 'cyan');
  } else {
    log('\n⚠️  Some PWA requirements not met. Please review the issues above.', 'yellow');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkFile,
  checkManifest,
  checkServiceWorker,
  checkHTMLFiles,
  checkOfflineSupport
};