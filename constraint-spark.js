(() => {
  const styleId = 'constraint-spark-styles';

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .spark-game { max-width: 800px; gap: 16px; }
      .spark-intro { display: flex; justify-content: space-between; gap: 16px; align-items: end; }
      .spark-intro p { max-width: 610px; }
      .spark-status { flex: 0 0 auto; color: var(--accent-dark); font-size: .72rem; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; }
      .spark-arena { position: relative; min-height: 360px; overflow: hidden; border-radius: 28px; padding: 34px; display: grid; place-items: center; background: radial-gradient(circle at 50% 42%, #1a4638 0, #0d251d 48%, #07110d 100%); box-shadow: inset 0 0 0 1px rgba(255,255,255,.09); }
      .spark-sky { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
      .spark-ring { fill: none; stroke: rgba(191,231,209,.22); stroke-width: 1.5; transform-origin: 200px 160px; animation: spark-ring 16s linear infinite; }
      .spark-ring:nth-child(2) { stroke: rgba(255,111,74,.22); animation-direction: reverse; animation-duration: 11s; }
      .spark-particle { fill: #fff2bd; animation: spark-pulse 2.2s ease-in-out infinite; }
      .spark-particle:nth-of-type(2n) { animation-delay: -.7s; }
      .spark-particle:nth-of-type(3n) { animation-delay: -1.4s; }
      .spark-deck { position: relative; z-index: 1; width: min(100%, 540px); min-height: 246px; }
      .spark-back { position: absolute; inset: 0; border-radius: 26px; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.08); pointer-events: none; }
      .spark-back:nth-child(1) { transform: translateY(18px) scale(.91) rotate(-2.5deg); opacity: .45; }
      .spark-back:nth-child(2) { transform: translateY(10px) scale(.96) rotate(1.5deg); opacity: .72; }
      .spark-card { position: relative; width: 100%; min-height: 246px; border: 0; border-radius: 26px; padding: 30px; display: grid; align-content: space-between; gap: 20px; text-align: left; background: var(--paper-strong); color: var(--ink); box-shadow: 0 25px 60px rgba(0,0,0,.32); cursor: grab; touch-action: pan-y; user-select: none; will-change: transform, opacity; }
      .spark-card:hover { transform: translateY(-3px); }
      .spark-card:active { cursor: grabbing; }
      .spark-card:focus-visible { outline: 4px solid var(--accent); outline-offset: 5px; }
      .spark-card[aria-busy="true"] { cursor: wait; }
      .spark-card-kicker { color: var(--accent-dark); font-size: .72rem; font-weight: 900; letter-spacing: .13em; text-transform: uppercase; }
      .spark-card strong { display: block; max-width: 470px; font-size: clamp(1.75rem, 5vw, 3.25rem); line-height: 1.02; letter-spacing: -.055em; text-wrap: balance; }
      .spark-card-hint { color: var(--muted); font-size: .82rem; font-weight: 700; }
      .spark-progress { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 7px; min-height: 26px; }
      .spark-dot { width: 9px; height: 9px; border-radius: 50%; border: 1px solid var(--line); background: transparent; transition: transform .18s ease, background .18s ease; }
      .spark-dot.is-seen { background: var(--accent); border-color: var(--accent); transform: scale(1.08); }
      .spark-announcement { min-height: 24px; margin: 0; text-align: center; color: var(--muted); font-size: .86rem; font-weight: 700; }
      .spark-actions { justify-content: center; }
      @keyframes spark-ring { to { transform: rotate(360deg); } }
      @keyframes spark-pulse { 50% { opacity: .35; transform: scale(.72); } }
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
      }
      @media (prefers-reduced-motion: reduce) {
        .spark-ring, .spark-particle { animation: none; }
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

    const intro = document.createElement('div');
    intro.className = 'spark-intro';
    const introText = document.createElement('p');
    introText.textContent = app.config.instructions;
    const status = document.createElement('span');
    status.className = 'spark-status';
    status.textContent = 'Deck ready';
    intro.append(introText, status);

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
    const nextButton = makeButton('Draw next', () => advance(1));
    const shuffleButton = makeButton('Shuffle deck', shuffleNow, true);
    const soundButton = makeButton('Sound off', toggleSound, true);
    soundButton.setAttribute('aria-pressed', 'false');
    actions.append(nextButton, shuffleButton, soundButton);

    root.append(intro, arena, progress, announcement, actions);

    card.addEventListener('click', () => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      advance(1);
    });
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      advance(event.key === 'ArrowLeft' ? -1 : 1);
    });
    card.addEventListener('pointerdown', startDrag);
    card.addEventListener('pointermove', moveDrag);
    card.addEventListener('pointerup', endDrag);
    card.addEventListener('pointercancel', cancelDrag);
    dialog.addEventListener('close', cleanup, { once: true });

    createDeck(false);
    showNextCard('First card drawn.', false);
    buildProgress();

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
      card.querySelector('strong').textContent = current;
      card.setAttribute('aria-label', `Constraint: ${current}. Draw another card`);
      status.textContent = `Card ${cursor} of ${deck.length}`;
      progress.setAttribute('aria-label', `${cursor} of ${deck.length} constraints seen before the deck reshuffles`);
      [...progress.children].forEach((dot, index) => dot.classList.toggle('is-seen', index < cursor));
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
      cards.forEach(() => {
        const dot = document.createElement('span');
        dot.className = 'spark-dot';
        dot.setAttribute('aria-hidden', 'true');
        progress.append(dot);
      });
      setCardText();
    }

    function advance(direction, message = 'New constraint drawn.', announceReshuffle = true, tone = 'move') {
      if (disposed || drawing || !cards.length) return;
      drawing = true;
      card.setAttribute('aria-busy', 'true');
      nextButton.disabled = true;
      shuffleButton.disabled = true;
      playTone(tone);

      if (reducedMotion) {
        showNextCard(message, announceReshuffle);
        finishAdvance();
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
            window.setTimeout(finishAdvance, 300);
          });
        });
      }, 225);
    }

    function finishAdvance() {
      if (disposed) return;
      drawing = false;
      card.removeAttribute('aria-busy');
      nextButton.disabled = false;
      shuffleButton.disabled = false;
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
      if (disposed || drawing || event.button !== 0 || !event.isPrimary) return;
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
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
      drag.lastX = event.clientX;
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
        advance(dx < 0 ? -1 : 1);
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
      oscillator.type = kind === 'move' ? 'triangle' : 'sine';
      const startFrequency = kind === 'move' ? 280 : kind === 'reshuffle' ? 420 : 620;
      const endFrequency = kind === 'move' ? 190 : kind === 'reshuffle' ? 720 : 780;
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
