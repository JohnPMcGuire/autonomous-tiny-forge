(() => {
  const APP = {
    name: 'Resonance Room', emoji: '🎚️', category: 'play', version: '1.0.0',
    summary: 'Tune unstable wave rooms by matching tones, damping noise, and spending scarce calibration moves.',
    description: 'A local harmonic puzzle with shifting wave targets, limited calibration moves, noise damping, optional local audio, adaptive rounds, scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and animation teardown.'
  };

  const ROOMS = [
    { name: 'Glass atrium', target: [3, 5, 7], drift: 1, noise: 16 },
    { name: 'Copper stairwell', target: [2, 6, 9], drift: -1, noise: 22 },
    { name: 'Archive dome', target: [4, 4, 8], drift: 2, noise: 18 },
    { name: 'Rain gallery', target: [1, 7, 10], drift: -2, noise: 26 },
    { name: 'Quiet engine', target: [5, 8, 11], drift: 1, noise: 24 }
  ];

  function installStyles() {
    if (document.querySelector('#resonance-room-styles')) return;
    const style = document.createElement('style');
    style.id = 'resonance-room-styles';
    style.textContent = `.resonance-card{animation:resonance-rise .32s ease both}.resonance-game{max-width:1000px;gap:14px}.resonance-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.resonance-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.resonance-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.resonance-stat strong{display:block;margin-top:4px;font-size:1rem}.resonance-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#0b1020;color:white;cursor:pointer;touch-action:manipulation;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.resonance-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.resonance-board canvas{display:block;width:100%;min-height:430px}.resonance-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.resonance-overlay strong{font-size:clamp(1.05rem,3vw,1.55rem)}.resonance-overlay small{display:block;max-width:680px;color:rgba(255,255,255,.76)}.resonance-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#a7f3d0;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.resonance-controls{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.resonance-controls button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.resonance-controls button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.resonance-controls span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.resonance-log{min-height:116px;padding:17px 19px}.resonance-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:760px){.resonance-hud{grid-template-columns:repeat(2,1fr)}.resonance-controls{grid-template-columns:1fr}.resonance-board canvas{min-height:360px}.resonance-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.resonance-card{animation:none}}@keyframes resonance-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-resonance-room-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.resonanceRoomCard = 'true';
    card.classList.add('resonance-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openResonanceRoom);
    grid.append(node);
  }

  function openResonanceRoom() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Resonance%20Room';
    stage.replaceChildren();
    renderGame(stage, dialog);
    dialog.showModal();
  }

  function renderGame(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel resonance-game';
    const hud = document.createElement('div');
    hud.className = 'resonance-hud';
    hud.innerHTML = '<div class="resonance-stat"><span>Room</span><strong id="res-room">1 / 5</strong></div><div class="resonance-stat"><span>Moves</span><strong id="res-moves">9</strong></div><div class="resonance-stat"><span>Noise</span><strong id="res-noise">0</strong></div><div class="resonance-stat"><span>Harmony</span><strong id="res-harmony">0%</strong></div><div class="resonance-stat"><span>Score</span><strong id="res-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'resonance-board';
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="resonance-overlay"><span><strong>Match the three bright target waves.</strong><small>Tap a dial, press 1 through 3, then use arrows or +/- to tune. D damps noise. Enter locks the room.</small></span><span class="resonance-badge">Harmonic puzzle</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const controls = document.createElement('div');
    controls.className = 'resonance-controls';
    const log = document.createElement('div');
    log.className = 'result-card resonance-log';
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
    const audioButton = makeButton('Sound off', toggleSound, true);
    const dampButton = makeButton('Damp noise', damp, true);
    actions.append(audioButton, dampButton, makeButton('Lock room', lock, false), makeButton('Restart', reset, true));
    root.append(hud, board, controls, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { room: 0, dials: [2, 5, 9], selected: 0, moves: 9, noise: 18, score: 0, harmony: 0, done: false, pulse: 0, raf: 0, audio: false, audioContext: null };
    const onClose = () => teardown();
    dialog.addEventListener('close', onClose, { once: true });

    function reset() {
      state.room = 0;
      state.dials = [2, 5, 9];
      state.selected = 0;
      state.moves = 9;
      state.noise = ROOMS[0].noise;
      state.score = 0;
      state.done = false;
      state.pulse = 0;
      say('<strong>First chamber is humming.</strong><small>Tune each dial toward the bright target wave. Fewer moves and lower noise score higher.</small>');
      update();
    }

    function room() { return ROOMS[state.room]; }
    function say(html) { log.innerHTML = html; }
    function harmony() {
      const target = room().target;
      const miss = state.dials.reduce((sum, dial, index) => sum + Math.abs(dial - target[index]), 0) + Math.floor(state.noise / 12);
      return Math.max(0, Math.round(100 - miss * 8));
    }
    function select(index) {
      if (state.done) return;
      state.selected = index;
      say(`<strong>${['Low','Middle','High'][index]} dial selected.</strong><small>Use arrows, plus, or minus to tune it. Current value ${state.dials[index]}.</small>`);
      update();
    }
    function tune(delta) {
      if (state.done) return;
      if (state.moves <= 0) return fail('No calibration moves remain.');
      state.dials[state.selected] = Math.max(0, Math.min(12, state.dials[state.selected] + delta));
      state.moves -= 1;
      state.noise = Math.min(60, state.noise + 2 + Math.abs(delta));
      state.pulse = 1;
      play(220 + state.dials[state.selected] * 26);
      say(`<strong>Dial ${state.selected + 1} tuned to ${state.dials[state.selected]}.</strong><small>The room drift added noise. Lock when harmony is high, or damp if noise is wrecking the match.</small>`);
      update();
    }
    function damp() {
      if (state.done) return;
      if (state.moves <= 1) return fail('Damping needs two moves.');
      state.moves -= 2;
      state.noise = Math.max(0, state.noise - 18);
      state.pulse = 1;
      play(180);
      say('<strong>Noise damped.</strong><small>You spent two moves to quiet the room and make the target easier to hold.</small>');
      update();
    }
    function fail(message) {
      state.done = true;
      state.score = Math.max(0, state.score - state.noise);
      say(`<strong>${message}</strong><small>The room fell out of phase. Final score ${state.score}. Restart to try a cleaner tuning path.</small>`);
      update();
    }
    function lock() {
      if (state.done) return;
      const fit = harmony();
      if (fit < 72) return fail('The lock rejected the unstable chord.');
      const gained = fit + state.moves * 6 - state.noise + state.room * 12;
      state.score += Math.max(20, gained);
      play(fit > 90 ? 720 : 520);
      state.room += 1;
      if (state.room >= ROOMS.length) {
        state.done = true;
        say(`<strong>All rooms aligned.</strong><small>You completed the resonance run with ${state.score} points. Replay to chase a quieter route.</small>`);
      } else {
        const next = room();
        state.moves = Math.max(6, 9 - state.room);
        state.noise = next.noise;
        state.dials = state.dials.map((dial, index) => Math.max(0, Math.min(12, dial + next.drift + (index - 1))));
        say(`<strong>${ROOMS[state.room - 1].name} locked at ${fit}%.</strong><small>Next: ${next.name}. Drift carried your dials forward, so decide what to preserve and what to retune.</small>`);
      }
      update();
    }
    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) {
        say('<strong>Sound is not available here.</strong><small>The puzzle still works without audio.</small>');
        return;
      }
      state.audio = !state.audio;
      audioButton.textContent = state.audio ? 'Sound on' : 'Sound off';
      audioButton.setAttribute('aria-pressed', String(state.audio));
      if (state.audio) {
        state.audioContext ||= new AudioEngine();
        state.audioContext.resume();
        play(440);
      }
    }
    function play(frequency) {
      if (!state.audio || !state.audioContext) return;
      const now = state.audioContext.currentTime;
      const oscillator = state.audioContext.createOscillator();
      const gain = state.audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.075, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      oscillator.connect(gain).connect(state.audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.24);
    }
    function update() {
      state.harmony = harmony();
      hud.querySelector('#res-room').textContent = `${Math.min(state.room + 1, ROOMS.length)} / ${ROOMS.length}`;
      hud.querySelector('#res-moves').textContent = state.moves;
      hud.querySelector('#res-noise').textContent = state.noise;
      hud.querySelector('#res-harmony').textContent = `${state.harmony}%`;
      hud.querySelector('#res-score').textContent = state.score;
      controls.replaceChildren();
      ['Low', 'Middle', 'High'].forEach((label, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.setAttribute('aria-pressed', String(state.selected === index));
        item.innerHTML = `<span>${label} wave</span><strong>Dial ${state.dials[index]} · target ${room().target[index]}</strong>`;
        item.addEventListener('click', () => select(index));
        controls.append(item);
      });
      draw();
    }
    function draw() {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width || 760));
      const height = Math.max(340, Math.floor(rect.height || 430));
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * scale);
      canvas.height = Math.floor(height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#111827');
      gradient.addColorStop(1, '#0f766e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 0.16;
      for (let x = 0; x < width; x += 32) {
        ctx.fillStyle = x % 64 ? '#ffffff' : '#a7f3d0';
        ctx.fillRect(x, 0, 1, height);
      }
      ctx.globalAlpha = 1;
      const target = room().target;
      for (let lane = 0; lane < 3; lane += 1) {
        const y = 78 + lane * 88;
        drawWave(y, target[lane], '#fef3c7', 3, width);
        drawWave(y, state.dials[lane], lane === state.selected ? '#a7f3d0' : '#93c5fd', 5, width);
        ctx.fillStyle = 'rgba(255,255,255,.88)';
        ctx.font = '700 13px system-ui, sans-serif';
        ctx.fillText(`${['Low','Middle','High'][lane]} target ${target[lane]} / dial ${state.dials[lane]}`, 18, y - 34);
      }
      ctx.fillStyle = 'rgba(0,0,0,.34)';
      ctx.fillRect(16, height - 82, Math.min(width - 32, state.noise * 8), 18);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(16, height - 82, Math.min(width - 32, state.noise * 8), 18);
      ctx.fillStyle = 'rgba(255,255,255,.86)';
      ctx.font = '800 12px system-ui, sans-serif';
      ctx.fillText(`${room().name} · harmony ${state.harmony}%`, 18, height - 94);
      if (!reduced && !state.done) {
        state.pulse = Math.max(0, state.pulse - 0.03);
        state.raf = requestAnimationFrame(draw);
      }
    }
    function drawWave(y, value, color, widthLine, boardWidth) {
      ctx.beginPath();
      for (let x = 0; x <= boardWidth; x += 8) {
        const amp = 16 + value * 1.7;
        const phase = reduced ? 0 : performance.now() / (700 + value * 30);
        const waveY = y + Math.sin(x / (24 + value * 4) + phase) * amp;
        if (x === 0) ctx.moveTo(x, waveY); else ctx.lineTo(x, waveY);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = widthLine;
      ctx.globalAlpha = 0.82;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    function onKey(event) {
      if (!root.isConnected || state.done && event.key !== 'r' && event.key !== 'R') return;
      if (['1', '2', '3'].includes(event.key)) { event.preventDefault(); select(Number(event.key) - 1); }
      if (event.key === 'ArrowUp' || event.key === '+') { event.preventDefault(); tune(1); }
      if (event.key === 'ArrowDown' || event.key === '-') { event.preventDefault(); tune(-1); }
      if (event.key === 'd' || event.key === 'D') { event.preventDefault(); damp(); }
      if (event.key === 'Enter') { event.preventDefault(); lock(); }
      if (event.key === 'r' || event.key === 'R') { event.preventDefault(); reset(); }
    }
    function teardown() {
      cancelAnimationFrame(state.raf);
      document.removeEventListener('keydown', onKey);
      if (state.audioContext) state.audioContext.close();
    }
    board.addEventListener('click', () => tune(1));
    document.addEventListener('keydown', onKey);
    reset();
  }

  const observer = new MutationObserver(initCard);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard, { once: true }); else initCard();
})();
