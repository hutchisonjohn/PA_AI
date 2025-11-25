# McCarthy MVP v7 --- Expanded Developer Must-Haves & Full Compliance Checklist

This expanded version includes **full explanations**, **risks**,
**acceptance criteria**, and **developer confirmation requirements**. It
is designed so your developer cannot miss anything and can return a
fully completed, auditable checklist.

------------------------------------------------------------------------

# ✅ SECTION 1 --- MUST-HAVES (Critical for MVP Launch)

These are **non-negotiable**. If any one of these is missing, the MVP
will break, deliver unreliable behaviour, or require expensive rework.
Each section includes: - **What it is** - **Why it matters** - **What v7
requires** - **Risks if missing** - **Developer acceptance criteria**

------------------------------------------------------------------------

## ⭐ 1. Firebase Cloud Messaging (Push Notifications)

**What it is:** Handles all push notifications for iOS and Android.

**Why it matters:** McCarthy's core value is *proactive coordination*.
Without push notifications, reminders, prompts, and context-aware nudges
will not work.

**v7 Requirements:** - APNs key linked to Firebase - FCM config for
Android + iOS - Token storage in Firestore - Notification Cloud
Functions - Trigger tests (manual + scheduled)

**Risks if missing:** - No reminders - No proactive alerts - No family
message notifications - App loses its core identity

**Developer Acceptance Criteria:** - "Test notification" works on BOTH
platforms - FCM tokens stored correctly per user/device - Cloud Function
can target single user + group

------------------------------------------------------------------------

## ⭐ 2. Firebase Storage (Audio Notes, Images, Attachments)

**What it is:** Cloud storage for voice notes, media in chat, uploads.

**Why it matters:** Messaging, tasks, and voice-powered features depend
on this.

**v7 Requirements:** - Storage bucket created - Security rules applied -
Upload + download endpoints integrated

**Risks if missing:** - Voice notes won't save - Images fail - Chat
breaks

**Developer Acceptance Criteria:** - User can upload + play back audio -
User can upload + view images

------------------------------------------------------------------------

## ⭐ 3. Apple Developer Account + APNs Setup

**What it is:** Required to run an iOS app with notifications,
background location, and wake-word features.

**Why it matters:** iOS will silently block these features without the
correct provisioning.

**v7 Requirements:** - iOS bundle ID created - Push notification
entitlement - Background modes enabled - APNs key uploaded to Firebase

**Risks if missing:** - Notifications won't deliver on iPhones -
Geofencing fails - App rejected by App Store

**Developer Acceptance Criteria:** - iOS push notifications deliver in
\<3 seconds - Background location works after lock screen

------------------------------------------------------------------------

## ⭐ 4. Google Play Console Setup

**What it is:** Required for Android distribution, permissions, signing,
and testing.

**Why it matters:** Android will block background location unless
explicitly declared.

**v7 Requirements:** - App entry created - Google signing configured -
Background permissions added

**Risks if missing:** - Android will kill location tracking -
Notifications may be blocked

**Developer Acceptance Criteria:** - App installs through internal
testing track - Background location survives phone lock

------------------------------------------------------------------------

## ⭐ 5. Google Maps SDK + Geofencing + Distance Matrix + Traffic

**What it is:** Location awareness engine.

**Why it matters:** McCarthy uses: - "You're near Woolworths" -
Travel-time prompts - Home/work arrival reminders - Geo-context logic

**v7 Requirements:** - Maps SDK iOS - Maps SDK Android - Geofencing
API - Distance Matrix API - Traffic Layer

**Risks if missing:** - No geofencing - No location-based advice -
Broken proactive behaviour

**Developer Acceptance Criteria:** - Trigger fires when entering/leaving
geofence - Travel-time estimates appear in logs

------------------------------------------------------------------------

## ⭐ 6. Google Cloud Billing Enabled

**What it is:** Unlocks Firebase Cloud Functions + Maps APIs.

**Why it matters:** Without billing: - Cloud Functions do NOT run - Maps
API refuses requests

**v7 Requirements:** - Billing activated - APIs authorised

**Risks if missing:** - LLM won't run - Notifications won't send -
Location won't work

