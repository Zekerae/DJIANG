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
// WEAPON DATA — sourced from Prydwen.gg
// ==========================================
const WEAPONS = [
  // ── 6★ ──────────────────────────────────────────────────────────────────
  { id:"artzy-tyrannical",         name:"Artzy Tyrannical",         rarity:6, type:"Handcannon", base_atk:505, stat1:"Intellect +156",       stat2:"Critical Rate +19.50%",      passive:"After the wielder scores a critical hit with a Battle Skill or Combo Skill, the wielder gains Cryo DMG dealt +22.4% for 30s. Max stacks: 3. Duration per stack counted separately. Triggers once every 0.1s.", img:"" },
  { id:"brigands-calling",         name:"Brigand's Calling",        rarity:6, type:"Handcannon", base_atk:505, stat1:"Agility +156",          stat2:"Attack +39%",                passive:"When the wielder applies Cryo Infliction via battle skills or ultimates, gains Cryo DMG Dealt +32% for 20s. When battle skill or ultimate applies Arts Susceptibility, target suffers Arts DMG Taken +9.6% for 20s. Effects apply separately.", img:"" },
  { id:"chivalric-virtues",        name:"Chivalric Virtues",        rarity:6, type:"Arts Unit",  base_atk:485, stat1:"Will +156",             stat2:"Max HP +78.00%",             passive:"Treatment Efficiency +16%. After the wielder gives HP Treatment with their own skill, the entire team gains ATK +14.4% for 15s. Effects of the same name cannot stack.", img:"" },
  { id:"clannibal",                name:"Clannibal",                rarity:6, type:"Handcannon", base_atk:490, stat1:"Main Attribute +132",   stat2:"Arts DMG Bonus +43.30%",     passive:"After the wielder consumes an Arts Reaction, target enemy suffers Arts DMG taken +16% (for the specified element) for 15s. Effect only triggers once every 25s.", img:"" },
  { id:"delivery-guaranteed",      name:"Delivery Guaranteed",      rarity:6, type:"Arts Unit",  base_atk:500, stat1:"Will +156",             stat2:"Ultimate Gain Eff. +46.40%", passive:"After the wielder applies Lifted with their own Combo Skill, the team gains Arts DMG dealt +19.2% for 15s. For every enemy Lifted, bonus Arts DMG dealt +5.6%, up to +16.8%. Effects of the same name cannot stack.", img:"" },
  { id:"detonation-unit",          name:"Detonation Unit",          rarity:6, type:"Arts Unit",  base_atk:490, stat1:"Main Attribute +132",   stat2:"Arts Intensity +78",         passive:"After the wielder applies an Arts Burst, target enemy suffers Arts DMG taken +14.4% for 15s. Effects of the same name cannot stack.", img:"" },
  { id:"dreams-of-the-starry-beach",name:"Dreams of the Starry Beach",rarity:6,type:"Arts Unit", base_atk:495, stat1:"Intellect +156",        stat2:"Treatment Bonus +46.40%",    passive:"After the wielder consumes Corrosion, target enemy suffers Arts DMG taken +16% for 25s. Effects of the same name cannot stack.", img:"" },
  { id:"eminent-repute",           name:"Eminent Repute",           rarity:6, type:"Sword",      base_atk:490, stat1:"Main Attribute +132",   stat2:"Physical DMG Bonus +43.30%", passive:"After the wielder consumes Vulnerability stack(s), ATK +[8% + 4% x Stacks Consumed] while other Operators in the team gain half this buff for 20s. Effects of the same name cannot stack.", img:"" },
  { id:"exemplar",                 name:"Exemplar",                 rarity:6, type:"Greatsword", base_atk:500, stat1:"Main Attribute +132",   stat2:"Attack +39.00%",             passive:"After the wielder's Battle Skill or Ultimate hits the enemy, the wielder gains Physical DMG dealt +16% for 30s. Max stacks: 3. Duration per stack counted separately. Triggers once every 0.1s.", img:"" },
  { id:"flickers-in-the-mist",     name:"Flickers in the Mist",     rarity:6, type:"Arts Unit",  base_atk:490, stat1:"Will +156",             stat2:"Electric DMG Bonus +43.30%", passive:"ATK +11.2%. When the wielder gains Electric Amp the wielder also gains Electric DMG Dealt +8.8% for 30s. Max stacks: 3. Duration per stack counted separately. Triggers once every 0.1s.", img:"" },
  { id:"forgeborn-scathe",         name:"Forgeborn Scathe",         rarity:6, type:"Sword",      base_atk:510, stat1:"Intellect +156",        stat2:"Attack +39.00%",             passive:"After the wielder casts an Ultimate, the wielder gains Basic Attack DMG dealt +120% for 20s. Effects of the same name cannot stack.", img:"" },
  { id:"former-finery",            name:"Former Finery",            rarity:6, type:"Greatsword", base_atk:495, stat1:"Will +156",             stat2:"Max HP +78.00%",             passive:"Treatment Efficiency +16%. When a Protected Operator takes DMG, the wielder restores that Operator's HP by [134 + Will x 1.12]. Effect triggers once every 15s.", img:"" },
  { id:"glorious-memory",          name:"Glorious Memory",          rarity:6, type:"Sword",      base_atk:490, stat1:"Agility +156",          stat2:"Critical Rate +19.5%",       passive:"When the wielder's skill applies Vulnerability, during the next ultimate cast within 30s, the wielder gains DMG Dealt +19.2%. Max stacks: 3. Duration per stack counted separately. Triggers once every 0.5s.", img:"" },
  { id:"grand-vision",             name:"Grand Vision",             rarity:6, type:"Sword",      base_atk:500, stat1:"Agility +156",          stat2:"Attack +39.00%",             passive:"For 20s after the wielder applies Originium Crystals or Solidification, the wielder gains Physical DMG dealt +57.6% during the next Battle Skill or Ultimate cast. Effects of the same name cannot stack.", img:"" },
  { id:"home-longing",             name:"Home Longing",             rarity:6, type:"Handcannon", base_atk:490, stat1:"Agility +156",          stat2:"Cryo DMG Dealt +43.33%",     passive:"For 20s after the wielder casts a combo skill, the wielder's next battle skill gains Cryo and Nature DMG Dealt +12.8%. Max stacks: 2. Duration per stack counted separately.", img:"" },
  { id:"jet",                      name:"JET",                      rarity:6, type:"Polearm",    base_atk:500, stat1:"Main Attribute +132",   stat2:"Attack +39.00%",             passive:"After the wielder casts a Battle Skill, Arts DMG dealt +19.2% for 15s. After a Combo Skill, Arts DMG dealt +19.2% for 15s. The two effects apply separately and do not stack with themselves.", img:"" },
  { id:"khravengger",              name:"Khravengger",              rarity:6, type:"Greatsword", base_atk:505, stat1:"Strength +156",         stat2:"Attack +39.00%",             passive:"When the wielder's Battle Skill applies Cryo Infliction, gains Cryo DMG dealt +16% for 15s. When Combo Skill deals DMG to an enemy with Cryo Infliction, gains Cryo DMG dealt +32% for 15s. Effects apply separately.", img:"" },
  { id:"lone-barge",               name:"Lone Barge",               rarity:6, type:"Arts Unit",  base_atk:510, stat1:"Will +156",             stat2:"Attack +39%",                passive:"Electric DMG Bonus +25.6%. When the wielder's battle skill consumes Arts Reactions, the wielder gains Battle Skill Electric DMG Dealt +32% for 20s. This effect can reach 2 stacks. After the wielder casts an ultimate, the wielder gains Battle Skill Electric DMG Dealt +64% for 25s.", img:"" },
  { id:"lupine-scarlet",           name:"Lupine Scarlet",           rarity:6, type:"Sword",      base_atk:null,stat1:"—",                    stat2:"—",                          passive:"Data not yet available.", img:"" },
  { id:"mountain-bearer",          name:"Mountain Bearer",          rarity:6, type:"Polearm",    base_atk:500, stat1:"Agility +156",          stat2:"Physical DMG Bonus +43.30%", passive:"Against Vulnerability enemies, DMG dealt +32%. When Battle Skill applies Vulnerability, All Attributes +12.8% for 15s. When Battle Skill applies Physical Susceptibility, all attributes +12.8% for 15s. Max stacks: 2.", img:"" },
  { id:"navigator",                name:"Navigator",                rarity:6, type:"Handcannon", base_atk:490, stat1:"Intellect +156",        stat2:"Cryo DMG Bonus +43.30%",     passive:"When Solidification or Corrosion is applied to enemies, the wielder gains Cryo and Nature DMG dealt +5.6%, and Critical Rate +3.2% for 15s. If triggered by the wielder, double the increase. Effects of the same name cannot stack.", img:"" },
  { id:"never-rest",               name:"Never Rest",               rarity:6, type:"Sword",      base_atk:500, stat1:"Will +156",             stat2:"Attack +39.00%",             passive:"After the wielder recovers SP with their own skills, the wielder gains Physical DMG dealt +8% while other Operators gain Physical DMG dealt +4% for 30s. Max stacks: 5. Duration per stack counted separately.", img:"" },
  { id:"oblivion",                 name:"Oblivion",                 rarity:6, type:"Arts Unit",  base_atk:495, stat1:"Intellect +156",        stat2:"Arts DMG Bonus +43.30%",     passive:"After the wielder casts an Ultimate, Arts DMG dealt +38.4% for 15s. After a Combo Skill, Arts DMG dealt +19.2% for 15s. The two effects apply separately.", img:"" },
  { id:"opus-etch-figure",         name:"Opus: Etch Figure",        rarity:6, type:"Arts Unit",  base_atk:485, stat1:"Will +156",             stat2:"Nature DMG Bonus +43.30%",   passive:"After the wielder applies Nature Infliction with their own Battle Skill, the team gains Arts DMG dealt +8% for 15s. For every enemy with Nature Infliction from said skill, Bonus Arts DMG dealt +3.2%, up to +9.6%. Effects of the same name cannot stack.", img:"" },
  { id:"rapid-ascent",             name:"Rapid Ascent",             rarity:6, type:"Sword",      base_atk:495, stat1:"Main Attribute +132",   stat2:"Critical Rate +19.50%",      passive:"Battle Skills and Ultimates gain Physical DMG dealt +24%. Against staggered enemies, Battle Skills and Ultimates also gain DMG dealt +56%.", img:"" },
  { id:"sundered-prince",          name:"Sundered Prince",          rarity:6, type:"Greatsword", base_atk:490, stat1:"Strength +156",         stat2:"Critical Rate +19.50%",      passive:"After the wielder performs a Final Strike on the enemy, ATK +16% for 8s. If also the Controlled Operator, double the ATK increase and deal Stagger +19.2% to the enemy. Effects of the same name cannot stack.", img:"" },
  { id:"thermite-cutter",          name:"Thermite Cutter",          rarity:6, type:"Sword",      base_atk:490, stat1:"Will +156",             stat2:"Attack +39.00%",             passive:"After the wielder's skill recovers SP or grants a Link state, the entire team gains ATK +8% for 20s. Max stacks: 2. Duration per stack counted separately.", img:"" },
  { id:"thunderberge",             name:"Thunderberge",             rarity:6, type:"Greatsword", base_atk:495, stat1:"Strength +156",         stat2:"Max HP +78.00%",             passive:"Shield applied +38.4%. When the wielder restores HP with their own Combo Skill, grant the Controlled Operator a [11.2 x Wielder's Max HP] Shield for 15s. Effect triggers once every 15s.", img:"" },
  { id:"umbral-torch",             name:"Umbral Torch",             rarity:6, type:"Sword",      base_atk:490, stat1:"Intellect +156",        stat2:"Heat DMG Bonus +43.30%",     passive:"Whenever Combustion or Corrosion is applied to an enemy, the wielder gains Heat DMG dealt and Nature DMG dealt +12.8% for 20s. Max stacks: 2. Duration per stack counted separately. Triggers once every 0.1s.", img:"" },
  { id:"valiant",                  name:"Valiant",                  rarity:6, type:"Polearm",    base_atk:495, stat1:"Agility +156",          stat2:"Physical DMG Bonus +43.30%", passive:"When the wielder applies Physical Statuses, the wielder also deals another hit of Physical DMG equal to 192% of the wielder's ATK.", img:"" },
  { id:"wedge",                    name:"Wedge",                    rarity:6, type:"Handcannon", base_atk:500, stat1:"Main Attribute +132",   stat2:"Critical Rate +19.50%",      passive:"After a Battle Skill, Arts DMG dealt +12.8% for 15s. After a Battle Skill applies an Arts Reaction, Arts DMG dealt +25.6% for 15s. The two effects apply separately.", img:"" },
  { id:"white-night-nova",         name:"White Night Nova",         rarity:6, type:"Sword",      base_atk:505, stat1:"Main Attribute +132",   stat2:"Arts Intensity +78",         passive:"After the wielder applies Combustion or Electrification, the wielder gains Arts DMG dealt +19.2% and Arts Intensity +40 for 15s. Effects of the same name cannot stack.", img:"" },

  // ── 5★ ──────────────────────────────────────────────────────────────────
  { id:"ancient-canal",            name:"Ancient Canal",            rarity:5, type:"Greatsword", base_atk:411, stat1:"Strength +124",         stat2:"Arts Intensity +62",         passive:"After the wielder consumes Vulnerability stack(s), gains Physical DMG dealt +[14% x stacks consumed] for 20s. Effects of the same name cannot stack.", img:"" },
  { id:"aspirant",                 name:"Aspirant",                 rarity:5, type:"Sword",      base_atk:411, stat1:"Agility +124",          stat2:"Physical DMG Bonus +34.70%", passive:"For 30s after the wielder applies Lifted, gains Physical DMG dealt +33.6% during the next Ultimate cast. Max stacks: 3. Duration per stack counted separately. Triggers once every 0.5s.", img:"" },
  { id:"chimeric-justice",         name:"Chimeric Justice",         rarity:5, type:"Polearm",    base_atk:411, stat1:"Strength +124",         stat2:"Ultimate Gain Eff. +37.10%", passive:"After the wielder applies Vulnerability to an enemy with no Vulnerability stacks, ATK +42% for 15s. Effects of the same name cannot stack.", img:"" },
  { id:"cohesive-traction",        name:"Cohesive Traction",        rarity:5, type:"Polearm",    base_atk:411, stat1:"Will +124",             stat2:"Electric DMG Bonus +34.70%", passive:"For 30s after the wielder casts a Combo Skill, gains Electric DMG dealt +28% during the next Battle Skill cast. Max stacks: 3. Duration per stack counted separately.", img:"" },
  { id:"finchaser-3",              name:"Finchaser 3.0",            rarity:5, type:"Sword",      base_atk:411, stat1:"Strength +124",         stat2:"Cryo DMG Bonus +34.70%",     passive:"After the wielder's Battle Skill applies Solidification, target enemy suffers Cryo DMG taken +19.6% for 15s.", img:"" },
  { id:"finishing-call",           name:"Finishing Call",           rarity:5, type:"Greatsword", base_atk:411, stat1:"Strength +124",         stat2:"Max HP +62.40%",             passive:"Combo Skill HP Treatment effect +56%.", img:"" },
  { id:"fortmaker",                name:"Fortmaker",                rarity:5, type:"Sword",      base_atk:411, stat1:"Intellect +124",        stat2:"Ultimate Gain Eff. +37.10%", passive:"Attack +14.00% and Arts Intensity +70.", img:"" },
  { id:"freedom-to-proselytize",   name:"Freedom to Proselytize",   rarity:5, type:"Arts Unit",  base_atk:411, stat1:"Will +124",             stat2:"Treatment Bonus +37.10%",    passive:"When the wielder restores HP with their own Battle Skill, the Controlled Operator is restored for another [168 + Will x 1.4]. Triggers once every 15s.", img:"" },
  { id:"monaihe",                  name:"Monaihe",                  rarity:5, type:"Arts Unit",  base_atk:411, stat1:"Will +124",             stat2:"Ultimate Gain Eff. +37.10%", passive:"Main Attribute +14.00% and Arts Intensity +70.", img:"" },
  { id:"obj-arts-identifier",      name:"OBJ Arts Identifier",      rarity:5, type:"Arts Unit",  base_atk:411, stat1:"Intellect +124",        stat2:"Arts Intensity +62",         passive:"After the wielder applies Arts Burst or Physical Status with their own Combo Skill, the entire team gains Heat DMG dealt and Electric DMG dealt +22.4% for 15s. Effects of the same name cannot stack.", img:"" },
  { id:"obj-edge-of-lightness",    name:"OBJ Edge of Lightness",    rarity:5, type:"Sword",      base_atk:411, stat1:"Agility +124",          stat2:"Attack +31.20%",             passive:"After the wielder recovers SP by their own skill, the entire team gains Heat DMG dealt and Electric DMG dealt +8.4% for 20s. Max stacks: 3. Duration per stack counted separately.", img:"" },
  { id:"obj-heavy-burden",         name:"OBJ Heavy Burden",         rarity:5, type:"Greatsword", base_atk:411, stat1:"Strength +124",         stat2:"Max HP +62.40%",             passive:"After the wielder applies Knocked Down or Weakened, DEF +50.4% for 15s. Effects of the same name cannot stack.", img:"" },
  { id:"obj-razorhorn",             name:"OBJ Razorhorn",             rarity:5, type:"Polearm",    base_atk:411, stat1:"Will +124",             stat2:"Physical DMG Bonus +34.70%", passive:"To enemies with Cryo Infliction or Solidification, DMG dealt +22.4%. After consuming Solidification, ATK +33.6% for 15s. Effects of the same name cannot stack.", img:"" },
  { id:"obj-velocitous",           name:"OBJ Velocitous",           rarity:5, type:"Handcannon", base_atk:411, stat1:"Agility +124",          stat2:"Ultimate Gain Eff. +37.10%", passive:"After the wielder consumes an Arts Infliction, gains Nature DMG dealt +[14% x Stacks Consumed] for 20s. Effects of the same name cannot stack.", img:"" },
  { id:"opus-the-living",          name:"Opus: The Living",         rarity:5, type:"Handcannon", base_atk:411, stat1:"Agility +124",          stat2:"Arts DMG Bonus +34.70%",     passive:"After the wielder applies an Arts Reaction, ATK +21% for 20s. Max stacks: 2. Duration per stack counted separately. Triggers once every 0.1s.", img:"" },
  { id:"rational-farewell",        name:"Rational Farewell",        rarity:5, type:"Handcannon", base_atk:411, stat1:"Strength +124",         stat2:"Heat DMG Bonus +34.70%",     passive:"After the wielder's combo skill applies Arts Burst or Combustion, ATK +44.8% for 15s. Effects of the same name cannot stack.", img:"" },
  { id:"seeker-of-dark-lung",      name:"Seeker of Dark Lung",      rarity:5, type:"Greatsword", base_atk:411, stat1:"Strength +124",         stat2:"Ultimate Gain Eff. +37.10%", passive:"After the wielder applies an Arts Burst, ATK +16.8% for 30s. Max stacks: 3. Duration per stack counted separately. Triggers once every 0.1s.", img:"" },
  { id:"stanza-of-memorials",      name:"Stanza of Memorials",      rarity:5, type:"Arts Unit",  base_atk:411, stat1:"Intellect +124",        stat2:"Attack +31.20%",             passive:"After the wielder casts an Ultimate, Operators whose elements differ from the wielder gain ATK +22.4% for 20s. Effects of the same name cannot stack.", img:"" },
  { id:"sundering-steel",          name:"Sundering Steel",          rarity:5, type:"Sword",      base_atk:411, stat1:"Agility +124",          stat2:"Physical DMG Bonus +34.70%", passive:"After the wielder deals a Physical Status, ATK +21% for 20s. Max stacks: 2. Duration per stack counted separately. Triggers once every 0.1s.", img:"" },
  { id:"twelve-questions",         name:"Twelve Questions",         rarity:5, type:"Sword",      base_atk:411, stat1:"Agility +124",          stat2:"Attack +31.20%",             passive:"After the wielder consumes an Arts Reaction, ATK +21% for 20s. Max stacks: 2. Duration per stack counted separately.", img:"" },
  { id:"wild-wanderer",            name:"Wild Wanderer",            rarity:5, type:"Arts Unit",  base_atk:411, stat1:"Intellect +124",        stat2:"Electric DMG Bonus +34.70%", passive:"After the wielder applies Electrification, the team gains Physical DMG dealt and Electric DMG dealt +22.4% for 15s. Effects of the same name cannot stack.", img:"" },

  // ── 4★ ──────────────────────────────────────────────────────────────────
  { id:"aggeloslayer",             name:"Aggeloslayer",             rarity:4, type:"Polearm",    base_atk:341, stat1:"Will +93",              stat2:"Arts DMG Bonus +26.00%",     passive:"After the wielder's Battle Skill hits the enemy, ATK +33.6% for 20s. Effects of the same name cannot stack.", img:"assets/WeaponsFullAssets/Aggeloslayer.png" },
  { id:"contingent-measure",       name:"Contingent Measure",       rarity:4, type:"Sword",      base_atk:341, stat1:"Agility +93",           stat2:"Physical DMG Bonus +26.00%", passive:"After the wielder's Battle Skill hits the enemy, ATK +33.6% for 20s. Effects of the same name cannot stack.", img:"" },
  { id:"fluorescent-roc",          name:"Fluorescent Roc",          rarity:4, type:"Arts Unit",  base_atk:341, stat1:"Will +93",              stat2:"Attack +23.40%",             passive:"After the wielder's Battle Skill hits the enemy, ATK +33.6% for 20s. Effects of the same name cannot stack.", img:"" },
  { id:"howling-guard",            name:"Howling Guard",            rarity:4, type:"Handcannon", base_atk:341, stat1:"Intellect +93",         stat2:"Attack +23.40%",             passive:"After the wielder's Battle Skill hits the enemy, ATK +33.6% for 20s. Effects of the same name cannot stack.", img:"" },
  { id:"hypernova-auto",           name:"Hypernova Auto",           rarity:4, type:"Arts Unit",  base_atk:341, stat1:"Intellect +93",         stat2:"Arts DMG Bonus +26.00%",     passive:"When the wielder's HP is above 80%, ATK +42%.", img:"" },
  { id:"industry-0-1",             name:"Industry 0.1",             rarity:4, type:"Greatsword", base_atk:341, stat1:"Strength +93",          stat2:"Attack +23.40%",             passive:"After the wielder's Battle Skill hits the enemy, ATK +33.6% for 20s. Effects of the same name cannot stack.", img:"" },
  { id:"long-road",                name:"Long Road",                rarity:4, type:"Handcannon", base_atk:341, stat1:"Strength +93",          stat2:"Arts DMG Bonus +26.00%",     passive:"After the wielder casts a Combo Skill, ATK +33.6% for 20s. Effects of the same name cannot stack.", img:"" },
  { id:"pathfinders-beacon",       name:"Pathfinder's Beacon",      rarity:4, type:"Polearm",    base_atk:341, stat1:"Agility +93",           stat2:"Attack +23.40%",             passive:"When the wielder's HP is above 80%, ATK +42%.", img:"" },
  { id:"quencher",                 name:"Quencher",                 rarity:4, type:"Greatsword", base_atk:341, stat1:"Will +93",              stat2:"Max HP +46.80%",             passive:"After the wielder performs a Final Strike on the enemy, ATK +33.6% for 10s. Effects of the same name cannot stack.", img:"" },
  { id:"wave-tide",                name:"Wave Tide",                rarity:4, type:"Sword",      base_atk:341, stat1:"Intellect +93",         stat2:"Attack +23.40%",             passive:"After the wielder casts a Combo Skill, ATK +33.6% for 20s. Effects of the same name cannot stack.", img:"" },

  // ── 3★ ──────────────────────────────────────────────────────────────────
  { id:"darhoff-7",                name:"Darhoff 7",                rarity:3, type:"Greatsword", base_atk:283, stat1:"Main Attribute +79",    stat2:"—",                          passive:"Flat ATK +34.", img:"" },
  { id:"jiminy-12",                name:"Jiminy 12",                rarity:3, type:"Arts Unit",  base_atk:283, stat1:"Main Attribute +79",    stat2:"—",                          passive:"Flat ATK +34.", img:"" },
  { id:"opero-77",                 name:"Opero 77",                 rarity:3, type:"Polearm",    base_atk:283, stat1:"Main Attribute +79",    stat2:"—",                          passive:"Flat ATK +34.", img:"" },
  { id:"peco-5",                   name:"Peco 5",                   rarity:3, type:"Handcannon", base_atk:283, stat1:"Main Attribute +79",    stat2:"—",                          passive:"Flat ATK +34.", img:"" },
  { id:"tarr-11",                  name:"Tarr 11",                  rarity:3, type:"Sword",      base_atk:283, stat1:"Main Attribute +79",    stat2:"—",                          passive:"Flat ATK +34.", img:"" }
];

