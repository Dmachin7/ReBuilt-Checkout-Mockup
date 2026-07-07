# Subscription Checkout Replication Handoff

A working guide to the checkout flow ReBuilt Meals built on Shopify Plus with Recharge subscriptions. This covers the pieces most people get wrong: loading the current menu week from Shopify, calculating the delivery week, and passing the exact metadata that makes Recharge fire correctly. Where a value is store-specific (tokens, variant IDs, selling plan IDs, discount codes), it appears here as a placeholder. Substitute your own from your Shopify and Recharge setup.

Written for someone standing up a static front-end order builder (hosted anywhere: WordPress, a landing page, a headless front end) that hands a fully-formed subscription cart to Shopify checkout.

---

## 1. The architecture in one paragraph

The order builder is a static HTML/JS form. It does not POST to Shopify and it does not use the Storefront cart mutations to create the checkout. Instead it assembles one URL and navigates the browser to it. That URL hits Shopify's storefront `/cart/add` endpoint with the variant, the Recharge selling plan, and all subscription metadata as line-item properties, then chains through a discount URL that redirects into checkout. The whole subscription (plan, meals, delivery week, allergies) rides along as metadata on a single cart line. Recharge reads that metadata on its side. Nothing about the order is created server-side by the form itself.

Two things do the real work:
- `selling_plan=[ID]` on the cart line. This is what converts a one-time product into a Recharge subscription. Without it, no subscription is created.
- The line-item `properties[...]` payload. This is the data Recharge and any downstream webhook read to build the subscription correctly (which week, which meals, new-customer flag, allergies).

Everything else is plumbing around those two facts.

---

## 2. Stack assumptions

