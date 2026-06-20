const REPO = 'JohnPMcGuire/autonomous-tiny-forge';
const state = { apps: [], activeFilter: 'all', recentPicks: [] };

const grid = document.querySelector('#app-grid');
const template = document.querySelector('#app-card-template');
const dialog = document.querySelector('#app-dialog');
const stage = document.querySelector('#app-stage');
const title = document.querySelector('#dialog-title');
const category = document.querySelector('#dialog-category');
const description = document.querySelector('#dialog-description');
const feedback = document.querySelector('#dialog-feedback');

init();

async function init() {
  try {
    const response = await fetch('./registry/apps.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Registry returned ${response.status}`);
    const data = await response.json();
    state.apps = data.apps;
    renderApps();
  } catch (error) {
    grid.innerHTML = `<div class="loading-card">The forge registry could not be loaded. Please refresh or check the repository status.</div>`;
    console.error(error);
  }

  document.querySelectorAll('.filter').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeFilter = button.dataset.filter;
      document.querySelectorAll('.filter').forEach((item) => item.classList.toggle('is-active', item === button));
      renderApps();
    });
  });

  document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function renderApps() {
  const visible = state.apps.filter((app) => state.activeFilter === 'all' || app.category === state.activeFilter);
  grid.replaceChildren();
  if (!visible.length) {
    grid.innerHTML = '<div class="loading-card">No apps in this category yet. The forge may add one in a future build.</div>';
    return;
  }

  for (const app of visible) {
    const node = template.content.cloneNode(true);
    node.querySelector('.app-card').dataset.category = app.category;
    node.querySelector('.app-icon').textContent = app.emoji;
    node.querySelector('.app-meta').textContent = `${labelCategory(app.category)} · v${app.version}`;
    node.querySelector('.app-name').textContent = app.name;
    node.querySelector('.app-summary').textContent = app.summary;
    const button = node.querySelector('.app-card-button');
    button.setAttribute('aria-label', `Open ${app.name}`);
    button.addEventListener('click', () => openApp(app));
    grid.append(node);
  }
}

function openApp(app) {
  title.textContent = app.name;
  category.textContent = `${labelCategory(app.category)} · ${app.emoji}`;
  description.textContent = app.description;
  const issueTitle = encodeURIComponent(`[Feedback] ${app.name}`);
  feedback.href = `https://github.com/${REPO}/issues/new?template=feedback.yml&title=${issueTitle}`;
  stage.replaceChildren();

  const renderers = {
    'timer-guess': renderTimerGuess,
    'fair-picker': renderFairPicker,
    'micro-step': renderMicroStep,
    'challenge-deck': renderChallengeDeck,
    'choice-mixer': renderChoiceMixer,
    'word-remix': renderWordRemix,
    'reflection-cards': renderReflectionCards,
    'prediction-game': renderPredictionGame
  };

  const renderer = renderers[app.engine];
  if (!renderer) {
    stage.innerHTML = '<div class="result-card"><strong>This app engine is not available yet.</strong></div>';
  } else {
    renderer(app);
  }
  dialog.showModal();
}

function panel(intro) {
  const root = document.createElement('section');
  root.className = 'tool-panel';
  if (intro) {
    const p = document.createElement('p');
    p.textContent = intro;
    root.append(p);
  }
  stage.append(root);
  return root;
}

