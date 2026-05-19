/* ═══════════════════════════════════════════════════════════════════
   ARKNIGHTS: ENDFIELD — CHARACTER TEMPLATE  v3.3
   • Fixed Tour (position:fixed, scroll-first, keyboard support)
   • Full Responsiveness support
   • Bulletproof Damage Calculator
   • Dynamic Calc Dropdown (Syncs to Skill Sliders)
   • Direct Supabase saving for Profile Level & Skill Accordions
═══════════════════════════════════════════════════════════════════ */

const SUPABASE_URL      = 'https://vjcucliqjjljhgbqshmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3VjbGlxampsamhnYnFzaG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTU3MTIsImV4cCI6MjA5NDA3MTcxMn0.qq7tRmLpRjTv0y4dZxCjcEQ48rTiY5ZV1xunr32kh10';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let CURRENT_USER = null;
let CHAR         = null;
let _profLevel   = 90;
let ALL_CHARS    = [];

/* ════════════════════════════════════════════════════════════════
   SAVE BADGE & SUPABASE HELPERS
   ════════════════════════════════════════════════════════════════ */
let _saveBadgeTimer = null;
function showSaveBadge(state, text) {
  const el = document.getElementById('saveBadge');
  if (!el) return;
  el.className = `save-badge show ${state}`;
  el.textContent = text;
  clearTimeout(_saveBadgeTimer);
  if (state !== 'saving') {
    _saveBadgeTimer = setTimeout(() => { el.className = 'save-badge'; }, 2200);
  }
}

async function loadRosterEntry(characterId) {
  if (!CURRENT_USER || !characterId) return null;
  const { data, error } = await db.from('user_roster')
    .select('owned, level, skill_levels').eq('user_id', CURRENT_USER.id).eq('character_id', characterId).single();
  return error ? null : data;
}

