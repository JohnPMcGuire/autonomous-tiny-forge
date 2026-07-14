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
if(!Array.isArray(ledger.qualityGates)||ledger.qualityGates.length<3||ledger.qualityGates.length>12)fail('forge ledger quality gates is invalid');
if(!Array.isArray(ledger.queue)||ledger.queue.length>12)fail('forge ledger queue is invalid');
if(!Array.isArray(ledger.recentDecisions)||ledger.recentDecisions.length>20)fail('forge ledger recent decisions is invalid');
for(const [i,x] of ledger.queue.entries()){if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.id||''))fail(`forge ledger queue[${i}].id is invalid`);if(!x.title||!x.reason||!x.source||!allowedQueueStatuses.has(x.status))fail(`forge ledger queue[${i}] is incomplete`);}
for(const [i,x] of ledger.recentDecisions.entries()){if(!x.date||Number.isNaN(Date.parse(`${x.date}T12:00:00Z`))||!x.title||!x.summary||!allowedDecisionResults.has(x.result)||!Array.isArray(x.checks)||x.checks.length<1||x.checks.length>8)fail(`forge ledger recentDecisions[${i}] is invalid`);}
if(forbidden.test(ledgerText)||ledgerText.length>50000)fail('forge ledger contains forbidden or excessive content');

const index=read('index.html'),feedback=read('feedback-links.js');
const requiredFiles=['index.html','styles.css','forge-ledger.css','app.js','time-sense.js','gallery-preview.js','forge-ledger.js','feedback-links.js','registry/apps.json','registry/forge-ledger.json','.nojekyll'];
for(const match of index.matchAll(/<script defer src="\.\/(.+?\.js)"><\/script>/g))requiredFiles.push(match[1]);
for(const match of feedback.matchAll(/'([a-z0-9-]+\.js)'/g))requiredFiles.push(match[1]);
for(const file of [...new Set(requiredFiles)]){if(!fs.existsSync(path.join(root,file)))fail(`${file} is missing`);if(file.endsWith('.js'))try{execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});}catch{fail(`${file} has invalid JavaScript syntax`);}}
for(const file of ['orchard-graft-lab.js','harbor-pilot.js','loom-logic-studio.js','orbital-salvage-yard.js','evidence-chamber.js','museum-flow-lab.js','circuit-relay-lab.js','interpreter-booth.js','thermal-ops-lab.js','water-network-lab.js','wildfire-command.js','stage-blocking-lab.js','memory-palace-courier.js','signal-choir.js','constellation-surveyor.js','rail-yard-shunter.js','cipher-dispatch.js','dialect-drift-lab.js','bookbinding-studio.js','caption-control-room.js','pantry-planner.js','rigging-rescue-lab.js','floodplain-architect.js','seed-bank-steward.js','microgrid-dispatcher.js','animation-timing-studio.js'])if(!feedback.includes(file))fail(`feedback-links.js does not load ${file}`);
const contracts=[
 ['circuit-relay-lab.js',["version:'1.1.0'",'pathBoard()','Diagnostic scan','aria-label','prefers-reduced-motion:reduce']],
 ['interpreter-booth.js',["version:'1.0.0'",'Crisis summit','Repair trust','aria-live=polite','prefers-reduced-motion:reduce']],
 ['thermal-ops-lab.js',["version:'1.0.0'",'heat propagation','Install fan','Migrate workload','aria-live=polite','prefers-reduced-motion:reduce']],
 ['memory-palace-courier.js',["version:'1.0.0'",'Memory palace rooms','Use focus','aria-live=polite','prefers-reduced-motion:reduce']],
 ['signal-choir.js',["version:'1.0.0'",'Signal pads','Play pattern','Choir energy','aria-live=polite','prefers-reduced-motion:reduce']],
 ['constellation-surveyor.js',["version:'1.0.0'",'Practice: begin with Station 1','Telescope energy','Submit estimate','aria-live=polite','prefers-reduced-motion:reduce']],
 ['rail-yard-shunter.js',["version:'1.0.0'",'Rail yard grid','Couple / uncouple','Dispatcher hint','aria-live=polite','prefers-reduced-motion:reduce']],
 ['cipher-dispatch.js',["version:'1.0.0'",'Encrypted message','Spend token for clue','Submit decode','aria-live=polite','prefers-reduced-motion:reduce']],
 ['dialect-drift-lab.js',["version:'1.0.0'",'Island language communities','Mutual intelligibility','Preserve heritage word','aria-live=polite','prefers-reduced-motion:reduce']],
 ['bookbinding-studio.js',["version:'1.0.0'",'Book construction preview','Thread tension','Inspect book','aria-live=polite','prefers-reduced-motion:reduce']],
 ['caption-control-room.js',["version:'1.0.0'",'Caption preview','Use review token','Recover missed cue','aria-live="polite"','prefers-reduced-motion:reduce']],
 ['pantry-planner.js',["version:'1.0.0'",'Pantry shelves','Emergency donation','Serve households','aria-live="polite"','prefers-reduced-motion:reduce']],
 ['rigging-rescue-lab.js',["version:'1.0.0'",'Rescue rigging board','Safety reset','Test haul','aria-live="polite"','prefers-reduced-motion:reduce']],
 ['floodplain-architect.js',["version:'1.0.0'",'Floodplain planning grid','Forecast pulse','Emergency repair','aria-live="polite"','prefers-reduced-motion:reduce']],
 ['seed-bank-steward.js',["version:'1.0.0'",'Seed collection vault','Germination test','Emergency backup','aria-live="polite"','prefers-reduced-motion:reduce']],
 ['microgrid-dispatcher.js',["version:'1.0.0'",'Microgrid dispatch board','Emergency black start','Advance hour','aria-live="polite"','prefers-reduced-motion:reduce']],
 ['animation-timing-studio.js',["version:'1.0.0'",'Motion stage','Use mentor note','Submit brief','aria-live="polite"','prefers-reduced-motion:reduce']]
];
for(const [file,markers] of contracts){const text=read(file);for(const marker of markers)if(!text.includes(marker))fail(`${file} contract is missing ${marker}`);}
if(!index.includes('class="forge-ledger-section shell"')||!index.includes('id="forge-ledger-root" class="forge-ledger-root"'))fail('index.html is missing the responsive forge ledger contract');
if(!index.includes('class="dialog-frame"')||index.includes('class="dialog-shell"'))fail('index.html dialog shell is invalid');
const template=index.match(/<template id="app-card-template">([\s\S]*?)<\/template>/)?.[1]||'';
if(!template.includes('app-card-button'))fail('app card template must use one full-card button');
for(const c of ['app-icon','app-meta','app-name','app-summary','app-open'])if(!template.includes(c))fail(`app card ${c} must remain inside the full-card button`);
if(failed)process.exitCode=1;else console.log(`Validated ${registry.apps.length} registry apps, standalone games through Animation Timing Studio 1.0.0, feedback links, the responsive shell contract, the public forge ledger, and the static site.`);