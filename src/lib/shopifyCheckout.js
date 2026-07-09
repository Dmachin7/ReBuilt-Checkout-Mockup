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
  let fallbackRank = 0;
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
      // mealPlanImage/mealPlanColor/productImage are dropped here even
      // though the confirmed capture includes them per-meal -- see the URL
      // length note on buildCheckoutUrl. mealPlanImage/Color are pure
      // duplicates of this group's own planImage/(null); productImage is a
      // full CDN URL repeated per meal that measurably contributed to real
      // HTTP 414 failures (confirmed 2026-07-15). A broken checkout is
      // worse than a kitchen ops sheet missing thumbnails -- if those
      // images turn out to be load-bearing for the gsheets pipeline, this
      // needs a non-GET-chain transport instead, not more trimming.
      //
      // mealRank MUST be the meal's real Shopify meal_rank (1-5 within its
      // category), not a sequential counter -- confirmed 2026-07-16 via a
      // real ops-sheet row that scrambled Meal 1-5 columns when this was
      // just an incrementing index (0-9 across singles then doubles). The
      // sheet-population script evidently uses this value to place each
      // entry in the right Meal-N column, independently per protein-type
      // row. Falls back to a continuing counter only if a product is ever
      // missing the metafield, so nothing is silently dropped.
      groups.get(planKey).meals.push({
        productTitle: meal.name,
        proteinAmount: isDouble ? 'Double Protein' : 'Single Protein',
        quantity: qty,
        mealRank: meal.mealRank != null ? meal.mealRank : fallbackRank++,
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
//
// isKetoPlan reflects ReBuilt's confirmed default-fill spreadsheet, which
// has a distinct "Keto Only" breakfast default (drawing only from
// Keto-tagged items) separate from the general "Chef's Choice" default --
// see defaultBreakfastSelection in defaultSelections.js. There's no real
// captured *order* confirming what defaultPlan.name should read for a
// Keto customer specifically, so this reuses the confirmed real
// shopifyConfig.plans.keto branding rather than inventing an unconfirmed
// "Keto Only" plan entry. Worth a real capture to verify if possible.
export function buildBreakfastMetadata({ setWeek, breakfastCount, singles, doubles, breakfastMeals, isKetoPlan }) {
  const byId = new Map(breakfastMeals.map(m => [m.id, m]));
  const meals = [];
  let fallbackRank = 0;
  let totalQty = 0;

  function addEntries(source) {
    Object.entries(source).forEach(([id, qty]) => {
      if (qty <= 0) return;
      const meal = byId.get(Number(id));
      if (!meal) return;
      // mealPlanImage/mealPlanColor/productImage dropped per-meal -- same
      // rationale as buildEntreeSelections above. mealRank uses the real
      // Shopify meal_rank (1-4 within breakfast) -- same fix and rationale
      // as buildEntreeSelections.
      meals.push({
        productTitle: meal.name,
        proteinAmount: 'Default Title',
        quantity: qty,
        mealRank: meal.mealRank != null ? meal.mealRank : fallbackRank++,
      });
      totalQty += qty;
    });
  }
  addEntries(singles);
  addEntries(doubles);

  const planCfg = isKetoPlan ? shopifyConfig.plans.keto : shopifyConfig.plans.chefsChoice;
  const defaultPlan = { name: planCfg.name, image: planCfg.image, color: planCfg.color };
  const metadata = {
    [setWeek]: {
      gsheetsProcessing: 'pending',
      skipped: false,
      doubleProteinCount: 0,
      singleProteinCount: totalQty,
      defaultPlan,
      mealsCount: String(breakfastCount),
      userSelections: meals.length ? [{ planName: planCfg.name, planImage: planCfg.image, meals }] : [],
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

// Builds one snack-tier line's _metadata. The real captured shape (for a
// single snack) also nests a full duplicate Shopify variant object
// (id/price/metafields/sellingPlanAllocations/image, all already present
// or derivable from fields kept here and from the cart line's own
// id/selling_plan params) -- dropped deliberately, see note below.
//
// KNOWN GAP: the display product's own price (meal.basePrice) that
// pickSnackVariant matches against is unreliable -- confirmed 2026-07-14
// that it reads $0 for every snack in the currently active week, with no
// metafield holding a real price either. With price=0, resolution always
// falls back to the cheapest tier. The two real captured examples
// (Brownie, a Doughnuts item) both happened to be the cheapest tier in
// their product, so this hasn't been observed to pick wrong -- but it has
// never been tested against a snack that should resolve to the *expensive*
// tier. Get a real capture of one before trusting this fully.
//
// `items` holds every distinct snack sharing this tier variant (see the
// grouping in buildCheckoutUrl) -- for the single-item case this matches
// the confirmed capture shape exactly (`meals` as one object); for
// multiple items sharing a tier, `meals` becomes an array instead, which
// is an extrapolation beyond anything captured, done because the
// alternative (one hop per distinct snack name) caused real HTTP 414
// URI-Too-Long failures once a real order had breakfast + 2 snacks
// (confirmed 2026-07-15) -- every hop in the GET-navigation chain gets
// percent-re-encoded once per level of nesting it sits inside (see
// buildCheckoutUrl), so hop *count* matters as much as hop size. The real
// mealplan.com site never hits this because it POSTs a JSON body instead
// of chaining GET redirects.
function buildSnackTierMetadata({ setWeek, variant, sellingPlanId, items }) {
  let meals;
  if (items.length === 1) {
    const item = items[0];
    meals = {
      selectedVariantId: `gid://shopify/ProductVariant/${variant.id}`,
      sellingPlanId: `gid://shopify/SellingPlan/${sellingPlanId}`,
      price: String(variant.price),
      productTitle: item.meal.name,
      isDoughnuts: !!item.meal.isDoughnuts,
      quantity: item.quantity,
    };
  } else {
    // Multiple distinct snacks sharing a price tier -- kept minimal to
    // bound URL size regardless of how many are grouped here.
    meals = items.map(item => ({
      productTitle: item.meal.name,
      isDoughnuts: !!item.meal.isDoughnuts,
      quantity: item.quantity,
    }));
  }
  const metadata = { [setWeek]: { meals, skipped: false } };
  return JSON.stringify(metadata);
}

// Live discount-code preview: builds a real (anonymous) Shopify Storefront
// Cart with the same box-rate variants/selling plans the real checkout will
// use, applies the typed code via cartDiscountCodesUpdate, and reads back
// the actual saving Shopify computes -- confirmed working against this
// store's selling-plan products 2026-07-08 (cartCreate returned the correct
// live $126.92 10-meal price; cartDiscountCodesUpdate correctly reported
// applicable:false for a bogus code with cost unchanged). This intentionally
// doesn't include tax/shipping (Storefront carts don't compute those without
// a checkout session) -- callers should treat the result as a merchandise-
// level discount to apply against their own subtotal before tax, not a
// final total.
async function shopifyGraphQL(query, variables) {
  const res = await fetch(
    `https://${shopifyConfig.storefrontApiHost}/api/${shopifyConfig.storefrontApiVersion}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyConfig.storefrontToken,
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join('; '));
  return json.data;
}

const CART_CREATE_MUTATION = `mutation CartCreate($lines: [CartLineInput!]!) {
  cartCreate(input: { lines: $lines }) {
    cart { id cost { totalAmount { amount } } }
    userErrors { field message }
  }
}`;

const CART_DISCOUNT_MUTATION = `mutation CartDiscountUpdate($cartId: ID!, $codes: [String!]!) {
  cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $codes) {
    cart { id cost { totalAmount { amount } } discountCodes { code applicable } }
    userErrors { field message }
  }
}`;

// Mirrors buildCheckoutUrl's line composition (box-rate entrées/breakfast
// variants + qty, double-protein line, snack lines grouped by resolved
// price-tier variant) but in Storefront Cart line-input shape instead of
// /cart/add query params.
function buildPreviewCartLines({ mealCount, doubleProteinQty, breakfastCount, snackLines }) {
  const lines = [];

  const entreeVariant = mealCount && shopifyConfig.entreesVariants[mealCount];
  if (entreeVariant) {
    lines.push({
      merchandiseId: `gid://shopify/ProductVariant/${entreeVariant.id}`,
      quantity: 1,
      sellingPlanId: `gid://shopify/SellingPlan/${shopifyConfig.entreesSellingPlanId}`,
    });
  }

  if (doubleProteinQty > 0) {
    lines.push({
      merchandiseId: `gid://shopify/ProductVariant/${shopifyConfig.doubleProteinVariantId}`,
      quantity: doubleProteinQty,
      sellingPlanId: `gid://shopify/SellingPlan/${shopifyConfig.doubleProteinSellingPlanId}`,
    });
  }

  const breakfastVariant = breakfastCount && shopifyConfig.breakfastVariants[breakfastCount];
  if (breakfastVariant) {
    lines.push({
      merchandiseId: `gid://shopify/ProductVariant/${breakfastVariant.id}`,
      quantity: 1,
      sellingPlanId: `gid://shopify/SellingPlan/${shopifyConfig.breakfastSellingPlanId}`,
    });
  }

  const snackGroups = new Map();
  (snackLines || []).forEach(({ meal, quantity }) => {
    const { product, variant } = pickSnackVariant(meal);
    if (!snackGroups.has(variant.id)) snackGroups.set(variant.id, { product, variant, quantity: 0 });
    snackGroups.get(variant.id).quantity += quantity;
  });
  snackGroups.forEach(group => {
    lines.push({
      merchandiseId: `gid://shopify/ProductVariant/${group.variant.id}`,
      quantity: group.quantity,
      sellingPlanId: `gid://shopify/SellingPlan/${group.product.sellingPlanId}`,
    });
  });

  return lines;
}

// Returns null if there's nothing to price yet (no code typed, or an empty
// cart). Throws on a genuine API/network failure so the caller can show an
// error rather than silently reporting "not applicable".
export async function previewDiscountCode({ mealCount, doubleProteinQty = 0, breakfastCount, snackLines, discountCode }) {
  const trimmedCode = (discountCode || '').trim();
  if (!trimmedCode) return null;

  const lines = buildPreviewCartLines({ mealCount, doubleProteinQty, breakfastCount, snackLines });
  if (lines.length === 0) return null;

  const createData = await shopifyGraphQL(CART_CREATE_MUTATION, { lines });
  const createResult = createData.cartCreate;
  if (!createResult.cart || createResult.userErrors.length > 0) {
    throw new Error(createResult.userErrors.map(e => e.message).join('; ') || 'Could not price this order');
  }
  const baseTotal = Number(createResult.cart.cost.totalAmount.amount);

  const discountData = await shopifyGraphQL(CART_DISCOUNT_MUTATION, {
    cartId: createResult.cart.id,
    codes: [trimmedCode],
  });
  const discountResult = discountData.cartDiscountCodesUpdate;
  if (!discountResult.cart || discountResult.userErrors.length > 0) {
    throw new Error(discountResult.userErrors.map(e => e.message).join('; ') || 'Could not check this code');
  }

  const codeInfo = discountResult.cart.discountCodes.find(
    d => d.code.toLowerCase() === trimmedCode.toLowerCase()
  );
  const applicable = !!(codeInfo && codeInfo.applicable);
  const discountedTotal = Number(discountResult.cart.cost.totalAmount.amount);
  const savings = applicable ? Math.max(0, baseTotal - discountedTotal) : 0;

  return { applicable, savings };
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

  // Group snacks by their resolved tier variant so hop count stays capped
  // at 4 (2 tiers x 2 products) no matter how many distinct snacks a
  // customer picks -- see buildSnackTierMetadata for why this matters.
  const snackGroups = new Map();
  (snackLines || []).forEach(({ meal, quantity }) => {
    const { product, variant } = pickSnackVariant(meal);
    if (!snackGroups.has(variant.id)) {
      snackGroups.set(variant.id, { product, variant, quantity: 0, items: [] });
    }
    const group = snackGroups.get(variant.id);
    group.quantity += quantity;
    group.items.push({ meal, quantity });
  });

  snackGroups.forEach(group => {
    const metadataJson = buildSnackTierMetadata({ setWeek, variant: group.variant, sellingPlanId: group.product.sellingPlanId, items: group.items });
    const isDoughnuts = group.items[0].meal.isDoughnuts;
    const titleSummary = group.items.length === 1
      ? group.items[0].meal.name
      : `${group.items.length} ${isDoughnuts ? 'doughnuts' : 'snacks'} items`;
    lines.push(buildLineParams(group.variant.id, group.product.sellingPlanId, group.quantity, [
      ['_subscriptionType', isDoughnuts ? 'doughnuts' : 'snacks'],
      ['_productTitle', titleSummary],
      ['_metadata', metadataJson],
      ...shared,
    ]));
  });

  let chain = discountChain;
  for (let i = lines.length - 1; i >= 0; i--) {
    chain = `/cart/add?${qs([...lines[i], ['return_to', chain]])}`;
  }

  // Clear any stale cart left over from a previous checkout attempt (e.g.
  // the customer reached Shopify, hit browser back, and re-ran checkout)
  // before adding this order's lines -- Shopify's cart is additive, not
  // replace-on-add, so a repeat attempt without this doubles every line
  // item (confirmed against the real store 2026-07-09: two /cart/add
  // navigations for the same variant left item quantity at 2, not 1).
  // /cart/clear supports the same return_to redirect-chain convention as
  // /cart/add (confirmed working end-to-end against the real store the
  // same day), so this just becomes one more outer hop.
  chain = `/cart/clear?${qs([['return_to', chain]])}`;

  const url = `https://${shopifyConfig.storefrontApiHost}${chain}`;

  // Shopify's edge returns a hard HTTP 414 somewhere between 10,100 and
  // 10,200 total characters (binary-searched empirically against the real
  // store 2026-07-15, well below any browser's own URL limit). Warn well
  // before that cliff so a large real order doesn't fail silently the way
  // this did in production testing -- there's no way to recover from a 414
  // client-side once it's already been navigated to.
  if (url.length > 8000) {
    console.warn(`buildCheckoutUrl: URL is ${url.length} chars, approaching Shopify's ~10,200 char hard limit (confirmed via real testing). Large orders (many entrées + breakfast + several distinct snacks) risk a silent HTTP 414 at checkout.`);
  }

  return url;
}
