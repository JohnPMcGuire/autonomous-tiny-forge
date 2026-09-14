const ledgerRoot = document.querySelector('#forge-ledger-root');

if (ledgerRoot) {
  initForgeLedger();
}

async function initForgeLedger() {
  normalizeLedgerRoot();
  installShippingGapStyles();
  try {
    const [ledgerResponse, appsResponse] = await Promise.all([
      fetch('./registry/forge-ledger.json', { cache: 'no-store' }),
      fetch('./registry/apps.json', { cache: 'no-store' })
    ]);

    if (!ledgerResponse.ok) throw new Error(`Forge ledger returned ${ledgerResponse.status}`);
    if (!appsResponse.ok) throw new Error(`App registry returned ${appsResponse.status}`);

    const [ledger, registry] = await Promise.all([
      ledgerResponse.json(),
      appsResponse.json()
    ]);

    if (ledger.schemaVersion !== 1 || !ledger.sprint || !Array.isArray(ledger.method)) {
      throw new Error('Forge ledger shape is invalid');
    }

    renderForgeLedger(ledger, Array.isArray(registry.apps) ? registry.apps : []);
  } catch (error) {
    normalizeLedgerRoot();
    ledgerRoot.replaceChildren(
      element('p', 'ledger-error', 'The public build ledger could not be loaded. The repository history remains available on GitHub.')
    );
    console.error(error);
  }
}

function normalizeLedgerRoot() {
  ledgerRoot.classList.remove('ledger-loading');
  ledgerRoot.classList.add('forge-ledger-root');
}

