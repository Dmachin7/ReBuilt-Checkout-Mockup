import { useState } from 'react';

const CATEGORY_STYLES = {
  LIFESTYLE:     { text: 'text-green-600',  label: 'Lifestyle' },
  KETO:          { text: 'text-pink-600',   label: 'Keto' },
  PERFORMANCE:   { text: 'text-blue-600',   label: 'Performance' },
  'PLANT-BASED': { text: 'text-orange-500', label: 'Plant-Based' },
};

const BADGE_STYLES = {
  'Best Seller': { cls: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' },
  'Going Fast':  { cls: 'bg-gradient-to-r from-rose-500 to-red-500 text-white' },
  'New':         { cls: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white' },
};

const DIETARY = {
  'Gluten Free': { icon: '🌾', label: 'GF',    cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  'Soy Free':    { icon: '🫘', label: 'SF',    cls: 'bg-violet-50 text-violet-700 border border-violet-200' },
  'Dairy Free':  { icon: '🥛', label: 'DF',    cls: 'bg-sky-50 text-sky-700 border border-sky-200' },
  'Vegan':       { icon: '🌿', label: 'Vegan', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

function PortionBtn({ label, extraPrice, qty, onAdd, onRemove, atLimit, isDouble, stretch = true }) {
  const stop = e => e.stopPropagation();
  const dotCls = isDouble ? 'bg-brand-green text-white' : 'bg-brand-charcoal text-white';
  const widthCls = stretch ? 'flex-1' : '';

  if (qty === 0) {
    return (
      <button
        onClick={e => { stop(e); if (!atLimit) onAdd(); }}
        disabled={atLimit}
        className={`${widthCls} flex items-center justify-between px-2.5 py-0.5 rounded-full border text-[10px] font-semibold transition-colors ${
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

  return (
    <div
      className={`${widthCls} flex items-center justify-between px-2.5 py-0.5 rounded-full border border-gray-200 bg-white`}
      onClick={stop}
    >
      <span className="text-[9px] text-gray-400 font-medium leading-none">✓ {label}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={e => { stop(e); onRemove(); }}
          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${dotCls} hover:opacity-80`}
        >
          −
        </button>
        <span className="text-[11px] font-bold text-gray-700 min-w-[12px] text-center">
          {qty}
        </span>
        <button
          onClick={e => { stop(e); if (!atLimit) onAdd(); }}
          disabled={atLimit}
          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${
            atLimit ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : `${dotCls} hover:opacity-80`
          }`}
        >
          +
        </button>
      </div>
    </div>
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
  singleLabel = 'Single',
}) {
  const [imgError, setImgError] = useState(false);
  const cat = CATEGORY_STYLES[meal.category] || CATEGORY_STYLES.LIFESTYLE;
  const badge = meal.badge ? BADGE_STYLES[meal.badge] : null;
  const badgeWords = meal.badge ? meal.badge.split(' ') : [];

  return (
    <div
      onClick={onCardClick}
      className="relative ml-14 sm:ml-20 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full cursor-pointer"
    >
      {/* Diagonal corner ribbon — centered exactly on the box's corner point so it touches flush with no gap */}
      {badge && (
        <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 overflow-hidden rounded-tr-2xl z-20 pointer-events-none">
          <div
            className={`absolute left-[15px] top-[-14px] sm:left-[18px] sm:top-[-16px] w-[130px] sm:w-[155px] h-7 sm:h-8 flex flex-col items-center justify-center shadow-md transform rotate-45 ${badge.cls}`}
          >
            {badgeWords.map((w, i) => (
              <div key={i} className="text-[7px] sm:text-[8.5px] font-extrabold tracking-wider leading-[9px] sm:leading-[11px] uppercase">
                {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header zone — the plate centers vertically against this block, not the macro bar */}
      <div className="relative flex-1 flex flex-col">
        {/* Plate/photo — big circle, bleeds off the card's left edge, vertically centered */}
        <div className="absolute -left-14 sm:-left-20 top-1/2 -translate-y-1/2 w-28 h-28 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-lg bg-white z-10">
          {meal.image && !imgError ? (
            <img
              src={meal.image}
              alt={meal.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-2xl">📸</span>
            </div>
          )}
        </div>

        <div className="pl-16 sm:pl-24 pr-8 pt-3 flex-1 flex flex-col">
          <p className={`text-[10px] font-bold tracking-widest uppercase ${cat.text} leading-tight mb-0.5`}>
            {cat.label}
          </p>

          <h3 className="text-[13px] sm:text-[14px] font-semibold text-gray-900 leading-snug mb-1">
            {meal.name}
          </h3>

          <p className="text-gray-400 text-[10px] leading-snug line-clamp-2">
            {meal.description}
          </p>

          <div className="flex flex-wrap gap-1 mt-auto pt-1.5">
            {meal.dietary.map((d) => {
              const info = DIETARY[d] || { icon: '✓', label: d, cls: 'bg-gray-100 text-gray-600 border border-gray-200' };
              return (
                <span
                  key={d}
                  title={d}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${info.cls}`}
                >
                  <span className="text-[10px]">{info.icon}</span>
                  {info.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className={`flex gap-2 pl-16 sm:pl-24 pr-3 pb-2 pt-1.5 ${!meal.doubleProtein ? 'justify-end' : ''}`}>
          <PortionBtn
            label={singleLabel}
            qty={singleQty}
            onAdd={() => onAddSingle(meal.id)}
            onRemove={() => onRemoveSingle(meal.id)}
            atLimit={atLimit}
            stretch={!!meal.doubleProtein}
          />
          {meal.doubleProtein && (
            <PortionBtn
              label="Double Protein"
              extraPrice={meal.doubleProteinPrice}
              qty={doubleQty}
              onAdd={() => onAddDouble(meal.id)}
              onRemove={() => onRemoveDouble(meal.id)}
              atLimit={atLimit}
              isDouble
            />
          )}
        </div>
      </div>

      {/* Macro bar */}
      <div className="bg-brand-green rounded-b-2xl px-4 py-1 flex items-center justify-center gap-5">
        <MacroStat value={meal.protein} unit="g" label="Protein" />
        <div className="w-px h-4 bg-green-300" />
        <MacroStat value={meal.calories} unit="" label="Cal" />
        <div className="w-px h-4 bg-green-300" />
        <MacroStat value={meal.carbs} unit="g" label="Carbs" />
      </div>
    </div>
  );
}

function MacroStat({ value, unit, label }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="text-white text-xs sm:text-sm font-bold">{value}{unit}</span>
      <span className="text-green-100 text-[10px]">{label}</span>
    </div>
  );
}
