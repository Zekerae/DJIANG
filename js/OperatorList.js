// ==========================================
// SUPABASE — same project as auth.html
// ==========================================
const SUPABASE_URL      = 'https://vjcucliqjjljhgbqshmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3VjbGlxampsamhnYnFzaG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTU3MTIsImV4cCI6MjA5NDA3MTcxMn0.qq7tRmLpRjTv0y4dZxCjcEQ48rTiY5ZV1xunr32kh10';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authenticated user — set in init()
let CURRENT_USER = null;
// Roster cache: { [character_id]: { owned, level, skill_level } }
let ROSTER = {};

// ==========================================
// ASSET DICTIONARY
// Replace these URLs with your local image paths (e.g., "icons/heat.png")
// ==========================================
const STAR_IMAGE = "assets/RarityAssets/StarIcon.png"; // <-- Put your star image file name here!

const ASSETS = {
  elements: {
    "Heat": "assets/ElementAssets/Heaticon.png",
    "Cryo": "assets/ElementAssets/Cryoicon.png",
    "Electric": "assets/ElementAssets/Electricicon.png",
    "Physical": "assets/ElementAssets/Physicalicon.png",
    "Nature": "assets/ElementAssets/Natureicon.png"
  },
  classes: {
    "Striker": "assets/ClassAssets/StrikerIcon.png",
    "Guard": "assets/ClassAssets/GuardIcon.png",
    "Vanguard": "assets/ClassAssets/VanguardIcon.png",
    "Caster": "assets/ClassAssets/CasterIcon.png",
    "Defender": "assets/ClassAssets/DefenderIcon.png",
    "Supporter": "assets/ClassAssets/SupporterIcon.png"
  },
  weapons: {
    "Sword": "assets/WeaponCharAssets/Short-Weapon.webp",
    "Great Sword": "assets/WeaponCharAssets/36px-Great_Sword.webp",
    "Polearm": "assets/WeaponCharAssets/36px-Polearm.webp",
    "Hand Cannon": "assets/WeaponCharAssets/36px-Handcannon.webp",
    "Arts Unit": "assets/WeaponCharAssets/36px-Arts_Unit.png"
  }
};

