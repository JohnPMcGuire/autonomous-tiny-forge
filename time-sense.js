(() => {
  const styleId = 'time-sense-enhanced-styles';

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .time-game { max-width: 780px; gap: 14px; }
      .time-mode-fieldset { margin: 0; padding: 0; border: 0; }
      .time-mode-fieldset legend { margin-bottom: 8px; font-size: .72rem; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; color: var(--muted); }
      .time-modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .time-mode { position: relative; display: block; cursor: pointer; }
      .time-mode input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
      .time-mode span { min-height: 68px; display: grid; align-content: center; gap: 3px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 15px; background: white; transition: transform .16s ease, border-color .16s ease, background .16s ease; }
      .time-mode strong { font-size: .9rem; }
      .time-mode small { color: var(--muted); font-size: .72rem; line-height: 1.25; }
      .time-mode input:checked + span { border-color: var(--ink); background: var(--mint); box-shadow: inset 0 0 0 1px var(--ink); }
      .time-mode input:focus-visible + span { outline: 4px solid var(--accent); outline-offset: 3px; }
      .time-mode input:disabled + span { opacity: .58; cursor: not-allowed; }
      .time-mode:hover span { transform: translateY(-1px); border-color: rgba(21,33,28,.42); }
      .time-hud { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
      .time-stat { border: 1px solid var(--line); border-radius: 15px; padding: 10px 12px; background: white; }
      .time-stat span { display: block; color: var(--muted); font-size: .66rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
      .time-stat strong { display: block; margin-top: 4px; font-size: 1rem; }
      .time-arena { position: relative; width: 100%; min-height: 286px; overflow: hidden; border: 2px solid transparent; border-radius: 26px; padding: 0; background: #07110d; color: white; cursor: pointer; touch-action: manipulation; box-shadow: inset 0 0 0 1px rgba(255,255,255,.08), 0 18px 42px rgba(21,33,28,.16); }
      .time-arena:hover { transform: none; box-shadow: inset 0 0 0 1px rgba(255,255,255,.12), 0 22px 52px rgba(21,33,28,.22); }
      .time-arena:focus-visible { outline: 4px solid var(--accent); outline-offset: 4px; }
      .time-arena canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
      .time-arena-copy { position: relative; z-index: 1; min-height: 286px; display: grid; place-content: center; justify-items: center; gap: 8px; padding: 28px; text-align: center; pointer-events: none; background: radial-gradient(circle at center, rgba(7,17,13,.04), rgba(7,17,13,.64) 74%); }
      .time-arena-kicker { font-size: .69rem; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; color: var(--mint); }
      .time-arena strong { max-width: 610px; font-size: clamp(2rem, 7vw, 4.1rem); line-height: .95; letter-spacing: -.055em; text-wrap: balance; }
      .time-arena small { color: rgba(255,255,255,.74); font-size: .94rem; }
      .time-arena.is-running { border-color: var(--accent); }
      .time-arena.is-running .time-arena-kicker { color: #fff2bd; }
      .time-arena.is-complete { border-color: var(--mint); }
      .time-result { min-height: 98px; padding: 18px 21px; }
      .time-result strong { font-size: clamp(1.2rem, 3.5vw, 1.9rem); }
      .time-session-note { color: var(--muted); font-size: .78rem; line-height: 1.45; }
      @media (max-width: 600px) {
        .time-modes { grid-template-columns: 1fr; }
        .time-mode span { min-height: 54px; grid-template-columns: auto 1fr; align-items: center; column-gap: 10px; }
        .time-hud { grid-template-columns: repeat(2, 1fr); }
        .time-arena, .time-arena-copy { min-height: 242px; }
      }
      @media (max-width: 390px) {
        .time-stat { padding: 9px; }
        .time-stat span { letter-spacing: .05em; }
      }
    `;
    document.head.append(styles);
  }

  window.renderTimerGuess = function renderTimerGuessEnhanced(app) {
    installStyles();

    const root = panel('');
    root.classList.add('time-game');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const configuredMin = app.config.minSeconds || 20;
    const configuredMax = app.config.maxSeconds || 75;
    const configuredRounds = app.config.rounds || 5;
    const presets = [
      { id: 'quick', label: 'Quick', detail: '3 rounds · 8–20 sec', rounds: 3, min: 8, max: 20 },
      { id: 'classic', label: 'Classic', detail: '5 rounds · 15–40 sec', rounds: 5, min: 15, max: 40 },
      { id: 'endurance', label: 'Endurance', detail: `${configuredRounds} rounds · ${configuredMin}–${configuredMax} sec`, rounds: configuredRounds, min: configuredMin, max: configuredMax }
    ];

    let preset = presets[0];
    let started = 0;
    let target = 0;
    let scores = [];
    let sessionComplete = false;
    let soundEnabled = false;
    let audioContext;
    let animationFrame = 0;
    let resizeObserver;
    let disposed = false;

    const modeFieldset = document.createElement('fieldset');
    modeFieldset.className = 'time-mode-fieldset';
    const legend = document.createElement('legend');
    legend.textContent = 'Choose a session';
    const modes = document.createElement('div');
    modes.className = 'time-modes';
    const modeInputs = [];

    presets.forEach((item, index) => {
      const label = document.createElement('label');
      label.className = 'time-mode';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'time-sense-mode';
      input.value = item.id;
      input.checked = index === 0;
      const copy = document.createElement('span');
      const name = document.createElement('strong');
      name.textContent = item.label;
      const detail = document.createElement('small');
      detail.textContent = item.detail;
      copy.append(name, detail);
      label.append(input, copy);
      modes.append(label);
      modeInputs.push(input);
      input.addEventListener('change', () => {
        if (!input.checked) return;
        preset = item;
        resetSession(`${item.label} session ready.`, `${item.detail}. Tap the arena when you are ready.`);
      });
    });
    modeFieldset.append(legend, modes);

    const hud = document.createElement('div');
    hud.className = 'time-hud';
    hud.innerHTML = `
      <div class="time-stat"><span>Mode</span><strong data-time-mode>Quick</strong></div>
      <div class="time-stat"><span>Round</span><strong data-time-round>1 / 3</strong></div>
      <div class="time-stat"><span>Average</span><strong data-time-average>—</strong></div>
      <div class="time-stat"><span>Best</span><strong data-time-best>—</strong></div>
    `;

    const arena = document.createElement('button');
    arena.className = 'time-arena';
    arena.type = 'button';
    arena.setAttribute('aria-label', 'Start the Quick hidden timer session');
    arena.innerHTML = `
      <canvas aria-hidden="true"></canvas>
      <span class="time-arena-copy">
        <span class="time-arena-kicker">Tap, Space, or Enter</span>
        <strong>Start round</strong>
        <small>Watch the spark, not a clock.</small>
      </span>
    `;

    const canvas = arena.querySelector('canvas');
    const arenaKicker = arena.querySelector('.time-arena-kicker');
    const arenaTitle = arena.querySelector('strong');
    const arenaNote = arena.querySelector('small');
    const result = resultCard();
    result.classList.add('time-result');

    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const soundButton = makeButton('Sound off', toggleSound, true);
    soundButton.setAttribute('aria-pressed', 'false');
    const resetButton = makeButton('Reset score', () => resetSession('Score reset.', 'Tap the arena when you are ready for round one.'), true);
    actions.append(soundButton, resetButton);

    const note = document.createElement('p');
    note.className = 'time-session-note';
    note.textContent = 'Quick is the default for a short replay loop. Change modes between rounds; changing mode resets the current score.';

    root.append(modeFieldset, hud, arena, result, actions, note);
    const context = canvas.getContext('2d');
    const stars = Array.from({ length: 48 }, (_, index) => ({
      x: ((index * 47) % 101) / 100,
      y: ((index * 71) % 97) / 96,
      size: 0.65 + (index % 4) * 0.42,
      phase: index * 0.73
    }));

    arena.addEventListener('click', () => {
      if (started) stopRound();
      else startRound();
    });
    dialog.addEventListener('close', cleanup, { once: true });

    setResult('How accurate is your internal clock?', 'Choose a session, start a round, then stop when the target duration feels complete.');
    updateHud();
    draw(performance.now());
    if (!reducedMotion) animationFrame = requestAnimationFrame(animate);
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => draw(performance.now()));
      resizeObserver.observe(arena);
    }

    function setResult(headline, detail) {
      result.replaceChildren();
      const strong = document.createElement('strong');
      strong.textContent = headline;
      const small = document.createElement('small');
      small.textContent = detail;
      result.append(strong, small);
    }

    function setModesDisabled(disabled) {
      modeInputs.forEach((input) => { input.disabled = disabled; });
    }

    function updateHud() {
      hud.querySelector('[data-time-mode]').textContent = preset.label;
      const nextRound = sessionComplete ? preset.rounds : Math.min(scores.length + 1, preset.rounds);
      hud.querySelector('[data-time-round]').textContent = `${nextRound} / ${preset.rounds}`;
      hud.querySelector('[data-time-average]').textContent = scores.length
        ? `${Math.round(scores.reduce((sum, item) => sum + item.accuracy, 0) / scores.length)}%`
        : '—';
      hud.querySelector('[data-time-best]').textContent = scores.length
        ? `${Math.max(...scores.map((item) => item.accuracy))}%`
        : '—';
    }

    function resetSession(headline = `${preset.label} session ready.`, detail = `${preset.detail}. Tap the arena when you are ready.`) {
      started = 0;
      target = 0;
      scores = [];
      sessionComplete = false;
      setModesDisabled(false);
      arena.classList.remove('is-running', 'is-complete');
      arenaKicker.textContent = 'Tap, Space, or Enter';
      arenaTitle.textContent = 'Start round';
      arenaNote.textContent = 'Watch the spark, not a clock.';
      arena.setAttribute('aria-label', `Start the ${preset.label} hidden timer session`);
      setResult(headline, detail);
      updateHud();
      draw(performance.now());
    }

    function startRound() {
      if (sessionComplete) resetSession();
      target = Math.floor(Math.random() * (preset.max - preset.min + 1)) + preset.min;
      started = performance.now();
      setModesDisabled(true);
      arena.classList.add('is-running');
      arena.classList.remove('is-complete');
      arenaKicker.textContent = `Round ${scores.length + 1} of ${preset.rounds}`;
      arenaTitle.textContent = `Stop at ${target} seconds`;
      arenaNote.textContent = 'The timer is hidden. Trust your sense of time.';
      arena.setAttribute('aria-label', `Stop the hidden timer at ${target} seconds`);
      setResult(`Target: ${target} seconds`, 'No countdown. Tap again when the moment feels right.');
      playTone('start');
    }

    function stopRound() {
      const elapsed = (performance.now() - started) / 1000;
      const difference = Math.abs(elapsed - target);
      const direction = elapsed < target ? 'early' : 'late';
      const accuracy = Math.max(0, Math.round(100 - (difference / target) * 200));
      scores.push({ accuracy, difference, elapsed, target });
      const isFinalRound = scores.length >= preset.rounds;
      started = 0;
      setModesDisabled(false);
      arena.classList.remove('is-running');
      arenaKicker.textContent = `${preset.label} · ${scores.length} of ${preset.rounds}`;
      arenaTitle.textContent = isFinalRound ? 'See final score' : 'Start next round';
      arenaNote.textContent = `${elapsed.toFixed(1)} seconds · ${accuracy}% accuracy`;

      if (isFinalRound) {
        sessionComplete = true;
        arena.classList.add('is-complete');
        const average = Math.round(scores.reduce((sum, item) => sum + item.accuracy, 0) / scores.length);
        const closest = scores.reduce((best, item) => item.difference < best.difference ? item : best);
        arenaTitle.textContent = 'Play another set';
        arenaNote.textContent = `Average ${average}% · best miss ${closest.difference.toFixed(1)}s`;
        arena.setAttribute('aria-label', `Start another ${preset.label} session`);
        setResult(`${average}% session accuracy`, `Closest round: ${closest.difference.toFixed(1)} seconds off. Tap the arena to play again.`);
        playTone('complete');
      } else {
        arena.setAttribute('aria-label', `Start round ${scores.length + 1} of ${preset.rounds}`);
        setResult(`${elapsed.toFixed(1)} seconds`, `You were ${difference.toFixed(1)} seconds ${direction}. Target: ${target}. Accuracy: ${accuracy}%.`);
        playTone(accuracy >= 90 ? 'good' : 'miss');
      }
      updateHud();
    }

    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) {
        setResult('Sound is not available here.', 'The game still works without audio.');
        return;
      }
      soundEnabled = !soundEnabled;
      soundButton.textContent = soundEnabled ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(soundEnabled));
      if (soundEnabled) {
        audioContext ||= new AudioEngine();
        audioContext.resume();
        playTone('good');
      }
    }

    function playTone(kind) {
      if (!soundEnabled || !audioContext) return;
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = kind === 'miss' ? 'triangle' : 'sine';
      const frequency = kind === 'start' ? 420 : kind === 'good' ? 720 : kind === 'complete' ? 880 : 250;
      oscillator.frequency.setValueAtTime(frequency, now);
      if (kind === 'good' || kind === 'complete') oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.32, now + 0.16);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.075, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.24);
    }

    function draw(time) {
      const bounds = arena.getBoundingClientRect();
      const width = Math.max(1, Math.floor(bounds.width));
      const height = Math.max(1, Math.floor(bounds.height));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const background = context.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, '#15352b');
      background.addColorStop(0.56, '#0b1f18');
      background.addColorStop(1, '#06100c');
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      for (const star of stars) {
        const shimmer = reducedMotion ? 0.5 : 0.32 + Math.sin(time * 0.0014 + star.phase) * 0.2;
        context.fillStyle = `rgba(191, 231, 209, ${shimmer})`;
        context.beginPath();
        context.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        context.fill();
      }

      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const radiusX = width * 0.31;
      const radiusY = height * 0.27;
      context.strokeStyle = 'rgba(191, 231, 209, 0.15)';
      context.lineWidth = 1;
      context.beginPath();
      context.ellipse(centerX, centerY, radiusX, radiusY, -0.2, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.ellipse(centerX, centerY, radiusX * 0.68, radiusY * 1.35, 0.75, 0, Math.PI * 2);
      context.stroke();

      const motion = reducedMotion ? 0.6 : time * (started ? 0.0012 : 0.0003);
      const wobble = Math.sin(motion * 0.73) * 0.42;
      const sparkX = centerX + Math.cos(motion + wobble) * radiusX;
      const sparkY = centerY + Math.sin(motion * 1.17) * radiusY;

      if (!reducedMotion) {
        for (let index = 11; index >= 1; index -= 1) {
          const trailTime = motion - index * 0.065;
          const trailX = centerX + Math.cos(trailTime + Math.sin(trailTime * 0.73) * 0.42) * radiusX;
          const trailY = centerY + Math.sin(trailTime * 1.17) * radiusY;
          context.fillStyle = `rgba(255, 111, 74, ${0.25 * (1 - index / 12)})`;
          context.beginPath();
          context.arc(trailX, trailY, Math.max(1, 5.2 - index * 0.32), 0, Math.PI * 2);
          context.fill();
        }
      }

      const glow = context.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, started ? 32 : 26);
      glow.addColorStop(0, 'rgba(255, 242, 189, 0.98)');
      glow.addColorStop(0.25, 'rgba(255, 111, 74, 0.82)');
      glow.addColorStop(1, 'rgba(255, 111, 74, 0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(sparkX, sparkY, started ? 32 : 26, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = '#fff2bd';
      context.beginPath();
      context.arc(sparkX, sparkY, started ? 6.8 : 5.2, 0, Math.PI * 2);
      context.fill();

      const pipCount = preset.rounds;
      const pipGap = 14;
      const pipStart = centerX - ((pipCount - 1) * pipGap) / 2;
      for (let index = 0; index < pipCount; index += 1) {
        context.fillStyle = index < scores.length ? '#bfe7d1' : 'rgba(255,255,255,.18)';
        context.beginPath();
        context.arc(pipStart + index * pipGap, height - 20, 3.5, 0, Math.PI * 2);
        context.fill();
      }
    }

    function animate(time) {
      if (disposed || reducedMotion || !canvas.isConnected || !dialog.open) return;
      draw(time);
      animationFrame = requestAnimationFrame(animate);
    }

    function cleanup() {
      disposed = true;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
    }
  };
})();
