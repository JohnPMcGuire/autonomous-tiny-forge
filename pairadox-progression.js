(() => {
  const baseRenderer = window.renderChoiceMixer;
  if (typeof baseRenderer !== 'function') return;
  const VERSION = '1.4.0';
  const stages = [
    ['Spark', 'Make the pair useful in one clear action.', 12],
    ['Twist', 'Make the second ingredient become the obstacle.', 16],
    ['Tradeoff', 'Name what gets easier, what gets riskier, and who notices first.', 20],
    ['Recovery', 'Design one harmless failure and a comeback path.', 24],
    ['Boss mix', 'Include a score, a resource, a pressure, and one unlock.', 36]
  ];
  const wildcards = [
    'Add a one-finger version.',
    'Give each ingredient a different win condition.',
    'Make round two harder without adding text.',
    'Let the player recover from one bad choice.',
    'Turn the result into a tiny co-op rule.'
  ];

  function styles() {
    if (document.querySelector('#pairadox-progression-styles')) return;
    const style = document.createElement('style');
    style.id = 'pairadox-progression-styles';
    style.textContent = `
      .pairadox-progress { display:grid; gap:10px; }
      .pairadox-progress-hud { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
      .pairadox-progress-hud div,.pairadox-run { border:1px solid var(--line); border-radius:16px; background:white; padding:10px 12px; }
      .pairadox-progress-hud span,.pairadox-run span { display:block; color:var(--muted); font-size:.62rem; font-weight:900; letter-spacing:.09em; text-transform:uppercase; }
      .pairadox-progress-hud strong { display:block; margin-top:4px; }
      .pairadox-ladder { display:grid; grid-template-columns:repeat(5,1fr); gap:6px; }
      .pairadox-ladder b { border:1px solid var(--line); border-radius:999px; padding:7px 8px; background:rgba(255,255,255,.72); text-align:center; font-size:.72rem; }
      .pairadox-ladder b.is-current { background:#fff2bd; border-color:var(--accent); }
      .pairadox-ladder b.is-done { background:var(--mint); }
      .pairadox-run { display:grid; gap:7px; animation:pairadox-run-in .22s ease both; }
      .pairadox-run h4 { margin:0; font-size:1rem; }
      .pairadox-run p { margin:0; line-height:1.4; }
      @keyframes pairadox-run-in { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:none; } }
      @media (max-width:620px){ .pairadox-progress-hud{grid-template-columns:repeat(2,1fr)} .pairadox-ladder{grid-template-columns:1fr} }
      @media (prefers-reduced-motion:reduce){ .pairadox-run{animation:none} }
    `;
    document.head.append(style);
  }

  function updateCard() {
    const card = [...document.querySelectorAll('.app-card')].find((item) => item.querySelector('.app-name')?.textContent === 'Pairadox');
    if (!card) return false;
    card.querySelector('.app-meta').textContent = `Play · v${VERSION}`;
    card.querySelector('.app-summary').textContent = 'Mix two ingredients into challenges, stories, or a session ladder with scoring and recovery.';
    return true;
  }
  const cardObserver = new MutationObserver(() => { if (updateCard()) cardObserver.disconnect(); });
  if (!updateCard()) {
    const grid = document.querySelector('#app-grid');
    if (grid) cardObserver.observe(grid, { childList: true, subtree: true });
  }

  window.renderChoiceMixer = function renderChoiceMixerWithProgression(app) {
    baseRenderer(app);
    styles();
    const root = document.querySelector('#app-stage .pairadox-game');
    const result = root?.querySelector('.pairadox-result');
    const actions = root?.querySelector('.tool-actions');
    const slots = [...(root?.querySelectorAll('.pairadox-slot-value') || [])];
    const description = document.querySelector('#dialog-description');
    if (description) description.textContent = 'A tactile idea game with challenge, story, and progression modes. Build a session ladder with scoring, wildcards, recovery, drag, touch, keyboard, motion, and optional local sound.';
    if (!root || !result || !actions || slots.length !== 2) return;

    let level = 0;
    let score = 0;
    let streak = 0;
    let bank = 1;
    let mutation = 0;
    let busy = false;
    let disposed = false;

    const panel = document.createElement('section');
    panel.className = 'pairadox-progress';
    panel.setAttribute('aria-label', 'Pairadox progression ladder');
    panel.innerHTML = '<div class="pairadox-progress-hud"><div><span>Stage</span><strong id="px-stage">Spark</strong></div><div><span>Sparks</span><strong id="px-score">0</strong></div><div><span>Streak</span><strong id="px-streak">0</strong></div><div><span>Wildcards</span><strong id="px-bank">1</strong></div></div><div class="pairadox-ladder" aria-label="Session ladder"></div>';
    result.after(panel);

    const complete = makeButton('Complete stage', () => finish(true));
    const recover = makeButton('Recovery cut', () => finish(false), true);
    const spend = makeButton('Spend wildcard', useWildcard, true);
    actions.append(complete, recover, spend);

    const observer = new MutationObserver(() => {
      if (busy || disposed) return;
      const pair = pairValues();
      if (!pair) return setButtons(false);
      if (!result.querySelector('.pairadox-run')) requestAnimationFrame(() => runCard(pair));
    });
    observer.observe(result, { childList: true, subtree: true });
    document.querySelector('#app-dialog')?.addEventListener('close', () => { disposed = true; observer.disconnect(); }, { once: true });
    draw();
    setButtons(false);

    function pairValues() {
      const values = slots.map((slot) => slot.textContent.trim());
      return values.every((value) => value && value !== 'Drop here') ? values : null;
    }
    function runCard(pair) {
      if (disposed) return;
      const stage = stages[level];
      busy = true;
      const card = document.createElement('section');
      card.className = 'pairadox-run';
      card.innerHTML = `<h4>${stage[0]} ladder: ${pair[0]} × ${pair[1]}</h4><p><span>Goal</span>${stage[1]}</p><p><span>Mutation</span>${wildcards[mutation % wildcards.length]}</p><p><span>Reward</span>${stage[2]} sparks for completion, ${Math.max(6, Math.floor(stage[2] / 2))} for recovery.</p>`;
      result.append(card);
      setButtons(true);
      busy = false;
    }
    function finish(won) {
      const stage = stages[level];
      score += won ? stage[2] + streak * 3 : Math.max(6, Math.floor(stage[2] / 2));
      streak = won ? streak + 1 : 0;
      if (won && streak % 2 === 0) bank += 1;
      level = Math.min(level + (won ? 1 : 0), stages.length - 1);
      mutation += won ? 1 : 2;
      status(won ? 'Stage complete.' : 'Recovery cut accepted.', won ? 'The next mix adds a harder constraint.' : 'The run survives, but the streak resets.');
    }
    function useWildcard() {
      if (bank < 1) return;
      bank -= 1;
      mutation += 1;
      const pair = pairValues();
      result.querySelector('.pairadox-run')?.remove();
      if (pair) runCard(pair);
      draw();
    }
    function status(headline, detail) {
      busy = true;
      result.replaceChildren();
      const strong = document.createElement('strong');
      const small = document.createElement('small');
      strong.textContent = headline;
      small.textContent = detail;
      result.append(strong, small);
      setButtons(false);
      draw();
      busy = false;
    }
    function setButtons(enabled) {
      complete.disabled = !enabled;
      recover.disabled = !enabled;
      spend.disabled = !enabled || bank < 1;
    }
    function draw() {
      panel.querySelector('#px-stage').textContent = stages[level][0];
      panel.querySelector('#px-score').textContent = String(score);
      panel.querySelector('#px-streak').textContent = String(streak);
      panel.querySelector('#px-bank').textContent = String(bank);
      const ladder = panel.querySelector('.pairadox-ladder');
      ladder.replaceChildren();
      stages.forEach((stage, index) => {
        const step = document.createElement('b');
        step.className = index < level ? 'is-done' : index === level ? 'is-current' : '';
        step.textContent = `${index + 1}. ${stage[0]}`;
        ladder.append(step);
      });
    }
  };
})();
