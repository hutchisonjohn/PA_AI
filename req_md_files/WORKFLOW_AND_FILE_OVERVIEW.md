# McCarthy App - File Overview & Workflow Documentation

## 📁 File Structure Analysis

### The 5 Markdown Files

1. **`McCarthy_PA_Developer_Spec_v5.md`** (v5 - Original)
   - **Status:** Older version, full feature set
   - **AI Model:** GPT-4 Turbo
   - **Scope:** Full global features (48 features)
   - **Purpose:** Initial comprehensive specification
   - **Note:** Superseded by v7

2. **`Developer_Response_McCarthy_MVP.md`** (Response Document)
   - **Status:** Developer feedback/refinement
   - **Date:** November 9, 2025
   - **Purpose:** Developer recommendations and MVP scope refinement
   - **Key Points:** Cost-conscious approach, simplified MVP scope, technical recommendations
   - **Impact:** Led to creation of v7 specification

3. **`Final/MVP_V1_Full_Developer_Specifications_v7.md`** (v7 - Current/Latest)
   - **Status:** ✅ **UPDATED VERSION - USE THIS**
   - **Version:** 7.0 (Latest)
   - **AI Model:** Llama 3.1 via Replicate (with GPT-4 upgrade path)
   - **Scope:** Simplified MVP for Australian market
   - **Purpose:** Current developer specification
   - **Key Changes from v5:**
     - Simplified to Australian market only
     - Single family group (not multiple groups)
     - Native intents for external messaging (not Twilio)
     - Cost-optimized stack ($80-370/month vs $340-1,050)
     - Architecture designed for V2/V3 (abstraction layers)

4. **`Final/Developer_Pre-Flight_Checklist_v7.md`** (v7 Checklist)
   - **Status:** ✅ **UPDATED VERSION - USE THIS**
   - **Version:** 7.0
   - **Purpose:** Pre-development checklist for developers
   - **Contents:** Architectural patterns, database schema changes, code patterns
   - **Key Sections:**
     - Database schema understanding (v7 changes)
     - Code architecture patterns (abstraction layers)
     - Development workflow
     - Common mistakes to avoid

5. **`McCarthy_V2_Features_Roadmap.md`** (V2 Roadmap)
   - **Status:** Future features document
   - **Timeline:** Months 4-6 (after MVP validation)
   - **Purpose:** Post-MVP features roadmap
   - **Contents:** Multiple groups, polls, private threads, automated messaging, shopping integration

---

## 🔄 Version Evolution

```
v5 (Original)
  ↓
Developer Response (Recommendations)
  ↓
v7 (Simplified MVP) ✅ CURRENT
  ↓
V2 Roadmap (Future features)
```

### Key Differences: v5 vs v7

| Aspect | v5 (Original) | v7 (Current) |
|--------|---------------|--------------|
| **AI Model** | GPT-4 Turbo | Llama 3.1 (Replicate) |
| **Market** | Global | Australian only |
| **Groups** | Multiple groups | Single family group |
| **External Messaging** | Twilio/SendGrid | Native intents |
| **Monthly Cost** | $340-1,050 | $80-370 |
| **Scope** | 48 features, full set | Simplified MVP |
| **Architecture** | Direct implementation | Abstraction layers for V2/V3 |

---

## 🚀 App Workflow

### Overview
McCarthy is a **proactive AI personal assistant** for families that uses **context-aware notifications** to reach out at optimal moments, rather than requiring users to check apps.

### Core Workflow: User Interaction → Action → Response

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
│  (Voice: "Hey McCarthy" or Text: Type message)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              INPUT CAPTURE & PROCESSING                      │
│  • Voice: Wake word detection → Speech recognition           │
│  • Text: Direct text input                                   │
│  • Both sent to same processing pipeline                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           REACT NATIVE APP (Frontend)                        │
│  • Captures user input (voice/text)                          │
│  • Sends to Cloud Function: processUserMessage               │
│  • Includes: userId, message, conversation history, context  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         FIREBASE CLOUD FUNCTION (Backend)                    │
│  • Receives: { userId, message, context }                    │
│  • Calls: LLM Service (abstraction layer)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              LLM SERVICE (Abstraction Layer)                 │
│  • Provider: Llama 3.1 via Replicate (MVP)                   │
│  • Upgrade path: GPT-4 (via config change)                   │
│  • Processes: Natural language → Intent extraction           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              LLM PROCESSING                                  │
│  • Extracts intent: { action, parameters }                   │
│  • Example: { action: "create_reminder",                     │
│              task: "call Tom", time: "15:00" }               │
│  • Returns: Response text + Function calls                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         CLOUD FUNCTION: ACTION EXECUTION                     │
│  • Executes function calls:                                  │
│    - create_task()                                           │
│    - create_calendar_event()                                 │
│    - send_message()                                          │
│    - add_to_shopping_list()                                  │
│  • Converts times to user's timezone                         │
│  • Stores in Firestore database                              │
│  • Schedules notifications                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              RESPONSE TO USER                                │
│  • McCarthy confirms: "I'll remind you to call Tom at 3 PM"  │
│  • Voice: Text-to-speech output                              │
│  • Text: Message in chat interface                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔔 Proactive Notification Workflow

