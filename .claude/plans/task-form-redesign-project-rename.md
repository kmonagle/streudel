# Plan: Task Form Redesign + Goal → Project Rename

## Context

The current `AddItemDialog` is a combined modal serving Goal, Task, and Habit creation with tabs. It supports batch creation (one title per line = multiple items) and shows all fields simultaneously. The task and habit sections are considered intimidating — too many fields visible at once with no hierarchy of importance.

The onboarding forms (`TaskCreationCard`, `HabitCreationCard`) are the gold standard: focused, minimal, one item at a time. This plan brings that sensibility to the main creation flows, starting with the task form.

Also included: rename "Goal" → "Project" throughout the UI (labels and display text only; no database schema changes).

## Scope

**In scope:**
- Create `QuickAddSheet` (replaces the + FAB flow — task-only, ultra-slim)
- Create `NewTaskSheet` (full task creation with progressive disclosure)
- Create `MoreOptionsRow` (reusable disclosure primitive)
- Rename "Goal" → "Project" in all UI labels and display text
- Wire new components into `today.tsx` and anywhere the + FAB is triggered
- Keep `AddItemDialog` for Habit and Goal creation (unchanged for now)

**Out of scope:**
- Habit form redesign (next iteration)
- Project/Goal modal redesign (next iteration)
- Database field renames (`goalId` stays as-is internally)
- `EditItemDialog` structural changes (rename text only)

## Design Decisions (from UI Designer review)

### Why bottom sheet with progressive disclosure (not wizard, not accordion)
- A wizard adds navigation cost at the moment of capture — wrong timing
- An accordion inside a ScrollView causes layout jitter when keyboard appears
- Bottom sheet with in-place expansion is the iOS native pattern (Things 3, Fantastical, Reminders)

### QuickAddSheet vs NewTaskSheet
Two distinct entry points for task creation:
- **QuickAddSheet**: For "I have a thought right now" moments. Task-only. Add to Today defaults ON (users capturing mid-workflow almost always want it today).
- **NewTaskSheet**: For deliberate planning from a task list or My Stuff. Add to Today defaults OFF.

### "Goal → Project" rename
UI text only. Internal API field names (`goalId`, `goal`) stay as-is to avoid a large refactor. Purely cosmetic — what users see changes, what the API sends does not.

---

## New Components

### `MoreOptionsRow.tsx`
**Location**: `mobile/src/components/MoreOptionsRow.tsx`

A reusable disclosure row. Tapping it animates the advanced section into view using `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` — no Reanimated dependency needed.

Props:
- `label?: string` (defaults to "More options")
- `expanded: boolean`
- `onToggle: () => void`
- `children: ReactNode` (the advanced content, rendered when expanded)

---

### `QuickAddSheet.tsx`
**Location**: `mobile/src/components/QuickAddSheet.tsx`

Entry point: The + FAB on the Today screen (and any other screen that currently opens AddItemDialog).

**Fields (all visible, no disclosure):**
1. Title — large text input, autoFocus, single-line, placeholder "Add a task..."
2. Project selector — horizontal ScrollView of pill buttons (None + all user projects)
3. "Add" button — inline or as a floating action

**Behaviour:**
- `isToday` defaults to `true`
- Submit on "Add" tap or return key
- Dismisses after each add (try dismiss-on-add first; revisit if users want rapid-fire entry)
- No notes, no timer, no recurrence — those are in NewTaskSheet
- A subtle "More options" link opens NewTaskSheet pre-filled with the current title

---

### `NewTaskSheet.tsx`
**Location**: `mobile/src/components/NewTaskSheet.tsx`

Entry point: "New Task" button from My Stuff / task list views (not the + FAB).

**Basic section (always visible):**
1. Title — large text input, autoFocus, multiline allowed, placeholder "What needs to be done?"
2. Project selector — horizontal ScrollView of pill buttons (None + all user projects with color indicators)
3. Add to Today — toggle row with sun icon, defaults OFF

**MoreOptionsRow divider**

**Advanced section (revealed on toggle):**
4. Due Date — native `DateTimePicker` (not a text field — eliminates format anxiety and the current YYYY-MM-DD validation error)
5. Recurring toggle — when ON, renders `RecurrenceRulePicker` inline (existing component, unchanged)
6. Timer — numeric input (minutes)
7. Notes — multiline textarea
8. Upcoming Notice — stepper 0–30 days (lowest priority; consider removing from create in a future pass)

**Header:** Cancel (left) | "Add Task" button (right, primary color, disabled until title non-empty)

---

## Rename: Goal → Project

All user-facing text changes. Internal API field names (`goalId`, `goal`) stay as-is.

**Files to update:**

| File | Change |
|------|--------|
| `AddItemDialog.tsx` | Tab label "Goal" → "Project"; any "goal" display text |
| `EditItemDialog.tsx` | Any "Goal" labels in the UI |
| `today.tsx` | Any "goal" references in display |
| `ProcessCaptureDialog.tsx` | "Goal" button label → "Project" |
| `onboarding.tsx` / onboarding components | Any "goal" text |
| Navigation labels / tab titles | As applicable |

Do a project-wide search for case-insensitive "goal" to catch all instances, filtering out internal variable names (only change string literals shown to users).

---

## Wiring

### Today screen (`today.tsx`)
- The + FAB currently opens `AddItemDialog`. Change it to open `QuickAddSheet`.
- `AddItemDialog` remains accessible for Habit and Project creation via other entry points.

### Other screens
- Anywhere `AddItemDialog` is invoked for task creation specifically, switch to `NewTaskSheet`.
- Anywhere `AddItemDialog` is invoked with all types (Goal/Task/Habit), keep it as-is for now — it still handles Habit and Goal/Project.

---

## Files to Create
- `mobile/src/components/MoreOptionsRow.tsx`
- `mobile/src/components/QuickAddSheet.tsx`
- `mobile/src/components/NewTaskSheet.tsx`

## Files to Modify
- `mobile/app/(tabs)/today.tsx` — wire QuickAddSheet to + FAB
- `mobile/src/components/AddItemDialog.tsx` — rename Goal → Project tab label and display text
- `mobile/src/components/EditItemDialog.tsx` — rename Goal → Project labels
- `mobile/src/components/ProcessCaptureDialog.tsx` — rename Goal → Project button
- `mobile/app/onboarding.tsx` — any Goal → Project text
- Other files found via search for user-facing "goal" strings

## Files to Keep Unchanged (structurally)
- `mobile/src/components/RecurrenceRulePicker.tsx` — reused as-is in NewTaskSheet
- `mobile/src/components/FrequencyPicker.tsx` — reused in future habit form work
- `mobile/src/components/AddItemDialog.tsx` — structural changes deferred (rename + tab label only)

---

## Verification

1. Tap the + FAB on Today screen → `QuickAddSheet` opens (not AddItemDialog)
2. Type a task title, select a project, tap Add → task created, appears in list
3. Task created via QuickAddSheet has `isToday = true` by default
4. Open NewTaskSheet → only 3 fields visible initially
5. Tap "More options" → advanced fields animate in smoothly without keyboard jitter
6. Recurring toggle ON → RecurrenceRulePicker appears inline
7. Recurring toggle OFF → RecurrenceRulePicker disappears
8. All UI labels say "Project" not "Goal" (grep for remaining "Goal" strings in UI)
9. ProcessCaptureDialog shows "Project" not "Goal"
10. AddItemDialog still works for Habit creation
11. Dark mode — all new components render correctly in both themes