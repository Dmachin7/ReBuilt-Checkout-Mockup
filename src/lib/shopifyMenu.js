import { shopifyConfig } from '../config/shopify';

// Matches the exact query captured from the live offer page (collection by
// handle, with metafields for nutrition/ingredients/allergens). Handle is
// always a value we generate ourselves (`week-N`), never user input.
function buildWeekQuery(handle) {
  return `{ collection(handle: "${handle}") { title products(first: 100) { edges { node { id handle title description tags featuredImage { url } variants(first: 5) { edges { node { id title price { amount } } } } calories: metafield(namespace: "product", key: "calories"){value} protein: metafield(namespace: "product", key: "protein"){value} fat: metafield(namespace: "product", key: "fat"){value} satFat: metafield(namespace: "product", key: "saturated_fat"){value} carbohydrate: metafield(namespace: "product", key: "carbohydrate"){value} sugar: metafield(namespace: "product", key: "sugar"){value} dietaryFiber: metafield(namespace: "product", key: "dietary_fiber"){value} cholesterol: metafield(namespace: "product", key: "cholesterol"){value} sodium: metafield(namespace: "product", key: "sodium"){value} ingredientsList: metafield(namespace: "product", key: "gradient_list"){value} allergensList: metafield(namespace: "product", key: "allergens"){value} fullNutrition: metafield(namespace: "custom", key: "full_nutritional_information"){value} } } } } }`;
}

export async function fetchWeekCollection(handle) {
  const res = await fetch(
    `https://${shopifyConfig.storefrontApiHost}/api/${shopifyConfig.storefrontApiVersion}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyConfig.storefrontToken,
      },
      body: JSON.stringify({ query: buildWeekQuery(handle) }),
    }
  );
  if (!res.ok) throw new Error(`Shopify Storefront API error ${res.status} for ${handle}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join('; '));
  const collection = json.data && json.data.collection;
  return collection ? collection.products.edges.map(e => e.node) : [];
}

// Confirmed against a live query of the week-8 collection (2026-07-07):
// - Category comes from a plan-name tag alongside "entrees"/"snacks"/
//   "breakfast-1" (the product-type tag) and a "week N" tag.
// - Double-protein eligibility is NOT tied to category -- it's whether the
//   product has a "Double Protein" variant (Plant-Based items only ever
//   have a single "Default Title" variant, which is why the old
//   category-based guess happened to match in this sample).
// - No badge tags ("Best Seller" etc.) exist on real products -- those were
//   mockup-only decoration, so badge is always null for live data.
// - Nutrition metafields are strings with units ("13g", "590mg") and, for
//   double-protein items, a "single | double" compound value
//   ("467 | 693"). Carb values can also carry a "Net carbs: " prefix on
//   Keto items. See parseNumeric below.
const CATEGORY_BY_TAG = {
  lifestyle: 'LIFESTYLE',
  performance: 'PERFORMANCE',
  'keto / low carb': 'KETO',
  keto: 'KETO',
  'plant-based': 'PLANT-BASED',
};

const PRODUCT_TYPE_TAGS = { entrees: 'entrees', snacks: 'snacks', 'breakfast-1': 'breakfast' };

// Pulls the first number out of a metafield value, taking only the
// single-protein half of a "single | double" compound value and ignoring
// any unit suffix or text prefix (e.g. "Net carbs: 9g | 9g" -> 9).
function parseNumeric(raw, fallback = 0) {
  if (raw == null) return fallback;
  const firstHalf = String(raw).split('|')[0];
  const match = firstHalf.match(/-?\d+(\.\d+)?/);
  if (!match) return fallback;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : fallback;
}

function numFromMetafield(mf, fallback = 0) {
  return mf && mf.value != null && mf.value !== '' ? parseNumeric(mf.value, fallback) : fallback;
}

// allergensList is a JSON array string of free-text notes, e.g.
// '["Contains Dairy & Egg","Spicy"]' or '["Vegan"]' or null.
function parseAllergenNotes(mf) {
  if (!mf || !mf.value) return [];
  try {
    const arr = JSON.parse(mf.value);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// gid://shopify/Product/1234567890 -> 1234567890 (numeric id our UI keys on)
function numericIdFromGid(gid) {
  const match = /(\d+)$/.exec(gid || '');
  return match ? Number(match[1]) : gid;
}

export function transformProduct(node) {
  const tags = node.tags || [];

  const categoryTag = tags.find(t => CATEGORY_BY_TAG[t.toLowerCase()]);
  const category = categoryTag ? CATEGORY_BY_TAG[categoryTag.toLowerCase()] : 'LIFESTYLE';

  const typeTag = tags.find(t => PRODUCT_TYPE_TAGS[t.toLowerCase()]);
  const productType = typeTag ? PRODUCT_TYPE_TAGS[typeTag.toLowerCase()] : 'entrees';

  const variantTitles = (node.variants ? node.variants.edges : []).map(e => e.node.title.toLowerCase());
  const doubleProtein = variantTitles.includes('double protein');

  // Snacks tagged "Doughnuts" are added to cart via a separate Shopify
  // product (shopifyConfig.doughnutsProduct) from regular snacks
  // (shopifyConfig.snacksProduct) -- confirmed via a real captured order.
  const isDoughnuts = tags.some(t => t.toLowerCase() === 'doughnuts');

  // allergensList holds free-text warnings ("Contains Dairy & Egg") and
  // claims ("Vegan", "Spicy"), not a clean allergen-free taxonomy. We show
  // these as-is rather than inferring "X Free" claims from an *absence* of
  // a mention -- on a food-allergy-relevant field, inferring "safe" from
  // "not mentioned" is a real risk if a product was ever mis-tagged.
  // FLAG FOR REVIEW: spot-check this against the kitchen's real allergen
  // data before relying on it for actual allergy-sensitive customers.
  const allergenNotes = parseAllergenNotes(node.allergensList);
  const dietary = allergenNotes.filter(n => n.toLowerCase() !== 'spicy');

  const meal = {
    id: numericIdFromGid(node.id),
    shopifyProductId: node.id,
    handle: node.handle,
    name: node.title,
    category,
    productType,
    description: node.description,
    image: node.featuredImage ? node.featuredImage.url : null,
    protein: numFromMetafield(node.protein),
    calories: numFromMetafield(node.calories),
    carbs: numFromMetafield(node.carbohydrate),
    dietary,
    badge: null,
    doubleProtein,
    doubleProteinPrice: shopifyConfig.doubleProteinPerMeal,
    isDoughnuts,
    // Real per-unit price from Shopify. Snacks are priced per-item and
    // this is their real cart price. Entrées/breakfast display variants
    // are always $0 -- their real price is the flat box rate in
    // shopifyConfig.entreesVariants/breakfastVariants, applied at checkout.
    basePrice: node.variants && node.variants.edges[0]
      ? Number(node.variants.edges[0].node.price.amount)
      : 0,
  };

  const details = {
    mainIngredients: '',
    ingredients: node.ingredientsList ? node.ingredientsList.value : '',
    allergenNotes,
    fat: numFromMetafield(node.fat),
    fiber: numFromMetafield(node.dietaryFiber),
    sodium: numFromMetafield(node.sodium),
    sugar: numFromMetafield(node.sugar),
  };

  return { meal, details };
}

export function transformCollection(nodes) {
  const meals = [];
  const details = {};
  nodes.forEach(node => {
    const { meal, details: d } = transformProduct(node);
    meals.push(meal);
    details[meal.id] = d;
  });
  return { meals, details };
}
