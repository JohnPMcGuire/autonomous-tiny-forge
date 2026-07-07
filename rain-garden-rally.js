(() => {
  const APP = {
    name: 'Rain Garden Rally', emoji: '☔', category: 'play', version: '1.0.0',
    summary: 'Shape a neighborhood rain garden network before each storm wave floods the block.',
    description: 'A local stormwater strategy game with flowing runoff, budget pressure, homes to protect, pollution capture, heat relief, pumps, permeable paver unlocks, recoverable overflow, scoring, responsive SVG/DOM rendering, touch and keyboard controls, reduced-motion behavior, optional local audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const tools = {
    basin: { name: 'Rain basin', icon: 'B', cost: 3, hold: 5, clean: 2, cool: 1 },
    tree: { name: 'Street tree', icon: 'T', cost: 4, hold: 3, clean: 1, cool: 4 },
    swale: { name: 'Flow swale', icon: 'S', cost: 2, hold: 2, clean: 3, cool: 0 },
    paver: { name: 'Paver plaza', icon: 'P', cost: 5, hold: 4, clean: 2, cool: 2 }
  };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensureStyles() {
    if ($('#rain-garden-rally-styles')) return;
    const style = document.createElement('style');
    style.id = 'rain-garden-rally-styles';
    style.textContent = `
      .rain-card{animation:rain-pop .24s ease both}.rain-game{max-width:1120px;gap:14px}.rain-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.rain-stat,.rain-map,.rain-panel,.rain-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.rain-stat{padding:10px 12px}.rain-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.rain-stat strong{display:block;margin-top:4px}.rain-layout{display:grid;grid-template-columns:1.1fr .9fr;gap:12px}.rain-map{padding:12px;background:linear-gradient(135deg,#dbeafe,#f8fafc)}.rain-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:7px}.rain-cell{min-height:72px;border:1px solid #bfdbfe;border-radius:15px;background:linear-gradient(160deg,#eff6ff,#dbeafe);display:grid;place-items:center;text-align:center;font-weight:900;cursor:pointer;position:relative;touch-action:manipulation}.rain-cell:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.rain-cell.is-selected{box-shadow:0 0 0 3px #2563eb inset}.rain-cell.is-home{background:linear-gradient(160deg,#fff7ed,#dbeafe)}.rain-cell.is-drain{background:linear-gradient(160deg,#e0f2fe,#bae6fd)}.rain-cell.is-flood{background:linear-gradient(160deg,#fecaca,#bfdbfe)}.rain-cell small{display:block;font-weight:800;color:#1e3a8a}.rain-symbol{font-size:1.45rem}.rain-drop{position:absolute;inset:auto 7px 7px auto;border-radius:999px;background:#1d4ed8;color:white;font-size:.68rem;padding:2px 6px}.rain-panel{padding:14px;display:grid;gap:12px}.rain-brief{padding:13px;background:#f8fafc}.rain-brief h3{margin:.2rem 0;font-size:1.2rem}.rain-tools,.rain-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.rain-tools button{border:1px solid var(--line);border-radius:14px;background:#fff;padding:9px 7px;font-weight:900}.rain-tools button[aria-pressed=true]{background:#082f49;color:#fff}.rain-actions button{min-height:44px}.rain-tags{display:flex;flex-wrap:wrap;gap:6px}.rain-tags span{border:1px solid var(--line);border-radius:999px;padding:4px 8px;background:#fff;font-size:.74rem;font-weight:800}.rain-flow svg{width:100%;height:72px;display:block}.rain-log{min-height:96px;padding:17px 19px}@media(max-width:860px){.rain-hud{grid-template-columns:repeat(2,1fr)}.rain-layout{grid-template-columns:1fr}.rain-cell{min-height:64px}.rain-actions,.rain-tools{grid-template-columns:1fr 1fr}}@media(max-width:520px){.rain-map{padding:8px}.rain-grid{gap:5px}.rain-cell{min-height:54px;border-radius:11px}.rain-stat{padding:9px}.rain-stat strong{font-size:.95rem}}@media(prefers-reduced-motion:reduce){.rain-card{animation:none;transition:none}.rain-flow circle{display:none}}@keyframes rain-pop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
    `;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-rain-garden-rally-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.rainGardenRallyCard = 'true';
    card.classList.add('rain-card');
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
    ensureStyles();
    let tries = 0;
    const retry = () => { addCard(); if (!$('[data-rain-garden-rally-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.rainGardenRallyRefresh) return;
      button.dataset.rainGardenRallyRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Rain%20Garden%20Rally';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel rain-game';
    root.innerHTML = `<div class="rain-hud"><div class="rain-stat"><span>Storm</span><strong id="rr-wave">1 / 5</strong></div><div class="rain-stat"><span>Budget</span><strong id="rr-budget">12</strong></div><div class="rain-stat"><span>Homes</span><strong id="rr-homes">3</strong></div><div class="rain-stat"><span>Pollution</span><strong id="rr-pollution">0</strong></div><div class="rain-stat"><span>Score</span><strong id="rr-score">0</strong></div><div class="rain-stat"><span>Best</span><strong id="rr-best">0</strong></div></div><div class="rain-layout"><div class="rain-map"><div class="rain-grid" role="grid" aria-label="Neighborhood stormwater grid"></div></div><div class="rain-panel"><div class="rain-brief"></div><div class="rain-tools" role="group" aria-label="Choose stormwater tool"></div><div class="rain-tags"></div><div class="rain-flow" aria-hidden="true"></div><div class="rain-actions"><button class="button" type="button" data-act="build">Build selected tool</button><button class="button button-secondary" type="button" data-act="clear">Clear flood</button><button class="button button-secondary" type="button" data-act="pump">Emergency pump</button><button class="button button-secondary" type="button" data-act="storm">Run storm</button><button class="button button-secondary" type="button" data-act="reset">New block</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card rain-log" aria-live="polite"></div>`;
    stage.append(root);

    const grid = $('.rain-grid', root), toolsBox = $('.rain-tools', root), brief = $('.rain-brief', root), tags = $('.rain-tags', root), flow = $('.rain-flow', root), log = $('.rain-log', root);
    const st = { wave: 1, total: 5, budget: 12, score: 0, best: 0, selected: 14, tool: 'basin', paver: false, pumps: 2, sound: false, ac: null, cells: [] };
    const low = reducedMotion();
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });

    function seed() {
      st.wave = 1; st.budget = 12; st.score = 0; st.pumps = 2; st.selected = 14;
      st.cells = Array.from({ length: 36 }, (_, index) => ({ type: 'street', water: 0, tool: null, flood: false, heat: index % 5 === 0 ? 2 : 1 }));
      [2, 11, 24].forEach((i) => { st.cells[i].type = 'home'; });
      [5, 17, 35].forEach((i) => { st.cells[i].type = 'drain'; });
      [6, 12, 18, 30].forEach((i) => { st.cells[i].water = 2; });
      note('Stormwater board ready. Build basins, trees, and swales before the first storm.');
      renderTools(); render();
    }

    function renderTools() {
      toolsBox.replaceChildren();
      Object.entries(tools).forEach(([id, tool]) => {
        if (id === 'paver' && !st.paver) return;
        const button = document.createElement('button');
        button.type = 'button'; button.dataset.tool = id;
        button.textContent = `${tool.icon} ${tool.name} $${tool.cost}`;
        button.setAttribute('aria-pressed', String(id === st.tool));
        toolsBox.append(button);
      });
    }
    function tone(kind) {
      if (!st.sound) return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume();
      const osc = st.ac.createOscillator(); const gain = st.ac.createGain();
      osc.type = kind === 'bad' ? 'sawtooth' : 'sine';
      osc.frequency.value = kind === 'win' ? 720 : kind === 'bad' ? 150 : 390;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(.055, st.ac.currentTime + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .18);
      osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .2);
    }
    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: arrows select a block, B builds, C clears flood, P pumps, R runs storm.</small>`; }
    function neighbors(index) { const r = Math.floor(index / 6), c = index % 6; return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([rr, cc]) => rr >= 0 && rr < 6 && cc >= 0 && cc < 6).map(([rr, cc]) => rr * 6 + cc); }
    function homeHealth() { return st.cells.filter((cell) => cell.type === 'home' && !cell.flood).length; }
    function pollution() { return st.cells.reduce((sum, cell) => sum + Math.max(0, cell.water - (cell.tool ? tools[cell.tool].clean : 0)), 0); }
    function capacity(cell) { return cell.tool ? tools[cell.tool].hold : cell.type === 'drain' ? 6 : cell.type === 'home' ? 1 : 2; }
    function hud() {
      $('#rr-wave', root).textContent = `${Math.min(st.wave, st.total)} / ${st.total}${st.paver ? '+' : ''}`;
      $('#rr-budget', root).textContent = st.budget; $('#rr-homes', root).textContent = `${homeHealth()} / 3`;
      $('#rr-pollution', root).textContent = pollution(); $('#rr-score', root).textContent = st.score; $('#rr-best', root).textContent = Math.max(st.best, st.score);
    }
    function describe() {
      const cell = st.cells[st.selected];
      const built = cell.tool ? tools[cell.tool].name : cell.type === 'drain' ? 'City drain' : cell.type === 'home' ? 'Home parcel' : 'Open curb';
      brief.innerHTML = `<h3>${st.paver ? 'Cloudburst district' : 'Neighborhood retrofit'}</h3><p>${built}: water ${cell.water}/${capacity(cell)}${cell.flood ? ', flooded' : ''}. Tool choice: ${tools[st.tool].name}. Protect homes, drain runoff, and catch pollution before storm five.</p>`;
      const tagText = [`Pumps ${st.pumps}`, `${st.cells.filter((c) => c.tool).length} upgrades`, low ? 'Reduced motion' : 'Flow animation', st.paver ? 'Pavers unlocked' : 'Unlock at 120 points`'];
      tags.replaceChildren(...tagText.map((text) => { const item = document.createElement('span'); item.textContent = text.replace('`', ''); return item; }));
      flow.innerHTML = low ? '<svg viewBox="0 0 300 72"><path d="M18 44 C78 10 126 62 178 28 S252 44 286 24" fill="none" stroke="#2563eb" stroke-width="6" stroke-linecap="round" opacity=".45"/></svg>' : '<svg viewBox="0 0 300 72"><path d="M18 44 C78 10 126 62 178 28 S252 44 286 24" fill="none" stroke="#2563eb" stroke-width="6" stroke-linecap="round" opacity=".45"/><circle r="6" fill="#0ea5e9"><animateMotion dur="2.6s" repeatCount="indefinite" path="M18 44 C78 10 126 62 178 28 S252 44 286 24"/></circle></svg>';
    }
    function render() {
      grid.replaceChildren();
      st.cells.forEach((cell, index) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = `rain-cell${index === st.selected ? ' is-selected' : ''}${cell.type === 'home' ? ' is-home' : ''}${cell.type === 'drain' ? ' is-drain' : ''}${cell.flood ? ' is-flood' : ''}`; button.dataset.index = index; button.setAttribute('role', 'gridcell');
        const title = cell.tool ? tools[cell.tool].name : cell.type === 'home' ? 'Home' : cell.type === 'drain' ? 'Drain' : 'Street';
        button.setAttribute('aria-label', `${title}, water ${cell.water}, capacity ${capacity(cell)}${cell.flood ? ', flooded' : ''}`);
        button.innerHTML = `<span class="rain-symbol">${cell.flood ? '🌊' : cell.tool ? tools[cell.tool].icon : cell.type === 'home' ? '⌂' : cell.type === 'drain' ? '◎' : '·'}</span><small>${title}</small>${cell.water ? `<span class="rain-drop">${cell.water}</span>` : ''}`;
        grid.append(button);
      });
      describe(); hud();
    }
    function build() {
      const cell = st.cells[st.selected], tool = tools[st.tool];
      if (cell.type === 'drain' || cell.type === 'home') return note('Protect homes and drains by building around them, not on top of them.');
      if (cell.tool) return note('That block already has green infrastructure. Select another curb segment.');
      if (st.budget < tool.cost) return note('Not enough budget. Run a storm to earn resilience credits or use a pump carefully.');
      st.budget -= tool.cost; cell.tool = st.tool; st.score += tool.clean + tool.cool; tone('ok'); render(); note(`${tool.name} installed. Its capacity and cleanup change how nearby water behaves.`);
    }
    function clearFlood() {
      const cell = st.cells[st.selected];
      if (!cell.flood) return note('Select a flooded block to clear standing water.');
      if (st.budget < 2) return note('Clearing costs two budget. Try the emergency pump if one remains.');
      st.budget -= 2; cell.flood = false; cell.water = Math.max(0, cell.water - 3); tone('ok'); render(); note('Crew cleared a flood, but the budget took a hit.');
    }
    function pump() {
      const cell = st.cells[st.selected];
      if (st.pumps <= 0) return note('No pumps remain. Recovery now depends on the green network.');
      st.pumps -= 1; cell.water = Math.max(0, cell.water - 5); cell.flood = false; tone('ok'); render(); note('Emergency pump deployed. Useful recovery, but scarce.');
    }
    function runStorm() {
      if (st.wave > st.total) return finish();
      const intensity = st.wave + 2 + (st.paver ? 1 : 0);
      [0, 1, 6, 12, 18, 24, 30].forEach((i) => { st.cells[i].water += Math.ceil(intensity / 2); });
      st.cells.forEach((cell, index) => {
        if (cell.tool === 'tree') cell.water = Math.max(0, cell.water - 1);
        if (cell.tool === 'swale') neighbors(index).forEach((n) => { if (st.cells[n].water > cell.water) { st.cells[n].water -= 1; cell.water += 1; } });
      });
      st.cells.forEach((cell, index) => {
        const cap = capacity(cell);
        if (cell.water > cap) {
          const overflow = cell.water - cap; cell.water = cap; cell.flood = true;
          const downstream = neighbors(index).filter((n) => n > index).slice(0, 2);
          downstream.forEach((n) => { st.cells[n].water += Math.ceil(overflow / Math.max(1, downstream.length)); });
        } else if (cell.tool === 'basin' || cell.type === 'drain') {
          cell.water = Math.max(0, cell.water - 2);
        }
      });
      const floodedHomes = st.cells.filter((cell) => cell.type === 'home' && cell.flood).length;
      const cleanBonus = st.cells.reduce((sum, cell) => sum + (cell.tool ? tools[cell.tool].clean + tools[cell.tool].cool : 0), 0);
      st.score += Math.max(0, cleanBonus + homeHealth() * 18 - floodedHomes * 22 - pollution());
      st.budget += 4 + homeHealth();
      if (!st.paver && st.score >= 120) { st.paver = true; st.tool = 'paver'; renderTools(); note('Permeable pavers unlocked for the cloudburst finale.'); }
      else note(floodedHomes ? 'Storm hit hard. Recover flooded homes before the next wave.' : 'Storm absorbed. Spend the new budget before runoff grows.');
      st.wave += 1; tone(floodedHomes ? 'bad' : 'win'); render(); if (st.wave > st.total) finish();
    }
    function finish() {
      const floodedHomes = st.cells.filter((cell) => cell.type === 'home' && cell.flood).length;
      const final = st.score + homeHealth() * 35 + st.budget * 2 - pollution() - floodedHomes * 40;
      st.best = Math.max(st.best, final); st.score = final;
      note(floodedHomes ? `Season complete with ${floodedHomes} flooded home. Replay to reroute the first curb flow.` : `Season complete. Final resilience score ${final}. Try a different tool order.`);
      tone(floodedHomes ? 'bad' : 'win'); render();
    }
    function move(delta) { st.selected = clamp(st.selected + delta, 0, 35); render(); }
    root.addEventListener('click', (event) => {
      const cellButton = event.target.closest('.rain-cell'); if (cellButton) { st.selected = Number(cellButton.dataset.index); render(); return; }
      const toolButton = event.target.closest('[data-tool]'); if (toolButton) { st.tool = toolButton.dataset.tool; renderTools(); render(); return; }
      const action = event.target.closest('[data-act]')?.dataset.act;
      if (action === 'build') build(); if (action === 'clear') clearFlood(); if (action === 'pump') pump(); if (action === 'storm') runStorm(); if (action === 'reset') seed();
      if (action === 'sound') { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); tone('ok'); }
    });
    root.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
      if (event.key === 'ArrowDown') { event.preventDefault(); move(6); }
      if (event.key === 'ArrowUp') { event.preventDefault(); move(-6); }
      if (event.key.toLowerCase() === 'b') build();
      if (event.key.toLowerCase() === 'c') clearFlood();
      if (event.key.toLowerCase() === 'p') pump();
      if (event.key.toLowerCase() === 'r') runStorm();
    });
    seed();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
