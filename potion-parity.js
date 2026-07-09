(() => {
  const APP = {
    name: 'Potion Parity', emoji: '⚗️', category: 'play', version: '1.0.0',
    summary: 'Balance color, heat, clarity, and volatility in a combinatorial potion lab before the cauldron destabilizes.',
    description: 'A local potion-balancing puzzle with recipe contracts, interacting ingredients, heat timing, instability, purify and vent recovery actions, adaptive apprenticeships, a session-only eclipse recipe unlock, scoring, touch and keyboard controls, reduced-motion behavior, optional local audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const ingredients = [
    { id: 'moss', name: 'Moss milk', icon: '🌿', delta: { hue: -2, heat: -1, clarity: 2, volatile: 0 }, note: 'cools and clarifies' },
    { id: 'ember', name: 'Ember salt', icon: '🔥', delta: { hue: 2, heat: 3, clarity: -1, volatile: 2 }, note: 'heats fast' },
    { id: 'moon', name: 'Moon rind', icon: '🌙', delta: { hue: -1, heat: 0, clarity: 3, volatile: 1 }, note: 'polishes cloudy brews' },
    { id: 'thunder', name: 'Thunder seed', icon: '⚡', delta: { hue: 3, heat: 1, clarity: -2, volatile: 3 }, note: 'powerful but jumpy' },
    { id: 'ash', name: 'Ash pearl', icon: '🪨', delta: { hue: 0, heat: -2, clarity: 1, volatile: -2 }, note: 'settles unstable foam' },
    { id: 'berry', name: 'Star berry', icon: '🫐', delta: { hue: 1, heat: 0, clarity: -1, volatile: -1 }, note: 'softens sharp edges' }
  ];
  const contracts = {
    novice: [
      { name: 'Dawn tonic', hue: 3, heat: 4, clarity: 7, volatile: 3 },
      { name: 'Quiet lantern', hue: -2, heat: 2, clarity: 8, volatile: 2 },
      { name: 'Courier fizz', hue: 4, heat: 5, clarity: 5, volatile: 6 }
    ],
    rush: [
      { name: 'Storm apology', hue: 5, heat: 6, clarity: 4, volatile: 7 },
      { name: 'Frost compass', hue: -4, heat: 1, clarity: 9, volatile: 2 },
      { name: 'Mayor invisibility', hue: 1, heat: 4, clarity: 10, volatile: 5 }
    ],
    eclipse: [
      { name: 'Eclipse cordial', hue: 0, heat: 7, clarity: 11, volatile: 8 },
      { name: 'Glass dragon tea', hue: 6, heat: 8, clarity: 8, volatile: 9 },
      { name: 'Reverse midnight', hue: -6, heat: 3, clarity: 12, volatile: 5 }
    ]
  };
  const modes = { novice: { name: 'Apprentice', turns: 8, budget: 14, target: 760 }, rush: { name: 'Market rush', turns: 7, budget: 12, target: 980 }, eclipse: { name: 'Eclipse service', turns: 6, budget: 11, target: 1220 } };

  function ensureStyles() {
    if ($('#potion-parity-styles')) return;
    const style = document.createElement('style');
    style.id = 'potion-parity-styles';
    style.textContent = `.ptp-card{animation:ptp-rise .24s ease both}.ptp-game{max-width:1120px;gap:14px}.ptp-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.ptp-stat,.ptp-lab,.ptp-panel,.ptp-contract,.ptp-ing{border:1px solid var(--line);border-radius:18px;background:#fff}.ptp-stat{padding:10px 12px}.ptp-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.ptp-stat strong{display:block;margin-top:4px}.ptp-layout{display:grid;grid-template-columns:.95fr 1.05fr;gap:12px}.ptp-lab{position:relative;min-height:430px;padding:18px;overflow:hidden;background:radial-gradient(circle at 50% 42%,#fef3c7,#ecfeff 44%,#312e81 100%)}.ptp-cauldron{position:absolute;left:50%;top:48%;width:min(58vw,360px);height:min(58vw,360px);transform:translate(-50%,-50%);border-radius:50%;border:14px solid #111827;background:radial-gradient(circle at 35% 30%,var(--brew,#a7f3d0),#155e75 62%,#111827 100%);box-shadow:0 18px 40px rgba(15,23,42,.32),inset 0 0 38px rgba(255,255,255,.32);display:grid;place-items:center;color:#fff;text-align:center}.ptp-cauldron strong{font-size:clamp(1.4rem,5vw,3rem);letter-spacing:-.05em}.ptp-bubble{position:absolute;border-radius:999px;background:rgba(255,255,255,.6);animation:ptp-float 2.4s ease-in-out infinite}.ptp-panel{padding:14px;display:grid;gap:12px}.ptp-contract{padding:12px;background:#f8fafc}.ptp-contract h3{margin:.1rem 0 .4rem;font-size:1.08rem}.ptp-bars{display:grid;gap:7px}.ptp-bar{display:grid;grid-template-columns:74px 1fr 42px;gap:8px;align-items:center;font-size:.82rem;font-weight:900}.ptp-track{height:12px;border-radius:999px;background:#e5e7eb;overflow:hidden}.ptp-fill{height:100%;width:50%;border-radius:999px;background:#0f766e}.ptp-stock{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ptp-ing{min-height:76px;padding:9px;cursor:pointer;font-weight:900;text-align:left}.ptp-ing small{display:block;color:var(--muted);font-weight:800}.ptp-ing:focus-visible,.ptp-actions button:focus-visible,.ptp-mode button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.ptp-ing.is-hot{box-shadow:0 0 0 3px #fed7aa inset}.ptp-mode,.ptp-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ptp-mode button{border:1px solid var(--line);border-radius:14px;background:#fff;font-weight:900;min-height:44px}.ptp-mode button.is-active{box-shadow:0 0 0 3px #bae6fd inset}.ptp-actions button{min-height:44px}.ptp-log{min-height:108px;padding:17px 19px}.ptp-pop{animation:ptp-pop .25s ease both}.ptp-wobble{animation:ptp-wobble .5s ease both}@media(max-width:860px){.ptp-hud{grid-template-columns:repeat(2,1fr)}.ptp-layout{grid-template-columns:1fr}.ptp-lab{min-height:330px}}@media(max-width:520px){.ptp-stock{grid-template-columns:1fr 1fr}.ptp-mode,.ptp-actions{grid-template-columns:1fr 1fr}.ptp-stat{padding:9px}.ptp-lab,.ptp-panel{padding:9px}.ptp-cauldron{width:250px;height:250px}.ptp-bar{grid-template-columns:64px 1fr 34px}}@media(prefers-reduced-motion:reduce){.ptp-card,.ptp-pop,.ptp-wobble,.ptp-bubble{animation:none;transition:none}}@keyframes ptp-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes ptp-pop{0%{transform:scale(.97)}70%{transform:scale(1.03)}100%{transform:none}}@keyframes ptp-wobble{0%,100%{transform:translate(-50%,-50%)}35%{transform:translate(-52%,-50%) rotate(-2deg)}70%{transform:translate(-48%,-50%) rotate(2deg)}}@keyframes ptp-float{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-20px);opacity:1}}`;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-potion-parity-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true), card = $('.app-card', node);
    card.dataset.category = APP.category; card.dataset.potionParityCard = 'true'; card.classList.add('ptp-card');
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
    const retry = () => { addCard(); if (!$('[data-potion-parity-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.potionParityRefresh) return;
      button.dataset.potionParityRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Potion%20Parity';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel ptp-game';
    root.innerHTML = `<div class="ptp-hud"><div class="ptp-stat"><span>Mode</span><strong id="ptp-mode-name">Apprentice</strong></div><div class="ptp-stat"><span>Turns</span><strong id="ptp-turns">8</strong></div><div class="ptp-stat"><span>Budget</span><strong id="ptp-budget">14</strong></div><div class="ptp-stat"><span>Stability</span><strong id="ptp-stability">100%</strong></div><div class="ptp-stat"><span>Contracts</span><strong id="ptp-done">0</strong></div><div class="ptp-stat"><span>Score</span><strong id="ptp-score">0</strong></div></div><div class="ptp-layout"><div class="ptp-lab" aria-label="Animated cauldron"><div class="ptp-cauldron"><strong>Ready</strong><small>Mix toward the contract</small></div></div><div class="ptp-panel"><div class="ptp-contract"></div><div class="ptp-mode" aria-label="Potion modes"></div><div class="ptp-bars" aria-label="Potion property levels"></div><div class="ptp-stock" aria-label="Ingredient shelf"></div><div class="ptp-actions"><button class="button" type="button" data-act="serve">Serve</button><button class="button button-secondary" type="button" data-act="purify">Purify</button><button class="button button-secondary" type="button" data-act="vent">Vent</button><button class="button button-secondary" type="button" data-act="stir">Stir</button><button class="button button-secondary" type="button" data-act="reset">New batch</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card ptp-log" aria-live="polite"></div>`;
    stage.append(root);
    const st = { mode: 'novice', turn: 8, budget: 14, score: 0, done: 0, recipe: 0, hue: 0, heat: 0, clarity: 5, volatile: 0, stability: 100, sound: false, ac: null, unlocked: false, low: matchMedia('(prefers-reduced-motion: reduce)').matches };
    const lab = $('.ptp-lab', root), cauldron = $('.ptp-cauldron', root), contract = $('.ptp-contract', root), modeBox = $('.ptp-mode', root), bars = $('.ptp-bars', root), stock = $('.ptp-stock', root), log = $('.ptp-log', root);
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });
    function mode() { return modes[st.mode]; }
    function target() { return contracts[st.mode][st.recipe % contracts[st.mode].length]; }
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
    function distance() { const t = target(); return Math.abs(st.hue - t.hue) + Math.abs(st.heat - t.heat) + Math.abs(st.clarity - t.clarity) + Math.abs(st.volatile - t.volatile); }
    function tone(kind) {
      if (!st.sound && kind !== 'bad') return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume();
      const osc = st.ac.createOscillator(), gain = st.ac.createGain();
      osc.type = kind === 'bad' ? 'sawtooth' : 'triangle'; osc.frequency.value = kind === 'good' ? 740 : kind === 'serve' ? 520 : 180;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.04, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .18);
      osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .2);
    }
    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: 1-6 add ingredients, Enter serve, P purify, V vent, S stir.</small>`; }
    function newBatch(next) {
      const keys = Object.keys(modes); st.mode = next || keys[(keys.indexOf(st.mode) + 1) % (st.unlocked ? 3 : 2)];
      const m = mode(); st.turn = m.turns; st.budget = m.budget; st.recipe = 0; st.hue = 0; st.heat = 0; st.clarity = 5; st.volatile = 0; st.stability = 100;
      render(); note(`${m.name} batch opened. Tune the brew to the current contract, then serve before turns or stability run out.`);
    }
    function add(ing) {
      if (st.turn <= 0 || st.stability <= 0) return note('This cauldron is spent. Start a new batch to try again.');
      if (st.budget <= 0) return note('The ingredient budget is empty. Serve, purify, or restart.');
      st.hue = clamp(st.hue + ing.delta.hue, -9, 9); st.heat = clamp(st.heat + ing.delta.heat, 0, 12); st.clarity = clamp(st.clarity + ing.delta.clarity, 0, 12); st.volatile = clamp(st.volatile + ing.delta.volatile, 0, 12);
      st.turn -= 1; st.budget -= 1;
      const strain = Math.max(0, st.heat + st.volatile - st.clarity - 6) + Math.max(0, Math.abs(st.hue) - 6);
      st.stability = clamp(st.stability - 4 - strain, 0, 100);
      if (ing.id === 'thunder' && st.heat > 7) st.stability = clamp(st.stability - 12, 0, 100);
      if (ing.id === 'moss' && st.volatile < 3) st.clarity = clamp(st.clarity + 1, 0, 12);
      tone('mix'); pulse(); render(); note(`${ing.name} added. ${ing.note}. Contract distance is now ${distance()}.`);
      if (st.stability <= 0) { tone('bad'); note('The cauldron boiled over. You keep the notes, but this batch cannot be served.'); }
    }
    function serve() {
      if (st.stability <= 0) return note('The batch collapsed. Start again and use vent or purify earlier.');
      const gap = distance(), quality = Math.max(0, 100 - gap * 10), bonus = Math.max(0, st.turn * 12 + st.budget * 8 + st.stability);
      if (gap <= 4) { st.done += 1; st.score += quality * 4 + bonus; tone('serve'); st.recipe += 1; if (st.done >= 3 && !st.unlocked) { st.unlocked = true; note('Three contracts passed. Eclipse service is unlocked for this session.'); } else note(`${target().name} accepted at ${quality}% parity. Next contract is ready.`); st.hue = 0; st.heat = 0; st.clarity = 5; st.volatile = 0; st.turn = Math.max(2, mode().turns - st.done); st.budget = Math.max(4, mode().budget - st.done); st.stability = 100; }
      else { st.score = Math.max(0, st.score - 90); st.stability = clamp(st.stability - 15, 0, 100); tone('bad'); note(`Rejected. Distance ${gap} is too high. Recover with purify, vent, or another ingredient.`); }
      render();
    }
    function purify() { if (st.budget < 2) return note('Purify needs two budget.'); st.budget -= 2; st.turn -= 1; st.clarity = clamp(st.clarity + 3, 0, 12); st.volatile = clamp(st.volatile - 2, 0, 12); st.stability = clamp(st.stability + 10, 0, 100); tone('good'); pulse(); render(); note('Purified the brew. Clarity rose, volatility fell, and the batch recovered some stability.'); }
    function vent() { st.turn -= 1; st.heat = clamp(st.heat - 3, 0, 12); st.volatile = clamp(st.volatile - 3, 0, 12); st.stability = clamp(st.stability + 16, 0, 100); tone('good'); pulse(); render(); note('Vented the cauldron. It is safer, but the clock moved forward.'); }
    function stir() { st.turn -= 1; st.hue = st.hue > 0 ? st.hue - 1 : st.hue < 0 ? st.hue + 1 : st.hue; st.clarity = clamp(st.clarity + 1, 0, 12); st.stability = clamp(st.stability - 3, 0, 100); tone('mix'); pulse(); render(); note('A careful stir moved the hue toward neutral and lifted clarity slightly.'); }
    function pulse() { if (st.low) return; cauldron.classList.remove('ptp-wobble'); void cauldron.offsetWidth; cauldron.classList.add('ptp-wobble'); }
    function color() { const h = 170 + st.hue * 12, light = 54 + st.clarity * 2 - st.volatile; return `hsl(${h} 72% ${clamp(light, 34, 72)}%)`; }
    function render() {
      $('#ptp-mode-name', root).textContent = mode().name; $('#ptp-turns', root).textContent = st.turn; $('#ptp-budget', root).textContent = st.budget; $('#ptp-stability', root).textContent = `${st.stability}%`; $('#ptp-done', root).textContent = st.done; $('#ptp-score', root).textContent = Math.round(st.score);
      const t = target(); contract.innerHTML = `<h3>${t.name}</h3><p>Target parity: hue ${t.hue}, heat ${t.heat}, clarity ${t.clarity}, volatility ${t.volatile}. Current distance: <strong>${distance()}</strong>.</p>`;
      const stats = [['Hue', st.hue, -9, 9, t.hue], ['Heat', st.heat, 0, 12, t.heat], ['Clarity', st.clarity, 0, 12, t.clarity], ['Volatile', st.volatile, 0, 12, t.volatile]];
      bars.innerHTML = stats.map(([name, val, min, max, goal]) => { const pct = ((val - min) / (max - min)) * 100; return `<div class="ptp-bar"><span>${name}</span><div class="ptp-track"><div class="ptp-fill" style="width:${pct}%"></div></div><span>${val}/${goal}</span></div>`; }).join('');
      stock.innerHTML = ''; ingredients.forEach((ing, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = `ptp-ing${ing.delta.heat > 1 ? ' is-hot' : ''}`; b.innerHTML = `<span>${ing.icon} ${i + 1}. ${ing.name}</span><small>${ing.note}</small>`; b.addEventListener('click', () => add(ing)); stock.append(b); });
      modeBox.innerHTML = ''; Object.entries(modes).forEach(([key, item], index) => { if (key === 'eclipse' && !st.unlocked) return; const b = document.createElement('button'); b.type = 'button'; b.textContent = item.name; b.className = key === st.mode ? 'is-active' : ''; b.addEventListener('click', () => newBatch(key)); modeBox.append(b); });
      cauldron.style.setProperty('--brew', color()); cauldron.innerHTML = `<strong>${distance() <= 4 ? 'Serve' : distance() <= 8 ? 'Close' : 'Tune'}</strong><small>${t.name}</small>`;
      lab.querySelectorAll('.ptp-bubble').forEach((b) => b.remove()); const count = st.low ? 0 : clamp(Math.floor((st.heat + st.volatile) / 3), 1, 7); for (let i = 0; i < count; i += 1) { const bubble = document.createElement('span'); bubble.className = 'ptp-bubble'; bubble.style.cssText = `left:${22 + i * 10}%;top:${64 - (i % 3) * 8}%;width:${10 + i * 3}px;height:${10 + i * 3}px;animation-delay:${i * .18}s`; lab.append(bubble); }
    }
    $('.ptp-actions', root).addEventListener('click', (e) => { const act = e.target.closest('button')?.dataset.act; if (!act) return; if (act === 'serve') serve(); if (act === 'purify') purify(); if (act === 'vent') vent(); if (act === 'stir') stir(); if (act === 'reset') newBatch(st.mode); if (act === 'sound') { st.sound = !st.sound; e.target.textContent = st.sound ? 'Sound on' : 'Sound off'; e.target.setAttribute('aria-pressed', String(st.sound)); tone('good'); } });
    root.addEventListener('keydown', (e) => { const n = Number(e.key); if (n >= 1 && n <= 6) { e.preventDefault(); add(ingredients[n - 1]); } if (e.key === 'Enter') { e.preventDefault(); serve(); } if (e.key.toLowerCase() === 'p') purify(); if (e.key.toLowerCase() === 'v') vent(); if (e.key.toLowerCase() === 's') stir(); });
    root.tabIndex = -1; newBatch('novice'); root.focus({ preventScroll: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
