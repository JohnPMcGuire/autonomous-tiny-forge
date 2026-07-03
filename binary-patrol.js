(() => {
  const APP = {
    name: 'Binary Patrol', emoji: '🛰️', category: 'play', version: '1.0.0',
    summary: 'Vet noisy star signals, spend scarce telescope time, and separate binaries from impostors.',
    description: 'A local astronomy classification game with light-curve pattern reading, confidence wagers, follow-up budgets, false positives, streak scoring, adaptive cases, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and clean teardown.'
  };

  const TYPES = [
    { id: 'binary', label: 'Eclipsing binary', color: '#93c5fd', good: ['paired dips', 'steady period', 'matched center'] },
    { id: 'planet', label: 'Planet transit', color: '#86efac', good: ['single narrow dip', 'flat shoulders', 'weak depth'] },
    { id: 'noise', label: 'Instrument noise', color: '#fca5a5', good: ['jagged scatter', 'uneven baseline', 'no repeat'] },
    { id: 'blend', label: 'Blended neighbor', color: '#fcd34d', good: ['shifted centroid', 'crowded field', 'odd depth'] }
  ];
  const CASES = [
    { name: 'TIC-104 ridge', type: 'binary', period: 9, depth: .22, noise: .035, centroid: 1, crowd: 1 },
    { name: 'South arc flicker', type: 'noise', period: 7, depth: .13, noise: .11, centroid: 1, crowd: 0 },
    { name: 'Faint orchard pair', type: 'blend', period: 8, depth: .19, noise: .045, centroid: 4, crowd: 3 },
    { name: 'Quiet candle', type: 'planet', period: 11, depth: .08, noise: .025, centroid: 0, crowd: 1 },
    { name: 'Twin bell sector', type: 'binary', period: 6, depth: .25, noise: .05, centroid: 1, crowd: 2 },
    { name: 'Dust lane echo', type: 'blend', period: 10, depth: .16, noise: .055, centroid: 3, crowd: 4 },
    { name: 'Blue noon speckle', type: 'noise', period: 5, depth: .09, noise: .13, centroid: 2, crowd: 2 },
    { name: 'Long porch dimmer', type: 'planet', period: 13, depth: .07, noise: .04, centroid: 1, crowd: 0 }
  ];

  function installStyles() {
    if (document.querySelector('#binary-patrol-styles')) return;
    const style = document.createElement('style');
    style.id = 'binary-patrol-styles';
    style.textContent = `.binary-card{animation:binary-rise .32s ease both}.binary-game{max-width:980px;gap:14px}.binary-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.binary-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.binary-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.binary-stat strong{display:block;margin-top:4px;font-size:1rem}.binary-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#08111f;color:white;cursor:pointer;touch-action:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.binary-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.binary-board canvas{display:block;width:100%;min-height:430px}.binary-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.binary-overlay strong{font-size:clamp(1.05rem,3vw,1.5rem)}.binary-overlay small{display:block;max-width:690px;color:rgba(255,255,255,.76)}.binary-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#bfdbfe;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.binary-options{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.binary-options button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.binary-options button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.binary-options span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.binary-log{min-height:118px;padding:17px 19px}.binary-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:760px){.binary-hud{grid-template-columns:repeat(2,1fr)}.binary-options{grid-template-columns:1fr 1fr}.binary-board canvas{min-height:360px}.binary-overlay{align-items:start;flex-direction:column}}@media(max-width:480px){.binary-options{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.binary-card{animation:none}}@keyframes binary-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-binary-patrol-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.binaryPatrolCard = 'true';
    card.classList.add('binary-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openBinaryPatrol);
    grid.append(node);
  }

  function openBinaryPatrol() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Binary%20Patrol';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel binary-game';
    const hud = document.createElement('div');
    hud.className = 'binary-hud';
    hud.innerHTML = '<div class="binary-stat"><span>Case</span><strong id="binary-case">1 / 6</strong></div><div class="binary-stat"><span>Follow-up</span><strong id="binary-budget">4</strong></div><div class="binary-stat"><span>Confidence</span><strong id="binary-confidence">2</strong></div><div class="binary-stat"><span>Streak</span><strong id="binary-streak">0</strong></div><div class="binary-stat"><span>Score</span><strong id="binary-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'binary-board';
    board.setAttribute('aria-label', 'Binary Patrol light curve board. Inspect dips, spend follow-up time, choose a classification, and submit confidence.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="binary-overlay"><span><strong>Classify the signal before telescope time runs out.</strong><small>Tap the curve or press F for follow-up. Use 1 through 4 to classify, arrows to set confidence, and Enter to submit.</small></span><span class="binary-badge">Citizen science arcade</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const options = document.createElement('div');
    options.className = 'binary-options';
    const log = document.createElement('div');
    log.className = 'result-card binary-log';
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
    actions.append(makeButton('Spend follow-up', followUp, true), makeButton('Lower confidence', () => adjustConfidence(-1), true), makeButton('Raise confidence', () => adjustConfidence(1), true), makeButton('Submit call', submit, false), makeButton('Restart', reset, true));
    root.append(hud, board, options, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { index: 0, cases: shuffle(CASES).slice(0, 6), selected: 'binary', budget: 4, confidence: 2, streak: 0, score: 0, scanned: 0, done: false, raf: 0, pulse: 0 };

    function current() { return state.cases[state.index]; }
    function say(html) { log.innerHTML = html; }
    function reset() {
      state.index = 0; state.cases = shuffle(CASES).slice(0, 6); state.selected = 'binary'; state.budget = 4;
      state.confidence = 2; state.streak = 0; state.score = 0; state.scanned = 0; state.done = false;
      say('<strong>New patrol loaded.</strong><small>Read the curve, spend follow-up only when the signal is ambiguous, then wager confidence.</small>');
      update();
    }
    function select(id) {
      if (state.done) return;
      state.selected = id;
      const type = TYPES.find((item) => item.id === id);
      say(`<strong>${type.label} selected.</strong><small>Submit now or adjust confidence if the follow-up evidence is strong.</small>`);
      update();
    }
    function adjustConfidence(delta) {
      if (state.done) return;
      state.confidence = Math.max(1, Math.min(3, state.confidence + delta));
      say(`<strong>Confidence set to ${state.confidence}.</strong><small>Higher confidence multiplies a correct call but deepens the penalty for a miss.</small>`);
      update();
    }
    function followUp() {
      if (state.done) return;
      if (state.budget <= 0) return say('<strong>No follow-up time remains.</strong><small>You must classify from the current curve and field notes.</small>');
      state.budget -= 1; state.scanned += 1;
      const c = current();
      const clues = [
        `Centroid shift: ${c.centroid > 2 ? 'high' : c.centroid ? 'minor' : 'none'}`,
        `Crowded field: ${c.crowd > 2 ? 'yes' : 'limited'}`,
        `Repeat quality: ${c.noise > .09 ? 'poor' : c.period < 8 ? 'fast' : 'steady'}`
      ];
      say(`<strong>Follow-up note ${state.scanned}: ${clues[(state.scanned - 1) % clues.length]}.</strong><small>Budget is scarce. Strong centroid shift points toward a blended neighbor.</small>`);
      update();
    }
    function submit() {
      if (state.done) return;
      const c = current();
      const correct = state.selected === c.type;
      if (correct) {
        state.streak += 1;
        state.score += 40 * state.confidence + state.streak * 8 + state.budget * 3;
        say(`<strong>Confirmed ${label(c.type)}.</strong><small>Correct call. Streak ${state.streak} adds a review bonus.</small>`);
      } else {
        state.score = Math.max(0, state.score - 18 * state.confidence);
        state.streak = 0;
        say(`<strong>False ${label(state.selected)}.</strong><small>The archive answer was ${label(c.type)}. Recover with lower confidence or more follow-up next case.</small>`);
      }
      state.index += 1; state.selected = 'binary'; state.confidence = 2; state.scanned = 0;
      if (state.index >= state.cases.length) {
        state.done = true;
        say(`<strong>Patrol complete: ${state.score} points.</strong><small>${state.score >= 360 ? 'Catalog lead quality.' : state.score >= 220 ? 'Useful volunteer pass.' : 'Needs another review pass.'} Restart for a new target mix.</small>`);
      }
      update();
    }
    function label(id) { return TYPES.find((item) => item.id === id)?.label || id; }
    function shuffle(list) {
      return list.map((value) => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map((item) => item.value);
    }
    function buildOptions() {
      options.replaceChildren();
      TYPES.forEach((type, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-pressed', String(state.selected === type.id));
        button.innerHTML = `<span>${index + 1}</span><strong>${type.label}</strong><small>${type.good.join(', ')}</small>`;
        button.addEventListener('click', () => select(type.id));
        options.append(button);
      });
    }
    function update() {
      const c = current() || state.cases[state.cases.length - 1];
      hud.querySelector('#binary-case').textContent = `${Math.min(state.index + 1, state.cases.length)} / ${state.cases.length}`;
      hud.querySelector('#binary-budget').textContent = String(state.budget);
      hud.querySelector('#binary-confidence').textContent = String(state.confidence);
      hud.querySelector('#binary-streak').textContent = String(state.streak);
      hud.querySelector('#binary-score').textContent = String(state.score);
      board.setAttribute('aria-label', `${APP.name} board. Current target ${c.name}. Follow-up budget ${state.budget}. Selected ${label(state.selected)} with confidence ${state.confidence}.`);
      buildOptions();
      draw();
    }
    function signalValue(c, x) {
      let y = .58 + Math.sin(x * Math.PI * 4) * .015;
      const phase = (x * c.period) % 1;
      const dip = c.type === 'planet' ? .045 : .075;
      if (phase < dip || phase > 1 - dip) y += c.depth * (c.type === 'noise' ? .35 : 1);
      if (c.type === 'binary' && Math.abs(phase - .5) < .06) y += c.depth * .65;
      if (c.type === 'blend' && Math.abs(phase - .52) < .07) y += c.depth * .5;
      y += (Math.sin(x * 91 + c.period) + Math.sin(x * 37)) * c.noise * .22;
      if (c.type === 'noise') y += Math.sin(x * 180) * c.noise * .35;
      return Math.max(.18, Math.min(.9, y));
    }
    function draw() {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width || 760));
      const height = Math.max(320, Math.floor(rect.height || 420));
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * scale); canvas.height = Math.floor(height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const c = current() || state.cases[state.cases.length - 1];
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#0f172a'); gradient.addColorStop(1, '#111827');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1;
      for (let i = 1; i < 6; i += 1) { ctx.beginPath(); ctx.moveTo(40, i * height / 7); ctx.lineTo(width - 28, i * height / 7); ctx.stroke(); }
      ctx.strokeStyle = TYPES.find((item) => item.id === state.selected).color; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 150; i += 1) {
        const x = i / 150;
        const px = 42 + x * (width - 76);
        const py = 50 + signalValue(c, x) * (height - 130);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.font = '700 16px system-ui, sans-serif'; ctx.fillText(c.name, 26, 34);
      ctx.font = '700 12px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.62)';
      ctx.fillText(`Field crowd ${c.crowd} · centroid ${c.centroid} · noise ${Math.round(c.noise * 100)}`, 26, 54);
      if (!reduced) state.pulse += .04;
      const sweep = 42 + ((Math.sin(state.pulse) + 1) / 2) * (width - 76);
      ctx.strokeStyle = 'rgba(191,219,254,.35)'; ctx.beginPath(); ctx.moveTo(sweep, 70); ctx.lineTo(sweep, height - 78); ctx.stroke();
    }
    function loop() { draw(); if (!reduced && !state.done) state.raf = requestAnimationFrame(loop); }
    board.addEventListener('click', followUp);
    root.addEventListener('keydown', (event) => {
      if (event.key >= '1' && event.key <= '4') { event.preventDefault(); select(TYPES[Number(event.key) - 1].id); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); adjustConfidence(-1); }
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); adjustConfidence(1); }
      if (event.key === 'Enter') { event.preventDefault(); submit(); }
      if (event.key.toLowerCase() === 'f') { event.preventDefault(); followUp(); }
    });
    const observer = new MutationObserver(() => { if (!document.body.contains(root)) { cancelAnimationFrame(state.raf); observer.disconnect(); } });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', draw, { passive: true });
    say('<strong>Patrol queue ready.</strong><small>Inspired by human review of machine-flagged TESS light curves. Classify carefully and avoid overconfident false positives.</small>');
    update();
    if (!reduced) state.raf = requestAnimationFrame(loop);
  }

  window.addEventListener('load', () => setTimeout(initCard, 80));
})();
