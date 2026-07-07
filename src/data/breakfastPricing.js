// Breakfast is confirmed to be flat-box-priced like entrées (every real
// breakfast product's own variant price is $0), but we don't have the real
// per-count box price table (shopifyConfig has no `breakfastVariants` --
// only `entreesVariants` was captured from the offer page). These tiers
// are still the mockup's placeholder numbers. Pull the real table the same
// way entreesVariants was found (inspect the offer page's rbConfig) before
// this pricing can be trusted.
export const BREAKFAST_PRICING = {
  1:  { perMeal: 9.99 },
  2:  { perMeal: 9.49 },
  3:  { perMeal: 9.49 },
  4:  { perMeal: 8.99 },
  5:  { perMeal: 8.99 },
  6:  { perMeal: 8.49 },
  7:  { perMeal: 8.49 },
  8:  { perMeal: 7.99 },
  9:  { perMeal: 7.99 },
  10: { perMeal: 7.49 },
};
