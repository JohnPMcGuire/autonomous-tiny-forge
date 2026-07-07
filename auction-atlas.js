(() => {
  const APP = { name: 'Auction Atlas', emoji: '🧭', category: 'play', version: '1.0.0', summary: 'Read bidder tells, chase collection contracts, and win lots without breaking your travel budget.', description: 'A local auction strategy game with uncertain appraisals, bidder tells, collection contracts, budget pressure, passes, reveals, rival bids, adaptive rounds, recoverable bust risk, session-only night market, scoring, touch and keyboard controls, optional local audio, reduced-motion behavior, and teardown.' };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const lots = [
    {name:'Brass compass', type:'nav', value:42, risk:8, tags:['map','voyage']}, {name:'Storm map', type:'nav', value:58, risk:16, tags:['map','rare']},
    {name:'Ceramic fox', type:'folk', value:36, risk:10, tags:['folk','small']}, {name:'Tin train plate', type:'rail', value:48, risk:12, tags:['rail','sign']},
    {name:'Harbor lantern', type:'light', value:64, risk:20, tags:['voyage','light']}, {name:'Ticket punch', type:'rail', value:30, risk:6, tags:['rail','small']},
    {name:'Moon dial', type:'science', value:70, risk:24, tags:['rare','light']}, {name:'Quilt fragment', type:'folk', value:44, risk:14, tags:['folk','pattern']},
    {name:'Signal lens', type:'science', value:52, risk:18, tags:['light','rare']}, {name:'Depot clock', type:'rail', value:76, risk:26, tags:['rail','time']}
  ];
  const bidders = [
    {name:'Mara', likes:'rare', heat:1.16, tell:'leans in when rarity is real'},
    {name:'Otto', likes:'rail', heat:1.1, tell:'counts quietly on rail lots'},
    {name:'June', likes:'folk', heat:1.08, tell:'smiles at handmade pieces'},
    {name:'Vale', likes:'light', heat:1.12, tell:'waits, then jumps on lenses'}
  ];
  const contracts = [
    {name:'Wayfinder set', need:['map','voyage'], bonus:45}, {name:'Rail cabinet', need:['rail','time'], bonus:50},
    {name:'Lantern study', need:['light','rare'], bonus:55}, {name:'Folk shelf', need:['folk','pattern'], bonus:42}
  ];

  function style() {
    if ($('#auction-atlas-styles')) return;
    const sheet = document.createElement('style');
    sheet.id = 'auction-atlas-styles';
    sheet.textContent = `.auction-card{animation:auction-in .24s ease both}.auction-game{max-width:1080px;gap:14px}.auction-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.auction-stat,.auction-table,.auction-side,.auction-lot,.auction-bidder{border:1px solid var(--line);border-radius:18px;background:#fff}.auction-stat{padding:10px 12px}.auction-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.auction-stat strong{display:block;margin-top:4px}.auction-layout{display:grid;grid-template-columns:1.1fr .9fr;gap:12px}.auction-table{position:relative;min-height:430px;padding:14px;overflow:hidden;background:linear-gradient(135deg,#fff7ed,#eef2ff)}.auction-gavel{width:100%;height:180px}.auction-ring{fill:none;stroke:#f59e0b;stroke-width:2;stroke-dasharray:8 12;animation:auction-spin 9s linear infinite;transform-origin:center}.auction-lot{position:relative;padding:14px;display:grid;gap:10px;box-shadow:0 12px 30px rgba(15,23,42,.08)}.auction-lot h3{margin:0;font-size:clamp(1.4rem,4vw,2.2rem)}.auction-tags{display:flex;flex-wrap:wrap;gap:6px}.auction-tags span{border:1px solid var(--line);border-radius:999px;padding:4px 8px;background:#f8fafc;font-size:.78rem;font-weight:800}.auction-valuation{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.auction-mini{padding:10px;border-radius:14px;background:#f8fafc}.auction-mini span{display:block;color:var(--muted);font-size:.7rem;font-weight:900;text-transform:uppercase}.auction-bidders{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.auction-bidder{padding:10px}.auction-bidder strong{display:block}.auction-bidder.is-hot{outline:3px solid #facc15}.auction-side{padding:14px;display:grid;gap:12px}.auction-contract{padding:12px;border-radius:16px;background:#f8fafc}.auction-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.auction-actions button{min-height:42px}.auction-log{min-height:104px;padding:17px 19px}.auction-bar{height:12px;border-radius:999px;background:#e2e8f0;overflow:hidden}.auction-bar span{display:block;height:100%;width:0;background:linear-gradient(90deg,#22c55e,#facc15,#fb7185)}@media(max-width:820px){.auction-hud{grid-template-columns:repeat(2,1fr)}.auction-layout{grid-template-columns:1fr}.auction-table{min-height:0}.auction-valuation,.auction-bidders{grid-template-columns:1fr}.auction-actions{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.auction-card,.auction-ring{animation:none}}@keyframes auction-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes auction-spin{to{transform:rotate(360deg)}}`;
    document.head.append(sheet);
  }

  function addCard() {
    const grid = $('#app-grid');
    const template = $('#app-card-template');
    if (!grid || !template || $('[data-auction-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    style();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.auctionCard = 'true';
    card.classList.add('auction-card');
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
    const retry = () => {
      addCard();
      if (!$('[data-auction-card]') && tries++ < 20) setTimeout(retry, 120);
    };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.auctionRefresh) return;
      button.dataset.auctionRefresh = '1';
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
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Auction%20Atlas';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel auction-game';
    root.innerHTML = `<div class="auction-hud"><div class="auction-stat"><span>Lot</span><strong id="aa-round">1 / 6</strong></div><div class="auction-stat"><span>Budget</span><strong id="aa-budget">140</strong></div><div class="auction-stat"><span>Bid</span><strong id="aa-bid">0</strong></div><div class="auction-stat"><span>Reveals</span><strong id="aa-reveals">2</strong></div><div class="auction-stat"><span>Heat</span><strong id="aa-heat">0</strong></div><div class="auction-stat"><span>Score</span><strong id="aa-score">0</strong></div></div><div class="auction-layout"><div class="auction-table"><svg class="auction-gavel" viewBox="0 0 700 180" aria-hidden="true"><circle class="auction-ring" cx="350" cy="90" r="62"/><path d="M260 110h180M315 80l70-40 18 30-70 40zM392 46l52-30 12 20-52 30z" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" opacity=".5"/></svg><div class="auction-lot" tabindex="0"></div><div class="auction-bidders" aria-label="Rival bidders"></div></div><div class="auction-side"><div class="auction-contract"></div><div class="auction-bar" aria-label="Risk heat"><span id="aa-meter"></span></div><div class="auction-actions"><button class="button" type="button" data-act="bid">Raise bid</button><button class="button button-secondary" type="button" data-act="pass">Pass lot</button><button class="button button-secondary" type="button" data-act="reveal">Reveal appraisal</button><button class="button button-secondary" type="button" data-act="nudge">Read bidder</button><button class="button button-secondary" type="button" data-act="sound">Sound off</button><button class="button button-secondary" type="button" data-act="new">New run</button></div></div></div><div class="result-card auction-log" aria-live="polite"></div>`;
    stage.append(root);
    const st = { round: 1, rounds: 6, budget: 140, bid: 0, score: 0, heat: 0, reveals: 2, read: false, owned: [], market: [], contract: contracts[Math.floor(Math.random() * contracts.length)], audio: false, ac: null, over: false, night: false };
    const lotBox = $('.auction-lot', root);
    const rivalBox = $('.auction-bidders', root);
    const contractBox = $('.auction-contract', root);
    const log = $('.auction-log', root);
    const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    function start() {
      st.round = 1; st.budget = 140; st.bid = 0; st.score = 0; st.heat = 0; st.reveals = 2; st.owned = []; st.over = false; st.read = false;
      st.contract = contracts[Math.floor(Math.random() * contracts.length)];
      st.market = shuffle(lots).slice(0, st.rounds);
      st.night = st.market.some((lot) => lot.value > 68);
      nextLot('Preview the lot, read the rivals, then bid only when the contract or margin justifies the risk.');
    }

    function current() { return st.market[st.round - 1]; }
    function estimate(lot) {
      const spread = st.night ? 22 : 16;
      return [Math.max(8, lot.value - spread + Math.floor(Math.random() * 8)), lot.value + spread - Math.floor(Math.random() * 7)];
    }
    function appetite(bidder, lot) {
      let want = lot.tags.includes(bidder.likes) || lot.type === bidder.likes ? bidder.heat : .86;
      if (st.read && lot.tags.includes(bidder.likes)) want += .08;
      return Math.round(lot.value * want + lot.risk * .35);
    }
    function rivals() { return bidders.map((bidder) => ({...bidder, cap: appetite(bidder, current())})); }

    function tone(kind) {
      if (!st.audio || !st.ac) return;
      const now = st.ac.currentTime;
      const osc = st.ac.createOscillator();
      const gain = st.ac.createGain();
      osc.frequency.value = kind === 'win' ? 740 : kind === 'bad' ? 170 : 430;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc.connect(gain).connect(st.ac.destination);
      osc.start(now); osc.stop(now + 0.18);
    }

    function nextLot(message) {
      st.bid = 0; st.read = false;
      if (st.round > st.rounds || st.budget <= 0 || st.heat >= 100) return finish(message);
      const lot = current();
      const [low, high] = estimate(lot);
      lot.estimate = lot.estimate || [low, high];
      log.innerHTML = `<strong>${message}</strong><small>Use Space/Enter to raise, R to reveal, P to pass.</small>`;
      render();
    }

    function raise() {
      if (st.over) return;
      const lot = current();
      const step = st.bid ? 8 + Math.floor(st.heat / 25) * 2 : Math.max(10, Math.floor(lot.estimate[0] * .35));
      const next = st.bid + step;
      if (next > st.budget) {
        st.heat += 12;
        log.innerHTML = '<strong>Budget wall.</strong><small>You cannot bid beyond cash. Pass or accept the heat.</small>';
        tone('bad'); render(); return;
      }
      st.bid = next;
      const active = rivals().filter((rival) => rival.cap >= st.bid + 6);
      if (active.length && Math.random() < .62) {
        const rival = active[Math.floor(Math.random() * active.length)];
        st.bid += 6;
        st.heat += 4;
        log.innerHTML = `<strong>${rival.name} counters.</strong><small>${rival.tell}. Current bid is ${st.bid}.</small>`;
        tone('tap');
      } else {
        winLot(lot);
      }
      render();
    }

    function winLot(lot) {
      st.budget -= st.bid;
      st.owned.push({...lot, paid: st.bid});
      const margin = lot.value - st.bid;
      st.score += Math.max(5, margin + 20);
      if (margin < 0) st.heat += Math.abs(margin) + lot.risk;
      if (lot.tags.some((tag) => st.contract.need.includes(tag))) st.score += 14;
      log.innerHTML = `<strong>Won ${lot.name} for ${st.bid}.</strong><small>${margin >= 0 ? `Estimated margin ${margin}.` : `Overpaid by ${Math.abs(margin)}.`}</small>`;
      tone(margin >= 0 ? 'win' : 'bad');
      st.round += 1;
      setTimeout(() => nextLot('Next lot rolls onto the table.'), 550);
    }

    function pass() {
      if (st.over) return;
      st.score += 4;
      st.heat = Math.max(0, st.heat - 4);
      log.innerHTML = `<strong>Passed ${current().name}.</strong><small>Discipline protects the route budget.</small>`;
      st.round += 1;
      tone('tap');
      nextLot('A fresh lot arrives.');
    }

    function reveal() {
      if (st.over) return;
      if (!st.reveals) { log.innerHTML = '<strong>No appraisal reveals left.</strong><small>Read a bidder or pass instead.</small>'; tone('bad'); return; }
      st.reveals -= 1;
      st.heat += 5;
      const lot = current();
      log.innerHTML = `<strong>Appraisal narrowed.</strong><small>${lot.name} is probably worth ${lot.value - 5} to ${lot.value + 7}; risk ${lot.risk}.</small>`;
      tone('tap'); render();
    }

    function readBidder() {
      if (st.over) return;
      st.read = true;
      st.heat += 3;
      const hottest = rivals().sort((a, b) => b.cap - a.cap)[0];
      log.innerHTML = `<strong>${hottest.name} is the danger bidder.</strong><small>${hottest.tell}. Expected ceiling near ${hottest.cap}.</small>`;
      tone('tap'); render();
    }

    function finish(message) {
      const tags = st.owned.flatMap((lot) => lot.tags);
      const hits = st.contract.need.filter((tag) => tags.includes(tag)).length;
      const bonus = hits === st.contract.need.length ? st.contract.bonus : hits * 12;
      st.score += bonus + Math.max(0, st.budget) - Math.max(0, st.heat - 60);
      st.over = true;
      log.innerHTML = `<strong>Auction route closed.</strong><small>${message || 'Final score'} ${st.score}. Contract bonus ${bonus}; owned ${st.owned.length} lots. ${st.night ? 'Night market was unlocked this run.' : 'Find a premium lot to unlock night market pressure.'}</small>`;
      render();
    }

    function render() {
      const lot = current() || st.market[st.market.length - 1];
      $('#aa-round', root).textContent = `${Math.min(st.round, st.rounds)} / ${st.rounds}`;
      $('#aa-budget', root).textContent = st.budget;
      $('#aa-bid', root).textContent = st.bid;
      $('#aa-reveals', root).textContent = st.reveals;
      $('#aa-heat', root).textContent = clamp(st.heat, 0, 100);
      $('#aa-score', root).textContent = st.score;
      $('#aa-meter', root).style.width = `${clamp(st.heat, 0, 100)}%`;
      contractBox.innerHTML = `<strong>${st.contract.name}</strong><small>Bonus ${st.contract.bonus}: collect ${st.contract.need.join(' + ')}. Owned tags: ${st.owned.flatMap((item) => item.tags).join(', ') || 'none'}.</small>`;
      if (st.over) return;
      lotBox.innerHTML = `<p class="eyebrow">${st.night ? 'Night market' : 'Day auction'}</p><h3>${lot.name}</h3><div class="auction-tags">${lot.tags.map((tag) => `<span>${tag}</span>`).join('')}</div><div class="auction-valuation"><div class="auction-mini"><span>Estimate</span><strong>${lot.estimate[0]}-${lot.estimate[1]}</strong></div><div class="auction-mini"><span>Risk</span><strong>${lot.risk}</strong></div><div class="auction-mini"><span>Need fit</span><strong>${lot.tags.filter((tag) => st.contract.need.includes(tag)).length}</strong></div></div>`;
      rivalBox.replaceChildren(...rivals().map((rival) => {
        const item = document.createElement('div');
        item.className = `auction-bidder${rival.cap >= st.bid + 8 ? ' is-hot' : ''}`;
        item.innerHTML = `<strong>${rival.name}</strong><small>${st.read ? `${rival.tell}. Ceiling near ${rival.cap}.` : `Likes ${rival.likes}. Read to expose ceiling.`}</small>`;
        return item;
      }));
    }

    root.addEventListener('click', (event) => {
      const act = event.target.closest('button')?.dataset.act;
      if (act === 'bid') raise();
      if (act === 'pass') pass();
      if (act === 'reveal') reveal();
      if (act === 'nudge') readBidder();
      if (act === 'new') start();
      if (act === 'sound') {
        const AudioEngine = window.AudioContext || window.webkitAudioContext;
        if (!AudioEngine) return;
        st.audio = !st.audio;
        event.target.textContent = st.audio ? 'Sound on' : 'Sound off';
        event.target.setAttribute('aria-pressed', String(st.audio));
        if (st.audio) { st.ac ||= new AudioEngine(); st.ac.resume(); tone('win'); }
      }
    });
    const keyHandler = (event) => {
      if (!dialog.open) return;
      if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); raise(); }
      if (event.key.toLowerCase() === 'p') pass();
      if (event.key.toLowerCase() === 'r') reveal();
      if (event.key.toLowerCase() === 'b') readBidder();
    };
    document.addEventListener('keydown', keyHandler);
    dialog.addEventListener('close', () => { document.removeEventListener('keydown', keyHandler); st.ac?.close?.(); }, { once: true });
    start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();