function makeButton(text, onClick, secondary = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = secondary ? 'button button-secondary' : 'button';
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

function resultCard() {
  const result = document.createElement('div');
  result.className = 'result-card';
  result.setAttribute('aria-live', 'polite');
  return result;
}

function renderTimerGuess(app) {
  if (!document.querySelector('#time-sense-styles')) {
    const styles = document.createElement('style');
    styles.id = 'time-sense-styles';
    styles.textContent = `
      .time-game { max-width: 760px; gap: 14px; }
      .time-hud { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .time-stat { border: 1px solid var(--line); border-radius: 16px; padding: 12px 14px; background: white; }
      .time-stat span { display: block; color: var(--muted); font-size: .72rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
      .time-stat strong { display: block; margin-top: 4px; font-size: 1.1rem; }
      .time-arena { position: relative; width: 100%; min-height: 300px; overflow: hidden; border: 2px solid transparent; border-radius: 26px; padding: 0; background: #07110d; color: white; cursor: pointer; touch-action: manipulation; box-shadow: inset 0 0 0 1px rgba(255,255,255,.08); }
      .time-arena:hover { transform: none; }
      .time-arena:focus-visible { outline: 4px solid var(--accent); outline-offset: 4px; }
      .time-arena canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
      .time-arena-copy { position: relative; z-index: 1; min-height: 300px; display: grid; place-content: center; justify-items: center; gap: 8px; padding: 28px; text-align: center; pointer-events: none; background: radial-gradient(circle at center, rgba(7,17,13,.1), rgba(7,17,13,.62) 72%); }
      .time-arena-kicker { font-size: .7rem; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; color: var(--mint); }
      .time-arena strong { max-width: 600px; font-size: clamp(2rem, 7vw, 4.2rem); line-height: .95; letter-spacing: -.055em; text-wrap: balance; }
      .time-arena small { color: rgba(255,255,255,.72); font-size: .95rem; }
      .time-arena.is-running { border-color: var(--accent); }
      .time-arena.is-running .time-arena-kicker { color: #fff2bd; }
      .time-arena.is-complete { border-color: var(--mint); }
      .time-result { min-height: 104px; padding: 20px 22px; }
      .time-result strong { font-size: clamp(1.25rem, 3.5vw, 2rem); }
      @media (max-width: 520px) {
        .time-hud { gap: 6px; }
        .time-stat { padding: 10px; }
        .time-stat span { font-size: .62rem; letter-spacing: .06em; }
        .time-stat strong { font-size: .95rem; }
        .time-arena, .time-arena-copy { min-height: 250px; }
      }
    `;
    document.head.append(styles);
  }

  const root = panel('');
  root.classList.add('time-game');
  const min = app.config.minSeconds || 20;
  const max = app.config.maxSeconds || 75;
  const roundLimit = app.config.rounds || 5;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let started = 0;
  let target = 0;
  let sessionComplete = false;
  let scores = [];
  let audioEnabled = false;
  let audioContext;

  const hud = document.createElement('div');
  hud.className = 'time-hud';
  hud.innerHTML = `
    <div class="time-stat"><span>Round</span><strong id="time-round">1 / ${roundLimit}</strong></div>
    <div class="time-stat"><span>Average</span><strong id="time-average">—</strong></div>
    <div class="time-stat"><span>Best</span><strong id="time-best">—</strong></div>
  `;

  const arena = document.createElement('button');
  arena.className = 'time-arena';
  arena.type = 'button';
  arena.setAttribute('aria-label', 'Start the hidden timer');
  arena.innerHTML = `
    <canvas aria-hidden="true"></canvas>
    <span class="time-arena-copy">
      <span class="time-arena-kicker">Tap, Space, or Enter</span>
      <strong>Start round</strong>
      <small>Watch the spark, not a clock.</small>
    </span>
  `;

  const canvas = arena.querySelector('canvas');
  const arenaTitle = arena.querySelector('strong');
  const arenaNote = arena.querySelector('small');
  const result = resultCard();
  result.classList.add('time-result');
  result.innerHTML = '<strong>How accurate is your internal clock?</strong><small>Start a round, then stop when the target duration feels complete.</small>';

  const actions = document.createElement('div');
  actions.className = 'tool-actions';
  const soundButton = makeButton('Sound off', () => {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) {
      result.innerHTML = '<strong>Sound is not available here.</strong><small>The game still works without audio.</small>';
      return;
    }
    audioEnabled = !audioEnabled;
    soundButton.textContent = audioEnabled ? 'Sound on' : 'Sound off';
    soundButton.setAttribute('aria-pressed', String(audioEnabled));
    if (audioEnabled) {
      audioContext ||= new AudioEngine();
      audioContext.resume();
      playTone('start');
    }
  }, true);
  soundButton.setAttribute('aria-pressed', 'false');

  const resetButton = makeButton('Reset score', resetSession, true);
  actions.append(soundButton, resetButton);

  const updateHud = () => {
    const nextRound = sessionComplete ? roundLimit : Math.min(scores.length + 1, roundLimit);
    hud.querySelector('#time-round').textContent = `${nextRound} / ${roundLimit}`;
    hud.querySelector('#time-average').textContent = scores.length
      ? `${Math.round(scores.reduce((sum, item) => sum + item.accuracy, 0) / scores.length)}%`
      : '—';
    hud.querySelector('#time-best').textContent = scores.length
      ? `${Math.max(...scores.map((item) => item.accuracy))}%`
      : '—';
  };

  function playTone(kind) {
    if (!audioEnabled || !audioContext) return;
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(kind === 'start' ? 440 : kind === 'good' ? 740 : 260, now);
    if (kind === 'good') oscillator.frequency.exponentialRampToValueAtTime(980, now + 0.14);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.22);
  }

  function resetSession() {
    started = 0;
    target = 0;
    sessionComplete = false;
    scores = [];
    arena.classList.remove('is-running', 'is-complete');
    arenaTitle.textContent = 'Start round';
    arenaNote.textContent = 'Watch the spark, not a clock.';
    arena.setAttribute('aria-label', 'Start the hidden timer');
    result.innerHTML = '<strong>Score reset.</strong><small>Tap the arena when you are ready for round one.</small>';
    updateHud();
    draw(performance.now());
  }

  function startRound() {
    if (sessionComplete) resetSession();
    target = Math.floor(Math.random() * (max - min + 1)) + min;
    started = performance.now();
    arena.classList.add('is-running');
    arena.classList.remove('is-complete');
    arenaTitle.textContent = `Stop at ${target} seconds`;
    arenaNote.textContent = 'The timer is hidden. Trust your sense of time.';
    arena.setAttribute('aria-label', `Stop the hidden timer at ${target} seconds`);
    result.innerHTML = `<strong>Target: ${target} seconds</strong><small>No countdown. Tap again when the moment feels right.</small>`;
    playTone('start');
    draw(performance.now());
  }

  function stopRound() {
    const elapsed = (performance.now() - started) / 1000;
    const difference = Math.abs(elapsed - target);
    const direction = elapsed < target ? 'early' : 'late';
    const accuracy = Math.max(0, Math.round(100 - (difference / target) * 200));
    scores.push({ accuracy, difference, elapsed, target });
    started = 0;
    arena.classList.remove('is-running');
    arenaTitle.textContent = scores.length >= roundLimit ? 'See final score' : 'Start next round';
    arenaNote.textContent = `${elapsed.toFixed(1)} seconds · ${accuracy}% accuracy`;
    playTone(accuracy >= 90 ? 'good' : 'miss');

    if (scores.length >= roundLimit) {
      sessionComplete = true;
      arena.classList.add('is-complete');
      const average = Math.round(scores.reduce((sum, item) => sum + item.accuracy, 0) / scores.length);
      const closest = scores.reduce((best, item) => item.difference < best.difference ? item : best);
      arenaTitle.textContent = 'Play another set';
      arenaNote.textContent = `Average ${average}% · best miss ${closest.difference.toFixed(1)}s`;
      arena.setAttribute('aria-label', 'Start a new five-round session');
      result.innerHTML = `<strong>${average}% session accuracy</strong><small>Closest round: ${closest.difference.toFixed(1)} seconds off. Tap the arena to play again.</small>`;
    } else {
      arena.setAttribute('aria-label', `Start round ${scores.length + 1} of ${roundLimit}`);
      result.innerHTML = `<strong>${elapsed.toFixed(1)} seconds</strong><small>You were ${difference.toFixed(1)} seconds ${direction}. Target: ${target}. Accuracy: ${accuracy}%.</small>`;
    }
    updateHud();
    draw(performance.now());
  }

  arena.addEventListener('click', () => {
    if (started) stopRound();
    else startRound();
  });

  root.append(hud, arena, result, actions);
  updateHud();

  const context = canvas.getContext('2d');
  const stars = Array.from({ length: 42 }, (_, index) => ({
    x: ((index * 47) % 101) / 100,
    y: ((index * 71) % 97) / 96,
    size: 0.7 + (index % 4) * 0.45,
    phase: index * 0.73
  }));

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
    background.addColorStop(0, '#10241d');
    background.addColorStop(1, '#07110d');
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    for (const star of stars) {
      const shimmer = reducedMotion ? 0.55 : 0.35 + Math.sin(time * 0.0015 + star.phase) * 0.2;
      context.fillStyle = `rgba(191, 231, 209, ${shimmer})`;
      context.beginPath();
      context.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
      context.fill();
    }

    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const radiusX = width * 0.31;
    const radiusY = height * 0.27;
    context.strokeStyle = 'rgba(191, 231, 209, 0.14)';
    context.lineWidth = 1;
    context.beginPath();
    context.ellipse(centerX, centerY, radiusX, radiusY, -0.2, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.ellipse(centerX, centerY, radiusX * 0.68, radiusY * 1.35, 0.75, 0, Math.PI * 2);
    context.stroke();

    const motion = reducedMotion ? 0.6 : time * (started ? 0.00105 : 0.00026);
    const wobble = Math.sin(motion * 0.73) * 0.42;
    const sparkX = centerX + Math.cos(motion + wobble) * radiusX;
    const sparkY = centerY + Math.sin(motion * 1.17) * radiusY;

    if (!reducedMotion) {
      for (let index = 10; index >= 1; index -= 1) {
        const trailTime = motion - index * 0.07;
        const trailX = centerX + Math.cos(trailTime + Math.sin(trailTime * 0.73) * 0.42) * radiusX;
        const trailY = centerY + Math.sin(trailTime * 1.17) * radiusY;
        context.fillStyle = `rgba(255, 111, 74, ${0.24 * (1 - index / 11)})`;
        context.beginPath();
        context.arc(trailX, trailY, Math.max(1, 5 - index * 0.32), 0, Math.PI * 2);
        context.fill();
      }
    }

    const glow = context.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, 28);
    glow.addColorStop(0, 'rgba(255, 235, 178, 0.95)');
    glow.addColorStop(0.25, 'rgba(255, 111, 74, 0.8)');
    glow.addColorStop(1, 'rgba(255, 111, 74, 0)');
    context.fillStyle = glow;
    context.beginPath();
    context.arc(sparkX, sparkY, 28, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#fff2bd';
    context.beginPath();
    context.arc(sparkX, sparkY, started ? 6.5 : 5, 0, Math.PI * 2);
    context.fill();
  }

  function animate(time) {
    draw(time);
    if (canvas.isConnected && dialog.open && !reducedMotion) requestAnimationFrame(animate);
  }

  draw(performance.now());
  if (!reducedMotion) requestAnimationFrame(animate);
  if ('ResizeObserver' in window) new ResizeObserver(() => draw(performance.now())).observe(arena);
}

