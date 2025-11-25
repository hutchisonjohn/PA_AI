# McCarthy PA AI Agent - Developer Specification v5
## Technical Implementation Guide

**Copyright © 2025 John Hutchison. All Rights Reserved.**  
This document and all associated materials are proprietary and confidential.

**Document Version:** 5.0  
**Last Updated:** November 2025  
**Target Platforms:** iOS & Android  
**Development Framework:** React Native

---

## Executive Summary

McCarthy is a conversational AI personal assistant for busy families with a key differentiator: **proactive, context-aware notifications** that reach out at optimal moments rather than requiring users to actively check apps.

**Dual Interaction Modes:**
- **Voice**: Wake word activation ("Hey McCarthy"), natural speech recognition, voice responses
- **Text**: Full-featured text chat interface for quiet environments, meetings, or user preference

**Core Capabilities:**
- 48 detailed features across 8 categories
- Proactive, context-aware notifications
- Location tracking & geofencing
- Weather and traffic integration
- SMS and email sending (via Twilio/SendGrid)
- Family coordination & conflict resolution
- Behavioral learning for optimal timing

**Technology Stack:**
- **Frontend**: React Native (iOS + Android, single codebase)
- **Wake Word**: Porcupine ("Hey McCarthy") - On-device processing
- **Voice Recognition**: Apple Speech Framework (iOS) + Android SpeechRecognizer (Android)
- **Backend**: Firebase (Auth, Firestore, Functions, Storage, Messaging)
- **Conversational AI**: OpenAI GPT-4 Turbo
- **Calendar**: Native iOS/Android Calendar APIs
- **Location**: Native iOS/Android Location Services with background tracking
- **Messaging**: Twilio (SMS), SendGrid (Email)
- **Weather**: OpenWeatherMap API
- **Traffic**: Google Maps Directions API

---

## Table of Contents

1. Product Vision & Core Architecture
2. Technology Stack Implementation
3. Core Features - Complete Breakdown (48 Features)
   - 3.1 Conversation & Interaction (6 Features)
   - 3.2 Task & Reminder Management (8 Features)
   - 3.3 Calendar Integration (7 Features)
   - 3.4 Shopping List Management (6 Features)
   - 3.5 Voice Notes (5 Features)
   - 3.6 Message Drafting & Sending (6 Features)
   - 3.7 Family Coordination (5 Features)
   - 3.8 Context-Aware Intelligence (5 Features)
4. Voice AI Implementation
5. Location & Context Awareness System
6. Context-Aware Notification System
7. Message Sending Capabilities
8. Privacy & Security
9. Data Models
10. Comprehensive Feature Examples

---

## 1. Product Vision & Core Architecture

### The Problem
Modern families juggle multiple calendars, scattered shopping lists, reminder overload, and constant app-checking. Existing solutions are reactive - they wait for users to open apps.

### McCarthy's Solution
**"Stop checking apps. Let McCarthy check on you."**

McCarthy offers **flexible interaction** - users can choose voice, text, or both based on their situation:
- **Voice Mode**: Perfect for hands-free moments (driving, cooking, multitasking)
- **Text Mode**: Ideal for meetings, quiet environments, or personal preference
- **Both**: Seamlessly switch between modes in the same conversation

McCarthy learns family patterns and proactively reaches out at optimal moments based on:
- User location (GPS tracking with geofencing)
- Time of day  
- Calendar context
- Historical behavior
- Family member availability
- Weather conditions
- Traffic conditions
- Proximity to relevant locations (stores, schools, work)

### Core Architecture

```
┌─────────────────── USER DEVICES ───────────────────┐
│  React Native App (iOS & Android)                  │
│  ├─ Porcupine Wake Word ("Hey McCarthy")          │
│  ├─ Native Speech Recognition                      │
│  ├─ Text Chat Interface (NEW)                      │
│  ├─ Native Calendar APIs                          │
│  ├─ Native Location Services (Background)         │
│  │   ├─ Continuous GPS tracking                   │
│  │   ├─ Geofencing for locations                  │
│  │   └─ Activity recognition (driving/walking)    │
│  ├─ Weather API Integration                        │
│  ├─ Maps/Traffic API Integration                   │
│  └─ Firebase SDK                                  │
└─────────────────────┬───────────────────────────────┘
                      │
             ┌────────▼─────────┐
             │ FIREBASE BACKEND │
             │ ├─ Authentication│
             │ ├─ Firestore DB  │
             │ ├─ Cloud Functions│
             │ ├─ Storage       │
             │ └─ FCM (Push)    │
             └────────┬─────────┘
                      │
             ┌────────▼─────────┐
             │ OpenAI API       │
             │ GPT-4 Turbo      │
             │ (Conversation AI)│
             └────────┬─────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
┌───────▼────────┐      ┌───────────▼──────────┐
│ Weather API    │      │ Messaging APIs       │
│ (OpenWeather)  │      │ Twilio (SMS)         │
│                │      │ SendGrid (Email)     │
└────────────────┘      └──────────────────────┘
```

**Architecture Principles:**
1. **API-First**: Clean separation frontend/backend
2. **Privacy-First**: On-device processing where possible
3. **Background-Enabled**: Always-listening wake word, location monitoring
4. **Real-Time**: Live updates for family coordination
5. **Flexible Interaction**: Voice OR text, user's choice
6. **Proactive Intelligence**: Context-aware, timely notifications

### Key Differentiators

McCarthy stands apart through:

1. **Dual Interaction Modes** - Seamless voice and text communication
2. **Proactive AI** - McCarthy reaches out at optimal moments, you don't check apps
3. **Context-Aware** - Notifications based on location, activity, weather, traffic
4. **Family-First** - Built for multiple members with conflict resolution
5. **Message Sending** - AI-powered SMS and email composition and sending
6. **Privacy-First** - On-device processing where possible, transparent data policies
7. **Comprehensive** - 48 features across 8 categories, all voice and text accessible

---

## 2. Technology Stack Implementation

### 2.1 Mobile Development

**React Native v0.73+**

Key Libraries:
```json
{
  "dependencies": {
    "react-native": "0.73.x",
    "@react-navigation/native": "^6.1.x",
    "@picovoice/porcupine-react-native": "^2.2.x",
    "@react-native-voice/voice": "^3.2.x",
    "@react-native-firebase/app": "^18.x",
    "@react-native-firebase/firestore": "^18.x",
    "@react-native-community/geolocation": "^3.x",
    "react-native-geolocation-service": "^5.x",
    "react-native-geofencing": "^3.x",
    "react-native-calendars": "^1.x",
    "react-native-encrypted-storage": "^4.x",
    "react-native-background-fetch": "^4.x",
    "react-native-background-geolocation": "^4.x",
    "react-native-weather": "^2.x",
    "react-native-maps": "^1.x",
    "@react-native-clipboard/clipboard": "^1.x",
    "axios": "^1.x"
  }
}
```

### 2.2 Voice AI Stack

**Wake Word**: Porcupine by Picovoice
- Custom wake word: "Hey McCarthy"
- On-device processing
- Cross-platform (iOS + Android)
- Low battery consumption (~1-2%/hour)
- Background execution capability

**Speech Recognition**:
- **iOS**: Apple Speech Framework (native, on-device option available)
- **Android**: Android SpeechRecognizer (native)
- Single React Native library: `@react-native-voice/voice`
- 95%+ accuracy
- Real-time transcription

**Conversational AI**: OpenAI GPT-4 Turbo
- Function calling for actions
- Context-aware responses
- Multi-turn conversation support
- Works with both voice and text input

### 2.3 Backend (Firebase)

**Why Firebase:**
- Real-time database
- Built-in authentication
- Push notifications (FCM)
- Auto-scaling
- Excellent React Native support
- Cloud Functions for server-side logic

**Core Services:**
- **Authentication**: User management, OAuth
- **Firestore**: NoSQL database
- **Cloud Functions**: Serverless backend logic
- **Cloud Storage**: File storage (voice notes, media)
- **Cloud Messaging**: Push notifications

### 2.4 Location Services

**iOS Location Implementation:**
```swift
// Background location tracking
CLLocationManager.requestAlwaysAuthorization()
locationManager.allowsBackgroundLocationUpdates = true
locationManager.pausesLocationUpdatesAutomatically = false
locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
locationManager.distanceFilter = 100 // meters
```

**Android Location Implementation:**
```java
// Background location service
LocationRequest.create()
    .setPriority(LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY)
    .setInterval(300000) // 5 minutes
    .setFastestInterval(60000) // 1 minute
    .setSmallestDisplacement(100) // 100 meters
```

**Geofencing:**
- Circular regions around key locations
- Home, work, schools, frequent stores
- Entry/exit triggers for notifications
- Minimum radius: 100 meters
- Maximum monitored regions: 20 per user

### 2.5 Weather & Traffic APIs

**Weather API**: OpenWeatherMap
```javascript
const getWeather = async (lat, lon) => {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );
  return response.json();
};
```

