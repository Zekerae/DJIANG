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
    "Striker": "assets/ClassAssets/Strikericon.png",
    "Guard": "assets/ClassAssets/Guardicon.png",
    "Vanguard": "assets/ClassAssets/Vanguardicon.png",
    "Caster": "assets/ClassAssets/Castericon.png",
    "Defender": "assets/ClassAssets/Defendericon.png",
    "Supporter": "assets/ClassAssets/supportericon.png"
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
  {id:"endministrator",name:"Endministrator",rarity:6,cls:"Guard",    element:"Physical",weapon:"Sword",      img:"assets/CharacterAssets/6-stars/Endministrator/Endministrator_Splash_Art.png"}, 
  {id:"ardelia",       name:"Ardelia",       rarity:6,cls:"Supporter",element:"Nature",  weapon:"Arts Unit",  img:"assets/CharacterAssets/6-stars/Ardelia/Ardelia_Splash_Art.png"},
  {id:"laevatain",     name:"Laevatain",     rarity:6,cls:"Striker",  element:"Heat",    weapon:"Sword",      img:"assets/CharacterAssets/6-stars/Laevatain/Laevatain_Splash_Art.png"},
  {id:"last-rite",     name:"Last Rite",     rarity:6,cls:"Striker",  element:"Cryo",    weapon:"Great Sword",img:"assets/CharacterAssets/6-stars/Last Rite/Last_Rite_Splash_Art.png"},
  {id:"yvonne",        name:"Yvonne",        rarity:6,cls:"Striker",  element:"Cryo",    weapon:"Hand Cannon",img:"assets/CharacterAssets/6-stars/Yvonne/Yvonne_Splash_Art.png"},
  {id:"gilberta",      name:"Gilberta",      rarity:6,cls:"Supporter",element:"Nature",  weapon:"Arts Unit",  img:"assets/CharacterAssets/6-stars/Gilberta/Gilberta_Splash_Art.png"},
  {id:"lifeng",        name:"Lifeng",        rarity:6,cls:"Guard",    element:"Physical",weapon:"Polearm",    img:"assets/CharacterAssets/6-stars/Lifeng/Lifeng_Splash_Art.png"},
  {id:"ember",         name:"Ember",         rarity:6,cls:"Defender", element:"Heat",    weapon:"Great Sword",img:"assets/CharacterAssets/6-stars/Ember/Ember_Splash_Art.png"},
  {id:"tangtang",      name:"Tangtang",      rarity:6,cls:"Caster",   element:"Cryo",    weapon:"Hand Cannon",img:"assets/CharacterAssets/6-stars/Tangtang/Tangtang_Splash_Art.png"},
  {id:"rossi",         name:"Rossi",         rarity:6,cls:"Guard",    element:"Physical",weapon:"Sword",      img:"assets/CharacterAssets/6-stars/Rossi/Rossi_Splash_Art.png"},
  {id:"pogranichnik",  name:"Pogranichnik",  rarity:6,cls:"Vanguard", element:"Physical",weapon:"Sword",      img:"assets/CharacterAssets/6-stars/Pogranichnik/Pogranichnik_Splash_Art.png"},
  {id:"zhuang-fangyi", name:"Zhuang Fangyi", rarity:6,cls:"Striker",  element:"Electric",weapon:"Arts Unit",  img:"assets/CharacterAssets/6-stars/Zhuang Fangyi/Zhuang_Fangyi_Splash_Art.png"},
  {id:"xaihi",         name:"Xaihi",         rarity:5,cls:"Supporter",element:"Cryo",    weapon:"Arts Unit",  img:"assets/CharacterAssets/5-stars/Xiahi/Xaihi_Splash_Art.png"},
  {id:"avywenna",      name:"Avywenna",      rarity:5,cls:"Striker",  element:"Electric",weapon:"Polearm",    img:"assets/CharacterAssets/5-stars/Avywenna/Avywenna_Splash_Art.png"},
  {id:"perlica",       name:"Perlica",       rarity:5,cls:"Caster",   element:"Electric",weapon:"Arts Unit",  img:"assets/CharacterAssets/5-stars/Perlica/Perlica_Splash_Art.png"},
  {id:"wulfgard",      name:"Wulfgard",      rarity:5,cls:"Caster",   element:"Heat",    weapon:"Hand Cannon",img:"assets/CharacterAssets/5-stars/Wulfgard/Wulfgard_Splash_Art.png"},
  {id:"alesh",         name:"Alesh",         rarity:5,cls:"Vanguard", element:"Cryo",    weapon:"Sword",      img:"assets/CharacterAssets/5-stars/Alesh/Alesh_Splash_Art.png"},
  {id:"arclight",      name:"Arclight",      rarity:5,cls:"Vanguard", element:"Electric",weapon:"Sword",      img:"assets/CharacterAssets/5-stars/Arclight/Arclight_Splash_Art.png"},
  {id:"chen-qianyu",   name:"Chen Qianyu",   rarity:5,cls:"Guard",    element:"Physical",weapon:"Sword",      img:"assets/CharacterAssets/5-stars/Chen Qianyu/Chen_Qianyu_Splash_Art.png"},
  {id:"da-pan",        name:"Da Pan",        rarity:5,cls:"Striker",  element:"Physical",weapon:"Great Sword",img:"assets/CharacterAssets/5-stars/Da Pan/Da_Pan_Splash_Art.png"},
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
let currentSort = 'rarity'; // Default sort

