(() => {
  const APP = {
    name: 'Aquifer Commons',
    emoji: '💧',
    category: 'play',
    version: '1.0.0',
    summary: 'Balance towns, farms, wetlands, recharge, and salinity across a shared underground water system.',
    description: 'A local resource strategy game with three aquifers, seasonal recharge, pumping permits, conservation, managed recharge, water-right transfers, drought shocks, salinity, scoring, recovery, session unlocks, keyboard and touch controls, reduced motion, and teardown.'
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const scenarios = {
    valley: { name: 'Learning valley', turns: 8, budget: 9, recharge: 8, unlock: 0 },
    coast: { name: 'Coastal basin', turns: 10, budget: 11, recharge: 6, unlock: 1 },
    drought: { name: 'Drought compact', turns: 12, budget: 13, recharge: 3, unlock: 2 }
  };
  const districts = [
    { name: 'North town', demand: 7, type: 'town' },
    { name: 'Orchards', demand: 9, type: 'farm' },
    { name: 'Wetland', demand: 5, type: 'wetland' },
    { name: 'Harbor town', demand: 8, type: 'town' },
    { name: 'South farms', demand: 10, type: 'farm' },
    { name: 'Recharge plain', demand: 2, type: 'recharge' }
  ];

  function installStyles() {
    if ($('#aqc-style')) return;
    const style = document.createElement('style');
    style.id = 'aqc-style';
    style.textContent = `.aqc{max-width:1100px;display:grid;gap:12px}.aqc-hud{display:grid;grid-template-columns:repeat(6,1fr);gap:7px}.aqc-stat,.aqc-panel{border:1px solid var(--line);border-radius:18px;background:#fff}.aqc-stat{padding:9px}.aqc-stat span{display:block;font-size:.62rem;font-weight:900;text-transform:uppercase;color:var(--muted)}.aqc-main{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}.aqc-panel{padding:14px}.aqc-board{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.aqc-cell{min-height:132px;border:1px solid #94a3b8;border-radius:14px;padding:10px;background:linear-gradient(#eff6ff,#dbeafe);position:relative;overflow:hidden}.aqc-cell.selected{outline:3px solid #2563eb}.aqc-cell button{width:100%;text-align:left;background:transparent;border:0;padding:0;position:relative;z-index:2}.aqc-level{position:absolute;left:0;right:0;bottom:0;background:rgba(37,99,235,.2);pointer-events:none}.aqc-salt{position:absolute;right:8px;bottom:7px;font-size:.75rem;font-weight:900}.aqc-controls,.aqc-scenarios,.aqc-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.aqc button{min-height:44px;border:1px solid var(--line);border-radius:11px;background:#fff;font-weight:800}.aqc-meter{height:12px;border-radius:999px;background:#e2e8f0;overflow:hidden}.aqc-meter span{display:block;height:100%;background:linear-gradient(90deg,#ef4444,#facc15,#22c55e);transition:width .25s}.aqc-log{min-height:112px}@media(max-width:820px){.aqc-main{grid-template-columns:1fr}.aqc-hud{grid-template-columns:repeat(3,1fr)}}@media(max-width:560px){.aqc-hud,.aqc-controls,.aqc-scenarios,.aqc-actions,.aqc-board{grid-template-columns:1fr}.aqc-cell{min-height:108px}}@media(prefers-reduced-motion:reduce){.aqc *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}`;
    document.head.append(style);
  }

  function addCard() {
    const grid = $('#app-grid');
    const template = $('#app-card-template');
    if (!grid || !template || $('[data-aqc]')) return;
    const active = $('.filter.is-active')?.dataset.filter || 'all';
    if (active !== 'all' && active !== APP.category) return;
    const fragment = template.content.cloneNode(true);
    $('.app-card', fragment).dataset.aqc = '1';
    $('.app-icon', fragment).textContent = APP.emoji;
    $('.app-meta', fragment).textContent = `Play · v${APP.version}`;
    $('.app-name', fragment).textContent = APP.name;
    $('.app-summary', fragment).textContent = APP.summary;
    const button = $('.app-card-button', fragment);
    button.setAttribute('aria-label', `Open ${APP.name}`);
    button.addEventListener('click', openApp);
    grid.append(fragment);
  }

  function boot() {
    installStyles();
    let attempts = 0;
    const retry = () => {
      addCard();
      if (!$('[data-aqc]') && attempts++ < 20) window.setTimeout(retry, 120);
    };
    retry();
    $$('.filter').forEach((button) => {
      if (button.dataset.aqcBound) return;
      button.dataset.aqcBound = '1';
      button.addEventListener('click', () => window.setTimeout(addCard));
    });
  }

  function openApp() {
    const dialog = $('#app-dialog');
    const stage = $('#app-stage');
    $('#dialog-title').textContent = APP.name;
    $('#dialog-category').textContent = 'Play · water strategy';
    $('#dialog-description').textContent = APP.description;
    $('#dialog-feedback').href = 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/issues/new?template=feedback.yml&title=%5BFeedback%5D%20Aquifer%20Commons';
    stage.replaceChildren();
    startGame(stage, dialog);
    dialog.showModal();
  }

  function startGame(stage, dialog) {
    const root = document.createElement('section');
    root.className = 'tool-panel aqc';
    root.innerHTML = `<div class="aqc-hud">${['Scenario','Season','Budget','Reserve','Salt risk','Score'].map((label, i) => `<div class="aqc-stat"><span>${label}</span><strong data-h="${i}"></strong></div>`).join('')}</div><div class="aqc-main"><section class="aqc-panel"><h3>Shared aquifer board</h3><div class="aqc-board" role="group" aria-label="Aquifer districts and water conditions"></div><p><small>Select a district, allocate supply or resilience, then advance the season.</small></p></section><aside class="aqc-panel"><div class="aqc-scenarios"></div><h3>District actions</h3><div class="aqc-controls"><button data-action="pump">Issue pumping permit</button><button data-action="conserve">Fund conservation</button><button data-action="recharge">Build recharge basin</button><button data-action="trade">Transfer water right</button></div><div class="aqc-actions"><button data-action="advance">Advance season</button><button data-action="forecast">Review forecast</button><button data-action="recover">Emergency compact</button><button data-action="submit">End compact</button><button data-action="restart">Restart scenario</button></div><p><strong>Commons health</strong></p><div class="aqc-meter"><span></span></div><div class="aqc-log result-card" aria-live="polite"></div><small>Keyboard: arrows select, P pump, C conserve, B recharge, T transfer, F forecast, Space advance, E emergency compact, Enter finish, R restart.</small></aside></div>`;
    stage.append(root);

    let unlocked = 0;
    let cumulative = 0;
    let state;
    const announce = (title, detail) => {
      $('.aqc-log', root).innerHTML = `<strong>${title}</strong><small>${detail}</small>`;
    };

    function begin(key) {
      const scenario = scenarios[key];
      state = {
        key,
        turn: 0,
        budget: scenario.budget,
        permits: 5,
        forecast: 2,
        recovery: 1,
        selected: 0,
        score: 0,
        finished: false,
        cells: districts.map((district, index) => ({
          level: 62 - (index % 3) * 5,
          salt: key === 'coast' && index === 3 ? 28 : 8,
          supply: 0,
          conserve: 0,
          recharge: 0
        }))
      };
      announce('Compact opened.', 'Keep reserves healthy, control salt risk, and meet demand across all six districts.');
      draw();
    }

    function select(index) {
      state.selected = (index + districts.length) % districts.length;
      draw();
    }

    function act(kind) {
      if (state.finished) return;
      const cell = state.cells[state.selected];
      const district = districts[state.selected];
      if (kind === 'pump') {
        if (state.permits < 1 || cell.level < 15) return announce('Permit denied.', 'No permits remain or the local water table is too low.');
        state.permits -= 1;
        cell.supply += 6;
        cell.level -= 6;
        cell.salt += state.key === 'coast' && district.type === 'town' ? 4 : 2;
        announce('Pumping permit issued.', `${district.name} gained 6 supply but lost local reserve.`);
      }
      if (kind === 'conserve') {
        if (state.budget < 2) return announce('Budget too low.', 'Conservation requires 2 budget.');
        state.budget -= 2;
        cell.conserve += 3;
        announce('Conservation funded.', `${district.name} demand falls by 3 this season.`);
      }
      if (kind === 'recharge') {
        if (state.budget < 3) return announce('Budget too low.', 'Managed recharge requires 3 budget.');
        state.budget -= 3;
        cell.recharge += 5;
        cell.level = Math.min(100, cell.level + 5);
        cell.salt = Math.max(0, cell.salt - 4);
        announce('Recharge basin built.', `${district.name} gained reserve and reduced salt pressure.`);
      }
      if (kind === 'trade') {
        if (state.budget < 1) return announce('Budget too low.', 'A transfer costs 1 budget.');
        const donor = state.cells.reduce((best, candidate, index) => candidate.supply > state.cells[best].supply ? index : best, 0);
        if (donor === state.selected || state.cells[donor].supply < 2) return announce('No transferable allocation.', 'Pump another district first or conserve locally.');
        state.budget -= 1;
        state.cells[donor].supply -= 2;
        cell.supply += 2;
        announce('Water right transferred.', `${districts[donor].name} sent 2 supply to ${district.name}.`);
      }
      draw();
    }

    function forecast() {
      if (!state.forecast) return announce('Forecast reviews spent.', 'Plan from current recharge and salinity trends.');
      state.forecast -= 1;
      const base = scenarios[state.key].recharge;
      const expected = Math.max(0, base + (state.turn % 3 === 0 ? 2 : -1) - (state.key === 'drought' && state.turn > 4 ? 2 : 0));
      announce('Seasonal forecast.', `Expected natural recharge: ${expected}. Salt pressure ${state.key === 'coast' ? 'rises after heavy coastal pumping' : 'remains moderate'}.`);
      draw();
    }

    function advance() {
      if (state.finished) return;
      const scenario = scenarios[state.key];
      const natural = Math.max(0, scenario.recharge + (state.turn % 3 === 0 ? 2 : -1) - (state.key === 'drought' && state.turn > 4 ? 2 : 0));
      let failures = 0;
      state.cells.forEach((cell, index) => {
        const need = Math.max(1, districts[index].demand - cell.conserve);
        const met = Math.min(need, cell.supply);
        cell.supply -= met;
        cell.level = Math.max(0, Math.min(100, cell.level + natural / 3 + cell.recharge * .35 - (need - met) * .6));
        cell.salt = Math.max(0, Math.min(100, cell.salt + (cell.level < 35 ? 5 : 0) + (state.key === 'coast' && index === 3 ? 3 : 0) - cell.recharge * .3));
        if (met < need || cell.level < 15 || cell.salt > 70) failures += 1;
        cell.conserve = Math.max(0, cell.conserve - 1);
        cell.recharge = Math.max(0, cell.recharge - 1);
      });
      state.turn += 1;
      state.permits = Math.min(6, state.permits + 2);
      state.budget += 2;
      state.score += Math.max(0, 120 - failures * 28);
      announce('Season advanced.', failures ? `${failures} districts missed demand or crossed a safety threshold.` : 'Every district stayed within its operating range.');
      if (state.cells.some((cell) => cell.level === 0 || cell.salt === 100)) {
        state.finished = true;
        announce('Compact failed.', 'A district reached aquifer collapse or complete salt intrusion.');
      }
      if (state.turn >= scenario.turns && !state.finished) finish();
      draw();
    }

    function recover() {
      if (!state.recovery) return announce('Emergency compact already used.', 'Finish with remaining permits and budget.');
      state.recovery = 0;
      state.cells.forEach((cell) => {
        cell.level = Math.max(25, cell.level);
        cell.salt = Math.max(0, cell.salt - 12);
        cell.supply += 2;
      });
      state.budget = Math.max(state.budget, 3);
      state.score -= 120;
      announce('Emergency compact activated.', 'Shared reserves stabilized, but the score ceiling fell.');
      draw();
    }

    function finish() {
      if (state.finished) return;
      const average = state.cells.reduce((sum, cell) => sum + cell.level, 0) / state.cells.length;
      const maxSalt = Math.max(...state.cells.map((cell) => cell.salt));
      const shortfalls = state.cells.filter((cell, index) => cell.supply < Math.max(1, districts[index].demand - cell.conserve)).length;
      state.score += Math.round(average * 5 + (100 - maxSalt) * 3 + state.budget * 20 + state.permits * 12 - shortfalls * 35);
      state.finished = true;
      const certified = average >= 45 && maxSalt < 65 && shortfalls <= 2 && state.turn >= Math.min(5, scenarios[state.key].turns - 2);
      if (certified) {
        if (state.key === 'valley') unlocked = Math.max(unlocked, 1);
        if (state.key === 'coast') unlocked = Math.max(unlocked, 2);
        cumulative += state.score;
        announce('Compact certified.', `Average reserve ${Math.round(average)}, peak salt risk ${Math.round(maxSalt)}, shortfalls ${shortfalls}.`);
      } else {
        announce('Compact incomplete.', `Target reserve 45+, salt below 65, and no more than two short districts. Current: ${Math.round(average)}, ${Math.round(maxSalt)}, ${shortfalls}.`);
      }
      draw();
    }

    function draw() {
      const scenario = scenarios[state.key];
      const average = state.cells.reduce((sum, cell) => sum + cell.level, 0) / state.cells.length;
      const maxSalt = Math.max(...state.cells.map((cell) => cell.salt));
      const health = Math.max(0, Math.min(100, average - maxSalt * .35 + 45));
      const values = [scenario.name, `${state.turn}/${scenario.turns}`, state.budget, Math.round(average), Math.round(maxSalt), state.score + cumulative];
      $$('[data-h]', root).forEach((element, index) => { element.textContent = values[index]; });
      $('.aqc-meter span', root).style.width = `${health}%`;
      $('.aqc-board', root).innerHTML = state.cells.map((cell, index) => {
        const district = districts[index];
        const need = Math.max(1, district.demand - cell.conserve);
        return `<div class="aqc-cell ${index === state.selected ? 'selected' : ''}"><div class="aqc-level" style="height:${cell.level}%"></div><button data-cell="${index}" aria-label="Select ${district.name}, water level ${Math.round(cell.level)}, salt risk ${Math.round(cell.salt)}"><h4>${district.name}</h4><div>${district.type} · supply ${cell.supply}/${need}</div><small>Level ${Math.round(cell.level)} · Salt ${Math.round(cell.salt)}</small></button><span class="aqc-salt">${cell.salt > 55 ? '⚠ salt' : 'stable'}</span></div>`;
      }).join('');
      $('.aqc-scenarios', root).innerHTML = Object.entries(scenarios).map(([key, item]) => `<button data-scenario="${key}" ${item.unlock > unlocked ? 'disabled' : ''}>${item.name}${item.unlock > unlocked ? ' · locked' : ''}</button>`).join('');
      $$('[data-action]', root).forEach((button) => { button.disabled = state.finished && button.dataset.action !== 'restart'; });
    }

    root.addEventListener('click', (event) => {
      const cell = event.target.closest('[data-cell]');
      if (cell) select(Number(cell.dataset.cell));
      const scenario = event.target.closest('[data-scenario]');
      if (scenario) begin(scenario.dataset.scenario);
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (['pump', 'conserve', 'recharge', 'trade'].includes(action)) act(action);
      if (action === 'advance') advance();
      if (action === 'forecast') forecast();
      if (action === 'recover') recover();
      if (action === 'submit') finish();
      if (action === 'restart') begin(state.key);
    });

    const keydown = (event) => {
      if (!dialog.open) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); select(state.selected + 1); }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); select(state.selected - 1); }
      if (event.key.toLowerCase() === 'p') act('pump');
      if (event.key.toLowerCase() === 'c') act('conserve');
      if (event.key.toLowerCase() === 'b') act('recharge');
      if (event.key.toLowerCase() === 't') act('trade');
      if (event.key.toLowerCase() === 'f') forecast();
      if (event.key === ' ') { event.preventDefault(); advance(); }
      if (event.key.toLowerCase() === 'e') recover();
      if (event.key === 'Enter') finish();
      if (event.key.toLowerCase() === 'r') begin(state.key);
    };
    window.addEventListener('keydown', keydown);
    dialog.addEventListener('close', () => {
      window.removeEventListener('keydown', keydown);
      $('#aqc-style')?.remove();
    }, { once: true });
    begin('valley');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();