function renderFairPicker(app) {
  const root = panel(app.config.instructions);
  const field = document.createElement('div');
  field.className = 'field';
  field.innerHTML = '<label for="picker-items">People or choices, one per line</label><textarea id="picker-items" placeholder="Alex\nBailey\nCasey"></textarea>';
  const result = resultCard();
  result.innerHTML = '<strong>Add at least two choices.</strong><small>Recent winners receive a small penalty so one option does not dominate.</small>';
  const actions = document.createElement('div');
  actions.className = 'tool-actions';
  actions.append(makeButton('Choose fairly', () => {
    const items = field.querySelector('textarea').value.split('\n').map((item) => item.trim()).filter(Boolean);
    if (items.length < 2) {
      result.innerHTML = '<strong>Two or more choices needed.</strong>';
      return;
    }
    const weighted = items.flatMap((item) => {
      const recentCount = state.recentPicks.filter((pick) => pick === item).length;
      return Array(Math.max(1, 4 - recentCount)).fill(item);
    });
    const pick = weighted[Math.floor(Math.random() * weighted.length)];
    state.recentPicks = [pick, ...state.recentPicks].slice(0, 8);
    result.innerHTML = `<strong>${escapeHtml(pick)}</strong><small>Chosen with a recent-selection fairness adjustment.</small>`;
  }), makeButton('Clear history', () => {
    state.recentPicks = [];
    result.innerHTML = '<strong>History cleared.</strong><small>Every option now starts with equal weight.</small>';
  }, true));
  root.append(field, actions, result);
}

