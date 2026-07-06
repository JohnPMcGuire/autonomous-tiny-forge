(() => {
  const APP = {
    name: 'Runway Rush',
    emoji: '🛫',
    category: 'play',
    version: '1.0.0',
    summary: 'Sequence landings and departures across two runways without burning fuel or safety margin.',
    description: 'A local airport-operations strategy game with wake turbulence, fuel pressure, taxi queues, crosswinds, runway cooldowns, focus previews, adaptive banks, session-only night operations, scoring, touch and keyboard controls, optional local audio, reduced-motion behavior, and teardown.'
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const label = (value) => value === 'play' ? 'Play' : value === 'useful' ? 'Useful' : 'Experiment';
  const sizeWake = { light: 1, medium: 2, heavy: 3 };

  function style() {
    if ($('#runway-rush-styles')) return;
    const sheet = document.createElement('style');
    sheet.id = 'runway-rush-styles';
    sheet.textContent = `.rush-card{animation:rush-in .24s ease both}.rush-game{max-width:1020px;gap:14px}.rush-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.rush-stat{border:1px solid var(--line);border-radius:15px;background:#fff;padding:10px 12px}.rush-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.rush-stat strong{display:block;margin-top:4px}.rush-layout{display:grid;grid-template-columns:1.05fr .95fr;gap:12px}.rush-tower,.rush-strip,.rush-cardlet{border:1px solid var(--line);border-radius:22px;background:#fff;padding:14px}.rush-strip{background:linear-gradient(180deg,#dbeafe,#f8fafc);overflow:hidden}.rush-sky{width:100%;min-height:290px}.rush-runway{fill:#1f2937}.rush-center{stroke:#f8fafc;stroke-width:3;stroke-dasharray:12 12}.rush-plane{transition:transform .18s ease}.rush-plane text{font-weight:1000;font-size:17px}.rush-plane circle{fill:#fef3c7;stroke:#92400e;stroke-width:2}.rush-plane.is-selected circle{fill:#bbf7d0;stroke:#15803d;stroke-width:4}.rush-plane.is-danger circle{fill:#fecaca;stroke:#b91c1c}.rush-queue{display:grid;gap:8px;max-height:320px;overflow:auto;padding-right:3px}.rush-cardlet{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;text-align:left}.rush-cardlet button{all:unset;display:grid;grid-template-columns:subgrid;grid-column:1/-1;gap:9px;align-items:center;cursor:pointer}.rush-cardlet:focus-within{outline:4px solid var(--accent);outline-offset:2px}.rush-badge{width:38px;height:38px;border-radius:13px;background:#eff6ff;display:grid;place-items:center;font-weight:1000}.rush-cardlet.is-selected{border-color:#0ea5e9;background:#f0f9ff}.rush-cardlet.is-danger{border-color:#f87171;background:#fef2f2}.rush-plane-title{font-weight:1000}.rush-plane-meta{color:var(--muted);font-size:.82rem}.rush-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px}.rush-actions button{min-height:42px}.rush-log{min-height:112px;padding:17px 19px}.rush-meter{height:12px;border-radius:999px;background:#e2e8f0;overflow:hidden}.rush-meter span{display:block;height:100%;width:60%;background:linear-gradient(90deg,#22c55e,#facc15,#fb7185)}.rush-help{font-size:.82rem;color:var(--muted)}@media(max-width:820px){.rush-hud{grid-template-columns:repeat(2,1fr)}.rush-layout{grid-template-columns:1fr}.rush-sky{min-height:235px}.rush-actions{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.rush-card,.rush-plane{animation:none;transition:none}}@keyframes rush-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}`;
    document.head.append(sheet);
  }

  function addCard() {
    const grid = $('#app-grid');
    const template = $('#app-card-template');
    if (!grid || !template || $('[data-runway-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    style();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.runwayCard = 'true';
    card.classList.add('rush-card');
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
    const retry = () => { addCard(); if (!$('[data-runway-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.runwayRefresh) return;
      button.dataset.runwayRefresh = '1';
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
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Runway%20Rush';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel rush-game';
    root.innerHTML = `<div class="rush-hud"><div class="rush-stat"><span>Bank</span><strong id="rr-wave">1 / 7</strong></div><div class="rush-stat"><span>Safety</span><strong id="rr-safety">100</strong></div><div class="rush-stat"><span>Fuel risk</span><strong id="rr-risk">0</strong></div><div class="rush-stat"><span>Focus</span><strong id="rr-focus">3</strong></div><div class="rush-stat"><span>Ops</span><strong id="rr-ops">0</strong></div><div class="rush-stat"><span>Score</span><strong id="rr-score">0</strong></div></div><div class="rush-layout"><div class="rush-strip"><svg class="rush-sky" viewBox="0 0 640 360" role="img" aria-label="Airport runway view"></svg><div class="rush-meter" aria-label="Safety meter"><span id="rr-meter"></span></div></div><div class="rush-tower"><strong>Tower queue</strong><p class="rush-help">Select an aircraft, then choose a runway or recovery action. Heavy wake leaves longer cooldowns. Fuel and taxi patience drop after every decision.</p><div class="rush-queue" role="listbox" aria-label="Aircraft queue"></div><div class="rush-actions"><button class="button" type="button" data-act="north">Clear north</button><button class="button" type="button" data-act="south">Clear south</button><button class="button button-secondary" type="button" data-act="hold">Hold pattern</button><button class="button button-secondary" type="button" data-act="focus">Focus preview</button><button class="button button-secondary" type="button" data-act="swap">Priority swap</button><button class="button button-secondary" type="button" data-act="new">New bank</button></div></div></div><div class="result-card rush-log" aria-live="polite"></div><div class="tool-actions"></div>`;
    stage.append(root);

    const st = { wave: 1, waves: 7, score: 0, safety: 100, focus: 3, ops: 0, selected: 0, north: 0, south: 0, wind: 0, night: false, audio: false, ac: null, planes: [] };
    const svg = $('.rush-sky', root);
    const queue = $('.rush-queue', root);
    const log = $('.rush-log', root);
    const tools = $('.tool-actions', root);
    tools.append(makeButton('Sound off', toggleSound, true), makeButton('Night ops lock', toggleNight, true));
    $$('[data-act]', root).forEach((button) => button.addEventListener('click', () => act(button.dataset.act)));
    root.addEventListener('keydown', key);
    dialog.addEventListener('close', tear, { once: true });
    root.tabIndex = -1;
    root.focus();
    startBank();

    function makeButton(text, fn, secondary) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = secondary ? 'button button-secondary' : 'button';
      button.textContent = text;
      button.addEventListener('click', fn);
      return button;
    }

    function say(html) { log.innerHTML = html; }
    function activePlanes() { return st.planes.filter((plane) => !plane.done); }
    function selectedPlane() { const planes = activePlanes(); return planes[Math.min(st.selected, planes.length - 1)] || null; }

    function startBank() {
      st.north = Math.max(0, st.wave - 3);
      st.south = Math.max(0, st.wave - 4);
      st.wind = (st.wave % 3) + (st.night ? 1 : 0);
      st.focus = Math.min(5, 2 + Math.floor(st.wave / 2));
      st.safety = Math.min(100, st.safety + 7);
      st.planes = buildPlanes();
      st.selected = 0;
      say(`<strong>Bank ${st.wave} is inbound.</strong><small>Crosswind ${st.wind}. Sequence ${st.planes.length} aircraft while protecting wake spacing, fuel, taxi patience, and safety margin.</small>`);
      paint();
    }

    function buildPlanes() {
      const calls = ['Juniper', 'Mesa', 'Orchid', 'Pioneer', 'Vector', 'Cobalt', 'Sierra', 'Comet', 'Harbor'];
      const count = Math.min(7, 3 + st.wave + (st.night ? 1 : 0));
      return Array.from({ length: count }, (_, i) => {
        const type = (i + st.wave) % 3 === 0 ? 'depart' : 'land';
        const size = ['light', 'medium', 'heavy'][(i + st.wave + (st.night ? 1 : 0)) % 3];
        return { id: `${calls[(i + st.wave) % calls.length]} ${100 + st.wave * 7 + i}`, type, size, fuel: type === 'land' ? 4 + ((i + st.wave) % 3) : 7, taxi: type === 'depart' ? 4 + (i % 3) : 7, done: false, held: 0 };
      });
    }

    function paint() {
      const active = activePlanes();
      if (st.selected >= active.length) st.selected = Math.max(0, active.length - 1);
      svg.innerHTML = `<rect x="0" y="0" width="640" height="360" rx="28" fill="#dbeafe"></rect><path d="M80 105h480" class="rush-runway"></path><rect x="80" y="90" width="480" height="32" rx="16" class="rush-runway"></rect><line x1="100" y1="106" x2="540" y2="106" class="rush-center"></line><rect x="80" y="235" width="480" height="32" rx="16" class="rush-runway"></rect><line x1="100" y1="251" x2="540" y2="251" class="rush-center"></line><text x="86" y="75" fill="#0f172a" font-weight="900">North cooldown ${st.north}</text><text x="86" y="222" fill="#0f172a" font-weight="900">South cooldown ${st.south}</text><text x="412" y="75" fill="#0f172a" font-weight="900">Crosswind ${st.wind}</text>${active.map((plane, i) => planeSvg(plane, i)).join('')}`;
      queue.replaceChildren();
      active.forEach((plane, i) => {
        const item = document.createElement('div');
        item.className = 'rush-cardlet';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(i === st.selected));
        if (i === st.selected) item.classList.add('is-selected');
        if (plane.fuel <= 1 || plane.taxi <= 1) item.classList.add('is-danger');
        const need = plane.type === 'land' ? `fuel ${plane.fuel}` : `taxi ${plane.taxi}`;
        item.innerHTML = `<button type="button" aria-label="Select ${plane.id}"><span class="rush-badge">${plane.type === 'land' ? '↓' : '↑'}</span><span><span class="rush-plane-title">${plane.id}</span><span class="rush-plane-meta">${plane.size} ${plane.type} · ${need} · wake ${sizeWake[plane.size]}</span></span><span>${plane.held ? 'held' : ''}</span></button>`;
        item.querySelector('button').addEventListener('click', () => { st.selected = i; paint(); });
        queue.append(item);
      });
      $('#rr-wave', root).textContent = `${st.wave} / ${st.waves}`;
      $('#rr-safety', root).textContent = Math.max(0, st.safety);
      $('#rr-risk', root).textContent = active.filter((plane) => plane.fuel <= 1 || plane.taxi <= 1).length;
      $('#rr-focus', root).textContent = st.focus;
      $('#rr-ops', root).textContent = st.ops;
      $('#rr-score', root).textContent = st.score;
      $('#rr-meter', root).style.width = `${Math.max(4, Math.min(100, st.safety))}%`;
    }

    function planeSvg(plane, i) {
      const y = plane.type === 'land' ? 45 + i * 24 : 305 - i * 24;
      const x = 560 - (plane.fuel + plane.taxi) * 20;
      const danger = plane.fuel <= 1 || plane.taxi <= 1 ? ' is-danger' : '';
      const selected = i === st.selected ? ' is-selected' : '';
      const icon = plane.type === 'land' ? '↓' : '↑';
      return `<g class="rush-plane${selected}${danger}" transform="translate(${Math.max(70, x)} ${Math.max(32, Math.min(330, y))})"><circle r="17"></circle><text text-anchor="middle" dominant-baseline="central">${icon}</text></g>`;
    }

    function act(kind) {
      if (kind === 'north') clearRunway('north');
      if (kind === 'south') clearRunway('south');
      if (kind === 'hold') hold();
      if (kind === 'focus') focus();
      if (kind === 'swap') swap();
      if (kind === 'new') newRun();
    }

    function clearRunway(which) {
      const plane = selectedPlane();
      if (!plane) return;
      const cool = st[which];
      let risk = cool * 8 + st.wind * (plane.size === 'light' ? 4 : 2);
      if (plane.type === 'depart' && plane.taxi <= 1) risk += 8;
      if (plane.type === 'land' && plane.fuel <= 1) risk += 10;
      st.safety -= risk;
      st.score += Math.max(10, 80 - risk + sizeWake[plane.size] * 7);
      st.ops += 1;
      st[which] = sizeWake[plane.size] + (plane.size === 'heavy' ? 1 : 0);
      plane.done = true;
      beep(risk > 18 ? 180 : 620, .05);
      tick(plane.id);
      if (risk > 20) say(`<strong>${plane.id} cleared ${which}, but spacing was tight.</strong><small>Safety fell by ${risk}. Use holds, swaps, and focus previews before low-fuel aircraft force rushed clearances.</small>`);
      else say(`<strong>${plane.id} cleared ${which} cleanly.</strong><small>Wake cooldown is now ${st[which]}. Keep heavier aircraft from compressing the next slot.</small>`);
      checkEnd();
      paint();
    }

    function tick(doneId) {
      st.north = Math.max(0, st.north - 1);
      st.south = Math.max(0, st.south - 1);
      activePlanes().forEach((plane) => {
        if (plane.id === doneId) return;
        if (plane.type === 'land') plane.fuel -= 1;
        else plane.taxi -= 1;
        if (plane.fuel < 0 || plane.taxi < 0) {
          st.safety -= 12;
          plane.done = true;
          st.score = Math.max(0, st.score - 20);
          say(`<strong>${plane.id} diverted.</strong><small>The bank is recoverable, but the tower lost safety and score. Start the next bank with more spacing.</small>`);
        }
      });
    }

    function hold() {
      const plane = selectedPlane();
      if (!plane) return;
      plane.held += 1;
      st.safety -= plane.type === 'land' ? 3 : 1;
      st.score = Math.max(0, st.score - 5);
      tick('');
      beep(300, .04);
      say(`<strong>${plane.id} held for spacing.</strong><small>Holding buys runway cooldown, but landing fuel and departure patience still move.</small>`);
      checkEnd();
      paint();
    }

    function focus() {
      const plane = selectedPlane();
      if (!plane || st.focus <= 0) return say('<strong>No focus preview available.</strong><small>Clear or hold using visible risk.</small>');
      st.focus -= 1;
      const northRisk = st.north * 8 + st.wind * (plane.size === 'light' ? 4 : 2);
      const southRisk = st.south * 8 + st.wind * (plane.size === 'light' ? 4 : 2);
      beep(520, .04);
      say(`<strong>Focus preview for ${plane.id}.</strong><small>North risk ${northRisk}. South risk ${southRisk}. ${plane.size} wake will leave ${sizeWake[plane.size] + (plane.size === 'heavy' ? 1 : 0)} cooldown.</small>`);
      paint();
    }

    function swap() {
      const active = activePlanes();
      if (active.length < 2) return;
      const current = active[st.selected];
      const urgentIndex = active.findIndex((plane) => plane.fuel <= 1 || plane.taxi <= 1);
      const target = urgentIndex >= 0 ? urgentIndex : (st.selected + 1) % active.length;
      st.selected = target;
      st.score = Math.max(0, st.score - 3);
      beep(420, .04);
      say(`<strong>Priority changed.</strong><small>${current.id} remains queued. The selected aircraft is now ${active[target].id}.</small>`);
      paint();
    }

    function checkEnd() {
      if (activePlanes().length) return;
      if (st.safety <= 0) {
        say('<strong>Bank closed under emergency review.</strong><small>Recover by starting a new bank with a calmer sequence. Safety is restored to 58.</small>');
        st.safety = 58;
        st.wave = Math.max(1, st.wave - 1);
        setTimeout(startBank, 900);
        return;
      }
      st.score += st.safety + st.focus * 8;
      if (st.wave >= 3 && !st.night) say('<strong>Night ops unlocked.</strong><small>You can add a tougher night bank for more aircraft, higher crosswind, and better scoring.</small>');
      if (st.wave >= st.waves) {
        say(`<strong>Airport stabilized.</strong><small>Final score ${st.score}. Replay with night ops for denser banks and less forgiving crosswinds.</small>`);
        paint();
        return;
      }
      st.wave += 1;
      setTimeout(startBank, 900);
    }

    function toggleNight(event) {
      if (st.wave < 3 && !st.night) return say('<strong>Night ops locked.</strong><small>Clear three banks to unlock the late traffic push.</small>');
      st.night = !st.night;
      event.currentTarget.textContent = st.night ? 'Night ops on' : 'Night ops lock';
      event.currentTarget.setAttribute('aria-pressed', String(st.night));
      say(`<strong>Night ops ${st.night ? 'enabled' : 'disabled'}.</strong><small>The next bank will ${st.night ? 'add aircraft and crosswind for higher scoring' : 'return to daytime pressure'}.</small>`);
    }

    function toggleSound(event) {
      const Engine = window.AudioContext || window.webkitAudioContext;
      if (!Engine) return say('<strong>Sound is not available here.</strong><small>The game still works silently.</small>');
      st.audio = !st.audio;
      event.currentTarget.textContent = st.audio ? 'Sound on' : 'Sound off';
      event.currentTarget.setAttribute('aria-pressed', String(st.audio));
      if (st.audio) {
        st.ac ||= new Engine();
        st.ac.resume();
        beep(660, .06);
      }
    }

    function beep(freq, gainValue) {
      if (!st.audio || !st.ac) return;
      const now = st.ac.currentTime;
      const osc = st.ac.createOscillator();
      const gain = st.ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc.connect(gain).connect(st.ac.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }

    function key(event) {
      const active = activePlanes();
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); st.selected = Math.min(active.length - 1, st.selected + 1); paint(); }
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); st.selected = Math.max(0, st.selected - 1); paint(); }
      if (event.key === '1') { event.preventDefault(); clearRunway('north'); }
      if (event.key === '2') { event.preventDefault(); clearRunway('south'); }
      if (event.key.toLowerCase() === 'h') { event.preventDefault(); hold(); }
      if (event.key.toLowerCase() === 'f') { event.preventDefault(); focus(); }
      if (event.key.toLowerCase() === 's') { event.preventDefault(); swap(); }
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); newRun(); }
    }

    function newRun() {
      st.wave = 1;
      st.score = 0;
      st.safety = 100;
      st.ops = 0;
      st.north = 0;
      st.south = 0;
      startBank();
    }

    function tear() {
      if (st.ac && st.ac.state !== 'closed') st.ac.close().catch(() => {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
