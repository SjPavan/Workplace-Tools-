#!/usr/bin/env node

/**
 * Cache Update Script for Workplace Tools PWA
 * 
 * This script scans the project directory for HTML files
 * and updates the service worker cache list automatically.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = __dirname;
const SW_FILE = path.join(PROJECT_ROOT, 'sw.js');
const IGNORE_DIRS = ['.git', 'node_modules', '.gitignore'];
const CACHE_VERSION = 'v1';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !IGNORE_DIRS.includes(file)) {
      findHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      // Get relative path from project root
      const relativePath = path.relative(PROJECT_ROOT, filePath);
      // Convert to web path (forward slashes, starting with /)
      const webPath = '/' + relativePath.replace(/\\/g, '/');
      fileList.push(webPath);
    }
  });
  
  return fileList;
}

function updateServiceWorker(htmlFiles) {
  log('Updating service worker...', 'cyan');
  
  // Read current service worker
  let swContent = fs.readFileSync(SW_FILE, 'utf8');
  
  // Update cache name with timestamp for versioning
  const timestamp = Date.now();
  const newCacheName = `workplace-tools-${CACHE_VERSION}-${timestamp}`;
  const newRuntimeCache = `workplace-tools-runtime-${CACHE_VERSION}-${timestamp}`;
  
  // Replace cache names
  swContent = swContent.replace(
    /const CACHE_NAME = ['"][^'"]+['"];/,
    `const CACHE_NAME = '${newCacheName}';`
  );
  swContent = swContent.replace(
    /const RUNTIME_CACHE = ['"][^'"]+['"];/,
    `const RUNTIME_CACHE = '${newRuntimeCache}';`
  );
  
  // Update static cache URLs
  const staticCacheUrls = [
    "'/'",
    "'/index.html'",
    "'/manifest.json'",
    ...htmlFiles.map(file => `'${file}'`)
  ];
  
  const staticCacheArray = `const STATIC_CACHE_URLS = [\n  ${staticCacheUrls.join(',\n  ')}\n];`;
  
  swContent = swContent.replace(
    /const STATIC_CACHE_URLS = \[[\s\S]*?\];/,
    staticCacheArray
  );
  
  // Write updated service worker
  fs.writeFileSync(SW_FILE, swContent);
  
  log(`✅ Service worker updated!`, 'green');
  log(`   Cache name: ${newCacheName}`, 'blue');
  log(`   Files cached: ${staticCacheUrls.length}`, 'blue');
}

function updateManifest() {
  log('Updating manifest...', 'cyan');
  
  const manifestPath = path.join(PROJECT_ROOT, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Update version (simple timestamp)
  manifest.version = new Date().toISOString().split('T')[0];
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  log('✅ Manifest updated!', 'green');
}

function generateCacheReport(htmlFiles) {
  log('Generating cache report...', 'cyan');
  
  const report = {
    timestamp: new Date().toISOString(),
    version: CACHE_VERSION,
    files: htmlFiles,
    totalFiles: htmlFiles.length,
    cacheSize: htmlFiles.length * 50 // Estimated size in KB
  };
  
  const reportPath = path.join(PROJECT_ROOT, 'cache-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`✅ Cache report generated: cache-report.json`, 'green');
}

function main() {
  log('🚀 Workplace Tools Cache Updater', 'bright');
  log('================================', 'bright');
  
  try {
    // Find all HTML files
    log('Scanning for HTML files...', 'yellow');
    const htmlFiles = findHtmlFiles(PROJECT_ROOT);
    
    log(`Found ${htmlFiles.length} HTML files:`, 'blue');
    htmlFiles.forEach(file => log(`  ${file}`, 'cyan'));
    
    // Update service worker
    updateServiceWorker(htmlFiles);
    
    // Update manifest
    updateManifest();
    
    // Generate report
    generateCacheReport(htmlFiles);
    
    log('', 'reset');
    log('🎉 Cache update completed successfully!', 'green');
    log('', 'reset');
    log('Next steps:', 'yellow');
    log('1. Commit the updated service worker and manifest', 'cyan');
    log('2. Deploy your changes', 'cyan');
    log('3. Test offline functionality in browser dev tools', 'cyan');
    log('4. Run Lighthouse PWA audit to verify compliance', 'cyan');
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  findHtmlFiles,
  updateServiceWorker,
  updateManifest,
  generateCacheReport
};