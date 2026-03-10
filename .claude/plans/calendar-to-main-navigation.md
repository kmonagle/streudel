# Design: Settings to Profile Sheet + Calendar Tab

## Context

The app currently has four bottom tabs: Today, Habits, My Stuff, and Settings. The Settings tab is large and used infrequently, taking up prime nav real estate. The user wants to:

1. Move all settings into the profile icon (top-right header), which already triggers a small `ProfileModal`
2. Replace the Settings tab with a Calendar tab showing the next 3 weeks of events + tasks with due dates — visually mirroring the existing `calendar-review.tsx` screen

This frees the bottom nav for a more useful persistent view while making settings feel naturally co-located with the user's identity.

---

## Approved Design

### 1. Settings → Full-Screen Profile Sheet

**Trigger:** Tap the profile icon (top-right header, already present on all tab screens)

**Presentation:** Full-screen bottom sheet (`Modal` with `animationType="slide"`, full height), matching the slide-up style used by `AddCountdownDialog`. A drag handle at the top and an X button dismiss it.

**Content (top to bottom in a ScrollView):**
- Profile header: large avatar (80px), name, email, subscription badge, upgrade link (free tier)
- All settings sections from the current `settings.tsx`:
  - Appearance (Light / Dark / Auto)
  - Navigation (start screen preference)
  - Today Screen Settings (show upcoming events toggle, show countdowns toggle, thresholds)
  - Google Calendar (calendar selection toggles — premium)
  - Notifications (master toggle + sub-toggles with times)
  - Developer (reset onboarding)
- Sign Out button at bottom (red, destructive)

**Implementation approach:**
- Replace `ProfileModal.tsx` with a new `SettingsSheet` component (same file, full rewrite)
- Extract the settings JSX from `settings.tsx` into `SettingsSheet`
- `settings.tsx` tab file is removed — its content lives in the sheet
- The sheet uses the same state management hooks the current settings screen uses (`useSettings`, `useAuth`, etc.)
- Settings mutations (toggles, saves) work exactly as they do today

---

### 2. Calendar Tab (replaces Settings tab)

**Tab name:** "Calendar"
**Tab icon:** `calendar-outline` (Ionicons, consistent with existing calendar icons in the app)
**Tab position:** 4th slot (where Settings was)

**New file:** `mobile/app/(tabs)/calendar.tsx`

**Content:** Events grouped by date for the **next 21 days (3 weeks)**, showing:
- Google Calendar events (title, time/all-day, colored left bar using event's calendar color)
- Tasks with a due date (title, due time or "All day", checkbox icon)
- Days with no events/tasks are omitted

**Visual design — mirrors `calendar-review.tsx` exactly:**
- Date section headers: `"Thursday, Mar 20"` format (same as calendar-review)
- Calendar event cards: colored left bar (4px wide) + title + time range (same card style as Today screen's `renderCalendarEvent`)
- Task cards: checklist icon + title + due time — same card shape as event cards but with a different left-bar treatment (use `colors.tint` or a neutral color)
- ScrollView with `gap: 8` between items, `gap: 16` between date sections
- No filter toggle needed (unlike calendar-review's "hide events with countdowns")

**Data sources:**
- Calendar events: existing `CalendarContext` (already fetches and caches events)
- Tasks with due dates: existing task data from `useItems` or equivalent — filter for tasks where `dueDate` is set and within 21 days

**Empty state:** If no calendar events are synced (user is on free tier or hasn't connected calendar), show a tasteful empty state card explaining that Google Calendar sync is a premium feature, with an "Upgrade" link. Tasks with due dates still show even without calendar sync.

---

## Files to Change

| File | Change |
|------|--------|
| `mobile/app/(tabs)/_layout.tsx` | Remove `settings` tab, add `calendar` tab (4th position) |
| `mobile/src/components/ProfileModal.tsx` | Full rewrite → `SettingsSheet`: full-screen modal with profile header + all settings sections |
| `mobile/app/(tabs)/settings.tsx` | Delete (content moves to SettingsSheet) |
| `mobile/app/(tabs)/calendar.tsx` | New file — Calendar tab screen |

**Reference files (do not modify, use as visual/logic templates):**
- `mobile/app/calendar-review.tsx` — date grouping logic, event card layout, date header formatting
- `mobile/app/(tabs)/today.tsx` — `renderCalendarEvent()` for event card style
- `mobile/src/contexts/CalendarContext.tsx` — calendar event data access

---

## Verification

1. Tap profile icon on any tab → SettingsSheet slides up full screen
2. All settings work identically to current settings tab (toggles save, theme changes, calendar toggles)
3. Sign out works from within SettingsSheet
4. Bottom nav now shows: Today | Habits | My Stuff | Calendar (no Settings)
5. Calendar tab shows next 21 days with events and due-dated tasks grouped by date
6. Calendar events display with correct color bars
7. Tasks with due dates appear inline with events on their due date
8. Empty state shows correctly when no calendar is connected
9. Tapping items in Calendar tab behaves appropriately (events are non-interactive for now; tasks could show edit modal if wiring is straightforward)
