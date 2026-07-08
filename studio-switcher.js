(() => {
  const APP = {
    name: 'Studio Switcher', emoji: '📺', category: 'play', version: '1.0.0',
    summary: 'Call shots, roll clips, protect talent energy, and keep a live show from falling apart.',
    description: 'A local live-production strategy game with camera switching, cue timing, talent energy, sponsor beats, mistake recovery, adaptive segments, session-only finale mode, scoring, keyboard and touch controls, reduced-motion behavior, optional audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const lowMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shots = [
    { id: 'host', name: 'Host close-up', key: '1', warmth: 3, clarity: 2, risk: 1 },
    { id: 'guest', name: 'Guest angle', key: '2', warmth: 2, clarity: 3, risk: 1 },
    { id: 'wide', name: 'Wide desk', key: '3', warmth: 1, clarity: 1, risk: 0 },
    { id: 'graphic', name: 'Graphic wall', key: '4', warmth: 0, clarity: 4, risk: 2 }
  ];
  const modes = {
    warmup: { name: 'Morning show', segments: 5, audience: 55, energy: 8, fixes: 2, clips: 2, target: 390 },
    breaking: { name: 'Breaking desk', segments: 6, audience: 50, energy: 7, fixes: 2, clips: 2, target: 520 },
    finale: { name: 'Finale hour', segments: 7, audience: 52, energy: 8, fixes: 3, clips: 3, target: 660 }
  };
  const beats = [
    { name: 'Cold open', need: 'warmth', prompt: 'Open with a human face before the graphic package lands.' },
    { name: 'Explain the twist', need: 'clarity', prompt: 'Make the complicated part understandable without draining the host.' },
    { name: 'Guest story', need: 'warmth', prompt: 'Protect the guest moment while the clock starts to squeeze.' },
    { name: 'Sponsor bridge', need: 'sponsor', prompt: 'Hit the sponsor-safe beat without making the segment feel fake.' },
    { name: 'Control room scramble', need: 'safe', prompt: 'A line changed late. Avoid a risky shot and stabilize the room.' },
    { name: 'Hard question', need: 'clarity', prompt: 'The audience wants a direct answer. Choose a shot that helps the idea land.' },
    { name: 'Button ending', need: 'warmth', prompt: 'End cleanly, with enough energy left to feel intentional.' }
  ];

  function ensureStyles() {
    if ($('#studio-switcher-styles')) return;
    const style = document.createElement('style');
    style.id = 'studio-switcher-styles';
    style.textContent = `
      .ss-card{animation:ss-rise .24s ease both}.ss-game{max-width:1120px;gap:14px}.ss-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.ss-stat,.ss-stage,.ss-panel,.ss-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.ss-stat{padding:10px 12px}.ss-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.ss-stat strong{display:block;margin-top:4px}.ss-layout{display:grid;grid-template-columns:1.05fr .95fr;gap:12px}.ss-stage{position:relative;min-height:330px;padding:14px;overflow:hidden;background:radial-gradient(circle at 35% 20%,#334155,#111827 62%);color:#fff}.ss-preview{position:absolute;inset:14px;border:1px solid rgba(255,255,255,.18);border-radius:18px;background:linear-gradient(135deg,rgba(255,255,255,.13),rgba(15,23,42,.28));display:grid;place-items:center;text-align:center;padding:18px}.ss-preview strong{font-size:clamp(1.45rem,5vw,3.2rem);line-height:.95;letter-spacing:-.05em}.ss-preview small{display:block;margin-top:8px;color:rgba(255,255,255,.76)}.ss-talent{position:absolute;left:8%;bottom:9%;display:flex;gap:14px}.ss-person{width:54px;height:82px;border-radius:999px 999px 18px 18px;background:#f8fafc;color:#111827;display:grid;place-items:center;font-weight:900;box-shadow:0 10px 24px rgba(0,0,0,.25)}.ss-person.is-tired{transform:translateY(6px);opacity:.72}.ss-cameras{position:absolute;right:7%;bottom:10%;display:grid;gap:8px}.ss-cam{border:1px solid rgba(255,255,255,.26);border-radius:999px;padding:7px 10px;background:rgba(15,23,42,.66);font-size:.72rem;font-weight:900}.ss-cam.is-live{background:#fde68a;color:#111827}.ss-panel{padding:14px;display:grid;gap:12px}.ss-brief{padding:13px;background:#f8fafc}.ss-brief h3{margin:.2rem 0;font-size:1.12rem}.ss-shots{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.ss-shots button,.ss-actions button{min-height:44px}.ss-shots button.is-live{box-shadow:0 0 0 3px #fde68a inset}.ss-shots button:focus-visible,.ss-actions button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.ss-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.ss-list{display:grid;gap:7px}.ss-chip{border:1px solid var(--line);border-radius:14px;background:#fff;padding:8px 10px;font-size:.82rem}.ss-chip.is-risk{background:#fee2e2}.ss-chip.is-good{background:#dcfce7}.ss-log{min-height:110px;padding:17px 19px}.ss-flash{animation:ss-flash .5s ease both}@media(max-width:860px){.ss-hud{grid-template-columns:repeat(2,1fr)}.ss-layout{grid-template-columns:1fr}.ss-stage{min-height:285px}.ss-actions{grid-template-columns:1fr 1fr}}@media(max-width:520px){.ss-stage,.ss-panel{padding:9px}.ss-preview{inset:9px}.ss-stage{min-height:245px}.ss-shots,.ss-actions{grid-template-columns:1fr}.ss-person{width:42px;height:64px}.ss-cameras{right:4%;bottom:8%}}@media(prefers-reduced-motion:reduce){.ss-card,.ss-flash{animation:none;transition:none}}@keyframes ss-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes ss-flash{0%{filter:brightness(1.25);transform:scale(.99)}100%{filter:none;transform:none}}
    `;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-studio-switcher-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.studioSwitcherCard = 'true';
    card.classList.add('ss-card');
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
    const retry = () => { addCard(); if (!$('[data-studio-switcher-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.studioSwitcherRefresh) return;
      button.dataset.studioSwitcherRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Studio%20Switcher';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel ss-game';
    root.innerHTML = `<div class="ss-hud"><div class="ss-stat"><span>Mode</span><strong id="ss-mode">Morning show</strong></div><div class="ss-stat"><span>Segment</span><strong id="ss-round">1 / 5</strong></div><div class="ss-stat"><span>Audience</span><strong id="ss-audience">55</strong></div><div class="ss-stat"><span>Energy</span><strong id="ss-energy">8</strong></div><div class="ss-stat"><span>Fixes</span><strong id="ss-fixes">2</strong></div><div class="ss-stat"><span>Score</span><strong id="ss-score">0</strong></div></div><div class="ss-layout"><div class="ss-stage" aria-label="Live studio preview"><div class="ss-preview"><div><strong id="ss-live-title">Host close-up</strong><small id="ss-live-note">Live preview ready.</small></div></div><div class="ss-talent"><div class="ss-person" data-person="host">H</div><div class="ss-person" data-person="guest">G</div></div><div class="ss-cameras" aria-hidden="true"></div></div><div class="ss-panel"><div class="ss-brief"></div><div class="ss-shots" aria-label="Camera shots"></div><div class="ss-list" aria-label="Control room status"></div><div class="ss-actions"><button class="button" type="button" data-act="roll">Roll clip</button><button class="button button-secondary" type="button" data-act="fix">Use producer fix</button><button class="button button-secondary" type="button" data-act="next">Take segment</button><button class="button button-secondary" type="button" data-act="mode">Change mode</button><button class="button button-secondary" type="button" data-act="reset">New rundown</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card ss-log" aria-live="polite"></div>`;
    stage.append(root);
    const st = { mode: 'warmup', segment: 1, audience: 55, energy: 8, fixes: 2, clips: 2, score: 0, live: 0, selected: 0, mistake: 0, streak: 0, unlocked: false, sound: false, ac: null, low: lowMotion() };
    const brief = $('.ss-brief', root), shotBox = $('.ss-shots', root), status = $('.ss-list', root), log = $('.ss-log', root), liveTitle = $('#ss-live-title', root), liveNote = $('#ss-live-note', root), cams = $('.ss-cameras', root);
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });
    function mode() { return modes[st.mode]; }
    function beat() { return beats[(st.segment - 1) % beats.length]; }
    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: 1-4 preview shots, Enter takes segment, C rolls a clip, F uses a fix, M changes mode.</small>`; }
    function tone(kind) {
      if (!st.sound && kind !== 'bad') return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume();
      const osc = st.ac.createOscillator(), gain = st.ac.createGain();
      osc.type = kind === 'bad' ? 'sawtooth' : 'triangle'; osc.frequency.value = kind === 'good' ? 720 : kind === 'tick' ? 440 : 180;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.055, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .22);
      osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .24);
    }
    function reset(next) {
      const keys = Object.keys(modes);
      st.mode = next || keys[(keys.indexOf(st.mode) + 1) % (st.unlocked ? 3 : 2)];
      const m = mode();
      st.segment = 1; st.audience = m.audience; st.energy = m.energy; st.fixes = m.fixes; st.clips = m.clips; st.score = 0; st.live = 0; st.selected = 0; st.mistake = 0; st.streak = 0;
      render(); note(`${m.name} rundown loaded. Preview the right camera, roll clips carefully, and use fixes before mistakes stack.`);
    }
    function shotScore(s, b) {
      let value = b.need === 'warmth' ? s.warmth : b.need === 'clarity' ? s.clarity : b.need === 'sponsor' ? (s.id === 'wide' || s.id === 'graphic' ? 3 : 1) : s.risk === 0 ? 3 : 1;
      if ((s.id === 'host' || s.id === 'guest') && st.energy <= 2) value -= 2;
      if (s.id === 'graphic' && b.need === 'warmth') value -= 2;
      return value;
    }
    function bestShotName(b) {
      const ranked = shots.map((s, i) => ({ i, v: shotScore(s, b) })).sort((a, b2) => b2.v - a.v);
      return shots[ranked[0].i].name;
    }
    function choose(i) { st.selected = Math.max(0, Math.min(shots.length - 1, i)); render(); note(`${shots[st.selected].name} is previewed. Take the segment when it fits the beat.`); }
    function rollClip() {
      if (st.clips <= 0) return note('No clips remain. Save producer fixes for real mistakes.');
      st.clips -= 1; st.energy = Math.min(10, st.energy + 2); st.audience = Math.max(0, st.audience - 1); tone('tick'); render(); note('Clip rolled. Talent recovers +2 energy, but the audience cools slightly.');
    }
    function fix() {
      if (st.fixes <= 0) return note('No producer fixes remain. You need a clean shot choice now.');
      if (st.mistake <= 0 && st.energy > 2) return note('Hold the fix. No serious mistake is active yet.');
      st.fixes -= 1; st.mistake = Math.max(0, st.mistake - 2); st.energy = Math.min(10, st.energy + 1); tone('good'); render(); note('Producer fix used. Mistake heat drops and talent gets one breath back.');
    }
    function take() {
      if (st.segment > mode().segments) return reset(st.mode);
      const s = shots[st.selected], b = beat();
      let value = shotScore(s, b);
      st.live = st.selected;
      st.energy -= s.id === 'host' || s.id === 'guest' ? 1 : 0;
      if (s.id === 'graphic') st.energy -= 1;
      if (value >= 3) { st.streak += 1; st.audience += 6 + st.streak; st.score += 70 + st.audience + st.streak * 12; st.mistake = Math.max(0, st.mistake - 1); tone('good'); note(`Clean take: ${s.name} matched ${b.name}. Streak ${st.streak}.`); }
      else if (value === 2) { st.streak = 0; st.audience += 2; st.score += 35 + st.audience; tone('tick'); note(`Usable take: ${s.name} got through ${b.name}, but it left value on the table.`); }
      else { st.streak = 0; st.audience -= 8; st.mistake += 2 + s.risk; st.energy -= 1; tone('bad'); note(`Rough take: ${s.name} fought the beat. Use a fix or roll a clip before heat compounds.`); }
      if (st.energy < 0) { st.mistake += 2; st.energy = 0; st.audience -= 5; }
      if (st.mistake >= 5) { st.audience -= 10; st.score = Math.max(0, st.score - 60); st.mistake = 3; note('The control room spiraled, but the show recovered after a messy reset. You lost audience and score.'); }
      st.segment += 1;
      if (st.segment > mode().segments) {
        const passed = st.score >= mode().target;
        if (passed && st.mode === 'breaking') st.unlocked = true;
        note(passed ? `Show wrapped at ${st.score}. ${st.unlocked ? 'Finale hour is now available for this session.' : 'Clean enough to air again.'}` : `Show wrapped at ${st.score}. Missed the ${mode().target} target. Try protecting energy before sponsor and hard-question beats.`);
      }
      render(true);
    }
    function render(flash = false) {
      const m = mode(), b = beat();
      $('#ss-mode', root).textContent = m.name; $('#ss-round', root).textContent = `${Math.min(st.segment, m.segments)} / ${m.segments}`; $('#ss-audience', root).textContent = st.audience; $('#ss-energy', root).textContent = st.energy; $('#ss-fixes', root).textContent = st.fixes; $('#ss-score', root).textContent = st.score;
      brief.innerHTML = `<h3>${st.segment > m.segments ? 'Rundown complete' : b.name}</h3><p>${st.segment > m.segments ? 'Start a new rundown or change mode.' : b.prompt}</p>`;
      liveTitle.textContent = shots[st.live].name; liveNote.textContent = `Preview: ${shots[st.selected].name} · Clips ${st.clips} · Mistake heat ${st.mistake}`;
      root.classList.toggle('ss-flash', Boolean(flash && !st.low)); if (flash && !st.low) setTimeout(() => root.classList.remove('ss-flash'), 480);
      $$('.ss-person', root).forEach((p) => p.classList.toggle('is-tired', st.energy <= 2));
      cams.replaceChildren(...shots.map((s, i) => { const d = document.createElement('div'); d.className = `ss-cam${i === st.live ? ' is-live' : ''}`; d.textContent = `${s.key} ${s.name.split(' ')[0]}`; return d; }));
      shotBox.replaceChildren(...shots.map((s, i) => { const btn = document.createElement('button'); btn.type = 'button'; btn.className = `button${i === st.selected ? ' is-live' : ' button-secondary'}`; btn.textContent = `${s.key}. ${s.name}`; btn.setAttribute('aria-pressed', String(i === st.selected)); btn.addEventListener('click', () => choose(i)); return btn; }));
      status.innerHTML = `<div class="ss-chip ${st.energy <= 2 ? 'is-risk' : 'is-good'}">Talent energy: ${st.energy <= 2 ? 'fragile. Roll a clip or choose wide.' : 'usable.'}</div><div class="ss-chip ${st.mistake >= 3 ? 'is-risk' : 'is-good'}">Mistake heat: ${st.mistake >= 3 ? 'dangerous. Use a fix soon.' : 'contained.'}</div><div class="ss-chip">Best next fit: ${bestShotName(b)}</div><div class="ss-chip">Session unlock: ${st.unlocked ? 'Finale hour available.' : 'Pass Breaking desk to unlock Finale hour.'}</div>`;
    }
    root.addEventListener('click', (event) => {
      const action = event.target.closest('button')?.dataset.act; if (!action) return;
      if (action === 'roll') rollClip(); if (action === 'fix') fix(); if (action === 'next') take(); if (action === 'mode') reset(); if (action === 'reset') reset(st.mode);
      if (action === 'sound') { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); tone('good'); }
    });
    root.addEventListener('keydown', (event) => {
      if (/^[1-4]$/.test(event.key)) { event.preventDefault(); choose(Number(event.key) - 1); }
      if (event.key === 'Enter') { event.preventDefault(); take(); }
      if (event.key.toLowerCase() === 'c') rollClip();
      if (event.key.toLowerCase() === 'f') fix();
      if (event.key.toLowerCase() === 'm') reset();
    });
    root.tabIndex = -1;
    reset('warmup');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
