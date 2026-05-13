#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const scenario = resolveScenario();

if (scenario === 'small-cart-checkout') {
  applySmallCartCheckoutChange();
} else if (scenario === 'large-catalog-product') {
  applyLargeCatalogProductChange();
} else {
  throw new Error(`Unsupported checkout Miyabi scenario: ${scenario}`);
}

function resolveScenario() {
  const text = [process.env.AUTOMATION_TASK_TITLE, process.env.AUTOMATION_TASK_ID].filter(Boolean).join(' ').toLowerCase();
  if (text.includes('small-cart-checkout')) return 'small-cart-checkout';
  if (text.includes('large-catalog-product')) return 'large-catalog-product';
  return 'unknown';
}

function applySmallCartCheckoutChange() {
  replaceOnce(
    'src/checkout.mjs',
    "  if (checkoutCart.pricingMode !== 'gross') throw new Error('unsupported pricing mode');\n",
    "  if (checkoutCart.pricingMode !== 'gross') throw new Error('unsupported pricing mode');\n  if (checkoutCart.checkoutReady !== true) throw new Error('checkout cart is not marked ready');\n",
  );
  replaceOnce(
    'src/checkout.mjs',
    "    pricingMode: checkoutCart.pricingMode,\n  };",
    "    pricingMode: checkoutCart.pricingMode,\n    checkoutReady: checkoutCart.checkoutReady,\n  };",
  );
  replaceOnce(
    'test/checkout.test.mjs',
    "    pricingMode: 'gross',\n  });",
    "    pricingMode: 'gross',\n    checkoutReady: true,\n  });",
  );
  replaceOnce(
    'test/checkout.test.mjs',
    "  assert.equal(order.pricingMode, 'gross');\n",
    "  assert.equal(order.pricingMode, 'gross');\n  assert.equal(order.checkoutReady, true);\n",
  );
  updateContracts((entry) => {
    if (entry.id === 'CART_CHECKOUT_CONTRACT') entry.version = '7';
    if (entry.id === 'CHECKOUT_ORDER_CONTRACT') entry.version = '2';
  });
}

function applyLargeCatalogProductChange() {
  replaceOnce(
    'src/checkout.mjs',
    "  const fulfillmentRegions = [...new Set(checkoutCart.lines.map((line) => line.fulfillmentRegion).filter(Boolean))];\n",
    "  const fulfillmentRegions = [...new Set(checkoutCart.lines.map((line) => line.fulfillmentRegion).filter(Boolean))];\n  const lifecycleBadges = [...new Set(checkoutCart.lines.map((line) => line.lifecycleBadge).filter(Boolean))];\n",
  );
  replaceOnce(
    'src/checkout.mjs',
    "    fulfillmentRegions,\n",
    "    fulfillmentRegions,\n    lifecycleBadges,\n",
  );
  replaceOnce(
    'test/checkout.test.mjs',
    "    lines: [{ productId: 'sku-1', unitPriceCents: 1200, quantity: 2, category: 'stationery', taxClass: 'standard', stockStatus: 'in-stock', fulfillmentRegion: 'JP' }],\n",
    "    lines: [{ productId: 'sku-1', unitPriceCents: 1200, quantity: 2, category: 'stationery', taxClass: 'standard', stockStatus: 'in-stock', fulfillmentRegion: 'JP', lifecycleBadge: 'standard-flow' }],\n",
  );
  replaceOnce(
    'test/checkout.test.mjs',
    "  assert.deepEqual(order.fulfillmentRegions, ['JP']);\n",
    "  assert.deepEqual(order.fulfillmentRegions, ['JP']);\n  assert.deepEqual(order.lifecycleBadges, ['standard-flow']);\n",
  );
  updateContracts((entry) => {
    if (entry.id === 'CATALOG_PRODUCT_CONTRACT') entry.version = '7';
    if (entry.id === 'CART_CHECKOUT_CONTRACT') entry.version = '8';
    if (entry.id === 'CHECKOUT_ORDER_CONTRACT') entry.version = '3';
  });
}

function updateContracts(mutator) {
  const filePath = 'config/gitnexus-contracts.json';
  const manifest = JSON.parse(readFileSync(filePath, 'utf8'));
  for (const entry of manifest.contracts) mutator(entry);
  writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function replaceOnce(filePath, search, replacement) {
  const current = readFileSync(filePath, 'utf8');
  if (current.includes(search)) {
    writeFileSync(filePath, current.replace(search, replacement), 'utf8');
    return;
  }
  if (current.includes(replacement)) {
    return;
  }
  throw new Error(`Expected text not found in ${filePath}`);
}