// ==========================================
// OPERATOR DATA
// ==========================================
const OPS = [
  {id:"endministrator",name:"Endministrator",rarity:6,cls:"Guard",    element:"Physical",weapon:"Sword",      img:"assets/CharacterAssets/6-stars/Endministrator/Endministrator_splash_art.png"}, 
  {id:"ardelia",       name:"Ardelia",       rarity:6,cls:"Supporter",element:"Nature",  weapon:"Arts Unit",  img:"assets/CharacterAssets/6-stars/Ardelia/Ardelia_Splash_Art.png"},
  {id:"laevatain",     name:"Laevatain",     rarity:6,cls:"Striker",  element:"Heat",    weapon:"Sword",      img:"assets/CharacterAssets/6-stars/Laevatain/Laevatain_Splash_Art.png"},
  {id:"last-rite",     name:"Last Rite",     rarity:6,cls:"Striker",  element:"Cryo",    weapon:"Great Sword",img:"assets/CharacterAssets/6-stars/Last_Rite/Last_Rite_Splash_Art.png"},
  {id:"yvonne",        name:"Yvonne",        rarity:6,cls:"Striker",  element:"Cryo",    weapon:"Hand Cannon",img:"assets/CharacterAssets/6-stars/Yvonne/Yvonne_Splash_Art.png"},
  {id:"gilberta",      name:"Gilberta",      rarity:6,cls:"Supporter",element:"Nature",  weapon:"Arts Unit",  img:"assets/CharacterAssets/6-stars/Gilberta/Gilberta_Splash_Art.png"},
  {id:"lifeng",        name:"Lifeng",        rarity:6,cls:"Guard",    element:"Physical",weapon:"Polearm",    img:"assets/CharacterAssets/6-stars/Lifeng/Lifeng_Splash_Art.png"},
  {id:"ember",         name:"Ember",         rarity:6,cls:"Defender", element:"Heat",    weapon:"Great Sword",img:"assets/CharacterAssets/6-stars/Ember/Ember_Splash_Art.png"},
  {id:"tangtang",      name:"Tangtang",      rarity:6,cls:"Caster",   element:"Cryo",    weapon:"Hand Cannon",img:"assets/CharacterAssets/6-stars/Tangtang/Tangtang_Splash_Art.png"},
  {id:"rossi",         name:"Rossi",         rarity:6,cls:"Guard",    element:"Physical",weapon:"Sword",      img:"assets/CharacterAssets/6-stars/Rossi/Rossi_Splash_Art.png"},
  {id:"pogranichnik",  name:"Pogranichnik",  rarity:6,cls:"Vanguard", element:"Physical",weapon:"Sword",      img:"assets/CharacterAssets/6-stars/Pogranichnik/Pogranichnik_Splash_Art.png"},
  {id:"zhuang-fangyi", name:"Zhuang Fangyi", rarity:6,cls:"Striker",  element:"Electric",weapon:"Arts Unit",  img:"assets/CharacterAssets/6-stars/Zhuang_Fangyi/Zhuang_Fangyi_Splash_Art.png"},
  {id:"xaihi",         name:"Xaihi",         rarity:5,cls:"Supporter",element:"Cryo",    weapon:"Arts Unit",  img:"assets/CharacterAssets/5-stars/Xiahi/Xaihi_Splash_Art.png"},
  {id:"avywenna",      name:"Avywenna",      rarity:5,cls:"Striker",  element:"Electric",weapon:"Polearm",    img:"assets/CharacterAssets/5-stars/Avywenna/Avywenna_Splash_Art.png"},
  {id:"perlica",       name:"Perlica",       rarity:5,cls:"Caster",   element:"Electric",weapon:"Arts Unit",  img:"assets/CharacterAssets/5-stars/Perlica/Perlica_Splash_Art.png"},
  {id:"wulfgard",      name:"Wulfgard",      rarity:5,cls:"Caster",   element:"Heat",    weapon:"Hand Cannon",img:"assets/CharacterAssets/5-stars/Wulfgard/Wulfgard_Splash_Art.png"},
  {id:"alesh",         name:"Alesh",         rarity:5,cls:"Vanguard", element:"Cryo",    weapon:"Sword",      img:"assets/CharacterAssets/5-stars/Alesh/Alesh_Splash_Art.png"},
  {id:"arclight",      name:"Arclight",      rarity:5,cls:"Vanguard", element:"Electric",weapon:"Sword",      img:"assets/CharacterAssets/5-stars/Arclight/Arclight_Splash_Art.png"},
  {id:"chen-qianyu",   name:"Chen Qianyu",   rarity:5,cls:"Guard",    element:"Physical",weapon:"Sword",      img:"assets/CharacterAssets/5-stars/Chen_Qianyu/Chen_Qianyu_Splash_Art.png"},
  {id:"da-pan",        name:"Da Pan",        rarity:5,cls:"Striker",  element:"Physical",weapon:"Great Sword",img:"assets/CharacterAssets/5-stars/Da_Pan/Da_Pan_Splash_Art.png"},
  {id:"snowshine",     name:"Snowshine",     rarity:5,cls:"Defender", element:"Cryo",    weapon:"Great Sword",img:"assets/CharacterAssets/5-stars/Snowshine/Snowshine_Splash_Art.png"},
  {id:"antal",         name:"Antal",         rarity:4,cls:"Supporter",element:"Electric",weapon:"Arts Unit",  img:"assets/CharacterAssets/4-stars/Antal/Antal_Splash_Art.png"},
  {id:"fluorite",      name:"Fluorite",      rarity:4,cls:"Caster",   element:"Nature",  weapon:"Hand Cannon",img:"assets/CharacterAssets/4-stars/Fluorite/Fluorite_Splash_Art.png"},
  {id:"akekuri",       name:"Akekuri",       rarity:4,cls:"Vanguard", element:"Heat",    weapon:"Sword",      img:"assets/CharacterAssets/4-stars/Akekuri/Akekuri_Splash_Art.png"},
  {id:"estella",       name:"Estella",       rarity:4,cls:"Guard",    element:"Cryo",    weapon:"Polearm",    img:"assets/CharacterAssets/4-stars/Estella/Estella_Splash_Art.png"},
  {id:"catcher",       name:"Catcher",       rarity:4,cls:"Defender",   element:"Physical",weapon:"Great Sword",img:"assets/CharacterAssets/4-stars/Catcher/Catcher_Splash_Art.png"}
];