function renderMicroStep(app) {
  const root = panel(app.config.instructions);
  const field = document.createElement('div');
  field.className = 'field';
  field.innerHTML = '<label for="goal-input">What are you trying to move forward?</label><input id="goal-input" maxlength="180" placeholder="Organize the garage">';
  const energy = document.createElement('div');
  energy.className = 'field';
  energy.innerHTML = '<label for="energy-input">Energy right now: <output id="energy-output">3</output>/5</label><input id="energy-input" type="range" min="1" max="5" value="3">';
  energy.querySelector('input').addEventListener('input', (event) => energy.querySelector('output').value = event.target.value);
  const result = resultCard();
  result.innerHTML = '<strong>Your next step will appear here.</strong>';
  root.append(field, energy, makeButton('Shrink the task', () => {
    const goal = field.querySelector('input').value.trim();
    const level = Number(energy.querySelector('input').value);
    if (!goal) {
      result.innerHTML = '<strong>Enter a goal first.</strong>';
      return;
    }
    const patterns = level <= 2
      ? [`Open what you need for “${goal}” and place it in view.`, `Spend two minutes making “${goal}” easier to start later.`, `Write one sentence describing what “done enough” means for “${goal}”.`]
      : level === 3
        ? [`Set a ten-minute timer and complete the easiest visible part of “${goal}”.`, `Remove one obstacle standing between you and “${goal}”.`, `Make a three-item checklist for “${goal}”, then do item one.`]
        : [`Choose the highest-impact part of “${goal}” and work on it for twenty focused minutes.`, `Finish one complete slice of “${goal}” before switching tasks.`, `Do the part of “${goal}” you have been avoiding, but stop after fifteen minutes.`];
    const pick = patterns[Math.floor(Math.random() * patterns.length)];
    result.innerHTML = `<strong>${escapeHtml(pick)}</strong><small>Small enough to start; meaningful enough to count.</small>`;
  }), result);
}

