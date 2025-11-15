# McCarthy PA AI Agent

Voice + Text AI Personal Assistant for Australian Families

## Overview

McCarthy is a proactive, context-aware AI personal assistant designed for busy Australian families. It uses voice and text interaction to help coordinate family life with intelligent reminders, task management, calendar integration, and family messaging.

## Technology Stack

- **Framework:** React Native 0.76+
- **Backend:** Firebase (Auth, Firestore, Cloud Functions, Storage, FCM)
- **AI/LLM:** Llama 3.1 via Replicate (with GPT-4 upgrade path via abstraction layer)
- **Voice:** React Native Voice, native TTS
- **Maps:** React Native Maps, Google Maps API
- **i18n:** i18next, react-i18next
- **Timezones:** Luxon

## Key Features (MVP v7)

- Voice and text interaction
- Task management and reminders
- Calendar integration
- Shopping lists
- In-app family messaging
- Location awareness and geofencing
- Time zone support (Australian timezones)
- Safe times / Do Not Disturb mode
- Proactive context-aware notifications

## Architecture Highlights

- **Abstraction Layers:** LLM Service, External Messaging Service (designed for easy provider swapping)
- **Feature Flags:** Centralized feature flag system for V2/V3 features
- **i18n Ready:** All strings externalized for future translations
- **v7 Schema:** Future-proof database schema supporting multiple groups, polls, threads (empty in MVP)

## Getting Started

### Prerequisites

- Node.js 18+
- React Native CLI
- Xcode (for iOS) or Android Studio (for Android)
- Firebase CLI
- CocoaPods (for iOS)

### Installation

```bash
# Install dependencies
npm install

# iOS - Install pods
cd ios && pod install && cd ..

# Link native dependencies (if needed)
npm run link
```

### Environment Setup

Create `.env` file in project root:

```env
# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef

# LLM Service
LLM_PROVIDER=llama
REPLICATE_API_TOKEN=your_replicate_token
OPENAI_API_KEY=your_openai_key

# External Messaging
EXTERNAL_MSG_PROVIDER=native
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Feature Flags
FEATURE_MULTIPLE_GROUPS=false
FEATURE_POLLS=false
FEATURE_PRIVATE_THREADS=false
FEATURE_AUTOMATED_MESSAGING=false
```

### Running the App

```bash
# iOS
npm run ios

# Android
npm run android

# Metro bundler
npm start
```

## Development

### Project Structure

```
src/
├── components/       # React components
├── screens/          # Screen components
├── services/         # Business logic services
│   ├── LLMService.js
│   ├── ExternalMessagingService.js
│   ├── FeatureFlagService.js
│   └── ...
├── models/           # Data models
├── i18n/             # Internationalization
│   ├── config.js
│   └── locales/
│       └── en.json
├── navigation/       # Navigation setup
├── utils/            # Utility functions
└── constants/        # Constants and config
```

### Key Services

- **LLMService:** Abstraction layer for AI providers (Llama/GPT-4)
- **ExternalMessagingService:** Abstraction layer for messaging (Native/Twilio)
- **FeatureFlagService:** Feature flag management
- **TimezoneService:** Timezone handling using Luxon
- **LocationService:** Location tracking and geofencing
- **NotificationService:** Push notification handling

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- FeatureFlagService.test.js
```

## Building

```bash
# iOS Production
npm run ios:prod

# Android Production
npm run android:prod
```

## Documentation

See `/Requirements` folder for complete specifications:
- MVP_V1_Full_Developer_Specifications_v7.md
- Developer_Pre-Flight_Checklist_v7.md
- McCarthy_MVP_Must_Haves_Expanded.md

## License

Copyright © 2025 John Hutchison. All Rights Reserved.

