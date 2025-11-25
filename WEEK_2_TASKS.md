# Week 2 - Task List
## McCarthy PA AI Agent - MVP Development

**Timeline:** Week 2 of 8-week MVP development  
**Phase:** Phase 1 - Foundation (Weeks 1-2)  
**Focus:** Complete user authentication & profiles, text chat interface, LLM integration

---

## 📋 Overview

Week 2 builds on Week 1's foundation work. Completed:
- ✅ Project structure and Firebase setup
- ✅ v7 database schema implementation
- ✅ Abstraction layers (LLM, External Messaging, Feature Flags, Timezone)
- ✅ i18n setup
- ✅ Navigation structure
- ✅ Basic screen scaffolding

**Week 2 Goals:**
1. Complete user authentication with profile creation
2. Add timezone selection during signup
3. Build text chat interface for McCarthy
4. Integrate LLM service with the app
5. Voice interaction (wake word, speech-to-text, text-to-speech)

---

## 🎯 TASK 1: Complete User Authentication & Profile Setup

### 1.1 Enhance Signup Flow with Profile Creation

**Tasks:**
- [ ] Update `AuthScreen.js` to collect additional user information during signup:
  - [ ] Full name (first name, last name)
  - [ ] Phone number (optional, for SMS fallback)
  - [ ] Timezone selection (required - Australian timezones only for MVP)
  - [ ] Profile photo upload (optional)

- [ ] Create user profile creation flow:
  - [ ] After email/password signup, show profile setup screen
  - [ ] Collect: name, timezone, phone (optional)
  - [ ] Create user document in Firestore with v7 schema:
    ```javascript
    {
      userId: "user_123",
      email: "sarah@example.com",
      name: "Sarah Hutchison",
      phoneNumber: "+61423456789", // optional
      timezone: "Australia/Sydney", // REQUIRED
      currency: "AUD", // default
      locale: "en-AU", // default
      groupIds: [], // empty initially
      defaultGroupId: null, // set when first group created
      defaultShoppingListId: null, // set when first list created
    }
    ```

- [ ] Update `User.js` model to ensure all v7 fields are included:
  - [ ] Verify `groupIds[]` array (not `familyGroupId`)
  - [ ] Verify `defaultGroupId`
  - [ ] Verify `currency` and `locale` fields
  - [ ] Verify `defaultShoppingListId`

**Acceptance Criteria:**
- [ ] New users can sign up with email/password
- [ ] Profile setup screen appears after signup
- [ ] Timezone selection is required (dropdown with Australian timezones)
- [ ] User document created in Firestore with all v7 schema fields
- [ ] Default values set correctly (currency: "AUD", locale: "en-AU")

---

### 1.2 Timezone Selection Component

**Tasks:**
- [ ] Create `TimezonePicker` component:
  - [ ] Dropdown/picker with Australian timezones:
    - [ ] Sydney/Melbourne (AEST/AEDT) - `Australia/Sydney`
    - [ ] Brisbane (AEST) - `Australia/Brisbane`
    - [ ] Adelaide (ACST/ACDT) - `Australia/Adelaide`
    - [ ] Darwin (ACST) - `Australia/Darwin`
    - [ ] Perth (AWST) - `Australia/Perth`
  - [ ] Show current time in selected timezone
  - [ ] Handle daylight saving time automatically (Luxon library)
  - [ ] Allow user to change timezone in Settings (for travel scenarios)

- [ ] Use `TimezoneService.js` for timezone operations:
  - [ ] Verify Luxon is installed and working
  - [ ] Use `DateTime.now().setZone(timezone)` for display

**Note on Timezone vs Location:**
- **Timezone** = User's preferred time zone for displaying times and scheduling notifications (e.g., "Australia/Sydney")
- **Location** = User's actual GPS location (separate feature, implemented in Week 4)
- Users can manually change timezone in Settings if they travel (e.g., Sydney → Perth)
- Future enhancement: Auto-detect timezone from GPS location and suggest update

