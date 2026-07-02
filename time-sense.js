(() => {
  const styleId = 'time-sense-enhanced-styles';

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .time-game { max-width: 840px; gap: 14px; }
      .time-picks { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .time-pick { position: relative; display: block; cursor: pointer; }
      .time-pick input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
      .time-pick span { min-height: 62px; display: grid; align-content: center; gap: 3px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 15px; background: white; transition: transform .16s ease, border-color .16s ease, background .16s ease; }
      .time-pick strong { font-size: .9rem; }
      .time-pick small { color: var(--muted); font-size: .72rem; line-height: 1.25; }
      .time-pick input:checked + span { border-color: var(--ink); background: var(--mint); box-shadow: inset 0 0 0 1px var(--ink); }
      .time-pick input:focus-visible + span { outline: 4px solid var(--accent); outline-offset: 3px; }
      .time-pick input:disabled + span { opacity: .58; cursor: not-allowed; }
      .time-pick:hover span { transform: translateY(-1px); border-color: rgba(21,33,28,.42); }
      .time-hud { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
      .time-stat { border: 1px solid var(--line); border-radius: 15px; padding: 10px 12px; background: white; }
      .time-stat span { display: block; color: var(--muted); font-size: .66rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
      .time-stat strong { display: block; margin-top: 4px; font-size: 1rem; }
      .time-ladder { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
      .time-stage { min-height: 7px; overflow: hidden; border-radius: 99px; background: rgba(21,33,28,.12); }
      .time-stage span { display: block; height: 100%; width: 0; background: var(--accent); transition: width .22s ease; }
      .time-stage.is-current span { width: 55%; }
      .time-stage.is-cleared span { width: 100%; background: var(--mint); }
      .time-arena { position: relative; width: 100%; min-height: 292px; overflow: hidden; border: 2px solid transparent; border-radius: 26px; padding: 0; background: #07110d; color: white; cursor: pointer; touch-action: manipulation; box-shadow: inset 0 0 0 1px rgba(255,255,255,.08), 0 18px 42px rgba(21,33,28,.16); }
      .time-arena:hover { transform: none; box-shadow: inset 0 0 0 1px rgba(255,255,255,.12), 0 22px 52px rgba(21,33,28,.22); }
      .time-arena:focus-visible { outline: 4px solid var(--accent); outline-offset: 4px; }
      .time-arena canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
      .time-arena-copy { position: relative; z-index: 1; min-height: 292px; display: grid; place-content: center; justify-items: center; gap: 8px; padding: 28px; text-align: center; pointer-events: none; background: radial-gradient(circle at center, rgba(7,17,13,.04), rgba(7,17,13,.64) 74%); }
      .time-arena-kicker { font-size: .69rem; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; color: var(--mint); }
      .time-arena strong { max-width: 610px; font-size: clamp(2rem, 7vw, 4.1rem); line-height: .95; letter-spacing: -.055em; text-wrap: balance; }
      .time-arena small { color: rgba(255,255,255,.74); font-size: .94rem; }
      .time-arena.is-running { border-color: var(--accent); }
      .time-arena.is-running .time-arena-kicker { color: #fff2bd; }
      .time-arena.is-complete { border-color: var(--mint); }
      .time-result { min-height: 108px; padding: 18px 21px; }
      .time-result strong { font-size: clamp(1.2rem, 3.5vw, 1.9rem); }
      .time-session-note { color: var(--muted); font-size: .78rem; line-height: 1.45; }
      @media (max-width: 700px) { .time-hud { grid-template-columns: repeat(2, 1fr); } .time-stat:last-child { grid-column: span 2; } .time-picks { grid-template-columns: 1fr; } .time-pick span { min-height: 54px; grid-template-columns: auto 1fr; align-items: center; column-gap: 10px; } .time-arena, .time-arena-copy { min-height: 246px; } }
      @media (prefers-reduced-motion: reduce) { .time-pick span, .time-stage span { transition: none; } }
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
    const modes = [
      { id: 'quick', label: 'Quick', detail: '3 rounds · 8–20 sec', rounds: 3, min: 8, max: 20, ladder: false },
      { id: 'classic', label: 'Classic', detail: '5 rounds · 15–40 sec', rounds: 5, min: 15, max: 40, ladder: false },
      { id: 'arcade', label: 'Arcade ladder', detail: '6 stages · risk and recovery', rounds: 6, min: 9, max: Math.min(configuredMax, 58), ladder: true }
    ];
    if (configuredRounds > 5) modes.splice(2, 0, { id: 'endurance', label: 'Endurance', detail: `${configuredRounds} rounds · ${configuredMin}–${configuredMax} sec`, rounds: configuredRounds, min: configuredMin, max: configuredMax, ladder: false });
    const risks = [
      { id: 'steady', label: 'Steady', detail: 'Safe score · may restore focus', multiplier: 1, focusCost: 0 },
      { id: 'surge', label: 'Surge', detail: 'Bigger score · costs 1 focus', multiplier: 1.45, focusCost: 1 },
      { id: 'blind', label: 'Blind', detail: 'High score · wider target range', multiplier: 1.85, focusCost: 2 }
    ];
    const stageNames = ['Warmup', 'Drift', 'Hold', 'Split', 'Long arc', 'Final pulse'];
    let mode = modes[0];
    let risk = risks[0];
    let started = 0;
    let target = 0;
    let scores = [];
    let complete = false;
    let sound = false;
    let audioContext;
    let frame = 0;
    let observer;
    let disposed = false;
    let focus = 3;
    let combo = 0;
    let shield = false;
    let points = 0;
    let bestStage = 0;

    const modeBox = pickGroup('Choose a session', 'time-sense-mode', modes, (item) => {
      mode = item;
      risk = risks[0];
      riskInputs.forEach((input) => { input.checked = input.value === risk.id; });
      reset(`${item.label} session ready.`, `${item.detail}. Tap the arena when you are ready.`);
    });
    const riskBox = pickGroup('Arcade risk', 'time-sense-risk', risks, (item) => { risk = item; update(); });
    const riskInputs = [...riskBox.querySelectorAll('input')];
    const allInputs = [...modeBox.querySelectorAll('input'), ...riskInputs];

    const hud = document.createElement('div');
    hud.className = 'time-hud';
    hud.innerHTML = '<div class="time-stat"><span>Mode</span><strong data-mode>Quick</strong></div><div class="time-stat"><span>Round</span><strong data-round>1 / 3</strong></div><div class="time-stat"><span>Average</span><strong data-average>—</strong></div><div class="time-stat"><span>Focus</span><strong data-focus>—</strong></div><div class="time-stat"><span>Score</span><strong data-score>0</strong></div>';

    const ladder = document.createElement('div');
    ladder.className = 'time-ladder';
    ladder.setAttribute('aria-label', 'Arcade ladder progress');
    ladder.setAttribute('role', 'list');
    stageNames.forEach((name) => {
      const step = document.createElement('span');
      step.className = 'time-stage';
      step.setAttribute('role', 'listitem');
      step.setAttribute('title', name);
      step.innerHTML = '<span></span>';
      ladder.append(step);
    });

    const arena = document.createElement('button');
    arena.className = 'time-arena';
    arena.type = 'button';
    arena.setAttribute('aria-label', 'Start the Quick hidden timer session');
    arena.innerHTML = '<canvas aria-hidden="true"></canvas><span class="time-arena-copy"><span class="time-arena-kicker">Tap, Space, or Enter</span><strong>Start round</strong><small>Watch the spark, not a clock.</small></span>';
    const canvas = arena.querySelector('canvas');
    const context = canvas.getContext('2d');
    const kicker = arena.querySelector('.time-arena-kicker');
    const headline = arena.querySelector('strong');
    const note = arena.querySelector('small');
    const result = resultCard();
    result.classList.add('time-result');

    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const soundButton = makeButton('Sound off', toggleSound, true);
    soundButton.setAttribute('aria-pressed', 'false');
    const resetButton = makeButton('Reset score', () => reset('Score reset.', 'Tap the arena when you are ready for round one.'), true);
    const shieldButton = makeButton('Use shield', useShield, true);
    actions.append(soundButton, resetButton, shieldButton);
    const explainer = document.createElement('p');
    explainer.className = 'time-session-note';
    explainer.textContent = 'Arcade ladder adds risk choices, focus, combo scoring, a one-use recovery shield, and a six-stage challenge curve. Changing mode resets the current score.';
    root.append(modeBox, riskBox, hud, ladder, arena, result, actions, explainer);

    const stars = Array.from({ length: 52 }, (_, index) => ({ x: ((index * 47) % 101) / 100, y: ((index * 71) % 97) / 96, size: 0.65 + (index % 4) * 0.42, phase: index * 0.73 }));
    arena.addEventListener('click', () => { if (started) stopRound(); else startRound(); });
    document.querySelector('#app-dialog')?.addEventListener('close', cleanup, { once: true });
    setResult('How accurate is your internal clock?', 'Arcade ladder rewards calculated risk with focus, combo points, and a recovery shield.');
    update();
    draw(performance.now());
    if (!reducedMotion) frame = requestAnimationFrame(animate);
    if ('ResizeObserver' in window) {
      observer = new ResizeObserver(() => draw(performance.now()));
      observer.observe(arena);
    }

    function pickGroup(legendText, name, items, onPick) {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'time-mode-fieldset';
      const legend = document.createElement('legend');
      legend.textContent = legendText;
      const row = document.createElement('div');
      row.className = 'time-picks';
      items.forEach((item, index) => {
        const label = document.createElement('label');
        label.className = 'time-pick';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = item.id;
        input.checked = index === 0;
        input.addEventListener('change', () => { if (input.checked) onPick(item); });
        const copy = document.createElement('span');
        copy.innerHTML = `<strong>${item.label}</strong><small>${item.detail}</small>`;
        label.append(input, copy);
        row.append(label);
      });
      fieldset.append(legend, row);
      return fieldset;
    }

    function setResult(head, detail) {
      result.replaceChildren();
      const strong = document.createElement('strong');
      strong.textContent = head;
      const small = document.createElement('small');
      small.textContent = detail;
      result.append(strong, small);
    }

    function setDisabled(disabled) {
      allInputs.forEach((input) => { input.disabled = disabled || (input.name === 'time-sense-risk' && !mode.ladder); });
    }

    function update() {
      hud.querySelector('[data-mode]').textContent = mode.label;
      hud.querySelector('[data-round]').textContent = `${complete ? mode.rounds : Math.min(scores.length + 1, mode.rounds)} / ${mode.rounds}`;
      hud.querySelector('[data-average]').textContent = scores.length ? `${Math.round(scores.reduce((sum, item) => sum + item.accuracy, 0) / scores.length)}%` : '—';
      hud.querySelector('[data-focus]').textContent = mode.ladder ? `${focus}${shield ? ' + shield' : ''}` : '—';
      hud.querySelector('[data-score]').textContent = String(points);
      riskBox.hidden = !mode.ladder;
      ladder.hidden = !mode.ladder;
      shieldButton.disabled = !mode.ladder || !shield || started || complete;
      ladder.querySelectorAll('.time-stage').forEach((step, index) => {
        step.classList.toggle('is-cleared', index < bestStage);
        step.classList.toggle('is-current', mode.ladder && !complete && index === scores.length);
      });
    }

    function reset(head = `${mode.label} session ready.`, detail = `${mode.detail}. Tap the arena when you are ready.`) {
      started = 0;
      target = 0;
      scores = [];
      complete = false;
      focus = mode.ladder ? 3 : 0;
      combo = 0;
      shield = false;
      points = 0;
      bestStage = 0;
      setDisabled(false);
      arena.classList.remove('is-running', 'is-complete');
      kicker.textContent = 'Tap, Space, or Enter';
      headline.textContent = 'Start round';
      note.textContent = 'Watch the spark, not a clock.';
      arena.setAttribute('aria-label', `Start the ${mode.label} hidden timer session`);
      setResult(head, detail);
      update();
      draw(performance.now());
    }

    function range() {
      if (!mode.ladder) return { min: mode.min, max: mode.max };
      const stage = scores.length;
      const min = mode.min + stage * 3 + (risk.id === 'blind' ? 5 : 0);
      const max = Math.min(mode.max + stage * 5 + (risk.id === 'blind' ? 9 : 0), 80);
      return { min, max: Math.max(min + 4, max) };
    }

    function startRound() {
      if (complete) reset();
      if (mode.ladder && focus < risk.focusCost) {
        setResult('Not enough focus for that risk.', 'Choose Steady or reset the ladder. Surge and Blind are powerful but expensive.');
        return;
      }
      if (mode.ladder) focus -= risk.focusCost;
      const limits = range();
      target = Math.floor(Math.random() * (limits.max - limits.min + 1)) + limits.min;
      started = performance.now();
      setDisabled(true);
      arena.classList.add('is-running');
      arena.classList.remove('is-complete');
      kicker.textContent = `${mode.ladder ? stageNames[scores.length] : `Round ${scores.length + 1}`} · ${scores.length + 1} of ${mode.rounds}`;
      headline.textContent = `Stop at ${target} seconds`;
      note.textContent = mode.ladder ? `${risk.label} risk · combo ${combo}` : 'The timer is hidden. Trust your sense of time.';
      arena.setAttribute('aria-label', `Stop the hidden timer at ${target} seconds`);
      setResult(`Target: ${target} seconds`, 'No countdown. Tap again when the moment feels right.');
      playTone('start');
      update();
    }

    function stopRound() {
      const elapsed = (performance.now() - started) / 1000;
      const difference = Math.abs(elapsed - target);
      const accuracy = Math.max(0, Math.round(100 - (difference / target) * 200));
      const cleared = difference <= (mode.ladder ? Math.max(1.2, target * 0.11 - scores.length * 0.13) : target * 0.18);
      let roundPoints = Math.max(0, Math.round((accuracy + target * 0.8) * (mode.ladder ? risk.multiplier : 1)));
      if (mode.ladder && cleared) {
        combo += 1;
        roundPoints += combo * 12;
        if (risk.id === 'steady' && accuracy >= 85) focus = Math.min(6, focus + 1);
        if (!shield && scores.length >= 2 && combo >= 2) shield = true;
        bestStage = Math.max(bestStage, scores.length + 1);
      } else if (mode.ladder) {
        combo = 0;
        roundPoints = Math.round(roundPoints * 0.35);
        focus = Math.max(0, focus - 1);
      }
      points += roundPoints;
      scores.push({ accuracy, difference, elapsed, target, cleared, points: roundPoints });
      const final = scores.length >= mode.rounds || (mode.ladder && !cleared && !shield && focus <= 0);
      started = 0;
      setDisabled(false);
      arena.classList.remove('is-running');
      kicker.textContent = `${mode.label} · ${scores.length} of ${mode.rounds}`;
      headline.textContent = final ? 'See final score' : 'Start next round';
      note.textContent = `${elapsed.toFixed(1)} seconds · ${accuracy}% accuracy · ${roundPoints} points`;
      if (final) {
        complete = true;
        arena.classList.add('is-complete');
        const average = Math.round(scores.reduce((sum, item) => sum + item.accuracy, 0) / scores.length);
        const closest = scores.reduce((best, item) => item.difference < best.difference ? item : best);
        headline.textContent = 'Play another set';
        note.textContent = `Score ${points} · average ${average}% · best miss ${closest.difference.toFixed(1)}s`;
        arena.setAttribute('aria-label', `Start another ${mode.label} session`);
        setResult(`${points} point session`, `${mode.ladder ? `Cleared ${bestStage} of ${mode.rounds} stages. ` : ''}Closest round: ${closest.difference.toFixed(1)} seconds off.`);
        playTone('complete');
      } else {
        const direction = elapsed < target ? 'early' : 'late';
        arena.setAttribute('aria-label', `Start round ${scores.length + 1} of ${mode.rounds}`);
        setResult(`${elapsed.toFixed(1)} seconds`, `${mode.ladder ? (cleared ? 'Stage cleared. ' : 'Stage missed. Spend the shield or recover with a safer risk. ') : ''}You were ${difference.toFixed(1)} seconds ${direction}. Target: ${target}. Accuracy: ${accuracy}%.`);
        playTone(cleared || accuracy >= 90 ? 'good' : 'miss');
      }
      update();
    }

    function useShield() {
      if (!shield || !mode.ladder || started || complete) return;
      const last = scores[scores.length - 1];
      shield = false;
      focus = Math.min(6, focus + 1);
      if (last && !last.cleared) {
        scores.pop();
        points = Math.max(0, points - last.points);
      }
      setResult('Shield spent.', 'The last missed ladder stage was rewound and one focus returned. Choose the next risk carefully.');
      update();
    }

    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) {
        setResult('Sound is not available here.', 'The game still works without audio.');
        return;
      }
      sound = !sound;
      soundButton.textContent = sound ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(sound));
      if (sound) {
        audioContext ||= new AudioEngine();
        audioContext.resume();
        playTone('good');
      }
    }

    function playTone(kind) {
      if (!sound || !audioContext) return;
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
      const radiusX = width * (mode.ladder ? 0.34 : 0.31);
      const radiusY = height * (mode.ladder ? 0.23 : 0.27);
      context.strokeStyle = 'rgba(191, 231, 209, 0.15)';
      context.lineWidth = 1;
      context.beginPath();
      context.ellipse(centerX, centerY, radiusX, radiusY, -0.2, 0, Math.PI * 2);
      context.stroke();
      const motion = reducedMotion ? 0.6 : time * (started ? 0.0012 + scores.length * 0.00008 : 0.0003);
      const sparkX = centerX + Math.cos(motion + Math.sin(motion * 0.73) * 0.42) * radiusX;
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
      if (mode.ladder) {
        context.strokeStyle = 'rgba(255, 242, 189, 0.72)';
        context.lineWidth = 7;
        context.beginPath();
        context.arc(centerX, centerY, Math.min(radiusX, radiusY) * 0.72, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (scores.length / mode.rounds));
        context.stroke();
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
      const pipStart = centerX - ((mode.rounds - 1) * 14) / 2;
      for (let index = 0; index < mode.rounds; index += 1) {
        context.fillStyle = index < scores.length ? '#bfe7d1' : 'rgba(255,255,255,.18)';
        context.beginPath();
        context.arc(pipStart + index * 14, height - 20, 3.5, 0, Math.PI * 2);
        context.fill();
      }
    }

    function animate(time) {
      if (disposed || reducedMotion || !canvas.isConnected || !document.querySelector('#app-dialog')?.open) return;
      draw(time);
      frame = requestAnimationFrame(animate);
    }

    function cleanup() {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
    }
  };
})();
