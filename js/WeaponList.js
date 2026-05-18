// ==========================================
// SUPABASE — same project as OperatorList / auth
// ==========================================
const SUPABASE_URL      = 'https://vjcucliqjjljhgbqshmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3VjbGlxampsamhnYnFzaG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTU3MTIsImV4cCI6MjA5NDA3MTcxMn0.qq7tRmLpRjTv0y4dZxCjcEQ48rTiY5ZV1xunr32kh10';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let CURRENT_USER  = null;
// Cache: { [weapon_id]: { owned } }
let WEAPON_ROSTER = {};
// Cache: { [weapon_id]: { level } } — sourced from weapon_progress (set in WeaponIntroduction)
let WEAPON_PROGRESS = {};

async function loadWeaponRoster() {
  if (!CURRENT_USER) return;
  const { data, error } = await db
    .from('user_weapon_roster')
    .select('weapon_id, owned')
    .eq('user_id', CURRENT_USER.id);
  if (error) { console.warn('Weapon roster load error:', error); return; }
  WEAPON_ROSTER = {};
  (data || []).forEach(row => { WEAPON_ROSTER[row.weapon_id] = row; });
}

// Load levels saved in WeaponIntroduction (weapon_progress table)
async function loadWeaponProgress() {
  if (!CURRENT_USER) {
    // Fall back to localStorage written by WeaponIntroduction
    try {
      const all = JSON.parse(localStorage.getItem('wpn_progress_v1') || '{}');
      WEAPON_PROGRESS = {};
      Object.entries(all).forEach(([id, val]) => {
        if (val && val.level != null) WEAPON_PROGRESS[id] = { level: val.level };
      });
    } catch { WEAPON_PROGRESS = {}; }
    return;
  }
  try {
    const { data, error } = await db
      .from('weapon_progress')
      .select('weapon_id, level')
      .eq('user_id', CURRENT_USER.id);
    if (error) { console.warn('Weapon progress load error:', error); return; }
    WEAPON_PROGRESS = {};
    (data || []).forEach(row => { if (row.level != null) WEAPON_PROGRESS[row.weapon_id] = { level: row.level }; });
  } catch(e) { console.warn('Weapon progress fetch failed:', e); }
}

function getProgressLevel(id) {
  return WEAPON_PROGRESS[id]?.level ?? null;
}

