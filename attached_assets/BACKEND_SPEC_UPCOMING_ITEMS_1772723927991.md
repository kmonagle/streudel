# Backend Specification: Upcoming Items Feature

## Overview

Add support for per-item "upcoming" thresholds and due dates to Tasks and Habits. This allows users to specify how many days in advance they want to see items as "upcoming" before they're due.

**Backend Stack:** Drizzle ORM + PostgreSQL + TypeScript + Zod

---

## Database Migrations

### Migration 1: Add fields to tasks table

Create migration file in `lifeordered-api/drizzle/migrations/`:

```typescript
import { sql } from "drizzle-orm";
import { pgTable, varchar, text, boolean, integer, timestamp, date } from "drizzle-orm/pg-core";

// Add these columns to tasks table
export async function up(db) {
  await db.execute(sql`
    ALTER TABLE tasks
    ADD COLUMN due_date DATE,
    ADD COLUMN upcoming_days INTEGER;
  `);

  await db.execute(sql`
    CREATE INDEX idx_tasks_due_date ON tasks(due_date);
  `);
}

export async function down(db) {
  await db.execute(sql`
    DROP INDEX IF EXISTS idx_tasks_due_date;
  `);

  await db.execute(sql`
    ALTER TABLE tasks
    DROP COLUMN due_date,
    DROP COLUMN upcoming_days;
  `);
}
```

### Migration 2: Add field to habits table

```typescript
import { sql } from "drizzle-orm";

export async function up(db) {
  await db.execute(sql`
    ALTER TABLE habits
    ADD COLUMN upcoming_days INTEGER;
  `);
}

export async function down(db) {
  await db.execute(sql`
    ALTER TABLE habits
    DROP COLUMN upcoming_days;
  `);
}
```

**Field Descriptions:**
- `due_date` (tasks) - Optional deadline for non-recurring tasks (DATE type, YYYY-MM-DD)
- `upcoming_days` (tasks & habits) - Optional per-item threshold (0-30 days) to show item as "upcoming"

---

## Schema Changes

### File: `shared/schema.ts`

**Update tasks table definition (line ~61):**

```typescript
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  notes: text("notes"),
  completed: boolean("completed").notNull().default(false),
  completedToday: boolean("completed_today").notNull().default(false),
  completionCount: integer("completion_count").notNull().default(0),
  isToday: boolean("is_today").notNull().default(false),
  goalId: varchar("goal_id").references(() => goals.id),
  sortOrder: integer("sort_order").notNull().default(0),
  todaySortOrder: integer("today_sort_order"),
  timerMinutes: integer("timer_minutes"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceRule: text("recurrence_rule"),
  nextOccurrence: timestamp("next_occurrence"),
  lastCompleted: timestamp("last_completed"),
  category: varchar("category", { length: 50 }),
  dueDate: date("due_date"),                    // NEW
  upcomingDays: integer("upcoming_days"),       // NEW
});
```

**Update habits table definition (line ~81):**

```typescript
export const habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  notes: text("notes"),
  isToday: boolean("is_today").notNull().default(false),
  completedToday: boolean("completed_today").notNull().default(false),
  completionCount: integer("completion_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  todaySortOrder: integer("today_sort_order"),
  timerMinutes: integer("timer_minutes"),
  frequencyTarget: varchar("frequency_target", { length: 100 }),
  userId: varchar("user_id").references(() => users.id).notNull(),
  upcomingDays: integer("upcoming_days"),       // NEW
});
```

---

## Zod Schema Updates

### File: `shared/schema.ts`

**Update insertTaskSchema (line ~127):**

```typescript
export const insertTaskSchema = createInsertSchema(tasks, {
  nextOccurrence: z.string().datetime().nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), // NEW - YYYY-MM-DD format
  upcomingDays: z.number().int().min(0).max(30).nullable().optional(),    // NEW - 0-30 range
}).omit({
  id: true,
  completed: true,
  completedToday: true,
  completionCount: true,
  todaySortOrder: true,
  userId: true,
  lastCompleted: true,
});
```

**Update insertHabitSchema (line ~139):**

```typescript
export const insertHabitSchema = createInsertSchema(habits, {
  upcomingDays: z.number().int().min(0).max(30).nullable().optional(),    // NEW
}).omit({
  id: true,
  completedToday: true,
  completionCount: true,
  todaySortOrder: true,
  userId: true,
});
```

**Update updateTaskSchema (line ~240):**

```typescript
export const updateTaskSchema = z.object({
  title: z.string().optional(),
  notes: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  completedToday: z.boolean().optional(),
  completionCount: z.number().optional(),
  isToday: z.boolean().optional(),
  goalId: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  todaySortOrder: z.number().nullable().optional(),
  timerMinutes: z.number().nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().nullable().optional(),
  nextOccurrence: z.string().nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), // NEW
  upcomingDays: z.number().int().min(0).max(30).nullable().optional(),    // NEW
});
```

**Update updateHabitSchema (line ~256):**

