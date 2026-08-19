import { shopifyConfig } from '../config/shopify';

// Matches the exact query captured from the live offer page (collection by
// handle, with metafields for nutrition/ingredients/allergens), except
// featuredImage requests a CDN-resized WebP instead of the merchant's
// full-res upload -- cards/modals only ever display these at up to ~700px,
// so there's no reason to ship multi-MB originals over the wire.
// Handle is always a value we generate ourselves (`week-N`), never user input.
//
// The three `week.*` metafields are staff-authored per collection (Admin ->
// Settings -> Custom data -> Collections) and are the real source of truth
// for what's live, layered on top of (not replacing) the date-computed
// lookahead in shopifyWeeks.js -- see fetchWeekCollection below.
function buildWeekQuery(handle) {
  return `{ collection(handle: "${handle}") { title isWeekly: metafield(namespace: "week", key: "is_weekly"){value} deliveryWeek: metafield(namespace: "week", key: "delivery_week"){value} weekTitle: metafield(namespace: "week", key: "week_title"){value} products(first: 100) { edges { node { id handle title description tags availableForSale featuredImage { url(transform: {maxWidth: 900, preferredContentType: WEBP}) } variants(first: 5) { edges { node { id title price { amount } availableForSale } } } calories: metafield(namespace: "product", key: "calories"){value} protein: metafield(namespace: "product", key: "protein"){value} fat: metafield(namespace: "product", key: "fat"){value} satFat: metafield(namespace: "product", key: "saturated_fat"){value} carbohydrate: metafield(namespace: "product", key: "carbohydrate"){value} sugar: metafield(namespace: "product", key: "sugar"){value} dietaryFiber: metafield(namespace: "product", key: "dietary_fiber"){value} cholesterol: metafield(namespace: "product", key: "cholesterol"){value} sodium: metafield(namespace: "product", key: "sodium"){value} ingredientsList: metafield(namespace: "product", key: "gradient_list"){value} allergensList: metafield(namespace: "product", key: "allergens"){value} fullNutrition: metafield(namespace: "custom", key: "full_nutritional_information"){value} mealRank: metafield(namespace: "product", key: "meal_rank"){value} } } } } }`;
}

// Returns the collection's products plus its staff-authored week metadata.
// `isWeekly`/`deliveryWeek`/`weekTitle` are null whenever staff haven't set
// them for this collection (e.g. a week that's archived or not yet queued
// up) -- callers should treat null as "no override", not as "off".
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
  if (!collection) return { products: [], isWeekly: null, deliveryWeek: null, weekTitle: null };
  return {
    products: collection.products.edges.map(e => e.node),
    isWeekly: collection.isWeekly ? collection.isWeekly.value : null,
    deliveryWeek: collection.deliveryWeek ? collection.deliveryWeek.value : null,
    weekTitle: collection.weekTitle ? collection.weekTitle.value : null,
  };
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