async function upsertWeaponEntry(weaponId, patch) {
  if (!CURRENT_USER) return;
  const existing = WEAPON_ROSTER[weaponId] || { owned: false };
  const updated  = { ...existing, ...patch };
  WEAPON_ROSTER[weaponId] = updated;
  const { error } = await db.from('user_weapon_roster').upsert({
    user_id:    CURRENT_USER.id,
    weapon_id:  weaponId,
    owned:      updated.owned,
    level:      null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,weapon_id' });
  if (error) console.warn('Weapon roster save error:', error);
}

function getWeaponEntry(id) {
  return WEAPON_ROSTER[id] || { owned: false, level: null };
}

const _wpnDebounce = {};
function wpnDebounce(key, fn, delay = 600) {
  clearTimeout(_wpnDebounce[key]);
  _wpnDebounce[key] = setTimeout(fn, delay);
}

// ==========================================
// ASSET DICTIONARY
// ==========================================
const STAR_IMAGE = "assets/RarityAssets/StarIcon.png";

const WEAPON_ASSETS = {
  types: {
    "Sword":      "assets/WeaponCharAssets/Short-Weapon.webp",
    "Greatsword": "assets/WeaponCharAssets/36px-Great_Sword.webp",
    "Polearm":    "assets/WeaponCharAssets/36px-Polearm.webp",
    "Handcannon": "assets/WeaponCharAssets/36px-Handcannon.webp",
    "Arts Unit":  "assets/WeaponCharAssets/36px-Arts_Unit.png"
  }
};

// ==========================================
// STAT TAG MAP
// Maps each Prydwen stat-tag filter to keywords found in stat1/stat2 strings
// ==========================================
const STAT_TAG_MAP = {
  "ATK":             s => /^Attack\s*\+\d+(?:\s*$|\s+\d)/.test(s) || s === "Attack",
  "ATK%":            s => /Attack\s*\+\d+(\.\d+)?%/.test(s),
  "HP":              s => /Max HP/.test(s),
  "Crit Rate":       s => /Critical Rate/.test(s),
  "Main Attribute":  s => /Main Attribute/.test(s),
  "Sec. Attribute":  s => /Sec\.?\s*Attribute/.test(s),
  "AGI":             s => /Agility/.test(s),
  "INT":             s => /Intellect/.test(s),
  "STR":             s => /Strength/.test(s),
  "WILL":            s => /Will(?!power)/.test(s),
  "Cryo DMG":        s => /Cryo DMG/.test(s),
  "Electric DMG":    s => /Electric DMG/.test(s),
  "Heat DMG":        s => /Heat DMG/.test(s),
  "Nature DMG":      s => /Nature DMG/.test(s),
  "Physical DMG":    s => /Physical DMG/.test(s),
  "Arts DMG":        s => /Arts DMG/.test(s),
  "Arts Intensity":  s => /Arts Intensity/.test(s),
  "Ultimate Gain":   s => /Ultimate Gain/.test(s),
};

// Helper: get all tag keys that match a weapon's stats
function getStatTags(w) {
  const combined = [w.stat1 || "", w.stat2 || ""].join(" ");
  return Object.entries(STAT_TAG_MAP)
    .filter(([, test]) => test(combined))
    .map(([tag]) => tag);
}

// ==========================================
// WEAPON DATA — fetched from Supabase
// ==========================================
let WEAPONS = [];

async function loadWeaponsFromDB() {
  const { data, error } = await db
    .from('weapons')
    .select('*')
    .order('rarity', { ascending: false })
    .order('name',   { ascending: true });
  if (error) { console.warn('Weapons load error:', error); return; }
  WEAPONS = (data || []).map(w => ({ ...w, _tags: getStatTags(w) }));
}

// ==========================================
// DOM REFS
// ==========================================
const grid        = document.getElementById('cardGrid');
const searchInput = document.getElementById('wpnSearch');
const filters     = { rarity: new Set(), type: new Set(), stat: new Set() };
let currentSort   = 'rarity';
let sortDir       = -1;          // -1 = desc, 1 = asc
let filterOwned      = false;
let filterLevelMin   = 1;
let filterLevelMax   = 90;
let filterLevelActive = false;

// ==========================================
// CARD BUILDER (portrait style)
// ==========================================
function createCard(w) {
  const stars      = Array(w.rarity).fill(`<img src="${STAR_IMAGE}" class="star-icon" alt="★">`).join('');
  const typeKey    = w.type.replace(/\s+/g, '-');
  const typeIconPath = WEAPON_ASSETS.types[w.type] || '';
  const atkDisplay = w.base_atk ?? '—';

  const imgTag = w.img
    ? `<img src="${w.img}" class="card-art" onerror="this.style.display='none'" alt="${w.name}">`
    : '';

  const stat2Row = w.stat2 && w.stat2 !== '—'
    ? `<div class="stat-row"><span class="stat-label">S2</span><span class="stat-val">${w.stat2}</span></div>`
    : '';

  const entry   = getWeaponEntry(w.id);
  const progressLevel = getProgressLevel(w.id);
  const isOwned = !!entry.owned || progressLevel !== null;
  const drawerVisible = isOwned ? ' open' : '';

  return `
    <div class="wpn-card-wrap${isOwned ? ' wpn-wrap-owned' : ''}"
         data-id="${w.id}"
         data-name="${w.name.toLowerCase()}"
         data-rarity="${w.rarity}"
         data-type="${w.type}"
         data-atk="${w.base_atk || 0}"
         data-tags="${w._tags.join('|')}"
         data-owned="${isOwned}"
         data-level="${progressLevel !== null ? progressLevel : ''}">

      <div class="wpn-card rarity-${w.rarity} bg-${typeKey}${isOwned ? ' card-owned' : ''}"
           onclick="cardNavigate(event, '${w.id}')">

        <div class="card-placeholder">${w.name.charAt(0)}</div>
        ${imgTag}
        <div class="card-vignette"></div>

        <div class="owned-badge${isOwned ? ' owned' : ''}"
             onclick="toggleOwned(event, '${w.id}')"
             title="${isOwned ? 'Owned — click to unmark' : 'Mark as owned'}">
          <span class="owned-check">✓</span>
        </div>

        <div class="card-type-badge badge-${typeKey}">
          ${typeIconPath ? `<img src="${typeIconPath}" class="badge-icon" alt="${w.type}">` : ''}
          ${w.type}
        </div>

        <div class="card-info">
          <div class="card-name">${w.name}</div>
          <div class="card-stats">
            <div class="stat-row atk-row">
              <span class="stat-label">ATK</span>
              <span class="stat-val">${atkDisplay}</span>
            </div>
            ${w.stat1 && w.stat1 !== '—' ? `<div class="stat-row"><span class="stat-label">S1</span><span class="stat-val">${w.stat1}</span></div>` : ''}
            ${stat2Row}
          </div>
          <div class="card-stars">${stars}</div>
        </div>

        <div class="passive-dropdown">
          <div class="passive-label">Passive</div>
          <div class="passive-text">${w.passive_lv9 || w.passive || 'No data available.'}</div>
        </div>

        ${(w.passive_lv9 || w.passive) ? `<button class="passive-btn" title="Toggle passive" aria-label="Toggle passive">▾</button>` : ''}
      </div>

      <div class="wpn-drawer${drawerVisible}">
        <div class="drawer-inner">
          <div class="drawer-field">
            <span class="drawer-lbl">Level</span>
            <span class="drawer-level-val">${progressLevel !== null ? progressLevel + ' / ' + (w.rarity >= 5 ? 90 : 80) : '—'}</span>
          </div>
        </div>
      </div>

    </div>
  `;
}

// ==========================================
// FILTER & SORT
// ==========================================
function updateFilters() {
  const query = searchInput.value.toLowerCase();
  let visible = 0;

  document.querySelectorAll('.wpn-card-wrap').forEach(wrap => {
    const tags = wrap.dataset.tags ? wrap.dataset.tags.split('|') : [];
    const matchesSearch  = wrap.dataset.name.includes(query);
    const matchesRarity  = filters.rarity.size === 0 || filters.rarity.has(wrap.dataset.rarity);
    const matchesType    = filters.type.size   === 0 || filters.type.has(wrap.dataset.type);
    const matchesStat    = filters.stat.size   === 0 || [...filters.stat].every(t => tags.includes(t));
    const matchesOwned   = !filterOwned || wrap.dataset.owned === 'true';

    let matchesLevel = true;
    if (filterLevelActive) {
      const lv = parseInt(wrap.dataset.level);
      matchesLevel = !isNaN(lv) && lv >= filterLevelMin && lv <= filterLevelMax;
    }

    const ok = matchesSearch && matchesRarity && matchesType && matchesStat && matchesOwned && matchesLevel;
    wrap.classList.toggle('hidden', !ok);
    if (ok) visible++;
  });

  document.getElementById('visNum').innerText = visible;

  const empty = grid.querySelector('.empty');
  if (visible === 0 && !empty) {
    grid.insertAdjacentHTML('beforeend', '<div class="empty">No weapons match the selected filters.</div>');
  } else if (visible > 0 && empty) {
    empty.remove();
  }
}

function applySort() {
  const wraps = Array.from(grid.querySelectorAll('.wpn-card-wrap'));
  const d = sortDir;

  wraps.sort((a, b) => {
    if (currentSort === 'rarity') {
      const diff = (parseInt(b.dataset.rarity) - parseInt(a.dataset.rarity)) * d;
      return diff !== 0 ? diff : a.dataset.name.localeCompare(b.dataset.name);
    }
    if (currentSort === 'name') return a.dataset.name.localeCompare(b.dataset.name) * d;
    if (currentSort === 'atk')  return (parseInt(b.dataset.atk) - parseInt(a.dataset.atk)) * d;
    if (currentSort === 'level') {
      const lA = parseInt(a.dataset.level) || 0;
      const lB = parseInt(b.dataset.level) || 0;
      if (lA !== lB) return (lB - lA) * d;
      return a.dataset.name.localeCompare(b.dataset.name);
    }
    return 0;
  });
  wraps.forEach(c => grid.appendChild(c));
}

// ==========================================
// INIT — auth → load roster → render
// ==========================================
async function init() {
  const { data: { session } } = await db.auth.getSession();
  CURRENT_USER = session?.user || null;

  await loadWeaponsFromDB();
  if (CURRENT_USER) await loadWeaponRoster();
  try { await loadWeaponProgress(); } catch(e) { console.warn("loadWeaponProgress error:", e); }

  grid.innerHTML = WEAPONS.map(createCard).join('');
  applySort();
  updateFilters();


  // Inject icons into type / rarity filter pills
  document.querySelectorAll('.filter-row .pill').forEach(pill => {
    const groupEl = pill.closest('[data-group]');
    if (!groupEl) return;
    const group = groupEl.dataset.group;
    const val   = pill.dataset.val;
    let iconPath = '';
    if (group === 'type')   iconPath = WEAPON_ASSETS.types[val];
    if (group === 'rarity') iconPath = STAR_IMAGE;
    if (iconPath) {
      pill.innerHTML = `<img src="${iconPath}" class="pill-icon" alt=""> ` + pill.innerHTML;
    }
  });

  if (!CURRENT_USER) {
    const notice = document.createElement('div');
    notice.className = 'roster-notice';
    notice.style.cssText = 'font-size:12px;color:var(--dim2);padding:6px 0 14px;text-align:center';
    notice.innerHTML = `<a href="auth.html" style="color:var(--gold2)">Sign in</a> to track your weapon collection across devices.`;
    document.querySelector('.results-row')?.prepend(notice);
  }
}

// ==========================================
// OWNED TOGGLE
// ==========================================
async function toggleOwned(event, id) {
  event.stopPropagation();
  if (!CURRENT_USER) { alert('Please log in to track your weapons.'); return; }

  const entry    = getWeaponEntry(id);
  const newOwned = !entry.owned;
  await upsertWeaponEntry(id, { owned: newOwned });

  const wrap   = document.querySelector(`.wpn-card-wrap[data-id="${id}"]`);
  if (!wrap) return;
  const card   = wrap.querySelector('.wpn-card');
  const drawer = wrap.querySelector('.wpn-drawer');
  const badge  = wrap.querySelector('.owned-badge');

  card.classList.toggle('card-owned', newOwned);
  wrap.classList.toggle('wpn-wrap-owned', newOwned);
  wrap.dataset.owned = newOwned;
  drawer.classList.toggle('open', newOwned);
  badge.classList.toggle('owned', newOwned);
  badge.title = newOwned ? 'Owned — click to unmark' : 'Mark as owned';

  if (filterOwned || filterLevelActive) updateFilters();
  if (currentSort === 'level') applySort();
}

// ==========================================
// NAVIGATE (card click — skip badge / drawer / passive)
// ==========================================
function cardNavigate(event, id) {
  if (event.target.closest('.owned-badge')) return;
  if (event.target.closest('.passive-btn')) return;
  if (event.target.closest('.passive-dropdown')) return;
  window.location.href = `WeaponIntroduction.html?weapon=${id}`;
}

// ==========================================
// CARD CLICK DELEGATION (passive toggle)
// ==========================================
grid.addEventListener('click', e => {
  const btn = e.target.closest('.passive-btn');
  if (btn) {
    e.stopPropagation();
    const card   = btn.closest('.wpn-card');
    const isOpen = card.classList.contains('passive-open');
    document.querySelectorAll('.wpn-card.passive-open').forEach(c => c.classList.remove('passive-open'));
    if (!isOpen) card.classList.add('passive-open');
    return;
  }
  if (e.target.closest('.passive-dropdown')) return;
  if (e.target.closest('.owned-badge')) return;
  if (e.target.closest('.wpn-drawer')) return;
});

// Close passive on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.wpn-card')) {
    document.querySelectorAll('.wpn-card.passive-open').forEach(c => c.classList.remove('passive-open'));
  }
});

