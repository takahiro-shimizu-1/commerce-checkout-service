#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const repoName = JSON.parse(readFileSync('package.json', 'utf8')).name;
const issueNumber = requiredEnv('ISSUE_NUMBER');
const issueTitle = process.env.ISSUE_TITLE || '';
const issueBody = process.env.ISSUE_BODY || '';
const taskId = parseTaskId(issueBody);
const task = taskFor(repoName, taskId);
const branchName = 'miyabi/issue-' + issueNumber + '-' + taskId;

comment([
  '## Miyabi task decomposition',
  '',
  'Issue #' + issueNumber + ' was accepted by the repo-local lifecycle workflow.',
  '',
  'Task: ' + taskId,
  '',
  'Steps:',
  ...task.steps.map((step) => '- [ ] ' + step),
  '',
  'Completion rule:',
  '- Open a PR',
  '- Wait for PR checks',
  '- Merge the PR',
  '- Close this issue',
].join('\n'));

run('git', ['config', 'user.email', 'miyabi-task-lifecycle@example.invalid']);
run('git', ['config', 'user.name', 'Miyabi Task Lifecycle']);
run('git', ['checkout', '-B', branchName]);

task.apply();

run('npm', ['test']);
run('git', ['add', '.']);
const status = runOut('git', ['status', '--short']).trim();
if (!status) {
  throw new Error('Task produced no file changes.');
}
run('git', ['commit', '-m', 'Miyabi task #' + issueNumber + ': ' + taskId]);
run('git', ['push', '--force-with-lease', 'origin', branchName]);

const prUrl = runOut('gh', [
  'pr',
  'create',
  '--head',
  branchName,
  '--base',
  'main',
  '--title',
  'Miyabi task #' + issueNumber + ': ' + issueTitle,
  '--body',
  [
    'Implements Miyabi task from issue #' + issueNumber + '.',
    '',
    'Task: ' + taskId,
    '',
    'Planned steps:',
    ...task.steps.map((step) => '- ' + step),
    '',
    'Closes #' + issueNumber,
  ].join('\n'),
]).trim();
const prNumber = prUrl.split('/').pop();

comment('Created PR #' + prNumber + ': ' + prUrl + '\n\nWaiting for PR checks before merge.');
waitForPrChecks(prNumber);
run('gh', ['pr', 'merge', prNumber, '--merge', '--delete-branch']);
run('gh', [
  'issue',
  'close',
  issueNumber,
  '--reason',
  'completed',
  '--comment',
  'Merged PR #' + prNumber + ' after PR checks passed.',
]);

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(name + ' is required.');
  return value;
}

function parseTaskId(body) {
  const match = body.match(/^miyabi-task:\s*([^\s]+)/im);
  if (!match) throw new Error('Issue body must include "miyabi-task: <task-id>".');
  return match[1].trim();
}

function taskFor(name, id) {
  const tasks = {
    'commerce-platform': {
      'platform-record-coordination': {
        steps: [
          'Add parent coordination metadata',
          'Assert the metadata in the parent repo test',
          'Run npm test',
        ],
        apply: applyPlatformCoordination,
      },
    },
    'commerce-catalog-service': {
      'catalog-add-product-category': {
        steps: [
          'Add category to the catalog product contract',
          'Validate category in catalog contract assertion',
          'Update the catalog test and contract version',
          'Run npm test',
        ],
        apply: applyCatalogCategory,
      },
    },
    'commerce-cart-service': {
      'cart-preserve-product-category': {
        steps: [
          'Preserve catalog category on cart lines',
          'Update cart test coverage',
          'Update affected contract versions',
          'Run npm test',
        ],
        apply: applyCartCategory,
      },
    },
    'commerce-checkout-service': {
      'checkout-report-product-categories': {
        steps: [
          'Report categories from checkout cart lines',
          'Update checkout test coverage',
          'Update affected contract versions',
          'Run npm test',
        ],
        apply: applyCheckoutCategories,
      },
    },
  };
  const task = tasks[name]?.[id];
  if (!task) throw new Error('Unsupported task "' + id + '" for repo "' + name + '".');
  return task;
}

function applyPlatformCoordination() {
  const manifest = readJson('repos.json');
  manifest.coordination = {
    owner: 'miyabi-task-lifecycle',
    sourceIssue: Number(issueNumber),
    purpose: 'verify parent repo coordination workflow',
  };
  writeJsonFile('repos.json', manifest);
  replaceOnce(
    'test/links.test.mjs',
    "  assert.equal(existsSync(new URL('../src', import.meta.url)), false);\n",
    "  assert.equal(existsSync(new URL('../src', import.meta.url)), false);\n  assert.equal(manifest.coordination.owner, 'miyabi-task-lifecycle');\n",
  );
}

