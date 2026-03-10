# Bulk Operations Backend API Specification

## Overview
Endpoints for performing bulk operations efficiently in a single HTTP request. This reduces network overhead and improves performance for operations that affect multiple resources.

---

## Tasks Bulk Operations

### 1. Bulk Create Tasks
**POST** `/api/tasks/bulk`

**Description:** Create multiple tasks in a single request. Useful for shopping lists, importing tasks, or any scenario requiring multiple task creation.

**Request Body:**
```typescript
{
  tasks: Array<{
    title: string;
    notes?: string;
    goalId?: string | null;
    isToday?: boolean;
    timerMinutes?: number | null;
    isRecurring?: boolean;
    recurrenceRule?: string;
    nextOccurrence?: string;
  }>
}
```

**Response 201:**
```typescript
{
  tasks: Task[]; // Array of created tasks in the same order as request
  count: number; // Number of tasks created
}
```

**Example Request:**
```json
{
  "tasks": [
    {
      "title": "2 cups flour [Baking]",
      "notes": "from Chocolate Chip Cookies",
      "goalId": "goal-uuid-123",
      "isToday": false
    },
    {
      "title": "3 eggs [Produce]",
      "notes": "from Chocolate Chip Cookies, Pancakes",
      "goalId": "goal-uuid-123",
      "isToday": false
    },
    {
      "title": "1 cup milk [Dairy]",
      "notes": "from Pancakes",
      "goalId": "goal-uuid-123",
      "isToday": false
    }
  ]
}
```

**Example Response:**
```json
{
  "tasks": [
    {
      "id": "task-uuid-1",
      "title": "2 cups flour [Baking]",
      "notes": "from Chocolate Chip Cookies",
      "goalId": "goal-uuid-123",
      "completed": false,
      "isToday": false,
      "sortOrder": 0,
      "userId": "user-uuid"
    },
    {
      "id": "task-uuid-2",
      "title": "3 eggs [Produce]",
      "notes": "from Chocolate Chip Cookies, Pancakes",
      "goalId": "goal-uuid-123",
      "completed": false,
      "isToday": false,
      "sortOrder": 1,
      "userId": "user-uuid"
    },
    {
      "id": "task-uuid-3",
      "title": "1 cup milk [Dairy]",
      "notes": "from Pancakes",
      "goalId": "goal-uuid-123",
      "completed": false,
      "isToday": false,
      "sortOrder": 2,
      "userId": "user-uuid"
    }
  ],
  "count": 3
}
```

**Implementation Notes:**
- Use a **database transaction** to ensure all tasks are created or none are
- If any task fails validation, rollback entire transaction and return error
- Automatically assign `sortOrder` based on array index (starting from max existing sortOrder + 1 for that goal)
- All tasks belong to the authenticated user
- Validate all tasks before starting transaction
- Maximum recommended: 100 tasks per request (to prevent timeout)

**Validation:**
- `tasks` array is required and must contain 1-100 items
- Each task must have a `title` (required, non-empty)
- If `goalId` is provided, verify it exists and belongs to the user
- Apply same validation rules as single task creation

**Error Responses:**

**400 Bad Request:**
```json
{
  "error": "Invalid bulk task data",
  "details": [
    {
      "index": 0,
      "field": "title",
      "message": "Title is required"
    },
    {
      "index": 5,
      "field": "goalId",
      "message": "Goal not found"
    }
  ]
}
```

**401 Unauthorized:** User not authenticated

**413 Payload Too Large:**
```json
{
  "error": "Too many tasks",
  "message": "Maximum 100 tasks per bulk request",
  "provided": 150
}
```

---

### 2. Bulk Update Tasks
**PATCH** `/api/tasks/bulk`

**Description:** Update multiple tasks in a single request. Useful for marking multiple tasks as completed, moving tasks to a goal, etc.

**Request Body:**
```typescript
{
  updates: Array<{
    id: string;
    title?: string;
    notes?: string;
    completed?: boolean;
    isToday?: boolean;
    goalId?: string | null;
    timerMinutes?: number | null;
  }>
}
```

**Response 200:**
```typescript
{
  tasks: Task[];
  count: number;
}
```

**Implementation Notes:**
- Use database transaction
- Verify all task IDs belong to authenticated user before updating
- If any task ID doesn't exist or doesn't belong to user, rollback entire transaction
- Only update fields that are provided (partial updates)

---

### 3. Bulk Delete Tasks
**POST** `/api/tasks/bulk-delete`

**Description:** Delete multiple tasks in a single request.

**Request Body:**
```typescript
{
  taskIds: string[];
}
```

**Response 200:**
```typescript
{
  deleted: number; // Number of tasks deleted
}
```

**Implementation Notes:**
- Use database transaction
- Verify all task IDs belong to authenticated user
- If any task ID doesn't belong to user, return error and don't delete any
- Silently ignore non-existent task IDs (already deleted)

---

## Habits Bulk Operations

### 4. Bulk Create Habits
**POST** `/api/habits/bulk`

**Description:** Create multiple habits in a single request.

**Request Body:**
```typescript
{
  habits: Array<{
    title: string;
    notes?: string;
    isToday?: boolean;
    timerMinutes?: number | null;
  }>
}
```

**Response 201:**
```typescript
{
  habits: Habit[];
  count: number;
}
```

**Implementation Notes:**
- Same transaction and validation approach as tasks
- Auto-assign `sortOrder` based on array index
- Initialize `completedToday: false` and `completionCount: 0`

---

## Goals Bulk Operations

### 5. Bulk Create Goals
**POST** `/api/goals/bulk`

