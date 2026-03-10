# Recipe Queue Backend API Specification

## Overview
The Recipe Queue allows users to queue recipes they plan to cook and then build a shopping list from those queued recipes. The shopping list is implemented as a Goal with Tasks for each ingredient.

## Database Schema

### `recipe_queue` Table
```sql
CREATE TABLE recipe_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  serving_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one recipe per user in queue (can re-add with different serving size)
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX idx_recipe_queue_user ON recipe_queue(user_id);
CREATE INDEX idx_recipe_queue_sort ON recipe_queue(user_id, sort_order);
```

## API Endpoints

**Required Endpoints:** 1-5
**Optional Endpoint:** 6 (shopping list building is handled on frontend)

### 1. Get All Queue Items
**GET** `/api/recipe-queue`

**Description:** Get all recipes in the user's queue, ordered by sort_order

**Response 200:**
```typescript
RecipeQueueItem[] // Array of queue items with full recipe data

interface RecipeQueueItem {
  id: string;
  recipeId: string;
  recipe: Recipe; // Full recipe object with parsedIngredients
  servingMultiplier: number;
  sortOrder: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Implementation Notes:**
- Join with `recipes` table to include full recipe data
- Order by `sort_order ASC`
- Filter by authenticated user's ID

---

### 2. Add Recipe to Queue
**POST** `/api/recipe-queue`

**Body:**
```typescript
{
  recipeId: string;
  servingMultiplier?: number; // Default: 1.0
}
```

**Response 201:**
```typescript
RecipeQueueItem // The created queue item with recipe data
```

**Implementation Notes:**
- If recipe already in queue, update the serving_multiplier instead of creating duplicate
- Set `sort_order` to max(sort_order) + 1 for this user
- Return full recipe data in response

---

### 3. Update Queue Item
**PATCH** `/api/recipe-queue/:id`

**Body:**
```typescript
{
  servingMultiplier?: number;
  sortOrder?: number;
}
```

**Response 200:**
```typescript
RecipeQueueItem // Updated queue item with recipe data
```

**Validation:**
- Verify queue item belongs to authenticated user

---

### 4. Remove from Queue
**DELETE** `/api/recipe-queue/:id`

**Response 204:** No content

**Validation:**
- Verify queue item belongs to authenticated user

---

### 5. Reorder Queue
**POST** `/api/recipe-queue/reorder`

**Body:**
```typescript
{
  items: Array<{
    id: string;
    sortOrder: number;
  }>
}
```

**Response 200:**
```typescript
RecipeQueueItem[] // All queue items in new order
```

**Implementation Notes:**
- Batch update all sort orders
- Validate all IDs belong to authenticated user

---

### 6. Build Shopping List from Queue (OPTIONAL - Frontend Handles This)
**POST** `/api/recipe-queue/build-shopping-list`

**NOTE:** The frontend now handles shopping list building directly using existing `POST /api/goals` and `POST /api/tasks` endpoints. This endpoint is optional and can be implemented later for optimization if needed.

**Frontend Implementation:**
The mobile app performs these steps client-side:
1. Gets all queued recipes with `parsedIngredients`
2. Scales ingredient amounts by `servingMultiplier`
3. Consolidates duplicate ingredients across recipes
4. Sorts by aisle using predefined aisle order
5. Creates goal via `POST /api/goals`
6. Creates tasks via `POST /api/tasks` (one per ingredient)

**If you want to implement this endpoint on the backend:**

**Body:**
```typescript
{
  goalName?: string; // Default: "Shopping List"
}
```

**Response 200:**
```typescript
Goal // The created shopping list goal with tasks
```

**Implementation Logic (if implementing backend version):**

1. **Get all queued recipes** for the user with full ingredient data

2. **Collect and scale all ingredients:**
   - For each recipe in queue:
     - Get `parsedIngredients` array
     - Apply `servingMultiplier` to scale amounts
     - Track which recipe each ingredient came from

3. **Consolidate ingredients by aisle/category:**
   - Group ingredients by: `ingredient name` + `unit` + `aisle`
   - Sum amounts for duplicate ingredients across recipes
   - Track all recipes that use each ingredient
   - Example: "2 cups flour" (Recipe A) + "1 cup flour" (Recipe B) = "3 cups flour" (from Recipe A, Recipe B)

4. **Sort by aisle for efficient shopping:**
   - Use the `aisle` field from `parsedIngredients`
   - Common aisle order (customize as needed):
     ```
     Produce → Dairy → Meat → Bakery → Canned Goods →
     Dry Goods → Frozen → Beverages → Condiments → Other
     ```
   - Within each aisle, sort alphabetically by ingredient name

5. **Create Goal:**
   ```typescript
   {
     title: goalName || "Shopping List",
     description: "Generated from recipe queue",
     color: "#10B981", // Green color
     isHabitGoal: false,
     isArchived: false
   }
   ```

6. **Create Tasks (one per unique ingredient):**
   ```typescript
   {
     title: `${totalScaledAmount} ${unit} ${ingredient}`,
     notes: `from ${recipe1}, ${recipe2}`, // List all recipes using this ingredient
     goalId: <created_goal_id>,
     completed: false,
     isToday: false,
     sortOrder: <aisle_sort_order> // Ordered by aisle, then alphabetically
   }
   ```

7. **Scaling Logic:**
   ```javascript
   function scaleIngredient(ingredient: ParsedIngredient, multiplier: number) {
     if (!ingredient.amount || multiplier === 1) {
       return ingredient.amount;
     }

     // Parse amount (handle fractions like "1/2")
     let numericAmount;
     if (ingredient.amount.includes('/')) {
       const [num, denom] = ingredient.amount.split('/').map(Number);
       numericAmount = num / denom;
     } else {
       numericAmount = parseFloat(ingredient.amount);
     }

     const scaled = numericAmount * multiplier;

     // Format nicely
     if (scaled % 1 === 0) {
       return scaled.toString();
     } else if (scaled < 1) {
       // Try common fractions
       const fractions = [[1,4], [1,3], [1,2], [2,3], [3,4]];
       for (const [n, d] of fractions) {
         if (Math.abs(scaled - n/d) < 0.05) {
           return `${n}/${d}`;
         }
       }
     }
     return scaled.toFixed(2).replace(/\.?0+$/, '');
   }
   ```

8. **Consolidation Logic:**
   ```javascript
   function consolidateIngredients(allIngredients: ScaledIngredient[]) {
     const grouped = new Map();

     for (const item of allIngredients) {
       // Key: ingredient name + unit + aisle (normalized)
       const key = `${item.ingredient.toLowerCase()}_${item.unit}_${item.aisle || 'Other'}`;

       if (grouped.has(key)) {
         const existing = grouped.get(key);
         // Add amounts (if numeric)
         existing.totalAmount = addAmounts(existing.totalAmount, item.amount);
         existing.recipes.push(item.recipeName);
       } else {
         grouped.set(key, {
           ingredient: item.ingredient,
           unit: item.unit,
           amount: item.amount,
           totalAmount: item.amount,
           aisle: item.aisle || 'Other',
           recipes: [item.recipeName]
         });
       }
     }

     return Array.from(grouped.values());
   }
   ```

9. **Return** the created Goal with all Tasks populated, sorted by aisle

**Example Response:**
```json
{
  "id": "goal-uuid",
  "title": "Shopping List",
  "description": "Generated from recipe queue",
  "color": "#10B981",
  "isHabitGoal": false,
  "isArchived": false,
  "sortOrder": 0,
  "userId": "user-uuid",
  "tasks": [
    // PRODUCE section (sortOrder 0-99)
    {
      "id": "task-uuid-1",
      "title": "3 eggs",
      "notes": "from Chocolate Chip Cookies, Pancakes",
      "goalId": "goal-uuid",
      "completed": false,
      "isToday": false,
      "sortOrder": 0
    },
    {
      "id": "task-uuid-2",
      "title": "2 bananas",
      "notes": "from Pancakes",
      "goalId": "goal-uuid",
      "completed": false,
      "isToday": false,
      "sortOrder": 1
    },
    // DAIRY section (sortOrder 100-199)
    {
      "id": "task-uuid-3",
      "title": "2 cups milk",
      "notes": "from Pancakes",
      "goalId": "goal-uuid",
      "completed": false,
      "isToday": false,
      "sortOrder": 100
    },
    {
      "id": "task-uuid-4",
      "title": "1 stick butter",
      "notes": "from Chocolate Chip Cookies",
      "goalId": "goal-uuid",
      "completed": false,
      "isToday": false,
      "sortOrder": 101
    },
    // DRY GOODS section (sortOrder 200-299)
    {
      "id": "task-uuid-5",
      "title": "3 cups flour",
      "notes": "from Chocolate Chip Cookies, Pancakes",
      "goalId": "goal-uuid",
      "completed": false,
      "isToday": false,
      "sortOrder": 200
    },
    {
      "id": "task-uuid-6",
      "title": "2 cups sugar",
      "notes": "from Chocolate Chip Cookies",
      "goalId": "goal-uuid",
      "completed": false,
      "isToday": false,
      "sortOrder": 201
    },
    // CONDIMENTS section (sortOrder 300-399)
    {
      "id": "task-uuid-7",
      "title": "1 tsp vanilla extract",
      "notes": "from Chocolate Chip Cookies",
      "goalId": "goal-uuid",
      "completed": false,
      "isToday": false,
      "sortOrder": 300
    }
    // ... more tasks organized by aisle
  ]
}
```

**Note on Organization:**
- Tasks are grouped by aisle using sortOrder ranges (0-99 = Produce, 100-199 = Dairy, etc.)
- Duplicate ingredients across recipes are consolidated with combined amounts
- Notes field lists all recipes that use the ingredient
- This organization allows efficient shopping by walking through the store aisle-by-aisle

**Aisle Sort Order (sortOrder ranges):**
```javascript
const AISLE_SORT_ORDER = {
  'Produce': 0,
  'Dairy': 100,
  'Meat': 200,
  'Seafood': 300,
  'Bakery': 400,
  'Canned Goods': 500,
  'Dry Goods': 600,
  'Pasta & Rice': 700,
  'Frozen': 800,
  'Beverages': 900,
  'Condiments': 1000,
  'Spices': 1100,
  'Baking': 1200,
  'Other': 9000
};

