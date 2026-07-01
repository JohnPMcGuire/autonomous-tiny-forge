(() => {
  const styleId = 'fair-choice-styles';
  const TAU = Math.PI * 2;
  const palette = ['#ff6f4a', '#bfe7d1', '#f2c66d', '#7fb7a3', '#f59a7f', '#d5e6b5', '#8da7d9', '#e2a8c2'];

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .fair-game { max-width: 900px; gap: 16px; }
      .fair-intro { display: flex; justify-content: space-between; gap: 16px; align-items: end; }
      .fair-intro p { max-width: 620px; }
      .fair-status { flex: 0 0 auto; color: var(--accent-dark); font-size: .72rem; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; }
      .fair-layout { display: grid; grid-template-columns: minmax(230px, .82fr) minmax(310px, 1.18fr); gap: 22px; align-items: center; }
      .fair-controls { display: grid; gap: 14px; }
      .fair-controls textarea { min-height: 168px; }
      .fair-note { color: var(--muted); font-size: .82rem; line-height: 1.45; }
      .fair-mode-row { display: flex; flex-wrap: wrap; gap: 8px; }
      .fair-mode { border: 1px solid var(--line); border-radius: 999px; padding: 9px 12px; background: white; color: var(--ink); font-weight: 850; cursor: pointer; }
      .fair-mode[aria-pressed="true"] { border-color: var(--accent); background: var(--mint); }
      .fair-round-panel { display: grid; gap: 10px; border: 1px solid var(--line); border-radius: 18px; padding: 12px; background: white; }
      .fair-round-panel label { color: var(--muted); font-size: .72rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
      .fair-round-panel input { width: 100%; accent-color: var(--accent); }
      .fair-wheel-shell { position: relative; width: min(100%, 430px); aspect-ratio: 1; margin-inline: auto; }
      .fair-pointer { position: absolute; z-index: 3; left: 50%; top: -2px; width: 0; height: 0; border-left: 18px solid transparent; border-right: 18px solid transparent; border-top: 34px solid #fff2bd; filter: drop-shadow(0 6px 5px rgba(0,0,0,.28)); transform: translateX(-50%); pointer-events: none; }
      .fair-wheel-button { position: absolute; inset: 14px; overflow: hidden; border: 2px solid rgba(255,255,255,.16); border-radius: 50%; padding: 0; background: #0b1d17; cursor: pointer; touch-action: manipulation; box-shadow: inset 0 0 0 8px rgba(255,255,255,.04), 0 18px 45px rgba(21,33,28,.18); }
      .fair-wheel-button:hover { transform: none; box-shadow: inset 0 0 0 8px rgba(255,255,255,.06), 0 22px 55px rgba(21,33,28,.24); }
      .fair-wheel-button:focus-visible { outline: 4px solid var(--accent); outline-offset: 5px; }
      .fair-wheel-button[aria-busy="true"] { cursor: wait; }
      .fair-wheel-button canvas { width: 100%; height: 100%; display: block; }
      .fair-hub { position: absolute; z-index: 2; left: 50%; top: 50%; width: 82px; height: 82px; border: 8px solid rgba(255,255,255,.16); border-radius: 50%; display: grid; place-items: center; transform: translate(-50%, -50%); background: #10241d; color: white; box-shadow: 0 8px 24px rgba(0,0,0,.28); font-weight: 900; font-size: .72rem; letter-spacing: .08em; text-align: center; text-transform: uppercase; pointer-events: none; }
      .fair-result { min-height: 112px; padding: 20px 22px; }
      .fair-result strong { font-size: clamp(1.25rem, 3.7vw, 2.1rem); }
      .fair-history, .fair-rounds { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-height: 32px; }
      .fair-history-label { color: var(--muted); font-size: .72rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
      .fair-history-chip, .fair-round-chip { border: 1px solid var(--line); border-radius: 999px; padding: 6px 10px; background: white; font-size: .78rem; font-weight: 800; }
      .fair-round-chip.is-complete { background: var(--mint); border-color: transparent; }
      .fair-scoreboard { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
      .fair-stat { border: 1px solid var(--line); border-radius: 15px; padding: 10px; background: white; }
      .fair-stat span { display: block; color: var(--muted); font-size: .62rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      .fair-stat strong { display: block; margin-top: 4px; font-size: 1rem; }
      @media (max-width: 700px) {
        .fair-layout { grid-template-columns: 1fr; }
        .fair-wheel-shell { order: -1; width: min(100%, 360px); }
        .fair-controls textarea { min-height: 124px; }
        .fair-intro { align-items: start; flex-direction: column; gap: 5px; }
        .fair-scoreboard { grid-template-columns: repeat(2, 1fr); }
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
    let activeItems = [];
    let mode = 'single';
    let groupSize = 4;
    let angle = -Math.PI / 2;
    let animationId = 0;
    let spinning = false;
    let spinCount = 0;
    let lastSegment = -1;
    let soundEnabled = false;
    let audioContext;
    let resizeObserver;
    let winToneTimer = 0;
    let disposed = false;
    const round = { number: 1, picks: [], completed: [] };

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

    const modeRow = document.createElement('div');
    modeRow.className = 'fair-mode-row';
    const singleMode = modeButton('One pick', 'single');
    const groupMode = modeButton('Group rounds', 'group');
    modeRow.append(singleMode, groupMode);

    const field = document.createElement('div');
    field.className = 'field';
    const label = document.createElement('label');
    label.htmlFor = 'picker-items';
    label.textContent = 'People or choices, one per line';
    const textarea = document.createElement('textarea');
    textarea.id = 'picker-items';
    textarea.maxLength = 600;
    textarea.placeholder = 'Alex\nBailey\nCasey\nDrew\nEllis\nFinley';
    const note = document.createElement('span');
    note.className = 'fair-note';
    note.textContent = 'Up to 12 unique choices. Duplicate lines are ignored so they cannot gain extra weight.';
    field.append(label, textarea, note);

    const roundPanel = document.createElement('div');
    roundPanel.className = 'fair-round-panel';
    const roundLabel = document.createElement('label');
    roundLabel.htmlFor = 'fair-group-size';
    const groupSlider = document.createElement('input');
    groupSlider.id = 'fair-group-size';
    groupSlider.type = 'range';
    groupSlider.min = '2';
    groupSlider.max = '6';
    groupSlider.value = String(groupSize);
    groupSlider.addEventListener('input', () => {
      groupSize = Number(groupSlider.value);
      resetRounds(false);
      drawWheel();
    });
    roundPanel.append(roundLabel, groupSlider);

    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const spinButton = makeButton('Spin fairly', spin);
    const resetRoundsButton = makeButton('Reset rounds', () => resetRounds(true), true);
    const clearButton = makeButton('Clear history', clearHistory, true);
    const soundButton = makeButton('Sound off', toggleSound, true);
    soundButton.setAttribute('aria-pressed', 'false');
    actions.append(spinButton, resetRoundsButton, clearButton, soundButton);
    controls.append(modeRow, field, roundPanel, actions);

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

    const scoreboard = document.createElement('div');
    scoreboard.className = 'fair-scoreboard';
    const result = resultCard();
    result.classList.add('fair-result');
    const rounds = document.createElement('div');
    rounds.className = 'fair-rounds';
    const history = document.createElement('div');
    history.className = 'fair-history';
    root.append(intro, layout, scoreboard, result, rounds, history);

    const context = canvas.getContext('2d');
    textarea.addEventListener('input', syncItems);
    wheelButton.addEventListener('click', spin);
    dialog.addEventListener('close', cleanup, { once: true });
    setResult('Build the wheel.', 'Add two or more choices, then tap the wheel or press Space or Enter.');
    updateMode();
    syncItems();

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        if (!disposed) drawWheel();
      });
      resizeObserver.observe(wheelButton);
    }

    function modeButton(text, value) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fair-mode';
      button.textContent = text;
      button.setAttribute('aria-pressed', String(mode === value));
      button.addEventListener('click', () => {
        if (spinning || disposed || mode === value) return;
        mode = value;
        resetRounds(false);
        updateMode();
        syncItems();
      });
      return button;
    }

    function updateMode() {
      singleMode.setAttribute('aria-pressed', String(mode === 'single'));
      groupMode.setAttribute('aria-pressed', String(mode === 'group'));
      roundPanel.hidden = mode !== 'group';
      resetRoundsButton.hidden = mode !== 'group';
      spinButton.textContent = mode === 'group' ? 'Spin next seat' : 'Spin fairly';
      updateRoundPanel();
      updateScoreboard();
      updateHistory();
    }

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
      if (disposed || spinning) return;
      items = parseItems();
      const picked = new Set(round.picks.map((item) => item.toLocaleLowerCase()));
      activeItems = mode === 'group'
        ? items.filter((item) => !picked.has(item.toLocaleLowerCase()))
        : items.slice();
      status.textContent = statusLabel();
      wheelButton.setAttribute('aria-label', items.length >= 2
        ? mode === 'group'
          ? `Spin the next group seat from ${activeItems.length || items.length} available choices`
          : `Spin the fairness wheel with ${items.length} choices`
        : 'Add at least two choices to spin the fairness wheel');
      updateRoundPanel();
      updateScoreboard();
      updateHistory();
      drawWheel();
    }

    function statusLabel() {
      if (!items.length) return 'Add choices';
      if (mode === 'single') return `${items.length} unique choice${items.length === 1 ? '' : 's'}`;
      return `Round ${round.number} · ${round.picks.length}/${Math.min(groupSize, items.length)} seated`;
    }

    function weightedPick(pool) {
      const weighted = pool.flatMap((item) => {
        const recentCount = state.recentPicks.filter((pick) => pick.toLocaleLowerCase() === item.toLocaleLowerCase()).length;
        const roundPenalty = round.picks.some((pick) => pick.toLocaleLowerCase() === item.toLocaleLowerCase()) ? 2 : 0;
        return Array(Math.max(1, 5 - recentCount - roundPenalty)).fill(item);
      });
      return weighted[Math.floor(Math.random() * weighted.length)];
    }

    function spin() {
      if (disposed || spinning) return;
      syncItems();
      if (items.length < 2) {
        setResult('Two unique choices needed.', 'Add another line before spinning. Duplicate names count only once.');
        textarea.focus();
        return;
      }
      const pool = mode === 'group' ? activeItems : items;
      if (pool.length < 1) {
        setResult('Round complete.', 'Reset rounds or add more names to build another group.');
        return;
      }

      const winner = weightedPick(pool);
      const winnerIndex = pool.indexOf(winner);
      const segmentSize = TAU / pool.length;
      const targetBase = -Math.PI / 2 - (winnerIndex + 0.5) * segmentSize;
      let targetAngle = targetBase;
      while (targetAngle <= angle) targetAngle += TAU;
      targetAngle += TAU * (5 + Math.floor(Math.random() * 3));

      spinning = true;
      lastSegment = currentSegment();
      textarea.disabled = true;
      spinButton.disabled = true;
      clearButton.disabled = true;
      resetRoundsButton.disabled = true;
      groupSlider.disabled = true;
      wheelButton.setAttribute('aria-busy', 'true');
      wheelButton.setAttribute('aria-label', 'Fairness wheel spinning');
      hub.textContent = 'Wait';
      setResult('Wheel in motion…', mode === 'group'
        ? 'The next seat is being selected without repeating anyone already seated in this round.'
        : 'The winner was chosen with a recent-selection fairness adjustment.');
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
        if (disposed || !canvas.isConnected || !dialog.open) {
          cancelSpin();
          return;
        }
        const progress = Math.min(1, (time - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 5);
        angle = startAngle + (targetAngle - startAngle) * eased;
        drawWheel();
        tickIfNeeded();
        if (progress < 1) {
          animationId = requestAnimationFrame(animate);
        } else {
          finishSpin(winner);
        }
      };
      animationId = requestAnimationFrame(animate);
    }

    function setSpinControls(enabled) {
      textarea.disabled = !enabled;
      spinButton.disabled = !enabled;
      clearButton.disabled = !enabled;
      resetRoundsButton.disabled = !enabled;
      groupSlider.disabled = !enabled;
      if (enabled) wheelButton.removeAttribute('aria-busy');
    }

    function cancelSpin() {
      if (!spinning) return;
      spinning = false;
      setSpinControls(true);
      hub.textContent = 'Spin';
    }

    function finishSpin(winner) {
      if (disposed) return;
      spinning = false;
      setSpinControls(true);
      wheelButton.setAttribute('aria-label', `Winner: ${winner}. Spin again`);
      hub.textContent = 'Again';
      spinCount += 1;
      state.recentPicks = [winner, ...state.recentPicks].slice(0, 12);
      if (mode === 'group') {
        round.picks.push(winner);
        const target = Math.min(groupSize, items.length);
        const full = round.picks.length >= target;
        setResult(
          full ? `Round ${round.number} filled.` : `${winner} gets the next seat.`,
          full ? `${round.picks.join(', ')} are grouped. Start another round or reset.` : `${target - round.picks.length} seat${target - round.picks.length === 1 ? '' : 's'} left in this round.`
        );
        if (full) finishGroupRound();
      } else {
        setResult(winner, 'Chosen fairly. Recent winners become temporarily less likely to repeat.');
      }
      status.textContent = statusLabel();
      updateRoundPanel();
      updateScoreboard();
      updateHistory();
      playWinTone();
      syncItems();
      drawWheel();
    }

    function finishGroupRound() {
      if (!round.picks.length) return;
      round.completed.unshift({ number: round.number, picks: round.picks.slice() });
      round.completed = round.completed.slice(0, 5);
      round.number += 1;
      round.picks = [];
    }

    function resetRounds(announce) {
      if (disposed || spinning) return;
      round.number = 1;
      round.picks = [];
      round.completed = [];
      if (announce) setResult('Group rounds reset.', 'Everyone is available for the next round.');
      syncItems();
    }

    function clearHistory() {
      if (disposed || spinning) return;
      state.recentPicks = [];
      spinCount = 0;
      status.textContent = statusLabel();
      setResult('History cleared.', 'Every current choice now starts with equal weight.');
      updateScoreboard();
      updateHistory();
      drawWheel();
    }

    function updateRoundPanel() {
      roundLabel.textContent = `Seats per group: ${groupSize}`;
      roundPanel.querySelector('.fair-note')?.remove();
      if (mode !== 'group') return;
      const helper = document.createElement('span');
      helper.className = 'fair-note';
      helper.textContent = `${Math.min(groupSize, items.length || groupSize)} seats fill the current group. Winners cannot repeat inside the same round.`;
      roundPanel.append(helper);
    }

    function updateScoreboard() {
      scoreboard.replaceChildren(
        stat('Mode', mode === 'group' ? 'Rounds' : 'Single'),
        stat('Choices', String(items.length)),
        stat('Spins', String(spinCount)),
        stat('Groups', String(round.completed.length))
      );
    }

    function stat(labelText, valueText) {
      const box = document.createElement('div');
      box.className = 'fair-stat';
      const span = document.createElement('span');
      span.textContent = labelText;
      const strong = document.createElement('strong');
      strong.textContent = valueText;
      box.append(span, strong);
      return box;
    }

    function updateHistory() {
      rounds.replaceChildren();
      if (mode === 'group') {
        const labelElement = document.createElement('span');
        labelElement.className = 'fair-history-label';
        labelElement.textContent = 'Current round';
        rounds.append(labelElement);
        const current = round.picks.length ? round.picks : ['No seats yet'];
        current.forEach((item) => {
          const chip = document.createElement('span');
          chip.className = 'fair-round-chip';
          chip.textContent = item;
          rounds.append(chip);
        });
        round.completed.slice(0, 3).forEach((group) => {
          const chip = document.createElement('span');
          chip.className = 'fair-round-chip is-complete';
          chip.textContent = `R${group.number}: ${group.picks.join(', ')}`;
          rounds.append(chip);
        });
      }

      history.replaceChildren();
      const labelElement = document.createElement('span');
      labelElement.className = 'fair-history-label';
      labelElement.textContent = 'Recent winners';
      history.append(labelElement);
      const visible = state.recentPicks.slice(0, 6);
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
      if (disposed) return;
      result.replaceChildren();
      const strong = document.createElement('strong');
      strong.textContent = headline;
      const small = document.createElement('small');
      small.textContent = detail;
      result.append(strong, small);
    }

    function currentSegment() {
      const pool = mode === 'group' ? activeItems : items;
      if (!pool.length) return -1;
      const segmentSize = TAU / pool.length;
      const position = ((-Math.PI / 2 - angle) % TAU + TAU) % TAU;
      return Math.floor(position / segmentSize) % pool.length;
    }

    function tickIfNeeded() {
      const segment = currentSegment();
      if (segment !== lastSegment) {
        lastSegment = segment;
        playTick();
      }
    }

    function drawWheel() {
      if (disposed) return;
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
      const pool = mode === 'group' ? activeItems : items;

      context.fillStyle = '#0b1d17';
      context.fillRect(0, 0, size, size);

      if (pool.length < 2 && items.length < 2) {
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

      const drawPool = pool.length ? pool : items;
      const segmentSize = TAU / drawPool.length;
      drawPool.forEach((item, index) => {
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
        const itemLabel = item.length > 16 ? `${item.slice(0, 15)}…` : item;
        context.fillText(itemLabel, (isLeft ? -1 : 1) * (radius - size * 0.05), 0, radius * 0.72);
        context.restore();
      });

      if (mode === 'group' && round.picks.length) {
        context.fillStyle = 'rgba(255,242,189,.12)';
        context.beginPath();
        context.arc(center, center, radius * 0.72, 0, TAU);
        context.fill();
      }

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
      if (disposed || !soundEnabled || !audioContext || !dialog.open) return;
      playTone(520, 0.055, 0.16, 'sine');
      window.clearTimeout(winToneTimer);
      winToneTimer = window.setTimeout(() => playTone(780, 0.06, 0.2, 'sine'), 90);
    }

    function playTone(frequency, volume, duration, type) {
      if (disposed || !soundEnabled || !audioContext || !dialog.open) return;
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

    function cleanup() {
      disposed = true;
      cancelAnimationFrame(animationId);
      window.clearTimeout(winToneTimer);
      resizeObserver?.disconnect();
      spinning = false;
      soundEnabled = false;
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
    }
  };
})();