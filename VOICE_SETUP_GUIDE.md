# Voice Chat Setup Guide

## Problem
`@react-native-voice/voice` requires native code compilation, which doesn't work with Expo Go. You need to create a **development build** instead.

## Prerequisites

### 1. Install Java JDK (Required for Android builds)

**Windows:**
1. Download JDK 17 or 21 from: https://adoptium.net/ (or Oracle JDK)
2. Install it (default location: `C:\Program Files\Java\jdk-XX`)
3. Set JAVA_HOME environment variable:
   - Open System Properties → Environment Variables
   - Add new System Variable:
     - Name: `JAVA_HOME`
     - Value: `C:\Program Files\Java\jdk-XX` (replace XX with your version)
   - Add to PATH: `%JAVA_HOME%\bin`
4. Restart your terminal/command prompt
5. Verify: `java -version` should show Java version

**Alternative (using Chocolatey):**
```powershell
choco install openjdk17
```

### 2. Install Android Studio (If not already installed)

1. Download from: https://developer.android.com/studio
2. Install Android Studio
3. Open Android Studio → SDK Manager
4. Install Android SDK (API 33 or 34 recommended)
5. Set ANDROID_HOME environment variable:
   - Name: `ANDROID_HOME`
   - Value: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
   - Add to PATH: `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\tools`

## Solution: Create Development Build

### Option 1: Use `expo run:android` (Recommended - Auto-generates native code)

**After setting up Java and Android Studio:**

```bash
npx expo run:android
```

This will:
- Automatically generate `android/` folder with native code
- Compile native code with the voice library
- Build the app
- Install it on your emulator/device

**Note:** If you get autolinking errors, try:
```bash
npx expo run:android --clean
```

### Option 2: Manual Prebuild (If Option 1 fails)

If `expo run:android` doesn't work, try manual prebuild:

```bash
# First, update expo packages
npm install expo@latest @expo/cli@latest

# Then try prebuild again
npx expo prebuild --clean

# Then build
npx expo run:android
```

### Step 3: Build and Run (iOS)
```bash
npx expo run:ios
```
**Note:** Requires Xcode and macOS.

## Alternative: EAS Build (for physical devices)

If you need to test on a physical device:

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Build development version
eas build --profile development --platform android
```

## What Happens After Setup

Once you create a development build:
1. ✅ Voice library will be properly linked
2. ✅ Microphone permissions will work
3. ✅ Speech recognition will function
4. ✅ Voice input will convert speech to text
5. ✅ Text will be sent to McCarthy chat

## Current Status

- ✅ Library installed: `@react-native-voice/voice` v3.2.4
- ✅ Permissions configured in `app.config.js`
- ✅ Service code ready in `SpeechRecognitionService.js`
- ⚠️ **Waiting for development build** (native code compilation)

## Testing Voice Input

After creating the development build:

1. Open the app
2. Navigate to Chat screen
3. Click the microphone icon
4. Grant microphone permission when prompted
5. Speak your message
6. Speech will be converted to text and sent to McCarthy

## Troubleshooting

### Error: "JAVA_HOME is not set"
- **Cause:** Java JDK not installed or JAVA_HOME not configured
- **Fix:** 
  1. Install JDK 17 or 21 from https://adoptium.net/
  2. Set JAVA_HOME environment variable to JDK installation path
  3. Add `%JAVA_HOME%\bin` to PATH
  4. Restart terminal and try again

### Error: "Cannot read property 'isSpeechAvailable' of null"
- **Cause:** Native module not linked (using Expo Go)
- **Fix:** Create development build with `npx expo run:android`

### Error: "Microphone permission denied"
- **Cause:** User denied permission
- **Fix:** Go to device Settings → Apps → McCarthy → Permissions → Microphone → Allow

### Error: "Speech recognition not available"
- **Cause:** Voice library not properly linked
- **Fix:** Rebuild with `npx expo run:android --clean`

### Error: "ANDROID_HOME is not set"
- **Cause:** Android SDK not installed or ANDROID_HOME not configured
- **Fix:** 
  1. Install Android Studio
  2. Install Android SDK through SDK Manager
  3. Set ANDROID_HOME environment variable
  4. Add platform-tools to PATH

## Next Steps

1. Run `npx expo prebuild` to generate native code
2. Run `npx expo run:android` to build and test
3. Test voice input functionality
4. If issues persist, check native code linking in `android/app/build.gradle`

