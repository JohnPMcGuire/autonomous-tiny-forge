(() => {
  const APP = {
    name: 'Tempo Kitchen',
    emoji: '🍳',
    category: 'play',
    version: '1.0.0',
    summary: 'Run a tiny service rush by timing prep, heat, plating, patience, and recovery.',
    description: 'A local time-management game with recipe memory, station timing, customer patience, burn risk, scoring, adaptive rushes, touch, keyboard, and responsive canvas play.'
  };

  const RECIPES = [
    { name: 'Toast stack', prep: 'slice', heat: 'toast', color: '#fff2bd' },
    { name: 'Pepper soup', prep: 'chop', heat: 'simmer', color: '#ffb36b' },
    { name: 'Garden taco', prep: 'chop', heat: 'sear', color: '#bfe7d1' },
    { name: 'Cup cake', prep: 'mix', heat: 'bake', color: '#d7dff3' }
  ];
  const ROUNDS = [
    { title: 'Soft open', orders: 4, patience: 24, mistakes: 3, gap: 4.8 },
    { title: 'Lunch pop', orders: 5, patience: 21, mistakes: 2, gap: 3.8 },
    { title: 'Rush hour', orders: 6, patience: 18, mistakes: 2, gap: 3.0 }
  ];
  const STATIONS = [
    { id: 'prep', label: 'Prep', key: '1', x: 0.17, y: 0.73 },
    { id: 'heat', label: 'Heat', key: '2', x: 0.5, y: 0.73 },
    { id: 'plate', label: 'Plate', key: '3', x: 0.83, y: 0.73 }
  ];

  function installStyles() {
    if (document.querySelector('#tempo-kitchen-styles')) return;
    const style = document.createElement('style');
    style.id = 'tempo-kitchen-styles';
    style.textContent = `
      .tempo-card { animation: tempo-pop .36s ease both; }
      .tempo-game { max-width: 920px; gap: 14px; }
      .tempo-hud { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
      .tempo-stat { border: 1px solid var(--line); border-radius: 15px; background: white; padding: 10px 12px; }
      .tempo-stat span { display: block; color: var(--muted); font-size: .64rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
      .tempo-stat strong { display: block; margin-top: 4px; font-size: 1rem; }
      .tempo-board { position: relative; border: 0; border-radius: 26px; overflow: hidden; padding: 0; background: #10120d; color: white; cursor: pointer; touch-action: manipulation; box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); }
      .tempo-board:focus-visible { outline: 4px solid var(--accent); outline-offset: 4px; }
      .tempo-board canvas { display: block; width: 100%; min-height: 370px; }
      .tempo-overlay { position: absolute; left: 18px; right: 18px; bottom: 16px; display: flex; justify-content: space-between; gap: 12px; align-items: end; pointer-events: none; }
      .tempo-overlay strong { font-size: clamp(1.05rem, 3vw, 1.55rem); }
      .tempo-overlay small { display: block; max-width: 610px; color: rgba(255,255,255,.72); }
      .tempo-badge { padding: 7px 9px; border-radius: 999px; background: rgba(255,255,255,.12); color: #fff2bd; font-size: .68rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
      .tempo-log { min-height: 102px; padding: 17px 19px; }
      .tempo-log strong { font-size: clamp(1.1rem, 3vw, 1.5rem); }
      .tempo-stations { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .tempo-stations .button { width: 100%; }
      @media (max-width: 640px) { .tempo-hud { grid-template-columns: repeat(2, 1fr); } .tempo-board canvas { min-height: 340px; } .tempo-overlay { align-items: start; flex-direction: column; } .tempo-stations { grid-template-columns: 1fr; } }
      @media (prefers-reduced-motion: reduce) { .tempo-card { animation: none; } }
      @keyframes tempo-pop { from { opacity: 0; transform: translateY(12px) scale(.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
    `;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-tempo-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.tempoCard = 'true';
    card.classList.add('tempo-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const button = node.querySelector('.app-card-button');
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', openTempoKitchen);
    grid.append(node);
  }

  function openTempoKitchen() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Tempo%20Kitchen';
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
    root.className = 'tool-panel tempo-game';
    const hud = document.createElement('div');
    hud.className = 'tempo-hud';
    hud.innerHTML = '<div class="tempo-stat"><span>Rush</span><strong id="tempo-round">1 / 3</strong></div><div class="tempo-stat"><span>Orders</span><strong id="tempo-orders">0</strong></div><div class="tempo-stat"><span>Mistakes</span><strong id="tempo-mistakes">0</strong></div><div class="tempo-stat"><span>Score</span><strong id="tempo-score">0</strong></div>';

    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'tempo-board';
    board.setAttribute('aria-label', 'Tempo Kitchen board. Select prep, heat, and plate stations to finish orders before patience runs out.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="tempo-overlay"><span><strong>Read the ticket, then move food through prep, heat, and plate.</strong><small>Wrong stations waste patience. Overheated food burns. Clean service unlocks harder rushes.</small></span><span class="tempo-badge">Tap · 1 2 3 · space</span></span>';
    const canvas = board.querySelector('canvas');
    const context = canvas.getContext('2d');

    const log = document.createElement('div');
    log.className = 'result-card tempo-log';
    log.setAttribute('aria-live', 'polite');

    const stationButtons = document.createElement('div');
    stationButtons.className = 'tempo-stations';
    STATIONS.forEach((station) => stationButtons.append(makeButton(`${station.label} (${station.key})`, () => useStation(station.id))));

    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    actions.append(makeButton('Start rush', startRush), makeButton('Next rush', nextRush, true), makeButton('Reset', resetGame, true));
    root.append(hud, board, stationButtons, log, actions);
    stage.append(root);

    const state = { round: 0, score: 0, mistakes: ROUNDS[0].mistakes, orders: [], served: 0, active: null, station: 'prep', nextOrder: 0, running: false, complete: false, raf: 0, last: 0, reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches };

    function currentRound() { return ROUNDS[state.round]; }
    function recipeFor(index) { return RECIPES[(index + state.round * 2) % RECIPES.length]; }
    function buildOrder(index) {
      const recipe = recipeFor(index);
      const patience = currentRound().patience + (index % 2) * 3;
      return { recipe, patience, maxPatience: patience, step: 0, ready: false };
    }

    function startRush() {
      if (state.running) return;
      state.running = true;
      state.complete = false;
      state.orders = [buildOrder(0)];
      state.active = state.orders[0];
      state.served = 0;
      state.mistakes = currentRound().mistakes;
      state.station = 'prep';
      state.nextOrder = currentRound().gap;
      writeLog(`<strong>${currentRound().title} started.</strong><small>Serve ${currentRound().orders} tickets. Each recipe expects a specific prep action, heat action, then plate.</small>`);
      update();
    }

    function resetGame() {
      state.score = 0;
      state.running = false;
      state.complete = false;
      state.orders = [];
      state.active = null;
      state.served = 0;
      state.mistakes = currentRound().mistakes;
      state.nextOrder = 0;
      writeLog(`<strong>${currentRound().title} ready.</strong><small>Tap Start rush. Use prep, heat, and plate in sequence; keyboard shortcuts 1, 2, 3 also work.</small>`);
      update();
    }

    function nextRush() {
      state.round = (state.round + 1) % ROUNDS.length;
      resetGame();
    }

    function useStation(station) {
      if (!state.running || state.complete) {
        if (!state.running) startRush();
        return;
      }
      const order = state.active || state.orders[0];
      if (!order) return;
      state.active = order;
      const needed = order.step === 0 ? 'prep' : order.step === 1 ? 'heat' : 'plate';
      if (station !== needed) {
        miss(`Wrong station. ${order.recipe.name} needs ${needed} next.`);
        return;
      }
      state.station = station;
      if (station === 'prep') {
        order.step = 1;
        state.score += 8;
        writeLog(`<strong>${order.recipe.prep} complete.</strong><small>Move ${order.recipe.name} to heat before patience fades.</small>`);
      } else if (station === 'heat') {
        order.step = 2;
        order.ready = true;
        state.score += 12;
        writeLog(`<strong>${order.recipe.heat} timed.</strong><small>Plate it quickly. Waiting too long after heat risks a burn penalty.</small>`);
      } else {
        serve(order);
      }
      update();
    }

    function serve(order) {
      const patienceBonus = Math.max(0, Math.round(order.patience));
      state.score += 35 + patienceBonus;
      state.served += 1;
      state.orders = state.orders.filter((item) => item !== order);
      state.active = state.orders[0] || null;
      writeLog(`<strong>${order.recipe.name} served.</strong><small>+${35 + patienceBonus}. Keep the line clean for a rush bonus.</small>`);
      if (state.served >= currentRound().orders) finishRush(true);
    }

    function miss(message) {
      state.mistakes -= 1;
      state.score = Math.max(0, state.score - 10);
      writeLog(`<strong>${message}</strong><small>${state.mistakes} recovery tickets remain before service fails.</small>`);
      if (state.mistakes <= 0) finishRush(false);
      update();
    }

    function finishRush(won) {
      state.running = false;
      state.complete = true;
      if (won) {
        const bonus = state.mistakes * 25 + (state.round + 1) * 20;
        state.score += bonus;
        writeLog(`<strong>${currentRound().title} cleared: ${state.score} points.</strong><small>Clean recoveries earned a ${bonus} point bonus. Try the next rush for less patience and faster tickets.</small>`);
      } else {
        writeLog('<strong>Service broke safely.</strong><small>Reset this rush and use the ticket colors plus station order to recover faster.</small>');
      }
      update();
    }

    function updateOrders(dt) {
      if (!state.running || state.complete) return;
      state.nextOrder -= dt;
      if (state.orders.length < 3 && state.served + state.orders.length < currentRound().orders && state.nextOrder <= 0) {
        const nextIndex = state.served + state.orders.length;
        state.orders.push(buildOrder(nextIndex));
        state.active ||= state.orders[0];
        state.nextOrder = currentRound().gap;
      }
      state.orders.forEach((order) => {
        order.patience -= dt;
        if (order.ready) order.patience -= dt * 0.35;
      });
      const expired = state.orders.find((order) => order.patience <= 0);
      if (expired) {
        state.orders = state.orders.filter((order) => order !== expired);
        state.active = state.orders[0] || null;
        miss(`${expired.recipe.name} walked out.`);
      }
      const burned = state.orders.find((order) => order.ready && order.patience < order.maxPatience * 0.32);
      if (burned) {
        burned.ready = false;
        burned.step = 1;
        burned.patience = Math.max(4, burned.patience);
        miss(`${burned.recipe.name} burned and went back to heat.`);
      }
    }

    function update() {
      hud.querySelector('#tempo-round').textContent = `${state.round + 1} / ${ROUNDS.length}`;
      hud.querySelector('#tempo-orders').textContent = `${state.served} / ${currentRound().orders}`;
      hud.querySelector('#tempo-mistakes').textContent = String(state.mistakes);
      hud.querySelector('#tempo-score').textContent = String(state.score);
      draw();
    }

    function draw() {
      const bounds = board.getBoundingClientRect();
      const width = Math.max(320, Math.floor(bounds.width));
      const height = Math.max(350, Math.floor(width * 0.58));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#10120d';
      context.fillRect(0, 0, width, height);
      drawCounter(width, height);
      drawTickets(width, height);
      drawStations(width, height);
      drawFood(width, height);
    }

    function drawCounter(width, height) {
      context.fillStyle = '#17231d';
      context.fillRect(0, height * 0.58, width, height * 0.42);
      context.fillStyle = 'rgba(255,255,255,.07)';
      for (let i = 0; i < 9; i += 1) context.fillRect(i * width / 8, 0, 1, height);
      context.fillStyle = '#fff2bd';
      context.font = '900 22px system-ui, sans-serif';
      context.textAlign = 'left';
      context.fillText(currentRound().title, 20, 34);
      context.fillStyle = 'rgba(255,255,255,.68)';
      context.font = '700 13px system-ui, sans-serif';
      context.fillText(state.running ? 'Tickets age in real time. Plate heated orders before they burn.' : 'Start a rush, then use prep, heat, plate.', 20, 56);
    }

    function drawTickets(width, height) {
      state.orders.forEach((order, index) => {
        const x = 20 + index * Math.min(190, width * 0.3);
        const y = 78;
        const w = Math.min(170, width * 0.28);
        context.fillStyle = order === state.active ? '#fff2bd' : '#ffffff';
        roundRect(x, y, w, 92, 14);
        context.fill();
        context.fillStyle = '#07110d';
        context.font = '900 14px system-ui, sans-serif';
        context.fillText(order.recipe.name, x + 12, y + 25);
        context.font = '800 12px system-ui, sans-serif';
        context.fillText(`Next: ${order.step === 0 ? order.recipe.prep : order.step === 1 ? order.recipe.heat : 'plate'}`, x + 12, y + 47);
        context.fillStyle = '#d7dff3';
        roundRect(x + 12, y + 62, w - 24, 12, 6);
        context.fill();
        context.fillStyle = order.patience < order.maxPatience * 0.35 ? '#ff6f4a' : '#4c8f69';
        roundRect(x + 12, y + 62, Math.max(2, (w - 24) * order.patience / order.maxPatience), 12, 6);
        context.fill();
      });
    }

    function drawStations(width, height) {
      STATIONS.forEach((station) => {
        const x = station.x * width;
        const y = station.y * height;
        context.fillStyle = station.id === state.station ? '#ff6f4a' : '#bfe7d1';
        context.beginPath();
        context.arc(x, y, 45, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#07110d';
        context.font = '900 16px system-ui, sans-serif';
        context.textAlign = 'center';
        context.fillText(station.label, x, y + 5);
        context.font = '800 12px system-ui, sans-serif';
        context.fillText(station.key, x, y + 24);
      });
    }

    function drawFood(width, height) {
      const order = state.active;
      if (!order) return;
      const station = STATIONS.find((item) => item.id === state.station) || STATIONS[0];
      const pulse = state.reduced ? 0 : Math.sin(performance.now() / 180) * 4;
      context.fillStyle = order.recipe.color;
      context.beginPath();
      context.arc(station.x * width, station.y * height - 74 + pulse, 22, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#07110d';
      context.font = '900 18px system-ui, sans-serif';
      context.textAlign = 'center';
      context.fillText(String(order.step + 1), station.x * width, station.y * height - 68 + pulse);
    }

    function roundRect(x, y, width, height, radius) {
      context.beginPath();
      context.moveTo(x + radius, y);
      context.arcTo(x + width, y, x + width, y + height, radius);
      context.arcTo(x + width, y + height, x, y + height, radius);
      context.arcTo(x, y + height, x, y, radius);
      context.arcTo(x, y, x + width, y, radius);
      context.closePath();
    }

    function tick(now) {
      if (!document.body.contains(root)) {
        if (state.raf) window.cancelAnimationFrame(state.raf);
        return;
      }
      const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 0;
      state.last = now;
      updateOrders(dt);
      if (!state.reduced || state.running) draw();
      state.raf = window.requestAnimationFrame(tick);
    }

    board.addEventListener('click', () => {
      if (!state.running) startRush();
      else if (state.active) useStation(state.active.step === 0 ? 'prep' : state.active.step === 1 ? 'heat' : 'plate');
    });
    board.addEventListener('keydown', (event) => {
      if (event.key === '1') { event.preventDefault(); useStation('prep'); }
      else if (event.key === '2') { event.preventDefault(); useStation('heat'); }
      else if (event.key === '3') { event.preventDefault(); useStation('plate'); }
      else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (!state.running) startRush();
        else if (state.active) useStation(state.active.step === 0 ? 'prep' : state.active.step === 1 ? 'heat' : 'plate');
      }
    });
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(board);
    resetGame();
    state.raf = window.requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard);
  else initCard();
})();
