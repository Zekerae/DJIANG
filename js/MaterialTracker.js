
  // ════════════════════════════════════════════════════════════════════════
// Endfield Ascension Planner — tracker.js










// ════════════════════════════════════════════════════════════════════════

// ── SUPABASE ─────────────────────────────────────────────────────────────
const SUPABASE_URL      = 'https://vjcucliqjjljhgbqshmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3VjbGlxampsamhnYnFzaG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTU3MTIsImV4cCI6MjA5NDA3MTcxMn0.qq7tRmLpRjTv0y4dZxCjcEQ48rTiY5ZV1xunr32kh10';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let CURRENT_USER = null;

function setDbStatus(state, msg) {
  document.getElementById('db-dot').className = 'db-dot ' + state;
  document.getElementById('db-status').textContent = msg;
}


// ── AUTH ──────────────────────────────────────────────────────────────────
async function initAuth() {
  const { data: { session } } = await db.auth.getSession();
  CURRENT_USER = session?.user || null;
  if (CURRENT_USER) {
    setDbStatus('loading', 'Loading your data…');
    await loadUserData();
  }
}


// ── USER DATA (plans + inventory) ─────────────────────────────────────────
async function loadUserData() {
  if (!CURRENT_USER) return;
  try {
    const { data: planRows, error: planErr } = await db
      .from('material_list_plans')
      .select('id, plan_type, from_level, to_level, plan_json, plan_label, character_id, weapon_id')
      .eq('user_id', CURRENT_USER.id)
      .order('created_at');
    if (planErr) throw planErr;

    if (planRows?.length) {
      plans = planRows.map(row => {
        let base = row.plan_json;
        if (typeof base === 'string') { try { base = JSON.parse(base); } catch { base = {}; } }
        base = base || {};

        // Already-migrated full snapshot
        if (base.id && base.item) return { ...base, _dbId: row.id };

        const type = row.plan_type;
        const item = type === 'operator'
          ? OPERATORS.find(o => o.id === row.character_id)
          : WEAPONS.find(w => w.id === row.weapon_id);
        if (!item) return null;

        return {
          id:         row.id,
          type,
          item,
          fromLv:     row.from_level  ?? 1,
          toLv:       row.to_level    ?? 40,
          promoFrom:  base.promoFrom  ?? 0,
          promoTo:    base.promoTo    ?? 0,
          talentFrom: base.talentFrom ?? 0,
          talentTo:   base.talentTo   ?? 0,
          tuneFrom:   base.tuneFrom   ?? 0,
          tuneTo:     base.tuneTo     ?? 0,
          skills:     base.skills     ?? (type === 'operator' ? defaultSkills() : []),
          _dbId:      row.id,
        };
      }).filter(Boolean);

      plans.forEach(p => focusedPlanIds.add(p.id));
    }


    if (matRows?.length) {
      haveQty = {}; expHave = {};
      for (const row of matRows) {
        if (row.material_id === '__exp_have__') {
          expHave = row.exp_have || {};
        } else {
          haveQty[row.material_id] = row.have_qty || 0;
        }
      }
    }
  } catch (e) {
    console.warn('loadUserData error:', e);
    setDbStatus('err', 'Failed to load saved data');
    return;
  }
  setDbStatus('ok', 'Data loaded');
}

async function savePlanToDB(plan) {
  if (!CURRENT_USER) return;

  const planSnapshot = { ...plan };
  delete planSnapshot._dbId;

  const payload = {
    user_id:      CURRENT_USER.id,
    plan_type:    plan.type,
    from_level:   plan.fromLv,
    to_level:     plan.toLv,
    character_id: plan.type === 'operator' ? plan.item.id : null,
    weapon_id:    plan.type === 'weapon'   ? plan.item.id : null,
    plan_json:    planSnapshot,
    plan_label:   plan.item.name,
  };

  if (plan._dbId) {
    const { error } = await db
      .from('material_list_plans')
      .update(payload)
      .eq('id', plan._dbId)
      .eq('user_id', CURRENT_USER.id);
    if (error) throw error;
  } else {
    const { data, error } = await db
      .from('material_list_plans')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    plan._dbId = data.id;
  }
}

async function deletePlanFromDB(plan) {
  if (!CURRENT_USER || !plan._dbId) return;
  await db
    .from('material_list_plans')
    .delete()
    .eq('id', plan._dbId)
    .eq('user_id', CURRENT_USER.id);
}

const _haveDebounce = {};
function scheduleHaveSave(matKey, planId) {
  if (!CURRENT_USER) return;
  const key = planId + ':' + matKey;
  clearTimeout(_haveDebounce[key]);
  _haveDebounce[key] = setTimeout(() => saveHaveToDB(planId), 800);
}
async function saveHaveToDB(planId) {
  if (!CURRENT_USER) return;
  const plan = plans.find(p => String(p.id) === String(planId)); if (!plan || !plan._dbId) return;
  try {
    await db.from('material_list_plans')
      .update({ plan_json: { ...plan, _haveQty: haveQty[planId] || {}, _expHave: expHave[planId] || {} } })
      .eq('id', plan._dbId)
      .eq('user_id', CURRENT_USER.id);
  } catch (e) { console.warn('saveHaveToDB error:', e.message); }
}

const _expHaveDebounce = {};
function scheduleExpHaveSave(planId) {
  if (!CURRENT_USER) return;
  clearTimeout(_expHaveDebounce[planId]);
  _expHaveDebounce[planId] = setTimeout(() => saveHaveToDB(planId), 800);
}


// ── DYNAMIC OPERATOR / WEAPON ARRAYS ──────────────────────────────────────
let OPERATORS = [];
let WEAPONS   = [];

const charImgCache   = {};
const weaponImgCache = {};

async function loadCharImages() {
  try {
    const { data, error } = await db
      .from('characters')
      .select('id, name, rarity, class, element, img_path, avatar_img');
    if (error) throw error;

    for (const row of (data || [])) {
      const img = row.avatar_img || row.img_path || null;
      if (row.name) charImgCache[row.name.toLowerCase()] = img;
      if (row.id)   charImgCache[row.id]                 = img;

      OPERATORS.push({
        id:      row.id,
        name:    row.name,
        element: row.element || 'Physical',
        cls:     row.class   || 'Unknown',
        rarity:  Number(row.rarity) || 6,
      });
    }
  } catch (e) {
    console.warn('loadCharImages error:', e.message);
  }
}

async function loadWeaponImages() {
  try {
    const { data, error } = await db
      .from('weapons')
      .select('id, name, type, rarity, img');
    if (error) throw error;

    for (const row of (data || [])) {
      if (row.id) weaponImgCache[row.id] = row.img || null;

      WEAPONS.push({
        id:     row.id,
        name:   row.name,
        type:   row.type   || 'Unknown',
        rarity: Number(row.rarity) || 5,
      });
    }
  } catch (e) {
    console.warn('loadWeaponImages error:', e.message);
  }
}

function getCharImg(name) {
  const key = name.toLowerCase();
  if (!(key in charImgCache)) return undefined;
  return charImgCache[key] || null;
}
function getWeaponImg(id) {
  if (!(id in weaponImgCache)) return undefined;
  return weaponImgCache[id] || null;
}


// ── MAP DB DATA ───────────────────────────────────────────────────────────
let dbMaps     = [];
let dbMatsById = {};

async function loadDbData() {
  setDbStatus('loading', 'Loading maps…');
  try {
    const { data: matsData } = await db
      .from('material_list_materials')
      .select('id, name, farming_note, img_path');
    if (matsData) {
      for (const m of matsData) {
        dbMatsById[m.id] = m;
        if (MATS[m.id]) MATS[m.id].name = m.name;
      }
    }

    const { data: maps, error: mapErr } = await db
      .from('material_list_maps')
      .select('*')
      .order('sort_order');
    if (mapErr) throw mapErr;

    const { data: pins, error: pinErr } = await db
      .from('material_list_map_pins')
      .select('*')
      .order('sort_order');
    if (pinErr) throw pinErr;

    dbMaps = (maps || []).map(m => ({
      ...m,
      pins: (pins || []).filter(p => p.map_id === m.id),
    }));

    setDbStatus('ok', `${dbMaps.length} maps loaded`);
  } catch (e) {
    setDbStatus('err', 'Map load failed: ' + e.message);
    dbMaps = [];
  }
}


// ── MATERIAL DEFINITIONS ──────────────────────────────────────────────────
const MATS = {
  t_creds:                      { name: 'T-Creds',                    color: '#f0c040', category: 'Currency' },
  elementary_combat_record:     { name: 'Elem. Combat Record',        color: '#5ba85b', category: 'Operator EXP',        expValue: 200,   isExpItem: true, expType: 'operator' },
  intermediate_combat_record:   { name: 'Int. Combat Record',         color: '#70c870', category: 'Operator EXP',        expValue: 1000,  isExpItem: true, expType: 'operator' },
  advanced_combat_record:       { name: 'Adv. Combat Record',         color: '#90e090', category: 'Operator EXP',        expValue: 10000, isExpItem: true, expType: 'operator' },
  elementary_cognitive_carrier: { name: 'Elem. Cognitive Carrier',    color: '#5ba85b', category: 'Operator EXP (Lv61+)', expValue: 1000,  isExpItem: true, expType: 'operator_hi' },
  advanced_cognitive_carrier:   { name: 'Adv. Cognitive Carrier',     color: '#70c870', category: 'Operator EXP (Lv61+)', expValue: 10000, isExpItem: true, expType: 'operator_hi' },
  arms_inspector:               { name: 'Arms Inspector',             color: '#7ec9c9', category: 'Weapon EXP',          expValue: 200,   isExpItem: true, expType: 'weapon' },
  arms_insp_kit:                { name: 'Arms INSP Kit',              color: '#90dada', category: 'Weapon EXP',          expValue: 1000,  isExpItem: true, expType: 'weapon' },
  arms_insp_set:                { name: 'Arms INSP Set',              color: '#a8ecec', category: 'Weapon EXP (Lv61+)',  expValue: 10000, isExpItem: true, expType: 'weapon_hi' },
  protodisk:                    { name: 'Protodisk',                  color: '#c9a05b', category: 'Promotion' },
  protoset:                     { name: 'Protoset',                   color: '#e0b870', category: 'Promotion' },
  pink_bolete:                  { name: 'Pink Bolete',                color: '#e08060', category: 'Rare Growth — Boletes' },
  red_bolete:                   { name: 'Red Bolete',                 color: '#d84040', category: 'Rare Growth — Boletes' },
  ruby_bolete:                  { name: 'Ruby Bolete',                color: '#c02060', category: 'Rare Growth — Boletes' },
  bloodcap:                     { name: 'Bloodcap',                   color: '#901020', category: 'Rare Growth — Boletes' },
  cosmagaric:                   { name: 'Cosmagaric',                 color: '#a01830', category: 'Rare Growth — Boletes' },
  protoprism:                   { name: 'Protoprism',                 color: '#6b8ec9', category: 'Skill Upgrade' },
  protohedron:                  { name: 'Protohedron',                color: '#2d6ea0', category: 'Skill Upgrade' },
  kalkodendra:                  { name: 'Kalkodendra',                color: '#70c98a', category: 'Rare Growth — Dendras' },
  chrysodendra:                 { name: 'Chrysodendra',               color: '#50d870', category: 'Rare Growth — Dendras' },
  vitrodendra:                  { name: 'Vitrodendra',                color: '#20e860', category: 'Rare Growth — Dendras' },
  mark_of_perseverance:         { name: 'Mark of Perseverance',       color: '#b870e0', category: 'Mastery' },
  cast_die:                     { name: 'Cast Die',                   color: '#c97b5b', category: 'Weapon Tuning' },
  heavy_cast_die:               { name: 'Heavy Cast Die',             color: '#e0956a', category: 'Weapon Tuning' },
  kalkonyx:                     { name: 'Kalkonyx',                   color: '#6b8ec9', category: 'Rare Ore' },
  auronyx:                      { name: 'Auronyx',                    color: '#8090e0', category: 'Rare Ore' },
  umbronyx:                     { name: 'Umbronyx',                   color: '#a070d0', category: 'Rare Ore' },
  igneosite:                    { name: 'Igneosite',                  color: '#e05030', category: 'Rare Ore' },
  wulingstone:                  { name: 'Wulingstone',                color: '#50a8d0', category: 'Rare Ore' },
  d96_steel:                    { name: 'D96 Steel Sample 4',         color: '#e8c84a', category: 'Operator Rare Mat' },
  metadiastima:                 { name: 'Metadiastima Tube',          color: '#d4a830', category: 'Operator Rare Mat' },
  tachyon:                      { name: 'Tachyon Lattice',            color: '#b08820', category: 'Operator Rare Mat' },
  quadrant:                     { name: 'Quadrant Fluid',             color: '#907010', category: 'Operator Rare Mat' },
  triphasic:                    { name: 'Triphasic Nanoflake',        color: '#705000', category: 'Operator Rare Mat' },
};