const grid = document.getElementById('cardGrid');
const searchInput = document.getElementById('opSearch');
const filters = { rarity: new Set(), class: new Set(), element: new Set(), weapon: new Set() };
let currentSort = 'rarity';
let sortDir = -1; // -1 = descending, 1 = ascending
let filterOwned = false;       // true = show only owned
let filterLevelMin = 1;        // level range min
let filterLevelMax = 90;       // level range max
let filterLevelActive = false; // only apply level filter when user has changed range

// ==========================================
// ROSTER — Supabase read/write
// ==========================================

async function loadRoster() {
  if (!CURRENT_USER) return;
  const { data, error } = await db
    .from('user_roster')
    .select('character_id, owned, level, skill_levels')
    .eq('user_id', CURRENT_USER.id);
  if (error) { console.warn('Roster load error:', error); return; }
  ROSTER = {};
  (data || []).forEach(row => { ROSTER[row.character_id] = row; });
}

async function upsertRosterEntry(characterId, patch) {
  if (!CURRENT_USER) return;
  const existing = ROSTER[characterId] || { owned: false, level: null, skill_levels: {} };
  const updated  = { ...existing, ...patch };
  ROSTER[characterId] = updated;

  const { error } = await db.from('user_roster').upsert({
    user_id:       CURRENT_USER.id,
    character_id:  characterId,
    owned:         updated.owned,
    level:         updated.level ? parseInt(updated.level) : null,
    skill_levels:  updated.skill_levels || {},
    updated_at:    new Date().toISOString(),
  }, { onConflict: 'user_id,character_id' });

  if (error) console.warn('Roster save error:', error);
}

function getRosterEntry(id) {
  return ROSTER[id] || { owned: false, level: null, skill_levels: {} };
}

// ==========================================
// CARD BUILDER
// ==========================================

