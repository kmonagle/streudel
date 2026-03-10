# Smart Sort Implementation Plan

## Overview

Smart Sort automatically orders the Today list based on historical user preferences. The user selects what goes on their list (intentional), and Smart Sort handles the ordering (mechanical).

**Target accuracy:** ~80% of items within 1-2 positions of where user would place them.

**Philosophy:** Augment user judgment, don't replace it. Ordering is busywork; selection is meaningful.

---

## Part 1: Data Capture

### Signal Sources

We capture position data at three moments:

| Event | Trigger | What We Capture | Signal Strength |
|-------|---------|-----------------|-----------------|
| Manual reorder | User drags item to new position | Full list snapshot | Very high |
| Add to Today | User adds item from My Stuff/Habits | Item ID + position added at | Medium |
| Session start | User taps "Start Session" | Full list snapshot | High |

### Data Schema

```typescript
// New type for position snapshots
interface PositionSnapshot {
  id: string;
  userId: string;
  capturedAt: string;        // ISO datetime
  captureType: 'reorder' | 'add_item' | 'session_start';
  items: PositionSnapshotItem[];
}

interface PositionSnapshotItem {
  itemId: string;
  itemType: 'habit' | 'task';
  position: number;          // 0-indexed position in list
}

// For "add_item" events, we only capture the single item
// For "reorder" and "session_start", we capture the full list
```

### Storage Strategy

**Recommended: Backend storage**
- Persists across devices
- Allows future analytics/insights
- New endpoint: `POST /api/position-snapshots`

