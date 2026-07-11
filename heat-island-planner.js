(() => {
  const APP = {
    name: 'Heat Island Planner',
    emoji: '🌇',
    category: 'experiment',
    version: '1.0.0',
    summary: 'Cool a city block by balancing shade, water, energy, access, maintenance, and equity through a six-day heatwave.',
    description: 'A local spatial planning simulation with neighborhood heat, vulnerable residents, limited budgets, infrastructure tradeoffs, escalating heatwave days, recovery actions, scoring, a session-only reflective roof unlock, touch, pointer and keyboard controls, reduced-motion behavior, optional local audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (value) => value === 'play' ? 'Play' : value === 'useful' ? 'Useful' : 'Experiment';

  function css() {
    if ($('#heat-island-planner-styles')) return;
    const style = document.createElement('style');
    style.id = 'heat-island-planner-styles';
    style.textContent = `
      .hip-card{animation:hip-in .24s ease both}
      .hip-game{max-width:1120px;gap:14px}
      .hip-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
      .hip-stat,.hip-panel,.hip-log,.hip-board-wrap{border:1px solid var(--line);border-radius:18px;background:#fff}
      .hip-stat{padding:9px 11px}
      .hip-stat span{display:block;color:var(--muted);font-size:.6rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .hip-stat strong{display:block;margin-top:3px}
      .hip-layout{display:grid;grid-template-columns:1.15fr .85fr;gap:12px}
      .hip-board-wrap{padding:10px;background:linear-gradient(145deg,#2f3d46,#18242b)}
      .hip-board{display:grid;grid-template-columns:repeat(8,1fr);gap:4px;aspect-ratio:1;touch-action:manipulation}
      .hip-cell{position:relative;border:0;border-radius:9px;min-width:0;background:hsl(var(--heat) 72% 48%);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);font-weight:900;cursor:pointer;overflow:hidden}
      .hip-cell::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.16),transparent 45%)}
      .hip-cell span{position:relative;z-index:1;font-size:clamp(.75rem,2vw,1.1rem);text-shadow:0 1px 2px #000}
      .hip-cell[data-vulnerable='true']{box-shadow:inset 0 0 0 3px #fff7a8}
      .hip-cell:focus-visible,.hip-panel button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}
      .hip-panel{padding:14px;display:grid;gap:12px;align-content:start}
      .hip-tools,.hip-modes,.hip-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
      .hip-panel button{min-height:44px;border:1px solid var(--line);border-radius:14px;background:#fff;font-weight:900}
      .hip-panel button.is-active{box-shadow:0 0 0 3px #0f766e inset;background:#ecfeff}
      .hip-panel button[disabled]{opacity:.45;cursor:not-allowed}
      .hip-cost{display:block;font-size:.68rem;color:var(--muted);font-weight:700;margin-top:2px}
      .hip-legend{display:flex;flex-wrap:wrap;gap:8px;font-size:.72rem;color:var(--muted)}
      .hip-legend span{display:inline-flex;align-items:center;gap:4px}
      .hip-dot{width:12px;height:12px;border-radius:4px;background:#ef4444}.hip-dot.cool{background:#14b8a6}.hip-dot.vuln{background:#fff7a8;border:1px solid #8a6d00}
      .hip-log{padding:14px;min-height:92px}.hip-log small{display:block;margin-top:5px}
      .hip-help{font-size:.8rem;color:var(--muted);margin:0}
      @media(max-width:900px){.hip-layout{grid-template-columns:1fr}.hip-hud{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:560px){.hip-hud{grid-template-columns:repeat(2,1fr)}.hip-tools,.hip-actions{grid-template-columns:1fr 1fr}.hip-board{gap:3px}.hip-cell{border-radius:7px}}
      @media(prefers-reduced-motion:reduce){.hip-card{animation:none!important}.hip-cell{transition:none!important}}
      @keyframes hip-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
    `;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid');
    const template = $('#app-card-template');
    if (!grid || !template || $('[data-heat-island-planner-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    css();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.heatIslandPlannerCard = 'true';
    card.classList.add('hip-card');
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
    css();
    let tries = 0;
    const retry = () => {
      addCard();
      if (!$('[data-heat-island-planner-card]') && tries++ < 20) setTimeout(retry, 120);
    };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.hipRefresh) return;
      button.dataset.hipRefresh = '1';
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
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Heat%20Island%20Planner';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel hip-game';
    root.innerHTML = `
      <div class="hip-hud">
        <div class="hip-stat"><span>Heatwave day</span><strong id="hip-day">1 / 6</strong></div>
        <div class="hip-stat"><span>Budget</span><strong id="hip-budget">24</strong></div>
        <div class="hip-stat"><span>Energy</span><strong id="hip-energy">8</strong></div>
        <div class="hip-stat"><span>Average heat</span><strong id="hip-average">0</strong></div>
        <div class="hip-stat"><span>Equity</span><strong id="hip-equity">0%</strong></div>
        <div class="hip-stat"><span>Score</span><strong id="hip-score">0</strong></div>
      </div>
      <div class="hip-layout">
        <div class="hip-board-wrap">
          <div class="hip-board" role="grid" aria-label="Eight by eight city heat map. Select a planning tool, then choose a block. Arrow keys move focus; Enter applies the active tool."></div>
          <div class="hip-legend"><span><i class="hip-dot"></i> hotter</span><span><i class="hip-dot cool"></i> cooler</span><span><i class="hip-dot vuln"></i> vulnerable block</span></div>
        </div>
        <div class="hip-panel">
          <div class="hip-modes" aria-label="Difficulty modes"></div>
          <div class="hip-tools" aria-label="Planning tools"></div>
          <p class="hip-help">Trees cool nearby blocks but need maintenance. Cooling centers provide strong access but consume energy. Water stations are cheap and focused. Parks cool broadly but cost space and budget. Use emergency aid after a bad day. Press S for sound and R to restart.</p>
          <div class="hip-actions">
            <button type="button" data-act="advance">End day</button>
            <button type="button" data-act="aid">Emergency aid</button>
            <button type="button" data-act="restart">Restart plan</button>
            <button type="button" data-act="sound" aria-pressed="false">Sound off</button>
          </div>
          <div class="hip-log result-card" aria-live="polite"><strong>Heat advisory issued.</strong><small>Prioritize vulnerable blocks, then build a network that survives all six days.</small></div>
        </div>
      </div>`;
    stage.append(root);

    const board = $('.hip-board', root);
    const log = $('.hip-log', root);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const modes = {
      planner: { name: 'Planner', budget: 28, energy: 10, rise: 3.2, vulnerable: 8 },
      challenge: { name: 'Challenge', budget: 24, energy: 8, rise: 4.2, vulnerable: 10 },
      crisis: { name: 'Crisis', budget: 21, energy: 7, rise: 5.2, vulnerable: 12, locked: true }
    };
    const tools = {
      tree: { name: 'Street trees', icon: '🌳', cost: 3, energy: 0, radius: 1, cool: 8, maintenance: 1 },
      water: { name: 'Water station', icon: '💧', cost: 2, energy: 1, radius: 0, cool: 12, access: 1 },
      center: { name: 'Cooling center', icon: '🏥', cost: 5, energy: 3, radius: 1, cool: 10, access: 2 },
      park: { name: 'Pocket park', icon: '🌿', cost: 6, energy: 0, radius: 2, cool: 5, maintenance: 2 },
      roof: { name: 'Reflective roof', icon: '⬜', cost: 4, energy: 0, radius: 0, cool: 16, locked: true }
    };
    const state = {
      mode: 'challenge', tool: 'tree', day: 1, budget: 24, energy: 8, score: 0, unlocked: false,
      cells: [], selected: 0, sound: false, ac: null, ended: false, aidUsed: false
    };

    function tone(frequency = 440, duration = .1) {
      if (!state.sound) return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) return;
      state.ac ||= new AudioEngine();
      state.ac.resume();
      const oscillator = state.ac.createOscillator();
      const gain = state.ac.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, state.ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(.04, state.ac.currentTime + .01);
      gain.gain.exponentialRampToValueAtTime(.0001, state.ac.currentTime + duration);
      oscillator.connect(gain).connect(state.ac.destination);
      oscillator.start();
      oscillator.stop(state.ac.currentTime + duration + .02);
    }
    function note(title, detail) { log.innerHTML = `<strong>${title}</strong><small>${detail}</small>`; }
    function rand(a, b) { return a + Math.random() * (b - a); }
    function neighbors(index, radius) {
      const x = index % 8, y = Math.floor(index / 8), found = [];
      for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) {
        if (Math.abs(xx - x) + Math.abs(yy - y) <= radius) found.push(yy * 8 + xx);
      }
      return found;
    }
    function averageHeat() { return state.cells.reduce((sum, cell) => sum + cell.heat, 0) / state.cells.length; }
    function vulnerableCoverage() {
      const vulnerable = state.cells.filter((cell) => cell.vulnerable);
      if (!vulnerable.length) return 100;
      return Math.round(vulnerable.filter((cell) => cell.access > 0 || cell.heat < 56).length / vulnerable.length * 100);
    }
    function setup() {
      const mode = modes[state.mode];
      state.day = 1; state.budget = mode.budget; state.energy = mode.energy; state.score = 0; state.ended = false; state.aidUsed = false;
      state.cells = Array.from({ length: 64 }, (_, index) => ({
        heat: rand(48, 66) + (index % 8 > 4 ? 3 : 0), vulnerable: false, access: 0, item: null, maintained: true
      }));
      const picks = [...Array(64).keys()].sort(() => Math.random() - .5).slice(0, mode.vulnerable);
      picks.forEach((index) => { state.cells[index].vulnerable = true; state.cells[index].heat += 4; });
      renderTools(); renderBoard(); updateHud();
      note('Heat advisory issued.', 'Build a connected cooling network before ending the first day. Vulnerable blocks have a pale border.');
    }
    function renderModes() {
      const box = $('.hip-modes', root); box.replaceChildren();
      Object.entries(modes).forEach(([key, mode]) => {
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = mode.name;
        button.disabled = !!mode.locked && !state.unlocked;
        button.classList.toggle('is-active', key === state.mode);
        button.addEventListener('click', () => { if (button.disabled) return; state.mode = key; setup(); renderModes(); });
        box.append(button);
      });
    }
    function renderTools() {
      const box = $('.hip-tools', root); box.replaceChildren();
      Object.entries(tools).forEach(([key, tool]) => {
        const button = document.createElement('button'); button.type = 'button';
        button.innerHTML = `${tool.icon} ${tool.name}<span class="hip-cost">${tool.cost} budget${tool.energy ? ` · ${tool.energy} energy` : ''}</span>`;
        button.disabled = (!!tool.locked && !state.unlocked) || state.budget < tool.cost || state.energy < tool.energy;
        button.classList.toggle('is-active', state.tool === key);
        button.addEventListener('click', () => { if (!button.disabled) { state.tool = key; renderTools(); } });
        box.append(button);
      });
    }
    function renderBoard() {
      board.replaceChildren();
      state.cells.forEach((cell, index) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'hip-cell'; button.setAttribute('role', 'gridcell');
        button.dataset.index = index; button.dataset.vulnerable = String(cell.vulnerable);
        button.style.setProperty('--heat', String(Math.max(0, Math.min(120, 130 - cell.heat * 1.45))));
        button.innerHTML = `<span>${cell.item ? tools[cell.item].icon : cell.vulnerable ? '◆' : ''}</span>`;
        button.setAttribute('aria-label', `Block ${index + 1}. Heat ${Math.round(cell.heat)}. ${cell.vulnerable ? 'Vulnerable residents. ' : ''}${cell.item ? tools[cell.item].name : 'No intervention'}.`);
        button.tabIndex = index === state.selected ? 0 : -1;
        button.addEventListener('click', () => place(index));
        button.addEventListener('focus', () => { state.selected = index; });
        board.append(button);
      });
    }
    function place(index) {
      if (state.ended) return;
      const tool = tools[state.tool];
      if (!tool || ((tool.locked && !state.unlocked) || state.budget < tool.cost || state.energy < tool.energy)) { tone(160, .12); return; }
      const cell = state.cells[index];
      if (cell.item) { note('Block already assigned.', 'Choose another block or continue to the next heatwave day.'); tone(170, .1); return; }
      state.budget -= tool.cost; state.energy -= tool.energy; cell.item = state.tool;
      neighbors(index, tool.radius).forEach((target) => {
        const distance = Math.abs(target % 8 - index % 8) + Math.abs(Math.floor(target / 8) - Math.floor(index / 8));
        state.cells[target].heat = Math.max(28, state.cells[target].heat - Math.max(2, tool.cool - distance * 2));
        if (tool.access && distance <= tool.access) state.cells[target].access += 1;
      });
      const coverage = vulnerableCoverage();
      state.score += 35 + Math.round(coverage / 5);
      if (state.score >= 700 && !state.unlocked) {
        state.unlocked = true;
        note('Reflective roofs and Crisis mode unlocked!', 'The new intervention is strong on one block and requires no energy.');
        tone(820, .2);
      } else {
        note(`${tool.name} placed.`, `Average heat is now ${Math.round(averageHeat())}. Vulnerable coverage is ${coverage}%.`);
        tone(560, .08);
      }
      renderBoard(); renderTools(); renderModes(); updateHud();
    }
    function endDay() {
      if (state.ended) { setup(); return; }
      const mode = modes[state.mode];
      const maintenance = state.cells.reduce((sum, cell) => sum + (cell.item ? tools[cell.item].maintenance || 0 : 0), 0);
      const poweredCenters = state.cells.filter((cell) => cell.item === 'center').length;
      const rise = mode.rise + state.day * .65;
      state.cells.forEach((cell) => {
        cell.heat += rise + rand(-1.5, 2.2);
        if (cell.item === 'tree' || cell.item === 'park') cell.heat += maintenance > state.day * 2 ? 1.2 : 0;
        if (cell.item === 'center' && state.energy <= 0) cell.heat += 4;
      });
      state.energy = Math.max(0, state.energy - Math.max(0, poweredCenters - 1));
      state.budget += Math.max(2, 6 - Math.floor(maintenance / 3));
      const avg = averageHeat(), equity = vulnerableCoverage(), hottest = Math.max(...state.cells.map((cell) => cell.heat));
      const dayScore = Math.max(0, Math.round(260 - avg * 2 + equity * 1.5 - Math.max(0, hottest - 78) * 5));
      state.score += dayScore;
      if (state.day >= 6) {
        state.ended = true;
        const success = avg < 72 && equity >= 70 && hottest < 88;
        note(success ? 'Heatwave survived.' : 'Plan needs another pass.', success ? `Final score ${state.score}. The cooling network protected ${equity}% of vulnerable blocks.` : `Final average heat ${Math.round(avg)}, equity ${equity}%. Replay with a different intervention mix.`);
        tone(success ? 760 : 180, .22);
      } else {
        state.day += 1;
        note(`Day ${state.day} begins.`, `Heat rose ${rise.toFixed(1)}°. You recovered budget, but maintenance and energy pressure are increasing.`);
        tone(avg < 70 ? 620 : 240, .12);
      }
      renderBoard(); renderTools(); updateHud();
    }
    function emergencyAid() {
      if (state.aidUsed || state.ended) { note('Emergency aid unavailable.', 'It can be used once per plan before the final day.'); return; }
      state.aidUsed = true; state.score = Math.max(0, state.score - 120); state.energy += 3;
      state.cells.filter((cell) => cell.vulnerable).forEach((cell) => { cell.heat = Math.max(30, cell.heat - 8); cell.access += 1; });
      note('Emergency aid deployed.', 'Vulnerable blocks cooled and energy increased, but 120 score was spent.');
      tone(500, .14); renderBoard(); renderTools(); updateHud();
    }
    function updateHud() {
      $('#hip-day', root).textContent = `${state.day} / 6`;
      $('#hip-budget', root).textContent = state.budget;
      $('#hip-energy', root).textContent = state.energy;
      $('#hip-average', root).textContent = Math.round(averageHeat());
      $('#hip-equity', root).textContent = `${vulnerableCoverage()}%`;
      $('#hip-score', root).textContent = state.score;
      const aid = $('[data-act="aid"]', root); aid.disabled = state.aidUsed || state.ended;
      $('[data-act="advance"]', root).textContent = state.ended ? 'Replay plan' : 'End day';
    }

    root.addEventListener('click', (event) => {
      const action = event.target.closest('[data-act]')?.dataset.act;
      if (action === 'advance') endDay();
      if (action === 'aid') emergencyAid();
      if (action === 'restart') setup();
      if (action === 'sound') {
        state.sound = !state.sound;
        event.target.textContent = state.sound ? 'Sound on' : 'Sound off';
        event.target.setAttribute('aria-pressed', String(state.sound));
        if (state.sound) tone(660, .08);
      }
    });
    board.addEventListener('keydown', (event) => {
      const row = Math.floor(state.selected / 8), col = state.selected % 8;
      let next = state.selected;
      if (event.key === 'ArrowLeft') next = row * 8 + Math.max(0, col - 1);
      if (event.key === 'ArrowRight') next = row * 8 + Math.min(7, col + 1);
      if (event.key === 'ArrowUp') next = Math.max(0, row - 1) * 8 + col;
      if (event.key === 'ArrowDown') next = Math.min(7, row + 1) * 8 + col;
      if (next !== state.selected) { event.preventDefault(); state.selected = next; renderBoard(); board.children[next]?.focus(); }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); place(state.selected); }
    });
    const keyHandler = (event) => {
      if (!document.body.contains(root)) return;
      if (event.key.toLowerCase() === 'r') setup();
      if (event.key.toLowerCase() === 's') $('[data-act="sound"]', root)?.click();
    };
    window.addEventListener('keydown', keyHandler);
    dialog.addEventListener('close', () => {
      window.removeEventListener('keydown', keyHandler);
      if (state.ac) state.ac.close();
    }, { once: true });
    if (!reduced) root.animate([{ opacity: .7 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
    renderModes(); setup();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
