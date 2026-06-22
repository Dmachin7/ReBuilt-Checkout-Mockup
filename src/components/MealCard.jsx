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

function PortionBtn({ label, extraPrice, qty, onAdd, onRemove, atLimit, isDouble }) {
  const stop = e => e.stopPropagation();
  const dotCls = isDouble ? 'bg-brand-green text-white' : 'bg-brand-charcoal text-white';

  if (qty === 0) {
    return (
      <button
        onClick={e => { stop(e); if (!atLimit) onAdd(); }}
        disabled={atLimit}
        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-colors ${
          atLimit
            ? 'border-gray-200 text-gray-300 bg-white cursor-not-allowed'
            : isDouble
            ? 'border-brand-green text-brand-green bg-white hover:bg-green-50'
            : 'border-gray-300 text-gray-600 bg-white hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <span>+ {label}</span>
        {extraPrice != null && (
          <span className={atLimit ? 'text-gray-300' : isDouble ? 'text-brand-green opacity-70' : 'text-gray-400'}>
            +${extraPrice.toFixed(2)}
          </span>
        )}
      </button>
    );
  }

  // Active: label on the left, [−][qty][+] locked to the right — full width, never overflows
  return (
    <div
      className="w-full flex items-center justify-between px-3 py-1.5 rounded-full border border-gray-200 bg-white"
      onClick={stop}
    >
      <span className="text-[10px] text-gray-400 font-medium leading-none">✓ {label}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={e => { stop(e); onRemove(); }}
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${dotCls} hover:opacity-80`}
        >
          −
        </button>
        <span className="text-[11px] font-bold text-gray-700 min-w-[12px] text-center">
          {qty}
        </span>
        <button
          onClick={e => { stop(e); if (!atLimit) onAdd(); }}
          disabled={atLimit}
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            atLimit ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : `${dotCls} hover:opacity-80`
          }`}
        >
          +
        </button>
      </div>
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

export default function MealCard({
  meal,
  singleQty = 0,
  doubleQty = 0,
  onAddSingle,
  onRemoveSingle,
  onAddDouble,
  onRemoveDouble,
  atLimit,
  onCardClick,
}) {
  const [imgError, setImgError] = useState(false);
  const cat = CATEGORY_STYLES[meal.category] || CATEGORY_STYLES.LIFESTYLE;
  const badge = meal.badge ? BADGE_STYLES[meal.badge] : null;

  const singleAtLimit = atLimit && singleQty === 0;
  const doubleAtLimit = atLimit && doubleQty === 0;

  return (
    <div className="relative mt-4">
      {badge && (
        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-3.5 py-1 rounded-b-xl text-[10px] font-bold tracking-wide shadow-md whitespace-nowrap ${badge.cls}`}>
          <span>{badge.icon}</span>
          {meal.badge}
        </div>
      )}

      <div
        onClick={onCardClick}
        className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col cursor-pointer"
      >
        <div className="flex items-start gap-3 px-3 pt-3 pb-2">
          <CircularImage
            src={meal.image}
            alt={meal.name}
            hasError={imgError}
            onError={() => setImgError(true)}
          />

          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-bold tracking-widest uppercase ${cat.text} leading-tight mb-1`}>
              {cat.label}
            </p>

            <h3 className="font-display text-[14px] sm:text-[15px] font-semibold text-gray-900 leading-snug mb-1">
              {meal.name}
            </h3>

            <p className="text-gray-400 text-[11px] leading-snug line-clamp-1 mb-1.5">
              {meal.description}
            </p>

            <div className="flex flex-wrap gap-1 mb-2.5">
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

            {/* Add buttons */}
            <div className="flex flex-col gap-1">
              <PortionBtn
                label="Single"
                qty={singleQty}
                onAdd={() => onAddSingle(meal.id)}
                onRemove={() => onRemoveSingle(meal.id)}
                atLimit={singleAtLimit}
              />
              {meal.doubleProtein && (
                <PortionBtn
                  label="2× Protein"
                  extraPrice={meal.doubleProteinPrice}
                  qty={doubleQty}
                  onAdd={() => onAddDouble(meal.id)}
                  onRemove={() => onRemoveDouble(meal.id)}
                  atLimit={doubleAtLimit}
                  isDouble
                />
              )}
            </div>
          </div>
        </div>

        {/* Macro bar */}
        <div className="bg-brand-charcoal px-4 py-2.5 flex items-center justify-center gap-5 mt-auto">
          <MacroStat value={meal.protein} unit="g" label="Protein" />
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
