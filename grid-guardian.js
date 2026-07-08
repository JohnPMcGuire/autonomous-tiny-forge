(() => {
  const APP = {
    name: 'Grid Guardian', emoji: '⚡', category: 'play', version: '1.0.0',
    summary: 'Dispatch a fragile microgrid through demand spikes, storage limits, outages, and blackout risk.',
    description: 'A local power-grid strategy game with neighborhood demand, solar and gas dispatch, batteries, repair crews, rolling outage recovery, adaptive heat waves, session-only island mode, scoring, keyboard and touch controls, reduced-motion behavior, optional audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const zones = [
    { name: 'Clinic', icon: '✚', demand: 3, priority: 5 },
    { name: 'Homes', icon: '⌂', demand: 4, priority: 3 },
    { name: 'Cooling center', icon: '❄', demand: 3, priority: 4 },
    { name: 'Factory', icon: '▣', demand: 5, priority: 2 },
    { name: 'Water pumps', icon: '≈', demand: 3, priority: 5 },
    { name: 'Market', icon: '◇', demand: 2, priority: 2 }
  ];
  const modes = {
    normal: { name: 'Summer evening', rounds: 6, gas: 8, battery: 5, repairs: 2, quota: 390 },
    heat: { name: 'Heat wave', rounds: 7, gas: 8, battery: 5, repairs: 2, quota: 500 },
    island: { name: 'Island mode', rounds: 8, gas: 7, battery: 6, repairs: 3, quota: 610 }
  };
  const lowMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ensureStyles() {
    if ($('#grid-guardian-styles')) return;
    const style = document.createElement('style');
    style.id = 'grid-guardian-styles';
    style.textContent = `
      .gg-card{animation:gg-rise .24s ease both}.gg-game{max-width:1120px;gap:14px}.gg-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.gg-stat,.gg-map,.gg-panel,.gg-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.gg-stat{padding:10px 12px}.gg-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.gg-stat strong{display:block;margin-top:4px}.gg-layout{display:grid;grid-template-columns:1.08fr .92fr;gap:12px}.gg-map{padding:12px;background:linear-gradient(135deg,#0f172a,#1e3a5f);color:#fff;overflow:hidden}.gg-grid{display:grid;grid-template-columns:repeat(3,minmax(70px,1fr));gap:8px;touch-action:manipulation}.gg-zone{min-height:106px;border:1px solid rgba(255,255,255,.24);border-radius:16px;background:rgba(255,255,255,.1);color:#fff;display:grid;align-content:center;justify-items:center;gap:4px;position:relative;padding:10px;text-align:center}.gg-zone:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.gg-zone.is-selected{box-shadow:0 0 0 3px #fde68a inset}.gg-zone.is-powered{background:rgba(34,197,94,.2)}.gg-zone.is-shed{background:rgba(251,191,36,.18)}.gg-zone.is-out{background:repeating-linear-gradient(135deg,rgba(239,68,68,.28),rgba(239,68,68,.28) 8px,rgba(15,23,42,.35) 8px,rgba(15,23,42,.35) 16px)}.gg-icon{font-size:clamp(1.2rem,4vw,1.9rem);line-height:1}.gg-demand{position:absolute;right:7px;top:6px;font-size:.65rem;border-radius:999px;padding:2px 6px;background:rgba(15,23,42,.78)}.gg-state{font-size:.68rem;font-weight:900;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,.78)}.gg-panel{padding:14px;display:grid;gap:12px}.gg-brief{padding:13px;background:#f8fafc}.gg-brief h3{margin:.2rem 0;font-size:1.12rem}.gg-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.gg-actions button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.gg-list{display:grid;gap:7px}.gg-chip{border:1px solid var(--line);border-radius:14px;background:#fff;padding:8px 10px;font-size:.82rem}.gg-chip.is-risk{background:#fee2e2}.gg-chip.is-good{background:#dcfce7}.gg-log{min-height:104px;padding:17px 19px}.gg-pulse{animation:gg-pulse .7s ease both}@media(max-width:860px){.gg-hud{grid-template-columns:repeat(2,1fr)}.gg-layout{grid-template-columns:1fr}.gg-actions{grid-template-columns:1fr 1fr}}@media(max-width:520px){.gg-map,.gg-panel{padding:9px}.gg-grid{grid-template-columns:repeat(2,1fr);gap:6px}.gg-zone{min-height:88px;border-radius:12px}.gg-actions{grid-template-columns:1fr}.gg-icon{font-size:1.1rem}}@media(prefers-reduced-motion:reduce){.gg-card,.gg-pulse{animation:none;transition:none}}@keyframes gg-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes gg-pulse{0%{transform:scale(.98)}50%{transform:scale(1.03)}100%{transform:none}}
    `;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-grid-guardian-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.gridGuardianCard = 'true';
    card.classList.add('gg-card');
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
    const retry = () => { addCard(); if (!$('[data-grid-guardian-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.gridGuardianRefresh) return;
      button.dataset.gridGuardianRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Grid%20Guardian';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel gg-game';
    root.innerHTML = `<div class="gg-hud"><div class="gg-stat"><span>Mode</span><strong id="gg-mode">Summer evening</strong></div><div class="gg-stat"><span>Round</span><strong id="gg-round">1 / 6</strong></div><div class="gg-stat"><span>Supply</span><strong id="gg-supply">0</strong></div><div class="gg-stat"><span>Battery</span><strong id="gg-battery">5</strong></div><div class="gg-stat"><span>Repairs</span><strong id="gg-repairs">2</strong></div><div class="gg-stat"><span>Score</span><strong id="gg-score">0</strong></div></div><div class="gg-layout"><div class="gg-map"><div class="gg-grid" aria-label="Microgrid neighborhood map"></div></div><div class="gg-panel"><div class="gg-brief"></div><div class="gg-list" aria-label="Grid status"></div><div class="gg-actions"><button class="button" type="button" data-act="power">Power selected</button><button class="button button-secondary" type="button" data-act="shed">Shed selected</button><button class="button button-secondary" type="button" data-act="battery">Use battery</button><button class="button button-secondary" type="button" data-act="repair">Repair fault</button><button class="button button-secondary" type="button" data-act="next">Next interval</button><button class="button button-secondary" type="button" data-act="mode">Change mode</button><button class="button button-secondary" type="button" data-act="reset">New grid</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card gg-log" aria-live="polite"></div>`;
    stage.append(root);
    const grid = $('.gg-grid', root), brief = $('.gg-brief', root), list = $('.gg-list', root), log = $('.gg-log', root);
    const st = { mode: 'normal', round: 1, gas: 8, battery: 5, repairs: 2, supply: 0, score: 0, selected: 0, powered: new Set(), shed: new Set(), faults: new Set(), sound: false, ac: null, unlocked: false, low: lowMotion() };
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });
    function currentMode() { return modes[st.mode]; }
    function demand(z, i) { return z.demand + (st.mode !== 'normal' ? (st.round > 3 && (i === 1 || i === 2) ? 2 : 1) : 0) + (st.faults.has(i) ? 1 : 0); }
    function solar() { return [3, 4, 5, 4, 2, 1, 0, 0][st.round - 1] || 0; }
    function available() { return solar() + st.gas + st.supply; }
    function usedLoad() { return [...st.powered].reduce((sum, i) => sum + demand(zones[i], i), 0); }
    function spare() { return available() - usedLoad(); }
    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: arrows choose a district, Enter powers, S sheds, B uses battery, R repairs, N advances.</small>`; }
    function tone(kind) {
      if (!st.sound && kind !== 'bad') return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume();
      const osc = st.ac.createOscillator(), gain = st.ac.createGain();
      osc.type = kind === 'bad' ? 'sawtooth' : 'triangle'; osc.frequency.value = kind === 'good' ? 680 : kind === 'tick' ? 420 : 160;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.055, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .22);
      osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .24);
    }
    function makeFaults() {
      if (st.round % 2 !== 0) return;
      const candidates = zones.map((_, i) => i).filter((i) => !st.faults.has(i));
      for (let n = 0, count = st.mode === 'island' ? 2 : 1; n < count && candidates.length; n++) st.faults.add(candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0]);
    }
    function reset(next) {
      const keys = Object.keys(modes);
      st.mode = next || keys[(keys.indexOf(st.mode) + 1) % (st.unlocked ? 3 : 2)];
      const m = currentMode();
      st.round = 1; st.gas = m.gas; st.battery = m.battery; st.repairs = m.repairs; st.supply = 0; st.score = 0; st.selected = 0;
      st.powered.clear(); st.shed.clear(); st.faults.clear(); render(); note(`${m.name} ready. Balance critical loads, storage, repairs, and controlled outages.`);
    }
    function power() {
      if (st.round > currentMode().rounds) return reset(st.mode);
      const i = st.selected, z = zones[i], need = demand(z, i);
      if (st.faults.has(i)) return note(`${z.name} has a feeder fault. Repair it before restoring power.`);
      if (st.powered.has(i)) return note(`${z.name} is already powered.`);
      if (spare() < need) return note(`Not enough supply for ${z.name}. Use battery, shed a lower-priority load, or wait for the next interval.`);
      st.powered.add(i); st.shed.delete(i); tone('good'); render(); note(`${z.name} restored. Remaining margin: ${spare()}.`);
    }
    function shed() { const i = st.selected, z = zones[i]; st.powered.delete(i); st.shed.add(i); tone('tick'); render(); note(`${z.name} is in a controlled outage. It saves load but costs trust if repeated.`); }
    function battery() { if (st.battery <= 0) return note('Battery reserve is empty. Advance to the next interval and hope solar recovers.'); st.battery -= 1; st.supply += 2; tone('good'); render(); note('Battery discharged for +2 temporary supply. Use it before the interval ends.'); }
    function repair() {
      const i = st.selected, z = zones[i];
      if (!st.faults.has(i)) return note(`${z.name} has no active fault.`);
      if (st.repairs <= 0) return note('No repair crews remain. Choose controlled outages and prioritize critical districts.');
      st.repairs -= 1; st.faults.delete(i); tone('good'); render(); note(`${z.name} feeder repaired. You can restore it if supply margin allows.`);
    }
    function next() {
      if (st.round > currentMode().rounds) return reset(st.mode);
      const served = zones.reduce((sum, z, i) => sum + (st.powered.has(i) ? z.priority * 18 : st.shed.has(i) ? -z.priority * 5 : -z.priority * 9), 0);
      st.score += Math.max(0, served + Math.max(0, Math.min(24, spare() * 4)) - st.faults.size * 10);
      st.round += 1; st.supply = 0; st.powered.clear(); st.shed.clear();
      if (st.round <= currentMode().rounds) makeFaults();
      if (st.round > currentMode().rounds) finish(); else { tone('tick'); render(); note('Next interval. Demand shifted and temporary battery supply expired. Re-dispatch before outages cascade.'); }
    }
    function finish() {
      const success = st.score >= currentMode().quota;
      if (success && !st.unlocked) { st.unlocked = true; note(`Grid stabilized at ${st.score}. Island mode unlocked for this session.`); }
      else note(success ? `Grid held with ${st.score} reliability points.` : `Blackout risk stayed high at ${st.score}. Replay with earlier shedding and repair timing.`);
      render();
    }
    function render() {
      const m = currentMode();
      $('#gg-mode', root).textContent = m.name; $('#gg-round', root).textContent = `${Math.min(st.round, m.rounds)} / ${m.rounds}`; $('#gg-supply', root).textContent = `${available()} total`; $('#gg-battery', root).textContent = st.battery; $('#gg-repairs', root).textContent = st.repairs; $('#gg-score', root).textContent = st.score;
      brief.innerHTML = `<h3>${m.name}</h3><p>Solar ${solar()}, gas ${st.gas}, battery boost ${st.supply}. Served load ${usedLoad()} of ${available()}; margin ${spare()}.</p>`;
      list.innerHTML = zones.map((z, i) => {
        const state = st.faults.has(i) ? 'Fault' : st.powered.has(i) ? 'Powered' : st.shed.has(i) ? 'Shed' : 'Waiting';
        return `<div class="gg-chip ${st.faults.has(i) ? 'is-risk' : st.powered.has(i) ? 'is-good' : ''}">${z.icon} ${z.name}: demand ${demand(z, i)}, priority ${z.priority}, ${state}</div>`;
      }).join('');
      grid.replaceChildren();
      zones.forEach((z, i) => {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = `gg-zone ${i === st.selected ? 'is-selected ' : ''}${st.faults.has(i) ? 'is-out' : st.powered.has(i) ? 'is-powered' : st.shed.has(i) ? 'is-shed' : ''}`;
        cell.innerHTML = `<span class="gg-demand">${demand(z, i)} MW</span><span class="gg-icon" aria-hidden="true">${z.icon}</span><strong>${z.name}</strong><span class="gg-state">${st.faults.has(i) ? 'Fault' : st.powered.has(i) ? 'Powered' : st.shed.has(i) ? 'Shed' : 'Waiting'}</span>`;
        cell.setAttribute('aria-label', `${z.name}, demand ${demand(z, i)}, priority ${z.priority}`);
        cell.addEventListener('click', () => { st.selected = i; render(); });
        grid.append(cell);
      });
      if (!st.low) root.classList.add('gg-pulse'), setTimeout(() => root.classList.remove('gg-pulse'), 220);
    }
    root.addEventListener('click', (event) => {
      const act = event.target.closest('button')?.dataset.act; if (!act) return;
      if (act === 'power') power(); if (act === 'shed') shed(); if (act === 'battery') battery(); if (act === 'repair') repair(); if (act === 'next') next(); if (act === 'mode') reset(); if (act === 'reset') reset(st.mode);
      if (act === 'sound') { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); if (st.sound) tone('good'); }
    });
    root.addEventListener('keydown', (event) => {
      const k = event.key.toLowerCase();
      if (['arrowright','arrowdown','arrowleft','arrowup'].includes(k)) { event.preventDefault(); const d = k === 'arrowright' || k === 'arrowdown' ? 1 : -1; st.selected = (st.selected + d + zones.length) % zones.length; render(); }
      if (event.key === 'Enter') power(); if (k === 's') shed(); if (k === 'b') battery(); if (k === 'r') repair(); if (k === 'n') next();
    });
    reset('normal');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
