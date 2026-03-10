# Backend Specification: Upcoming Items Feature

## Overview

Add support for per-item "upcoming" thresholds and due dates to Tasks and Habits. This allows users to specify how many days in advance they want to see items as "upcoming" before they're due.

## Database Migrations

### Migration 1: Add fields to Tasks table

```ruby
class AddUpcomingFieldsToTasks < ActiveRecord::Migration[7.0]
  def change
    add_column :tasks, :due_date, :date, null: true
    add_column :tasks, :upcoming_days, :integer, null: true

    add_index :tasks, :due_date
  end
end
```

**Field Descriptions:**
- `due_date` - Optional deadline for non-recurring tasks (YYYY-MM-DD format)
- `upcoming_days` - Optional per-item threshold (0-30 days) to show item as "upcoming"

### Migration 2: Add field to Habits table

```ruby
class AddUpcomingDaysToHabits < ActiveRecord::Migration[7.0]
  def change
    add_column :habits, :upcoming_days, :integer, null: true
  end
end
```

**Field Description:**
- `upcoming_days` - Optional per-item threshold (0-30 days) to show item as "upcoming"

## Model Changes

### Task Model (`app/models/task.rb`)

Add validations:

```ruby
class Task < ApplicationRecord
  # ... existing code ...

  validates :upcoming_days,
    numericality: {
      only_integer: true,
      greater_than_or_equal_to: 0,
      less_than_or_equal_to: 30
    },
    allow_nil: true

  validates :due_date,
    presence: false,
    allow_nil: true

  # Optional: Add validation to prevent both due_date and recurring
  validate :due_date_only_for_non_recurring, if: -> { due_date.present? }

  private

  def due_date_only_for_non_recurring
    if is_recurring? && due_date.present?
      errors.add(:due_date, "cannot be set for recurring tasks (use next_occurrence instead)")
    end
  end
end
```

**Business Rules:**
- `upcoming_days` must be 0-30 if provided
- `due_date` should only be used for non-recurring tasks
- Recurring tasks use `next_occurrence` instead of `due_date`

### Habit Model (`app/models/habit.rb`)

Add validation:

```ruby
class Habit < ApplicationRecord
  # ... existing code ...

  validates :upcoming_days,
    numericality: {
      only_integer: true,
      greater_than_or_equal_to: 0,
      less_than_or_equal_to: 30
    },
    allow_nil: true
end
```

## Controller Changes

### TasksController (`app/controllers/api/tasks_controller.rb`)

Update strong parameters:

```ruby
def task_params
  params.require(:task).permit(
    :title,
    :notes,
    :completed,
    :completed_today,
    :goal_id,
    :is_today,
    :sort_order,
    :today_sort_order,
    :timer_minutes,
    :is_recurring,
    :recurrence_rule,
    :next_occurrence,
    :last_completed,
    :due_date,        # NEW
    :upcoming_days    # NEW
  )
end
```

### HabitsController (`app/controllers/api/habits_controller.rb`)

Update strong parameters:

```ruby
def habit_params
  params.require(:habit).permit(
    :title,
    :notes,
    :completed_today,
    :is_today,
    :sort_order,
    :today_sort_order,
    :timer_minutes,
    :frequency_target,
    :upcoming_days    # NEW
  )
end
```

## API Endpoint Changes

### GET /api/tasks

**Response changes:**

```json
{
  "id": "123",
  "title": "Buy Mom's birthday gift",
  "notes": null,
  "completed": false,
  "is_recurring": false,
  "due_date": "2026-04-15",     // NEW - ISO date string (YYYY-MM-DD)
  "upcoming_days": 7,            // NEW - integer 0-30, nullable
  // ... other existing fields ...
}
```

### POST /api/tasks

**Request body changes:**

```json
{
  "task": {
    "title": "Buy Mom's birthday gift",
    "notes": "She likes gardening books",
    "is_today": false,
    "due_date": "2026-04-15",   // NEW - optional, YYYY-MM-DD format
    "upcoming_days": 7          // NEW - optional, integer 0-30
  }
}
```

**Validation errors:**

```json
// Invalid due_date format
{
  "errors": {
    "due_date": ["must be a valid date in YYYY-MM-DD format"]
  }
}

// Invalid upcoming_days range
{
  "errors": {
    "upcoming_days": ["must be between 0 and 30"]
  }
}

// due_date on recurring task (optional validation)
{
  "errors": {
    "due_date": ["cannot be set for recurring tasks (use next_occurrence instead)"]
  }
}
```

### PUT/PATCH /api/tasks/:id

**Request body changes:**

```json
{
  "task": {
    "due_date": "2026-04-20",   // Can update
    "upcoming_days": 5          // Can update
  }
}
```

**Setting to null:**

```json
{
  "task": {
    "due_date": null,           // Clears the due date
    "upcoming_days": null       // Clears custom threshold, uses global
  }
}
```

### GET /api/habits

**Response changes:**

