<?php
// index.php

// CORS Headers
header("Access-Control-Allow-Origin: https://api.voreskerne.com");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db.php';
require_once 'utils.php';

$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);

// Fjern "/app" fra stien hvis nødvendigt
if (strpos($path, '/app') === 0) {
    $path = substr($path, 4); 
}

// --- AUTH ---
if ($path === '/login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getJsonInput();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$input['email']]);
    $user = $stmt->fetch();

    if ($user && password_verify($input['password'], $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role_id'] = $user['role_id'];
        unset($user['password_hash']);
        jsonResponse(['success' => true, 'user' => $user]);
    } else {
        http_response_code(401);
        jsonResponse(['error' => 'Ugyldigt login']);
    }
}

if ($path === '/logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    session_destroy();
    jsonResponse(['success' => true]);
}

// --- INIT DATA ---
if ($path === '/init' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    requireAuth();
    $userId = $_SESSION['user_id'];
    
    // Hent bruger
    $stmt = $pdo->prepare("SELECT id, name, email, role_id as role, points, image, phone, phone_is_public, notification_preferences FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $currentUser = $stmt->fetch();
    unset($currentUser['password_hash']);
    $currentUser['notification_preferences'] = json_decode($currentUser['notification_preferences']);

    // Hent lister
    $users = $pdo->query("SELECT id, name, email, role_id as role, points, image, phone, phone_is_public, notification_preferences FROM users")->fetchAll();
    foreach($users as &$u) $u['notification_preferences'] = json_decode($u['notification_preferences']);
    
    $roles = $pdo->query("SELECT * FROM roles")->fetchAll();
    foreach($roles as &$r) $r['permissions'] = json_decode($r['permissions']);

    $tasks = $pdo->query("SELECT * FROM tasks")->fetchAll();
    
    // Kategorier og Vagtroller
    $categories = $pdo->query("SELECT name FROM categories")->fetchAll(PDO::FETCH_COLUMN);
    $shiftRoleTypes = $pdo->query("SELECT name FROM shift_role_types")->fetchAll(PDO::FETCH_COLUMN); // NY!
    
    // Indstillinger
    $settings = $pdo->query("SELECT * FROM settings WHERE id = 1")->fetch();
    if ($settings) {
        $settingsFrontend = [
            'siteName' => $settings['site_name'],
            'siteIcon' => $settings['site_icon'],
            'siteNameColor' => $settings['site_name_color'],
            'defaultTaskImage' => $settings['default_task_image'],
            'pointGoal' => $settings['point_goal'],
            'enablePoints' => (bool)$settings['enable_points'],
            'minTaskPoints' => $settings['min_task_points'],
            'maxTaskPoints' => $settings['max_task_points'],
            'menuVisibility' => json_decode($settings['menu_visibility']),
            'smtp' => json_decode($settings['smtp_config']),
            'notification_role_defaults' => json_decode($settings['notification_role_defaults']),
            'email_templates' => json_decode($settings['email_templates'])
        ];
    } else {
        $settingsFrontend = [];
    }

    $shifts = $pdo->query("SELECT * FROM shifts")->fetchAll();
    $shiftRoles = $pdo->query("SELECT id, shift_id as shiftId, user_id as userId, role_name as roleName FROM shift_roles")->fetchAll();
    $shiftTrades = $pdo->query("SELECT id, shift_role_id as shiftRoleId, offering_user_id as offeringUserId, accepting_user_id as acceptingUserId, status, created_at as createdAt FROM shift_trades")->fetchAll();
    $signups = $pdo->query("SELECT task_id FROM task_signups WHERE user_id = '$userId'")->fetchAll(PDO::FETCH_COLUMN);
    
    $gallery = $pdo->query("SELECT * FROM gallery_images")->fetchAll();
    foreach($gallery as &$g) {
        $g['tags'] = json_decode($g['tags']);
        $g['data'] = $g['path']; 
    }

    jsonResponse([
        'currentUser' => $currentUser,
        'users' => $users,
        'roles' => $roles,
        'tasks' => $tasks,
        'categories' => $categories,
        'shiftRoleTypes' => $shiftRoleTypes, // Sender den nye liste til frontend
        'settings' => $settingsFrontend,
        'shifts' => $shifts,
        'shiftRoles' => $shiftRoles,
        'shiftTrades' => $shiftTrades,
        'signedUpTaskIds' => $signups,
        'galleryImages' => $gallery
    ]);
}

// --- SHIFT ROLE TYPES (NYE ENDPOINTS) ---
if ($path === '/shift_role_types' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth();
    $data = getJsonInput();
    if (!empty($data['name'])) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO shift_role_types (name) VALUES (?)");
        $stmt->execute([$data['name']]);
        jsonResponse(['success' => true]);
    }
}

if ($path === '/shift_role_types' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireAuth();
    $data = getJsonInput();
    if (!empty($data['name'])) {
        $stmt = $pdo->prepare("DELETE FROM shift_role_types WHERE name = ?");
        $stmt->execute([$data['name']]);
        jsonResponse(['success' => true]);
    }
}

// --- TASKS ---
if ($path === '/tasks' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth();
    $data = getJsonInput();
    $imagePath = isset($data['image']) ? saveBase64Image($data['image']) : null;
    $sql = "INSERT INTO tasks (id, title, description, task_date, category, points, volunteers_needed, image, is_template, created_by, estimated_time, repeat_interval, repeat_frequency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $pdo->prepare($sql)->execute([$data['id'], $data['title'], $data['description'], $data['task_date'], $data['category'], $data['points'], $data['volunteers_needed'], $imagePath, $data['is_template'] ? 1 : 0, $_SESSION['user_id'], $data['estimated_time'], $data['repeat_interval'] ?? null, $data['repeat_frequency'] ?? null]);
    $data['image'] = $imagePath;
    jsonResponse($data);
}

if ($path === '/tasks/signup' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth();
    $data = getJsonInput();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("SELECT volunteers_needed FROM tasks WHERE id = ?");
        $stmt->execute([$data['taskId']]);
        $task = $stmt->fetch();
        if ($task['volunteers_needed'] > 0) {
            $pdo->prepare("UPDATE tasks SET volunteers_needed = volunteers_needed - 1 WHERE id = ?")->execute([$data['taskId']]);
            $pdo->prepare("INSERT INTO task_signups (task_id, user_id) VALUES (?, ?)")->execute([$data['taskId'], $_SESSION['user_id']]);
            $pdo->commit();
            jsonResponse(['success' => true]);
        } else {
            $pdo->rollBack();
            http_response_code(400); jsonResponse(['error' => 'Ingen ledige pladser']);
        }
    } catch (Exception $e) { $pdo->rollBack(); http_response_code(500); jsonResponse(['error' => $e->getMessage()]); }
}

