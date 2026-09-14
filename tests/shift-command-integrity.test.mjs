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

function hasWinningPlan(scenario, baseMorale, extraBudget = 0) {
  const assignment = Array(scenario.slots.length).fill(0);
  const workerCount = PEOPLE.length;
  function visit(slotIndex) {
    if (slotIndex === assignment.length) {
      const counts = PEOPLE.map((_, idx) => assignment.filter(worker => worker === idx).length);
      const overtime = counts.reduce((sum, count) => sum + Math.max(0, count - 1), 0);
      if (overtime > scenario.budget + extraBudget) return false;
      const repeatedWorkers = counts.filter(count => count > 1).length;
      let morale = baseMorale;
      let hit = 0;
      for (let index = 0; index < assignment.length; index += 1) {
        const worker = PEOPLE[assignment[index]];
        const [shift, primarySkill] = scenario.slots[index];
        const requirements = [primarySkill];
        if (index === scenario.eventSlot) requirements.push(scenario.eventSkill);
        if (!requirements.every(skill => worker.skills.includes(skill))) return false;
        hit += requirements.length;
        morale += preferenceDelta(worker, shift);
      }
      morale = Math.max(0, Math.min(10, morale));
      const resilience = morale * 12 + hit * 28 - repeatedWorkers * 18;
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
  assert.ok(hasWinningPlan(scenario, 6), `${scenario.name} has a winning post-disruption plan`);
  assert.ok(hasWinningPlan(scenario, 5, 1), `${scenario.name} remains recoverable after relief crew`);
}

assert.match(source, /if\(previous===workerId\)return say\('Already assigned\.'/,
  'reassigning the same worker to the same post cannot farm morale');
assert.match(source, /st\.morale=clamp\(st\.morale-preferenceDelta\(id,slot\),0,10\)/,
  'removing an assignment refunds its morale effect');
assert.match(source, /if\(!st\.event\)\{reveal\(true\);return\}/,
  'a shift cannot clear before the disruption occurs');

console.log('Shift Command integrity tests passed.');
