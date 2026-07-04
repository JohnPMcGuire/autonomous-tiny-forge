(() => {
  const APP = {
    name: 'Night Market Ledger', emoji: '🥟', category: 'experiment', version: '1.0.0',
    summary: 'Run five market nights by buying stock, setting prices, reading demand, and protecting reputation.',
    description: 'A local micro-economy mini-game with perishable inventory, trend forecasts, price elasticity, customer patience, waste, reputation, upgrades, scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and clean teardown.'
  };
  const GOODS = [
    { id:'buns', name:'Moon buns', icon:'◐', buy:2, base:5, life:2, trend:[1.1,.9,1.25,.75,1.05] },
    { id:'tea', name:'Lantern tea', icon:'♨', buy:1, base:3, life:3, trend:[.9,1.2,.95,1.15,1] },
    { id:'charms', name:'Lucky charms', icon:'✦', buy:3, base:7, life:4, trend:[.8,1,1.05,1.3,1.1] }
  ];
  const EVENTS = [
    { text:'Festival crowd', demand:1.25 }, { text:'Rainy alleys', demand:.8 }, { text:'Food critic nearby', demand:1 },
    { text:'Payday rush', demand:1.2 }, { text:'Quiet lantern hour', demand:.9 }
  ];
  function installStyles() {
    if (document.querySelector('#night-market-ledger-styles')) return;
    const style = document.createElement('style'); style.id = 'night-market-ledger-styles';
    style.textContent = `.market-card{animation:market-rise .32s ease both}.market-game{max-width:1060px;gap:14px}.market-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.market-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.market-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.market-stat strong{display:block;margin-top:4px;font-size:1rem}.market-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#1f1308;color:white;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.market-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.market-board canvas{display:block;width:100%;min-height:390px}.market-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.market-overlay strong{font-size:clamp(1.05rem,3vw,1.55rem)}.market-overlay small{display:block;max-width:760px;color:rgba(255,255,255,.78)}.market-badge{padding:7px 9px;border-radius:999px;background:rgba(251,191,36,.16);color:#fde68a;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.market-controls{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.market-good{border:1px solid var(--line);border-radius:18px;background:white;padding:12px;color:var(--ink);display:grid;gap:8px}.market-good header{display:flex;justify-content:space-between;gap:8px}.market-good h3{margin:0;font-size:1rem}.market-good small{color:var(--muted)}.market-buttons{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.market-buttons button{border:1px solid var(--line);border-radius:12px;background:#fff;padding:8px;color:var(--ink)}.market-log{min-height:118px;padding:17px 19px}.market-log strong{font-size:clamp(1.08rem,3vw,1.5rem)}@media(max-width:840px){.market-hud{grid-template-columns:repeat(2,1fr)}.market-controls{grid-template-columns:1fr}.market-board canvas{min-height:340px}.market-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.market-card{animation:none}}@keyframes market-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }
  function initCard() {
    const grid = document.querySelector('#app-grid'); const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-night-market-ledger-card]')) return;
    installStyles(); const node = template.content.cloneNode(true); const card = node.querySelector('.app-card');
    card.dataset.category = APP.category; card.dataset.nightMarketLedgerCard = 'true'; card.classList.add('market-card');
    node.querySelector('.app-icon').textContent = APP.emoji; node.querySelector('.app-meta').textContent = `Experiment · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name; node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button'); open.setAttribute('aria-label', `Open ${APP.name}`); open.addEventListener('click', openMarket);
    grid.append(node);
  }
  function openMarket() {
    const dialog = document.querySelector('#app-dialog'); const stage = document.querySelector('#app-stage'); const title = document.querySelector('#dialog-title');
    const category = document.querySelector('#dialog-category'); const description = document.querySelector('#dialog-description'); const feedback = document.querySelector('#dialog-feedback');
    if (!dialog || !stage || !title || !category || !description || !feedback) return;
    title.textContent = APP.name; category.textContent = `Experiment · ${APP.emoji}`; description.textContent = APP.description;
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Night%20Market%20Ledger';
    stage.replaceChildren(); renderGame(stage, dialog); dialog.showModal();
  }
  function renderGame(stage, dialog) {
    const root = document.createElement('section'); root.className = 'tool-panel market-game';
    const hud = document.createElement('div'); hud.className = 'market-hud';
    hud.innerHTML = '<div class="market-stat"><span>Night</span><strong id="market-night">1 / 5</strong></div><div class="market-stat"><span>Coins</span><strong id="market-coins">24</strong></div><div class="market-stat"><span>Reputation</span><strong id="market-rep">50</strong></div><div class="market-stat"><span>Waste</span><strong id="market-waste">0</strong></div><div class="market-stat"><span>Upgrade</span><strong id="market-upgrade">None</strong></div>';
    const board = document.createElement('button'); board.type = 'button'; board.className = 'market-board'; board.setAttribute('aria-label', 'Market demand chart');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="market-overlay"><span><strong>Buy, price, then open the stall.</strong><small>Trends reveal likely demand, high prices test patience, leftover stock ages, and reputation changes tomorrow.</small></span><span class="market-badge">Five nights</span></span>';
    const canvas = board.querySelector('canvas'); const ctx = canvas.getContext('2d'); const controls = document.createElement('div'); controls.className = 'market-controls';
    const log = document.createElement('div'); log.className = 'result-card market-log'; log.setAttribute('aria-live', 'polite'); const actions = document.createElement('div'); actions.className = 'tool-actions';
    const openButton = makeButton('Open stall', sellNight); const upgradeButton = makeButton('Buy cooler upgrade', buyUpgrade, true); const resetButton = makeButton('New ledger', reset, true);
    actions.append(openButton, upgradeButton, resetButton); root.append(hud, board, controls, log, actions); stage.append(root);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; const state = { night:1, coins:24, rep:50, waste:0, upgrade:false, stock:{}, price:{}, age:{}, history:[], done:false, raf:0 };
    dialog.addEventListener('close', teardown, { once:true });
    function makeButton(text, fn, secondary) { const b = document.createElement('button'); b.type = 'button'; b.className = secondary ? 'button button-secondary' : 'button'; b.textContent = text; b.addEventListener('click', fn); return b; }
    function reset() { state.night=1; state.coins=24; state.rep=50; state.waste=0; state.upgrade=false; state.history=[]; state.done=false; GOODS.forEach((g)=>{state.stock[g.id]=0; state.price[g.id]=g.base; state.age[g.id]=0;}); say('<strong>Fresh ledger opened.</strong><small>Use + stock, tune prices, then open the stall. Keyboard: 1-3 buy, Q/W/E lower price, A/S/D raise price, Enter opens.</small>'); update(); }
    function say(html) { log.innerHTML = html; }
    function event() { return EVENTS[(state.night - 1) % EVENTS.length]; }
    function buy(g) { if (state.done) return; if (state.coins < g.buy) { say('<strong>Not enough coins.</strong><small>Price existing stock carefully before buying more.</small>'); return; } state.coins -= g.buy; state.stock[g.id] += 1; state.age[g.id] = 0; update(); }
    function price(g, delta) { if (state.done) return; state.price[g.id] = Math.max(1, Math.min(12, state.price[g.id] + delta)); update(); }
    function buyUpgrade() { if (state.done) return; if (state.upgrade) { say('<strong>Cooler already installed.</strong><small>Perishable goods now last one extra night.</small>'); return; } if (state.coins < 10) { say('<strong>Upgrade costs 10 coins.</strong><small>It pays off if you carry inventory across nights.</small>'); return; } state.coins -= 10; state.upgrade = true; update(); }
    function demandFor(g) { const pricePressure = Math.max(.35, 1.35 - (state.price[g.id] - g.base) * .16); const repBoost = .75 + state.rep / 100; return Math.max(0, Math.round((2 + state.night * .8) * g.trend[state.night-1] * event().demand * pricePressure * repBoost)); }
    function sellNight() { if (state.done) return; let revenue=0, served=0, missed=0, spoiled=0; GOODS.forEach((g)=>{ const want=demandFor(g); const sold=Math.min(state.stock[g.id], want); served += sold; missed += Math.max(0, want - sold); revenue += sold * state.price[g.id]; state.stock[g.id] -= sold; }); state.coins += revenue; GOODS.forEach((g)=>{ if (state.stock[g.id] > 0) state.age[g.id] += 1; const limit = g.life + (state.upgrade ? 1 : 0); if (state.age[g.id] >= limit) { spoiled += state.stock[g.id]; state.stock[g.id] = 0; state.age[g.id] = 0; } }); state.waste += spoiled; state.rep = Math.max(0, Math.min(100, state.rep + served * 2 - missed * 3 - spoiled * 4)); state.history.push({night:state.night, revenue, served, missed, spoiled, coins:state.coins}); if (state.night >= 5) return finish(revenue, served, missed, spoiled); state.night += 1; say(`<strong>Night closed: ${revenue} coins earned.</strong><small>Served ${served}, missed ${missed}, spoiled ${spoiled}. Tomorrow: ${event().text}.</small>`); update(); }
    function finish(revenue, served, missed, spoiled) { state.done = true; const score = state.coins * 5 + state.rep * 3 - state.waste * 12; say(`<strong>Final score ${score}.</strong><small>Last night earned ${revenue}. Served ${served}, missed ${missed}, spoiled ${spoiled}. Replay with lean stock, premium pricing, or the cooler-first route.</small>`); update(); }
    function update() { hud.querySelector('#market-night').textContent = `${state.night} / 5`; hud.querySelector('#market-coins').textContent = state.coins; hud.querySelector('#market-rep').textContent = state.rep; hud.querySelector('#market-waste').textContent = state.waste; hud.querySelector('#market-upgrade').textContent = state.upgrade ? 'Cooler' : 'None'; controls.replaceChildren(); GOODS.forEach((g)=>{ const card=document.createElement('section'); card.className='market-good'; card.innerHTML=`<header><h3>${g.icon} ${g.name}</h3><small>Trend ${Math.round(g.trend[state.night-1]*100)}%</small></header><div>Stock ${state.stock[g.id]} · Price ${state.price[g.id]} · Demand ${demandFor(g)} · Life ${Math.max(0,g.life + (state.upgrade ? 1 : 0) - state.age[g.id])}</div><div class="market-buttons"><button type="button">+ stock</button><button type="button">− price</button><button type="button">+ price</button><button type="button">Target</button></div>`; const buttons=card.querySelectorAll('button'); buttons[0].addEventListener('click',()=>buy(g)); buttons[1].addEventListener('click',()=>price(g,-1)); buttons[2].addEventListener('click',()=>price(g,1)); buttons[3].addEventListener('click',()=>{ state.price[g.id]=g.base; update(); }); controls.append(card); }); draw(); }
    function resize() { const rect=canvas.getBoundingClientRect(); const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1)); canvas.width=Math.round(rect.width*dpr); canvas.height=Math.round(Math.max(340,rect.height||390)*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); draw(); }
    function draw() { const w=canvas.clientWidth||900,h=canvas.clientHeight||390; ctx.clearRect(0,0,w,h); const grad=ctx.createLinearGradient(0,0,w,h); grad.addColorStop(0,'#4a2209'); grad.addColorStop(1,'#120807'); ctx.fillStyle=grad; ctx.fillRect(0,0,w,h); ctx.fillStyle='rgba(255,255,255,.08)'; for(let x=24;x<w-24;x+=42) ctx.fillRect(x,36,24,h-130); GOODS.forEach((g,i)=>{ const x=80+i*(w-160)/2; const height=Math.min(h-150,demandFor(g)*18); ctx.fillStyle=['#fde68a','#93c5fd','#c4b5fd'][i]; ctx.fillRect(x-28,h-86-height,56,height); ctx.fillStyle='rgba(255,255,255,.9)'; ctx.font='700 13px system-ui'; ctx.fillText(g.name,x-42,h-56); ctx.fillText(`$${state.price[g.id]} · ${state.stock[g.id]} in stock`,x-42,h-38); }); ctx.fillStyle='rgba(255,255,255,.88)'; ctx.font='800 18px system-ui'; ctx.fillText(event().text,24,34); ctx.font='700 12px system-ui'; ctx.fillText('Bars show forecast demand after price, reputation, and tonight event. Leftover stock may spoil.',24,h-16); }
    function onKey(e) { const k=e.key.toLowerCase(); if(k==='1') buy(GOODS[0]); else if(k==='2') buy(GOODS[1]); else if(k==='3') buy(GOODS[2]); else if(k==='q') price(GOODS[0],-1); else if(k==='w') price(GOODS[1],-1); else if(k==='e') price(GOODS[2],-1); else if(k==='a') price(GOODS[0],1); else if(k==='s') price(GOODS[1],1); else if(k==='d') price(GOODS[2],1); else if(k==='enter') sellNight(); else return; e.preventDefault(); }
    function loop() { if (!reduced && !state.done) { draw(); state.raf = requestAnimationFrame(loop); } }
    function teardown() { cancelAnimationFrame(state.raf); window.removeEventListener('resize', resize); board.removeEventListener('keydown', onKey); }
    board.addEventListener('keydown', onKey); window.addEventListener('resize', resize); reset(); requestAnimationFrame(resize); state.raf=requestAnimationFrame(loop);
  }
  const start = () => setTimeout(initCard, 0);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
})();
