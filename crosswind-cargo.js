(() => {
  const APP = {
    name: 'Crosswind Cargo',
    emoji: '🪁',
    category: 'play',
    version: '1.0.0',
    summary: 'Plot cargo routes across shifting winds before contracts expire.',
    description: 'A local route-planning game with moving wind lanes, contract deadlines, fuel, reroute tokens, priority cargo, adaptive scoring, responsive canvas rendering, touch, keyboard controls, reduced-motion behavior, and clean teardown.'
  };
  const PORTS = [
    { name: 'North pier', x: .16, y: .2 }, { name: 'Glass quay', x: .48, y: .15 }, { name: 'Storm dock', x: .82, y: .24 },
    { name: 'Reef post', x: .24, y: .52 }, { name: 'Market float', x: .62, y: .5 }, { name: 'Signal buoy', x: .82, y: .72 },
    { name: 'Old crane', x: .38, y: .8 }
  ];
  const CONTRACTS = [
    { from: 0, to: 4, cargo: 'medicine', due: 7, value: 46 },
    { from: 3, to: 2, cargo: 'radio parts', due: 8, value: 42 },
    { from: 6, to: 1, cargo: 'fresh fruit', due: 6, value: 38 },
    { from: 1, to: 5, cargo: 'repair crew', due: 7, value: 44 },
    { from: 4, to: 0, cargo: 'water filters', due: 6, value: 40 },
    { from: 2, to: 6, cargo: 'battery crate', due: 9, value: 48 }
  ];

  function installStyles() {
    if (document.querySelector('#crosswind-cargo-styles')) return;
    const style = document.createElement('style');
    style.id = 'crosswind-cargo-styles';
    style.textContent = `.crosswind-card{animation:crosswind-pop .34s ease both}.crosswind-game{max-width:930px;gap:14px}.crosswind-hud{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.crosswind-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.crosswind-stat span{display:block;color:var(--muted);font-size:.64rem;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.crosswind-stat strong{display:block;margin-top:4px;font-size:1rem}.crosswind-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#07131f;color:white;cursor:pointer;touch-action:manipulation;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.crosswind-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.crosswind-board canvas{display:block;width:100%;min-height:340px}.crosswind-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.crosswind-overlay strong{font-size:clamp(1.08rem,3vw,1.55rem)}.crosswind-overlay small{display:block;max-width:620px;color:rgba(255,255,255,.76)}.crosswind-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#dcfce7;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.crosswind-contracts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.crosswind-contract{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left}.crosswind-contract[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.crosswind-contract span{display:block;color:var(--muted);font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.crosswind-log{min-height:100px;padding:17px 19px}.crosswind-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:680px){.crosswind-hud,.crosswind-contracts{grid-template-columns:repeat(2,1fr)}.crosswind-board canvas{min-height:320px}.crosswind-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.crosswind-card{animation:none}}@keyframes crosswind-pop{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-crosswind-cargo-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.crosswindCargoCard = 'true';
    card.classList.add('crosswind-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openCrosswindCargo);
    grid.append(node);
  }

  function openCrosswindCargo() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Crosswind%20Cargo';
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
    root.className = 'tool-panel crosswind-game';
    const hud = document.createElement('div');
    hud.className = 'crosswind-hud';
    hud.innerHTML = '<div class="crosswind-stat"><span>Contract</span><strong id="crosswind-run">1 / 6</strong></div><div class="crosswind-stat"><span>Fuel</span><strong id="crosswind-fuel">18</strong></div><div class="crosswind-stat"><span>Reroutes</span><strong id="crosswind-reroutes">3</strong></div><div class="crosswind-stat"><span>Score</span><strong id="crosswind-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'crosswind-board';
    board.setAttribute('aria-label', 'Crosswind Cargo board. Choose contracts and plot routes through ports while avoiding crosswind lanes.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="crosswind-overlay"><span><strong>Route cargo before the wind closes your lane.</strong><small>Pick a contract, add ports as waypoints, then deliver. Every leg spends fuel and crossing wind costs extra unless you reroute.</small></span><span class="crosswind-badge">Tap ports or keys</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const contracts = document.createElement('div');
    contracts.className = 'crosswind-contracts';
    const log = document.createElement('div');
    log.className = 'result-card crosswind-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    actions.append(button('Add nearest port', addNearest), button('Use reroute', useReroute, true), button('Deliver route', deliver), button('Clear route', clearRoute, true), button('New run', reset, true));
    root.append(hud, board, contracts, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { active: 0, fuel: 18, reroutes: 3, score: 0, cursor: 0, delivered: new Set(), route: [], tick: 0, raf: 0, done: false };

    function reset() {
      Object.assign(state, { active: 0, fuel: 18, reroutes: 3, score: 0, cursor: 0, route: [], tick: 0, done: false });
      state.delivered = new Set();
      seedRoute();
      say('<strong>Dispatch opened.</strong><small>Select a contract, route through useful ports, and deliver before wind penalties eat the fuel margin.</small>');
      update();
    }
    function current() { return CONTRACTS[state.active]; }
    function seedRoute() { state.route = [current().from]; state.cursor = current().from; }
    function selectContract(index) {
      if (state.done || state.delivered.has(index)) return;
      state.active = index;
      seedRoute();
      say(`<strong>${current().cargo} selected.</strong><small>Start at ${PORTS[current().from].name}. Reach ${PORTS[current().to].name} in ${current().due} legs or fewer.</small>`);
      update();
    }
    function windColumn() { return (Math.floor(state.tick / 90) % 3) + 1; }
    function legCost(a, b) {
      const pa = PORTS[a];
      const pb = PORTS[b];
      const dist = Math.hypot(pa.x - pb.x, pa.y - pb.y);
      const crosses = Math.abs(Math.floor(pa.x * 4) - Math.floor(pb.x * 4)) >= windColumn();
      return Math.ceil(dist * 10) + (crosses ? 3 : 0);
    }
    function addPort(index) {
      if (state.done) return;
      if (state.route[state.route.length - 1] === index) return;
      if (state.route.length > 9) { say('<strong>Route is too long.</strong><small>Deliver or clear it before adding more waypoints.</small>'); return; }
      const cost = legCost(state.route[state.route.length - 1], index);
      if (cost > state.fuel) { say(`<strong>Not enough fuel for ${PORTS[index].name}.</strong><small>This leg needs ${cost}. Use a reroute, clear the route, or pick a closer port.</small>`); return; }
      state.fuel -= cost;
      state.route.push(index);
      state.cursor = index;
      say(`<strong>${PORTS[index].name} added.</strong><small>Leg cost ${cost}. Fuel remaining ${state.fuel}.</small>`);
      update();
    }
    function addNearest() {
      const last = state.route[state.route.length - 1];
      const target = current().to;
      let choice = target;
      let best = Infinity;
      PORTS.forEach((port, index) => {
        if (index === last || state.route.includes(index)) return;
        const cost = legCost(last, index) + Math.hypot(port.x - PORTS[target].x, port.y - PORTS[target].y) * 5;
        if (cost < best) { best = cost; choice = index; }
      });
      addPort(choice);
    }
    function useReroute() {
      if (state.done) return;
      if (state.reroutes <= 0) { say('<strong>No reroutes left.</strong><small>Clear the route or deliver with the path you have.</small>'); return; }
      if (state.route.length <= 1) { say('<strong>No leg to reroute yet.</strong><small>Add a waypoint first, then reroute if the wind tax is too high.</small>'); return; }
      state.reroutes -= 1;
      state.fuel = Math.min(22, state.fuel + 4);
      say('<strong>Reroute token spent.</strong><small>Recovered 4 fuel by taking a safer lane. Save tokens for late contracts.</small>');
      update();
    }
    function clearRoute() { if (!state.done) { seedRoute(); say('<strong>Route cleared.</strong><small>Fuel already spent stays spent, but the active contract can still be saved.</small>'); update(); } }
    function deliver() {
      if (state.done) return;
      const contract = current();
      const last = state.route[state.route.length - 1];
      if (last !== contract.to) { say(`<strong>Destination not reached.</strong><small>Add ${PORTS[contract.to].name} before delivering.</small>`); return; }
      const delay = Math.max(0, state.route.length - 1 - contract.due);
      const payout = Math.max(8, contract.value - delay * 9 + state.fuel + state.reroutes * 3);
      state.score += payout;
      state.delivered.add(state.active);
      say(`<strong>${contract.cargo} delivered for ${payout}.</strong><small>${delay ? `Late by ${delay} leg.` : 'On time.'} Choose another contract before the wind shifts again.</small>`);
      const next = CONTRACTS.findIndex((_, index) => !state.delivered.has(index));
      if (next === -1 || state.fuel <= 0) {
        state.done = true;
        say(`<strong>Harbor shift complete: ${state.score} points.</strong><small>Delivered ${state.delivered.size} contracts with ${state.fuel} fuel and ${state.reroutes} reroutes left.</small>`);
      } else {
        state.active = next;
        state.fuel = Math.min(24, state.fuel + 6);
        seedRoute();
      }
      update();
    }
    function say(html) { log.innerHTML = html; }
    function updateContracts() {
      contracts.replaceChildren();
      CONTRACTS.forEach((contract, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'crosswind-contract';
        item.disabled = state.delivered.has(index);
        item.setAttribute('aria-pressed', String(index === state.active));
        item.innerHTML = `<span>${contract.cargo}</span><strong>${PORTS[contract.from].name} → ${PORTS[contract.to].name}</strong><small>${state.delivered.has(index) ? 'Delivered' : `${contract.due} legs · ${contract.value} base`}</small>`;
        item.addEventListener('click', () => selectContract(index));
        contracts.append(item);
      });
    }
    function update() {
      hud.querySelector('#crosswind-run').textContent = `${state.delivered.size + 1} / ${CONTRACTS.length}`;
      hud.querySelector('#crosswind-fuel').textContent = state.fuel;
      hud.querySelector('#crosswind-reroutes').textContent = state.reroutes;
      hud.querySelector('#crosswind-score').textContent = state.score;
      updateContracts();
      draw();
    }
    function draw() {
      const rect = board.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(320, Math.floor(rect.width * .54));
      canvas.width = Math.floor(w * ratio); canvas.height = Math.floor(h * ratio); canvas.style.height = `${h}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h); grad.addColorStop(0, '#0f172a'); grad.addColorStop(1, '#064e3b'); ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      const col = windColumn();
      ctx.fillStyle = 'rgba(125,211,252,.13)';
      for (let i = 0; i < 4; i += 1) if (i + 1 === col || i === col) ctx.fillRect((i / 4) * w, 0, w / 8, h);
      ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath();
      state.route.forEach((index, i) => { const p = PORTS[index]; const x = p.x * w; const y = p.y * h; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.stroke();
      PORTS.forEach((p, index) => {
        const x = p.x * w; const y = p.y * h; const target = index === current().to; const start = index === current().from;
        ctx.beginPath(); ctx.fillStyle = target ? '#fef08a' : start ? '#86efac' : '#bfdbfe'; ctx.arc(x, y, target ? 13 : 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = '700 12px system-ui'; ctx.fillText(String(index + 1), x + 13, y - 10);
      });
    }
    function loop() { state.tick += reduced ? 0 : 1; draw(); state.raf = requestAnimationFrame(loop); }
    function pickFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      let chosen = 0; let best = Infinity;
      PORTS.forEach((p, index) => { const d = Math.hypot(p.x - x, p.y - y); if (d < best) { best = d; chosen = index; } });
      addPort(chosen);
    }
    board.addEventListener('click', pickFromEvent);
    board.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); state.cursor = (state.cursor + 1) % PORTS.length; addPort(state.cursor); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); state.cursor = (state.cursor + PORTS.length - 1) % PORTS.length; addPort(state.cursor); }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); deliver(); }
      if (event.key.toLowerCase() === 'r') useReroute();
    });
    document.querySelector('#app-dialog')?.addEventListener('close', () => cancelAnimationFrame(state.raf), { once: true });
    reset();
    loop();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard);
  else initCard();
  window.addEventListener('forge:apps-rendered', initCard);
  setTimeout(initCard, 800);
})();
