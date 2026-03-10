import Anthropic from '@anthropic-ai/sdk';
import { categorizeIngredient as spoonacularCategorize } from './spoonacular';

// Map Spoonacular aisles to our categories
const AISLE_TO_CATEGORY: Record<string, string> = {
  'produce': 'Produce',
  'fresh vegetables': 'Produce',
  'fresh fruits': 'Produce',
  'vegetables': 'Produce',
  'fruits': 'Produce',
  'herbs and spices': 'Spices',
  'spices and seasonings': 'Spices',
  'spices': 'Spices',
  'seasonings': 'Spices',
  'meat': 'Meat',
  'beef': 'Meat',
  'pork': 'Meat',
  'poultry': 'Meat',
  'chicken': 'Meat',
  'seafood': 'Seafood',
  'fish': 'Seafood',
  'shellfish': 'Seafood',
  'dairy': 'Dairy',
  'milk, eggs, other dairy': 'Dairy',
  'cheese': 'Dairy',
  'eggs': 'Dairy',
  'bakery/bread': 'Bakery',
  'bread': 'Bakery',
  'bakery': 'Bakery',
  'canned and jarred': 'Canned Goods',
  'canned goods': 'Canned Goods',
  'canned vegetables': 'Canned Goods',
  'canned fruits': 'Canned Goods',
  'canned beans': 'Canned Goods',
  'pasta and rice': 'Pasta & Rice',
  'pasta': 'Pasta & Rice',
  'rice': 'Pasta & Rice',
  'grains': 'Pasta & Rice',
  'cereal': 'Dry Goods',
  'dry goods': 'Dry Goods',
  'flour': 'Dry Goods',
  'oil, vinegar, salad dressing': 'Oils & Vinegars',
  'oils': 'Oils & Vinegars',
  'vinegar': 'Oils & Vinegars',
  'nuts': 'Nuts & Seeds',
  'nuts and seeds': 'Nuts & Seeds',
  'seeds': 'Nuts & Seeds',
  'frozen': 'Frozen',
  'frozen vegetables': 'Frozen',
  'frozen dinners': 'Frozen',
  'beverages': 'Beverages',
  'drinks': 'Beverages',
  'alcoholic beverages': 'Beverages',
  'wine': 'Beverages',
  'beer': 'Beverages',
  'condiments': 'Condiments',
  'sauces': 'Condiments',
  'baking': 'Baking',
  'baking supplies': 'Baking',
};

interface IngredientInput {
  ingredient: string;
  amount: string | null;
  unit: string | null;
  recipeName: string;
}

interface CategorizedIngredient {
  ingredient: string;
  amount: string | null;
  unit: string | null;
  category: string;
  recipeNames: string[];
}

const CATEGORY_SORT_ORDER: Record<string, number> = {
  'Produce': 0,
  'Dairy': 100,
  'Meat': 200,
  'Seafood': 300,
  'Bakery': 400,
  'Canned Goods': 500,
  'Dry Goods': 600,
  'Pasta & Rice': 700,
  'Oils & Vinegars': 800,
  'Nuts & Seeds': 850,
  'Frozen': 900,
  'Beverages': 1000,
  'Condiments': 1100,
  'Spices': 1200,
  'Baking': 1300,
  'Other': 9000
};

const VALID_CATEGORIES = Object.keys(CATEGORY_SORT_ORDER);

