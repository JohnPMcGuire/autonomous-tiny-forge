(() => {
  const APP = {
    name: 'Bridge Brace',
    emoji: '🌉',
    category: 'play',
    version: '1.0.0',
    summary: 'Place beams, cables, and dampers so cargo crosses before stress breaks the span.',
    description: 'A local structural strategy puzzle with load paths, moving cargo, wind stress, budget tradeoffs, inspections, repair, adaptive crossings, session-only quake mode, scoring, responsive SVG rendering, touch and keyboard controls, optional local audio, reduced-motion behavior, and teardown.'
  };

  const label = (value) => value === 'play' ? 'Play' : value === 'useful' ? 'Useful' : 'Experiment';
  const $ = (selector) => document.querySelector(selector);

  window.renderBridgeBrace = function renderBridgeBrace() {
    const stage = $('#app-stage');
    const dialog = $('#app-dialog');
    if (!stage || !dialog) return;
    style();
    stage.replaceChildren();
    game(stage, dialog);
  };

  function style() {
    if ($('#bridge-brace-styles')) return;
    const sheet = document.createElement('style');
    sheet.id = 'bridge-brace-styles';
    sheet.textContent = `
      .bridge-game{max-width:1040px;gap:14px}.bridge-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.bridge-stat{border:1px solid var(--line);border-radius:15px;background:#fff;padding:10px 12px}.bridge-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.bridge-stat strong{display:block;margin-top:4px}.bridge-board{border:0;border-radius:26px;background:#07121f;color:white;padding:0;overflow:hidden;touch-action:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.bridge-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.bridge-board svg{display:block;width:100%;height:min(58vh,500px);min-height:350px}.bridge-console{display:grid;grid-template-columns:1fr 1fr;gap:10px}.bridge-panel{border:1px solid var(--line);border-radius:18px;background:#fff;padding:13px}.bridge-tools,.bridge-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.bridge-chip,.bridge-legend span{border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--ink);padding:8px 11px;font-weight:900}.bridge-chip.is-active{background:#111827;color:#fff}.bridge-log{min-height:94px;padding:17px 19px}@media(max-width:760px){.bridge-hud{grid-template-columns:repeat(2,1fr)}.bridge-console{grid-template-columns:1fr}.bridge-board svg{height:56vh;min-height:340px}}@media(prefers-reduced-motion:reduce){.bridge-board svg{min-height:330px}}`;
    document.head.append(sheet);
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel bridge-game';
    root.innerHTML = `
      <div class="bridge-hud">
        <div class="bridge-stat"><span>Crossing</span><strong id="bb-round">1 / 5</strong></div>
        <div class="bridge-stat"><span>Budget</span><strong id="bb-budget">12</strong></div>
        <div class="bridge-stat"><span>Integrity</span><strong id="bb-integrity">100</strong></div>
        <div class="bridge-stat"><span>Cargo</span><strong id="bb-cargo">0</strong></div>
        <div class="bridge-stat"><span>Stress</span><strong id="bb-stress">0</strong></div>
        <div class="bridge-stat"><span>Score</span><strong id="bb-score">0</strong></div>
      </div>
      <button class="bridge-board" type="button" aria-label="Bridge Brace board. Use arrows to choose a bridge joint, one through five to choose beam, cable, damper, pier, or inspect, Enter to build, Space to start a crossing, and N for a new span."><svg aria-hidden="true"></svg></button>
      <div class="bridge-console">
        <div class="bridge-panel"><strong>Build load paths</strong><p>Strengthen the weakest joints before cargo rolls across. Beams spread weight, cables lift, dampers calm wind, piers resist sag, and inspections recover integrity.</p><div class="bridge-tools"></div></div>
        <div class="bridge-panel"><strong>Pressure</strong><div class="bridge-legend"><span>Beam: 2</span><span>Cable: 3</span><span>Damper: 3</span><span>Pier: 4</span><span>Inspect: 1</span><span>Quake unlock: 900</span></div></div>
      </div>
      <div class="result-card bridge-log" aria-live="polite"></div>
      <div class="tool-actions"></div>`;
    stage.append(root);

    const svg = root.querySelector('svg');
    const board = root.querySelector('.bridge-board');
    const tools = root.querySelector('.bridge-tools');
    const actions = root.querySelector('.tool-actions');
    const log = root.querySelector('.bridge-log');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { joints: 9, cursor: 4, tool: 'beam', round: 1, rounds: 5, budget: 12, integrity: 100, cargo: 0, stress: 0, score: 0, quake: false, running: false, truck: null, builds: [], raf: 0, last: 0, audio: false, ac: null };

    [['beam','Beam'],['cable','Cable'],['damper','Damper'],['pier','Pier'],['inspect','Inspect']].forEach(([id, text]) => {
      const b = button(text, () => { state.tool = id; paint(); draw(); }, true);
      b.classList.add('bridge-chip');
      b.dataset.tool = id;
      tools.append(b);
    });
    actions.append(button('Start crossing', start, true), button('New span', reset, true), button('Quake mode', toggleQuake, true), button('Sound off', sound, true));

    board.addEventListener('click', pointer);
    board.addEventListener('pointermove', pointer);
    board.addEventListener('keydown', key);
    dialog.addEventListener('close', tear, { once: true });
    reset();

    function button(text, fn, secondary) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = secondary ? 'button button-secondary' : 'button';
      b.textContent = text;
      b.addEventListener('click', fn);
      return b;
    }

    function say(html) { log.innerHTML = html; }
    function cost(t) { return t === 'beam' ? 2 : t === 'cable' ? 3 : t === 'damper' ? 3 : t === 'pier' ? 4 : 1; }
    function buildAt(i) { return state.builds.find((b) => b.i === i && b.type !== 'inspect'); }
    function strengthAt(i) {
      let s = 10 + (i === 0 || i === state.joints - 1 ? 30 : 0);
      for (const b of state.builds.filter((x) => x.i === i)) {
        s += b.type === 'beam' ? 28 : b.type === 'cable' ? 38 : b.type === 'damper' ? 22 : b.type === 'pier' ? 48 : 0;
      }
      const neighbors = state.builds.filter((b) => Math.abs(b.i - i) === 1 && b.type === 'beam').length;
      return s + neighbors * 10;
    }

    function place() {
      if (state.running) return;
      const c = cost(state.tool);
      if (state.budget < c) { say('<strong>Budget is short.</strong><small>Complete a safe crossing to recover materials.</small>'); return; }
      if (state.tool !== 'inspect' && buildAt(state.cursor)) { say('<strong>Joint already has a main brace.</strong><small>Move to another joint or inspect this one.</small>'); return; }
      state.budget -= c;
      if (state.tool === 'inspect') {
        state.integrity = Math.min(100, state.integrity + 10);
        state.stress = Math.max(0, state.stress - 8);
        say('<strong>Inspection complete.</strong><small>Integrity recovered and hidden stress was relieved.</small>');
      } else {
        state.builds.push({ i: state.cursor, type: state.tool, pulse: 10 });
        say(`<strong>${state.tool} installed.</strong><small>Start the crossing when the load path looks balanced.</small>`);
      }
      beep(360);
      paint(); draw();
    }

    function start() {
      if (state.running) return;
      state.running = true;
      state.truck = { x: 0, load: 22 + state.round * 7 + (state.quake ? 12 : 0), speed: 0.010 + state.round * 0.0015 };
      say(`<strong>Crossing ${state.round} started.</strong><small>Heavy cargo is testing the weakest span.</small>`);
      loop(0);
    }

    function step() {
      const t = state.truck;
      if (!t) return;
      t.x += t.speed;
      const joint = Math.min(state.joints - 1, Math.max(0, Math.round(t.x * (state.joints - 1))));
      const wind = (Math.sin((performance.now() / 450) + state.round) + 1) * (state.quake ? 11 : 6);
      const load = t.load + wind + (joint > 2 && joint < 6 ? 8 : 0);
      const support = strengthAt(joint);
      const dampers = state.builds.filter((b) => b.type === 'damper' && Math.abs(b.i - joint) <= 1).length;
      const excess = Math.max(0, load - support - dampers * 10);
      state.stress = Math.max(0, state.stress * 0.92 + excess);
      state.builds.forEach((b) => { b.pulse = Math.max(0, b.pulse - 1); });
      if (excess > 8) {
        state.integrity -= excess * 0.11;
        if (!reduced) state.cursor = joint;
      }
      if (state.stress > 55) state.integrity -= state.quake ? 0.42 : 0.24;
      if (state.integrity <= 0) {
        state.running = false;
        state.truck = null;
        state.score = Math.max(0, state.score - 80);
        say('<strong>The span failed.</strong><small>Recover by starting a new span. Add piers under the center and dampers near wind peaks.</small>');
        beep(150); paint(); draw(); return;
      }
      if (t.x >= 1) {
        state.running = false;
        state.truck = null;
        state.cargo += 1;
        const bonus = Math.max(0, Math.round(state.integrity + state.budget * 8 - state.stress));
        state.score += 120 + bonus;
        state.budget += 5;
        state.stress = Math.max(0, state.stress - 18);
        if (state.round >= state.rounds) {
          say(`<strong>Span certified: ${state.score}.</strong><small>${state.score >= 900 ? 'Quake mode is unlocked for this session.' : 'Score 900 to unlock quake mode.'}</small>`);
        } else {
          state.round += 1;
          say('<strong>Cargo crossed safely.</strong><small>Budget recovered. Reinforce the next weak joint before load increases.</small>');
        }
        beep(720); paint(); draw();
      }
    }

    function loop(t) {
      if (!state.running) return;
      state.raf = requestAnimationFrame(loop);
      if (reduced && t - state.last < 100) return;
      state.last = t;
      step(); draw(); paint();
    }

    function toggleQuake() {
      if (!state.quake && state.score < 900) { say('<strong>Quake mode locked.</strong><small>Certify a 900-point span to unlock higher moving stress.</small>'); return; }
      state.quake = !state.quake;
      reset();
      say(`<strong>${state.quake ? 'Quake' : 'Standard'} span ready.</strong><small>${state.quake ? 'Moving tremors punish single-point solutions.' : 'Normal wind loading restored.'}</small>`);
    }

    function reset() {
      cancelAnimationFrame(state.raf);
      Object.assign(state, { cursor: 4, tool: state.tool || 'beam', round: 1, budget: 12, integrity: 100, cargo: 0, stress: 0, running: false, truck: null, builds: [] });
      say('<strong>Bridge site open.</strong><small>Place braces, inspect weak joints, then start the first crossing.</small>');
      paint(); draw();
    }

    function paint() {
      root.querySelector('#bb-round').textContent = `${state.round} / ${state.rounds}`;
      root.querySelector('#bb-budget').textContent = state.budget;
      root.querySelector('#bb-integrity').textContent = Math.max(0, Math.round(state.integrity));
      root.querySelector('#bb-cargo').textContent = state.cargo;
      root.querySelector('#bb-stress').textContent = Math.round(state.stress);
      root.querySelector('#bb-score').textContent = state.score;
      tools.querySelectorAll('.bridge-chip').forEach((b) => b.classList.toggle('is-active', b.dataset.tool === state.tool));
    }

    function pointer(e) {
      const rect = board.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      state.cursor = Math.round(x * (state.joints - 1));
      if (e.type === 'click') place();
      draw();
    }

    function key(e) {
      const k = e.key.toLowerCase();
      if (k === 'arrowright') { e.preventDefault(); state.cursor = Math.min(state.joints - 1, state.cursor + 1); }
      if (k === 'arrowleft') { e.preventDefault(); state.cursor = Math.max(0, state.cursor - 1); }
      if (k === '1') state.tool = 'beam';
      if (k === '2') state.tool = 'cable';
      if (k === '3') state.tool = 'damper';
      if (k === '4') state.tool = 'pier';
      if (k === '5') state.tool = 'inspect';
      if (k === 'enter') { e.preventDefault(); place(); }
      if (k === ' ') { e.preventDefault(); start(); }
      if (k === 'n') { e.preventDefault(); reset(); }
      paint(); draw();
    }

    function sound(e) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { say('<strong>Sound is not available here.</strong><small>The bridge still works silently.</small>'); return; }
      state.audio = !state.audio;
      e.currentTarget.textContent = state.audio ? 'Sound on' : 'Sound off';
      e.currentTarget.setAttribute('aria-pressed', String(state.audio));
      if (state.audio) { state.ac ||= new AC(); state.ac.resume(); beep(440); }
    }

    function beep(freq) {
      if (!state.audio || !state.ac) return;
      const now = state.ac.currentTime;
      const osc = state.ac.createOscillator();
      const gain = state.ac.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.connect(gain).connect(state.ac.destination);
      osc.start(now); osc.stop(now + 0.16);
    }

    function draw() {
      const w = 900, h = 420, baseY = 255;
      const points = Array.from({ length: state.joints }, (_, i) => ({ x: 60 + i * ((w - 120) / (state.joints - 1)), y: baseY + Math.sin(i * 0.9 + state.stress / 25) * Math.min(22, state.stress / 3) }));
      const builds = state.builds.map((b) => {
        const p = points[b.i];
        if (b.type === 'beam') return `<rect x="${p.x - 32}" y="${p.y - 9}" width="64" height="18" rx="8" fill="#a7f3d0" opacity="${b.pulse ? 1 : .82}"/>`;
        if (b.type === 'cable') return `<path d="M${p.x - 44} ${p.y} Q${p.x} ${p.y - 90} ${p.x + 44} ${p.y}" fill="none" stroke="#93c5fd" stroke-width="9" stroke-linecap="round"/>`;
        if (b.type === 'damper') return `<circle cx="${p.x}" cy="${p.y - 42}" r="22" fill="#fde68a"/><path d="M${p.x} ${p.y - 20} L${p.x} ${p.y}" stroke="#fde68a" stroke-width="8"/>`;
        return `<path d="M${p.x} ${p.y} L${p.x - 22} 356 L${p.x + 22} 356 Z" fill="#c4b5fd"/>`;
      }).join('');
      const deck = points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
      const cursor = points[state.cursor];
      const truck = state.truck ? (() => { const x = 60 + state.truck.x * (w - 120), y = baseY - 32; return `<g><rect x="${x - 28}" y="${y - 18}" width="56" height="30" rx="8" fill="#fb7185"/><circle cx="${x - 18}" cy="${y + 16}" r="7" fill="#111827"/><circle cx="${x + 18}" cy="${y + 16}" r="7" fill="#111827"/></g>`; })() : '';
      const stressLine = Math.min(1, state.stress / 75) * 720;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.innerHTML = `<rect width="${w}" height="${h}" fill="${state.quake ? '#120816' : '#07121f'}"/><path d="M0 358 H${w}" stroke="#334155" stroke-width="4"/><path d="${deck}" fill="none" stroke="#e5e7eb" stroke-width="16" stroke-linecap="round"/><path d="${deck}" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" opacity=".85"/>${builds}${points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="${i === state.cursor ? 15 : 10}" fill="${i === state.cursor ? '#fbbf24' : '#f8fafc'}"/><text x="${p.x}" y="${p.y + 35}" fill="#cbd5e1" font-size="18" text-anchor="middle">${Math.round(strengthAt(i))}</text>`).join('')}<rect x="90" y="34" width="720" height="12" rx="6" fill="#1f2937"/><rect x="90" y="34" width="${stressLine}" height="12" rx="6" fill="${state.stress > 55 ? '#fb7185' : '#34d399'}"/>${truck}<circle cx="${cursor.x}" cy="${cursor.y - 58}" r="9" fill="#fbbf24"><title>Cursor joint</title></circle><text x="60" y="34" fill="#cbd5e1" font-size="16">Stress</text><text x="830" y="34" fill="#cbd5e1" font-size="16">${Math.round(state.stress)}</text>`;
    }

    function tear() {
      cancelAnimationFrame(state.raf);
      state.running = false;
      if (state.ac && state.ac.state !== 'closed') state.ac.close().catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', style);
})();
