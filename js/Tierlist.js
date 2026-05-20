
const SUPABASE_URL      = 'https://vjcucliqjjljhgbqshmi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3VjbGlxampsamhnYnFzaG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTU3MTIsImV4cCI6MjA5NDA3MTcxMn0.qq7tRmLpRjTv0y4dZxCjcEQ48rTiY5ZV1xunr32kh10';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TIER_ORDER=['T0','T0.5','T1','T1.5','T2'];
const TIER_META_MAP={
    'T0':{label:'T0',sub:'APEX',cssClass:'tier-T0'},
    'T0.5':{label:'T0.5',sub:'ELITE',cssClass:'tier-T05'},
    'T1':{label:'T1',sub:'STRONG',cssClass:'tier-T1'},
    'T1.5':{label:'T1.5',sub:'SOLID',cssClass:'tier-T15'},
    'T2':{label:'T2',sub:'SITUATIONAL',cssClass:'tier-T2'},
};
const ROLE_ORDER=['damage','enabler','buffer'];
const ROLE_META={
    damage:{label:'Damage',sideClass:'cat-dmg'},
    enabler:{label:'Enabler',sideClass:'cat-ena'},
    buffer:{label:'Buffer',sideClass:'cat-buf'},
};

/* Fallback accordion (display only, no editing here) */
const FALLBACK_ACCORDION={
    general:[
        {key:'about',icon:'01',title:'About the Tier List',html:'<p>Arknights: Endfield is a game where <strong>team building matters immensely</strong>. There are two tier lists: a <strong>General Tier List</strong> and a <strong>Team Tier List</strong>. Our general tier list ranks all characters within categories according to their role and contribution, as well as their impact on the meta.</p><p>The tier list criteria are based on the current hardest content — <strong>Umbral Monument</strong>.</p>'},
        {key:'categories',icon:'02',title:'Categories &amp; Tags',html:'<ul><li><strong>Damage</strong> — Characters whose main purpose is to deal damage.</li><li><strong>Enabler</strong> — Characters who assist others beyond buffs.</li><li><strong>Buffer</strong> — Characters who provide buffs or debuffs that multiply overall damage.</li></ul><p><strong>[Expert]</strong> — Optimal playstyle must be mastered. Without the necessary skills, performance may drop by at least one tier.</p>'},
        {key:'criteria',icon:'03',title:'Evaluation Criteria',html:'<p>Assessment assumes Operators at Level <strong>90</strong>, Skills at max Rank, optimal Gear/Sets, P0 for 6★ and 5★. All Operators start at <strong>zero Ultimate Energy</strong>.</p>'},
        {key:'changelog',icon:'04',title:'Changelog',html:'<div class="changelog-entry"><div class="changelog-date">20.01.2026</div><ul><li>Initial release.</li></ul></div>'},
    ],
    team:[
        {key:'team-about',icon:'01',title:'About the Team Tier List',html:'<p>The team tier list ranks the <strong>performance of full team compositions</strong> relative to one another in endgame content.</p>'},
        {key:'team-criteria',icon:'02',title:'Ratings &amp; Criteria',html:'<p>When assessing the power of a team, only the <strong>best character combinations</strong> are considered.</p>'},
        {key:'team-changelog',icon:'03',title:'Changelog',html:'<div class="changelog-entry"><div class="changelog-date">20.01.2026</div><ul><li>Initial release.</li></ul></div>'},
    ],
};

