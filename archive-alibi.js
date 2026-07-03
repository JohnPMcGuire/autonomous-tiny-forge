(() => {
  const APP = {
    name: 'Archive Alibi', emoji: '🗂️', category: 'play', version: '1.0.0',
    summary: 'Solve a shifting archive mystery by checking alibis, linking evidence, and spending scarce insight.',
    description: 'A local deduction game with suspects, clue links, insight tokens, pressure, accusation scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and clean teardown.'
  };
  const SUSPECTS = [
    { name: 'Mara', room: 'Map room', tell: 'wet sleeve', trueRoom: 'Vault', motive: 'hid a forged route' },
    { name: 'Oren', room: 'Catalog', tell: 'ink dust', trueRoom: 'Workshop', motive: 'swapped the repair log' },
    { name: 'Vega', room: 'Workshop', tell: 'quiet shoes', trueRoom: 'Map room', motive: 'stole the index key' },
    { name: 'Nix', room: 'Vault', tell: 'burnt thread', trueRoom: 'Catalog', motive: 'erased a donor note' }
  ];
  const ROOMS = ['Map room', 'Catalog', 'Workshop', 'Vault'];
  const CLUES = ['Damp map', 'Fresh ink', 'Loose gear', 'Bent seal'];

  function installStyles() {
    if (document.querySelector('#archive-alibi-styles')) return;
    const style = document.createElement('style');
    style.id = 'archive-alibi-styles';
    style.textContent = `.archive-card{animation:archive-rise .32s ease both}.archive-game{max-width:980px;gap:14px}.archive-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.archive-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.archive-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.archive-stat strong{display:block;margin-top:4px;font-size:1rem}.archive-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#111827;color:white;cursor:pointer;touch-action:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.archive-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.archive-board canvas{display:block;width:100%;min-height:390px}.archive-overlay{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.archive-overlay strong{font-size:clamp(1.05rem,3vw,1.5rem)}.archive-overlay small{display:block;max-width:660px;color:rgba(255,255,255,.76)}.archive-badge{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.12);color:#bfdbfe;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.archive-suspects{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.archive-suspects button{border:1px solid var(--line);border-radius:16px;background:white;padding:10px;text-align:left;color:var(--ink)}.archive-suspects button[aria-pressed=true]{outline:3px solid var(--accent);outline-offset:2px}.archive-suspects span{display:block;color:var(--muted);font-size:.66rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.archive-log{min-height:116px;padding:17px 19px}.archive-log strong{font-size:clamp(1.1rem,3vw,1.55rem)}@media(max-width:760px){.archive-hud{grid-template-columns:repeat(2,1fr)}.archive-suspects{grid-template-columns:repeat(2,1fr)}.archive-board canvas{min-height:340px}.archive-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.archive-card{animation:none}}@keyframes archive-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-archive-alibi-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.archiveAlibiCard = 'true';
    card.classList.add('archive-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openArchiveAlibi);
    grid.append(node);
  }

  function openArchiveAlibi() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Archive%20Alibi';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel archive-game';
    const hud = document.createElement('div');
    hud.className = 'archive-hud';
    hud.innerHTML = '<div class="archive-stat"><span>Case</span><strong id="archive-case">1 / 3</strong></div><div class="archive-stat"><span>Pressure</span><strong id="archive-pressure">0</strong></div><div class="archive-stat"><span>Insight</span><strong id="archive-insight">5</strong></div><div class="archive-stat"><span>Links</span><strong id="archive-links">0</strong></div><div class="archive-stat"><span>Score</span><strong id="archive-score">0</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'archive-board';
    board.setAttribute('aria-label', 'Archive Alibi board. Select suspects, inspect clues, link contradictions, and accuse when ready.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="archive-overlay"><span><strong>Find the alibi that does not match the archive.</strong><small>Tap rooms to inspect, choose suspects below, use arrows to change suspects, Enter to question, Space to link, and A to accuse.</small></span><span class="archive-badge">Deduction puzzle</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const suspects = document.createElement('div');
    suspects.className = 'archive-suspects';
    const log = document.createElement('div');
    log.className = 'result-card archive-log';
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
    actions.append(makeButton('Question', question), makeButton('Inspect room', inspectRoom, true), makeButton('Link clue', linkClue, true), makeButton('Accuse', accuse), makeButton('New case', newCase, true));
    root.append(hud, board, suspects, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { case: 0, culprit: 0, selected: 0, room: 0, insight: 5, pressure: 0, links: new Set(), questioned: new Set(), found: new Set(), score: 0, tick: 0, raf: 0, done: false };

    function startCase() {
      state.culprit = (state.case * 2 + 1) % SUSPECTS.length;
      state.selected = state.case % SUSPECTS.length;
      state.room = 0;
      state.insight = 5;
      state.pressure = state.case;
      state.links.clear();
      state.questioned.clear();
      state.found.clear();
      state.done = false;
      say(`<strong>Case ${state.case + 1}: the archive was altered after closing.</strong><small>Question claims, inspect rooms, and link the clue that contradicts the culprit. Wrong accusations cost pressure.</small>`);
      update();
    }
    function currentSuspect() { return SUSPECTS[state.selected]; }
    function culprit() { return SUSPECTS[state.culprit]; }
    function question() {
      if (state.done) return;
      const suspect = currentSuspect();
      state.questioned.add(state.selected);
      state.pressure += 1;
      const lie = state.selected === state.culprit;
      say(`<strong>${suspect.name} claims the ${suspect.room} alibi.</strong><small>${lie ? `Their ${suspect.tell} points somewhere else.` : `The claim fits one quiet witness note.`} Pressure rises when interviews drag.</small>`);
      update();
    }
    function inspectRoom() {
      if (state.done) return;
      if (state.insight <= 0) return say('<strong>No insight remains.</strong><small>Link what you have or risk an accusation.</small>');
      state.insight -= 1;
      state.found.add(state.room);
      state.pressure += state.room === ROOMS.indexOf(culprit().trueRoom) ? 0 : 1;
      say(`<strong>${CLUES[state.room]} found in the ${ROOMS[state.room]}.</strong><small>${ROOMS[state.room] === culprit().trueRoom ? 'This clue belongs near the real route.' : 'Useful context, but it may be noise.'} Insight spent: one.</small>`);
      update();
    }
    function linkClue() {
      if (state.done) return;
      const key = `${state.selected}-${state.room}`;
      const suspect = currentSuspect();
      const correct = state.selected === state.culprit && ROOMS[state.room] === suspect.trueRoom;
      state.links.add(key);
      state.pressure += correct ? 0 : 2;
      state.score += correct ? 35 : 4;
      say(`<strong>${correct ? 'Contradiction linked.' : 'Weak link recorded.'}</strong><small>${suspect.name} ${correct ? `claimed ${suspect.room}, but the ${CLUES[state.room].toLowerCase()} supports ${suspect.trueRoom}.` : 'may still be useful, but the archive does not treat it as decisive.'}</small>`);
      update();
    }
    function accuse() {
      if (state.done) return;
      const suspect = currentSuspect();
      const solved = state.selected === state.culprit;
      const linked = state.links.has(`${state.culprit}-${ROOMS.indexOf(culprit().trueRoom)}`);
      const bonus = Math.max(0, 70 - state.pressure * 6 + state.insight * 5 + (linked ? 30 : 0));
      state.done = true;
      if (solved) {
        state.score += bonus;
        say(`<strong>${suspect.name} broke the archive chain.</strong><small>${suspect.motive}. ${linked ? 'Your linked contradiction held.' : 'Correct suspect, but the evidence trail was thin.'} Case score ${state.score}.</small>`);
      } else {
        state.score = Math.max(0, state.score - 25);
        state.pressure += 3;
        say(`<strong>${suspect.name} was a false lead.</strong><small>The real trail points to ${culprit().name}. Recover by starting a new case and linking before accusing.</small>`);
      }
      update();
    }
    function newCase() { state.case = (state.case + 1) % 3; state.score = 0; startCase(); }
    function choose(delta) { state.selected = (state.selected + delta + SUSPECTS.length) % SUSPECTS.length; update(); }
    function say(html) { log.innerHTML = html; }
    function updateHud() {
      hud.querySelector('#archive-case').textContent = `${state.case + 1} / 3`;
      hud.querySelector('#archive-pressure').textContent = `${state.pressure} / 9`;
      hud.querySelector('#archive-insight').textContent = state.insight;
      hud.querySelector('#archive-links').textContent = state.links.size;
      hud.querySelector('#archive-score').textContent = state.score;
    }
    function updateSuspects() {
      suspects.replaceChildren();
      SUSPECTS.forEach((suspect, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.setAttribute('aria-pressed', String(index === state.selected));
        item.innerHTML = `<strong>${suspect.name}</strong><span>Claim: ${suspect.room}${state.questioned.has(index) ? ` · tell: ${suspect.tell}` : ''}</span>`;
        item.addEventListener('click', () => { state.selected = index; update(); });
        suspects.append(item);
      });
    }
    function update() { updateHud(); updateSuspects(); draw(); }

    board.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); choose(1); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); choose(-1); }
      if (event.key === 'Enter') { event.preventDefault(); question(); }
      if (event.key === ' ') { event.preventDefault(); linkClue(); }
      if (event.key.toLowerCase() === 'a') { event.preventDefault(); accuse(); }
    });
    board.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const col = Math.floor((event.clientX - rect.left) / Math.max(1, rect.width / 4));
      state.room = Math.max(0, Math.min(3, col));
      inspectRoom();
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
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, w, h);
      const roomW = w / 4;
      ROOMS.forEach((room, index) => {
        const x = index * roomW;
        const found = state.found.has(index);
        const selected = state.room === index;
        ctx.fillStyle = selected ? '#1d4ed8' : found ? '#1f2937' : '#172033';
        ctx.fillRect(x + 8, 18, roomW - 16, h - 96);
        ctx.strokeStyle = selected ? '#bfdbfe' : 'rgba(255,255,255,.16)';
        ctx.lineWidth = selected ? 4 : 1;
        ctx.strokeRect(x + 8, 18, roomW - 16, h - 96);
        ctx.fillStyle = '#eff6ff';
        ctx.font = '700 16px system-ui';
        ctx.fillText(room, x + 20, 46);
        ctx.font = '12px system-ui';
        ctx.fillText(found ? CLUES[index] : 'unchecked shelf', x + 20, 70);
        ctx.fillStyle = found ? '#60a5fa' : '#475569';
        ctx.beginPath();
        ctx.arc(x + roomW / 2, 132 + Math.sin((state.tick + index * 25) / 24) * (reduced ? 0 : 8), 18, 0, Math.PI * 2);
        ctx.fill();
      });
      SUSPECTS.forEach((suspect, index) => {
        const x = 28 + index * Math.max(72, (w - 80) / 4);
        const y = h - 66;
        ctx.fillStyle = index === state.selected ? '#facc15' : '#cbd5e1';
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.82)';
        ctx.font = '700 12px system-ui';
        ctx.fillText(suspect.name, x + 18, y + 4);
      });
      ctx.fillStyle = 'rgba(255,255,255,.78)';
      ctx.font = '700 13px system-ui';
      ctx.fillText(`Selected room: ${ROOMS[state.room]} · Suspect: ${currentSuspect().name}`, 18, h - 18);
      if (!reduced) state.tick = (state.tick + 1) % 900;
    }
    function loop() { draw(); state.raf = reduced ? 0 : requestAnimationFrame(loop); }
    const close = () => { if (state.raf) cancelAnimationFrame(state.raf); window.removeEventListener('resize', draw); };
    document.querySelector('#app-dialog')?.addEventListener('close', close, { once: true });
    window.addEventListener('resize', draw, { passive: true });
    startCase();
    if (!reduced) loop();
  }

  window.addEventListener('DOMContentLoaded', () => setTimeout(initCard, 250));
})();
