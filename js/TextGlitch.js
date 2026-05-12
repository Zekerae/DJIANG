document.addEventListener('DOMContentLoaded', function(){
  var theLetters = "abcdefghijklmnopqrstuvwxyz#%&^+=-";

  // Save original text and lock element width on page load
  document.querySelectorAll('.tglitch-animation').forEach(function(element){
    if (!element.dataset.originalText) {
      element.dataset.originalText = element.textContent;
    }
    // Lock the width to original size so random chars don't resize the container
    element.style.display = 'inline-block';
    element.style.width = element.offsetWidth + 'px';
    element.style.whiteSpace = 'nowrap';
    element.style.overflow = 'hidden';
  });

  // Function to start the glitch animation
  function startGlitch(element) {
    var speed = parseInt(element.dataset.speed) || 50;
    var increment = parseInt(element.dataset.increment) || 8;

    var originalText = element.dataset.originalText || element.textContent;
    var ctnt = originalText;
    var clen = ctnt.length;
    var si = 0;
    var stri = 0;
    var block = "";
    var fixed = "";
    var totalFrames = clen * increment + 1;
    var frameCount = 0;

    (function rustle(i) {
      setTimeout(function() {
        frameCount++;
        if (--i) { rustle(i); }
        nextFrame(i);
        si = si + 1;

        if (frameCount >= totalFrames) {
          element.textContent = originalText;
        }
      }, speed);
    })(totalFrames);

    function nextFrame(pos) {
      for (var i = 0; i < clen - stri; i++) {
        var num = Math.floor(theLetters.length * Math.random());
        var letter = theLetters.charAt(num);
        block = block + letter;
      }
      if (si == (increment - 1)) { stri++; }
      if (si == increment) {
        fixed = fixed + ctnt.charAt(stri - 1);
        si = 0;
      }
      element.textContent = fixed + block;
      block = "";
    }
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        startGlitch(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.tglitch-animation').forEach(function(element){
    observer.observe(element);
    element.addEventListener('mouseenter', function(){
      startGlitch(this);
    });
  });
});