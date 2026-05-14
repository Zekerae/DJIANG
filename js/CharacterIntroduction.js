/* ═══════════════════════════════════════════════════════════════════
   ARKNIGHTS: ENDFIELD — CHARACTER TEMPLATE  |  app.js
   Supabase-powered dynamic character page
═══════════════════════════════════════════════════════════════════ */

// ─── SUPABASE CONFIG ─────────────────────────────────────────────
const SUPABASE_URL      = 'https://vjcucliqjjljhgbqshmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3VjbGlxampsamhnYnFzaG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTU3MTIsImV4cCI6MjA5NDA3MTcxMn0.qq7tRmLpRjTv0y4dZxCjcEQ48rTiY5ZV1xunr32kh10';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function emojiToTwemojiUrl(emoji) {
  const codePoints = [...emoji]
    .map(c => c.codePointAt(0).toString(16))
    .filter(cp => cp !== 'fe0f');          
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoints.join('-')}.svg`;
}

function iconImg(srcOrEmoji, size = 20, extraClass = '') {
  if (!srcOrEmoji || typeof srcOrEmoji !== 'string') return '';
  const cls = extraClass ? ` class="${extraClass}"` : '';

  if (srcOrEmoji.includes('/') || srcOrEmoji.includes('.') || srcOrEmoji.startsWith('http')) {
    return `<img src="${srcOrEmoji}" width="${size}" height="${size}" alt="icon" loading="lazy"${cls}>`;
  }

  const isEmoji = /\p{Emoji_Presentation}/u.test(srcOrEmoji) ||
                  (/\p{Emoji}/u.test(srcOrEmoji) && srcOrEmoji.codePointAt(0) > 127);
  if (!isEmoji) {
    return `<span style="font-size:${Math.round(size * 0.75)}px;line-height:1"${cls}>${srcOrEmoji}</span>`;
  }
  const url = emojiToTwemojiUrl(srcOrEmoji);
  return `<img src="${url}" width="${size}" height="${size}" alt="${srcOrEmoji}" loading="lazy"${cls} onerror="this.replaceWith(document.createTextNode('${srcOrEmoji}'))">`;
}

const DEFAULT_MAT_NAMES = {
  // Operator Promotion — Protodisk series
  proto1:'Protodisk', proto2:'Protoset', proto3:'Triphasic Nanoflake',
  // Operator Promotion — Fungus series (character-specific, overridden per char)
  fun1:'Pink Bolete', fun2:'Red Bolete', fun3:'Ruby Bolete',
  // Operator Promotion — Steel series (character-specific, overridden per char)
  steel1:'Bloodcap', steel2:'Cosmagaric', steel3:'D96 Steel Sample 4',
  // Skill Leveling — Books / Protoprism
  book1:'False Aggela', book2:'False Aggela', pri1:'Protoprism',
  // Skill Leveling — Dendra series
  den1:'Kalkodendra', den2:'Chrysodendra', den3:'Vitrodendra',
  // Mastery materials (Rank 8–12)
  mastery_proto:'Protohedron', mastery_jade:'Blighted Jadeleaf',
  mastery_nano:'Triphasic Nanoflake', mastery_mark:'Mark of Perseverance'
};

const DEFAULT_MAT_ICONS = {
  gold: '🪙', exp: '📼',
  // Protodisk series
  proto1: '💿', proto2: '💽', proto3: '🧬',
  // Fungus / character drop series (T1–T3)
  fun1: '🍄', fun2: '🌺', fun3: '🔴',
  // Steel / combat drop series (T1–T3)
  steel1: '🥀', steel2: '🍂', steel3: '⚙️',
  // Skill books / prisms
  book1: '🔷', book2: '🔷', pri1: '💠',
  // Dendra series
  den1: '🌱', den2: '🌿', den3: '🍃',
  // Mastery
  mastery_proto: '🧊', mastery_jade: '🍁', mastery_nano: '🧬', mastery_mark: '🏅'
};

const DEFAULT_LV_REQS = [
  { lv:20, gold:3000,   exp:15,  p1:15, p2:0,  p3:0,  f1:5,  f2:0,  f3:0,  s1:10, s2:0,  s3:0  },
  { lv:40, gold:7000,   exp:40,  p1:25, p2:5,  p3:0,  f1:10, f2:0,  f3:0,  s1:15, s2:0,  s3:0  },
  { lv:50, gold:12000,  exp:75,  p1:0,  p2:15, p3:0,  f1:0,  f2:5,  f3:0,  s1:0,  s2:10, s3:0  },
  { lv:60, gold:18000,  exp:120, p1:0,  p2:25, p3:5,  f1:0,  f2:10, f3:0,  s1:0,  s2:15, s3:0  },
  { lv:70, gold:26000,  exp:200, p1:0,  p2:0,  p3:15, f1:0,  f2:0,  f3:5,  s1:0,  s2:0,  s3:10 },
  { lv:80, gold:34000,  exp:350, p1:0,  p2:0,  p3:25, f1:0,  f2:0,  f3:10, s1:0,  s2:0,  s3:15 },
  { lv:90, gold:44000,  exp:550, p1:0,  p2:0,  p3:40, f1:0,  f2:0,  f3:15, s1:0,  s2:0,  s3:25 }
];

const DEFAULT_SK_REQS = [
  { rk:2,  gold:1000,  b1:5,  b2:0,  pr1:5,  d1:2, d2:0, d3:0, mp:0,  mt:0, mb:0, mo:0 },
  { rk:3,  gold:2000,  b1:10, b2:0,  pr1:10, d1:4, d2:0, d3:0, mp:0,  mt:0, mb:0, mo:0 },
  { rk:4,  gold:4000,  b1:15, b2:5,  pr1:15, d1:6, d2:0, d3:0, mp:0,  mt:0, mb:0, mo:0 },
  { rk:5,  gold:6000,  b1:0,  b2:10, pr1:20, d1:0, d2:3, d3:0, mp:0,  mt:0, mb:0, mo:0 },
  { rk:6,  gold:8000,  b1:0,  b2:15, pr1:25, d1:0, d2:5, d3:0, mp:0,  mt:0, mb:0, mo:0 },
  { rk:7,  gold:12000, b1:0,  b2:20, pr1:30, d1:0, d2:7, d3:0, mp:0,  mt:0, mb:0, mo:0 },
  { rk:8,  gold:16000, b1:0,  b2:25, pr1:0,  d1:0, d2:0, d3:3, mp:5,  mt:0, mb:0, mo:0 },
  { rk:9,  gold:20000, b1:0,  b2:30, pr1:0,  d1:0, d2:0, d3:5, mp:10, mt:0, mb:0, mo:0 },
  { rk:10, gold:24000, b1:0,  b2:35, pr1:0,  d1:0, d2:0, d3:0, mp:8,  mt:4, mb:1, mo:0 },
  { rk:11, gold:30000, b1:0,  b2:40, pr1:0,  d1:0, d2:0, d3:0, mp:12, mt:6, mb:2, mo:1 },
  { rk:12, gold:40000, b1:0,  b2:50, pr1:0,  d1:0, d2:0, d3:0, mp:16, mt:8, mb:3, mo:1 }
];

let CHAR = null;
let lvlReqs  = DEFAULT_LV_REQS;
let skReqs   = DEFAULT_SK_REQS;
let matNames = {...DEFAULT_MAT_NAMES};
let matIcons = {...DEFAULT_MAT_ICONS};

const ELEMENT_PALETTES = {
  heat:     { primary:'#c94020', text:'#ff7a5c', bg:'rgba(201,64,32,0.13)',  bg2:'rgba(201,64,32,0.06)',  border:'rgba(201,64,32,0.34)',  glow:'rgba(201,64,32,0.24)' },
  cryo:     { primary:'#2672b8', text:'#7ec6ff', bg:'rgba(38,114,184,0.13)', bg2:'rgba(38,114,184,0.06)', border:'rgba(38,114,184,0.34)', glow:'rgba(38,114,184,0.22)' },
  nature:   { primary:'#2a8c52', text:'#6ddc9a', bg:'rgba(42,140,82,0.13)',  bg2:'rgba(42,140,82,0.06)',  border:'rgba(42,140,82,0.34)',  glow:'rgba(42,140,82,0.22)' },
  electric: { primary:'#b88a10', text:'#ffd257', bg:'rgba(184,138,16,0.13)', bg2:'rgba(184,138,16,0.06)', border:'rgba(184,138,16,0.34)', glow:'rgba(184,138,16,0.22)' },
  physical: { primary:'#6272a0', text:'#b0bedd', bg:'rgba(98,114,160,0.13)', bg2:'rgba(98,114,160,0.06)', border:'rgba(98,114,160,0.34)', glow:'rgba(98,114,160,0.20)' },
};

function elementToPaletteKey(element) {
  if (!element) return null;
  const e = element.toLowerCase().trim();
  if (['heat','fire','flame'].includes(e))                         return 'heat';
  if (['cryo','ice','frost','cold'].includes(e))                   return 'cryo';
  if (['nature','grass','wood','forest'].includes(e))              return 'nature';
  if (['electric','lightning','thunder','shock'].includes(e))      return 'electric';
  if (['physical','null','none','steel'].includes(e))              return 'physical';
  return null;
}

function applyTheme(elementOrHex) {
  const r   = document.documentElement;
  const key = elementToPaletteKey(elementOrHex);
  let palette;
  if (key) {
    palette = ELEMENT_PALETTES[key];
  } else if (elementOrHex && elementOrHex.startsWith('#')) {
    const bigint = parseInt(elementOrHex.replace('#',''), 16);
    const rr = (bigint >> 16) & 255, gg = (bigint >> 8) & 255, bb = bigint & 255;
    palette = {
      primary: elementOrHex,
      text:    `rgb(${Math.min(255,Math.floor(rr*1.35+30))},${Math.min(255,Math.floor(gg*1.35+30))},${Math.min(255,Math.floor(bb*1.35+30))})`,
      bg:      `rgba(${rr},${gg},${bb},0.12)`,
      bg2:     `rgba(${rr},${gg},${bb},0.06)`,
      border:  `rgba(${rr},${gg},${bb},0.32)`,
      glow:    `rgba(${rr},${gg},${bb},0.22)`,
    };
  }
  if (!palette) return;
  r.style.setProperty('--primary',        palette.primary);
  r.style.setProperty('--primary-bg',     palette.bg);
  r.style.setProperty('--primary-bg2',    palette.bg2);
  r.style.setProperty('--primary-border', palette.border);
  r.style.setProperty('--primary-text',   palette.text);
  r.style.setProperty('--primary-glow',   palette.glow);
}

document.addEventListener('DOMContentLoaded', async () => {
  const overlay = document.getElementById('loading-overlay');
  document.getElementById('load-msg').textContent = 'Connecting to Database...';

  const params   = new URLSearchParams(window.location.search);
  const charSlug = params.get('char') || null;

  try {
    const { data: chars, error: listErr } = await db.from('characters').select('id, name').order('name');
    const selector = document.getElementById('char-selector');
    if (!listErr && chars && chars.length > 0) {
      chars.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id; opt.textContent = c.name;
        selector.appendChild(opt);
      });
    }

    const targetId = charSlug || (chars && chars.length > 0 ? chars[0].id : null);
    if (targetId) {
      document.getElementById('load-msg').textContent = 'Loading Operator Data...';
      const { data: char, error: charErr } = await db.from('characters').select('*').eq('id', targetId).single();
      if (!charErr && char) {
        selector.value = targetId;
        renderCharacter(char);
      } else {
        console.error('Character load error:', charErr);
      }
    }
  } catch(e) {
    console.warn('Supabase unavailable:', e);
  }

  updateProfileStats();
  updateSkills();
  recalcDmg();
  recalcMats();
  updateCheckProgress();
  setTimeout(() => overlay.classList.add('hidden'), 900);
});

function navigateToCharacter(id) {
  const url = new URL(window.location.href);
  url.searchParams.set('char', id);
  window.location.href = url.toString();
}

function renderCharacter(char) {
  CHAR = char;

  if (char.lv_mats_override) lvlReqs = char.lv_mats_override;
  else lvlReqs = DEFAULT_LV_REQS;
  if (char.sk_mats_override) skReqs = char.sk_mats_override;
  else skReqs = DEFAULT_SK_REQS;
  
  matNames = Object.assign({...DEFAULT_MAT_NAMES}, char.mat_names || {});
  matIcons = Object.assign({...DEFAULT_MAT_ICONS}, char.mat_icons || {});

  applyTheme(char.theme_color || char.element || 'Heat');

  document.title = `${char.name} — Arknights: Endfield`;
  document.getElementById('page-title').textContent = `${char.name} — Arknights: Endfield`;

  document.getElementById('nav-name').textContent = char.name;

  const avatarEl = document.getElementById('dom-avatar');
  if (char.avatar_img) {
    avatarEl.innerHTML = `<img src="${char.avatar_img}" class="avatar-img">`;
  } else {
    avatarEl.textContent = char.name.charAt(0);
    avatarEl.style.background = char.avatar_bg || 'var(--primary-bg)';
  }

  document.getElementById('dom-name').textContent = char.name;
  document.getElementById('dom-eyebrow').textContent =
    [char.element, char.class, char.faction].filter(Boolean).join(' · ').toUpperCase();
  document.getElementById('dom-quote').textContent = char.quote || '';

  // ─── BANNER LOGIC (Re-inserted) ───
  const bannerEl = document.getElementById('dom-banner');
  if (bannerEl) {
    bannerEl.style.backgroundImage = char.img_path ? `url('${char.img_path}')` : 'none';
  }

  document.getElementById('dom-tags').innerHTML = `
    <span class="tag tag-stars">${iconImg('assets/RarityAssets/StarIcon.png', 13, 'tag-el-icon').repeat(char.rarity || 6)} ${char.rarity || 6}-Star</span>    
    <span class="tag tag-primary">${iconImg(char.icon_element || elementEmoji(char.element), 13, 'tag-el-icon')} ${char.element || ''}</span>
    <span class="tag tag-class">${char.class || ''}</span>
    <span class="tag tag-class">${char.weapon || ''}</span>
    ${char.faction ? `<span class="tag tag-class">${char.faction}</span>` : ''}
  `;

  document.getElementById('dom-pills').innerHTML = `
    <div class="hero-pill">${iconImg(char.icon_star || '⭐', 16, 'has-char-img')}<strong>${char.rarity || 6}-Star</strong></div>
    <div class="hero-pill">${iconImg(char.icon_weapon_type || '⚔️', 16, 'has-char-img')}<strong>${char.weapon || ''}</strong></div>
    <div class="hero-pill">${iconImg(char.icon_role || '🎯', 16, 'has-char-img')}<strong>${char.role || ''}</strong></div>
  `;

  if (char.video_url) {
    document.getElementById('dom-video').src = char.video_url;
    document.getElementById('dom-video-wrap').style.display = '';
  } else {
    document.getElementById('dom-video-wrap').style.display = 'none';
  }

  renderAttributes(char);

  document.getElementById('dom-overview').innerHTML =
      statRow('Element', `<span class="stat-val highlight">${char.element || '—'}</span>`)
    + statRow('Class', char.class)
    + statRow('Weapon', char.weapon)
    + statRow('Role', char.role)
    + statRow('Rarity', `<span class="stat-val highlight-gold">${'★'.repeat(char.rarity || 6)}</span>`)
    + statRow('Tier', `<span class="stat-val highlight-green">${char.tier || '—'}</span>`)
    + (char.voice_en ? statRow('Voice (EN)', char.voice_en) : '')
    + (char.voice_jp ? statRow('Voice (JP)', char.voice_jp) : '');

  renderSkills(char.skills || []);
  renderTalents(char.talents || []);

  document.getElementById('dom-potentials').innerHTML = (char.potentials || []).map((p, i) =>
    `<div class="pot-row">
      ${p.icon ? `<div class="pot-icon">${iconImg(p.icon, 20, 'has-char-img')}</div>` : ''}
      <div class="pot-badge">${p.rank || ('P' + (i+1))}</div>
      <div class="pot-desc"><strong>${p.name}</strong> — ${p.desc}</div>
    </div>`
  ).join('');

  document.getElementById('dom-weapons').innerHTML = (char.weapons || []).map(w => `
    <div class="weapon-card${w.is_best ? ' best' : ''}">
      <div class="weapon-icon">${iconImg(w.icon || '⚔️', 30, 'has-char-img')}</div>
      <div style="flex:1">
        <div class="weapon-name">${w.name}</div>
        <div class="weapon-sub">${w.sub}</div>
      </div>
      <span class="weapon-badge badge-${w.badge || 'alt'}">${badgeLabel(w.badge)}</span>
    </div>
  `).join('');

  if (char.gear_set_name) document.getElementById('dom-gear-title').textContent = `Best Gear — ${char.gear_set_name}`;
  document.getElementById('dom-gear-slots').innerHTML = (char.gear_slots || []).map(g =>
    `<div class="gear-slot">
      <div class="gear-slot-icon">${iconImg(g.icon || '🎒', 28, 'has-char-img')}</div>
      <div class="gear-slot-name">${g.slot}</div>
      <div class="gear-slot-set">${g.set}</div>
      <div class="gear-slot-note">${g.note}</div>
    </div>`
  ).join('');
  if (char.gear_set_bonus) {
    document.getElementById('dom-set-bonus').innerHTML =
      `<div class="talent-name" style="margin-bottom:6px">${char.gear_set_bonus.name}</div>
       <div class="talent-desc">${char.gear_set_bonus.desc}</div>`;
    document.getElementById('dom-set-bonus').style.display = '';
  } else {
    document.getElementById('dom-set-bonus').style.display = 'none';
  }

  document.getElementById('dom-stat-prio').innerHTML = (char.stat_priority || []).map((s, i) =>
    `<div class="prio-row">
      <div class="prio-num">${i + 1}</div>
      <span>${s}</span>
    </div>`
  ).join('');

  const bg = char.beginner || {};
  document.getElementById('dom-beginner-stats').innerHTML =
    statRow('Focus', `<span class="stat-val highlight-gold">${bg.focus || '—'}</span>`)
    + statRow('Early Set', bg.early_set || '—')
    + (bg.set_bonus ? statRow('Set Bonus', bg.set_bonus) : '');
  document.getElementById('dom-beginner-tip').innerHTML = bg.tip ? `<strong>Tip:</strong> ${bg.tip}` : '';

  document.getElementById('dom-synergies').innerHTML = (char.synergies || []).map(s => {
    const valClass = s.color === 'primary' ? 'highlight'
      : s.color === 'green'  ? 'highlight-green'
      : s.color === 'gold'   ? 'highlight-gold'
      : s.color === 'purple' ? 'highlight-purple'
      : s.color === 'blue'   ? 'highlight-blue' : '';
    return `<div class="stat-row">
      <span class="stat-label">${s.label}</span>
      <span class="stat-val ${valClass}">${s.value}</span>
    </div>`;
  }).join('');

  document.getElementById('dom-teams').innerHTML = (char.teams || []).map(t => {
    const tierClass = t.tier === 's' ? 'team-tier-s' : t.tier === 'a' ? 'team-tier-a' : 'team-tier-b';
    const tierLabel = t.tier === 's' ? 'S-TIER' : t.tier === 'a' ? 'A-TIER' : 'B-TIER';
    return `<div class="team-card">
      <div class="team-header">
        <div class="team-name">${t.name}</div>
        <span class="${tierClass}">${tierLabel}</span>
      </div>
      <div class="members">
        ${(t.members || []).map(m => {
          const avatarContent = m.image ? `<img src="${m.image}" alt="${m.name}">` : m.initials;
          return `<div class="member-chip${m.is_core ? ' core' : ''}">
            <div class="member-av" style="background:${m.color || '#555'}">${avatarContent}</div>
            <div><div class="member-name">${m.name}</div><div class="member-role">${m.role}</div></div>
          </div>`;
        }).join('')}
      </div>
      <div class="team-notes">${t.notes}</div>
    </div>`;
  }).join('');

  document.getElementById('c-skill').innerHTML = (char.skill_multipliers || [{label:'Basic Attack — 100%', value:1}]).map(m =>
    `<option value="${m.value}">${m.label}</option>`
  ).join('');

  if (char.calc_primary_default) document.getElementById('c-primary').value = char.calc_primary_default;
  if (char.calc_atk_default)     document.getElementById('c-atk').value     = char.calc_atk_default;
  if (char.calc_atkp_default)    document.getElementById('c-atkp').value    = char.calc_atkp_default;
  if (char.calc_elem_default)    document.getElementById('c-elem').value    = char.calc_elem_default;

  renderLvMats();
  renderSkMats();
  renderSkillTracks(char.skills || []);
  renderChecklist(char);

  updateProfileStats();
  updateSkills();
  recalcDmg();
  recalcMats();
  updateCheckProgress();
}

function statRow(label, val) {
  const v = typeof val === 'string' && val.startsWith('<') ? val
    : `<span class="stat-val">${val || '—'}</span>`;
  return `<div class="stat-row"><span class="stat-label">${label}</span>${v}</div>`;
}

function elementEmoji(el) {
  const map = { Heat:'🔥', Frost:'❄️', Cryo:'❄️', Shock:'⚡', Electric:'⚡', Venom:'☠️', Nature:'🌿', Physical:'⚔️', Null:'' };
  return map[el] || '◈';
}

function badgeLabel(b) {
  const m = { bis:'Best in Slot', alt:'Alternative', f2p:'F2P Alt', good:'5-Star Option' };
  return m[b] || b || 'Option';
}

function renderAttributes(char) {
  const attrMap = [
    { key:'str', label:'Strength',  icon: char.icon_str || '💪', id:'attr-str' },
    { key:'agi', label:'Agility',   icon: char.icon_agi || '🏃', id:'attr-agi' },
    { key:'int', label:'Intellect', icon: char.icon_int || '🧠', id:'attr-int' },
    { key:'wil', label:'Will',      icon: char.icon_wil || '🛡️', id:'attr-wil' }
  ];
  const primary = char.primary_attr || 'int';
  document.getElementById('dom-attr-grid').innerHTML = attrMap.map(a => `
    <div class="attr-row${a.key === primary ? ' primary' : ''}">
      <div class="attr-icon">${iconImg(a.icon, 24, 'has-char-img')}</div>
      <div class="attr-body">
        <div class="attr-label">${a.label}</div>
        <div class="attr-val" id="${a.id}">${char['attr_' + a.key] || 0}</div>
      </div>
    </div>
  `).join('');
}

function renderSkills(skills) {
  document.getElementById('dom-skills').innerHTML = skills.map(s => {
    const multipliersHtml = (s.multipliers && s.multipliers.length)
      ? `<div class="skill-multipliers">
          ${s.multipliers.map(m => `
            <div class="skill-mult-row">
              <span class="skill-mult-label">${m.label.replace(/[\d.]+%/, '')}</span>
              <span class="skill-val highlight" data-base="${m.value}">${(m.value * 100).toFixed(1).replace('.0', '')}%</span>
            </div>
          `).join('')}
        </div>`
      : '';
    return `
    <div class="skill-row">
      <div class="skill-ico">${iconImg(s.icon || '◈', 24, 'has-char-img')}</div>
      <div style="flex:1">
        <div class="skill-name">${s.name}</div>
        <div class="skill-sub">${s.desc}</div>
        ${multipliersHtml}
      </div>
      <div class="skill-type-badge${s.is_sp ? ' sp' : ''}">${s.type || ''}</div>
    </div>`;
  }).join('');
}

function renderTalents(talents) {
  document.getElementById('dom-talents').innerHTML = talents.map(t => `
    <div class="talent-row${t.is_base ? ' base-talent' : ''}">
      <div class="talent-header">
        <div class="talent-icon">${iconImg(t.icon || '◈', 18, 'has-char-img')}</div>
        <div class="talent-name">${t.name}</div>
      </div>
      <div class="talent-desc">${t.desc}</div>
    </div>
  `).join('');
}

function renderLvMats() {
  const m = matNames;
  const i = matIcons;
  document.getElementById('dom-lv-mats').innerHTML = `
    <div class="mat-section-label">Universal Resources</div>
    <div class="mat-grid">
      <div class="mat-card tier-gold"><div class="mat-card-icon">${iconImg(i.gold,26,'has-char-img')}</div><div class="mat-card-val" id="r-lv-gold">0</div><div class="mat-card-label">T-Creds</div></div>
      <div class="mat-card tier-exp"><div class="mat-card-icon">${iconImg(i.exp,26,'has-char-img')}</div><div class="mat-card-val" id="r-lv-exp">0</div><div class="mat-card-label">Combat / Cognitive Records</div></div>
    </div>
    <div class="mat-section-label">Protodisk Series</div>
    <div class="mat-grid">
      <div class="mat-card tier-1"><div class="mat-card-icon">${iconImg(i.proto1,26,'has-char-img')}</div><div class="mat-card-val" id="r-lv-proto1">0</div><div class="mat-card-label">${m.proto1}</div></div>
      <div class="mat-card tier-2"><div class="mat-card-icon">${iconImg(i.proto2,26,'has-char-img')}</div><div class="mat-card-val" id="r-lv-proto2">0</div><div class="mat-card-label">${m.proto2}</div></div>
      <div class="mat-card tier-3"><div class="mat-card-icon">${iconImg(i.proto3,26,'has-char-img')}</div><div class="mat-card-val" id="r-lv-proto3">0</div><div class="mat-card-label">${m.proto3}</div></div>
    </div>
    <div class="mat-section-label">Operator Drops — Fungus Series</div>
    <div class="mat-grid">
      <div class="mat-card tier-1"><div class="mat-card-icon">${iconImg(i.fun1,26,'has-char-img')}</div><div class="mat-card-val" id="r-lv-fun1">0</div><div class="mat-card-label">${m.fun1}</div></div>
      <div class="mat-card tier-2"><div class="mat-card-icon">${iconImg(i.fun2,26,'has-char-img')}</div><div class="mat-card-val" id="r-lv-fun2">0</div><div class="mat-card-label">${m.fun2}</div></div>
      <div class="mat-card tier-3"><div class="mat-card-icon">${iconImg(i.fun3,26,'has-char-img')}</div><div class="mat-card-val" id="r-lv-fun3">0</div><div class="mat-card-label">${m.fun3}</div></div>
    </div>
    <div class="mat-section-label">Operator Drops — Combat Series</div>
    <div class="mat-grid">
      <div class="mat-card tier-1"><div class="mat-card-icon">${iconImg(i.steel1,26,'has-char-img')}</div><div class="mat-card-val" id="r-lv-steel1">0</div><div class="mat-card-label">${m.steel1}</div></div>
      <div class="mat-card tier-2"><div class="mat-card-icon">${iconImg(i.steel2,26,'has-char-img')}</div><div class="mat-card-val" id="r-lv-steel2">0</div><div class="mat-card-label">${m.steel2}</div></div>
      <div class="mat-card tier-3"><div class="mat-card-icon">${iconImg(i.steel3,26,'has-char-img')}</div><div class="mat-card-val" id="r-lv-steel3">0</div><div class="mat-card-label">${m.steel3}</div></div>
    </div>`;
}

function renderSkMats() {
  const m = matNames;
  const i = matIcons;
  document.getElementById('dom-sk-mats').innerHTML = `
    <div class="mat-section-label">Universal Resources</div>
    <div class="mat-grid">
      <div class="mat-card tier-gold"><div class="mat-card-icon">${iconImg(i.gold,26,'has-char-img')}</div><div class="mat-card-val" id="r-sk-gold">0</div><div class="mat-card-label">T-Creds</div></div>
      <div class="mat-card tier-1"><div class="mat-card-icon">${iconImg(i.book1,26,'has-char-img')}</div><div class="mat-card-val" id="r-sk-book1">0</div><div class="mat-card-label">False Aggela (T1)</div></div>
      <div class="mat-card tier-2"><div class="mat-card-icon">${iconImg(i.book2,26,'has-char-img')}</div><div class="mat-card-val" id="r-sk-book2">0</div><div class="mat-card-label">False Aggela (T2)</div></div>
    </div>
    <div class="mat-section-label">Skill Enhancement Materials</div>
    <div class="mat-grid">
      <div class="mat-card tier-1"><div class="mat-card-icon">${iconImg(i.pri1,26,'has-char-img')}</div><div class="mat-card-val" id="r-sk-pri1">0</div><div class="mat-card-label">${m.pri1}</div></div>
      <div class="mat-card tier-1"><div class="mat-card-icon">${iconImg(i.den1,26,'has-char-img')}</div><div class="mat-card-val" id="r-sk-den1">0</div><div class="mat-card-label">${m.den1}</div></div>
      <div class="mat-card tier-2"><div class="mat-card-icon">${iconImg(i.den2,26,'has-char-img')}</div><div class="mat-card-val" id="r-sk-den2">0</div><div class="mat-card-label">${m.den2}</div></div>
      <div class="mat-card tier-3"><div class="mat-card-icon">${iconImg(i.den3,26,'has-char-img')}</div><div class="mat-card-val" id="r-sk-den3">0</div><div class="mat-card-label">${m.den3}</div></div>
    </div>
    <div class="mat-section-label mastery-label">✦ Mastery Materials (Rank 8–12)</div>
    <div class="mat-grid">
      <div class="mat-card tier-4 mastery-card"><div class="mat-card-icon">${iconImg(i.mastery_proto,26,'has-char-img')}</div><div class="mat-card-val" id="r-sk-mastery-proto">0</div><div class="mat-card-label">${m.mastery_proto}</div></div>
      <div class="mat-card tier-4 mastery-card"><div class="mat-card-icon">${iconImg(i.mastery_jade,26,'has-char-img')}</div><div class="mat-card-val" id="r-sk-mastery-jade">0</div><div class="mat-card-label">${m.mastery_jade}</div></div>
      <div class="mat-card tier-4 mastery-card"><div class="mat-card-icon">${iconImg(i.mastery_nano,26,'has-char-img')}</div><div class="mat-card-val" id="r-sk-mastery-nano">0</div><div class="mat-card-label">${m.mastery_nano}</div></div>
      <div class="mat-card tier-4 mastery-card"><div class="mat-card-icon">${iconImg(i.mastery_mark,26,'has-char-img')}</div><div class="mat-card-val" id="r-sk-mastery-mark">0</div><div class="mat-card-label">${m.mastery_mark}</div></div>
    </div>`;
}

function renderSkillTracks(skills) {
  const names = ['Basic Attack','Battle Skill','Combo Skill','Ultimate'];
  document.getElementById('dom-skill-tracks').innerHTML = skills.map((s, i) => {
    const label = names[i] || s.name || ('Skill ' + (i+1));
    return `<div class="skill-track-row">
      <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);width:100px;flex-shrink:0">${label}</div>
      <div class="slider-grid" style="flex:1">
        <div class="calc-row-std" style="margin-bottom:0"><span class="calc-label">Current <span id="sk-${i+1}-c-out" class="highlight">1</span></span><input type="range" id="m-sk-${i+1}-c" min="1" max="12" value="1" step="1" oninput="recalcMats()"></div>
        <div class="calc-row-std" style="margin-bottom:0"><span class="calc-label">Target <span id="sk-${i+1}-t-out" class="highlight">12</span></span><input type="range" id="m-sk-${i+1}-t" min="1" max="12" value="12" step="1" oninput="recalcMats()"></div>
      </div>
    </div>`;
  }).join('');
}

function renderChecklist(char) {
  const shared = char.checklist_shared || [];
  const f2p    = char.checklist_f2p    || [];
  const spend  = char.checklist_spend  || [];
  const el = document.getElementById('dom-checklist');
  el.innerHTML =
    shared.map(c => checkRow(c, '')).join('') +
    f2p.map(c   => checkRow(c, 'route-f2p')).join('') +
    spend.map(c  => checkRow(c, 'route-spend', true)).join('');
}

function checkRow(c, routeClass, hidden = false) {
  return `<div class="check-row${routeClass ? ' ' + routeClass : ''}" onclick="toggleCheck(this)"${hidden ? ' style="display:none"' : ''}>
    <div class="check-box">✓</div>
    <span class="check-label">${c.label}</span>
    <span class="check-cost">${c.cost}</span>
  </div>`;
}

function updateProfileStats() {
  const level = parseInt(document.getElementById('prof-level').value) || 1;
  document.getElementById('prof-level-out').textContent = level;
  if (!CHAR) return;
  const scale = 0.3 + 0.7 * (level / 90);
  ['str','agi','int','wil'].forEach(a => {
    const el = document.getElementById('attr-' + a);
    if (el) el.textContent = Math.floor((CHAR['attr_' + a] || 0) * scale);
  });
}

function updateSkills() {
  const rank = parseInt(document.getElementById('prof-rank').value) || 1;
  document.getElementById('prof-rank-out').textContent = rank;
  const scale = 0.5 + 0.5 * (rank / 12);
  document.querySelectorAll('.skill-val').forEach(el => {
    const base = parseFloat(el.getAttribute('data-base'));
    if (!isNaN(base)) {
      const scaled = base * scale * 100;
      el.textContent = scaled % 1 === 0 ? scaled.toFixed(0) + '%' : scaled.toFixed(1) + '%';
    }
  });
}

function recalcDmg() {
  const level   = parseFloat(document.getElementById('c-level').value)   || 1;
  const primary = parseFloat(document.getElementById('c-primary').value) || 0;
  const baseAtk = parseFloat(document.getElementById('c-atk').value)     || 0;
  const atkPct  = (parseFloat(document.getElementById('c-atkp').value)   || 0) / 100;
  const elemPct = (parseFloat(document.getElementById('c-elem').value)   || 0) / 100;
  const mult    = parseFloat(document.getElementById('c-skill').value)   || 1;
  document.getElementById('c-level-out').textContent = level;
  const lvScale   = 0.45 + (level / 90) * 0.55;
  const primBonus = primary * 2.8;
  const finalAtk  = Math.round((baseAtk + primBonus) * (1 + atkPct) * lvScale);
  const avgDmg    = Math.round(finalAtk * mult * (1 + elemPct));
  document.getElementById('r-atk').textContent = finalAtk.toLocaleString();
  document.getElementById('r-avg').textContent = avgDmg.toLocaleString();
  document.getElementById('t-atk').textContent = finalAtk.toLocaleString();
  document.getElementById('t-dps').textContent = avgDmg.toLocaleString();
}

function recalcMats() {
  const get = id => { const el = document.getElementById(id); return el ? (parseInt(el.value)||1) : 1; };
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val > 0 ? val.toLocaleString() : '—'; };

  let lvC = get('m-lv-c'), lvT = get('m-lv-t');
  if (lvT < lvC) { lvT = lvC; const e = document.getElementById('m-lv-t'); if(e) e.value = lvC; }
  document.getElementById('lv-c-out').textContent = lvC;
  document.getElementById('lv-t-out').textContent = lvT;
  document.getElementById('t-lv-summary').textContent = `Lv ${lvC} → ${lvT}`;

  let l_g=0,l_e=0,l_p1=0,l_p2=0,l_p3=0,l_f1=0,l_f2=0,l_f3=0,l_s1=0,l_s2=0,l_s3=0;
  lvlReqs.forEach(t => {
    if (lvC < t.lv && lvT >= t.lv) {
      l_g+=t.gold; l_e+=t.exp; l_p1+=t.p1; l_p2+=t.p2; l_p3+=t.p3;
      l_f1+=t.f1; l_f2+=t.f2; l_f3+=t.f3; l_s1+=t.s1; l_s2+=t.s2; l_s3+=t.s3;
    }
  });
  set('r-lv-gold',l_g); set('r-lv-exp',l_e);
  set('r-lv-proto1',l_p1); set('r-lv-proto2',l_p2); set('r-lv-proto3',l_p3);
  set('r-lv-fun1',l_f1); set('r-lv-fun2',l_f2); set('r-lv-fun3',l_f3);
  set('r-lv-steel1',l_s1); set('r-lv-steel2',l_s2); set('r-lv-steel3',l_s3);

  const numSkills = CHAR?.skills?.length || 4;
  let s_g=0,s_b1=0,s_b2=0,s_pr1=0,s_d1=0,s_d2=0,s_d3=0,m_p=0,m_t=0,m_b=0,m_m=0;
  for (let i = 1; i <= numSkills; i++) {
    let skC = get(`m-sk-${i}-c`), skT = get(`m-sk-${i}-t`);
    if (skT < skC) { skT = skC; const e = document.getElementById(`m-sk-${i}-t`); if(e) e.value = skC; }
    const co = document.getElementById(`sk-${i}-c-out`); if(co) co.textContent = skC;
    const to = document.getElementById(`sk-${i}-t-out`); if(to) to.textContent = skT;
    skReqs.forEach(t => {
      if (skC < t.rk && skT >= t.rk) {
        s_g+=t.gold; s_b1+=t.b1; s_b2+=t.b2; s_pr1+=t.pr1;
        s_d1+=t.d1; s_d2+=t.d2; s_d3+=t.d3; m_p+=t.mp; m_t+=t.mt; m_b+=t.mb; m_m+=t.mo;
      }
    });
  }
  const sk1c = get('m-sk-1-c'), sk1t = get('m-sk-1-t');
  document.getElementById('t-sk-summary').textContent = `Ranks ${sk1c} → ${sk1t}`;

  set('r-sk-gold',s_g); set('r-sk-book1',s_b1); set('r-sk-book2',s_b2); set('r-sk-pri1',s_pr1);
  set('r-sk-den1',s_d1); set('r-sk-den2',s_d2); set('r-sk-den3',s_d3);
  set('r-sk-mastery-proto',m_p); set('r-sk-mastery-jade',m_b); set('r-sk-mastery-nano',m_t); set('r-sk-mastery-mark',m_m);

  const totalGold = l_g + s_g;
  document.getElementById('t-cost').textContent = totalGold > 1000 ? (totalGold/1000).toFixed(1)+'k' : totalGold;
}

function switchTab(name) {
  const names = ['profile','builds','teams','tracker'];
  document.querySelectorAll('.tab[role="tab"]').forEach((t, i) => {
    t.classList.toggle('active', names[i] === name);
  });
  document.querySelectorAll('.panel').forEach(p => {
    p.classList.toggle('active', p.id === 'panel-' + name);
  });
  if (name === 'tracker') { recalcDmg(); recalcMats(); }
}

function switchRoute(route) {
  document.getElementById('btn-f2p').classList.toggle('active',   route === 'f2p');
  document.getElementById('btn-spend').classList.toggle('active', route === 'spend');
  document.querySelectorAll('.route-f2p').forEach(el  => el.style.display = route === 'f2p'   ? 'flex' : 'none');
  document.querySelectorAll('.route-spend').forEach(el => el.style.display = route === 'spend' ? 'flex' : 'none');
  updateCheckProgress();
}

function toggleCheck(row) {
  row.classList.toggle('done');
  updateCheckProgress();
}
function updateCheckProgress() {
  const rows = [...document.querySelectorAll('.check-row')].filter(r => r.style.display !== 'none');
  const done = rows.filter(r => r.classList.contains('done')).length;
  const fill  = document.getElementById('check-fill');
  const label = document.getElementById('check-label');
  if (fill)  fill.style.width  = rows.length ? `${(done/rows.length)*100}%` : '0%';
  if (label) label.textContent = `${done} / ${rows.length}`;
}