**Traffic API**: Google Maps Traffic Layer
```javascript
const getTrafficData = async (origin, destination) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&departure_time=now&traffic_model=best_guess&key=${API_KEY}`
  );
  return response.json();
};
```

### 2.6 Messaging APIs

**SMS Sending**: Twilio
```javascript
const sendSMS = async (to, message) => {
  const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + base64(accountSid + ':' + authToken),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `To=${to}&From=${twilioNumber}&Body=${message}`
  });
  return response.json();
};
```

**Email Sending**: SendGrid
```javascript
const sendEmail = async (to, subject, message) => {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@mccarthy.app' },
      subject,
      content: [{ type: 'text/plain', value: message }]
    })
  });
  return response.json();
};
```

---

## 3. Core Features - Complete Breakdown (48 Features)

### 3.1 Conversation & Interaction (6 Features)

**3.1.1 Wake Word Activation**

Always-listening wake word detection for hands-free activation.

*Sub-Features:*
- Always-listening "Hey McCarthy" detection
- Low-power on-device processing
- Visual and audio feedback on activation
- Background operation support
- Configurable sleep hours (pause during night)
- Pause during low battery (<15%)
- User-configurable sensitivity

*Technical Implementation:*
- Porcupine wake word engine
- Background audio mode (iOS) / Foreground service (Android)
- Battery optimization with smart pause
- Visual wave animation on activation
- Audible chime confirmation

*User Experience:*
- Say "Hey McCarthy" from anywhere in the app
- Works even when screen is off
- Instant visual/audio feedback
- Respects quiet hours and battery state

---

**3.1.2 Natural Speech Recognition**

Continuous voice input processing with high accuracy transcription.

*Sub-Features:*
- Continuous voice input processing
- Real-time transcription display
- Automatic punctuation
- Multi-language support preparation
- 95%+ accuracy rate
- On-device option available (privacy mode)
- Noise cancellation

*Technical Implementation:*
- Apple Speech Framework (iOS)
- Android SpeechRecognizer (Android)
- React Native Voice library
- Real-time streaming transcription
- Automatic sentence detection

*User Experience:*
- Speak naturally, no rigid commands
- See words appear as you speak
- Automatic punctuation and formatting
- Clear error handling for unclear audio

---

**3.1.3 Text Chat Interface**

Full-featured text messaging interface for situations where voice isn't practical.

*Sub-Features:*
- Type messages to McCarthy (no voice required)
- Full conversational AI via text
- Perfect for meetings, quiet environments
- All features accessible via text
- Same natural language understanding as voice
- Quick action buttons for common tasks
- Image/file attachment support (future)
- Multi-line message support
- Typing indicators
- Message history with search

*Technical Implementation:*
- Native TextInput components
- Real-time message synchronization
- Firebase Firestore for message storage
- OpenAI GPT-4 processing (identical to voice)
- Rich message formatting

*User Experience:*
- Clean, modern chat interface
- Familiar messaging app layout
- Quick action buttons in responses
- Smooth scrolling conversation history
- Easy switching between text and voice

*Why This Matters:*
Text chat is essential for:
- In meetings or quiet environments
- Privacy concerns in public
- Prefer typing over speaking
- Voice recognition issues
- Accessibility needs
- Quick, silent interactions

---

**3.1.4 Voice Commands**

Natural language voice command processing without rigid syntax requirements.

*Sub-Features:*
- All features accessible via voice
- Natural language understanding
- No rigid command structure required
- Context-aware command interpretation
- Multi-turn conversations
- Confirmation requests for important actions
- Command history

*Technical Implementation:*
- OpenAI GPT-4 Turbo with function calling
- Context injection from user profile
- Intent extraction and parameter parsing
- Confidence scoring for disambiguation
- Multi-turn dialog management

*User Experience:*
- Speak naturally, like talking to a person
- No memorizing specific commands
- McCarthy asks for clarification when needed
- Confirms before executing important actions
- Conversational, not robotic

---

**3.1.5 Text-to-Speech Responses**

Natural-sounding voice output for McCarthy's responses.

*Sub-Features:*
- Natural-sounding voice output
- Configurable voice (male/female, accent)
- Adjustable speech rate (0.5x - 2x)
- Works in background/screen-off
- Can toggle between voice and text responses
- Respects quiet hours settings
- Pause/resume capability

*Technical Implementation:*
- Native TTS engines (iOS/Android)
- Voice selection and customization
- Background audio support
- Queue management for long responses
- Interrupt detection

*User Experience:*
- Clear, natural-sounding voice
- Customizable to user preference
- Continues speaking even if screen locks
- Easy toggle on/off
- Respects Do Not Disturb mode

---

**3.1.6 Conversation History**

Complete archive of all interactions with McCarthy, searchable and exportable.

*Sub-Features:*
- Complete transcript of all interactions (voice & text)
- Searchable conversation archive
- Ability to replay past conversations
- Export conversation history (PDF, TXT)
- Conversation threads by topic
- Filter by date, type, or content
- Delete individual conversations
- Auto-archive old conversations

*Technical Implementation:*
- Firebase Firestore storage
- Full-text search indexing
- Audio playback for voice messages
- Export generation (PDF/TXT)
- Efficient pagination for large histories

*User Experience:*
- Easy search: "Find when I asked about..."
- Review past decisions
- Export for records
- Clean, organized view
- Topic-based threading

---

### 3.2 Task & Reminder Management (8 Features)

**3.2.1 Voice Task Creation**

Create tasks using natural language voice commands with intelligent parsing.

*Sub-Features:*
- Natural language task input
- Automatic due date parsing ("tomorrow", "next Friday", "in 2 days")
- Priority inference from language ("urgent", "important")
- Assignee detection from context
- Context-aware suggestions
- Confirmation before creating
- Batch task creation

*Technical Implementation:*
- OpenAI GPT-4 function calling
- Date/time natural language processing
- Priority keyword detection
- Family member name recognition
- Task template matching

*User Experience:*
- "Hey McCarthy, remind me to call the dentist tomorrow"
- "Add pick up groceries to my list for Saturday"
- "Urgent: submit expense report by end of day"
- McCarthy confirms: "Task created: Call dentist, tomorrow. Correct?"

---

**3.2.2 UI Task Creation**

Traditional UI-based task creation for users who prefer manual input.

*Sub-Features:*
- Quick-add task interface (title only)
- Full task editor with all fields
- Template-based task creation
- Batch task import (CSV)
- Duplicate task detection
- Rich text descriptions
- Attach files/images (future)

*Technical Implementation:*
- React Native form components
- Form validation
- Template storage in Firestore
- CSV parsing for imports
- Duplicate detection algorithm

*User Experience:*
- Quick add: Just type title and tap create
- Full editor: Access all advanced options
- Templates: One-tap task creation
- Import: Bulk add from existing lists

---

**3.2.3 Recurring Tasks**

Automated task regeneration for routine items.

*Sub-Features:*
- Daily, weekly, monthly, yearly patterns
- Custom recurrence rules
- Skip specific occurrences
- Auto-regeneration on completion
- End date configuration
- Days of week selection (for weekly)
- Multiple recurrence patterns per task

*Technical Implementation:*
- Recurrence rule engine
- Cloud function for auto-regeneration
- Skip date handling
- Calendar-aware scheduling (skip holidays option)

*User Experience:*
- "Remind me to take out trash every Tuesday"
- "Pay rent on the 1st of every month"
- Visual indicator for recurring tasks
- Easy edit/pause of recurrence

---

**3.2.4 Location-Based Reminders**

Get reminded when arriving at or leaving specific locations.

*Sub-Features:*
- Geofence trigger setup
- "When I arrive at" reminders
- "When I leave" reminders
- Radius configuration (100m-5km)
- Up to 20 geofences per user
- Known location integration (home, work, stores)
- Arrival/departure triggers
- Multiple locations per task

*Technical Implementation:*
- Native geofencing APIs
- Background location monitoring
- Geofence state management
- Entry/exit event handling
- Smart notification timing (waits if driving)

*User Experience:*
- "Remind me to buy milk when I'm at the grocery store"
- "When I leave work, remind me to pick up dry cleaning"
- Notifications appear automatically upon entry/exit
- Visual map showing geofence boundaries

---

**3.2.5 Smart Notification Timing**

Intelligent notification delivery based on context and behavior.

*Sub-Features:*
- Context-aware delivery
- Multiple advance notifications (60min, 15min, at time)
- Escalating urgency system
- Snooze with smart retry
- Interruptibility scoring
- Behavioral learning for optimal timing
- Quiet hours respect

*Technical Implementation:*
- Context collection (location, activity, calendar)
- Interruptibility algorithm
- Notification scheduling engine
- Behavioral pattern learning
- Snooze intelligence

*User Experience:*
- Notifications arrive at best times
- Less interruption during meetings/driving
- Escalating reminders for urgent tasks
- Smart snooze: "Remind me when I'm done with this meeting"

---

**3.2.6 Subtasks & Checklists**

Break down complex tasks into manageable subtasks.

*Sub-Features:*
- Nested subtask support (up to 3 levels)
- Individual subtask completion tracking
- Progress visualization (e.g., "3/5 completed")
- Reorderable subtasks (drag & drop)
- Add/remove subtasks dynamically
- Copy subtasks from templates
- Bulk subtask operations

*Technical Implementation:*
- Hierarchical task data structure
- Real-time progress calculation
- Drag-and-drop reordering
- Template subtask library

*User Experience:*
- Create task: "Plan birthday party"
  - Subtask: "Book venue"
  - Subtask: "Order cake"
  - Subtask: "Send invitations"
- Check off subtasks as completed
- See progress: "2 of 3 subtasks done"

---

**3.2.7 Priority Levels**

Visual priority system for task importance.

*Sub-Features:*
- High, medium, low priority
- Color coding (red, yellow, green)
- Priority-based sorting
- Urgent flag for same-day items
- Visual indicators (icons, colors)
- Priority affects notification timing
- Auto-priority suggestions

*Technical Implementation:*
- Priority field in task model
- Color theme system
- Sort algorithm with priority weighting
- Notification timing adjustment by priority

*User Experience:*
- High priority tasks appear in red
- Urgent tasks get immediate notifications
- Sort tasks by priority
- Visual at-a-glance importance

---

**3.2.8 Family Member Assignment**

Delegate tasks to family members with notifications.

*Sub-Features:*
- Assign tasks to any family member
- Automatic notification on assignment
- Task reassignment capability
- Completion notification to assigner
- Assignment history tracking
- Bulk assignment
- Assignment permissions

*Technical Implementation:*
- Family member database
- Assignment notification system
- Permission checking
- Activity log for assignments
- Push notifications to assignees

*User Experience:*
- "Assign this to Tom"
- Tom receives notification: "Sarah assigned you: Take out trash"
- When Tom completes, Sarah gets notified
- Easy reassignment if needed

---

### 3.3 Calendar Integration (7 Features)

**3.3.1 Two-Way Native Calendar Sync**

Seamless synchronization with device calendars.

*Sub-Features:*
- Read from device calendars (iOS/Android)
- Write back to device calendars
- Multiple calendar support
- Sync status indicators
- Auto-sync every 15 minutes
- Manual sync option
- Conflict resolution
- Selective calendar sync

*Technical Implementation:*
- Native calendar APIs (EventKit for iOS, Calendar Provider for Android)
- Bi-directional sync engine
- Conflict detection and resolution
- Delta sync for efficiency
- Calendar permission management

*User Experience:*
- Events created in McCarthy appear in device calendar
- Events from other apps appear in McCarthy
- Choose which calendars to sync
- Real-time synchronization
- No duplicate events

---

**3.3.2 Unified Family Calendar View**

See everyone's schedule in one place.

*Sub-Features:*
- Combined view of all family members
- Color-coded by person
- Filter by family member
- Day/week/month/agenda views
- Event details on tap
- Quick event creation
- Toggle member visibility
- Export family calendar

*Technical Implementation:*
- Multi-user calendar aggregation
- Color assignment system
- View mode switching
- Filter logic
- Real-time updates via Firestore

*User Experience:*
- See whole family's schedule at once
- Each person has unique color
- Tap to filter: "Show only Sarah's events"
- Switch between day/week/month views
- Easy coordination of family activities

---

**3.3.3 Conflict Detection**

Automatic identification of scheduling conflicts.

*Sub-Features:*
- Overlapping events detection
- Double-booking alerts
- Transportation time conflicts
- Insufficient time between events
- Same-location same-time alerts
- Multi-person conflict detection
- Conflict resolution suggestions

*Technical Implementation:*
- Temporal overlap algorithm
- Travel time calculation
- Location-based conflict detection
- Multi-user conflict checking
- Real-time conflict monitoring

*User Experience:*
- Alert: "Conflict detected: You have dentist and Emma's soccer at 3 PM"
- Warning: "Only 15 minutes between meetings, insufficient travel time"
- Proactive notification before conflicts occur
- Suggested resolutions

---

**3.3.4 Smart Scheduling Suggestions**

AI-powered optimal time finding.

*Sub-Features:*
- Find available time slots
- Suggest optimal meeting times
- Account for travel time
- Respect quiet hours
- Consider family member availability
- Buffer time recommendations
- Best time of day suggestions
- Workload balancing

*Technical Implementation:*
- Availability algorithm
- Multi-constraint optimization
- Preference learning
- Calendar gap analysis
- Travel time integration

*User Experience:*
- "McCarthy, when am I free next week?"
- "Find a time for family dinner this week"
- "When can we all meet for 1 hour?"
- McCarthy suggests: "Thursday 6 PM works for everyone"

---

**3.3.5 Attendee Management**

Manage event participants and invitations.

*Sub-Features:*
- Add/remove attendees
- Send calendar invites (email)
- Track RSVP status
- Reschedule with attendee notification
- Email integration
- Guest permissions
- Attendee availability checking

*Technical Implementation:*
- Calendar invite generation (.ics files)
- Email sending via SendGrid
- RSVP tracking system
- Attendee database
- Permission management

*User Experience:*
- Add attendees when creating event
- Send invites automatically
- See who has accepted/declined
- Reschedule sends auto-notifications
- Track attendance

---

**3.3.6 Event Templates**

Pre-configured events for quick creation.

*Sub-Features:*
- Saved event templates
- Quick-add common events
- Template sharing in family
- Pre-filled event details
- Edit template library
- Import/export templates
- Template categories

*Technical Implementation:*
- Template storage in Firestore
- Template application logic
- Variable substitution (dates, attendees)
- Import/export functionality

*User Experience:*
- Create template: "Soccer Practice" (Tuesdays 4 PM, 1 hour)
- One-tap: "Add Soccer Practice"
- Share templates with family
- Common templates: "Date Night", "Team Meeting", "Doctor Appointment"

---

**3.3.7 Calendar Event Reminders**

Context-aware event notifications.

*Sub-Features:*
- Multiple reminder times (configurable)
- Location-based event reminders
- Traffic-aware departure reminders
- Weather alerts for outdoor events
- Customizable reminder intervals
- Escalating reminders for urgent events
- Snooze and reschedule

*Technical Implementation:*
- Notification scheduling system
- Location monitoring for events
- Traffic API integration
- Weather API integration
- Escalation logic

*User Experience:*
- Standard: 15 min before, at event time
- Smart: "Leave in 10 min due to traffic"
- Weather: "Rain expected, soccer game may be cancelled"
- Location: "You're 5 min from meeting location"

---

### 3.4 Shopping List Management (6 Features)

**3.4.1 Voice-Activated List Building**

Add items to shopping lists using voice commands.

*Sub-Features:*
- Add items by voice
- Automatic quantity parsing ("3 apples", "2 gallons of milk")
- Brand recognition
- Size/variant specification
- Natural language ("need milk" → adds to list)
- Batch additions ("add eggs, milk, and bread")
- Voice item editing

*Technical Implementation:*
- Natural language processing for quantities
- Product database matching
- Brand and size extraction
- List item normalization
- Duplicate detection

*User Experience:*
- "Hey McCarthy, add milk to shopping list"
- "Add 3 boxes of pasta"
- "Need eggs, bread, and butter"
- McCarthy: "Added 3 items to your list"

---

**3.4.2 Auto-Categorization**

Intelligent organization of shopping items.

*Sub-Features:*
- Grocery categories (produce, dairy, meat, bakery, etc.)
- Store aisle mapping
- Category-based organization
- Custom category creation
- Smart categorization learning
- Manual category override
- Category templates per store

*Technical Implementation:*
- Product category database
- Machine learning for categorization
- Store layout mapping
- User preference learning
- Category customization system

*User Experience:*
- Items auto-organize by category
- View by aisle for efficient shopping
- Custom categories: "Baby items", "Pet supplies"
- Matches store layout

---

**3.4.3 Family Sharing**

Collaborative shopping list management.

*Sub-Features:*
- Real-time list synchronization
- Multiple family member editing
- Item addition notifications
- Completed item visibility
- See who added/checked items
- Collaborative shopping (multiple people in store)
- List ownership and permissions

*Technical Implementation:*
- Real-time Firestore synchronization
- Change tracking and attribution
- Conflict resolution
- Push notifications for changes
- Permission system

*User Experience:*
- Sarah adds milk, Tom sees it instantly
- Tom checks off items while shopping
- Sarah sees updates in real-time
- Notification: "Tom bought eggs"
- No duplicate purchases

---

**3.4.4 Location-Based Store Reminders**

Automatic reminders when near stores.

*Sub-Features:*
- Automatic notification near stores
- Multiple store locations support
- Store-specific lists
- "Best store" recommendations
- Geofencing around preferred stores
- Smart timing (waits if driving)
- Store hours awareness

*Technical Implementation:*
- Store location database
- Geofencing for stores
- Activity detection (driving/walking)
- List-store matching algorithm
- Notification delivery system

*User Experience:*
- Approaching Whole Foods
- Notification: "🛒 You're near Whole Foods. 8 items on your list"
- Tap to see list
- McCarthy waited until car stopped
- Shows store hours: "Closes at 9 PM"

---

**3.4.5 Recurring Item Suggestions**

AI-powered suggestions for frequently bought items.

*Sub-Features:*
- Learn frequently bought items
- Suggest re-addition based on patterns
- Weekly staple reminders
- Low-stock predictions
- Purchase frequency tracking
- "Usually buy every X days" notifications
- Smart reorder suggestions

*Technical Implementation:*
- Purchase history analysis
- Frequency pattern detection
- Predictive algorithm
- Time-based suggestion engine
- User preference learning

*User Experience:*
- Notification: "You usually buy milk every 5 days. Add to list?"
- Weekly reminder: "Don't forget your staples: bread, eggs, milk"
- Predictive: "Running low on coffee? (bought 12 days ago)"

---

**3.4.6 Price Tracking & History**

Track spending and prices over time.

*Sub-Features:*
- Historical purchase prices
- Price comparison across stores
- Deal alerts
- Budget tracking per trip
- Cost per item tracking
- Spending analytics
- Price trend visualization

*Technical Implementation:*
- Price database per item
- Store-specific pricing
- Price history storage
- Budget calculation engine
- Analytics dashboard

*User Experience:*
- See price history: "Milk was $3.99 last time"
- Alert: "Milk is $0.50 cheaper at Target"
- Trip total: "$67.43 (under budget)"
- Monthly spending reports

---

### 3.5 Voice Notes (5 Features)

**3.5.1 Quick Voice Recording**

Fast voice note capture.

*Sub-Features:*
- One-tap record button
- Wake word initiated recording
- Maximum 5 minutes per note
- Background recording support
- Audio quality selection
- Pause/resume recording
- Recording timer display

*Technical Implementation:*
- Native audio recording APIs
- Background audio support
- Audio compression
- Cloud storage upload
- Recording state management

*User Experience:*
- Tap mic button or say "Hey McCarthy, take a note"
- Speak naturally up to 5 minutes
- Visual waveform while recording
- Tap to stop and save
- Automatic transcription begins

---

**3.5.2 Auto-Transcription**

Speech-to-text conversion for all voice notes.

*Sub-Features:*
- Immediate transcription after recording
- Edit transcription capability
- Speaker identification (future enhancement)
- Timestamped transcript
- Search within transcripts
- Export transcript (PDF, TXT)
- Accuracy indicators

*Technical Implementation:*
- Speech-to-text API
- Transcript editing interface
- Full-text search indexing
- Export generation
- Cloud storage

*User Experience:*
- Recording stops, transcription appears
- Edit any mistakes in transcript
- Search notes: "Find note about birthday party"
- Export for sharing or records

---

**3.5.3 Tagging & Organization**

Organize voice notes with tags and folders.

*Sub-Features:*
- Manual tag addition
- Automatic tag suggestion (AI-powered)
- Tag-based search
- Folder organization
- Smart folders (auto-organize by tags)
- Tag cloud visualization
- Nested folders

*Technical Implementation:*
- Tag extraction from transcript
- Tagging system
- Folder hierarchy
- Smart folder rules
- Search index

*User Experience:*
- McCarthy suggests tags: "birthday, party, Emma"
- Add custom tags
- Create folders: "Work", "Family", "Ideas"
- Smart folder: "All notes tagged 'urgent'"

---

**3.5.4 Family Sharing**

Share voice notes with family members.

*Sub-Features:*
- Share voice notes with family
- Permissions (view/edit)
- Comment on notes
- Mention family members (@Tom)
- Notification on share
- Private vs shared notes
- Share via link

*Technical Implementation:*
- Sharing permissions system
- Comment thread storage
- @mention detection
- Push notifications
- Access control

*User Experience:*
- Record idea for vacation
- Share with Tom and Sarah
- They receive notification
- Can listen, read transcript, comment
- Collaborative note-taking

---

**3.5.5 Audio Retention Policy**

Automatic audio lifecycle management.

*Sub-Features:*
- Audio stored for 90 days
- Transcript kept indefinitely
- Manual audio deletion
- Export before auto-deletion
- Warning before deletion (7 days prior)
- Permanent delete option
- Storage usage tracking

*Technical Implementation:*
- Scheduled deletion job
- Warning notification system
- Export functionality
- Storage calculation
- Audit logging

*User Experience:*
- Audio auto-deletes after 90 days (saves storage)
- Transcript remains forever
- Warning: "Audio will be deleted in 7 days. Export?"
- Can manually delete anytime
- See storage used

---

### 3.6 Message Drafting & Sending (6 Features)

**3.6.1 AI-Powered Message Composition**

Intelligent message generation based on user intent.

*Sub-Features:*
- Describe message intent to McCarthy
- AI generates full message
- Multiple draft variations
- Context-aware content (uses location, time, events)
- Relationship-aware tone
- Professional templates
- Grammar and spelling perfection

*Technical Implementation:*
- OpenAI GPT-4 Turbo
- Context injection (user location, calendar, relationships)
- Template library
- Tone adaptation
- Multi-variation generation

*User Experience:*
- "Draft a text to Sarah saying I'll be late"
- McCarthy generates: "Hey Sarah, running about 15 mins behind due to traffic. See you soon!"
- Context-aware: Knows current traffic, your relationship with Sarah

---

**3.6.2 Tone Adjustment**

Fine-tune message tone to match the situation.

*Sub-Features:*
- Casual, professional, friendly tones
- Formal/informal variants
- Apologetic, grateful, urgent styles
- Custom tone instructions
- Emoji inclusion options
- Length preferences (brief, detailed)
- Cultural adaptation

*Technical Implementation:*
- Tone parameter in AI prompt
- Style transfer algorithms
- Emoji suggestion engine
- Length control
- Cultural context awareness

*User Experience:*
- Initial draft: "Hey Jennifer, stuck in traffic..."
- "Make it more professional"
- Revised: "Dear Jennifer, I wanted to inform you..."
- "Add an emoji"
- Final: "Hi Jennifer! 🚗 Running late due to traffic..."

---

**3.6.3 Message Review & Editing**

Iterate on drafts before sending.

*Sub-Features:*
- Read draft aloud to user
- User can request changes
- Iterative refinement
- Manual text editing
- Version history
- Compare drafts
- Undo changes

*Technical Implementation:*
- Text-to-speech for reading
- Draft versioning system
- Edit history storage
- Diff comparison
- State management

*User Experience:*
- McCarthy reads draft aloud
- "Make it shorter"
- McCarthy revises
- "Perfect, send it"
- Can also manually edit text
- See all versions

---

**3.6.4 SMS Sending (After Approval)**

Send text messages directly from McCarthy after user approval.

*Sub-Features:*
- User reviews draft (voice or text)
- Verbal or tap approval required ("send it", tap Send button)
- Integration with Twilio API
- Confirmation after sending
- Delivery status tracking
- Failed delivery retry
- Message history
- Send to contacts or phone numbers

*Technical Implementation:*
- Twilio API integration
- Phone number validation
- Contact book integration
- Delivery webhook handling
- Retry logic for failures
- Sent message logging

*User Experience:*
- McCarthy: "Here's your message to Tom: 'Running late, see you at 3.' Should I send it?"
- User: "Yes, send it" or taps [Send]
- McCarthy: "Message sent to Tom"
- Shows delivery status: "Delivered 2:15 PM"
- Message saved in history

*Important Notes:*
- ALWAYS requires explicit user approval
- No auto-sending without confirmation
- Clear delivery status feedback
- Failed sends are retried once
- User can review before sending

---

**3.6.5 Email Sending (After Approval)**

Send emails directly from McCarthy after user approval.

*Sub-Features:*
- User reviews draft
- Subject line generation
- To/CC/BCC support
- Integration with SendGrid API
- Attachment support (future)
- Email templates
- Delivery confirmation
- Rich text formatting (future)

*Technical Implementation:*
- SendGrid API integration
- Email validation
- Subject generation from content
- HTML email formatting
- Attachment handling (future)
- Delivery tracking

*User Experience:*
- McCarthy: "I've drafted an email to Jennifer:
  Subject: Running Late to Meeting
  'Dear Jennifer, I wanted to let you know...'"
- "Should I send this?"
- User: "Yes" or taps [Send Email]
- McCarthy: "Email sent to Jennifer"
- Delivery confirmation received

*Important Notes:*
- ALWAYS requires explicit user approval
- Subject generated intelligently
- Professional formatting
- Clear confirmation process
- Failed sends handled gracefully

---

**3.6.6 Copy to Clipboard**

Alternative to direct sending for flexibility.

*Sub-Features:*
- For use in other apps
- Alternative to direct sending
- Format preservation (plain text/rich text)
- Multi-platform clipboard
- Copy confirmation
- Paste history (recent copies)
- Quick copy shortcut

*Technical Implementation:*
- Native clipboard APIs
- Format conversion
- Clipboard monitoring
- History storage
- Cross-platform compatibility

*User Experience:*
- McCarthy drafts message
- "Copy to clipboard" button
- Paste in any app (iMessage, WhatsApp, email)
- Useful if user prefers to send manually
- Format preserved

---

### 3.7 Family Coordination (5 Features)

**3.7.1 Multi-Member Family Groups**

Create and manage household groups.

*Sub-Features:*
- Household creation
- Member invitation via email/SMS
- Role assignment (admin, member)
- Member profile management
- Profile pictures
- Contact information
- Remove members
- Leave family group
- Multiple family support (future)

*Technical Implementation:*
- Family database structure
- Invitation system
- Role-based access control
- Profile storage
- Membership management

*User Experience:*
- Create family: "Smith Family"
- Invite via email/phone
- They receive invite link
- Accept and join
- Assign roles (admin can manage)

---

**3.7.2 Shared Calendars**

Family-wide calendar visibility and management.

*Sub-Features:*
- Family events visible to all
- Privacy controls per event
- "Family Only" event type
- External guest support
- Event visibility settings
- Family-wide event creation
- Synchronized updates
- Event categories (family dinner, vacation, etc.)

*Technical Implementation:*
- Shared calendar collection
- Visibility rules engine
- Real-time synchronization
- Permission checking
- Event filtering

*User Experience:*
- Create event: "Family Dinner, Friday 6 PM"
- All family members see it
- Can mark as "Private" for individual events
- Color-coded by family member
- Automatic sync across all devices

---

**3.7.3 Shared Task Lists**

Collaborative task management for households.

*Sub-Features:*
- Household tasks
- Task assignment across members
- Completion visibility
- Task comments/updates
- Task dependencies
- Shared task categories
- Family task dashboard
- Task workload balancing

*Technical Implementation:*
- Shared task collections
- Assignment notification system
- Comment threads
- Dependency graph
- Dashboard aggregation

*User Experience:*
- Create task: "Clean garage"
- Assign to Tom
- Tom sees notification
- Mark complete
- Sarah gets notified
- Everyone sees completed tasks

---

**3.7.4 Daily Family Digest**

Morning summary of family's day.

*Sub-Features:*
- Morning summary for each member
- Day's schedule overview
- Weather forecast
- Important reminders
- Traffic alerts
- Conflict warnings
- Customizable digest time
- Email/notification delivery
- Weekend vs weekday digests

*Technical Implementation:*
- Scheduled daily job
- Data aggregation from multiple sources
- Personalized digest generation
- Email/push notification delivery
- Template customization

*User Experience:*
- 7:00 AM notification
- "Good morning, Sarah!
  • 3 events today
  • Weather: 72°F, Sunny
  • 2 tasks due
  • Traffic normal to office
  • Tom has dentist at 3 PM"
- Personalized for each family member
- Configurable delivery time

---

**3.7.5 Conflict Resolution**

Intelligent handling of family scheduling conflicts.

*Sub-Features:*
- Automatic conflict detection
- Suggested resolutions
- Alternative family member suggestions
- One-tap reassignment
- Conflict explanation
- Manual override option
- Conflict history
- Proactive conflict prevention

*Technical Implementation:*
- Conflict detection algorithm
- Resolution suggestion engine
- Availability checking
- Reassignment automation
- Notification system

*User Experience:*
- Conflict detected: "Tom's dentist conflicts with Emma's soccer"
- Suggestions:
  1. Reschedule dentist to 1 PM
  2. Ask Sarah to take Emma
  3. Keep both (requires coordination)
- Tap suggestion to execute
- Automatic calendar updates
- All affected parties notified

---

### 3.8 Context-Aware Intelligence (5 Features)

**3.8.1 Location Tracking & Geofencing**

Background location monitoring for context-aware assistance.

*Sub-Features:*
- Background GPS tracking
- Battery-optimized updates (every 100m)
- Known locations (home, work, school, frequent stores)
- Geofence entry/exit detection
- 20 simultaneous geofences per user
- Activity recognition (driving/walking/stationary)
- Location history (24 hours)
- Privacy controls
- Manual location update
- Location-based automation triggers

*Technical Implementation:*
- Native location services (iOS/Android)
- Background geolocation library
- Geofencing APIs
- Activity recognition APIs
- Location data storage (24-hour rolling)
- Privacy-compliant tracking

*User Experience:*
- Automatic location detection
- No manual check-ins needed
- Triggers location-based reminders
- Privacy: User controls tracking on/off
- Battery efficient
- Transparent: User can see location history

---

**3.8.2 Weather Awareness**

Real-time weather integration for context.

*Sub-Features:*
- Current weather at user location
- Severe weather alerts
- Event-specific forecasts
- Rain/snow notifications
- Temperature-based suggestions
- Hourly forecast
- 7-day outlook
- Weather-based task suggestions
- Outdoor event warnings
- Weather widget in app

*Technical Implementation:*
- OpenWeatherMap API
- Location-based weather queries
- Severe weather alert monitoring
- Event-weather correlation
- Notification triggers

*User Experience:*
- Morning notification: "Rain expected at 3 PM (Emma's soccer)"
- Suggestion: "Outdoor run? Great weather today!"
- Alert: "⚠️ Thunderstorm warning. Stay safe!"
- Calendar integration: Shows weather icons on events

---

**3.8.3 Traffic Awareness**

Real-time traffic monitoring for better planning.

*Sub-Features:*
- Real-time traffic monitoring
- Route-specific delays
- Departure time adjustments
- Alternative route suggestions
- Accident/closure notifications
- Commute time predictions
- Travel time to events
- ETA updates
- Heavy traffic alerts
- Traffic widget

*Technical Implementation:*
- Google Maps Directions API
- Traffic monitoring for upcoming events
- Route calculation
- ETA prediction
- Notification triggers

*User Experience:*
- 30 min before meeting: "Heavy traffic on your route"
- "Leave 10 minutes early to arrive on time"
- "Accident on I-95, take Route 1 instead"
- Live ETA updates
- Alternative route suggestions with maps

---

**3.8.4 Activity Recognition**

Detect user's current activity for smart notifications.

*Sub-Features:*
- Driving detection
- Walking/stationary states
- Exercise/running detection
- Sleep pattern recognition
- Automatic quiet mode
- Context-based notification delays
- Safety features (no notifications while driving)
- Activity-based automation

*Technical Implementation:*
- Native activity recognition APIs
- Motion sensor processing
- Activity classification
- State machine for activity tracking
- Notification interruptibility scoring

*User Experience:*
- While driving: Notifications delayed for safety
- Notification when car stops: "You're near grocery store"
- During sleep hours: Auto quiet mode
- While walking: OK to interrupt
- Seamless, automatic adjustments

---

**3.8.5 Behavioral Learning**

AI learns user patterns for personalization.

*Sub-Features:*
- Response time patterns
- Notification preferences by time of day
- Common locations identification
- Routine recognition (work hours, sleep times)
- Personalized timing optimization
- Snooze rate tracking
- Optimal notification windows
- Continuous improvement
- Weekly behavior reports

*Technical Implementation:*
- Machine learning algorithms
- Notification interaction logging
- Pattern detection
- Preference inference
- Nightly behavior analysis job
- User profile updates

*User Experience:*
- McCarthy learns: "You're most responsive 9 AM - 5 PM"
- Notifications arrive at best times
- Recognizes routines: "You usually leave for work at 8:15"
- Improves over time
- User can view learned patterns

---

## 4. Voice AI Implementation

### 4.1 Wake Word Detection

```javascript
import { Porcupine } from '@picovoice/porcupine-react-native';