function createCard(op) {
  const stars = Array(op.rarity).fill(`<img src="${STAR_IMAGE}" class="star-icon" alt="★">`).join('');
  
  const imgTag = op.img 
    ? `<img src="${op.img}" class="card-art" onerror="this.style.display='none'">` 
    : `<div class="card-art"></div>`;

  const elemIconPath = ASSETS.elements[op.element] || '';
  const classIconPath = ASSETS.classes[op.cls] || '';
  const weaponIconPath = ASSETS.weapons[op.weapon] || '';

  return `
    <div class="op-card rarity-${op.rarity} bg-${op.element}" 
         data-name="${op.name.toLowerCase()}" 
         data-rarity="${op.rarity}" 
         data-class="${op.cls}"
         data-element="${op.element}"
         data-weapon="${op.weapon}"
         onclick="window.location.href='CharacterIntroduction.html?char=${op.id}'">
      
      <div class="card-placeholder">${op.name.charAt(0)}</div>
      ${imgTag}
      <div class="card-vignette"></div>
      
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
  `;
}

function updateFilters() {
  const query = searchInput.value.toLowerCase();
  let visibleCount = 0;
  
  document.querySelectorAll('.op-card').forEach(card => {
    const matchesSearch = card.dataset.name.includes(query);
    const matchesRarity = filters.rarity.size === 0 || filters.rarity.has(card.dataset.rarity);
    const matchesClass = filters.class.size === 0 || filters.class.has(card.dataset.class);
    const matchesElement = filters.element.size === 0 || filters.element.has(card.dataset.element);
    const matchesWeapon = filters.weapon.size === 0 || filters.weapon.has(card.dataset.weapon);

    if (matchesSearch && matchesRarity && matchesClass && matchesElement && matchesWeapon) {
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
  const opCards = cards.filter(card => card.classList.contains('op-card'));
  
  opCards.sort((a, b) => {
    if (currentSort === 'rarity') {
      const rA = parseInt(a.dataset.rarity);
      const rB = parseInt(b.dataset.rarity);
      if (rA !== rB) return rB - rA; 
      return a.dataset.name.localeCompare(b.dataset.name);
    } else if (currentSort === 'name') {
      return a.dataset.name.localeCompare(b.dataset.name); 
    }
  });
  
  opCards.forEach(card => grid.appendChild(card));
}

// Initial Render
grid.innerHTML = OPS.map(createCard).join('');
applySort();

// Inject icons into filter pills
document.querySelectorAll('.pill').forEach(pill => {
  const groupElement = pill.closest('[data-group]');
  if (!groupElement) return;
  
  const group = groupElement.dataset.group;
  const val = pill.dataset.val;
  let iconPath = '';

  if (group === 'element') iconPath = ASSETS.elements[val];
  if (group === 'class')   iconPath = ASSETS.classes[val];
  if (group === 'weapon')  iconPath = ASSETS.weapons[val];
  if (group === 'rarity')  iconPath = STAR_IMAGE; 

  if (iconPath) {
    pill.innerHTML = `<img src="${iconPath}" class="pill-icon" alt=""> ` + pill.innerHTML;
  }
});

// Filter & Search Listeners
searchInput.addEventListener('input', updateFilters);

document.querySelectorAll('.filter-row .pill').forEach(btn => {
  btn.addEventListener('click', () => {
    const groupElement = btn.closest('[data-group]');
    if (!groupElement) return;
    
    const group = groupElement.dataset.group;
    const val = btn.dataset.val;
    
    if (filters[group].has(val)) {
      filters[group].delete(val);
      btn.classList.remove('active');
    } else {
      filters[group].add(val);
      btn.classList.add('active');
    }
    updateFilters();
  });
});

document.getElementById('clearBtn').addEventListener('click', () => {
  searchInput.value = "";
  filters.rarity.clear();
  filters.class.clear();
  filters.element.clear();
  filters.weapon.clear();
  document.querySelectorAll('.filter-row .pill').forEach(b => b.classList.remove('active'));
  updateFilters();
});

// Sorting Listeners
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSort = btn.dataset.sort;
    applySort();
  });
});

// Sticky Dropdown Scroll Logic
const filterZone = document.getElementById('filterZone');
const filterToggleBtn = document.getElementById('filterToggleBtn');

window.addEventListener('scroll', () => {
  // Use a split threshold (150 and 80) to prevent the "flickering" loop
  if (window.scrollY > 150) {
    filterZone.classList.add('scrolled');
  } else if (window.scrollY < 80) {
    // Only expand it again if the user scrolls significantly back up
    filterZone.classList.remove('scrolled');
    filterZone.classList.remove('dropdown-open'); 
  }
});

filterToggleBtn.addEventListener('click', () => {
  filterZone.classList.toggle('dropdown-open');
});