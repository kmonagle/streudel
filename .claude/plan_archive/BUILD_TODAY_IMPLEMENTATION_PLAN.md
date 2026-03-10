# Build Today Feature - Implementation Plan

## Overview

Add a "Build Today" button that instantly adds high-confidence tasks and habits to the Today screen based on user-provided data (frequency targets, recurrence patterns, completion history).

**Philosophy:** Only auto-add items with very high confidence to avoid becoming annoying or creating extra work for the user.

## High-Confidence Rules

### Tasks
- ✅ Recurring tasks where `nextOccurrence` is today (already auto-added in existing code)

### Habits
- ✅ **Daily habits:** frequency contains "every day" or "daily"
- ✅ **3x/week habits:** Completed ≤1 times this week AND ≤3 days left in week
- ✅ **Monthly habits:** Day of month ≥28 AND not completed this month
- ✅ **Biweekly habits:** ≥13 days since last completion

## UI Design

**Button Placement:** Top of Today screen, above "START SESSION" button

**Visibility:**
- Show when `highConfidenceCount > 0`
- Hide after successful build OR when count becomes 0

**Button States:**
- Normal: "Build Today (5)" with ✨ sparkles icon
- Loading: "Adding items..." (disabled)
- Hidden: When no qualifying items exist

**User Feedback:**
- Success: Alert showing "5 items added to Today"
- No items: Alert showing "All high-confidence items are already on Today"
- Error: Alert showing "Failed to add items to Today. Please try again."

## Implementation

### File 1: `src/utils/buildToday.ts` (NEW) - ~200 lines

Core algorithm containing:

**Helper Functions:**
1. `getDaysLeftInWeek()` - Returns 0-6 (days until Saturday)
2. `getCurrentDayOfMonth()` - Returns 1-31
3. `getCompletionsThisWeek(habitId, completions)` - Count completions in current week (Monday-Sunday)
4. `hasCompletionThisMonth(habitId, completions)` - Boolean check
5. `getDaysSinceLastCompletion(habitId, completions)` - Returns days or null
6. `getFrequencyType(frequencyTarget)` - Returns 'daily' | '3x-week' | 'monthly' | 'biweekly' | 'other'

**Main Exports:**
```typescript
export interface HighConfidenceItem {
  id: string;
  type: 'task' | 'habit';
  reason: string; // For debugging
}

export function getHighConfidenceItems(
  tasks: Task[],
  habits: Habit[],
  completions: HabitCompletion[]
): HighConfidenceItem[];

export async function buildToday(
  tasks: Task[],
  habits: Habit[],
  completions: HabitCompletion[]
): Promise<number>; // Returns count of successfully added items
```

**Algorithm Logic:**
1. Filter tasks for recurring ones due today (reuse `isOccurrenceToday` from `recurrenceParser.ts`)
2. Iterate through habits not already on Today
3. Parse frequency type using `getFrequencyType()`
4. Apply appropriate rule based on frequency
5. Use `Promise.allSettled()` to update all items in parallel
6. Return count of successful updates

**Edge Cases:**
- No completion history → Skip (except daily habits)
- Malformed frequency → Skip
- Already on Today → Filter out before processing
- Network failures → Use `Promise.allSettled()`, handle partial success

### File 2: `app/(tabs)/today.tsx` (MODIFY) - ~50 lines of changes

**Add State Variables (after line 62):**
```typescript
const [completions, setCompletions] = useState<HabitCompletion[]>([]);
const [highConfidenceCount, setHighConfidenceCount] = useState(0);
const [isBuildingToday, setIsBuildingToday] = useState(false);
```

**Add Import:**
```typescript
import { getHighConfidenceItems, buildToday as buildTodayUtil } from '../../src/utils/buildToday';
```

**Modify `loadTasks()` (around line 76):**
- Add completions fetch to Promise.all (60-day range for biweekly/monthly)
- Store completions in state
- Call `checkHighConfidenceItems()` after data loads

```typescript
// Calculate date range: last 60 days
const today = new Date();
const endDate = today.toISOString().split('T')[0];
const startDate = new Date(today);
startDate.setDate(startDate.getDate() - 60);
const startDateStr = startDate.toISOString().split('T')[0];

// Add to Promise.all array
const completionsData = await habitsApi.getCompletions(startDateStr, endDate).catch(() => []);

setCompletions(completionsData);
checkHighConfidenceItems(tasksData, habitsData, completionsData);
```

**Add Helper Functions (after line 215):**
```typescript
const checkHighConfidenceItems = (
  tasksData: Task[],
  habitsData: Habit[],
  completionsData: HabitCompletion[]
) => {
  const items = getHighConfidenceItems(tasksData, habitsData, completionsData);
  setHighConfidenceCount(items.length);
};

const handleBuildToday = async () => {
  setIsBuildingToday(true);
  try {
    const addedCount = await buildTodayUtil(tasks, habits, completions);

    Alert.alert(
      addedCount > 0 ? 'Items Added to Today' : 'No Items Added',
      addedCount > 0
        ? `${addedCount} ${addedCount === 1 ? 'item' : 'items'} added to Today`
        : 'All high-confidence items are already on Today.',
      [{ text: 'OK' }]
    );

    setHighConfidenceCount(0);
    await loadTasks();
  } catch (error) {
    console.error('Failed to build today:', error);
    Alert.alert('Error', 'Failed to add items to Today. Please try again.');
  } finally {
    setIsBuildingToday(false);
  }
};
```

