# McCarthy PA AI Agent - Full Developer Specifications v7
## Comprehensive Technical Implementation Guide

**Copyright © 2025 John Hutchison. All Rights Reserved.**  
This document and all associated materials are proprietary and confidential.

**Document Version:** 7.0  
**Last Updated:** November 10, 2025  
**Target Platforms:** iOS & Android  
**Development Framework:** React Native 0.76+  
**Target Market:** Australian families (MVP 1)  
**Timeline:** 12 weeks

---

## 🎯 What's New in v7

This document incorporates **critical architectural fixes** identified in the Architecture Foundation Review to prevent expensive rebuilds in V2/V3:

### Key Changes from v6:

**Database Schema Updates:**
- ❌ Removed: `familyGroupId` (hardcoded family concept)
- ✅ Added: `groupIds[]` array, `defaultGroupId` (supports multiple groups)
- ✅ Added: `currency`, `locale`, `defaultShoppingListId` to users
- ✅ Added: `adminIds`, `pollIds[]`, `projectIds[]`, `privateThreadIds[]`, `settings{}` to groups
- ✅ Added: `parentGroupId`, `threadId` to messages (null for MVP)
- ✅ Added: `groupId` to tasks (null = personal task)
- ✅ Added: `isDefault` to shopping lists

**Code Architecture Additions:**
- ✅ External messaging abstraction layer (native → Twilio swappable)
- ✅ Feature flags system (enable/disable features without code changes)
- ✅ i18n setup (all strings via translation keys, even if English-only for MVP)
- ✅ LLM abstraction layer (already in v6, maintained in v7)

**Core Principle:** "Design for V3, implement for MVP"
- Don't BUILD V2/V3 features now
- DO design architecture to SUPPORT them
- Prevents data migrations and code rewrites

---

## Executive Summary

McCarthy is a **voice + text AI personal assistant** designed for busy Australian families, with a key differentiator: **proactive, context-aware coordination** that reaches out at optimal moments rather than requiring users to actively check apps.

### MVP 1 Focus: Australian Market

**Why Australian focus:**
- Testing with Australian families (product owner based in Australia)
- Validates core experience before international expansion
- Simpler scope = achievable in 12 weeks
- Much lower operational costs ($80-370/month target)
- Global features move to V2/V3

**Dual Interaction Modes:**
- **Voice:** Wake word activation ("Hey McCarthy"), natural speech recognition, voice responses
- **Text:** Full-featured text chat interface for quiet environments, meetings, or user preference
- **Seamless switching:** Users can move between voice and text in the same conversation

### Core Value Proposition

**"Stop checking apps. Let McCarthy check on you."**

McCarthy learns family patterns and proactively reaches out at optimal moments based on:
- User location (GPS tracking with geofencing)
- User's configured time zone (AEST, ACST, AWST)
- Safe times / Do Not Disturb preferences
- Time of day and calendar context
- Historical behavior patterns

### MVP 1 Core Capabilities

**Personal Assistant:**
- Voice and text interaction
- Task management and reminders (8 sub-features)
- Calendar integration (6 sub-features)
- Shopping lists (5 sub-features)
- Voice notes (4 sub-features)
- Location awareness (4 sub-features)

**Family Coordination:**
- One family group (in-app messaging - 6 sub-features)
- Basic message coordination
- External messaging for non-McCarthy contacts (native intents)

**Context Intelligence:**
- Time zone awareness (Australian time zones)
- Safe times / Do Not Disturb mode
- Location-based notifications
- Weather and traffic context

### Technology Stack

**Cost-Optimized Approach:**
- **AI/LLM:** Llama 3.1 via Replicate (with easy GPT-4 upgrade path)
- **Backend:** Firebase (Authentication, Firestore, Cloud Functions, Storage)
- **Frontend:** React Native 0.76+ (iOS + Android)
- **Voice:** React Native Voice, TTS
- **External messaging:** Native intents (MVP), Twilio abstraction ready (V2)
- **Maps:** Google Maps (geofencing, traffic)
- **Calendar:** Native calendar APIs
- **Target cost:** $80-370/month for 100 families

### What's NOT in MVP 1 (V2/V3 Features)

**V2 Features:**
- Multiple custom groups (soccer team, school, etc.)
- Polls and voting systems
- Private threads (Secret Santa coordination)
- Automated external messaging (Twilio/SendGrid)
- Shopping integration (product search, price comparison)
- Complex project management

**V3 Features:**
- Multi-country families (translation, currency conversion)
- International time zones beyond Australia
- Advanced AI features (predictive scheduling)
- Third-party integrations (Uber, food delivery)

**Note:** Architecture is designed to support these features without data migrations or rewrites.

---

## Table of Contents

### Part 1: Foundation
1. Product Vision & Core Architecture
2. Target Market (Australian Families)
3. Architectural Patterns & Principles (NEW in v7)
4. Feature Flags System (NEW in v7)
5. Internationalization Setup (NEW in v7)

### Part 2: Core Features
6. Voice & Text Interaction System
7. Task & Reminder System (8 sub-features)
8. Calendar Management (6 sub-features)
9. Shopping Lists (5 sub-features)
10. Voice Notes (4 sub-features)
11. Family Messaging (6 sub-features)
12. Location & Context System (4 sub-features)

### Part 3: Technical Implementation
13. Time Zone & Safe Times System
14. Notification System
15. External Messaging Abstraction Layer (NEW in v7)
16. LLM Service Implementation
17. Privacy & Security
18. Data Models (UPDATED in v7)
19. API Specifications
20. Error Handling & Resilience

### Part 4: Development
21. Development Environment Setup
22. Development Roadmap (12 weeks)
23. Testing Strategy
24. Deployment & DevOps
25. Monitoring & Analytics
26. Cost Analysis & Optimization

### Part 5: Appendices
27. Code Examples & Patterns
28. Database Schema Migration Guide (v6 → v7)
29. Common Pitfalls & Solutions
30. V2/V3 Extension Guide

---

## 1. Product Vision & Core Architecture

### 1.1 The Problem

Modern Australian families juggle:
- Multiple calendars across family members
- Scattered shopping lists across apps and paper
- Reminder overload from multiple sources
- Constant app-checking ("Did I miss anything?")
- Different time zones (AEST, ACST, AWST) when family spread across states
- Work-life coordination challenges
- Mental load of remembering everything for everyone

Existing solutions are **reactive** - they wait for users to open apps. Users must remember to check calendars, shopping lists, task managers, and family chats.

### 1.2 McCarthy's Solution

**Proactive coordination + flexible interaction**

Users can choose voice, text, or both based on their situation:
- **Voice Mode:** Perfect for hands-free moments (driving, cooking, multitasking)
- **Text Mode:** Ideal for meetings, quiet environments, or personal preference
- **Both:** Seamlessly switch between modes in the same conversation

McCarthy doesn't wait to be opened. It reaches out proactively:
- "You asked me to remind you to call Tom at 3 PM. You're free now - should I open the phone app?"
- "You're 5 minutes from the supermarket. Want to check the shopping list before you go in?"
- "Sarah just asked about dinner plans in the family chat. You're out of your meeting now - should I tell her?"

### 1.3 Key Innovation: Time & Context Awareness

McCarthy respects each user's:

1. **Time zone:** AEST (Sydney/Melbourne), ACST (Adelaide), AWST (Perth)
   - User configures their zone on signup
   - All times displayed in user's local time
   - Notifications delivered in user's local time
   - "8 AM reminder" = 8 AM user's time (not UTC)

2. **Safe times:** User-configured quiet hours (e.g., 10 PM - 7 AM)
   - Non-urgent notifications held until safe time starts
   - Urgent notifications can override (user configurable)
   - Different safe times per day of week

3. **Location context:** Home, work, traveling
   - Location-based reminders ("remind me when I get home")
   - Context-aware notifications ("You're near the grocery store...")
   - Traffic and travel time estimates

4. **Calendar context:** In meeting, free, commuting
   - Won't interrupt during meetings (unless urgent)
   - Suggests best times for tasks
   - Integrates with phone calendar

5. **Historical patterns:** Best times to reach user
   - Learns when user typically responds
   - Adjusts notification timing
   - Respects user habits

### 1.4 Primary Communication: In-App Messaging

**Architecture principle:** In-app messaging is PRIMARY, not SMS/WhatsApp.

**Why:**
- **Much cheaper:** Firebase messaging vs SMS costs (pennies vs dollars)
- **Better UX:** Everything in one app, not scattered across SMS/WhatsApp/email
- **McCarthy can participate:** AI can see messages, suggest responses, coordinate
- **Network effects:** Families invite families, growing user base organically
- **Real-time:** Instant delivery, read receipts, typing indicators
- **Rich content:** Images, voice notes, locations, not just text

**External messaging (SMS/email):**
- Only for people NOT on McCarthy (external contacts)
- User manually sends via native intents (MVP)
- Example: "McCarthy, text Tom to bring dessert" → Opens native SMS app with draft
- Twilio/SendGrid automated sending in V2 (abstraction layer ready)

### 1.5 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT NATIVE APP                         │
│                   (iOS + Android)                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Voice     │  │     Text     │  │   Feature       │  │
│  │   Input     │  │     Chat     │  │   Flags         │  │
│  │   (Wake     │  │   Interface  │  │   System        │  │
│  │   Word)     │  │              │  │                 │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │          ABSTRACTION LAYERS (NEW in v7)             │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  • LLM Service (Llama ↔ GPT-4 swappable)          │  │
│  │  • External Messaging (Native ↔ Twilio swappable) │  │
│  │  • i18n Service (English only, ready for multi)    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE BACKEND                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Firestore   │  │    Cloud     │  │    Storage   │    │
│  │  (Database)  │  │  Functions   │  │   (Images,   │    │
│  │              │  │  (Backend    │  │    Audio)    │    │
│  │  • Users     │  │   Logic)     │  │              │    │
│  │  • Groups    │  │              │  │              │    │
│  │  • Messages  │  │  • LLM AI    │  │              │    │
│  │  • Tasks     │  │  • Context   │  │              │    │
│  │  • Calendar  │  │  • Notifs    │  │              │    │
│  │  • Lists     │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Llama 3.1   │  │    Google    │  │   Native     │    │
│  │  (Replicate) │  │     Maps     │  │   Calendar   │    │
│  │              │  │  (Location,  │  │     API      │    │
│  │  AI/LLM      │  │   Traffic,   │  │              │    │
│  │  Service     │  │   Weather)   │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │   Native     │  │   Push       │                       │
│  │   SMS/Email  │  │   Notifs     │                       │
│  │   Intents    │  │   (FCM/APNS) │                       │
│  │  (MVP)       │  │              │                       │
│  └──────────────┘  └──────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.6 Core Data Flow Example

**Scenario:** User asks McCarthy to remind them to call Tom at 3 PM

```
1. User (Voice or Text): "Remind me to call Tom at 3 PM"
   ↓
2. React Native App captures input
   ↓
3. Sends to Cloud Function (processUserMessage)
   ↓
4. Cloud Function calls LLM Service
   ↓
5. LLM Service (abstraction layer) → Llama 3.1 via Replicate
   ↓
6. Llama extracts: { action: "create_reminder", task: "call Tom", time: "15:00" }
   ↓
7. Cloud Function:
   - Converts "3 PM" to user's time zone (if AEST user, stores as UTC)
   - Creates task in Firestore
   - Schedules notification
   ↓
8. McCarthy confirms: "I'll remind you to call Tom at 3 PM"
   ↓
9. At 3 PM (user's local time):
   - Cloud Function triggers notification
   - Checks user's calendar (in meeting?)
   - Checks user's location (driving?)
   - Checks safe times (quiet hours?)
   ↓
10. If context is good:
    - Sends push notification
    - "It's time to call Tom. You're free now - should I open the phone app?"
```

### 1.7 Technology Philosophy

**"Start cheap, upgrade if needed"**

**AI/LLM:**
- Start: Llama 3.1 (Replicate) - $0.05-0.20 per 1M tokens
- Upgrade path: GPT-4 if Llama insufficient - via abstraction layer
- Decision point: If >20% of users report poor AI quality

**Backend:**
- Firebase (free tier covers dev, $25-50/month for 100 families)
- Generous free quotas (50K reads/day, 20K writes/day)
- Scales automatically if we grow

**External Messaging:**
- MVP: Native intents (free, user manually sends)
- V2: Twilio ($0.08-0.10 per SMS if automated) - via abstraction layer

**Voice:**
- Native device speech recognition (free)
- Native device TTS (free)
- Fallback to Web Speech API if native unavailable

**Maps/Location:**
- Google Maps (generous free tier)
- $200 free credit/month
- Covers geofencing, traffic, weather for 100 families

### 1.8 Deployment Strategy

