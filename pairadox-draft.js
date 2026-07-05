(() => {
  const APP = {
    name: 'Pairadox Draft',
    emoji: '🧪',
    category: 'play',
    version: '1.0.0',
    summary: 'Alternate ingredient picks, build rival prototypes, and win judges through synergy, clarity, and risk control.',
    description: 'A local two-player drafting mini-game with alternating picks, prototype slots, judge goals, denial, session unlocks, scoring, responsive SVG motion, touch and keyboard controls, optional local audio, reduced-motion behavior, and clean teardown.'
  };

  const CARDS = [
    { name: 'Tiny door', suit: 'object', power: 3, chaos: 1 }, { name: 'Borrowed thunder', suit: 'sound', power: 4, chaos: 3 },
    { name: 'Forgotten map', suit: 'memory', power: 3, chaos: 2 }, { name: 'Secret rule', suit: 'rule', power: 5, chaos: 4 },
    { name: 'Pocket moon', suit: 'object', power: 4, chaos: 2 }, { name: 'Applause loop', suit: 'sound', power: 2, chaos: 1 },
    { name: 'Warm glitch', suit: 'tech', power: 4, chaos: 3 }, { name: 'One brave button', suit: 'tech', power: 3, chaos: 1 },
    { name: 'Kind monster', suit: 'character', power: 5, chaos: 3 }, { name: 'Quiet rival', suit: 'character', power: 3, chaos: 2 },
    { name: 'Invisible bridge', suit: 'place', power: 4, chaos: 4 }, { name: 'Lunchbox comet', suit: 'object', power: 5, chaos: 5 },
    { name: 'Wrong holiday', suit: 'memory', power: 2, chaos: 3 }, { name: 'Echo coupon', suit: 'rule', power: 3, chaos: 1 },
    { name: 'Fog machine', suit: 'place', power: 2, chaos: 2 }, { name: 'Helpful typo', suit: 'tech', power: 3, chaos: 2 },
    { name: 'Emergency glitter', suit: 'object', power: 4, chaos: 5 }, { name: 'Polite dragon', suit: 'character', power: 5, chaos: 2 }
  ];
  const JUDGES = [
    { name: 'Arcade judge', wants: ['tech', 'sound'], text: 'rewards timing, feedback, and visible loops' },
    { name: 'Story judge', wants: ['character', 'memory'], text: 'rewards emotional reversal and callbacks' },
    { name: 'Toy judge', wants: ['object', 'rule'], text: 'rewards tactile rules and quick replay' },
    { name: 'Map judge', wants: ['place', 'object'], text: 'rewards spatial choices and discoverable paths' }
  ];

  function installStyles() {
    if (document.querySelector('#pairadox-draft-styles')) return;
    const style = document.createElement('style');
    style.id = 'pairadox-draft-styles';
    style.textContent = `.pairadox-draft-card{animation:pairadox-draft-rise .32s ease both}.pairadox-draft{max-width:1080px;gap:14px}.draft-hud{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.draft-stat{border:1px solid var(--line);border-radius:15px;background:white;padding:10px 12px}.draft-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.draft-stat strong{display:block;margin-top:4px;font-size:.96rem}.draft-board{position:relative;border:0;border-radius:26px;padding:0;overflow:hidden;background:#171026;color:white;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.draft-board:focus-visible{outline:4px solid var(--accent);outline-offset:4px}.draft-board svg{display:block;width:100%;min-height:420px}.draft-card-shape{cursor:pointer}.draft-card-shape:focus{outline:none}.draft-panel{display:grid;grid-template-columns:1fr 1fr;gap:10px}.draft-player{border:1px solid var(--line);border-radius:18px;background:white;padding:13px}.draft-player strong{display:block}.draft-slots{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.draft-chip{border:1px solid var(--line);border-radius:999px;padding:6px 8px;font-size:.78rem;font-weight:800}.draft-tools{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.draft-tools button{border:1px solid var(--line);border-radius:16px;background:white;color:var(--ink);padding:12px 8px;font-weight:900}.draft-log{min-height:118px;padding:17px 19px}.draft-log strong{font-size:clamp(1.08rem,3vw,1.48rem)}@media(max-width:760px){.draft-hud{grid-template-columns:repeat(2,1fr)}.draft-panel{grid-template-columns:1fr}.draft-tools{grid-template-columns:repeat(2,1fr)}.draft-board svg{min-height:360px}}@media(prefers-reduced-motion:reduce){.pairadox-draft-card{animation:none}}@keyframes pairadox-draft-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.append(style);
  }

  function labelCategory(value) { return value === 'play' ? 'Play' : value === 'useful' ? 'Useful' : 'Experiment'; }
  function activeFilter() { return document.querySelector('.filter.is-active')?.dataset.filter || 'all'; }
  function eligible() { const filter = activeFilter(); return filter === 'all' || filter === APP.category; }

  function initCard() {
    const grid = document.querySelector('#app-grid');
    const template = document.querySelector('#app-card-template');
    if (!grid || !template || document.querySelector('[data-pairadox-draft-card]') || !eligible()) return;
    installStyles();
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.app-card');
    card.dataset.category = APP.category;
    card.dataset.pairadoxDraftCard = 'true';
    card.classList.add('pairadox-draft-card');
    node.querySelector('.app-icon').textContent = APP.emoji;
    node.querySelector('.app-meta').textContent = `${labelCategory(APP.category)} · v${APP.version}`;
    node.querySelector('.app-name').textContent = APP.name;
    node.querySelector('.app-summary').textContent = APP.summary;
    const open = node.querySelector('.app-card-button');
    open.setAttribute('aria-label', `Open ${APP.name}`);
    open.addEventListener('click', openApp);
    grid.append(node);
  }

  function wireFilterRefresh() {
    document.querySelectorAll('.filter').forEach((button) => {
      if (button.dataset.pairadoxDraftRefresh) return;
      button.dataset.pairadoxDraftRefresh = 'true';
      button.addEventListener('click', () => setTimeout(initCard, 0));
    });
  }

  function openApp() {
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
    feedback.href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Pairadox%20Draft';
    stage.replaceChildren();
    renderGame(stage, dialog);
    dialog.showModal();
  }

  function renderGame(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel pairadox-draft';
    const hud = document.createElement('div');
    hud.className = 'draft-hud';
    hud.innerHTML = '<div class="draft-stat"><span>Round</span><strong id="draft-round">1 / 3</strong></div><div class="draft-stat"><span>Turn</span><strong id="draft-turn">Player A</strong></div><div class="draft-stat"><span>Judge</span><strong id="draft-judge">Arcade</strong></div><div class="draft-stat"><span>Momentum</span><strong id="draft-momentum">0</strong></div><div class="draft-stat"><span>Unlock</span><strong id="draft-unlock">Base deck</strong></div>';
    const board = document.createElement('button');
    board.type = 'button';
    board.className = 'draft-board';
    board.setAttribute('aria-label', 'Pairadox Draft board. Use left and right arrows to inspect cards, Enter to draft, B to burn, and P to pitch.');
    board.innerHTML = '<svg aria-hidden="true"></svg>';
    const panels = document.createElement('div');
    panels.className = 'draft-panel';
    panels.innerHTML = '<div class="draft-player"><strong>Player A prototype</strong><small id="draft-a-note">Draft three cards, then pitch.</small><div class="draft-slots" id="draft-a-slots"></div></div><div class="draft-player"><strong>Player B prototype</strong><small id="draft-b-note">Draft three cards, then pitch.</small><div class="draft-slots" id="draft-b-slots"></div></div>';
    const tools = document.createElement('div');
    tools.className = 'draft-tools';
    const log = document.createElement('div');
    log.className = 'result-card draft-log';
    log.setAttribute('aria-live', 'polite');
    const actions = document.createElement('div');
    actions.className = 'tool-actions';
    root.append(hud, board, panels, tools, log, actions);
    stage.append(root);

    const svg = board.querySelector('svg');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { round: 1, scoreA: 0, scoreB: 0, turn: 0, selected: 0, market: [], burned: [], judge: JUDGES[0], momentum: 0, chaosLimit: 8, pitched: false, hard: false, audio: false, audioContext: null, raf: 0, hands: [[], []] };
    [['Draft card', draftSelected], ['Burn card', burnSelected], ['Pitch round', pitch], ['New match', newMatch]].forEach(([label, fn]) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.addEventListener('click', fn); tools.append(button); });
    const soundButton = makeButton('Sound off', toggleSound, true);
    const modeButton = makeButton('Chaos lock', toggleMode, true);
    actions.append(soundButton, modeButton);
    dialog.addEventListener('close', teardown, { once: true });

    function makeButton(text, fn, secondary) { const button = document.createElement('button'); button.type = 'button'; button.className = secondary ? 'button button-secondary' : 'button'; button.textContent = text; button.addEventListener('click', fn); return button; }
    function say(html) { log.innerHTML = html; }
    function current() { return state.turn % 2; }
    function shuffle(list) { return [...list].sort(() => Math.random() - 0.5); }
    function cardScore(card, judge) { return card.power + (judge.wants.includes(card.suit) ? 3 : 0) - Math.max(0, card.chaos - 3); }
    function handChaos(hand) { return hand.reduce((sum, card) => sum + card.chaos, 0); }
    function synergy(hand, judge) { const suits = new Set(hand.map((card) => card.suit)); const judgeHits = hand.filter((card) => judge.wants.includes(card.suit)).length; return Math.max(0, suits.size - 1) * 2 + judgeHits * 3; }

    function newMatch() { state.round = 1; state.scoreA = 0; state.scoreB = 0; state.hard = false; newRound(); }
    function toggleMode() { state.hard = !state.hard; modeButton.textContent = state.hard ? 'Chaos loose' : 'Chaos lock'; state.chaosLimit = state.hard ? 11 : 8; update(); }
    function newRound() {
      state.turn = state.round % 2 ? 0 : 1;
      state.selected = 0;
      state.hands = [[], []];
      state.burned = [];
      state.pitched = false;
      state.judge = JUDGES[(state.round + Math.floor(Math.random() * JUDGES.length)) % JUDGES.length];
      state.market = shuffle(CARDS).slice(0, state.hard ? 10 : 8);
      say(`<strong>Round ${state.round}: ${state.judge.name} is listening.</strong><small>${state.judge.text}. Alternate picks, burn a dangerous card, and pitch when both prototypes have three cards.</small>`);
      pulse('good'); update(); draw();
    }
    function draftSelected() {
      if (state.pitched || !state.market.length) return;
      const player = current();
      if (state.hands[player].length >= 3) { say('<strong>Prototype is full.</strong><small>Use the next turn to burn a card or pitch once both sides are ready.</small>'); return; }
      const card = state.market.splice(state.selected, 1)[0];
      state.hands[player].push(card);
      state.momentum += cardScore(card, state.judge);
      state.turn += 1;
      state.selected = Math.max(0, Math.min(state.selected, state.market.length - 1));
      say(`<strong>Player ${player ? 'B' : 'A'} drafted ${card.name}.</strong><small>${card.suit} card, power ${card.power}, chaos ${card.chaos}. Judge fit changes the pitch score.</small>`);
      pulse('good'); maybeAutoPitch(); update(); draw();
    }
    function burnSelected() {
      if (state.pitched || !state.market.length) return;
      const card = state.market.splice(state.selected, 1)[0];
      state.burned.push(card);
      state.momentum = Math.max(0, state.momentum - 2);
      state.turn += 1;
      state.selected = Math.max(0, Math.min(state.selected, state.market.length - 1));
      say(`<strong>${card.name} was burned.</strong><small>Burning denies a card, costs momentum, and may protect a prototype from chaos overload.</small>`);
      pulse('bad'); maybeAutoPitch(); update(); draw();
    }
    function maybeAutoPitch() { if (state.hands[0].length === 3 && state.hands[1].length === 3) pitch(); }
    function pitch() {
      if (state.pitched) return nextRound();
      if (state.hands[0].length < 3 || state.hands[1].length < 3) { say('<strong>Pitch is not ready.</strong><small>Each player needs three drafted ingredients before the judge scores the prototypes.</small>'); return; }
      const scores = state.hands.map((hand) => {
        const base = hand.reduce((sum, card) => sum + cardScore(card, state.judge), 0);
        const chaosPenalty = Math.max(0, handChaos(hand) - state.chaosLimit) * 3;
        return Math.max(0, base + synergy(hand, state.judge) - chaosPenalty);
      });
      state.scoreA += scores[0]; state.scoreB += scores[1]; state.pitched = true;
      if (state.round >= 3) {
        const winner = state.scoreA === state.scoreB ? 'Shared win' : state.scoreA > state.scoreB ? 'Player A wins' : 'Player B wins';
        if (Math.max(state.scoreA, state.scoreB) >= 95) state.hard = true;
        say(`<strong>${winner}: ${state.scoreA} to ${state.scoreB}.</strong><small>Replay to chase cleaner suit combos, safer chaos, and a high-score unlock for the larger market.</small>`);
      } else {
        say(`<strong>Pitch scored ${scores[0]} to ${scores[1]}.</strong><small>Total: A ${state.scoreA}, B ${state.scoreB}. Continue for a new judge and reversed first pick.</small>`);
      }
      pulse(scores[0] === scores[1] ? 'tick' : 'good'); update(); draw();
    }
    function nextRound() { if (state.round >= 3) return newMatch(); state.round += 1; newRound(); }
    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) { say('<strong>Sound is unavailable here.</strong><small>The draft still works without audio.</small>'); return; }
      state.audio = !state.audio; soundButton.textContent = state.audio ? 'Sound on' : 'Sound off'; soundButton.setAttribute('aria-pressed', String(state.audio));
      if (state.audio) { state.audioContext ||= new AudioEngine(); state.audioContext.resume(); pulse('good'); }
    }
    function pulse(kind) {
      if (!state.audio || !state.audioContext) return;
      const now = state.audioContext.currentTime;
      const osc = state.audioContext.createOscillator(); const gain = state.audioContext.createGain();
      osc.type = 'triangle'; osc.frequency.setValueAtTime(kind === 'good' ? 660 : kind === 'bad' ? 220 : 440, now);
      gain.gain.setValueAtTime(0.001, now); gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain).connect(state.audioContext.destination); osc.start(now); osc.stop(now + 0.18);
    }
    function update() {
      hud.querySelector('#draft-round').textContent = `${state.round} / 3`;
      hud.querySelector('#draft-turn').textContent = state.pitched ? 'Pitch' : `Player ${current() ? 'B' : 'A'}`;
      hud.querySelector('#draft-judge').textContent = state.judge.name.replace(' judge', '');
      hud.querySelector('#draft-momentum').textContent = String(state.momentum);
      hud.querySelector('#draft-unlock').textContent = state.hard ? 'Wide market' : 'Base deck';
      [0, 1].forEach((player) => {
        const slots = root.querySelector(player ? '#draft-b-slots' : '#draft-a-slots');
        slots.replaceChildren(...state.hands[player].map((card) => { const span = document.createElement('span'); span.className = 'draft-chip'; span.textContent = `${card.name} · ${card.suit}`; return span; }));
        root.querySelector(player ? '#draft-b-note' : '#draft-a-note').textContent = `Score ${player ? state.scoreB : state.scoreA} · chaos ${handChaos(state.hands[player])}/${state.chaosLimit}`;
      });
    }
    function draw() {
      cancelAnimationFrame(state.raf);
      const box = board.getBoundingClientRect();
      const width = Math.max(320, box.width || 900); const height = width < 620 ? 360 : 420;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`); svg.innerHTML = '';
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); bg.setAttribute('width', width); bg.setAttribute('height', height); bg.setAttribute('fill', '#171026'); svg.append(bg);
      const judge = document.createElementNS('http://www.w3.org/2000/svg', 'text'); judge.setAttribute('x', 24); judge.setAttribute('y', 38); judge.setAttribute('fill', '#fef3c7'); judge.setAttribute('font-size', width < 520 ? '16' : '22'); judge.setAttribute('font-weight', '800'); judge.textContent = `${state.judge.name}: ${state.judge.text}`; svg.append(judge);
      const cols = width < 620 ? 2 : 4; const cardW = (width - 48 - (cols - 1) * 12) / cols; const cardH = width < 620 ? 70 : 82;
      state.market.forEach((card, index) => {
        const x = 24 + (index % cols) * (cardW + 12); const y = 72 + Math.floor(index / cols) * (cardH + 12);
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.classList.add('draft-card-shape'); g.setAttribute('role', 'button'); g.setAttribute('tabindex', '0'); g.setAttribute('aria-label', `Select ${card.name}`);
        g.addEventListener('click', () => { state.selected = index; update(); draw(); });
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); rect.setAttribute('x', x); rect.setAttribute('y', y); rect.setAttribute('width', cardW); rect.setAttribute('height', cardH); rect.setAttribute('rx', 16); rect.setAttribute('fill', index === state.selected ? '#f97316' : '#fff7ed'); rect.setAttribute('opacity', index === state.selected ? '1' : '.92'); g.append(rect);
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'text'); title.setAttribute('x', x + 12); title.setAttribute('y', y + 26); title.setAttribute('fill', '#1f1308'); title.setAttribute('font-size', '15'); title.setAttribute('font-weight', '900'); title.textContent = card.name; g.append(title);
        const meta = document.createElementNS('http://www.w3.org/2000/svg', 'text'); meta.setAttribute('x', x + 12); meta.setAttribute('y', y + 52); meta.setAttribute('fill', '#5b3420'); meta.setAttribute('font-size', '12'); meta.setAttribute('font-weight', '700'); meta.textContent = `${card.suit} · power ${card.power} · chaos ${card.chaos}`; g.append(meta);
        svg.append(g);
      });
      const foot = document.createElementNS('http://www.w3.org/2000/svg', 'text'); foot.setAttribute('x', 24); foot.setAttribute('y', height - 24); foot.setAttribute('fill', 'rgba(255,255,255,.76)'); foot.setAttribute('font-size', '13'); foot.textContent = 'Arrow keys inspect. Enter drafts. B burns. P pitches. All play stays local.'; svg.append(foot);
      if (!reduced) state.raf = requestAnimationFrame(() => {});
    }
    function onKey(event) {
      if (event.key === 'ArrowRight') { state.selected = Math.min(state.market.length - 1, state.selected + 1); draw(); event.preventDefault(); }
      if (event.key === 'ArrowLeft') { state.selected = Math.max(0, state.selected - 1); draw(); event.preventDefault(); }
      if (event.key === 'Enter' || event.key === ' ') { draftSelected(); event.preventDefault(); }
      if (event.key.toLowerCase() === 'b') { burnSelected(); event.preventDefault(); }
      if (event.key.toLowerCase() === 'p') { pitch(); event.preventDefault(); }
    }
    function teardown() { cancelAnimationFrame(state.raf); board.removeEventListener('keydown', onKey); window.removeEventListener('resize', draw); if (state.audioContext) state.audioContext.close(); }
    board.addEventListener('keydown', onKey); window.addEventListener('resize', draw);
    newRound();
  }

  window.addEventListener('DOMContentLoaded', () => { setTimeout(initCard, 80); wireFilterRefresh(); });
})();
