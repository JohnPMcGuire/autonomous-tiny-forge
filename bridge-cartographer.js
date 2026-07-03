(() => {
  const APP = {
    name: 'Bridge Cartographer',
    emoji: '🌉',
    category: 'play',
    version: '1.0.0',
    summary: 'Connect island towns with scarce spans while currents, weight, and budgets fight the route.',
    description: 'A local spatial planning puzzle with bridge placement, material limits, current hazards, stability checks, level goals, scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and clean teardown.'
  };
  const LEVELS = [
    { name: 'Sheltered delta', budget: 10, goal: 3, towns: [[1,1],[5,1],[3,4]], reefs: [[2,2],[4,3]], current: [[1,3],[2,3],[3,3]] },
    { name: 'Forked channel', budget: 12, goal: 4, towns: [[1,1],[6,1],[1,5],[6,5]], reefs: [[3,2],[4,4]], current: [[2,4],[3,4],[4,4]] },
    { name: 'Tide lock', budget: 14, goal: 4, towns: [[0,2],[3,0],[6,2],[3,5]], reefs: [[2,2],[4,2],[3,3]], current: [[1,4],[2,4],[4,4],[5,4]] }
  ];
  const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];

  function installStyles() {
    if (document.querySelector('#bridge-cartographer-styles')) return;
    const style = document.createElement('style');
    style.id = 'bridge-cartographer-styles';
    style.textContent = `.bridge-card{animation:bridge-rise .32s ease both}.bridge-game{max-width:940px;gap:14px}.bridge-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.bridge-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.bridge-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.bridge-stat strong{display:block;margin-top:4px;font-size:1rem}.bridge-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#07131d;color:white;cursor:pointer;touch-action:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.bridge-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.bridge-board canvas{display:block;width:100%;min-height:370px}.bridge-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.bridge-overlay strong{font-size:clamp(1.05rem,3vw,1.5rem)}.bridge-overlay small{display:block;max-width:630px;color:rgba(255,255,255,.76)}.bridge-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#bfdbfe;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.bridge-tools{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.bridge-tools button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.bridge-tools button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.bridge-tools span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.bridge-log{min-height:104px;padding:17px 19px}.bridge-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:760px){.bridge-hud{grid-template-columns:repeat(2,1fr)}.bridge-tools{grid-template-columns:repeat(2,1fr)}.bridge-board canvas{min-height:330px}.bridge-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.bridge-card{animation:none}}@keyframes bridge-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-bridge-cartographer-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.bridgeCartographerCard = 'true';
    card.classList.add('bridge-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openBridgeCartographer);
    grid.append(node);
  }

  function openBridgeCartographer() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Bridge%20Cartographer';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel bridge-game';
    const hud = document.createElement('div');
    hud.className = 'bridge-hud';
    hud.innerHTML = '<div class="bridge-stat"><span>Map</span><strong id="bridge-level">1 / 3</strong></div><div class="bridge-stat"><span>Material</span><strong id="bridge-budget">10</strong></div><div class="bridge-stat"><span>Linked</span><strong id="bridge-linked">1</strong></div><div class="bridge-stat"><span>Stability</span><strong id="bridge-stability">100</strong></div><div class="bridge-stat"><span>Score</span><strong id="bridge-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'bridge-board';
    board.setAttribute('aria-label', 'Bridge Cartographer board. Select water cells to place bridges, connect towns, and manage stability.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="bridge-overlay"><span><strong>Draw bridges from town to town without exhausting material.</strong><small>Tap cells, use arrows to move the cursor, Enter to build, Backspace to salvage, and Space to inspect.</small></span><span class="bridge-badge">Canvas puzzle</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const tools = document.createElement('div');
    tools.className = 'bridge-tools';
    const log = document.createElement('div');
    log.className = 'result-card bridge-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const button = (text, fn, secondary) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = secondary ? 'button button-secondary' : 'button';
      item.textContent = text;
      item.addEventListener('click', fn);
      return item;
    };
    actions.append(button('Build', buildAtCursor), button('Salvage', salvageAtCursor, true), button('Next map', nextLevel), button('Restart map', reset, true));
    root.append(hud, board, tools, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { level: 0, cursor: [0, 0], spans: new Set(), score: 0, tick: 0, raf: 0, done: false };

    function key(x, y) { return `${x},${y}`; }
    function parse(value) { return value.split(',').map(Number); }
    function level() { return LEVELS[state.level]; }
    function has(list, x, y) { return list.some(([a, b]) => a === x && b === y); }
    function isTown(x, y) { return has(level().towns, x, y); }
    function isReef(x, y) { return has(level().reefs, x, y); }
    function isCurrent(x, y) { return has(level().current, x, y); }
    function isSpan(x, y) { return state.spans.has(key(x, y)); }
    function inBounds(x, y) { return x >= 0 && y >= 0 && x < 7 && y < 6; }
    function cost(x, y) { return isCurrent(x, y) ? 2 : 1; }
    function spent() {
      return [...state.spans].reduce((sum, item) => {
        const [x, y] = parse(item);
        return sum + cost(x, y);
      }, 0);
    }
    function nearReef(x, y) { return DIRS.some(([dx, dy]) => isReef(x + dx, y + dy)); }
    function stability() {
      let value = 100;
      for (const item of state.spans) {
        const [x, y] = parse(item);
        if (isCurrent(x, y)) value -= 8;
        if (nearReef(x, y)) value -= 5;
        const neighbors = DIRS.filter(([dx, dy]) => isSpan(x + dx, y + dy) || isTown(x + dx, y + dy)).length;
        if (neighbors <= 1) value -= 3;
      }
      return Math.max(0, value);
    }
    function linkedTowns() {
      const seen = new Set();
      const start = level().towns[0];
      const queue = [start];
      seen.add(key(start[0], start[1]));
      while (queue.length) {
        const [x, y] = queue.shift();
        for (const [dx, dy] of DIRS) {
          const nx = x + dx, ny = y + dy, id = key(nx, ny);
          if (!inBounds(nx, ny) || seen.has(id)) continue;
          if (isTown(nx, ny) || isSpan(nx, ny)) {
            seen.add(id);
            queue.push([nx, ny]);
          }
        }
      }
      return level().towns.filter(([x, y]) => seen.has(key(x, y))).length;
    }
    function canBuild(x, y) {
      return inBounds(x, y) && !isTown(x, y) && !isReef(x, y) && !isSpan(x, y) && spent() + cost(x, y) <= level().budget;
    }
    function buildAtCursor() {
      if (state.done) return;
      const [x, y] = state.cursor;
      if (!canBuild(x, y)) {
        say('<strong>That span cannot be placed.</strong><small>Towns and reefs are fixed, currents cost two material, and the budget cannot go below zero.</small>');
        draw();
        return;
      }
      state.spans.add(key(x, y));
      state.score += isCurrent(x, y) ? 3 : 5;
      const linked = linkedTowns();
      if (linked >= level().goal && stability() > 25) {
        state.done = true;
        const bonus = (level().budget - spent()) * 10 + stability() + linked * 20;
        state.score += bonus;
        say(`<strong>${level().name} chart approved. Score ${state.score}.</strong><small>${linked} towns linked with ${level().budget - spent()} material unused and ${stability()} stability.</small>`);
      } else if (stability() <= 0) {
        state.done = true;
        say('<strong>The bridge web failed inspection.</strong><small>Too many exposed spans fought the current. Salvage and restart the map.</small>');
      } else {
        say(`<strong>Span placed.</strong><small>${linked} of ${level().goal} required towns linked. Current cells score more but weaken stability.</small>`);
      }
      update();
    }
    function salvageAtCursor() {
      if (state.done) return;
      const id = key(state.cursor[0], state.cursor[1]);
      if (!state.spans.has(id)) {
        say('<strong>No salvage there.</strong><small>Move the cursor onto a built span first.</small>');
        return;
      }
      state.spans.delete(id);
      state.score = Math.max(0, state.score - 4);
      say('<strong>Span salvaged.</strong><small>You recovered material, but the revision cost four points.</small>');
      update();
    }
    function nextLevel() {
      state.level = (state.level + 1) % LEVELS.length;
      reset(false);
    }
    function reset(keepLevel = true) {
      if (!keepLevel) state.score = 0;
      state.spans.clear();
      state.cursor = [...level().towns[0]];
      state.done = false;
      say(`<strong>${level().name}</strong><small>Connect ${level().goal} towns before material runs out. Reefs block construction; current cells cost extra and reduce stability.</small>`);
      update();
    }
    function say(html) { log.innerHTML = html; }
    function updateHud() {
      hud.querySelector('#bridge-level').textContent = `${state.level + 1} / ${LEVELS.length}`;
      hud.querySelector('#bridge-budget').textContent = `${Math.max(0, level().budget - spent())}`;
      hud.querySelector('#bridge-linked').textContent = `${linkedTowns()} / ${level().goal}`;
      hud.querySelector('#bridge-stability').textContent = stability();
      hud.querySelector('#bridge-score').textContent = state.score;
    }
    function updateTools() {
      tools.replaceChildren();
      [
        ['Town', 'Must connect all required towns.'],
        ['Current', 'Costs two material and weakens stability.'],
        ['Reef', 'Blocks construction and weakens adjacent spans.'],
        ['Span', 'Carries the route but needs support.']
      ].forEach(([name, note]) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.setAttribute('aria-pressed', String(name === 'Span' && isSpan(state.cursor[0], state.cursor[1])));
        item.innerHTML = `<span>${name}</span><strong>${note}</strong>`;
        item.addEventListener('click', () => say(`<strong>${name}</strong><small>${note}</small>`));
        tools.append(item);
      });
    }
    function update() {
      updateHud();
      updateTools();
      draw();
    }
    function placeCursor(x, y) {
      state.cursor = [Math.max(0, Math.min(6, x)), Math.max(0, Math.min(5, y))];
      draw();
    }
    function boardPoint(event) {
      const rect = canvas.getBoundingClientRect();
      return [Math.floor((event.clientX - rect.left) / (rect.width / 7)), Math.floor((event.clientY - rect.top) / (rect.height / 6))];
    }
    board.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      const [x, y] = boardPoint(event);
      placeCursor(x, y);
      if (isSpan(x, y)) salvageAtCursor(); else buildAtCursor();
    });
    board.addEventListener('keydown', (event) => {
      const [x, y] = state.cursor;
      if (event.key === 'ArrowLeft') { event.preventDefault(); placeCursor(x - 1, y); }
      if (event.key === 'ArrowRight') { event.preventDefault(); placeCursor(x + 1, y); }
      if (event.key === 'ArrowUp') { event.preventDefault(); placeCursor(x, y - 1); }
      if (event.key === 'ArrowDown') { event.preventDefault(); placeCursor(x, y + 1); }
      if (event.key === 'Enter') { event.preventDefault(); buildAtCursor(); }
      if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); salvageAtCursor(); }
      if (event.key === ' ') { event.preventDefault(); inspectCursor(); }
    });
    function inspectCursor() {
      const [x, y] = state.cursor;
      const label = isTown(x, y) ? 'Town' : isReef(x, y) ? 'Reef' : isCurrent(x, y) ? 'Current' : isSpan(x, y) ? 'Span' : 'Open water';
      say(`<strong>${label} at ${x + 1}, ${y + 1}</strong><small>Material spent ${spent()} of ${level().budget}; stability ${stability()}.</small>`);
    }
    function roundedRect(x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
    function draw() {
      if (state.raf) cancelAnimationFrame(state.raf);
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      const width = Math.max(320, Math.floor(rect.width || 760));
      const height = Math.max(320, Math.floor(rect.height || 370));
      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const cell = Math.min(width / 7, height / 6);
      const ox = (width - cell * 7) / 2;
      const oy = (height - cell * 6) / 2;
      ctx.fillStyle = '#082033';
      ctx.fillRect(0, 0, width, height);
      state.tick += reduced ? 0 : 0.025;
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 7; x++) {
          const px = ox + x * cell, py = oy + y * cell;
          ctx.fillStyle = isCurrent(x, y) ? '#164e63' : '#0f2f45';
          ctx.fillRect(px + 3, py + 3, cell - 6, cell - 6);
          if (isCurrent(x, y) && !reduced) {
            ctx.strokeStyle = 'rgba(125,211,252,.55)';
            ctx.beginPath();
            ctx.moveTo(px + 12 + Math.sin(state.tick + x) * 4, py + cell / 2);
            ctx.lineTo(px + cell - 12, py + cell / 2);
            ctx.stroke();
          }
          if (isReef(x, y)) {
            ctx.fillStyle = '#7f1d1d';
            ctx.beginPath();
            ctx.arc(px + cell / 2, py + cell / 2, cell * .22, 0, Math.PI * 2);
            ctx.fill();
          }
          if (isSpan(x, y)) {
            ctx.fillStyle = nearReef(x, y) ? '#f59e0b' : '#fef3c7';
            ctx.fillRect(px + cell * .2, py + cell * .42, cell * .6, cell * .16);
            ctx.fillRect(px + cell * .42, py + cell * .2, cell * .16, cell * .6);
          }
          if (isTown(x, y)) {
            ctx.fillStyle = '#bbf7d0';
            roundedRect(px + cell * .22, py + cell * .22, cell * .56, cell * .56, 9);
            ctx.fill();
          }
        }
      }
      const [cx, cy] = state.cursor;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.strokeRect(ox + cx * cell + 5, oy + cy * cell + 5, cell - 10, cell - 10);
      if (!reduced && !state.done) state.raf = requestAnimationFrame(draw);
    }
    const stop = () => { if (state.raf) cancelAnimationFrame(state.raf); window.removeEventListener('resize', draw); };
    const dialog = document.querySelector('#app-dialog');
    dialog?.addEventListener('close', stop, { once: true });
    window.addEventListener('resize', draw, { passive: true });
    reset();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCard, { once: true });
  } else {
    initCard();
  }
})();