// Initialize on app launch
const initializePorcupine = async () => {
  try {
    const porcupine = await Porcupine.fromKeywords(
      ['hey_mccarthy'],
      (keywordIndex) => {
        // Wake word detected!
        console.log('Wake word detected');
        playActivationChime();
        startVoiceRecognition();
        showListeningUI();
      }
    );
    
    await porcupine.start();
    return porcupine;
  } catch (error) {
    console.error('Porcupine initialization failed:', error);
  }
};

// Background execution setup
const setupBackgroundWakeWord = async () => {
  // iOS: Background audio mode
  if (Platform.OS === 'ios') {
    await BackgroundAudio.enable();
  }
  
  // Android: Foreground service
  if (Platform.OS === 'android') {
    await BackgroundService.start({
      taskName: 'WakeWordDetection',
      taskTitle: 'McCarthy is listening',
      taskDesc: 'Tap to open McCarthy',
      taskIcon: { name: 'ic_launcher', type: 'mipmap' }
    });
  }
};
```

**Battery Optimization:**
- Configurable sleep hours (default: 11 PM - 6 AM)
- Pause during low battery (<15%)
- Reduce processing when device stationary
- User-configurable sensitivity

### 4.2 Speech Recognition

```javascript
import Voice from '@react-native-voice/voice';

