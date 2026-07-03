(() => {
  const APP = {
    name: 'Polar Drift Lab', emoji: '🧊', category: 'play', version: '1.0.0',
    summary: 'Steer an icebound research station through drift lanes, storms, scarce heat, and sample goals.',
    description: 'A local polar expedition strategy game with drifting ice, research sampling, heat and morale tradeoffs, storm recovery, scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and clean teardown.'
  };
  const LANES = [
    { name: 'Blue ice', sample: 'ice core', drift: 1, risk: 1 },
    { name: 'Ridge field', sample: 'microbe bloom', drift: 0, risk: 2 },
    { name: 'Lead water', sample: 'salinity plume', drift: 2, risk: 2 },
    { name: 'Dark floe', sample: 'polar night data', drift: 1, risk: 3 }
  ];
  const STORMS = ['whiteout', 'pressure ridge', 'generator frost', 'thin lead'];

  function installStyles() {
    if (document.querySelector('#polar-drift-lab-styles')) return;
    const style = document.createElement('style');
    style.id = 'polar-drift-lab-styles';
    style.textContent = `.polar-card{animation:polar-rise .32s ease both}.polar-game{max-width:980px;gap:14px}.polar-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.polar-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.polar-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.polar-stat strong{display:block;margin-top:4px;font-size:1rem}.polar-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#0f172a;color:white;cursor:pointer;touch-action:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.polar-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.polar-board canvas{display:block;width:100%;min-height:390px}.polar-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.polar-overlay strong{font-size:clamp(1.05rem,3vw,1.5rem)}.polar-overlay small{display:block;max-width:680px;color:rgba(255,255,255,.76)}.polar-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#bae6fd;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.polar-lanes{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.polar-lanes button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.polar-lanes button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.polar-lanes span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.polar-log{min-height:116px;padding:17px 19px}.polar-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:760px){.polar-hud{grid-template-columns:repeat(2,1fr)}.polar-lanes{grid-template-columns:repeat(2,1fr)}.polar-board canvas{min-height:340px}.polar-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.polar-card{animation:none}}@keyframes polar-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-polar-drift-lab-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.polarDriftLabCard = 'true';
    card.classList.add('polar-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openPolarDriftLab);
    grid.append(node);
  }

  function openPolarDriftLab() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Polar%20Drift%20Lab';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel polar-game';
    const hud = document.createElement('div');
    hud.className = 'polar-hud';
    hud.innerHTML = '<div class="polar-stat"><span>Day</span><strong id="polar-day">1 / 8</strong></div><div class="polar-stat"><span>Heat</span><strong id="polar-heat">8</strong></div><div class="polar-stat"><span>Morale</span><strong id="polar-morale">7</strong></div><div class="polar-stat"><span>Samples</span><strong id="polar-samples">0 / 5</strong></div><div class="polar-stat"><span>Score</span><strong id="polar-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'polar-board';
    board.setAttribute('aria-label', 'Polar Drift Lab board. Choose drift lanes, collect samples, spend heat, and ride out storms.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="polar-overlay"><span><strong>Keep the station alive while the ice carries it past sample sites.</strong><small>Tap a lane, use arrows to change lane, Enter to sample, Space to brace, and R to repair.</small></span><span class="polar-badge">Expedition sim</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const lanes = document.createElement('div');
    lanes.className = 'polar-lanes';
    const log = document.createElement('div');
    log.className = 'result-card polar-log';
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
    actions.append(makeButton('Collect sample', sample), makeButton('Brace storm', brace, true), makeButton('Repair heat', repair, true), makeButton('New drift', reset, true));
    root.append(hud, board, lanes, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { day: 1, lane: 0, x: 0, heat: 8, morale: 7, samples: new Set(), score: 0, braced: false, storm: 0, tick: 0, raf: 0, done: false };

    function say(html) { log.innerHTML = html; }
    function currentLane() { return LANES[state.lane]; }
    function targetLane() { return (state.day * 2 + 1) % LANES.length; }
    function sampleKey() { return `${state.day}-${state.lane}`; }
    function move(delta) { if (!state.done) { state.lane = (state.lane + delta + LANES.length) % LANES.length; state.braced = false; update(); } }
    function sample() {
      if (state.done) return;
      const lane = currentLane();
      const ideal = state.lane === targetLane();
      const key = sampleKey();
      if (state.samples.has(key)) return say('<strong>This station already logged that sample.</strong><small>Ride the drift or choose another lane.</small>');
      state.samples.add(key);
      state.heat -= ideal ? 1 : lane.risk;
      state.morale += ideal ? 1 : -1;
      state.score += ideal ? 45 + state.day * 4 : 18;
      say(`<strong>${ideal ? 'Priority sample secured.' : 'Useful but rough sample logged.'}</strong><small>The ${lane.sample} from ${lane.name} ${ideal ? 'matches today\'s research window.' : 'adds data, but the detour strains the station.'}</small>`);
      advance();
    }
    function brace() {
      if (state.done) return;
      state.braced = true;
      state.heat -= 1;
      state.score += 8;
      say('<strong>The crew braces the station.</strong><small>One heat spent now can prevent a bigger storm penalty at day end.</small>');
      update();
    }
    function repair() {
      if (state.done) return;
      state.heat = Math.min(10, state.heat + 2);
      state.morale -= 1;
      state.score = Math.max(0, state.score - 6);
      say('<strong>Heat loop patched.</strong><small>Warmth rises, but the repair shift costs morale and score.</small>');
      advance();
    }
    function storm() {
      const hit = (state.day + state.lane) % 3 === 0;
      if (!hit) return;
      const name = STORMS[state.storm % STORMS.length];
      state.storm += 1;
      if (state.braced) {
        state.score += 20;
        say(`<strong>${name} absorbed.</strong><small>The brace held. Score bonus earned for reading the ice.</small>`);
      } else {
        state.heat -= 2;
        state.morale -= 1;
        say(`<strong>${name} hits the floe.</strong><small>No brace was set, so heat and morale fall.</small>`);
      }
      state.braced = false;
    }
    function advance() {
      state.x = Math.min(100, state.x + 10 + currentLane().drift * 5);
      storm();
      state.day += 1;
      if (state.heat <= 0 || state.morale <= 0) {
        state.done = true;
        say('<strong>The expedition stands down.</strong><small>Heat or morale collapsed. Recover by starting a new drift and balancing samples with repairs.</small>');
      } else if (state.day > 8 || state.samples.size >= 5) {
        state.done = true;
        const bonus = state.samples.size * 30 + state.heat * 5 + state.morale * 6;
        state.score += bonus;
        say(`<strong>Drift complete.</strong><small>${state.samples.size} samples returned with ${state.heat} heat and ${state.morale} morale. Final score ${state.score}.</small>`);
      }
      update();
    }
    function reset() {
      state.day = 1; state.lane = 0; state.x = 0; state.heat = 8; state.morale = 7; state.samples.clear(); state.score = 0; state.braced = false; state.storm = 0; state.done = false;
      say('<strong>New polar drift opened.</strong><small>Target priority lanes, but repair before the station gets brittle.</small>');
      update();
    }
    function updateHud() {
      hud.querySelector('#polar-day').textContent = `${Math.min(state.day, 8)} / 8`;
      hud.querySelector('#polar-heat').textContent = state.heat;
      hud.querySelector('#polar-morale').textContent = state.morale;
      hud.querySelector('#polar-samples').textContent = `${state.samples.size} / 5`;
      hud.querySelector('#polar-score').textContent = state.score;
    }
    function updateLanes() {
      lanes.replaceChildren();
      LANES.forEach((lane, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.setAttribute('aria-pressed', String(index === state.lane));
        item.innerHTML = `<strong>${lane.name}${index === targetLane() && !state.done ? ' ★' : ''}</strong><span>${lane.sample} · drift ${lane.drift} · risk ${lane.risk}</span>`;
        item.addEventListener('click', () => { state.lane = index; state.braced = false; update(); });
        lanes.append(item);
      });
    }
    function update() { updateHud(); updateLanes(); draw(); }

    board.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); move(1); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
      if (event.key === 'Enter') { event.preventDefault(); sample(); }
      if (event.key === ' ') { event.preventDefault(); brace(); }
      if (event.key.toLowerCase() === 'r') { event.preventDefault(); repair(); }
    });
    board.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      state.lane = Math.max(0, Math.min(3, Math.floor((event.clientY - rect.top) / Math.max(1, rect.height / 4))));
      update();
    });

    function draw() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(340, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      ctx.clearRect(0, 0, width, height);
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, '#082f49'); g.addColorStop(1, '#0f172a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
      const laneHeight = height / 4;
      for (let i = 0; i < 4; i += 1) {
        const y = i * laneHeight;
        ctx.fillStyle = i === state.lane ? 'rgba(186,230,253,.28)' : 'rgba(255,255,255,.07)';
        ctx.fillRect(0, y + 3, width, laneHeight - 6);
        ctx.fillStyle = i === targetLane() && !state.done ? '#fef3c7' : '#dbeafe';
        ctx.font = '700 14px system-ui, sans-serif';
        ctx.fillText(LANES[i].name, 18, y + 28);
        for (let floe = 0; floe < 7; floe += 1) {
          const drift = reduced ? 0 : (state.tick * (i + 1) * 0.2) % 60;
          const x = (floe * 130 + drift + i * 29) % (width + 80) - 40;
          ctx.fillStyle = `rgba(240,249,255,${0.1 + i * 0.03})`;
          ctx.beginPath(); ctx.ellipse(x, y + 58 + (floe % 2) * 18, 38, 12, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
      const stationX = 70 + (width - 160) * (state.x / 100);
      const stationY = state.lane * laneHeight + laneHeight * 0.55;
      ctx.fillStyle = state.braced ? '#fde68a' : '#e0f2fe';
      ctx.beginPath(); ctx.roundRect(stationX - 28, stationY - 20, 56, 40, 10); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(stationX - 12, stationY - 32, 24, 12);
      ctx.fillStyle = '#93c5fd'; ctx.beginPath(); ctx.arc(stationX + 26, stationY - 24, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.font = '800 12px system-ui, sans-serif';
      ctx.fillText(state.done ? 'MISSION LOGGED' : `Priority: ${LANES[targetLane()].sample}`, 18, height - 96);
    }
    function animate() { state.tick += 1; draw(); if (!reduced) state.raf = requestAnimationFrame(animate); }
    const cleanup = () => { if (state.raf) cancelAnimationFrame(state.raf); };
    document.querySelector('#app-dialog')?.addEventListener('close', cleanup, { once: true });
    window.addEventListener('resize', draw, { passive: true });
    reset();
    if (reduced) draw(); else animate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard); else initCard();
})();
