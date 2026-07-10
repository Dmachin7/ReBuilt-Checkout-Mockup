import { useEffect, useState } from 'react';
import { getWeekPlan } from '../lib/shopifyWeeks';
import { fetchWeekCollection, transformCollection } from '../lib/shopifyMenu';

// Fetches the active week's collection plus `lookaheadWeeks - 1` weeks
// ahead from Shopify. `loading` covers the whole batch; `error` is set only
// on a hard fetch failure (network/API error), not on a collection that
// legitimately returns zero products -- an empty week should be visible,
// not silently masked by fallback data.
//
// Each week's `meals` array is unfiltered -- a collection bundles entrées,
// breakfast, and snacks together (see meal.productType). Callers filter by
// productType for the step they're feeding.
//
// The date-computed `plan` (see shopifyWeeks.js) decides which two weeks
// *should* be orderable. Staff's `week.is_weekly` metafield sits on top of
// that as a manual kill switch -- e.g. pulling a week early for a supply
// issue -- so a week is only dropped here when that flag is explicitly
// "false". Null/missing (not yet set by staff) leaves the date math as-is,
// since treating "not configured" as "off" would silently hide a week
// nobody meant to take down. When staff have set `delivery_week`/
// `week_title`, those override the computed date/label -- their authored
// values are the source of truth over our formula-derived guesses.
export function useShopifyMenu(lookaheadWeeks = 3) {
  const [state, setState] = useState({ loading: true, error: null, weeks: [], mealDetails: {} });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const plan = getWeekPlan(new Date(), lookaheadWeeks);
      try {
        const results = await Promise.all(plan.map(w => fetchWeekCollection(w.handle)));
        if (cancelled) return;
        const mealDetails = {};
        const weeks = plan
          .map((w, i) => {
            const result = results[i];
            const { meals, details } = transformCollection(result.products);
            Object.assign(mealDetails, details);
            return {
              ...w,
              deliveryDate: result.deliveryWeek || w.deliveryDate,
              label: result.weekTitle || w.label,
              isWeekly: result.isWeekly,
              meals,
            };
          })
          .filter(w => w.isWeekly !== 'false');
        setState({ loading: false, error: null, weeks, mealDetails });
      } catch (err) {
        if (!cancelled) {
          setState(s => ({ ...s, loading: false, error: err.message }));
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [lookaheadWeeks]);

  return state;
}
