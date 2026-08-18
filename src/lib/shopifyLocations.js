import { shopifyGraphQL } from './shopifyClient';

// Real partner-gym pickup network (confirmed live 2026-08-18: 30 locations,
// no pagination needed -- the Storefront API's `locations` query returns
// every location on the shop regardless of local-pickup/inventory setup,
// which happens to be exactly this store's pickup network since it has no
// other locations). Address only -- Shopify doesn't expose a pickup
// day/window per location, which is fine here since ReBuilt's pickup day is
// fixed (every Monday) rather than per-location.
const LOCATIONS_QUERY = `query Locations($first: Int!) {
  locations(first: $first) {
    edges {
      node {
        id
        name
        address { address1 address2 city province zip latitude longitude }
      }
    }
  }
}`;

export async function fetchPickupLocations() {
  const data = await shopifyGraphQL(LOCATIONS_QUERY, { first: 50 });
  return data.locations.edges.map(({ node }) => ({
    id: node.id,
    name: node.name,
    address1: node.address.address1,
    address2: node.address.address2 || '',
    city: node.address.city,
    province: node.address.province,
    zip: node.address.zip,
    latitude: node.address.latitude,
    longitude: node.address.longitude,
  }));
}
