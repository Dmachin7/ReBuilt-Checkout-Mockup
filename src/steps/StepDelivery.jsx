import { useEffect, useMemo, useState } from 'react';
import { useShopifyLocations } from '../hooks/useShopifyLocations';
import { geocodeZip, haversineMiles } from '../lib/geocode';

const SHIP_COST = 20;
const ZIP_RE = /^\d{5}$/;

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function StepDelivery({
  deliveryMode, setDeliveryMode,
  pickupLocationId, setPickupLocationId,
  customerEmail, setCustomerEmail,
  onNext, onBack,
}) {
  const { loading, error, locations } = useShopifyLocations();
  const [locationFilter, setLocationFilter] = useState('');

  // A 5-digit ZIP gets geocoded to real coordinates (Zippopotam -- see
  // lib/geocode.js) and every location gets sorted by actual distance from
  // it, same as typing a ZIP into Shopify's own pickup picker. Anything
  // else (a name, city, partial address) falls back to a plain substring
  // match -- there's no free CORS-enabled full-address geocoder this
  // client-only app can call directly (confirmed against the Census
  // geocoder and Nominatim, both CORS-blocked from a browser).
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | searching | found | notfound
  const [origin, setOrigin] = useState(null); // { lat, lng } | null

  useEffect(() => {
    const zip = locationFilter.trim();
    if (!ZIP_RE.test(zip)) {
      setGeoStatus('idle');
      setOrigin(null);
      return undefined;
    }
    setGeoStatus('searching');
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const coords = await geocodeZip(zip);
        if (cancelled) return;
        if (coords) { setOrigin(coords); setGeoStatus('found'); }
        else { setOrigin(null); setGeoStatus('notfound'); }
      } catch {
        if (!cancelled) { setOrigin(null); setGeoStatus('notfound'); }
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [locationFilter]);

  const displayLocations = useMemo(() => {
    if (origin) {
      return locations
        .filter(loc => loc.latitude != null && loc.longitude != null)
        .map(loc => ({ ...loc, distanceMiles: haversineMiles(origin.lat, origin.lng, loc.latitude, loc.longitude) }))
        .sort((a, b) => a.distanceMiles - b.distanceMiles);
    }
    const q = locationFilter.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter(loc =>
      loc.name.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      loc.zip.includes(q)
    );
  }, [locations, locationFilter, origin]);

  function chooseMode(mode) {
    setDeliveryMode(mode);
    if (mode === 'ship') setPickupLocationId(null);
  }

  const canContinue = isValidEmail(customerEmail) &&
    (deliveryMode === 'ship' || (deliveryMode === 'pickup' && pickupLocationId));

  return (
    <div className="px-4 sm:px-6 py-8 max-w-2xl mx-auto w-full pb-32 sm:pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="sm:hidden w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          ←
        </button>
        <div>
          <h2 className="font-display text-2xl sm:text-3xl text-gray-900 mb-1">How do you want your meals?</h2>
          <p className="text-gray-500 text-sm">Free pickup at one of our partner locations, or we'll ship to your door.</p>
        </div>
      </div>

      {/* Ship vs Pickup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
        <button
          onClick={() => chooseMode('ship')}
          className={`text-left p-4 sm:p-5 rounded-2xl border-2 transition-all ${
            deliveryMode === 'ship' ? 'border-brand-green bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl">🚚</span>
            {deliveryMode === 'ship' && <span className="text-brand-green font-bold text-lg">✓</span>}
          </div>
          <p className="font-bold text-gray-900 text-base">Ship to my door</p>
          <p className="text-gray-500 text-xs mt-0.5">Delivered via UPS or FedEx — ${SHIP_COST.toFixed(2)}/week</p>
          {deliveryMode === 'ship' && (
            <p className="text-gray-400 text-[11px] mt-2 italic">Your shipping address will be requested at checkout, right after this.</p>
          )}
        </button>

        <button
          onClick={() => chooseMode('pickup')}
          className={`text-left p-4 sm:p-5 rounded-2xl border-2 transition-all ${
            deliveryMode === 'pickup' ? 'border-brand-green bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl">📍</span>
            {deliveryMode === 'pickup' && <span className="text-brand-green font-bold text-lg">✓</span>}
          </div>
          <p className="font-bold text-gray-900 text-base">Pick up at a location</p>
          <p className="text-gray-500 text-xs mt-0.5">Free — grab your meals from a partner fridge every Monday</p>
        </button>
      </div>

      {/* Location picker */}
      {deliveryMode === 'pickup' && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-2">Choose a pickup location</p>
          <input
            type="text"
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            placeholder="Enter your ZIP to find the closest, or search by name"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
          {geoStatus === 'searching' && <p className="text-gray-400 text-xs mt-1.5">Finding locations near {locationFilter.trim()}…</p>}
          {geoStatus === 'notfound' && <p className="text-gray-400 text-xs mt-1.5">Couldn't find that ZIP — showing all locations instead.</p>}
          {geoStatus === 'found' && <p className="text-brand-green text-xs mt-1.5 font-medium">Sorted by distance from {locationFilter.trim()}</p>}

          {loading && <p className="text-gray-400 text-sm py-4 text-center">Loading pickup locations…</p>}
          {error && <p className="text-red-500 text-sm py-2">Couldn't load pickup locations right now. Try again shortly.</p>}

          {!loading && !error && (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 mt-3">
              {displayLocations.length === 0 && (
                <p className="text-gray-400 text-sm py-4 text-center">No locations match that search.</p>
              )}
              {displayLocations.map(loc => {
                const selected = pickupLocationId === loc.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => setPickupLocationId(loc.id)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      selected ? 'border-brand-green bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {loc.name}
                          {loc.distanceMiles != null && (
                            <span className="text-gray-400 font-normal"> ({loc.distanceMiles.toFixed(1)} mi)</span>
                          )}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {loc.address1}{loc.address2 ? `, ${loc.address2}` : ''}, {loc.city}, {loc.province} {loc.zip}
                        </p>
                      </div>
                      {selected && <span className="text-brand-green font-bold text-lg flex-shrink-0">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Email */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <p className="text-sm font-semibold text-gray-900 mb-2">Your email</p>
        <input
          type="email"
          value={customerEmail}
          onChange={e => setCustomerEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green"
        />
      </div>

      {/* Desktop: Back + Continue */}
      <div className="hidden sm:flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="flex-[2] bg-brand-green hover:bg-brand-green-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          Continue to Order Summary
          <span className="text-xl">→</span>
        </button>
      </div>

      {/* Mobile: sticky CTA bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-20 p-4 bg-white border-t border-gray-100 shadow-lg">
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="w-full bg-brand-green hover:bg-brand-green-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          Continue to Order Summary
          <span className="text-xl">→</span>
        </button>
      </div>
    </div>
  );
}
