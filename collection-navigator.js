(() => {
  'use strict';

  const grid = document.querySelector('#app-grid');
  const filters = document.querySelector('.filters');
  if (!grid || !filters || document.querySelector('#collection-navigator')) return;

  const state = {
    query: '',
    sort: 'newest',
    mission: 'all',
    recent: [],
    shortlist: [],
    applying: false
  };

  const MISSIONS = [
    { id: 'all', label: 'Everything', test: () => true },
    { id: 'quick', label: 'Quick start', test: (item) => /tiny|quick|short|minute|prompt|choice|step/.test(item.text) },
    { id: 'systems', label: 'Systems strategy', test: (item) => /strategy|simulation|resource|budget|tradeoff|progression|dispatch|control/.test(item.text) },
    { id: 'spatial', label: 'Spatial play', test: (item) => /canvas|spatial|route|grid|fold|map|navigation|drag|pointer/.test(item.text) },
    { id: 'creative', label: 'Creative studio', test: (item) => /music|audio|story|writing|design|studio|rhythm|art|foley|choreo/.test(item.text) },
    { id: 'calm', label: 'Low pressure', test: (item) => !/panic|rush|crisis|rescue|fire|blackout|emergency/.test(item.text) }
  ];

  const normalize = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const nav = document.createElement('section');
  nav.id = 'collection-navigator';
  nav.className = 'collection-navigator';
  nav.setAttribute('aria-label', 'Find an app');
  nav.innerHTML = `
    <div class="navigator-search">
      <label for="app-search">Search the collection</label>
      <div class="navigator-search-row">
        <input id="app-search" type="search" autocomplete="off" placeholder="Try navigation, music, writing…" aria-describedby="navigator-help">
        <button class="button button-secondary" type="button" data-surprise>Surprise me</button>
      </div>
      <p id="navigator-help" class="navigator-help">Search by name, theme, mechanic, or description. Press / to jump here.</p>
    </div>
    <div class="navigator-options">
      <label for="app-sort">Sort</label>
      <select id="app-sort">
        <option value="newest">Newest first</option>
        <option value="az">Name A–Z</option>
        <option value="category">Category</option>
        <option value="relevance">Best match</option>
      </select>
      <p class="navigator-count" aria-live="polite"><strong data-visible-count>0</strong> apps visible</p>
    </div>
    <div class="navigator-missions" aria-label="Discovery missions">
      <span>Discovery mission</span>
      <div role="group" data-missions></div>
    </div>
    <div class="navigator-recent" hidden>
      <span>Opened this session</span>
      <div data-recent-list></div>
    </div>
    <section class="navigator-shortlist" hidden aria-labelledby="shortlist-title">
      <div>
        <span id="shortlist-title">Compare shortlist</span>
        <p>Keep up to three apps while you browse.</p>
      </div>
      <div class="navigator-shortlist-items" data-shortlist-list></div>
      <button type="button" class="navigator-clear" data-clear-shortlist>Clear</button>
    </section>`;

  filters.parentElement.insertAdjacentElement('afterend', nav);

  const search = nav.querySelector('#app-search');
  const sort = nav.querySelector('#app-sort');
  const count = nav.querySelector('[data-visible-count]');
  const recentWrap = nav.querySelector('.navigator-recent');
  const recentList = nav.querySelector('[data-recent-list]');
  const missionList = nav.querySelector('[data-missions]');
  const shortlistWrap = nav.querySelector('.navigator-shortlist');
  const shortlistList = nav.querySelector('[data-shortlist-list]');

  MISSIONS.forEach((mission) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'navigator-chip';
    button.dataset.mission = mission.id;
    button.setAttribute('aria-pressed', mission.id === state.mission ? 'true' : 'false');
    button.textContent = mission.label;
    button.addEventListener('click', () => {
      state.mission = mission.id;
      missionList.querySelectorAll('[data-mission]').forEach((candidate) => {
        candidate.setAttribute('aria-pressed', String(candidate === button));
      });
      apply();
    });
    missionList.append(button);
  });

  function cards() {
    return [...grid.querySelectorAll('.app-card')];
  }

  function cardData(card, index) {
    const button = card.querySelector('.app-card-button');
    const name = card.querySelector('.app-name')?.textContent?.trim() || 'Untitled app';
    const summary = card.querySelector('.app-summary')?.textContent?.trim() || '';
    const meta = card.querySelector('.app-meta')?.textContent?.trim() || '';
    const category = card.dataset.category || meta.split('·')[0]?.trim() || '';
    const id = card.dataset.navigatorId || normalize(name) || `app-${index}`;
    const text = normalize(`${name} ${summary} ${meta} ${category}`);
    return { card, button, index, name, summary, meta, category, id, text };
  }

  function activeCategoryAllows(card) {
    const active = document.querySelector('.filter.is-active')?.dataset.filter || 'all';
    if (active === 'all') return true;
    return card.dataset.category === active ||
      normalize(card.querySelector('.app-meta')?.textContent).startsWith(active);
  }

  function relevance(item, terms) {
    if (!terms.length) return 0;
    let score = 0;
    terms.forEach((term) => {
      if (normalize(item.name).includes(term)) score += 8;
      if (normalize(item.meta).includes(term)) score += 4;
      if (normalize(item.summary).includes(term)) score += 2;
    });
    return score;
  }

  function ensureShortlistControl(item) {
    let button = item.card.querySelector('.navigator-shortlist-toggle');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'navigator-shortlist-toggle';
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleShortlist(item.id);
      });
      item.card.append(button);
    }
    const selected = state.shortlist.includes(item.id);
    button.dataset.appId = item.id;
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `${selected ? 'Remove' : 'Add'} ${item.name} ${selected ? 'from' : 'to'} compare shortlist`);
    button.textContent = selected ? 'Shortlisted' : 'Compare';
  }

  function apply() {
    if (state.applying) return;
    state.applying = true;
    const terms = normalize(state.query).split(' ').filter(Boolean);
    const mission = MISSIONS.find((entry) => entry.id === state.mission) || MISSIONS[0];
    const items = cards().map(cardData);

    items.forEach((item) => {
      item.card.dataset.navigatorId = item.id;
      item.score = relevance(item, terms);
      const queryMatch = !terms.length || terms.every((term) => item.text.includes(term));
      item.match = activeCategoryAllows(item.card) && queryMatch && mission.test(item);
      item.card.hidden = !item.match;
      ensureShortlistControl(item);
      if (item.button && !item.button.dataset.navigatorBound) {
        item.button.dataset.navigatorBound = '1';
        item.button.addEventListener('click', () => remember(item));
      }
    });

    const sorted = [...items].sort((a, b) => {
      if (state.sort === 'az') return a.name.localeCompare(b.name);
      if (state.sort === 'category') return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      if (state.sort === 'relevance') return b.score - a.score || b.index - a.index;
      return b.index - a.index;
    });

    const fragment = document.createDocumentFragment();
    sorted.forEach((item) => fragment.append(item.card));
    grid.append(fragment);
    count.textContent = String(items.filter((item) => item.match).length);
    grid.dataset.navigatorReady = 'true';
    state.applying = false;
    renderShortlist();
  }

  function remember(item) {
    state.recent = [
      { id: item.id, name: item.name },
      ...state.recent.filter((entry) => entry.id !== item.id)
    ].slice(0, 5);
    renderRecent();
  }

  function renderRecent() {
    recentWrap.hidden = state.recent.length === 0;
    recentList.replaceChildren();
    state.recent.forEach((entry) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'navigator-chip';
      button.textContent = entry.name;
      button.addEventListener('click', () => {
        const card = cards().find((candidate) => candidate.dataset.navigatorId === entry.id);
        card?.querySelector('.app-card-button')?.click();
      });
      recentList.append(button);
    });
  }

  function toggleShortlist(id) {
    if (state.shortlist.includes(id)) {
      state.shortlist = state.shortlist.filter((entry) => entry !== id);
    } else if (state.shortlist.length < 3) {
      state.shortlist = [...state.shortlist, id];
    } else {
      announce('Shortlist full. Remove one app before adding another.');
      return;
    }
    apply();
  }

  function renderShortlist() {
    const items = cards().map(cardData).filter((item) => state.shortlist.includes(item.id));
    shortlistWrap.hidden = items.length === 0;
    shortlistList.replaceChildren();
    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'navigator-shortlist-card';
      card.innerHTML = `<strong></strong><span></span><div></div>`;
      card.querySelector('strong').textContent = item.name;
      card.querySelector('span').textContent = item.meta;
      const actions = card.querySelector('div');
      const open = document.createElement('button');
      open.type = 'button';
      open.textContent = 'Open';
      open.addEventListener('click', () => item.button?.click());
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => toggleShortlist(item.id));
      actions.append(open, remove);
      shortlistList.append(card);
    });
  }

  function announce(message) {
    const node = nav.querySelector('.navigator-count');
    node.dataset.message = message;
    node.setAttribute('aria-label', message);
    setTimeout(() => {
      delete node.dataset.message;
      node.removeAttribute('aria-label');
    }, 1400);
  }

  function surprise() {
    const recentIds = new Set(state.recent.map((entry) => entry.id));
    const visible = cards().filter((card) => !card.hidden);
    const fresh = visible.filter((card) => !recentIds.has(card.dataset.navigatorId));
    const available = fresh.length ? fresh : visible;

    if (!available.length) {
      search.value = '';
      state.query = '';
      state.mission = 'all';
      missionList.querySelectorAll('[data-mission]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.mission === 'all'));
      });
      apply();
      return surprise();
    }

    const card = available[Math.floor(Math.random() * available.length)];
    card.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center'
    });
    card.querySelector('.app-card-button')?.focus({ preventScroll: true });
    card.classList.add('is-surprise');
    setTimeout(() => card.classList.remove('is-surprise'), 900);
  }

  search.addEventListener('input', () => {
    state.query = search.value;
    if (state.query && state.sort === 'newest') {
      state.sort = 'relevance';
      sort.value = 'relevance';
    }
    apply();
  });

  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && search.value) {
      search.value = '';
      state.query = '';
      apply();
    }
  });

  sort.addEventListener('change', () => {
    state.sort = sort.value;
    apply();
  });

  nav.querySelector('[data-surprise]').addEventListener('click', surprise);
  nav.querySelector('[data-clear-shortlist]').addEventListener('click', () => {
    state.shortlist = [];
    apply();
  });

  document.querySelectorAll('.filter').forEach((button) => {
    button.addEventListener('click', () => setTimeout(apply, 0));
  });

  document.addEventListener('keydown', (event) => {
    const tag = event.target?.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable;
    if (event.key === '/' && !typing) {
      event.preventDefault();
      search.focus();
    }
    if ((event.key === 's' || event.key === 'S') && !typing && !document.querySelector('#app-dialog')?.open) {
      surprise();
    }
  });

  let queued = false;
  const observer = new MutationObserver(() => {
    if (state.applying || queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  });

  observer.observe(grid, { childList: true });
  apply();
})();