const EXP_GROUPS = {
  operator:    { label: 'Operator EXP',         keys: ['advanced_combat_record', 'intermediate_combat_record', 'elementary_combat_record'],    rawKey: '_op_exp_raw' },
  operator_hi: { label: 'Operator EXP (Lv61+)', keys: ['advanced_cognitive_carrier', 'elementary_cognitive_carrier'],                          rawKey: '_op_exp_hi_raw' },
  weapon:      { label: 'Weapon EXP',           keys: ['arms_insp_kit', 'arms_inspector'],                                                     rawKey: '_wpn_exp_raw' },
  weapon_hi:   { label: 'Weapon EXP (Lv61+)',   keys: ['arms_insp_set'],                                                                       rawKey: '_wpn_exp_hi_raw' },
};


// ── LEVELLING TABLES ──────────────────────────────────────────────────────
const OP_EXP_BANDS = [
  [1,  20, 22860,  820],
  [20, 40, 248540, 12540],
  [40, 60, 475710, 23900],
  [60, 80, 465230, 109180],
  [80, 90, 579950, 238980],
];

const WPN_EXP_BANDS = [
  [1,  20, 8890,    640],
  [20, 40, 96650,   9760],
  [40, 60, 185000,  18610],
  [60, 80, 913170,  94840],
  [80, 90, 1320370, 217540],
];

const PROMO_COSTS = {
  P1: { protodisk: 8,  protoset: 0,  pink_bolete: 3, red_bolete: 0, ruby_bolete: 0, cosmagaric: 0,  t_creds: 1600 },
  O1: { t_creds: 1800 },
  P2: { protodisk: 25, protoset: 0,  pink_bolete: 0, red_bolete: 5, ruby_bolete: 0, cosmagaric: 0,  t_creds: 6500 },
  O2: { t_creds: 6500 },
  P3: { protodisk: 0,  protoset: 24, pink_bolete: 0, red_bolete: 0, ruby_bolete: 5, cosmagaric: 0,  t_creds: 18000 },
  O3: { t_creds: 18000 },
  P4: { protodisk: 0,  protoset: 36, pink_bolete: 0, red_bolete: 0, ruby_bolete: 0, cosmagaric: 20, t_creds: 100000 },
};

const TALENT_NODE_COSTS = [
  { node: 1, protoprism: 6,  protohedron: 0,  t_creds: 1600 },
  { node: 2, protoprism: 10, protohedron: 0,  t_creds: 1800 },
  { node: 3, protoprism: 0,  protohedron: 10, t_creds: 6000 },
  { node: 4, protoprism: 0,  protohedron: 20, t_creds: 12000 },
];

const SKILL_LEVEL_COSTS = {
  2:  { protoprism: 6,  protohedron: 0,  kalkodendra: 1, chrysodendra: 0, vitrodendra: 0, mark_of_perseverance: 0, t_creds: 1000 },
  3:  { protoprism: 12, protohedron: 0,  kalkodendra: 2, chrysodendra: 0, vitrodendra: 0, mark_of_perseverance: 0, t_creds: 2700 },
  4:  { protoprism: 16, protohedron: 0,  kalkodendra: 0, chrysodendra: 1, vitrodendra: 0, mark_of_perseverance: 0, t_creds: 3200 },
  5:  { protoprism: 21, protohedron: 0,  kalkodendra: 0, chrysodendra: 1, vitrodendra: 0, mark_of_perseverance: 0, t_creds: 4200 },
  6:  { protoprism: 27, protohedron: 0,  kalkodendra: 0, chrysodendra: 2, vitrodendra: 0, mark_of_perseverance: 0, t_creds: 5400 },
  7:  { protoprism: 0,  protohedron: 6,  kalkodendra: 0, chrysodendra: 0, vitrodendra: 1, mark_of_perseverance: 0, t_creds: 8200 },
  8:  { protoprism: 0,  protohedron: 8,  kalkodendra: 0, chrysodendra: 0, vitrodendra: 1, mark_of_perseverance: 0, t_creds: 10500 },
  9:  { protoprism: 0,  protohedron: 15, kalkodendra: 0, chrysodendra: 0, vitrodendra: 2, mark_of_perseverance: 0, t_creds: 18000 },
  M1: { protoprism: 0,  protohedron: 15, kalkodendra: 0, chrysodendra: 0, vitrodendra: 0, mark_of_perseverance: 1, t_creds: 24000 },
  M2: { protoprism: 0,  protohedron: 24, kalkodendra: 0, chrysodendra: 0, vitrodendra: 0, mark_of_perseverance: 2, t_creds: 30000 },
  M3: { protoprism: 0,  protohedron: 50, kalkodendra: 0, chrysodendra: 0, vitrodendra: 0, mark_of_perseverance: 3, t_creds: 65000 },
};
const SKILL_LVL_ORDER = [2, 3, 4, 5, 6, 7, 8, 9, 'M1', 'M2', 'M3'];

const TUNING_COSTS = {
  1: { cast_die: 5,  heavy_cast_die: 0,  kalkonyx: 3, auronyx: 0, umbronyx: 0, t_creds: 2200 },
  2: { cast_die: 18, heavy_cast_die: 0,  kalkonyx: 0, auronyx: 5, umbronyx: 0, t_creds: 8500 },
  3: { cast_die: 0,  heavy_cast_die: 20, kalkonyx: 0, auronyx: 0, umbronyx: 5, t_creds: 25000 },
  4: { cast_die: 0,  heavy_cast_die: 30, kalkonyx: 0, auronyx: 0, umbronyx: 0, t_creds: 90000 },
};

function skillLvlToNum(v) {
  if (v === 'M1') return 10;
  if (v === 'M2') return 11;
  if (v === 'M3') return 12;
  return parseInt(v);
}


// ── MATERIAL CALCULATION ──────────────────────────────────────────────────
function calcMats(plan) {
  const m   = {};
  const add = (k, v) => { if (v > 0) m[k] = (m[k] || 0) + v; };

  if (plan.type === 'operator') {
    // EXP
    let rawExpLow = 0, rawExpHigh = 0;
    for (const [s, e, exp, tcreds] of OP_EXP_BANDS) {
      if (plan.toLv <= s || plan.fromLv >= e) continue;
      const frac = (Math.min(plan.toLv, e) - Math.max(plan.fromLv, s)) / (e - s);
      if (s >= 60) rawExpHigh += Math.round(exp * frac);
      else         rawExpLow  += Math.round(exp * frac);
      add('t_creds', Math.round(tcreds * frac));
    }
    if (rawExpLow  > 0) add('_op_exp_raw',    rawExpLow);
    if (rawExpHigh > 0) add('_op_exp_hi_raw', rawExpHigh);

    // Promotions
    const pf = plan.promoFrom || 0, pt = plan.promoTo || 0;
    for (let stage = pf + 1; stage <= pt; stage++) {
      const pKey = 'P' + stage, oKey = 'O' + (stage - 1);
      if (stage > 1 && PROMO_COSTS[oKey]) for (const [k, v] of Object.entries(PROMO_COSTS[oKey])) add(k, v);
      if (PROMO_COSTS[pKey])              for (const [k, v] of Object.entries(PROMO_COSTS[pKey])) add(k, v);
    }

    // Talents
    const tf = plan.talentFrom || 0, tt = plan.talentTo || 0;
    for (const n of TALENT_NODE_COSTS) {
      if (n.node > tf && n.node <= tt) {
        add('protoprism',  n.protoprism);
        add('protohedron', n.protohedron);
        add('t_creds',     n.t_creds);
      }
    }

    // Skills
    for (const sk of (plan.skills || [])) {
      if (!sk.enabled) continue;
      const fromN = skillLvlToNum(sk.fromLv), toN = skillLvlToNum(sk.toLv);
      for (const lvl of SKILL_LVL_ORDER) {
        const lvlN = skillLvlToNum(lvl);
        if (lvlN > fromN && lvlN <= toN) {
          const c = SKILL_LEVEL_COSTS[lvl];
          add('protoprism',          c.protoprism);
          add('protohedron',         c.protohedron);
          add('kalkodendra',         c.kalkodendra);
          add('chrysodendra',        c.chrysodendra);
          add('vitrodendra',         c.vitrodendra);
          add('mark_of_perseverance', c.mark_of_perseverance);
          add('t_creds',             c.t_creds);
        }
      }
    }

  } else {
    // Weapon EXP
    let rawExpLow = 0, rawExpHigh = 0;
    for (const [s, e, exp, tcreds] of WPN_EXP_BANDS) {
      if (plan.toLv <= s || plan.fromLv >= e) continue;
      const frac = (Math.min(plan.toLv, e) - Math.max(plan.fromLv, s)) / (e - s);
      if (s >= 60) rawExpHigh += Math.round(exp * frac);
      else         rawExpLow  += Math.round(exp * frac);
      add('t_creds', Math.round(tcreds * frac));
    }
    if (rawExpLow  > 0) add('_wpn_exp_raw',    rawExpLow);
    if (rawExpHigh > 0) add('_wpn_exp_hi_raw', rawExpHigh);

    // Tuning
    const tf = plan.tuneFrom || 0, tt = plan.tuneTo || 0;
    for (let stage = tf + 1; stage <= tt; stage++) {
      const c = TUNING_COSTS[stage]; if (!c) continue;
      add('cast_die',       c.cast_die);
      add('heavy_cast_die', c.heavy_cast_die);
      add('kalkonyx',       c.kalkonyx);
      add('auronyx',        c.auronyx);
      add('umbronyx',       c.umbronyx);
      add('t_creds',        c.t_creds);
    }
  }

  return m;
}

function totalMats() {
  const acc = {};
  for (const p of plans) {
    if (!focusedPlanIds.has(p.id)) continue;
    const m = calcMats(p);
    for (const [k, v] of Object.entries(m)) acc[k] = (acc[k] || 0) + v;
  }
  return acc;
}


// ── INVENTORY STATE ───────────────────────────────────────────────────────
let haveQty = {};
let expHave  = {};

function getHave(matKey, planId)      { return (haveQty[planId]?.[matKey]) || 0; }
function setHave(matKey, val, planId) {
  if (!haveQty[planId]) haveQty[planId] = {};
  haveQty[planId][matKey] = Math.max(0, parseInt(val) || 0);
  scheduleHaveSave(matKey, planId);
  renderBoth();
}
function getExpHave(groupKey, itemKey, planId)        { return (expHave[planId]?.[groupKey]?.[itemKey]) || 0; }
function setExpHave(groupKey, itemKey, val, planId)   {
  if (!expHave[planId]) expHave[planId] = {};
  if (!expHave[planId][groupKey]) expHave[planId][groupKey] = {};
  expHave[planId][groupKey][itemKey] = Math.max(0, parseInt(val) || 0);
  scheduleExpHaveSave(planId);
  renderBoth();
}

function renderBoth() {
  renderNeed();
  if (midMode === 'individual') renderIndividual();
}

function computeExpBreakdown(rawExp, groupDef, groupKey, planId) {
  let remaining = rawExp;
  const used = {};
  for (const key of groupDef.keys) {
    const val  = MATS[key]?.expValue || 1;
    const have = getExpHave(groupKey, key, planId);
    const use  = Math.min(have, Math.floor(remaining / val));
    used[key]  = use;
    remaining  = Math.max(0, remaining - use * val);
  }
  const coveredExp = rawExp - remaining;
  const pct        = rawExp > 0 ? Math.min(100, Math.round((coveredExp / rawExp) * 100)) : 0;
  const perTier    = {};
  for (const key of groupDef.keys) {
    const val  = MATS[key]?.expValue || 1;
    const have = getExpHave(groupKey, key, planId);
    const need = remaining > 0 ? Math.ceil(remaining / val) : 0;
    perTier[key] = { standaloneTotal: Math.ceil(rawExp / val), need, have, expVal: val };
  }
  return { perTier, coveredExp, remaining, totalExp: rawExp, pct };
}


// ── SKILLS ────────────────────────────────────────────────────────────────
const SKILL_NAMES = ['Basic Attack', 'Battle Skill', 'Combo Skill', 'Ultimate'];
function defaultSkills() {
  return SKILL_NAMES.map((name, i) => ({ name, enabled: i > 0, fromLv: 1, toLv: 'M3' }));
}


// ── APP STATE ─────────────────────────────────────────────────────────────
let plans          = [];
let planFilter     = 'all';
let activeFilter   = 'all';
let modalType      = null;
let highlightedMat = null;
let focusedPlanIds = new Set();
let focusPanelOpen = false;
let activeMapId    = null;
let mapView        = { tx: 0, ty: 0, scale: 1 };
let openPinGroupData = null;
let midMode        = 'collective';
let indivSaveStatus = {};
let indivOpenCards = new Set();
const _lastRenderedPlanConfig = {};

