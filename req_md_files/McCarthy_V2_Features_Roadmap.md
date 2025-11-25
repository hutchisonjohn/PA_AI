# McCarthy V2 Features - Post-MVP Roadmap
## Advanced Group Coordination & Global Scale

**Version:** V2 Planning Document  
**Target Timeline:** Months 4-6 (after MVP 1 validation)  
**Prerequisites:** MVP 1 successful (100+ families, 90%+ retention)

---

## V2 Strategic Goals

**What V2 Adds:**
1. **Multiple Groups** - Beyond single family group
2. **Complex Coordination** - Polls, voting, private threads
3. **Automated Messaging** - Twilio/SendGrid (replace native intents)
4. **Enhanced Intelligence** - Advanced project management
5. **Shopping Integration** - Product search, price comparison

**Why Wait for V2:**
- MVP 1 validates core personal assistant value
- Prove families want AI coordinator before adding complexity
- Build strong foundation first
- Each phase funds the next

**V2 Success Metrics:**
- 100-500 families using daily
- Average 3+ groups per family
- Complex projects coordinated successfully
- 50%+ users adopt automated messaging

---

## 1. Multiple Custom Groups

### 1.1 Group Types

**Beyond Family:**

| Group Type | Example | Use Case |
|---|---|---|
| Family | "The Hutchisons" | Core family coordination |
| Extended Family | "Hutchison Extended" | Grandparents, aunts, uncles, cousins |
| Sports Team | "U12 Soccer Team" | Coach coordinating with parents |
| School | "Year 5 Parents" | School event coordination |
| Friends | "Poker Night Crew" | Social event planning |
| Work Team | "Marketing Team" | Business coordination |
| Community | "Street Christmas Lights" | Neighborhood projects |
| Interest Group | "Book Club" | Hobby coordination |

**User Experience:**
- User creates new group
- Invites members (via SMS/email or McCarthy username)
- Members accept invitation
- Group appears in groups list
- Each group has own chat, tasks, calendar

### 1.2 Group Management Features

**Group Creation:**
```
User: "Create a new group"
McCarthy: "What type of group?"
User: "Soccer team"
McCarthy: "What's the group name?"
User: "Panthers U12 Soccer"
McCarthy: "Who should I invite?"
User: "Tom, Sarah, Mike, Jenny..."
McCarthy: "Creating Panthers U12 Soccer and sending invitations."
```

**Group Features:**
- Custom group names
- Group type selection
- Group photos/avatars
- Member roles (admin, member)
- Member permissions (who can add members, create tasks, etc.)
- Group descriptions
- Member list

**Admin Controls:**
- Add/remove members
- Assign admin roles
- Configure group settings
- Archive/delete group
- Export group data

### 1.3 Multi-Group Navigation

**UI Challenge:** User in 5+ groups needs easy navigation

**Solutions:**
- Groups sidebar/drawer
- Recent groups (most active)
- Favorite/pin groups
- Group search
- Unread badge counts per group
- Group color coding

**Voice Navigation:**
- "Show me my soccer team chat"
- "Post to book club group"
- "What's happening in the extended family group?"

### 1.4 Group-Specific Settings

**Per-Group Preferences:**
- Notification settings (mute, urgent only, all)
- Display name (might use different name in different groups)
- Role in group (coach, parent, member, etc.)
- Visibility settings

**Example:**
- In "Family" group: Sarah uses real photo, full name
- In "Work" group: Sarah uses professional photo, formal name
- In "Poker Night" group: Sarah uses nickname, casual photo

---

## 2. Polls & Voting System

### 2.1 Simple Polls

**Use Cases:**
- "Pizza or pasta for dinner?"
- "Saturday or Sunday for the game?"
- "Who can bring dessert?"

**Features:**
- Multiple choice (select one)
- Multiple select (select many)
- Yes/No questions
- Anonymous voting (optional)
- Deadline for voting
- Real-time results
- Notification when poll created

