# AI-Powered Shopping List Builder - Backend Specification

## Overview
This endpoint uses Claude Haiku to intelligently categorize ingredients by grocery store sections and **creates multiple category goals** (one per category like Produce, Dairy, Meat, etc.) instead of a single shopping list goal. Each category becomes its own goal with color-coded styling for easy visual identification while shopping.

## Database Schema Updates Required

### 1. Add shopping list fields to `goals` table:

```sql
ALTER TABLE goals
ADD COLUMN type VARCHAR(20) DEFAULT 'regular',
ADD COLUMN shopping_list_group_id UUID NULL;

CREATE INDEX idx_goals_type ON goals(type);
CREATE INDEX idx_goals_shopping_group ON goals(shopping_list_group_id);
```

**Fields:**
- `type`: Either 'regular' (default) or 'shopping' - identifies shopping list goals
- `shopping_list_group_id`: Groups all category goals created in one build operation (same UUID for all goals from one shopping list)

### 2. Keep existing `category` column in `tasks` table:

```sql
-- Already exists from previous migration
ALTER TABLE tasks ADD COLUMN category VARCHAR(50) NULL;
```

This stores the category name (Produce, Dairy, etc.) on each task.

## Endpoint

**POST** `/api/recipe-queue/build-shopping-list`

## Request

### Headers
- `Authorization: Bearer <jwt_token>` (standard auth)
- `Content-Type: application/json`

### Body
```typescript
{
  groupName?: string; // Optional, defaults to "Shopping List" (used in goal descriptions)
}
```

### Example Request
```json
{
  "groupName": "Weekend Groceries"
}
```

## Response

### Success Response (200)
Returns an **array of Goal objects** - one per non-empty category:

```typescript
Goal[] // Array of category goals

interface Goal {
  id: string;
  title: string; // Category name: "Produce", "Dairy", "Meat", etc.
  description: string;
  color: string; // Color-coded per category
  isArchived: boolean;
  isHabitGoal: boolean;
  sortOrder: number;
  userId: string;
  type: 'shopping'; // NEW - identifies as shopping list goal
  shoppingListGroupId: string; // NEW - same for all goals in this build
}
```

### Example Response
```json
[
  {
    "id": "goal-produce-123",
    "title": "Produce",
    "description": "Weekend Groceries from 3 recipes",
    "color": "#10B981",
    "isArchived": false,
    "isHabitGoal": false,
    "sortOrder": 0,
    "userId": "user-456",
    "type": "shopping",
    "shoppingListGroupId": "list-group-789"
  },
  {
    "id": "goal-dairy-124",
    "title": "Dairy",
    "description": "Weekend Groceries from 3 recipes",
    "color": "#F59E0B",
    "isArchived": false,
    "isHabitGoal": false,
    "sortOrder": 100,
    "userId": "user-456",
    "type": "shopping",
    "shoppingListGroupId": "list-group-789"
  },
  {
    "id": "goal-meat-125",
    "title": "Meat",
    "description": "Weekend Groceries from 3 recipes",
    "color": "#EF4444",
    "isArchived": false,
    "isHabitGoal": false,
    "sortOrder": 200,
    "userId": "user-456",
    "type": "shopping",
    "shoppingListGroupId": "list-group-789"
  }
]
```

**Note:** The tasks are created and associated with their respective category goals. Each goal contains only items for that category (e.g., "Produce" goal has kale, tomatoes, etc.).

### Error Responses

**400 Bad Request**
```json
{
  "error": "No recipes in queue"
}
```

**401 Unauthorized**
```json
{
  "error": "Authentication required"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to categorize ingredients with AI"
}
```

## Implementation Requirements

### Step 0: Delete Old Shopping Lists (NEW)

Before creating a new shopping list, delete all existing shopping goals for the user:

```javascript
// Query for all shopping goals
const oldShoppingGoals = await Goal.findAll({
  where: {
    userId: authenticatedUserId,
    type: 'shopping'
  }
});

// Delete each goal (cascade will delete associated tasks)
for (const goal of oldShoppingGoals) {
  await goal.destroy(); // or goalsApi.delete(goal.id)
}
```

**Why:** Users only have one active shopping list at a time. When building a new list, the old one should be completely replaced.

### Step 1: Get Recipe Queue
Fetch all recipes in the user's queue with full recipe data including `parsedIngredients`.