**Acceptance Criteria:**
- [ ] Timezone picker shows all Australian timezones
- [ ] Current time displays correctly in selected timezone
- [ ] Daylight saving time handled automatically
- [ ] Selected timezone saved to user profile
- [ ] User can change timezone in Settings screen

---

### 1.3 User Profile Screen

**Tasks:**
- [ ] Create `ProfileScreen.js` (or add to `SettingsScreen.js`):
  - [ ] Display user information:
    - [ ] Name, email, phone
    - [ ] Current timezone (with option to change)
    - [ ] Profile photo
  - [ ] Allow editing:
    - [ ] Update name
    - [ ] Change timezone
    - [ ] Update phone number
    - [ ] Change profile photo

- [ ] Add profile photo upload:
  - [ ] Use Firebase Storage
  - [ ] Image picker (react-native-image-picker or expo-image-picker)
  - [ ] Upload to `users/{userId}/profile.jpg`
  - [ ] Update user document with `profilePhotoUrl`

**Acceptance Criteria:**
- [ ] User can view their profile
- [ ] User can edit name, timezone, phone
- [ ] Profile photo can be uploaded and displayed
- [ ] Changes saved to Firestore

---

## 🎯 TASK 2: Text Chat Interface

### 2.1 Chat UI Components

**Tasks:**
- [ ] Create `ChatScreen.js` (or enhance `HomeScreen.js`):
  - [ ] Message list (FlatList or ScrollView)
  - [ ] Message bubbles:
    - [ ] User messages (right-aligned, blue)
    - [ ] McCarthy messages (left-aligned, gray)
    - [ ] System messages (centered, subtle)
  - [ ] Message input field at bottom
  - [ ] Send button
  - [ ] Typing indicator (for when McCarthy is processing)

