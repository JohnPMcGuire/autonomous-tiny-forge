(() => {
  const APP = {
    name: 'Firebreak Runner',
    emoji: '🔥',
    category: 'play',
    version: '1.0.0',
    summary: 'Cut firelines, stage crews, and time backburns before wind turns a small blaze into a cascade.',
    description: 'A local wildfire strategy game with spreading fire, wind shifts, homes to protect, scarce crew water, backburn tradeoffs, scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and animation teardown.'
  };

  const WIDTH = 8;
  const HEIGHT = 6;
  const CELL = { forest: 0, fire: 1, ash: 2, line: 3, home: 4, crew: 5, water: 6 };
  const DIRS = [
    { name: 'East', dx: 1, dy: 0 },
    { name: 'South', dx: 0, dy: 1 },
    { name: 'West', dx: -1, dy: 0 },
    { name: 'North', dx: 0, dy: -1 }
  ];

  function installStyles() {
    if (document.querySelector('#firebreak-runner-styles')) return;
    const style = document.createElement('style');
    style.id = 'firebreak-runner-styles';
    style.textContent = `.firebreak-card{animation:firebreak-rise .32s ease both}.firebreak-game{max-width:1040px;gap:14px}.firebreak-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.firebreak-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.firebreak-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.firebreak-stat strong{display:block;margin-top:4px;font-size:1rem}.firebreak-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#180b06;color:white;cursor:pointer;touch-action:manipulation;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.firebreak-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.firebreak-board canvas{display:block;width:100%;min-height:430px}.firebreak-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.firebreak-overlay strong{font-size:clamp(1.05rem,3vw,1.55rem)}.firebreak-overlay small{display:block;max-width:720px;color:rgba(255,255,255,.76)}.firebreak-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.13);color:#fed7aa;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.firebreak-actions{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.firebreak-actions button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.firebreak-actions button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.firebreak-actions span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.firebreak-log{min-height:116px;padding:17px 19px}.firebreak-log strong{font-size:clamp(1.08rem,3vw,1.5rem)}@media(max-width:820px){.firebreak-hud{grid-template-columns:repeat(2,1fr)}.firebreak-actions{grid-template-columns:1fr}.firebreak-board canvas{min-height:360px}.firebreak-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.firebreak-card{animation:none}}@keyframes firebreak-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-firebreak-runner-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.firebreakRunnerCard = 'true';
    card.classList.add('firebreak-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openFirebreakRunner);
    grid.append(node);
  }

  function openFirebreakRunner() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Firebreak%20Runner';
    stage.replaceChildren();
    renderGame(stage, dialog);
    dialog.showModal();
  }

  function renderGame(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel firebreak-game';
    const hud = document.createElement('div');
    hud.className = 'firebreak-hud';
    hud.innerHTML = '<div class="firebreak-stat"><span>Turn</span><strong id="fire-turn">1 / 12</strong></div><div class="firebreak-stat"><span>Wind</span><strong id="fire-wind">East</strong></div><div class="firebreak-stat"><span>Water</span><strong id="fire-water">6</strong></div><div class="firebreak-stat"><span>Homes</span><strong id="fire-homes">4 safe</strong></div><div class="firebreak-stat"><span>Score</span><strong id="fire-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'firebreak-board';
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="firebreak-overlay"><span><strong>Hold the line for twelve turns.</strong><small>Select an action, then choose a cell. Fire spreads after every command and rides the wind. Backburns create ash breaks but cost trust.</small></span><span class="firebreak-badge">Grid strategy</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const actions = document.createElement('div');
    actions.className = 'firebreak-actions';
    const log = document.createElement('div');
    log.className = 'result-card firebreak-log';
    log.setAttribute('aria-live', 'polite');
    const controls = document.createElement('div');
    controls.className = 'tool-actions';
    const stepButton = makeButton('Let fire move', stepFire);
    const restartButton = makeButton('Restart map', reset, true);
    controls.append(stepButton, restartButton);
    root.append(hud, board, actions, log, controls);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const choices = [
      { id: 'line', name: 'Cut line', cost: 1, key: '1', help: 'Stops spread' },
      { id: 'crew', name: 'Stage crew', cost: 1, key: '2', help: 'Douses adjacent fire' },
      { id: 'water', name: 'Drop water', cost: 2, key: '3', help: 'Quenches one fire' },
      { id: 'burn', name: 'Backburn', cost: 0, key: '4', help: 'Ash break, trust -8' },
      { id: 'shelter', name: 'Shelter home', cost: 1, key: '5', help: 'Protects nearby home' }
    ];
    const state = { grid: [], turn: 1, wind: 0, water: 6, trust: 70, score: 0, selected: 'line', cursor: { x: 2, y: 2 }, done: false, raf: 0, spark: 0 };
    dialog.addEventListener('close', teardown, { once: true });

    function makeButton(text, fn, secondary) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = secondary ? 'button button-secondary' : 'button';
      button.textContent = text;
      button.addEventListener('click', fn);
      return button;
    }
    function key(x, y) { return y * WIDTH + x; }
    function inside(x, y) { return x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT; }
    function cell(x, y) { return state.grid[key(x, y)]; }
    function setCell(x, y, value) { state.grid[key(x, y)] = value; }
    function say(html) { log.innerHTML = html; }
    function count(value) { return state.grid.filter((item) => item === value).length; }
    function safeHomes() { return count(CELL.home) + count(CELL.crew); }
    function reset() {
      state.grid = Array.from({ length: WIDTH * HEIGHT }, () => CELL.forest);
      [[6, 0], [7, 2], [5, 5], [1, 5]].forEach(([x, y]) => setCell(x, y, CELL.home));
      [[0, 1], [1, 0], [0, 2]].forEach(([x, y]) => setCell(x, y, CELL.fire));
      setCell(3, 3, CELL.water);
      state.turn = 1; state.wind = 0; state.water = 6; state.trust = 70; state.score = 0; state.selected = 'line'; state.cursor = { x: 2, y: 2 }; state.done = false; state.spark = 0;
      say('<strong>Initial report: west ridge ignition.</strong><small>Cut lines ahead of wind, stage crews near homes, and use backburns only when the ash break is worth the trust cost.</small>');
      update();
    }
    function choose(action) {
      if (state.done) return;
      state.selected = action;
      const item = choices.find((choice) => choice.id === action);
      say(`<strong>${item.name} selected.</strong><small>${item.help}. Click a cell, tap the board, or move with arrow keys and press Enter.</small>`);
      update();
    }
    function act(x, y) {
      if (state.done || !inside(x, y)) return;
      const choice = choices.find((item) => item.id === state.selected);
      if (state.water < choice.cost) {
        say('<strong>Not enough water.</strong><small>Let the fire move or restart with a different opening. Water drops and shelters need reserves.</small>');
        return;
      }
      let changed = false;
      if (state.selected === 'line' && cell(x, y) === CELL.forest) { setCell(x, y, CELL.line); changed = true; }
      if (state.selected === 'crew' && [CELL.forest, CELL.line, CELL.home].includes(cell(x, y))) {
        setCell(x, y, CELL.crew); changed = true;
        neighbors(x, y).forEach(([nx, ny]) => { if (cell(nx, ny) === CELL.fire) setCell(nx, ny, CELL.ash); });
      }
      if (state.selected === 'water' && cell(x, y) === CELL.fire) { setCell(x, y, CELL.ash); changed = true; }
      if (state.selected === 'burn' && [CELL.forest, CELL.line].includes(cell(x, y))) { setCell(x, y, CELL.ash); state.trust = Math.max(0, state.trust - 8); changed = true; }
      if (state.selected === 'shelter' && cell(x, y) === CELL.home) { setCell(x, y, CELL.crew); changed = true; }
      if (!changed) {
        say('<strong>That command has no effect there.</strong><small>Try a forest cell for lines, a fire cell for water, or a home for shelter.</small>');
        return;
      }
      state.water -= choice.cost;
      state.score += 8 + safeHomes() * 2;
      spread();
    }
    function neighbors(x, y) { return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => inside(nx, ny)); }
    function spread() {
      const wind = DIRS[state.wind];
      const next = state.grid.slice();
      for (let y = 0; y < HEIGHT; y += 1) {
        for (let x = 0; x < WIDTH; x += 1) {
          if (cell(x, y) !== CELL.fire) continue;
          next[key(x, y)] = CELL.ash;
          const targets = neighbors(x, y);
          targets.push([x + wind.dx, y + wind.dy]);
          targets.forEach(([nx, ny], index) => {
            if (!inside(nx, ny)) return;
            const here = cell(nx, ny);
            const downwind = index === targets.length - 1;
            if (here === CELL.line && downwind && Math.random() < 0.32) next[key(nx, ny)] = CELL.fire;
            if (here === CELL.forest && (downwind || Math.random() < 0.45)) next[key(nx, ny)] = CELL.fire;
            if (here === CELL.home && (downwind || Math.random() < 0.35)) next[key(nx, ny)] = CELL.fire;
            if (here === CELL.crew && downwind && Math.random() < 0.16) next[key(nx, ny)] = CELL.fire;
          });
        }
      }
      state.grid = next;
      if (state.turn % 3 === 0) state.wind = (state.wind + 1) % DIRS.length;
      if (count(CELL.water)) { state.water = Math.min(8, state.water + 2); state.grid[state.grid.indexOf(CELL.water)] = CELL.forest; }
      state.turn += 1;
      state.water = Math.min(8, state.water + 1);
      state.score += Math.max(0, state.trust - count(CELL.fire) * 7 + safeHomes() * 15);
      state.spark = 1;
      checkEnd();
      update();
    }
    function stepFire() { if (!state.done) spread(); }
    function checkEnd() {
      const homes = safeHomes();
      if (homes < 2 || count(CELL.fire) > 18 || state.trust < 10) {
        state.done = true;
        say(`<strong>The incident escaped containment.</strong><small>Final score ${state.score}. Homes safe: ${homes}. Replay and build wider breaks before the wind shift.</small>`);
      } else if (state.turn > 12 || count(CELL.fire) === 0) {
        state.done = true;
        const bonus = homes * 80 + state.trust * 2 - count(CELL.ash) * 3;
        state.score += bonus;
        say(`<strong>Containment declared.</strong><small>Final score ${state.score}. You protected ${homes} homes with ${state.trust} trust remaining.</small>`);
      } else {
        say(`<strong>Turn ${state.turn}: wind ${DIRS[state.wind].name}.</strong><small>${count(CELL.fire)} active fire cells. Water ${state.water}. Homes safe ${homes}. Choose the next command.</small>`);
      }
    }
    function update() {
      hud.querySelector('#fire-turn').textContent = `${Math.min(state.turn, 12)} / 12`;
      hud.querySelector('#fire-wind').textContent = DIRS[state.wind].name;
      hud.querySelector('#fire-water').textContent = state.water;
      hud.querySelector('#fire-homes').textContent = `${safeHomes()} safe`;
      hud.querySelector('#fire-score').textContent = state.score;
      actions.replaceChildren();
      choices.forEach((choice) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.disabled = state.done;
        button.setAttribute('aria-pressed', String(choice.id === state.selected));
        button.innerHTML = `<strong>${choice.key}. ${choice.name}</strong><span>${choice.help} · water ${choice.cost}</span>`;
        button.addEventListener('click', () => choose(choice.id));
        actions.append(button);
      });
      draw();
    }
    function draw() {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(320, Math.floor(rect.width * scale));
      canvas.height = Math.max(340, Math.floor(rect.height * scale));
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const w = canvas.width / scale;
      const h = canvas.height / scale;
      ctx.clearRect(0, 0, w, h);
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, '#301006'); gradient.addColorStop(1, '#09120a');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
      const size = Math.min((w - 48) / WIDTH, (h - 104) / HEIGHT);
      const ox = (w - size * WIDTH) / 2;
      const oy = 54;
      for (let y = 0; y < HEIGHT; y += 1) {
        for (let x = 0; x < WIDTH; x += 1) {
          const px = ox + x * size; const py = oy + y * size;
          const value = cell(x, y);
          ctx.fillStyle = ['#315c2b', '#f97316', '#34261d', '#d6d3d1', '#fde68a', '#67e8f9', '#38bdf8'][value];
          ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
          ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(px + 2, py + size - 9, size - 4, 7);
          ctx.fillStyle = '#130b06'; ctx.font = `800 ${Math.max(12, size * .25)}px system-ui`;
          const label = ['♣', '▲', '·', '═', '⌂', '●', '+'][value];
          ctx.fillText(label, px + size * .38, py + size * .58);
        }
      }
      ctx.strokeStyle = '#fff7ed'; ctx.lineWidth = 3;
      ctx.strokeRect(ox + state.cursor.x * size + 3, oy + state.cursor.y * size + 3, size - 6, size - 6);
      ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.font = '800 13px system-ui';
      ctx.fillText(`Action: ${choices.find((item) => item.id === state.selected).name}`, 24, 30);
      ctx.fillText(`Trust: ${state.trust}`, w - 96, 30);
      ctx.fillText(`Wind ${DIRS[state.wind].name}`, 24, h - 20);
      if (!reduced && state.spark > 0) {
        ctx.strokeStyle = 'rgba(253,186,116,.62)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(w / 2, h / 2, 34 + state.spark * 140, 0, Math.PI * 2); ctx.stroke();
        state.spark = Math.max(0, state.spark - .035);
      }
    }
    function pointToCell(event) {
      const rect = canvas.getBoundingClientRect();
      const size = Math.min((rect.width - 48) / WIDTH, (rect.height - 104) / HEIGHT);
      const ox = (rect.width - size * WIDTH) / 2;
      const oy = 54;
      const x = Math.floor((event.clientX - rect.left - ox) / size);
      const y = Math.floor((event.clientY - rect.top - oy) / size);
      return { x, y };
    }
    function loop() { draw(); if (!reduced) state.raf = requestAnimationFrame(loop); }
    function teardown() { cancelAnimationFrame(state.raf); window.removeEventListener('resize', draw); }
    board.addEventListener('click', (event) => { const next = pointToCell(event); state.cursor = next; act(next.x, next.y); });
    board.addEventListener('keydown', (event) => {
      if (event.key >= '1' && event.key <= '5') { event.preventDefault(); choose(choices[Number(event.key) - 1].id); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); state.cursor.x = Math.max(0, state.cursor.x - 1); update(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); state.cursor.x = Math.min(WIDTH - 1, state.cursor.x + 1); update(); }
      if (event.key === 'ArrowUp') { event.preventDefault(); state.cursor.y = Math.max(0, state.cursor.y - 1); update(); }
      if (event.key === 'ArrowDown') { event.preventDefault(); state.cursor.y = Math.min(HEIGHT - 1, state.cursor.y + 1); update(); }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); act(state.cursor.x, state.cursor.y); }
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); stepFire(); }
    });
    window.addEventListener('resize', draw);
    reset();
    if (reduced) draw(); else loop();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard, { once: true });
  else initCard();
})();
