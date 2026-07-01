(() => {
  const APP = {
    name: 'Harbor Balance',
    emoji: '⚓',
    category: 'play',
    version: '1.0.0',
    summary: 'Route a small harbor crew through deliveries, repairs, storms, and trust.',
    description: 'A local resource-management game with delayed storm pressure, delivery contracts, repair tradeoffs, route planning, unlockable actions, scoring, touch, pointer, keyboard, canvas rendering, and no storage.'
  };

  const SIZE = 6;
  const MAPS = [
    { storm: 8, boat: { x: 0, y: 5 }, depots: [{ x: 0, y: 5, kind: 'food' }, { x: 5, y: 5, kind: 'parts' }, { x: 2, y: 4, kind: 'fuel' }], districts: [{ x: 1, y: 1, need: 'food', label: 'Market', due: 5 }, { x: 4, y: 1, need: 'parts', label: 'Pumps', due: 6 }, { x: 5, y: 3, need: 'food', label: 'Clinic', due: 8 }], hazards: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 3 }], shoals: [{ x: 1, y: 3 }, { x: 4, y: 4 }] },
    { storm: 7, boat: { x: 5, y: 0 }, depots: [{ x: 5, y: 0, kind: 'food' }, { x: 0, y: 4, kind: 'parts' }, { x: 3, y: 5, kind: 'fuel' }], districts: [{ x: 0, y: 0, need: 'parts', label: 'Beacon', due: 4 }, { x: 2, y: 2, need: 'food', label: 'Shelter', due: 6 }, { x: 5, y: 5, need: 'parts', label: 'Locks', due: 7 }], hazards: [{ x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 3 }], shoals: [{ x: 1, y: 4 }, { x: 3, y: 4 }] }
  ];

  function installStyles() {
    if (document.querySelector('#harbor-balance-styles')) return;
    const style = document.createElement('style');
    style.id = 'harbor-balance-styles';
    style.textContent = `
      .harbor-card { animation: harbor-rise .36s ease both; }
      .harbor-game { max-width: 880px; gap: 14px; }
      .harbor-hud { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
      .harbor-stat { border: 1px solid var(--line); border-radius: 15px; background: white; padding: 10px 12px; }
      .harbor-stat span { display: block; color: var(--muted); font-size: .63rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      .harbor-stat strong { display: block; margin-top: 4px; font-size: 1rem; }
      .harbor-board { position: relative; border: 0; border-radius: 26px; padding: 0; overflow: hidden; background: #07110d; color: white; cursor: pointer; touch-action: manipulation; box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); }
      .harbor-board:focus-visible { outline: 4px solid var(--accent); outline-offset: 4px; }
      .harbor-board canvas { display: block; width: 100%; min-height: 336px; }
      .harbor-overlay { position: absolute; left: 18px; right: 18px; bottom: 16px; display: flex; justify-content: space-between; gap: 12px; align-items: end; pointer-events: none; }
      .harbor-overlay strong { font-size: clamp(1.05rem, 3vw, 1.55rem); }
      .harbor-overlay small { display: block; max-width: 560px; color: rgba(255,255,255,.72); }
      .harbor-badge { padding: 7px 9px; border-radius: 999px; background: rgba(255,255,255,.12); color: #fff2bd; font-size: .68rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      .harbor-log { min-height: 104px; padding: 17px 19px; }
      .harbor-log strong { font-size: clamp(1.1rem, 3vw, 1.55rem); }
      .harbor-log small { display: block; margin-top: 4px; }
      @media (max-width: 700px) { .harbor-hud { grid-template-columns: repeat(2, 1fr); } .harbor-board canvas { min-height: 320px; } .harbor-overlay { align-items: start; flex-direction: column; } }
      @media (prefers-reduced-motion: reduce) { .harbor-card { animation: none; } }
      @keyframes harbor-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-harbor-balance-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.harborBalanceCard = 'true';
    card.classList.add('harbor-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const button = node.querySelector('.app-card-button');
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', openHarborBalance);
    grid.append(node);
  }

  function openHarborBalance() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Harbor%20Balance';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function makeButton(text, onClick, secondary = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = secondary ? 'button button-secondary' : 'button';
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel harbor-game';
    const hud = document.createElement('div');
    hud.className = 'harbor-hud';
    hud.innerHTML = '<div class="harbor-stat"><span>Day</span><strong id="harbor-day">1</strong></div><div class="harbor-stat"><span>Fuel</span><strong id="harbor-fuel">10</strong></div><div class="harbor-stat"><span>Cargo</span><strong id="harbor-cargo">Empty</strong></div><div class="harbor-stat"><span>Trust</span><strong id="harbor-trust">5</strong></div><div class="harbor-stat"><span>Score</span><strong id="harbor-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'harbor-board';
    board.setAttribute('aria-label', 'Harbor board. Use arrow keys or tap neighboring cells to move, load cargo, repair hazards, and complete district needs before the storm.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="harbor-overlay"><span><strong>Deliver needs before the storm closes the harbor.</strong><small>Load cargo at depots, spend parts to repair hazards, conserve fuel, and keep trust above zero.</small></span><span class="harbor-badge">Arrow keys or tap</span></span>';
    const canvas = board.querySelector('canvas');
    const context = canvas.getContext('2d');
    const logBox = document.createElement('div');
    logBox.className = 'result-card harbor-log';
    logBox.setAttribute('aria-live', 'polite');
    const state = { mapIndex: 0, day: 1, fuel: 10, cargo: '', trust: 5, score: 0, repaired: [], delivered: [], boat: { ...MAPS[0].boat }, preview: null, ended: false };
    const loadButton = makeButton('Load here', loadHere, true);
    const repairButton = makeButton('Repair hazard', repairHere, true);
    const forecastButton = makeButton('Forecast route', forecastRoute, true);
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    actions.append(makeButton('New harbor', reset), loadButton, repairButton, forecastButton);
    root.append(hud, board, logBox, actions);
    stage.append(root);

    function map() { return MAPS[state.mapIndex]; }
    function reset() {
      state.mapIndex = (state.mapIndex + 1) % MAPS.length;
      state.day = 1; state.fuel = 10 + state.mapIndex; state.cargo = ''; state.trust = 5; state.score = 0;
      state.repaired = []; state.delivered = []; state.boat = { ...map().boat }; state.preview = null; state.ended = false;
      log('<strong>New harbor loaded.</strong><small>Balance speed, fuel, repairs, and trust before the storm arrives.</small>'); update();
    }
    function loadHere() {
      if (state.ended) return;
      const depot = map().depots.find((item) => same(item, state.boat));
      if (!depot) return log('<strong>No depot here.</strong><small>Move to a food, parts, or fuel depot first.</small>');
      if (depot.kind === 'fuel') { state.fuel = Math.min(14, state.fuel + 4); state.score += 2; log('<strong>Fuel topped up.</strong><small>You gained four fuel, up to the safe capacity.</small>'); }
      else { state.cargo = depot.kind; log(`<strong>${label(depot.kind)} loaded.</strong><small>Deliver it to a district that needs ${depot.kind}.</small>`); }
      state.preview = null; update();
    }
    function repairHere() {
      if (state.ended) return;
      const hazard = map().hazards.find((item) => same(item, state.boat));
      if (!hazard || isRepaired(hazard)) return log('<strong>No active hazard here.</strong><small>Repairs only work on red hazard cells.</small>');
      if (state.cargo !== 'parts') return log('<strong>Parts required.</strong><small>Carry parts to a hazard cell to reopen that route.</small>');
      state.cargo = ''; state.repaired.push(key(hazard)); state.trust += 1; state.score += 12;
      log('<strong>Hazard repaired.</strong><small>Trust rose, and this cell is now cheaper to cross.</small>'); update();
    }
    function forecastRoute() {
      if (state.ended) return;
      const target = nextTarget();
      if (!target) return log('<strong>All needs are met.</strong><small>Use remaining days to repair hazards or preserve fuel.</small>');
      const candidates = neighbors(state.boat).sort((a, b) => distance(a, target) + cost(a) - distance(b, target) - cost(b));
      state.preview = candidates[0] || null;
      log('<strong>Forecast marked one step.</strong><small>The yellow cell is the cheapest nearby move toward the most urgent unmet need.</small>'); update();
    }
    function move(dx, dy) {
      if (state.ended) return;
      const next = { x: state.boat.x + dx, y: state.boat.y + dy };
      if (next.x < 0 || next.y < 0 || next.x >= SIZE || next.y >= SIZE) return;
      const moveCost = cost(next);
      if (state.fuel < moveCost) { state.trust -= 1; log('<strong>Fuel shortage.</strong><small>Trust dropped. Reach a fuel depot or restart before the harbor stalls.</small>'); checkEnd(); update(); return; }
      state.boat = next; state.fuel -= moveCost; state.day += 1; state.preview = null;
      resolveCell(); checkDeadlines(); checkEnd(); update();
    }
    function resolveCell() {
      const district = map().districts.find((item) => same(item, state.boat) && !state.delivered.includes(key(item)));
      if (district && state.cargo === district.need) {
        state.cargo = ''; state.delivered.push(key(district));
        const early = Math.max(0, district.due - state.day);
        state.trust += 1 + (early > 1 ? 1 : 0); state.score += 18 + early * 3;
        return log(`<strong>${district.label} supplied.</strong><small>Trust rose. Early delivery added ${early * 3} bonus points.</small>`);
      }
      if (district && state.cargo && state.cargo !== district.need) return log(`<strong>${district.label} needs ${district.need}.</strong><small>You are carrying ${state.cargo}. Swap cargo at a depot.</small>`);
      const terrain = terrainAt(state.boat);
      log(`<strong>${label(terrain)} water crossed.</strong><small>${state.fuel} fuel remains. Next urgent need: ${nextNeedLabel()}.</small>`);
    }
    function checkDeadlines() {
      for (const district of map().districts) {
        if (state.delivered.includes(key(district))) continue;
        if (state.day === district.due + 1) { state.trust -= 1; log(`<strong>${district.label} missed its first window.</strong><small>Trust dropped, but recovery is still possible.</small>`); }
      }
    }
    function checkEnd() {
      if (state.delivered.length === map().districts.length) {
        state.ended = true; state.score += state.fuel * 2 + state.trust * 5 + Math.max(0, map().storm - state.day) * 4;
        log(`<strong>Harbor balanced: ${state.score} points.</strong><small>Remaining fuel, trust, and storm buffer became bonus points.</small>`);
      } else if (state.day > map().storm + 2 || state.trust <= 0) {
        state.ended = true; log('<strong>Harbor response failed.</strong><small>The storm window closed or trust collapsed. Try a tighter sequence.</small>');
      }
    }
    function cost(cell) { if (isRepaired(cell)) return 1; const terrain = terrainAt(cell); return terrain === 'hazard' ? 3 : terrain === 'shoal' ? 2 : 1; }
    function terrainAt(cell) { if (map().hazards.some((item) => same(item, cell))) return 'hazard'; if (map().shoals.some((item) => same(item, cell))) return 'shoal'; return 'open'; }
    function isRepaired(cell) { return state.repaired.includes(key(cell)); }
    function nextTarget() { return [...map().districts].filter((item) => !state.delivered.includes(key(item))).sort((a, b) => a.due - b.due)[0] || null; }
    function nextNeedLabel() { const target = nextTarget(); return target ? `${target.label} needs ${target.need}` : 'none'; }
    function neighbors(cell) { return [[1,0],[-1,0],[0,1],[0,-1]].map(([dx, dy]) => ({ x: cell.x + dx, y: cell.y + dy })).filter((item) => item.x >= 0 && item.y >= 0 && item.x < SIZE && item.y < SIZE); }
    function update() {
      hud.querySelector('#harbor-day').textContent = `${state.day} / ${map().storm}`;
      hud.querySelector('#harbor-fuel').textContent = String(state.fuel);
      hud.querySelector('#harbor-cargo').textContent = state.cargo ? label(state.cargo) : 'Empty';
      hud.querySelector('#harbor-trust').textContent = String(state.trust);
      hud.querySelector('#harbor-score').textContent = String(state.score);
      loadButton.disabled = state.ended; repairButton.disabled = state.ended; forecastButton.disabled = state.ended; draw();
    }
    function draw() {
      const bounds = board.getBoundingClientRect();
      const width = Math.max(320, Math.floor(bounds.width));
      const height = Math.max(330, Math.floor(width * 0.62));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio); canvas.height = Math.floor(height * ratio); canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, width, height); context.fillStyle = '#07110d'; context.fillRect(0, 0, width, height);
      const cell = Math.min((width - 42) / SIZE, (height - 42) / SIZE); const ox = (width - cell * SIZE) / 2; const oy = 20;
      for (let y = 0; y < SIZE; y += 1) for (let x = 0; x < SIZE; x += 1) drawCell({ x, y }, ox, oy, cell);
      for (const depot of map().depots) drawMarker(depot, depot.kind === 'food' ? 'F' : depot.kind === 'parts' ? 'P' : '+', '#bfe7d1', ox, oy, cell);
      for (const district of map().districts) { const done = state.delivered.includes(key(district)); drawMarker(district, done ? '✓' : district.need === 'food' ? 'F' : 'P', done ? '#bfe7d1' : '#fff2bd', ox, oy, cell); }
      drawMarker(state.boat, '●', '#ff6f4a', ox, oy, cell, true);
    }
    function drawCell(cellPoint, ox, oy, cell) {
      const terrain = terrainAt(cellPoint); const repaired = isRepaired(cellPoint); const x = ox + cellPoint.x * cell + 3; const y = oy + cellPoint.y * cell + 3;
      context.fillStyle = repaired ? '#244a3b' : terrain === 'hazard' ? '#5a2735' : terrain === 'shoal' ? '#31533d' : '#153a2e';
      context.strokeStyle = 'rgba(255,255,255,.16)'; context.lineWidth = 1; rounded(x, y, cell - 6, cell - 6, 10); context.fill(); context.stroke();
      if (state.preview && same(state.preview, cellPoint)) { context.strokeStyle = '#fff2bd'; context.lineWidth = 4; rounded(x + 4, y + 4, cell - 14, cell - 14, 8); context.stroke(); }
      context.fillStyle = terrain === 'hazard' && !repaired ? 'rgba(255,255,255,.78)' : 'rgba(255,255,255,.35)'; context.font = `800 ${Math.max(11, cell * 0.16)}px system-ui, sans-serif`; context.textAlign = 'left'; context.textBaseline = 'top'; context.fillText(`-${cost(cellPoint)}`, x + 8, y + 7);
    }
    function drawMarker(point, text, color, ox, oy, cell, boat = false) {
      const x = ox + point.x * cell + cell / 2; const y = oy + point.y * cell + cell / 2;
      context.fillStyle = boat ? 'rgba(255,111,74,.24)' : 'rgba(255,255,255,.14)'; context.beginPath(); context.arc(x, y, boat ? cell * 0.34 : cell * 0.29, 0, Math.PI * 2); context.fill();
      context.fillStyle = color; context.font = `900 ${Math.max(14, cell * 0.25)}px system-ui, sans-serif`; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(text, x, y + 1);
    }
    function rounded(x, y, w, h, r) { context.beginPath(); context.moveTo(x + r, y); context.arcTo(x + w, y, x + w, y + h, r); context.arcTo(x + w, y + h, x, y + h, r); context.arcTo(x, y + h, x, y, r); context.arcTo(x, y, x + w, y, r); context.closePath(); }
    function log(message) { logBox.innerHTML = message; }
    function key(point) { return `${point.x},${point.y}`; }
    function same(a, b) { return a.x === b.x && a.y === b.y; }
    function distance(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
    function label(value) { return value === 'food' ? 'Food' : value === 'parts' ? 'Parts' : value === 'fuel' ? 'Fuel' : value === 'hazard' ? 'Hazard' : value === 'shoal' ? 'Shoal' : 'Open'; }
    board.addEventListener('keydown', (event) => { const moves = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }; if (!moves[event.key]) return; event.preventDefault(); move(...moves[event.key]); });
    board.addEventListener('click', (event) => { const rect = canvas.getBoundingClientRect(); const cell = Math.min((rect.width - 42) / SIZE, (rect.height - 42) / SIZE); const ox = (rect.width - cell * SIZE) / 2; const oy = 20; const x = Math.floor((event.clientX - rect.left - ox) / cell); const y = Math.floor((event.clientY - rect.top - oy) / cell); const dx = x - state.boat.x; const dy = y - state.boat.y; if (Math.abs(dx) + Math.abs(dy) === 1) move(dx, dy); });
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(board);
    log('<strong>Harbor shift started.</strong><small>Deliver each district need before the storm window closes.</small>'); update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard);
  else initCard();
})();
