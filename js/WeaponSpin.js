
/* =============================================================================
   CAROUSEL — JAVASCRIPT
   Call initCarousel() after the carousel HTML has been injected into the DOM.
   ============================================================================= */

const EASE_FACTOR              = 0.14;
const WAVE_LIFT_PX             = -46;
const WAVE_LIFT_SPREAD_DEG     = 80;
const FRONT_SCALE_BOOST        = 0.27;
const BACK_TILT_MAX_DEG        = 40;
const AUTO_ADVANCE_INTERVAL_MS = 4000;

/* -----------------------------------------------------------------------------
   [CARD SIZE]
   Base multiplier applied on top of the auto-calculated card size.
     1.0  = default (no change)
     1.3  = 30% bigger
     0.7  = 30% smaller
----------------------------------------------------------------------------- */
const CARD_SIZE_MULTIPLIER = 2.2;

/* -----------------------------------------------------------------------------
   [RING RADIUS]
   Flat pixel offset added to the auto-calculated ring radius.
   Positive values push cards further from center; negative pulls them in.
     0    = default auto-radius
     80   = push cards 80 px further out
    -60   = pull cards 60 px closer in
----------------------------------------------------------------------------- */
const RING_RADIUS_OFFSET_PX = 200;


function initCarousel() {

    /* -------------------------------------------------------------------------
       STATE
    ------------------------------------------------------------------------- */
    const state = {
        totalCardCount:   0,
        activeCardIndex:  0,
        isAutoAdvancing:  true,
        displayAngle:     0,
        targetAngle:      0,
        autoAdvanceTimer: null,
    };

    /* -------------------------------------------------------------------------
       DOM REFERENCES — queried HERE, after the HTML has been injected
    ------------------------------------------------------------------------- */
    const ringElement          = document.getElementById('carousel-ring');
    const indicatorDotsWrapper = document.getElementById('carousel-indicator-dots');
    const prevButton           = document.getElementById('carousel-prev-button');
    const nextButton           = document.getElementById('carousel-next-button');

    if (!ringElement || !prevButton || !nextButton) {
        console.error('initCarousel: required DOM elements not found. Make sure the carousel HTML is loaded first.');
        return;
    }

    /* -------------------------------------------------------------------------
       CARD SIZING
    ------------------------------------------------------------------------- */
    function calculateCardSize() {
        const base = Math.max(48, Math.min(120, Math.round(520 / Math.sqrt(state.totalCardCount))));
        return Math.round(base * CARD_SIZE_MULTIPLIER);
    }

    function calculateRingRadius() {
        const cardSize          = calculateCardSize();
        const minimumRadius     = 160;
        const spacingMultiplier = 1.38;
        const circumference     = state.totalCardCount * cardSize * spacingMultiplier;
        return Math.max(minimumRadius, circumference / (2 * Math.PI)) + RING_RADIUS_OFFSET_PX;
    }

    /* -------------------------------------------------------------------------
       READ CARDS FROM HTML
    ------------------------------------------------------------------------- */
    function readCardsFromHTML() {
        const cards          = ringElement.querySelectorAll('.carousel-card');
        state.totalCardCount = cards.length;

        const cardSize   = calculateCardSize();
        const cardHeight = Math.round(cardSize * 1.35);

        cards.forEach(function(card, index) {
            /*
             * Wrap each .carousel-card in a .carousel-card-shell.
             * All transforms go on the shell; the card itself never moves,
             * so its text layer is always composited at native resolution.
             */
            let shell = card.parentElement;
            if (!shell.classList.contains('carousel-card-shell')) {
                shell = document.createElement('div');
                shell.className = 'carousel-card-shell';
                card.parentNode.insertBefore(shell, card);
                shell.appendChild(card);
            }

            shell.dataset.index    = index;
            shell.style.width      = cardSize          + 'px';
            shell.style.height     = cardHeight        + 'px';
            shell.style.marginLeft = (-cardSize  / 2)  + 'px';
            shell.style.marginTop  = (-cardHeight / 2) + 'px';
        });
    }

    /* -------------------------------------------------------------------------
       INDICATOR DOTS
    ------------------------------------------------------------------------- */
    function buildIndicatorDots() {
        if (!indicatorDotsWrapper) return;
        indicatorDotsWrapper.innerHTML = '';
        const visibleDotCount = Math.min(state.totalCardCount, 16);

        for (let dotIndex = 0; dotIndex < visibleDotCount; dotIndex++) {
            const dot      = document.createElement('div');
            const isActive = dotIndex === (state.activeCardIndex % visibleDotCount);
            dot.className  = 'carousel-dot' + (isActive ? ' carousel-dot--active' : '');
            indicatorDotsWrapper.appendChild(dot);
        }
    }

    function updateIndicatorDots() {
        if (!indicatorDotsWrapper) return;
        const dots            = indicatorDotsWrapper.querySelectorAll('.carousel-dot');
        const visibleDotCount = dots.length;

        dots.forEach(function(dot, dotIndex) {
            const shouldBeActive = dotIndex === (state.activeCardIndex % visibleDotCount);
            dot.classList.toggle('carousel-dot--active', shouldBeActive);
        });
    }

    /* -------------------------------------------------------------------------
       APPLY CARD POSITIONS
       — Front cards: face flat toward viewer, lifted by the wave
       — Side/back cards: tilt away gradually (rotateX grows toward BACK_TILT_MAX_DEG)
       — Brightness fades as cards move to the back
    ------------------------------------------------------------------------- */
    function applyCardPositions() {
        /*
         * Query shells, not cards. The shell gets every transform and style
         * mutation. The inner .carousel-card is never touched after init,
         * so the browser never invalidates its text raster layer.
         */
        const shells         = ringElement.querySelectorAll('.carousel-card-shell');
        const ringRadius     = calculateRingRadius();
        const degreesPerCard = 360 / state.totalCardCount;

        shells.forEach(function(shell, cardIndex) {
            const card            = shell.querySelector('.carousel-card');
            const baseRotationDeg = cardIndex * degreesPerCard;
            const worldAngleDeg   = ((baseRotationDeg + state.displayAngle) % 360 + 360) % 360;

            // angularDistance: 0 = front, 180 = directly behind
            const angularDistance = worldAngleDeg > 180 ? 360 - worldAngleDeg : worldAngleDeg;

            // Tilt: 0 at front, BACK_TILT_MAX_DEG at 90° and beyond
            const backness = Math.min(1, angularDistance / 90);
            const tiltX    = backness * BACK_TILT_MAX_DEG;

            // Wave lift: smooth crest on the ~5 front-facing cards
            const waveAmount = Math.max(0, 1 - angularDistance / WAVE_LIFT_SPREAD_DEG);
            const waveOffset = waveAmount * waveAmount * WAVE_LIFT_PX;

            const cardScale  = 1 + waveAmount * FRONT_SCALE_BOOST;

            // Shadow overlay: 0 at center, up to 0.45 toward the back
            const shadowAmount = (1 - waveAmount) * 0.45;

            // Active = front-most card (within half a card-step of dead center)
            const halfStep = (360 / state.totalCardCount) / 2;
            const isActive = angularDistance < halfStep;

            /*
             * ALL transform mutation goes on the shell only.
             * Transform breakdown:
             *   1. rotateY(baseRotationDeg)   — place shell in ring slot
             *   2. translateZ(ringRadius)      — push out to ring radius
             *   3. rotateY(-baseRotationDeg)   — undo Y so we're in world space
             *   4. rotateX(tiltX)              — tilt away (grows toward back)
             *   5. rotateY(baseRotationDeg)    — re-apply Y so card faces outward
             *   6. translateY + scale          — wave lift
             */
            shell.style.transform =
                `rotateY(${baseRotationDeg}deg) translateZ(${ringRadius}px)` +
                ` rotateY(${-baseRotationDeg}deg) rotateX(${tiltX}deg) rotateY(${baseRotationDeg}deg)` +
                ` translateY(${waveOffset}px) scale(${cardScale})`;

            // Shadow via CSS variable on the shell (::after overlay in carousel.css)
            shell.style.setProperty('--card-shadow', shadowAmount.toFixed(3));

            // Block hover/pointer on non-center cards
            shell.style.pointerEvents = isActive ? 'auto'    : 'none';
            shell.style.cursor        = isActive ? 'pointer' : 'default';

            // CSS class hook for hover-dependent children (e.g. flip-box)
            card.classList.toggle('carousel-card--active', isActive);

            shell.style.zIndex = angularDistance < 90 ? Math.round((90 - angularDistance) * 10) : 0;
        });

        ringElement.style.transform = `rotateY(${state.displayAngle}deg)`;
    }

    /* -------------------------------------------------------------------------
       ANIMATION LOOP
    ------------------------------------------------------------------------- */
    function runAnimationLoop() {
        const angleDifference = state.targetAngle - state.displayAngle;

        if (Math.abs(angleDifference) > 0.04) {
            state.displayAngle += angleDifference * EASE_FACTOR;
        } else {
            state.displayAngle = state.targetAngle;

            /*
             * Normalize both angles back into the 0-360 range once the
             * animation has settled. Large accumulated values (e.g. -1440deg,
             * -2880deg) cause GPU floating-point precision loss which makes
             * the browser re-rasterise text layers mid-frame — the blur.
             * Keeping the numbers small prevents this entirely.
             */
            const normalized   = ((state.targetAngle % 360) + 360) % 360;
            const drift        = state.targetAngle - normalized;
            state.targetAngle  = normalized;
            state.displayAngle = normalized;
        }

        applyCardPositions();
        requestAnimationFrame(runAnimationLoop);
    }

    /* -------------------------------------------------------------------------
       NAVIGATION
       Uses shortest-path stepping so the ring always turns the right way.
    ------------------------------------------------------------------------- */
    function goToCard(requestedIndex) {
        const previousIndex   = state.activeCardIndex;
        state.activeCardIndex = ((requestedIndex % state.totalCardCount) + state.totalCardCount) % state.totalCardCount;

        let stepCount = state.activeCardIndex - previousIndex;
        if (stepCount >  state.totalCardCount / 2) stepCount -= state.totalCardCount;
        if (stepCount < -state.totalCardCount / 2) stepCount += state.totalCardCount;

        state.targetAngle -= (360 / state.totalCardCount) * stepCount;
        updateIndicatorDots();
    }

    function stepForward()  { goToCard(state.activeCardIndex + 1); }
    function stepBackward() { goToCard(state.activeCardIndex - 1); }

    /* -------------------------------------------------------------------------
       AUTO-ADVANCE
    ------------------------------------------------------------------------- */
    function startAutoAdvance() {
        clearInterval(state.autoAdvanceTimer);
        if (state.isAutoAdvancing) {
            state.autoAdvanceTimer = setInterval(stepForward, AUTO_ADVANCE_INTERVAL_MS);
        }
    }

    function stepForwardAndResetTimer()  { stepForward();  startAutoAdvance(); }
    function stepBackwardAndResetTimer() { stepBackward(); startAutoAdvance(); }

    /* -------------------------------------------------------------------------
       ARROW BUTTONS
    ------------------------------------------------------------------------- */
    prevButton.addEventListener('click', stepBackwardAndResetTimer);
    nextButton.addEventListener('click', stepForwardAndResetTimer);



    /* -------------------------------------------------------------------------
       KICK IT OFF
    ------------------------------------------------------------------------- */
    readCardsFromHTML();
    buildIndicatorDots();
    runAnimationLoop();
    startAutoAdvance();

    console.log('initCarousel: activated with', state.totalCardCount, 'cards');
}

initCarousel();