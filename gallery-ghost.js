(() => {
  const APP = {
    name: 'Gallery Ghost',
    emoji: '🕯️',
    category: 'play',
    version: '1.0.0',
    summary: 'Slip through a midnight museum by timing patrols, light cones, keys, decoys, battery, and escape routes.',
    description: 'A local stealth-planning mini-game with changing museum floors, patrol timing, visible camera cones, key-and-lock routing, decoys, limited lamp battery, alarm recovery, scoring, session-only curator mode, responsive SVG/DOM rendering, touch and keyboard controls, reduced-motion behavior, optional local audio, and teardown.'
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const label = (value) => value === 'play' ? 'Play' : value === 'useful' ? 'Useful' : 'Experiment';
  const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensureStyles() {
    if ($('#gallery-ghost-styles')) return;
    const style = document.createElement('style');
    style.id = 'gallery-ghost-styles';
    style.textContent = `
      .ghost-card{animation:ghost-rise .24s ease both}
      .ghost-game{max-width:1120px;gap:14px}
      .ghost-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
      .ghost-stat,.ghost-board,.ghost-panel,.ghost-brief{border:1px solid var(--line);border-radius:18px;background:#fff}
      .ghost-stat{padding:10px 12px}.ghost-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.ghost-stat strong{display:block;margin-top:4px}
      .ghost-layout{display:grid;grid-template-columns:1.15fr .85fr;gap:12px}.ghost-board{padding:12px;background:linear-gradient(135deg,#eef2ff,#f8fafc)}
      .ghost-board svg{width:100%;height:min(62vh,500px);min-height:340px;display:block;border-radius:16px;background:#0f172a;touch-action:manipulation}
      .ghost-panel{padding:14px;display:grid;gap:12px}.ghost-brief{padding:13px;background:#f8fafc}.ghost-brief h3{margin:.2rem 0;font-size:1.2rem}
      .ghost-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.ghost-actions button{min-height:44px}.ghost-tags{display:flex;flex-wrap:wrap;gap:6px}.ghost-tags span{border:1px solid var(--line);border-radius:999px;padding:4px 8px;background:#fff;font-size:.74rem;font-weight:800}
      .ghost-log{min-height:112px;padding:17px 19px}.ghost-cell{fill:#111827;stroke:#334155;stroke-width:.35}.ghost-wall{fill:#030712}.ghost-exit{fill:#22c55e}.ghost-lock{fill:#9333ea}.ghost-key{fill:#facc15}.ghost-art{fill:#38bdf8}.ghost-decoy{fill:#fb923c}.ghost-cone{fill:#facc15;opacity:.22}.ghost-cone.is-hot{fill:#f97316;opacity:.32}.ghost-path{fill:none;stroke:#93c5fd;stroke-width:1.2;stroke-linecap:round;stroke-dasharray:2 2}.ghost-player{fill:#f8fafc;stroke:#0f172a;stroke-width:.65;filter:drop-shadow(0 4px 6px rgba(255,255,255,.22))}.ghost-guard{fill:#ef4444;stroke:#fecaca;stroke-width:.45}.ghost-focus{fill:none;stroke:#60a5fa;stroke-width:.75;animation:ghost-pulse 1.5s ease-out infinite}.ghost-text{fill:#e5e7eb;font-size:2.3px;font-weight:900;text-anchor:middle;dominant-baseline:middle;pointer-events:none}.ghost-cell-button{cursor:pointer}
      @media(max-width:860px){.ghost-hud{grid-template-columns:repeat(2,1fr)}.ghost-layout{grid-template-columns:1fr}.ghost-board svg{height:420px}.ghost-actions{grid-template-columns:1fr}}
      @media(max-width:520px){.ghost-board{padding:8px}.ghost-board svg{height:360px;min-height:320px}.ghost-stat{padding:9px}.ghost-stat strong{font-size:.95rem}}
      @media(prefers-reduced-motion:reduce){.ghost-card,.ghost-focus{animation:none;transition:none}}
      @keyframes ghost-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes ghost-pulse{from{r:1.1;opacity:.8}to{r:2.6;opacity:0}}
    `;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid');
    const template = $('#app-card-template');
    if (!grid || !template || $('[data-gallery-ghost-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.galleryGhostCard = 'true';
    card.classList.add('ghost-card');
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
    const retry = () => {
      addCard();
      if (!$('[data-gallery-ghost-card]') && tries++ < 20) setTimeout(retry, 120);
    };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.galleryGhostRefresh) return;
      button.dataset.galleryGhostRefresh = '1';
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
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Gallery%20Ghost';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel ghost-game';
    root.innerHTML = `
      <div class="ghost-hud"><div class="ghost-stat"><span>Floor</span><strong id="gg-floor">1 / 4</strong></div><div class="ghost-stat"><span>Moves</span><strong id="gg-moves">24</strong></div><div class="ghost-stat"><span>Alarm</span><strong id="gg-alarm">0</strong></div><div class="ghost-stat"><span>Battery</span><strong id="gg-battery">3</strong></div><div class="ghost-stat"><span>Score</span><strong id="gg-score">0</strong></div><div class="ghost-stat"><span>Best</span><strong id="gg-best">0</strong></div></div>
      <div class="ghost-layout"><div class="ghost-board"><svg viewBox="0 0 72 72" role="img" aria-label="Museum stealth map"></svg></div><div class="ghost-panel"><div class="ghost-brief"></div><div class="ghost-tags"></div><div class="ghost-actions"><button class="button" type="button" data-act="wait">Wait one beat</button><button class="button button-secondary" type="button" data-act="decoy">Drop decoy</button><button class="button button-secondary" type="button" data-act="lamp">Lamp sweep</button><button class="button button-secondary" type="button" data-act="undo">Undo step</button><button class="button button-secondary" type="button" data-act="sound">Sound off</button><button class="button button-secondary" type="button" data-act="new">New floor</button></div></div></div>
      <div class="result-card ghost-log" aria-live="polite"></div>`;
    stage.append(root);

    const svg = $('svg', root);
    const log = $('.ghost-log', root);
    const brief = $('.ghost-brief', root);
    const tags = $('.ghost-tags', root);
    const st = { w: 9, h: 9, floor: 1, floors: 4, score: 0, best: 0, moves: 24, alarm: 0, battery: 3, decoys: 2, keys: 0, art: 0, turn: 0, curator: false, over: false, sound: false, ac: null, focus: { x: 0, y: 0 }, player: { x: 0, y: 0 }, exit: { x: 8, y: 8 }, lock: null, key: null, artifacts: [], decoyTiles: [], walls: new Set(), guards: [], history: [] };
    const cellKey = (x, y) => `${x},${y}`;
    const inside = (x, y) => x >= 0 && y >= 0 && x < st.w && y < st.h;
    const blocked = (x, y) => !inside(x, y) || st.walls.has(cellKey(x, y));
    const same = (a, b) => a && b && a.x === b.x && a.y === b.y;
    const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    function generateFloor(advance = false) {
      if (advance) st.floor += 1;
      st.over = false; st.moves = Math.max(16, 25 - st.floor * 2 - (st.curator ? 3 : 0)); st.alarm = 0; st.battery = st.curator ? 2 : 3; st.decoys = 2; st.keys = 0; st.art = 0; st.turn = 0; st.history = [];
      st.player = { x: 0, y: 8 }; st.focus = { ...st.player }; st.exit = { x: 8, y: 0 }; st.lock = st.floor > 1 ? { x: 7, y: 1 } : null; st.key = { x: 2 + (st.floor % 3), y: 2 };
      st.artifacts = [{ x: 1, y: 1 + (st.floor % 2), value: 40 }, { x: 6, y: 6, value: 55 }, { x: 4, y: 4 + (st.floor % 2), value: 65 }]; st.decoyTiles = []; st.walls = new Set();
      [[2,7],[2,6],[2,5],[4,8],[4,7],[6,4],[7,4],[3,1],[4,1],[5,1],[1,4],[2,4],[5,5],[5,6],[7,7],[1,6],[6,2]].slice(0, 9 + st.floor + (st.curator ? 2 : 0)).forEach(([x, y], i) => { if ((i + st.floor) % 4 !== 0 && !same({x,y}, st.player) && !same({x,y}, st.exit)) st.walls.add(cellKey(x, y)); });
      st.guards = [{ id: 1, path: [{x:6,y:8},{x:8,y:8},{x:8,y:5},{x:6,y:5}], index: 0, dir: 1 }, { id: 2, path: [{x:0,y:3},{x:3,y:3},{x:3,y:0},{x:0,y:0}], index: 1, dir: 1 }];
      if (st.floor >= 3 || st.curator) st.guards.push({ id: 3, path: [{x:5,y:2},{x:8,y:2},{x:8,y:4},{x:5,y:4}], index: 2, dir: -1 });
      note('Reach the green exit. Collect art for score, but patrol cones raise the alarm. Purple doors need a key.'); render();
    }

    function guardPos(guard, offset = 0) { const len = guard.path.length; let next = guard.index + offset * guard.dir; while (next < 0) next += len; return guard.path[next % len]; }
    function coneCells(guard) { const pos = guardPos(guard); const next = guardPos(guard, 1); const dx = Math.sign(next.x - pos.x); const dy = Math.sign(next.y - pos.y); const cells = []; for (let step = 1; step <= 3; step += 1) { const x = pos.x + dx * step; const y = pos.y + dy * step; if (blocked(x, y)) break; cells.push({ x, y }); } return cells; }
    function seen(tile = st.player) { return st.guards.some((guard) => same(guardPos(guard), tile) || coneCells(guard).some((cell) => same(cell, tile))); }
    function snapshot() { return JSON.stringify({ player: st.player, moves: st.moves, alarm: st.alarm, battery: st.battery, decoys: st.decoys, keys: st.keys, art: st.art, score: st.score, turn: st.turn, guards: st.guards.map(g => ({ index: g.index, dir: g.dir })), artifacts: st.artifacts, decoyTiles: st.decoyTiles }); }
    function restore(raw) { const data = JSON.parse(raw); Object.assign(st, data); st.focus = { ...st.player }; render(); }
    function pushHistory() { st.history.push(snapshot()); if (st.history.length > 12) st.history.shift(); }
    function moveGuards() { st.guards.forEach((guard) => { const len = guard.path.length; guard.index += guard.dir; if (guard.index >= len) guard.index = 0; if (guard.index < 0) guard.index = len - 1; }); }

    function step(dx, dy) {
      if (st.over) return generateFloor(false);
      const nx = st.player.x + dx; const ny = st.player.y + dy;
      if (blocked(nx, ny)) { note('That route is blocked by a gallery wall. Try another angle or wait for the patrol cycle.'); tone('bad'); return; }
      if (st.lock && nx === st.lock.x && ny === st.lock.y && st.keys < 1) { note('The purple archive door is locked. Get the brass key first.'); tone('bad'); return; }
      if (st.moves <= 0) return fail('The dawn crew arrived before you escaped.');
      pushHistory(); st.player = { x: nx, y: ny }; st.focus = { ...st.player }; st.moves -= 1; st.turn += 1; collect(); if (!st.over) resolveBeat();
    }

    function collect() {
      if (same(st.player, st.key)) { st.keys += 1; st.key = null; st.score += 25; note('Key lifted. The archive door is now a shortcut instead of a wall.'); tone('good'); }
      const artIndex = st.artifacts.findIndex((item) => same(item, st.player));
      if (artIndex >= 0) { const item = st.artifacts.splice(artIndex, 1)[0]; st.art += 1; st.score += item.value + st.moves; note('Artifact recovered. The exit is safer, but greed still costs steps.'); tone('good'); }
      if (same(st.player, st.exit)) finishFloor();
    }

    function resolveBeat(waited = false) {
      moveGuards();
      const decoyHit = st.decoyTiles.find((tile) => st.guards.some((guard) => same(guardPos(guard), tile)));
      if (decoyHit) { st.score += 15; st.decoyTiles = st.decoyTiles.filter((tile) => !same(tile, decoyHit)); st.guards.forEach((guard) => { if (dist(guardPos(guard), decoyHit) <= 1) guard.dir *= -1; }); note('A patrol bit on the decoy and reversed its route.'); tone('good'); }
      if (seen()) { st.alarm += waited ? 1 : 2; st.score = Math.max(0, st.score - 10); note('Caught in a cone. Alarm climbed, but you can still recover with timing.'); tone('bad'); }
      else if (waited) { st.score += 4; note('You waited in shadow and read the patrol rhythm.'); }
      if (st.alarm >= 6) return fail('The alarm locked the museum down.');
      if (st.moves <= 0) return fail('The dawn crew arrived before you escaped.');
      render();
    }

    function finishFloor() {
      const bonus = st.moves * 8 + Math.max(0, 6 - st.alarm) * 20 + st.art * 35; st.score += bonus;
      if (st.floor >= st.floors) { st.over = true; st.best = Math.max(st.best, st.score); if (!st.curator && st.score >= 520) st.curator = true; note(st.curator ? 'Clean escape. Curator mode is unlocked for tighter patrols.' : 'Clean escape. Score 520 or more to unlock curator mode.'); tone('win'); render(); return; }
      note(`Floor ${st.floor} cleared. Bonus ${bonus}. The next floor adds pressure.`); tone('win'); generateFloor(true);
    }
    function fail(message) { st.over = true; st.best = Math.max(st.best, st.score); note(`${message} Tap New floor to restart, or use undo if you saved a safer step.`); tone('bad'); render(); }
    function waitBeat() { if (st.over) return generateFloor(false); pushHistory(); st.moves -= 1; st.turn += 1; resolveBeat(true); }
    function dropDecoy() { if (st.over) return generateFloor(false); if (st.decoys <= 0) { note('No decoys remain. Use waiting or lamp sweep instead.'); return; } pushHistory(); st.decoys -= 1; st.decoyTiles.push({ ...st.player }); st.moves -= 1; st.turn += 1; note('Decoy dropped. A nearby guard will reverse if it reaches the tile.'); resolveBeat(false); }
    function lampSweep() { if (st.over) return generateFloor(false); if (st.battery <= 0) { note('Lamp battery is empty. Navigate by cones and patrol rhythm now.'); return; } pushHistory(); st.battery -= 1; const safe = neighbors(st.player).filter((tile) => !blocked(tile.x, tile.y) && !seen(tile)); if (safe[0]) st.focus = safe[0]; st.score += safe.length * 3; note(safe.length ? `Lamp sweep found ${safe.length} safer adjacent route${safe.length === 1 ? '' : 's'}.` : 'Lamp sweep found no safe adjacent route. Waiting may be better.'); tone('good'); render(); }
    function undo() { if (!st.history.length) { note('No saved step to undo.'); return; } restore(st.history.pop()); note('Step undone. The patrol clock stayed honest to the saved state.'); tone('good'); }
    function neighbors(tile) { return [{x:tile.x+1,y:tile.y},{x:tile.x-1,y:tile.y},{x:tile.x,y:tile.y+1},{x:tile.x,y:tile.y-1}]; }
    function note(text) { log.innerHTML = `<strong>${text}</strong><small>Arrow keys or WASD move. Tap a neighboring tile to move there. Q waits. E drops a decoy.</small>`; }

    function toggleSound(button) {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) { note('Sound is not available here. The game still works without audio.'); return; }
      st.sound = !st.sound; button.textContent = st.sound ? 'Sound on' : 'Sound off'; button.setAttribute('aria-pressed', String(st.sound));
      if (st.sound) { st.ac ||= new AudioEngine(); st.ac.resume(); tone('good'); }
    }
    function tone(kind) { if (!st.sound || !st.ac) return; const now = st.ac.currentTime; const osc = st.ac.createOscillator(); const gain = st.ac.createGain(); osc.type = kind === 'bad' ? 'sawtooth' : 'sine'; osc.frequency.setValueAtTime(kind === 'win' ? 660 : kind === 'good' ? 520 : 180, now); if (kind === 'win') osc.frequency.exponentialRampToValueAtTime(990, now + .18); gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.07, now + .02); gain.gain.exponentialRampToValueAtTime(.0001, now + .22); osc.connect(gain).connect(st.ac.destination); osc.start(now); osc.stop(now + .24); }

    function render() {
      $('#gg-floor', root).textContent = `${Math.min(st.floor, st.floors)} / ${st.floors}`; $('#gg-moves', root).textContent = st.moves; $('#gg-alarm', root).textContent = `${st.alarm} / 6`; $('#gg-battery', root).textContent = st.battery; $('#gg-score', root).textContent = st.score; $('#gg-best', root).textContent = st.best;
      brief.innerHTML = `<h3>${st.over ? 'Run ended' : st.curator ? 'Curator mode' : 'Midnight floor'}</h3><p>${st.over ? 'Restart or undo from the last safe state.' : 'Plan routes around patrol cones. Collecting art raises score, but escaping matters most.'}</p>`;
      tags.innerHTML = [`Keys ${st.keys}`, `Art ${st.art}`, `Decoys ${st.decoys}`, st.lock ? 'Locked archive' : 'Open floor', st.curator ? 'Curator unlocked' : 'Curator locked'].map((item) => `<span>${item}</span>`).join(''); renderSvg();
    }

    function renderSvg() {
      const size = 8; svg.replaceChildren();
      const make = (name, attrs) => { const el = document.createElementNS('http://www.w3.org/2000/svg', name); Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value)); return el; };
      svg.append(make('rect', { x: 0, y: 0, width: 72, height: 72, fill: '#0f172a', rx: 3 }));
      for (let y = 0; y < st.h; y += 1) for (let x = 0; x < st.w; x += 1) {
        const button = make('g', { class: 'ghost-cell-button', tabindex: '0', role: 'button', 'aria-label': `Move to row ${y + 1}, column ${x + 1}` });
        button.append(make('rect', { x: x * size + .6, y: y * size + .6, width: size - 1.2, height: size - 1.2, rx: 1.2, class: `ghost-cell ${st.walls.has(cellKey(x, y)) ? 'ghost-wall' : ''}` }));
        button.addEventListener('click', () => { const dx = x - st.player.x; const dy = y - st.player.y; if (Math.abs(dx) + Math.abs(dy) === 1) step(dx, dy); else { st.focus = { x, y }; note('Tap an adjacent tile to move. This tile is now marked for planning.'); render(); } });
        button.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); button.dispatchEvent(new Event('click')); } }); svg.append(button);
      }
      st.guards.forEach((guard) => { coneCells(guard).forEach((cell) => svg.append(make('rect', { x: cell.x * size + .9, y: cell.y * size + .9, width: size - 1.8, height: size - 1.8, rx: 1.4, class: `ghost-cone ${seen(cell) ? 'is-hot' : ''}` }))); const path = guard.path.map((point, i) => `${i ? 'L' : 'M'} ${point.x * size + size/2} ${point.y * size + size/2}`).join(' ') + ' Z'; svg.append(make('path', { d: path, class: 'ghost-path', opacity: prefersReduced() ? .35 : .7 })); });
      drawToken(st.exit, 'ghost-exit', 'E'); if (st.lock) drawToken(st.lock, 'ghost-lock', 'L'); if (st.key) drawToken(st.key, 'ghost-key', 'K'); st.artifacts.forEach((item) => drawToken(item, 'ghost-art', 'A')); st.decoyTiles.forEach((item) => drawToken(item, 'ghost-decoy', 'D')); st.guards.forEach((guard) => drawToken(guardPos(guard), 'ghost-guard', 'G')); if (!prefersReduced()) svg.append(make('circle', { cx: st.focus.x * size + size/2, cy: st.focus.y * size + size/2, r: 1.2, class: 'ghost-focus' })); drawToken(st.player, 'ghost-player', 'You');
      function drawToken(tile, cls, text) { svg.append(make('rect', { x: tile.x * size + 1.3, y: tile.y * size + 1.3, width: size - 2.6, height: size - 2.6, rx: text === 'You' ? 3 : 1.8, class: cls })); const t = make('text', { x: tile.x * size + size/2, y: tile.y * size + size/2 + .15, class: 'ghost-text' }); t.textContent = text; svg.append(t); }
    }

    function onKey(event) { if (!dialog.open) return; const key = event.key.toLowerCase(); const map = { arrowup: [0,-1], w: [0,-1], arrowdown: [0,1], s: [0,1], arrowleft: [-1,0], a: [-1,0], arrowright: [1,0], d: [1,0] }; if (map[key]) { event.preventDefault(); step(map[key][0], map[key][1]); } else if (key === 'q') { event.preventDefault(); waitBeat(); } else if (key === 'e') { event.preventDefault(); dropDecoy(); } }
    root.addEventListener('click', (event) => { const button = event.target.closest('[data-act]'); if (!button) return; const act = button.dataset.act; if (act === 'wait') waitBeat(); if (act === 'decoy') dropDecoy(); if (act === 'lamp') lampSweep(); if (act === 'undo') undo(); if (act === 'sound') toggleSound(button); if (act === 'new') generateFloor(false); });
    document.addEventListener('keydown', onKey);
    dialog.addEventListener('close', () => { document.removeEventListener('keydown', onKey); if (st.ac) st.ac.close().catch(() => {}); }, { once: true });
    generateFloor(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