This pattern assumes:
- Shopify (Plus in ReBuilt's case, but the storefront endpoints used here are standard) 
- Recharge for subscription management, with selling plans already configured on the subscription product
- A subscription product that carries per-quantity variants (in ReBuilt's case, one "entrees" product whose variants are the meal counts: 5, 6, 7, ... meals)
- A Storefront API access token for reading the menu
- A checkout discount code you want applied to the first order

If your subscription product is modeled differently (for example, a separate product per plan), the metadata section still applies; only the variant mapping in section 6 changes.

---

## 3. Loading the current week from Shopify

The menu changes weekly. Products for the current week are tagged with a week tag (ReBuilt uses `Week 7`, `Week 8`, and so on) plus a product-type tag (`entrees`). The front end reads the current week's meals from the Storefront GraphQL API.

### 3a. The read query

```js
var query = "{ products(first: 100, query: \"tag:'" + activeWeekTag + "' AND tag:'entrees'\") { edges { node { id handle title description tags featuredImage { url } variants(first: 5) { edges { node { id title price { amount } } } } } } } }";

fetch('https://' + storefrontApiHost + '/api/' + storefrontApiVersion + '/graphql.json', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': storefrontToken
  },
  body: JSON.stringify({ query: query })
})
.then(function(r){ return r.json(); })
.then(function(data){
  var products = data.data.products.edges.map(function(e){ return e.node; });
  // render products, read each meal's Single Protein / Double Protein variant IDs, etc.
});
```

Config values you supply:
```
storefrontApiHost:    your-store.myshopify.com
storefrontApiVersion: 2026-04            (use a current, stable API version)
storefrontToken:      [YOUR_STOREFRONT_ACCESS_TOKEN]
```

The Storefront token is a public, client-side token by design, so it is safe to ship in front-end JS. It is not the Admin API token. Do not put an Admin API token or an `shpss_...` app secret anywhere in the front end.

### 3b. Detecting the current week accurately (recommended)

ReBuilt's checkout form currently hardcodes `activeWeekTag: 'Week 7'` and requires a manual edit each week. That works but it is a standing maintenance task and an easy thing to forget. The more reliable approach, which ReBuilt uses on its live menu preview page, is to auto-detect the highest `Week N` tag present on the entrees products and treat that as the active week:

```js
async function getActiveWeekTag(cfg) {
  var query = "{ products(first: 250, query: \"tag:'entrees'\") { edges { node { tags } } } }";
  var res = await fetch('https://' + cfg.host + '/api/' + cfg.version + '/graphql.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': cfg.token
    },
    body: JSON.stringify({ query: query })
  });
  var data = await res.json();
  var maxWeek = 0;
  data.data.products.edges.forEach(function(e){
    (e.node.tags || []).forEach(function(t){
      var m = /^Week\s+(\d+)$/i.exec(t);
      if (m) maxWeek = Math.max(maxWeek, parseInt(m[1], 10));
    });
  });
  return maxWeek ? 'Week ' + maxWeek : null;
}
```

Call this first, then feed the result into the menu query in 3a. This removes the weekly manual edit and keeps the builder pointed at whatever the kitchen team last tagged.

### 3c. The 13-week menu cycle and why "highest number" is not enough

The menu runs on a **13-week rotation**. Products are tagged `Week 1` through `Week 13`, and after Week 13 the cycle returns to Week 1 and starts over. The week numbers are menu-rotation positions, not a monotonic counter that climbs forever.

This breaks the naive "pick the highest `Week N`" heuristic at exactly one point: the wraparound. When the active week moves from `Week 13` to `Week 1`, the new active week is the **lowest** number present, not the highest. A detector that always takes the max will keep pointing at Week 13 across the boundary and serve last-cycle's menu.

Two ways to handle it, depending on how your team tags:

1. **Only the active week is ever tagged (simplest).** If the kitchen retags so that exactly one `Week N` tag is live on the products at any time, then detection is just "read the single week tag that is present," and the wraparound is a non-issue because there is only ever one value. `Math.max` still returns the right answer when there is only one candidate, so the snippet above works as-is under this convention. The risk is only if two weeks are ever tagged at once.

2. **Multiple weeks can be tagged at once (staging ahead).** If you ever stage the upcoming week's products alongside the current week, "highest number" is wrong at the boundary. Track cycle position explicitly instead: store the current week number somewhere authoritative (a metafield, a small config the kitchen updates, or a computed offset from a known cycle-start date), and advance it modulo 13:

```js
// nextWeek(current) walks 1..13 and wraps back to 1 after 13
function nextWeek(current) {
  return (current % 13) + 1;
}
```

   With a known cycle-start Monday you can compute the active week without any manual tracking:

```js
function activeCycleWeek(cycleStartMonday) {
  var msPerWeek = 7 * 24 * 60 * 60 * 1000;
  var weeksElapsed = Math.floor((Date.now() - cycleStartMonday.getTime()) / msPerWeek);
  return (weeksElapsed % 13) + 1; // 1..13, wraps automatically
}
```

The takeaway: do not assume the week number only goes up. It resets to 1 every 13 weeks. Pick a detection method that survives that reset, or guarantee by convention that only one week is tagged at a time.

Keep in mind this 13-week rotation is about **which menu is live**. It is a separate concept from the delivery-week date and first-charge timing in section 4, which are calendar dates, not rotation positions. Do not conflate the two.

### 3d. CORS constraint (important)

Cross-origin `fetch` reads from your front-end domain to `your-store.myshopify.com/api/...` (the Storefront GraphQL endpoint) work fine, because the Storefront API sends permissive CORS headers. What does NOT work cross-origin are Shopify's AJAX cart endpoints (`/cart.js`, `/cart/add.js`, `/cart/clear.js`). Those only respond same-origin, meaning only when the active tab is already on the myshopify or primary storefront domain. This is exactly why the checkout submission (section 5) uses a full-page GET navigation to `/cart/add` rather than a background fetch. Do not try to build the cart with a background AJAX call from an off-store domain. It will be blocked.

---

## 4. The week cycle (delivery week / first charge timing)

Every order carries a delivery week, expressed as the Monday of the week the food arrives, in `YYYY-MM-DD` format. This value goes into the `_setWeek` property and is also the key inside the `_metadata` object (section 5b).

### 4a. Delivery-week calculation

ReBuilt's kitchen needs lead time, so orders placed too close to a Monday delivery get pushed to the following Monday ("buffer days"). The front-end logic:

```js
function calculateSetWeek() {
  var d = new Date();
  var day = d.getDay(); // 0=Sun, 1=Mon, 2=Tue, ... 6=Sat
  var daysUntilMonday;

  if (day === 0) {
    daysUntilMonday = 1;          // Sunday: deliver this coming Monday
  } else if (day === 1 || day === 2) {
    daysUntilMonday = 8 - day;    // Mon/Tue: buffer, push to next Monday
  } else {
    daysUntilMonday = 8 - day;    // Wed-Sat: next Monday
  }

  d.setDate(d.getDate() + daysUntilMonday);
  var yyyy = d.getFullYear();
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}
```

Set the buffer window to match your own kitchen's cutoff. ReBuilt's cutoff treats Monday and Tuesday as too late for that same week. If your cutoff is, say, Thursday, widen the buffer branch accordingly.

### 4b. The honest caveat on charge timing

The `_setWeek` value tells the system which delivery the order is for. It does NOT, by itself, guarantee when Recharge issues the first charge. In ReBuilt's setup, charge timing is influenced by logic on the Recharge/webhook side (the Hydrogen storefront's subscription handler), and getting first-charge timing to line up with the buffer-day delivery week has been the single trickiest part to fully nail down. The pattern that has worked cleanly is: the front end always sends the correct upcoming Monday, and the server side is responsible for deferring the first charge so that an order placed during the buffer window is not treated as a "past" delivery.

If you are replicating this, treat delivery week (front end) and first-charge date (Recharge/server) as two separate problems. Send an accurate `_setWeek`, then verify on real test orders that Recharge's first charge and next-charge dates match what you intend. Do not assume the front-end date controls billing. Test it.

---

## 5. Metadata required for Recharge to fire correctly

This is the part that silently breaks if you get it wrong, because a casing mismatch does not throw an error. It just gets ignored, and the subscription is created with missing or default data. The schema below is matched to a confirmed-working production order.

### 5a. The line-item properties (case-sensitive)

Six properties ride on the single cart line. Casing is exact and matters:

| Property | Example value | Notes |
|---|---|---|
| `_subscriptionType` | `entrees` | Capital **T**. A lowercase `_subscriptiontype` is silently ignored and first-order logic gets skipped. |
| `_setWeek` | `2026-05-04` | `YYYY-MM-DD`, the Monday delivery week from section 4. |
| `_metadata` | `{ ...JSON... }` | Stringified JSON, keyed by the same delivery-week date. Shape in 5b. |
| `_isNew` | `true` | String. First-time-customer flag used by downstream logic. |
| `_Allergies` | `No Allergies` | Capital **A**. Defaults to the literal string `No Allergies` when none selected. |
| `_AllergiesNotes` | `No Allergies Notes` | Capital **A** and **N**. Defaults to the literal string `No Allergies Notes`. |

Do NOT send `_defaultData` or `_productTitle` as separate properties. Earlier form versions did; production does not. That information lives inside `_metadata` instead. Extra properties are not just clutter here, they diverged from what the working order looked like, so keep the set to these six.

The selling plan is separate from properties and is what actually makes it a subscription:
```
selling_plan=[YOUR_RECHARGE_SELLING_PLAN_ID]
```

### 5b. The inner `_metadata` shape

`_metadata` is a JSON string. Its top-level key is the delivery-week date (same value as `_setWeek`). Everything about the order sits under that key:

```json
{
  "2026-05-04": {
    "gsheetsProcessing": "pending",
    "skipped": false,
    "doubleProteinCount": 2,
    "singleProteinCount": 6,
    "defaultPlan": {
      "name": "Lifestyle",
      "image": "https://.../Lifestyle_Meal_Plan.svg",
      "color": "#eff4eb"
    },
    "mealsCount": "8",
    "userSelections": [
      {
        "planName": "Lifestyle",
        "planImage": "https://.../plan.svg",
        "meals": [
          {
            "productTitle": "Grilled Chicken Bowl",
            "productImage": "https://.../meal.jpg",
            "proteinAmount": "Single Protein",
            "quantity": 1,
            "mealPlanImage": "https://.../plan.svg",
            "mealPlanColor": null,
            "mealRank": 2
          }
        ]
      }
    ]
  }
}
```

Field notes from the working order:
- `mealsCount` is a **string**, not a number.
- `mealPlanColor` is always `null` in production.
- `proteinAmount` is the per-meal string `"Single Protein"` or `"Double Protein"`. This is how a protein upgrade is represented. It is NOT a separate cart line item (see 6b).
- `userSelections` can contain multiple plans in one order (a customer mixing, for example, Lifestyle and Performance meals). Group meals by plan, and the meal quantities across all groups should sum to `mealsCount`.
- `doubleProteinCount + singleProteinCount` should also equal the total meal count.
- `gsheetsProcessing: "pending"` and `skipped: false` are status flags read downstream. Keep them unless your pipeline uses different flags.

### 5c. Why casing is the thing that bites

The webhook that processes the order looks for exact keys. When ReBuilt was sending lowercase `_subscriptiontype`, the handler found nothing where it expected the type, skipped the first-order branch, and the order came through with wrong payment timing and no obvious error anywhere in the form flow. If subscriptions are being created but behaving wrong, suspect a silent key mismatch before anything else. Diff your outgoing properties against a known-good order key by key, capitalization included.

---

## 6. Assembling the checkout URL

### 6a. The GET navigation chain

The form builds one URL and sets `window.location.href` to it:

```js
function buildCheckoutUrl() {
  var setWeek = calculateSetWeek();
  var variantId = variantForMealCount(state.count); // section 6b
  var metadataJson = JSON.stringify(buildMetadata(setWeek));

  var properties = {
    _subscriptionType: 'entrees',
    _setWeek: setWeek,
    _metadata: metadataJson,
    _isNew: 'true',
    _Allergies: allergiesValue,          // 'No Allergies' or joined chip string
    _AllergiesNotes: allergyNotesValue   // 'No Allergies Notes' or trimmed text
  };

  var params = [];
  params.push('id=' + variantId);
  params.push('quantity=1');
  params.push('selling_plan=' + encodeURIComponent(sellingPlanId));
  Object.keys(properties).forEach(function(key){
    params.push('properties[' + key + ']=' + encodeURIComponent(properties[key]));
  });

  // Chain: /cart/add -> /discount/[CODE] -> /checkout
  var checkoutChain = '/discount/' + encodeURIComponent(discountCode) + '?redirect=/checkout';
  params.push('return_to=' + encodeURIComponent(checkoutChain));

  return 'https://your-store.myshopify.com/cart/add?' + params.join('&');
}
```

The `return_to` chain is the key move. After `/cart/add` succeeds, Shopify follows `return_to` to `/discount/[CODE]?redirect=/checkout`. The discount endpoint is what mints a **signed** checkout session and then forwards to checkout.

### 6b. Why this and not a form POST

The obvious approach (a form that POSTs to `/cart/add` with `return_to=/checkout`) fails intermittently. That path produces an unsigned `/checkouts/cn/[token]` URL, and Shopify bounces unsigned checkout URLs back to the homepage. The symptom is maddening: sometimes it works, sometimes the customer lands on the home page with an empty-looking cart.

The GET navigation through `/discount/[CODE]?redirect=/checkout` produces a signed `_r` token, does not bounce, needs no cart-clear step, and avoids the CORS problem entirely (it is a top-level navigation, not a cross-origin fetch). This was verified end to end with metadata, selling plan, and discount all surviving into Shopify checkout. Use it.

### 6c. Encoding gotcha with the discount code

ReBuilt's discount code is `50%offer`, which contains a literal `%`. Encoded once for the path it becomes `50%25offer`, and because it is then nested inside `return_to=`, the whole thing gets encoded again to `50%2525offer`. `encodeURIComponent` handles the nesting correctly as written above, but if you hand-build any part of this URL, double-encoding is where it goes wrong. If your discount code has no special characters you will not hit this, but be aware the double layer of encoding is intentional and correct.

---

## 7. Variant mapping and the single-line-item model

### 7a. One line item

The cart has exactly one line: the entrees product, at the variant matching the chosen meal count, `quantity=1`. The variant carries the price for that meal count. Everything else (which specific meals, plan, protein level) is metadata, not additional lines.

Map meal count to variant ID from your own catalog. ReBuilt's mapping is a lookup table of `count -> variantId`. Build yours by reading `variants(first: 30)` off your subscription product via the Storefront API and recording each variant's ID and price. Note that not every count necessarily exists as a variant (ReBuilt has 5 through 25 but skips a few in the teens), so validate the variant exists before building the URL and fail gracefully if it does not.

### 7b. Protein upgrade as metadata, not a line item

A double-protein upgrade is represented per meal inside `_metadata` (`proteinAmount: "Double Protein"`) and reflected in `doubleProteinCount`, under a flat per-meal pricing model. It is NOT added as a second cart line and NOT priced through a separate variant on the cart. If your upsells are priced as their own line items you will model this differently, but if you want a clean single-line subscription that Recharge reads as one thing, keep upgrades in metadata and price them into the model.

---

## 8. Lessons learned, condensed

- **Casing is silent.** A mis-cased property key does not error. It just gets dropped and the subscription is built wrong. Diff against a known-good order.
- **Signed vs unsigned checkout.** Form-POST to checkout yields unsigned URLs that bounce to home. Route through `/discount/[CODE]?redirect=/checkout` to get a signed session.
- **CORS.** Storefront GraphQL reads work cross-origin; `/cart/*.js` AJAX endpoints do not. Use full-page navigation for the cart, fetch only for reading the menu.
- **Front-end date is not the billing date.** `_setWeek` sets the delivery week. First-charge timing lives on the Recharge/webhook side and must be verified on real orders.
- **`selling_plan` is the subscription trigger.** Omit it and you get a one-time purchase, not a subscription, even with perfect metadata.
- **Detect the week, do not hardcode it, and mind the reset.** Auto-detecting the active week beats a manual weekly edit someone will forget. But the menu runs a 13-week cycle that wraps from Week 13 back to Week 1, so "pick the highest number" fails at the boundary. Either tag only the active week at a time, or track cycle position modulo 13.
- **Keep the property set minimal and exact.** Extra properties diverged from the working order. Send the six that production sends, nothing more.
- **Double-encoding is real.** A discount code nested inside `return_to` gets encoded twice. Let `encodeURIComponent` do it; do not hand-assemble.

---

## 9. Replication checklist

1. Confirm your subscription product has Recharge selling plans attached, and record the selling plan ID.
2. Read your subscription product's variants via the Storefront API. Build the meal-count -> variant ID -> price table.
3. Get a Storefront access token for menu reads. Confirm your weekly products are tagged consistently (a week tag plus a type tag).
4. Implement week detection and the menu read query. Account for the 13-week cycle that wraps Week 13 back to Week 1 (do not naively pick the highest week number).
5. Implement the delivery-week calculation with your kitchen's buffer window.
6. Build the `_metadata` object to the shape in 5b, keyed by delivery week.
7. Assemble the six line-item properties with exact casing, plus `id`, `quantity=1`, and `selling_plan`.
8. Route checkout through `/cart/add` GET navigation with `return_to=/discount/[CODE]?redirect=/checkout`.
9. Place a real test order. Verify: subscription created in Recharge, correct first-charge and next-charge dates, delivery week correct, metadata present and readable on the subscription, discount applied to the first order only.
10. Diff the resulting order's properties against your intended payload, key by key, before calling it done.

---

## 10. Store-specific values to fill in

These are placeholders in this document. Each implementer supplies their own from their Shopify/Recharge setup. Do not reuse another store's tokens, IDs, or codes, and never place an Admin API token or app secret in front-end code.

```
storefrontApiHost:            your-store.myshopify.com
storefrontApiVersion:         (a current stable version)
storefrontToken:              [YOUR_STOREFRONT_ACCESS_TOKEN]   (public client-side token)
subscription product handle:  (your subscription product)
selling plan ID:              [YOUR_RECHARGE_SELLING_PLAN_ID]
variant map:                  (meal count -> variant ID, from your catalog)
discount code:                [YOUR_FIRST_ORDER_CODE]
week tagging convention:      (e.g. "Week N" on a 13-week cycle that wraps 13 -> 1, plus a type tag)
```
