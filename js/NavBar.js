/**
 * NavBarLib.js — DJIANG Navbar Library
 * ─────────────────────────────────────
 * Drop ONE script tag at the end of <body> and call:
 *
 *   NavBar.init({ active: 'OperatorList.html' });
 *
 * That's it. No navbar HTML needed in your page.
 *
 * Options:
 *   active   (string)  — filename of the current page, e.g. 'OperatorList.html'
 *                        Defaults to auto-detect from window.location.pathname.
 *   sections (array)   — section IDs to track for scroll-based progress.
 *                        Defaults to [].
 *   navLinks (array)   — buttons shown in the top centre navbar. Each: { label, target }
 *                        OPTIONAL — if omitted or empty, the nav-links strip is not rendered.
 *                        Example: [{ label: 'HOME', target: 'index.html' }]
 *   sidebarItems(array)— sidebar nav items. Each: { label, target, page }
 *                        Defaults to the standard DJIANG set.
 *   socials  (array)   — sidebar footer links. Each: { label }
 *                        Defaults to FACEBOOK / DISCORD / INSTAGRAM.
 */

const NavBar = (() => {

  /* ── Default config ──────────────────────────────────────────────── */
  const DEFAULTS = {
    sections: [],
    navLinks: [],   // Empty by default — pass navLinks in init() to show the top nav strip
    sidebarItems: [
      { label: ['HOME'],                  target: 'index.html',           page: '001' },
      { label: ['WEAPONS'],               target: 'WeaponList.html',      page: '002' },
      { label: ['OPERATORS'],             target: 'OperatorList.html',    page: '003' },
      { label: ['TIER LIST'],             target: 'footer',               page: '004' },
      { label: ['HEADHUNT', 'TRACKER'],   target: 'HeadhuntTracker.html', page: '005' },
      { label: ['MATERIAL','TRACKER'],    target: 'footer',               page: '006' },
    ],
    socials: ['FACEBOOK', 'DISCORD', 'INSTAGRAM'],
  };

  /* ── Helpers ─────────────────────────────────────────────────────── */
  function isLink(target) {
    return target && (
      target.endsWith('.html') || target.endsWith('.htm') ||
      target.startsWith('http://') || target.startsWith('https://') ||
      target.startsWith('/')
    );
  }

  function currentFile() {
    const raw = window.location.pathname.split('/').pop();
    return (raw === '' || raw === '/') ? 'index.html' : raw.toLowerCase();
  }

  /* ── Build glitch span ───────────────────────────────────────────── */
  function glitch(text, swipe = false) {
    const d = document.createElement('div');
    d.className = 'tglitch-animation' + (swipe ? ' swipe' : '');
    d.dataset.speed = '10';
    d.dataset.increment = '5';
    d.textContent = text;
    return d;
  }

  /* ── Build sidebar item HTML ─────────────────────────────────────── */
  function buildSidebarItem({ label, target, page }) {
    const item = document.createElement('div');
    item.className = 'sidebar-item';
    item.dataset.target = target;
    if (page) item.dataset.page = page;   // store page number for counter lookup

    const inner = document.createElement('div');
    inner.className = 'sidebar-item-inner';
    const textSpan = document.createElement('span');
    textSpan.className = 'sidebar-text';
    label.forEach(l => textSpan.appendChild(glitch(l)));
    inner.appendChild(textSpan);
    item.appendChild(inner);

    if (page) {
      const num = document.createElement('div');
      num.className = 'sidebar-page-num';
      num.innerHTML = `<span>PAGE</span><span>${page}</span>`;
      item.appendChild(num);
    }
    return item;
  }

  /* ── Inject navbar HTML into document ───────────────────────────── */
  function inject(cfg) {
    // ── Navbar ──
    const nav = document.createElement('nav');
    nav.className = 'navbar';
    nav.innerHTML = `<div class="progress-bar" id="progress"></div>`;

    const ham = document.createElement('div');
    ham.className = 'hamburger';
    ham.id = 'ham';
    ham.innerHTML = '<span></span><span></span><span></span>';
    ham.addEventListener('click', toggleSidebar);
    nav.appendChild(ham);

    // ── Nav links — only rendered if the caller passed at least one link ──
    if (cfg.navLinks.length > 0) {
      const navLinks = document.createElement('div');
      navLinks.className = 'nav-links';
      cfg.navLinks.forEach(({ label, target }) => {
        const btn = document.createElement('div');
        btn.className = 'nav-btn';
        btn.dataset.target = target;
        const wh = document.createElement('div');
        wh.className = 'wipe-hover';
        wh.appendChild(glitch(label, true));
        btn.appendChild(wh);
        navLinks.appendChild(btn);
      });
      nav.appendChild(navLinks);
    }

    const spacer = document.createElement('div');
    spacer.className = 'nav-spacer';
    nav.appendChild(spacer);

    // ── Overlay ──
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'overlay';
    overlay.addEventListener('click', toggleSidebar);

    // ── Sidebar ──
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.id = 'sidebar';

    const label = document.createElement('div');
    label.className = 'sidebar-label';
    label.textContent = 'NAVIGATE';
    sidebar.appendChild(label);

    const sidebarNav = document.createElement('nav');
    sidebarNav.className = 'sidebar-nav';
    cfg.sidebarItems.forEach(item => sidebarNav.appendChild(buildSidebarItem(item)));
    sidebar.appendChild(sidebarNav);

    const footer = document.createElement('div');
    footer.className = 'sidebar-footer';
    cfg.socials.forEach(s => {
      const fi = document.createElement('div');
      fi.className = 'sidebar-footer-item';
      const wh = document.createElement('div');
      wh.className = 'wipe-hover';
      wh.appendChild(glitch(`■ \u00A0${s}`, true));
      fi.appendChild(wh);
      footer.appendChild(fi);
    });
    sidebar.appendChild(footer);

    const pageCount = document.createElement('div');
    pageCount.className = 'sidebar-page-count';
    pageCount.innerHTML = '<span>PAGE 001</span><span>&#9644;</span>';
    sidebar.appendChild(pageCount);

    // ── Mount everything at the very top of <body> ──
    const body = document.body;
    body.insertBefore(sidebar, body.firstChild);
    body.insertBefore(overlay, body.firstChild);
    body.insertBefore(nav, body.firstChild);

    // ── Wire up glitch on dynamically injected sidebar elements ──────
    // TextGlitch.js runs its DOMContentLoaded pass before NavBar.init()
    // injects the sidebar, so those elements are missed. Re-run init()
    // scoped to just the sidebar — already-wired elements are skipped.
    if (window.TextGlitch) {
      window.TextGlitch.init(nav);
      window.TextGlitch.init(sidebar);
    }
  }

  /* ── Wire up click navigation ────────────────────────────────────── */
  function wireClicks() {
    document.querySelectorAll('[data-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        const sidebar = document.getElementById('sidebar');
        if (isLink(target)) {
          if (sidebar && sidebar.classList.contains('open')) toggleSidebar();
          window.location.href = target;
        } else {
          const el = document.getElementById(target);
          if (el) window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
          if (sidebar && sidebar.classList.contains('open')) toggleSidebar();
        }
      });
    });
  }

  /* ── Scroll progress + active states ────────────────────────────── */
  function initScroll(sections) {
    const progress = document.getElementById('progress');
    const file = currentFile();

    function update() {
      // Progress bar
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.width = (maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0) + '%';

      // Active section index
      let activeIdx = 0;
      sections.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollTop + window.innerHeight * 0.5) activeIdx = i;
      });

      // Nav buttons — only highlight if we're ON this page (not an external link)
      document.querySelectorAll('.nav-btn').forEach((btn, i) => {
        const target = btn.dataset.target || '';
        const isExt = isLink(target);
        const isOther = isExt && target.split('/').pop().toLowerCase() !== file;
        if (isOther) btn.classList.remove('active');
        else btn.classList.toggle('active', i === activeIdx);
      });

      // Sidebar items
      document.querySelectorAll('.sidebar-item[data-target]').forEach(item => {
        const target = item.dataset.target;
        const targetFile = target.split('/').pop().toLowerCase();
        item.classList.toggle('active', isLink(target) && targetFile === file);
      });

      // Bottom page counter — prefer the active sidebar item's page number,
      // fall back to section index on pages like index.html that use sections
      const counter = document.querySelector('.sidebar-page-count span:first-child');
      if (counter) {
        const activeItem = document.querySelector('.sidebar-item.active');
        const pageNum = activeItem?.dataset.page ?? String(activeIdx + 1).padStart(3, '0');
        counter.textContent = 'PAGE ' + pageNum;
      }
    }

    window.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
  }

  /* ── Sidebar toggle (also exposed globally) ──────────────────────── */
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const ham = document.getElementById('ham');
    const overlay = document.getElementById('overlay');
    if (!sidebar) return;
    const open = sidebar.classList.toggle('open');
    ham.classList.toggle('open', open);
    overlay.classList.toggle('visible', open);
  }

  /* ── Public init ─────────────────────────────────────────────────── */
  function init(userCfg = {}) {
    const cfg = {
      sections:     userCfg.sections     || DEFAULTS.sections,
      navLinks:     userCfg.navLinks     || DEFAULTS.navLinks,
      sidebarItems: userCfg.sidebarItems || DEFAULTS.sidebarItems,
      socials:      userCfg.socials      || DEFAULTS.socials,
    };

    // Run after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => { inject(cfg); wireClicks(); initScroll(cfg.sections); });
    } else {
      inject(cfg);
      wireClicks();
      initScroll(cfg.sections);
    }
  }

  // Expose toggleSidebar globally so onclick="toggleSidebar()" in old HTML still works
  window.toggleSidebar = toggleSidebar;

  return { init, toggleSidebar };
})();s