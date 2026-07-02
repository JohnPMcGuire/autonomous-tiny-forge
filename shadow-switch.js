(() => {
  const APP = {
    name: 'Shadow Switch', emoji: '🌘', category: 'play', version: '1.0.0',
    summary: 'Slip through patrol lights by using shadows, keys, noise, and timing.',
    description: 'A local stealth-routing puzzle with moving patrol cones, locked doors, shadow cloak, noise lures, terminals, score pressure, touch, keyboard, responsive canvas, and reduced-motion-safe feedback.'
  };

  const LEVELS = [
    { map: ['########', '#S..l..#', '#.##.#E#', '#..k...#', '#.##.###', '#t.....#', '########'], guards: [{ x: 5, y: 1, d: 2, p: [[5,1],[4,1],[3,1],[4,1]] }], steps: 20 },
    { map: ['########', '#S..#..#', '#.k.#E.#', '#..l...#', '#.###.##', '#t...c.#', '########'], guards: [{ x: 3, y: 3, d: 1, p: [[3,3],[4,3],[5,3],[4,3]] }, { x: 6, y: 1, d: 2, p: [[6,1],[6,2],[6,3],[6,2]] }], steps: 24 },
    { map: ['########', '#S.c...#', '#.###l.#', '#k..g.E#', '#.###.##', '#t..l..#', '########'], guards: [{ x: 4, y: 3, d: 3, p: [[4,3],[3,3],[2,3],[3,3]] }, { x: 6, y: 5, d: 0, p: [[6,5],[5,5],[4,5],[5,5]] }], steps: 26 }
  ];
  const DIRS = [[0,-1],[1,0],[0,1],[-1,0]];

  function installStyles() {
    if (document.querySelector('#shadow-switch-styles')) return;
    const style = document.createElement('style');
    style.id = 'shadow-switch-styles';
    style.textContent = `
      .shadow-card { animation: shadow-rise .34s ease both; }
      .shadow-game { max-width: 860px; gap: 14px; }
      .shadow-hud { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
      .shadow-stat { border: 1px solid var(--line); border-radius: 15px; background: white; padding: 10px 12px; }
      .shadow-stat span { display: block; color: var(--muted); font-size: .64rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
      .shadow-stat strong { display: block; margin-top: 4px; font-size: 1rem; }
      .shadow-board { position: relative; border: 0; border-radius: 26px; padding: 0; overflow: hidden; background: #070811; color: white; cursor: pointer; touch-action: manipulation; box-shadow: inset 0 0 0 1px rgba(255,255,255,.12); }
      .shadow-board:focus-visible { outline: 4px solid var(--accent); outline-offset: 4px; }
      .shadow-board canvas { display: block; width: 100%; min-height: 330px; }
      .shadow-overlay { position: absolute; left: 18px; right: 18px; bottom: 16px; display: flex; justify-content: space-between; gap: 12px; align-items: end; pointer-events: none; }
      .shadow-overlay strong { font-size: clamp(1.08rem, 3vw, 1.55rem); }
      .shadow-overlay small { display: block; max-width: 560px; color: rgba(255,255,255,.74); }
      .shadow-badge { padding: 7px 9px; border-radius: 999px; background: rgba(255,255,255,.12); color: #d7e9ff; font-size: .68rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      .shadow-log { min-height: 92px; padding: 17px 19px; }
      .shadow-log strong { font-size: clamp(1.1rem, 3vw, 1.55rem); }
      @media (max-width: 620px) { .shadow-hud { grid-template-columns: repeat(2, 1fr); } .shadow-board canvas { min-height: 300px; } .shadow-overlay { align-items: start; flex-direction: column; } }
      @media (prefers-reduced-motion: reduce) { .shadow-card { animation: none; } }
      @keyframes shadow-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-shadow-switch-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.shadowSwitchCard = 'true';
    card.classList.add('shadow-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const button = node.querySelector('.app-card-button');
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', openShadowSwitch);
    grid.append(node);
  }

  function openShadowSwitch() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Shadow%20Switch';
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
    root.className = 'tool-panel shadow-game';
    const hud = document.createElement('div');
    hud.className = 'shadow-hud';
    hud.innerHTML = '<div class="shadow-stat"><span>Level</span><strong id="shadow-level">1 / 3</strong></div><div class="shadow-stat"><span>Steps</span><strong id="shadow-steps">20</strong></div><div class="shadow-stat"><span>Kit</span><strong id="shadow-kit">Key 0 · noise 2</strong></div><div class="shadow-stat"><span>Score</span><strong id="shadow-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'shadow-board';
    board.setAttribute('aria-label', 'Shadow Switch board. Use arrow keys or tap neighboring cells to move, N to toss noise, and C to cloak on shadow tiles.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="shadow-overlay"><span><strong>Reach the exit without crossing a patrol light.</strong><small>Keys open gates. Terminals rotate patrols. Cloaks work only on shadow cells. Noise freezes patrols for one turn.</small></span><span class="shadow-badge">Tap or arrows</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const result = document.createElement('div');
    result.className = 'result-card shadow-log';
    result.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const noiseButton = button('Toss noise', tossNoise, true);
    const cloakButton = button('Cloak', cloak, true);
    actions.append(button('New run', reset), noiseButton, cloakButton);
    root.append(hud, board, result, actions);
    stage.append(root);

    const state = { level: 0, pos: { x: 1, y: 1 }, guards: [], steps: 0, keys: 0, noise: 2, cloak: 0, score: 0, won: false, caught: false, terminal: false };

    function reset(next = false) {
      if (next) state.level = (state.level + 1) % LEVELS.length;
      const level = LEVELS[state.level];
      state.pos = find('S');
      state.guards = level.guards.map((g) => ({ ...g, i: 0 }));
      state.steps = level.steps;
      state.keys = 0;
      state.noise = 2;
      state.cloak = 0;
      state.score = 0;
      state.won = false;
      state.caught = false;
      state.terminal = false;
      log('<strong>Blackout route loaded.</strong><small>Study the light cones, collect the key, and use tools only when they create margin.</small>');
      update();
    }

    function find(mark) {
      const map = LEVELS[state.level].map;
      for (let y = 0; y < map.length; y += 1) for (let x = 0; x < map[y].length; x += 1) if (map[y][x] === mark) return { x, y };
      return { x: 1, y: 1 };
    }

    function tile(x, y) { return LEVELS[state.level].map[y]?.[x] || '#'; }
    function isWall(x, y) { const t = tile(x, y); return t === '#' || (t === 'g' && state.keys < 1); }
    function same(a, b) { return a.x === b.x && a.y === b.y; }

    function move(dx, dy) {
      if (state.won || state.caught) return;
      const nx = state.pos.x + dx;
      const ny = state.pos.y + dy;
      if (isWall(nx, ny)) { log('<strong>Blocked.</strong><small>A gate needs a key. Walls need a different route.</small>'); return; }
      state.pos = { x: nx, y: ny };
      state.steps -= 1;
      state.score += tile(nx, ny) === 'l' ? 3 : 1;
      resolveTile();
      advancePatrols();
      checkCaught();
      checkEnd();
      update();
    }

    function resolveTile() {
      const t = tile(state.pos.x, state.pos.y);
      if (t === 'k') { state.keys = 1; state.score += 12; log('<strong>Key lifted.</strong><small>The gate is open, but patrols still move after every step.</small>'); }
      else if (t === 't' && !state.terminal) { state.terminal = true; state.score += 10; state.guards.forEach((g) => { g.d = (g.d + 1) % 4; }); log('<strong>Terminal flipped.</strong><small>Patrol lights rotated, changing the safe path.</small>'); }
      else if (t === 'c') { state.noise += 1; state.score += 5; log('<strong>Noise charge found.</strong><small>You can freeze patrols for one risky turn.</small>'); }
      else if (t === 'E') { state.won = true; }
      else log(`<strong>${state.cloak ? 'Cloaked step' : 'Silent step'}.</strong><small>${state.steps} steps remain. Avoid lit cells after patrols move.</small>`);
    }

    function advancePatrols(frozen = false) {
      if (frozen) return;
      state.guards.forEach((g) => {
        g.i = (g.i + 1) % g.p.length;
        g.x = g.p[g.i][0];
        g.y = g.p[g.i][1];
        if (!state.terminal) g.d = (g.d + 1) % 4;
      });
      if (state.cloak > 0) state.cloak -= 1;
    }

    function litCells() {
      const cells = [];
      state.guards.forEach((g) => {
        cells.push({ x: g.x, y: g.y });
        const [dx, dy] = DIRS[g.d];
        for (let r = 1; r < 4; r += 1) {
          const x = g.x + dx * r;
          const y = g.y + dy * r;
          if (tile(x, y) === '#') break;
          cells.push({ x, y });
        }
      });
      return cells;
    }

    function checkCaught() {
      if (state.cloak > 0 && tile(state.pos.x, state.pos.y) === 'l') return;
      if (litCells().some((c) => same(c, state.pos))) {
        state.caught = true;
        state.score = Math.max(0, state.score - 8);
        log('<strong>Caught in the sweep.</strong><small>Reset or replay with a noise freeze before crossing the cone.</small>');
      }
    }

    function checkEnd() {
      if (state.won) {
        state.score += 30 + Math.max(0, state.steps) * 2 + state.noise * 4 + state.keys * 4;
        log(`<strong>Exit reached: ${state.score} points.</strong><small>Saved steps and unused tools became the bonus. Load the next route for a harder pattern.</small>`);
      } else if (state.steps <= 0 && !state.caught) {
        state.caught = true;
        log('<strong>Time collapsed.</strong><small>The patrol loop tightened before you reached the exit.</small>');
      }
    }

    function tossNoise() {
      if (state.won || state.caught || state.noise < 1) return;
      state.noise -= 1;
      state.steps -= 1;
      state.score += 2;
      log('<strong>Noise tossed.</strong><small>Patrols freeze for this turn. Use the opening before the lights resume.</small>');
      checkEnd();
      update();
    }

    function cloak() {
      if (state.won || state.caught || state.cloak > 0) return;
      if (tile(state.pos.x, state.pos.y) !== 'l') { log('<strong>No shadow anchor.</strong><small>Cloak only starts on blue shadow cells.</small>'); return; }
      state.cloak = 2;
      state.score = Math.max(0, state.score - 3);
      log('<strong>Cloak active.</strong><small>You can survive one lit sweep while standing on shadow routes.</small>');
      update();
    }

    function update() {
      hud.querySelector('#shadow-level').textContent = `${state.level + 1} / ${LEVELS.length}`;
      hud.querySelector('#shadow-steps').textContent = String(Math.max(0, state.steps));
      hud.querySelector('#shadow-kit').textContent = `Key ${state.keys} · noise ${state.noise}${state.cloak ? ' · cloak' : ''}`;
      hud.querySelector('#shadow-score').textContent = String(state.score);
      noiseButton.disabled = state.noise < 1 || state.won || state.caught;
      cloakButton.disabled = state.cloak > 0 || tile(state.pos.x, state.pos.y) !== 'l' || state.won || state.caught;
      draw();
    }

    function draw() {
      const bounds = board.getBoundingClientRect();
      const width = Math.max(320, Math.floor(bounds.width));
      const height = Math.max(318, Math.floor(width * 0.58));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#070811';
      ctx.fillRect(0, 0, width, height);
      const cell = Math.min((width - 38) / 8, (height - 34) / 7);
      const ox = (width - cell * 8) / 2;
      const oy = 16;
      const lit = litCells();
      for (let y = 0; y < 7; y += 1) for (let x = 0; x < 8; x += 1) drawTile(x, y, ox, oy, cell, lit.some((c) => c.x === x && c.y === y));
      state.guards.forEach((g) => drawMark(g.x, g.y, '◆', '#ffd166', ox, oy, cell));
      drawMark(state.pos.x, state.pos.y, state.cloak ? '◉' : '●', state.caught ? '#ff6f4a' : '#bfe7d1', ox, oy, cell, true);
    }

    function drawTile(x, y, ox, oy, cell, lit) {
      const t = tile(x, y);
      const px = ox + x * cell + 3;
      const py = oy + y * cell + 3;
      ctx.fillStyle = t === '#' ? '#111827' : t === 'l' ? '#163d5a' : lit ? '#54412f' : '#172033';
      round(px, py, cell - 6, cell - 6, 9);
      ctx.fill();
      ctx.strokeStyle = lit ? 'rgba(255,209,102,.5)' : 'rgba(255,255,255,.13)';
      ctx.stroke();
      const labels = { S: 'S', E: 'E', k: 'K', g: 'G', t: 'T', c: 'N', l: '·' };
      if (labels[t]) drawMark(x, y, labels[t], t === 'E' ? '#bfe7d1' : t === 'k' ? '#fff2bd' : '#d7e9ff', ox, oy, cell);
    }

    function drawMark(x, y, label, color, ox, oy, cell, player = false) {
      const cx = ox + x * cell + cell / 2;
      const cy = oy + y * cell + cell / 2;
      ctx.fillStyle = player ? 'rgba(191,231,209,.2)' : 'rgba(255,255,255,.1)';
      ctx.beginPath();
      ctx.arc(cx, cy, player ? cell * 0.33 : cell * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.font = `900 ${Math.max(13, cell * 0.25)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy + 1);
    }

    function round(x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function log(html) { result.innerHTML = html; }

    board.addEventListener('keydown', (event) => {
      const moves = { ArrowRight: [1,0], ArrowLeft: [-1,0], ArrowDown: [0,1], ArrowUp: [0,-1] };
      if (moves[event.key]) { event.preventDefault(); move(...moves[event.key]); }
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); tossNoise(); }
      if (event.key.toLowerCase() === 'c') { event.preventDefault(); cloak(); }
    });
    board.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const cell = Math.min((rect.width - 38) / 8, (rect.height - 34) / 7);
      const ox = (rect.width - cell * 8) / 2;
      const oy = 16;
      const x = Math.floor((event.clientX - rect.left - ox) / cell);
      const y = Math.floor((event.clientY - rect.top - oy) / cell);
      const dx = x - state.pos.x;
      const dy = y - state.pos.y;
      if (Math.abs(dx) + Math.abs(dy) === 1) move(dx, dy);
    });
    actions.append(button('Next route', () => reset(true), true));
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(board);
    reset();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard);
  else initCard();
})();