if ($path === '/tasks/unregister' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth();
    $data = getJsonInput();
    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE tasks SET volunteers_needed = volunteers_needed + 1 WHERE id = ?")->execute([$data['taskId']]);
        $pdo->prepare("DELETE FROM task_signups WHERE task_id = ? AND user_id = ?")->execute([$data['taskId'], $_SESSION['user_id']]);
        $pdo->commit();
        jsonResponse(['success' => true]);
    } catch (Exception $e) { $pdo->rollBack(); jsonResponse(['error' => $e->getMessage()]); }
}

// --- SHIFTS ---
if ($path === '/shifts/take' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth();
    $data = getJsonInput();
    $stmt = $pdo->prepare("UPDATE shift_roles SET user_id = ? WHERE id = ? AND user_id IS NULL");
    $stmt->execute([$_SESSION['user_id'], $data['shiftRoleId']]);
    if ($stmt->rowCount() > 0) jsonResponse(['success' => true]);
    else { http_response_code(400); jsonResponse(['error' => 'Rollen er ikke ledig']); }
}

if ($path === '/shifts/leave' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth();
    $data = getJsonInput();
    $stmt = $pdo->prepare("UPDATE shift_roles SET user_id = NULL WHERE id = ?");
    $stmt->execute([$data['shiftRoleId']]);
    jsonResponse(['success' => true]);
}

