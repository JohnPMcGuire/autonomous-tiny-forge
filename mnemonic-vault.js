(() => {
  const APP = {
    name: 'Mnemonic Vault',
    emoji: '🗝️',
    category: 'play',
    version: '1.0.0',
    summary: 'Watch, remember, and unlock a shifting vault before focus and attempts run out.',
    description: 'A local memory-strategy game with staged symbol paths, decoys, focus hints, lock pressure, scoring, adaptive rounds, touch, keyboard, reduced motion, and cleanup.'
  };

  const GLYPHS = ['◆', '▲', '●', '■', '✦', '✚', '⬟', '◇', '◈'];
  const LEVELS = [
    { title: 'Outer lock', length: 4, decoys: 2, focus: 3, attempts: 3, show: 950 },
    { title: 'Mirror lock', length: 5, decoys: 3, focus: 2, attempts: 3, show: 760 },
    { title: 'Pulse lock', length: 6, decoys: 4, focus: 2, attempts: 2, show: 620 }
  ];

  function installStyles() {
    if (document.querySelector('#mnemonic-vault-styles')) return;
    const style = document.createElement('style');
    style.id = 'mnemonic-vault-styles';
    style.textContent = `
      .vault-card { animation: vault-rise .34s ease both; }
      .vault-game { max-width: 920px; gap: 14px; }
      .vault-hud { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
      .vault-stat { border: 1px solid var(--line); border-radius: 15px; background: white; padding: 10px 12px; }
      .vault-stat span { display: block; color: var(--muted); font-size: .62rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
      .vault-stat strong { display: block; margin-top: 4px; font-size: 1rem; }
      .vault-board { position: relative; border: 0; border-radius: 26px; overflow: hidden; padding: 0; background: #0b1420; color: white; cursor: pointer; touch-action: manipulation; box-shadow: inset 0 0 0 1px rgba(255,255,255,.12); }
      .vault-board:focus-visible { outline: 4px solid var(--accent); outline-offset: 4px; }
      .vault-board canvas { display: block; width: 100%; min-height: 390px; }
      .vault-overlay { position: absolute; left: 18px; right: 18px; bottom: 16px; display: flex; justify-content: space-between; gap: 12px; align-items: end; pointer-events: none; }
      .vault-overlay strong { font-size: clamp(1rem, 3vw, 1.5rem); }
      .vault-overlay small { display: block; max-width: 640px; color: rgba(255,255,255,.72); }
      .vault-badge { padding: 7px 9px; border-radius: 999px; background: rgba(255,255,255,.12); color: #bfe7d1; font-size: .68rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
      .vault-log { min-height: 112px; padding: 17px 19px; }
      .vault-log strong { font-size: clamp(1.08rem, 3vw, 1.45rem); }
      .vault-controls { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .vault-glyphs { display: grid; grid-template-columns: repeat(9, 1fr); gap: 7px; }
      .vault-glyphs button { min-height: 44px; border-radius: 14px; border: 1px solid var(--line); background: white; font-size: 1.1rem; font-weight: 900; }
      .vault-glyphs button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
      @media (max-width: 720px) { .vault-hud { grid-template-columns: repeat(2, 1fr); } .vault-board canvas { min-height: 360px; } .vault-controls, .vault-glyphs { grid-template-columns: repeat(3, 1fr); } .vault-overlay { flex-direction: column; align-items: start; } }
      @media (prefers-reduced-motion: reduce) { .vault-card { animation: none; } }
      @keyframes vault-rise { from { opacity: 0; transform: translateY(12px) scale(.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
    `;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-vault-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.vaultCard = 'true';
    card.classList.add('vault-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const button = node.querySelector('.app-card-button');
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', openMnemonicVault);
    grid.append(node);
  }

  function openMnemonicVault() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Mnemonic%20Vault';
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
    root.className = 'tool-panel vault-game';
    const hud = document.createElement('div');
    hud.className = 'vault-hud';
    hud.innerHTML = '<div class="vault-stat"><span>Lock</span><strong id="vault-level">1 / 3</strong></div><div class="vault-stat"><span>Sequence</span><strong id="vault-progress">0 / 4</strong></div><div class="vault-stat"><span>Focus</span><strong id="vault-focus">0</strong></div><div class="vault-stat"><span>Attempts</span><strong id="vault-attempts">0</strong></div><div class="vault-stat"><span>Score</span><strong id="vault-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'vault-board';
    board.setAttribute('aria-label', 'Mnemonic Vault board. Watch the glowing symbol path, then replay it by selecting matching symbols.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="vault-overlay"><span><strong>Study the vault path, then replay the symbols in order.</strong><small>Decoys rotate each lock. Spend focus for one safe reveal, or risk a fast answer for a streak bonus.</small></span><span class="vault-badge">Tap · keys 1-9 · H hint</span></span>';
    const canvas = board.querySelector('canvas');
    const context = canvas.getContext('2d');
    const log = document.createElement('div');
    log.className = 'result-card vault-log';
    log.setAttribute('aria-live', 'polite');
    const glyphPad = document.createElement('div');
    glyphPad.className = 'vault-glyphs';
    GLYPHS.forEach((glyph, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = glyph;
      button.setAttribute('aria-label', `Choose glyph ${index + 1}`);
      button.addEventListener('click', () => chooseGlyph(glyph));
      glyphPad.append(button);
    });
    const actions = document.createElement('div');
    actions.className = 'vault-controls';
    actions.append(makeButton('Start lock', startLock), makeButton('Use focus hint', useHint, true), makeButton('Reset vault', resetVault, true));
    root.append(hud, board, glyphPad, log, actions);
    stage.append(root);
    const state = { level: 0, score: 0, focus: LEVELS[0].focus, attempts: LEVELS[0].attempts, sequence: [], visible: [], input: [], phase: 'idle', flashIndex: -1, hintIndex: -1, streak: 0, raf: 0, timers: [], reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches };
    function currentLevel() { return LEVELS[state.level]; }
    function writeLog(html) { log.innerHTML = html; }
    function clearTimers() { state.timers.forEach((timer) => window.clearTimeout(timer)); state.timers = []; }
    function schedule(fn, delay) { const timer = window.setTimeout(fn, delay); state.timers.push(timer); return timer; }
    function buildSequence() {
      const level = currentLevel();
      const pool = [...GLYPHS].sort(() => Math.random() - 0.5);
      const sequence = [];
      for (let i = 0; i < level.length; i += 1) sequence.push(pool[(i * 2 + state.level) % pool.length]);
      const decoys = pool.filter((glyph) => !sequence.includes(glyph)).slice(0, level.decoys);
      state.visible = [...new Set([...sequence, ...decoys])].sort(() => Math.random() - 0.5);
      state.sequence = sequence;
    }
    function startLock() {
      if (state.phase === 'showing') return;
      clearTimers();
      buildSequence();
      state.input = [];
      state.focus = currentLevel().focus;
      state.attempts = currentLevel().attempts;
      state.hintIndex = -1;
      state.phase = 'showing';
      writeLog(`<strong>${currentLevel().title} is opening.</strong><small>Watch ${state.sequence.length} symbols. The path hides, then you replay it from memory.</small>`);
      update();
      const delay = state.reduced ? 420 : currentLevel().show;
      state.sequence.forEach((glyph, index) => { schedule(() => { state.flashIndex = index; update(); }, index * delay); });
      schedule(() => { state.flashIndex = -1; state.phase = 'input'; writeLog('<strong>Replay the path.</strong><small>Select matching symbols in order. Hints cost focus and wrong symbols cost attempts.</small>'); update(); }, state.sequence.length * delay + 180);
    }
    function resetVault() {
      clearTimers();
      state.level = 0;
      state.score = 0;
      state.focus = currentLevel().focus;
      state.attempts = currentLevel().attempts;
      state.sequence = [];
      state.visible = [];
      state.input = [];
      state.phase = 'idle';
      state.flashIndex = -1;
      state.hintIndex = -1;
      state.streak = 0;
      writeLog('<strong>Vault sealed.</strong><small>Start a lock. Memorize the symbol path, then replay it with touch, click, or number keys.</small>');
      update();
    }
    function useHint() {
      if (state.phase === 'idle') { startLock(); return; }
      if (state.phase !== 'input' || state.focus <= 0) return;
      state.focus -= 1;
      state.hintIndex = state.input.length;
      const glyph = state.sequence[state.hintIndex];
      writeLog(`<strong>Focus spent: ${glyph} is next.</strong><small>Hints preserve the run but reduce the lock-clear bonus.</small>`);
      update();
    }
    function chooseGlyph(glyph) {
      if (state.phase === 'idle') { startLock(); return; }
      if (state.phase !== 'input') return;
      const expected = state.sequence[state.input.length];
      if (glyph !== expected) {
        state.attempts -= 1;
        state.streak = 0;
        state.score = Math.max(0, state.score - 8);
        state.hintIndex = state.input.length;
        writeLog(`<strong>False notch.</strong><small>${glyph} was a decoy. The next safe glyph is highlighted once. ${state.attempts} attempts remain.</small>`);
        if (state.attempts <= 0) failLock();
        update();
        return;
      }
      state.input.push(glyph);
      state.hintIndex = -1;
      state.streak += 1;
      state.score += 14 + state.streak * 3 + state.level * 5;
      if (state.input.length >= state.sequence.length) clearLock();
      else writeLog(`<strong>${state.input.length} of ${state.sequence.length} notches set.</strong><small>Streak ${state.streak}. Keep going or use focus if the path is fading.</small>`);
      update();
    }
    function failLock() { state.phase = 'failed'; writeLog('<strong>The vault relocked safely.</strong><small>No data was stored. Restart the current lock and use a focus hint before the first uncertain choice.</small>'); update(); }
    function clearLock() {
      const bonus = state.focus * 18 + state.attempts * 22 + state.streak * 6;
      state.score += bonus;
      if (state.level >= LEVELS.length - 1) {
        state.phase = 'complete';
        writeLog(`<strong>Vault mastered: ${state.score} points.</strong><small>Final bonus ${bonus}. Replay for a cleaner run with fewer hints and no false notches.</small>`);
      } else {
        state.level += 1;
        state.phase = 'idle';
        state.focus = currentLevel().focus;
        state.attempts = currentLevel().attempts;
        writeLog(`<strong>Lock cleared. Bonus ${bonus}.</strong><small>${currentLevel().title} unlocked with a longer path and more decoys. Start the next lock when ready.</small>`);
      }
      update();
    }
    function update() {
      const level = currentLevel();
      hud.querySelector('#vault-level').textContent = `${state.level + 1} / ${LEVELS.length}`;
      hud.querySelector('#vault-progress').textContent = `${state.input.length} / ${level.length}`;
      hud.querySelector('#vault-focus').textContent = String(state.focus);
      hud.querySelector('#vault-attempts').textContent = String(state.attempts);
      hud.querySelector('#vault-score').textContent = String(state.score);
      draw();
    }
    function draw() {
      const bounds = board.getBoundingClientRect();
      const width = Math.max(320, Math.floor(bounds.width));
      const height = Math.max(360, Math.floor(width * 0.56));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#0b1420';
      context.fillRect(0, 0, width, height);
      drawGrid(width, height);
      drawVault(width, height);
      drawGlyphs(width, height);
      drawPath(width, height);
    }
    function drawGrid(width, height) {
      context.fillStyle = 'rgba(255,255,255,.055)';
      for (let x = 0; x < width; x += 38) context.fillRect(x, 0, 1, height);
      for (let y = 0; y < height; y += 38) context.fillRect(0, y, width, 1);
      context.fillStyle = '#fff2bd';
      context.font = '900 22px system-ui, sans-serif';
      context.textAlign = 'left';
      context.fillText(currentLevel().title, 20, 36);
      context.fillStyle = 'rgba(255,255,255,.7)';
      context.font = '700 13px system-ui, sans-serif';
      context.fillText(state.phase === 'showing' ? 'Watching pattern.' : state.phase === 'input' ? 'Replay from memory.' : 'Start the next lock.', 20, 58);
    }
    function positions(width, height) {
      const cx = width / 2;
      const cy = height * 0.52;
      const radius = Math.min(width, height) * 0.28;
      const count = Math.max(6, state.visible.length || 6);
      return (state.visible.length ? state.visible : GLYPHS.slice(0, 6)).map((glyph, index) => {
        const angle = -Math.PI / 2 + index * Math.PI * 2 / count;
        return { glyph, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
      });
    }
    function drawVault(width, height) {
      const cx = width / 2;
      const cy = height * 0.52;
      const pulse = state.reduced ? 0 : Math.sin(performance.now() / 260) * 3;
      context.strokeStyle = 'rgba(191,231,209,.28)';
      context.lineWidth = 16;
      context.beginPath();
      context.arc(cx, cy, Math.min(width, height) * 0.33 + pulse, 0, Math.PI * 2);
      context.stroke();
      context.strokeStyle = 'rgba(255,242,189,.35)';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(cx, cy, Math.min(width, height) * 0.2, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = '#bfe7d1';
      context.font = '900 34px system-ui, sans-serif';
      context.textAlign = 'center';
      context.fillText(APP.emoji, cx, cy + 12);
    }
    function drawGlyphs(width, height) {
      positions(width, height).forEach((spot) => {
        const sequenceIndex = state.sequence.indexOf(spot.glyph);
        const isFlash = state.phase === 'showing' && sequenceIndex === state.flashIndex;
        const isHint = state.phase === 'input' && state.sequence[state.hintIndex] === spot.glyph;
        const isDone = state.input.includes(spot.glyph) && state.sequence.indexOf(spot.glyph) < state.input.length;
        context.fillStyle = isFlash || isHint ? '#ff6f4a' : isDone ? '#bfe7d1' : '#ffffff';
        context.beginPath();
        context.arc(spot.x, spot.y, isFlash ? 33 : 28, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#07110d';
        context.font = '900 24px system-ui, sans-serif';
        context.textAlign = 'center';
        context.fillText(spot.glyph, spot.x, spot.y + 8);
      });
    }
    function drawPath(width, height) {
      const spots = positions(width, height);
      const active = state.phase === 'showing' ? state.sequence.slice(0, state.flashIndex + 1) : state.input;
      if (active.length < 2) return;
      context.strokeStyle = 'rgba(255,111,74,.7)';
      context.lineWidth = 5;
      context.beginPath();
      active.forEach((glyph, index) => {
        const spot = spots.find((item) => item.glyph === glyph);
        if (!spot) return;
        if (index === 0) context.moveTo(spot.x, spot.y);
        else context.lineTo(spot.x, spot.y);
      });
      context.stroke();
    }
    function tick() {
      if (!document.body.contains(root)) {
        clearTimers();
        if (state.raf) window.cancelAnimationFrame(state.raf);
        return;
      }
      if (!state.reduced || state.phase === 'showing') draw();
      state.raf = window.requestAnimationFrame(tick);
    }
    board.addEventListener('click', () => {
      if (state.phase === 'idle' || state.phase === 'failed' || state.phase === 'complete') startLock();
      else if (state.phase === 'input') chooseGlyph(state.sequence[state.input.length]);
    });
    board.addEventListener('keydown', (event) => {
      if (event.key >= '1' && event.key <= '9') { event.preventDefault(); chooseGlyph(GLYPHS[Number(event.key) - 1]); }
      else if (event.key.toLowerCase() === 'h') { event.preventDefault(); useHint(); }
      else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (state.phase === 'input') chooseGlyph(state.sequence[state.input.length]);
        else startLock();
      }
    });
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(board);
    resetVault();
    state.raf = window.requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard);
  else initCard();
})();
