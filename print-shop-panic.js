(() => {
  const APP = {
    name: 'Print Shop Panic', emoji: '📰', category: 'play', version: '1.0.0',
    summary: 'Lay out urgent print jobs by balancing ink, alignment, deadlines, and client priorities.',
    description: 'A local layout-strategy game with draggable page plates, deadline pressure, ink and alignment tradeoffs, proofing, rework, unlockable foil jobs, scoring, keyboard and touch controls, reduced-motion behavior, optional audio, and teardown.'
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const lowMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const modes = {
    proof: { name: 'Proof desk', rounds: 4, ink: 24, time: 34, trust: 68, target: 420 },
    rush: { name: 'Rush edition', rounds: 5, ink: 22, time: 30, trust: 62, target: 600 },
    foil: { name: 'Foil night', rounds: 6, ink: 24, time: 28, trust: 60, target: 760 }
  };
  const jobs = [
    { title: 'Farmers market flyer', want: 'image', avoid: 'ad', deadline: 8 },
    { title: 'Storm notice insert', want: 'alert', avoid: 'image', deadline: 7 },
    { title: 'Concert poster', want: 'headline', avoid: 'coupon', deadline: 9 },
    { title: 'Clinic handout', want: 'body', avoid: 'ad', deadline: 8 },
    { title: 'Grand opening ad', want: 'coupon', avoid: 'alert', deadline: 7 },
    { title: 'Neighborhood digest', want: 'ad', avoid: 'coupon', deadline: 10 }
  ];
  const plates = [
    { id: 'headline', name: 'Headline', key: '1', ink: 3, width: 2, height: 1, value: 58 },
    { id: 'image', name: 'Photo block', key: '2', ink: 5, width: 2, height: 2, value: 74 },
    { id: 'body', name: 'Copy column', key: '3', ink: 2, width: 1, height: 2, value: 46 },
    { id: 'ad', name: 'Sponsor ad', key: '4', ink: 2, width: 1, height: 1, value: 34 },
    { id: 'coupon', name: 'Coupon strip', key: '5', ink: 3, width: 2, height: 1, value: 50 },
    { id: 'alert', name: 'Alert box', key: '6', ink: 4, width: 1, height: 1, value: 62 }
  ];

  function ensureStyles() {
    if ($('#print-shop-panic-styles')) return;
    const style = document.createElement('style');
    style.id = 'print-shop-panic-styles';
    style.textContent = `.psp-card{animation:psp-rise .24s ease both}.psp-game{max-width:1120px;gap:14px}.psp-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.psp-stat,.psp-board,.psp-panel,.psp-brief{border:1px solid var(--line);border-radius:18px;background:#fff}.psp-stat{padding:10px 12px}.psp-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.psp-stat strong{display:block;margin-top:4px}.psp-layout{display:grid;grid-template-columns:1.05fr .95fr;gap:12px}.psp-board{position:relative;min-height:420px;padding:16px;background:linear-gradient(135deg,#f8fafc,#e0f2fe);overflow:hidden}.psp-page{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:7px;max-width:420px;min-height:360px;margin:auto;padding:12px;border-radius:12px;background:#fefce8;box-shadow:0 18px 36px rgba(15,23,42,.18);transform:rotate(-1deg)}.psp-cell{border:1px dashed rgba(15,23,42,.22);border-radius:10px;background:rgba(255,255,255,.58);min-height:70px}.psp-cell.is-focus{outline:4px solid var(--accent);outline-offset:2px}.psp-piece{border:2px solid rgba(15,23,42,.75);border-radius:12px;background:#fff;color:#0f172a;display:grid;place-content:center;text-align:center;font-weight:900;font-size:.85rem;box-shadow:0 8px 18px rgba(15,23,42,.16);cursor:grab;touch-action:none;user-select:none}.psp-piece:focus-visible,.psp-bank button:focus-visible,.psp-actions button:focus-visible{outline:4px solid var(--accent);outline-offset:2px}.psp-piece.is-bad{background:#fee2e2}.psp-piece.is-star{background:#dcfce7}.psp-panel{padding:14px;display:grid;gap:12px}.psp-brief{padding:13px;background:#f8fafc}.psp-brief h3{margin:.2rem 0;font-size:1.12rem}.psp-bank{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.psp-bank button{min-height:48px}.psp-bank button.is-selected{box-shadow:0 0 0 3px #bae6fd inset}.psp-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.psp-actions button{min-height:44px}.psp-list{display:grid;gap:7px}.psp-chip{border:1px solid var(--line);border-radius:14px;background:#fff;padding:8px 10px;font-size:.82rem}.psp-chip.is-alert{background:#fee2e2}.psp-chip.is-good{background:#dcfce7}.psp-log{min-height:112px;padding:17px 19px}.psp-pop{animation:psp-pop .28s ease both}.psp-shake{animation:psp-shake .32s ease both}@media(max-width:860px){.psp-hud{grid-template-columns:repeat(2,1fr)}.psp-layout{grid-template-columns:1fr}.psp-board{min-height:380px}.psp-actions{grid-template-columns:1fr 1fr}}@media(max-width:520px){.psp-board,.psp-panel{padding:9px}.psp-page{min-height:312px;gap:5px;padding:8px}.psp-cell{min-height:58px}.psp-bank,.psp-actions{grid-template-columns:1fr}.psp-piece{font-size:.72rem}}@media(prefers-reduced-motion:reduce){.psp-card,.psp-pop,.psp-shake{animation:none;transition:none}}@keyframes psp-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes psp-pop{0%{transform:scale(.96)}70%{transform:scale(1.03)}100%{transform:none}}@keyframes psp-shake{0%,100%{transform:none}35%{transform:translateX(-5px)}70%{transform:translateX(5px)}}`;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid'), template = $('#app-card-template');
    if (!grid || !template || $('[data-print-shop-panic-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyles();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.printShopPanicCard = 'true';
    card.classList.add('psp-card');
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
    const retry = () => { addCard(); if (!$('[data-print-shop-panic-card]') && tries++ < 20) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.printShopPanicRefresh) return;
      button.dataset.printShopPanicRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog'), stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${label(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Print%20Shop%20Panic';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel psp-game';
    root.innerHTML = `<div class="psp-hud"><div class="psp-stat"><span>Mode</span><strong id="psp-mode">Proof desk</strong></div><div class="psp-stat"><span>Job</span><strong id="psp-round">1 / 4</strong></div><div class="psp-stat"><span>Time</span><strong id="psp-time">34</strong></div><div class="psp-stat"><span>Ink</span><strong id="psp-ink">24</strong></div><div class="psp-stat"><span>Trust</span><strong id="psp-trust">68</strong></div><div class="psp-stat"><span>Score</span><strong id="psp-score">0</strong></div></div><div class="psp-layout"><div class="psp-board" aria-label="Print layout board"><div class="psp-page" role="grid" aria-label="Four by four page grid"></div></div><div class="psp-panel"><div class="psp-brief"></div><div class="psp-bank" aria-label="Plate bank"></div><div class="psp-list" aria-label="Press status"></div><div class="psp-actions"><button class="button" type="button" data-act="print">Print job</button><button class="button button-secondary" type="button" data-act="proof">Proof page</button><button class="button button-secondary" type="button" data-act="clear">Clear page</button><button class="button button-secondary" type="button" data-act="mode">Change mode</button><button class="button button-secondary" type="button" data-act="reset">New shift</button><button class="button button-secondary" type="button" data-act="sound" aria-pressed="false">Sound off</button></div></div></div><div class="result-card psp-log" aria-live="polite"></div>`;
    stage.append(root);
    const st = { mode: 'proof', round: 1, time: 34, ink: 24, trust: 68, score: 0, selected: 'headline', placed: [], proofed: false, unlocked: false, sound: false, ac: null, focus: 0, low: lowMotion() };
    const page = $('.psp-page', root), bank = $('.psp-bank', root), brief = $('.psp-brief', root), status = $('.psp-list', root), log = $('.psp-log', root);
    dialog.addEventListener('close', () => { if (st.ac) st.ac.close().catch(() => {}); }, { once: true });
    function mode() { return modes[st.mode]; }
    function job() { return jobs[(st.round - 1 + (st.mode === 'rush' ? 1 : 0)) % jobs.length]; }
    function note(message) { log.innerHTML = `<strong>${message}</strong><small>Keyboard: 1-6 choose plates, arrows move focus, Space places, P proofs, Enter prints.</small>`; }
    function tone(kind) {
      if (!st.sound && kind !== 'bad') return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext; if (!AudioEngine) return;
      st.ac ||= new AudioEngine(); st.ac.resume();
      const osc = st.ac.createOscillator(), gain = st.ac.createGain();
      osc.type = kind === 'bad' ? 'sawtooth' : 'triangle'; osc.frequency.value = kind === 'good' ? 720 : kind === 'proof' ? 520 : 210;
      gain.gain.setValueAtTime(.0001, st.ac.currentTime); gain.gain.exponentialRampToValueAtTime(.055, st.ac.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, st.ac.currentTime + .2);
      osc.connect(gain).connect(st.ac.destination); osc.start(); osc.stop(st.ac.currentTime + .22);
    }
    function reset(next) {
      const keys = Object.keys(modes);
      st.mode = next || keys[(keys.indexOf(st.mode) + 1) % (st.unlocked ? 3 : 2)];
      const m = mode();
      st.round = 1; st.time = m.time; st.ink = m.ink; st.trust = m.trust; st.score = 0; st.selected = 'headline'; st.placed = []; st.proofed = false; st.focus = 0;
      render(); note(`${m.name} opened. Place plates, proof when alignment looks risky, then print before the deadline slips.`);
    }
    function canFit(p, cell) {
      const col = cell % 4, row = Math.floor(cell / 4);
      if (col + p.width > 4 || row + p.height > 4) return false;
      const taken = new Set(st.placed.flatMap((item) => cellsFor(item.plate, item.cell)));
      return cellsFor(p, cell).every((c) => c >= 0 && c < 16 && !taken.has(c));
    }
    function cellsFor(p, cell) {
      const cells = [];
      for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) cells.push(cell + x + y * 4);
      return cells;
    }
    function place(id, cell) {
      const p = plates.find((item) => item.id === id); if (!p) return;
      if (st.ink < p.ink) { st.trust -= 2; tone('bad'); render(); note('The press is too low on ink for that plate. Clear or print with a smaller layout.'); return; }
      if (!canFit(p, cell)) { st.time -= 1; st.trust -= 2; tone('bad'); render(); note('That plate does not fit there. The wasted adjustment cost one minute and some client confidence.'); return; }
      st.placed.push({ plate: p, cell }); st.ink -= p.ink; st.time -= 1; st.proofed = false; tone('proof'); render(); note(`${p.name} locked into the form. Decide whether the extra value is worth the remaining ink and time.`);
    }
    function proof() {
      if (!st.placed.length) { note('Proofing a blank page only annoys the night manager. Add at least one plate first.'); return; }
      st.time -= 2; st.proofed = true;
      const warning = alignmentRisk() > 1 ? 'Proof caught alignment risk. Printing now is safer, but the clock moved.' : 'Proof looks clean. The page should hold registration.';
      tone('proof'); render(); note(warning);
    }
    function clearPage() {
      const refund = Math.min(6, st.placed.reduce((sum, item) => sum + Math.ceil(item.plate.ink / 2), 0));
      st.ink += refund; st.time -= 3; st.placed = []; st.proofed = false; tone('bad'); render(); note(`The form was cleared. Recovered ${refund} ink, but reset cost three minutes.`);
    }
    function alignmentRisk() {
      const big = st.placed.filter((item) => item.plate.width * item.plate.height > 1).length;
      const crowded = st.placed.length > 4 ? 1 : 0;
      return Math.max(0, big + crowded - (st.proofed ? 2 : 0));
    }
    function printJob() {
      if (!st.placed.length) { note('Nothing is on the page yet. Place at least one plate before printing.'); return; }
      const j = job();
      let value = st.placed.reduce((sum, item) => sum + item.plate.value, 0);
      const ids = st.placed.map((item) => item.plate.id);
      if (ids.includes(j.want)) value += 95;
      if (ids.includes(j.avoid)) value -= 48;
      if (st.time >= j.deadline) value += 42; else { value -= (j.deadline - st.time) * 14; st.trust -= 4; }
      const risk = alignmentRisk();
      if (risk > 0) { value -= risk * 28; st.trust -= risk * 3; }
      if (st.mode === 'foil' && ids.length >= 4 && !ids.includes(j.avoid)) value += 40;
      const gain = Math.max(20, value);
      st.score += gain; st.trust += ids.includes(j.want) ? 4 : -2;
      st.round += 1; st.proofed = false; st.placed = []; st.focus = 0;
      if (st.round > mode().rounds) {
        const won = st.score >= mode().target && st.trust > 20;
        if (won && !st.unlocked) st.unlocked = true;
        render(); note(`${won ? 'Edition shipped.' : 'Edition limped out.'} Final score ${st.score}. ${st.unlocked ? 'Foil night is unlocked for this session.' : 'Hit the target with trust above 20 to unlock the foil shift.'}`); tone(won ? 'good' : 'bad'); return;
      }
      const refill = st.mode === 'rush' ? 9 : 11;
      st.time += 9; st.ink += refill;
      tone(gain > 150 ? 'good' : 'proof'); render(); note(`Printed for ${gain} points. New job is on the clipboard with ${refill} fresh ink.`);
    }
    function render() {
      const m = mode(), j = job();
      $('#psp-mode', root).textContent = m.name; $('#psp-round', root).textContent = `${Math.min(st.round, m.rounds)} / ${m.rounds}`; $('#psp-time', root).textContent = st.time; $('#psp-ink', root).textContent = st.ink; $('#psp-trust', root).textContent = st.trust; $('#psp-score', root).textContent = st.score;
      brief.innerHTML = `<h3>${j.title}</h3><p>Client wants <strong>${plates.find((p) => p.id === j.want).name}</strong>, dislikes <strong>${plates.find((p) => p.id === j.avoid).name}</strong>, and expects press-ready work by minute ${j.deadline}.</p>`;
      page.replaceChildren();
      for (let i = 0; i < 16; i++) {
        const cell = document.createElement('button'); cell.type = 'button'; cell.className = 'psp-cell'; cell.setAttribute('role', 'gridcell'); cell.setAttribute('aria-label', `Cell ${i + 1}`); if (i === st.focus) cell.classList.add('is-focus'); cell.addEventListener('click', () => { st.focus = i; place(st.selected, i); }); page.append(cell);
      }
      st.placed.forEach((item) => {
        const piece = document.createElement('button'); piece.type = 'button'; piece.className = 'psp-piece psp-pop'; piece.textContent = item.plate.name; piece.style.gridColumn = `${(item.cell % 4) + 1} / span ${item.plate.width}`; piece.style.gridRow = `${Math.floor(item.cell / 4) + 1} / span ${item.plate.height}`; piece.setAttribute('aria-label', `${item.plate.name} placed on page`); if (item.plate.id === j.want) piece.classList.add('is-star'); if (item.plate.id === j.avoid) piece.classList.add('is-bad'); page.append(piece);
      });
      bank.replaceChildren();
      plates.forEach((p) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = st.selected === p.id ? 'button button-secondary is-selected' : 'button button-secondary'; b.textContent = `${p.key}. ${p.name} · ${p.ink} ink`; b.setAttribute('aria-pressed', String(st.selected === p.id)); b.addEventListener('click', () => { st.selected = p.id; render(); note(`${p.name} selected. Tap a page cell, press Space, or drag mentally with the keyboard focus.`); }); bank.append(b);
      });
      const risk = alignmentRisk();
      status.innerHTML = `<div class="psp-chip ${st.time < j.deadline ? 'is-alert' : 'is-good'}">Deadline margin: ${st.time - j.deadline}</div><div class="psp-chip ${risk ? 'is-alert' : 'is-good'}">Alignment risk: ${risk ? `${risk} step${risk > 1 ? 's' : ''}` : 'clean'}</div><div class="psp-chip">Selected: ${plates.find((p) => p.id === st.selected).name}</div><div class="psp-chip">Session unlock: ${st.unlocked ? 'Foil night available' : 'locked'}</div>`;
      root.classList.toggle('psp-shake', st.trust < 20);
    }
    root.addEventListener('click', (event) => {
      const act = event.target?.dataset?.act;
      if (act === 'print') printJob();
      if (act === 'proof') proof();
      if (act === 'clear') clearPage();
      if (act === 'mode') reset();
      if (act === 'reset') reset(st.mode);
      if (act === 'sound') { st.sound = !st.sound; event.target.textContent = st.sound ? 'Sound on' : 'Sound off'; event.target.setAttribute('aria-pressed', String(st.sound)); tone('good'); }
    });
    root.addEventListener('keydown', (event) => {
      const plate = plates.find((p) => p.key === event.key); if (plate) { st.selected = plate.id; render(); event.preventDefault(); return; }
      if (event.key === 'ArrowRight') st.focus = Math.min(15, st.focus + 1);
      if (event.key === 'ArrowLeft') st.focus = Math.max(0, st.focus - 1);
      if (event.key === 'ArrowDown') st.focus = Math.min(15, st.focus + 4);
      if (event.key === 'ArrowUp') st.focus = Math.max(0, st.focus - 4);
      if (event.key === ' ') place(st.selected, st.focus);
      if (event.key === 'Enter') printJob();
      if (event.key.toLowerCase() === 'p') proof();
      render();
    });
    reset('proof');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();