**Developer Acceptance Criteria:** - Cloud Functions deploy
successfully - No "billing disabled" API errors

------------------------------------------------------------------------

## ⭐ 7. Background Location Tracking

**What it is:** Core to proactive AI.

**Why it matters:** MVP uses: - Location reminders - Store proximity
prompts - Travel-time intelligence

**v7 Requirements:** - iOS: background modes - Android:
ACCESS_BACKGROUND_LOCATION - Geofence registration

**Risks if missing:** - All location-aware features fail

**Developer Acceptance Criteria:** - App detects arrival at home/work
reliably - At least one geofence tested live

------------------------------------------------------------------------

## ⭐ 8. LLM Abstraction Layer

**What it is:** Allows swapping between Llama 3.1 → GPT-4 instantly.

**Why it matters:** v7 explicitly requires this to avoid rework in V2.

**v7 Requirements:** - Unified `LLMService` class - Providers: Llama
(default), GPT-4 (stub) - Function-calling support

**Risks if missing:** - Full rewrite when improving AI model

**Developer Acceptance Criteria:** - Changing one config variable
switches provider

------------------------------------------------------------------------

## ⭐ 9. External Messaging Abstraction Layer

**What it is:** MVP uses native SMS. V2 uses Twilio.

**Why it matters:** Prevents a rewrite.

**v7 Requirements:** - `ExternalMessagingService` - Native provider -
Twilio provider stub

**Risks if missing:** - V2 requires re-architecting messaging

**Developer Acceptance Criteria:** - All message sending uses
abstraction only

------------------------------------------------------------------------

## ⭐ 10. Full v7 Database Schema

**What it is:** A future-proof structure preventing costly migrations.

**Why it matters:** v7 avoids breaking changes in V2/V3.

**v7 Requirements include:** - Users: `groupIds[]`, `defaultGroupId`,
`currency`, `locale` - Groups: `adminIds`, `settings{}`, `pollIds[]`,
`projectIds[]` - Messages: `parentGroupId`, `threadId` - Tasks:
`groupId` - Lists: `isDefault`

**Risks if missing:** - Future groups, polls, threads require migrations

**Developer Acceptance Criteria:** - Schema matches spec exactly - Empty
V2 fields included

------------------------------------------------------------------------

# 🧩 SECTION 2 --- FULL 14-ITEM COMPLIANCE CHECKLIST

Each item must be ticked off with notes.

1.  **Firebase Cloud Messaging** --- Push system fully configured.
2.  **Firebase Storage** --- Media handling complete.
3.  **Apple Developer + APNs** --- iOS push + background.
4.  **Google Play Console** --- Android provisioning.
5.  **Google Maps SDK + Geofencing** --- Location intelligence online.
6.  **Google Cloud Billing** --- Functions + Maps enabled.
7.  **Background Location Tracking** --- Reliable across devices.
8.  **Environment Variables** --- `.env` system stable.
9.  **LLM Abstraction Layer** --- Provider-swappable.
10. **External Messaging Layer** --- Native & Twilio paths.
11. **i18n Framework** --- All strings externalised.
12. **Full v7 Schema** --- All fields implemented.
13. **Feature Flags** --- All V2/V3 toggles ready.
14. **Scheduled Cloud Functions** --- Reminder engine functioning.

------------------------------------------------------------------------

# 📝 Developer Response Section

Complete all items before starting build.

  Item   Requirement                    Completed (Yes/No)   Notes
  ------ ------------------------------ -------------------- -------
  1      Firebase Cloud Messaging                            
  2      Firebase Storage                                    
  3      Apple Developer / APNs                              
  4      Google Play Console                                 
  5      Google Maps SDK / Geofencing                        
  6      Google Cloud Billing                                
  7      Background Location                                 
  8      Environment Variables                               
  9      LLM Abstraction Layer                               
  10     External Messaging Layer                            
  11     i18n                                                
  12     Full v7 Schema                                      
  13     Feature Flags                                       
  14     Scheduled Cloud Functions                           

------------------------------------------------------------------------

# ✔️ Instructions for Developer

Return this completed checklist before coding begins. If any item cannot
be completed, provide: - The reason - The dependency blocking it - The
ETA for resolution