const FALLBACK_DATA={
    lastUpdated:'17/04/2026',
    characters:[
        {name:'Laevatain',tier:'T0',role:'damage',rarity:6},{name:'Rossi',tier:'T0',role:'damage',rarity:6},
        {name:'Yvonne',tier:'T0',role:'damage',rarity:6},{name:'Zhuang Fangyi',tier:'T0',role:'damage',rarity:6,is_new:true,watchlist:'up'},
        {name:'Tangtang',tier:'T0',role:'enabler',rarity:6},{name:'Gilberta',tier:'T0',role:'buffer',rarity:6},
        {name:'Pogranichnik',tier:'T0',role:'buffer',rarity:6},{name:'Last Rite',tier:'T0.5',role:'damage',rarity:6},
        {name:'Chen Qianyu',tier:'T0.5',role:'enabler',rarity:5},{name:'Lifeng',tier:'T0.5',role:'enabler',rarity:5},
        {name:'Wulfgard',tier:'T0.5',role:'enabler',rarity:5},{name:'Akekuri',tier:'T0.5',role:'buffer',rarity:5},
        {name:'Ardelia',tier:'T0.5',role:'buffer',rarity:6},{name:'Perlica',tier:'T0.5',role:'buffer',rarity:5},
        {name:'Xaihi',tier:'T0.5',role:'buffer',rarity:5},{name:'Avywenna',tier:'T1',role:'damage',rarity:6,is_expert:true},
        {name:'Da Pan',tier:'T1',role:'damage',rarity:5},{name:'Endministrator',tier:'T1',role:'damage',rarity:4},
        {name:'Alesh',tier:'T1',role:'enabler',rarity:5},{name:'Arclight',tier:'T1',role:'enabler',rarity:6,is_expert:true},
        {name:'Ember',tier:'T1',role:'enabler',rarity:4},{name:'Snowshine',tier:'T1',role:'enabler',rarity:5},
        {name:'Antal',tier:'T1',role:'buffer',rarity:6},{name:'Estella',tier:'T1.5',role:'enabler',rarity:5},
        {name:'Fluorite',tier:'T1.5',role:'enabler',rarity:5},{name:'Catcher',tier:'T2',role:'enabler',rarity:4},
    ],
    teams:[
        {name:'Laevatain Hyper',tier:'T0',is_expert:false,memberGroups:[['Laevatain'],['Wulfgard','Akekuri'],['Antal','Akekuri'],['Ardelia','Gilberta']]},
        {name:'Last Rite Hyper',tier:'T0.5',is_expert:false,memberGroups:[['Last Rite'],['Xaihi'],['Ardelia'],['Perlica','Fluorite']]},
        {name:'Endmin Physical',tier:'T1',is_expert:false,memberGroups:[['Endministrator'],['Chen Qianyu'],['Pogranichnik'],['Ardelia']]},
    ],
};

let allChars=[],allTeams=[],charMap={},activeFilter='all',searchQuery='';

function buildCharMap(chars){const map={};for(const c of chars){map[c.name.toLowerCase()]=c;if(c.slug)map[c.slug]=c;}return map;}

function setStatus(state,msg,count){
    const bar=document.getElementById('status-bar'),icon=document.getElementById('db-icon'),text=document.getElementById('db-status'),cnt=document.getElementById('db-count');
    bar.className='state-'+state;
    icon.textContent={loading:'◌',connected:'✓',error:'✗'}[state]||'◌';
    text.textContent=msg;cnt.textContent=count||'';
}

/* Accordion — read-only render */
function renderAccordion(sectionKey,items){
    const container=document.getElementById(`accordion-${sectionKey}`);
    container.innerHTML='';
    items.forEach(item=>{
        const el=document.createElement('div');el.className='accordion-item';el.dataset.key=item.key;
        el.innerHTML=`<button class="accordion-trigger" data-acc="${sectionKey}-${item.key}">
            <span class="accordion-trigger-left">
                <span class="accordion-icon">${item.icon}</span>
                <span class="accordion-title">${item.title}</span>
            </span>
            <span class="accordion-caret">▼</span>
        </button>
        <div class="accordion-body" id="acc-${sectionKey}-${item.key}"><div class="acc-display-content">${item.html}</div></div>`;
        container.appendChild(el);
    });
    container.querySelectorAll('.accordion-trigger').forEach(trigger=>{
        trigger.addEventListener('click',()=>{
            const key=trigger.dataset.acc,body=document.getElementById('acc-'+key),open=body.classList.contains('open');
            body.classList.toggle('open',!open);trigger.classList.toggle('open',!open);
        });
    });
}

