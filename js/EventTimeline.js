(async function () {
    /* ─────────────────────────────────────────────
       DYNAMIC EVENT DATA FETCHING
    ───────────────────────────────────────────── */
    var currentEvents = [];
    var upcomingEvents = [];
  
    const SUPABASE_URL = 'https://vjcucliqjjljhgbqshmi.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3VjbGlxampsamhnYnFzaG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTU3MTIsImV4cCI6MjA5NDA3MTcxMn0.qq7tRmLpRjTv0y4dZxCjcEQ48rTiY5ZV1xunr32kh10';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
    try {
        const { data: dbEvents } = await db.from('homepage_events').select('*');
        if (dbEvents) {
            dbEvents.forEach(ev => {
                var mapped = {
                    name: ev.name,
                    type: ev.event_type || 'event',
                    duration: ev.duration_label || '',
                    desc: ev.description || '',
                    tags: ev.tags || [],
                    // Ensure timestamps are correctly converted to milliseconds
                    end: ev.end_date ? new Date(ev.end_date).getTime() : null,
                    start: ev.start_date ? new Date(ev.start_date).getTime() : null,
                    startLabel: ev.duration_label,
                    banner: ev.banner_url
                };
                if (ev.status === 'upcoming') { upcomingEvents.push(mapped); } 
                else { currentEvents.push(mapped); }
            });
        }
    } catch(e) { console.error("Failed to load events:", e); }
  
    /* ─────────────────────────────────────────────
       EVENT DATA, COLORS & REGION MATH
    ───────────────────────────────────────────── */
    
    // Game servers reset at different times. 
    // If NA is 0, EU finishes ~6 hours earlier, Asia finishes ~14 hours earlier.
    var regionOffsets = { NA: 0, EU: -6, Asia: -14 }; 
    
    var COLORS = {
      banner:   { bg: 'rgba(40,25,60,0.95)' },
      combat:   { bg: 'rgba(90,30,30,0.95)' },
      event:    { bg: 'rgba(30,45,70,0.95)' },
      signin:   { bg: 'rgba(35,70,45,0.95)' },
      endgame:  { bg: 'rgba(25,35,65,0.95)' },
      rerun:    { bg: 'rgba(80,60,20,0.95)' },
    };
  
    function formatCountdown(ms) {
      if (ms <= 0) return 'ENDING';
      var totalSec = Math.floor(ms / 1000);
      var d = Math.floor(totalSec / 86400);
      var h = Math.floor((totalSec % 86400) / 3600);
      var m = Math.floor((totalSec % 3600) / 60);
      var s = Math.floor(totalSec % 60); // Added seconds!
  
      // If it's more than a day away, show Days, Hours, Minutes
      if (d > 0) return d + 'd ' + h + 'h ' + m + 'm';
      // If it's under 24 hours, show Hours, Minutes, Seconds
      return h + 'h ' + m + 'm ' + s + 's';
    }
  
    function timerClass(msLeft) {
      if (msLeft === null) return '';
      if (msLeft < 86400000 * 3) return 'ending-soon'; // Turns red under 3 days
      return '';
    }
  
    function startTimerClass(msUntil) {
      if (msUntil < 86400000 * 3) return 'upcoming-soon'; // Turns blue under 3 days
      return '';
    }
  
    /* ─────────────────────────────────────────────
       BUILD CARDS
    ───────────────────────────────────────────── */
    function buildCard(ev, isUpcoming, regionOffset) {
      var colors = COLORS[ev.type] || COLORS.event;
      var card = document.createElement('div');
      card.className = 'et-event-card';
      card.style.borderColor = 'rgba(255,255,255,0.07)';
  
      var defaultImg = 'assets/HomepageAssets/OperatorList/LaevatainBg.png';
      var bgImage = ev.banner ? `url('${ev.banner}')` : `url('${defaultImg}')`;
      var bgStyle = `background: linear-gradient(90deg, ${colors.bg} 20%, rgba(10,10,14,0.3) 100%), ${bgImage} center right / cover no-repeat;`;
  
      // Write the raw target time into the HTML data attributes so tick() can read it
      var rawEnd = isUpcoming ? (ev.start || '') : (ev.end || '');
  
      card.innerHTML =
        `<div class="et-event-bar" style="${bgStyle}">
          <div class="et-event-bar-left">
            <div class="et-event-name">${ev.name}</div>
          </div>
          <div class="et-event-bar-right">
            <span class="et-event-timer" data-end="${rawEnd}" data-upcoming="${isUpcoming?1:0}" data-offset="${regionOffset}">CALCULATING...</span>
            <span class="et-chevron">&#9660;</span>
          </div>
        </div>
        <div class="et-event-details">
          <div class="et-event-details-inner">
            <div class="et-event-duration">&#9632; ${isUpcoming ? 'STARTS: ' + ev.startLabel : ev.duration}</div>
            <p class="et-event-desc">${ev.desc}</p>
            <div class="et-event-tags">${ev.tags.map(t => `<span class="et-event-tag">${t}</span>`).join('')}</div>
          </div>
        </div>`;
  
      card.querySelector('.et-event-bar').addEventListener('click', function () {
        card.classList.toggle('open');
      });
  
      return card;
    }
  
    function renderList(listEl, events, isUpcoming, regionOffset) {
      listEl.innerHTML = '';
      events.forEach(function(ev) {
        listEl.appendChild(buildCard(ev, isUpcoming, regionOffset));
      });
    }
  
    /* ─────────────────────────────────────────────
       REGION TAB WIRING & LIVE TICKING
    ───────────────────────────────────────────── */
    var currentRegion = 'NA';
    var upcomingRegion = 'NA';
  
    var currentList  = document.getElementById('et-current-list');
    var upcomingList = document.getElementById('et-upcoming-list');
  
    function render() {
      renderList(currentList,  currentEvents,  false, regionOffsets[currentRegion]  || 0);
      renderList(upcomingList, upcomingEvents, true,  regionOffsets[upcomingRegion] || 0);
      tick(); // Force an immediate time update when rendered!
    }
  
    document.querySelectorAll('.et-region-tabs').forEach(function(tabs) {
      tabs.querySelectorAll('.et-region-btn').forEach(function(btn) {
        btn.addEventListener('click', function () {
          tabs.querySelectorAll('.et-region-btn').forEach(function(b){ b.classList.remove('active'); });
          btn.classList.add('active');
          
          var col = tabs.dataset.col;
          var region = btn.dataset.region;
          
          if (col === 'current') currentRegion = region;
          else upcomingRegion = region;
          
          render(); // Re-render the column with the new region's math
        });
      });
    });
  
    function tick() {
      var nowMs = Date.now();
      document.querySelectorAll('.et-event-timer').forEach(function(el) {
        var endMs = parseInt(el.dataset.end, 10);
        var upcoming = el.dataset.upcoming === '1';
        var offset = parseInt(el.dataset.offset, 10) || 0;
        
        // If there is no specific end date, it's permanent.
        if (isNaN(endMs)) { 
            el.textContent = upcoming ? 'SOON' : 'ONGOING';
            el.className = 'et-event-timer';
            return; 
        }
  
        // Add the region offset (in hours) to the database's target time
        var adjusted = endMs + (offset * 3600000);
        var delta = adjusted - nowMs;
        
        if (upcoming) {
          el.textContent = delta <= 0 ? 'STARTED' : formatCountdown(delta);
          el.className = 'et-event-timer ' + startTimerClass(Math.max(delta, 0));
        } else {
          el.textContent = delta <= 0 ? 'ENDED' : formatCountdown(delta);
          el.className = 'et-event-timer ' + timerClass(Math.max(delta, 0));
        }
      });
    }
  
    // Load and start
    setTimeout(() => {
        render();
        setInterval(tick, 1000); // 1000ms = 1 second live ticking!
    }, 800);
  
  })();