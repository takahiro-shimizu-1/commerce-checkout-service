export const CATALOG_PRODUCT_CONTRACT = 'catalog-product-v1';
export const CART_CHECKOUT_CONTRACT = 'cart-checkout-v1';
export const CHECKOUT_ORDER_CONTRACT = 'checkout-order-v1';

export function priceOrder(checkoutCart) {
  if (!checkoutCart || !Array.isArray(checkoutCart.lines)) throw new Error('invalid checkout cart');
  if (checkoutCart.pricingMode !== 'gross') throw new Error('unsupported pricing mode');
  if (checkoutCart.checkoutReady !== true) throw new Error('checkout cart is not marked ready');
  if (checkoutCart.handoffNote !== 'ready-for-payment') throw new Error('missing handoff note');
  if (checkoutCart.lines.some((line) => line.stockStatus !== 'in-stock')) {
    throw new Error('checkout cart contains unavailable product');
  }
  const categories = [...new Set(checkoutCart.lines.map((line) => line.category).filter(Boolean))];
  const taxClasses = [...new Set(checkoutCart.lines.map((line) => line.taxClass).filter(Boolean))];
  const fulfillmentRegions = [...new Set(checkoutCart.lines.map((line) => line.fulfillmentRegion).filter(Boolean))];
  const lifecycleBadges = [...new Set(checkoutCart.lines.map((line) => line.lifecycleBadge).filter(Boolean))];
  const qualitySignals = [...new Set(checkoutCart.lines.map((line) => line.qualitySignal).filter(Boolean))];
  return {
    status: 'priced',
    categories,
    taxClasses,
    fulfillmentRegions,
    lifecycleBadges,
    qualitySignals,
    lineCount: checkoutCart.lines.length,
    subtotalCents: checkoutCart.subtotalCents,
    totalCents: checkoutCart.totalCents,
    amountDueCents: checkoutCart.totalCents,
    currency: checkoutCart.currency,
    pricingMode: checkoutCart.pricingMode,
    checkoutReady: checkoutCart.checkoutReady,
    handoffNote: checkoutCart.handoffNote,
  };
}