**Add Build Today Button (in renderExecutionSection, before START SESSION button):**
```tsx
{highConfidenceCount > 0 && (
  <TouchableOpacity
    style={[
      styles.buildTodayButton,
      { backgroundColor: colors.tint }
    ]}
    onPress={handleBuildToday}
    disabled={isBuildingToday}
  >
    <Ionicons name="sparkles" size={20} color="#FFFFFF" />
    <Text style={styles.buildTodayButtonText}>
      {isBuildingToday
        ? 'Adding items...'
        : `Build Today (${highConfidenceCount})`
      }
    </Text>
  </TouchableOpacity>
)}
```

**Add Styles:**
```typescript
buildTodayButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 10,
  gap: 8,
  marginBottom: 12,
},
buildTodayButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
},
```

## Critical Files

**New:**
- `src/utils/buildToday.ts` - All Build Today logic (~200 lines)

**Modified:**
- `app/(tabs)/today.tsx` - UI integration (~50 lines added)

**Reference (no changes):**
- `src/utils/habitHealth.ts` - Use existing `parseFrequencyTarget()` for pattern matching
- `src/services/api/habits.ts` - Use `getCompletions(startDate, endDate)` API
- `src/utils/recurrenceParser.ts` - Reuse `isOccurrenceToday()` for recurring tasks
- `src/types/models.ts` - Type definitions

## Date/Week Calculations

**Week boundaries:** Monday-Sunday
- Use `date.getDay()` where 0=Sunday, 1=Monday
- Week start = today minus (dayOfWeek === 0 ? 6 : dayOfWeek - 1) days

**Month calculations:**
- Use `date.getMonth()` and `date.getFullYear()` for comparisons
- Filter completions where month and year match

**Completion history:**
- Fetch 60 days (covers biweekly and monthly patterns)
- Use `completionDate` field (YYYY-MM-DD) not `completedAt`

## Testing Checklist

### Daily Habits
- [ ] Create 3 "every day" habits, mark 1 as isToday
- [ ] Button shows "Build Today (2)"
- [ ] Click button → 2 habits added, button disappears

### 3x/Week Habits
- [ ] Monday with 0 completions → Button does NOT appear
- [ ] Thursday (2 days left) with 0 completions → Button DOES appear
- [ ] Friday with 1 completion, 1 day left → Button DOES appear
- [ ] Friday with 2 completions, 1 day left → Button does NOT appear

### Monthly Habits
- [ ] Day 27 with no completions → Button does NOT appear
- [ ] Day 28 with no completions → Button DOES appear
- [ ] Day 29 after completing on day 29 → Button does NOT appear

### Biweekly Habits
- [ ] Day 12 after last completion → Button does NOT appear
- [ ] Day 13 after last completion → Button DOES appear

### Edge Cases
- [ ] All items already on Today → Button hidden
- [ ] Habit with no frequency target → Skipped
- [ ] Habit with malformed frequency → Skipped
- [ ] Network failure → Partial success handled gracefully

### UI/UX
- [ ] Button only visible when count > 0
- [ ] Button hides after successful build
- [ ] Correct count displayed in button text
- [ ] Alert shows correct count after build
- [ ] Loading state prevents double-clicks
- [ ] Items appear in Today list after build
- [ ] No duplicates added

## Performance Notes

- Completion data limited to 60 days (~180 records max per habit)
- Use `Promise.allSettled()` for parallel API updates (faster than sequential)
- Typical batch: 5-15 items, individual API calls acceptable
- No memory/performance concerns for apps with 100+ habits

## Future Enhancements

1. **Smart scheduling patterns** - Learn which days user typically completes habits
2. **Customizable rules** - Settings toggles for each rule type, user-defined thresholds
3. **Bulk API endpoint** - `POST /api/today/bulk-add` for single transaction
4. **Undo functionality** - Store previous state, show "Undo" option
5. **"Upcoming" section** - Lower-confidence suggestions for planning ahead
6. **Analytics** - Track which rules trigger most, suggest frequency adjustments

## Implementation Sequence

1. **Create buildToday.ts** - Implement all helpers, main algorithm (~1-2 hours)
2. **Modify today.tsx** - Add state, button, integration (~30-60 min)
3. **Manual testing** - Test all 6 scenarios (~1 hour)
4. **Edge case validation** - Test error cases (~30 min)
5. **Performance verification** - Test with 50+ habits (~15 min)

**Total:** 3-4 hours

## Verification

**End-to-end test:**
1. Create mix of daily, 3x/week, monthly habits
2. Complete some habits partially through the week/month
3. Open Today screen
4. Verify button shows with correct count
5. Tap "Build Today"
6. Verify alert shows correct count
7. Verify items appear in Today list
8. Verify no duplicates
9. Verify button disappears after build