function createCard(op) {
  const stars = Array(op.rarity).fill(`<img src="${STAR_IMAGE}" class="star-icon" alt="★">`).join('');
  
  const imgTag = op.img 
    ? `<img src="${op.img}" class="card-art" onerror="this.style.display='none'">` 
    : `<div class="card-art"></div>`;

  const elemIconPath   = ASSETS.elements[op.element] || '';
  const classIconPath  = ASSETS.classes[op.cls] || '';
  const weaponIconPath = ASSETS.weapons[op.weapon] || '';

  const entry   = getRosterEntry(op.id);
  const isOwned = !!entry.owned;

  const sk = entry.skill_levels || {};
  const drawerVisible = isOwned ? ' open' : '';

  return `
    <div class="card-wrap${isOwned ? ' card-wrap-owned' : ''}"
         data-id="${op.id}"
         data-name="${op.name.toLowerCase()}"
         data-rarity="${op.rarity}"
         data-class="${op.cls}"
         data-element="${op.element}"
         data-weapon="${op.weapon}"
         data-owned="${isOwned}"
         data-level="${entry.level || ''}">

      <!-- THE CARD (navigate on click) -->
      <div class="op-card rarity-${op.rarity} bg-${op.element}${isOwned ? ' card-owned' : ''}"
           onclick="cardNavigate(event, '${op.id}')">

        <div class="card-placeholder">${op.name.charAt(0)}</div>
        ${imgTag}
        <div class="card-vignette"></div>

        <div class="owned-badge${isOwned ? ' owned' : ''}"
             onclick="toggleOwned(event, '${op.id}')"
             title="${isOwned ? 'Owned — click to unmark' : 'Mark as owned'}">
          <span class="owned-check">✓</span>
        </div>

        <div class="card-elem elem-${op.element}">
          ${elemIconPath ? `<img src="${elemIconPath}" class="elem-icon">` : ''}
          ${op.element.substring(0,3).toUpperCase()}
        </div>

        <div class="card-info">
          <div class="card-name">${op.name}</div>
          <div class="card-meta-icons">
            <div class="icon-box">
              ${classIconPath ? `<img src="${classIconPath}">` : ''}
              <span>${op.cls}</span>
            </div>
            <div class="icon-box">
              ${weaponIconPath ? `<img src="${weaponIconPath}">` : ''}
              <span>${op.weapon}</span>
            </div>
          </div>
          <div class="card-stars">${stars}</div>
        </div>
      </div>

      <!-- DRAWER — expands below the card when owned -->
      <div class="card-drawer${drawerVisible}">
        <div class="drawer-inner">
          <div class="drawer-row">
            <label class="drawer-field">
              <span class="drawer-lbl">Level</span>
              <input class="drawer-input" type="number" min="1" max="90" placeholder="—"
                value="${entry.level || ''}"
                oninput="saveTrackerField(event, '${op.id}', 'level')">
            </label>
          </div>
          <div class="drawer-divider"></div>
          <div class="drawer-skills">
            ${[
              ['basic_attack',   'Basic Attack'],
              ['battle_skill',   'Battle Skill'],
              ['combo_skill',    'Combo Skill'],
              ['ultimate_skill', 'Ultimate']
            ].map(([key, label]) => `
              <label class="drawer-field">
                <span class="drawer-lbl">${label}</span>
                <input class="drawer-input" type="number" min="1" max="12" placeholder="—"
                  value="${sk[key] || ''}"
                  oninput="saveSkillLevel(event, '${op.id}', '${key}')">
              </label>
            `).join('')}
          </div>
        </div>
      </div>

    </div>
  `;
}

function cardNavigate(event, id) {
  if (event.target.closest('.owned-badge')) return;
  window.location.href = `CharacterIntroduction.html?char=${id}`;
}

async function toggleOwned(event, id) {
  event.stopPropagation();
  if (!CURRENT_USER) { alert('Please log in to track your roster.'); return; }

  const entry    = getRosterEntry(id);
  const newOwned = !entry.owned;
  await upsertRosterEntry(id, { owned: newOwned });

  const wrap  = document.querySelector(`.card-wrap[data-id="${id}"]`);
  if (!wrap) return;
  const card   = wrap.querySelector('.op-card');
  const drawer = wrap.querySelector('.card-drawer');
  card.classList.toggle('card-owned', newOwned);
  wrap.classList.toggle('card-wrap-owned', newOwned);
  wrap.dataset.owned = newOwned;
  drawer.classList.toggle('open', newOwned);
  const badge = wrap.querySelector('.owned-badge');
  badge.classList.toggle('owned', newOwned);
  badge.title = newOwned ? 'Owned — click to unmark' : 'Mark as owned';
}

// Debounce map to avoid hammering Supabase on every keystroke
const _debounceTimers = {};
function saveTrackerField(event, id, field) {
  if (!CURRENT_USER) return;
  const val = event.target.value;
  if (field === 'level') {
    const card = document.querySelector(`.card-wrap[data-id="${id}"]`);
    if (card) card.dataset.level = val;
    if (currentSort === 'level') applySort();
  }
  clearTimeout(_debounceTimers[id + field]);
  _debounceTimers[id + field] = setTimeout(() => {
    upsertRosterEntry(id, { [field]: val });
  }, 600);
}

// Saves one key inside the skill_levels JSON object
function saveSkillLevel(event, id, key) {
  if (!CURRENT_USER) return;
  const val     = parseInt(event.target.value) || null;
  const entry   = getRosterEntry(id);
  const updated = { ...(entry.skill_levels || {}), [key]: val };
  ROSTER[id]    = { ...entry, skill_levels: updated };
  clearTimeout(_debounceTimers[id + key]);
  _debounceTimers[id + key] = setTimeout(() => {
    upsertRosterEntry(id, { skill_levels: updated });
  }, 600);
}