**Phase 1: MVP Development (Weeks 1-12)**
- iOS + Android simultaneous development
- Test with 5-10 alpha families (product owner's network)
- Focus on core personal assistant features
- In-app messaging only (single family group)

**Phase 2: Beta Launch (Month 4)**
- Invite 50-100 Australian families
- Monitor costs, performance, AI quality
- Gather feedback, iterate
- Decide: Keep Llama 3.1 or upgrade to GPT-4?

**Phase 3: Public Launch (Month 5-6)**
- Launch on App Store / Play Store (Australian market)
- Target 100-500 families by end of Month 6
- Scale infrastructure if needed
- Plan V2 based on usage patterns

**Phase 4: V2 Development (Month 7-12)**
- If MVP successful (90%+ retention, positive feedback):
- Add multiple groups, polls, private threads
- Implement Twilio automated messaging
- Add shopping integration
- Expand feature set

**Phase 5: V3 International (Year 2)**
- If V2 successful:
- Multi-country support (translation, currency)
- International time zones
- Global expansion

---

## 2. Target Market (Australian Families)

### 2.1 MVP 1 Primary Target Users

**1. Working Parents (Primary Target)**

Profile:
- Both parents working, 1-2+ kids
- Ages: 30-50
- Juggling work/kids/household
- May live in different Australian states (time zone coordination needed)
- Tech-savvy (comfortable with apps)

Pain Points:
- Mental load: "I have to remember everything for everyone"
- Coordination: "Did I tell my partner about soccer practice?"
- App fatigue: "I check 5 apps just to stay organized"
- Time zones: "What time is it in Perth? Can I call now?"

Value Proposition:
- Reduce mental load (McCarthy remembers everything)
- Proactive coordination ("You're near the store, want to check the list?")
- One app for family communication + personal tasks
- Time zone aware ("Remind me at 8 AM" = 8 AM their time, even if partner in different state)

**2. Busy Professionals with Families**

Profile:
- Career-focused with family responsibilities
- Travel for work (domestic Australia)
- Ages: 35-55
- High household income
- Need: Stay connected with family when traveling

Pain Points:
- Missing family events while traveling
- Forgetting commitments when busy
- Different time zones when traveling for work
- Communication gaps with family

Value Proposition:
- Stay connected while traveling
- Automated reminders don't depend on checking apps
- Family messaging keeps conversations in one place
- Time zone aware (family sees messages at appropriate times)

**3. Multi-Generational Families**

Profile:
- Parents + teenagers
- May coordinate with grandparents
- Spread across Australian states (Sydney, Melbourne, Perth, Adelaide)
- Ages: 25-70 (wide range)

Pain Points:
- Time zone confusion ("Did I wake Mum calling her in Perth?")
- Keeping everyone in the loop
- Managing multiple group chats
- Remembering who's been told what

Value Proposition:
- One family group for all coordination
- Safe times prevent late-night disturbances
- Location awareness (traffic alerts for pickups)
- Voice option (grandparents may prefer voice to typing)

### 2.2 Common Pain Points (Australian Context)

**Time Zone Confusion:**
- Australia has 3 main time zones (AEST, ACST, AWST)
- During daylight saving (Oct-Apr): Even more complex
  - AEDT (Sydney): UTC+11
  - ACDT (Adelaide): UTC+10:30
  - AWST (Perth): UTC+8 (no daylight saving)
- Users often unsure: "What time is it there? Can I call now?"

**Mental Load:**
- Women in Australia report carrying 70%+ of mental load
- "I have to remember everything for the kids, my partner, the household"
- Multiple apps to check (calendar, reminders, shopping, messages)
- Constant "Did I forget something?" anxiety

**App Fatigue:**
- Average family uses:
  - 2-3 calendar apps
  - 2+ shopping list apps (paper lists too)
  - 3+ messaging apps (SMS, WhatsApp, Facebook)
  - 1-2 task managers
- Users: "I'm tired of checking everything"

**Coordination Overhead:**
- Family group chats get messy
- Important messages buried in chatter
- Have to read entire thread to catch up
- No way to track "who's bringing what" or "who's doing what"

**Distance:**
- 86% of Australians live in urban areas
- But families often spread across states
- Sydney to Perth = 4,000 km (2,500 miles)
- Coordination requires time zone awareness

### 2.3 User Personas

**Persona 1: Sarah (Primary User)**

- Age: 38
- Location: Sydney (AEST/AEDT)
- Family: Married (partner Tom), 2 kids (ages 8, 12)
- Work: Full-time marketing manager
- Tech: iPhone, uses multiple apps, comfortable with AI

Day in the Life:
- 7 AM: Checks phone, has 20 notifications across 5 apps
- 8:30 AM: Commuting, remembers she forgot to add milk to shopping list
- 11 AM: In meeting, misses Tom's text about dinner plans
- 3 PM: Forgot to remind son about soccer practice
- 6 PM: At grocery store, can't remember if she already has pasta sauce
- 9 PM: Remembers she was supposed to call her mum (in Perth) but it's 11 PM there now

How McCarthy Helps:
- 7:30 AM: "Sarah, you have a meeting at 9 AM. Traffic is heavy - leave by 8:20"
- 8:35 AM (during commute): "You mentioned needing milk. Should I add it to the shopping list?"
- 11:30 AM (after meeting): "Tom asked about dinner in the family chat. Want me to tell him you'll be home by 6?"
- 2:30 PM: "Reminder: Soccer practice at 4 PM. You're free now - should I text the coach?"
- 5:45 PM (approaching store): "You're near Woolworths. Want to check the shopping list?"
- 3 PM (next day): "It's 3 PM your time, 1 PM in Perth. Good time to call your mum?"

**Persona 2: Tom (Secondary User)**

- Age: 40
- Location: Sydney (AEST/AEDT), travels to Melbourne often for work
- Family: Married (partner Sarah), 2 kids (ages 8, 12)
- Work: Sales manager, travels weekly
- Tech: Android, prefers simple tools

Day in the Life:
- Travels to Melbourne (same time zone, usually)
- Forgets to check family calendar before booking trips
- Misses important family events because he's traveling
- Has trouble coordinating dinner/pickup when traveling
- Wants to help but "I don't know what needs doing"

How McCarthy Helps:
- "Tom, you have a meeting in Melbourne on Thursday. Sarah's kids have soccer that night - should I let her know you can't do pickup?"
- "You're in Melbourne for 2 nights. Want me to check with Sarah about grocery shopping while you're gone?"
- "Family task list shows: Take bins out Wednesday, Sarah's birthday gift needed. You free Saturday?"
- Voice option: Can talk to McCarthy hands-free while driving

**Persona 3: Emma (Teenager)**

- Age: 15
- Location: Sydney (AEST/AEDT)
- Family: Lives with parents (Sarah + Tom), younger brother
- School: Year 10
- Tech: iPhone, social media native, uses 20+ apps

Day in the Life:
- Forgets homework deadlines
- Loses track of family plans ("Wait, we're going WHERE this weekend?")
- Parents complain: "She never reads the family group chat"
- Wants independence but needs reminders

How McCarthy Helps:
- "Emma, your assignment is due Friday. You have 2 days left - want to schedule work time?"
- "Your mum asked who's free for dinner Saturday. Want to check your plans?"
- "You asked me to remind you when your friend posts on Instagram. Want to check now?"
- Voice option: Can use McCarthy without opening app (hands-free while studying)

### 2.4 Australian Market Specifics

**Language:**
- English only (MVP)
- Australian spelling (colour not color, organise not organize)
- Australian expressions ("arvo", "brekkie", "servo")
- McCarthy uses casual, friendly Australian tone

**Currency:**
- AUD (Australian Dollar)
- Prices shown as $X.XX AUD
- No currency conversion needed (MVP)

**Time Zones:**
- AEST (Australian Eastern Standard Time): UTC+10 (Sydney, Melbourne, Brisbane)
- AEDT (Australian Eastern Daylight Time): UTC+11 (Oct-Apr, Sydney, Melbourne)
- ACST (Australian Central Standard Time): UTC+9:30 (Adelaide)
- ACDT (Australian Central Daylight Time): UTC+10:30 (Oct-Apr, Adelaide)
- AWST (Australian Western Standard Time): UTC+8 (Perth - no daylight saving)

**Holidays:**
- Australia Day (Jan 26)
- Anzac Day (Apr 25)
- Queen's Birthday (varies by state)
- Christmas / New Year
- State-specific public holidays

**Shopping:**
- Major supermarkets: Woolworths, Coles, Aldi, IGA
- Shopping lists use Australian product names
- McCarthy can suggest nearby stores (using Google Maps)

**Traffic/Commute:**
- Major cities: Sydney, Melbourne, Brisbane, Perth, Adelaide
- Peak traffic: 7-9 AM, 5-7 PM
- McCarthy uses Google Maps traffic data
- "You're 15 minutes from home, traffic is clear"

### 2.5 V2 Markets (Future Expansion)

**Not included in MVP, but architecture supports:**

- **International families:** Multi-country, translation, currency conversion
- **Co-parents:** Cross-household coordination (separated/divorced parents)
- **Extended family groups:** Multiple households (grandparents, aunts/uncles)
- **Community groups:** Soccer teams, schools, book clubs (multiple groups feature)
- **Business travelers:** International time zones, travel coordination

---

## 3. Architectural Patterns & Principles (NEW in v7)

### 3.1 Core Principle: "Design for V3, Implement for MVP"

**What This Means:**

Don't BUILD V2/V3 features in MVP, but DO design architecture to SUPPORT them without rewrites.

**Examples:**

| Feature | MVP (Implement) | V2/V3 (Design For) | How We Achieve This |
|---------|----------------|-------------------|---------------------|
| Groups | Single family group only | Multiple groups (soccer, school, etc.) | Use `groupIds[]` array (just populate with one ID), not `familyGroupId` string |
| External messaging | Native intents (manual) | Twilio automation | Build abstraction layer, only implement native provider |
| Translation | English only | Multi-language | Use i18n framework (only load English strings) |
| Private threads | Not available | Sub-group chats | Add `threadId`, `parentGroupId` fields (keep null in MVP) |
| Polls | Not available | Voting/polls | Add `pollIds[]` array to groups (keep empty) |
| Admin roles | Creator = admin | Complex permissions | Add `adminIds[]` array (populate with creator) |

**Why This Matters:**

If we hardcode "familyGroupId" in MVP, adding multiple groups in V2 requires:
1. Database migration (rename/remove field)
2. Update all queries referencing this field
3. Risk breaking existing users
4. Weeks of migration testing

If we use `groupIds[]` array from day one:
1. MVP just uses first element: `groupIds[0]`
2. V2 enables creating more groups (just add more IDs to array)
3. Zero database migration
4. Zero risk to existing users
5. V2 takes days, not weeks

**Cost of Doing This Right:**
- +1-2 days upfront to build abstraction layers
- Saves weeks/months in V2/V3 development
- Prevents expensive rebuilds

### 3.2 Abstraction Layer Pattern

**Definition:** Abstraction layers allow swapping implementations without changing calling code.

**When to Use:**
- When we might switch providers in future (Llama → GPT-4, native messaging → Twilio)
- When we want to enable/disable features without code changes
- When we want to test multiple implementations

**Example: External Messaging**

❌ **Bad (Tightly Coupled):**
```javascript
// All calling code directly uses native intents
async function sendMessageToExternalContact(phone, message) {
  await Linking.openURL(`sms:${phone}?body=${message}`);
}

// Problem: To add Twilio in V2, we have to:
// 1. Find every place this function is called
// 2. Add conditional logic (if Twilio enabled, do this, else do that)
// 3. Risk breaking existing functionality
// 4. Duplicate code everywhere
```

✅ **Good (Abstraction Layer):**
```javascript
// Abstraction layer
class ExternalMessagingService {
  constructor() {
    // Provider determined by env var or config
    this.provider = process.env.EXTERNAL_MSG_PROVIDER || 'native';
  }
  
  async sendSMS(recipient, message, userId) {
    // Get user approval (required for both providers)
    const approval = await this.getApproval(recipient, message, userId);
    if (!approval) return { cancelled: true };
    
    // Route to appropriate provider
    switch (this.provider) {
      case 'native':
        return await this.sendViaNativeIntent(recipient.phone, message);
      case 'twilio':
        return await this.sendViaTwilio(recipient.phone, message);
      default:
        throw new Error(`Unknown provider: ${this.provider}`);
    }
  }
  
  async sendViaNativeIntent(phone, message) {
    // MVP implementation
    const url = `sms:${phone}?body=${encodeURIComponent(message)}`;
    await Linking.openURL(url);
    return { method: 'native', status: 'opened' };
  }
  
  async sendViaTwilio(phone, message) {
    // V2 implementation (not built in MVP)
    const result = await twilioClient.messages.create({
      to: phone,
      from: process.env.TWILIO_FROM_NUMBER,
      body: message
    });
    return { method: 'twilio', status: 'sent', messageId: result.sid };
  }
  
  async getApproval(recipient, message, userId) {
    // Show confirmation dialog to user
    return new Promise((resolve) => {
      Alert.alert(
        'Send Message',
        `Send to ${recipient.name}:\n\n"${message}"`,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Send', onPress: () => resolve(true) }
        ]
      );
    });
  }
}

// Usage (same for MVP and V2)
const messagingService = new ExternalMessagingService();
await messagingService.sendSMS(recipient, message, userId);
```

**Benefits:**
- Calling code never changes
- V2 just implements Twilio provider
- Can swap providers by changing env var
- Easy to test (mock provider)
- Clean separation of concerns

### 3.3 Feature Flags Pattern

**Definition:** Feature flags allow enabling/disabling features without code changes.

**Why Use Feature Flags:**
- Enable V2 features for beta users first
- Gradual rollout (10% → 50% → 100%)
- Instant rollback if bugs found
- A/B testing (test feature with subset of users)
- Development can continue on V2 while MVP is live

**Implementation:**

```javascript
// 1. Define feature flags (config file or database)
const features = {
  // MVP features (always enabled)
  voiceInput: true,
  textChat: true,
  tasks: true,
  calendar: true,
  shoppingLists: true,
  familyMessaging: true,
  
  // V2 features (disabled in MVP, enable later)
  multipleGroups: false,
  polls: false,
  privateThreads: false,
  automatedMessaging: false,
  shoppingIntegration: false,
  
  // V3 features (disabled until V3)
  translation: false,
  currencyConversion: false,
  internationalTimezones: false
};

// 2. Feature flag service
class FeatureFlagService {
  constructor() {
    this.flags = features;
  }
  
  isEnabled(featureName) {
    return this.flags[featureName] === true;
  }
  
  async enableFeature(featureName) {
    // In V2: Store in database, broadcast to all clients
    this.flags[featureName] = true;
    await this.syncToDatabase();
  }
  
  async disableFeature(featureName) {
    this.flags[featureName] = false;
    await this.syncToDatabase();
  }
}

// 3. Usage in UI code
const featureFlags = new FeatureFlagService();

function GroupsScreen() {
  return (
    <View>
      <GroupCard group={user.defaultGroup} />
      
      {/* Only show "Create Group" button if multiple groups enabled */}
      {featureFlags.isEnabled('multipleGroups') && (
        <Button title="Create New Group" onPress={createGroup} />
      )}
    </View>
  );
}

// 4. Usage in API code
async function createPoll(groupId, pollData, userId) {
  // Check feature flag before processing
  if (!featureFlags.isEnabled('polls')) {
    return {
      success: false,
      error: 'Polls are not available yet. Coming in V2!'
    };
  }
  
  // Feature enabled, proceed with creation
  // ...
}

// 5. Usage in LLM function calling
const availableFunctions = [
  { name: 'create_task', enabled: true },
  { name: 'create_calendar_event', enabled: true },
  { name: 'add_shopping_item', enabled: true },
  
  // Only available if feature enabled
  ...(featureFlags.isEnabled('polls') ? [
    { name: 'create_poll', enabled: true }
  ] : [])
];
```

**Benefits:**
- No code changes to enable features
- Can enable for specific users (beta testing)
- Instant rollback if issues
- Gradual rollout strategy
- Development can happen in parallel

### 3.4 Never Assume Single Group Pattern

**Problem:** MVP has one family group, but V2 has multiple groups. If code assumes single group, V2 requires rewrite.

**Bad Pattern:**
```javascript
// Assumes user has one family
const familyGroup = user.familyGroupId; // ❌ Hardcoded field name
const messages = await getMessages(familyGroup);

// Assumes all tasks belong to family
const tasks = await getTasks(user.id);
// No way to specify which group the task belongs to
```

**Good Pattern:**
```javascript
// User has array of groups (even if only one in MVP)
const userGroups = user.groupIds; // ✅ Array (supports multiple)
const defaultGroup = user.defaultGroupId; // ✅ Primary group

// Get messages for a specific group
const messages = await getMessages(defaultGroup);

// Tasks can be personal OR belong to a group
const personalTasks = await getTasks(user.id, { groupId: null });
const groupTasks = await getTasks(user.id, { groupId: defaultGroup });

// In V2, user selects which group:
// const selectedGroup = userGroups[userSelectedIndex];
// const messages = await getMessages(selectedGroup);
```

**Database Schema:**
```javascript
// Users collection - GOOD
{
  userId: "user_123",
  name: "Sarah",
  groupIds: ["group_xyz789"],        // ✅ Array (only 1 in MVP, multiple in V2)
  defaultGroupId: "group_xyz789",    // ✅ Primary group
  
  // ❌ DON'T DO THIS:
  // familyGroupId: "group_xyz789"   // Assumes single family group
}

// Tasks collection - GOOD
{
  taskId: "task_123",
  userId: "user_123",
  title: "Buy milk",
  groupId: null,    // ✅ null = personal task, group ID = shared task
  // In MVP: groupId is always null OR defaultGroupId
  // In V2: groupId can be any of user's groups
}
```

**Benefits:**
- V2 adds multiple groups with zero schema changes
- Just enable UI to create more groups
- All queries already support multiple groups
- No risk to existing users

### 3.5 Time Zone Handling Pattern

**Problem:** MVP is Australian-only, but V3 is international. If code hardcodes Australian time zone checks, V3 requires rewrite.

**Bad Pattern:**
```javascript
// Hardcoded Australian checks ❌
function isAustralianTimezone(tz) {
  return tz.startsWith("Australia/");
}

if (isAustralianTimezone(user.timezone)) {
  // Handle Australian-specific logic
}

// Problem: V3 adds international time zones = rewrite all this logic
```

**Good Pattern:**
```javascript
// Use IANA timezone database and libraries ✅
import { DateTime } from 'luxon';

function getUserLocalTime(userId) {
  const user = await getUser(userId);
  // Works for ANY timezone (Australian or international)
  return DateTime.now().setZone(user.timezone);
}

function toUserLocalTime(utcTime, userTimezone) {
  // Converts UTC to user's local time (works for any timezone)
  return DateTime.fromISO(utcTime, {zone: 'utc'})
    .setZone(userTimezone);
}

function formatTimeForUser(time, userId) {
  const user = await getUser(userId);
  return time.setZone(user.timezone).toLocaleString(DateTime.TIME_SIMPLE);
}

// In MVP: Only Australian timezones in UI picker
// In V3: Add more timezones to UI picker (no code changes needed)
```

**Database Schema:**
```javascript
{
  userId: "user_123",
  timezone: "Australia/Sydney",  // ✅ IANA format (works for all countries)
  
  // ❌ DON'T DO THIS:
  // australianTimezone: "AEST"  // Only works for Australia
}
```

**UI Implementation:**
```javascript
// MVP: Only show Australian options
const timezoneOptions = [
  { label: 'Sydney/Melbourne (AEST)', value: 'Australia/Sydney' },
  { label: 'Adelaide (ACST)', value: 'Australia/Adelaide' },
  { label: 'Perth (AWST)', value: 'Australia/Perth' },
  { label: 'Brisbane (AEST)', value: 'Australia/Brisbane' },
  { label: 'Darwin (ACST)', value: 'Australia/Darwin' }
];

// V3: Add more countries to this list (no code changes)
// const timezoneOptions = [...australianOptions, ...internationalOptions];
```

**Benefits:**
- V3 adds international timezones with zero code changes
- Just update UI picker with more options
- All time zone logic already works for any timezone
- No risk to existing Australian users

### 3.6 Localization/Internationalization Pattern

**Problem:** MVP is English-only, but V3 has translation. If strings are hardcoded, V3 requires finding and replacing thousands of strings.

**Bad Pattern:**
```javascript
// Hardcoded strings in components ❌
<Text>Create a new task</Text>
<Button title="Add to Shopping List" />

// In McCarthy responses
mccarthyRespond("I've added 'buy milk' to your tasks.");

// Problem: V3 needs translation = find/replace thousands of strings
```

**Good Pattern:**
```javascript
// Setup i18n framework from day one ✅
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Initialize with English only (MVP)
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: require('./locales/en.json') }
      // V3 adds: fr, es, de, ja, etc.
    },
    lng: 'en',                 // Default language
    fallbackLng: 'en',         // Fallback if translation missing
    interpolation: {
      escapeValue: false       // React already escapes
    }
  });

// en.json (English strings)
{
  "tasks": {
    "create_new": "Create a new task",
    "mark_complete": "Mark as complete",
    "delete_task": "Delete task",
    "no_tasks": "No tasks yet"
  },
  "shopping": {
    "add_item": "Add to Shopping List",
    "empty_list": "Your shopping list is empty"
  },
  "responses": {
    "task_added": "I've added '{{taskName}}' to your tasks.",
    "task_completed": "Great! I've marked '{{taskName}}' as complete.",
    "reminder_set": "I'll remind you {{when}}."
  }
}

// Usage in components
import { useTranslation } from 'react-i18next';

function TasksScreen() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text>{t('tasks.create_new')}</Text>
      <Button title={t('shopping.add_item')} />
    </View>
  );
}

// Usage in McCarthy responses
function mccarthyRespond(key, params) {
  const message = t(key, params);
  return sendMessage(message);
}

mccarthyRespond('responses.task_added', { taskName: 'buy milk' });
// Result: "I've added 'buy milk' to your tasks."
```

**Benefits:**
- V3 adds translation by just adding new JSON files
- No code changes needed (all strings already use `t()`)
- Can test different languages without redeploying
- Easy to update strings without code changes

---

## 4. Feature Flags System (NEW in v7)

### 4.1 Overview

Feature flags allow enabling/disabling features without code deployments. Essential for:
- Gradual rollout of V2 features
- Beta testing with subset of users
- Instant rollback if issues found
- A/B testing features
- Development can continue while MVP is live

### 4.2 Implementation

**File: `/src/services/FeatureFlagService.js`**

```javascript
// Feature flag configuration
const DEFAULT_FLAGS = {
  // MVP features (always enabled)
  voiceInput: true,
  textChat: true,
  personalTasks: true,
  personalCalendar: true,
  personalShoppingLists: true,
  familyMessaging: true,
  voiceNotes: true,
  locationAwareness: true,
  safeTimes: true,
  
  // V2 features (disabled in MVP)
  multipleGroups: false,          // Multiple custom groups
  polls: false,                   // Polls and voting
  privateThreads: false,          // Private sub-group chats
  automatedMessaging: false,      // Twilio SMS automation
  shoppingIntegration: false,     // Product search, price comparison
  taskAssignment: false,          // Assign tasks to other users
  projectManagement: false,       // Complex project tracking
  
  // V3 features (disabled until V3)
  translation: false,             // Multi-language translation
  currencyConversion: false,      // Multi-currency support
  internationalTimezones: false,  // Beyond Australia
  voiceCommands: false            // Advanced voice AI
};

class FeatureFlagService {
  constructor() {
    this.flags = { ...DEFAULT_FLAGS };
    this.listeners = [];
    this.loadFromStorage();
  }
  
  /**
   * Check if a feature is enabled
   * @param {string} featureName - Name of the feature
   * @returns {boolean} - True if enabled
   */
  isEnabled(featureName) {
    if (!(featureName in this.flags)) {
      console.warn(`Unknown feature flag: ${featureName}`);
      return false;
    }
    return this.flags[featureName] === true;
  }
  
  /**
   * Enable a feature
   * @param {string} featureName - Name of the feature
   */
  async enableFeature(featureName) {
    this.flags[featureName] = true;
    await this.saveToStorage();
    await this.syncToBackend();
    this.notifyListeners(featureName, true);
  }
  
  /**
   * Disable a feature
   * @param {string} featureName - Name of the feature
   */
  async disableFeature(featureName) {
    this.flags[featureName] = false;
    await this.saveToStorage();
    await this.syncToBackend();
    this.notifyListeners(featureName, false);
  }
  
  /**
   * Get all feature flags
   * @returns {object} - All flags
   */
  getAllFlags() {
    return { ...this.flags };
  }
  
  /**
   * Load flags from local storage (on app startup)
   */
  async loadFromStorage() {
    try {
      const stored = await AsyncStorage.getItem('feature_flags');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.flags = { ...DEFAULT_FLAGS, ...parsed };
      }
    } catch (error) {
      console.error('Error loading feature flags:', error);
    }
  }
  
  /**
   * Save flags to local storage
   */
  async saveToStorage() {
    try {
      await AsyncStorage.setItem('feature_flags', JSON.stringify(this.flags));
    } catch (error) {
      console.error('Error saving feature flags:', error);
    }
  }
  
  /**
   * Sync flags with backend (so admin can control remotely)
   */
  async syncToBackend() {
    try {
      // In V2: Send to Cloud Function to update Firestore
      // For MVP: Just local storage is fine
      const response = await fetch(`${API_URL}/feature-flags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.flags)
      });
      
      if (response.ok) {
        const serverFlags = await response.json();
        this.flags = { ...DEFAULT_FLAGS, ...serverFlags };
        await this.saveToStorage();
      }
    } catch (error) {
      console.error('Error syncing feature flags:', error);
    }
  }
  
  /**
   * Subscribe to feature flag changes
   * @param {function} callback - Called when flags change
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  /**
   * Notify listeners of flag changes
   */
  notifyListeners(featureName, enabled) {
    this.listeners.forEach(callback => {
      callback(featureName, enabled);
    });
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagService();
```

### 4.3 Usage Examples

**UI Components:**

```javascript
import { featureFlags } from '../services/FeatureFlagService';

function GroupsScreen() {
  const userGroups = user.groupIds;
  const defaultGroup = user.defaultGroupId;
  
  return (
    <View>
      {/* Always show default group */}
      <GroupCard group={defaultGroup} />
      
      {/* Only show "Create Group" if multiple groups enabled */}
      {featureFlags.isEnabled('multipleGroups') && (
        <Button 
          title="Create New Group" 
          onPress={handleCreateGroup} 
        />
      )}
      
      {/* Only show polls if enabled */}
      {featureFlags.isEnabled('polls') && (
        <Button 
          title="Create Poll" 
          onPress={handleCreatePoll} 
        />
      )}
    </View>
  );
}

function MessagingScreen({ groupId }) {
  return (
    <View>
      <MessagesList groupId={groupId} />
      
      {/* Only show "Create Private Thread" if enabled */}
      {featureFlags.isEnabled('privateThreads') && (
        <Button 
          title="Start Private Thread" 
          onPress={handleCreateThread} 
        />
      )}
    </View>
  );
}
```

**API/Cloud Functions:**

```javascript
// File: /functions/createPoll.js
const { featureFlags } = require('./services/FeatureFlagService');

exports.createPoll = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }
  
  // Check feature flag
  if (!featureFlags.isEnabled('polls')) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Polls are not available yet. Coming soon in V2!'
    );
  }
  
  // Feature enabled, proceed with poll creation
  const { groupId, question, options } = data;
  
  // Validate inputs
  if (!groupId || !question || !options || options.length < 2) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid poll data'
    );
  }
  
  // Create poll in Firestore
  const pollRef = db.collection('polls').doc();
  await pollRef.set({
    pollId: pollRef.id,
    groupId,
    question,
    options,
    createdBy: context.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    votes: {},
    status: 'active'
  });
  
  // Add poll to group's pollIds array
  await db.collection('groups').doc(groupId).update({
    pollIds: admin.firestore.FieldValue.arrayUnion(pollRef.id)
  });
  
  return { success: true, pollId: pollRef.id };
});
```

**LLM Function Calling:**

```javascript
// File: /services/LLMService.js

