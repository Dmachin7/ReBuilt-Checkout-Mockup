import { useState } from 'react';
import { MEALS_WEEK1, MEALS_WEEK2, BREAKFAST_ITEMS, SNACK_ITEMS } from '../data/meals';

const ALL_MEALS = [...MEALS_WEEK1, ...MEALS_WEEK2, ...BREAKFAST_ITEMS, ...SNACK_ITEMS];
const ENTREE_IDS = new Set([...MEALS_WEEK1, ...MEALS_WEEK2].map(m => m.id));
const BREAKFAST_IDS = new Set(BREAKFAST_ITEMS.map(m => m.id));
const SNACK_IDS = new Set(SNACK_ITEMS.map(m => m.id));

const MOCK_DISCOUNTS = {
  REBUILT10: 0.10,
  REBUILT20: 0.20,
  NEWMEMBER: 0.15,
};

export default function StepCheckout({ singles, doubles, onBack, onConfirm }) {
  const [openSections, setOpenSections] = useState({ entrees: false, breakfast: false, snacks: false });
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');

  function toggleSection(key) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const cartItems = [];
  Object.entries(singles).forEach(([id, qty]) => {
    if (qty > 0) {
      const meal = ALL_MEALS.find(m => m.id === Number(id));
      if (meal) cartItems.push({ meal, qty, isDouble: false, price: meal.basePrice * qty });
    }
  });
  Object.entries(doubles).forEach(([id, qty]) => {
    if (qty > 0) {
      const meal = ALL_MEALS.find(m => m.id === Number(id));
      if (meal) cartItems.push({ meal, qty, isDouble: true, price: (meal.basePrice + (meal.doubleProteinPrice || 0)) * qty });
    }
  });

  const entreeItems    = cartItems.filter(item => ENTREE_IDS.has(item.meal.id));
  const breakfastItems = cartItems.filter(item => BREAKFAST_IDS.has(item.meal.id));
  const snackItems     = cartItems.filter(item => SNACK_IDS.has(item.meal.id));

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const discountRate = appliedDiscount ? MOCK_DISCOUNTS[appliedDiscount] : 0;
  const discountAmount = subtotal * discountRate;
  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * 0.08;
  const total = discountedSubtotal + tax;

  function applyDiscount() {
    const code = discountCode.trim().toUpperCase();
    if (MOCK_DISCOUNTS[code]) {
      setAppliedDiscount(code);
      setDiscountError('');
    } else {
      setAppliedDiscount(null);
      setDiscountError('Invalid discount code. Try REBUILT10 or REBUILT20.');
    }
  }

  function handleCheckout() {
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
                  <p className="text-xs text-gray-500">{item.isDouble ? 'Double Protein' : 'Single'} · qty {item.qty}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-2xl mx-auto w-full pb-32">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
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
              You'll be charged <strong>${total.toFixed(2)}</strong> for this week's order. After that, the same amount each week until you skip or cancel.{' '}
              <strong>Skip deadline: Tuesday 11:59 PM.</strong>
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
            <ItemSection title="Snacks"    items={snackItems}     sectionKey="snacks" />
          </>
        )}

        {/* Always-visible totals */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          {appliedDiscount && (
            <div className="flex justify-between text-sm text-green-700 font-medium">
              <span>Discount ({appliedDiscount} −{Math.round(discountRate * 100)}%)</span>
              <span>−${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery</span>
            <span className="text-green-600 font-medium">Calculated at checkout</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Est. Tax (8%)</span><span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Weekly total</span><span>${total.toFixed(2)}</span>
          </div>
          <p className="text-[11px] text-gray-400 text-center pt-1">
            Recurring weekly via Recharge · Cancel anytime
          </p>
        </div>
      </div>

      {/* Discount code */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <p className="text-sm font-semibold text-gray-900 mb-2">Discount Code</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={e => setDiscountCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyDiscount()}
            placeholder="Enter code (e.g. REBUILT10)"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
          <button
            onClick={applyDiscount}
            className="bg-brand-charcoal hover:bg-gray-800 text-white font-semibold text-sm px-4 rounded-xl transition-colors"
          >
            Apply
          </button>
        </div>
        {discountError && <p className="text-red-500 text-xs mt-1.5">{discountError}</p>}
        {appliedDiscount && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-green-600 text-xs font-semibold">✓ {appliedDiscount} applied — {Math.round(discountRate * 100)}% off</span>
            <button onClick={() => { setAppliedDiscount(null); setDiscountCode(''); }} className="text-gray-400 text-xs hover:text-gray-600">Remove</button>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-20 p-4 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleCheckout}
            className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            Continue to Checkout
            <span className="text-xl">→</span>
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            128-bit SSL encrypted · Powered by Shopify
          </p>
        </div>
      </div>
    </div>
  );
}
