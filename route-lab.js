(() => {
  const APP = {
    name: 'Route Lab',
    emoji: '🧭',
    category: 'play',
    version: '1.0.0',
    summary: 'Plot a charged route through terrain, relays, scans, and one bridge.',
    description: 'A local path-planning puzzle with terrain costs, ordered relays, limited charge, scan hints, one bridge, scoring, adaptive maps, pointer, touch, keyboard, and canvas rendering.'
  };

  const MAPS = [
    ['........', '.bb..ss.', '..b.bb..', '.s...b..', '..bb.s..', '........'],
    ['..b...s.', '.sbb.b..', '.....b..', '.bb.s...', '.....bs.', '.sb.....'],
    ['...s....', '.bbb.bb.', '.....s..', '.sbbb...', '....bbs.', '.b......']
  ];
  const RELAYS = [
    [{ x: 2, y: 1 }, { x: 5, y: 2 }, { x: 4, y: 4 }],
    [{ x: 3, y: 0 }, { x: 6, y: 2 }, { x: 2, y: 5 }],
    [{ x: 5, y: 0 }, { x: 6, y: 3 }, { x: 3, y: 4 }]
  ];
  const START = { x: 0, y: 5 };
  const EXIT = { x: 7, y: 0 };

  function installStyles() {
    if (document.querySelector('#route-lab-styles')) return;
    const style = document.createElement('style');
    style.id = 'route-lab-styles';
    style.textContent = `
      .route-lab-card { animation: route-card-rise .36s ease both; }
      .route-game { max-width: 860px; gap: 14px; }
      .route-hud { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
      .route-stat { border: 1px solid var(--line); border-radius: 15px; background: white; padding: 10px 12px; }
      .route-stat span { display: block; color: var(--muted); font-size: .64rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
      .route-stat strong { display: block; margin-top: 4px; font-size: 1rem; }
      .route-board { position: relative; border: 0; border-radius: 26px; padding: 0; overflow: hidden; background: #07110d; color: white; cursor: pointer; touch-action: manipulation; box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); }
      .route-board:focus-visible { outline: 4px solid var(--accent); outline-offset: 4px; }
      .route-board canvas { display: block; width: 100%; min-height: 330px; }
      .route-overlay { position: absolute; left: 18px; right: 18px; bottom: 16px; display: flex; justify-content: space-between; gap: 12px; align-items: end; pointer-events: none; }
      .route-overlay strong { font-size: clamp(1.1rem, 3vw, 1.6rem); }
      .route-overlay small { display: block; max-width: 520px; color: rgba(255,255,255,.72); }
      .route-badge { padding: 7px 9px; border-radius: 999px; background: rgba(255,255,255,.12); color: #fff2bd; font-size: .68rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      .route-log { min-height: 90px; padding: 17px 19px; }
      .route-log strong { font-size: clamp(1.1rem, 3vw, 1.55rem); }
      @media (max-width: 620px) {
        .route-hud { grid-template-columns: repeat(2, 1fr); }
        .route-board canvas { min-height: 300px; }
        .route-overlay { align-items: start; flex-direction: column; }
      }
      @media (prefers-reduced-motion: reduce) { .route-lab-card { animation: none; } }
      @keyframes route-card-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-route-lab-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.routeLabCard = 'true';
    card.classList.add('route-lab-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const button = node.querySelector('.app-card-button');
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', openRouteLab);
    grid.append(node);
  }

  function openRouteLab() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Route%20Lab';
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
    root.className = 'tool-panel route-game';
    const hud = document.createElement('div');
    hud.className = 'route-hud';
    hud.innerHTML = '<div class="route-stat"><span>Charge</span><strong id="route-charge">18</strong></div><div class="route-stat"><span>Next relay</span><strong id="route-next">1</strong></div><div class="route-stat"><span>Score</span><strong id="route-score">0</strong></div><div class="route-stat"><span>Tools</span><strong id="route-tools">Scan · bridge</strong></div>';

    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'route-board';
    board.setAttribute('aria-label', 'Route board. Use arrow keys or tap neighboring cells to move through relays in order, then reach the exit.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="route-overlay"><span><strong>Reach relays 1 to 3, then exit.</strong><small>Brush costs two charge. Storm costs three. Scan marks the cheapest next move. Bridge makes one costly move free.</small></span><span class="route-badge">Arrow keys or tap</span></span>';
    const canvas = board.querySelector('canvas');
    const context = canvas.getContext('2d');

    const result = document.createElement('div');
    result.className = 'result-card route-log';
    result.setAttribute('aria-live', 'polite');

    const state = {
      map: 0,
      charge: 18,
      score: 0,
      relay: 0,
      position: { ...START },
      trail: [],
      scanCell: null,
      scanUsed: false,
      bridgeArmed: false,
      bridgeUsed: false,
      won: false
    };

    const scanButton = makeButton('Scan next move', useScan, true);
    const bridgeButton = makeButton('Use bridge', () => {
      state.bridgeArmed = true;
      log('<strong>Bridge armed.</strong><small>Your next valid move costs zero charge.</small>');
      update();
    }, true);
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    actions.append(makeButton('New route', reset), scanButton, bridgeButton);
    root.append(hud, board, result, actions);
    stage.append(root);

    function reset() {
      state.map = (state.map + 1) % MAPS.length;
      state.charge = 18 + state.map;
      state.score = 0;
      state.relay = 0;
      state.position = { ...START };
      state.trail = [];
      state.scanCell = null;
      state.scanUsed = false;
      state.bridgeArmed = false;
      state.bridgeUsed = false;
      state.won = false;
      log('<strong>New route loaded.</strong><small>Link relays in order before the charge runs out.</small>');
      update();
    }

    function kindAt(x, y) {
      const code = MAPS[state.map][y]?.[x];
      if (code === 'b') return 'brush';
      if (code === 's') return 'storm';
      return 'plain';
    }

    function costAt(x, y) {
      return kindAt(x, y) === 'plain' ? 1 : kindAt(x, y) === 'brush' ? 2 : 3;
    }

    function move(dx, dy) {
      if (state.won) return;
      const x = state.position.x + dx;
      const y = state.position.y + dy;
      if (x < 0 || x > 7 || y < 0 || y > 5) return;
      const cost = state.bridgeArmed ? 0 : costAt(x, y);
      if (state.charge < cost) {
        log('<strong>Not enough charge.</strong><small>Try a cheaper path or start a new route.</small>');
        return;
      }
      state.position = { x, y };
      state.trail.push({ x, y });
      state.charge -= cost;
      state.score += Math.max(1, 4 - cost);
      if (state.bridgeArmed) {
        state.bridgeArmed = false;
        state.bridgeUsed = true;
      }
      state.scanCell = null;
      checkObjective();
      update();
    }

    function checkObjective() {
      const target = RELAYS[state.map][state.relay];
      if (target && same(state.position, target)) {
        state.relay += 1;
        state.score += 8;
        log(`<strong>Relay ${state.relay} linked.</strong><small>${state.relay < 3 ? 'Find the next relay.' : 'The exit is open.'}</small>`);
        return;
      }
      if (state.relay >= 3 && same(state.position, EXIT)) {
        state.won = true;
        state.score += state.charge * 2 + (state.scanUsed ? 0 : 8) + (state.bridgeUsed ? 0 : 8);
        log(`<strong>Route complete: ${state.score} points.</strong><small>Unused charge and saved tools became bonus points.</small>`);
        return;
      }
      log(`<strong>${labelKind(kindAt(state.position.x, state.position.y))} crossed.</strong><small>${state.charge} charge remains. Next target: ${state.relay < 3 ? `relay ${state.relay + 1}` : 'exit'}.</small>`);
    }

    function useScan() {
      if (state.scanUsed || state.won) return;
      state.scanUsed = true;
      const target = state.relay < 3 ? RELAYS[state.map][state.relay] : EXIT;
      const moves = [[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx, dy]) => ({ x: state.position.x + dx, y: state.position.y + dy }))
        .filter((cell) => cell.x >= 0 && cell.x < 8 && cell.y >= 0 && cell.y < 6)
        .sort((a, b) => distance(a, target) + costAt(a.x, a.y) - distance(b, target) - costAt(b.x, b.y));
      state.scanCell = moves[0] || null;
      log('<strong>Scan used.</strong><small>The highlighted cell is the cheapest step toward the current target.</small>');
      update();
    }

    function update() {
      hud.querySelector('#route-charge').textContent = String(state.charge);
      hud.querySelector('#route-next').textContent = state.relay < 3 ? String(state.relay + 1) : 'Exit';
      hud.querySelector('#route-score').textContent = String(state.score);
      hud.querySelector('#route-tools').textContent = `${state.scanUsed ? 'Scan used' : 'Scan'} · ${state.bridgeUsed ? 'Bridge used' : state.bridgeArmed ? 'Bridge armed' : 'bridge'}`;
      scanButton.disabled = state.scanUsed || state.won;
      bridgeButton.disabled = state.bridgeUsed || state.bridgeArmed || state.won;
      draw();
    }

    function draw() {
      const bounds = board.getBoundingClientRect();
      const width = Math.max(320, Math.floor(bounds.width));
      const height = Math.max(320, Math.floor(width * 0.58));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#07110d';
      context.fillRect(0, 0, width, height);
      const cell = Math.min((width - 36) / 8, (height - 36) / 6);
      const ox = (width - cell * 8) / 2;
      const oy = 18;
      for (let y = 0; y < 6; y += 1) {
        for (let x = 0; x < 8; x += 1) drawCell(x, y, ox, oy, cell);
      }
      state.trail.forEach((point, index) => {
        context.fillStyle = `rgba(255,111,74,${0.2 + index / Math.max(8, state.trail.length) * 0.35})`;
        context.beginPath();
        context.arc(ox + point.x * cell + cell / 2, oy + point.y * cell + cell / 2, 5, 0, Math.PI * 2);
        context.fill();
      });
      RELAYS[state.map].forEach((point, index) => drawMarker(point, String(index + 1), index < state.relay ? '#ff6f4a' : '#fff2bd', ox, oy, cell));
      drawMarker(START, 'S', '#bfe7d1', ox, oy, cell);
      drawMarker(EXIT, state.relay >= 3 ? 'X' : '□', '#ffffff', ox, oy, cell);
      drawMarker(state.position, '●', '#ff6f4a', ox, oy, cell, true);
    }

    function drawCell(x, y, ox, oy, cell) {
      const kind = kindAt(x, y);
      const cx = ox + x * cell + 3;
      const cy = oy + y * cell + 3;
      context.fillStyle = kind === 'plain' ? '#153a2e' : kind === 'brush' ? '#31533d' : '#593139';
      context.strokeStyle = 'rgba(255,255,255,.16)';
      context.lineWidth = 1;
      rounded(cx, cy, cell - 6, cell - 6, 10);
      context.fill();
      context.stroke();
      if (state.scanCell && state.scanCell.x === x && state.scanCell.y === y) {
        context.strokeStyle = '#fff2bd';
        context.lineWidth = 4;
        rounded(cx + 4, cy + 4, cell - 14, cell - 14, 8);
        context.stroke();
      }
    }

    function drawMarker(point, label, color, ox, oy, cell, player = false) {
      const x = ox + point.x * cell + cell / 2;
      const y = oy + point.y * cell + cell / 2;
      context.fillStyle = player ? 'rgba(255,111,74,.25)' : 'rgba(255,255,255,.14)';
      context.beginPath();
      context.arc(x, y, player ? cell * 0.34 : cell * 0.28, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = color;
      context.font = `900 ${Math.max(14, cell * 0.26)}px system-ui, sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(label, x, y + 1);
    }

    function rounded(x, y, w, h, r) {
      context.beginPath();
      context.moveTo(x + r, y);
      context.arcTo(x + w, y, x + w, y + h, r);
      context.arcTo(x + w, y + h, x, y + h, r);
      context.arcTo(x, y + h, x, y, r);
      context.arcTo(x, y, x + w, y, r);
      context.closePath();
    }

    function same(a, b) { return a.x === b.x && a.y === b.y; }
    function distance(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
    function labelKind(kind) { return kind === 'plain' ? 'Plain' : kind === 'brush' ? 'Brush' : 'Storm'; }

    board.addEventListener('keydown', (event) => {
      const moves = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
      if (!moves[event.key]) return;
      event.preventDefault();
      move(...moves[event.key]);
    });

    board.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const cell = Math.min((rect.width - 36) / 8, (rect.height - 36) / 6);
      const ox = (rect.width - cell * 8) / 2;
      const oy = 18;
      const x = Math.floor((event.clientX - rect.left - ox) / cell);
      const y = Math.floor((event.clientY - rect.top - oy) / cell);
      const dx = x - state.position.x;
      const dy = y - state.position.y;
      if (Math.abs(dx) + Math.abs(dy) === 1) move(dx, dy);
    });

    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(board);
    log('<strong>Route loaded.</strong><small>Reach relay 1, relay 2, relay 3, then the exit.</small>');
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard);
  else initCard();
})();