async function loadAccordionContent(sectionKey){
    try{
        const{data,error}=await db.from('tier_meta').select('value').eq('key',`accordion_${sectionKey}`).single();
        if(error||!data?.value)throw new Error('not found');
        const items=JSON.parse(data.value);
        const merged=FALLBACK_ACCORDION[sectionKey].map(fb=>{const live=items.find(i=>i.key===fb.key);return live?{...fb,html:live.html}:fb;});
        renderAccordion(sectionKey,merged);
    }catch{renderAccordion(sectionKey,FALLBACK_ACCORDION[sectionKey]);}
}

/* Character card */
function buildCard(char){
    const div=document.createElement('div');div.className='char-card';div.dataset.role=char.role;div.dataset.name=char.name.toLowerCase();
    const rarity=char.rarity||5,initials=char.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const tags=[];
    if(char.is_new)tags.push(`<span class="tag-pill tag-new">NEW</span>`);
    if(char.is_expert)tags.push(`<span class="tag-pill tag-expert">EXP</span>`);
    if(char.watchlist==='up')tags.push(`<span class="tag-pill tag-watchup">▲</span>`);
    if(char.watchlist==='down')tags.push(`<span class="tag-pill tag-watchdn">▼</span>`);
    const imgTag=char.img_path?`<img src="${char.img_path}" alt="${char.name}" loading="lazy">`:`<div class="placeholder-avatar">${initials}</div>`;
    div.innerHTML=`<div class="char-portrait">${imgTag}${tags.length?`<div class="char-tags">${tags.join('')}</div>`:''}<div class="rarity-bar rarity-${rarity}"></div></div><div class="char-name">${char.name}</div>`;
    if(char.slug){div.style.cursor='pointer';div.addEventListener('click',()=>{window.location.href=`CharacterIntroduction.html?char=${char.slug}`;});}
    return div;
}

function renderTierList(characters){
    const container=document.getElementById('tier-list-container');container.innerHTML='';
    const grouped={};for(const tier of TIER_ORDER)grouped[tier]={damage:[],enabler:[],buffer:[]};
    for(const char of characters){if(grouped[char.tier]?.[char.role])grouped[char.tier][char.role].push(char);}
    const headerRow=document.createElement('div');headerRow.className='tier-col-headers';headerRow.id='tier-col-headers';
    headerRow.innerHTML=`<div class="col-spacer"></div><div class="tier-col-header col-dmg">Damage</div><div class="tier-col-header col-ena">Enabler</div><div class="tier-col-header col-buf">Buffer</div>`;
    container.appendChild(headerRow);
    for(const tier of TIER_ORDER){
        const meta=TIER_META_MAP[tier],tierData=grouped[tier];
        const section=document.createElement('div');section.className='tier-section';section.dataset.tier=tier;
        const row=document.createElement('div');row.className='tier-row';row.dataset.tier=tier;
        const label=document.createElement('div');label.className=`tier-label ${meta.cssClass}`;
        label.innerHTML=`<span class="tier-name">${meta.label}</span><span class="tier-sub">${meta.sub}</span>`;
        row.appendChild(label);
        for(const role of ROLE_ORDER){
            const chars=tierData[role],rm=ROLE_META[role];
            const col=document.createElement('div');col.className='category-col';col.dataset.role=role;col.dataset.tier=tier;
            const sidePill=document.createElement('span');sidePill.className=`cat-side-label ${rm.sideClass}`;sidePill.textContent=rm.label;
            col.appendChild(sidePill);
            const wrap=document.createElement('div');wrap.className='chars-wrap';
            if(!chars.length){const e=document.createElement('div');e.className='empty-row';e.textContent='—';wrap.appendChild(e);}
            else chars.forEach(c=>wrap.appendChild(buildCard(c)));
            col.appendChild(wrap);row.appendChild(col);
        }
        section.appendChild(row);container.appendChild(section);
    }
    document.getElementById('char-count').textContent=`${characters.length} characters`;
    applyFilters();
}

