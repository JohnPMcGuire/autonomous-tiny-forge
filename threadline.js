(() => {
  const basePredictionRenderer = renderPredictionGame;
  const styleId = 'threadline-styles';
  const GRID = 6;
  const TAU = Math.PI * 2;
  const colors = {
    ink: '#07110d',
    normal: '#173329',
    brush: '#315745',
    storm: '#5b466e',
    block: '#0d1d17',
    path: '#ff6f4a',
    pathGlow: 'rgba(255, 111, 74, .28)',
    cursor: '#fff2bd',
    relay: '#f2c66d',
    cache: '#8da7d9',
    exit: '#bfe7d1'
  };

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .threadline-game { max-width: 940px; gap: 15px; }
      .threadline-intro { display: flex; justify-content: space-between; align-items: start; gap: 18px; }
      .threadline-intro p { margin: 0; max-width: 650px; color: var(--muted); line-height: 1.55; }
      .threadline-mode-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
      .threadline-mode { min-height: 104px; border: 1px solid var(--line); border-radius: 18px; padding: 14px; background: white; text-align: left; cursor: pointer; }
      .threadline-mode strong, .threadline-mode small { display: block; }
      .threadline-mode strong { font-size: 1rem; }
      .threadline-mode small { margin-top: 7px; color: var(--muted); line-height: 1.35; }
      .threadline-mode[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--accent) 38%, transparent); background: color-mix(in srgb, var(--accent) 7%, white); }
      .threadline-mode:focus-visible, .threadline-board:focus-visible { outline: 4px solid var(--accent); outline-offset: 3px; }
      .threadline-hud { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
      .threadline-stat { border: 1px solid var(--line); border-radius: 14px; padding: 10px 11px; background: white; min-width: 0; }
      .threadline-stat span { display: block; color: var(--muted); font-size: .61rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      .threadline-stat strong { display: block; margin-top: 3px; font-size: .98rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .threadline-layout { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 14px; align-items: stretch; }
      .threadline-board { position: relative; min-height: 430px; overflow: hidden; border: 1px solid rgba(255,255,255,.12); border-radius: 24px; background: ${colors.ink}; touch-action: none; cursor: crosshair; }
      .threadline-board canvas { display: block; width: 100%; height: 430px; }
      .threadline-key { display: grid; align-content: start; gap: 9px; border: 1px solid var(--line); border-radius: 20px; padding: 15px; background: white; }
      .threadline-key h3 { margin: 0 0 3px; font-size: 1rem; }
      .threadline-legend { display: grid; gap: 8px; }
      .threadline-legend div { display: grid; grid-template-columns: 16px 1fr auto; gap: 8px; align-items: center; font-size: .78rem; color: var(--muted); }
      .threadline-swatch { width: 14px; height: 14px; border-radius: 5px; background: var(--swatch); }
      .threadline-controls { margin-top: 5px; color: var(--muted); font-size: .75rem; line-height: 1.5; }
      .threadline-result { min-height: 94px; padding: 18px 20px; }
      .threadline-result strong { font-size: clamp(1.15rem, 3.2vw, 1.7rem); }
      .threadline-result small { line-height: 1.45; }
      .threadline-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .threadline-actions .is-armed { box-shadow: inset 0 0 0 3px color-mix(in srgb, var(--accent) 45%, transparent); }
      @media (max-width: 780px) {
        .threadline-intro { display: grid; }
        .threadline-mode-row { grid-template-columns: 1fr; }
        .threadline-mode { min-height: 0; }
        .threadline-hud { grid-template-columns: repeat(3, 1fr); }
        .threadline-layout { grid-template-columns: 1fr; }
        .threadline-board, .threadline-board canvas { min-height: 350px; height: 350px; }
        .threadline-key { grid-template-columns: 1fr 1fr; }
        .threadline-key h3, .threadline-controls { grid-column: 1 / -1; }
      }
      @media (max-width: 460px) {
        .threadline-hud { grid-template-columns: repeat(2, 1fr); }
        .threadline-board, .threadline-board canvas { min-height: 310px; height: 310px; }
        .threadline-key { grid-template-columns: 1fr; }
        .threadline-key h3, .threadline-controls { grid-column: auto; }
      }
    `;
    document.head.append(styles);
  }

  renderPredictionGame = function renderPredictionGameWithThreadline(app) {
    if (app.id !== 'threadline') {
      basePredictionRenderer(app);
      return;
    }

    installStyles();

    const root = panel('');
    root.classList.add('threadline-game');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const modes = {
      learn: { label: 'Learn', detail: 'Four stages introduce relays, terrain cost, surges, and caches.' },
      rush: { label: 'Rush', detail: 'Route as many boards as possible in 75 seconds. Overloads cost time.' },
      expedition: { label: 'Expedition', detail: 'Five stages share limited focus and reward efficient routing.' }
    };

    let selectedMode = 'learn';
    let active = false;
    let disposed = false;
    let pointerActive = false;
    let stageNumber = 0;
    let boardsSolved = 0;
    let score = 0;
    let streak = 0;
    let bestStreak = 0;
    let focus = 2;
    let surges = 2;
    let surgeArmed = false;
    let deadline = 0;
    let pausedAt = 0;
    let clockTimer = 0;
    let nextBoardTimer = 0;
    let animationId = 0;
    let audioContext;
    let soundEnabled = false;
    let board;
    let path = [];
    let cursor = { row: 0, col: 0 };
    let hintCells = [];
    let hintExpires = 0;
    let sessionComplete = false;

    const intro = document.createElement('div');
    intro.className = 'threadline-intro';
    const introText = document.createElement('p');
    introText.textContent = app.config.instructions;
    const soundButton = makeButton('Sound off', toggleSound, true);
    soundButton.setAttribute('aria-pressed', 'false');
    intro.append(introText, soundButton);

    const modeRow = document.createElement('div');
    modeRow.className = 'threadline-mode-row';
    Object.entries(modes).forEach(([key, mode]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'threadline-mode';
      button.dataset.mode = key;
      button.setAttribute('aria-pressed', String(key === selectedMode));
      const strong = document.createElement('strong');
      strong.textContent = mode.label;
      const small = document.createElement('small');
      small.textContent = mode.detail;
      button.append(strong, small);
      button.addEventListener('click', () => selectMode(key));
      modeRow.append(button);
    });

    const hud = document.createElement('div');
    hud.className = 'threadline-hud';
    hud.innerHTML = `
      <div class="threadline-stat"><span>Mode</span><strong data-stat="mode">Learn</strong></div>
      <div class="threadline-stat"><span data-label="stage">Stage</span><strong data-stat="stage">0 / 4</strong></div>
      <div class="threadline-stat"><span>Score</span><strong data-stat="score">0</strong></div>
      <div class="threadline-stat"><span>Charge</span><strong data-stat="charge">—</strong></div>
      <div class="threadline-stat"><span>Focus</span><strong data-stat="focus">2</strong></div>
      <div class="threadline-stat"><span>Surges</span><strong data-stat="surges">2</strong></div>
    `;

    const layout = document.createElement('div');
    layout.className = 'threadline-layout';
    const boardWrap = document.createElement('div');
    boardWrap.className = 'threadline-board';
    boardWrap.tabIndex = 0;
    boardWrap.setAttribute('role', 'application');
    boardWrap.setAttribute('aria-label', 'Threadline routing board. Use arrow keys to move the cursor, Enter to add a cell, Backspace to undo, H for a hint, and S to arm a surge.');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    boardWrap.append(canvas);

    const key = document.createElement('aside');
    key.className = 'threadline-key';
    key.innerHTML = `
      <h3>Route costs</h3>
      <div class="threadline-legend">
        <div><span class="threadline-swatch" style="--swatch:${colors.normal}"></span><span>Clear cell</span><strong>1</strong></div>
        <div><span class="threadline-swatch" style="--swatch:${colors.brush}"></span><span>Brush</span><strong>2</strong></div>
        <div><span class="threadline-swatch" style="--swatch:${colors.storm}"></span><span>Storm</span><strong>3</strong></div>
        <div><span class="threadline-swatch" style="--swatch:${colors.block}"></span><span>Blocked</span><strong>—</strong></div>
      </div>
      <p class="threadline-controls">Pass numbered relays in order, collect blue caches when useful, then reach the exit before charge reaches zero.</p>
    `;
    layout.append(boardWrap, key);

    const result = resultCard();
    result.classList.add('threadline-result');
    const actions = document.createElement('div');
    actions.className = 'threadline-actions';
    const startButton = makeButton('Start Learn', startRun);
    const undoButton = makeButton('Undo', undoMove, true);
    const surgeButton = makeButton('Arm surge', toggleSurge, true);
    surgeButton.setAttribute('aria-pressed', 'false');
    const hintButton = makeButton('Spend focus', useHint, true);
    const restartButton = makeButton('Restart board', restartBoard, true);
    actions.append(startButton, undoButton, surgeButton, hintButton, restartButton);
    root.append(intro, modeRow, hud, layout, result, actions);

    const context = canvas.getContext('2d');
    boardWrap.addEventListener('pointerdown', handlePointerDown);
    boardWrap.addEventListener('pointermove', handlePointerMove);
    boardWrap.addEventListener('pointerup', handlePointerUp);
    boardWrap.addEventListener('pointercancel', handlePointerUp);
    boardWrap.addEventListener('keydown', handleKeydown);
    document.addEventListener('visibilitychange', handleVisibility);
    dialog.addEventListener('close', cleanup, { once: true });

    setResult('Choose a route mode.', 'Learn teaches each system. Rush rewards speed. Expedition tests efficiency across a five-stage run.');
    updateHud();
    updateControls();
    draw(performance.now());
    if (!reducedMotion) animationId = requestAnimationFrame(animate);

    function selectMode(mode) {
      if (active || disposed) return;
      selectedMode = mode;
      modeRow.querySelectorAll('.threadline-mode').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
      });
      startButton.textContent = `Start ${modes[mode].label}`;
      updateHud();
      setResult(`${modes[mode].label} selected.`, modes[mode].detail);
    }

    function startRun() {
      if (disposed) return;
      clearTimeout(nextBoardTimer);
      clearInterval(clockTimer);
      active = true;
      sessionComplete = false;
      stageNumber = 0;
      boardsSolved = 0;
      score = 0;
      streak = 0;
      bestStreak = 0;
      focus = selectedMode === 'learn' ? 4 : 2;
      surges = selectedMode === 'expedition' ? 3 : 2;
      deadline = selectedMode === 'rush' ? performance.now() + 75000 : 0;
      if (selectedMode === 'rush') clockTimer = window.setInterval(tickClock, 200);
      startButton.textContent = 'Run active';
      nextBoard();
    }

    function nextBoard() {
      if (!active || disposed) return;
      stageNumber += 1;
      if ((selectedMode === 'learn' && stageNumber > 4) || (selectedMode === 'expedition' && stageNumber > 5)) {
        finishRun();
        return;
      }
      const difficulty = selectedMode === 'learn'
        ? stageNumber
        : selectedMode === 'expedition'
          ? Math.min(6, stageNumber + Math.floor(score / 900))
          : Math.min(7, 1 + boardsSolved + Math.floor(streak / 2));
      board = generateBoard(difficulty, selectedMode === 'learn');
      path = [{ ...board.start, cost: 0, surged: false }];
      cursor = { ...board.start };
      surgeArmed = false;
      hintCells = [];
      updateHud();
      updateControls();
      setResult(`Stage ${stageNumber}: route live.`, board.brief);
      announceBoard();
      playTone('start');
      draw(performance.now());
    }

    function generateBoard(difficulty, guided) {
      const cells = Array.from({ length: GRID }, () =>
        Array.from({ length: GRID }, () => ({ type: 'normal', cost: 1, marker: null }))
      );
      const startRow = guided ? (difficulty + 1) % GRID : randomInt(GRID);
      const solution = [{ row: startRow, col: 0 }];
      let row = startRow;
      for (let col = 1; col < GRID; col += 1) {
        const shift = guided && difficulty === 1 ? 0 : [-1, 0, 1][randomInt(3)];
        const targetRow = clamp(row + shift, 0, GRID - 1);
        while (row !== targetRow) {
          row += Math.sign(targetRow - row);
          solution.push({ row, col: col - 1 });
        }
        solution.push({ row, col });
      }

      const solutionKeys = new Set(solution.map(keyOf));
      const blockerChance = guided ? Math.max(0, difficulty - 1) * 0.045 : 0.08 + difficulty * 0.018;
      const stormChance = guided ? Math.max(0, difficulty - 2) * 0.08 : 0.08 + difficulty * 0.02;
      const brushChance = 0.12 + difficulty * 0.025;

      for (let r = 0; r < GRID; r += 1) {
        for (let c = 0; c < GRID; c += 1) {
          const cell = cells[r][c];
          const cellKey = `${r}:${c}`;
          if (!solutionKeys.has(cellKey) && Math.random() < blockerChance) {
            cell.type = 'block';
            cell.cost = Infinity;
          } else {
            const roll = Math.random();
            if (roll < stormChance) {
              cell.type = 'storm';
              cell.cost = 3;
            } else if (roll < stormChance + brushChance) {
              cell.type = 'brush';
              cell.cost = 2;
            }
          }
        }
      }

      const start = solution[0];
      const exit = solution[solution.length - 1];
      cells[start.row][start.col] = { type: 'normal', cost: 0, marker: 'start' };
      cells[exit.row][exit.col] = { type: 'normal', cost: 1, marker: 'exit' };

      const relayCount = guided ? Math.min(2, Math.max(1, difficulty - 1)) : Math.min(3, 1 + Math.floor(difficulty / 3));
      const relayIndices = [];
      for (let index = 1; index <= relayCount; index += 1) {
        relayIndices.push(Math.floor((solution.length - 2) * (index / (relayCount + 1))) + 1);
      }
      const relays = relayIndices.map((solutionIndex, index) => {
        const point = solution[solutionIndex];
        cells[point.row][point.col].marker = `relay-${index + 1}`;
        return { ...point, order: index + 1 };
      });

      const cacheCandidates = [];
      for (let r = 0; r < GRID; r += 1) {
        for (let c = 1; c < GRID - 1; c += 1) {
          const cell = cells[r][c];
          if (cell.type !== 'block' && !cell.marker && !solutionKeys.has(`${r}:${c}`)) cacheCandidates.push({ row: r, col: c });
        }
      }
      shuffle(cacheCandidates);
      const caches = cacheCandidates.slice(0, guided && difficulty < 4 ? 0 : Math.min(2, 1 + Math.floor(difficulty / 5)));
      caches.forEach((point, index) => {
        cells[point.row][point.col].marker = `cache-${index + 1}`;
      });

      const solutionCost = solution.slice(1).reduce((sum, point) => sum + cells[point.row][point.col].cost, 0);
      const charge = solutionCost + (guided ? 6 : Math.max(3, 7 - difficulty));
      return {
        cells,
        start,
        exit,
        relays,
        caches,
        charge,
        initialCharge: charge,
        nextRelay: 1,
        collectedCaches: new Set(),
        solved: false,
        brief: relayCount > 1
          ? `Reach relays 1 through ${relayCount} in order, then exit. Blue caches restore two charge.`
          : 'Reach relay 1, then exit. Brush and storm cells use extra charge.'
      };
    }

    function tryAdd(row, col) {
      if (!active || !board || board.solved || sessionComplete) return false;
      const current = path[path.length - 1];
      if (current.row === row && current.col === col) return false;
      if (Math.abs(current.row - row) + Math.abs(current.col - col) !== 1) return false;
      if (path.some((point) => point.row === row && point.col === col)) {
        setResult('Routes cannot cross themselves.', 'Undo to the branch point, then choose a different neighbor.');
        playTone('miss');
        return false;
      }
      const cell = board.cells[row][col];
      if (cell.type === 'block') {
        setResult('That cell is blocked.', 'Choose another adjacent cell or spend focus to reveal a route.');
        playTone('miss');
        return false;
      }

      const surged = surgeArmed && surges > 0;
      const cost = surged ? 0 : cell.cost;
      if (board.charge - cost < 0) {
        overload('Not enough charge for that cell.');
        return false;
      }

      if (surged) {
        surges -= 1;
        surgeArmed = false;
        playTone('surge');
      }
      board.charge -= cost;
      path.push({ row, col, cost, surged });
      cursor = { row, col };
      hintCells = [];

      if (cell.marker?.startsWith('relay-')) {
        const order = Number(cell.marker.split('-')[1]);
        if (order === board.nextRelay) {
          board.nextRelay += 1;
          score += 60;
          setResult(`Relay ${order} linked.`, order < board.relays.length ? `Find relay ${order + 1} next.` : 'All relays linked. Reach the exit.');
          playTone('relay');
        } else if (order > board.nextRelay) {
          setResult(`Relay ${order} is out of sequence.`, `Relay ${board.nextRelay} must be linked first. Undo and reroute to preserve the order.`);
          playTone('miss');
        }
      }

      if (cell.marker?.startsWith('cache-') && !board.collectedCaches.has(cell.marker)) {
        board.collectedCaches.add(cell.marker);
        board.charge += 2;
        score += 35;
        setResult('Charge cache collected.', 'Two charge restored. Decide whether the detour was worth it.');
        playTone('cache');
      }

      if (cell.marker === 'exit') {
        if (board.nextRelay <= board.relays.length) {
          setResult('The exit is still locked.', `Link relay ${board.nextRelay} before returning to the exit.`);
          playTone('miss');
        } else {
          solveBoard();
        }
      }

      updateHud();
      updateControls();
      draw(performance.now());
      return true;
    }

    function solveBoard() {
      board.solved = true;
      boardsSolved += 1;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      const efficiency = Math.max(0, board.charge);
      const base = 250 + efficiency * 18 + streak * 25;
      score += base;
      if (selectedMode === 'rush') deadline += Math.min(5000, 1800 + efficiency * 180);
      if (selectedMode === 'expedition' && stageNumber === 3) {
        focus += 1;
        surges += 1;
      }
      playTone('win');
      setResult(`Route complete. +${base}`, `You finished with ${efficiency} charge. ${selectedMode === 'rush' ? 'Time bonus added.' : 'Preparing the next board.'}`);
      updateHud();
      updateControls();
      clearTimeout(nextBoardTimer);
      nextBoardTimer = window.setTimeout(nextBoard, reducedMotion ? 350 : 900);
    }

    function overload(message) {
      streak = 0;
      playTone('overload');
      if (selectedMode === 'rush') {
        deadline -= 5000;
        setResult('Signal overload. Five seconds lost.', `${message} The board has been reset.`);
      } else {
        score = Math.max(0, score - 90);
        setResult('Signal overload. Route reset.', `${message} Ninety points lost, but the run continues.`);
      }
      resetCurrentPath();
      updateHud();
      updateControls();
    }

    function resetCurrentPath() {
      if (!board) return;
      board.charge = board.initialCharge;
      board.nextRelay = 1;
      board.collectedCaches.clear();
      path = [{ ...board.start, cost: 0, surged: false }];
      cursor = { ...board.start };
      surgeArmed = false;
      hintCells = [];
      draw(performance.now());
    }

    function restartBoard() {
      if (!active || !board || board.solved) return;
      if (selectedMode === 'rush') deadline -= 2500;
      else score = Math.max(0, score - 35);
      resetCurrentPath();
      setResult('Board restarted.', selectedMode === 'rush' ? 'Two and a half seconds were deducted.' : 'Thirty-five points were deducted.');
      playTone('miss');
      updateHud();
      updateControls();
    }

    function undoMove() {
      if (!active || !board || board.solved || path.length <= 1) return;
      const removed = path.pop();
      board.charge += removed.cost;
      if (removed.surged) surges += 1;
      const cell = board.cells[removed.row][removed.col];
      if (cell.marker?.startsWith('relay-')) {
        const order = Number(cell.marker.split('-')[1]);
        if (order === board.nextRelay - 1) board.nextRelay -= 1;
      }
      if (cell.marker?.startsWith('cache-') && board.collectedCaches.delete(cell.marker)) board.charge -= 2;
      cursor = { row: path[path.length - 1].row, col: path[path.length - 1].col };
      surgeArmed = false;
      hintCells = [];
      setResult('Last segment removed.', 'Charge and any spent surge were restored.');
      updateHud();
      updateControls();
      draw(performance.now());
    }

    function toggleSurge() {
      if (!active || !board || board.solved || surges <= 0) return;
      surgeArmed = !surgeArmed;
      setResult(surgeArmed ? 'Surge armed.' : 'Surge cancelled.', surgeArmed ? 'Your next valid move costs zero charge.' : 'The next move will use normal terrain cost.');
      updateControls();
      playTone('surge');
    }

    function useHint() {
      if (!active || !board || board.solved || focus <= 0) return;
      const target = board.nextRelay <= board.relays.length ? board.relays[board.nextRelay - 1] : board.exit;
      const route = shortestRoute(path[path.length - 1], target);
      if (!route.length) {
        setResult('No route is visible from here.', 'Undo until a path opens, or restart the board.');
        playTone('miss');
        return;
      }
      focus -= 1;
      hintCells = route.slice(1, 4);
      hintExpires = performance.now() + 3200;
      setResult('Focus spent.', `The next ${Math.min(3, route.length - 1)} useful cells are glowing.`);
      playTone('hint');
      updateHud();
      updateControls();
      draw(performance.now());
    }

    function shortestRoute(start, target) {
      const blockedByPath = new Set(path.slice(0, -1).map(keyOf));
      const queue = [{ point: start, cost: 0 }];
      const best = new Map([[keyOf(start), 0]]);
      const previous = new Map();

      while (queue.length) {
        queue.sort((a, b) => a.cost - b.cost);
        const current = queue.shift();
        const currentKey = keyOf(current.point);
        if (current.point.row === target.row && current.point.col === target.col) {
          const route = [current.point];
          let cursorKey = currentKey;
          while (previous.has(cursorKey)) {
            const prior = previous.get(cursorKey);
            route.push(prior);
            cursorKey = keyOf(prior);
          }
          return route.reverse();
        }
        for (const next of neighbors(current.point)) {
          const nextKey = keyOf(next);
          const cell = board.cells[next.row][next.col];
          if (cell.type === 'block' || blockedByPath.has(nextKey)) continue;
          const nextCost = current.cost + cell.cost;
          if (nextCost < (best.get(nextKey) ?? Infinity)) {
            best.set(nextKey, nextCost);
            previous.set(nextKey, current.point);
            queue.push({ point: next, cost: nextCost });
          }
        }
      }
      return [];
    }

    function handlePointerDown(event) {
      if (!active || !board || board.solved) return;
      event.preventDefault();
      boardWrap.setPointerCapture?.(event.pointerId);
      pointerActive = true;
      const cell = eventCell(event);
      if (cell) {
        cursor = cell;
        tryAdd(cell.row, cell.col);
        draw(performance.now());
      }
    }

    function handlePointerMove(event) {
      if (!pointerActive || !active || !board || board.solved) return;
      const cell = eventCell(event);
      if (cell) tryAdd(cell.row, cell.col);
    }

    function handlePointerUp(event) {
      pointerActive = false;
      boardWrap.releasePointerCapture?.(event.pointerId);
    }

    function eventCell(event) {
      const bounds = canvas.getBoundingClientRect();
      const col = Math.floor(((event.clientX - bounds.left) / bounds.width) * GRID);
      const row = Math.floor(((event.clientY - bounds.top) / bounds.height) * GRID);
      if (row < 0 || row >= GRID || col < 0 || col >= GRID) return null;
      return { row, col };
    }

    function handleKeydown(event) {
      if (!active || !board || board.solved) return;
      const moves = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1]
      };
      if (moves[event.key]) {
        event.preventDefault();
        const [dr, dc] = moves[event.key];
        cursor = { row: clamp(cursor.row + dr, 0, GRID - 1), col: clamp(cursor.col + dc, 0, GRID - 1) };
        draw(performance.now());
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        tryAdd(cursor.row, cursor.col);
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        undoMove();
      } else if (event.key.toLowerCase() === 'h') {
        event.preventDefault();
        useHint();
      } else if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        toggleSurge();
      }
    }

    function tickClock() {
      if (!active || selectedMode !== 'rush' || disposed || pausedAt) return;
      if (performance.now() >= deadline) finishRun();
      else updateHud();
    }

    function finishRun() {
      active = false;
      sessionComplete = true;
      clearInterval(clockTimer);
      clearTimeout(nextBoardTimer);
      const rank = score >= 3200 ? 'Master cartographer' : score >= 2100 ? 'Signal architect' : score >= 1100 ? 'Route keeper' : 'Trail starter';
      setResult(`${rank}: ${score} points`, `${boardsSolved} board${boardsSolved === 1 ? '' : 's'} solved. Best streak: ${bestStreak}. Choose a mode to start another run.`);
      startButton.textContent = `Start ${modes[selectedMode].label}`;
      playTone('finish');
      updateHud();
      updateControls();
    }

    function updateHud() {
      const stageLimit = selectedMode === 'learn' ? 4 : selectedMode === 'expedition' ? 5 : null;
      hud.querySelector('[data-stat="mode"]').textContent = modes[selectedMode].label;
      hud.querySelector('[data-label="stage"]').textContent = selectedMode === 'rush' ? 'Time' : 'Stage';
      hud.querySelector('[data-stat="stage"]').textContent = selectedMode === 'rush'
        ? `${Math.max(0, Math.ceil((deadline - performance.now()) / 1000))}s`
        : `${Math.min(stageNumber, stageLimit || stageNumber)} / ${stageLimit}`;
      hud.querySelector('[data-stat="score"]').textContent = score.toLocaleString();
      hud.querySelector('[data-stat="charge"]').textContent = board && active ? `${Math.max(0, board.charge)} / ${board.initialCharge}` : '—';
      hud.querySelector('[data-stat="focus"]').textContent = String(focus);
      hud.querySelector('[data-stat="surges"]').textContent = String(surges);
    }

    function updateControls() {
      const canAct = active && board && !board.solved && !sessionComplete;
      undoButton.disabled = !canAct || path.length <= 1;
      surgeButton.disabled = !canAct || surges <= 0;
      hintButton.disabled = !canAct || focus <= 0;
      restartButton.disabled = !canAct;
      surgeButton.classList.toggle('is-armed', surgeArmed);
      surgeButton.setAttribute('aria-pressed', String(surgeArmed));
      startButton.disabled = active;
    }

    function announceBoard() {
      const terrain = board.cells.flat().reduce((counts, cell) => {
        counts[cell.type] = (counts[cell.type] || 0) + 1;
        return counts;
      }, {});
      boardWrap.setAttribute('aria-description', `Six by six grid. Start at row ${board.start.row + 1}, column 1. Exit at row ${board.exit.row + 1}, column 6. ${board.relays.length} ordered relays. ${terrain.block || 0} blocked cells, ${terrain.brush || 0} brush cells, and ${terrain.storm || 0} storm cells.`);
    }

    function setResult(heading, detail) {
      result.replaceChildren();
      const strong = document.createElement('strong');
      strong.textContent = heading;
      const small = document.createElement('small');
      small.textContent = detail;
      result.append(strong, small);
    }

    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) {
        setResult('Sound is not available here.', 'Threadline remains fully playable without audio.');
        return;
      }
      soundEnabled = !soundEnabled;
      soundButton.textContent = soundEnabled ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(soundEnabled));
      if (soundEnabled) {
        audioContext ||= new AudioEngine();
        audioContext.resume();
        playTone('start');
      }
    }

    function playTone(kind) {
      if (!soundEnabled || !audioContext || disposed) return;
      const map = {
        start: [340, 430], relay: [520, 720], cache: [620, 880], surge: [260, 540],
        hint: [420, 610], miss: [210, 170], overload: [190, 90], win: [520, 780], finish: [440, 660]
      };
      const [from, to] = map[kind] || map.start;
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = kind === 'overload' ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(from, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(60, to), now + 0.16);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.24);
    }

    function draw(time) {
      const bounds = boardWrap.getBoundingClientRect();
      const width = Math.max(1, Math.floor(bounds.width));
      const height = Math.max(1, Math.floor(bounds.height));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.floor(width * ratio) || canvas.height !== Math.floor(height * ratio)) {
        canvas.width = Math.floor(width * ratio);
        canvas.height = Math.floor(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = colors.ink;
      context.fillRect(0, 0, width, height);

      const size = Math.min((width - 28) / GRID, (height - 28) / GRID);
      const offsetX = (width - size * GRID) / 2;
      const offsetY = (height - size * GRID) / 2;
      const gap = Math.max(3, size * 0.06);
      const now = reducedMotion ? 0 : time;

      for (let row = 0; row < GRID; row += 1) {
        for (let col = 0; col < GRID; col += 1) {
          const cell = board?.cells[row][col] || { type: 'normal', marker: null };
          const x = offsetX + col * size + gap / 2;
          const y = offsetY + row * size + gap / 2;
          const cellSize = size - gap;
          context.fillStyle = colors[cell.type] || colors.normal;
          roundedRect(context, x, y, cellSize, cellSize, Math.max(6, size * 0.13));
          context.fill();

          if (cell.type === 'brush') drawBrush(x, y, cellSize);
          if (cell.type === 'storm') drawStorm(x, y, cellSize, now);
          if (cell.type === 'block') drawBlock(x, y, cellSize);
          if (cell.marker === 'start') drawMarker(x, y, cellSize, colors.path, 'S');
          if (cell.marker === 'exit') drawMarker(x, y, cellSize, colors.exit, 'E');
          if (cell.marker?.startsWith('relay-')) drawMarker(x, y, cellSize, colors.relay, cell.marker.split('-')[1]);
          if (cell.marker?.startsWith('cache-')) drawMarker(x, y, cellSize, colors.cache, '+2');

          if (hintCells.some((point) => point.row === row && point.col === col) && time <= hintExpires) {
            context.strokeStyle = colors.cursor;
            context.lineWidth = 3;
            context.setLineDash([5, 5]);
            roundedRect(context, x + 3, y + 3, cellSize - 6, cellSize - 6, Math.max(5, size * 0.1));
            context.stroke();
            context.setLineDash([]);
          }
        }
      }

      if (path.length) {
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();
        path.forEach((point, index) => {
          const x = offsetX + (point.col + 0.5) * size;
          const y = offsetY + (point.row + 0.5) * size;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.strokeStyle = colors.pathGlow;
        context.lineWidth = Math.max(10, size * 0.24);
        context.stroke();
        context.strokeStyle = colors.path;
        context.lineWidth = Math.max(4, size * 0.085);
        context.stroke();

        if (!reducedMotion && active && !board?.solved) {
          const pulseIndex = Math.floor((time * 0.0022) % Math.max(1, path.length));
          const point = path[Math.min(pulseIndex, path.length - 1)];
          const x = offsetX + (point.col + 0.5) * size;
          const y = offsetY + (point.row + 0.5) * size;
          const glow = context.createRadialGradient(x, y, 0, x, y, size * 0.28);
          glow.addColorStop(0, 'rgba(255,242,189,.92)');
          glow.addColorStop(1, 'rgba(255,111,74,0)');
          context.fillStyle = glow;
          context.beginPath();
          context.arc(x, y, size * 0.28, 0, TAU);
          context.fill();
        }
      }

      const cursorX = offsetX + cursor.col * size + gap / 2;
      const cursorY = offsetY + cursor.row * size + gap / 2;
      context.strokeStyle = colors.cursor;
      context.lineWidth = 3;
      roundedRect(context, cursorX + 2, cursorY + 2, size - gap - 4, size - gap - 4, Math.max(6, size * 0.13));
      context.stroke();
    }

    function drawBrush(x, y, size) {
      context.strokeStyle = 'rgba(191,231,209,.28)';
      context.lineWidth = 1.5;
      for (let index = 0; index < 3; index += 1) {
        context.beginPath();
        context.moveTo(x + size * (0.25 + index * 0.22), y + size * 0.72);
        context.quadraticCurveTo(x + size * (0.18 + index * 0.22), y + size * 0.46, x + size * (0.28 + index * 0.22), y + size * 0.26);
        context.stroke();
      }
    }

    function drawStorm(x, y, size, time) {
      const pulse = reducedMotion ? 0.45 : 0.35 + Math.sin(time * 0.004 + x * 0.02) * 0.12;
      context.strokeStyle = `rgba(242,198,109,${pulse})`;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(x + size * 0.58, y + size * 0.2);
      context.lineTo(x + size * 0.38, y + size * 0.52);
      context.lineTo(x + size * 0.58, y + size * 0.52);
      context.lineTo(x + size * 0.42, y + size * 0.8);
      context.stroke();
    }

    function drawBlock(x, y, size) {
      context.strokeStyle = 'rgba(191,231,209,.12)';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(x + size * 0.25, y + size * 0.25);
      context.lineTo(x + size * 0.75, y + size * 0.75);
      context.moveTo(x + size * 0.75, y + size * 0.25);
      context.lineTo(x + size * 0.25, y + size * 0.75);
      context.stroke();
    }

    function drawMarker(x, y, size, color, text) {
      const cx = x + size / 2;
      const cy = y + size / 2;
      context.fillStyle = color;
      context.beginPath();
      context.arc(cx, cy, Math.max(10, size * 0.23), 0, TAU);
      context.fill();
      context.fillStyle = colors.ink;
      context.font = `900 ${Math.max(10, size * 0.2)}px system-ui`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, cx, cy + 0.5);
    }

    function animate(time) {
      if (disposed || !canvas.isConnected) return;
      draw(time);
      animationId = requestAnimationFrame(animate);
    }

    function handleVisibility() {
      if (!active || selectedMode !== 'rush') return;
      if (document.hidden) pausedAt = performance.now();
      else if (pausedAt) {
        deadline += performance.now() - pausedAt;
        pausedAt = 0;
        updateHud();
      }
    }

    function cleanup() {
      disposed = true;
      active = false;
      pointerActive = false;
      clearInterval(clockTimer);
      clearTimeout(nextBoardTimer);
      cancelAnimationFrame(animationId);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {});
    }
  };

  function randomInt(max) {
    return Math.floor(Math.random() * max);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function keyOf(point) {
    return `${point.row}:${point.col}`;
  }

  function neighbors(point) {
    return [
      { row: point.row - 1, col: point.col },
      { row: point.row + 1, col: point.col },
      { row: point.row, col: point.col - 1 },
      { row: point.row, col: point.col + 1 }
    ].filter((item) => item.row >= 0 && item.row < GRID && item.col >= 0 && item.col < GRID);
  }

  function shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swap = randomInt(index + 1);
      [items[index], items[swap]] = [items[swap], items[index]];
    }
    return items;
  }

  function roundedRect(context, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.arcTo(x + width, y, x + width, y + height, safeRadius);
    context.arcTo(x + width, y + height, x, y + height, safeRadius);
    context.arcTo(x, y + height, x, y, safeRadius);
    context.arcTo(x, y, x + width, y, safeRadius);
    context.closePath();
  }
})();
