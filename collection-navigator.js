(() => {
  'use strict';

  const gameScript = document.createElement('script');
  gameScript.src = './trackline-ranger.js';
  gameScript.defer = true;
  document.head.append(gameScript);

  const grid = document.querySelector('#app-grid');
  const filters = document.querySelector('.filters');
  if (!grid || !filters || document.querySelector('#collection-navigator')) return;

  const state = { query: '', sort: 'newest', recent: [], applying: false };
  const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  const nav = document.createElement('section');
  nav.id = 'collection-navigator';
  nav.className = 'collection-navigator';
  nav.setAttribute('aria-label', 'Find an app');
  nav.innerHTML = `
    <div class="navigator-search">
      <label for="app-search">Search the collection</label>
      <div class="navigator-search-row">
        <input id="app-search" type="search" autocomplete="off" placeholder="Try navigation, music, writing…">
        <button class="button button-secondary" type="button" data-surprise>Surprise me</button>
      </div>
    </div>
    <div class="navigator-options">
      <label for="app-sort">Sort</label>
      <select id="app-sort">
        <option value="newest">Newest first</option>
        <option value="az">Name A–Z</option>
        <option value="category">Category</option>
      </select>
      <p class="navigator-count" aria-live="polite"><strong data-visible-count>0</strong> apps visible</p>
    </div>
    <div class="navigator-recent" hidden>
      <span>Opened this session</span>
      <div data-recent-list></div>
    </div>`;
  filters.parentElement.insertAdjacentElement('afterend', nav);

  const search = nav.querySelector('#app-search');
  const sort = nav.querySelector('#app-sort');
  const count = nav.querySelector('[data-visible-count]');
  const recentWrap = nav.querySelector('.navigator-recent');
  const recentList = nav.querySelector('[data-recent-list]');
  const cards = () => [...grid.querySelectorAll('.app-card')];

  function cardData(card, index) {
    const button = card.querySelector('.app-card-button');
    return { card, button, index, name: card.querySelector('.app-name')?.textContent?.trim() || 'Untitled app', summary: card.querySelector('.app-summary')?.textContent?.trim() || '', meta: card.querySelector('.app-meta')?.textContent?.trim() || '', category: card.dataset.category || card.querySelector('.app-meta')?.textContent?.split('·')[0]?.trim() || '', id: card.dataset.navigatorId || `app-${index}` };
  }

  function activeCategoryAllows(card) {
    const active = document.querySelector('.filter.is-active')?.dataset.filter || 'all';
    return active === 'all' || card.dataset.category === active || normalize(card.querySelector('.app-meta')?.textContent).startsWith(active);
  }

  function apply() {
    if (state.applying) return;
    state.applying = true;
    const query = normalize(state.query);
    const items = cards().map(cardData);
    items.forEach((item) => {
      item.card.dataset.navigatorId = item.id;
      item.match = activeCategoryAllows(item.card) && (!query || normalize(`${item.name} ${item.summary} ${item.meta}`).includes(query));
      item.card.hidden = !item.match;
      if (item.button && !item.button.dataset.navigatorBound) {
        item.button.dataset.navigatorBound = '1';
        item.button.addEventListener('click', () => remember(item));
      }
    });
    const sorted = [...items].sort((a, b) => state.sort === 'az' ? a.name.localeCompare(b.name) : state.sort === 'category' ? a.category.localeCompare(b.category) || a.name.localeCompare(b.name) : b.index - a.index);
    const fragment = document.createDocumentFragment();
    sorted.forEach((item) => fragment.append(item.card));
    grid.append(fragment);
    count.textContent = String(items.filter((item) => item.match).length);
    grid.dataset.navigatorReady = 'true';
    state.applying = false;
  }

  function remember(item) {
    state.recent = [{ id: item.id, name: item.name }, ...state.recent.filter((entry) => entry.id !== item.id)].slice(0, 5);
    recentWrap.hidden = false;
    recentList.replaceChildren();
    state.recent.forEach((entry) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'navigator-chip';
      button.textContent = entry.name;
      button.addEventListener('click', () => cards().find((candidate) => candidate.dataset.navigatorId === entry.id)?.querySelector('.app-card-button')?.click());
      recentList.append(button);
    });
  }

  function surprise() {
    const available = cards().filter((card) => !card.hidden);
    if (!available.length) { search.value = ''; state.query = ''; apply(); return surprise(); }
    const card = available[Math.floor(Math.random() * available.length)];
    card.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    card.querySelector('.app-card-button')?.focus({ preventScroll: true });
    card.classList.add('is-surprise');
    setTimeout(() => card.classList.remove('is-surprise'), 900);
  }

  search.addEventListener('input', () => { state.query = search.value; apply(); });
  search.addEventListener('keydown', (event) => { if (event.key === 'Escape' && search.value) { search.value = ''; state.query = ''; apply(); } });
  sort.addEventListener('change', () => { state.sort = sort.value; apply(); });
  nav.querySelector('[data-surprise]').addEventListener('click', surprise);
  document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => setTimeout(apply, 0)));

  let queued = false;
  const observer = new MutationObserver(() => {
    if (state.applying || queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  });
  observer.observe(grid, { childList: true });
  apply();
})();
