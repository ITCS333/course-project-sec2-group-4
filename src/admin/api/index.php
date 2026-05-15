<?php

ob_start();

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE, E_USER_ERROR], true)) {
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
        }
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Internal Server Error.']);
    }
});

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!function_exists('getDBConnection')) {
    function getDBConnection() {
        $host = getenv('DB_HOST') ?: '127.0.0.1';
        $db   = getenv('DB_NAME') ?: 'course';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: '';
        $charset = 'utf8mb4';

        $dsn = "mysql:host={$host};dbname={$db};charset={$charset}";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        return new PDO($dsn, $user, $pass, $options);
    }
}

$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$raw = file_get_contents('php://input');
$data = $raw ? json_decode($raw, true) : [];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$action = $_GET['action'] ?? '';
$search = trim($_GET['search'] ?? '');
$sort = trim($_GET['sort'] ?? '');
$order = trim($_GET['order'] ?? '');

function getUsers($db) {
    $query = 'SELECT id, name, email, is_admin, created_at FROM users';
    $search = trim($_GET['search'] ?? '');
    $params = [];

    if ($search !== '') {
        $query .= ' WHERE name LIKE :search OR email LIKE :search';
        $params[':search'] = '%' . $search . '%';
    }

    $allowedSort = ['name', 'email', 'is_admin'];
    $sort = trim($_GET['sort'] ?? '');
    $order = strtolower(trim($_GET['order'] ?? '')) === 'desc' ? 'DESC' : 'ASC';

    if (in_array($sort, $allowedSort, true)) {
        $query .= " ORDER BY {$sort} {$order}";
    }

    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value, PDO::PARAM_STR);
    }
    $stmt->execute();
    $rows = $stmt->fetchAll();
    sendResponse($rows, 200);
}

function getUserById($db, $id) {
    $stmt = $db->prepare('SELECT id, name, email, is_admin, created_at FROM users WHERE id = :id');
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    $row = $stmt->fetch();

    if (!$row) {
        sendResponse('User not found.', 404);
    }

    sendResponse($row, 200);
}

