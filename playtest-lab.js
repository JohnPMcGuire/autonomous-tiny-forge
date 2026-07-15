(() => {
  const STYLE_ID = 'forge-playtest-lab-styles';
  const state = {
    active: false,
    startedAt: 0,
    appName: '',
    events: [],
    notes: [],
    errors: [],
    timer: 0,
    lastFocus: '',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };

  function installStyles() {
    if (document.querySelector(`#${STYLE_ID}`)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .playtest-launch{margin-left:auto;white-space:nowrap}
      .playtest-drawer{position:fixed;z-index:10000;right:18px;bottom:18px;width:min(420px,calc(100vw - 24px));max-height:min(78vh,720px);overflow:auto;border:1px solid var(--line);border-radius:24px;background:#fff;color:var(--ink);box-shadow:0 22px 70px rgba(20,25,22,.24);padding:18px;animation:playtest-in .2s ease both}
      .playtest-drawer[hidden]{display:none}.playtest-head{display:flex;align-items:start;justify-content:space-between;gap:12px}.playtest-head h3{margin:.15rem 0 .25rem;font-size:1.3rem}.playtest-head p{margin:0;color:var(--muted);font-size:.88rem}.playtest-close{border:0;background:transparent;font-size:1.5rem;line-height:1;min-width:44px;min-height:44px;border-radius:12px}
      .playtest-status{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.playtest-stat{border:1px solid var(--line);border-radius:14px;padding:10px}.playtest-stat span{display:block;color:var(--muted);font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.playtest-stat strong{display:block;margin-top:3px}
      .playtest-checks{display:grid;gap:7px;margin:12px 0}.playtest-check{display:flex;align-items:start;gap:9px;border:1px solid var(--line);border-radius:14px;padding:10px;background:#fff;text-align:left;color:var(--ink)}.playtest-check[aria-pressed=true]{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,white)}.playtest-check b{display:block;font-size:.9rem}.playtest-check small{display:block;color:var(--muted);margin-top:2px}
      .playtest-markers{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.playtest-markers button{min-height:46px;border:1px solid var(--line);border-radius:14px;background:white;color:var(--ink);font-weight:800}.playtest-markers button:focus-visible,.playtest-check:focus-visible,.playtest-close:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
      .playtest-note{width:100%;min-height:76px;resize:vertical;border:1px solid var(--line);border-radius:14px;padding:10px;margin-top:10px;font:inherit;color:var(--ink)}.playtest-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.playtest-actions button,.playtest-actions a{flex:1;min-width:120px;justify-content:center;text-align:center}
      .playtest-report{margin-top:12px;border-radius:16px;background:#f5f6f3;padding:12px;white-space:pre-wrap;font:500 .78rem/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;max-height:240px;overflow:auto}.playtest-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
      @keyframes playtest-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@media(max-width:560px){.playtest-drawer{right:12px;bottom:12px}.playtest-status{grid-template-columns:1fr 1fr}.playtest-stat:last-child{grid-column:1/-1}.playtest-markers{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.playtest-drawer{animation:none}}
    `;
    document.head.append(style);
  }

  function currentAppName() {
    return document.querySelector('#dialog-title')?.textContent?.trim() || 'Unknown forge app';
  }

  function elapsedSeconds() {
    return state.startedAt ? Math.max(0, Math.round((performance.now() - state.startedAt) / 1000)) : 0;
  }

  function safeLabel(target) {
    if (!(target instanceof Element)) return 'unknown';
    const text = target.getAttribute('aria-label') || target.textContent || target.tagName;
    return text.trim().replace(/\s+/g, ' ').slice(0, 70) || target.tagName.toLowerCase();
  }

  function record(type, detail = '') {
    if (!state.active) return;
    state.events.push({ at: elapsedSeconds(), type, detail: String(detail).slice(0, 100) });
    if (state.events.length > 160) state.events.shift();
    updateStats();
  }

  function marker(kind) {
    if (!state.active) startSession();
    const note = drawer().querySelector('.playtest-note').value.trim();
    state.notes.push({ at: elapsedSeconds(), kind, note: note.slice(0, 300) });
    drawer().querySelector('.playtest-note').value = '';
    announce(`${kind} marker saved at ${formatTime(elapsedSeconds())}.`);
    updateStats();
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function drawer() {
    let root = document.querySelector('.playtest-drawer');
    if (root) return root;
    root = document.createElement('aside');
    root.className = 'playtest-drawer';
    root.hidden = true;
    root.setAttribute('aria-label', 'Forge playtest lab');
    root.innerHTML = `
      <div class="playtest-head"><div><p>Opt-in, session only</p><h3>Playtest lab</h3><p>No data is stored or sent. Build a report you can review first.</p></div><button class="playtest-close" type="button" aria-label="Close playtest lab">×</button></div>
      <div class="playtest-status"><div class="playtest-stat"><span>Time</span><strong data-playtest-time>0:00</strong></div><div class="playtest-stat"><span>Actions</span><strong data-playtest-actions>0</strong></div><div class="playtest-stat"><span>Markers</span><strong data-playtest-markers>0</strong></div></div>
      <div class="playtest-checks" aria-label="Playtest checklist"></div>
      <div class="playtest-markers" aria-label="Add an observation"><button type="button" data-marker="Confusing">Confusing</button><button type="button" data-marker="Bug">Bug</button><button type="button" data-marker="Delight">Delight</button><button type="button" data-marker="Accessibility">Accessibility</button></div>
      <label><span class="playtest-live">Optional note for the next marker</span><textarea class="playtest-note" maxlength="300" placeholder="Optional detail before adding a marker"></textarea></label>
      <div class="playtest-actions"><button class="button" type="button" data-playtest-start>Start playtest</button><button class="button button-secondary" type="button" data-playtest-finish disabled>Finish report</button></div>
      <div class="playtest-report" hidden aria-label="Generated playtest report"></div>
      <div class="playtest-actions playtest-export" hidden><button class="button button-secondary" type="button" data-playtest-copy>Copy report</button><a class="button" data-playtest-issue target="_blank" rel="noreferrer">Open feedback issue</a></div>
      <p class="playtest-live" aria-live="polite" data-playtest-live></p>
    `;
    const checks = [
      ['Goal is clear', 'I understand what success looks like.'],
      ['Controls are clear', 'Pointer, touch, and keyboard actions are discoverable.'],
      ['Feedback is clear', 'The app explains what changed after an action.'],
      ['Failure is recoverable', 'A mistake teaches me how to continue.'],
      ['Mobile layout works', 'Controls remain usable in a narrow viewport.'],
      ['Focus remains visible', 'Keyboard focus is easy to follow.']
    ];
    const checksRoot = root.querySelector('.playtest-checks');
    checks.forEach(([title, help]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'playtest-check';
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = `<span aria-hidden="true">○</span><span><b>${title}</b><small>${help}</small></span>`;
      button.addEventListener('click', () => {
        const next = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(next));
        button.firstElementChild.textContent = next ? '✓' : '○';
        record('checklist', `${title}: ${next ? 'pass' : 'not rated'}`);
      });
      checksRoot.append(button);
    });
    root.querySelector('.playtest-close').addEventListener('click', () => { root.hidden = true; });
    root.querySelector('[data-playtest-start]').addEventListener('click', startSession);
    root.querySelector('[data-playtest-finish]').addEventListener('click', finishSession);
    root.querySelectorAll('[data-marker]').forEach((button) => button.addEventListener('click', () => marker(button.dataset.marker)));
    root.querySelector('[data-playtest-copy]').addEventListener('click', copyReport);
    document.body.append(root);
    return root;
  }

  function startSession() {
    const root = drawer();
    state.active = true;
    state.startedAt = performance.now();
    state.appName = currentAppName();
    state.events = [];
    state.notes = [];
    state.errors = [];
    state.lastFocus = '';
    root.querySelector('[data-playtest-start]').textContent = 'Restart playtest';
    root.querySelector('[data-playtest-finish]').disabled = false;
    root.querySelector('.playtest-report').hidden = true;
    root.querySelector('.playtest-export').hidden = true;
    root.querySelectorAll('.playtest-check').forEach((button) => {
      button.setAttribute('aria-pressed', 'false');
      button.firstElementChild.textContent = '○';
    });
    clearInterval(state.timer);
    state.timer = window.setInterval(updateStats, 1000);
    record('session', `Started ${state.appName}`);
    announce(`Playtest started for ${state.appName}.`);
  }

  function finishSession() {
    if (!state.active) return;
    record('session', 'Finished');
    state.active = false;
    clearInterval(state.timer);
    const report = buildReport();
    const root = drawer();
    const reportNode = root.querySelector('.playtest-report');
    reportNode.textContent = report;
    reportNode.hidden = false;
    root.querySelector('.playtest-export').hidden = false;
    root.querySelector('[data-playtest-finish]').disabled = true;
    const title = encodeURIComponent(`[Feedback] ${state.appName} playtest`);
    const body = encodeURIComponent(report.slice(0, 6000));
    root.querySelector('[data-playtest-issue]').href = `https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=${title}&body=${body}`;
    announce('Playtest report ready. Review, copy, or open a feedback issue.');
  }

  function buildReport() {
    const duration = elapsedSeconds();
    const checklist = [...drawer().querySelectorAll('.playtest-check')].map((button) => `${button.getAttribute('aria-pressed') === 'true' ? '[x]' : '[ ]'} ${button.querySelector('b').textContent}`);
    const actionCounts = state.events.reduce((map, item) => {
      map[item.type] = (map[item.type] || 0) + 1;
      return map;
    }, {});
    const observations = state.notes.length ? state.notes.map((item) => `- ${formatTime(item.at)} ${item.kind}${item.note ? `: ${item.note}` : ''}`) : ['- No observation markers added.'];
    const errors = state.errors.length ? state.errors.map((item) => `- ${formatTime(item.at)} ${item.message}`) : ['- No runtime errors observed.'];
    return `Forge playtest report\nApp: ${state.appName}\nDuration: ${formatTime(duration)}\nViewport: ${window.innerWidth} × ${window.innerHeight}\nReduced motion: ${state.reducedMotion ? 'on' : 'off'}\n\nChecklist\n${checklist.join('\n')}\n\nInteraction summary\n${Object.entries(actionCounts).map(([key, value]) => `- ${key}: ${value}`).join('\n') || '- No actions recorded.'}\n\nObservations\n${observations.join('\n')}\n\nRuntime errors\n${errors.join('\n')}\n\nPrivacy\nThis report was generated in memory. Nothing was stored or sent automatically.`;
  }

  async function copyReport() {
    const text = drawer().querySelector('.playtest-report').textContent;
    try {
      await navigator.clipboard.writeText(text);
      announce('Report copied to clipboard.');
    } catch {
      announce('Clipboard access was unavailable. Select the report text to copy it manually.');
    }
  }

  function updateStats() {
    const root = drawer();
    root.querySelector('[data-playtest-time]').textContent = formatTime(elapsedSeconds());
    root.querySelector('[data-playtest-actions]').textContent = String(state.events.length);
    root.querySelector('[data-playtest-markers]').textContent = String(state.notes.length);
  }

  function announce(message) {
    drawer().querySelector('[data-playtest-live]').textContent = message;
  }

  function installLaunchButton() {
    const dialogHeader = document.querySelector('.dialog-header');
    if (!dialogHeader || document.querySelector('.playtest-launch')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button button-secondary button-small playtest-launch';
    button.textContent = 'Playtest';
    button.setAttribute('aria-label', 'Open the opt-in playtest lab for this app');
    button.addEventListener('click', () => {
      const root = drawer();
      root.hidden = false;
      root.querySelector('[data-playtest-start]').focus();
    });
    dialogHeader.append(button);
  }

  document.addEventListener('click', (event) => {
    if (!state.active || event.target.closest('.playtest-drawer')) return;
    record('pointer', safeLabel(event.target));
  }, true);
  document.addEventListener('keydown', (event) => {
    if (!state.active || event.target.closest?.('.playtest-drawer')) return;
    const allowed = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape', 'Tab'];
    record('keyboard', allowed.includes(event.key) ? event.key : 'other key');
  }, true);
  document.addEventListener('focusin', (event) => {
    if (!state.active || event.target.closest?.('.playtest-drawer')) return;
    const label = safeLabel(event.target);
    if (label !== state.lastFocus) {
      state.lastFocus = label;
      record('focus', label);
    }
  }, true);
  window.addEventListener('error', (event) => {
    if (!state.active) return;
    state.errors.push({ at: elapsedSeconds(), message: String(event.message || 'Unknown error').slice(0, 160) });
    updateStats();
  });
  window.addEventListener('unhandledrejection', (event) => {
    if (!state.active) return;
    state.errors.push({ at: elapsedSeconds(), message: String(event.reason?.message || event.reason || 'Unhandled rejection').slice(0, 160) });
    updateStats();
  });
  document.querySelector('#app-dialog')?.addEventListener('close', () => {
    if (state.active) finishSession();
    const root = document.querySelector('.playtest-drawer');
    if (root) root.hidden = true;
  });

  installStyles();
  installLaunchButton();
})();
