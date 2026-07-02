(() => {
  const APP = {
    name: 'Switchyard Shuffle',
    emoji: '🚂',
    category: 'play',
    version: '1.0.0',
    summary: 'Set rail switches before each tick to deliver cars in the right order.',
    description: 'A local sequencing puzzle with moving cars, switch timing, ordered platforms, limited moves, memory pressure, scoring, touch, keyboard, and canvas play.'
  };

  const LEVELS = [
    { cars: ['A', 'B', 'C'], order: ['B', 'A', 'C'], moves: 8, speed: 720, title: 'First yard' },
    { cars: ['A', 'B', 'C', 'D'], order: ['C', 'A', 'D', 'B'], moves: 10, speed: 650, title: 'Rush split' },
    { cars: ['A', 'B', 'C', 'D'], order: ['D', 'B', 'A', 'C'], moves: 9, speed: 590, title: 'Tight window' }
  ];
  const SWITCHES = [
    { x: 2, y: 2, keys: ['1', 'q'] },
    { x: 4, y: 1, keys: ['2', 'w'] },
    { x: 5, y: 3, keys: ['3', 'e'] }
  ];
  const PATHS = {
    top: [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 }],
    mid: [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 3 }],
    low: [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 4 }, { x: 7, y: 4 }]
  };

  function installStyles() {
    if (document.querySelector('#switchyard-styles')) return;
    const style = document.createElement('style');
    style.id = 'switchyard-styles';
    style.textContent = `
      .switchyard-card { animation: switchyard-rise .36s ease both; }
      .switchyard-game { max-width: 880px; gap: 14px; }
      .switchyard-hud { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
      .switchyard-stat { border: 1px solid var(--line); border-radius: 15px; background: white; padding: 10px 12px; }
      .switchyard-stat span { display: block; color: var(--muted); font-size: .64rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
      .switchyard-stat strong { display: block; margin-top: 4px; font-size: 1rem; }
      .switchyard-board { position: relative; border: 0; border-radius: 26px; padding: 0; overflow: hidden; background: #07110d; color: white; cursor: pointer; touch-action: manipulation; box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); }
      .switchyard-board:focus-visible { outline: 4px solid var(--accent); outline-offset: 4px; }
      .switchyard-board canvas { display: block; width: 100%; min-height: 340px; }
      .switchyard-overlay { position: absolute; left: 18px; right: 18px; bottom: 16px; display: flex; justify-content: space-between; gap: 12px; align-items: end; pointer-events: none; }
      .switchyard-overlay strong { font-size: clamp(1.1rem, 3vw, 1.55rem); }
      .switchyard-overlay small { display: block; max-width: 560px; color: rgba(255,255,255,.72); }
      .switchyard-badge { padding: 7px 9px; border-radius: 999px; background: rgba(255,255,255,.12); color: #fff2bd; font-size: .68rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      .switchyard-log { min-height: 96px; padding: 17px 19px; }
      .switchyard-log strong { font-size: clamp(1.1rem, 3vw, 1.55rem); }
      @media (max-width: 620px) { .switchyard-hud { grid-template-columns: repeat(2, 1fr); } .switchyard-board canvas { min-height: 315px; } .switchyard-overlay { align-items: start; flex-direction: column; } }
      @media (prefers-reduced-motion: reduce) { .switchyard-card { animation: none; } }
      @keyframes switchyard-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-switchyard-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.switchyardCard = 'true';
    card.classList.add('switchyard-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const button = node.querySelector('.app-card-button');
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', openSwitchyard);
    grid.append(node);
  }

  function openSwitchyard() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Switchyard%20Shuffle';
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
    root.className = 'tool-panel switchyard-game';
    const hud = document.createElement('div');
    hud.className = 'switchyard-hud';
    hud.innerHTML = '<div class="switchyard-stat"><span>Level</span><strong id="switchyard-level">1 / 3</strong></div><div class="switchyard-stat"><span>Next car</span><strong id="switchyard-next">B</strong></div><div class="switchyard-stat"><span>Moves</span><strong id="switchyard-moves">8</strong></div><div class="switchyard-stat"><span>Score</span><strong id="switchyard-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'switchyard-board';
    board.setAttribute('aria-label', 'Switchyard board. Tap switches or press 1, 2, and 3 to route cars before each launch.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="switchyard-overlay"><span><strong>Send cars to the platform in order.</strong><small>Tap switches before launch. Each wrong platform costs trust. Rebuild the order before moves run out.</small></span><span class="switchyard-badge">Tap switches · 1 2 3</span></span>';
    const canvas = board.querySelector('canvas');
    const context = canvas.getContext('2d');
    const log = document.createElement('div');
    log.className = 'result-card switchyard-log';
    log.setAttribute('aria-live', 'polite');
    const state = { level: 0, score: 0, switches: [0, 0, 0], launched: [], moving: null, step: 0, trust: 3, moves: LEVELS[0].moves, lastTick: 0, complete: false, raf: 0 };
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    actions.append(makeButton('Launch car', launchCar), makeButton('Next yard', nextLevel, true), makeButton('Reset yard', resetLevel, true));
    root.append(hud, board, log, actions);
    stage.append(root);

    function currentLevel() { return LEVELS[state.level]; }
    function nextNeeded() { return currentLevel().order[state.launched.length] || 'Done'; }
    function availableCar() { return currentLevel().cars[state.launched.length] || null; }
    function routeName() { return state.switches[0] === 0 ? 'top' : state.switches[2] === 1 ? 'low' : state.switches[1] === 0 ? 'mid' : 'top'; }
    function destinationFor(route) { return route === 'top' ? 'A' : route === 'mid' ? 'B' : 'C'; }

    function launchCar() {
      if (state.moving || state.complete) return;
      const car = availableCar();
      if (!car) return;
      if (state.moves <= 0) {
        writeLog('<strong>No moves left.</strong><small>Reset the yard and try a cleaner switch plan.</small>');
        return;
      }
      const route = routeName();
      state.moves -= 1;
      state.moving = { car, route, path: PATHS[route] };
      state.step = 0;
      state.lastTick = performance.now();
      writeLog(`<strong>${car} is rolling.</strong><small>Watch where the current switch state sends it.</small>`);
      update();
    }

    function arrive() {
      const moving = state.moving;
      if (!moving) return;
      const target = nextNeeded();
      const destination = destinationFor(moving.route);
      if (destination === target || moving.car === target) {
        state.score += 20 + state.moves + state.trust * 3;
        state.launched.push(moving.car);
        writeLog(`<strong>${moving.car} delivered cleanly.</strong><small>${state.launched.length < currentLevel().cars.length ? `Next required car: ${nextNeeded()}.` : 'Yard cleared.'}</small>`);
      } else {
        state.trust -= 1;
        state.score = Math.max(0, state.score - 6);
        writeLog(`<strong>${moving.car} hit the wrong platform.</strong><small>Trust dropped. Required ${target}, route led to ${destination}.</small>`);
      }
      state.moving = null;
      if (state.launched.length >= currentLevel().cars.length) {
        state.complete = true;
        state.score += state.trust * 12 + state.moves * 2;
        writeLog(`<strong>${currentLevel().title} complete: ${state.score} points.</strong><small>Advance for a tighter yard with less timing margin.</small>`);
      } else if (state.trust <= 0 || state.moves <= 0) {
        state.complete = true;
        writeLog('<strong>Yard failed safely.</strong><small>Reset and try another switch sequence before launching.</small>');
      }
      update();
    }

    function toggleSwitch(index) {
      if (state.moving || state.complete) return;
      state.switches[index] = state.switches[index] ? 0 : 1;
      state.score = Math.max(0, state.score - 1);
      writeLog(`<strong>Switch ${index + 1} flipped.</strong><small>Current route: ${routeName().toUpperCase()} platform. Launch when the order looks right.</small>`);
      update();
    }

    function nextLevel() { state.level = (state.level + 1) % LEVELS.length; state.score = 0; resetLevel(false); }
    function resetLevel(clearScore = true) {
      if (clearScore) state.score = 0;
      state.switches = [0, 0, 0];
      state.launched = [];
      state.moving = null;
      state.step = 0;
      state.trust = 3;
      state.moves = currentLevel().moves;
      state.complete = false;
      writeLog(`<strong>${currentLevel().title} loaded.</strong><small>Required order: ${currentLevel().order.join(' → ')}. Incoming cars: ${currentLevel().cars.join(', ')}.</small>`);
      update();
    }

    function update() {
      hud.querySelector('#switchyard-level').textContent = `${state.level + 1} / ${LEVELS.length}`;
      hud.querySelector('#switchyard-next').textContent = `${nextNeeded()} · trust ${state.trust}`;
      hud.querySelector('#switchyard-moves').textContent = String(state.moves);
      hud.querySelector('#switchyard-score').textContent = String(state.score);
      draw();
    }

    function draw() {
      const bounds = board.getBoundingClientRect();
      const width = Math.max(320, Math.floor(bounds.width));
      const height = Math.max(330, Math.floor(width * 0.56));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#07110d';
      context.fillRect(0, 0, width, height);
      const cell = Math.min((width - 40) / 8, (height - 70) / 5);
      const ox = (width - cell * 8) / 2;
      const oy = 24;
      drawRails(ox, oy, cell);
      drawPlatforms(ox, oy, cell);
      SWITCHES.forEach((point, index) => drawSwitch(point, index, ox, oy, cell));
      currentLevel().cars.forEach((car, index) => {
        if (index < state.launched.length || (state.moving && state.moving.car === car)) return;
        drawCar({ x: -0.25 - index * 0.48, y: 2 }, car, '#fff2bd', ox, oy, cell);
      });
      if (state.moving) drawCar(state.moving.path[Math.min(state.step, state.moving.path.length - 1)], state.moving.car, '#ff6f4a', ox, oy, cell);
    }

    function drawRails(ox, oy, cell) {
      context.lineWidth = Math.max(5, cell * 0.09);
      context.lineCap = 'round';
      Object.entries(PATHS).forEach(([name, path]) => {
        context.strokeStyle = name === routeName() ? '#fff2bd' : 'rgba(255,255,255,.2)';
        context.beginPath();
        path.forEach((point, index) => {
          const x = ox + point.x * cell + cell / 2;
          const y = oy + point.y * cell + cell / 2;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();
      });
    }

    function drawPlatforms(ox, oy, cell) {
      [['A', 7, 1], ['B', 7, 3], ['C', 7, 4]].forEach(([label, x, y]) => {
        context.fillStyle = label === nextNeeded() ? 'rgba(191,231,209,.32)' : 'rgba(255,255,255,.1)';
        rounded(ox + x * cell + 6, oy + y * cell + 6, cell - 12, cell - 12, 11);
        context.fill();
        context.fillStyle = '#ffffff';
        context.font = `900 ${Math.max(15, cell * 0.3)}px system-ui, sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(label, ox + x * cell + cell / 2, oy + y * cell + cell / 2);
      });
    }

    function drawSwitch(point, index, ox, oy, cell) {
      const x = ox + point.x * cell + cell / 2;
      const y = oy + point.y * cell + cell / 2;
      context.fillStyle = state.switches[index] ? '#ff6f4a' : '#bfe7d1';
      context.beginPath();
      context.arc(x, y, cell * 0.21, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#07110d';
      context.font = `900 ${Math.max(12, cell * 0.22)}px system-ui, sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(String(index + 1), x, y);
    }

    function drawCar(point, label, color, ox, oy, cell) {
      const x = ox + point.x * cell + cell * 0.18;
      const y = oy + point.y * cell + cell * 0.2;
      context.fillStyle = 'rgba(255,255,255,.13)';
      rounded(x - 3, y + 5, cell * 0.76, cell * 0.54, 12);
      context.fill();
      context.fillStyle = color;
      rounded(x, y, cell * 0.68, cell * 0.46, 10);
      context.fill();
      context.fillStyle = '#07110d';
      context.font = `900 ${Math.max(14, cell * 0.25)}px system-ui, sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(label, x + cell * 0.34, y + cell * 0.23);
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

    function writeLog(html) { log.innerHTML = html; }
    function tick(now) {
      if (document.body.contains(root)) {
        if (state.moving && now - state.lastTick > currentLevel().speed) {
          state.step += 1;
          state.lastTick = now;
          if (state.step >= state.moving.path.length) arrive();
          else draw();
        }
        state.raf = window.requestAnimationFrame(tick);
      } else if (state.raf) window.cancelAnimationFrame(state.raf);
    }

    board.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const cell = Math.min((rect.width - 40) / 8, (rect.height - 70) / 5);
      const ox = (rect.width - cell * 8) / 2;
      const oy = 24;
      const x = Math.round((event.clientX - rect.left - ox - cell / 2) / cell);
      const y = Math.round((event.clientY - rect.top - oy - cell / 2) / cell);
      const index = SWITCHES.findIndex((point) => point.x === x && point.y === y);
      if (index >= 0) toggleSwitch(index);
    });
    board.addEventListener('keydown', (event) => {
      const index = SWITCHES.findIndex((item) => item.keys.includes(event.key.toLowerCase()));
      if (index >= 0) { event.preventDefault(); toggleSwitch(index); }
      else if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); launchCar(); }
    });
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(board);
    resetLevel();
    state.raf = window.requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard);
  else initCard();
})();