// ==========================================
// SEARCH
// ==========================================
searchInput.addEventListener('input', updateFilters);

// ==========================================
// FILTER PILLS (delegated — handles owned pill too)
// ==========================================
document.addEventListener('click', e => {
  const pill = e.target.closest('.filter-row .pill');
  if (!pill) return;

  // Owned pill
  if (pill.id === 'pill-owned') {
    filterOwned = !filterOwned;
    pill.classList.toggle('active', filterOwned);
    updateFilters();
    return;
  }

  // Stat tag pills
  if (pill.classList.contains('stat-tag')) {
    const val = pill.dataset.val;
    if (filters.stat.has(val)) { filters.stat.delete(val); pill.classList.remove('active'); }
    else                       { filters.stat.add(val);    pill.classList.add('active'); }
    updateFilters();
    return;
  }

  // Standard group pills (rarity, type)
  const groupEl = pill.closest('[data-group]');
  if (!groupEl) return;
  const group = groupEl.dataset.group;
  const val   = pill.dataset.val;
  if (filters[group].has(val)) { filters[group].delete(val); pill.classList.remove('active'); }
  else                         { filters[group].add(val);    pill.classList.add('active'); }
  updateFilters();
});

// ==========================================
// LEVEL RANGE SLIDERS
// ==========================================
document.addEventListener('input', e => {
  if (e.target.id === 'filter-lv-min' || e.target.id === 'filter-lv-max') {
    const minEl  = document.getElementById('filter-lv-min');
    const maxEl  = document.getElementById('filter-lv-max');
    const minOut = document.getElementById('filter-lv-min-out');
    const maxOut = document.getElementById('filter-lv-max-out');
    filterLevelMin = parseInt(minEl.value);
    filterLevelMax = parseInt(maxEl.value);
    if (filterLevelMin > filterLevelMax) {
      if (e.target.id === 'filter-lv-min') { filterLevelMin = filterLevelMax; minEl.value = filterLevelMin; }
      else                                 { filterLevelMax = filterLevelMin; maxEl.value = filterLevelMax; }
    }
    minOut.textContent = filterLevelMin;
    maxOut.textContent = filterLevelMax;
    filterLevelActive = !(filterLevelMin === 1 && filterLevelMax === 90);
    updateFilters();
  }
});

