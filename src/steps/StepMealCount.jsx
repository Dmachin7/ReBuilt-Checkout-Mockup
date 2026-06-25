import { useState } from 'react';
import { MEAL_COUNTS } from '../data/meals';

const PRICING = {
  5:  { perMeal: 13.99 },
  7:  { perMeal: 13.49 },
  9:  { perMeal: 12.99 },
  10: { perMeal: 12.99 },
  12: { perMeal: 12.49 },
  14: { perMeal: 11.99 },
  16: { perMeal: 11.49 },
  18: { perMeal: 10.99 },
};

export default function StepMealCount({ mealCount, setMealCount, onNext }) {
  const [showMore, setShowMore] = useState(false);
  const visibleCounts = showMore ? MEAL_COUNTS : MEAL_COUNTS.slice(0, 4);

  return (
    <div className="flex-1 px-4 sm:px-6 py-8 max-w-2xl mx-auto w-full pb-28 sm:pb-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl sm:text-4xl text-gray-900 mb-2">
          How many meals per week?
        </h1>
        <p className="text-gray-500">More meals = lower price per meal. Change anytime.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {visibleCounts.map(n => {
          const p = PRICING[n];
          const weekly = (p.perMeal * n).toFixed(2);
          const isSelected = mealCount === n;
          const isMostPopular = n === 10;
          return (
            <div key={n} className="relative">
              {isMostPopular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="bg-brand-green text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
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
                    ? 'bg-white text-gray-700 border-brand-green shadow-sm hover:shadow-md'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:shadow-sm'
                }`}
              >
                <p className="font-bold text-lg leading-tight">{n} meals</p>
                <p className={`text-sm mt-1 leading-tight ${isSelected ? 'text-green-100' : 'text-gray-400'}`}>
                  ${p.perMeal}/meal
                </p>
                <p className={`text-xs leading-tight font-semibold mt-0.5 ${isSelected ? 'text-white/70' : 'text-gray-300'}`}>
                  ${weekly}/wk
                </p>
              </button>
            </div>
          );
        })}

        {!showMore && (
          <button
            onClick={() => setShowMore(true)}
            className="px-4 py-5 rounded-2xl text-sm font-semibold text-gray-400 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-500 transition-colors w-full"
          >
            More ↓
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

      {/* Floating on mobile, inline on sm+ */}
      <div className="fixed sm:static bottom-4 inset-x-4 sm:inset-auto z-20 mt-6 sm:mt-8">
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
  );
}
