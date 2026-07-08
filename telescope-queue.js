(() => {
  const APP = {
    name: 'Telescope Queue', emoji: '🔭', category: 'play', version: '1.0.0',
    summary: 'Schedule telescope observations through clouds, calibration drift, battery limits, and science goals.',
    description: 'A local astronomy scheduling strategy game with observation windows, drifting weather, calibration, battery, contracts, recovery choices, adaptive nights, session-only deep-field unlock, scoring, mobile tap controls, keyboard support, reduced-motion behavior, optional audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const targets = [
    { id: 'nebula', name: 'Nebula veil', icon: '✦', hour: 1, need: 2, type: 'image', points: 70 },
    { id: 'comet', name: 'Fast comet', icon: '☄', hour: 2, need: 1, type: 'track', points: 55 },
    { id: 'cluster', name: 'Open cluster', icon: '⋆', hour: 3, need: 2, type: 'image', points: 65 },
    { id: 'transit', name: 'Planet transit', icon: '◐', hour: 4, need: 1, type: 'timing', points: 85 },
    { id: 'pulsar', name: 'Pulsar beat', icon: '◌', hour: 5, need: 2, type: 'timing', points: 90 },
    { id: 'galaxy', name: 'Faint galaxy', icon: '◎', hour: 6, need: 3, type: 'deep', points: 115 }
  ];
  const modes = {
    survey: { name: 'Survey night', hours: 6, battery: 9, calibrate: 2, clouds: 4, quota: 260 },
    crunch: { name: 'Grant deadline', hours: 7, battery: 9, calibrate: 2, clouds: 5, quota: 350 },
    deep: { name: 'Deep field', hours: 8, battery: 10, calibrate: 3, clouds: 6, quota: 430 }
  };
  const lowMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensureStyles() {
    if ($('#telescope-queue-styles')) return;
    const style = document.createElement('style');
    style.id = 'telescope-queue-styles';
    style.textContent = `
      .tq-card{animation:tq-rise .24s ease both}.tq-game{max-width:1120px;gap:14px}.tq-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.tq-stat,.tq-sky,.tq-panel,.tq-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.tq-stat{padding:10px 12px}.tq-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.tq-stat strong{display:block;margin-top:4px}.tq-layout{display:grid;grid-template-columns:1.08fr .92fr;gap:12px}.tq-sky{padding:12px;background:radial-gradient(circle at 25% 10%,#334155,#06111f 68%);color:#fff;overflow:hidden}.tq-grid{display:grid;grid-template-columns:repeat(6,minmax(42px,1fr));gap:7px;touch-action:manipulation}.tq-cell{aspect-ratio:1.05;border:1px solid rgba(255,255,255,.22);border-radius:14px;background:rgba(255,255,255,.1);color:#fff;display:grid;place-items:center;position:relative;min-width:0;font-weight:900}.tq-cell:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.tq-cell.is-selected{box-shadow:0 0 0 3px #fde68a inset}.tq-cell.is-clear{background:rgba(34,197,94,.18)}.tq-cell.is-cloud{background:repeating-linear-gradient(135deg,rgba(148,163,184,.32),rgba(148,163,184,.32) 7px,rgba(51,65,85,.45) 7px,rgba(51,65,85,.45) 14px)}.tq-cell.is-done{box-shadow:0 0 0 3px #a7f3d0 inset}.tq-icon{font-size:clamp(1.05rem,4vw,1.75rem);line-height:1}.tq-hour{position:absolute;left:5px;top:4px;font-size:.62rem;color:rgba(255,255,255,.78)}.tq-need{position:absolute;right:5px;bottom:4px;font-size:.62rem;border-radius:999px;padding:1px 5px;background:rgba(15,23,42,.72)}.tq-panel{padding:14px;display:grid;gap:12px}.tq-brief{padding:13px;background:#f8fafc}.tq-brief h3{margin:.2rem 0;font-size:1.12rem}.tq-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.tq-actions button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.tq-list{display:grid;gap:7px}.tq-chip{border:1px solid var(--line);border-radius:14px;background:#fff;padding:8px 10px;font-size:.82rem}.tq-chip.is-hot{background:#fef3c7}.tq-chip.is-done{background:#dcfce7}.tq-log{min-height:104px;padding:17px 19px}.tq-pulse{animation:tq-pulse .7s ease both}@media(max-width:860px){.tq-hud{grid-template-columns:repeat(2,1fr)}.tq-layout{grid-template-columns:1fr}.tq-grid{gap:5px}.tq-actions{grid-template-columns:1fr 1fr}}@media(max-width:520px){.tq-sky,.tq-panel{padding:9px}.tq-grid{grid-template-columns:repeat(3,1fr);gap:5px}.tq-cell{border-radius:10px}.tq-actions{grid-template-columns:1fr}.tq-icon{font-size:1.1rem}}@media(prefers-reduced-motion:reduce){.tq-card,.tq-pulse{animation:none;transition:none}}@keyframes tq-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes tq-pulse{0%{transform:scale(.98)}50%{transform:scale(1.035)}100%{transform:scale(1)}}
    `;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-telescope-queue-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.telescopeQueueCard = 'true';
    card.classList.add('tq-card');
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
    const retry = () => { addCard(); if (!$('[data-telescope-queue-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.telescopeQueueRefresh) return;
      button.dataset.telescopeQueueRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Telescope%20Queue';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel tq-game';
    root.innerHTML = `<div class="tq-hud"><div class="tq-stat"><span>Mode</span><strong id="tq-mode">Survey night</strong></div><div class="tq-stat"><span>Hour</span><strong id="tq-hour">1 / 6</strong></div><div class="tq-stat"><span>Battery</span><strong id="tq-battery">9</strong></div><div class="tq-stat"><span>Calibration</span><strong id="tq-cal">2</strong></div><div class="tq-stat"><span>Cloud risk</span><strong id="tq-clouds">4</strong></div><div class="tq-stat"><span>Score</span><strong id="tq-score">0</strong></div></div><div class="tq-layout"><div class="tq-sky"><div class="tq-grid" aria-label="Observation target grid"></div></div><div class="tq-panel"><div class="tq-brief"></div><div class="tq-list" aria-label="Observation contracts"></div><div class="tq-actions"><button class="button" type="button" data-act="observe">Observe selected</button><button class="button button-secondary" type="button" data-act="calibrate">Calibrate scope</button><button class="button button-secondary" type="button" data-act="wait">Wait one hour</button><button class="button button-secondary" type="button" data-act="mode">Change mode</button><button class="button button-secondary" type="button" data-act="reset">New night</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card tq-log" aria-live="polite"></div>`;
    stage.append(root);
    const grid = $('.tq-grid', root), brief = $('.tq-brief', root), list = $('.tq-list', root), log = $('.tq-log', root);
    const st = { mode: 'survey', hour: 1, battery: 9, cal: 2, cloud: 4, score: 0, streak: 0, selected: 0, done: new Set(), clouds: new Set(), sound: false, ac: null, unlocked: false, low: lowMotion() };
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });

    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: arrows choose targets, Enter observes, C calibrates, W waits, M changes mode.</small>`; }
    function tone(kind) {
      if (!st.sound && kind !== 'bad') return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume();
      const osc = st.ac.createOscillator(), gain = st.ac.createGain();
      osc.type = kind === 'bad' ? 'sawtooth' : 'sine'; osc.frequency.value = kind === 'good' ? 740 : kind === 'tick' ? 460 : 180;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.055, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .2);
      osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .22);
    }
    function mode() { return modes[st.mode]; }
    function visibleTargets() { return targets.filter((t) => st.unlocked || t.type !== 'deep'); }
    function reset(next) {
      const keys = Object.keys(modes);
      st.mode = next || keys[(keys.indexOf(st.mode) + 1) % (st.unlocked ? 3 : 2)];
      const m = mode(); st.hour = 1; st.battery = m.battery; st.cal = m.calibrate; st.cloud = m.clouds; st.score = 0; st.streak = 0; st.done.clear(); st.selected = 0; makeClouds(); render(); note(`${m.name} ready. Sequence observations around clouds, battery, and calibration drift.`);
    }
    function makeClouds() {
      st.clouds.clear();
      const pool = visibleTargets().map((_, i) => i);
      while (st.clouds.size < mode().clouds && pool.length) st.clouds.add(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    function advanceHour(cost = 1) {
      st.hour += cost;
      st.cal = Math.max(0, st.cal - 1);
      if (st.hour % 2 === 0) makeClouds();
      if (st.hour > mode().hours) finish(); else render();
    }
    function finish() {
      const success = st.score >= mode().quota;
      if (success && !st.unlocked) { st.unlocked = true; note(`Night complete at ${st.score}. Deep Field mode unlocked for this session.`); }
      else note(success ? `Published a strong observing run: ${st.score} science points.` : `Dawn arrived at ${st.score}. Replan the queue around windows and calibration.`);
      render();
    }
    function observe() {
      if (st.hour > mode().hours) return reset(st.mode);
      const t = visibleTargets()[st.selected];
      if (!t || st.done.has(t.id)) return note('That target is already complete. Select another contract.');
      if (Math.abs(t.hour - st.hour) > 1) return note(`${t.name} is outside its useful window. Wait or select a target near hour ${st.hour}.`);
      if (st.battery < t.need) return note('Battery is too low for that exposure. Wait is not enough; choose a lighter target or restart the night.');
      const cloudy = st.clouds.has(st.selected);
      const calBonus = st.cal > 0 ? 16 : -22;
      const windowBonus = t.hour === st.hour ? 18 : -8;
      const cloudPenalty = cloudy ? 36 : 0;
      const value = Math.max(15, t.points + calBonus + windowBonus - cloudPenalty);
      st.battery -= t.need; st.score += value; st.streak += cloudy ? 0 : 1; st.done.add(t.id);
      if (!st.low) grid.classList.add('tq-pulse'), setTimeout(() => grid.classList.remove('tq-pulse'), 450);
      tone(cloudy ? 'bad' : 'good');
      note(`${t.name} logged for ${value} points${cloudy ? ' through cloud loss' : ''}. Calibration now matters for the next exposure.`);
      advanceHour(1);
    }
    function calibrate() {
      if (st.hour > mode().hours) return reset(st.mode);
      if (st.battery <= 0) return note('No battery remains to slew and calibrate. Dawn review is next.');
      st.battery -= 1; st.cal = Math.min(3, st.cal + 2); tone('tick'); note('Calibration restored. You traded one battery for steadier science value.'); advanceHour(1);
    }
    function waitHour() {
      if (st.hour > mode().hours) return reset(st.mode);
      st.battery = Math.min(mode().battery, st.battery + 1); tone('tick'); note('You waited for the sky to rotate. Battery recovered slightly, but the night advanced.'); advanceHour(1);
    }
    function render() {
      const m = mode();
      $('#tq-mode', root).textContent = m.name; $('#tq-hour', root).textContent = `${Math.min(st.hour, m.hours)} / ${m.hours}`; $('#tq-battery', root).textContent = st.battery; $('#tq-cal', root).textContent = st.cal; $('#tq-clouds', root).textContent = st.clouds.size; $('#tq-score', root).textContent = st.score;
      brief.innerHTML = `<h3>${st.hour > m.hours ? 'Dawn review' : `Hour ${st.hour}: choose the best exposure`}</h3><p>Quota ${m.quota}. Calibration adds value while clouds, bad windows, and battery cost force tradeoffs. Deep Field unlocks after a successful night.</p>`;
      grid.replaceChildren();
      visibleTargets().forEach((t, i) => {
        const cell = document.createElement('button'); cell.type = 'button'; cell.className = 'tq-cell';
        cell.classList.toggle('is-selected', i === st.selected); cell.classList.toggle('is-cloud', st.clouds.has(i)); cell.classList.toggle('is-clear', !st.clouds.has(i)); cell.classList.toggle('is-done', st.done.has(t.id));
        cell.setAttribute('aria-label', `${t.name}, best hour ${t.hour}, needs ${t.need} battery${st.clouds.has(i) ? ', cloudy' : ', clear'}${st.done.has(t.id) ? ', complete' : ''}`);
        cell.innerHTML = `<span class="tq-hour">H${t.hour}</span><span class="tq-icon" aria-hidden="true">${t.icon}</span><span class="tq-need">${t.need}b</span>`;
        cell.addEventListener('click', () => { st.selected = i; render(); }); grid.append(cell);
      });
      list.innerHTML = visibleTargets().map((t, i) => `<div class="tq-chip ${st.done.has(t.id) ? 'is-done' : Math.abs(t.hour - st.hour) <= 1 ? 'is-hot' : ''}"><strong>${t.name}</strong> · ${t.type} · H${t.hour} · ${t.need} battery · ${st.done.has(t.id) ? 'complete' : st.clouds.has(i) ? 'cloud risk' : 'clear'}</div>`).join('');
    }
    root.addEventListener('click', (event) => {
      const act = event.target?.dataset?.act; if (!act) return;
      if (act === 'observe') observe(); if (act === 'calibrate') calibrate(); if (act === 'wait') waitHour(); if (act === 'mode') reset(); if (act === 'reset') reset(st.mode);
      if (act === 'sound') { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); tone('good'); }
    });
    root.addEventListener('keydown', (event) => {
      const max = visibleTargets().length - 1;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { st.selected = Math.min(max, st.selected + 1); render(); event.preventDefault(); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { st.selected = Math.max(0, st.selected - 1); render(); event.preventDefault(); }
      if (event.key === 'Enter') { observe(); event.preventDefault(); }
      if (event.key.toLowerCase() === 'c') calibrate();
      if (event.key.toLowerCase() === 'w') waitHour();
      if (event.key.toLowerCase() === 'm') reset();
    });
    reset('survey');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();