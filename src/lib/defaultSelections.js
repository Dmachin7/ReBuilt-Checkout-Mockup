// Deterministic default-fill algorithm for "Chef picks for me" and
// single-plan defaults, sourced from ReBuilt's "Default Plans - Default
// Breakdown" reference spreadsheet (confirmed 2026-07-16). Replaces a
// naive `index % pool.length` round-robin that didn't match the real
// distribution and could double up on one meal while skipping another
// (e.g. 5 meals -> [2,1,1,1,0] instead of the correct [1,1,1,1,1]).
//
// For a total split across N ranked slots, the remainder is distributed
// either to the END slots ("reverse" -- single-plan entree defaults, and
// the Performance half of Chef's Choice) or the START slots ("forward" --
// the Lifestyle half of Chef's Choice, and the Keto-only breakfast table).
// Verified against every row of the source table for both directions and
// slot counts (5-slot entrees, 4-slot and 2-slot breakfast).
export function distributeCount(total, slotCount, direction = 'reverse') {
  if (slotCount <= 0) return [];
  const base = Math.floor(total / slotCount);
  const remainder = total % slotCount;
  const result = new Array(slotCount).fill(base);
  if (direction === 'reverse') {
    for (let i = slotCount - remainder; i < slotCount; i++) result[i] += 1;
  } else {
    for (let i = 0; i < remainder; i++) result[i] += 1;
  }
  return result;
}

function applyDistribution(pool, dist) {
  return pool
    .map((meal, i) => ({ meal, quantity: dist[i] || 0 }))
    .filter(x => x.quantity > 0);
}

// Single-plan (Lifestyle/Performance/Keto/Plant-Based) entree default:
// reverse-fill across that plan's meals in catalog order.
export function defaultEntreeSelection(pool, mealCount) {
  const dist = distributeCount(mealCount, pool.length, 'reverse');
  return applyDistribution(pool, dist);
}

// Chef's Choice entree default: Performance gets ceil(total/2) via
// reverse-fill, Lifestyle gets floor(total/2) via forward-fill.
export function chefsChoiceEntreeSelection(performancePool, lifestylePool, mealCount) {
  const perfCount = Math.ceil(mealCount / 2);
  const lifeCount = Math.floor(mealCount / 2);
  const perfDist = distributeCount(perfCount, performancePool.length, 'reverse');
  const lifeDist = distributeCount(lifeCount, lifestylePool.length, 'forward');
  return [
    ...applyDistribution(performancePool, perfDist),
    ...applyDistribution(lifestylePool, lifeDist),
  ];
}

// Breakfast default: Keto-plan customers draw only from Keto-tagged
// breakfast items (2 slots, forward-fill). Everyone else draws from the
// full breakfast lineup (4 slots, reverse-fill) -- confirmed via a real
// captured order that included a Keto-tagged breakfast item for a
// non-keto customer under the general default.
export function defaultBreakfastSelection(breakfastPool, count, isKetoPlan) {
  const pool = isKetoPlan ? breakfastPool.filter(m => m.isKetoOnly) : breakfastPool;
  const dist = distributeCount(count, pool.length, isKetoPlan ? 'forward' : 'reverse');
  return applyDistribution(pool, dist);
}