// Rule-based categorization - FREE, no API tokens! Expand as much as possible.
const INGREDIENT_RULES: Record<string, string> = {
  // ==================== PRODUCE (150+ items) ====================
  // Vegetables
  'carrot': 'Produce', 'carrots': 'Produce', 'celery': 'Produce', 'onion': 'Produce', 'onions': 'Produce',
  'garlic': 'Produce', 'tomato': 'Produce', 'tomatoes': 'Produce', 'potato': 'Produce', 'potatoes': 'Produce',
  'sweet potato': 'Produce', 'sweet potatoes': 'Produce', 'yam': 'Produce', 'yams': 'Produce',
  'pepper': 'Produce', 'peppers': 'Produce', 'bell pepper': 'Produce', 'bell peppers': 'Produce',
  'jalapeño': 'Produce', 'jalapeno': 'Produce', 'serrano': 'Produce', 'habanero': 'Produce', 'poblano': 'Produce',
  'cucumber': 'Produce', 'cucumbers': 'Produce', 'zucchini': 'Produce', 'squash': 'Produce',
  'butternut squash': 'Produce', 'acorn squash': 'Produce', 'spaghetti squash': 'Produce', 'delicata squash': 'Produce',
  'broccoli': 'Produce', 'cauliflower': 'Produce', 'cabbage': 'Produce', 'red cabbage': 'Produce',
  'brussels sprout': 'Produce', 'brussels sprouts': 'Produce', 'asparagus': 'Produce',
  'mushroom': 'Produce', 'mushrooms': 'Produce', 'shiitake': 'Produce', 'cremini': 'Produce', 'portobello': 'Produce',
  'eggplant': 'Produce', 'artichoke': 'Produce', 'artichokes': 'Produce',
  'beet': 'Produce', 'beets': 'Produce', 'radish': 'Produce', 'radishes': 'Produce',
  'turnip': 'Produce', 'turnips': 'Produce', 'parsnip': 'Produce', 'parsnips': 'Produce',
  'rutabaga': 'Produce', 'fennel': 'Produce', 'leek': 'Produce', 'leeks': 'Produce',
  'shallot': 'Produce', 'shallots': 'Produce', 'scallion': 'Produce', 'scallions': 'Produce',
  'green onion': 'Produce', 'green onions': 'Produce', 'spring onion': 'Produce',
  'corn': 'Produce', 'okra': 'Produce', 'bok choy': 'Produce', 'napa cabbage': 'Produce',
  'green bean': 'Produce', 'green beans': 'Produce', 'snap pea': 'Produce', 'snap peas': 'Produce',
  'snow pea': 'Produce', 'snow peas': 'Produce', 'pea': 'Produce', 'peas': 'Produce',
  'bean sprout': 'Produce', 'bean sprouts': 'Produce', 'bamboo shoots': 'Produce',
  'water chestnut': 'Produce', 'water chestnuts': 'Produce', 'jicama': 'Produce', 'daikon': 'Produce',
  'kohlrabi': 'Produce', 'celeriac': 'Produce', 'chayote': 'Produce', 'tomatillo': 'Produce', 'tomatillos': 'Produce',
  // Leafy Greens
  'kale': 'Produce', 'spinach': 'Produce', 'arugula': 'Produce', 'lettuce': 'Produce',
  'romaine': 'Produce', 'iceberg': 'Produce', 'butter lettuce': 'Produce', 'bibb lettuce': 'Produce',
  'collard green': 'Produce', 'collard greens': 'Produce', 'collards': 'Produce',
  'swiss chard': 'Produce', 'chard': 'Produce', 'mustard green': 'Produce', 'mustard greens': 'Produce',
  'watercress': 'Produce', 'endive': 'Produce', 'radicchio': 'Produce', 'frisee': 'Produce',
  'mesclun': 'Produce', 'mixed greens': 'Produce', 'spring mix': 'Produce', 'baby spinach': 'Produce',
  'microgreen': 'Produce', 'microgreens': 'Produce', 'salad greens': 'Produce',
  // Fresh Herbs
  'parsley': 'Produce', 'cilantro': 'Produce', 'basil': 'Produce', 'mint': 'Produce', 'dill': 'Produce',
  'thyme': 'Produce', 'rosemary': 'Produce', 'sage': 'Produce', 'tarragon': 'Produce',
  'chive': 'Produce', 'chives': 'Produce', 'oregano': 'Produce', 'marjoram': 'Produce',
  'lemongrass': 'Produce', 'fresh ginger': 'Produce', 'ginger': 'Produce', 'ginger root': 'Produce',
  'turmeric root': 'Produce', 'fresh turmeric': 'Produce', 'galangal': 'Produce',
  // Fruits
  'apple': 'Produce', 'apples': 'Produce', 'banana': 'Produce', 'bananas': 'Produce',
  'lemon': 'Produce', 'lemons': 'Produce', 'lime': 'Produce', 'limes': 'Produce',
  'orange': 'Produce', 'oranges': 'Produce', 'grapefruit': 'Produce', 'grapefruits': 'Produce',
  'tangerine': 'Produce', 'tangerines': 'Produce', 'clementine': 'Produce', 'clementines': 'Produce',
  'mandarin': 'Produce', 'mandarins': 'Produce', 'blood orange': 'Produce',
  'strawberry': 'Produce', 'strawberries': 'Produce', 'blueberry': 'Produce', 'blueberries': 'Produce',
  'raspberry': 'Produce', 'raspberries': 'Produce', 'blackberry': 'Produce', 'blackberries': 'Produce',
  'cranberry': 'Produce', 'cranberries': 'Produce', 'grape': 'Produce', 'grapes': 'Produce',
  'cherry': 'Produce', 'cherries': 'Produce', 'peach': 'Produce', 'peaches': 'Produce',
  'plum': 'Produce', 'plums': 'Produce', 'nectarine': 'Produce', 'nectarines': 'Produce',
  'apricot': 'Produce', 'apricots': 'Produce', 'pear': 'Produce', 'pears': 'Produce',
  'mango': 'Produce', 'mangoes': 'Produce', 'mangos': 'Produce', 'papaya': 'Produce', 'papayas': 'Produce',
  'pineapple': 'Produce', 'pineapples': 'Produce', 'kiwi': 'Produce', 'kiwis': 'Produce',
  'watermelon': 'Produce', 'cantaloupe': 'Produce', 'honeydew': 'Produce', 'melon': 'Produce',
  'pomegranate': 'Produce', 'pomegranates': 'Produce', 'fig': 'Produce', 'figs': 'Produce',
  'date': 'Produce', 'dates': 'Produce', 'persimmon': 'Produce', 'persimmons': 'Produce',
  'passion fruit': 'Produce', 'dragon fruit': 'Produce', 'lychee': 'Produce', 'lychees': 'Produce',
  'starfruit': 'Produce', 'guava': 'Produce', 'coconut': 'Produce', 'avocado': 'Produce', 'avocados': 'Produce',
  'rhubarb': 'Produce', 'plantain': 'Produce', 'plantains': 'Produce', 'quince': 'Produce',
  
  // ==================== SPICES (100+ items) ====================
  // Ground Spices
  'cumin': 'Spices', 'ground cumin': 'Spices', 'coriander': 'Spices', 'ground coriander': 'Spices',
  'paprika': 'Spices', 'smoked paprika': 'Spices', 'sweet paprika': 'Spices', 'hot paprika': 'Spices',
  'turmeric': 'Spices', 'ground turmeric': 'Spices', 'cinnamon': 'Spices', 'ground cinnamon': 'Spices',
  'nutmeg': 'Spices', 'ground nutmeg': 'Spices', 'cardamom': 'Spices', 'ground cardamom': 'Spices',
  'allspice': 'Spices', 'ground allspice': 'Spices', 'clove': 'Spices', 'cloves': 'Spices', 'ground cloves': 'Spices',
  'ginger powder': 'Spices', 'ground ginger': 'Spices', 'mace': 'Spices', 'fenugreek': 'Spices',
  'sumac': 'Spices', 'za\'atar': 'Spices', 'zaatar': 'Spices', 'ras el hanout': 'Spices',
  'garam masala': 'Spices', 'curry powder': 'Spices', 'madras curry': 'Spices',
  'five spice': 'Spices', 'chinese five spice': 'Spices', 'pumpkin pie spice': 'Spices',
  'apple pie spice': 'Spices', 'chai spice': 'Spices', 'berbere': 'Spices', 'baharat': 'Spices',
  // Pepper & Heat
  'black pepper': 'Spices', 'white pepper': 'Spices', 'ground pepper': 'Spices', 'peppercorn': 'Spices', 'peppercorns': 'Spices',
  'cayenne': 'Spices', 'cayenne pepper': 'Spices', 'chili powder': 'Spices', 'chile powder': 'Spices',
  'chipotle powder': 'Spices', 'ancho chili': 'Spices', 'ancho powder': 'Spices',
  'crushed red pepper': 'Spices', 'red pepper flakes': 'Spices', 'chili flakes': 'Spices',
  'aleppo pepper': 'Spices', 'szechuan peppercorn': 'Spices', 'szechuan peppercorns': 'Spices',
  // Dried Herbs
  'dried oregano': 'Spices', 'dried thyme': 'Spices', 'dried rosemary': 'Spices', 'dried basil': 'Spices',
  'dried bay leaves': 'Spices', 'bay leaf': 'Spices', 'bay leaves': 'Spices',
  'dried sage': 'Spices', 'dried tarragon': 'Spices', 'dried marjoram': 'Spices',
  'dried dill': 'Spices', 'dried parsley': 'Spices', 'dried chives': 'Spices',
  'herbes de provence': 'Spices', 'italian seasoning': 'Spices', 'poultry seasoning': 'Spices',
  'herbs de provence': 'Spices', 'bouquet garni': 'Spices',
  // Seeds & Whole Spices
  'cumin seed': 'Spices', 'cumin seeds': 'Spices', 'coriander seed': 'Spices', 'coriander seeds': 'Spices',
  'fennel seed': 'Spices', 'fennel seeds': 'Spices', 'mustard seed': 'Spices', 'mustard seeds': 'Spices',
  'celery seed': 'Spices', 'celery seeds': 'Spices', 'caraway seed': 'Spices', 'caraway seeds': 'Spices',
  'poppy seed': 'Spices', 'poppy seeds': 'Spices', 'nigella seed': 'Spices', 'nigella seeds': 'Spices',
  'star anise': 'Spices', 'cardamom pod': 'Spices', 'cardamom pods': 'Spices',
  'cinnamon stick': 'Spices', 'cinnamon sticks': 'Spices', 'whole cloves': 'Spices',
  'whole peppercorns': 'Spices', 'saffron': 'Spices', 'saffron threads': 'Spices',
  'juniper berries': 'Spices', 'annatto': 'Spices', 'annatto seeds': 'Spices',
  // Powders & Seasonings
  'garlic powder': 'Spices', 'onion powder': 'Spices', 'mustard powder': 'Spices', 'dry mustard': 'Spices',
  'celery salt': 'Spices', 'seasoned salt': 'Spices', 'old bay': 'Spices', 'old bay seasoning': 'Spices',
  'everything bagel seasoning': 'Spices', 'tajin': 'Spices', 'adobo seasoning': 'Spices',
  'lemon pepper': 'Spices', 'steak seasoning': 'Spices', 'cajun seasoning': 'Spices', 'creole seasoning': 'Spices',
  'taco seasoning': 'Spices', 'fajita seasoning': 'Spices', 'ranch seasoning': 'Spices',
  // Salt
  'salt': 'Spices', 'kosher salt': 'Spices', 'sea salt': 'Spices', 'table salt': 'Spices',
  'pink himalayan salt': 'Spices', 'flaky salt': 'Spices', 'finishing salt': 'Spices',
  'fleur de sel': 'Spices', 'maldon salt': 'Spices', 'rock salt': 'Spices',
  
  // ==================== DAIRY (80+ items) ====================
  // Milk
  'milk': 'Dairy', 'whole milk': 'Dairy', 'skim milk': 'Dairy', '2% milk': 'Dairy', '1% milk': 'Dairy',
  'buttermilk': 'Dairy', 'half and half': 'Dairy', 'half & half': 'Dairy',
  'heavy cream': 'Dairy', 'whipping cream': 'Dairy', 'heavy whipping cream': 'Dairy',
  'light cream': 'Dairy', 'coffee cream': 'Dairy', 'table cream': 'Dairy',
  'evaporated milk': 'Dairy', 'condensed milk': 'Dairy', 'sweetened condensed milk': 'Dairy',
  'oat milk': 'Dairy', 'almond milk': 'Dairy', 'soy milk': 'Dairy', 'coconut milk': 'Dairy',
  'cashew milk': 'Dairy', 'rice milk': 'Dairy', 'hemp milk': 'Dairy',
  // Cheese
  'cheese': 'Dairy', 'parmesan': 'Dairy', 'parmigiano reggiano': 'Dairy', 'pecorino': 'Dairy', 'pecorino romano': 'Dairy',
  'cheddar': 'Dairy', 'sharp cheddar': 'Dairy', 'mild cheddar': 'Dairy', 'white cheddar': 'Dairy',
  'mozzarella': 'Dairy', 'fresh mozzarella': 'Dairy', 'burrata': 'Dairy',
  'ricotta': 'Dairy', 'cottage cheese': 'Dairy', 'cream cheese': 'Dairy', 'mascarpone': 'Dairy',
  'goat cheese': 'Dairy', 'chevre': 'Dairy', 'feta': 'Dairy', 'feta cheese': 'Dairy',
  'blue cheese': 'Dairy', 'gorgonzola': 'Dairy', 'roquefort': 'Dairy', 'stilton': 'Dairy',
  'brie': 'Dairy', 'camembert': 'Dairy', 'gruyere': 'Dairy', 'emmental': 'Dairy',
  'swiss': 'Dairy', 'swiss cheese': 'Dairy', 'provolone': 'Dairy',
  'monterey jack': 'Dairy', 'pepper jack': 'Dairy', 'colby': 'Dairy', 'colby jack': 'Dairy',
  'havarti': 'Dairy', 'muenster': 'Dairy', 'american cheese': 'Dairy',
  'queso fresco': 'Dairy', 'cotija': 'Dairy', 'oaxaca': 'Dairy', 'manchego': 'Dairy',
  'fontina': 'Dairy', 'asiago': 'Dairy', 'gouda': 'Dairy', 'edam': 'Dairy',
  'velveeta': 'Dairy', 'american singles': 'Dairy', 'string cheese': 'Dairy',
  // Butter
  'butter': 'Dairy', 'unsalted butter': 'Dairy', 'salted butter': 'Dairy',
  'european butter': 'Dairy', 'irish butter': 'Dairy', 'kerrygold': 'Dairy',
  'ghee': 'Dairy', 'clarified butter': 'Dairy', 'margarine': 'Dairy',
  // Eggs
  'egg': 'Dairy', 'eggs': 'Dairy', 'egg white': 'Dairy', 'egg whites': 'Dairy',
  'egg yolk': 'Dairy', 'egg yolks': 'Dairy', 'whole egg': 'Dairy', 'whole eggs': 'Dairy',
  // Yogurt & Cream
  'yogurt': 'Dairy', 'greek yogurt': 'Dairy', 'plain yogurt': 'Dairy', 'vanilla yogurt': 'Dairy',
  'sour cream': 'Dairy', 'creme fraiche': 'Dairy', 'crème fraîche': 'Dairy',
  'labneh': 'Dairy', 'kefir': 'Dairy', 'skyr': 'Dairy',
  
  // ==================== CANNED GOODS (60+ items) ====================
  // Canned Tomatoes
  'canned tomatoes': 'Canned Goods', 'diced tomatoes': 'Canned Goods', 'crushed tomatoes': 'Canned Goods',
  'whole peeled tomatoes': 'Canned Goods', 'fire roasted tomatoes': 'Canned Goods', 'stewed tomatoes': 'Canned Goods',
  'tomato paste': 'Canned Goods', 'tomato sauce': 'Canned Goods', 'tomato puree': 'Canned Goods',
  'san marzano tomatoes': 'Canned Goods', 'petite diced tomatoes': 'Canned Goods',
  'sun dried tomatoes': 'Canned Goods', 'roasted red peppers': 'Canned Goods',
  // Beans & Legumes
  'black beans': 'Canned Goods', 'kidney beans': 'Canned Goods', 'pinto beans': 'Canned Goods',
  'navy beans': 'Canned Goods', 'cannellini beans': 'Canned Goods', 'great northern beans': 'Canned Goods',
  'lima beans': 'Canned Goods', 'butter beans': 'Canned Goods', 'fava beans': 'Canned Goods',
  'chickpeas': 'Canned Goods', 'garbanzo beans': 'Canned Goods', 'black eyed peas': 'Canned Goods',
  'lentils': 'Canned Goods', 'split peas': 'Canned Goods', 'refried beans': 'Canned Goods', 'baked beans': 'Canned Goods',
  // Broth & Stock
  'broth': 'Canned Goods', 'stock': 'Canned Goods', 'chicken broth': 'Canned Goods', 'chicken stock': 'Canned Goods',
  'beef broth': 'Canned Goods', 'beef stock': 'Canned Goods', 'vegetable broth': 'Canned Goods', 'vegetable stock': 'Canned Goods',
  'bone broth': 'Canned Goods', 'bouillon': 'Canned Goods', 'bouillon cube': 'Canned Goods', 'bouillon cubes': 'Canned Goods',
  // Other Canned
  'canned corn': 'Canned Goods', 'canned peas': 'Canned Goods', 'canned green beans': 'Canned Goods',
  'canned mushrooms': 'Canned Goods', 'canned artichokes': 'Canned Goods', 'hearts of palm': 'Canned Goods',
  'canned pumpkin': 'Canned Goods', 'pumpkin puree': 'Canned Goods',
  'olives': 'Canned Goods', 'black olives': 'Canned Goods', 'kalamata olives': 'Canned Goods', 'green olives': 'Canned Goods',
  'capers': 'Canned Goods', 'anchovies': 'Canned Goods', 'sardines': 'Canned Goods',
  'canned tuna': 'Canned Goods', 'canned salmon': 'Canned Goods',
  'chipotle peppers': 'Canned Goods', 'chipotles in adobo': 'Canned Goods', 'green chiles': 'Canned Goods',
  'coconut cream': 'Canned Goods',
  
  // ==================== MEAT (60+ items) ====================
  // Poultry
  'chicken': 'Meat', 'chicken breast': 'Meat', 'chicken breasts': 'Meat',
  'chicken thigh': 'Meat', 'chicken thighs': 'Meat', 'chicken leg': 'Meat', 'chicken legs': 'Meat',
  'chicken wing': 'Meat', 'chicken wings': 'Meat', 'chicken drumstick': 'Meat', 'chicken drumsticks': 'Meat',
  'whole chicken': 'Meat', 'rotisserie chicken': 'Meat', 'ground chicken': 'Meat',
  'turkey': 'Meat', 'turkey breast': 'Meat', 'ground turkey': 'Meat', 'turkey leg': 'Meat',
  'duck': 'Meat', 'duck breast': 'Meat', 'cornish hen': 'Meat', 'quail': 'Meat',
  // Beef
  'beef': 'Meat', 'ground beef': 'Meat', 'steak': 'Meat', 'ribeye': 'Meat', 'rib eye': 'Meat',
  'sirloin': 'Meat', 'filet mignon': 'Meat', 'tenderloin': 'Meat', 'beef tenderloin': 'Meat',
  'flank steak': 'Meat', 'skirt steak': 'Meat', 'strip steak': 'Meat', 'new york strip': 'Meat',
  't-bone': 'Meat', 'porterhouse': 'Meat', 'brisket': 'Meat', 'short rib': 'Meat', 'short ribs': 'Meat',
  'beef ribs': 'Meat', 'chuck roast': 'Meat', 'pot roast': 'Meat', 'tri-tip': 'Meat', 'tri tip': 'Meat',
  'london broil': 'Meat', 'beef stew meat': 'Meat', 'stew meat': 'Meat',
  'corned beef': 'Meat', 'veal': 'Meat', 'oxtail': 'Meat',
  // Pork
  'pork': 'Meat', 'pork chop': 'Meat', 'pork chops': 'Meat',
  'pork tenderloin': 'Meat', 'pork loin': 'Meat', 'pork shoulder': 'Meat', 'pork butt': 'Meat',
  'pulled pork': 'Meat', 'ground pork': 'Meat', 'pork ribs': 'Meat',
  'spare ribs': 'Meat', 'baby back ribs': 'Meat', 'st louis ribs': 'Meat',
  'ham': 'Meat', 'prosciutto': 'Meat', 'pancetta': 'Meat', 'guanciale': 'Meat',
  'bacon': 'Meat', 'canadian bacon': 'Meat', 'pork belly': 'Meat',
  // Lamb
  'lamb': 'Meat', 'lamb chop': 'Meat', 'lamb chops': 'Meat',
  'lamb leg': 'Meat', 'leg of lamb': 'Meat', 'lamb shoulder': 'Meat',
  'ground lamb': 'Meat', 'rack of lamb': 'Meat', 'lamb shank': 'Meat', 'lamb shanks': 'Meat',
  // Sausage & Deli
  'sausage': 'Meat', 'italian sausage': 'Meat', 'breakfast sausage': 'Meat',
  'chorizo': 'Meat', 'andouille': 'Meat', 'bratwurst': 'Meat', 'kielbasa': 'Meat',
  'hot dog': 'Meat', 'hot dogs': 'Meat', 'pepperoni': 'Meat', 'salami': 'Meat',
  'deli meat': 'Meat', 'bologna': 'Meat', 'mortadella': 'Meat', 'capicola': 'Meat',
  
  // ==================== SEAFOOD (40+ items) ====================
  // Fish
  'salmon': 'Seafood', 'salmon fillet': 'Seafood', 'tuna': 'Seafood', 'tuna steak': 'Seafood',
  'cod': 'Seafood', 'halibut': 'Seafood', 'tilapia': 'Seafood', 'mahi mahi': 'Seafood',
  'swordfish': 'Seafood', 'sea bass': 'Seafood', 'branzino': 'Seafood',
  'snapper': 'Seafood', 'red snapper': 'Seafood', 'grouper': 'Seafood',
  'flounder': 'Seafood', 'sole': 'Seafood', 'trout': 'Seafood', 'rainbow trout': 'Seafood',
  'arctic char': 'Seafood', 'catfish': 'Seafood', 'fresh sardines': 'Seafood',
  'fresh anchovies': 'Seafood', 'mackerel': 'Seafood', 'herring': 'Seafood', 'ahi tuna': 'Seafood',
  // Shellfish
  'shrimp': 'Seafood', 'prawns': 'Seafood', 'lobster': 'Seafood', 'lobster tail': 'Seafood',
  'crab': 'Seafood', 'crab meat': 'Seafood', 'crabmeat': 'Seafood', 'crab legs': 'Seafood',
  'crawfish': 'Seafood', 'crayfish': 'Seafood', 'scallop': 'Seafood', 'scallops': 'Seafood',
  'mussel': 'Seafood', 'mussels': 'Seafood', 'clam': 'Seafood', 'clams': 'Seafood',
  'oyster': 'Seafood', 'oysters': 'Seafood', 'squid': 'Seafood', 'calamari': 'Seafood',
  'octopus': 'Seafood', 'sea urchin': 'Seafood', 'uni': 'Seafood',
  
  // ==================== PASTA & RICE (50+ items) ====================
  // Pasta
  'pasta': 'Pasta & Rice', 'spaghetti': 'Pasta & Rice', 'linguine': 'Pasta & Rice', 'fettuccine': 'Pasta & Rice',
  'penne': 'Pasta & Rice', 'rigatoni': 'Pasta & Rice', 'ziti': 'Pasta & Rice',
  'macaroni': 'Pasta & Rice', 'elbow macaroni': 'Pasta & Rice', 'elbow pasta': 'Pasta & Rice',
  'farfalle': 'Pasta & Rice', 'bow tie pasta': 'Pasta & Rice', 'rotini': 'Pasta & Rice', 'fusilli': 'Pasta & Rice',
  'orzo': 'Pasta & Rice', 'orecchiette': 'Pasta & Rice', 'pappardelle': 'Pasta & Rice', 'tagliatelle': 'Pasta & Rice',
  'angel hair': 'Pasta & Rice', 'capellini': 'Pasta & Rice', 'bucatini': 'Pasta & Rice',
  'lasagna noodles': 'Pasta & Rice', 'lasagna sheets': 'Pasta & Rice',
  'egg noodles': 'Pasta & Rice', 'ramen': 'Pasta & Rice', 'ramen noodles': 'Pasta & Rice',
  'udon': 'Pasta & Rice', 'udon noodles': 'Pasta & Rice', 'soba': 'Pasta & Rice', 'soba noodles': 'Pasta & Rice',
  'rice noodles': 'Pasta & Rice', 'vermicelli': 'Pasta & Rice', 'cellophane noodles': 'Pasta & Rice', 'glass noodles': 'Pasta & Rice',
  'gnocchi': 'Pasta & Rice', 'tortellini': 'Pasta & Rice', 'ravioli': 'Pasta & Rice', 'pierogi': 'Pasta & Rice',
  // Rice
  'rice': 'Pasta & Rice', 'white rice': 'Pasta & Rice', 'brown rice': 'Pasta & Rice',
  'jasmine rice': 'Pasta & Rice', 'basmati rice': 'Pasta & Rice', 'arborio rice': 'Pasta & Rice',
  'sushi rice': 'Pasta & Rice', 'wild rice': 'Pasta & Rice', 'long grain rice': 'Pasta & Rice',
  'short grain rice': 'Pasta & Rice', 'sticky rice': 'Pasta & Rice', 'glutinous rice': 'Pasta & Rice',
  'forbidden rice': 'Pasta & Rice', 'black rice': 'Pasta & Rice', 'red rice': 'Pasta & Rice',
  // Grains
  'quinoa': 'Pasta & Rice', 'couscous': 'Pasta & Rice', 'bulgur': 'Pasta & Rice', 'bulgur wheat': 'Pasta & Rice',
  'farro': 'Pasta & Rice', 'barley': 'Pasta & Rice', 'pearl barley': 'Pasta & Rice',
  'freekeh': 'Pasta & Rice', 'millet': 'Pasta & Rice', 'buckwheat': 'Pasta & Rice', 'kasha': 'Pasta & Rice',
  'polenta': 'Pasta & Rice', 'grits': 'Pasta & Rice', 'cornmeal': 'Pasta & Rice',
  'wheat berries': 'Pasta & Rice', 'spelt': 'Pasta & Rice', 'kamut': 'Pasta & Rice',
  'amaranth': 'Pasta & Rice', 'teff': 'Pasta & Rice',
  'oats': 'Pasta & Rice', 'rolled oats': 'Pasta & Rice', 'steel cut oats': 'Pasta & Rice', 'oatmeal': 'Pasta & Rice',
  
  // ==================== OILS & VINEGARS (30+ items) ====================
  // Oils
  'olive oil': 'Oils & Vinegars', 'extra virgin olive oil': 'Oils & Vinegars', 'evoo': 'Oils & Vinegars',
  'vegetable oil': 'Oils & Vinegars', 'canola oil': 'Oils & Vinegars', 'avocado oil': 'Oils & Vinegars',
  'coconut oil': 'Oils & Vinegars', 'sesame oil': 'Oils & Vinegars', 'toasted sesame oil': 'Oils & Vinegars',
  'peanut oil': 'Oils & Vinegars', 'grapeseed oil': 'Oils & Vinegars', 'sunflower oil': 'Oils & Vinegars',
  'safflower oil': 'Oils & Vinegars', 'corn oil': 'Oils & Vinegars', 'walnut oil': 'Oils & Vinegars',
  'truffle oil': 'Oils & Vinegars', 'chili oil': 'Oils & Vinegars', 'hot chili oil': 'Oils & Vinegars',
  'flaxseed oil': 'Oils & Vinegars', 'lard': 'Oils & Vinegars', 'shortening': 'Oils & Vinegars',
  // Vinegars
  'vinegar': 'Oils & Vinegars', 'balsamic vinegar': 'Oils & Vinegars', 'white balsamic': 'Oils & Vinegars',
  'red wine vinegar': 'Oils & Vinegars', 'white wine vinegar': 'Oils & Vinegars',
  'rice vinegar': 'Oils & Vinegars', 'rice wine vinegar': 'Oils & Vinegars',
  'apple cider vinegar': 'Oils & Vinegars', 'sherry vinegar': 'Oils & Vinegars', 'champagne vinegar': 'Oils & Vinegars',
  'malt vinegar': 'Oils & Vinegars', 'white vinegar': 'Oils & Vinegars', 'distilled vinegar': 'Oils & Vinegars',
  'ume plum vinegar': 'Oils & Vinegars',
  
  // ==================== BAKERY (25+ items) ====================
  'bread': 'Bakery', 'white bread': 'Bakery', 'wheat bread': 'Bakery', 'whole wheat bread': 'Bakery',
  'sourdough': 'Bakery', 'sourdough bread': 'Bakery', 'ciabatta': 'Bakery', 'baguette': 'Bakery',
  'french bread': 'Bakery', 'italian bread': 'Bakery', 'rye bread': 'Bakery', 'pumpernickel': 'Bakery',
  'brioche': 'Bakery', 'challah': 'Bakery', 'focaccia': 'Bakery',
  'naan': 'Bakery', 'pita': 'Bakery', 'pita bread': 'Bakery', 'lavash': 'Bakery', 'flatbread': 'Bakery',
  'tortilla': 'Bakery', 'tortillas': 'Bakery', 'flour tortilla': 'Bakery', 'flour tortillas': 'Bakery',
  'corn tortilla': 'Bakery', 'corn tortillas': 'Bakery', 'wrap': 'Bakery', 'wraps': 'Bakery',
  'roll': 'Bakery', 'rolls': 'Bakery', 'dinner roll': 'Bakery', 'dinner rolls': 'Bakery',
  'hamburger bun': 'Bakery', 'hamburger buns': 'Bakery', 'hot dog bun': 'Bakery', 'hot dog buns': 'Bakery',
  'english muffin': 'Bakery', 'english muffins': 'Bakery', 'bagel': 'Bakery', 'bagels': 'Bakery',
  'croissant': 'Bakery', 'croissants': 'Bakery',
  'breadcrumbs': 'Bakery', 'bread crumbs': 'Bakery', 'panko': 'Bakery', 'panko breadcrumbs': 'Bakery',
  'croutons': 'Bakery',
  
  // ==================== BAKING (50+ items) ====================
  // Flour
  'flour': 'Baking', 'all purpose flour': 'Baking', 'all-purpose flour': 'Baking',
  'bread flour': 'Baking', 'cake flour': 'Baking', 'pastry flour': 'Baking',
  'whole wheat flour': 'Baking', 'self rising flour': 'Baking', 'self-rising flour': 'Baking',
  'almond flour': 'Baking', 'coconut flour': 'Baking', 'oat flour': 'Baking',
  'rice flour': 'Baking', 'tapioca flour': 'Baking', 'tapioca starch': 'Baking',
  'cornstarch': 'Baking', 'corn starch': 'Baking', 'arrowroot': 'Baking', 'arrowroot powder': 'Baking',
  'potato starch': 'Baking',
  // Leaveners
  'baking powder': 'Baking', 'baking soda': 'Baking', 'bicarbonate of soda': 'Baking',
  'yeast': 'Baking', 'active dry yeast': 'Baking', 'instant yeast': 'Baking', 'rapid rise yeast': 'Baking',
  'cream of tartar': 'Baking',
  // Sweeteners (for baking)
  'sugar': 'Baking', 'granulated sugar': 'Baking', 'white sugar': 'Baking',
  'brown sugar': 'Baking', 'light brown sugar': 'Baking', 'dark brown sugar': 'Baking',
  'powdered sugar': 'Baking', 'confectioners sugar': 'Baking', 'icing sugar': 'Baking',
  'turbinado sugar': 'Baking', 'demerara sugar': 'Baking', 'coconut sugar': 'Baking',
  'molasses': 'Baking', 'corn syrup': 'Baking', 'light corn syrup': 'Baking', 'dark corn syrup': 'Baking',
  'agave': 'Baking', 'agave nectar': 'Baking',
  // Extracts
  'vanilla extract': 'Baking', 'vanilla': 'Baking', 'vanilla bean': 'Baking', 'vanilla paste': 'Baking',
  'almond extract': 'Baking', 'lemon extract': 'Baking', 'peppermint extract': 'Baking',
  'coconut extract': 'Baking', 'orange extract': 'Baking', 'rum extract': 'Baking',
  // Chocolate
  'chocolate chips': 'Baking', 'chocolate chip': 'Baking', 'dark chocolate chips': 'Baking',
  'milk chocolate chips': 'Baking', 'white chocolate chips': 'Baking',
  'dark chocolate': 'Baking', 'milk chocolate': 'Baking', 'white chocolate': 'Baking',
  'cocoa powder': 'Baking', 'unsweetened cocoa': 'Baking', 'dutch process cocoa': 'Baking',
  'unsweetened chocolate': 'Baking', 'bittersweet chocolate': 'Baking', 'semisweet chocolate': 'Baking',
  'baking chocolate': 'Baking', 'cacao nibs': 'Baking',
  // Other
  'food coloring': 'Baking', 'sprinkles': 'Baking', 'decorating sugar': 'Baking',
  'pie crust': 'Baking', 'puff pastry': 'Baking', 'phyllo dough': 'Baking', 'filo dough': 'Baking',
  'graham cracker': 'Baking', 'graham crackers': 'Baking', 'graham cracker crumbs': 'Baking',
  'gelatin': 'Baking', 'unflavored gelatin': 'Baking', 'pectin': 'Baking',
  
  // ==================== NUTS & SEEDS (35+ items) ====================
  // Nuts
  'almond': 'Nuts & Seeds', 'almonds': 'Nuts & Seeds', 'sliced almonds': 'Nuts & Seeds', 'slivered almonds': 'Nuts & Seeds',
  'walnut': 'Nuts & Seeds', 'walnuts': 'Nuts & Seeds', 'pecan': 'Nuts & Seeds', 'pecans': 'Nuts & Seeds',
  'cashew': 'Nuts & Seeds', 'cashews': 'Nuts & Seeds', 'peanut': 'Nuts & Seeds', 'peanuts': 'Nuts & Seeds',
  'pistachio': 'Nuts & Seeds', 'pistachios': 'Nuts & Seeds',
  'macadamia': 'Nuts & Seeds', 'macadamia nuts': 'Nuts & Seeds',
  'hazelnut': 'Nuts & Seeds', 'hazelnuts': 'Nuts & Seeds', 'pine nut': 'Nuts & Seeds', 'pine nuts': 'Nuts & Seeds',
  'brazil nut': 'Nuts & Seeds', 'brazil nuts': 'Nuts & Seeds', 'chestnut': 'Nuts & Seeds', 'chestnuts': 'Nuts & Seeds',
  'marcona almonds': 'Nuts & Seeds', 'mixed nuts': 'Nuts & Seeds', 'chopped nuts': 'Nuts & Seeds',
  // Seeds
  'sunflower seed': 'Nuts & Seeds', 'sunflower seeds': 'Nuts & Seeds',
  'pumpkin seed': 'Nuts & Seeds', 'pumpkin seeds': 'Nuts & Seeds', 'pepitas': 'Nuts & Seeds',
  'chia seed': 'Nuts & Seeds', 'chia seeds': 'Nuts & Seeds',
  'flax seed': 'Nuts & Seeds', 'flax seeds': 'Nuts & Seeds', 'flaxseed': 'Nuts & Seeds', 'ground flaxseed': 'Nuts & Seeds',
  'hemp seed': 'Nuts & Seeds', 'hemp seeds': 'Nuts & Seeds', 'hemp hearts': 'Nuts & Seeds',
  'sesame seed': 'Nuts & Seeds', 'sesame seeds': 'Nuts & Seeds',
  // Nut Butters
  'peanut butter': 'Nuts & Seeds', 'almond butter': 'Nuts & Seeds', 'cashew butter': 'Nuts & Seeds',
  'sunflower seed butter': 'Nuts & Seeds', 'tahini': 'Nuts & Seeds',
  'flaked almonds': 'Nuts & Seeds', 'almond flakes': 'Nuts & Seeds', 'toasted almonds': 'Nuts & Seeds',
  
  // ==================== CONDIMENTS (60+ items) ====================
  // Asian
  'soy sauce': 'Condiments', 'tamari': 'Condiments', 'coconut aminos': 'Condiments',
  'fish sauce': 'Condiments', 'oyster sauce': 'Condiments', 'hoisin sauce': 'Condiments', 'hoisin': 'Condiments',
  'teriyaki sauce': 'Condiments', 'teriyaki': 'Condiments', 'ponzu': 'Condiments',
  'sriracha': 'Condiments', 'chili garlic sauce': 'Condiments', 'sambal oelek': 'Condiments', 'sambal': 'Condiments',
  'gochujang': 'Condiments', 'gochugaru': 'Condiments', 'doenjang': 'Condiments',
  'miso paste': 'Condiments', 'miso': 'Condiments', 'white miso': 'Condiments', 'red miso': 'Condiments',
  'mirin': 'Condiments', 'sake': 'Condiments', 'cooking sake': 'Condiments', 'rice wine': 'Condiments',
  'wasabi': 'Condiments', 'pickled ginger': 'Condiments', 'togarashi': 'Condiments',
  // American
  'ketchup': 'Condiments', 'catsup': 'Condiments', 'mustard': 'Condiments', 'yellow mustard': 'Condiments',
  'dijon mustard': 'Condiments', 'dijon': 'Condiments', 'whole grain mustard': 'Condiments', 'stone ground mustard': 'Condiments',
  'spicy mustard': 'Condiments', 'honey mustard': 'Condiments',
  'mayonnaise': 'Condiments', 'mayo': 'Condiments', 'aioli': 'Condiments',
  'relish': 'Condiments', 'pickle relish': 'Condiments', 'sweet relish': 'Condiments',
  'bbq sauce': 'Condiments', 'barbecue sauce': 'Condiments',
  'worcestershire sauce': 'Condiments', 'worcestershire': 'Condiments',
  'steak sauce': 'Condiments', 'a1 sauce': 'Condiments',
  'hot sauce': 'Condiments', 'tabasco': 'Condiments', 'frank\'s red hot': 'Condiments', 'buffalo sauce': 'Condiments',
  'ranch dressing': 'Condiments', 'ranch': 'Condiments', 'blue cheese dressing': 'Condiments',
  // Other
  'honey': 'Condiments', 'raw honey': 'Condiments',
  'maple syrup': 'Condiments', 'pure maple syrup': 'Condiments',
  'jam': 'Condiments', 'jelly': 'Condiments', 'preserves': 'Condiments', 'marmalade': 'Condiments',
  'nutella': 'Condiments', 'chocolate spread': 'Condiments',
  'pesto': 'Condiments', 'basil pesto': 'Condiments',
  'harissa': 'Condiments', 'harissa paste': 'Condiments',
  'chimichurri': 'Condiments', 'romesco': 'Condiments',
  'salsa': 'Condiments', 'pico de gallo': 'Condiments', 'verde salsa': 'Condiments', 'salsa verde': 'Condiments',
  'enchilada sauce': 'Condiments', 'taco sauce': 'Condiments',
  'curry paste': 'Condiments', 'red curry paste': 'Condiments', 'green curry paste': 'Condiments', 'yellow curry paste': 'Condiments',
  'hummus': 'Condiments', 'baba ganoush': 'Condiments', 'tzatziki': 'Condiments',
  'chutney': 'Condiments', 'mango chutney': 'Condiments',
  
  // ==================== BEVERAGES (35+ items) ====================
  // Coffee & Tea
  'coffee': 'Beverages', 'ground coffee': 'Beverages', 'coffee beans': 'Beverages', 'espresso': 'Beverages',
  'instant coffee': 'Beverages', 'decaf coffee': 'Beverages',
  'tea': 'Beverages', 'black tea': 'Beverages', 'green tea': 'Beverages', 'herbal tea': 'Beverages',
  'chai': 'Beverages', 'chai tea': 'Beverages', 'matcha': 'Beverages', 'earl grey': 'Beverages',
  'chamomile tea': 'Beverages', 'peppermint tea': 'Beverages', 'oolong tea': 'Beverages',
  // Juice
  'orange juice': 'Beverages', 'apple juice': 'Beverages', 'grape juice': 'Beverages',
  'cranberry juice': 'Beverages', 'tomato juice': 'Beverages', 'vegetable juice': 'Beverages',
  'lemon juice': 'Beverages', 'lime juice': 'Beverages', 'pomegranate juice': 'Beverages',
  'grapefruit juice': 'Beverages', 'pineapple juice': 'Beverages',
  // Alcohol
  'wine': 'Beverages', 'red wine': 'Beverages', 'white wine': 'Beverages', 'rose wine': 'Beverages',
  'cooking wine': 'Beverages', 'sherry': 'Beverages', 'cooking sherry': 'Beverages',
  'marsala wine': 'Beverages', 'marsala': 'Beverages', 'port': 'Beverages', 'port wine': 'Beverages',
  'beer': 'Beverages', 'ale': 'Beverages', 'lager': 'Beverages', 'stout': 'Beverages',
  'vodka': 'Beverages', 'rum': 'Beverages', 'bourbon': 'Beverages', 'whiskey': 'Beverages', 'whisky': 'Beverages',
  'brandy': 'Beverages', 'cognac': 'Beverages', 'tequila': 'Beverages', 'gin': 'Beverages',
  'liqueur': 'Beverages', 'vermouth': 'Beverages', 'kahlua': 'Beverages', 'amaretto': 'Beverages', 'grand marnier': 'Beverages',
  // Other
  'soda': 'Beverages', 'sparkling water': 'Beverages', 'seltzer': 'Beverages',
  'tonic water': 'Beverages', 'club soda': 'Beverages', 'ginger ale': 'Beverages',
  'coconut water': 'Beverages', 'kombucha': 'Beverages',
  
  // ==================== FROZEN (25+ items) ====================
  'frozen peas': 'Frozen', 'frozen corn': 'Frozen', 'frozen spinach': 'Frozen',
  'frozen broccoli': 'Frozen', 'frozen green beans': 'Frozen', 'frozen mixed vegetables': 'Frozen',
  'frozen stir fry vegetables': 'Frozen', 'frozen edamame': 'Frozen',
  'frozen berries': 'Frozen', 'frozen strawberries': 'Frozen', 'frozen blueberries': 'Frozen',
  'frozen raspberries': 'Frozen', 'frozen mixed berries': 'Frozen',
  'frozen mango': 'Frozen', 'frozen peaches': 'Frozen', 'frozen pineapple': 'Frozen',
  'frozen banana': 'Frozen', 'frozen açaí': 'Frozen', 'frozen acai': 'Frozen',
  'frozen pizza': 'Frozen', 'frozen waffles': 'Frozen', 'frozen pancakes': 'Frozen',
  'ice cream': 'Frozen', 'frozen yogurt': 'Frozen', 'sorbet': 'Frozen', 'gelato': 'Frozen',
  'frozen pie crust': 'Frozen', 'frozen puff pastry': 'Frozen', 'frozen phyllo': 'Frozen',
  
  // ==================== DRY GOODS (30+ items) ====================
  'cereal': 'Dry Goods', 'granola': 'Dry Goods', 'muesli': 'Dry Goods',
  'cream of wheat': 'Dry Goods', 'instant oatmeal': 'Dry Goods',
  'crackers': 'Dry Goods', 'saltines': 'Dry Goods', 'ritz crackers': 'Dry Goods',
  'chips': 'Dry Goods', 'potato chips': 'Dry Goods', 'tortilla chips': 'Dry Goods',
  'pretzels': 'Dry Goods', 'popcorn': 'Dry Goods', 'rice cakes': 'Dry Goods', 'pita chips': 'Dry Goods',
  'raisins': 'Dry Goods', 'dried cranberries': 'Dry Goods', 'craisins': 'Dry Goods',
  'dried apricots': 'Dry Goods', 'dried figs': 'Dry Goods', 'dried dates': 'Dry Goods',
  'dried mango': 'Dry Goods', 'dried cherries': 'Dry Goods', 'prunes': 'Dry Goods',
  'dried coconut': 'Dry Goods', 'shredded coconut': 'Dry Goods', 'coconut flakes': 'Dry Goods',
  'dried beans': 'Dry Goods', 'dried lentils': 'Dry Goods', 'dried chickpeas': 'Dry Goods',
  'seaweed': 'Dry Goods', 'seasoned seaweed': 'Dry Goods', 'nori': 'Dry Goods', 'roasted seaweed': 'Dry Goods',
  'seaweed snacks': 'Dry Goods', 'kelp': 'Dry Goods', 'wakame': 'Dry Goods', 'kombu': 'Dry Goods', 'dulse': 'Dry Goods',
};

