import { useState } from 'react';
import { PLANS } from '../data/meals';

// Representative meal image for each plan type
const PLAN_IMAGES = {
  lifestyle:    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&q=80',
  performance:  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&q=80',
  keto:         'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80',
  chefs_choice: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=200&q=80',
  plant_based:  'https://images.unsplash.com/photo-1574484284002-952d92456975?w=200&q=80',
};

export default function StepPlan({ selectedPlan, setSelectedPlan, onNext, onBack }) {
  const [expandedPlan, setExpandedPlan] = useState(null);

  return (
    <div className="flex-1 px-4 sm:px-6 py-10 max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="font-display text-3xl sm:text-4xl text-gray-900 mb-2">
          Choose your meal preference
        </h1>
        <p className="text-gray-500 text-sm">
          This sets your backup plan if you ever miss the Thursday selection deadline, and helps us suggest meals you'll love.
        </p>
      </div>

      {/* 2-col grid on mobile, 3-col on sm+ for 5 plans */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {PLANS.map(plan => {
          const img = PLAN_IMAGES[plan.id];
          const isSelected = selectedPlan === plan.id;
          return (
            <div key={plan.id} className="flex flex-col">
              <button
                onClick={() => setSelectedPlan(isSelected ? null : plan.id)}
                className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2.5 ${
                  isSelected
                    ? 'border-brand-green bg-green-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Circular meal image */}
                <div className="relative mt-1">
                  {img ? (
                    <img
                      src={img}
                      alt={plan.name}
                      className="w-14 h-14 rounded-full object-cover shadow-md ring-2 ring-white"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center shadow-md ring-2 ring-white">
                      <span className="text-xl">🍽️</span>
                    </div>
                  )}
                  {/* Color dot badge */}
                  <div
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white"
                    style={{ background: plan.color }}
                  />
                </div>

                {/* Text */}
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900 leading-tight">{plan.name}</p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5 line-clamp-2">{plan.tagline}</p>
                </div>

                {isSelected && (
                  <span className="text-[10px] font-bold text-brand-green uppercase tracking-wide">✓ Selected</span>
                )}
              </button>

              <button
                onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                className="text-[10px] text-brand-green font-medium text-center mt-1 py-0.5 hover:underline"
              >
                {expandedPlan === plan.id ? 'Hide ▲' : 'Details ▼'}
              </button>
              {expandedPlan === plan.id && (
                <div className="mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-600 animate-reveal">
                  <p className="mb-1.5">{plan.description}</p>
                  <ul className="space-y-0.5">
                    {plan.highlights.map(h => (
                      <li key={h} className="flex items-start gap-1">
                        <span className="text-brand-green flex-shrink-0">✓</span> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <button
          onClick={onNext}
          disabled={!selectedPlan}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all shadow-sm ${
            selectedPlan
              ? 'bg-brand-green hover:bg-brand-green-dark text-white'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {selectedPlan ? 'Continue →' : 'Pick a preference to continue'}
        </button>
        <button
          onClick={onBack}
          className="w-full text-gray-500 hover:text-gray-700 font-medium text-sm py-2 transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
