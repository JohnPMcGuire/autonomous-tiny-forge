(() => {
  const APP = {
    name: 'Clue Current',
    emoji: '🕵️',
    category: 'play',
    version: '1.0.0',
    summary: 'Solve a branching evidence puzzle before suspicion and noise bury the truth.',
    description: 'A local deduction mini-game with suspect leads, evidence trails, risk, credibility, scoring, branching cases, touch, pointer, keyboard, reduced-motion support, and clean teardown.'
  };

  const CASES = [
    { title: 'Museum blackout', culprit: 'Curator', noise: 'Social rumor', facts: {
      Curator: ['Badge opened the east archive during the blackout.', 'A restoration invoice names the stolen frame.', 'The curator changed the alarm route last week.'],
      Guard: ['The guard radioed the outage first.', 'Boot prints stop before the archive hallway.', 'The guard card never left the public wing.'],
      Donor: ['The donor argued about insurance.', 'A driver confirms the donor left before midnight.', 'The donor had no archive access.']
    } },
    { title: 'Harbor manifest', culprit: 'Broker', noise: 'Duplicate cargo', facts: {
      Broker: ['The broker edited the manifest after inspection.', 'Two seal numbers point to one container.', 'The broker knew the tide delay before dispatch.'],
      Captain: ['The captain reported the mismatch.', 'Bridge logs match the official route.', 'The captain lost time correcting the broker note.'],
      Mechanic: ['The mechanic replaced a scanner battery.', 'Tool marks are from a routine hatch repair.', 'The mechanic was logged below deck.']
    } },
    { title: 'Rooftop relay', culprit: 'Producer', noise: 'Bad weather', facts: {
      Producer: ['The producer moved the relay test off schedule.', 'Backup audio was deleted from the booth laptop.', 'The producer benefits from a failed live feed.'],
      Host: ['The host improvised when the feed dropped.', 'Wardrobe mic logs show no tampering.', 'The host warned the crew about the cable.'],
      Intern: ['The intern fetched spare batteries.', 'Camera footage shows the intern outside the booth.', 'The intern found the deleted file notice.']
    } }
  ];

  function installStyles() {
    if (document.querySelector('#clue-current-styles')) return;
    const style = document.createElement('style');
    style.id = 'clue-current-styles';
    style.textContent = `
      .clue-card { animation: clue-rise .32s ease both; }
      .clue-game { max-width: 900px; gap: 14px; }
      .clue-hud, .clue-suspects { display: grid; gap: 9px; }
      .clue-hud { grid-template-columns: repeat(4, 1fr); }
      .clue-stat, .clue-panel, .clue-suspect { border: 1px solid var(--line); border-radius: 17px; background: white; padding: 12px 13px; }
      .clue-stat span { display: block; color: var(--muted); font-size: .62rem; font-weight: 900; letter-spacing: .09em; text-transform: uppercase; }
      .clue-stat strong { display: block; margin-top: 4px; font-size: 1rem; }
      .clue-board { display: grid; grid-template-columns: minmax(250px, .9fr) minmax(280px, 1.1fr); gap: 12px; align-items: stretch; }
      .clue-panel { background: #07110d; color: white; min-height: 280px; overflow: hidden; position: relative; }
      .clue-panel::before { content: ""; position: absolute; inset: -40%; background: radial-gradient(circle, rgba(191,231,209,.18), transparent 34%); transform: translate(var(--mx,0), var(--my,0)); transition: transform .2s ease; }
      .clue-panel > * { position: relative; z-index: 1; }
      .clue-panel h3 { margin: 0 0 8px; font-size: clamp(1.55rem, 4vw, 2.6rem); letter-spacing: -.05em; }
      .clue-panel p, .clue-panel small { color: rgba(255,255,255,.74); line-height: 1.45; }
      .clue-evidence { margin: 16px 0 0; padding: 0; list-style: none; display: grid; gap: 8px; }
      .clue-evidence li { padding: 9px 10px; border-radius: 13px; background: rgba(255,255,255,.1); }
      .clue-suspect { text-align: left; cursor: pointer; touch-action: manipulation; }
      .clue-suspect[aria-pressed="true"] { outline: 3px solid var(--accent); }
      .clue-suspect strong { display: flex; justify-content: space-between; gap: 8px; }
      .clue-suspect small { display: block; margin-top: 6px; color: var(--muted); }
      .clue-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .clue-log { min-height: 92px; padding: 17px 19px; }
      .clue-log strong { font-size: clamp(1.1rem, 3vw, 1.5rem); }
      @media (max-width: 720px) { .clue-hud { grid-template-columns: repeat(2, 1fr); } .clue-board { grid-template-columns: 1fr; } }
      @media (prefers-reduced-motion: reduce) { .clue-card { animation: none; } .clue-panel::before { transition: none; } }
      @keyframes clue-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.append(style);
  }

  function makeButton(text, onClick, secondary = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = secondary ? 'button button-secondary' : 'button';
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-clue-current-card]')) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.clueCurrentCard = 'true';
    card.classList.add('clue-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `Play · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const button = node.querySelector('.app-card-button');
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', openClueCurrent);
    grid.append(node);
  }

  function openClueCurrent() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Clue%20Current';
    stage.replaceChildren();
    renderGame(stage);
    dialog.showModal();
  }

  function renderGame(stage) {
    const root = document.createElement('section');
    root.className = 'tool-panel clue-game';
    const state = { caseIndex: 0, turn: 1, focus: 6, suspicion: 0, credibility: 50, score: 0, selected: '', found: [], solved: false };
    const hud = document.createElement('div');
    hud.className = 'clue-hud';
    hud.innerHTML = '<div class="clue-stat"><span>Turn</span><strong id="clue-turn">1 / 6</strong></div><div class="clue-stat"><span>Focus</span><strong id="clue-focus">6</strong></div><div class="clue-stat"><span>Suspicion</span><strong id="clue-suspicion">0</strong></div><div class="clue-stat"><span>Credibility</span><strong id="clue-cred">50</strong></div>';
    const board = document.createElement('div');
    board.className = 'clue-board';
    const panel = document.createElement('div');
    panel.className = 'clue-panel';
    const suspects = document.createElement('div');
    suspects.className = 'clue-suspects';
    board.append(panel, suspects);
    const log = document.createElement('div');
    log.className = 'result-card clue-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'clue-actions';
    const questionButton = makeButton('Question lead', () => investigate('question'));
    const auditButton = makeButton('Audit record', () => investigate('audit'), true);
    const pressureButton = makeButton('Apply pressure', () => investigate('pressure'), true);
    const accuseButton = makeButton('Accuse', accuse);
    const nextButton = makeButton('New case', newCase, true);
    actions.append(questionButton, auditButton, pressureButton, accuseButton, nextButton);
    root.append(hud, board, log, actions);
    stage.append(root);

    const currentCase = () => CASES[state.caseIndex];
    const suspectNames = () => Object.keys(currentCase().facts);

    function update() {
      const data = currentCase();
      hud.querySelector('#clue-turn').textContent = `${state.turn} / 6`;
      hud.querySelector('#clue-focus').textContent = String(state.focus);
      hud.querySelector('#clue-suspicion').textContent = String(state.suspicion);
      hud.querySelector('#clue-cred').textContent = String(state.credibility);
      panel.innerHTML = `<h3>${data.title}</h3><p>Find the real actor before the noise source turns the case against you.</p><small>Noise source: ${data.noise}. Select a lead, choose how to test it, then accuse when the pattern is strong.</small><ul class="clue-evidence">${state.found.map((item) => `<li>${item}</li>`).join('') || '<li>No evidence collected yet.</li>'}</ul>`;
      suspects.replaceChildren();
      suspectNames().forEach((name) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'clue-suspect';
        button.setAttribute('aria-pressed', String(state.selected === name));
        button.innerHTML = `<strong>${name}<span>${evidenceCount(name)} / 3</span></strong><small>${name === state.selected ? 'Active lead' : 'Tap or press Enter to select'}</small>`;
        button.addEventListener('click', () => {
          state.selected = name;
          write(`<strong>${name} selected.</strong><small>Choose a careful audit, direct question, or risky pressure move.</small>`);
          update();
        });
        suspects.append(button);
      });
      const over = state.solved || state.turn > 6 || state.focus <= 0 || state.suspicion >= 9 || state.credibility <= 0;
      [questionButton, auditButton, pressureButton, accuseButton].forEach((button) => { button.disabled = over; });
    }

    function evidenceCount(name) {
      return state.found.filter((item) => item.includes(name) || currentCase().facts[name].includes(item)).length;
    }

    function investigate(mode) {
      if (!state.selected) {
        write('<strong>Select a lead first.</strong><small>Good deduction starts by choosing where to spend attention.</small>');
        return;
      }
      const data = currentCase();
      const facts = data.facts[state.selected];
      const known = new Set(state.found);
      const nextFact = facts.find((fact) => !known.has(fact));
      const cost = mode === 'audit' ? 2 : 1;
      const suspicion = mode === 'pressure' ? 2 : mode === 'question' ? 1 : 0;
      if (state.focus < cost) {
        write('<strong>Not enough focus.</strong><small>Accuse now or start a new case.</small>');
        return;
      }
      state.focus -= cost;
      state.suspicion += suspicion;
      state.turn += 1;
      if (nextFact) {
        state.found.push(nextFact);
        const accurate = state.selected === data.culprit;
        state.credibility += accurate ? 9 : mode === 'pressure' ? -8 : -3;
        state.score += accurate ? 16 : 6;
        write(`<strong>Evidence found.</strong><small>${nextFact}</small>`);
      } else {
        state.credibility -= 6;
        state.suspicion += 1;
        write('<strong>This lead is going cold.</strong><small>Repeating a spent path burns credibility.</small>');
      }
      if (state.turn > 6 && !state.solved) write('<strong>The trail cooled.</strong><small>You ran out of turns. Try the case again with a tighter evidence path.</small>');
      update();
    }

    function accuse() {
      if (!state.selected) {
        write('<strong>No accusation yet.</strong><small>Select the lead that best explains the evidence.</small>');
        return;
      }
      const data = currentCase();
      state.solved = true;
      const culpritEvidence = state.found.filter((item) => data.facts[data.culprit].includes(item)).length;
      if (state.selected === data.culprit && culpritEvidence >= 2) {
        state.score += 80 + state.focus * 7 + Math.max(0, state.credibility) - state.suspicion * 4;
        write(`<strong>Case solved: ${state.score} points.</strong><small>${data.culprit} fits the strongest evidence. Unused focus and low suspicion became bonuses.</small>`);
      } else if (state.selected === data.culprit) {
        state.score += 24;
        write('<strong>Right suspect, weak case.</strong><small>You found the actor, but not enough proof to survive review.</small>');
      } else {
        state.score = Math.max(0, state.score - 25);
        write(`<strong>False accusation.</strong><small>The stronger path pointed to ${data.culprit}. Recovery means rebuilding evidence, not pressing harder.</small>`);
      }
      update();
    }

    function newCase() {
      state.caseIndex = (state.caseIndex + 1) % CASES.length;
      state.turn = 1;
      state.focus = 6;
      state.suspicion = 0;
      state.credibility = 50;
      state.score = 0;
      state.selected = '';
      state.found = [];
      state.solved = false;
      write('<strong>New case opened.</strong><small>Three leads, one noisy explanation, six turns.</small>');
      update();
    }

    function write(html) { log.innerHTML = html; }

    panel.addEventListener('pointermove', (event) => {
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty('--mx', `${(event.clientX - rect.left - rect.width / 2) / 8}px`);
      panel.style.setProperty('--my', `${(event.clientY - rect.top - rect.height / 2) / 8}px`);
    });
    root.addEventListener('keydown', (event) => {
      const names = suspectNames();
      if (event.key >= '1' && event.key <= '3') {
        state.selected = names[Number(event.key) - 1] || state.selected;
        update();
      }
      if (event.key.toLowerCase() === 'q') investigate('question');
      if (event.key.toLowerCase() === 'a') investigate('audit');
      if (event.key.toLowerCase() === 'p') investigate('pressure');
    });

    write('<strong>Case opened.</strong><small>Select a lead. Number keys choose leads; Q questions, A audits, P pressures.</small>');
    update();
  }

  function installWhenStable() {
    initCard();
    window.setTimeout(initCard, 250);
    window.setTimeout(initCard, 900);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installWhenStable);
  else installWhenStable();
})();
