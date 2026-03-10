# Life | Ordered - Feature Roadmap Plan

## Strategic Direction
**Option A: Daily Execution Focus** - Position as "The Daily Focus App"
- Tagline: *"See what matters today. Get it done."*
- Hero features: Today screen + Execution Mode + Habit tracking
- Removing: Recipes and Shopping Lists (spinning into separate app)

## Current State Summary

### What's Working
- Today screen unifies tasks, habits, countdowns, and calendar
- Execution Mode provides unique step-by-step focus experience with timers
- Habit tracking with completion history and health analytics
- Clean TypeScript architecture with consistent API layer
- Freemium model implemented with RevenueCat

### Critical Gaps
- **No onboarding/tutorial** - users land on empty Today screen with zero guidance
- **No push notifications** - missing retention mechanism
- **No streaks** - habit tracking has no streak counter despite frequency targets
- **Execution Mode hidden** - Play icon isn't self-explanatory
- **Free tier too generous** - 50 habits, 100 tasks, 10 goals (enough forever)
- **Recipe/shopping integration** - deeply embedded, needs careful extraction

---

## PHASE 1: FOUNDATION (~1 month)
*Goal: Fix onboarding, promote Execution Mode, adjust monetization, add retention mechanics*

### 1.1 Onboarding & First-Run Experience

**Create 3-screen tutorial flow**
- Screen 1: "Welcome to Life | Ordered" - Explain Today screen as daily dashboard
- Screen 2: "Focus with Execution Mode" - Demonstrate step-by-step completion
- Screen 3: "Track Your Habits" - Show habit tracking and analytics
- Store flag in settings: `hasCompletedOnboarding: boolean`
- Show on first launch before routing to Today

**Pre-populate sample tasks**
- 3 starter tasks auto-created on first launch:
  - "Try Execution Mode" (with `isToday: true`)
  - "Explore My Stuff" (with `isToday: true`)
  - "Complete this for your first checkmark" (with `isToday: true`)
- Add sample habit: "Morning stretch" with frequency "every day"
- Mark sample items as dismissible (new field: `isSample: boolean`)

**Files to create/modify**:
- `app/onboarding.tsx` - New onboarding screen with carousel
- `src/constants/sampleData.ts` - Sample tasks/habits definitions
- `src/contexts/SettingsContext.tsx` - Add `hasCompletedOnboarding` setting
- `app/index.tsx` - Route to onboarding if first launch

---

### 1.2 Promote Execution Mode

**Rebrand Play button**
- Replace icon-only button with prominent "START SESSION" button
- Styling: Larger, primary color, text label visible
- Position: Top of Today screen when items exist
- Empty state: Show disabled button with hint "Add items to Today to start"

**Session completion summaries**
- After completing all items in Execution Mode, show modal:
  - "Session Complete! 🎉"
  - Stats: "5 items completed in 42 minutes"
  - Breakdown: "3 tasks, 2 habits"
  - "Back to Today" button
- Store session history in new `ExecutionSession` model:
  - `completedAt: Date`
  - `itemCount: number`
  - `durationMinutes: number`
  - `taskCount: number`
  - `habitCount: number`

**Show completion stats on Today**
- Add compact stats bar below "START SESSION" button
- Display: "Last session: 5 items in 42 min" or "No sessions yet today"
- Show today's total: "3 sessions, 12 items completed today"

**Files to modify**:
- `app/(tabs)/today.tsx` - Update button styling and positioning
- `app/execution.tsx` - Add session tracking and completion modal
- `src/types/models.ts` - Add ExecutionSession interface
- `src/services/api/executionSessions.ts` - New API for session tracking

---

### 1.3 Fix Monetization

**Lower free tier limits significantly**
- Current: 50 habits, 100 tasks, 10 goals
- New: **5 habits, 20 tasks, 3 goals**
- Update `src/constants/tierLimits.ts`

