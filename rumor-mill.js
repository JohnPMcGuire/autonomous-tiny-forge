(() => {
  const APP = { name: 'Rumor Mill', emoji: '🗞️', category: 'useful', version: '1.0.0', summary: 'Contain fast-moving rumors by balancing verification, corrections, trust, and attention.', description: 'A local information-resilience strategy game with spreading rumors, source confidence, verification cost, trust pressure, correction timing, adaptive scenarios, recoverable cascades, session-only crisis desk unlocks, scoring, responsive SVG/DOM rendering, touch and keyboard controls, reduced-motion behavior, optional local audio, and teardown.' };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const areas = [
    { id: 'harbor', name: 'Harbor', x: 18, y: 65 }, { id: 'market', name: 'Market', x: 35, y: 28 },
    { id: 'campus', name: 'Campus', x: 57, y: 42 }, { id: 'station', name: 'Station', x: 76, y: 24 },
    { id: 'clinic', name: 'Clinic', x: 79, y: 72 }, { id: 'council', name: 'Council', x: 47, y: 78 }
  ];
  const edges = [['harbor', 'market'], ['market', 'campus'], ['campus', 'station'], ['campus', 'clinic'], ['clinic', 'council'], ['council', 'harbor'], ['market', 'council'], ['station', 'clinic']];
  const scenarios = [
    { title: 'Bridge closure post', source: 'anonymous screenshot', trait: 'travels through commuter hubs', start: 'station' },
    { title: 'Clinic supply claim', source: 'secondhand group chat', trait: 'spikes trust loss near service nodes', start: 'clinic' },
    { title: 'Market safety rumor', source: 'cropped video', trait: 'jumps quickly after each quiet turn', start: 'market' },
    { title: 'Campus fee story', source: 'confident thread', trait: 'is plausible but poorly sourced', start: 'campus' }
  ];

  function style() {
    if ($('#rumor-mill-styles')) return;
    const sheet = document.createElement('style');
    sheet.id = 'rumor-mill-styles';
    sheet.textContent = `.rumor-card{animation:rumor-pop .24s ease both}.rumor-game{max-width:1100px;gap:14px}.rumor-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.rumor-stat,.rumor-map,.rumor-panel,.rumor-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.rumor-stat{padding:10px 12px}.rumor-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.rumor-stat strong{display:block;margin-top:4px}.rumor-layout{display:grid;grid-template-columns:1.08fr .92fr;gap:12px}.rumor-map{min-height:430px;padding:10px;background:linear-gradient(135deg,#f8fafc,#fff7ed);position:relative}.rumor-map svg{width:100%;height:390px;display:block}.rumor-edge{stroke:#94a3b8;stroke-width:3;stroke-linecap:round;opacity:.55}.rumor-node{cursor:pointer;touch-action:manipulation}.rumor-node circle{fill:#fff;stroke:#0f172a;stroke-width:2;filter:drop-shadow(0 8px 10px rgba(15,23,42,.1))}.rumor-node.is-hot circle{fill:#fee2e2;stroke:#ef4444}.rumor-node.is-focus circle{stroke:#2563eb;stroke-width:5}.rumor-node text{font-weight:900;fill:#0f172a;text-anchor:middle;dominant-baseline:middle;pointer-events:none}.rumor-pulse{fill:none;stroke:#ef4444;stroke-width:3;opacity:.5;animation:rumor-ring 1.6s ease-out infinite}.rumor-panel{padding:14px;display:grid;gap:12px}.rumor-brief{padding:13px;background:#f8fafc}.rumor-brief h3{margin:.2rem 0;font-size:1.25rem}.rumor-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.rumor-actions button{min-height:44px}.rumor-bars{display:grid;gap:7px}.rumor-bar{display:grid;grid-template-columns:82px 1fr 42px;gap:8px;align-items:center;font-size:.8rem;font-weight:800}.rumor-track{height:10px;border-radius:999px;background:#e2e8f0;overflow:hidden}.rumor-track span{display:block;height:100%;width:0;background:linear-gradient(90deg,#22c55e,#f59e0b,#ef4444)}.rumor-log{min-height:116px;padding:17px 19px}.rumor-tags{display:flex;flex-wrap:wrap;gap:6px}.rumor-tags span{border:1px solid var(--line);border-radius:999px;padding:4px 8px;background:#fff;font-size:.76rem;font-weight:800}.rumor-hand{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.rumor-cardlet{border:1px solid var(--line);border-radius:14px;padding:9px;background:#fff;min-height:70px}.rumor-cardlet strong{display:block}.rumor-cardlet small{color:var(--muted)}@media(max-width:860px){.rumor-hud{grid-template-columns:repeat(2,1fr)}.rumor-layout{grid-template-columns:1fr}.rumor-map svg{height:330px}.rumor-actions,.rumor-hand{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.rumor-card,.rumor-pulse{animation:none;transition:none}}@keyframes rumor-pop{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes rumor-ring{from{r:11;opacity:.55}to{r:25;opacity:0}}`;
    document.head.append(sheet);
  }

  function addCard() {
    const grid = $('#app-grid');
    const template = $('#app-card-template');
    if (!grid || !template || $('[data-rumor-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    style();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.rumorCard = 'true';
    card.classList.add('rumor-card');
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
    style();
    let tries = 0;
    const retry = () => { addCard(); if (!$('[data-rumor-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.rumorRefresh) return;
      button.dataset.rumorRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog');
    const stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Rumor%20Mill';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel rumor-game';
    root.innerHTML = `<div class="rumor-hud"><div class="rumor-stat"><span>Shift</span><strong id="rm-round">1 / 6</strong></div><div class="rumor-stat"><span>Hours</span><strong id="rm-hours">8</strong></div><div class="rumor-stat"><span>Trust</span><strong id="rm-trust">70</strong></div><div class="rumor-stat"><span>Spread</span><strong id="rm-spread">0</strong></div><div class="rumor-stat"><span>Score</span><strong id="rm-score">0</strong></div><div class="rumor-stat"><span>Best</span><strong id="rm-best">0</strong></div></div><div class="rumor-layout"><div class="rumor-map"><svg viewBox="0 0 100 100" role="img" aria-label="Rumor spread map"></svg><div class="rumor-hand" aria-label="Desk conditions"></div></div><div class="rumor-panel"><div class="rumor-brief"></div><div class="rumor-bars"></div><div class="rumor-actions"><button class="button" type="button" data-act="verify">Verify source</button><button class="button button-secondary" type="button" data-act="correct">Publish correction</button><button class="button button-secondary" type="button" data-act="listen">Listen locally</button><button class="button button-secondary" type="button" data-act="prebunk">Prebunk pattern</button><button class="button button-secondary" type="button" data-act="sound">Sound off</button><button class="button button-secondary" type="button" data-act="new">New desk</button></div></div></div><div class="result-card rumor-log" aria-live="polite"></div>`;
    stage.append(root);
    const svg = $('svg', root);
    const brief = $('.rumor-brief', root);
    const bars = $('.rumor-bars', root);
    const hand = $('.rumor-hand', root);
    const log = $('.rumor-log', root);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const st = { round: 1, rounds: 6, hours: 8, trust: 70, score: 0, best: 0, focus: 'market', scenario: scenarios[0], confidence: 25, heat: 15, prebunk: false, crisis: false, over: false, audio: false, ac: null, nodes: {} };
    areas.forEach((a) => { st.nodes[a.id] = { spread: 0, fatigue: 0, heard: false }; });
    const neighbors = (id) => edges.filter((edge) => edge.includes(id)).map((edge) => edge[0] === id ? edge[1] : edge[0]);
    const areaName = (id) => areas.find((area) => area.id === id)?.name || id;
    const totalSpread = () => areas.reduce((sum, area) => sum + st.nodes[area.id].spread, 0);

    function start() {
      st.round = 1; st.hours = 8; st.trust = 70; st.score = 0; st.over = false; st.confidence = 25; st.heat = 15; st.prebunk = false;
      areas.forEach((a) => { st.nodes[a.id] = { spread: 0, fatigue: 0, heard: false }; });
      st.scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      st.focus = st.scenario.start;
      st.nodes[st.focus].spread = 38;
      note('A new claim is moving. Pick a node, gather confidence, then decide when to correct.');
      render();
    }

    function spend(cost) {
      if (st.hours < cost) { note('Not enough hours. Use a smaller action or start a new desk.'); return false; }
      st.hours -= cost;
      return true;
    }

    function act(kind) {
      if (st.over && kind !== 'sound') return start();
      const node = st.nodes[st.focus];
      if (kind === 'verify' && spend(2)) { st.confidence = Math.min(100, st.confidence + 28 + (node.heard ? 7 : 0)); st.heat = Math.max(0, st.heat - 5); note(`Verified ${areaName(st.focus)}. Confidence rose, but the clock moved.`); tone(620); }
      if (kind === 'listen' && spend(1)) { node.heard = true; node.fatigue = Math.max(0, node.fatigue - 12); st.trust = Math.min(100, st.trust + 3); st.confidence = Math.min(100, st.confidence + 9); note(`Local listening made the claim easier to interpret in ${areaName(st.focus)}.`); tone(520); }
      if (kind === 'prebunk' && spend(2)) { st.prebunk = true; st.heat = Math.max(0, st.heat - 12); note('Pattern prebunk ready. The next spread step loses momentum.'); tone(430); }
      if (kind === 'correct' && spend(3)) { const power = Math.max(18, st.confidence - 20 + (node.heard ? 12 : 0)); node.spread = Math.max(0, node.spread - power); st.trust += st.confidence >= 55 ? 8 : -8; st.heat += st.confidence >= 55 ? -8 : 12; st.confidence = Math.max(15, st.confidence - 22); note(st.trust < 35 ? 'Correction landed too thin. Trust is fragile.' : 'Correction published. Stronger when evidence and listening are both present.'); tone(st.confidence >= 35 ? 740 : 240); }
      if (kind === 'sound') toggleSound();
      if (kind === 'new') return start();
      if (!['sound', 'new'].includes(kind)) advance();
      render();
    }

    function advance() {
      const before = totalSpread();
      areas.forEach((area) => {
        const node = st.nodes[area.id];
        if (node.spread > 15) neighbors(area.id).forEach((to) => {
          const target = st.nodes[to];
          const damp = st.prebunk ? 0.42 : 1;
          target.spread = Math.min(100, target.spread + Math.ceil((5 + node.spread / 16 + st.heat / 25) * damp));
        });
      });
      areas.forEach((area) => {
        const node = st.nodes[area.id];
        node.spread = Math.min(100, Math.max(0, node.spread + (node.fatigue / 30) - (node.heard ? 3 : 0)));
        node.fatigue = Math.min(100, node.fatigue + node.spread / 18);
      });
      st.prebunk = false;
      const after = totalSpread();
      st.trust = Math.max(0, Math.min(100, st.trust - Math.round(after / 180) - (after > before + 20 ? 3 : 0)));
      st.heat = Math.max(0, Math.min(100, st.heat + Math.round(after / 220)));
      st.round += 1;
      if (st.round > st.rounds || st.trust <= 0 || totalSpread() > 430) finish();
    }

    function finish() {
      st.over = true;
      const contained = Math.max(0, 420 - totalSpread());
      const trustBonus = st.trust * 6;
      st.score = Math.max(0, Math.round(st.score + contained + trustBonus - st.heat * 3));
      if (st.score > 650) st.crisis = true;
      st.best = Math.max(st.best, st.score);
      note(st.score > 760 ? 'Desk stabilized the information cascade. Crisis desk unlocked for this session.' : st.trust <= 0 ? 'Trust collapsed. Recovery will need listening before more corrections.' : 'Shift complete. Replay with a different timing strategy.');
      tone(st.score > 650 ? 860 : 260);
    }

    function note(text) {
      log.innerHTML = `<strong>${text}</strong><small>Use Tab to reach nodes and actions. Arrow keys move focus across the map.</small>`;
    }

    function render() {
      $('#rm-round', root).textContent = st.over ? 'Done' : `${Math.min(st.round, st.rounds)} / ${st.rounds}`;
      $('#rm-hours', root).textContent = st.hours;
      $('#rm-trust', root).textContent = Math.round(st.trust);
      $('#rm-spread', root).textContent = Math.round(totalSpread());
      $('#rm-score', root).textContent = Math.max(0, st.score);
      $('#rm-best', root).textContent = Math.max(0, st.best);
      brief.innerHTML = `<p class="eyebrow">${st.scenario.source}</p><h3>${st.scenario.title}</h3><p>${st.scenario.trait}. Focus: <strong>${areaName(st.focus)}</strong>.</p><div class="rumor-tags"><span>Confidence ${Math.round(st.confidence)}%</span><span>Heat ${Math.round(st.heat)}%</span><span>${st.prebunk ? 'Prebunk armed' : 'No prebunk'}</span>${st.crisis ? '<span>Crisis desk unlocked</span>' : ''}</div>`;
      bars.innerHTML = areas.map((area) => `<div class="rumor-bar"><span>${area.name}</span><div class="rumor-track"><span style="width:${st.nodes[area.id].spread}%"></span></div><b>${Math.round(st.nodes[area.id].spread)}</b></div>`).join('');
      hand.innerHTML = [`Evidence ${Math.round(st.confidence)}%`, `Trust ${Math.round(st.trust)}%`, `Heat ${Math.round(st.heat)}%`].map((text, index) => `<div class="rumor-cardlet"><strong>${text}</strong><small>${['Verify before correcting', 'Listen reduces fatigue', 'Prebunk slows spread'][index]}</small></div>`).join('');
      svg.innerHTML = edges.map(([a, b]) => { const A = areas.find((x) => x.id === a); const B = areas.find((x) => x.id === b); return `<line class="rumor-edge" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`; }).join('') + areas.map((area) => {
        const node = st.nodes[area.id];
        const hot = node.spread > 45;
        const pulse = hot && !reduced ? `<circle class="rumor-pulse" cx="${area.x}" cy="${area.y}" r="18"/>` : '';
        return `<g class="rumor-node ${hot ? 'is-hot' : ''} ${st.focus === area.id ? 'is-focus' : ''}" data-id="${area.id}" tabindex="0" role="button" aria-label="Focus ${area.name}, spread ${Math.round(node.spread)}"><circle cx="${area.x}" cy="${area.y}" r="10"></circle>${pulse}<text x="${area.x}" y="${area.y - 1}">${area.name[0]}</text><text x="${area.x}" y="${area.y + 16}" font-size="3.6">${area.name}</text></g>`;
      }).join('');
      $$('.rumor-node', svg).forEach((node) => {
        node.addEventListener('click', () => { st.focus = node.dataset.id; note(`Focused ${areaName(st.focus)}.`); render(); });
        node.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); st.focus = node.dataset.id; render(); } });
      });
    }

    function moveFocus(dir) {
      const index = areas.findIndex((area) => area.id === st.focus);
      st.focus = areas[(index + dir + areas.length) % areas.length].id;
      note(`Focused ${areaName(st.focus)}.`);
      render();
    }

    function toggleSound() {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) return note('Sound is not available here.');
      st.audio = !st.audio;
      $('[data-act="sound"]', root).textContent = st.audio ? 'Sound on' : 'Sound off';
      if (st.audio) { st.ac ||= new AudioEngine(); st.ac.resume(); tone(660); }
    }

    function tone(freq) {
      if (!st.audio || !st.ac) return;
      const now = st.ac.currentTime;
      const oscillator = st.ac.createOscillator();
      const gain = st.ac.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      oscillator.connect(gain).connect(st.ac.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
    }

    root.addEventListener('click', (event) => { const button = event.target.closest('[data-act]'); if (button) act(button.dataset.act); });
    root.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); moveFocus(1); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); moveFocus(-1); }
      if (event.key.toLowerCase() === 'v') act('verify');
      if (event.key.toLowerCase() === 'c') act('correct');
      if (event.key.toLowerCase() === 'l') act('listen');
      if (event.key.toLowerCase() === 'p') act('prebunk');
    });
    const close = () => { if (st.ac) st.ac.close().catch(() => {}); dialog.removeEventListener('close', close); };
    dialog.addEventListener('close', close);
    start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