// Mobile panel state
let mobilePanel       = 'plans'; // 'plans' | 'need' | 'map'
const isMobile        = () => window.innerWidth <= 680;


// ── MOBILE PANEL SWITCHING ────────────────────────────────────────────────
function switchMobilePanel(panel) {
  if (!isMobile()) return;
  mobilePanel = panel;
  ['plans', 'need', 'map'].forEach(p => {
    document.getElementById(`mpanel-${p}`)?.classList.toggle('active', p === panel);
  });
  applyMobilePanelVisibility();
  if (panel === 'map' && activeMapId) setTimeout(() => renderMapCanvas(activeMapId), 50);
}

function applyMobilePanelVisibility() {
  if (!isMobile()) {
    ['left-panel', 'mid-panel', 'map-panel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.remove('panel-hidden', 'panel-hidden-left'); el.style.display = ''; }
    });
    return;
  }
  const panels = {
    plans: { show: 'left-panel', hide: ['mid-panel',  'map-panel'] },
    need:  { show: 'mid-panel',  hide: ['left-panel', 'map-panel'] },
    map:   { show: 'map-panel',  hide: ['left-panel', 'mid-panel'] },
  };
  const cfg   = panels[mobilePanel];
  const showEl = document.getElementById(cfg.show);
  if (showEl) showEl.classList.remove('panel-hidden', 'panel-hidden-left');
  cfg.hide.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('panel-hidden', 'panel-hidden-left');
      el.classList.add(i === 0 ? 'panel-hidden-left' : 'panel-hidden');
    }
  });
}

window.addEventListener('resize', applyMobilePanelVisibility);


// ── MID MODE ──────────────────────────────────────────────────────────────
function switchMidMode(mode) {
  midMode = mode;
  document.getElementById('mtab-collective').classList.toggle('active', mode === 'collective');
  document.getElementById('mtab-individual').classList.toggle('active', mode === 'individual');
  document.getElementById('mid-collective-view').style.display = mode === 'collective' ? 'flex' : 'none';
  document.getElementById('mid-individual-view').style.display = mode === 'individual' ? 'flex' : 'none';
  if (mode === 'individual') renderIndividual(); else renderNeed();
}


// ── HELPERS ───────────────────────────────────────────────────────────────
function getElColor(el) {
  return { Heat: '#ff6b35', Cryo: '#4fc3f7', Electric: '#c084fc', Physical: '#94a3b8', Nature: '#4ade80' }[el] || '#6b7280';
}
function getRarityColor(rarity) {
  return { 6: '#e8a45a', 5: '#b0b0d8', 4: '#5a8ad8' }[rarity] || '#6b7280';
}
function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function fmtExp(v) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M EXP';
  if (v >= 1_000)     return (v / 1_000).toFixed(1) + 'k EXP';
  return v.toLocaleString() + ' EXP';
}

const EL_ICON = {
  Heat:     `<svg viewBox="0 0 24 24" fill="none" stroke="#ff6b35" stroke-width="2"><path d="M12 2c0 6-6 8-6 14a6 6 0 0012 0c0-6-6-8-6-14z"/></svg>`,
  Cryo:     `<svg viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" stroke-width="2"><path d="M12 2v20M4.93 7l14.14 10M19.07 7L4.93 17M2 12h20"/></svg>`,
  Electric: `<svg viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>`,
  Physical: `<svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
  Nature:   `<svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2"><path d="M12 22V12M5 3s0 7 7 9c7-2 7-9 7-9"/></svg>`,
};
const OP_ICON  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
const WPN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21l7-7m0 0l2-2m-2 2l2 2m8-14l-7 7"/><path d="M14 3l7 7-3 3-7-7 3-3z"/></svg>`;


// ── CONFIRM DELETE DIALOG ─────────────────────────────────────────────────
let _pendingDeleteId = null;

function confirmDelete(id) {
  const plan = plans.find(p => p.id === id);
  if (!plan) return;
  _pendingDeleteId = id;
  document.getElementById('confirm-plan-name').textContent = plan.item.name;
  document.getElementById('confirm-db-warn').style.display = (CURRENT_USER && plan._dbId) ? 'block' : 'none';
  const btn = document.getElementById('confirm-delete-btn');
  btn.classList.remove('deleting');
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg> Delete`;
  document.getElementById('confirm-overlay').classList.add('open');
}

function closeConfirm() {
  _pendingDeleteId = null;
  document.getElementById('confirm-overlay').classList.remove('open');
}

function handleConfirmOverlayClick(e) {
  if (e.target === document.getElementById('confirm-overlay')) closeConfirm();
}

async function executeDelete() {
  if (_pendingDeleteId === null) return;
  const id   = _pendingDeleteId;
  const plan = plans.find(p => p.id === id);
  if (!plan) { closeConfirm(); return; }

  const btn = document.getElementById('confirm-delete-btn');
  btn.classList.add('deleting');
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg> Deleting…`;

  try { await deletePlanFromDB(plan); } catch (e) { console.warn('Delete from DB failed:', e); }

  plans = plans.filter(p => p.id !== id);
  focusedPlanIds.delete(id);
  indivOpenCards.delete(id);
  delete indivSaveStatus[id];
  closeConfirm();
  renderAll();
}


// ── PLANS (CRUD) ──────────────────────────────────────────────────────────
function addPlan(type, item) {
  if (plans.find(p => p.item.id === item.id && p.type === type)) { closeModal(); return; }
  const plan = {
    id: Date.now() + Math.random(), type, item,
    fromLv: 1, toLv: 40,
    promoFrom: 0, promoTo: 0,
    talentFrom: 0, talentTo: 0,
    tuneFrom: 0, tuneTo: 0,
    skills: type === 'operator' ? defaultSkills() : [],
  };
  plans.push(plan);
  focusedPlanIds.add(plan.id);
  renderAll();
  closeModal();
  if (isMobile() && mobilePanel !== 'plans') switchMobilePanel('plans');
}

function removePlan(id)   { confirmDelete(id); }
function resetPlan(id) {
  const plan = plans.find(p => p.id === id); if (!plan) return;
  Object.assign(plan, { fromLv: 1, toLv: 40, promoFrom: 0, promoTo: 0, talentFrom: 0, talentTo: 0, tuneFrom: 0, tuneTo: 0 });
  if (plan.type === 'operator') plan.skills = defaultSkills();
  renderAll();
}

function updateFrom(id, val) {
  const p = plans.find(x => x.id === id); if (!p) return;
  let v = Math.max(1, Math.min(89, parseInt(val) || 1));
  p.fromLv = v;
  if (p.fromLv >= p.toLv) p.toLv = Math.min(p.fromLv + 1, 90);
  syncLevelUI(id); renderBoth(); renderMapFilters();
  if (activeMapId) renderMapCanvas(activeMapId);
}
function updateTo(id, val) {
  const p = plans.find(x => x.id === id); if (!p) return;
  let v = Math.max(2, Math.min(90, parseInt(val) || 2));
  p.toLv = v;
  if (p.toLv <= p.fromLv) p.fromLv = Math.max(p.toLv - 1, 1);
  syncLevelUI(id); renderBoth(); renderMapFilters();
  if (activeMapId) renderMapCanvas(activeMapId);
}

function syncLevelUI(id) {
  const p    = plans.find(x => x.id === id); if (!p) return;
  const card = document.querySelector(`.plan-card[data-id="${id}"]`); if (!card) return;
  const fromSlider = card.querySelector('.from-slider'), toSlider = card.querySelector('.to-slider');
  const fromInput  = card.querySelector('.from-num'),   toInput  = card.querySelector('.to-num');
  if (fromSlider && document.activeElement !== fromSlider) fromSlider.value = p.fromLv;
  if (toSlider   && document.activeElement !== toSlider)   toSlider.value   = p.toLv;
  if (fromInput  && document.activeElement !== fromInput)  fromInput.value  = p.fromLv;
  if (toInput    && document.activeElement !== toInput)    toInput.value    = p.toLv;
  card.querySelectorAll('.quick-btn').forEach(btn => {
    const [f, t] = btn.dataset.range.split('-').map(Number);
    btn.classList.toggle('active', p.fromLv === f && p.toLv === t);
  });
}

function setRange(id, f, t)              { const p = plans.find(x => x.id === id); if (!p) return; p.fromLv = f; p.toLv = t; syncLevelUI(id); renderBoth(); renderMapFilters(); if (activeMapId) renderMapCanvas(activeMapId); }
function setPromoRange(id, field, val)   { const p = plans.find(x => x.id === id); if (!p) return; p[field] = parseInt(val); renderAll(); }
function setTalentRange(id, field, val)  { const p = plans.find(x => x.id === id); if (!p) return; p[field] = parseInt(val); renderAll(); }
function setTuneRange(id, field, val)    { const p = plans.find(x => x.id === id); if (!p) return; p[field] = parseInt(val); renderAll(); }
function toggleSkill(id, skillIdx)       { const p = plans.find(x => x.id === id); if (!p || !p.skills[skillIdx]) return; p.skills[skillIdx].enabled = !p.skills[skillIdx].enabled; renderAll(); }
function setSkillFrom(id, skillIdx, val) { const p = plans.find(x => x.id === id); if (!p || !p.skills[skillIdx]) return; p.skills[skillIdx].fromLv = val; renderAll(); }
function setSkillTo(id, skillIdx, val)   { const p = plans.find(x => x.id === id); if (!p || !p.skills[skillIdx]) return; p.skills[skillIdx].toLv   = val; renderAll(); }
function toggleAllSkills(id)             { const p = plans.find(x => x.id === id); if (!p) return; const allOn = p.skills.every(s => s.enabled); p.skills.forEach(s => s.enabled = !allOn); renderAll(); }

function renderAll() {
  renderPlans();
  renderFocusBar();
  renderNeed();
  renderMapFilters();
  if (activeMapId) renderMapCanvas(activeMapId);
  if (midMode === 'individual') renderIndividual();
}


// ── PLAN TABS ─────────────────────────────────────────────────────────────
function switchPlanTab(tab) {
  planFilter = tab;
  ['all', 'operator', 'weapon'].forEach(t =>
    document.getElementById(`ptab-${t}`).classList.toggle('active', t === tab)
  );
  renderPlans();
}


// ── PLAN CARD RENDERING ───────────────────────────────────────────────────
function renderPlans() {
  const visible  = planFilter === 'all' ? plans : plans.filter(p => p.type === planFilter);
  const empty    = document.getElementById('plans-empty');
  const container = document.getElementById('plans-container');
  empty.style.display = plans.length === 0 ? 'flex' : 'none';
  container.innerHTML = '';
  if (plans.length > 0 && visible.length === 0) {
    container.innerHTML = `<div style="padding:20px;text-align:center"><div style="font-family:var(--font-display);font-size:13px;color:var(--muted);letter-spacing:0.08em;text-transform:uppercase">No matches</div></div>`;
    return;
  }
  for (const plan of visible) container.appendChild(buildPlanCard(plan));
}

function buildAvatarHTML(plan) {
  const isOp       = plan.type === 'operator';
  const el         = plan.item.element || null;
  const elColor    = getElColor(el);
  const rarityColor = getRarityColor(plan.item.rarity);
  if (isOp) {
    const imgPath = getCharImg(plan.item.name);
    if (imgPath) return `<div class="plan-avatar" style="border-color:${elColor}55;background:${elColor}10"><img src="${imgPath}" alt="${plan.item.name}" loading="lazy"><div class="plan-avatar-rarity" style="background:${rarityColor}"></div></div>`;
    const icon = EL_ICON[el] || OP_ICON;
    return `<div class="plan-avatar" style="border-color:${elColor}55;background:${elColor}10">${icon}<div class="plan-avatar-rarity" style="background:${rarityColor}"></div></div>`;
  }
  const wpnImg = getWeaponImg(plan.item.id);
  if (wpnImg) return `<div class="plan-avatar" style="border-color:var(--border2);background:var(--surface2)"><img src="${wpnImg}" alt="${plan.item.name}" loading="lazy"><div class="plan-avatar-rarity" style="background:${rarityColor}"></div></div>`;
  return `<div class="plan-avatar" style="border-color:var(--border2);background:var(--surface2)">${WPN_ICON}<div class="plan-avatar-rarity" style="background:${rarityColor}"></div></div>`;
}

function buildSkillLvlOptions(selectedVal) {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 'M1', 'M2', 'M3']
    .map(v => `<option value="${v}" ${String(v) === String(selectedVal) ? 'selected' : ''}>${v}</option>`)
    .join('');
}
function buildPromoOptions(selectedVal, label) {
  return [0, 1, 2, 3, 4]
    .map(v => `<option value="${v}" ${v === selectedVal ? 'selected' : ''}>${v === 0 ? 'None' : label + v}</option>`)
    .join('');
}

