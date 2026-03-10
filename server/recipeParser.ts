import * as cheerio from 'cheerio';
import { parseIngredient } from 'parse-ingredient';
import type { ParsedIngredient } from '@shared/schema';
import { categorizeIngredients } from './spoonacular';

interface ParsedRecipe {
  url: string;
  title: string;
  imageUrl: string | null;
  description: string | null;
  ingredients: string[];
  parsedIngredients: ParsedIngredient[];
  instructions: string[];
  prepTime: string | null;
  cookTime: string | null;
  totalTime: string | null;
  servings: string | null;
  cuisine: string | null;
  category: string | null;
}

async function parseIngredientsWithCategories(ingredients: string[]): Promise<ParsedIngredient[]> {
  const sizeWords = ['large', 'medium', 'small', 'extra-large', 'jumbo', 'mini'];
  const qualifiers = ['fresh', 'ripe', 'frozen', 'dried', 'canned', 'chopped', 'diced', 
    'minced', 'sliced', 'crushed', 'softened', 'melted', 'room temperature', 'cold',
    'warm', 'hot', 'cooked', 'uncooked', 'raw', 'peeled', 'seeded', 'pitted', 'divided',
    'packed', 'sifted', 'optional'];
  const toTastePatterns = ['to taste', 'as needed', 'for garnish', 'for serving'];
  
  const parsedList: ParsedIngredient[] = ingredients.map(text => {
    const libParsed = parseIngredient(text, {
      ignoreUOMs: sizeWords
    });
    
    const lowerText = text.toLowerCase();
    const toTasteMatch = toTastePatterns.find(p => lowerText.includes(p));
    if (toTasteMatch) {
      const ingredientPart = text.replace(new RegExp(toTasteMatch, 'i'), '').trim()
        .replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
      return {
        amount: null,
        unit: null,
        ingredient: ingredientPart.toLowerCase() || text.toLowerCase(),
        originalText: text,
        notes: toTasteMatch,
        category: null,
        aisle: null,
      };
    }
    
    if (libParsed.length === 0 || libParsed[0].isGroupHeader) {
      return {
        amount: null,
        unit: null,
        ingredient: text.toLowerCase(),
        originalText: text,
        notes: null,
        category: null,
        aisle: null,
      };
    }
    
    const p = libParsed[0];
    
    let amount: string | null = null;
    if (p.quantity !== null) {
      if (p.quantity2 !== null) {
        amount = `${p.quantity}-${p.quantity2}`;
      } else {
        const num = p.quantity;
        if (Number.isInteger(num)) {
          amount = String(num);
        } else {
          const fractions: Record<number, string> = {
            0.25: '1/4', 0.333: '1/3', 0.5: '1/2', 0.667: '2/3', 0.75: '3/4',
            1.25: '1 1/4', 1.333: '1 1/3', 1.5: '1 1/2', 1.667: '1 2/3', 1.75: '1 3/4',
            2.25: '2 1/4', 2.333: '2 1/3', 2.5: '2 1/2', 2.667: '2 2/3', 2.75: '2 3/4',
          };
          const rounded = Math.round(num * 1000) / 1000;
          amount = fractions[rounded] || String(num);
        }
      }
    }
    
    let description = p.description || text;
    const notesList: string[] = [];
    
    const commaMatch = description.match(/,\s*(.+)$/);
    if (commaMatch) {
      notesList.push(commaMatch[1].trim());
      description = description.replace(/,\s*.+$/, '').trim();
    }
    
    const parenMatch = description.match(/\(([^)]+)\)/);
    if (parenMatch) {
      notesList.push(parenMatch[1].trim());
      description = description.replace(/\s*\([^)]+\)\s*/, ' ').trim();
    }
    
    for (const size of sizeWords) {
      const sizeRegex = new RegExp(`\\b${size}\\b`, 'i');
      if (sizeRegex.test(description)) {
        notesList.push(size);
        description = description.replace(sizeRegex, '').trim();
      }
    }
    
    for (const qual of qualifiers) {
      const qualRegex = new RegExp(`\\b${qual}\\b`, 'i');
      if (qualRegex.test(description)) {
        notesList.push(qual);
        description = description.replace(qualRegex, '').trim();
      }
    }
    
    description = description.replace(/\s+/g, ' ').trim();
    
    return {
      amount,
      unit: p.unitOfMeasure || null,
      ingredient: description.toLowerCase(),
      originalText: text,
      notes: notesList.length > 0 ? notesList.join(', ') : null,
      category: null,
      aisle: null,
    };
  });
  
  const ingredientNames = parsedList.map(p => p.ingredient);
  const categories = await categorizeIngredients(ingredientNames);
  
  return parsedList.map(p => {
    const cat = categories.get(p.ingredient);
    return {
      ...p,
      category: cat?.category || null,
      aisle: cat?.aisle || null,
    };
  });
}

