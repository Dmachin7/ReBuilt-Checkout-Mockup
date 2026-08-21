import { useState, useEffect } from 'react';
import { shopifyConfig } from '../config/shopify';
import { pickSnackVariant, previewDiscountCode } from '../lib/shopifyCheckout';
import { ALLERGY_OPTIONS } from '../data/meals';
import { rbStep } from '../lib/analytics';

const SHIP_COST = 20;

export default function StepCheckout({
  singles, doubles, mealCount, breakfastCount, weeks,
  breakfastItems: breakfastCatalog, snackItems: snackCatalog,
  discountCode, setDiscountCode,
  allergySelected, allergyNotes,
  deliveryMode,
  onBack, onConfirm,
}) {
  const [openSections, setOpenSections] = useState({ entrees: false, breakfast: false, snacks: false });

  const allEntreeMeals = weeks.flatMap(w => w.meals);
  const entreeIds = new Set(allEntreeMeals.map(m => m.id));
  const BREAKFAST_IDS = new Set(breakfastCatalog.map(m => m.id));
  const SNACK_IDS = new Set(snackCatalog.map(m => m.id));
  const allMeals = [...allEntreeMeals, ...breakfastCatalog, ...snackCatalog];

  function toggleSection(key) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // Entrées and breakfast are each priced as a flat box rate by total count
  // in production (shopifyConfig.entreesVariants/breakfastVariants) --
  // their line items below carry price:0 and are display-only. Snacks are
  // priced by matching to a shared Snacks/Doughnuts tier variant (see
  // pickSnackVariant) rather than their own basePrice, which is
  // unreliably $0 in the live catalog.
  function snackUnitPrice(meal) {
    return pickSnackVariant(meal).variant.price;
  }

  const cartItems = [];
  Object.entries(singles).forEach(([id, qty]) => {
    if (qty > 0) {
      const meal = allMeals.find(m => m.id === Number(id));
      if (!meal) return;
      const isBoxPriced = entreeIds.has(meal.id) || BREAKFAST_IDS.has(meal.id);
      const unitPrice = isBoxPriced ? 0 : (SNACK_IDS.has(meal.id) ? snackUnitPrice(meal) : meal.basePrice);
      cartItems.push({ meal, qty, isDouble: false, price: unitPrice * qty });
    }
  });
  Object.entries(doubles).forEach(([id, qty]) => {
    if (qty > 0) {
      const meal = allMeals.find(m => m.id === Number(id));
      if (!meal) return;
      const isBoxPriced = entreeIds.has(meal.id) || BREAKFAST_IDS.has(meal.id);
      const unitPrice = isBoxPriced ? 0 : (SNACK_IDS.has(meal.id) ? snackUnitPrice(meal) : meal.basePrice) + (meal.doubleProteinPrice || 0);
      cartItems.push({ meal, qty, isDouble: true, price: unitPrice * qty });
    }
  });

  const entreeItems    = cartItems.filter(item => entreeIds.has(item.meal.id));
  const breakfastItems = cartItems.filter(item => BREAKFAST_IDS.has(item.meal.id));
  const snackItems     = cartItems.filter(item => SNACK_IDS.has(item.meal.id));

  const entreeDoubleQty = entreeItems.filter(i => i.isDouble).reduce((sum, i) => sum + i.qty, 0);
  const entreeBoxPrice = mealCount && shopifyConfig.entreesVariants[mealCount]
    ? shopifyConfig.entreesVariants[mealCount].price
    : 0;
  const doubleProteinPrice = entreeDoubleQty * shopifyConfig.doubleProteinPerMeal;
  const breakfastBoxPrice = breakfastCount && shopifyConfig.breakfastVariants[breakfastCount]
    ? shopifyConfig.breakfastVariants[breakfastCount].price
    : 0;
  const snackSubtotal = snackItems.reduce((sum, i) => sum + i.price, 0);

  const subtotal = entreeBoxPrice + doubleProteinPrice + breakfastBoxPrice + snackSubtotal;

  // Live discount-code preview -- creates a real (anonymous) Shopify cart
  // mirroring this order's box-rate lines and asks Shopify itself what the
  // typed code actually does, rather than guessing client-side. Debounced
  // so we're not hitting the Storefront API on every keystroke.
  const [discountPreview, setDiscountPreview] = useState(null); // { applicable, savings } | null
  const [discountStatus, setDiscountStatus] = useState('idle'); // idle | checking | done | error

  const snackLines = snackItems.map(item => ({ meal: item.meal, quantity: item.qty }));
  const cartKey = JSON.stringify([
    mealCount, entreeDoubleQty, breakfastCount,
    snackLines.map(l => [l.meal.id, l.quantity]).sort(),
  ]);

  useEffect(() => {
    const trimmed = (discountCode || '').trim();
    if (!trimmed) {
      setDiscountPreview(null);
      setDiscountStatus('idle');
      return undefined;
    }
    setDiscountStatus('checking');
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await previewDiscountCode({
          mealCount, doubleProteinQty: entreeDoubleQty, breakfastCount, snackLines, discountCode: trimmed,
        });
        if (cancelled) return;
        setDiscountPreview(result);
        setDiscountStatus('done');
      } catch {
        if (cancelled) return;
        setDiscountPreview(null);
        setDiscountStatus('error');
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountCode, cartKey]);

  const discountSavings = discountPreview && discountPreview.applicable ? discountPreview.savings : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountSavings);
  const tax = discountedSubtotal * 0.075;
  const deliveryCost = deliveryMode === 'pickup' ? 0 : SHIP_COST;
  const total = discountedSubtotal + tax + deliveryCost;

  // Fires once per arrival at Order Summary, with the total as first
  // computed -- not re-fired as the live discount preview later updates it.
  useEffect(() => {
    rbStep('rb_review_reached', { value: total, meal_count: mealCount });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allergyLabels = [...(allergySelected || [])]
    .filter(id => id !== 'none')
    .map(id => ALLERGY_OPTIONS.find(o => o.id === id)?.label)
    .filter(Boolean);
  const allergiesDisplay = allergyLabels.length ? allergyLabels.join(', ') : 'No Allergies';

  function handleCheckout() {
    rbStep('rb_checkout_clicked', { value: total, meal_count: mealCount });
    onConfirm({ total });
  }

  function ItemSection({ title, items, sectionKey }) {
    if (items.length === 0) return null;
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
    const isOpen = openSections[sectionKey];
    return (
      <div className="border-b border-gray-100 last:border-0">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{totalQty} item{totalQty !== 1 ? 's' : ''} selected</p>
          </div>
          <span className="text-xs text-brand-green font-semibold flex-shrink-0 ml-3">
            {isOpen ? 'Hide ▲' : 'View selections ▼'}
          </span>
        </button>
        {isOpen && (
          <div className="border-t border-gray-50">
            {items.map((item, i) => (
              <div key={`${item.meal.id}-${item.isDouble}-${i}`} className="px-5 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
                {item.meal.image ? (
                  <img
                    src={item.meal.image}
                    alt={item.meal.name}
                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📸</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.meal.name}</p>
                  <p className="text-xs text-gray-500">{item.isDouble ? 'Double Protein' : 'Single Protein'} · qty {item.qty}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-2xl mx-auto w-full pb-32 sm:pb-10">
      {/* Header with back button (mobile only — desktop has Back/Continue under the summary) */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="sm:hidden w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          ←
        </button>
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-gray-900">Order Summary</h2>
          <p className="text-gray-500 text-sm">Review your selection before checkout.</p>
        </div>
      </div>

      {/* Subscription clarity */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
        <div className="flex gap-3">
          <span className="text-xl flex-shrink-0">📋</span>
          <div>
            <p className="font-semibold text-amber-900 text-sm mb-1">Weekly subscription — pause or cancel anytime</p>
            <p className="text-amber-800 text-xs leading-relaxed">
              <strong>Deadline for making changes to an upcoming week is each Tuesday 11:59pm.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Item list with per-section collapse */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        <div className="bg-brand-charcoal px-5 py-4">
          <h3 className="font-display text-white text-lg">Your Meals</h3>
        </div>

        {cartItems.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            <div className="text-4xl mb-2">🛒</div>
            No items — go back and add some meals!
          </div>
        ) : (
          <>
            <ItemSection title="Entrées"   items={entreeItems}    sectionKey="entrees" />
            <ItemSection title="Breakfast" items={breakfastItems} sectionKey="breakfast" />
            <ItemSection title="Sweet Treats" items={snackItems}  sectionKey="snacks" />
          </>
        )}

        {/* Always-visible totals */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          {discountSavings > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-semibold">
              <span>Discount ({discountCode.trim()})</span><span>-${discountSavings.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery ({deliveryMode === 'pickup' ? 'Pickup' : 'Ship'})</span>
            {deliveryMode === 'pickup' ? (
              <span className="text-green-600 font-medium">Free</span>
            ) : (
              <span>${deliveryCost.toFixed(2)}</span>
            )}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Est. Tax (7.5%)</span><span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Weekly total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Allergies */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <p className="text-sm font-semibold text-gray-900 mb-1.5">Allergies & Dietary Notes</p>
        <p className="text-sm text-gray-700">{allergiesDisplay}</p>
        {allergyNotes && allergyNotes.trim() && (
          <p className="text-xs text-gray-500 mt-1.5">{allergyNotes.trim()}</p>
        )}
      </div>

      {/* Discount code — previewed live against a real Shopify cart as you
          type (see previewDiscountCode), then actually applied through
          checkout's own discount endpoint at handoff. */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <p className="text-sm font-semibold text-gray-900 mb-2">Discount Code</p>
        <input
          type="text"
          value={discountCode}
          onChange={e => setDiscountCode(e.target.value)}
          placeholder="Enter a discount code (optional)"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green"
        />
        {discountStatus === 'checking' && (
          <p className="text-gray-400 text-xs mt-1.5">Checking code…</p>
        )}
        {discountStatus === 'done' && discountPreview && discountPreview.applicable && (
          <p className="text-green-600 text-xs mt-1.5 font-semibold">🎉 Code applied — saves ${discountPreview.savings.toFixed(2)}</p>
        )}
        {discountStatus === 'done' && discountPreview && !discountPreview.applicable && (
          <p className="text-red-500 text-xs mt-1.5">This code isn't valid or doesn't apply to your order.</p>
        )}
        {discountStatus === 'error' && (
          <p className="text-gray-400 text-xs mt-1.5">Couldn't check this code right now — it'll still be validated at checkout.</p>
        )}
        {discountStatus === 'idle' && (
          <p className="text-gray-400 text-xs mt-1.5">We'll check this code as you type.</p>
        )}
      </div>

      {/* Desktop: Back + Continue live under the summary instead of a floating bar */}
      <div className="hidden sm:flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleCheckout}
          className="flex-[2] bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          Continue to Checkout
          <span className="text-xl">→</span>
        </button>
      </div>

      {/* Mobile: sticky CTA bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-20 p-4 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleCheckout}
            className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            Continue to Checkout
            <span className="text-xl">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