async function saveRosterEntry(characterId, patch) {
  if (!CURRENT_USER || !characterId) return;
  showSaveBadge('saving', '⟳ Saving…');
  const { error } = await db.from('user_roster').upsert({
    user_id: CURRENT_USER.id, character_id: characterId, ...patch, updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,character_id' });
  if (error) { console.warn('Save error:', error); showSaveBadge('error', '✕ Error'); }
  else showSaveBadge('saved', '✓ Saved');
}

const _charDebounce = {};
function debouncedSave(key, fn, delay = 600) {
  clearTimeout(_charDebounce[key]);
  _charDebounce[key] = setTimeout(fn, delay);
}

/* ════════════════════════════════════════════════════════════════
   APPLY SAVED STATE TO UI
   ════════════════════════════════════════════════════════════════ */
function applyRosterState(entry) {
  if (!entry) return;
  if (entry.level) {
    _profLevel = entry.level;
    updateProfileStats();
  }
  if (entry.skill_levels) {
    const skKeyMap = ['basic_attack', 'battle_skill', 'combo_skill', 'ultimate_skill'];
    skKeyMap.forEach((key, idx) => {
      if (entry.skill_levels[key]) {
        _skillRanks[idx] = entry.skill_levels[key];
        updateSkillRankDisplay(idx, entry.skill_levels[key]);
      }
    });
  }
  recalcDmg();
}

/* ════════════════════════════════════════════════════════════════
   ICON HELPER & THEMES
   ════════════════════════════════════════════════════════════════ */
function emojiToTwemojiUrl(emoji) {
  const codePoints = [...emoji].map(c => c.codePointAt(0).toString(16)).filter(cp => cp !== 'fe0f');
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoints.join('-')}.svg`;
}
function iconImg(srcOrEmoji, size = 20, extraClass = '') {
  if (!srcOrEmoji || typeof srcOrEmoji !== 'string') return '';
  const cls = extraClass ? ` class="${extraClass}"` : '';
  if (srcOrEmoji.includes('/') || srcOrEmoji.includes('.') || srcOrEmoji.startsWith('http')) {
    return `<img src="${srcOrEmoji}" width="${size}" height="${size}" alt="icon" loading="lazy"${cls}>`;
  }
  const isEmoji = /\p{Emoji_Presentation}/u.test(srcOrEmoji) || (/\p{Emoji}/u.test(srcOrEmoji) && srcOrEmoji.codePointAt(0) > 127);
  if (!isEmoji) return `<span style="font-size:${Math.round(size * 0.75)}px;line-height:1"${cls}>${srcOrEmoji}</span>`;
  const url = emojiToTwemojiUrl(srcOrEmoji);
  return `<img src="${url}" width="${size}" height="${size}" alt="${srcOrEmoji}" loading="lazy"${cls} onerror="this.replaceWith(document.createTextNode('${srcOrEmoji}'))">`;
}

const ELEMENT_PALETTES = {
  heat:     { primary:'#c94020', text:'#ff7a5c', bg:'rgba(201,64,32,0.13)',  bg2:'rgba(201,64,32,0.06)',  border:'rgba(201,64,32,0.34)',  glow:'rgba(201,64,32,0.24)' },
  cryo:     { primary:'#2672b8', text:'#7ec6ff', bg:'rgba(38,114,184,0.13)', bg2:'rgba(38,114,184,0.06)', border:'rgba(38,114,184,0.34)', glow:'rgba(38,114,184,0.22)' },
  nature:   { primary:'#2a8c52', text:'#6ddc9a', bg:'rgba(42,140,82,0.13)',  bg2:'rgba(42,140,82,0.06)',  border:'rgba(42,140,82,0.34)',  glow:'rgba(42,140,82,0.22)' },
  electric: { primary:'#b88a10', text:'#ffd257', bg:'rgba(184,138,16,0.13)', bg2:'rgba(184,138,16,0.06)', border:'rgba(184,138,16,0.34)', glow:'rgba(184,138,16,0.22)' },
  physical: { primary:'#6272a0', text:'#b0bedd', bg:'rgba(98,114,160,0.13)', bg2:'rgba(98,114,160,0.06)', border:'rgba(98,114,160,0.34)', glow:'rgba(98,114,160,0.20)' },
};
/* ── STATIC ICON RESOLVERS ── */
const ELEMENT_ICONS = {
  cryo:     'assets/ElementAssets/Cryoicon.png',
  ice:      'assets/ElementAssets/Cryoicon.png',
  heat:     'assets/ElementAssets/Heaticon.png',
  fire:     'assets/ElementAssets/Heaticon.png',
  electric: 'assets/ElementAssets/Electricicon.png',
  shock:    'assets/ElementAssets/Electricicon.png',
  nature:   'assets/ElementAssets/Natureicon.png',
  grass:    'assets/ElementAssets/Natureicon.png',
  physical: 'assets/ElementAssets/Physicalicon.png',
  steel:    'assets/ElementAssets/Physicalicon.png',
};
function resolveElementIcon(element) {
  const key = (element || '').toLowerCase().trim();
  return ELEMENT_ICONS[key] || null;
}

const WEAPON_ICONS = {
  'arts unit':  'assets/WeaponCharAssets/36px-Arts_Unit.png',
  'great sword':'assets/WeaponCharAssets/36px-Great_Sword.webp',
  'greatsword': 'assets/WeaponCharAssets/36px-Great_Sword.webp',
  'handcannon': 'assets/WeaponCharAssets/36px-Handcannon.webp',
  'polearm':    'assets/WeaponCharAssets/36px-Polearm.webp',
  'sword':'assets/WeaponCharAssets/Short-Weapon.webp',
};
function resolveWeaponIcon(weapon) {
  const key = (weapon || '').toLowerCase().trim();
  return WEAPON_ICONS[key] || null;
}

const CLASS_ICONS = {
  caster:   'assets/ClassAssets/CasterIcon.png',
  defender: 'assets/ClassAssets/DefenderIcon.png',
  guard:    'assets/ClassAssets/GuardIcon.png',
  striker:  'assets/ClassAssets/StrikerIcon.png',
  vanguard: 'assets/ClassAssets/VanguardIcon.png',
  supporter: 'assets/ClassAssets/SupporterIcon.png',
};
function resolveClassIcon(cls) {
  const key = (cls || '').toLowerCase().trim();
  return CLASS_ICONS[key] || null;
}

function applyTheme(elementOrHex) {
  const r = document.documentElement;
  const e = (elementOrHex||'').toLowerCase().trim();
  let key = ['heat','fire'].includes(e) ? 'heat' : ['cryo','ice'].includes(e) ? 'cryo' : ['nature','grass'].includes(e) ? 'nature' : ['electric','shock'].includes(e) ? 'electric' : ['physical','steel'].includes(e) ? 'physical' : null;
  let palette = key ? ELEMENT_PALETTES[key] : null;
  if (!palette && elementOrHex && elementOrHex.startsWith('#')) {
    const bigint = parseInt(elementOrHex.replace('#',''), 16);
    const rr = (bigint >> 16) & 255, gg = (bigint >> 8) & 255, bb = bigint & 255;
    palette = { primary: elementOrHex, text: `rgb(${Math.min(255,Math.floor(rr*1.35+30))},${Math.min(255,Math.floor(gg*1.35+30))},${Math.min(255,Math.floor(bb*1.35+30))})`, bg: `rgba(${rr},${gg},${bb},0.12)`, bg2: `rgba(${rr},${gg},${bb},0.06)`, border: `rgba(${rr},${gg},${bb},0.32)`, glow: `rgba(${rr},${gg},${bb},0.22)` };
  }
  if (!palette) return;
  r.style.setProperty('--primary', palette.primary); r.style.setProperty('--primary-bg', palette.bg); r.style.setProperty('--primary-bg2', palette.bg2); r.style.setProperty('--primary-border', palette.border); r.style.setProperty('--primary-text', palette.text); r.style.setProperty('--primary-glow', palette.glow);
}

/* ════════════════════════════════════════════════════════════════
   DROPDOWN — weapon-style (grouped, filterable, searchable)
   ════════════════════════════════════════════════════════════════ */
const charActiveFilters = { rarity: new Set(), element: new Set(), role: new Set(), weapon: new Set() };
let charSearchQuery = '';
let _dropdownOpen = false;

function toggleCharDropdown() { _dropdownOpen ? closeCharDropdown() : openCharDropdown(); }

function openCharDropdown() {
  _dropdownOpen = true;
  document.getElementById('charTrigger').classList.add('open');
  document.getElementById('charPanel').classList.add('open');
  setTimeout(() => document.getElementById('charSearch').focus(), 50);
  renderCharList();
  document.addEventListener('mousedown', onOutsideClick, true);
}

function closeCharDropdown() {
  _dropdownOpen = false;
  document.getElementById('charTrigger').classList.remove('open');
  document.getElementById('charPanel').classList.remove('open');
  document.removeEventListener('mousedown', onOutsideClick, true);
}

function onOutsideClick(e) {
  const wrap = document.getElementById('charDropdownWrap');
  if (wrap && !wrap.contains(e.target)) closeCharDropdown();
}

function charMatchesFilters(c) {
  const q = charSearchQuery.toLowerCase();
  if (q && !(c.name || '').toLowerCase().includes(q)) return false;
  if (charActiveFilters.rarity.size && !charActiveFilters.rarity.has(String(c.rarity || 6))) return false;
  if (charActiveFilters.element.size) {
    const el = (c.element || '').toLowerCase();
    if (![...charActiveFilters.element].some(f => el.includes(f.toLowerCase()))) return false;
  }
  if (charActiveFilters.role.size) {
    const ro = (c.role || '').toLowerCase();
    if (![...charActiveFilters.role].some(f => ro.includes(f.toLowerCase()))) return false;
  }
  if (charActiveFilters.weapon.size) {
    const wp = (c.weapon || '').toLowerCase();
    if (![...charActiveFilters.weapon].some(f => wp.includes(f.toLowerCase()))) return false;
  }
  return true;
}

function updateCharFilterBadge() {
  const count = charActiveFilters.rarity.size + charActiveFilters.element.size;
  const badge = document.getElementById('charFilterBadge');
  if (count > 0) { badge.textContent = count; badge.classList.add('visible'); }
  else badge.classList.remove('visible');
}

function buildCharList(chars) {
  ALL_CHARS = chars;
  renderCharList();
}

function renderCharList() {
  const list = document.getElementById('charList');
  if (!list) return;
  const groups = { 6: [], 5: [], 4: [], 3: [] };
  ALL_CHARS.filter(charMatchesFilters).forEach(c => {
    const r = c.rarity || 6;
    if (groups[r]) groups[r].push(c);
    else groups[6].push(c);
  });
  let html = '';
  let total = 0;
  [6, 5, 4, 3].forEach(r => {
    if (!groups[r].length) return;
    total += groups[r].length;
    html += `<div class="char-optgroup-label">${'★'.repeat(r)} · ${r}-Star (${groups[r].length})</div>`;
    groups[r].forEach(c => {
      const isCur = CHAR && CHAR.id === c.id;
      const stars = Array(r).fill('<div class="char-item-star"></div>').join('');
      const avatar = c.avatar_img
        ? `<img src="${c.avatar_img}">`
        : (c.name || '?').charAt(0);
      html += `
        <div class="char-item${isCur ? ' active' : ''}" data-id="${c.id}" onclick="selectChar('${c.id}')">
          <div class="char-item-av" style="background:${c.avatar_bg || 'var(--surface3)'}">${avatar}</div>
          <div style="flex:1;min-width:0">
            <div class="char-item-name">${c.name}</div>
            <div class="char-item-sub">${[c.element, c.class].filter(Boolean).join(' · ') || ''}</div>
          </div>
          <div class="char-item-stars">${stars}</div>
        </div>`;
    });
  });
  if (total === 0) html = '<div class="char-no-results">No operators match</div>';
  list.innerHTML = html;
}

function filterCharList(q) {
  charSearchQuery = q;
  renderCharList();
}

function setActiveCharItem(id) {
  document.querySelectorAll('.char-item').forEach(item =>
    item.classList.toggle('active', item.dataset.id === id)
  );
}

// Wire up filter pills and reset after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('charSearch').addEventListener('input', e => {
    charSearchQuery = e.target.value;
    renderCharList();
  });
  document.getElementById('charSearch').addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCharDropdown();
  });
  document.querySelectorAll('.char-fpill').forEach(pill => {
    pill.addEventListener('click', e => {
      e.stopPropagation();
      const group = pill.dataset.group;
      const val   = pill.dataset.val;
      const set   = charActiveFilters[group];
      if (set.has(val)) { set.delete(val); pill.className = 'char-fpill'; }
      else { set.add(val); pill.classList.add(`active-${val.replace(/\s+/g, '')}`); }
      updateCharFilterBadge();
      renderCharList();
    });
  });
  document.getElementById('charFilterClear').addEventListener('click', e => {
    e.stopPropagation();
    charActiveFilters.rarity.clear(); charActiveFilters.element.clear();
    charActiveFilters.role.clear();   charActiveFilters.weapon.clear();
    charSearchQuery = '';
    document.getElementById('charSearch').value = '';
    document.querySelectorAll('.char-fpill').forEach(p => { p.className = 'char-fpill'; });
    updateCharFilterBadge(); renderCharList();
  });
});
function selectChar(id) {
  closeCharDropdown();
  const url = new URL(window.location.href);
  url.searchParams.set('char', id);
  window.location.href = url.toString();
}

/* ════════════════════════════════════════════════════════════════
   TOUR — FIXED
   Key fixes:
   1. Both spotlight AND card use position:fixed (viewport coords, no scrollY needed)
   2. scrollIntoView first, then wait for scroll to settle before positioning
   3. Card stays within viewport bounds on all screen sizes
   4. Keyboard: Escape to close, ArrowRight/Left to navigate
   ════════════════════════════════════════════════════════════════ */
// tab: which tab to switch to before spotlighting (null = stay on current)
const TOUR_STEPS = [
  { target: 'charDropdownWrap', tab: null,      title: 'Switch Operator',       desc: 'Use this dropdown to switch between operators. You can <b>search by name</b> to find anyone fast.' },
  { target: 'heroSection',      tab: null,      title: 'Operator Hero Panel',   desc: 'See the operator\'s element, class, and rarity at a glance. Click the <b>Owned pill</b> on the right to track your roster.' },
  { target: 'attrCard',         tab: 'profile', title: 'Attribute Slider',      desc: 'Drag the <b>LV slider</b> to preview stat scaling at any level. Your current level saves automatically to your account.' },
  { target: 'skillsCard',       tab: 'profile', title: 'Per-Skill Ranks',       desc: '<b>Tap any skill card</b> to expand it. Each skill has its own rank slider that updates multipliers in real time.' },
  { target: 'panel-builds',     tab: 'builds',  title: 'Best Builds',           desc: 'The <b>Builds tab</b> shows the top weapons, recommended gear sets, stat priority, and a beginner guide for this operator.' },
  { target: 'panel-teams',      tab: 'teams',   title: 'Team Compositions',     desc: 'The <b>Teams tab</b> lists recommended team comps with synergy breakdowns, tier ratings, and role explanations for each slot.' },
  { target: 'panel-tracker',    tab: 'tracker', title: 'Damage Calculator',     desc: 'The <b>Tracker tab</b> has a live damage calculator synced to your skill ranks, plus a build progression checklist you can check off.' },
  { target: 'checklistCard',    tab: 'tracker', title: 'Build Checklist',       desc: 'Track every upgrade step with the <b>F2P or Spender route</b>. Progress saves to your account so you never lose your place.' },
];

let _tourStep = 0;

function startTour() {
  _tourStep = 0;
  switchTab('profile'); // always start on profile
  document.getElementById('tourOverlay').classList.add('active');
  showTourStep(_tourStep);
}

function endTour() {
  document.getElementById('tourOverlay').classList.remove('active');
}

function tourNext() {
  if (_tourStep < TOUR_STEPS.length - 1) { _tourStep++; showTourStep(_tourStep); }
  else endTour();
}

function tourPrev() {
  if (_tourStep > 0) { _tourStep--; showTourStep(_tourStep); }
}

function showTourStep(idx) {
  const step = TOUR_STEPS[idx];

  // Update text content
  document.getElementById('tourStepNum').textContent = `STEP ${idx + 1} OF ${TOUR_STEPS.length}`;
  document.getElementById('tourTitle').textContent   = step.title;
  document.getElementById('tourDesc').innerHTML      = step.desc;
  document.getElementById('tourDots').innerHTML      =
    Array.from({ length: TOUR_STEPS.length }, (_, i) =>
      `<div class="tour-dot${i === idx ? ' active' : ''}"></div>`).join('');
  document.getElementById('tourPrev').disabled = idx === 0;
  document.getElementById('tourNext').textContent = idx === TOUR_STEPS.length - 1 ? 'Finish ✓' : 'Next →';

  // Switch to the required tab first, then position after a short settle delay
  if (step.tab) {
    switchTab(step.tab);
    // Longer delay when switching tabs — panel needs to render + scroll
    setTimeout(() => _scrollAndPosition(step.target), 120);
  } else {
    _scrollAndPosition(step.target);
  }
}

function _scrollAndPosition(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  // Wait for scroll animation to settle before reading getBoundingClientRect
  setTimeout(() => _positionTourElements(target), 380);
}

function _positionTourElements(target) {
  const r   = target.getBoundingClientRect();
  const pad = 10;
  const vw  = window.innerWidth;
  const vh  = window.innerHeight;

  // ── Spotlight (position:fixed, viewport coords) ──
  const spot = document.getElementById('tourSpotlight');
  spot.style.top    = `${r.top    - pad}px`;
  spot.style.left   = `${r.left   - pad}px`;
  spot.style.width  = `${r.width  + pad * 2}px`;
  spot.style.height = `${r.height + pad * 2}px`;

  // ── Tour card ──
  const card     = document.getElementById('tourCard');
  const cardW    = Math.min(320, vw - 24);
  const cardH    = 220; // approximate; real height slightly taller but safe margin
  const margin   = 14;

  // Prefer below the target; fall back to above; fall back to right; left last
  let top, left;

  const spaceBelow = vh - (r.bottom + pad);
  const spaceAbove = r.top - pad;

  if (spaceBelow >= cardH + margin) {
    // Place below
    top  = r.bottom + pad + margin;
  } else if (spaceAbove >= cardH + margin) {
    // Place above
    top  = r.top - pad - margin - cardH;
  } else {
    // Not enough room above or below — overlay at top of viewport with offset
    top  = Math.max(8, r.top - pad - cardH - margin);
  }

  // Horizontal: align to left edge of target, clamped to viewport
  left = r.left - pad;
  left = Math.max(8, Math.min(left, vw - cardW - 8));

  card.style.top   = `${top}px`;
  card.style.left  = `${left}px`;
  card.style.width = `${cardW}px`;
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  const overlay = document.getElementById('tourOverlay');
  if (!overlay || !overlay.classList.contains('active')) return;
  if (e.key === 'Escape')      endTour();
  if (e.key === 'ArrowRight')  tourNext();
  if (e.key === 'ArrowLeft')   tourPrev();
});

// Reposition on resize
window.addEventListener('resize', () => {
  const overlay = document.getElementById('tourOverlay');
  if (!overlay || !overlay.classList.contains('active')) return;
  const step = TOUR_STEPS[_tourStep];
  const target = document.getElementById(step.target);
  if (target) _positionTourElements(target); // no scroll needed on resize
});

/* ════════════════════════════════════════════════════════════════
   TABS
   ════════════════════════════════════════════════════════════════ */
function switchTab(name) {
  document.querySelectorAll('.tab[role="tab"]').forEach((t, i) => {
    t.classList.toggle('active', ['profile','builds','teams','tracker'][i] === name);
  });
  document.querySelectorAll('.panel').forEach(p => {
    p.classList.toggle('active', p.id === 'panel-' + name);
  });
  if (name === 'tracker') recalcDmg();
}

function switchRoute(route) {
  document.getElementById('btn-f2p').classList.toggle('active',   route === 'f2p');
  document.getElementById('btn-spend').classList.toggle('active', route === 'spend');
  document.querySelectorAll('.route-f2p').forEach(el =>   el.style.display = route === 'f2p'   ? 'flex' : 'none');
  document.querySelectorAll('.route-spend').forEach(el =>  el.style.display = route === 'spend' ? 'flex' : 'none');
  updateCheckProgress();
}

/* ════════════════════════════════════════════════════════════════
   OWNED PILL
   ════════════════════════════════════════════════════════════════ */
let _ownedState = false;
function _syncOwnedPill() {
  const check = document.getElementById('dom-owned-check');
  const label = document.getElementById('dom-owned-label');
  const pill  = document.getElementById('dom-owned-pill');
  if (!check || !label || !pill) return;
  check.textContent = _ownedState ? '✓' : '○';
  label.textContent = _ownedState ? 'Owned' : 'Not Owned';
  pill.style.color       = _ownedState ? 'var(--primary-text)' : 'var(--text3)';
  pill.style.borderColor = _ownedState ? 'var(--primary-border)' : 'transparent';
}
async function toggleCharOwned() {
  if (!CURRENT_USER) { alert('Please sign in to track your roster.'); return; }
  if (!CHAR) return;
  _ownedState = !_ownedState;
  _syncOwnedPill();
  await saveRosterEntry(CHAR.id, { owned: _ownedState });
}

/* ════════════════════════════════════════════════════════════════
   INIT & RENDER
   ════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  const overlay = document.getElementById('loading-overlay');
  const { data: { session } } = await db.auth.getSession();
  CURRENT_USER = session?.user || null;

  if (!CURRENT_USER) {
    const notice = document.createElement('div');
    notice.className = 'roster-notice';
    notice.style.cssText = 'font-size:12px;color:var(--text3);padding:6px 16px;background:var(--surface);border-bottom:1px solid var(--border);text-align:center';
    notice.innerHTML = `<a href="auth.html" style="color:var(--primary-text)">Sign in</a> to save tracker progress and roster across devices.`;
    document.querySelector('.topbar')?.insertAdjacentElement('afterend', notice);
  }

  const charSlug = new URLSearchParams(window.location.search).get('char') || null;
  try {
    const { data: chars } = await db.from('characters').select('id, name, element, class, role, weapon, rarity, avatar_img, avatar_bg').order('name');
    if (chars && chars.length > 0) buildCharList(chars);
    const targetId = charSlug || (chars && chars.length > 0 ? chars[0].id : null);
    if (targetId) {
      const { data: char } = await db.from('characters').select('*').eq('id', targetId).single();
      if (char) {
        document.getElementById('charTriggerLabel').textContent = char.name;
        setActiveCharItem(targetId);
        renderCharacter(char);
        if (CURRENT_USER) {
          const entry = await loadRosterEntry(char.id);
          if (entry) applyRosterState(entry);
        }
      }
    }
  } catch(e) { console.warn('Supabase unavailable:', e); }

  initProfileSliders();
  recalcDmg();
  updateCheckProgress();
  setTimeout(() => overlay.classList.add('hidden'), 900);
});

/* ─── RENDERING HELPERS ─── */
function statRow(label, val) {
  const v = typeof val === 'string' && val.startsWith('<') ? val : `<span class="stat-val">${val || '—'}</span>`;
  return `<div class="stat-row"><span class="stat-label">${label}</span>${v}</div>`;
}
function badgeLabel(b) {
  const m = { bis:'Best in Slot', alt:'Alternative', f2p:'F2P Alt', good:'5-Star Option' };
  return m[b] || b || 'Option';
}

function renderCharacter(char) {
  CHAR = char;
  applyTheme(char.theme_color || char.element || 'Heat');
  document.title = `${char.name} — Arknights: Endfield`;
  document.getElementById('page-title').textContent = `${char.name} — Arknights: Endfield`;
  document.getElementById('nav-name').textContent     = char.name;
  document.getElementById('nav-name-sub').textContent = char.name;

  const avatarEl = document.getElementById('dom-avatar');
  if (char.avatar_img) avatarEl.innerHTML = `<img src="${char.avatar_img}" class="avatar-img">`;
  else { avatarEl.textContent = char.name.charAt(0); avatarEl.style.background = char.avatar_bg || 'var(--primary-bg)'; }

  if (document.getElementById('dom-banner'))
    document.getElementById('dom-banner').style.backgroundImage = char.img_path ? `url('${char.img_path}')` : 'none';

  document.getElementById('dom-name').textContent    = char.name;
  document.getElementById('dom-eyebrow').textContent = [char.element, char.class, char.faction].filter(Boolean).join(' · ').toUpperCase();
  document.getElementById('dom-quote').textContent   = char.quote || '';

  const _elIcon  = char.icon_element   || resolveElementIcon(char.element) || '◈';
  const _wpnIcon = char.icon_weapon_type|| resolveWeaponIcon(char.weapon)  || '⚔️';
  const _clsIcon = resolveClassIcon(char.class);

  document.getElementById('dom-tags').innerHTML = `
    <span class="tag tag-stars">${iconImg('../assets/RarityAssets/StarIcon.png', 12, 'tag-el-icon').repeat(char.rarity || 6)} ${char.rarity || 6}-Star</span>
    <span class="tag tag-primary">${iconImg(_elIcon, 12, 'tag-el-icon')} ${char.element || ''}</span>
    <span class="tag tag-class">${_clsIcon ? iconImg(_clsIcon, 12, 'tag-el-icon') + ' ' : ''}${char.class || ''}</span>
    <span class="tag tag-class">${iconImg(_wpnIcon, 12, 'tag-el-icon')} ${char.weapon || ''}</span>
  `;

  document.getElementById('dom-pills').innerHTML = `
    <div class="hero-pill">${iconImg('../assets/RarityAssets/StarIcon.png', 14, 'has-char-img')}<strong>${char.rarity || 6}-Star</strong></div>
    <div class="hero-pill">${iconImg(_wpnIcon, 14, 'has-char-img')}<strong>${char.weapon || ''}</strong></div>
    <div class="hero-pill">${_clsIcon ? iconImg(_clsIcon, 14, 'has-char-img') : ''}${iconImg(char.icon_role || '🎯', 14, 'has-char-img')}<strong>${char.role || ''}</strong></div>
    <div class="hero-pill owned-pill" id="dom-owned-pill" onclick="toggleCharOwned()" style="cursor:pointer;user-select:none">
      <span id="dom-owned-check" style="font-size:12px">○</span><strong id="dom-owned-label">Not Owned</strong>
    </div>`;

  if (CURRENT_USER) loadRosterEntry(char.id).then(entry => { _ownedState = !!entry?.owned; _syncOwnedPill(); });

  if (char.video_url) {
    document.getElementById('dom-video').src = char.video_url;
    document.getElementById('dom-video-wrap').style.display = '';
  } else {
    document.getElementById('dom-video-wrap').style.display = 'none';
  }

  renderAttributes(char);

  document.getElementById('dom-overview').innerHTML =
      statRow('Element', `<span class="stat-val highlight">${char.element || '—'}</span>`)
    + statRow('Class',   char.class)  + statRow('Weapon', char.weapon) + statRow('Role', char.role)
    + statRow('Rarity',  `<span class="stat-val highlight-gold">${'★'.repeat(char.rarity || 6)}</span>`)
    + statRow('Tier',    `<span class="stat-val highlight-green">${char.tier || '—'}</span>`);

  renderSkills(char.skills || []);
  renderTalents(char.talents || []);
  renderChecklist(char);

  document.getElementById('dom-potentials').innerHTML = (char.potentials || []).map((p, i) =>
    `<div class="pot-row">${p.icon ? `<div class="pot-icon">${iconImg(p.icon, 18, 'has-char-img')}</div>` : ''}<div class="pot-badge">${p.rank || ('P' + (i+1))}</div><div class="pot-desc"><strong>${p.name}</strong> — ${p.desc}</div></div>`
  ).join('');

  document.getElementById('dom-weapons').innerHTML = (char.weapons || []).map(w =>
    `<div class="weapon-card${w.is_best ? ' best' : ''}"><div class="weapon-icon">${iconImg(w.icon || '⚔️', 28, 'has-char-img')}</div><div style="flex:1"><div class="weapon-name">${w.name}</div><div class="weapon-sub">${w.sub}</div></div><span class="weapon-badge badge-${w.badge || 'alt'}">${badgeLabel(w.badge)}</span></div>`
  ).join('');

  if (char.gear_set_name) document.getElementById('dom-gear-title').textContent = `Best Gear — ${char.gear_set_name}`;
  document.getElementById('dom-gear-slots').innerHTML = (char.gear_slots || []).map(g =>
    `<div class="gear-slot"><div class="gear-slot-icon">${iconImg(g.icon || '🎒', 26, 'has-char-img')}</div><div class="gear-slot-name">${g.slot}</div><div class="gear-slot-set">${g.set}</div><div class="gear-slot-note">${g.note}</div></div>`
  ).join('');

  if (char.gear_set_bonus) {
    document.getElementById('dom-set-bonus').innerHTML = `<div class="talent-name" style="margin-bottom:5px">${char.gear_set_bonus.name}</div><div class="talent-desc">${char.gear_set_bonus.desc}</div>`;
    document.getElementById('dom-set-bonus').style.display = '';
  } else {
    document.getElementById('dom-set-bonus').style.display = 'none';
  }

  document.getElementById('dom-stat-prio').innerHTML = (char.stat_priority || []).map((s, i) =>
    `<div class="prio-row"><div class="prio-num">${i + 1}</div><span>${s}</span></div>`
  ).join('');

  const bg = char.beginner || {};
  document.getElementById('dom-beginner-stats').innerHTML =
      statRow('Focus',     `<span class="stat-val highlight-gold">${bg.focus || '—'}</span>`)
    + statRow('Early Set', bg.early_set || '—')
    + (bg.set_bonus ? statRow('Set Bonus', bg.set_bonus) : '');
  document.getElementById('dom-beginner-tip').innerHTML = bg.tip ? `<strong>Tip:</strong> ${bg.tip}` : '';

  document.getElementById('dom-synergies').innerHTML = (char.synergies || []).map(s => {
    const valClass = s.color === 'primary' ? 'highlight' : s.color === 'green' ? 'highlight-green' : s.color === 'gold' ? 'highlight-gold' : s.color === 'purple' ? 'highlight-purple' : s.color === 'blue' ? 'highlight-blue' : '';
    return `<div class="stat-row"><span class="stat-label">${s.label}</span><span class="stat-val ${valClass}">${s.value}</span></div>`;
  }).join('');

  document.getElementById('dom-teams').innerHTML = (char.teams || []).map(t => {
    const tierClass = t.tier === 's' ? 'team-tier-s' : t.tier === 'a' ? 'team-tier-a' : 'team-tier-b';
    const tierLabel = t.tier === 's' ? 'S-TIER' : t.tier === 'a' ? 'A-TIER' : 'B-TIER';
    return `<div class="team-card"><div class="team-header"><div class="team-name">${t.name}</div><span class="${tierClass}">${tierLabel}</span></div><div class="members">${(t.members || []).map(m => {
      const avatarContent = m.image ? `<img src="${m.image}" alt="${m.name}">` : m.initials;
      return `<div class="member-chip${m.is_core ? ' core' : ''}"><div class="member-av" style="background:${m.color || '#555'}">${avatarContent}</div><div><div class="member-name">${m.name}</div><div class="member-role">${m.role}</div></div></div>`;
    }).join('')}</div><div class="team-notes">${t.notes}</div></div>`;
  }).join('');

  if (char.calc_primary_default) document.getElementById('c-primary').value = char.calc_primary_default;
  if (char.calc_atk_default)     document.getElementById('c-atk').value     = char.calc_atk_default;
  if (char.calc_atkp_default)    document.getElementById('c-atkp').value    = char.calc_atkp_default;
  if (char.calc_elem_default)    document.getElementById('c-elem').value    = char.calc_elem_default;

  populateCalcSkills();
  initProfileSliders();
  recalcDmg();
  updateCheckProgress();
}

/* ─── ATTRIBUTES ─── */
function renderAttributes(char) {
  const attrMap = [
    { key:'str', label:'Strength',  icon: char.icon_str || '../assets/AttributesAssets/STR.png',  id:'attr-str' },
    { key:'agi', label:'Agility',   icon: char.icon_agi || '../assets/AttributeAssets/AGI.png',   id:'attr-agi' },
    { key:'int', label:'Intellect', icon: char.icon_int || '../assets/AttributesAssets/INT.png',  id:'attr-int' },
    { key:'wil', label:'Will',      icon: char.icon_wil || '../assets/AttributesAssets/WILL.png', id:'attr-wil' }
  ];
  const primary = char.primary_attr || 'int';
  document.getElementById('dom-attr-grid').innerHTML = attrMap.map(a => {
    const maxVal = char['attr_' + a.key] || 0;
    return `
    <div class="attr-row${a.key === primary ? ' primary' : ''}">
      <div class="attr-icon">${iconImg(a.icon, 22, 'has-char-img')}</div>
      <div class="attr-body">
        <div class="attr-label">${a.label}</div>
        <div class="attr-val" id="${a.id}" data-max="${maxVal}">${maxVal}</div>
        <div class="attr-bar-wrap"><div class="attr-bar-fill" id="bar-${a.id}" style="width:100%"></div></div>
      </div>
    </div>`;
  }).join('');
}

/* ─── SKILLS ─── */
const _skillRanks = {};
function renderSkills(skills) {
  document.getElementById('dom-skills').innerHTML = skills.map((s, idx) => {
    _skillRanks[idx] = 12;
    const multipliersHtml = (s.multipliers && s.multipliers.length) ? s.multipliers.map(m => {
      const values = Array.isArray(m.values) && m.values.length ? m.values : Array.from({length: 12}, (_, i) => (m.value || 0) * (0.5 + 0.5 * ((i + 1) / 12)));
      const pips = Array.from({length: 12}, (_, i) => `<div class="sk-pip${i === 11 ? ' lit' : ''}"></div>`).join('');
      return `
      <div class="skill-mult-row">
        <span class="skill-mult-label">${m.label.replace(/[\d.]+%/, '').trim()}</span>
        <div class="skill-mult-right">
          <span class="skill-val" data-skill-idx="${idx}" data-values='${JSON.stringify(values)}'>${(values[11] * 100).toFixed(1).replace('.0', '')}%</span>
          <div class="sk-pip-row" data-skill-idx="${idx}">${pips}</div>
        </div>
      </div>`;
    }).join('') : '';

    return `
    <div class="skill-card" id="skill-card-${idx}">
      <div class="skill-card-header" onclick="toggleSkillCard(${idx})">
        <div class="skill-ico">${iconImg(s.icon || '◈', 24, 'has-char-img')}</div>
        <div class="skill-card-info">
          <div class="skill-name">${s.name}</div>
          <div class="skill-sub-brief">${s.desc?.substring(0, 80)}${s.desc?.length > 80 ? '…' : ''}</div>
        </div>
        <div class="skill-card-meta"><div class="skill-type-badge${s.is_sp ? ' sp' : ''}">${s.type || ''}</div><span class="skill-expand-arrow">▼</span></div>
      </div>
      <div class="skill-card-body" style="display:none">
        <div class="skill-desc-full">${s.desc}</div>
        <div class="skill-rank-wrap">
          <div class="skill-rank-header">
            <span class="skill-rank-label">Skill Rank</span><span class="skill-rank-val" id="skill-rank-out-${idx}">12<span class="skill-rank-max">/ 12</span></span>
          </div>
          <div class="skill-rank-track-wrap" id="skill-rank-track-${idx}">
            <div class="skill-rank-track-bg"></div>
            <div class="skill-rank-track-fill" id="skill-rank-fill-${idx}" style="width:100%"></div>
            <div class="skill-rank-pips" id="skill-rank-pips-${idx}"></div>
            <div class="skill-rank-thumb" id="skill-rank-thumb-${idx}" style="left:100%"></div>
          </div>
        </div>
        ${multipliersHtml ? `<div class="skill-multipliers">${multipliersHtml}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  skills.forEach((_, idx) => {
    const el = document.getElementById(`skill-rank-pips-${idx}`);
    if (el) el.innerHTML = [1, 3, 6, 9, 12].map(lv =>
      `<div class="skill-rank-pip reached" data-lv="${lv}" style="position:absolute;left:${((lv-1)/11)*100}%;transform:translateX(-50%)"></div>`
    ).join('');
    initSkillSlider(idx);
    updateSkillRankDisplay(idx, 12);
  });
}

function toggleSkillCard(idx) {
  const card = document.getElementById(`skill-card-${idx}`);
  const body = card?.querySelector('.skill-card-body');
  if (!card || !body) return;
  body.style.display = card.classList.toggle('expanded') ? 'block' : 'none';
}

function initSkillSlider(idx) {
  const track = document.getElementById(`skill-rank-track-${idx}`);
  if (!track) return;
  let dragging = false;
  function posPct(e) {
    const r = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width));
  }
  function applyPos(e) {
    const val = Math.round(posPct(e) * 11) + 1;
    if (_skillRanks[idx] !== val) {
      _skillRanks[idx] = val;
      updateSkillRankDisplay(idx, val);
      if (CHAR && CURRENT_USER) {
        const key = ['basic_attack', 'battle_skill', 'combo_skill', 'ultimate_skill'][idx];
        if (key) {
          debouncedSave(`profile-sk-${idx}`, async () => {
            const existing = await loadRosterEntry(CHAR.id);
            const merged = { ...(existing?.skill_levels || {}), [key]: val };
            saveRosterEntry(CHAR.id, { skill_levels: merged });
          });
        }
      }
    }
  }
  track.addEventListener('mousedown',  e => { dragging = true; applyPos(e); });
  track.addEventListener('touchstart', e => { dragging = true; applyPos(e); }, { passive: true });
  document.addEventListener('mousemove',  e => { if (dragging) applyPos(e); });
  document.addEventListener('touchmove',  e => { if (dragging) applyPos(e); }, { passive: true });
  document.addEventListener('mouseup',  () => { dragging = false; });
  document.addEventListener('touchend', () => { dragging = false; });
}

function updateSkillRankDisplay(idx, rank) {
  const pct    = ((rank - 1) / 11) * 100;
  const outEl  = document.getElementById(`skill-rank-out-${idx}`);
  const fillEl = document.getElementById(`skill-rank-fill-${idx}`);
  const thumbEl= document.getElementById(`skill-rank-thumb-${idx}`);

  if (outEl)  outEl.innerHTML = `${rank}<span class="skill-rank-max">/ 12</span>`;
  if (fillEl) fillEl.style.width = pct + '%';
  if (thumbEl)thumbEl.style.left = pct + '%';

  document.querySelectorAll(`#skill-rank-pips-${idx} .skill-rank-pip`).forEach(p =>
    p.classList.toggle('reached', rank >= parseInt(p.dataset.lv))
  );

  document.querySelectorAll(`.skill-val[data-skill-idx="${idx}"]`).forEach(el => {
    try {
      const values = JSON.parse(el.getAttribute('data-values') || '[]');
      const parentRow = el.closest('.skill-mult-row');
      const label = parentRow ? parentRow.querySelector('.skill-mult-label').textContent.toLowerCase() : '';

      if (values.length > 0) {
        const rawVal = values[Math.min(rank, values.length) - 1];
        const nonPctTerms = ['energy', 'stagger', 'sp', 'cooldown'];
        const isNonPct = nonPctTerms.some(term => label.includes(term));

        if (isNonPct) {
          el.textContent = Number.isInteger(rawVal) ? rawVal : rawVal.toFixed(1);
        } else {
          const pctVal = rawVal * 100;
          el.textContent = pctVal % 1 === 0 ? pctVal.toFixed(0) + '%' : pctVal.toFixed(1) + '%';
        }

        el.classList.remove('skill-val-bump'); void el.offsetWidth; el.classList.add('skill-val-bump');
        setTimeout(() => el.classList.remove('skill-val-bump'), 280);
      }
    } catch(e) {}
  });

  document.querySelectorAll(`.sk-pip-row[data-skill-idx="${idx}"]`).forEach(row =>
    row.querySelectorAll('.sk-pip').forEach((pip, i) => pip.classList.toggle('lit', i < rank))
  );
}

function renderTalents(talents) {
  document.getElementById('dom-talents').innerHTML = talents.map(t =>
    `<div class="talent-row${t.is_base ? ' base-talent' : ''}"><div class="talent-header"><div class="talent-icon">${iconImg(t.icon || '◈', 17, 'has-char-img')}</div><div class="talent-name">${t.name}</div></div><div class="talent-desc">${t.desc}</div></div>`
  ).join('');
}

/* ─── CHECKLIST ─── */
async function loadChecklistState(charId) {
  if (!CURRENT_USER) return {};
  const { data, error } = await db.from('user_checklists').select('checked_ids').eq('user_id', CURRENT_USER.id).eq('character_id', charId).single();
  return error || !data ? {} : Object.fromEntries((data.checked_ids || []).map(id => [id, true]));
}

async function saveChecklistState(charId) {
  if (!CURRENT_USER) return;
  const checked = [...document.querySelectorAll('.check-row.done[data-check-id]')].map(row => row.dataset.checkId);
  showSaveBadge('saving', '⟳ Saving…');
  const { error } = await db.from('user_checklists').upsert({
    user_id: CURRENT_USER.id, character_id: charId, checked_ids: checked, updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,character_id' });
  if (error) showSaveBadge('error', '✕ Error');
  else showSaveBadge('saved', '✓ Saved');
}

async function renderChecklist(char) {
  const f = (list, cls, hid, prefix) => (list||[]).map((c, i) =>
    `<div class="check-row ${cls}" data-check-id="${prefix}-${i}" onclick="toggleCheck(this)"${hid ? ' style="display:none"' : ''}><div class="check-box">✓</div><span class="check-label">${c.label}</span><span class="check-cost">${c.cost}</span></div>`
  ).join('');
  document.getElementById('dom-checklist').innerHTML =
    f(char.checklist_shared, '',          false, 'shared') +
    f(char.checklist_f2p,   'route-f2p',  false, 'f2p')    +
    f(char.checklist_spend, 'route-spend', true,  'spend');
  const state = await loadChecklistState(char.id);
  document.querySelectorAll('.check-row[data-check-id]').forEach(row => {
    if (state[row.dataset.checkId]) row.classList.add('done');
  });
  updateCheckProgress();
}
function toggleCheck(row) {
  row.classList.toggle('done');
  updateCheckProgress();
  if (CHAR && CHAR.id) saveChecklistState(CHAR.id);
}
function updateCheckProgress() {
  const rows = [...document.querySelectorAll('.check-row')].filter(r => r.style.display !== 'none');
  const done = rows.filter(r => r.classList.contains('done')).length;
  if (document.getElementById('check-fill'))  document.getElementById('check-fill').style.width = rows.length ? `${(done/rows.length)*100}%` : '0%';
  if (document.getElementById('check-label')) document.getElementById('check-label').textContent = `${done} / ${rows.length}`;
}

/* ─── PROFILE LEVEL SLIDER ─── */
function initProfileSliders() {
  const track = document.getElementById('prof-level-track');
  if (!track) return;

  document.getElementById('prof-level-pips').innerHTML = [1, 20, 40, 50, 60, 70, 80, 90].map(lv =>
    `<div class="prof-milestone-pip" data-lv="${lv}" style="position:absolute;left:${((lv-1)/89)*100}%;transform:translateX(-50%)"></div>`
  ).join('');

  let dragging = false;
  function posPct(e) {
    const r = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width));
  }
  function applyPos(e) {
    const val = Math.round(posPct(e) * 89) + 1;
    if (_profLevel !== val) {
      _profLevel = val;
      updateProfileStats();
      recalcDmg();
      if (CHAR && CURRENT_USER) debouncedSave('profile-level', () => saveRosterEntry(CHAR.id, { level: val }));
    }
  }

  track.addEventListener('mousedown',  e => { dragging = true; track.classList.add('dragging'); applyPos(e); });
  track.addEventListener('touchstart', e => { dragging = true; track.classList.add('dragging'); applyPos(e); }, { passive: true });
  document.addEventListener('mousemove',  e => { if (dragging) applyPos(e); });
  document.addEventListener('touchmove',  e => { if (dragging) applyPos(e); }, { passive: true });
  document.addEventListener('mouseup',  () => { dragging = false; track.classList.remove('dragging'); });
  document.addEventListener('touchend', () => { dragging = false; track.classList.remove('dragging'); });

  updateProfileStats();
}

function getStatsAtLevel(char, level) {
  const curve = char.stat_curves;
  const keys  = ['str', 'agi', 'int', 'wil'];
  if (!curve || curve.length === 0) {
    const result = {};
    keys.forEach(k => { result[k] = Math.floor((char['attr_' + k] || 0) * (0.3 + 0.7 * (level / 90))); });
    return result;
  }
  const sorted = [...curve].sort((a, b) => a.level - b.level);
  if (level <= sorted[0].level) return sorted[0];
  if (level >= sorted[sorted.length - 1].level) return sorted[sorted.length - 1];
  let lo = sorted[0], hi = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].level <= level && sorted[i + 1].level >= level) { lo = sorted[i]; hi = sorted[i + 1]; break; }
  }
  const t = (level - lo.level) / (hi.level - lo.level);
  const result = { level };
  keys.forEach(k => { result[k] = Math.floor((lo[k] || 0) + ((hi[k] || 0) - (lo[k] || 0)) * t); });
  return result;
}