function parseIsoDuration(duration: string | null | undefined): string | null {
  if (!duration) return null;
  
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) {
    const dayMatch = duration.match(/^P(\d+)D$/);
    if (dayMatch) {
      const days = parseInt(dayMatch[1]);
      return days === 1 ? '1 day' : `${days} days`;
    }
    return duration;
  }
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(hours === 1 ? '1 hour' : `${hours} hours`);
  }
  if (minutes > 0) {
    parts.push(minutes === 1 ? '1 minute' : `${minutes} minutes`);
  }
  
  return parts.length > 0 ? parts.join(' ') : null;
}

function extractImage(image: any): string | null {
  if (!image) return null;
  
  if (typeof image === 'string') return image;
  
  if (Array.isArray(image)) {
    const first = image[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && first.url) return first.url;
    return null;
  }
  
  if (typeof image === 'object' && image.url) return image.url;
  
  return null;
}

function extractInstructions(instructions: any): string[] {
  if (!instructions) return [];
  
  if (typeof instructions === 'string') {
    return [instructions];
  }
  
  if (Array.isArray(instructions)) {
    return instructions.flatMap((item: any) => {
      if (typeof item === 'string') return [item];
      
      if (item && typeof item === 'object') {
        if (item['@type'] === 'HowToStep' && item.text) {
          return [item.text];
        }
        if (item['@type'] === 'HowToSection' && item.itemListElement) {
          return extractInstructions(item.itemListElement);
        }
        if (item.text) return [item.text];
      }
      
      return [];
    });
  }
  
  return [];
}

function findRecipeInJsonLd(data: any): any {
  if (!data) return null;
  
  if (data['@type'] === 'Recipe') return data;
  
  if (Array.isArray(data['@type']) && data['@type'].includes('Recipe')) return data;
  
  if (data['@graph'] && Array.isArray(data['@graph'])) {
    for (const item of data['@graph']) {
      const recipe = findRecipeInJsonLd(item);
      if (recipe) return recipe;
    }
  }
  
  if (Array.isArray(data)) {
    for (const item of data) {
      const recipe = findRecipeInJsonLd(item);
      if (recipe) return recipe;
    }
  }
  
  return null;
}

export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  const urlObj = new URL(url);
  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    throw new Error('Invalid URL: Must be HTTP or HTTPS');
  }
  
  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
  };

  let html: string;
  try {
    const response = await fetch(url, {
      headers: browserHeaders,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      // Site is blocking direct fetch — try via Jina Reader proxy
      console.log(`Direct fetch blocked (${response.status}), retrying via Jina Reader: ${url}`);
      const jinaUrl = `https://r.jina.ai/${url}`;
      const jinaHeaders: Record<string, string> = {
        ...browserHeaders,
        'X-Return-Format': 'html',
      };
      const hasJinaKey = !!process.env.JINA_API_KEY;
      console.log(`Jina: hasApiKey=${hasJinaKey}, keyLength=${process.env.JINA_API_KEY?.length ?? 0}`);
      if (process.env.JINA_API_KEY) {
        jinaHeaders['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`;
      }
      const jinaResponse = await fetch(jinaUrl, {
        headers: jinaHeaders,
        signal: AbortSignal.timeout(20000),
      });
      console.log(`Jina response status: ${jinaResponse.status}`);
      if (!jinaResponse.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      html = await jinaResponse.text();
    } else {
      html = await response.text();
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('Request timed out while fetching recipe');
    }
    throw new Error(`Failed to fetch recipe: ${error.message}`);
  }
  
  const $ = cheerio.load(html);
  
  let recipeData: any = null;
  
  $('script[type="application/ld+json"]').each((_, element) => {
    if (recipeData) return;
    
    try {
      const jsonText = $(element).html();
      if (jsonText) {
        const parsed = JSON.parse(jsonText);
        const recipe = findRecipeInJsonLd(parsed);
        if (recipe) {
          recipeData = recipe;
        }
      }
    } catch {
    }
  });
  
  if (!recipeData) {
    throw new Error('No recipe data found at URL');
  }
  
  const title = recipeData.name;
  if (!title) {
    throw new Error('Recipe missing required title');
  }
  
  const ingredients = Array.isArray(recipeData.recipeIngredient) 
    ? recipeData.recipeIngredient.filter((i: any) => typeof i === 'string')
    : [];
  
  if (ingredients.length === 0) {
    throw new Error('Recipe missing ingredients');
  }
  
  const instructions = extractInstructions(recipeData.recipeInstructions);
  if (instructions.length === 0) {
    throw new Error('Recipe missing instructions');
  }
  
  const parsedIngredients = await parseIngredientsWithCategories(ingredients);
  
  return {
    url,
    title,
    imageUrl: extractImage(recipeData.image),
    description: recipeData.description || null,
    ingredients,
    parsedIngredients,
    instructions,
    prepTime: parseIsoDuration(recipeData.prepTime),
    cookTime: parseIsoDuration(recipeData.cookTime),
    totalTime: parseIsoDuration(recipeData.totalTime),
    servings: recipeData.recipeYield ? String(recipeData.recipeYield) : null,
    cuisine: recipeData.recipeCuisine || null,
    category: recipeData.recipeCategory || null,
  };
}
