<?php
// index.php - SINGLE ENTRY POINT

// 1. Start session
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

// 2. CORS (Tillad adgang fra frontend)
$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://api.voreskerne.com' // Din frontend URL
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// 3. Inkluder filer
require_once 'db.php';
require_once 'utils.php';

// 4. ROBUST ROUTING (FIXED)
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptName = $_SERVER['SCRIPT_NAME']; // F.eks. /app/index.php
$scriptDir = dirname($scriptName);     // F.eks. /app

// Normaliser stier ved at fjerne trailing slashes for sammenligning
$requestUri = rtrim($requestUri, '/');
$scriptDir = rtrim($scriptDir, '/');

// Find stien relativt til app-mappen
if (strpos($requestUri, $scriptDir) === 0) {
    $path = substr($requestUri, strlen($scriptDir));
} else {
    $path = $requestUri;
}

// Hvis stien er tom (f.eks. ved kald til selve mappen), sæt den til /
if (empty($path)) {
    $path = '/';
}

// Sikr at path altid starter med /
if ($path[0] !== '/') {
    $path = '/' . $path;
}

// Debugging (hvis du får problemer, kan du udkommentere denne linje midlertidigt):
// error_log("Request URI: $requestUri | Script Dir: $scriptDir | Calculated Path: $path");

// --- API ENDPOINTS ---

// --- AUTHENTICATION ---

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
    
    $stmt = $pdo->prepare("SELECT id, name, email, role_id as role, points, image, phone, phone_is_public, notification_preferences FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $currentUser = $stmt->fetch();
    if ($currentUser) {
        $currentUser['notification_preferences'] = json_decode($currentUser['notification_preferences']);
    }

    $users = $pdo->query("SELECT id, name, email, role_id as role, points, image, phone, phone_is_public, notification_preferences FROM users")->fetchAll();
    foreach($users as &$u) $u['notification_preferences'] = json_decode($u['notification_preferences']);
    
    $roles = $pdo->query("SELECT * FROM roles")->fetchAll();
    foreach($roles as &$r) $r['permissions'] = json_decode($r['permissions']);

    $tasks = $pdo->query("SELECT * FROM tasks")->fetchAll();
    $categories = $pdo->query("SELECT name FROM categories")->fetchAll(PDO::FETCH_COLUMN);
    $shiftRoleTypes = $pdo->query("SELECT name FROM shift_role_types")->fetchAll(PDO::FETCH_COLUMN);
    
    $settings = $pdo->query("SELECT * FROM settings WHERE id = 1")->fetch();
    $settingsFrontend = [];
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
        'shiftRoleTypes' => $shiftRoleTypes,
        'settings' => $settingsFrontend,
        'shifts' => $shifts,
        'shiftRoles' => $shiftRoles,
        'shiftTrades' => $shiftTrades,
        'signedUpTaskIds' => $signups,
        'galleryImages' => $gallery
    ]);
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

if ($path === '/tasks' && $_SERVER['REQUEST_METHOD'] === 'PUT') {
    requireAuth();
    $data = getJsonInput();
    $imagePath = isset($data['image']) ? saveBase64Image($data['image']) : null;
    
    $fields = "title=?, description=?, task_date=?, category=?, points=?, volunteers_needed=?, is_template=?, estimated_time=?, repeat_interval=?, repeat_frequency=?, is_completed=?";
    $params = [$data['title'], $data['description'], $data['task_date'], $data['category'], $data['points'], $data['volunteers_needed'], $data['is_template'] ? 1 : 0, $data['estimated_time'], $data['repeat_interval'] ?? null, $data['repeat_frequency'] ?? null, $data['is_completed'] ? 1 : 0];
    
    if ($imagePath) {
        $fields .= ", image=?";
        $params[] = $imagePath;
    }
    
    $params[] = $data['id'];
    
    $sql = "UPDATE tasks SET $fields WHERE id = ?";
    $pdo->prepare($sql)->execute($params);
    jsonResponse(['success' => true, 'image' => $imagePath]);
}

if ($path === '/tasks' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireAuth();
    $data = getJsonInput();
    $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
    $stmt->execute([$data['id']]);
    jsonResponse(['success' => true]);
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
        } else { $pdo->rollBack(); http_response_code(400); jsonResponse(['error' => 'Ingen ledige pladser']); }
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

