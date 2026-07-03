(() => {
  const APP = {
    name: 'Foundry Shift',
    emoji: '🏭',
    category: 'play',
    version: '1.0.0',
    summary: 'Run a tiny production floor with orders, heat, defects, setup changes, and delivery windows.',
    description: 'A local sequencing strategy game with machine setup costs, heat management, rush orders, defect risk, scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and clean teardown.'
  };
  const JOBS = [
    { code: 'Bolt', material: 'steel', due: 3, value: 32, heat: 2, setup: 1 },
    { code: 'Seal', material: 'rubber', due: 4, value: 28, heat: 1, setup: 2 },
    { code: 'Lens', material: 'glass', due: 5, value: 42, heat: 3, setup: 3 },
    { code: 'Gear', material: 'steel', due: 6, value: 46, heat: 3, setup: 2 },
    { code: 'Valve', material: 'alloy', due: 7, value: 54, heat: 4, setup: 3 },
    { code: 'Sensor', material: 'glass', due: 8, value: 60, heat: 4, setup: 4 }
  ];
  const MATERIALS = ['steel', 'rubber', 'glass', 'alloy'];

  function installStyles() {
    if (document.querySelector('#foundry-shift-styles')) return;
    const style = document.createElement('style');
    style.id = 'foundry-shift-styles';
    style.textContent = `.foundry-card{animation:foundry-rise .32s ease both}.foundry-game{max-width:960px;gap:14px}.foundry-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.foundry-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.foundry-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.foundry-stat strong{display:block;margin-top:4px;font-size:1rem}.foundry-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#12131a;color:white;cursor:pointer;touch-action:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.foundry-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.foundry-board canvas{display:block;width:100%;min-height:380px}.foundry-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.foundry-overlay strong{font-size:clamp(1.05rem,3vw,1.5rem)}.foundry-overlay small{display:block;max-width:650px;color:rgba(255,255,255,.76)}.foundry-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#fed7aa;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.foundry-jobs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.foundry-jobs button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.foundry-jobs button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.foundry-jobs span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.foundry-log{min-height:112px;padding:17px 19px}.foundry-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:760px){.foundry-hud{grid-template-columns:repeat(2,1fr)}.foundry-jobs{grid-template-columns:repeat(2,1fr)}.foundry-board canvas{min-height:340px}.foundry-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.foundry-card{animation:none}}@keyframes foundry-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-foundry-shift-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.foundryShiftCard = 'true';
    card.classList.add('foundry-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openFoundryShift);
    grid.append(node);
  }

  function openFoundryShift() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Foundry%20Shift';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel foundry-game';
    const hud = document.createElement('div');
    hud.className = 'foundry-hud';
    hud.innerHTML = '<div class="foundry-stat"><span>Shift</span><strong id="foundry-shift">1 / 3</strong></div><div class="foundry-stat"><span>Minute</span><strong id="foundry-minute">0</strong></div><div class="foundry-stat"><span>Heat</span><strong id="foundry-heat">0</strong></div><div class="foundry-stat"><span>Delivered</span><strong id="foundry-delivered">0</strong></div><div class="foundry-stat"><span>Score</span><strong id="foundry-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'foundry-board';
    board.setAttribute('aria-label', 'Foundry Shift board. Select a job, sequence production, cool the line, and avoid late or defective orders.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="foundry-overlay"><span><strong>Sequence jobs before the line overheats.</strong><small>Tap a job card, use arrows to choose, Enter to run, Space to cool, and Backspace to scrap the riskiest order.</small></span><span class="foundry-badge">Factory puzzle</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const jobs = document.createElement('div');
    jobs.className = 'foundry-jobs';
    const log = document.createElement('div');
    log.className = 'result-card foundry-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const button = (text, fn, secondary) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = secondary ? 'button button-secondary' : 'button';
      item.textContent = text;
      item.addEventListener('click', fn);
      return item;
    };
    actions.append(button('Run job', runSelected), button('Cool line', cool, true), button('Scrap risk', scrap, true), button('Next shift', nextShift), button('Restart', reset, true));
    root.append(hud, board, jobs, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { shift: 0, minute: 0, heat: 0, setup: 'steel', score: 0, delivered: 0, selected: 0, completed: new Set(), scrapped: new Set(), rush: null, tick: 0, raf: 0, done: false };
    const activeJobs = () => JOBS.map((job, index) => ({ ...job, index, due: job.due + state.shift * 2 + (state.rush === index ? -1 : 0), value: job.value + state.shift * 8 + (state.rush === index ? 18 : 0), heat: job.heat + state.shift }));
    const openJobs = () => activeJobs().filter((job) => !state.completed.has(job.index) && !state.scrapped.has(job.index));
    const selectedJob = () => activeJobs()[state.selected];
    const setupCost = (job) => job.material === state.setup ? 0 : job.setup;
    const riskFor = (job) => Math.max(0, state.heat + job.heat - 8) + Math.max(0, state.minute + 1 + setupCost(job) - job.due);

    function runSelected() {
      if (state.done) return;
      const job = selectedJob();
      if (!job || state.completed.has(job.index) || state.scrapped.has(job.index)) return say('<strong>That order is no longer available.</strong><small>Choose a live order from the production queue.</small>');
      const change = setupCost(job);
      const duration = 1 + change;
      const finish = state.minute + duration;
      const late = Math.max(0, finish - job.due);
      const risk = riskFor(job);
      state.minute = finish;
      state.heat += job.heat + Math.ceil(change / 2);
      state.setup = job.material;
      state.completed.add(job.index);
      state.delivered += 1;
      const defect = risk >= 4;
      const points = Math.max(4, job.value - late * 13 - (defect ? 22 : 0) - Math.max(0, state.heat - 10) * 5);
      state.score += points;
      say(`<strong>${job.code} delivered for ${points} points.</strong><small>${change ? `Setup change cost ${change} minutes. ` : 'No setup change. '}Late penalty ${late}. ${defect ? 'High heat caused rework.' : 'Quality held.'}</small>`);
      if (state.heat >= 14) {
        state.score = Math.max(0, state.score - 35);
        state.heat = 9;
        say('<strong>The line tripped a thermal breaker.</strong><small>You lost 35 points and emergency cooling reset heat to 9. Cool earlier next run.</small>');
      }
      checkEnd();
      update();
    }

    function cool() {
      if (state.done) return;
      state.minute += 1;
      state.heat = Math.max(0, state.heat - 4);
      state.score = Math.max(0, state.score - 3);
      say('<strong>Cooling pass complete.</strong><small>One minute spent, heat reduced by four, and the shift lost three points of idle cost.</small>');
      checkEnd();
      update();
    }

    function scrap() {
      if (state.done) return;
      const risk = openJobs().sort((a, b) => riskFor(b) - riskFor(a))[0];
      if (!risk) return say('<strong>No risky order remains.</strong><small>The queue is already empty.</small>');
      state.scrapped.add(risk.index);
      state.score = Math.max(0, state.score - 18);
      state.minute += 1;
      say(`<strong>${risk.code} scrapped before it jammed the line.</strong><small>You lost 18 points and one minute, but removed the highest-risk order.</small>`);
      checkEnd();
      update();
    }

    function nextShift() {
      state.shift = (state.shift + 1) % 3;
      reset(false);
    }

    function reset(keepShift = true) {
      if (!keepShift) state.score = 0;
      state.minute = 0;
      state.heat = 0;
      state.setup = MATERIALS[state.shift % MATERIALS.length];
      state.completed.clear();
      state.scrapped.clear();
      state.selected = 0;
      state.delivered = 0;
      state.done = false;
      state.rush = (state.shift + 2) % JOBS.length;
      say(`<strong>Shift ${state.shift + 1}: starting setup ${state.setup}.</strong><small>Deliver at least four orders. Rush order ${JOBS[state.rush].code} pays more but expires sooner.</small>`);
      update();
    }

    function checkEnd() {
      const remaining = openJobs().length;
      const lateOpen = openJobs().filter((job) => state.minute > job.due + 2).length;
      if (state.delivered >= 4 || remaining === 0 || lateOpen >= 3 || state.minute >= 12) {
        state.done = true;
        const bonus = Math.max(0, 12 - state.minute) * 4 + Math.max(0, 10 - state.heat) * 3 + state.delivered * 6;
        state.score += bonus;
        say(`<strong>Shift closed at ${state.score} points.</strong><small>${state.delivered} delivered, ${state.scrapped.size} scrapped, heat ${state.heat}. Bonus ${bonus}. Try a different setup sequence for a cleaner run.</small>`);
      }
    }

    function say(html) { log.innerHTML = html; }
    function updateHud() {
      hud.querySelector('#foundry-shift').textContent = `${state.shift + 1} / 3`;
      hud.querySelector('#foundry-minute').textContent = `${state.minute} / 12`;
      hud.querySelector('#foundry-heat').textContent = `${state.heat} / 14`;
      hud.querySelector('#foundry-delivered').textContent = `${state.delivered} / 4`;
      hud.querySelector('#foundry-score').textContent = state.score;
    }
    function updateJobs() {
      jobs.replaceChildren();
      activeJobs().forEach((job, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.disabled = state.completed.has(index) || state.scrapped.has(index);
        item.setAttribute('aria-pressed', String(index === state.selected));
        item.innerHTML = `<strong>${job.code}${state.rush === index ? ' rush' : ''}</strong><span>${job.material} · due ${job.due} · heat ${job.heat} · risk ${riskFor(job)}</span>`;
        item.addEventListener('click', () => { state.selected = index; draw(); updateJobs(); });
        jobs.append(item);
      });
    }
    function update() { updateHud(); updateJobs(); draw(); }

    function choose(delta) {
      const available = activeJobs().map((job, index) => index).filter((index) => !state.completed.has(index) && !state.scrapped.has(index));
      if (!available.length) return;
      const current = Math.max(0, available.indexOf(state.selected));
      state.selected = available[(current + delta + available.length) % available.length];
      update();
    }
    board.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); choose(1); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); choose(-1); }
      if (event.key === 'Enter') { event.preventDefault(); runSelected(); }
      if (event.key === ' ') { event.preventDefault(); cool(); }
      if (event.key === 'Backspace') { event.preventDefault(); scrap(); }
    });
    board.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const row = Math.floor((event.clientY - rect.top) / Math.max(1, rect.height / 3));
      const col = Math.floor((event.clientX - rect.left) / Math.max(1, rect.width / 2));
      const index = Math.max(0, Math.min(5, row * 2 + col));
      state.selected = index;
      if (!state.completed.has(index) && !state.scrapped.has(index)) runSelected(); else update();
    });

    function draw() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(340, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#12131a';
      ctx.fillRect(0, 0, w, h);
      const cellW = w / 2;
      const cellH = h / 3;
      activeJobs().forEach((job, index) => {
        const x = (index % 2) * cellW;
        const y = Math.floor(index / 2) * cellH;
        const disabled = state.completed.has(index) || state.scrapped.has(index);
        ctx.fillStyle = disabled ? '#26303a' : index === state.selected ? '#7c2d12' : '#1f2937';
        ctx.fillRect(x + 8, y + 8, cellW - 16, cellH - 16);
        ctx.strokeStyle = index === state.selected ? '#fed7aa' : 'rgba(255,255,255,.16)';
        ctx.lineWidth = index === state.selected ? 4 : 1;
        ctx.strokeRect(x + 8, y + 8, cellW - 16, cellH - 16);
        ctx.fillStyle = disabled ? '#94a3b8' : '#fff7ed';
        ctx.font = '700 18px system-ui';
        ctx.fillText(`${job.code}${state.rush === index ? ' !' : ''}`, x + 22, y + 34);
        ctx.font = '12px system-ui';
        ctx.fillText(`${job.material} due ${job.due}`, x + 22, y + 56);
        ctx.fillText(`heat ${job.heat} risk ${riskFor(job)}`, x + 22, y + 76);
        ctx.fillStyle = disabled ? '#64748b' : ['#f97316','#22c55e','#38bdf8','#a78bfa'][MATERIALS.indexOf(job.material)];
        ctx.beginPath();
        ctx.arc(x + cellW - 38, y + 42, 16, 0, Math.PI * 2);
        ctx.fill();
        if (!reduced && !disabled) {
          ctx.fillStyle = 'rgba(253,186,116,.7)';
          ctx.fillRect(x + 22 + ((state.tick + index * 17) % Math.max(30, cellW - 80)), y + cellH - 30, 28, 4);
        }
      });
      ctx.fillStyle = 'rgba(255,255,255,.82)';
      ctx.font = '700 13px system-ui';
      ctx.fillText(`Setup: ${state.setup} · Cool before heat 14`, 18, h - 18);
      if (!reduced) state.tick = (state.tick + 1) % 900;
    }
    function loop() { draw(); state.raf = reduced ? 0 : requestAnimationFrame(loop); }
    const close = () => { if (state.raf) cancelAnimationFrame(state.raf); window.removeEventListener('resize', draw); };
    document.querySelector('#app-dialog')?.addEventListener('close', close, { once: true });
    window.addEventListener('resize', draw, { passive: true });
    reset();
    if (!reduced) loop();
  }

  window.addEventListener('DOMContentLoaded', () => setTimeout(initCard, 250));
})();
