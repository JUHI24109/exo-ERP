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
        
        // Find any link that looks like a dashboard link and point it to the correct one
        document.querySelectorAll('a').forEach(a => {
            const href = a.getAttribute('href');
            if (!href) return;

            // Fix Dashboard links
            if (href === 'dashboard.html' || href === 'dashboard-employee.html') {
                a.setAttribute('href', dashboard);
            }

            // Fix Tasks/Tickets ambiguity
            if (a.innerText.trim() === 'Tasks' && href === 'tickets.html') {
                // If it's the employee dashboard, we might want it to point to a tasks page specifically, 
                // but usually they share the tickets system.
            }
        });

        // Ensure Logout works everywhere
        window.logout = function(e) {
            if(e) e.preventDefault();
            console.log('NavSync: Logging out...');
            localStorage.clear();
            window.location.href = 'index.html';
        };

        // Fix back buttons in Profile
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
