# McCarthy App - Setup Guide (Expo)

## Prerequisites

Before setting up the project, ensure you have:

- Node.js 18+ installed
- Expo CLI installed globally (`npm install -g expo-cli` or use `npx expo`)
- Expo Go app installed on your iOS/Android device (for development)
- Firebase CLI installed (`npm install -g firebase-tools`) - for Cloud Functions
- EAS CLI installed (`npm install -g eas-cli`) - for building production apps

## Initial Setup

### 1. Install Dependencies

```bash
cd Project
npm install
```

### 2. Install Expo CLI (if not already installed)

```bash
npm install -g expo-cli
# Or use npx expo (no installation needed)
```

### 3. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Add iOS and Android apps to your Firebase project
3. Download configuration files:
   - iOS: `GoogleService-Info.plist` → Place in project root (`Project/`)
   - Android: `google-services.json` → Place in project root (`Project/`)
4. Enable Firebase services:
   - Authentication (Email/Password)
   - Firestore Database
   - Cloud Storage
   - Cloud Messaging (FCM)
   - Cloud Functions
   - Analytics
   - Crashlytics

5. Login to Firebase CLI:
```bash
firebase login
firebase use --add
```

### 4. Environment Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your Firebase configuration and API keys:
   - Firebase API keys (from Firebase Console)
   - Replicate API token (for Llama 3.1)
   - Google Maps API key
   - (Optional) Twilio credentials (for V2)

### 5. Setup EAS (Expo Application Services)

```bash
# Login to Expo
npx expo login

# Configure EAS
npx eas build:configure
```

### 6. Deploy Firebase Rules and Functions

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy Cloud Functions
cd functions
npm install
cd ..
firebase deploy --only functions
```

## Running the App

### Development (Expo Go)

```bash
# Start Expo development server
npm start
# or
npx expo start

# Then:
# - Scan QR code with Expo Go app (iOS/Android)
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Press 'w' for web browser
```

### iOS

```bash
# Run on iOS simulator
npm run ios
# or
npx expo start --ios

# Run on physical device (requires Expo Go app)
npx expo start
# Then scan QR code with Camera app (iOS) or Expo Go app
```

### Android

```bash
# Run on Android emulator
npm run android
# or
npx expo start --android

# Run on physical device (requires Expo Go app)
npx expo start
# Then scan QR code with Expo Go app
```

### Web

```bash
npm run web
# or
npx expo start --web
```

## Building for Production

### Development Build

```bash
# iOS development build
npx eas build --platform ios --profile development

# Android development build
npx eas build --platform android --profile development
```

### Production Build

```bash
# iOS production build
npm run build:ios
# or
npx eas build --platform ios --profile production

# Android production build
npm run build:android
# or
npx eas build --platform android --profile production
```

### Submit to App Stores

```bash
# Submit iOS to App Store
npm run submit:ios
# or
npx eas submit --platform ios

# Submit Android to Play Store
npm run submit:android
# or
npx eas submit --platform android
```

## Project Structure

```
Project/
├── src/
│   ├── components/         # Reusable React components
│   ├── screens/            # Screen components
│   ├── services/           # Business logic services
│   │   ├── LLMService.js
│   │   ├── ExternalMessagingService.js
│   │   ├── FeatureFlagService.js
│   │   └── TimezoneService.js
│   ├── models/             # Data models (v7 schema)
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Message.js
│   │   ├── Task.js
│   │   └── ShoppingList.js
│   ├── i18n/               # Internationalization
│   │   ├── config.js
│   │   └── locales/
│   │       └── en.json
│   ├── navigation/         # Navigation setup
│   ├── config/             # Configuration files
│   ├── constants/          # Constants and config
│   └── utils/              # Utility functions
├── functions/              # Firebase Cloud Functions
│   ├── src/
│   │   ├── llm/
│   │   ├── notifications/
│   │   ├── location/
│   │   └── tasks/
│   └── index.js
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
└── firebase.json           # Firebase configuration
```

## Key Features Implemented

### ✅ Completed

1. **Project Structure** - Complete React Native 0.76+ setup
2. **Firebase Integration** - Auth, Firestore, Storage, Functions, FCM
3. **v7 Database Schema** - All models with v7 fields
4. **Abstraction Layers**:
   - LLM Service (Llama 3.1 / GPT-4 swappable)
   - External Messaging Service (Native / Twilio swappable)
   - Feature Flags Service
   - Timezone Service (Luxon-based)
5. **i18n Setup** - English translations ready for V3
6. **Navigation** - Tab navigation with authentication flow
7. **Basic Screens** - Auth, Home, Tasks, Calendar, Shopping, Messages, Settings
8. **Cloud Functions** - Message processing, reminders, notifications

### 🚧 Next Steps

1. **Voice Interaction** - Wake word detection, speech recognition, TTS
2. **Text Chat Interface** - Complete chat UI with McCarthy responses
3. **Task Management** - Full CRUD operations, reminders
4. **Calendar Integration** - Native calendar APIs
5. **Shopping Lists** - Complete shopping list functionality
6. **Family Messaging** - Real-time chat with Firebase
7. **Location Services** - Geofencing and location-based reminders
8. **Push Notifications** - FCM setup and notification handling

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## Building for Production

### iOS

```bash
# Build for production
cd ios
xcodebuild -workspace McCarthy.xcworkspace -scheme McCarthy -configuration Release
```

### Android

```bash
# Build APK
cd android
./gradlew assembleRelease

# Build AAB (for Play Store)
./gradlew bundleRelease
```

## Troubleshooting

### Common Issues

1. **Metro bundler cache issues**: `npx expo start --clear`
2. **Expo Go connection issues**: Ensure device and computer are on the same network
3. **Firebase connection**: Verify `.env` file and Firebase project configuration
4. **EAS build errors**: Check `eas.json` configuration and ensure EAS CLI is up to date
5. **iOS simulator not launching**: Ensure Xcode is installed and simulator is available
6. **Android emulator not launching**: Ensure Android Studio is installed and emulator is set up

## Documentation

For complete specifications, see:
- `/Requirements/MVP_V1_Full_Developer_Specifications_v7.md`
- `/Requirements/Developer_Pre-Flight_Checklist_v7.md`
- `/Requirements/McCarthy_MVP_Must_Haves_Expanded.md`

## Support

For issues or questions, refer to the documentation in the Requirements folder.

