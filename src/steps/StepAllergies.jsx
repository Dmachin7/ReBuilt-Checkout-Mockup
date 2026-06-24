import { useState } from 'react';
import { ALLERGY_OPTIONS } from '../data/meals';

const ALLERGY_REST = ALLERGY_OPTIONS.filter(o => o.id !== 'none');

export default function StepAllergies({ onViewSummary, onCheckout, onBack }) {
  const [selected, setSelected] = useState(new Set());
  const [customText, setCustomText] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  function toggle(id) {
    const next = new Set(selected);
    if (id === 'none') {
      next.clear();
      if (!selected.has('none')) {
        next.add('none');
        setSelected(next);
        // Auto-navigate when no restrictions selected
        onViewSummary();
        return;
      }
    } else {
      next.delete('none');
      if (next.has(id)) next.delete(id);
      else next.add(id);
    }
    setSelected(next);
  }

  const noAllergies = selected.has('none');

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl lg:max-w-3xl mx-auto w-full pb-64 sm:pb-16">

      <div className="mb-5">
        <h2 className="font-display text-2xl sm:text-3xl text-gray-900 mb-1">Any dietary restrictions?</h2>
        <p className="text-gray-500 text-sm">We'll flag incompatible meals on your menu. Select all that apply.</p>
      </div>

      {/* NO ALLERGIES — full-width, top */}
      <button
        onClick={() => toggle('none')}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all mb-4 ${
          noAllergies ? 'border-brand-green bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-colors ${
          noAllergies ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-500'
        }`}>
          ✓
        </div>
        <div className="text-left flex-1">
          <p className="font-bold text-gray-900 text-base">No Restrictions — I can eat everything</p>
          <p className="text-gray-500 text-xs mt-0.5">Selecting this will take you to your order summary</p>
        </div>
        {noAllergies && <span className="text-brand-green font-bold text-xl flex-shrink-0">✓</span>}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or select what to avoid</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Allergy options grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        {ALLERGY_REST.map(opt => {
          const isSelected = selected.has(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                isSelected ? 'border-brand-green bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-green text-white text-[9px] font-bold flex items-center justify-center">
                  ✓
                </span>
              )}
              <span className="text-base flex-shrink-0 leading-none">{opt.icon}</span>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-tight">{opt.label}</p>
                <p className="text-gray-400 text-[10px] leading-tight mt-0.5 line-clamp-1">{opt.description}</p>
              </div>
            </button>
          );
        })}

        {/* Custom allergy — styled like an allergy card */}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
            showCustom ? 'border-brand-green bg-green-50' : 'border-dashed border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <span className="text-base flex-shrink-0 leading-none">✏️</span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight">Other / Custom</p>
            <p className="text-gray-400 text-[10px] leading-tight mt-0.5">Not listed? Add a note</p>
          </div>
        </button>
      </div>

      {/* Custom allergy textarea — revealed when custom card clicked */}
      {showCustom && (
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-5 animate-reveal">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-900">Anything else we should know?</label>
            <button onClick={() => setShowCustom(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
          </div>
          <textarea
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            placeholder="e.g. severe cilantro sensitivity, low-sodium preference..."
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
          />
        </div>
      )}

      {/* Floating on mobile, inline on sm+ */}
      <div className="fixed sm:static bottom-4 inset-x-4 sm:inset-auto z-20 flex flex-col gap-2.5">
        <button
          onClick={onViewSummary}
          className="w-full py-4 rounded-2xl font-bold text-base bg-brand-green hover:bg-brand-green-dark text-white transition-colors shadow-md"
        >
          Continue To Order Summary →
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
