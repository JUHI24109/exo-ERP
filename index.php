<?php
/**
 * EXO-ERP Entry Point for Cloudways (PHP Stack)
 * This file serves the frontend/index.html when visitors hit the root URL.
 */

$requestUri = $_SERVER['REQUEST_URI'];
$requestUri = strtok($requestUri, '?'); // Remove query string
$requestUri = rtrim($requestUri, '/');

// If requesting root, serve the login page
if ($requestUri === '' || $requestUri === '/') {
    $file = __DIR__ . '/frontend/index.html';
    if (file_exists($file)) {
        // Set proper content type
        header('Content-Type: text/html; charset=UTF-8');
        readfile($file);
        exit;
    }
}

// If requesting a file that exists in frontend/, serve it
$frontendFile = __DIR__ . '/frontend' . $requestUri;
if (file_exists($frontendFile) && !is_dir($frontendFile)) {
    // Detect content type
    $ext = pathinfo($frontendFile, PATHINFO_EXTENSION);
    $mimeTypes = [
        'html' => 'text/html',
        'css'  => 'text/css',
        'js'   => 'application/javascript',
        'json' => 'application/json',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif'  => 'image/gif',
        'svg'  => 'image/svg+xml',
        'ico'  => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2'=> 'font/woff2',
        'ttf'  => 'font/ttf',
    ];
    
    $contentType = isset($mimeTypes[$ext]) ? $mimeTypes[$ext] : 'application/octet-stream';
    header('Content-Type: ' . $contentType);
    readfile($frontendFile);
    exit;
}

// If requesting a file that exists in uploads/, serve it
$uploadsFile = __DIR__ . '/uploads' . str_replace('/uploads', '', $requestUri);
if (strpos($requestUri, '/uploads') === 0 && file_exists(__DIR__ . $requestUri)) {
    $ext = pathinfo($requestUri, PATHINFO_EXTENSION);
    readfile(__DIR__ . $requestUri);
    exit;
}

// Fallback: serve login page (SPA-style)
$fallback = __DIR__ . '/frontend/index.html';
if (file_exists($fallback)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($fallback);
    exit;
}

// If nothing works, show error
http_response_code(404);
echo 'Page not found';