**Voice Creation:**
```
User: "Create a poll in family group"
McCarthy: "What's the question?"
User: "Where should we go for dinner?"
McCarthy: "What are the options?"
User: "Italian, Chinese, Mexican"
McCarthy: "When should voting close?"
User: "6 PM tonight"
McCarthy: "Poll created! I'll remind everyone."
```

**Text Creation:**
- Interactive poll builder in chat
- Add question
- Add options (2-10 options)
- Set deadline
- Set anonymous or named voting
- Post to group

**Voting:**
- Tap option to vote
- See who voted what (unless anonymous)
- Change vote before deadline
- Get notification when deadline approaches
- Auto-close at deadline

**Results:**
```
McCarthy in group chat:
"Dinner poll closed! Results:
🍝 Italian: 3 votes (Tom, Sarah, Amy)
🥡 Chinese: 1 vote (Mike)
🌮 Mexican: 2 votes (Jenny, Chris)

Italian wins! Want me to find Italian restaurants nearby?"
```

### 2.2 Availability Polls

**Specific for scheduling:**

```
User: "When can everyone meet for the party planning?"
McCarthy: "I'll check everyone's availability."
[McCarthy checks calendars of all group members]
McCarthy: "Here are times when everyone's free:
- Saturday 2-4 PM ✅ (all 6 people free)
- Sunday 10 AM-12 PM ✅ (all 6 people free)
- Monday 7-9 PM ⚠️ (4 people free, Tom & Sarah busy)

Should I create a poll for the first two options?"
```

**Features:**
- Calendar integration
- Show who's free when
- Suggest best times
- One-click poll creation
- Auto-schedule when majority votes

### 2.3 Task Assignment Voting

**Democratic task distribution:**

```
User: "We need someone to bring snacks to soccer practice"
McCarthy: "Should I poll the team?"
User: "Yes"
McCarthy: [Creates poll] "Who can bring snacks to practice Saturday?"

Team members vote:
- "I can" (volunteer)
- "If no one else" (backup)
- "Can't this week" (unavailable)

McCarthy: "Tom and Sarah volunteered! Tom, you're confirmed for snacks. Sarah is backup."
```

---

## 3. Private Threads

### 3.1 Secret Santa Coordination

**The Classic Use Case:**

**Challenge:** Coordinate Secret Santa without revealing assignments in main group chat.

**Solution: Private Threads**

```
User (to McCarthy privately): "Set up Secret Santa for book club"
McCarthy: "Got it! I'll handle the assignments privately."
[McCarthy creates private threads with each participant]

McCarthy to Tom: "Your Secret Santa recipient is Sarah. Budget is $30. Should I suggest gift ideas based on her interests?"

McCarthy to Sarah: "Your Secret Santa recipient is Mike. Budget is $30. Need help brainstorming?"

[Main group chat - McCarthy posts publicly]:
"Secret Santa is set up! Everyone has their assignments. Budget: $30. Deadline: Dec 20."
```

**Features:**
- McCarthy assigns randomly
- Each person gets private thread with McCarthy
- Gift idea suggestions
- Purchase tracking
- Reminder before deadline
- Reveal party coordination

### 3.2 Surprise Party Planning

**Another Classic:**

```
User: "Plan a surprise birthday party for Sarah"
McCarthy: "I'll create a private planning thread."
[Creates private group thread - everyone EXCEPT Sarah]

Private Thread Members: Tom, Mike, Jenny, Chris (NOT Sarah)

McCarthy in private thread:
"Planning surprise party for Sarah. Her birthday is Nov 25.
- Who can host?
- What date works (not her actual birthday)?
- Theme ideas?
- Should I coordinate gift collection?"

[Sarah doesn't see any of this]

McCarthy to Sarah (in main group):
[Acts normal, no hints about party]
```

