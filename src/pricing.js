export const hasPrice = variant => Number(variant?.price?.amount) > 0;
export const pricePending = product => !product.variants.some(hasPrice);
export const isPurchasable = variant => hasPrice(variant) && variant.availableForSale;
