# Response to Developer: McCarthy MVP Direction

**Date:** November 9, 2025  
**Re:** Your technical recommendations and MVP scope refinement

---

## Thank You

First, thank you for the thoughtful technical recommendations and cost-conscious approach. You're thinking exactly right about keeping MVP costs manageable while building a solid foundation. After reviewing your suggestions and doing deeper product planning, here's where we've landed:

---

## MAJOR SCOPE REFINEMENT

### We've Simplified MVP 1 Significantly

**Original thinking:** Try to do everything at once (global families, complex group coordination, advanced features)

**New thinking:** Focus on proving core value first, then expand

**MVP 1 Focus (Months 1-3):**
- Australian market only (where I live, where we'll test)
- Individual + basic family features
- Voice + text interaction with McCarthy
- Personal task management
- Calendar integration
- Simple in-app family messaging
- Location awareness & context
- Weather/traffic notifications

**Moving to V2 (Months 4-6):**
- Global families (multi-country coordination)
- Complex group features (soccer teams, extended family, etc.)
- Polls and voting
- Private threads (Secret Santa coordination)
- Currency conversion
- Translation
- Advanced project management

**Why this matters:** Much more achievable in 12 weeks, lets us validate core experience before adding complexity, and drastically reduces MVP costs.

---

## YOUR RECOMMENDATIONS - OUR DECISIONS

I've gone through each of your suggestions with my product advisor. Here's what we're doing:

### ✅ **APPROVED - Do These:**

1. **React Native 0.76+** - Agreed. Future-proof architecture worth it.

2. **Consolidated geolocation** (react-native-geolocation-service only) - Agreed. Drop the deprecated library.

3. **Privacy documentation** - Absolutely critical. Concrete policies for transcripts, location data, retention periods before launch.

4. **Open-Meteo for weather** - Let's try it. If data quality is good for Australia, we save on API costs. OpenWeatherMap free tier is backup.

5. **openWakeWord for wake word detection** - Start with this. Test accuracy extensively. We'll use Porcupine as fallback only if openWakeWord has too many false positives/negatives. (False positives kill user trust fast.)

6. **OSRM or HERE for routing** - Test for Australian traffic data quality first. Google Maps free tier ($200 credit) is backup if free alternatives don't have good enough traffic data for our notifications.

### ✅ **APPROVED WITH ARCHITECTURE REQUIREMENT:**

7. **Llama 3.1 via managed service (Replicate/Together.ai) for conversations**

   **Decision:** Start with Llama 3.1, BUT we must architect with LLM abstraction layer so switching to GPT-4 Turbo (or Claude, or others) is just a config change, not a code rewrite.

   **Why Llama first:**
   - Much cheaper (~$0.001-0.005 per conversation vs ~$0.02 for GPT-4)
   - Lets us validate concept without burning cash
   - 100 families × 300 conversations/month = $90-150/mo (Llama) vs $600/mo (GPT-4)

   **Why keep GPT-4 option ready:**
   - If conversation quality isn't good enough with Llama
   - If function calling is unreliable
   - If proactive intelligence feels "dumb"
   - We need ability to upgrade seamlessly

   **Architecture requirement:**
   ```
   McCarthy App
        ↓
   [LLM Service Layer] ← Abstraction layer
        ↓
   ┌─────────────┬──────────────┬─────────────┐
   │ Llama 3.1   │ GPT-4 Turbo  │ Claude      │
   │ (Replicate) │ (OpenAI)     │ (Anthropic) │
   └─────────────┴──────────────┴─────────────┘
   ```

   Should be as simple as:
   - Environment variable: `LLM_PROVIDER=replicate` or `LLM_PROVIDER=openai`
   - Config file with API keys
   - No code changes to swap providers

### ⚠️ **MODIFIED RECOMMENDATION:**

8. **Native SMS/email intents for external messaging**

   **Decision:** Use native intents for MVP 1, BUT design UI/UX assuming we'll add Twilio/SendGrid in V2.

   **Why native for MVP:**
   - Saves ~$150-200/month during testing
   - Validates if families actually want McCarthy to draft messages
   - Zero infrastructure complexity

   **The compromise:**
   - User approves message → McCarthy opens native SMS/email app with pre-filled message → user taps send
   - It's not fully automated, but acceptable for MVP testing
   - Design the approval flow UI so swapping to Twilio backend later is seamless

   **When we add Twilio (probably V2):**
   - Same approval UI in app
   - But McCarthy sends directly instead of opening native app
   - True hands-free experience

### ❌ **NOT FOR MVP:**

9. **Vosk/Coqui STT offline fallback** - V2 feature. Native speech APIs are excellent quality and free. Don't add complexity for offline mode until we validate core online experience.

---

## CRITICAL NEW REQUIREMENTS

These weren't in original spec but are now **mandatory for MVP 1:**

### 1. **Time Zone Support**

**Why:** Australia has 3 time zones (AEST, ACST, AWST). Even local Australian families can be in different states.

**Requirements:**
- Each user configures their time zone in profile
- McCarthy respects time differences: "Don't message Tom before 8 AM his time"
- Notifications respect user's local time
- Calendar events show in user's local time

**Examples:**
- Sarah in Sydney (AEST)
- Tom in Adelaide (ACST - 30 min behind)
- Amy in Perth (AWST - 2 hours behind)
- McCarthy knows: "Tom's 8 AM = Sarah's 8:30 AM = Amy's 10 AM"

### 2. **Safe Times / Do Not Disturb Mode**

**What it is:** Like iOS Focus Mode / Android Do Not Disturb

**Requirements:**
- User configures quiet hours (e.g., "10 PM - 7 AM, don't disturb me")
- McCarthy holds non-urgent notifications until safe time
- URGENT messages override (e.g., "Dad in hospital" - these come through immediately)
- Integrate with device DND settings (optional - respect if user has Focus Mode on)

**User controls:**
- Set quiet hours per day (weekday vs weekend schedules)
- Define what counts as "URGENT" (family emergencies only? Or also calendar conflicts?)
- Toggle: "Override DND for specific people" (e.g., always allow notifications from spouse)

### 3. **In-App Messaging as Primary Communication**

**Critical architectural decision:** McCarthy's primary communication channel is in-app messaging, NOT SMS/WhatsApp.

**Why this matters:**
- Much cheaper (Firebase messaging vs SMS costs)
- Better UX (everything in one app)
- McCarthy can participate in conversations
- Network effects (families invite families to get on McCarthy)

**Architecture:**
- In-app messaging for family/team (anyone using McCarthy)
- SMS/email only for external contacts (people NOT on McCarthy)
- Push notifications via FCM (Firebase Cloud Messaging - free/cheap)

**Example:**
- Sarah: "McCarthy, tell the family I'm bringing pizza home"
- If family members have McCarthy: In-app message (FREE) ✅
- If family member doesn't have McCarthy: SMS fallback (costs $0.01) + invite to join McCarthy

**MVP 1 Features:**
- Basic family group chat
- Push notifications
- Read receipts
- McCarthy participates in chats ("I've added 'pick up pizza' to your tasks")

**NOT in MVP 1 (V2):**
- Multiple groups (just one family group for now)
- Private threads
- Message reactions/emojis
- File sharing beyond photos

---

## REVISED MVP 1 COST ESTIMATE

With your recommendations + simplified scope:

```
Monthly Operating Costs (MVP 1, 100 families):
├─ Llama 3.1 (Replicate):    $50-150   (conversations)
├─ In-app messaging:          $0-25     (Firebase)
├─ External SMS:              $30-80    (much less volume)
├─ Email:                     $0-20     (SendGrid free tier)
├─ Wake word:                 $0        (openWakeWord, free)
├─ Backend:                   $0-50     (Railway free tier → paid)
├─ Database:                  $0-25     (Supabase free tier → paid)
├─ Weather:                   $0        (Open-Meteo or OWM free tier)
├─ Traffic:                   $0-20     (OSRM free or Google credit)
└─ Total:                     $80-370/month
```

**Much more manageable than original estimates** ($340-1,050 with GPT-4).

**Revenue (Conservative):**
- 100 families × £19.99/month = £1,999/month (~$2,600 USD)
- Costs: $80-370/month
- Margin: 71-97% ✅

**This works.** We can bootstrap MVP 1 sustainably.

---

## DEVELOPMENT PRIORITIES

### Phase 1 (Weeks 1-4): Foundation
- React Native 0.76 setup
- User authentication & profiles (with time zone selection)
- Voice interaction (openWakeWord + native speech APIs)
- Text chat interface
- LLM integration (Llama 3.1 via Replicate) with abstraction layer

### Phase 2 (Weeks 5-8): Core Features
- Calendar integration (read, create, conflict detection)
- Task management & reminders
- Location awareness (geolocation-service)
- Weather/traffic context (Open-Meteo/OSRM)
- Safe times / DND logic

### Phase 3 (Weeks 9-12): Family Coordination
- In-app family messaging (Firebase)
- External messaging (native intents)
- Context-aware notifications
- Proactive suggestions
- Beta testing with 10-20 families

---

## KEY ARCHITECTURAL PRINCIPLES

1. **Build for swap-ability:**
   - LLM abstraction layer (easy to switch providers)
   - Messaging abstraction (native intents → Twilio later)
   - Weather/traffic abstraction (easy to swap providers)

2. **Start simple, add complexity later:**
   - One family group (not multiple groups)
   - Australian market only (not global)
   - Core features only (not advanced project management)

3. **Design for future features:**
   - Database schema supports multiple groups (just don't expose in UI yet)
   - Message approval UI works for both native intents and Twilio
   - User profile has fields for language/currency (unused in MVP, ready for V2)

4. **Minimum viable, maximum testable:**
   - Every feature should validate a hypothesis
   - If feature doesn't help us learn, cut it
   - Focus on proving: "Do families want an AI coordinator?"

---

## QUESTIONS FOR YOU

1. **Llama 3.1 provider:** Replicate or Together.ai? Do you have experience with either? Which has better function-calling support?

2. **Wake word accuracy:** Have you tested openWakeWord? What's your confidence it'll work well for "Hey McCarthy"?

3. **Firebase experience:** Comfortable building real-time chat with Firebase? Any concerns?

4. **Development timeline:** Does 12 weeks feel realistic for this scope? What's your biggest concern?

5. **LLM abstraction layer:** Do you have a preferred approach for making LLM providers swappable? (Service interface pattern? Strategy pattern? Config-driven?)

---

## WHAT WE'RE NOT DOING (V2)

So you don't spend time on these yet:

- ❌ Multiple groups (soccer team, school, etc.)
- ❌ Polls & voting
- ❌ Private threads
- ❌ Multi-timezone coordination (beyond basic time zone awareness)
- ❌ Currency conversion
- ❌ Translation
- ❌ WhatsApp integration
- ❌ Phone calls (Twilio Voice)
- ❌ Complex project management
- ❌ Shopping integration (product search)

All of these are V2 (Months 4-6) after we validate MVP 1.

---

## NEXT STEPS

1. **Review this direction** - Does this make sense? Any concerns?
2. **I'll send updated spec** - McCarthy_PA_Developer_Spec_v6.pdf with all these changes
3. **Architecture discussion** - Let's chat about LLM abstraction layer approach
4. **Timeline confirmation** - Confirm 12-week timeline is realistic
5. **Begin Week 0** - Environment setup, architecture decisions, dependencies

---

## Bottom Line

Your cost-conscious recommendations were spot-on. We're going with most of them. The key changes:

✅ **Simplified scope** - Australian market, basic family features only  
✅ **Minimum cost** - Llama, open-source tools, free tiers where possible  
✅ **Smart architecture** - Easy to swap providers, upgrade features later  
✅ **Time zones + DND** - Critical for even local Australian families  
✅ **In-app messaging** - Much cheaper than SMS/WhatsApp integration  

**Target MVP 1 costs:** $80-370/month (depending on usage)  
**Target timeline:** 12 weeks  
**Target testing:** 10-20 Australian families  

Let's build something great. Questions?

---

**Ready to proceed?**
