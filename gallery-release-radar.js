(() => {
  'use strict';

  const grid = document.querySelector('#app-grid');
  const gallery = document.querySelector('#gallery');
  const dialogCategory = document.querySelector('#dialog-category');
  if (!grid || !gallery) return;

  const state = {
    apps: [],
    byName: new Map(),
    query: '',
    recency: 'all',
    sort: 'updated',
    observer: null,
    rendering: false
  };

  const controls = document.createElement('section');
  controls.className = 'release-radar';
  controls.setAttribute('aria-labelledby', 'release-radar-title');
  controls.innerHTML = `
    <div class="release-radar-copy">
      <p class="eyebrow">Release radar</p>
      <h3 id="release-radar-title">Find what is new, changed, or worth revisiting</h3>
      <p>Search the collection, narrow it by update window, or sort by release activity.</p>
    </div>
    <div class="release-radar-controls">
      <label>
        <span>Search apps</span>
        <input id="radar-search" type="search" autocomplete="off" placeholder="Name, purpose, or mechanic">
      </label>
      <label>
        <span>Updated</span>
        <select id="radar-recency">
          <option value="all">Any time</option>
          <option value="3">Last 3 days</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </label>
      <label>
        <span>Sort</span>
        <select id="radar-sort">
          <option value="updated">Recently updated</option>
          <option value="created">Newest releases</option>
          <option value="name">Name</option>
        </select>
      </label>
    </div>
    <div class="release-radar-summary" id="radar-summary" role="status" aria-live="polite">Loading release history…</div>
  `;
  grid.before(controls);

  const search = controls.querySelector('#radar-search');
  const recency = controls.querySelector('#radar-recency');
  const sort = controls.querySelector('#radar-sort');
  const summary = controls.querySelector('#radar-summary');

  const dateValue = (value) => {
    const parsed = Date.parse(`${value}T00:00:00Z`);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const daysSince = (value) => {
    const elapsed = Date.now() - dateValue(value);
    return Math.max(0, Math.floor(elapsed / 86400000));
  };

  const relativeLabel = (value) => {
    const days = daysSince(value);
    if (days === 0) return 'Updated today';
    if (days === 1) return 'Updated yesterday';
    if (days < 14) return `Updated ${days} days ago`;
    return `Updated ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00Z`))}`;
  };

  const matches = (app) => {
    const needle = state.query.trim().toLowerCase();
    const haystack = `${app.name} ${app.summary} ${app.description} ${app.category} ${app.engine}`.toLowerCase();
    if (needle && !haystack.includes(needle)) return false;
    if (state.recency !== 'all' && daysSince(app.updatedAt) > Number(state.recency)) return false;
    return true;
  };

  const compare = (a, b) => {
    if (state.sort === 'name') return a.name.localeCompare(b.name);
    if (state.sort === 'created') return dateValue(b.createdAt) - dateValue(a.createdAt) || a.name.localeCompare(b.name);
    return dateValue(b.updatedAt) - dateValue(a.updatedAt) || dateValue(b.createdAt) - dateValue(a.createdAt) || a.name.localeCompare(b.name);
  };

  function enhanceCards() {
    if (state.rendering || !state.apps.length) return;
    const cards = [...grid.querySelectorAll('.app-card')];
    if (!cards.length) return;

    state.rendering = true;
    const enhanced = [];
    for (const card of cards) {
      const name = card.querySelector('.app-name')?.textContent?.trim();
      const app = state.byName.get(name);
      if (!app) continue;

      let stamp = card.querySelector('.app-update-stamp');
      if (!stamp) {
        stamp = document.createElement('span');
        stamp.className = 'app-update-stamp';
        card.querySelector('.app-summary')?.after(stamp);
      }
      stamp.textContent = relativeLabel(app.updatedAt);
      stamp.setAttribute('title', `Created ${app.createdAt}; updated ${app.updatedAt}`);
      card.dataset.updatedAt = app.updatedAt;
      card.dataset.createdAt = app.createdAt;
      card.hidden = !matches(app);
      enhanced.push({ card, app });
    }

    enhanced.sort((left, right) => compare(left.app, right.app));
    for (const item of enhanced) grid.append(item.card);

    const visible = enhanced.filter((item) => !item.card.hidden);
    const latest = visible[0]?.app;
    summary.textContent = visible.length
      ? `${visible.length} app${visible.length === 1 ? '' : 's'} shown. ${latest ? `${latest.name} is first in this view and was ${relativeLabel(latest.updatedAt).toLowerCase()}.` : ''}`
      : 'No apps match this release view. Clear the search or broaden the update window.';
    grid.classList.toggle('is-radar-empty', visible.length === 0);
    state.rendering = false;
  }

  function scheduleEnhance() {
    requestAnimationFrame(enhanceCards);
  }

  search.addEventListener('input', () => {
    state.query = search.value;
    enhanceCards();
  });
  recency.addEventListener('change', () => {
    state.recency = recency.value;
    enhanceCards();
  });
  sort.addEventListener('change', () => {
    state.sort = sort.value;
    enhanceCards();
  });

  grid.addEventListener('click', (event) => {
    const card = event.target.closest('.app-card');
    if (!card) return;
    const app = state.byName.get(card.querySelector('.app-name')?.textContent?.trim());
    if (!app || !dialogCategory) return;
    requestAnimationFrame(() => {
      if (!dialogCategory.textContent.includes('Updated')) {
        dialogCategory.textContent += ` · ${relativeLabel(app.updatedAt)}`;
      }
    });
  });

  state.observer = new MutationObserver(scheduleEnhance);
  state.observer.observe(grid, { childList: true });

  fetch('./registry/apps.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`Registry returned ${response.status}`);
      return response.json();
    })
    .then((data) => {
      state.apps = Array.isArray(data.apps) ? data.apps : [];
      state.byName = new Map(state.apps.map((app) => [app.name, app]));
      enhanceCards();
    })
    .catch((error) => {
      summary.textContent = 'Release history could not be loaded. The gallery remains available.';
      console.error(error);
    });

  window.addEventListener('pagehide', () => state.observer?.disconnect(), { once: true });
})();
