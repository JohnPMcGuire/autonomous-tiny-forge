(() => {
  const APP = {
    name: 'Sonar Salvage', emoji: '📡', category: 'play', version: '1.0.0',
    summary: 'Triangulate hidden wrecks with limited sonar pings, drones, currents, storms, and salvage risk.',
    description: 'A local spatial-deduction mini-game with sonar distance clues, limited pings, draggable markers, drone scans, storm interference, adaptive contracts, scoring, session-only deep-water unlock, touch and keyboard controls, reduced-motion behavior, optional local audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const svgNS = 'http://www.w3.org/2000/svg';
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensureStyles() {
    if ($('#sonar-salvage-styles')) return;
    const style = document.createElement('style');
    style.id = 'sonar-salvage-styles';
    style.textContent = `
      .sonar-card{animation:sonar-rise .24s ease both}.sonar-game{max-width:1120px;gap:14px}.sonar-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.sonar-stat,.sonar-board,.sonar-panel,.sonar-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.sonar-stat{padding:10px 12px}.sonar-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.sonar-stat strong{display:block;margin-top:4px}.sonar-layout{display:grid;grid-template-columns:1.08fr .92fr;gap:12px}.sonar-board{padding:12px;background:linear-gradient(135deg,#e0f2fe,#f8fafc)}.sonar-board svg{width:100%;height:min(62vh,500px);min-height:340px;display:block;border-radius:18px;background:#06131f;touch-action:none}.sonar-panel{padding:14px;display:grid;gap:12px}.sonar-brief{padding:13px;background:#f8fafc}.sonar-brief h3{margin:.2rem 0;font-size:1.2rem}.sonar-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.sonar-actions button{min-height:44px}.sonar-tags{display:flex;flex-wrap:wrap;gap:6px}.sonar-tags span{border:1px solid var(--line);border-radius:999px;padding:4px 8px;background:#fff;font-size:.74rem;font-weight:800}.sonar-log{min-height:112px;padding:17px 19px}.sonar-cell{fill:#0f2a3d;stroke:#164863;stroke-width:.55}.sonar-cell:nth-child(odd){fill:#0b2233}.sonar-cell.is-focus{stroke:#fde68a;stroke-width:1.2}.sonar-ping{fill:none;stroke:#38bdf8;stroke-width:1.25;opacity:.72}.sonar-ping.near{stroke:#34d399}.sonar-ping.mid{stroke:#fde047}.sonar-ping.far{stroke:#fb7185}.sonar-marker{fill:#fef3c7;stroke:#78350f;stroke-width:1.1}.sonar-guess{fill:#f8fafc;stroke:#0f172a;stroke-width:1.2}.sonar-storm{fill:#ef4444;opacity:.2;stroke:#fecaca;stroke-width:.8}.sonar-current{stroke:#67e8f9;stroke-width:.9;opacity:.5}.sonar-text{fill:#e5e7eb;font-size:4px;font-weight:900;text-anchor:middle;dominant-baseline:middle;pointer-events:none}.sonar-wreck{fill:#f97316;stroke:#fed7aa;stroke-width:1.1}.sonar-ghost{fill:none;stroke:#f8fafc;stroke-width:1;stroke-dasharray:2 1;opacity:.42}@media(max-width:860px){.sonar-hud{grid-template-columns:repeat(2,1fr)}.sonar-layout{grid-template-columns:1fr}.sonar-board svg{height:420px}.sonar-actions{grid-template-columns:1fr}}@media(max-width:520px){.sonar-board{padding:8px}.sonar-board svg{height:360px;min-height:320px}.sonar-stat{padding:9px}.sonar-stat strong{font-size:.95rem}}@media(prefers-reduced-motion:reduce){.sonar-card{animation:none;transition:none}.sonar-ping{stroke-dasharray:0}}@keyframes sonar-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
    `;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-sonar-salvage-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.sonarSalvageCard = 'true';
    card.classList.add('sonar-card');
    $('.app-icon', node).textContent = APP.emoji;
    $('.app-meta', node).textContent = `${label(APP.category)} · v${APP.version}`;
    $('.app-name', node).textContent = APP.name;
    $('.app-summary', node).textContent = APP.summary;
    const button = $('.app-card-button', node);
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', open);
    grid.append(node);
  }

  function boot() {
    ensureStyles();
    let tries = 0;
    const retry = () => { addCard(); if (!$('[data-sonar-salvage-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.sonarSalvageRefresh) return;
      button.dataset.sonarSalvageRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Sonar%20Salvage';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel sonar-game';
    root.innerHTML = `<div class="sonar-hud"><div class="sonar-stat"><span>Contract</span><strong id="ss-round">1 / 5</strong></div><div class="sonar-stat"><span>Pings</span><strong id="ss-pings">7</strong></div><div class="sonar-stat"><span>Drones</span><strong id="ss-drones">2</strong></div><div class="sonar-stat"><span>Risk</span><strong id="ss-risk">0%</strong></div><div class="sonar-stat"><span>Score</span><strong id="ss-score">0</strong></div><div class="sonar-stat"><span>Best</span><strong id="ss-best">0</strong></div></div><div class="sonar-layout"><div class="sonar-board"><svg viewBox="0 0 100 76" role="img" aria-label="Sonar salvage map" tabindex="0"></svg></div><div class="sonar-panel"><div class="sonar-brief"></div><div class="sonar-tags"></div><div class="sonar-actions"><button class="button" type="button" data-act="ping">Ping selected cell</button><button class="button button-secondary" type="button" data-act="drone">Launch drone scan</button><button class="button button-secondary" type="button" data-act="mark">Place marker</button><button class="button button-secondary" type="button" data-act="salvage">Commit salvage</button><button class="button button-secondary" type="button" data-act="new">New contract</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card sonar-log" aria-live="polite"></div>`;
    stage.append(root);

    const svg = $('svg', root), brief = $('.sonar-brief', root), tags = $('.sonar-tags', root), log = $('.sonar-log', root);
    const st = { round: 1, rounds: 5, score: 0, best: 0, pings: 7, drones: 2, risk: 0, deep: false, sound: false, ac: null, selected: { x: 4, y: 4 }, wreck: { x: 8, y: 2 }, pingsMade: [], markers: [], storms: [], currents: [], found: false };
    const size = 10, cell = 7, offX = 15, offY = 3;
    const lowMotion = reduced();
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });

    function setup(advance = false) {
      if (advance) st.round += 1;
      if (st.round > st.rounds) { st.deep = true; st.round = 1; st.best = Math.max(st.best, st.score); note('Deep-water salvage unlocked. Storms now drift clues and wreck bonuses are larger.'); }
      st.pings = Math.max(4, 8 - st.round + (st.deep ? 1 : 0));
      st.drones = st.deep ? 3 : 2;
      st.risk = 0;
      st.found = false;
      st.selected = { x: 4, y: 4 };
      st.wreck = { x: (st.round * 3 + 2) % size, y: (st.round * 5 + 1) % size };
      if (st.wreck.x < 1) st.wreck.x += 3;
      if (st.wreck.y < 1) st.wreck.y += 4;
      st.pingsMade = [];
      st.markers = [];
      st.storms = [{ x: 2 + (st.round % 3), y: 1 + (st.round % 4), r: 1.55 }, { x: 7, y: 6 - (st.round % 3), r: 1.35 }];
      st.currents = [{ x1: 1, y1: 7, x2: 4 + st.round % 3, y2: 5 }, { x1: 6, y1: 1 + st.round % 2, x2: 8, y2: 3 + st.round % 4 }];
      updateText('Select a cell, ping for distance, place markers, then commit salvage when the hidden wreck is narrowed down.');
      render();
    }

    function updateText(message) {
      brief.innerHTML = `<h3>${st.deep ? 'Deep-water' : 'Coastal'} contract ${st.round}</h3><p>${message}</p>`;
      const tagText = [`${st.pings} pings`, `${st.drones} drones`, `${st.markers.length} markers`, st.deep ? 'Deep-water bonus' : 'Unlock after 5 contracts', lowMotion ? 'Reduced motion' : 'Animated sonar'];
      tags.replaceChildren(...tagText.map((textValue) => { const item = document.createElement('span'); item.textContent = textValue; return item; }));
    }
    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: arrows move, P pings, D scans, M marks, Enter commits salvage.</small>`; }
    function tone(kind) {
      if (!st.sound) return; const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume(); const osc = st.ac.createOscillator(); const gain = st.ac.createGain();
      osc.type = kind === 'bad' ? 'triangle' : 'sine'; osc.frequency.value = kind === 'win' ? 720 : kind === 'bad' ? 160 : 420;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.055, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .16); osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .18);
    }
    function hud() { $('#ss-round', root).textContent = `${st.round} / ${st.rounds}${st.deep ? '+' : ''}`; $('#ss-pings', root).textContent = st.pings; $('#ss-drones', root).textContent = st.drones; $('#ss-risk', root).textContent = `${st.risk}%`; $('#ss-score', root).textContent = st.score; $('#ss-best', root).textContent = Math.max(st.best, st.score); }
    function distance(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
    function stormPenalty(pos) { return st.storms.some((storm) => Math.hypot(pos.x - storm.x, pos.y - storm.y) <= storm.r) ? 1 : 0; }
    function clueFor(dist, stormy) {
      const drift = stormy && st.deep ? 1 : 0;
      if (dist <= 1 + drift) return { label: 'hot', cls: 'near', radius: 9 };
      if (dist <= 4 + drift) return { label: 'warm', cls: 'mid', radius: 18 };
      return { label: 'cold', cls: 'far', radius: 29 };
    }
    function point(pos) { return { x: offX + pos.x * cell + cell / 2, y: offY + pos.y * cell + cell / 2 }; }
    function el(name, attrs = {}) { const node = document.createElementNS(svgNS, name); Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v)); return node; }

    function render() {
      svg.replaceChildren();
      svg.append(el('rect', { x: 0, y: 0, width: 100, height: 76, fill: '#06131f' }));
      for (const current of st.currents) {
        const a = point({ x: current.x1, y: current.y1 }), b = point({ x: current.x2, y: current.y2 });
        svg.append(el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'sonar-current' }));
        const arrow = el('text', { x: b.x, y: b.y - 3, class: 'sonar-text' });
        arrow.textContent = '›';
        svg.append(arrow);
      }
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const p = point({ x, y });
          const cellNode = el('rect', { x: p.x - cell / 2, y: p.y - cell / 2, width: cell - .3, height: cell - .3, rx: 1.1, class: `sonar-cell${x === st.selected.x && y === st.selected.y ? ' is-focus' : ''}` });
          cellNode.dataset.x = x; cellNode.dataset.y = y;
          svg.append(cellNode);
        }
      }
      st.storms.forEach((storm) => { const p = point(storm); svg.append(el('circle', { cx: p.x, cy: p.y, r: storm.r * cell, class: 'sonar-storm' })); });
      st.pingsMade.forEach((ping) => { const p = point(ping); svg.append(el('circle', { cx: p.x, cy: p.y, r: ping.radius, class: `sonar-ping ${ping.cls}` })); const text = el('text', { x: p.x, y: p.y, class: 'sonar-text' }); text.textContent = ping.label; svg.append(text); });
      st.markers.forEach((mark, index) => { const p = point(mark); svg.append(el('path', { d: `M${p.x} ${p.y - 3} L${p.x + 3} ${p.y + 3} L${p.x - 3} ${p.y + 3}Z`, class: 'sonar-marker' })); const text = el('text', { x: p.x, y: p.y + 8, class: 'sonar-text' }); text.textContent = `${index + 1}`; svg.append(text); });
      if (st.found) { const p = point(st.wreck); svg.append(el('circle', { cx: p.x, cy: p.y, r: 5, class: 'sonar-wreck' })); svg.append(el('circle', { cx: p.x, cy: p.y, r: 9, class: 'sonar-ghost' })); }
      const sp = point(st.selected); svg.append(el('circle', { cx: sp.x, cy: sp.y, r: 3.5, class: 'sonar-guess' }));
      hud();
    }

    function select(pos) { st.selected = { x: clamp(pos.x, 0, size - 1), y: clamp(pos.y, 0, size - 1) }; render(); }
    function ping() {
      if (st.found) return note('This contract is complete. Start a new contract to continue.');
      if (st.pings <= 0) return note('No pings left. Commit carefully or start a new contract.');
      st.pings -= 1;
      const stormy = stormPenalty(st.selected);
      const dist = distance(st.selected, st.wreck);
      const clue = clueFor(dist, stormy);
      st.risk = clamp(st.risk + 4 + stormy * 8, 0, 99);
      st.pingsMade.push({ ...st.selected, ...clue });
      tone(clue.cls === 'near' ? 'win' : 'tap');
      updateText(`${clue.label.toUpperCase()} contact. ${stormy ? 'Storm interference may widen this clue.' : 'Clean reading.'}`);
      note(`Ping says ${clue.label}. Distance is ${dist <= 1 ? 'very close' : dist <= 4 ? 'in the neighborhood' : 'still wide'}.`);
      render();
    }
    function drone() {
      if (st.drones <= 0) return note('No drones remain. Use pings and markers now.');
      st.drones -= 1;
      st.risk = clamp(st.risk + 9, 0, 99);
      const dx = Math.sign(st.wreck.x - st.selected.x), dy = Math.sign(st.wreck.y - st.selected.y);
      const hint = { x: clamp(st.selected.x + dx * 2, 0, size - 1), y: clamp(st.selected.y + dy * 2, 0, size - 1) };
      st.markers.push(hint);
      tone('tap');
      updateText('Drone scan placed a probable corridor marker, but it raised salvage risk.');
      note(`Drone marker dropped ${dx ? (dx > 0 ? 'east' : 'west') : ''}${dx && dy ? ' and ' : ''}${dy ? (dy > 0 ? 'south' : 'north') : ''} of your selected cell.`);
      render();
    }
    function mark() {
      if (st.markers.length >= 4) st.markers.shift();
      st.markers.push({ ...st.selected });
      note('Marker placed. Use markers to compare overlapping hot, warm, and cold zones.');
      render();
    }
    function salvage() {
      if (st.found) return setup(true);
      const dist = distance(st.selected, st.wreck);
      const gain = Math.max(0, 180 - dist * 45 - st.risk + st.pings * 8 + st.drones * 10 + (st.deep ? 35 : 0));
      if (dist <= 1) {
        st.score += gain;
        st.found = true;
        tone('win');
        updateText(`Wreck recovered with ${dist === 0 ? 'perfect' : 'near'} coordinates. Salvage bonus added.`);
        note(`Recovered. +${gain} points. Start the next contract when ready.`);
      } else {
        st.risk = clamp(st.risk + 22, 0, 99);
        st.score = Math.max(0, st.score - 25);
        tone('bad');
        updateText('Salvage crew missed the wreck. Use the revealed miss to recover instead of guessing again.');
        note(`Missed by ${dist} cells. The wreck remains hidden, but your risk increased.`);
      }
      render();
    }

    root.addEventListener('click', (event) => {
      const action = event.target.closest('button')?.dataset.act;
      if (action === 'ping') ping();
      if (action === 'drone') drone();
      if (action === 'mark') mark();
      if (action === 'salvage') salvage();
      if (action === 'new') setup(true);
      if (action === 'sound') { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); tone('tap'); }
    });
    svg.addEventListener('pointerdown', (event) => {
      const rect = svg.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 76;
      select({ x: Math.floor((x - offX) / cell), y: Math.floor((y - offY) / cell) });
    });
    svg.addEventListener('keydown', (event) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'p', 'P', 'd', 'D', 'm', 'M', 'Enter'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowUp') select({ ...st.selected, y: st.selected.y - 1 });
      if (event.key === 'ArrowDown') select({ ...st.selected, y: st.selected.y + 1 });
      if (event.key === 'ArrowLeft') select({ ...st.selected, x: st.selected.x - 1 });
      if (event.key === 'ArrowRight') select({ ...st.selected, x: st.selected.x + 1 });
      if (event.key === 'p' || event.key === 'P') ping();
      if (event.key === 'd' || event.key === 'D') drone();
      if (event.key === 'm' || event.key === 'M') mark();
      if (event.key === 'Enter') salvage();
    });
    setup(false);
    note('Start with a center ping, then triangulate by checking one edge and one likely overlap.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();