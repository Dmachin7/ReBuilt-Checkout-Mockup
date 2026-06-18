import { useState } from 'react';

const CATEGORY_STYLES = {
  LIFESTYLE:     { text: 'text-green-600',  label: 'Lifestyle' },
  KETO:          { text: 'text-pink-600',   label: 'Keto' },
  PERFORMANCE:   { text: 'text-blue-600',   label: 'Performance' },
  'PLANT-BASED': { text: 'text-orange-500', label: 'Plant-Based' },
};

const BADGE_STYLES = {
  'Best Seller': { cls: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white', icon: '★' },
  'Going Fast':  { cls: 'bg-gradient-to-r from-rose-500 to-red-500 text-white',    icon: '🔥' },
  'New':         { cls: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white', icon: '✦' },
};

const DIETARY = {
  'Gluten Free': { icon: '🌾', label: 'GF',    cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  'Soy Free':    { icon: '🫘', label: 'SF',    cls: 'bg-violet-50 text-violet-700 border border-violet-200' },
  'Dairy Free':  { icon: '🥛', label: 'DF',    cls: 'bg-sky-50 text-sky-700 border border-sky-200' },
  'Vegan':       { icon: '🌿', label: 'Vegan', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

function QtyControl({ qty, onAdd, onRemove, atLimit }) {
  // Stop propagation so card clicks don't open modal when tapping +/-
  const stop = e => e.stopPropagation();

  if (qty === 0) {
    return (
      <button
        onClick={e => { stop(e); if (!atLimit) onAdd(); }}
        disabled={atLimit}
        aria-label="Add to order"
        className={`w-9 h-9 rounded-full text-white text-2xl font-light flex items-center justify-center shadow-md transition-colors flex-shrink-0 leading-none ${
          atLimit
            ? 'bg-gray-300 cursor-not-allowed shadow-none'
            : 'bg-brand-green hover:bg-brand-green-dark cursor-pointer'
        }`}
      >
        +
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1 bg-brand-charcoal rounded-full px-1.5 py-1 shadow-md flex-shrink-0" onClick={stop}>
      <button
        onClick={e => { stop(e); onRemove(); }}
        aria-label="Remove one"
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-base font-bold hover:bg-gray-600 transition-colors leading-none"
      >
        −
      </button>
      <span className="text-white text-sm font-bold min-w-[18px] text-center select-none">{qty}</span>
      <button
        onClick={e => { stop(e); if (!atLimit) onAdd(); }}
        disabled={atLimit}
        aria-label="Add one more"
        className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-base font-bold transition-colors leading-none ${
          atLimit
            ? 'bg-gray-600 opacity-40 cursor-not-allowed'
            : 'bg-brand-green hover:bg-brand-green-dark cursor-pointer'
        }`}
      >
        +
      </button>
    </div>
  );
}

function CircularImage({ src, alt, hasError, onError }) {
  if (!src || hasError) {
    return (
      <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-full flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center shadow-lg ring-4 ring-white">
        <span className="text-xl">📸</span>
        <span className="text-[9px] text-gray-400 mt-0.5 text-center leading-tight px-1">Coming soon</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={onError}
      className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-full flex-shrink-0 object-cover shadow-lg ring-4 ring-white"
    />
  );
}

export default function MealCard({ meal, qty, onAdd, onRemove, onDoubleProteinToggle, doubleProtein, atLimit, onCardClick }) {
  const [imgError, setImgError] = useState(false);
  const cat = CATEGORY_STYLES[meal.category] || CATEGORY_STYLES.LIFESTYLE;
  const badge = meal.badge ? BADGE_STYLES[meal.badge] : null;

  return (
    // Outer wrapper: no overflow-hidden so ribbon can stick out above
    <div className="relative mt-4">
      {/* ── Banner ribbon draped over top of card ── */}
      {badge && (
        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-3.5 py-1 rounded-b-xl text-[10px] font-bold tracking-wide shadow-md whitespace-nowrap ${badge.cls}`}>
          <span>{badge.icon}</span>
          {meal.badge}
        </div>
      )}

      {/* ── Card — clicking opens detail modal ── */}
      <div
        onClick={onCardClick}
        className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col cursor-pointer"
      >

        {/* Card body */}
        <div className="flex items-center gap-3 px-3 pt-3 pb-2">
          {/* Circular plate image */}
          <CircularImage
            src={meal.image}
            alt={meal.name}
            hasError={imgError}
            onError={() => setImgError(true)}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Row 1: category + qty control */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className={`text-[10px] font-bold tracking-widest uppercase ${cat.text} leading-tight pt-1`}>
                {cat.label}
              </p>
              <QtyControl
                qty={qty}
                onAdd={() => onAdd(meal.id)}
                onRemove={() => onRemove(meal.id)}
                atLimit={atLimit}
              />
            </div>

            {/* Meal name */}
            <h3 className="font-display text-[14px] sm:text-[15px] font-semibold text-gray-900 leading-snug mb-1.5">
              {meal.name}
            </h3>

            {/* Description — 1 line */}
            <p className="text-gray-400 text-[11px] leading-snug line-clamp-1 mb-1.5">
              {meal.description}
            </p>

            {/* Dietary pills */}
            <div className="flex flex-wrap gap-1 mb-1.5">
              {meal.dietary.map((d) => {
                const info = DIETARY[d] || { icon: '✓', label: d, cls: 'bg-gray-100 text-gray-600 border border-gray-200' };
                return (
                  <span
                    key={d}
                    title={d}
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${info.cls}`}
                  >
                    <span className="text-[11px]">{info.icon}</span>
                    {info.label}
                  </span>
                );
              })}
            </div>

            {/* Double Protein toggle */}
            {meal.doubleProtein && (
              <button
                onClick={e => { e.stopPropagation(); onDoubleProteinToggle(meal.id); }}
                className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                  doubleProtein
                    ? 'border-brand-green bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                }`}
              >
                <span className={`w-3 h-3 rounded-full border flex items-center justify-center text-[7px] flex-shrink-0 ${
                  doubleProtein ? 'bg-brand-green border-brand-green text-white' : 'border-gray-300'
                }`}>
                  {doubleProtein ? '✓' : ''}
                </span>
                2× Protein +${meal.doubleProteinPrice?.toFixed(2)}
              </button>
            )}
          </div>
        </div>

        {/* Macro bar */}
        <div className="bg-brand-charcoal px-4 py-2.5 flex items-center justify-center gap-5 mt-auto">
          <MacroStat value={meal.protein + (doubleProtein ? Math.round(meal.protein * 0.9) : 0)} unit="g" label="Protein" />
          <div className="w-px h-4 bg-gray-600" />
          <MacroStat value={meal.calories} unit="" label="Cal" />
          <div className="w-px h-4 bg-gray-600" />
          <MacroStat value={meal.carbs} unit="g" label="Carbs" />
        </div>
      </div>
    </div>
  );
}

function MacroStat({ value, unit, label }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="text-white text-xs font-bold">{value}{unit}</span>
      <span className="text-gray-500 text-[10px]">{label}</span>
    </div>
  );
}
