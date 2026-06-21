(() => {
  const styleId = 'tiny-step-styles';

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .tiny-step-game { max-width: 800px; gap: 16px; }
      .tiny-step-intro { display: flex; justify-content: space-between; gap: 16px; align-items: end; }
      .tiny-step-intro p { max-width: 600px; }
      .tiny-step-status { flex: 0 0 auto; color: var(--accent-dark); font-size: .72rem; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; }
      .tiny-step-controls { display: grid; grid-template-columns: minmax(0, 1fr) minmax(180px, .46fr); gap: 14px; }
      .tiny-step-energy { display: grid; gap: 8px; }
      .tiny-step-energy-head { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
      .tiny-step-energy-head output { color: var(--accent-dark); font-weight: 900; }
      .tiny-step-energy input { width: 100%; accent-color: var(--accent); }
      .tiny-step-arena { position: relative; overflow: hidden; border-radius: 28px; padding: 20px 22px 18px; background: radial-gradient(circle at 50% 38%, #1a4638 0, #0d251d 48%, #07110d 100%); color: white; box-shadow: inset 0 0 0 1px rgba(255,255,255,.09); }
      .tiny-step-map { width: 100%; min-height: 210px; display: block; overflow: visible; }
      .tiny-step-path { fill: none; stroke: rgba(191,231,209,.28); stroke-width: 8; stroke-linecap: round; stroke-dasharray: 10 16; animation: tiny-step-drift 8s linear infinite; }
      .tiny-step-stone { fill: #153a2e; stroke: rgba(255,255,255,.24); stroke-width: 3; }
      .tiny-step-stone.is-complete { fill: var(--accent); stroke: #fff2bd; }
      .tiny-step-number { fill: white; font-size: 18px; font-weight: 900; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
      .tiny-step-marker { transform-box: view-box; transform-origin: 0 0; transition: transform .42s cubic-bezier(.2,.85,.2,1); filter: drop-shadow(0 8px 12px rgba(0,0,0,.35)); }
      .tiny-step-marker-ring { fill: rgba(255,242,189,.16); stroke: #fff2bd; stroke-width: 2; animation: tiny-step-pulse 1.8s ease-in-out infinite; }
      .tiny-step-marker-core { fill: #fff2bd; }
      .tiny-step-particle { fill: var(--accent); opacity: 0; transform-origin: center; }
      .tiny-step-arena.is-complete .tiny-step-particle { animation: tiny-step-burst .8s ease-out both; }
      .tiny-step-arena.is-complete .tiny-step-particle:nth-child(2n) { animation-delay: .08s; }
      .tiny-step-arena.is-complete .tiny-step-particle:nth-child(3n) { animation-delay: .16s; }
      .tiny-step-scrubber { display: grid; gap: 7px; margin-top: -8px; }
      .tiny-step-scrubber label { color: rgba(255,255,255,.72); font-size: .78rem; font-weight: 800; }
      .tiny-step-scrubber input { width: 100%; accent-color: var(--accent); touch-action: pan-x; }
      .tiny-step-labels { display: flex; justify-content: space-between; color: rgba(255,255,255,.62); font-size: .68rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
      .tiny-step-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .tiny-step-card { min-height: 132px; border: 1px solid var(--line); border-radius: 18px; padding: 15px; display: grid; align-content: start; gap: 8px; background: white; text-align: left; cursor: pointer; transition: transform .18s ease, border-color .18s ease, background .18s ease; }
      .tiny-step-card:hover { transform: translateY(-2px); border-color: var(--ink); }
      .tiny-step-card:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
      .tiny-step-card[aria-current="step"] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
      .tiny-step-card.is-complete { background: var(--mint); }
      .tiny-step-card-kicker { color: var(--accent-dark); font-size: .66rem; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; }
      .tiny-step-card strong { font-size: 1rem; line-height: 1.35; letter-spacing: -.015em; }
      .tiny-step-result { min-height: 96px; padding: 18px 20px; }
      .tiny-step-result strong { font-size: clamp(1.15rem, 3vw, 1.65rem); }
      @keyframes tiny-step-drift { to { stroke-dashoffset: -52; } }
      @keyframes tiny-step-pulse { 50% { opacity: .45; transform: scale(.82); } }
      @keyframes tiny-step-burst { 0% { opacity: 0; transform: scale(.3); } 30% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--burst-x), var(--burst-y)) scale(1.4); } }
      @media (max-width: 680px) {
        .tiny-step-controls { grid-template-columns: 1fr; }
        .tiny-step-cards { grid-template-columns: 1fr; }
        .tiny-step-card { min-height: 0; }
        .tiny-step-intro { align-items: start; flex-direction: column; gap: 5px; }
        .tiny-step-map { min-height: 180px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .tiny-step-path, .tiny-step-marker-ring, .tiny-step-particle { animation: none; }
      }
    `;
    document.head.append(styles);
  }

  renderMicroStep = function renderMicroStepEnhanced(app) {
    installStyles();

    const root = panel('');
    root.classList.add('tiny-step-game');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let plan = [];
    let selectedIndex = 0;
    let completed = new Set();
    let planCount = 0;
    let lastPlanKey = '';
    let soundEnabled = false;
    let audioContext;

    const intro = document.createElement('div');
    intro.className = 'tiny-step-intro';
    const introText = document.createElement('p');
    introText.textContent = app.config.instructions;
    const status = document.createElement('span');
    status.className = 'tiny-step-status';
    status.textContent = 'Trail not built';
    intro.append(introText, status);

    const controls = document.createElement('div');
    controls.className = 'tiny-step-controls';

    const goalField = document.createElement('div');
    goalField.className = 'field';
    const goalLabel = document.createElement('label');
    goalLabel.htmlFor = 'tiny-step-goal';
    goalLabel.textContent = 'What are you trying to move forward?';
    const goalInput = document.createElement('input');
    goalInput.id = 'tiny-step-goal';
    goalInput.maxLength = 180;
    goalInput.placeholder = 'Organize the garage';
    goalField.append(goalLabel, goalInput);

    const energyField = document.createElement('div');
    energyField.className = 'tiny-step-energy';
    const energyHead = document.createElement('div');
    energyHead.className = 'tiny-step-energy-head';
    const energyLabel = document.createElement('label');
    energyLabel.htmlFor = 'tiny-step-energy';
    energyLabel.textContent = 'Energy right now';
    const energyOutput = document.createElement('output');
    energyOutput.htmlFor = 'tiny-step-energy';
    energyOutput.textContent = '3 / 5';
    energyHead.append(energyLabel, energyOutput);
    const energyInput = document.createElement('input');
    energyInput.id = 'tiny-step-energy';
    energyInput.type = 'range';
    energyInput.min = '1';
    energyInput.max = '5';
    energyInput.value = '3';
    energyInput.addEventListener('input', () => {
      energyOutput.textContent = `${energyInput.value} / 5`;
    });
    energyField.append(energyHead, energyInput);
    controls.append(goalField, energyField);

    const arena = document.createElement('div');
    arena.className = 'tiny-step-arena';
    arena.innerHTML = `
      <svg class="tiny-step-map" viewBox="0 0 400 180" aria-hidden="true" focusable="false">
        <path class="tiny-step-path" d="M70 122 C126 122 145 70 200 70 S274 122 330 122"></path>
        <circle class="tiny-step-stone" data-index="0" cx="70" cy="122" r="28"></circle>
        <text class="tiny-step-number" x="70" y="122">1</text>
        <circle class="tiny-step-stone" data-index="1" cx="200" cy="70" r="28"></circle>
        <text class="tiny-step-number" x="200" y="70">2</text>
        <circle class="tiny-step-stone" data-index="2" cx="330" cy="122" r="28"></circle>
        <text class="tiny-step-number" x="330" y="122">3</text>
        <g class="tiny-step-marker" style="transform:translate(70px,122px)">
          <circle class="tiny-step-marker-ring" cx="0" cy="0" r="18"></circle>
          <circle class="tiny-step-marker-core" cx="0" cy="0" r="7"></circle>
        </g>
        <g class="tiny-step-burst" aria-hidden="true">
          <circle class="tiny-step-particle" style="--burst-x:-28px;--burst-y:-42px" cx="330" cy="122" r="4"></circle>
          <circle class="tiny-step-particle" style="--burst-x:24px;--burst-y:-48px" cx="330" cy="122" r="3"></circle>
          <circle class="tiny-step-particle" style="--burst-x:44px;--burst-y:-12px" cx="330" cy="122" r="4"></circle>
          <circle class="tiny-step-particle" style="--burst-x:-42px;--burst-y:8px" cx="330" cy="122" r="3"></circle>
          <circle class="tiny-step-particle" style="--burst-x:12px;--burst-y:34px" cx="330" cy="122" r="3.5"></circle>
        </g>
      </svg>
    `;

    const scrubber = document.createElement('div');
    scrubber.className = 'tiny-step-scrubber';
    const scrubberLabel = document.createElement('label');
    scrubberLabel.htmlFor = 'tiny-step-scrubber';
    scrubberLabel.textContent = 'Build a trail, then drag the marker or use the arrow keys to inspect each step.';
    const scrubberInput = document.createElement('input');
    scrubberInput.id = 'tiny-step-scrubber';
    scrubberInput.type = 'range';
    scrubberInput.min = '0';
    scrubberInput.max = '2';
    scrubberInput.value = '0';
    scrubberInput.disabled = true;
    scrubberInput.setAttribute('aria-label', 'Select a step on the trail');
    scrubberInput.addEventListener('input', () => selectStep(Number(scrubberInput.value), true));
    const scrubberLabels = document.createElement('div');
    scrubberLabels.className = 'tiny-step-labels';
    scrubberLabels.innerHTML = '<span>Prepare</span><span>Move</span><span>Close</span>';
    scrubber.append(scrubberLabel, scrubberInput, scrubberLabels);
    arena.append(scrubber);

    const cards = document.createElement('div');
    cards.className = 'tiny-step-cards';
    cards.setAttribute('aria-label', 'Your three-step trail');

    const result = resultCard();
    result.classList.add('tiny-step-result');
    result.innerHTML = '<strong>Build a trail from your goal.</strong><small>You will get three small actions matched to your available energy.</small>';

    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const buildButton = makeButton('Build my trail', buildTrail);
    const completeButton = makeButton('Complete selected step', completeSelected, true);
    completeButton.disabled = true;
    const soundButton = makeButton('Sound off', toggleSound, true);
    soundButton.setAttribute('aria-pressed', 'false');
    actions.append(buildButton, completeButton, soundButton);

    root.append(intro, controls, arena, cards, result, actions);

    goalInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      buildTrail();
    });

    function buildTrail() {
      const goal = goalInput.value.trim();
      if (!goal) {
        result.innerHTML = '<strong>Enter a goal first.</strong><small>Name one thing you want to move forward.</small>';
        goalInput.focus();
        return;
      }

      const energy = Number(energyInput.value);
      plan = makePlan(goal, energy);
      selectedIndex = 0;
      completed = new Set();
      planCount += 1;
      scrubberInput.disabled = false;
      completeButton.disabled = false;
      arena.classList.remove('is-complete');
      buildButton.textContent = 'Rebuild trail';
      renderCards();
      selectStep(0, false);
      status.textContent = `Trail ${planCount} · 0 of 3 complete`;
      result.innerHTML = '<strong>Your trail is ready.</strong><small>Drag the marker, choose a card, then complete the steps in any order.</small>';
      playTone('build');
    }

    function makePlan(goal, energy) {
      const level = energy <= 2 ? 'low' : energy === 3 ? 'medium' : 'high';
      const templates = {
        low: [
          [
            `Put one thing you need for “${goal}” within reach.`,
            'Work on the easiest visible part for two minutes.',
            'Leave one clear clue that makes the next session easier.'
          ],
          [
            `Open the place where “${goal}” will happen.`,
            'Do one action small enough that stopping afterward is allowed.',
            'Write down the next action before you walk away.'
          ],
          [
            `Remove one tiny obstacle blocking “${goal}”.`,
            'Make a two-minute version that still counts.',
            'Reset the space so restarting takes less effort.'
          ]
        ],
        medium: [
          [
            `Write what “done enough” means for this session of “${goal}”.`,
            'Spend ten focused minutes on the easiest complete slice.',
            'Name what changed and choose the next visible action.'
          ],
          [
            `Choose one concrete outcome for “${goal}”.`,
            'Finish the first useful piece before switching tasks.',
            'Capture one note that preserves your momentum.'
          ],
          [
            `Gather only what the next part of “${goal}” requires.`,
            'Remove one blocker, then work for ten uninterrupted minutes.',
            'Stop at a clean edge and record where to resume.'
          ]
        ],
        high: [
          [
            `Choose the highest-impact slice of “${goal}” and remove one blocker.`,
            'Work for twenty focused minutes without changing tasks.',
            'Finish or hand off one complete result and record what follows.'
          ],
          [
            `Define the strongest useful outcome you can reach for “${goal}” today.`,
            'Take the hardest meaningful action while your energy is available.',
            'Close the loop with a visible result and a written next move.'
          ],
          [
            `Clear distractions and prepare the exact tools for “${goal}”.`,
            'Complete one substantial slice before checking anything else.',
            'Review the result, tidy the workspace, and choose tomorrow’s start.'
          ]
        ]
      };

      const choices = templates[level];
      let index = Math.floor(Math.random() * choices.length);
      let key = `${level}-${index}-${goal}`;
      if (choices.length > 1 && key === lastPlanKey) {
        index = (index + 1) % choices.length;
        key = `${level}-${index}-${goal}`;
      }
      lastPlanKey = key;
      return choices[index].map((text, indexValue) => ({
        label: ['Prepare', 'Move', 'Close'][indexValue],
        text
      }));
    }

    function renderCards() {
      cards.replaceChildren();
      plan.forEach((step, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tiny-step-card';
        button.dataset.index = String(index);
        button.innerHTML = '<span class="tiny-step-card-kicker"></span><strong></strong>';
        button.querySelector('.tiny-step-card-kicker').textContent = `Step ${index + 1} · ${step.label}`;
        button.querySelector('strong').textContent = step.text;
        button.addEventListener('click', () => selectStep(index, true));
        cards.append(button);
      });
      syncView();
    }

    function selectStep(index, announce) {
      if (!plan.length) return;
      selectedIndex = Math.max(0, Math.min(plan.length - 1, index));
      scrubberInput.value = String(selectedIndex);
      syncView();
      if (announce) {
        result.innerHTML = `<strong>${plan[selectedIndex].label}</strong><small>${escapeHtml(plan[selectedIndex].text)}</small>`;
        playTone('select');
      }
    }

    function completeSelected() {
      if (!plan.length) return;
      const wasComplete = completed.has(selectedIndex);
      if (wasComplete) completed.delete(selectedIndex);
      else completed.add(selectedIndex);

      const allComplete = completed.size === plan.length;
      arena.classList.toggle('is-complete', allComplete);
      status.textContent = allComplete
        ? `Trail ${planCount} complete`
        : `Trail ${planCount} · ${completed.size} of 3 complete`;
      syncView();

      if (allComplete) {
        result.innerHTML = '<strong>Trail complete.</strong><small>You moved the goal forward three times. Rebuild the trail when you want another route.</small>';
        playTone('finish');
        return;
      }

      result.innerHTML = wasComplete
        ? `<strong>${plan[selectedIndex].label} reopened.</strong><small>${escapeHtml(plan[selectedIndex].text)}</small>`
        : `<strong>${plan[selectedIndex].label} complete.</strong><small>${escapeHtml(plan[selectedIndex].text)}</small>`;
      playTone(wasComplete ? 'select' : 'complete');

      if (!wasComplete) {
        const nextOpen = plan.findIndex((_, index) => !completed.has(index));
        if (nextOpen >= 0) window.setTimeout(() => selectStep(nextOpen, false), reducedMotion ? 0 : 220);
      }
    }

    function syncView() {
      const positions = [[70, 122], [200, 70], [330, 122]];
      const marker = arena.querySelector('.tiny-step-marker');
      const [x, y] = positions[selectedIndex];
      marker.style.transform = `translate(${x}px, ${y}px)`;

      arena.querySelectorAll('.tiny-step-stone').forEach((stone, index) => {
        stone.classList.toggle('is-complete', completed.has(index));
      });

      [...cards.children].forEach((card, index) => {
        const selected = index === selectedIndex;
        const isComplete = completed.has(index);
        card.classList.toggle('is-complete', isComplete);
        if (selected) card.setAttribute('aria-current', 'step');
        else card.removeAttribute('aria-current');
        card.setAttribute('aria-label', `${isComplete ? 'Completed' : 'Incomplete'} step ${index + 1}: ${plan[index].text}`);
      });

      if (plan.length) {
        scrubberInput.setAttribute('aria-valuetext', `Step ${selectedIndex + 1} of 3, ${plan[selectedIndex].label}`);
        completeButton.textContent = completed.has(selectedIndex) ? 'Undo selected step' : 'Complete selected step';
      }
    }

    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) {
        result.innerHTML = '<strong>Sound is not available here.</strong><small>The trail still works without audio.</small>';
        return;
      }
      soundEnabled = !soundEnabled;
      soundButton.textContent = soundEnabled ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(soundEnabled));
      if (soundEnabled) {
        audioContext ||= new AudioEngine();
        audioContext.resume();
        playTone('select');
      }
    }

    function playTone(kind) {
      if (!soundEnabled || !audioContext) return;
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const frequencies = { select: 360, build: 460, complete: 620, finish: 820 };
      oscillator.type = kind === 'finish' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequencies[kind] || 440, now);
      if (kind === 'finish') oscillator.frequency.exponentialRampToValueAtTime(1120, now + 0.2);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.075, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.25);
    }
  };
})();
