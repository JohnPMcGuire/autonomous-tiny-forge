(() => {
  const styleId = 'pairadox-styles';

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .pairadox-game { max-width: 780px; gap: 14px; }
      .pairadox-intro { display: flex; justify-content: space-between; gap: 16px; align-items: end; }
      .pairadox-intro p { max-width: 570px; }
      .pairadox-count { flex: 0 0 auto; color: var(--accent-dark); font-size: .72rem; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; }
      .pairadox-arena { position: relative; min-height: 290px; overflow: hidden; border-radius: 28px; padding: 22px; display: grid; grid-template-columns: minmax(0, 1fr) 190px minmax(0, 1fr); gap: 18px; align-items: center; background: radial-gradient(circle at 50% 45%, #173d31 0, #0c211a 45%, #07110d 100%); box-shadow: inset 0 0 0 1px rgba(255,255,255,.09); }
      .pairadox-slot { position: relative; z-index: 2; min-height: 126px; border: 2px dashed rgba(191,231,209,.4); border-radius: 22px; padding: 16px; display: grid; align-content: center; gap: 7px; background: rgba(255,255,255,.035); color: white; text-align: left; cursor: pointer; transition: transform .18s ease, border-color .18s ease, background .18s ease; }
      .pairadox-slot:hover, .pairadox-slot:focus-visible { border-color: var(--mint); background: rgba(191,231,209,.09); outline: none; }
      .pairadox-slot.is-target { transform: scale(1.035); border-color: #fff2bd; background: rgba(255,242,189,.12); }
      .pairadox-slot.is-filled { border-style: solid; border-color: var(--accent); background: rgba(255,111,74,.12); }
      .pairadox-slot-label { color: rgba(255,255,255,.62); font-size: .67rem; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
      .pairadox-slot-value { font-size: clamp(1rem, 2.4vw, 1.35rem); font-weight: 900; line-height: 1.08; }
      .pairadox-slot-hint { color: rgba(255,255,255,.58); font-size: .75rem; }
      .pairadox-core-wrap { position: relative; z-index: 1; min-height: 210px; display: grid; place-items: center; }
      .pairadox-core { width: 190px; max-width: 100%; overflow: visible; filter: drop-shadow(0 14px 30px rgba(0,0,0,.38)); }
      .pairadox-orbit-group { transform-origin: 120px 90px; animation: pairadox-orbit 9s linear infinite; }
      .pairadox-orbit { fill: none; stroke: rgba(191,231,209,.35); stroke-width: 2; }
      .pairadox-node { fill: var(--mint); }
      .pairadox-shell { fill: #122e25; stroke: rgba(255,255,255,.19); stroke-width: 2; }
      .pairadox-flame { fill: var(--accent); transform-origin: 120px 96px; }
      .pairadox-spark { fill: #fff2bd; opacity: 0; transform-origin: 120px 90px; }
      .pairadox-arena.is-forging .pairadox-orbit-group { animation-duration: .55s; }
      .pairadox-arena.is-forging .pairadox-flame { animation: pairadox-flare .48s ease-in-out infinite alternate; }
      .pairadox-arena.is-forging .pairadox-spark { animation: pairadox-spark .7s ease-out both; }
      .pairadox-arena.is-forging .pairadox-spark:nth-child(2) { animation-delay: .06s; }
      .pairadox-arena.is-forging .pairadox-spark:nth-child(3) { animation-delay: .12s; }
      .pairadox-arena.is-forging .pairadox-spark:nth-child(4) { animation-delay: .18s; }
      .pairadox-result { min-height: 112px; padding: 20px 22px; }
      .pairadox-result strong { font-size: clamp(1.25rem, 3.8vw, 2.1rem); }
      .pairadox-bank-head { display: flex; justify-content: space-between; gap: 14px; align-items: baseline; }
      .pairadox-bank-head strong { font-size: .82rem; letter-spacing: .08em; text-transform: uppercase; }
      .pairadox-bank-head span { color: var(--muted); font-size: .82rem; }
      .pairadox-bank { display: flex; flex-wrap: wrap; gap: 9px; }
      .pairadox-token { min-height: 46px; border: 1px solid var(--line); border-radius: 999px; padding: 10px 14px; background: white; color: var(--ink); font-weight: 800; cursor: grab; touch-action: none; user-select: none; transition: transform .16s ease, background .16s ease, color .16s ease, border-color .16s ease; }
      .pairadox-token:hover { transform: translateY(-2px); border-color: var(--ink); }
      .pairadox-token:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
      .pairadox-token.is-selected { background: var(--ink); color: white; border-color: var(--ink); }
      .pairadox-token.is-dragging { opacity: .42; cursor: grabbing; }
      .pairadox-ghost { position: fixed; z-index: 9999; left: 0; top: 0; max-width: 190px; padding: 11px 15px; border-radius: 999px; background: #fffdf7; color: #15211c; border: 1px solid rgba(21,33,28,.2); box-shadow: 0 18px 45px rgba(0,0,0,.28); font-weight: 900; pointer-events: none; transform: translate(-50%, -120%); }
      @keyframes pairadox-orbit { to { transform: rotate(360deg); } }
      @keyframes pairadox-flare { to { transform: scale(1.18); filter: brightness(1.25); } }
      @keyframes pairadox-spark { 0% { opacity: 0; transform: scale(.4) translate(0,0); } 22% { opacity: 1; } 100% { opacity: 0; transform: scale(1.1) translate(0,-38px); } }
      @media (max-width: 640px) {
        .pairadox-arena { min-height: 360px; grid-template-columns: 1fr 1fr; gap: 10px; padding: 16px; }
        .pairadox-core-wrap { grid-column: 1 / -1; grid-row: 1; min-height: 155px; }
        .pairadox-core { width: 155px; }
        .pairadox-slot { min-height: 118px; padding: 13px; }
        .pairadox-intro { align-items: start; flex-direction: column; gap: 5px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .pairadox-orbit-group { animation: none; }
      }
    `;
    document.head.append(styles);
  }

  renderChoiceMixer = function renderChoiceMixerEnhanced(app) {
    installStyles();

    const root = panel('');
    root.classList.add('pairadox-game');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const selected = [null, null];
    let replacementIndex = 0;
    let mixCount = 0;
    let lastOutcome = -1;
    let forgeTimer = 0;
    let soundEnabled = false;
    let audioContext;
    let activeDrag = null;

    const intro = document.createElement('div');
    intro.className = 'pairadox-intro';
    const introText = document.createElement('p');
    introText.textContent = app.config.instructions;
    const count = document.createElement('span');
    count.className = 'pairadox-count';
    count.textContent = 'Forge ready';
    intro.append(introText, count);

    const arena = document.createElement('div');
    arena.className = 'pairadox-arena';

    const makeSlot = (index) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'pairadox-slot';
      slot.dataset.slot = String(index);
      slot.innerHTML = `<span class="pairadox-slot-label">Ingredient ${index + 1}</span><strong class="pairadox-slot-value">Drop here</strong><span class="pairadox-slot-hint">or tap a choice below</span>`;
      slot.addEventListener('click', () => {
        if (selected[index]) {
          selected[index] = null;
          window.clearTimeout(forgeTimer);
          arena.classList.remove('is-forging');
          syncSelection();
          setResult('Ingredient removed.', 'Choose another ingredient to continue.');
        }
      });
      return slot;
    };

    const slots = [makeSlot(0), makeSlot(1)];
    const core = document.createElement('div');
    core.className = 'pairadox-core-wrap';
    core.setAttribute('aria-hidden', 'true');
    core.innerHTML = `
      <svg class="pairadox-core" viewBox="0 0 240 180" focusable="false">
        <g class="pairadox-orbit-group">
          <ellipse class="pairadox-orbit" cx="120" cy="90" rx="91" ry="35" transform="rotate(-12 120 90)"></ellipse>
          <ellipse class="pairadox-orbit" cx="120" cy="90" rx="58" ry="79" transform="rotate(38 120 90)"></ellipse>
          <circle class="pairadox-node" cx="31" cy="82" r="5"></circle>
          <circle class="pairadox-node" cx="175" cy="27" r="4"></circle>
        </g>
        <polygon class="pairadox-shell" points="120,39 164,64 164,115 120,141 76,115 76,64"></polygon>
        <path class="pairadox-flame" d="M120 123c-21 0-33-13-30-31 2-13 12-19 18-29 2 13 9 17 12 25 3-15 14-22 18-37 15 18 19 31 15 46-4 16-16 26-33 26Z"></path>
        <g>
          <circle class="pairadox-spark" cx="93" cy="80" r="3"></circle>
          <circle class="pairadox-spark" cx="111" cy="63" r="2.5"></circle>
          <circle class="pairadox-spark" cx="136" cy="70" r="3"></circle>
          <circle class="pairadox-spark" cx="149" cy="88" r="2.5"></circle>
        </g>
      </svg>`;
    arena.append(slots[0], core, slots[1]);

    const result = resultCard();
    result.classList.add('pairadox-result');

    const bankHead = document.createElement('div');
    bankHead.className = 'pairadox-bank-head';
    bankHead.innerHTML = '<strong>Ingredient bank</strong><span>Tap, drag, or use the keyboard</span>';
    const bank = document.createElement('div');
    bank.className = 'pairadox-bank';
    bank.setAttribute('aria-label', 'Pairadox ingredient choices');

    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const randomButton = makeButton('Random mix', randomMix);
    const clearButton = makeButton('Clear forge', clearForge, true);
    const soundButton = makeButton('Sound off', toggleSound, true);
    soundButton.setAttribute('aria-pressed', 'false');
    actions.append(randomButton, clearButton, soundButton);

    const tokens = app.config.options.map((option) => {
      const token = document.createElement('button');
      token.type = 'button';
      token.className = 'pairadox-token';
      token.textContent = option;
      token.setAttribute('aria-pressed', 'false');
      token.addEventListener('click', () => chooseOption(option));
      addPointerDrag(token, option);
      bank.append(token);
      return { option, token };
    });

    root.append(intro, arena, result, bankHead, bank, actions);
    setResult('Load the forge.', 'Choose two ingredients. A new challenge appears when both slots are filled.');
    syncSelection();

    function setResult(headline, detail) {
      result.replaceChildren();
      const strong = document.createElement('strong');
      strong.textContent = headline;
      const small = document.createElement('small');
      small.textContent = detail;
      result.append(strong, small);
    }

    function chooseOption(option) {
      const currentIndex = selected.indexOf(option);
      if (currentIndex >= 0) {
        selected[currentIndex] = null;
        window.clearTimeout(forgeTimer);
        arena.classList.remove('is-forging');
        syncSelection();
        setResult('Ingredient returned.', 'Choose another ingredient or tap the same one again later.');
        return;
      }
      const emptyIndex = selected.indexOf(null);
      const targetIndex = emptyIndex >= 0 ? emptyIndex : replacementIndex;
      if (emptyIndex < 0) replacementIndex = (replacementIndex + 1) % 2;
      placeOption(option, targetIndex);
    }

    function placeOption(option, targetIndex) {
      const existingIndex = selected.indexOf(option);
      if (existingIndex >= 0 && existingIndex !== targetIndex) selected[existingIndex] = null;
      selected[targetIndex] = option;
      syncSelection();
      if (selected.every(Boolean)) forgeMix();
      else setResult('One ingredient loaded.', 'Add one more to ignite the forge.');
    }

    function syncSelection() {
      slots.forEach((slot, index) => {
        const value = selected[index];
        slot.classList.toggle('is-filled', Boolean(value));
        slot.querySelector('.pairadox-slot-value').textContent = value || 'Drop here';
        slot.querySelector('.pairadox-slot-hint').textContent = value ? 'Tap to remove' : 'or tap a choice below';
        slot.setAttribute('aria-label', value ? `Ingredient ${index + 1}: ${value}. Activate to remove.` : `Ingredient ${index + 1} is empty.`);
      });
      tokens.forEach(({ option, token }) => {
        const isSelected = selected.includes(option);
        token.classList.toggle('is-selected', isSelected);
        token.setAttribute('aria-pressed', String(isSelected));
      });
    }

    function forgeMix() {
      window.clearTimeout(forgeTimer);
      const pairKey = selected.join('|');
      arena.classList.add('is-forging');
      setResult('Forging a paradox…', 'Hold onto both ingredients while the challenge takes shape.');
      playForgeTone();
      forgeTimer = window.setTimeout(() => {
        if (selected.join('|') !== pairKey) return;
        let outcomeIndex = Math.floor(Math.random() * app.config.outcomes.length);
        if (app.config.outcomes.length > 1 && outcomeIndex === lastOutcome) outcomeIndex = (outcomeIndex + 1) % app.config.outcomes.length;
        lastOutcome = outcomeIndex;
        mixCount += 1;
        arena.classList.remove('is-forging');
        count.textContent = `Mix ${mixCount}`;
        setResult(`${selected[0]} + ${selected[1]}`, app.config.outcomes[outcomeIndex]);
      }, reducedMotion ? 0 : 620);
    }

    function randomMix() {
      const firstIndex = Math.floor(Math.random() * app.config.options.length);
      let secondIndex = Math.floor(Math.random() * app.config.options.length);
      if (secondIndex === firstIndex) secondIndex = (secondIndex + 1) % app.config.options.length;
      selected[0] = app.config.options[firstIndex];
      selected[1] = app.config.options[secondIndex];
      replacementIndex = 0;
      syncSelection();
      forgeMix();
    }

    function clearForge() {
      window.clearTimeout(forgeTimer);
      selected[0] = null;
      selected[1] = null;
      replacementIndex = 0;
      arena.classList.remove('is-forging');
      syncSelection();
      setResult('Forge cleared.', 'Choose two fresh ingredients when you are ready.');
    }

    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) {
        setResult('Sound is unavailable.', 'The visual and tactile game still works without it.');
        return;
      }
      soundEnabled = !soundEnabled;
      soundButton.textContent = soundEnabled ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(soundEnabled));
      if (soundEnabled) {
        audioContext ||= new AudioEngine();
        audioContext.resume();
        playForgeTone();
      }
    }

    function playForgeTone() {
      if (!soundEnabled || !audioContext) return;
      const now = audioContext.currentTime;
      [0, 0.08, 0.16].forEach((offset, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = index === 1 ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime([330, 440, 660][index], now + offset);
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.055, now + offset + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.17);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(now + offset);
        oscillator.stop(now + offset + 0.19);
      });
    }

    function addPointerDrag(token, option) {
      let suppressClick = false;
      token.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        cleanupDrag();
        activeDrag = {
          option,
          token,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          moved: false,
          targetIndex: null,
          ghost: null
        };
        try { token.setPointerCapture(event.pointerId); } catch (_) { /* Pointer capture is an enhancement. */ }
      });

      token.addEventListener('pointermove', (event) => {
        if (!activeDrag || activeDrag.pointerId !== event.pointerId || activeDrag.token !== token) return;
        const distance = Math.hypot(event.clientX - activeDrag.startX, event.clientY - activeDrag.startY);
        if (!activeDrag.moved && distance < 8) return;
        if (!activeDrag.moved) {
          activeDrag.moved = true;
          suppressClick = true;
          activeDrag.ghost = document.createElement('div');
          activeDrag.ghost.className = 'pairadox-ghost';
          activeDrag.ghost.textContent = option;
          document.body.append(activeDrag.ghost);
          token.classList.add('is-dragging');
        }
        event.preventDefault();
        activeDrag.ghost.style.left = `${event.clientX}px`;
        activeDrag.ghost.style.top = `${event.clientY}px`;
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.pairadox-slot');
        const targetIndex = target && arena.contains(target) ? Number(target.dataset.slot) : null;
        activeDrag.targetIndex = Number.isInteger(targetIndex) ? targetIndex : null;
        slots.forEach((slot, index) => slot.classList.toggle('is-target', index === activeDrag.targetIndex));
      });

      token.addEventListener('pointerup', (event) => {
        if (!activeDrag || activeDrag.pointerId !== event.pointerId || activeDrag.token !== token) return;
        const targetIndex = activeDrag.targetIndex;
        const moved = activeDrag.moved;
        cleanupDrag();
        if (moved && targetIndex !== null) placeOption(option, targetIndex);
        window.setTimeout(() => { suppressClick = false; }, 0);
      });

      token.addEventListener('pointercancel', () => {
        cleanupDrag();
        window.setTimeout(() => { suppressClick = false; }, 0);
      });

      token.addEventListener('click', (event) => {
        if (suppressClick) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }, true);
    }

    function cleanupDrag() {
      if (!activeDrag) return;
      activeDrag.ghost?.remove();
      activeDrag.token?.classList.remove('is-dragging');
      slots.forEach((slot) => slot.classList.remove('is-target'));
      activeDrag = null;
    }

    dialog.addEventListener('close', () => {
      window.clearTimeout(forgeTimer);
      cleanupDrag();
    }, { once: true });
  };
})();