// ==========================================
// CLEAR
// ==========================================
document.getElementById('clearBtn').addEventListener('click', () => {
  searchInput.value = '';
  filters.rarity.clear(); filters.type.clear(); filters.stat.clear();
  filterOwned = false;
  filterLevelActive = false; filterLevelMin = 1; filterLevelMax = 90;
  document.querySelectorAll('.filter-row .pill').forEach(b => b.classList.remove('active'));
  const minEl = document.getElementById('filter-lv-min');
  const maxEl = document.getElementById('filter-lv-max');
  if (minEl) { minEl.value = 1;  document.getElementById('filter-lv-min-out').textContent = '1'; }
  if (maxEl) { maxEl.value = 90; document.getElementById('filter-lv-max-out').textContent = '90'; }
  updateFilters();
});

// ==========================================
// SORT BUTTONS — with direction toggle + arrow
// ==========================================
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (currentSort === btn.dataset.sort) {
      sortDir *= -1;
    } else {
      document.querySelectorAll('.sort-btn').forEach(b => {
        b.classList.remove('active');
        b.querySelector('.sort-arrow')?.remove();
      });
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      sortDir = -1;
    }
    const existing = btn.querySelector('.sort-arrow');
    if (existing) existing.remove();
    const arrow = document.createElement('span');
    arrow.className = 'sort-arrow';
    arrow.textContent = sortDir === -1 ? ' ↓' : ' ↑';
    btn.appendChild(arrow);
    applySort();
  });
});

