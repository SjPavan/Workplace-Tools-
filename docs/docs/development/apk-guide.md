---
sidebar_position: 3
title: APK Installation Guide
---

# APK Installation Guide

Guide to building and installing Android APK packages.

## Overview

While Workplace Tools is primarily a web application, this guide explains how to create an Android APK for app store distribution or sideloading.

## Building APK

### Prerequisites

- Android Studio installed
- Java Development Kit (JDK) 11+
- Android SDK (API 21+)
- Gradle build system
- Node.js & npm for web build

### Method 1: Using Expo (Recommended)

**What is Expo?**
Expo is a framework that makes it easy to build React Native apps. We use Expo EAS (Expo Application Services) for building APK.

#### Step 1: Setup Expo

```bash
# Install Expo CLI globally
npm install -g expo-cli

# Create Expo project from web app
expo init workplace-tools-mobile --template
cd workplace-tools-mobile
```

#### Step 2: Configure Expo

**app.json:**
```json
{
  "expo": {
    "name": "Workplace Tools",
    "slug": "workplace-tools",
    "version": "1.0.0",
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTabletMode": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.workplacetools"
    }
  }
}
```

#### Step 3: Build APK

```bash
# Create EAS account
# Visit https://expo.io and create account

# Login to Expo
expo login

# Build APK
eas build --platform android --local

# Or build on Expo servers
eas build --platform android
```

**Build takes 5-10 minutes**

#### Step 4: Download APK

```bash
# APK URL provided after build
# Download the .apk file
# Ready to install on Android devices
```

### Method 2: Using React Native CLI

#### Step 1: Create React Native Project

```bash
# Using npx
npx react-native init WorkplaceTools

# Navigate to project
cd WorkplaceTools
```

#### Step 2: Install Dependencies

```bash
npm install
npm install @react-navigation/native
npm install @react-navigation/bottom-tabs
```

#### Step 3: Build APK

```bash
# Navigate to android directory
cd android

# Build release APK
./gradlew assembleRelease

# APK location:
# app/build/outputs/apk/release/app-release.apk
```

**Build time:** 10-20 minutes

#### Step 4: Sign APK

```bash
# Create keystore (if not exists)
keytool -genkey -v -keystore my-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore my-release-key.jks \
  app/build/outputs/apk/release/app-release.apk \
  my-key-alias

# Optimize APK
zipalign -v 4 \
  app/build/outputs/apk/release/app-release.apk \
  app/build/outputs/apk/release/app-release-aligned.apk
```

### Method 3: Using Android Studio

#### Step 1: Open Android Project

```bash
# Open Android Studio
# File → Open
# Navigate to android/ directory
# Select and open
```

#### Step 2: Configure Build Variant

- Left sidebar: Select "Build Variants"
- Choose "release" variant
- Select CPU architecture (armeabi-v7a, arm64-v8a, x86, x86_64)

#### Step 3: Build APK

- Menu: Build → Build Bundle(s)/APK(s) → Build APK(s)
- Wait for build to complete
- APK appears in app/build/outputs/apk/

## Installation on Android Device

### Prerequisites

- Android device (API 21+)
- USB debugging enabled
- USB cable (for installation)
- 50MB+ free storage

### Enable USB Debugging

**On Android Device:**
1. Settings → About phone
2. Tap "Build number" 7 times
3. Developer options now visible
4. Back to Settings
5. Developer options → USB debugging → ON

### Installation Method 1: Using ADB

**Install via Android Debug Bridge:**

```bash
# Connect device via USB
# Verify connection
adb devices

# Install APK
adb install app-release.apk

# Expected output:
# Success
```

### Installation Method 2: Direct Download

1. Download APK to computer
2. Upload to cloud storage (Google Drive, Dropbox)
3. On Android device, download APK
4. Open file manager
5. Navigate to Downloads
6. Tap APK file
7. Tap "Install"
8. Allow unknown sources if prompted
9. Wait for installation
10. Open app from launcher

### Installation Method 3: Via Email/Messenger

1. Send APK via email or message
2. On Android device, open attachment
3. Tap "Download"
4. Notification appears
5. Tap "Install"
6. Follow prompts

## Troubleshooting APK

### Build Fails

**Problem:** Build doesn't complete

**Solutions:**
```bash
# Check Java version
java -version
# Should be 11 or higher

# Clean build cache
cd android
./gradlew clean
./gradlew assembleRelease

# Check disk space
# Need 5GB+ free space

# Update Gradle
# gradle/wrapper/gradle-wrapper.properties
# Update gradle version
```

### Installation Fails

**Problem:** APK won't install

**Solutions:**
- Check Android version (API 21+)
- Verify device storage (50MB+ free)
- Allow unknown sources:
  - Settings → Security → Unknown sources → ON
- Uninstall previous version first
- Restart device

### App Crashes After Install

**Problem:** App crashes on launch

