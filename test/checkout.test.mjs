import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { CHECKOUT_ORDER_CONTRACT, priceOrder } from '../src/checkout.mjs';

test('checkout prices a cart contract payload', () => {
  assert.equal(CHECKOUT_ORDER_CONTRACT, 'checkout-order-v1');
  const order = priceOrder({
    lines: [{ productId: 'sku-1', unitPriceCents: 1200, quantity: 2, category: 'stationery', taxClass: 'standard', stockStatus: 'in-stock', fulfillmentRegion: 'JP' }],
    subtotalCents: 2400,
    totalCents: 2400,
    currency: 'JPY',
    pricingMode: 'gross',
  });
  assert.equal(order.status, 'priced');
  assert.equal(order.totalCents, 2400);
  assert.equal(order.amountDueCents, 2400);
  assert.equal(order.pricingMode, 'gross');
  assert.deepEqual(order.categories, ['stationery']);
  assert.deepEqual(order.taxClasses, ['standard']);
  assert.deepEqual(order.fulfillmentRegions, ['JP']);
});
