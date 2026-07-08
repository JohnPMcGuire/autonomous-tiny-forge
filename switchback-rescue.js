(() => {
  const APP = {
    name: 'Switchback Rescue', emoji: '🚑', category: 'play', version: '1.0.0',
    summary: 'Dispatch ambulances across blocked switchbacks while triage clocks, fuel, and hospital beds run tight.',
    description: 'A local emergency-dispatch strategy game with route planning, triage timers, fuel, hospital capacity, road closures, repair crews, adaptive incidents, session-only night storm unlocks, scoring, mobile tap controls, keyboard support, reduced-motion behavior, optional audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const size = 7;
  const modes = {
    day: { name: 'Day shift', rounds: 6, fuel: 26, repairs: 2, beds: 4, closures: 4 },
    surge: { name: 'Surge drill', rounds: 8, fuel: 24, repairs: 2, beds: 4, closures: 6 },
    storm: { name: 'Night storm', rounds: 9, fuel: 23, repairs: 3, beds: 3, closures: 8 }
  };
  const severity = [
    { id: 'red', name: 'Red', limit: 5, points: 90 },
    { id: 'amber', name: 'Amber', limit: 7, points: 70 },
    { id: 'green', name: 'Green', limit: 10, points: 50 }
  ];
  const lowMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const key = (x, y) => `${x},${y}`;
  const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  function ensureStyles() {
    if ($('#switchback-rescue-styles')) return;
    const style = document.createElement('style');
    style.id = 'switchback-rescue-styles';
    style.textContent = `
      .rescue-card{animation:rescue-pop .24s ease both}.rescue-game{max-width:1120px;gap:14px}.rescue-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.rescue-stat,.rescue-map,.rescue-panel,.rescue-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.rescue-stat{padding:10px 12px}.rescue-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.rescue-stat strong{display:block;margin-top:4px}.rescue-layout{display:grid;grid-template-columns:1fr .94fr;gap:12px}.rescue-map{padding:12px;background:linear-gradient(135deg,#10223a,#134e4a);color:#fff;overflow:hidden}.rescue-grid{display:grid;grid-template-columns:repeat(7,minmax(34px,1fr));gap:6px;touch-action:manipulation}.rescue-cell{aspect-ratio:1;border:1px solid rgba(255,255,255,.22);border-radius:13px;background:rgba(255,255,255,.11);color:#fff;font-weight:900;position:relative;display:grid;place-items:center;min-width:0}.rescue-cell:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.rescue-cell.is-road{background:rgba(255,255,255,.16)}.rescue-cell.is-blocked{background:repeating-linear-gradient(45deg,rgba(248,113,113,.34),rgba(248,113,113,.34) 7px,rgba(127,29,29,.46) 7px,rgba(127,29,29,.46) 14px)}.rescue-cell.is-route{box-shadow:0 0 0 3px #fef08a inset}.rescue-cell.is-ambulance{box-shadow:0 0 0 3px #a7f3d0 inset}.rescue-cell.is-incident{box-shadow:0 0 0 3px #fecaca inset}.rescue-cell.is-hospital{box-shadow:0 0 0 3px #bfdbfe inset}.rescue-icon{font-size:clamp(1rem,4vw,1.55rem);line-height:1}.rescue-timer{position:absolute;right:4px;bottom:3px;font-size:.62rem;border-radius:999px;padding:1px 5px;background:rgba(15,23,42,.7)}.rescue-panel{padding:14px;display:grid;gap:12px}.rescue-brief{padding:13px;background:#f8fafc}.rescue-brief h3{margin:.2rem 0;font-size:1.16rem}.rescue-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.rescue-actions button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.rescue-list{display:grid;gap:7px}.rescue-chip{border:1px solid var(--line);border-radius:14px;background:#fff;padding:8px 10px;font-size:.82rem}.rescue-chip.is-hot{background:#fee2e2}.rescue-chip.is-done{background:#dcfce7}.rescue-log{min-height:104px;padding:17px 19px}.rescue-pulse{animation:rescue-pulse .7s ease both}@media(max-width:860px){.rescue-hud{grid-template-columns:repeat(2,1fr)}.rescue-layout{grid-template-columns:1fr}.rescue-grid{gap:5px}.rescue-cell{border-radius:11px}.rescue-actions{grid-template-columns:1fr 1fr}}@media(max-width:520px){.rescue-map,.rescue-panel{padding:9px}.rescue-grid{gap:4px}.rescue-cell{border-radius:9px}.rescue-hud{gap:6px}.rescue-stat{padding:9px}.rescue-actions{grid-template-columns:1fr}.rescue-icon{font-size:1rem}}@media(prefers-reduced-motion:reduce){.rescue-card,.rescue-pulse{animation:none;transition:none}}@keyframes rescue-pop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes rescue-pulse{0%{transform:scale(.98)}50%{transform:scale(1.04)}100%{transform:scale(1)}}
    `;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-switchback-rescue-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.switchbackRescueCard = 'true';
    card.classList.add('rescue-card');
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
    const retry = () => { addCard(); if (!$('[data-switchback-rescue-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.switchbackRescueRefresh) return;
      button.dataset.switchbackRescueRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Switchback%20Rescue';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel rescue-game';
    root.innerHTML = `<div class="rescue-hud"><div class="rescue-stat"><span>Mode</span><strong id="sr-mode">Day shift</strong></div><div class="rescue-stat"><span>Incident</span><strong id="sr-round">1 / 6</strong></div><div class="rescue-stat"><span>Fuel</span><strong id="sr-fuel">26</strong></div><div class="rescue-stat"><span>Repairs</span><strong id="sr-repairs">2</strong></div><div class="rescue-stat"><span>Beds</span><strong id="sr-beds">4</strong></div><div class="rescue-stat"><span>Score</span><strong id="sr-score">0</strong></div></div><div class="rescue-layout"><div class="rescue-map"><div class="rescue-grid" aria-label="Rescue road grid"></div></div><div class="rescue-panel"><div class="rescue-brief"></div><div class="rescue-list" aria-label="Active incidents"></div><div class="rescue-actions"><button class="button" type="button" data-act="dispatch">Dispatch route</button><button class="button button-secondary" type="button" data-act="repair">Repair selected road</button><button class="button button-secondary" type="button" data-act="triage">Stabilize patient</button><button class="button button-secondary" type="button" data-act="mode">Change mode</button><button class="button button-secondary" type="button" data-act="reset">New map</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card rescue-log" aria-live="polite"></div>`;
    stage.append(root);
    const grid = $('.rescue-grid', root), brief = $('.rescue-brief', root), list = $('.rescue-list', root), log = $('.rescue-log', root);
    const st = { mode: 'day', round: 1, fuel: 26, repairs: 2, beds: 4, score: 0, saved: 0, lost: 0, route: [], ambulance: { x: 0, y: 6 }, hospital: { x: 6, y: 0 }, blocked: new Set(), incidents: [], selected: null, sound: false, ac: null, unlocked: false, low: lowMotion() };
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });

    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: arrows move route, Enter dispatches, R repairs a selected closure, T stabilizes the hottest patient, M changes mode.</small>`; }
    function tone(kind) {
      if (!st.sound && kind !== 'bad') return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume();
      const osc = st.ac.createOscillator(), gain = st.ac.createGain();
      osc.type = kind === 'bad' ? 'sawtooth' : 'triangle'; osc.frequency.value = kind === 'good' ? 660 : kind === 'tick' ? 330 : 150;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.06, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .22);
      osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .24);
    }
    function roads() {
      const cells = [];
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) cells.push({ x, y });
      return cells.filter((c) => c.x === 0 || c.y === 0 || c.x === size - 1 || c.y === size - 1 || c.x === 3 || c.y === 3 || (c.x + c.y) % 2 === 0);
    }
    function isRoad(c) { return c && roads().some((r) => r.x === c.x && r.y === c.y); }
    function cellAt(x, y) { return x >= 0 && y >= 0 && x < size && y < size ? { x, y } : null; }
    function makeMap() {
      st.route = [st.ambulance]; st.blocked.clear(); st.incidents = []; st.selected = null;
      const mode = modes[st.mode], all = roads().filter((c) => dist(c, st.ambulance) > 1 && dist(c, st.hospital) > 1 && c.x !== 3 && c.y !== 3);
      while (st.blocked.size < mode.closures && all.length) { const spot = all.splice(Math.floor(Math.random() * all.length), 1)[0]; st.blocked.add(key(spot.x, spot.y)); }
      spawnIncident(); spawnIncident(); render();
    }
    function spawnIncident() {
      const open = roads().filter((c) => !st.blocked.has(key(c.x, c.y)) && dist(c, st.ambulance) > 1 && dist(c, st.hospital) > 1 && !st.incidents.some((i) => i.x === c.x && i.y === c.y));
      const spot = open[Math.floor(Math.random() * open.length)] || { x: 3, y: 3 };
      const sev = severity[Math.min(severity.length - 1, Math.floor(Math.random() * severity.length) + (st.mode === 'storm' ? 1 : 0))];
      st.incidents.push({ ...spot, severity: sev.id, label: sev.name, limit: sev.limit, timer: sev.limit, points: sev.points, done: false });
    }
    function chooseMode(next) {
      const keys = Object.keys(modes); st.mode = next || keys[(keys.indexOf(st.mode) + 1) % (st.unlocked ? 3 : 2)];
      const mode = modes[st.mode]; st.round = 1; st.fuel = mode.fuel; st.repairs = mode.repairs; st.beds = mode.beds; st.score = 0; st.saved = 0; st.lost = 0; st.ambulance = { x: 0, y: 6 };
      makeMap(); note(`${mode.name} ready. Build a route to a patient, then to the hospital before triage time runs out.`);
    }
    function hud() {
      const mode = modes[st.mode]; $('#sr-mode', root).textContent = mode.name; $('#sr-round', root).textContent = `${Math.min(st.round, mode.rounds)} / ${mode.rounds}`; $('#sr-fuel', root).textContent = st.fuel; $('#sr-repairs', root).textContent = st.repairs; $('#sr-beds', root).textContent = st.beds; $('#sr-score', root).textContent = st.score;
    }
    function render() {
      hud(); grid.replaceChildren();
      const roadKeys = new Set(roads().map((c) => key(c.x, c.y))), routeKeys = new Set(st.route.map((c) => key(c.x, c.y)));
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const k = key(x, y), cell = document.createElement('button'); cell.type = 'button'; cell.className = 'rescue-cell'; cell.dataset.x = x; cell.dataset.y = y; cell.tabIndex = roadKeys.has(k) ? 0 : -1;
        if (roadKeys.has(k)) cell.classList.add('is-road'); if (st.blocked.has(k)) cell.classList.add('is-blocked'); if (routeKeys.has(k)) cell.classList.add('is-route');
        if (x === st.ambulance.x && y === st.ambulance.y) cell.classList.add('is-ambulance'); if (x === st.hospital.x && y === st.hospital.y) cell.classList.add('is-hospital');
        const incident = st.incidents.find((i) => i.x === x && i.y === y && !i.done); if (incident) cell.classList.add('is-incident');
        let icon = roadKeys.has(k) ? '·' : ''; if (st.blocked.has(k)) icon = '×'; if (x === st.hospital.x && y === st.hospital.y) icon = 'H'; if (incident) icon = incident.severity === 'red' ? '!' : incident.severity === 'amber' ? '•' : '+'; if (x === st.ambulance.x && y === st.ambulance.y) icon = 'A';
        cell.innerHTML = `<span class="rescue-icon">${icon}</span>${incident ? `<span class="rescue-timer">${incident.timer}</span>` : ''}`;
        cell.setAttribute('aria-label', describeCell(x, y, incident));
        cell.addEventListener('click', () => tapCell({ x, y })); grid.append(cell);
      }
      list.replaceChildren(...st.incidents.map((i) => { const chip = document.createElement('div'); chip.className = `rescue-chip${i.timer <= 3 && !i.done ? ' is-hot' : ''}${i.done ? ' is-done' : ''}`; chip.textContent = `${i.label} call at ${i.x + 1},${i.y + 1}: ${i.done ? 'transported' : `${i.timer} ticks left`}`; return chip; }));
      brief.innerHTML = `<h3>${st.unlocked ? 'Storm desk unlocked' : 'Mountain switchback desk'}</h3><p>Tap adjacent roads to extend a route. Dispatch only works when the route reaches a live patient and the hospital. Repairs reopen selected closures. Stabilize buys one tick for the hottest call.</p>`;
    }
    function describeCell(x, y, incident) {
      if (x === st.ambulance.x && y === st.ambulance.y) return 'Ambulance base';
      if (x === st.hospital.x && y === st.hospital.y) return `Hospital with ${st.beds} beds`;
      if (incident) return `${incident.label} incident with ${incident.timer} ticks left`;
      if (st.blocked.has(key(x, y))) return 'Closed road, selectable for repair';
      return isRoad({ x, y }) ? 'Open road' : 'Off-road terrain';
    }
    function tapCell(c) {
      if (!isRoad(c)) return;
      const k = key(c.x, c.y); st.selected = c;
      if (st.blocked.has(k)) { note('Closure selected. Use repair to reopen it, or route around it.'); render(); return; }
      const last = st.route[st.route.length - 1];
      if (st.route.length > 1 && key(c.x, c.y) === key(st.route[st.route.length - 2].x, st.route[st.route.length - 2].y)) st.route.pop();
      else if (dist(last, c) === 1 && !st.route.some((r) => r.x === c.x && r.y === c.y)) st.route.push(c);
      else if (key(c.x, c.y) === key(st.ambulance.x, st.ambulance.y)) st.route = [st.ambulance];
      else { note('Routes must extend one road segment at a time without crossing closures.'); tone('bad'); }
      render();
    }
    function move(dx, dy) { const last = st.route[st.route.length - 1]; tapCell(cellAt(last.x + dx, last.y + dy)); }
    function repair() {
      if (!st.selected || !st.blocked.has(key(st.selected.x, st.selected.y))) { note('Select a closed road first.'); return; }
      if (st.repairs <= 0) { note('No repair crews remain. Route around the closure.'); tone('bad'); return; }
      st.blocked.delete(key(st.selected.x, st.selected.y)); st.repairs -= 1; st.score = Math.max(0, st.score - 12); tone('tick'); note('Road reopened. The dispatch desk paid a small score cost to preserve access.'); render();
    }
    function stabilize() {
      const hot = st.incidents.filter((i) => !i.done).sort((a, b) => a.timer - b.timer)[0];
      if (!hot || st.fuel <= 1) { note('No stabilizable patient, or fuel is too low.'); return; }
      st.fuel -= 1; hot.timer += 1; st.score = Math.max(0, st.score - 8); tone('tick'); note(`Stabilized the ${hot.label} call for one tick. You bought time, but spent fuel and score.`); render();
    }
    function dispatch() {
      const patientIndex = st.route.findIndex((c) => st.incidents.some((i) => !i.done && i.x === c.x && i.y === c.y));
      const reachesHospital = patientIndex >= 0 && st.route.some((c, i) => i > patientIndex && c.x === st.hospital.x && c.y === st.hospital.y);
      if (patientIndex < 0 || !reachesHospital) { note('Dispatch route must touch a live patient and then the hospital.'); tone('bad'); return; }
      const patient = st.incidents.find((i) => !i.done && i.x === st.route[patientIndex].x && i.y === st.route[patientIndex].y);
      const cost = Math.max(1, st.route.length - 1);
      if (cost > st.fuel) { note('Not enough fuel for that route. Shorten it or repair a direct road.'); tone('bad'); return; }
      if (st.beds <= 0) { note('Hospital beds are full. Stabilize or change mode for a fresh run.'); tone('bad'); return; }
      st.fuel -= cost; st.beds -= 1; patient.done = true; st.saved += 1;
      const bonus = Math.max(0, patient.timer) * 4 + Math.max(0, 12 - cost);
      st.score += patient.points + bonus; st.ambulance = { ...st.hospital }; st.route = [st.ambulance]; tone('good'); advance(`Transport complete. ${patient.label} patient saved with ${patient.timer} ticks left.`);
    }
    function advance(message) {
      st.round += 1;
      for (const item of st.incidents) if (!item.done) item.timer -= 1;
      const expired = st.incidents.filter((i) => !i.done && i.timer <= 0);
      for (const item of expired) { item.done = true; st.lost += 1; st.score = Math.max(0, st.score - 35); }
      if (expired.length) { message += ` ${expired.length} call${expired.length > 1 ? 's' : ''} timed out during the move.`; tone('bad'); }
      if (st.round <= modes[st.mode].rounds) spawnIncident();
      if (st.saved >= 4 && !st.unlocked) { st.unlocked = true; message += ' Night storm mode unlocked for this session.'; }
      if (st.round > modes[st.mode].rounds || st.fuel <= 0 || st.beds <= 0) finish(message);
      else { note(message); render(); $('.rescue-map', root)?.classList.add('rescue-pulse'); setTimeout(() => $('.rescue-map', root)?.classList.remove('rescue-pulse'), st.low ? 0 : 720); }
    }
    function finish(message) {
      const rating = st.saved >= 5 && st.lost === 0 ? 'gold response' : st.saved >= 4 ? 'stable response' : 'strained response';
      note(`${message} Shift complete: ${rating}. Saved ${st.saved}, lost ${st.lost}, score ${st.score}. Start a new map to chase a cleaner route.`); render();
    }
    root.addEventListener('click', (event) => {
      const act = event.target.closest('button')?.dataset.act; if (!act) return;
      if (act === 'dispatch') dispatch(); if (act === 'repair') repair(); if (act === 'triage') stabilize(); if (act === 'mode') chooseMode(); if (act === 'reset') chooseMode(st.mode);
      if (act === 'sound') { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); tone('tick'); }
    });
    root.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowUp') { event.preventDefault(); move(0, -1); }
      if (event.key === 'ArrowDown') { event.preventDefault(); move(0, 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1, 0); }
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1, 0); }
      if (event.key === 'Enter') dispatch(); if (event.key.toLowerCase() === 'r') repair(); if (event.key.toLowerCase() === 't') stabilize(); if (event.key.toLowerCase() === 'm') chooseMode();
    });
    chooseMode('day');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
