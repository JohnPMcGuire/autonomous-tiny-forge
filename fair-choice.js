(() => {
  const styleId = 'fair-choice-styles';
  const TAU = Math.PI * 2;
  const palette = ['#ff6f4a', '#bfe7d1', '#f2c66d', '#7fb7a3', '#f59a7f', '#d5e6b5', '#8da7d9', '#e2a8c2'];

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .fair-game { max-width: 820px; gap: 16px; }
      .fair-intro { display: flex; justify-content: space-between; gap: 16px; align-items: end; }
      .fair-intro p { max-width: 590px; }
      .fair-status { flex: 0 0 auto; color: var(--accent-dark); font-size: .72rem; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; }
      .fair-layout { display: grid; grid-template-columns: minmax(210px, .75fr) minmax(300px, 1.25fr); gap: 22px; align-items: center; }
      .fair-controls { display: grid; gap: 14px; }
      .fair-controls textarea { min-height: 180px; }
      .fair-note { color: var(--muted); font-size: .82rem; line-height: 1.45; }
      .fair-wheel-shell { position: relative; width: min(100%, 430px); aspect-ratio: 1; margin-inline: auto; }
      .fair-pointer { position: absolute; z-index: 3; left: 50%; top: -2px; width: 0; height: 0; border-left: 18px solid transparent; border-right: 18px solid transparent; border-top: 34px solid #fff2bd; filter: drop-shadow(0 6px 5px rgba(0,0,0,.28)); transform: translateX(-50%); pointer-events: none; }
      .fair-wheel-button { position: absolute; inset: 14px; overflow: hidden; border: 2px solid rgba(255,255,255,.16); border-radius: 50%; padding: 0; background: #0b1d17; cursor: pointer; touch-action: manipulation; box-shadow: inset 0 0 0 8px rgba(255,255,255,.04), 0 18px 45px rgba(21,33,28,.18); }
      .fair-wheel-button:hover { transform: none; box-shadow: inset 0 0 0 8px rgba(255,255,255,.06), 0 22px 55px rgba(21,33,28,.24); }
      .fair-wheel-button:focus-visible { outline: 4px solid var(--accent); outline-offset: 5px; }
      .fair-wheel-button[aria-busy="true"] { cursor: wait; }
      .fair-wheel-button canvas { width: 100%; height: 100%; display: block; }
      .fair-hub { position: absolute; z-index: 2; left: 50%; top: 50%; width: 82px; height: 82px; border: 8px solid rgba(255,255,255,.16); border-radius: 50%; display: grid; place-items: center; transform: translate(-50%, -50%); background: #10241d; color: white; box-shadow: 0 8px 24px rgba(0,0,0,.28); font-weight: 900; font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; pointer-events: none; }
      .fair-result { min-height: 106px; padding: 20px 22px; }
      .fair-result strong { font-size: clamp(1.25rem, 3.7vw, 2.1rem); }
      .fair-history { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-height: 32px; }
      .fair-history-label { color: var(--muted); font-size: .72rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
      .fair-history-chip { border: 1px solid var(--line); border-radius: 999px; padding: 6px 10px; background: white; font-size: .78rem; font-weight: 800; }
      @media (max-width: 700px) {
        .fair-layout { grid-template-columns: 1fr; }
        .fair-wheel-shell { order: -1; width: min(100%, 360px); }
        .fair-controls textarea { min-height: 132px; }
        .fair-intro { align-items: start; flex-direction: column; gap: 5px; }
      }
      @media (max-width: 420px) {
        .fair-wheel-button { inset: 10px; }
        .fair-pointer { border-left-width: 15px; border-right-width: 15px; border-top-width: 28px; }
        .fair-hub { width: 70px; height: 70px; border-width: 6px; }
      }
    `;
    document.head.append(styles);
  }

  renderFairPicker = function renderFairPickerEnhanced(app) {
    installStyles();

    const root = panel('');
    root.classList.add('fair-game');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let items = [];
    let angle = -Math.PI / 2;
    let animationId = 0;
    let spinning = false;
    let spinCount = 0;
    let lastSegment = -1;
    let soundEnabled = false;
    let audioContext;

    const intro = document.createElement('div');
    intro.className = 'fair-intro';
    const introText = document.createElement('p');
    introText.textContent = app.config.instructions;
    const status = document.createElement('span');
    status.className = 'fair-status';
    status.textContent = 'Add choices';
    intro.append(introText, status);

    const layout = document.createElement('div');
    layout.className = 'fair-layout';

    const controls = document.createElement('div');
    controls.className = 'fair-controls';
    const field = document.createElement('div');
    field.className = 'field';
    const label = document.createElement('label');
    label.htmlFor = 'picker-items';
    label.textContent = 'People or choices, one per line';
    const textarea = document.createElement('textarea');
    textarea.id = 'picker-items';
    textarea.maxLength = 600;
    textarea.placeholder = 'Alex\nBailey\nCasey\nDrew';
    const note = document.createElement('span');
    note.className = 'fair-note';
    note.textContent = 'Up to 12 unique choices. Duplicate lines are ignored so they cannot gain extra weight.';
    field.append(label, textarea, note);

    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const spinButton = makeButton('Spin fairly', spin);
    const clearButton = makeButton('Clear history', clearHistory, true);
    const soundButton = makeButton('Sound off', toggleSound, true);
    soundButton.setAttribute('aria-pressed', 'false');
    actions.append(spinButton, clearButton, soundButton);
    controls.append(field, actions);

    const wheelShell = document.createElement('div');
    wheelShell.className = 'fair-wheel-shell';
    const pointer = document.createElement('span');
    pointer.className = 'fair-pointer';
    pointer.setAttribute('aria-hidden', 'true');
    const wheelButton = document.createElement('button');
    wheelButton.type = 'button';
    wheelButton.className = 'fair-wheel-button';
    wheelButton.setAttribute('aria-label', 'Add at least two choices to spin the fairness wheel');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const hub = document.createElement('span');
    hub.className = 'fair-hub';
    hub.textContent = 'Spin';
    wheelButton.append(canvas, hub);
    wheelShell.append(wheelButton, pointer);

    layout.append(controls, wheelShell);

    const result = resultCard();
    result.classList.add('fair-result');
    const history = document.createElement('div');
    history.className = 'fair-history';
    root.append(intro, layout, result, history);

    const context = canvas.getContext('2d');
    textarea.addEventListener('input', syncItems);
    wheelButton.addEventListener('click', spin);
    setResult('Build the wheel.', 'Add two or more choices, then tap the wheel or press Space or Enter.');
    updateHistory();
    syncItems();

    function parseItems() {
      const seen = new Set();
      return textarea.value
        .split('\n')
        .map((item) => item.trim())
        .filter((item) => {
          const key = item.toLocaleLowerCase();
          if (!item || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 12);
    }

    function syncItems() {
      if (spinning) return;
      items = parseItems();
      status.textContent = items.length ? `${items.length} unique choice${items.length === 1 ? '' : 's'}` : 'Add choices';
      wheelButton.setAttribute('aria-label', items.length >= 2
        ? `Spin the fairness wheel with ${items.length} choices`
        : 'Add at least two choices to spin the fairness wheel');
      drawWheel();
    }

    function weightedPick() {
      const weighted = items.flatMap((item) => {
        const recentCount = state.recentPicks.filter((pick) => pick.toLocaleLowerCase() === item.toLocaleLowerCase()).length;
        return Array(Math.max(1, 4 - recentCount)).fill(item);
      });
      return weighted[Math.floor(Math.random() * weighted.length)];
    }

    function spin() {
      if (spinning) return;
      syncItems();
      if (items.length < 2) {
        setResult('Two unique choices needed.', 'Add another line before spinning. Duplicate names count only once.');
        textarea.focus();
        return;
      }

      const winner = weightedPick();
      const winnerIndex = items.indexOf(winner);
      const segmentSize = TAU / items.length;
      const targetBase = -Math.PI / 2 - (winnerIndex + 0.5) * segmentSize;
      let targetAngle = targetBase;
      while (targetAngle <= angle) targetAngle += TAU;
      targetAngle += TAU * (5 + Math.floor(Math.random() * 3));

      spinning = true;
      textarea.disabled = true;
      spinButton.disabled = true;
      clearButton.disabled = true;
      wheelButton.setAttribute('aria-busy', 'true');
      wheelButton.setAttribute('aria-label', 'Fairness wheel spinning');
      hub.textContent = 'Wait';
      setResult('Wheel in motion…', 'The winner was chosen with a recent-selection fairness adjustment.');
      playStartTone();

      if (reducedMotion) {
        angle = targetAngle;
        drawWheel();
        finishSpin(winner);
        return;
      }

      const startAngle = angle;
      const startTime = performance.now();
      const duration = 3300;
      const animate = (time) => {
        const progress = Math.min(1, (time - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 5);
        angle = startAngle + (targetAngle - startAngle) * eased;
        drawWheel();
        tickIfNeeded();
        if (progress < 1 && canvas.isConnected && dialog.open) {
          animationId = requestAnimationFrame(animate);
        } else {
          finishSpin(winner);
        }
      };
      animationId = requestAnimationFrame(animate);
    }

    function finishSpin(winner) {
      spinning = false;
      textarea.disabled = false;
      spinButton.disabled = false;
      clearButton.disabled = false;
      wheelButton.removeAttribute('aria-busy');
      wheelButton.setAttribute('aria-label', `Winner: ${winner}. Spin again`);
      hub.textContent = 'Again';
      spinCount += 1;
      state.recentPicks = [winner, ...state.recentPicks].slice(0, 8);
      status.textContent = `Spin ${spinCount}`;
      setResult(winner, 'Chosen fairly. Recent winners become temporarily less likely to repeat.');
      updateHistory();
      playWinTone();
      drawWheel();
    }

    function clearHistory() {
      if (spinning) return;
      state.recentPicks = [];
      spinCount = 0;
      status.textContent = items.length ? `${items.length} unique choice${items.length === 1 ? '' : 's'}` : 'Add choices';
      setResult('History cleared.', 'Every current choice now starts with equal weight.');
      updateHistory();
      drawWheel();
    }

    function updateHistory() {
      history.replaceChildren();
      const label = document.createElement('span');
      label.className = 'fair-history-label';
      label.textContent = 'Recent winners';
      history.append(label);
      const visible = state.recentPicks.slice(0, 5);
      if (!visible.length) {
        const empty = document.createElement('span');
        empty.className = 'fair-note';
        empty.textContent = 'None yet';
        history.append(empty);
        return;
      }
      visible.forEach((item) => {
        const chip = document.createElement('span');
        chip.className = 'fair-history-chip';
        chip.textContent = item;
        history.append(chip);
      });
    }

    function setResult(headline, detail) {
      result.replaceChildren();
      const strong = document.createElement('strong');
      strong.textContent = headline;
      const small = document.createElement('small');
      small.textContent = detail;
      result.append(strong, small);
    }

    function currentSegment() {
      if (!items.length) return -1;
      const segmentSize = TAU / items.length;
      const position = ((-Math.PI / 2 - angle) % TAU + TAU) % TAU;
      return Math.floor(position / segmentSize) % items.length;
    }

    function tickIfNeeded() {
      const segment = currentSegment();
      if (segment !== lastSegment) {
        lastSegment = segment;
        playTick();
      }
    }

    function drawWheel() {
      const bounds = wheelButton.getBoundingClientRect();
      const size = Math.max(1, Math.floor(Math.min(bounds.width, bounds.height)));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.floor(size * ratio) || canvas.height !== Math.floor(size * ratio)) {
        canvas.width = Math.floor(size * ratio);
        canvas.height = Math.floor(size * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, size, size);
      const center = size / 2;
      const radius = size * 0.47;

      context.fillStyle = '#0b1d17';
      context.fillRect(0, 0, size, size);

      if (items.length < 2) {
        context.strokeStyle = 'rgba(191,231,209,.28)';
        context.lineWidth = Math.max(2, size * 0.012);
        [0.24, 0.34, 0.44].forEach((scale) => {
          context.beginPath();
          context.arc(center, center, size * scale, 0, TAU);
          context.stroke();
        });
        context.fillStyle = 'rgba(255,255,255,.72)';
        context.font = `800 ${Math.max(14, size * 0.05)}px Inter, system-ui, sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('Add choices', center, center - size * 0.18);
        return;
      }

      const segmentSize = TAU / items.length;
      items.forEach((item, index) => {
        const start = angle + index * segmentSize;
        const end = start + segmentSize;
        context.beginPath();
        context.moveTo(center, center);
        context.arc(center, center, radius, start, end);
        context.closePath();
        context.fillStyle = palette[index % palette.length];
        context.fill();
        context.strokeStyle = 'rgba(11,29,23,.45)';
        context.lineWidth = Math.max(1, size * 0.006);
        context.stroke();

        const middle = start + segmentSize / 2;
        context.save();
        context.translate(center, center);
        context.rotate(middle);
        const isLeft = Math.cos(middle) < 0;
        if (isLeft) context.rotate(Math.PI);
        context.fillStyle = '#10211a';
        context.font = `900 ${Math.max(11, Math.min(17, size * 0.04))}px Inter, system-ui, sans-serif`;
        context.textAlign = isLeft ? 'left' : 'right';
        context.textBaseline = 'middle';
        const label = item.length > 16 ? `${item.slice(0, 15)}…` : item;
        context.fillText(label, (isLeft ? -1 : 1) * (radius - size * 0.05), 0, radius * 0.72);
        context.restore();
      });

      context.beginPath();
      context.arc(center, center, radius, 0, TAU);
      context.strokeStyle = 'rgba(255,255,255,.18)';
      context.lineWidth = Math.max(3, size * 0.012);
      context.stroke();
    }

    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) {
        setResult('Sound is unavailable.', 'The wheel still works with visual and text feedback.');
        return;
      }
      soundEnabled = !soundEnabled;
      soundButton.textContent = soundEnabled ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(soundEnabled));
      if (soundEnabled) {
        audioContext ||= new AudioEngine();
        audioContext.resume();
        playStartTone();
      }
    }

    function playTick() {
      playTone(720, 0.018, 0.018, 'square');
    }

    function playStartTone() {
      playTone(280, 0.05, 0.12, 'triangle');
    }

    function playWinTone() {
      if (!soundEnabled || !audioContext) return;
      playTone(520, 0.055, 0.16, 'sine');
      window.setTimeout(() => playTone(780, 0.06, 0.2, 'sine'), 90);
    }

    function playTone(frequency, volume, duration, type) {
      if (!soundEnabled || !audioContext) return;
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(() => drawWheel()).observe(wheelButton);
    }

    dialog.addEventListener('close', () => {
      cancelAnimationFrame(animationId);
      spinning = false;
    }, { once: true });
  };
})();