class LLMService {
  // ...
  
  getAvailableFunctions() {
    // Base functions (always available)
    const functions = [
      {
        name: 'create_task',
        description: 'Create a new task or reminder',
        parameters: { /* ... */ }
      },
      {
        name: 'add_shopping_item',
        description: 'Add item to shopping list',
        parameters: { /* ... */ }
      },
      {
        name: 'create_calendar_event',
        description: 'Create calendar event',
        parameters: { /* ... */ }
      }
    ];
    
    // Conditionally add V2 functions if enabled
    if (featureFlags.isEnabled('polls')) {
      functions.push({
        name: 'create_poll',
        description: 'Create a poll for group voting',
        parameters: {
          type: 'object',
          properties: {
            groupId: { type: 'string' },
            question: { type: 'string' },
            options: { type: 'array', items: { type: 'string' } }
          },
          required: ['groupId', 'question', 'options']
        }
      });
    }
    
    if (featureFlags.isEnabled('projectManagement')) {
      functions.push({
        name: 'create_project',
        description: 'Create a project with milestones',
        parameters: { /* ... */ }
      });
    }
    
    return functions;
  }
}
```

### 4.4 Admin Dashboard (V2)

In V2, add admin dashboard to control feature flags remotely:

```javascript
// File: /admin/FeatureFlagsAdmin.js

