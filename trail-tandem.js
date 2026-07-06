(() => {
  const APP = {
    name: 'Trail Tandem', emoji: '🥾', category: 'play', version: '1.0.0',
    summary: 'Guide two hikers through one trail while rope length, stamina, weather, and rescues compete.',
    description: 'A local cooperative path-planning puzzle with two linked hikers, rope tension, stamina, checkpoints, weather turns, hazards, rescues, adaptive maps, scoring, responsive canvas rendering, touch and keyboard controls, optional local audio, reduced-motion behavior, and teardown.'
  };
  const $ = (s) => document.querySelector(s);
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  function style() {
    if ($('#trail-tandem-styles')) return;
    const s = document.createElement('style');
    s.id = 'trail-tandem-styles';
    s.textContent = `.trail-card{animation:trail-rise .24s ease both}.trail-game{max-width:1040px;gap:14px}.trail-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.trail-stat{border:1px solid var(--line);border-radius:15px;background:#fff;padding:10px 12px}.trail-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.trail-stat strong{display:block;margin-top:4px}.trail-board{border:0;border-radius:26px;background:#0a1712;color:white;padding:0;overflow:hidden;touch-action:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.trail-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.trail-board canvas{display:block;width:100%;height:min(58vh,500px);min-height:350px}.trail-console{display:grid;grid-template-columns:1fr 1fr;gap:10px}.trail-panel{border:1px solid var(--line);border-radius:18px;background:#fff;padding:13px}.trail-tools,.trail-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.trail-chip,.trail-legend span{border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--ink);padding:8px 11px;font-weight:900}.trail-chip.is-active{background:#111827;color:#fff}.trail-log{min-height:94px;padding:17px 19px}@media(max-width:760px){.trail-hud{grid-template-columns:repeat(2,1fr)}.trail-console{grid-template-columns:1fr}.trail-board canvas{height:56vh;min-height:340px}}@media(prefers-reduced-motion:reduce){.trail-card{animation:none}.trail-board canvas{min-height:330px}}@keyframes trail-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}`;
    document.head.append(s);
  }
  function addCard() {
    const grid = $('#app-grid'), tpl = $('#app-card-template');
    if (!grid || !tpl || $('[data-trail-card]')) return;
    const f = $('.filter.is-active')?.dataset.filter || 'all';
    if (f !== 'all' && f !== APP.category) return;
    style();
    const node = tpl.content.cloneNode(true), card = node.querySelector('.app-card');
    card.dataset.category = APP.category; card.dataset.trailCard = 'true'; card.classList.add('trail-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `${label(APP.category)} · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const btn = node.querySelector('.app-card-button');
    btn.setAttribute('aria-label', `Open ${APP.name}`);
    btn.addEventListener('click', open);
    grid.append(node);
  }
  function boot() {
    style(); addCard();
    document.querySelectorAll('.filter').forEach((b) => {
      if (b.dataset.trailRefresh) return;
      b.dataset.trailRefresh = '1';
      b.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }
  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage'), title = $('#dialog-title'), cat = $('#dialog-category'), desc = $('#dialog-description'), fb = $('#dialog-feedback');
    if (!dialog || !stage) return;
    title.textContent = APP.name; cat.textContent = `${label(APP.category)} · ${APP.emoji}`; desc.textContent = APP.description;
    fb.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Trail%20Tandem';
    stage.replaceChildren(); game(stage, dialog); dialog.showModal();
  }
  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel trail-game';
    root.innerHTML = `<div class="trail-hud"><div class="trail-stat"><span>Map</span><strong id="tt-map">1 / 5</strong></div><div class="trail-stat"><span>Active</span><strong id="tt-active">Scout</strong></div><div class="trail-stat"><span>Stamina</span><strong id="tt-stamina">36</strong></div><div class="trail-stat"><span>Rope</span><strong id="tt-rope">0 / 3</strong></div><div class="trail-stat"><span>Rescues</span><strong id="tt-rescue">2</strong></div><div class="trail-stat"><span>Score</span><strong id="tt-score">0</strong></div></div><button class="trail-board" type="button" aria-label="Trail Tandem board. Use arrows or swipe to move the active hiker, Tab or S to switch hikers, R to use a rescue, N for a new expedition, and Enter to wait."><canvas aria-hidden="true"></canvas></button><div class="trail-console"><div class="trail-panel"><strong>Plan as a pair</strong><p>Reach every flag, then get both hikers to camp. Rocks cost stamina, water requires the pair to stay close, fog shifts after waits, and long rope tension blocks moves.</p><div class="trail-tools"><button class="button button-secondary trail-chip is-active" type="button" data-act="switch">Switch hiker</button><button class="button button-secondary trail-chip" type="button" data-act="rescue">Use rescue</button><button class="button button-secondary trail-chip" type="button" data-act="wait">Wait</button></div></div><div class="trail-panel"><strong>Trail key</strong><div class="trail-legend"><span>Flag: +90</span><span>Camp: finish</span><span>Rock: -2</span><span>Water: close pair</span><span>Fog: shifts</span><span>Night unlock: 750</span></div></div></div><div class="result-card trail-log" aria-live="polite"></div><div class="tool-actions"></div>`;
    stage.append(root);
    const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d'), board = root.querySelector('.trail-board'), log = root.querySelector('.trail-log'), actions = root.querySelector('.tool-actions'), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { size: 8, map: 1, maps: 5, active: 0, stamina: 36, rescues: 2, score: 0, night: false, hikers: [], camp: null, flags: [], grid: [], fog: 0, anim: 0, audio: false, ac: null, pointer: null };
    actions.append(btn('New expedition', reset, true), btn('Night route', night, true), btn('Sound off', sound, true));
    root.querySelector('[data-act="switch"]').addEventListener('click', switcher);
    root.querySelector('[data-act="rescue"]').addEventListener('click', rescue);
    root.querySelector('[data-act="wait"]').addEventListener('click', wait);
    board.addEventListener('keydown', key); board.addEventListener('pointerdown', down); board.addEventListener('pointerup', up); dialog.addEventListener('close', tear, { once: true });
    reset();
    function btn(t, f, sec) { const b = document.createElement('button'); b.type = 'button'; b.className = sec ? 'button button-secondary' : 'button'; b.textContent = t; b.addEventListener('click', f); return b; }
    function say(h) { log.innerHTML = h; }
    function reset() { cancelAnimationFrame(state.anim); Object.assign(state, { map: 1, active: 0, stamina: state.night ? 30 : 36, rescues: 2, flags: [], fog: 0 }); makeMap(); say('<strong>Trailhead ready.</strong><small>Collect flags, keep the rope under control, and bring both hikers to camp.</small>'); paint(); draw(); }
    function makeMap() {
      const n = state.size, seed = state.map * 31 + (state.night ? 17 : 0);
      state.grid = Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => {
        const v = (x * 19 + y * 23 + seed) % 17;
        return v < 2 ? 'rock' : v === 3 ? 'water' : v === 4 || (state.night && v === 5) ? 'fog' : 'trail';
      }));
      state.hikers = [{ x: 0, y: 0, name: 'Scout' }, { x: 1, y: 0, name: 'Guide' }];
      state.camp = { x: n - 1, y: n - 1 };
      state.flags = [{ x: 2 + (state.map % 2), y: 2, got: false }, { x: 5, y: 2 + (state.map % 3), got: false }, { x: 3, y: 5, got: false }];
      [state.hikers[0], state.hikers[1], state.camp, ...state.flags].forEach((p) => { state.grid[p.y][p.x] = 'trail'; });
    }
    function switcher() { state.active = 1 - state.active; say(`<strong>${state.hikers[state.active].name} leads.</strong><small>Switch leaders to solve rope and terrain problems.</small>`); paint(); draw(); }
    function rope() { const [a, b] = state.hikers; return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
    function move(dx, dy) {
      const h = state.hikers[state.active], nx = h.x + dx, ny = h.y + dy;
      if (nx < 0 || ny < 0 || nx >= state.size || ny >= state.size) return say('<strong>Trail edge.</strong><small>Choose another step.</small>');
      const old = { x: h.x, y: h.y }; h.x = nx; h.y = ny;
      if (rope() > 3) { Object.assign(h, old); return say('<strong>Rope tension stopped the move.</strong><small>Bring the other hiker closer or switch leaders.</small>'); }
      const tile = state.grid[ny][nx];
      if (tile === 'water' && rope() > 1) { Object.assign(h, old); return say('<strong>Water crossing needs a close belay.</strong><small>Move the pair within one tile first.</small>'); }
      const cost = 1 + (tile === 'rock' ? 2 : 0) + (tile === 'fog' ? 1 + state.fog : 0) + (state.night ? 1 : 0);
      state.stamina -= cost;
      for (const f of state.flags) if (!f.got && f.x === nx && f.y === ny) { f.got = true; state.score += 90 + state.stamina; beep(660); say('<strong>Flag reached.</strong><small>Now decide whether to spend stamina on a safer route or push to camp.</small>'); }
      if (state.stamina < 0) { state.score = Math.max(0, state.score - 70); return say('<strong>The pair ran out of stamina.</strong><small>Use a rescue or start a new expedition with shorter routes.</small>'); }
      checkFinish(); fogTurn(); paint(); animate();
    }
    function wait() { state.stamina -= state.night ? 2 : 1; fogTurn(); say('<strong>The team waited.</strong><small>Fog shifted. Waiting can help timing but costs stamina.</small>'); checkFinish(); paint(); animate(); }
    function fogTurn() { state.fog = (state.fog + 1) % 3; }
    function rescue() { if (state.rescues < 1) return say('<strong>No rescues left.</strong><small>Finish with careful switches and waits.</small>'); state.rescues -= 1; state.stamina += 8; state.hikers[1 - state.active] = { ...state.hikers[state.active] }; state.score = Math.max(0, state.score - 40); say('<strong>Rescue used.</strong><small>The trailing hiker regrouped at the leader. It saved stamina but cost score.</small>'); beep(300); paint(); draw(); }
    function checkFinish() { const done = state.flags.every((f) => f.got), both = state.hikers.every((h) => h.x === state.camp.x && h.y === state.camp.y); if (done && both) { const gain = 180 + state.stamina * 8 + state.rescues * 60 - state.map * 10; state.score += gain; if (state.map >= state.maps) say(`<strong>Expedition complete: ${state.score}.</strong><small>${state.score >= 750 ? 'Night route is unlocked for this session.' : 'Score 750 to unlock night route.'}</small>`); else { state.map += 1; state.stamina += state.night ? 12 : 16; makeMap(); say('<strong>Camp reached.</strong><small>A harder map opened with the remaining score and lessons intact.</small>'); } beep(840); } }
    function night() { if (!state.night && state.score < 750) return say('<strong>Night route locked.</strong><small>Finish a 750-point expedition to unlock low-stamina maps.</small>'); state.night = !state.night; reset(); say(`<strong>${state.night ? 'Night' : 'Day'} route ready.</strong><small>${state.night ? 'Every step costs more and fog is denser.' : 'Daylight restored.'}</small>`); }
    function key(e) { const k = e.key.toLowerCase(); if (k === 'arrowup') { e.preventDefault(); move(0, -1); } if (k === 'arrowdown') { e.preventDefault(); move(0, 1); } if (k === 'arrowleft') { e.preventDefault(); move(-1, 0); } if (k === 'arrowright') { e.preventDefault(); move(1, 0); } if (k === 'tab' || k === 's') { e.preventDefault(); switcher(); } if (k === 'r') { e.preventDefault(); rescue(); } if (k === 'enter' || k === ' ') { e.preventDefault(); wait(); } if (k === 'n') { e.preventDefault(); reset(); } }
    function down(e) { state.pointer = { x: e.clientX, y: e.clientY }; board.setPointerCapture?.(e.pointerId); }
    function up(e) { if (!state.pointer) return; const dx = e.clientX - state.pointer.x, dy = e.clientY - state.pointer.y; state.pointer = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return switcher(); Math.abs(dx) > Math.abs(dy) ? move(dx > 0 ? 1 : -1, 0) : move(0, dy > 0 ? 1 : -1); }
    function sound(e) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return say('<strong>Sound is not available here.</strong><small>The trail still works silently.</small>'); state.audio = !state.audio; e.currentTarget.textContent = state.audio ? 'Sound on' : 'Sound off'; e.currentTarget.setAttribute('aria-pressed', String(state.audio)); if (state.audio) { state.ac ||= new AC(); state.ac.resume(); beep(520); } }
    function beep(f) { if (!state.audio || !state.ac) return; const now = state.ac.currentTime, o = state.ac.createOscillator(), g = state.ac.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0.001, now); g.gain.exponentialRampToValueAtTime(0.07, now + 0.02); g.gain.exponentialRampToValueAtTime(0.001, now + 0.18); o.connect(g).connect(state.ac.destination); o.start(now); o.stop(now + 0.2); }
    function paint() { root.querySelector('#tt-map').textContent = `${state.map} / ${state.maps}`; root.querySelector('#tt-active').textContent = state.hikers[state.active]?.name || 'Scout'; root.querySelector('#tt-stamina').textContent = state.stamina; root.querySelector('#tt-rope').textContent = `${rope()} / 3`; root.querySelector('#tt-rescue').textContent = state.rescues; root.querySelector('#tt-score').textContent = state.score; }
    function animate() { if (reduced) return draw(); let n = 0; const tick = () => { draw(n / 8); if (++n < 8) state.anim = requestAnimationFrame(tick); }; cancelAnimationFrame(state.anim); tick(); }
    function draw(p = 1) { const r = board.getBoundingClientRect(), dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); canvas.width = Math.max(320, r.width * dpr); canvas.height = Math.max(320, r.height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); const w = canvas.width / dpr, h = canvas.height / dpr, pad = 18, cell = Math.min((w - pad * 2) / state.size, (h - pad * 2) / state.size), ox = (w - cell * state.size) / 2, oy = (h - cell * state.size) / 2; ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#0a1712'; ctx.fillRect(0, 0, w, h); for (let y = 0; y < state.size; y++) for (let x = 0; x < state.size; x++) { const tile = state.grid[y][x]; ctx.fillStyle = tile === 'rock' ? '#4d4436' : tile === 'water' ? '#1f6f8b' : tile === 'fog' ? (state.fog === 2 ? '#55636b' : '#40504b') : '#123524'; round(ox + x * cell + 2, oy + y * cell + 2, cell - 4, cell - 4, 10); ctx.fill(); }
      ctx.lineWidth = 5; ctx.strokeStyle = '#f5d36b'; ctx.beginPath(); pos(state.hikers[0]); const a = pos(state.hikers[0]), b = pos(state.hikers[1]); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      for (const f of state.flags) { const q = pos(f); ctx.fillStyle = f.got ? '#8ee6b2' : '#ffd166'; ctx.beginPath(); ctx.arc(q.x, q.y, cell * .19, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#07120e'; ctx.fillRect(q.x - 2, q.y - cell * .25, 4, cell * .5); }
      const c = pos(state.camp); ctx.fillStyle = '#ffffff'; round(c.x - cell * .22, c.y - cell * .22, cell * .44, cell * .44, 8); ctx.fill();
      state.hikers.forEach((hh, i) => { const q = pos(hh); ctx.fillStyle = i === state.active ? '#ff7a59' : '#9ad7ff'; ctx.beginPath(); ctx.arc(q.x, q.y, cell * (i === state.active ? .26 : .22) + p * 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#07120e'; ctx.font = '700 13px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(i ? 'G' : 'S', q.x, q.y); });
      function pos(o) { return { x: ox + o.x * cell + cell / 2, y: oy + o.y * cell + cell / 2 }; } function round(x, y, ww, hh, rr) { ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.arcTo(x + ww, y, x + ww, y + hh, rr); ctx.arcTo(x + ww, y + hh, x, y + hh, rr); ctx.arcTo(x, y + hh, x, y, rr); ctx.arcTo(x, y, x + ww, y, rr); ctx.closePath(); }
    }
    function tear() { cancelAnimationFrame(state.anim); if (state.ac?.state !== 'closed') state.ac?.close(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
