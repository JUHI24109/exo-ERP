const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\juhie\\Desktop\\exo-ERP\\frontend';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html');

// Define our navy theme colors
const theme = {
    '--bg': '#f0f2f5',
    '--surface': '#ffffff',
    '--card-bg': '#ffffff',
    '--primary': '#0a192f',      // Deep navy blue
    '--primary-light': '#e2e8f0', // light grey-blue
    '--accent': '#1d4ed8',       // Bright navy blue for buttons
    '--text': '#1e293b',         // Slate 800 for main text
    '--text-main': '#1e293b',
    '--text-light': '#64748b',   // Slate 500
    '--text-muted': '#64748b'
};

files.forEach(file => {
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');

    // 1. Remove Tasks from Nav
    // We can just find the Tasks line and delete it
    content = content.replace(/<a href="tasks\.html"[^>]*>[\s\S]*?<\/a>\s*/g, '');

    // 2. Update CSS Root Variables
    for (const [key, val] of Object.entries(theme)) {
        const regex = new RegExp(`(${key}\\s*:\\s*)(#[0-9a-fA-F]{3,6}|rgba?\\(.*?\\)|[a-zA-Z]+)(.*?;)`, 'g');
        content = content.replace(regex, `$1${val}$3`);
    }

    // 3. Update the Sidebar Background
    // Sidebars typically use either #ffffff, #111827, #f8f9fa
    // We want #0a192f (Navy) and white text
    content = content.replace(/#sidebar\s*\{([^}]*?)background:\s*(#[0-9a-fA-F]{3,6}|rgba?[^;]+)([^}]*?)\}/gi, (match, p1, p2, p3) => {
        let inside = p1 + 'background: #0a192f' + p3;
        // Make sure text is white
        if (inside.includes('color:')) {
            inside = inside.replace(/color:\s*(#[0-9a-fA-F]{3,6}|rgba?[^;]+)/i, 'color: #ffffff');
        } else {
            inside += ' color: #ffffff;';
        }
        return `#sidebar {${inside}}`;
    });

    // 4. Update `.sb-header` or `.logo` borders if any
    content = content.replace(/border-bottom:\s*1px solid\s*#[0-9a-fA-F]{3,6}/g, 'border-bottom: 1px solid rgba(255,255,255,0.1)');

    // 5. Update nav-link/nav-item colors
    content = content.replace(/\.nav-link\s*\{([^}]*?)color:\s*[^;]+([^}]*?)\}/g, '.nav-link {$1color: rgba(255,255,255,0.7)$2}');
    content = content.replace(/\.nav-item\s*\{([^}]*?)color:\s*[^;]+([^}]*?)\}/g, '.nav-item {$1color: rgba(255,255,255,0.7)$2}');

    // 6. Update hover states
    content = content.replace(/\.nav-link:hover,\s*\.nav-link\.active\s*\{([^}]*?)\}/g, '.nav-link:hover, .nav-link.active { background: rgba(255,255,255,0.1); color: #ffffff; }');
    content = content.replace(/\.nav-item:hover,\s*\.nav-item\.active\s*\{([^}]*?)\}/g, '.nav-item:hover, .nav-item.active { background: rgba(255,255,255,0.1); color: #ffffff; }');
    
    // In employees.html there's a specific nav-link.active rule
    content = content.replace(/\.nav-link\.active\s*\{\s*background:[^}]+box-shadow:[^}]+\}/g, '.nav-link.active { background: rgba(255,255,255,0.1); color: #ffffff; box-shadow: inset 3px 0 0 #3b82f6; }');

    // Make logo text white inside sidebar
    content = content.replace(/\.logo-text\s*\{([^}]*?)color:\s*[^;]+([^}]*?)\}/g, '.logo-text {$1color: #ffffff$2}');

    fs.writeFileSync(fp, content, 'utf8');
});

console.log('Navy Blue & White Theme Applied! Tasks removed.');
