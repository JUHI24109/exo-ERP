<?php
echo "<h2>EXO-ERP Node.js Server Starter (VERSION 3 - DEFINITIVE)</h2>";
echo "<pre>";

$dir = __DIR__;
$script = <<<EOT
#!/bin/bash
cd "{$dir}"
echo "Starting installation at \$(date)" > "{$dir}/backend_log.txt"

# Auto-install portable Node.js if missing
if ! command -v node > /dev/null 2>&1; then
    if [ ! -d "node-v18" ]; then
        echo "Node not found globally. Downloading Portable Node.js..." >> "{$dir}/backend_log.txt"
        curl -sO https://nodejs.org/dist/v18.19.1/node-v18.19.1-linux-x64.tar.gz
        tar -xzf node-v18.19.1-linux-x64.tar.gz
        mv node-v18.19.1-linux-x64 node-v18
        rm node-v18.19.1-linux-x64.tar.gz
    fi
    export PATH="{$dir}/node-v18/bin:\$PATH"
fi

echo "Using Node version: \$(node -v)" >> "{$dir}/backend_log.txt"

npm install --no-audit --no-fund --legacy-peer-deps >> "{$dir}/backend_log.txt" 2>&1
echo "Installation finished. Starting Node.js..." >> "{$dir}/backend_log.txt"

pkill -f 'node backend/index.js'
nohup node "{$dir}/backend/index.js" >> "{$dir}/backend_log.txt" 2>&1 &
echo "Node.js started at \$(date)" >> "{$dir}/backend_log.txt"
EOT;

echo "<span style='color:green; font-size:18px;'><b>✅ Command sent to server!</b></span>\n\n";
echo "The server is now installing packages and starting Node.js in the background.\n";
echo "<b>You do NOT need to wait on this page!</b>\n\n";
echo "<b>Next Steps:</b>\n";
echo "1. Wait exactly <b>2 minutes</b>.\n";
echo "2. Go to your login page and try logging in.\n";
echo "3. If it still says Connection Error, wait 1 more minute and try again.\n";
echo "\n<a href='frontend/index.html' style='padding:10px; background:#3b82f6; color:white; text-decoration:none; border-radius:5px;'>Go to Login Page</a>";
echo "</pre>";

// Flush all output to the browser and close the connection
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
} else {
    // Fallback for non-FPM servers
    ob_end_flush();
    flush();
}

// Now safely run the background task without holding the user's browser
$script = str_replace("\r", "", $script);
file_put_contents($dir . '/startup.sh', $script);
exec("bash " . escapeshellarg($dir . '/startup.sh') . " > /dev/null 2>&1 &");

?>
