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
    'prediction-game': renderPredictionGame,
    'bridge-brace': window.renderBridgeBrace
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
    arenaTitle.textContent = `${target} seconds`;
    arenaNote.textContent = 'Tap when the hidden timer feels complete.';
    arena.setAttribute('aria-label', `Stop the timer at ${target} seconds`);
    result.innerHTML = '<strong>Timer running.</strong><small>No clock is shown. Trust the rhythm.</small>';
    draw(started);
  }

  function stopRound() {
    const elapsed = (performance.now() - started) / 1000;
    const difference = Math.abs(elapsed - target);
    const accuracy = Math.max(0, Math.round(100 - (difference / target) * 100));
    scores.push({ elapsed, target, accuracy });
    arena.classList.remove('is-running');
    arena.classList.add('is-complete');
    arenaTitle.textContent = `${accuracy}%`;
    arenaNote.textContent = `You stopped at ${elapsed.toFixed(1)}s for a ${target}s target.`;
    result.innerHTML = `<strong>${accuracy}% accurate.</strong><small>Difference: ${difference.toFixed(1)} seconds. ${scores.length >= roundLimit ? 'Session complete.' : 'Start the next round when ready.'}</small>`;
    playTone(accuracy > 85 ? 'good' : 'miss');
    if (scores.length >= roundLimit) sessionComplete = true;
    updateHud();
  }

  arena.addEventListener('click', () => {
    if (started) {
      stopRound();
      started = 0;
    } else {
      startRound();
    }
  });

  arena.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      arena.click();
    }
  });

  root.append(hud, arena, result, actions);
  resetSession();

  function draw(time) {
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, rect.width * dpr);
    canvas.height = Math.max(1, rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#07110d';
    ctx.fillRect(0, 0, width, height);
    const active = Boolean(started);
    const progress = active ? ((time - started) / (target * 1000)) : 0;
    const radius = Math.max(18, Math.min(width, height) * (0.12 + (progress % 1) * 0.26));
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.strokeStyle = active ? '#f6c35b' : '#9be7c2';
    ctx.lineWidth = 10;
    ctx.stroke();
    if (active && !reducedMotion) requestAnimationFrame(draw);
  }
}

function labelCategory(value) {
  if (value === 'play') return 'Play';
  if (value === 'useful') return 'Useful';
  return 'Experiment';
}
