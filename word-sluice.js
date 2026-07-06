(() => {
  const APP = {
    name: 'Word Sluice',
    emoji: '📝',
    category: 'play',
    version: '1.0.0',
    summary: 'Draft compact messages by routing word tiles through tone, clarity, and deadline constraints.',
    description: 'A local word-strategy game with rotating briefs, flowing word tiles, tone targets, banned words, edit tokens, hold slots, pressure, adaptive rounds, recoverable rewrites, session-only storm briefs, scoring, touch and keyboard controls, optional local audio, reduced-motion behavior, and teardown.'
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const label = (value) => value === 'play' ? 'Play' : value === 'useful' ? 'Useful' : 'Experiment';
  const words = [
    ['bright','tone',2], ['quiet','tone',2], ['bold','tone',2], ['careful','tone',3], ['plain','tone',2], ['warm','tone',2],
    ['launch','action',3], ['repair','action',3], ['guide','action',2], ['share','action',2], ['prove','action',2], ['trim','action',2],
    ['signal','anchor',3], ['garden','anchor',3], ['harbor','anchor',3], ['bridge','anchor',3], ['ledger','anchor',3], ['beacon','anchor',3],
    ['before','link',2], ['because','link',3], ['while','link',2], ['after','link',2], ['unless','link',3], ['without','link',3]
  ];
  const briefs = [
    {need:'Helpful notice', tone:'warm', anchor:'signal', ban:'because', max:5},
    {need:'Launch tease', tone:'bold', anchor:'beacon', ban:'unless', max:5},
    {need:'Repair update', tone:'plain', anchor:'bridge', ban:'bright', max:6},
    {need:'Gentle warning', tone:'careful', anchor:'harbor', ban:'prove', max:6},
    {need:'Puzzle clue', tone:'quiet', anchor:'ledger', ban:'after', max:5},
    {need:'Recovery plan', tone:'warm', anchor:'garden', ban:'without', max:6}
  ];

  function style() {
    if ($('#word-sluice-styles')) return;
    const sheet = document.createElement('style');
    sheet.id = 'word-sluice-styles';
    sheet.textContent = `.sluice-card{animation:sluice-in .24s ease both}.sluice-game{max-width:1040px;gap:14px}.sluice-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.sluice-stat,.sluice-board,.sluice-panel,.sluice-tile,.sluice-draft{border:1px solid var(--line);border-radius:18px;background:#fff}.sluice-stat{padding:10px 12px}.sluice-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.sluice-stat strong{display:block;margin-top:4px}.sluice-layout{display:grid;grid-template-columns:1.15fr .85fr;gap:12px}.sluice-board{position:relative;min-height:380px;overflow:hidden;padding:14px;background:linear-gradient(180deg,#eef6ff,#fff7ed)}.sluice-river{position:absolute;inset:0;opacity:.7}.sluice-flow{stroke:#93c5fd;stroke-width:18;fill:none;stroke-linecap:round;stroke-dasharray:20 24;animation:sluice-flow 2.8s linear infinite}.sluice-lanes{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;height:100%}.sluice-lane{min-height:330px;border:1px dashed rgba(15,23,42,.22);border-radius:18px;padding:10px;display:flex;flex-direction:column;gap:8px}.sluice-lane h3{margin:0;font-size:.82rem}.sluice-tile{padding:10px;text-align:left;box-shadow:0 8px 18px rgba(15,23,42,.08);cursor:pointer;touch-action:manipulation}.sluice-tile strong{display:block}.sluice-tile small{color:var(--muted)}.sluice-tile.is-picked{outline:4px solid var(--accent)}.sluice-tile.is-bad{background:#fef2f2;border-color:#fca5a5}.sluice-panel{padding:14px;display:grid;gap:10px}.sluice-brief{padding:12px;border-radius:16px;background:#f8fafc}.sluice-draft{min-height:76px;padding:12px;display:flex;gap:8px;flex-wrap:wrap;align-content:flex-start}.sluice-chip{border:1px solid var(--line);border-radius:999px;padding:7px 10px;background:#f8fafc;font-weight:900}.sluice-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.sluice-actions button{min-height:42px}.sluice-log{min-height:104px;padding:17px 19px}.sluice-meter{height:12px;border-radius:999px;background:#e2e8f0;overflow:hidden}.sluice-meter span{display:block;height:100%;width:100%;background:linear-gradient(90deg,#22c55e,#facc15,#fb7185)}@media(max-width:820px){.sluice-hud{grid-template-columns:repeat(2,1fr)}.sluice-layout{grid-template-columns:1fr}.sluice-lanes{grid-template-columns:1fr}.sluice-lane{min-height:auto}.sluice-board{min-height:0}.sluice-river{display:none}.sluice-actions{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.sluice-card,.sluice-flow{animation:none}}@keyframes sluice-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}@keyframes sluice-flow{to{stroke-dashoffset:-44}}`;
    document.head.append(sheet);
  }

  function addCard() {
    const grid = $('#app-grid');
    const template = $('#app-card-template');
    if (!grid || !template || $('[data-sluice-card]')) return;
    const filter = $('.filter.is-active')?.dataset.filter || 'all';
    if (filter !== 'all' && filter !== APP.category) return;
    style();
    const node = template.content.cloneNode(true);
    const card = $('.app-card', node);
    card.dataset.category = APP.category;
    card.dataset.sluiceCard = 'true';
    card.classList.add('sluice-card');
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
      if (!$('[data-sluice-card]') && tries++ < 20) setTimeout(retry, 120);
    };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.sluiceRefresh) return;
      button.dataset.sluiceRefresh = '1';
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
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Word%20Sluice';
    stage.replaceChildren();
    game(stage, dialog);
    dialog.showModal();
  }

  function game(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel sluice-game';
    root.innerHTML = `<div class="sluice-hud"><div class="sluice-stat"><span>Brief</span><strong id="ws-round">1 / 6</strong></div><div class="sluice-stat"><span>Clarity</span><strong id="ws-clarity">100</strong></div><div class="sluice-stat"><span>Edits</span><strong id="ws-edits">3</strong></div><div class="sluice-stat"><span>Pressure</span><strong id="ws-pressure">0</strong></div><div class="sluice-stat"><span>Streak</span><strong id="ws-streak">0</strong></div><div class="sluice-stat"><span>Score</span><strong id="ws-score">0</strong></div></div><div class="sluice-layout"><div class="sluice-board"><svg class="sluice-river" viewBox="0 0 680 420" aria-hidden="true"><path class="sluice-flow" d="M38 80 C180 20 210 190 340 130 S505 70 642 155 M50 280 C170 210 245 350 365 285 S520 240 640 330"/></svg><div class="sluice-lanes"><div class="sluice-lane" data-lane="tone"><h3>Tone gate</h3></div><div class="sluice-lane" data-lane="action"><h3>Action gate</h3></div><div class="sluice-lane" data-lane="anchor"><h3>Anchor gate</h3></div></div></div><div class="sluice-panel"><div class="sluice-brief" id="ws-brief"></div><strong>Draft</strong><div class="sluice-draft" id="ws-draft" aria-live="polite"></div><div class="sluice-meter" aria-label="Clarity meter"><span id="ws-meter"></span></div><div class="sluice-actions"><button class="button" type="button" data-act="submit">Submit draft</button><button class="button button-secondary" type="button" data-act="edit">Spend edit</button><button class="button button-secondary" type="button" data-act="hold">Hold tile</button><button class="button button-secondary" type="button" data-act="new">New run</button><button class="button button-secondary" type="button" data-act="sound">Sound off</button><button class="button button-secondary" type="button" data-act="storm">Storm brief</button></div></div></div><div class="result-card sluice-log" aria-live="polite"></div>`;
    stage.append(root);

    const st = { round: 1, rounds: 6, score: 0, clarity: 100, edits: 3, pressure: 0, streak: 0, draft: [], hold: null, storm: false, audio: false, ac: null };
    const log = $('.sluice-log', root);
    const brief = () => {
      const base = briefs[(st.round - 1) % briefs.length];
      return st.storm ? {...base, need: 'Storm rewrite', ban: base.anchor, max: 4} : base;
    };

    function tone(kind) {
      if (!st.audio || !st.ac) return;
      const now = st.ac.currentTime;
      const oscillator = st.ac.createOscillator();
      const gain = st.ac.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = kind === 'good' ? 720 : kind === 'bad' ? 210 : 440;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      oscillator.connect(gain).connect(st.ac.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.18);
    }

    function drawTiles() {
      $$('.sluice-tile', root).forEach((node) => node.remove());
      const pool = [...words].sort(() => Math.random() - 0.5).slice(0, 9 + Math.min(3, st.round));
      ['tone', 'action', 'anchor'].forEach((lane, index) => {
        const box = $(`[data-lane="${lane}"]`, root);
        pool.filter((word) => lane === 'anchor' ? word[1] === 'anchor' || word[1] === 'link' : word[1] === lane || (index === 1 && word[1] === 'link')).slice(0, 4).forEach((word) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'sluice-tile';
          button.dataset.word = word[0];
          button.dataset.kind = word[1];
          button.dataset.clarity = word[2];
          button.innerHTML = `<strong>${word[0]}</strong><small>${word[1]} · clarity ${word[2]}</small>`;
          button.addEventListener('click', () => pick(button));
          box.append(button);
        });
      });
    }

    function pick(tile) {
      if (st.draft.length >= brief().max) {
        log.innerHTML = '<strong>Draft is full.</strong><small>Submit it or spend an edit to remove the last tile.</small>';
        tone('bad');
        return;
      }
      const item = { word: tile.dataset.word, kind: tile.dataset.kind, clarity: Number(tile.dataset.clarity) };
      st.draft.push(item);
      st.pressure += 5;
      st.clarity = Math.max(0, st.clarity - item.clarity);
      tile.disabled = true;
      tile.classList.add('is-picked');
      render();
      tone('tap');
    }

    function scoreDraft() {
      const b = brief();
      const text = st.draft.map((item) => item.word);
      let points = 20 + st.clarity - st.pressure;
      const hasTone = text.includes(b.tone);
      const hasAnchor = text.includes(b.anchor);
      const banned = text.includes(b.ban);
      if (hasTone) points += 25; else points -= 20;
      if (hasAnchor) points += 30; else points -= 25;
      if (banned) points -= 35;
      if (st.draft.some((item) => item.kind === 'action')) points += 10;
      return { points: Math.max(0, Math.round(points)), hasTone, hasAnchor, banned };
    }

    function submit() {
      if (!st.draft.length) {
        log.innerHTML = '<strong>No draft yet.</strong><small>Route at least one tile before submitting.</small>';
        tone('bad');
        return;
      }
      const result = scoreDraft();
      st.score += result.points;
      st.streak = result.points >= 90 ? st.streak + 1 : 0;
      st.storm = st.storm || st.streak >= 2;
      log.innerHTML = `<strong>${result.points >= 90 ? 'Clean publish.' : result.points >= 55 ? 'Usable rewrite.' : 'Needs recovery.'}</strong><small>${st.draft.map((item) => item.word).join(' ')} · tone ${result.hasTone ? 'hit' : 'miss'}, anchor ${result.hasAnchor ? 'hit' : 'miss'}${result.banned ? ', banned word leaked' : ''}.</small>`;
      tone(result.points >= 75 ? 'good' : 'bad');
      if (st.round >= st.rounds) {
        log.innerHTML += `<br><small>Run complete. Final score ${st.score}. Start a new run to chase a cleaner slate.</small>`;
      } else {
        st.round += 1;
        st.draft = [];
        st.pressure = Math.max(0, st.pressure - 12);
        st.clarity = 100;
        drawTiles();
      }
      render();
    }

    function edit() {
      if (!st.edits || !st.draft.length) {
        tone('bad');
        return;
      }
      const removed = st.draft.pop();
      st.edits -= 1;
      st.clarity = Math.min(100, st.clarity + removed.clarity + 4);
      st.pressure += 3;
      log.innerHTML = `<strong>Edit spent.</strong><small>Removed "${removed.word}" but deadline pressure rose.</small>`;
      render();
      tone('tap');
    }

    function hold() {
      if (st.hold) {
        st.draft.push(st.hold);
        st.hold = null;
        log.innerHTML = '<strong>Held tile released.</strong>';
      } else if (st.draft.length) {
        st.hold = st.draft.pop();
        log.innerHTML = `<strong>Held "${st.hold.word}".</strong><small>Use hold again to return it later.</small>`;
      } else {
        tone('bad');
        return;
      }
      render();
      tone('tap');
    }

    function reset() {
      Object.assign(st, { round: 1, score: 0, clarity: 100, edits: 3, pressure: 0, streak: 0, draft: [], hold: null, storm: false });
      drawTiles();
      render();
      log.innerHTML = '<strong>New run ready.</strong><small>Match the brief without leaking banned words.</small>';
    }

    function render() {
      const b = brief();
      $('#ws-round', root).textContent = `${st.round} / ${st.rounds}`;
      $('#ws-clarity', root).textContent = st.clarity;
      $('#ws-edits', root).textContent = st.edits;
      $('#ws-pressure', root).textContent = st.pressure;
      $('#ws-streak', root).textContent = st.streak;
      $('#ws-score', root).textContent = st.score;
      $('#ws-meter', root).style.width = `${Math.max(5, st.clarity - st.pressure / 2)}%`;
      $('#ws-brief', root).innerHTML = `<strong>${b.need}</strong><br><small>Use tone <b>${b.tone}</b>, anchor <b>${b.anchor}</b>, avoid <b>${b.ban}</b>, max ${b.max} tiles.${st.storm ? ' Storm mode inverts the anchor into the banned word.' : ''}</small>`;
      const draft = $('#ws-draft', root);
      draft.replaceChildren();
      [...st.draft, ...(st.hold ? [{...st.hold, word: `Hold: ${st.hold.word}`}] : [])].forEach((item) => {
        const chip = document.createElement('span');
        chip.className = 'sluice-chip';
        chip.textContent = item.word;
        draft.append(chip);
      });
      $$('.sluice-tile', root).forEach((tile) => tile.classList.toggle('is-bad', tile.dataset.word === b.ban));
    }

    root.addEventListener('click', (event) => {
      const action = event.target.closest('button')?.dataset.act;
      if (!action) return;
      if (action === 'submit') submit();
      if (action === 'edit') edit();
      if (action === 'hold') hold();
      if (action === 'new') reset();
      if (action === 'storm') {
        if (st.streak < 2 && !st.storm) {
          log.innerHTML = '<strong>Storm briefs unlock after two clean publishes.</strong>';
          tone('bad');
        } else {
          st.storm = !st.storm;
          render();
        }
      }
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
      if (event.key >= '1' && event.key <= '9') {
        const tile = $$('.sluice-tile:not(:disabled)', root)[Number(event.key) - 1];
        if (tile) {
          event.preventDefault();
          pick(tile);
        }
      }
      if (event.key.toLowerCase() === 's') submit();
      if (event.key.toLowerCase() === 'e') edit();
      if (event.key.toLowerCase() === 'h') hold();
    };
    document.addEventListener('keydown', keys);
    dialog.addEventListener('close', () => {
      document.removeEventListener('keydown', keys);
      if (st.ac) st.ac.close().catch(() => {});
    }, { once: true });

    drawTiles();
    render();
    log.innerHTML = '<strong>Route a compact draft.</strong><small>Keys 1-9 choose tiles. S submits, E edits, H holds.</small>';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
