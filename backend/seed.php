<?php
require_once 'db.php';

// 1. Opret Roller (Matcher initialRoles i initialData.ts)
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

// 2. Opret Brugere (Matcher initialUsers i initialData.ts 100%)
$users = [
    [
        '1', 
        'Super Admin', 
        'superadmin@test.dk', 
        password_hash('superadmin', PASSWORD_DEFAULT),
        'superadmin', 
        150,
        'https://picsum.photos/seed/1/200',
        '11223344',
        1,
        json_encode(['new_task' => true, 'shift_trade_completed' => true, 'newsletter' => true])
    ],
    [
        '2', 
        'Almindelig Admin', 
        'admin@test.dk', 
        password_hash('admin', PASSWORD_DEFAULT),
        'admin', 
        75,
        'https://picsum.photos/seed/2/200',
        '22334455',
        0,
        json_encode(['new_task' => true, 'shift_trade_completed' => true, 'newsletter' => true])
    ],
    [
        '3', 
        'Bettina Bruger', 
        'bruger@test.dk', 
        password_hash('bruger', PASSWORD_DEFAULT),
        'bruger', 
        120,
        'https://picsum.photos/seed/3/200',
        '33445566',
        1,
        json_encode(['new_task' => true, 'shift_trade_completed' => true, 'newsletter' => false])
    ],
    [
        '4', 
        'Brian Biceps', 
        'brian@test.dk', 
        password_hash('brian', PASSWORD_DEFAULT),
        'bruger', 
        210,
        'https://picsum.photos/seed/4/200',
        '44556677',
        0,
        json_encode(['new_task' => true, 'shift_trade_completed' => true, 'newsletter' => true])
    ]
];

// Vi indsætter nu alle felter: image, phone, phone_is_public og notification_preferences
$sql = "INSERT IGNORE INTO users (id, name, email, password_hash, role_id, points, image, phone, phone_is_public, notification_preferences) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = $pdo->prepare($sql);

foreach ($users as $u) {
    $stmt->execute($u);
}

echo "Brugere oprettet. Database data matcher nu frontendens initialData.ts.<br>";
?>