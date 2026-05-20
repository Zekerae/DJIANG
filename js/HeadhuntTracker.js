
/* ════════════════════════════════════
   STATE
════════════════════════════════════ */
let bannerData    = {};
let activeBanner  = null;
let currentFilter = 'all';
let currentPity6  = 0;
let shopUnit      = 'oro';

/* ════════════════════════════════════
   CONSTANTS
════════════════════════════════════ */
const POOL_TYPES = [
  'E_CharacterGachaPoolType_Special',
  'E_CharacterGachaPoolType_Standard',
  'E_CharacterGachaPoolType_Beginner',
  'E_CharacterGachaPoolType_NewHorizon',
  'E_CharacterGachaPoolType_Limited',
];

const POOL_LABELS = {
  E_CharacterGachaPoolType_Special:   'Special Headhunting',
  E_CharacterGachaPoolType_Standard:  'Standard',
  E_CharacterGachaPoolType_Beginner:  'Beginner',
  E_CharacterGachaPoolType_NewHorizon:'New Horizons',
  E_CharacterGachaPoolType_Limited:   'Limited',
};

const ORI_BUNDLES_BASE = [
  { label:'Shard',   huf:399,    ori:12,  firstOri:24   },
  { label:'Chip',    huf:1990,   ori:21,  firstOri:42   },
  { label:'Crystal', huf:5990,   ori:34,  firstOri:68   },
  { label:'Block',   huf:11990,  ori:57,  firstOri:114  },
  { label:'Crate',   huf:19990,  ori:92,  firstOri:184  },
  { label:'Cache',   huf:39990,  ori:194, firstOri:388  },
];

const CURRENCIES = {
  HUF: { name:'HUF — Hungarian Forint',      symbol:'Ft',   rate:1,          decimals:0, symbolAfter:true  },
  USD: { name:'USD — US Dollar',              symbol:'$',    rate:0.00264,    decimals:2  },
  EUR: { name:'EUR — Euro',                   symbol:'€',    rate:0.00243,    decimals:2  },
  GBP: { name:'GBP — British Pound',          symbol:'£',    rate:0.00209,    decimals:2  },
  CAD: { name:'CAD — Canadian Dollar',        symbol:'CA$',  rate:0.00363,    decimals:2  },
  AUD: { name:'AUD — Australian Dollar',      symbol:'A$',   rate:0.00407,    decimals:2  },
  JPY: { name:'JPY — Japanese Yen',           symbol:'¥',    rate:0.398,      decimals:0  },
  CNY: { name:'CNY — Chinese Yuan',           symbol:'¥',    rate:0.01906,    decimals:2  },
  KRW: { name:'KRW — South Korean Won',       symbol:'₩',    rate:3.64,       decimals:0  },
  TWD: { name:'TWD — New Taiwan Dollar',      symbol:'NT$',  rate:0.0853,     decimals:1  },
  HKD: { name:'HKD — Hong Kong Dollar',       symbol:'HK$',  rate:0.0205,     decimals:2  },
  SGD: { name:'SGD — Singapore Dollar',       symbol:'S$',   rate:0.00354,    decimals:2  },
  MYR: { name:'MYR — Malaysian Ringgit',      symbol:'RM',   rate:0.01241,    decimals:2  },
  PHP: { name:'PHP — Philippine Peso',        symbol:'₱',    rate:0.153,      decimals:0  },
  IDR: { name:'IDR — Indonesian Rupiah',      symbol:'Rp',   rate:43.2,       decimals:0  },
  THB: { name:'THB — Thai Baht',              symbol:'฿',    rate:0.0937,     decimals:1  },
  VND: { name:'VND — Vietnamese Dong',        symbol:'₫',    rate:67.2,       decimals:0  },
  BRL: { name:'BRL — Brazilian Real',         symbol:'R$',   rate:0.01529,    decimals:2  },
  MXN: { name:'MXN — Mexican Peso',           symbol:'MX$',  rate:0.0536,     decimals:2  },
  RUB: { name:'RUB — Russian Ruble',          symbol:'₽',    rate:0.2369,     decimals:0  },
  TRY: { name:'TRY — Turkish Lira',           symbol:'₺',    rate:0.0913,     decimals:1  },
  SAR: { name:'SAR — Saudi Riyal',            symbol:'﷼',    rate:0.00990,    decimals:2  },
  AED: { name:'AED — UAE Dirham',             symbol:'د.إ',  rate:0.00969,    decimals:2  },
  PLN: { name:'PLN — Polish Złoty',           symbol:'zł',   rate:0.01039,    decimals:2, symbolAfter:true },
  CZK: { name:'CZK — Czech Koruna',           symbol:'Kč',   rate:0.0607,     decimals:1, symbolAfter:true },
  RON: { name:'RON — Romanian Leu',           symbol:'lei',  rate:0.01208,    decimals:2, symbolAfter:true },
  SEK: { name:'SEK — Swedish Krona',          symbol:'kr',   rate:0.02721,    decimals:2, symbolAfter:true },
  NOK: { name:'NOK — Norwegian Krone',        symbol:'kr',   rate:0.02849,    decimals:2, symbolAfter:true },
  DKK: { name:'DKK — Danish Krone',           symbol:'kr',   rate:0.01812,    decimals:2, symbolAfter:true },
  CHF: { name:'CHF — Swiss Franc',            symbol:'CHF',  rate:0.002362,   decimals:2  },
  NZD: { name:'NZD — New Zealand Dollar',     symbol:'NZ$',  rate:0.00447,    decimals:2  },
  ZAR: { name:'ZAR — South African Rand',     symbol:'R',    rate:0.04837,    decimals:2  },
};