if ($path === '/shifts' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth();
    $data = getJsonInput();
    $pdo->beginTransaction();
    try {
        $sql = "INSERT INTO shifts (id, date, start_time, end_time, title, description) VALUES (?, ?, ?, ?, ?, ?)";
        $pdo->prepare($sql)->execute([$data['id'], $data['date'], $data['startTime'], $data['endTime'], $data['title'], $data['description']]);
        if (!empty($data['roles'])) {
            $roleSql = "INSERT INTO shift_roles (id, shift_id, user_id, role_name) VALUES (?, ?, ?, ?)";
            $roleStmt = $pdo->prepare($roleSql);
            foreach ($data['roles'] as $role) {
                $roleStmt->execute([$role['id'], $data['id'], $role['userId'], $role['roleName']]);
            }
        }
        $pdo->commit();
        jsonResponse(['success' => true]);
    } catch (Exception $e) { $pdo->rollBack(); http_response_code(500); jsonResponse(['error' => $e->getMessage()]); }
}

if ($path === '/shifts' && $_SERVER['REQUEST_METHOD'] === 'PUT') {
    requireAuth();
    $data = getJsonInput();
    $pdo->beginTransaction();
    try {
        $sql = "UPDATE shifts SET date=?, start_time=?, end_time=?, title=?, description=? WHERE id=?";
        $pdo->prepare($sql)->execute([$data['date'], $data['startTime'], $data['endTime'], $data['title'], $data['description'], $data['id']]);
        if (!empty($data['roles'])) {
            foreach ($data['roles'] as $role) {
                $check = $pdo->prepare("SELECT id FROM shift_roles WHERE id = ?");
                $check->execute([$role['id']]);
                if ($check->rowCount() > 0) {
                    $pdo->prepare("UPDATE shift_roles SET user_id=?, role_name=? WHERE id=?")->execute([$role['userId'], $role['roleName'], $role['id']]);
                } else {
                    $pdo->prepare("INSERT INTO shift_roles (id, shift_id, user_id, role_name) VALUES (?, ?, ?, ?)")->execute([$role['id'], $data['id'], $role['userId'], $role['roleName']]);
                }
            }
        }
        $pdo->commit();
        jsonResponse(['success' => true]);
    } catch (Exception $e) { $pdo->rollBack(); http_response_code(500); jsonResponse(['error' => $e->getMessage()]); }
}

if ($path === '/shifts' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireAuth();
    $data = getJsonInput();
    $stmt = $pdo->prepare("DELETE FROM shifts WHERE id = ?");
    $stmt->execute([$data['id']]);
    jsonResponse(['success' => true]);
}

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
    $stmt = $pdo->prepare("UPDATE shift_roles SET user_id = NULL WHERE id = ? AND user_id = ?");
    $stmt->execute([$data['shiftRoleId'], $_SESSION['user_id']]);
    if ($stmt->rowCount() > 0) jsonResponse(['success' => true]);
    else { http_response_code(400); jsonResponse(['error' => 'Kunne ikke forlade vagt']); }
}

// --- USERS, ROLES, ETC ---

if ($path === '/users' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth();
    $data = getJsonInput();
    $passwordHash = !empty($data['password']) ? password_hash($data['password'], PASSWORD_DEFAULT) : password_hash(uniqid(), PASSWORD_DEFAULT);
    $check = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $check->execute([$data['id']]);
    if ($check->rowCount() > 0) {
        $sql = "UPDATE users SET name = ?, email = ?, role_id = ?, points = ? WHERE id = ?";
        $pdo->prepare($sql)->execute([$data['name'], $data['email'], $data['role'], $data['points'], $data['id']]);
    } else {
        $sql = "INSERT INTO users (id, name, email, password_hash, role_id, points, notification_preferences) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $pdo->prepare($sql)->execute([$data['id'], $data['name'], $data['email'], $passwordHash, $data['role'], $data['points'], json_encode($data['notification_preferences'] ?? new stdClass())]);
    }
    jsonResponse(['success' => true]);
}

if ($path === '/users' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireAuth();
    $data = getJsonInput();
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND role_id != 'superadmin'");
    $stmt->execute([$data['id']]);
    if ($stmt->rowCount() > 0) jsonResponse(['success' => true]);
    else { http_response_code(400); jsonResponse(['error' => 'Kan ikke slette bruger']); }
}

if ($path === '/users/profile' && $_SERVER['REQUEST_METHOD'] === 'PUT') {
    requireAuth();
    $data = getJsonInput();
    $id = $data['id'];
    if ($id !== $_SESSION['user_id'] && $_SESSION['role_id'] !== 'superadmin' && $_SESSION['role_id'] !== 'admin') {
         http_response_code(403);
         jsonResponse(['error' => 'Ikke tilladt']);
    }
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
    if (isset($data['notification_preferences'])) {
        $fields[] = "notification_preferences = ?";
        $params[] = json_encode($data['notification_preferences']);
    }
    if (!empty($fields)) {
        $params[] = $id;
        $pdo->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    }
    jsonResponse(['success' => true]);
}

