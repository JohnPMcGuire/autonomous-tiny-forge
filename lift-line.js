(() => {
  const APP = {
    name: 'Lift Line', emoji: '🛗', category: 'play', version: '1.0.0',
    summary: 'Run a tower elevator during rush hour by juggling queues, capacity, power, patience, and priority calls.',
    description: 'A local vertical-logistics strategy game with passenger queues, elevator capacity, express routing, power draw, patience loss, rescue and repair choices, adaptive rush modes, session-only sky-lobby unlock, scoring, keyboard and touch controls, reduced-motion behavior, optional audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const lowMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const modes = {
    lobby: { name: 'Lobby rush', rounds: 9, power: 42, patience: 70, repairs: 2, target: 560 },
    expo: { name: 'Expo stack', rounds: 11, power: 38, patience: 62, repairs: 2, target: 760 },
    sky: { name: 'Sky lobby', rounds: 12, power: 36, patience: 58, repairs: 1, target: 900 }
  };
  const calls = [
    { from: 0, to: 5, riders: 3, patience: 9, type: 'staff', text: 'Morning staff surge' },
    { from: 2, to: 0, riders: 2, patience: 7, type: 'guest', text: 'Checkout guests' },
    { from: 4, to: 1, riders: 2, patience: 6, type: 'service', text: 'Service handoff' },
    { from: 0, to: 3, riders: 4, patience: 8, type: 'crowd', text: 'Conference crowd' },
    { from: 5, to: 0, riders: 1, patience: 5, type: 'vip', text: 'Impatient VIP' },
    { from: 1, to: 4, riders: 2, patience: 7, type: 'staff', text: 'Kitchen support' },
    { from: 3, to: 0, riders: 3, patience: 6, type: 'guest', text: 'Tour group exits' },
    { from: 0, to: 6, riders: 2, patience: 8, type: 'vip', text: 'Roof deck arrival' }
  ];

  function ensureStyles() {
    if ($('#lift-line-styles')) return;
    const style = document.createElement('style');
    style.id = 'lift-line-styles';
    style.textContent = `.ll-card{animation:ll-rise .24s ease both}.ll-game{max-width:1120px;gap:14px}.ll-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.ll-stat,.ll-tower,.ll-panel,.ll-queue{border:1px solid var(--line);border-radius:18px;background:#fff}.ll-stat{padding:10px 12px}.ll-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.ll-stat strong{display:block;margin-top:4px}.ll-layout{display:grid;grid-template-columns:1fr .88fr;gap:12px}.ll-tower{position:relative;min-height:448px;padding:14px;background:linear-gradient(180deg,#e0f2fe,#f8fafc);overflow:hidden}.ll-shaft{position:absolute;left:43%;top:16px;bottom:16px;width:18%;border-radius:20px;background:rgba(15,23,42,.08);box-shadow:inset 0 0 0 2px rgba(15,23,42,.12)}.ll-car{position:absolute;left:44.5%;width:15%;height:52px;border-radius:16px;background:#0f172a;color:#fff;display:grid;place-items:center;font-weight:900;box-shadow:0 12px 28px rgba(15,23,42,.28);transition:top .28s ease}.ll-floor{position:relative;display:grid;grid-template-columns:1fr 90px 1fr;align-items:center;min-height:64px;border-bottom:1px solid rgba(15,23,42,.12);z-index:1}.ll-floor:last-child{border-bottom:0}.ll-label{font-weight:900;color:#334155}.ll-call{border:1px solid var(--line);border-radius:14px;padding:7px 9px;background:#fff;box-shadow:0 8px 18px rgba(15,23,42,.08);font-size:.78rem}.ll-call strong{display:block}.ll-call.is-risk{background:#fee2e2}.ll-call.is-good{background:#dcfce7}.ll-panel{padding:14px;display:grid;gap:12px}.ll-queue{padding:12px;background:#f8fafc}.ll-queue h3{margin:.15rem 0 .35rem;font-size:1.1rem}.ll-controls{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ll-controls button{min-height:44px}.ll-controls button:focus-visible,.ll-pick button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.ll-pick{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ll-pick button{border:1px solid var(--line);border-radius:14px;background:#fff;min-height:44px;font-weight:900}.ll-pick button.is-active{box-shadow:0 0 0 3px #bae6fd inset}.ll-list{display:grid;gap:7px}.ll-chip{border:1px solid var(--line);border-radius:14px;background:#fff;padding:8px 10px;font-size:.82rem}.ll-log{min-height:112px;padding:17px 19px}.ll-pop{animation:ll-pop .28s ease both}.ll-shake{animation:ll-shake .32s ease both}@media(max-width:860px){.ll-hud{grid-template-columns:repeat(2,1fr)}.ll-layout{grid-template-columns:1fr}.ll-tower{min-height:414px}.ll-floor{min-height:58px}}@media(max-width:520px){.ll-tower,.ll-panel{padding:9px}.ll-floor{grid-template-columns:1fr 64px 1fr;min-height:54px}.ll-call{font-size:.68rem;padding:6px}.ll-controls,.ll-pick{grid-template-columns:1fr 1fr}.ll-hud{gap:6px}.ll-stat{padding:9px}}@media(prefers-reduced-motion:reduce){.ll-card,.ll-pop,.ll-shake,.ll-car{animation:none;transition:none}}@keyframes ll-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes ll-pop{0%{transform:scale(.96)}70%{transform:scale(1.03)}100%{transform:none}}@keyframes ll-shake{0%,100%{transform:none}35%{transform:translateX(-5px)}70%{transform:translateX(5px)}}`;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-lift-line-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.liftLineCard = 'true';
    card.classList.add('ll-card');
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
    const retry = () => { addCard(); if (!$('[data-lift-line-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.liftLineRefresh) return;
      button.dataset.liftLineRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Lift%20Line';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel ll-game';
    root.innerHTML = `<div class="ll-hud"><div class="ll-stat"><span>Mode</span><strong id="ll-mode">Lobby rush</strong></div><div class="ll-stat"><span>Call</span><strong id="ll-round">1 / 9</strong></div><div class="ll-stat"><span>Power</span><strong id="ll-power">42</strong></div><div class="ll-stat"><span>Patience</span><strong id="ll-patience">70</strong></div><div class="ll-stat"><span>Repairs</span><strong id="ll-repairs">2</strong></div><div class="ll-stat"><span>Score</span><strong id="ll-score">0</strong></div></div><div class="ll-layout"><div class="ll-tower" aria-label="Seven-floor elevator tower"><div class="ll-shaft" aria-hidden="true"></div><div class="ll-car" aria-live="polite">0</div><div class="ll-floors"></div></div><div class="ll-panel"><div class="ll-queue"></div><div class="ll-pick" aria-label="Route targets"></div><div class="ll-list" aria-label="Elevator status"></div><div class="ll-controls"><button class="button" type="button" data-act="move">Move car</button><button class="button button-secondary" type="button" data-act="load">Load/unload</button><button class="button button-secondary" type="button" data-act="express">Express run</button><button class="button button-secondary" type="button" data-act="repair">Repair door</button><button class="button button-secondary" type="button" data-act="mode">Change mode</button><button class="button button-secondary" type="button" data-act="reset">New shift</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card ll-log" aria-live="polite"></div>`;
    stage.append(root);
    const st = { mode: 'lobby', round: 1, power: 42, patience: 70, repairs: 2, score: 0, floor: 0, target: 0, loaded: 0, destination: null, queue: null, unlocked: false, sound: false, ac: null, low: lowMotion() };
    const floors = $('.ll-floors', root), car = $('.ll-car', root), queue = $('.ll-queue', root), pick = $('.ll-pick', root), status = $('.ll-list', root), log = $('.ll-log', root);
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });
    function mode() { return modes[st.mode]; }
    function call() { return calls[(st.round - 1 + (st.mode === 'expo' ? 2 : st.mode === 'sky' ? 5 : 0)) % calls.length]; }
    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: 0-6 choose floor, M move, L load or unload, E express, R repair.</small>`; }
    function tone(kind) {
      if (!st.sound && kind !== 'bad') return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume();
      const osc = st.ac.createOscillator(), gain = st.ac.createGain();
      osc.type = kind === 'bad' ? 'sawtooth' : 'sine'; osc.frequency.value = kind === 'good' ? 760 : kind === 'move' ? 420 : 220;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.055, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .18);
      osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .2);
    }
    function reset(next) {
      const keys = Object.keys(modes);
      st.mode = next || keys[(keys.indexOf(st.mode) + 1) % (st.unlocked ? 3 : 2)];
      const m = mode();
      st.round = 1; st.power = m.power; st.patience = m.patience; st.repairs = m.repairs; st.score = 0; st.floor = 0; st.target = 0; st.loaded = 0; st.destination = null;
      seedCall(); render(); note(`${m.name} started. Pick floors, move the car, load riders, and keep patience above zero.`);
    }
    function seedCall() {
      const c = call();
      st.queue = { ...c, wait: c.patience + (st.mode === 'sky' ? -1 : 0), ridersLeft: c.riders };
      st.target = st.queue.from;
    }
    function capacity() { return st.mode === 'sky' ? 4 : 5; }
    function travelCost(to, express = false) { return Math.max(1, Math.abs(to - st.floor)) + (express ? 2 : 0); }
    function move(express = false) {
      if (st.target === st.floor) { note('The car is already on that floor. Load, unload, or choose another stop.'); return; }
      const cost = travelCost(st.target, express);
      if (st.power < cost) { st.patience -= 5; tone('bad'); render(); note('Power is too low for that trip. Use a repair reset or finish the closest call first.'); return; }
      st.power -= cost; st.patience -= express ? 1 : 2; st.queue.wait -= express ? 1 : 2; st.floor = st.target; tone('move'); resolvePressure(); render(); note(express ? 'Express run saved time but pulled extra power.' : 'The car moved. Load or unload before the queue loses patience.');
    }
    function load() {
      if (st.loaded && st.floor === st.destination) {
        const delivered = st.loaded; st.loaded = 0; st.destination = null; st.score += delivered * 54 + Math.max(0, st.queue.wait) * 9 + (st.queue.type === 'vip' ? 35 : 0); st.patience += 5; tone('good'); nextCall(`Delivered ${delivered} rider${delivered === 1 ? '' : 's'} cleanly.`); return;
      }
      if (!st.queue || st.floor !== st.queue.from) { st.patience -= 3; tone('bad'); render(); note('No waiting group is on this floor. Choose the pickup floor or unload at the destination.'); return; }
      const seats = capacity() - st.loaded;
      if (seats <= 0) { st.patience -= 3; render(); note('The car is full. Deliver current riders before taking more.'); return; }
      const boarding = Math.min(seats, st.queue.ridersLeft);
      st.loaded += boarding; st.queue.ridersLeft -= boarding; st.destination = st.queue.to; st.target = st.destination; st.patience -= boarding > 2 ? 0 : 1; tone('good'); render(); note(`Loaded ${boarding}. Destination set to floor ${st.destination}.`);
    }
    function repair() {
      if (st.repairs <= 0) { st.patience -= 4; tone('bad'); render(); note('No repair crews remain. Recover by finishing the next call quickly.'); return; }
      st.repairs -= 1; st.power += 8; st.patience += 4; if (st.queue) st.queue.wait += 2; tone('good'); render(); note('Repair crew freed the door and restored power, but the spare crew is now gone.');
    }
    function resolvePressure() {
      if (st.queue.wait <= 0) { st.patience -= st.queue.type === 'vip' ? 12 : 8; st.score = Math.max(0, st.score - 35); st.queue.wait = 2; tone('bad'); }
      if (st.patience <= 0 || st.power <= 0) finish(false);
    }
    function nextCall(prefix) {
      st.round += 1;
      if (st.round > mode().rounds) { finish(true, prefix); return; }
      st.power += st.round % 3 === 0 ? 5 : 2;
      seedCall(); render(); note(`${prefix} Next call: ${st.queue.text}.`);
    }
    function finish(won, prefix = '') {
      const target = mode().target;
      const success = won && st.score >= target;
      if (success && st.mode === 'expo') st.unlocked = true;
      render();
      note(`${prefix} Shift ${success ? 'cleared' : 'ended'} with ${st.score} points. ${success && st.unlocked ? 'Sky lobby mode is now unlocked for this session.' : st.score < target ? `Target was ${target}. Try shorter trips and fewer empty moves.` : 'Try the next mode for tighter power and patience.'}`);
    }
    function render() {
      $('#ll-mode', root).textContent = mode().name;
      $('#ll-round', root).textContent = `${Math.min(st.round, mode().rounds)} / ${mode().rounds}`;
      $('#ll-power', root).textContent = st.power;
      $('#ll-patience', root).textContent = st.patience;
      $('#ll-repairs', root).textContent = st.repairs;
      $('#ll-score', root).textContent = st.score;
      const top = 16 + (6 - st.floor) * 64;
      car.style.top = `${top}px`; car.textContent = `${st.floor}${st.loaded ? ` · ${st.loaded}` : ''}`;
      floors.replaceChildren();
      for (let f = 6; f >= 0; f--) {
        const row = document.createElement('div'); row.className = 'll-floor';
        const left = document.createElement('div'); const mid = document.createElement('div'); const right = document.createElement('div');
        left.className = 'll-label'; left.textContent = f === 0 ? 'Lobby' : `Floor ${f}`;
        if (st.queue && st.queue.from === f && st.queue.ridersLeft > 0) {
          right.className = `ll-call ${st.queue.wait <= 3 ? 'is-risk' : ''}`;
          right.innerHTML = `<strong>${st.queue.text}</strong><span>${st.queue.ridersLeft} to ${st.queue.to} · wait ${st.queue.wait}</span>`;
        } else if (st.destination === f && st.loaded) {
          right.className = 'll-call is-good'; right.innerHTML = `<strong>Drop-off</strong><span>${st.loaded} rider${st.loaded === 1 ? '' : 's'}</span>`;
        }
        row.append(left, mid, right); floors.append(row);
      }
      queue.innerHTML = st.queue ? `<h3>${st.queue.text}</h3><p>${st.queue.ridersLeft || st.loaded} rider${(st.queue.ridersLeft || st.loaded) === 1 ? '' : 's'} · floor ${st.queue.from} to ${st.queue.to} · patience ${st.queue.wait}</p>` : '<h3>No active call</h3>';
      pick.replaceChildren();
      for (let f = 0; f <= 6; f++) {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = f; b.className = f === st.target ? 'is-active' : ''; b.setAttribute('aria-label', `Set target floor ${f}`); b.addEventListener('click', () => { st.target = f; render(); note(`Target set to floor ${f}.`); }); pick.append(b);
      }
      status.innerHTML = `<div class="ll-chip">Car: floor ${st.floor}, ${st.loaded}/${capacity()} seats filled${st.destination !== null ? `, destination ${st.destination}` : ''}</div><div class="ll-chip">Express costs extra power but protects patience.</div><div class="ll-chip">Repair restores power and wait time, but crews are limited.</div>`;
    }
    root.addEventListener('click', (event) => {
      const act = event.target.closest('button')?.dataset.act; if (!act) return;
      if (act === 'move') move(false);
      if (act === 'load') load();
      if (act === 'express') move(true);
      if (act === 'repair') repair();
      if (act === 'mode') reset();
      if (act === 'reset') reset(st.mode);
      if (act === 'sound') { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); tone('good'); }
    });
    root.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (/^[0-6]$/.test(key)) { st.target = Number(key); render(); note(`Target set to floor ${st.target}.`); }
      if (key === 'm') move(false);
      if (key === 'l' || key === ' ') { event.preventDefault(); load(); }
      if (key === 'e') move(true);
      if (key === 'r') repair();
    });
    reset('lobby');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
