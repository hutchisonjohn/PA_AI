# PA_AI - Dartmouth API Integration

This document describes the integration of PA_AI mobile app with Dartmouth backend APIs.

## Overview

PA_AI has been updated to use Dartmouth APIs instead of Firebase for:
- Authentication (login, register)
- User profile management
- Chat (text and voice)

## API Endpoints

### Base URL
```
https://dartmouth-os-worker.lucy-hunter-9411.workers.dev
```

### Authentication

#### Register
```
POST /api/pa-ai/auth/register
Body: {
  email: string,
  password: string,
  name: string,
  phoneNumber?: string,
  timezone?: string
}
Response: {
  token: string,
  user: { id, email, name, ... }
}
```

#### Login
```
POST /api/pa-ai/auth/login
Body: {
  email: string,
  password: string
}
Response: {
  token: string,
  user: { id, email, name, ... }
}
```

#### Logout
```
POST /api/auth/logout
Headers: Authorization: Bearer <token>
```

### Profile

#### Get Profile
```
GET /api/pa-ai/profile
Headers: Authorization: Bearer <token>
Response: {
  user: { ...full user profile }
}
```

#### Update Profile
```
PUT /api/pa-ai/profile
Headers: Authorization: Bearer <token>
Body: {
  name?: string,
  phoneNumber?: string,
  timezone?: string,
  ... (any profile field)
}
Response: {
  user: { ...updated user profile }
}
```

### Chat

#### Text Chat
```
POST /api/pa-ai/chat
Headers: Authorization: Bearer <token>
Body: {
  message: string,
  sessionId?: string,
  history?: Array<{role: string, content: string}>,
  context?: object
}
Response: {
  content: string,
  type: string,
  sessionId: string,
  messageId: string,
  metadata: object,
  timestamp: string
}
```

#### Voice Chat (Future)
```
POST /api/pa-ai/chat/voice
Headers: Authorization: Bearer <token>
Body: FormData {
  audio: File,
  sessionId?: string
}
Response: {
  content: string,
  ... (same as text chat)
}
```

## Implementation Details

### Service Layer
- `PA_AI/src/services/DartmouthAPIService.js` - Centralized API service
- Handles authentication token storage (AsyncStorage)
- Provides methods for all API calls

### Updated Screens

1. **AuthScreen** (`src/screens/AuthScreen.js`)
   - Uses `DartmouthAPI.register()` and `DartmouthAPI.login()`
   - Removed Firebase Auth dependency

2. **ChatScreen** (`src/screens/ChatScreen.js`)
   - Uses `DartmouthAPI.sendChatMessage()`
   - Removed Firebase Firestore dependency
   - Removed direct LLMService calls
   - Messages stored in local state only

3. **ProfileSetupScreen** (`src/screens/ProfileSetupScreen.js`)
   - Uses `DartmouthAPI.updateProfile()`
   - Removed Firebase Firestore dependency

## Environment Variables

Add to `PA_AI/.env`:
```env
DARTMOUTH_API_URL=https://dartmouth-os-worker.lucy-hunter-9411.workers.dev
```

Or configure in `app.config.js`:
```javascript
extra: {
  dartmouthApiUrl: 'https://dartmouth-os-worker.lucy-hunter-9411.workers.dev',
}
```

## Database Migration

Run the migration to create the `pa_ai_users` table:
```bash
cd dartmouth/packages/worker
npx wrangler d1 execute dartmouth-os-db --file=./migrations/0012_pa_ai_user_profiles.sql
```

## Testing

### Register a new user
```bash
curl -X POST https://dartmouth-os-worker.lucy-hunter-9411.workers.dev/api/pa-ai/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User",
    "timezone": "Australia/Sydney"
  }'
```

### Login
```bash
curl -X POST https://dartmouth-os-worker.lucy-hunter-9411.workers.dev/api/pa-ai/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Send Chat Message
```bash
curl -X POST https://dartmouth-os-worker.lucy-hunter-9411.workers.dev/api/pa-ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "message": "Hello, can you help me?",
    "sessionId": "test-session-123"
  }'
```

## Notes

- Authentication tokens are stored in AsyncStorage
- Session IDs are generated automatically if not provided
- Voice chat endpoint is prepared but requires audio-to-text conversion (currently returns 501)
- All profile fields from PA_AI v7 schema are supported