// Initialize voice recognition
const initializeVoice = () => {
  Voice.onSpeechStart = onSpeechStart;
  Voice.onSpeechEnd = onSpeechEnd;
  Voice.onSpeechResults = onSpeechResults;
  Voice.onSpeechError = onSpeechError;
};

// Start recognition
const startListening = async () => {
  try {
    await Voice.start('en-US', {
      // iOS specific options
      RECOGNIZER_ENGINE: Voice.RECOGNIZER_ENGINE_SIRI,
      // Android specific options
      EXTRA_LANGUAGE_MODEL: Voice.LANGUAGE_MODEL_FREE_FORM,
      EXTRA_MAX_RESULTS: 1,
      EXTRA_PARTIAL_RESULTS: true,
      EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2000
    });
  } catch (error) {
    console.error('Voice start error:', error);
  }
};

// Handle results
const onSpeechResults = (event) => {
  const transcript = event.value[0];
  console.log('User said:', transcript);
  processUserInput(transcript);
};

// Stop recognition
const stopListening = async () => {
  try {
    await Voice.stop();
  } catch (error) {
    console.error('Voice stop error:', error);
  }
};
```

**Platform Differences:**
- iOS: Uses Apple Speech Framework automatically
- Android: Uses Google SpeechRecognizer automatically
- Same API, platform picks best engine
- On-device option available for both platforms

### 4.3 Natural Language Understanding

**Backend Processing (Firebase Cloud Function):**
```javascript
const functions = require('firebase-functions');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: functions.config().openai.key,
});
const openai = new OpenAIApi(configuration);

exports.processVoiceInput = functions.https.onCall(async (data, context) => {
  const { transcript, userId } = data;
  
  // Get user context
  const userContext = await getUserContext(userId);
  
  // Call OpenAI with function calling
  const response = await openai.createChatCompletion({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(userContext)
      },
      {
        role: 'user',
        content: transcript
      }
    ],
    functions: [
      {
        name: 'create_task',
        description: 'Create a new task or reminder',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time' },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            assignee: { type: 'string' },
            location: {
              type: 'object',
              properties: {
                latitude: { type: 'number' },
                longitude: { type: 'number' },
                name: { type: 'string' }
              }
            }
          },
          required: ['title']
        }
      },
      {
        name: 'create_calendar_event',
        description: 'Create a calendar event',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            attendees: { type: 'array', items: { type: 'string' } }
          },
          required: ['title', 'startTime']
        }
      },
      {
        name: 'add_shopping_items',
        description: 'Add items to shopping list',
        parameters: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  quantity: { type: 'number' },
                  category: { type: 'string' }
                }
              }
            }
          },
          required: ['items']
        }
      },
      {
        name: 'draft_message',
        description: 'Draft a text message or email',
        parameters: {
          type: 'object',
          properties: {
            recipient: { type: 'string' },
            type: { type: 'string', enum: ['sms', 'email'] },
            subject: { type: 'string' },
            message: { type: 'string' },
            tone: { type: 'string', enum: ['casual', 'professional', 'friendly'] }
          },
          required: ['recipient', 'type', 'message']
        }
      },
      {
        name: 'query_information',
        description: 'Query calendar, tasks, weather, or traffic',
        parameters: {
          type: 'object',
          properties: {
            queryType: { type: 'string', enum: ['calendar', 'tasks', 'weather', 'traffic'] },
            dateRange: { type: 'object' },
            location: { type: 'string' }
          },
          required: ['queryType']
        }
      }
    ],
    function_call: 'auto'
  });
  
  // Execute function if called
  if (response.data.choices[0].finish_reason === 'function_call') {
    const functionName = response.data.choices[0].message.function_call.name;
    const args = JSON.parse(response.data.choices[0].message.function_call.arguments);
    
    const result = await executeFunction(functionName, userId, args);
    return { 
      response: result.message, 
      action: functionName,
      data: result.data 
    };
  }
  
  return { response: response.data.choices[0].message.content };
});

// System prompt builder
const buildSystemPrompt = (userContext) => {
  return `You are McCarthy, a helpful family personal assistant. 
Current context:
- User location: ${userContext.location}
- Current time: ${new Date().toLocaleString()}
- User's next event: ${userContext.nextEvent}
- Family members: ${userContext.familyMembers.join(', ')}
- Weather: ${userContext.weather}
- Upcoming tasks: ${userContext.upcomingTasks}

Be conversational, helpful, and proactive. Always confirm actions before executing them.
When creating tasks or events, infer reasonable defaults from context but ask for clarification when ambiguous.`;
};
```

### 4.4 Text Chat Implementation

**Why Text Chat Matters:**
Text chat is essential for situations where voice isn't practical:
- In meetings or quiet environments
- Privacy concerns
- Prefer typing over speaking
- Voice recognition issues
- Accessibility needs

**UI Implementation:**

```javascript
import { useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text } from 'react-native';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Send to backend for processing
      const response = await processTextInput(inputText);
      
      // Add McCarthy's response
      const mccarthyMessage = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'mccarthy',
        timestamp: new Date(),
        actions: response.actions // Quick action buttons
      };
      
      setMessages(prev => [...prev, mccarthyMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <MessageBubble message={item} />
        )}
        keyExtractor={item => item.id}
      />
      
      {isTyping && <TypingIndicator />}
      
      <View style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message to McCarthy..."
          style={styles.input}
          multiline
        />
        <TouchableOpacity onPress={sendMessage}>
          <Text>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Message bubble component
