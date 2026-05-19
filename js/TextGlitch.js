/**
 * TextGlitch.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Backward-compatible drop-in replacement.
 *
 * OLD behaviour (unchanged):
 *   • On DOMContentLoaded, automatically finds every .tglitch-animation on the
 *     page, locks its width, wires IntersectionObserver + mouseenter, and runs
 *     the scramble animation. No code changes needed in any existing page.
 *
 * NEW addition (non-breaking):
 *   • window.TextGlitch.init(root?)
 *       Call this on any element (or the whole document) AFTER new
 *       .tglitch-animation nodes have been injected dynamically.
 *       Already-initialised elements are silently skipped via a data-flag,
 *       so calling init() more than once is always safe.
 *
 * Usage from NavBarLib.js (or anywhere that injects glitch elements late):
 *   if (window.TextGlitch) window.TextGlitch.init(sidebarElement);
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {

  var theLetters = "abcdefghijklmnopqrstuvwxyz#%&^+=-";

  /* ── Core scramble animation (unchanged from original) ─────────────── */
  function startGlitch(element) {
    var speed     = parseInt(element.dataset.speed)     || 50;
    var increment = parseInt(element.dataset.increment) || 8;

    var originalText = element.dataset.originalText || element.textContent;
    var ctnt  = originalText;
    var clen  = ctnt.length;
    var si    = 0;
    var stri  = 0;
    var block = "";
    var fixed = "";
    var totalFrames = clen * increment + 1;
    var frameCount  = 0;

    (function rustle(i) {
      setTimeout(function () {
        frameCount++;
        if (--i) { rustle(i); }
        nextFrame(i);
        si = si + 1;

        if (frameCount >= totalFrames) {
          element.textContent = originalText;
        }
      }, speed);
    })(totalFrames);

    function nextFrame() {
      for (var i = 0; i < clen - stri; i++) {
        var num    = Math.floor(theLetters.length * Math.random());
        var letter = theLetters.charAt(num);
        block      = block + letter;
      }
      if (si === increment - 1) { stri++; }
      if (si === increment)     { fixed = fixed + ctnt.charAt(stri - 1); si = 0; }
      element.textContent = fixed + block;
      block = "";
    }
  }

  /* ── Attach glitch behaviour to a set of elements ──────────────────── */
  function initElements(root) {
    var scope   = root || document;
    var targets = scope.querySelectorAll('.tglitch-animation');

    /* One observer per init() call is fine — each is GC'd when its
       targets leave the DOM. */
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { startGlitch(entry.target); }
      });
    }, { threshold: 0.1 });

    targets.forEach(function (el) {
      /* Skip elements that were already wired up by a previous init() call */
      if (el.dataset.glitchReady) { return; }
      el.dataset.glitchReady = 'true';

      /* Snapshot original text and lock width — same as original code */
      if (!el.dataset.originalText) {
        el.dataset.originalText = el.textContent;
      }
      el.style.display    = 'inline-block';
      el.style.width      = el.offsetWidth + 'px';
      el.style.whiteSpace = 'nowrap';
      el.style.overflow   = 'hidden';

      observer.observe(el);
      el.addEventListener('mouseenter', function () { startGlitch(this); });
    });
  }

  /* ── Auto-init on DOMContentLoaded (preserves original behaviour) ─── */
  document.addEventListener('DOMContentLoaded', function () {
    initElements(document);
  });

  /* ── Public API (new, additive only) ────────────────────────────────── */
  window.TextGlitch = {
    /**
     * init(root?)
     *   Scans root (defaults to document) for any un-initialised
     *   .tglitch-animation elements and wires them up.
     *   Safe to call multiple times — already-wired elements are skipped.
     */
    init: function (root) {
      initElements(root || document);
    }
  };

})();

// Inside js/TextGlitch.js
const isLowEnd = window.innerWidth <= 768;
const glitchSpeed = isLowEnd ? 150 : 50; // Slower updates on phones

setInterval(() => {
    // Run glitch logic
}, glitchSpeed);