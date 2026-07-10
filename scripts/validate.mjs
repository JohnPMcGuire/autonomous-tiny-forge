import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const registryPath = path.join(root, 'registry', 'apps.json');
const ledgerPath = path.join(root, 'registry', 'forge-ledger.json');
const allowedCategories = new Set(['useful', 'play', 'experiment']);
const allowedEngines = new Set(['timer-guess', 'fair-picker', 'micro-step', 'challenge-deck', 'choice-mixer', 'word-remix', 'reflection-cards', 'prediction-game']);
const allowedQueueStatuses = new Set(['shipping', 'next', 'candidate', 'deferred']);
const allowedDecisionResults = new Set(['published', 'skipped', 'deferred']);
const forbiddenPattern = /(https?:\/\/|<script|javascript:|onerror=|onload=|eval\s*\(|document\.cookie|localStorage|fetch\s*\()/i;

function fail(message) {
  console.error(`Validation failed: ${message}`);
  process.exitCode = 1;
}

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
if (registry.schemaVersion !== 1 || !Array.isArray(registry.apps)) fail('registry shape is invalid');
const ids = new Set();
for (const [index, app] of registry.apps.entries()) {
  const label = `apps[${index}]`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(app.id || '')) fail(`${label}.id must be a kebab-case slug`);
  if (ids.has(app.id)) fail(`${label}.id is duplicated`);
  ids.add(app.id);
  if (!app.name || app.name.length > 48) fail(`${label}.name is missing or too long`);
  if (!app.summary || app.summary.length > 140) fail(`${label}.summary is missing or too long`);
  if (!app.description || app.description.length > 280) fail(`${label}.description is missing or too long`);
  if (!allowedCategories.has(app.category)) fail(`${label}.category is not allowed`);
  if (!allowedEngines.has(app.engine)) fail(`${label}.engine is not allowed`);
  if (!/^\d+\.\d+\.\d+$/.test(app.version || '')) fail(`${label}.version must be semantic`);
  if (!app.config || typeof app.config !== 'object') fail(`${label}.config is missing`);
  if (!app.config?.instructions || app.config.instructions.length > 220) fail(`${label}.config.instructions is invalid`);
  const text = JSON.stringify(app);
  if (forbiddenPattern.test(text)) fail(`${label} contains a forbidden code or network pattern`);
  if (text.length > 12000) fail(`${label} is too large`);
  for (const key of ['items', 'prompts', 'options', 'outcomes']) {
    if (!Array.isArray(app.config?.[key])) fail(`${label}.config.${key} must be an array`);
    if ((app.config?.[key] || []).length > 24) fail(`${label}.config.${key} has too many entries`);
    for (const value of app.config?.[key] || []) {
      if (typeof value !== 'string' || value.length < 1 || value.length > 220) fail(`${label}.config.${key} has an invalid entry`);
    }
  }
}

const ledgerText = fs.readFileSync(ledgerPath, 'utf8');
const ledger = JSON.parse(ledgerText);
if (ledger.schemaVersion !== 1) fail('forge ledger schema version is invalid');
if (!ledger.updatedAt || Number.isNaN(Date.parse(ledger.updatedAt))) fail('forge ledger updatedAt is invalid');
if (!ledger.sprint || typeof ledger.sprint !== 'object') fail('forge ledger sprint is missing');
if (Number.isNaN(Date.parse(ledger.sprint?.startsAt || ''))) fail('forge ledger sprint start is invalid');
if (Number.isNaN(Date.parse(ledger.sprint?.endsAt || ''))) fail('forge ledger sprint end is invalid');
if (!(ledger.sprint?.intervalMinutes > 0 && ledger.sprint.intervalMinutes <= 1440)) fail('forge ledger interval is invalid');
if (!(ledger.sprint?.plannedReviewWindows > 0 && ledger.sprint.plannedReviewWindows <= 1000)) fail('forge ledger planned review count is invalid');
if (ledger.sprint?.maxPublishableChangesPerWindow !== 1) fail('forge ledger must preserve the one-change boundary');
if (!Array.isArray(ledger.method) || ledger.method.length < 4 || ledger.method.length > 8) fail('forge ledger method is invalid');
if (!Array.isArray(ledger.qualityGates) || ledger.qualityGates.length < 3 || ledger.qualityGates.length > 12) fail('forge ledger quality gates are invalid');
if (!Array.isArray(ledger.queue) || ledger.queue.length > 12) fail('forge ledger queue is invalid');
if (!Array.isArray(ledger.recentDecisions) || ledger.recentDecisions.length > 20) fail('forge ledger recent decisions are invalid');
for (const [index, item] of ledger.queue.entries()) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id || '')) fail(`forge ledger queue[${index}].id is invalid`);
  if (!item.title || !item.reason || !item.source) fail(`forge ledger queue[${index}] is incomplete`);
  if (!allowedQueueStatuses.has(item.status)) fail(`forge ledger queue[${index}].status is invalid`);
}
for (const [index, decision] of ledger.recentDecisions.entries()) {
  if (!decision.date || Number.isNaN(Date.parse(`${decision.date}T12:00:00Z`))) fail(`forge ledger recentDecisions[${index}].date is invalid`);
  if (!decision.title || !decision.summary) fail(`forge ledger recentDecisions[${index}] is incomplete`);
  if (!allowedDecisionResults.has(decision.result)) fail(`forge ledger recentDecisions[${index}].result is invalid`);
  if (!Array.isArray(decision.checks) || decision.checks.length < 1 || decision.checks.length > 8) fail(`forge ledger recentDecisions[${index}].checks is invalid`);
}
if (forbiddenPattern.test(ledgerText)) fail('forge ledger contains a forbidden code or network pattern');
if (ledgerText.length > 50000) fail('forge ledger is too large');

