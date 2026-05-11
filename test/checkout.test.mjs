import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { priceOrder } from '../src/checkout.mjs';

test('checkout prices a cart contract payload', () => {
  const order = priceOrder({
    lines: [{ productId: 'sku-1', unitPriceCents: 1200, quantity: 2, stockStatus: 'in-stock' }],
    subtotalCents: 2400,
    discountCents: 240,
    couponCode: 'SAVE10',
    totalCents: 2160,
    currency: 'JPY',
  });
  assert.equal(order.status, 'priced');
  assert.equal(order.totalCents, 2160);
  assert.equal(order.couponCode, 'SAVE10');
});
