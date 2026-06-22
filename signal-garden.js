(() => {
  const basePredictionRenderer = renderPredictionGame;
  const styleId = 'signal-garden-styles';
  const TAU = Math.PI * 2;
  const palette = ['#ff6f4a', '#bfe7d1', '#8da7d9', '#f2c66d'];

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .signal-game { max-width: 900px; gap: 16px; }
      .signal-intro { display: flex; justify-content: space-between; align-items: start; gap: 20px; }
      .signal-intro p { margin: 0; max-width: 650px; color: var(--muted); line-height: 1.55; }
      .signal-mode-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .signal-mode { min-height: 100px; border: 1px solid var(--line); border-radius: 18px; padding: 14px; background: white; text-align: left; cursor: pointer; }
      .signal-mode strong, .signal-mode small { display: block; }
      .signal-mode strong { font-size: 1rem; }
      .signal-mode small { margin-top: 7px; color: var(--muted); line-height: 1.35; }
      .signal-mode[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--accent) 38%, transparent); background: color-mix(in srgb, var(--accent) 7%, white); }
      .signal-mode:focus-visible, .signal-field:focus-visible, .signal-choice:focus-visible { outline: 4px solid var(--accent); outline-offset: 3px; }
      .signal-hud { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
      .signal-stat { border: 1px solid var(--line); border-radius: 14px; padding: 10px 12px; background: white; }
      .signal-stat span { display: block; color: var(--muted); font-size: .62rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
      .signal-stat strong { display: block; margin-top: 3px; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .signal-field { position: relative; min-height: 330px; overflow: hidden; border: 1px solid rgba(255,255,255,.12); border-radius: 24px; background: #07110d; touch-action: manipulation; cursor: crosshair; }
      .signal-field canvas { display: block; width: 100%; height: 330px; }
      .signal-field-help { position: absolute; left: 14px; bottom: 12px; border-radius: 999px; padding: 7px 10px; background: rgba(7,17,13,.78); color: rgba(255,255,255,.72); font-size: .72rem; font-weight: 800; pointer-events: none; }
      .signal-sequence-wrap { display: grid; gap: 7px; }
      .signal-sequence-label { color: var(--muted); font-size: .7rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
      .signal-sequence { display: flex; flex-wrap: wrap; gap: 7px; min-height: 42px; }
      .signal-chip { display: inline-flex; align-items: center; gap: 7px; min-height: 38px; border: 1px solid var(--line); border-radius: 999px; padding: 7px 11px; background: white; font-weight: 850; }
      .signal-chip::before { content: ""; width: 10px; height: 10px; border-radius: 50%; background: var(--chip-color); box-shadow: 0 0 0 4px color-mix(in srgb, var(--chip-color) 18%, transparent); }
      .signal-chip.is-question { border-style: dashed; color: var(--muted); }
      .signal-chip.is-question::before { background: transparent; box-shadow: inset 0 0 0 2px var(--muted); }
      .signal-choices { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; }
      .signal-choice { min-height: 64px; border: 1px solid var(--line); border-radius: 17px; background: white; cursor: pointer; font-weight: 900; display: grid; place-items: center; gap: 4px; padding: 10px; }
      .signal-choice span { width: 14px; height: 14px; border-radius: 50%; background: var(--choice-color); box-shadow: 0 0 0 5px color-mix(in srgb, var(--choice-color) 18%, transparent); }
      .signal-choice small { color: var(--muted); font-weight: 800; }
      .signal-choice.is-selected { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 8px 18px rgba(21,33,28,.12); }
      .signal-choice.is-correct { border-color: #4f9476; background: #edf8f2; }
      .signal-choice.is-wrong { border-color: #cc5a43; background: #fff1ed; }
      .signal-choice:disabled { cursor: not-allowed; opacity: .5; transform: none; }
      .signal-result { min-height: 94px; padding: 18px 20px; }
      .signal-result strong { font-size: clamp(1.15rem, 3.2vw, 1.75rem); }
      .signal-result small { line-height: 1.45; }
      .signal-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .signal-start { min-width: 150px; }
      @media (max-width: 700px) {
        .signal-intro { display: grid; }
        .signal-mode-row { grid-template-columns: 1fr; }
        .signal-mode { min-height: 0; }
        .signal-hud { grid-template-columns: repeat(3, 1fr); }
        .signal-field, .signal-field canvas { min-height: 280px; height: 280px; }
        .signal-choices { grid-template-columns: repeat(2, 1fr); }
      }
      @media (max-width: 420px) {
        .signal-hud { grid-template-columns: repeat(2, 1fr); }
        .signal-stat:last-child { grid-column: span 2; }
        .signal-field, .signal-field canvas { min-height: 245px; height: 245px; }
      }
    `;
    document.head.append(styles);
  }

  renderPredictionGame = function renderPredictionGameEnhanced(app) {
    if (app.id !== 'signal-garden') {
      basePredictionRenderer(app);
      return;
    }

    installStyles();

    const root = panel('');
    root.classList.add('signal-game');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stations = (app.config.options.length === 4 ? app.config.options : ['Ember', 'Moss', 'Tide', 'Dawn']).map((name, index) => ({ name, color: palette[index] }));
    const modes = {
      practice: { label: 'Practice', detail: 'Eight guided rounds, visible pattern names, no lives.' },
      rush: { label: 'Rush', detail: 'Score for 60 seconds. A miss costs three seconds.' },
      survival: { label: 'Survival', detail: 'Three lives, adaptive difficulty, and pattern unlocks.' }
    };

    let selectedMode = 'practice';
    let active = false;
    let disposed = false;
    let pausedAt = 0;
    let deadline = 0;
    let animationId = 0;
    let nextRoundTimer = 0;
    let clockTimer = 0;
    let audioContext;
    let soundEnabled = false;
    let round = 0;
    let score = 0;
    let streak = 0;
    let bestStreak = 0;
    let correct = 0;
    let attempts = 0;
    let lives = 3;
    let focus = 2;
    let level = 1;
    let currentRound;
    let roundStartedAt = 0;
    let selectedIndex = 0;
    let answered = false;
    let hintUsed = false;
    let recentResults = [];

    const intro = document.createElement('div');
    intro.className = 'signal-intro';
    const introText = document.createElement('p');
    introText.textContent = app.config.instructions;
    const soundButton = makeButton('Sound off', toggleSound, true);
    soundButton.setAttribute('aria-pressed', 'false');
    intro.append(introText, soundButton);

    const modeRow = document.createElement('div');
    modeRow.className = 'signal-mode-row';
    Object.entries(modes).forEach(([key, mode]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'signal-mode';
      button.dataset.mode = key;
      button.setAttribute('aria-pressed', String(key === selectedMode));
      const strong = document.createElement('strong');
      strong.textContent = mode.label;
      const small = document.createElement('small');
      small.textContent = mode.detail;
      button.append(strong, small);
      button.addEventListener('click', () => selectMode(key));
      modeRow.append(button);
    });

    const hud = document.createElement('div');
    hud.className = 'signal-hud';
    hud.innerHTML = `
      <div class="signal-stat"><span>Mode</span><strong data-stat="mode">Practice</strong></div>
      <div class="signal-stat"><span>Score</span><strong data-stat="score">0</strong></div>
      <div class="signal-stat"><span>Streak</span><strong data-stat="streak">0</strong></div>
      <div class="signal-stat"><span>Focus</span><strong data-stat="focus">2 / 3</strong></div>
      <div class="signal-stat"><span data-stat-label="resource">Round</span><strong data-stat="resource">0 / 8</strong></div>
    `;

    const field = document.createElement('div');
    field.className = 'signal-field';
    field.tabIndex = 0;
    field.setAttribute('role', 'group');
    field.setAttribute('aria-label', 'Signal field. Use Left and Right arrows to select a station, then Enter to answer.');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const fieldHelp = document.createElement('span');
    fieldHelp.className = 'signal-field-help';
    fieldHelp.textContent = 'Tap a station, or use arrows and Enter';
    field.append(canvas, fieldHelp);

    const sequenceWrap = document.createElement('div');
    sequenceWrap.className = 'signal-sequence-wrap';
    const sequenceLabel = document.createElement('span');
    sequenceLabel.className = 'signal-sequence-label';
    sequenceLabel.textContent = 'Observed signal';
    const sequence = document.createElement('div');
    sequence.className = 'signal-sequence';
    sequence.setAttribute('aria-label', 'Observed signal sequence');
    sequenceWrap.append(sequenceLabel, sequence);

    const choices = document.createElement('div');
    choices.className = 'signal-choices';
    stations.forEach((station, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'signal-choice';
      button.dataset.index = String(index);
      button.style.setProperty('--choice-color', station.color);
      button.setAttribute('aria-label', `${index + 1}. ${station.name}`);
      const dot = document.createElement('span');
      dot.setAttribute('aria-hidden', 'true');
      const name = document.createTextNode(station.name);
      const key = document.createElement('small');
      key.textContent = `Key ${index + 1}`;
      button.append(dot, name, key);
      button.addEventListener('click', () => submitAnswer(index));
      choices.append(button);
    });

    const result = resultCard();
    result.classList.add('signal-result');
    const actions = document.createElement('div');
    actions.className = 'signal-actions';
    const startButton = makeButton('Start Practice', startRun);
    startButton.classList.add('signal-start');
    const hintButton = makeButton('Use focus for hint', useHint, true);
    const resetButton = makeButton('New run', resetToMenu, true);
    actions.append(startButton, hintButton, resetButton);

    root.append(intro, modeRow, hud, field, sequenceWrap, choices, result, actions);
    const context = canvas.getContext('2d');

    field.addEventListener('pointerdown', handleFieldPointer);
    field.addEventListener('keydown', handleFieldKeydown);
    document.addEventListener('keydown', handleNumberKeys);
    document.addEventListener('visibilitychange', handleVisibility);
    dialog.addEventListener('close', cleanup, { once: true });

    setResult('Choose a mode.', 'Practice teaches the pattern families. Rush rewards speed. Survival tests adaptation and recovery.');
    renderSequence();
    updateHud();
    updateControls();
    draw(performance.now());
    if (!reducedMotion) animationId = requestAnimationFrame(animate);

    function selectMode(mode) {
      if (active || disposed) return;
      selectedMode = mode;
      modeRow.querySelectorAll('.signal-mode').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
      });
      startButton.textContent = `Start ${modes[mode].label}`;
      updateHud();
      setResult(`${modes[mode].label} selected.`, modes[mode].detail);
    }

    function startRun() {
      if (disposed) return;
      clearTimeout(nextRoundTimer);
      clearInterval(clockTimer);
      active = true;
      round = 0;
      score = 0;
      streak = 0;
      bestStreak = 0;
      correct = 0;
      attempts = 0;
      lives = 3;
      focus = selectedMode === 'practice' ? 3 : 2;
      level = 1;
      recentResults = [];
      deadline = selectedMode === 'rush' ? performance.now() + 60000 : 0;
      if (selectedMode === 'rush') clockTimer = window.setInterval(tickClock, 250);
      startButton.disabled = true;
      modeRow.querySelectorAll('button').forEach((button) => button.disabled = true);
      setResult(`${modes[selectedMode].label} begins.`, selectedMode === 'rush'
        ? 'You have 60 seconds. Correct predictions build score and focus.'
        : selectedMode === 'survival'
          ? 'Protect three lives. Difficulty adapts to your recent accuracy.'
          : 'Complete eight rounds and learn each pattern family.');
      playTone('start');
      nextRound();
    }

    function resetToMenu() {
      if (disposed) return;
      clearTimeout(nextRoundTimer);
      clearInterval(clockTimer);
      active = false;
      answered = false;
      currentRound = null;
      deadline = 0;
      round = 0;
      score = 0;
      streak = 0;
      bestStreak = 0;
      correct = 0;
      attempts = 0;
      lives = 3;
      focus = selectedMode === 'practice' ? 3 : 2;
      level = 1;
      startButton.disabled = false;
      modeRow.querySelectorAll('button').forEach((button) => button.disabled = false);
      startButton.textContent = `Start ${modes[selectedMode].label}`;
      setResult('Run reset.', 'Choose a mode whenever you are ready.');
      renderSequence();
      updateHud();
      updateControls();
      draw(performance.now());
    }

    function nextRound() {
      if (!active || disposed) return;
      if (selectedMode === 'practice' && round >= 8) return finishRun('Practice complete');
      if (selectedMode === 'rush' && remainingSeconds() <= 0) return finishRun('Time');
      if (selectedMode === 'survival' && lives <= 0) return finishRun('Signal lost');

      round += 1;
      answered = false;
      hintUsed = false;
      selectedIndex = 0;
      currentRound = makeRound();
      roundStartedAt = performance.now();
      renderSequence();
      updateHud();
      updateControls();
      draw(performance.now());
      setResult(`Round ${round}: predict the next station.`, selectedMode === 'practice'
        ? `Pattern family: ${currentRound.familyLabel}.`
        : 'Watch for repetition, direction, and interleaving.');
      field.focus({ preventScroll: true });
    }

    function makeRound() {
      const unlocked = level <= 1
        ? ['orbit']
        : level === 2
          ? ['orbit', 'echo']
          : level === 3
            ? ['orbit', 'echo', 'weave']
            : ['orbit', 'echo', 'weave', 'mirror', 'pulse'];
      const family = unlocked[Math.floor(Math.random() * unlocked.length)];
      const visibleCount = Math.min(8, 4 + Math.floor(level / 2) + (selectedMode === 'survival' ? 1 : 0));
      const start = Math.floor(Math.random() * 4);
      const second = (start + 1 + Math.floor(Math.random() * 3)) % 4;
      const third = (second + 1 + Math.floor(Math.random() * 3)) % 4;
      let values = [];

      if (family === 'orbit') {
        const step = Math.random() < 0.5 ? 1 : 3;
        values = Array.from({ length: visibleCount + 1 }, (_, index) => (start + step * index) % 4);
      } else if (family === 'echo') {
        const step = Math.random() < 0.5 ? 1 : 3;
        values = Array.from({ length: visibleCount + 1 }, (_, index) => (start + step * Math.floor(index / 2)) % 4);
      } else if (family === 'weave') {
        const aStep = Math.random() < 0.5 ? 1 : 3;
        const bStep = aStep === 1 ? 3 : 1;
        values = Array.from({ length: visibleCount + 1 }, (_, index) => index % 2 === 0
          ? (start + aStep * Math.floor(index / 2)) % 4
          : (second + bStep * Math.floor(index / 2)) % 4);
      } else if (family === 'mirror') {
        const motif = [start, second, third, second];
        values = Array.from({ length: visibleCount + 1 }, (_, index) => motif[index % motif.length]);
      } else {
        const motif = [start, second, start, third];
        values = Array.from({ length: visibleCount + 1 }, (_, index) => motif[index % motif.length]);
      }

      const labels = {
        orbit: 'Orbit: one direction around the garden',
        echo: 'Echo: every station repeats once',
        weave: 'Weave: two paths alternate',
        mirror: 'Mirror: the path folds back',
        pulse: 'Pulse: one anchor returns between signals'
      };

      return { family, familyLabel: labels[family], sequence: values.slice(0, -1), answer: values.at(-1) };
    }

    function submitAnswer(index) {
      if (!active || answered || disposed || !currentRound) return;
      answered = true;
      attempts += 1;
      const isCorrect = index === currentRound.answer;
      const elapsed = Math.max(0.1, (performance.now() - roundStartedAt) / 1000);
      selectedIndex = index;
      recentResults.push(isCorrect);
      recentResults = recentResults.slice(-5);

      choices.querySelectorAll('.signal-choice').forEach((button, buttonIndex) => {
        button.disabled = true;
        button.classList.toggle('is-correct', buttonIndex === currentRound.answer);
        button.classList.toggle('is-wrong', buttonIndex === index && !isCorrect);
      });

      if (isCorrect) {
        correct += 1;
        streak += 1;
        bestStreak = Math.max(bestStreak, streak);
        const speedBonus = Math.max(0, Math.round(80 - elapsed * 8));
        const streakBonus = Math.min(100, streak * 12);
        const gain = 100 + level * 30 + speedBonus + streakBonus;
        score += gain;
        if (streak % 3 === 0) focus = Math.min(3, focus + 1);
        adaptDifficulty(true);
        setResult(`Correct: ${stations[index].name} +${gain}`, `${currentRound.familyLabel}. ${streak} correct in a row.`);
        playTone('good');
      } else {
        streak = 0;
        if (selectedMode === 'rush') deadline -= 3000;
        if (selectedMode === 'survival') lives -= 1;
        adaptDifficulty(false);
        setResult(`The next station was ${stations[currentRound.answer].name}.`, selectedMode === 'rush'
          ? 'Miss penalty: three seconds.'
          : selectedMode === 'survival'
            ? `${Math.max(0, lives)} ${lives === 1 ? 'life' : 'lives'} remain. Difficulty eased one step so you can recover.`
            : currentRound.familyLabel);
        playTone('miss');
      }

      updateHud();
      draw(performance.now());
      nextRoundTimer = window.setTimeout(() => {
        if (selectedMode === 'rush' && remainingSeconds() <= 0) finishRun('Time');
        else if (selectedMode === 'survival' && lives <= 0) finishRun('Signal lost');
        else nextRound();
      }, reducedMotion ? 500 : 1100);
    }

    function adaptDifficulty(wasCorrect) {
      if (selectedMode === 'practice') {
        level = Math.min(5, 1 + Math.floor(round / 2));
        return;
      }
      const recentAccuracy = recentResults.filter(Boolean).length / recentResults.length;
      if (wasCorrect && streak >= 2 && recentAccuracy >= 0.75) level = Math.min(5, level + 1);
      if (!wasCorrect) level = Math.max(1, level - 1);
    }

    function useHint() {
      if (!active || answered || disposed || !currentRound) return;
      if (focus <= 0) {
        setResult('No focus left.', 'Earn one focus after every three-answer streak.');
        playTone('miss');
        return;
      }
      if (hintUsed) {
        setResult('Hint already active.', currentRound.familyLabel);
        return;
      }
      hintUsed = true;
      focus -= 1;
      const wrong = [0, 1, 2, 3].filter((index) => index !== currentRound.answer);
      wrong.sort(() => Math.random() - 0.5).slice(0, 2).forEach((index) => {
        const button = choices.querySelector(`[data-index="${index}"]`);
        if (button) button.disabled = true;
      });
      setResult(currentRound.familyLabel, 'Two impossible stations have been dimmed. The score for this round is unchanged.');
      updateHud();
      playTone('hint');
    }

    function finishRun(reason) {
      if (!active || disposed) return;
      active = false;
      answered = true;
      clearTimeout(nextRoundTimer);
      clearInterval(clockTimer);
      choices.querySelectorAll('button').forEach((button) => button.disabled = true);
      startButton.disabled = false;
      startButton.textContent = `Play ${modes[selectedMode].label} again`;
      modeRow.querySelectorAll('button').forEach((button) => button.disabled = false);
      const accuracy = attempts ? Math.round(correct / attempts * 100) : 0;
      const rank = accuracy >= 85 && score >= 1200 ? 'Signal Keeper' : accuracy >= 65 ? 'Pattern Scout' : 'Garden Listener';
      setResult(`${reason}: ${score} points`, `${rank}. ${accuracy}% accuracy, best streak ${bestStreak}, level ${level}.`);
      updateHud();
      playTone('finish');
    }

    function remainingSeconds() {
      return Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
    }

    function tickClock() {
      if (!active || selectedMode !== 'rush' || disposed) return;
      updateHud();
      if (remainingSeconds() <= 0) finishRun('Time');
    }

    function updateHud() {
      hud.querySelector('[data-stat="mode"]').textContent = modes[selectedMode].label;
      hud.querySelector('[data-stat="score"]').textContent = score.toLocaleString();
      hud.querySelector('[data-stat="streak"]').textContent = `${streak} · L${level}`;
      hud.querySelector('[data-stat="focus"]').textContent = `${focus} / 3`;
      const resourceLabel = hud.querySelector('[data-stat-label="resource"]');
      const resource = hud.querySelector('[data-stat="resource"]');
      if (selectedMode === 'rush') {
        resourceLabel.textContent = 'Time';
        resource.textContent = active ? `${remainingSeconds()}s` : '60s';
      } else if (selectedMode === 'survival') {
        resourceLabel.textContent = 'Lives';
        resource.textContent = `${lives} / 3`;
      } else {
        resourceLabel.textContent = 'Round';
        resource.textContent = `${Math.min(round, 8)} / 8`;
      }
      hintButton.disabled = !active || answered || focus <= 0;
      hintButton.textContent = focus > 0 ? `Use focus for hint (${focus})` : 'No focus left';
    }

    function updateControls() {
      choices.querySelectorAll('.signal-choice').forEach((button, index) => {
        button.disabled = !active || answered;
        button.classList.toggle('is-selected', active && !answered && index === selectedIndex);
        button.classList.remove('is-correct', 'is-wrong');
      });
      hintButton.disabled = !active || answered || focus <= 0;
    }

    function renderSequence() {
      sequence.replaceChildren();
      if (!currentRound) {
        const empty = document.createElement('span');
        empty.className = 'signal-chip is-question';
        empty.textContent = 'Start a run to reveal a signal';
        sequence.append(empty);
        return;
      }
      currentRound.sequence.forEach((value) => {
        const chip = document.createElement('span');
        chip.className = 'signal-chip';
        chip.style.setProperty('--chip-color', stations[value].color);
        chip.textContent = stations[value].name;
        sequence.append(chip);
      });
      const question = document.createElement('span');
      question.className = 'signal-chip is-question';
      question.textContent = 'Next?';
      sequence.append(question);
    }

    function setResult(titleText, noteText) {
      result.replaceChildren();
      const strong = document.createElement('strong');
      strong.textContent = titleText;
      const small = document.createElement('small');
      small.textContent = noteText;
      result.append(strong, small);
    }

    function handleFieldPointer(event) {
      if (!active || answered || disposed) return;
      const bounds = field.getBoundingClientRect();
      const pointX = event.clientX - bounds.left;
      const pointY = event.clientY - bounds.top;
      const positions = stationPositions(bounds.width, bounds.height);
      let closest = 0;
      let distance = Infinity;
      positions.forEach((position, index) => {
        const nextDistance = Math.hypot(pointX - position.x, pointY - position.y);
        if (nextDistance < distance) {
          distance = nextDistance;
          closest = index;
        }
      });
      selectedIndex = closest;
      updateSelection();
      submitAnswer(closest);
    }

    function handleFieldKeydown(event) {
      if (!active || answered || disposed) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % 4;
        updateSelection();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        selectedIndex = (selectedIndex + 3) % 4;
        updateSelection();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        submitAnswer(selectedIndex);
      }
    }

    function handleNumberKeys(event) {
      if (!active || answered || disposed || event.altKey || event.ctrlKey || event.metaKey) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < 4) submitAnswer(index);
    }

    function updateSelection() {
      choices.querySelectorAll('.signal-choice').forEach((button, index) => {
        button.classList.toggle('is-selected', index === selectedIndex);
      });
      draw(performance.now());
    }

    function handleVisibility() {
      if (selectedMode !== 'rush' || !active || !deadline) return;
      if (document.hidden) {
        pausedAt = performance.now();
      } else if (pausedAt) {
        deadline += performance.now() - pausedAt;
        pausedAt = 0;
      }
    }

    function stationPositions(width, height) {
      const compact = width < 520;
      const radiusX = compact ? width * 0.32 : width * 0.35;
      const radiusY = height * 0.31;
      const centerX = width / 2;
      const centerY = height / 2;
      return [
        { x: centerX, y: centerY - radiusY },
        { x: centerX + radiusX, y: centerY },
        { x: centerX, y: centerY + radiusY },
        { x: centerX - radiusX, y: centerY }
      ];
    }

    function draw(time) {
      const bounds = field.getBoundingClientRect();
      const width = Math.max(1, Math.floor(bounds.width));
      const height = Math.max(1, Math.floor(bounds.height));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const gradient = context.createRadialGradient(width * 0.5, height * 0.45, 10, width * 0.5, height * 0.5, Math.max(width, height) * 0.7);
      gradient.addColorStop(0, '#16372c');
      gradient.addColorStop(1, '#07110d');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      const positions = stationPositions(width, height);
      context.strokeStyle = 'rgba(191,231,209,.13)';
      context.lineWidth = 2;
      context.beginPath();
      positions.forEach((position, index) => {
        const next = positions[(index + 1) % positions.length];
        context.moveTo(position.x, position.y);
        context.lineTo(next.x, next.y);
      });
      context.stroke();

      if (currentRound?.sequence?.length) {
        context.strokeStyle = 'rgba(255,242,189,.22)';
        context.lineWidth = 3;
        context.beginPath();
        currentRound.sequence.forEach((value, index) => {
          const position = positions[value];
          if (index === 0) context.moveTo(position.x, position.y);
          else context.lineTo(position.x, position.y);
        });
        context.stroke();
      }

      positions.forEach((position, index) => {
        const selected = active && !answered && index === selectedIndex;
        const pulse = reducedMotion ? 0 : Math.sin(time * 0.003 + index) * 2;
        context.fillStyle = selected ? 'rgba(255,242,189,.16)' : 'rgba(255,255,255,.05)';
        context.beginPath();
        context.arc(position.x, position.y, 34 + pulse, 0, TAU);
        context.fill();

        const glow = context.createRadialGradient(position.x, position.y, 1, position.x, position.y, 26);
        glow.addColorStop(0, stations[index].color);
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = glow;
        context.beginPath();
        context.arc(position.x, position.y, 26, 0, TAU);
        context.fill();

        context.fillStyle = stations[index].color;
        context.beginPath();
        context.arc(position.x, position.y, selected ? 12 : 9, 0, TAU);
        context.fill();

        context.fillStyle = 'rgba(255,255,255,.86)';
        context.font = '800 12px system-ui, sans-serif';
        context.textAlign = 'center';
        context.fillText(stations[index].name, position.x, position.y + 49);
      });

      if (currentRound?.sequence?.length && !answered) {
        const values = currentRound.sequence;
        const progress = reducedMotion ? values.length - 1 : (time * 0.0012) % values.length;
        const fromIndex = Math.floor(progress) % values.length;
        const toIndex = (fromIndex + 1) % values.length;
        const fraction = progress - Math.floor(progress);
        const from = positions[values[fromIndex]];
        const to = positions[values[toIndex]];
        const x = from.x + (to.x - from.x) * fraction;
        const y = from.y + (to.y - from.y) * fraction;
        const signalGlow = context.createRadialGradient(x, y, 0, x, y, 28);
        signalGlow.addColorStop(0, 'rgba(255,242,189,.95)');
        signalGlow.addColorStop(1, 'rgba(255,111,74,0)');
        context.fillStyle = signalGlow;
        context.beginPath();
        context.arc(x, y, 28, 0, TAU);
        context.fill();
        context.fillStyle = '#fff2bd';
        context.beginPath();
        context.arc(x, y, 6, 0, TAU);
        context.fill();
      }
    }

    function animate(time) {
      if (disposed || !canvas.isConnected || !dialog.open) return;
      draw(time);
      animationId = requestAnimationFrame(animate);
    }

    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) {
        setResult('Sound is unavailable.', 'The game remains fully playable without audio.');
        return;
      }
      soundEnabled = !soundEnabled;
      soundButton.textContent = soundEnabled ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(soundEnabled));
      if (soundEnabled) {
        audioContext ||= new AudioEngine();
        audioContext.resume();
        playTone('hint');
      }
    }

    function playTone(kind) {
      if (!soundEnabled || !audioContext) return;
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const frequency = { start: 420, good: 760, miss: 220, hint: 560, finish: 880 }[kind] || 440;
      oscillator.type = kind === 'miss' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      if (kind === 'good' || kind === 'finish') oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.35, now + 0.16);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.26);
    }

    function cleanup() {
      disposed = true;
      active = false;
      cancelAnimationFrame(animationId);
      clearTimeout(nextRoundTimer);
      clearInterval(clockTimer);
      document.removeEventListener('keydown', handleNumberKeys);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
    }
  };
})();