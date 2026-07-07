import { shopifyConfig } from '../config/shopify';

const CATEGORY_TO_PLAN_KEY = {
  LIFESTYLE: 'lifestyle',
  PERFORMANCE: 'performance',
  KETO: 'keto',
  'PLANT-BASED': 'plant',
};

// Serializes properties[_key] pairs the way Shopify's cart/add expects:
// brackets in keys stay literal, only values get percent-encoded. Building
// nested return_to URLs from the inside out and always encoding exactly
// once per nesting level (via this) reproduces the real capture's double-
// and triple-encoding without any special-casing.
function qs(pairs) {
  return pairs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
}

// Groups entrée cart selections by the plan each meal's category maps to.
// Matches the confirmed-live _metadata shape: one userSelections entry per
// plan actually present in the cart (a customer can mix plans), meals
// grouped under it with quantity + proteinAmount per doc section 5b.
export function buildEntreeSelections({ singles, doubles, entreeMeals }) {
  const byId = new Map(entreeMeals.map(m => [m.id, m]));
  const groups = new Map();
  let rank = 0;
  let singleProteinCount = 0;
  let doubleProteinCount = 0;

  function addEntries(source, isDouble) {
    Object.entries(source).forEach(([id, qty]) => {
      if (qty <= 0) return;
      const meal = byId.get(Number(id));
      if (!meal) return;
      const planKey = CATEGORY_TO_PLAN_KEY[meal.category] || 'lifestyle';
      const planCfg = shopifyConfig.plans[planKey];
      if (!groups.has(planKey)) {
        groups.set(planKey, { planName: planCfg.name, planImage: planCfg.image, meals: [] });
      }
      groups.get(planKey).meals.push({
        productTitle: meal.name,
        productImage: meal.image,
        proteinAmount: isDouble ? 'Double Protein' : 'Single Protein',
        quantity: qty,
        mealPlanImage: planCfg.image,
        mealPlanColor: null,
        mealRank: rank++,
      });
      if (isDouble) doubleProteinCount += qty;
      else singleProteinCount += qty;
    });
  }

  addEntries(singles, false);
  addEntries(doubles, true);

  return { userSelections: [...groups.values()], singleProteinCount, doubleProteinCount };
}

// defaultPlanKey should be the customer's top-level plan choice
// (lifestyle/performance/keto/plant); falls back to the first group
// present (chef's-choice/own-meals orders that ended up single-plan).
export function buildMetadataPayload({ setWeek, mealCount, defaultPlanKey, userSelections, singleProteinCount, doubleProteinCount }) {
  const planCfg = shopifyConfig.plans[defaultPlanKey] || shopifyConfig.plans.lifestyle;
  const defaultPlan = { name: planCfg.name, image: planCfg.image, color: planCfg.color };

  const metadata = {
    [setWeek]: {
      gsheetsProcessing: 'pending',
      skipped: false,
      doubleProteinCount,
      singleProteinCount,
      defaultPlan,
      mealsCount: String(mealCount),
      userSelections,
    },
  };

  return JSON.stringify(metadata);
}

// Breakfast items aren't tagged into the 4 entrée plan categories, so a
// real captured breakfast order grouped everything under one "Chef's
// Choice" userSelections entry regardless of the customer's entrée plan.
// proteinAmount is always "Default Title" -- breakfast has no protein
// variants, confirmed via the same capture.
export function buildBreakfastMetadata({ setWeek, breakfastCount, singles, doubles, breakfastMeals }) {
  const byId = new Map(breakfastMeals.map(m => [m.id, m]));
  const meals = [];
  let rank = 0;
  let totalQty = 0;

  function addEntries(source) {
    Object.entries(source).forEach(([id, qty]) => {
      if (qty <= 0) return;
      const meal = byId.get(Number(id));
      if (!meal) return;
      const chefCfg = shopifyConfig.plans.chefsChoice;
      meals.push({
        productTitle: meal.name,
        productImage: meal.image,
        proteinAmount: 'Default Title',
        quantity: qty,
        mealPlanImage: chefCfg.image,
        mealPlanColor: null,
        mealRank: rank++,
      });
      totalQty += qty;
    });
  }
  addEntries(singles);
  addEntries(doubles);

  const chefCfg = shopifyConfig.plans.chefsChoice;
  const defaultPlan = { name: chefCfg.name, image: chefCfg.image, color: chefCfg.color };
  const metadata = {
    [setWeek]: {
      gsheetsProcessing: 'pending',
      skipped: false,
      doubleProteinCount: 0,
      singleProteinCount: totalQty,
      defaultPlan,
      mealsCount: String(breakfastCount),
      userSelections: meals.length ? [{ planName: chefCfg.name, planImage: chefCfg.image, meals }] : [],
    },
  };
  return JSON.stringify(metadata);
}

// Picks the shared Snacks/Doughnuts product variant whose own price
// matches the snack's display price -- confirmed via a real capture that
// each individual snack rides on one of these two shared price-tier
// variants rather than having its own product. Falls back to the closest
// tier if a snack's price doesn't exactly match either configured tier.
//
// KNOWN GAP: the display product's own price (meal.basePrice) that this
// is supposed to match against is unreliable -- confirmed 2026-07-14 that
// it reads $0 for every snack in the currently active week, with no
// metafield holding a real price either, even though a different week
// checked earlier in this project showed real per-item prices. With
// price=0, this always falls back to the cheapest tier. The two real
// captured examples (Brownie, a Doughnuts item) both happened to be the
// cheapest tier in their product, so this hasn't been observed to pick
// wrong -- but it has never been tested against a snack that should
// resolve to the *expensive* tier. Get a real capture of one before
// trusting this for a snack priced at the higher tier.
export function pickSnackVariant(meal) {
  const product = meal.isDoughnuts ? shopifyConfig.doughnutsProduct : shopifyConfig.snacksProduct;
  const price = meal.basePrice;
  const exact = product.variants.find(v => Math.abs(v.price - price) < 0.005);
  const variant = exact || product.variants.reduce((closest, v) =>
    Math.abs(v.price - price) < Math.abs(closest.price - price) ? v : closest
  );
  return { product, variant };
}