function FeatureFlagsAdmin() {
  const [flags, setFlags] = useState({});
  
  useEffect(() => {
    // Load current flags from backend
    loadFlags();
  }, []);
  
  async function loadFlags() {
    const response = await fetch('/api/admin/feature-flags');
    const data = await response.json();
    setFlags(data);
  }
  
  async function toggleFlag(flagName) {
    const newValue = !flags[flagName];
    
    // Update backend
    await fetch('/api/admin/feature-flags', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [flagName]: newValue })
    });
    
    // Update local state
    setFlags({ ...flags, [flagName]: newValue });
    
    // Broadcast to all connected clients (via WebSocket or FCM)
    broadcastFlagChange(flagName, newValue);
  }
  
  return (
    <div>
      <h1>Feature Flags</h1>
      
      <h2>MVP Features (Always Enabled)</h2>
      {Object.entries(flags).filter(([k, v]) => v === true).map(([key, value]) => (
        <div key={key}>
          <label>{key}: </label>
          <input 
            type="checkbox" 
            checked={value} 
            disabled 
          />
        </div>
      ))}
      
      <h2>V2 Features (Toggle to Enable)</h2>
      {Object.entries(flags).filter(([k, v]) => v === false).map(([key, value]) => (
        <div key={key}>
          <label>{key}: </label>
          <input 
            type="checkbox" 
            checked={value} 
            onChange={() => toggleFlag(key)} 
          />
        </div>
      ))}
    </div>
  );
}
```

### 4.5 Gradual Rollout Strategy

**Example: Enabling Polls for Beta Users**

```javascript
// File: /services/FeatureFlagService.js (extended)

class FeatureFlagService {
  // ...
  
  /**
   * Check if feature is enabled for specific user
   * @param {string} featureName - Name of the feature
   * @param {string} userId - User ID
   * @returns {boolean} - True if enabled for this user
   */
  async isEnabledForUser(featureName, userId) {
    // If globally enabled, return true
    if (this.isEnabled(featureName)) {
      return true;
    }
    
    // Check if user is in beta group
    const userFlags = await this.getUserFlags(userId);
    return userFlags[featureName] === true;
  }
  
  /**
   * Get user-specific flags from backend
   */
  async getUserFlags(userId) {
    try {
      const doc = await db.collection('user_feature_flags').doc(userId).get();
      return doc.exists ? doc.data() : {};
    } catch (error) {
      console.error('Error loading user flags:', error);
      return {};
    }
  }
  
  /**
   * Enable feature for specific users (beta testing)
   * @param {string} featureName - Name of the feature
   * @param {string[]} userIds - Array of user IDs
   */
  async enableForUsers(featureName, userIds) {
    const batch = db.batch();
    
    userIds.forEach(userId => {
      const ref = db.collection('user_feature_flags').doc(userId);
      batch.set(ref, { [featureName]: true }, { merge: true });
    });
    
    await batch.commit();
  }
}

// Usage: Enable polls for 10 beta users
await featureFlags.enableForUsers('polls', [
  'user_123', 'user_456', 'user_789', /* ... */
]);

// In UI code:
if (await featureFlags.isEnabledForUser('polls', currentUser.userId)) {
  // Show poll creation button
}
```

### 4.6 Testing with Feature Flags

```javascript
// File: /__tests__/FeatureFlagService.test.js

describe('FeatureFlagService', () => {
  let service;
  
  beforeEach(() => {
    service = new FeatureFlagService();
  });
  
  test('MVP features are enabled by default', () => {
    expect(service.isEnabled('voiceInput')).toBe(true);
    expect(service.isEnabled('textChat')).toBe(true);
    expect(service.isEnabled('personalTasks')).toBe(true);
  });
  
  test('V2 features are disabled by default', () => {
    expect(service.isEnabled('multipleGroups')).toBe(false);
    expect(service.isEnabled('polls')).toBe(false);
    expect(service.isEnabled('privateThreads')).toBe(false);
  });
  
  test('Can enable and disable features', async () => {
    await service.enableFeature('polls');
    expect(service.isEnabled('polls')).toBe(true);
    
    await service.disableFeature('polls');
    expect(service.isEnabled('polls')).toBe(false);
  });
  
  test('Returns false for unknown features', () => {
    expect(service.isEnabled('unknownFeature')).toBe(false);
  });
});
```

---

## 5. Internationalization Setup (NEW in v7)

### 5.1 Overview

Even though MVP is English-only (Australian market), we set up i18n framework now to prevent V3 requiring thousands of string replacements.

**Benefits:**
- V3 adds translation by just adding new JSON files
- No code changes needed (all strings already use `t()`)
- Can test different languages without redeploying app
- Easy to update strings without changing code

### 5.2 Installation & Setup

**Install Dependencies:**
```bash
npm install i18next react-i18next
# or
yarn add i18next react-i18next
```

**Initialize i18n:**

File: `/src/i18n/config.js`

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import en from './locales/en.json';
// V3 adds: import fr from './locales/fr.json';
// V3 adds: import es from './locales/es.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en }
      // V3 adds more languages:
      // fr: { translation: fr },
      // es: { translation: es }
    },
    lng: 'en',                   // Default language (MVP: always English)
    fallbackLng: 'en',           // Fallback if translation missing
    interpolation: {
      escapeValue: false         // React already escapes values
    },
    react: {
      useSuspense: false         // Disable suspense for React Native
    }
  });

export default i18n;
```

**Initialize in App:**

File: `/App.js`

```javascript
import React from 'react';
import './i18n/config';  // Initialize i18n before rendering
import { NavigationContainer } from '@react-navigation/native';
// ... rest of app

export default function App() {
  return (
    <NavigationContainer>
      {/* ... */}
    </NavigationContainer>
  );
}
```

### 5.3 Translation Files

**File: `/src/i18n/locales/en.json`**

```json
{
  "common": {
    "app_name": "McCarthy",
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try Again",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "done": "Done",
    "back": "Back",
    "next": "Next",
    "skip": "Skip",
    "yes": "Yes",
    "no": "No",
    "ok": "OK"
  },
  
  "auth": {
    "welcome": "Welcome to McCarthy",
    "sign_in": "Sign In",
    "sign_up": "Sign Up",
    "email": "Email",
    "password": "Password",
    "forgot_password": "Forgot Password?",
    "create_account": "Create Account",
    "already_have_account": "Already have an account? Sign In"
  },
  
  "tasks": {
    "title": "Tasks",
    "create_new": "Create Task",
    "no_tasks": "No tasks yet",
    "mark_complete": "Mark as Complete",
    "delete_task": "Delete Task",
    "edit_task": "Edit Task",
    "task_details": "Task Details",
    "due_date": "Due Date",
    "priority": "Priority",
    "priority_high": "High",
    "priority_medium": "Medium",
    "priority_low": "Low",
    "recurring": "Recurring",
    "location_based": "Location-based",
    "completed_tasks": "Completed Tasks",
    "overdue_tasks": "Overdue Tasks"
  },
  
  "calendar": {
    "title": "Calendar",
    "create_event": "Create Event",
    "no_events": "No events",
    "event_title": "Event Title",
    "start_time": "Start Time",
    "end_time": "End Time",
    "location": "Location",
    "description": "Description",
    "all_day": "All Day",
    "repeat": "Repeat",
    "reminder": "Reminder"
  },
  
  "shopping": {
    "title": "Shopping List",
    "add_item": "Add Item",
    "empty_list": "Your shopping list is empty",
    "mark_purchased": "Mark as Purchased",
    "delete_item": "Delete Item",
    "item_name": "Item Name",
    "quantity": "Quantity",
    "category": "Category",
    "notes": "Notes"
  },
  
  "voice_notes": {
    "title": "Voice Notes",
    "record": "Record",
    "stop_recording": "Stop",
    "play": "Play",
    "pause": "Pause",
    "delete_recording": "Delete Recording",
    "no_recordings": "No voice notes yet",
    "transcription": "Transcription"
  },
  
  "messaging": {
    "title": "Family Chat",
    "type_message": "Type a message...",
    "send": "Send",
    "attach_photo": "Attach Photo",
    "attach_location": "Share Location",
    "no_messages": "No messages yet",
    "delivered": "Delivered",
    "read": "Read",
    "typing": "{{name}} is typing..."
  },
  
  "settings": {
    "title": "Settings",
    "profile": "Profile",
    "timezone": "Time Zone",
    "safe_times": "Safe Times",
    "notifications": "Notifications",
    "privacy": "Privacy",
    "help": "Help & Support",
    "about": "About",
    "sign_out": "Sign Out",
    "delete_account": "Delete Account"
  },
  
  "safe_times": {
    "title": "Safe Times",
    "description": "Set quiet hours when you don't want non-urgent notifications",
    "enabled": "Safe Times Enabled",
    "start_time": "Start Time",
    "end_time": "End Time",
    "allow_urgent": "Allow urgent notifications",
    "monday": "Monday",
    "tuesday": "Tuesday",
    "wednesday": "Wednesday",
    "thursday": "Thursday",
    "friday": "Friday",
    "saturday": "Saturday",
    "sunday": "Sunday"
  },
  
  "notifications": {
    "task_reminder": "Task Reminder",
    "calendar_reminder": "Calendar Reminder",
    "location_reminder": "Location Reminder",
    "family_message": "New message from {{name}}",
    "task_due_soon": "Task due soon: {{taskName}}",
    "event_starting": "Event starting in {{minutes}} minutes",
    "near_location": "You're near {{location}}"
  },
  
  "mccarthy_responses": {
    "task_created": "I've added '{{taskName}}' to your tasks.",
    "task_completed": "Great! I've marked '{{taskName}}' as complete.",
    "task_deleted": "I've deleted '{{taskName}}'.",
    "reminder_set": "I'll remind you {{when}}.",
    "event_created": "I've added '{{eventName}}' to your calendar for {{when}}.",
    "shopping_item_added": "I've added {{item}} to your shopping list.",
    "voice_note_saved": "I've saved your voice note.",
    "message_sent": "I've sent your message to {{recipientName}}.",
    "location_reminder_set": "I'll remind you when you're at {{location}}.",
    "traffic_alert": "There's heavy traffic on your usual route. You might want to leave {{minutes}} minutes early.",
    "weather_alert": "It's going to rain later today. Don't forget your umbrella!",
    "calendar_conflict": "You already have an event at that time: {{existingEvent}}",
    "unclear_request": "I'm not sure I understood. Could you rephrase that?",
    "feature_not_available": "That feature isn't available yet, but it's coming soon!",
    "error": "Sorry, something went wrong. Please try again."
  },
  
  "voice": {
    "wake_word": "Hey McCarthy",
    "listening": "Listening...",
    "processing": "Processing...",
    "tap_to_speak": "Tap to speak",
    "speak_now": "Speak now",
    "voice_input": "Voice Input"
  },
  
  "errors": {
    "network_error": "Check your internet connection and try again",
    "auth_error": "Authentication failed. Please sign in again",
    "permission_denied": "Permission denied. Please enable in Settings",
    "location_unavailable": "Location unavailable. Please enable location services",
    "microphone_unavailable": "Microphone unavailable. Please enable microphone access",
    "calendar_sync_failed": "Failed to sync calendar",
    "task_creation_failed": "Failed to create task",
    "message_send_failed": "Failed to send message"
  }
}
```

### 5.4 Usage in Components

**Basic Usage:**

```javascript
import { useTranslation } from 'react-i18next';

function TasksScreen() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text style={styles.title}>{t('tasks.title')}</Text>
      
      {tasks.length === 0 ? (
        <Text>{t('tasks.no_tasks')}</Text>
      ) : (
        tasks.map(task => <TaskCard key={task.id} task={task} />)
      )}
      
      <Button 
        title={t('tasks.create_new')} 
        onPress={handleCreateTask} 
      />
    </View>
  );
}
```

**With Interpolation:**

```javascript
function NotificationMessage({ name }) {
  const { t } = useTranslation();
  
  return (
    <Text>
      {t('messaging.typing', { name: name })}
    </Text>
  );
}

// Result: "Sarah is typing..."
```

**With Plural Forms:**

```json
{
  "tasks": {
    "task_count": "You have {{count}} task",
    "task_count_plural": "You have {{count}} tasks"
  }
}
```

```javascript
const { t } = useTranslation();

// count = 1: "You have 1 task"
// count = 5: "You have 5 tasks"
<Text>{t('tasks.task_count', { count: tasks.length })}</Text>
```

**In McCarthy Responses:**