**Features:**
- Exclude specific members
- Temporary private groups
- Reveal/merge back to main group after event
- Task coordination in private thread
- McCarthy keeps secret (doesn't mention in main chat)

### 3.3 Sensitive Discussions

**Use Cases:**
- Discussing gift for group member
- Planning intervention/support for member
- Coordinating medical care for family member
- Work discussions not for whole team

**Features:**
- Create private sub-thread within group
- Select which members included
- Temporary or permanent private threads
- Privacy indicators (who can see what)
- Export/archive private threads

---

## 4. Complex Project Management

### 4.1 Multi-Phase Projects

**Example: Family Cruise Planning**

**Project Phases:**
1. **Research** (Months 1-2)
   - Destination options
   - Date options
   - Budget estimation
   - Cruise line comparison

2. **Decision** (Month 3)
   - Poll for destination
   - Poll for dates
   - Poll for cruise line
   - Book cruise

3. **Planning** (Months 4-6)
   - Assign pre-cruise tasks
   - Book flights
   - Arrange transport to port
   - Shore excursions
   - Packing lists

4. **Execution** (Month 7)
   - Departure reminders
   - Documents checklist
   - Day-of coordination

**McCarthy Project Management:**
```
User: "Create a project for our family cruise"
McCarthy: "I'll help you plan the cruise. Let's start with research phase."

Research Phase:
- McCarthy creates tasks: "Research Caribbean cruises", "Get quotes", etc.
- Assigns to family members
- Sets deadlines
- Tracks completion

Decision Phase:
- McCarthy: "Research complete! Ready to make decisions."
- Creates polls for destination, dates, cruise line
- Aggregates votes
- Makes recommendation

Planning Phase:
- McCarthy breaks down pre-cruise tasks
- Assigns automatically based on past patterns
- Sends reminders based on deadlines
- Coordinates dependencies ("Book flights after cruise booked")

Execution Phase:
- McCarthy sends proactive reminders
- Checks off completed items
- Alerts if anything missed
```

**Features:**
- Multi-phase projects
- Task dependencies ("Task B needs Task A done first")
- Milestone tracking
- Progress visualization
- Automatic task assignment based on patterns
- Deadline management
- Budget tracking

### 4.2 Task Aggregation

**Use Case: Soccer Team Shirt Sizes**

**Challenge:** Collect information from 15 families

**Old Way:** Group chat chaos
```
Coach: "Everyone reply with shirt size"
[15 separate replies over 3 days]
[Coach manually tracks in spreadsheet]
```

**McCarthy Way: Task Aggregation**
```
Coach: "Collect shirt sizes from the team"
McCarthy: "I'll ask everyone and aggregate the responses."

[McCarthy sends to each family]:
"What size soccer shirt does [child's name] need?"

[As responses come in, McCarthy aggregates]:
McCarthy to Coach: "Shirt sizes collected:
- Small: 3
- Medium: 7
- Large: 4
- X-Large: 1

Full list: [shows individual responses]
Ready to place order?"
```

**Features:**
- One-question tasks sent to multiple people
- Automatic aggregation
- Real-time progress tracking
- Reminder to non-responders
- Summary report generation
- Export to spreadsheet

**More Examples:**
- "Collect dietary restrictions for party"
- "Get everyone's availability for tournament weekend"
- "Confirm attendance for wedding"
- "Collect payments for group gift"

### 4.3 Budget Tracking

**Use Case: Soccer Coach Gift**

```
Coach left team. Parents want to pool money for gift.

McCarthy: "How much should everyone contribute?"
User: "Let's do $20 each from 15 families = $300 total"

McCarthy creates tracking:
Contributed:
✅ Tom & Sarah: $20
✅ Mike: $20
✅ Jenny: $20
⏳ Chris: Pending
⏳ Pat: Pending
... (and 10 more)

McCarthy sends reminders to pending families.
McCarthy to organizer: "13 of 15 families contributed. $260 collected so far."
```

**Features:**
- Set target amount
- Track contributions per person/family
- Send payment reminders
- Multiple payment methods tracking
- Generate receipt/summary
- Automatic follow-ups

---

## 5. Automated External Messaging (Twilio/SendGrid)

### 5.1 The Upgrade from Native Intents

**MVP 1 Experience (Native Intents):**
```
User: "Text Tom I'm running late"
McCarthy: "Here's the draft. Opening messages..."
[Phone switches to SMS app]
[User taps Send manually]
[User switches back to McCarthy]
```

**V2 Experience (Twilio Automation):**
```
User: "Text Tom I'm running late"
McCarthy: "Should I send: 'Hey, running 15 min late. -Sarah'?"
User: "Yes"
McCarthy: "Sent! Tom received your message."
[User stays in McCarthy app]
```

**Why This Matters:**
- True hands-free (driving, cooking)
- No app switching
- Faster workflow
- Actually feels like automation

### 5.2 Twilio SMS Integration

**Technical Implementation:**
```javascript
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendSMSVia Twilio(to, from, message) {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,  // McCarthy's number
      to: to  // Recipient's number
    });
    
    return {
      success: true,
      messageId: result.sid,
      status: result.status,
      cost: 0.0079  // $0.0079 per SMS
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Features:**
- Automated sending (no manual tap)
- Delivery confirmation
- Read receipts (when supported)
- Link tracking (optional)
- Message templates
- Bulk sending (invitations, etc.)
- Cost tracking per message

**User Settings:**
- Enable/disable automated SMS
- Set approval level ("always approve", "auto-send", "confirm urgent only")
- Budget limits (max SMS spend per month)
- Preferred phone number (user can provide their own Twilio number)

### 5.3 SendGrid Email Integration

**For formal/business messaging:**

```javascript
import sendgrid from '@sendgrid/mail';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmailViaSendGrid(to, from, subject, body) {
  try {
    const result = await sendgrid.send({
      to: to,
      from: from,  // User's email (verified)
      subject: subject,
      text: body,
      html: `<p>${body}</p>`
    });
    
    return {
      success: true,
      messageId: result[0].headers['x-message-id'],
      cost: 0.001  // $0.001 per email
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Use Cases:**
- Business communications
- Formal invitations
- School/teacher emails
- Professional networking
- Documents/attachments

**Features:**
- HTML email templates
- Attachments support
- Email tracking (opens, clicks)
- Scheduling (send later)
- Signature management
- CC/BCC support

### 5.4 Cost Management

**User Controls:**
- Monthly budget cap ($50, $100, $200, unlimited)
- Alert at 50%, 75%, 90% of budget
- Automatic pause at budget limit
- Per-message cost display
- Monthly cost report

**Example:**
```
McCarthy: "You've sent 47 SMS this month ($3.71). You're at 37% of your $10 budget."

McCarthy (at 90%): "You've sent 114 SMS ($9.01). You're at 90% of budget. Switch to in-app messaging?"

McCarthy (at 100%): "Budget limit reached. SMS paused. Invite Tom to McCarthy for free messaging?"
```

**Network Effect Strategy:**
- Show cost savings when inviting to McCarthy
- "You've sent Tom 10 SMS ($0.79). Invite him to McCarthy for free messaging?"
- Gamify invitations ("You saved $15 this month by having 3 family members on McCarthy!")

---

## 6. Shopping Integration

### 6.1 Product Search

**MVP 1 Shopping List:**
- Simple text list ("Milk", "Bread", "Eggs")
- No product details
- No prices
- No store info

**V2 Shopping List:**
- Product database integration
- Barcode scanning
- Price comparison
- Store availability

**Example:**
```
User: "Add milk to shopping list"
McCarthy: "Which milk?
- Pura Full Cream 2L ($4.50 at Woolworths, $4.40 at Coles)
- Dairy Farmers Full Cream 3L ($6.20 at Woolworths)
- A2 Milk 1L ($3.80 at Coles)
- Or just add 'milk' without specifics?"
```

**Features:**
- Product autocomplete
- Brand selection
- Size selection
- Price display (current, historical)
- Store availability
- Alternatives suggestion
- Barcode scanning

### 6.2 Price Comparison

**Track Prices Across Stores:**

```
User: "Where's the cheapest milk?"
McCarthy: "Pura Full Cream 2L:
- Coles: $4.40 (cheapest)
- Woolworths: $4.50
- IGA: $4.75

Want directions to Coles?"
```

**Features:**
- Multi-store price database
- Price history tracking
- Deal alerts ("Milk is $1 off this week at Coles")
- Price trends ("Milk has been getting cheaper this month")
- Best time to buy suggestions

### 6.3 Recipe Integration

**Advanced Feature:**

```
User: "Add ingredients for lasagna"
McCarthy: "I found this lasagna recipe. Adding to your list:
- Pasta sheets (not on list) ✅ Added
- Ground beef 500g ✅ Added
- Tomato sauce ✅ Added
- Mozzarella cheese ✅ Added
- Parmesan cheese - You bought this 3 days ago. Still have it?"
User: "Yes, skip that"
McCarthy: "Skipped. 4 items added. Total estimate: $22.50"
```

**Features:**
- Recipe search
- Automatic ingredient extraction
- Check existing inventory (based on recent purchases)
- Quantity calculation (serves 4 vs serves 6)
- Dietary substitutions ("Use turkey instead of beef?")
- Cooking instructions storage

### 6.4 Smart Reordering

**Learning Purchase Patterns:**

```
McCarthy: "You buy milk every Wednesday. Want me to add it to this week's list?"
McCarthy: "You haven't bought eggs in 10 days. Usually you buy them weekly. Add to list?"
McCarthy: "Bread is on sale ($2 vs usual $4). Stock up?"
```

**Features:**
- Purchase frequency learning
- Automatic suggestions
- Sale alerts for regular items
- Bulk buy recommendations
- Subscribe & save suggestions (for regular items)

---

## 7. Global Features (V3 Preview)

**These are V3, but planning here:**

### 7.1 Multi-Country Families

**Example: Hutchison Family**
- John (Australia - Sydney)
- Sarah (UK - London)
- Tom (USA - New York)
- Amy (India - Mumbai)
- Chris (Japan - Tokyo)

**Challenges:**
- 5 time zones
- 4 currencies
- 5 languages
- Cultural differences

**McCarthy Solutions:**
- Automatic time zone conversion for all
- "8 PM" means 8 PM in each person's local time
- Currency conversion for gift pooling
- Translation for multilingual families
- Cultural calendar awareness (holidays, work hours)

### 7.2 Translation

**Real-time translation in group chat:**
```
Sarah (in English): "Can we have a family call tomorrow?"
[McCarthy translates]
Amy (sees in Hindi): "कल हम परिवार के साथ कॉल कर सकते हैं?"
Amy (replies in Hindi): "हाँ, मैं उपलब्ध हूं"
[McCarthy translates]
Sarah (sees in English): "Yes, I'm available"
```

### 7.3 Currency Conversion

**Gift Pooling Example:**
```
Family wants to buy gift for Dad's birthday. Budget: $500 USD total.

McCarthy: "Contributing:
- John (Australia): A$180 (A$120 / $80 USD)
- Sarah (UK): £95 ($120 USD)
- Tom (USA): $120 USD
- Amy (India): ₹10,000 ($120 USD)
- Chris (Japan): ¥18,000 ($120 USD)

Total: $560 USD (over budget by $60)
Should I adjust?"
```

---

## V2 Technical Requirements

### 7.1 Database Schema Updates

**New Collections:**

```javascript
// Groups (extended from MVP 1)
{
  groupId: "group_abc",
  groupType: "soccer_team",  // NEW: not just "family"
  groupName: "Panthers U12",
  memberIds: [...],
  adminIds: [...],
  settings: {
    allowPolls: true,
    allowPrivateThreads: true,
    requireAdminApproval: false
  }
}

// Polls (NEW)
{
  pollId: "poll_123",
  groupId: "group_abc",
  createdBy: "user_123",
  question: "Where should we go for dinner?",
  options: [
    { id: "opt_1", text: "Italian", votes: ["user_123", "user_456"] },
    { id: "opt_2", text: "Chinese", votes: ["user_789"] }
  ],
  anonymous: false,
  deadline: "2025-11-15T18:00:00Z",
  status: "open",  // "open" | "closed"
  createdAt: "2025-11-15T10:00:00Z"
}

// Private Threads (NEW)
{
  threadId: "thread_456",
  parentGroupId: "group_abc",
  threadType: "secret_santa",
  memberIds: ["user_123", "user_456"],  // Subset of group
  excludedIds: ["user_789"],  // Explicitly excluded
  purpose: "Secret Santa planning",
  temporary: true,
  revealDate: "2025-12-25T00:00:00Z",
  createdAt: "2025-11-01T10:00:00Z"
}

// Projects (NEW)
{
  projectId: "proj_789",
  groupId: "group_abc",
  name: "Family Cruise 2026",
  phases: [
    {
      phaseId: "phase_1",
      name: "Research",
      startDate: "2025-11-01",
      endDate: "2025-12-31",
      tasks: ["task_1", "task_2", "task_3"],
      status: "in_progress"
    },
    {
      phaseId: "phase_2",
      name: "Booking",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      tasks: ["task_4", "task_5"],
      status: "pending"
    }
  ],
  budget: {
    total: 10000,
    spent: 2500,
    remaining: 7500,
    currency: "USD"
  },
  createdAt: "2025-11-01T10:00:00Z"
}

// External Messages (extended)
{
  externalMessageId: "ext_msg_123",
  userId: "user_abc",
  recipientPhone: "+61412345678",
  content: "Running late",
  deliveryMethod: "twilio",  // NEW: "twilio" instead of "native_intent"
  status: "delivered",
  cost: 0.0079,
  twilioMessageId: "SMxxxx",
  createdAt: "2025-11-15T10:00:00Z",
  deliveredAt: "2025-11-15T10:00:01Z"
}
```

### 7.2 API Integrations

**New Integrations:**
- Twilio SMS API
- SendGrid Email API
- Product database (Woolworths, Coles API if available, or scraping)
- Recipe API (Spoonacular, Edamam, or similar)

### 7.3 Cost Projections

**V2 Additional Costs (per month, 1,000 families):**

```
Existing MVP 1 costs:    $1,000-1,175
PLUS:

Twilio SMS:
- Average 20 external SMS per family per month
- 1,000 × 20 = 20,000 SMS
- 20,000 × $0.0079 = $158/month

SendGrid Email:
- Average 10 emails per family per month
- 1,000 × 10 = 10,000 emails
- 10,000 × $0.001 = $10/month

Product Database API:
- Lookup API calls
- ~$50-100/month

Recipe API:
- ~$50/month

──────────────────────────────────────
TOTAL V2:                $1,268-1,493/month
```

**Still profitable:**
- Revenue (1,000 families at £19.99): $26,000/month
- Costs: $1,268-1,493/month
- Margin: 94-95% ✅

**Key insight:** Twilio adds only ~$158/month because of network effects (most messages in-app)

---

## V2 Development Timeline

**Month 4: Groups & Polls**
- Week 1-2: Multiple group types implementation
- Week 3: Poll creation & voting system
- Week 4: Group management UI

**Month 5: Private Threads & Projects**
- Week 1-2: Private threads architecture
- Week 3: Secret Santa automation
- Week 4: Basic project management

**Month 6: Automation & Shopping**
- Week 1-2: Twilio/SendGrid integration
- Week 3: Product database integration
- Week 4: Beta testing & polish

---

## V2 Success Criteria

**Adoption:**
- 100-500 families actively using
- 80%+ create multiple groups
- 60%+ use polls weekly
- 30%+ use private threads

**Engagement:**
- Average 3+ groups per family
- 5+ polls created per family per month
- Complex projects successfully coordinated
- 50%+ adopt automated messaging (Twilio)

**Financial:**
- Operating costs $1,200-1,500/month
- Revenue $10,000-26,000/month
- Margin >90%

**Retention:**
- 90%+ 30-day retention
- 85%+ 90-day retention
- <5% monthly churn

---

## Conclusion

V2 transforms McCarthy from "personal assistant" to "coordination platform."

**The Progression:**
- **MVP 1:** Prove AI personal assistant value (individual + basic family)
- **V2:** Add group coordination complexity (multiple groups, polls, projects)
- **V3:** Go global (multi-country, translation, currency)
- **V4:** Become platform (API, integrations, ecosystem)

**Key Principle:** Don't build V2 until MVP 1 is successful. Prove core value first, then add complexity.

---

**END OF V2 FEATURES DOCUMENT**
