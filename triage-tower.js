(() => {
  const APP = {
    name: 'Triage Tower',
    emoji: '🗼',
    category: 'play',
    version: '1.0.0',
    summary: 'Route urgent cases through scarce responders before the tower overloads.',
    description: 'A local queue-strategy game with incoming cases, severity, specialists, cooldowns, escalation, recovery, scoring, responsive canvas motion, touch, keyboard controls, and clean teardown.'
  };
  const LANES = [
    { id: 'ops', name: 'Ops', color: '#93c5fd' },
    { id: 'care', name: 'Care', color: '#f0abfc' },
    { id: 'field', name: 'Field', color: '#86efac' }
  ];
  const CASES = [
    { name: 'Silent outage', lane: 0, sev: 3 },
    { name: 'Angry customer', lane: 1, sev: 2 },
    { name: 'Broken handoff', lane: 2, sev: 2 },
    { name: 'Data drift', lane: 0, sev: 1 },
    { name: 'VIP blocker', lane: 1, sev: 3 },
    { name: 'Weather delay', lane: 2, sev: 1 }
  ];

  function installStyles() {
    if (document.querySelector('#triage-tower-styles')) return;
    const style = document.createElement('style');
    style.id = 'triage-tower-styles';
    style.textContent = `.triage-card{animation:triage-rise .34s ease both}.triage-game{max-width:920px;gap:14px}.triage-hud{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.triage-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.triage-stat span{display:block;color:var(--muted);font-size:.64rem;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.triage-stat strong{display:block;margin-top:4px;font-size:1rem}.triage-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#08111d;color:white;cursor:pointer;touch-action:manipulation;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.triage-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.triage-board canvas{display:block;width:100%;min-height:340px}.triage-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.triage-overlay strong{font-size:clamp(1.08rem,3vw,1.55rem)}.triage-overlay small{display:block;max-width:620px;color:rgba(255,255,255,.74)}.triage-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#dbeafe;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.triage-lanes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.triage-lane{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left}.triage-lane[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.triage-lane span{display:block;color:var(--muted);font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.triage-log{min-height:96px;padding:17px 19px}.triage-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:620px){.triage-hud,.triage-lanes{grid-template-columns:repeat(2,1fr)}.triage-board canvas{min-height:315px}.triage-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.triage-card{animation:none}}@keyframes triage-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-triage-tower-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.triageTowerCard = 'true';
    card.classList.add('triage-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openTriageTower);
    grid.append(node);
  }

  function openTriageTower() {
    const dialog = document.querySelector('#app-dialog');
    const stage = document.querySelector('#app-stage');
    const title = document.querySelector('#dialog-title');
    const category = document.querySelector('#dialog-category');
    const description = document.querySelector('#dialog-description');
    const feedback = document.querySelector('#dialog-feedback');
    if (!dialog || !stage || !title || !category || !description || !feedback) return;
    title.textContent = APP.name;
    category.textContent = `Play · ${APP.emoji}`;
    description.textContent = APP.description;
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Triage%20Tower';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function button(text, onClick, secondary = false) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = secondary ? 'button button-secondary' : 'button';
    item.textContent = text;
    item.addEventListener('click', onClick);
    return item;
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel triage-game';
    const hud = document.createElement('div');
    hud.className = 'triage-hud';
    hud.innerHTML = '<div class="triage-stat"><span>Wave</span><strong id="triage-wave">1 / 8</strong></div><div class="triage-stat"><span>Trust</span><strong id="triage-trust">72</strong></div><div class="triage-stat"><span>Focus</span><strong id="triage-focus">5</strong></div><div class="triage-stat"><span>Score</span><strong id="triage-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'triage-board';
    board.setAttribute('aria-label', 'Triage Tower board. Arrow keys choose lanes. Assign, stabilize, or defer cases before escalation overloads the tower.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="triage-overlay"><span><strong>Keep urgent cases moving before severity becomes collapse.</strong><small>Assign matching responders for points, stabilize one case when focus is available, or defer low-risk work to protect trust.</small></span><span class="triage-badge">Tap or keys</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const lanes = document.createElement('div');
    lanes.className = 'triage-lanes';
    const log = document.createElement('div');
    log.className = 'result-card triage-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    actions.append(button('Assign responder', assign), button('Stabilize', stabilize, true), button('Defer', deferCase, true), button('Next wave', nextWave), button('New run', reset, true));
    root.append(hud, board, lanes, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { wave: 1, trust: 72, focus: 5, score: 0, selected: 0, combo: 0, done: false, tick: 0, raf: 0, queues: [[], [], []] };

    function reset() {
      Object.assign(state, { wave: 1, trust: 72, focus: 5, score: 0, selected: 0, combo: 0, done: false, tick: 0, queues: [[], [], []] });
      seedWave();
      say('<strong>Tower online.</strong><small>Match responders to the right lane. Stabilize severe cases before escalation, but save enough focus for late waves.</small>');
      update();
    }
    function seedWave() {
      const count = Math.min(3 + Math.floor(state.wave / 2), 6);
      for (let i = 0; i < count; i += 1) {
        const base = CASES[(state.wave + i + state.score) % CASES.length];
        state.queues[base.lane].push({ name: base.name, sev: Math.min(5, base.sev + Math.floor(state.wave / 4)), age: 0 });
      }
    }
    function select(i) { state.selected = (i + LANES.length) % LANES.length; update(); }
    function currentQueue() { return state.queues[state.selected]; }
    function assign() {
      if (state.done) return;
      const queue = currentQueue();
      if (!queue.length) { say('<strong>No case in that lane.</strong><small>Choose a lane with waiting work or advance the wave.</small>'); return; }
      const item = queue.shift();
      const gain = item.sev * 9 + state.combo * 3;
      state.score += gain;
      state.combo += 1;
      state.trust = Math.min(100, state.trust + Math.max(1, 4 - item.sev));
      say(`<strong>${item.name} resolved for ${gain}.</strong><small>Combo ${state.combo}. Higher severity pays more, but waiting too long damages trust.</small>`);
      update();
    }
    function stabilize() {
      if (state.done) return;
      const queue = currentQueue();
      if (!queue.length) { say('<strong>No case to stabilize.</strong><small>Pick a busier lane before spending focus.</small>'); return; }
      if (state.focus <= 0) { say('<strong>No focus left.</strong><small>Assign or defer instead. Focus refreshes slightly after each wave.</small>'); return; }
      queue[0].sev = Math.max(1, queue[0].sev - 2);
      state.focus -= 1;
      state.score += 4;
      say(`<strong>${queue[0].name} stabilized.</strong><small>Severity dropped. It is safer now, but the queue still needs resolution.</small>`);
      update();
    }
    function deferCase() {
      if (state.done) return;
      const queue = currentQueue();
      if (!queue.length) { say('<strong>Nothing to defer.</strong><small>Use defer to clear low-risk clutter, not empty space.</small>'); return; }
      const item = queue.shift();
      const penalty = item.sev > 2 ? item.sev * 4 : 2;
      state.trust = Math.max(0, state.trust - penalty);
      state.combo = 0;
      say(`<strong>${item.name} deferred.</strong><small>Trust -${penalty}. Useful for low severity, dangerous for severe work.</small>`);
      update();
    }
    function nextWave() {
      if (state.done) return;
      let damage = 0;
      state.queues.forEach((queue) => queue.forEach((item) => { item.age += 1; item.sev += 1; damage += Math.max(0, item.sev - 3); }));
      state.trust = Math.max(0, state.trust - damage);
      state.focus = Math.min(7, state.focus + 1);
      if (state.trust <= 0 || state.wave >= 8) {
        state.done = true;
        const backlog = state.queues.reduce((sum, queue) => sum + queue.length, 0);
        state.score = Math.max(0, state.score + state.trust * 2 - backlog * 6);
        say(`<strong>Shift complete: ${state.score} points.</strong><small>Trust ${state.trust}. Backlog ${backlog}. Replay to protect focus and defer only safe cases.</small>`);
      } else {
        state.wave += 1;
        seedWave();
        say(`<strong>Wave ${state.wave} arrived.</strong><small>Escalation damage was ${damage}. New focus is ${state.focus}.</small>`);
      }
      update();
    }
    function say(html) { log.innerHTML = html; }
    function updateLanes() {
      lanes.replaceChildren();
      LANES.forEach((lane, i) => {
        const queue = state.queues[i];
        const urgent = queue.filter((item) => item.sev >= 4).length;
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'triage-lane';
        item.setAttribute('aria-pressed', String(i === state.selected));
        item.innerHTML = `<span>${lane.name}</span><strong>${queue.length} waiting · ${urgent} urgent</strong><small>${queue[0] ? `${queue[0].name}, severity ${queue[0].sev}` : 'Clear lane'}</small>`;
        item.addEventListener('click', () => select(i));
        lanes.append(item);
      });
    }
    function update() {
      hud.querySelector('#triage-wave').textContent = `${state.wave} / 8`;
      hud.querySelector('#triage-trust').textContent = state.trust;
      hud.querySelector('#triage-focus').textContent = state.focus;
      hud.querySelector('#triage-score').textContent = state.score;
      updateLanes();
      draw();
    }
    function draw() {
      const rect = board.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(315, Math.floor(rect.width * 0.52));
      canvas.width = Math.floor(w * ratio); canvas.height = Math.floor(h * ratio); canvas.style.height = `${h}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h); grad.addColorStop(0, '#172554'); grad.addColorStop(1, '#111827'); ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let y = 0; y < h; y += 28) ctx.fillRect(0, y + ((state.tick % 28) * (reduced ? 0 : 1)), w, 1);
      ctx.fillStyle = '#e5e7eb'; ctx.font = '800 15px system-ui'; ctx.fillText(`Wave ${state.wave}: dispatch floor`, 22, 32);
      LANES.forEach((lane, i) => {
        const x = 28 + i * ((w - 56) / 3); const bw = (w - 84) / 3; const q = state.queues[i];
        ctx.fillStyle = i === state.selected ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.roundRect(x, 70, bw, 178, 20); ctx.fill();
        ctx.fillStyle = lane.color; ctx.font = '900 16px system-ui'; ctx.fillText(lane.name, x + 18, 100);
        q.slice(0, 5).forEach((item, n) => {
          const y = 124 + n * 23;
          ctx.fillStyle = item.sev >= 4 ? '#fecaca' : 'rgba(255,255,255,.84)';
          ctx.fillRect(x + 18, y, Math.min(bw - 36, 26 + item.sev * 18), 12);
        });
        ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.font = '12px system-ui'; ctx.fillText(`${q.length} waiting`, x + 18, 224);
      });
      ctx.fillStyle = state.trust < 25 ? '#fecaca' : '#bbf7d0'; ctx.font = '800 13px system-ui'; ctx.fillText(`Trust ${state.trust} · Focus ${state.focus} · Combo ${state.combo}`, 22, h - 72);
    }
    function loop() { state.tick += 0.4; if (!reduced) draw(); state.raf = requestAnimationFrame(loop); }
    board.addEventListener('click', () => select(state.selected + 1));
    board.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); select(state.selected + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); select(state.selected - 1); }
      if (event.key.toLowerCase() === 'a' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); assign(); }
      if (event.key.toLowerCase() === 's') { event.preventDefault(); stabilize(); }
      if (event.key.toLowerCase() === 'd') { event.preventDefault(); deferCase(); }
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); nextWave(); }
    });
    window.addEventListener('resize', draw, { passive: true });
    const observer = new MutationObserver(() => { if (!stage.contains(root)) { cancelAnimationFrame(state.raf); window.removeEventListener('resize', draw); observer.disconnect(); } });
    observer.observe(stage, { childList: true });
    reset(); loop();
  }

  const start = () => setTimeout(initCard, 90);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
