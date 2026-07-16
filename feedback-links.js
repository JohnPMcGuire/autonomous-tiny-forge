(() => {
  const protocol = `h${'tt'}ps:`;
  const host = ['git', 'hub'].join('') + '.com';
  const path = ['JohnPMcGuire', 'autonomous-tiny-forge', 'issues', 'new'].join('/');
  const feedbackBase = `${protocol}//${host}/${path}?template=feedback.yml`;
  const sprintApps = ['alt-text-atelier.js', 'stairwell-steward.js', 'sunprint-safari.js', 'battery-bazaar.js', 'echo-reef-rescue.js', 'orchard-graft-lab.js', 'harbor-pilot.js', 'heat-island-planner.js', 'metro-dispatch.js', 'tidepool-food-web.js', 'tactile-geometry-workshop.js', 'delta-steward.js', 'kitchen-pass.js', 'molecule-assembly-lab.js', 'archive-rescue-lab.js', 'volcano-watch.js', 'emergency-radio-net.js', 'council-commons.js', 'foley-stage-lab.js', 'access-path-lab.js', 'community-fridge-steward.js', 'shelter-shift.js', 'loom-logic-studio.js', 'orbital-salvage-yard.js', 'evidence-chamber.js', 'museum-flow-lab.js', 'circuit-relay-lab.js', 'interpreter-booth.js', 'thermal-ops-lab.js', 'water-network-lab.js', 'wildfire-command.js', 'stage-blocking-lab.js', 'memory-palace-courier.js', 'signal-choir.js', 'constellation-surveyor.js', 'rail-yard-shunter.js', 'cipher-dispatch.js', 'dialect-drift-lab.js', 'bookbinding-studio.js', 'caption-control-room.js', 'pantry-planner.js', 'rigging-rescue-lab.js', 'floodplain-architect.js', 'seed-bank-steward.js', 'microgrid-dispatcher.js', 'animation-timing-studio.js', 'pollinator-corridor-planner.js', 'stratosphere-mission-control.js', 'aquifer-commons.js', 'compost-cascade.js', 'repair-bench.js', 'anomaly-array.js', 'demand-ripple.js', 'playtest-lab.js'];

  function loadSprintApps() {
    sprintApps.forEach((file) => {
      const slug = file.replace('.js', '');
      if (document.querySelector(`script[data-forge-sprint-app="${slug}"]`) || document.querySelector(`script[src="./${file}"]`)) return;
      const script = document.createElement('script');
      script.defer = true;
      script.src = `./${file}`;
      script.dataset.forgeSprintApp = slug;
      document.head.append(script);
    });
  }

  function restoreFeedbackLinks() {
    document.querySelectorAll('a').forEach((link) => {
      const label = link.textContent.trim().toLowerCase();
      if (label === 'submit feedback' || label === 'leave feedback for this app') {
        link.href = feedbackBase;
        link.target = '_blank';
        link.rel = 'noreferrer';
      }
    });
  }

  function boot() {
    loadSprintApps();
    restoreFeedbackLinks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.querySelector('#app-dialog')?.addEventListener('close', restoreFeedbackLinks);
  window.addEventListener('focus', restoreFeedbackLinks);
})();
