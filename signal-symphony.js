(() => {
  const APP = {
    name: 'Signal Symphony', emoji: '🎚️', category: 'play', version: '1.0.0',
    summary: 'Conduct a four-channel signal loop by balancing rhythm, memory, noise, and battery.',
    description: 'A local rhythm-memory strategy game with mode choice, sequenced tones, channel routing, battery pressure, noise gates, mistakes and recovery, session-only encore unlocks, scoring, SVG motion, touch and keyboard controls, reduced-motion behavior, optional local audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const channels = [
    { id: 'pulse', name: 'Pulse', key: '1', freq: 220 },
    { id: 'beam', name: 'Beam', key: '2', freq: 294 },
    { id: 'drift', name: 'Drift', key: '3', freq: 370 },
    { id: 'flare', name: 'Flare', key: '4', freq: 494 }
  ];
  const modes = {
    tune: { name: 'Tune-up', rounds: 5, battery: 18, noise: 1 },
    stage: { name: 'Stage set', rounds: 7, battery: 16, noise: 2 },
    encore: { name: 'Encore', rounds: 9, battery: 15, noise: 3 }
  };
  const lowMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensureStyles() {
    if ($('#signal-symphony-styles')) return;
    const style = document.createElement('style');
    style.id = 'signal-symphony-styles';
    style.textContent = `
      .signal-card{animation:signal-pop .24s ease both}.signal-game{max-width:1120px;gap:14px}.signal-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.signal-stat,.signal-stage,.signal-panel,.signal-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.signal-stat{padding:10px 12px}.signal-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.signal-stat strong{display:block;margin-top:4px}.signal-layout{display:grid;grid-template-columns:1.05fr .95fr;gap:12px}.signal-stage{padding:12px;background:linear-gradient(135deg,#111827,#312e81);color:#fff;overflow:hidden}.signal-score{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.signal-lane{min-height:104px;border:1px solid rgba(255,255,255,.22);border-radius:18px;background:rgba(255,255,255,.08);display:grid;place-items:center;text-align:center;position:relative;overflow:hidden}.signal-lane.is-active{box-shadow:0 0 0 3px #fef3c7 inset}.signal-lane.is-armed{background:rgba(20,184,166,.22)}.signal-lane strong{font-size:clamp(1.15rem,4vw,2rem)}.signal-lane small{display:block;color:rgba(255,255,255,.76);font-weight:800}.signal-note{position:absolute;bottom:9px;left:50%;width:16px;height:16px;border-radius:999px;background:#fef08a;transform:translateX(-50%);opacity:.75}.signal-note.is-go{animation:signal-rise .55s ease both}.signal-panel{padding:14px;display:grid;gap:12px}.signal-brief{padding:13px;background:#f8fafc}.signal-brief h3{margin:.2rem 0;font-size:1.2rem}.signal-pattern{display:flex;flex-wrap:wrap;gap:6px}.signal-chip{border:1px solid var(--line);border-radius:999px;background:#fff;padding:5px 9px;font-size:.78rem;font-weight:900}.signal-chip.is-noise{background:#fee2e2}.signal-pad-grid,.signal-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.signal-pad-grid button{min-height:54px;border:1px solid var(--line);border-radius:16px;background:#fff;font-weight:900}.signal-pad-grid button:focus-visible,.signal-actions button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.signal-pad-grid button.is-hit{background:#0f172a;color:#fff}.signal-log{min-height:100px;padding:17px 19px}@media(max-width:860px){.signal-hud{grid-template-columns:repeat(2,1fr)}.signal-layout{grid-template-columns:1fr}.signal-score{grid-template-columns:repeat(2,1fr)}.signal-lane{min-height:86px}}@media(max-width:520px){.signal-stage{padding:9px}.signal-score{gap:6px}.signal-lane{min-height:74px;border-radius:14px}.signal-stat{padding:9px}.signal-actions{grid-template-columns:1fr}.signal-pad-grid{grid-template-columns:1fr 1fr}}@media(prefers-reduced-motion:reduce){.signal-card,.signal-note.is-go{animation:none;transition:none}}@keyframes signal-pop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes signal-rise{from{transform:translate(-50%,20px);opacity:0}45%{opacity:.95}to{transform:translate(-50%,-62px);opacity:0}}
    `;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-signal-symphony-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.signalSymphonyCard = 'true';
    card.classList.add('signal-card');
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
    const retry = () => { addCard(); if (!$('[data-signal-symphony-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.signalSymphonyRefresh) return;
      button.dataset.signalSymphonyRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Signal%20Symphony';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel signal-game';
    root.innerHTML = `<div class="signal-hud"><div class="signal-stat"><span>Mode</span><strong id="ss-mode">Tune-up</strong></div><div class="signal-stat"><span>Round</span><strong id="ss-round">1 / 5</strong></div><div class="signal-stat"><span>Battery</span><strong id="ss-battery">18</strong></div><div class="signal-stat"><span>Noise</span><strong id="ss-noise">1</strong></div><div class="signal-stat"><span>Score</span><strong id="ss-score">0</strong></div><div class="signal-stat"><span>Best</span><strong id="ss-best">0</strong></div></div><div class="signal-layout"><div class="signal-stage"><div class="signal-score" aria-label="Signal channels"></div></div><div class="signal-panel"><div class="signal-brief"></div><div class="signal-pattern" aria-label="Current sequence"></div><div class="signal-pad-grid" role="group" aria-label="Play channel pads"></div><div class="signal-actions"><button class="button" type="button" data-act="listen">Listen</button><button class="button button-secondary" type="button" data-act="stabilize">Stabilize noise</button><button class="button button-secondary" type="button" data-act="skip">Skip pattern</button><button class="button button-secondary" type="button" data-act="mode">Change mode</button><button class="button button-secondary" type="button" data-act="reset">New set</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card signal-log" aria-live="polite"></div>`;
    stage.append(root);
    const lanes = $('.signal-score', root), pads = $('.signal-pad-grid', root), brief = $('.signal-brief', root), patternBox = $('.signal-pattern', root), log = $('.signal-log', root);
    const st = { mode: 'tune', round: 1, battery: 18, score: 0, best: 0, noise: 1, sequence: [], input: [], sound: false, ac: null, busy: false, unlocked: false, low: lowMotion() };
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });

    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: 1-4 play channels, L listens, S stabilizes, K skips, M changes mode.</small>`; }
    function chooseMode(next) {
      const keys = Object.keys(modes); st.mode = next || keys[(keys.indexOf(st.mode) + 1) % (st.unlocked ? 3 : 2)];
      const mode = modes[st.mode]; st.round = 1; st.battery = mode.battery; st.noise = mode.noise; st.score = 0; st.input = [];
      makeSequence(); note(`${mode.name} ready. Listen, then replay the channels in order while managing battery and noise.`); render();
    }
    function makeSequence() {
      const length = Math.min(3 + Math.floor(st.round / 2) + (st.mode === 'encore' ? 1 : 0), 8);
      st.sequence = Array.from({ length }, (_, i) => channels[(i + st.round + Math.floor(Math.random() * channels.length)) % channels.length].id);
      for (let i = 0; i < st.noise; i++) st.sequence.splice(Math.floor(Math.random() * (st.sequence.length + 1)), 0, 'noise');
      st.input = [];
    }
    function tone(id, bad = false) {
      if (!st.sound && !bad) return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume();
      const osc = st.ac.createOscillator(), gain = st.ac.createGain();
      const channel = channels.find((item) => item.id === id);
      osc.type = bad || id === 'noise' ? 'sawtooth' : 'sine'; osc.frequency.value = bad ? 130 : channel ? channel.freq : 166;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.06, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .2);
      osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .22);
    }
    function hud() {
      const mode = modes[st.mode]; $('#ss-mode', root).textContent = mode.name; $('#ss-round', root).textContent = `${Math.min(st.round, mode.rounds)} / ${mode.rounds}`; $('#ss-battery', root).textContent = st.battery; $('#ss-noise', root).textContent = st.noise; $('#ss-score', root).textContent = st.score; $('#ss-best', root).textContent = Math.max(st.best, st.score);
    }
    function render() {
      hud();
      lanes.replaceChildren(...channels.map((ch) => { const lane = document.createElement('div'); lane.className = 'signal-lane'; lane.dataset.id = ch.id; lane.innerHTML = `<strong>${ch.key}</strong><small>${ch.name}</small><span class="signal-note"></span>`; return lane; }));
      pads.replaceChildren(...channels.map((ch) => { const button = document.createElement('button'); button.type = 'button'; button.dataset.pad = ch.id; button.textContent = `${ch.key} ${ch.name}`; return button; }));
      const visible = st.sequence.map((id, i) => { const chip = document.createElement('span'); chip.className = `signal-chip${id === 'noise' ? ' is-noise' : ''}`; chip.textContent = id === 'noise' ? 'Noise gate' : `${i + 1}. ${channels.find((ch) => ch.id === id).name}`; return chip; });
      patternBox.replaceChildren(...visible);
      brief.innerHTML = `<h3>${st.unlocked ? 'Encore desk online' : 'Four-channel desk'}</h3><p>Replay the real channels and ignore noise gates. Each listen costs battery. Stabilize removes one noise gate. Skipping saves a run but costs points. Clean rounds unlock Encore.</p>`;
    }
    async function flash(id) {
      const lane = $(`.signal-lane[data-id="${id}"]`, root); if (!lane) return;
      lane.classList.add('is-active'); $('.signal-note', lane)?.classList.add('is-go'); tone(id);
      await new Promise((resolve) => setTimeout(resolve, st.low ? 90 : 360));
      lane.classList.remove('is-active'); $('.signal-note', lane)?.classList.remove('is-go');
    }
    async function listen() {
      if (st.busy || st.battery <= 0) return;
      st.busy = true; st.battery -= 1; hud(); note('Listen closely. Noise gates buzz but should not be replayed.');
      for (const id of st.sequence) { await flash(id); await new Promise((resolve) => setTimeout(resolve, st.low ? 40 : 120)); }
      st.busy = false; note('Now replay only the named channels in order.');
    }
    function expected() { return st.sequence.filter((id) => id !== 'noise'); }
    function play(id) {
      if (st.busy || st.battery <= 0) return;
      st.input.push(id); st.battery -= 1; tone(id); $(`button[data-pad="${id}"]`, root)?.classList.add('is-hit'); setTimeout(() => $(`button[data-pad="${id}"]`, root)?.classList.remove('is-hit'), 160);
      const exp = expected(); const index = st.input.length - 1;
      if (st.input[index] !== exp[index]) { st.score = Math.max(0, st.score - 10); st.noise = Math.min(5, st.noise + 1); st.input = []; tone('noise', true); note('Bad patch. Noise increased, but the board recovered. Listen again or stabilize.'); render(); return; }
      if (st.input.length === exp.length) winRound(); else { note(`${st.input.length} / ${exp.length} channels locked. Keep going.`); hud(); }
    }
    function winRound() {
      const mode = modes[st.mode]; const clean = Math.max(0, 30 + st.battery + (6 - st.noise) * 4 + st.round * 3); st.score += clean; st.best = Math.max(st.best, st.score); st.round += 1; st.noise = Math.max(mode.noise, st.noise - 1);
      if (!st.unlocked && st.score >= 180) st.unlocked = true;
      if (st.round > mode.rounds) { note(`${mode.name} complete. Final score ${st.score}. ${st.unlocked ? 'Encore is unlocked for this session.' : 'Reach 180 to unlock Encore.'}`); hud(); return; }
      makeSequence(); note(`Clean lock. Round ${st.round} adds a longer phrase.`); render();
    }
    function stabilize() { if (st.battery < 2) { note('Not enough battery to stabilize. Try the pattern or reset.'); return; } st.battery -= 2; st.noise = Math.max(0, st.noise - 1); makeSequence(); note('Noise stabilized. The phrase was rebuilt with fewer fake cues.'); render(); }
    function skip() { st.score = Math.max(0, st.score - 8); st.battery = Math.max(1, st.battery - 1); st.round += 1; if (st.round > modes[st.mode].rounds) st.round = modes[st.mode].rounds; makeSequence(); note('Pattern skipped. You kept the set alive, but the score took a hit.'); render(); }

    root.addEventListener('click', (event) => {
      const pad = event.target.closest('[data-pad]'); if (pad) play(pad.dataset.pad);
      const act = event.target.closest('[data-act]')?.dataset.act;
      if (act === 'listen') listen(); if (act === 'stabilize') stabilize(); if (act === 'skip') skip(); if (act === 'mode') chooseMode(); if (act === 'reset') chooseMode(st.mode);
      if (act === 'sound') { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); if (st.sound) tone('pulse'); }
    });
    root.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase(); const ch = channels.find((item) => item.key === key);
      if (ch) { event.preventDefault(); play(ch.id); }
      if (key === 'l') { event.preventDefault(); listen(); } if (key === 's') { event.preventDefault(); stabilize(); } if (key === 'k') { event.preventDefault(); skip(); } if (key === 'm') { event.preventDefault(); chooseMode(); }
    });
    root.tabIndex = -1;
    chooseMode('tune'); setTimeout(() => root.focus(), 50);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