- [ ] Create `MessageBubble.js` component:
  - [ ] Display message text
  - [ ] Show timestamp (formatted in user's timezone)
  - [ ] Different styles for user vs McCarthy messages
  - [ ] Support for message types (text, system, error)

- [ ] Create `MessageInput.js` component:
  - [ ] Text input field
  - [ ] Send button
  - [ ] Voice input button (for later)
  - [ ] Character counter (optional)

**Acceptance Criteria:**
- [ ] Chat interface displays messages
- [ ] User can type and send messages
- [ ] Messages appear in correct format (user vs McCarthy)
- [ ] Timestamps display in user's timezone
- [ ] UI is responsive and scrollable

---

### 2.2 LLM Service Integration

**Tasks:**
- [ ] Connect chat interface to LLM service:
  - [ ] When user sends message, call `LLMService.processMessage()`
  - [ ] Show loading/typing indicator while processing
  - [ ] Display McCarthy's response in chat
  - [ ] Handle errors gracefully

- [ ] Set up environment variables:
  - [ ] Create `.env` file (if not exists)
  - [ ] Add `REPLICATE_API_TOKEN` (get from Replicate.com)
  - [ ] Add `LLM_PROVIDER=llama` (default)
  - [ ] Verify `.env` is in `.gitignore`

- [ ] Test LLM integration:
  - [ ] Send test message: "Hello McCarthy"
  - [ ] Verify response comes back
  - [ ] Test function calling (if implemented): "Add milk to shopping list"
  - [ ] Handle API errors (network, rate limits, etc.)

- [ ] Add conversation history:
  - [ ] Store messages in local state (for now)
  - [ ] Send conversation history to LLM (last 10 messages)
  - [ ] Format conversation context properly

**Acceptance Criteria:**
- [ ] User messages sent to LLM service
- [ ] McCarthy responses appear in chat
- [ ] Loading states work correctly
- [ ] Errors handled gracefully
- [ ] Conversation history maintained

---

### 2.3 Message Storage (Firestore)

**Tasks:**
- [ ] Store chat messages in Firestore:
  - [ ] Create `conversations` collection (or use `messages` collection)
  - [ ] Store user messages and McCarthy responses
  - [ ] Include: userId, message, timestamp, messageType (user/mccarthy/system)

- [ ] Load conversation history:
  - [ ] On chat screen load, fetch last 50 messages
  - [ ] Display in chronological order
  - [ ] Real-time updates (optional for now)

- [ ] Update `Message.js` model if needed:
  - [ ] Verify v7 schema fields (`parentGroupId`, `threadId` - set to null for MVP)

**Acceptance Criteria:**
- [ ] Messages saved to Firestore
- [ ] Conversation history loads on screen open
- [ ] Messages persist across app restarts
- [ ] v7 schema fields included (even if null)

---

## 🎯 TASK 3: Voice Interaction Setup

### 3.1 Wake Word Detection

**Tasks:**
- [ ] Research and choose wake word library:
  - [ ] Option 1: `openWakeWord` (free, open-source) - recommended
  - [ ] Option 2: `@picovoice/porcupine-react-native` (fallback if openWakeWord has issues)
  - [ ] Install chosen library

- [ ] Create `WakeWordService.js`:
  - [ ] Initialize wake word detection
  - [ ] Listen for "Hey McCarthy" (or configurable phrase)
  - [ ] Trigger callback when wake word detected
  - [ ] Handle permissions (microphone access)
  - [ ] Handle background/foreground states

- [ ] Add wake word UI:
  - [ ] Visual indicator when listening for wake word
  - [ ] Animation when wake word detected
  - [ ] Toggle wake word on/off in settings
  - [ ] Show status (listening, detected, error)

**Acceptance Criteria:**
- [ ] Wake word detection library installed
- [ ] "Hey McCarthy" triggers callback reliably
- [ ] Microphone permissions requested and handled
- [ ] Visual feedback when wake word detected
- [ ] Can toggle wake word on/off in settings
- [ ] Works in background (if supported by library)

---

### 3.2 Speech Recognition (Voice Input)

**Tasks:**
- [ ] Set up native speech recognition:
  - [ ] iOS: Use `@react-native-voice/voice` (already in dependencies)
  - [ ] Android: Use `@react-native-voice/voice`
  - [ ] Request microphone permissions

- [ ] Create `SpeechRecognitionService.js`:
  - [ ] Start listening after wake word detected
  - [ ] Convert speech to text
  - [ ] Handle errors (no speech detected, network errors, etc.)
  - [ ] Stop listening after timeout or silence
  - [ ] Show "Listening..." indicator

- [ ] Integrate with chat:
  - [ ] After wake word + speech recognition, send text to chat
  - [ ] Display recognized text before sending (optional confirmation)
  - [ ] Auto-send recognized text to LLM service

**Acceptance Criteria:**
- [ ] Speech recognition works on iOS and Android
- [ ] After wake word, speech is captured automatically
- [ ] Speech converted to text accurately
- [ ] Text sent to chat interface
- [ ] Errors handled gracefully (no speech, network issues, etc.)

---

### 3.3 Text-to-Speech (Voice Output)

**Tasks:**
- [ ] Set up text-to-speech:
  - [ ] iOS: Use native TTS (AVSpeechSynthesizer)
  - [ ] Android: Use native TTS (TextToSpeech)
  - [ ] Or use `react-native-tts` library (cross-platform)

- [ ] Create `TextToSpeechService.js`:
  - [ ] Convert McCarthy's text responses to speech
  - [ ] Use Australian English voice (en-AU)
  - [ ] Handle speech playback (play, pause, stop)
  - [ ] Adjust speech rate and pitch (optional)

- [ ] Integrate with chat:
  - [ ] After McCarthy responds, play voice output
  - [ ] Show "Speaking..." indicator
  - [ ] Allow user to stop speech playback
  - [ ] Respect user's voice settings (enabled/disabled)

**Acceptance Criteria:**
- [ ] TTS works on iOS and Android
- [ ] McCarthy's responses are spoken aloud
- [ ] Australian English voice used
- [ ] User can stop speech playback
- [ ] Voice output can be toggled on/off in settings

---

### 3.4 Complete Voice Flow Integration

**Tasks:**
- [ ] Integrate full voice flow:
  1. User says "Hey McCarthy" → Wake word detected
  2. App starts listening → Speech recognition active
  3. User speaks → Speech converted to text
  4. Text sent to LLM → McCarthy processes request
  5. McCarthy responds → Text response displayed
  6. Text-to-speech → Response spoken aloud

- [ ] Handle edge cases:
  - [ ] Wake word detected but no speech after timeout
  - [ ] Speech recognition fails
  - [ ] LLM service unavailable
  - [ ] User interrupts (says wake word again during response)

- [ ] Add voice settings:
  - [ ] Enable/disable wake word
  - [ ] Enable/disable voice output (TTS)
  - [ ] Adjust speech rate
  - [ ] Choose voice (if multiple available)

**Acceptance Criteria:**
- [ ] Complete voice flow works end-to-end
- [ ] User can interact with McCarthy entirely via voice
- [ ] Edge cases handled gracefully
- [ ] Voice settings work correctly
- [ ] Works reliably on both iOS and Android

---

## 🎯 TASK 4: Testing & Bug Fixes

### 4.1 Authentication Testing

**Tasks:**
- [ ] Test signup flow:
  - [ ] Create new account
  - [ ] Verify profile setup screen appears
  - [ ] Verify timezone selection works
  - [ ] Verify user document created in Firestore
  - [ ] Verify all v7 schema fields present

- [ ] Test login flow:
  - [ ] Login with existing account
  - [ ] Verify navigation to home screen
  - [ ] Verify user data loads correctly

- [ ] Test error cases:
  - [ ] Invalid email format
  - [ ] Weak password
  - [ ] Email already in use
  - [ ] Wrong password
  - [ ] Network errors

**Acceptance Criteria:**
- [ ] All authentication flows work correctly
- [ ] Error messages are user-friendly
- [ ] User data persists correctly

---

### 4.2 Chat Interface Testing

**Tasks:**
- [ ] Test chat functionality:
  - [ ] Send messages
  - [ ] Receive McCarthy responses
  - [ ] Verify messages display correctly
  - [ ] Test long messages (scrolling)
  - [ ] Test empty messages (should not send)

- [ ] Test LLM integration:
  - [ ] Verify API calls work
  - [ ] Test with different message types
  - [ ] Test error handling (API down, rate limits)
  - [ ] Verify conversation history works

- [ ] Test message storage:
  - [ ] Verify messages save to Firestore
  - [ ] Verify messages load on app restart
  - [ ] Test with multiple users

**Acceptance Criteria:**
- [ ] Chat works end-to-end
- [ ] LLM responses are received
- [ ] Messages persist correctly
- [ ] Errors handled gracefully

---

### 4.3 Voice Interaction Testing

**Tasks:**
- [ ] Test wake word detection:
  - [ ] "Hey McCarthy" is detected reliably
  - [ ] Works in different environments (quiet, noisy)
  - [ ] False positives are minimal
  - [ ] Works when app is in background (if supported)
  - [ ] Toggle on/off works correctly

- [ ] Test speech recognition:
  - [ ] Speech is converted to text accurately
  - [ ] Works with Australian accent
  - [ ] Handles different speaking speeds
  - [ ] Handles background noise
  - [ ] Timeout works correctly (no speech after wake word)

- [ ] Test text-to-speech:
  - [ ] McCarthy's responses are spoken clearly
  - [ ] Australian English voice sounds natural
  - [ ] Speech rate is appropriate
  - [ ] Can stop speech playback
  - [ ] TTS toggle works correctly

- [ ] Test complete voice flow:
  - [ ] End-to-end voice interaction works
  - [ ] User can have full conversation via voice
  - [ ] Edge cases handled (interruptions, errors, etc.)
  - [ ] Works on both iOS and Android
  - [ ] Test on real devices (not just simulators)

**Acceptance Criteria:**
- [ ] Voice interaction works end-to-end
- [ ] Wake word detection is reliable
- [ ] Speech recognition is accurate
- [ ] Text-to-speech is clear and natural
- [ ] Works on both iOS and Android
- [ ] Tested on real devices

---

## 🎯 TASK 5: Documentation & Code Quality

### 5.1 Update Documentation

**Tasks:**
- [ ] Update `PROJECT_SUMMARY.md`:
  - [ ] Mark Week 2 tasks as completed
  - [ ] Document new components and services
  - [ ] Update "What Still Needs Implementation" section

- [ ] Document new environment variables:
  - [ ] Update `.env.example` with all required variables
  - [ ] Document in `SETUP.md` or `README.md`

- [ ] Code comments:
  - [ ] Add JSDoc comments to new functions
  - [ ] Document complex logic
  - [ ] Add TODO comments for future work

---

### 5.2 Code Quality Checks

**Tasks:**
- [ ] Run linter:
  - [ ] Fix any ESLint errors
  - [ ] Fix any Prettier formatting issues
  - [ ] Ensure consistent code style

- [ ] Check for common issues:
  - [ ] No hardcoded strings (use i18n)
  - [ ] No hardcoded timezone checks (use TimezoneService)
  - [ ] No direct Firebase calls (use services)
  - [ ] v7 schema fields used correctly

- [ ] Test on both platforms:
  - [ ] iOS simulator/device
  - [ ] Android emulator/device
  - [ ] Verify no platform-specific bugs

**Acceptance Criteria:**
- [ ] No linter errors
- [ ] Code follows project patterns
- [ ] Works on iOS and Android

---

## 📊 Week 2 Summary

### Deliverables

By end of Week 2, you should have:

1. ✅ **Complete user authentication:**
   - Signup with profile creation
   - Timezone selection (required)
   - Basic user profile (name, email, timezone)
   - Ability to change timezone in Settings

2. ✅ **Working text chat interface:**
   - Chat UI with message bubbles
   - LLM integration (McCarthy responds)
   - Message storage in Firestore
   - Basic conversation flow

3. ✅ **Voice interaction:**
   - Wake word detection ("Hey McCarthy")
   - Speech-to-text (voice input)
   - Text-to-speech (voice output)
   - Complete voice flow integration

4. ✅ **Testing:**
   - Authentication tested (critical paths)
   - Chat interface tested (happy path)
   - Voice interaction tested (wake word, speech recognition, TTS)
   - Basic error handling

### Dependencies & Prerequisites

**Before starting Week 2:**
- [ ] Firebase project configured
- [ ] Replicate API token obtained (for LLM)
- [ ] iOS/Android development environment set up
- [ ] All Week 1 tasks completed

**New Dependencies to Install:**
- [ ] `react-native-image-picker` or `expo-image-picker` (for profile photos - OPTIONAL)
- [ ] `openWakeWord` or `@picovoice/porcupine-react-native` (for wake word detection)
- [ ] `@react-native-voice/voice` (verify it's installed - already in dependencies)
- [ ] `react-native-tts` (for text-to-speech, or use native TTS APIs)

### Blockers & Risks

**Potential Blockers:**
1. **Replicate API Token:** Need to sign up at Replicate.com and get API token (CRITICAL - do this first)
2. **LLM API Costs:** Monitor usage to stay within budget
3. **Firebase Configuration:** Ensure all Firebase services are properly configured
4. **Wake Word Library:** May need to test multiple libraries to find best one
5. **Speech Recognition Permissions:** iOS/Android permissions can be tricky
6. **TTS Voice Quality:** May need to test different TTS options

**Mitigation:**
- Get Replicate API token on Day 1 of Week 2
- Set up cost monitoring/alerts for LLM usage
- Test Firebase integration early
- Test wake word libraries early (openWakeWord first, Porcupine as backup)
- Test permissions on real devices (not just simulators)
- Test TTS on both platforms early

---

## 🎯 Success Criteria

Week 2 is successful if:

1. ✅ Users can sign up, select timezone, and create profile
2. ✅ Users can change timezone in Settings (for travel scenarios)
3. ✅ Users can chat with McCarthy via text
4. ✅ Users can interact with McCarthy via voice (wake word → speak → hear response)
5. ✅ McCarthy responds using LLM service (both text and voice)
6. ✅ Messages are stored and persist
7. ✅ All code follows v7 architecture patterns
8. ✅ No critical bugs or crashes
