(() => {
  const APP = {
    name: 'Chord Courier',
    emoji: '🎼',
    category: 'play',
    version: '1.0.0',
    summary: 'Arrange rhythm tiles into a courier song that satisfies changing listeners.',
    description: 'A local sequencing puzzle with beat tiles, listener requests, energy costs, combo scoring, adaptive rounds, touch, keyboard, optional audio, reduced motion, and cleanup.'
  };

  const TILES = [
    { id: 'tap', label: 'Tap', icon: '●', cost: 1, mood: 2, pulse: 1, color: '#bfe7d1', tone: 330 },
    { id: 'lift', label: 'Lift', icon: '▲', cost: 2, mood: 3, pulse: 0, color: '#fff2bd', tone: 440 },
    { id: 'rest', label: 'Rest', icon: '□', cost: 0, mood: -1, pulse: -1, color: '#dfe7ff', tone: 220 },
    { id: 'drift', label: 'Drift', icon: '◇', cost: 1, mood: 1, pulse: -2, color: '#9fd9ff', tone: 275 },
    { id: 'spark', label: 'Spark', icon: '✦', cost: 3, mood: 4, pulse: 3, color: '#ff9c73', tone: 620 }
  ];
  const LISTENERS = [
    { name: 'Sleepy harbor', targetMood: 5, targetPulse: -1, energy: 8, rule: 'No more than one Spark.' },
    { name: 'Market rush', targetMood: 8, targetPulse: 5, energy: 9, rule: 'At least two high-pulse beats.' },
    { name: 'Moon parade', targetMood: 10, targetPulse: 3, energy: 10, rule: 'Use a Rest before the ending.' },
    { name: 'Clocktower encore', targetMood: 12, targetPulse: 7, energy: 11, rule: 'Finish with Lift or Spark.' }
  ];

  function installStyles() {
    if (document.querySelector('#chord-courier-styles')) return;
    const style = document.createElement('style');
    style.id = 'chord-courier-styles';
    style.textContent = `
      .chord-card { animation: chord-rise .34s ease both; }
      .chord-game { max-width: 940px; gap: 14px; }
      .chord-hud { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
      .chord-stat { border: 1px solid var(--line); border-radius: 15px; background: white; padding: 10px 12px; }
      .chord-stat span { display: block; color: var(--muted); font-size: .62rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
      .chord-stat strong { display: block; margin-top: 4px; font-size: 1rem; }
      .chord-stage { position: relative; border: 0; border-radius: 26px; overflow: hidden; padding: 0; background: #10131f; color: white; touch-action: manipulation; box-shadow: inset 0 0 0 1px rgba(255,255,255,.12); }
      .chord-stage canvas { display: block; width: 100%; min-height: 330px; }
      .chord-overlay { position: absolute; inset: auto 16px 14px 16px; display: flex; justify-content: space-between; gap: 12px; align-items: end; pointer-events: none; }
      .chord-overlay strong { font-size: clamp(1rem, 3vw, 1.5rem); }
      .chord-overlay small { display: block; max-width: 620px; color: rgba(255,255,255,.72); }
      .chord-badge { padding: 7px 9px; border-radius: 999px; background: rgba(255,255,255,.12); color: #fff2bd; font-size: .68rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
      .chord-sequence { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
      .chord-slot { min-height: 58px; border-radius: 16px; border: 1px dashed var(--line); background: white; font-weight: 900; display: grid; place-items: center; }
      .chord-slot.is-active { outline: 3px solid var(--accent); outline-offset: 2px; }
      .chord-pad { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
      .chord-pad button { min-height: 58px; border-radius: 16px; border: 1px solid var(--line); background: white; font-weight: 900; }
      .chord-pad small { display: block; color: var(--muted); font-weight: 800; }
      .chord-log { min-height: 118px; padding: 17px 19px; }
      .chord-log strong { font-size: clamp(1.08rem, 3vw, 1.45rem); }
      .chord-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
      @media (max-width: 760px) { .chord-hud { grid-template-columns: repeat(2, 1fr); } .chord-sequence { grid-template-columns: repeat(3, 1fr); } .chord-pad { grid-template-columns: repeat(2, 1fr); } .chord-actions { grid-template-columns: repeat(2, 1fr); } .chord-stage canvas { min-height: 300px; } .chord-overlay { flex-direction: column; align-items: start; } }
      @media (prefers-reduced-motion: reduce) { .chord-card { animation: none; } }
      @keyframes chord-rise { from { opacity: 0; transform: translateY(12px) scale(.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
    `;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-chord-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.chordCard = 'true';
    card.classList.add('chord-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const button = node.querySelector('.app-card-button');
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', openChordCourier);
    grid.append(node);
  }

  function openChordCourier() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Chord%20Courier';
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
    root.className = 'tool-panel chord-game';
    const hud = document.createElement('div');
    hud.className = 'chord-hud';
    hud.innerHTML = '<div class="chord-stat"><span>Listener</span><strong id="chord-round">1 / 4</strong></div><div class="chord-stat"><span>Mood</span><strong id="chord-mood">0</strong></div><div class="chord-stat"><span>Pulse</span><strong id="chord-pulse">0</strong></div><div class="chord-stat"><span>Energy</span><strong id="chord-energy">0</strong></div><div class="chord-stat"><span>Score</span><strong id="chord-score">0</strong></div>';
    const board = document.createElement('div');
    board.className = 'chord-stage';
    board.setAttribute('role', 'img');
    board.setAttribute('aria-label', 'Animated courier song staff showing selected beats, listener targets, and score feedback.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="chord-overlay"><span><strong>Deliver the right six-beat phrase.</strong><small>Pick tiles that fit mood, pulse, energy, and the listener rule. A clean phrase unlocks the next listener.</small></span><span class="chord-badge">Keys 1-5 · Enter play</span></span>';
    const canvas = board.querySelector('canvas');
    const context = canvas.getContext('2d');
    const sequence = document.createElement('div');
    sequence.className = 'chord-sequence';
    const pad = document.createElement('div');
    pad.className = 'chord-pad';
    const log = document.createElement('div');
    log.className = 'result-card chord-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'chord-actions';
    root.append(hud, board, sequence, pad, log, actions);
    stage.append(root);

    const state = { round: 0, score: 0, phrase: [], cursor: 0, playing: false, playIndex: -1, streak: 0, audio: false, audioContext: null, raf: 0, timers: [], reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches };
    function listener() { return LISTENERS[state.round]; }
    function writeLog(html) { log.innerHTML = html; }
    function clearTimers() { state.timers.forEach((timer) => window.clearTimeout(timer)); state.timers = []; }
    function schedule(fn, delay) { const timer = window.setTimeout(fn, delay); state.timers.push(timer); return timer; }
    function totals() {
      return state.phrase.reduce((sum, tile) => ({ mood: sum.mood + tile.mood, pulse: sum.pulse + tile.pulse, energy: sum.energy + tile.cost }), { mood: 0, pulse: 0, energy: 0 });
    }
    function rulePass() {
      const ids = state.phrase.map((tile) => tile.id);
      if (state.round === 0) return ids.filter((id) => id === 'spark').length <= 1;
      if (state.round === 1) return state.phrase.filter((tile) => tile.pulse >= 1).length >= 2;
      if (state.round === 2) return ids.slice(0, -1).includes('rest');
      return ['lift', 'spark'].includes(ids[ids.length - 1]);
    }
    function gradePhrase() {
      const total = totals();
      const moodGap = Math.abs(listener().targetMood - total.mood);
      const pulseGap = Math.abs(listener().targetPulse - total.pulse);
      const energyOver = Math.max(0, total.energy - listener().energy);
      const complete = state.phrase.length === 6;
      const rule = complete && rulePass();
      const passed = complete && rule && moodGap <= 2 && pulseGap <= 2 && energyOver === 0;
      const points = Math.max(0, 90 - moodGap * 10 - pulseGap * 9 - energyOver * 18 + (rule ? 18 : -16) + state.streak * 8);
      return { total, moodGap, pulseGap, energyOver, complete, rule, passed, points };
    }
    function setTile(tile) {
      if (state.playing) return;
      state.phrase[state.cursor] = tile;
      state.cursor = Math.min(5, state.cursor + 1);
      update();
      const grade = gradePhrase();
      writeLog(`<strong>${tile.label} placed.</strong><small>${listener().name} wants mood ${listener().targetMood}, pulse ${listener().targetPulse}, energy ${listener().energy}. ${listener().rule}</small>`);
      if (grade.complete) describeGrade(grade);
    }
    function describeGrade(grade) {
      const parts = [];
      if (!grade.rule) parts.push('listener rule missed');
      if (grade.moodGap > 2) parts.push('mood is off target');
      if (grade.pulseGap > 2) parts.push('pulse is off target');
      if (grade.energyOver > 0) parts.push('energy ran over');
      if (!parts.length) writeLog('<strong>Ready to deliver.</strong><small>Play the phrase to score it. Clean delivery can chain a streak into the next listener.</small>');
      else writeLog(`<strong>Phrase needs revision.</strong><small>${parts.join(', ')}. Replace a slot or clear the phrase before delivery.</small>`);
    }
    function clearPhrase() {
      if (state.playing) return;
      state.phrase = [];
      state.cursor = 0;
      writeLog(`<strong>Phrase cleared.</strong><small>Build six beats for ${listener().name}. ${listener().rule}</small>`);
      update();
    }
    function backspace() {
      if (state.playing) return;
      if (!state.phrase.length) return;
      state.cursor = Math.max(0, Math.min(state.cursor, state.phrase.length) - 1);
      state.phrase.splice(state.cursor, 1);
      writeLog('<strong>Beat removed.</strong><small>Repair the phrase without losing the listener.</small>');
      update();
    }
    function deliver() {
      if (state.playing) return;
      const grade = gradePhrase();
      if (!grade.complete) {
        writeLog('<strong>Six beats are required.</strong><small>Fill every slot before the courier can perform the delivery.</small>');
        return;
      }
      state.playing = true;
      clearTimers();
      const pace = state.reduced ? 80 : 260;
      state.phrase.forEach((tile, index) => schedule(() => { state.playIndex = index; playTone(tile); draw(); }, index * pace));
      schedule(() => {
        state.playing = false;
        state.playIndex = -1;
        if (grade.passed) {
          state.streak += 1;
          state.score += grade.points;
          if (state.round >= LISTENERS.length - 1) {
            writeLog(`<strong>Courier tour complete: ${state.score} points.</strong><small>Replay for tighter targets, higher streaks, and cleaner energy use.</small>`);
          } else {
            state.round += 1;
            state.phrase = [];
            state.cursor = 0;
            writeLog(`<strong>Delivered for ${grade.points} points.</strong><small>${listener().name} is waiting. The next request changes the rule and target shape.</small>`);
          }
        } else {
          state.streak = 0;
          state.score = Math.max(0, state.score + Math.floor(grade.points / 3) - 10);
          writeLog('<strong>The listener hesitated.</strong><small>Partial credit kept the run alive. Revise the six beats and deliver again.</small>');
        }
        update();
      }, state.phrase.length * pace + 120);
    }
    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) { writeLog('<strong>Sound is not available here.</strong><small>The sequencing puzzle still works without audio.</small>'); return; }
      state.audio = !state.audio;
      soundButton.textContent = state.audio ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(state.audio));
      if (state.audio) { state.audioContext ||= new AudioEngine(); state.audioContext.resume(); playTone(TILES[1]); }
    }
    function playTone(tile) {
      if (!state.audio || !state.audioContext) return;
      const now = state.audioContext.currentTime;
      const oscillator = state.audioContext.createOscillator();
      const gain = state.audioContext.createGain();
      oscillator.type = tile.id === 'spark' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(tile.tone, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(tile.id === 'rest' ? 0.018 : 0.07, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      oscillator.connect(gain).connect(state.audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
    }
    function resetTour() {
      clearTimers();
      state.round = 0;
      state.score = 0;
      state.phrase = [];
      state.cursor = 0;
      state.playing = false;
      state.playIndex = -1;
      state.streak = 0;
      writeLog(`<strong>Courier case opened.</strong><small>${listener().name} wants mood ${listener().targetMood}, pulse ${listener().targetPulse}, energy ${listener().energy}. ${listener().rule}</small>`);
      update();
    }
    function update() {
      const total = totals();
      hud.querySelector('#chord-round').textContent = `${state.round + 1} / ${LISTENERS.length}`;
      hud.querySelector('#chord-mood').textContent = `${total.mood} / ${listener().targetMood}`;
      hud.querySelector('#chord-pulse').textContent = `${total.pulse} / ${listener().targetPulse}`;
      hud.querySelector('#chord-energy').textContent = `${total.energy} / ${listener().energy}`;
      hud.querySelector('#chord-score').textContent = String(state.score);
      renderSlots();
      draw();
    }
    function renderSlots() {
      sequence.replaceChildren();
      for (let index = 0; index < 6; index += 1) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `chord-slot${index === state.cursor ? ' is-active' : ''}`;
        const tile = state.phrase[index];
        button.textContent = tile ? `${tile.icon} ${tile.label}` : `${index + 1}`;
        button.setAttribute('aria-label', tile ? `Slot ${index + 1}, ${tile.label}. Select to replace.` : `Empty slot ${index + 1}. Select to edit.`);
        button.addEventListener('click', () => { if (!state.playing) { state.cursor = index; update(); } });
        sequence.append(button);
      }
    }
    function draw() {
      const bounds = board.getBoundingClientRect();
      const width = Math.max(320, Math.floor(bounds.width));
      const height = Math.max(300, Math.floor(width * 0.48));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#10131f';
      context.fillRect(0, 0, width, height);
      for (let y = 80; y < height - 76; y += 34) { context.fillStyle = 'rgba(255,255,255,.08)'; context.fillRect(26, y, width - 52, 2); }
      context.fillStyle = '#fff2bd';
      context.font = '900 22px system-ui, sans-serif';
      context.textAlign = 'left';
      context.fillText(listener().name, 22, 36);
      context.fillStyle = 'rgba(255,255,255,.72)';
      context.font = '700 13px system-ui, sans-serif';
      context.fillText(`Target mood ${listener().targetMood}, pulse ${listener().targetPulse}, energy ${listener().energy}`, 22, 58);
      const step = (width - 80) / 5;
      state.phrase.forEach((tile, index) => {
        const x = 40 + step * index;
        const y = height * 0.52 - tile.pulse * 9;
        const active = state.playIndex === index;
        if (index > 0) {
          const prev = state.phrase[index - 1];
          const px = 40 + step * (index - 1);
          const py = height * 0.52 - prev.pulse * 9;
          context.strokeStyle = 'rgba(191,231,209,.6)';
          context.lineWidth = 4;
          context.beginPath();
          context.moveTo(px, py);
          context.lineTo(x, y);
          context.stroke();
        }
        context.fillStyle = tile.color;
        context.beginPath();
        context.arc(x, y, active ? 25 : 20, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#07110d';
        context.font = '900 20px system-ui, sans-serif';
        context.textAlign = 'center';
        context.fillText(tile.icon, x, y + 7);
      });
      const grade = gradePhrase();
      context.fillStyle = grade.passed ? '#bfe7d1' : grade.complete ? '#ff9c73' : 'rgba(255,255,255,.7)';
      context.font = '900 13px system-ui, sans-serif';
      context.textAlign = 'right';
      context.fillText(grade.complete ? `Projected ${grade.points} pts` : `${6 - state.phrase.length} beats needed`, width - 22, 36);
    }
    TILES.forEach((tile) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.innerHTML = `${tile.icon} ${tile.label}<small>Cost ${tile.cost} · mood ${tile.mood} · pulse ${tile.pulse}</small>`;
      button.setAttribute('aria-label', `Choose ${tile.label}, cost ${tile.cost}, mood ${tile.mood}, pulse ${tile.pulse}`);
      button.addEventListener('click', () => setTile(tile));
      pad.append(button);
    });
    const soundButton = makeButton('Sound off', toggleSound, true);
    soundButton.setAttribute('aria-pressed', 'false');
    actions.append(makeButton('Deliver phrase', deliver), makeButton('Undo beat', backspace, true), makeButton('Clear phrase', clearPhrase, true), soundButton);
    root.addEventListener('keydown', (event) => {
      if (event.key >= '1' && event.key <= '5') { event.preventDefault(); setTile(TILES[Number(event.key) - 1]); }
      else if (event.key === 'Enter') { event.preventDefault(); deliver(); }
      else if (event.key === 'Backspace') { event.preventDefault(); backspace(); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); state.cursor = Math.max(0, state.cursor - 1); update(); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); state.cursor = Math.min(5, state.cursor + 1); update(); }
    });
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(board);
    function tick() {
      if (!document.body.contains(root)) {
        clearTimers();
        if (state.raf) window.cancelAnimationFrame(state.raf);
        return;
      }
      if (!state.reduced && state.playing) draw();
      state.raf = window.requestAnimationFrame(tick);
    }
    resetTour();
    state.raf = window.requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard);
  else initCard();
})();