// --- PROFILE ---
if ($path === '/users/profile' && $_SERVER['REQUEST_METHOD'] === 'PUT') {
    requireAuth();
    $data = getJsonInput();
    $id = $data['id'];
    $fields = []; $params = [];
    if (isset($data['image']) && strpos($data['image'], 'data:image') !== false) {
        $fields[] = "image = ?"; $params[] = saveBase64Image($data['image']);
    }
    foreach (['name', 'email', 'phone', 'phone_is_public'] as $field) {
        if (isset($data[$field])) { $fields[] = "$field = ?"; $params[] = $data[$field]; }
    }
    if (!empty($data['password'])) {
        $fields[] = "password_hash = ?"; $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
    }
    if (!empty($fields)) {
        $params[] = $id;
        $pdo->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    }
    jsonResponse(['success' => true]);
}

// --- SETTINGS (GEM) ---
if ($path === '/settings' && $_SERVER['REQUEST_METHOD'] === 'PUT') {
    requireAuth();
    $data = getJsonInput();
    // Konverter arrays/objekter til JSON før lagring i DB
    $menuVisibility = json_encode($data['menuVisibility']);
    $smtp = json_encode($data['smtp']);
    $defaults = json_encode($data['notification_role_defaults']);
    $templates = json_encode($data['email_templates']);
    
    // Tjek om logo/billede er base64 og skal gemmes
    $siteIcon = isset($data['siteIcon']) ? saveBase64Image($data['siteIcon']) : null;
    $defaultTaskImage = isset($data['defaultTaskImage']) ? saveBase64Image($data['defaultTaskImage']) : null;

    $sql = "UPDATE settings SET 
            site_name = ?, site_icon = IF(? IS NOT NULL, ?, site_icon), site_name_color = ?, 
            default_task_image = IF(? IS NOT NULL, ?, default_task_image), point_goal = ?, 
            enable_points = ?, min_task_points = ?, max_task_points = ?, 
            menu_visibility = ?, smtp_config = ?, notification_role_defaults = ?, email_templates = ? 
            WHERE id = 1";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['siteName'], $siteIcon, $siteIcon, $data['siteNameColor'],
        $defaultTaskImage, $defaultTaskImage, $data['pointGoal'],
        $data['enablePoints'] ? 1 : 0, $data['minTaskPoints'], $data['maxTaskPoints'],
        $menuVisibility, $smtp, $defaults, $templates
    ]);
    
    jsonResponse(['success' => true]);
}

// --- CATEGORIES (GEM/SLET) ---
if ($path === '/categories' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth();
    $data = getJsonInput();
    if (!empty($data['name'])) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO categories (name) VALUES (?)");
        $stmt->execute([$data['name']]);
        jsonResponse(['success' => true]);
    }
}

if ($path === '/categories' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireAuth();
    $data = getJsonInput();
    if (!empty($data['name'])) {
        $stmt = $pdo->prepare("DELETE FROM categories WHERE name = ?");
        $stmt->execute([$data['name']]);
        jsonResponse(['success' => true]);
    }
}

// --- GALLERY (GEM) ---
if ($path === '/gallery' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth();
    $data = getJsonInput();
    
    if (isset($data['data'])) {
        $imagePath = saveBase64Image($data['data']);
        
        $sql = "INSERT INTO gallery_images (id, name, path, size, width, height, uploaded_by, tags) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['id'], $data['name'], $imagePath, 
            $data['size'], $data['width'], $data['height'], 
            $_SESSION['user_id'], json_encode($data['tags'] ?? [])
        ]);
        
        $data['data'] = $imagePath; // Returner stien
        jsonResponse($data);
    } else {
        http_response_code(400);
        jsonResponse(['error' => 'No image data']);
    }
}

if ($path === '/gallery' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireAuth();
    $data = getJsonInput();
    $id = $data['id'];
    
    // Hent stien for at slette filen
    $stmt = $pdo->prepare("SELECT path FROM gallery_images WHERE id = ?");
    $stmt->execute([$id]);
    $img = $stmt->fetch();
    
    if ($img) {
        // Slet fil fra disk (hvis den findes og er en lokal fil)
        // Stien er gemt som "app/uploads/...", men vi er allerede i "app/", så vi skal justere
        $filePath = str_replace('app/', '', $img['path']);
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        
        $pdo->prepare("DELETE FROM gallery_images WHERE id = ?")->execute([$id]);
        jsonResponse(['success' => true]);
    }
}

http_response_code(404);
echo json_encode(['error' => 'Not found']);
?>