```sql
SELECT rq.*, r.*
FROM recipe_queue rq
JOIN recipes r ON rq.recipe_id = r.id
WHERE rq.user_id = $1
ORDER BY rq.sort_order ASC
```

### Step 2: Collect and Scale Ingredients
For each recipe in the queue:
- Get `parsedIngredients` array
- Apply `servingMultiplier` to scale amounts
- Create a flat list of all ingredients

**Scaling Logic:**
```javascript
function scaleAmount(amount, multiplier) {
  if (!amount || multiplier === 1) return amount;

  // Handle fractions like "1/2"
  let numeric;
  if (amount.includes('/')) {
    const [num, denom] = amount.split('/').map(Number);
    numeric = num / denom;
  } else {
    numeric = parseFloat(amount);
  }

  const scaled = numeric * multiplier;

  // Format nicely
  if (scaled % 1 === 0) return scaled.toString();
  if (scaled < 1) {
    // Try common fractions
    const fractions = [[1,4], [1,3], [1,2], [2,3], [3,4]];
    for (const [n, d] of fractions) {
      if (Math.abs(scaled - n/d) < 0.05) return `${n}/${d}`;
    }
  }
  return scaled.toFixed(2).replace(/\.?0+$/, '');
}
```

### Step 3: Call Claude Haiku for Categorization

**IMPORTANT:** This is the core AI categorization step that replaces all frontend logic.

#### Install Anthropic SDK
```bash
npm install @anthropic-ai/sdk
# or
pip install anthropic
```

#### Environment Variable
Set `ANTHROPIC_API_KEY` in your backend environment.

#### Claude API Call

**Model:** `claude-3-5-haiku-20241022`
**Max Tokens:** 4000
**Temperature:** 0 (deterministic output)

**System Prompt:**
```
You are a grocery shopping assistant. Categorize ingredients by standard grocery store sections and sort them for efficient shopping.

Your categories must be EXACTLY one of these (case-sensitive):
- Produce
- Dairy
- Meat
- Seafood
- Bakery
- Canned Goods
- Dry Goods
- Pasta & Rice
- Frozen
- Beverages
- Condiments
- Spices
- Baking
- Other

Rules:
1. Group duplicate ingredients together (e.g., multiple "kale" entries should be adjacent)
2. Within each category, sort alphabetically by ingredient name
3. Return ONLY valid JSON, no markdown or explanation
4. Use the exact category names listed above
```

**User Prompt Template:**
```
Categorize and sort these grocery items. Return a JSON array where each item has:
- ingredient: the ingredient name
- amount: the amount/quantity (preserve exactly as given)
- unit: the unit of measurement
- category: one of the valid categories from the system prompt
- recipeNames: array of recipe titles using this ingredient

Input ingredients:
{{INGREDIENTS_JSON}}

Return format:
[
  {
    "ingredient": "kale",
    "amount": "2",
    "unit": "cups",
    "category": "Produce",
    "recipeNames": ["Kale Salad", "Green Smoothie"]
  },
  ...
]

Group duplicate ingredients (same name + unit) together, sum their amounts, and combine recipe names.
Sort by category (in the order listed in system prompt), then alphabetically within each category.
```

**Example Input to Claude:**
```json
[
  {
    "ingredient": "kale",
    "amount": "1",
    "unit": "cup",
    "recipeName": "Kale Salad"
  },
  {
    "ingredient": "chicken breast",
    "amount": "2",
    "unit": "lbs",
    "recipeName": "Grilled Chicken"
  },
  {
    "ingredient": "kale",
    "amount": "1",
    "unit": "cup",
    "recipeName": "Green Smoothie"
  },
  {
    "ingredient": "olive oil",
    "amount": "2",
    "unit": "tbsp",
    "recipeName": "Kale Salad"
  }
]
```

**Expected Output from Claude:**
```json
[
  {
    "ingredient": "kale",
    "amount": "2",
    "unit": "cup",
    "category": "Produce",
    "recipeNames": ["Kale Salad", "Green Smoothie"]
  },
  {
    "ingredient": "chicken breast",
    "amount": "2",
    "unit": "lbs",
    "category": "Meat",
    "recipeNames": ["Grilled Chicken"]
  },
  {
    "ingredient": "olive oil",
    "amount": "2",
    "unit": "tbsp",
    "category": "Condiments",
    "recipeNames": ["Kale Salad"]
  }
]
```

