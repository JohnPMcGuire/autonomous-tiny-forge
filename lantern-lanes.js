(() => {
  const APP = {
    name: 'Lantern Lanes', emoji: '🏮', category: 'play', version: '1.0.0',
    summary: 'Slip through moving lantern patrols, collect keys, and escape before the alarm fills.',
    description: 'A local stealth-timing mini-game with moving guard sight lines, keys, gates, smoke decoys, risk scoring, adaptive maps, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and clean teardown.'
  };
  const MAPS = [
    { name:'Market roofs', walls:[[2,2],[3,2],[6,2],[7,2],[2,5],[5,5],[6,5],[9,5]], start:[1,7], exit:[10,1], keys:[[1,1],[8,7]], guards:[{x:5,y:1,dir:1,path:[[5,1],[5,7]]},{x:10,y:6,dir:-1,path:[[10,6],[4,6]]}] },
    { name:'Canal arcade', walls:[[4,1],[4,2],[4,3],[7,4],[8,4],[9,4],[2,6],[3,6],[6,6]], start:[1,1], exit:[10,7], keys:[[9,1],[2,7]], guards:[{x:7,y:2,dir:1,path:[[7,2],[7,7]]},{x:2,y:4,dir:1,path:[[2,4],[10,4]]}] },
    { name:'Temple walk', walls:[[2,1],[2,2],[5,2],[6,2],[8,2],[8,3],[3,5],[4,5],[7,6],[8,6]], start:[10,7], exit:[1,1], keys:[[6,7],[10,2]], guards:[{x:5,y:7,dir:-1,path:[[5,7],[5,1]]},{x:9,y:4,dir:-1,path:[[9,4],[1,4]]}] }
  ];
  function installStyles() {
    if (document.querySelector('#lantern-lanes-styles')) return;
    const style = document.createElement('style');
    style.id = 'lantern-lanes-styles';
    style.textContent = `.lantern-card{animation:lantern-rise .32s ease both}.lantern-game{max-width:1040px;gap:14px}.lantern-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.lantern-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.lantern-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.lantern-stat strong{display:block;margin-top:4px;font-size:1rem}.lantern-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#111827;color:white;cursor:pointer;touch-action:manipulation;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.lantern-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.lantern-board canvas{display:block;width:100%;min-height:420px}.lantern-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.lantern-overlay strong{font-size:clamp(1.05rem,3vw,1.55rem)}.lantern-overlay small{display:block;max-width:720px;color:rgba(255,255,255,.76)}.lantern-badge{padding:7px 9px;border-radius:999px;background:rgba(251,191,36,.16);color:#fde68a;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.lantern-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.lantern-actions button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.lantern-actions button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.lantern-actions span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.lantern-log{min-height:118px;padding:17px 19px}.lantern-log strong{font-size:clamp(1.08rem,3vw,1.5rem)}@media(max-width:820px){.lantern-hud{grid-template-columns:repeat(2,1fr)}.lantern-actions{grid-template-columns:1fr}.lantern-board canvas{min-height:360px}.lantern-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.lantern-card{animation:none}}@keyframes lantern-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }
  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-lantern-lanes-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.lanternLanesCard = 'true';
    card.classList.add('lantern-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openLanternLanes);
    grid.append(node);
  }
  function openLanternLanes() {
    const dialog = document.querySelector('#app-dialog');
    const stage = document.querySelector('#app-stage');
    const title = document.querySelector('#dialog-title');
    const category = document.querySelector('#dialog-category');
    const description = document.querySelector('#dialog-description');
    const feedback = document.querySelector('#dialog-feedback');
    if (!dialog || !stage || !title || !category || !description || !feedback) return;
    title.textContent = APP.name; category.textContent = `Play · ${APP.emoji}`; description.textContent = APP.description;
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Lantern%20Lanes';
    stage.replaceChildren(); renderGame(stage, dialog); dialog.showModal();
  }
  function renderGame(stage, dialog) {
    const root = document.createElement('section'); root.className = 'tool-panel lantern-game';
    const hud = document.createElement('div'); hud.className = 'lantern-hud';
    hud.innerHTML = '<div class="lantern-stat"><span>Map</span><strong id="lantern-map">1 / 3</strong></div><div class="lantern-stat"><span>Keys</span><strong id="lantern-keys">0 / 2</strong></div><div class="lantern-stat"><span>Smoke</span><strong id="lantern-smoke">2</strong></div><div class="lantern-stat"><span>Alarm</span><strong id="lantern-alarm">0</strong></div><div class="lantern-stat"><span>Score</span><strong id="lantern-score">0</strong></div>';
    const board = document.createElement('button'); board.type = 'button'; board.className = 'lantern-board';
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="lantern-overlay"><span><strong>Move between the light.</strong><small>Collect two keys, read the patrol cones, spend smoke only when trapped, and reach the gate before alarm reaches six.</small></span><span class="lantern-badge">Stealth route</span></span>';
    const canvas = board.querySelector('canvas'); const ctx = canvas.getContext('2d');
    const actions = document.createElement('div'); actions.className = 'lantern-actions';
    const log = document.createElement('div'); log.className = 'result-card lantern-log'; log.setAttribute('aria-live', 'polite');
    const controls = document.createElement('div'); controls.className = 'tool-actions';
    const waitButton = makeButton('Wait for patrol', () => step(0,0)); const smokeButton = makeButton('Drop smoke', dropSmoke, true); const restartButton = makeButton('New run', reset, true);
    controls.append(waitButton, smokeButton, restartButton); root.append(hud, board, actions, log, controls); stage.append(root);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { mapIndex:0, player:{x:1,y:7}, keys:[], got:new Set(), guards:[], smoke:2, alarm:0, score:0, turn:0, done:false, raf:0, smokeCells:[] };
    dialog.addEventListener('close', teardown, { once:true });
    function makeButton(text, fn, secondary) { const b = document.createElement('button'); b.type = 'button'; b.className = secondary ? 'button button-secondary' : 'button'; b.textContent = text; b.addEventListener('click', fn); return b; }
    function say(html) { log.innerHTML = html; }
    function reset() { const m = MAPS[state.mapIndex]; state.player={x:m.start[0],y:m.start[1]}; state.keys=m.keys.map((k,i)=>({x:k[0],y:k[1],id:i})); state.got=new Set(); state.guards=m.guards.map((g)=>({x:g.x,y:g.y,dir:g.dir,path:g.path.map((p)=>({x:p[0],y:p[1]}))})); state.smoke=2; state.alarm=0; state.score=0; state.turn=0; state.done=false; state.smokeCells=[]; say(`<strong>${m.name}.</strong><small>Arrows or tap a nearby tile to move. Space waits. Drop smoke to hide one risky turn.</small>`); update(); }
    function wall(x,y) { return x < 0 || y < 0 || x > 11 || y > 8 || current().walls.some((w) => w[0] === x && w[1] === y); }
    function current() { return MAPS[state.mapIndex]; }
    function seen(x,y) { return state.guards.some((g) => cone(g).some((p) => p.x === x && p.y === y)) && !state.smokeCells.some((p) => p.x === x && p.y === y); }
    function cone(g) { const dx = g.path[0].x === g.path[1].x ? 0 : g.dir; const dy = g.path[0].y === g.path[1].y ? 0 : g.dir; const cells = []; for (let i=1;i<=3;i+=1) { const x=g.x+dx*i, y=g.y+dy*i; if (wall(x,y)) break; cells.push({x,y}); } return cells; }
    function moveGuards() { state.guards.forEach((g) => { const a=g.path[0], b=g.path[1]; if (a.x === b.x) { g.y += g.dir; if (g.y === a.y || g.y === b.y) g.dir *= -1; } else { g.x += g.dir; if (g.x === a.x || g.x === b.x) g.dir *= -1; } }); }
    function step(dx,dy) { if (state.done) return; const nx = state.player.x + dx, ny = state.player.y + dy; if (!wall(nx,ny)) state.player = {x:nx,y:ny}; else state.alarm += 1; state.turn += 1; state.smokeCells = state.smokeCells.filter((p) => p.life-- > 0); collect(); moveGuards(); if (seen(state.player.x,state.player.y)) state.alarm += 2; const m=current(); if (state.player.x === m.exit[0] && state.player.y === m.exit[1] && state.got.size === state.keys.length) return win(); if (state.alarm >= 6) return lose(); say(`<strong>${seen(state.player.x,state.player.y) ? 'Lanterns are searching.' : 'Still quiet.'}</strong><small>${state.keys.length - state.got.size} keys remain. Alarm rises faster inside a cone.</small>`); update(); }
    function collect() { state.keys.forEach((k) => { if (k.x === state.player.x && k.y === state.player.y && !state.got.has(k.id)) { state.got.add(k.id); state.score += 60; } }); }
    function dropSmoke() { if (state.done) return; if (state.smoke <= 0) { say('<strong>No smoke left.</strong><small>Wait, bait the patrol, or take a cleaner path.</small>'); return update(); } state.smoke -= 1; state.smokeCells.push({x:state.player.x,y:state.player.y,life:2}); state.score += 10; say('<strong>Smoke down.</strong><small>This tile hides you through the next guard sweep, but the escape bonus will be smaller.</small>'); update(); }
    function win() { state.done = true; const bonus = Math.max(0, 260 - state.turn * 8 - state.alarm * 20 + state.smoke * 35); state.score += bonus; say(`<strong>Gate reached: ${state.score} points.</strong><small>Bonus ${bonus}. The next map starts with tighter patrol geometry.</small>`); state.mapIndex = (state.mapIndex + 1) % MAPS.length; update(); }
    function lose() { state.done = true; say(`<strong>The alarm filled.</strong><small>Final score ${state.score}. Recover by using smoke earlier or waiting for a guard to face away.</small>`); update(); }
    function update() { hud.querySelector('#lantern-map').textContent = `${state.mapIndex + 1} / ${MAPS.length}`; hud.querySelector('#lantern-keys').textContent = `${state.got.size} / ${state.keys.length}`; hud.querySelector('#lantern-smoke').textContent = state.smoke; hud.querySelector('#lantern-alarm').textContent = `${state.alarm} / 6`; hud.querySelector('#lantern-score').textContent = state.score; actions.replaceChildren(); [['↑','Move north',0,-1],['←','Move west',-1,0],['→','Move east',1,0],['↓','Move south',0,1],['•','Wait',0,0],['S','Smoke',0,0]].forEach((a) => { const b=document.createElement('button'); b.type='button'; b.innerHTML=`<span>${a[0]}</span><strong>${a[1]}</strong><small>${a[1] === 'Smoke' ? 'Hide the current tile.' : 'Advance one patrol beat.'}</small>`; b.addEventListener('click', () => a[1] === 'Smoke' ? dropSmoke() : step(a[2],a[3])); actions.append(b); }); draw(); }
    function resize() { const rect = canvas.getBoundingClientRect(); const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(Math.max(360, rect.height || 420) * dpr); ctx.setTransform(dpr,0,0,dpr,0,0); draw(); }
    function draw() { const w = canvas.clientWidth || 900, h = canvas.clientHeight || 420, cols=12, rows=9, pad=24, cell=Math.min((w-pad*2)/cols,(h-105)/rows), ox=(w-cell*cols)/2, oy=22; ctx.clearRect(0,0,w,h); const grad=ctx.createLinearGradient(0,0,w,h); grad.addColorStop(0,'#1f2937'); grad.addColorStop(1,'#030712'); ctx.fillStyle=grad; ctx.fillRect(0,0,w,h); for(let y=0;y<rows;y+=1) for(let x=0;x<cols;x+=1){ ctx.fillStyle=(x+y)%2?'rgba(255,255,255,.05)':'rgba(255,255,255,.08)'; ctx.fillRect(ox+x*cell,oy+y*cell,cell-1,cell-1); } current().walls.forEach((p)=>{ ctx.fillStyle='#374151'; ctx.fillRect(ox+p[0]*cell,oy+p[1]*cell,cell-1,cell-1); }); state.guards.forEach((g)=>{ cone(g).forEach((p)=>{ ctx.fillStyle='rgba(251,191,36,.22)'; ctx.fillRect(ox+p.x*cell,oy+p.y*cell,cell-1,cell-1); }); }); state.smokeCells.forEach((p)=>{ ctx.fillStyle='rgba(209,213,219,.55)'; ctx.beginPath(); ctx.arc(ox+(p.x+.5)*cell,oy+(p.y+.5)*cell,cell*.42,0,Math.PI*2); ctx.fill(); }); state.keys.forEach((k)=>{ if(state.got.has(k.id)) return; ctx.fillStyle='#fde68a'; ctx.beginPath(); ctx.arc(ox+(k.x+.5)*cell,oy+(k.y+.5)*cell,cell*.18,0,Math.PI*2); ctx.fill(); }); const exit=current().exit; ctx.strokeStyle=state.got.size===state.keys.length?'#86efac':'#64748b'; ctx.lineWidth=4; ctx.strokeRect(ox+exit[0]*cell+5,oy+exit[1]*cell+5,cell-11,cell-11); state.guards.forEach((g)=>{ ctx.fillStyle='#f97316'; ctx.beginPath(); ctx.arc(ox+(g.x+.5)*cell,oy+(g.y+.5)*cell,cell*.28,0,Math.PI*2); ctx.fill(); }); ctx.fillStyle=seen(state.player.x,state.player.y)?'#fecaca':'#bfdbfe'; ctx.beginPath(); ctx.arc(ox+(state.player.x+.5)*cell,oy+(state.player.y+.5)*cell,cell*.3,0,Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.84)'; ctx.font='700 12px system-ui'; ctx.fillText('Reach the outlined gate after both keys. Tap adjacent squares, use arrows, Space waits, S drops smoke.',24,h-36); }
    function onKey(event) { const k=event.key; if(k==='ArrowUp') step(0,-1); else if(k==='ArrowDown') step(0,1); else if(k==='ArrowLeft') step(-1,0); else if(k==='ArrowRight') step(1,0); else if(k===' ' || k==='Enter') step(0,0); else if(k.toLowerCase()==='s') dropSmoke(); else return; event.preventDefault(); }
    function onPointer(event) { const rect=canvas.getBoundingClientRect(), w=canvas.clientWidth||900, h=canvas.clientHeight||420, cell=Math.min((w-48)/12,(h-105)/9), ox=(w-cell*12)/2, oy=22; const x=Math.floor((event.clientX-rect.left-ox)/cell), y=Math.floor((event.clientY-rect.top-oy)/cell); const dx=Math.max(-1,Math.min(1,x-state.player.x)), dy=Math.max(-1,Math.min(1,y-state.player.y)); if(Math.abs(dx)+Math.abs(dy)<=1) step(dx,dy); }
    function loop() { if (!reduced && !state.done) { draw(); state.raf = requestAnimationFrame(loop); } }
    function teardown() { cancelAnimationFrame(state.raf); window.removeEventListener('resize', resize); board.removeEventListener('keydown', onKey); board.removeEventListener('click', onPointer); }
    board.addEventListener('keydown', onKey); board.addEventListener('click', onPointer); window.addEventListener('resize', resize); reset(); requestAnimationFrame(resize); state.raf=requestAnimationFrame(loop);
  }
  const start = () => setTimeout(initCard, 0);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
})();
