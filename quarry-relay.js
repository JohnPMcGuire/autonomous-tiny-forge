(() => {
  const APP = {
    name: 'Quarry Relay', emoji: '⛏️', category: 'play', version: '1.0.0',
    summary: 'Route mixed ore carts through switchbacks, crushers, and contracts before the quarry jams.',
    description: 'A local logistics puzzle with cart types, switch timing, crusher capacity, contract goals, jam recovery, scoring, responsive canvas rendering, touch, pointer and keyboard controls, reduced-motion behavior, and clean teardown.'
  };

  const LEVELS = [
    { name: 'Starter seam', quota: { copper: 2, quartz: 1 }, carts: 'copper quartz copper slate copper quartz'.split(' '), crushers: [2, 3, 2], jam: 6 },
    { name: 'Night vein', quota: { iron: 2, copper: 2, quartz: 1 }, carts: 'iron slate copper quartz iron copper slate quartz copper'.split(' '), crushers: [2, 2, 3], jam: 5 },
    { name: 'Flooded cut', quota: { quartz: 2, iron: 2, copper: 2 }, carts: 'quartz iron slate copper quartz iron copper slate iron copper'.split(' '), crushers: [1, 3, 2], jam: 4 }
  ];
  const ORE = {
    copper: { label: 'Copper', color: '#f59e0b', lane: 0 },
    quartz: { label: 'Quartz', color: '#bae6fd', lane: 1 },
    iron: { label: 'Iron', color: '#94a3b8', lane: 2 },
    slate: { label: 'Slate', color: '#475569', lane: 3 }
  };

  function installStyles() {
    if (document.querySelector('#quarry-relay-styles')) return;
    const style = document.createElement('style');
    style.id = 'quarry-relay-styles';
    style.textContent = `.quarry-card{animation:quarry-pop .32s ease both}.quarry-game{max-width:970px;gap:14px}.quarry-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.quarry-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.quarry-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.quarry-stat strong{display:block;margin-top:4px;font-size:1rem}.quarry-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#17110b;color:white;cursor:pointer;touch-action:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.quarry-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.quarry-board canvas{display:block;width:100%;min-height:420px}.quarry-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.quarry-overlay strong{font-size:clamp(1.05rem,3vw,1.5rem)}.quarry-overlay small{display:block;max-width:680px;color:rgba(255,255,255,.76)}.quarry-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#fde68a;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.quarry-switches{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.quarry-switches button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.quarry-switches button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.quarry-switches span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.quarry-log{min-height:116px;padding:17px 19px}.quarry-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:760px){.quarry-hud{grid-template-columns:repeat(2,1fr)}.quarry-switches{grid-template-columns:1fr}.quarry-board canvas{min-height:360px}.quarry-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.quarry-card{animation:none}}@keyframes quarry-pop{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-quarry-relay-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.quarryRelayCard = 'true';
    card.classList.add('quarry-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openQuarryRelay);
    grid.append(node);
  }

  function openQuarryRelay() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Quarry%20Relay';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel quarry-game';
    const hud = document.createElement('div');
    hud.className = 'quarry-hud';
    hud.innerHTML = '<div class="quarry-stat"><span>Seam</span><strong id="quarry-level">1 / 3</strong></div><div class="quarry-stat"><span>Tick</span><strong id="quarry-tick">0</strong></div><div class="quarry-stat"><span>Queue</span><strong id="quarry-queue">0</strong></div><div class="quarry-stat"><span>Jams</span><strong id="quarry-jams">0</strong></div><div class="quarry-stat"><span>Score</span><strong id="quarry-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'quarry-board';
    board.setAttribute('aria-label', 'Quarry Relay board. Select switches, route ore carts, crush useful ore, bypass slate, and clear jams.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="quarry-overlay"><span><strong>Sort valuable ore before the crusher backs up.</strong><small>Tap switches or use 1, 2, 3 to aim belts. Space releases a cart. C clears a jam. N advances after quota.</small></span><span class="quarry-badge">Switch logistics</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const switches = document.createElement('div');
    switches.className = 'quarry-switches';
    const log = document.createElement('div');
    log.className = 'result-card quarry-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const makeButton = (text, fn, secondary) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = secondary ? 'button button-secondary' : 'button';
      item.textContent = text;
      item.addEventListener('click', fn);
      return item;
    };
    actions.append(makeButton('Release cart', releaseCart, false), makeButton('Clear jam', clearJam, true), makeButton('Next seam', nextLevel, true), makeButton('Restart', reset, true));
    root.append(hud, board, switches, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { level: 0, tick: 0, queue: [], carts: [], switches: [0, 1, 2], delivered: {}, jams: 0, jammed: false, score: 0, cleared: false, done: false, raf: 0, pulse: 0 };

    function current() { return LEVELS[state.level]; }
    function say(html) { log.innerHTML = html; }
    function loadLevel(index) {
      const level = LEVELS[index];
      state.level = index; state.tick = 0; state.queue = level.carts.slice(); state.carts = [];
      state.switches = [0, 1, 2]; state.delivered = {}; state.jams = 0; state.jammed = false;
      state.cleared = false; state.done = false;
      say(`<strong>${level.name} opened.</strong><small>Match ore to contract lanes. Slate should be bypassed or it consumes crusher room.</small>`);
      update();
    }
    function releaseCart() {
      if (state.done) return;
      if (state.cleared) return say('<strong>This seam is complete.</strong><small>Advance to the next seam or restart for a cleaner score.</small>');
      if (state.jammed) return say('<strong>The belt is jammed.</strong><small>Clear the jam before releasing another cart.</small>');
      const ore = state.queue.shift();
      if (!ore) return finishLevel();
      state.carts.push({ ore, step: 0, lane: 1, x: 0 });
      state.tick += 1;
      state.score = Math.max(0, state.score - 1);
      say(`<strong>${ORE[ore].label} cart released.</strong><small>Set switches before it reaches the final splitter.</small>`);
      moveCarts(); update(); finishLevel();
    }
    function toggleSwitch(index) {
      if (state.done || state.cleared) return;
      state.switches[index] = (state.switches[index] + 1) % 4;
      state.tick += 1;
      state.score = Math.max(0, state.score - 1);
      say(`<strong>Switch ${index + 1} now aims at ${laneName(state.switches[index])}.</strong><small>Every adjustment spends a tick, but prevents expensive misroutes.</small>`);
      moveCarts(); update();
    }
    function moveCarts() {
      const cap = current().crushers;
      for (const cart of state.carts.filter((item) => !item.done)) {
        if (cart.step < 3) {
          cart.lane = state.switches[cart.step];
          cart.step += 1;
          cart.x = cart.step / 3;
        } else {
          cart.done = true;
          const targetLane = ORE[cart.ore].lane;
          const useful = cart.ore !== 'slate';
          if (!useful && cart.lane !== 3) {
            state.jams += 1; state.jammed = state.jams >= current().jam;
            state.score = Math.max(0, state.score - 10);
            say('<strong>Slate hit the crusher teeth.</strong><small>Bypass waste rock to avoid jam pressure.</small>');
          } else if (useful && cart.lane === targetLane) {
            state.delivered[cart.ore] = (state.delivered[cart.ore] || 0) + 1;
            state.score += 30 + Math.max(0, 8 - state.tick);
            say(`<strong>${ORE[cart.ore].label} sorted cleanly.</strong><small>Quota progress earns bonuses when the line stays fast.</small>`);
          } else if (useful && cap[cart.lane] > 1) {
            state.delivered[cart.ore] = (state.delivered[cart.ore] || 0) + 1;
            state.jams += 1;
            state.score += 8;
            say(`<strong>${ORE[cart.ore].label} was recovered on a rough lane.</strong><small>It counts, but crusher capacity takes a jam penalty.</small>`);
          } else {
            state.jams += 2; state.score = Math.max(0, state.score - 8);
            say(`<strong>${ORE[cart.ore].label} missed the recovery lane.</strong><small>Low-capacity crushers turn misroutes into serious jams.</small>`);
          }
        }
      }
      if (state.jams >= current().jam) {
        state.jammed = true;
        say('<strong>The quarry line is jammed.</strong><small>Spend a recovery action before any more carts can move.</small>');
      }
      state.carts = state.carts.filter((item) => !item.done || state.carts.length < 8);
    }
    function clearJam() {
      if (state.done || state.cleared) return;
      state.tick += 2;
      state.jams = Math.max(0, state.jams - 2);
      state.jammed = false;
      state.score = Math.max(0, state.score - 4);
      say('<strong>Recovery crew cleared the transfer chute.</strong><small>It costs time, but protects the remaining contract.</small>');
      update();
    }
    function finishLevel() {
      const quota = current().quota;
      const met = Object.keys(quota).every((key) => (state.delivered[key] || 0) >= quota[key]);
      if (met) {
        state.cleared = true;
        state.score += Math.max(0, 80 - state.tick * 3 - state.jams * 5);
        say(`<strong>${current().name} contract filled.</strong><small>Advance to the next seam. Cleaner routing means a stronger final score.</small>`);
      } else if (!state.queue.length && state.carts.every((item) => item.done)) {
        state.done = true;
        say('<strong>The contract shorted out.</strong><small>Too many carts were misrouted. Restart and reserve high-capacity lanes for recovery only.</small>');
      }
      update();
    }
    function nextLevel() {
      if (!state.cleared) return say('<strong>Quota not filled yet.</strong><small>Deliver the required ore before moving crews to the next seam.</small>');
      if (state.level >= LEVELS.length - 1) {
        state.done = true;
        say(`<strong>Quarry relay complete.</strong><small>Final score ${state.score}. Try again with fewer switch ticks and jam clears.</small>`);
      } else loadLevel(state.level + 1);
    }
    function reset() { loadLevel(0); }
    function laneName(lane) { return lane === 0 ? 'copper' : lane === 1 ? 'quartz' : lane === 2 ? 'iron' : 'bypass'; }
    function quotaText() {
      return Object.entries(current().quota).map(([key, needed]) => `${key} ${(state.delivered[key] || 0)}/${needed}`).join(' · ');
    }
    function roundRect(x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + width, y, x + width, y + height, r); ctx.arcTo(x + width, y + height, x, y + height, r); ctx.arcTo(x, y + height, x, y, r); ctx.arcTo(x, y, x + width, y, r); ctx.closePath();
    }
    function update() {
      hud.querySelector('#quarry-level').textContent = `${state.level + 1} / ${LEVELS.length}`;
      hud.querySelector('#quarry-tick').textContent = state.tick;
      hud.querySelector('#quarry-queue').textContent = `${state.queue.length} left`;
      hud.querySelector('#quarry-jams').textContent = `${state.jams} / ${current().jam}`;
      hud.querySelector('#quarry-score').textContent = state.score;
      switches.replaceChildren(...state.switches.map((lane, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-pressed', 'false');
        button.innerHTML = `<span>Switch ${index + 1}</span>Aim ${laneName(lane)}`;
        button.addEventListener('click', () => toggleSwitch(index));
        return button;
      }));
      draw();
    }
    function resize() {
      const rect = board.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width || 800));
      const height = width < 560 ? 360 : 430;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * ratio); canvas.height = Math.floor(height * ratio);
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    }
    function draw() {
      const width = canvas.clientWidth || 800;
      const height = canvas.clientHeight || 420;
      ctx.clearRect(0, 0, width, height);
      const glow = reduced ? 0 : Math.sin(state.pulse / 18) * 6;
      ctx.fillStyle = '#17110b'; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      const lanes = [height * .32, height * .48, height * .64, height * .78];
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath(); ctx.moveTo(width * .12, height * .18); ctx.bezierCurveTo(width * .34, height * .22, width * .48, lanes[i], width * .82, lanes[i]); ctx.stroke();
      }
      ctx.lineWidth = 3;
      state.switches.forEach((lane, index) => {
        const x = width * (.28 + index * .16);
        ctx.strokeStyle = '#fde68a'; ctx.beginPath(); ctx.moveTo(x, height * .2); ctx.lineTo(x + width * .12, lanes[lane]); ctx.stroke();
        ctx.fillStyle = '#fff7ed'; ctx.beginPath(); ctx.arc(x, height * .2, 10 + glow * .15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1c1208'; ctx.font = '700 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(index + 1), x, height * .2 + 4);
      });
      ['Copper', 'Quartz', 'Iron', 'Bypass'].forEach((label, i) => {
        ctx.fillStyle = i === 3 ? '#0f172a' : '#292524'; roundRect(width * .82, lanes[i] - 20, width * .13, 40, 12); ctx.fill();
        ctx.fillStyle = i === 3 ? '#cbd5e1' : Object.values(ORE)[i].color; ctx.font = '800 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, width * .885, lanes[i] + 4);
      });
      state.carts.forEach((cart, i) => {
        const laneY = lanes[cart.lane] || height * .18;
        const x = width * (.16 + cart.x * .62) - i * 8;
        ctx.fillStyle = ORE[cart.ore].color; roundRect(x, laneY - 12, 34, 24, 8); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(x + 9, laneY + 13, 4, 0, Math.PI * 2); ctx.arc(x + 25, laneY + 13, 4, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '700 13px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`Quota: ${quotaText()}`, 18, 28);
      if (state.jammed) { ctx.fillStyle = 'rgba(239,68,68,.24)'; ctx.fillRect(0, 0, width, height); }
    }
    function animate() {
      state.pulse += 1; draw();
      if (!reduced) state.raf = requestAnimationFrame(animate);
    }
    board.addEventListener('click', (event) => {
      const rect = board.getBoundingClientRect();
      const index = Math.min(2, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * 3)));
      toggleSwitch(index);
    });
    board.addEventListener('keydown', (event) => {
      if (['1', '2', '3'].includes(event.key)) { event.preventDefault(); toggleSwitch(Number(event.key) - 1); }
      if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); releaseCart(); }
      if (event.key.toLowerCase() === 'c') { event.preventDefault(); clearJam(); }
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); nextLevel(); }
      if (event.key.toLowerCase() === 'r') { event.preventDefault(); reset(); }
    });
    const observer = new MutationObserver(() => {
      if (!stage.contains(root)) { cancelAnimationFrame(state.raf); observer.disconnect(); window.removeEventListener('resize', resize); }
    });
    observer.observe(stage, { childList: true });
    window.addEventListener('resize', resize);
    loadLevel(0); resize(); if (!reduced) animate();
  }

  window.addEventListener('DOMContentLoaded', initCard);
  window.addEventListener('load', initCard);
})();