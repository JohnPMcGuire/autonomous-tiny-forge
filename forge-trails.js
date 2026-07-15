(() => {
  'use strict';

  const gallery = document.querySelector('#gallery');
  const grid = document.querySelector('#app-grid');
  if (!gallery || !grid) return;

  const routes = {
    strategist: {
      name: 'Systems strategist',
      description: 'Four stops built around tradeoffs, planning, and recovery.',
      categories: ['useful', 'play', 'experiment', 'useful'],
      prompts: ['Find the constraint that changes your first instinct.', 'Spend one scarce resource before you feel ready.', 'Recover from one harmless failure instead of restarting.', 'Name the signal that would make you change course.']
    },
    maker: {
      name: 'Creative maker',
      description: 'Move from playful combinations to a finished miniature idea.',
      categories: ['experiment', 'play', 'useful', 'experiment'],
      prompts: ['Combine two things that normally do not belong together.', 'Use motion, timing, or space as part of the idea.', 'Turn the strongest result into one practical next step.', 'Remix the result by changing only one rule.']
    },
    explorer: {
      name: 'Curious explorer',
      description: 'A varied route through pattern, place, timing, and surprise.',
      categories: ['play', 'experiment', 'play', 'useful'],
      prompts: ['Learn the rule by observing before acting.', 'Choose the unfamiliar option rather than the safest one.', 'Try a second run with a different strategy.', 'Carry one insight into a useful tool.']
    }
  };

  const state = { apps: [], routeKey: '', step: 0, completed: [], picks: [], lastFocus: null };
  const root = document.createElement('section');
  root.className = 'forge-trails';
  root.setAttribute('aria-labelledby', 'forge-trails-title');
  root.innerHTML = `
    <div class="forge-trails__head">
      <div>
        <p class="eyebrow">Guided discovery</p>
        <h3 id="forge-trails-title">Take a four-stop Forge Trail</h3>
        <p>Choose a route, open a recommended app, then return to mark the stop complete. Each trail branches through the collection without saving or transmitting your activity.</p>
      </div>
      <button class="trail-action forge-trails__reset" type="button" hidden>Reset trail</button>
    </div>
    <div class="forge-trails__routes" role="group" aria-label="Choose a Forge Trail"></div>
    <div class="forge-trails__journey" hidden aria-live="polite"></div>
  `;

  const radar = gallery.querySelector('.release-radar');
  if (radar) radar.after(root); else grid.before(root);

  const routeList = root.querySelector('.forge-trails__routes');
  const journey = root.querySelector('.forge-trails__journey');
  const reset = root.querySelector('.forge-trails__reset');

  Object.entries(routes).forEach(([key, route]) => {
    const button = document.createElement('button');
    button.className = 'trail-route';
    button.type = 'button';
    button.dataset.route = key;
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = `<strong>${route.name}</strong><span>${route.description}</span>`;
    routeList.append(button);
  });

  function shuffled(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function buildPicks(route) {
    const unused = new Set();
    return route.categories.map((category) => {
      const preferred = state.apps.filter((app) => app.category === category && !unused.has(app.id));
      const pool = preferred.length ? preferred : state.apps.filter((app) => !unused.has(app.id));
      const pick = shuffled(pool)[0];
      if (pick) unused.add(pick.id);
      return pick;
    });
  }

  function selectRoute(key) {
    if (!routes[key] || !state.apps.length) return;
    state.routeKey = key;
    state.step = 0;
    state.completed = [];
    state.picks = buildPicks(routes[key]);
    routeList.querySelectorAll('.trail-route').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.route === key));
    });
    reset.hidden = false;
    render();
  }

  function openCurrent() {
    const app = state.picks[state.step];
    if (!app) return;
    state.lastFocus = document.activeElement;
    const card = [...grid.querySelectorAll('.app-card')].find((item) => item.querySelector('.app-name')?.textContent?.trim() === app.name);
    if (card?.hidden) card.hidden = false;
    const opener = card?.querySelector('.app-card-button');
    if (opener) {
      opener.click();
      return;
    }
    const search = document.querySelector('#radar-search');
    if (search) {
      search.value = app.name;
      search.dispatchEvent(new Event('input', { bubbles: true }));
      grid.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function completeCurrent() {
    const app = state.picks[state.step];
    if (!app || state.completed.includes(app.id)) return;
    state.completed.push(app.id);
    state.step += 1;
    render();
  }

  function swapCurrent() {
    const route = routes[state.routeKey];
    const category = route.categories[state.step];
    const used = new Set(state.picks.map((app) => app?.id));
    const choices = shuffled(state.apps.filter((app) => app.category === category && !used.has(app.id)));
    if (!choices.length) return;
    state.picks[state.step] = choices[0];
    render();
  }

  function render() {
    if (!state.routeKey) {
      journey.hidden = true;
      return;
    }
    journey.hidden = false;
    const route = routes[state.routeKey];
    if (state.step >= 4) {
      journey.innerHTML = `
        <div class="trail-summary">
          <p class="eyebrow">Trail complete</p>
          <h4>${route.name} finished</h4>
          <p>You crossed four different parts of the collection. Start another trail for a new randomized route.</p>
          <div class="trail-stamps">${state.picks.map((app, index) => `<span class="trail-stamp">${index + 1}. ${app.name}</span>`).join('')}</div>
          <div><button class="trail-action trail-action--primary" type="button" data-action="again">Build another route</button></div>
        </div>`;
      return;
    }

    const app = state.picks[state.step];
    const progress = [0, 1, 2, 3].map((index) => {
      const status = index < state.step ? 'is-complete' : index === state.step ? 'is-current' : '';
      return `<li class="${status}"${index === state.step ? ' aria-current="step"' : ''}>Stop ${index + 1}</li>`;
    }).join('');
    const unlock = state.step >= 2 ? '<div class="trail-unlock">Trail insight unlocked: compare how two apps handle failure, recovery, or choice differently.</div>' : '';
    journey.innerHTML = `
      <ol class="trail-progress">${progress}</ol>
      <div class="trail-card">
        <div>
          <p class="eyebrow">${route.name} · stop ${state.step + 1} of 4</p>
          <h4>${app.name}</h4>
          <p>${app.summary}</p>
          <p class="trail-prompt">Trail challenge: ${route.prompts[state.step]}</p>
          ${unlock}
        </div>
        <div class="trail-actions">
          <button class="trail-action" type="button" data-action="swap">Swap stop</button>
          <button class="trail-action trail-action--primary" type="button" data-action="open">Open app</button>
          <button class="trail-action" type="button" data-action="complete">Mark tried</button>
        </div>
      </div>`;
  }

  routeList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-route]');
    if (button) selectRoute(button.dataset.route);
  });
  journey.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'open') openCurrent();
    if (action === 'complete') completeCurrent();
    if (action === 'swap') swapCurrent();
    if (action === 'again') selectRoute(state.routeKey);
  });
  reset.addEventListener('click', () => {
    state.routeKey = '';
    state.step = 0;
    state.completed = [];
    state.picks = [];
    reset.hidden = true;
    routeList.querySelectorAll('.trail-route').forEach((button) => button.setAttribute('aria-pressed', 'false'));
    render();
    routeList.querySelector('.trail-route')?.focus();
  });

  fetch('./registry/apps.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`Registry returned ${response.status}`);
      return response.json();
    })
    .then((data) => {
      state.apps = Array.isArray(data.apps) ? data.apps.filter((app) => app.id && app.name && app.summary && app.category) : [];
      if (state.apps.length < 4) throw new Error('Not enough apps to build a trail');
    })
    .catch((error) => {
      routeList.innerHTML = '<p>The guided trails could not load. The full gallery remains available below.</p>';
      console.error(error);
    });

  window.addEventListener('pagehide', () => {
    state.apps = [];
    state.picks = [];
    state.completed = [];
  }, { once: true });
})();
