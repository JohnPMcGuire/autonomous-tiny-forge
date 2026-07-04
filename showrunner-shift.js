(() => {
  const APP = {
    name: 'Showrunner Shift',
    emoji: '📺',
    category: 'play',
    version: '1.0.0',
    summary: 'Program a live variety hour by balancing audience mood, sponsors, crew heat, and surprise breakdowns.',
    description: 'A local live-show strategy game with segment drafting, audience lanes, sponsor promises, crew heat, crisis recovery, scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and animation teardown.'
  };

  const SEGMENTS = [
    { id: 'cold', name: 'Cold open', mood: 16, trust: 8, heat: 8, sponsor: 0, tag: 'Fast hook' },
    { id: 'sketch', name: 'Risky sketch', mood: 24, trust: -7, heat: 14, sponsor: -4, tag: 'Big laugh' },
    { id: 'guest', name: 'Guest story', mood: 11, trust: 16, heat: 6, sponsor: 4, tag: 'Calms room' },
    { id: 'ad', name: 'Sponsor read', mood: -8, trust: 4, heat: 2, sponsor: 22, tag: 'Pays bills' },
    { id: 'music', name: 'Live music', mood: 18, trust: 7, heat: 18, sponsor: 5, tag: 'Crew heavy' },
    { id: 'field', name: 'Field piece', mood: 13, trust: 12, heat: -8, sponsor: 3, tag: 'Buys reset' },
    { id: 'stunt', name: 'Table stunt', mood: 28, trust: -13, heat: 24, sponsor: -8, tag: 'Volatile' },
    { id: 'panel', name: 'Panel bit', mood: 8, trust: 18, heat: 5, sponsor: 8, tag: 'Stable' }
  ];

  const CRISES = [
    { name: 'Guest late', heat: 10, mood: -6, sponsor: 0, copy: 'The guest is still in makeup. A flexible segment order saves the beat.' },
    { name: 'Mic squeal', heat: 16, mood: -10, sponsor: -2, copy: 'Audio spikes into the room. Crew heat matters now.' },
    { name: 'Sponsor note', heat: 5, mood: -4, sponsor: -14, copy: 'The sponsor wants cleaner placement before the final block.' },
    { name: 'Crowd lull', heat: 2, mood: -18, sponsor: 0, copy: 'The room is drifting. A high-energy segment can recover it.' }
  ];

  function installStyles() {
    if (document.querySelector('#showrunner-shift-styles')) return;
    const style = document.createElement('style');
    style.id = 'showrunner-shift-styles';
    style.textContent = `.showrunner-card{animation:showrunner-rise .32s ease both}.showrunner-game{max-width:1040px;gap:14px}.showrunner-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.showrunner-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.showrunner-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.showrunner-stat strong{display:block;margin-top:4px;font-size:1rem}.showrunner-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#10091d;color:white;cursor:pointer;touch-action:manipulation;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.showrunner-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.showrunner-board canvas{display:block;width:100%;min-height:410px}.showrunner-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.showrunner-overlay strong{font-size:clamp(1.05rem,3vw,1.55rem)}.showrunner-overlay small{display:block;max-width:700px;color:rgba(255,255,255,.76)}.showrunner-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.13);color:#fde68a;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.showrunner-segments{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.showrunner-segments button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.showrunner-segments button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.showrunner-segments button:disabled{opacity:.45;cursor:not-allowed}.showrunner-segments span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.showrunner-log{min-height:118px;padding:17px 19px}.showrunner-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:780px){.showrunner-hud{grid-template-columns:repeat(2,1fr)}.showrunner-segments{grid-template-columns:1fr}.showrunner-board canvas{min-height:350px}.showrunner-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.showrunner-card{animation:none}}@keyframes showrunner-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-showrunner-shift-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.showrunnerShiftCard = 'true';
    card.classList.add('showrunner-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openShowrunnerShift);
    grid.append(node);
  }

  function openShowrunnerShift() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Showrunner%20Shift';
    stage.replaceChildren();
    renderGame(stage, dialog);
    dialog.showModal();
  }

  function renderGame(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel showrunner-game';
    const hud = document.createElement('div');
    hud.className = 'showrunner-hud';
    hud.innerHTML = '<div class="showrunner-stat"><span>Block</span><strong id="show-block">1 / 6</strong></div><div class="showrunner-stat"><span>Audience</span><strong id="show-mood">50</strong></div><div class="showrunner-stat"><span>Trust</span><strong id="show-trust">50</strong></div><div class="showrunner-stat"><span>Sponsor</span><strong id="show-sponsor">0 / 60</strong></div><div class="showrunner-stat"><span>Score</span><strong id="show-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'showrunner-board';
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="showrunner-overlay"><span><strong>Build a six-block live show.</strong><small>Pick a segment, then press Run block. Keep audience, trust, crew heat, and sponsor promises alive through crisis notes.</small></span><span class="showrunner-badge">Live strategy</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const segments = document.createElement('div');
    segments.className = 'showrunner-segments';
    const log = document.createElement('div');
    log.className = 'result-card showrunner-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const runButton = makeButton('Run block', runBlock);
    const recoverButton = makeButton('Emergency reset', recover, true);
    const restartButton = makeButton('Restart', reset, true);
    actions.append(runButton, recoverButton, restartButton);
    root.append(hud, board, segments, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { block: 0, mood: 50, trust: 50, sponsor: 0, heat: 20, score: 0, selected: 0, used: [], crisis: null, done: false, raf: 0, pulse: 0 };
    dialog.addEventListener('close', teardown, { once: true });

    function makeButton(text, fn, secondary) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = secondary ? 'button button-secondary' : 'button';
      button.textContent = text;
      button.addEventListener('click', fn);
      return button;
    }
    function clamp(value) { return Math.max(0, Math.min(100, value)); }
    function segment() { return SEGMENTS[state.selected]; }
    function say(html) { log.innerHTML = html; }
    function reset() {
      state.block = 0; state.mood = 50; state.trust = 50; state.sponsor = 0; state.heat = 20; state.score = 0;
      state.selected = 0; state.used = []; state.crisis = null; state.done = false; state.pulse = 0;
      say('<strong>The control room is live.</strong><small>Draft six segments. Repeating formats is blocked, so build rhythm: hook, earn trust, place sponsor, and cool the crew before heat cascades.</small>');
      update();
    }
    function select(index) {
      if (state.done || state.used.includes(SEGMENTS[index].id)) return;
      state.selected = index;
      const item = segment();
      say(`<strong>${item.name} cued.</strong><small>${item.tag}. Audience ${item.mood >= 0 ? '+' : ''}${item.mood}, trust ${item.trust >= 0 ? '+' : ''}${item.trust}, heat ${item.heat >= 0 ? '+' : ''}${item.heat}, sponsor ${item.sponsor >= 0 ? '+' : ''}${item.sponsor}.</small>`);
      update();
    }
    function runBlock() {
      if (state.done) return;
      const item = segment();
      if (state.used.includes(item.id)) return;
      state.used.push(item.id);
      state.block += 1;
      const crisis = state.block === 2 || state.block === 4 || state.block === 5 ? CRISES[(state.block + state.selected) % CRISES.length] : null;
      state.crisis = crisis;
      state.mood = clamp(state.mood + item.mood + (crisis?.mood || 0) - Math.max(0, Math.floor((state.heat - 72) / 3)));
      state.trust = clamp(state.trust + item.trust - (state.heat > 82 ? 9 : 0));
      state.sponsor = clamp(state.sponsor + item.sponsor + (crisis?.sponsor || 0));
      state.heat = clamp(state.heat + item.heat + (crisis?.heat || 0) - 6);
      state.score += Math.max(0, state.mood + state.trust + state.sponsor - state.heat + state.block * 8);
      state.pulse = 1;
      if (state.mood < 12 || state.trust < 10 || state.heat > 96) {
        state.done = true;
        say(`<strong>The live show melted down during ${item.name}.</strong><small>${crisis ? crisis.copy : 'The room lost the thread.'} Final score ${state.score}. Restart and give the crew more cooling beats.</small>`);
      } else if (state.block >= 6) {
        state.done = true;
        const bonus = state.sponsor >= 60 ? 90 : -40;
        state.score += bonus;
        say(`<strong>Good night from studio B.</strong><small>Final score ${state.score}. ${state.sponsor >= 60 ? 'Sponsor promise cleared.' : 'Sponsor promise missed, but the show survived.'} Replay for a cleaner run.</small>`);
      } else {
        say(`<strong>${item.name} landed.</strong><small>${crisis ? crisis.copy : 'No crisis this block.'} Choose the next unused segment and protect the final sponsor target.</small>`);
      }
      update();
    }
    function recover() {
      if (state.done) return;
      if (state.score < 35) {
        say('<strong>No reset budget yet.</strong><small>Emergency reset needs at least 35 score banked.</small>');
        return;
      }
      state.score -= 35;
      state.heat = Math.max(8, state.heat - 28);
      state.trust = clamp(state.trust + 8);
      state.mood = clamp(state.mood - 5);
      state.pulse = 1;
      say('<strong>Emergency reset called.</strong><small>You spent score to cool the crew and regain trust, but the room felt the pause.</small>');
      update();
    }
    function update() {
      hud.querySelector('#show-block').textContent = `${Math.min(state.block + 1, 6)} / 6`;
      hud.querySelector('#show-mood').textContent = state.mood;
      hud.querySelector('#show-trust').textContent = state.trust;
      hud.querySelector('#show-sponsor').textContent = `${state.sponsor} / 60`;
      hud.querySelector('#show-score').textContent = state.score;
      segments.replaceChildren();
      SEGMENTS.forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.disabled = state.done || state.used.includes(item.id);
        button.setAttribute('aria-pressed', String(index === state.selected));
        button.innerHTML = `<strong>${item.name}</strong><span>${item.tag} · heat ${item.heat >= 0 ? '+' : ''}${item.heat}</span>`;
        button.addEventListener('click', () => select(index));
        segments.append(button);
      });
      draw();
    }
    function draw() {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(320, Math.floor(rect.width * scale));
      canvas.height = Math.max(330, Math.floor(rect.height * scale));
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const w = canvas.width / scale;
      const h = canvas.height / scale;
      ctx.clearRect(0, 0, w, h);
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, '#24123f'); gradient.addColorStop(1, '#080613');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      for (let i = 0; i < 9; i += 1) ctx.fillRect(22 + i * (w - 44) / 8, 54, 2, h - 132);
      const meters = [ ['Audience', state.mood, '#fbbf24'], ['Trust', state.trust, '#93c5fd'], ['Sponsor', state.sponsor, '#86efac'], ['Heat', state.heat, '#fca5a5'] ];
      meters.forEach((meter, index) => {
        const x = 36 + index * ((w - 72) / 4);
        const y = 92;
        const bw = Math.max(44, (w - 120) / 5);
        const bh = h - 190;
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x, y, bw, bh);
        ctx.fillStyle = meter[2]; ctx.fillRect(x, y + bh * (1 - meter[1] / 100), bw, bh * (meter[1] / 100));
        ctx.fillStyle = 'white'; ctx.font = '700 12px system-ui'; ctx.fillText(meter[0], x, y + bh + 22);
      });
      ctx.fillStyle = 'rgba(255,255,255,.78)'; ctx.font = '800 13px system-ui';
      ctx.fillText(`Selected: ${segment().name}`, 28, 34);
      ctx.fillText(`Used blocks: ${state.used.length}`, w - 132, 34);
      if (!reduced && state.pulse > 0) {
        ctx.strokeStyle = 'rgba(253,230,138,.55)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(w / 2, h / 2, 40 + state.pulse * 90, 0, Math.PI * 2); ctx.stroke();
        state.pulse = Math.max(0, state.pulse - .04);
      }
    }
    function loop() { draw(); if (!reduced) state.raf = requestAnimationFrame(loop); }
    function teardown() { cancelAnimationFrame(state.raf); window.removeEventListener('resize', draw); }
    board.addEventListener('click', runBlock);
    board.addEventListener('keydown', (event) => {
      if (event.key >= '1' && event.key <= '8') { event.preventDefault(); select(Number(event.key) - 1); }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); runBlock(); }
      if (event.key.toLowerCase() === 'r') recover();
    });
    window.addEventListener('resize', draw);
    reset();
    if (reduced) draw(); else loop();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard, { once: true });
  else initCard();
})();