```javascript
import i18n from '../i18n/config';

class LLMService {
  // ...
  
  async respondToUser(key, params = {}) {
    const message = i18n.t(`mccarthy_responses.${key}`, params);
    await this.sendMessage(message);
  }
}

// Usage:
await llmService.respondToUser('task_created', { taskName: 'buy milk' });
// Result: "I've added 'buy milk' to your tasks."

await llmService.respondToUser('reminder_set', { when: 'at 3 PM' });
// Result: "I'll remind you at 3 PM."
```

### 5.5 User Language Preference (V3)

In V3, add user language preference:

```javascript
// Database schema (add to users collection)
{
  userId: "user_123",
  name: "Sarah",
  locale: "en-AU",           // ✅ Already in v7 schema (set to en-AU for MVP)
  preferredLanguage: "en"    // V3: User can change to fr, es, etc.
}

// Change language dynamically
import i18n from '../i18n/config';

async function changeLanguage(language) {
  await i18n.changeLanguage(language);
  
  // Update user preference in database
  await db.collection('users').doc(userId).update({
    preferredLanguage: language
  });
}

// Usage:
await changeLanguage('fr');  // Switch to French
```

### 5.6 Testing Translations

```javascript
// File: /__tests__/i18n.test.js

import i18n from '../i18n/config';

describe('i18n', () => {
  test('English translations loaded', () => {
    expect(i18n.t('common.app_name')).toBe('McCarthy');
    expect(i18n.t('tasks.create_new')).toBe('Create Task');
    expect(i18n.t('shopping.add_item')).toBe('Add Item');
  });
  
  test('Interpolation works', () => {
    expect(i18n.t('messaging.typing', { name: 'Sarah' }))
      .toBe('Sarah is typing...');
    
    expect(i18n.t('mccarthy_responses.task_created', { taskName: 'buy milk' }))
      .toBe("I've added 'buy milk' to your tasks.");
  });
  
  test('Missing translation returns key', () => {
    expect(i18n.t('nonexistent.key')).toBe('nonexistent.key');
  });
});
```

### 5.7 Adding New Languages (V3)

When V3 adds new languages:

1. **Create new translation file:**
   - `/src/i18n/locales/fr.json` (copy en.json and translate)
   - `/src/i18n/locales/es.json`
   - etc.

2. **Import in config:**
```javascript
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es }
  },
  // ...
});
```

