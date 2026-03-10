# Mobile Onboarding Revamp - Implementation Plan

## Overview

Complete redesign of mobile app onboarding from passive 3-slide carousel to interactive, deliberate creation flow inspired by "Review My System". Users will create their own first tasks and habits through a guided, philosophy-driven experience.

## Design Decisions (User Confirmed)

- **3-phase structure**: Intro (philosophy) → Creation (tasks, then habits) → Summary
- **Flexible count**: Users decide how many items to create
- **Skippable**: Can skip at any time
- **Card-by-card creation**: Create one item, then "Add Another" or "Done"
- **Tasks**: Title only, auto-marked as `isToday: true`
- **Habits**: Title + frequency picker (reused from Review My System)
- **Summary**: Shows count + list of created items
- **Reset button**: Developer section in Settings with confirmation alert

## Component Architecture

### New Components (create in `src/components/onboarding/`)

1. **FrequencyPicker.tsx**
   - Extract from HabitReviewCard (lines 220-264)
   - Preset chip buttons + custom text input
   - Props: `{ value: string, onChange: (value: string) => void }`

2. **OnboardingIntro.tsx**
   - Hero section with icon + title + subtitle
   - 3 philosophy cards:
     - **Today Screen**: "Your daily dashboard - see what matters today and get it done" (icon: `today-outline`)
     - **Execution Mode**: "Focus on one task at a time with optional timers" (icon: `play-circle-outline`)
     - **Habit System**: "Build identity through consistency, not intensity" (icon: `repeat-outline`)
   - "Get Started" button → starts creation
   - "Skip" in header → jumps to summary
   - Props: `{ onStart: () => void, onSkip: () => void }`

3. **TaskCreationCard.tsx**
   - Single TextInput for title (maxLength: 100)
   - Placeholder: "Task name"
   - Hint: "Try: 'Review project proposal' or 'Call dentist'"
   - Validation: Cannot save empty title
   - Buttons: "Add Another Task" (saves + resets) / "Done with Tasks" (advances)
   - Shows count below: "3 tasks created"
   - Props: `{ onSave: (task: Task) => void, onDone: () => void, onSkip: () => void, createdCount: number }`

4. **HabitCreationCard.tsx**
   - Title TextInput (maxLength: 100)
   - FrequencyPicker component
   - Hint: "Try: 'Morning workout' or 'Read for 10 minutes'"
   - Validation: Requires title + frequency
   - Buttons: "Add Another Habit" / "Done with Habits"
   - Shows count: "2 habits created"
   - Props: `{ onSave: (habit: Habit) => void, onDone: () => void, onSkip: () => void, createdCount: number }`

5. **OnboardingSummary.tsx**
   - Success icon (checkmark-circle, size 64)
   - Count: "You created X tasks and Y habits"
   - Scrollable list of created items (with icons)
   - If 0 items: "You haven't created any items yet. That's okay! You can add tasks and habits anytime."
   - "Get Started" button → completes onboarding
   - Props: `{ createdTasks: Task[], createdHabits: Habit[], onFinish: () => void }`

### Main Screen (`app/onboarding.tsx`)

**State Structure:**
```typescript
type OnboardingPhase = 'intro' | 'tasks' | 'habits' | 'summary';

const [phase, setPhase] = useState<OnboardingPhase>('intro');
const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
const [createdHabits, setCreatedHabits] = useState<Habit[]>([]);
const [isCreating, setIsCreating] = useState(false);
```

**Phase Flow:**
- intro → "Get Started" → tasks
- intro → "Skip" → summary
- tasks → "Add Another" → (stays in tasks, creates item)
- tasks → "Done with Tasks" → habits
- habits → "Add Another" → (stays in habits, creates item)
- habits → "Done with Habits" → summary
- summary → "Get Started" → completes onboarding

**API Integration (Create Immediately Pattern):**
- Call `tasksApi.create()` when user clicks "Add Another Task"
- Call `habitsApi.create()` when user clicks "Add Another Habit"
- Store returned items in state arrays
- Show loading state on buttons while creating
- Handle errors with Alert + retry option

**Completion:**
```typescript
const completeOnboarding = async () => {
  try {
    await updateSettings({ hasCompletedOnboarding: true });
    await secureStorage.setOnboardingStatus(true);
    router.replace('/(tabs)/today');
  } catch (error) {
    Alert.alert('Error', 'Failed to complete onboarding.');
  }
};
```

**Back Button Handling:**
- During intro/creation: Show confirmation alert before exit
- During summary: Allow back without confirmation

## Settings Integration

### Add Developer Section (`app/(tabs)/settings.tsx`)

**Location**: After Notifications section (line 611), before Logout button (line 613)

**Code to Add:**
```typescript
{/* Developer Section */}
<View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
  <Text style={[styles.sectionTitle, { color: colors.text }]}>Developer</Text>

  <TouchableOpacity
    style={[styles.settingRow, { borderTopWidth: 0 }]}
    onPress={handleResetOnboarding}
  >
    <View style={styles.settingRowText}>
      <Ionicons name="refresh-outline" size={24} color={colors.icon} style={styles.settingIcon} />
      <View style={styles.settingRowContent}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>Reset Onboarding</Text>
        <Text style={[styles.settingHint, { color: colors.icon }]}>
          Re-enter the onboarding flow
        </Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={20} color={colors.icon} />
  </TouchableOpacity>
</View>
```

