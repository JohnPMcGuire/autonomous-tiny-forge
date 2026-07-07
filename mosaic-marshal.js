(() => {
  const APP = { name: 'Mosaic Marshal', emoji: '🧱', category: 'play', version: '1.0.0', summary: 'Arrange a shifting tile wall to satisfy patron patterns before the grout budget runs out.', description: 'A local spatial strategy puzzle with patron commissions, tile swaps, rotations, cracked grout, limited glaze repairs, action economy, adaptive rounds, unlockable night wall pressure, scoring, touch and keyboard controls, optional local audio, reduced-motion behavior, and teardown.' };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const COLORS = ['amber','jade','cobalt','rose'];
  const MARKS = ['◆','●','▲','✚'];
  const briefs = [
    { name: 'Sun court', color: 'amber', mark: '◆', rule: 'Make the center plus mostly amber and place at least two diamonds on the outer rim.' },
    { name: 'Harbor wall', color: 'cobalt', mark: '●', rule: 'Build a cobalt tide across any row and keep round marks connected.' },
    { name: 'Garden gate', color: 'jade', mark: '▲', rule: 'Grow a jade corner cluster and point triangles toward the center.' },
    { name: 'Rose arcade', color: 'rose', mark: '✚', rule: 'Balance rose tiles on both sides and preserve cross marks from cracks.' }
  ];

  function style() {
    if ($('#mosaic-marshal-styles')) return;
    const sheet = document.createElement('style');
    sheet.id = 'mosaic-marshal-styles';
    sheet.textContent = `.mosaic-card{animation:mosaic-pop .24s ease both}.mosaic-game{max-width:1080px;gap:14px}.mosaic-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.mosaic-stat,.mosaic-board-wrap,.mosaic-side,.mosaic-tile,.mosaic-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.mosaic-stat{padding:10px 12px}.mosaic-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.mosaic-stat strong{display:block;margin-top:4px}.mosaic-layout{display:grid;grid-template-columns:1.12fr .88fr;gap:12px}.mosaic-board-wrap{padding:14px;background:linear-gradient(135deg,#fff7ed,#f8fafc);overflow:hidden}.mosaic-board{display:grid;grid-template-columns:repeat(5,minmax(44px,1fr));gap:8px;max-width:560px;margin:0 auto}.mosaic-tile{position:relative;aspect-ratio:1;display:grid;place-items:center;font-size:clamp(1.1rem,4.5vw,2rem);font-weight:900;cursor:pointer;touch-action:manipulation;transition:transform .16s ease,outline .16s ease,box-shadow .16s ease}.mosaic-tile:hover{transform:translateY(-2px)}.mosaic-tile:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.mosaic-tile.is-selected{outline:4px solid #f59e0b;box-shadow:0 0 0 6px rgba(245,158,11,.18)}.mosaic-tile.is-cursor{box-shadow:0 0 0 4px rgba(37,99,235,.22)}.mosaic-tile[data-color=amber]{background:#fef3c7}.mosaic-tile[data-color=jade]{background:#dcfce7}.mosaic-tile[data-color=cobalt]{background:#dbeafe}.mosaic-tile[data-color=rose]{background:#ffe4e6}.mosaic-tile.is-cracked:after{content:'';position:absolute;inset:12% 46% 10% 46%;background:#334155;opacity:.38;transform:rotate(26deg);border-radius:999px}.mosaic-tile small{position:absolute;right:6px;bottom:4px;color:#64748b;font-size:.62rem}.mosaic-side{padding:14px;display:grid;gap:12px}.mosaic-brief{padding:12px;background:#f8fafc}.mosaic-brief h3{margin:.15rem 0;font-size:1.25rem}.mosaic-meter{height:12px;border-radius:999px;background:#e2e8f0;overflow:hidden}.mosaic-meter span{display:block;height:100%;width:0;background:linear-gradient(90deg,#22c55e,#f59e0b,#fb7185)}.mosaic-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.mosaic-actions button{min-height:42px}.mosaic-log{min-height:104px;padding:17px 19px}.mosaic-tags{display:flex;flex-wrap:wrap;gap:6px}.mosaic-tags span{border:1px solid var(--line);border-radius:999px;padding:4px 8px;background:white;font-size:.76rem;font-weight:800}.mosaic-preview{width:100%;height:120px}.mosaic-line{stroke:#0f172a;stroke-width:3;stroke-linecap:round;opacity:.18}.mosaic-glow{fill:none;stroke:#f59e0b;stroke-width:2;stroke-dasharray:7 9;animation:mosaic-spin 8s linear infinite;transform-origin:center}@media(max-width:820px){.mosaic-hud{grid-template-columns:repeat(2,1fr)}.mosaic-layout{grid-template-columns:1fr}.mosaic-actions{grid-template-columns:1fr}.mosaic-board{gap:6px}}@media(prefers-reduced-motion:reduce){.mosaic-card,.mosaic-tile,.mosaic-glow{animation:none;transition:none}}@keyframes mosaic-pop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes mosaic-spin{to{transform:rotate(360deg)}}`;
    document.head.append(sheet);
  }

  function addCard() {
    const grid = $('#app-grid');
    const template = $('#app-card-template');
    if (!grid || !template || $('[data-mosaic-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    style();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.mosaicCard = 'true';
    card.classList.add('mosaic-card');
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
    style();
    let tries = 0;
    const retry = () => { addCard(); if (!$('[data-mosaic-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.mosaicRefresh) return;
      button.dataset.mosaicRefresh = '1';
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
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Mosaic%20Marshal';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel mosaic-game';
    root.innerHTML = `<div class="mosaic-hud"><div class="mosaic-stat"><span>Wall</span><strong id="mm-round">1 / 5</strong></div><div class="mosaic-stat"><span>Actions</span><strong id="mm-actions">18</strong></div><div class="mosaic-stat"><span>Glaze</span><strong id="mm-glaze">3</strong></div><div class="mosaic-stat"><span>Cracks</span><strong id="mm-cracks">0</strong></div><div class="mosaic-stat"><span>Score</span><strong id="mm-score">0</strong></div><div class="mosaic-stat"><span>Best</span><strong id="mm-best">0</strong></div></div><div class="mosaic-layout"><div class="mosaic-board-wrap"><svg class="mosaic-preview" viewBox="0 0 600 120" aria-hidden="true"><circle class="mosaic-glow" cx="300" cy="60" r="44"/><path class="mosaic-line" d="M70 96C150 24 220 24 300 72S460 104 530 28M120 28h360M160 92h280"/></svg><div class="mosaic-board" role="grid" aria-label="Mosaic board"></div></div><div class="mosaic-side"><div class="mosaic-brief"></div><div class="mosaic-meter" aria-label="Commission quality"><span id="mm-meter"></span></div><div class="mosaic-actions"><button class="button" type="button" data-act="swap">Swap selected</button><button class="button button-secondary" type="button" data-act="rotate">Rotate tile</button><button class="button button-secondary" type="button" data-act="glaze">Glaze crack</button><button class="button button-secondary" type="button" data-act="inspect">Inspect pattern</button><button class="button button-secondary" type="button" data-act="sound">Sound off</button><button class="button button-secondary" type="button" data-act="new">New run</button></div></div></div><div class="result-card mosaic-log" aria-live="polite"></div>`;
    stage.append(root);
    const board = $('.mosaic-board', root);
    const briefBox = $('.mosaic-brief', root);
    const log = $('.mosaic-log', root);
    const st = { round: 1, rounds: 5, actions: 18, glaze: 3, score: 0, best: 0, selected: null, cursor: 12, tiles: [], brief: briefs[0], hard: false, over: false, audio: false, ac: null };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rand = (n) => Math.floor(Math.random() * n);
    const idx = (r, c) => r * 5 + c;
    const rc = (i) => [Math.floor(i / 5), i % 5];
    const adj = (a, b) => Math.abs(rc(a)[0] - rc(b)[0]) + Math.abs(rc(a)[1] - rc(b)[1]) === 1;

    function makeTiles() {
      return Array.from({ length: 25 }, (_, i) => ({ color: COLORS[rand(COLORS.length)], mark: MARKS[rand(MARKS.length)], rot: rand(4), crack: Math.random() < (st.hard ? .28 : .18), id: i + '-' + Math.random().toString(36).slice(2) }));
    }
    function start() {
      st.round = 1; st.actions = 18; st.glaze = 3; st.score = 0; st.over = false; st.hard = false; st.best = st.best || 0;
      nextWall('Choose adjacent swaps, rotations, and scarce glaze repairs to satisfy the patron.');
    }
    function nextWall(message) {
      if (st.round > st.rounds) return finish(message);
      st.brief = briefs[(st.round - 1 + rand(briefs.length)) % briefs.length];
      st.actions = Math.max(10, 19 - st.round - (st.hard ? 2 : 0));
      st.glaze = Math.max(1, 4 - Math.floor(st.round / 2));
      st.selected = null; st.cursor = 12; st.tiles = makeTiles();
      log.innerHTML = `<strong>${message}</strong><small>Click two adjacent tiles to swap. Arrow keys move, Enter selects, R rotates, G glazes.</small>`;
      render();
    }
    function quality() {
      const b = st.brief;
      let colorScore = 0, markScore = 0, shapeScore = 0;
      const center = [7,11,12,13,17];
      const rim = st.tiles.map((_, i) => i).filter((i) => rc(i)[0] === 0 || rc(i)[0] === 4 || rc(i)[1] === 0 || rc(i)[1] === 4);
      const rowBest = [0,1,2,3,4].reduce((best, r) => Math.max(best, [0,1,2,3,4].filter((c) => st.tiles[idx(r,c)].color === b.color).length), 0);
      const corner = [0,1,5,6,18,19,23,24].filter((i) => st.tiles[i].color === b.color).length;
      if (b.name === 'Sun court') { colorScore = center.filter((i) => st.tiles[i].color === b.color).length * 9; markScore = rim.filter((i) => st.tiles[i].mark === b.mark).length * 4; shapeScore = lineBonus(b.color); }
      if (b.name === 'Harbor wall') { colorScore = rowBest * 10; markScore = connectedMarks(b.mark) * 6; shapeScore = lineBonus(b.color); }
      if (b.name === 'Garden gate') { colorScore = corner * 7; markScore = st.tiles.filter((t) => t.mark === b.mark && pointsCenter(t)).length * 5; shapeScore = clusterBonus(b.color); }
      if (b.name === 'Rose arcade') { const left = [0,1,5,6,10,11,15,16,20,21].filter((i) => st.tiles[i].color === b.color).length; const right = [3,4,8,9,13,14,18,19,23,24].filter((i) => st.tiles[i].color === b.color).length; colorScore = 44 - Math.abs(left - right) * 7; markScore = st.tiles.filter((t) => t.mark === b.mark && !t.crack).length * 5; shapeScore = clusterBonus(b.color); }
      const crackPenalty = st.tiles.filter((t) => t.crack).length * (st.hard ? 5 : 3);
      return Math.max(0, Math.min(100, Math.round(colorScore + markScore + shapeScore - crackPenalty)));
    }
    function lineBonus(color) {
      let best = 0;
      for (let r = 0; r < 5; r++) best = Math.max(best, [0,1,2,3,4].filter((c) => st.tiles[idx(r,c)].color === color).length);
      for (let c = 0; c < 5; c++) best = Math.max(best, [0,1,2,3,4].filter((r) => st.tiles[idx(r,c)].color === color).length);
      return best * 4;
    }
    function clusterBonus(color) {
      const seen = new Set(); let best = 0;
      st.tiles.forEach((tile, i) => {
        if (tile.color !== color || seen.has(i)) return;
        const stack = [i]; seen.add(i); let n = 0;
        while (stack.length) { const cur = stack.pop(); n++; const [r,c] = rc(cur); [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(([rr,cc]) => { const ni = idx(rr,cc); if (rr>=0 && rr<5 && cc>=0 && cc<5 && st.tiles[ni].color === color && !seen.has(ni)) { seen.add(ni); stack.push(ni); } }); }
        best = Math.max(best, n);
      });
      return best * 5;
    }
    function connectedMarks(mark) {
      const positions = st.tiles.map((t, i) => t.mark === mark ? i : -1).filter((i) => i >= 0);
      if (!positions.length) return 0;
      const seen = new Set([positions[0]]); const stack = [positions[0]];
      while (stack.length) { const cur = stack.pop(); const [r,c] = rc(cur); [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(([rr,cc]) => { const ni = idx(rr,cc); if (rr>=0 && rr<5 && cc>=0 && cc<5 && st.tiles[ni].mark === mark && !seen.has(ni)) { seen.add(ni); stack.push(ni); } }); }
      return seen.size;
    }
    function pointsCenter(t) { return t.rot === 0 || t.rot === 3; }
    function spend(n = 1) {
      st.actions -= n;
      if (st.actions <= 0) scoreWall('The mason clock ran out. You can recover on the next wall, but this commission pays poorly.');
    }
    function select(i) {
      if (st.over) return;
      st.cursor = i;
      if (st.selected === null) { st.selected = i; render(); return; }
      if (st.selected === i) { st.selected = null; render(); return; }
      if (!adj(st.selected, i)) { log.innerHTML = '<strong>Too far for one lift.</strong><small>Select an adjacent tile or move the cursor with arrow keys.</small>'; tone('bad'); st.selected = i; render(); return; }
      const a = st.selected; [st.tiles[a], st.tiles[i]] = [st.tiles[i], st.tiles[a]]; st.selected = null; tone('tap'); spend(1); render();
    }
    function rotate() { if (st.over) return; const i = st.selected ?? st.cursor; st.tiles[i].rot = (st.tiles[i].rot + 1) % 4; tone('tap'); spend(1); render(); }
    function glaze() { if (st.over) return; const i = st.selected ?? st.cursor; if (!st.glaze) { log.innerHTML = '<strong>No glaze left.</strong><small>Finish the wall or use swaps to work around cracked tiles.</small>'; tone('bad'); return; } if (!st.tiles[i].crack) { log.innerHTML = '<strong>This tile is already sound.</strong><small>Save glaze for cracked grout.</small>'; return; } st.tiles[i].crack = false; st.glaze--; tone('win'); spend(1); render(); }
    function inspect() { const q = quality(); const need = q >= 78 ? 'ready to set' : q >= 58 ? 'close, but the patron still sees weak rhythm' : 'still scattered'; log.innerHTML = `<strong>${st.brief.name}: ${q}% quality.</strong><small>The wall is ${need}. ${st.brief.rule}</small>`; }
    function scoreWall(message) {
      const q = quality(); const gain = Math.max(0, q + st.actions * 2 + st.glaze * 5 - st.tiles.filter((t) => t.crack).length * 3);
      st.score += gain;
      st.best = Math.max(st.best, st.score);
      if (st.round === 3 && st.score > 220) st.hard = true;
      const passed = q >= 70;
      st.round++;
      tone(passed ? 'win' : 'bad');
      if (st.round > st.rounds) return finish(message || 'The final wall is set.');
      nextWall(`${passed ? 'Commission accepted' : 'Commission revised'} for ${gain} points. ${st.hard ? 'Night wall pressure is now active.' : 'New patron approaching.'}`);
    }
    function finish(message) {
      st.over = true;
      root.querySelector('#mm-meter').style.width = `${quality()}%`;
      log.innerHTML = `<strong>${message || 'Mosaic run complete.'}</strong><small>Final score ${st.score}. Best this session ${st.best}. Start a new run to chase a cleaner wall.</small>`;
      render();
    }
    function tone(kind) {
      if (!st.audio || !st.ac) return;
      const now = st.ac.currentTime; const osc = st.ac.createOscillator(); const gain = st.ac.createGain();
      osc.frequency.value = kind === 'win' ? 760 : kind === 'bad' ? 180 : 420;
      gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
      osc.connect(gain).connect(st.ac.destination); osc.start(now); osc.stop(now + 0.2);
    }
    function render() {
      const q = quality();
      root.querySelector('#mm-round').textContent = `${Math.min(st.round, st.rounds)} / ${st.rounds}`;
      root.querySelector('#mm-actions').textContent = st.actions;
      root.querySelector('#mm-glaze').textContent = st.glaze;
      root.querySelector('#mm-cracks').textContent = st.tiles.filter((t) => t.crack).length;
      root.querySelector('#mm-score').textContent = st.score;
      root.querySelector('#mm-best').textContent = st.best;
      root.querySelector('#mm-meter').style.width = `${q}%`;
      briefBox.innerHTML = `<p class="app-meta">${st.hard ? 'Night wall' : 'Patron commission'}</p><h3>${st.brief.name}</h3><p>${st.brief.rule}</p><div class="mosaic-tags"><span>Target ${st.brief.color}</span><span>Mark ${st.brief.mark}</span><span>${q}% quality</span></div>`;
      board.replaceChildren();
      st.tiles.forEach((tile, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'mosaic-tile'; b.dataset.color = tile.color; b.setAttribute('role','gridcell'); b.setAttribute('aria-label', `${tile.color} tile ${tile.mark}${tile.crack ? ', cracked' : ''}`); b.innerHTML = `<span style="transform:rotate(${tile.rot * 90}deg)">${tile.mark}</span><small>${i + 1}</small>`;
        if (tile.crack) b.classList.add('is-cracked'); if (st.selected === i) b.classList.add('is-selected'); if (st.cursor === i) b.classList.add('is-cursor');
        b.addEventListener('click', () => select(i)); board.append(b);
      });
    }
    root.querySelector('[data-act=swap]').addEventListener('click', () => st.selected === null ? (st.selected = st.cursor, render()) : scoreWall('Wall submitted early.'));
    root.querySelector('[data-act=rotate]').addEventListener('click', rotate);
    root.querySelector('[data-act=glaze]').addEventListener('click', glaze);
    root.querySelector('[data-act=inspect]').addEventListener('click', inspect);
    root.querySelector('[data-act=new]').addEventListener('click', start);
    root.querySelector('[data-act=sound]').addEventListener('click', (e) => { const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return; st.audio = !st.audio; e.currentTarget.textContent = st.audio ? 'Sound on' : 'Sound off'; e.currentTarget.setAttribute('aria-pressed', String(st.audio)); if (st.audio) { st.ac ||= new AudioEngine(); st.ac.resume(); tone('win'); } });
    root.addEventListener('keydown', (e) => {
      const [r,c] = rc(st.cursor); let next = st.cursor;
      if (e.key === 'ArrowUp') next = idx(Math.max(0, r - 1), c);
      else if (e.key === 'ArrowDown') next = idx(Math.min(4, r + 1), c);
      else if (e.key === 'ArrowLeft') next = idx(r, Math.max(0, c - 1));
      else if (e.key === 'ArrowRight') next = idx(r, Math.min(4, c + 1));
      else if (e.key === 'Enter' || e.key === ' ') select(st.cursor);
      else if (e.key.toLowerCase() === 'r') rotate();
      else if (e.key.toLowerCase() === 'g') glaze();
      else return;
      e.preventDefault(); if (next !== st.cursor) { st.cursor = next; render(); }
    });
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });
    if (reduced) root.querySelector('.mosaic-preview').setAttribute('aria-label', 'Static mosaic guide');
    start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
