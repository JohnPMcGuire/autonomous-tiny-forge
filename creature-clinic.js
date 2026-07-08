(() => {
  const APP = {
    name: 'Creature Clinic', emoji: '🐾', category: 'play', version: '1.0.0',
    summary: 'Diagnose odd little patients, spend scarce clinic resources, and recover trust before closing time.',
    description: 'A local animal-clinic strategy game with patient triage, branching treatments, vitals, time, budget, trust, staff fatigue, specialist unlocks, scoring, keyboard and touch controls, reduced-motion behavior, optional audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const lowMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const modes = {
    cozy: { name: 'Cozy shift', rounds: 5, time: 26, budget: 20, trust: 62, staff: 8, target: 380 },
    rush: { name: 'After-school rush', rounds: 6, time: 24, budget: 18, trust: 58, staff: 7, target: 520 },
    specialist: { name: 'Specialist night', rounds: 7, time: 23, budget: 17, trust: 56, staff: 7, target: 660 }
  };
  const patients = [
    { name: 'Mochi', kind: 'ferret', worry: 'wobbly sprinting and glittery sneezes', need: 'hydrate', clue: 'dry nose', color: '#fef3c7' },
    { name: 'Beans', kind: 'pug', worry: 'dramatic sighs after every snack', need: 'scan', clue: 'tender belly', color: '#fde68a' },
    { name: 'Juniper', kind: 'rabbit', worry: 'hiding behind the carrier towel', need: 'comfort', clue: 'fast pulse', color: '#dcfce7' },
    { name: 'Pickle', kind: 'cat', worry: 'mystery limp that appears near dinner', need: 'splint', clue: 'warm paw', color: '#dbeafe' },
    { name: 'Nimbus', kind: 'gecko', worry: 'stuck shed and offended blinking', need: 'hydrate', clue: 'dull scales', color: '#ccfbf1' },
    { name: 'Taffy', kind: 'goat', worry: 'ate part of the appointment card', need: 'scan', clue: 'paper breath', color: '#fce7f3' },
    { name: 'Orbit', kind: 'parrot', worry: 'copies the fire alarm perfectly', need: 'comfort', clue: 'ruffled feathers', color: '#e0e7ff' }
  ];
  const tools = [
    { id: 'examine', name: 'Examine', key: '1', time: 2, cost: 0, staff: 0, text: 'reveals the strongest clue' },
    { id: 'hydrate', name: 'Fluids', key: '2', time: 3, cost: 3, staff: 1, text: 'helps dehydration and sheds' },
    { id: 'scan', name: 'Scan', key: '3', time: 4, cost: 5, staff: 1, text: 'finds swallowed or hidden trouble' },
    { id: 'comfort', name: 'Calm room', key: '4', time: 3, cost: 2, staff: 2, text: 'stabilizes anxious patients' },
    { id: 'splint', name: 'Splint', key: '5', time: 4, cost: 4, staff: 1, text: 'treats warm paws and limps' },
    { id: 'special', name: 'Specialist', key: '6', time: 5, cost: 6, staff: 2, text: 'expensive rescue for uncertain cases' }
  ];

  function ensureStyles() {
    if ($('#creature-clinic-styles')) return;
    const style = document.createElement('style');
    style.id = 'creature-clinic-styles';
    style.textContent = `.cc-card{animation:cc-rise .24s ease both}.cc-game{max-width:1120px;gap:14px}.cc-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.cc-stat,.cc-stage,.cc-panel,.cc-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.cc-stat{padding:10px 12px}.cc-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.cc-stat strong{display:block;margin-top:4px}.cc-layout{display:grid;grid-template-columns:1fr .98fr;gap:12px}.cc-stage{position:relative;min-height:340px;padding:16px;overflow:hidden;background:radial-gradient(circle at 32% 18%,#fef3c7,#dbeafe 52%,#e0e7ff);display:grid;place-items:center}.cc-table{position:absolute;left:7%;right:7%;bottom:12%;height:76px;border-radius:50% 50% 18px 18px;background:#78350f;box-shadow:0 18px 0 #451a03}.cc-patient{position:relative;z-index:1;width:min(70%,310px);min-height:190px;border-radius:36px 36px 42px 42px;border:2px solid rgba(15,23,42,.12);display:grid;place-items:center;text-align:center;padding:22px;box-shadow:0 18px 38px rgba(15,23,42,.18)}.cc-face{font-size:4rem;line-height:1}.cc-patient strong{display:block;font-size:clamp(1.35rem,4vw,2.4rem);letter-spacing:-.04em}.cc-vitals{position:absolute;inset:12px auto auto 12px;display:grid;gap:6px}.cc-pill{border:1px solid rgba(15,23,42,.14);border-radius:999px;background:rgba(255,255,255,.78);padding:6px 10px;font-size:.75rem;font-weight:900}.cc-meter{position:absolute;right:14px;top:14px;width:18px;height:150px;border-radius:999px;background:rgba(15,23,42,.15);overflow:hidden}.cc-meter span{position:absolute;left:0;right:0;bottom:0;background:#22c55e}.cc-panel{padding:14px;display:grid;gap:12px}.cc-brief{padding:13px;background:#f8fafc}.cc-brief h3{margin:.2rem 0;font-size:1.12rem}.cc-tools{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.cc-tools button,.cc-actions button{min-height:44px}.cc-tools button.is-best{box-shadow:0 0 0 3px #bbf7d0 inset}.cc-tools button.is-used{opacity:.62}.cc-tools button:focus-visible,.cc-actions button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.cc-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.cc-list{display:grid;gap:7px}.cc-chip{border:1px solid var(--line);border-radius:14px;background:#fff;padding:8px 10px;font-size:.82rem}.cc-chip.is-alert{background:#fee2e2}.cc-chip.is-good{background:#dcfce7}.cc-log{min-height:112px;padding:17px 19px}.cc-pulse{animation:cc-pulse .5s ease both}.cc-shake{animation:cc-shake .32s ease both}@media(max-width:860px){.cc-hud{grid-template-columns:repeat(2,1fr)}.cc-layout{grid-template-columns:1fr}.cc-stage{min-height:292px}.cc-actions{grid-template-columns:1fr 1fr}}@media(max-width:520px){.cc-stage,.cc-panel{padding:9px}.cc-stage{min-height:254px}.cc-tools,.cc-actions{grid-template-columns:1fr}.cc-patient{width:82%;min-height:165px}.cc-face{font-size:3.2rem}.cc-meter{height:118px}}@media(prefers-reduced-motion:reduce){.cc-card,.cc-pulse,.cc-shake{animation:none;transition:none}}@keyframes cc-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes cc-pulse{0%{transform:scale(.98)}60%{transform:scale(1.025)}100%{transform:none}}@keyframes cc-shake{0%,100%{transform:none}35%{transform:translateX(-5px)}70%{transform:translateX(5px)}}`;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-creature-clinic-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.creatureClinicCard = 'true';
    card.classList.add('cc-card');
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
    const retry = () => { addCard(); if (!$('[data-creature-clinic-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.creatureClinicRefresh) return;
      button.dataset.creatureClinicRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Creature%20Clinic';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel cc-game';
    root.innerHTML = `<div class="cc-hud"><div class="cc-stat"><span>Mode</span><strong id="cc-mode">Cozy shift</strong></div><div class="cc-stat"><span>Patient</span><strong id="cc-round">1 / 5</strong></div><div class="cc-stat"><span>Time</span><strong id="cc-time">26</strong></div><div class="cc-stat"><span>Budget</span><strong id="cc-budget">20</strong></div><div class="cc-stat"><span>Trust</span><strong id="cc-trust">62</strong></div><div class="cc-stat"><span>Score</span><strong id="cc-score">0</strong></div></div><div class="cc-layout"><div class="cc-stage" aria-label="Clinic exam room"><div class="cc-vitals"></div><div class="cc-meter" aria-hidden="true"><span></span></div><div class="cc-patient" tabindex="0" aria-label="Current patient"><div><div class="cc-face">🐶</div><strong id="cc-name">Ready</strong><small id="cc-note">Choose a mode and start triage.</small></div></div><div class="cc-table" aria-hidden="true"></div></div><div class="cc-panel"><div class="cc-brief"></div><div class="cc-tools" aria-label="Clinic tools"></div><div class="cc-list" aria-label="Shift status"></div><div class="cc-actions"><button class="button" type="button" data-act="discharge">Discharge patient</button><button class="button button-secondary" type="button" data-act="rest">Staff breather</button><button class="button button-secondary" type="button" data-act="mode">Change mode</button><button class="button button-secondary" type="button" data-act="reset">New shift</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card cc-log" aria-live="polite"></div>`;
    stage.append(root);
    const st = { mode: 'cozy', round: 1, time: 26, budget: 20, trust: 62, staff: 8, score: 0, clues: 0, treated: [], solved: false, unlocked: false, sound: false, ac: null, low: lowMotion() };
    const brief = $('.cc-brief', root), toolBox = $('.cc-tools', root), status = $('.cc-list', root), log = $('.cc-log', root), patientBox = $('.cc-patient', root), vitals = $('.cc-vitals', root);
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });
    function mode() { return modes[st.mode]; }
    function patient() { return patients[(st.round - 1 + (st.mode === 'rush' ? 2 : 0)) % patients.length]; }
    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: 1-6 clinic tools, Enter discharges, R rests staff, M changes mode.</small>`; }
    function tone(kind) {
      if (!st.sound && kind !== 'bad') return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume();
      const osc = st.ac.createOscillator(), gain = st.ac.createGain();
      osc.type = kind === 'bad' ? 'sawtooth' : 'sine'; osc.frequency.value = kind === 'good' ? 760 : kind === 'tick' ? 460 : 190;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.055, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .22);
      osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .24);
    }
    function reset(next) {
      const keys = Object.keys(modes);
      st.mode = next || keys[(keys.indexOf(st.mode) + 1) % (st.unlocked ? 3 : 2)];
      const m = mode();
      st.round = 1; st.time = m.time; st.budget = m.budget; st.trust = m.trust; st.staff = m.staff; st.score = 0; st.clues = 0; st.treated = []; st.solved = false;
      render(); note(`${m.name} opened. Examine before expensive treatments, protect staff, and discharge only when the case is stable.`);
    }
    function applyTool(id) {
      const t = tools.find((x) => x.id === id), p = patient();
      if (!t || st.treated.includes(id)) return;
      if (t.id === 'special' && !st.unlocked && st.mode !== 'specialist') { note('Specialist night unlocks after a strong shift. Use the regular tools first.'); return; }
      if (st.time < t.time || st.budget < t.cost || st.staff < t.staff) { st.trust -= 5; note('The clinic overpromised. Rest, discharge carefully, or start a smaller shift.'); pulse(false); tone('bad'); render(); return; }
      st.time -= t.time; st.budget -= t.cost; st.staff -= t.staff; st.treated.push(id);
      const good = id === p.need || id === 'examine' || id === 'special';
      if (id === 'examine') { st.clues = Math.min(3, st.clues + 1); st.trust += 3; st.score += 22; }
      else if (id === p.need) { st.solved = true; st.trust += 8 + st.clues; st.score += 70 + st.clues * 12; }
      else if (id === 'special') { st.solved = true; st.trust += 4; st.score += 42; }
      else { st.trust -= 7; st.score = Math.max(0, st.score - 18); }
      pulse(good); tone(good ? 'good' : 'bad');
      render();
      note(good ? `${t.name} helped. ${p.name} is closer to a clean discharge.` : `${t.name} was not the right branch. The owner is worried, but you can still recover.`);
    }
    function discharge() {
      const p = patient();
      if (st.solved) { st.score += 55 + st.trust + st.time + st.staff * 3; st.trust += 4; note(`${p.name} went home stable. Clean chart, grateful owner, next carrier coming in.`); tone('good'); }
      else { st.trust -= 12; st.score = Math.max(0, st.score - 30); note(`${p.name} left with an uncertain plan. That saves time but damages trust.`); tone('bad'); }
      st.round += 1; st.clues = 0; st.treated = []; st.solved = false;
      if (st.round > mode().rounds || st.trust <= 0 || st.time <= 0) finish(); else render();
    }
    function rest() {
      if (st.time < 2) { note('No time left for a breather. Make the best safe discharge.'); return; }
      st.time -= 2; st.staff = Math.min(mode().staff + 2, st.staff + 3); st.trust += 1; render(); note('The team breathes, cleans the table, and gets enough focus back for better choices.'); tone('tick');
    }
    function finish() {
      const won = st.score >= mode().target && st.trust > 28;
      st.unlocked ||= won;
      render();
      note(won ? `Shift saved. Score ${st.score}. Specialist night is unlocked for this session.` : `Shift closed at ${st.score}. Replay with more examinations before expensive guesses.`);
    }
    function pulse(good) {
      if (st.low) return;
      patientBox.classList.remove('cc-pulse','cc-shake'); void patientBox.offsetWidth;
      patientBox.classList.add(good ? 'cc-pulse' : 'cc-shake');
    }
    function render() {
      const m = mode(), p = patient();
      $('#cc-mode', root).textContent = m.name;
      $('#cc-round', root).textContent = `${Math.min(st.round, m.rounds)} / ${m.rounds}`;
      $('#cc-time', root).textContent = st.time;
      $('#cc-budget', root).textContent = st.budget;
      $('#cc-trust', root).textContent = Math.max(0, st.trust);
      $('#cc-score', root).textContent = st.score;
      patientBox.style.background = p.color;
      $('#cc-name', root).textContent = `${p.name} the ${p.kind}`;
      $('#cc-note', root).textContent = p.worry;
      $('.cc-face', root).textContent = p.kind === 'cat' ? '🐱' : p.kind === 'rabbit' ? '🐰' : p.kind === 'goat' ? '🐐' : p.kind === 'parrot' ? '🦜' : p.kind === 'gecko' ? '🦎' : p.kind === 'ferret' ? '🦦' : '🐶';
      $('.cc-meter span', root).style.height = `${Math.max(6, Math.min(100, st.trust))}%`;
      vitals.innerHTML = `<span class="cc-pill">${st.clues ? `Clue: ${p.clue}` : 'Clue hidden'}</span><span class="cc-pill">Staff ${st.staff}</span><span class="cc-pill">${st.solved ? 'Stable' : 'Unstable'}</span>`;
      brief.innerHTML = `<h3>${p.name}'s owner says: ${p.worry}</h3><p>Find the right branch before discharge. Examine reveals the strongest clue; wrong treatments cost trust, but staff breathers can recover focus.</p>`;
      toolBox.replaceChildren();
      tools.forEach((t) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'button button-secondary';
        b.innerHTML = `${t.key}. ${t.name}<br><small>${t.time}m · $${t.cost} · ${t.text}</small>`;
        b.disabled = st.round > m.rounds || st.trust <= 0 || st.treated.includes(t.id);
        b.classList.toggle('is-used', st.treated.includes(t.id));
        b.classList.toggle('is-best', t.id === p.need && st.clues);
        b.addEventListener('click', () => applyTool(t.id));
        toolBox.append(b);
      });
      status.innerHTML = `<div class="cc-chip ${st.time <= 6 ? 'is-alert' : 'is-good'}">Clock: ${st.time <= 6 ? 'closing soon' : 'usable margin'}</div><div class="cc-chip ${st.budget <= 4 ? 'is-alert' : 'is-good'}">Budget: ${st.budget <= 4 ? 'scan carefully' : 'treat when confident'}</div><div class="cc-chip ${st.trust <= 30 ? 'is-alert' : 'is-good'}">Trust: ${st.trust <= 30 ? 'fragile' : 'recoverable'}</div>`;
    }
    root.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'discharge') discharge();
      if (act === 'rest') rest();
      if (act === 'mode') reset();
      if (act === 'reset') reset(st.mode);
      if (act === 'sound') { st.sound = !st.sound; e.target.textContent = st.sound ? 'Sound on' : 'Sound off'; e.target.setAttribute('aria-pressed', String(st.sound)); tone('tick'); }
    });
    const keys = (e) => {
      if (!dialog.open) return;
      const n = Number(e.key);
      if (n >= 1 && n <= tools.length) { e.preventDefault(); applyTool(tools[n - 1].id); }
      if (e.key === 'Enter') { e.preventDefault(); discharge(); }
      if (e.key.toLowerCase() === 'r') { e.preventDefault(); rest(); }
      if (e.key.toLowerCase() === 'm') { e.preventDefault(); reset(); }
    };
    window.addEventListener('keydown', keys);
    dialog.addEventListener('close', () => window.removeEventListener('keydown', keys), { once: true });
    reset('cozy');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
