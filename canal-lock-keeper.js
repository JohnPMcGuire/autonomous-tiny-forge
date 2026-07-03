(() => {
  const APP = {
    name: 'Canal Lock Keeper', emoji: '🚢', category: 'play', version: '1.0.0',
    summary: 'Sequence valves, gates, and cargo boats through rising locks before pressure breaks the canal.',
    description: 'A local lock-management puzzle with valve timing, water levels, gate pressure, cargo deadlines, scoring, responsive canvas rendering, touch, pointer and keyboard controls, reduced-motion behavior, and clean teardown.'
  };

  const MAPS = [
    { name: 'Training cut', tide: 1, boats: [{ size: 1, due: 7 }, { size: 2, due: 11 }], target: 2, leaks: [0] },
    { name: 'Factory bend', tide: 2, boats: [{ size: 2, due: 8 }, { size: 1, due: 10 }, { size: 3, due: 15 }], target: 3, leaks: [0, 2] },
    { name: 'Storm ladder', tide: 3, boats: [{ size: 1, due: 6 }, { size: 3, due: 11 }, { size: 2, due: 14 }, { size: 1, due: 17 }], target: 4, leaks: [1, 2] }
  ];

  function installStyles() {
    if (document.querySelector('#canal-lock-keeper-styles')) return;
    const style = document.createElement('style');
    style.id = 'canal-lock-keeper-styles';
    style.textContent = `.canal-card{animation:canal-rise .32s ease both}.canal-game{max-width:960px;gap:14px}.canal-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.canal-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.canal-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.canal-stat strong{display:block;margin-top:4px;font-size:1rem}.canal-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#082032;color:white;cursor:pointer;touch-action:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.canal-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.canal-board canvas{display:block;width:100%;min-height:410px}.canal-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.canal-overlay strong{font-size:clamp(1.05rem,3vw,1.5rem)}.canal-overlay small{display:block;max-width:650px;color:rgba(255,255,255,.76)}.canal-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#bae6fd;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.canal-tools{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.canal-tools button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.canal-tools button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.canal-tools span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.canal-log{min-height:116px;padding:17px 19px}.canal-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:760px){.canal-hud{grid-template-columns:repeat(2,1fr)}.canal-tools{grid-template-columns:1fr 1fr}.canal-board canvas{min-height:350px}.canal-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.canal-card{animation:none}}@keyframes canal-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-canal-lock-keeper-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.canalLockKeeperCard = 'true';
    card.classList.add('canal-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openCanalLockKeeper);
    grid.append(node);
  }

  function openCanalLockKeeper() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Canal%20Lock%20Keeper';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel canal-game';
    const hud = document.createElement('div');
    hud.className = 'canal-hud';
    hud.innerHTML = '<div class="canal-stat"><span>Cut</span><strong id="canal-map">1 / 3</strong></div><div class="canal-stat"><span>Cycle</span><strong id="canal-cycle">0</strong></div><div class="canal-stat"><span>Water</span><strong id="canal-water">1-1-1</strong></div><div class="canal-stat"><span>Pressure</span><strong id="canal-pressure">0</strong></div><div class="canal-stat"><span>Score</span><strong id="canal-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'canal-board';
    board.setAttribute('aria-label', 'Canal Lock Keeper board. Select a chamber, adjust water, open gates, launch boats, or patch leaks.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="canal-overlay"><span><strong>Balance water before cargo boats miss their window.</strong><small>Tap a chamber to select it. Arrows move selection. I fills, D drains, G opens a gate, L launches, P patches, R restarts.</small></span><span class="canal-badge">Lock puzzle</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const tools = document.createElement('div');
    tools.className = 'canal-tools';
    const log = document.createElement('div');
    log.className = 'result-card canal-log';
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
    actions.append(makeButton('Fill chamber', () => adjust(1), false), makeButton('Drain chamber', () => adjust(-1), true), makeButton('Open gate', openGate, true), makeButton('Launch boat', launchBoat, true), makeButton('Patch leak', patchLeak, true), makeButton('Next cut', nextMap, true), makeButton('Restart', reset, true));
    root.append(hud, board, tools, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { map: 0, selected: 0, cycle: 0, water: [1, 1, 1], gates: [false, false], boats: [], launched: 0, patches: 2, pressure: 0, score: 0, done: false, cleared: false, raf: 0, tick: 0, leaks: [] };

    function current() { return MAPS[state.map]; }
    function say(html) { log.innerHTML = html; }
    function clamp(value) { return Math.max(0, Math.min(4, value)); }
    function roundRect(x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + width, y, x + width, y + height, r); ctx.arcTo(x + width, y + height, x, y + height, r); ctx.arcTo(x, y + height, x, y, r); ctx.arcTo(x, y, x + width, y, r); ctx.closePath();
    }
    function loadMap(index) {
      const map = MAPS[index];
      state.map = index;
      state.selected = 0;
      state.cycle = 0;
      state.water = [map.tide, map.tide, map.tide];
      state.gates = [false, false];
      state.boats = map.boats.map((boat, i) => ({ id: i + 1, size: boat.size, due: boat.due, pos: 0, done: false, late: false }));
      state.launched = 0;
      state.patches = 2;
      state.pressure = 0;
      state.leaks = map.leaks.slice();
      state.done = false;
      state.cleared = false;
      say(`<strong>${map.name} opened.</strong><small>Move each cargo boat through three chambers. Adjacent water levels must match before a gate can open safely.</small>`);
      update();
    }
    function advanceCycle() {
      state.cycle += 1;
      for (const leak of state.leaks) state.water[leak] = clamp(state.water[leak] - 1);
      state.boats.forEach((boat) => { if (!boat.done && boat.due < state.cycle) boat.late = true; });
      state.pressure = state.gates.reduce((sum, open, i) => sum + (open ? Math.abs(state.water[i] - state.water[i + 1]) : 0), 0);
      if (state.pressure >= 4) {
        state.done = true;
        say('<strong>The lock wall groans open.</strong><small>Too much pressure built across open gates. Restart and equalize chambers before opening gates.</small>');
      }
    }
    function adjust(delta) {
      if (state.done || state.cleared) return;
      state.water[state.selected] = clamp(state.water[state.selected] + delta);
      state.score = Math.max(0, state.score - 1);
      advanceCycle();
      if (!state.done) say(`<strong>Chamber ${state.selected + 1} ${delta > 0 ? 'filled' : 'drained'}.</strong><small>Leaks tick after each action. Watch deadlines and gate pressure.</small>`);
      update();
    }
    function openGate() {
      if (state.done || state.cleared) return;
      const gate = state.selected < 2 ? state.selected : 1;
      if (Math.abs(state.water[gate] - state.water[gate + 1]) > 0) {
        state.pressure += 2;
        advanceCycle();
        say('<strong>Gate strains against uneven water.</strong><small>Equalize adjacent chambers before opening. Pressure can end the run quickly.</small>');
      } else {
        state.gates[gate] = !state.gates[gate];
        state.score += state.gates[gate] ? 6 : 2;
        advanceCycle();
        say(`<strong>Gate ${gate + 1} ${state.gates[gate] ? 'opened' : 'closed'}.</strong><small>Open gates let launched boats slide forward when the next chamber is ready.</small>`);
      }
      update();
    }
    function launchBoat() {
      if (state.done || state.cleared) return;
      const boat = state.boats.find((item) => !item.done && item.pos < 3);
      if (!boat) return finishMap();
      if (boat.pos === 0 && state.launched < boat.id - 1) return;
      const nextGate = boat.pos;
      if (boat.pos === 0 || state.gates[nextGate - 1]) {
        boat.pos += 1;
        state.launched = Math.max(state.launched, boat.id);
        if (boat.pos >= 3) {
          boat.done = true;
          state.score += 55 + Math.max(0, boat.due - state.cycle) * 4 + boat.size * 6;
          say(`<strong>Boat ${boat.id} clears the cut.</strong><small>${boat.late ? 'It was late, but cargo is safe.' : 'On-time cargo earns a clean bonus.'}</small>`);
        } else {
          state.score += 12;
          say(`<strong>Boat ${boat.id} enters chamber ${boat.pos}.</strong><small>Set up the next gate before the deadline closes.</small>`);
        }
        advanceCycle();
      } else {
        advanceCycle();
        say('<strong>The boat waits at a closed gate.</strong><small>Open the correct equalized gate before spending another launch cycle.</small>');
      }
      update();
      finishMap();
    }
    function patchLeak() {
      if (state.done || state.cleared) return;
      if (state.patches <= 0) return say('<strong>No patch crews remain.</strong><small>Use fill and drain actions to recover from the remaining leaks.</small>');
      const leakIndex = state.leaks.indexOf(state.selected);
      if (leakIndex < 0) {
        advanceCycle();
        say('<strong>Patch crew sent to dry stone.</strong><small>Select a leaking chamber before spending a crew.</small>');
      } else {
        state.leaks.splice(leakIndex, 1);
        state.patches -= 1;
        state.score += 10;
        advanceCycle();
        say(`<strong>Leak in chamber ${state.selected + 1} sealed.</strong><small>${state.patches} patch crew${state.patches === 1 ? '' : 's'} remain.</small>`);
      }
      update();
    }
    function finishMap() {
      if (!state.boats.every((boat) => boat.done) || state.cleared) return;
      state.cleared = true;
      const late = state.boats.filter((boat) => boat.late).length;
      state.score += 80 + current().target * 8 - late * 18 - state.pressure * 6;
      say(`<strong>${current().name} cleared.</strong><small>${late} late boat${late === 1 ? '' : 's'}. Continue to the next cut or restart for a cleaner canal.</small>`);
    }
    function nextMap() {
      if (!state.cleared) return say('<strong>The cut is not clear yet.</strong><small>Move every cargo boat through chamber three before advancing.</small>');
      if (state.map >= MAPS.length - 1) return say(`<strong>All locks delivered.</strong><small>Final score ${state.score}. Restart to chase tighter water timing.</small>`);
      loadMap(state.map + 1);
    }
    function reset() { state.score = 0; loadMap(0); }
    function select(index) { if (!state.done) { state.selected = (index + 3) % 3; update(); } }
    function updateHud() {
      hud.querySelector('#canal-map').textContent = `${state.map + 1} / ${MAPS.length}`;
      hud.querySelector('#canal-cycle').textContent = state.cycle;
      hud.querySelector('#canal-water').textContent = state.water.join('-');
      hud.querySelector('#canal-pressure').textContent = state.pressure;
      hud.querySelector('#canal-score').textContent = state.score;
    }
    function updateTools() {
      tools.replaceChildren();
      state.water.forEach((level, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-pressed', String(index === state.selected));
        button.innerHTML = `<span>Chamber ${index + 1}</span><strong>Water ${level}</strong><small>${state.leaks.includes(index) ? 'Leaking' : 'Stable'}</small>`;
        button.addEventListener('click', () => select(index));
        tools.append(button);
      });
      state.gates.forEach((open, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-pressed', String(open));
        button.innerHTML = `<span>Gate ${index + 1}</span><strong>${open ? 'Open' : 'Closed'}</strong><small>Delta ${Math.abs(state.water[index] - state.water[index + 1])}</small>`;
        button.addEventListener('click', () => { state.selected = index; openGate(); });
        tools.append(button);
      });
    }
    function update() { updateHud(); updateTools(); draw(); }
    function draw() {
      const rect = board.getBoundingClientRect();
      const ratio = Math.max(1, window.devicePixelRatio || 1);
      const width = Math.max(320, Math.floor(rect.width || 760));
      const height = Math.max(330, Math.floor(width * .48));
      if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
        canvas.width = Math.floor(width * ratio); canvas.height = Math.floor(height * ratio);
        canvas.style.height = `${height}px`;
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const time = reduced ? 0 : state.tick / 40;
      const chamberW = (width - 80) / 3;
      ctx.fillStyle = '#082032'; ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < 3; i += 1) {
        const x = 32 + i * chamberW;
        const waterH = 46 + state.water[i] * 34;
        ctx.fillStyle = i === state.selected ? 'rgba(186,230,253,.18)' : 'rgba(255,255,255,.08)';
        ctx.fillRect(x, 48, chamberW - 10, height - 112);
        ctx.fillStyle = state.leaks.includes(i) ? 'rgba(249,115,22,.55)' : 'rgba(14,165,233,.72)';
        ctx.fillRect(x + 8, height - 64 - waterH, chamberW - 26, waterH);
        ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 3;
        ctx.strokeRect(x, 48, chamberW - 10, height - 112);
        ctx.fillStyle = 'rgba(255,255,255,.86)'; ctx.font = '700 14px system-ui';
        ctx.fillText(`Chamber ${i + 1}`, x + 14, 76);
        if (state.leaks.includes(i)) {
          ctx.fillStyle = 'rgba(251,146,60,.95)';
          ctx.beginPath(); ctx.arc(x + chamberW - 34, height - 70 + Math.sin(time + i) * 5, 7, 0, Math.PI * 2); ctx.fill();
        }
      }
      state.gates.forEach((open, i) => {
        const gx = 32 + (i + 1) * chamberW - 16;
        ctx.fillStyle = open ? 'rgba(34,197,94,.82)' : 'rgba(248,113,113,.9)';
        ctx.fillRect(gx, 60, 18, height - 136);
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '800 12px system-ui';
        ctx.fillText(open ? 'OPEN' : 'LOCK', gx - 12, 50);
      });
      state.boats.forEach((boat, i) => {
        if (boat.done) return;
        const pos = Math.max(0, Math.min(2, boat.pos - 1));
        const bx = boat.pos === 0 ? 12 : 54 + pos * chamberW + boat.size * 7;
        const by = 120 + i * 36 + Math.sin(time + i) * 2;
        ctx.fillStyle = boat.late ? '#f97316' : '#facc15';
        roundRect(bx, by, 54 + boat.size * 8, 20, 8); ctx.fill();
        ctx.fillStyle = '#111827'; ctx.font = '800 12px system-ui'; ctx.fillText(`#${boat.id}`, bx + 16, by + 15);
      });
      ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.font = '700 13px system-ui';
      ctx.fillText(`Patch crews ${state.patches}`, 32, height - 26);
      ctx.fillText('Cargo deadline pressure rises every action', Math.max(32, width - 286), height - 26);
    }
    function pointer(event) {
      const rect = board.getBoundingClientRect();
      const x = event.clientX - rect.left;
      select(Math.floor((x / Math.max(1, rect.width)) * 3));
    }
    function key(event) {
      const keys = ['ArrowLeft', 'ArrowRight', 'i', 'I', 'd', 'D', 'g', 'G', 'l', 'L', 'p', 'P', 'r', 'R'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowLeft') select(state.selected - 1);
      if (event.key === 'ArrowRight') select(state.selected + 1);
      if (event.key === 'i' || event.key === 'I') adjust(1);
      if (event.key === 'd' || event.key === 'D') adjust(-1);
      if (event.key === 'g' || event.key === 'G') openGate();
      if (event.key === 'l' || event.key === 'L') launchBoat();
      if (event.key === 'p' || event.key === 'P') patchLeak();
      if (event.key === 'r' || event.key === 'R') reset();
    }
    function animate() { state.tick += 1; draw(); state.raf = requestAnimationFrame(animate); }
    board.addEventListener('pointerdown', pointer);
    board.addEventListener('keydown', key);
    window.addEventListener('resize', draw);
    const observer = new MutationObserver(() => { if (!document.body.contains(root)) cleanup(); });
    observer.observe(document.body, { childList: true, subtree: true });
    function cleanup() { cancelAnimationFrame(state.raf); window.removeEventListener('resize', draw); observer.disconnect(); }
    loadMap(0);
    if (!reduced) state.raf = requestAnimationFrame(animate);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard, { once: true });
  else initCard();
})();