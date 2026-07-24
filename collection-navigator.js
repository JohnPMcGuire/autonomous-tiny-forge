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
    applying: false,
    destroyed: false
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
  const cleanup = [];

  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    cleanup.push(() => target.removeEventListener(type, handler, options));
  };

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
    return card.dataset.category === active || normalize(card.querySelector('.app-meta')?.textContent).startsWith(active);
  }

  function relevance(item, terms) {
    return terms.reduce((score, term) => {
      if (normalize(item.name).includes(term)) score += 8;
      if (normalize(item.meta).includes(term)) score += 4;
      if (normalize(item.summary).includes(term)) score += 2;
      return score;
    }, 0);
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

  function ensureShortlistControl(item) {
    let button = item.card.querySelector('.navigator-shortlist-toggle');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'navigator-shortlist-toggle';
      listen(button, 'click', (event) => {
        event.stopPropagation();
        toggleShortlist(button.dataset.appId);
      });
      item.card.append(button);
    }
    const selected = state.shortlist.includes(item.id);
    button.dataset.appId = item.id;
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `${selected ? 'Remove' : 'Add'} ${item.name} ${selected ? 'from' : 'to'} compare shortlist`);
    button.textContent = selected ? 'Shortlisted' : 'Compare';
  }

  function remember(item) {
    state.recent = [{ id: item.id, name: item.name }, ...state.recent.filter((entry) => entry.id !== item.id)].slice(0, 5);
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
      listen(button, 'click', () => {
        cards().find((candidate) => candidate.dataset.navigatorId === entry.id)
          ?.querySelector('.app-card-button')?.click();
      });
      recentList.append(button);
    });
  }

  function renderShortlist() {
    const items = cards().map(cardData).filter((item) => state.shortlist.includes(item.id));
    shortlistWrap.hidden = items.length === 0;
    shortlistList.replaceChildren();
    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'navigator-shortlist-card';
      card.innerHTML = '<strong></strong><span></span><div></div>';
      card.querySelector('strong').textContent = item.name;
      card.querySelector('span').textContent = item.meta;
      const actions = card.querySelector('div');
      const open = document.createElement('button');
      open.type = 'button';
      open.textContent = 'Open';
      listen(open, 'click', () => item.button?.click());
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      listen(remove, 'click', () => toggleShortlist(item.id));
      actions.append(open, remove);
      shortlistList.append(card);
    });
  }

  function apply() {
    if (state.applying || state.destroyed) return;
    state.applying = true;
    try {
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
          listen(item.button, 'click', () => remember(cardData(item.card, item.index)));
        }
      });

      const sorted = [...items].sort((a, b) => {
        if (state.sort === 'az') return a.name.localeCompare(b.name);
        if (state.sort === 'category') return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
        if (state.sort === 'relevance') return b.score - a.score || b.index - a.index;
        return b.index - a.index;
      });

      const orderChanged = sorted.some((item, index) => grid.children[index] !== item.card);
      if (orderChanged) {
        const fragment = document.createDocumentFragment();
        sorted.forEach((item) => fragment.append(item.card));
        grid.append(fragment);
      }

      count.textContent = String(items.filter((item) => item.match).length);
      grid.dataset.navigatorReady = 'true';
      renderShortlist();
    } finally {
      state.applying = false;
    }
  }

  function announce(message) {
    const node = nav.querySelector('.navigator-count');
    node.dataset.message = message;
    node.setAttribute('aria-label', message);
    const timer = window.setTimeout(() => {
      delete node.dataset.message;
      node.removeAttribute('aria-label');
    }, 1400);
    cleanup.push(() => window.clearTimeout(timer));
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
    const timer = window.setTimeout(() => card.classList.remove('is-surprise'), 900);
    cleanup.push(() => window.clearTimeout(timer));
  }

  MISSIONS.forEach((mission) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'navigator-chip';
    button.dataset.mission = mission.id;
    button.setAttribute('aria-pressed', String(mission.id === state.mission));
    button.textContent = mission.label;
    listen(button, 'click', () => {
      state.mission = mission.id;
      missionList.querySelectorAll('[data-mission]').forEach((candidate) => {
        candidate.setAttribute('aria-pressed', String(candidate === button));
      });
      apply();
    });
    missionList.append(button);
  });

  listen(search, 'input', () => {
    state.query = search.value;
    if (state.query && state.sort === 'newest') {
      state.sort = 'relevance';
      sort.value = 'relevance';
    }
    apply();
  });

  listen(search, 'keydown', (event) => {
    if (event.key === 'Escape' && search.value) {
      search.value = '';
      state.query = '';
      apply();
    }
  });

  listen(sort, 'change', () => {
    state.sort = sort.value;
    apply();
  });

  listen(nav.querySelector('[data-surprise]'), 'click', surprise);
  listen(nav.querySelector('[data-clear-shortlist]'), 'click', () => {
    state.shortlist = [];
    apply();
  });

  document.querySelectorAll('.filter').forEach((button) => {
    listen(button, 'click', () => window.setTimeout(apply, 0));
  });

  const handleKeyboard = (event) => {
    const tag = event.target?.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable;
    if (event.key === '/' && !typing) {
      event.preventDefault();
      search.focus();
    }
    if ((event.key === 's' || event.key === 'S') && !typing && !document.querySelector('#app-dialog')?.open) {
      surprise();
    }
  };
  listen(document, 'keydown', handleKeyboard);

  let queued = false;
  let frame = 0;
  const observer = new MutationObserver((mutations) => {
    if (state.applying || queued || state.destroyed) return;
    const hasNewCards = mutations.some((mutation) => [...mutation.addedNodes]
      .some((node) => node.nodeType === Node.ELEMENT_NODE && (node.matches?.('.app-card') || node.querySelector?.('.app-card'))));
    if (!hasNewCards) return;
    queued = true;
    frame = requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  });

  observer.observe(grid, { childList: true });
  cleanup.push(() => observer.disconnect());
  cleanup.push(() => cancelAnimationFrame(frame));

  const teardown = () => {
    if (state.destroyed) return;
    state.destroyed = true;
    while (cleanup.length) cleanup.pop()();
  };
  listen(window, 'pagehide', teardown, { once: true });

  apply();
})();