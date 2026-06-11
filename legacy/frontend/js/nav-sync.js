/**
 * Nav-Sync: Ensures consistent navigation across all EXO ERP pages.
 * Handles dynamic role-based links and shared UI logic (logout, notifications).
 */

(function() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

// Role-based dashboard mapping
    function getDashboard() {
        const map = { 
            'Chairman': 'dashboard.html', 
            'CEO': 'dashboard.html', 
            'IT Admin': 'dashboard.html', 
            'HR': 'dashboard.html',
            'HR Manager': 'dashboard.html'
        };
        return map[user.role] || 'dashboard-employee.html';
    }

    // Sync all sidebar links
    function syncNav() {
        const dashboard = getDashboard();
        
        // Adjust hrefs for dashboard links to point to the correct page
        document.querySelectorAll('a').forEach(a => {
            const href = a.getAttribute('href');
            if (!href) return;
            if (href === 'dashboard.html' || href === 'dashboard-employee.html') {
                a.setAttribute('href', dashboard);
            }
        });

        // Set active link based on current pathname
        const currentPage = window.location.pathname.split('/').pop();
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === currentPage);
        });

        // Ensure Logout works everywhere
        window.logout = function(e) {
            if(e) e.preventDefault();
            console.log('NavSync: Logging out...');
            localStorage.clear();
            window.location.href = 'index.html';
        };

            // Insert History Center link into navigation if missing
        const navContainer = document.getElementById('navLinks') || document.querySelector('nav');
        if (navContainer && !navContainer.querySelector('a[href="history.html"]')) {
            const link = document.createElement('a');
            link.href = 'history.html';
            link.className = 'nav-link';
            link.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> History Center';
            navContainer.appendChild(link);
        }
        const backBtn = document.querySelector('.header a[href="dashboard.html"]');
        if (backBtn) backBtn.setAttribute('href', dashboard);
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncNav);
    } else {
        syncNav();
    }
})();