function getRuleBasedCategory(ingredient: string): string | null {
  const lower = ingredient.toLowerCase().trim();
  
  // Check for "can" or "canned" - always Canned Goods
  if (lower.includes('can ') || lower.includes('canned') || lower.startsWith('can ')) {
    return 'Canned Goods';
  }
  
  // Direct match
  if (INGREDIENT_RULES[lower]) {
    return INGREDIENT_RULES[lower];
  }
  
  // Check if ingredient contains any rule key
  for (const [key, category] of Object.entries(INGREDIENT_RULES)) {
    if (lower.includes(key)) {
      return category;
    }
  }
  
  return null;
}

const SYSTEM_PROMPT = `You are a grocery store assistant. Categorize each ingredient into exactly one category.

Return ONLY a JSON object mapping ingredient names to categories. No other text.

CATEGORY RULES:

Produce: Fresh vegetables, fruits, leafy greens, fresh herbs
- VEGETABLES: carrots, onions, garlic, tomatoes, potatoes, sweet potatoes, peppers, bell peppers, jalapeños, celery, broccoli, cauliflower, mushrooms, zucchini, squash, butternut squash, acorn squash, eggplant, asparagus, green beans, snap peas, snow peas, corn, artichokes, beets, radishes, turnips, parsnips, rutabaga, fennel, leeks, shallots, scallions, green onions, cucumber, okra, brussels sprouts, bok choy, napa cabbage
- LEAFY GREENS: kale, spinach, arugula, lettuce, romaine, iceberg, cabbage, collard greens, swiss chard, mustard greens, watercress, endive, radicchio, mesclun
- FRESH HERBS: parsley, cilantro, basil, mint, dill, rosemary, thyme, sage, tarragon, chives, oregano (fresh), marjoram, lemongrass, bay leaves (fresh)
- FRUITS: apples, bananas, lemons, limes, oranges, grapefruits, tangerines, clementines, berries, strawberries, blueberries, raspberries, blackberries, cranberries, grapes, cherries, peaches, plums, nectarines, apricots, pears, mangoes, papayas, pineapples, kiwis, melons, watermelon, cantaloupe, honeydew, pomegranates, figs, dates, persimmons, passion fruit, dragon fruit, lychee, starfruit, coconut (fresh), avocados, rhubarb
- ginger, turmeric root (fresh)

Spices: Ground/dried seasonings from the spice aisle
- GROUND SPICES: cumin, coriander, paprika, smoked paprika, turmeric, cinnamon, nutmeg, cardamom, allspice, cloves, ginger (ground), mace, fenugreek, sumac, za'atar, ras el hanout, garam masala, curry powder, five spice, pumpkin pie spice
- PEPPER/HEAT: black pepper, white pepper, cayenne, chili powder, chipotle powder, ancho chili, crushed red pepper, red pepper flakes, aleppo pepper, szechuan peppercorns
- DRIED HERBS: oregano (dried), thyme (dried), rosemary (dried), basil (dried), bay leaves (dried), sage (dried), tarragon (dried), marjoram (dried), dill (dried), parsley (dried), herbes de provence, italian seasoning
- SEEDS/WHOLE: cumin seeds, coriander seeds, fennel seeds, mustard seeds, celery seeds, caraway seeds, poppy seeds, sesame seeds, nigella seeds, star anise, cardamom pods, cinnamon sticks, whole cloves, whole peppercorns, saffron
- POWDERS: garlic powder, onion powder, mustard powder, celery salt, seasoned salt, old bay, everything bagel seasoning
- salt, kosher salt, sea salt, pink himalayan salt, flaky salt

Dairy: Refrigerated dairy products
- MILK: milk, whole milk, skim milk, 2% milk, buttermilk, half and half, heavy cream, whipping cream, light cream, evaporated milk, sweetened condensed milk, oat milk, almond milk, soy milk, coconut milk (refrigerated)
- CHEESE: cheese, parmesan, parmigiano reggiano, pecorino romano, cheddar, sharp cheddar, mozzarella, fresh mozzarella, burrata, ricotta, cottage cheese, cream cheese, mascarpone, goat cheese, feta, blue cheese, gorgonzola, brie, camembert, gruyere, swiss, provolone, monterey jack, pepper jack, colby, havarti, muenster, american cheese, queso fresco, cotija, manchego, fontina, asiago, gouda, edam, velveeta
- BUTTER: butter, unsalted butter, salted butter, european butter, ghee, margarine
- EGGS: eggs, egg whites, egg yolks
- YOGURT: yogurt, greek yogurt, plain yogurt, vanilla yogurt, sour cream, creme fraiche, labneh, kefir

Canned Goods: Canned items, jarred items, shelf-stable legumes
- CANNED TOMATOES: canned tomatoes, diced tomatoes, crushed tomatoes, whole peeled tomatoes, fire roasted tomatoes, stewed tomatoes, tomato paste, tomato sauce, tomato puree, sun dried tomatoes, roasted red peppers
- BEANS/LEGUMES: black beans, kidney beans, pinto beans, navy beans, cannellini beans, great northern beans, lima beans, butter beans, chickpeas, garbanzo beans, black eyed peas, lentils, split peas, refried beans, baked beans
- BROTH/STOCK: chicken broth, beef broth, vegetable broth, chicken stock, beef stock, bone broth
- CANNED VEGETABLES: canned corn, canned peas, canned green beans, canned carrots, canned mushrooms, canned artichokes, hearts of palm, bamboo shoots, water chestnuts, canned pumpkin
- CANNED FRUITS: canned peaches, canned pears, canned pineapple, canned mandarin oranges, fruit cocktail, canned cherries, applesauce
- OTHER CANNED: coconut milk (canned), coconut cream, evaporated milk, sweetened condensed milk, chipotle peppers in adobo, green chiles, olives, capers, anchovies, sardines, tuna (canned), salmon (canned)

Meat: Fresh or frozen animal protein (not seafood)
- POULTRY: chicken, chicken breast, chicken thighs, chicken wings, chicken drumsticks, whole chicken, ground chicken, turkey, turkey breast, ground turkey, duck, cornish hen, quail
- BEEF: beef, ground beef, steak, ribeye, sirloin, filet mignon, flank steak, skirt steak, brisket, short ribs, beef ribs, chuck roast, pot roast, beef tenderloin, tri-tip, london broil, beef stew meat, corned beef, veal
- PORK: pork, pork chops, pork tenderloin, pork loin, pork shoulder, pork butt, pulled pork, ground pork, pork ribs, spare ribs, baby back ribs, ham, prosciutto, pancetta, bacon, canadian bacon, pork belly
- LAMB: lamb, lamb chops, lamb leg, lamb shoulder, ground lamb, rack of lamb, lamb shank
- OTHER: sausage, italian sausage, breakfast sausage, chorizo, andouille, bratwurst, kielbasa, hot dogs, pepperoni, salami, deli meat, bologna

Seafood: Fish and shellfish
- FISH: salmon, tuna, cod, halibut, tilapia, mahi mahi, swordfish, sea bass, branzino, snapper, grouper, flounder, sole, trout, arctic char, catfish, sardines, anchovies, mackerel, herring
- SHELLFISH: shrimp, prawns, lobster, crab, crab meat, crawfish, crayfish, scallops, mussels, clams, oysters, squid, calamari, octopus

Pasta & Rice: Dry grains and pasta
- PASTA: pasta, spaghetti, linguine, fettuccine, penne, rigatoni, ziti, macaroni, elbow macaroni, farfalle, bow tie pasta, rotini, fusilli, orzo, orecchiette, pappardelle, tagliatelle, angel hair, capellini, bucatini, lasagna noodles, egg noodles, ramen noodles, udon noodles, soba noodles, rice noodles, vermicelli, gnocchi, tortellini, ravioli
- RICE: rice, white rice, brown rice, jasmine rice, basmati rice, arborio rice, sushi rice, wild rice, long grain rice, short grain rice, sticky rice, forbidden rice, black rice, red rice
- GRAINS: quinoa, couscous, bulgur, farro, barley, pearl barley, freekeh, millet, buckwheat, kasha, polenta, grits, cornmeal, wheat berries, spelt, kamut, amaranth, teff, oats, rolled oats, steel cut oats

Oils & Vinegars: Cooking oils and vinegars
- OILS: olive oil, extra virgin olive oil, vegetable oil, canola oil, avocado oil, coconut oil, sesame oil, toasted sesame oil, peanut oil, grapeseed oil, sunflower oil, safflower oil, corn oil, walnut oil, truffle oil, chili oil
- VINEGARS: balsamic vinegar, white balsamic, red wine vinegar, white wine vinegar, rice vinegar, rice wine vinegar, apple cider vinegar, sherry vinegar, champagne vinegar, malt vinegar, distilled white vinegar, ume plum vinegar

Bakery: Bread products
- bread, white bread, wheat bread, whole grain bread, sourdough, ciabatta, baguette, french bread, italian bread, rye bread, pumpernickel, brioche, challah, focaccia, naan, pita, lavash, flatbread, tortillas, flour tortillas, corn tortillas, wraps, rolls, dinner rolls, hamburger buns, hot dog buns, english muffins, bagels, croissants, breadcrumbs, panko, croutons

Baking: Baking supplies
- FLOUR: flour, all purpose flour, bread flour, cake flour, pastry flour, whole wheat flour, self rising flour, almond flour, coconut flour, oat flour, rice flour, tapioca flour, cornstarch, arrowroot
- LEAVENERS: baking powder, baking soda, yeast, active dry yeast, instant yeast, cream of tartar
- SWEETENERS: sugar, granulated sugar, brown sugar, powdered sugar, confectioners sugar, turbinado sugar, coconut sugar, molasses, corn syrup, agave, maple syrup (for baking)
- EXTRACTS: vanilla extract, vanilla bean, almond extract, lemon extract, peppermint extract, coconut extract
- CHOCOLATE: chocolate chips, dark chocolate, milk chocolate, white chocolate, cocoa powder, unsweetened chocolate, bittersweet chocolate, cacao nibs
- OTHER: food coloring, sprinkles, decorating sugar, pie crust, puff pastry, phyllo dough, graham crackers, graham cracker crumbs

Nuts & Seeds: Nuts and seeds
- NUTS: almonds, walnuts, pecans, cashews, peanuts, pistachios, macadamia nuts, hazelnuts, pine nuts, brazil nuts, chestnuts, marcona almonds, sliced almonds, slivered almonds, chopped nuts
- SEEDS: sunflower seeds, pumpkin seeds, pepitas, chia seeds, flax seeds, hemp seeds, sesame seeds (bulk)
- NUT BUTTERS: peanut butter, almond butter, cashew butter, sunflower seed butter, tahini

Condiments: Sauces and spreads
- ASIAN: soy sauce, tamari, fish sauce, oyster sauce, hoisin sauce, teriyaki sauce, sriracha, chili garlic sauce, sambal oelek, gochujang, miso paste, mirin, sake, rice wine
- AMERICAN: ketchup, mustard, yellow mustard, dijon mustard, whole grain mustard, mayonnaise, relish, pickle relish, bbq sauce, worcestershire sauce, steak sauce, hot sauce, tabasco, buffalo sauce
- OTHER: honey, maple syrup, jam, jelly, preserves, marmalade, nutella, pesto, harissa, chimichurri, salsa, enchilada sauce, adobo sauce, curry paste, thai curry paste, hummus

Beverages: Drinks
- COFFEE/TEA: coffee, ground coffee, coffee beans, espresso, instant coffee, tea, black tea, green tea, herbal tea, chai, matcha
- JUICE: orange juice, apple juice, grape juice, cranberry juice, tomato juice, vegetable juice, lemon juice, lime juice, pomegranate juice, grapefruit juice
- ALCOHOL: wine, red wine, white wine, cooking wine, sherry, marsala wine, port, beer, ale, lager, sake, vodka, rum, bourbon, whiskey, brandy, liqueur, vermouth
- OTHER: soda, sparkling water, tonic water, club soda, coconut water, almond milk (shelf stable), oat milk (shelf stable), energy drinks

Frozen: Frozen foods
- FROZEN VEGETABLES: frozen peas, frozen corn, frozen spinach, frozen broccoli, frozen green beans, frozen mixed vegetables, frozen stir fry vegetables, frozen edamame, frozen lima beans, frozen okra, frozen hash browns
- FROZEN FRUITS: frozen berries, frozen strawberries, frozen blueberries, frozen raspberries, frozen mixed berries, frozen mango, frozen peaches, frozen pineapple, frozen banana, frozen açaí
- FROZEN PREPARED: frozen pizza, frozen dinners, frozen burritos, frozen waffles, frozen pancakes, frozen pie crust, frozen puff pastry, frozen phyllo
- ICE CREAM: ice cream, frozen yogurt, sorbet, gelato, ice pops, popsicles

Dry Goods: Dry pantry staples
- SUGARS/SWEETENERS: sugar (bulk), brown sugar (bulk), honey (bulk)
- CEREALS: cereal, oatmeal, granola, muesli, cream of wheat, grits
- SNACKS: crackers, chips, pretzels, popcorn, rice cakes, tortilla chips, pita chips
- DRIED FRUITS: raisins, dried cranberries, dried apricots, dried figs, dried dates, dried mango, dried cherries, prunes, dried coconut, shredded coconut
- LEGUMES (DRY): dried beans, dried lentils, dried chickpeas, dried split peas, dried black beans

Other: Only use if ingredient truly doesn't fit any category above`;