/* Team card */
function buildTeamMember(name){
    const char=charMap[name.toLowerCase()],rarity=char?(char.rarity||5):5;
    const initials=name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const imgTag=(char&&char.img_path)?`<img src="${char.img_path}" alt="${name}" loading="lazy">`:`<div class="placeholder-avatar">${initials}</div>`;
    const el=document.createElement('div');el.className='team-member';
    const slug=char?char.slug:null;
    if(slug){el.style.cursor='pointer';el.addEventListener('click',()=>{window.location.href=`CharacterIntroduction.html?char=${slug}`;});}
    el.innerHTML=`<div class="team-member-portrait">${imgTag}<div class="rarity-bar rarity-${rarity}"></div></div><div class="team-member-name">${name}</div>`;
    return el;
}

function buildTeamCard(team){
    const card=document.createElement('div');card.className='team-card';
    const header=document.createElement('div');header.className='team-card-header';
    const nameEl=document.createElement('div');nameEl.className='team-name';nameEl.textContent=team.name;
    header.appendChild(nameEl);
    if(team.is_expert){const tag=document.createElement('span');tag.className='team-tag team-tag-expert';tag.textContent='Expert';header.appendChild(tag);}
    const members=document.createElement('div');members.className='team-members';
    (team.memberGroups||[]).forEach((group,gi)=>{
        if(gi>0){const div=document.createElement('div');div.className='team-divider';div.innerHTML=`<div class="team-divider-line"></div><span class="team-divider-label">OR</span><div class="team-divider-line"></div>`;members.appendChild(div);}
        group.forEach(name=>members.appendChild(buildTeamMember(name)));
    });
    card.appendChild(header);card.appendChild(members);return card;
}

function renderTeamTierList(teams){
    const container=document.getElementById('team-tier-list-container');container.innerHTML='';
    const grouped={};for(const tier of TIER_ORDER)grouped[tier]=[];
    for(const team of teams){if(grouped[team.tier])grouped[team.tier].push(team);}
    for(const tier of TIER_ORDER){
        const tierTeams=grouped[tier];if(!tierTeams.length)continue;
        const meta=TIER_META_MAP[tier],section=document.createElement('div');section.className='tier-section';
        const row=document.createElement('div');row.className='tier-row-team';
        const label=document.createElement('div');label.className=`tier-label ${meta.cssClass}`;
        label.innerHTML=`<span class="tier-name">${meta.label}</span><span class="tier-sub">${meta.sub}</span>`;
        const cells=document.createElement('div');cells.className='team-cells';
        tierTeams.forEach(team=>cells.appendChild(buildTeamCard(team)));
        row.appendChild(label);row.appendChild(cells);section.appendChild(row);container.appendChild(section);
    }
}

/* Filters */
function applyFilters(){
    const isFiltered=activeFilter!=='all';
    const headerRow=document.getElementById('tier-col-headers');
    if(headerRow)headerRow.classList.toggle('hidden',isFiltered);
    document.querySelectorAll('.char-card').forEach(card=>{
        const roleMatch=!isFiltered||card.dataset.role===activeFilter;
        const searchMatch=!searchQuery||card.dataset.name.includes(searchQuery);
        card.classList.toggle('hidden-card',!(roleMatch&&searchMatch));
    });
    document.querySelectorAll('.category-col').forEach(col=>{
        const roleMatch=!isFiltered||col.dataset.role===activeFilter;
        col.classList.toggle('hidden',!roleMatch);col.classList.toggle('filtered-col',isFiltered&&roleMatch);
    });
    document.querySelectorAll('.tier-row').forEach(row=>row.classList.toggle('filtered-mode',isFiltered));
}

