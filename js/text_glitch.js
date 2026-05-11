document.addEventListener('DOMContentLoaded', function(){
  var theLetters = "abcdefghijklmnopqrstuvwxyz#%&^+=-";

  // Save original text from HTML on page load
  document.querySelectorAll('.tglitch-animation').forEach(function(element){
    if (!element.dataset.originalText) {
      element.dataset.originalText = element.textContent;
    }
  });

  // Function to start the glitch animation
  function startGlitch(element) {
    // Read data attributes, fall back to defaults
    var speed = parseInt(element.dataset.speed) || 50; // ms per frame
    var increment = parseInt(element.dataset.increment) || 8; // frames per step. Must be >2
    
    // Get original text from data attribute (saved on page load)
    var originalText = element.dataset.originalText || element.textContent;
    var ctnt = originalText;
    var clen = ctnt.length;
    var si = 0;
    var stri = 0;
    var block = "";
    var fixed = "";
    var totalFrames = clen * increment + 1;
    var frameCount = 0;

    // Call self x times, whole function wrapped in setTimeout
    (function rustle(i) {
      setTimeout(function() {
        frameCount++;
        if (--i) { rustle(i); }
        nextFrame(i);
        si = si + 1;
        
        // When animation completes, restore original text
        if (frameCount >= totalFrames) {
          element.textContent = originalText;
        }
      }, speed);
    })(totalFrames);

    function nextFrame(pos) {
      for (var i = 0; i < clen - stri; i++) {
        // Random number
        var num = Math.floor(theLetters.length * Math.random());
        // Get random letter
        var letter = theLetters.charAt(num);
        block = block + letter;
      }
      if (si == (increment - 1)) {
        stri++;
      }
      if (si == increment) {
        // Add a letter
        fixed = fixed + ctnt.charAt(stri - 1);
        si = 0;
      }
      element.textContent = fixed + block;
      block = "";
    }
  }

  // Intersection Observer to trigger animation on viewport entry
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        startGlitch(entry.target);
      }
    });
  }, {
    threshold: 0.1 // Trigger when 10% of element is visible
  });

  // Observe all elements with tglitch-animation class
  document.querySelectorAll('.tglitch-animation').forEach(function(element){
    observer.observe(element);
    
    // Also trigger on hover
    element.addEventListener('mouseenter', function(){
      startGlitch(this);
    });
  });
});