// ==========================================
// STICKY FILTER SCROLL
// ==========================================
const filterZone      = document.getElementById('filterZone');
const filterToggleBtn = document.getElementById('filterToggleBtn');

window.addEventListener('scroll', () => {
  if (window.scrollY > 150) {
    filterZone.classList.add('scrolled');
  } else if (window.scrollY < 80) {
    filterZone.classList.remove('scrolled');
    filterZone.classList.remove('dropdown-open');
  }
});

filterToggleBtn.addEventListener('click', () => {
  filterZone.classList.toggle('dropdown-open');
});

// ==========================================
// GUIDED TOUR
// ==========================================
const TOUR_STEPS = [
  {
    targetId: 'wpnSearch',
    title: 'Search Weapons',
    desc: 'Type any weapon name here to instantly filter the grid. Results update as you type — no need to hit Enter.',
    cardPos: 'below-right',
    pad: 8,
  },
  {
    targetId: 'filterZone',
    title: 'Filters & Sorting',
    desc: 'Click <b>Filters</b> to open the full filter panel. You can narrow results by <b>Rarity</b>, <b>Type</b>, and individual <b>Stat tags</b>. The <b>Owned Only</b> toggle shows just the weapons you\'ve marked. Use the <b>Sort By</b> buttons to order by Rarity, Name, Base ATK, or Level.',
    cardPos: 'below-right',
    pad: 8,
  },
  {
    targetId: 'filterRow',
    title: 'Filter Pills',
    desc: 'Select one or more pills to combine filters — e.g. pick <b>6 ★</b> + <b>Sword</b> to see only 6-star swords. The <b>Stat</b> row lets you filter by secondary stats like <b>ATK%</b>, <b>Crit Rate</b>, or damage types. Hit <b>✕ Reset Filters</b> to clear everything.',
    cardPos: 'below-right',
    pad: 8,
    preOpen: true,
  },
  {
    targetId: 'cardGrid',
    title: 'Weapon Cards',
    desc: 'Each card shows the weapon\'s <b>art</b>, <b>type</b>, <b>rarity</b>, <b>Base ATK</b>, and <b>sub-stats</b>. Click the <b>▾ button</b> at the bottom-right of a card to preview its <b>Passive</b> inline. <b>Click anywhere else</b> on the card to open the full detail page.',
    cardPos: 'above-left',
    pad: 12,
  },
  {
    targetId: 'cardGrid',
    title: 'Owned Badge',
    desc: 'The <b>circle in the top-left</b> of each card is the owned toggle. Click it to mark a weapon as owned — it turns green and the card gains a green highlight. Use the <b>Owned Only</b> filter to show only your collection.',
    cardPos: 'above-left',
    pad: 12,
  },
  {
    targetId: 'helpBtn',
    title: 'That\'s Everything!',
    desc: 'You\'re all set. Click any card to open the full <b>Weapon Introduction</b> page where you can track level, skill levels, notes, and tags. Click the <b>?</b> button here any time to replay this tour.',
    cardPos: 'below-left',
    pad: 10,
  },
];

