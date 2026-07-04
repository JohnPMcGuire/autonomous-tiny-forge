(() => {
  const APP = {
    name: 'Rhythm Relay', emoji: '🥁', category: 'play', version: '1.0.0',
    summary: 'Catch moving beat packets across four lanes while combo, focus, and tempo pressure climb.',
    description: 'A local rhythm-timing mini-game with falling beat packets, four lanes, combo scoring, focus slowdowns, adaptive tempo, session-only double-beat unlocks, optional local audio, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and clean teardown.'
  };
  const LANES = [
    { key: 'a', label: 'A', tone: 220, color: '#fde68a' },
    { key: 's', label: 'S', tone: 294, color: '#93c5fd' },
    { key: 'd', label: 'D', tone: 370, color: '#c4b5fd' },
    { key: 'f', label: 'F', tone: 494, color: '#86efac' }
  ];
  const EVENTS = ['Warm-up count', 'Tempo lift', 'Cross-lane run', 'Double-beat unlock', 'Final relay'];

  function installStyles() {
    if (document.querySelector('#rhythm-relay-styles')) return;
    const style = document.createElement('style');
    style.id = 'rhythm-relay-styles';
    style.textContent = `.rhythm-card{animation:rhythm-pop .32s ease both}.rhythm-game{max-width:1060px;gap:14px}.rhythm-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.rhythm-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.rhythm-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.rhythm-stat strong{display:block;margin-top:4px;font-size:1rem}.rhythm-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#09111f;color:white;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.rhythm-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.rhythm-board canvas{display:block;width:100%;min-height:400px}.rhythm-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.rhythm-overlay strong{font-size:clamp(1.05rem,3vw,1.55rem)}.rhythm-overlay small{display:block;max-width:760px;color:rgba(255,255,255,.78)}.rhythm-badge{padding:7px 9px;border-radius:999px;background:rgba(147,197,253,.16);color:#bfdbfe;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.rhythm-pads{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.rhythm-pad{border:1px solid var(--line);border-radius:18px;background:white;color:var(--ink);padding:16px 10px;font-weight:900;font-size:1.05rem}.rhythm-pad:active,.rhythm-pad.is-hit{transform:translateY(2px);box-shadow:inset 0 0 0 2px var(--accent)}.rhythm-log{min-height:116px;padding:17px 19px}.rhythm-log strong{font-size:clamp(1.08rem,3vw,1.5rem)}@media(max-width:760px){.rhythm-hud{grid-template-columns:repeat(2,1fr)}.rhythm-pads{grid-template-columns:repeat(2,1fr)}.rhythm-board canvas{min-height:340px}.rhythm-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.rhythm-card{animation:none}}@keyframes rhythm-pop{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function labelCategory(value) { return value === 'play' ? 'Play' : value === 'useful' ? 'Useful' : 'Experiment'; }
  function activeFilter() { return document.querySelector('.filter.is-active')?.dataset.filter || 'all'; }
  function eligible() { const filter = activeFilter(); return filter === 'all' || filter === APP.category; }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-rhythm-relay-card]') || !eligible()) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.rhythmRelayCard = 'true';
    card.classList.add('rhythm-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `${labelCategory(APP.category)} · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openRhythm);
    grid.append(node);
  }

  function wireFilterRefresh() {
    document.querySelectorAll('.filter').forEach((button) => {
      if (button.dataset.rhythmRelayRefresh) return;
      button.dataset.rhythmRelayRefresh = 'true';
      button.addEventListener('click', () => setTimeout(initCard, 0));
    });
  }

  function openRhythm() {
    const dialog = document.querySelector('#app-dialog');
    const stage = document.querySelector('#app-stage');
    const title = document.querySelector('#dialog-title');
    const category = document.querySelector('#dialog-category');
    const description = document.querySelector('#dialog-description');
    const feedback = document.querySelector('#dialog-feedback');
    if (!dialog || !stage || !title || !category || !description || !feedback) return;
    title.textContent = APP.name;
    category.textContent = `${labelCategory(APP.category)} · ${APP.emoji}`;
    description.textContent = APP.description;
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Rhythm%20Relay';
    stage.replaceChildren();
    renderGame(stage, dialog);
    dialog.showModal();
  }

  function renderGame(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel rhythm-game';
    const hud = document.createElement('div');
    hud.className = 'rhythm-hud';
    hud.innerHTML = '<div class="rhythm-stat"><span>Round</span><strong id="rhythm-round">1 / 5</strong></div><div class="rhythm-stat"><span>Score</span><strong id="rhythm-score">0</strong></div><div class="rhythm-stat"><span>Combo</span><strong id="rhythm-combo">0</strong></div><div class="rhythm-stat"><span>Focus</span><strong id="rhythm-focus">3</strong></div><div class="rhythm-stat"><span>Misses</span><strong id="rhythm-miss">0 / 8</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'rhythm-board';
    board.setAttribute('aria-label', 'Rhythm relay timing board. Press A, S, D, or F when packets reach the target line.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="rhythm-overlay"><span><strong>Catch packets on the target line.</strong><small>Use A S D F, tap the lane pads, or spend focus to slow the relay for one moment.</small></span><span class="rhythm-badge">Five rounds</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const pads = document.createElement('div');
    pads.className = 'rhythm-pads';
    const log = document.createElement('div');
    log.className = 'result-card rhythm-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const startButton = makeButton('Start relay', startRound);
    const focusButton = makeButton('Spend focus', spendFocus, true);
    const soundButton = makeButton('Sound off', toggleSound, true);
    const resetButton = makeButton('New run', reset, true);
    actions.append(startButton, focusButton, soundButton, resetButton);
    root.append(hud, board, pads, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { round: 1, score: 0, combo: 0, focus: 3, misses: 0, running: false, done: false, slowUntil: 0, notes: [], nextAt: 0, started: 0, raf: 0, audio: false, audioContext: null, unlocked: false, lastTime: 0 };
    let width = 900;
    let height = 400;
    dialog.addEventListener('close', teardown, { once: true });

    LANES.forEach((lane, index) => {
      const pad = document.createElement('button');
      pad.type = 'button';
      pad.className = 'rhythm-pad';
      pad.textContent = `${lane.label} lane`;
      pad.addEventListener('click', () => hit(index));
      pads.append(pad);
    });

    function makeButton(text, fn, secondary) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = secondary ? 'button button-secondary' : 'button';
      button.textContent = text;
      button.addEventListener('click', fn);
      return button;
    }
    function say(html) { log.innerHTML = html; }
    function roundSpeed() { return (0.12 + state.round * 0.018) * (performance.now() < state.slowUntil ? 0.55 : 1); }
    function spawnGap() { return Math.max(320, 880 - state.round * 95 - (state.unlocked ? 80 : 0)); }
    function laneX(index) { return 46 + index * ((width - 92) / 3); }
    function targetY() { return height - 78; }

    function reset() {
      state.round = 1; state.score = 0; state.combo = 0; state.focus = 3; state.misses = 0; state.running = false; state.done = false;
      state.slowUntil = 0; state.notes = []; state.nextAt = 0; state.started = 0; state.unlocked = false; state.lastTime = performance.now();
      startButton.textContent = 'Start relay';
      say('<strong>Relay ready.</strong><small>Start the round, then catch packets as they cross the bright target line. After round three, double-beats unlock.</small>');
      update(); draw();
    }

    function startRound() {
      if (state.done) return reset();
      if (state.running) return;
      state.running = true;
      state.notes = [];
      state.nextAt = performance.now() + 520;
      state.started = performance.now();
      startButton.textContent = 'Round running';
      say(`<strong>${EVENTS[state.round - 1]}.</strong><small>Round ${state.round} is live. Build combo, spend focus only when the lane gets crowded.</small>`);
      ping(0, 'start');
      update();
    }

    function finishRound() {
      state.running = false;
      state.notes = [];
      if (state.round === 3 && !state.unlocked) {
        state.unlocked = true;
        state.focus += 1;
        say('<strong>Double-beat relay unlocked.</strong><small>Later rounds may send paired packets. You gained one focus for the harder tempo.</small>');
      } else if (state.round >= 5 || state.misses >= 8) {
        return finishRun();
      } else {
        say(`<strong>Round ${state.round} cleared.</strong><small>Score ${state.score}. Next tempo is faster, but clean hits restore focus every six combo.</small>`);
      }
      state.round += 1;
      startButton.textContent = 'Start next round';
      update();
    }

    function finishRun() {
      state.done = true;
      state.running = false;
      const grade = state.misses <= 1 ? 'Perfect street parade' : state.misses <= 4 ? 'Solid relay crew' : 'Scrappy recovery run';
      say(`<strong>${grade}: ${state.score} points.</strong><small>Best combo ${state.combo}. Replay for fewer misses, later focus, or cleaner double-beat timing.</small>`);
      startButton.textContent = 'Play again';
      update();
    }

    function spawn(now) {
      const count = state.unlocked && state.round >= 4 && Math.random() < 0.35 ? 2 : 1;
      const used = new Set();
      for (let i = 0; i < count; i += 1) {
        let lane = Math.floor(Math.random() * LANES.length);
        while (used.has(lane)) lane = (lane + 1) % LANES.length;
        used.add(lane);
        state.notes.push({ lane, y: 24 - i * 46, hit: false });
      }
      state.nextAt = now + spawnGap();
    }

    function hit(laneIndex) {
      if (!state.running) return;
      const target = targetY();
      let best = null;
      for (const note of state.notes) {
        if (note.lane !== laneIndex || note.hit) continue;
        const distance = Math.abs(note.y - target);
        if (!best || distance < best.distance) best = { note, distance };
      }
      const pad = pads.children[laneIndex];
      pad.classList.add('is-hit');
      setTimeout(() => pad.classList.remove('is-hit'), 90);
      if (best && best.distance < 42) {
        best.note.hit = true;
        const accuracy = Math.max(1, Math.round(42 - best.distance));
        const bonus = 20 + accuracy + Math.min(50, state.combo * 2);
        state.score += bonus;
        state.combo += 1;
        if (state.combo > 0 && state.combo % 6 === 0) state.focus = Math.min(5, state.focus + 1);
        ping(laneIndex, 'hit');
        say(`<strong>Clean catch +${bonus}.</strong><small>Accuracy window ${accuracy}. Combo ${state.combo}; focus refills every six catches.</small>`);
      } else {
        state.combo = 0;
        state.misses += 1;
        ping(laneIndex, 'miss');
        say('<strong>Off beat.</strong><small>Recover on the next packet. Eight misses ends the relay.</small>');
        if (state.misses >= 8) finishRun();
      }
      update();
    }

    function spendFocus() {
      if (!state.running || state.focus <= 0) {
        say('<strong>Focus is not available.</strong><small>Start a round or rebuild focus with clean combos.</small>');
        return;
      }
      state.focus -= 1;
      state.slowUntil = performance.now() + 1450;
      say('<strong>Focus spent.</strong><small>The relay slows briefly. Use it to rescue dense lanes, not easy beats.</small>');
      update();
    }

    function toggleSound() {
      const Engine = window.AudioContext || window.webkitAudioContext;
      if (!Engine) {
        say('<strong>Sound is not available here.</strong><small>The relay remains fully playable without audio.</small>');
        return;
      }
      state.audio = !state.audio;
      soundButton.textContent = state.audio ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(state.audio));
      if (state.audio) {
        state.audioContext ||= new Engine();
        state.audioContext.resume();
        ping(1, 'start');
      }
    }

    function ping(laneIndex, kind) {
      if (!state.audio || !state.audioContext) return;
      const now = state.audioContext.currentTime;
      const osc = state.audioContext.createOscillator();
      const gain = state.audioContext.createGain();
      osc.type = kind === 'miss' ? 'square' : 'sine';
      osc.frequency.setValueAtTime(kind === 'miss' ? 120 : LANES[laneIndex]?.tone || 330, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(kind === 'miss' ? 0.06 : 0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(gain).connect(state.audioContext.destination);
      osc.start(now); osc.stop(now + 0.2);
    }

    function update() {
      hud.querySelector('#rhythm-round').textContent = `${Math.min(state.round, 5)} / 5`;
      hud.querySelector('#rhythm-score').textContent = state.score;
      hud.querySelector('#rhythm-combo').textContent = state.combo;
      hud.querySelector('#rhythm-focus').textContent = state.focus;
      hud.querySelector('#rhythm-miss').textContent = `${state.misses} / 8`;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      width = Math.max(320, rect.width || 900);
      height = Math.max(340, rect.height || 400);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#12213f'); grad.addColorStop(1, '#070b14');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2;
      for (let i = 0; i < LANES.length; i += 1) {
        const x = laneX(i);
        ctx.beginPath(); ctx.moveTo(x, 36); ctx.lineTo(x, height - 42); ctx.stroke();
        ctx.fillStyle = LANES[i].color; ctx.font = '900 18px system-ui'; ctx.fillText(LANES[i].label, x - 7, height - 20);
      }
      const target = targetY();
      ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(24, target - 3, width - 48, 6);
      ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.font = '800 18px system-ui'; ctx.fillText(EVENTS[Math.min(4, state.round - 1)], 24, 34);
      for (const note of state.notes) {
        if (note.hit) continue;
        const lane = LANES[note.lane];
        ctx.fillStyle = lane.color;
        ctx.beginPath(); ctx.arc(laneX(note.lane), note.y, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.font = '900 12px system-ui'; ctx.fillText(lane.label, laneX(note.lane) - 4, note.y + 4);
      }
      if (!state.running) {
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '800 16px system-ui';
        ctx.fillText(state.done ? 'Run complete. Start again to replay.' : 'Press Start relay when ready.', 24, 62);
      }
    }

    function tick(now) {
      const delta = Math.min(40, now - state.lastTime);
      state.lastTime = now;
      if (state.running) {
        if (now >= state.nextAt) spawn(now);
        const speed = reduced ? 0.2 : roundSpeed();
        for (const note of state.notes) note.y += delta * speed;
        const target = targetY();
        const before = state.notes.length;
        state.notes = state.notes.filter((note) => {
          if (note.hit) return false;
          if (note.y > target + 54) { state.misses += 1; state.combo = 0; return false; }
          return true;
        });
        if (state.notes.length !== before) {
          say('<strong>Packet missed.</strong><small>Regain control with the next lane or spend focus before the board crowds.</small>');
          update();
          if (state.misses >= 8) finishRun();
        }
        if (state.running && now - state.started > 14500 + state.round * 1200) finishRound();
      }
      draw();
      state.raf = requestAnimationFrame(tick);
    }

    function onKey(event) {
      const key = event.key.toLowerCase();
      const index = LANES.findIndex((lane) => lane.key === key);
      if (index >= 0) { event.preventDefault(); hit(index); return; }
      if (key === ' ' || key === 'enter') { event.preventDefault(); startRound(); return; }
      if (key === 'shift') { event.preventDefault(); spendFocus(); }
    }

    function teardown() {
      cancelAnimationFrame(state.raf);
      window.removeEventListener('resize', resize);
      board.removeEventListener('keydown', onKey);
      if (state.audioContext?.state === 'running') state.audioContext.suspend();
    }

    board.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);
    reset();
    requestAnimationFrame(resize);
    state.raf = requestAnimationFrame(tick);
  }

  const start = () => { installStyles(); wireFilterRefresh(); setTimeout(initCard, 0); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
