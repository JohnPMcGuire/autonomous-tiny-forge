(() => {
  const APP = { name: 'Bazaar Signals', emoji: '📈', category: 'play', version: '1.0.0', summary: 'Read shifting demand, buy stock, set prices, and protect trust before the market closes.', description: 'A local market-strategy game with demand forecasts, price setting, inventory limits, spoilage, bulk contracts, reputation pressure, adaptive events, scoring, canvas motion, touch, keyboard controls, and reduced-motion-safe feedback.' };
  const GOODS = [
    { id: 'tea', name: 'Tea', base: 4, color: '#6ee7b7' },
    { id: 'tools', name: 'Tools', base: 7, color: '#93c5fd' },
    { id: 'fruit', name: 'Fruit', base: 3, color: '#fbbf24' }
  ];
  const EVENTS = [
    { title: 'Festival crowd', note: 'Tea demand rises, but tools slow down.', d: [2, -1, 1], cost: [1, 0, 1] },
    { title: 'Road delay', note: 'Restocking costs climb and fruit spoils faster.', d: [0, 1, -1], cost: [1, 2, 2] },
    { title: 'Workshop rush', note: 'Tools surge while snack buyers drift away.', d: [-1, 3, -1], cost: [0, 1, 0] },
    { title: 'Cool morning', note: 'Tea is steady and fruit keeps better.', d: [1, 0, 2], cost: [0, 0, -1] }
  ];

  function installStyles() {
    if (document.querySelector('#bazaar-signals-styles')) return;
    const style = document.createElement('style');
    style.id = 'bazaar-signals-styles';
    style.textContent = `.bazaar-card{animation:bazaar-rise .34s ease both}.bazaar-game{max-width:900px;gap:14px}.bazaar-hud{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.bazaar-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.bazaar-stat span{display:block;color:var(--muted);font-size:.64rem;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.bazaar-stat strong{display:block;margin-top:4px;font-size:1rem}.bazaar-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#081017;color:white;cursor:pointer;touch-action:manipulation;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.bazaar-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.bazaar-board canvas{display:block;width:100%;min-height:330px}.bazaar-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.bazaar-overlay strong{font-size:clamp(1.08rem,3vw,1.55rem)}.bazaar-overlay small{display:block;max-width:600px;color:rgba(255,255,255,.74)}.bazaar-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#dcfce7;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.bazaar-log{min-height:96px;padding:17px 19px}.bazaar-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}.bazaar-goods{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.bazaar-good{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left}.bazaar-good[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.bazaar-good span{display:block;color:var(--muted);font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.bazaar-good strong{display:block;margin-top:2px}@media(max-width:620px){.bazaar-hud,.bazaar-goods{grid-template-columns:repeat(2,1fr)}.bazaar-board canvas{min-height:300px}.bazaar-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.bazaar-card{animation:none}}@keyframes bazaar-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-bazaar-signals-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.bazaarSignalsCard = 'true';
    card.classList.add('bazaar-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openBazaarSignals);
    grid.append(node);
  }

  function openBazaarSignals() {
    const dialog = document.querySelector('#app-dialog');
    const stage = document.querySelector('#app-stage');
    const title = document.querySelector('#dialog-title');
    const category = document.querySelector('#dialog-category');
    const description = document.querySelector('#dialog-description');
    const feedback = document.querySelector('#dialog-feedback');
    if (!dialog || !stage || !title || !category || !description || !feedback) return;
    title.textContent = APP.name;
    category.textContent = `Play · ${APP.emoji}`;
    description.textContent = APP.description;
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Bazaar%20Signals';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function button(text, onClick, secondary = false) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = secondary ? 'button button-secondary' : 'button';
    item.textContent = text;
    item.addEventListener('click', onClick);
    return item;
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel bazaar-game';
    const hud = document.createElement('div');
    hud.className = 'bazaar-hud';
    hud.innerHTML = '<div class="bazaar-stat"><span>Day</span><strong id="bazaar-day">1 / 6</strong></div><div class="bazaar-stat"><span>Coins</span><strong id="bazaar-coins">32</strong></div><div class="bazaar-stat"><span>Trust</span><strong id="bazaar-trust">70</strong></div><div class="bazaar-stat"><span>Score</span><strong id="bazaar-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'bazaar-board';
    board.setAttribute('aria-label', 'Bazaar Signals board. Select goods, restock, change prices, accept contracts, then open the market. Arrow keys choose goods, plus and minus set price, B restocks, S sells the day.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="bazaar-overlay"><span><strong>Balance stock, price, and trust before six market days end.</strong><small>Cheap prices sell more but leave money behind. High prices protect margin but can strand inventory and reduce trust.</small></span><span class="bazaar-badge">Tap or keys</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const goods = document.createElement('div');
    goods.className = 'bazaar-goods';
    const log = document.createElement('div');
    log.className = 'result-card bazaar-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    actions.append(button('Restock', restock), button('Price +', () => setPrice(1), true), button('Price -', () => setPrice(-1), true), button('Open market', sellDay), button('New run', reset, true));
    root.append(hud, board, goods, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { day: 1, coins: 32, trust: 70, selected: 0, score: 0, event: 0, sold: 0, stock: [2, 1, 3], price: [5, 9, 4], demand: [5, 3, 6], contract: null, done: false, tick: 0, raf: 0 };

    function reset() {
      Object.assign(state, { day: 1, coins: 32, trust: 70, selected: 0, score: 0, event: 0, sold: 0, stock: [2, 1, 3], price: [5, 9, 4], demand: [5, 3, 6], contract: null, done: false, tick: 0 });
      makeDay();
      say('<strong>Stall opened.</strong><small>Read today\'s signal, stock what you can carry, then open the market. Six days decide your score.</small>');
      update();
    }
    function makeDay() {
      const ev = EVENTS[(state.day + state.score + state.selected) % EVENTS.length];
      state.event = EVENTS.indexOf(ev);
      state.demand = GOODS.map((g, i) => Math.max(1, g.base + ev.d[i] + Math.floor((state.trust - 55) / 18)));
      state.contract = state.day % 2 === 0 ? { good: (state.day + state.selected) % 3, qty: 3, bonus: 10 + state.day } : null;
    }
    function select(i) { state.selected = (i + GOODS.length) % GOODS.length; update(); }
    function cost(i) { return Math.max(1, GOODS[i].base + EVENTS[state.event].cost[i]); }
    function capacity() { return 10 + Math.floor(state.trust / 35); }
    function totalStock() { return state.stock.reduce((a, b) => a + b, 0); }
    function restock() {
      if (state.done) return;
      const i = state.selected;
      const c = cost(i);
      if (state.coins < c) { say('<strong>Not enough coins.</strong><small>Lower risk by selling through current stock first.</small>'); return; }
      if (totalStock() >= capacity()) { say('<strong>Stall is full.</strong><small>Open the market or lower prices to clear space.</small>'); return; }
      state.coins -= c; state.stock[i] += 1; state.score += 1;
      say(`<strong>Restocked ${GOODS[i].name}.</strong><small>Paid ${c} coins. Capacity now ${totalStock()} / ${capacity()}.</small>`);
      update();
    }
    function setPrice(delta) {
      if (state.done) return;
      const i = state.selected;
      state.price[i] = Math.max(1, Math.min(16, state.price[i] + delta));
      say(`<strong>${GOODS[i].name} price set to ${state.price[i]}.</strong><small>Demand forecast is ${state.demand[i]}. Margin changes trust and sell-through.</small>`);
      update();
    }
    function sellDay() {
      if (state.done) return;
      let revenue = 0; let moved = 0; let misses = 0;
      GOODS.forEach((g, i) => {
        const pricePenalty = Math.max(0, state.price[i] - g.base - 2);
        const possible = Math.max(0, state.demand[i] - pricePenalty);
        const sold = Math.min(state.stock[i], possible);
        revenue += sold * state.price[i]; moved += sold; misses += Math.max(0, possible - sold);
        state.stock[i] -= sold;
      });
      if (state.contract) {
        const gi = state.contract.good;
        const deliver = Math.min(state.stock[gi], state.contract.qty);
        if (deliver === state.contract.qty) { state.stock[gi] -= deliver; revenue += state.contract.bonus; state.trust += 5; }
      }
      const spoiled = Math.min(state.stock[2], state.day % 2 ? 1 : 2);
      state.stock[2] -= spoiled;
      state.coins += revenue;
      state.trust = Math.max(0, Math.min(100, state.trust + moved * 2 - misses * 3 - spoiled * 2));
      state.sold += moved;
      state.score = Math.max(0, Math.round(state.coins + state.trust + state.sold * 5 - totalStock() * 2));
      if (state.day >= 6) { state.done = true; say(`<strong>Market closed: ${state.score} points.</strong><small>Sold ${state.sold} goods with ${state.trust} trust. Replay for better price discipline and contract timing.</small>`); }
      else { state.day += 1; makeDay(); say(`<strong>Day complete.</strong><small>Revenue ${revenue}, sold ${moved}, missed ${misses}, spoiled ${spoiled}. New signal: ${EVENTS[state.event].title}.</small>`); }
      update();
    }
    function say(html) { log.innerHTML = html; }
    function updateGoods() {
      goods.replaceChildren();
      GOODS.forEach((g, i) => {
        const item = document.createElement('button');
        item.type = 'button'; item.className = 'bazaar-good'; item.setAttribute('aria-pressed', String(i === state.selected));
        item.innerHTML = `<span>${g.name}</span><strong>Stock ${state.stock[i]} · Price ${state.price[i]}</strong><small>Cost ${cost(i)} · Demand ${state.demand[i]}</small>`;
        item.addEventListener('click', () => select(i)); goods.append(item);
      });
    }
    function update() {
      hud.querySelector('#bazaar-day').textContent = `${state.day} / 6`;
      hud.querySelector('#bazaar-coins').textContent = state.coins;
      hud.querySelector('#bazaar-trust').textContent = state.trust;
      hud.querySelector('#bazaar-score').textContent = state.score;
      updateGoods(); draw();
    }
    function draw() {
      const rect = board.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(300, Math.floor(rect.width * 0.52));
      canvas.width = Math.floor(w * ratio); canvas.height = Math.floor(h * ratio); canvas.style.height = `${h}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h); grad.addColorStop(0, '#10233a'); grad.addColorStop(1, '#0f172a'); ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let x = 0; x < w; x += 34) ctx.fillRect(x + ((state.tick % 34) * (reduced ? 0 : 1)), 0, 1, h);
      ctx.font = '800 14px system-ui'; ctx.fillStyle = '#e5f3ff'; ctx.fillText(EVENTS[state.event].title, 22, 32); ctx.font = '12px system-ui'; ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.fillText(EVENTS[state.event].note, 22, 52);
      GOODS.forEach((g, i) => {
        const x = 34 + i * ((w - 68) / 3); const y = 92; const bw = (w - 110) / 3;
        ctx.fillStyle = i === state.selected ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.roundRect(x, y, bw, 130, 20); ctx.fill();
        ctx.fillStyle = g.color; ctx.fillRect(x + 20, y + 90 - state.stock[i] * 8, 28, state.stock[i] * 8);
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '800 16px system-ui'; ctx.fillText(g.name, x + 18, y + 30);
        ctx.font = '12px system-ui'; ctx.fillText(`Demand ${state.demand[i]}`, x + 18, y + 52); ctx.fillText(`Price ${state.price[i]}`, x + 18, y + 70); ctx.fillText(`Stock ${state.stock[i]}`, x + 58, y + 104);
      });
      if (state.contract) { const g = GOODS[state.contract.good]; ctx.fillStyle = 'rgba(255,242,189,.92)'; ctx.font = '800 13px system-ui'; ctx.fillText(`Contract: deliver ${state.contract.qty} ${g.name} for +${state.contract.bonus} coins`, 22, h - 72); }
    }
    function loop() { state.tick += 0.35; if (!reduced) draw(); state.raf = requestAnimationFrame(loop); }
    board.addEventListener('click', () => select(state.selected + 1));
    board.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); select(state.selected + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); select(state.selected - 1); }
      if (event.key === '+' || event.key === '=') { event.preventDefault(); setPrice(1); }
      if (event.key === '-' || event.key === '_') { event.preventDefault(); setPrice(-1); }
      if (event.key.toLowerCase() === 'b') { event.preventDefault(); restock(); }
      if (event.key.toLowerCase() === 's' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); sellDay(); }
    });
    window.addEventListener('resize', draw, { passive: true });
    const observer = new MutationObserver(() => { if (!stage.contains(root)) { cancelAnimationFrame(state.raf); window.removeEventListener('resize', draw); observer.disconnect(); } });
    observer.observe(stage, { childList: true });
    reset(); loop();
  }

  const start = () => setTimeout(initCard, 80);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