function buildPlanCard(plan) {
  const isOp   = plan.type === 'operator';
  const el     = plan.item.element || null;
  const elLower = el ? el.toLowerCase() : '';
  const qRanges = [[1,40],[1,60],[1,80],[1,90],[40,80]];
  const qBtns   = qRanges.map(([f, t]) => {
    const active = plan.fromLv === f && plan.toLv === t ? 'active' : '';
    return `<button class="quick-btn ${active}" data-range="${f}-${t}" onclick="setRange(${plan.id},${f},${t})">${f}→${t}</button>`;
  }).join('');

  let promoRow = '';
  if (isOp) {
    promoRow = `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:7px;flex-wrap:wrap;">
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;min-width:64px;">Promotion</div>
        <select class="skill-lvl-sel" style="font-size:9px;" onchange="setPromoRange(${plan.id},'promoFrom',this.value)">${buildPromoOptions(plan.promoFrom,'P')}</select>
        <span class="skill-range-arrow">→</span>
        <select class="skill-lvl-sel" style="font-size:9px;" onchange="setPromoRange(${plan.id},'promoTo',this.value)">${buildPromoOptions(plan.promoTo,'P')}</select>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;margin-left:8px;min-width:48px;">Talents</div>
        <select class="skill-lvl-sel" style="font-size:9px;" onchange="setTalentRange(${plan.id},'talentFrom',this.value)">${buildPromoOptions(plan.talentFrom,'E')}</select>
        <span class="skill-range-arrow">→</span>
        <select class="skill-lvl-sel" style="font-size:9px;" onchange="setTalentRange(${plan.id},'talentTo',this.value)">${buildPromoOptions(plan.talentTo,'E')}</select>
      </div>`;
  }

  let tuneRow = '';
  if (!isOp) {
    tuneRow = `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:7px;">
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;min-width:54px;">Tuning</div>
        <select class="skill-lvl-sel" style="font-size:9px;" onchange="setTuneRange(${plan.id},'tuneFrom',this.value)">${[0,1,2,3,4].map(v=>`<option value="${v}" ${v===plan.tuneFrom?'selected':''}>${v===0?'None':'T'+v}</option>`).join('')}</select>
        <span class="skill-range-arrow">→</span>
        <select class="skill-lvl-sel" style="font-size:9px;" onchange="setTuneRange(${plan.id},'tuneTo',this.value)">${[0,1,2,3,4].map(v=>`<option value="${v}" ${v===plan.tuneTo?'selected':''}>${v===0?'None':'T'+v}</option>`).join('')}</select>
      </div>`;
  }

  let skillsSection = '';
  if (isOp && plan.skills?.length) {
    const allOn    = plan.skills.every(s => s.enabled);
    const skillRows = plan.skills.map((sk, i) => `
      <div class="skill-row ${sk.enabled ? 'enabled' : ''}">
        <div class="skill-row-chk ${sk.enabled ? 'on' : ''}" onclick="toggleSkill(${plan.id},${i})"><div class="skill-row-chk-inner"></div></div>
        <div class="skill-row-name">${sk.name}</div>
        <div class="skill-range-wrap">
          <select class="skill-lvl-sel" onchange="setSkillFrom(${plan.id},${i},this.value)">${buildSkillLvlOptions(sk.fromLv)}</select>
          <span class="skill-range-arrow">→</span>
          <select class="skill-lvl-sel" onchange="setSkillTo(${plan.id},${i},this.value)">${buildSkillLvlOptions(sk.toLv)}</select>
        </div>
      </div>`).join('');
    skillsSection = `
      <div class="skill-section">
        <div class="skill-section-label">Skills
          <button class="skill-toggle-all" onclick="toggleAllSkills(${plan.id})">${allOn ? 'Uncheck all' : 'Check all'}</button>
        </div>
        ${skillRows}
      </div>`;
  }

  const card = document.createElement('div');
  card.className  = 'plan-card';
  card.dataset.id = plan.id;
  card.innerHTML  = `
    <div class="plan-head">
      ${buildAvatarHTML(plan)}
      <div class="plan-meta">
        <div class="plan-name">${plan.item.name}</div>
        <div class="plan-tags">
          ${isOp
            ? `<span class="tag tag-${elLower}">${el}</span><span class="tag tag-neutral">${plan.item.cls}</span>`
            : `<span class="tag tag-neutral">${plan.item.type}</span>`}
          <span class="tag tag-rarity">${'★'.repeat(plan.item.rarity)}</span>
        </div>
      </div>
      <div class="plan-card-actions">
        <button class="btn-icon" title="Reset to defaults" onclick="resetPlan(${plan.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
        <button class="btn-icon danger" title="Delete plan" onclick="removePlan(${plan.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
    </div>
    <div class="plan-body">
      <div class="level-row">
        <div class="level-col">
          <label>From</label>
          <div class="level-slider-wrap">
            <input type="range" class="from-slider" min="1" max="89" value="${plan.fromLv}" oninput="updateFrom(${plan.id},this.value)">
            <input type="number" class="level-num-input from-num" min="1" max="89" value="${plan.fromLv}" onchange="updateFrom(${plan.id},this.value)" onkeydown="if(event.key==='Enter'){updateFrom(${plan.id},this.value);this.blur()}">
          </div>
        </div>
        <div class="level-arrow">→</div>
        <div class="level-col">
          <label>To</label>
          <div class="level-slider-wrap">
            <input type="range" class="to-slider" min="2" max="90" value="${plan.toLv}" oninput="updateTo(${plan.id},this.value)">
            <input type="number" class="level-num-input to-num" min="2" max="90" value="${plan.toLv}" onchange="updateTo(${plan.id},this.value)" onkeydown="if(event.key==='Enter'){updateTo(${plan.id},this.value);this.blur()}">
          </div>
        </div>
      </div>
      <div class="quick-btns">${qBtns}</div>
      ${promoRow}${tuneRow}${skillsSection}
    </div>`;
  return card;
}


// ── FOCUS PANEL ───────────────────────────────────────────────────────────
function toggleFocusPanel() {
  focusPanelOpen = !focusPanelOpen;
  document.getElementById('mid-focus-pills-wrap').classList.toggle('open', focusPanelOpen);
  document.getElementById('mid-focus-caret').classList.toggle('open', focusPanelOpen);
}
function focusAll()          { plans.forEach(p => focusedPlanIds.add(p.id));  renderAll(); }
function focusNone()         { focusedPlanIds.clear();                         renderAll(); }
function focusOnly(type)     { focusedPlanIds.clear(); plans.filter(p => p.type === type).forEach(p => focusedPlanIds.add(p.id)); renderAll(); }
function toggleFocusPlan(id) { if (focusedPlanIds.has(id)) focusedPlanIds.delete(id); else focusedPlanIds.add(id); renderAll(); }

function renderFocusBar() {
  const bar       = document.getElementById('mid-focus-bar');
  const pills     = document.getElementById('mid-focus-pills');
  const countEl   = document.getElementById('mid-focus-count');
  const indicator = document.getElementById('mid-focus-indicator');
  if (!plans.length) { bar.style.display = 'none'; indicator.classList.remove('visible'); return; }
  bar.style.display = 'block';
  const allFocused = plans.every(p => focusedPlanIds.has(p.id));
  countEl.textContent = `${plans.filter(p => focusedPlanIds.has(p.id)).length}/${plans.length}`;
  indicator.classList.toggle('visible', !allFocused);
  pills.innerHTML = plans.map(p => {
    const isFocused = focusedPlanIds.has(p.id);
    const dotColor  = p.type === 'weapon' ? '#94a3b8' : getElColor(p.item.element);
    return `<div class="focus-pill ${isFocused ? 'active' : 'inactive'}" onclick="toggleFocusPlan(${p.id})">
      <div class="focus-pill-dot" style="background:${dotColor}"></div>
      <div class="focus-pill-name">${p.item.name}</div>
      <div class="focus-pill-check"><div class="focus-pill-check-inner"></div></div>
    </div>`;
  }).join('');
}


// ── COLLECTIVE NEED LIST ──────────────────────────────────────────────────
function renderNeed() {
  const empty     = document.getElementById('mid-empty');
  const list      = document.getElementById('need-list');
  const badge     = document.getElementById('mid-badge-wrap');
  const badgeLabel = document.getElementById('mid-badge');

  if (!plans.length) { empty.style.display = 'flex'; list.innerHTML = ''; badge.style.display = 'none'; return; }
  empty.style.display = 'none';
  if (focusedPlanIds.size === 0) {
    list.innerHTML = `<div style="padding:20px 8px;text-align:center"><div style="font-family:var(--font-display);font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted)">No plans focused</div></div>`;
    badge.style.display = 'none'; return;
  }

  const mats        = totalMats();
  const internalKeys = new Set(['_op_exp_raw', '_op_exp_hi_raw', '_wpn_exp_raw', '_wpn_exp_hi_raw']);
  const matsWithPinsSet = new Set();
  for (const map of dbMaps) for (const pin of map.pins) matsWithPinsSet.add(pin.material_id);

  const entries    = Object.entries(mats).filter(([k]) => !internalKeys.has(k));
  const hasExpData = Object.keys(EXP_GROUPS).some(gKey => mats[EXP_GROUPS[gKey].rawKey]);
  if (!entries.length && !hasExpData) { list.innerHTML = ''; badge.style.display = 'none'; return; }

  const checkableItems = entries.filter(([k]) => { const m = MATS[k]; return m && !m.isExpItem; });
  const metCount = checkableItems.filter(([k, qty]) => {
    const totalHave = plans.reduce((sum, p) => sum + getHave(k, p.id), 0);
    return totalHave >= qty;
  }).length;
  badge.style.display  = 'block';
  badgeLabel.textContent = `${metCount}/${checkableItems.length}`;

  const byCategory = {};
  for (const [gKey, gDef] of Object.entries(EXP_GROUPS)) {
    if (!mats[gDef.rawKey]) continue;
    byCategory[gDef.label] = { type: 'exp', gKey, gDef, rawExp: mats[gDef.rawKey] };
  }
  for (const [k, qty] of entries) {
    const mat = MATS[k]; if (!mat || mat.isExpItem) continue;
    if (!byCategory[mat.category]) byCategory[mat.category] = { type: 'items', items: [] };
    if (byCategory[mat.category].type === 'items') byCategory[mat.category].items.push({ k, qty, mat });
  }

  let html = `<div class="collective-readonly-hint">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
    Enter inventory in the <strong style="color:var(--text);margin:0 3px">Individual</strong> tab — coverage updates here automatically.
  </div>`;

  for (const [cat, data] of Object.entries(byCategory)) {
    html += `<div class="need-section-label">${cat}</div>`;
    if (data.type === 'exp') {
      const { gKey, gDef, rawExp } = data;
      const breakdown = computeExpBreakdown(rawExp, gDef, gKey,null);
      const { perTier, pct, coveredExp, remaining } = breakdown;
      const allDone = remaining === 0;
      html += `<div class="exp-breakdown">
        <div class="exp-breakdown-header"><span>Total EXP needed</span><span class="exp-breakdown-total" style="${allDone ? 'color:var(--accent)' : ''}">${fmtExp(rawExp)}</span></div>
        <div class="exp-progress"><div class="exp-progress-fill" style="width:${pct}%"></div></div>
        <div class="exp-coverage-text">${allDone ? '✓ Fully covered by owned items' : `${pct}% covered · ${fmtExp(coveredExp)} in inventory`}</div>`;
      for (const itemKey of gDef.keys) {
        const mat = MATS[itemKey]; if (!mat) continue;
        const tier    = perTier[itemKey], isDone = tier.need === 0;
        const hasFind = matsWithPinsSet.has(itemKey);
        const findBtn = hasFind ? `<button class="need-find-btn" title="Find on map" onclick="onFindBtn('${itemKey}',this,event)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg></button>` : '';
        html += `<div class="exp-item-row${isDone ? ' satisfied' : ''}">
          <div class="exp-item-dot" style="background:${mat.color}"></div>
          <div class="exp-item-name">${mat.name}</div>
          ${findBtn}
          ${isDone ? `<div class="exp-item-need done" title="Covered">✓</div>` : `<div class="exp-item-need" style="color:${mat.color}">${tier.need}</div>`}
          <div class="exp-item-coverage${isDone ? ' met' : ''}">${isDone ? '✓ met' : `${tier.have} / ${tier.standaloneTotal}`}</div>
        </div>`;
      }
      if (!allDone) html += `<div style="font-family:var(--font-mono);font-size:8px;color:var(--muted);padding:4px 2px 0;opacity:0.55">↑ counts if only using that tier — mix freely</div>`;
      html += `</div>`;

    } else {
      for (const { k, qty, mat } of (data.items || [])) {
        const highlighted = highlightedMat === k ? 'highlighted' : '';
        const have        = getHave(k);
        const pct         = qty > 0 ? Math.min(100, Math.round((have / qty) * 100)) : 0;
        const remaining   = Math.max(0, qty - have);
        const isMet       = have >= qty;
        const fmtRemain   = remaining >= 1000 ? (remaining / 1000).toFixed(1) + 'k' : remaining.toLocaleString();
        const fmtTotal    = qty >= 1000       ? (qty / 1000).toFixed(1) + 'k'       : qty.toLocaleString();
        const hasFind     = matsWithPinsSet.has(k);
        const findBtn     = hasFind ? `<button class="need-find-btn" title="Find on map" onclick="onFindBtn('${k}',this,event)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg></button>` : '';
        html += `<div class="need-row ${highlighted}" style="${isMet ? 'opacity:0.5;' : ''}">
          <div class="need-dot" style="background:${mat.color}"></div>
          <div class="need-row-name" style="${isMet ? 'text-decoration:line-through;color:var(--muted)' : ''}">${mat.name}</div>
          <div class="need-row-right">
            ${findBtn}
            ${isMet ? `<div class="need-row-qty" style="color:var(--accent);font-size:13px">✓</div>` : `<div class="need-row-qty" style="color:${mat.color}">${fmtRemain}</div>`}
            <div class="need-row-coverage${isMet ? ' met' : ''}">${have} / ${fmtTotal}</div>
          </div>
          ${pct > 0 && !isMet ? `<div class="need-progress" style="width:${pct}%"></div>` : ''}
        </div>`;
      }
    }
  }
  list.innerHTML = html;
}