**Alternative: Local storage (MVP)**
- Faster to implement
- Device-specific (won't sync)
- Use `expo-secure-store` or AsyncStorage

**Hybrid approach:**
- Capture locally first (immediate)
- Batch sync to backend periodically
- Backend becomes source of truth for calculations

### Capture Implementation

**1. Manual Reorder (drag-drop)**

Location: `app/(tabs)/today.tsx` → `handleDragEnd()`

```typescript
// After successful reorder API call
const captureReorderSnapshot = async (orderedItems: TodayItem[]) => {
  const snapshot: PositionSnapshot = {
    id: generateId(),
    userId: user.id,
    capturedAt: new Date().toISOString(),
    captureType: 'reorder',
    items: orderedItems.map((item, index) => ({
      itemId: item.id,
      itemType: item.type,
      position: index,
    })),
  };
  await positionSnapshotsApi.create(snapshot);
};
```

**2. Add to Today**

Location: `src/components/AddItemDialog.tsx` and anywhere `isToday: true` is set

```typescript
// After successfully adding item to today
const captureAddItemSnapshot = async (
  itemId: string,
  itemType: 'habit' | 'task',
  position: number
) => {
  const snapshot: PositionSnapshot = {
    id: generateId(),
    userId: user.id,
    capturedAt: new Date().toISOString(),
    captureType: 'add_item',
    items: [{ itemId, itemType, position }],
  };
  await positionSnapshotsApi.create(snapshot);
};
```

**3. Session Start**

Location: `app/(tabs)/today.tsx` → where execution session begins

```typescript
// When user taps "Start Session"
const captureSessionStartSnapshot = async (todayItems: TodayItem[]) => {
  const snapshot: PositionSnapshot = {
    id: generateId(),
    userId: user.id,
    capturedAt: new Date().toISOString(),
    captureType: 'session_start',
    items: todayItems.map((item, index) => ({
      itemId: item.id,
      itemType: item.type,
      position: index,
    })),
  };
  await positionSnapshotsApi.create(snapshot);
};
```

---

## Part 2: Smart Sort Algorithm

### Core Logic

```typescript
interface ItemPositionStats {
  itemId: string;
  itemType: 'habit' | 'task';
  averagePosition: number;
  occurrenceCount: number;    // How many snapshots this item appears in
  lastSeen: string;           // ISO date of most recent snapshot
}

const calculateSmartSortOrder = async (
  todayItems: TodayItem[],
  snapshots: PositionSnapshot[]
): Promise<TodayItem[]> => {

  // 1. Calculate average position for each item
  const positionStats = new Map<string, ItemPositionStats>();

  for (const snapshot of snapshots) {
    for (const item of snapshot.items) {
      const key = `${item.itemType}-${item.itemId}`;
      const existing = positionStats.get(key);

      if (existing) {
        // Running average calculation
        const newCount = existing.occurrenceCount + 1;
        const newAvg = (existing.averagePosition * existing.occurrenceCount + item.position) / newCount;
        positionStats.set(key, {
          ...existing,
          averagePosition: newAvg,
          occurrenceCount: newCount,
          lastSeen: snapshot.capturedAt,
        });
      } else {
        positionStats.set(key, {
          itemId: item.itemId,
          itemType: item.itemType,
          averagePosition: item.position,
          occurrenceCount: 1,
          lastSeen: snapshot.capturedAt,
        });
      }
    }
  }

  // 2. Sort today's items by average position
  return todayItems.sort((a, b) => {
    const keyA = `${a.type}-${a.id}`;
    const keyB = `${b.type}-${b.id}`;
    const statsA = positionStats.get(keyA);
    const statsB = positionStats.get(keyB);

    // Items with history: sort by average position
    // Items without history: sort to end
    const posA = statsA?.averagePosition ?? 999;
    const posB = statsB?.averagePosition ?? 999;

    return posA - posB;
  });
};
```

### Handling New Items (No History)

Items with no position history get placed at the end. Could enhance with:

1. **Goal grouping** - Place near other items from same goal
2. **Frequency grouping** - Daily habits cluster together
3. **Recency bias** - Recently created items might be more urgent

For MVP: just put at end. User will place them, and that becomes their history.

### Data Window

**Recommended: Last 60 days of snapshots**
- Enough history for stable averages
- Recent enough to reflect current preferences
- Matches existing 60-day completion history window

Could add time-decay weighting later (recent snapshots count more).

---

## Part 3: UI Integration

### Smart Sort Button

Location: Today screen, near the top (where Build Today currently is)

```tsx
const SmartSortButton = () => {
  const [isSorting, setIsSorting] = useState(false);
  const hasEnoughData = positionSnapshots.length >= 5; // Minimum threshold

  if (!hasEnoughData) return null; // Hide until we have data

  return (
    <TouchableOpacity
      style={styles.smartSortButton}
      onPress={handleSmartSort}
      disabled={isSorting}
    >
      <Ionicons name="sparkles" size={20} color="white" />
      <Text style={styles.buttonText}>
        {isSorting ? 'Sorting...' : 'Smart Sort'}
      </Text>
    </TouchableOpacity>
  );
};

const handleSmartSort = async () => {
  setIsSorting(true);
  try {
    const snapshots = await positionSnapshotsApi.getRecent(60); // Last 60 days
    const sortedItems = await calculateSmartSortOrder(todayItems, snapshots);

    // Update positions via existing reorder API
    await todayApi.reorder({
      items: sortedItems.map((item, index) => ({
        id: item.id,
        type: item.type,
        todaySortOrder: index,
      })),
    });

    await loadTasks(); // Refresh
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    Alert.alert('Error', 'Failed to sort. Please try again.');
  } finally {
    setIsSorting(false);
  }
};
```

### Visual Feedback

After Smart Sort runs, briefly highlight items that moved significantly (optional enhancement).

---

## Part 4: Backend Requirements

### New Endpoint: Position Snapshots

```
POST /api/position-snapshots
Body: PositionSnapshot object

GET /api/position-snapshots?days=60
Returns: PositionSnapshot[] for current user, last N days
```

### Database Schema

```sql
CREATE TABLE position_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  captured_at TIMESTAMP NOT NULL,
  capture_type VARCHAR(20) NOT NULL, -- 'reorder', 'add_item', 'session_start'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE position_snapshot_items (
  id UUID PRIMARY KEY,
  snapshot_id UUID REFERENCES position_snapshots(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type VARCHAR(10) NOT NULL, -- 'habit', 'task'
  position INTEGER NOT NULL
);

CREATE INDEX idx_snapshots_user_date ON position_snapshots(user_id, captured_at DESC);
```

---

## Part 5: Implementation Phases

### Phase A: Data Capture (Can ship immediately, invisible to users)

1. Create `positionSnapshotsApi` service
2. Add capture calls to:
   - `handleDragEnd()` in today.tsx
   - Add-to-today flows
   - Session start
3. Backend: Create endpoints and tables
4. Start collecting data silently

**Effort:** 1-2 days
**User impact:** None (background data collection)

### Phase B: Smart Sort Algorithm (After 1-2 weeks of data)

1. Implement `calculateSmartSortOrder()`
2. Add Smart Sort button to Today screen
3. Wire up to existing reorder API

**Effort:** 1 day
**User impact:** New button appears

### Phase C: Refinements (Optional, based on feedback)

1. Goal-based grouping for new items
2. Time-decay weighting
3. Day-of-week awareness (weekend vs weekday patterns)
4. "Undo Smart Sort" button

---

## Part 6: Migration Path for Build Today

### Option A: Remove Build Today entirely
- Cleaner, one way to do things
- Users who liked it lose that option

### Option B: Keep both buttons
- More options, potentially confusing
- "Build Today" = add items, "Smart Sort" = order items

### Option C: Combine into Daily Planning Flow (future)
- Build Today becomes step in guided flow
- Smart Sort becomes final step
- Single cohesive experience

**Recommendation:** Start with Option A. Remove Build Today. Smart Sort + manual selection is the intended workflow.

---

## Success Metrics

1. **Accuracy:** % of items that don't get manually moved after Smart Sort
   - Target: 80%+
   - Measure: Track reorder events within 60 seconds of Smart Sort

2. **Adoption:** % of users who use Smart Sort when available
   - Track Smart Sort button taps

3. **Time saved:** Compare time from "open Today tab" to "start session" before/after

---

## Open Questions

1. Should Smart Sort be a button, or automatic when you open Today?
2. What's the minimum number of snapshots before we show the button?
3. Should we show "confidence" indicator (how much data we have)?
4. Local-first storage vs backend-first?

---

## Files to Modify

### New Files
- `src/services/api/positionSnapshots.ts` - API client
- `src/utils/smartSort.ts` - Algorithm implementation
- `src/constants/api.ts` - Add endpoint paths

### Modified Files
- `app/(tabs)/today.tsx` - Add Smart Sort button, capture calls
- `src/components/AddItemDialog.tsx` - Capture add-to-today events
- `src/types/models.ts` - Add PositionSnapshot types

### Backend (Rails)
- New migration for tables
- New controller for endpoints
- Routes