const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user';
  
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.mccarthyBubble]}>
      <Text style={styles.messageText}>{message.text}</Text>
      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString()}
      </Text>
      
      {/* Quick action buttons for McCarthy's messages */}
      {message.actions && (
        <View style={styles.actions}>
          {message.actions.map(action => (
            <TouchableOpacity 
              key={action.id}
              onPress={() => handleAction(action)}
              style={styles.actionButton}
            >
              <Text>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};
```

**Backend Processing (Same as Voice):**

```javascript
exports.processTextInput = functions.https.onCall(async (data, context) => {
  const { text, userId } = data;
  
  // Get user context (same as voice)
  const userContext = await getUserContext(userId);
  
  // Call OpenAI (identical to voice processing)
  const response = await openai.createChatCompletion({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(userContext)
      },
      {
        role: 'user',
        content: text
      }
    ],
    functions: [...], // Same functions as voice
    function_call: 'auto'
  });
  
  // Execute function if called
  if (response.data.choices[0].finish_reason === 'function_call') {
    const functionName = response.data.choices[0].message.function_call.name;
    const args = JSON.parse(response.data.choices[0].message.function_call.arguments);
    
    const result = await executeFunction(functionName, userId, args);
    
    return { 
      message: result.message,
      actions: result.quickActions, // Optional quick action buttons
      action: functionName,
      data: result.data 
    };
  }
  
  return { message: response.data.choices[0].message.content };
});
```

**Quick Action Buttons:**

McCarthy can include actionable buttons in text responses:

```javascript
// Example: After creating a task
{
  message: "Task created: Pick up dry cleaning tomorrow at 3 PM",
  actions: [
    { id: 'view_task', label: 'View Task', taskId: '123' },
    { id: 'set_reminder', label: 'Add Reminder' },
    { id: 'share', label: 'Share with Family' }
  ]
}

// Example: After detecting conflict
{
  message: "Schedule conflict detected. Your dentist appointment overlaps with Emma's soccer game.",
  actions: [
    { id: 'reschedule', label: 'Reschedule Dentist' },
    { id: 'ask_swap', label: 'Ask Tom to Swap' },
    { id: 'keep_both', label: 'Keep Both' }
  ]
}
```

**Toggle Between Voice and Text:**

```javascript
const ConversationSettings = () => {
  const [preferredMode, setPreferredMode] = useState('voice'); // 'voice', 'text', or 'both'
  const [voiceResponsesEnabled, setVoiceResponsesEnabled] = useState(true);
  
  return (
    <View>
      <Text>Conversation Mode:</Text>
      <SegmentedControl
        values={['Voice Only', 'Text Only', 'Both']}
        selectedIndex={preferredMode === 'voice' ? 0 : preferredMode === 'text' ? 1 : 2}
        onChange={(event) => {
          const modes = ['voice', 'text', 'both'];
          setPreferredMode(modes[event.nativeEvent.selectedSegmentIndex]);
        }}
      />
      
      <Switch
        value={voiceResponsesEnabled}
        onValueChange={setVoiceResponsesEnabled}
        label="Voice Responses"
      />
      <Text>McCarthy will speak responses out loud</Text>
    </View>
  );
};
```

### 4.5 Text-to-Speech Implementation

```javascript
import Tts from 'react-native-tts';

// Initialize TTS
const initializeTTS = async () => {
  try {
    // Set default language
    await Tts.setDefaultLanguage('en-US');
    
    // Set speech rate
    await Tts.setDefaultRate(0.5); // 0.5 = normal speed
    
    // Set pitch
    await Tts.setDefaultPitch(1.0); // 1.0 = normal pitch
    
    // Get available voices
    const voices = await Tts.voices();
    const selectedVoice = voices.find(v => v.language === 'en-US' && v.quality === 'enhanced');
    await Tts.setDefaultVoice(selectedVoice.id);
  } catch (error) {
    console.error('TTS initialization failed:', error);
  }
};

// Speak text (only if voice responses enabled)
const speak = async (text) => {
  const user = await getUserSettings();
  
  if (!user.voiceResponsesEnabled) {
    return; // Text-only mode
  }
  
  try {
    await Tts.speak(text);
  } catch (error) {
    console.error('TTS speak error:', error);
  }
};

// Stop speaking
const stopSpeaking = async () => {
  try {
    await Tts.stop();
  } catch (error) {
    console.error('TTS stop error:', error);
  }
};
```

---

## 5. Location & Context Awareness System

### 5.1 Background Location Tracking

**How McCarthy Knows Where You Are:**

McCarthy uses native iOS and Android location services with background tracking enabled. This allows the app to monitor your location even when not actively open.

**Implementation:**

```javascript
import BackgroundGeolocation from 'react-native-background-geolocation';

// Initialize background geolocation
const initializeLocationTracking = async () => {
  await BackgroundGeolocation.ready({
    // Geolocation Config
    desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_NAVIGATION,
    distanceFilter: 100, // Update every 100 meters
    stopTimeout: 5, // Stop tracking after 5 minutes stationary
    
    // Activity Recognition
    stopDetectionDelay: 5, // minutes
    stopOnStationary: false,
    
    // Application config
    debug: false, // Set to true for development
    logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
    startOnBoot: true, // Auto-start on device reboot
    stopOnTerminate: false, // Continue when app is terminated
    
    // HTTP / SQLite config
    url: 'https://your-firebase-function.com/updateLocation',
    autoSync: true, // Auto-sync to server
    batchSync: false, // Upload immediately
    
    // Geofencing
    geofenceProximityRadius: 1000, // 1km
    
    // iOS specific
    preventSuspend: true,
    pausesLocationUpdatesAutomatically: false,
    
    // Android specific
    foregroundService: true,
    notification: {
      title: 'McCarthy is active',
      text: 'Helping you stay organized'
    },
    locationAuthorizationRequest: 'Always'
  }, (state) => {
    console.log('BackgroundGeolocation is configured:', state);
    
    if (!state.enabled) {
      BackgroundGeolocation.start();
    }
  });
  
  // Location update listener
  BackgroundGeolocation.onLocation(async (location) => {
    console.log('[location]', location);
    await processLocationUpdate(location);
  }, (error) => {
    console.error('[location] ERROR:', error);
  });
  
  // Activity change listener
  BackgroundGeolocation.onActivityChange((activity) => {
    console.log('[activity]', activity.activity, activity.confidence);
    updateUserActivity(activity);
  });
  
  // Start tracking
  await BackgroundGeolocation.start();
};

// Process location updates
const processLocationUpdate = async (location) => {
  const { latitude, longitude, speed, heading } = location;
  
  // Update user's current location in Firebase
  await firestore().collection('users').doc(userId).update({
    'location.current': {
      latitude,
      longitude,
      timestamp: new Date(),
      accuracy: location.accuracy
    }
  });
  
  // Check for geofence triggers
  await checkGeofences(latitude, longitude);
  
  // Determine context (home, work, store, etc.)
  const context = await determineLocationContext(latitude, longitude);
  
  // Check for location-based notifications
  await checkLocationBasedReminders(context);
};
```

**Known Locations Setup:**

```javascript
const addKnownLocation = async (userId, locationType, location) => {
  const { latitude, longitude, name } = location;
  
  // Save to Firestore
  await firestore().collection('users').doc(userId).update({
    [`knownLocations.${locationType}`]: {
      name,
      latitude,
      longitude,
      radius: 200 // meters
    }
  });
  
  // Add geofence
  await BackgroundGeolocation.addGeofence({
    identifier: `${userId}_${locationType}`,
    radius: 200,
    latitude,
    longitude,
    notifyOnEntry: true,
    notifyOnExit: true,
    notifyOnDwell: false
  });
};

// Example: Setting up home location
const setupHomeLocation = async (userId) => {
  // User can set via address or current location
  const homeLocation = {
    name: 'Home',
    latitude: 40.7128,
    longitude: -74.0060
  };
  
  await addKnownLocation(userId, 'home', homeLocation);
};
```

**Geofence Event Handling:**

```javascript
BackgroundGeolocation.onGeofence(async (geofence) => {
  console.log('[geofence]', geofence.action, geofence.identifier);
  
  const { action, identifier } = geofence;
  const [userId, locationType] = identifier.split('_');
  
  if (action === 'ENTER') {
    // User entered a known location
    await handleLocationEntry(userId, locationType);
  } else if (action === 'EXIT') {
    // User left a known location
    await handleLocationExit(userId, locationType);
  }
});

const handleLocationEntry = async (userId, locationType) => {
  // Check for location-based tasks
  const locationTasks = await firestore()
    .collection('tasks')
    .where('userId', '==', userId)
    .where('location.type', '==', locationType)
    .where('location.trigger', '==', 'arrival')
    .where('status', '==', 'pending')
    .get();
  
  for (const task of locationTasks.docs) {
    await sendNotification(userId, {
      title: 'Location Reminder',
      body: `You're at ${locationType}: ${task.data().title}`,
      taskId: task.id
    });
  }
  
  // Check for shopping lists if entering a store
  if (locationType.includes('store_')) {
    await checkShoppingLists(userId, locationType);
  }
};
```

### 5.2 Weather Integration

```javascript
const getWeather = async (latitude, longitude) => {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=imperial`
  );
  const data = await response.json();
  
  return {
    temperature: data.main.temp,
    condition: data.weather[0].main,
    description: data.weather[0].description,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    icon: data.weather[0].icon
  };
};

// Weather-based notifications
const checkWeatherAlerts = async (userId) => {
  const user = await getUserLocation(userId);
  const weather = await getWeather(user.latitude, user.longitude);
  
  // Check severe weather
  if (weather.condition === 'Thunderstorm' || weather.condition === 'Tornado') {
    await sendNotification(userId, {
      title: '⚠️ Severe Weather Alert',
      body: `${weather.description} in your area. Stay safe!`,
      priority: 'high'
    });
  }
  
  // Check for outdoor events
  const outdoorEvents = await getOutdoorEvents(userId);
  if (outdoorEvents.length > 0 && (weather.condition === 'Rain' || weather.condition === 'Snow')) {
    await sendNotification(userId, {
      title: '🌧️ Weather Update',
      body: `${weather.description} expected. Your outdoor event "${outdoorEvents[0].title}" may be affected.`,
      eventId: outdoorEvents[0].id
    });
  }
};
```

### 5.3 Traffic Integration

```javascript
const getTrafficData = async (origin, destination) => {
  const originStr = `${origin.latitude},${origin.longitude}`;
  const destStr = `${destination.latitude},${destination.longitude}`;
  
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`
  );
  const data = await response.json();
  
  if (data.routes.length > 0) {
    const route = data.routes[0].legs[0];
    return {
      normalDuration: route.duration.value, // seconds
      trafficDuration: route.duration_in_traffic.value, // seconds
      distance: route.distance.value, // meters
      delay: route.duration_in_traffic.value - route.duration.value
    };
  }
  
  return null;
};

// Traffic-aware departure reminders
const checkTrafficAndNotify = async (userId, event) => {
  const userLocation = await getUserLocation(userId);
  const eventLocation = {
    latitude: event.location.latitude,
    longitude: event.location.longitude
  };
  
  const traffic = await getTrafficData(userLocation, eventLocation);
  
  if (traffic) {
    const minutesDelay = Math.round(traffic.delay / 60);
    const minutesToEvent = Math.round((event.startTime - Date.now()) / 60000);
    const travelTime = Math.round(traffic.trafficDuration / 60);
    
    // If significant delay, notify earlier
    if (minutesDelay > 10 && minutesToEvent <= travelTime + 15) {
      await sendNotification(userId, {
        title: '🚗 Traffic Alert',
        body: `Heavy traffic! ${travelTime} min to "${event.title}". Leave now to arrive on time.`,
        eventId: event.id,
        priority: 'high'
      });
    }
  }
};
```

### 5.4 Store Proximity Notifications

```javascript
const checkShoppingLists = async (userId, storeType) => {
  // Get active shopping lists
  const lists = await firestore()
    .collection('shopping_lists')
    .where('familyId', '==', userId)
    .where('archived', '==', false)
    .get();
  
  let totalItems = 0;
  const uncheckedItems = [];
  
  lists.forEach(list => {
    list.data().items.forEach(item => {
      if (!item.checked) {
        totalItems++;
        uncheckedItems.push(item.name);
      }
    });
  });
  
  if (totalItems > 0) {
    await sendNotification(userId, {
      title: `🛒 You're near ${storeType}`,
      body: `${totalItems} items on your list: ${uncheckedItems.slice(0, 3).join(', ')}${totalItems > 3 ? '...' : ''}`,
      action: 'open_shopping_list'
    });
  }
};
```

---

## 6. Context-Aware Notification System

### 6.1 Context Collection

```javascript
const collectUserContext = async (userId) => {
  const user = await firestore().collection('users').doc(userId).get();
  const userData = user.data();
  
  // Get current location
  const location = userData.location.current;
  
  // Determine location context
  const locationContext = await determineLocationContext(
    location.latitude,
    location.longitude,
    userData.knownLocations
  );
  
  // Get activity
  const activity = userData.activity || 'stationary';
  
  // Get device state
  const deviceState = {
    batteryLevel: await getBatteryLevel(),
    isCharging: await isCharging(),
    screenState: await getScreenState(),
    doNotDisturb: await isDoNotDisturb()
  };
  
  // Get calendar context
  const now = new Date();
  const events = await firestore()
    .collection('calendar_events')
    .where('userId', '==', userId)
    .where('startTime', '>=', now)
    .orderBy('startTime')
    .limit(2)
    .get();
  
  const currentEvent = events.docs.find(e => {
    const start = e.data().startTime.toDate();
    const end = e.data().endTime.toDate();
    return now >= start && now <= end;
  });
  
  const nextEvent = events.docs.find(e => {
    const start = e.data().startTime.toDate();
    return now < start;
  });
  
  const calendarContext = {
    currentEvent: currentEvent?.data(),
    nextEvent: nextEvent?.data(),
    timeUntilNextEvent: nextEvent ? 
      (nextEvent.data().startTime.toDate() - now) / 60000 : null
  };
  
  // Get behavioral patterns
  const behaviorPatterns = userData.behaviorPatterns || {
    typicalWakeTime: 7,
    typicalSleepTime: 23,
    responsiveHours: [7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    averageResponseTime: 5, // minutes
    snoozeRate: 0.2 // 20%
  };
  
  // Get weather
  const weather = await getWeather(location.latitude, location.longitude);
  
  return {
    userId,
    location: locationContext,
    activity,
    deviceState,
    calendarContext,
    behaviorPatterns,
    weather,
    timestamp: new Date()
  };
};

const determineLocationContext = (lat, lon, knownLocations) => {
  // Check if user is at a known location
  for (const [locationType, location] of Object.entries(knownLocations)) {
    const distance = calculateDistance(
      lat, lon,
      location.latitude, location.longitude
    );
    
    if (distance <= location.radius) {
      return {
        type: locationType,
        name: location.name,
        confidence: 1 - (distance / location.radius)
      };
    }
  }
  
  // Unknown location
  return {
    type: 'unknown',
    name: 'Current Location',
    confidence: 0
  };
};

// Haversine formula for distance calculation
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
};
```

### 6.2 Interruptibility Scoring

```javascript
const calculateInterruptibility = (context, notificationType, urgency) => {
  let score = 0.5; // Baseline interruptibility
  
  // Deductions (reduce likelihood of notification)
  if (context.activity === 'driving') {
    score -= 0.4; // Driving is dangerous time to interrupt
  }
  
  if (context.calendarContext.currentEvent) {
    const eventTitle = context.calendarContext.currentEvent.title.toLowerCase();
    if (eventTitle.includes('meeting') || eventTitle.includes('call')) {
      score -= 0.4; // In a meeting
    } else {
      score -= 0.2; // In any event
    }
  }
  
  if (context.deviceState.doNotDisturb) {
    score -= 0.5; // DND mode enabled
  }
  
  if (context.deviceState.screenState === 'off') {
    score -= 0.1; // Screen off, user not actively using device
  }
  
  const currentHour = new Date().getHours();
  if (!context.behaviorPatterns.responsiveHours.includes(currentHour)) {
    score -= 0.3; // Outside typical responsive hours
  }
  
  if (context.deviceState.batteryLevel < 15 && !context.deviceState.isCharging) {
    score -= 0.2; // Low battery, minimize notifications
  }
  
  // Additions (increase likelihood of notification)
  if (context.behaviorPatterns.responsiveHours.includes(currentHour)) {
    score += 0.2; // During known responsive hours
  }
  
  if (urgency === 'high') {
    score += 0.3; // High urgency items get priority
  }
  
  if (context.location.type === 'home' && currentHour >= 18) {
    score += 0.1; // At home in evening
  }
  
  if (context.activity === 'stationary' && context.deviceState.screenState === 'on') {
    score += 0.2; // User is stationary with screen on
  }
  
  if (context.deviceState.isCharging) {
    score += 0.1; // Device charging, less battery concern
  }
  
  // Notification type modifiers
  if (notificationType === 'location_reminder') {
    score += 0.2; // Location-based reminders are timely
  }
  
  if (notificationType === 'family_request') {
    score += 0.15; // Family coordination is important
  }
  
  // Clamp score between 0 and 1
  return Math.max(0, Math.min(1, score));
};

// Notification decision logic
const shouldSendNotification = async (userId, notification) => {
  const context = await collectUserContext(userId);
  const score = calculateInterruptibility(
    context,
    notification.type,
    notification.urgency || 'medium'
  );
  
  // Decision thresholds
  const THRESHOLD_LOW = 0.3;
  const THRESHOLD_HIGH = 0.7;
  
  if (score < THRESHOLD_LOW && notification.urgency !== 'high') {
    // Defer notification
    await deferNotification(userId, notification, context);
    return false;
  } else if (score >= THRESHOLD_LOW || notification.urgency === 'high') {
    // Send notification now
    await sendNotification(userId, notification);
    await logNotificationInteraction(userId, notification, context, 'sent');
    return true;
  }
  
  return false;
};

// Defer notification for better timing
const deferNotification = async (userId, notification, context) => {
  const deferralRecord = {
    userId,
    notification,
    originalContext: context,
    deferrals: (notification.deferrals || 0) + 1,
    nextRetry: calculateNextRetry(context),
    createdAt: new Date()
  };
  
  await firestore().collection('deferred_notifications').add(deferralRecord);
  
  // Max 3 deferrals, then send anyway
  if (deferralRecord.deferrals >= 3) {
    await sendNotification(userId, notification);
  }
};

const calculateNextRetry = (context) => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // If user is driving, retry in 10 minutes
  if (context.activity === 'driving') {
    return new Date(now.getTime() + 10 * 60000);
  }
  
  // If in meeting, retry after meeting ends + 5 minutes
  if (context.calendarContext.currentEvent) {
    const meetingEnd = context.calendarContext.currentEvent.endTime.toDate();
    return new Date(meetingEnd.getTime() + 5 * 60000);
  }
  
  // If outside responsive hours, retry at next responsive hour
  if (!context.behaviorPatterns.responsiveHours.includes(currentHour)) {
    const nextHour = context.behaviorPatterns.responsiveHours.find(h => h > currentHour) ||
                     context.behaviorPatterns.responsiveHours[0];
    const retryDate = new Date(now);
    retryDate.setHours(nextHour, 0, 0, 0);
    if (nextHour <= currentHour) {
      retryDate.setDate(retryDate.getDate() + 1);
    }
    return retryDate;
  }
  
  // Default: retry in 30 minutes
  return new Date(now.getTime() + 30 * 60000);
};
```

### 6.3 Learning from Behavior

```javascript
const logNotificationInteraction = async (userId, notification, context, interaction) => {
  await firestore().collection('notification_logs').add({
    userId,
    notificationId: notification.id,
    notificationType: notification.type,
    sentAt: new Date(),
    context: {
      hour: context.timestamp.getHours(),
      location: context.location.type,
      activity: context.activity,
      inEvent: !!context.calendarContext.currentEvent
    },
    interaction, // 'sent', 'opened', 'dismissed', 'snoozed', 'ignored'
    interactionTime: interaction !== 'sent' ? new Date() : null
  });
};