// ── INDIVIDUAL TRACKER ────────────────────────────────────────────────────
function toggleIndivCard(id) {
  if (indivOpenCards.has(id)) indivOpenCards.delete(id); else indivOpenCards.add(id);
  renderIndividual();
}

function renderIndividual() {
  const emptyEl = document.getElementById('indiv-empty');
  const listEl  = document.getElementById('indiv-list');
  if (!plans.length) { emptyEl.style.display = 'flex'; listEl.style.display = 'none'; return; }
  emptyEl.style.display = 'none'; listEl.style.display = 'block';

  const existingCards = {};
  listEl.querySelectorAll('.indiv-card[data-id]').forEach(el => { existingCards[el.dataset.id] = el; });
  Object.keys(existingCards).forEach(id => { if (!plans.find(p => String(p.id) === id)) existingCards[id].remove(); });

  plans.forEach((plan, idx) => {
    const sid       = String(plan.id);
    const configKey = JSON.stringify({ fromLv: plan.fromLv, toLv: plan.toLv, promoFrom: plan.promoFrom, promoTo: plan.promoTo, tuneFrom: plan.tuneFrom, tuneTo: plan.tuneTo, skills: plan.skills, isOpen: indivOpenCards.has(plan.id) });
    const existing  = existingCards[sid];
    if (!existing || _lastRenderedPlanConfig[sid] !== configKey) {
      _lastRenderedPlanConfig[sid] = configKey;
      const newCard = document.createElement('div');
      newCard.innerHTML  = buildIndivCard(plan);
      const cardEl = newCard.firstElementChild;
      if (existing) { listEl.replaceChild(cardEl, existing); }
      else { const cards = listEl.querySelectorAll('.indiv-card'); if (idx < cards.length) listEl.insertBefore(cardEl, cards[idx]); else listEl.appendChild(cardEl); }
    } else {
      _updateIndivCardDerived(existing, plan);
    }
  });
}

function _updateIndivCardDerived(cardEl, plan) {
  const mats        = calcMats(plan);
  const internalKeys = new Set(['_op_exp_raw', '_op_exp_hi_raw', '_wpn_exp_raw', '_wpn_exp_hi_raw']);
  const matEntries  = Object.entries(mats).filter(([k]) => !internalKeys.has(k) && MATS[k] && !MATS[k].isExpItem);
  const totalItems  = matEntries.length;
  const doneCount = matEntries.filter(([k, qty]) => getHave(k, plan.id) >= qty).length;
  const progressPct = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;
  const fillEl      = cardEl.querySelector('.indiv-card-progress-fill');
  if (fillEl) fillEl.style.width = progressPct + '%';

  let statusClass = 'pending', statusLabel = 'Pending';
  if (totalItems > 0 && doneCount === totalItems) { statusClass = 'done';   statusLabel = 'Done'; }
  else if (doneCount > 0)                         { statusClass = 'inprog'; statusLabel = `${doneCount}/${totalItems}`; }
  const statusEl = cardEl.querySelector('.indiv-card-status');
  if (statusEl) { statusEl.className = `indiv-card-status ${statusClass}`; statusEl.textContent = statusLabel; }

  cardEl.querySelectorAll('.indiv-mat-row[data-mat-key]').forEach(rowEl => {
    const k   = rowEl.dataset.matKey, qty = parseInt(rowEl.dataset.matQty) || 0;
    const have = getHave(k, plan.id), isSat = have >= qty;
    const pct  = qty > 0 ? Math.min(100, Math.round((have / qty) * 100)) : 0;
    const fmtQty = qty >= 1000 ? (qty / 1000).toFixed(1) + 'k' : qty.toLocaleString();
    const mat  = MATS[k];
    rowEl.classList.toggle('satisfied-row', isSat);
    rowEl.classList.toggle('zero', qty === 0);
    const needEl = rowEl.querySelector('.indiv-mat-need');
    if (needEl) { needEl.className = `indiv-mat-need${isSat ? ' satisfied' : ''}`; needEl.style.color = isSat ? '' : (mat?.color || ''); needEl.textContent = isSat ? '✓' : fmtQty; }
    const progEl = rowEl.querySelector('.indiv-mat-row-progress');
    if (progEl) progEl.style.width = (pct > 0 && !isSat) ? pct + '%' : '0%';
  });

  for (const [gKey, gDef] of Object.entries(EXP_GROUPS)) {
    if (!mats[gDef.rawKey]) continue;
    const breakdown = computeExpBreakdown(mats[gDef.rawKey], gDef, gKey, plan.id);
    const { perTier, pct, coveredExp, remaining } = breakdown;
    const allDone   = remaining === 0;
    const blockEl   = cardEl.querySelector(`.indiv-exp-block[data-gkey="${gKey}"]`); if (!blockEl) continue;
    const fillEl2   = blockEl.querySelector('.indiv-exp-block-fill'); if (fillEl2) fillEl2.style.width = pct + '%';
    const covEl     = blockEl.querySelector('.indiv-exp-block-coverage'); if (covEl) covEl.textContent = allDone ? '✓ Fully covered by your inventory' : `${pct}% covered · ${fmtExp(coveredExp)} in inventory`;
    const totalEl   = blockEl.querySelector('.indiv-exp-block-total'); if (totalEl) totalEl.style.color = allDone ? 'var(--accent)' : 'var(--text)';
    blockEl.querySelectorAll('.indiv-exp-tier-row[data-tier-key]').forEach(tierRow => {
      const itemKey = tierRow.dataset.tierKey, tier = perTier[itemKey]; if (!tier) return;
      const isSat2  = tier.need === 0;
      tierRow.classList.toggle('satisfied-row', isSat2);
      const needEl2 = tierRow.querySelector('.indiv-exp-tier-need');
      if (needEl2) { needEl2.className = `indiv-exp-tier-need${isSat2 ? ' done' : ''}`; needEl2.style.color = isSat2 ? '' : (MATS[itemKey]?.color || ''); needEl2.textContent = isSat2 ? '✓' : tier.need; }
    });
  }
  _updateSaveBar(String(plan.id));
}

function _updateSaveBar(id) {
  const card      = document.querySelector(`.indiv-card[data-id="${id}"]`); if (!card) return;
  const saveStatus = indivSaveStatus[id] || 'idle';
  const isSaving  = saveStatus === 'saving', isSaved = saveStatus === 'saved', isError = saveStatus === 'error';
  const btn       = card.querySelector('.indiv-save-btn');
  const statusEl  = card.querySelector('.indiv-save-status');
  if (btn) {
    btn.className = `indiv-save-btn${isSaving ? ' saving' : ''}${isSaved ? ' saved' : ''}`;
    btn.disabled  = isSaving;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> ${isSaving ? 'Saving…' : isSaved ? '✓ Saved' : 'Save to DB'}`;
  }
  if (statusEl) {
    statusEl.className   = `indiv-save-status${isSaved ? ' ok' : ''}${isError ? ' err' : ''}`;
    statusEl.textContent = isSaving ? 'Writing to database…' : isSaved ? 'Saved successfully' : isError ? 'Save failed — are you logged in?' : (!CURRENT_USER ? 'Log in to save' : 'Not yet saved');
  }
}

function buildIndivCard(plan) {
  const isOp       = plan.type === 'operator';
  const el         = plan.item.element || null;
  const elColor    = getElColor(el);
  const rarityColor = getRarityColor(plan.item.rarity);
  const isOpen     = indivOpenCards.has(plan.id);
  const mats       = calcMats(plan);

  const matsWithPinsSet = new Set();
  for (const map of dbMaps) for (const pin of map.pins) matsWithPinsSet.add(pin.material_id);

  const internalKeys = new Set(['_op_exp_raw', '_op_exp_hi_raw', '_wpn_exp_raw', '_wpn_exp_hi_raw']);
  const matEntries   = Object.entries(mats).filter(([k]) => !internalKeys.has(k) && MATS[k] && !MATS[k].isExpItem);
  const totalItems   = matEntries.length;
  const doneCount = matEntries.filter(([k, qty]) => getHave(k, plan.id) >= qty).length;
  const progressPct  = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;

  let statusClass = 'pending', statusLabel = 'Pending';
  if (totalItems > 0 && doneCount === totalItems) { statusClass = 'done';   statusLabel = 'Done'; }
  else if (doneCount > 0)                         { statusClass = 'inprog'; statusLabel = `${doneCount}/${totalItems}`; }

  let avatarContent;
  if (isOp) {
    const imgPath = getCharImg(plan.item.name);
    avatarContent = imgPath ? `<img src="${imgPath}" alt="${plan.item.name}" loading="lazy">` : (EL_ICON[el] || OP_ICON);
  } else {
    const wpnImg  = getWeaponImg(plan.item.id);
    avatarContent = wpnImg ? `<img src="${wpnImg}" alt="${plan.item.name}" loading="lazy">` : WPN_ICON;
  }

  // EXP sections
  let expSectionsHtml = '';
  for (const [gKey, gDef] of Object.entries(EXP_GROUPS)) {
    const rawKey = gDef.rawKey; if (!mats[rawKey]) continue;
    const rawExp    = mats[rawKey];
    const breakdown = computeExpBreakdown(rawExp, gDef, gKey, plan.id);
    const { perTier, pct, coveredExp, remaining } = breakdown;
    const allDone   = remaining === 0;
    expSectionsHtml += `<div class="indiv-exp-block" data-gkey="${gKey}">
      <div class="indiv-exp-block-header">
        <span class="indiv-exp-block-label">${gDef.label}</span>
        <span class="indiv-exp-block-total" style="color:${allDone ? 'var(--accent)' : 'var(--text)'}">${fmtExp(rawExp)}</span>
      </div>
      <div class="indiv-exp-block-bar"><div class="indiv-exp-block-fill" style="width:${pct}%"></div></div>
      <div class="indiv-exp-block-coverage">${allDone ? '✓ Fully covered by your inventory' : `${pct}% covered · ${fmtExp(coveredExp)} in inventory`}</div>`;
    for (const itemKey of gDef.keys) {
      const mat  = MATS[itemKey]; if (!mat) continue;
      const tier = perTier[itemKey], have = tier.have, isSat = tier.need === 0;
      const hasFind = matsWithPinsSet.has(itemKey);
      const findBtn = hasFind ? `<button class="indiv-exp-tier-find" title="Find on map" onclick="onFindBtn('${itemKey}',this,event)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg></button>` : `<span></span>`;
      expSectionsHtml += `<div class="indiv-exp-tier-row${isSat ? ' satisfied-row' : ''}" data-tier-key="${itemKey}">
        <div class="indiv-exp-tier-dot" style="background:${mat.color}"></div>
        <div class="indiv-exp-tier-name" title="${mat.name}">${mat.name}</div>
        ${findBtn}
        <div class="indiv-exp-tier-need${isSat ? ' done' : ''}" style="${isSat ? '' : 'color:' + mat.color}">${isSat ? '✓' : tier.need}</div>
        <div class="indiv-have-wrap">
          <span style="font-size:8px;color:var(--muted);margin-right:2px">have</span>
          <input class="indiv-have-input" type="number" min="0" value="${have}" onclick="event.stopPropagation()" onchange="setHave('${k}',this.value,${plan.id})" oninput="setHave('${k}',this.value,${plan.id})">
      </div>`;
    }
    if (!allDone) expSectionsHtml += `<div class="indiv-exp-tier-hint">↑ counts if only using that tier — mix tiers freely</div>`;
    expSectionsHtml += `</div>`;
  }

  // Material sections
  const byCategory = {};
  for (const [k, qty] of matEntries) {
    const mat = MATS[k];
    if (!byCategory[mat.category]) byCategory[mat.category] = [];
    byCategory[mat.category].push({ k, qty, mat });
  }
  let matSectionsHtml = '';
  for (const [cat, items] of Object.entries(byCategory)) {
    matSectionsHtml += `<div class="indiv-section-head">${cat}</div>`;
    for (const { k, qty, mat } of items) {
      const have    = getHave(k), isSat = have >= qty;
      const fmtQty  = qty >= 1000 ? (qty / 1000).toFixed(1) + 'k' : qty.toLocaleString();
      const pct     = qty > 0 ? Math.min(100, Math.round((have / qty) * 100)) : 0;
      const hasFind = matsWithPinsSet.has(k);
      const findBtn = hasFind ? `<button class="indiv-exp-tier-find" title="Find on map" onclick="onFindBtn('${k}',this,event);event.stopPropagation()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg></button>` : '';
      matSectionsHtml += `<div class="indiv-mat-row${qty === 0 ? ' zero' : ''}${isSat ? ' satisfied-row' : ''}" data-mat-key="${k}" data-mat-qty="${qty}">
        <div class="indiv-mat-dot" style="background:${mat.color}"></div>
        <div class="indiv-mat-name">${mat.name}</div>
        ${findBtn
          ? `<div style="display:flex;align-items:center;gap:3px;">${findBtn}<div class="indiv-mat-need${isSat ? ' satisfied' : ''}" style="${isSat ? '' : 'color:' + mat.color}">${isSat ? '✓' : fmtQty}</div></div>`
          : `<div class="indiv-mat-need${isSat ? ' satisfied' : ''}" style="${isSat ? '' : 'color:' + mat.color}">${isSat ? '✓' : fmtQty}</div>`}
        <div class="indiv-have-wrap">
          <span style="font-size:8px;color:var(--muted);margin-right:2px">have</span>
          <input class="indiv-have-input" type="number" min="0" value="${have}" onclick="event.stopPropagation()" onchange="setHave('${k}',this.value,${plan.id})" oninput="setHave('${k}',this.value,${plan.id})">
        </div>
        ${pct > 0 && !isSat ? `<div class="indiv-mat-row-progress" style="width:${pct}%"></div>` : ''}
      </div>`;
    }
  }
  if (!expSectionsHtml && !matSectionsHtml) {
    matSectionsHtml = `<div style="font-family:var(--font-mono);font-size:9px;color:var(--muted);padding:8px 0">No materials required for this range.</div>`;
  }

  const saveStatus = indivSaveStatus[plan.id] || 'idle';
  const isSaving   = saveStatus === 'saving', isSaved = saveStatus === 'saved', isError = saveStatus === 'error';

  return `<div class="indiv-card${isOpen ? ' open' : ''}" data-id="${plan.id}">
    <div class="indiv-card-head" onclick="toggleIndivCard(${plan.id})">
      <div class="indiv-card-avatar" style="border-color:${isOp ? elColor + '55' : 'var(--border2)'}"> ${avatarContent}</div>
      <div class="indiv-card-meta">
        <div class="indiv-card-name" style="color:${isOp ? elColor : 'var(--text)'}">${plan.item.name}</div>
        <div class="indiv-card-sub">
          <span style="color:${rarityColor}">${'★'.repeat(plan.item.rarity)}</span>
          <span>Lv ${plan.fromLv} → ${plan.toLv}</span>
          ${isOp  && plan.promoFrom !== plan.promoTo ? `<span>P${plan.promoFrom}→P${plan.promoTo}</span>` : ''}
          ${!isOp && plan.tuneFrom  !== plan.tuneTo  ? `<span>T${plan.tuneFrom}→T${plan.tuneTo}</span>`  : ''}
        </div>
      </div>
      <div class="indiv-card-status ${statusClass}">${statusLabel}</div>
      <div class="indiv-card-caret">▾</div>
    </div>
    ${totalItems > 0 ? `<div class="indiv-card-progress-bar"><div class="indiv-card-progress-fill" style="width:${progressPct}%"></div></div>` : ''}
    <div class="indiv-card-body">
      <div class="indiv-section">
        ${expSectionsHtml}${matSectionsHtml}
      </div>
      <div class="indiv-save-bar">
        <button class="indiv-save-btn${isSaving ? ' saving' : ''}${isSaved ? ' saved' : ''}" onclick="saveIndivPlan(${plan.id})" ${isSaving ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          ${isSaving ? 'Saving…' : isSaved ? '✓ Saved' : 'Save to DB'}
        </button>
        <span class="indiv-save-status${isSaved ? ' ok' : ''}${isError ? ' err' : ''}">
          ${isSaving ? 'Writing to database…' : isSaved ? 'Saved successfully' : isError ? 'Save failed — are you logged in?' : (!CURRENT_USER ? 'Log in to save' : 'Not yet saved')}
        </span>
      </div>
    </div>
  </div>`;
}

