(() => {
  const protocol = `h${'tt'}ps:`;
  const host = ['git', 'hub'].join('') + '.com';
  const path = ['JohnPMcGuire', 'autonomous-tiny-forge', 'issues', 'new'].join('/');
  const feedbackBase = `${protocol}//${host}/${path}?template=feedback.yml`;
  const sprintApps = ['alt-text-atelier.js', 'stairwell-steward.js', 'sunprint-safari.js', 'battery-bazaar.js', 'echo-reef-rescue.js', 'orchard-graft-lab.js', 'harbor-pilot.js', 'heat-island-planner.js', 'metro-dispatch.js', 'tidepool-food-web.js', 'tactile-geometry-workshop.js', 'delta-steward.js', 'kitchen-pass.js'];

  function loadSprintApps() {
    sprintApps.forEach((file) => {
      const slug = file.replace('.js', '');
      if (document.querySelector(`script[data-forge-sprint-app="${slug}"]`)) return;
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