export async function categorizeIngredients(ingredients: IngredientInput[]): Promise<CategorizedIngredient[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const anthropic = new Anthropic({
    apiKey,
  });

  // First, apply rule-based categorization to all ingredients
  const uniqueIngredientNames = Array.from(new Set(ingredients.map(i => i.ingredient.toLowerCase().trim())));
  
  const categoryMap: Record<string, string> = {};
  const needsAI: string[] = [];
  
  for (const name of uniqueIngredientNames) {
    // 1. Try rule-based first (fastest)
    const ruleCategory = getRuleBasedCategory(name);
    if (ruleCategory) {
      categoryMap[name] = ruleCategory;
      console.log(`📦 Rule-based: "${name}" → ${ruleCategory}`);
      continue;
    }
    
    // 2. Spoonacular disabled for now - using AI instead
    // TODO: Re-enable Spoonacular when ready
    
    // 3. Need AI for this one
    needsAI.push(name);
  }
  
  // Only call AI for ingredients not covered by rules
  if (needsAI.length > 0) {
    console.log(`🤖 Calling AI for ${needsAI.length} ingredients: ${needsAI.join(', ')}`);
    
    const userPrompt = `Categorize these ingredient names. Return a JSON object mapping each ingredient to its category.

Ingredients:
${needsAI.join('\n')}

Return format (JSON object only, no explanation):
{
  "kale": "Produce",
  "milk": "Dairy",
  "chicken breast": "Meat"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    console.log("🛒 AI Categorization - Ingredients sent:", needsAI.join(', '));
    console.log("🛒 AI Categorization - Raw response:", responseText.substring(0, 1000));
    
    // Parse the category mapping from AI response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('AI response did not contain JSON object:', responseText.substring(0, 500));
      // Default all to Other if AI fails
      for (const name of needsAI) {
        categoryMap[name] = 'Other';
      }
    } else {
      try {
        const aiCategories = JSON.parse(jsonMatch[0]);
        console.log("🛒 AI Categorization - Parsed categories:", JSON.stringify(aiCategories));
        
        // Validate and merge AI categories
        for (const [ingredient, category] of Object.entries(aiCategories)) {
          const cat = category as string;
          if (VALID_CATEGORIES.includes(cat)) {
            categoryMap[ingredient] = cat;
          } else {
            console.log(`Invalid category "${cat}" for "${ingredient}", defaulting to Other`);
            categoryMap[ingredient] = 'Other';
          }
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response:', responseText);
        for (const name of needsAI) {
          categoryMap[name] = 'Other';
        }
      }
    }
  } else {
    console.log(`📦 All ${uniqueIngredientNames.length} ingredients categorized by rules, skipping AI`);
  }

  // Merge categories with original ingredients and group duplicates
  const mergedMap = new Map<string, CategorizedIngredient>();
  
  for (const ing of ingredients) {
    const key = `${ing.ingredient.toLowerCase().trim()}|${ing.unit?.toLowerCase() || ''}`;
    const category = categoryMap[ing.ingredient.toLowerCase().trim()] || 'Other';
    
    if (mergedMap.has(key)) {
      const existing = mergedMap.get(key)!;
      // Sum amounts if both are numeric
      if (existing.amount && ing.amount) {
        const existingNum = parseFloat(existing.amount);
        const newNum = parseFloat(ing.amount);
        if (!isNaN(existingNum) && !isNaN(newNum)) {
          existing.amount = (existingNum + newNum).toString();
        }
      }
      // Combine recipe names
      if (ing.recipeName && !existing.recipeNames.includes(ing.recipeName)) {
        existing.recipeNames.push(ing.recipeName);
      }
      // Prefer non-Other category
      if (existing.category === 'Other' && category !== 'Other') {
        existing.category = category;
      }
    } else {
      mergedMap.set(key, {
        ingredient: ing.ingredient,
        amount: ing.amount || null,
        unit: ing.unit || null,
        category,
        recipeNames: ing.recipeName ? [ing.recipeName] : [],
      });
    }
  }

  // Convert to array and sort by category order, then alphabetically
  const result = Array.from(mergedMap.values());
  
  result.sort((a, b) => {
    const catOrderA = getCategorySortOrder(a.category);
    const catOrderB = getCategorySortOrder(b.category);
    if (catOrderA !== catOrderB) return catOrderA - catOrderB;
    return a.ingredient.toLowerCase().localeCompare(b.ingredient.toLowerCase());
  });

  return result;
}

export function scaleAmount(amount: string | null, multiplier: number): string {
  if (!amount || multiplier === 1) return amount || '';

  let numeric: number;
  if (amount.includes('/')) {
    const parts = amount.split('/');
    if (parts.length === 2) {
      const [num, denom] = parts.map(Number);
      numeric = num / denom;
    } else {
      numeric = parseFloat(amount);
    }
  } else {
    numeric = parseFloat(amount);
  }

  if (isNaN(numeric)) return amount;

  const scaled = numeric * multiplier;

  if (scaled % 1 === 0) return scaled.toString();
  
  if (scaled < 1) {
    const fractions: [number, number][] = [[1, 4], [1, 3], [1, 2], [2, 3], [3, 4]];
    for (const [n, d] of fractions) {
      if (Math.abs(scaled - n / d) < 0.05) return `${n}/${d}`;
    }
  }
  
  return scaled.toFixed(2).replace(/\.?0+$/, '');
}

export function getCategorySortOrder(category: string): number {
  return CATEGORY_SORT_ORDER[category] || CATEGORY_SORT_ORDER['Other'];
}
