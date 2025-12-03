<?php
require_once 'db.php';

// 1. Opret Roller
$roles = [
    ['superadmin', 'Super Admin', json_encode(['access_admin_panel', 'manage_tasks', 'manage_users', 'manage_categories', 'manage_settings', 'manage_roles', 'manage_shifts', 'manage_gallery']), 1],
    ['admin', 'Admin', json_encode(['access_admin_panel', 'manage_tasks', 'manage_users', 'manage_categories', 'manage_shifts', 'manage_gallery']), 1],
    ['bruger', 'Bruger', json_encode([]), 1]
];

$sql = "INSERT INTO roles (id, name, permissions, is_default) VALUES (?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE permissions = VALUES(permissions)";
$stmt = $pdo->prepare($sql);

foreach ($roles as $r) $stmt->execute($r);

echo "Roller oprettet.<br>";

// 2. Opret Brugere
// Her beder vi PHP om at lave 'superadmin' om til en sikker hash automatisk
$users = [
    [
        '1', 
        'Super Admin', 
        'superadmin@test.dk', 
        password_hash('superadmin', PASSWORD_DEFAULT), // <--- Her genereres hashen
        'superadmin', 
        150
    ],
    [
        '2', 
        'Almindelig Admin', 
        'admin@test.dk', 
        password_hash('admin', PASSWORD_DEFAULT), // <--- Her genereres hashen
        'admin', 
        75
    ],
    [
        '3', 
        'Bettina Bruger', 
        'bruger@test.dk', 
        password_hash('bruger', PASSWORD_DEFAULT), // <--- Her genereres hashen
        'bruger', 
        120
    ]
];

$stmt = $pdo->prepare("INSERT IGNORE INTO users (id, name, email, password_hash, role_id, points) VALUES (?, ?, ?, ?, ?, ?)");
foreach ($users as $u) $stmt->execute($u);

echo "Brugere oprettet. Du kan nu logge ind med passwordene: 'superadmin', 'admin', eller 'bruger'.<br>";
?>