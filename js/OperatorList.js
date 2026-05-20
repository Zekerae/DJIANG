/*
  OperatorList.js
  Handles all logic for the Operator Database page:
    - Supabase auth + roster persistence
    - Card rendering and drawer (level/skill tracker)
    - Filter, search, sort system
    - Guided tour overlay (same pattern as WeaponIntroduction)
*/

/* ─────────────────────────────────────────────
   SUPABASE CLIENT
   Creates a single shared client using the project
   URL and public anon key. All DB calls go through `db`.
───────────────────────────────────────────── */
const SUPABASE_URL      = 'https://vjcucliqjjljhgbqshmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3VjbGlxampsamhnYnFzaG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTU3MTIsImV4cCI6MjA5NDA3MTcxMn0.qq7tRmLpRjTv0y4dZxCjcEQ48rTiY5ZV1xunr32kh10';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ─────────────────────────────────────────────
   GLOBAL STATE
   CURRENT_USER  — populated in init() from Supabase session.
                   null means the visitor is a guest.
   ROSTER        — in-memory cache of the logged-in user's
                   user_roster rows, keyed by character_id.
                   Shape: { [id]: { owned, level, skill_levels } }
───────────────────────────────────────────── */
let CURRENT_USER = null;
let ROSTER       = {};

/* ─────────────────────────────────────────────
   ASSET PATHS
   All icon paths live here so changing a file
   location only requires editing one place.
───────────────────────────────────────────── */
const STAR_IMAGE = "assets/RarityAssets/StarIcon.png";

const ASSETS = {
  elements: {
    "Heat":     "assets/ElementAssets/Heaticon.png",
    "Cryo":     "assets/ElementAssets/Cryoicon.png",
    "Electric": "assets/ElementAssets/Electricicon.png",
    "Physical": "assets/ElementAssets/Physicalicon.png",
    "Nature":   "assets/ElementAssets/Natureicon.png"
  },
  classes: {
    "Striker":   "assets/ClassAssets/StrikerIcon.png",
    "Guard":     "assets/ClassAssets/GuardIcon.png",
    "Vanguard":  "assets/ClassAssets/VanguardIcon.png",
    "Caster":    "assets/ClassAssets/CasterIcon.png",
    "Defender":  "assets/ClassAssets/DefenderIcon.png",
    "Supporter": "assets/ClassAssets/SupporterIcon.png"
  },
  weapons: {
    "Sword":       "assets/WeaponCharAssets/Short-Weapon.webp",
    "Great Sword": "assets/WeaponCharAssets/36px-Great_Sword.webp",
    "Polearm":     "assets/WeaponCharAssets/36px-Polearm.webp",
    "Hand Cannon": "assets/WeaponCharAssets/36px-Handcannon.webp",
    "Arts Unit":   "assets/WeaponCharAssets/36px-Arts_Unit.png"
  }
};

/* ─────────────────────────────────────────────
   OPERATOR DATA
   Each entry is a plain object describing one
   operator. `id` is also used as the Supabase
   character_id and the URL param for the detail page.
───────────────────────────────────────────── */
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
  {id:"catcher",       name:"Catcher",       rarity:4,cls:"Defender", element:"Physical",weapon:"Great Sword",img:"assets/CharacterAssets/4-stars/Catcher/Catcher_Splash_Art.png"}
];

/* ─────────────────────────────────────────────
   FILTER + SORT STATE
   These variables track the current UI state so
   updateFilters() and applySort() can re-evaluate
   which cards to show without re-rendering the DOM.
───────────────────────────────────────────── */
const grid        = document.getElementById('cardGrid');
const searchInput = document.getElementById('opSearch');

const filters = {
  rarity:  new Set(),
  class:   new Set(),
  element: new Set(),
  weapon:  new Set()
};

let currentSort      = 'rarity';
let sortDir          = -1;
let filterOwned      = false;
let filterLevelMin   = 1;
let filterLevelMax   = 90;
let filterLevelActive = false;

