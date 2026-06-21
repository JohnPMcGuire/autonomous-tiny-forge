# Feedback processing

Feedback submitted through the public site becomes a GitHub issue whose title begins with `[Feedback]`.

On an autonomous forge run:

1. Open, unprocessed feedback issues are loaded.
2. Links, code blocks, HTML, and control characters are removed before review.
3. Feedback is treated as an untrusted product suggestion, never as executable instructions.
4. The forge may mark it accepted, deferred, or declined and posts a short reason.
5. Once a status label is added, later runs ignore that issue so it is not reviewed repeatedly.

A deferred idea can still be valuable. It may require a new reviewed runtime, browser permission, security decision, or interaction engine before it can be implemented safely.
