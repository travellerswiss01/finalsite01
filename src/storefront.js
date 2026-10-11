import * as queries from './queries.js';

export class StorefrontError extends Error {
  constructor(message, status = 502, details = []) { super(message); this.status = status; this.details = details; }
}
export function createStorefront({domain = process.env.SHOPIFY_STORE_DOMAIN || 'biottoslaedeli.myshopify.com', version = process.env.SHOPIFY_API_VERSION || '2026-10', token = process.env.SHOPIFY_STOREFRONT_TOKEN, fetchImpl = fetch, cacheMs = 30000} = {}) {
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(domain)) throw new Error('Ungültige Shopify-Domain.');
  if (!/^20\d{2}-(01|04|07|10)$/.test(version)) throw new Error('Ungültige API-Version.');
  const endpoint = `https://${domain}/api/${version}/graphql.json`;
  let cachedCatalog, expires = 0, pending;
  async function graphql(query, variables = {}) {
    let response;
    try {
      response = await fetchImpl(endpoint, {method:'POST', headers:{'Content-Type':'application/json', ...(token ? {'X-Shopify-Storefront-Access-Token':token} : {})}, body:JSON.stringify({query,variables}), signal:AbortSignal.timeout(15000)});
    } catch { throw new StorefrontError('Shopify ist momentan nicht erreichbar. Bitte versuche es später erneut.', 503); }
    let payload;
    try { payload = await response.json(); } catch { throw new StorefrontError('Shopify hat keine gültige Antwort geliefert.'); }
    if (!response.ok || payload.errors?.length || !payload.data) throw new StorefrontError('Die Verbindung zu Shopify konnte nicht abgeschlossen werden.', response.status === 429 ? 503 : 502);
    return payload.data;
  }
  async function loadCatalog() {
    const products = []; const productIds = new Set(); const cursors = new Set(); let after = null;
    do {
      const data = await graphql(queries.CATALOG, {after});
      const connection = data.products;
      for (const product of connection.nodes) {
        if (productIds.has(product.id)) continue;
        productIds.add(product.id);
        let variantAfter = product.variants.pageInfo.hasNextPage ? product.variants.pageInfo.endCursor : null;
        const variantCursors = new Set();
        while (variantAfter) {
          if (variantCursors.has(variantAfter)) throw new StorefrontError('Die Varianten konnten nicht vollständig geladen werden.');
          variantCursors.add(variantAfter);
          const next = await graphql(queries.VARIANTS,{id:product.id,after:variantAfter});
          if (!next.product) throw new StorefrontError('Ein Produkt wurde während des Ladens geändert. Bitte erneut laden.');
          product.variants.nodes.push(...next.product.variants.nodes);
          variantAfter = next.product.variants.pageInfo.hasNextPage ? next.product.variants.pageInfo.endCursor : null;
        }
        if (!product.variants.nodes.length) continue;
        products.push({...product,variants:product.variants.nodes,images:product.images.nodes});
      }
      after = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
      if (after && cursors.has(after)) throw new StorefrontError('Der Katalog konnte nicht vollständig geladen werden.');
      if (connection.pageInfo.hasNextPage && !after) throw new StorefrontError('Der Katalog konnte nicht vollständig geladen werden.');
      if (after) cursors.add(after);
    } while (after);
    return products;
  }
  async function catalog({fresh=false}={}) {
    if (!fresh && cachedCatalog && Date.now()<expires) return cachedCatalog;
    if (!pending) pending=loadCatalog().then(products=>{cachedCatalog=products;expires=Date.now()+cacheMs;return products;}).finally(()=>pending=null);
    return pending;
  }
  async function cart(id) {
    if (!id) return null;
    const data=await graphql(queries.CART,{id});return data.cart;
  }
  async function mutateCart(action, id, variables={}) {
    const operations={create:[queries.CREATE_CART,'cartCreate'],add:[queries.ADD_LINES,'cartLinesAdd'],update:[queries.UPDATE_LINES,'cartLinesUpdate'],remove:[queries.REMOVE_LINES,'cartLinesRemove']};
    const operation=operations[action];if(!operation)throw new StorefrontError('Ungültige Warenkorbaktion.',400);
    const data=await graphql(operation[0],{...(id?{cartId:id}:{}),...variables});const result=data[operation[1]];
    if (result.userErrors?.length) throw new StorefrontError(result.userErrors.map(e=>e.message).join(' '),422,result.userErrors);
    if (!result.cart) throw new StorefrontError('Der Warenkorb konnte nicht aktualisiert werden.');
    if(result.cart.lines.pageInfo.hasNextPage)throw new StorefrontError('Der Warenkorb enthält zu viele Positionen. Bitte verwende den Shopify-Checkout.',422);
    return {cart:result.cart,warnings:result.warnings||[]};
  }
  let cachedShop;
  async function shop() { if(!cachedShop)cachedShop=graphql(queries.SHOP).then(d=>d.shop).catch(()=>{cachedShop=null;return null;});return cachedShop; }
  return {domain,version,catalog,cart,mutateCart,shop};
}
