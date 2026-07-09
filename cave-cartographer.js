(() => {
  const APP = {
    name: 'Cave Cartographer', emoji: '🕳️', category: 'play', version: '1.0.0',
    summary: 'Map a dark cave by managing rope, lantern fuel, oxygen, chalk marks, samples, and the choice to leave in time.',
    description: 'A local fog-of-war exploration game with cave mapping, limited rope and lantern resources, oxygen pressure, chalk safety marks, scan pulses, cave-in risk, sample collection, session-only crystal-depth unlock, scoring, responsive DOM rendering, touch and keyboard controls, reduced-motion behavior, optional local audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const modes = {
    survey: { name: 'Survey route', size: 6, rope: 18, fuel: 14, oxygen: 26, chalk: 5, risk: 8, target: 620 },
    sinkhole: { name: 'Sinkhole run', size: 6, rope: 16, fuel: 12, oxygen: 23, chalk: 4, risk: 13, target: 820 },
    crystal: { name: 'Crystal depth', size: 6, rope: 15, fuel: 11, oxygen: 22, chalk: 3, risk: 18, target: 1040 }
  };
  const specimens = ['amber fern', 'echo shell', 'salt bloom', 'blind beetle', 'blue calcite', 'old survey tag'];

  function ensureStyles() {
    if ($('#cave-cartographer-styles')) return;
    const style = document.createElement('style');
    style.id = 'cave-cartographer-styles';
    style.textContent = `.cvc-card{animation:cvc-rise .24s ease both}.cvc-game{max-width:1120px;gap:14px}.cvc-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.cvc-stat,.cvc-map,.cvc-panel,.cvc-cell{border:1px solid var(--line);border-radius:18px;background:#fff}.cvc-stat{padding:10px 12px}.cvc-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.cvc-stat strong{display:block;margin-top:4px}.cvc-layout{display:grid;grid-template-columns:1.05fr .95fr;gap:12px}.cvc-map{padding:14px;background:radial-gradient(circle at 22% 18%,#fef3c7,#292524 56%,#111827);overflow:hidden}.cvc-grid{display:grid;grid-template-columns:repeat(6,minmax(42px,1fr));gap:7px}.cvc-cell{min-height:62px;position:relative;display:grid;place-items:center;text-align:center;font-weight:900;color:#f8fafc;background:#1f2937;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}.cvc-cell button{position:absolute;inset:0;border:0;background:transparent;border-radius:18px;cursor:pointer}.cvc-cell button:focus-visible,.cvc-actions button:focus-visible,.cvc-mode button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.cvc-cell.is-hidden{background:#050505;color:#64748b}.cvc-cell.is-seen{background:#334155}.cvc-cell.is-lit{background:#78350f;color:#fff7ed;box-shadow:0 0 0 3px #fde68a inset}.cvc-cell.is-exit{background:#14532d}.cvc-cell.is-camp{background:#0f766e}.cvc-cell.is-hazard{background:#7f1d1d}.cvc-cell.is-sample{background:#4c1d95}.cvc-cell.is-chalk::after{content:'✓';position:absolute;right:6px;top:4px;color:#fef3c7}.cvc-cell small{display:block;font-size:.58rem;color:rgba(255,255,255,.78);font-weight:800}.cvc-panel{padding:14px;display:grid;gap:12px}.cvc-brief,.cvc-chip{border:1px solid var(--line);border-radius:16px;background:#f8fafc;padding:12px}.cvc-brief h3{margin:.1rem 0 .35rem;font-size:1.08rem}.cvc-mode{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.cvc-mode button{border:1px solid var(--line);border-radius:14px;background:#fff;font-weight:900;min-height:44px}.cvc-mode button.is-active{box-shadow:0 0 0 3px #fed7aa inset}.cvc-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.cvc-actions button{min-height:44px}.cvc-list{display:grid;gap:7px}.cvc-log{min-height:112px;padding:17px 19px}.cvc-pop{animation:cvc-pop .28s ease both}.cvc-pulse{animation:cvc-pulse .7s ease both}@media(max-width:860px){.cvc-hud{grid-template-columns:repeat(2,1fr)}.cvc-layout{grid-template-columns:1fr}}@media(max-width:520px){.cvc-map,.cvc-panel{padding:9px}.cvc-grid{gap:5px}.cvc-cell{min-height:48px;font-size:.78rem}.cvc-cell small{display:none}.cvc-actions,.cvc-mode{grid-template-columns:1fr 1fr}.cvc-hud{gap:6px}.cvc-stat{padding:9px}}@media(prefers-reduced-motion:reduce){.cvc-card,.cvc-pop,.cvc-pulse{animation:none;transition:none}}@keyframes cvc-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes cvc-pop{0%{transform:scale(.96)}70%{transform:scale(1.03)}100%{transform:none}}@keyframes cvc-pulse{0%{filter:brightness(1)}50%{filter:brightness(1.45)}100%{filter:brightness(1)}}`;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-cave-cartographer-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.caveCartographerCard = 'true';
    card.classList.add('cvc-card');
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
    const retry = () => { addCard(); if (!$('[data-cave-cartographer-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.caveCartographerRefresh) return;
      button.dataset.caveCartographerRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Cave%20Cartographer';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel cvc-game';
    root.innerHTML = `<div class="cvc-hud"><div class="cvc-stat"><span>Mode</span><strong id="cvc-mode">Survey route</strong></div><div class="cvc-stat"><span>Oxygen</span><strong id="cvc-oxygen">26</strong></div><div class="cvc-stat"><span>Rope</span><strong id="cvc-rope">18</strong></div><div class="cvc-stat"><span>Lantern</span><strong id="cvc-fuel">14</strong></div><div class="cvc-stat"><span>Samples</span><strong id="cvc-samples">0</strong></div><div class="cvc-stat"><span>Score</span><strong id="cvc-score">0</strong></div></div><div class="cvc-layout"><div class="cvc-map"><div class="cvc-grid" role="grid" aria-label="Cave map"></div></div><div class="cvc-panel"><div class="cvc-brief"></div><div class="cvc-mode" aria-label="Cave modes"></div><div class="cvc-list" aria-label="Survey status"></div><div class="cvc-actions"><button class="button" type="button" data-act="move">Move</button><button class="button button-secondary" type="button" data-act="mark">Chalk mark</button><button class="button button-secondary" type="button" data-act="scan">Scan</button><button class="button button-secondary" type="button" data-act="rest">Breathe</button><button class="button button-secondary" type="button" data-act="extract">Extract</button><button class="button button-secondary" type="button" data-act="reset">New cave</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card cvc-log" aria-live="polite"></div>`;
    stage.append(root);
    const st = { mode: 'survey', pos: 30, selected: 30, oxygen: 26, rope: 18, fuel: 14, chalk: 5, risk: 8, score: 0, found: new Set(), seen: new Set([30, 31, 24]), chalked: new Set([30]), samples: new Set(), collapsed: new Set(), escaped: false, unlocked: false, sound: false, ac: null, low: matchMedia('(prefers-reduced-motion: reduce)').matches };
    const grid = $('.cvc-grid', root), brief = $('.cvc-brief', root), modeBox = $('.cvc-mode', root), status = $('.cvc-list', root), log = $('.cvc-log', root);
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });
    const sampleCells = [4, 9, 15, 20, 28, 34];
    const hazards = new Set([7, 11, 16, 22, 26, 32]);
    const exits = new Set([5, 35]);
    const camp = 30;
    function mode() { return modes[st.mode]; }
    function xy(cell) { return { r: Math.floor(cell / 6), c: cell % 6 }; }
    function dist(a, b) { const A = xy(a), B = xy(b); return Math.abs(A.r - B.r) + Math.abs(A.c - B.c); }
    function adjacent(a, b) { return dist(a, b) === 1; }
    function tone(kind) {
      if (!st.sound && kind !== 'bad') return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume();
      const osc = st.ac.createOscillator(), gain = st.ac.createGain();
      osc.type = kind === 'bad' ? 'sawtooth' : 'sine'; osc.frequency.value = kind === 'good' ? 760 : kind === 'scan' ? 520 : 170;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.045, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .18);
      osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .2);
    }
    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: arrows select, Enter move, C chalk, S scan, B breathe, E extract.</small>`; }
    function start(next) {
      const keys = Object.keys(modes);
      st.mode = next || keys[(keys.indexOf(st.mode) + 1) % (st.unlocked ? 3 : 2)];
      const m = mode();
      st.pos = camp; st.selected = camp; st.oxygen = m.oxygen; st.rope = m.rope; st.fuel = m.fuel; st.chalk = m.chalk; st.risk = m.risk; st.score = 0; st.samples = new Set(); st.collapsed = new Set(); st.escaped = false; st.seen = new Set([30, 31, 24]); st.chalked = new Set([30]);
      render(); note(`${m.name} started. Find samples, map safe passages, and leave before the cave closes behind you.`);
    }
    function select(cell) { st.selected = Math.max(0, Math.min(35, cell)); render(); }
    function reveal(center, radius = 1) { for (let i = 0; i < 36; i += 1) if (dist(center, i) <= radius) st.seen.add(i); }
    function riskRoll(cell) { return Math.abs(Math.sin((cell + 1) * 9.13 + st.oxygen * 2.7 + st.risk)) % 1; }
    function spend(cost, message) {
      st.oxygen -= cost.oxygen || 0; st.rope -= cost.rope || 0; st.fuel -= cost.fuel || 0;
      if (st.oxygen <= 0) { st.oxygen = 0; st.score = Math.max(0, st.score - 120); st.escaped = true; tone('bad'); note('Oxygen ran out. The survey team retreats with an incomplete map.'); }
      else note(message);
    }
    function move() {
      if (st.escaped) return note('This survey is complete. Start a new cave to replay.');
      if (st.selected === st.pos) return note('Select an adjacent visible chamber before moving.');
      if (!adjacent(st.pos, st.selected)) return note('You can only move one chamber at a time. Use scans to plan the route.');
      if (!st.seen.has(st.selected)) return note('That chamber is still unknown. Scan before stepping into darkness.');
      if (st.collapsed.has(st.selected)) return note('A collapse blocks that passage. Find a marked route around it.');
      const wasNew = !st.found.has(st.selected);
      st.pos = st.selected; st.found.add(st.pos); reveal(st.pos, st.fuel > 0 ? 1 : 0);
      let msg = wasNew ? 'New chamber mapped.' : 'You return through known stone.';
      let oxygenCost = hazards.has(st.pos) ? 3 : 1;
      let ropeCost = st.chalked.has(st.pos) ? 0 : 1;
      if (hazards.has(st.pos) && riskRoll(st.pos) < st.risk / 100) { st.collapsed.add(st.pos); st.score = Math.max(0, st.score - 35); msg = 'Loose shale collapses behind you. The chamber is risky now.'; tone('bad'); }
      if (sampleCells.includes(st.pos) && !st.samples.has(st.pos)) { st.samples.add(st.pos); st.score += 90; msg = `Sample logged: ${specimens[st.samples.size - 1]}.`; tone('good'); }
      if (exits.has(st.pos)) msg = 'You found an exit seam. Extract now for a clean survey bonus or push deeper.';
      st.score += wasNew ? 30 : 5;
      spend({ oxygen: oxygenCost, rope: ropeCost, fuel: 1 }, msg);
      render();
    }
    function mark() {
      if (st.escaped) return;
      if (st.chalked.has(st.pos)) return note('This chamber already has a chalk mark.');
      if (st.chalk < 1) return note('No chalk left. Follow existing marks or extract.');
      st.chalk -= 1; st.chalked.add(st.pos); st.score += 24; tone('scan'); spend({ oxygen: 1 }, 'Chalk mark set. Future travel through this chamber saves rope.'); render();
    }
    function scan() {
      if (st.escaped) return;
      if (st.fuel < 2) return note('The lantern is too low for a full scan. Move carefully or extract.');
      reveal(st.selected, 2); st.score += 18; tone('scan'); spend({ oxygen: 1, fuel: 2 }, 'Lantern pulse reveals nearby chambers and hazards.'); render(true);
    }
    function rest() {
      if (st.escaped) return;
      if (!st.chalked.has(st.pos) && st.pos !== camp) return note('You can only breathe safely at camp or a chalk-marked chamber.');
      st.oxygen += st.mode === 'crystal' ? 2 : 3; st.risk += 3; st.score = Math.max(0, st.score - 10); tone('scan'); note('You slow down and recover oxygen, but the cave settles and collapse risk rises.'); render();
    }
    function extract() {
      if (st.escaped) return note('This survey is already closed.');
      if (st.pos !== camp && !exits.has(st.pos)) return note('Extract from base camp or a discovered exit seam.');
      st.escaped = true;
      const mapped = st.seen.size * 8, sample = st.samples.size * 110, safety = Math.max(0, st.oxygen * 3 + st.rope * 2 + st.fuel * 2 - st.collapsed.size * 28);
      st.score += mapped + sample + safety;
      if (st.score >= mode().target && !st.unlocked) { st.unlocked = true; note('Clean survey filed. Crystal depth is now unlocked for this session.'); } else note(`Survey complete: ${st.samples.size} samples, ${st.seen.size} mapped chambers, ${st.collapsed.size} collapses.`);
      tone('good'); render();
    }
    function render(pulse = false) {
      $('#cvc-mode', root).textContent = mode().name; $('#cvc-oxygen', root).textContent = st.oxygen; $('#cvc-rope', root).textContent = st.rope; $('#cvc-fuel', root).textContent = st.fuel; $('#cvc-samples', root).textContent = `${st.samples.size} / ${sampleCells.length}`; $('#cvc-score', root).textContent = st.score;
      brief.innerHTML = `<h3>${mode().name}</h3><p>Map chambers, collect specimens, and decide when the route is valuable enough to exit. Chalk saves rope, scanning costs lantern fuel, and resting raises cave-in risk.</p>`;
      modeBox.innerHTML = Object.entries(modes).map(([key, value]) => `<button type="button" data-mode="${key}" class="${key === st.mode ? 'is-active' : ''}" ${key === 'crystal' && !st.unlocked ? 'disabled' : ''}>${value.name}</button>`).join('');
      status.innerHTML = [`Chalk: ${st.chalk}`, `Seen chambers: ${st.seen.size} / 36`, `Collapse risk: ${st.risk}%`, `Current chamber: ${st.pos === camp ? 'base camp' : exits.has(st.pos) ? 'exit seam' : hazards.has(st.pos) ? 'unstable shelf' : 'passage'}`].map(x => `<div class="cvc-chip">${x}</div>`).join('');
      grid.replaceChildren();
      for (let i = 0; i < 36; i += 1) {
        const cell = document.createElement('div'); cell.className = 'cvc-cell'; cell.setAttribute('role', 'gridcell');
        const seen = st.seen.has(i); cell.classList.toggle('is-hidden', !seen); cell.classList.toggle('is-seen', seen); cell.classList.toggle('is-lit', i === st.pos || i === st.selected); cell.classList.toggle('is-camp', i === camp); cell.classList.toggle('is-exit', seen && exits.has(i)); cell.classList.toggle('is-hazard', seen && hazards.has(i)); cell.classList.toggle('is-sample', seen && sampleCells.includes(i) && !st.samples.has(i)); cell.classList.toggle('is-chalk', st.chalked.has(i)); if (pulse && seen) cell.classList.add('cvc-pulse');
        const icon = !seen ? '·' : i === st.pos ? '🧭' : i === camp ? '⛺' : exits.has(i) ? '⇥' : st.collapsed.has(i) ? '⚠' : sampleCells.includes(i) && !st.samples.has(i) ? '◆' : hazards.has(i) ? '△' : '•';
        cell.innerHTML = `<span>${icon}<small>${seen ? (st.chalked.has(i) ? 'marked' : 'mapped') : 'unknown'}</small></span>`;
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `Select chamber ${i + 1}${seen ? '' : ', unknown'}`); b.addEventListener('click', () => select(i)); cell.append(b); grid.append(cell);
      }
      $$('.cvc-mode button', root).forEach(button => button.addEventListener('click', () => start(button.dataset.mode)));
    }
    root.addEventListener('click', (event) => {
      const act = event.target.closest('button')?.dataset.act; if (!act) return;
      if (act === 'move') move(); if (act === 'mark') mark(); if (act === 'scan') scan(); if (act === 'rest') rest(); if (act === 'extract') extract(); if (act === 'reset') start(st.mode); if (act === 'sound') { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); tone('good'); }
    });
    root.tabIndex = 0;
    root.addEventListener('keydown', (event) => {
      const { r, c } = xy(st.selected); let next = st.selected;
      if (event.key === 'ArrowUp') next = Math.max(0, st.selected - 6);
      if (event.key === 'ArrowDown') next = Math.min(35, st.selected + 6);
      if (event.key === 'ArrowLeft') next = c > 0 ? st.selected - 1 : st.selected;
      if (event.key === 'ArrowRight') next = c < 5 ? st.selected + 1 : st.selected;
      if (next !== st.selected) { event.preventDefault(); select(next); }
      if (event.key === 'Enter') { event.preventDefault(); move(); }
      if (event.key.toLowerCase() === 'c') mark();
      if (event.key.toLowerCase() === 's') scan();
      if (event.key.toLowerCase() === 'b') rest();
      if (event.key.toLowerCase() === 'e') extract();
      void r;
    });
    start('survey');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
