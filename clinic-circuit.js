(() => {
  const APP = {
    name: 'Clinic Circuit',
    emoji: '🏥',
    category: 'useful',
    version: '1.0.0',
    summary: 'Triage a small clinic by routing patients through rooms, supplies, isolation, and follow-up.',
    description: 'A local clinic-flow strategy game with acuity, waiting risk, contagion pressure, limited rooms, nurse focus, supply tradeoffs, follow-up recovery, adaptive waves, scoring, touch and keyboard controls, optional local audio, reduced-motion behavior, and teardown.'
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const categoryLabel = (value) => value === 'play' ? 'Play' : value === 'useful' ? 'Useful' : 'Experiment';

  function ensureStyle() {
    if ($('#clinic-circuit-styles')) return;
    const sheet = document.createElement('style');
    sheet.id = 'clinic-circuit-styles';
    sheet.textContent = `.clinic-card{animation:clinic-rise .24s ease both}.clinic-game{max-width:1050px;gap:14px}.clinic-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.clinic-stat{border:1px solid var(--line);border-radius:15px;background:#fff;padding:10px 12px}.clinic-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.clinic-stat strong{display:block;margin-top:4px}.clinic-layout{display:grid;grid-template-columns:1fr .95fr;gap:12px}.clinic-map,.clinic-panel,.clinic-log{border:1px solid var(--line);border-radius:22px;background:#fff;padding:14px}.clinic-map{background:linear-gradient(180deg,#ecfeff,#f8fafc);overflow:hidden}.clinic-board{width:100%;min-height:310px}.clinic-room{fill:#fff;stroke:#94a3b8;stroke-width:2}.clinic-room.is-open{stroke:#0ea5e9;stroke-width:4}.clinic-room.is-warn{stroke:#f59e0b;stroke-width:4}.clinic-room-label{font-weight:1000;font-size:15px;fill:#0f172a}.clinic-patient circle{stroke:#0f172a;stroke-width:2;fill:#e0f2fe}.clinic-patient.is-critical circle{fill:#fecaca}.clinic-patient.is-fever circle{fill:#fde68a}.clinic-patient.is-selected circle{stroke:#16a34a;stroke-width:5}.clinic-queue{display:grid;gap:8px;max-height:330px;overflow:auto;padding-right:3px}.clinic-patient-card{border:1px solid var(--line);border-radius:18px;background:#fff;display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;padding:0}.clinic-patient-card button{all:unset;display:grid;grid-template-columns:subgrid;grid-column:1/-1;gap:9px;align-items:center;padding:10px;cursor:pointer}.clinic-patient-card:focus-within{outline:4px solid var(--accent);outline-offset:2px}.clinic-patient-card.is-selected{border-color:#16a34a;background:#f0fdf4}.clinic-patient-card.is-danger{border-color:#ef4444;background:#fef2f2}.clinic-badge{width:38px;height:38px;border-radius:13px;display:grid;place-items:center;background:#ecfeff;font-weight:1000}.clinic-name{font-weight:1000}.clinic-meta{color:var(--muted);font-size:.82rem}.clinic-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px}.clinic-actions button{min-height:42px}.clinic-log{min-height:112px}.clinic-help{font-size:.82rem;color:var(--muted)}.clinic-meter{height:12px;border-radius:999px;background:#e2e8f0;overflow:hidden}.clinic-meter span{display:block;height:100%;width:65%;background:linear-gradient(90deg,#22c55e,#facc15,#fb7185)}@media(max-width:860px){.clinic-layout{grid-template-columns:1fr}.clinic-hud{grid-template-columns:repeat(2,1fr)}.clinic-board{min-height:250px}.clinic-actions{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.clinic-card,.clinic-patient{animation:none;transition:none}}@keyframes clinic-rise{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}`;
    document.head.append(sheet);
  }

  function addCard() {
    const grid = $('#app-grid');
    const template = $('#app-card-template');
    if (!grid || !template || $('[data-clinic-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    ensureStyle();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.clinicCard = 'true';
    card.classList.add('clinic-card');
    $('.app-icon', node).textContent = APP.emoji;
    $('.app-meta', node).textContent = `${categoryLabel(APP.category)} · v${APP.version}`;
    $('.app-name', node).textContent = APP.name;
    $('.app-summary', node).textContent = APP.summary;
    const button = $('.app-card-button', node);
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', open);
    grid.append(node);
  }

  function boot() {
    ensureStyle();
    let tries = 0;
    const retry = () => { addCard(); if (!$('[data-clinic-card]') && tries++ < 22) setTimeout(retry, 120); };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.clinicRefresh) return;
      button.dataset.clinicRefresh = '1';
      button.addEventListener('click', () => setTimeout(addCard, 0));
    });
  }

  function open() {
    const dialog = $('#app-dialog');
    const stage = $('#app-stage');
    if (!dialog || !stage) return;
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = `${categoryLabel(APP.category)} · ${APP.emoji}`;
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Clinic%20Circuit';
    stage.replaceChildren();
    renderGame(stage, dialog);
    dialog.showModal();
  }

  function renderGame(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel clinic-game';
    root.innerHTML = `<div class="clinic-hud"><div class="clinic-stat"><span>Wave</span><strong id="cc-wave">1 / 7</strong></div><div class="clinic-stat"><span>Trust</span><strong id="cc-trust">100</strong></div><div class="clinic-stat"><span>Infection</span><strong id="cc-infection">0</strong></div><div class="clinic-stat"><span>Focus</span><strong id="cc-focus">3</strong></div><div class="clinic-stat"><span>Supplies</span><strong id="cc-supplies">4</strong></div><div class="clinic-stat"><span>Score</span><strong id="cc-score">0</strong></div></div><div class="clinic-layout"><div class="clinic-map"><svg class="clinic-board" viewBox="0 0 640 360" role="img" aria-label="Clinic rooms and queue map"></svg><div class="clinic-meter" aria-label="Trust meter"><span id="cc-meter"></span></div></div><div class="clinic-panel"><strong>Patient queue</strong><p class="clinic-help">Select a patient, then route them. Critical cases need exam first. Fever cases raise infection unless isolated. Follow-up restores trust but costs focus.</p><div class="clinic-queue" role="listbox" aria-label="Waiting patients"></div><div class="clinic-actions"><button class="button" type="button" data-act="exam">Exam room</button><button class="button" type="button" data-act="treat">Treatment bay</button><button class="button" type="button" data-act="isolate">Isolation</button><button class="button" type="button" data-act="follow">Follow-up call</button><button class="button button-secondary" type="button" data-act="supply">Spend supply</button><button class="button button-secondary" type="button" data-act="focus">Focus preview</button><button class="button button-secondary" type="button" data-act="sound">Sound off</button><button class="button button-secondary" type="button" data-act="restart">Restart</button></div></div></div><div class="clinic-log result-card" aria-live="polite"><strong>Clinic opens.</strong><small>Route the first wave before wait times turn into trust loss.</small></div>`;
    stage.append(root);

    const svg = $('.clinic-board', root);
    const queueEl = $('.clinic-queue', root);
    const log = $('.clinic-log', root);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let audioContext;
    let sound = false;
    let wave = 1;
    let trust = 100;
    let infection = 0;
    let focus = 3;
    let supplies = 4;
    let score = 0;
    let selected = null;
    let roomBusy = { exam: 0, treat: 0, isolate: 0 };
    let nightClinic = false;
    let patients = [];
    let disposed = false;

    const names = ['Ari', 'Bea', 'Cruz', 'Dee', 'Eli', 'Flo', 'Gray', 'Hana', 'Ivo', 'June', 'Kai', 'Luz'];
    const concerns = ['chest pressure', 'sprained wrist', 'fever', 'dizzy spell', 'follow-up pain', 'rash', 'lab callback', 'short breath'];

    const rand = (max) => Math.floor(Math.random() * max);
    const chosen = () => patients.find((item) => item.id === selected) || patients[0];
    const tone = (kind) => {
      if (!sound) return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) return;
      audioContext ||= new AudioEngine();
      audioContext.resume();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.value = kind === 'bad' ? 170 : kind === 'win' ? 660 : 420;
      gain.gain.setValueAtTime(0.001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.045, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.18);
      osc.connect(gain).connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + 0.2);
    };

    function makePatient(index) {
      const acuity = Math.min(5, 1 + rand(3) + (wave > 3 ? rand(2) : 0) + (nightClinic ? 1 : 0));
      const fever = Math.random() < 0.28 + wave * 0.025;
      return {
        id: `p${Date.now()}${index}${rand(99)}`,
        name: names[rand(names.length)],
        concern: fever ? 'fever' : concerns[rand(concerns.length)],
        acuity,
        fever,
        wait: 2 + rand(3),
        seen: false,
        helped: false
      };
    }

    function newWave() {
      const count = Math.min(7, 3 + Math.floor(wave / 2) + (nightClinic ? 1 : 0));
      patients = Array.from({ length: count }, (_, i) => makePatient(i));
      selected = patients[0]?.id || null;
      roomBusy = { exam: Math.max(0, roomBusy.exam - 1), treat: Math.max(0, roomBusy.treat - 1), isolate: Math.max(0, roomBusy.isolate - 1) };
      write(`Wave ${wave} arrives.`, nightClinic ? 'Night clinic adds one extra patient and less patience.' : 'Balance acuity, fever risk, and limited rooms.');
      update();
    }

    function write(head, detail) {
      log.innerHTML = `<strong>${head}</strong><small>${detail}</small>`;
    }

    function advance() {
      roomBusy.exam = Math.max(0, roomBusy.exam - 1);
      roomBusy.treat = Math.max(0, roomBusy.treat - 1);
      roomBusy.isolate = Math.max(0, roomBusy.isolate - 1);
      let lost = 0;
      let spread = 0;
      patients.forEach((p) => {
        p.wait -= 1;
        if (p.wait < 0) lost += p.acuity + (p.fever ? 2 : 0);
        if (p.fever && !p.helped) spread += 1;
      });
      trust = Math.max(0, trust - lost);
      infection = Math.min(100, infection + Math.max(0, spread - roomBusy.isolate));
      if (trust <= 0 || infection >= 100) end(false);
    }

    function completePatient(patient, points, message) {
      patients = patients.filter((item) => item.id !== patient.id);
      score += points;
      selected = patients[0]?.id || null;
      if (!patients.length) {
        wave += 1;
        if (wave === 5) { nightClinic = true; supplies += 2; write('Night clinic unlocked.', 'Higher acuity arrives, but two emergency kits are added.'); }
        if (wave > 7) return end(true);
        setTimeout(() => { if (!disposed) newWave(); }, reducedMotion ? 0 : 350);
      } else {
        write(message, `${patient.name} is cleared. ${patients.length} patient${patients.length === 1 ? '' : 's'} remain.`);
      }
      update();
    }

    function act(action) {
      const patient = chosen();
      if (action === 'restart') return restart();
      if (action === 'sound') {
        sound = !sound;
        $('[data-act="sound"]', root).textContent = sound ? 'Sound on' : 'Sound off';
        tone('ok');
        return;
      }
      if (!patient) return;
      if (action === 'focus') {
        if (focus <= 0) return write('No focus left.', 'Use treatment, isolation, or follow-up instead.');
        focus -= 1;
        const best = patients.slice().sort((a, b) => (b.acuity + (b.fever ? 2 : 0) - b.wait) - (a.acuity + (a.fever ? 2 : 0) - a.wait))[0];
        selected = best.id;
        tone('ok');
        write('Focus preview.', `${best.name} should move next: acuity ${best.acuity}, ${best.fever ? 'fever risk' : 'no fever flag'}, wait ${best.wait}.`);
        update();
        return;
      }
      if (action === 'supply') {
        if (supplies <= 0) return write('No supplies left.', 'Recover by finishing a wave cleanly.');
        supplies -= 1;
        patient.wait += 2;
        patient.acuity = Math.max(1, patient.acuity - 1);
        tone('ok');
        advance();
        write('Supply kit used.', `${patient.name} gains time and one acuity step drops.`);
        update();
        return;
      }
      if (action === 'follow') {
        if (focus <= 0) return write('Follow-up needs focus.', 'Use a room action or supply kit instead.');
        focus -= 1;
        trust = Math.min(100, trust + 6);
        patient.wait += 1;
        score += 8;
        tone('ok');
        advance();
        write('Follow-up call made.', 'Trust improves, but the queue still ages.');
        update();
        return;
      }
      if (roomBusy[action] > 0) {
        tone('bad');
        trust = Math.max(0, trust - 5);
        write('Room is still turning over.', 'A rushed assignment costs trust. Choose another route or spend focus.');
        update();
        return;
      }
      if (action === 'treat' && patient.acuity >= 4 && !patient.seen) {
        tone('bad');
        trust = Math.max(0, trust - 10);
        patient.wait += 1;
        write('Unsafe shortcut.', 'High-acuity patients need exam before treatment.');
        advance();
        update();
        return;
      }
      roomBusy[action] = action === 'isolate' ? 2 : patient.acuity >= 4 ? 2 : 1;
      tone('ok');
      if (action === 'exam') {
        patient.seen = true;
        patient.acuity = Math.max(1, patient.acuity - 1);
        patient.wait += 1;
        score += 10;
        advance();
        write('Exam completed.', `${patient.name} is safer to route now.`);
        update();
      } else if (action === 'isolate') {
        infection = Math.max(0, infection - 10);
        completePatient(patient, 22 + patient.acuity * 3, 'Isolation cleared');
        advance();
      } else if (action === 'treat') {
        completePatient(patient, 18 + patient.acuity * 4 + Math.max(0, patient.wait) * 2, 'Treatment completed');
        advance();
      }
    }

    function update() {
      $('#cc-wave', root).textContent = `${Math.min(wave, 7)} / 7`;
      $('#cc-trust', root).textContent = String(Math.round(trust));
      $('#cc-infection', root).textContent = String(Math.round(infection));
      $('#cc-focus', root).textContent = String(focus);
      $('#cc-supplies', root).textContent = String(supplies);
      $('#cc-score', root).textContent = String(score);
      $('#cc-meter', root).style.width = `${Math.max(0, Math.min(100, trust))}%`;
      renderQueue();
      renderSvg();
    }

    function renderQueue() {
      queueEl.replaceChildren();
      patients.forEach((patient, index) => {
        const card = document.createElement('div');
        card.className = `clinic-patient-card${patient.id === selected ? ' is-selected' : ''}${patient.wait < 1 || patient.acuity >= 5 ? ' is-danger' : ''}`;
        card.setAttribute('role', 'option');
        card.setAttribute('aria-selected', String(patient.id === selected));
        card.innerHTML = `<button type="button"><span class="clinic-badge">${patient.fever ? 'F' : patient.acuity}</span><span><span class="clinic-name">${patient.name}</span><span class="clinic-meta">${patient.concern} · acuity ${patient.acuity} · wait ${patient.wait}</span></span><span>${index + 1}</span></button>`;
        $('button', card).addEventListener('click', () => { selected = patient.id; update(); });
        queueEl.append(card);
      });
    }

    function renderSvg() {
      const roomData = [
        { id: 'exam', label: 'Exam', x: 42, y: 50, w: 160, h: 100 },
        { id: 'treat', label: 'Treat', x: 240, y: 50, w: 160, h: 100 },
        { id: 'isolate', label: 'Isolate', x: 438, y: 50, w: 160, h: 100 }
      ];
      const patientNodes = patients.map((p, index) => {
        const x = 80 + (index % 4) * 120;
        const y = 230 + Math.floor(index / 4) * 58;
        return `<g class="clinic-patient${p.id === selected ? ' is-selected' : ''}${p.acuity >= 4 ? ' is-critical' : ''}${p.fever ? ' is-fever' : ''}" transform="translate(${x} ${y})"><circle r="24"></circle><text text-anchor="middle" y="6" font-size="15" font-weight="1000">${p.fever ? 'F' : p.acuity}</text></g>`;
      }).join('');
      const rooms = roomData.map((room) => `<g><rect class="clinic-room${roomBusy[room.id] ? ' is-warn' : ' is-open'}" x="${room.x}" y="${room.y}" width="${room.w}" height="${room.h}" rx="22"></rect><text class="clinic-room-label" x="${room.x + 20}" y="${room.y + 34}">${room.label}</text><text x="${room.x + 20}" y="${room.y + 66}" fill="#64748b">${roomBusy[room.id] ? `Busy ${roomBusy[room.id]}` : 'Ready'}</text></g>`).join('');
      svg.innerHTML = `<rect x="0" y="0" width="640" height="360" fill="transparent"></rect>${rooms}<path d="M65 198 C210 176 430 176 575 198" fill="none" stroke="#38bdf8" stroke-width="5" stroke-linecap="round" stroke-dasharray="12 12"></path><text x="42" y="205" font-weight="900" fill="#0369a1">Waiting path</text>${patientNodes}`;
    }

    function end(win) {
      tone(win ? 'win' : 'bad');
      patients = [];
      write(win ? 'Clinic shift stabilized.' : 'Clinic circuit failed.', win ? `Final score ${score + Math.round(trust) - Math.round(infection)}. Night clinic pressure is now unlocked for replay.` : 'Trust or infection crossed the safety line. Restart and use isolation earlier.');
      update();
    }

    function restart() {
      wave = 1;
      trust = 100;
      infection = 0;
      focus = 3;
      supplies = 4;
      score = 0;
      selected = null;
      roomBusy = { exam: 0, treat: 0, isolate: 0 };
      patients = [];
      newWave();
    }

    root.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-act]');
      if (button) act(button.dataset.act);
    });
    root.addEventListener('keydown', (event) => {
      if (event.key >= '1' && event.key <= '9') {
        const item = patients[Number(event.key) - 1];
        if (item) { selected = item.id; update(); }
      }
      if (event.key === 'e') act('exam');
      if (event.key === 't') act('treat');
      if (event.key === 'i') act('isolate');
      if (event.key === 'f') act('focus');
    });
    dialog.addEventListener('close', () => { disposed = true; audioContext?.close?.(); }, { once: true });
    newWave();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
