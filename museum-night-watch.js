(() => {
  const APP = {
    name: 'Museum Night Watch', emoji: '🏛️', category: 'play', version: '1.0.0',
    summary: 'Patrol a dark museum by balancing alarms, scan charge, stamina, suspicion, decoys, and artifact security.',
    description: 'A local spatial patrol strategy game with hidden incidents, scan radius, alarm escalation, stamina and camera charge, decoy recovery, adaptive wings, session-only gala unlock, scoring, responsive grid play, touch and keyboard controls, reduced-motion behavior, optional audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const lowMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const modes = {
    quiet: { name: 'Quiet wing', turns: 14, stamina: 38, charge: 8, suspicion: 18, decoys: 2, target: 620 },
    storm: { name: 'Storm outage', turns: 16, stamina: 34, charge: 7, suspicion: 24, decoys: 2, target: 820 },
    gala: { name: 'Midnight gala', turns: 18, stamina: 32, charge: 6, suspicion: 28, decoys: 1, target: 1040 }
  };
  const incidents = [
    { kind: 'thief', title: 'Gloved shadow', risk: 18, clue: 'Footprints near a velvet rope', fix: 'secure', art: 'Jade horse' },
    { kind: 'leak', title: 'Ceiling drip', risk: 12, clue: 'Water shines under a skylight', fix: 'secure', art: 'Paper map' },
    { kind: 'cat', title: 'Unauthorized cat', risk: 10, clue: 'A tiny bell rings twice', fix: 'decoy', art: 'Miniature chair' },
    { kind: 'sensor', title: 'Looping camera', risk: 14, clue: 'One monitor repeats itself', fix: 'scan', art: 'Glass comet' },
    { kind: 'crowd', title: 'Lost donor', risk: 16, clue: 'Polite whispers behind the rope', fix: 'secure', art: 'Silver mask' },
    { kind: 'draft', title: 'Door draft', risk: 9, clue: 'A gallery label flutters', fix: 'scan', art: 'Wax seal' }
  ];

  function ensureStyles() {
    if ($('#museum-night-watch-styles')) return;
    const style = document.createElement('style');
    style.id = 'museum-night-watch-styles';
    style.textContent = `.mnw-card{animation:mnw-rise .24s ease both}.mnw-game{max-width:1120px;gap:14px}.mnw-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.mnw-stat,.mnw-board,.mnw-panel,.mnw-room{border:1px solid var(--line);border-radius:18px;background:#fff}.mnw-stat{padding:10px 12px}.mnw-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.mnw-stat strong{display:block;margin-top:4px}.mnw-layout{display:grid;grid-template-columns:1.02fr .88fr;gap:12px}.mnw-board{position:relative;padding:14px;background:radial-gradient(circle at 20% 15%,#fef3c7,#e0f2fe 42%,#eef2ff);overflow:hidden}.mnw-map{display:grid;grid-template-columns:repeat(5,minmax(42px,1fr));gap:8px}.mnw-room{position:relative;min-height:74px;padding:7px;display:grid;place-items:center;text-align:center;font-weight:900;color:#334155;background:#f8fafc;box-shadow:inset 0 0 0 1px rgba(15,23,42,.04)}.mnw-room button{position:absolute;inset:0;border:0;background:transparent;border-radius:18px;cursor:pointer}.mnw-room button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.mnw-room.is-guard{box-shadow:0 0 0 4px #bfdbfe inset;background:#eff6ff}.mnw-room.is-alert{background:#fee2e2}.mnw-room.is-clue{background:#fef9c3}.mnw-room.is-safe{background:#dcfce7}.mnw-room.is-dark{filter:saturate(.82) brightness(.92)}.mnw-room small{display:block;font-size:.63rem;color:var(--muted);font-weight:800}.mnw-badge{position:absolute;right:6px;top:5px;font-size:.78rem}.mnw-panel{padding:14px;display:grid;gap:12px}.mnw-brief{border:1px solid var(--line);border-radius:16px;background:#f8fafc;padding:12px}.mnw-brief h3{margin:.1rem 0 .35rem;font-size:1.08rem}.mnw-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.mnw-actions button,.mnw-mode button{min-height:44px}.mnw-actions button:focus-visible,.mnw-mode button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.mnw-mode{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.mnw-mode button{border:1px solid var(--line);border-radius:14px;background:#fff;font-weight:900}.mnw-mode button.is-active{box-shadow:0 0 0 3px #ddd6fe inset}.mnw-list{display:grid;gap:7px}.mnw-chip{border:1px solid var(--line);border-radius:14px;background:#fff;padding:8px 10px;font-size:.82rem}.mnw-log{min-height:112px;padding:17px 19px}.mnw-pop{animation:mnw-pop .28s ease both}.mnw-shake{animation:mnw-shake .32s ease both}@media(max-width:860px){.mnw-hud{grid-template-columns:repeat(2,1fr)}.mnw-layout{grid-template-columns:1fr}.mnw-room{min-height:64px}}@media(max-width:520px){.mnw-board,.mnw-panel{padding:9px}.mnw-map{gap:5px}.mnw-room{min-height:52px;font-size:.8rem}.mnw-room small{display:none}.mnw-actions,.mnw-mode{grid-template-columns:1fr 1fr}.mnw-hud{gap:6px}.mnw-stat{padding:9px}}@media(prefers-reduced-motion:reduce){.mnw-card,.mnw-pop,.mnw-shake{animation:none;transition:none}}@keyframes mnw-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes mnw-pop{0%{transform:scale(.96)}70%{transform:scale(1.03)}100%{transform:none}}@keyframes mnw-shake{0%,100%{transform:none}35%{transform:translateX(-5px)}70%{transform:translateX(5px)}}`;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-museum-night-watch-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.museumNightWatchCard = 'true';
    card.classList.add('mnw-card');
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
    const retry = () => { addCard(); if (!$('[data-museum-night-watch-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.museumNightWatchRefresh) return;
      button.dataset.museumNightWatchRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Museum%20Night%20Watch';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel mnw-game';
    root.innerHTML = `<div class="mnw-hud"><div class="mnw-stat"><span>Wing</span><strong id="mnw-mode">Quiet wing</strong></div><div class="mnw-stat"><span>Turn</span><strong id="mnw-turn">1 / 14</strong></div><div class="mnw-stat"><span>Stamina</span><strong id="mnw-stamina">38</strong></div><div class="mnw-stat"><span>Scan</span><strong id="mnw-charge">8</strong></div><div class="mnw-stat"><span>Suspicion</span><strong id="mnw-suspicion">18</strong></div><div class="mnw-stat"><span>Score</span><strong id="mnw-score">0</strong></div></div><div class="mnw-layout"><div class="mnw-board" aria-label="Museum floor grid"><div class="mnw-map"></div></div><div class="mnw-panel"><div class="mnw-brief"></div><div class="mnw-mode" aria-label="Wing modes"></div><div class="mnw-list" aria-label="Night watch status"></div><div class="mnw-actions"><button class="button" type="button" data-act="move">Move</button><button class="button button-secondary" type="button" data-act="scan">Scan room</button><button class="button button-secondary" type="button" data-act="secure">Secure artifact</button><button class="button button-secondary" type="button" data-act="decoy">Place decoy</button><button class="button button-secondary" type="button" data-act="rest">Take breather</button><button class="button button-secondary" type="button" data-act="reset">New watch</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card mnw-log" aria-live="polite"></div>`;
    stage.append(root);
    const st = { mode: 'quiet', turn: 1, stamina: 38, charge: 8, suspicion: 18, score: 0, pos: 12, selected: 12, decoys: 2, found: null, threat: null, secured: 0, unlocked: false, sound: false, ac: null, low: lowMotion(), scanned: new Set([12]), safe: new Set(), alerts: new Set() };
    const map = $('.mnw-map', root), brief = $('.mnw-brief', root), modeBox = $('.mnw-mode', root), status = $('.mnw-list', root), log = $('.mnw-log', root);
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });
    function mode() { return modes[st.mode]; }
    function rand(seed) { return Math.abs(Math.sin(seed * 93.17 + st.turn * 11.31)) % 1; }
    function threatCell() { return (Math.floor(rand(st.turn + st.suspicion) * 25) + st.turn * 3) % 25; }
    function incident() { return incidents[(st.turn + (st.mode === 'storm' ? 2 : st.mode === 'gala' ? 4 : 0)) % incidents.length]; }
    function neighbors(cell) { const r = Math.floor(cell / 5), c = cell % 5, out = []; [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr, dc]) => { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) out.push(nr * 5 + nc); }); return out; }
    function dist(a, b) { return Math.abs(Math.floor(a / 5) - Math.floor(b / 5)) + Math.abs(a % 5 - b % 5); }
    function tone(kind) {
      if (!st.sound && kind !== 'bad') return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume();
      const osc = st.ac.createOscillator(), gain = st.ac.createGain();
      osc.type = kind === 'bad' ? 'sawtooth' : 'triangle'; osc.frequency.value = kind === 'good' ? 820 : kind === 'move' ? 360 : 240;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.052, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .18);
      osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .2);
    }
    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: arrows choose adjacent room, M move, S scan, A secure, D decoy, B breather.</small>`; }
    function start(next) {
      const keys = Object.keys(modes);
      st.mode = next || keys[(keys.indexOf(st.mode) + 1) % (st.unlocked ? 3 : 2)];
      const m = mode();
      st.turn = 1; st.stamina = m.stamina; st.charge = m.charge; st.suspicion = m.suspicion; st.score = 0; st.pos = 12; st.selected = 12; st.decoys = m.decoys; st.secured = 0; st.scanned = new Set([12]); st.safe = new Set();
      seedThreat(); render(); note(`${m.name} started. Patrol the wing, scan near alarms, and secure threats before suspicion overwhelms the watch.`);
    }
    function seedThreat() {
      st.threat = { ...incident(), cell: threatCell(), age: 0 };
      st.found = null;
      st.alerts = new Set([st.threat.cell, ...neighbors(st.threat.cell).slice(0, st.mode === 'quiet' ? 1 : 2)]);
    }
    function select(cell) { st.selected = Math.max(0, Math.min(24, cell)); render(); }
    function move() {
      const cost = dist(st.pos, st.selected);
      if (!cost) { note('You are already in that gallery. Scan, secure, or choose another room.'); return; }
      if (cost > 1 && st.mode !== 'quiet') { st.suspicion += 4; note('Running across the wing made noise. Pick adjacent rooms during rougher modes.'); }
      st.stamina -= cost + (st.mode === 'gala' ? 1 : 0); st.charge = Math.min(mode().charge + 2, st.charge + 1); st.pos = st.selected; advance('move'); tone('move');
    }
    function scan() {
      if (st.charge <= 0) { st.suspicion += 6; tone('bad'); render(); note('The scanner is empty. Take a breather or move carefully to recover charge.'); return; }
      st.charge -= 1; st.stamina -= 1; [st.pos, ...neighbors(st.pos)].forEach((cell) => st.scanned.add(cell));
      if (st.threat && dist(st.pos, st.threat.cell) <= 1) { st.found = st.threat; st.score += 45; tone('good'); note(`${st.threat.clue}. The ${st.threat.art} needs a ${st.threat.fix === 'decoy' ? 'decoy' : st.threat.fix === 'scan' ? 'focused scan' : 'secure'} response.`); }
      else { note('Scan sweep is clean nearby, but distant alarms keep aging.'); }
      advance('scan');
    }
    function secure() {
      if (!st.threat || st.pos !== st.threat.cell) { st.suspicion += 5; tone('bad'); render(); note('Nothing here needs a lock-down. The false secure costs trust.'); return; }
      const exact = st.found && st.found.cell === st.pos;
      const bonus = exact ? 130 : 70;
      st.score += bonus + Math.max(0, 30 - st.threat.age * 6); st.suspicion = Math.max(0, st.suspicion - (exact ? 12 : 5)); st.safe.add(st.pos); st.secured += 1; tone('good');
      if (st.score >= mode().target && !st.unlocked) { st.unlocked = true; note('Midnight gala unlocked for this session. The museum trusts you with the hardest wing.'); }
      else note(`${st.threat.art} secured. The wing calms down and a new incident begins.`);
      nextTurn(true);
    }
    function decoy() {
      if (st.decoys <= 0) { st.suspicion += 6; tone('bad'); render(); note('No decoys left. Secure directly or take a breather to survive the next alarm.'); return; }
      st.decoys -= 1; st.stamina -= 1;
      if (st.threat && dist(st.pos, st.threat.cell) <= 1 && (st.threat.fix === 'decoy' || st.threat.kind === 'cat')) { st.score += 95; st.suspicion = Math.max(0, st.suspicion - 9); st.safe.add(st.threat.cell); tone('good'); note('The decoy pulled the problem away from the artifact. New alarm incoming.'); nextTurn(true); return; }
      st.suspicion = Math.max(0, st.suspicion - 4); note('The decoy buys a little calm, but it did not solve the core incident.'); advance('decoy');
    }
    function rest() { st.stamina = Math.min(mode().stamina, st.stamina + 5); st.charge = Math.min(mode().charge + 2, st.charge + 2); st.suspicion += st.mode === 'quiet' ? 4 : 7; note('You recover stamina and scan charge while the alarm ages.'); advance('rest'); }
    function advance(action) {
      if (!st.threat) seedThreat();
      st.threat.age += 1; st.suspicion += Math.max(1, Math.floor(st.threat.risk / 6)) + (st.mode === 'gala' ? 1 : 0);
      if (st.alerts.has(st.pos) && action === 'move') st.score += 14;
      checkEnd() || render();
    }
    function nextTurn(cleared) {
      if (cleared) st.turn += 1;
      if (checkEnd()) return;
      seedThreat(); render();
    }
    function checkEnd() {
      const m = mode();
      if (st.suspicion >= 100 || st.stamina <= 0) { render(); note(`Watch failed at ${st.score} points. Suspicion or exhaustion got too high, but the patrol can restart with better scan timing.`); return true; }
      if (st.turn > m.turns) { render(); note(st.score >= m.target ? `Wing cleared with ${st.score} points. Try a harder mode or optimize decoy timing.` : `Shift complete at ${st.score}. You needed ${m.target}; replay with shorter routes and earlier scans.`); return true; }
      return false;
    }
    function render() {
      const m = mode();
      $('#mnw-mode', root).textContent = m.name; $('#mnw-turn', root).textContent = `${Math.min(st.turn, m.turns)} / ${m.turns}`; $('#mnw-stamina', root).textContent = st.stamina; $('#mnw-charge', root).textContent = st.charge; $('#mnw-suspicion', root).textContent = st.suspicion; $('#mnw-score', root).textContent = st.score;
      map.replaceChildren();
      for (let i = 0; i < 25; i += 1) {
        const room = document.createElement('div');
        room.className = 'mnw-room';
        if (i === st.pos) room.classList.add('is-guard');
        if (st.alerts.has(i)) room.classList.add('is-alert');
        if (st.scanned.has(i)) room.classList.add('is-clue');
        if (st.safe.has(i)) room.classList.add('is-safe');
        if (!st.scanned.has(i) && dist(i, st.pos) > 2) room.classList.add('is-dark');
        room.innerHTML = `<span>${i === st.pos ? 'Guard' : st.safe.has(i) ? 'Safe' : st.alerts.has(i) ? 'Alarm' : 'Room'}<small>${Math.floor(i / 5) + 1}-${(i % 5) + 1}</small></span><span class="mnw-badge">${i === st.selected ? '◆' : st.scanned.has(i) ? '•' : ''}</span><button type="button" aria-label="Select room ${Math.floor(i / 5) + 1}-${(i % 5) + 1}"></button>`;
        $('button', room).addEventListener('click', () => select(i));
        map.append(room);
      }
      brief.innerHTML = `<h3>${st.threat ? st.threat.title : 'No active alarm'}</h3><p>${st.found ? `${st.found.clue}. Protect the ${st.found.art}.` : 'Use scan near red alarm rooms to reveal whether this is a thief, leak, sensor fault, stray cat, or guest issue.'}</p>`;
      modeBox.replaceChildren();
      Object.entries(modes).forEach(([key, item]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = key === 'gala' && !st.unlocked ? 'Gala locked' : item.name; b.disabled = key === 'gala' && !st.unlocked; b.className = key === st.mode ? 'is-active' : ''; b.addEventListener('click', () => start(key)); modeBox.append(b); });
      status.innerHTML = `<div class="mnw-chip"><strong>Selected:</strong> room ${Math.floor(st.selected / 5) + 1}-${(st.selected % 5) + 1}, ${dist(st.pos, st.selected)} steps away.</div><div class="mnw-chip"><strong>Decoys:</strong> ${st.decoys}. <strong>Secured:</strong> ${st.secured}. <strong>Unlock:</strong> ${st.unlocked ? 'Midnight gala ready' : `${Math.max(0, m.target - st.score)} points to gala`}.</div>`;
      if (!st.low) { map.classList.remove('mnw-pop'); void map.offsetWidth; map.classList.add('mnw-pop'); }
    }
    root.addEventListener('click', (event) => {
      const act = event.target.closest('button')?.dataset.act; if (!act) return;
      if (act === 'move') move();
      if (act === 'scan') scan();
      if (act === 'secure') secure();
      if (act === 'decoy') decoy();
      if (act === 'rest') rest();
      if (act === 'reset') start(st.mode);
      if (act === 'sound') { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); tone('good'); }
    });
    root.addEventListener('keydown', (event) => {
      const r = Math.floor(st.selected / 5), c = st.selected % 5;
      const keys = { ArrowUp: r > 0 ? st.selected - 5 : st.selected, ArrowDown: r < 4 ? st.selected + 5 : st.selected, ArrowLeft: c > 0 ? st.selected - 1 : st.selected, ArrowRight: c < 4 ? st.selected + 1 : st.selected };
      if (event.key in keys) { event.preventDefault(); select(keys[event.key]); }
      if (event.key.toLowerCase() === 'm') move();
      if (event.key.toLowerCase() === 's') scan();
      if (event.key.toLowerCase() === 'a') secure();
      if (event.key.toLowerCase() === 'd') decoy();
      if (event.key.toLowerCase() === 'b') rest();
    });
    start('quiet');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
