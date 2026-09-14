import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../shift-command.js', import.meta.url), 'utf8');
const peopleLiteral = source.match(/const PEOPLE=(\[[\s\S]*?\n\]);\nconst SCENARIOS=/)?.[1];
const scenariosLiteral = source.match(/const SCENARIOS=(\[[\s\S]*?\n\]);\nfunction style/)?.[1];
assert.ok(peopleLiteral && scenariosLiteral, 'Shift Command data tables are readable');
const PEOPLE = Function(`return ${peopleLiteral}`)();
const SCENARIOS = Function(`return ${scenariosLiteral}`)();

function preferenceDelta(person, shift) {
  return person.pref === shift ? 1 : -1;
}

function moraleFromPlan(baseMorale, eventActive, scenario, assignment) {
  const delta = assignment.reduce((sum, workerIndex, slotIndex) => {
    if (workerIndex == null) return sum;
    return sum + preferenceDelta(PEOPLE[workerIndex], scenario.slots[slotIndex][0]);
  }, 0);
  return Math.max(0, Math.min(10, baseMorale - (eventActive ? 1 : 0) + delta));
}

function hasWinningPlan(scenario, baseMorale, extraBudget = 0) {
  const assignment = Array(scenario.slots.length).fill(0);
  const workerCount = PEOPLE.length;
  function visit(slotIndex) {
    if (slotIndex === assignment.length) {
      const counts = PEOPLE.map((_, idx) => assignment.filter(worker => worker === idx).length);
      if (counts.some((count, idx) => count > PEOPLE[idx].stamina)) return false;
      const overtime = counts.reduce((sum, count) => sum + Math.max(0, count - 1), 0);
      if (overtime > scenario.budget + extraBudget) return false;
      let hit = 0;
      for (let index = 0; index < assignment.length; index += 1) {
        const worker = PEOPLE[assignment[index]];
        const [, primarySkill] = scenario.slots[index];
        const requirements = [primarySkill];
        if (index === scenario.eventSlot) requirements.push(scenario.eventSkill);
        if (!requirements.every(skill => worker.skills.includes(skill))) return false;
        hit += requirements.length;
      }
      const morale = moraleFromPlan(baseMorale, true, scenario, assignment);
      const resilience = morale * 12 + hit * 28 - overtime * 10;
      return morale >= 4 && resilience >= scenario.target;
    }
    for (let worker = 0; worker < workerCount; worker += 1) {
      assignment[slotIndex] = worker;
      if (visit(slotIndex + 1)) return true;
    }
    return false;
  }
  return visit(0);
}

assert.equal(SCENARIOS.length, 3, 'three-site progression remains intact');
for (const scenario of SCENARIOS) {
  const eventSlot = scenario.slots[scenario.eventSlot];
  assert.ok(
    PEOPLE.some(person => person.skills.includes(eventSlot[1]) && person.skills.includes(scenario.eventSkill)),
    `${scenario.name} disruption has at least one qualified worker`,
  );
  assert.ok(hasWinningPlan(scenario, 7), `${scenario.name} has a winning post-disruption plan`);
  assert.ok(hasWinningPlan(scenario, 6, 1), `${scenario.name} remains recoverable after relief crew`);
}

const boundaryScenario = SCENARIOS[0];
const preferredOpenWorker = PEOPLE.findIndex(person => person.pref === 'open');
const threePreferred = [preferredOpenWorker, preferredOpenWorker, null, null, null, null];
const onePreferred = [preferredOpenWorker, null, null, null, null, null];
assert.equal(moraleFromPlan(9, false, boundaryScenario, threePreferred), 10,
  'morale can clamp at the upper boundary');
assert.equal(moraleFromPlan(9, false, boundaryScenario, onePreferred), 10,
  'removing a preferred assignment from a clamped plan recomputes rather than losing morale');
const nonPreferredWorker = PEOPLE.findIndex(person => person.pref !== 'open');
const lowPlan = [nonPreferredWorker, nonPreferredWorker, null, null, null, null];
assert.equal(moraleFromPlan(1, false, boundaryScenario, lowPlan), 0,
  'morale can clamp at the lower boundary');
assert.equal(moraleFromPlan(1, false, boundaryScenario, [nonPreferredWorker, null, null, null, null, null]), 0,
  'removing from a low-boundary plan recomputes from the active baseline');

assert.match(source, /if\(previous===workerId\)return say\('Already assigned\.'/,
  'reassigning the same worker to the same post cannot farm morale');
assert.match(source, /function syncMorale\(\)\{const assignmentDelta=st\.assign\.reduce/,
  'morale is recomputed from the active baseline and current assignments');
assert.match(source, /st\.moraleBase=6;st\.assign=.*st\.event=true;syncMorale\(\)/,
  'relief recovery preserves the advertised morale 5 while the disruption stays active');
assert.match(source, /if\(!st\.event\)\{reveal\(true\);return\}/,
  'a shift cannot clear before the disruption occurs');
assert.match(source, /if\(st\.fatigue\[workerId\]>=p\.stamina\)return say\('Worker at capacity\.'/,
  'worker stamina is a hard assignment capacity');
assert.match(source, /reduce\(\(sum,load\)=>sum\+Math\.max\(0,load-1\),0\)/,
  'every overtime assignment contributes to the overwork penalty');

console.log('Shift Command integrity tests passed.');