**Description:** Create multiple goals in a single request.

**Request Body:**
```typescript
{
  goals: Array<{
    title: string;
    description?: string;
    color?: string;
    isHabitGoal?: boolean;
  }>
}
```

**Response 201:**
```typescript
{
  goals: Goal[];
  count: number;
}
```

**Implementation Notes:**
- Use database transaction
- Auto-assign `sortOrder` based on array index
- Initialize `isArchived: false`

---

## Performance Considerations

### Benefits of Bulk Operations
- **Reduced Network Overhead:** 1 HTTP request instead of N requests
- **Reduced Database Overhead:** 1 transaction instead of N transactions
- **Faster Response Time:** No round-trip latency between requests
- **Atomic Operations:** All-or-nothing ensures data consistency

### Example Performance Improvement
Creating 29 shopping list tasks:

| Method | Requests | Avg Time | Notes |
|--------|----------|----------|-------|
| Sequential | 29 | 5-10s | One request at a time |
| Parallel (Promise.all) | 29 | 1-2s | All requests simultaneously |
| **Bulk Endpoint** | **1** | **0.3s** | Single request |

### Database Transaction Pattern
```javascript
async function bulkCreateTasks(userId, tasksData) {
  return await db.transaction(async (trx) => {
    // Validate all tasks first
    for (const [index, taskData] of tasksData.entries()) {
      validateTask(taskData, index);
    }

    // Get max sort order for goal (if specified)
    const goalId = tasksData[0]?.goalId;
    let maxSortOrder = 0;
    if (goalId) {
      const result = await trx('tasks')
        .where({ userId, goalId })
        .max('sort_order as max');
      maxSortOrder = result[0]?.max ?? -1;
    }

    // Create all tasks
    const tasks = tasksData.map((data, index) => ({
      ...data,
      userId,
      sortOrder: maxSortOrder + index + 1,
      completed: false,
      completedToday: false,
      completionCount: 0,
    }));

    const created = await trx('tasks').insert(tasks).returning('*');
    return created;
  });
}
```

---

## Frontend Integration

### Updated API Client

**Add to `/src/constants/api.ts`:**
```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints ...

  // Bulk operations
  TASKS_BULK: '/api/tasks/bulk',
  TASKS_BULK_DELETE: '/api/tasks/bulk-delete',
  HABITS_BULK: '/api/habits/bulk',
  GOALS_BULK: '/api/goals/bulk',
};
```

**Add to `/src/services/api/tasks.ts`:**
```typescript
export const tasksApi = {
  // ... existing methods ...

  /**
   * Create multiple tasks in a single request
   */
  async bulkCreate(tasks: CreateTaskDto[]): Promise<Task[]> {
    const response = await apiClient.post<{ tasks: Task[]; count: number }>(
      API_ENDPOINTS.TASKS_BULK,
      { tasks }
    );
    return response.data.tasks;
  },

  /**
   * Update multiple tasks in a single request
   */
  async bulkUpdate(updates: Array<{ id: string } & UpdateTaskDto>): Promise<Task[]> {
    const response = await apiClient.patch<{ tasks: Task[]; count: number }>(
      API_ENDPOINTS.TASKS_BULK,
      { updates }
    );
    return response.data.tasks;
  },

  /**
   * Delete multiple tasks in a single request
   */
  async bulkDelete(taskIds: string[]): Promise<number> {
    const response = await apiClient.post<{ deleted: number }>(
      API_ENDPOINTS.TASKS_BULK_DELETE,
      { taskIds }
    );
    return response.data.deleted;
  },
};
```

### Usage in Shopping List

**Before (29 separate requests):**
```typescript
for (const item of sortedIngredients) {
  await tasksApi.create({
    title: item.title,
    notes: item.notes,
    goalId: newGoal.id,
    isToday: false,
  });
}
```

**After (1 bulk request):**
```typescript
const tasksToCreate = sortedIngredients.map(item => ({
  title: item.title,
  notes: item.notes,
  goalId: newGoal.id,
  isToday: false,
}));

await tasksApi.bulkCreate(tasksToCreate);
```

---

## Testing Recommendations

### Unit Tests
- Validate transaction rollback on error
- Verify all tasks created with correct sortOrder
- Test validation for each task in array
- Test maximum payload size enforcement

### Integration Tests
- Create shopping list with 29 items (typical use case)
- Verify performance improvement vs sequential creation
- Test with duplicate goalIds
- Test with mix of valid and invalid tasks (should rollback)

### Load Tests
- Test with 100 tasks (maximum recommended)
- Verify response time stays under 1 second
- Test concurrent bulk operations from multiple users

---

## Migration Path

### Phase 1: Backend Implementation (Week 1)
1. Implement `/api/tasks/bulk` endpoint
2. Add validation and transaction handling
3. Write unit tests
4. Deploy to staging

### Phase 2: Frontend Integration (Week 1)
1. Update API constants and services
2. Update shopping list creation to use bulk endpoint
3. Test end-to-end
4. Deploy to production

### Phase 3: Optimization (Week 2)
1. Monitor performance metrics
2. Implement habits and goals bulk endpoints if needed
3. Consider bulk update/delete based on usage patterns

---

## Monitoring and Analytics

Track these metrics post-deployment:
- Average response time for bulk operations
- Number of tasks per bulk request (95th percentile)
- Error rate and validation failures
- Time saved vs sequential requests

Expected Results:
- **90% reduction** in shopping list creation time
- **95% reduction** in HTTP requests for bulk operations
- **Improved UX** - faster, more responsive app