document.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
        document.querySelectorAll('.filter-btn').forEach(b=>b.className='filter-btn');
        const filter=btn.dataset.filter,ac=btn.dataset.activeClass||'active-all';
        btn.classList.add(ac);activeFilter=filter;applyFilters();
    });
});
document.getElementById('search-input').addEventListener('input',e=>{searchQuery=e.target.value.toLowerCase().trim();applyFilters();});
document.querySelectorAll('.view-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
        document.querySelectorAll('.view-tab').forEach(t=>t.classList.remove('active'));
        document.querySelectorAll('.view-panel').forEach(p=>p.classList.remove('active'));
        tab.classList.add('active');document.getElementById('view-'+tab.dataset.view).classList.add('active');
    });
});

/* ── INIT ── */
async function init(){
    setStatus('loading','Connecting to database…');
    await Promise.all([loadAccordionContent('general'),loadAccordionContent('team')]);

    /* Load last-updated date */
    try{
        const{data:meta,error:metaErr}=await db.from('tier_meta').select('value').eq('key','last_updated').single();
        if(metaErr||!meta?.value)throw new Error('no meta');
        const d=new Date(meta.value);
        document.getElementById('last-updated').textContent=`Last updated: ${d.toLocaleDateString('en-GB')}`;
    }catch{document.getElementById('last-updated').textContent=`Last updated: ${FALLBACK_DATA.lastUpdated}`;}

    /* Load characters */
    try{
        const{data:chars,error:charErr}=await db.from('v_characters_tiered').select('*').order('name');
        if(charErr)throw charErr;
        const VALID_ROLES=['damage','enabler','buffer'],VALID_TIERS=['T0','T0.5','T1','T1.5','T2'];
        const validRows=(chars||[]).filter(c=>VALID_TIERS.includes(c.tier)&&VALID_ROLES.includes(c.role));
        if(validRows.length>0){allChars=chars;}
        else if(chars&&chars.length){
            allChars=FALLBACK_DATA.characters.map(fb=>{
                const live=chars.find(c=>c.name?.toLowerCase()===fb.name.toLowerCase());
                return live?{...fb,slug:live.slug,img_path:live.img_path||null,rarity:live.rarity||fb.rarity}:fb;
            });
        }else{allChars=FALLBACK_DATA.characters;}
        charMap=buildCharMap(allChars);
        setStatus('connected','Connected',`${allChars.length} operators loaded`);
        renderTierList(allChars);
    }catch(err){
        setStatus('error','DB error — using local fallback','fallback data active');
        document.getElementById('last-updated').textContent=`Last updated: ${FALLBACK_DATA.lastUpdated}`;
        allChars=FALLBACK_DATA.characters;charMap=buildCharMap(allChars);renderTierList(allChars);
    }

    /* Load teams */
    try{
        const{data:teamRows,error:teamErr}=await db.from('teams').select('*,team_members(*)').order('sort_order');
        if(teamErr)throw teamErr;
        if(!teamRows||!teamRows.length){allTeams=FALLBACK_DATA.teams;}
        else{
            allTeams=teamRows.map(team=>{
                const members=(team.team_members||[]).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
                const groups={};
                for(const m of members){const gi=m.group_index||0;if(!groups[gi])groups[gi]=[];const char=allChars.find(c=>c.slug===m.character_slug);const displayName=char?char.name:m.character_slug;groups[gi].push(displayName);}
                team.memberGroups=Object.keys(groups).sort((a,b)=>a-b).map(k=>groups[k]);
                return team;
            });
        }
    }catch{allTeams=FALLBACK_DATA.teams;}
    renderTeamTierList(allTeams);
    const total=allChars.length+allTeams.length;
    setStatus('connected','DIJANG connected',`${allChars.length} operators · ${allTeams.length} teams loaded`);
}

init();
