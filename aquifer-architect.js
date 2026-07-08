(() => {
  const APP = {
    name: 'Aquifer Architect', emoji: '💧', category: 'play', version: '1.0.0',
    summary: 'Place wells, recharge basins, barriers, and monitors to keep a town supplied without draining or contaminating the aquifer.',
    description: 'A local groundwater strategy game with layered aquifer simulation, water demand, drought events, contamination plumes, recharge planning, budget tradeoffs, monitor intel, session-only deep aquifer unlock, scoring, responsive grid controls, touch and keyboard support, reduced-motion behavior, optional audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const W = 8, H = 6;
  const modes = {
    valley: { name: 'Valley plan', years: 6, budget: 18, demand: 8, drought: 0.12, plumes: 2 },
    farms: { name: 'Farm compact', years: 7, budget: 20, demand: 10, drought: 0.18, plumes: 3 },
    deep: { name: 'Deep aquifer', years: 8, budget: 21, demand: 12, drought: 0.24, plumes: 4 }
  };
  const tools = {
    well: { name: 'Well', short: 'W', cost: 3 }, basin: { name: 'Recharge basin', short: 'R', cost: 3 },
    barrier: { name: 'Clay barrier', short: 'B', cost: 2 }, monitor: { name: 'Monitor', short: 'M', cost: 1 }, clear: { name: 'Remove plan', short: '×', cost: 0 }
  };
  const lowMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensureStyles() {
    if ($('#aquifer-architect-styles')) return;
    const style = document.createElement('style');
    style.id = 'aquifer-architect-styles';
    style.textContent = `
      .aquifer-card{animation:aquifer-rise .24s ease both}.aquifer-game{max-width:1120px;gap:14px}.aquifer-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.aquifer-stat,.aquifer-board,.aquifer-panel,.aquifer-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.aquifer-stat{padding:10px 12px}.aquifer-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.aquifer-stat strong{display:block;margin-top:4px}.aquifer-layout{display:grid;grid-template-columns:1.1fr .9fr;gap:12px}.aquifer-board{padding:12px;background:linear-gradient(180deg,#dcfce7,#bae6fd 38%,#7dd3fc 39%,#164e63);overflow:hidden}.aquifer-grid{display:grid;grid-template-columns:repeat(8,minmax(32px,1fr));gap:6px;touch-action:manipulation}.aquifer-cell{aspect-ratio:1;border:1px solid rgba(15,23,42,.14);border-radius:13px;background:#e0f2fe;position:relative;display:grid;place-items:center;font-weight:900;color:#083344;min-width:0;overflow:hidden}.aquifer-cell:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.aquifer-cell.is-low{background:#fde68a}.aquifer-cell.is-dry{background:#fed7aa}.aquifer-cell.is-clean{box-shadow:inset 0 -10px 0 rgba(34,197,94,.2)}.aquifer-cell.is-plume{background:linear-gradient(135deg,#c4b5fd,#f0abfc)}.aquifer-cell.is-risk{box-shadow:0 0 0 3px #fb7185 inset}.aquifer-tool{position:absolute;left:4px;top:4px;border-radius:999px;background:rgba(15,23,42,.78);color:#fff;font-size:.65rem;padding:1px 5px}.aquifer-depth{position:absolute;right:4px;bottom:3px;font-size:.62rem;border-radius:999px;background:rgba(255,255,255,.78);padding:1px 5px}.aquifer-spark{position:absolute;inset:auto 18% 18% 18%;height:6px;border-radius:999px;background:rgba(14,165,233,.55)}.aquifer-panel{padding:14px;display:grid;gap:12px}.aquifer-tools{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.aquifer-tools button.is-active{box-shadow:0 0 0 3px var(--accent) inset}.aquifer-brief{padding:13px;background:#f8fafc}.aquifer-brief h3{margin:.2rem 0;font-size:1.15rem}.aquifer-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.aquifer-list{display:grid;gap:7px}.aquifer-chip{border:1px solid var(--line);border-radius:14px;background:#fff;padding:8px 10px;font-size:.82rem}.aquifer-chip.is-alert{background:#fee2e2}.aquifer-chip.is-good{background:#dcfce7}.aquifer-log{min-height:104px;padding:17px 19px}.aquifer-pulse{animation:aquifer-pulse .7s ease both}@media(max-width:860px){.aquifer-hud{grid-template-columns:repeat(2,1fr)}.aquifer-layout{grid-template-columns:1fr}.aquifer-grid{gap:5px}.aquifer-cell{border-radius:11px}}@media(max-width:520px){.aquifer-board,.aquifer-panel{padding:9px}.aquifer-grid{gap:4px}.aquifer-cell{border-radius:9px}.aquifer-tools,.aquifer-actions{grid-template-columns:1fr}.aquifer-hud{gap:6px}.aquifer-stat{padding:9px}.aquifer-tool,.aquifer-depth{font-size:.55rem}}@media(prefers-reduced-motion:reduce){.aquifer-card,.aquifer-pulse{animation:none;transition:none}}@keyframes aquifer-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes aquifer-pulse{0%{transform:scale(.98)}50%{transform:scale(1.03)}100%{transform:scale(1)}}`;
    document.head.append(style);
  }
  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-aquifer-architect-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true), card = $('.app-card', node);
    card.dataset.category = APP.category; card.dataset.aquiferArchitectCard = 'true'; card.classList.add('aquifer-card');
    $('.app-icon', node).textContent = APP.emoji; $('.app-meta', node).textContent = `${label(APP.category)} · v${APP.version}`; $('.app-name', node).textContent = APP.name; $('.app-summary', node).textContent = APP.summary;
    const button = $('.app-card-button', node); button.setAttribute('aria-label', `Open ${APP.name}`); button.addEventListener('click', open); grid.append(node);
  }
  function boot() {
    ensureStyles(); let tries = 0;
    const retry = () => { addCard(); if (!$('[data-aquifer-architect-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => { if (button.dataset.aquiferArchitectRefresh) return; button.dataset.aquiferArchitectRefresh = '1'; button.addEventListener('click', () => setTimeout(addCard, 0)); });
  }
  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage'); if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name; $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`; $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Aquifer%20Architect';
    stage.replaceChildren(); game(stage, dialog); dialog.showModal();
  }
  function game(stage, dialog) {
    const root = document.createElement('section'); root.className = 'tool-panel aquifer-game';
    root.innerHTML = `<div class="aquifer-hud"><div class="aquifer-stat"><span>Mode</span><strong id="aa-mode">Valley plan</strong></div><div class="aquifer-stat"><span>Year</span><strong id="aa-year">1 / 6</strong></div><div class="aquifer-stat"><span>Budget</span><strong id="aa-budget">18</strong></div><div class="aquifer-stat"><span>Supply</span><strong id="aa-supply">0</strong></div><div class="aquifer-stat"><span>Risk</span><strong id="aa-risk">0</strong></div><div class="aquifer-stat"><span>Score</span><strong id="aa-score">0</strong></div></div><div class="aquifer-layout"><div class="aquifer-board"><div class="aquifer-grid" aria-label="Aquifer planning grid"></div></div><div class="aquifer-panel"><div class="aquifer-brief"></div><div class="aquifer-tools" aria-label="Planning tools"></div><div class="aquifer-list" aria-label="Aquifer conditions"></div><div class="aquifer-actions"><button class="button" type="button" data-act="run">Run year</button><button class="button button-secondary" type="button" data-act="mode">Change mode</button><button class="button button-secondary" type="button" data-act="reset">New basin</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card aquifer-log" aria-live="polite"></div>`;
    stage.append(root);
    const grid = $('.aquifer-grid', root), brief = $('.aquifer-brief', root), toolBox = $('.aquifer-tools', root), list = $('.aquifer-list', root), log = $('.aquifer-log', root);
    const st = { mode: 'valley', year: 1, budget: 18, score: 0, supply: 0, risk: 0, unlocked: false, selected: 'well', cells: [], sound: false, ac: null, low: lowMotion() };
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });
    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: 1 well, 2 recharge, 3 barrier, 4 monitor, 5 remove. Arrow keys move focus; Enter places the active tool.</small>`; }
    function tone(kind) {
      if (!st.sound && kind !== 'bad') return; const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume(); const osc = st.ac.createOscillator(), gain = st.ac.createGain(); osc.type = kind === 'bad' ? 'sawtooth' : 'sine'; osc.frequency.value = kind === 'good' ? 720 : kind === 'drop' ? 280 : 460;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.055, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .22); osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .24);
    }
    function makeCells() {
      st.cells = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const base = 4 + ((x * 3 + y * 5) % 5), recharge = y === 0 || (x + y) % 5 === 0, town = y === H - 1 && (x === 1 || x === 2 || x === 5), farm = y > 1 && y < 5 && (x === 0 || x === 7 || (x + y) % 6 === 0);
        st.cells.push({ x, y, depth: base, tool: null, recharge, town, farm, plume: false, known: false });
      }
      const pool = st.cells.filter((c) => !c.town && !c.recharge); let count = modes[st.mode].plumes;
      while (count-- && pool.length) { const p = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; p.plume = true; }
    }
    function chooseMode(next) {
      const keys = Object.keys(modes); st.mode = next || keys[(keys.indexOf(st.mode) + 1) % (st.unlocked ? 3 : 2)]; const mode = modes[st.mode]; st.year = 1; st.budget = mode.budget; st.score = 0; st.supply = 0; st.risk = 0; st.selected = 'well'; makeCells(); render(); note(`${mode.name} ready. Place infrastructure, then run each water year without overdrawing or spreading contamination.`);
    }
    function cellAt(x, y) { return st.cells.find((c) => c.x === x && c.y === y); }
    function neighbors(c) { return [[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy]) => cellAt(c.x + dx, c.y + dy)).filter(Boolean); }
    function place(c) {
      const tool = tools[st.selected]; if (!tool || !c) return;
      if (st.selected === 'clear') { if (c.tool) { c.tool = null; note('Plan removed from the selected cell.'); render(); } return; }
      if (c.tool === st.selected) { note(`${tool.name} is already planned there.`); return; }
      if (st.budget < tool.cost) { note(`Not enough budget for ${tool.name}. Run a year or remove another plan.`); tone('bad'); return; }
      c.tool = st.selected; st.budget -= tool.cost; c.known = true; tone('drop'); render();
    }
    function compute() {
      let supply = 0, risk = 0, recharge = 0, monitors = 0;
      for (const c of st.cells) {
        if (c.tool === 'well') { supply += Math.max(0, Math.min(5, c.depth)); risk += c.plume ? 4 : 0; for (const n of neighbors(c)) if (n.plume && n.tool !== 'barrier') risk += 1; }
        if (c.tool === 'basin') recharge += c.recharge ? 3 : 1;
        if (c.tool === 'barrier') risk = Math.max(0, risk - (c.plume ? 2 : 1));
        if (c.tool === 'monitor') monitors += 1;
      }
      return { supply, risk: Math.max(0, risk - monitors), recharge, monitors };
    }
    function runYear() {
      const mode = modes[st.mode], stats = compute(), drought = Math.random() < mode.drought + st.year * .015, demand = mode.demand + (drought ? 2 : 0) + Math.floor(st.year / 3);
      const delivered = Math.min(stats.supply, demand), shortage = Math.max(0, demand - stats.supply); let risk = stats.risk;
      for (const c of st.cells) {
        if (c.tool === 'well') { c.depth = Math.max(0, c.depth - 2); if (c.depth <= 1) risk += 1; }
        if (c.tool === 'basin') c.depth = Math.min(9, c.depth + (c.recharge ? 2 : 1));
        if (c.tool === 'monitor') { c.known = true; neighbors(c).forEach((n) => { n.known = true; }); }
      }
      for (const c of st.cells.filter((item) => item.plume)) for (const n of neighbors(c)) if (!n.plume && n.tool !== 'barrier' && Math.random() < (drought ? .34 : .22)) { n.plume = true; break; }
      st.supply = delivered; st.risk = risk; const base = delivered * 12 + stats.recharge * 7 + stats.monitors * 4 - shortage * 20 - risk * 12; st.score = Math.max(0, st.score + base); st.budget += 4 + (shortage ? 1 : 2); st.year += 1;
      let message = `${drought ? 'Drought year. ' : 'Wet year. '}Delivered ${delivered}/${demand} water units with ${risk} risk.`;
      if (shortage) { message += ' Shortage penalties hit the town.'; tone('bad'); } else if (risk <= 2) { message += ' Clean supply plan held.'; tone('good'); }
      if (st.score >= 260 && !st.unlocked) { st.unlocked = true; message += ' Deep aquifer mode unlocked for this session.'; }
      if (st.year > mode.years) finish(message); else { note(message); render(); pulse(); }
    }
    function finish(message) {
      const rating = st.score >= 420 && st.risk <= 3 ? 'resilient watershed' : st.score >= 280 ? 'workable basin' : 'strained aquifer';
      note(`${message} Plan complete: ${rating}. Final score ${st.score}. Replay with a different well and recharge pattern.`); render();
    }
    function pulse() { const board = $('.aquifer-board', root); board?.classList.add('aquifer-pulse'); setTimeout(() => board?.classList.remove('aquifer-pulse'), st.low ? 0 : 720); }
    function renderTools() {
      toolBox.replaceChildren(...Object.entries(tools).map(([id, tool], index) => { const b = document.createElement('button'); b.type = 'button'; b.className = `button${st.selected === id ? ' is-active' : ' button-secondary'}`; b.textContent = `${index + 1}. ${tool.name} (${tool.cost})`; b.setAttribute('aria-pressed', String(st.selected === id)); b.addEventListener('click', () => { st.selected = id; render(); }); return b; }));
    }
    function render() {
      const mode = modes[st.mode], stats = compute();
      $('#aa-mode', root).textContent = mode.name; $('#aa-year', root).textContent = `${Math.min(st.year, mode.years)} / ${mode.years}`; $('#aa-budget', root).textContent = st.budget; $('#aa-supply', root).textContent = `${stats.supply}/${mode.demand}`; $('#aa-risk', root).textContent = stats.risk; $('#aa-score', root).textContent = st.score;
      renderTools(); grid.replaceChildren();
      for (const c of st.cells) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'aquifer-cell'; b.dataset.x = c.x; b.dataset.y = c.y;
        if (c.depth <= 2) b.classList.add('is-dry'); else if (c.depth <= 4) b.classList.add('is-low'); else b.classList.add('is-clean'); if (c.plume && (c.known || c.tool === 'monitor')) b.classList.add('is-plume'); if (c.tool === 'well' && stats.risk > 4) b.classList.add('is-risk');
        const terrain = c.town ? '🏘' : c.farm ? '🌽' : c.recharge ? '☔' : '·'; b.innerHTML = `<span aria-hidden="true">${terrain}</span>${c.tool ? `<span class="aquifer-tool">${tools[c.tool].short}</span>` : ''}<span class="aquifer-depth">${c.known || c.tool ? c.depth : '?'}</span><span class="aquifer-spark" aria-hidden="true"></span>`;
        b.setAttribute('aria-label', describe(c)); b.addEventListener('click', () => place(c)); grid.append(b);
      }
      const hot = st.cells.filter((c) => c.plume).length, low = st.cells.filter((c) => c.depth <= 2).length;
      brief.innerHTML = `<h3>${st.unlocked ? 'Deep basin desk unlocked' : 'Groundwater planning desk'}</h3><p>Wells create supply but lower nearby water. Recharge basins refill shallow cells. Barriers slow plume spread. Monitors reveal hidden depth and contamination around them.</p>`;
      list.replaceChildren(chip(`${hot} plume cell${hot === 1 ? '' : 's'} detected or hidden`, hot > 4), chip(`${low} low-water cell${low === 1 ? '' : 's'}`, low > 5), chip(`${stats.recharge} recharge capacity`, false, true), chip(`${stats.monitors} monitor network`, false, stats.monitors > 1));
    }
    function chip(text, alert, good) { const c = document.createElement('div'); c.className = `aquifer-chip${alert ? ' is-alert' : ''}${good ? ' is-good' : ''}`; c.textContent = text; return c; }
    function describe(c) { const parts = []; if (c.town) parts.push('town edge'); if (c.farm) parts.push('farm demand'); if (c.recharge) parts.push('natural recharge'); if (c.plume && (c.known || c.tool === 'monitor')) parts.push('contamination plume'); parts.push(`depth ${c.known || c.tool ? c.depth : 'unknown'}`); if (c.tool) parts.push(`${tools[c.tool].name} planned`); return parts.join(', ') || 'aquifer cell'; }
    root.addEventListener('click', (event) => { const act = event.target.closest('button')?.dataset.act; if (!act) return; if (act === 'run') runYear(); if (act === 'mode') chooseMode(); if (act === 'reset') chooseMode(st.mode); if (act === 'sound') { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); tone('drop'); } });
    root.addEventListener('keydown', (event) => {
      if (/^[1-5]$/.test(event.key)) { st.selected = Object.keys(tools)[Number(event.key) - 1]; render(); }
      if (event.key === 'Enter' && document.activeElement?.classList.contains('aquifer-cell')) { const x = Number(document.activeElement.dataset.x), y = Number(document.activeElement.dataset.y); place(cellAt(x, y)); }
    });
    chooseMode('valley');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