**Consider gating Execution Mode as premium**
- Option A: Full gate - Free users get 3 sessions/week, premium unlimited
- Option B: Trial gate - 7-day free trial, then premium only
- **Recommendation**: 7-day trial approach to let users experience value first
- Add `executionSessionsRemaining` counter for free tier

**Improved tier comparison**
- Show comparison table upfront in subscription screen
- Highlight what free tier gets (limited sessions, basic features)
- Emphasize premium benefits: unlimited sessions, streaks, analytics

**Pricing adjustment**
- Proposed: $6/month or $50/year (instead of current setup)
- Configure in RevenueCat dashboard
- Update subscription screen copy

**Files to modify**:
- `src/constants/tierLimits.ts` - Update all limits
- `app/subscription.tsx` - Add tier comparison table
- `app/execution.tsx` - Gate sessions for free tier
- `src/contexts/SubscriptionContext.tsx` - Add session limit tracking

---

### 1.4 Push Notifications Infrastructure

**Install and configure notifications**
- Add `expo-notifications` package
- Configure iOS/Android notification permissions
- Request permission on first launch (after onboarding)
- Store notification preferences in settings

**Morning notification**
- Schedule: 7am daily (configurable in settings)
- Message: "Good morning! You have 5 items on Today ☀️"
- Action: Deep link to `lifeordered://today`

**Evening check-in**
- Schedule: 8pm daily (configurable)
- Message: "How did your day go? 3 items remaining"
- Action: Deep link to `lifeordered://today`

**Habit streak notifications**
- Trigger: When 1 day away from milestone (7, 14, 30, 100 days)
- Message: "Keep it up! 1 day away from a 7-day streak 🔥"
- Action: Deep link to specific habit

**Overdue task reminders**
- Check daily at 9am for overdue tasks (where `dueDate < today`)
- Message: "Reminder: 'Pay rent' is overdue by 2 days"
- Action: Deep link to task in My Stuff

**Files to create**:
- `src/services/notifications/notificationService.ts` - Core notification logic
- `src/services/notifications/scheduleService.ts` - Scheduling logic
- `app/_layout.tsx` - Add notification listener and deep link handler
- Settings screen - Add notification preferences section

---

### 1.5 Habit Streaks (Hybrid Approach)

**Different tracking for different frequencies**

**Daily habits: Traditional day streaks**
- New field on Habit model: `currentStreak: number` (calculated server-side)
- Algorithm: Count consecutive days with completions
- Display: Fire emoji (🔥) with day count
- Example: "Morning stretch 🔥 30 days"
- Recalculate on each completion

**Weekly+ habits: On-track status with duration + count**
- Leverage existing habit health calculation ("on-track", "at-risk", "behind")
- New field: `onTrackSince: Date` (when habit first became on-track)
- Display: "✅ On track for 4 months • 8 visits"
- Show completion count for the tracking period
- Example: "Visit mom ✅ On track for 6 months • 12 visits"

**Frequency detection logic**:
- Parse `frequencyTarget` field to determine habit type
- "every day", "daily" → Daily habit (use streaks)
- "3 times a week", "weekdays", "monthly", "every 2 months" → Weekly+ habit (use on-track status)
- Default to weekly+ if frequency is unclear

**Universal completion milestones (all habits)**
- Celebrate total completion count regardless of frequency
- Milestones: 10, 25, 50, 100, 365 completions
- Badges:
  - 10 completions: "Getting Started 🌱"
  - 25 completions: "Building Momentum 💪"
  - 50 completions: "Half Century 🎯"
  - 100 completions: "Century Club 💯"
  - 365 completions: "Year Legend 🌟"
- Show badge notification when earned
- Display on habit detail screen

**Visual displays**:
- Habit cards show appropriate metric based on frequency
- Animate fire emoji or checkmark on milestones
- Today screen shows streak/status for today's habits

