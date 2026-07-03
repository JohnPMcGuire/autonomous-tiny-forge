(() => {
  const APP = {
    name: 'Mirror Marsh', emoji: '🪞', category: 'play', version: '1.0.0',
    summary: 'Route moonlight through a shifting marsh with mirrors, gates, tide risk, and scarce moves.',
    description: 'A local beam-routing puzzle with rotatable mirrors, tide-blocked cells, power gates, limited actions, scoring, responsive canvas rendering, pointer, touch, keyboard controls, reduced-motion behavior, and clean animation teardown.'
  };

  const LEVELS = [
    { name: 'Fen primer', moves: 9, source: [0, 2, 0], goal: [5, 2], mirrors: [[2, 1, 0], [3, 3, 1]], gates: [[4, 2]], reeds: [[1, 0], [1, 4], [4, 0]], tide: [[2, 4]] },
    { name: 'Reed hinge', moves: 11, source: [0, 4, 0], goal: [5, 0], mirrors: [[1, 3, 1], [2, 2, 0], [4, 1, 1]], gates: [[3, 2], [5, 3]], reeds: [[0, 1], [2, 0], [3, 4]], tide: [[1, 1], [4, 4]] },
    { name: 'Blackwater lock', moves: 12, source: [0, 0, 1], goal: [5, 4], mirrors: [[1, 1, 0], [2, 3, 1], [4, 2, 0]], gates: [[3, 1], [3, 3]], reeds: [[0, 3], [5, 1], [2, 0]], tide: [[1, 4], [4, 0]] }
  ];
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

  function installStyles() {
    if (document.querySelector('#mirror-marsh-styles')) return;
    const style = document.createElement('style');
    style.id = 'mirror-marsh-styles';
    style.textContent = `.mirror-card{animation:mirror-rise .32s ease both}.mirror-game{max-width:960px;gap:14px}.mirror-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.mirror-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.mirror-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.mirror-stat strong{display:block;margin-top:4px;font-size:1rem}.mirror-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#071312;color:white;cursor:pointer;touch-action:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.mirror-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.mirror-board canvas{display:block;width:100%;min-height:410px}.mirror-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.mirror-overlay strong{font-size:clamp(1.05rem,3vw,1.5rem)}.mirror-overlay small{display:block;max-width:660px;color:rgba(255,255,255,.76)}.mirror-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#bbf7d0;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.mirror-tools{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.mirror-tools button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.mirror-tools button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.mirror-tools span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.mirror-log{min-height:116px;padding:17px 19px}.mirror-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:760px){.mirror-hud{grid-template-columns:repeat(2,1fr)}.mirror-tools{grid-template-columns:1fr}.mirror-board canvas{min-height:350px}.mirror-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.mirror-card{animation:none}}@keyframes mirror-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-mirror-marsh-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.mirrorMarshCard = 'true';
    card.classList.add('mirror-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openMirrorMarsh);
    grid.append(node);
  }

  function openMirrorMarsh() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Mirror%20Marsh';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel mirror-game';
    const hud = document.createElement('div');
    hud.className = 'mirror-hud';
    hud.innerHTML = '<div class="mirror-stat"><span>Marsh</span><strong id="mirror-level">1 / 3</strong></div><div class="mirror-stat"><span>Moves</span><strong id="mirror-moves">9</strong></div><div class="mirror-stat"><span>Charge</span><strong id="mirror-charge">0</strong></div><div class="mirror-stat"><span>Tide</span><strong id="mirror-tide">low</strong></div><div class="mirror-stat"><span>Score</span><strong id="mirror-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'mirror-board';
    board.setAttribute('aria-label', 'Mirror Marsh board. Select mirrors, rotate them, pulse gates, and route the beam to the moonwell.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="mirror-overlay"><span><strong>Bend moonlight across the marsh before the tide eats your path.</strong><small>Tap a mirror to select it. Arrows move selection. Enter rotates. Space pulses a gate. R restarts.</small></span><span class="mirror-badge">Beam puzzle</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const tools = document.createElement('div');
    tools.className = 'mirror-tools';
    const log = document.createElement('div');
    log.className = 'result-card mirror-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const makeButton = (text, fn, secondary) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = secondary ? 'button button-secondary' : 'button';
      item.textContent = text;
      item.addEventListener('click', fn);
      return item;
    };
    actions.append(makeButton('Rotate mirror', rotateSelected), makeButton('Pulse gate', pulseGate, true), makeButton('Next marsh', nextLevel, true), makeButton('Restart', reset, true));
    root.append(hud, board, tools, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { level: 0, selected: 0, moves: 0, charge: 0, tide: 0, score: 0, gates: new Set(), done: false, wonLevel: false, raf: 0, tick: 0, mirrors: [] };

    function loadLevel(index) {
      const level = LEVELS[index];
      state.level = index;
      state.selected = 0;
      state.moves = level.moves;
      state.charge = 0;
      state.tide = 0;
      state.gates = new Set();
      state.done = false;
      state.wonLevel = false;
      state.mirrors = level.mirrors.map(([x, y, slash]) => ({ x, y, slash }));
      say(`<strong>${level.name} opened.</strong><small>Rotate mirrors to carry the beam to the moonwell. Pulse gates when the beam reaches a locked channel.</small>`);
      update();
    }
    function level() { return LEVELS[state.level]; }
    function key(x, y) { return `${x},${y}`; }
    function say(html) { log.innerHTML = html; }
    function mirrorAt(x, y) { return state.mirrors.find((item) => item.x === x && item.y === y); }
    function isGate(x, y) { return level().gates.some(([gx, gy]) => gx === x && gy === y); }
    function isReed(x, y) { return level().reeds.some(([rx, ry]) => rx === x && ry === y); }
    function isTide(x, y) { return level().tide.some(([tx, ty]) => tx === x && ty === y) && state.tide > 1; }
    function selectMirror(index) { if (!state.done) { state.selected = (index + state.mirrors.length) % state.mirrors.length; update(); } }
    function spend(amount) {
      if (state.done) return false;
      state.moves -= amount;
      state.tide = Math.min(3, state.tide + 1);
      if (state.moves < 0) {
        state.done = true;
        say('<strong>The marsh goes dark.</strong><small>You ran out of careful moves. Restart and spend gate pulses only where the beam actually needs them.</small>');
        return false;
      }
      return true;
    }
    function rotateSelected() {
      if (state.done || state.wonLevel) return;
      const mirror = state.mirrors[state.selected];
      mirror.slash = mirror.slash ? 0 : 1;
      spend(1);
      state.score = Math.max(0, state.score - 2);
      say('<strong>Mirror turned.</strong><small>The beam path recalculates. Tides rise after each action.</small>');
      update();
    }
    function pulseGate() {
      if (state.done || state.wonLevel) return;
      const path = trace();
      const gate = path.find((cell) => isGate(cell.x, cell.y) && !state.gates.has(key(cell.x, cell.y)));
      if (!gate) {
        spend(1);
        say('<strong>Pulse wasted in the reeds.</strong><small>No locked gate is currently touching the beam. Realign before spending charge.</small>');
      } else {
        state.gates.add(key(gate.x, gate.y));
        state.charge += 1;
        state.score += 14;
        spend(1);
        say('<strong>Gate charged.</strong><small>A locked channel opens and the beam travels farther.</small>');
      }
      update();
    }
    function nextLevel() {
      if (!state.wonLevel) return say('<strong>The moonwell is not lit yet.</strong><small>Solve this marsh before moving to the next one.</small>');
      if (state.level >= LEVELS.length - 1) return say(`<strong>All marshes charted.</strong><small>Final score ${state.score}. Restart to chase a cleaner route.</small>`);
      loadLevel(state.level + 1);
    }
    function reset() {
      state.score = 0;
      loadLevel(0);
    }
    function trace() {
      const cells = [];
      let [x, y, dir] = level().source;
      for (let step = 0; step < 40; step += 1) {
        x += DIRS[dir][0]; y += DIRS[dir][1];
        if (x < 0 || y < 0 || x > 5 || y > 4) break;
        cells.push({ x, y, dir });
        if (isReed(x, y) || isTide(x, y)) break;
        if (isGate(x, y) && !state.gates.has(key(x, y))) break;
        const mirror = mirrorAt(x, y);
        if (mirror) dir = mirror.slash ? [3, 2, 1, 0][dir] : [1, 0, 3, 2][dir];
        if (x === level().goal[0] && y === level().goal[1]) break;
      }
      return cells;
    }
    function evaluate() {
      const lit = trace().some((cell) => cell.x === level().goal[0] && cell.y === level().goal[1]);
      if (lit && !state.wonLevel) {
        state.wonLevel = true;
        state.score += 90 + state.moves * 7 + state.charge * 9 + (state.tide < 3 ? 18 : 0);
        say(`<strong>${level().name} moonwell lit.</strong><small>${state.moves} moves remain. Continue to the next marsh or restart for a higher score.</small>`);
      } else if (!lit && state.moves === 0 && !state.done) {
        state.done = true;
        say('<strong>The tide takes the mirrors.</strong><small>The path never reached the moonwell. Restart and try a shorter sequence.</small>');
      }
    }
    function updateHud() {
      hud.querySelector('#mirror-level').textContent = `${state.level + 1} / ${LEVELS.length}`;
      hud.querySelector('#mirror-moves').textContent = state.moves;
      hud.querySelector('#mirror-charge').textContent = state.charge;
      hud.querySelector('#mirror-tide').textContent = ['low', 'rising', 'high', 'flood'][state.tide];
      hud.querySelector('#mirror-score').textContent = state.score;
    }
    function updateTools() {
      tools.replaceChildren();
      state.mirrors.forEach((mirror, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.setAttribute('aria-pressed', String(index === state.selected));
        item.innerHTML = `<strong>Mirror ${index + 1}: ${mirror.slash ? '/' : '\\'}</strong><span>Column ${mirror.x + 1} · row ${mirror.y + 1}</span>`;
        item.addEventListener('click', () => selectMirror(index));
        tools.append(item);
      });
    }
    function update() { evaluate(); updateHud(); updateTools(); draw(); }

    board.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); selectMirror(state.selected + 1); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); selectMirror(state.selected - 1); }
      if (event.key === 'Enter') { event.preventDefault(); rotateSelected(); }
      if (event.key === ' ') { event.preventDefault(); pulseGate(); }
      if (event.key.toLowerCase() === 'r') { event.preventDefault(); reset(); }
    });
    board.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const col = Math.floor((event.clientX - rect.left) / Math.max(1, rect.width / 6));
      const row = Math.floor((event.clientY - rect.top) / Math.max(1, rect.height / 5));
      const index = state.mirrors.findIndex((mirror) => mirror.x === col && mirror.y === row);
      if (index >= 0) selectMirror(index); else rotateSelected();
    });

    function draw() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width;
      const h = rect.height;
      const cw = w / 6;
      const ch = h / 5;
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#06221f'); grad.addColorStop(1, '#111827');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < 5; y += 1) {
        for (let x = 0; x < 6; x += 1) {
          ctx.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,.045)' : 'rgba(255,255,255,.025)';
          ctx.fillRect(x * cw + 3, y * ch + 3, cw - 6, ch - 6);
        }
      }
      const pulse = reduced ? .55 : .45 + Math.sin(state.tick / 18) * .12;
      for (const [x, y] of level().reeds) drawCell(x, y, 'rgba(22,101,52,.7)', 'reeds');
      for (const [x, y] of level().tide) drawCell(x, y, state.tide > 1 ? 'rgba(14,165,233,.52)' : 'rgba(14,165,233,.18)', 'tide');
      for (const [x, y] of level().gates) drawCell(x, y, state.gates.has(key(x, y)) ? 'rgba(250,204,21,.5)' : 'rgba(120,113,108,.72)', 'gate');
      const path = trace();
      ctx.strokeStyle = `rgba(252, 211, 77, ${pulse + .28})`;
      ctx.lineWidth = Math.max(4, Math.min(cw, ch) * .08);
      ctx.lineCap = 'round';
      ctx.beginPath();
      const [sx, sy] = level().source;
      ctx.moveTo((sx + .5) * cw, (sy + .5) * ch);
      for (const cell of path) ctx.lineTo((cell.x + .5) * cw, (cell.y + .5) * ch);
      ctx.stroke();
      state.mirrors.forEach((mirror, index) => drawMirror(mirror, index === state.selected));
      drawCell(level().goal[0], level().goal[1], state.wonLevel ? 'rgba(187,247,208,.68)' : 'rgba(255,255,255,.16)', 'goal');
      const label = state.wonLevel ? 'lit' : level().name;
      ctx.fillStyle = 'rgba(255,255,255,.76)'; ctx.font = '700 13px system-ui'; ctx.fillText(label, 18, 24);

      function drawCell(x, y, color, text) {
        ctx.fillStyle = color; ctx.fillRect(x * cw + 8, y * ch + 8, cw - 16, ch - 16);
        ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.font = '700 11px system-ui'; ctx.fillText(text, x * cw + 13, y * ch + 24);
      }
      function drawMirror(mirror, selected) {
        const cx = (mirror.x + .5) * cw; const cy = (mirror.y + .5) * ch;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(mirror.slash ? Math.PI / 4 : -Math.PI / 4);
        ctx.fillStyle = selected ? '#fef3c7' : '#d1fae5'; ctx.fillRect(-cw * .28, -5, cw * .56, 10);
        ctx.strokeStyle = selected ? '#f59e0b' : '#10b981'; ctx.lineWidth = 3; ctx.strokeRect(-cw * .28, -5, cw * .56, 10); ctx.restore();
      }
    }
    function loop() {
      state.tick += 1;
      draw();
      if (!reduced && document.body.contains(root)) state.raf = requestAnimationFrame(loop);
    }
    loadLevel(0);
    if (!reduced) state.raf = requestAnimationFrame(loop);
    const observer = new MutationObserver(() => {
      if (!document.body.contains(root)) { cancelAnimationFrame(state.raf); observer.disconnect(); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard, { once: true }); else initCard();
})();