function updateFilters() {
  const query = searchInput.value.toLowerCase();
  let visibleCount = 0;
  
  document.querySelectorAll('.card-wrap').forEach(card => {
    const matchesSearch  = card.dataset.name.includes(query);
    const matchesRarity  = filters.rarity.size === 0 || filters.rarity.has(card.dataset.rarity);
    const matchesClass   = filters.class.size === 0 || filters.class.has(card.dataset.class);
    const matchesElement = filters.element.size === 0 || filters.element.has(card.dataset.element);
    const matchesWeapon  = filters.weapon.size === 0 || filters.weapon.has(card.dataset.weapon);
    const matchesOwned   = !filterOwned || card.dataset.owned === 'true';

    let matchesLevel = true;
    if (filterLevelActive) {
      const lv = parseInt(card.dataset.level);
      matchesLevel = !isNaN(lv) && lv >= filterLevelMin && lv <= filterLevelMax;
    }

    if (matchesSearch && matchesRarity && matchesClass && matchesElement && matchesWeapon && matchesOwned && matchesLevel) {
      card.classList.remove('hidden');
      visibleCount++;
    } else {
      card.classList.add('hidden');
    }
  });
  
  document.getElementById('visNum').innerText = visibleCount;
  
  const existingEmpty = grid.querySelector('.empty');
  if (visibleCount === 0) {
    if (!existingEmpty) grid.insertAdjacentHTML('beforeend', '<div class="empty">No operators match the selected filters.</div>');
  } else if (existingEmpty) {
    existingEmpty.remove();
  }
}

function applySort() {
  const cards = Array.from(grid.children);
  const opCards = cards.filter(card => card.classList.contains('card-wrap'));
  const d = sortDir; // 1 = asc, -1 = desc

  opCards.sort((a, b) => {
    if (currentSort === 'rarity') {
      const rA = parseInt(a.dataset.rarity);
      const rB = parseInt(b.dataset.rarity);
      if (rA !== rB) return (rB - rA) * d;
      return a.dataset.name.localeCompare(b.dataset.name);
    } else if (currentSort === 'name') {
      return a.dataset.name.localeCompare(b.dataset.name) * d;
    } else if (currentSort === 'level') {
      const lA = parseInt(a.dataset.level) || 0;
      const lB = parseInt(b.dataset.level) || 0;
      if (lA !== lB) return (lB - lA) * d;
      return a.dataset.name.localeCompare(b.dataset.name);
    }
  });

  opCards.forEach(card => grid.appendChild(card));
}

// ==========================================
// FILTER & SORT LISTENERS (wired before init so they're ready)
// ==========================================

searchInput.addEventListener('input', updateFilters);

document.querySelectorAll('.filter-row .pill:not(#pill-owned)').forEach(btn => {
  btn.addEventListener('click', () => {
    const groupElement = btn.closest('[data-group]');
    if (!groupElement) return;
    const group = groupElement.dataset.group;
    const val   = btn.dataset.val;
    if (filters[group].has(val)) { filters[group].delete(val); btn.classList.remove('active'); }
    else                         { filters[group].add(val);    btn.classList.add('active'); }
    updateFilters();
  });
});

document.getElementById('pill-owned').addEventListener('click', () => {
  filterOwned = !filterOwned;
  document.getElementById('pill-owned').classList.toggle('active', filterOwned);
  updateFilters();
});

document.getElementById('clearBtn').addEventListener('click', () => {
  searchInput.value = '';
  filters.rarity.clear(); filters.class.clear(); filters.element.clear(); filters.weapon.clear();
  document.querySelectorAll('.filter-row .pill').forEach(b => b.classList.remove('active'));
  // Reset owned + level filters
  filterOwned = false;
  filterLevelActive = false;
  filterLevelMin = 1;
  filterLevelMax = 90;
  const ownedBtn = document.getElementById('pill-owned');
  if (ownedBtn) ownedBtn.classList.remove('active');
  const minEl = document.getElementById('filter-lv-min');
  const maxEl = document.getElementById('filter-lv-max');
  const minOut = document.getElementById('filter-lv-min-out');
  const maxOut = document.getElementById('filter-lv-max-out');
  if (minEl) { minEl.value = 1; minOut.textContent = '1'; }
  if (maxEl) { maxEl.value = 90; maxOut.textContent = '90'; }
  updateFilters();
});

