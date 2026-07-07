(() => {
  const APP = {
    name: 'Cargo Loom',
    emoji: '📦',
    category: 'play',
    version: '1.0.0',
    summary: 'Load a shifting cargo deck by balancing weight, contracts, hazards, time, and recovery choices.',
    description: 'A local cargo-loading strategy game with bay balance, fragile and cold-chain cargo, priority contracts, jolts, reroutes, repair tokens, adaptive manifests, session-only express deck unlocks, scoring, responsive SVG/DOM rendering, touch and keyboard controls, reduced-motion behavior, optional local audio, and teardown.'
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const cargoTypes = [
    { id: 'grain', name: 'Grain sacks', weight: 2, value: 12, icon: '🌾', trait: 'steady' },
    { id: 'glass', name: 'Glass crates', weight: 1, value: 22, icon: '◇', trait: 'fragile' },
    { id: 'vaccine', name: 'Cold vials', weight: 1, value: 26, icon: '✚', trait: 'cold' },
    { id: 'parts', name: 'Machine parts', weight: 3, value: 21, icon: '⚙', trait: 'heavy' },
    { id: 'flowers', name: 'Fresh flowers', weight: 1, value: 16, icon: '✿', trait: 'delicate' },
    { id: 'batteries', name: 'Battery pods', weight: 2, value: 24, icon: '▣', trait: 'volatile' }
  ];
  const routes = [
    { name: 'Harbor fog', sway: 2, chill: 2, priority: 'cold', hint: 'Cold cargo pays extra, but fog adds jolts.' },
    { name: 'Festival rush', sway: 3, chill: 1, priority: 'delicate', hint: 'Delicate cargo is valuable, balance is harder.' },
    { name: 'Mountain switchback', sway: 4, chill: 2, priority: 'heavy', hint: 'Heavy cargo stabilizes some bays but punishes imbalance.' },
    { name: 'Night ferry', sway: 2, chill: 3, priority: 'fragile', hint: 'Fragile contracts matter while cold clocks drain faster.' }
  ];

  function style() {
    if ($('#cargo-loom-styles')) return;
    const sheet = document.createElement('style');
    sheet.id = 'cargo-loom-styles';
    sheet.textContent = `.cargo-card{animation:cargo-pop .24s ease both}.cargo-game{max-width:1120px;gap:14px}.cargo-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.cargo-stat,.cargo-board,.cargo-panel,.cargo-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.cargo-stat{padding:10px 12px}.cargo-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.cargo-stat strong{display:block;margin-top:4px}.cargo-layout{display:grid;grid-template-columns:1.05fr .95fr;gap:12px}.cargo-board{min-height:430px;padding:12px;background:linear-gradient(135deg,#f8fafc,#fff7ed)}.cargo-board svg{width:100%;height:286px;display:block}.cargo-bay{cursor:pointer;touch-action:manipulation}.cargo-bay rect{fill:#fff;stroke:#0f172a;stroke-width:2;filter:drop-shadow(0 8px 10px rgba(15,23,42,.1))}.cargo-bay.is-focus rect{stroke:#2563eb;stroke-width:5}.cargo-bay.is-risk rect{fill:#fee2e2;stroke:#ef4444}.cargo-bay text{font-weight:900;text-anchor:middle;dominant-baseline:middle;fill:#0f172a;pointer-events:none}.cargo-crates{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.cargo-crate{border:1px solid var(--line);border-radius:15px;background:#fff;padding:10px;text-align:left;min-height:86px;cursor:pointer;touch-action:manipulation}.cargo-crate[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.cargo-crate strong{display:block}.cargo-crate small{color:var(--muted);display:block}.cargo-panel{padding:14px;display:grid;gap:12px}.cargo-brief{padding:13px;background:#f8fafc}.cargo-brief h3{margin:.2rem 0;font-size:1.25rem}.cargo-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.cargo-actions button{min-height:44px}.cargo-bars{display:grid;gap:8px}.cargo-bar{display:grid;grid-template-columns:90px 1fr 44px;gap:8px;align-items:center;font-size:.8rem;font-weight:800}.cargo-track{height:10px;border-radius:999px;background:#e2e8f0;overflow:hidden}.cargo-track span{display:block;height:100%;width:0;background:linear-gradient(90deg,#22c55e,#f59e0b,#ef4444)}.cargo-log{min-height:112px;padding:17px 19px}.cargo-tags{display:flex;flex-wrap:wrap;gap:6px}.cargo-tags span{border:1px solid var(--line);border-radius:999px;padding:4px 8px;background:#fff;font-size:.76rem;font-weight:800}.cargo-slot{font-size:12px;font-weight:900;fill:#0f172a}.cargo-load{fill:#fde68a;stroke:#92400e;stroke-width:1}.cargo-chill{fill:#dbeafe;stroke:#1d4ed8;stroke-width:1}.cargo-damage{fill:#fecaca;stroke:#b91c1c;stroke-width:1}.cargo-pulse{fill:none;stroke:#f97316;stroke-width:3;opacity:.5;animation:cargo-ring 1.6s ease-out infinite}@media(max-width:860px){.cargo-hud{grid-template-columns:repeat(2,1fr)}.cargo-layout{grid-template-columns:1fr}.cargo-board svg{height:245px}.cargo-actions,.cargo-crates{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.cargo-card,.cargo-pulse{animation:none;transition:none}}@keyframes cargo-pop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes cargo-ring{from{r:12;opacity:.55}to{r:30;opacity:0}}`;
    document.head.append(sheet);
  }

  function addCard() {
    const grid = $('#app-grid');
    const template = $('#app-card-template');
    if (!grid || !template || $('[data-cargo-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    style();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.cargoCard = 'true';
    card.classList.add('cargo-card');
    $('.app-icon', node).textContent = APP.emoji;
    $('.app-meta', node).textContent = `${label(APP.category)} · v${APP.version}`;
    $('.app-name', node).textContent = APP.name;
    $('.app-summary', node).textContent = APP.summary;
    const button = $('.app-card-button', node);
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', open);
    grid.append(node);
  }

  function boot() {
    style();
    let tries = 0;
    const retry = () => { addCard(); if (!$('[data-cargo-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.cargoRefresh) return;
      button.dataset.cargoRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog');
    const stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Cargo%20Loom';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel cargo-game';
    root.innerHTML = `<div class="cargo-hud"><div class="cargo-stat"><span>Run</span><strong id="cl-round">1 / 5</strong></div><div class="cargo-stat"><span>Time</span><strong id="cl-time">9</strong></div><div class="cargo-stat"><span>Balance</span><strong id="cl-balance">0</strong></div><div class="cargo-stat"><span>Damage</span><strong id="cl-damage">0</strong></div><div class="cargo-stat"><span>Score</span><strong id="cl-score">0</strong></div><div class="cargo-stat"><span>Best</span><strong id="cl-best">0</strong></div></div><div class="cargo-layout"><div class="cargo-board"><svg viewBox="0 0 100 72" role="img" aria-label="Cargo deck with left, center, and right bays"></svg><div class="cargo-crates" aria-label="Available cargo"></div></div><div class="cargo-panel"><div class="cargo-brief"></div><div class="cargo-bars"></div><div class="cargo-actions"><button class="button" type="button" data-act="load">Load selected</button><button class="button button-secondary" type="button" data-act="inspect">Inspect straps</button><button class="button button-secondary" type="button" data-act="chill">Spend coolant</button><button class="button button-secondary" type="button" data-act="repair">Patch damage</button><button class="button button-secondary" type="button" data-act="sound">Sound off</button><button class="button button-secondary" type="button" data-act="new">New manifest</button></div></div></div><div class="result-card cargo-log" aria-live="polite"></div>`;
    stage.append(root);
    const svg = $('svg', root);
    const crates = $('.cargo-crates', root);
    const brief = $('.cargo-brief', root);
    const bars = $('.cargo-bars', root);
    const log = $('.cargo-log', root);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bays = ['left', 'center', 'right'];
    const st = { round: 1, rounds: 5, time: 9, score: 0, best: 0, damage: 0, coolant: 2, repairs: 2, straps: 1, focus: 'center', selected: 0, route: routes[0], manifest: [], loaded: { left: [], center: [], right: [] }, express: false, over: false, audio: false, ac: null };
    const total = (bay) => st.loaded[bay].reduce((sum, item) => sum + item.weight, 0);
    const allLoaded = () => bays.flatMap((bay) => st.loaded[bay]);
    const balance = () => Math.abs(total('left') - total('right')) + Math.max(0, total('center') - 6);
    const capacityRisk = () => bays.reduce((sum, bay) => sum + Math.max(0, total(bay) - (bay === 'center' ? 7 : 5)), 0);
    const priorityCount = () => allLoaded().filter((item) => item.trait === st.route.priority).length;

    function start(keepUnlock = st.express) {
      st.route = routes[Math.floor(Math.random() * routes.length)];
      st.time = keepUnlock ? 8 : 9;
      st.damage = 0;
      st.coolant = 2;
      st.repairs = 2;
      st.straps = 1;
      st.focus = 'center';
      st.selected = 0;
      st.over = false;
      st.express = keepUnlock;
      st.loaded = { left: [], center: [], right: [] };
      st.manifest = makeManifest(keepUnlock ? 7 : 6);
      note('Choose cargo, choose a bay, then load. Balance the deck before the route jolts it.');
      render();
    }

    function makeManifest(count) {
      return Array.from({ length: count }, (_, i) => {
        const base = cargoTypes[(Math.floor(Math.random() * cargoTypes.length) + i) % cargoTypes.length];
        const urgent = Math.random() > 0.62;
        return { ...base, key: `${base.id}-${Date.now()}-${i}`, urgent, value: base.value + (urgent ? 9 : 0) };
      });
    }

    function currentCargo() { return st.manifest[st.selected]; }

    function act(kind) {
      if (st.over && kind !== 'sound') return start(st.express);
      if (kind === 'new') return start(st.express);
      if (kind === 'sound') return toggleSound();
      if (kind === 'load') loadCargo();
      if (kind === 'inspect') inspect();
      if (kind === 'chill') chill();
      if (kind === 'repair') repair();
      render();
    }

    function loadCargo() {
      const item = currentCargo();
      if (!item) { note('Manifest is empty. Dispatch the run or start a new manifest.'); return; }
      if (st.time <= 0) { finish(); return; }
      st.loaded[st.focus].push(item);
      st.manifest.splice(st.selected, 1);
      st.selected = Math.max(0, Math.min(st.selected, st.manifest.length - 1));
      st.time -= item.urgent ? 2 : 1;
      st.score += item.value + (item.trait === st.route.priority ? 10 : 0);
      const risk = balance() + capacityRisk() + st.route.sway;
      if (risk > 7) st.damage += Math.ceil((risk - 6) / 2);
      if (item.trait === 'cold') st.coolant = Math.max(0, st.coolant - 1);
      if (item.trait === 'fragile' && risk > 5) st.damage += 3;
      tone(item.trait === st.route.priority ? 760 : 520);
      note(`${item.name} loaded ${st.focus}. ${risk > 7 ? 'The deck groaned from imbalance.' : 'The load held for now.'}`);
      if (!st.manifest.length || st.time <= 0) finish();
    }

    function inspect() {
      if (st.time < 1) { note('No time left to inspect.'); return; }
      st.time -= 1;
      if (st.straps > 0) { st.straps -= 1; st.damage = Math.max(0, st.damage - 4 - priorityCount()); note('Straps tightened. The best contracts make the deck easier to trust.'); tone(640); }
      else { st.damage = Math.max(0, st.damage - 1); note('Quick inspection found only a small adjustment.'); tone(440); }
    }

    function chill() {
      if (st.coolant <= 0) { note('No coolant left. Cold cargo now depends on speed and balance.'); return; }
      st.coolant -= 1;
      st.time = Math.max(0, st.time - 1);
      const saved = allLoaded().filter((item) => item.trait === 'cold').length;
      st.score += saved * 6;
      st.damage = Math.max(0, st.damage - saved);
      note(saved ? `Coolant protected ${saved} cold contract${saved === 1 ? '' : 's'}.` : 'Coolant staged for the next cold crate.');
      tone(680);
    }

    function repair() {
      if (st.repairs <= 0) { note('No repair tokens left. Dispatch carefully.'); return; }
      st.repairs -= 1;
      st.time = Math.max(0, st.time - 1);
      st.damage = Math.max(0, st.damage - 6);
      note('Patch crew absorbed damage, but the dispatch clock moved.');
      tone(580);
    }

    function finish() {
      const loaded = allLoaded();
      const coldPenalty = loaded.filter((item) => item.trait === 'cold').length > st.coolant + 1 ? 8 : 0;
      const fragileBonus = loaded.some((item) => item.trait === 'fragile') && st.damage < 7 ? 18 : 0;
      const contractBonus = priorityCount() * 11;
      const penalty = st.damage * 3 + balance() * 2 + coldPenalty;
      const runScore = Math.max(0, loaded.reduce((sum, item) => sum + item.value, 0) + contractBonus + fragileBonus - penalty);
      st.score += runScore;
      st.best = Math.max(st.best, st.score);
      if (st.round >= st.rounds || st.damage >= 24) {
        st.over = true;
        if (st.score > 360) st.express = true;
        note(st.damage >= 24 ? `The deck failed at ${st.score}. Start again with better balance.` : `Final dispatch score: ${st.score}. ${st.express ? 'Express deck unlocked for this session.' : 'Score 360 to unlock express manifests.'}`);
      } else {
        st.round += 1;
        const carry = Math.min(10, Math.floor(st.damage / 2));
        st.route = routes[Math.floor(Math.random() * routes.length)];
        st.time = st.express ? 8 : 9;
        st.damage = carry;
        st.coolant = 2;
        st.repairs = 2;
        st.straps = st.round > 3 ? 0 : 1;
        st.loaded = { left: [], center: [], right: [] };
        st.manifest = makeManifest(st.express ? 7 : 6);
        st.selected = 0;
        st.focus = 'center';
        note(`Run ${st.round} opened. Some wear carried forward, so the recovery choices matter.`);
      }
      render();
    }

    function draw() {
      const bayLayout = { left: { x: 7, y: 12 }, center: { x: 37, y: 7 }, right: { x: 67, y: 12 } };
      svg.innerHTML = `<rect x="4" y="2" width="92" height="68" rx="8" fill="#f1f5f9" stroke="#cbd5e1"/><path d="M8 57 C28 49 48 64 92 53" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 4"/>`;
      bays.forEach((bay) => {
        const p = bayLayout[bay];
        const risk = total(bay) > (bay === 'center' ? 7 : 5);
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.classList.add('cargo-bay');
        if (st.focus === bay) g.classList.add('is-focus');
        if (risk) g.classList.add('is-risk');
        g.setAttribute('role', 'button');
        g.setAttribute('tabindex', '0');
        g.setAttribute('aria-label', `${bay} bay, load ${total(bay)}`);
        g.innerHTML = `<rect x="${p.x}" y="${p.y}" width="26" height="38" rx="5"/><text x="${p.x + 13}" y="${p.y + 8}">${bay}</text><text x="${p.x + 13}" y="${p.y + 32}">${total(bay)}</text>`;
        st.loaded[bay].slice(0, 5).forEach((item, i) => {
          const crate = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          crate.setAttribute('x', String(p.x + 4 + (i % 3) * 6));
          crate.setAttribute('y', String(p.y + 13 + Math.floor(i / 3) * 8));
          crate.setAttribute('width', '5');
          crate.setAttribute('height', '6');
          crate.setAttribute('rx', '1');
          crate.setAttribute('class', item.trait === 'cold' ? 'cargo-chill' : st.damage > 12 ? 'cargo-damage' : 'cargo-load');
          g.append(crate);
        });
        if (!reduced && st.focus === bay) {
          const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          pulse.setAttribute('class', 'cargo-pulse');
          pulse.setAttribute('cx', String(p.x + 13));
          pulse.setAttribute('cy', String(p.y + 19));
          pulse.setAttribute('r', '12');
          g.append(pulse);
        }
        g.addEventListener('click', () => { st.focus = bay; render(); });
        g.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); st.focus = bay; render(); } });
        svg.append(g);
      });
    }

    function renderCrates() {
      crates.replaceChildren();
      st.manifest.forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'cargo-crate';
        button.setAttribute('aria-pressed', String(index === st.selected));
        button.innerHTML = `<strong>${index + 1}. ${item.icon} ${item.name}</strong><small>${item.trait}${item.urgent ? ' · urgent' : ''} · wt ${item.weight} · $${item.value}</small>`;
        button.addEventListener('click', () => { st.selected = index; render(); });
        crates.append(button);
      });
      if (!st.manifest.length) crates.innerHTML = '<div class="cargo-brief">Manifest loaded. Dispatch is being scored.</div>';
    }

    function render() {
      $('#cl-round', root).textContent = `${st.round} / ${st.rounds}`;
      $('#cl-time', root).textContent = st.time;
      $('#cl-balance', root).textContent = balance();
      $('#cl-damage', root).textContent = st.damage;
      $('#cl-score', root).textContent = st.score;
      $('#cl-best', root).textContent = st.best;
      brief.innerHTML = `<p class="eyebrow">${st.route.name}</p><h3>${st.route.hint}</h3><div class="cargo-tags"><span>Priority: ${st.route.priority}</span><span>Focus bay: ${st.focus}</span><span>Coolant: ${st.coolant}</span><span>Repairs: ${st.repairs}</span>${st.express ? '<span>Express deck</span>' : ''}</div>`;
      bars.innerHTML = metric('Left', total('left'), 8) + metric('Center', total('center'), 8) + metric('Right', total('right'), 8) + metric('Damage', st.damage, 24);
      draw();
      renderCrates();
      $$('.cargo-actions [data-act]', root).forEach((button) => button.addEventListener('click', () => act(button.dataset.act)));
      $('[data-act="sound"]', root).textContent = st.audio ? 'Sound on' : 'Sound off';
    }

    function metric(name, value, max) {
      const pct = Math.max(0, Math.min(100, (value / max) * 100));
      return `<div class="cargo-bar"><span>${name}</span><div class="cargo-track"><span style="width:${pct}%"></span></div><strong>${value}</strong></div>`;
    }

    function note(text) { log.innerHTML = `<strong>${text}</strong><small>Keys: 1-7 select cargo, Arrow keys choose bay, Enter loads, I inspects, C cools, R repairs.</small>`; }

    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) { note('Sound is not available here. The game still works silently.'); return; }
      st.audio = !st.audio;
      st.ac ||= new AudioEngine();
      if (st.audio) st.ac.resume();
      tone(st.audio ? 700 : 260);
      render();
    }

    function tone(freq) {
      if (!st.audio || !st.ac) return;
      const osc = st.ac.createOscillator();
      const gain = st.ac.createGain();
      osc.frequency.value = freq;
      gain.gain.value = 0.035;
      osc.connect(gain).connect(st.ac.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, st.ac.currentTime + 0.12);
      osc.stop(st.ac.currentTime + 0.13);
    }

    const keyHandler = (event) => {
      if (!dialog.open || !root.isConnected) return;
      const n = Number(event.key);
      if (n >= 1 && n <= st.manifest.length) { st.selected = n - 1; render(); }
      if (event.key === 'ArrowLeft') { st.focus = 'left'; render(); }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { st.focus = 'center'; render(); }
      if (event.key === 'ArrowRight') { st.focus = 'right'; render(); }
      if (event.key === 'Enter') act('load');
      if (event.key.toLowerCase() === 'i') act('inspect');
      if (event.key.toLowerCase() === 'c') act('chill');
      if (event.key.toLowerCase() === 'r') act('repair');
    };
    document.addEventListener('keydown', keyHandler);
    const cleanup = () => { document.removeEventListener('keydown', keyHandler); if (st.ac) st.ac.close().catch(() => {}); dialog.removeEventListener('close', cleanup); };
    dialog.addEventListener('close', cleanup);
    start(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