// Builds one snack line's _metadata, matching the real captured shape
// (structurally different from entrées/breakfast -- no gsheetsProcessing,
// no userSelections; just the one selected item under `meals`).
function buildSnackMetadata({ setWeek, meal, variant, sellingPlanId, quantity }) {
  const metadata = {
    [setWeek]: {
      meals: {
        selectedVariantId: `gid://shopify/ProductVariant/${variant.id}`,
        selectedVariant: {
          title: String(variant.price),
          id: `gid://shopify/ProductVariant/${variant.id}`,
          price: { amount: String(variant.price), currencyCode: 'USD' },
          metafields: [null, null],
          sellingPlanAllocations: { nodes: [{ sellingPlan: { id: `gid://shopify/SellingPlan/${sellingPlanId}`, name: '1 week subscription' } }] },
          image: { url: meal.image },
        },
        sellingPlanId: `gid://shopify/SellingPlan/${sellingPlanId}`,
        price: String(variant.price),
        productImage: meal.image,
        productTitle: meal.name,
        isDoughnuts: !!meal.isDoughnuts,
        quantity,
      },
      skipped: false,
    },
  };
  return JSON.stringify(metadata);
}

function buildLineParams(variantId, sellingPlanId, quantity, properties) {
  const params = [['id', variantId], ['quantity', String(quantity)]];
  if (sellingPlanId) params.push(['selling_plan', sellingPlanId]);
  properties.forEach(([k, v]) => params.push([`properties[${k}]`, v]));
  return params;
}

function commonProps({ setWeek, allergiesValue, allergyNotesValue, isNew }) {
  return [
    ['_setWeek', setWeek],
    ['_Allergies', allergiesValue],
    ['_AllergiesNotes', allergyNotesValue],
    ['_isNew', String(isNew)],
  ];
}

// Builds the real checkout URL as a chain of /cart/add hops, each one's
// return_to pointing at the next, terminating in /discount/[code] (or
// straight to /checkout if no code) -- confirmed via two live captures:
//   - The offer page (2026-07-07): GET-navigation /cart/add chain,
//     entrées -> double-protein -> discount -> checkout.
//   - The real mealplan.com checkout (2026-07-14): a same-origin POST to
//     /cart.data adding all lines at once (entrées, breakfast, snacks).
//     Our mockup is a different origin and can't POST there (same CORS
//     wall the doc describes for /cart/add.js), so we replicate the same
//     line data through the GET-navigation-chain mechanism instead.
// The mealplan.com capture does NOT send `_defaultData` (unlike the offer
// page) -- following that as the more current/authoritative source.
export function buildCheckoutUrl({
  entree,        // { variantId, mealCount, metadataJson }
  doubleProtein, // { quantity } | null
  breakfast,     // { variantId, metadataJson } | null
  snackLines,    // [{ meal, quantity }] -- meal.basePrice/isDoughnuts pick the variant
  setWeek, allergiesValue, allergyNotesValue,
  discountCode,
  isNew = true,
}) {
  const shared = commonProps({ setWeek, allergiesValue, allergyNotesValue, isNew });
  const discountChain = discountCode
    ? `/discount/${encodeURIComponent(discountCode)}?redirect=/checkout`
    : '/checkout';

  const lines = [];

  lines.push(buildLineParams(entree.variantId, shopifyConfig.entreesSellingPlanId, 1, [
    ['_subscriptionType', 'entrees'],
    ['_metadata', entree.metadataJson],
    ...shared,
  ]));

  if (doubleProtein && doubleProtein.quantity > 0) {
    lines.push(buildLineParams(shopifyConfig.doubleProteinVariantId, shopifyConfig.doubleProteinSellingPlanId, doubleProtein.quantity, [
      ['_subscriptionType', 'double_protein'],
      ...shared,
    ]));
  }

  if (breakfast) {
    lines.push(buildLineParams(breakfast.variantId, shopifyConfig.breakfastSellingPlanId, 1, [
      ['_subscriptionType', 'breakfast'],
      ['_metadata', breakfast.metadataJson],
      ...shared,
    ]));
  }

  (snackLines || []).forEach(({ meal, quantity }) => {
    const { product, variant } = pickSnackVariant(meal);
    const metadataJson = buildSnackMetadata({ setWeek, meal, variant, sellingPlanId: product.sellingPlanId, quantity });
    lines.push(buildLineParams(variant.id, product.sellingPlanId, quantity, [
      ['_subscriptionType', meal.isDoughnuts ? 'doughnuts' : 'snacks'],
      ['_productTitle', meal.name],
      ['_metadata', metadataJson],
      ...shared,
    ]));
  });

  let chain = discountChain;
  for (let i = lines.length - 1; i >= 0; i--) {
    chain = `/cart/add?${qs([...lines[i], ['return_to', chain]])}`;
  }

  return `https://${shopifyConfig.storefrontApiHost}${chain}`;
}