async function saveIndivPlan(id) {
  const plan = plans.find(p => p.id === id); if (!plan) return;
  if (!CURRENT_USER) { indivSaveStatus[id] = 'error'; _updateSaveBar(id); setTimeout(() => { delete indivSaveStatus[id]; _updateSaveBar(id); }, 2000); return; }
  indivSaveStatus[id] = 'saving'; _updateSaveBar(id);
  try {
    await savePlanToDB(plan);
    clearTimeout(_expHaveDebounce[id]);
    await saveHaveToDB(id);
    indivSaveStatus[id] = 'saved'; _updateSaveBar(id);
    setTimeout(() => { if (indivSaveStatus[id] === 'saved') { delete indivSaveStatus[id]; _updateSaveBar(id); } }, 3000);
  } catch (e) {
    console.warn('save error:', e);
    indivSaveStatus[id] = 'error'; _updateSaveBar(id);
    setTimeout(() => { if (indivSaveStatus[id] === 'error') { delete indivSaveStatus[id]; _updateSaveBar(id); } }, 3000);
  }
}


// ── FIND BUTTON ───────────────────────────────────────────────────────────
function mapsWithMat(matKey) {
  return dbMaps.map(map => {
    const pins = map.pins.filter(p => p.material_id === matKey);
    return pins.length ? { map, pins } : null;
  }).filter(Boolean);
}

let activeFindDropdownEl = null;
function closeAllFindDropdowns() {
  if (activeFindDropdownEl?.parentNode) activeFindDropdownEl.parentNode.removeChild(activeFindDropdownEl);
  activeFindDropdownEl = null;
}
function onFindBtn(matKey, btnEl, event) {
  event.stopPropagation();
  if (activeFindDropdownEl?.dataset.matKey === matKey) { closeAllFindDropdowns(); return; }
  closeAllFindDropdowns();
  const locations = mapsWithMat(matKey); if (!locations.length) return;
  if (locations.length === 1) { navigateToMat(matKey, locations[0].map.id); return; }
  const rect     = btnEl.getBoundingClientRect();
  const dropdown = document.createElement('div');
  dropdown.className     = 'find-dropdown';
  dropdown.dataset.matKey = matKey;
  dropdown.style.top     = (rect.bottom + 4) + 'px';
  dropdown.style.left    = Math.max(4, rect.left - 60) + 'px';
  dropdown.innerHTML     = `<div class="find-dropdown-title">Found on ${locations.length} maps</div>` +
    locations.map(({ map, pins }) => `<div class="find-dropdown-item" onclick="navigateToMat('${matKey}','${map.id}');closeAllFindDropdowns()"><span class="find-dropdown-map">${escHtml(map.name)}</span><span class="find-dropdown-count">${pins.length} pin${pins.length > 1 ? 's' : ''}</span></div>`).join('');
  document.body.appendChild(dropdown);
  activeFindDropdownEl = dropdown;
}
function navigateToMat(matKey, mapId) {
  if (isMobile()) switchMobilePanel('map');
  if (activeMapId !== mapId) switchMap(mapId);
  highlightedMat = matKey; renderMapFilters(); renderNeed();
  if (activeMapId) renderMapCanvas(activeMapId);
  const map = dbMaps.find(m => m.id === mapId); if (!map) return;
  const pin = map.pins.find(p => p.material_id === matKey); if (!pin) return;
  const area = document.getElementById('map-area'); if (!area) return;
  const rect  = area.getBoundingClientRect();
  const targetScale = Math.max(mapView.scale, 1.4);
  mapView.scale = targetScale;
  mapView.tx    = rect.width  / 2 - pin.x * targetScale;
  mapView.ty    = rect.height / 2 - pin.y * targetScale;
  updateMapTransform();
  setTimeout(() => {
    const pinEl = document.querySelector(`[data-pin-mat="${matKey}"]`);
    if (pinEl) { pinEl.classList.add('nav-flash'); setTimeout(() => pinEl.classList.remove('nav-flash'), 1400); }
  }, 120);
  updateInfoBar(map, matKey); showDeselect();
}
document.addEventListener('click', e => { if (activeFindDropdownEl && !activeFindDropdownEl.contains(e.target)) closeAllFindDropdowns(); });


// ── MAP ───────────────────────────────────────────────────────────────────
function initMaps() {
  const topBar  = document.getElementById('map-top-bar');
  const hint    = document.getElementById('map-loading-hint');
  const dragHint = document.getElementById('map-drag-hint');
  document.getElementById('map-loading').style.display = 'none';
  if (!dbMaps.length) { hint.textContent = 'No maps in database'; return; }
  hint.style.display    = 'none';
  dragHint.style.display = '';

  dbMaps.forEach((map, i) => {
    const btn      = document.createElement('button');
    btn.className  = 'map-tab' + (i === 0 ? ' active' : '');
    btn.id         = `mtab-${map.id}`;
    btn.textContent = map.name;
    btn.onclick    = () => switchMap(map.id);
    topBar.insertBefore(btn, dragHint);
  });

  const canvasesEl = document.getElementById('map-canvases');
  dbMaps.forEach((map, i) => {
    const wrap      = document.createElement('div');
    wrap.className  = 'map-canvas-wrap' + (i === 0 ? ' active' : '');
    wrap.id         = `mapwrap-${map.id}`;
    wrap.style.cssText = 'position:absolute;inset:0';
    canvasesEl.appendChild(wrap);
  });

  document.getElementById('map-zoom-controls').style.display = 'flex';
  document.getElementById('map-coords').style.display        = 'block';
  setupMapInteraction();
  if (dbMaps.length) { activeMapId = dbMaps[0].id; renderMapCanvas(activeMapId); }
}

function switchMap(mapId) {
  activeMapId = mapId; mapView = { tx: 0, ty: 0, scale: 1 }; closePinGroupPortal();
  dbMaps.forEach(m => {
    document.getElementById(`mtab-${m.id}`)?.classList.toggle('active', m.id === mapId);
    document.getElementById(`mapwrap-${m.id}`)?.classList.toggle('active', m.id === mapId);
  });
  renderMapCanvas(mapId);
  document.getElementById('map-info-bar').classList.remove('visible');
}

function getMatColor(matId) { return MATS[matId]?.color || '#6b7280'; }
function getMatName(matId)  { return MATS[matId]?.name || dbMatsById[matId]?.name || matId; }

function clearHighlight() {
  highlightedMat = null; closePinGroupPortal(); renderMapFilters(); renderNeed();
  if (activeMapId) renderMapCanvas(activeMapId);
  document.getElementById('map-info-bar').classList.remove('visible');
  document.getElementById('map-deselect-hint').classList.remove('visible');
  document.getElementById('map-legend-clear').classList.remove('visible');
}
function showDeselect() {
  document.getElementById('map-deselect-hint').classList.add('visible');
  document.getElementById('map-legend-clear').classList.add('visible');
}

const PIN_GROUP_RADIUS = 30;
function groupPins(pins) {
  const groups = [], assigned = new Set();
  for (let i = 0; i < pins.length; i++) {
    if (assigned.has(i)) continue;
    const group = [pins[i]]; assigned.add(i);
    for (let j = i + 1; j < pins.length; j++) {
      if (assigned.has(j)) continue;
      const dx = pins[j].x - pins[i].x, dy = pins[j].y - pins[i].y;
      if (Math.sqrt(dx * dx + dy * dy) <= PIN_GROUP_RADIUS) { group.push(pins[j]); assigned.add(j); }
    }
    groups.push(group);
  }
  return groups;
}

