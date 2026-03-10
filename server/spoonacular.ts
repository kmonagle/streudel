import { db } from './db';
import { ingredientCategories } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface CategoryResult {
  category: string;
  aisle: string | null;
}

const categoryMap: Record<string, string> = {
  'tomato': 'Produce', 'onion': 'Produce', 'garlic': 'Produce',
  'lettuce': 'Produce', 'carrot': 'Produce', 'potato': 'Produce',
  'apple': 'Produce', 'banana': 'Produce', 'lemon': 'Produce',
  'lime': 'Produce', 'orange': 'Produce', 'celery': 'Produce',
  'cucumber': 'Produce', 'pepper': 'Produce', 'spinach': 'Produce',
  'broccoli': 'Produce', 'mushroom': 'Produce', 'zucchini': 'Produce',
  'chicken': 'Meat', 'beef': 'Meat', 'pork': 'Meat',
  'turkey': 'Meat', 'lamb': 'Meat', 'bacon': 'Meat',
  'sausage': 'Meat', 'ham': 'Meat',
  'salmon': 'Seafood', 'shrimp': 'Seafood', 'fish': 'Seafood',
  'tuna': 'Seafood', 'crab': 'Seafood', 'lobster': 'Seafood',
  'milk': 'Dairy', 'butter': 'Dairy', 'cheese': 'Dairy',
  'yogurt': 'Dairy', 'cream': 'Dairy', 'egg': 'Dairy',
  'sour cream': 'Dairy', 'cottage cheese': 'Dairy',
  'flour': 'Baking', 'sugar': 'Baking', 'baking powder': 'Baking',
  'baking soda': 'Baking', 'yeast': 'Baking', 'vanilla': 'Baking',
  'cocoa': 'Baking', 'chocolate chip': 'Baking', 'brown sugar': 'Baking',
  'powdered sugar': 'Baking', 'cornstarch': 'Baking',
  'rice': 'Pantry', 'pasta': 'Pantry', 'oil': 'Pantry',
  'salt': 'Pantry', 'vinegar': 'Pantry', 'sauce': 'Pantry',
  'broth': 'Pantry', 'stock': 'Pantry', 'soy sauce': 'Pantry',
  'honey': 'Pantry', 'maple syrup': 'Pantry', 'bread': 'Pantry',
  'cinnamon': 'Spices', 'cumin': 'Spices', 'paprika': 'Spices',
  'oregano': 'Spices', 'basil': 'Spices', 'thyme': 'Spices',
  'rosemary': 'Spices', 'parsley': 'Spices', 'cilantro': 'Spices',
  'ginger': 'Spices', 'nutmeg': 'Spices', 'cayenne': 'Spices',
  'chili': 'Spices', 'curry': 'Spices', 'turmeric': 'Spices',
};

function getFallbackCategory(ingredient: string): string {
  const lower = ingredient.toLowerCase();
  for (const [key, category] of Object.entries(categoryMap)) {
    if (lower.includes(key)) {
      return category;
    }
  }
  return 'Other';
}

export async function categorizeIngredient(ingredientName: string): Promise<CategoryResult> {
  const normalized = ingredientName.toLowerCase().trim();
  
  const cached = await db.select({
    category: ingredientCategories.category,
    aisle: ingredientCategories.aisle,
  })
    .from(ingredientCategories)
    .where(eq(ingredientCategories.ingredient, normalized))
    .limit(1);
  
  if (cached.length > 0) {
    return { category: cached[0].category, aisle: cached[0].aisle };
  }
  
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    console.warn('SPOONACULAR_API_KEY not set, using fallback');
    const fallback = getFallbackCategory(normalized);
    await cacheIngredient(normalized, fallback, null, null, null, 'fallback');
    return { category: fallback, aisle: null };
  }
  
  try {
    const searchUrl = new URL('https://api.spoonacular.com/food/ingredients/search');
    searchUrl.searchParams.set('query', normalized);
    searchUrl.searchParams.set('apiKey', apiKey);
    searchUrl.searchParams.set('number', '1');
    
    const searchResp = await fetch(searchUrl.toString());
    
    if (searchResp.status === 429) {
      console.warn('Spoonacular quota exceeded, using fallback');
      const fallback = getFallbackCategory(normalized);
      await cacheIngredient(normalized, fallback, null, null, null, 'fallback');
      return { category: fallback, aisle: null };
    }
    
    if (searchResp.status === 401 || searchResp.status === 403) {
      console.error('Invalid Spoonacular API key');
      const fallback = getFallbackCategory(normalized);
      await cacheIngredient(normalized, fallback, null, null, null, 'fallback');
      return { category: fallback, aisle: null };
    }
    
    if (!searchResp.ok) {
      throw new Error(`Spoonacular search failed: ${searchResp.status}`);
    }
    
    const searchData = await searchResp.json();
    
    if (!searchData.results || searchData.results.length === 0) {
      const fallback = getFallbackCategory(normalized);
      await cacheIngredient(normalized, fallback, null, null, null, 'fallback');
      return { category: fallback, aisle: null };
    }
    
    const ingredientId = searchData.results[0].id;
    const ingredientImage = searchData.results[0].image;
    
    const infoUrl = new URL(`https://api.spoonacular.com/food/ingredients/${ingredientId}/information`);
    infoUrl.searchParams.set('apiKey', apiKey);
    
    const infoResp = await fetch(infoUrl.toString());
    
    if (!infoResp.ok) {
      const fallback = getFallbackCategory(normalized);
      await cacheIngredient(normalized, fallback, null, ingredientId, ingredientImage, 'fallback');
      return { category: fallback, aisle: null };
    }
    
    const infoData = await infoResp.json();
    
    const category = infoData.categoryPath?.[0] || infoData.aisle || 'Other';
    const aisle = infoData.aisle || null;
    
    await cacheIngredient(normalized, category, aisle, ingredientId, infoData.image || ingredientImage, 'spoonacular');
    
    return { category, aisle };
    
  } catch (error: any) {
    console.error('Spoonacular API error:', error.message);
    const fallback = getFallbackCategory(normalized);
    await cacheIngredient(normalized, fallback, null, null, null, 'fallback');
    return { category: fallback, aisle: null };
  }
}

async function cacheIngredient(
  ingredient: string,
  category: string,
  aisle: string | null,
  spoonacularId: number | null,
  imageUrl: string | null,
  source: 'spoonacular' | 'fallback' | 'manual'
): Promise<void> {
  try {
    await db.insert(ingredientCategories)
      .values({
        ingredient,
        category,
        aisle,
        spoonacularId,
        imageUrl,
        source,
      })
      .onConflictDoUpdate({
        target: ingredientCategories.ingredient,
        set: {
          category,
          aisle,
          spoonacularId,
          imageUrl,
          source,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('Failed to cache ingredient:', error);
  }
}

export async function categorizeIngredients(ingredientNames: string[]): Promise<Map<string, CategoryResult>> {
  const results = new Map<string, CategoryResult>();
  
  for (const name of ingredientNames) {
    const result = await categorizeIngredient(name);
    results.set(name.toLowerCase().trim(), result);
  }
  
  return results;
}