function renderForgeLedger(ledger, apps) {
  normalizeLedgerRoot();
  const sprint = ledger.sprint;
  const scheduleCard = element('article', 'ledger-schedule-card');
  const scheduleTop = element('div', 'ledger-card-heading');
  const scheduleCopy = document.createElement('div');
  const stateBadge = element('span', 'ledger-state');
  const scheduleTitle = element('h3', '', sprint.name);
  const scheduleSummary = element('p', 'ledger-summary', `${sprint.scheduler} · ${sprint.runsPerDay} review windows per day · every ${formatInterval(sprint.intervalMinutes)} · ${formatRange(sprint.startsAt, sprint.endsAt, sprint.timezone)}`);
  scheduleCopy.append(stateBadge, scheduleTitle, scheduleSummary);

  const nextBlock = element('div', 'ledger-next');
  const nextLabel = element('span', 'ledger-next-label', 'Next review window');
  const nextValue = element('strong', 'ledger-next-value');
  const nextExact = element('small', 'ledger-next-exact');
  nextBlock.append(nextLabel, nextValue, nextExact);
  scheduleTop.append(scheduleCopy, nextBlock);

  const progressWrap = element('div', 'ledger-progress-wrap');
  const progressCopy = element('div', 'ledger-progress-copy');
  const progressLabel = element('span', '', 'Sprint progress');
  const progressValue = element('strong');
  progressCopy.append(progressLabel, progressValue);
  const progressTrack = element('div', 'ledger-progress-track');
  progressTrack.setAttribute('role', 'progressbar');
  progressTrack.setAttribute('aria-valuemin', '0');
  progressTrack.setAttribute('aria-valuemax', String(sprint.plannedReviewWindows));
  const progressBar = element('span', 'ledger-progress-bar');
  progressTrack.append(progressBar);
  progressWrap.append(progressCopy, progressTrack);

  const stats = element('dl', 'ledger-stats');
  stats.append(
    stat('Current apps', String(apps.length)),
    stat('Planned reviews', String(sprint.plannedReviewWindows)),
    stat('Max changes / review', String(sprint.maxPublishableChangesPerWindow)),
    stat('Visible candidates', String(ledger.queue.length))
  );

  const truthNote = element('p', 'ledger-truth-note', sprint.note);
  const secondaryNote = element('p', 'ledger-truth-note ledger-secondary-note', sprint.secondaryAutomation);
  scheduleCard.append(scheduleTop, progressWrap, stats, truthNote, secondaryNote);

  const experimentSection = renderShippingGapExperiment(ledger, sprint);

  const methodSection = element('section', 'ledger-panel');
  const methodHeader = sectionHeader('The build method', 'A scheduled review follows the same bounded path every time.');
  const methodList = element('ol', 'ledger-method');
  ledger.method.forEach((step, index) => {
    const item = element('li', 'ledger-method-step');
    const number = element('span', 'ledger-method-number', String(index + 1).padStart(2, '0'));
    const copy = document.createElement('div');
    copy.append(element('h4', '', step.label), element('p', '', step.description));
    item.append(number, copy);
    methodList.append(item);
  });
  methodSection.append(methodHeader, methodList);

  const queueSection = element('section', 'ledger-panel ledger-queue-panel');
  const queueHeader = sectionHeader('Current build list', 'Candidates are visible, ranked, and revisable. A position here is not a promise to ship.');
  const queueList = element('ol', 'ledger-queue');
  ledger.queue.forEach((item, index) => {
    const row = element('li', `ledger-queue-item is-${safeToken(item.status)}`);
    const rank = element('span', 'ledger-queue-rank', String(index + 1).padStart(2, '0'));
    const copy = element('div', 'ledger-queue-copy');
    const titleRow = element('div', 'ledger-queue-title-row');
    titleRow.append(
      element('h4', '', item.title),
      element('span', 'ledger-status-pill', labelStatus(item.status))
    );
    copy.append(
      titleRow,
      element('p', '', item.reason),
      element('small', '', `Source: ${item.source}`)
    );
    row.append(rank, copy);
    queueList.append(row);
  });
  queueSection.append(queueHeader, queueList);

  const gateSection = element('section', 'ledger-panel ledger-gate-panel');
  const gateHeader = sectionHeader('What blocks a release', 'The schedule creates review opportunities, not permission to publish anything.');
  const gateList = element('ul', 'ledger-gates');
  ledger.qualityGates.forEach((gate) => {
    const item = document.createElement('li');
    item.append(element('span', 'ledger-check', '✓'), document.createTextNode(gate));
    gateList.append(item);
  });
  const links = element('div', 'ledger-links');
  links.append(
    externalLink('Repository history ↗', 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/commits/main'),
    externalLink('Validation workflows ↗', 'https://github.com/JohnPMcGuire/autonomous-tiny-forge/actions')
  );
  gateSection.append(gateHeader, gateList, links);

  const decisionsSection = element('section', 'ledger-panel ledger-decisions-panel');
  const decisionsHeader = sectionHeader('Recent decisions', 'Published changes record what changed and which gates were expected to pass. Skipped windows create no release.');
  const decisionsList = element('div', 'ledger-decisions');
  ledger.recentDecisions.forEach((decision) => {
    const article = element('article', 'ledger-decision');
    const meta = element('div', 'ledger-decision-meta');
    meta.append(
      element('time', '', formatDecisionDate(decision.date)),
      element('span', `ledger-status-pill is-${safeToken(decision.result)}`, labelStatus(decision.result))
    );
    const checks = element('ul', 'ledger-decision-checks');
    decision.checks.forEach((check) => checks.append(element('li', '', check)));
    article.append(meta, element('h4', '', decision.title), element('p', '', decision.summary), checks);
    decisionsList.append(article);
  });
  decisionsSection.append(decisionsHeader, decisionsList);

  const columns = element('div', 'ledger-columns');
  columns.append(methodSection, queueSection);
  const lowerColumns = element('div', 'ledger-columns ledger-columns-lower');
  lowerColumns.append(gateSection, decisionsSection);

  ledgerRoot.replaceChildren(scheduleCard, experimentSection, columns, lowerColumns);

  const liveReviewWindows = experimentSection.querySelector('[data-shipping-metric="reviewWindowsReached"]');
  const liveAcceptance = experimentSection.querySelector('[data-shipping-metric="releaseAcceptanceRate"]');
  const refreshSchedule = () => {
    const snapshot = scheduleSnapshot(sprint, new Date());
    stateBadge.textContent = snapshot.label;
    stateBadge.className = `ledger-state is-${snapshot.state}`;
    nextLabel.textContent = snapshot.nextLabel;
    nextValue.textContent = snapshot.nextValue;
    nextExact.textContent = snapshot.nextExact;
    progressValue.textContent = `${snapshot.elapsed} of ${sprint.plannedReviewWindows} windows`;
    progressTrack.setAttribute('aria-valuenow', String(snapshot.elapsed));
    progressTrack.setAttribute('aria-valuetext', `${snapshot.elapsed} of ${sprint.plannedReviewWindows} review windows reached`);
    progressBar.style.width = `${snapshot.percent}%`;
    if (liveReviewWindows) liveReviewWindows.textContent = String(Math.max(snapshot.elapsed, Number(ledger.shippingMetrics?.reviewWindowsReached || 0)));
    if (liveAcceptance) liveAcceptance.textContent = acceptanceRate(ledger.shippingMetrics, snapshot.elapsed);
  };

  refreshSchedule();
  window.setInterval(refreshSchedule, 30000);
}

function renderShippingGapExperiment(ledger, sprint) {
  const lens = ledger.researchLens || {};
  const metrics = ledger.shippingMetrics || {};
  const panel = element('section', 'ledger-panel shipping-gap-panel');
  const header = sectionHeader(
    lens.name || 'Shipping Gap Experiment',
    'A public micro-lab for the difference between AI coding activity and durable shipped software.'
  );

  const statement = element('div', 'shipping-gap-statement');
  statement.append(
    element('p', '', lens.claimTested || 'AI can create more code activity than lasting shipped value.'),
    element('p', '', lens.projectHypothesis || 'The project tracks validation, deployment, feedback, repair, and skipped windows as part of shipping quality.')
  );

  const reference = element('article', 'shipping-reference');
  reference.append(
    element('span', 'shipping-reference-label', 'Research reference'),
    element('h4', '', lens.paper?.title || 'Writing Code vs. Shipping Code'),
    element('p', '', `${(lens.paper?.authors || []).join(', ')} · ${lens.paper?.workingPaper || 'NBER Working Paper'} · DOI ${lens.paper?.doi || '10.3386/w35275'}`),
    element('p', 'shipping-reference-note', lens.relationship || 'Conceptual reference only; this project is not a formal replication.')
  );
  const paperLink = externalLink('Open NBER paper ↗', 'https://www.nber.org/papers/w35275');
  reference.append(paperLink);

  const metricsGrid = element('dl', 'shipping-metrics');
  const snapshot = scheduleSnapshot(sprint, new Date());
  metricsGrid.append(
    metric('Review windows reached', String(Math.max(snapshot.elapsed, Number(metrics.reviewWindowsReached || 0))), 'reviewWindowsReached'),
    metric('Candidate changes', String(metrics.candidateChangesConsidered || 0)),
    metric('PRs opened', String(metrics.pullRequestsOpened || 0)),
    metric('PRs merged', String(metrics.pullRequestsMerged || 0)),
    metric('Successful deployments', String(metrics.successfulDeployments || 0)),
    metric('Skipped windows', String(metrics.skippedWindows || 0)),
    metric('Bug reports', String(metrics.bugReports || 0)),
    metric('Repair releases', String(metrics.repairReleases || 0)),
    metric('Release acceptance', acceptanceRate(metrics, snapshot.elapsed), 'releaseAcceptanceRate')
  );

  const mix = element('div', 'shipping-review-mix');
  mix.append(element('h4', '', 'Daily review mix'));
  const mixList = element('ul', 'shipping-review-list');
  (ledger.reviewMix || []).forEach((item) => {
    const row = document.createElement('li');
    row.append(
      element('strong', '', `${item.windowsPerDay}/day · ${item.label}`),
      element('span', '', item.purpose)
    );
    mixList.append(row);
  });
  mix.append(mixList);

  const criteria = element('div', 'shipping-criteria');
  criteria.append(element('h4', '', 'Definition of shipped'));
  const criteriaList = element('ul', 'shipping-criteria-list');
  (ledger.releaseCriteria || []).forEach((item) => {
    const row = document.createElement('li');
    row.append(element('span', 'ledger-check', '✓'), document.createTextNode(item));
    criteriaList.append(row);
  });
  criteria.append(criteriaList);

  const footnote = element('p', 'shipping-metric-note', metrics.metricNote || 'Metrics update only when evidence is available. Skips should not create cosmetic ledger-only releases.');

  const top = element('div', 'shipping-gap-top');
  top.append(statement, reference);
  const bottom = element('div', 'shipping-gap-bottom');
  bottom.append(metricsGrid, mix, criteria);
  panel.append(header, top, bottom, footnote);
  return panel;
}

function metric(label, value, key = '') {
  const wrapper = document.createElement('div');
  const term = element('dt', '', label);
  const detail = element('dd', '', value);
  if (key) detail.dataset.shippingMetric = key;
  wrapper.append(term, detail);
  return wrapper;
}

function acceptanceRate(metrics = {}, elapsedWindows = 0) {
  const numerator = Number(metrics.mergedReleases || metrics.pullRequestsMerged || 0);
  const denominator = Math.max(Number(metrics.reviewWindowsReached || 0), elapsedWindows, 1);
  const percent = Math.round((numerator / denominator) * 1000) / 10;
  return `${numerator} / ${denominator} (${percent}%)`;
}

function scheduleSnapshot(sprint, now) {
  const start = new Date(sprint.startsAt);
  const end = new Date(sprint.endsAt);
  const interval = sprint.intervalMinutes * 60 * 1000;
  const total = sprint.plannedReviewWindows;

  if (now < start) {
    return {
      state: 'waiting',
      label: 'Starts soon',
      nextLabel: 'Sprint begins',
      nextValue: formatCountdown(start - now),
      nextExact: formatDateTime(start, sprint.timezone),
      elapsed: 0,
      percent: 0
    };
  }

  if (now >= end) {
    return {
      state: 'complete',
      label: 'Sprint complete',
      nextLabel: 'Review sprint',
      nextValue: 'Complete',
      nextExact: `Ended ${formatDateTime(end, sprint.timezone)}`,
      elapsed: total,
      percent: 100
    };
  }

  const elapsed = Math.min(total, Math.floor((now - start) / interval) + 1);
  const next = new Date(start.getTime() + elapsed * interval);
  return {
    state: 'active',
    label: 'Active sprint',
    nextLabel: 'Next review window',
    nextValue: formatCountdown(next - now),
    nextExact: formatDateTime(next, sprint.timezone),
    elapsed,
    percent: Math.min(100, (elapsed / total) * 100)
  };
}

function stat(label, value) {
  const wrapper = document.createElement('div');
  wrapper.append(element('dt', '', label), element('dd', '', value));
  return wrapper;
}

function sectionHeader(title, description) {
  const header = element('header', 'ledger-panel-header');
  header.append(element('h3', '', title), element('p', '', description));
  return header;
}

function externalLink(label, href) {
  const link = element('a', 'text-link', label);
  link.href = href;
  link.target = '_blank';
  link.rel = 'noreferrer';
  return link;
}

function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function safeToken(value) {
  return String(value || 'unknown').toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

function labelStatus(value) {
  return String(value || 'unknown')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatInterval(minutes) {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  return `${minutes} minutes`;
}

function formatRange(startValue, endValue, timezone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: timezone
  });
  return `${formatter.format(new Date(startValue))}–${formatter.format(new Date(endValue))} · Central time`;
}

function formatDateTime(value, timezone) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
    timeZoneName: 'short'
  }).format(value);
}

function formatDecisionDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatCountdown(milliseconds) {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function installShippingGapStyles() {
  if (document.querySelector('#shipping-gap-styles')) return;
  const style = document.createElement('style');
  style.id = 'shipping-gap-styles';
  style.textContent = `
    .shipping-gap-panel { display: grid; gap: 22px; background: linear-gradient(135deg, var(--paper-strong), color-mix(in srgb, var(--mint) 17%, white)); }
    .shipping-gap-top { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, .8fr); gap: 18px; }
    .shipping-gap-statement, .shipping-reference { padding: 18px; border: 1px solid var(--line); border-radius: 18px; background: white; }
    .shipping-gap-statement { display: grid; gap: 10px; }
    .shipping-gap-statement p, .shipping-reference p { margin: 0; color: var(--muted); line-height: 1.55; }
    .shipping-gap-statement p:first-child { color: var(--ink); font-size: 1.1rem; font-weight: 850; }
    .shipping-reference-label { display: inline-flex; margin-bottom: 8px; color: var(--accent-dark); font-size: .68rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
    .shipping-reference h4, .shipping-review-mix h4, .shipping-criteria h4 { margin: 0 0 8px; font-size: 1.05rem; }
    .shipping-reference-note { margin-top: 10px !important; }
    .shipping-reference .text-link { display: inline-flex; margin-top: 13px; }
    .shipping-gap-bottom { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(260px, .92fr); gap: 18px; }
    .shipping-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; align-content: start; }
    .shipping-metrics div, .shipping-review-mix, .shipping-criteria { padding: 13px; border: 1px solid var(--line); border-radius: 16px; background: white; }
    .shipping-metrics dt { color: var(--muted); font-size: .64rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
    .shipping-metrics dd { margin: 5px 0 0; font-size: 1.16rem; font-weight: 900; letter-spacing: -.035em; }
    .shipping-review-list, .shipping-criteria-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
    .shipping-review-list li { display: grid; gap: 4px; padding-top: 8px; border-top: 1px solid var(--line); }
    .shipping-review-list strong { font-size: .9rem; }
    .shipping-review-list span { color: var(--muted); line-height: 1.45; }
    .shipping-criteria { grid-column: 2; }
    .shipping-criteria-list li { display: grid; grid-template-columns: 26px 1fr; gap: 10px; align-items: start; line-height: 1.45; }
    .shipping-metric-note { margin: 0; color: var(--muted); line-height: 1.5; }
    @media (max-width: 900px) { .shipping-gap-top, .shipping-gap-bottom { grid-template-columns: 1fr; } .shipping-criteria { grid-column: auto; } }
    @media (max-width: 620px) { .shipping-metrics { grid-template-columns: 1fr; } }
  `;
  document.head.append(style);
}