function createUser($db, $data) {
    $name = isset($data['name']) ? sanitizeInput($data['name']) : '';
    $email = isset($data['email']) ? sanitizeInput($data['email']) : '';
    $password = isset($data['password']) ? trim($data['password']) : '';

    if ($name === '' || $email === '' || $password === '') {
        sendResponse('Name, email, and password are required.', 400);
    }

    if (!validateEmail($email)) {
        sendResponse('A valid email address is required.', 400);
    }

    if (strlen($password) < 8) {
        sendResponse('Password must be at least 8 characters.', 400);
    }

    $stmt = $db->prepare('SELECT id FROM users WHERE email = :email');
    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
    $stmt->execute();
    if ($stmt->fetch()) {
        sendResponse('Email already exists.', 409);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $is_admin = isset($data['is_admin']) && intval($data['is_admin']) === 1 ? 1 : 0;

    $insert = $db->prepare('INSERT INTO users (name, email, password, is_admin) VALUES (:name, :email, :password, :is_admin)');
    $insert->bindValue(':name', $name, PDO::PARAM_STR);
    $insert->bindValue(':email', $email, PDO::PARAM_STR);
    $insert->bindValue(':password', $passwordHash, PDO::PARAM_STR);
    $insert->bindValue(':is_admin', $is_admin, PDO::PARAM_INT);

    if ($insert->execute()) {
        sendResponse(['id' => (int) $db->lastInsertId()], 201);
    }

    sendResponse('Unable to create user.', 500);
}

function updateUser($db, $data) {
    if (!isset($data['id']) || intval($data['id']) <= 0) {
        sendResponse('User id is required.', 400);
    }

    $id = intval($data['id']);

    $stmt = $db->prepare('SELECT id FROM users WHERE id = :id');
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    if (!$stmt->fetch()) {
        sendResponse('User not found.', 404);
    }

    $updates = [];
    $params = [':id' => $id];

    if (isset($data['name'])) {
        $updates[] = 'name = :name';
        $params[':name'] = sanitizeInput($data['name']);
    }

    if (isset($data['email'])) {
        $email = sanitizeInput($data['email']);
        if (!validateEmail($email)) {
            sendResponse('A valid email address is required.', 400);
        }

        $check = $db->prepare('SELECT id FROM users WHERE email = :email AND id <> :id');
        $check->bindValue(':email', $email, PDO::PARAM_STR);
        $check->bindValue(':id', $id, PDO::PARAM_INT);
        $check->execute();
        if ($check->fetch()) {
            sendResponse('Email already exists for another user.', 409);
        }

        $updates[] = 'email = :email';
        $params[':email'] = $email;
    }

    if (isset($data['is_admin'])) {
        $is_admin = intval($data['is_admin']) === 1 ? 1 : 0;
        $updates[] = 'is_admin = :is_admin';
        $params[':is_admin'] = $is_admin;
    }

    if (empty($updates)) {
        sendResponse('No fields to update.', 200);
    }

    $sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = :id';
    $update = $db->prepare($sql);
    foreach ($params as $key => $value) {
        $update->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }

    if ($update->execute()) {
        sendResponse('User updated successfully.', 200);
    }

    sendResponse('Unable to update user.', 500);
}

function deleteUser($db, $id) {
    if (!$id || intval($id) <= 0) {
        sendResponse('A valid user id is required.', 400);
    }

    $id = intval($id);

    $stmt = $db->prepare('SELECT id FROM users WHERE id = :id');
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    if (!$stmt->fetch()) {
        sendResponse('User not found.', 404);
    }

    $delete = $db->prepare('DELETE FROM users WHERE id = :id');
    $delete->bindValue(':id', $id, PDO::PARAM_INT);

    if ($delete->execute()) {
        sendResponse('User deleted successfully.', 200);
    }

    sendResponse('Unable to delete user.', 500);
}

function changePassword($db, $data) {
    if (empty($data['id']) || empty($data['current_password']) || empty($data['new_password'])) {
        sendResponse('id, current_password, and new_password are required.', 400);
    }

    $id = intval($data['id']);
    $currentPassword = trim($data['current_password']);
    $newPassword = trim($data['new_password']);

    if (strlen($newPassword) < 8) {
        sendResponse('Password must be at least 8 characters.', 400);
    }

    $stmt = $db->prepare('SELECT password FROM users WHERE id = :id');
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    $row = $stmt->fetch();
    if (!$row) {
        sendResponse('User not found.', 404);
    }

    if (!password_verify($currentPassword, $row['password'])) {
        sendResponse('Current password is incorrect.', 401);
    }

    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);

    $update = $db->prepare('UPDATE users SET password = :password WHERE id = :id');
    $update->bindValue(':password', $newHash, PDO::PARAM_STR);
    $update->bindValue(':id', $id, PDO::PARAM_INT);

    if ($update->execute()) {
        sendResponse('Password updated successfully.', 200);
    }

    sendResponse('Unable to update password.', 500);
}

try {

    if ($method === 'GET') {
        if ($id !== null && $id > 0) {
            getUserById($db, $id);
        }
        getUsers($db);

    } elseif ($method === 'POST') {
        if ($action === 'change_password') {
            changePassword($db, $data);
        }
        createUser($db, $data);

    } elseif ($method === 'PUT') {
        updateUser($db, $data);

    } elseif ($method === 'DELETE') {
        deleteUser($db, $id);

    } else {
        sendResponse('Method Not Allowed', 405);
    }

} catch (PDOException $e) {
    error_log($e->getMessage());
    sendResponse('Database error.', 500);

} catch (Exception $e) {
    sendResponse($e->getMessage(), 500);
}

function sendResponse($data, $statusCode = 200) {
    if (ob_get_length() > 0) {
        ob_clean();
    }

    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');

    if ($statusCode < 400) {
        echo json_encode(['success' => true, 'data' => $data]);
    } else {
        echo json_encode(['success' => false, 'message' => $data]);
    }

    exit;
}

function validateEmail($email) {
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