McCarthy doesn't just respond - it proactively reaches out based on context:

```
┌─────────────────────────────────────────────────────────────┐
│         BACKGROUND MONITORING                                │
│  • Location tracking (GPS, geofencing)                       │
│  • Calendar sync (event changes)                             │
│  • Time-based triggers (scheduled tasks)                     │
│  • Family messaging (new messages)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         CONTEXT ANALYSIS                                     │
│  • User location: "Near supermarket"                         │
│  • Time: "3 PM user's timezone"                              │
│  • Calendar: "User free now"                                 │
│  • Safe times: "Not in quiet hours"                          │
│  • Weather: "Clear, good for travel"                         │
│  • Traffic: "Light traffic"                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         DECISION: SEND NOTIFICATION?                         │
│  • Is context appropriate? (not in meeting, not driving)     │
│  • Is it safe time? (not in quiet hours)                     │
│  • Is notification relevant? (user near store, task due)     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         PUSH NOTIFICATION                                    │
│  • "You're 5 minutes from Woolworths.                        │
│     Want to check the shopping list?"                        │
│  • "It's 3 PM - time to call Tom.                            │
│     You're free now - should I open the phone app?"          │
│  • "Sarah asked about dinner in the family chat.             │
│     You're out of your meeting - should I tell her?"         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Detailed Workflow Examples

### Example 1: Creating a Reminder (Voice)

```
1. User: "Hey McCarthy" (wake word detected)
   ↓
2. App: Visual feedback (wave animation), audio chime
   ↓
3. User: "Remind me to call Tom at 3 PM"
   ↓
4. App: Speech recognition → Text: "Remind me to call Tom at 3 PM"
   ↓
5. App: Sends to Cloud Function with context:
   {
     userId: "user_123",
     message: "Remind me to call Tom at 3 PM",
     timezone: "Australia/Sydney",
     location: "home",
     calendarEvents: [...]
   }
   ↓
6. Cloud Function: Calls LLM Service (Llama 3.1)
   ↓
7. LLM: Extracts intent:
   {
     action: "create_reminder",
     task: "call Tom",
     time: "15:00",
     timezone: "Australia/Sydney"
   }
   ↓
8. Cloud Function: 
   - Converts "3 PM" to UTC (if needed)
   - Creates task in Firestore
   - Schedules notification for 3 PM user's time
   ↓
9. Cloud Function: Returns response:
   {
     response: "I'll remind you to call Tom at 3 PM.",
     functionCalls: [{ action: "create_reminder", ... }]
   }
   ↓
10. App: Text-to-speech: "I'll remind you to call Tom at 3 PM"
    ↓
