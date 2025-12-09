<?php
require_once 'backend/db.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS `admin_notifications` (
      `id` varchar(50) NOT NULL,
      `type` varchar(50) NOT NULL,
      `message` text NOT NULL,
      `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
      `read_status` tinyint(1) DEFAULT 0,
      `created_at` datetime DEFAULT current_timestamp(),
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql);
    echo "Database updated successfully.";
} catch (PDOException $e) {
    echo "Error updating database: " . $e->getMessage();
}
?>