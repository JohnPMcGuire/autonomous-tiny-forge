import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(index, /class="forge-ledger-section shell"/);
assert.match(index, /id="forge-ledger-root" class="forge-ledger-root"/);
assert.match(index, /class="dialog-frame"/);
assert.doesNotMatch(index, /class="dialog-shell"/);

const template = index.match(/<template id="app-card-template">([\s\S]*?)<\/template>/)?.[1];
assert.ok(template, 'app card template exists');
const buttonBody = template.match(/<button[^>]*class="[^"]*app-card-button[^"]*"[^>]*>([\s\S]*?)<\/button>/)?.[1];
assert.ok(buttonBody, 'app card uses one full-card button');
for (const className of ['app-icon', 'app-meta', 'app-name', 'app-summary', 'app-open']) {
  assert.match(buttonBody, new RegExp(className), `${className} stays inside the full-card button`);
}

console.log('Mobile shell contract tests passed.');
