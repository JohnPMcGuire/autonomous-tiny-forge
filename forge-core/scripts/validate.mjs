import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const core = join(root, 'forge-core');

const requiredFiles = [
  'README.md',
  'STRATEGY.md',
  'GOVERNANCE.md',
  'NEXT_RUN.md',
  'config/governance.json',
  'ledger/decisions.json',
  'ledger/opportunities.json',
  'ledger/experiments.json'
];

const errors = [];

function requireFile(path) {
  const fullPath = join(core, path);
  if (!existsSync(fullPath)) {
    errors.push(`Missing required file: forge-core/${path}`);
    return '';
  }
  return readFileSync(fullPath, 'utf8');
}

function readJson(path) {
  const text = requireFile(path);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    errors.push(`Invalid JSON in forge-core/${path}: ${error.message}`);
    return null;
  }
}

for (const file of requiredFiles) {
  requireFile(file);
}

const strategy = requireFile('STRATEGY.md');
const governanceText = requireFile('GOVERNANCE.md');
const nextRun = requireFile('NEXT_RUN.md');
const governance = readJson('config/governance.json');
const decisions = readJson('ledger/decisions.json');
const opportunities = readJson('ledger/opportunities.json');
const experiments = readJson('ledger/experiments.json');

if (!strategy.includes('Search Intelligence')) {
  errors.push('STRATEGY.md must state the current Search Intelligence thesis.');
}

if (!strategy.includes('Strategy change protocol')) {
  errors.push('STRATEGY.md must include a strategy change protocol.');
}

if (!governanceText.includes('Never write directly to `main`')) {
  errors.push('GOVERNANCE.md must prohibit direct writes to main.');
}

if (!nextRun.includes('Recommended next increment')) {
  errors.push('NEXT_RUN.md must include a recommended next increment.');
}

if (governance) {
  if (governance.autonomousSpendLimitUsd !== 0) {
    errors.push('autonomousSpendLimitUsd must remain 0 during Phase 0.');
  }
  if (governance.minimumCandidatesPerRun < 3) {
    errors.push('minimumCandidatesPerRun must be at least 3.');
  }
  if (governance.maximumCoherentIncrementsPerRun !== 1) {
    errors.push('maximumCoherentIncrementsPerRun must be 1.');
  }
  if (governance.allowDirectMainWrites !== false) {
    errors.push('allowDirectMainWrites must be false.');
  }
  if (!Array.isArray(governance.humanApprovalRequired) || !governance.humanApprovalRequired.includes('spend-money')) {
    errors.push('governance must require human approval for spending.');
  }
}

if (decisions) {
  if (decisions.schemaVersion !== 1 || !Array.isArray(decisions.decisions)) {
    errors.push('decisions.json must have schemaVersion 1 and a decisions array.');
  } else {
    const ids = new Set();
    for (const decision of decisions.decisions) {
      if (!decision.id || ids.has(decision.id)) errors.push(`Decision has missing or duplicate id: ${decision.id}`);
      ids.add(decision.id);
      for (const field of ['date', 'type', 'title', 'status', 'decision', 'evidence', 'alternativesConsidered', 'reviewDate']) {
        if (!(field in decision)) errors.push(`Decision ${decision.id} missing ${field}.`);
      }
      if (Array.isArray(decision.alternativesConsidered) && decision.alternativesConsidered.length < 3) {
        errors.push(`Decision ${decision.id} must compare at least three alternatives.`);
      }
    }
  }
}

if (opportunities) {
  if (opportunities.schemaVersion !== 1 || !Array.isArray(opportunities.opportunities)) {
    errors.push('opportunities.json must have schemaVersion 1 and an opportunities array.');
  } else {
    if (opportunities.opportunities.length < 3) {
      errors.push('opportunities.json must include at least three opportunities.');
    }
    for (const opportunity of opportunities.opportunities) {
      if (!opportunity.id || !opportunity.name || !opportunity.status) {
        errors.push('Each opportunity must include id, name, and status.');
      }
      const score = opportunity.score;
      if (!score || typeof score.total !== 'number') {
        errors.push(`Opportunity ${opportunity.id} must include a numeric total score.`);
      }
    }
  }
}

if (experiments) {
  if (experiments.schemaVersion !== 1 || !Array.isArray(experiments.experiments)) {
    errors.push('experiments.json must have schemaVersion 1 and an experiments array.');
  } else {
    for (const experiment of experiments.experiments) {
      for (const field of ['id', 'name', 'status', 'opportunityId', 'hypothesis', 'method', 'successCriteria', 'stopCriteria', 'approvalGates', 'estimatedSpendUsd', 'nextAction']) {
        if (!(field in experiment)) errors.push(`Experiment ${experiment.id} missing ${field}.`);
      }
      if (experiment.estimatedSpendUsd !== 0) {
        errors.push(`Experiment ${experiment.id} must not require autonomous spend during Phase 0.`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Forge Core validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Forge Core validation passed.');
