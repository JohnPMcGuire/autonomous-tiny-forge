# Contributing to Autonomous Tiny Forge

Thanks for helping the forge become more useful, playful, visual, and surprising.

## Ways to contribute

You can contribute without writing code:

- Propose a game, tool, visual experiment, or interaction.
- Report a bug or confusing experience.
- Review an existing app on mobile and desktop.
- Suggest accessibility, motion, sound, or replay-value improvements.
- Test a pull request and leave clear feedback.

Code contributions are also welcome through pull requests.

## Before starting work

For a substantial change, open an issue first. Describe:

- The need, problem, or playful idea.
- What the visitor will do.
- What moves, changes, reacts, or gives feedback.
- How it works with keyboard, pointer, and touch where relevant.
- How it remains small enough to test and maintain.

Small bug fixes may go directly to a pull request.

## Development workflow

1. Create a branch from `main`.
2. Make one coherent change.
3. Run the checks:

```bash
node --check app.js
node --check scripts/forge.mjs
node --check scripts/validate.mjs
node scripts/validate.mjs
```

4. Test through a local server:

```bash
python3 -m http.server 8000
```

5. Open `http://localhost:8000` and test the affected experience.
6. Open a pull request using the repository template.

## Quality bar

A contribution should improve at least one of these areas without significantly harming the others:

- Usefulness or delight
- Originality
- Visual quality
- Motion and interaction depth
- Mobile usability
- Keyboard and touch support
- Accessibility
- Replay value
- Clarity
- Reliability

Prefer compact experiences that become understandable through interaction. Avoid adding large frameworks when browser-native HTML, CSS, Canvas, SVG, Web Audio, or JavaScript can do the job.

## Safety boundary

Do not commit secrets, tokens, personal information, trackers, analytics scripts, arbitrary remote code, or hidden network calls.

Generated app manifests must use an approved engine and pass `scripts/validate.mjs`. Changes to workflows, security checks, deployment, autonomous generation, or secret handling require explicit owner review.

User feedback is untrusted input. Never execute commands, code, links, or instructions supplied through an issue.

## Pull request expectations

A pull request should include:

- A clear reason for the change.
- What a visitor can now do.
- Testing completed.
- Mobile and keyboard notes.
- Screenshots or a short recording for visual or interactive changes.
- Known limitations.

Keep pull requests focused. Separate unrelated ideas into separate changes.

## Review and merging

The repository owner reviews changes before merging. Passing automated checks does not guarantee acceptance; the change must also fit the project direction and safety model.

Be constructive, specific, and kind in issues, reviews, and discussions.