function renderChallengeDeck(app) {
  const root = panel(app.config.instructions);
  const result = resultCard();
  const cards = app.config.items.length ? app.config.items : app.config.prompts;
  const draw = () => {
    const item = cards[Math.floor(Math.random() * cards.length)];
    result.innerHTML = `<strong>${escapeHtml(item)}</strong><small>Draw again whenever this one stops being interesting.</small>`;
  };
  draw();
  root.append(result, makeButton('Draw another', draw));
}

function renderChoiceMixer(app) {
  const root = panel(app.config.instructions);
  const result = resultCard();
  result.innerHTML = '<strong>Choose two ingredients.</strong><small>The forge will combine them into a small experiment.</small>';
  const choices = document.createElement('div');
  choices.className = 'choice-grid';
  const selected = [];
  for (const option of app.config.options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.textContent = option;
    button.addEventListener('click', () => {
      if (selected.includes(option)) return;
      selected.push(option);
      button.disabled = true;
      if (selected.length === 2) {
        const outcome = app.config.outcomes[Math.floor(Math.random() * app.config.outcomes.length)];
        result.innerHTML = `<strong>${escapeHtml(selected[0])} + ${escapeHtml(selected[1])}</strong><small>${escapeHtml(outcome)}</small>`;
        [...choices.children].forEach((child) => child.disabled = true);
      }
    });
    choices.append(button);
  }
  root.append(choices, result, makeButton('Reset mix', () => {
    stage.replaceChildren();
    renderChoiceMixer(app);
  }, true));
}

function renderWordRemix(app) {
  const root = panel(app.config.instructions);
  const result = resultCard();
  const bank = document.createElement('div');
  bank.className = 'word-bank';
  const selected = [];
  const words = [...app.config.items, ...app.config.options].slice(0, 18);
  for (const word of words) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'word-chip';
    chip.textContent = word;
    chip.addEventListener('click', () => {
      chip.classList.toggle('is-selected');
      const index = selected.indexOf(word);
      if (index >= 0) selected.splice(index, 1); else selected.push(word);
      const prompt = app.config.prompts[selected.length % app.config.prompts.length];
      result.innerHTML = selected.length
        ? `<strong>${escapeHtml(selected.join(' · '))}</strong><small>${escapeHtml(prompt)}</small>`
        : '<strong>Select a few words.</strong>';
    });
    bank.append(chip);
  }
  result.innerHTML = '<strong>Select a few words.</strong><small>See what unlikely idea they suggest together.</small>';
  root.append(bank, result);
}

function renderReflectionCards(app) {
  const root = panel(app.config.instructions);
  const result = resultCard();
  let index = -1;
  const next = () => {
    index = (index + 1) % app.config.prompts.length;
    result.innerHTML = `<strong>${escapeHtml(app.config.prompts[index])}</strong><small>There is no correct answer. Notice what arrives first.</small>`;
  };
  next();
  root.append(result, makeButton('Next card', next));
}

function renderPredictionGame(app) {
  const root = panel(app.config.instructions);
  const result = resultCard();
  let score = 0;
  let rounds = 0;
  const prompt = document.createElement('h3');
  const choices = document.createElement('div');
  choices.className = 'choice-grid';
  const play = () => {
    prompt.textContent = app.config.prompts[Math.floor(Math.random() * app.config.prompts.length)];
    choices.replaceChildren();
    const answer = app.config.options[Math.floor(Math.random() * app.config.options.length)];
    for (const option of app.config.options.slice(0, 4)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice';
      button.textContent = option;
      button.addEventListener('click', () => {
        rounds += 1;
        if (option === answer) score += 1;
        result.innerHTML = `<strong>${option === answer ? 'Good prediction.' : `The hidden answer was ${escapeHtml(answer)}.`}</strong><small>Score: ${score}/${rounds}</small>`;
        [...choices.children].forEach((child) => child.disabled = true);
      });
      choices.append(button);
    }
  };
  root.append(prompt, choices, result, makeButton('New round', play));
  play();
}

function labelCategory(value) {
  return ({ useful: 'Useful tool', play: 'Tiny game', experiment: 'Experiment' })[value] || value;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}