```typescript
export const updateHabitSchema = z.object({
  title: z.string().optional(),
  notes: z.string().nullable().optional(),
  isToday: z.boolean().optional(),
  completedToday: z.boolean().optional(),
  completionCount: z.number().optional(),
  sortOrder: z.number().optional(),
  todaySortOrder: z.number().nullable().optional(),
  timerMinutes: z.number().nullable().optional(),
  frequencyTarget: z.string().nullable().optional(),
  upcomingDays: z.number().int().min(0).max(30).nullable().optional(),    // NEW
});
```

---

## API Response Changes

### GET /api/tasks

**Response format (with new fields):**

```json
[
  {
    "id": "abc123",
    "title": "Buy Mom's birthday gift",
    "notes": null,
    "completed": false,
    "completedToday": false,
    "completionCount": 0,
    "isToday": false,
    "goalId": null,
    "sortOrder": 0,
    "todaySortOrder": null,
    "timerMinutes": null,
    "userId": "user123",
    "isRecurring": false,
    "recurrenceRule": null,
    "nextOccurrence": null,
    "lastCompleted": null,
    "category": null,
    "dueDate": "2026-04-15",      // NEW - ISO date string
    "upcomingDays": 7              // NEW - integer or null
  }
]
```

### POST /api/tasks

**Request body:**

```json
{
  "title": "Buy Mom's birthday gift",
  "notes": "She likes gardening books",
  "isToday": false,
  "dueDate": "2026-04-15",        // NEW - optional
  "upcomingDays": 7               // NEW - optional
}
```

**Validation errors (Zod will return):**

```json
// Invalid dueDate format
{
  "message": "Validation failed",
  "errors": [
    {
      "path": ["dueDate"],
      "message": "Invalid format. Expected YYYY-MM-DD"
    }
  ]
}

// upcomingDays out of range
{
  "message": "Validation failed",
  "errors": [
    {
      "path": ["upcomingDays"],
      "message": "Number must be between 0 and 30"
    }
  ]
}
```

### PUT /api/tasks/:id

**Request body:**

```json
{
  "dueDate": "2026-04-20",        // Update due date
  "upcomingDays": 5               // Update threshold
}
```

**Setting to null:**

```json
{
  "dueDate": null,                // Clear due date
  "upcomingDays": null            // Use global threshold
}
```

### GET /api/habits

**Response format (with new field):**

```json
[
  {
    "id": "def456",
    "title": "Visit Mom",
    "notes": null,
    "isToday": false,
    "completedToday": false,
    "completionCount": 12,
    "sortOrder": 0,
    "todaySortOrder": null,
    "timerMinutes": null,
    "frequencyTarget": "every 6 weeks",
    "userId": "user123",
    "upcomingDays": 7              // NEW
  }
]
```

### POST /api/habits

**Request body:**

```json
{
  "title": "Visit Mom",
  "frequencyTarget": "every 6 weeks",
  "upcomingDays": 7               // NEW - optional
}
```

### PUT /api/habits/:id

**Request body:**

```json
{
  "upcomingDays": 10              // Update threshold
}
```

---

## Storage Layer Changes

### File: `server/storage.ts`

**No changes required!** ✅

The storage methods already use Drizzle's type inference from the schema, so they will automatically support the new fields once the schema is updated.

The following methods will automatically work with new fields:
- `createTask()` - Will accept `dueDate` and `upcomingDays` from `InsertTask` type
- `updateTask()` - Will accept `dueDate` and `upcomingDays` from `UpdateTask` type
- `createHabit()` - Will accept `upcomingDays` from `InsertHabit` type
- `updateHabit()` - Will accept `upcomingDays` from `UpdateHabit` type

---

## Routes Changes

### File: `server/routes.ts`

**No changes required!** ✅

The routes already use Zod schemas for validation, so they will automatically support and validate the new fields once the schemas are updated.

Existing endpoints that will automatically support new fields:
- `POST /api/tasks` - Uses `insertTaskSchema`
- `PUT /api/tasks/:id` - Uses `updateTaskSchema`
- `POST /api/habits` - Uses `insertHabitSchema`
- `PUT /api/habits/:id` - Uses `updateHabitSchema`

---

## Testing

### Example Tests (add to test suite)