function closePinGroupPortal() {
  openPinGroupData = null;
  const root = document.getElementById('pin-group-portal-root');
  if (root) root.innerHTML = '';
}
function openPinGroupPortal(groupId, groupPins, anchorEl) {
  openPinGroupData = { groupId };
  const root = document.getElementById('pin-group-portal-root'); if (!root) return;
  const anchorRect = anchorEl.getBoundingClientRect();
  const portal     = document.createElement('div');
  portal.className  = 'pin-group-portal';
  portal.dataset.groupId = groupId;
  const items = groupPins.map(p => {
    const c    = getMatColor(p.material_id), n = getMatName(p.material_id);
    const isHL = highlightedMat === p.material_id;
    const noteText = (p.note?.trim()) ? p.note : (dbMatsById[p.material_id]?.farming_note || '');
    return `<div class="pin-group-portal-item ${isHL ? 'highlighted-item' : ''}" onclick="onPinClick('${p.material_id}','${escHtml(p.location_name)}','${escHtml(p.note || '')}');closePinGroupPortal()">
      <div class="pin-group-dot" style="background:${c}"></div>
      <div>
        <div class="pin-group-name" style="color:${c}">${escHtml(n)}</div>
        <div class="pin-group-loc">${escHtml(p.location_name)}</div>
        ${noteText ? `<div class="pin-group-note">${escHtml(noteText.length > 100 ? noteText.slice(0, 100) + '…' : noteText)}</div>` : ''}
      </div>
    </div>`;
  }).join('');
  portal.innerHTML = `<div class="pin-group-portal-title"><span>${groupPins.length} items at this spot</span><button class="pin-group-portal-close" onclick="closePinGroupPortal()">✕</button></div>${items}`;
  const vpH   = window.innerHeight, estH = 40 + groupPins.length * 60;
  let top     = anchorRect.bottom + 8;
  if (top + estH > vpH - 20) top = Math.max(10, anchorRect.top - estH - 8);
  let left    = anchorRect.left - 20;
  if (left + 280 > window.innerWidth - 10) left = window.innerWidth - 290;
  left        = Math.max(10, left);
  portal.style.top  = top  + 'px';
  portal.style.left = left + 'px';
  root.innerHTML = ''; root.appendChild(portal);
}

function renderMapCanvas(mapId) {
  const map  = dbMaps.find(m => m.id === mapId); if (!map) return;
  const wrap = document.getElementById(`mapwrap-${mapId}`); if (!wrap) return;
  const W = map.coord_width, H = map.coord_height;

  const needMats        = totalMats();
  const relevantMatKeys = new Set(Object.keys(needMats).filter(k => !k.startsWith('_')));
  for (const [gKey, gDef] of Object.entries(EXP_GROUPS)) { if (needMats[gDef.rawKey]) gDef.keys.forEach(k => relevantMatKeys.add(k)); }
  const relevantPins    = map.pins.filter(pin => relevantMatKeys.size === 0 || relevantMatKeys.has(pin.material_id));

  if (map.image_url) {
    const groups   = groupPins(relevantPins);
    const pinsHtml = groups.map((group, gIdx) => {
      const groupId  = `g-${mapId}-${gIdx}`;
      const isMulti  = group.length > 1;
      if (!isMulti) {
        const pin    = group[0], matId = pin.material_id;
        const color  = getMatColor(matId), name = getMatName(matId);
        const shortName = shortenMatName(name);
        const isHL   = highlightedMat === matId, isDim = highlightedMat && !isHL;
        const borderCol = isHL ? color : 'rgba(255,255,255,0.18)';
        const glow   = isHL ? `box-shadow:0 0 12px ${color}55;` : '';
        return `<div class="user-pin ${isHL ? 'highlighted' : ''} ${isDim ? 'dimmed' : ''}" data-pin-mat="${matId}" style="left:${pin.x}px;top:${pin.y}px;border-color:${borderCol};${glow}" onclick="onPinClick('${matId}','${escHtml(pin.location_name)}','${escHtml(pin.note || '')}')">
          <div class="user-pin-dot" style="background:${color}${isHL ? `;box-shadow:0 0 5px ${color}` : ''}"></div>
          <div><div class="user-pin-text" style="color:${color}">${escHtml(shortName)}</div><div class="user-pin-sub">${escHtml(pin.location_name)}</div></div>
        </div>`;
      }
      let primaryIdx = 0;
      if (highlightedMat) { const hlIdx = group.findIndex(p => p.material_id === highlightedMat); if (hlIdx >= 0) primaryIdx = hlIdx; }
      const primary   = group[primaryIdx];
      const cx        = Math.round(group.reduce((s, p) => s + p.x, 0) / group.length);
      const cy        = Math.round(group.reduce((s, p) => s + p.y, 0) / group.length);
      const matId     = primary.material_id, color = getMatColor(matId);
      const name      = getMatName(matId), shortName = shortenMatName(name);
      const isHL      = highlightedMat && group.some(p => p.material_id === highlightedMat);
      const isDim     = highlightedMat && !isHL;
      const borderCol = isHL ? color : 'rgba(255,255,255,0.18)';
      const glow      = isHL ? `box-shadow:0 0 12px ${color}55;` : '';
      const isOpen    = openPinGroupData?.groupId === groupId;
      return `<div class="user-pin grouped ${isHL ? 'highlighted' : ''} ${isDim ? 'dimmed' : ''} ${isOpen ? 'open' : ''}" data-pin-mat="${matId}" data-group-id="${groupId}" style="left:${cx}px;top:${cy}px;border-color:${borderCol};${glow}" onclick="onGroupedPinClick(event,'${groupId}',this)">
        <div class="user-pin-dot" style="background:${color}${isHL ? `;box-shadow:0 0 5px ${color}` : ''}"></div>
        <div><div class="user-pin-text" style="color:${color}">${escHtml(shortName)}</div><div class="user-pin-sub">${escHtml(primary.location_name)}</div></div>
        <div class="user-pin-stack-count">${group.length}</div>
        <div class="user-pin-stack-caret">▾</div>
      </div>`;
    }).join('');

    wrap._pinGroups = {};
    groups.forEach((group, gIdx) => { const groupId = `g-${mapId}-${gIdx}`; if (group.length > 1) wrap._pinGroups[groupId] = group; });

    wrap.innerHTML = `<div class="map-viewport" id="map-vp-${mapId}"><div class="map-inner" id="map-inner-${mapId}" style="width:${W}px;height:${H}px;position:relative">
      <img src="${map.image_url}" style="position:absolute;inset:0;width:${W}px;height:${H}px;object-fit:cover;pointer-events:none;display:block" loading="lazy">
      ${pinsHtml}
    </div></div>`;

    const newWrap = document.getElementById(`mapwrap-${mapId}`);
    if (newWrap) newWrap._pinGroups = wrap._pinGroups || {};

    const vp = document.getElementById(`map-vp-${mapId}`);
    if (vp) vp.addEventListener('mousemove', e => {
      const inner = document.getElementById(`map-inner-${mapId}`); if (!inner) return;
      const rect = inner.getBoundingClientRect();
      const x    = Math.round((e.clientX - rect.left) / mapView.scale);
      const y    = Math.round((e.clientY - rect.top)  / mapView.scale);
      document.getElementById('map-coords').textContent = `x:${x} y:${y}`;
    });

    document.getElementById('map-zoom-controls').style.display = 'flex';
    document.getElementById('map-coords').style.display        = 'block';

  } else {
    // Fallback: no image, show card list
    const fallbackSVG = buildFallbackMapSVG(map);
    const pinListHtml = relevantPins.length
      ? `<div style="display:flex;flex-wrap:wrap;gap:6px;padding:14px">${relevantPins.map(pin => {
          const color = getMatColor(pin.material_id), name = getMatName(pin.material_id);
          const isHL  = highlightedMat === pin.material_id;
          return `<div style="background:var(--surface);border:1px solid ${isHL ? color : 'var(--border2)'};background:${isHL ? color + '12' : 'var(--surface)'};padding:7px 11px;min-width:150px;cursor:pointer" onclick="onPinClick('${pin.material_id}','${escHtml(pin.location_name)}','${escHtml(pin.note || '')}')">
            <div style="font-family:var(--font-display);font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${color};margin-bottom:2px">${escHtml(name)}</div>
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--muted)">${escHtml(pin.location_name)}</div>
          </div>`;
        }).join('')}</div>`
      : `<div style="padding:20px;font-family:var(--font-mono);font-size:10px;color:var(--muted);text-align:center">No pins match your current needs.</div>`;
    wrap.innerHTML = `<div style="height:100%;overflow-y:auto;">
      <div style="position:relative;height:160px;overflow:hidden;flex-shrink:0;">${fallbackSVG}</div>
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--muted);letter-spacing:0.14em;text-transform:uppercase;padding:10px 14px 4px">Pin locations</div>
      ${pinListHtml}
    </div>`;
    document.getElementById('map-zoom-controls').style.display = 'none';
    document.getElementById('map-coords').style.display        = 'none';
  }
  updateMapTransform();
  renderMapLegend(mapId);
}

function shortenMatName(name) {
  return name
    .replace(' Sample 4', '').replace(' Tube', '').replace(' Lattice', '').replace(' Fluid', '').replace(' Nanoflake', '')
    .replace(' Record', '').replace(' Carrier', '')
    .replace('Elementary ', 'Elem. ').replace('Advanced ', 'Adv. ');
}

function onPinClick(matId, zoneName, note) {
  if (highlightedMat === matId) { clearHighlight(); return; }
  highlightedMat = matId; renderMapFilters(); renderNeed();
  if (activeMapId) renderMapCanvas(activeMapId);
  const map = dbMaps.find(m => m.id === activeMapId);
  if (map) updateInfoBar(map, matId);
  showDeselect();
}

function onGroupedPinClick(event, groupId, pinEl) {
  event.stopPropagation();
  if (openPinGroupData?.groupId === groupId) { closePinGroupPortal(); if (activeMapId) renderMapCanvas(activeMapId); return; }
  const wrap         = document.getElementById(`mapwrap-${activeMapId}`);
  const groupPinsArr = (wrap?._pinGroups?.[groupId]) || [];
  openPinGroupPortal(groupId, groupPinsArr, pinEl);
  if (groupPinsArr.length) {
    highlightedMat = groupPinsArr[0].material_id;
    renderMapFilters(); renderNeed();
    const map = dbMaps.find(m => m.id === activeMapId);
    if (map) updateInfoBar(map, highlightedMat);
    showDeselect();
  }
  if (activeMapId) renderMapCanvas(activeMapId);
}

document.addEventListener('click', e => {
  if (!openPinGroupData) return;
  const portal = document.querySelector('.pin-group-portal');
  const isPin  = e.target.closest('.user-pin');
  if (!portal?.contains(e.target) && !isPin) { closePinGroupPortal(); if (activeMapId) renderMapCanvas(activeMapId); }
});

function updateInfoBar(map, matId) {
  const bar = document.getElementById('map-info-bar');
  if (!matId || matId !== highlightedMat) { bar.classList.remove('visible'); return; }
  const color = getMatColor(matId), name = getMatName(matId);
  const pins  = map.pins.filter(p => p.material_id === matId);
  if (!pins.length) { bar.classList.remove('visible'); return; }
  document.getElementById('map-info-title-text').innerHTML = `<span style="color:${color}">●</span> ${escHtml(name)} — ${escHtml(map.name)} farming spots`;
  const groups = groupPins(pins);
  document.getElementById('map-info-cards').innerHTML = groups.map(grp => {
    const displayNote = (grp[0].note?.trim()) ? grp[0].note : (dbMatsById[matId]?.farming_note || 'See map for details');
    let innerPinList  = '';
    if (grp.length > 1) {
      innerPinList = `<div class="map-info-pin-list">` + grp.map(p => {
        const c2 = getMatColor(p.material_id), n2 = getMatName(p.material_id);
        const pNote = p.note?.trim() ? p.note : '';
        return `<div class="map-info-pin-item">
          <div class="map-info-pin-dot" style="background:${c2}"></div>
          <div><div class="map-info-pin-name" style="color:${c2}">${escHtml(n2)}</div>${pNote ? `<div class="map-info-pin-note">${escHtml(pNote)}</div>` : ''}</div>
        </div>`;
      }).join('') + `</div>`;
    }
    return `<div class="map-info-card">
      <div class="map-info-card-zone" style="color:${color}">${escHtml(grp[0].location_name)}</div>
      <div class="map-info-card-desc">${escHtml(displayNote)}</div>
      ${innerPinList}
    </div>`;
  }).join('');
  bar.classList.add('visible');
}