const SHOP_UNIT_CFG = {
  oro:   { hint:'Enter how many <strong style="color:var(--accent)">Oroberyl</strong> you need. 500 = 1 pull · 1 Origeometry = 75 Oroberyl.', label:'Oroberyl needed',    default:5000 },
  pulls: { hint:'Enter number of <strong style="color:var(--accent)">pulls</strong> you need. Each pull costs 500 Oroberyl.',                  label:'Pulls needed',       default:10   },
  ori:   { hint:'Enter how many <strong style="color:var(--accent)">Origeometry</strong> you need. 1 Ori = 75 Oroberyl.',                     label:'Origeometry needed', default:70   },
};

// 🔧 Replace with your actual Vercel deployment URL after deploying
const CORS_PROXIES = [
  url => `https://djiang.vercel.app/api/proxy?url=${encodeURIComponent(url)}`,
];

/* ════════════════════════════════════
   CURRENCY HELPERS
════════════════════════════════════ */
function getCurrencyKey() {
  return document.getElementById('shop-currency').value || 'HUF';
}

function convertPrice(huf) {
  const key = getCurrencyKey();
  const cfg = CURRENCIES[key];
  return huf * cfg.rate;
}

function formatPrice(huf) {
  const key = getCurrencyKey();
  const cfg = CURRENCIES[key];
  const val = huf * cfg.rate;
  const rounded = cfg.decimals === 0 ? Math.round(val) : parseFloat(val.toFixed(cfg.decimals));
  const formatted = rounded.toLocaleString(undefined, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
  return cfg.symbolAfter ? `${formatted} ${cfg.symbol}` : `${cfg.symbol}${formatted}`;
}

function initCurrencySelector() {
  const sel = document.getElementById('shop-currency');
  Object.entries(CURRENCIES).forEach(([code, cfg]) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = cfg.name;
    if (code === 'HUF') opt.selected = true;
    sel.appendChild(opt);
  });
}

function onCurrencyChange() {
  const key = getCurrencyKey();
  const cfg = CURRENCIES[key];
  document.getElementById('currency-note-name').textContent = cfg.name;
  initBundleRef();
  document.getElementById('shop-result').style.display = 'none';
}

/* ════════════════════════════════════
   HELPERS
════════════════════════════════════ */
const getName   = p => p.name || p.itemName || p.item_name || p.charName || p.char_name || 'Unknown';
const getRarity = p => String(p.rarity || p.star || p.stars || p.quality || '3');
const getPool   = p => p.poolType || p.pool_type || p.gachaType || p.gacha_type || p._probePoolType || 'Unknown';

function classifyBanner(key = '') {
  const k = key.toLowerCase();
  if (k.includes('special') || k.includes('limited'))  return 'special';
  if (k.includes('standard'))  return 'standard';
  if (k.includes('beginner'))  return 'beginner';
  if (k.includes('weapon') || k.includes('forge') || k.includes('raft')) return 'weapon';
  if (k.includes('newhorizon') || k.includes('new_horizon')) return 'standard';
  return 'unknown';
}

