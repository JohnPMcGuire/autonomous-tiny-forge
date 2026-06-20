import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const registryPath = path.join(root, 'registry', 'apps.json');
const allowedCategories = new Set(['useful', 'play', 'experiment']);
const allowedEngines = new Set([
  'timer-guess', 'fair-picker', 'micro-step', 'challenge-deck',
  'choice-mixer', 'word-remix', 'reflection-cards', 'prediction-game'
]);
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

  const config = app.config;
  if (app.engine === 'challenge-deck' && config.items.length < 6) fail(`${label} needs at least six challenge cards`);
  if (app.engine === 'choice-mixer' && (config.options.length < 4 || config.outcomes.length < 4)) fail(`${label} needs at least four options and outcomes`);
  if (app.engine === 'word-remix' && (config.items.length + config.options.length < 8 || config.prompts.length < 3)) fail(`${label} needs enough words and prompts`);
  if (app.engine === 'reflection-cards' && config.prompts.length < 6) fail(`${label} needs at least six reflection prompts`);
  if (app.engine === 'prediction-game' && (config.options.length !== 4 || config.prompts.length < 4)) fail(`${label} needs exactly four options and at least four prompts`);
  if (app.engine === 'timer-guess' && (!(config.minSeconds > 0) || config.maxSeconds <= config.minSeconds)) fail(`${label} has an invalid timer range`);
}

for (const file of ['index.html', 'styles.css', 'app.js', 'pairadox.js', 'fair-choice.js', 'constraint-spark.js', '.nojekyll']) {
  if (!fs.existsSync(path.join(root, file))) fail(`${file} is missing`);
}

if (!process.exitCode) console.log(`Validated ${registry.apps.length} apps and the static site shell.`);
