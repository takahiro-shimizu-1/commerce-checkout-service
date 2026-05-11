export const CATALOG_PRODUCT_CONTRACT = 'catalog-product-v1';
export const CART_CHECKOUT_CONTRACT = 'cart-checkout-v1';
export const CART_COUPON_CONTRACT = 'cart-coupon-v1';

export function priceOrder(checkoutCart) {
  if (!checkoutCart || !Array.isArray(checkoutCart.lines)) throw new Error('invalid checkout cart');
  if (checkoutCart.lines.some((line) => line.stockStatus !== 'in-stock')) {
    throw new Error('checkout cart contains unavailable product');
  }
  return {
    status: 'priced',
    lineCount: checkoutCart.lines.length,
    subtotalCents: checkoutCart.subtotalCents,
    discountCents: checkoutCart.discountCents,
    couponCode: checkoutCart.couponCode,
    totalCents: checkoutCart.totalCents,
    currency: checkoutCart.currency,
  };
}
