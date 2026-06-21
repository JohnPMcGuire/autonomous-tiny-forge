import assert from 'node:assert/strict';

const processedFeedbackLabels = new Set([
  'feedback:accepted',
  'feedback:declined',
  'feedback:deferred'
]);

function isPendingFeedback(issue) {
  if (issue.pull_request || !issue.title.startsWith('[Feedback]')) return false;
  const labels = (issue.labels || []).map((label) => typeof label === 'string' ? label : label.name);
  return !labels.some((label) => processedFeedbackLabels.has(label));
}

assert.equal(isPendingFeedback({ title: '[Feedback] General idea', labels: [] }), true);
assert.equal(isPendingFeedback({ title: '[Bug] General idea', labels: [] }), false);
assert.equal(isPendingFeedback({ title: '[Feedback] Reviewed', labels: [{ name: 'feedback:deferred' }] }), false);
assert.equal(isPendingFeedback({ title: '[Feedback] Reviewed', labels: ['feedback:accepted'] }), false);
assert.equal(isPendingFeedback({ title: '[Feedback] Pull request', labels: [], pull_request: {} }), false);

console.log('Feedback routing tests passed.');
