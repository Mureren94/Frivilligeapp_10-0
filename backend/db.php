<?php
$host = 'localhost';
$db   = 'u341385255_yR54aF5'; // Ret til dit database navn
$user = 'u341385255_P9Hg5Fuq';      // Ret til din database bruger
$pass = 'D4&2FGkiWc¤hyrV3';       // Ret til dit database password
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>