(() => {
  const APP = {
    name: 'Front Page Desk', emoji: '🗞️', category: 'play', version: '1.0.0',
    summary: 'Place stories, fact-check risky leads, and ship a balanced front page before deadline.',
    description: 'A local newsroom layout strategy game with story placement, audience mix, trust risk, fact-check tokens, layout bonuses, deadline pressure, scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and animation teardown.'
  };
  const STORY_POOL = [
    { t:'Transit audit', beat:'Civic', size:2, reach:18, trust:13, risk:1 }, { t:'Bakery comeback', beat:'Human', size:1, reach:15, trust:9, risk:0 },
    { t:'Storm drains', beat:'Civic', size:2, reach:14, trust:16, risk:1 }, { t:'Mascot mystery', beat:'Culture', size:1, reach:22, trust:4, risk:2 },
    { t:'Clinic hours', beat:'Service', size:1, reach:11, trust:17, risk:0 }, { t:'Festival map', beat:'Culture', size:2, reach:19, trust:10, risk:1 },
    { t:'Bridge delay', beat:'Civic', size:2, reach:16, trust:15, risk:2 }, { t:'Lost recipe', beat:'Human', size:1, reach:13, trust:8, risk:0 },
    { t:'School robotics', beat:'Human', size:2, reach:17, trust:12, risk:0 }, { t:'Water rates', beat:'Service', size:2, reach:12, trust:18, risk:1 },
    { t:'Gallery heist?', beat:'Culture', size:1, reach:24, trust:3, risk:3 }, { t:'Park survey', beat:'Service', size:1, reach:10, trust:15, risk:0 }
  ];
  const BEATS = ['Civic','Human','Service','Culture'];
  function installStyles() {
    if (document.querySelector('#front-page-desk-styles')) return;
    const style = document.createElement('style');
    style.id = 'front-page-desk-styles';
    style.textContent = `.front-card{animation:front-rise .32s ease both}.front-game{max-width:1050px;gap:14px}.front-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.front-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.front-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.front-stat strong{display:block;margin-top:4px;font-size:1rem}.front-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#1c160f;color:white;cursor:pointer;touch-action:manipulation;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}.front-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.front-board canvas{display:block;width:100%;min-height:420px}.front-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.front-overlay strong{font-size:clamp(1.05rem,3vw,1.55rem)}.front-overlay small{display:block;max-width:720px;color:rgba(255,255,255,.76)}.front-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.13);color:#fde68a;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.front-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.front-actions button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.front-actions button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.front-actions span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.front-log{min-height:118px;padding:17px 19px}.front-log strong{font-size:clamp(1.08rem,3vw,1.5rem)}@media(max-width:820px){.front-hud{grid-template-columns:repeat(2,1fr)}.front-actions{grid-template-columns:1fr}.front-board canvas{min-height:360px}.front-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.front-card{animation:none}}@keyframes front-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }
  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-front-page-desk-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.frontPageDeskCard = 'true';
    card.classList.add('front-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openFrontPageDesk);
    grid.append(node);
  }
  function openFrontPageDesk() {
    const dialog = document.querySelector('#app-dialog');
    const stage = document.querySelector('#app-stage');
    const title = document.querySelector('#dialog-title');
    const category = document.querySelector('#dialog-category');
    const description = document.querySelector('#dialog-description');
    const feedback = document.querySelector('#dialog-feedback');
    if (!dialog || !stage || !title || !category || !description || !feedback) return;
    title.textContent = APP.name; category.textContent = `Play · ${APP.emoji}`; description.textContent = APP.description;
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Front%20Page%20Desk';
    stage.replaceChildren(); renderGame(stage, dialog); dialog.showModal();
  }
  function renderGame(stage, dialog) {
    const root = document.createElement('section'); root.className = 'tool-panel front-game';
    const hud = document.createElement('div'); hud.className = 'front-hud';
    hud.innerHTML = '<div class="front-stat"><span>Slot</span><strong id="front-slot">1 / 9</strong></div><div class="front-stat"><span>Checks</span><strong id="front-checks">4</strong></div><div class="front-stat"><span>Deadline</span><strong id="front-deadline">9</strong></div><div class="front-stat"><span>Trust</span><strong id="front-trust">0</strong></div><div class="front-stat"><span>Reach</span><strong id="front-reach">0</strong></div>';
    const board = document.createElement('button'); board.type = 'button'; board.className = 'front-board';
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="front-overlay"><span><strong>Build a front page with a spine.</strong><small>Choose stories, place them on the grid, spend checks on risky leads, and balance civic value with audience pull before the edition closes.</small></span><span class="front-badge">Layout desk</span></span>';
    const canvas = board.querySelector('canvas'); const ctx = canvas.getContext('2d');
    const actions = document.createElement('div'); actions.className = 'front-actions';
    const log = document.createElement('div'); log.className = 'result-card front-log'; log.setAttribute('aria-live', 'polite');
    const controls = document.createElement('div'); controls.className = 'tool-actions';
    const placeButton = makeButton('Place story', () => place()); const publishButton = makeButton('Publish edition', publish, true); const restartButton = makeButton('New desk', reset, true);
    controls.append(placeButton, publishButton, restartButton); root.append(hud, board, actions, log, controls); stage.append(root);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const choices = [
      { id:'place', name:'Place', key:'1', help:'Add the selected story to the highlighted slot' },
      { id:'check', name:'Fact-check', key:'2', help:'Spend one check to cut risk and improve trust' },
      { id:'cut', name:'Cut', key:'3', help:'Reject the selected story and draw a replacement' },
      { id:'boost', name:'Feature boost', key:'4', help:'Spend deadline to raise reach on a safe story' }
    ];
    const state = { selected:'place', cursor:0, storyIndex:0, checks:4, deadline:9, edition:[], deck:[], slot:0, score:0, done:false, raf:0, pulse:0 };
    dialog.addEventListener('close', teardown, { once:true });
    function makeButton(text, fn, secondary) { const b = document.createElement('button'); b.type = 'button'; b.className = secondary ? 'button button-secondary' : 'button'; b.textContent = text; b.addEventListener('click', fn); return b; }
    function say(html) { log.innerHTML = html; }
    function shuffle(list) { return list.map((item) => ({ item, r: Math.random() })).sort((a,b) => a.r - b.r).map(({ item }) => ({ ...item })); }
    function reset() { state.selected='place'; state.cursor=0; state.storyIndex=0; state.checks=4; state.deadline=9; state.edition=[]; state.deck=shuffle(STORY_POOL); state.slot=0; state.score=0; state.done=false; state.pulse=0; say('<strong>The morning budget meeting starts.</strong><small>Review the story queue. Fill nine slots, but leave enough time and trust to survive risky leads.</small>'); update(); }
    function current() { return state.deck[state.storyIndex % state.deck.length]; }
    function choose(id) { if (state.done) return; state.selected = id; const item = choices.find((choice) => choice.id === id); say(`<strong>${item.name} selected.</strong><small>${item.help}. Use arrows to move the slot or story, Enter to act.</small>`); update(); }
    function act() { if (state.selected === 'place') place(); if (state.selected === 'check') check(); if (state.selected === 'cut') cut(); if (state.selected === 'boost') boost(); }
    function occupied(slot) { return state.edition.some((story) => story.slot === slot); }
    function place() { if (state.done) return; if (occupied(state.slot)) { say('<strong>That slot is already set.</strong><small>Move to an empty space or publish if the page has enough structure.</small>'); return update(); } const s = current(); if (state.deadline <= 0) return publish(); state.edition.push({ ...s, slot:state.slot }); state.deadline -= 1; state.storyIndex += 1; state.slot = nextEmpty(); state.pulse = 1; say(`<strong>${s.t} placed.</strong><small>${s.beat} story added. Risk ${s.risk}, trust ${s.trust}, reach ${s.reach}.</small>`); if (state.edition.length >= 9) publish(); else update(); }
    function check() { if (state.done) return; const s = current(); if (state.checks <= 0) { say('<strong>No checks left.</strong><small>Cut the story, place it with risk, or publish before time runs out.</small>'); return update(); } state.checks -= 1; state.deadline -= 1; s.risk = Math.max(0, s.risk - 1); s.trust += 5; s.reach = Math.max(5, s.reach - 2); state.pulse = 1; say(`<strong>${s.t} tightened.</strong><small>Risk drops, trust rises, and the headline gets less flashy.</small>`); update(); }
    function cut() { if (state.done) return; const s = current(); state.deadline -= 1; state.storyIndex += 1; state.pulse = 1; say(`<strong>${s.t} cut from the queue.</strong><small>You spent time to avoid a weak fit. A replacement lead is on deck.</small>`); if (state.deadline < 0) publish(); else update(); }
    function boost() { if (state.done) return; const s = current(); if (s.risk > 0) { say('<strong>Boost blocked.</strong><small>Risky leads need checking before the big treatment.</small>'); return update(); } if (state.deadline <= 1) { say('<strong>Not enough deadline.</strong><small>The design desk cannot feature this without delaying publication.</small>'); return update(); } state.deadline -= 2; s.reach += 8; s.trust += 1; state.pulse = 1; say(`<strong>${s.t} gets the feature treatment.</strong><small>Reach rises, but the desk spends precious layout time.</small>`); update(); }
    function nextEmpty() { for (let i = 0; i < 9; i += 1) { const n = (state.slot + 1 + i) % 9; if (!occupied(n)) return n; } return state.slot; }
    function totals() { const beats = new Set(state.edition.map((s) => s.beat)); const trust = state.edition.reduce((sum,s) => sum + s.trust - s.risk * 9, 0); const reach = state.edition.reduce((sum,s) => sum + s.reach, 0); const balance = beats.size * 18; const adjacency = state.edition.reduce((sum,s) => state.edition.some((n) => n !== s && n.beat === s.beat && Math.abs(n.slot - s.slot) === 1) ? sum + 3 : sum, 0); return { beats, trust, reach, balance, adjacency }; }
    function publish() { if (state.done) return; state.done = true; const t = totals(); const filled = state.edition.length * 12; const deadline = Math.max(0, state.deadline) * 7; const score = Math.max(0, t.trust + t.reach + t.balance + t.adjacency + filled + deadline); state.score = score; const verdict = score > 360 ? 'Prize desk' : score > 285 ? 'Strong edition' : score > 210 ? 'Respectable run' : 'Rewrite needed'; say(`<strong>${verdict}: ${score} points.</strong><small>${state.edition.length} stories, ${t.beats.size} beats, trust ${t.trust}, reach ${t.reach}. Replay for a cleaner balance of safety, urgency, and audience pull.</small>`); update(); }
    function update() {
      const t = totals(); hud.querySelector('#front-slot').textContent = state.done ? 'Closed' : `${state.slot + 1} / 9`; hud.querySelector('#front-checks').textContent = state.checks; hud.querySelector('#front-deadline').textContent = state.deadline; hud.querySelector('#front-trust').textContent = t.trust; hud.querySelector('#front-reach').textContent = t.reach;
      actions.replaceChildren(); choices.forEach((choice) => { const b = document.createElement('button'); b.type='button'; b.setAttribute('aria-pressed', String(state.selected === choice.id)); b.innerHTML = `<span>${choice.key}</span><strong>${choice.name}</strong><small>${choice.help}</small>`; b.addEventListener('click', () => choose(choice.id)); actions.append(b); }); draw();
    }
    function resize() { const rect = canvas.getBoundingClientRect(); const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(Math.max(360, rect.height || 420) * dpr); ctx.setTransform(dpr,0,0,dpr,0,0); draw(); }
    function draw() {
      const w = canvas.clientWidth || 900, h = canvas.clientHeight || 420; ctx.clearRect(0,0,w,h); const g = ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,'#2f2417'); g.addColorStop(1,'#0f172a'); ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
      const margin = 24, pageW = Math.min(w * .58, 520), pageH = h - 72, x0 = margin, y0 = 24, cellW = pageW / 3, cellH = pageH / 3; ctx.fillStyle = '#f8f1df'; ctx.fillRect(x0,y0,pageW,pageH); ctx.strokeStyle = 'rgba(30,20,12,.35)'; ctx.lineWidth = 2;
      for (let i=1;i<3;i+=1){ ctx.beginPath(); ctx.moveTo(x0 + i*cellW,y0); ctx.lineTo(x0+i*cellW,y0+pageH); ctx.moveTo(x0,y0+i*cellH); ctx.lineTo(x0+pageW,y0+i*cellH); ctx.stroke(); }
      if (!state.done) { const cx = x0 + (state.slot % 3) * cellW, cy = y0 + Math.floor(state.slot / 3) * cellH; ctx.fillStyle = 'rgba(245,158,11,.22)'; ctx.fillRect(cx+4,cy+4,cellW-8,cellH-8); }
      state.edition.forEach((s) => { const cx = x0 + (s.slot % 3)*cellW, cy = y0 + Math.floor(s.slot/3)*cellH; ctx.fillStyle = beatColor(s.beat); ctx.fillRect(cx+9,cy+9,cellW-18,cellH-18); ctx.fillStyle = '#111827'; ctx.font = '700 14px system-ui'; wrap(s.t,cx+16,cy+30,cellW-32,17); ctx.font = '800 11px system-ui'; ctx.fillText(s.beat, cx+16, cy+cellH-18); });
      const sideX = x0 + pageW + 24; ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fillRect(sideX,24,w-sideX-24,h-72); ctx.fillStyle = '#fff7ed'; ctx.font = '900 18px system-ui'; ctx.fillText('Story queue', sideX+18, 54); const s = current(); if (s) { ctx.fillStyle = beatColor(s.beat); ctx.fillRect(sideX+18,76,w-sideX-60,92); ctx.fillStyle = '#111827'; ctx.font = '900 17px system-ui'; wrap(s.t, sideX+32, 105, w-sideX-88, 20); ctx.font = '800 12px system-ui'; ctx.fillText(`${s.beat} · risk ${s.risk} · trust ${s.trust} · reach ${s.reach}`, sideX+32, 150); }
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '12px system-ui'; wrap('Arrow keys move the highlighted slot or story queue. Number keys choose the desk action. Enter applies it.', sideX+18, 205, w-sideX-50, 17);
    }
    function beatColor(beat) { return { Civic:'#bfdbfe', Human:'#fecaca', Service:'#bbf7d0', Culture:'#fde68a' }[beat] || '#e5e7eb'; }
    function wrap(text,x,y,max,line){ const words = text.split(' '); let row=''; for (const word of words) { const test = row ? `${row} ${word}` : word; if (ctx.measureText(test).width > max && row) { ctx.fillText(row,x,y); row=word; y += line; } else row = test; } if (row) ctx.fillText(row,x,y); }
    function onKey(event) { if (event.key >= '1' && event.key <= '4') { choose(choices[Number(event.key)-1].id); event.preventDefault(); } if (event.key === 'Enter' || event.key === ' ') { act(); event.preventDefault(); } if (event.key === 'ArrowRight') { state.slot = (state.slot + 1) % 9; update(); event.preventDefault(); } if (event.key === 'ArrowLeft') { state.slot = (state.slot + 8) % 9; update(); event.preventDefault(); } if (event.key === 'ArrowDown') { state.storyIndex = (state.storyIndex + 1) % state.deck.length; update(); event.preventDefault(); } if (event.key === 'ArrowUp') { state.storyIndex = (state.storyIndex + state.deck.length - 1) % state.deck.length; update(); event.preventDefault(); } }
    function onPointer(event) { const rect = canvas.getBoundingClientRect(); const x = event.clientX - rect.left, y = event.clientY - rect.top; const pageW = Math.min(rect.width * .58, 520), cellW = pageW / 3, cellH = (rect.height - 72) / 3; if (x > 24 && x < 24 + pageW && y > 24 && y < rect.height - 48) { state.slot = Math.max(0, Math.min(8, Math.floor((x-24)/cellW) + Math.floor((y-24)/cellH)*3)); act(); } else { state.storyIndex = (state.storyIndex + 1) % state.deck.length; update(); } }
    function loop() { if (!reduced && !state.done) { if (state.pulse > 0) state.pulse -= .04; draw(); state.raf = requestAnimationFrame(loop); } }
    function teardown() { cancelAnimationFrame(state.raf); window.removeEventListener('resize', resize); board.removeEventListener('keydown', onKey); board.removeEventListener('click', onPointer); }
    board.addEventListener('keydown', onKey); board.addEventListener('click', onPointer); window.addEventListener('resize', resize); reset(); requestAnimationFrame(resize); state.raf = requestAnimationFrame(loop);
  }
  const start = () => setTimeout(initCard, 0);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
})();
