// ZIP-to-coordinates lookup for "find the closest pickup location" search.
// Zippopotam.us is free, keyless, and (confirmed 2026-08-18) sends
// Access-Control-Allow-Origin: * -- it actually works from a browser fetch,
// unlike the Census geocoder and Nominatim, which both support full street
// addresses but send no CORS header at all (fine from curl, silently
// blocked from client-side JS). Without a backend to proxy through, this
// app can only offer real distance search for 5-digit ZIPs; free-text
// address/name search still works, just via plain substring match instead
// of distance (see StepDelivery.jsx).
export async function geocodeZip(zip) {
  const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
  if (!res.ok) return null;
  const data = await res.json();
  const place = data.places && data.places[0];
  if (!place) return null;
  return { lat: Number(place.latitude), lng: Number(place['longitude']) };
}

const EARTH_RADIUS_MILES = 3958.8;

export function haversineMiles(lat1, lng1, lat2, lng2) {
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