**Solutions:**
```bash
# View logs
adb logcat

# Filter for app
adb logcat | grep WorkplaceTools

# Check for errors
# Common issues:
# - Missing dependencies
# - Wrong permissions
# - Environment not configured
```

### APK Size Too Large

**Problem:** APK exceeds limits

**Solutions:**
```bash
# Enable ProGuard (code minification)
# android/app/build.gradle
android {
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true
      proguardFiles ...
    }
  }
}

# Enable split APKs (different per architecture)
# android/app/build.gradle
android {
  splits {
    abi {
      enable true
      include 'armeabi-v7a', 'arm64-v8a'
    }
  }
}
```

## Distribution

### Google Play Store

**Requirements:**
- Google Play Developer account ($25 one-time)
- Signed APK (non-debug)
- Screenshots
- App description
- Privacy policy

**Steps:**
1. Create Google Play Developer account
2. Create app listing
3. Upload APK (or AAB)
4. Add description and screenshots
5. Set pricing
6. Submit for review
7. Wait for approval (1-3 hours)
8. App published

**Test Before Publishing:**
- Use internal testing track
- Add testers
- Collect feedback
- Fix issues
- Then release publicly

### Alternative App Stores

- **Amazon App Store** - Alternative distribution
- **Huawei AppGallery** - For Huawei devices
- **Samsung Galaxy Store** - For Samsung devices
- **F-Droid** - Open source apps

### Sideloading

Allow users to install directly:

1. Build APK
2. Host on server
3. Provide download link
4. Users download and install
5. No app store approval needed
6. Users must enable unknown sources

## Security Considerations

### Code Signing

**Always sign APK:**
```bash
# Debug signing (development only)
./gradlew assembleDebug

# Release signing (production)
./gradlew assembleRelease
# Requires keystore and passwords
```

### Permissions

**Declare in AndroidManifest.xml:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
```

### Sensitive Data

- Never hardcode API keys
- Use environment variables
- Encrypt credentials
- Use HTTPS only
- Validate user input

## Testing

### Device Testing

**Test on multiple devices:**
- Different Android versions
- Different screen sizes
- Different manufacturers
- Different device capabilities

**Use Firebase Test Lab:**
```bash
# Test on real devices
# Via Firebase console
# Automated and manual testing
```

### Emulation Testing

```bash
# Using Android Emulator
android avd

# Or use AVD Manager in Android Studio
# Create virtual device
# Test app on emulator
```

## Performance Optimization

### Bundle Optimization

```bash
# Use AAB (Android App Bundle) instead of APK
# Google Play automatically splits
# Smaller downloads per device

./gradlew bundleRelease

# Creates app.aab file
# Upload to Google Play
```

### Code Optimization

```bash
# Enable ProGuard
# Minifies and optimizes code
# Removes unused code
# Reduces APK size

# Enable Shrink Resources
# Removes unused resources
# Reduces APK size

# Use AndroidX
# Smaller than support library
# Better performance
```

## Release Checklist

Before releasing APK:

**Technical:**
- [ ] App builds without errors
- [ ] No TypeScript/JavaScript errors
- [ ] All features tested
- [ ] Performance optimized
- [ ] Battery usage acceptable
- [ ] Memory usage acceptable

**Security:**
- [ ] APK signed
- [ ] No hardcoded secrets
- [ ] No debug logging
- [ ] HTTPS for API calls
- [ ] Input validation

**Documentation:**
- [ ] User guide written
- [ ] Screenshots captured
- [ ] Release notes prepared
- [ ] Privacy policy available
- [ ] Support contact info provided

**Distribution:**
- [ ] App store listing created
- [ ] Description written
- [ ] Screenshots uploaded
- [ ] Version number set
- [ ] Changelog documented

**Testing:**
- [ ] Tested on 3+ devices
- [ ] Tested on 2+ Android versions
- [ ] Tested offline mode
- [ ] Tested slow networks
- [ ] Tested on old devices

## Screenshots & Marketing

### Taking Screenshots

**Tools:**
- Android Studio emulator screenshot
- Device's built-in screenshot
- Screen recording apps

**Best Practices:**
- Use high-quality devices
- Clean interface (no debug info)
- Show main features
- Use consistent style
- Landscape and portrait

### Screenshot Dimensions

**Google Play:**
- Minimum: 320 x 480px
- Maximum: 3840 x 2160px
- Recommended: 1080 x 1920px (landscape)

**Required:**
- Minimum 2 screenshots
- Maximum 8 screenshots
- 1 feature graphic (1024 x 500px)

## Version Management

### Semantic Versioning

```
MAJOR.MINOR.PATCH
1.0.0

MAJOR: Breaking changes
MINOR: New features
PATCH: Bug fixes
```

### Build Numbers

```
versionCode = 1  # Incremented per release
versionName = "1.0.0"  # User-facing version
```

---

**Screenshots embedded in this guide are example implementations.**

Next steps:
- [Quick Start Guide](../getting-started/quick-start)
- [Deployment Options](../getting-started/setup#deployment)
- [User Guide](../user-guide/overview)
