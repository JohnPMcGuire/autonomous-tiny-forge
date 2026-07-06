(() => {
  const APP = { name: 'Chronicle Conductor', emoji: '📜', category: 'play', version: '1.0.0', summary: 'Rebuild tangled timelines by placing causes, pivots, and consequences before paradox heat overwhelms the archive.', description: 'A local causality-ordering game with draggable event cards, branching dossiers, locked anchors, paradox heat, insight tokens, adaptive rounds, recoverable contradictions, session-only hard archives, scoring, touch and keyboard controls, optional local audio, reduced-motion behavior, and teardown.' };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const label = (v) => v === 'play' ? 'Play' : v === 'useful' ? 'Useful' : 'Experiment';
  const dossiers = [
    {title:'Museum blackout', anchor:'Power fails', sequence:['Rain floods alley','Generator door sticks','Curator borrows lamp','Power fails','Glass alarm sleeps','Decoy crate leaves'], clues:['Water before power','Lamp before alarm','Crate after alarm']},
    {title:'Harbor recall', anchor:'Pilot reverses course', sequence:['Fog rolls in','Beacon reports drift','Pilot reverses course','Cargo waits offshore','Fuel margin shrinks','Night crew opens pier'], clues:['Fog starts it','Cargo waits after reversal','Pier opens last']},
    {title:'Launch rehearsal', anchor:'Signal freezes', sequence:['Patch ships early','Telemetry spikes','Signal freezes','Backup channel opens','Sponsor delays demo','Team rewrites script'], clues:['Patch before spike','Backup follows freeze','Rewrite after delay']},
    {title:'Greenhouse rumor', anchor:'Doors seal', sequence:['Heat sensor blinks','Irrigation pauses','Doors seal','Bees crowd vent','Caretaker cuts shade','Seed trays recover'], clues:['Sensor first','Bees after seal','Recovery last']},
    {title:'Night train', anchor:'Bridge slows', sequence:['Storm warning posts','Switch crew reroutes','Bridge slows','Mail misses transfer','Dispatcher frees siding','Passengers board bus'], clues:['Reroute before bridge','Mail before siding','Bus last']}
  ];

  function style() {
    if ($('#chronicle-conductor-styles')) return;
    const sheet = document.createElement('style');
    sheet.id = 'chronicle-conductor-styles';
    sheet.textContent = `.chronicle-card{animation:chronicle-in .24s ease both}.chronicle-game{max-width:1080px;gap:14px}.chronicle-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.chronicle-stat,.chronicle-board,.chronicle-side,.chronicle-cardlet,.chronicle-slot{border:1px solid var(--line);border-radius:18px;background:#fff}.chronicle-stat{padding:10px 12px}.chronicle-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.chronicle-stat strong{display:block;margin-top:4px}.chronicle-layout{display:grid;grid-template-columns:1.1fr .9fr;gap:12px}.chronicle-board{position:relative;min-height:430px;padding:14px;overflow:hidden;background:linear-gradient(135deg,#fff7ed,#eef2ff)}.chronicle-rings{position:absolute;inset:0;opacity:.55}.chronicle-ring{fill:none;stroke:#a78bfa;stroke-width:2;stroke-dasharray:10 12;animation:chronicle-spin 10s linear infinite;transform-origin:center}.chronicle-slots{position:relative;display:grid;gap:8px}.chronicle-slot{min-height:58px;display:flex;align-items:center;gap:8px;padding:8px;border-style:dashed;text-align:left}.chronicle-slot strong{min-width:2.2rem}.chronicle-slot.is-anchor{border-color:#f59e0b;background:#fffbeb}.chronicle-slot.is-wrong{background:#fef2f2;border-color:#fca5a5}.chronicle-cardlet{padding:10px;text-align:left;box-shadow:0 8px 18px rgba(15,23,42,.08);cursor:pointer;touch-action:manipulation}.chronicle-cardlet[draggable=true]{cursor:grab}.chronicle-cardlet.is-selected{outline:4px solid var(--accent)}.chronicle-side{padding:14px;display:grid;gap:12px}.chronicle-brief{padding:12px;border-radius:16px;background:#f8fafc}.chronicle-pool{display:grid;gap:8px}.chronicle-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.chronicle-actions button{min-height:42px}.chronicle-log{min-height:104px;padding:17px 19px}.chronicle-heat{height:12px;border-radius:999px;background:#e2e8f0;overflow:hidden}.chronicle-heat span{display:block;height:100%;width:0;background:linear-gradient(90deg,#22c55e,#facc15,#fb7185)}@media(max-width:820px){.chronicle-hud{grid-template-columns:repeat(2,1fr)}.chronicle-layout{grid-template-columns:1fr}.chronicle-board{min-height:0}.chronicle-rings{display:none}.chronicle-actions{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.chronicle-card,.chronicle-ring{animation:none}}@keyframes chronicle-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes chronicle-spin{to{transform:rotate(360deg)}}`;
    document.head.append(sheet);
  }

  function addCard() {
    const grid = $('#app-grid');
    const template = $('#app-card-template');
    if (!grid || !template || $('[data-chronicle-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    style();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.chronicleCard = 'true';
    card.classList.add('chronicle-card');
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
    const retry = () => {
      addCard();
      if (!$('[data-chronicle-card]') && tries++ < 20) setTimeout(retry, 120);
    };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.chronicleRefresh) return;
      button.dataset.chronicleRefresh = '1';
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
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Chronicle%20Conductor';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel chronicle-game';
    root.innerHTML = `<div class="chronicle-hud"><div class="chronicle-stat"><span>Archive</span><strong id="cc-round">1 / 5</strong></div><div class="chronicle-stat"><span>Heat</span><strong id="cc-heat">0</strong></div><div class="chronicle-stat"><span>Insights</span><strong id="cc-insights">3</strong></div><div class="chronicle-stat"><span>Locks</span><strong id="cc-locks">1</strong></div><div class="chronicle-stat"><span>Streak</span><strong id="cc-streak">0</strong></div><div class="chronicle-stat"><span>Score</span><strong id="cc-score">0</strong></div></div><div class="chronicle-layout"><div class="chronicle-board"><svg class="chronicle-rings" viewBox="0 0 700 450" aria-hidden="true"><circle class="chronicle-ring" cx="350" cy="225" r="90"/><circle class="chronicle-ring" cx="350" cy="225" r="155"/><circle class="chronicle-ring" cx="350" cy="225" r="220"/></svg><div class="chronicle-slots" aria-label="Timeline slots"></div></div><div class="chronicle-side"><div class="chronicle-brief" id="cc-brief"></div><div class="chronicle-heat" aria-label="Paradox heat"><span id="cc-meter"></span></div><strong>Loose records</strong><div class="chronicle-pool" aria-label="Event card pool"></div><div class="chronicle-actions"><button class="button" type="button" data-act="check">Check timeline</button><button class="button button-secondary" type="button" data-act="insight">Spend insight</button><button class="button button-secondary" type="button" data-act="lock">Lock anchor</button><button class="button button-secondary" type="button" data-act="scrub">Scrub paradox</button><button class="button button-secondary" type="button" data-act="sound">Sound off</button><button class="button button-secondary" type="button" data-act="new">New run</button></div></div></div><div class="result-card chronicle-log" aria-live="polite"></div>`;
    stage.append(root);

    const st = { round: 1, rounds: 5, score: 0, heat: 0, insights: 3, locks: 1, streak: 0, hard: false, selected: null, placed: [], pool: [], audio: false, ac: null };
    const slots = $('.chronicle-slots', root);
    const pool = $('.chronicle-pool', root);
    const log = $('.chronicle-log', root);
    const current = () => dossiers[(st.round - 1) % dossiers.length];
    const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
    const firstWrong = () => st.placed.findIndex((item, index) => item && item !== current().sequence[index]);

    function tone(kind) {
      if (!st.audio || !st.ac) return;
      const now = st.ac.currentTime;
      const oscillator = st.ac.createOscillator();
      const gain = st.ac.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = kind === 'good' ? 760 : kind === 'bad' ? 190 : 480;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      oscillator.connect(gain).connect(st.ac.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
    }

    function setupRound() {
      const dossier = current();
      st.placed = Array(dossier.sequence.length).fill(null);
      st.placed[dossier.sequence.indexOf(dossier.anchor)] = dossier.anchor;
      st.pool = shuffle(dossier.sequence.filter((item) => item !== dossier.anchor));
      st.selected = null;
      render();
    }

    function place(text, index) {
      if (!text || st.placed[index]) return;
      st.placed[index] = text;
      st.pool = st.pool.filter((item) => item !== text);
      st.selected = null;
      st.heat += 4;
      render();
      tone('tap');
    }

    function unplace(index) {
      const text = st.placed[index];
      if (!text || text === current().anchor) return;
      st.placed[index] = null;
      st.pool.push(text);
      st.heat += 3;
      render();
    }

    function check() {
      if (st.placed.some((item) => !item)) {
        log.innerHTML = '<strong>Timeline incomplete.</strong><small>Place every loose record before checking.</small>';
        tone('bad');
        return;
      }
      const wrong = firstWrong();
      if (wrong >= 0) {
        st.heat += st.hard ? 18 : 12;
        st.streak = 0;
        log.innerHTML = `<strong>Contradiction at slot ${wrong + 1}.</strong><small>${st.placed[wrong]} does not belong there. Recover before heat reaches 100.</small>`;
        tone('bad');
      } else {
        const points = Math.max(30, 130 - st.heat + st.insights * 5 + st.locks * 8);
        st.score += points;
        st.streak += 1;
        st.hard = st.hard || st.streak >= 2;
        log.innerHTML = `<strong>Archive restored.</strong><small>+${points} points. ${st.hard ? 'Hard archive unlocked.' : 'Two clean archives unlock hard mode.'}</small>`;
        tone('good');
        if (st.round >= st.rounds) {
          log.innerHTML += `<br><small>Run complete. Final score ${st.score}. Start over to chase a colder archive.</small>`;
        } else {
          st.round += 1;
          st.heat = Math.max(0, st.heat - 18);
          setupRound();
        }
      }
      render();
    }

    function insight() {
      if (!st.insights) {
        log.innerHTML = '<strong>No insights left.</strong><small>Scrub heat or check the timeline instead.</small>';
        tone('bad');
        return;
      }
      const wrong = firstWrong();
      const empty = st.placed.findIndex((item) => !item);
      st.insights -= 1;
      st.heat += 5;
      log.innerHTML = wrong >= 0 ? `<strong>Insight found a contradiction.</strong><small>Slot ${wrong + 1} should not contain "${st.placed[wrong]}".</small>` : empty >= 0 ? `<strong>Insight clue.</strong><small>${current().clues[st.round % current().clues.length]}. Earliest open slot is ${empty + 1}.</small>` : '<strong>Insight sees no obvious flaw.</strong><small>Use check to commit the archive.</small>';
      render();
      tone('tap');
    }

    function lock() {
      if (!st.locks || !st.selected) {
        log.innerHTML = '<strong>Select a loose record first.</strong><small>A lock places the correct record into its true slot if that slot is open.</small>';
        tone('bad');
        return;
      }
      const index = current().sequence.indexOf(st.selected);
      if (st.placed[index]) {
        log.innerHTML = '<strong>True slot is occupied.</strong><small>Clear that slot before spending the lock.</small>';
        tone('bad');
        return;
      }
      st.locks -= 1;
      place(st.selected, index);
      log.innerHTML = `<strong>Anchor lock used.</strong><small>${st.placed[index]} fixed into slot ${index + 1}.</small>`;
    }

    function scrub() {
      st.heat = Math.max(0, st.heat - 24);
      st.insights = Math.max(0, st.insights - 1);
      log.innerHTML = '<strong>Paradox scrubbed.</strong><small>Heat fell, but it cost one insight.</small>';
      render();
      tone('tap');
    }

    function reset() {
      Object.assign(st, { round: 1, score: 0, heat: 0, insights: 3, locks: 1, streak: 0, hard: false, selected: null });
      setupRound();
      log.innerHTML = '<strong>New archive run.</strong><small>Click a loose record, then choose a timeline slot. Keys 1-6 place into slots.</small>';
    }

    function render() {
      const dossier = current();
      $('#cc-round', root).textContent = `${st.round} / ${st.rounds}`;
      $('#cc-heat', root).textContent = st.heat;
      $('#cc-insights', root).textContent = st.insights;
      $('#cc-locks', root).textContent = st.locks;
      $('#cc-streak', root).textContent = st.streak;
      $('#cc-score', root).textContent = st.score;
      $('#cc-meter', root).style.width = `${Math.min(100, st.heat)}%`;
      $('#cc-brief', root).innerHTML = `<strong>${dossier.title}</strong><br><small>Locked anchor: <b>${dossier.anchor}</b>. ${dossier.clues.join(' · ')}.${st.hard ? ' Hard archive raises contradiction heat.' : ''}</small>`;
      slots.replaceChildren();
      st.placed.forEach((text, index) => {
        const slot = document.createElement('button');
        slot.type = 'button';
        slot.className = 'chronicle-slot';
        slot.innerHTML = `<strong>${index + 1}</strong><span>${text || 'Open causal slot'}</span>`;
        slot.classList.toggle('is-anchor', text === dossier.anchor);
        slot.classList.toggle('is-wrong', firstWrong() === index);
        slot.addEventListener('click', () => text ? unplace(index) : place(st.selected, index));
        slot.addEventListener('dragover', (event) => event.preventDefault());
        slot.addEventListener('drop', (event) => place(event.dataTransfer.getData('text/plain'), index));
        slots.append(slot);
      });
      pool.replaceChildren();
      st.pool.forEach((text) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'chronicle-cardlet';
        item.textContent = text;
        item.draggable = true;
        item.classList.toggle('is-selected', st.selected === text);
        item.addEventListener('click', () => { st.selected = st.selected === text ? null : text; render(); });
        item.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', text));
        pool.append(item);
      });
    }

    root.addEventListener('click', (event) => {
      const action = event.target.closest('button')?.dataset.act;
      if (!action) return;
      if (action === 'check') check();
      if (action === 'insight') insight();
      if (action === 'lock') lock();
      if (action === 'scrub') scrub();
      if (action === 'new') reset();
      if (action === 'sound') {
        const AudioEngine = window.AudioContext || window.webkitAudioContext;
        if (!AudioEngine) {
          log.innerHTML = '<strong>Sound is not available here.</strong>';
          return;
        }
        st.audio = !st.audio;
        event.target.textContent = st.audio ? 'Sound on' : 'Sound off';
        event.target.setAttribute('aria-pressed', String(st.audio));
        st.ac ||= new AudioEngine();
        st.ac.resume();
        tone('good');
      }
    });

    const keys = (event) => {
      if (!dialog.open) return;
      if (event.key >= '1' && event.key <= '6' && st.selected && !st.placed[Number(event.key) - 1]) {
        event.preventDefault();
        place(st.selected, Number(event.key) - 1);
      }
      if (event.key.toLowerCase() === 'c') check();
      if (event.key.toLowerCase() === 'i') insight();
      if (event.key.toLowerCase() === 'l') lock();
      if (event.key.toLowerCase() === 'x') scrub();
    };
    document.addEventListener('keydown', keys);
    dialog.addEventListener('close', () => {
      document.removeEventListener('keydown', keys);
      if (st.ac) st.ac.close().catch(() => {});
    }, { once: true });

    setupRound();
    log.innerHTML = '<strong>Rebuild the causal chain.</strong><small>Select a loose record, then click a slot. C checks, I spends insight, L locks, X scrubs heat.</small>';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
