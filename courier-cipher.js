(() => {
  const APP = {
    name: 'Courier Cipher', emoji: '📡', category: 'play', version: '1.0.0',
    summary: 'Route couriers across a shifting grid while decoding cipher fragments before suspicion peaks.',
    description: 'A local route-and-deduction mini-game with cipher fragments, patrol pressure, decoys, limited stamina, session-only hard-mode unlocks, scoring, responsive canvas rendering, touch and keyboard controls, reduced-motion behavior, and clean teardown.'
  };
  const SYMBOLS = ['Sun', 'Key', 'Bell', 'Oak', 'Wave', 'Fox'];
  const GLYPHS = ['☀', '◇', '◔', '♧', '≈', '✦'];

  function installStyles() {
    if (document.querySelector('#courier-cipher-styles')) return;
    const style = document.createElement('style');
    style.id = 'courier-cipher-styles';
    style.textContent = `.courier-card{animation:courier-rise .3s ease both}.courier-game{max-width:1080px;gap:14px}.courier-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.courier-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.courier-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.courier-stat strong{display:block;margin-top:4px;font-size:1rem}.courier-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#10141f;color:white;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.courier-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.courier-board canvas{display:block;width:100%;min-height:430px}.courier-overlay{position:absolute;left:16px;right:16px;bottom:14px;display:flex;justify-content:space-between;gap:12px;align-items:end;pointer-events:none}.courier-overlay strong{font-size:clamp(1rem,3vw,1.45rem)}.courier-overlay small{display:block;max-width:740px;color:rgba(255,255,255,.78)}.courier-badge{padding:7px 9px;border-radius:999px;background:rgba(251,191,36,.17);color:#fde68a;font-size:.68rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.courier-tools{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.courier-tools button{border:1px solid var(--line);border-radius:16px;background:white;color:var(--ink);padding:12px 8px;font-weight:900}.courier-tools button[aria-pressed=true]{box-shadow:inset 0 0 0 2px var(--accent)}.courier-log{min-height:118px;padding:17px 19px}.courier-log strong{font-size:clamp(1.08rem,3vw,1.5rem)}@media(max-width:760px){.courier-hud{grid-template-columns:repeat(2,1fr)}.courier-tools{grid-template-columns:repeat(3,1fr)}.courier-board canvas{min-height:360px}.courier-overlay{align-items:start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.courier-card{animation:none}}@keyframes courier-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function labelCategory(value) { return value === 'play' ? 'Play' : value === 'useful' ? 'Useful' : 'Experiment'; }
  function activeFilter() { return document.querySelector('.filter.is-active')?.dataset.filter || 'all'; }
  function eligible() { const filter = activeFilter(); return filter === 'all' || filter === APP.category; }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-courier-cipher-card]') || !eligible()) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.courierCipherCard = 'true';
    card.classList.add('courier-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `${labelCategory(APP.category)} · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openCourier);
    grid.append(node);
  }

  function wireFilterRefresh() {
    document.querySelectorAll('.filter').forEach((button) => {
      if (button.dataset.courierCipherRefresh) return;
      button.dataset.courierCipherRefresh = 'true';
      button.addEventListener('click', () => setTimeout(initCard, 0));
    });
  }

  function openCourier() {
    const dialog = document.querySelector('#app-dialog');
    const stage = document.querySelector('#app-stage');
    const title = document.querySelector('#dialog-title');
    const category = document.querySelector('#dialog-category');
    const description = document.querySelector('#dialog-description');
    const feedback = document.querySelector('#dialog-feedback');
    if (!dialog || !stage || !title || !category || !description || !feedback) return;
    title.textContent = APP.name;
    category.textContent = `${labelCategory(APP.category)} · ${APP.emoji}`;
    description.textContent = APP.description;
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Courier%20Cipher';
    stage.replaceChildren();
    renderGame(stage, dialog);
    dialog.showModal();
  }

  function renderGame(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel courier-game';
    const hud = document.createElement('div');
    hud.className = 'courier-hud';
    hud.innerHTML = '<div class="courier-stat"><span>Round</span><strong id="courier-round">1 / 4</strong></div><div class="courier-stat"><span>Score</span><strong id="courier-score">0</strong></div><div class="courier-stat"><span>Stamina</span><strong id="courier-stamina">14</strong></div><div class="courier-stat"><span>Suspicion</span><strong id="courier-suspicion">0 / 9</strong></div><div class="courier-stat"><span>Decoded</span><strong id="courier-decoded">0 / 4</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'courier-board';
    board.setAttribute('aria-label', 'Courier Cipher board. Use arrow keys or touch cells to move. Decode symbols using number keys one through six.');
    board.innerHTML = '<canvas aria-hidden="true"></canvas><span class="courier-overlay"><span><strong>Collect fragments, infer the symbol, reach the safehouse.</strong><small>Move with arrows or touch. Pick a symbol when enough clues agree. Decoys reduce suspicion but cost time.</small></span><span class="courier-badge">Local cipher</span></span>';
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const tools = document.createElement('div');
    tools.className = 'courier-tools';
    const log = document.createElement('div');
    log.className = 'result-card courier-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const newButton = makeButton('New route', newRun);
    const decoyButton = makeButton('Drop decoy', dropDecoy, true);
    const clueButton = makeButton('Focus clue', focusClue, true);
    const soundButton = makeButton('Sound off', toggleSound, true);
    actions.append(newButton, decoyButton, clueButton, soundButton);
    root.append(hud, board, tools, log, actions);
    stage.append(root);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { round: 1, score: 0, stamina: 14, suspicion: 0, decoded: 0, decodedThisRound: false, done: false, hard: false, x: 0, y: 0, safe: { x: 5, y: 5 }, fragments: [], walls: [], patrols: [], trail: [], needed: 3, answer: 0, decoys: 2, focus: 2, raf: 0, audio: false, audioContext: null };
    let width = 900;
    let height = 430;
    dialog.addEventListener('close', teardown, { once: true });

    SYMBOLS.forEach((name, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${index + 1} ${GLYPHS[index]} ${name}`;
      button.addEventListener('click', () => guess(index));
      tools.append(button);
    });

    function makeButton(text, fn, secondary) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = secondary ? 'button button-secondary' : 'button';
      button.textContent = text;
      button.addEventListener('click', fn);
      return button;
    }
    function say(html) { log.innerHTML = html; }
    function cellSize() { return Math.min(width - 32, height - 64) / 6; }
    function gridLeft() { return (width - cellSize() * 6) / 2; }
    function gridTop() { return 18; }
    function same(a, b) { return a.x === b.x && a.y === b.y; }
    function blocked(x, y) { return state.walls.some((wall) => wall.x === x && wall.y === y); }
    function randCell(used) {
      let cell;
      do { cell = { x: Math.floor(Math.random() * 6), y: Math.floor(Math.random() * 6) }; }
      while (used.some((item) => same(item, cell)) || blocked(cell.x, cell.y));
      return cell;
    }

    function buildRound() {
      const used = [];
      state.x = 0; state.y = 0; state.safe = { x: 5, y: 5 }; state.walls = []; state.fragments = []; state.patrols = []; state.trail = [{ x: 0, y: 0 }]; state.decodedThisRound = false;
      used.push({ x: 0, y: 0 }, state.safe);
      const wallCount = 4 + state.round + (state.hard ? 2 : 0);
      for (let i = 0; i < wallCount; i += 1) {
        const cell = randCell(used);
        if ((cell.x + cell.y) < 2 || (cell.x > 3 && cell.y > 3)) continue;
        state.walls.push(cell); used.push(cell);
      }
      state.answer = Math.floor(Math.random() * SYMBOLS.length);
      state.needed = state.hard ? 4 : 3;
      const fragmentCount = state.needed + 2;
      for (let i = 0; i < fragmentCount; i += 1) {
        const cell = randCell(used);
        used.push(cell);
        const trueClue = i < state.needed ? state.answer : (state.answer + 1 + i) % SYMBOLS.length;
        state.fragments.push({ ...cell, symbol: trueClue, real: i < state.needed, found: false });
      }
      for (let i = 0; i < 2 + state.round; i += 1) {
        const cell = randCell(used);
        used.push(cell);
        state.patrols.push({ ...cell, dir: i % 2 ? -1 : 1 });
      }
      say(`<strong>Round ${state.round}: courier deployed.</strong><small>Find ${state.needed} matching fragments, choose the cipher symbol, then reach the safehouse. Wrong guesses and patrols raise suspicion.</small>`);
      update(); draw();
    }

    function newRun() {
      state.round = 1; state.score = 0; state.stamina = 14; state.suspicion = 0; state.decoded = 0; state.done = false; state.hard = false; state.decoys = 2; state.focus = 2; state.decodedThisRound = false;
      buildRound();
    }

    function nextRound() {
      if (state.round >= 4 || state.suspicion >= 9) return finish();
      state.round += 1;
      state.stamina = Math.max(10, 15 - state.round);
      state.decoys = Math.min(3, state.decoys + 1);
      state.focus = Math.min(3, state.focus + 1);
      if (state.round === 3 && state.decoded >= 2) state.hard = true;
      buildRound();
    }

    function finish() {
      state.done = true;
      const grade = state.decoded >= 4 && state.suspicion < 4 ? 'Master courier' : state.decoded >= 3 ? 'Clean enough delivery' : 'Compromised but recoverable';
      say(`<strong>${grade}: ${state.score} points.</strong><small>Decoded ${state.decoded} messages with suspicion ${state.suspicion}. Replay for cleaner routes, fewer decoys, and faster deduction.</small>`);
      update(); draw();
    }

    function move(dx, dy) {
      if (state.done) return;
      const nx = Math.max(0, Math.min(5, state.x + dx));
      const ny = Math.max(0, Math.min(5, state.y + dy));
      if (nx === state.x && ny === state.y) return;
      if (blocked(nx, ny)) {
        state.suspicion += 1;
        pulse('bad');
        say('<strong>Blocked alley.</strong><small>You lost time testing a sealed route. Try another path before suspicion peaks.</small>');
        update(); draw(); return;
      }
      state.x = nx; state.y = ny; state.stamina -= 1;
      state.trail.push({ x: nx, y: ny });
      if (state.trail.length > 12) state.trail.shift();
      inspectCell();
      patrolStep();
      if (state.stamina <= 0) {
        state.suspicion += 2;
        state.stamina = 5;
        say('<strong>Stamina crash.</strong><small>You ducked into a doorway and recovered, but suspicion jumped. Finish the route quickly.</small>');
      }
      if (same({ x: state.x, y: state.y }, state.safe)) {
        if (state.decodedThisRound) {
          const bonus = 120 + state.stamina * 8 - state.suspicion * 3 + (state.hard ? 45 : 0);
          const delivery = Math.max(40, bonus);
          state.score += delivery;
          pulse('good');
          say(`<strong>Message delivered +${delivery}.</strong><small>The safehouse logs the cipher. Prepare for the next route.</small>`);
          update(); draw();
          return nextRound();
        }
        say('<strong>Safehouse reached too early.</strong><small>Decode the symbol before delivery, or the courier has nothing useful to hand off.</small>');
      }
      if (state.suspicion >= 9) return finish();
      update(); draw();
    }

    function inspectCell() {
      const fragment = state.fragments.find((item) => !item.found && item.x === state.x && item.y === state.y);
      if (fragment) {
        fragment.found = true;
        pulse('clue');
        say(`<strong>Fragment found: ${GLYPHS[fragment.symbol]} ${SYMBOLS[fragment.symbol]}.</strong><small>${countFound()} matching clues collected. Decoys may disagree, so wait for enough agreement before guessing.</small>`);
      }
      if (state.patrols.some((patrol) => patrol.x === state.x && patrol.y === state.y)) {
        state.suspicion += 2;
        pulse('bad');
        say('<strong>Patrol crossed your route.</strong><small>Suspicion rose. Drop a decoy before moving through crowded streets.</small>');
      }
    }

    function countFound() { return state.fragments.filter((item) => item.found && item.symbol === state.answer).length; }

    function guess(index) {
      if (state.done) return;
      [...tools.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      if (state.decodedThisRound) {
        say('<strong>Cipher already solved.</strong><small>Reach the safehouse to deliver this message.</small>');
      } else if (countFound() < state.needed) {
        state.suspicion += 1;
        say('<strong>Not enough agreement yet.</strong><small>Collect more fragments before committing to a symbol. Premature guesses raise suspicion.</small>');
      } else if (index === state.answer) {
        state.decoded += 1;
        state.decodedThisRound = true;
        state.score += 70;
        pulse('good');
        say(`<strong>Cipher solved: ${GLYPHS[index]} ${SYMBOLS[index]}.</strong><small>Now reach the safehouse before stamina runs out.</small>`);
      } else {
        state.suspicion += 3;
        pulse('bad');
        say(`<strong>Wrong cipher.</strong><small>The fragments disagree with ${SYMBOLS[index]}. Suspicion is now ${state.suspicion}.</small>`);
      }
      update(); draw();
      if (state.suspicion >= 9) finish();
    }

    function dropDecoy() {
      if (state.done || state.decoys <= 0) return;
      state.decoys -= 1;
      state.suspicion = Math.max(0, state.suspicion - 2);
      state.stamina = Math.max(1, state.stamina - 1);
      pulse('clue');
      say(`<strong>Decoy dropped.</strong><small>Suspicion cooled, but it cost stamina. Decoys left: ${state.decoys}.</small>`);
      update(); draw();
    }

    function focusClue() {
      if (state.done || state.focus <= 0) return;
      state.focus -= 1;
      const hidden = state.fragments.find((item) => !item.found && item.symbol === state.answer) || state.fragments.find((item) => !item.found);
      if (hidden) {
        hidden.hint = true;
        say(`<strong>Focus clue marked.</strong><small>A likely fragment is glowing on the map. Focus left: ${state.focus}.</small>`);
      }
      update(); draw();
    }

    function patrolStep() {
      for (const patrol of state.patrols) {
        let nx = patrol.x + patrol.dir;
        if (nx < 0 || nx > 5 || blocked(nx, patrol.y)) { patrol.dir *= -1; nx = patrol.x + patrol.dir; }
        if (nx >= 0 && nx <= 5 && !blocked(nx, patrol.y)) patrol.x = nx;
      }
    }

    function toggleSound() {
      const Engine = window.AudioContext || window.webkitAudioContext;
      if (!Engine) return say('<strong>Sound is not available here.</strong><small>The game still works without audio.</small>');
      state.audio = !state.audio;
      soundButton.textContent = state.audio ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(state.audio));
      if (state.audio) { state.audioContext ||= new Engine(); state.audioContext.resume(); pulse('clue'); }
    }

    function pulse(kind) {
      if (!state.audio || !state.audioContext) return;
      const now = state.audioContext.currentTime;
      const oscillator = state.audioContext.createOscillator();
      const gain = state.audioContext.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(kind === 'good' ? 660 : kind === 'bad' ? 180 : 420, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      oscillator.connect(gain).connect(state.audioContext.destination);
      oscillator.start(now); oscillator.stop(now + 0.2);
    }

    function update() {
      hud.querySelector('#courier-round').textContent = `${state.round} / 4`;
      hud.querySelector('#courier-score').textContent = state.score;
      hud.querySelector('#courier-stamina').textContent = state.stamina;
      hud.querySelector('#courier-suspicion').textContent = `${state.suspicion} / 9`;
      hud.querySelector('#courier-decoded').textContent = `${state.decoded} / 4`;
      decoyButton.textContent = `Drop decoy (${state.decoys})`;
      clueButton.textContent = `Focus clue (${state.focus})`;
    }

    function resize() {
      const rect = board.getBoundingClientRect();
      width = Math.max(320, Math.floor(rect.width || 900));
      height = width < 640 ? 360 : 430;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#10141f'; ctx.fillRect(0, 0, width, height);
      const size = cellSize(); const left = gridLeft(); const top = gridTop();
      for (let y = 0; y < 6; y += 1) {
        for (let x = 0; x < 6; x += 1) {
          const px = left + x * size; const py = top + y * size;
          ctx.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,.045)' : 'rgba(255,255,255,.075)';
          ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
          ctx.strokeStyle = 'rgba(255,255,255,.11)'; ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
        }
      }
      state.trail.forEach((cell, index) => {
        ctx.fillStyle = `rgba(147,197,253,${0.05 + index / state.trail.length * 0.14})`;
        ctx.fillRect(left + cell.x * size + 9, top + cell.y * size + 9, size - 18, size - 18);
      });
      state.walls.forEach((cell) => drawCell(cell, '#334155', '×'));
      state.fragments.forEach((cell) => {
        if (cell.found) drawCell(cell, cell.real ? '#fbbf24' : '#fb7185', GLYPHS[cell.symbol]);
        else if (cell.hint) drawCell(cell, '#60a5fa', '?');
        else drawCell(cell, 'rgba(255,255,255,.18)', '•');
      });
      state.patrols.forEach((cell) => drawCell(cell, '#ef4444', '!'));
      drawCell(state.safe, '#22c55e', '⌂');
      drawCell({ x: state.x, y: state.y }, '#e0f2fe', '●', '#0f172a');
      ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.font = '12px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(`Decoys ${state.decoys} · Focus ${state.focus} · ${state.hard ? 'Hard route' : 'Standard route'}`, left, top + size * 6 + 28);
      function drawCell(cell, fill, mark, textFill = 'white') {
        const cx = left + cell.x * size + size / 2; const cy = top + cell.y * size + size / 2;
        ctx.beginPath(); ctx.arc(cx, cy, Math.max(13, size * 0.24), 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
        ctx.fillStyle = textFill; ctx.font = `900 ${Math.max(16, size * 0.26)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(mark, cx, cy);
      }
    }

    function loop() {
      if (!reduced && !state.done) draw();
      state.raf = requestAnimationFrame(loop);
    }

    function cellFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (width / rect.width);
      const y = (event.clientY - rect.top) * (height / rect.height);
      const size = cellSize(); const gx = Math.floor((x - gridLeft()) / size); const gy = Math.floor((y - gridTop()) / size);
      if (gx < 0 || gx > 5 || gy < 0 || gy > 5) return null;
      return { x: gx, y: gy };
    }

    function clickBoard(event) {
      const cell = cellFromEvent(event);
      if (!cell) return;
      const dx = cell.x - state.x; const dy = cell.y - state.y;
      if (Math.abs(dx) + Math.abs(dy) === 1) move(Math.sign(dx), Math.sign(dy));
      else say('<strong>Move one block at a time.</strong><small>Touch an adjacent cell, or use the arrow keys.</small>');
    }

    function keydown(event) {
      if (!document.querySelector('#app-dialog')?.open) return;
      if (event.key === 'ArrowUp') { event.preventDefault(); move(0, -1); }
      else if (event.key === 'ArrowDown') { event.preventDefault(); move(0, 1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1, 0); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); move(1, 0); }
      else if (/^[1-6]$/.test(event.key)) { event.preventDefault(); guess(Number(event.key) - 1); }
    }

    function teardown() {
      cancelAnimationFrame(state.raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', keydown);
      board.removeEventListener('click', clickBoard);
      if (state.audioContext) state.audioContext.close();
    }

    board.addEventListener('click', clickBoard);
    window.addEventListener('keydown', keydown);
    window.addEventListener('resize', resize);
    newRun(); resize(); loop();
  }

  const boot = () => { wireFilterRefresh(); setTimeout(initCard, 80); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