// Nightly job to update behavioral patterns
const updateBehavioralPatterns = async (userId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const logs = await firestore()
    .collection('notification_logs')
    .where('userId', '==', userId)
    .where('sentAt', '>=', thirtyDaysAgo)
    .get();
  
  // Calculate hourly response rates
  const hourlyStats = {};
  for (let hour = 0; hour < 24; hour++) {
    hourlyStats[hour] = { sent: 0, opened: 0 };
  }
  
  logs.forEach(log => {
    const hour = log.data().context.hour;
    hourlyStats[hour].sent++;
    if (log.data().interaction === 'opened') {
      hourlyStats[hour].opened++;
    }
  });
  
  // Determine responsive hours (>40% open rate)
  const responsiveHours = [];
  for (let hour = 0; hour < 24; hour++) {
    if (hourlyStats[hour].sent > 0) {
      const rate = hourlyStats[hour].opened / hourlyStats[hour].sent;
      if (rate > 0.4) {
        responsiveHours.push(hour);
      }
    }
  }
  
  // Calculate average response time
  const responseTimes = [];
  logs.forEach(log => {
    if (log.data().interaction === 'opened' && log.data().interactionTime) {
      const diff = log.data().interactionTime.toDate() - log.data().sentAt.toDate();
      responseTimes.push(diff / 60000); // minutes
    }
  });
  const averageResponseTime = responseTimes.length > 0 ?
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 5;
  
  // Calculate snooze rate
  const snoozed = logs.docs.filter(d => d.data().interaction === 'snoozed').length;
  const snoozeRate = logs.size > 0 ? snoozed / logs.size : 0.2;
  
  // Update user profile
  await firestore().collection('users').doc(userId).update({
    'behaviorPatterns.responsiveHours': responsiveHours.length > 0 ? 
      responsiveHours : [7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    'behaviorPatterns.averageResponseTime': averageResponseTime,
    'behaviorPatterns.snoozeRate': snoozeRate,
    'behaviorPatterns.lastUpdated': new Date()
  });
};

// Schedule nightly updates
exports.updateAllUserBehaviors = functions.pubsub.schedule('every day 02:00')
  .onRun(async (context) => {
    const users = await firestore().collection('users').get();
    
    const promises = users.docs.map(user => 
      updateBehavioralPatterns(user.id)
    );
    
    await Promise.all(promises);
    return null;
  });
```

---

## 7. Message Sending Capabilities

### 7.1 Message Drafting Flow

```javascript
// User initiates message drafting
const handleDraftMessageRequest = async (userId, intent) => {
  // Extract intent from user's voice command
  // Example: "Draft a text to Sarah saying I'll be 10 minutes late"
  
  const draft = await generateMessageDraft({
    recipient: intent.recipient,
    messageType: intent.type, // 'sms' or 'email'
    content: intent.content,
    tone: intent.tone || 'casual',
    context: await getUserContext(userId)
  });
  
  // Save draft
  const draftDoc = await firestore().collection('message_drafts').add({
    userId,
    recipient: draft.recipient,
    type: draft.type,
    subject: draft.subject,
    message: draft.message,
    tone: draft.tone,
    status: 'pending_review',
    createdAt: new Date()
  });
  
  // Present draft to user for review
  return {
    draftId: draftDoc.id,
    draft: draft,
    actions: ['read_aloud', 'edit', 'send', 'cancel']
  };
};

const generateMessageDraft = async (params) => {
  const { recipient, messageType, content, tone, context } = params;
  
  const response = await openai.createChatCompletion({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: `You are helping compose a ${tone} ${messageType}. 
Be natural and appropriate for the relationship and context.
Current context: ${JSON.stringify(context)}`
      },
      {
        role: 'user',
        content: `Draft a ${messageType} to ${recipient}: ${content}`
      }
    ],
    temperature: 0.7
  });
  
  const message = response.data.choices[0].message.content;
  
  return {
    recipient,
    type: messageType,
    subject: messageType === 'email' ? extractSubject(message) : null,
    message: messageType === 'email' ? extractBody(message) : message,
    tone
  };
};
```

### 7.2 Draft Review & Approval

```javascript
// User reviews draft
const reviewDraft = async (draftId, action) => {
  const draft = await firestore().collection('message_drafts').doc(draftId).get();
  const draftData = draft.data();
  
  switch (action) {
    case 'read_aloud':
      await readDraftAloud(draftData);
      return {
        status: 'read',
        prompt: 'Does this sound good? Say "send it", "make changes", or "cancel"'
      };
      
    case 'edit':
      return {
        status: 'editing',
        prompt: 'What would you like to change?'
      };
      
    case 'send':
      // Proceed to send
      await sendMessage(draftData);
      await firestore().collection('message_drafts').doc(draftId).update({
        status: 'sent',
        sentAt: new Date()
      });
      return {
        status: 'sent',
        message: `Message sent to ${draftData.recipient}`
      };
      
    case 'cancel':
      await firestore().collection('message_drafts').doc(draftId).update({
        status: 'cancelled',
        cancelledAt: new Date()
      });
      return {
        status: 'cancelled',
        message: 'Draft cancelled'
      };
  }
};

const readDraftAloud = async (draft) => {
  const text = draft.type === 'email' ?
    `Subject: ${draft.subject}. Message: ${draft.message}` :
    `Message: ${draft.message}`;
  
  await speak(text);
};

