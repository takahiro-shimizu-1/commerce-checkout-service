#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

replaceOnce(
  'src/checkout.mjs',
  '    totalCents: checkoutCart.totalCents,\n    currency: checkoutCart.currency,',
  '    totalCents: checkoutCart.totalCents,\n    amountDueCents: checkoutCart.totalCents,\n    currency: checkoutCart.currency,',
);
replaceOnce(
  'test/checkout.test.mjs',
  '  assert.equal(order.totalCents, 2400);\n',
  '  assert.equal(order.totalCents, 2400);\n  assert.equal(order.amountDueCents, 2400);\n',
);
updateContracts((entry) => {
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