function applyCatalogCategory() {
  replaceOnce(
    'src/catalog.mjs',
    "    name: 'Notebook',\n    priceCents: 1200,",
    "    name: 'Notebook',\n    category: 'stationery',\n    priceCents: 1200,",
  );
  replaceOnce(
    'src/catalog.mjs',
    "  if (!Number.isInteger(product.priceCents)) throw new Error('missing product price');\n",
    "  if (!Number.isInteger(product.priceCents)) throw new Error('missing product price');\n  if (product.category !== 'stationery') throw new Error('missing product category');\n",
  );
  replaceOnce(
    'test/catalog.test.mjs',
    "    name: 'Notebook',\n    priceCents: 1200,",
    "    name: 'Notebook',\n    category: 'stationery',\n    priceCents: 1200,",
  );
  updateContracts((entry) => {
    if (entry.id === 'CATALOG_PRODUCT_CONTRACT') entry.version = '3';
  });
}

function applyCartCategory() {
  replaceOnce(
    'src/cart.mjs',
    '    quantity,\n    stockStatus: product.stockStatus,',
    '    quantity,\n    category: product.category,\n    stockStatus: product.stockStatus,',
  );
  replaceOnce(
    'test/cart.test.mjs',
    "  const product = { id: 'sku-1', priceCents: 1200, stockStatus: 'in-stock' };",
    "  const product = { id: 'sku-1', priceCents: 1200, category: 'stationery', stockStatus: 'in-stock' };",
  );
  replaceOnce(
    'test/cart.test.mjs',
    "  assert.equal(checkoutCart.lines[0].stockStatus, 'in-stock');\n",
    "  assert.equal(checkoutCart.lines[0].category, 'stationery');\n  assert.equal(checkoutCart.lines[0].stockStatus, 'in-stock');\n",
  );
  updateContracts((entry) => {
    if (entry.id === 'CATALOG_PRODUCT_CONTRACT') entry.version = '3';
    if (entry.id === 'CART_CHECKOUT_CONTRACT') entry.version = '2';
  });
}

function applyCheckoutCategories() {
  replaceOnce(
    'src/checkout.mjs',
    "  return {\n    status: 'priced',",
    "  const categories = [...new Set(checkoutCart.lines.map((line) => line.category).filter(Boolean))];\n  return {\n    status: 'priced',\n    categories,",
  );
  replaceOnce(
    'test/checkout.test.mjs',
    "    lines: [{ productId: 'sku-1', unitPriceCents: 1200, quantity: 2, stockStatus: 'in-stock' }],",
    "    lines: [{ productId: 'sku-1', unitPriceCents: 1200, quantity: 2, category: 'stationery', stockStatus: 'in-stock' }],",
  );
  replaceOnce(
    'test/checkout.test.mjs',
    "  assert.equal(order.totalCents, 2400);\n",
    "  assert.equal(order.totalCents, 2400);\n  assert.deepEqual(order.categories, ['stationery']);\n",
  );
  updateContracts((entry) => {
    if (entry.id === 'CATALOG_PRODUCT_CONTRACT') entry.version = '3';
    if (entry.id === 'CART_CHECKOUT_CONTRACT') entry.version = '2';
  });
}

function updateContracts(mutator) {
  const contractPath = 'config/gitnexus-contracts.json';
  const manifest = readJson(contractPath);
  for (const entry of manifest.contracts) mutator(entry);
  writeJsonFile(contractPath, manifest);
}

function replaceOnce(file, search, replacement) {
  const current = readFileSync(file, 'utf8');
  if (!current.includes(search)) {
    throw new Error('Expected text was not found in ' + file + ': ' + search);
  }
  writeFileSync(file, current.replace(search, replacement), 'utf8');
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function writeJsonFile(file, value) {
  writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function waitForPrChecks(prNumber) {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const result = spawnSync('gh', ['pr', 'checks', prNumber, '--json', 'name,state,bucket'], {
      encoding: 'utf8',
    });
    if (result.status === 0 || result.status === 8) {
      const checks = result.stdout.trim() ? JSON.parse(result.stdout) : [];
      if (checks.length > 0) {
        run('gh', ['pr', 'checks', prNumber, '--watch', '--interval', '10']);
        return;
      }
    }
    if (result.status !== 0 && result.status !== 8) {
      throw new Error(result.stderr || 'Failed to read PR checks.');
    }
    run('sleep', ['5']);
  }
  throw new Error('No PR checks appeared for PR #' + prNumber + '.');
}

function comment(body) {
  run('gh', ['issue', 'comment', issueNumber, '--body', body]);
}

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

function runOut(command, args) {
  return execFileSync(command, args, { encoding: 'utf8' });
}