**File: `server/__tests__/tasks.test.ts`** (create if doesn't exist)

```typescript
import { describe, it, expect } from 'vitest';

describe('Tasks API - Upcoming Items', () => {
  it('should create task with dueDate and upcomingDays', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Test Task',
        dueDate: '2026-04-15',
        upcomingDays: 7
      })
      .expect(200);

    expect(response.body.dueDate).toBe('2026-04-15');
    expect(response.body.upcomingDays).toBe(7);
  });

  it('should reject invalid dueDate format', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Test Task',
        dueDate: '04/15/2026'  // Wrong format
      })
      .expect(400);

    expect(response.body.errors).toBeDefined();
  });

  it('should reject upcomingDays out of range', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Test Task',
        upcomingDays: 100  // > 30
      })
      .expect(400);

    expect(response.body.errors).toBeDefined();
  });

  it('should update dueDate and upcomingDays', async () => {
    // Create task first
    const createRes = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test Task' });

    // Update with new fields
    const response = await request(app)
      .put(`/api/tasks/${createRes.body.id}`)
      .send({
        dueDate: '2026-05-01',
        upcomingDays: 10
      })
      .expect(200);

    expect(response.body.dueDate).toBe('2026-05-01');
    expect(response.body.upcomingDays).toBe(10);
  });

  it('should clear fields when set to null', async () => {
    // Create task with fields
    const createRes = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Test Task',
        dueDate: '2026-04-15',
        upcomingDays: 7
      });

    // Clear fields
    const response = await request(app)
      .put(`/api/tasks/${createRes.body.id}`)
      .send({
        dueDate: null,
        upcomingDays: null
      })
      .expect(200);

    expect(response.body.dueDate).toBeNull();
    expect(response.body.upcomingDays).toBeNull();
  });
});
```

**File: `server/__tests__/habits.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';

describe('Habits API - Upcoming Items', () => {
  it('should create habit with upcomingDays', async () => {
    const response = await request(app)
      .post('/api/habits')
      .send({
        title: 'Test Habit',
        frequencyTarget: 'every 2 weeks',
        upcomingDays: 3
      })
      .expect(200);

    expect(response.body.upcomingDays).toBe(3);
  });

  it('should update upcomingDays', async () => {
    const createRes = await request(app)
      .post('/api/habits')
      .send({ title: 'Test Habit' });

    const response = await request(app)
      .put(`/api/habits/${createRes.body.id}`)
      .send({ upcomingDays: 14 })
      .expect(200);

    expect(response.body.upcomingDays).toBe(14);
  });
});
```

---

## Backwards Compatibility

All changes are **100% backwards compatible**:

✅ All new fields are optional (nullable)
✅ Existing API calls work without any changes
✅ Mobile app has graceful fallbacks built-in
✅ Zod validation only applies to new fields when provided

**Deploy order:** Backend can be deployed anytime. Mobile app automatically benefits without requiring updates.

---

## Implementation Checklist

### 1. Database Migrations (5-10 min)
- [ ] Create migration file for tasks table (add `due_date`, `upcoming_days`)
- [ ] Create migration file for habits table (add `upcoming_days`)
- [ ] Run migrations: `npm run db:migrate`
- [ ] Verify in PostgreSQL: `\d tasks` and `\d habits`

### 2. Schema Updates (10-15 min)
- [ ] Update `tasks` table definition in `shared/schema.ts`
- [ ] Update `habits` table definition in `shared/schema.ts`
- [ ] Update `insertTaskSchema` with validation
- [ ] Update `insertHabitSchema` with validation
- [ ] Update `updateTaskSchema` with validation
- [ ] Update `updateHabitSchema` with validation
- [ ] Run TypeScript check: `npm run typecheck`

### 3. Testing (15-20 min)
- [ ] Add test cases for task creation with new fields
- [ ] Add test cases for habit creation with new fields
- [ ] Add test cases for validation errors
- [ ] Add test cases for null values
- [ ] Run tests: `npm test`

### 4. Verification (5-10 min)
- [ ] Test POST /api/tasks with new fields
- [ ] Test PUT /api/tasks/:id with new fields
- [ ] Test POST /api/habits with new fields
- [ ] Test PUT /api/habits/:id with new fields
- [ ] Verify validation errors work correctly
- [ ] Test mobile app integration

**Total estimated time:** 35-55 minutes

---

## Manual Testing Commands

```bash
# 1. Create task with new fields
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "title": "Test upcoming task",
    "dueDate": "2026-04-15",
    "upcomingDays": 7
  }'

# 2. Update task
curl -X PUT http://localhost:5000/api/tasks/{taskId} \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "dueDate": "2026-04-20",
    "upcomingDays": 5
  }'

# 3. Create habit with new field
curl -X POST http://localhost:5000/api/habits \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "title": "Visit Mom",
    "frequencyTarget": "every 6 weeks",
    "upcomingDays": 7
  }'

# 4. Test validation error (invalid date format)
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "title": "Test",
    "dueDate": "04/15/2026"
  }'
# Expected: 400 error with validation message

# 5. Test validation error (out of range)
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "title": "Test",
    "upcomingDays": 100
  }'
# Expected: 400 error with validation message
```

---

## Business Rules

1. **`dueDate` is for non-recurring tasks only**
   - Recurring tasks should use `nextOccurrence` instead
   - Both can technically exist, but mobile app prioritizes `nextOccurrence` if `isRecurring=true`

2. **`upcomingDays` validation**
   - Must be integer between 0 and 30 (inclusive)
   - `null` means use global threshold from user settings
   - `0` means show only on due date

3. **Date format**
   - `dueDate` must be in `YYYY-MM-DD` format
   - No time component (DATE type in database)

4. **Nullability**
   - All new fields are nullable
   - Can be cleared by setting to `null` in update requests

---

## Questions?

Contact the mobile team if:
- Clarification needed on business logic
- Questions about validation rules
- Need example mobile app code
- Uncertainty about API contract

---

**Document Version:** 2.0 (Updated for actual Drizzle/TypeScript backend)
**Date:** 2026-03-05
**Mobile App Version:** Phase 1 - Upcoming Items Feature
**Backend Location:** `/Users/kmonagle/dev/lifeordered-api`
