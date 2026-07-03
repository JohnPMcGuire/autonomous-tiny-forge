(() => {
  const APP = {
    name: 'Cabin Pressure',
    emoji: '🛰️',
    category: 'play',
    version: '1.0.0',
    summary: 'Balance oxygen, heat, repairs, and morale through a tense orbital rescue.',
    description: 'A local survival-management game with linked ship systems, crew roles, crisis cards, scarce actions, risk tradeoffs, scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and clean teardown.'
  };
  const CREW = [
    { name: 'Pilot', skill: 'navigation', boost: 'stability' },
    { name: 'Medic', skill: 'morale', boost: 'morale' },
    { name: 'Engineer', skill: 'repair', boost: 'hull' },
    { name: 'Botanist', skill: 'life support', boost: 'oxygen' }
  ];
  const CRISES = [
    { name: 'CO2 scrubber frost', oxygen: -10, heat: -5, note: 'Oxygen falls faster unless life support is stabilized.' },
    { name: 'Radiator leak', heat: -13, hull: -4, note: 'Heat loss makes repair actions less efficient.' },
    { name: 'Docking beacon drift', stability: -14, morale: -4, note: 'Navigation errors shorten the rescue window.' },
    { name: 'Crew fatigue spiral', morale: -12, oxygen: -3, note: 'Low morale increases the cost of every hard choice.' },
    { name: 'Micrometeor ping', hull: -12, stability: -5, note: 'Hull damage can cascade into oxygen loss.' },
    { name: 'Battery brownout', heat: -7, stability: -8, note: 'Systems flicker before the next crisis card lands.' }
  ];

  function installStyles() {
    if (document.querySelector('#cabin-pressure-styles')) return;
    const style = document.createElement('style');
    style.id = 'cabin-pressure-styles';
    style.textContent = `.cabin-card{animation:cabin-rise .34s ease both}.cabin-game{max-width:940px;gap:14px}.cabin-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.cabin-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.cabin-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.cabin-stat strong{display:block;margin-top:4px;font-size:1rem}.cabin-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#07111f;color:white;cursor:pointer;touch-action:manipulation;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.cabin-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.cabin-board canvas{display:block;width:100%;min-height:340px}.cabin-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.cabin-overlay strong{font-size:clamp(1.05rem,3vw,1.5rem)}.cabin-overlay small{display:block;max-width:610px;color:rgba(255,255,255,.76)}.cabin-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#bfdbfe;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.cabin-crew{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.cabin-crew button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.cabin-crew button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.cabin-crew span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.cabin-log{min-height:104px;padding:17px 19px}.cabin-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:760px){.cabin-hud{grid-template-columns:repeat(2,1fr)}.cabin-crew{grid-template-columns:repeat(2,1fr)}.cabin-board canvas{min-height:320px}.cabin-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.cabin-card{animation:none}}@keyframes cabin-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-cabin-pressure-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.cabinPressureCard = 'true';
    card.classList.add('cabin-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openCabinPressure);
    grid.append(node);
  }

  function openCabinPressure() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Cabin%20Pressure';
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
  function clamp(value) { return Math.max(0, Math.min(100, value)); }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel cabin-game';
    const hud = document.createElement('div');
    hud.className = 'cabin-hud';
    hud.innerHTML = '<div class="cabin-stat"><span>Orbit</span><strong id="cabin-orbit">1 / 8</strong></div><div class="cabin-stat"><span>Oxygen</span><strong id="cabin-oxygen">72</strong></div><div class="cabin-stat"><span>Heat</span><strong id="cabin-heat">66</strong></div><div class="cabin-stat"><span>Hull</span><strong id="cabin-hull">70</strong></div><div class="cabin-stat"><span>Score</span><strong id="cabin-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'cabin-board';
    board.setAttribute('aria-label', 'Cabin Pressure board. Pick crew members and choose actions to keep linked ship systems alive until rescue arrives.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="cabin-overlay"><span><strong>Eight orbits until rescue. Every fix stresses another system.</strong><small>Choose a crew lead, stabilize one system, triage a crisis, or overdrive the ship at a cost.</small></span><span class="cabin-badge">Tap crew or keys</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const crew = document.createElement('div');
    crew.className = 'cabin-crew';
    const log = document.createElement('div');
    log.className = 'result-card cabin-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    actions.append(button('Stabilize', stabilize), button('Patch hull', patchHull, true), button('Share supplies', shareSupplies), button('Overdrive', overdrive, true), button('New rescue', reset, true));
    root.append(hud, board, crew, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { orbit: 1, oxygen: 72, heat: 66, hull: 70, morale: 64, stability: 68, score: 0, lead: 0, crisis: 0, tick: 0, raf: 0, done: false };

    function reset() {
      Object.assign(state, { orbit: 1, oxygen: 72, heat: 66, hull: 70, morale: 64, stability: 68, score: 0, lead: 0, crisis: 0, tick: 0, done: false });
      say('<strong>Rescue clock started.</strong><small>Pick a crew lead, then survive eight crisis cards without any system collapsing.</small>');
      update();
    }
    function currentCrisis() { return CRISES[state.crisis % CRISES.length]; }
    function selectLead(index) {
      if (state.done) return;
      state.lead = index;
      say(`<strong>${CREW[index].name} has the console.</strong><small>${CREW[index].skill} choices get a stronger recovery this orbit.</small>`);
      update();
    }
    function leadBonus(system) { return CREW[state.lead].boost === system ? 6 : 0; }
    function applyCrisis() {
      const crisis = currentCrisis();
      state.oxygen = clamp(state.oxygen + (crisis.oxygen || 0));
      state.heat = clamp(state.heat + (crisis.heat || 0));
      state.hull = clamp(state.hull + (crisis.hull || 0));
      state.morale = clamp(state.morale + (crisis.morale || 0));
      state.stability = clamp(state.stability + (crisis.stability || 0));
      if (state.hull < 35) state.oxygen = clamp(state.oxygen - 5);
      if (state.heat < 35) state.morale = clamp(state.morale - 5);
      if (state.morale < 35) state.stability = clamp(state.stability - 4);
      return crisis;
    }
    function nextOrbit(action) {
      if (state.done) return;
      const crisis = applyCrisis();
      state.score += Math.round((state.oxygen + state.heat + state.hull + state.morale + state.stability) / 14);
      const failed = [state.oxygen, state.heat, state.hull, state.morale, state.stability].some((value) => value <= 0);
      if (failed) {
        state.done = true;
        say(`<strong>Mission lost after ${action}.</strong><small>${crisis.name} cascaded through the cabin. Final score ${state.score}.</small>`);
      } else if (state.orbit >= 8) {
        state.done = true;
        const bonus = Math.round((state.oxygen + state.heat + state.hull + state.morale + state.stability) / 2);
        state.score += bonus;
        say(`<strong>Rescue docked. Score ${state.score}.</strong><small>Systems held with ${state.oxygen} oxygen, ${state.heat} heat, ${state.hull} hull, ${state.morale} morale, and ${state.stability} stability.</small>`);
      } else {
        state.orbit += 1;
        state.crisis += 1;
        say(`<strong>${crisis.name}</strong><small>${crisis.note} Action: ${action}. Choose the next crew lead before orbit ${state.orbit}.</small>`);
      }
      update();
    }
    function stabilize() {
      state.oxygen = clamp(state.oxygen + 10 + leadBonus('oxygen'));
      state.heat = clamp(state.heat + 8 + leadBonus('stability'));
      state.stability = clamp(state.stability + 6 + leadBonus('stability'));
      state.morale = clamp(state.morale - 3);
      nextOrbit('stabilize');
    }
    function patchHull() {
      state.hull = clamp(state.hull + 16 + leadBonus('hull'));
      state.heat = clamp(state.heat - 4);
      state.oxygen = clamp(state.oxygen - 3);
      nextOrbit('patch hull');
    }
    function shareSupplies() {
      state.morale = clamp(state.morale + 16 + leadBonus('morale'));
      state.oxygen = clamp(state.oxygen + 4 + leadBonus('oxygen'));
      state.stability = clamp(state.stability - 4);
      nextOrbit('share supplies');
    }
    function overdrive() {
      state.stability = clamp(state.stability + 18 + leadBonus('stability'));
      state.heat = clamp(state.heat - 8);
      state.hull = clamp(state.hull - 5);
      state.score += 8;
      nextOrbit('overdrive');
    }
    function say(html) { log.innerHTML = html; }
    function updateCrew() {
      crew.replaceChildren();
      CREW.forEach((member, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.setAttribute('aria-pressed', String(index === state.lead));
        item.innerHTML = `<span>${member.skill}</span><strong>${member.name}</strong><small>Boosts ${member.boost}</small>`;
        item.addEventListener('click', () => selectLead(index));
        crew.append(item);
      });
    }
    function update() {
      hud.querySelector('#cabin-orbit').textContent = `${Math.min(state.orbit, 8)} / 8`;
      hud.querySelector('#cabin-oxygen').textContent = state.oxygen;
      hud.querySelector('#cabin-heat').textContent = state.heat;
      hud.querySelector('#cabin-hull').textContent = state.hull;
      hud.querySelector('#cabin-score').textContent = state.score;
      updateCrew();
      draw();
    }
    function draw() {
      const rect = board.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(320, Math.floor(rect.width * .54));
      canvas.width = Math.floor(w * ratio); canvas.height = Math.floor(h * ratio); canvas.style.height = `${h}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h); grad.addColorStop(0, '#020617'); grad.addColorStop(1, '#1e1b4b'); ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(191,219,254,.16)'; ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 34) { ctx.beginPath(); ctx.moveTo(x + (state.tick % 34), 0); ctx.lineTo(x - 80 + (state.tick % 34), h); ctx.stroke(); }
      const systems = [ ['O2', state.oxygen, .2, .34], ['Heat', state.heat, .4, .62], ['Hull', state.hull, .58, .34], ['Crew', state.morale, .74, .6], ['Nav', state.stability, .5, .18] ];
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.beginPath();
      systems.forEach(([, , x, y], i) => { if (i) ctx.lineTo(x * w, y * h); else ctx.moveTo(x * w, y * h); }); ctx.closePath(); ctx.stroke();
      systems.forEach(([label, value, x, y]) => {
        const px = x * w; const py = y * h; const radius = 18 + value / 8;
        ctx.beginPath(); ctx.fillStyle = value < 35 ? '#fca5a5' : value < 60 ? '#fde68a' : '#93c5fd'; ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0f172a'; ctx.font = '800 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(label, px, py + 4);
      });
      ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.font = '800 13px system-ui'; ctx.fillText(`Next: ${currentCrisis().name}`, 18, 28);
    }
    function loop() { state.tick += reduced ? 0 : 1; draw(); state.raf = requestAnimationFrame(loop); }
    board.addEventListener('click', () => selectLead((state.lead + 1) % CREW.length));
    board.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); selectLead((state.lead + 1) % CREW.length); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); selectLead((state.lead + CREW.length - 1) % CREW.length); }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); stabilize(); }
      if (event.key.toLowerCase() === 'h') patchHull();
      if (event.key.toLowerCase() === 's') shareSupplies();
      if (event.key.toLowerCase() === 'o') overdrive();
    });
    document.querySelector('#app-dialog')?.addEventListener('close', () => cancelAnimationFrame(state.raf), { once: true });
    reset();
    loop();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard);
  else initCard();
  window.addEventListener('forge:apps-rendered', initCard);
  setTimeout(initCard, 800);
})();
