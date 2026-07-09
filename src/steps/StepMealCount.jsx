import { useState } from 'react';
import { shopifyConfig } from '../config/shopify';

// Available counts + prices come straight from the live entrées variant
// map (shopifyConfig.entreesVariants), not an invented per-meal rate --
// this is a flat price per box size in production, not sum-of-meals.
const MEAL_COUNTS = Object.keys(shopifyConfig.entreesVariants).map(Number).sort((a, b) => a - b);
const MOST_POPULAR_COUNT = 10;

// Only call out savings on the big-box tiles -- showing "Save X%" on
// nearly every tile diluted the signal, so it's now reserved for the
// counts that actually represent a meaningful step up in value.
const SAVINGS_BADGE_COUNTS = new Set([15, 20, 25]);

// Initial 4 tiles shown before "More" -- always includes the "Most
// Popular" badge count so it's visible without an extra click, even
// though the real variant map's counts run consecutively (5,6,7,8...)
// rather than the old mock's curated spread (5,7,9,10...) that happened
// to include 10 in a plain first-4 slice.
function initialVisibleCounts() {
  if (!MEAL_COUNTS.includes(MOST_POPULAR_COUNT)) return MEAL_COUNTS.slice(0, 4);
  const rest = MEAL_COUNTS.filter(n => n !== MOST_POPULAR_COUNT).slice(0, 3);
  return [...rest, MOST_POPULAR_COUNT].sort((a, b) => a - b);
}

export default function StepMealCount({ mealCount, setMealCount, onNext }) {
  const [showMore, setShowMore] = useState(false);
  const visibleCounts = showMore ? MEAL_COUNTS : initialVisibleCounts();

  // Savings vs. the smallest box's per-meal rate, so bigger boxes can show
  // how much cheaper per meal they actually are.
  const baseCount = MEAL_COUNTS[0];
  const basePerMeal = shopifyConfig.entreesVariants[baseCount].price / baseCount;
  const bestHiddenSavings = Math.max(
    0,
    ...MEAL_COUNTS.filter(n => !initialVisibleCounts().includes(n)).map(n => {
      const perMeal = shopifyConfig.entreesVariants[n].price / n;
      return Math.round((1 - perMeal / basePerMeal) * 100);
    })
  );

  return (
    <div className="flex-1 px-4 sm:px-6 py-8 max-w-2xl mx-auto w-full pb-28">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl sm:text-4xl text-gray-900 mb-2">
          How many meals per week?
        </h1>
        <p className="text-gray-500">More meals = lower price per meal. Change anytime.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {visibleCounts.map(n => {
          const weekly = shopifyConfig.entreesVariants[n].price;
          const perMeal = weekly / n;
          const isSelected = mealCount === n;
          const isMostPopular = n === 10;
          const savingsPct = SAVINGS_BADGE_COUNTS.has(n) ? Math.max(0, Math.round((1 - perMeal / basePerMeal) * 100)) : 0;
          return (
            <div key={n} className="relative">
              {isMostPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-brand-green text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow">
                    ★ Most Popular
                  </span>
                </div>
              )}
              <button
                onClick={() => setMealCount(n)}
                className={`px-4 py-5 rounded-2xl text-left border-2 transition-all w-full ${
                  isMostPopular ? 'pt-6' : ''
                } ${
                  isSelected
                    ? 'bg-brand-green text-white border-brand-green shadow-md'
                    : isMostPopular
                    ? 'bg-white text-gray-700 border-gray-200 shadow-sm hover:shadow-md'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:shadow-sm'
                }`}
              >
                <p className="font-bold text-lg leading-tight">{n} meals</p>
                <p className={`text-sm mt-1 leading-tight flex items-center gap-1.5 ${isSelected ? 'text-green-100' : 'text-gray-400'}`}>
                  ${perMeal.toFixed(2)}/meal
                  {savingsPct > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                    }`}>
                      Save {savingsPct}%
                    </span>
                  )}
                </p>
                <p className={`text-xs leading-tight font-semibold mt-0.5 ${isSelected ? 'text-white/70' : 'text-gray-300'}`}>
                  ${weekly.toFixed(2)}/wk
                </p>
              </button>
            </div>
          );
        })}

        {!showMore && (
          <button
            onClick={() => setShowMore(true)}
            className="px-4 py-5 rounded-2xl text-sm font-semibold text-gray-400 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-500 transition-colors w-full flex flex-col items-center justify-center gap-0.5"
          >
            <span>Better Value ↓</span>
            {bestHiddenSavings > 0 && (
              <span className="text-xs text-green-600 font-bold">Save up to {bestHiddenSavings}%</span>
            )}
          </button>
        )}
        {showMore && (
          <button
            onClick={() => setShowMore(false)}
            className="col-span-2 py-2.5 rounded-2xl text-sm font-semibold text-gray-400 border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-500 transition-colors w-full"
          >
            Show Less ↑
          </button>
        )}
      </div>

      {/* Sticky bar at every breakpoint (solid background so it never
          blends into content behind it as the tile grid scrolls) */}
      <div className="fixed bottom-0 inset-x-0 z-20 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onNext}
            disabled={!mealCount}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all shadow-md ${
              mealCount
                ? 'bg-brand-green hover:bg-brand-green-dark text-white'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
            }`}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
