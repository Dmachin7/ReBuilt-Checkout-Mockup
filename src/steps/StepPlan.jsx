import { useState } from 'react';
import { PLANS } from '../data/meals';

const PLAN_IMAGES = {
  lifestyle:    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80',
  performance:  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80',
  keto:         'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',
  chefs_choice: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=400&q=80',
  plant_based:  'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80',
};

export default function StepPlan({ selectedPlan, setSelectedPlan, onNext, onBack }) {
  const [expandedPlan, setExpandedPlan] = useState(null);

  return (
    <div className="flex-1 px-4 sm:px-6 py-4 sm:py-8 max-w-3xl lg:max-w-5xl mx-auto w-full pb-28 sm:pb-10">
      <div className="mb-4 sm:mb-6">
        <h1 className="font-display text-xl sm:text-4xl text-gray-900 mb-1 sm:mb-2">
          Choose your meal preference
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm">
          Sets your backup plan if you miss the Tuesday deadline, and helps us suggest meals you'll love.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {PLANS.map(plan => {
          const img = PLAN_IMAGES[plan.id];
          const isSelected = selectedPlan === plan.id;
          const isExpanded = expandedPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border-2 overflow-hidden transition-all ${
                isSelected
                  ? 'border-brand-green shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {/* Full-bleed hero image */}
              <div
                className="relative w-full aspect-video sm:aspect-[4/3] overflow-hidden cursor-pointer"
                onClick={() => setSelectedPlan(isSelected ? null : plan.id)}
              >
                {img ? (
                  <img src={img} alt={plan.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-4xl">🍽️</span>
                  </div>
                )}
                {/* Color accent strip at bottom of image */}
                <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: plan.color }} />
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-brand-green flex items-center justify-center text-white font-bold text-sm shadow-md">
                    ✓
                  </div>
                )}
              </div>

              {/* Title row */}
              <div
                className={`px-4 pt-3 pb-2 cursor-pointer ${isSelected ? 'bg-green-50' : 'bg-white'}`}
                onClick={() => setSelectedPlan(isSelected ? null : plan.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{plan.name}</p>
                    <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 line-clamp-2 hidden sm:block">{plan.tagline}</p>
                  </div>
                  <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: plan.color }} />
                </div>
              </div>

              {/* Details toggle — expands card in-place */}
              <div className={`px-4 pb-3 ${isSelected ? 'bg-green-50' : 'bg-white'}`}>
                <button
                  onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  className="text-xs text-brand-green font-semibold hover:underline"
                >
                  {isExpanded ? '▲ Hide details' : '▼ More details'}
                </button>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-gray-100 animate-reveal">
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">{plan.description}</p>
                    <ul className="space-y-1">
                      {plan.highlights.map(h => (
                        <li key={h} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <span className="text-brand-green flex-shrink-0 mt-0.5">✓</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating on mobile, inline on sm+ */}
      <div className="fixed sm:static bottom-4 inset-x-4 sm:inset-auto z-20 space-y-2">
        <button
          onClick={onNext}
          disabled={!selectedPlan}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all shadow-md ${
            selectedPlan
              ? 'bg-brand-green hover:bg-brand-green-dark text-white'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
          }`}
        >
          {selectedPlan ? 'Continue →' : 'Pick a preference to continue'}
        </button>
        <button
          onClick={onBack}
          className="w-full text-gray-500 hover:text-gray-700 font-medium text-sm py-2 transition-colors text-center"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
