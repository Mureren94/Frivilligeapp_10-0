<?php
// db.php - Databaseforbindelse

// Hent konfigurationen sikkert
$configPath = __DIR__ . '/config.php';

if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server Configuration Error: config.php not found.']);
    exit;
}

$config = require $configPath;

$dsn = "mysql:host={$config['db_host']};dbname={$config['db_name']};charset={$config['db_charset']}";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], $options);
} catch (\PDOException $e) {
    // VIGTIGT: I produktion bør vi logge fejlen i stedet for at vise den til brugeren for at undgå at lække info
    error_log($e->getMessage()); 
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed.']);
    exit;
}
?>