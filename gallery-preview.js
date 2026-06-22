(() => {
  const definitions = {
    Pairadox: {
      id: 'pairadox',
      capabilities: ['SVG', 'Drag', 'Touch', 'Audio'],
      svg: `
        <svg viewBox="0 0 320 150" focusable="false">
          <circle class="preview-glow" cx="160" cy="75" r="56"></circle>
          <g class="preview-orbit">
            <ellipse cx="160" cy="75" rx="105" ry="34"></ellipse>
            <ellipse cx="160" cy="75" rx="52" ry="62" transform="rotate(38 160 75)"></ellipse>
            <circle class="preview-node" cx="56" cy="70" r="6"></circle>
            <circle class="preview-node" cx="203" cy="23" r="5"></circle>
          </g>
          <polygon class="preview-shell" points="160,35 198,56 198,99 160,120 122,99 122,56"></polygon>
          <path class="preview-flame" d="M160 105c-18 0-28-11-25-27 2-11 10-16 15-25 2 11 8 15 10 21 3-13 12-19 16-32 13 16 16 27 13 40-4 14-14 23-29 23Z"></path>
          <circle class="preview-pop preview-pop-one" cx="136" cy="57" r="4"></circle>
          <circle class="preview-pop preview-pop-two" cx="184" cy="61" r="3"></circle>
        </svg>`
    },
    'Time Sense': {
      id: 'time-sense',
      capabilities: ['Canvas', 'Timing', 'Keyboard', 'Audio'],
      svg: `
        <svg viewBox="0 0 320 150" focusable="false">
          <path class="preview-track" d="M35 96 C86 27 137 122 190 66 S276 35 292 87"></path>
          <path class="preview-track preview-track-faint" d="M36 52 C92 118 139 25 202 94 S270 122 293 57"></path>
          <circle class="preview-time-trail preview-time-trail-three" cx="70" cy="70" r="8"></circle>
          <circle class="preview-time-trail preview-time-trail-two" cx="70" cy="70" r="6"></circle>
          <circle class="preview-time-trail preview-time-trail-one" cx="70" cy="70" r="4"></circle>
          <circle class="preview-time-spark" cx="70" cy="70" r="7"></circle>
        </svg>`
    },
    'Fair Choice': {
      id: 'fair-choice',
      capabilities: ['Canvas', 'Physics', 'Touch', 'Audio'],
      svg: `
        <svg viewBox="0 0 320 150" focusable="false">
          <path class="preview-pointer" d="M160 9 149 29h22Z"></path>
          <g class="preview-wheel" transform="translate(160 78)">
            <path class="wheel-a" d="M0 0 0-55A55 55 0 0 1 55 0Z"></path>
            <path class="wheel-b" d="M0 0 55 0A55 55 0 0 1 0 55Z"></path>
            <path class="wheel-c" d="M0 0 0 55A55 55 0 0 1-55 0Z"></path>
            <path class="wheel-d" d="M0 0-55 0A55 55 0 0 1 0-55Z"></path>
            <circle class="preview-wheel-ring" r="55"></circle>
            <circle class="preview-wheel-hub" r="14"></circle>
          </g>
        </svg>`
    },
    'Tiny Step': {
      id: 'tiny-step',
      capabilities: ['SVG', 'Slider', 'Keyboard', 'Audio'],
      svg: `
        <svg viewBox="0 0 320 150" focusable="false">
          <path class="preview-step-path" d="M48 103 C92 103 104 48 158 48 S225 103 274 103"></path>
          <circle class="preview-step-stone" cx="48" cy="103" r="16"></circle>
          <circle class="preview-step-stone" cx="158" cy="48" r="16"></circle>
          <circle class="preview-step-stone" cx="274" cy="103" r="16"></circle>
          <circle class="preview-step-marker" cx="48" cy="103" r="8"></circle>
        </svg>`
    },
    'Constraint Spark': {
      id: 'constraint-spark',
      capabilities: ['SVG', 'Swipe', 'Touch', 'Audio'],
      svg: `
        <svg viewBox="0 0 320 150" focusable="false">
          <g class="preview-card-fan">
            <rect class="preview-card preview-card-back" x="98" y="31" width="104" height="91" rx="13" transform="rotate(-13 150 77)"></rect>
            <rect class="preview-card preview-card-mid" x="111" y="26" width="104" height="91" rx="13" transform="rotate(10 163 72)"></rect>
            <g class="preview-card-front">
              <rect class="preview-card" x="107" y="25" width="106" height="94" rx="14"></rect>
              <path class="preview-card-line" d="M128 51h65M128 68h50M128 85h58"></path>
              <circle class="preview-card-spark" cx="184" cy="98" r="7"></circle>
            </g>
          </g>
        </svg>`
    },
    'Signal Garden': {
      id: 'signal-garden',
      capabilities: ['Canvas', 'Modes', 'Touch', 'Keyboard'],
      svg: `
        <svg viewBox="0 0 320 150" focusable="false">
          <path class="preview-track" d="M160 25 251 75 160 125 69 75Z"></path>
          <path class="preview-track preview-track-faint" d="M160 25 160 125M69 75h182"></path>
          <circle class="wheel-a" cx="160" cy="25" r="11"></circle>
          <circle class="wheel-b" cx="251" cy="75" r="11"></circle>
          <circle class="wheel-c" cx="160" cy="125" r="11"></circle>
          <circle class="wheel-d" cx="69" cy="75" r="11"></circle>
          <circle class="preview-time-trail preview-time-trail-three" cx="70" cy="70" r="9"></circle>
          <circle class="preview-time-trail preview-time-trail-two" cx="70" cy="70" r="6"></circle>
          <circle class="preview-time-spark" cx="70" cy="70" r="7"></circle>
        </svg>`
    }
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function decorateCard(card) {
    const button = card.querySelector('.app-card-button');
    const name = card.querySelector('.app-name')?.textContent?.trim();
    const definition = definitions[name];
    if (!button || !definition || button.classList.contains('is-previewed')) return;

    const preview = document.createElement('span');
    preview.className = `app-preview app-preview-${definition.id}`;
    preview.setAttribute('aria-hidden', 'true');
    preview.innerHTML = definition.svg;

    const icon = card.querySelector('.app-icon');
    if (icon) preview.prepend(icon);

    const meta = card.querySelector('.app-meta');
    button.insertBefore(preview, meta || button.firstChild);

    const capabilities = document.createElement('span');
    capabilities.className = 'app-capabilities';
    capabilities.setAttribute('aria-hidden', 'true');
    definition.capabilities.forEach((capability) => {
      const chip = document.createElement('span');
      chip.className = 'app-capability';
      chip.textContent = capability;
      capabilities.append(chip);
    });
    button.insertBefore(capabilities, card.querySelector('.app-open'));
    button.setAttribute('aria-label', `Open ${name}. Supports ${definition.capabilities.join(', ')}.`);
    button.classList.add('is-previewed');

    button.addEventListener('pointermove', (event) => {
      if (reducedMotion.matches || event.pointerType === 'touch') return;
      const bounds = button.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      preview.style.setProperty('--preview-rotate-x', `${(-y * 4).toFixed(2)}deg`);
      preview.style.setProperty('--preview-rotate-y', `${(x * 5).toFixed(2)}deg`);
    });

    button.addEventListener('pointerleave', () => {
      preview.style.removeProperty('--preview-rotate-x');
      preview.style.removeProperty('--preview-rotate-y');
    });
  }

  function decorateGrid() {
    document.querySelectorAll('.app-card').forEach(decorateCard);
  }

  function syncFilterState() {
    document.querySelectorAll('.filter').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
    });
  }

  function init() {
    const grid = document.querySelector('#app-grid');
    if (!grid) return;

    decorateGrid();
    syncFilterState();

    new MutationObserver(decorateGrid).observe(grid, { childList: true });
    document.querySelectorAll('.filter').forEach((button) => {
      button.addEventListener('click', () => requestAnimationFrame(syncFilterState));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();