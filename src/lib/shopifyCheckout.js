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

  return { metadataJson: JSON.stringify(metadata), defaultDataJson: JSON.stringify(defaultPlan) };
}

// Builds the real checkout URL chain, confirmed via a live network capture
// of the production offer page (2026-07-07):
//   /cart/add (entrée box line, selling_plan + full _metadata/_defaultData)
//     -> return_to another /cart/add (double-protein line, only if any
//        double-protein meals were selected)
//     -> return_to /discount/[code]?redirect=/checkout
// The doc (section 5a) says not to send `_defaultData` -- the real capture
// sends it, duplicating _metadata's defaultPlan at the top level. Following
// the live capture here since it's a confirmed-working production order.
export function buildCheckoutUrl({
  entreeVariantId, setWeek,
  metadataJson, defaultDataJson,
  doubleProteinCount,
  allergiesValue, allergyNotesValue,
  isNew = true,
}) {
  const discountChain = `/discount/${encodeURIComponent(shopifyConfig.discountCode)}?redirect=/checkout`;

  let entreeReturnTo = discountChain;
  if (doubleProteinCount > 0) {
    const doubleProteinParams = [
      ['id', shopifyConfig.doubleProteinVariantId],
      ['quantity', String(doubleProteinCount)],
      ['selling_plan', shopifyConfig.doubleProteinSellingPlanId],
      ['properties[_subscriptionType]', 'double_protein'],
      ['properties[_isNew]', String(isNew)],
      ['properties[_Allergies]', allergiesValue],
      ['properties[_AllergiesNotes]', allergyNotesValue],
      ['return_to', discountChain],
    ];
    entreeReturnTo = `/cart/add?${qs(doubleProteinParams)}`;
  }

  const entreeParams = [
    ['id', entreeVariantId],
    ['quantity', '1'],
    ['selling_plan', shopifyConfig.entreesSellingPlanId],
    ['properties[_subscriptionType]', 'entrees'],
    ['properties[_setWeek]', setWeek],
    ['properties[_metadata]', metadataJson],
    ['properties[_defaultData]', defaultDataJson],
    ['properties[_isNew]', String(isNew)],
    ['properties[_Allergies]', allergiesValue],
    ['properties[_AllergiesNotes]', allergyNotesValue],
    ['return_to', entreeReturnTo],
  ];

  return `https://${shopifyConfig.storefrontApiHost}/cart/add?${qs(entreeParams)}`;
}
