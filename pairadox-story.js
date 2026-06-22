(() => {
  const baseRenderer = window.renderChoiceMixer;
  if (typeof baseRenderer !== 'function') return;

  const styleId = 'pairadox-story-styles';
  const storyTemplates = [
    {
      icon: '🏛️',
      twist: 'Unexpected promotion',
      make: (first, second) => `The town hired ${first.toLowerCase()} to supervise ${second.toLowerCase()}. By lunch, they had renamed Tuesday, issued matching capes, and declared the problem “mostly decorative.”`
    },
    {
      icon: '🎤',
      twist: 'Talent show',
      make: (first, second) => `At the annual talent show, ${first.toLowerCase()} teamed up with ${second.toLowerCase()}. Their entire act was a dramatic pause followed by one tiny bow. The judges called it “administratively brave.”`
    },
    {
      icon: '🕵️',
      twist: 'Tiny mystery',
      make: (first, second) => `${first} and ${second.toLowerCase()} opened a detective agency. Their first case was finding the office keys, which were in the door. They held a press conference anyway.`
    },
    {
      icon: '🏁',
      twist: 'Very slow race',
      make: (first, second) => `When ${first.toLowerCase()} challenged ${second.toLowerCase()} to a race, neither moved. After eleven tense minutes, a houseplant won by leaning toward the window.`
    },
    {
      icon: '🧙',
      twist: 'Questionable magic',
      make: (first, second) => `A wizard combined ${first.toLowerCase()} with ${second.toLowerCase()} to create a legendary power. It only worked on Wednesdays, but on Wednesdays it was extremely confident.`
    },
    {
      icon: '🖼️',
      twist: 'Museum opening',
      make: (first, second) => `The museum placed ${first.toLowerCase()} beside ${second.toLowerCase()} and called the exhibit “Modern Progress.” Visitors nodded thoughtfully until the gift shop started charging admission.`
    }
  ];

  const iconByOption = {
    'A nearby object': '🪑',
    'A sound': '🔊',
    'A childhood memory': '🛝',
    'A color': '🎨',
    'A secret rule': '🤫',
    'A compliment': '👏',
    'A ridiculous name': '🎭',
    'A tiny movement': '🕺'
  };

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .pairadox-output-fieldset { margin: 0; padding: 0; border: 0; }
      .pairadox-output-fieldset legend { margin-bottom: 8px; color: var(--muted); font-size: .72rem; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; }
      .pairadox-output-modes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .pairadox-output-mode { min-height: 62px; border: 1px solid var(--line); border-radius: 16px; padding: 10px 13px; display: grid; align-content: center; gap: 2px; background: white; color: var(--ink); text-align: left; cursor: pointer; }
      .pairadox-output-mode:hover { transform: translateY(-1px); border-color: rgba(21,33,28,.42); }
      .pairadox-output-mode:focus-visible { outline: 4px solid var(--accent); outline-offset: 3px; }
      .pairadox-output-mode[aria-pressed="true"] { border-color: var(--ink); background: var(--mint); box-shadow: inset 0 0 0 1px var(--ink); }
      .pairadox-output-mode strong { font-size: .9rem; }
      .pairadox-output-mode small { color: var(--muted); font-size: .72rem; line-height: 1.3; }
      .pairadox-story-output { display: grid; gap: 14px; }
      .pairadox-story-output > strong { font-size: clamp(1.25rem, 3.8vw, 2.1rem); }
      .pairadox-story-copy { margin: 0; max-width: 68ch; line-height: 1.55; }
      .pairadox-storyboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .pairadox-story-scene { min-height: 94px; border: 1px solid var(--line); border-radius: 16px; padding: 10px; display: grid; place-items: center; align-content: center; gap: 5px; background: rgba(255,255,255,.66); text-align: center; animation: pairadox-story-pop .35s cubic-bezier(.2,.8,.2,1) both; }
      .pairadox-story-scene:nth-child(2) { animation-delay: .08s; }
      .pairadox-story-scene:nth-child(3) { animation-delay: .16s; }
      .pairadox-story-symbol { font-size: 2rem; line-height: 1; }
      .pairadox-story-caption { color: var(--muted); font-size: .72rem; font-weight: 800; line-height: 1.25; }
      @keyframes pairadox-story-pop { from { opacity: 0; transform: translateY(8px) scale(.96); } to { opacity: 1; transform: none; } }
      @media (max-width: 430px) {
        .pairadox-output-modes, .pairadox-storyboard { grid-template-columns: 1fr; }
        .pairadox-output-mode { min-height: 54px; }
        .pairadox-story-scene { min-height: 70px; grid-template-columns: auto 1fr; justify-items: start; text-align: left; }
      }
      @media (prefers-reduced-motion: reduce) {
        .pairadox-story-scene { animation: none; }
      }
    `;
    document.head.append(styles);
  }

  window.renderChoiceMixer = function renderChoiceMixerWithStories(app) {
    baseRenderer(app);
    installStyles();

    const root = document.querySelector('#app-stage .pairadox-game');
    if (!root) return;

    const arena = root.querySelector('.pairadox-arena');
    const result = root.querySelector('.pairadox-result');
    const actions = root.querySelector('.tool-actions');
    const count = root.querySelector('.pairadox-count');
    const slots = [...root.querySelectorAll('.pairadox-slot-value')];
    const tokens = [...root.querySelectorAll('.pairadox-token')];
    if (!arena || !result || !actions || slots.length !== 2) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let storyMode = false;
    let writing = false;
    let storyTimer = 0;
    let storyCount = 0;
    let lastStory = -1;
    let disposed = false;

    const fieldset = document.createElement('fieldset');
    fieldset.className = 'pairadox-output-fieldset';
    const legend = document.createElement('legend');
    legend.textContent = 'Choose what the forge makes';
    const modes = document.createElement('div');
    modes.className = 'pairadox-output-modes';
    const challengeButton = makeModeButton('Challenge mode', 'Get a prompt to complete yourself.');
    const storyButton = makeModeButton('Story mode', 'Generate a funny micro-story and symbolic storyboard.');
    challengeButton.setAttribute('aria-pressed', 'true');
    storyButton.setAttribute('aria-pressed', 'false');
    modes.append(challengeButton, storyButton);
    fieldset.append(legend, modes);
    arena.before(fieldset);

    const remixStoryButton = makeButton('Remix story', () => scheduleStory(true), true);
    remixStoryButton.hidden = true;
    remixStoryButton.disabled = true;
    actions.insertBefore(remixStoryButton, actions.children[1] || null);

    challengeButton.addEventListener('click', () => setMode(false));
    storyButton.addEventListener('click', () => setMode(true));

    const observer = new MutationObserver(() => {
      if (disposed || !storyMode || writing || arena.classList.contains('is-forging')) return;
      if (result.querySelector('.pairadox-story-output')) return;
      const pair = getPair();
      remixStoryButton.disabled = !pair;
      if (pair) scheduleStory(false);
    });
    observer.observe(result, { childList: true, subtree: true });

    const slotObserver = new MutationObserver(() => {
      const pair = getPair();
      remixStoryButton.disabled = !pair;
    });
    slots.forEach((slot) => slotObserver.observe(slot, { childList: true, characterData: true, subtree: true }));

    document.querySelector('#app-dialog')?.addEventListener('close', cleanup, { once: true });

    function makeModeButton(label, detail) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pairadox-output-mode';
      const strong = document.createElement('strong');
      strong.textContent = label;
      const small = document.createElement('small');
      small.textContent = detail;
      button.append(strong, small);
      return button;
    }

    function getPair() {
      const values = slots.map((slot) => slot.textContent.trim());
      return values.every((value) => value && value !== 'Drop here') ? values : null;
    }

    function setMode(nextStoryMode) {
      if (storyMode === nextStoryMode) return;
      window.clearTimeout(storyTimer);
      writing = false;
      arena.classList.remove('is-forging');
      storyMode = nextStoryMode;
      challengeButton.setAttribute('aria-pressed', String(!storyMode));
      storyButton.setAttribute('aria-pressed', String(storyMode));
      remixStoryButton.hidden = !storyMode;
      const pair = getPair();
      remixStoryButton.disabled = !pair;

      if (storyMode) {
        if (pair) scheduleStory(true);
        else setStatus('Story forge selected.', 'Add two ingredients to generate a complete funny story and three symbolic scenes.');
        return;
      }

      if (pair) replayChallenge();
      else setStatus('Challenge forge selected.', 'Add two ingredients to receive a creative prompt you complete yourself.');
    }

    function replayChallenge() {
      const selectedToken = tokens.find((token) => token.getAttribute('aria-pressed') === 'true');
      if (!selectedToken) return;
      selectedToken.click();
      selectedToken.click();
    }

    function scheduleStory(showForgeMotion) {
      const pair = getPair();
      if (!storyMode || !pair || disposed) return;
      window.clearTimeout(storyTimer);
      writing = true;
      if (showForgeMotion) arena.classList.add('is-forging');
      setStatus('Writing a tiny comedy…', 'The two ingredients are becoming a three-scene story.');
      storyTimer = window.setTimeout(() => renderStory(pair), reducedMotion ? 0 : 420);
    }

    function renderStory(pair) {
      if (disposed || !storyMode) return;
      let storyIndex = Math.floor(Math.random() * storyTemplates.length);
      if (storyTemplates.length > 1 && storyIndex === lastStory) storyIndex = (storyIndex + 1) % storyTemplates.length;
      lastStory = storyIndex;
      storyCount += 1;
      writing = false;
      arena.classList.remove('is-forging');
      const template = storyTemplates[storyIndex];

      result.replaceChildren();
      const wrapper = document.createElement('div');
      wrapper.className = 'pairadox-story-output';
      const headline = document.createElement('strong');
      headline.textContent = `${pair[0]} + ${pair[1]}`;
      const copy = document.createElement('p');
      copy.className = 'pairadox-story-copy';
      copy.textContent = template.make(pair[0], pair[1]);
      const storyboard = document.createElement('div');
      storyboard.className = 'pairadox-storyboard';
      storyboard.setAttribute('role', 'img');
      storyboard.setAttribute('aria-label', `Three scene story: ${pair[0]}, ${template.twist}, ${pair[1]}.`);

      const scenes = [
        [iconByOption[pair[0]] || '✦', pair[0]],
        [template.icon, template.twist],
        [iconByOption[pair[1]] || '✦', pair[1]]
      ];
      scenes.forEach(([symbol, caption]) => {
        const scene = document.createElement('span');
        scene.className = 'pairadox-story-scene';
        const emoji = document.createElement('span');
        emoji.className = 'pairadox-story-symbol';
        emoji.setAttribute('aria-hidden', 'true');
        emoji.textContent = symbol;
        const text = document.createElement('span');
        text.className = 'pairadox-story-caption';
        text.textContent = caption;
        scene.append(emoji, text);
        storyboard.append(scene);
      });

      wrapper.append(headline, copy, storyboard);
      result.append(wrapper);
      if (count) count.textContent = `Story ${storyCount}`;
    }

    function setStatus(headline, detail) {
      result.replaceChildren();
      const strong = document.createElement('strong');
      strong.textContent = headline;
      const small = document.createElement('small');
      small.textContent = detail;
      result.append(strong, small);
    }

    function cleanup() {
      disposed = true;
      window.clearTimeout(storyTimer);
      observer.disconnect();
      slotObserver.disconnect();
    }
  };
})();