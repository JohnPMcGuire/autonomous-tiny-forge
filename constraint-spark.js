(() => {
  const styleId = 'constraint-spark-styles';

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .spark-game { max-width: 820px; gap: 14px; }
      .spark-intro { display: flex; justify-content: space-between; gap: 16px; align-items: end; }
      .spark-intro p { max-width: 620px; }
      .spark-status { flex: 0 0 auto; color: var(--accent-dark); font-size: .72rem; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; }
      .spark-modes, .spark-paces { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; }
      .spark-mode, .spark-pace { border: 1px solid var(--line); border-radius: 999px; padding: 9px 14px; background: white; color: var(--ink); font: inherit; font-size: .78rem; font-weight: 850; cursor: pointer; }
      .spark-mode[aria-pressed="true"], .spark-pace[aria-pressed="true"] { border-color: var(--accent); background: var(--accent); color: #07110d; }
      .spark-mode:focus-visible, .spark-pace:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
      .spark-pace:disabled { cursor: not-allowed; opacity: .58; }
      .spark-sprint-hud { display: none; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .spark-sprint-hud.is-visible { display: grid; }
      .spark-stat { border: 1px solid var(--line); border-radius: 15px; padding: 10px 12px; background: white; text-align: center; }
      .spark-stat span { display: block; color: var(--muted); font-size: .65rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
      .spark-stat strong { display: block; margin-top: 3px; font-size: 1rem; }
      .spark-timer { display: none; height: 8px; overflow: hidden; border-radius: 999px; background: var(--line); }
      .spark-timer.is-visible { display: block; }
      .spark-timer-fill { width: 100%; height: 100%; background: linear-gradient(90deg, var(--accent), #fff2bd); transform-origin: left center; }
      .spark-arena { position: relative; min-height: 360px; overflow: hidden; border-radius: 28px; padding: 34px; display: grid; place-items: center; background: radial-gradient(circle at 50% 42%, #1a4638 0, #0d251d 48%, #07110d 100%); box-shadow: inset 0 0 0 1px rgba(255,255,255,.09); }
      .spark-arena.is-burst::after { content: ""; position: absolute; width: 120px; height: 120px; border: 2px solid #fff2bd; border-radius: 50%; animation: spark-burst .7s ease-out forwards; pointer-events: none; }
      .spark-sky { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
      .spark-ring { fill: none; stroke: rgba(191,231,209,.22); stroke-width: 1.5; transform-origin: 200px 160px; animation: spark-ring 16s linear infinite; }
      .spark-ring:nth-child(2) { stroke: rgba(255,111,74,.22); animation-direction: reverse; animation-duration: 11s; }
      .spark-particle { fill: #fff2bd; animation: spark-pulse 2.2s ease-in-out infinite; }
      .spark-particle:nth-of-type(2n) { animation-delay: -.7s; }
      .spark-particle:nth-of-type(3n) { animation-delay: -1.4s; }
      .spark-deck { position: relative; z-index: 1; width: min(100%, 550px); min-height: 246px; }
      .spark-back { position: absolute; inset: 0; border-radius: 26px; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.08); pointer-events: none; }
      .spark-back:nth-child(1) { transform: translateY(18px) scale(.91) rotate(-2.5deg); opacity: .45; }
      .spark-back:nth-child(2) { transform: translateY(10px) scale(.96) rotate(1.5deg); opacity: .72; }
      .spark-card { position: relative; width: 100%; min-height: 246px; border: 0; border-radius: 26px; padding: 30px; display: grid; align-content: space-between; gap: 20px; text-align: left; background: var(--paper-strong); color: var(--ink); box-shadow: 0 25px 60px rgba(0,0,0,.32); cursor: grab; touch-action: pan-y; user-select: none; will-change: transform, opacity; }
      .spark-card:hover { transform: translateY(-3px); }
      .spark-card:active { cursor: grabbing; }
      .spark-card:focus-visible { outline: 4px solid var(--accent); outline-offset: 5px; }
      .spark-card[aria-busy="true"] { cursor: wait; }
      .spark-card-kicker { color: var(--accent-dark); font-size: .72rem; font-weight: 900; letter-spacing: .13em; text-transform: uppercase; }
      .spark-card strong { display: block; max-width: 480px; font-size: clamp(1.7rem, 5vw, 3.2rem); line-height: 1.02; letter-spacing: -.055em; text-wrap: balance; }
      .spark-card-hint { color: var(--muted); font-size: .82rem; font-weight: 700; }
      .spark-progress { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 7px; min-height: 26px; }
      .spark-dot { width: 9px; height: 9px; border-radius: 50%; border: 1px solid var(--line); background: transparent; transition: transform .18s ease, background .18s ease; }
      .spark-dot.is-seen { background: var(--accent); border-color: var(--accent); transform: scale(1.08); }
      .spark-dot.is-current { box-shadow: 0 0 0 4px rgba(255,111,74,.18); }
      .spark-announcement { min-height: 24px; margin: 0; text-align: center; color: var(--muted); font-size: .86rem; font-weight: 700; }
      .spark-actions { justify-content: center; }
      @keyframes spark-ring { to { transform: rotate(360deg); } }
      @keyframes spark-pulse { 50% { opacity: .35; transform: scale(.72); } }
      @keyframes spark-burst { to { opacity: 0; transform: scale(5); } }
      @media (max-width: 620px) {
        .spark-arena { min-height: 320px; padding: 24px 16px; }
        .spark-deck, .spark-card { min-height: 230px; }
        .spark-card { padding: 24px; }
        .spark-intro { align-items: start; flex-direction: column; gap: 5px; }
      }
      @media (max-width: 410px) {
        .spark-arena { min-height: 300px; padding: 20px 12px; }
        .spark-deck, .spark-card { min-height: 220px; }
        .spark-card { padding: 21px; }
        .spark-mode, .spark-pace { padding: 8px 11px; font-size: .72rem; }
      }
      @media (prefers-reduced-motion: reduce) {
        .spark-ring, .spark-particle, .spark-arena.is-burst::after { animation: none; }
      }
    `;
    document.head.append(styles);
  }

  renderChallengeDeck = function renderChallengeDeckEnhanced(app) {
    installStyles();

    const root = panel('');
    root.classList.add('spark-game');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = [...new Set((app.config.items.length ? app.config.items : app.config.prompts).map((item) => item.trim()).filter(Boolean))];
    let deck = [];
    let cursor = 0;
    let current = '';
    let cycle = 0;
    let drawing = false;
    let drag = null;
    let suppressClick = false;
    let soundEnabled = false;
    let audioContext;
    let disposed = false;
    let mode = 'explore';
    let roundSeconds = 60;
    let sprintActive = false;
    let sprintComplete = false;
    let sprintRound = 0;
    let score = 0;
    let swapAvailable = true;
    let deadline = 0;
    let timerFrame = 0;
    let lastShownSecond = -1;
    let timedOut = false;

    const intro = document.createElement('div');
    intro.className = 'spark-intro';
    const introText = document.createElement('p');
    introText.textContent = app.config.instructions;
    const status = document.createElement('span');
    status.className = 'spark-status';
    status.textContent = 'Deck ready';
    intro.append(introText, status);

    const modes = document.createElement('div');
    modes.className = 'spark-modes';
    modes.setAttribute('role', 'group');
    modes.setAttribute('aria-label', 'Constraint Spark mode');
    const exploreMode = modeButton('Explore deck', 'explore');
    const sprintMode = modeButton('Three-card sprint', 'sprint');
    modes.append(exploreMode, sprintMode);

    const paces = document.createElement('div');
    paces.className = 'spark-paces';
    paces.setAttribute('role', 'group');
    paces.setAttribute('aria-label', 'Sprint pace');
    const paceOptions = [
      ['Quick · 30 sec', 30],
      ['Standard · 60 sec', 60],
      ['Deep · 90 sec', 90]
    ];
    const paceButtons = paceOptions.map(([label, seconds]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'spark-pace';
      button.textContent = label;
      button.setAttribute('aria-pressed', String(seconds === roundSeconds));
      button.addEventListener('click', () => setPace(seconds));
      paces.append(button);
      return button;
    });
    paces.hidden = true;

    const sprintHud = document.createElement('div');
    sprintHud.className = 'spark-sprint-hud';
    sprintHud.innerHTML = `
      <div class="spark-stat"><span>Round</span><strong id="spark-round">—</strong></div>
      <div class="spark-stat"><span>Time</span><strong id="spark-time">—</strong></div>
      <div class="spark-stat"><span>Score</span><strong id="spark-score">0</strong></div>
    `;

    const timer = document.createElement('div');
    timer.className = 'spark-timer';
    timer.setAttribute('role', 'progressbar');
    timer.setAttribute('aria-label', 'Round time remaining');
    timer.setAttribute('aria-valuemin', '0');
    timer.setAttribute('aria-valuemax', String(roundSeconds));
    const timerFill = document.createElement('div');
    timerFill.className = 'spark-timer-fill';
    timer.append(timerFill);

    const arena = document.createElement('div');
    arena.className = 'spark-arena';
    arena.innerHTML = `
      <svg class="spark-sky" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <ellipse class="spark-ring" cx="200" cy="160" rx="150" ry="72" transform="rotate(-14 200 160)"></ellipse>
        <ellipse class="spark-ring" cx="200" cy="160" rx="86" ry="142" transform="rotate(38 200 160)"></ellipse>
        <circle class="spark-particle" cx="72" cy="91" r="4"></circle>
        <circle class="spark-particle" cx="329" cy="112" r="3"></circle>
        <circle class="spark-particle" cx="303" cy="250" r="4"></circle>
        <circle class="spark-particle" cx="103" cy="241" r="3"></circle>
        <circle class="spark-particle" cx="205" cy="41" r="2.5"></circle>
      </svg>
    `;

    const deckShell = document.createElement('div');
    deckShell.className = 'spark-deck';
    const backOne = document.createElement('span');
    backOne.className = 'spark-back';
    backOne.setAttribute('aria-hidden', 'true');
    const backTwo = document.createElement('span');
    backTwo.className = 'spark-back';
    backTwo.setAttribute('aria-hidden', 'true');
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'spark-card';
    card.innerHTML = `
      <span class="spark-card-kicker">Creative constraint</span>
      <strong></strong>
      <span class="spark-card-hint">Swipe, tap, or use the left and right arrow keys</span>
    `;
    deckShell.append(backOne, backTwo, card);
    arena.append(deckShell);

    const progress = document.createElement('div');
    progress.className = 'spark-progress';
    progress.setAttribute('role', 'img');

    const announcement = document.createElement('p');
    announcement.className = 'spark-announcement';
    announcement.setAttribute('aria-live', 'polite');

    const actions = document.createElement('div');
    actions.className = 'tool-actions spark-actions';
    const primaryButton = makeButton('Draw next', handlePrimary);
    const secondaryButton = makeButton('Shuffle deck', handleSecondary, true);
    const soundButton = makeButton('Sound off', toggleSound, true);
    soundButton.setAttribute('aria-pressed', 'false');
    actions.append(primaryButton, secondaryButton, soundButton);

    root.append(intro, modes, paces, sprintHud, timer, arena, progress, announcement, actions);

    card.addEventListener('click', () => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      if (mode === 'sprint') {
        if (sprintActive) completeRound();
        else startSprint();
      } else {
        advance(1);
      }
    });
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      if (mode === 'sprint') {
        useSwap(event.key === 'ArrowLeft' ? -1 : 1);
      } else {
        advance(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    card.addEventListener('pointerdown', startDrag);
    card.addEventListener('pointermove', moveDrag);
    card.addEventListener('pointerup', endDrag);
    card.addEventListener('pointercancel', cancelDrag);
    dialog.addEventListener('close', cleanup, { once: true });

    createDeck(false);
    showNextCard('First card drawn.', false);
    buildProgress();

    function modeButton(label, value) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'spark-mode';
      button.textContent = label;
      button.setAttribute('aria-pressed', String(mode === value));
      button.addEventListener('click', () => setMode(value));
      return button;
    }

    function shuffle(values) {
      const copy = [...values];
      for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
      }
      return copy;
    }

    function createDeck(avoidRepeat = true) {
      const previous = current;
      deck = shuffle(cards);
      if (avoidRepeat && deck.length > 1 && deck[0] === previous) {
        [deck[0], deck[1]] = [deck[1], deck[0]];
      }
      cursor = 0;
      cycle += 1;
    }

    function takeNextCard() {
      let reshuffled = false;
      if (cursor >= deck.length) {
        createDeck(true);
        reshuffled = true;
      }
      current = deck[cursor];
      cursor += 1;
      return reshuffled;
    }

    function setCardText() {
      const kicker = card.querySelector('.spark-card-kicker');
      const hint = card.querySelector('.spark-card-hint');
      card.querySelector('strong').textContent = current;
      if (mode === 'sprint') {
        kicker.textContent = sprintActive ? `Sprint round ${sprintRound}` : 'Sprint preview';
        hint.textContent = sprintActive
          ? 'Tap the card or Complete round when you have an idea.'
          : 'Choose a pace, then start a three-card sprint.';
        card.setAttribute('aria-label', sprintActive
          ? `Constraint: ${current}. Complete sprint round ${sprintRound}`
          : `Constraint preview: ${current}. Start a three-card sprint`);
      } else {
        kicker.textContent = 'Creative constraint';
        hint.textContent = 'Swipe, tap, or use the left and right arrow keys';
        card.setAttribute('aria-label', `Constraint: ${current}. Draw another card`);
      }
      updateStatus();
      updateProgress();
    }

    function showNextCard(message, announceReshuffle = true) {
      const reshuffled = takeNextCard();
      setCardText();
      announcement.textContent = reshuffled && announceReshuffle
        ? `Deck ${cycle} started. No immediate repeat.`
        : message;
      if (reshuffled) playTone('reshuffle');
    }

    function buildProgress() {
      progress.replaceChildren();
      const count = mode === 'sprint' ? 3 : cards.length;
      for (let index = 0; index < count; index += 1) {
        const dot = document.createElement('span');
        dot.className = 'spark-dot';
        dot.setAttribute('aria-hidden', 'true');
        progress.append(dot);
      }
      updateProgress();
    }

    function updateProgress() {
      const dots = [...progress.children];
      if (mode === 'sprint') {
        const completed = sprintComplete ? 3 : Math.max(0, sprintRound - 1);
        dots.forEach((dot, index) => {
          dot.classList.toggle('is-seen', index < completed);
          dot.classList.toggle('is-current', sprintActive && index === sprintRound - 1);
        });
        const label = sprintComplete
          ? 'Three of three sprint rounds complete'
          : sprintActive
            ? `${completed} of 3 rounds complete. Round ${sprintRound} active`
            : 'Three sprint rounds not started';
        progress.setAttribute('aria-label', label);
      } else {
        dots.forEach((dot, index) => {
          dot.classList.toggle('is-seen', index < cursor);
          dot.classList.remove('is-current');
        });
        progress.setAttribute('aria-label', `${cursor} of ${deck.length} constraints seen before the deck reshuffles`);
      }
    }

    function updateStatus() {
      if (mode === 'explore') {
        status.textContent = `Card ${cursor} of ${deck.length}`;
      } else if (sprintComplete) {
        status.textContent = 'Sprint complete';
      } else if (sprintActive) {
        status.textContent = `Round ${sprintRound} of 3`;
      } else {
        status.textContent = 'Sprint ready';
      }
    }

    function setMode(nextMode) {
      if (disposed || drawing || mode === nextMode) return;
      stopTimer();
      mode = nextMode;
      sprintActive = false;
      sprintComplete = false;
      sprintRound = 0;
      score = 0;
      swapAvailable = true;
      timedOut = false;
      exploreMode.setAttribute('aria-pressed', String(mode === 'explore'));
      sprintMode.setAttribute('aria-pressed', String(mode === 'sprint'));
      paces.hidden = mode !== 'sprint';
      sprintHud.classList.toggle('is-visible', mode === 'sprint');
      timer.classList.remove('is-visible');
      timerFill.style.transform = 'scaleX(1)';
      sprintHud.querySelector('#spark-round').textContent = '—';
      sprintHud.querySelector('#spark-time').textContent = '—';
      sprintHud.querySelector('#spark-score').textContent = '0';
      primaryButton.textContent = mode === 'sprint' ? 'Start sprint' : 'Draw next';
      secondaryButton.textContent = mode === 'sprint' ? 'Swap card' : 'Shuffle deck';
      secondaryButton.disabled = mode === 'sprint';
      paceButtons.forEach((button) => { button.disabled = false; });
      announcement.textContent = mode === 'sprint'
        ? 'Choose a pace. Complete three constraints before each timer runs out for a higher score.'
        : 'Explore mode restored. Draw freely without a timer.';
      buildProgress();
      setCardText();
    }

    function setPace(seconds) {
      if (disposed || sprintActive || mode !== 'sprint') return;
      roundSeconds = seconds;
      paceButtons.forEach((button, index) => {
        button.setAttribute('aria-pressed', String(paceOptions[index][1] === roundSeconds));
      });
      timer.setAttribute('aria-valuemax', String(roundSeconds));
      announcement.textContent = `${roundSeconds}-second rounds selected.`;
      playTone('ready');
    }

    function handlePrimary() {
      if (mode === 'explore') {
        advance(1);
      } else if (!sprintActive || sprintComplete) {
        startSprint();
      } else {
        completeRound();
      }
    }

    function handleSecondary() {
      if (mode === 'explore') {
        shuffleNow();
      } else {
        useSwap(1);
      }
    }

    function startSprint() {
      if (disposed || drawing || mode !== 'sprint') return;
      stopTimer();
      createDeck(true);
      score = 0;
      sprintRound = 1;
      sprintActive = true;
      sprintComplete = false;
      swapAvailable = true;
      timedOut = false;
      paceButtons.forEach((button) => { button.disabled = true; });
      primaryButton.textContent = 'Complete round';
      secondaryButton.textContent = 'Swap card · 1';
      secondaryButton.disabled = false;
      sprintHud.querySelector('#spark-score').textContent = '0';
      showNextCard('Round one started. Make something small, then complete the round.', false);
      startTimer();
      updateProgress();
      playTone('start');
    }

    function completeRound() {
      if (disposed || drawing || !sprintActive || sprintComplete) return;
      const remaining = timedOut ? 0 : Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      const roundPoints = timedOut ? 40 : 100 + remaining * 2;
      score += roundPoints;
      sprintHud.querySelector('#spark-score').textContent = String(score);
      stopTimer();
      if (sprintRound >= 3) {
        finishSprint();
        return;
      }
      const completedRound = sprintRound;
      const tone = timedOut ? 'move' : 'complete';
      sprintRound += 1;
      timedOut = false;
      animateNext(1, `Round ${completedRound} complete. +${roundPoints} points. Round ${sprintRound} begins.`, tone, startTimer);
    }

    function finishSprint() {
      sprintActive = false;
      sprintComplete = true;
      stopTimer();
      timer.classList.remove('is-visible');
      const maxScore = 3 * (100 + roundSeconds * 2);
      const ratio = score / maxScore;
      const rank = ratio >= .82 ? 'Wildfire' : ratio >= .62 ? 'Bright spark' : 'Steady glow';
      status.textContent = 'Sprint complete';
      sprintHud.querySelector('#spark-round').textContent = '3 / 3';
      sprintHud.querySelector('#spark-time').textContent = 'Done';
      primaryButton.textContent = 'New sprint';
      secondaryButton.textContent = swapAvailable ? 'Swap unused' : 'Swap used';
      secondaryButton.disabled = true;
      paceButtons.forEach((button) => { button.disabled = false; });
      card.querySelector('.spark-card-kicker').textContent = rank;
      card.querySelector('strong').textContent = `${score} points`;
      card.querySelector('.spark-card-hint').textContent = 'Three constraints completed. Start again to chase a stronger run.';
      card.setAttribute('aria-label', `Sprint complete. ${rank}. ${score} points. Start a new sprint`);
      announcement.textContent = `${rank}. You completed all three rounds with ${score} points.`;
      arena.classList.add('is-burst');
      window.setTimeout(() => arena.classList.remove('is-burst'), 750);
      updateProgress();
      playTone('finish');
    }

    function useSwap(direction) {
      if (disposed || drawing || mode !== 'sprint' || !sprintActive || sprintComplete) return;
      if (!swapAvailable) {
        announcement.textContent = 'Your one swap has already been used. Complete this round to continue.';
        playTone('blocked');
        snapBack();
        return;
      }
      swapAvailable = false;
      timedOut = false;
      stopTimer();
      secondaryButton.textContent = 'Swap used';
      secondaryButton.disabled = true;
      animateNext(direction, 'Constraint swapped. The timer restarted for this round.', 'reshuffle', startTimer);
    }

    function startTimer() {
      if (disposed || mode !== 'sprint' || !sprintActive) return;
      deadline = performance.now() + roundSeconds * 1000;
      lastShownSecond = -1;
      timedOut = false;
      timer.classList.add('is-visible');
      timer.setAttribute('aria-valuemax', String(roundSeconds));
      tickTimer();
    }

    function tickTimer() {
      if (disposed || !sprintActive || mode !== 'sprint') return;
      const remainingMs = Math.max(0, deadline - performance.now());
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      const ratio = remainingMs / (roundSeconds * 1000);
      timerFill.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
      timer.setAttribute('aria-valuenow', String(remainingSeconds));
      if (remainingSeconds !== lastShownSecond) {
        lastShownSecond = remainingSeconds;
        sprintHud.querySelector('#spark-round').textContent = `${sprintRound} / 3`;
        sprintHud.querySelector('#spark-time').textContent = remainingSeconds > 0 ? `${remainingSeconds}s` : 'Overtime';
      }
      if (remainingMs <= 0) {
        timedOut = true;
        timerFrame = 0;
        announcement.textContent = 'Time is up. Complete the round for 40 points, or use your swap if it is still available.';
        playTone('timeout');
        return;
      }
      timerFrame = requestAnimationFrame(tickTimer);
    }

    function stopTimer() {
      if (timerFrame) cancelAnimationFrame(timerFrame);
      timerFrame = 0;
    }

    function animateNext(direction, message, tone, after) {
      advance(direction, message, true, tone, after);
    }

    function advance(direction, message = 'New constraint drawn.', announceReshuffle = true, tone = 'move', after) {
      if (disposed || drawing || !cards.length) return;
      drawing = true;
      card.setAttribute('aria-busy', 'true');
      primaryButton.disabled = true;
      secondaryButton.disabled = true;
      playTone(tone);

      if (reducedMotion) {
        showNextCard(message, announceReshuffle);
        finishAdvance();
        if (after) after();
        return;
      }

      const distance = Math.max(280, Math.min(520, arena.clientWidth * .75));
      card.style.transition = 'transform .22s ease-in, opacity .2s ease-in';
      card.style.transform = `translateX(${direction * distance}px) rotate(${direction * 12}deg)`;
      card.style.opacity = '0';

      window.setTimeout(() => {
        if (disposed || !card.isConnected) return;
        showNextCard(message, announceReshuffle);
        card.style.transition = 'none';
        card.style.transform = `translateX(${-direction * 86}px) rotate(${-direction * 5}deg)`;
        card.style.opacity = '0';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (disposed || !card.isConnected) return;
            card.style.transition = 'transform .28s cubic-bezier(.2,.8,.2,1), opacity .2s ease-out';
            card.style.transform = '';
            card.style.opacity = '1';
            window.setTimeout(() => {
              finishAdvance();
              if (after) after();
            }, 300);
          });
        });
      }, 225);
    }

    function finishAdvance() {
      if (disposed) return;
      drawing = false;
      card.removeAttribute('aria-busy');
      primaryButton.disabled = false;
      secondaryButton.disabled = mode === 'sprint' && (!sprintActive || !swapAvailable || sprintComplete);
      card.style.transition = '';
      card.style.transform = '';
      card.style.opacity = '';
    }

    function shuffleNow() {
      if (disposed || drawing || !cards.length) return;
      createDeck(true);
      advance(1, `Deck ${cycle} shuffled. First card drawn.`, false, 'reshuffle');
    }

    function startDrag(event) {
      if (disposed || drawing || event.button !== 0 || !event.isPrimary || (mode === 'sprint' && (!sprintActive || sprintComplete))) return;
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startedAt: performance.now(),
        moved: false
      };
      card.setPointerCapture(event.pointerId);
      card.style.transition = 'none';
    }

    function moveDrag(event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        drag.moved = true;
        event.preventDefault();
        const rotation = Math.max(-9, Math.min(9, dx / 22));
        const opacity = Math.max(.35, 1 - Math.abs(dx) / 420);
        card.style.transform = `translateX(${dx}px) rotate(${rotation}deg)`;
        card.style.opacity = String(opacity);
      }
    }

    function endDrag(event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.startX;
      const elapsed = Math.max(1, performance.now() - drag.startedAt);
      const velocity = dx / elapsed;
      const threshold = Math.min(110, Math.max(70, card.clientWidth * .2));
      const shouldAdvance = drag.moved && (Math.abs(dx) >= threshold || Math.abs(velocity) > .55);
      suppressClick = drag.moved;
      releasePointer(event.pointerId);
      drag = null;
      if (shouldAdvance) {
        if (mode === 'sprint') useSwap(dx < 0 ? -1 : 1);
        else advance(dx < 0 ? -1 : 1);
      } else {
        snapBack();
      }
    }

    function cancelDrag(event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      releasePointer(event.pointerId);
      drag = null;
      suppressClick = true;
      snapBack();
    }

    function releasePointer(pointerId) {
      if (card.hasPointerCapture(pointerId)) card.releasePointerCapture(pointerId);
    }

    function snapBack() {
      card.style.transition = reducedMotion ? 'none' : 'transform .22s ease-out, opacity .18s ease-out';
      card.style.transform = '';
      card.style.opacity = '1';
    }

    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) {
        announcement.textContent = 'Sound is not available in this browser.';
        return;
      }
      soundEnabled = !soundEnabled;
      soundButton.textContent = soundEnabled ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(soundEnabled));
      if (soundEnabled) {
        audioContext ||= new AudioEngine();
        audioContext.resume();
        playTone('ready');
      }
    }

    function playTone(kind) {
      if (disposed || !soundEnabled || !audioContext || !dialog.open) return;
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = kind === 'move' || kind === 'blocked' ? 'triangle' : 'sine';
      const frequencies = {
        move: [280, 190],
        reshuffle: [420, 720],
        ready: [620, 780],
        start: [440, 660],
        complete: [620, 920],
        finish: [520, 1040],
        timeout: [300, 180],
        blocked: [180, 140]
      };
      const [startFrequency, endFrequency] = frequencies[kind] || frequencies.ready;
      oscillator.frequency.setValueAtTime(startFrequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + .16);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(.065, now + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .2);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + .22);
    }

    function cleanup() {
      disposed = true;
      drawing = false;
      stopTimer();
      if (drag) {
        releasePointer(drag.pointerId);
        drag = null;
      }
      card.removeAttribute('aria-busy');
      card.style.transition = '';
      card.style.transform = '';
      card.style.opacity = '';
      soundEnabled = false;
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
    }
  };
})();
