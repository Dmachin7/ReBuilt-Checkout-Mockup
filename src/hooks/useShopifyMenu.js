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
        const weeks = plan.map((w, i) => {
          const { meals, details } = transformCollection(results[i]);
          Object.assign(mealDetails, details);
          return { ...w, meals };
        });
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
