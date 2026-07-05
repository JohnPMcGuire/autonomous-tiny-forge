(() => {
  const APP = {
    name: 'Tidepool Tactics',
    emoji: '🦀',
    category: 'play',
    version: '1.0.0',
    summary: 'Guide a field biologist through tide pools while balancing oxygen, samples, restoration, and rising water.',
    description: 'A local conservation tactics mini-game with tide cycles, fragile habitats, sample goals, oxygen pressure, restoration tradeoffs, adaptive rounds, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, optional local audio, and clean teardown.'
  };

  function installStyles() {
    if (document.querySelector('#tidepool-tactics-styles')) return;
    const style = document.createElement('style');
    style.id = 'tidepool-tactics-styles';
    style.textContent = `.tidepool-card{animation:tidepool-rise .32s ease both}.tidepool-game{max-width:1080px;gap:14px}.tidepool-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.tidepool-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.tidepool-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.tidepool-stat strong{display:block;margin-top:4px;font-size:1rem}.tidepool-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#062033;color:white;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.tidepool-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.tidepool-board canvas{display:block;width:100%;min-height:430px}.tidepool-overlay{position:absolute;left:16px;right:16px;bottom:14px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.tidepool-overlay strong{font-size:clamp(1rem,3vw,1.45rem)}.tidepool-overlay small{display:block;max-width:760px;color:rgba(255,255,255,.78)}.tidepool-badge{padding:7px 9px;border-radius:999px;background:rgba(45,212,191,.18);color:#99f6e4;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.tidepool-tools{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.tidepool-tools button{border:1px solid var(--line);border-radius:16px;background:white;color:var(--ink);padding:12px 8px;font-weight:900}.tidepool-tools button[aria-pressed=true]{box-shadow:inset 0 0 0 2px var(--accent)}.tidepool-log{min-height:118px;padding:17px 19px}.tidepool-log strong{font-size:clamp(1.08rem,3vw,1.5rem)}@media(max-width:760px){.tidepool-hud{grid-template-columns:repeat(2,1fr)}.tidepool-tools{grid-template-columns:repeat(2,1fr)}.tidepool-board canvas{min-height:360px}.tidepool-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.tidepool-card{animation:none}}@keyframes tidepool-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function labelCategory(value) { return value === 'play' ? 'Play' : value === 'useful' ? 'Useful' : 'Experiment'; }
  function activeFilter() { return document.querySelector('.filter.is-active')?.dataset.filter || 'all'; }
  function eligible() { const filter = activeFilter(); return filter === 'all' || filter === APP.category; }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-tidepool-tactics-card]') || !eligible()) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.tidepoolTacticsCard = 'true';
    card.classList.add('tidepool-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `${labelCategory(APP.category)} · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openApp);
    grid.append(node);
  }

  function wireFilterRefresh() {
    document.querySelectorAll('.filter').forEach((button) => {
      if (button.dataset.tidepoolTacticsRefresh) return;
      button.dataset.tidepoolTacticsRefresh = 'true';
      button.addEventListener('click', () => setTimeout(initCard, 0));
    });
  }

  function openApp() {
    const dialog = document.querySelector('#app-dialog');
    const stage = document.querySelector('#app-stage');
    const title = document.querySelector('#dialog-title');
    const category = document.querySelector('#dialog-category');
    const description = document.querySelector('#dialog-description');
    const feedback = document.querySelector('#dialog-feedback');
    if (!dialog || !stage || !title || !category || !description || !feedback) return;
    title.textContent = APP.name;
    category.textContent = `${labelCategory(APP.category)} · ${APP.emoji}`;
    description.textContent = APP.description;
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Tidepool%20Tactics';
    stage.replaceChildren();
    renderGame(stage, dialog);
    dialog.showModal();
  }

  function renderGame(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel tidepool-game';
    const hud = document.createElement('div');
    hud.className = 'tidepool-hud';
    hud.innerHTML = '<div class="tidepool-stat"><span>Round</span><strong id="tidepool-round">1 / 4</strong></div><div class="tidepool-stat"><span>Score</span><strong id="tidepool-score">0</strong></div><div class="tidepool-stat"><span>Oxygen</span><strong id="tidepool-oxygen">16</strong></div><div class="tidepool-stat"><span>Tide</span><strong id="tidepool-tide">Low</strong></div><div class="tidepool-stat"><span>Samples</span><strong id="tidepool-samples">0 / 3</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'tidepool-board';
    board.setAttribute('aria-label', 'Tidepool Tactics board. Use arrow keys or tap cells to move. Use R to restore habitat, S to sample, and W to wait.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="tidepool-overlay"><span><strong>Sample species, restore habitat, and exit before the tide traps you.</strong><small>Move with arrows or touch. Sample only when standing on a species. Restore bleaching pools before the next tide pulse.</small></span><span class="tidepool-badge">No storage</span></span>';
    const tools = document.createElement('div');
    tools.className = 'tidepool-tools';
    const log = document.createElement('div');
    log.className = 'result-card tidepool-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const newButton = makeButton('New survey', newSurvey);
    const soundButton = makeButton('Sound off', toggleSound, true);
    actions.append(newButton, soundButton);
    root.append(hud, board, tools, log, actions);
    stage.append(root);

    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { round: 1, score: 0, oxygen: 16, tide: 0, samples: 0, goal: 3, repairs: 3, waits: 2, done: false, expert: false, x: 0, y: 5, exit: { x: 5, y: 0 }, reefs: [], species: [], hazards: [], path: [], raf: 0, audio: false, audioContext: null };
    let width = 900;
    let height = 430;
    dialog.addEventListener('close', teardown, { once: true });

    [['Sample', sample], ['Restore', restore], ['Wait', waitTide], ['New round', nextRound]].forEach(([label, fn]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', fn);
      tools.append(button);
    });

    function makeButton(text, fn, secondary) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = secondary ? 'button button-secondary' : 'button';
      button.textContent = text;
      button.addEventListener('click', fn);
      return button;
    }
    function say(html) { log.innerHTML = html; }
    function same(a, b) { return a.x === b.x && a.y === b.y; }
    function tideName() { return ['Low', 'Rising', 'High'][state.tide]; }
    function cellSize() { return Math.min(width - 32, height - 64) / 6; }
    function gridLeft() { return (width - cellSize() * 6) / 2; }
    function gridTop() { return 18; }
    function randCell(used) {
      let cell;
      do { cell = { x: Math.floor(Math.random() * 6), y: Math.floor(Math.random() * 6) }; }
      while (used.some((item) => same(item, cell)));
      return cell;
    }
    function risky(cell) { return cell.y <= state.tide; }

    function buildRound() {
      const used = [];
      state.x = 0; state.y = 5; state.exit = { x: 5, y: 0 }; state.tide = 0; state.samples = 0; state.done = false; state.repairs = state.expert ? 2 : 3; state.waits = 2; state.oxygen = Math.max(10, 17 - state.round); state.goal = state.expert ? 4 : 3; state.reefs = []; state.species = []; state.hazards = []; state.path = [{ x: state.x, y: state.y }];
      used.push({ x: 0, y: 5 }, state.exit);
      for (let i = 0; i < 5 + state.round; i += 1) { const c = randCell(used); state.reefs.push({ ...c, health: i % 3 ? 2 : 1 }); used.push(c); }
      for (let i = 0; i < state.goal + 2; i += 1) { const c = randCell(used); state.species.push({ ...c, sampled: false, rare: i >= state.goal }); used.push(c); }
      for (let i = 0; i < 2 + state.round; i += 1) { const c = randCell(used); state.hazards.push(c); used.push(c); }
      say(`<strong>Round ${state.round}: low tide survey begins.</strong><small>Collect ${state.goal} samples, restore weak reef patches, and return to the north-east exit before oxygen or tide pressure ends the survey.</small>`);
      update(); draw();
    }

    function newSurvey() { state.round = 1; state.score = 0; state.expert = false; buildRound(); }
    function nextRound() {
      if (state.done && state.round >= 4) return newSurvey();
      if (!state.done && state.samples < state.goal) { say('<strong>Survey incomplete.</strong><small>Collect the required samples before advancing, or exit early by reaching the ladder with a lower score.</small>'); return; }
      if (state.round >= 4) return finish();
      state.round += 1;
      if (state.round === 3 && state.score >= 220) state.expert = true;
      buildRound();
    }
    function finish() {
      state.done = true;
      const grade = state.score >= 360 ? 'Restoration lead' : state.score >= 240 ? 'Reliable surveyor' : 'Recoverable field notes';
      say(`<strong>${grade}: ${state.score} points.</strong><small>Replay for cleaner routes, more restored reef, and faster sample chains. Expert tide appears after strong early rounds.</small>`);
      update(); draw();
    }
    function pulse(kind) {
      if (!state.audio || !state.audioContext) return;
      const now = state.audioContext.currentTime;
      const osc = state.audioContext.createOscillator();
      const gain = state.audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(kind === 'good' ? 760 : kind === 'bad' ? 210 : 420, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain).connect(state.audioContext.destination);
      osc.start(now); osc.stop(now + 0.2);
    }
    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) { say('<strong>Sound is unavailable here.</strong><small>The game still works without audio.</small>'); return; }
      state.audio = !state.audio;
      soundButton.textContent = state.audio ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(state.audio));
      if (state.audio) { state.audioContext ||= new AudioEngine(); state.audioContext.resume(); pulse('good'); }
    }
    function spend(amount) {
      state.oxygen -= amount;
      if (state.oxygen <= 0) {
        state.oxygen = 4;
        state.score = Math.max(0, state.score - 35);
        say('<strong>Emergency air break.</strong><small>You recovered, but the lost time cut into the survey score.</small>');
        pulse('bad');
      }
    }
    function move(dx, dy) {
      if (state.done) return;
      const nx = Math.max(0, Math.min(5, state.x + dx));
      const ny = Math.max(0, Math.min(5, state.y + dy));
      if (nx === state.x && ny === state.y) return;
      state.x = nx; state.y = ny; state.path.push({ x: nx, y: ny });
      if (state.path.length > 12) state.path.shift();
      const cost = risky({ x: nx, y: ny }) ? 2 : 1;
      spend(cost);
      if (state.hazards.some((h) => same(h, { x: nx, y: ny }))) { state.score = Math.max(0, state.score - 15); spend(1); say('<strong>Sharp rocks slowed the survey.</strong><small>Hazard cells cost extra oxygen and score. Route around them when the tide rises.</small>'); }
      else if (same({ x: nx, y: ny }, state.exit)) { finishRound(); }
      else { say(`<strong>Moved to pool ${nx + 1},${ny + 1}.</strong><small>${risky({ x: nx, y: ny }) ? 'The tide is tugging here, so movement costs more oxygen.' : 'Calm water. Look for species or weak reef nearby.'}</small>`); }
      pulse('tick'); update(); draw();
    }
    function sample() {
      if (state.done) return;
      const found = state.species.find((item) => !item.sampled && same(item, { x: state.x, y: state.y }));
      if (!found) { spend(1); say('<strong>No sample at this pool.</strong><small>Sampling empty water costs oxygen. Move onto a shell marker first.</small>'); pulse('bad'); update(); draw(); return; }
      found.sampled = true; state.samples += 1; state.score += found.rare ? 45 : 30; spend(risky(found) ? 2 : 1); say(`<strong>${found.rare ? 'Rare' : 'Clean'} sample logged.</strong><small>${state.samples} of ${state.goal} required samples secured. Rare samples add score but may tempt risky detours.</small>`); pulse('good'); update(); draw();
    }
    function restore() {
      if (state.done) return;
      if (state.repairs <= 0) { say('<strong>No restoration kits left.</strong><small>Save future kits for weak reef patches before high tide reaches them.</small>'); return; }
      const reef = state.reefs.find((item) => same(item, { x: state.x, y: state.y }));
      if (!reef) { spend(1); say('<strong>No reef patch underfoot.</strong><small>Restoration only works on coral cells. Empty use costs time.</small>'); pulse('bad'); update(); draw(); return; }
      reef.health = Math.min(3, reef.health + 1); state.repairs -= 1; state.score += 24; spend(1); say('<strong>Reef patch stabilized.</strong><small>Restored habitat protects score when the tide pulses and makes the route safer to replay.</small>'); pulse('good'); update(); draw();
    }
    function waitTide() {
      if (state.done) return;
      if (state.waits <= 0) { say('<strong>No safe waiting windows left.</strong><small>Move, sample, or restore instead. The tide will keep pressuring shallow cells.</small>'); return; }
      state.waits -= 1; state.tide = Math.min(2, state.tide + 1); spend(1); tidePulse(); say(`<strong>Tide shifted to ${tideName()}.</strong><small>Shallow rows now cost more oxygen. Damaged reef in covered water loses score unless restored.</small>`); update(); draw();
    }
    function tidePulse() {
      let damage = 0;
      state.reefs.forEach((reef) => {
        if (risky(reef) && reef.health < 2) damage += 1;
      });
      if (damage) { state.score = Math.max(0, state.score - damage * 18); pulse('bad'); }
    }
    function finishRound() {
      const restored = state.reefs.filter((r) => r.health > 1).length;
      const complete = state.samples >= state.goal;
      state.score += Math.max(0, state.oxygen * 4) + restored * 4 + (complete ? 50 : 0);
      state.done = true;
      say(`<strong>${complete ? 'Survey complete' : 'Early exit'}: ${state.score} points.</strong><small>${state.samples}/${state.goal} samples, ${restored} stable reef patches, ${state.oxygen} oxygen left. Use New round to continue the campaign.</small>`);
      pulse(complete ? 'good' : 'bad'); update(); draw();
    }
    function update() {
      root.querySelector('#tidepool-round').textContent = `${state.round} / 4`;
      root.querySelector('#tidepool-score').textContent = state.score;
      root.querySelector('#tidepool-oxygen').textContent = state.oxygen;
      root.querySelector('#tidepool-tide').textContent = tideName();
      root.querySelector('#tidepool-samples').textContent = `${state.samples} / ${state.goal}`;
      tools.children[0].disabled = state.done;
      tools.children[1].disabled = state.done || state.repairs <= 0;
      tools.children[2].disabled = state.done || state.waits <= 0;
      tools.children[3].disabled = false;
    }
    function resize() {
      const rect = board.getBoundingClientRect();
      width = Math.max(320, Math.floor(rect.width || 900));
      height = Math.max(width < 620 ? 360 : 430, Math.floor(width * 0.48));
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * scale); canvas.height = Math.floor(height * scale);
      canvas.style.height = `${height}px`; ctx.setTransform(scale, 0, 0, scale, 0, 0); draw();
    }
    function draw() {
      ctx.clearRect(0, 0, width, height);
      const g = ctx.createLinearGradient(0, 0, width, height); g.addColorStop(0, '#083344'); g.addColorStop(1, '#0f172a'); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
      const size = cellSize(); const left = gridLeft(); const top = gridTop(); const t = reduced ? 0 : performance.now() / 800;
      for (let y = 0; y < 6; y += 1) for (let x = 0; x < 6; x += 1) {
        const px = left + x * size; const py = top + y * size; const covered = y <= state.tide;
        ctx.fillStyle = covered ? 'rgba(14,165,233,.48)' : 'rgba(240,253,250,.12)'; ctx.fillRect(px + 3, py + 3, size - 6, size - 6);
        ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.strokeRect(px + 3, py + 3, size - 6, size - 6);
      }
      state.path.forEach((p, i) => { ctx.fillStyle = `rgba(253,224,71,${0.08 + i * 0.045})`; ctx.fillRect(left + p.x * size + size * .25, top + p.y * size + size * .25, size * .5, size * .5); });
      state.hazards.forEach((h) => { ctx.fillStyle = '#7f1d1d'; ctx.beginPath(); ctx.moveTo(left + h.x * size + size * .5, top + h.y * size + size * .18); ctx.lineTo(left + h.x * size + size * .82, top + h.y * size + size * .78); ctx.lineTo(left + h.x * size + size * .18, top + h.y * size + size * .78); ctx.closePath(); ctx.fill(); });
      state.reefs.forEach((r) => { ctx.fillStyle = r.health > 1 ? '#2dd4bf' : '#fb7185'; ctx.beginPath(); ctx.arc(left + r.x * size + size * .5, top + r.y * size + size * .55, size * .18 + r.health * 2, 0, Math.PI * 2); ctx.fill(); });
      state.species.forEach((s) => { if (s.sampled) return; ctx.fillStyle = s.rare ? '#fde68a' : '#e0f2fe'; ctx.font = `${Math.max(18, size * .28)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.rare ? '✦' : '○', left + s.x * size + size * .5, top + s.y * size + size * .48); });
      ctx.fillStyle = '#f8fafc'; ctx.font = `${Math.max(18, size * .28)}px system-ui`; ctx.textAlign = 'center'; ctx.fillText('⇧', left + state.exit.x * size + size * .5, top + state.exit.y * size + size * .5);
      ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(left + state.x * size + size * .5, top + state.y * size + size * .5 + Math.sin(t) * 2, size * .19, 0, Math.PI * 2); ctx.fill();
      if (!reduced && !state.done) state.raf = requestAnimationFrame(draw);
    }
    function pointerCell(event) {
      const rect = canvas.getBoundingClientRect(); const size = cellSize(); const x = Math.floor((event.clientX - rect.left - gridLeft()) / size); const y = Math.floor((event.clientY - rect.top - gridTop()) / size);
      if (x < 0 || y < 0 || x > 5 || y > 5) return null; return { x, y };
    }
    function onPointer(event) { const cell = pointerCell(event); if (!cell) return; const dx = Math.sign(cell.x - state.x); const dy = Math.sign(cell.y - state.y); if (Math.abs(cell.x - state.x) > Math.abs(cell.y - state.y)) move(dx, 0); else move(0, dy); }
    function onKey(event) {
      if (event.key === 'ArrowUp') { event.preventDefault(); move(0, -1); }
      if (event.key === 'ArrowDown') { event.preventDefault(); move(0, 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1, 0); }
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1, 0); }
      if (event.key.toLowerCase() === 's') sample();
      if (event.key.toLowerCase() === 'r') restore();
      if (event.key.toLowerCase() === 'w') waitTide();
    }
    function teardown() { cancelAnimationFrame(state.raf); window.removeEventListener('resize', resize); board.removeEventListener('pointerdown', onPointer); board.removeEventListener('keydown', onKey); }

    board.addEventListener('pointerdown', onPointer);
    board.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);
    soundButton.setAttribute('aria-pressed', 'false');
    buildRound(); resize();
  }

  function boot() { wireFilterRefresh(); initCard(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
