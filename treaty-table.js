(() => {
  const APP = {
    name: 'Treaty Table', emoji: '🕊️', category: 'play', version: '1.0.0',
    summary: 'Negotiate a fragile river treaty through vetoes, concessions, trust, and crisis pressure.',
    description: 'A local negotiation strategy game with faction needs, concession packages, trust and veto pressure, event cards, enforcement clauses, repair moves, scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and clean teardown.'
  };

  const FACTIONS = [
    { id: 'farms', label: 'Delta farms', need: 'water security', color: '#bef264', patience: 78, trust: 54, veto: 18 },
    { id: 'city', label: 'Harbor city', need: 'safe drinking supply', color: '#93c5fd', patience: 72, trust: 48, veto: 26 },
    { id: 'fishers', label: 'Coast fishers', need: 'habitat flows', color: '#5eead4', patience: 66, trust: 58, veto: 32 },
    { id: 'power', label: 'Hill power co-op', need: 'steady releases', color: '#fbbf24', patience: 70, trust: 46, veto: 24 }
  ];
  const OFFERS = [
    { id: 'water', label: 'Guarantee water', helps: ['farms', 'city'], hurts: ['fishers'], cost: 2, risk: 1 },
    { id: 'flow', label: 'Protect flow', helps: ['fishers'], hurts: ['farms', 'power'], cost: 1, risk: 0 },
    { id: 'grid', label: 'Stabilize grid', helps: ['power', 'city'], hurts: ['fishers'], cost: 2, risk: 1 },
    { id: 'audit', label: 'Open audit', helps: ['city', 'fishers'], hurts: [], cost: 1, risk: -1 },
    { id: 'fund', label: 'Relief fund', helps: ['farms', 'fishers'], hurts: ['city'], cost: 3, risk: 0 },
    { id: 'pause', label: 'Phased pause', helps: ['power'], hurts: ['city', 'farms'], cost: 1, risk: -1 }
  ];
  const EVENTS = [
    { label: 'Dry week forecast', pressure: 8, hit: 'farms', text: 'Farms threaten a walkout unless near-term water is named.' },
    { label: 'Boil notice rumor', pressure: 10, hit: 'city', text: 'City delegates need public assurance before signing.' },
    { label: 'Fish kill photo', pressure: 9, hit: 'fishers', text: 'Fishers demand proof the river will not become the sacrifice zone.' },
    { label: 'Rolling outage risk', pressure: 7, hit: 'power', text: 'The co-op asks for stable release rules, not vague goodwill.' },
    { label: 'Mediator leak', pressure: 6, hit: 'all', text: 'Everyone suspects side deals. Trust slides unless transparency improves.' }
  ];

  function installStyles() {
    if (document.querySelector('#treaty-table-styles')) return;
    const style = document.createElement('style');
    style.id = 'treaty-table-styles';
    style.textContent = `.treaty-card{animation:treaty-rise .32s ease both}.treaty-game{max-width:1000px;gap:14px}.treaty-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.treaty-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.treaty-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.treaty-stat strong{display:block;margin-top:4px;font-size:1rem}.treaty-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#101827;color:white;cursor:pointer;touch-action:manipulation;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.treaty-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.treaty-board canvas{display:block;width:100%;min-height:430px}.treaty-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.treaty-overlay strong{font-size:clamp(1.05rem,3vw,1.55rem)}.treaty-overlay small{display:block;max-width:680px;color:rgba(255,255,255,.76)}.treaty-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#c4b5fd;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.treaty-offers{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.treaty-offers button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.treaty-offers button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.treaty-offers span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.treaty-log{min-height:118px;padding:17px 19px}.treaty-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:760px){.treaty-hud{grid-template-columns:repeat(2,1fr)}.treaty-offers{grid-template-columns:1fr 1fr}.treaty-board canvas{min-height:360px}.treaty-overlay{align-items:start;flex-direction:column}}@media(max-width:480px){.treaty-offers{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.treaty-card{animation:none}}@keyframes treaty-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-treaty-table-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.treatyTableCard = 'true';
    card.classList.add('treaty-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openTreatyTable);
    grid.append(node);
  }

  function openTreatyTable() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Treaty%20Table';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel treaty-game';
    const hud = document.createElement('div');
    hud.className = 'treaty-hud';
    hud.innerHTML = '<div class="treaty-stat"><span>Round</span><strong id="treaty-round">1 / 7</strong></div><div class="treaty-stat"><span>Capital</span><strong id="treaty-capital">7</strong></div><div class="treaty-stat"><span>Clauses</span><strong id="treaty-clauses">0</strong></div><div class="treaty-stat"><span>Pressure</span><strong id="treaty-pressure">18</strong></div><div class="treaty-stat"><span>Score</span><strong id="treaty-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'treaty-board';
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="treaty-overlay"><span><strong>Keep every faction above veto pressure.</strong><small>Tap an offer or press 1 through 6. Press C for caucus, R for repair, Enter to submit the treaty.</small></span><span class="treaty-badge">Negotiation sim</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const offers = document.createElement('div');
    offers.className = 'treaty-offers';
    const log = document.createElement('div');
    log.className = 'result-card treaty-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const makeButton = (text, fn, secondary) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = secondary ? 'button button-secondary' : 'button';
      item.textContent = text;
      item.addEventListener('click', fn);
      return item;
    };
    actions.append(makeButton('Private caucus', caucus, true), makeButton('Repair trust', repair, true), makeButton('Submit treaty', submit, false), makeButton('Restart', reset, true));
    root.append(hud, board, offers, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { round: 1, maxRounds: 7, capital: 7, clauses: [], pressure: 18, score: 0, event: EVENTS[0], factions: [], done: false, raf: 0, pulse: 0 };

    function reset() {
      state.round = 1; state.capital = 7; state.clauses = []; state.pressure = 18; state.score = 0; state.done = false; state.pulse = 0;
      state.factions = FACTIONS.map((faction) => ({ ...faction }));
      state.event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      say('<strong>Summit opened.</strong><small>Build a package that gives every faction enough to sign without letting veto pressure spike.</small>');
      update();
    }
    function say(html) { log.innerHTML = html; }
    function selectOffer(offer) {
      if (state.done) return;
      if (state.clauses.includes(offer.id)) return say(`<strong>${offer.label} is already in the package.</strong><small>Use caucus or repair if the room needs movement.</small>`);
      if (state.capital < offer.cost) return say('<strong>Not enough political capital.</strong><small>Run a caucus to regain capital at the cost of pressure.</small>');
      state.capital -= offer.cost; state.clauses.push(offer.id); state.pressure += offer.risk;
      for (const faction of state.factions) {
        if (offer.helps.includes(faction.id)) { faction.trust = Math.min(100, faction.trust + 16); faction.veto = Math.max(0, faction.veto - 10); }
        if (offer.hurts.includes(faction.id)) { faction.trust = Math.max(0, faction.trust - 10); faction.veto = Math.min(100, faction.veto + 12); }
      }
      advance(`${offer.label} added.`);
    }
    function caucus() {
      if (state.done) return;
      state.capital = Math.min(9, state.capital + 2);
      state.pressure += 4;
      for (const faction of state.factions) faction.patience = Math.max(0, faction.patience - 6);
      advance('Private caucus bought capital, but the room grew impatient.');
    }
    function repair() {
      if (state.done) return;
      if (state.capital < 1) return say('<strong>No capital for a repair move.</strong><small>Caucus first, but expect pressure to rise.</small>');
      state.capital -= 1;
      const weakest = state.factions.slice().sort((a, b) => (a.trust - a.veto) - (b.trust - b.veto))[0];
      weakest.trust = Math.min(100, weakest.trust + 18);
      weakest.veto = Math.max(0, weakest.veto - 14);
      advance(`Repair move helped ${weakest.label}.`);
    }
    function advance(message) {
      const event = state.event;
      state.pressure += Math.floor(2 + state.round / 2);
      for (const faction of state.factions) {
        if (event.hit === faction.id || event.hit === 'all') { faction.veto = Math.min(100, faction.veto + event.pressure); faction.trust = Math.max(0, faction.trust - Math.floor(event.pressure / 2)); }
        faction.veto = Math.min(100, faction.veto + Math.max(0, state.pressure - faction.patience) / 10);
      }
      state.round += 1;
      state.event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      const danger = state.factions.find((faction) => faction.veto >= 82 || faction.trust <= 10);
      if (danger) {
        state.done = true; state.score = Math.max(0, state.clauses.length * 35 - state.pressure);
        say(`<strong>Walkout by ${danger.label}.</strong><small>${message} The package failed because veto pressure outran trust. Final score ${state.score}.</small>`);
      } else if (state.round > state.maxRounds) {
        submit(); return;
      } else {
        say(`<strong>${message}</strong><small>${event.text} Next event: ${state.event.label}.</small>`);
      }
      update();
    }
    function submit() {
      if (state.done) return;
      const signers = state.factions.filter((faction) => faction.trust > 38 && faction.veto < 70).length;
      const balance = Math.round(state.factions.reduce((sum, faction) => sum + faction.trust - faction.veto, 0) / state.factions.length);
      state.score = Math.max(0, signers * 80 + state.clauses.length * 22 + state.capital * 8 + balance - state.pressure);
      state.done = true;
      say(`<strong>${signers === 4 ? 'Treaty signed.' : 'Partial accord only.'}</strong><small>${signers} of 4 factions signed. Score ${state.score}. ${state.score >= 320 ? 'Durable public deal.' : state.score >= 210 ? 'Fragile but usable.' : 'Too many side risks remain.'}</small>`);
      update();
    }
    function buildOffers() {
      offers.replaceChildren();
      OFFERS.forEach((offer, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.disabled = state.done;
        button.setAttribute('aria-pressed', String(state.clauses.includes(offer.id)));
        button.innerHTML = `<span>${index + 1} · cost ${offer.cost}</span><strong>${offer.label}</strong><small>Helps ${offer.helps.map(label).join(', ')}${offer.hurts.length ? `; strains ${offer.hurts.map(label).join(', ')}` : ''}</small>`;
        button.addEventListener('click', () => selectOffer(offer));
        offers.append(button);
      });
    }
    function label(id) { return FACTIONS.find((item) => item.id === id)?.label || id; }
    function update() {
      hud.querySelector('#treaty-round').textContent = `${Math.min(state.round, state.maxRounds)} / ${state.maxRounds}`;
      hud.querySelector('#treaty-capital').textContent = String(state.capital);
      hud.querySelector('#treaty-clauses').textContent = String(state.clauses.length);
      hud.querySelector('#treaty-pressure').textContent = String(Math.round(state.pressure));
      hud.querySelector('#treaty-score').textContent = String(state.score);
      board.setAttribute('aria-label', `${APP.name} board. Round ${Math.min(state.round, state.maxRounds)}. Capital ${state.capital}. Clauses ${state.clauses.length}. Pressure ${Math.round(state.pressure)}. Current event ${state.event.label}.`);
      buildOffers(); draw();
    }
    function sizeCanvas() {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(340, Math.floor(rect.height || 430));
      if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
        canvas.width = Math.floor(width * ratio); canvas.height = Math.floor(height * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      return { width, height };
    }
    function draw() {
      const { width, height } = sizeCanvas();
      const t = state.pulse;
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#0f172a'); gradient.addColorStop(1, '#312e81');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255,255,255,.09)'; ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 34) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + height * .4, height); ctx.stroke(); }
      const cx = width / 2, cy = height / 2 - 10, radius = Math.min(width, height) * .27;
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.arc(cx, cy, radius * 1.18, 0, Math.PI * 2); ctx.fill();
      state.factions.forEach((faction, index) => {
        const angle = -Math.PI / 2 + index * Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const pulse = reduced ? 0 : Math.sin(t / 18 + index) * 3;
        ctx.fillStyle = faction.color; ctx.beginPath(); ctx.arc(x, y, 30 + pulse, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0f172a'; ctx.font = '800 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText(faction.label.split(' ')[0], x, y + 4);
        ctx.strokeStyle = 'rgba(255,255,255,.56)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, 42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * faction.trust / 100); ctx.stroke();
        ctx.strokeStyle = 'rgba(248,113,113,.82)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 51, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * faction.veto / 100); ctx.stroke();
      });
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '900 18px system-ui'; ctx.textAlign = 'center'; ctx.fillText(state.event.label, cx, cy + 8);
      ctx.font = '700 12px system-ui'; ctx.fillStyle = 'rgba(255,255,255,.68)'; ctx.fillText(`${state.clauses.length} clauses · ${state.capital} capital · ${Math.round(state.pressure)} pressure`, cx, cy + 30);
    }
    function loop() { state.pulse += 1; draw(); state.raf = requestAnimationFrame(loop); }
    board.addEventListener('click', () => !state.done && repair());
    root.addEventListener('keydown', (event) => {
      if (event.key >= '1' && event.key <= '6') selectOffer(OFFERS[Number(event.key) - 1]);
      if (event.key.toLowerCase() === 'c') caucus();
      if (event.key.toLowerCase() === 'r') repair();
      if (event.key === 'Enter') submit();
    });
    window.addEventListener('resize', draw);
    const cleanup = () => { cancelAnimationFrame(state.raf); window.removeEventListener('resize', draw); };
    const dialog = document.querySelector('#app-dialog');
    dialog?.addEventListener('close', cleanup, { once: true });
    reset();
    if (!reduced) loop();
  }

  function scheduleCard() {
    const grid = document.querySelector('#app-grid');
    if (grid && !grid.querySelector('.loading-card')) initCard();
    else requestAnimationFrame(scheduleCard);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleCard, { once: true });
  else scheduleCard();
})();