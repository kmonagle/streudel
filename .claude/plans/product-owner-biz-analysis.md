# Life | Ordered — Product & Business Analysis

## Executive Summary

Life | Ordered is a React Native mobile app combining habit tracking, task management, goal organization, meal planning, and daily scheduling into a unified experience. Two independent analyses — product strategy and business — converged on the same conclusion:

**The app has exceptional potential hidden behind strategic confusion.** The Today screen and Execution Mode are genuinely unique features that no competitor offers, but they're buried under an unclear value proposition, an overwhelming feature set, weak onboarding, and misaligned monetization.

---

## Feature Inventory

| Feature | Maturity | Status |
|---------|----------|--------|
| Today Screen | High | Multi-section dashboard with habits, tasks, countdowns, calendar, recipes. Drag-and-drop, multi-select, smart sorting, swipeable actions. |
| Execution Mode | Medium | Full-screen focus mode for completing Today items sequentially. Timer support, notes modal, skip/done actions. |
| Tasks/Todos | High | Full CRUD, goal association, recurring support (RRULE), timer field. Auto-add for recurring tasks due today. |
| Habits | Medium | Full CRUD, completion history calendar, habit health analytics (1/3/6 month views), completion counter. |
| Goals | Medium | Container for tasks. Organizational hierarchy but underutilized. |
| Countdowns | Medium | Date tracking — annual recurring or one-time. Configurable display threshold. |
| Recipes | Medium | URL scraping with parsed ingredients/instructions. Queue system for meal planning. Shopping list integration. |
| Shopping Lists | Low | Dual architecture — legacy ShoppingListItem records AND new Goal-based task system. Confusing, incomplete migration. |
| Calendar Sync | Low | Google Calendar integration (premium-only). Read-only. |
| Captures/Share | Low | Partially implemented, currently disabled in code. |

---

## What's Working

- **Today screen brilliantly unifies** habits, tasks, countdowns, recipes, and calendar as a daily operating system
- **Execution Mode is genuinely unique** — no competitor offers curated daily list + step-by-step focus mode with timer
- **Recipe queue → shopping list** auto-generation solves a specific, tangible pain point
- **Habit tracking → analytics → calendar** creates a closed loop for habit formation
- **Recurring tasks auto-appear** on Today, creating a natural daily habit loop
- **Freemium model** lets users experience core value before paying
- **Strong technical foundation** — TypeScript enforced, consistent API layer, clean provider pattern

---

## What's Not Working

### Identity Crisis
The product tries to be three things simultaneously:
1. A daily productivity ritual tool (Today screen)
2. A long-term habit formation platform (analytics)
3. A lifestyle planning hub (recipes + meal prep)

These domains don't naturally integrate, and equal weight to all features dilutes the identity. A user seeking a recipe app wouldn't search for a habit tracker, and vice versa.

### Feature Overlap Confusion
Users encounter three ways to track items — goals with tasks, standalone tasks, and habits — with fuzzy distinctions between them. Goals are also overloaded as containers for shopping lists.

### Weak Onboarding
New users get dumped into an empty Today screen with zero guidance. No tutorial, no sample tasks, no explanation of the information architecture. Estimated activation rate: under 20%.

### Execution Mode Is Hidden
The most valuable feature in the app is triggered by a "Play" icon that isn't self-explanatory. Many users never discover it.

### Monetization Misalignment
- Free tier limits are too generous (50 habits, 100 tasks, 10 goals) — enough for most users forever
- Premium value proposition is unclear — "advanced analytics" barely exists
- Paywall triggers feel punitive rather than aspirational
- No premium trial available

### Missing Retention Mechanics
- No push notifications at all
- No streak tracking or gamification
- No weekly review prompt
- No monthly progress reports
- No milestone celebrations
- No viral loop or social sharing

### Technical Debt
- Shopping list dual architecture (legacy vs. Goal-based) is confusing
- Captures/share extension disabled — half-implemented feature
- Legacy field names in data models (`name` vs `title`, `isOnToday` vs `isToday`)
- No RRULE editor for recurring tasks after creation
- Today sort order lost when items are removed and re-added

---

## Competitive Position

| Competitor | Their Strength | Their Weakness | vs. Life \| Ordered |
|------------|---------------|----------------|---------------------|
| Todoist | Simple, fast, ubiquitous | No habits, no execution mode | Better task management, weaker daily focus |
| Things 3 | Beautiful UI, Mac integration | iOS-only, $50 one-time, no habits | Better design, no subscription |
| Habitica | Gamification, community | Overwhelming, RPG mechanics | Better habits, worse productivity |
| TickTick | Feature-packed, calendar | Cluttered, no focus mode | Feature parity, less focused |
| Motion | AI scheduling | $34/month, complex | Better AI, much more expensive |
| Notion | Flexible, databases, collaboration | Steep learning curve, slow mobile | More powerful but LO is pre-built + mobile-optimized |
| Apple Reminders | Free, integrated | Minimal features | LO has much richer feature set |

**Market gap:** No dominant app combines a curated daily list + step-by-step focus mode + habit tracking + calendar context. Life | Ordered sits between Todoist (task management) and Centered (focus app) with elements of Habitica (habit tracking).

---

## Strategic Recommendations

### The Big Decision: Pick a Lane

Three possible directions:

