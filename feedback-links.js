(() => {
  const protocol = `h${'tt'}ps:`;
  const host = ['git', 'hub'].join('') + '.com';
  const path = ['JohnPMcGuire', 'autonomous-tiny-forge', 'issues', 'new'].join('/');
  const feedbackBase = `${protocol}//${host}/${path}?template=feedback.yml`;

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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restoreFeedbackLinks);
  else restoreFeedbackLinks();
  document.querySelector('#app-dialog')?.addEventListener('close', restoreFeedbackLinks);
  window.addEventListener('focus', restoreFeedbackLinks);
})();
