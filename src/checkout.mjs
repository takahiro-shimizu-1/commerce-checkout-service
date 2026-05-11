export const CATALOG_PRODUCT_CONTRACT = 'catalog-product-v1';
export const CART_CHECKOUT_CONTRACT = 'cart-checkout-v1';

export function priceOrder(checkoutCart) {
  if (!checkoutCart || !Array.isArray(checkoutCart.lines)) throw new Error('invalid checkout cart');
  if (checkoutCart.lines.some((line) => line.stockStatus !== 'in-stock')) {
    throw new Error('checkout cart contains unavailable product');
  }
  const categories = [...new Set(checkoutCart.lines.map((line) => line.category).filter(Boolean))];
  const taxClasses = [...new Set(checkoutCart.lines.map((line) => line.taxClass).filter(Boolean))];
  return {
    status: 'priced',
    categories,
    taxClasses,
    lineCount: checkoutCart.lines.length,
    subtotalCents: checkoutCart.subtotalCents,
    totalCents: checkoutCart.totalCents,
    amountDueCents: checkoutCart.totalCents,
    currency: checkoutCart.currency,
  };
}