```json
{
  "id": "456",
  "title": "Visit Mom",
  "frequency_target": "every 6 weeks",
  "upcoming_days": 7,            // NEW - integer 0-30, nullable
  // ... other existing fields ...
}
```

### POST /api/habits

**Request body changes:**

```json
{
  "habit": {
    "title": "Visit Mom",
    "frequency_target": "every 6 weeks",
    "upcoming_days": 7          // NEW - optional, integer 0-30
  }
}
```

### PUT/PATCH /api/habits/:id

**Request body changes:**

```json
{
  "habit": {
    "upcoming_days": 10         // Can update
  }
}
```

## Serializer Changes

### TaskSerializer (`app/serializers/task_serializer.rb`)

If using ActiveModel::Serializers:

```ruby
class TaskSerializer < ActiveModel::Serializer
  attributes :id, :title, :notes, :completed, :completed_today,
             :goal_id, :is_today, :sort_order, :today_sort_order,
             :timer_minutes, :is_recurring, :recurrence_rule,
             :next_occurrence, :last_completed,
             :due_date,        # NEW
             :upcoming_days    # NEW
end
```

If using Jbuilder:

```ruby
# app/views/api/tasks/_task.json.jbuilder
json.extract! task, :id, :title, :notes, :completed, :completed_today,
              :goal_id, :is_today, :sort_order, :today_sort_order,
              :timer_minutes, :is_recurring, :recurrence_rule,
              :next_occurrence, :last_completed,
              :due_date,        # NEW
              :upcoming_days    # NEW
              :created_at, :updated_at
```

### HabitSerializer (`app/serializers/habit_serializer.rb`)

If using ActiveModel::Serializers:

```ruby
class HabitSerializer < ActiveModel::Serializer
  attributes :id, :title, :notes, :completed_today, :completion_count,
             :is_today, :sort_order, :today_sort_order, :timer_minutes,
             :frequency_target, :current_streak, :on_track_since,
             :upcoming_days    # NEW
end
```

If using Jbuilder:

```ruby
# app/views/api/habits/_habit.json.jbuilder
json.extract! habit, :id, :title, :notes, :completed_today, :completion_count,
              :is_today, :sort_order, :today_sort_order, :timer_minutes,
              :frequency_target, :current_streak, :on_track_since,
              :upcoming_days,   # NEW
              :created_at, :updated_at
```

## Testing Requirements

### Task Model Tests (`spec/models/task_spec.rb`)

```ruby
RSpec.describe Task, type: :model do
  describe 'validations' do
    it { should validate_numericality_of(:upcoming_days)
          .only_integer
          .is_greater_than_or_equal_to(0)
          .is_less_than_or_equal_to(30)
          .allow_nil }

    it 'accepts valid upcoming_days values' do
      task = build(:task, upcoming_days: 7)
      expect(task).to be_valid
    end

    it 'rejects upcoming_days less than 0' do
      task = build(:task, upcoming_days: -1)
      expect(task).not_to be_valid
      expect(task.errors[:upcoming_days]).to be_present
    end

    it 'rejects upcoming_days greater than 30' do
      task = build(:task, upcoming_days: 31)
      expect(task).not_to be_valid
      expect(task.errors[:upcoming_days]).to be_present
    end

    it 'accepts nil upcoming_days' do
      task = build(:task, upcoming_days: nil)
      expect(task).to be_valid
    end

    it 'accepts valid due_date' do
      task = build(:task, due_date: Date.today + 7.days)
      expect(task).to be_valid
    end

    # Optional: if you implement the recurring task validation
    it 'rejects due_date on recurring tasks' do
      task = build(:task, is_recurring: true, due_date: Date.today + 7.days)
      expect(task).not_to be_valid
      expect(task.errors[:due_date]).to be_present
    end
  end
end
```

### Habit Model Tests (`spec/models/habit_spec.rb`)

```ruby
RSpec.describe Habit, type: :model do
  describe 'validations' do
    it { should validate_numericality_of(:upcoming_days)
          .only_integer
          .is_greater_than_or_equal_to(0)
          .is_less_than_or_equal_to(30)
          .allow_nil }

    it 'accepts valid upcoming_days values' do
      habit = build(:habit, upcoming_days: 14)
      expect(habit).to be_valid
    end

    it 'rejects upcoming_days out of range' do
      habit = build(:habit, upcoming_days: 50)
      expect(habit).not_to be_valid
    end

    it 'accepts nil upcoming_days' do
      habit = build(:habit, upcoming_days: nil)
      expect(habit).to be_valid
    end
  end
end
```

### Controller Tests (`spec/requests/api/tasks_spec.rb`)

