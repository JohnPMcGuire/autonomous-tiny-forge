import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../coalition-craft.js', import.meta.url), 'utf8');
const factionsLiteral = source.match(/const FACTIONS=(\[[\s\S]*?\]);\nconst POLICIES=/)?.[1];
const policiesLiteral = source.match(/const POLICIES=(\[[\s\S]*?\n\]);\nconst COUNCILS=/)?.[1];
const councilsLiteral = source.match(/const COUNCILS=(\[[\s\S]*?\n\]);\nfunction style/)?.[1];
assert.ok(factionsLiteral && policiesLiteral && councilsLiteral, 'Coalition Craft data tables are readable');
const FACTIONS = Function(`return ${factionsLiteral}`)();
const POLICIES = Function(`return ${policiesLiteral}`)();
const COUNCILS = Function(`return ${councilsLiteral}`)();

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function policyState(state, policyIndex) {
  const policy = POLICIES[policyIndex];
  if (state.budget < policy.cost) return null;
  const next = {
    ...state,
    budget: state.budget - policy.cost,
    trust: clamp(state.trust + policy.trust, 0, 10),
    support: [...state.support],
    chosen: [...state.chosen, policyIndex],
  };
  FACTIONS.forEach((faction, index) => {
    const delta = policy.tags.filter(tag => faction.likes.includes(tag)).length
      - (policy.tags.includes(faction.hates) ? 1 : 0);
    next.support[index] = clamp(next.support[index] + delta, 0, 6);
  });
  return next;
}

function bargainState(state) {
  if (state.influence < 1) return null;
  const support = [...state.support];
  const lowest = Math.min(...support);
  const index = support.indexOf(lowest);
  support[index] = clamp(support[index] + 2, 0, 6);
  return {
    ...state,
    influence: state.influence - 1,
    trust: clamp(state.trust - 1, 0, 10),
    support,
  };
}

function wins(state, target) {
  if (state.chosen.length !== 2) return false;
  const yesVotes = state.support.filter(value => value >= 3).length;
  const risk = state.chosen.reduce((sum, index) => sum + POLICIES[index].risk, 0);
  const quality = state.support.reduce((sum, value) => sum + value, 0) + state.trust - risk;
  return yesVotes >= 3 && quality >= target;
}

function pairCanWin(council, first, second, recovery) {
  const baseline = {
    budget: council.budget,
    influence: recovery ? 2 : 3,
    trust: recovery ? 4 : 5,
    support: FACTIONS.map(() => recovery ? 2 : 3),
    chosen: [],
  };
  const policyOrders = [[first, second], [second, first]];
  for (const order of policyOrders) {
    const visit = (state, policyCursor) => {
      if (policyCursor === 2 && wins(state, council.target)) return true;
      if (policyCursor < 2) {
        const withPolicy = policyState(state, order[policyCursor]);
        if (withPolicy && visit(withPolicy, policyCursor + 1)) return true;
      }
      const withBargain = bargainState(state);
      if (withBargain && visit(withBargain, policyCursor)) return true;
      return false;
    };
    if (visit(baseline, 0)) return true;
  }
  return false;
}

function combinations(values, size, start = 0, prefix = [], out = []) {
  if (prefix.length === size) {
    out.push([...prefix]);
    return out;
  }
  for (let index = start; index <= values.length - (size - prefix.length); index += 1) {
    prefix.push(values[index]);
    combinations(values, size, index + 1, prefix, out);
    prefix.pop();
  }
  return out;
}

assert.equal(COUNCILS.length, 6, 'six-council progression remains intact');
assert.equal(FACTIONS.length, 4, 'four-faction coalition model remains intact');
assert.ok(POLICIES.length >= 5, 'policy pool remains large enough to draw a five-card hand');

const policyIndexes = POLICIES.map((_, index) => index);
const allHands = combinations(policyIndexes, 5);
for (const council of COUNCILS) {
  for (const recovery of [false, true]) {
    const winningPairs = new Set();
    for (const [first, second] of combinations(policyIndexes, 2)) {
      if (pairCanWin(council, first, second, recovery)) {
        winningPairs.add(`${first}:${second}`);
      }
    }
    for (const hand of allHands) {
      const hasWinningPair = combinations(hand, 2)
        .some(([first, second]) => winningPairs.has(`${first}:${second}`));
      assert.ok(
        hasWinningPair,
        `${council.name} ${recovery ? 'recovery' : 'normal'} five-card hand remains winnable: ${hand.join(',')}`,
      );
    }
  }
}

assert.match(source, /function normalBase\(round\).*influence:3,trust:5,support:FACTIONS\.map\(\(\)=>3\)/,
  'normal councils retain the 3 influence / 5 trust / 3 support baseline');
assert.match(source, /function baseState\(\)\{const b=st\.baseline\|\|normalBase\(st\.round\)/,
  'replay starts from the active per-council baseline');
assert.match(source, /baseline:st\.baseline/,
  'undo snapshots include the active replay baseline');
assert.match(source, /st\.baseline=\{budget:COUNCILS\[st\.round\]\.budget,influence:2,trust:4,support:FACTIONS\.map\(\(\)=>2\)\}/,
  'emergency recovery establishes the 2 influence / 4 trust / 2 support baseline');
assert.match(source, /st\.recovery=false;failed=false/,
  'emergency recovery remains one-use for the session');
assert.match(source, /st\.actions=st\.actions\.filter\(a=>!\(a\.type==='policy'&&a\.name===p\.name\)\);replay\(\)/,
  'policy removal replays remaining ordered decisions from the active baseline');
assert.match(source, /transitioning=true;st\.round\+\+;draw\(\)/,
  'successful non-final votes lock the transition before loading the next council');
assert.match(source, /function clearTransition\(\)\{if\(transitionTimer!==null\)\{clearTimeout\(transitionTimer\)/,
  'restart and teardown can cancel pending council transitions');

console.log('Coalition Craft integrity tests passed.');
