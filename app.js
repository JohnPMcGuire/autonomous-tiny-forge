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
  const root = panel(app.config.instructions);
  const min = app.config.minSeconds || 20;
  const max = app.config.maxSeconds || 75;
  let started = 0;
  let target = 0;
  const readout = resultCard();
  readout.innerHTML = '<strong>Ready?</strong><small>Start the hidden timer, then stop it when you think the target time has passed.</small>';
  const button = document.createElement('button');
  button.className = 'big-button';
  button.type = 'button';
  button.textContent = 'Start a round';
  button.addEventListener('click', () => {
    if (!started) {
      target = Math.floor(Math.random() * (max - min + 1)) + min;
      started = performance.now();
      button.textContent = `Stop at ${target} seconds`;
      readout.innerHTML = '<strong>Timer hidden.</strong><small>No peeking. Trust your sense of time.</small>';
    } else {
      const elapsed = (performance.now() - started) / 1000;
      const difference = Math.abs(elapsed - target);
      const direction = elapsed < target ? 'early' : 'late';
      readout.innerHTML = `<strong>${elapsed.toFixed(1)} seconds</strong><small>You were ${difference.toFixed(1)} seconds ${direction}. Target: ${target} seconds.</small>`;
      started = 0;
      button.textContent = 'Try another round';
    }
  });
  root.append(readout, button);
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