```ruby
RSpec.describe 'Tasks API', type: :request do
  describe 'POST /api/tasks' do
    it 'creates task with due_date and upcoming_days' do
      post '/api/tasks', params: {
        task: {
          title: 'Test Task',
          due_date: '2026-04-15',
          upcoming_days: 7
        }
      }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['due_date']).to eq('2026-04-15')
      expect(json['upcoming_days']).to eq(7)
    end

    it 'rejects invalid upcoming_days' do
      post '/api/tasks', params: {
        task: {
          title: 'Test Task',
          upcoming_days: 100
        }
      }

      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json['errors']['upcoming_days']).to be_present
    end
  end

  describe 'PUT /api/tasks/:id' do
    let(:task) { create(:task) }

    it 'updates due_date and upcoming_days' do
      put "/api/tasks/#{task.id}", params: {
        task: {
          due_date: '2026-05-01',
          upcoming_days: 10
        }
      }

      expect(response).to have_http_status(:ok)
      task.reload
      expect(task.due_date.to_s).to eq('2026-05-01')
      expect(task.upcoming_days).to eq(10)
    end

    it 'clears fields when set to null' do
      task.update(due_date: Date.today, upcoming_days: 5)

      put "/api/tasks/#{task.id}", params: {
        task: {
          due_date: nil,
          upcoming_days: nil
        }
      }

      expect(response).to have_http_status(:ok)
      task.reload
      expect(task.due_date).to be_nil
      expect(task.upcoming_days).to be_nil
    end
  end
end
```

### Controller Tests (`spec/requests/api/habits_spec.rb`)

```ruby
RSpec.describe 'Habits API', type: :request do
  describe 'POST /api/habits' do
    it 'creates habit with upcoming_days' do
      post '/api/habits', params: {
        habit: {
          title: 'Test Habit',
          frequency_target: 'every 2 weeks',
          upcoming_days: 3
        }
      }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['upcoming_days']).to eq(3)
    end
  end

  describe 'PUT /api/habits/:id' do
    let(:habit) { create(:habit) }

    it 'updates upcoming_days' do
      put "/api/habits/#{habit.id}", params: {
        habit: { upcoming_days: 14 }
      }

      expect(response).to have_http_status(:ok)
      habit.reload
      expect(habit.upcoming_days).to eq(14)
    end
  end
end
```

## Factory Updates

### Task Factory (`spec/factories/tasks.rb`)

```ruby
FactoryBot.define do
  factory :task do
    title { "Sample Task" }
    notes { nil }
    completed { false }
    is_today { false }
    sort_order { 0 }
    user

    # New fields
    due_date { nil }
    upcoming_days { nil }

    trait :with_due_date do
      due_date { Date.today + 7.days }
      upcoming_days { 3 }
    end

    trait :upcoming_soon do
      due_date { Date.today + 2.days }
      upcoming_days { 5 }
    end
  end
end
```

### Habit Factory (`spec/factories/habits.rb`)

```ruby
FactoryBot.define do
  factory :habit do
    title { "Sample Habit" }
    notes { nil }
    completed_today { false }
    completion_count { 0 }
    is_today { false }
    sort_order { 0 }
    frequency_target { "every day" }
    user

    # New field
    upcoming_days { nil }

    trait :with_upcoming_threshold do
      frequency_target { "every 6 weeks" }
      upcoming_days { 7 }
    end
  end
end
```

## Backwards Compatibility

The mobile app includes backwards compatibility fallbacks, so these changes are **non-breaking**:

1. All new fields are **optional** (nullable)
2. Existing endpoints continue to work without changes
3. Mobile app gracefully handles when fields are not present
4. If backend returns 422/400 for unknown fields, mobile retries without them

**Recommendation:** Deploy backend changes first, then mobile app automatically benefits from new features without requiring updates.

## Deployment Notes

1. **Run migrations:**
   ```bash
   rails db:migrate
   ```

2. **Verify in console:**
   ```ruby
   # Create task with new fields
   task = Task.create!(
     title: "Test upcoming task",
     user: User.first,
     due_date: 7.days.from_now.to_date,
     upcoming_days: 3
   )

   # Create habit with new field
   habit = Habit.create!(
     title: "Test upcoming habit",
     user: User.first,
     frequency_target: "every 2 weeks",
     upcoming_days: 5
   )
   ```

3. **Test API endpoints:**
   ```bash
   # Create task
   curl -X POST https://lifeordered.com/api/tasks \
     -H "Content-Type: application/json" \
     -H "Cookie: connect.sid=..." \
     -d '{"task":{"title":"Test","due_date":"2026-04-15","upcoming_days":7}}'

   # Get tasks (verify fields in response)
   curl -X GET https://lifeordered.com/api/tasks \
     -H "Cookie: connect.sid=..."
   ```

## Questions?

Contact the mobile team if:
- Clarification needed on business logic
- Questions about validation rules
- Need example mobile app code
- Uncertainty about API contract

## Timeline

**Suggested implementation order:**
1. Migrations (5 min)
2. Model validations (10 min)
3. Controller strong params (5 min)
4. Serializer updates (5 min)
5. Tests (30-45 min)

**Total estimated time:** 1-2 hours

---

**Document Version:** 1.0
**Date:** 2026-03-05
**Mobile App Version:** Phase 1 - Upcoming Items Feature
