export const PRODUCT_FIELDS = `
  id handle title description productType tags availableForSale
  featuredImage { url altText width height }
  images(first: 20) { nodes { url altText width height } }
  variants(first: 100) {
    nodes {
      id title availableForSale selectedOptions { name value }
      price { amount currencyCode }
      image { url altText width height }
    }
    pageInfo { hasNextPage endCursor }
  }
`;

export const CATALOG = `query Catalog($after: String) @inContext(country: CH, language: DE) {
  products(first: 100, after: $after) {
    nodes { ${PRODUCT_FIELDS} }
    pageInfo { hasNextPage endCursor }
  }
}`;

export const VARIANTS = `query Variants($id: ID!, $after: String) @inContext(country: CH, language: DE) {
  product(id: $id) {
    variants(first: 100, after: $after) {
      nodes {
        id title availableForSale selectedOptions { name value }
        price { amount currencyCode }
        image { url altText width height }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

export const CART_FIELDS = `fragment CartFields on Cart {
  id checkoutUrl totalQuantity note
  cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } }
  lines(first: 250) {
    nodes {
      id quantity cost { totalAmount { amount currencyCode } }
      merchandise {
        ... on ProductVariant {
          id title availableForSale price { amount currencyCode }
          image { url altText width height }
          product { title handle }
        }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;
export const CART = `query Cart($id: ID!) @inContext(country: CH, language: DE) {
  cart(id: $id) { ...CartFields }
} ${CART_FIELDS}`;
export const CREATE_CART = `mutation CreateCart($lines: [CartLineInput!], $note: String) @inContext(country: CH, language: DE) {
  cartCreate(input: { lines: $lines, note: $note, buyerIdentity: { countryCode: CH } }) {
    cart { ...CartFields }
    userErrors { field message code }
    warnings { code message target }
  }
} ${CART_FIELDS}`;
export const CART_NOTE_UPDATE = `mutation UpdateCartNote($cartId: ID!, $note: String!) @inContext(country: CH, language: DE) {
  cartNoteUpdate(cartId: $cartId, note: $note) {
    cart { ...CartFields }
    userErrors { field message code }
    warnings { code message target }
  }
} ${CART_FIELDS}`;
export const ADD_LINES = `mutation AddLines($cartId: ID!, $lines: [CartLineInput!]!) @inContext(country: CH, language: DE) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart { ...CartFields }
    userErrors { field message code }
    warnings { code message target }
  }
} ${CART_FIELDS}`;
export const UPDATE_LINES = `mutation UpdateLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) @inContext(country: CH, language: DE) {
  cartLinesUpdate(cartId: $cartId, lines: $lines) {
    cart { ...CartFields }
    userErrors { field message code }
    warnings { code message target }
  }
} ${CART_FIELDS}`;
export const REMOVE_LINES = `mutation RemoveLines($cartId: ID!, $lineIds: [ID!]!) @inContext(country: CH, language: DE) {
  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
    cart { ...CartFields }
    userErrors { field message code }
    warnings { code message target }
  }
} ${CART_FIELDS}`;
export const SHOP = `query Shop {
  shop {
    name description
    privacyPolicy { title body url }
    refundPolicy { title body url }
    termsOfService { title body url }
    shippingPolicy { title body url }
  }
}`;