const requiredFiles = [
  'index.html', 'styles.css', 'forge-ledger.css', 'app.js', 'time-sense.js', 'gallery-preview.js', 'forge-ledger.js',
  'pairadox.js', 'pairadox-story.js', 'pairadox-progression.js', 'fair-choice.js', 'tiny-step.js', 'tiny-step-depth.js',
  'constraint-spark.js', 'signal-garden.js', 'threadline.js', 'route-lab.js', 'harbor-balance.js', 'canopy-courier.js',
  'clue-current.js', 'switchyard-shuffle.js', 'orbit-smith.js', 'tempo-kitchen.js', 'mnemonic-vault.js', 'chord-courier.js',
  'shadow-switch.js', 'bazaar-signals.js', 'triage-tower.js', 'crosswind-cargo.js', 'cabin-pressure.js', 'bridge-cartographer.js',
  'pollinator-pact.js', 'foundry-shift.js', 'archive-alibi.js', 'polar-drift-lab.js', 'mirror-marsh.js', 'canal-lock-keeper.js',
  'quarry-relay.js', 'binary-patrol.js', 'treaty-table.js', 'resonance-room.js', 'showrunner-shift.js', 'firebreak-runner.js',
  'sensor-bloom.js', 'metro-pulse.js', 'front-page-desk.js', 'quiet-maintenance.js', 'lantern-lanes.js', 'night-market-ledger.js',
  'rhythm-relay.js', 'courier-cipher.js', 'tidepool-tactics.js', 'pairadox-draft.js', 'relic-sorter.js', 'parcel-parabola.js',
  'rover-script.js', 'skyline-dispatch.js', 'circuit-snapshot.js', 'stacklight-stow.js', 'beacon-builder.js', 'canopy-guard.js',
  'festival-flow.js', 'bridge-brace.js', 'trail-tandem.js', 'verdict-vault.js', 'glyph-foundry.js', 'petri-pursuit.js',
  'tower-tuner.js', 'cistern-lock.js', 'echo-kitchen.js', 'coral-current.js', 'runway-rush.js', 'word-sluice.js',
  'chronicle-conductor.js', 'auction-atlas.js', 'mosaic-marshal.js', 'rumor-mill.js', 'cargo-loom.js', 'gallery-ghost.js',
  'comet-curl.js', 'sonar-salvage.js', 'greenhouse-grid.js', 'rain-garden-rally.js', 'signal-symphony.js', 'switchback-rescue.js',
  'telescope-queue.js', 'grid-guardian.js', 'studio-switcher.js', 'creature-clinic.js', 'print-shop-panic.js', 'lift-line.js',
  'museum-night-watch.js', 'courtyard-clockwork.js', 'cave-cartographer.js', 'potion-parity.js', 'kite-cartographer.js',
  'quilt-quest.js', 'floodgate-ferry.js', 'seismic-survey.js', 'shadow-puppeteer.js', 'fossil-layers.js', 'alt-text-atelier.js',
  'cold-chain-cargo.js', 'library-stack-sprint.js', 'stairwell-steward.js', 'sunprint-safari.js', 'feedback-links.js', 'registry/apps.json',
  'registry/forge-ledger.json', '.nojekyll'
];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) fail(`${file} is missing`);
}
for (const file of requiredFiles.filter((file) => file.endsWith('.js'))) {
  try {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
  } catch {
    fail(`${file} has invalid JavaScript syntax`);
  }
}

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const feedbackLinks = fs.readFileSync(path.join(root, 'feedback-links.js'), 'utf8');
for (const asset of requiredFiles.filter((file) => file.endsWith('.js') && !['stairwell-steward.js', 'sunprint-safari.js'].includes(file))) {
  if (!index.includes(asset) && !feedbackLinks.includes(asset)) fail(`${asset} is not wired into the site shell`);
}
if (!feedbackLinks.includes('stairwell-steward.js')) fail('feedback-links.js does not load stairwell-steward.js');
if (!feedbackLinks.includes('sunprint-safari.js')) fail('feedback-links.js does not load sunprint-safari.js');
if (!index.includes('class="forge-ledger-section shell"')) fail('index.html is missing the responsive forge ledger section class');
if (!index.includes('id="forge-ledger-root" class="forge-ledger-root"')) fail('index.html is missing the stable forge ledger root class');
if (!index.includes('class="dialog-frame"')) fail('index.html is missing the styled dialog frame');
if (index.includes('class="dialog-shell"')) fail('index.html contains the obsolete unstyled dialog shell');
const templateMatch = index.match(/<template id="app-card-template">([\s\S]*?)<\/template>/);
if (!templateMatch) fail('index.html is missing the app card template');
else {
  const buttonMatch = templateMatch[1].match(/<button[^>]*class="[^"]*app-card-button[^"]*"[^>]*>([\s\S]*?)<\/button>/);
  if (!buttonMatch) fail('app card template must use one full-card button');
  else for (const className of ['app-icon', 'app-meta', 'app-name', 'app-summary', 'app-open']) {
    if (!buttonMatch[1].includes(className)) fail(`app card ${className} must remain inside the full-card button`);
  }
}
if (!process.exitCode) console.log(`Validated ${registry.apps.length} registry apps, standalone games through Sunprint Safari, feedback links, the responsive shell contract, the public forge ledger, and the static site.`);
