import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
let failed=false;
const fail=(m)=>{console.error(`Validation failed: ${m}`);failed=true;};
const allowedCategories=new Set(['useful','play','experiment']);
const allowedEngines=new Set(['timer-guess','fair-picker','micro-step','challenge-deck','choice-mixer','word-remix','reflection-cards','prediction-game']);
const allowedQueueStatuses=new Set(['shipping','next','candidate','deferred']);
const allowedDecisionResults=new Set(['published','skipped','deferred']);
const forbidden=/(https?:\/\/|<script|javascript:|onerror=|onload=|eval\s*\(|document\.cookie|localStorage|fetch\s*\()/i;

const registry=JSON.parse(read('registry/apps.json'));
if(registry.schemaVersion!==1||!Array.isArray(registry.apps))fail('registry shape is invalid');
const ids=new Set();
for(const [i,app] of registry.apps.entries()){
  const l=`apps[${i}]`;
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(app.id||''))fail(`${l}.id must be a kebab-case slug`);
  if(ids.has(app.id))fail(`${l}.id is duplicated`);ids.add(app.id);
  if(!app.name||app.name.length>48)fail(`${l}.name is missing or too long`);
  if(!app.summary||app.summary.length>140)fail(`${l}.summary is missing or too long`);
  if(!app.description||app.description.length>280)fail(`${l}.description is missing or too long`);
  if(!allowedCategories.has(app.category))fail(`${l}.category is not allowed`);
  if(!allowedEngines.has(app.engine))fail(`${l}.engine is not allowed`);
  if(!/^\d+\.\d+\.\d+$/.test(app.version||''))fail(`${l}.version must be semantic`);
  if(!app.config||typeof app.config!=='object')fail(`${l}.config is missing`);
  if(!app.config?.instructions||app.config.instructions.length>220)fail(`${l}.config.instructions is invalid`);
  const text=JSON.stringify(app);if(forbidden.test(text))fail(`${l} contains a forbidden code or network pattern`);if(text.length>12000)fail(`${l} is too large`);
  for(const key of ['items','prompts','options','outcomes']){if(!Array.isArray(app.config?.[key]))fail(`${l}.config.${key} must be an array`);if((app.config?.[key]||[]).length>24)fail(`${l}.config.${key} has too many entries`);for(const v of app.config?.[key]||[])if(typeof v!=='string'||v.length<1||v.length>220)fail(`${l}.config.${key} has an invalid entry`);}
}

const ledgerText=read('registry/forge-ledger.json'),ledger=JSON.parse(ledgerText);
if(ledger.schemaVersion!==1)fail('forge ledger schema version is invalid');
if(!ledger.updatedAt||Number.isNaN(Date.parse(ledger.updatedAt)))fail('forge ledger updatedAt is invalid');
if(!ledger.sprint||Number.isNaN(Date.parse(ledger.sprint?.startsAt||''))||Number.isNaN(Date.parse(ledger.sprint?.endsAt||'')))fail('forge ledger sprint dates are invalid');
if(!(ledger.sprint?.intervalMinutes>0&&ledger.sprint.intervalMinutes<=1440))fail('forge ledger interval is invalid');
if(!(ledger.sprint?.plannedReviewWindows>0&&ledger.sprint.plannedReviewWindows<=1000))fail('forge ledger planned review count is invalid');
if(ledger.sprint?.maxPublishableChangesPerWindow!==1)fail('forge ledger must preserve the one-change boundary');
if(!Array.isArray(ledger.method)||ledger.method.length<4||ledger.method.length>8)fail('forge ledger method is invalid');
if(!Array.isArray(ledger.qualityGates)||ledger.qualityGates.length<3||ledger.qualityGates.length>12)fail('forge ledger quality gates are invalid');
if(!Array.isArray(ledger.queue)||ledger.queue.length>12)fail('forge ledger queue is invalid');
if(!Array.isArray(ledger.recentDecisions)||ledger.recentDecisions.length>20)fail('forge ledger recent decisions are invalid');
for(const [i,x] of ledger.queue.entries()){if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.id||''))fail(`forge ledger queue[${i}].id is invalid`);if(!x.title||!x.reason||!x.source||!allowedQueueStatuses.has(x.status))fail(`forge ledger queue[${i}] is incomplete`);}
for(const [i,x] of ledger.recentDecisions.entries()){if(!x.date||Number.isNaN(Date.parse(`${x.date}T12:00:00Z`))||!x.title||!x.summary||!allowedDecisionResults.has(x.result)||!Array.isArray(x.checks)||x.checks.length<1||x.checks.length>8)fail(`forge ledger recentDecisions[${i}] is invalid`);}
if(forbidden.test(ledgerText)||ledgerText.length>50000)fail('forge ledger contains forbidden or excessive content');

const index=read('index.html'),feedback=read('feedback-links.js');
const requiredFiles=['index.html','styles.css','forge-ledger.css','app.js','time-sense.js','gallery-preview.js','forge-ledger.js','feedback-links.js','registry/apps.json','registry/forge-ledger.json','.nojekyll'];
for(const match of index.matchAll(/<script defer src="\.\/(.+?\.js)"><\/script>/g))requiredFiles.push(match[1]);
for(const match of feedback.matchAll(/'([a-z0-9-]+\.js)'/g))requiredFiles.push(match[1]);
for(const file of [...new Set(requiredFiles)]){if(!fs.existsSync(path.join(root,file)))fail(`${file} is missing`);if(file.endsWith('.js'))try{execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});}catch{fail(`${file} has invalid JavaScript syntax`);}}
if(!feedback.includes('orchard-graft-lab.js'))fail('feedback-links.js does not load orchard-graft-lab.js');
if(!feedback.includes('harbor-pilot.js'))fail('feedback-links.js does not load harbor-pilot.js');
if(!feedback.includes('loom-logic-studio.js'))fail('feedback-links.js does not load loom-logic-studio.js');
if(!feedback.includes('orbital-salvage-yard.js'))fail('feedback-links.js does not load orbital-salvage-yard.js');
if(!feedback.includes('evidence-chamber.js'))fail('feedback-links.js does not load evidence-chamber.js');
if(!feedback.includes('museum-flow-lab.js'))fail('feedback-links.js does not load museum-flow-lab.js');
if(!feedback.includes('circuit-relay-lab.js'))fail('feedback-links.js does not load circuit-relay-lab.js');
const circuit=read('circuit-relay-lab.js');
for(const marker of ["version:'1.1.0'",'pathBoard()','Diagnostic scan','aria-label',"prefers-reduced-motion:reduce"])if(!circuit.includes(marker))fail(`Circuit Relay Lab 1.1 contract is missing ${marker}`);
if(!index.includes('class="forge-ledger-section shell"')||!index.includes('id="forge-ledger-root" class="forge-ledger-root"'))fail('index.html is missing the responsive forge ledger contract');
if(!index.includes('class="dialog-frame"')||index.includes('class="dialog-shell"'))fail('index.html dialog shell is invalid');
const template=index.match(/<template id="app-card-template">([\s\S]*?)<\/template>/)?.[1]||'';
if(!template.includes('app-card-button'))fail('app card template must use one full-card button');
for(const c of ['app-icon','app-meta','app-name','app-summary','app-open'])if(!template.includes(c))fail(`app card ${c} must remain inside the full-card button`);
if(failed)process.exitCode=1;else console.log(`Validated ${registry.apps.length} registry apps, standalone games through Circuit Relay Lab 1.1.0, feedback links, the responsive shell contract, the public forge ledger, and the static site.`);