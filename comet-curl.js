(() => {
  const APP = {
    name: 'Comet Curl', emoji: '☄️', category: 'play', version: '1.0.0',
    summary: 'Launch a tiny comet through gravity wells, hazards, samples, and landing rings with one careful drag.',
    description: 'A local physics-aiming mini-game with drag, touch, pointer, keyboard launch controls, gravity wells, bumpers, samples, hazards, landing rings, stabilizer recovery, adaptive rounds, session-only comet trail unlock, scoring, reduced-motion behavior, optional local audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const svgNS = 'http://www.w3.org/2000/svg';
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensureStyles() {
    if ($('#comet-curl-styles')) return;
    const style = document.createElement('style');
    style.id = 'comet-curl-styles';
    style.textContent = `
      .comet-card{animation:comet-rise .24s ease both}.comet-game{max-width:1120px;gap:14px}.comet-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.comet-stat,.comet-board,.comet-panel,.comet-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.comet-stat{padding:10px 12px}.comet-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.comet-stat strong{display:block;margin-top:4px}.comet-layout{display:grid;grid-template-columns:1.12fr .88fr;gap:12px}.comet-board{padding:12px;background:linear-gradient(135deg,#eef2ff,#f8fafc)}.comet-board svg{width:100%;height:min(62vh,500px);min-height:340px;display:block;border-radius:18px;background:#08111f;touch-action:none}.comet-panel{padding:14px;display:grid;gap:12px}.comet-brief{padding:13px;background:#f8fafc}.comet-brief h3{margin:.2rem 0;font-size:1.2rem}.comet-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.comet-actions button{min-height:44px}.comet-tags{display:flex;flex-wrap:wrap;gap:6px}.comet-tags span{border:1px solid var(--line);border-radius:999px;padding:4px 8px;background:#fff;font-size:.74rem;font-weight:800}.comet-log{min-height:112px;padding:17px 19px}.comet-bg{fill:#08111f}.comet-ring{fill:none;stroke:#34d399;stroke-width:2.4;stroke-dasharray:3 2}.comet-ring-core{fill:rgba(52,211,153,.14);stroke:#86efac;stroke-width:.8}.comet-start{fill:#1e3a8a;stroke:#93c5fd;stroke-width:1}.comet-well{fill:#7c3aed;stroke:#ddd6fe;stroke-width:.9}.comet-well-halo{fill:#7c3aed;opacity:.12}.comet-hazard{fill:#ef4444;stroke:#fecaca;stroke-width:.9}.comet-bumper{fill:#f59e0b;stroke:#fed7aa;stroke-width:.9}.comet-sample{fill:#38bdf8;stroke:#e0f2fe;stroke-width:.7}.comet-sample.is-collected{opacity:.24}.comet-path{fill:none;stroke:#bae6fd;stroke-width:1.2;stroke-linecap:round;opacity:.85}.comet-aim{stroke:#fef3c7;stroke-width:2;stroke-linecap:round;opacity:.88}.comet-aim-dot{fill:#fef3c7}.comet-player{fill:#f8fafc;stroke:#0f172a;stroke-width:1;filter:drop-shadow(0 0 7px rgba(255,255,255,.45))}.comet-trail{fill:none;stroke:#67e8f9;stroke-width:.7;opacity:.32}.comet-text{fill:#e5e7eb;font-size:4px;font-weight:900;text-anchor:middle;dominant-baseline:middle;pointer-events:none}@media(max-width:860px){.comet-hud{grid-template-columns:repeat(2,1fr)}.comet-layout{grid-template-columns:1fr}.comet-board svg{height:420px}.comet-actions{grid-template-columns:1fr}}@media(max-width:520px){.comet-board{padding:8px}.comet-board svg{height:360px;min-height:320px}.comet-stat{padding:9px}.comet-stat strong{font-size:.95rem}}@media(prefers-reduced-motion:reduce){.comet-card{animation:none;transition:none}.comet-path{stroke-dasharray:0}}@keyframes comet-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
    `;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid');
    const template = $('#app-card-template');
    if (!grid || !template || $('[data-comet-curl-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.cometCurlCard = 'true';
    card.classList.add('comet-card');
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
    const retry = () => {
      addCard();
      if (!$('[data-comet-curl-card]') && tries++ < 20) setTimeout(retry, 120);
    };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.cometCurlRefresh) return;
      button.dataset.cometCurlRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog');
    const stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Comet%20Curl';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel comet-game';
    root.innerHTML = `<div class="comet-hud"><div class="comet-stat"><span>Round</span><strong id="cc-round">1 / 5</strong></div><div class="comet-stat"><span>Shots</span><strong id="cc-shots">3</strong></div><div class="comet-stat"><span>Stabilizers</span><strong id="cc-stabs">1</strong></div><div class="comet-stat"><span>Samples</span><strong id="cc-samples">0 / 3</strong></div><div class="comet-stat"><span>Score</span><strong id="cc-score">0</strong></div><div class="comet-stat"><span>Best</span><strong id="cc-best">0</strong></div></div><div class="comet-layout"><div class="comet-board"><svg viewBox="0 0 100 72" role="img" aria-label="Comet curling arena" tabindex="0"></svg></div><div class="comet-panel"><div class="comet-brief"></div><div class="comet-tags"></div><div class="comet-actions"><button class="button" type="button" data-act="launch">Launch / stop</button><button class="button button-secondary" type="button" data-act="stabilize">Use stabilizer</button><button class="button button-secondary" type="button" data-act="reset">Reset shot</button><button class="button button-secondary" type="button" data-act="new">New round</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button><button class="button button-secondary" type="button" data-act="predict">Preview arc</button></div></div></div><div class="result-card comet-log" aria-live="polite"></div>`;
    stage.append(root);

    const svg = $('svg', root), log = $('.comet-log', root), brief = $('.comet-brief', root), tags = $('.comet-tags', root);
    const st = { round: 1, rounds: 5, score: 0, best: 0, shots: 3, stabilizers: 1, samples: 0, launched: false, over: false, aiming: false, predicted: false, expert: false, sound: false, ac: null, pos: { x: 12, y: 58 }, start: { x: 12, y: 58 }, vel: { x: 0, y: 0 }, aim: { x: 28, y: 42 }, ring: { x: 86, y: 14, r: 8 }, wells: [], hazards: [], bumpers: [], sampleTiles: [], trail: [], last: 0, raf: 0 };
    const lowMotion = reduced();
    dialog.addEventListener('close', () => { cancelAnimationFrame(st.raf); if (st.ac) st.ac.close().catch(() => {}); }, { once: true });

    function setup(advance = false) {
      cancelAnimationFrame(st.raf);
      if (advance) st.round += 1;
      if (st.round > st.rounds) { st.expert = true; st.round = 1; st.best = Math.max(st.best, st.score); note('Comet trail unlocked. Tighter gravity and a trail bonus are now active.'); }
      st.shots = Math.max(2, 4 - Math.floor(st.round / 2));
      st.stabilizers = st.expert ? 2 : 1; st.samples = 0; st.launched = false; st.over = false; st.predicted = false; st.trail = [];
      st.start = { x: 10 + (st.round % 2) * 4, y: 58 - (st.round % 3) * 4 };
      st.pos = { ...st.start }; st.vel = { x: 0, y: 0 }; st.aim = { x: 30, y: 43 };
      st.ring = { x: 84 - (st.round % 2) * 6, y: 13 + (st.round % 3) * 4, r: Math.max(6, 9 - st.round * .5) };
      st.wells = [{ x: 42, y: 26 + st.round * 2, power: .025 + st.round * .003 }, { x: 63, y: 47 - (st.round % 3) * 5, power: .020 + st.round * .002 }];
      st.bumpers = [{ x: 33 + st.round * 3, y: 50, r: 4.5 }, { x: 67, y: 24 + (st.round % 2) * 11, r: 4.5 }];
      st.hazards = [{ x: 50, y: 12 + st.round * 3, r: 4.8 }, { x: 74, y: 54 - st.round * 2, r: 5 }];
      if (st.round >= 3 || st.expert) st.hazards.push({ x: 24 + st.round * 3, y: 28, r: 4.2 });
      st.sampleTiles = [{ x: 30, y: 22, r: 3, got: false }, { x: 56, y: 36, r: 3, got: false }, { x: 78, y: 34, r: 3, got: false }];
      updateText('Drag backward from the comet, use arrow keys to aim, then launch. Collect blue samples and settle inside the green ring.'); render();
    }
    function updateText(message) {
      brief.innerHTML = `<h3>${st.expert ? 'Comet trail' : 'Classic orbit'} round ${st.round}</h3><p>${message}</p>`;
      tags.replaceChildren(...[`${st.shots} shots`, `${st.stabilizers} stabilizer`, `${st.sampleTiles.length} samples`, st.expert ? 'Trail bonus' : 'Unlock after 5 rounds', lowMotion ? 'Reduced motion' : 'Animated physics'].map((textValue) => { const item = document.createElement('span'); item.textContent = textValue; return item; }));
    }
    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: arrows aim, Space launches, S stabilizes, P previews, R resets.</small>`; }
    function tone(kind) {
      if (!st.sound) return; const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume(); const osc = st.ac.createOscillator(); const gain = st.ac.createGain();
      osc.type = kind === 'bad' ? 'sawtooth' : 'sine'; osc.frequency.value = kind === 'win' ? 660 : kind === 'bad' ? 130 : 360;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.05, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .14); osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .16);
    }
    function hud() { $('#cc-round', root).textContent = `${st.round} / ${st.rounds}${st.expert ? '+' : ''}`; $('#cc-shots', root).textContent = st.shots; $('#cc-stabs', root).textContent = st.stabilizers; $('#cc-samples', root).textContent = `${st.samples} / ${st.sampleTiles.length}`; $('#cc-score', root).textContent = st.score; $('#cc-best', root).textContent = Math.max(st.best, st.score); }
    function circle(x, y, r, cls) { const c = document.createElementNS(svgNS, 'circle'); c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', r); c.setAttribute('class', cls); return c; }
    function text(x, y, value) { const t = document.createElementNS(svgNS, 'text'); t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('class', 'comet-text'); t.textContent = value; return t; }
    function render() {
      hud(); svg.replaceChildren(); const bg = document.createElementNS(svgNS, 'rect'); bg.setAttribute('class', 'comet-bg'); bg.setAttribute('x', 0); bg.setAttribute('y', 0); bg.setAttribute('width', 100); bg.setAttribute('height', 72); svg.append(bg);
      svg.append(circle(st.ring.x, st.ring.y, st.ring.r, 'comet-ring-core'), circle(st.ring.x, st.ring.y, st.ring.r + 2.4, 'comet-ring'), circle(st.start.x, st.start.y, 5, 'comet-start'));
      st.wells.forEach((well, i) => svg.append(circle(well.x, well.y, 13 + i * 2, 'comet-well-halo'), circle(well.x, well.y, 4.2, 'comet-well'), text(well.x, well.y, 'G')));
      st.bumpers.forEach((b) => svg.append(circle(b.x, b.y, b.r, 'comet-bumper'), text(b.x, b.y, 'B'))); st.hazards.forEach((h) => svg.append(circle(h.x, h.y, h.r, 'comet-hazard'), text(h.x, h.y, '!'))); st.sampleTiles.forEach((s) => svg.append(circle(s.x, s.y, s.r, `comet-sample${s.got ? ' is-collected' : ''}`)));
      if (st.trail.length > 1) { const p = document.createElementNS(svgNS, 'polyline'); p.setAttribute('class', st.expert ? 'comet-path' : 'comet-trail'); p.setAttribute('points', st.trail.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ')); svg.append(p); }
      if (!st.launched) drawAim(); svg.append(circle(st.pos.x, st.pos.y, 2.8, 'comet-player'));
    }
    function drawAim() {
      const line = document.createElementNS(svgNS, 'line'); line.setAttribute('class', 'comet-aim'); line.setAttribute('x1', st.pos.x); line.setAttribute('y1', st.pos.y); line.setAttribute('x2', st.aim.x); line.setAttribute('y2', st.aim.y); svg.append(line, circle(st.aim.x, st.aim.y, 1.6, 'comet-aim-dot'));
      if (st.predicted) { const p = document.createElementNS(svgNS, 'polyline'); p.setAttribute('class', 'comet-path'); p.setAttribute('points', predict().map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ')); svg.append(p); }
    }
    function velocityFromAim() { return { x: clamp((st.pos.x - st.aim.x) * .12, -2.8, 2.8), y: clamp((st.pos.y - st.aim.y) * .12, -2.8, 2.8) }; }
    function predict() { const sim = { pos: { ...st.pos }, vel: velocityFromAim(), wells: st.wells, bumpers: st.bumpers }; const pts = []; for (let i = 0; i < 90; i += 1) { physics(sim, .7, false); if (i % 3 === 0) pts.push({ ...sim.pos }); if (sim.pos.x < 1 || sim.pos.x > 99 || sim.pos.y < 1 || sim.pos.y > 71) break; } return pts; }
    function launch() { if (st.over) return setup(true); if (st.launched) { st.vel.x *= .3; st.vel.y *= .3; note('Emergency brake burned velocity. Try to settle the comet.'); tone('bad'); return; } if (st.shots <= 0) return fail('No shots remain. The comet drifted past the window.'); st.shots -= 1; st.launched = true; st.vel = velocityFromAim(); st.trail = [{ ...st.pos }]; st.last = performance.now(); updateText('The comet is moving. Use a stabilizer if it is about to clip a hazard or miss the ring.'); note('Comet launched. Gravity wells bend the path every frame.'); tone('ok'); st.raf = requestAnimationFrame(tick); }
    function tick(now) { if (!st.launched || st.over) return; const dt = lowMotion ? 1.35 : clamp((now - st.last) / 16.67, .5, 2); st.last = now; for (let i = 0; i < 2; i += 1) physics(st, dt / 2, true); st.trail.push({ ...st.pos }); if (st.trail.length > 80) st.trail.shift(); render(); if (Math.hypot(st.vel.x, st.vel.y) < .08) return settle(); if (st.pos.x < -3 || st.pos.x > 103 || st.pos.y < -3 || st.pos.y > 75) return fail('The comet left the arena. Reset the shot or start a new round.'); st.raf = requestAnimationFrame(tick); }
    function physics(obj, dt, live) { obj.wells.forEach((well) => { const dx = well.x - obj.pos.x, dy = well.y - obj.pos.y, d2 = Math.max(40, dx * dx + dy * dy); obj.vel.x += dx / Math.sqrt(d2) * well.power * dt * 38; obj.vel.y += dy / Math.sqrt(d2) * well.power * dt * 38; }); obj.vel.x *= .992; obj.vel.y *= .992; obj.pos.x += obj.vel.x * dt; obj.pos.y += obj.vel.y * dt; if (obj.pos.x < 2 || obj.pos.x > 98) { obj.vel.x *= -.72; obj.pos.x = clamp(obj.pos.x, 2, 98); if (live) tone('bad'); } if (obj.pos.y < 2 || obj.pos.y > 70) { obj.vel.y *= -.72; obj.pos.y = clamp(obj.pos.y, 2, 70); if (live) tone('bad'); } obj.bumpers.forEach((b) => { const hit = d(obj.pos, b); if (hit < b.r + 2.8) { const nx = (obj.pos.x - b.x) / Math.max(1, hit), ny = (obj.pos.y - b.y) / Math.max(1, hit), dot = obj.vel.x * nx + obj.vel.y * ny; obj.vel.x -= 1.9 * dot * nx; obj.vel.y -= 1.9 * dot * ny; obj.pos.x = b.x + nx * (b.r + 3.1); obj.pos.y = b.y + ny * (b.r + 3.1); if (live) tone('ok'); } }); if (live) { obj.sampleTiles.forEach((s) => { if (!s.got && d(obj.pos, s) < s.r + 3.2) { s.got = true; st.samples += 1; st.score += 30 + st.round * 5; note('Sample captured. Landing still matters more than raw collection.'); tone('win'); } }); obj.hazards.forEach((h) => { if (d(obj.pos, h) < h.r + 2.7) fail('The comet grazed a red debris pocket. Use stabilizer earlier next run.'); }); } }
    function settle() { st.launched = false; const landing = d(st.pos, st.ring), landed = landing <= st.ring.r + 2; if (landed) { const bonus = Math.max(0, Math.round((st.ring.r + 2 - landing) * 12)), trailBonus = st.expert ? Math.min(50, st.trail.length) : 0; st.score += 120 + bonus + st.samples * 20 + st.shots * 12 + trailBonus; st.best = Math.max(st.best, st.score); st.over = true; updateText('Clean landing. Continue to the next arena or replay for a tighter line.'); note(`Landed in the ring for ${120 + bonus + trailBonus} landing points. Press New round to continue.`); tone('win'); } else if (st.shots > 0) { updateText('The comet settled outside the ring. Aim from the new position or spend reset to return to launch.'); note('Close, but not stable enough. You can launch again from the current resting place.'); tone('bad'); } else fail('The comet settled outside the ring and no shots remain.'); render(); }
    function fail(message) { st.launched = false; st.over = true; st.score = Math.max(0, st.score - 35); updateText('Failure is recoverable. New round keeps the session score moving, while reset lets you practice this board.'); note(message); tone('bad'); render(); }
    function stabilize() { if (st.stabilizers <= 0) return note('No stabilizers remain.'); st.stabilizers -= 1; st.vel.x *= .55; st.vel.y *= .55; st.pos.x += (st.ring.x - st.pos.x) * .035; st.pos.y += (st.ring.y - st.pos.y) * .035; note('Stabilizer fired. Velocity dropped and the comet nudged toward the landing ring.'); tone('ok'); render(); }
    function resetShot() { st.launched = false; st.pos = { ...st.start }; st.vel = { x: 0, y: 0 }; st.aim = { x: 30, y: 43 }; st.trail = []; st.predicted = false; note('Shot reset. The round layout stayed the same so you can solve the line.'); render(); }
    function pointerPoint(event) { const rect = svg.getBoundingClientRect(); return { x: clamp((event.clientX - rect.left) / rect.width * 100, 0, 100), y: clamp((event.clientY - rect.top) / rect.height * 72, 0, 72) }; }
    svg.addEventListener('pointerdown', (event) => { if (st.launched || st.over) return; st.aiming = true; svg.setPointerCapture(event.pointerId); st.aim = pointerPoint(event); render(); });
    svg.addEventListener('pointermove', (event) => { if (!st.aiming || st.launched || st.over) return; st.aim = pointerPoint(event); render(); });
    svg.addEventListener('pointerup', (event) => { if (!st.aiming) return; st.aiming = false; st.aim = pointerPoint(event); render(); });
    svg.addEventListener('keydown', (event) => { const map = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }; if (map[event.key] && !st.launched) { event.preventDefault(); st.aim.x = clamp(st.aim.x + map[event.key][0], 0, 100); st.aim.y = clamp(st.aim.y + map[event.key][1], 0, 72); render(); } if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); launch(); } if (event.key.toLowerCase() === 's') stabilize(); if (event.key.toLowerCase() === 'p') { st.predicted = !st.predicted; render(); } if (event.key.toLowerCase() === 'r') resetShot(); });
    root.addEventListener('click', (event) => { const act = event.target.closest('button')?.dataset.act; if (!act) return; if (act === 'launch') launch(); if (act === 'stabilize') stabilize(); if (act === 'reset') resetShot(); if (act === 'new') setup(true); if (act === 'predict') { st.predicted = !st.predicted; note(st.predicted ? 'Preview arc on. It estimates gravity but not every collision.' : 'Preview arc off.'); render(); } if (act === 'sound') { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); tone('ok'); } });
    setup(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
