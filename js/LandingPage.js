function initLandingPage() {
  // ── HERO CANVAS ANIMATION ──
  const canvas = document.getElementById('heroCanvas');
  
  // Safety check: Ensure the canvas exists before trying to draw
  if (!canvas) {
    console.error("Hero canvas (#heroCanvas) not found!");
    return;
  }
  
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Particles
  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 1.8 + .3,
    vx: (Math.random() - .5) * .4,
    vy: (Math.random() - .5) * .4,
    alpha: Math.random() * .5 + .1,
    color: Math.random() > .6 ? '#00e5c0' : '#a07fff',
  }));

  // Floating orbs
  const orbs = [
    { x: .65, y: .35, r: 220, color: '#2a7a55', alpha: .18, speed: .0003, phase: 0 },
    { x: .35, y: .5,  r: 180, color: '#6b4fa0', alpha: .20, speed: .0005, phase: 1 },
    { x: .5,  y: .7,  r: 150, color: '#00e5c0', alpha: .10, speed: .0004, phase: 2 },
  ];

  let t = 0;
  let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  function draw() {
    // Stop drawing if the user navigates away from the landing page
    if (!document.getElementById('heroCanvas')) return; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Orbs
    orbs.forEach(o => {
      const cx = o.x * canvas.width  + Math.sin(t * o.speed + o.phase) * 40;
      const cy = o.y * canvas.height + Math.cos(t * o.speed + o.phase) * 25;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, o.r);
      grad.addColorStop(0, o.color + Math.round(o.alpha * 255).toString(16).padStart(2,'0'));
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, o.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // Particles
    particles.forEach(p => {
      // Slight mouse attraction
      const dx = mouse.x - p.x, dy = mouse.y - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 200) {
        p.vx += dx / dist * .015;
        p.vy += dy / dist * .015;
      }
      p.vx *= .98; p.vy *= .98;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Scan line moving
    const scanY = ((t * .05) % canvas.height);
    const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
    scanGrad.addColorStop(0, 'transparent');
    scanGrad.addColorStop(.5, 'rgba(0,229,192,0.04)');
    scanGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 40, canvas.width, 80);

    t++;
    requestAnimationFrame(draw);
  }
  draw();

  // ── MODAL ──
  // Attached to 'window' so inline HTML triggers (onclick="openModal()") still work
  window.openModal = function() {
    document.getElementById('modalOverlay').classList.add('open');
  };
  
  window.closeModal = function() {
    document.getElementById('modalOverlay').classList.remove('open');
  };
  
  window.handleOverlayClick = function(e) {
    if (e.target === document.getElementById('modalOverlay')) window.closeModal();
  };
  
  window.handleSignIn = function() {
    alert('Welcome back, Keeper. (Demo only — no backend connected.)');
    window.closeModal();
  };
  
  document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeModal(); });

  // ── HAMBURGER (mobile) ──
  window.toggleMenu = function() {
    const links = document.querySelector('.nav-links');
    if (!links) return;
    
    links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
    links.style.position = 'fixed';
    links.style.flexDirection = 'column';
    links.style.top = '60px';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = 'rgba(20,8,44,.97)';
    links.style.padding = '20px 36px';
    links.style.gap = '20px';
    links.style.zIndex = '99';
  };

  // ── SCROLL ANIMATIONS ──
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: .15 });

  document.querySelectorAll('.faction-card, .world-cell, #about > div, .about-visual').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity .6s ease, transform .6s ease';
    observer.observe(el);
  });

  console.log("Landing page initialized successfully!");
}

// Expose the init function to the global scope for the promise chain
window.initLandingPage = initLandingPage;
initLandingPage();