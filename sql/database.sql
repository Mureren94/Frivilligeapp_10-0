-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Vært: 127.0.0.1:3306
-- Genereringstid: 04. 12 2025 kl. 20:14:16
-- Serverversion: 11.8.3-MariaDB-log
-- PHP-version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u341385255_yR54aF5`
--

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `categories`
--

CREATE TABLE `categories` (
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `gallery_images`
--

CREATE TABLE `gallery_images` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `path` varchar(255) NOT NULL,
  `upload_date` datetime DEFAULT current_timestamp(),
  `size` int(11) DEFAULT NULL,
  `width` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `uploaded_by` varchar(50) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `roles`
--

CREATE TABLE `roles` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`)),
  `is_default` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Data dump for tabellen `roles`
--

INSERT INTO `roles` (`id`, `name`, `permissions`, `is_default`) VALUES
('admin', 'Admin', '[\"access_admin_panel\",\"manage_tasks\",\"manage_users\",\"manage_categories\",\"manage_shifts\",\"manage_gallery\"]', 1),
('bruger', 'Bruger', '[]', 1),
('superadmin', 'Super Admin', '[\"access_admin_panel\", \"manage_tasks\", \"manage_users\", \"manage_categories\", \"manage_settings\", \"manage_roles\", \"manage_shifts\", \"manage_gallery\"]', 1);

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `site_name` varchar(255) DEFAULT NULL,
  `site_icon` varchar(255) DEFAULT NULL,
  `site_name_color` varchar(50) DEFAULT NULL,
  `default_task_image` varchar(255) DEFAULT NULL,
  `point_goal` int(11) DEFAULT NULL,
  `enable_points` tinyint(1) DEFAULT NULL,
  `min_task_points` int(11) DEFAULT NULL,
  `max_task_points` int(11) DEFAULT NULL,
  `menu_visibility` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`menu_visibility`)),
  `smtp_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`smtp_config`)),
  `notification_role_defaults` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notification_role_defaults`)),
  `email_templates` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`email_templates`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Data dump for tabellen `settings`
--