**Files to modify**:
- `src/types/models.ts` - Add `currentStreak`, `onTrackSince` to Habit
- `src/utils/habitStreaks.ts` - New file for streak calculation and frequency detection
- `src/utils/habitHealth.ts` - Extend to calculate `onTrackSince` duration
- Backend API - Add streak and on-track calculation endpoints
- `app/(tabs)/habits.tsx` - Display streaks/status in habit cards
- `app/(tabs)/today.tsx` - Show appropriate indicator for today's habits

---

### 1.6 Technical Debt - Today Sort Order Persistence

**Fix: Persist `todaySortOrder` when items removed and re-added**
- Current bug: When item removed from Today and re-added, loses sort position
- Solution: Store `lastTodaySortOrder` field that persists across toggles
- On re-add: Restore previous position if `lastTodaySortOrder` exists
- Only reset when user explicitly drags to new position

**Files to modify**:
- `src/types/models.ts` - Add `lastTodaySortOrder?: number` to Task/Habit
- `app/(tabs)/today.tsx` - Update toggle logic to preserve sort order
- Backend API - Persist `lastTodaySortOrder` on update

---

## PHASE 2: DIFFERENTIATION (~2 months)
*Goal: Simplify navigation, remove recipes/shopping, build missing UX features*

### 2.1 Remove Recipes & Shopping Lists

**Complete extraction of food features**

**Files to DELETE**:
- `app/(tabs)/recipes.tsx` - Recipes tab
- `app/recipe-manager.tsx` - Recipe detail/creation modal
- `app/shopping-list.tsx` - Legacy shopping list route
- `src/components/ShoppingListTab.tsx` - Shopping list component
- `src/components/RecipeDetailModal.tsx` - Recipe detail view
- `src/components/AddRecipeDialog.tsx` - Already deleted (seen in git status)
- `src/services/api/recipes.ts` - Recipe API
- `src/services/api/recipeQueue.ts` - Queue API
- `src/services/api/shoppingLists.ts` - Shopping list API

**Files to REFACTOR**:

1. **Today screen** (`app/(tabs)/today.tsx`):
   - Remove recipe queue state and API loading
   - Remove "Recipe Queue" section rendering (lines 1249-1284, 1508-1540)
   - Remove `parseServings` utility import

2. **AddItemContext** (`src/contexts/AddItemContext.tsx`):
   - Remove 'recipe' from `AddItemType` union
   - Remove `AddRecipeHandler` and registration methods
   - Remove recipe-specific handlers

3. **AddItemDialog** (`src/components/AddItemDialog.tsx`):
   - Remove recipe tab/option from item type picker
   - Remove recipe URL input and import logic

4. **App layout** (`app/_layout.tsx`):
   - Remove `recipe-manager` modal route
   - Remove recipe queue state management

5. **Tab layout** (`app/(tabs)/_layout.tsx`):
   - Remove Recipes tab entirely from navigation

6. **Models** (`src/types/models.ts`):
   - Remove Recipe, RecipeQueueItem, ShoppingList, ShoppingListItem interfaces
   - Keep Goal model but remove shopping-specific type variants

7. **API constants** (`src/constants/api.ts`):
   - Remove RECIPES, RECIPE_QUEUE, SHOPPING_LISTS endpoint definitions

**Data migration considerations**:
- Export user recipe data before removal (optional export feature)
- Consider keeping recipe queue data in DB for future import to separate app
- Clear recipe-related tasks from Today screen

---

### 2.2 Simplify Navigation

**Rename tabs for clarity**
- "Goals" → "Projects" (clearer mental model)
- "My Stuff" → "Tasks & Projects" or "Organize" (more descriptive)
- Bring "Habits" into main navigation (currently visible but could be highlighted)

**Consolidate hidden tabs**
- Remove href: null tabs (goals, tasks, countdowns)
- Merge functionality into "Tasks & Projects" tab
- Single unified view with filters/segments

**Reorganize Settings screen**
- Current: Scattered settings with no clear IA
- New structure:
  - **Display**: Theme, start screen, countdown threshold
  - **Automation**: Recurring tasks, auto-add settings
  - **Notifications**: Morning/evening, streaks, overdue
  - **Integrations**: Google Calendar, export data
  - **Account**: Profile, subscription, logout, delete account