let tourStepIdx = 0;
let tourActive  = false;
let _tourFilterWasOpen = false;

function startTour() {
  tourActive  = true;
  tourStepIdx = 0;
  document.getElementById('tourOverlay').classList.add('active');
  renderTourStep(tourStepIdx);
}

function endTour() {
  tourActive = false;
  document.getElementById('tourOverlay').classList.remove('active');
  // close filter dropdown if we opened it
  if (_tourFilterWasOpen) {
    filterZone.classList.remove('dropdown-open');
    _tourFilterWasOpen = false;
  }
}

function tourStep(delta) {
  const next = tourStepIdx + delta;
  // Close filter if leaving step that opened it
  if (tourStepIdx === 2 && delta > 0 && _tourFilterWasOpen) {
    filterZone.classList.remove('dropdown-open');
    _tourFilterWasOpen = false;
  }
  tourStepIdx = Math.max(0, Math.min(TOUR_STEPS.length - 1, next));
  renderTourStep(tourStepIdx);
}

function renderTourStep(idx) {
  const step  = TOUR_STEPS[idx];
  const total = TOUR_STEPS.length;

  // pre-open filter dropdown for step index 2 (filter pills step)
  if (step.preOpen) {
    if (!filterZone.classList.contains('dropdown-open')) {
      filterZone.classList.add('dropdown-open');
      _tourFilterWasOpen = true;
    }
  }

  // dots
  let dots = '';
  for (let i = 0; i < total; i++) dots += `<div class="tour-dot${i===idx?' active':''}"></div>`;
  document.getElementById('tourDots').innerHTML    = dots;
  document.getElementById('tourStepNum').textContent = `Step ${idx+1} of ${total}`;
  document.getElementById('tourTitle').textContent  = step.title;
  document.getElementById('tourDesc').innerHTML     = step.desc;

  const prev = document.getElementById('tourPrev');
  const next = document.getElementById('tourNext');
  prev.style.display = idx === 0 ? 'none' : '';
  next.textContent   = idx === total - 1 ? 'Finish ✓' : 'Next →';
  next.onclick       = idx === total - 1 ? endTour : () => tourStep(1);

  // Use a small delay so dropdown animation finishes before measuring
  setTimeout(() => positionTourStep(step), step.preOpen ? 60 : 0);
}

