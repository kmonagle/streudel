# Multi-Select UI Redesign Plan

## Problem Statement

The current multi-select mode UI feels cluttered:
- Header changes to "X selected" (low perceived value)
- Large rectangular START SESSION button shows during multi-select (unnecessary)
- Overall UI feels crowded and confusing

## Proposed Solution

Redesign the UI with two main changes:

### 1. Round START SESSION Button (Top Right Corner)
Replace the large rectangular START SESSION button with a prominent round floating button in the top right corner.

**Visual Design:**
- Position: Absolute positioning in top right corner
- Size: 56x56 circular button (standard FAB size)
- Icon: Play icon (Ionicons `play-circle` or `play`)
- Color: `colors.tint` background, white icon
- Shadow: Elevation shadow for floating appearance
- Always visible (both normal and multi-select modes)

**Placement:**
- Outside the FlatList, positioned absolutely
- Z-index above list content
- Margin from top-right edge: 16px each side

### 2. Contextual Control Panel (Below Header)
Small horizontal control panel that changes based on mode.

**Location:** Between "Today" header and the item list

**Normal Mode:**
- Single icon button: "Clear Today" (trash icon)
- Action: Clears all items from Today (with confirmation alert)
- Centered or left-aligned
- Subtle styling (icon + text or icon only)

**Multi-Select Mode:**
- Left side: Selected count text ("3 selected")
- Right side: Cancel icon button (X)
- Horizontally distributed
- Highlighted background (light tint color)

**Visual Design:**
- Height: ~40px
- Background: Transparent in normal mode, `colors.tint + '10'` in multi-select mode
- Border: None or subtle bottom border
- Padding: 12px horizontal

## Implementation Details

### File: `app/(tabs)/today.tsx`

#### Changes Overview:
1. Remove large rectangular START SESSION button from ListHeaderComponent
2. Add round floating START SESSION button (absolute position)
3. Add contextual control panel component
4. Remove "X selected" header text change
5. Remove X cancel button from header
6. Keep bottom toolbar (Move to Top/Up/Down/Bottom buttons)

#### New Components

**1. Floating START SESSION Button:**
```tsx
const FloatingStartSessionButton = () => {
  if (incompleteItems.length === 0) return null;

  return (
    <TouchableOpacity
      style={[styles.floatingStartButton, { backgroundColor: colors.tint }]}
      onPress={handleStartSession}
    >
      <Ionicons name="play" size={28} color="#FFFFFF" />
    </TouchableOpacity>
  );
};
```

**Styles:**
```typescript
floatingStartButton: {
  position: 'absolute',
  top: 60, // Below header
  right: 16,
  width: 56,
  height: 56,
  borderRadius: 28,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
  zIndex: 1000,
},
```

**2. Contextual Control Panel:**
```tsx
const ControlPanel = () => {
  if (isMultiSelectMode) {
    // Multi-select mode: count + cancel
    return (
      <View style={[
        styles.controlPanel,
        { backgroundColor: colors.tint + '10', borderBottomColor: colors.border }
      ]}>
        <Text style={[styles.selectedCountText, { color: colors.tint }]}>
          {selectedItems.size} selected
        </Text>
        <TouchableOpacity
          onPress={exitMultiSelect}
          style={styles.controlPanelButton}
        >
          <Ionicons name="close-circle" size={24} color={colors.tint} />
        </TouchableOpacity>
      </View>
    );
  }

  // Normal mode: clear today button
  if (incompleteItems.length > 0) {
    return (
      <View style={[styles.controlPanel, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleClearToday}
          style={styles.controlPanelButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.icon} />
          <Text style={[styles.clearTodayText, { color: colors.text }]}>
            Clear Today
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};
```

**Styles:**
```typescript
controlPanel: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
},
controlPanelButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
selectedCountText: {
  fontSize: 15,
  fontWeight: '600',
},
clearTodayText: {
  fontSize: 14,
  fontWeight: '500',
},
```

**3. Clear Today Handler:**
```typescript
const handleClearToday = () => {
  const count = incompleteItems.length;

  Alert.alert(
    'Clear Today?',
    `Remove all ${count} items from Today? This will not delete the items.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            // Update all items to remove from Today
            const updates = incompleteItems.map(item =>
              item.type === 'task'
                ? tasksApi.update(item.item.id, { isToday: false })
                : habitsApi.update(item.item.id, { isToday: false })
            );

            await Promise.all(updates);
            await loadTasks(); // Reload to reflect changes
          } catch (error) {
            console.error('Failed to clear Today:', error);
            Alert.alert('Error', 'Failed to clear Today. Please try again.');
          }
        }
      }
    ]
  );
};

const exitMultiSelect = () => {
  setIsMultiSelectMode(false);
  setSelectedItems(new Set());
};
```

#### Modified Sections

**1. Header (Remove "X selected" text and cancel button):**

Current (Lines 1807-1830):
```tsx
// REMOVE THIS - Keep header simple, always show "Today"
{isMultiSelectMode ? (
  <View style={styles.headerTitle}>
    <Text style={[styles.todayHeaderText, { color: colors.tint }]}>
      {selectedItems.size} selected
    </Text>
  </View>
) : (
  <Text style={[styles.todayHeaderText, { color: colors.text }]}>
    Today
  </Text>
)}

