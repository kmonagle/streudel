# Today Planning Wizard ("Plan My Day")

## Context

The Today screen requires navigating multiple tabs (Habits, Tasks, My Stuff) to manually find and add items for the day. While a `buildToday` auto-add utility exists, there is no guided, intentional daily planning flow. This feature introduces a "Plan My Day" wizard — a 3-step full-screen modal launched from the Today screen that walks the user through all their habits, tasks, and upcoming calendar events. The user can quickly toggle items onto Today, do full edits, and create countdowns from calendar events. Inspired by the existing onboarding wizard pattern.

---

## Architecture

### Files to Create
- `mobile/app/plan-day.tsx` — 3-step full-screen wizard modal

### Files to Modify
- `mobile/app/(tabs)/today.tsx` — add "Plan My Day" button to bottom control panel; ensure `loadData()` is called on screen focus (via `useFocusEffect`) so changes from the wizard are reflected on return

### Existing Patterns & Utilities to Reuse
| What | Where |
|------|-------|
| Habit API calls | `mobile/src/services/api/habits.ts` — `habitsApi.getAll()`, `habitsApi.update(id, dto)` |
| Task API calls | `mobile/src/services/api/tasks.ts` — `tasksApi.getAll()`, `tasksApi.update(id, dto)` |
| Countdown creation | `mobile/src/services/api/countdowns.ts` — `countdownsApi.create(dto)` |
| Calendar events | `mobile/src/contexts/CalendarContext.tsx` — `events` array (already loaded) |
| Theme | `mobile/src/contexts/SettingsContext.tsx` — `effectiveTheme` → `Colors[effectiveTheme]` |
| Full item editing | `mobile/src/components/EditItemDialog.tsx` |
| Types | `mobile/src/types/models.ts` — `Habit`, `Task`, `CalendarEvent`, `Goal` |
| Colors | `mobile/src/constants/colors.ts` |
| Calendar-review countdown pattern | `mobile/app/calendar-review.tsx` (reference for countdown creation UX) |

---

## Step-by-Step Implementation

### 1. Create `mobile/app/plan-day.tsx`

**State:**
```ts
const [step, setStep] = useState(0);         // 0=habits, 1=tasks, 2=calendar
const [habits, setHabits] = useState<Habit[]>([]);
const [tasks, setTasks] = useState<Task[]>([]);
const [goalMap, setGoalMap] = useState<Record<string, Goal>>({});
const [loading, setLoading] = useState(true);
```

**On mount (`useEffect`):**
- `habitsApi.getAll()` → setHabits (sorted by `sortOrder`)
- `tasksApi.getAll()` → filter `completed !== true` → setTasks (sorted by `sortOrder`)
- `goalsApi.getAll()` → build `{[id]: Goal}` map for task goal chips
- Calendar events come from `CalendarContext` (already loaded globally)

**Screen layout:**
```
┌──────────────────────────────┐
│  ✕              Plan Your Day│  ← header (X = router.back())
│  ● ○ ○                       │  ← 3-dot step progress indicator
├──────────────────────────────┤
│                              │
│   [step content - FlatList]  │
│                              │
├──────────────────────────────┤
│  [← Back]         [Next →]  │  ← bottom nav (Back/Next or Done on step 2)
└──────────────────────────────┘
```

**Step 0 — Habits:**
- Title: "Habits", subtitle: "Which habits will you do today?"
- `FlatList` of all habits
- Each row: today-toggle circle | title + frequency label + streak | info icon → `EditItemDialog`
- Tap row → optimistic toggle: update local `habits` state + `habitsApi.update(id, { isToday: !habit.isToday })`
- Error: revert optimistic update on API failure

**Step 1 — Tasks:**
- Title: "Tasks", subtitle: "What are you working on today?"
- `FlatList` of non-completed tasks
- Each row: today-toggle circle | title + goal color chip (if `goalId`) + due date label (if `dueDate`) | info icon → `EditItemDialog`
- Tap row → optimistic toggle: `tasksApi.update(id, { isToday: !task.isToday })`

**Step 2 — Calendar:**
- Title: "Calendar", subtitle: "Upcoming events"
- Empty state if no events or no calendar permission
- `FlatList` of events from `CalendarContext.events`, grouped by date (Today / Tomorrow / date label), sorted by `startTime`
- Each row: colored dot (calendar color) | time range or "All day" | title | `+` icon button
- `+` button → Alert or inline form: prompt for countdown name (pre-fill from event title) + date (pre-fill from event `startTime` date) → `countdownsApi.create({ title, date, isRecurring: false })` → success toast
- "Done" button → `router.back()`

**Today-toggle UI:**
- On today: `Ionicons` `checkmark-circle` in accent color
- Off today: `Ionicons` `radio-button-off` in muted color

**Frequency display helper** (convert `frequencyTarget` to short label):
```ts
// "Every day" → "daily"
// "5 times a week" → "5×/week"
// "3 times a week" → "3×/week"
// "Once a week" → "1×/week"
// "2 times a month" → "2×/month"
// "Once a month" → "1×/month"
```

**Streak display:** Show `🔥 N` only if `currentStreak >= 2`

---

### 2. Add "Plan My Day" button to Today screen

In `mobile/app/(tabs)/today.tsx`:
- Locate the bottom control panel (the row with calendar count, upcoming count, Clear Today)
- Add a "Plan My Day" button (left side or above panel)
- `onPress`: `router.push('/plan-day')`

**Refresh on return:**
- Check if the screen already uses `useFocusEffect` — if yes, ensure `loadData()` is called inside it
- If not, add:
  ```ts
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );
  ```

---

## Data Flow Summary

```
[Today screen] → tap "Plan My Day" → router.push('/plan-day')

[plan-day.tsx] mounts:
  habitsApi.getAll() → habits state
  tasksApi.getAll()  → tasks state (filter: !completed)
  goalsApi.getAll()  → goalMap state
  CalendarContext.events → used directly

User taps habit/task row:
  optimistic: update local state immediately
  async: API PATCH (isToday toggle)
  on error: revert local state

User taps "+" on calendar event:
  show name/date prompt (Alert or inline)
  countdownsApi.create(dto)
  show success toast

User taps "Done" / X:
  router.back()
  [Today screen] useFocusEffect fires → loadData() refreshes list
```

---

## Verification

1. "Plan My Day" button visible in Today screen control panel
2. Wizard opens as full-screen modal over Today
3. Step progress dots update correctly (3 steps)
4. **Habits step:** all habits shown with correct isToday status; tapping toggles and persists after wizard close
5. **Tasks step:** only non-completed tasks shown; goal color chips appear for tasks with goalId; toggling persists
6. **Calendar step:** events grouped by date; "+" creates countdown; success toast shows
7. Back/Next navigation works; Back on step 0 dismisses wizard
8. X button (mid-wizard) dismisses; all previously toggled changes persist
9. Today screen refreshes on return (useFocusEffect), showing new isToday items
10. Light and dark themes render correctly
11. Empty states work for: no habits, no tasks, no calendar events/permission
12. Optimistic update reverts correctly on API failure (network error scenario)
