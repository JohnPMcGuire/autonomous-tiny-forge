(() => {
  const APP = {
    name: 'Sensor Bloom', emoji: '📡', category: 'play', version: '1.0.0',
    summary: 'Place sensors, read noisy ranges, and triangulate hidden blooms before the battery runs out.',
    description: 'A local signal-triangulation puzzle with hidden sources, noisy readings, limited scans, session unlocks, scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and animation teardown.'
  };
  const W = 7, H = 6;
  const MODES = [
    { name: 'Training', sources: 2, energy: 12, noise: 0 },
    { name: 'Field', sources: 3, energy: 13, noise: 1 },
    { name: 'Storm', sources: 3, energy: 11, noise: 2 }
  ];
  function installStyles() {
    if (document.querySelector('#sensor-bloom-styles')) return;
    const style = document.createElement('style');
    style.id = 'sensor-bloom-styles';
    style.textContent = `.sensor-card{animation:sensor-rise .32s ease both}.sensor-game{max-width:1040px;gap:14px}.sensor-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.sensor-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.sensor-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.sensor-stat strong{display:block;margin-top:4px;font-size:1rem}.sensor-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#06111d;color:white;cursor:pointer;touch-action:manipulation;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.sensor-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.sensor-board canvas{display:block;width:100%;min-height:430px}.sensor-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.sensor-overlay strong{font-size:clamp(1.05rem,3vw,1.55rem)}.sensor-overlay small{display:block;max-width:720px;color:rgba(255,255,255,.76)}.sensor-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.13);color:#bfdbfe;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.sensor-actions{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.sensor-actions button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.sensor-actions button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.sensor-actions span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.sensor-log{min-height:116px;padding:17px 19px}.sensor-log strong{font-size:clamp(1.08rem,3vw,1.5rem)}@media(max-width:820px){.sensor-hud{grid-template-columns:repeat(2,1fr)}.sensor-actions{grid-template-columns:1fr}.sensor-board canvas{min-height:360px}.sensor-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.sensor-card{animation:none}}@keyframes sensor-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }
  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-sensor-bloom-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.sensorBloomCard = 'true';
    card.classList.add('sensor-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openSensorBloom);
    grid.append(node);
  }
  function openSensorBloom() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Sensor%20Bloom';
    stage.replaceChildren();
    renderGame(stage, dialog);
    dialog.showModal();
  }
  function renderGame(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel sensor-game';
    const hud = document.createElement('div');
    hud.className = 'sensor-hud';
    hud.innerHTML = '<div class="sensor-stat"><span>Level</span><strong id="sensor-level">1</strong></div><div class="sensor-stat"><span>Mode</span><strong id="sensor-mode">Training</strong></div><div class="sensor-stat"><span>Energy</span><strong id="sensor-energy">12</strong></div><div class="sensor-stat"><span>Found</span><strong id="sensor-found">0 / 2</strong></div><div class="sensor-stat"><span>Score</span><strong id="sensor-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'sensor-board';
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="sensor-overlay"><span><strong>Triangulate the hidden blooms.</strong><small>Place sensors, scan for noisy distance bands, mark likely cells, then lock a bloom. Later levels unlock a costly deep scan.</small></span><span class="sensor-badge">Inference grid</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const actions = document.createElement('div');
    actions.className = 'sensor-actions';
    const log = document.createElement('div');
    log.className = 'result-card sensor-log';
    log.setAttribute('aria-live', 'polite');
    const controls = document.createElement('div');
    controls.className = 'tool-actions';
    const nextButton = makeButton('Next map', nextLevel);
    const restartButton = makeButton('Restart mode', reset, true);
    controls.append(nextButton, restartButton);
    root.append(hud, board, actions, log, controls);
    stage.append(root);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const choices = [
      { id: 'sensor', name: 'Place sensor', cost: 1, key: '1', help: 'Adds a reading node' },
      { id: 'scan', name: 'Pulse scan', cost: 2, key: '2', help: 'Reads all sensors' },
      { id: 'mark', name: 'Mark cell', cost: 0, key: '3', help: 'Flags a likely bloom' },
      { id: 'lock', name: 'Lock bloom', cost: 1, key: '4', help: 'Scores or loses energy' },
      { id: 'deep', name: 'Deep scan', cost: 3, key: '5', help: 'Unlocks at level 3' }
    ];
    const state = { mode: 0, level: 1, energy: 12, score: 0, selected: 'sensor', cursor: { x: 3, y: 2 }, sensors: [], marks: [], sources: [], found: [], readings: [], done: false, raf: 0, pulse: 0 };
    dialog.addEventListener('close', teardown, { once: true });
    function makeButton(text, fn, secondary) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = secondary ? 'button button-secondary' : 'button';
      button.textContent = text;
      button.addEventListener('click', fn);
      return button;
    }
    function same(a, b) { return a.x === b.x && a.y === b.y; }
    function inside(x, y) { return x >= 0 && y >= 0 && x < W && y < H; }
    function dist(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
    function has(list, x, y) { return list.some((p) => p.x === x && p.y === y); }
    function say(html) { log.innerHTML = html; }
    function currentMode() { return MODES[state.mode]; }
    function reset() {
      const mode = currentMode();
      state.energy = mode.energy + Math.max(0, 3 - state.level);
      state.selected = 'sensor'; state.cursor = { x: 3, y: 2 }; state.sensors = []; state.marks = []; state.found = []; state.readings = []; state.done = false; state.pulse = 0;
      state.sources = [];
      while (state.sources.length < mode.sources) {
        const point = { x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H) };
        if (!has(state.sources, point.x, point.y) && dist(point, { x: 3, y: 2 }) > 1) state.sources.push(point);
      }
      say('<strong>New signal field.</strong><small>Start by placing two or three sensors away from each other. Scan readings show the nearest hidden bloom distance, with storm noise in harder modes.</small>');
      update();
    }
    function nextLevel() {
      if (!state.done && state.found.length < currentMode().sources) {
        say('<strong>Map not solved yet.</strong><small>Lock all hidden blooms or restart the mode before moving on.</small>');
        return;
      }
      state.level += 1;
      if (state.level === 3) state.mode = 1;
      if (state.level === 5) state.mode = 2;
      reset();
    }
    function choose(action) {
      if (state.done) return;
      if (action === 'deep' && state.level < 3) {
        say('<strong>Deep scan is locked.</strong><small>Clear two maps to unlock the high-cost one-cell scan.</small>');
        return;
      }
      state.selected = action;
      const item = choices.find((choice) => choice.id === action);
      say(`<strong>${item.name} selected.</strong><small>${item.help}. Click a cell, tap the board, or use arrows and Enter.</small>`);
      update();
    }
    function spend(cost) {
      if (state.energy < cost) {
        say('<strong>Battery is too low.</strong><small>Use no-cost marks, make a final lock attempt, or restart with wider sensor spacing.</small>');
        return false;
      }
      state.energy -= cost;
      return true;
    }
    function act(x, y) {
      if (state.done || !inside(x, y)) return;
      const choice = choices.find((item) => item.id === state.selected);
      if (state.selected === 'deep' && state.level < 3) return choose('deep');
      if (!spend(choice.cost)) return update();
      if (state.selected === 'sensor') {
        if (has(state.sensors, x, y) || state.sensors.length >= 4) { state.energy += choice.cost; say('<strong>Sensor placement blocked.</strong><small>Use up to four unique sensors. Move to a different cell or scan the current net.</small>'); return update(); }
        state.sensors.push({ x, y }); state.score += 8; say('<strong>Sensor planted.</strong><small>Spread sensors out to narrow the overlap between distance bands.</small>');
      }
      if (state.selected === 'scan') scan(false);
      if (state.selected === 'mark') {
        const index = state.marks.findIndex((p) => p.x === x && p.y === y);
        if (index >= 0) state.marks.splice(index, 1); else state.marks.push({ x, y });
        say('<strong>Suspicion mark updated.</strong><small>Marks are free. Use them to compare candidate cells before spending energy on a lock.</small>');
      }
      if (state.selected === 'lock') lock(x, y);
      if (state.selected === 'deep') scan(true, { x, y });
      state.pulse = 1;
      update();
    }
    function scan(deep, point) {
      if (!state.sensors.length && !deep) { say('<strong>No sensors are listening.</strong><small>Place at least one sensor before scanning.</small>'); return; }
      const mode = currentMode();
      if (deep) {
        const nearest = Math.min(...state.sources.filter((s) => !has(state.found, s.x, s.y)).map((s) => dist(point, s)));
        state.readings.push({ x: point.x, y: point.y, band: nearest, deep: true });
        say(`<strong>Deep scan says distance ${nearest}.</strong><small>The selected cell is ${nearest} steps from the nearest unresolved bloom.</small>`);
        return;
      }
      state.readings = state.sensors.map((sensor) => {
        const nearest = Math.min(...state.sources.filter((s) => !has(state.found, s.x, s.y)).map((s) => dist(sensor, s)));
        const noise = mode.noise ? Math.max(0, nearest + Math.floor(Math.random() * (mode.noise * 2 + 1)) - mode.noise) : nearest;
        return { x: sensor.x, y: sensor.y, band: noise, real: nearest };
      });
      state.score += state.sensors.length * 4;
      say(`<strong>${state.sensors.length} readings captured.</strong><small>Numbers show nearest-bloom distance${mode.noise ? ', with possible storm noise' : ''}. Overlapping bands reveal the target cells.</small>`);
    }
    function lock(x, y) {
      const target = state.sources.find((s) => s.x === x && s.y === y && !has(state.found, x, y));
      if (target) {
        state.found.push({ x, y });
        state.score += 120 + state.energy * 5 + state.level * 15;
        say('<strong>Bloom locked.</strong><small>Great triangulation. Find the remaining hidden sources before the battery collapses.</small>');
      } else {
        state.energy = Math.max(0, state.energy - 2);
        state.score = Math.max(0, state.score - 20);
        say('<strong>False lock.</strong><small>The bloom was not there. Use marks and another scan to recover.</small>');
      }
      if (state.found.length >= currentMode().sources) {
        state.done = true;
        state.score += 100 + state.energy * 10;
        say(`<strong>Field cleared with ${state.energy} energy left.</strong><small>Press Next map for a harder layout. Field mode starts at level 3 and Storm starts at level 5.</small>`);
      } else if (state.energy <= 0) {
        state.done = true;
        say('<strong>Battery exhausted.</strong><small>The network went dark. Restart the mode and place sensors farther apart before spending on locks.</small>');
      }
    }
    function update() {
      const mode = currentMode();
      hud.querySelector('#sensor-level').textContent = String(state.level);
      hud.querySelector('#sensor-mode').textContent = mode.name;
      hud.querySelector('#sensor-energy').textContent = String(state.energy);
      hud.querySelector('#sensor-found').textContent = `${state.found.length} / ${mode.sources}`;
      hud.querySelector('#sensor-score').textContent = String(state.score);
      actions.replaceChildren();
      choices.forEach((choice) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-pressed', String(state.selected === choice.id));
        button.innerHTML = `${choice.key}. ${choice.name}<span>${choice.cost} energy · ${choice.help}</span>`;
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
      const w = canvas.width / scale, h = canvas.height / scale;
      ctx.clearRect(0, 0, w, h);
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, '#0f172a'); gradient.addColorStop(1, '#06251e');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
      const size = Math.min((w - 48) / W, (h - 110) / H);
      const ox = (w - size * W) / 2, oy = 54;
      for (let y = 0; y < H; y += 1) {
        for (let x = 0; x < W; x += 1) {
          const px = ox + x * size, py = oy + y * size;
          ctx.fillStyle = (x + y) % 2 ? 'rgba(14,165,233,.16)' : 'rgba(45,212,191,.12)';
          ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
          if (has(state.marks, x, y)) { ctx.fillStyle = 'rgba(250,204,21,.45)'; ctx.fillRect(px + 8, py + 8, size - 16, size - 16); }
          if (has(state.found, x, y)) { ctx.fillStyle = '#86efac'; ctx.beginPath(); ctx.arc(px + size / 2, py + size / 2, size * .24, 0, Math.PI * 2); ctx.fill(); }
          if (has(state.sensors, x, y)) { ctx.fillStyle = '#93c5fd'; ctx.beginPath(); ctx.arc(px + size / 2, py + size / 2, size * .18, 0, Math.PI * 2); ctx.fill(); }
          const reading = state.readings.find((r) => r.x === x && r.y === y);
          if (reading) { ctx.fillStyle = reading.deep ? '#fef3c7' : '#dbeafe'; ctx.font = `900 ${Math.max(13, size * .26)}px system-ui`; ctx.fillText(String(reading.band), px + size * .42, py + size * .62); }
        }
      }
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 3;
      ctx.strokeRect(ox + state.cursor.x * size + 3, oy + state.cursor.y * size + 3, size - 6, size - 6);
      ctx.fillStyle = 'rgba(255,255,255,.86)'; ctx.font = '800 13px system-ui';
      ctx.fillText(`Action: ${choices.find((item) => item.id === state.selected).name}`, 24, 30);
      ctx.fillText(`Sensors: ${state.sensors.length}/4`, w - 112, 30);
      ctx.fillText(state.level < 3 ? 'Deep scan unlocks at level 3' : 'Deep scan available', 24, h - 20);
      if (!reduced && state.pulse > 0) {
        ctx.strokeStyle = 'rgba(147,197,253,.62)'; ctx.lineWidth = 4;
        for (const sensor of state.sensors) { ctx.beginPath(); ctx.arc(ox + sensor.x * size + size / 2, oy + sensor.y * size + size / 2, 16 + state.pulse * 110, 0, Math.PI * 2); ctx.stroke(); }
        state.pulse = Math.max(0, state.pulse - .035);
      }
    }
    function pointToCell(event) {
      const rect = canvas.getBoundingClientRect();
      const size = Math.min((rect.width - 48) / W, (rect.height - 110) / H);
      const ox = (rect.width - size * W) / 2, oy = 54;
      return { x: Math.floor((event.clientX - rect.left - ox) / size), y: Math.floor((event.clientY - rect.top - oy) / size) };
    }
    function loop() { draw(); if (!reduced) state.raf = requestAnimationFrame(loop); }
    function teardown() { cancelAnimationFrame(state.raf); window.removeEventListener('resize', draw); }
    board.addEventListener('click', (event) => { const next = pointToCell(event); state.cursor = next; act(next.x, next.y); });
    board.addEventListener('keydown', (event) => {
      if (event.key >= '1' && event.key <= '5') { event.preventDefault(); choose(choices[Number(event.key) - 1].id); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); state.cursor.x = Math.max(0, state.cursor.x - 1); update(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); state.cursor.x = Math.min(W - 1, state.cursor.x + 1); update(); }
      if (event.key === 'ArrowUp') { event.preventDefault(); state.cursor.y = Math.max(0, state.cursor.y - 1); update(); }
      if (event.key === 'ArrowDown') { event.preventDefault(); state.cursor.y = Math.min(H - 1, state.cursor.y + 1); update(); }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); act(state.cursor.x, state.cursor.y); }
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); nextLevel(); }
    });
    window.addEventListener('resize', draw);
    reset();
    if (reduced) draw(); else loop();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard, { once: true });
  else initCard();
})();