**Files to modify**:
- `app/(tabs)/_layout.tsx` - Update tab names and structure
- `app/(tabs)/mystuff.tsx` - Rename and update header
- `app/(tabs)/settings.tsx` - Reorganize into grouped sections

---

### 2.3 Complete Shopping List Migration & Cleanup

**Note**: This may be moot if removing entirely, but included for completeness

If keeping minimal shopping capability:
- Consolidate on Goal+Task approach only
- Remove legacy `ShoppingListItem` model and API
- Create dedicated `ShoppingList` entity (don't overload Goals)
- Add drag-to-reorder within shopping lists
- Per-item quantity and unit fields

If removing entirely:
- Delete all shopping list code (covered in 2.1)

---

### 2.4 Build Recurring Task UI

**Visual RRULE editor**
- Replace raw RRULE string input with visual builder
- Presets: "Daily", "Weekdays", "Weekly", "Monthly", "Custom"
- Custom builder: Frequency picker, day-of-week selector, end date
- Show plain English preview: "Every weekday starting Mar 4, 2026"

**Edit recurring rules after creation**
- Currently: No way to edit RRULE after task created
- New: "Edit Recurrence" button in task edit dialog
- Show current rule and allow modification
- Update `recurrenceRule` field via API

**Files to create**:
- `src/components/RecurrenceRulePicker.tsx` - Visual RRULE editor
- `src/utils/rruleFormatter.ts` - Convert RRULE to plain English

**Files to modify**:
- `src/components/EditItemDialog.tsx` - Add recurrence editor for tasks
- `app/(tabs)/mystuff.tsx` - Show recurrence indicator on task cards

---

### 2.5 Weekly Review Flow

**Sunday evening prompt**
- Notification at 7pm Sunday: "Time for your weekly review 📊"
- Deep link to dedicated review screen
- Can be disabled in settings

**Review screen content**:
- Week completion stats:
  - Tasks completed: X/Y (percentage)
  - Habits completed: X/Y (percentage by frequency target)
  - Execution sessions: X sessions, Y total items
  - Time in execution: Z minutes
- Streak status for all habits
- Top achievements (longest streak, most productive day)
- Reflection prompt: "What went well this week?" (optional notes field)
- Set intention: "What's your focus for next week?" (create goal or task)

**Store review history**:
- New model: `WeeklyReview`
  - `weekStartDate: Date`
  - `tasksCompleted: number`
  - `tasksTotal: number`
  - `habitsCompleted: number`
  - `habitsTotal: number`
  - `executionSessions: number`
  - `reflection?: string`
  - `intention?: string`

**Files to create**:
- `app/weekly-review.tsx` - Review screen
- `src/services/api/weeklyReviews.ts` - API for review data
- `src/types/models.ts` - Add WeeklyReview interface

---

### 2.6 Smart Today Suggestions

**Auto-suggest items for Today based on**:
- **Deadlines**: Tasks due today or within 2 days
- **Recurring patterns**: Tasks completed on same day of week historically
- **Calendar events**: Tasks related to today's meetings/events
- **Habit frequency**: Habits that need completion to stay on track
- **Incomplete countdowns**: Countdowns within threshold

**UI for suggestions**:
- "Suggested for Today" section at top of Today screen
- Swipe to add to Today (similar to reminder suggestions)
- Dismiss button to ignore suggestion
- Show reasoning: "Due tomorrow" or "Usually done on Tuesdays"

**Algorithm considerations**:
- Don't overwhelm: Max 5 suggestions at once
- Prioritize by urgency: deadlines > patterns > habits
- Learn from user: Track acceptance rate, adjust suggestions

**Files to modify**:
- `app/(tabs)/today.tsx` - Add suggestions section
- Backend API - Add `/suggestions/today` endpoint with logic

---

### 2.7 Technical Debt - Legacy Field Names

**Consolidate field naming**:
- Tasks/Habits: `name` → use `title` consistently (already migrated)
- Tasks/Habits: `isOnToday` → use `isToday` consistently (already migrated)
- Remove legacy field support from API if safe
- Update any remaining references in frontend

**Files to audit**:
- `src/types/models.ts` - Remove legacy field aliases
- All API services - Ensure using new field names
- All components - Search for `name` and `isOnToday` references

---

### 2.8 Kill or Complete Captures Feature

**Current state**: Partially implemented, currently disabled

**Decision needed**: Either finish or remove entirely

**Option A - Complete implementation**:
- Finish share extension for iOS/Android
- Enable capture route
- Add batch processing of captures
- Quick add to Today from captures

**Option B - Remove entirely** (Recommended if time-constrained):
- Delete `app/capture.tsx`
- Remove capture-related code from contexts
- Remove share extension code
- Focus on core Today/Execution/Habits experience

**Files affected**:
- `app/capture.tsx`
- `src/contexts/ShareContext.tsx`
- `app/_layout.tsx` - Remove capture deep link handling

---

## PHASE 3: GROWTH (~3 months)
*Goal: Add viral loops, collaboration, integrations*

### 3.1 Shareable Today Summaries

**Beautiful end-of-day cards for social sharing**
- Trigger: After completing all Today items or at end of day
- Design: Instagram Story-style card with:
  - Date and "Daily Wrap"
  - Completion stats: "8/10 items completed"
  - Streak highlights: "🔥 7-day streak on Morning stretch"
  - Session time: "42 minutes in focus mode"
  - Subtle Life | Ordered branding
- Share to: Instagram, Twitter, Facebook, Messages
- "Spotify Wrapped" style - make it aspirational and shareable

**Implementation**:
- Use `react-native-view-shot` to capture card as image
- Use `expo-sharing` to share to social platforms
- Track shares as growth metric

**Files to create**:
- `src/components/DailySummaryCard.tsx` - Card design component
- `src/utils/shareService.ts` - Handle image generation and sharing

---

### 3.2 Collaboration Features

**Shared shopping lists** (if keeping shopping):
- Invite household members to shared list
- Real-time sync of item additions/completions
- Useful for groceries, household tasks

**Household goals/projects**:
- Share Goals with family members
- Assign tasks to specific people
- Track completion by person
- Use cases: chores, trip planning, home projects

**Family task assignment**:
- Parent assigns tasks to kids
- Kid completes, parent reviews
- Allowance tracking integration

**Implementation considerations**:
- Requires backend support for sharing
- WebSocket or polling for real-time sync
- Permissions model (owner, editor, viewer)
- Potential premium feature

---

### 3.3 Integrations & Power User Features

**Zapier/IFTTT integration**:
- Triggers: Task completed, Habit completed, Daily summary
- Actions: Create task, Create habit, Add to Today
- Use cases: Email → Task, Calendar event → Task, GitHub issue → Task

**API for developers**:
- REST API endpoints for external integrations
- OAuth authentication
- Rate limiting
- Documentation with examples

**Export data**:
- CSV export of all tasks, habits, completions
- JSON export for backup/migration
- Scheduled automatic backups to cloud storage

**Import from competitors**:
- Import from Todoist, Things, Habitica
- CSV import with field mapping

---

### 3.4 Advanced Analytics (Premium Feature)

**Enhanced habit analytics**:
- Trend graphs over time
- Correlation analysis (which habits done together)
- Best time of day for completion
- Prediction: likelihood of completing today

**Productivity metrics**:
- Weekly/monthly completion rates
- Average session duration
- Most productive day of week
- Focus time trends

**Goal progress tracking**:
- % tasks complete per project
- Burndown charts
- Estimated completion date based on velocity

**Dashboard screen**:
- New tab or section in Settings
- Charts and visualizations
- Exportable reports

---

### 3.5 Gamification Enhancements

**Badges and achievements**:
- Beyond streak milestones
- Examples:
  - "Early Bird" - 7 days completing before 9am
  - "Night Owl" - 7 days completing after 8pm
  - "Speedster" - Complete all Today items in under 30 min
  - "Perfectionist" - 30 days with 100% completion rate

**Levels and XP**:
- Earn XP for completing tasks/habits
- Level up system with titles
- Unlock new themes or customization options

**Daily challenges**:
- Rotate daily: "Complete 5 habits today"
- Bonus XP or badge for completion
- Opt-in feature (not annoying)

---

## VERIFICATION PLAN

After each phase, verify:

### Phase 1 Verification:
1. **Onboarding**: New test user sees 3-screen tutorial, sample tasks appear on Today
2. **Execution Mode**: "START SESSION" button visible, session summary appears after completion
3. **Monetization**: Free tier limited to 5 habits/20 tasks, upgrade prompt appears correctly
4. **Notifications**: Morning/evening notifications delivered, habit streak notifications fire
5. **Streaks**: Habit completions increment streak, fire emoji appears on cards

### Phase 2 Verification:
1. **Recipes removed**: No recipe tabs, Today screen loads without recipe queue
2. **Navigation**: Tabs renamed, hidden tabs removed, Settings reorganized
3. **Recurring tasks**: Visual editor creates valid RRULE, can edit after creation
4. **Weekly review**: Notification fires Sunday 7pm, review screen shows correct stats
5. **Suggestions**: Today suggestions appear, can add to Today with one tap

### Phase 3 Verification:
1. **Sharing**: Daily summary card generates correctly, shares to social platforms
2. **Collaboration**: Shared lists sync in real-time, assignments work correctly
3. **Integrations**: Zapier triggers fire, API authentication works
4. **Analytics**: Charts display correctly, data exports complete

---

## SUCCESS METRICS

Track these metrics to measure impact:

| Metric | Baseline (Est.) | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|----------------|----------------|----------------|----------------|
| Activation Rate | 20% | 40% | 50% | 60% |
| 7-Day Retention | 30% | 50% | 60% | 65% |
| 30-Day Retention | 15% | 30% | 45% | 60% |
| DAU/MAU Ratio | 30% | 40% | 50% | 55% |
| Free → Premium Conversion | 2% | 5% | 10% | 15% |
| Avg Session Duration | 5 min | 8 min | 10 min | 12 min |
| Execution Mode Adoption | 10% | 50% | 70% | 80% |
| Habit Completion Rate | 60% | 70% | 75% | 80% |
| Premium Churn | 8%/month | 5%/month | 4%/month | 3%/month |

---

## DEPENDENCIES & RISKS

### External Dependencies:
- RevenueCat for subscription processing
- Google OAuth for authentication
- Expo notifications infrastructure
- Backend API for all data operations

### Technical Risks:
1. **Notification permissions**: Users may deny, reducing retention impact
2. **Execution Mode gating**: May reduce adoption if too restrictive
3. **Recipe removal**: Users may churn if they relied on this feature
4. **Streak calculation**: Complex with timezones and frequency targets

### Mitigation Strategies:
- A/B test Execution Mode gating approach
- Export recipe data before removal, communicate change clearly
- Make notification value prop clear before requesting permission
- Test streak calculation thoroughly across timezones

---

## BOTTOM LINE

This roadmap transforms Life | Ordered from a feature-packed productivity suite into a focused "Daily Execution App" by:

1. **Fixing activation** through onboarding and sample data
2. **Promoting hero features** by emphasizing Execution Mode and streaks
3. **Improving retention** via notifications and weekly reviews
4. **Monetizing effectively** with tighter free limits and clearer premium value
5. **Removing distractions** by spinning out recipes/shopping
6. **Growing virally** through shareable summaries and collaboration

The competitive moat is real: No other app combines curated daily list + step-by-step focus + habit tracking with streaks. Execute this plan with focus, and Life | Ordered becomes the definitive daily execution tool.
