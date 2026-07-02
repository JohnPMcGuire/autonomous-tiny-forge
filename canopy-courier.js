(() => {
  const APP = {
    id: 'canopy-courier',
    name: 'Canopy Courier',
    summary: 'Grow routes through a tiny forest while balancing shade, water, bees, and blight.',
    description: 'A local ecological placement game with seed choices, weather turns, pollinator chains, water pressure, blight recovery, scoring, touch, pointer, keyboard controls, and clean teardown.',
    category: 'play',
    engine: 'prediction-game',
    emoji: '🌿',
    version: '1.0.0',
    config: {
      instructions: 'Plant a six-turn courier route across the canopy. Balance water, shade, bees, and blight while linking bloom beacons before the season ends.',
      items: [],
      prompts: ['Saplings add canopy and safe courier steps.', 'Flowers feed bees and multiply beacon scores.', 'Moss stores water near shade but spreads slowly.', 'Medic herbs clear blight and rescue weak lanes.'],
      options: ['Sapling', 'Flower', 'Moss', 'Medic'],
      outcomes: [],
      minSeconds: 0,
      maxSeconds: 0,
      rounds: 6
    }
  };

  const styleId = 'canopy-courier-styles';
  const gridSize = 5;
  const terrain = ['soil', 'soil', 'soil', 'shade', 'dry', 'soil', 'stone', 'soil', 'soil', 'shade', 'dry', 'soil', 'soil', 'soil', 'soil', 'soil', 'shade', 'soil', 'stone', 'soil', 'soil', 'soil', 'dry', 'soil', 'shade'];
  const palette = {
    soil: '#173329', dry: '#5c4a2f', shade: '#244a3d', stone: '#111f1a', path: '#fff2bd', sapling: '#bfe7d1', flower: '#ffb0d2', moss: '#8dd4a3', medic: '#f2c66d', blight: '#654168', bee: '#ffdc76'
  };
  const seeds = {
    sapling: { label: 'Sapling', cost: 2, detail: 'Adds shade and makes nearby courier lanes safer.' },
    flower: { label: 'Flower', cost: 2, detail: 'Feeds pollinators and multiplies beacon value.' },
    moss: { label: 'Moss', cost: 1, detail: 'Stores water, especially when planted near shade.' },
    medic: { label: 'Medic', cost: 3, detail: 'Clears adjacent blight and protects the route.' }
  };

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .canopy-card { position: relative; overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius); padding: 24px; background: radial-gradient(circle at 85% 8%, rgba(191,231,209,.36), transparent 30%), radial-gradient(circle at 6% 96%, rgba(255,111,74,.18), transparent 34%), white; }
      .canopy-card::after { content: ""; position: absolute; inset: auto 20px 18px auto; width: 84px; height: 84px; border-radius: 50%; background: radial-gradient(circle, rgba(255,242,189,.42), transparent 68%); pointer-events: none; }
      .canopy-game { max-width: 980px; gap: 14px; }
      .canopy-intro { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
      .canopy-intro p { margin: 0; max-width: 680px; color: var(--muted); line-height: 1.55; }
      .canopy-hud { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
      .canopy-stat, .canopy-seed, .canopy-key { border: 1px solid var(--line); border-radius: 15px; background: white; padding: 10px 11px; }
      .canopy-stat span, .canopy-seed span { display: block; color: var(--muted); font-size: .61rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      .canopy-stat strong { display: block; margin-top: 3px; font-size: .98rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .canopy-layout { display: grid; grid-template-columns: minmax(0, 1fr) 245px; gap: 14px; align-items: stretch; }
      .canopy-board { position: relative; min-height: 420px; border-radius: 24px; overflow: hidden; background: #07110d; touch-action: none; cursor: crosshair; }
      .canopy-board:focus-visible, .canopy-seed:focus-visible { outline: 4px solid var(--accent); outline-offset: 3px; }
      .canopy-board canvas { display: block; width: 100%; height: 420px; }
      .canopy-seeds { display: grid; gap: 8px; }
      .canopy-seed { text-align: left; cursor: pointer; }
      .canopy-seed strong { display: block; margin: 4px 0; }
      .canopy-seed small { color: var(--muted); line-height: 1.35; }
      .canopy-seed[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--accent) 32%, transparent); background: color-mix(in srgb, var(--accent) 7%, white); }
      .canopy-key { display: grid; gap: 8px; align-content: start; }
      .canopy-key h3 { margin: 0; font-size: 1rem; }
      .canopy-legend { display: grid; gap: 7px; }
      .canopy-legend div { display: grid; grid-template-columns: 16px 1fr auto; gap: 8px; align-items: center; color: var(--muted); font-size: .78rem; }
      .canopy-swatch { width: 14px; height: 14px; border-radius: 5px; background: var(--swatch); }
      .canopy-result { min-height: 94px; padding: 18px 20px; }
      .canopy-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      @media (max-width: 820px) { .canopy-intro { display: grid; } .canopy-hud { grid-template-columns: repeat(3, 1fr); } .canopy-layout { grid-template-columns: 1fr; } .canopy-board, .canopy-board canvas { min-height: 350px; height: 350px; } .canopy-key { grid-template-columns: 1fr 1fr; } .canopy-key h3 { grid-column: 1 / -1; } }
      @media (max-width: 500px) { .canopy-hud { grid-template-columns: repeat(2, 1fr); } .canopy-board, .canopy-board canvas { min-height: 310px; height: 310px; } .canopy-key { grid-template-columns: 1fr; } }
    `;
    document.head.append(style);
  }

  function addCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-app-id="canopy-courier"]')) return;
    const active = document.querySelector('.filter.is-active')?.dataset.filter || 'all';
    if (active !== 'all' && active !== APP.category) return;
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.appId = APP.id;
    card.classList.add('canopy-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = 'Play · v1.0.0';
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const button = node.querySelector('.app-card-button');
    button.textContent = 'Open app';
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', () => window.openApp?.(APP));
    grid.append(node);
  }

  function wireCard() {
    installStyles();
    const grid = document.querySelector('#app-grid');
    if (grid) {
      const observer = new MutationObserver(addCard);
      observer.observe(grid, { childList: true });
      addCard();
    }
    document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => requestAnimationFrame(addCard)));
  }

  const basePredictionRenderer = window.renderPredictionGame;
  if (typeof basePredictionRenderer === 'function') {
    window.renderPredictionGame = function renderPredictionGameWithCanopy(app) {
      if (app.id !== APP.id) return basePredictionRenderer(app);
      renderCanopy(app);
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireCard);
  else wireCard();

  function renderCanopy(app) {
    installStyles();
    const root = panel('');
    root.classList.add('canopy-game');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;
    let turn = 1;
    let selected = 'sapling';
    let water = 10;
    let bees = 2;
    let canopy = 0;
    let route = 0;
    let score = 0;
    let cursor = { row: 2, col: 2 };
    let animationId = 0;
    let audioContext;
    let soundEnabled = false;
    let cells = createCells();

    const intro = document.createElement('div');
    intro.className = 'canopy-intro';
    const introCopy = document.createElement('p');
    introCopy.textContent = app.config.instructions;
    const soundButton = makeButton('Sound off', toggleSound, true);
    soundButton.setAttribute('aria-pressed', 'false');
    intro.append(introCopy, soundButton);

    const hud = document.createElement('div');
    hud.className = 'canopy-hud';
    hud.innerHTML = `
      <div class="canopy-stat"><span>Turn</span><strong data-stat="turn">1 / 6</strong></div>
      <div class="canopy-stat"><span>Water</span><strong data-stat="water">10</strong></div>
      <div class="canopy-stat"><span>Bees</span><strong data-stat="bees">2</strong></div>
      <div class="canopy-stat"><span>Canopy</span><strong data-stat="canopy">0</strong></div>
      <div class="canopy-stat"><span>Route</span><strong data-stat="route">0</strong></div>
      <div class="canopy-stat"><span>Score</span><strong data-stat="score">0</strong></div>
    `;

    const seedRow = document.createElement('div');
    seedRow.className = 'canopy-seeds';
    Object.entries(seeds).forEach(([key, seed]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'canopy-seed';
      button.dataset.seed = key;
      button.setAttribute('aria-pressed', String(key === selected));
      button.innerHTML = `<span>Cost ${seed.cost}</span><strong>${seed.label}</strong><small>${seed.detail}</small>`;
      button.addEventListener('click', () => selectSeed(key));
      seedRow.append(button);
    });

    const layout = document.createElement('div');
    layout.className = 'canopy-layout';
    const board = document.createElement('div');
    board.className = 'canopy-board';
    board.tabIndex = 0;
    board.setAttribute('role', 'application');
    board.setAttribute('aria-label', 'Canopy Courier board. Use arrow keys to move, Enter to plant, number keys to choose seeds, and Backspace to undo the last plant.');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    board.append(canvas);

    const key = document.createElement('aside');
    key.className = 'canopy-key';
    key.innerHTML = `
      <h3>Forest rules</h3>
      <div class="canopy-legend">
        <div><span class="canopy-swatch" style="--swatch:${palette.soil}"></span><span>Plantable soil</span><strong>safe</strong></div>
        <div><span class="canopy-swatch" style="--swatch:${palette.dry}"></span><span>Dry ground</span><strong>-water</strong></div>
        <div><span class="canopy-swatch" style="--swatch:${palette.shade}"></span><span>Old shade</span><strong>+canopy</strong></div>
        <div><span class="canopy-swatch" style="--swatch:${palette.blight}"></span><span>Blight</span><strong>heal</strong></div>
        <div><span class="canopy-swatch" style="--swatch:${palette.bee}"></span><span>Beacon</span><strong>link</strong></div>
      </div>
      <p>Link both bloom beacons with planted cells. Dry cells drain water. Medic herbs clear blight before it cuts the route.</p>
    `;
    layout.append(board, key);

    const result = resultCard();
    result.classList.add('canopy-result');
    const actions = document.createElement('div');
    actions.className = 'canopy-actions';
    const plantButton = makeButton('Plant seed', plantAtCursor);
    const weatherButton = makeButton('Weather turn', weatherTurn, true);
    const undoButton = makeButton('Undo last plant', undoPlant, true);
    const resetButton = makeButton('New forest', resetGame, true);
    actions.append(plantButton, weatherButton, undoButton, resetButton);

    root.append(intro, hud, seedRow, layout, result, actions);
    const context = canvas.getContext('2d');
    board.addEventListener('pointerdown', handlePointer);
    board.addEventListener('keydown', handleKeydown);
    document.querySelector('#app-dialog')?.addEventListener('close', cleanup, { once: true });
    setResult('Plant the first courier lane.', 'Choose a seed, then plant on soil, dry ground, shade, or blight. Link both yellow beacons before turn six ends.');
    update();
    draw(performance.now());
    if (!reducedMotion) animationId = requestAnimationFrame(animate);

    function createCells() {
      return Array.from({ length: gridSize * gridSize }, (_, index) => ({ terrain: terrain[index], plant: '', age: 0, blight: index === 8 || index === 16, beacon: index === 4 || index === 20, history: [] }));
    }

    function selectSeed(seed) {
      selected = seed;
      seedRow.querySelectorAll('.canopy-seed').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.seed === selected)));
      setResult(`${seeds[seed].label} selected.`, seeds[seed].detail);
    }

    function plantAtCursor() {
      const index = cursor.row * gridSize + cursor.col;
      const cell = cells[index];
      const seed = seeds[selected];
      if (turn > 6) return resetGame();
      if (cell.terrain === 'stone') return setResult('Stone blocks the courier.', 'Move to a plantable cell or use weather to let moss and shade improve the board.');
      if (cell.plant && !cell.blight) return setResult('That cell is already carrying life.', 'Use a different cell or clear blight with a medic herb.');
      if (water < seed.cost) return setResult('Not enough water.', 'Plant moss, choose weather, or let the season end with a smaller route.');
      water -= seed.cost;
      cell.history.push({ plant: cell.plant, blight: cell.blight, age: cell.age });
      cell.plant = selected;
      cell.age = 1;
      if (cell.terrain === 'dry') water -= 1;
      applySeed(index);
      turn += 1;
      weatherDrift();
      scoreBoard();
      playTone('plant');
      if (turn > 6) finishSeason();
      else setResult('Courier lane extended.', `${seed.label} changed the forest. Weather can help, but it also gives blight another chance.`);
      update();
      draw(performance.now());
    }

    function applySeed(index) {
      const cell = cells[index];
      const around = neighbors(index);
      if (selected === 'sapling') {
        canopy += cell.terrain === 'shade' ? 3 : 2;
        around.forEach((near) => { if (cells[near].terrain === 'dry' && Math.random() < 0.18) cells[near].terrain = 'soil'; });
      }
      if (selected === 'flower') bees += 2 + around.filter((near) => cells[near].plant === 'flower').length;
      if (selected === 'moss') water += cell.terrain === 'shade' ? 4 : 2;
      if (selected === 'medic') {
        bees += 1;
        [index, ...around].forEach((near) => { cells[near].blight = false; });
      }
    }

    function weatherTurn() {
      if (turn > 6) return resetGame();
      water += Math.max(1, Math.ceil(canopy / 3));
      bees = Math.max(0, bees - cells.filter((cell) => cell.blight).length);
      weatherDrift();
      turn += 1;
      scoreBoard();
      setResult('Weather passed through the canopy.', 'Shade collected water, but active blight pressured the bee count and route safety.');
      if (turn > 6) finishSeason();
      update();
      draw(performance.now());
    }

    function weatherDrift() {
      cells.forEach((cell, index) => {
        if (!cell.plant) return;
        cell.age += 1;
        if (cell.plant === 'moss' && cell.age > 1) neighbors(index).forEach((near) => { if (!cells[near].plant && cells[near].terrain !== 'stone' && !cells[near].blight) cells[near].terrain = 'shade'; });
      });
      const weak = cells.map((cell, index) => (cell.plant ? index : -1)).find((index) => index >= 0 && cells[index].plant !== 'medic' && neighbors(index).some((near) => cells[near].blight));
      if (weak !== undefined) cells[weak].blight = true;
    }

    function undoPlant() {
      for (let index = cells.length - 1; index >= 0; index -= 1) {
        const cell = cells[index];
        const previous = cell.history.pop();
        if (!previous) continue;
        cell.plant = previous.plant;
        cell.blight = previous.blight;
        cell.age = previous.age;
        turn = Math.max(1, turn - 1);
        water += 1;
        scoreBoard();
        setResult('Last plant softened.', 'Undo restores the cell and refunds a little water, but not the whole season.');
        update();
        draw(performance.now());
        return;
      }
      setResult('No planted move to undo.', 'The forest is still at its opening state.');
    }

    function scoreBoard() {
      const plantedCells = cells.filter((cell) => cell.plant && !cell.blight).length;
      const routeCells = connectedRoute();
      route = routeCells.length;
      const beaconBonus = routeCells.filter((index) => cells[index].beacon).length * 12;
      const ecology = water + bees * 2 + canopy * 2;
      score = Math.max(0, plantedCells * 8 + route * 6 + ecology + beaconBonus - cells.filter((cell) => cell.blight).length * 7);
    }

    function connectedRoute() {
      const starts = cells.map((cell, index) => (cell.plant && !cell.blight ? index : -1)).filter((index) => index >= 0);
      if (!starts.length) return [];
      const seen = new Set([starts[0]]);
      const queue = [starts[0]];
      while (queue.length) {
        const current = queue.shift();
        neighbors(current).forEach((near) => {
          if (!seen.has(near) && cells[near].plant && !cells[near].blight) {
            seen.add(near);
            queue.push(near);
          }
        });
      }
      return [...seen];
    }

    function finishSeason() {
      scoreBoard();
      const linked = connectedRoute().filter((index) => cells[index].beacon).length;
      const headline = linked >= 2 ? 'Courier canopy connected.' : 'Season ended with an unfinished route.';
      const detail = linked >= 2 ? `Final score ${score}. Bees ${bees}, water ${water}, canopy ${canopy}. Try for a cleaner route with less blight.` : `Final score ${score}. Link both beacon corners next time and keep medic herbs near blight.`;
      setResult(headline, detail);
      playTone(linked >= 2 ? 'win' : 'plant');
    }

    function resetGame() {
      turn = 1;
      water = 10;
      bees = 2;
      canopy = 0;
      route = 0;
      score = 0;
      cursor = { row: 2, col: 2 };
      cells = createCells();
      setResult('New forest opened.', 'Build a route, protect it from blight, and use weather when water is low.');
      update();
      draw(performance.now());
    }

    function neighbors(index) {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      return [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]].filter(([r, c]) => r >= 0 && c >= 0 && r < gridSize && c < gridSize).map(([r, c]) => r * gridSize + c);
    }

    function handlePointer(event) {
      if (disposed) return;
      const rect = canvas.getBoundingClientRect();
      cursor = { row: Math.max(0, Math.min(gridSize - 1, Math.floor((event.clientY - rect.top) / (rect.height / gridSize)))), col: Math.max(0, Math.min(gridSize - 1, Math.floor((event.clientX - rect.left) / (rect.width / gridSize)))) };
      board.focus({ preventScroll: true });
      plantAtCursor();
    }

    function handleKeydown(event) {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Backspace', '1', '2', '3', '4'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowUp') cursor.row = Math.max(0, cursor.row - 1);
      if (event.key === 'ArrowDown') cursor.row = Math.min(gridSize - 1, cursor.row + 1);
      if (event.key === 'ArrowLeft') cursor.col = Math.max(0, cursor.col - 1);
      if (event.key === 'ArrowRight') cursor.col = Math.min(gridSize - 1, cursor.col + 1);
      if (event.key === 'Enter' || event.key === ' ') plantAtCursor();
      if (event.key === 'Backspace') undoPlant();
      if (['1', '2', '3', '4'].includes(event.key)) selectSeed(Object.keys(seeds)[Number(event.key) - 1]);
      draw(performance.now());
    }

    function update() {
      hud.querySelector('[data-stat="turn"]').textContent = `${Math.min(turn, 6)} / 6`;
      hud.querySelector('[data-stat="water"]').textContent = String(Math.max(0, water));
      hud.querySelector('[data-stat="bees"]').textContent = String(Math.max(0, bees));
      hud.querySelector('[data-stat="canopy"]').textContent = String(canopy);
      hud.querySelector('[data-stat="route"]').textContent = String(route);
      hud.querySelector('[data-stat="score"]').textContent = String(score);
      plantButton.disabled = turn > 6;
      weatherButton.disabled = turn > 6;
    }

    function setResult(headline, detail) {
      result.innerHTML = '';
      const strong = document.createElement('strong');
      const small = document.createElement('small');
      strong.textContent = headline;
      small.textContent = detail;
      result.append(strong, small);
    }

    function draw(now) {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(300, Math.floor(rect.width * ratio));
      const height = Math.max(300, Math.floor(rect.height * ratio));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      context.clearRect(0, 0, width, height);
      const cellSize = Math.min(width, height) / gridSize;
      const xOffset = (width - cellSize * gridSize) / 2;
      const yOffset = (height - cellSize * gridSize) / 2;
      cells.forEach((cell, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const x = xOffset + col * cellSize;
        const y = yOffset + row * cellSize;
        context.fillStyle = cell.blight ? palette.blight : palette[cell.terrain];
        roundRect(context, x + 4, y + 4, cellSize - 8, cellSize - 8, 15 * ratio);
        context.fill();
        if (cell.beacon) {
          context.fillStyle = palette.bee;
          context.beginPath();
          context.arc(x + cellSize * .76, y + cellSize * .24, cellSize * .1 + Math.sin(now / 280) * 2, 0, Math.PI * 2);
          context.fill();
        }
        if (cell.plant) drawPlant(context, cell.plant, x + cellSize / 2, y + cellSize / 2, cellSize, now, cell.blight);
      });
      drawConnections(context, xOffset, yOffset, cellSize);
      context.strokeStyle = palette.path;
      context.lineWidth = 4 * ratio;
      context.strokeRect(xOffset + cursor.col * cellSize + 7, yOffset + cursor.row * cellSize + 7, cellSize - 14, cellSize - 14);
    }

    function drawConnections(ctx, xOffset, yOffset, cellSize) {
      const routeCells = connectedRoute();
      ctx.strokeStyle = palette.path;
      ctx.lineWidth = 3 * (window.devicePixelRatio || 1);
      ctx.globalAlpha = .78;
      routeCells.forEach((index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        neighbors(index).forEach((near) => {
          if (!routeCells.includes(near) || near < index) return;
          const nearRow = Math.floor(near / gridSize);
          const nearCol = near % gridSize;
          ctx.beginPath();
          ctx.moveTo(xOffset + col * cellSize + cellSize / 2, yOffset + row * cellSize + cellSize / 2);
          ctx.lineTo(xOffset + nearCol * cellSize + cellSize / 2, yOffset + nearRow * cellSize + cellSize / 2);
          ctx.stroke();
        });
      });
      ctx.globalAlpha = 1;
    }

    function drawPlant(ctx, plant, x, y, size, now, blighted) {
      const pulse = reducedMotion ? 0 : Math.sin(now / 360 + x) * size * .025;
      ctx.save();
      ctx.translate(x, y + pulse);
      ctx.globalAlpha = blighted ? .48 : 1;
      ctx.fillStyle = palette[plant];
      if (plant === 'sapling') {
        ctx.fillRect(-size * .035, -size * .2, size * .07, size * .34);
        ctx.beginPath();
        ctx.arc(-size * .08, -size * .2, size * .12, 0, Math.PI * 2);
        ctx.arc(size * .1, -size * .23, size * .14, 0, Math.PI * 2);
        ctx.fill();
      } else if (plant === 'flower') {
        for (let i = 0; i < 6; i += 1) { ctx.beginPath(); ctx.arc(Math.cos(i) * size * .12, Math.sin(i) * size * .12, size * .08, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = palette.bee;
        ctx.beginPath();
        ctx.arc(0, 0, size * .06, 0, Math.PI * 2);
        ctx.fill();
      } else if (plant === 'moss') {
        for (let i = 0; i < 5; i += 1) { ctx.beginPath(); ctx.arc((i - 2) * size * .07, Math.sin(i) * size * .04, size * .09, 0, Math.PI * 2); ctx.fill(); }
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -size * .18);
        ctx.lineTo(size * .16, 0);
        ctx.lineTo(0, size * .18);
        ctx.lineTo(-size * .16, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    function roundRect(ctx, x, y, width, height, radius) {
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

    function animate(now) {
      if (disposed) return;
      draw(now);
      animationId = requestAnimationFrame(animate);
    }

    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) return setResult('Sound is not available here.', 'The forest still works without audio.');
      soundEnabled = !soundEnabled;
      soundButton.textContent = soundEnabled ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(soundEnabled));
      if (soundEnabled) {
        audioContext ||= new AudioEngine();
        audioContext.resume();
        playTone('plant');
      }
    }

    function playTone(kind) {
      if (!soundEnabled || !audioContext) return;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.value = kind === 'win' ? 660 : 360;
      gain.gain.setValueAtTime(.001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.06, audioContext.currentTime + .02);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .18);
      osc.connect(gain).connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + .2);
    }

    function cleanup() {
      disposed = true;
      if (animationId) cancelAnimationFrame(animationId);
      if (audioContext?.state !== 'closed') audioContext?.close();
    }
  }
})();
