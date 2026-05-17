       window.addEventListener('load', async () => {
            // 1. Initialize Supabase
            const SUPABASE_URL = 'https://vjcucliqjjljhgbqshmi.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY3VjbGlxampsamhnYnFzaG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTU3MTIsImV4cCI6MjA5NDA3MTcxMn0.qq7tRmLpRjTv0y4dZxCjcEQ48rTiY5ZV1xunr32kh10';
            const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // 2. Create the widget container
            const container = document.createElement('div');
            container.className = 'auth-widget-container';

            // 3. Check if a user is currently logged in
            const { data: { session } } = await db.auth.getSession();

            if (!session) {
                // 🔴 NOT LOGGED IN: Show standard "LOG IN" button
                const loginBtn = document.createElement('a');
                loginBtn.href = 'auth.html';
                loginBtn.className = 'auth-btn';
                loginBtn.textContent = 'LOG IN';
                container.appendChild(loginBtn);
            } else {
                // 🟢 LOGGED IN: Fetch profile and show Dropdown
                const user = session.user;
                
                // Try to get their display name and role from the profiles table
                const { data: profile } = await db.from('profiles').select('role,display_name,username').eq('id', user.id).single();
                
                // Fallback logic for their name
                const displayName = profile?.display_name || profile?.username || user.email.split('@')[0];
                const role = profile?.role || user.user_metadata?.role || 'user';

                // Map the Custom Titles
                let displayRoleTitle = 'Operator';
                if (role === 'super_admin') {
                    displayRoleTitle = 'Endministrator';
                } else if (role === 'admin') {
                    displayRoleTitle = 'Supervisor';
                }

                // Create the Dropdown Toggle Button
                const dropBtn = document.createElement('button');
                dropBtn.className = 'auth-btn';
                dropBtn.innerHTML = `<span>${displayName}</span> <span style="font-size:10px; margin-left:4px;">▼</span>`;
                
                const menu = document.createElement('div');
                menu.className = 'user-dropdown-menu';

                // Show Admin link to BOTH admin roles
                if (role === 'admin' || role === 'super_admin') {
                    const adminLink = document.createElement('a');
                    adminLink.href = 'admin.html';
                    adminLink.className = 'user-dropdown-item';
                    adminLink.textContent = `${displayRoleTitle} Console`; // Uses the customized name!
                    menu.appendChild(adminLink);
                }

                // Add the Sign Out option
                const signOutLink = document.createElement('a');
                signOutLink.className = 'user-dropdown-item danger';
                signOutLink.textContent = 'Sign Out';
                signOutLink.onclick = async () => {
                    await db.auth.signOut();
                    window.location.reload(); // Refresh the page to show "LOG IN" again
                };
                menu.appendChild(signOutLink);

                // Make the dropdown open/close when clicking the button
                dropBtn.onclick = (e) => {
                    e.stopPropagation();
                    menu.classList.toggle('show');
                };

                // Close the dropdown if clicking anywhere else on the screen
                window.addEventListener('click', () => {
                    menu.classList.remove('show');
                });

                // Attach elements to the container
                container.appendChild(dropBtn);
                container.appendChild(menu);
            }

            // 4. Inject the final widget into the top layer of the website
            document.body.appendChild(container);
        });