// Handle edit requests
const editDraft = async (draftId, editInstructions) => {
  const draft = await firestore().collection('message_drafts').doc(draftId).get();
  const draftData = draft.data();
  
  const response = await openai.createChatCompletion({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are editing a message draft based on user feedback.'
      },
      {
        role: 'user',
        content: `Original message: "${draftData.message}"
Edit instructions: ${editInstructions}
Provide the revised message.`
      }
    ],
    temperature: 0.7
  });
  
  const revisedMessage = response.data.choices[0].message.content;
  
  await firestore().collection('message_drafts').doc(draftId).update({
    message: revisedMessage,
    editHistory: admin.firestore.FieldValue.arrayUnion({
      original: draftData.message,
      instructions: editInstructions,
      revised: revisedMessage,
      timestamp: new Date()
    })
  });
  
  return {
    message: revisedMessage,
    prompt: 'Here\'s the updated message. Ready to send?'
  };
};
```

### 7.3 Message Sending Implementation

**SMS Sending via Twilio:**

```javascript
const sendSMS = async (draft) => {
  const twilioClient = require('twilio')(
    functions.config().twilio.account_sid,
    functions.config().twilio.auth_token
  );
  
  try {
    const message = await twilioClient.messages.create({
      body: draft.message,
      from: functions.config().twilio.phone_number,
      to: draft.recipient
    });
    
    // Log sent message
    await firestore().collection('sent_messages').add({
      userId: draft.userId,
      recipient: draft.recipient,
      type: 'sms',
      message: draft.message,
      twilioSid: message.sid,
      status: message.status,
      sentAt: new Date()
    });
    
    return {
      success: true,
      messageId: message.sid,
      status: message.status
    };
  } catch (error) {
    console.error('SMS sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Track delivery status
const trackSMSDelivery = async (messageSid) => {
  const twilioClient = require('twilio')(
    functions.config().twilio.account_sid,
    functions.config().twilio.auth_token
  );
  
  const message = await twilioClient.messages(messageSid).fetch();
  
  await firestore().collection('sent_messages')
    .where('twilioSid', '==', messageSid)
    .limit(1)
    .get()
    .then(snapshot => {
      if (!snapshot.empty) {
        snapshot.docs[0].ref.update({
          status: message.status,
          deliveredAt: message.status === 'delivered' ? new Date() : null
        });
      }
    });
  
  return message.status;
};
```

**Email Sending via SendGrid:**

```javascript
const sendEmail = async (draft) => {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(functions.config().sendgrid.api_key);
  
  const msg = {
    to: draft.recipient,
    from: {
      email: 'noreply@mccarthy.app',
      name: 'McCarthy Assistant'
    },
    subject: draft.subject,
    text: draft.message,
    html: `<p>${draft.message.replace(/\n/g, '<br>')}</p>`,
    trackingSettings: {
      clickTracking: { enable: false },
      openTracking: { enable: true }
    }
  };
  
  try {
    const response = await sgMail.send(msg);
    
    // Log sent email
    await firestore().collection('sent_messages').add({
      userId: draft.userId,
      recipient: draft.recipient,
      type: 'email',
      subject: draft.subject,
      message: draft.message,
      sendGridId: response[0].headers['x-message-id'],
      status: 'sent',
      sentAt: new Date()
    });
    
    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      status: 'sent'
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
```

### 7.4 Copy to Clipboard Alternative

```javascript
import Clipboard from '@react-native-clipboard/clipboard';

const copyDraftToClipboard = async (draftId) => {
  const draft = await firestore().collection('message_drafts').doc(draftId).get();
  const draftData = draft.data();
  
  const textToCopy = draftData.type === 'email' ?
    `Subject: ${draftData.subject}\n\n${draftData.message}` :
    draftData.message;
  
  Clipboard.setString(textToCopy);
  
  // Show confirmation
  Alert.alert(
    'Copied to Clipboard',
    'Your message has been copied. You can now paste it in any app.',
    [{ text: 'OK' }]
  );
  
  // Log action
  await firestore().collection('message_drafts').doc(draftId).update({
    status: 'copied',
    copiedAt: new Date()
  });
};
```

---

## 8. Privacy & Security

### 8.1 Privacy-First Design

1. **On-Device Processing**: Voice recognition and wake word detection happen on device
2. **Minimal Data Transmission**: Only transcripts sent to cloud, not audio
3. **Auto-Deletion**: 
   - Location data deleted after 24 hours
   - Notification logs deleted after 90 days
4. **User Control**: Granular privacy settings for every feature
5. **Transparent Tracking**: Users can see exactly what location data is stored

### 8.2 Data Encryption

**At Rest**: AES-256 encryption
```javascript
import EncryptedStorage from 'react-native-encrypted-storage';

const storeSecureData = async (key, data) => {
  try {
    await EncryptedStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Encryption error:', error);
  }
};

const retrieveSecureData = async (key) => {
  try {
    const data = await EncryptedStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};
```

**In Transit**: TLS 1.3 (Firebase SDK default)

### 8.3 Data Retention Policies

**Auto-Deletion Schedule:**
- Location data: 24 hours
- Completed tasks: 30 days after completion
- Voice note audio: 90 days (transcript kept indefinitely)
- Notification logs: 90 days
- Message drafts: 30 days
- Conversation history: 1 year

**User-Initiated Deletion:**
```javascript
const deleteAllUserData = async (userId) => {
  const batch = firestore().batch();
  
  // Delete user profile
  batch.delete(firestore().collection('users').doc(userId));
  
  // Delete tasks
  const tasks = await firestore().collection('tasks')
    .where('userId', '==', userId).get();
  tasks.forEach(doc => batch.delete(doc.ref));
  
  // Delete calendar events
  const events = await firestore().collection('calendar_events')
    .where('userId', '==', userId).get();
  events.forEach(doc => batch.delete(doc.ref));
  
  // Delete voice notes
  const notes = await firestore().collection('voice_notes')
    .where('userId', '==', userId).get();
  notes.forEach(doc => {
    batch.delete(doc.ref);
    // Also delete audio files from Storage
    const audioPath = doc.data().audioPath;
    if (audioPath) {
      storage().ref(audioPath).delete();
    }
  });
  
  // Delete notification logs
  const logs = await firestore().collection('notification_logs')
    .where('userId', '==', userId).get();
  logs.forEach(doc => batch.delete(doc.ref));
  
  // Delete from Firebase Auth
  await admin.auth().deleteUser(userId);
  
  // Commit batch
  await batch.commit();
  
  return { success: true, message: 'All user data deleted' };
};
```

### 8.4 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isFamilyMember(familyId) {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid));
    }
    
    function isFamilyAdmin(familyId) {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Families collection
    match /families/{familyId} {
      allow read: if isFamilyMember(familyId);
      allow create: if isAuthenticated();
      allow update, delete: if isFamilyAdmin(familyId);
      
      match /members/{memberId} {
        allow read: if isFamilyMember(familyId);
        allow write: if isFamilyAdmin(familyId);
      }
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid ||
                      isFamilyMember(resource.data.familyId));
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() &&
                       (resource.data.userId == request.auth.uid ||
                        resource.data.assignee.userId == request.auth.uid ||
                        resource.data.createdBy.userId == request.auth.uid);
      allow delete: if isAuthenticated() &&
                       (resource.data.userId == request.auth.uid ||
                        resource.data.createdBy.userId == request.auth.uid);
    }
    
    // Calendar events collection
    match /calendar_events/{eventId} {
      allow read: if isAuthenticated() &&
                     (resource.data.userId == request.auth.uid ||
                      isFamilyMember(resource.data.familyId) ||
                      request.auth.uid in resource.data.attendeeIds);
      allow create, update, delete: if isAuthenticated() &&
                                        resource.data.userId == request.auth.uid;
    }
    
    // Shopping lists collection
    match /shopping_lists/{listId} {
      allow read, write: if isAuthenticated() &&
                            isFamilyMember(resource.data.familyId);
    }
    
    // Voice notes collection
    match /voice_notes/{noteId} {
      allow read: if isAuthenticated() &&
                     (resource.data.userId == request.auth.uid ||
                      request.auth.uid in resource.data.sharedWith);
      allow create, update, delete: if isAuthenticated() &&
                                        resource.data.userId == request.auth.uid;
    }
    
    // Message drafts collection
    match /message_drafts/{draftId} {
      allow read, write: if isAuthenticated() &&
                            resource.data.userId == request.auth.uid;
    }
    
    // Notification logs collection
    match /notification_logs/{logId} {
      allow read, write: if isAuthenticated() &&
                            resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 9. Data Models

### 9.1 Core Collections

**users:**
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  familyId: string,
  
  settings: {
    quietHoursStart: number, // 23 (11 PM)
    quietHoursEnd: number, // 7 (7 AM)
    
    // Conversation preferences
    preferredMode: 'voice' | 'text' | 'both', // Default interaction mode
    voiceResponsesEnabled: boolean, // McCarthy speaks responses
    preferredVoice: string,
    
    // Notifications
    notificationsEnabled: boolean,
    locationTrackingEnabled: boolean,
    
    // Text chat preferences
    showQuickActions: boolean, // Show action buttons in text responses
    textNotificationSound: boolean, // Sound for text messages from McCarthy
    autoOpenKeyboard: boolean // Auto-open keyboard in text mode
  },
  
  deviceTokens: [
    {
      token: string,
      platform: 'ios' | 'android',
      addedAt: timestamp
    }
  ],
  
  knownLocations: {
    home: {
      name: string,
      latitude: number,
      longitude: number,
      radius: number // meters
    },
    work: {
      name: string,
      latitude: number,
      longitude: number,
      radius: number
    }
    // ... other locations
  },
  
  location: {
    current: {
      latitude: number,
      longitude: number,
      timestamp: timestamp,
      accuracy: number
    }
  },
  
  activity: 'driving' | 'walking' | 'stationary' | 'running',
  
  behaviorPatterns: {
    typicalWakeTime: number,
    typicalSleepTime: number,
    responsiveHours: number[],
    averageResponseTime: number,
    snoozeRate: number,
    lastUpdated: timestamp
  },
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**families:**
```javascript
{
  id: string,
  name: string,
  
  members: [
    {
      userId: string,
      name: string,
      role: 'admin' | 'member',
      color: string, // For calendar color-coding
      joinedAt: timestamp,
      
      permissions: {
        canManageFamily: boolean,
        canCreateEvents: boolean,
        canAssignTasks: boolean
      },
      
      notifications: {
        dailyDigest: boolean,
        taskAssigned: boolean,
        eventReminders: boolean,
        familyMessages: boolean
      }
    }
  ],
  
  settings: {
    timezone: string,
    defaultReminderTime: number, // minutes before
    quietHours: {
      start: number,
      end: number
    }
  },
  
  createdAt: timestamp
}
```

**tasks:**
```javascript
{
  id: string,
  userId: string,
  familyId: string,
  
  title: string,
  description: string,
  
  dueDate: timestamp,
  dueTime: string, // "14:30"
  
  assignee: {
    userId: string,
    name: string
  },
  
  createdBy: {
    userId: string,
    name: string
  },
  
  priority: 'high' | 'medium' | 'low',
  status: 'pending' | 'completed' | 'cancelled',
  
  recurrence: {
    enabled: boolean,
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
    interval: number, // Every N days/weeks/months
    daysOfWeek: number[], // [0,1,2,3,4,5,6] for weekly
    endDate: timestamp
  },
  
  notifications: {
    enabled: boolean,
    timing: number[] // Minutes before due [60, 15, 0]
  },
  
  location: {
    enabled: boolean,
    type: string, // 'home', 'work', 'store_grocery'
    latitude: number,
    longitude: number,
    radius: number,
    trigger: 'arrival' | 'departure'
  },
  
  subtasks: [
    {
      id: string,
      title: string,
      completed: boolean
    }
  ],
  
  completedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**calendar_events:**
```javascript
{
  id: string,
  userId: string,
  familyId: string,
  
  title: string,
  description: string,
  location: string,
  
  startTime: timestamp,
  endTime: timestamp,
  allDay: boolean,
  
  attendees: [
    {
      userId: string,
      name: string,
      email: string,
      status: 'accepted' | 'declined' | 'maybe' | 'pending'
    }
  ],
  
  recurrence: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
    interval: number,
    endDate: timestamp
  },
  
  reminders: [
    {
      type: 'notification' | 'email',
      minutesBefore: number
    }
  ],
  
  nativeCalendarId: string, // Synced with device calendar
  nativeEventId: string,
  
  color: string,
  visibility: 'public' | 'private' | 'family',
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**shopping_lists:**
```javascript
{
  id: string,
  familyId: string,
  name: string,
  
  items: [
    {
      id: string,
      name: string,
      quantity: number,
      unit: string,
      category: string, // 'produce', 'dairy', 'meat', etc.
      checked: boolean,
      price: number,
      store: string,
      
      addedBy: {
        userId: string,
        name: string,
        timestamp: timestamp
      },
      
      checkedBy: {
        userId: string,
        timestamp: timestamp
      }
    }
  ],
  
  archived: boolean,
  archivedAt: timestamp,
  createdAt: timestamp
}
```

**voice_notes:**
```javascript
{
  id: string,
  userId: string,
  familyId: string,
  
  title: string,
  transcript: string,
  audioPath: string, // Cloud Storage path
  duration: number, // seconds
  
  tags: string[],
  
  sharedWith: string[], // User IDs
  
  comments: [
    {
      userId: string,
      userName: string,
      comment: string,
      timestamp: timestamp
    }
  ],
  
  audioDeletedAt: timestamp, // After 90 days
  createdAt: timestamp
}
```

**message_drafts:**
```javascript
{
  id: string,
  userId: string,
  
  recipient: string,
  type: 'sms' | 'email',
  subject: string, // For emails
  message: string,
  tone: 'casual' | 'professional' | 'friendly',
  
  status: 'pending_review' | 'sent' | 'cancelled' | 'copied',
  
  editHistory: [
    {
      original: string,
      instructions: string,
      revised: string,
      timestamp: timestamp
    }
  ],
  
  createdAt: timestamp,
  sentAt: timestamp,
  copiedAt: timestamp
}
```

**conversations:**
```javascript
{
  id: string,
  userId: string,
  
  messages: [
    {
      id: string,
      text: string,
      sender: 'user' | 'mccarthy',
      mode: 'voice' | 'text',
      timestamp: timestamp,
      
      // For voice messages
      audioPath: string, // Optional: if voice message was recorded
      duration: number, // Optional: audio duration in seconds
      
      // For McCarthy responses with actions
      actions: [
        {
          id: string,
          label: string,
          actionType: string,
          metadata: object
        }
      ],
      
      // Function calls executed
      functionCall: {
        name: string,
        arguments: object,
        result: object
      }
    }
  ],
  
  // Conversation metadata
  topic: string, // Auto-generated topic
  lastMessageAt: timestamp,
  archived: boolean,
  
  createdAt: timestamp
}
```

---

## 10. Comprehensive Feature Examples

### Example 1: Morning Routine with Daily Digest

**6:30 AM - User wakes up**

McCarthy detects motion (screen on, activity change from stationary to walking):

**Notification:**
```
☀️ Good Morning, Sarah!

Today's Digest:
• 3 events: 9 AM Team Meeting, 3 PM Pick up Emma (soccer), 6 PM Dinner with Tom's parents
• Weather: 72°F, Sunny ☀️
• 1 urgent task: Submit expense report (due today)
• Traffic: 15 min to office (normal)

Ready to start your day!
```

**User:** "Hey McCarthy, what's first on my schedule?"

**McCarthy:** "Your first event is a team meeting at 9 AM. It's at the downtown office, and with current traffic, you should leave by 8:30 to arrive on time. Would you like me to set a departure reminder?"

**User:** "Yes, 15 minutes before."

**McCarthy:** "Done. I'll remind you at 8:15 AM to leave for your meeting."

---

### Example 2: Voice Task Creation with Location

**3:45 PM - User leaving work**

**User:** "Hey McCarthy, remind me to pick up dry cleaning when I leave work tomorrow."

**McCarthy:** "Got it. I'll add 'Pick up dry cleaning' as a task for tomorrow when you leave work. Should I set a specific time, or just remind you when you leave?"

**User:** "Just when I leave."

**McCarthy:** "Perfect. Task created with a location reminder at work. You'll get notified when you leave the office tomorrow."

**Backend Processing:**
```javascript
{
  title: 'Pick up dry cleaning',
  dueDate: tomorrow,
  location: {
    enabled: true,
    type: 'work',
    latitude: 40.7589, // User's work location
    longitude: -73.9851,
    radius: 200,
    trigger: 'departure'
  },
  assignee: { userId: 'sarah123', name: 'Sarah' },
  status: 'pending'
}
```

---

### Example 3: Proactive Traffic Alert

**8:00 AM - Morning before work commute**

McCarthy monitors traffic conditions for Sarah's 9 AM meeting:

**Context Analysis:**
- Current location: Home
- Next event: 9 AM meeting, 30 min drive normally
- Current traffic: 45 min due to accident on I-95

**8:05 AM - Notification:**
```
🚗 Traffic Alert

Heavy traffic on your route to the meeting! 
Accident on I-95 is adding 15 minutes.

Leave NOW instead of 8:30 to arrive on time.

[View alternate routes] [Leave later anyway]
```

**User taps [View alternate routes]**

McCarthy shows:
```
Route 1 (Recommended): Via Route 1 - 35 min
Route 2: Stay on I-95 - 45 min
Route 3: Via back roads - 38 min
```

---

### Example 4: Family Conflict Resolution

**10:30 AM - Tom adds dentist appointment**

Tom adds: "Dentist appointment, Friday 3 PM"

**McCarthy detects conflict:**
- Emma's soccer game is Friday 3 PM
- Sarah is scheduled to pick up Emma

**10:31 AM - Notification to Tom:**
```
⚠️ Scheduling Conflict

Your dentist appointment (Fri 3 PM) conflicts with:
• Emma's soccer game (3 PM)
• Sarah is picking up Emma

Options:
1. Reschedule dentist to Friday 1 PM (available)
2. Ask Sarah to swap with you
3. Keep both (requires coordination)

What would you like to do?
```

**Tom:** "Ask Sarah to swap."

**10:32 AM - Notification to Sarah:**
```
📅 Schedule Request from Tom

Tom has a dentist appointment Friday 3 PM (same time as Emma's soccer).
Can you two swap pickups?

Tom can pick up Emma at 4 PM after his appointment, and you could pick up Max at 5:30 PM instead.

[Accept swap] [Suggest alternative] [Decline]
```

**Sarah taps [Accept swap]**

**McCarthy automatically:**
1. Updates Tom's calendar: "Dentist" 3 PM + "Pick up Emma" 4 PM
2. Updates Sarah's calendar: Removes "Pick up Emma" 3 PM, adds "Pick up Max" 5:30 PM
3. Updates Emma's calendar: Shows "Dad picking up" instead of "Mom"

---

### Example 5: Location-Based Shopping Reminder

**5:45 PM - Sarah driving home**

McCarthy detects:
- Sarah is 0.5 miles from Whole Foods
- Shopping list has 8 unchecked items
- Sarah is driving

**McCarthy waits for safe moment...**

**5:48 PM - Car stops at red light**

**Notification (delayed until stationary):**
```
🛒 You're near Whole Foods

8 items on your list:
• Milk
• Bread
• Eggs
• Plus 5 more...

Stop now or skip for today?

[Open list] [Skip]
```

**Sarah taps [Open list]**

McCarthy opens shopping list, organized by aisle:
```
Dairy (Aisle 3)
☐ Milk (1 gallon)
☐ Eggs (dozen)
☐ Yogurt (Greek, vanilla)

Bakery (Aisle 8)
☐ Bread (Whole wheat)

Produce (Aisle 1)
☐ Bananas
☐ Apples
☐ Spinach
☐ Tomatoes
```

---

### Example 6: Weather-Aware Event Alert

**6:00 AM - Morning of outdoor event**

McCarthy checks weather for Emma's soccer game today at 3 PM:

**Weather API Response:**
- Current: 68°F, Cloudy
- 3 PM forecast: 72°F, 80% chance of rain

**6:15 AM - Notification to Sarah:**
```
🌧️ Weather Alert

Heavy rain expected this afternoon (80% chance).

Emma's soccer game at 3 PM may be affected.

Recommendations:
• Bring umbrellas and rain gear
• Check with coach about cancellation
• Have indoor backup plan

[Check coach's contact] [View forecast]
```

---

### Example 7: Voice Note with Family Sharing

**10:30 AM - Sarah has an idea**

**User:** "Hey McCarthy, take a voice note."

**McCarthy:** [Beep sound] "Recording now. Speak when ready."

**User:** "Idea for Emma's birthday party. Maybe we could do a princess theme at the park with a bouncy castle. Need to call the party company and check availability for the 15th. Also, Emma mentioned wanting a unicorn cake."

**McCarthy:** [Beep] "Note saved. I heard 'Emma's birthday party' - should I share this with Tom?"

**User:** "Yes."

**McCarthy:** "Shared with Tom. I also noticed you mentioned calling a party company. Should I add that as a task?"

**User:** "Yes, add that."

**McCarthy:** "Task created: 'Call party company about princess party and bouncy castle for the 15th.' Any due date?"

**User:** "This week."

**McCarthy:** "Added with due date Friday. Anything else?"

**User:** "No, that's it."

**Voice Note Created:**
```javascript
{
  title: 'Emma\'s birthday party ideas',
  transcript: 'Idea for Emma\'s birthday party. Maybe we could do a princess theme at the park with a bouncy castle. Need to call the party company and check availability for the 15th. Also, Emma mentioned wanting a unicorn cake.',
  tags: ['birthday', 'Emma', 'party'],
  sharedWith: ['tom456'],
  duration: 28,
  createdAt: timestamp
}
```

**Task Created:**
```javascript
{
  title: 'Call party company about princess party and bouncy castle for the 15th',
  dueDate: 'Friday',
  assignee: { userId: 'sarah123', name: 'Sarah' },
  priority: 'medium'
}
```

---

### Example 8: Smart Message Drafting and Sending

**2:15 PM - Sarah stuck in traffic**

**User:** "Hey McCarthy, I need to text my boss that I'll be about 15 minutes late to the meeting."

**McCarthy:** "I'll draft that for you. What's your boss's name?"

**User:** "Jennifer."

**McCarthy:** "Got it. One moment..."

*[McCarthy generates draft]*

**McCarthy:** "Here's what I drafted: 'Hi Jennifer, I wanted to let you know I'm running about 15 minutes late due to unexpected traffic. I'll join as soon as I arrive. Apologies for the delay.' Does that sound good?"

**User:** "Make it a bit more casual."

**McCarthy:** "How about this: 'Hey Jennifer, just a heads up - stuck in traffic and will be about 15 minutes late. I'll jump in as soon as I get there. Sorry about that!' Better?"

**User:** "Perfect, send it."

**McCarthy:** "Sending now... Done! Text sent to Jennifer. She should receive it in just a moment."

**Backend Flow:**
```javascript
// 1. Initial draft generation
{
  recipient: 'Jennifer',
  type: 'sms',
  message: 'Hi Jennifer, I wanted to let you know I\'m running about 15 minutes late due to unexpected traffic. I\'ll join as soon as I arrive. Apologies for the delay.',
  tone: 'professional',
  status: 'pending_review'
}

// 2. After edit request ("make it more casual")
{
  message: 'Hey Jennifer, just a heads up - stuck in traffic and will be about 15 minutes late. I\'ll jump in as soon as I get there. Sorry about that!',
  tone: 'casual',
  editHistory: [...]
}

// 3. After "send it" approval
{
  status: 'sent',
  sentAt: timestamp,
  deliveryStatus: 'sent' // Updated via Twilio webhook
}
```

---

### Example 9: Recurring Task with Subtasks

**Sunday 8:00 PM - Tom sets up weekly meal prep**

**User:** "Hey McCarthy, create a task for meal prep every Sunday at 2 PM."

**McCarthy:** "Got it. Weekly meal prep task on Sundays at 2 PM. Would you like me to add any subtasks or details?"

**User:** "Yes, add subtasks: Plan meals, grocery shopping, prep vegetables, cook proteins, portion meals."

**McCarthy:** "Perfect. Created recurring task 'Meal Prep' every Sunday at 2 PM with 5 subtasks:
1. Plan meals
2. Grocery shopping  
3. Prep vegetables
4. Cook proteins
5. Portion meals

I'll remind you every Sunday at 1:45 PM. Sound good?"

**User:** "Great."

**Task Created:**
```javascript
{
  title: 'Meal Prep',
  dueDate: 'Sunday',
  dueTime: '14:00',
  assignee: { userId: 'tom456', name: 'Tom' },
  recurrence: {
    enabled: true,
    frequency: 'weekly',
    daysOfWeek: [0], // Sunday
    interval: 1
  },
  subtasks: [
    { id: '1', title: 'Plan meals', completed: false },
    { id: '2', title: 'Grocery shopping', completed: false },
    { id: '3', title: 'Prep vegetables', completed: false },
    { id: '4', title: 'Cook proteins', completed: false },
    { id: '5', title: 'Portion meals', completed: false }
  ],
  notifications: {
    enabled: true,
    timing: [15] // 15 minutes before
  }
}
```

---

### Example 10: Calendar Smart Scheduling

**Wednesday 10:00 AM - Sarah needs to schedule dentist**

**User:** "Hey McCarthy, I need to schedule a dentist appointment next week. When am I free?"

**McCarthy:** "Let me check your calendar for next week... You have several open slots:
- Monday: 2-5 PM
- Wednesday: 10 AM - 12 PM
- Thursday: 1-4 PM  
- Friday: 9 AM - 2 PM

Do you have a preference?"

**User:** "Thursday afternoon works."

**McCarthy:** "Great! I can see you're free Thursday from 1 to 4 PM. The dentist office is 15 minutes away. Would you like me to suggest 2 PM so you have buffer time?"

**User:** "Yes, make it 2 PM."

**McCarthy:** "Creating event: Dentist appointment, Thursday at 2 PM, duration 1 hour. Should I set a reminder?"

**User:** "Yes, day before and one hour before."

**McCarthy:** "Done. Event added with reminders tomorrow at 2 PM and one hour before your appointment. I'll also notify you 20 minutes before you need to leave based on traffic."

**Event Created:**
```javascript
{
  title: 'Dentist Appointment',
  startTime: nextThursday_2PM,
  endTime: nextThursday_3PM,
  location: 'Dr. Smith Dental, 123 Main St',
  reminders: [
    { type: 'notification', minutesBefore: 1440 }, // Day before
    { type: 'notification', minutesBefore: 60 }    // Hour before
  ],
  trafficAlert: true // McCarthy will monitor traffic 30 min before
}
```

---

### Example 11: Multi-Step Task Assignment

**Tuesday 6:00 PM - Family dinner discussion**

**Sarah:** "Hey McCarthy, we need to get the car washed, oil changed, and inspected this week."

**McCarthy:** "Got it, three vehicle maintenance tasks this week. Should I assign these to someone specific?"

**Sarah:** "Tom usually handles the car stuff."

**McCarthy:** "Assigning all three to Tom. Do these need to be done in a specific order?"

**Sarah:** "Yes, wash first, then oil change, then inspection."

**McCarthy:** "Creating sequential tasks:
1. Car wash - due Thursday
2. Oil change - due Friday (after car wash)
3. Vehicle inspection - due Saturday (after oil change)

Tom will be notified. Sound good?"

**Tom (gets notification):**
```
📋 New Tasks Assigned

Sarah assigned you 3 tasks this week:

Thursday: Car wash
Friday: Oil change (after car wash)
Saturday: Vehicle inspection (after oil change)

[View details] [Accept] [Discuss]
```

---

### Example 12: Emergency Rescheduling

**3:45 PM - Sarah has flat tire**

**User:** "Hey McCarthy, I have a flat tire and I need to pick up Emma in 15 minutes at school."

**McCarthy:** "Oh no! Don't worry. Checking who's available to help..."

*[McCarthy checks Tom's calendar and location]*

**McCarthy:** "Tom is available and only 10 minutes from Emma's school. Should I ask him to pick up Emma at 4 PM?"

**User:** "Yes please!"

**McCarthy:** "Sending urgent request to Tom now..."

**Tom (gets notification):**
```
🚨 Emergency Request from Sarah

Sarah has a flat tire. Can you pick up Emma at 4 PM from Westfield Elementary?

Emma's Location: 456 School Lane
Your ETA: 10 minutes
Sarah's usual pickup time: 4:00 PM

[Accept & Navigate] [Can't do it] [Call Sarah]
```

**Tom taps [Accept & Navigate]**

**McCarthy to Tom:** "Great! Navigation started to Westfield Elementary. I've notified Sarah and added the pickup to your calendar. Emma's teacher has been alerted."

**McCarthy to Sarah:** "Tom is on his way to pick up Emma! ETA 10 minutes. He's accepted the request and has navigation running. Focus on getting help with your car."

**Automatic Actions:**
1. Add "Pick up Emma" to Tom's calendar at 4:00 PM
2. Update Emma's calendar: "Dad picking up today"
3. Remove "Pick up Emma" from Sarah's calendar
4. Send notification to Emma's phone: "Dad picking you up today"
5. Start navigation for Tom
6. Send follow-up to Sarah when Tom arrives at school

---

### Example 13: Text Chat During Meeting

**10:00 AM - Sarah in important client meeting**

Sarah needs McCarthy's help but can't speak. She opens McCarthy app and types:

**Sarah (typing):** "When is my next meeting after this one?"

**McCarthy (text response):** "Your next meeting is at 11:30 AM - 'Product Review with Engineering Team' in Conference Room B. You have 30 minutes between meetings."

**Sarah:** "Can you move my 2pm to tomorrow same time?"

**McCarthy:** "I found '2 PM Budget Review with Finance.' Move to tomorrow (Thursday) at 2 PM?"

**[Yes] [No] [Different time]**

**Sarah taps [Yes]**

**McCarthy:** "Done! Moved 'Budget Review with Finance' to tomorrow at 2 PM. All attendees have been notified of the change. Want me to add anything to the meeting notes?"

**Sarah:** "No thanks. Remind me to call vendor about the proposal when I leave this meeting."

**McCarthy:** "Got it. I'll remind you when you leave Conference Room A (your current location). I've created the task:

📋 Call vendor about the proposal
⏰ When you leave this meeting
📍 Location-based reminder

[View Task] [Edit]"

**Sarah:** "Perfect"

**McCarthy:** "Anything else I can help with? 😊"

**Sarah:** "That's all"

**Behind the scenes:**
- Sarah never spoke a word
- McCarthy processed everything via text
- All the same functionality as voice
- No disruption to her meeting
- Task created with location trigger
- Calendar event rescheduled
- Attendees automatically notified

---

### Example 14: Quick Actions in Text Chat

**2:30 PM - Tom receives task notification**

Tom opens McCarthy and sees:

**McCarthy:** "Sarah just assigned you a task:

📋 Pick up party supplies for Emma's birthday
📅 Due: Friday
🛒 Items needed: balloons, streamers, tablecloths

What would you like to do?"

**[Accept Task] [Ask Details] [Reschedule] [Decline]**

**Tom taps [Ask Details]**

**Tom (typing):** "Which store?"

**McCarthy:** "Sarah didn't specify a store. Based on the items needed, here are nearby options:

🪁 Party City (2.3 miles) - Has everything
🎈 Dollar Tree (1.1 miles) - Budget-friendly
🛒 Target (1.8 miles) - One-stop shop

I can add the store to the task and set a reminder when you're nearby. Which would you prefer?"

**Tom:** "Party City"

**McCarthy:** "Great choice! I've updated the task:

📋 Pick up party supplies
📍 Party City, 123 Shopping Plaza
📅 Due: Friday
🔔 I'll remind you when you're near Party City

I also added this to your shopping list. Need anything else?"

**[View Shopping List] [Get Directions] [Done]**

**Tom taps [Done]**

---

These examples demonstrate McCarthy's intelligence across all 48 features, showcasing natural voice interaction, **text chat capability**, context-awareness, proactive notifications, family coordination, location tracking, weather/traffic integration, and message sending capabilities.

---

## Conclusion

McCarthy represents a paradigm shift from reactive to proactive family assistance. By combining **natural voice interaction AND text chat** with intelligent, context-aware notifications, location tracking, weather/traffic awareness, and message sending capabilities, McCarthy eliminates the constant app-checking behavior that plagues modern families.

**Key Differentiators:**
1. **Flexible Interaction** - Voice OR text, user's choice, seamless switching
2. **Proactive AI** - McCarthy reaches out at optimal moments
3. **Context-Aware** - Notifications based on location, activity, weather, traffic
4. **Family-First** - Built for multiple members with conflict resolution
5. **Message Sending** - AI-powered SMS and email composition with user approval
6. **Privacy-First** - On-device processing where possible
7. **Comprehensive** - 48 features across 8 categories

**Technology Foundation:**
- React Native for cross-platform development
- Firebase for backend infrastructure
- OpenAI GPT-4 Turbo for conversational AI
- Native iOS/Android APIs for calendar, location, speech
- Twilio for SMS sending
- SendGrid for email sending
- OpenWeatherMap for weather data
- Google Maps for traffic data

**Ready for Development:**
- Complete technical specification
- Detailed implementation examples
- Both voice and text interaction modes fully specified
- Privacy and security architecture
- Comprehensive data models
- Real-world usage scenarios
- 48 features fully documented

**Next Steps:**
1. Review and approve specification
2. Set up development environment
3. Begin with MVP features (Core 1-3 categories)
4. Implement voice and text interfaces
5. Add location and context features
6. Launch beta testing with select families

---

**Copyright © 2025 John Hutchison. All Rights Reserved.**

This document is proprietary and confidential. Unauthorized reproduction or use is strictly prohibited.

**END OF DOCUMENT**
