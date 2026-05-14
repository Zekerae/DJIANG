/**
 * Auth.js — DJIANG Shared Authentication Utility
 * ─────────────────────────────────────────────────────────────────
 * Include this on any page to get:
 *   • Session detection (redirect to auth.html if not logged in)
 *   • A floating user widget (top-right) showing the logged-in user
 *   • window.DJAuth.user — the current session user
 *   • window.DJAuth.profile — the profile row from public.profiles
 *   • window.DJAuth.signOut() — sign out and redirect
 *   • window.DJAuth.requireAuth() — redirect to login if not signed in
 *   • window.DJAuth.requireAdmin() — redirect if not admin
 *
 * Usage:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="js/Auth.js"></script>
 *
 *   // In your page script (optional):
 *   await window.DJAuth.ready;          // wait for auth to load
 *   if (window.DJAuth.profile?.role === 'admin') { ... }
 */

(function () {
  const SUPABASE_URL      = 'https://vjcucliqjjljhgbqshmi.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3VjbGlxampsamhnYnFzaG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTU3MTIsImV4cCI6MjA5NDA3MTcxMn0.qq7tRmLpRjTv0y4dZxCjcEQ48rTiY5ZV1xunr32kh10';

  // Wait for supabase-js to load
  function getDB() {
    if (window.supabase) return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    throw new Error('Supabase JS not loaded. Add the CDN script before Auth.js.');
  }

  /* ── CSS ─────────────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    .dj-user-widget {
      position: fixed;
      top: 56px; /* below NavBar */
      right: 16px;
      z-index: 2147483640;
      font-family: 'Rajdhani', 'Arial Black', sans-serif;
    }

    .dj-user-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 6px;
      background: rgba(7,8,11,0.92);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 3px;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;
      backdrop-filter: blur(12px);
      user-select: none;
    }

    .dj-user-pill:hover {
      border-color: rgba(0,229,192,0.35);
      box-shadow: 0 4px 20px rgba(0,229,192,0.1);
    }

    .dj-avatar {
      width: 24px;
      height: 24px;
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }

    .dj-avatar.role-admin  { background: rgba(212,148,58,0.35); border: 1px solid rgba(212,148,58,0.5); }
    .dj-avatar.role-user   { background: rgba(0,229,192,0.2);   border: 1px solid rgba(0,229,192,0.35); }
    .dj-avatar.role-banned { background: rgba(224,90,90,0.25);  border: 1px solid rgba(224,90,90,0.4); }

    .dj-user-name {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: rgba(228,224,216,0.85);
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dj-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      background: rgba(10,11,16,0.97);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 3px;
      min-width: 180px;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(0,0,0,0.7);
      display: none;
      animation: djDropDown 0.15s ease;
    }

    @keyframes djDropDown {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .dj-dropdown.open { display: block; }

    .dj-dropdown-header {
      padding: 12px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }

    .dj-dropdown-name {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #fff;
    }

    .dj-dropdown-email {
      font-size: 10px;
      color: rgba(138,134,148,0.8);
      margin-top: 2px;
      font-family: 'DM Sans', sans-serif;
      font-weight: 400;
      letter-spacing: 0;
    }

    .dj-dropdown-role {
      display: inline-block;
      margin-top: 6px;
      padding: 2px 8px;
      border-radius: 2px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .dj-dropdown-role.admin  { background: rgba(212,148,58,0.15); color: #f0b866; border: 1px solid rgba(212,148,58,0.3); }
    .dj-dropdown-role.user   { background: rgba(0,229,192,0.08);  color: #00e5c0; border: 1px solid rgba(0,229,192,0.2); }
    .dj-dropdown-role.banned { background: rgba(224,90,90,0.12);  color: #f07070; border: 1px solid rgba(224,90,90,0.3); }

    .dj-dropdown-item {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: rgba(138,134,148,0.9);
      cursor: pointer;
      transition: all 0.15s;
    }

    .dj-dropdown-item:hover { background: rgba(255,255,255,0.04); color: #fff; }
    .dj-dropdown-item.danger:hover { color: #e05a5a; }
    .dj-dropdown-item svg { width: 13px; height: 13px; flex-shrink: 0; }

    .dj-dropdown-sep { height: 1px; background: rgba(255,255,255,0.07); }
  `;
  document.head.appendChild(style);

  /* ── WIDGET HTML ─────────────────────────────────────────────── */
  function buildWidget(profile, user) {
    const name  = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Keeper';
    const email = user.email || '';
    const role  = profile?.role || 'user';
    const init  = name[0]?.toUpperCase() || 'K';

    const widget = document.createElement('div');
    widget.className = 'dj-user-widget';
    widget.id = 'dj-user-widget';
    widget.innerHTML = `
      <div class="dj-user-pill" id="dj-pill">
        <div class="dj-avatar role-${role}">${init}</div>
        <div class="dj-user-name">${name}</div>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(90,88,104,0.8)" stroke-width="2.5" style="flex-shrink:0">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="dj-dropdown" id="dj-dropdown">
        <div class="dj-dropdown-header">
          <div class="dj-dropdown-name">${name}</div>
          <div class="dj-dropdown-email">${email}</div>
          <span class="dj-dropdown-role ${role}">${role.toUpperCase()}</span>
        </div>
        ${role === 'admin' ? `
        <div class="dj-dropdown-item" onclick="window.location.href='admin.html'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Admin Panel
        </div>
        ` : ''}
        <div class="dj-dropdown-sep"></div>
        <div class="dj-dropdown-item danger" onclick="window.DJAuth.signOut()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </div>
      </div>
    `;

    document.body.appendChild(widget);

    // Toggle dropdown
    const pill     = document.getElementById('dj-pill');
    const dropdown = document.getElementById('dj-dropdown');

    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    document.addEventListener('click', () => dropdown.classList.remove('open'));
    dropdown.addEventListener('click', e => e.stopPropagation());
  }

  /* ── SHOW SIGN IN BUTTON (when not logged in) ────────────────── */
  function buildSignInButton() {
    const widget = document.createElement('div');
    widget.className = 'dj-user-widget';
    widget.id = 'dj-user-widget';
    widget.innerHTML = `
      <div class="dj-user-pill" onclick="window.location.href='auth.html'" style="gap:6px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(0,229,192,0.7)" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        <div class="dj-user-name" style="color:rgba(0,229,192,0.7)">Sign In</div>
      </div>
    `;
    document.body.appendChild(widget);
  }

  /* ── MAIN INIT ───────────────────────────────────────────────── */
  let resolveReady;
  const readyPromise = new Promise(r => { resolveReady = r; });

  const DJAuth = {
    user:    null,
    profile: null,
    db:      null,
    ready:   readyPromise,

    async signOut() {
      await DJAuth.db.auth.signOut();
      window.location.href = 'auth.html';
    },

    async requireAuth() {
      await readyPromise;
      if (!DJAuth.user) {
        sessionStorage.setItem('auth_redirect', window.location.pathname + window.location.search);
        window.location.href = 'auth.html';
        return false;
      }
      return true;
    },

    async requireAdmin() {
      await readyPromise;
      const role = DJAuth.profile?.role || DJAuth.user?.user_metadata?.role || 'user';
      if (!DJAuth.user || role !== 'admin') {
        window.location.href = DJAuth.user ? 'index.html' : 'auth.html';
        return false;
      }
      return true;
    },
  };

  window.DJAuth = DJAuth;

  // Boot after DOM is ready
  async function init() {
    try {
      const db = getDB();
      DJAuth.db = db;

      const { data: { session } } = await db.auth.getSession();

      if (session?.user) {
        DJAuth.user = session.user;
        const { data: profile } = await db.from('profiles').select('*').eq('id', session.user.id).single();
        DJAuth.profile = profile;
        buildWidget(profile, session.user);
      } else {
        buildSignInButton();
      }

      // Listen for auth state changes
      db.auth.onAuthStateChange(async (event, sess) => {
        if (event === 'SIGNED_IN' && sess?.user) {
          DJAuth.user = sess.user;
          const { data: prof } = await db.from('profiles').select('*').eq('id', sess.user.id).single();
          DJAuth.profile = prof;
          const existing = document.getElementById('dj-user-widget');
          if (existing) existing.remove();
          buildWidget(prof, sess.user);
        }
        if (event === 'SIGNED_OUT') {
          DJAuth.user = null;
          DJAuth.profile = null;
          const existing = document.getElementById('dj-user-widget');
          if (existing) existing.remove();
          buildSignInButton();
        }
      });

    } catch (err) {
      console.warn('DJAuth init error:', err);
    } finally {
      resolveReady();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