/* ─────────────────────────────────────────────
   ROSTER — SUPABASE READ / WRITE

   loadRoster()
     Fetches all rows for the current user from
     `user_roster` and populates the ROSTER cache.
     Called once during init() after auth check.

   upsertRosterEntry(characterId, patch)
     Merges `patch` into the in-memory ROSTER entry,
     then writes the full merged row to Supabase using
     upsert (insert-or-update) on the composite key
     (user_id, character_id).

   getRosterEntry(id)
     Safe getter — returns the cached entry or a
     default empty object so callers never get undefined.
───────────────────────────────────────────── */
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
    user_id:      CURRENT_USER.id,
    character_id: characterId,
    owned:        updated.owned,
    level:        updated.level ? parseInt(updated.level) : null,
    skill_levels: updated.skill_levels || {},
    updated_at:   new Date().toISOString(),
  }, { onConflict: 'user_id,character_id' });

  if (error) console.warn('Roster save error:', error);
}

function getRosterEntry(id) {
  return ROSTER[id] || { owned: false, level: null, skill_levels: {} };
}

/* ─────────────────────────────────────────────
   CARD BUILDER — createCard(op)
   Generates the full HTML string for one operator.
   Each card is wrapped in a `.card-wrap` that holds:
     • .op-card        — the visual card with art, badges, info
     • .card-drawer    — collapsible tracker below the card
                         (visible only when the operator is owned)
   All filter-relevant values are stored as data-* attributes
   on .card-wrap so filter/sort can read them without re-querying
   the operator data array.
───────────────────────────────────────────── */
function createCard(op) {
  const stars          = Array(op.rarity).fill(`<img src="${STAR_IMAGE}" class="star-icon" alt="★">`).join('');
  const imgTag         = op.img
    ? `<img src="${op.img}" class="card-art" onerror="this.style.display='none'">`
    : `<div class="card-art"></div>`;
  const elemIconPath   = ASSETS.elements[op.element] || '';
  const classIconPath  = ASSETS.classes[op.cls]      || '';
  const weaponIconPath = ASSETS.weapons[op.weapon]   || '';
  const entry          = getRosterEntry(op.id);
  const isOwned        = !!entry.owned;
  const sk             = entry.skill_levels || {};
  const drawerVisible  = isOwned ? ' open' : '';

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

/* ─────────────────────────────────────────────
   cardNavigate(event, id)
   Navigates to CharacterIntroduction.html for the
   clicked card, unless the click landed on the
   owned-badge (which toggles ownership instead).
───────────────────────────────────────────── */
function cardNavigate(event, id) {
  if (event.target.closest('.owned-badge')) return;
  window.location.href = `CharacterIntroduction.html?char=${id}`;
}

/* ─────────────────────────────────────────────
   toggleOwned(event, id)
   Flips the owned state for one operator:
     1. Stops the click bubbling to cardNavigate.
     2. Guards against guest users (no CURRENT_USER).
     3. Writes the new state to Supabase via upsertRosterEntry.
     4. Updates all DOM elements for that card instantly
        so the UI responds without waiting for a re-render.
───────────────────────────────────────────── */
async function toggleOwned(event, id) {
  event.stopPropagation();
  if (!CURRENT_USER) { alert('Please log in to track your roster.'); return; }

  const entry    = getRosterEntry(id);
  const newOwned = !entry.owned;
  await upsertRosterEntry(id, { owned: newOwned });

  const wrap   = document.querySelector(`.card-wrap[data-id="${id}"]`);
  if (!wrap) return;
  const card   = wrap.querySelector('.op-card');
  const drawer = wrap.querySelector('.card-drawer');
  const badge  = wrap.querySelector('.owned-badge');

  card.classList.toggle('card-owned',      newOwned);
  wrap.classList.toggle('card-wrap-owned', newOwned);
  wrap.dataset.owned = newOwned;
  drawer.classList.toggle('open',  newOwned);
  badge.classList.toggle('owned',  newOwned);
  badge.title = newOwned ? 'Owned — click to unmark' : 'Mark as owned';
}

/* ─────────────────────────────────────────────
   DEBOUNCE TIMER MAP
   Keyed by `characterId + fieldName`.
   Prevents hammering Supabase on every keystroke —
   the actual save fires 600 ms after the user stops typing.
───────────────────────────────────────────── */
const _debounceTimers = {};

/* ─────────────────────────────────────────────
   clampInput(input, min, max)
   Reads the input value, clamps it to [min, max],
   writes the clamped value back into the input,
   and returns it as a number (or null if empty).
───────────────────────────────────────────── */
function clampInput(input, min, max) {
  const val = parseInt(input.value);
  if (isNaN(val) || input.value === '') return null;
  const clamped = Math.min(max, Math.max(min, val));
  input.value = clamped;
  return clamped;
}

/* ─────────────────────────────────────────────
   saveTrackerField(event, id, field)
   Called on every keystroke in the Level input.
   Clamps to 1–90, updates data-level on the card-wrap
   (so level-sort stays accurate), and debounces
   the Supabase write to 600 ms.
───────────────────────────────────────────── */
function saveTrackerField(event, id, field) {
  if (!CURRENT_USER) return;
  const clamped = clampInput(event.target, 1, 90);
  const val = clamped !== null ? String(clamped) : '';
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

/* ─────────────────────────────────────────────
   saveSkillLevel(event, id, key)
   Called on every keystroke in a skill-level input.
   Clamps to 1–12, merges the new value into the
   skill_levels object in ROSTER cache, then debounces
   the Supabase upsert to 600 ms.
───────────────────────────────────────────── */
function saveSkillLevel(event, id, key) {
  if (!CURRENT_USER) return;
  const clamped = clampInput(event.target, 1, 12);
  const entry   = getRosterEntry(id);
  const updated = { ...(entry.skill_levels || {}), [key]: clamped };
  ROSTER[id]    = { ...entry, skill_levels: updated };
  clearTimeout(_debounceTimers[id + key]);
  _debounceTimers[id + key] = setTimeout(() => {
    upsertRosterEntry(id, { skill_levels: updated });
  }, 600);
}

/* ─────────────────────────────────────────────
   updateFilters()
   Reads the current search query, all active filter
   Sets, and the level range, then shows/hides each
   .card-wrap by toggling the `.hidden` class.
   Updates the visible-count badge and shows an
   empty-state message when no operators match.
───────────────────────────────────────────── */
function updateFilters() {
  const query = searchInput.value.toLowerCase();
  let visibleCount = 0;

  document.querySelectorAll('.card-wrap').forEach(card => {
    const matchesSearch  = card.dataset.name.includes(query);
    const matchesRarity  = filters.rarity.size  === 0 || filters.rarity.has(card.dataset.rarity);
    const matchesClass   = filters.class.size   === 0 || filters.class.has(card.dataset.class);
    const matchesElement = filters.element.size === 0 || filters.element.has(card.dataset.element);
    const matchesWeapon  = filters.weapon.size  === 0 || filters.weapon.has(card.dataset.weapon);
    const matchesOwned   = !filterOwned          || card.dataset.owned === 'true';

    let matchesLevel = true;
    if (filterLevelActive) {
      const lv = parseInt(card.dataset.level);
      matchesLevel = !isNaN(lv) && lv >= filterLevelMin && lv <= filterLevelMax;
    }

    const visible = matchesSearch && matchesRarity && matchesClass && matchesElement && matchesWeapon && matchesOwned && matchesLevel;
    card.classList.toggle('hidden', !visible);
    if (visible) visibleCount++;
  });

  document.getElementById('visNum').innerText = visibleCount;

  const existingEmpty = grid.querySelector('.empty');
  if (visibleCount === 0) {
    if (!existingEmpty) grid.insertAdjacentHTML('beforeend', '<div class="empty">No operators match the selected filters.</div>');
  } else if (existingEmpty) {
    existingEmpty.remove();
  }
}

/* ─────────────────────────────────────────────
   applySort()
   Extracts all .card-wrap elements from the grid,
   sorts them in-place using the current sort key
   and direction (sortDir: -1 desc, 1 asc), then
   re-appends them to the grid in sorted order.
   Non-card children (e.g. empty-state div) are
   not touched because they fail the classList check.
───────────────────────────────────────────── */
function applySort() {
  const allChildren = Array.from(grid.children);
  const opCards     = allChildren.filter(c => c.classList.contains('card-wrap'));
  const d           = sortDir;

  opCards.sort((a, b) => {
    if (currentSort === 'rarity') {
      const rA = parseInt(a.dataset.rarity);
      const rB = parseInt(b.dataset.rarity);
      if (rA !== rB) return (rB - rA) * d;
      return a.dataset.name.localeCompare(b.dataset.name);
    }
    if (currentSort === 'name') {
      return a.dataset.name.localeCompare(b.dataset.name) * d;
    }
    if (currentSort === 'level') {
      const lA = parseInt(a.dataset.level) || 0;
      const lB = parseInt(b.dataset.level) || 0;
      if (lA !== lB) return (lB - lA) * d;
      return a.dataset.name.localeCompare(b.dataset.name);
    }
    return 0;
  });

  opCards.forEach(card => grid.appendChild(card));
}

/* ─────────────────────────────────────────────
   EVENT LISTENERS — filter, sort, clear, scroll

   All pill clicks are caught via a single delegated
   listener on `document` rather than one per pill,
   so dynamically-added pills don't need re-binding.
   The listener resolves the action by checking the
   closest matching ancestor of the clicked target.
───────────────────────────────────────────── */
searchInput.addEventListener('input', updateFilters);

document.addEventListener('click', e => {

  const pill = e.target.closest('.filter-row .pill');
  if (pill) {
    if (pill.id === 'pill-owned') {
      filterOwned = !filterOwned;
      pill.classList.toggle('active', filterOwned);
      updateFilters();
      return;
    }
    const groupEl = pill.closest('[data-group]');
    if (!groupEl) return;
    const group = groupEl.dataset.group;
    const val   = pill.dataset.val;
    if (filters[group].has(val)) { filters[group].delete(val); pill.classList.remove('active'); }
    else                         { filters[group].add(val);    pill.classList.add('active');    }
    updateFilters();
    return;
  }

  const sortBtn = e.target.closest('.sort-btn');
  if (sortBtn) {
    if (currentSort === sortBtn.dataset.sort) {
      sortDir *= -1;
    } else {
      document.querySelectorAll('.sort-btn').forEach(b => {
        b.classList.remove('active');
        b.querySelector('.sort-arrow')?.remove();
      });
      sortBtn.classList.add('active');
      currentSort = sortBtn.dataset.sort;
      sortDir = -1;
    }
    sortBtn.querySelector('.sort-arrow')?.remove();
    const arrow = document.createElement('span');
    arrow.className  = 'sort-arrow';
    arrow.textContent = sortDir === -1 ? ' ↓' : ' ↑';
    sortBtn.appendChild(arrow);
    applySort();
    return;
  }

  if (e.target.closest('#clearBtn')) {
    searchInput.value = '';
    filters.rarity.clear(); filters.class.clear(); filters.element.clear(); filters.weapon.clear();
    document.querySelectorAll('.filter-row .pill').forEach(b => b.classList.remove('active'));
    filterOwned       = false;
    filterLevelActive = false;
    filterLevelMin    = 1;
    filterLevelMax    = 90;
    const minEl  = document.getElementById('filter-lv-min');
    const maxEl  = document.getElementById('filter-lv-max');
    const minOut = document.getElementById('filter-lv-min-out');
    const maxOut = document.getElementById('filter-lv-max-out');
    if (minEl) { minEl.value = 1;  minOut.textContent = '1';  }
    if (maxEl) { maxEl.value = 90; maxOut.textContent = '90'; }
    updateFilters();
    return;
  }

  if (e.target.closest('#filterToggleBtn')) {
    document.getElementById('filterZone').classList.toggle('dropdown-open');
    return;
  }
});

/* ─────────────────────────────────────────────
   LEVEL RANGE SLIDERS
   Each `input` event re-reads both sliders,
   prevents min from exceeding max (and vice versa),
   updates the label display, and re-runs updateFilters.
   filterLevelActive is false when the range is still
   at its defaults (1–90) so the filter is a no-op
   unless the user actually changes the sliders.
───────────────────────────────────────────── */
document.addEventListener('input', e => {
  if (e.target.id !== 'filter-lv-min' && e.target.id !== 'filter-lv-max') return;
  const minEl  = document.getElementById('filter-lv-min');
  const maxEl  = document.getElementById('filter-lv-max');
  const minOut = document.getElementById('filter-lv-min-out');
  const maxOut = document.getElementById('filter-lv-max-out');
  filterLevelMin = parseInt(minEl.value);
  filterLevelMax = parseInt(maxEl.value);
  if (filterLevelMin > filterLevelMax) {
    if (e.target.id === 'filter-lv-min') { filterLevelMin = filterLevelMax; minEl.value = filterLevelMin; }
    else                                  { filterLevelMax = filterLevelMin; maxEl.value = filterLevelMax; }
  }
  minOut.textContent    = filterLevelMin;
  maxOut.textContent    = filterLevelMax;
  filterLevelActive     = !(filterLevelMin === 1 && filterLevelMax === 90);
  updateFilters();
});

/* ─────────────────────────────────────────────
   SCROLL — sticky filter zone
   Adds `.scrolled` when the page is scrolled down
   (collapses the filter zone height via CSS).
   Removes it and also closes the dropdown when
   the user scrolls back near the top.
───────────────────────────────────────────── */
const filterZone = document.getElementById('filterZone');
window.addEventListener('scroll', () => {
  if (window.scrollY > 150) {
    filterZone.classList.add('scrolled');
  } else if (window.scrollY < 80) {
    filterZone.classList.remove('scrolled');
    filterZone.classList.remove('dropdown-open');
  }
});

/* ═════════════════════════════════════════════
   GUIDED TOUR
   Mirrors the tour system from WeaponIntroduction.
   TOUR_STEPS defines each step as:
     { selector } — CSS selector of the element to spotlight
     { title }    — heading text in the tour card
     { desc }     — body HTML (supports <b> tags)
     { pos }      — preferred card position: 'right' | 'left' | 'below'
   The tour overlay uses a box-shadow trick on
   .tour-spotlight to create the dimmed-mask-with-hole
   effect without needing a canvas or SVG cutout.
═════════════════════════════════════════════ */
const TOUR_STEPS = [
  {
    selector: '#opSearch',
    title:    'Search Operators',
    desc:     'Type any operator name to instantly filter the grid. <b>Partial matches</b> work — try "ang" to find Tangtang or Zhuang Fangyi.',
    pos:      'below'
  },
  {
    selector: '#filterToggleBtn',
    title:    'Open Filters',
    desc:     'Click <b>Filters</b> to expand the full filter panel. You can narrow the roster by <b>Rarity, Class, Element, Weapon</b>, and Owned status.',
    pos:      'below'
  },
  {
    selector: '.fgroup:nth-child(2)',
    title:    'Filter by Class',
    desc:     'Select one or more <b>classes</b> (Striker, Guard, Caster…). Active pills are highlighted in their class colour. Multiple selections show operators matching <b>any</b> of them.',
    pos:      'below'
  },
  {
    selector: '.fgroup-level',
    title:    'Level Range',
    desc:     'Drag the two sliders to filter by operator level. This only applies to operators with a <b>saved level</b> in your roster tracker.',
    pos:      'below'
  },
  {
    selector: '.sort-group',
    title:    'Sort the Grid',
    desc:     'Sort by <b>Rarity</b> (default), alphabetical <b>Name</b>, or tracked <b>Level</b>. Click the same button twice to flip between ascending and descending.',
    pos:      'left'
  },
  {
    selector: '.op-card',
    title:    'Operator Cards',
    desc:     'Click a card to open the <b>full character profile</b>. The coloured stripe on the left shows rarity. The element badge is in the top-right corner.',
    pos:      'right'
  },
  {
    selector: '.owned-badge',
    title:    'Mark as Owned',
    desc:     'Click the <b>✓ badge</b> in the top-left of a card to mark that operator as owned. This syncs to your account so your roster is saved across devices.',
    pos:      'right'
  },
  {
    selector: '.card-drawer',
    title:    'Roster Tracker',
    desc:     'Once an operator is owned, a <b>tracker drawer</b> opens below the card. Log the operator\'s current <b>Level</b> and all four <b>Skill Levels</b>. Changes save automatically.',
    pos:      'right'
  }
];

let tourStep    = 0;
let tourActive  = false;
let tourOverlay, tourSpotlight, tourCard;

/* ─────────────────────────────────────────────
   buildTourDOM()
   Injects the overlay, spotlight div, and tour card
   into the document once (lazy). Subsequent calls
   to startTour() re-use the same elements.
───────────────────────────────────────────── */
function buildTourDOM() {
  if (document.getElementById('tourOverlay')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="tour-overlay" id="tourOverlay">
      <div class="tour-mask" id="tourMask"></div>
      <div class="tour-spotlight" id="tourSpotlight"></div>
      <div class="tour-card" id="tourCard">
        <div class="tour-step-label">
          <span id="tourStepText">STEP 1 / ${TOUR_STEPS.length}</span>
          <div class="tour-step-dots" id="tourDots"></div>
        </div>
        <div class="tour-title" id="tourTitle"></div>
        <div class="tour-desc"  id="tourDesc"></div>
        <div class="tour-actions">
          <button class="tour-skip" id="tourSkip">Skip tour</button>
          <div class="tour-nav">
            <button class="tour-btn" id="tourPrev">← Back</button>
            <button class="tour-btn primary" id="tourNext">Next →</button>
          </div>
        </div>
      </div>
    </div>
  `);

  tourOverlay   = document.getElementById('tourOverlay');
  tourSpotlight = document.getElementById('tourSpotlight');
  tourCard      = document.getElementById('tourCard');

  document.getElementById('tourNext').addEventListener('click', () => advanceTour(1));
  document.getElementById('tourPrev').addEventListener('click', () => advanceTour(-1));
  document.getElementById('tourSkip').addEventListener('click', endTour);
  tourOverlay.addEventListener('click', e => { if (e.target === tourOverlay) endTour(); });
}

/* ─────────────────────────────────────────────
   startTour()
   Entry point called by the ? button in the header.
   Ensures tour DOM exists, resets to step 0,
   and activates the overlay.
───────────────────────────────────────────── */
function startTour() {
  buildTourDOM();
  tourStep   = 0;
  tourActive = true;
  tourOverlay.classList.add('active');
  renderTourStep(tourStep);
}

/* ─────────────────────────────────────────────
   endTour()
   Hides the overlay and clears the spotlight
   so it doesn't linger on screen.
───────────────────────────────────────────── */
function endTour() {
  tourActive = false;
  if (tourOverlay) {
    tourOverlay.classList.remove('active');
    tourSpotlight.style.cssText = '';
  }
}

/* ─────────────────────────────────────────────
   advanceTour(delta)
   Moves the tour forward (+1) or backward (-1).
   Calls endTour() when the last step is confirmed.
───────────────────────────────────────────── */
function advanceTour(delta) {
  tourStep += delta;
  if (tourStep >= TOUR_STEPS.length) { endTour(); return; }
  if (tourStep < 0) tourStep = 0;
  renderTourStep(tourStep);
}

/* ─────────────────────────────────────────────
   renderTourStep(index)
   Positions the spotlight over the target element,
   updates the tour card content, and places the card
   on whichever side of the spotlight has more space.
   If the target element doesn't exist yet (e.g.
   the drawer is collapsed), the step is skipped.
───────────────────────────────────────────── */
function renderTourStep(index) {
  const step   = TOUR_STEPS[index];
  const target = document.querySelector(step.selector);

  document.getElementById('tourStepText').textContent = `STEP ${index + 1} / ${TOUR_STEPS.length}`;
  document.getElementById('tourTitle').textContent     = step.title;
  document.getElementById('tourDesc').innerHTML        = step.desc;
  document.getElementById('tourNext').textContent      = index === TOUR_STEPS.length - 1 ? 'Done ✓' : 'Next →';
  document.getElementById('tourPrev').disabled         = index === 0;

  const dots = document.getElementById('tourDots');
  dots.innerHTML = TOUR_STEPS.map((_, i) =>
    `<div class="tour-dot${i === index ? ' active' : ''}"></div>`
  ).join('');

  if (!target) {
    advanceTour(1);
    return;
  }

  const PAD  = 10;
  const rect = target.getBoundingClientRect();
  const sl   = tourSpotlight;

  sl.style.top    = (rect.top    - PAD + window.scrollY)  + 'px';
  sl.style.left   = (rect.left   - PAD)                   + 'px';
  sl.style.width  = (rect.width  + PAD * 2)               + 'px';
  sl.style.height = (rect.height + PAD * 2)               + 'px';

  const CARD_W    = 310;
  const CARD_H    = 200;
  const spaceRight = window.innerWidth - rect.right;
  const spaceLeft  = rect.left;

  let cardTop  = rect.top + window.scrollY + (rect.height / 2) - (CARD_H / 2);
  let cardLeft;

  if (step.pos === 'below') {
    cardTop  = rect.bottom + window.scrollY + 20;
    cardLeft = Math.min(rect.left, window.innerWidth - CARD_W - 20);
  } else if (step.pos === 'left' || spaceRight < CARD_W + 30) {
    cardLeft = rect.left - CARD_W - 20;
  } else {
    cardLeft = rect.right + 20;
  }

  cardTop  = Math.max(10, Math.min(cardTop,  window.innerHeight + window.scrollY - CARD_H - 10));
  cardLeft = Math.max(10, Math.min(cardLeft, window.innerWidth  - CARD_W - 10));

  tourCard.style.top  = cardTop  + 'px';
  tourCard.style.left = cardLeft + 'px';

  target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ═════════════════════════════════════════════
   INIT
   Execution order matters here:
     1. Get Supabase session — determines if user is logged in.
     2. Load roster rows    — populates ROSTER cache before cards render.
     3. Render cards        — createCard reads ROSTER for owned/level state.
     4. Sort               — initial sort pass puts 6★ first.
     5. Inject pill icons   — adds <img> tags to filter buttons using ASSETS.
     6. Guest notice        — shown below results-row for non-logged-in users.
     7. Tour hint           — shown once to new users (uses sessionStorage).
═════════════════════════════════════════════ */
async function init() {
  const { data: { session } } = await db.auth.getSession();
  CURRENT_USER = session?.user || null;

  if (CURRENT_USER) await loadRoster();

  grid.innerHTML = OPS.map(createCard).join('');
  applySort();

  document.querySelectorAll('.pill').forEach(pill => {
    const groupEl = pill.closest('[data-group]');
    if (!groupEl) return;
    const group    = groupEl.dataset.group;
    const val      = pill.dataset.val;
    let iconPath   = '';
    if (group === 'element') iconPath = ASSETS.elements[val];
    if (group === 'class')   iconPath = ASSETS.classes[val];
    if (group === 'weapon')  iconPath = ASSETS.weapons[val];
    if (group === 'rarity')  iconPath = STAR_IMAGE;
    if (iconPath) pill.innerHTML = `<img src="${iconPath}" class="pill-icon" alt=""> ` + pill.innerHTML;
  });

  if (!CURRENT_USER) {
    const notice = document.createElement('div');
    notice.className = 'roster-notice';
    notice.innerHTML = `<a href="auth.html">Sign in</a> to track your roster across devices.`;
    document.querySelector('.results-row')?.prepend(notice);
  }

  if (!sessionStorage.getItem('opTourSeen')) {
    sessionStorage.setItem('opTourSeen', '1');
    setTimeout(startTour, 800);
  }
}

init();