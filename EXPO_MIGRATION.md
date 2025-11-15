# Expo Migration Notes

This project has been converted to use **Expo** instead of React Native CLI.

## Key Changes

### 1. Package.json
- ✅ Changed main entry point to `node_modules/expo/AppEntry.js`
- ✅ Updated scripts to use Expo commands
- ✅ Replaced React Native Firebase with standard Firebase SDK
- ✅ Added Expo packages (expo-location, expo-calendar, expo-speech, etc.)
- ✅ Added EAS build scripts

### 2. Configuration Files
- ✅ Created `app.json` and `app.config.js` for Expo configuration
- ✅ Updated `babel.config.js` to use `babel-preset-expo`
- ✅ Created `eas.json` for EAS build configuration
- ✅ Updated entry point (`app.js`)

### 3. Firebase Integration
- ✅ Switched from `@react-native-firebase` to standard `firebase` SDK
- ✅ Updated Firebase initialization for Expo compatibility
- ✅ Uses AsyncStorage for auth persistence
- ✅ Uses Expo Notifications instead of FCM for push notifications

### 4. Dependencies Replaced

| Old (RN CLI) | New (Expo) |
|-------------|------------|
| @react-native-firebase/* | firebase |
| react-native-encrypted-storage | expo-secure-store |
| @react-native-voice/voice | expo-speech, expo-av |
| react-native-geolocation-service | expo-location |
| Native calendar APIs | expo-calendar |
| FCM | expo-notifications |

### 5. Development Workflow

**Before (RN CLI):**
```bash
npm run android  # Runs on emulator
npm run ios      # Runs on simulator
```

**After (Expo):**
```bash
npm start        # Start Expo dev server
# Then scan QR code with Expo Go app
# Or press 'i' for iOS, 'a' for Android
```

### 6. Building for Production

**Before (RN CLI):**
- Manual build with Xcode/Android Studio
- Configure native code directly

**After (Expo):**
- Use EAS Build (cloud builds)
- `eas build --platform ios`
- `eas build --platform android`
- No need for Xcode/Android Studio for most builds

## Benefits of Expo

1. **Faster Development** - Expo Go app allows instant testing without building
2. **Easier Setup** - No need for Xcode/Android Studio setup
3. **Managed Workflow** - Expo handles native code compilation
4. **Over-the-Air Updates** - Update app without app store approval (for JS changes)
5. **Cross-Platform** - Same codebase for iOS, Android, and Web

## Firebase with Expo

### Web (Full Support)
- All Firebase features work: Auth, Firestore, Storage, Analytics, Messaging

### Native (iOS/Android)
- Auth: ✅ Works with Firebase SDK
- Firestore: ✅ Works with Firebase SDK
- Storage: ✅ Works with Firebase SDK
- Analytics: ⚠️ Limited (use Expo Analytics or custom solution)
- Messaging: ⚠️ Use expo-notifications instead of FCM

### Push Notifications
- Use `expo-notifications` for push notifications
- Can still send from Firebase Cloud Functions
- Configure in `app.json` plugins

## Next Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Test on Device**
   - Install Expo Go app on your phone
   - Scan QR code from terminal

4. **Configure EAS (for production builds)**
   ```bash
   npx expo login
   npx eas build:configure
   ```

5. **Update Firebase Config**
   - Place `GoogleService-Info.plist` and `google-services.json` in project root
   - Update `.env` with Firebase credentials

## Important Notes

- **Expo Go Limitations**: Some native modules require custom development builds
- **Firebase Config**: Place config files in project root (not ios/android folders)
- **Push Notifications**: Use `expo-notifications` instead of FCM directly
- **EAS Build**: Required for production builds (free tier available)

## Migration Checklist

- [x] Update package.json with Expo dependencies
- [x] Create app.json configuration
- [x] Update babel.config.js
- [x] Update Firebase configuration
- [x] Update App.js for Expo
- [x] Update SETUP.md with Expo instructions
- [x] Create eas.json
- [ ] Test Expo Go development
- [ ] Configure EAS project
- [ ] Test production build

