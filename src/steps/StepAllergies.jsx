import { useState } from 'react';
import { ALLERGY_OPTIONS } from '../data/meals';

const ALLERGY_REST = ALLERGY_OPTIONS.filter(o => o.id !== 'none');

export default function StepAllergies({ onNext, onBack }) {
  const [selected, setSelected] = useState(new Set());
  const [customText, setCustomText] = useState('');

  function toggle(id) {
    const next = new Set(selected);
    if (id === 'none') {
      // Selecting "none" clears all others
      next.clear();
      if (!selected.has('none')) next.add('none');
    } else {
      next.delete('none');
      if (next.has(id)) next.delete(id);
      else next.add(id);
    }
    setSelected(next);
  }

  const noAllergies = selected.has('none');

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto w-full pb-16">

      <div className="mb-5">
        <h2 className="font-display text-2xl sm:text-3xl text-gray-900 mb-1">Any dietary restrictions?</h2>
        <p className="text-gray-500 text-sm">We'll flag incompatible meals on your menu. Select all that apply.</p>
      </div>

      {/* NO ALLERGIES — full-width, top, most prominent */}
      <button
        onClick={() => toggle('none')}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all mb-4 ${
          noAllergies
            ? 'border-brand-green bg-green-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-colors ${
          noAllergies ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-500'
        }`}>
          ✓
        </div>
        <div className="text-left flex-1">
          <p className="font-bold text-gray-900 text-base">No Restrictions — I can eat everything</p>
          <p className="text-gray-500 text-xs mt-0.5">No allergies or dietary restrictions</p>
        </div>
        {noAllergies && (
          <span className="text-brand-green font-bold text-xl flex-shrink-0">✓</span>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or select what to avoid</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Allergy options grid — icon small, label prominent */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
        {ALLERGY_REST.map(opt => {
          const isSelected = selected.has(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-brand-green bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-green text-white text-[9px] font-bold flex items-center justify-center">
                  ✓
                </span>
              )}
              {/* Icon — small, secondary */}
              <span className="text-base flex-shrink-0 leading-none">{opt.icon}</span>
              {/* Label + description */}
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-tight">{opt.label}</p>
                <p className="text-gray-400 text-[10px] leading-tight mt-0.5 line-clamp-1">{opt.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom allergy text */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Anything else we should know?
        </label>
        <textarea
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          placeholder="e.g. severe cilantro sensitivity, low-sodium preference..."
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
        />
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onNext}
          className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-xl text-base transition-colors shadow-sm"
        >
          Continue to Checkout →
        </button>
        <button
          onClick={onBack}
          className="w-full text-gray-500 hover:text-gray-700 font-medium text-sm py-2 transition-colors"
        >
          ← Back to Snacks
        </button>
      </div>
    </div>
  );
}
