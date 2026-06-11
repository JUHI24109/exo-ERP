<?php
// PHP Reverse Proxy for API requests
error_reporting(0);
ini_set('display_errors', 0);

$backendUrl = "http://127.0.0.1:5000";

$requestUri = $_SERVER['REQUEST_URI']; 

if (strpos($requestUri, '/api/') !== 0) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid API route"]);
    exit;
}

$targetUrl = $backendUrl . $requestUri;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

$input = file_get_contents('php://input');
if ($input) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host') {
        $headers[] = "$name: $value";
    }
}
if (isset($_SERVER['CONTENT_TYPE'])) {
    $headers[] = "Content-Type: " . $_SERVER['CONTENT_TYPE'];
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    http_response_code(502);
    echo json_encode(["error" => "Backend is down or unreachable.", "details" => curl_error($ch)]);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

http_response_code($httpCode);

$headersArr = explode("\r\n", $responseHeaders);
foreach ($headersArr as $header) {
    if (trim($header) && !preg_match('/^Transfer-Encoding:/i', $header)) {
        header($header);
    }
}

echo $responseBody;
?>
