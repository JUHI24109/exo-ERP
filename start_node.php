<?php
echo "<h2>EXO-ERP Node.js Server Starter (Background Mode)</h2>";
echo "<pre>";

$dir = __DIR__;
$script = <<<EOT
#!/bin/bash
cd "{$dir}"
echo "Starting installation at \$(date)" > "{$dir}/backend_log.txt"
npm install --no-audit --no-fund --legacy-peer-deps >> "{$dir}/backend_log.txt" 2>&1
echo "Installation finished at \$(date). Starting Node.js..." >> "{$dir}/backend_log.txt"
pkill node
nohup node "{$dir}/backend/index.js" >> "{$dir}/backend_log.txt" 2>&1 &
echo "Node.js started at \$(date)" >> "{$dir}/backend_log.txt"
EOT;

$script = str_replace("\r", "", $script);
file_put_contents($dir . '/startup.sh', $script);

// Use exec as we know it's allowed. Proper redirection prevents blocking.
exec("bash " . escapeshellarg($dir . '/startup.sh') . " > /dev/null 2>&1 &");

echo "<span style='color:green; font-size:18px;'><b>✅ Command sent to server!</b></span>\n\n";
echo "The server is now installing packages and starting Node.js in the background.\n";
echo "<b>You do NOT need to wait on this page!</b>\n\n";
echo "<b>Next Steps:</b>\n";
echo "1. Wait exactly <b>2 minutes</b>.\n";
echo "2. Go to your login page and try logging in.\n";
echo "3. If it still says Connection Error, wait 1 more minute and try again.\n";

echo "\n<a href='frontend/index.html' style='padding:10px; background:#3b82f6; color:white; text-decoration:none; border-radius:5px;'>Go to Login Page</a>";

echo "</pre>";
?>