3. **Add language picker to Settings:**
```javascript
function LanguageSettings() {
  const { i18n } = useTranslation();
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' }
  ];
  
  return (
    <View>
      {languages.map(lang => (
        <TouchableOpacity 
          key={lang.code}
          onPress={() => i18n.changeLanguage(lang.code)}
        >
          <Text>{lang.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

4. **Zero code changes needed in app** - all strings already use `t()`!

---

## 6. Voice & Text Interaction System

(Continue with detailed implementation...)


(Sections 6-12 continued with full feature implementation details, following the same depth as v6...)

---

## 18. Data Models (UPDATED in v7)

### 18.1 Users Collection

**CRITICAL CHANGES in v7:**
- ❌ **Removed:** `familyGroupId` (hardcoded family concept)
- ✅ **Added:** `groupIds` array, `defaultGroupId`, `currency`, `locale`, `defaultShoppingListId`

```javascript
{
  // Identity
  userId: "user_abc123",
  email: "sarah@example.com",
  name: "Sarah Hutchison",
  phoneNumber: "+61423456789",
  profilePhotoUrl: "https://storage.../photos/user_abc123.jpg",
  
  // v7: Group membership (supports multiple groups)
  groupIds: ["group_xyz789"],              // ✅ Array (just one in MVP, multiple in V2)
  defaultGroupId: "group_xyz789",          // ✅ Primary/default group
  // ❌ REMOVED: familyGroupId: "group_xyz789"  // OLD v6 field
  
  // Location & timezone
  timezone: "Australia/Sydney",            // IANA format (works for all countries)
  homeAddress: {
    street: "123 Main St",
    city: "Sydney",
    state: "NSW",
    postcode: "2000",
    country: "Australia",
    coordinates: { lat: -33.8688, lng: 151.2093 }
  },
  workAddress: {
    street: "456 Business Ave",
    city: "Sydney",
    state: "NSW",
    postcode: "2001",
    country: "Australia",
    coordinates: { lat: -33.8650, lng: 151.2080 }
  },
  
  // v7: Internationalization (for V3)
  currency: "AUD",                         // ✅ Added for V3 currency conversion
  locale: "en-AU",                         // ✅ Added for V3 translation
  
  // Safe times (Do Not Disturb)
  safeTimes: {
    enabled: true,
    defaultStart: "22:00",                 // 10 PM
    defaultEnd: "07:00",                   // 7 AM
    allowUrgent: true,                     // Override for urgent notifications
    customSchedule: {
      monday: { enabled: true, start: "22:00", end: "07:00" },
      tuesday: { enabled: true, start: "22:00", end: "07:00" },
      wednesday: { enabled: true, start: "22:00", end: "07:00" },
      thursday: { enabled: true, start: "22:00", end: "07:00" },
      friday: { enabled: true, start: "23:00", end: "08:00" },
      saturday: { enabled: true, start: "00:00", end: "09:00" },
      sunday: { enabled: true, start: "23:00", end: "08:00" }
    }
  },
  
  // Notification preferences
  notificationSettings: {
    pushEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    taskReminders: true,
    calendarReminders: true,
    locationReminders: true,
    familyMessages: true,
    proactiveNotifications: true
  },
  
  // Voice preferences
  voiceSettings: {
    wakeWordEnabled: true,
    wakeWord: "Hey McCarthy",
    voiceRecognitionLanguage: "en-AU",
    ttsVoice: "en-AU-Wavenet-A",
    ttsSpeed: 1.0
  },
  
  // Privacy settings
  privacy: {
    locationSharingEnabled: true,
    activitySharingEnabled: true,
    readReceiptsEnabled: true,
    typingIndicatorEnabled: true
  },
  
  // Calendar integration
  calendarIntegration: {
    provider: "google",                    // "google" | "apple" | "outlook" | "none"
    connected: true,
    lastSync: "2025-11-10T18:45:00Z",
    syncFrequency: 15                      // minutes
  },
  
  // v7: Shopping preferences
  defaultShoppingListId: "list_123",       // ✅ Added for multiple lists in V2
  preferredStores: [
    {
      name: "Woolworths Sydney CBD",
      type: "supermarket",
      coordinates: { lat: -33.8688, lng: 151.2093 },
      radius: 200
    }
  ],
  
  // AI preferences
  llmProvider: "llama",                    // "llama" | "gpt4" (via abstraction layer)
  conversationStyle: "friendly",           // "friendly" | "professional" | "casual"
  
  // App settings
  theme: "light",                          // "light" | "dark" | "auto"
  
  // Metadata
  createdAt: "2025-11-01T10:00:00Z",
  updatedAt: "2025-11-10T18:45:00Z",
  lastActiveAt: "2025-11-10T18:45:00Z",
  appVersion: "1.0.0"
}
```

### 18.2 Groups Collection

**CRITICAL CHANGES in v7:**
- ✅ **Added:** `adminIds`, `createdBy`, `pollIds[]`, `projectIds[]`, `privateThreadIds[]`, `settings{}`

```javascript
{
  // Identity
  groupId: "group_xyz789",
  groupType: "family",                     // MVP: only "family", V2: "soccer_team", "school", etc.
  groupName: "The Hutchison Family",
  groupDescription: "Our family coordination",
  groupPhotoUrl: "https://storage.../photos/group_xyz789.jpg",
  
  // v7: Member management (supports admin roles)
  memberIds: ["user_abc123", "user_def456", "user_ghi789"],
  adminIds: ["user_abc123"],               // ✅ Added for V2 admin roles
  createdBy: "user_abc123",                // ✅ Added to track creator
  
  // v7: Future entity references (empty in MVP, populated in V2)
  pollIds: [],                             // ✅ Empty in MVP, polls in V2
  projectIds: [],                          // ✅ Empty in MVP, projects in V2
  privateThreadIds: [],                    // ✅ Empty in MVP, private threads in V2
  
  // v7: Settings with defaults (enables feature flags)
  settings: {
    allowMemberInvites: true,              // ✅ Default: true for MVP
    requireApprovalForJoin: false,         // ✅ Default: false for MVP
    allowPolls: false,                     // ✅ MVP: false, V2: enable
    allowPrivateThreads: false,            // ✅ MVP: false, V2: enable
    allowTaskAssignment: true,             // ✅ MVP: true (basic)
    allowProjectManagement: false,         // ✅ MVP: false, V2: enable
    messageDeletionPolicy: "sender_only",  // "sender_only" | "admin_only" | "anyone"
    taskVisibility: "all"                  // "all" | "assigned_only"
  },
  
  // Invite tracking
  inviteCode: "HUTCH2025",                 // Simple invite code for joining
  inviteLink: "https://mccarthy.app/join/HUTCH2025",
  
  // Metadata
  createdAt: "2025-11-01T10:00:00Z",
  updatedAt: "2025-11-10T18:23:45Z",
  memberCount: 3,
  messageCount: 1247,
  lastActivity: "2025-11-10T18:20:00Z"
}
```

### 18.3 Messages Collection

**CRITICAL CHANGES in v7:**
- ✅ **Added:** `parentGroupId`, `threadId` (null for MVP, populated in V2 for private threads)

```javascript
{
  // Identity
  messageId: "msg_123456",
  groupId: "group_xyz789",
  
  // v7: Thread support (for V2 private threads)
  parentGroupId: null,                     // ✅ null = main group, groupId = private thread
  threadId: null,                          // ✅ null = main chat, threadId = specific thread
  
  // Sender
  senderId: "user_abc123",
  senderName: "Sarah",
  senderPhotoUrl: "https://storage.../photos/user_abc123.jpg",
  
  // Content
  messageType: "text",                     // "text" | "image" | "voice" | "location" | "system"
  content: "Anyone free for dinner tonight?",
  
  // Attachments (for images, voice notes, locations)
  attachments: [
    {
      type: "image",
      url: "https://storage.../messages/msg_123456_img1.jpg",
      thumbnailUrl: "https://storage.../messages/msg_123456_img1_thumb.jpg",
      size: 245678,
      dimensions: { width: 1920, height: 1080 }
    }
  ],
  
  // Mentions
  mentions: ["user_def456"],               // User IDs mentioned in message
  mentionsAll: false,                      // @all mention
  
  // Reactions
  reactions: {
    "👍": ["user_def456", "user_ghi789"],
    "❤️": ["user_abc123"]
  },
  
  // Delivery tracking
  sentAt: "2025-11-10T18:15:00Z",
  deliveredTo: ["user_def456", "user_ghi789"],
  readBy: [
    { userId: "user_def456", readAt: "2025-11-10T18:16:30Z" },
    { userId: "user_ghi789", readAt: "2025-11-10T18:20:00Z" }
  ],
  
  // Metadata
  editedAt: null,                          // If edited
  deletedAt: null,                         // If deleted
  deleted: false,
  
  // Reply tracking
  replyToMessageId: null,                  // If replying to another message
  
  createdAt: "2025-11-10T18:15:00Z",
  updatedAt: "2025-11-10T18:15:00Z"
}
```

### 18.4 Tasks Collection

**CRITICAL CHANGES in v7:**
- ✅ **Added:** `groupId` field (null = personal task, groupId = shared task)

```javascript
{
  // Identity
  taskId: "task_789012",
  userId: "user_abc123",                   // Task owner
  
  // v7: Group assignment (supports shared tasks in V2)
  groupId: null,                           // ✅ null = personal, groupId = shared task
  assignedTo: null,                        // V2: Assign to other users
  
  // Content
  title: "Call Mum about Christmas plans",
  description: "Discuss dates and who's hosting this year",
  
  // Classification
  category: "family",                      // "personal" | "work" | "family" | "errands" | "health" | "other"
  priority: "medium",                      // "high" | "medium" | "low"
  status: "pending",                       // "pending" | "in_progress" | "completed" | "cancelled"
  
  // Timing
  dueDate: "2025-11-12T15:00:00Z",
  dueTime: "15:00",                        // Local time
  dueTimezone: "Australia/Sydney",
  completedAt: null,
  
  // Reminders
  reminders: [
    {
      type: "time",
      time: "2025-11-11T09:30:00Z",        // 1 day before
      sent: false
    },
    {
      type: "time",
      time: "2025-11-12T14:45:00Z",        // 15 min before
      sent: false
    }
  ],
  
  // Recurrence
  recurring: false,
  recurrence: null,
  // recurrence: {
  //   frequency: "weekly",                // "daily" | "weekly" | "monthly" | "yearly" | "custom"
  //   interval: 1,                        // Every X weeks
  //   daysOfWeek: [0],                    // Sunday = 0, Monday = 1, etc.
  //   endDate: null,                      // When recurrence ends
  //   occurrences: null                   // Or after X occurrences
  // },
  
  // Location-based
  locationBased: false,
  locationTrigger: null,
  // locationTrigger: {
  //   location: "home",                   // "home" | "work" | custom
  //   coordinates: { lat: -33.8688, lng: 151.2093 },
  //   radius: 200,                        // meters
  //   triggerType: "arrival"              // "arrival" | "departure"
  // },
  
  // Context
  linkedCalendarEventId: null,             // If related to calendar event
  linkedShoppingListId: null,              // If related to shopping
  linkedVoiceNoteId: null,                 // If created from voice note
  
  // AI context
  aiSuggestion: false,                     // If McCarthy suggested this task
  aiContext: null,                         // Context that led to suggestion
  
  // Metadata
  createdAt: "2025-11-10T18:00:00Z",
  updatedAt: "2025-11-10T18:00:00Z",
  createdBy: "voice",                      // "voice" | "text" | "ai_suggestion"
}
```

### 18.5 Shopping Lists Collection

**CRITICAL CHANGES in v7:**
- ✅ **Added:** `isDefault` field (supports multiple lists in V2)

```javascript
{
  // Identity
  listId: "list_123456",
  userId: "user_abc123",                   // List owner
  groupId: "group_xyz789",                 // Shared with group
  
  // v7: Multiple lists support
  isDefault: true,                         // ✅ Added for multiple lists in V2
  
  // Basic info
  name: "Weekly Groceries",
  description: "Regular shopping list",
  icon: "🛒",
  
  // Items
  items: [
    {
      itemId: "item_001",
      name: "Milk",
      quantity: "2L",
      category: "dairy",
      purchased: false,
      addedBy: "user_abc123",
      addedAt: "2025-11-10T18:00:00Z",
      purchasedBy: null,
      purchasedAt: null,
      notes: "Full cream"
    },
    {
      itemId: "item_002",
      name: "Bread",
      quantity: "1 loaf",
      category: "bakery",
      purchased: true,
      addedBy: "user_def456",
      addedAt: "2025-11-09T12:00:00Z",
      purchasedBy: "user_abc123",
      purchasedAt: "2025-11-10T17:45:00Z",
      notes: "Wholemeal"
    }
  ],
  
  // Store associations
  preferredStore: {
    name: "Woolworths Sydney CBD",
    coordinates: { lat: -33.8688, lng: 151.2093 },
    radius: 200
  },
  
  // Store location reminders
  storeLocations: [
    {
      name: "Woolworths Sydney CBD",
      coordinates: { lat: -33.8688, lng: 151.2093 },
      radius: 200  // meters
    },
    {
      name: "Coles Bondi Junction",
      coordinates: { lat: -33.8914, lng: 151.2504 },
      radius: 150
    }
  ],
  
  // Metadata
  createdAt: "2025-11-01T10:00:00Z",
  updatedAt: "2025-11-10T17:45:00Z",
  itemCount: 12,
  purchasedCount: 3,
  lastShoppingDate: "2025-11-10T17:45:00Z"
}
```

### 18.6 Calendar Events Collection

```javascript
{
  // Identity
  eventId: "event_345678",
  userId: "user_abc123",
  groupId: null,                           // If shared with group
  
  // External calendar sync
  externalCalendarId: "calendar_google_xyz",
  externalEventId: "google_event_123",
  syncProvider: "google",                  // "google" | "apple" | "outlook" | "manual"
  
  // Event details
  title: "Dentist Appointment",
  description: "6-month checkup",
  location: "Sydney Dental Clinic, 789 Health St, Sydney NSW 2000",
  locationCoordinates: { lat: -33.8700, lng: 151.2100 },
  
  // Timing
  startTime: "2025-11-15T14:00:00Z",
  endTime: "2025-11-15T15:00:00Z",
  timezone: "Australia/Sydney",
  allDay: false,
  
  // Recurrence
  recurring: false,
  recurrence: null,
  
  // Reminders
  reminders: [
    {
      type: "notification",
      minutes: 1440,                       // 1 day before
      sent: false
    },
    {
      type: "notification",
      minutes: 30,                         // 30 min before
      sent: false
    }
  ],
  
  // Attendees
  attendees: [
    {
      userId: "user_abc123",
      status: "accepted",                  // "accepted" | "declined" | "tentative" | "pending"
      response: null
    }
  ],
  
  // Status
  status: "confirmed",                     // "confirmed" | "tentative" | "cancelled"
  
  // AI context
  aiSuggested: false,
  travelTimeNeeded: 15,                    // minutes
  
  // Metadata
  createdAt: "2025-11-01T10:00:00Z",
  updatedAt: "2025-11-10T17:30:00Z",
  lastSyncedAt: "2025-11-10T18:00:00Z"
}
```

### 18.7 Voice Notes Collection

```javascript
{
  voiceNoteId: "voice_567890",
  userId: "user_abc123",
  groupId: null,                           // If shared with group
  
  // Audio
  audioUrl: "https://storage.../voice/voice_567890.m4a",
  duration: 45,                            // seconds
  format: "m4a",
  size: 512000,                            // bytes
  
  // Transcription
  transcription: "Remember to ask Tom about soccer practice schedule",
  transcriptionConfidence: 0.95,
  transcriptionLanguage: "en-AU",
  
  // Organization
  title: "Soccer practice reminder",      // Auto-generated or user-set
  tags: ["family", "soccer"],
  
  // Linking
  linkedToTaskId: null,                    // Can be linked to a task
  linkedToMessageId: null,                 // Can be linked to a message
  linkedToCalendarEventId: null,
  
  // Privacy
  shared: false,
  sharedWith: [],
  sharedWithGroup: null,
  
  // Metadata
  createdAt: "2025-11-10T18:00:00Z",
  updatedAt: "2025-11-10T18:00:00Z",
  deleteAfter: "2025-11-17T18:00:00Z",    // Auto-delete after 7 days
  playCount: 2,
  lastPlayedAt: "2025-11-10T18:05:00Z"
}
```

### 18.8 Notifications Queue Collection

```javascript
{
  notificationId: "notif_123456",
  userId: "user_abc123",
  
  // Type
  type: "reminder",                        // "reminder" | "message" | "proactive" | "event" | "location"
  relatedId: "task_789012",                // taskId, messageId, eventId, etc.
  
  // Content
  title: "Task Reminder",
  body: "Call Mum about Christmas plans",
  urgency: "normal",                       // "normal" | "urgent"
  category: "task",                        // For notification grouping
  
  // Actions (notification buttons)
  actions: [
    { id: "complete", title: "Mark Complete" },
    { id: "snooze", title: "Snooze 15 min" }
  ],
  
  // Scheduling
  scheduledFor: "2025-11-11T09:30:00Z",
  deliveredAt: null,
  readAt: null,
  actionTaken: null,                       // Which action button was pressed
  
  // Queueing (if outside safe times)
  queued: true,
  queuedAt: "2025-11-10T23:00:00Z",
  deliverAt: "2025-11-11T07:00:00Z",      // Next safe time
  queueReason: "outside_safe_times",      // "outside_safe_times" | "user_in_meeting" | "user_driving"
  
  // Context awareness
  userContext: {
    location: "home",
    activity: "stationary",
    calendarStatus: "free",
    inSafeTime: false
  },
  
  // Delivery status
  status: "queued",                        // "queued" | "delivered" | "read" | "dismissed" | "failed"
  deliveryAttempts: 0,
  lastAttemptAt: null,
  failureReason: null,
  
  // Metadata
  createdAt: "2025-11-10T23:00:00Z",
  updatedAt: "2025-11-10T23:00:00Z",
  expiresAt: "2025-11-12T09:30:00Z"       // Auto-delete if not delivered by this time
}
```

### 18.9 Location History Collection

```javascript
{
  locationId: "loc_234567",
  userId: "user_abc123",
  
  // Coordinates
  latitude: -33.8688,
  longitude: 151.2093,
  accuracy: 10,                            // meters
  altitude: 20,                            // meters
  altitudeAccuracy: 5,
  speed: 0,                                // meters per second
  heading: null,                           // degrees (0-360)
  
  // Context
  context: "home",                         // "home" | "work" | "commuting" | "store" | "unknown"
  geofence: "home_geofence_001",          // Which geofence, if any
  nearbyStores: [
    {
      name: "Woolworths Sydney CBD",
      distance: 150,                       // meters
      hasShoppingList: true
    }
  ],
  
  // Activity (from device sensors)
  activity: "stationary",                  // "stationary" | "walking" | "running" | "driving" | "cycling"
  activityConfidence: 0.85,
  
  // Privacy
  sharingEnabled: true,
  sharedWithGroupId: "group_xyz789",
  
  // Metadata
  capturedAt: "2025-11-10T18:45:00Z",
  uploadedAt: "2025-11-10T18:45:30Z",
  deleteAfter: "2025-12-10T18:45:00Z",    // Auto-delete after 30 days
  batteryLevel: 0.75,
  powerSaveMode: false
}
```

### 18.10 External Messages Log Collection

```javascript
{
  externalMessageId: "ext_msg_345678",
  userId: "user_abc123",                   // Who sent it
  
  // Recipient (external contact, not on McCarthy)
  recipientPhone: "+61423456789",
  recipientEmail: null,
  recipientName: "Tom",
  recipientRelationship: "friend",         // For context
  
  // Message
  messageType: "sms",                      // "sms" | "email"
  content: "Hey Tom, I'm running 15 minutes late. See you soon! - Sarah",
  
  // Delivery (via abstraction layer)
  deliveryMethod: "native_intent",         // "native_intent" | "twilio" | "sendgrid"
  providerMessageId: null,                 // If sent via Twilio/SendGrid
  status: "drafted",                       // "drafted" | "sent" | "delivered" | "failed"
  
  // Invitation tracking (to join McCarthy)
  inviteSent: true,
  inviteSentAt: "2025-11-10T18:25:00Z",
  inviteText: "P.S. Check out McCarthy for family coordination! https://mccarthy.app",
  inviteAccepted: false,
  inviteAcceptedAt: null,
  
  // Cost tracking (for V2)
  cost: 0,                                 // $0 for native intents, $0.0079 for Twilio SMS
  costCurrency: "AUD",
  
  // Context (why was this message sent?)
  originatingTaskId: null,                 // If related to a task
  originatingEventId: null,                // If related to an event
  mccarthySuggested: false,                // Did McCarthy suggest sending this?
  
  // Metadata
  createdAt: "2025-11-10T18:23:45Z",
  sentAt: "2025-11-10T18:24:00Z",
  deliveredAt: null,
  failedAt: null,
  failureReason: null
}
```

---

## 19. API Specifications

### 19.1 Cloud Functions Overview

All backend logic runs as Firebase Cloud Functions (Node.js).

**Function Categories:**
1. **User Management:** Authentication, profile updates
2. **Messaging:** Real-time chat, push notifications
3. **Tasks:** CRUD operations, reminders
4. **Calendar:** Sync, event management
5. **Location:** Tracking, geofencing
6. **AI:** LLM processing, function calling
7. **External Messaging:** SMS/email abstraction layer

### 19.2 Core API Endpoints

**Authentication:**
```
POST /auth/signup
POST /auth/signin
POST /auth/signout
POST /auth/resetPassword
GET  /auth/profile
PUT  /auth/profile
```

**Messaging (In-App):**
```
GET  /groups/:groupId/messages
POST /groups/:groupId/messages
PUT  /messages/:messageId
DELETE /messages/:messageId
POST /messages/:messageId/reactions
GET  /messages/:messageId/read-receipts
```

**Tasks:**
```
GET  /tasks
GET  /tasks/:taskId
POST /tasks
PUT  /tasks/:taskId
DELETE /tasks/:taskId
POST /tasks/:taskId/complete
POST /tasks/:taskId/snooze
```

**Calendar:**
```
GET  /calendar/events
GET  /calendar/events/:eventId
POST /calendar/events
PUT  /calendar/events/:eventId
DELETE /calendar/events/:eventId
POST /calendar/sync
```

**Shopping Lists:**
```
GET  /shopping-lists
GET  /shopping-lists/:listId
POST /shopping-lists
PUT  /shopping-lists/:listId
DELETE /shopping-lists/:listId
POST /shopping-lists/:listId/items
PUT  /shopping-lists/:listId/items/:itemId
DELETE /shopping-lists/:listId/items/:itemId
```

**External Messaging (via abstraction layer):**
```
POST /external-messages/send-sms
POST /external-messages/send-email
GET  /external-messages/log
```

### 19.3 AI/LLM Processing

**Main LLM Endpoint:**
```
POST /ai/process-message
```

**Request:**
```json
{
  "userId": "user_abc123",
  "message": "Remind me to call Tom tomorrow at 3 PM",
  "conversationHistory": [...],
  "context": {
    "timezone": "Australia/Sydney",
    "location": "home",
    "currentTime": "2025-11-10T18:45:00Z",
    "calendarEvents": [...],
    "tasks": [...],
    "groupId": "group_xyz789"
  }
}
```

**Response:**
```json
{
  "response": "I'll remind you to call Tom tomorrow at 3 PM.",
  "functionCalls": [
    {
      "function": "create_task",
      "arguments": {
        "title": "Call Tom",
        "dueDate": "2025-11-11T15:00:00Z",
        "reminder": true
      }
    }
  ],
  "conversationId": "conv_123",
  "tokensUsed": 245,
  "cost": 0.0012
}
```

---

## 20. Error Handling & Resilience

### 20.1 Error Categories

**Network Errors:**
- Handle offline mode gracefully
- Queue operations for retry when online
- Show user-friendly messages

**Authentication Errors:**
- Auto-refresh tokens
- Graceful fallback to login screen
- Preserve app state

**LLM/AI Errors:**
- Fallback to simpler processing
- Graceful degradation (disable AI if consistently failing)
- User notification with retry option

**Location Errors:**
- Handle permission denied
- Fallback to manual location entry
- Disable location-based features gracefully

**External API Failures:**
- Calendar sync failures: Queue for retry
- Maps API failures: Show cached data
- Weather API failures: Skip weather context

### 20.2 Retry Logic

```javascript
class RetryHandler {
  async retryWithBackoff(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        const delay = Math.pow(2, i) * 1000;  // Exponential backoff
        await this.sleep(delay);
      }
    }
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 20.3 Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED';  // CLOSED | OPEN | HALF_OPEN
    this.nextAttempt = Date.now();
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

// Usage: Protect LLM calls
const llmCircuitBreaker = new CircuitBreaker();

