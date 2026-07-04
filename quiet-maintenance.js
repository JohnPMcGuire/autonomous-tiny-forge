(() => {
  const APP = {
    name: 'Quiet Maintenance', emoji: '🧰', category: 'useful', version: '1.0.0',
    summary: 'Plan calm repair shifts across linked building systems before small faults cascade.',
    description: 'A local maintenance-planning mini-product with linked systems, inspection uncertainty, parts and time budgets, preventive repair, escalation risk, comfort scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and animation teardown.'
  };
  const SYSTEMS = [
    { id:'roof', name:'Roof drains', x:.18, y:.22, health:68, hidden:22, load:8, part:1 },
    { id:'boiler', name:'Boiler loop', x:.48, y:.24, health:62, hidden:30, load:12, part:2 },
    { id:'lift', name:'Elevator', x:.78, y:.28, health:74, hidden:18, load:10, part:2 },
    { id:'lights', name:'Hall lights', x:.27, y:.68, health:80, hidden:14, load:6, part:1 },
    { id:'doors', name:'Access doors', x:.57, y:.70, health:70, hidden:26, load:9, part:1 },
    { id:'pump', name:'Sump pump', x:.83, y:.74, health:58, hidden:34, load:14, part:2 }
  ];
  const EVENTS = [
    { title:'Cold front', text:'Heat load rises and weak plumbing complains first.', hit:['boiler','pump'], damage:9 },
    { title:'Roof grit', text:'Drain strain spreads toward doors and hallways.', hit:['roof','doors'], damage:8 },
    { title:'Weekend move-in', text:'Elevator and access systems take extra wear.', hit:['lift','doors'], damage:10 },
    { title:'Damp night', text:'Pump trouble can pull nearby lights down with it.', hit:['pump','lights'], damage:9 },
    { title:'Quiet complaints', text:'Comfort dips when hidden faults stay unknown.', hit:['lights','boiler'], damage:7 }
  ];
  const ACTIONS = [
    { id:'inspect', key:'1', name:'Inspect', help:'Spend one hour to reveal hidden wear and reduce surprise risk.' },
    { id:'repair', key:'2', name:'Repair', help:'Spend parts and two hours to restore the selected system.' },
    { id:'prevent', key:'3', name:'Prevent', help:'Spend one part and one hour for a smaller repair plus future protection.' },
    { id:'defer', key:'4', name:'Defer', help:'Save resources, but the selected system quietly decays.' }
  ];
  function installStyles() {
    if (document.querySelector('#quiet-maintenance-styles')) return;
    const style = document.createElement('style');
    style.id = 'quiet-maintenance-styles';
    style.textContent = `.quiet-card{animation:quiet-rise .32s ease both}.quiet-game{max-width:1050px;gap:14px}.quiet-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.quiet-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.quiet-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.quiet-stat strong{display:block;margin-top:4px;font-size:1rem}.quiet-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#10231d;color:white;cursor:pointer;touch-action:manipulation;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}.quiet-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.quiet-board canvas{display:block;width:100%;min-height:420px}.quiet-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.quiet-overlay strong{font-size:clamp(1.05rem,3vw,1.55rem)}.quiet-overlay small{display:block;max-width:730px;color:rgba(255,255,255,.76)}.quiet-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.13);color:#bbf7d0;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.quiet-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.quiet-actions button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.quiet-actions button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.quiet-actions span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.quiet-log{min-height:120px;padding:17px 19px}.quiet-log strong{font-size:clamp(1.08rem,3vw,1.5rem)}@media(max-width:820px){.quiet-hud{grid-template-columns:repeat(2,1fr)}.quiet-actions{grid-template-columns:1fr}.quiet-board canvas{min-height:360px}.quiet-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.quiet-card{animation:none}}@keyframes quiet-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }
  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-quiet-maintenance-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.quietMaintenanceCard = 'true';
    card.classList.add('quiet-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Useful · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openQuietMaintenance);
    grid.append(node);
  }
  function openQuietMaintenance() {
    const dialog = document.querySelector('#app-dialog');
    const stage = document.querySelector('#app-stage');
    const title = document.querySelector('#dialog-title');
    const category = document.querySelector('#dialog-category');
    const description = document.querySelector('#dialog-description');
    const feedback = document.querySelector('#dialog-feedback');
    if (!dialog || !stage || !title || !category || !description || !feedback) return;
    title.textContent = APP.name; category.textContent = `Useful · ${APP.emoji}`; description.textContent = APP.description;
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Quiet%20Maintenance';
    stage.replaceChildren(); renderGame(stage, dialog); dialog.showModal();
  }
  function renderGame(stage, dialog) {
    const root = document.createElement('section'); root.className = 'tool-panel quiet-game';
    const hud = document.createElement('div'); hud.className = 'quiet-hud';
    hud.innerHTML = '<div class="quiet-stat"><span>Shift</span><strong id="quiet-shift">1 / 6</strong></div><div class="quiet-stat"><span>Hours</span><strong id="quiet-hours">8</strong></div><div class="quiet-stat"><span>Parts</span><strong id="quiet-parts">7</strong></div><div class="quiet-stat"><span>Comfort</span><strong id="quiet-comfort">100</strong></div><div class="quiet-stat"><span>Score</span><strong id="quiet-score">0</strong></div>';
    const board = document.createElement('button'); board.type = 'button'; board.className = 'quiet-board';
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="quiet-overlay"><span><strong>Keep the building boring.</strong><small>Inspect hidden wear, repair linked systems, prevent cascades, and decide when to defer without letting comfort collapse.</small></span><span class="quiet-badge">Maintenance plan</span></span>';
    const canvas = board.querySelector('canvas'); const ctx = canvas.getContext('2d');
    const actions = document.createElement('div'); actions.className = 'quiet-actions';
    const log = document.createElement('div'); log.className = 'result-card quiet-log'; log.setAttribute('aria-live', 'polite');
    const controls = document.createElement('div'); controls.className = 'tool-actions';
    const nextButton = makeButton('Next shift', nextShift); const finishButton = makeButton('Close report', finish, true); const restartButton = makeButton('New building', reset, true);
    controls.append(nextButton, finishButton, restartButton); root.append(hud, board, actions, log, controls); stage.append(root);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { selected:'inspect', cursor:0, shift:1, hours:8, parts:7, comfort:100, score:0, systems:[], event:EVENTS[0], done:false, raf:0, shield:new Set(), revealed:new Set() };
    dialog.addEventListener('close', teardown, { once:true });
    function makeButton(text, fn, secondary) { const b = document.createElement('button'); b.type = 'button'; b.className = secondary ? 'button button-secondary' : 'button'; b.textContent = text; b.addEventListener('click', fn); return b; }
    function say(html) { log.innerHTML = html; }
    function reset() { state.selected='inspect'; state.cursor=0; state.shift=1; state.hours=8; state.parts=7; state.comfort=100; state.score=0; state.systems=SYSTEMS.map((s) => ({ ...s, health:s.health + Math.floor(Math.random()*9)-4 })); state.event=EVENTS[Math.floor(Math.random()*EVENTS.length)]; state.done=false; state.shield=new Set(); state.revealed=new Set(); say(`<strong>${state.event.title} on the forecast.</strong><small>${state.event.text} Select a system, choose an action, and spend the quiet hours before complaints become emergencies.</small>`); update(); }
    function active() { return state.systems[state.cursor]; }
    function choose(id) { if (state.done) return; state.selected=id; const action = ACTIONS.find((item) => item.id === id); say(`<strong>${action.name} selected.</strong><small>${action.help} Use arrows or tap the plan to pick a system, then press Enter.</small>`); update(); }
    function act() { if (state.selected === 'inspect') inspect(); if (state.selected === 'repair') repair(); if (state.selected === 'prevent') prevent(); if (state.selected === 'defer') defer(); }
    function spend(hours, parts) { if (state.hours < hours) { say('<strong>Not enough quiet hours.</strong><small>Start the next shift or close the report with the current condition.</small>'); return false; } if (state.parts < parts) { say('<strong>Not enough parts.</strong><small>Inspect, defer, or start the next shift for a small resupply.</small>'); return false; } state.hours -= hours; state.parts -= parts; return true; }
    function inspect() { if (!spend(1,0)) return update(); const s = active(); state.revealed.add(s.id); s.hidden = Math.max(0, s.hidden - 18); s.health += 4; state.score += 6; say(`<strong>${s.name} inspected.</strong><small>Hidden wear is now ${s.hidden}. Small adjustments improved visible condition without burning parts.</small>`); update(); }
    function repair() { const s = active(); if (!spend(2,s.part)) return update(); const hiddenBonus = state.revealed.has(s.id) ? 12 : 0; s.health = Math.min(100, s.health + 28 + hiddenBonus); s.hidden = Math.max(0, s.hidden - 16); state.score += 18 + hiddenBonus; say(`<strong>${s.name} repaired.</strong><small>${state.revealed.has(s.id) ? 'Inspection made the repair cleaner.' : 'It helped, but some hidden wear may remain.'}</small>`); update(); }
    function prevent() { const s = active(); if (!spend(1,1)) return update(); s.health = Math.min(100, s.health + 14); s.hidden = Math.max(0, s.hidden - 8); state.shield.add(s.id); state.score += 12; say(`<strong>${s.name} protected.</strong><small>Preventive work will absorb the next forecast hit on this system.</small>`); update(); }
    function defer() { const s = active(); s.health -= 7; s.hidden += 6; state.score += 2; say(`<strong>${s.name} deferred.</strong><small>Resources stay intact, but hidden work moves to a future shift.</small>`); update(); }
    function nextShift() { if (state.done) return; applyEvent(); decayLinks(); state.shift += 1; state.hours = 8; state.parts = Math.min(9, state.parts + 2); state.event = EVENTS[(state.shift + Math.floor(Math.random()*EVENTS.length)) % EVENTS.length]; if (state.shift > 6 || state.comfort <= 0) return finish(); say(`<strong>Shift ${state.shift} begins: ${state.event.title}.</strong><small>${state.event.text} Parts restocked by two. Protected systems keep their shield until hit.</small>`); update(); }
    function applyEvent() { state.event.hit.forEach((id) => { const s = state.systems.find((item) => item.id === id); if (!s) return; const blocked = state.shield.has(id); s.health -= blocked ? Math.floor(state.event.damage/2) : state.event.damage; s.hidden += blocked ? 2 : 7; if (blocked) state.shield.delete(id); }); state.comfort = Math.max(0, state.comfort - state.systems.reduce((sum,s) => sum + (s.health < 50 ? 5 : 0) + (s.hidden > 35 ? 3 : 0), 0)); }
    function decayLinks() { state.systems.forEach((s) => { s.health -= Math.floor(s.load / 5); if (s.health < 45) neighbors(s).forEach((n) => { n.health -= 3; }); }); }
    function neighbors(system) { return state.systems.filter((s) => s !== system && Math.hypot(s.x-system.x, s.y-system.y) < .36); }
    function finish() { if (state.done) return; state.done = true; applyEvent(); const average = Math.round(state.systems.reduce((sum,s) => sum + s.health - s.hidden * .35, 0) / state.systems.length); const finalScore = Math.max(0, Math.round(state.score + state.comfort * 2 + average * 3 + state.parts * 6 + state.shield.size * 8)); state.score = finalScore; const verdict = finalScore > 520 ? 'Quietly excellent' : finalScore > 420 ? 'Stable plan' : finalScore > 310 ? 'Watch list' : 'Deferred too much'; say(`<strong>${verdict}: ${finalScore} points.</strong><small>Average condition ${average}, comfort ${state.comfort}, parts ${state.parts}. Replay to find the calmest mix of inspection, prevention, and repair.</small>`); update(); }
    function update() {
      hud.querySelector('#quiet-shift').textContent = state.done ? 'Closed' : `${Math.min(state.shift,6)} / 6`; hud.querySelector('#quiet-hours').textContent = state.hours; hud.querySelector('#quiet-parts').textContent = state.parts; hud.querySelector('#quiet-comfort').textContent = state.comfort; hud.querySelector('#quiet-score').textContent = state.score;
      actions.replaceChildren(); ACTIONS.forEach((action) => { const b = document.createElement('button'); b.type='button'; b.setAttribute('aria-pressed', String(state.selected === action.id)); b.innerHTML = `<span>${action.key}</span><strong>${action.name}</strong><small>${action.help}</small>`; b.addEventListener('click', () => choose(action.id)); actions.append(b); }); draw();
    }
    function resize() { const rect = canvas.getBoundingClientRect(); const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(Math.max(360, rect.height || 420) * dpr); ctx.setTransform(dpr,0,0,dpr,0,0); draw(); }
    function draw() {
      const w = canvas.clientWidth || 900, h = canvas.clientHeight || 420; ctx.clearRect(0,0,w,h); const g = ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,'#14352d'); g.addColorStop(1,'#111827'); ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3; for (let i=0;i<state.systems.length;i+=1) for (let j=i+1;j<state.systems.length;j+=1) { const a=state.systems[i], b=state.systems[j]; if (Math.hypot(a.x-b.x,a.y-b.y)<.36) { ctx.beginPath(); ctx.moveTo(a.x*w,a.y*(h-70)+24); ctx.lineTo(b.x*w,b.y*(h-70)+24); ctx.stroke(); } }
      state.systems.forEach((s, index) => { const x=s.x*w, y=s.y*(h-70)+24, r=index===state.cursor?34:28; ctx.fillStyle = state.shield.has(s.id) ? '#bbf7d0' : s.health > 70 ? '#bfdbfe' : s.health > 48 ? '#fde68a' : '#fecaca'; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.lineWidth = index===state.cursor ? 5 : 2; ctx.strokeStyle = index===state.cursor ? '#f59e0b' : 'rgba(255,255,255,.7)'; ctx.stroke(); ctx.fillStyle = '#111827'; ctx.font = '900 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(String(Math.max(0, Math.round(s.health))), x, y+4); ctx.fillStyle = 'rgba(255,255,255,.86)'; ctx.font = '700 12px system-ui'; ctx.fillText(s.name, x, y+r+18); if (state.revealed.has(s.id)) ctx.fillText(`hidden ${s.hidden}`, x, y+r+34); });
      const s = active(); ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(24,h-92,w-48,54); ctx.fillStyle = '#ecfeff'; ctx.font = '900 16px system-ui'; ctx.fillText(`${s.name}: health ${Math.max(0, Math.round(s.health))}${state.revealed.has(s.id) ? `, hidden wear ${s.hidden}` : ', hidden wear unknown'}`, 42, h-58); ctx.font = '12px system-ui'; ctx.fillStyle = 'rgba(255,255,255,.74)'; ctx.fillText('Tap a system, use arrow keys to move, number keys to choose an action, and Enter to apply it.', 42, h-36);
    }
    function onKey(event) { if (event.key >= '1' && event.key <= '4') { choose(ACTIONS[Number(event.key)-1].id); event.preventDefault(); } if (event.key === 'Enter' || event.key === ' ') { act(); event.preventDefault(); } if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { state.cursor = (state.cursor + 1) % state.systems.length; update(); event.preventDefault(); } if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { state.cursor = (state.cursor + state.systems.length - 1) % state.systems.length; update(); event.preventDefault(); } }
    function onPointer(event) { const rect = canvas.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top - 24) / Math.max(1, rect.height - 70); let best = 0, dist = Infinity; state.systems.forEach((s,i) => { const d = Math.hypot(s.x-x, s.y-y); if (d < dist) { dist = d; best = i; } }); state.cursor = best; if (dist < .12) act(); update(); }
    function loop() { if (!reduced && !state.done) { draw(); state.raf = requestAnimationFrame(loop); } }
    function teardown() { cancelAnimationFrame(state.raf); window.removeEventListener('resize', resize); board.removeEventListener('keydown', onKey); board.removeEventListener('click', onPointer); }
    board.addEventListener('keydown', onKey); board.addEventListener('click', onPointer); window.addEventListener('resize', resize); reset(); requestAnimationFrame(resize); state.raf = requestAnimationFrame(loop);
  }
  const start = () => setTimeout(initCard, 0);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
})();