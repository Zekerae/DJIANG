const ham = document.getElementById('ham');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const progress = document.getElementById('progress');
const sectionIds = ['landing-page', 'character-slide', 'carousel-3D', 'footer'];

/* ─── PROGRESS BAR — raw scroll distance ─── */
function updateProgress() {
    const scrollTop = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const pct = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
    progress.style.width = pct + '%';

    /* keep nav/sidebar active states in sync */
    let activeIdx = 0;
    for (let i = 0; i < sectionIds.length; i++) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollTop + window.innerHeight * 0.5) activeIdx = i;
    }

    document.querySelectorAll('.nav-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === activeIdx);
    });

    document.querySelectorAll('.sidebar-item[data-target]').forEach(item => {
        item.classList.toggle('active', item.dataset.target === sectionIds[activeIdx]);
    });

    /* ─── update bottom page counter ─── */
    const pageCountEl = document.querySelector('.sidebar-page-count span:first-child');
    if (pageCountEl) {
        const pageNum = String(activeIdx + 1).padStart(3, '0');
        pageCountEl.textContent = 'PAGE ' + pageNum;
    }
}

window.addEventListener('scroll', updateProgress);
window.addEventListener('resize', updateProgress);
updateProgress();

/* ─── Helper: detect if a target value is an HTML link ─── */
function isLink(target) {
    return target && (
        target.endsWith('.html') ||
        target.endsWith('.htm') ||
        target.startsWith('http://') ||
        target.startsWith('https://') ||
        target.startsWith('/')
    );
}

/* ─── SCROLL TO SECTION or NAVIGATE TO PAGE ─── */
document.querySelectorAll('[data-target]').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.target;

        if (isLink(target)) {
            /* It's an HTML page link — navigate to it */
            if (sidebar.classList.contains('open')) toggleSidebar();
            window.location.href = target;
        } else {
            /* It's a section ID — scroll to it */
            const el = document.getElementById(target);
            if (el) window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
            if (sidebar.classList.contains('open')) toggleSidebar();
        }
    });
});

/* ─── SIDEBAR TOGGLE ─── */
function toggleSidebar() {
    const open = sidebar.classList.toggle('open');
    ham.classList.toggle('open', open);
    overlay.classList.toggle('visible', open);
}