function updateProfileStats() {
  const outEl = document.getElementById('prof-level-out');
  if (outEl) outEl.innerHTML = `${_profLevel}<span class="prof-lv-max">/ 90</span>`;
  const pct = ((_profLevel - 1) / 89) * 100;
  if (document.getElementById('prof-level-fill'))  document.getElementById('prof-level-fill').style.width = pct + '%';
  if (document.getElementById('prof-level-thumb')) document.getElementById('prof-level-thumb').style.left = pct + '%';
  document.querySelectorAll('#prof-level-pips .prof-milestone-pip').forEach(p =>
    p.classList.toggle('reached', _profLevel >= parseInt(p.dataset.lv))
  );

  if (!CHAR) return;
  const stats = getStatsAtLevel(CHAR, _profLevel);
  ['str', 'agi', 'int', 'wil'].forEach(a => {
    const el    = document.getElementById('attr-' + a);
    const barEl = document.getElementById('bar-attr-' + a);
    if (!el) return;
    const newVal = stats[a] ?? Math.floor((CHAR['attr_' + a] || 0) * (0.3 + 0.7 * _profLevel / 90));
    el.textContent = newVal;
    el.classList.remove('attr-bump'); void el.offsetWidth; el.classList.add('attr-bump');
    setTimeout(() => el.classList.remove('attr-bump'), 280);
    if (barEl) barEl.style.width = Math.min(100, (newVal / (parseFloat(el.getAttribute('data-max')) || CHAR['attr_' + a] || 1)) * 100) + '%';
  });

  const cPrim = document.getElementById('c-primary');
  if (cPrim) cPrim.value = stats[CHAR.primary_attr || 'int'] || 0;
}