// Within each aisle, sort alphabetically (sortOrder += alphabetical_offset)
// Example: "apples" = 0, "bananas" = 1, "carrots" = 2, etc.
```

**Implementation Notes:**
- This does NOT clear the queue after building
- Users can build multiple shopping lists from the same queue
- Users manually clear queue items after shopping/cooking
- Transaction recommended to ensure all tasks created successfully
- **Consolidation is REQUIRED** - duplicate ingredients must be combined
- **Aisle sorting is REQUIRED** - tasks must be sorted by aisle for efficient shopping

---

## Error Codes

- `400` - Bad Request (invalid servingMultiplier, missing recipeId, etc.)
- `401` - Unauthorized (not authenticated)
- `404` - Not Found (queue item or recipe doesn't exist)
- `409` - Conflict (recipe already in queue when trying to add)
- `500` - Internal Server Error

## Validation Rules

1. **servingMultiplier:**
   - Must be > 0
   - Recommended range: 0.25 to 10.0
   - Precision: 2 decimal places

2. **sortOrder:**
   - Must be >= 0
   - Integer values only

3. **goalName:**
   - Max length: 100 characters
   - Can contain emoji

## Frontend Usage Flow

1. User views recipe → taps "Add to Queue" → POST `/api/recipe-queue`
2. User adjusts servings in recipe detail → updates queue item → PATCH `/api/recipe-queue/:id`
3. User views Today page → sees Recipe Queue section → GET `/api/recipe-queue`
4. User ready to shop → taps cart icon → POST `/api/recipe-queue/build-shopping-list`
5. Shopping List goal appears in My Stuff → tasks organized by aisle:
   - "Produce" section with eggs, bananas, etc.
   - "Dairy" section with milk, butter, etc.
   - "Dry Goods" section with flour, sugar, etc.
   - etc.
6. User shops → walks through store aisle by aisle, checking off tasks
7. After shopping → user deletes Shopping List goal (which deletes all tasks)
8. User removes recipes from queue → DELETE `/api/recipe-queue/:id` (or keeps for next time)

## Notes

- The queue is persistent - items stay until explicitly removed
- Multiple shopping lists can be built from the same queue
- Ingredients are NOT tracked separately - they're just tasks in a goal
- When a recipe is deleted, queue items are cascade deleted
- Consider adding a "Clear Queue" endpoint for bulk removal

## Critical Requirements

**✅ AISLE-BASED SORTING (Handled by Frontend)**
The mobile frontend handles shopping list building with the following logic:
- Shopping list tasks are sorted by aisle/category (using `parsedIngredients.aisle`)
- Duplicate ingredients across recipes are consolidated
- Users walk through the store once, checking off items aisle by aisle
- Tasks show which recipes use each ingredient

**Frontend generates this structure:**
```
Shopping List Goal:
  ☐ 3 eggs (from Cookies, Pancakes)         [Produce - sortOrder: 0]
  ☐ 2 bananas (from Pancakes)               [Produce - sortOrder: 1]
  ☐ 2 cups milk (from Pancakes)             [Dairy - sortOrder: 100]
  ☐ 1 stick butter (from Cookies)           [Dairy - sortOrder: 101]
  ☐ 3 cups flour (from Cookies, Pancakes)   [Dry Goods - sortOrder: 200]
```

**What Backend Needs to Provide:**
- `parsedIngredients` array with accurate `aisle` field for each ingredient
- This aisle data is used by frontend to organize shopping list
