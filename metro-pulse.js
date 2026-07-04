(() => {
  const APP = {
    name: 'Metro Pulse', emoji: '🚇', category: 'play', version: '1.0.0',
    summary: 'Dispatch trains, clear station surges, and keep a small metro network from gridlocking.',
    description: 'A local transit-dispatch strategy game with passenger queues, train capacity, route timing, hold and express tradeoffs, adaptive rush waves, scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and animation teardown.'
  };
  const STATIONS = [
    { x:.15,y:.24,n:'West' },{ x:.35,y:.18,n:'Museum' },{ x:.60,y:.22,n:'Park' },{ x:.82,y:.30,n:'East' },
    { x:.20,y:.70,n:'Harbor' },{ x:.45,y:.58,n:'Central' },{ x:.68,y:.66,n:'Market' },{ x:.86,y:.76,n:'Depot' }
  ];
  const LINES = [
    { name:'Blue', color:'#60a5fa', path:[0,1,2,3,2,1] },
    { name:'Green', color:'#86efac', path:[4,5,6,7,6,5] },
    { name:'Gold', color:'#facc15', path:[0,5,2,6,3,6,2,5] }
  ];
  function installStyles() {
    if (document.querySelector('#metro-pulse-styles')) return;
    const style = document.createElement('style');
    style.id = 'metro-pulse-styles';
    style.textContent = `.metro-card{animation:metro-rise .32s ease both}.metro-game{max-width:1040px;gap:14px}.metro-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.metro-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.metro-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.metro-stat strong{display:block;margin-top:4px;font-size:1rem}.metro-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#07111f;color:white;cursor:pointer;touch-action:manipulation;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.metro-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.metro-board canvas{display:block;width:100%;min-height:430px}.metro-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.metro-overlay strong{font-size:clamp(1.05rem,3vw,1.55rem)}.metro-overlay small{display:block;max-width:720px;color:rgba(255,255,255,.76)}.metro-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.13);color:#bae6fd;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.metro-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.metro-actions button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.metro-actions button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.metro-actions span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.metro-log{min-height:116px;padding:17px 19px}.metro-log strong{font-size:clamp(1.08rem,3vw,1.5rem)}@media(max-width:820px){.metro-hud{grid-template-columns:repeat(2,1fr)}.metro-actions{grid-template-columns:1fr}.metro-board canvas{min-height:360px}.metro-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.metro-card{animation:none}}@keyframes metro-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }
  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-metro-pulse-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.metroPulseCard = 'true';
    card.classList.add('metro-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openMetroPulse);
    grid.append(node);
  }
  function openMetroPulse() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Metro%20Pulse';
    stage.replaceChildren();
    renderGame(stage, dialog);
    dialog.showModal();
  }
  function renderGame(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel metro-game';
    const hud = document.createElement('div');
    hud.className = 'metro-hud';
    hud.innerHTML = '<div class="metro-stat"><span>Minute</span><strong id="metro-minute">0 / 18</strong></div><div class="metro-stat"><span>Pulse</span><strong id="metro-pulse">Morning</strong></div><div class="metro-stat"><span>Tokens</span><strong id="metro-tokens">6</strong></div><div class="metro-stat"><span>Moved</span><strong id="metro-moved">0</strong></div><div class="metro-stat"><span>Score</span><strong id="metro-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'metro-board';
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="metro-overlay"><span><strong>Keep the network pulsing.</strong><small>Dispatch lines, hold trains to load more riders, or spend express tokens to skip bottlenecks before platforms overflow.</small></span><span class="metro-badge">Dispatch map</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const actions = document.createElement('div');
    actions.className = 'metro-actions';
    const log = document.createElement('div');
    log.className = 'result-card metro-log';
    log.setAttribute('aria-live', 'polite');
    const controls = document.createElement('div');
    controls.className = 'tool-actions';
    const stepButton = makeButton('Run minute', tick);
    const restartButton = makeButton('New rush', reset, true);
    controls.append(stepButton, restartButton);
    root.append(hud, board, actions, log, controls);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const choices = [
      { id:'dispatch', name:'Dispatch', cost:1, key:'1', help:'Launches or advances the chosen line' },
      { id:'hold', name:'Hold', cost:1, key:'2', help:'Loads extra riders at the selected train station' },
      { id:'express', name:'Express', cost:2, key:'3', help:'Skips one station to relieve distant pressure' },
      { id:'repair', name:'Repair', cost:2, key:'4', help:'Clears one delay and restores trust' }
    ];
    const state = { minute:0, max:18, tokens:6, moved:0, score:0, trust:5, selected:'dispatch', cursor:0, trains:[], queues:[], delayed:null, done:false, raf:0, pulse:0 };
    dialog.addEventListener('close', teardown, { once:true });
    function makeButton(text, fn, secondary) { const b = document.createElement('button'); b.type = 'button'; b.className = secondary ? 'button button-secondary' : 'button'; b.textContent = text; b.addEventListener('click', fn); return b; }
    function say(html) { log.innerHTML = html; }
    function reset() {
      state.minute = 0; state.tokens = 6; state.moved = 0; state.score = 0; state.trust = 5; state.selected = 'dispatch'; state.cursor = 0; state.done = false; state.delayed = null; state.pulse = 0;
      state.queues = STATIONS.map((_, i) => 1 + (i === 5 ? 3 : i % 3));
      state.trains = LINES.map((line, i) => ({ line:i, pos:0, load:0, capacity:5, held:false, express:false }));
      say('<strong>Morning pulse begins.</strong><small>Select a line or station, choose an action, then run minutes. Central and transfer stations surge first.</small>');
      update();
    }
    function choose(id) {
      if (state.done) return;
      state.selected = id;
      const item = choices.find((choice) => choice.id === id);
      say(`<strong>${item.name} selected.</strong><small>${item.help}. Use arrows to change the target, Enter to act, or tap the map.</small>`);
      update();
    }
    function spend(cost) {
      if (state.tokens < cost) { say('<strong>Not enough dispatch tokens.</strong><small>Run a minute, repair less, or accept one controlled delay before spending again.</small>'); return false; }
      state.tokens -= cost; return true;
    }
    function act(target) {
      if (state.done) return;
      const choice = choices.find((item) => item.id === state.selected);
      if (!spend(choice.cost)) return update();
      const train = state.trains[target % state.trains.length];
      const stationIndex = currentStation(train);
      if (state.selected === 'dispatch') {
        train.held = false;
        train.express = false;
        moveTrain(train, 1);
        say(`<strong>${LINES[train.line].name} line dispatched.</strong><small>It loaded riders at ${STATIONS[stationIndex].n} and moved to the next platform.</small>`);
      }
      if (state.selected === 'hold') {
        const loaded = loadTrain(train, stationIndex, 3);
        train.held = true;
        state.score += loaded * 7;
        say(`<strong>${LINES[train.line].name} holds for loading.</strong><small>${loaded} riders boarded. Holding can save a platform, but too much holding slows the pulse.</small>`);
      }
      if (state.selected === 'express') {
        loadTrain(train, stationIndex, 2);
        moveTrain(train, 2);
        train.express = true;
        state.score += 18;
        say(`<strong>${LINES[train.line].name} runs express.</strong><small>It skips a stop to reach pressure faster, leaving some local demand behind.</small>`);
      }
      if (state.selected === 'repair') {
        const peak = busiestStation();
        state.queues[peak] = Math.max(0, state.queues[peak] - 3);
        state.trust = Math.min(6, state.trust + 1);
        state.delayed = null;
        state.score += 24;
        say(`<strong>Platform staff recover ${STATIONS[peak].n}.</strong><small>Repair clears the worst queue and restores one trust, but costs scarce dispatch attention.</small>`);
      }
      state.pulse = 1;
      update();
    }
    function currentStation(train) { return LINES[train.line].path[train.pos % LINES[train.line].path.length]; }
    function loadTrain(train, station, max) {
      const room = train.capacity - train.load;
      const load = Math.min(room, state.queues[station], max);
      state.queues[station] -= load;
      train.load += load;
      return load;
    }
    function unloadTrain(train) {
      const off = Math.min(train.load, 1 + Math.floor(Math.random() * 3));
      train.load -= off;
      state.moved += off;
      state.score += off * 12;
    }
    function moveTrain(train, steps) {
      const before = currentStation(train);
      loadTrain(train, before, 2);
      train.pos = (train.pos + steps) % LINES[train.line].path.length;
      unloadTrain(train);
    }
    function busiestStation() { return state.queues.reduce((best, q, i) => q > state.queues[best] ? i : best, 0); }
    function surge() {
      const rush = state.minute < 6 ? [5,1,2] : state.minute < 12 ? [5,6,3] : [0,4,7];
      STATIONS.forEach((_, i) => { state.queues[i] += Math.random() < .34 ? 1 : 0; });
      rush.forEach((i) => { state.queues[i] += 1 + (state.minute % 4 === 0 ? 1 : 0); });
      if (state.minute === 7 || state.minute === 13) {
        state.delayed = Math.floor(Math.random() * state.trains.length);
        state.trust -= 1;
        say(`<strong>${LINES[state.delayed].name} line delay.</strong><small>Repair can clear it, or you can route around the slowdown.</small>`);
      }
    }
    function tick() {
      if (state.done) return;
      state.minute += 1;
      state.tokens = Math.min(8, state.tokens + 2);
      surge();
      state.trains.forEach((train, i) => {
        if (state.delayed === i) return;
        if (!train.held && Math.random() < .72) moveTrain(train, 1);
        train.held = false;
      });
      const overflow = state.queues.filter((q) => q > 8).length;
      if (overflow) { state.trust -= overflow; state.score -= overflow * 20; }
      if (state.trust <= 0) return finish(false, '<strong>Trust collapsed.</strong><small>Too many platforms overflowed. Try repairing earlier or holding trains at transfer stations.</small>');
      if (state.minute >= state.max) return finish(true, '<strong>Rush cleared.</strong><small>The network survived the surge. Replay to move more riders with fewer repair tokens.</small>');
      say(`<strong>Minute ${state.minute} complete.</strong><small>${overflow ? `${overflow} platforms overflowed. ` : ''}Busiest stop: ${STATIONS[busiestStation()].n}. Dispatch the right line before queues spike.</small>`);
      update();
    }
    function finish(win, html) {
      state.done = true;
      state.score += win ? state.trust * 60 + state.tokens * 12 : 0;
      say(html);
      update();
    }
    function update() {
      hud.querySelector('#metro-minute').textContent = `${state.minute} / ${state.max}`;
      hud.querySelector('#metro-pulse').textContent = state.minute < 6 ? 'Morning' : state.minute < 12 ? 'Transfer' : 'Evening';
      hud.querySelector('#metro-tokens').textContent = `${state.tokens} · trust ${state.trust}`;
      hud.querySelector('#metro-moved').textContent = String(state.moved);
      hud.querySelector('#metro-score').textContent = String(Math.max(0, state.score));
      actions.replaceChildren(...choices.map((choice) => {
        const button = document.createElement('button');
        button.type = 'button'; button.setAttribute('aria-pressed', String(state.selected === choice.id));
        button.innerHTML = `<span>${choice.key}</span>${choice.name}<small>${choice.cost} token${choice.cost > 1 ? 's' : ''}</small>`;
        button.addEventListener('click', () => choose(choice.id));
        return button;
      }));
      draw();
    }
    function coords(i) { const rect = canvas.getBoundingClientRect(); return { x: STATIONS[i].x * rect.width, y: STATIONS[i].y * rect.height }; }
    function draw() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(320, Math.floor(rect.width || 900));
      const h = Math.max(320, Math.floor(rect.height || 430));
      canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.clearRect(0,0,w,h);
      const g = ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,'#07111f'); g.addColorStop(1,'#172554'); ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
      LINES.forEach((line) => {
        ctx.strokeStyle = line.color; ctx.globalAlpha = .7; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath();
        line.path.forEach((s, idx) => { const p = { x: STATIONS[s].x*w, y: STATIONS[s].y*h }; if (!idx) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); });
        ctx.stroke(); ctx.globalAlpha = 1;
      });
      STATIONS.forEach((s, i) => {
        const x = s.x*w, y = s.y*h, q = state.queues[i];
        ctx.fillStyle = i === state.cursor ? '#fef3c7' : '#e0f2fe'; ctx.beginPath(); ctx.arc(x,y,15 + Math.min(q,8),0,Math.PI*2); ctx.fill();
        ctx.fillStyle = q > 8 ? '#ef4444' : '#082f49'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(String(q), x, y + 4);
        ctx.fillStyle = 'rgba(255,255,255,.78)'; ctx.font = '11px system-ui'; ctx.fillText(s.n, x, y + 34);
      });
      state.trains.forEach((train, i) => {
        const station = currentStation(train); const p = { x: STATIONS[station].x*w, y: STATIONS[station].y*h };
        const bob = reduced ? 0 : Math.sin(Date.now()/260 + i) * 4;
        ctx.fillStyle = LINES[train.line].color; ctx.beginPath(); ctx.roundRect(p.x - 18, p.y - 38 + bob, 36, 18, 8); ctx.fill();
        ctx.fillStyle = '#082f49'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText(`${train.load}/${train.capacity}`, p.x, p.y - 25 + bob);
        if (state.delayed === i) { ctx.strokeStyle = '#f87171'; ctx.lineWidth = 3; ctx.strokeRect(p.x - 21, p.y - 41 + bob, 42, 24); }
      });
      if (state.pulse > 0 && !reduced) { state.pulse *= .88; if (state.pulse > .03) state.raf = requestAnimationFrame(draw); }
    }
    function targetFromEvent(event) {
      const rect = canvas.getBoundingClientRect(); const x = event.clientX - rect.left, y = event.clientY - rect.top;
      let best = 0, score = Infinity;
      STATIONS.forEach((s, i) => { const dx = s.x * rect.width - x, dy = s.y * rect.height - y, d = dx*dx + dy*dy; if (d < score) { score = d; best = i; } });
      state.cursor = best;
      return best;
    }
    board.addEventListener('click', (event) => { const target = targetFromEvent(event); act(target); });
    board.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); state.cursor = (state.cursor + 1) % STATIONS.length; update(); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); state.cursor = (state.cursor + STATIONS.length - 1) % STATIONS.length; update(); }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); act(state.cursor); }
      const keyed = choices.find((choice) => choice.key === event.key); if (keyed) choose(keyed.id);
    });
    window.addEventListener('resize', draw);
    function teardown() { cancelAnimationFrame(state.raf); window.removeEventListener('resize', draw); }
    reset();
  }
  const ready = () => setTimeout(initCard, 80);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once:true }); else ready();
})();