/* ─── DAMAGE CALCULATOR ─── */
function populateCalcSkills() {
  if (!CHAR) return;

  const EXCLUDE_LABELS = [
    'stagger', 'sp cost', 'sp recovery', 'cooldown',
    'ult energy cost', 'energy gain', 'duration',
    'shield', 'heal', 'buff', 'debuff', 'ultimate energy cost'
  ];

  let allMults = [];

  if (CHAR.skills) {
    CHAR.skills.forEach((sk, idx) => {
      const rank = _skillRanks[idx] || 12;
      if (sk.multipliers) {
        sk.multipliers.forEach(m => {
          const labelLower = m.label.toLowerCase();
          const isDamage = !EXCLUDE_LABELS.some(keyword => labelLower.includes(keyword));
          if (isDamage) {
            let val = 1;
            if (Array.isArray(m.values) && m.values.length > 0) {
              val = m.values[Math.min(rank, m.values.length) - 1];
            } else {
              const base = m.value || 1;
              val = base * (0.5 + 0.5 * (rank / 12));
            }
            allMults.push({ label: `${sk.name} — ${m.label.replace(/[\d.]+%/, '').trim()}`, value: val });
          }
        });
      }
    });
  }

  if (allMults.length === 0 && CHAR.skill_multipliers) allMults = CHAR.skill_multipliers;
  if (allMults.length === 0) allMults = [{ label: 'Basic Attack', value: 1 }];

  const select = document.getElementById('c-skill');
  if (!select) return;

  const prevVal = select.value;
  select.innerHTML = allMults.map(m =>
    `<option value="${m.value}">${m.label} (${Math.round(m.value * 100)}%)</option>`
  ).join('');
  if (prevVal) select.value = prevVal;
}