// Pulls the double-protein half of a "single | double" compound metafield
// value (see the comment above parseNumeric). Returns null when the
// product has no double-protein value at all -- e.g. Plant-Based items,
// which only ever carry the single-protein number -- so callers can fall
// back to an estimate rather than silently treating "no data" as 0.
function doubleFromMetafield(mf) {
  if (!mf || mf.value == null || mf.value === '') return null;
  const raw = String(mf.value);
  if (!raw.includes('|')) return null;
  const secondHalf = raw.split('|')[1];
  const match = secondHalf.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
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

// ingredientsList is also a JSON array string, e.g.
// '["Brown Rice & Bell Pepper Pilaf","Roasted Butternut Squash",...]' --
// rendering the raw value showed literal ["...","..."] JSON in the UI.
// Falls back to the raw string if it's ever plain text instead of JSON.
function parseIngredientsList(mf) {
  if (!mf || !mf.value) return '';
  try {
    const arr = JSON.parse(mf.value);
    return Array.isArray(arr) ? arr.join(', ') : mf.value;
  } catch {
    return mf.value;
  }
}

// gid://shopify/Product/1234567890 -> 1234567890 (numeric id our UI keys on)
function numericIdFromGid(gid) {
  const match = /(\d+)$/.exec(gid || '');
  return match ? Number(match[1]) : gid;
}

export function transformProduct(node) {
  const tags = node.tags || [];

  const typeTag = tags.find(t => PRODUCT_TYPE_TAGS[t.toLowerCase()]);
  const productType = typeTag ? PRODUCT_TYPE_TAGS[typeTag.toLowerCase()] : 'entrees';

  // Breakfast/snack products never carry a diet-plan tag (Lifestyle,
  // Performance, etc.) -- they aren't part of that plan system, so falling
  // back to 'LIFESTYLE' mislabeled them. Use productType-derived categories
  // for those instead.
  const categoryTag = tags.find(t => CATEGORY_BY_TAG[t.toLowerCase()]);
  let category;
  if (categoryTag) {
    category = CATEGORY_BY_TAG[categoryTag.toLowerCase()];
  } else if (productType === 'breakfast') {
    category = 'BREAKFAST';
  } else if (productType === 'snacks') {
    category = 'SWEET_TREAT';
  } else {
    category = 'LIFESTYLE';
  }

  const variantsList = node.variants ? node.variants.edges.map(e => e.node) : [];
  const variantTitles = variantsList.map(v => v.title.toLowerCase());
  const doubleProtein = variantTitles.includes('double protein');

  // Product-level availableForSale (below, on `meal.available`) is true if
  // ANY variant is available -- so a product with "Single Protein" sold out
  // but "Double Protein" still in stock (or vice versa) reads as fully
  // available at that level, silently hiding the sold-out half. Track each
  // variant's own availableForSale so just that option's Add control can
  // show "Sold out" instead. Falls back to the product-level value for
  // products with no separately-titled "Single Protein" variant (e.g.
  // Plant-Based/breakfast/snacks, which only ever have one variant).
  const singleVariant = variantsList.find(v => v.title.toLowerCase() === 'single protein') || variantsList[0] || null;
  const doubleVariant = variantsList.find(v => v.title.toLowerCase() === 'double protein') || null;
  const singleAvailable = singleVariant ? singleVariant.availableForSale : node.availableForSale;
  const doubleAvailable = doubleVariant ? doubleVariant.availableForSale : null;

  // Snacks tagged "Doughnuts" are added to cart via a separate Shopify
  // product (shopifyConfig.doughnutsProduct) from regular snacks
  // (shopifyConfig.snacksProduct) -- confirmed via a real captured order.
  const isDoughnuts = tags.some(t => t.toLowerCase() === 'doughnuts');

  // Breakfast items tagged "Keto Only" are the pool Keto-plan customers'
  // default breakfast selection draws from (see defaultSelections.js).
  const isKetoOnly = tags.some(t => t.toLowerCase() === 'keto only');

  // allergensList holds free-text warnings ("Contains Dairy & Egg") and
  // claims ("Vegan", "Spicy"), not a clean allergen-free taxonomy. We show
  // these as-is rather than inferring "X Free" claims from an *absence* of
  // a mention -- on a food-allergy-relevant field, inferring "safe" from
  // "not mentioned" is a real risk if a product was ever mis-tagged.
  // FLAG FOR REVIEW: spot-check this against the kitchen's real allergen
  // data before relying on it for actual allergy-sensitive customers.
  const allergenNotes = parseAllergenNotes(node.allergensList);
  const dietary = allergenNotes.filter(n => n.toLowerCase() !== 'spicy');

  // The authoritative "Meal 1..Meal 5" (or "Breakfast 1..4") slot for
  // ReBuilt's default-fill algorithm (see defaultSelections.js) --
  // confirmed 2026-07-16 against a real customer's stated correct order.
  // The Storefront API's own product order (even with sortKey:
  // COLLECTION_DEFAULT) is just alphabetical and has nothing to do with
  // this ranking. Snacks don't carry this metafield (null) since they
  // aren't part of the ranked-slot system.
  const mealRank = node.mealRank && node.mealRank.value !== '' ? Number(node.mealRank.value) : null;

  const meal = {
    id: numericIdFromGid(node.id),
    shopifyProductId: node.id,
    handle: node.handle,
    name: node.title,
    category,
    productType,
    mealRank,
    description: node.description,
    image: node.featuredImage ? node.featuredImage.url : null,
    // Shopify's own computed availability -- already factors in whether
    // inventory tracking is on, the oversell policy, and current stock, so
    // this is how a meal staff marked sold out (tracking on + qty 0) shows
    // up here without us reading raw inventory numbers.
    available: node.availableForSale,
    singleAvailable,
    doubleAvailable,
    protein: numFromMetafield(node.protein),
    calories: numFromMetafield(node.calories),
    carbs: numFromMetafield(node.carbohydrate),
    dietary,
    badge: null,
    doubleProtein,
    doubleProteinPrice: shopifyConfig.doubleProteinPerMeal,
    // Real double-protein macros from Shopify's "single | double" metafield
    // values, not an estimate -- null when the product doesn't carry one
    // (e.g. no "Double Protein" variant), so the UI can fall back cleanly.
    doubleProteinProtein: doubleProtein ? doubleFromMetafield(node.protein) : null,
    doubleProteinCalories: doubleProtein ? doubleFromMetafield(node.calories) : null,
    doubleProteinCarbs: doubleProtein ? doubleFromMetafield(node.carbohydrate) : null,
    isDoughnuts,
    isKetoOnly,
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
    ingredients: parseIngredientsList(node.ingredientsList),
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
  // Sort by the real meal_rank (nulls -- e.g. snacks -- last). Ranks are
  // scoped per category/type (Performance 1-5, Lifestyle 1-5, ...), but
  // since a global ascending sort preserves relative order within any
  // later `.filter(category === X)`, this one sort correctly orders every
  // category- or type-filtered view downstream, including both display
  // grids and the default-fill algorithm's slot assignment.
  meals.sort((a, b) => (a.mealRank ?? Infinity) - (b.mealRank ?? Infinity));
  return { meals, details };
}