function renderMapLegend(mapId) {
  const map      = dbMaps.find(m => m.id === mapId);
  const legend   = document.getElementById('map-legend');
  const items    = document.getElementById('legend-items');
  const clearBtn = document.getElementById('map-legend-clear');
  if (!map?.pins.length) { legend.classList.remove('visible'); return; }

  const needMats        = totalMats();
  const relevantMatKeys = new Set(Object.keys(needMats).filter(k => !k.startsWith('_')));
  for (const [gKey, gDef] of Object.entries(EXP_GROUPS)) { if (needMats[gDef.rawKey]) gDef.keys.forEach(k => relevantMatKeys.add(k)); }
  const matIds = [...new Set(map.pins.map(p => p.material_id))].filter(k => relevantMatKeys.size === 0 || relevantMatKeys.has(k));
  if (!matIds.length) { legend.classList.remove('visible'); return; }

  legend.classList.add('visible');
  items.innerHTML = matIds.map(k => {
    const color = getMatColor(k), name = shortenMatName(getMatName(k));
    const isHL  = highlightedMat === k, isDim = highlightedMat && !isHL;
    return `<div class="map-legend-item ${isDim ? 'dimmed' : ''}" onclick="highlightMat('${k}')">
      <div class="map-legend-dot" style="background:${color};${isHL ? `box-shadow:0 0 5px ${color}` : ''}"></div>
      <div class="map-legend-name" style="${isHL ? `color:${color}` : ''}"> ${escHtml(name)}</div>
    </div>`;
  }).join('');
  clearBtn.classList.toggle('visible', !!highlightedMat);
}

function buildFallbackMapSVG(map) {
  const W = map.coord_width, H = map.coord_height;
  return `<svg width="100%" height="160" style="display:block;pointer-events:none" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#0b1510"/>
    <defs><pattern id="mg${map.id.slice(0,8)}" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(0,196,163,0.05)" stroke-width="0.6"/></pattern></defs>
    <rect width="${W}" height="${H}" fill="url(#mg${map.id.slice(0,8)})"/>
    <text x="${W/2}" y="${H/2}" text-anchor="middle" font-family="Rajdhani,sans-serif" font-size="28" font-weight="700" fill="rgba(255,255,255,0.04)" letter-spacing="6">${escHtml(map.name.toUpperCase())}</text>
  </svg>`;
}

function setupMapInteraction() {
  const area = document.getElementById('map-area');
  let drag = false, lx = 0, ly = 0, movedDuringDrag = false;

  // Mouse
  area.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    drag = true; lx = e.clientX; ly = e.clientY; movedDuringDrag = false;
    area.style.cursor = 'grabbing'; e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!drag) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedDuringDrag = true;
    mapView.tx += dx; mapView.ty += dy; lx = e.clientX; ly = e.clientY;
    updateMapTransform();
  });
  window.addEventListener('mouseup', () => { if (!drag) return; drag = false; const a = document.getElementById('map-area'); if (a) a.style.cursor = ''; });

  // Touch
  let touchStart = null, touchLastDist = null;
  area.addEventListener('touchstart', e => {
    if (e.touches.length === 1) { touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: mapView.tx, ty: mapView.ty }; movedDuringDrag = false; }
    else if (e.touches.length === 2) { touchLastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }
    e.preventDefault();
  }, { passive: false });
  area.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && touchStart) {
      const dx = e.touches[0].clientX - touchStart.x, dy = e.touches[0].clientY - touchStart.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) movedDuringDrag = true;
      mapView.tx = touchStart.tx + dx; mapView.ty = touchStart.ty + dy; updateMapTransform();
    } else if (e.touches.length === 2 && touchLastDist != null) {
      const dist   = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const factor = dist / touchLastDist;
      const cx     = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy     = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const rect   = area.getBoundingClientRect();
      mapView.tx   = (cx - rect.left) + (mapView.tx - (cx - rect.left)) * factor;
      mapView.ty   = (cy - rect.top)  + (mapView.ty - (cy - rect.top))  * factor;
      mapView.scale = Math.max(0.15, Math.min(6, mapView.scale * factor));
      touchLastDist = dist; updateMapTransform();
    }
    e.preventDefault();
  }, { passive: false });
  area.addEventListener('touchend', e => {
    if (e.touches.length === 0) {
      if (!movedDuringDrag && touchStart) clearHighlight();
      touchStart = null; touchLastDist = null;
    }
  });

  area.addEventListener('click', e => {
    if (e.target.closest('.user-pin'))         return;
    if (e.target.closest('.map-legend'))        return;
    if (e.target.closest('.map-zoom-controls')) return;
    if (!movedDuringDrag) clearHighlight();
  });
  area.addEventListener('wheel', e => {
    e.preventDefault();
    const rect   = area.getBoundingClientRect();
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    mapView.tx   = (e.clientX - rect.left) + (mapView.tx - (e.clientX - rect.left)) * factor;
    mapView.ty   = (e.clientY - rect.top)  + (mapView.ty - (e.clientY - rect.top))  * factor;
    mapView.scale = Math.max(0.15, Math.min(6, mapView.scale * factor));
    updateMapTransform();
  }, { passive: false });
}

function updateMapTransform() {
  if (!activeMapId) return;
  const inner = document.getElementById(`map-inner-${activeMapId}`); if (!inner) return;
  inner.style.transform       = `translate(${mapView.tx}px,${mapView.ty}px) scale(${mapView.scale})`;
  inner.style.transformOrigin = '0 0';
}
function mapZoom(factor) {
  const area = document.getElementById('map-area'), rect = area.getBoundingClientRect();
  const cx = rect.width / 2, cy = rect.height / 2;
  mapView.tx    = cx + (mapView.tx - cx) * factor;
  mapView.ty    = cy + (mapView.ty - cy) * factor;
  mapView.scale = Math.max(0.15, Math.min(6, mapView.scale * factor));
  updateMapTransform();
}
function mapReset() { mapView = { tx: 0, ty: 0, scale: 1 }; updateMapTransform(); }
function highlightMat(matId) {
  if (highlightedMat === matId) { clearHighlight(); return; }
  highlightedMat = matId; renderMapFilters(); renderNeed();
  if (activeMapId) { renderMapCanvas(activeMapId); const map = dbMaps.find(m => m.id === activeMapId); if (map) updateInfoBar(map, matId); }
  showDeselect();
}

function renderMapFilters() {
  const bar     = document.getElementById('map-filter-bar');
  const chipsEl = document.getElementById('mat-chips');
  if (!plans.length || !dbMaps.length) { bar.classList.remove('visible'); return; }
  bar.classList.add('visible');
  const needMats        = totalMats();
  const relevantMatKeys = new Set(Object.keys(needMats).filter(k => !k.startsWith('_')));
  for (const [gKey, gDef] of Object.entries(EXP_GROUPS)) { if (needMats[gDef.rawKey]) gDef.keys.forEach(k => relevantMatKeys.add(k)); }
  const matsWithPins = new Set();
  for (const map of dbMaps) for (const pin of map.pins) matsWithPins.add(pin.material_id);
  chipsEl.innerHTML = [...relevantMatKeys].filter(k => MATS[k] && matsWithPins.has(k)).map(k => {
    const mat    = MATS[k], active = highlightedMat === k ? 'active' : '';
    return `<div class="mat-chip ${active}" onclick="highlightMat('${k}')"><div class="mat-chip-dot" style="background:${mat.color}"></div>${mat.name.split(' ')[0]}</div>`;
  }).join('');
}


// ── RESIZABLE PANELS (desktop only) ──────────────────────────────────────
function setupResize() {
  setupResizeHandle('resize-1', 'left-panel', 220, 550);
  setupResizeHandle('resize-2', 'mid-panel',  180, 600);
}
function setupResizeHandle(handleId, panelId, minW, maxW) {
  const handle  = document.getElementById(handleId);
  const panelEl = document.getElementById(panelId);
  let dragging = false, startX = 0, startW = 0;
  handle.addEventListener('mousedown', e => {
    if (e.button !== 0 || isMobile()) return;
    dragging = true; startX = e.clientX; startW = panelEl.getBoundingClientRect().width;
    handle.classList.add('dragging'); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    panelEl.style.width = Math.max(minW, Math.min(maxW, startW + (e.clientX - startX))) + 'px';
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false; handle.classList.remove('dragging'); document.body.style.cursor = ''; document.body.style.userSelect = '';
  });
}


// ── MODAL ─────────────────────────────────────────────────────────────────
function openModal(type) {
  modalType    = type;
  activeFilter = 'all';
  document.getElementById('modal-title').textContent  = type === 'operator' ? 'Add Operator' : 'Add Weapon';
  document.getElementById('modal-search').value       = '';
  buildFilterButtons();
  renderModalList(type === 'operator' ? OPERATORS : WEAPONS);
  document.getElementById('modal').classList.add('open');
  setTimeout(() => document.getElementById('modal-search').focus(), 50);
}
function closeModal()              { document.getElementById('modal').classList.remove('open'); }
function handleOverlayClick(e)     { if (e.target === document.getElementById('modal')) closeModal(); }

function buildFilterButtons() {
  const fb = document.getElementById('filter-buttons');
  if (modalType === 'operator') {
    const elements = ['All', 'Heat', 'Cryo', 'Electric', 'Physical', 'Nature'];
    const classes  = ['Striker', 'Guard', 'Caster', 'Defender', 'Supporter', 'Vanguard'];
    fb.innerHTML   =
      elements.map(e => `<button class="filter-btn ${activeFilter === e.toLowerCase() || activeFilter === e ? 'active' : ''}" onclick="setFilter('${e.toLowerCase()}')">${e}</button>`).join('') +
      '<span style="color:var(--border2);padding:0 4px">|</span>' +
      classes.map(c  => `<button class="filter-btn ${activeFilter === c.toLowerCase() ? 'active' : ''}" onclick="setFilter('${c.toLowerCase()}')">${c}</button>`).join('');
  } else {
    const types = ['All', 'Sword', 'Gt. Sword', 'Polearm', 'Arts Unit', 'Handcannon'];
    const rars  = ['6★', '5★', '4★','3★'];
    fb.innerHTML =
      types.map(t => `<button class="filter-btn ${activeFilter === t.toLowerCase() ? 'active' : ''}" onclick="setFilter('${t.toLowerCase()}')">${t}</button>`).join('') +
      '<span style="color:var(--border2);padding:0 4px">|</span>' +
      rars.map(r  => `<button class="filter-btn ${activeFilter === r.replace('★', 'star') ? 'active' : ''}" onclick="setFilter('${r.replace('★', 'star')}')">${r}</button>`).join('');
  }
}
function setFilter(f)  { activeFilter = f; buildFilterButtons(); filterModal(); }
function filterModal() {
  const q      = document.getElementById('modal-search').value.toLowerCase();
  const source = modalType === 'operator' ? OPERATORS : WEAPONS;
  let filtered = source;
  if (activeFilter !== 'all') filtered = filtered.filter(x => {
    const el   = (x.element || '').toLowerCase();
    const cls  = (x.cls     || '').toLowerCase();
    const type = (x.type    || '').toLowerCase();
    return el === activeFilter || cls === activeFilter || type === activeFilter || (x.rarity + 'star') === activeFilter;
  });
  if (q) filtered = filtered.filter(x => x.name.toLowerCase().includes(q));
  renderModalList(filtered);
}
function renderModalList(items) {
  const list = document.getElementById('modal-list');
  if (!items.length) { list.innerHTML = '<p style="grid-column:1/-1;font-size:12px;color:var(--muted);font-family:var(--font-mono);padding:8px">No results</p>'; return; }
  list.innerHTML = items.map(item => {
    const isOp   = modalType === 'operator';
    const el     = isOp ? item.element : null;
    const elColor = getElColor(el);
    const inPlan = plans.some(p => p.item.id === item.id && p.type === modalType);
    let iconContent;
    if (isOp) {
      const imgPath = getCharImg(item.name);
      iconContent   = imgPath ? `<img src="${imgPath}" alt="${item.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;object-position:top center;">` : (EL_ICON[el] || OP_ICON);
    } else {
      const wpnImg  = getWeaponImg(item.id);
      iconContent   = wpnImg  ? `<img src="${wpnImg}"  alt="${item.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;object-position:center;">` : WPN_ICON;
    }
    return `<button class="modal-item" onclick='selectItem(${JSON.stringify(item).replace(/'/g, "&#39;")})' style="${inPlan ? 'border-color:rgba(0,196,163,0.4);background:rgba(0,196,163,0.05)' : ''}">
      <div class="modal-item-icon" style="${el ? `border-color:${elColor}40;` : ''}">${iconContent}</div>
      <div>
        <div class="modal-item-name">${item.name}${inPlan ? ' <span style="color:var(--accent);font-size:9px">✓</span>' : ''}</div>
        <div class="modal-item-sub">${isOp ? `${item.cls} · ${item.element}` : item.type} · ${item.rarity}★</div>
      </div>
    </button>`;
  }).join('');
}
function selectItem(item) { addPlan(modalType, item); }


// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closePinGroupPortal(); clearHighlight(); closeConfirm(); }
});




// ── INIT ──────────────────────────────────────────────────────────────────
window.addEventListener('load', async () => {
  setupResize();
  applyMobilePanelVisibility();
  await initAuth();
  await Promise.all([loadDbData(), loadCharImages(), loadWeaponImages()]);
  renderAll();
  initMaps();
  applyMobilePanelVisibility();
});