function recalcDmg() {
  const getVal = id => { const el = document.getElementById(id); return el ? (parseFloat(el.value) || 0) : 0; };

  const level   = _profLevel || 90;
  const primary = getVal('c-primary');
  const baseAtk = getVal('c-atk');
  const atkPct  = getVal('c-atkp') / 100;
  const elemPct = getVal('c-elem') / 100;
  const critRate= getVal('c-crit-rate') / 100;
  const critDmg = Math.max(1, getVal('c-crit-dmg') / 100);

  const skillEl = document.getElementById('c-skill');
  const mult    = skillEl ? (parseFloat(skillEl.value) || 1) : 1;

  if (document.getElementById('c-level-out')) document.getElementById('c-level-out').textContent = Math.round(level);

  const lvScale  = 0.45 + (level / 90) * 0.55;
  const primBonus= primary * 2.8;
  const finalAtk = Math.round((baseAtk + primBonus) * (1 + atkPct) * lvScale);
  const hitBase  = finalAtk * mult * (1 + elemPct);

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = Math.round(val).toLocaleString(); };
  setEl('r-atk',      finalAtk);
  setEl('r-avg',      hitBase);
  setEl('r-crit',     hitBase * critDmg);
  setEl('r-avg-crit', hitBase * (1 + critRate * (critDmg - 1)));
  setEl('t-atk',      finalAtk);
  setEl('t-dps',      hitBase * (1 + critRate * (critDmg - 1)));
}