async function callLLM(message) {
  return await llmCircuitBreaker.execute(async () => {
    return await llmService.processMessage(message);
  });
}
```

---

## 21. Development Environment Setup

### 21.1 Prerequisites

**Required Software:**
- Node.js 18+ (LTS)
- npm or Yarn
- Xcode 15+ (for iOS development)
- Android Studio (for Android development)
- Git
- Firebase CLI
- React Native CLI

**Accounts Needed:**
- Firebase/Google Cloud Platform account
- Apple Developer account (for iOS deployment)
- Google Play Developer account (for Android deployment)
- Replicate account (for Llama 3.1 API)
- Google Maps API key

### 21.2 Project Setup

**Clone Repository:**
```bash
git clone https://github.com/yourorg/mccarthy-app.git
cd mccarthy-app
```

**Install Dependencies:**
```bash
npm install
# or
yarn install

# Install iOS pods
cd ios && pod install && cd ..
```

**Environment Variables:**

Create `.env` file:
```
# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef

# LLM Service (Abstraction Layer)
LLM_PROVIDER=llama  # "llama" | "gpt4"
REPLICATE_API_TOKEN=your_replicate_token
OPENAI_API_KEY=your_openai_key  # For GPT-4 fallback

# External Messaging (Abstraction Layer)
EXTERNAL_MSG_PROVIDER=native  # "native" | "twilio"
TWILIO_ACCOUNT_SID=your_twilio_sid  # For V2
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Feature Flags (can be in database for V2)
FEATURE_MULTIPLE_GROUPS=false
FEATURE_POLLS=false
FEATURE_PRIVATE_THREADS=false
FEATURE_AUTOMATED_MESSAGING=false
FEATURE_TRANSLATION=false

# App Config
APP_ENV=development  # "development" | "staging" | "production"
API_BASE_URL=https://your-cloud-functions.cloudfunctions.net
```

**Firebase Setup:**
```bash
# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Select:
# - Firestore
# - Functions
# - Storage
# - Hosting (optional)

# Deploy Firebase rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# Deploy Cloud Functions
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 21.3 Running the App

**iOS:**
```bash
# Run on iOS simulator
npm run ios
# or
yarn ios

# Run on specific iOS device
npm run ios --device="Your iPhone"
```

**Android:**
```bash
# Run on Android emulator
npm run android
# or
yarn android

# Run on specific Android device
npm run android --deviceId=YOUR_DEVICE_ID
```

**Metro Bundler:**
```bash
# Start Metro server
npm start
# or
yarn start

# Clear cache if needed
npm start -- --reset-cache
```

### 21.4 Development Workflow

**Branch Strategy:**
- `main` - Production code
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `release/*` - Release preparation

**Code Quality:**
```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking (if using TypeScript)
npm run type-check

# Run all checks
npm run check-all
```

---

## 22. Testing Strategy

### 22.1 Testing Pyramid

**Unit Tests (70%):**
- Individual functions
- Services
- Utilities
- Components

**Integration Tests (20%):**
- API endpoints
- Database operations
- External service integrations

**E2E Tests (10%):**
- Critical user flows
- Voice interaction
- Notification delivery
- Cross-device sync

### 22.2 Test Setup

**Install Testing Libraries:**
```bash
npm install --save-dev @testing-library/react-native jest
npm install --save-dev detox  # For E2E testing
```

**Jest Configuration:**

`jest.config.js`:
```javascript
module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### 22.3 Example Tests

**Unit Test (Feature Flags Service):**
```javascript
// __tests__/services/FeatureFlagService.test.js
import { FeatureFlagService } from '../../src/services/FeatureFlagService';

describe('FeatureFlagService', () => {
  let service;
  
  beforeEach(() => {
    service = new FeatureFlagService();
  });
  
  describe('isEnabled', () => {
    test('returns true for MVP features', () => {
      expect(service.isEnabled('voiceInput')).toBe(true);
      expect(service.isEnabled('textChat')).toBe(true);
      expect(service.isEnabled('personalTasks')).toBe(true);
    });
    
    test('returns false for V2 features', () => {
      expect(service.isEnabled('multipleGroups')).toBe(false);
      expect(service.isEnabled('polls')).toBe(false);
      expect(service.isEnabled('privateThreads')).toBe(false);
    });
    
    test('returns false for unknown features', () => {
      expect(service.isEnabled('unknownFeature')).toBe(false);
    });
  });
  
  describe('enableFeature', () => {
    test('enables a feature', async () => {
      await service.enableFeature('polls');
      expect(service.isEnabled('polls')).toBe(true);
    });
  });
  
  describe('disableFeature', () => {
    test('disables a feature', async () => {
      await service.enableFeature('polls');
      await service.disableFeature('polls');
      expect(service.isEnabled('polls')).toBe(false);
    });
  });
});
```

**Integration Test (LLM Service):**
```javascript
// __tests__/services/LLMService.test.js
import { LLMService } from '../../src/services/LLMService';

describe('LLMService Integration', () => {
  let service;
  
  beforeAll(() => {
    service = new LLMService();
  });
  
  describe('processMessage', () => {
    test('creates a task from natural language', async () => {
      const result = await service.processMessage(
        "Remind me to call Tom tomorrow at 3 PM",
        {
          userId: "test_user_123",
          timezone: "Australia/Sydney",
          currentTime: "2025-11-10T18:00:00Z"
        }
      );
      
      expect(result.response).toContain("I'll remind you");
      expect(result.functionCalls).toHaveLength(1);
      expect(result.functionCalls[0].function).toBe('create_task');
      expect(result.functionCalls[0].arguments.title).toBe('Call Tom');
    }, 30000);  // Timeout 30s for API call
    
    test('handles ambiguous requests', async () => {
      const result = await service.processMessage(
        "Remind me about that thing",
        { userId: "test_user_123" }
      );
      
      expect(result.response).toContain("not sure");
      expect(result.functionCalls).toHaveLength(0);
    });
  });
});
```

**E2E Test (Detox):**
```javascript
// e2e/tasks.e2e.js
describe('Task Management Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    await device.reloadReactNative();
  });
  
  beforeEach(async () => {
    // Login
    await element(by.id('emailInput')).typeText('test@example.com');
    await element(by.id('passwordInput')).typeText('password123');
    await element(by.id('loginButton')).tap();
    
    // Wait for home screen
    await waitFor(element(by.id('homeScreen')))
      .toBeVisible()
      .withTimeout(5000);
  });
  
  it('should create a task via text', async () => {
    // Navigate to tasks
    await element(by.id('tasksTab')).tap();
    
    // Tap create task button
    await element(by.id('createTaskButton')).tap();
    
    // Enter task details
    await element(by.id('taskTitleInput')).typeText('Buy milk');
    await element(by.id('taskDueDatePicker')).tap();
    await element(by.text('Tomorrow')).tap();
    await element(by.id('saveTaskButton')).tap();
    
    // Verify task appears in list
    await expect(element(by.text('Buy milk'))).toBeVisible();
  });
  
  it('should create a task via voice', async () => {
    // Activate voice input
    await element(by.id('voiceButton')).tap();
    
    // Speak (simulated - in real test, use device mic)
    // For E2E, we'll simulate the voice recognition result
    await device.sendUserNotification({
      body: 'Voice recognized: Remind me to call Tom tomorrow at 3 PM'
    });
    
    // Verify McCarthy confirms
    await expect(element(by.text("I'll remind you"))).toBeVisible();
    
    // Navigate to tasks and verify
    await element(by.id('tasksTab')).tap();
    await expect(element(by.text('Call Tom'))).toBeVisible();
  });
});
```

### 22.4 Testing Commands

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- FeatureFlagService.test.js

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e:ios
npm run test:e2e:android

# Run all tests
npm run test:all
```

---

## 23. Deployment & DevOps

### 23.1 Build Process

**iOS Build:**
```bash
# Development build
npm run ios:dev

# Staging build
npm run ios:staging

# Production build
npm run ios:prod

# Create IPA for distribution
cd ios
xcodebuild -workspace McCarthy.xcworkspace \
  -scheme McCarthy \
  -configuration Release \
  -archivePath McCarthy.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath McCarthy.xcarchive \
  -exportPath McCarthy.ipa \
  -exportOptionsPlist ExportOptions.plist
```

**Android Build:**
```bash
# Development build
npm run android:dev

# Staging build
npm run android:staging

# Production build (AAB for Play Store)
cd android
./gradlew bundleRelease

# APK for direct distribution
./gradlew assembleRelease
```

### 23.2 Release Process

**Version Management:**
```bash
# Bump version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Update native versions
# iOS: Update version in Xcode
# Android: Update versionCode and versionName in build.gradle
```

**App Store Deployment (iOS):**
1. Create App Store Connect record
2. Upload build via Xcode or Transporter
3. Fill in app metadata
4. Submit for review
5. Release after approval

**Play Store Deployment (Android):**
1. Create Play Console listing
2. Upload AAB file
3. Fill in store listing
4. Submit for review
5. Release to production

### 23.3 CI/CD Pipeline

**GitHub Actions Example:**

`.github/workflows/test-and-deploy.yml`:
```yaml
name: Test and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
  
  deploy-functions:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy Firebase Functions
        run: |
          npm install -g firebase-tools
          firebase deploy --only functions --token ${{ secrets.FIREBASE_TOKEN }}
  
  deploy-ios:
    needs: test
    runs-on: macos-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Xcode
        uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: '15.0'
      
      - name: Install dependencies
        run: |
          npm ci
          cd ios && pod install
      
      - name: Build iOS
        run: npm run ios:prod
      
      # Additional steps for TestFlight upload
```

### 23.4 Monitoring & Alerting

**Firebase Crashlytics:**
```javascript
import crashlytics from '@react-native-firebase/crashlytics';

// Log errors
try {
  // Code that might fail
} catch (error) {
  crashlytics().recordError(error);
}

// Log custom events
crashlytics().log('User created task via voice');

// Set user attributes
crashlytics().setUserId(userId);
crashlytics().setAttribute('user_timezone', timezone);
```

**Firebase Performance Monitoring:**
```javascript
import perf from '@react-native-firebase/perf';

// Trace custom operations
async function createTask(taskData) {
  const trace = await perf().startTrace('create_task');
  
  try {
    const result = await api.createTask(taskData);
    trace.putAttribute('success', 'true');
    return result;
  } catch (error) {
    trace.putAttribute('success', 'false');
    trace.putAttribute('error', error.message);
    throw error;
  } finally {
    await trace.stop();
  }
}
```

**Analytics:**
```javascript
import analytics from '@react-native-firebase/analytics';

// Log events
await analytics().logEvent('task_created', {
  method: 'voice',
  category: 'family',
  has_reminder: true
});

// Set user properties
await analytics().setUserProperty('timezone', 'Australia/Sydney');
await analytics().setUserProperty('user_type', 'premium');
```

---

## 24. Monitoring & Analytics

### 24.1 Key Metrics to Track

**User Engagement:**
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Session length
- Feature usage (voice vs text, tasks vs calendar, etc.)
- Retention rate (Day 1, Day 7, Day 30)

**AI/LLM Metrics:**
- Function calling success rate
- Average tokens per conversation
- LLM response time
- User satisfaction with AI responses
- Cost per conversation

**Notification Metrics:**
- Notification delivery rate
- Notification open rate
- Time to notification delivery
- Safe times enforcement rate
- Queued notifications count

**Performance Metrics:**
- App launch time
- API response times
- Crash-free rate
- ANR (Application Not Responding) rate
- Battery usage

### 24.2 Dashboard Setup

**Custom Firebase Dashboard:**
```javascript
// Track custom events
const trackEvent = async (eventName, params) => {
  await analytics().logEvent(eventName, {
    ...params,
    timestamp: Date.now(),
    app_version: APP_VERSION,
    platform: Platform.OS
  });
};

// Usage examples
trackEvent('task_created', {
  method: 'voice',
  has_reminder: true,
  category: 'family'
});

trackEvent('message_sent', {
  group_type: 'family',
  has_attachment: false,
  mentioned_users: 2
});

trackEvent('llm_function_called', {
  function_name: 'create_task',
  success: true,
  response_time_ms: 1234
});
```

### 24.3 Cost Tracking

**LLM Cost Monitoring:**
```javascript
class CostTracker {
  async trackLLMUsage(userId, provider, tokensUsed, cost) {
    await db.collection('llm_usage').add({
      userId,
      provider,                    // 'llama' | 'gpt4'
      tokensUsed,
      cost,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Alert if user exceeds budget
    const monthlyUsage = await this.getMonthlyUsage(userId);
    if (monthlyUsage.totalCost > USER_COST_LIMIT) {
      await this.alertHighUsage(userId, monthlyUsage);
    }
  }
  
  async getMonthlyUsage(userId) {
    const startOfMonth = moment().startOf('month').toDate();
    
    const snapshot = await db.collection('llm_usage')
      .where('userId', '==', userId)
      .where('timestamp', '>=', startOfMonth)
      .get();
    
    const totalCost = snapshot.docs.reduce((sum, doc) => {
      return sum + doc.data().cost;
    }, 0);
    
    const totalTokens = snapshot.docs.reduce((sum, doc) => {
      return sum + doc.data().tokensUsed;
    }, 0);
    
    return { totalCost, totalTokens, conversationCount: snapshot.size };
  }
}
```

---

## 25. Cost Analysis & Optimization

### 25.1 MVP 1 Monthly Operating Costs

**For 100 families (realistic first milestone):**

