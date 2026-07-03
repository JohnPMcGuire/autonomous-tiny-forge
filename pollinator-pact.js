(() => {
  const APP = {
    name: 'Pollinator Pact',
    emoji: '🐝',
    category: 'play',
    version: '1.0.0',
    summary: 'Guide pollinators through bloom windows, weather shifts, nectar limits, and habitat recovery.',
    description: 'A local ecology strategy game with bloom timing, pollinator energy, weather hazards, biodiversity goals, scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and clean teardown.'
  };
  const MAPS = [
    { name: 'Morning meadow', bees: 4, days: 5, target: 7, drought: [[3,1],[4,3]], flowers: [[1,1,2],[3,2,3],[5,1,2],[2,4,1],[6,4,3]] },
    { name: 'Heat island', bees: 5, days: 6, target: 9, drought: [[2,2],[3,2],[4,2]], flowers: [[1,1,1],[5,1,2],[1,4,3],[5,4,1],[3,5,2],[6,3,3]] },
    { name: 'Storm edge', bees: 5, days: 6, target: 10, drought: [[1,3],[5,2]], flowers: [[0,1,2],[2,1,3],[4,1,1],[6,1,2],[1,5,3],[4,4,2],[6,5,1]] }
  ];
  const FLOWER = ['clover', 'sage', 'aster'];

  function installStyles() {
    if (document.querySelector('#pollinator-pact-styles')) return;
    const style = document.createElement('style');
    style.id = 'pollinator-pact-styles';
    style.textContent = `.pollinator-card{animation:pollinator-rise .32s ease both}.pollinator-game{max-width:940px;gap:14px}.pollinator-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.pollinator-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.pollinator-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.pollinator-stat strong{display:block;margin-top:4px;font-size:1rem}.pollinator-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#10170d;color:white;cursor:pointer;touch-action:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.pollinator-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.pollinator-board canvas{display:block;width:100%;min-height:370px}.pollinator-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.pollinator-overlay strong{font-size:clamp(1.05rem,3vw,1.5rem)}.pollinator-overlay small{display:block;max-width:650px;color:rgba(255,255,255,.76)}.pollinator-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#fde68a;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.pollinator-tools{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.pollinator-tools button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.pollinator-tools button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.pollinator-tools span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.pollinator-log{min-height:108px;padding:17px 19px}.pollinator-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:760px){.pollinator-hud{grid-template-columns:repeat(2,1fr)}.pollinator-tools{grid-template-columns:repeat(2,1fr)}.pollinator-board canvas{min-height:330px}.pollinator-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.pollinator-card{animation:none}}@keyframes pollinator-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-pollinator-pact-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.pollinatorPactCard = 'true';
    card.classList.add('pollinator-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openPollinatorPact);
    grid.append(node);
  }

  function openPollinatorPact() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Pollinator%20Pact';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel pollinator-game';
    const hud = document.createElement('div');
    hud.className = 'pollinator-hud';
    hud.innerHTML = '<div class="pollinator-stat"><span>Garden</span><strong id="pollinator-map">1 / 3</strong></div><div class="pollinator-stat"><span>Day</span><strong id="pollinator-day">1</strong></div><div class="pollinator-stat"><span>Energy</span><strong id="pollinator-energy">4</strong></div><div class="pollinator-stat"><span>Pollinated</span><strong id="pollinator-blooms">0</strong></div><div class="pollinator-stat"><span>Score</span><strong id="pollinator-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'pollinator-board';
    board.setAttribute('aria-label', 'Pollinator Pact board. Move bees among bloom windows, restore drought cells, and keep biodiversity alive.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="pollinator-overlay"><span><strong>Send bees before flowers close.</strong><small>Tap cells, use arrows to move the cursor, Enter to visit, Space to restore habitat, and Backspace to wait.</small></span><span class="pollinator-badge">Ecosystem puzzle</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const tools = document.createElement('div');
    tools.className = 'pollinator-tools';
    const log = document.createElement('div');
    log.className = 'result-card pollinator-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const button = (text, fn, secondary) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = secondary ? 'button button-secondary' : 'button';
      item.textContent = text;
      item.addEventListener('click', fn);
      return item;
    };
    actions.append(button('Visit bloom', visit), button('Restore cell', restore, true), button('Wait day', waitDay, true), button('Next garden', nextMap), button('Restart', reset, true));
    root.append(hud, board, tools, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { map: 0, cursor: [0, 0], hive: [3, 3], energy: 0, day: 1, score: 0, pollinated: new Set(), restored: new Set(), tick: 0, raf: 0, done: false };
    const key = (x, y) => `${x},${y}`;
    const current = () => MAPS[state.map];
    const has = (list, x, y) => list.some(([a, b]) => a === x && b === y);
    const flowerAt = (x, y) => current().flowers.find(([a, b]) => a === x && b === y);
    const drought = (x, y) => has(current().drought, x, y) && !state.restored.has(key(x, y));
    const inBounds = (x, y) => x >= 0 && y >= 0 && x < 7 && y < 6;
    const distance = (x, y) => Math.abs(x - state.hive[0]) + Math.abs(y - state.hive[1]);
    const openNow = (flower) => flower && ((state.day + flower[2]) % 3 !== 0);
    const pollinatedCount = () => state.pollinated.size;
    const speciesCount = () => new Set([...state.pollinated].map((id) => id.split(':')[0])).size;

    function visit() {
      if (state.done) return;
      const [x, y] = state.cursor;
      const flower = flowerAt(x, y);
      if (!flower) return say('<strong>No bloom there.</strong><small>Move onto a flower cell before sending pollinators.</small>');
      const cost = Math.max(1, Math.ceil(distance(x, y) / 2)) + (drought(x, y) ? 1 : 0);
      if (state.energy < cost) return say('<strong>The hive is too tired.</strong><small>Wait a day or restore habitat to reduce travel cost.</small>');
      if (!openNow(flower)) {
        state.energy -= 1;
        state.score = Math.max(0, state.score - 6);
        waitDay(false);
        return say('<strong>The bloom closed before arrival.</strong><small>You lost one energy and the day advanced. Watch the petal rings for open windows.</small>');
      }
      const id = `${FLOWER[flower[2] - 1]}:${x},${y}`;
      if (state.pollinated.has(id)) return say('<strong>Already pollinated.</strong><small>New species and untouched flowers are worth more than revisits.</small>');
      state.energy -= cost;
      state.pollinated.add(id);
      const diversity = speciesCount() * 5;
      state.score += 18 + diversity + Math.max(0, 4 - cost) * 3;
      say(`<strong>${FLOWER[flower[2] - 1]} pollinated.</strong><small>Cost ${cost} energy. Diversity now covers ${speciesCount()} species.</small>`);
      checkEnd();
      update();
    }

    function restore() {
      if (state.done) return;
      const [x, y] = state.cursor;
      const id = key(x, y);
      if (!has(current().drought, x, y) || state.restored.has(id)) return say('<strong>No restoration needed there.</strong><small>Restore cracked habitat cells to lower nearby travel costs and earn recovery points.</small>');
      if (state.energy < 2) return say('<strong>Restoration needs two energy.</strong><small>Wait a day to recover before repairing habitat.</small>');
      state.energy -= 2;
      state.restored.add(id);
      state.score += 12;
      say('<strong>Habitat restored.</strong><small>Nearby blooms are easier to reach, and recovery counts toward the final resilience bonus.</small>');
      update();
    }

    function waitDay(message = true) {
      if (state.done) return;
      state.day += 1;
      state.energy = Math.min(current().bees + 2, state.energy + 2);
      const missed = current().flowers.filter((flower) => !openNow(flower) && !state.pollinated.has(`${FLOWER[flower[2] - 1]}:${flower[0]},${flower[1]}`)).length;
      state.score = Math.max(0, state.score - missed);
      if (message) say(`<strong>Day ${state.day} begins.</strong><small>${missed} unpollinated blooms are closed today. Closed flowers can reopen, but the season is short.</small>`);
      checkEnd();
      update();
    }

    function checkEnd() {
      const won = pollinatedCount() >= current().target && speciesCount() >= 3;
      const expired = state.day > current().days;
      if (!won && !expired) return;
      state.done = true;
      if (won) {
        const bonus = state.energy * 8 + state.restored.size * 10 + speciesCount() * 15;
        state.score += bonus;
        say(`<strong>${current().name} pact held. Score ${state.score}.</strong><small>${pollinatedCount()} blooms, ${speciesCount()} species, and ${state.restored.size} restored cells created a resilient garden.</small>`);
      } else {
        say(`<strong>The season ended with ${pollinatedCount()} pollinated blooms.</strong><small>Try restoring drought cells earlier or waiting for better bloom windows.</small>`);
      }
    }

    function nextMap() {
      state.map = (state.map + 1) % MAPS.length;
      reset(false);
    }

    function reset(keepMap = true) {
      if (!keepMap) state.score = 0;
      state.cursor = [...state.hive];
      state.energy = current().bees;
      state.day = 1;
      state.pollinated.clear();
      state.restored.clear();
      state.done = false;
      say(`<strong>${current().name}</strong><small>Pollinate ${current().target} blooms across all three species before day ${current().days}. Drought cells cost extra until restored.</small>`);
      update();
    }

    function say(html) { log.innerHTML = html; }
    function updateHud() {
      hud.querySelector('#pollinator-map').textContent = `${state.map + 1} / ${MAPS.length}`;
      hud.querySelector('#pollinator-day').textContent = `${state.day} / ${current().days}`;
      hud.querySelector('#pollinator-energy').textContent = state.energy;
      hud.querySelector('#pollinator-blooms').textContent = `${pollinatedCount()} / ${current().target}`;
      hud.querySelector('#pollinator-score').textContent = state.score;
    }
    function updateTools() {
      tools.replaceChildren();
      [['Hive','Energy returns here each day.'],['Bloom','Open windows rotate with the day.'],['Drought','Adds travel cost until restored.'],['Diversity','All three species are required.']].forEach(([name, help]) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.innerHTML = `<strong>${name}</strong><span>${help}</span>`;
        item.addEventListener('click', () => say(`<strong>${name}</strong><small>${help}</small>`));
        tools.append(item);
      });
    }
    function update() { updateHud(); updateTools(); draw(); }

    function move(dx, dy) {
      state.cursor = [Math.max(0, Math.min(6, state.cursor[0] + dx)), Math.max(0, Math.min(5, state.cursor[1] + dy))];
      draw();
    }
    board.addEventListener('keydown', (event) => {
      const keys = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] };
      if (keys[event.key]) { event.preventDefault(); move(...keys[event.key]); }
      if (event.key === 'Enter') { event.preventDefault(); visit(); }
      if (event.key === ' ') { event.preventDefault(); restore(); }
      if (event.key === 'Backspace') { event.preventDefault(); waitDay(); }
    });
    board.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const size = Math.min(rect.width / 7, rect.height / 6);
      const ox = (rect.width - size * 7) / 2;
      const oy = (rect.height - size * 6) / 2;
      const x = Math.floor((event.clientX - rect.left - ox) / size);
      const y = Math.floor((event.clientY - rect.top - oy) / size);
      if (inBounds(x, y)) { state.cursor = [x, y]; flowerAt(x, y) ? visit() : drought(x, y) ? restore() : draw(); }
    });

    function draw() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(330, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      const size = Math.min(w / 7, h / 6);
      const ox = (w - size * 7) / 2;
      const oy = (h - size * 6) / 2;
      ctx.fillStyle = '#10170d';
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < 6; y++) for (let x = 0; x < 7; x++) {
        const px = ox + x * size, py = oy + y * size;
        ctx.fillStyle = drought(x, y) ? '#4b2f1b' : '#17351f';
        ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
        ctx.strokeStyle = 'rgba(255,255,255,.08)';
        ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
      }
      current().flowers.forEach(([x, y, species]) => {
        const px = ox + (x + .5) * size, py = oy + (y + .5) * size;
        const id = `${FLOWER[species - 1]}:${x},${y}`;
        ctx.beginPath();
        ctx.fillStyle = state.pollinated.has(id) ? '#bbf7d0' : openNow([x, y, species]) ? ['#f9a8d4','#c4b5fd','#fde68a'][species - 1] : '#64748b';
        ctx.arc(px, py, size * .23, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = openNow([x, y, species]) ? '#ffffff' : 'rgba(255,255,255,.25)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      const [hx, hy] = state.hive;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(ox + hx * size + size * .25, oy + hy * size + size * .25, size * .5, size * .5);
      current().drought.forEach(([x, y]) => {
        if (state.restored.has(key(x, y))) {
          ctx.fillStyle = '#86efac';
          ctx.fillRect(ox + x * size + size * .38, oy + y * size + size * .38, size * .24, size * .24);
        }
      });
      const [cx, cy] = state.cursor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(ox + cx * size + 5, oy + cy * size + 5, size - 10, size - 10);
      if (!reduced) {
        state.tick += .04;
        ctx.fillStyle = 'rgba(253,230,138,.75)';
        for (let i = 0; i < Math.min(8, state.energy + 2); i++) {
          const angle = state.tick + i * .8;
          ctx.beginPath();
          ctx.arc(ox + (hx + .5) * size + Math.cos(angle) * size * .32, oy + (hy + .5) * size + Math.sin(angle) * size * .32, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    function loop() { draw(); state.raf = reduced ? 0 : requestAnimationFrame(loop); }
    const close = () => { if (state.raf) cancelAnimationFrame(state.raf); window.removeEventListener('resize', draw); };
    document.querySelector('#app-dialog')?.addEventListener('close', close, { once: true });
    window.addEventListener('resize', draw, { passive: true });
    reset();
    if (!reduced) loop();
  }

  window.addEventListener('DOMContentLoaded', () => setTimeout(initCard, 250));
})();
