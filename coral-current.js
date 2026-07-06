(() => {
  const APP = { name: 'Coral Current', emoji: '🪸', category: 'play', version: '1.0.0', summary: 'Steer reef currents, larvae, cleaners, and storms to keep a tiny ecosystem alive.', description: 'A local reef-management strategy game with directional currents, drifting larvae, algae pressure, cleaners, storm surges, oxygen, focus hints, adaptive waves, session-only moon tide unlocks, scoring, pointer, touch, keyboard controls, reduced-motion behavior, optional local audio, and clean teardown.' };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const dirs = [{x:0,y:-1,m:'↑'},{x:1,y:0,m:'→'},{x:0,y:1,m:'↓'},{x:-1,y:0,m:'←'}];

  function style() {
    if ($('#coral-current-styles')) return;
    const s = document.createElement('style');
    s.id = 'coral-current-styles';
    s.textContent = `.coral-card{animation:coral-in .24s ease both}.coral-game{max-width:1000px;gap:14px}.coral-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.coral-stat{border:1px solid var(--line);border-radius:15px;background:#fff;padding:10px 12px}.coral-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.coral-stat strong{display:block;margin-top:4px}.coral-board{display:grid;grid-template-columns:1fr .76fr;gap:12px}.coral-grid{border:1px solid var(--line);border-radius:26px;background:radial-gradient(circle at 20% 10%,#ecfeff,#dbeafe 46%,#cffafe);padding:12px;display:grid;grid-template-columns:repeat(7,minmax(34px,1fr));gap:7px;touch-action:manipulation}.coral-cell{position:relative;min-height:62px;border:2px solid rgba(14,116,144,.16);border-radius:18px;background:rgba(255,255,255,.78);font-weight:1000;color:#0f172a;box-shadow:inset 0 0 0 1px rgba(255,255,255,.5);transition:transform .12s ease,border-color .12s ease,background .12s ease}.coral-cell:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.coral-cell.is-selected{border-color:#0ea5e9;background:#fff7ed;transform:translateY(-3px)}.coral-cell.is-sick{background:#fee2e2}.coral-cell.is-reef{background:#dcfce7}.coral-cell.is-safe{box-shadow:inset 0 0 0 3px rgba(34,197,94,.28)}.coral-flow{position:absolute;top:6px;left:8px;color:#0284c7;font-size:1rem}.coral-life{position:absolute;right:7px;bottom:5px;font-size:.78rem}.coral-token{display:grid;place-items:center;font-size:1.55rem;min-height:48px}.coral-panel{border:1px solid var(--line);border-radius:20px;background:#fff;padding:14px}.coral-panel p{margin:.5rem 0}.coral-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:10px 0}.coral-actions button{min-height:42px}.coral-log{min-height:104px;padding:17px 19px}.coral-mini{display:grid;gap:7px;margin-top:10px}.coral-meter{height:12px;border-radius:999px;background:#e2e8f0;overflow:hidden}.coral-meter span{display:block;height:100%;background:linear-gradient(90deg,#06b6d4,#22c55e,#facc15);width:60%}@media(max-width:780px){.coral-hud{grid-template-columns:repeat(2,1fr)}.coral-board{grid-template-columns:1fr}.coral-grid{gap:5px;padding:8px}.coral-cell{min-height:48px;border-radius:14px}.coral-token{font-size:1.2rem;min-height:38px}.coral-actions{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.coral-card,.coral-cell{animation:none;transition:none}.coral-cell.is-selected{transform:none}}@keyframes coral-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}`;
    document.head.append(s);
  }

  function addCard() {
    const grid = $('#app-grid'), tpl = $('#app-card-template');
    if (!grid || !tpl || $('[data-coral-card]')) return;
    const f = $('.filter.is-active')?.dataset.filter || 'all';
    if (f !== 'all' && f !== APP.category) return;
    style();
    const node = tpl.content.cloneNode(true), card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.coralCard = 'true';
    card.classList.add('coral-card');
    $('.app-icon', node).textContent = APP.emoji;
    $('.app-meta', node).textContent = `${label(APP.category)} · v${APP.version}`;
    $('.app-name', node).textContent = APP.name;
    $('.app-summary', node).textContent = APP.summary;
    const btn = $('.app-card-button', node);
    btn.setAttribute('aria-label', `Open ${APP.name}`);
    btn.addEventListener('click', open);
    grid.append(node);
  }

  function boot() {
    style();
    let tries = 0;
    const retry = () => { addCard(); if (!$('[data-coral-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((b) => {
      if (b.dataset.coralRefresh) return;
      b.dataset.coralRefresh = '1';
      b.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage'), title = $('#dialog-title'), cat = $('#dialog-category'), desc = $('#dialog-description'), fb = $('#dialog-feedback');
    if (!dialog || !stage) return;
    title.textContent = APP.name;
    cat.textContent = `${label(APP.category)} · ${APP.emoji}`;
    desc.textContent = APP.description;
    fb.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Coral%20Current';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel coral-game';
    root.innerHTML = `<div class="coral-hud"><div class="coral-stat"><span>Wave</span><strong id="cc-wave">1 / 7</strong></div><div class="coral-stat"><span>Coral</span><strong id="cc-coral">0</strong></div><div class="coral-stat"><span>Oxygen</span><strong id="cc-oxygen">60</strong></div><div class="coral-stat"><span>Focus</span><strong id="cc-focus">3</strong></div><div class="coral-stat"><span>Algae</span><strong id="cc-algae">0</strong></div><div class="coral-stat"><span>Score</span><strong id="cc-score">0</strong></div></div><div class="coral-board"><div class="coral-grid" role="grid" aria-label="Reef current grid"></div><div class="coral-panel"><strong>Reef brief</strong><p>Rotate current arrows to drift coral larvae into safe reef pockets before algae spreads.</p><div class="coral-actions"><button class="button" type="button" data-act="drift">Drift tide</button><button class="button button-secondary" type="button" data-act="clean">Send cleaner</button><button class="button button-secondary" type="button" data-act="hint">Focus hint</button><button class="button button-secondary" type="button" data-act="new">New reef</button></div><div class="coral-mini"><small>Controls: tap a cell to rotate it. Arrow keys move focus. Space rotates. Enter drifts. C cleans algae. H spends focus.</small><div class="coral-meter" aria-label="Oxygen meter"><span id="cc-meter"></span></div></div></div></div><div class="result-card coral-log" aria-live="polite"></div><div class="tool-actions"></div>`;
    stage.append(root);
    const grid = $('.coral-grid', root), log = $('.coral-log', root), W = 7, H = 6;
    const st = { wave: 1, waves: 7, score: 0, oxygen: 60, focus: 3, cleaner: 2, selected: 0, moon: false, audio: false, ac: null, cells: [], larvae: [] };
    $('.tool-actions', root).append(btn('Sound off', sound, true), btn('Moon tide lock', moon, true));
    $$('[data-act]', root).forEach((b) => b.addEventListener('click', () => act(b.dataset.act)));
    root.addEventListener('keydown', key);
    dialog.addEventListener('close', tear, { once: true });
    root.tabIndex = -1;
    root.focus();
    build();

    function btn(t, f, sec) { const b = document.createElement('button'); b.type = 'button'; b.className = sec ? 'button button-secondary' : 'button'; b.textContent = t; b.addEventListener('click', f); return b; }
    function say(h) { log.innerHTML = h; }
    function index(x, y) { return y * W + x; }
    function xy(i) { return { x: i % W, y: Math.floor(i / W) }; }
    function cell(i) { return st.cells[i]; }
    function build() {
      st.cells = [];
      for (let i = 0; i < W * H; i++) st.cells.push({ dir: (i + st.wave) % 4, reef: false, algae: false, rock: false });
      [3, 10, 26, 32, 38].forEach((i) => { st.cells[i].reef = true; });
      [8, 19, 28].forEach((i) => { st.cells[i].rock = st.wave > 2; });
      st.larvae = [index(0, 1), index(0, 4), index(6, 2)].slice(0, 2 + Math.min(2, Math.floor(st.wave / 3)));
      if (st.moon) st.larvae.push(index(6, 5));
      st.selected = st.larvae[0];
      st.cleaner = 2;
      st.oxygen = Math.max(30, 68 - st.wave * 4 + (st.moon ? 6 : 0));
      seedAlgae();
      say(`<strong>Wave ${st.wave} started.</strong><small>Guide ${st.larvae.length} larvae into reef pockets. Every drift costs oxygen, but settled coral pushes the score upward.</small>`);
      paint();
    }
    function seedAlgae() {
      const seeds = [index(5, 0), index(6, 4), index(2, 5), index(4, 3)];
      seeds.slice(0, Math.min(seeds.length, 1 + Math.floor(st.wave / 2))).forEach((i) => { if (!cell(i).reef) cell(i).algae = true; });
    }
    function paint() {
      grid.replaceChildren();
      st.cells.forEach((c, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'coral-cell';
        b.setAttribute('role', 'gridcell');
        b.setAttribute('aria-label', describe(i));
        if (i === st.selected) b.classList.add('is-selected');
        if (c.reef) b.classList.add('is-reef');
        if (c.algae) b.classList.add('is-sick');
        if (c.reef && st.larvae.includes(i)) b.classList.add('is-safe');
        b.innerHTML = `<span class="coral-flow">${c.rock ? '■' : dirs[c.dir].m}</span><span class="coral-token">${token(i)}</span><span class="coral-life">${c.algae ? 'algae' : c.reef ? 'reef' : ''}</span>`;
        b.addEventListener('click', () => { st.selected = i; rotate(i); });
        grid.append(b);
      });
      $('#cc-wave', root).textContent = `${st.wave} / ${st.waves}`;
      $('#cc-coral', root).textContent = st.larvae.filter((i) => cell(i)?.reef).length;
      $('#cc-oxygen', root).textContent = st.oxygen;
      $('#cc-focus', root).textContent = st.focus;
      $('#cc-algae', root).textContent = st.cells.filter((c) => c.algae).length;
      $('#cc-score', root).textContent = st.score;
      $('#cc-meter', root).style.width = `${Math.max(4, Math.min(100, st.oxygen))}%`;
    }
    function describe(i) { const c = cell(i); return `${c.rock ? 'Rock' : 'Current ' + dirs[c.dir].m}${c.reef ? ', reef pocket' : ''}${c.algae ? ', algae' : ''}${st.larvae.includes(i) ? ', larva here' : ''}`; }
    function token(i) { if (st.larvae.includes(i)) return cell(i).reef ? '🪸' : '•'; if (cell(i).rock) return '⬛'; if (cell(i).algae) return '🟢'; if (cell(i).reef) return '◌'; return ''; }
    function rotate(i) { const c = cell(i); if (!c || c.rock) return say('<strong>Rock shelf.</strong><small>That cell blocks current and cannot rotate.</small>'); c.dir = (c.dir + 1) % 4; beep(360, .04); paint(); }
    function act(k) { if (k === 'drift') drift(); if (k === 'clean') clean(); if (k === 'hint') hint(); if (k === 'new') newRun(); }
    function key(e) {
      const p = xy(st.selected); let n = st.selected;
      if (e.key === 'ArrowUp') n = index(p.x, Math.max(0, p.y - 1));
      if (e.key === 'ArrowDown') n = index(p.x, Math.min(H - 1, p.y + 1));
      if (e.key === 'ArrowLeft') n = index(Math.max(0, p.x - 1), p.y);
      if (e.key === 'ArrowRight') n = index(Math.min(W - 1, p.x + 1), p.y);
      if (n !== st.selected) { e.preventDefault(); st.selected = n; paint(); }
      if (e.key === ' ') { e.preventDefault(); rotate(st.selected); }
      if (e.key === 'Enter') { e.preventDefault(); drift(); }
      if (e.key.toLowerCase() === 'c') { e.preventDefault(); clean(); }
      if (e.key.toLowerCase() === 'h') { e.preventDefault(); hint(); }
    }
    function drift() {
      st.oxygen -= st.moon ? 5 : 7;
      st.larvae = st.larvae.map((i) => move(i));
      spread();
      const settled = st.larvae.filter((i) => cell(i).reef && !cell(i).algae).length;
      st.score += settled * 60 + Math.max(0, st.oxygen);
      beep(settled ? 620 : 220, .06);
      if (settled === st.larvae.length) return complete();
      if (st.oxygen <= 0 || st.cells.filter((c) => c.algae).length > 12) return recover();
      say(`<strong>Tide drifted.</strong><small>${settled} larvae are settled. Rotate arrows, clean algae, then drift again.</small>`);
      paint();
    }
    function move(i) {
      const c = cell(i); if (!c || c.reef) return i;
      const d = dirs[c.dir], p = xy(i), nx = Math.max(0, Math.min(W - 1, p.x + d.x)), ny = Math.max(0, Math.min(H - 1, p.y + d.y)), ni = index(nx, ny);
      return cell(ni).rock ? i : ni;
    }
    function spread() {
      const grow = [];
      st.cells.forEach((c, i) => { if (!c.algae) return; const p = xy(i); [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => { const x = p.x + dx, y = p.y + dy; if (x >= 0 && x < W && y >= 0 && y < H) { const n = index(x, y); if (!cell(n).reef && !cell(n).rock && ((n + st.wave + st.oxygen) % 5 === 0)) grow.push(n); } }); });
      grow.slice(0, 2 + Math.floor(st.wave / 3)).forEach((i) => { cell(i).algae = true; });
    }
    function clean() {
      if (!st.cleaner) return say('<strong>No cleaner fish left.</strong><small>Use a focus hint or drift carefully toward a reef pocket.</small>');
      const near = nearestAlgae();
      if (near < 0) return say('<strong>Water is clear.</strong><small>Save the cleaner fish for the next algae bloom.</small>');
      cell(near).algae = false; st.cleaner--; st.score += 35; beep(520, .05); say('<strong>Cleaner fish cleared a bloom.</strong><small>Cleaner uses are limited each wave, so keep the currents doing most of the work.</small>'); paint();
    }
    function nearestAlgae() {
      let best = -1, dist = 99, from = xy(st.selected);
      st.cells.forEach((c, i) => { if (!c.algae) return; const p = xy(i), d = Math.abs(p.x - from.x) + Math.abs(p.y - from.y); if (d < dist) { dist = d; best = i; } });
      return best;
    }
    function hint() {
      if (!st.focus) return say('<strong>Focus spent.</strong><small>Try rotating the current under the larva that is farthest from a reef pocket.</small>');
      st.focus--;
      const target = st.larvae.find((i) => !cell(i).reef) ?? st.larvae[0];
      st.selected = target;
      const p = xy(target), reefs = st.cells.map((c, i) => c.reef && !c.algae ? i : -1).filter((i) => i >= 0).sort((a, b) => md(target, a) - md(target, b));
      const r = xy(reefs[0]), want = Math.abs(r.x - p.x) > Math.abs(r.y - p.y) ? (r.x > p.x ? 1 : 3) : (r.y > p.y ? 2 : 0);
      cell(target).dir = want;
      say(`<strong>Focus hint set one current.</strong><small>The selected larva now points ${dirs[want].m} toward the nearest clean reef.</small>`);
      beep(760, .04); paint();
    }
    function md(a, b) { const pa = xy(a), pb = xy(b); return Math.abs(pa.x - pb.x) + Math.abs(pa.y - pb.y); }
    function complete() {
      const bonus = st.oxygen * 8 + st.focus * 40 + (st.moon ? 120 : 0);
      st.score += bonus; beep(820, .09);
      if (st.wave >= st.waves) { say(`<strong>Reef restored: ${st.score}.</strong><small>${st.score >= 3600 ? 'Moon tide is unlocked for this session.' : 'Score 3600 to unlock moon tide.'}</small>`); paint(); return; }
      st.wave++; st.focus = Math.min(4, st.focus + 1); build();
    }
    function recover() {
      st.score = Math.max(0, st.score - 120); st.oxygen = 38; st.focus = Math.min(3, st.focus + 1);
      st.cells.forEach((c, i) => { if (!c.reef && (i + st.wave) % 3 === 0) c.algae = false; });
      say('<strong>Storm recovery.</strong><small>The reef lost points, but oxygen and one focus returned. Cleaner paths are still available.</small>'); paint();
    }
    function newRun() { Object.assign(st, { wave: 1, score: 0, oxygen: 60, focus: 3 }); build(); }
    function moon(e) { if (!st.moon && st.score < 3600) return say('<strong>Moon tide locked.</strong><small>Finish with 3600 points to unlock a fourth larva and gentler oxygen drain for this session.</small>'); st.moon = !st.moon; if (e?.currentTarget) e.currentTarget.setAttribute('aria-pressed', String(st.moon)); st.wave = 1; build(); }
    function sound(e) { st.audio = !st.audio; if (e?.currentTarget) e.currentTarget.textContent = st.audio ? 'Sound on' : 'Sound off'; if (st.audio) beep(440, .04); }
    function beep(freq, dur) { if (!st.audio) return; const C = window.AudioContext || window.webkitAudioContext; if (!C) return; st.ac = st.ac || new C(); const o = st.ac.createOscillator(), g = st.ac.createGain(); o.type = 'sine'; o.frequency.value = freq; g.gain.value = .0001; o.connect(g); g.connect(st.ac.destination); const t = st.ac.currentTime; g.gain.exponentialRampToValueAtTime(.045, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.start(t); o.stop(t + dur + .02); }
    function tear() { try { st.ac?.close(); } catch {} }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
