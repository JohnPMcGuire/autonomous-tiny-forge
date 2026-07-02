(() => {
  const APP = {
    name: 'Orbit Smith',
    emoji: '🛰️',
    category: 'play',
    version: '1.0.0',
    summary: 'Aim probes through gravity wells to tag beacons before fuel and hull run out.',
    description: 'A local slingshot puzzle with gravity, launch planning, limited fuel, beacon contracts, hazards, scoring, touch, keyboard, and responsive canvas play.'
  };

  const MISSIONS = [
    { title: 'First burn', beacons: 2, fuel: 6, hull: 3, gravity: 0.04, hazard: false, wind: 0 },
    { title: 'Cross pull', beacons: 3, fuel: 7, hull: 3, gravity: 0.052, hazard: true, wind: 0.012 },
    { title: 'Thin margin', beacons: 4, fuel: 8, hull: 2, gravity: 0.061, hazard: true, wind: -0.016 }
  ];

  function installStyles() {
    if (document.querySelector('#orbit-smith-styles')) return;
    const style = document.createElement('style');
    style.id = 'orbit-smith-styles';
    style.textContent = `
      .orbit-card { animation: orbit-rise .36s ease both; }
      .orbit-game { max-width: 900px; gap: 14px; }
      .orbit-hud { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
      .orbit-stat { border: 1px solid var(--line); border-radius: 15px; background: white; padding: 10px 12px; }
      .orbit-stat span { display: block; color: var(--muted); font-size: .64rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
      .orbit-stat strong { display: block; margin-top: 4px; font-size: 1rem; }
      .orbit-board { position: relative; border: 0; border-radius: 26px; padding: 0; overflow: hidden; background: #06120f; color: white; cursor: crosshair; touch-action: none; box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); }
      .orbit-board:focus-visible { outline: 4px solid var(--accent); outline-offset: 4px; }
      .orbit-board canvas { display: block; width: 100%; min-height: 360px; }
      .orbit-overlay { position: absolute; left: 18px; right: 18px; bottom: 16px; display: flex; justify-content: space-between; gap: 12px; align-items: end; pointer-events: none; }
      .orbit-overlay strong { font-size: clamp(1.1rem, 3vw, 1.55rem); }
      .orbit-overlay small { display: block; max-width: 580px; color: rgba(255,255,255,.72); }
      .orbit-badge { padding: 7px 9px; border-radius: 999px; background: rgba(255,255,255,.12); color: #fff2bd; font-size: .68rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      .orbit-log { min-height: 102px; padding: 17px 19px; }
      .orbit-log strong { font-size: clamp(1.1rem, 3vw, 1.55rem); }
      @media (max-width: 620px) { .orbit-hud { grid-template-columns: repeat(2, 1fr); } .orbit-board canvas { min-height: 330px; } .orbit-overlay { align-items: start; flex-direction: column; } }
      @media (prefers-reduced-motion: reduce) { .orbit-card { animation: none; } }
      @keyframes orbit-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-orbit-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.orbitCard = 'true';
    card.classList.add('orbit-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const button = node.querySelector('.app-card-button');
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', openOrbitSmith);
    grid.append(node);
  }

  function openOrbitSmith() {
    const dialog = document.querySelector('#app-dialog');
    const stage = document.querySelector('#app-stage');
    const title = document.querySelector('#dialog-title');
    const category = document.querySelector('#dialog-category');
    const description = document.querySelector('#dialog-description');
    const feedback = document.querySelector('#dialog-feedback');
    if (!dialog || !stage || !title || !category || !description || !feedback) return;
    title.textContent = APP.name;
    category.textContent = `Play · ${APP.emoji}`;
    description.textContent = APP.description;
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Orbit%20Smith';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function makeButton(text, onClick, secondary = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = secondary ? 'button button-secondary' : 'button';
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel orbit-game';
    const hud = document.createElement('div');
    hud.className = 'orbit-hud';
    hud.innerHTML = '<div class="orbit-stat"><span>Mission</span><strong id="orbit-mission">1 / 3</strong></div><div class="orbit-stat"><span>Beacons</span><strong id="orbit-beacons">0</strong></div><div class="orbit-stat"><span>Fuel</span><strong id="orbit-fuel">0</strong></div><div class="orbit-stat"><span>Score</span><strong id="orbit-score">0</strong></div>';

    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'orbit-board';
    board.setAttribute('aria-label', 'Orbit Smith board. Drag or use arrow keys to aim, then launch probes through gravity wells into beacons.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="orbit-overlay"><span><strong>Drag from the launch ring to aim a probe.</strong><small>Curve around gravity wells, tag beacons, avoid debris, and save enough fuel for the next shot.</small></span><span class="orbit-badge">Drag · arrows · space</span></span>';
    const canvas = board.querySelector('canvas');
    const context = canvas.getContext('2d');
    const log = document.createElement('div');
    log.className = 'result-card orbit-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    actions.append(makeButton('Launch probe', launchProbe), makeButton('Next mission', nextMission, true), makeButton('Reset mission', resetMission, true));
    root.append(hud, board, log, actions);
    stage.append(root);

    const state = {
      mission: 0,
      fuel: MISSIONS[0].fuel,
      hull: MISSIONS[0].hull,
      score: 0,
      tagged: [],
      probe: null,
      aim: { x: 0.66, y: -0.42 },
      dragging: false,
      raf: 0,
      last: 0,
      complete: false,
      layout: null
    };

    function currentMission() { return MISSIONS[state.mission]; }

    function makeLayout() {
      const m = currentMission();
      const beacons = Array.from({ length: m.beacons }, (_, index) => ({
        x: 0.58 + (index % 2) * 0.22 - index * 0.035,
        y: 0.24 + index * 0.16,
        r: 0.035,
        id: index
      }));
      return {
        start: { x: 0.15, y: 0.78, r: 0.04 },
        wells: [
          { x: 0.38, y: 0.42, mass: m.gravity, r: 0.07 },
          { x: 0.68, y: 0.58, mass: m.gravity * 0.82, r: 0.06 }
        ],
        debris: m.hazard ? [{ x: 0.52, y: 0.72, r: 0.05 }, { x: 0.76, y: 0.32, r: 0.045 }] : [],
        beacons
      };
    }

    function resetMission(clearScore = true) {
      if (clearScore) state.score = 0;
      state.fuel = currentMission().fuel;
      state.hull = currentMission().hull;
      state.tagged = [];
      state.probe = null;
      state.complete = false;
      state.aim = { x: 0.66, y: -0.42 };
      state.layout = makeLayout();
      writeLog(`<strong>${currentMission().title} loaded.</strong><small>Tag ${currentMission().beacons} beacons with ${state.fuel} fuel and ${state.hull} hull. Drag farther for a stronger burn.</small>`);
      update();
    }

    function nextMission() {
      state.mission = (state.mission + 1) % MISSIONS.length;
      state.score = 0;
      resetMission(false);
    }

    function launchProbe() {
      if (state.probe || state.complete) return;
      if (state.fuel <= 0) {
        state.complete = true;
        writeLog('<strong>Fuel spent.</strong><small>Reset and try a slower gravity-assisted route.</small>');
        update();
        return;
      }
      const burn = Math.min(1.15, Math.max(0.28, Math.hypot(state.aim.x, state.aim.y)));
      const start = state.layout.start;
      state.fuel -= 1;
      state.probe = {
        x: start.x,
        y: start.y,
        vx: state.aim.x * 0.0065 * burn,
        vy: state.aim.y * 0.0065 * burn,
        age: 0,
        trail: []
      };
      writeLog('<strong>Probe away.</strong><small>Gravity wells bend the path every frame. A soft near miss can still set up the next launch.</small>');
      update();
    }

    function stepProbe() {
      if (!state.probe) return;
      const probe = state.probe;
      const mission = currentMission();
      for (let i = 0; i < 4; i += 1) {
        for (const well of state.layout.wells) {
          const dx = well.x - probe.x;
          const dy = well.y - probe.y;
          const distSq = Math.max(0.0025, dx * dx + dy * dy);
          const pull = well.mass / distSq;
          probe.vx += dx * pull * 0.00055;
          probe.vy += dy * pull * 0.00055;
        }
        probe.vx += mission.wind * 0.00004;
        probe.x += probe.vx;
        probe.y += probe.vy;
        probe.age += 1;
        probe.trail.push({ x: probe.x, y: probe.y });
        if (probe.trail.length > 52) probe.trail.shift();
        for (const beacon of state.layout.beacons) {
          if (state.tagged.includes(beacon.id)) continue;
          if (distance(probe, beacon) < beacon.r + 0.024) {
            state.tagged.push(beacon.id);
            state.score += 40 + state.fuel * 3 + state.hull * 5;
            writeLog(`<strong>Beacon ${state.tagged.length} tagged.</strong><small>${state.tagged.length === currentMission().beacons ? 'Contract complete.' : 'Line up the next burn from the launch ring.'}</small>`);
            state.probe = null;
            if (state.tagged.length === currentMission().beacons) {
              state.complete = true;
              state.score += state.fuel * 8 + state.hull * 15;
              writeLog(`<strong>${currentMission().title} complete: ${state.score} points.</strong><small>Advance for stronger gravity, debris, and drift.</small>`);
            }
            update();
            return;
          }
        }
        for (const debris of state.layout.debris) {
          if (distance(probe, debris) < debris.r + 0.02) {
            state.hull -= 1;
            state.score = Math.max(0, state.score - 9);
            state.probe = null;
            writeLog(`<strong>Debris strike.</strong><small>Hull is now ${state.hull}. Use a wider gravity arc or reset the contract.</small>`);
            if (state.hull <= 0) {
              state.complete = true;
              writeLog('<strong>Hull failed safely.</strong><small>Reset and use the wells instead of cutting through debris.</small>');
            }
            update();
            return;
          }
        }
        if (probe.x < -0.08 || probe.x > 1.08 || probe.y < -0.08 || probe.y > 1.08 || probe.age > 620) {
          state.probe = null;
          writeLog('<strong>Probe drifted out.</strong><small>No hull lost, but the fuel is gone. Adjust the launch vector.</small>');
          if (state.fuel <= 0) state.complete = true;
          update();
          return;
        }
      }
    }

    function updateAim(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const start = state.layout.start;
      const sx = rect.left + start.x * rect.width;
      const sy = rect.top + start.y * rect.height;
      state.aim.x = Math.max(-1, Math.min(1, (clientX - sx) / 160));
      state.aim.y = Math.max(-1, Math.min(1, (clientY - sy) / 160));
      draw();
    }

    function update() {
      hud.querySelector('#orbit-mission').textContent = `${state.mission + 1} / ${MISSIONS.length} · hull ${state.hull}`;
      hud.querySelector('#orbit-beacons').textContent = `${state.tagged.length} / ${currentMission().beacons}`;
      hud.querySelector('#orbit-fuel').textContent = String(state.fuel);
      hud.querySelector('#orbit-score').textContent = String(state.score);
      draw();
    }

    function draw() {
      if (!state.layout) return;
      const bounds = board.getBoundingClientRect();
      const width = Math.max(320, Math.floor(bounds.width));
      const height = Math.max(340, Math.floor(width * 0.58));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#06120f';
      context.fillRect(0, 0, width, height);
      drawStars(width, height);
      state.layout.wells.forEach((well) => drawCircle(well, width, height, '#4b6bff', 'rgba(75,107,255,.18)'));
      state.layout.debris.forEach((item) => drawCircle(item, width, height, '#ff6f4a', 'rgba(255,111,74,.2)'));
      state.layout.beacons.forEach((beacon) => drawBeacon(beacon, width, height));
      drawLaunch(width, height);
      if (state.probe) drawProbe(width, height);
    }

    function drawStars(width, height) {
      context.fillStyle = 'rgba(255,255,255,.28)';
      for (let i = 0; i < 44; i += 1) {
        const x = ((i * 83) % 997) / 997 * width;
        const y = ((i * 47) % 631) / 631 * height;
        context.fillRect(x, y, i % 3 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
      }
    }

    function drawCircle(item, width, height, core, halo) {
      const x = item.x * width;
      const y = item.y * height;
      const r = item.r * Math.min(width, height);
      context.fillStyle = halo;
      context.beginPath();
      context.arc(x, y, r * 2.2, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = core;
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
      context.fill();
    }

    function drawBeacon(beacon, width, height) {
      const tagged = state.tagged.includes(beacon.id);
      const x = beacon.x * width;
      const y = beacon.y * height;
      const r = beacon.r * Math.min(width, height);
      context.strokeStyle = tagged ? '#bfe7d1' : '#fff2bd';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = tagged ? 'rgba(191,231,209,.28)' : 'rgba(255,242,189,.18)';
      context.beginPath();
      context.arc(x, y, r * 0.68, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#ffffff';
      context.font = '900 13px system-ui, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(String(beacon.id + 1), x, y);
    }

    function drawLaunch(width, height) {
      const start = state.layout.start;
      const x = start.x * width;
      const y = start.y * height;
      context.strokeStyle = '#bfe7d1';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(x, y, start.r * Math.min(width, height), 0, Math.PI * 2);
      context.stroke();
      if (!state.probe && !state.complete) {
        context.strokeStyle = '#ff6f4a';
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + state.aim.x * 118, y + state.aim.y * 118);
        context.stroke();
      }
    }

    function drawProbe(width, height) {
      const p = state.probe;
      context.strokeStyle = 'rgba(255,242,189,.38)';
      context.lineWidth = 2;
      context.beginPath();
      p.trail.forEach((point, index) => {
        const x = point.x * width;
        const y = point.y * height;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
      context.fillStyle = '#ff6f4a';
      context.beginPath();
      context.arc(p.x * width, p.y * height, 8, 0, Math.PI * 2);
      context.fill();
    }

    function distance(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function writeLog(html) { log.innerHTML = html; }

    function tick(now) {
      if (document.body.contains(root)) {
        if (!state.last || now - state.last > 16) {
          stepProbe();
          state.last = now;
        }
        if (state.probe) draw();
        state.raf = window.requestAnimationFrame(tick);
      } else if (state.raf) window.cancelAnimationFrame(state.raf);
    }

    board.addEventListener('pointerdown', (event) => {
      if (state.probe || state.complete) return;
      state.dragging = true;
      board.setPointerCapture(event.pointerId);
      updateAim(event.clientX, event.clientY);
    });
    board.addEventListener('pointermove', (event) => {
      if (state.dragging) updateAim(event.clientX, event.clientY);
    });
    board.addEventListener('pointerup', (event) => {
      if (!state.dragging) return;
      state.dragging = false;
      board.releasePointerCapture(event.pointerId);
      launchProbe();
    });
    board.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); state.aim.x -= 0.08; }
      else if (event.key === 'ArrowRight') { event.preventDefault(); state.aim.x += 0.08; }
      else if (event.key === 'ArrowUp') { event.preventDefault(); state.aim.y -= 0.08; }
      else if (event.key === 'ArrowDown') { event.preventDefault(); state.aim.y += 0.08; }
      else if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); launchProbe(); }
      else return;
      state.aim.x = Math.max(-1, Math.min(1, state.aim.x));
      state.aim.y = Math.max(-1, Math.min(1, state.aim.y));
      draw();
    });
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(board);
    resetMission();
    state.raf = window.requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCard);
  else initCard();
})();