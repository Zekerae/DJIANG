// js/HomepageData.js

window.addEventListener('DOMContentLoaded', async () => {
    // SECURITY NOTE: The Anon Key is safe to expose in the frontend because 
    // we have implemented Row Level Security (RLS) on the Supabase backend.
    const SUPABASE_URL = 'https://vjcucliqjjljhgbqshmi.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3VjbGlxampsamhnYnFzaG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTU3MTIsImV4cCI6MjA5NDA3MTcxMn0.qq7tRmLpRjTv0y4dZxCjcEQ48rTiY5ZV1xunr32kh10';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // ... (Paste the rest of your Supabase logic here: fetching infos, operators, weapons, config) ...
    // Note: Ensure you include the dynamic <script src="js/WeaponSpin.js"> injection block at the end of the weapons fetch!
});

window.addEventListener('DOMContentLoaded', async () => {
    const SUPABASE_URL = 'https://vjcucliqjjljhgbqshmi.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3VjbGlxampsamhnYnFzaG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTU3MTIsImV4cCI6MjA5NDA3MTcxMn0.qq7tRmLpRjTv0y4dZxCjcEQ48rTiY5ZV1xunr32kh10';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 0. FETCH ENDFIELD INFOS (Guides, Classes, Teams, etc.)
    const { data: infos, error: infoError } = await db.from('homepage_infos')
        .select('*')
        .order('sort_order', { ascending: true });

    if (infos && infos.length > 0) {
        // Render Classes
        document.getElementById('dyn-classes').innerHTML = infos.filter(i => i.category === 'classes').map(c => `
            <div class="ei-class-card">
                <div class="ei-class-card-header">
                    <div class="ei-class-icon">${c.icon_or_badge}</div>
                    <div class="ei-class-name">${c.title}</div>
                </div>
                <div class="ei-class-role">${c.subtitle}</div>
                <p class="ei-class-desc">${c.description}</p>
                <div class="ei-class-operators">
                    ${(c.metadata.operators || []).map(op => `<span class="ei-op-tag">${op}</span>`).join('')}
                </div>
            </div>
        `).join('');

        // Render Elements
        document.getElementById('dyn-elements').innerHTML = infos.filter(i => i.category === 'elements').map(e => `
            <div class="ei-element-card">
                <div class="ei-element-dot ${e.metadata.css}"></div>
                <div class="ei-element-name ${e.metadata.css}">${e.title}</div>
                <div class="ei-element-reaction">${e.subtitle}</div>
                <p class="ei-element-desc">${e.description}</p>
            </div>
        `).join('');

        // Render Reactions
        document.getElementById('dyn-reactions').innerHTML = infos.filter(i => i.category === 'reactions').map(r => `
            <div class="ei-reaction-card">
                <div class="ei-reaction-header">
                    <div class="ei-reaction-badge ${r.metadata.css}">${r.icon_or_badge}</div>
                    <div class="ei-reaction-name">${r.title}</div>
                </div>
                <div class="ei-reaction-trigger">${r.subtitle}</div>
                <p class="ei-reaction-desc">${r.description}</p>
            </div>
        `).join('');

        // Render Teams
        document.getElementById('dyn-teams').innerHTML = infos.filter(i => i.category === 'teams').map(t => `
            <div class="ei-archetype-row">
                <div class="ei-archetype-label">
                    <div class="ei-archetype-label-name">${t.title}</div>
                    <div class="ei-archetype-label-tag ${t.metadata.css}">${t.metadata.tag}</div>
                </div>
                <div class="ei-archetype-content">
                    <div class="ei-archetype-roles">
                        ${(t.metadata.roles || []).map(role => `
                            <div class="ei-archetype-role">
                                <span class="ei-archetype-role-label">${role.label}</span>
                                <span class="ei-archetype-role-value">${role.value}</span>
                            </div>
                        `).join('')}
                    </div>
                    <p class="ei-archetype-tip">${t.description}</p>
                </div>
            </div>
        `).join('');

        // Render Glossary
        document.getElementById('dyn-glossary').innerHTML = infos.filter(i => i.category === 'glossary').map(g => `
            <div class="ei-glossary-item">
                <div class="ei-glossary-term">${g.title}</div>
                <p class="ei-glossary-def">${g.description}</p>
            </div>
        `).join('');
    }
    
    // 1. FETCH HOMEPAGE OPERATORS
    // Notice we are pulling from 'homepage_operators' now!
    const { data: operators, error: opError } = await db.from('homepage_operators')
        .select('*')
        .order('sort_order', { ascending: true }); // Keeps them in the exact order you set

    if (operators && operators.length > 0) {
        const opList = document.getElementById('dynamic-operator-list');
        opList.innerHTML = operators.map(op => `
            <div class="item" style="background-image: url(${op.bg_image_url || 'assets/HomepageAssets/OperatorList/LaevatainBg.png'});">
                <div class="content">
                    <div class="title">${op.name.toUpperCase()}</div>
                    <div class="name">${op.name.toUpperCase()}</div>
                    <div class="des">${op.description || 'No description available.'}</div>
                    <div class="btn">
                        <button>Profile</button>
                        <button>Track</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 2. FETCH HOMEPAGE WEAPONS
    const { data: weapons, error: wpnError } = await db.from('homepage_weapons')
        .select('*')
        .order('sort_order', { ascending: true });

    if (weapons && weapons.length > 0) {
        const wpnRing = document.getElementById('carousel-ring');
        wpnRing.innerHTML = weapons.map((wpn, i) => `
            <div class="carousel-card" data-index="${i}">
                <div class="carousel-card-content">
                    <img src="${wpn.img_url || 'assets/HomepageAssets/WeaponCarousel/LoneBarge.jpg'}" alt="${wpn.name || 'Weapon'}">
                </div>
            </div>
        `).join('');
        
        // --- NEW FIX: Load the 3D Carousel script ONLY AFTER the weapons exist in the HTML ---
        const weaponScript = document.createElement('script');
        weaponScript.src = 'js/WeaponSpin.js';
        document.body.appendChild(weaponScript);
    }

    // 3. FETCH SITE CONFIG (FOOTER)
    const { data: config } = await db.from('site_config').select('*');
    if (config && config.length > 0) {
        
        // Developers
        const devs = config.find(c => c.section === 'developers');
        if (devs && devs.content) {
            document.getElementById('footer-devs').innerHTML = '<br><br><br>' + devs.content.map(d => `<div class="wipe-hover"><div class="tglitch-animation" data-speed="10" data-increment="5">${d.toUpperCase()}</div></div><br>`).join('');
        }
        
        // Socials
        const socials = config.find(c => c.section === 'socials');
        if (socials && socials.content) {
            document.getElementById('footer-socials').innerHTML = '<br><br><br>' + socials.content.map(s => `<div class="wipe-hover"><div class="tglitch-animation" data-speed="10" data-increment="5">${s.toUpperCase()}</div></div><br>`).join('');
        }
        
        // Sources
        const sources = config.find(c => c.section === 'sources');
        if (sources && sources.content) {
            document.getElementById('footer-sources').innerHTML = '<br><br><br>' + sources.content.map(s => `<div class="wipe-hover"><div class="tglitch-animation" data-speed="10" data-increment="5">${s.toUpperCase()}</div></div><br>`).join('');
        }
    }
});