// Level range sliders (delegated — elements added after init)
document.addEventListener('input', e => {
  if (e.target.id === 'filter-lv-min' || e.target.id === 'filter-lv-max') {
    const minEl  = document.getElementById('filter-lv-min');
    const maxEl  = document.getElementById('filter-lv-max');
    const minOut = document.getElementById('filter-lv-min-out');
    const maxOut = document.getElementById('filter-lv-max-out');
    filterLevelMin = parseInt(minEl.value);
    filterLevelMax = parseInt(maxEl.value);
    // Clamp so min <= max
    if (filterLevelMin > filterLevelMax) {
      if (e.target.id === 'filter-lv-min') { filterLevelMin = filterLevelMax; minEl.value = filterLevelMin; }
      else { filterLevelMax = filterLevelMin; maxEl.value = filterLevelMax; }
    }
    minOut.textContent = filterLevelMin;
    maxOut.textContent = filterLevelMax;
    filterLevelActive = !(filterLevelMin === 1 && filterLevelMax === 90);
    updateFilters();
  }
});

document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (currentSort === btn.dataset.sort) {
      // Same button — flip direction
      sortDir *= -1;
    } else {
      // New button — switch sort, reset to descending
      document.querySelectorAll('.sort-btn').forEach(b => {
        b.classList.remove('active');
        b.querySelector('.sort-arrow')?.remove();
      });
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      sortDir = -1;
    }
    // Update arrow indicator on active button
    const existing = btn.querySelector('.sort-arrow');
    if (existing) existing.remove();
    const arrow = document.createElement('span');
    arrow.className = 'sort-arrow';
    arrow.textContent = sortDir === -1 ? ' ↓' : ' ↑';
    btn.appendChild(arrow);
    applySort();
  });
});

const filterZone      = document.getElementById('filterZone');
const filterToggleBtn = document.getElementById('filterToggleBtn');

window.addEventListener('scroll', () => {
  if (window.scrollY > 150) filterZone.classList.add('scrolled');
  else if (window.scrollY < 80) { filterZone.classList.remove('scrolled'); filterZone.classList.remove('dropdown-open'); }
});
filterToggleBtn.addEventListener('click', () => filterZone.classList.toggle('dropdown-open'));

// ==========================================
// INIT — auth → load roster → render cards
// ==========================================

async function init() {
  // 1. Get current Supabase session
  const { data: { session } } = await db.auth.getSession();
  CURRENT_USER = session?.user || null;

  // 2. Fetch this user's roster rows so cards render with correct state
  if (CURRENT_USER) await loadRoster();

  // 3. Render cards (ROSTER is now populated)
  grid.innerHTML = OPS.map(createCard).join('');
  applySort();

  // 4. Inject icons into filter pills
  document.querySelectorAll('.pill').forEach(pill => {
    const groupElement = pill.closest('[data-group]');
    if (!groupElement) return;
    const group = groupElement.dataset.group;
    const val   = pill.dataset.val;
    let iconPath = '';
    if (group === 'element') iconPath = ASSETS.elements[val];
    if (group === 'class')   iconPath = ASSETS.classes[val];
    if (group === 'weapon')  iconPath = ASSETS.weapons[val];
    if (group === 'rarity')  iconPath = STAR_IMAGE;
    if (iconPath) pill.innerHTML = `<img src="${iconPath}" class="pill-icon" alt=""> ` + pill.innerHTML;
  });

  // 5. Nudge guests to log in
  if (!CURRENT_USER) {
    const notice = document.createElement('div');
    notice.className = 'roster-notice';
    notice.innerHTML = `<a href="auth.html">Sign in</a> to track your roster across devices.`;
    document.querySelector('.results-row')?.prepend(notice);
  }
}

init();