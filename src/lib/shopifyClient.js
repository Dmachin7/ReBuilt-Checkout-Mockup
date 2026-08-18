import { shopifyConfig } from '../config/shopify';

// Shared Storefront API GraphQL caller -- the public storefront token is
// safe client-side by design (see config/shopify.js) and Shopify's GraphQL
// endpoint allows cross-origin requests for it, unlike the classic
// same-origin-only /cart/add.js Ajax API.
export async function shopifyGraphQL(query, variables) {
  const res = await fetch(
    `https://${shopifyConfig.storefrontApiHost}/api/${shopifyConfig.storefrontApiVersion}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': shopifyConfig.storefrontToken,
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map(e => e.message).join('; '));
  return json.data;
}
