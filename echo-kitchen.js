(() => {
  const APP = {
    name: 'Echo Kitchen',
    emoji: '🥁',
    category: 'play',
    version: '1.0.0',
    summary: 'Listen, remember, and serve rhythm recipes before the kitchen loses its groove.',
    description: 'A local audio-memory rhythm game with recipe patterns, touch and keyboard input, adaptive rounds, combo scoring, mistake recovery, session-only improv unlocks, responsive pads, reduced-motion behavior, optional local audio, and clean teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const NOTES = [
    { id: 'pan', name: 'Pan', key: '1', freq: 262 },
    { id: 'knife', name: 'Chop', key: '2', freq: 330 },
    { id: 'steam', name: 'Steam', key: '3', freq: 392 },
    { id: 'bell', name: 'Bell', key: '4', freq: 523 }
  ];

  function style() {
    if ($('#echo-kitchen-styles')) return;
    const s = document.createElement('style');
    s.id = 'echo-kitchen-styles';
    s.textContent = `
      .echo-card{animation:echo-in .24s ease both}.echo-game{max-width:980px;gap:14px}.echo-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.echo-stat{border:1px solid var(--line);border-radius:15px;background:#fff;padding:10px 12px}.echo-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.echo-stat strong{display:block;margin-top:4px}.echo-board{display:grid;grid-template-columns:1fr .75fr;gap:12px}.echo-pads{border:1px solid var(--line);border-radius:28px;padding:16px;background:radial-gradient(circle at 20% 10%,#fff7ed,#f8fafc 52%,#e0f2fe);display:grid;grid-template-columns:repeat(2,1fr);gap:12px;touch-action:manipulation}.echo-pad{min-height:130px;border:2px solid rgba(15,23,42,.12);border-radius:24px;background:#fff;color:var(--ink);font-weight:1000;font-size:clamp(1.1rem,4vw,2rem);box-shadow:0 14px 30px rgba(15,23,42,.08);transition:transform .12s ease,box-shadow .12s ease,border-color .12s ease}.echo-pad small{display:block;margin-top:8px;color:var(--muted);font-size:.72rem;letter-spacing:.08em;text-transform:uppercase}.echo-pad.is-lit,.echo-pad:active{transform:translateY(-5px) scale(1.02);border-color:#f59e0b;box-shadow:0 20px 42px rgba(245,158,11,.25)}.echo-panel{border:1px solid var(--line);border-radius:20px;background:#fff;padding:14px}.echo-panel p{margin:.5rem 0}.echo-recipe{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.echo-dot{width:30px;height:30px;border-radius:999px;background:#e5e7eb;display:grid;place-items:center;font-size:.72rem;font-weight:1000}.echo-dot.is-done{background:#bbf7d0}.echo-dot.is-active{background:#fde68a;transform:scale(1.1)}.echo-tools{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.echo-log{min-height:98px;padding:17px 19px}.echo-meter{height:12px;border-radius:999px;background:#fee2e2;overflow:hidden;margin-top:8px}.echo-meter span{display:block;height:100%;width:100%;background:linear-gradient(90deg,#22c55e,#facc15,#fb7185)}@media(max-width:760px){.echo-hud{grid-template-columns:repeat(2,1fr)}.echo-board{grid-template-columns:1fr}.echo-pad{min-height:104px}}@media(prefers-reduced-motion:reduce){.echo-card,.echo-pad{animation:none;transition:none}.echo-pad.is-lit,.echo-pad:active{transform:none}}@keyframes echo-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
    `;
    document.head.append(s);
  }

  function addCard() {
    const grid = $('#app-grid'), tpl = $('#app-card-template');
    if (!grid || !tpl || $('[data-echo-card]')) return;
    const f = $('.filter.is-active')?.dataset.filter || 'all';
    if (f !== 'all' && f !== APP.category) return;
    style();
    const node = tpl.content.cloneNode(true), card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.echoCard = 'true';
    card.classList.add('echo-card');
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
    const retry = () => { addCard(); if (!$('[data-echo-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((b) => {
      if (b.dataset.echoRefresh) return;
      b.dataset.echoRefresh = '1';
      b.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage'), title = $('#dialog-title'), cat = $('#dialog-category'), desc = $('#dialog-description'), fb = $('#dialog-feedback');
    if (!dialog || !stage) return;
    title.textContent = APP.name;
    cat.textContent = `${label(APP.category)} · ${APP.emoji}`;
    desc.textContent = APP.description;
    fb.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Echo%20Kitchen';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel echo-game';
    root.innerHTML = `<div class="echo-hud"><div class="echo-stat"><span>Round</span><strong id="ek-round">1 / 8</strong></div><div class="echo-stat"><span>Combo</span><strong id="ek-combo">0</strong></div><div class="echo-stat"><span>Focus</span><strong id="ek-focus">3</strong></div><div class="echo-stat"><span>Heat</span><strong id="ek-heat">0</strong></div><div class="echo-stat"><span>Score</span><strong id="ek-score">0</strong></div></div><div class="echo-board"><div class="echo-pads" role="group" aria-label="Kitchen rhythm pads"></div><div class="echo-panel"><strong>Recipe rail</strong><p id="ek-task">Listen to the order, then replay it.</p><div class="echo-recipe" aria-label="Current recipe progress"></div><div class="echo-meter"><span id="ek-meter"></span></div><div class="echo-tools"><button class="button button-secondary" type="button" data-act="play">Hear recipe</button><button class="button button-secondary" type="button" data-act="hint">Prep hint</button><button class="button button-secondary" type="button" data-act="reset">Reset order</button><button class="button button-secondary" type="button" data-act="new">New run</button></div><p><small>Use 1, 2, 3, 4 or tap the pads. Focus reveals the next beat. Too much heat burns the order, but recovery keeps the run alive.</small></p></div></div><div class="result-card echo-log" aria-live="polite"></div><div class="tool-actions"></div>`;
    stage.append(root);
    const pads = $('.echo-pads', root), recipe = $('.echo-recipe', root), log = $('.echo-log', root), meter = $('#ek-meter', root), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const st = { round: 1, rounds: 8, score: 0, combo: 0, focus: 3, heat: 0, step: 0, pattern: [], accepting: false, improv: false, audio: false, ac: null, timers: [] };
    NOTES.forEach((n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'echo-pad';
      b.dataset.note = n.id;
      b.innerHTML = `${n.name}<small>Key ${n.key}</small>`;
      b.addEventListener('click', () => hit(n.id));
      pads.append(b);
    });
    $('.tool-actions', root).append(btn('Sound off', sound, true), btn('Improv lock', improv, true));
    $$('[data-act]', root).forEach((b) => b.addEventListener('click', () => act(b.dataset.act)));
    root.addEventListener('keydown', key);
    dialog.addEventListener('close', tear, { once: true });
    root.tabIndex = -1;
    root.focus();
    newRun();

    function btn(t, f, sec) { const b = document.createElement('button'); b.type = 'button'; b.className = sec ? 'button button-secondary' : 'button'; b.textContent = t; b.addEventListener('click', f); return b; }
    function say(h) { log.innerHTML = h; }
    function makePattern() {
      const len = Math.min(8, 3 + Math.floor(st.round / 2) + (st.improv ? 1 : 0));
      const out = [];
      for (let i = 0; i < len; i++) out.push(NOTES[(i * 2 + st.round + Math.floor(i / 2)) % NOTES.length].id);
      if (st.round > 3) out.splice(1, 0, NOTES[(st.round + 1) % NOTES.length].id);
      return out.slice(0, len);
    }
    function newRun() { Object.assign(st, { round: 1, score: 0, combo: 0, focus: 3, heat: 0, step: 0, accepting: false }); nextOrder('New service started.'); }
    function nextOrder(prefix) { st.pattern = makePattern(); st.step = 0; st.accepting = false; paint(); say(`<strong>${prefix}</strong><small>Round ${st.round} has ${st.pattern.length} beats. Listen once, then serve it back.</small>`); playPattern(); }
    function paint() {
      $('#ek-round', root).textContent = `${st.round} / ${st.rounds}`; $('#ek-combo', root).textContent = st.combo; $('#ek-focus', root).textContent = st.focus; $('#ek-heat', root).textContent = st.heat; $('#ek-score', root).textContent = st.score;
      $('#ek-task', root).textContent = st.accepting ? `Replay beat ${st.step + 1} of ${st.pattern.length}.` : 'Listen to the recipe, then replay it.';
      meter.style.width = `${Math.max(0, 100 - st.heat * 10)}%`;
      recipe.replaceChildren();
      st.pattern.forEach((id, i) => { const d = document.createElement('span'); d.className = 'echo-dot'; if (i < st.step) d.classList.add('is-done'); if (i === st.step && st.accepting) d.classList.add('is-active'); d.textContent = i < st.step ? '✓' : i + 1; d.title = id; recipe.append(d); });
    }
    function act(k) { if (k === 'play') playPattern(); if (k === 'hint') hint(); if (k === 'reset') resetOrder(); if (k === 'new') newRun(); }
    function key(e) { const n = NOTES.find((x) => x.key === e.key); if (n) { e.preventDefault(); hit(n.id); } if (e.key.toLowerCase() === 'h') { e.preventDefault(); hint(); } if (e.key === ' ') { e.preventDefault(); playPattern(); } }
    function playPattern() {
      clearTimers(); st.accepting = false; paint(); const gap = st.improv ? 280 : 360;
      st.pattern.forEach((id, i) => st.timers.push(setTimeout(() => flash(id, true), i * gap)));
      st.timers.push(setTimeout(() => { st.accepting = true; say('<strong>Serve it back.</strong><small>Tap the pads or use 1 through 4. Mistakes add heat, but the order can be recovered.</small>'); paint(); }, st.pattern.length * gap + 120));
    }
    function hit(id) {
      if (!st.accepting) { flash(id, false); return; }
      flash(id, true);
      if (id === st.pattern[st.step]) {
        st.step++; st.combo++; st.score += 24 + st.combo * 3; beep(note(id).freq, .05); if (st.step >= st.pattern.length) complete();
      } else {
        st.combo = 0; st.heat += 2; st.score = Math.max(0, st.score - 30); beep(120, .09); say('<strong>Wrong beat, order smoking.</strong><small>Use a prep hint or reset this order. Heat clears slowly after a perfect serve.</small>'); if (st.heat >= 10) recover();
      }
      paint();
    }
    function complete() {
      st.accepting = false; const bonus = Math.max(0, 100 - st.heat * 7) + st.focus * 8; st.score += bonus; st.heat = Math.max(0, st.heat - 1); beep(720, .08);
      if (st.round >= st.rounds) { say(`<strong>Service complete: ${st.score}.</strong><small>${st.score >= 2200 ? 'Improv mode is unlocked for this session.' : 'Score 2200 to unlock improv mode.'}</small>`); return; }
      st.round++; st.focus = Math.min(4, st.focus + (st.combo > 4 ? 1 : 0)); nextOrder('Recipe served clean.');
    }
    function hint() { if (!st.focus || !st.accepting) { say('<strong>No useful hint right now.</strong><small>Hints work while replaying a live order and cost one focus.</small>'); return; } st.focus--; const id = st.pattern[st.step]; say(`<strong>Prep hint:</strong><small>The next beat is ${note(id).name}.</small>`); flash(id, true); paint(); }
    function resetOrder() { st.combo = 0; st.heat++; st.step = 0; say('<strong>Order reset.</strong><small>You lost time and gained heat, but the recipe is stable.</small>'); playPattern(); paint(); }
    function recover() { st.heat = 5; st.focus = Math.min(3, st.focus + 1); st.step = 0; st.accepting = false; say('<strong>Burn recovery.</strong><small>The kitchen cooled the pan and gave you one focus back. Replay carefully.</small>'); playPattern(); }
    function improv(e) { if (!st.improv && st.score < 2200) return say('<strong>Improv locked.</strong><small>Finish a run with 2200 points to unlock faster, longer recipes for this session.</small>'); st.improv = !st.improv; st.round = 1; nextOrder(st.improv ? 'Improv service opened.' : 'Classic service restored.'); if (e?.currentTarget) e.currentTarget.setAttribute('aria-pressed', String(st.improv)); }
    function note(id) { return NOTES.find((n) => n.id === id) || NOTES[0]; }
    function flash(id, tone) { const pad = $(`[data-note="${id}"]`, root); if (!pad) return; pad.classList.add('is-lit'); if (tone) beep(note(id).freq, .07); if (!reduced) st.timers.push(setTimeout(() => pad.classList.remove('is-lit'), 150)); else pad.classList.remove('is-lit'); }
    function sound(e) { st.audio = !st.audio; if (e?.currentTarget) e.currentTarget.textContent = st.audio ? 'Sound on' : 'Sound off'; if (st.audio) beep(440, .04); }
    function beep(freq, dur) { if (!st.audio) return; const C = window.AudioContext || window.webkitAudioContext; if (!C) return; st.ac = st.ac || new C(); const o = st.ac.createOscillator(), g = st.ac.createGain(); o.frequency.value = freq; o.type = 'sine'; g.gain.value = .0001; o.connect(g); g.connect(st.ac.destination); const t = st.ac.currentTime; g.gain.exponentialRampToValueAtTime(.045, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.start(t); o.stop(t + dur + .02); }
    function clearTimers() { st.timers.forEach(clearTimeout); st.timers = []; }
    function tear() { clearTimers(); try { st.ac?.close(); } catch {} }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
