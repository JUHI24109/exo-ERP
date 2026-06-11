<?php
echo "<h2>EXO-ERP Node.js Server Starter</h2>";
echo "<pre>";

echo "<b>1. Running npm install...</b>\n";
exec("npm install 2>&1", $out_npm);
echo implode("\n", $out_npm) . "\n\n";

echo "<b>2. Killing any existing Node.js processes...</b>\n";
exec("pkill node 2>&1", $out_kill);
sleep(2);

echo "<b>3. Starting Node.js Backend on Port 5000...</b>\n";
// nohup ensures it keeps running after the PHP script finishes
exec("nohup node backend/index.js > backend_log.txt 2>&1 &", $out_node);
echo implode("\n", $out_node) . "\n";
sleep(3); // wait a few seconds to let it start

echo "<b>4. Checking if Node is running:</b>\n";
$out_ps = [];
exec("ps aux | grep 'node backend/index.js' | grep -v grep 2>&1", $out_ps);
if (count($out_ps) > 0) {
    echo "<span style='color:green'>SUCCESS! Node.js is running.</span>\n";
    echo implode("\n", $out_ps) . "\n";
} else {
    echo "<span style='color:red'>FAILED! Node.js is not running. Check backend_log.txt</span>\n";
}

echo "<b>5. Backend Logs (first 20 lines):</b>\n";
$out_logs = [];
exec("head -n 20 backend_log.txt 2>&1", $out_logs);
echo implode("\n", $out_logs) . "\n";

echo "</pre>";
?>