function resolveLabel(key) {
  if (!key) return 'Unknown Banner';
  return POOL_LABELS[key] || key.replace(/^E_[A-Za-z]+GachaPoolType_/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
}

/* ════════════════════════════════════
   UI HELPERS
════════════════════════════════════ */
function showError(msg) { const b = document.getElementById('errorBox'); b.innerHTML = '⚠ ' + msg.replace(/\n/g,'<br>'); b.style.display = 'block'; }
function hideError()    { document.getElementById('errorBox').style.display = 'none'; }
function setLoading(msg) {
  const box = document.getElementById('loadingBox');
  if (!msg) { box.style.display = 'none'; return; }
  document.getElementById('loadingMsg').textContent = msg;
  box.style.display = 'flex';
}

function toggleEl(bodyId, chevId) {
  document.getElementById(bodyId).classList.toggle('open');
  document.getElementById(chevId).classList.toggle('open');
}
function toggleTip(id) {
  document.getElementById(id + '-body').classList.toggle('open');
  document.getElementById(id + '-chev').classList.toggle('open');
}
function switchMethod(m, btn) {
  document.querySelectorAll('.mtab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.method-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('method-' + m).classList.add('active');
}
function switchInputMode(m, btn) {
  document.querySelectorAll('.itab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.imode').forEach(p => p.classList.remove('active'));
  document.getElementById('imode-' + m).classList.add('active');
  hideError();
}
function switchPageTab(tab) {
  document.querySelectorAll('.page-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById('ptab-' + tab).classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}

/* ════════════════════════════════════
   API / FETCH
════════════════════════════════════ */
async function fetchWithProxy(apiUrl) {
  let lastErr;
  for (const makeProxy of CORS_PROXIES) {
    try {
      const r = await fetch(makeProxy(apiUrl), { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return JSON.parse(await r.text());
    } catch(e) { lastErr = e; }
  }
  try {
    return await (await fetch(apiUrl, { signal: AbortSignal.timeout(8000) })).json();
  } catch(e) { throw lastErr || e; }
}

async function fetchAllPages(token, serverId, poolType) {
  const records = [];
  let seqId = null;
  for (let page = 1; page <= 200; page++) {
    const u = new URL('https://ef-webview.gryphline.com/api/record/char');
    u.searchParams.set('lang', 'en-us');
    u.searchParams.set('pool_type', poolType);
    u.searchParams.set('token', token);
    u.searchParams.set('server_id', String(serverId));
    if (seqId !== null) u.searchParams.set('seq_id', String(seqId));
    setLoading(`Scanning ${resolveLabel(poolType)} — ${records.length} records…`);
    try {
      const data = await fetchWithProxy(u.toString());
      const list = data?.data?.list;
      if (!list?.length) break;
      list.forEach(r => { if (!r._probePoolType) r._probePoolType = poolType; });
      records.push(...list);
      if (list.length < 5) break;
      seqId = list.at(-1).seqId ?? list.at(-1).seq_id ?? null;
      if (!seqId) break;
    } catch(e) { break; }
  }
  return records;
}

/* ════════════════════════════════════
   ENTRY POINTS
════════════════════════════════════ */
async function loadFromUrl() {
  const urlStr = document.getElementById('urlInput').value.trim();
  if (!urlStr || !urlStr.includes('ef-webview.gryphline.com')) {
    showError('Invalid URL. Paste the full link from HGWebview.log or AppData cache (data_1) starting with https://ef-webview.gryphline.com/...');
    return;
  }
  hideError();
  setLoading('Parsing URL…');
  try {
    const parsed   = new URL(urlStr);
    const token    = parsed.searchParams.get('token');
    const serverId = parsed.searchParams.get('server_id') || '2';
    if (!token) { showError('Could not extract token from URL.'); setLoading(null); return; }
    await loadAllBanners(token, serverId);
  } catch(e) {
    showError(`Error: ${e.message}. Re-open pull history in-game for a fresh link.`);
    setLoading(null);
  }
}

async function loadFromToken() {
  const token    = document.getElementById('tokenInput').value.trim();
  const serverId = document.getElementById('serverSelect').value;
  if (!token) { showError('Please enter your token.'); return; }
  hideError();
  await loadAllBanners(token, serverId);
}

async function loadAllBanners(token, serverId) {
  setLoading('Initializing…');
  let allRecords = [];
  for (const poolType of POOL_TYPES) {
    try { allRecords.push(...await fetchAllPages(token, serverId, poolType)); } catch(e) {}
  }
  setLoading(null);
  if (!allRecords.length) {
    showError('No records found.\n• Token may have expired — re-open pull history in-game\n• CORS proxies temporarily unavailable — try again in a few seconds');
    return;
  }
  processData(allRecords);
}

/* ════════════════════════════════════
   DATA PROCESSING
════════════════════════════════════ */
function processData(allRecords) {
  const grouped = {};
  allRecords.forEach(r => {
    const key = getPool(r);
    if (!grouped[key]) grouped[key] = { rawKey: key, label: resolveLabel(key), pulls: [] };
    grouped[key].pulls.push(r);
  });
  const ORDER = ['E_CharacterGachaPoolType_Special','E_CharacterGachaPoolType_Standard','E_CharacterGachaPoolType_NewHorizon','E_CharacterGachaPoolType_Beginner'];
  const sorted = Object.values(grouped).sort((a, b) => {
    const ia = ORDER.indexOf(a.rawKey), ib = ORDER.indexOf(b.rawKey);
    if (ia !== -1 && ib !== -1) return ia - ib;
    return ia !== -1 ? -1 : ib !== -1 ? 1 : a.label.localeCompare(b.label);
  });
  bannerData   = {};
  sorted.forEach(b => { bannerData[b.label] = { rawKey: b.rawKey, pulls: b.pulls }; });
  activeBanner = Object.keys(bannerData)[0] || null;
  buildBannerTabs(Object.keys(bannerData));
  renderActiveBanner();
  renderFoundBanner(grouped);
  renderGoyStats(allRecords, bannerData);
  document.getElementById('pullLogSection').classList.add('visible');
}

function buildBannerTabs(labels) {
  const bar = document.getElementById('bannerTabBar');
  bar.innerHTML = '';
  labels.forEach((label, i) => {
    const cls = classifyBanner(bannerData[label].rawKey);
    const btn = document.createElement('button');
    btn.className    = 'btab' + (i === 0 ? ' active' : '');
    btn.dataset.label = label;
    btn.innerHTML    = `<span class="btab-pip pip-${cls}"></span>${label}<span class="btab-count">${bannerData[label].pulls.length}</span>`;
    btn.onclick = () => {
      bar.querySelectorAll('.btab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeBanner  = label;
      currentFilter = 'all';
      document.querySelectorAll('.filt').forEach((f, j) => f.classList.toggle('active', j === 0));
      renderActiveBanner();
    };
    bar.appendChild(btn);
  });
}

function renderActiveBanner() {
  if (!activeBanner || !bannerData[activeBanner]) return;
  const { pulls, rawKey } = bannerData[activeBanner];
  document.getElementById('pullListLabel').textContent = activeBanner + ' — Pull Log';
  renderBannerStats(pulls);
  renderPityBars(pulls, rawKey);
  renderDistribution(pulls);
  renderPullList(pulls);
  if (rawKey === 'E_CharacterGachaPoolType_Special') syncPityToPlanner(pulls);
}

function renderBannerStats(pulls) {
  const total = pulls.length;
  const s6    = pulls.filter(p => getRarity(p) === '6').length;
  const s5    = pulls.filter(p => getRarity(p) === '5').length;
  let pity = 0;
  const sixPities = [];
  [...pulls].reverse().forEach(p => { pity++; if (getRarity(p) === '6') { sixPities.push(pity); pity = 0; } });
  const avg  = sixPities.length ? Math.round(sixPities.reduce((a, b) => a + b, 0) / sixPities.length) : 0;
  const rate = n => total ? (n / total * 100).toFixed(2) + '%' : '0.00%';
  document.getElementById('bannerStatsStrip').innerHTML = [
    { color:'var(--accent)', lbl:'Total Pulls',  val:total, sub:'Headhunts' },
    { color:'var(--gold)',   lbl:'6★ Acquired',  val:s6,    sub:rate(s6) + ' rate' },
    { color:'var(--purple)', lbl:'5★ Acquired',  val:s5,    sub:rate(s5) + ' rate' },
    { color:'var(--green)',  lbl:'Avg Pity (6★)', val:avg || '—', sub:'Per 6★ pull' },
  ].map(d => `
    <div class="bstat" style="border-top:2px solid ${d.color}">
      <div class="bstat-lbl">${d.lbl}</div>
      <div class="bstat-val" style="color:${d.color}">${d.val}</div>
      <div class="bstat-sub">${d.sub}</div>
    </div>`).join('');
}

function renderPityBars(pulls, rawKey) {
  const isWeapon  = rawKey && /weapon|forge|raft/i.test(rawKey);
  const hardPity6 = isWeapon ? 40 : 80;
  let p6 = 0, p5 = 0;
  for (let i = pulls.length - 1; i >= 0; i--) { const r = getRarity(pulls[i]); if (r === '6') break; p6++; }
  for (let i = pulls.length - 1; i >= 0; i--) { const r = getRarity(pulls[i]); if (r === '6' || r === '5') break; p5++; }
  document.getElementById('pity6Count').textContent = p6;
  document.getElementById('pity5Count').textContent = p5;
  document.getElementById('pity6Cap').textContent   = '/ ' + hardPity6;
  setTimeout(() => {
    document.getElementById('pity6Fill').style.width = Math.min(100, p6 / hardPity6 * 100) + '%';
    document.getElementById('pity5Fill').style.width = Math.min(100, p5 / 10 * 100) + '%';
  }, 120);
}

function syncPityToPlanner(pulls) {
  let p6 = 0;
  for (let i = pulls.length - 1; i >= 0; i--) { if (getRarity(pulls[i]) === '6') break; p6++; }
  currentPity6 = p6;
  document.getElementById('pity-sync-display').textContent = p6;
  document.getElementById('pity-source-hint').textContent  = 'Auto-filled from Special HH log';
  const badge = document.getElementById('pity-sync-badge');
  badge.textContent = 'SYNCED';
  badge.className   = 'pity-sync-badge synced';
  recalcChances(getTotalPulls());
}

function renderDistribution(pulls) {
  const counts = { 6:0, 5:0, 4:0, 3:0 };
  pulls.forEach(p => { const r = getRarity(p); if (r in counts) counts[r]++; });
  const total = pulls.length || 1;
  const cfg   = { 6:'var(--gold)', 5:'var(--purple)', 4:'var(--blue)', 3:'var(--text3)' };
  document.getElementById('distBars').innerHTML = [6,5,4,3].map(r => `
    <div class="dist-row">
      <div class="dist-lbl" style="color:${cfg[r]}">${r}★</div>
      <div class="dist-bg"><div class="dist-fill" id="df${r}" style="width:0%;background:${cfg[r]}">
        <span>${counts[r]} (${(counts[r]/total*100).toFixed(1)}%)</span>
      </div></div>
      <div class="dist-count" style="color:${cfg[r]}">${counts[r]}</div>
    </div>`).join('');
  setTimeout(() => {
    [6,5,4,3].forEach(r => {
      const el = document.getElementById('df' + r);
      if (el) el.style.width = (counts[r] / total * 100) + '%';
    });
  }, 200);
}

function filterPulls(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (activeBanner && bannerData[activeBanner]) renderPullList(bannerData[activeBanner].pulls);
}

function renderPullList(pulls) {
  const list = document.getElementById('pullList');
  let pity = 0;
  const withPity = [...pulls].reverse().map((p, i) => {
    pity++;
    const snap = pity;
    const r = getRarity(p);
    if (r === '6' || r === '5') pity = 0;
    return { ...p, pullNum: i + 1, pityCount: snap };
  }).reverse();
  const filtered = currentFilter === 'all' ? withPity : withPity.filter(p => getRarity(p) === currentFilter);
  if (!filtered.length) {
    list.innerHTML = '<div class="no-data"><div class="no-data-icon">◈</div>No records match current filter.</div>';
    return;
  }
  list.innerHTML = filtered.map(p => {
    const r        = getRarity(p);
    const stars    = '★'.repeat(parseInt(r));
    const showPity = r === '6' || r === '5';
    const highPity = (r === '6' && p.pityCount >= 50) || (r === '5' && p.pityCount >= 8);
    return `
      <div class="pull-item s${r}">
        <div class="p-num">#${p.pullNum}</div>
        <div class="p-name">${getName(p)}</div>
        <div class="p-stars">${stars}</div>
        <div class="p-pity${highPity ? ' high' : ''}">${showPity ? '@' + p.pityCount : ''}</div>
      </div>`;
  }).join('');
}

function renderFoundBanner(grouped) {
  const total = Object.values(grouped).reduce((s, b) => s + b.pulls.length, 0);
  document.getElementById('foundTotal').textContent = '+' + total;
  document.getElementById('foundBreakdown').innerHTML = Object.values(grouped).map(b => {
    const cls = classifyBanner(b.rawKey);
    return `<span class="found-pill p-${cls}">${b.label}  +${b.pulls.length}</span>`;
  }).join('');
  document.getElementById('foundBanner').classList.add('visible');
}

function renderGoyStats(allRecords, bData) {
  document.getElementById('goyNoData').style.display = 'none';
  document.getElementById('goySection').classList.add('visible');
  const total = allRecords.length;
  const all6  = allRecords.filter(p => getRarity(p) === '6');
  const all5  = allRecords.filter(p => getRarity(p) === '5');
  let lucky = 0, cnt = 0;
  [...allRecords].reverse().forEach(p => {
    cnt++;
    if (getRarity(p) === '6') { if (cnt <= 40) lucky++; cnt = 0; }
  });
  const rate = (n) => total ? (n / total * 100).toFixed(2) + '% rate' : '—';
  document.getElementById('goyOverview').innerHTML = [
    { label:'Total Headhunts', val:total.toLocaleString(),      sub:`${Object.keys(bData).length} banners` },
    { label:'6★ Obtained',     val:all6.length,                sub:rate(all6.length) },
    { label:'5★ Obtained',     val:all5.length,                sub:rate(all5.length) },
    { label:'Oroberyl Spent',  val:(total*500).toLocaleString(),sub:`≈${(total*500/75).toFixed(0)} Origeometry` },
    { label:'Spark Progress',  val:(total%120)+'/120',          sub:`${Math.floor(total/120)} spark(s)` },
    { label:'Lucky 6★ Pulls',  val:lucky,                       sub:'at ≤40 pity' },
  ].map(d => `
    <div class="goy-card fade-in">
      <div class="goy-card-title">${d.label}</div>
      <div class="goy-card-val">${d.val}</div>
      <div class="goy-card-sub">${d.sub}</div>
    </div>`).join('');

  const gbc = document.getElementById('goyBannerCards');
  gbc.innerHTML = '';
  const colMap = { special:'var(--purple)', standard:'var(--blue)', beginner:'var(--gold)', weapon:'var(--accent)', unknown:'var(--text2)' };
  Object.entries(bData).forEach(([label, { rawKey, pulls }]) => {
    const cls = classifyBanner(rawKey);
    const col = colMap[cls] || 'var(--text2)';
    const tot = pulls.length;
    const s6  = pulls.filter(p => getRarity(p) === '6').length;
    const s5  = pulls.filter(p => getRarity(p) === '5').length;
    let p6 = 0, p5 = 0;
    for (let i = pulls.length - 1; i >= 0; i--) { const r = getRarity(pulls[i]); if (r === '6') break; p6++; }
    for (let i = pulls.length - 1; i >= 0; i--) { const r = getRarity(pulls[i]); if (r === '6' || r === '5') break; p5++; }
    let pAvg = 0; { let pt = 0; const sp = []; [...pulls].reverse().forEach(p => { pt++; if (getRarity(p) === '6') { sp.push(pt); pt = 0; } }); pAvg = sp.length ? Math.round(sp.reduce((a,x) => a+x,0)/sp.length) : 0; }
    const pct = (n) => tot ? (n/tot*100).toFixed(1) : '0';
    const card = document.createElement('div');
    card.className = 'goy-banner-card fade-in';
    card.innerHTML = `
      <div class="goy-banner-name" style="color:${col};border-bottom-color:${col}33">
        <span style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0"></span>${label}
      </div>
      <div class="goy-stat-line"><div class="goy-stat-key">Total Pulls</div><div class="goy-stat-val">${tot}</div></div>
      <div class="goy-stat-line"><div class="goy-stat-key">6★ Count</div><div class="goy-stat-val" style="color:var(--gold)">${s6} <span style="font-size:11px;color:var(--text3)">(${pct(s6)}%)</span></div></div>
      <div class="goy-stat-line"><div class="goy-stat-key">5★ Count</div><div class="goy-stat-val" style="color:var(--purple)">${s5} <span style="font-size:11px;color:var(--text3)">(${pct(s5)}%)</span></div></div>
      <div class="goy-stat-line"><div class="goy-stat-key">Avg 6★ Pity</div><div class="goy-stat-val">${pAvg || '—'}</div></div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--text3);margin:8px 0 4px">CURRENT PITY</div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
        <span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text2);min-width:28px">6★</span>
        <div class="goy-pity-bar" style="flex:1"><div class="goy-pity-fill" style="width:${Math.min(100,p6/80*100).toFixed(0)}%;background:var(--gold)"></div></div>
        <span style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:14px;color:var(--gold)">${p6}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text2);min-width:28px">5★</span>
        <div class="goy-pity-bar" style="flex:1"><div class="goy-pity-fill" style="width:${Math.min(100,p5/10*100).toFixed(0)}%;background:var(--purple)"></div></div>
        <span style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:14px;color:var(--purple)">${p5}</span>
      </div>`;
    gbc.appendChild(card);
  });

  const histEl = document.getElementById('goy6History');
  histEl.innerHTML = '';
  Object.entries(bData).forEach(([label, { pulls }]) => {
    let pity = 0;
    const sixes = [];
    [...pulls].reverse().forEach(p => { pity++; if (getRarity(p) === '6') { sixes.push({ name: getName(p), pity }); pity = 0; } });
    if (!sixes.length) return;
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:var(--r, 10px);padding:14px;';
    card.innerHTML = `
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:var(--text2);margin-bottom:10px;padding-bottom:7px;border-bottom:1px solid var(--border)">${label} — 6★</div>
      ${sixes.slice(0,14).map(s => {
        const col   = s.pity >= 65 ? 'var(--red)' : s.pity <= 15 ? 'var(--green)' : 'var(--gold)';
        const badge = s.pity >= 65 ? '<span style="font-family:\'Share Tech Mono\',monospace;font-size:8px;color:var(--red);padding:1px 5px;background:rgba(239,80,80,0.1);border-radius:3px">SOFT PITY</span>'
                    : s.pity <= 15 ? '<span style="font-family:\'Share Tech Mono\',monospace;font-size:8px;color:var(--green);padding:1px 5px;background:rgba(78,202,139,0.1);border-radius:3px">LUCKY</span>' : '';
        return `<div class="goy-six-item"><div class="goy-six-name">${s.name}</div><div class="goy-six-pity" style="color:${col}">@${s.pity}</div>${badge}</div>`;
      }).join('')}
      ${sixes.length > 14 ? `<div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--text3);margin-top:8px">+${sixes.length-14} more 6★</div>` : ''}`;
    histEl.appendChild(card);
  });
}

/* ════════════════════════════════════
   PLANNER
════════════════════════════════════ */
function syncSlider(inputId, sliderId) {
  const v = parseInt(document.getElementById(inputId).value) || 0;
  document.getElementById(sliderId).value = Math.min(v, parseInt(document.getElementById(sliderId).max));
}
function syncInput(sliderId, inputId) {
  document.getElementById(inputId).value = document.getElementById(sliderId).value;
}
function getTotalPulls() {
  const oro     = parseInt(document.getElementById('ctr-oro').value)    || 0;
  const permits = parseInt(document.getElementById('ctr-permit').value) || 0;
  const ori     = parseInt(document.getElementById('ctr-ori').value)    || 0;
  return Math.floor(oro / 500) + permits + Math.floor(ori * 75 / 500);
}
function recalcPulls() {
  const oro     = parseInt(document.getElementById('ctr-oro').value)    || 0;
  const permits = parseInt(document.getElementById('ctr-permit').value) || 0;
  const ori     = parseInt(document.getElementById('ctr-ori').value)    || 0;
  const oroPulls = Math.floor(oro / 500);
  const oriPulls = Math.floor(ori * 75 / 500);
  const total    = oroPulls + permits + oriPulls;
  document.getElementById('total-pulls-val').textContent = total;
  document.getElementById('total-pulls-sub').textContent = `${oroPulls} from Oro · ${permits} Permits · ${oriPulls} from Ori`;
  document.getElementById('hard-pity-count').textContent = Math.floor(total / 80) + '×';
  document.getElementById('spark-count').textContent     = Math.floor(total / 120) + '×';
  recalcChances(total);
}

function pull6StarProb(n, startPity = 0) {
  let pNoSix = 1.0;
  for (let i = 1; i <= n; i++) {
    const pos  = startPity + i;
    const rate = pos <= 64 ? 0.008 : pos <= 79 ? 0.008 + 0.05 * (pos - 64) : 1.0;
    pNoSix *= (1 - rate);
    if (pNoSix <= 0) { pNoSix = 0; break; }
  }
  return 1 - pNoSix;
}
function pull5StarProb(n) { return 1 - Math.pow(0.92, n); }

function expectedCounts(pulls, startPity) {
  if (pulls <= 0) return { six: 0, five: 0, four: 0 };
  let pNoSix = 1.0, expSix = 0;
  for (let i = 1; i <= pulls; i++) {
    const pos  = startPity + i;
    const rate = pos <= 64 ? 0.008 : pos <= 79 ? 0.008 + 0.05 * (pos - 64) : 1.0;
    expSix += pNoSix * rate;
    pNoSix *= (1 - rate);
  }
  const estSix  = Math.max(0, expSix);
  const estFive = Math.floor(pulls / 10);
  return { six: estSix, five: estFive, four: Math.round(Math.max(0, pulls - Math.round(estSix) - estFive) * 0.15) };
}

function recalcChances(pulls) {
  const pity = currentPity6 || 0;
  const p6   = Math.min(100, pull6StarProb(pulls, pity) * 100);
  const p5   = Math.min(100, pull5StarProb(pulls) * 100);
  const p6f  = Math.min(100, (1 - (1 - pull6StarProb(pulls, pity)) * 0.5) * 100);
  const fmt  = v => v >= 99.9 ? '100%' : v.toFixed(1) + '%';
  document.getElementById('prob6-pct').textContent      = fmt(p6);
  document.getElementById('prob6-feat-pct').textContent = fmt(p6f);
  document.getElementById('prob5-pct').textContent      = fmt(p5);
  setTimeout(() => {
    document.getElementById('prob6-fill').style.width      = p6  + '%';
    document.getElementById('prob6-feat-fill').style.width = p6f + '%';
    document.getElementById('prob5-fill').style.width      = p5  + '%';
  }, 80);
  const est = expectedCounts(pulls, pity);
  document.getElementById('est-6star').textContent = est.six < 1 && est.six > 0 ? est.six.toFixed(1) : Math.round(est.six);
  document.getElementById('est-5star').textContent = est.five;
  document.getElementById('est-4star').textContent = est.four;
}

/* ════════════════════════════════════
   INCOME TALLY
════════════════════════════════════ */
function calcTally() {
  const fromVal = document.getElementById('tally-from').value;
  const toVal   = document.getElementById('tally-to').value;
  if (!fromVal || !toVal) { alert('Please select both a start and end date.'); return; }
  const from = new Date(fromVal), to = new Date(toVal);
  if (to <= from) { alert('End date must be after start date.'); return; }
  const days    = Math.ceil((to - from) / 86400000);
  const weeks   = days / 7;
  const daily   = (parseInt(document.getElementById('t-daily').value)   || 0)
                + (parseInt(document.getElementById('t-monthly').value) || 0);
  const wRoutine = parseInt(document.getElementById('t-weekly').value)  || 0;
  const wPass    = parseInt(document.getElementById('t-pass').value)    || 0;
  const eventPP  = parseInt(document.getElementById('t-event').value)   || 0;
  const dailyTotal = daily * days;
  const eventTotal = Math.round(eventPP * (days / 42));
  const grand      = Math.round(dailyTotal + (wRoutine + wPass) * weeks + eventTotal);
  document.getElementById('tally-breakdown').innerHTML = [
    { name:`Daily Missions (${days} days)`,             val: dailyTotal },
    { name:`Weekly Routine (${weeks.toFixed(1)} weeks)`, val: Math.round(wRoutine * weeks) },
    { name:`Protocol Pass (${weeks.toFixed(1)} weeks)`,  val: Math.round(wPass * weeks) },
    { name:`Events (~${(days/42).toFixed(1)} patches)`,  val: eventTotal },
  ].map(r => `<div class="tally-row"><div class="tally-name">${r.name}</div><div class="tally-val">+${r.val.toLocaleString()}</div></div>`).join('');
  document.getElementById('tally-total-oro').textContent   = grand.toLocaleString() + ' Oroberyl';
  document.getElementById('tally-total-pulls').textContent = '≈ ' + Math.floor(grand / 500) + ' pulls';
  const fmt = d => d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  document.getElementById('tally-date-range').textContent  = `${fmt(from)} → ${fmt(to)} (${days} days)`;
  document.getElementById('tally-result').style.display    = 'block';
}

/* ════════════════════════════════════
   SHOP ADVISOR
════════════════════════════════════ */
function switchShopUnit(u, btn) {
  shopUnit = u;
  document.querySelectorAll('.sutab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const cfg = SHOP_UNIT_CFG[u];
  document.getElementById('shop-unit-hint').innerHTML       = cfg.hint;
  document.getElementById('shop-input-label').textContent   = cfg.label;
  document.getElementById('shop-need').value                = cfg.default;
  document.getElementById('shop-result').style.display      = 'none';
  document.querySelectorAll('.bundle-card').forEach(c => c.classList.remove('recommended'));
}

function toOroberyl(val, unit) {
  if (unit === 'pulls') return val * 500;
  if (unit === 'ori')   return val * 75;
  return val;
}

function calcShop() {
  const rawVal   = parseInt(document.getElementById('shop-need').value) || 0;
  if (rawVal <= 0) return;
  const firstBuy  = document.getElementById('shop-firstbuy').value === '1';
  const targetOro = toOroberyl(rawVal, shopUnit);
  let targetOri   = Math.ceil(targetOro / 75);

  const bundles = ORI_BUNDLES_BASE.map(b => ({
    ...b,
    eff: firstBuy ? b.firstOri : b.ori,
  }));

  const combo = [];
  let rem = targetOri;

  for (const b of [...bundles].reverse()) {
    if (rem <= 0) break;
    if (b.eff <= 0) continue;
    const qty = Math.floor(rem / b.eff);
    if (qty > 0) {
      combo.push({ bundle: b, qty, ori: b.eff * qty });
      rem -= b.eff * qty;
    }
  }
  if (rem > 0) {
    const cover = bundles.find(b => b.eff >= rem) || bundles[bundles.length - 1];
    const existing = combo.find(c => c.bundle.label === cover.label);
    if (existing) { existing.qty++; existing.ori += cover.eff; }
    else          { combo.push({ bundle: cover, qty: 1, ori: cover.eff }); }
  }

  const totalHuf   = combo.reduce((s, c) => s + c.bundle.huf * c.qty, 0);
  const totalOri   = combo.reduce((s, c) => s + c.ori, 0);
  const totalOro   = totalOri * 75;
  const totalPulls = Math.floor(totalOro / 500);

  const convLabel = {
    oro:   `Target: ${rawVal.toLocaleString()} Oroberyl → ${targetOri} Origeometry needed`,
    pulls: `Target: ${rawVal} pulls = ${(rawVal*500).toLocaleString()} Oroberyl → ${targetOri} Origeometry needed`,
    ori:   `Target: ${rawVal} Origeometry = ${(rawVal*75).toLocaleString()} Oroberyl`,
  };

  document.getElementById('shop-converted-label').textContent = convLabel[shopUnit];
  document.getElementById('shop-combo').innerHTML = combo.map(c =>
    `<div class="shop-pill">${c.qty}× ${c.bundle.label} <span>${formatPrice(c.bundle.huf * c.qty)}</span></div>`
  ).join('');
  document.getElementById('shop-total').innerHTML =
    `Total: <strong>${formatPrice(totalHuf)}</strong> → ${totalOri} Origeometry → ${totalOro.toLocaleString()} Oroberyl ≈ ${totalPulls} pulls`;

  const usedLabels = new Set(combo.map(c => c.bundle.label));
  document.querySelectorAll('#bundle-ref .bundle-card').forEach((el, i) => {
    el.classList.toggle('recommended', usedLabels.has(ORI_BUNDLES_BASE[i].label));
  });
  document.getElementById('shop-result').style.display = 'block';
}

function initBundleRef() {
  document.getElementById('bundle-ref').innerHTML = ORI_BUNDLES_BASE.map(b => `
    <div class="bundle-card">
      <div class="bundle-ori">${b.ori} Ori</div>
      <div class="bundle-price">${formatPrice(b.huf)}</div>
      <div class="bundle-oroberyls">${(b.ori*75).toLocaleString()} Oroberyl</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--text3);margin-top:2px">1st: ${b.firstOri} Ori (×2)</div>
    </div>`).join('');
}

/* ════════════════════════════════════
   INIT
════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const today     = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  document.getElementById('tally-from').value = today;
  document.getElementById('tally-to').value   = nextMonth;
  initCurrencySelector();
  initBundleRef();
  recalcPulls();
});
