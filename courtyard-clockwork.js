(() => {
  const APP = {
    name: 'Courtyard Clockwork', emoji: '🕰️', category: 'play', version: '1.0.0',
    summary: 'Tune a clockwork garden by routing gears, timing gates, winding springs, and recovering stalled birds.',
    description: 'A local timing-and-spatial puzzle game with gear placement, wind budget, jam risk, songbirds to awaken, timed gates, session-only moon mode, scoring, responsive SVG board, touch and keyboard controls, reduced-motion behavior, optional audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const modes = {
    noon: { name: 'Noon garden', turns: 12, wind: 18, oil: 3, jam: 10, target: 520 },
    dusk: { name: 'Dusk chimes', turns: 14, wind: 16, oil: 2, jam: 16, target: 760 },
    moon: { name: 'Moon mechanism', turns: 16, wind: 15, oil: 2, jam: 22, target: 960 }
  };
  const birds = ['Wren', 'Finch', 'Lark', 'Thrush', 'Starling', 'Robin'];

  function ensureStyles() {
    if ($('#courtyard-clockwork-styles')) return;
    const style = document.createElement('style');
    style.id = 'courtyard-clockwork-styles';
    style.textContent = `.ccw-card{animation:ccw-rise .24s ease both}.ccw-game{max-width:1120px;gap:14px}.ccw-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.ccw-stat,.ccw-board,.ccw-panel,.ccw-cell{border:1px solid var(--line);border-radius:18px;background:#fff}.ccw-stat{padding:10px 12px}.ccw-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.ccw-stat strong{display:block;margin-top:4px}.ccw-layout{display:grid;grid-template-columns:1.08fr .82fr;gap:12px}.ccw-board{padding:14px;background:radial-gradient(circle at 18% 18%,#fef9c3,#dcfce7 42%,#e0f2fe);overflow:hidden}.ccw-svg{width:100%;min-height:330px;display:block}.ccw-grid{display:grid;grid-template-columns:repeat(5,minmax(42px,1fr));gap:8px;margin-top:10px}.ccw-cell{min-height:58px;padding:6px;display:grid;place-items:center;text-align:center;font-weight:900;color:#334155;position:relative;background:#f8fafc}.ccw-cell button{position:absolute;inset:0;border:0;background:transparent;border-radius:18px;cursor:pointer}.ccw-cell button:focus-visible,.ccw-actions button:focus-visible,.ccw-mode button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.ccw-cell.is-power{background:#fef3c7}.ccw-cell.is-target{background:#dcfce7}.ccw-cell.is-selected{box-shadow:0 0 0 4px #bfdbfe inset}.ccw-cell.is-gear{background:#ede9fe}.ccw-cell.is-jam{background:#fee2e2}.ccw-cell small{display:block;font-size:.62rem;color:var(--muted);font-weight:800}.ccw-panel{padding:14px;display:grid;gap:12px}.ccw-brief,.ccw-chip{border:1px solid var(--line);border-radius:16px;background:#f8fafc;padding:12px}.ccw-brief h3{margin:.1rem 0 .35rem;font-size:1.08rem}.ccw-mode{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ccw-mode button{border:1px solid var(--line);border-radius:14px;background:#fff;font-weight:900;min-height:44px}.ccw-mode button.is-active{box-shadow:0 0 0 3px #ddd6fe inset}.ccw-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ccw-actions button{min-height:44px}.ccw-list{display:grid;gap:7px}.ccw-log{min-height:112px;padding:17px 19px}.ccw-pop{animation:ccw-pop .28s ease both}.ccw-spin{animation:ccw-spin .9s linear both}@media(max-width:860px){.ccw-hud{grid-template-columns:repeat(2,1fr)}.ccw-layout{grid-template-columns:1fr}.ccw-svg{min-height:260px}}@media(max-width:520px){.ccw-board,.ccw-panel{padding:9px}.ccw-grid{gap:5px}.ccw-cell{min-height:48px;font-size:.8rem}.ccw-cell small{display:none}.ccw-actions,.ccw-mode{grid-template-columns:1fr 1fr}.ccw-hud{gap:6px}.ccw-stat{padding:9px}}@media(prefers-reduced-motion:reduce){.ccw-card,.ccw-pop,.ccw-spin{animation:none;transition:none}}@keyframes ccw-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes ccw-pop{0%{transform:scale(.96)}70%{transform:scale(1.03)}100%{transform:none}}@keyframes ccw-spin{to{transform:rotate(360deg)}}`;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-courtyard-clockwork-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.courtyardClockworkCard = 'true';
    card.classList.add('ccw-card');
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
    const retry = () => { addCard(); if (!$('[data-courtyard-clockwork-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.courtyardClockworkRefresh) return;
      button.dataset.courtyardClockworkRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Courtyard%20Clockwork';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel ccw-game';
    root.innerHTML = `<div class="ccw-hud"><div class="ccw-stat"><span>Mode</span><strong id="ccw-mode">Noon garden</strong></div><div class="ccw-stat"><span>Turn</span><strong id="ccw-turn">1 / 12</strong></div><div class="ccw-stat"><span>Wind</span><strong id="ccw-wind">18</strong></div><div class="ccw-stat"><span>Oil</span><strong id="ccw-oil">3</strong></div><div class="ccw-stat"><span>Jam risk</span><strong id="ccw-jam">10</strong></div><div class="ccw-stat"><span>Score</span><strong id="ccw-score">0</strong></div></div><div class="ccw-layout"><div class="ccw-board"><svg class="ccw-svg" viewBox="0 0 500 300" role="img" aria-label="Clockwork courtyard power path"><g id="ccw-lines"></g><g id="ccw-gears"></g></svg><div class="ccw-grid" aria-label="Clockwork placement grid"></div></div><div class="ccw-panel"><div class="ccw-brief"></div><div class="ccw-mode" aria-label="Clockwork modes"></div><div class="ccw-list" aria-label="Clockwork status"></div><div class="ccw-actions"><button class="button" type="button" data-act="place">Place gear</button><button class="button button-secondary" type="button" data-act="gate">Time gate</button><button class="button button-secondary" type="button" data-act="oil">Oil jam</button><button class="button button-secondary" type="button" data-act="wind">Wind spring</button><button class="button button-secondary" type="button" data-act="tick">Run tick</button><button class="button button-secondary" type="button" data-act="reset">New garden</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card ccw-log" aria-live="polite"></div>`;
    stage.append(root);
    const st = { mode: 'noon', turn: 1, wind: 18, oil: 3, jam: 10, score: 0, selected: 12, gears: new Set([10]), gates: new Set(), awake: new Set(), jammed: new Set(), unlocked: false, sound: false, ac: null, low: matchMedia('(prefers-reduced-motion: reduce)').matches };
    const grid = $('.ccw-grid', root), lines = $('#ccw-lines', root), gears = $('#ccw-gears', root), brief = $('.ccw-brief', root), modeBox = $('.ccw-mode', root), status = $('.ccw-list', root), log = $('.ccw-log', root);
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });
    const targets = [4, 8, 14, 19, 22, 24];
    function mode() { return modes[st.mode]; }
    function xy(cell) { return { x: 50 + (cell % 5) * 100, y: 40 + Math.floor(cell / 5) * 55 }; }
    function dist(a, b) { return Math.abs(Math.floor(a / 5) - Math.floor(b / 5)) + Math.abs(a % 5 - b % 5); }
    function powered(cell) { return Array.from(st.gears).some((g) => dist(g, cell) <= (st.gates.has(g) ? 2 : 1)); }
    function riskSeed(cell) { return Math.abs(Math.sin(cell * 7.7 + st.turn * 3.9 + st.jam)) % 1; }
    function tone(kind) {
      if (!st.sound && kind !== 'bad') return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume();
      const osc = st.ac.createOscillator(), gain = st.ac.createGain();
      osc.type = 'sine'; osc.frequency.value = kind === 'good' ? 880 : kind === 'tick' ? 520 : 210;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.05, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .18);
      osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .2);
    }
    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: arrows select, G place gear, T time gate, O oil, W wind, Space run tick.</small>`; }
    function start(next) {
      const keys = Object.keys(modes);
      st.mode = next || keys[(keys.indexOf(st.mode) + 1) % (st.unlocked ? 3 : 2)];
      const m = mode();
      st.turn = 1; st.wind = m.wind; st.oil = m.oil; st.jam = m.jam; st.score = 0; st.selected = 12; st.gears = new Set([10]); st.gates = new Set(); st.awake = new Set(); st.jammed = new Set();
      render(); note(`${m.name} started. Route power from the brass spring to awaken birds before the garden runs down.`);
    }
    function select(cell) { st.selected = Math.max(0, Math.min(24, cell)); render(); }
    function place() {
      if (st.wind < 2) return note('Not enough wind to cut and place another gear. Run a tick or wind the spring.');
      if (st.gears.has(st.selected)) return note('That tile already has a gear. Select a useful neighbor or time this gear as a gate.');
      if (!powered(st.selected)) return note('A new gear must touch the powered mechanism. Build from the brass spring outward.');
      st.gears.add(st.selected); st.wind -= 2; st.jam += 2; st.score += 28; tone('good'); advance('Gear placed. The mechanism reaches farther, but jam risk rises.');
    }
    function gate() {
      if (!st.gears.has(st.selected)) return note('Time gates can only be added to placed gears.');
      if (st.wind < 1) return note('Not enough wind to set a timed gate.');
      if (st.gates.has(st.selected)) { st.gates.delete(st.selected); st.wind += 1; return advance('Gate removed. You recover wind but shorten the power radius.'); }
      st.gates.add(st.selected); st.wind -= 1; st.score += 18; tone('tick'); advance('Timed gate set. This gear now carries power two steps on the next ticks.');
    }
    function oil() {
      if (st.oil < 1) return note('No oil left. You can still recover by winding and running careful ticks.');
      if (!st.jammed.size && st.jam < 18) return note('Nothing is jammed yet. Save oil for a real stall.');
      const target = st.jammed.has(st.selected) ? st.selected : Array.from(st.jammed)[0];
      if (target !== undefined) st.jammed.delete(target);
      st.oil -= 1; st.jam = Math.max(4, st.jam - 9); st.score += 22; tone('good'); advance('Oil applied. Jam risk drops and one stalled gear turns again.');
    }
    function wind() {
      st.wind += st.mode === 'moon' ? 3 : 4; st.jam += 4; tone('tick'); advance('Spring wound. You gain wind, but the tighter mechanism is more likely to jam.');
    }
    function tick() { advance('The courtyard ticks forward. Birds wake when a powered gear reaches their perch.'); }
    function advance(message) {
      targets.forEach((cell, i) => { if (powered(cell) && !st.jammed.has(cell)) st.awake.add(i); });
      Array.from(st.gears).forEach((cell) => { if (riskSeed(cell) < st.jam / 110 && !st.gates.has(cell)) st.jammed.add(cell); });
      if (st.jammed.size) st.score = Math.max(0, st.score - st.jammed.size * 8);
      st.score += st.awake.size * 10;
      st.turn += 1; st.wind -= 1; st.jam += st.mode === 'noon' ? 1 : 2;
      const won = st.awake.size >= targets.length;
      const lost = st.turn > mode().turn || st.wind < 0 || st.jam >= 50;
      if (won) { st.score += Math.max(0, st.wind) * 18 + Math.max(0, mode().turn - st.turn) * 24; if (st.mode === 'dusk') st.unlocked = true; note(`All birds are awake. Score ${st.score}. ${st.unlocked ? 'Moon mechanism unlocked for this session.' : 'Try dusk for a sharper timing puzzle.'}`); }
      else if (lost) note(`The mechanism stalls with ${st.awake.size}/${targets.length} birds awake. Score ${st.score}. Rebuild with fewer gears or more timed gates.`);
      else note(message);
      render();
    }
    function render() {
      $('#ccw-mode', root).textContent = mode().name; $('#ccw-turn', root).textContent = `${Math.min(st.turn, mode().turn)} / ${mode().turn}`; $('#ccw-wind', root).textContent = st.wind; $('#ccw-oil', root).textContent = st.oil; $('#ccw-jam', root).textContent = `${st.jam}%`; $('#ccw-score', root).textContent = st.score;
      brief.innerHTML = `<h3>${mode().name}</h3><p>Power begins at the brass spring. Place gears on powered tiles, add timed gates for reach, oil stalls, and wake ${targets.length} birds before the turns or wind run out.</p>`;
      modeBox.replaceChildren(...Object.entries(modes).map(([key, m]) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = key === 'moon' && !st.unlocked ? 'Moon locked' : m.name; b.disabled = key === 'moon' && !st.unlocked; b.className = key === st.mode ? 'is-active' : ''; b.addEventListener('click', () => start(key)); return b;
      }));
      status.innerHTML = `<div class="ccw-chip">Birds awake: ${st.awake.size}/${targets.length} · Gears: ${st.gears.size} · Timed gates: ${st.gates.size}</div><div class="ccw-chip">Jammed gears: ${st.jammed.size || 'none'} · Selected tile: ${st.selected + 1}</div>`;
      grid.replaceChildren(...Array.from({ length: 25 }, (_, cell) => {
        const item = document.createElement('div'); item.className = 'ccw-cell'; if (cell === 10) item.classList.add('is-power'); if (targets.includes(cell)) item.classList.add('is-target'); if (cell === st.selected) item.classList.add('is-selected'); if (st.gears.has(cell)) item.classList.add('is-gear'); if (st.jammed.has(cell)) item.classList.add('is-jam');
        const birdIndex = targets.indexOf(cell);
        item.innerHTML = `<span>${cell === 10 ? 'Spring' : st.gears.has(cell) ? (st.gates.has(cell) ? 'Gate' : 'Gear') : birdIndex >= 0 ? (st.awake.has(birdIndex) ? '♪ ' : '') + birds[birdIndex] : 'Tile'}<small>${powered(cell) ? 'powered' : 'quiet'}</small></span><button type="button" aria-label="Select tile ${cell + 1}"></button>`;
        $('button', item).addEventListener('click', () => select(cell)); return item;
      }));
      lines.replaceChildren(); gears.replaceChildren();
      st.gears.forEach((cell) => {
        const p = xy(cell);
        targets.filter((t) => dist(t, cell) <= (st.gates.has(cell) ? 2 : 1)).forEach((t) => {
          const q = xy(t), line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', p.x); line.setAttribute('y1', p.y); line.setAttribute('x2', q.x); line.setAttribute('y2', q.y); line.setAttribute('stroke', st.jammed.has(cell) ? '#ef4444' : '#7c3aed'); line.setAttribute('stroke-width', '4'); line.setAttribute('stroke-linecap', 'round'); line.setAttribute('opacity', '.52'); lines.append(line);
        });
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); if (!st.low && !st.jammed.has(cell)) g.classList.add('ccw-spin'); g.setAttribute('transform-origin', `${p.x} ${p.y}`);
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', st.gates.has(cell) ? 20 : 15); c.setAttribute('fill', st.jammed.has(cell) ? '#fecaca' : '#ddd6fe'); c.setAttribute('stroke', '#4c1d95'); c.setAttribute('stroke-width', '3'); g.append(c); gears.append(g);
      });
      targets.forEach((cell, i) => { const p = xy(cell), t = document.createElementNS('http://www.w3.org/2000/svg', 'text'); t.setAttribute('x', p.x - 11); t.setAttribute('y', p.y + 7); t.setAttribute('font-size', '24'); t.textContent = st.awake.has(i) ? '♪' : '♩'; gears.append(t); });
    }
    root.addEventListener('click', (event) => { const act = event.target.closest('button')?.dataset.act; if (!act) return; ({ place, gate, oil, wind, tick, reset: () => start(), sound: () => { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); tone('good'); } }[act])?.(); });
    root.addEventListener('keydown', (event) => {
      const r = Math.floor(st.selected / 5), c = st.selected % 5;
      if (event.key === 'ArrowRight' && c < 4) select(st.selected + 1);
      else if (event.key === 'ArrowLeft' && c > 0) select(st.selected - 1);
      else if (event.key === 'ArrowDown' && r < 4) select(st.selected + 5);
      else if (event.key === 'ArrowUp' && r > 0) select(st.selected - 5);
      else if (event.key.toLowerCase() === 'g') place();
      else if (event.key.toLowerCase() === 't') gate();
      else if (event.key.toLowerCase() === 'o') oil();
      else if (event.key.toLowerCase() === 'w') wind();
      else if (event.key === ' ') { event.preventDefault(); tick(); }
    });
    start('noon');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();