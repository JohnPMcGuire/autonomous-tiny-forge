import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'registry', 'forge-ledger.json'), 'utf8'));
const renderer = fs.readFileSync(path.join(root, 'forge-ledger.js'), 'utf8');

assert.equal(ledger.researchLens?.name, 'Shipping Gap Experiment');
assert.equal(ledger.researchLens?.notAReplication, true);
assert.equal(ledger.researchLens?.paper?.doi, '10.3386/w35275');
assert.match(ledger.researchLens?.paper?.title || '', /Writing Code vs\. Shipping Code/);
assert.ok(ledger.researchLens?.claimTested?.includes('coding activity'));
assert.ok(ledger.researchLens?.projectHypothesis?.includes('useful shipped releases'));

assert.equal(ledger.sprint?.name, 'Shipping Gap Sprint');
assert.equal(ledger.sprint?.runsPerDay, 12);
assert.equal(ledger.sprint?.intervalMinutes, 120);
assert.equal(ledger.sprint?.plannedReviewWindows, 360);
assert.equal(ledger.sprint?.maxPublishableChangesPerWindow, 1);
assert.equal(ledger.shippingMetrics?.reviewWindowsPlanned, 360);
assert.equal(ledger.shippingMetrics?.measurementWindowStart, ledger.sprint.startsAt);
assert.equal(ledger.shippingMetrics?.measurementWindowEnd, ledger.sprint.endsAt);

const reviewMix = ledger.reviewMix || [];
assert.equal(reviewMix.reduce((total, item) => total + item.windowsPerDay, 0), 12);
assert.ok(reviewMix.some((item) => item.id === 'qa-sweep'));
assert.ok(reviewMix.some((item) => item.id === 'feedback-triage'));
assert.ok(reviewMix.some((item) => item.id === 'ledger-review'));

for (const key of ['candidateChangesConsidered', 'pullRequestsOpened', 'pullRequestsMerged', 'mergedReleases', 'successfulDeployments', 'skippedWindows', 'bugReports', 'repairReleases']) {
  assert.equal(typeof ledger.shippingMetrics[key], 'number', `${key} is numeric`);
  assert.ok(ledger.shippingMetrics[key] >= 0, `${key} is non-negative`);
}

assert.ok(Array.isArray(ledger.releaseCriteria));
assert.ok(ledger.releaseCriteria.length >= 6);
assert.ok(ledger.releaseCriteria.some((criterion) => criterion.includes('Deployment completed')));
assert.ok(ledger.releaseCriteria.some((criterion) => criterion.includes('public page loads')));
assert.ok(ledger.qualityGates.some((gate) => gate.includes('Open bugs')));
assert.ok(ledger.method.some((step) => step.id === 'score'));

assert.match(renderer, /Shipping Gap Experiment/);
assert.match(renderer, /Open NBER paper/);
assert.match(renderer, /releaseAcceptanceRate/);

console.log('Shipping gap ledger tests passed.');