function positionTourStep(step) {
  const target = document.getElementById(step.targetId);
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const pad  = step.pad || 8;
  const sp   = document.getElementById('tourSpotlight');
  sp.style.top    = (rect.top    - pad) + 'px';
  sp.style.left   = (rect.left   - pad) + 'px';
  sp.style.width  = (rect.width  + pad*2) + 'px';
  sp.style.height = (rect.height + pad*2) + 'px';

  const card = document.getElementById('tourCard');
  const vw   = window.innerWidth;
  const vh   = window.innerHeight;
  const isMobile = vw <= 600;
  const cardW    = isMobile ? vw - 24 : 300;
  const cardH    = 220;

  if (isMobile) {
    card.style.left   = '12px';
    card.style.right  = '12px';
    card.style.width  = '';
    card.style.bottom = '16px';
    card.style.top    = 'auto';
    return;
  }

  card.style.bottom = '';
  card.style.right  = '';
  card.style.width  = '';

  let cx, cy;
  const pos = step.cardPos || 'below-right';
  if (pos === 'below-right') {
    cx = rect.left;
    cy = rect.bottom + pad + 12;
  } else if (pos === 'below-left') {
    cx = Math.min(rect.right - cardW, vw - cardW - 16);
    cy = rect.bottom + pad + 12;
  } else if (pos === 'above-left') {
    cx = Math.min(rect.right - cardW, vw - cardW - 16);
    cy = rect.top - cardH - pad - 12;
  } else if (pos === 'right') {
    cx = rect.right + pad + 16;
    cy = rect.top + rect.height / 2 - cardH / 2;
  } else if (pos === 'left') {
    cx = rect.left - cardW - pad - 16;
    cy = rect.top + rect.height / 2 - cardH / 2;
  }

  cx = Math.max(12, Math.min(vw - cardW - 12, cx));
  cy = Math.max(12, Math.min(vh - cardH - 12, cy));

  card.style.left = cx + 'px';
  card.style.top  = cy + 'px';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && tourActive) endTour();
});
window.addEventListener('resize', () => {
  if (tourActive) renderTourStep(tourStepIdx);
});

init();