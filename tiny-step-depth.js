(() => {
  const styleId = 'tiny-step-depth-styles';
  const modes = {
    reset: { label: 'Reset', note: 'low energy or messy starts', templates: [
      ['Clear one tiny landing zone for “{goal}”.', 'Do the smallest visible piece for four minutes.', 'Rename the obstacle so it is less fuzzy.', 'Leave a restart cue where you will see it.'],
      ['Open the place where “{goal}” will happen.', 'Make one imperfect first pass.', 'Write the next action as a verb.', 'Close with one thing already prepared.']
    ] },
    focus: { label: 'Focus', note: 'a protected short work block', templates: [
      ['Define what “done enough” means for this pass of “{goal}”.', 'Work one uninterrupted ten-minute slice.', 'Handle the most likely interruption before it handles you.', 'Capture the result, next edge, and owner.'],
      ['Pick one outcome that would make “{goal}” meaningfully better today.', 'Finish the first usable slice before switching tasks.', 'Repair one weak spot that would make restarting harder.', 'Stop at a clean edge and mark the next move.']
    ] },
    stretch: { label: 'Stretch', note: 'high energy without overreach', templates: [
      ['Choose the highest-leverage slice of “{goal}” and name the tradeoff.', 'Run a twenty-minute sprint with one allowed checkpoint.', 'Cut one nonessential part before fatigue sets in.', 'Ship, hand off, or archive one visible result.'],
      ['Set a finish line for “{goal}” that avoids perfection drift.', 'Take the hardest meaningful action first.', 'Recover by reducing scope instead of extending time.', 'Write the follow-up that prevents the work from reopening.']
    ] }
  };
  const obstacles = [
    { id: 'fog', label: 'Unclear next step', nudge: 'Make the next action physical, visible, and under ten minutes.' },
    { id: 'noise', label: 'Interruptions', nudge: 'Add a boundary, timer, or “back in ten” note before starting.' },
    { id: 'drag', label: 'Low energy', nudge: 'Shrink the action until stopping afterward still counts as progress.' },
    { id: 'sprawl', label: 'Too many paths', nudge: 'Choose one path and park the others in a later list.' }
  ];
  const labels = ['Prepare', 'Move', 'Recover', 'Lock in'];

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .tiny-step-depth { max-width: 880px; gap: 16px; }
      .step-depth-top { display: grid; grid-template-columns: minmax(0,1fr) 180px; gap: 12px; align-items: end; }
      .step-depth-controls { display: grid; grid-template-columns: minmax(0,1fr) minmax(180px,.48fr); gap: 12px; }
      .step-depth-modes, .step-depth-obstacles { display: flex; flex-wrap: wrap; gap: 8px; }
      .step-depth-chip { border: 1px solid var(--line); border-radius: 999px; padding: 9px 11px; background: white; color: var(--ink); font-weight: 850; cursor: pointer; }
      .step-depth-chip[aria-pressed="true"] { border-color: var(--accent); background: var(--mint); }
      .step-depth-energy { border: 1px solid var(--line); border-radius: 18px; padding: 13px; background: white; }
      .step-depth-energy label { display: flex; justify-content: space-between; gap: 10px; color: var(--muted); font-size: .72rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
      .step-depth-energy input { width: 100%; accent-color: var(--accent); }
      .step-depth-board { overflow: hidden; border-radius: 28px; padding: 18px; color: white; background: radial-gradient(circle at 12% 8%, rgba(255,111,74,.28), transparent 26%), radial-gradient(circle at 86% 84%, rgba(191,231,209,.22), transparent 30%), #07110d; box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); }
      .step-depth-map { width: 100%; min-height: 220px; display: block; overflow: visible; }
      .step-depth-line { fill: none; stroke: rgba(191,231,209,.24); stroke-width: 9; stroke-linecap: round; stroke-dasharray: 12 16; animation: step-depth-drift 9s linear infinite; }
      .step-depth-node { fill: #153a2e; stroke: rgba(255,255,255,.24); stroke-width: 3; }
      .step-depth-node.is-done { fill: var(--accent); stroke: #fff2bd; }
      .step-depth-node.is-current { stroke: #fff2bd; stroke-width: 5; }
      .step-depth-num { fill: white; font-size: 17px; font-weight: 900; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
      .step-depth-marker { transition: transform .42s cubic-bezier(.2,.85,.2,1); filter: drop-shadow(0 9px 13px rgba(0,0,0,.34)); }
      .step-depth-ring { fill: rgba(255,242,189,.18); stroke: #fff2bd; stroke-width: 2; animation: step-depth-pulse 1.7s ease-in-out infinite; }
      .step-depth-core { fill: #fff2bd; }
      .step-depth-hud { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
      .step-depth-stat { border: 1px solid rgba(255,255,255,.14); border-radius: 15px; padding: 10px; background: rgba(255,255,255,.07); }
      .step-depth-stat span { display: block; color: rgba(255,255,255,.64); font-size: .62rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
      .step-depth-stat strong { display: block; margin-top: 3px; }
      .step-depth-scrub { width: 100%; margin-top: 12px; accent-color: var(--accent); }
      .step-depth-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; }
      .step-depth-card { min-height: 142px; border: 1px solid var(--line); border-radius: 18px; padding: 14px; display: grid; align-content: start; gap: 8px; background: white; text-align: left; cursor: pointer; }
      .step-depth-card[aria-current="step"] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
      .step-depth-card.is-done { background: var(--mint); }
      .step-depth-card small { color: var(--accent-dark); font-size: .64rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
      .step-depth-card strong { font-size: .96rem; line-height: 1.32; }
      .step-depth-card span { color: var(--muted); font-size: .82rem; }
      .step-depth-result { min-height: 104px; padding: 18px 20px; }
      .step-depth-result strong { font-size: clamp(1.15rem, 3vw, 1.6rem); }
      @keyframes step-depth-drift { to { stroke-dashoffset: -56; } }
      @keyframes step-depth-pulse { 50% { opacity: .5; transform: scale(.84); } }
      @media (max-width: 760px) { .step-depth-top, .step-depth-controls, .step-depth-cards { grid-template-columns: 1fr; } .step-depth-hud { grid-template-columns: repeat(2, 1fr); } .step-depth-map { min-height: 190px; } }
      @media (prefers-reduced-motion: reduce) { .step-depth-line, .step-depth-ring { animation: none; } .step-depth-marker { transition: none; } }
    `;
    document.head.append(styles);
  }

  renderMicroStep = function renderMicroStepDepth() {
    installStyles();
    const root = panel('');
    root.classList.add('tiny-step-depth');
    let modeId = 'focus';
    let obstacleId = 'fog';
    let selected = 0;
    let steps = [];
    let done = new Set();
    let runCount = 0;
    let best = 0;

    const top = document.createElement('div');
    top.className = 'step-depth-top';
    const goalField = document.createElement('div');
    goalField.className = 'field';
    goalField.innerHTML = '<label for="step-depth-goal">Goal to move forward</label>';
    const goalInput = document.createElement('input');
    goalInput.id = 'step-depth-goal';
    goalInput.maxLength = 180;
    goalInput.placeholder = 'Prepare the backlog review';
    goalField.append(goalInput);
    const energy = document.createElement('div');
    energy.className = 'step-depth-energy';
    energy.innerHTML = '<label for="step-depth-energy"><span>Energy</span><output>3 / 5</output></label><input id="step-depth-energy" type="range" min="1" max="5" value="3">';
    const energyInput = energy.querySelector('input');
    const energyOutput = energy.querySelector('output');
    energyInput.addEventListener('input', () => energyOutput.textContent = `${energyInput.value} / 5`);
    top.append(goalField, energy);

    const controls = document.createElement('div');
    controls.className = 'step-depth-controls';
    const modeWrap = chipGroup('Plan mode', modes, 'mode');
    const obstacleWrap = chipGroup('Likely obstacle', Object.fromEntries(obstacles.map((item) => [item.id, item])), 'obstacle');
    controls.append(modeWrap, obstacleWrap);

    const board = document.createElement('div');
    board.className = 'step-depth-board';
    board.tabIndex = 0;
    board.innerHTML = `
      <svg class="step-depth-map" viewBox="0 0 520 210" aria-hidden="true" focusable="false">
        <path class="step-depth-line" d="M58 150 C120 74 174 112 230 88 S338 62 384 126 S446 180 474 88"></path>
        ${[58,198,338,474].map((x, index) => `<circle class="step-depth-node" data-node="${index}" cx="${x}" cy="${[150,88,126,88][index]}" r="27"></circle><text class="step-depth-num" x="${x}" y="${[150,88,126,88][index]}">${index + 1}</text>`).join('')}
        <g class="step-depth-marker" style="transform:translate(58px,150px)"><circle class="step-depth-ring" cx="0" cy="0" r="18"></circle><circle class="step-depth-core" cx="0" cy="0" r="7"></circle></g>
      </svg>
      <div class="step-depth-hud"><div class="step-depth-stat"><span>Mode</span><strong id="step-depth-mode">Focus</strong></div><div class="step-depth-stat"><span>Momentum</span><strong id="step-depth-momentum">0%</strong></div><div class="step-depth-stat"><span>Done</span><strong id="step-depth-done">0 / 4</strong></div><div class="step-depth-stat"><span>Best</span><strong id="step-depth-best">0%</strong></div></div>
      <input class="step-depth-scrub" type="range" min="0" max="3" value="0" disabled aria-label="Select a step">
    `;
    const scrub = board.querySelector('.step-depth-scrub');
    const cards = document.createElement('div');
    cards.className = 'step-depth-cards';
    const result = resultCard();
    result.classList.add('step-depth-result');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    const build = makeButton('Build trail', buildTrail);
    const complete = makeButton('Complete selected', completeStep, true);
    const recover = makeButton('Use recovery step', recoverStep, true);
    complete.disabled = true;
    recover.disabled = true;
    actions.append(build, complete, recover);
    root.append(top, controls, board, cards, result, actions);

    goalInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); buildTrail(); } });
    scrub.addEventListener('input', () => selectStep(Number(scrub.value), true));
    board.addEventListener('keydown', (event) => {
      const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!move || !steps.length) return;
      event.preventDefault();
      selectStep(selected + move, true);
    });

    function chipGroup(title, source, type) {
      const wrap = document.createElement('div');
      wrap.innerHTML = `<p class="eyebrow">${title}</p>`;
      const list = document.createElement('div');
      list.className = type === 'mode' ? 'step-depth-modes' : 'step-depth-obstacles';
      Object.entries(source).forEach(([id, item]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'step-depth-chip';
        button.dataset.kind = type;
        button.dataset.id = id;
        button.textContent = item.label;
        button.addEventListener('click', () => {
          if (type === 'mode') modeId = id;
          else obstacleId = id;
          syncChips();
          preview();
        });
        list.append(button);
      });
      wrap.append(list);
      return wrap;
    }

    function syncChips() {
      root.querySelectorAll('.step-depth-chip').forEach((button) => {
        const pressed = button.dataset.kind === 'mode' ? button.dataset.id === modeId : button.dataset.id === obstacleId;
        button.setAttribute('aria-pressed', String(pressed));
      });
    }

    function currentObstacle() { return obstacles.find((item) => item.id === obstacleId) || obstacles[0]; }
    function escape(value) { return typeof escapeHtml === 'function' ? escapeHtml(value) : String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }

    function preview() {
      if (steps.length) return;
      result.innerHTML = `<strong>${modes[modeId].label} mode.</strong><small>Built for ${modes[modeId].note}. Guardrail: ${escape(currentObstacle().nudge)}</small>`;
      updateHud();
    }

    function buildTrail() {
      const goal = goalInput.value.trim();
      if (!goal) {
        result.innerHTML = '<strong>Enter a goal first.</strong><small>Name one thing you want to move forward.</small>';
        goalInput.focus();
        return;
      }
      const energy = Number(energyInput.value);
      const mode = modes[modeId];
      const deck = mode.templates[(runCount + energy + obstacleId.length) % mode.templates.length];
      const obstacle = currentObstacle();
      steps = deck.map((text, index) => ({
        label: labels[index],
        text: text.replace('{goal}', goal),
        effort: Math.max(1, Math.min(5, energy + index - (modeId === 'reset' ? 2 : modeId === 'stretch' ? 0 : 1))),
        recovery: index === 2 ? obstacle.nudge : ''
      }));
      runCount += 1;
      selected = 0;
      done = new Set();
      scrub.disabled = false;
      complete.disabled = false;
      recover.disabled = false;
      build.textContent = 'Rebuild trail';
      renderCards();
      selectStep(0, false);
      result.innerHTML = `<strong>${mode.label} trail ${runCount} is ready.</strong><small>Four linked steps now include effort, recovery, momentum, and a follow-up unlock.</small>`;
    }

    function renderCards() {
      cards.replaceChildren();
      steps.forEach((step, index) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'step-depth-card';
        card.innerHTML = '<small></small><strong></strong><span></span>';
        card.querySelector('small').textContent = `Step ${index + 1} · ${step.label}`;
        card.querySelector('strong').textContent = step.text;
        card.querySelector('span').textContent = `Effort ${step.effort}/5${step.recovery ? ' · recovery guardrail' : ''}`;
        card.addEventListener('click', () => selectStep(index, true));
        cards.append(card);
      });
      syncView();
    }

    function selectStep(index, announce) {
      if (!steps.length) return;
      selected = Math.max(0, Math.min(steps.length - 1, index));
      scrub.value = String(selected);
      syncView();
      if (announce) {
        const step = steps[selected];
        result.innerHTML = `<strong>${escape(step.label)}.</strong><small>${escape(step.text)}${step.recovery ? ` Recovery: ${escape(step.recovery)}` : ''}</small>`;
      }
    }

    function completeStep() {
      if (!steps.length) return;
      if (done.has(selected)) done.delete(selected);
      else done.add(selected);
      best = Math.max(best, momentum());
      syncView();
      if (done.size === steps.length) {
        result.innerHTML = `<strong>Trail complete with ${momentum()}% momentum.</strong><small>Unlock: repeat the smallest useful step tomorrow before opening anything else.</small>`;
      } else {
        const was = done.has(selected) ? 'complete' : 'reopened';
        result.innerHTML = `<strong>${steps[selected].label} ${was}.</strong><small>${done.size} of ${steps.length} steps are complete.</small>`;
        const next = steps.findIndex((_, index) => !done.has(index));
        if (next >= 0) selectStep(next, false);
      }
    }

    function recoverStep() {
      if (!steps.length) return;
      const step = steps[selected];
      const nudge = currentObstacle().nudge;
      if (!step.text.includes('Recovery cut:')) step.text = `${step.text} Recovery cut: ${nudge}`;
      step.effort = Math.max(1, step.effort - 1);
      renderCards();
      selectStep(selected, false);
      result.innerHTML = `<strong>Recovery applied.</strong><small>${escape(nudge)}</small>`;
    }

    function momentum() {
      if (!steps.length) return 0;
      const effort = steps.reduce((sum, step, index) => sum + (done.has(index) ? Math.max(1, 6 - step.effort) : 0), 0);
      return Math.min(100, Math.round((done.size / steps.length) * 72 + effort * 4));
    }

    function updateHud() {
      board.querySelector('#step-depth-mode').textContent = modes[modeId].label;
      board.querySelector('#step-depth-momentum').textContent = `${momentum()}%`;
      board.querySelector('#step-depth-done').textContent = `${done.size} / ${steps.length || 4}`;
      board.querySelector('#step-depth-best').textContent = `${best}%`;
    }

    function syncView() {
      const positions = [[58,150], [198,88], [338,126], [474,88]];
      const [x, y] = positions[selected];
      board.querySelector('.step-depth-marker').style.transform = `translate(${x}px,${y}px)`;
      board.querySelectorAll('.step-depth-node').forEach((node, index) => {
        node.classList.toggle('is-done', done.has(index));
        node.classList.toggle('is-current', index === selected);
      });
      [...cards.children].forEach((card, index) => {
        card.classList.toggle('is-done', done.has(index));
        if (index === selected) card.setAttribute('aria-current', 'step');
        else card.removeAttribute('aria-current');
        card.setAttribute('aria-label', `${done.has(index) ? 'Completed' : 'Incomplete'} ${steps[index]?.label || 'step'}: ${steps[index]?.text || ''}`);
      });
      scrub.setAttribute('aria-valuetext', steps[selected] ? `Step ${selected + 1}, ${steps[selected].label}` : 'No trail built');
      complete.textContent = done.has(selected) ? 'Undo selected' : 'Complete selected';
      updateHud();
    }

    syncChips();
    preview();
  };
})();