if ($path === '/roles' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth();
    $data = getJsonInput();
    $permissions = json_encode($data['permissions']);
    $stmt = $pdo->prepare("INSERT INTO roles (id, name, permissions, is_default) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), permissions = VALUES(permissions)");
    $stmt->execute([$data['id'], $data['name'], $permissions, $data['is_default'] ? 1 : 0]);
    jsonResponse(['success' => true]);
}

if ($path === '/roles' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireAuth();
    $data = getJsonInput();
    $stmt = $pdo->prepare("DELETE FROM roles WHERE id = ? AND is_default = 0");
    $stmt->execute([$data['id']]);
    if ($stmt->rowCount() > 0) jsonResponse(['success' => true]);
    else { http_response_code(400); jsonResponse(['error' => 'Kan ikke slette standard rolle']); }
}

if ($path === '/settings' && $_SERVER['REQUEST_METHOD'] === 'PUT') {
    requireAuth();
    $data = getJsonInput();
    $menuVisibility = json_encode($data['menuVisibility']);
    $smtp = json_encode($data['smtp']);
    $defaults = json_encode($data['notification_role_defaults']);
    $templates = json_encode($data['email_templates']);
    $siteIcon = isset($data['siteIcon']) ? saveBase64Image($data['siteIcon']) : null;
    $defaultTaskImage = isset($data['defaultTaskImage']) ? saveBase64Image($data['defaultTaskImage']) : null;
    $sql = "UPDATE settings SET site_name = ?, site_icon = IF(? IS NOT NULL, ?, site_icon), site_name_color = ?, default_task_image = IF(? IS NOT NULL, ?, default_task_image), point_goal = ?, enable_points = ?, min_task_points = ?, max_task_points = ?, menu_visibility = ?, smtp_config = ?, notification_role_defaults = ?, email_templates = ? WHERE id = 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$data['siteName'], $siteIcon, $siteIcon, $data['siteNameColor'], $defaultTaskImage, $defaultTaskImage, $data['pointGoal'], $data['enablePoints'] ? 1 : 0, $data['minTaskPoints'], $data['maxTaskPoints'], $menuVisibility, $smtp, $defaults, $templates]);
    jsonResponse(['success' => true]);
}

if ($path === '/shift_role_types' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth(); $data = getJsonInput();
    if (!empty($data['name'])) { $pdo->prepare("INSERT IGNORE INTO shift_role_types (name) VALUES (?)")->execute([$data['name']]); jsonResponse(['success' => true]); }
}
if ($path === '/shift_role_types' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireAuth(); $data = getJsonInput();
    if (!empty($data['name'])) { $pdo->prepare("DELETE FROM shift_role_types WHERE name = ?")->execute([$data['name']]); jsonResponse(['success' => true]); }
}
if ($path === '/categories' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth(); $data = getJsonInput();
    if (!empty($data['name'])) { $pdo->prepare("INSERT IGNORE INTO categories (name) VALUES (?)")->execute([$data['name']]); jsonResponse(['success' => true]); }
}
if ($path === '/categories' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireAuth(); $data = getJsonInput();
    if (!empty($data['name'])) { $pdo->prepare("DELETE FROM categories WHERE name = ?")->execute([$data['name']]); jsonResponse(['success' => true]); }
}

if ($path === '/gallery' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    requireAuth(); $data = getJsonInput();
    if (isset($data['data'])) {
        $imagePath = saveBase64Image($data['data']);
        $pdo->prepare("INSERT INTO gallery_images (id, name, path, size, width, height, uploaded_by, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")->execute([$data['id'], $data['name'], $imagePath, $data['size'], $data['width'], $data['height'], $_SESSION['user_id'], json_encode($data['tags'] ?? [])]);
        $data['data'] = $imagePath; jsonResponse($data);
    } else { http_response_code(400); jsonResponse(['error' => 'No image data']); }
}
if ($path === '/gallery' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireAuth(); $data = getJsonInput();
    $id = $data['id'];
    $img = $pdo->prepare("SELECT path FROM gallery_images WHERE id = ?"); $img->execute([$id]); $row = $img->fetch();
    if ($row) {
        $filePath = str_replace('app/', '', $row['path']);
        if (file_exists($filePath)) unlink($filePath);
        $pdo->prepare("DELETE FROM gallery_images WHERE id = ?")->execute([$id]);
        jsonResponse(['success' => true]);
    }
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint not found', 'path' => $path]);
?>