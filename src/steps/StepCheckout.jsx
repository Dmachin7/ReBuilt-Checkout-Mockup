import { useState } from 'react';
import { MEALS_WEEK1, MEALS_WEEK2, BREAKFAST_ITEMS, SNACK_ITEMS, PICKUP_LOCATIONS } from '../data/meals';

const ALL_MEALS = [...MEALS_WEEK1, ...MEALS_WEEK2, ...BREAKFAST_ITEMS, ...SNACK_ITEMS];

export default function StepCheckout({ cart, doubleProteins, onBack, onConfirm }) {
  const [deliveryMode, setDeliveryMode] = useState('pickup');
  const [selectedLocation, setSelectedLocation] = useState(PICKUP_LOCATIONS[0].id);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [cardNum, setCardNum]     = useState('');
  const [cardExp, setCardExp]     = useState('');
  const [cardCVC, setCardCVC]     = useState('');

  const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);

  const subtotal = cartEntries.reduce((sum, [id, qty]) => {
    const meal = ALL_MEALS.find(m => m.id === Number(id));
    if (!meal) return sum;
    const dp = doubleProteins[Number(id)] && meal.doubleProtein ? meal.doubleProteinPrice : 0;
    return sum + (meal.basePrice + dp) * qty;
  }, 0);

  const shipping = deliveryMode === 'delivery' ? 9.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const location = PICKUP_LOCATIONS.find(l => l.id === selectedLocation);

  function handleSubmit(e) {
    e.preventDefault();
    onConfirm({ total, deliveryMode, location });
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto w-full pb-10">
      <h2 className="font-display text-2xl sm:text-3xl text-gray-900 mb-6">Checkout</h2>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Left — form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-5">

          {/* Subscription clarity */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex gap-3">
              <span className="text-xl flex-shrink-0">📋</span>
              <div>
                <p className="font-semibold text-amber-900 text-sm mb-1">Weekly subscription — pause or cancel anytime</p>
                <p className="text-amber-800 text-xs leading-relaxed">
                  Your card will be charged <strong>${total.toFixed(2)}</strong> now for this week's meals. After that, you'll be charged the same each week unless you skip or cancel. <strong>Skip deadline: every Thursday at 11:59 PM.</strong> No hidden fees.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900">Contact Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">First name</label>
                <input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Alex"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Last name</label>
                <input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Johnson"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="alex@example.com"
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
          </div>

          {/* Delivery / Pickup */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">How do you want your meals?</h3>

            <div className="flex gap-2 mb-4">
              {['pickup', 'delivery'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDeliveryMode(mode)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    deliveryMode === mode
                      ? 'border-brand-green bg-green-50 text-green-800'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {mode === 'pickup' ? '📍 Pickup (Free)' : '🚚 Home Delivery (+$9.99)'}
                </button>
              ))}
            </div>

            {deliveryMode === 'pickup' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    className="text-xs text-brand-green font-medium hover:underline flex items-center gap-1"
                  >
                    📍 Use my location
                  </button>
                  <span className="text-gray-300 text-xs">|</span>
                  <span className="text-xs text-gray-400">Sorted nearest first</span>
                </div>
                {PICKUP_LOCATIONS.map(loc => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelectedLocation(loc.id)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      selectedLocation === loc.id
                        ? 'border-brand-green bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{loc.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{loc.address}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-brand-green">{loc.distance} mi</p>
                        <p className="text-xs text-gray-500">{loc.pickupDay}</p>
                        <p className="text-xs text-gray-400">{loc.pickupWindow}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {deliveryMode === 'delivery' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Street address</label>
                  <input
                    placeholder="123 Main St"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 block mb-1">City</label>
                    <input
                      placeholder="Atlanta"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">ZIP</label>
                    <input
                      placeholder="30309"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Payment</h3>

            <div className="flex gap-2 mb-4">
              {['apple_pay', 'card'].map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    paymentMethod === method
                      ? 'border-brand-green bg-green-50 text-green-800'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {method === 'apple_pay' ? '🍎 Apple Pay' : '💳 Credit Card'}
                </button>
              ))}
            </div>

            {paymentMethod === 'apple_pay' && (
              <div className="bg-black rounded-xl py-3 text-center">
                <span className="text-white text-sm font-semibold">Pay with  Pay</span>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Card number</label>
                  <input
                    value={cardNum}
                    onChange={e => setCardNum(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Expiry</label>
                    <input
                      value={cardExp}
                      onChange={e => setCardExp(e.target.value)}
                      placeholder="MM / YY"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">CVC</label>
                    <input
                      value={cardCVC}
                      onChange={e => setCardCVC(e.target.value)}
                      placeholder="123"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="space-y-3">
            <button
              type="submit"
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-xl text-base transition-colors shadow-sm"
            >
              Place Order · ${total.toFixed(2)} / week
            </button>
            <p className="text-center text-xs text-gray-400">
              128-bit SSL encrypted · Cancel or skip before Thursday 11:59 PM
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="w-full text-gray-500 hover:text-gray-700 font-medium text-sm py-2 transition-colors"
          >
            ← Back to Allergies
          </button>
        </form>

        {/* Right — order summary */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0">
          <div className="sticky top-36 bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-brand-charcoal px-5 py-4">
              <h3 className="font-display text-white text-lg">Order Summary</h3>
            </div>

            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {cartEntries.map(([id, qty]) => {
                const meal = ALL_MEALS.find(m => m.id === Number(id));
                if (!meal) return null;
                const dp = doubleProteins[Number(id)] && meal.doubleProtein;
                const price = (meal.basePrice + (dp ? meal.doubleProteinPrice : 0)) * qty;
                return (
                  <div key={id} className="px-4 py-3 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {qty}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{meal.name}</p>
                      {dp && <p className="text-[11px] text-green-600">+ Double Protein</p>}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">${price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'Free (pickup)' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Weekly total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-gray-400 text-center pt-1">
                Charged every week · Skip by Thursday 11:59 PM
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
