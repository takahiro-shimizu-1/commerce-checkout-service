#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const scenario = resolveScenario();

if (scenario === 'small-cart-checkout') {
  applySmallCartCheckoutChange();
} else if (scenario === 'large-catalog-product') {
  applyLargeCatalogProductChange();
} else if (scenario === 'validation-cart-note-v9') {
  applyValidationCartNoteV9Change();
} else if (scenario === 'validation-catalog-signal-v10') {
  applyValidationCatalogSignalV10Change();
} else {
  throw new Error(`Unsupported checkout Miyabi scenario: ${scenario}`);
}

function resolveScenario() {
  const text = [process.env.AUTOMATION_TASK_TITLE, process.env.AUTOMATION_TASK_ID].filter(Boolean).join(' ').toLowerCase();
  if (text.includes('small-cart-checkout')) return 'small-cart-checkout';
  if (text.includes('large-catalog-product')) return 'large-catalog-product';
  if (text.includes('validation-cart-note-v9')) return 'validation-cart-note-v9';
  if (text.includes('validation-catalog-signal-v10')) return 'validation-catalog-signal-v10';
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

function applyValidationCartNoteV9Change() {
  replaceOnce(
    'src/checkout.mjs',
    "  if (checkoutCart.checkoutReady !== true) throw new Error('checkout cart is not marked ready');\n",
    "  if (checkoutCart.checkoutReady !== true) throw new Error('checkout cart is not marked ready');\n  if (checkoutCart.handoffNote !== 'ready-for-payment') throw new Error('missing handoff note');\n",
  );
  replaceOnce(
    'src/checkout.mjs',
    "    checkoutReady: checkoutCart.checkoutReady,\n  };",
    "    checkoutReady: checkoutCart.checkoutReady,\n    handoffNote: checkoutCart.handoffNote,\n  };",
  );
  replaceOnce(
    'test/checkout.test.mjs',
    "    checkoutReady: true,\n  });",
    "    checkoutReady: true,\n    handoffNote: 'ready-for-payment',\n  });",
  );
  replaceOnce(
    'test/checkout.test.mjs',
    "  assert.equal(order.checkoutReady, true);\n",
    "  assert.equal(order.checkoutReady, true);\n  assert.equal(order.handoffNote, 'ready-for-payment');\n",
  );
  updateContracts((entry) => {
    if (entry.id === 'CART_CHECKOUT_CONTRACT') entry.version = '9';
    if (entry.id === 'CHECKOUT_ORDER_CONTRACT') entry.version = '4';
  });
}

function applyValidationCatalogSignalV10Change() {
  replaceOnce(
    'src/checkout.mjs',
    "  const lifecycleBadges = [...new Set(checkoutCart.lines.map((line) => line.lifecycleBadge).filter(Boolean))];\n",
    "  const lifecycleBadges = [...new Set(checkoutCart.lines.map((line) => line.lifecycleBadge).filter(Boolean))];\n  const qualitySignals = [...new Set(checkoutCart.lines.map((line) => line.qualitySignal).filter(Boolean))];\n",
  );
  replaceOnce(
    'src/checkout.mjs',
    "    lifecycleBadges,\n",
    "    lifecycleBadges,\n    qualitySignals,\n",
  );
  replaceOnce(
    'test/checkout.test.mjs',
    "    lines: [{ productId: 'sku-1', unitPriceCents: 1200, quantity: 2, category: 'stationery', taxClass: 'standard', stockStatus: 'in-stock', fulfillmentRegion: 'JP', lifecycleBadge: 'standard-flow' }],\n",
    "    lines: [{ productId: 'sku-1', unitPriceCents: 1200, quantity: 2, category: 'stationery', taxClass: 'standard', stockStatus: 'in-stock', fulfillmentRegion: 'JP', lifecycleBadge: 'standard-flow', qualitySignal: 'catalog-reviewed' }],\n",
  );
  replaceOnce(
    'test/checkout.test.mjs',
    "  assert.deepEqual(order.lifecycleBadges, ['standard-flow']);\n",
    "  assert.deepEqual(order.lifecycleBadges, ['standard-flow']);\n  assert.deepEqual(order.qualitySignals, ['catalog-reviewed']);\n",
  );
  updateContracts((entry) => {
    if (entry.id === 'CATALOG_PRODUCT_CONTRACT') entry.version = '10';
    if (entry.id === 'CART_CHECKOUT_CONTRACT') entry.version = '10';
    if (entry.id === 'CHECKOUT_ORDER_CONTRACT') entry.version = '5';
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
