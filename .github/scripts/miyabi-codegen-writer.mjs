#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

replaceOnce(
  'src/checkout.mjs',
  '  const categories = [...new Set(checkoutCart.lines.map((line) => line.category).filter(Boolean))];\n',
  '  const categories = [...new Set(checkoutCart.lines.map((line) => line.category).filter(Boolean))];\n  const taxClasses = [...new Set(checkoutCart.lines.map((line) => line.taxClass).filter(Boolean))];\n',
);
replaceOnce(
  'src/checkout.mjs',
  '    categories,\n    lineCount: checkoutCart.lines.length,',
  '    categories,\n    taxClasses,\n    lineCount: checkoutCart.lines.length,',
);
replaceOnce(
  'test/checkout.test.mjs',
  "    lines: [{ productId: 'sku-1', unitPriceCents: 1200, quantity: 2, category: 'stationery', stockStatus: 'in-stock' }],",
  "    lines: [{ productId: 'sku-1', unitPriceCents: 1200, quantity: 2, category: 'stationery', taxClass: 'standard', stockStatus: 'in-stock' }],",
);
replaceOnce(
  'test/checkout.test.mjs',
  "  assert.deepEqual(order.categories, ['stationery']);\n",
  "  assert.deepEqual(order.categories, ['stationery']);\n  assert.deepEqual(order.taxClasses, ['standard']);\n",
);
updateContracts((entry) => {
  if (entry.id === 'CATALOG_PRODUCT_CONTRACT') entry.version = '4';
  if (entry.id === 'CART_CHECKOUT_CONTRACT') entry.version = '3';
});

function updateContracts(mutator) {
  const filePath = 'config/gitnexus-contracts.json';
  const manifest = JSON.parse(readFileSync(filePath, 'utf8'));
  for (const entry of manifest.contracts) mutator(entry);
  writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function replaceOnce(filePath, search, replacement) {
  const current = readFileSync(filePath, 'utf8');
  if (!current.includes(search)) {
    throw new Error(`Expected text not found in ${filePath}`);
  }
  writeFileSync(filePath, current.replace(search, replacement), 'utf8');
}
