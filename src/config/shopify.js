// Real ReBuilt Meals Shopify + Recharge config, pulled from the live offer
// page's front-end JS (Storefront tokens are public/client-side by design).
// Source: network capture on 2026-07-07. See Subscription_Checkout_Replication_Handoff.md.

export const shopifyConfig = {
  shopDomain: 'https://rebuilt-meals-llc.myshopify.com',
  storefrontApiHost: 'rebuilt-meals-llc.myshopify.com',
  storefrontApiVersion: '2026-04',
  storefrontToken: 'e68f9724fb1f28fcc308f84d9d9cdf56',

  // Active menu collection rotates automatically based on delivery week.
  // Anchor: week-3 corresponds to delivery week of 2026-07-13 (Monday).
  // Collection handle increments by 1 for each Monday after the anchor,
  // wrapping 13 -> 1 (see collectionNumberForOffset in shopifyWeeks.js).
  //
  // Corrected 2026-07-14 per direct confirmation against ReBuilt's actual
  // cooking/plating schedule -- the value captured from the offer page's
  // JS on 2026-07-07 (week-8 = 2026-05-18) had drifted one week off by
  // the time this was checked against the kitchen's real schedule. If
  // this drifts again, re-anchor to a fresh confirmed (week number,
  // delivery Monday) pair rather than trusting the arithmetic across a
  // long gap -- see handoff doc section 3c on skipped/staged weeks.
  weekCollectionAnchor: {
    handle: 'week-3',
    number: 3,
    deliveryDate: '2026-07-13',
  },

  entreesSellingPlanId: '2086404148',

  // Double protein is a SEPARATE cart line item, not just a property.
  // Hydrogen checkout shows it as "Double Protein Subscription" with
  // quantity = number of meals marked double protein, at $3.23/unit.
  doubleProteinVariantId: '45315362193460',
  doubleProteinSellingPlanId: '2086469684',
  doubleProteinPerMeal: 3.23,

  entreesVariants: {
    5: { id: '45201486610484', price: 66.8 },
    6: { id: '45201486643252', price: 79.35 },
    7: { id: '45201486676020', price: 91.64 },
    8: { id: '45201486708788', price: 103.67 },
    9: { id: '45201486741556', price: 115.42 },
    10: { id: '45201486774324', price: 126.92 },
    11: { id: '45201486807092', price: 138.13 },
    12: { id: '45201486839860', price: 149.09 },
    13: { id: '45201486872628', price: 159.77 },
    14: { id: '45201486905396', price: 170.2 },
    15: { id: '45982833147956', price: 180.35 },
    16: { id: '45982833180724', price: 190.23 },
    18: { id: '45982833246260', price: 209.2 },
    19: { id: '45982833279028', price: 218.29 },
    20: { id: '45982833311796', price: 227.1 },
    21: { id: '45982833344564', price: 235.65 },
    25: { id: '45982833475636', price: 267.18 },
  },

  plans: {
    lifestyle: {
      name: 'Lifestyle',
      tag: 'Lifestyle',
      image: 'https://cdn.shopify.com/s/files/1/0273/5253/0996/files/Lifestyle_Meal_Plan.svg?v=1748263149',
      color: '#eff4eb',
      photoUrl: 'https://welcome.rebuiltmeals.com/wp-content/uploads/2026/05/lifestyle.jpg',
    },
    performance: {
      name: 'Performance',
      tag: 'Performance',
      image: 'https://cdn.shopify.com/s/files/1/0273/5253/0996/files/Performance_Meal_Plan.svg?v=1748263173',
      color: '#f2fafe',
      photoUrl: 'https://welcome.rebuiltmeals.com/wp-content/uploads/2026/05/performance.jpg',
    },
    keto: {
      name: 'Keto / Low Carb',
      tag: 'Keto / Low Carb',
      image: 'https://cdn.shopify.com/s/files/1/0273/5253/0996/files/Keto___Low_Carb_Meal_Plan_1.svg?v=1748283048',
      color: '#fff3bd',
      photoUrl: 'https://welcome.rebuiltmeals.com/wp-content/uploads/2026/05/keto.jpg',
    },
    plant: {
      name: 'Plant-Based',
      tag: 'Plant-Based',
      image: 'https://cdn.shopify.com/s/files/1/0273/5253/0996/files/Plant-Based_Meal_Plan_1.svg?v=1748283067',
      color: '#eaf5ee',
      photoUrl: 'https://welcome.rebuiltmeals.com/wp-content/uploads/2026/05/plant-based.jpg',
    },
  },

  planColors: {
    'Lifestyle': '#eff4eb',
    'Performance': '#f2fafe',
    'Keto / Low Carb': '#fff3bd',
    'Plant-Based': '#eaf5ee',
  },
};