**Handler Function:**
```typescript
const handleResetOnboarding = () => {
  Alert.alert(
    'Reset Onboarding',
    'This will mark onboarding as incomplete and return you to the welcome flow.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateSettings({ hasCompletedOnboarding: false });
            await secureStorage.setOnboardingStatus(false);
            router.replace('/onboarding');
          } catch (error) {
            Alert.alert('Error', 'Failed to reset onboarding.');
          }
        },
      },
    ]
  );
};
```

**Import to Add:**
```typescript
import { secureStorage } from '../../src/services/storage/secureStorage';
```

## Cleanup Tasks

### 1. Delete Sample Data
- **Delete file**: `mobile/src/constants/sampleData.ts`
- **Remove from onboarding.tsx**:
  - Line 18: `import { SAMPLE_TASKS, SAMPLE_HABITS } from '../src/constants/sampleData';`
  - Lines 100-105: Sample task/habit creation logic

### 2. Re-enable Onboarding Check
- **File**: `mobile/app/index.tsx`
- **Change lines 21-24** from:
  ```typescript
  // TODO: Re-enable onboarding when video tutorials are ready
  // if (!settings?.hasCompletedOnboarding) {
  //   return <Redirect href="/onboarding" />;
  // }
  ```
- **To**:
  ```typescript
  // Check if user needs onboarding
  if (!settings?.hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }
  ```

## Implementation Steps

### Phase 1: Component Creation
1. Create `src/components/onboarding/` directory
2. Extract and build `FrequencyPicker.tsx` from HabitReviewCard
3. Build `OnboardingIntro.tsx` (static, follow habit-review.tsx pattern)
4. Build `TaskCreationCard.tsx` with validation
5. Build `HabitCreationCard.tsx` with FrequencyPicker
6. Build `OnboardingSummary.tsx`

### Phase 2: Main Screen Integration
7. Rewrite `app/onboarding.tsx` with phase management
8. Wire up API calls (create immediately)
9. Implement error handling and loading states
10. Add back button handling

### Phase 3: Settings + Cleanup
11. Add Developer section to settings screen
12. Implement reset button handler
13. Delete `sampleData.ts` and remove imports
14. Re-enable onboarding check in `index.tsx`

### Phase 4: Testing
15. Test full flow: intro → tasks → habits → summary → today
16. Test skip flows (skip from intro, skip after creating items)
17. Test reset button functionality
18. Test edge cases (0 items, API failures, back button)
19. Test light/dark themes
20. Test on iOS and Android

## Critical Files to Modify

- **`mobile/app/onboarding.tsx`** - Complete rewrite
- **`mobile/app/(tabs)/settings.tsx`** - Add Developer section after line 611
- **`mobile/app/index.tsx`** - Uncomment lines 21-24
- **`mobile/src/constants/sampleData.ts`** - DELETE
- **`mobile/src/components/HabitReviewCard.tsx`** - Extract FrequencyPicker pattern (lines 220-264)

## Reference Files (for patterns)

- **`mobile/app/habit-review.tsx`** - 3-phase structure (lines 146-420)
- **`mobile/src/contexts/SettingsContext.tsx`** - Settings update logic
- **`mobile/src/services/api/tasks.ts`** - Task creation API
- **`mobile/src/services/api/habits.ts`** - Habit creation API

## Edge Cases to Handle

1. **0 Items Created**: User skips everything → Summary shows "You haven't created any items yet" message
2. **API Failures**: Show Alert, allow retry, user can skip
3. **Back Button**: Confirmation during creation phases, no confirmation in summary
4. **Empty Inputs**: Disable save buttons, show validation hints
5. **Slow Network**: Show loading indicators, disable buttons during creation
6. **Reset Re-entry**: Previous items persist, user can create more

## Verification Steps

### After Implementation:

1. **Fresh User Flow**:
   ```
   - Open app as new user
   - Should see intro screen with philosophy cards
   - Click "Get Started"
   - Create 2 tasks (verify API calls succeed)
   - Click "Done with Tasks"
   - Create 2 habits with frequency (verify API calls succeed)
   - Click "Done with Habits"
   - Verify summary shows "You created 2 tasks and 2 habits"
   - Verify list shows all 4 items
   - Click "Get Started"
   - Verify navigation to /(tabs)/today
   - Verify all 4 items appear on Today screen
   ```

2. **Reset Flow**:
   ```
   - Go to Settings → Developer section
   - Tap "Reset Onboarding"
   - Confirm in alert
   - Verify navigation to /onboarding
   - Complete onboarding again
   - Verify old items still exist + new items added
   ```

3. **Skip Flows**:
   ```
   - Reset onboarding
   - Click "Skip" on intro → Summary shows 0 items
   - Reset onboarding
   - Create 1 task, click "Skip" → Summary shows 1 task, 0 habits
   ```

4. **Error Handling**:
   ```
   - Disable network
   - Try to create task → Verify error alert
   - Try to create habit → Verify error alert
   - Enable network and retry → Verify success
   ```

5. **UI/UX**:
   ```
   - Test light theme
   - Test dark theme
   - Try empty title → Verify validation
   - Try habit without frequency → Verify validation
   - Press back button → Verify confirmation
   ```

## Success Criteria

- ✅ Onboarding uses 3-phase interactive flow (no passive carousel)
- ✅ No sample data creation (users create their own items)
- ✅ Users can create flexible number of tasks and habits
- ✅ Frequency picker works for habits
- ✅ Reset button in Settings works end-to-end
- ✅ All items marked `isToday: true` and appear on Today screen
- ✅ Skip functionality works at any phase
- ✅ Error handling for API failures
- ✅ Works on iOS and Android
- ✅ Works in light and dark themes
