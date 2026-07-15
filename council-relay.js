(() => {
  'use strict';

  const APP = {
    name: 'Council Relay',
    emoji: '🤝',
    category: 'play',
    version: '1.0.0',
    summary: 'Pass one device through three hidden-information council roles and keep a shared watershed compact alive.',
    description: 'A same-device cooperative strategy game for one to three players. Rotate through Scout, Advocate, and Steward roles, reveal partial information, negotiate limited commitments, respond to shocks, manage water and trust, recover from failure, and certify a shared compact in a local-only session.'
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const districts = [
    { name: 'Cedar Town', need: 5, trust: 3, priority: 'household reserve' },
    { name: 'Sunfield Farms', need: 7, trust: 3, priority: 'crop continuity' },
    { name: 'Heron Marsh', need: 4, trust: 3, priority: 'minimum habitat flow' }
  ];

  const forecasts = [
    { title: 'Dry front', detail: 'Next round demand rises by 2 in one district.', delta: 2 },
    { title: 'Recharge pulse', detail: 'A protected district gains 3 reserve.', delta: -1 },
    { title: 'Salt pressure', detail: 'The least trusted district loses 1 trust unless protected.', delta: 1 },
    { title: 'Pipe repair', detail: 'A committed district receives 2 extra supply.', delta: 0 }
  ];

  function installStyles() {
    if ($('#council-relay-style')) return;
    const style = document.createElement('style');
    style.id = 'council-relay-style';
    style.textContent = `
      .relay{max-width:980px;display:grid;gap:12px}.relay-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:7px}.relay-stat,.relay-card{border:1px solid var(--line);border-radius:17px;background:#fff}.relay-stat{padding:9px}.relay-stat span{display:block;font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.relay-stat strong{display:block;margin-top:3px}.relay-layout{display:grid;grid-template-columns:1.1fr .9fr;gap:12px}.relay-card{padding:15px}.relay-role{display:grid;gap:9px}.relay-pass{min-height:260px;display:grid;place-items:center;text-align:center;padding:26px;border:2px dashed #64748b;border-radius:20px;background:linear-gradient(145deg,#f8fafc,#eef2ff)}.relay-pass strong{font-size:clamp(1.7rem,5vw,3rem);line-height:1}.relay-actions,.relay-districts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.relay button{min-height:44px;border:1px solid var(--line);border-radius:11px;background:#fff;color:inherit;font-weight:800}.relay button[aria-pressed=true]{background:#dbeafe;border-color:#2563eb}.relay button:focus-visible{outline:3px solid #2563eb;outline-offset:2px}.relay-district{padding:10px;text-align:left}.relay-district strong,.relay-district small{display:block}.relay-track{height:12px;border-radius:999px;background:#e2e8f0;overflow:hidden}.relay-track span{display:block;height:100%;background:linear-gradient(90deg,#ef4444,#facc15,#22c55e);transition:width .25s}.relay-log{min-height:95px}.relay-secret{padding:12px;border-radius:14px;background:#0f172a;color:#fff}.relay-secret small{color:#cbd5e1}.relay-badges{display:flex;flex-wrap:wrap;gap:6px}.relay-badge{padding:5px 8px;border-radius:999px;background:#e0e7ff;font-size:.78rem;font-weight:800}.relay-summary{display:grid;gap:7px}.relay-summary li{margin-left:18px}.relay-recovery{border-color:#f59e0b;background:#fffbeb}
      @media(max-width:820px){.relay-layout{grid-template-columns:1fr}.relay-hud{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:560px){.relay-hud{grid-template-columns:repeat(2,1fr)}.relay-actions,.relay-districts{grid-template-columns:1fr}.relay-pass{min-height:220px}}
      @media(prefers-reduced-motion:reduce){.relay *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
    `;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid');
    const template = $('#app-card-template');
    if (!grid || !template || $('[data-council-relay]')) return;
    const active = $('.filter.is-active')?.dataset.filter || 'all';
    if (active !== 'all' && active !== APP.category) return;
    const fragment = template.content.cloneNode(true);
    $('.app-card', fragment).dataset.councilRelay = '1';
    $('.app-icon', fragment).textContent = APP.emoji;
    $('.app-meta', fragment).textContent = `Play · v${APP.version}`;
    $('.app-name', fragment).textContent = APP.name;
    $('.app-summary', fragment).textContent = APP.summary;
    const button = $('.app-card-button', fragment);
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', openApp);
    grid.append(fragment);
  }

  function boot() {
    installStyles();
    let attempts = 0;
    const retry = () => {
      addCard();
      if (!$('[data-council-relay]') && attempts++ < 20) setTimeout(retry, 120);
    };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.councilRelayBound) return;
      button.dataset.councilRelayBound = '1';
      button.addEventListener('click', () => setTimeout(addCard));
    });
  }

  function openApp() {
    const dialog = $('#app-dialog');
    const stage = $('#app-stage');
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = 'Play · same-device cooperation';
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Council%20Relay';
    stage.replaceChildren();
    startGame(stage, dialog);
    dialog.showModal();
  }

  function startGame(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel relay';
    root.innerHTML = `
      <div class="relay-hud">
        ${['Round','Role','Water','Reserve','Influence','Trust'].map((label, index) => `<div class="relay-stat"><span>${label}</span><strong data-hud="${index}">—</strong></div>`).join('')}
      </div>
      <div class="relay-layout">
        <section class="relay-card">
          <div class="relay-pass" data-pass>
            <div><p class="eyebrow">Pass-device council</p><strong>Start compact</strong><p>Each role sees different information. Do not read another role's screen unless playing solo.</p><button data-action="reveal">Reveal Scout brief</button></div>
          </div>
          <div class="relay-role" data-role hidden>
            <div class="relay-secret"><strong data-secret-title></strong><small data-secret-detail></small></div>
            <div class="relay-districts" role="group" aria-label="Choose a district"></div>
            <div class="relay-actions"></div>
          </div>
        </section>
        <aside class="relay-card">
          <h3>Shared compact</h3>
          <div class="relay-badges" data-badges></div>
          <p><strong>Compact health</strong></p><div class="relay-track"><span></span></div>
          <div class="relay-log result-card" aria-live="polite"></div>
          <div class="relay-summary"><h3>How roles connect</h3><ul><li>Scout reveals one forecast and protects a district.</li><li>Advocate commits influence to one district need.</li><li>Steward allocates water, reserves supply, or calls recovery.</li></ul></div>
          <button data-action="restart">Restart compact</button>
          <p><small>Keyboard: 1–3 choose a district, Enter confirms the highlighted action, R restarts. All information stays in this page.</small></p>
        </aside>
      </div>`;
    stage.append(root);

    let state;
    let cleanupTimer = 0;
    const roles = ['Scout', 'Advocate', 'Steward'];

    function reset() {
      state = {
        round: 1,
        role: 0,
        water: 12,
        reserve: 5,
        influence: 4,
        protected: null,
        commitment: null,
        selected: 0,
        recovery: 1,
        score: 0,
        finished: false,
        currentForecast: forecasts[Math.floor(Math.random() * forecasts.length)],
        districts: districts.map((district) => ({ ...district, supplied: 0, misses: 0 }))
      };
      showPass('Start compact', 'Each role sees different information. Pass the device before revealing a brief.', 'Reveal Scout brief');
      announce('Compact ready.', 'Complete three role turns per round. The compact survives four rounds if trust and reserve remain above zero.');
      draw();
    }

    function averageTrust() {
      return state.districts.reduce((sum, district) => sum + district.trust, 0) / state.districts.length;
    }

    function health() {
      return clamp(Math.round(averageTrust() * 14 + state.reserve * 7 + state.water * 2 - state.districts.reduce((sum, district) => sum + district.misses, 0) * 9), 0, 100);
    }

    function announce(title, detail) {
      const log = $('.relay-log', root);
      log.replaceChildren(Object.assign(document.createElement('strong'), { textContent: title }), Object.assign(document.createElement('small'), { textContent: detail }));
    }

    function showPass(title, detail, buttonText) {
      $('[data-role]', root).hidden = true;
      const pass = $('[data-pass]', root);
      pass.hidden = false;
      pass.innerHTML = `<div><p class="eyebrow">Pass-device council</p><strong>${title}</strong><p>${detail}</p><button data-action="reveal">${buttonText}</button></div>`;
      $('[data-action="reveal"]', pass).focus();
    }

    function revealRole() {
      if (state.finished) return;
      $('[data-pass]', root).hidden = true;
      $('[data-role]', root).hidden = false;
      drawRole();
    }

    function roleSecret() {
      const district = state.districts[state.selected];
      if (state.role === 0) return { title: state.currentForecast.title, detail: `${state.currentForecast.detail} Choose one district to protect before passing.` };
      if (state.role === 1) return { title: `${district.name} priority`, detail: `${district.priority}. Current need ${district.need}; trust ${district.trust}. Commit influence where a promise matters most.` };
      return { title: 'Steward ledger', detail: `Water ${state.water}, reserve ${state.reserve}. Protected: ${state.protected === null ? 'none' : state.districts[state.protected].name}. Commitment: ${state.commitment === null ? 'none' : state.districts[state.commitment].name}.` };
    }

    function drawRole() {
      const secret = roleSecret();
      $('[data-secret-title]', root).textContent = `${roles[state.role]} brief: ${secret.title}`;
      $('[data-secret-detail]', root).textContent = secret.detail;
      $('.relay-districts', root).innerHTML = state.districts.map((district, index) => `<button class="relay-district" data-district="${index}" aria-pressed="${index === state.selected}"><strong>${index + 1}. ${district.name}</strong><small>Need ${district.need} · supplied ${district.supplied} · trust ${district.trust}</small></button>`).join('');
      const actions = $('.relay-actions', root);
      if (state.role === 0) actions.innerHTML = '<button data-action="protect">Protect district</button><button data-action="scan">Spend reserve to scan</button>';
      if (state.role === 1) actions.innerHTML = '<button data-action="commit">Commit influence</button><button data-action="mediate">Mediate trust</button>';
      if (state.role === 2) actions.innerHTML = '<button data-action="supply">Allocate 3 water</button><button data-action="bank">Bank 2 reserve</button><button data-action="recover">Emergency recovery</button>';
    }

    function select(index) {
      state.selected = clamp(index, 0, state.districts.length - 1);
      if (!$('[data-role]', root).hidden) drawRole();
      draw();
    }

    function finishRole(result) {
      announce(result.title, result.detail);
      if (state.role < 2) {
        state.role += 1;
        showPass(`Pass to ${roles[state.role]}`, 'Keep the previous role brief private. The next player should reveal only when ready.', `Reveal ${roles[state.role]} brief`);
      } else {
        resolveRound();
      }
      draw();
    }

    function act(action) {
      if (state.finished) return;
      const district = state.districts[state.selected];
      if (state.role === 0 && action === 'protect') {
        state.protected = state.selected;
        finishRole({ title: 'Protection marked.', detail: `${district.name} will absorb the next forecast pressure.` });
      } else if (state.role === 0 && action === 'scan') {
        if (state.reserve < 1) return announce('No reserve to spend.', 'Choose a protection target instead.');
        state.reserve -= 1;
        const next = forecasts[(forecasts.indexOf(state.currentForecast) + 1) % forecasts.length];
        finishRole({ title: 'Second forecast revealed.', detail: `After ${state.currentForecast.title.toLowerCase()}, expect ${next.title.toLowerCase()}.` });
      } else if (state.role === 1 && action === 'commit') {
        if (state.influence < 1) return announce('Influence exhausted.', 'Use mediation to stabilize trust instead.');
        state.influence -= 1;
        state.commitment = state.selected;
        finishRole({ title: 'Public commitment made.', detail: `${district.name} expects its need to be met this round.` });
      } else if (state.role === 1 && action === 'mediate') {
        if (state.influence < 2) return announce('Not enough influence.', 'Mediation costs 2 influence.');
        state.influence -= 2;
        district.trust = clamp(district.trust + 1, 0, 5);
        finishRole({ title: 'Council mediated.', detail: `${district.name} trust rose, but no delivery promise was made.` });
      } else if (state.role === 2 && action === 'supply') {
        if (state.water < 3) return announce('Water too low.', 'Bank reserve or use emergency recovery.');
        state.water -= 3;
        district.supplied += 3;
        finishRole({ title: 'Water allocated.', detail: `${district.name} received 3 supply.` });
      } else if (state.role === 2 && action === 'bank') {
        if (state.water < 2) return announce('Water too low.', 'The compact cannot bank more reserve.');
        state.water -= 2;
        state.reserve += 2;
        finishRole({ title: 'Reserve banked.', detail: 'Two water moved into shared drought reserve.' });
      } else if (state.role === 2 && action === 'recover') {
        if (!state.recovery) return announce('Recovery already used.', 'The council must finish with remaining resources.');
        state.recovery = 0;
        state.water += 4;
        state.influence += 1;
        state.districts.forEach((item) => { item.trust = Math.max(2, item.trust); });
        finishRole({ title: 'Emergency compact invoked.', detail: 'Water and influence recovered, and collapsing trust was stabilized.' });
      }
    }

    function resolveRound() {
      const pressured = state.protected ?? Math.floor(Math.random() * state.districts.length);
      state.districts[pressured].need += state.currentForecast.delta;
      if (state.protected === pressured) state.districts[pressured].need = Math.max(2, state.districts[pressured].need - 2);
      state.districts.forEach((district, index) => {
        const met = district.supplied >= district.need;
        if (met) {
          district.trust = clamp(district.trust + 1, 0, 5);
          state.score += 20;
        } else {
          district.misses += 1;
          district.trust = clamp(district.trust - (state.commitment === index ? 2 : 1), 0, 5);
          state.score -= state.commitment === index ? 15 : 7;
        }
        district.supplied = 0;
      });
      state.reserve += state.currentForecast.title === 'Recharge pulse' ? 2 : 0;
      state.water += 8;
      state.influence += 2;
      if (averageTrust() <= 1 || state.reserve <= 0) return end(false, 'Council walkout', 'Trust or reserve collapsed before the compact could be certified.');
      if (state.round >= 4) return end(true, 'Compact certified', `Shared score ${state.score}. The council retained trust through four incomplete-information rounds.`);
      state.round += 1;
      state.role = 0;
      state.protected = null;
      state.commitment = null;
      state.currentForecast = forecasts[Math.floor(Math.random() * forecasts.length)];
      showPass(`Round ${state.round}`, 'Pass to the Scout. District needs and trust now reflect the last council cycle.', 'Reveal Scout brief');
      announce('Round resolved.', `Average trust ${averageTrust().toFixed(1)}. Reserve ${state.reserve}. Plan the next incomplete-information cycle.`);
    }

    function end(success, title, detail) {
      state.finished = true;
      $('[data-role]', root).hidden = true;
      const pass = $('[data-pass]', root);
      pass.hidden = false;
      pass.classList.toggle('relay-recovery', !success);
      pass.innerHTML = `<div><p class="eyebrow">${success ? 'Certified' : 'Recovery needed'}</p><strong>${title}</strong><p>${detail}</p><button data-action="restart">Play another compact</button></div>`;
      announce(title, detail);
    }

    function draw() {
      const values = [state.round + '/4', roles[state.role], state.water, state.reserve, state.influence, averageTrust().toFixed(1)];
      $$('[data-hud]', root).forEach((node, index) => { node.textContent = values[index]; });
      $('.relay-track span', root).style.width = `${health()}%`;
      $('[data-badges]', root).innerHTML = [
        `Recovery ${state.recovery ? 'ready' : 'used'}`,
        state.protected === null ? 'No protection' : `Protected ${state.districts[state.protected].name}`,
        state.commitment === null ? 'No promise' : `Promised ${state.districts[state.commitment].name}`
      ].map((text) => `<span class="relay-badge">${text}</span>`).join('');
    }

    root.addEventListener('click', (event) => {
      const district = event.target.closest('[data-district]');
      if (district) select(Number(district.dataset.district));
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'reveal') revealRole();
      if (action === 'restart') reset();
      if (['protect','scan','commit','mediate','supply','bank','recover'].includes(action)) act(action);
    });

    const keydown = (event) => {
      if (!dialog.open) return;
      if (/^[1-3]$/.test(event.key)) select(Number(event.key) - 1);
      if (event.key.toLowerCase() === 'r') reset();
    };
    window.addEventListener('keydown', keydown);
    dialog.addEventListener('close', () => {
      window.removeEventListener('keydown', keydown);
      clearTimeout(cleanupTimer);
      $('#council-relay-style')?.remove();
    }, { once: true });

    reset();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