// Cancel button in header
{isMultiSelectMode ? (
  <TouchableOpacity onPress={exitMultiSelect}>
    <Ionicons name="close" size={28} color={colors.tint} />
  </TouchableOpacity>
) : (
  // ... menu
)}
```

New:
```tsx
{/* Always show "Today" - no mode-based changes */}
<Text style={[styles.todayHeaderText, { color: colors.text }]}>
  Today
</Text>

{/* Keep menu icon - remove mode-based conditional */}
<TouchableOpacity onPress={() => setIsMenuOpen(!isMenuOpen)}>
  <Ionicons name="menu" size={28} color={colors.icon} />
</TouchableOpacity>
```

**2. ListHeaderComponent (Remove START SESSION button, add control panel):**

Current (Lines 1525-1572):
```tsx
// REMOVE the large rectangular START SESSION button
{incompleteItems.length > 0 && (
  <TouchableOpacity
    style={[styles.startSessionButton, { backgroundColor: colors.tint }]}
    onPress={handleStartSession}
  >
    <Ionicons name="play-circle" size={24} color="#FFFFFF" />
    <Text style={styles.startSessionButtonText}>START SESSION</Text>
  </TouchableOpacity>
)}
```

New:
```tsx
{/* Add control panel component */}
<ControlPanel />
```

**3. Main Render (Add floating button):**

Add after the SafeAreaView wrapper (at the end, before closing tags):
```tsx
{/* Floating START SESSION button */}
<FloatingStartSessionButton />
```

#### Keep Unchanged

**Bottom Toolbar (Lines 1969-2004):**
- Keep as-is - provides bulk move actions in multi-select mode
- Only visible when `isMultiSelectMode === true`
- Buttons: Move to Top, Move Up, Move Down, Move to Bottom

**Multi-Select Logic:**
- Long-press activation
- Checkbox selection
- Multi-drag behavior
- Auto-exit after drag

## Visual Mockup

```
┌─────────────────────────────────────┐
│  Today                    ☰   🎯    │  ← Header (always "Today", menu icon, round START button)
├─────────────────────────────────────┤
│  🗑️ Clear Today                      │  ← Control Panel (normal mode)
├─────────────────────────────────────┤
│  ✨ Build Today (3)                  │
│                                     │
│  ☐ Morning Meditation               │
│  ☐ Exercise                         │
│  ☐ Journal                          │
└─────────────────────────────────────┘

--- VERSUS ---

┌─────────────────────────────────────┐
│  Today                    ☰   🎯    │  ← Header (unchanged)
├─────────────────────────────────────┤
│  3 selected                      ✖️  │  ← Control Panel (multi-select mode)
├─────────────────────────────────────┤
│  ☑️ Morning Meditation               │
│  ☐ Exercise                         │
│  ☑️ Journal                          │
│  ☑️ Read                             │
├─────────────────────────────────────┤
│  ⬆️ Top  ⬆️ Up  ⬇️ Down  ⬇️ Bottom   │  ← Bottom Toolbar (bulk actions)
└─────────────────────────────────────┘
```

## Benefits

✅ **Less cluttered** - Header stays consistent, no mode-based text changes
✅ **Better visual hierarchy** - Round FAB draws attention to primary action
✅ **Contextual controls** - Small control panel adapts to mode without overwhelming
✅ **Clear cancellation** - Dedicated cancel button in control panel (multi-select mode)
✅ **Useful normal mode action** - "Clear Today" provides quick cleanup
✅ **Maintains functionality** - Bottom toolbar keeps bulk actions available

## Testing Checklist

### Normal Mode
- [ ] Round START SESSION button appears in top right when items exist
- [ ] Control panel shows "Clear Today" button
- [ ] Clicking "Clear Today" shows confirmation alert
- [ ] Confirming clears all items from Today
- [ ] Header always shows "Today" (no text changes)

### Multi-Select Mode
- [ ] Long-press activates multi-select
- [ ] Control panel changes to show count + cancel
- [ ] Count updates as items are selected/deselected
- [ ] Cancel button exits multi-select mode
- [ ] Round START SESSION button stays visible
- [ ] Bottom toolbar appears with bulk actions

### Visual Polish
- [ ] Round button has proper shadow/elevation
- [ ] Control panel background highlights in multi-select mode
- [ ] Smooth transitions between modes
- [ ] No layout shifts or jumps

## Estimated Effort

- Remove old UI elements: ~15 min
- Create floating START SESSION button: ~20 min
- Create control panel component: ~30 min
- Add Clear Today functionality: ~20 min
- Style polish and positioning: ~20 min
- Testing all scenarios: ~20 min

**Total: ~2 hours**

## Files Modified

- `app/(tabs)/today.tsx` - All UI changes (~150 lines modified, ~100 lines added)