// Pre-compute stat tags for each weapon
WEAPONS.forEach(w => { w._tags = getStatTags(w); });

// ==========================================
// DOM REFS
// ==========================================
const grid        = document.getElementById('cardGrid');
const searchInput = document.getElementById('wpnSearch');
const filters     = { rarity: new Set(), type: new Set(), stat: new Set() };
let currentSort   = 'rarity';

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

  // ── FIX: id is embedded directly in the card HTML so it's always available ──
  return `
    <div class="wpn-card rarity-${w.rarity} bg-${typeKey}"
         data-name="${w.name.toLowerCase()}"
         data-rarity="${w.rarity}"
         data-type="${w.type}"
         data-atk="${w.base_atk || 0}"
         data-tags="${w._tags.join('|')}"
         data-id="${w.id}">

      <div class="card-placeholder">${w.name.charAt(0)}</div>
      ${imgTag}
      <div class="card-vignette"></div>

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
        <div class="passive-text">${w.passive || 'No data available.'}</div>
      </div>

      ${w.passive ? `<button class="passive-btn" title="Toggle passive" aria-label="Toggle passive">▾</button>` : ''}
    </div>
  `;
}

// ==========================================
// FILTER & SORT
// ==========================================
function updateFilters() {
  const query = searchInput.value.toLowerCase();
  let visible = 0;

  document.querySelectorAll('.wpn-card').forEach(card => {
    const tags = card.dataset.tags ? card.dataset.tags.split('|') : [];
    const ok =
      card.dataset.name.includes(query) &&
      (filters.rarity.size === 0 || filters.rarity.has(card.dataset.rarity)) &&
      (filters.type.size   === 0 || filters.type.has(card.dataset.type)) &&
      (filters.stat.size   === 0 || [...filters.stat].every(t => tags.includes(t)));

    card.classList.toggle('hidden', !ok);
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
  const cards = Array.from(grid.querySelectorAll('.wpn-card'));
  cards.sort((a, b) => {
    if (currentSort === 'rarity') {
      const diff = parseInt(b.dataset.rarity) - parseInt(a.dataset.rarity);
      return diff !== 0 ? diff : a.dataset.name.localeCompare(b.dataset.name);
    }
    if (currentSort === 'name') return a.dataset.name.localeCompare(b.dataset.name);
    if (currentSort === 'atk')  return parseInt(b.dataset.atk) - parseInt(a.dataset.atk);
    return 0;
  });
  cards.forEach(c => grid.appendChild(c));
}

// ==========================================
// INIT
// ==========================================
grid.innerHTML = WEAPONS.map(createCard).join('');
applySort();

// Inject icons into type filter pills
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

// ==========================================
// CARD CLICK — passive toggle OR navigate
// ==========================================
grid.addEventListener('click', e => {
  // Passive toggle button — open/close dropdown, do NOT navigate
  const btn = e.target.closest('.passive-btn');
  if (btn) {
    e.stopPropagation();
    const card  = btn.closest('.wpn-card');
    const isOpen = card.classList.contains('passive-open');
    document.querySelectorAll('.wpn-card.passive-open').forEach(c => c.classList.remove('passive-open'));
    if (!isOpen) card.classList.add('passive-open');
    return;
  }

  // Clicks inside the open passive dropdown — don't navigate
  if (e.target.closest('.passive-dropdown')) return;

  // Everything else on a card — navigate to WeaponIntroduction
  const card = e.target.closest('.wpn-card');
  if (card && card.dataset.id) {
    window.location.href = `WeaponIntroduction.html?weapon=${card.dataset.id}`;
  }
});

// Close passive dropdown on outside click
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
// FILTER PILLS (rarity + type)
// ==========================================
document.querySelectorAll('.filter-row .pill:not(.stat-tag)').forEach(btn => {
  btn.addEventListener('click', () => {
    const groupEl = btn.closest('[data-group]');
    if (!groupEl) return;
    const group = groupEl.dataset.group;
    const val   = btn.dataset.val;
    if (filters[group].has(val)) { filters[group].delete(val); btn.classList.remove('active'); }
    else                         { filters[group].add(val);    btn.classList.add('active'); }
    updateFilters();
  });
});

// ==========================================
// STAT TAG PILLS
// ==========================================
document.querySelectorAll('.pill.stat-tag').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.dataset.val;
    if (filters.stat.has(val)) { filters.stat.delete(val); btn.classList.remove('active'); }
    else                       { filters.stat.add(val);    btn.classList.add('active'); }
    updateFilters();
  });
});

// ==========================================
// CLEAR
// ==========================================
document.getElementById('clearBtn').addEventListener('click', () => {
  searchInput.value = '';
  filters.rarity.clear(); filters.type.clear(); filters.stat.clear();
  document.querySelectorAll('.filter-row .pill').forEach(b => b.classList.remove('active'));
  updateFilters();
});

// ==========================================
// SORT BUTTONS
// ==========================================
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.sort;
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