**Option A: Daily Execution Focus (Recommended)**
Become the best "Today screen" on mobile. Position as "The Daily Focus App." Tagline: *"See what matters today. Get it done."* Sharpest positioning, clearest competitive advantage, easiest to monetize.

**Option B: Lifestyle Hub**
Lean into habits + tasks + meals as a unified daily life manager. Add fitness, nutrition, wellness. Higher complexity, risk of mediocrity.

**Option C: Habit Formation Engine**
Make habits the core. Add streaks, community challenges, gamification. Differentiate from Habitica for adults. Requires social features.

### The Recipe Question
- **Keep** if committing to lifestyle hub positioning
- **Spin off** into a separate "Meal | Ordered" app with cross-promotion (recommended if choosing Option A)
- **Cut** if focusing purely on task/habit execution

---

## Prioritized Action Plan

### Phase 1: Foundation (Weeks 1–4)

**Fix onboarding**
- 3-screen tutorial on first launch
- Pre-populate 3 sample tasks ("Try Execution Mode", "Explore My Stuff", "Complete this for your first checkmark")

**Promote Execution Mode**
- Rename "Play" button to "START SESSION" with visual emphasis
- Add session summaries ("5 items done in 42 minutes")
- Show completion stats on Today screen

**Fix monetization**
- Lower free limits significantly (5 habits, 20 tasks, 3 goals)
- Consider gating Execution Mode as premium with 7-day trial
- Proposed pricing: $6/month or $50/year
- Show tier comparison up-front

**Add push notifications**
- Morning: "You have 5 items on Today"
- Evening: "How did your day go?"
- Habit streaks: "1 day away from a 7-day streak!"
- Overdue: "Pay rent is overdue by 2 days"

**Add habit streaks** — fire emoji, visual progress on Today screen

**Goal:** Activation 20% → 40%, 7-day retention 30% → 50%

---

### Phase 2: Differentiation (Months 2–3)

**Simplify navigation**
- Rename "Goals" → "Projects"
- Rename "My Stuff" to something clearer
- Bring Habits into main navigation (currently hidden)
- Remove or consolidate hidden tabs

**Complete shopping list migration** — consolidate on Goal+Task approach, remove legacy ShoppingListItem system

**Build recurring task UI** — visual rule builder replacing raw RRULE input

**Add weekly review flow** — Sunday evening prompt with completion stats and reflection

**Implement smart Today suggestions** — auto-suggest items based on deadlines, recurring patterns, calendar events

**Kill or complete Captures** — either finish the share extension or remove the dead code

**Goal:** 10% premium conversion rate

---

### Phase 3: Growth (Months 4–6)

**Shareable Today summaries** — beautiful end-of-day cards for social sharing (viral loop like Spotify Wrapped)

**Collaboration features** — shared shopping lists, household goals, family task assignment

**Decide recipe strategy** — spin-off, integrate deeper, or cut

**Integrations** — Zapier/IFTTT for power users

**Goal:** 10,000 MAU with 15% premium conversion

---

## Feature-Specific Recommendations

### Today Screen (Double Down)
- Smart ordering by priority, deadline, and context (not just manual sort)
- AI-powered daily plan generation
- Persist `todaySortOrder` when items are removed (prevents frustration on re-add)
- Rename "In the Background" — it implies low priority but contains high-priority calendar events

### Execution Mode (Promote Heavily)
- Add habit streak counter during execution
- Show goal context (which project this task supports)
- Add difficulty/time estimate display
- Post-session summary with stats

### Goals → Projects (Simplify)
- Rename to "Projects" for clearer mental model
- Add progress tracking (% tasks complete, next deadline)
- Link projects to related habits
- Stop using Goals as shopping list containers

### Habits (Enhance)
- Streaks with fire emoji (Duolingo-style)
- Badges for milestones (30 days, 100 completions)
- Frequency target picker with presets ("Daily", "Weekdays", "3x/week")
- Visual progress chart on Today screen
- Make health scoring algorithm transparent

### Recipes (Strategic Decision Required)
- If keeping: rebrand as "daily life management", add prep time to Today items, meal planning week view
- If spinning off: cross-promote, shared account system, separate subscription
- Either way: improve scraping reliability, add manual grocery item entry

### Shopping Lists (Consolidate)
- Pick one architecture and migrate fully
- Add drag-to-reorder, per-item quantity + unit
- Create dedicated ShoppingList entity (stop overloading Goals)

### Settings (Reorganize)
- Group by use case: Display, Automation, Integrations, Account
- Currently scattered with no clear information architecture

---

## Metrics to Track

| Metric | Target |
|--------|--------|
| Daily Active Users | Baseline + 40% in 6 months |
| 30-Day Retention | 60%+ |
| Feature Adoption | 70%+ recipes used, 50%+ calendar sync |
| Free → Premium Conversion | 5–10% |
| Average Session Duration | 8+ minutes |
| Habit Completion Rate | 70%+ |
| Premium Churn | Under 5% monthly |

---

## Bottom Line

Life | Ordered is a well-built niche product with a strong Today screen and a genuinely unique Execution Mode. The competitive moat is real — no other app combines curated daily list + step-by-step focus + habit tracking + calendar context.

The path forward is focus: pick the "Daily Focus App" lane, promote Execution Mode as the hero feature, fix onboarding and monetization, and add the retention mechanics (notifications, streaks, weekly review) that turn occasional users into daily ones.

The opportunity is real. The execution just needs focus.