11. At 3 PM (user's local time):
    - Cloud Function triggers notification
    - Checks: User free? (calendar check)
    - Checks: Safe time? (not in quiet hours)
    - Checks: Location? (not driving)
    ↓
12. If context is good:
    - Push notification: "It's 3 PM - time to call Tom. You're free now - should I open the phone app?"
```

### Example 2: Adding to Shopping List (Text)

```
1. User: Types "Add milk to shopping list" in chat
   ↓
2. App: Sends to Cloud Function (same pipeline as voice)
   ↓
3. LLM: Extracts intent:
   {
     action: "add_to_shopping_list",
     item: "milk",
     listId: "user_default_list"
   }
   ↓
4. Cloud Function:
   - Adds item to Firestore shopping list
   - Returns confirmation
   ↓
5. App: Displays in chat: "I've added milk to your shopping list"
   ↓
6. Later, when user approaches supermarket:
   - Geofence trigger: User entered "Woolworths" region
   - Cloud Function: Checks shopping list
   - Push notification: "You're near Woolworths. Want to check your shopping list?"
```

### Example 3: Family Coordination (In-App Messaging)

```
1. User: "Tell the family I'm bringing pizza home"
   ↓
2. LLM: Extracts intent:
   {
     action: "send_family_message",
     message: "I'm bringing pizza home",
     groupId: "family_group_123"
   }
   ↓
3. Cloud Function:
   - Creates message in Firestore (messages collection)
   - Sends push notifications to all family members
   - If family member doesn't have McCarthy: SMS fallback (native intent)
   ↓
4. Family members receive:
   - Push notification: "Sarah: I'm bringing pizza home"
   - In-app message appears in family chat
   ↓
5. McCarthy can also participate:
   - "I've added 'pick up pizza' to your tasks" (if relevant)
```

---

## 🏗️ Architecture Layers

### 1. Frontend (React Native)
- **Voice:** Wake word detection, speech recognition, TTS
- **Text:** Chat interface, message input
- **Location:** GPS tracking, geofencing
- **Calendar:** Native calendar APIs
- **Notifications:** Push notification handling

### 2. Backend (Firebase)
- **Authentication:** User management
- **Firestore:** Database (users, tasks, messages, calendar events)
- **Cloud Functions:** Serverless backend logic
- **Cloud Storage:** File storage (voice notes, media)
- **FCM/APNS:** Push notifications

### 3. AI/LLM Layer (Abstraction)
- **Provider:** Llama 3.1 via Replicate (MVP)
- **Upgrade Path:** GPT-4 (via config change)
- **Function:** Intent extraction, natural language understanding
- **Abstraction:** Easy to swap providers

### 4. External Services
- **Maps:** Google Maps (geofencing, traffic)
- **Weather:** Open-Meteo (free) or OpenWeatherMap (backup)
- **Messaging:** Native intents (MVP), Twilio (V2)
- **Routing:** OSRM or HERE (free), Google Maps (backup)

---

## 🎯 Key Workflow Principles

### 1. **Proactive, Not Reactive**
- McCarthy reaches out at optimal moments
- Based on location, time, calendar, context
- Doesn't wait for users to open app

### 2. **Context-Aware**
- Respects user's timezone (AEST, ACST, AWST)
- Respects safe times (quiet hours)
- Checks calendar (not in meeting?)
- Checks location (not driving?)
- Checks weather/traffic

### 3. **Flexible Interaction**
- Voice OR text (user's choice)
- Seamless switching between modes
- Same natural language understanding

### 4. **Family-First**
- One family group (MVP)
- In-app messaging (free)
- External messaging (SMS/email) for non-McCarthy users
- Coordination and conflict resolution

### 5. **Cost-Conscious**
- Llama 3.1 (cheaper than GPT-4)
- Native intents (free, user manually sends)
- Free tiers where possible
- Target: $80-370/month for 100 families

---

## 📊 Data Flow Summary

### User Input → Processing → Action → Response

1. **Input:** Voice or text
2. **Processing:** LLM extracts intent
3. **Action:** Cloud Function executes (create task, send message, etc.)
4. **Storage:** Firestore database
5. **Response:** Text-to-speech or chat message
6. **Notification:** Proactive push notifications based on context

### Background Monitoring → Context Analysis → Notification

1. **Monitoring:** Location, calendar, time, messages
2. **Analysis:** Is context appropriate? Is it safe time?
3. **Decision:** Should we send notification?
4. **Delivery:** Push notification with relevant message

---

## 🔐 Security & Privacy

- **On-Device Processing:** Wake word detection, speech recognition (optional)
- **Encrypted Storage:** Sensitive data encrypted
- **User Control:** Safe times, quiet hours, notification preferences
- **Data Retention:** Configurable retention periods
- **Transparency:** Clear privacy policies

---

## 📈 MVP Scope (v7)

### ✅ Included in MVP
- Australian market only
- Single family group
- Voice and text interaction
- Personal tasks and reminders
- Calendar integration
- Shopping lists
- In-app family messaging
- Location awareness
- Weather/traffic context
- Native intents for external messaging
- Time zone support (Australian time zones)
- Safe times / Do Not Disturb

### ❌ NOT in MVP (V2 Features)
- Multiple groups (soccer team, school, etc.)
- Polls and voting
- Private threads
- Automated external messaging (Twilio)
- Currency conversion
- Translation
- Complex project management
- Shopping integration (product search)

---

## 🚦 Development Phases

### Phase 1: Foundation (Weeks 1-4)
- React Native 0.76 setup
- User authentication & profiles
- Voice interaction (openWakeWord + native speech)
- Text chat interface
- LLM integration (Llama 3.1 via Replicate)

### Phase 2: Core Features (Weeks 5-8)
- Calendar integration
- Task management & reminders
- Location awareness
- Weather/traffic context
- Safe times / DND logic

### Phase 3: Family Coordination (Weeks 9-12)
- In-app family messaging (Firebase)
- External messaging (native intents)
- Context-aware notifications
- Proactive suggestions
- Beta testing with 10-20 families

---

## 📝 Key Takeaways

1. **Use v7 specification** (`Final/MVP_V1_Full_Developer_Specifications_v7.md`)
2. **Complete pre-flight checklist** before development
3. **Follow abstraction layer patterns** for easy V2 upgrades
4. **Focus on Australian market** for MVP
5. **Cost-optimized stack** ($80-370/month target)
6. **Proactive notifications** are core differentiator
7. **Flexible interaction** (voice OR text)
8. **Context-aware** (timezone, location, calendar, safe times)

---

**Last Updated:** November 2025  
**Current Version:** v7 (MVP)  
**Next Version:** V2 (Months 4-6)