#### Implementation Example (Node.js)

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function categorizeIngredients(ingredients) {
  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 4000,
    temperature: 0,
    system: `You are a grocery shopping assistant. Categorize ingredients by standard grocery store sections and sort them for efficient shopping.

Your categories must be EXACTLY one of these (case-sensitive):
- Produce
- Dairy
- Meat
- Seafood
- Bakery
- Canned Goods
- Dry Goods
- Pasta & Rice
- Frozen
- Beverages
- Condiments
- Spices
- Baking
- Other

Rules:
1. Group duplicate ingredients together (e.g., multiple "kale" entries should be adjacent)
2. Within each category, sort alphabetically by ingredient name
3. Return ONLY valid JSON, no markdown or explanation
4. Use the exact category names listed above`,
    messages: [
      {
        role: 'user',
        content: `Categorize and sort these grocery items. Return a JSON array where each item has:
- ingredient: the ingredient name
- amount: the amount/quantity (preserve exactly as given)
- unit: the unit of measurement
- category: one of the valid categories from the system prompt
- recipeNames: array of recipe titles using this ingredient

Input ingredients:
${JSON.stringify(ingredients, null, 2)}

Return format:
[
  {
    "ingredient": "kale",
    "amount": "2",
    "unit": "cups",
    "category": "Produce",
    "recipeNames": ["Kale Salad", "Green Smoothie"]
  },
  ...
]

CRITICAL SORTING REQUIREMENTS:
1. Group duplicate ingredients (same name + unit) together, sum their amounts, and combine recipe names
2. Sort by category in this EXACT order: Produce, Dairy, Meat, Seafood, Bakery, Canned Goods, Dry Goods, Pasta & Rice, Frozen, Beverages, Condiments, Spices, Baking, Other
3. Within each category, sort alphabetically by ingredient name
4. ALL items of one category MUST be together before moving to the next category
5. Example correct order: [Produce items...], [Dairy items...], [Meat items...], etc. - NO mixing!`
      }
    ]
  });

  const responseText = message.content[0].text;

  // Parse JSON response (handle potential markdown wrapping)
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Invalid response from Claude');
  }

  return JSON.parse(jsonMatch[0]);
}
```

#### Implementation Example (Python)

```python
import anthropic
import json
import os

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def categorize_ingredients(ingredients):
    message = client.messages.create(
        model="claude-3-5-haiku-20241022",
        max_tokens=4000,
        temperature=0,
        system="""You are a grocery shopping assistant. Categorize ingredients by standard grocery store sections and sort them for efficient shopping.

Your categories must be EXACTLY one of these (case-sensitive):
- Produce
- Dairy
- Meat
- Seafood
- Bakery
- Canned Goods
- Dry Goods
- Pasta & Rice
- Frozen
- Beverages
- Condiments
- Spices
- Baking
- Other

Rules:
1. Group duplicate ingredients together (e.g., multiple "kale" entries should be adjacent)
2. Within each category, sort alphabetically by ingredient name
3. Return ONLY valid JSON, no markdown or explanation
4. Use the exact category names listed above""",
        messages=[
            {
                "role": "user",
                "content": f"""Categorize and sort these grocery items. Return a JSON array where each item has:
- ingredient: the ingredient name
- amount: the amount/quantity (preserve exactly as given)
- unit: the unit of measurement
- category: one of the valid categories from the system prompt
- recipeNames: array of recipe titles using this ingredient

Input ingredients:
{json.dumps(ingredients, indent=2)}

Return format:
[
  {{
    "ingredient": "kale",
    "amount": "2",
    "unit": "cups",
    "category": "Produce",
    "recipeNames": ["Kale Salad", "Green Smoothie"]
  }},
  ...
]

Group duplicate ingredients (same name + unit) together, sum their amounts, and combine recipe names.
Sort by category (in the order listed in system prompt), then alphabetically within each category."""
            }
        ]
    )

    response_text = message.content[0].text

    # Parse JSON response
    import re
    json_match = re.search(r'\[[\s\S]*\]', response_text)
    if not json_match:
        raise ValueError('Invalid response from Claude')

    return json.loads(json_match.group(0))
