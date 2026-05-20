// ════════════════════════════════════════════════════════════════════════
// MaterialTrackerTour.js
// Self-contained guided tour for the Ascension Planner.
// Usage: drop <script src="js/MaterialTrackerTour.js"></script> before </body>
//        and put <button class="mat-tour-help-btn" onclick="MatTour.start()">?</button>
//        anywhere you like.
// ════════════════════════════════════════════════════════════════════════

const MatTour = (() => {

  // ── STEP DEFINITIONS ──────────────────────────────────────────────────
  // targetId   : id of the element to spotlight
  // title      : card heading (uppercase display font)
  // desc       : HTML string — wrap key terms in <b>
  // cardPos    : 'below' | 'above' | 'right' | 'left' (position of card vs spotlight)
  // pad        : extra px of spotlight padding around the target (default 8)
  const STEPS = [
    {
      targetId: 'left-panel',
      title: 'Active Plans',
      desc: 'Everything starts here. Click <b>Add Operator</b> or <b>Add Weapon</b> to create a plan. Each card lets you set a <b>level range</b>, <b>promotion</b>, <b>talents</b>, and individual <b>skill levels</b> — use the quick-range buttons (1→40, 1→90 …) or drag the sliders. Filter your list with the <b>All / Operators / Weapons</b> tabs.',
      cardPos: 'right',
      pad: 0,
    },
    {
      targetId: 'mid-panel',
      title: 'Materials Needed',
      desc: 'This panel aggregates every material across all <b>focused</b> plans. Switch between <b>Collective</b> (totals) and <b>Individual</b> (per-plan breakdown with inventory inputs).',
      cardPos: 'left',
      pad: 0,
    },
    {
      targetId: 'mid-focus-bar',
      title: 'Focus Plans',
      desc: 'Only <b>focused</b> plans count toward the collective total. Toggle the dropdown to include or exclude specific plans — useful when you want to farm for one operator at a time.',
      cardPos: 'left',
      pad: 6,
    },
    {
      targetId: 'mid-mode-tabs',
      title: 'Collective vs Individual',
      desc: '<b>Collective</b> shows a merged checklist. <b>Individual</b> lets you enter your current inventory directly on each plan card, and the progress bar + status badge update live.',
      cardPos: 'left',
      pad: 6,
    },
    {
      targetId: 'map-panel',
      title: 'Farming Map',
      desc: 'The map panel shows where each needed material drops. Click a <b>pin</b> or a material chip in the filter bar to highlight all its farm spots. Use <b>Find on map (🔍)</b> in the need list to jump there instantly.',
      cardPos: 'left',
      pad: 0,
    },
    {
      targetId: 'map-filter-bar',
      title: 'Material Chips',
      desc: 'These chips auto-populate from your current plans. Click one to highlight only that material\'s pins on the map. Click an empty area on the map — or press <b>Esc</b> — to deselect.',
      cardPos: 'below',
      pad: 6,
    },
  ];

  // ── STATE ─────────────────────────────────────────────────────────────
  let stepIdx  = 0;
  let active   = false;
  let overlay  = null;
  let spotlight = null;
  let card     = null;

  // ── DOM BOOTSTRAP (runs once on first start) ──────────────────────────
  function bootstrap() {
    if (overlay) return;

    // Inject CSS link if not already present
    if (!document.querySelector('link[href*="MaterialTrackerTour"]')) {
      const link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = 'css/MaterialTrackerTour.css';
      document.head.appendChild(link);
    }

    overlay = document.createElement('div');
    overlay.className = 'mat-tour-overlay';
    overlay.id = 'mat-tour-overlay';

    spotlight = document.createElement('div');
    spotlight.className = 'mat-tour-spotlight';

    card = document.createElement('div');
    card.className = 'mat-tour-card';

    overlay.appendChild(spotlight);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Close on Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && active) stop();
    });

    // Reposition on resize
    window.addEventListener('resize', () => {
      if (active) render(stepIdx);
    });
  }

  // ── START / STOP ──────────────────────────────────────────────────────
  function start() {
    bootstrap();
    stepIdx = 0;
    active  = true;
    overlay.classList.add('active');
    render(stepIdx);
  }

  function stop() {
    active = false;
    if (overlay) overlay.classList.remove('active');
  }

  function step(delta) {
    stepIdx = Math.max(0, Math.min(STEPS.length - 1, stepIdx + delta));
    render(stepIdx);
  }

  // ── RENDER STEP ───────────────────────────────────────────────────────
  function render(idx) {
    const s      = STEPS[idx];
    const total  = STEPS.length;
    const target = document.getElementById(s.targetId);

    // ── Dots ──
    let dots = '';
    for (let i = 0; i < total; i++) {
      dots += `<div class="mat-tour-dot${i === idx ? ' active' : ''}"></div>`;
    }

    // ── Card HTML ──
    const isLast = idx === total - 1;
    card.innerHTML = `
      <div class="mat-tour-eyebrow">
        Step ${idx + 1} of ${total}
        <div class="mat-tour-dots">${dots}</div>
      </div>
      <div class="mat-tour-title">${s.title}</div>
      <div class="mat-tour-desc">${s.desc}</div>
      <div class="mat-tour-actions">
        <button class="mat-tour-skip" onclick="MatTour.stop()">Skip tour</button>
        <div class="mat-tour-nav">
          ${idx > 0 ? `<button class="mat-tour-btn" onclick="MatTour.step(-1)">← Back</button>` : ''}
          <button class="mat-tour-btn primary" onclick="${isLast ? 'MatTour.stop()' : 'MatTour.step(1)'}">
            ${isLast ? 'Done ✓' : 'Next →'}
          </button>
        </div>
      </div>`;

    // ── Spotlight position ──
    if (!target) {
      // Hide spotlight if target not found (e.g. mobile panel hidden)
      spotlight.style.cssText = 'display:none';
      positionCard(null, s.cardPos);
      return;
    }
    spotlight.style.display = '';

    const pad  = s.pad ?? 8;
    const rect = target.getBoundingClientRect();

    spotlight.style.top    = (rect.top    - pad) + 'px';
    spotlight.style.left   = (rect.left   - pad) + 'px';
    spotlight.style.width  = (rect.width  + pad * 2) + 'px';
    spotlight.style.height = (rect.height + pad * 2) + 'px';

    positionCard(rect, s.cardPos, pad);
  }

  // ── CARD POSITIONING ──────────────────────────────────────────────────
  function positionCard(targetRect, pos, pad = 8) {
    const isMobile = window.innerWidth <= 680;
    if (isMobile) {
      // Mobile: always anchored via CSS (bottom: 16px, left: 14px)
      card.style.top  = '';
      card.style.left = '';
      return;
    }

    const cardW  = 290;
    const cardH  = 220; // estimated
    const vw     = window.innerWidth;
    const vh     = window.innerHeight;
    const margin = 14;

    if (!targetRect) {
      card.style.top  = (vh / 2 - cardH / 2) + 'px';
      card.style.left = (vw / 2 - cardW / 2) + 'px';
      return;
    }

    let cx, cy;
    const gap = 14;

    switch (pos) {
      case 'right':
        cx = targetRect.right + pad + gap;
        cy = targetRect.top + targetRect.height / 2 - cardH / 2;
        break;
      case 'left':
        cx = targetRect.left - pad - gap - cardW;
        cy = targetRect.top + targetRect.height / 2 - cardH / 2;
        break;
      case 'above':
        cx = targetRect.left + targetRect.width / 2 - cardW / 2;
        cy = targetRect.top - pad - gap - cardH;
        break;
      case 'below':
      default:
        cx = targetRect.left + targetRect.width / 2 - cardW / 2;
        cy = targetRect.bottom + pad + gap;
        break;
    }

    // Clamp to viewport
    cx = Math.max(margin, Math.min(vw - cardW - margin, cx));
    cy = Math.max(margin, Math.min(vh - cardH - margin, cy));

    card.style.left = cx + 'px';
    card.style.top  = cy + 'px';
  }

  // ── PUBLIC API ────────────────────────────────────────────────────────
  return { start, stop, step };

})();