INSERT INTO `settings` (`id`, `site_name`, `site_icon`, `site_name_color`, `default_task_image`, `point_goal`, `enable_points`, `min_task_points`, `max_task_points`, `menu_visibility`, `smtp_config`, `notification_role_defaults`, `email_templates`) VALUES
(1, 'FrivilligPortalen', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{\"opgaveliste\": true, \"vagtplan\": true, \"leaderboard\": true}', '{\"host\": \"\", \"port\": \"\", \"user\": \"\", \"pass\": \"\", \"senderEmail\": \"\"}', '{\"new_task\": [], \"shift_trade_completed\": [], \"newsletter\": []}', '{\r\n        \"password_reset\": {\r\n            \"subject\": \"Nulstil din adgangskode til {{siteName}}\",\r\n            \"body\": \"Hej {{userName}},\\n\\nDer er blevet anmodet om en nulstilling af din adgangskode.\\n\\nKlik på linket nedenfor for at oprette en ny adgangskode:\\n{{resetLink}}\\n\\nHvis du ikke har anmodet om dette, kan du se bort fra denne e-mail.\\n\\nMed venlig hilsen,\\n{{siteName}}\",\r\n            \"deliveryMethod\": \"to\"\r\n        },\r\n        \"new_task\": {\r\n            \"subject\": \"Ny frivilligopgave: {{taskTitle}}\",\r\n            \"body\": \"Hej alle,\\n\\nEn ny frivilligopgave er blevet oprettet og har brug for din hjælp!\\n\\nOpgave: {{taskTitle}}\\nDato: {{taskDate}}\\nPoint: {{taskPoints}}\\n\\nBeskrivelse:\\n{{taskDescription}}\\n\\nTjek den ud på portalen!\\n\\nMed venlig hilsen,\\n{{siteName}}\",\r\n            \"deliveryMethod\": \"bcc\"\r\n        },\r\n        \"shift_trade_completed\": {\r\n            \"subject\": \"Dit vagtbytte er gennemført\",\r\n            \"body\": \"Hej {{offeringUserName}},\\n\\nDin vagt \\\"{{roleName}}\\\" for vagten \\\"{{shiftTitle}}\\\" d. {{shiftDate}} er blevet overtaget af {{acceptingUserName}}.\\n\\nDu er ikke længere ansvarlig for denne vagt.\\n\\nMed venlig hilsen,\\n{{siteName}}\",\r\n            \"deliveryMethod\": \"to\"\r\n        },\r\n        \"newsletter\": {\r\n            \"subject\": \"Nyhedsbrev fra {{siteName}}\",\r\n            \"body\": \"Hej alle frivillige,\\n\\nDette er et nyhedsbrev med de seneste opdateringer fra {{siteName}}.\\n\\n[Indsæt dit indhold her...]\\n\\nTak for jeres indsats!\\n\\nMed venlig hilsen,\\nTeamet bag {{siteName}}\",\r\n            \"deliveryMethod\": \"bcc\"\r\n        }\r\n    }');

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `shifts`
--

CREATE TABLE `shifts` (
  `id` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `start_time` varchar(10) DEFAULT NULL,
  `end_time` varchar(10) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `shift_roles`
--

CREATE TABLE `shift_roles` (
  `id` varchar(50) NOT NULL,
  `shift_id` varchar(50) NOT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `role_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `shift_role_types`
--

CREATE TABLE `shift_role_types` (
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Data dump for tabellen `shift_role_types`
--

INSERT INTO `shift_role_types` (`name`) VALUES
('1'),
('2'),
('Pilot'),
('Stævneleder');

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `shift_trades`
--

CREATE TABLE `shift_trades` (
  `id` varchar(50) NOT NULL,
  `shift_role_id` varchar(50) NOT NULL,
  `offering_user_id` varchar(50) NOT NULL,
  `accepting_user_id` varchar(50) DEFAULT NULL,
  `status` enum('PENDING','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `tasks`
--

CREATE TABLE `tasks` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `task_date` datetime DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `points` int(11) DEFAULT 0,
  `volunteers_needed` int(11) DEFAULT 1,
  `is_completed` tinyint(1) DEFAULT 0,
  `repeat_frequency` int(11) DEFAULT NULL,
  `repeat_interval` varchar(20) DEFAULT NULL,
  `is_template` tinyint(1) DEFAULT 0,
  `created_by` varchar(50) DEFAULT NULL,
  `estimated_time` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `task_signups`
--

CREATE TABLE `task_signups` (
  `task_id` varchar(50) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `signup_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `users`
--

CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` varchar(50) DEFAULT NULL,
  `points` int(11) DEFAULT 0,
  `image` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `phone_is_public` tinyint(1) DEFAULT 0,
  `notification_preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notification_preferences`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Data dump for tabellen `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role_id`, `points`, `image`, `phone`, `phone_is_public`, `notification_preferences`) VALUES
('1', 'Super Admin', 'superadmin@test.dk', '$2y$10$7ue2kqbP/BiaNgP240mYj.T/mJ4J0M4zsa/P3uM6fEBzqSISXPakG', 'superadmin', 150, 'app/uploads/692c7736973f4.jpeg', '28191134', 1, NULL),
('2', 'Almindelig Admin', 'admin@test.dk', '$2y$10$fNSADMXcPTCgCK3vKjdkMuqhpmW8/YvhCPpEgWwMAFSwBUQW3EXdO', 'admin', 75, NULL, NULL, 0, NULL),
('3', 'Bettina Bruger', 'bruger@test.dk', '$2y$10$rbN4kgrUbUBlF7WDTiHVcu91Q7SB9t1eZ/LHivh1gOAqppEkLvSZK', 'bruger', 120, NULL, NULL, 0, NULL);

--
-- Begrænsninger for dumpede tabeller
--

--
-- Indeks for tabel `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`name`);

--
-- Indeks for tabel `gallery_images`
--
ALTER TABLE `gallery_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indeks for tabel `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indeks for tabel `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indeks for tabel `shifts`
--
ALTER TABLE `shifts`
  ADD PRIMARY KEY (`id`);

--
-- Indeks for tabel `shift_roles`
--
ALTER TABLE `shift_roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shift_id` (`shift_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks for tabel `shift_role_types`
--
ALTER TABLE `shift_role_types`
  ADD PRIMARY KEY (`name`);

--
-- Indeks for tabel `shift_trades`
--
ALTER TABLE `shift_trades`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shift_role_id` (`shift_role_id`),
  ADD KEY `offering_user_id` (`offering_user_id`),
  ADD KEY `accepting_user_id` (`accepting_user_id`);

--
-- Indeks for tabel `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indeks for tabel `task_signups`
--
ALTER TABLE `task_signups`
  ADD PRIMARY KEY (`task_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks for tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- Begrænsninger for dumpede tabeller
--

--
-- Begrænsninger for tabel `gallery_images`
--
ALTER TABLE `gallery_images`
  ADD CONSTRAINT `gallery_images_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Begrænsninger for tabel `shift_roles`
--
ALTER TABLE `shift_roles`
  ADD CONSTRAINT `shift_roles_ibfk_1` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shift_roles_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Begrænsninger for tabel `shift_trades`
--
ALTER TABLE `shift_trades`
  ADD CONSTRAINT `shift_trades_ibfk_1` FOREIGN KEY (`shift_role_id`) REFERENCES `shift_roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shift_trades_ibfk_2` FOREIGN KEY (`offering_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shift_trades_ibfk_3` FOREIGN KEY (`accepting_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Begrænsninger for tabel `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Begrænsninger for tabel `task_signups`
--
ALTER TABLE `task_signups`
  ADD CONSTRAINT `task_signups_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_signups_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Begrænsninger for tabel `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