```

### Step 4: Create Multiple Category Goals (UPDATED)

**IMPORTANT:** Create **one goal per category** instead of a single shopping list goal.

```javascript
// Category color mapping for visual distinction
const CATEGORY_COLORS = {
  'Produce': '#10B981',      // Green
  'Dairy': '#F59E0B',        // Amber
  'Meat': '#EF4444',         // Red
  'Seafood': '#3B82F6',      // Blue
  'Bakery': '#F97316',       // Orange
  'Canned Goods': '#8B5CF6', // Purple
  'Dry Goods': '#A78BFA',    // Light purple
  'Pasta & Rice': '#FBBF24', // Yellow
  'Frozen': '#60A5FA',       // Light blue
  'Beverages': '#EC4899',    // Pink
  'Condiments': '#14B8A6',   // Teal
  'Spices': '#F472B6',       // Hot pink
  'Baking': '#FB923C',       // Light orange
  'Other': '#6B7280',        // Gray
};

const CATEGORY_SORT_ORDER = {
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

// Group categorized ingredients by category
const ingredientsByCategory = {};
categorizedIngredients.forEach(item => {
  if (!ingredientsByCategory[item.category]) {
    ingredientsByCategory[item.category] = [];
  }
  ingredientsByCategory[item.category].push(item);
});

// Generate shared group ID for this shopping list
const shoppingListGroupId = generateUUID(); // or uuidv4()
const groupName = data?.groupName || 'Shopping List';

// Create one goal per category
const createdGoals = [];

for (const [category, items] of Object.entries(ingredientsByCategory)) {
  const categoryColor = CATEGORY_COLORS[category] || '#10B981';
  const sortOrder = CATEGORY_SORT_ORDER[category] || 9000;

  const goal = await createGoal({
    userId: authenticatedUserId,
    title: category, // e.g., "Produce", "Dairy", "Meat"
    description: `${groupName} from ${recipeQueue.length} recipe${recipeQueue.length === 1 ? '' : 's'}`,
    color: categoryColor,
    isHabitGoal: false,
    isArchived: false,
    sortOrder,
    type: 'shopping', // NEW - marks as shopping list goal
    shoppingListGroupId, // NEW - same for all goals in this build
  });

  createdGoals.push(goal);

  // Create tasks for this category (see Step 5)
  await createTasksForCategory(goal.id, items, category);
}

// Return array of created goals
return createdGoals;
```

**Key Changes:**
- Creates **multiple goals** (one per category with items)
- Skips empty categories (no goal created if category has 0 items)
- Each goal gets a **color-coded color** for visual identification
- All goals share same `shoppingListGroupId` for grouping
- Goals are marked with `type: 'shopping'` for filtering

### Step 5: Create Tasks Per Category (UPDATED)

Create tasks for each category goal. This function is called within the loop in Step 4:

```javascript
async function createTasksForCategory(goalId, items, category) {
  const tasksToCreate = items.map((item, index) => {
    // Build title (without category prefix - it's in the goal title)
    const amountPart = item.amount && item.unit
      ? `${item.amount} ${item.unit}`
      : item.amount || '';
    const title = amountPart
      ? `${amountPart} ${item.ingredient}`
      : item.ingredient;

    // Build notes showing which recipes use this ingredient
    const notes = `from ${item.recipeNames.join(', ')}`;

    return {
      title,
      notes,
      category, // Store category in task for filtering/searching
      goalId, // Associate with this category's goal
      completed: false,
      isToday: false,
      sortOrder: index, // Within category, already sorted by Claude
    };
  });

  // Bulk create tasks (use transaction if possible)
  await bulkCreateTasks(tasksToCreate);
}
```

**Key Changes:**
- Tasks created **per category goal** (not all in one goal)
- `sortOrder` is simple index within category (0, 1, 2, ...) since each goal has its own tasks
- Tasks are already sorted alphabetically by Claude within each category
- Each task stores its `category` for potential future filtering

### Step 6: Return Goals Array (UPDATED)

Return the **array of created goals** to the frontend:

```javascript
return createdGoals; // Array of Goal objects, one per category
```

The frontend will receive multiple goals and display them as separate collapsible sections in the shopping list view.

## Error Handling

### Claude API Errors
- **Rate Limit:** Return 429 with retry-after header
- **Invalid API Key:** Return 500, log error securely
- **Timeout:** Retry once, then fail with 500
- **Invalid JSON Response:** Log response, return 500 with helpful message

### Fallback Behavior
If Claude API fails after retries, you have two options:

**Option A: Fail Fast** (Recommended)
Return 500 error to user with message: "Failed to categorize ingredients. Please try again."

**Option B: Simple Fallback**
Create unsorted shopping list with all items in "Other" category (not recommended as it defeats the purpose).

## Performance Considerations

### Caching
- Consider caching ingredient → category mappings for common ingredients
- Cache key: `ingredient_name:unit`
- TTL: 7 days
- Only call Claude for uncached ingredients

### Batching
- Claude Haiku can handle up to ~200 ingredients in a single call
- If recipe queue > 50 recipes, consider warning user or batching

### Cost
- Claude Haiku pricing: ~$0.25 per million input tokens, ~$1.25 per million output tokens
- Average shopping list: ~100-300 tokens input, ~200-500 tokens output
- Cost per request: < $0.001 (less than 1/10th of a cent)

## Testing

### Test Cases

**Test 1: Empty Queue**
```
Request: POST /api/recipe-queue/build-shopping-list
Expected: 400 "No recipes in queue"
```

**Test 2: Single Recipe**
```
Request: POST with 1 recipe in queue (5 ingredients)
Expected: 200 with goal + 5 tasks sorted by category
```

**Test 3: Duplicate Ingredients**
```
Request: POST with 2 recipes both using "kale"
Expected: Single kale task with combined amount and both recipe names
```

**Test 4: All Categories**
```
Request: POST with recipes covering all 14 categories
Expected: Tasks sorted with Produce first, Other last
```

**Test 5: Custom Goal Name**
```
Request: POST { "goalName": "Weekend Shopping" }
Expected: Goal with title "Weekend Shopping"
```

### Sample Test Data

Create test recipes with these ingredients to verify categorization:
- Kale (should be Produce)
- Milk (should be Dairy)
- Chicken (should be Meat)
- Salmon (should be Seafood)
- Bread (should be Bakery)
- Tomato sauce (should be Canned Goods)
- Flour (should be Dry Goods)
- Pasta (should be Pasta & Rice)
- Ice cream (should be Frozen)
- Orange juice (should be Beverages)
- Soy sauce (should be Condiments)
- Cinnamon (should be Spices)
- Baking powder (should be Baking)

## Migration Notes

### Removing Frontend Logic
After this endpoint is implemented, the following frontend code can be removed from `app/(tabs)/mystuff.tsx`:

- `AISLE_SORT_ORDER` constant (lines 996-1011)
- `correctAisle` function (lines 1014-1208)
- `scaleIngredientAmount` function (lines 1210-1240)
- Most of `handleBuildShoppingList` function (lines 1242-1393)

### New Frontend Code
Replace with a simple call to the backend:

```typescript
const handleBuildShoppingList = async () => {
  if (recipeQueue.length === 0) {
    Alert.alert('No Recipes in Queue', 'Add some recipes to your queue first');
    return;
  }

  try {
    const goal = await recipeQueueApi.buildShoppingList({
      goalName: 'Shopping List'
    });

    await loadData();

    Alert.alert(
      'Shopping List Created',
      `Created shopping list from ${recipeQueue.length} recipe${recipeQueue.length === 1 ? '' : 's'}`,
      [{ text: 'OK', onPress: () => setExpandedGoals(new Set([goal.id])) }]
    );
  } catch (error: any) {
    console.error('Failed to build shopping list:', error);
    Alert.alert('Error', error?.error || 'Failed to build shopping list');
  }
};
```

## API Key Management

**Environment Variable:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Security:**
- NEVER commit API key to git
- Use environment variables or secrets manager
- Rotate key periodically
- Monitor usage at console.anthropic.com

**Getting an API Key:**
1. Sign up at https://console.anthropic.com
2. Go to API Keys section
3. Create new key
4. Add to backend environment

## Summary

This endpoint:
1. ✅ Fetches all recipes from user's queue
2. ✅ Scales ingredients by serving multiplier
3. ✅ Uses Claude Haiku to intelligently categorize by grocery store section
4. ✅ Groups duplicate ingredients (e.g., multiple kale entries)
5. ✅ Sorts by category then alphabetically within category
6. ✅ Creates goal with sorted tasks
7. ✅ Returns goal to frontend

**Result:** A perfectly organized shopping list that groups items by store section (Produce, Dairy, Meat, etc.) with duplicates consolidated, ready for efficient shopping.