```
Llama 3.1 AI (Replicate):
├─ ~300 conversations per family per month = 30,000 conversations
├─ Avg 500 tokens per conversation = 15M tokens
├─ Cost: $0.05 per 1M input tokens, $0.20 per 1M output tokens
├─ Estimate: 10M input, 5M output
└─ Total: (10 × $0.05) + (5 × $0.20) = $1.50/month

Firebase (Firestore + Functions + Storage + FCM):
├─ Firestore reads: 10M reads/month (generous)
│  └─ First 50K free, then $0.06 per 100K = ~$6/month
├─ Firestore writes: 2M writes/month
│  └─ First 20K free, then $0.18 per 100K = ~$3.60/month
├─ Cloud Functions: 5M invocations/month
│  └─ First 2M free, then $0.40 per 1M = ~$1.20/month
├─ Storage: 50GB stored, 500GB bandwidth
│  └─ First 5GB free, $0.026/GB = ~$1.17/month + bandwidth ~$10/month
└─ FCM: Free (unlimited)
Total Firebase: ~$22/month

Google Maps (location, traffic, geocoding):
├─ Generous free tier: $200 credit/month
├─ Usage for 100 families typically under free tier
└─ Total: $0/month (within free credit)

Native Messaging (SMS/email intents):
└─ Total: $0/month (user sends via native apps)

TOTAL ESTIMATED COST: ~$24/month for 100 families
or $0.24 per family per month

With GPT-4 fallback (if Llama insufficient):
├─ GPT-4 Turbo: $0.01 per 1K input tokens, $0.03 per 1K output
├─ Same usage: 10M input, 5M output
└─ Cost: (10,000 × $0.01) + (5,000 × $0.03) = $250/month

TOTAL WITH GPT-4: ~$272/month for 100 families
or $2.72 per family per month
```

**Scaling to 1,000 families:**
- Llama 3.1: ~$15/month
- Firebase: ~$220/month (scales with usage)
- Google Maps: ~$50/month (above free tier)
- **Total: ~$285/month** or $0.29 per family

**Scaling to 10,000 families:**
- Llama 3.1: ~$150/month
- Firebase: ~$2,200/month
- Google Maps: ~$500/month
- **Total: ~$2,850/month** or $0.29 per family

### 25.2 Cost Optimization Strategies

**1. Caching:**
```javascript
// Cache common LLM responses
const responseCache = new Map();

async function getCachedResponse(message) {
  const cacheKey = hashMessage(message);
  
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }
  
  const response = await llmService.processMessage(message);
  responseCache.set(cacheKey, response);
  
  return response;
}
```

**2. Batch Operations:**
```javascript
// Batch Firestore writes
const batch = db.batch();

notifications.forEach(notif => {
  const ref = db.collection('notifications').doc();
  batch.set(ref, notif);
});

await batch.commit();  // Single write operation
```

**3. Efficient Queries:**
```javascript
// ❌ Bad: Fetch all tasks then filter in app
const allTasks = await db.collection('tasks').get();
const userTasks = allTasks.docs.filter(d => d.data().userId === userId);

// ✅ Good: Filter in database
const userTasks = await db.collection('tasks')
  .where('userId', '==', userId)
  .get();
```

**4. Compression:**
```javascript
// Compress images before upload
import ImageResizer from 'react-native-image-resizer';

async function uploadImage(imagePath) {
  const resized = await ImageResizer.createResizedImage(
    imagePath,
    1920,      // Max width
    1080,      // Max height
    'JPEG',    // Format
    80,        // Quality
    0,         // Rotation
    null       // Output path
  );
  
  // Upload resized image (much smaller)
  return await uploadToStorage(resized.uri);
}
```

### 25.3 Revenue Model (Post-MVP)

**Freemium Model:**
- **Free Tier:**
  - Single family group
  - Basic features
  - 100 AI conversations/month
  - Limited voice notes storage (7 days)
  
- **Premium Tier ($4.99/month per family):**
  - Multiple groups (up to 5)
  - Unlimited AI conversations
  - Unlimited voice notes storage
  - Priority notifications
  - Advanced AI features
  - Custom automation
  
- **Family Plan ($9.99/month):**
  - Up to 10 family members
  - Unlimited groups
  - All premium features
  - Family shared storage (50GB)
  - Priority support

**Break-even Analysis:**
- Cost per family: $0.29/month (with Llama) or $2.72/month (with GPT-4)
- Premium revenue: $4.99/month per family
- Profit margin: $4.70/month (Llama) or $2.27/month (GPT-4)
- Break-even: ~100 premium users covers costs for 1,000 free users

---

## 26. Appendices

### 26.1 Glossary

**Key Terms:**

- **AEST/ACST/AWST:** Australian Eastern/Central/Western Standard Time
- **FCM:** Firebase Cloud Messaging (push notifications)
- **Geofencing:** Virtual boundary around a geographic location
- **IANA:** Internet Assigned Numbers Authority (timezone database)
- **LLM:** Large Language Model (AI)
- **Safe Times:** User-configured quiet hours for notifications
- **TTS:** Text-to-Speech
- **Wake Word:** Phrase to activate voice assistant ("Hey McCarthy")

### 26.2 Common Pitfalls & Solutions

**Pitfall 1: Hardcoded Family Group References**
- ❌ Problem: Using `familyGroupId` assumes single group
- ✅ Solution: Use `groupIds[]` array with `defaultGroupId`

**Pitfall 2: Timezone Hardcoding**
- ❌ Problem: Checking `if (timezone.startsWith("Australia/"))`
- ✅ Solution: Use Luxon library for all timezone operations

**Pitfall 3: Tightly Coupled External Messaging**
- ❌ Problem: Direct calls to `Linking.openURL('sms:...')`
- ✅ Solution: Use ExternalMessagingService abstraction layer

**Pitfall 4: Hardcoded UI Strings**
- ❌ Problem: `<Text>Create Task</Text>`
- ✅ Solution: Use i18n: `<Text>{t('tasks.create')}</Text>`

**Pitfall 5: Missing Feature Flags**
- ❌ Problem: Conditional logic based on env vars scattered everywhere
- ✅ Solution: Centralized FeatureFlagService

### 26.3 Database Schema Migration Guide (v6 → v7)

**For Existing v6 Implementations:**

If you've already started building with v6 schema, here's how to migrate to v7:

**Migration Script:**

```javascript
// migration_v6_to_v7.js

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function migrateUsersCollection() {
  console.log('Migrating users collection...');
  
  const usersSnapshot = await db.collection('users').get();
  const batch = db.batch();
  
  usersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const userRef = db.collection('users').doc(doc.id);
    
    // 1. Convert familyGroupId to groupIds array
    const groupIds = data.familyGroupId ? [data.familyGroupId] : [];
    const defaultGroupId = data.familyGroupId || null;
    
    // 2. Add new fields
    batch.update(userRef, {
      groupIds: groupIds,
      defaultGroupId: defaultGroupId,
      currency: data.currency || 'AUD',
      locale: data.locale || 'en-AU',
      defaultShoppingListId: data.defaultShoppingListId || null,
      // Remove old field
      familyGroupId: admin.firestore.FieldValue.delete()
    });
  });
  
  await batch.commit();
  console.log(`Migrated ${usersSnapshot.size} users`);
}

async function migrateGroupsCollection() {
  console.log('Migrating groups collection...');
  
  const groupsSnapshot = await db.collection('groups').get();
  const batch = db.batch();
  
  groupsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const groupRef = db.collection('groups').doc(doc.id);
    
    // Add new fields
    batch.update(groupRef, {
      adminIds: data.createdBy ? [data.createdBy] : [],
      createdBy: data.createdBy || null,
      pollIds: [],
      projectIds: [],
      privateThreadIds: [],
      settings: {
        allowMemberInvites: true,
        requireApprovalForJoin: false,
        allowPolls: false,
        allowPrivateThreads: false,
        allowTaskAssignment: true,
        allowProjectManagement: false,
        messageDeletionPolicy: "sender_only",
        taskVisibility: "all"
      }
    });
  });
  
  await batch.commit();
  console.log(`Migrated ${groupsSnapshot.size} groups`);
}

async function migrateMessagesCollection() {
  console.log('Migrating messages collection...');
  
  const messagesSnapshot = await db.collection('messages').get();
  const batch = db.batch();
  
  messagesSnapshot.docs.forEach(doc => {
    const messageRef = db.collection('messages').doc(doc.id);
    
    // Add thread fields (null for main group messages)
    batch.update(messageRef, {
      parentGroupId: null,
      threadId: null
    });
  });
  
  await batch.commit();
  console.log(`Migrated ${messagesSnapshot.size} messages`);
}

async function migrateTasksCollection() {
  console.log('Migrating tasks collection...');
  
  const tasksSnapshot = await db.collection('tasks').get();
  const batch = db.batch();
  
  tasksSnapshot.docs.forEach(doc => {
    const taskRef = db.collection('tasks').doc(doc.id);
    
    // Add groupId field (null for personal tasks)
    batch.update(taskRef, {
      groupId: null
    });
  });
  
  await batch.commit();
  console.log(`Migrated ${tasksSnapshot.size} tasks`);
}

async function migrateShoppingListsCollection() {
  console.log('Migrating shopping lists collection...');
  
  const listsSnapshot = await db.collection('shopping_lists').get();
  const batch = db.batch();
  
  listsSnapshot.docs.forEach(doc => {
    const listRef = db.collection('shopping_lists').doc(doc.id);
    
    // Add isDefault field (mark first list as default)
    batch.update(listRef, {
      isDefault: false  // Manually set one to true per user
    });
  });
  
  await batch.commit();
  console.log(`Migrated ${listsSnapshot.size} shopping lists`);
}

async function runMigration() {
  try {
    console.log('Starting v6 → v7 migration...');
    console.log('---');
    
    await migrateUsersCollection();
    await migrateGroupsCollection();
    await migrateMessagesCollection();
    await migrateTasksCollection();
    await migrateShoppingListsCollection();
    
    console.log('---');
    console.log('Migration complete!');
    console.log('');
    console.log('IMPORTANT: Test thoroughly before deploying to production!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration
runMigration();
```

**Run Migration:**
```bash
node migration_v6_to_v7.js
```

**IMPORTANT:** Test migration on a copy of your database first!

### 26.4 V2/V3 Extension Guide

**Adding Multiple Groups (V2):**

1. **Enable feature flag:**
```javascript
await featureFlags.enableFeature('multipleGroups');
```

2. **UI Changes:**
- Add "Create Group" button (already hidden by feature flag)
- Add group selector/switcher
- Update navigation to show all groups

3. **Backend Changes:**
- None needed! Schema already supports multiple groups
- Just populate more IDs in `groupIds` array

4. **Testing:**
- Create 2+ groups per user
- Test switching between groups
- Test tasks/messages in different groups

**Adding Polls (V2):**

1. **Create polls collection:**
```javascript
{
  pollId: "poll_123",
  groupId: "group_xyz789",
  question: "Where should we go for dinner?",
  options: [
    { id: "opt_1", text: "Italian", votes: ["user_1", "user_2"] },
    { id: "opt_2", text: "Chinese", votes: ["user_3"] },
    { id: "opt_3", text: "Mexican", votes: [] }
  ],
  createdBy: "user_abc123",
  createdAt: "2025-11-10T18:00:00Z",
  closesAt: "2025-11-11T18:00:00Z",
  status: "active"  // "active" | "closed"
}
```

2. **Update groups collection:**
```javascript
// Polls are already supported!
await db.collection('groups').doc(groupId).update({
  pollIds: admin.firestore.FieldValue.arrayUnion(pollId)
});
```

3. **Enable feature flag:**
```javascript
await featureFlags.enableFeature('polls');
```

4. **UI Changes:**
- Add "Create Poll" button (already hidden by feature flag)
- Add poll display component
- Add voting interface

**Adding Twilio Automation (V2):**

1. **Implement Twilio provider in ExternalMessagingService:**
```javascript
// Already has abstraction layer!
async sendViaTwilio(phone, message) {
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  const result = await twilioClient.messages.create({
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: message
  });
  
  return {
    method: 'twilio',
    status: 'sent',
    messageId: result.sid,
    cost: 0.0079  // $0.0079 per SMS
  };
}
```

2. **Enable feature flag & switch provider:**
```javascript
await featureFlags.enableFeature('automatedMessaging');
process.env.EXTERNAL_MSG_PROVIDER = 'twilio';
```

3. **No UI changes needed!** Abstraction layer handles it.

**Adding Translation (V3):**

1. **Add translation files:**
- Create `fr.json`, `es.json`, etc.
- Translate all strings from `en.json`

2. **Import in i18n config:**
```javascript
import fr from './locales/fr.json';
import es from './locales/es.json';

i18n.init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es }
  },
  // ...
});
```

3. **Add language selector to Settings:**
```javascript
// Already implemented! See Section 5.7
```

4. **Enable feature flag:**
```javascript
await featureFlags.enableFeature('translation');
```

5. **No code changes needed!** All strings already use `t()`.

---

## Conclusion

This comprehensive specification provides everything needed to build McCarthy MVP 1 with a solid architectural foundation that prevents expensive rebuilds in V2/V3.

**Key Takeaways:**

1. ✅ **"Design for V3, implement for MVP"** - Architecture supports future features without rewrites
2. ✅ **Abstraction layers** - LLM, external messaging, i18n ready for provider swaps
3. ✅ **Feature flags** - Enable/disable features without code deployments
4. ✅ **Database schema** - Supports multiple groups, threads, polls without migrations
5. ✅ **Cost-optimized** - $24-272/month for 100 families (Llama vs GPT-4)
6. ✅ **12-week timeline** - Achievable with clear roadmap

**Next Steps:**

1. Developer reviews this spec and Pre-Flight Checklist
2. Setup development environment
3. Begin Phase 1: Foundation (Weeks 1-4)
4. Weekly progress reviews
5. Beta launch with 10-20 families
6. Iterate based on feedback
7. Public launch (Australian market)
8. V2 planning begins after MVP validation

**Questions?**

Contact: [Your Contact Info]

---

**Document Version:** 7.0  
**Last Updated:** November 10, 2025  
**Author:** John Hutchison  
**Developer:** [To be assigned]

**COPYRIGHT © 2025 JOHN HUTCHISON. ALL RIGHTS RESERVED.**

