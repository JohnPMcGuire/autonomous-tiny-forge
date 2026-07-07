(() => {
  const APP = {
    name: 'Greenhouse Grid', emoji: '🌱', category: 'play', version: '1.0.0',
    summary: 'Grow a tiny greenhouse by balancing water, shade, pollinators, pests, and harvest timing.',
    description: 'A local greenhouse strategy game with crop choices, day-by-day growth, water and shade resources, bee boosts, pest pressure, drought events, recoverable failures, scoring, session-only night-bloom unlock, touch and keyboard controls, reduced-motion behavior, optional local audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const cropDefs = {
    basil: { name: 'Basil', icon: 'B', water: 2, shade: 1, bee: 0, days: 2, value: 34 },
    tomato: { name: 'Tomato', icon: 'T', water: 3, shade: 0, bee: 1, days: 3, value: 58 },
    orchid: { name: 'Orchid', icon: 'O', water: 1, shade: 2, bee: 1, days: 4, value: 78 },
    moon: { name: 'Moonpea', icon: 'M', water: 2, shade: 2, bee: 2, days: 3, value: 96 }
  };
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lowMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensureStyles() {
    if ($('#greenhouse-grid-styles')) return;
    const style = document.createElement('style');
    style.id = 'greenhouse-grid-styles';
    style.textContent = `
      .green-card{animation:green-rise .24s ease both}.green-game{max-width:1120px;gap:14px}.green-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.green-stat,.green-board,.green-panel,.green-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.green-stat{padding:10px 12px}.green-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.green-stat strong{display:block;margin-top:4px}.green-layout{display:grid;grid-template-columns:1.05fr .95fr;gap:12px}.green-board{padding:12px;background:linear-gradient(135deg,#dcfce7,#f8fafc)}.green-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.green-cell{min-height:86px;border:1px solid #bbf7d0;border-radius:16px;background:linear-gradient(160deg,#f0fdf4,#d9f99d);display:grid;place-items:center;text-align:center;font-weight:900;cursor:pointer;position:relative;touch-action:manipulation}.green-cell:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.green-cell.is-selected{box-shadow:0 0 0 3px #22c55e inset}.green-cell.is-pest{background:linear-gradient(160deg,#fef2f2,#dcfce7)}.green-cell small{display:block;font-weight:800;color:#166534}.green-sprout{font-size:1.7rem}.green-panel{padding:14px;display:grid;gap:12px}.green-brief{padding:13px;background:#f8fafc}.green-brief h3{margin:.2rem 0;font-size:1.2rem}.green-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.green-actions button{min-height:44px}.green-crops{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.green-crops button{border:1px solid var(--line);border-radius:14px;background:#fff;padding:9px 7px;font-weight:900}.green-crops button[aria-pressed=true]{background:#052e16;color:#fff}.green-tags{display:flex;flex-wrap:wrap;gap:6px}.green-tags span{border:1px solid var(--line);border-radius:999px;padding:4px 8px;background:#fff;font-size:.74rem;font-weight:800}.green-log{min-height:96px;padding:17px 19px}.green-bars{display:grid;gap:7px}.green-bar{height:12px;border-radius:999px;background:#e5e7eb;overflow:hidden}.green-bar span{display:block;height:100%;background:#22c55e}.green-bar.heat span{background:#f97316}.green-bar.pests span{background:#ef4444}@media(max-width:860px){.green-hud{grid-template-columns:repeat(2,1fr)}.green-layout{grid-template-columns:1fr}.green-cell{min-height:72px}.green-actions,.green-crops{grid-template-columns:1fr 1fr}}@media(max-width:520px){.green-board{padding:8px}.green-grid{gap:6px}.green-cell{min-height:62px;border-radius:12px}.green-stat{padding:9px}.green-stat strong{font-size:.95rem}}@media(prefers-reduced-motion:reduce){.green-card{animation:none;transition:none}}@keyframes green-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
    `;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-greenhouse-grid-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.greenhouseGridCard = 'true';
    card.classList.add('green-card');
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
    const retry = () => { addCard(); if (!$('[data-greenhouse-grid-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.greenhouseGridRefresh) return;
      button.dataset.greenhouseGridRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Greenhouse%20Grid';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel green-game';
    root.innerHTML = `<div class="green-hud"><div class="green-stat"><span>Day</span><strong id="gg-day">1 / 7</strong></div><div class="green-stat"><span>Water</span><strong id="gg-water">8</strong></div><div class="green-stat"><span>Shade</span><strong id="gg-shade">3</strong></div><div class="green-stat"><span>Bees</span><strong id="gg-bees">2</strong></div><div class="green-stat"><span>Score</span><strong id="gg-score">0</strong></div><div class="green-stat"><span>Best</span><strong id="gg-best">0</strong></div></div><div class="green-layout"><div class="green-board"><div class="green-grid" role="grid" aria-label="Greenhouse planting grid"></div></div><div class="green-panel"><div class="green-brief"></div><div class="green-crops" role="group" aria-label="Choose crop"></div><div class="green-tags"></div><div class="green-bars"><div class="green-bar heat"><span id="gg-heat-bar"></span></div><div class="green-bar pests"><span id="gg-pest-bar"></span></div></div><div class="green-actions"><button class="button" type="button" data-act="plant">Plant selected crop</button><button class="button button-secondary" type="button" data-act="water">Water cell</button><button class="button button-secondary" type="button" data-act="shade">Pull shade cloth</button><button class="button button-secondary" type="button" data-act="bee">Invite bees</button><button class="button button-secondary" type="button" data-act="harvest">Harvest ready crop</button><button class="button button-secondary" type="button" data-act="next">Next day</button><button class="button button-secondary" type="button" data-act="clear">Clear pest</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card green-log" aria-live="polite"></div>`;
    stage.append(root);

    const grid = $('.green-grid', root), crops = $('.green-crops', root), brief = $('.green-brief', root), tags = $('.green-tags', root), log = $('.green-log', root);
    const st = { day: 1, season: 7, score: 0, best: 0, water: 8, shade: 3, bees: 2, heat: 34, pests: 8, selected: 12, crop: 'basil', night: false, sound: false, ac: null, cells: Array.from({ length: 25 }, () => null) };
    const reduced = lowMotion();
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });

    Object.entries(cropDefs).forEach(([id, crop]) => {
      if (id === 'moon' && !st.night) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.crop = id;
      button.textContent = `${crop.icon} ${crop.name}`;
      button.setAttribute('aria-pressed', String(id === st.crop));
      crops.append(button);
    });

    function renderCrops() {
      crops.replaceChildren();
      Object.entries(cropDefs).forEach(([id, crop]) => {
        if (id === 'moon' && !st.night) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.crop = id;
        button.textContent = `${crop.icon} ${crop.name}`;
        button.setAttribute('aria-pressed', String(id === st.crop));
        crops.append(button);
      });
    }
    function tone(kind) {
      if (!st.sound) return; const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume(); const osc = st.ac.createOscillator(); const gain = st.ac.createGain();
      osc.type = kind === 'bad' ? 'triangle' : 'sine'; osc.frequency.value = kind === 'win' ? 760 : kind === 'bad' ? 170 : 430;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.055, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .16); osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .18);
    }
    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: arrows select a bed, P plants, W waters, S shades, B bees, H harvests, N advances.</small>`; }
    function hud() {
      $('#gg-day', root).textContent = `${st.day} / ${st.season}${st.night ? '+' : ''}`; $('#gg-water', root).textContent = st.water; $('#gg-shade', root).textContent = st.shade; $('#gg-bees', root).textContent = st.bees; $('#gg-score', root).textContent = st.score; $('#gg-best', root).textContent = Math.max(st.best, st.score); $('#gg-heat-bar', root).style.width = `${st.heat}%`; $('#gg-pest-bar', root).style.width = `${st.pests}%`;
    }
    function describe() {
      const selected = st.cells[st.selected];
      brief.innerHTML = `<h3>${st.night ? 'Night-bloom' : 'Spring'} greenhouse</h3><p>${selected ? `${cropDefs[selected.type].name}: ${selected.growth}/${cropDefs[selected.type].days} growth, ${selected.water} water, ${selected.shade} shade, ${selected.bee} pollination${selected.pest ? ', pest pressure' : ''}.` : 'Select an empty bed, choose a crop, and plant. Balance growth needs before advancing the day.'}</p>`;
      const tagText = [`Heat ${st.heat}%`, `Pests ${st.pests}%`, st.night ? 'Moonpea unlocked' : 'Unlock after 7 days', reduced ? 'Reduced motion' : 'Animated growth', `${readyCount()} ready`];
      tags.replaceChildren(...tagText.map((textValue) => { const item = document.createElement('span'); item.textContent = textValue; return item; }));
    }
    function readyCount() { return st.cells.filter((cell) => cell && cell.growth >= cropDefs[cell.type].days).length; }
    function render() {
      grid.replaceChildren();
      st.cells.forEach((cell, index) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = `green-cell${index === st.selected ? ' is-selected' : ''}${cell?.pest ? ' is-pest' : ''}`; button.dataset.index = index; button.setAttribute('role', 'gridcell'); button.setAttribute('aria-label', cell ? `${cropDefs[cell.type].name} bed, growth ${cell.growth}` : 'Empty greenhouse bed');
        button.innerHTML = cell ? `<span class="green-sprout">${cell.pest ? '🐛' : cell.growth >= cropDefs[cell.type].days ? '🌸' : '🌿'}</span><small>${cropDefs[cell.type].icon} ${cell.growth}/${cropDefs[cell.type].days}</small>` : '<span class="green-sprout">·</span><small>empty</small>';
        grid.append(button);
      });
      describe(); hud();
    }
    function plant() {
      if (st.cells[st.selected]) return note('That bed is already planted. Harvest or clear another bed first.');
      const def = cropDefs[st.crop];
      if (st.water < def.water) return note('Not enough water to start that crop. Advance a day or choose a thriftier seed.');
      st.water -= def.water;
      st.cells[st.selected] = { type: st.crop, growth: 0, water: def.water, shade: 0, bee: 0, pest: false };
      tone('tap'); note(`${def.name} planted. Now tune shade, bees, and watering before the day changes.`); render();
    }
    function water() { const cell = st.cells[st.selected]; if (!cell) return note('Select a planted bed before watering.'); if (st.water <= 0) return note('The tank is dry. Advance a day and hope the refill arrives.'); st.water -= 1; cell.water += 1; st.heat = clamp(st.heat - 3, 0, 100); tone('tap'); note('Water added. Too much heat still slows tender crops.'); render(); }
    function shade() { const cell = st.cells[st.selected]; if (!cell) return note('Select a planted bed before pulling shade cloth.'); if (st.shade <= 0) return note('No shade cloth remains today.'); st.shade -= 1; cell.shade += 1; st.heat = clamp(st.heat - 8, 0, 100); tone('tap'); note('Shade cloth placed. Orchids love it, tomatoes mostly tolerate it.'); render(); }
    function bee() { const cell = st.cells[st.selected]; if (!cell) return note('Select a planted bed before inviting bees.'); if (st.bees <= 0) return note('No bee visits remain today.'); st.bees -= 1; cell.bee += 1; st.pests = clamp(st.pests - 5, 0, 100); tone('tap'); note('Bee visit logged. Pollination boosts fruiting crops and calms pest pressure.'); render(); }
    function clearPest() { const cell = st.cells[st.selected]; if (!cell || !cell.pest) return note('No pest on the selected bed.'); st.pests = clamp(st.pests + 5, 0, 100); cell.pest = false; tone('tap'); note('Pest cleared, but the inspection stirred up the house.'); render(); }
    function harvest() {
      const cell = st.cells[st.selected]; if (!cell) return note('Select a crop before harvesting.'); const def = cropDefs[cell.type];
      if (cell.growth < def.days) return note('That crop is not ready. You can harvest early only by waiting for better growth.');
      const bonus = Math.max(0, 18 - st.heat / 8 - st.pests / 10 + cell.bee * 8 - (cell.pest ? 18 : 0)); const gain = Math.round(def.value + bonus);
      st.score += gain; st.cells[st.selected] = null; tone('win'); note(`Harvested ${def.name} for ${gain} points.`); render();
    }
    function nextDay() {
      st.day += 1; st.water = clamp(st.water + 5 - Math.floor(st.heat / 35), 3, 12); st.shade = 3; st.bees = st.night ? 3 : 2; st.heat = clamp(st.heat + 11 + (st.day % 3) * 5, 0, 100); st.pests = clamp(st.pests + 7 + readyCount() * 2, 0, 100);
      st.cells.forEach((cell, index) => { if (!cell) return; const def = cropDefs[cell.type]; let grow = 1; if (cell.water >= def.water) grow += 1; if (cell.shade >= def.shade) grow += 1; if (cell.bee >= def.bee) grow += 1; if (st.heat > 78) grow -= 1; if (cell.pest) grow -= 1; cell.growth = clamp(cell.growth + Math.max(0, grow), 0, def.days); cell.water = Math.max(0, cell.water - 1); cell.shade = 0; cell.bee = 0; if (!cell.pest && st.pests > 48 && (index + st.day) % 4 === 0) cell.pest = true; });
      if (st.day > st.season) { st.best = Math.max(st.best, st.score); st.night = true; st.day = 1; st.heat = 22; st.pests = 18; st.water = 10; if (!cropDefs[st.crop]) st.crop = 'basil'; renderCrops(); note('Night-bloom greenhouse unlocked. Moonpeas score big but need bees and shade together.'); } else { note(st.heat > 78 ? 'Heat spike. Shade or water priority beds before growth stalls.' : 'A new day begins. Check pests and harvest ready blooms.'); }
      tone('tap'); render();
    }
    root.addEventListener('click', (event) => {
      const cellButton = event.target.closest('.green-cell'); if (cellButton) { st.selected = Number(cellButton.dataset.index); render(); return; }
      const cropButton = event.target.closest('[data-crop]'); if (cropButton) { st.crop = cropButton.dataset.crop; renderCrops(); render(); return; }
      const action = event.target.closest('button')?.dataset.act;
      if (action === 'plant') plant(); if (action === 'water') water(); if (action === 'shade') shade(); if (action === 'bee') bee(); if (action === 'harvest') harvest(); if (action === 'next') nextDay(); if (action === 'clear') clearPest(); if (action === 'sound') { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); tone('tap'); }
    });
    root.addEventListener('keydown', (event) => {
      const keys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','p','P','w','W','s','S','b','B','h','H','n','N']; if (!keys.includes(event.key)) return; event.preventDefault();
      if (event.key === 'ArrowUp') st.selected = clamp(st.selected - 5, 0, 24); if (event.key === 'ArrowDown') st.selected = clamp(st.selected + 5, 0, 24); if (event.key === 'ArrowLeft') st.selected = clamp(st.selected - 1, 0, 24); if (event.key === 'ArrowRight') st.selected = clamp(st.selected + 1, 0, 24); if (event.key === 'p' || event.key === 'P') plant(); if (event.key === 'w' || event.key === 'W') water(); if (event.key === 's' || event.key === 'S') shade(); if (event.key === 'b' || event.key === 'B') bee(); if (event.key === 'h' || event.key === 'H') harvest(); if (event.key === 'n' || event.key === 'N') nextDay(); render();
    });
    root.tabIndex = 0; render(); note('Plant a fast basil, then test tomatoes and orchids once the resource rhythm is clear.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
