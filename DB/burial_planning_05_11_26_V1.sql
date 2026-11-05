-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Nov 05, 2026 at 05:53 AM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `burial_planning`
--

-- --------------------------------------------------------

--
-- Table structure for table `answers`
--

DROP TABLE IF EXISTS `answers`;
CREATE TABLE IF NOT EXISTS `answers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` int DEFAULT NULL,
  `option_id` int DEFAULT NULL,
  `question_text` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_label` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `kind` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plan_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`question_id`),
  KEY `idx_answers_plan` (`plan_id`,`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=513 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `answers`
--

INSERT INTO `answers` (`id`, `question_id`, `option_id`, `question_text`, `option_label`, `created_at`, `kind`, `plan_id`) VALUES
(452, 1, 2, 'Who Are You Planning For?', 'A Loved One', '2026-10-19 14:53:06', NULL, 1),
(488, NULL, 2, 'How Would You Like The Events To Be Scheduled?', 'Traditional Arrangement', '2026-10-20 11:21:09', 'package', 1),
(497, NULL, 3, 'Will There Be A Visitation?', 'No Visitation', '2026-10-20 11:27:16', 'visitation', 1),
(498, NULL, 3, 'Would You Like Embalming Performed?', 'No', '2026-10-20 11:27:16', 'visitation', 1),
(499, NULL, 3, 'Will There Be A Rosary Or Prayer Service?', 'No Rosary or Prayer Service', '2026-10-20 11:27:27', 'choice-1', 1),
(500, NULL, 5, 'Where Will The Funeral Ceremony Take Place?', 'Church Or Place Of Worship', '2026-10-20 11:28:33', 'choice-2', 1),
(501, NULL, 5, 'What Type Of Funeral Ceremony Will Be Held?', 'Other Religious Ceremony', '2026-10-20 11:28:51', 'ceremony', 1),
(503, NULL, 8, 'Select A Casket', 'Good', '2026-10-20 11:29:15', 'choice-4', 1),
(504, NULL, NULL, 'Would You Like To Include Floral Tributes?', 'Floral Tribute Selection: Custom (Describe your custom flowers: custom flowers pink and white)', '2026-10-20 11:29:50', 'extras-1', 1),
(505, NULL, NULL, 'Would You Like To Include Floral Tributes?', 'Standard Family Spray (Color Preference: white and blue)', '2026-10-20 11:29:50', 'extras-1', 1),
(506, NULL, NULL, 'How Many Certified Copies Would You Like?', '3 copies', '2026-10-20 11:29:54', 'qty-1', 1),
(507, NULL, NULL, 'Additional Professional Services', 'Clergy Honorarium', '2026-10-20 11:30:02', 'extras-2', 1),
(508, NULL, NULL, 'Additional Professional Services', 'Escort Service', '2026-10-20 11:30:02', 'extras-2', 1),
(509, NULL, NULL, 'Additional Professional Services', 'Newspaper Obituary', '2026-10-20 11:30:02', 'extras-2', 1),
(510, NULL, NULL, 'Additional Options & Upgrades', 'None selected', '2026-10-20 11:30:22', 'extras-3', 1),
(511, NULL, 7, 'Memorial Package', 'In Memory Memorial Package', '2026-10-20 11:56:59', 'choice-3', 1),
(512, 2, 5, 'What Type of Arrangement Are You Planning?', 'Cremation', '2026-10-22 06:27:21', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `arrangements`
--

DROP TABLE IF EXISTS `arrangements`;
CREATE TABLE IF NOT EXISTS `arrangements` (
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `summary` longtext COLLATE utf8mb4_unicode_ci,
  `plan_id` int NOT NULL,
  PRIMARY KEY (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `arrangements`
--

INSERT INTO `arrangements` (`confirmed_at`, `total`, `summary`, `plan_id`) VALUES
('2026-10-20 11:31:27', 1484.00, '[{\"id\":1,\"label\":\"Arrangement Schedule\",\"details\":[\"Cremation\",\"Traditional Arrangement\"],\"lines\":[{\"label\":\"Traditional Arrangement\",\"fee\":400}],\"subtotal\":400,\"steps\":[\"q-2\",\"pkg\"]},{\"id\":2,\"label\":\"Visitation Selection\",\"details\":[\"No Visitation (embalming: No)\"],\"lines\":[{\"label\":\"Handling of remains\",\"fee\":10}],\"subtotal\":10,\"steps\":[\"vis\"]},{\"id\":3,\"label\":\"Rosary / Prayer Service\",\"details\":[],\"lines\":[{\"label\":\"No Rosary or Prayer Service\",\"fee\":0}],\"subtotal\":0,\"steps\":[\"choice-1\"]},{\"id\":4,\"label\":\"Funeral Ceremony\",\"details\":[\"Other Religious Ceremony\"],\"lines\":[{\"label\":\"Church Or Place Of Worship\",\"fee\":200},{\"label\":\"Other Religious Ceremony\",\"fee\":120}],\"subtotal\":320,\"steps\":[\"choice-2\",\"cer\"]},{\"id\":5,\"label\":\"Memorial Package\",\"details\":[],\"lines\":[{\"label\":\"In Memory Memorial Package\",\"fee\":250}],\"subtotal\":250,\"steps\":[\"choice-3\"]},{\"id\":6,\"label\":\"Casket\",\"details\":[],\"lines\":[{\"label\":\"Good\",\"fee\":50}],\"subtotal\":50,\"steps\":[\"choice-4\"]},{\"id\":7,\"label\":\"Flowers\",\"details\":[],\"lines\":[{\"label\":\"Floral Tribute Selection: Custom (Describe your custom flowers: custom flowers pink and white)\",\"fee\":100},{\"label\":\"Standard Family Spray (Color Preference: white and blue)\",\"fee\":100}],\"subtotal\":200,\"steps\":[\"extras-1\"]},{\"id\":8,\"label\":\"Death Certificates\",\"details\":[\"3 copies\"],\"lines\":[{\"label\":\"First copy\",\"fee\":21},{\"label\":\"Additional copies (2 × $4.00)\",\"fee\":8}],\"subtotal\":29,\"steps\":[\"qty-1\"]},{\"id\":9,\"label\":\"Clergy\",\"details\":[],\"lines\":[{\"label\":\"Clergy Honorarium\",\"fee\":50}],\"subtotal\":50,\"steps\":[\"extras-2\"]},{\"id\":10,\"label\":\"Escort\",\"details\":[],\"lines\":[{\"label\":\"Escort Service\",\"fee\":75}],\"subtotal\":75,\"steps\":[\"extras-2\"]},{\"id\":11,\"label\":\"Obituary\",\"details\":[],\"lines\":[{\"label\":\"Newspaper Obituary\",\"fee\":100}],\"subtotal\":100,\"steps\":[\"extras-2\"]},{\"id\":12,\"label\":\"Additional Options\",\"details\":[],\"lines\":[],\"subtotal\":0,\"steps\":[\"extras-3\"]}]', 1);

-- --------------------------------------------------------

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
CREATE TABLE IF NOT EXISTS `carts` (
  `package_id` int DEFAULT NULL,
  `package_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `line_items` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `visitation_id` int DEFAULT NULL,
  `visit_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `visit_lines` longtext COLLATE utf8mb4_unicode_ci,
  `visit_total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `embalming` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plan_id` int NOT NULL,
  PRIMARY KEY (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `carts`
--

INSERT INTO `carts` (`package_id`, `package_name`, `line_items`, `total`, `updated_at`, `visitation_id`, `visit_name`, `visit_lines`, `visit_total`, `embalming`, `plan_id`) VALUES
(2, 'Traditional Arrangement', '[{\"label\":\"Traditional Arrangement\",\"fee\":400}]', 400.00, '2026-10-20 11:22:26', 3, 'No Visitation', '[{\"label\":\"Handling of remains\",\"fee\":10}]', 10.00, 'no', 1);

-- --------------------------------------------------------

--
-- Table structure for table `cart_ceremony`
--

DROP TABLE IF EXISTS `cart_ceremony`;
CREATE TABLE IF NOT EXISTS `cart_ceremony` (
  `ceremony_id` int DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `line_items` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `addons` longtext COLLATE utf8mb4_unicode_ci,
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `sort_order` int NOT NULL DEFAULT '7',
  `plan_id` int NOT NULL,
  PRIMARY KEY (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cart_ceremony`
--

INSERT INTO `cart_ceremony` (`ceremony_id`, `name`, `line_items`, `addons`, `total`, `sort_order`, `plan_id`) VALUES
(5, 'Other Religious Ceremony', '[{\"label\":\"Other Religious Ceremony\",\"fee\":120}]', '[]', 120.00, 7, 1);

-- --------------------------------------------------------

--
-- Table structure for table `cart_choices`
--

DROP TABLE IF EXISTS `cart_choices`;
CREATE TABLE IF NOT EXISTS `cart_choices` (
  `screen_id` int NOT NULL,
  `option_id` int DEFAULT NULL,
  `screen_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `option_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `sort_order` int NOT NULL DEFAULT '0',
  `skipped` tinyint(1) NOT NULL DEFAULT '0',
  `plan_id` int NOT NULL,
  `detail` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`plan_id`,`screen_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cart_choices`
--

INSERT INTO `cart_choices` (`screen_id`, `option_id`, `screen_name`, `option_name`, `fee`, `sort_order`, `skipped`, `plan_id`, `detail`) VALUES
(1, 3, 'Rosary or Prayer Service', 'No Rosary or Prayer Service', 0.00, 5, 0, 1, ''),
(2, 5, 'Funeral Ceremony Location', 'Church Or Place Of Worship', 200.00, 6, 0, 1, ''),
(3, 7, 'Memorial Package', 'In Memory Memorial Package', 265.00, 8, 0, 1, ''),
(4, 8, 'Casket', 'Good', 50.00, 9, 0, 1, '');

-- --------------------------------------------------------

--
-- Table structure for table `cart_extras`
--

DROP TABLE IF EXISTS `cart_extras`;
CREATE TABLE IF NOT EXISTS `cart_extras` (
  `screen_id` int NOT NULL,
  `screen_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `line_items` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `selection` longtext COLLATE utf8mb4_unicode_ci,
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `sort_order` int NOT NULL DEFAULT '0',
  `skipped` tinyint(1) NOT NULL DEFAULT '0',
  `plan_id` int NOT NULL,
  PRIMARY KEY (`plan_id`,`screen_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cart_extras`
--

INSERT INTO `cart_extras` (`screen_id`, `screen_name`, `line_items`, `selection`, `total`, `sort_order`, `skipped`, `plan_id`) VALUES
(1, 'Floral Tributes', '[{\"label\":\"Floral Tribute Selection: Custom (Describe your custom flowers: custom flowers pink and white)\",\"fee\":100,\"item_id\":1},{\"label\":\"Standard Family Spray (Color Preference: white and blue)\",\"fee\":100,\"item_id\":2}]', '[{\"item_id\":1,\"choice_id\":3,\"note\":\"custom flowers pink and white\"},{\"item_id\":2,\"text\":\"white and blue\"}]', 200.00, 10, 0, 1),
(2, 'Additional Professional Services', '[{\"label\":\"Clergy Honorarium\",\"fee\":50,\"item_id\":3},{\"label\":\"Escort Service\",\"fee\":75,\"item_id\":4},{\"label\":\"Newspaper Obituary\",\"fee\":100,\"item_id\":5}]', '[{\"item_id\":3},{\"item_id\":4},{\"item_id\":5}]', 225.00, 12, 0, 1),
(3, 'Additional Options & Upgrades', '[]', '[]', 0.00, 13, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `cart_qty`
--

DROP TABLE IF EXISTS `cart_qty`;
CREATE TABLE IF NOT EXISTS `cart_qty` (
  `screen_id` int NOT NULL,
  `screen_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qty` int NOT NULL,
  `line_items` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `sort_order` int NOT NULL DEFAULT '0',
  `plan_id` int NOT NULL,
  PRIMARY KEY (`plan_id`,`screen_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cart_qty`
--

INSERT INTO `cart_qty` (`screen_id`, `screen_name`, `qty`, `line_items`, `total`, `sort_order`, `plan_id`) VALUES
(1, 'Certified Death Certificates', 3, '[{\"label\":\"First copy\",\"fee\":21},{\"label\":\"Additional copies (2 × $4.00)\",\"fee\":8}]', 29.00, 11, 1);

-- --------------------------------------------------------

--
-- Table structure for table `ceremony_addons`
--

DROP TABLE IF EXISTS `ceremony_addons`;
CREATE TABLE IF NOT EXISTS `ceremony_addons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ceremony_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'fixed',
  `fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `requires_option_id` int DEFAULT NULL,
  `recommended` tinyint(1) NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `ask_text` tinyint(1) NOT NULL DEFAULT '0',
  `min_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `note` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `ceremony_id` (`ceremony_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ceremony_addons`
--

INSERT INTO `ceremony_addons` (`id`, `ceremony_id`, `name`, `kind`, `fee`, `requires_option_id`, `recommended`, `active`, `sort_order`, `ask_text`, `min_amount`, `note`) VALUES
(1, 1, 'Clergy honorarium', 'fixed', 100.00, NULL, 1, 1, 1, 0, 0.00, ''),
(3, 1, 'Escort service', 'fixed', 200.00, 5, 1, 1, 2, 0, 0.00, ''),
(5, 1, 'Other custom clergy honorarium', 'custom', 0.00, NULL, 0, 1, 3, 0, 50.00, 'Please enter the clergy honorarium amount you would like to provide.');

-- --------------------------------------------------------

--
-- Table structure for table `ceremony_types`
--

DROP TABLE IF EXISTS `ceremony_types`;
CREATE TABLE IF NOT EXISTS `ceremony_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `examples` text COLLATE utf8mb4_unicode_ci,
  `examples_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Common Example',
  `fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `has_addons` tinyint(1) NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ceremony_types`
--

INSERT INTO `ceremony_types` (`id`, `name`, `description`, `examples`, `examples_label`, `fee`, `has_addons`, `active`, `sort_order`) VALUES
(1, 'Catholic Funeral Mass', 'One of the most common arrangements in our area.', '### Day 1\nVisitation\nRosary\n### Day 2\nFuneral Mass\nCemetery service', 'Common Example', 0.00, 1, 1, 1),
(3, 'Protestant / Christian Service', '', 'Visitation\nWorship service\nCemetery service', 'Common Example', 150.00, 0, 1, 2),
(5, 'Other Religious Ceremony', 'A service conducted according to the customs and traditions of a particular faith.', '', 'Common Example', 120.00, 0, 1, 3),
(7, 'Non-Religious Ceremony', 'A family-led tribute, celebration of life, or memorial ceremony.', '', 'Common Example', 130.00, 0, 1, 4);

-- --------------------------------------------------------

--
-- Table structure for table `choice_options`
--

DROP TABLE IF EXISTS `choice_options`;
CREATE TABLE IF NOT EXISTS `choice_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `screen_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `examples` text COLLATE utf8mb4_unicode_ci,
  `fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `examples_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Common Example',
  `note_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `note` text COLLATE utf8mb4_unicode_ci,
  `ask_detail` tinyint(1) NOT NULL DEFAULT '0',
  `detail_label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `screen_id` (`screen_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `choice_options`
--

INSERT INTO `choice_options` (`id`, `screen_id`, `name`, `description`, `examples`, `fee`, `active`, `sort_order`, `examples_label`, `note_title`, `note`, `ask_detail`, `detail_label`) VALUES
(1, 1, 'Rosary Service', 'A Catholic prayer service typically held during the visitation.', 'Family and friends gather for a Rosary during the evening visitation before the Funeral Mass the following day.', 25.00, 1, 1, 'Common Example', '', NULL, 0, ''),
(2, 1, 'Prayer Service', 'A prayer service conducted by clergy, family, or another leader.', '', 50.00, 1, 2, 'Common Example', '', NULL, 0, ''),
(3, 1, 'No Rosary or Prayer Service', 'Proceed with visitation and funeral ceremony only.', '', 0.00, 1, 3, 'Common Example', '', NULL, 0, ''),
(4, 2, 'Funeral Home Chapel', 'The ceremony will be held at the funeral home before proceeding to the cemetery.', '', 100.00, 1, 1, 'Common Example', '', '', 0, ''),
(5, 2, 'Church Or Place Of Worship', 'The ceremony will be held at a church or other religious location.', 'A Funeral Mass or worship service followed by burial.', 200.00, 1, 2, 'Common Example', '', '', 0, ''),
(6, 2, 'Other Location', 'The ceremony will be held at another meaningful location.', 'Community center\nCivic building\nPrivate venue', 300.00, 1, 3, 'Examples', '', '', 1, 'Please tell us the location'),
(7, 3, 'In Memory Memorial Package', '', 'Register book\n100 prayer cards\n50 acknowledgement cards\nCross or crucifix\nRosary (if applicable)\nTemporary grave marker', 265.00, 1, 1, 'Includes', 'Why Are These Included?', 'These are the items most families traditionally use during visitations and funeral ceremonies.', 0, ''),
(8, 4, 'Good', 'Simple and dignified selections.', '', 50.00, 1, 1, 'Common Example', '', '', 0, ''),
(9, 4, 'Better', 'Enhanced appearance and interior features.', '', 100.00, 1, 2, 'Common Example', '', '', 0, ''),
(10, 4, 'Best', 'Premium materials and craftsmanship.', '', 150.00, 1, 3, 'Common Example', '', '', 0, '');

-- --------------------------------------------------------

--
-- Table structure for table `choice_screens`
--

DROP TABLE IF EXISTS `choice_screens`;
CREATE TABLE IF NOT EXISTS `choice_screens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `intro` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `skippable` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `choice_screens`
--

INSERT INTO `choice_screens` (`id`, `name`, `title`, `sort_order`, `active`, `intro`, `skippable`) VALUES
(1, 'Rosary or Prayer Service', 'Will There Be A Rosary Or Prayer Service?', 5, 1, '', 0),
(2, 'Funeral Ceremony Location', 'Where Will The Funeral Ceremony Take Place?', 6, 1, '', 0),
(3, 'Memorial Package', 'Memorial Package', 8, 1, 'Every burial arrangement includes:', 1),
(4, 'Casket', 'Select A Casket', 9, 1, 'A casket serves as the final resting place and is often chosen based on personal preference, appearance, and budget.\nCategories:', 0);

-- --------------------------------------------------------

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
CREATE TABLE IF NOT EXISTS `config` (
  `k` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `v` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`k`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `consultations`
--

DROP TABLE IF EXISTS `consultations`;
CREATE TABLE IF NOT EXISTS `consultations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plan_id` int DEFAULT NULL,
  `plan_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `user_id` int DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `contact_method` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'phone',
  `preferred_time` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `summary` longtext COLLATE utf8mb4_unicode_ci,
  `email_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `email_error` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `phone`, `email`, `message`, `created_at`) VALUES
(2, 'Manan Modi', '09427066348', 'modi.manan14@gmail.com', 'Test Message', '2026-10-18 08:17:41');

-- --------------------------------------------------------

--
-- Table structure for table `estimates`
--

DROP TABLE IF EXISTS `estimates`;
CREATE TABLE IF NOT EXISTS `estimates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plan_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `summary` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `plan_id` (`plan_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `estimates`
--

INSERT INTO `estimates` (`id`, `plan_id`, `created_at`, `total`, `summary`) VALUES
(1, 1, '2026-10-19 13:01:28', 1600.00, '{\"groups\":[{\"id\":1,\"label\":\"Arrangement Schedule\",\"details\":[\"Cremation\",\"Traditional Arrangement\"],\"lines\":[{\"label\":\"Visitation Fee\",\"fee\":200},{\"label\":\"Funeral Service Fee\",\"fee\":100},{\"label\":\"Graveside Service Fee\",\"fee\":100}],\"subtotal\":400,\"steps\":[\"q-2\",\"pkg\"]},{\"id\":2,\"label\":\"Visitation Selection\",\"details\":[\"No Visitation (embalming: No)\"],\"lines\":[{\"label\":\"Handling of remains\",\"fee\":10}],\"subtotal\":10,\"steps\":[\"vis\"]},{\"id\":3,\"label\":\"Rosary / Prayer Service\",\"details\":[],\"lines\":[{\"label\":\"Rosary Service\",\"fee\":25}],\"subtotal\":25,\"steps\":[\"choice-1\"]},{\"id\":4,\"label\":\"Funeral Ceremony\",\"details\":[\"Catholic Funeral Mass\"],\"lines\":[{\"label\":\"Church Or Place Of Worship\",\"fee\":200},{\"label\":\"Clergy honorarium\",\"fee\":100}],\"subtotal\":300,\"steps\":[\"choice-2\",\"cer\"]},{\"id\":5,\"label\":\"Memorial Package\",\"details\":[],\"lines\":[{\"label\":\"In Memory Memorial Package\",\"fee\":250}],\"subtotal\":250,\"steps\":[\"choice-3\"]},{\"id\":6,\"label\":\"Casket\",\"details\":[],\"lines\":[{\"label\":\"Better\",\"fee\":100}],\"subtotal\":100,\"steps\":[\"choice-4\"]},{\"id\":7,\"label\":\"Flowers\",\"details\":[],\"lines\":[{\"label\":\"Floral Tribute Selection: Custom (Describe your custom flowers: custom flowers pink and white)\",\"fee\":100},{\"label\":\"Standard Family Spray (Color Preference: white and blue)\",\"fee\":100}],\"subtotal\":200,\"steps\":[\"extras-1\"]},{\"id\":8,\"label\":\"Death Certificates\",\"details\":[\"2 copies\"],\"lines\":[{\"label\":\"First copy\",\"fee\":21},{\"label\":\"Additional copy (1 × $4.00)\",\"fee\":4}],\"subtotal\":25,\"steps\":[\"qty-1\"]},{\"id\":9,\"label\":\"Clergy\",\"details\":[],\"lines\":[{\"label\":\"Clergy Honorarium\",\"fee\":50}],\"subtotal\":50,\"steps\":[\"extras-2\"]},{\"id\":10,\"label\":\"Escort\",\"details\":[],\"lines\":[{\"label\":\"Escort Service\",\"fee\":75}],\"subtotal\":75,\"steps\":[\"extras-2\"]},{\"id\":11,\"label\":\"Obituary\",\"details\":[],\"lines\":[],\"subtotal\":0,\"steps\":[\"extras-2\"]},{\"id\":12,\"label\":\"Additional Options\",\"details\":[],\"lines\":[{\"label\":\"Outer Burial Containers: Grave Liner\",\"fee\":10},{\"label\":\"Additional Memorial Items: Additional prayer cards\",\"fee\":5},{\"label\":\"Additional Memorial Items: Additional acknowledgement cards\",\"fee\":5},{\"label\":\"Additional Memorial Items: Memorial candles\",\"fee\":5},{\"label\":\"Additional Floral Arrangements: Standing sprays\",\"fee\":5},{\"label\":\"Additional Floral Arrangements: Wreaths\",\"fee\":5},{\"label\":\"Additional Transportation (base + Family Vehicle #1)\",\"fee\":130}],\"subtotal\":165,\"steps\":[\"extras-3\"]}],\"total\":1600}'),
(4, 1, '2026-10-19 15:14:56', 1755.00, '{\"groups\":[{\"id\":1,\"label\":\"Arrangement Schedule\",\"details\":[\"Cremation\",\"Traditional Arrangement\"],\"lines\":[{\"label\":\"Visitation Fee\",\"fee\":200},{\"label\":\"Funeral Service Fee\",\"fee\":100},{\"label\":\"Graveside Service Fee\",\"fee\":100}],\"subtotal\":400,\"steps\":[\"q-2\",\"pkg\"]},{\"id\":2,\"label\":\"Visitation Selection\",\"details\":[\"Closed Casket Visitation (embalming: No)\"],\"lines\":[{\"label\":\"Handling of remains\",\"fee\":10}],\"subtotal\":10,\"steps\":[\"vis\"]},{\"id\":3,\"label\":\"Rosary / Prayer Service\",\"details\":[],\"lines\":[{\"label\":\"Prayer Service\",\"fee\":50}],\"subtotal\":50,\"steps\":[\"choice-1\"]},{\"id\":4,\"label\":\"Funeral Ceremony\",\"details\":[\"Catholic Funeral Mass\"],\"lines\":[{\"label\":\"Other Location\",\"fee\":300},{\"label\":\"Other custom clergy honorarium\",\"fee\":50}],\"subtotal\":350,\"steps\":[\"choice-2\",\"cer\"]},{\"id\":5,\"label\":\"Memorial Package\",\"details\":[],\"lines\":[{\"label\":\"In Memory Memorial Package\",\"fee\":250}],\"subtotal\":250,\"steps\":[\"choice-3\"]},{\"id\":6,\"label\":\"Casket\",\"details\":[],\"lines\":[{\"label\":\"Good\",\"fee\":50}],\"subtotal\":50,\"steps\":[\"choice-4\"]},{\"id\":7,\"label\":\"Flowers\",\"details\":[],\"lines\":[{\"label\":\"Floral Tribute Selection: Custom (Describe your custom flowers: custom flowers pink and white)\",\"fee\":100},{\"label\":\"Standard Family Spray (Color Preference: white and blue)\",\"fee\":100}],\"subtotal\":200,\"steps\":[\"extras-1\"]},{\"id\":8,\"label\":\"Death Certificates\",\"details\":[\"2 copies\"],\"lines\":[{\"label\":\"First copy\",\"fee\":21},{\"label\":\"Additional copy (1 × $4.00)\",\"fee\":4}],\"subtotal\":25,\"steps\":[\"qty-1\"]},{\"id\":9,\"label\":\"Clergy\",\"details\":[],\"lines\":[{\"label\":\"Clergy Honorarium\",\"fee\":50}],\"subtotal\":50,\"steps\":[\"extras-2\"]},{\"id\":10,\"label\":\"Escort\",\"details\":[],\"lines\":[{\"label\":\"Escort Service\",\"fee\":75}],\"subtotal\":75,\"steps\":[\"extras-2\"]},{\"id\":11,\"label\":\"Obituary\",\"details\":[],\"lines\":[{\"label\":\"Newspaper Obituary\",\"fee\":100}],\"subtotal\":100,\"steps\":[\"extras-2\"]},{\"id\":12,\"label\":\"Additional Options\",\"details\":[],\"lines\":[{\"label\":\"Outer Burial Containers: Grave Liner\",\"fee\":10},{\"label\":\"Additional Memorial Items: Additional prayer cards\",\"fee\":5},{\"label\":\"Additional Memorial Items: Additional acknowledgement cards\",\"fee\":5},{\"label\":\"Additional Memorial Items: Memorial candles\",\"fee\":5},{\"label\":\"Additional Floral Arrangements: Standing sprays\",\"fee\":5},{\"label\":\"Additional Floral Arrangements: Wreaths\",\"fee\":5},{\"label\":\"Additional Transportation (base + Family Vehicle #1, Family Vehicle #2)\",\"fee\":160}],\"subtotal\":195,\"steps\":[\"extras-3\"]}],\"total\":1755}'),
(5, 1, '2026-10-20 11:32:01', 1484.00, '{\"groups\":[{\"id\":1,\"label\":\"Arrangement Schedule\",\"details\":[\"Cremation\",\"Traditional Arrangement\"],\"lines\":[{\"label\":\"Traditional Arrangement\",\"fee\":400}],\"subtotal\":400,\"steps\":[\"q-2\",\"pkg\"]},{\"id\":2,\"label\":\"Visitation Selection\",\"details\":[\"No Visitation (embalming: No)\"],\"lines\":[{\"label\":\"Handling of remains\",\"fee\":10}],\"subtotal\":10,\"steps\":[\"vis\"]},{\"id\":3,\"label\":\"Rosary / Prayer Service\",\"details\":[],\"lines\":[{\"label\":\"No Rosary or Prayer Service\",\"fee\":0}],\"subtotal\":0,\"steps\":[\"choice-1\"]},{\"id\":4,\"label\":\"Funeral Ceremony\",\"details\":[\"Other Religious Ceremony\"],\"lines\":[{\"label\":\"Church Or Place Of Worship\",\"fee\":200},{\"label\":\"Other Religious Ceremony\",\"fee\":120}],\"subtotal\":320,\"steps\":[\"choice-2\",\"cer\"]},{\"id\":5,\"label\":\"Memorial Package\",\"details\":[],\"lines\":[{\"label\":\"In Memory Memorial Package\",\"fee\":250}],\"subtotal\":250,\"steps\":[\"choice-3\"]},{\"id\":6,\"label\":\"Casket\",\"details\":[],\"lines\":[{\"label\":\"Good\",\"fee\":50}],\"subtotal\":50,\"steps\":[\"choice-4\"]},{\"id\":7,\"label\":\"Flowers\",\"details\":[],\"lines\":[{\"label\":\"Floral Tribute Selection: Custom (Describe your custom flowers: custom flowers pink and white)\",\"fee\":100},{\"label\":\"Standard Family Spray (Color Preference: white and blue)\",\"fee\":100}],\"subtotal\":200,\"steps\":[\"extras-1\"]},{\"id\":8,\"label\":\"Death Certificates\",\"details\":[\"3 copies\"],\"lines\":[{\"label\":\"First copy\",\"fee\":21},{\"label\":\"Additional copies (2 × $4.00)\",\"fee\":8}],\"subtotal\":29,\"steps\":[\"qty-1\"]},{\"id\":9,\"label\":\"Clergy\",\"details\":[],\"lines\":[{\"label\":\"Clergy Honorarium\",\"fee\":50}],\"subtotal\":50,\"steps\":[\"extras-2\"]},{\"id\":10,\"label\":\"Escort\",\"details\":[],\"lines\":[{\"label\":\"Escort Service\",\"fee\":75}],\"subtotal\":75,\"steps\":[\"extras-2\"]},{\"id\":11,\"label\":\"Obituary\",\"details\":[],\"lines\":[{\"label\":\"Newspaper Obituary\",\"fee\":100}],\"subtotal\":100,\"steps\":[\"extras-2\"]},{\"id\":12,\"label\":\"Additional Options\",\"details\":[],\"lines\":[],\"subtotal\":0,\"steps\":[\"extras-3\"]}],\"total\":1484}');

-- --------------------------------------------------------

--
-- Table structure for table `extras_choices`
--

DROP TABLE IF EXISTS `extras_choices`;
CREATE TABLE IF NOT EXISTS `extras_choices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `ask_note` tinyint(1) NOT NULL DEFAULT '0',
  `note_label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `extras_choices`
--

INSERT INTO `extras_choices` (`id`, `item_id`, `name`, `fee`, `active`, `sort_order`, `ask_note`, `note_label`) VALUES
(1, 1, 'Standard', 50.00, 1, 1, 0, ''),
(2, 1, 'Premium', 80.00, 1, 2, 0, ''),
(3, 1, 'Custom', 100.00, 1, 3, 1, 'Describe your custom flowers'),
(4, 6, 'Grave Liner', 10.00, 1, 1, 0, ''),
(5, 6, 'Standard Vault', 15.00, 1, 2, 0, ''),
(6, 6, 'Premium Vault', 20.00, 1, 3, 0, ''),
(7, 7, 'Additional prayer cards', 5.00, 1, 1, 0, ''),
(8, 7, 'Additional acknowledgement cards', 5.00, 1, 2, 0, ''),
(9, 7, 'Memorial candles', 5.00, 1, 3, 0, ''),
(10, 7, 'Bookmarks', 5.00, 1, 4, 0, ''),
(11, 7, 'Portrait displays', 5.00, 1, 5, 0, ''),
(12, 7, 'Video tribute', 5.00, 1, 6, 0, ''),
(13, 8, 'Standing sprays', 5.00, 1, 1, 0, ''),
(14, 8, 'Wreaths', 5.00, 1, 2, 0, ''),
(15, 8, 'Family pieces', 5.00, 1, 3, 0, ''),
(16, 9, 'Family Vehicle #1', 30.00, 1, 1, 0, ''),
(17, 9, 'Family Vehicle #2', 30.00, 1, 2, 0, '');

-- --------------------------------------------------------

--
-- Table structure for table `extras_items`
--

DROP TABLE IF EXISTS `extras_items`;
CREATE TABLE IF NOT EXISTS `extras_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `screen_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `examples` text COLLATE utf8mb4_unicode_ci,
  `examples_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Common Example',
  `kind` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'plain',
  `fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `sub_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `text_label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `text_placeholder` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `recommended` tinyint(1) NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `max_select` int NOT NULL DEFAULT '0',
  `info` text COLLATE utf8mb4_unicode_ci,
  `min_select` int NOT NULL DEFAULT '1',
  `bundle` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `screen_id` (`screen_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `extras_items`
--

INSERT INTO `extras_items` (`id`, `screen_id`, `name`, `description`, `examples`, `examples_label`, `kind`, `fee`, `sub_title`, `text_label`, `text_placeholder`, `recommended`, `active`, `sort_order`, `max_select`, `info`, `min_select`, `bundle`) VALUES
(1, 1, 'Floral Tribute Selection', 'Flowers provide a visual tribute and are often displayed during the visitation, funeral ceremony, or cemetery service.', '', 'Common Example', 'choices', 0.00, 'Flower Preference', '', '', 0, 1, 1, 0, NULL, 1, 0),
(2, 1, 'Standard Family Spray', 'Recommended starting option.', '### Many families select colors that reflect:\nFavorite colors\nReligious traditions\nSchool colors\nMilitary service\nPersonal interests', 'Common Example', 'text', 100.00, '', 'Color Preference', 'e.g. white and blue', 1, 1, 2, 0, NULL, 1, 0),
(3, 2, 'Clergy Honorarium', 'A contribution often given to clergy participating in the service.', '', 'Common Example', 'plain', 50.00, '', '', '', 0, 1, 1, 0, NULL, 1, 0),
(4, 2, 'Escort Service', 'An escort may help keep the funeral procession together when traveling between locations.', 'Funeral Home → Church → Cemetery', 'Common Example', 'plain', 75.00, '', '', '', 0, 1, 2, 0, NULL, 1, 0),
(5, 2, 'Newspaper Obituary', 'A published announcement containing service information and family details.', 'Name\nFamily information\nService details\nSurvivors', 'Typical obituary includes', 'plain', 100.00, '', '', '', 0, 1, 3, 0, NULL, 1, 0),
(6, 3, 'Outer Burial Containers', '', '', 'Common Example', 'choices', 0.00, 'Container type', '', '', 0, 1, 1, 0, '### What Is This?\nAn outer burial container surrounds the casket underground and helps support the ground above the grave.\n### Important\nNot required by law, although some cemeteries may require one.', 1, 0),
(7, 3, 'Additional Memorial Items', '', '', 'Common Example', 'multi', 0.00, 'Choose your memorial items', '', '', 0, 1, 2, 0, '', 1, 0),
(8, 3, 'Additional Floral Arrangements', '', '', 'Common Example', 'multi', 0.00, 'Choose your arrangements', '', '', 0, 1, 3, 0, '', 1, 0),
(9, 3, 'Additional Transportation', '', 'Hearse\nFlower vehicle', 'Included', 'multi', 100.00, 'Optional family vehicles', '', '', 0, 1, 4, 2, 'Maximum of two family vehicles.', 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `extras_screens`
--

DROP TABLE IF EXISTS `extras_screens`;
CREATE TABLE IF NOT EXISTS `extras_screens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `intro` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `sort_order` int NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `skippable` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `extras_screens`
--

INSERT INTO `extras_screens` (`id`, `name`, `title`, `intro`, `sort_order`, `active`, `skippable`) VALUES
(1, 'Floral Tributes', 'Would You Like To Include Floral Tributes?', 'Tick any items you would like to include in your package.', 10, 1, 0),
(2, 'Additional Professional Services', 'Additional Professional Services', 'Tick any services you would like to add, or skip this step.', 12, 1, 1),
(3, 'Additional Options & Upgrades', 'Additional Options & Upgrades', 'Tick any options you would like to add to your package.', 13, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `options`
--

DROP TABLE IF EXISTS `options`;
CREATE TABLE IF NOT EXISTS `options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question_id` int NOT NULL,
  `label` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `sort_order` int NOT NULL DEFAULT '0',
  `examples` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `question_id` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `options`
--

INSERT INTO `options` (`id`, `question_id`, `label`, `description`, `sort_order`, `examples`) VALUES
(1, 1, 'Myself', 'Plan arrangements according to your own wishes and preferences.', 1, NULL),
(2, 1, 'A Loved One', 'Plan arrangements for a family member or someone you care about.', 2, NULL),
(3, 1, 'Exploring Options', 'Learn about available options before making decisions.', 3, NULL),
(4, 2, 'Burial', 'The deceased will be placed in a casket and buried in a cemetery.', 1, 'Visitation\nRosary or prayer service (if desired)\nFuneral ceremony\nCemetery service'),
(5, 2, 'Cremation', 'The deceased will be cremated.', 2, 'Visitation\nMemorial service\nCelebration of life\nUrn placement');

-- --------------------------------------------------------

--
-- Table structure for table `packages`
--

DROP TABLE IF EXISTS `packages`;
CREATE TABLE IF NOT EXISTS `packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tag` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `schedule` text COLLATE utf8mb4_unicode_ci,
  `note` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `packages`
--

INSERT INTO `packages` (`id`, `name`, `tag`, `description`, `schedule`, `note`, `fee`, `active`, `sort_order`) VALUES
(1, 'One-Day Arrangement', 'Cremation package', '', '', '', 300.00, 1, 1),
(2, 'Traditional Arrangement', '', 'The visitation occurs on one day and the funeral ceremony occurs on a later day.', '### Day 1\nEvening visitation\nRosary or prayer service may be held during the visitation\n### Day 2\nAdditional visitation period before departure\nFuneral ceremony or Mass\nCemetery service', 'Many families choose this option when larger attendance is expected or when a church service is planned.', 400.00, 1, 2);

-- --------------------------------------------------------

--
-- Table structure for table `package_services`
--

DROP TABLE IF EXISTS `package_services`;
CREATE TABLE IF NOT EXISTS `package_services` (
  `package_id` int NOT NULL,
  `service_id` int NOT NULL,
  `fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`package_id`,`service_id`),
  KEY `service_id` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `package_services`
--

INSERT INTO `package_services` (`package_id`, `service_id`, `fee`) VALUES
(1, 1, 0.00),
(1, 2, 0.00),
(1, 3, 0.00),
(2, 1, 200.00),
(2, 2, 100.00),
(2, 3, 100.00);

-- --------------------------------------------------------

--
-- Table structure for table `pages`
--

DROP TABLE IF EXISTS `pages`;
CREATE TABLE IF NOT EXISTS `pages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nav_group` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `nav_order` int NOT NULL DEFAULT '0',
  `show_in_nav` tinyint(1) NOT NULL DEFAULT '1',
  `published` tinyint(1) NOT NULL DEFAULT '1',
  `hero_title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `hero_subtitle` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `sections` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `hero_image` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pages`
--

INSERT INTO `pages` (`id`, `slug`, `title`, `nav_group`, `nav_order`, `show_in_nav`, `published`, `hero_title`, `hero_subtitle`, `sections`, `updated_at`, `hero_image`) VALUES
(1, 'home', 'Home', '', 0, 0, 1, 'Serving Families With Compassion, Dignity & Respect', 'Your trusted funeral and cremation provider in Laredo, Rio Bravo, El Cenizo and surrounding Webb County communities.', '[{\"heading\":\"Your Trusted Funeral Home in Laredo, TX\",\"layout\":\"split\",\"image\":\"/images/section-flowers.jpg\",\"icon\":\"home\",\"body\":\"Our experienced staff support families through a difficult time. We offer personalized services that reflect the wishes of your loved one and of the family arranging the service, and we guide you through the many decisions required to create a lasting, personal tribute.\\n\\nYou can reach us at any hour for immediate help, visit us at your convenience, or explore our services from home. Families can also pre-plan their own services.\"},{\"heading\":\"Our Mission\",\"layout\":\"banner\",\"image\":\"/images/section-agave.jpg\",\"icon\":\"heart\",\"body\":\"To be the primary provider of funeral and cremation services that help families heal. We promise compassionate care, high integrity and excellence, with a focus on memorable remembrance, celebrations of life, and memorialization of the time you shared.\"},{\"heading\":\"Why Choose Gámez & Sons\",\"layout\":\"cards\",\"icon\":\"shield\",\"body\":\"Care you can count on, every hour of every day.\\n\\n- 24/7 service: immediate assistance whenever you need us\\n- Affordability guaranteed: across our products and services\\n- Flexible with your budget: we work with each family\\n- Obituaries online: published on our website\\n- 365 days of grief support: we are with you long after the service\\n- Personalized services: that honor your loved one\'s wishes\\n- Pre-planning services: record your final wishes in advance\\n- Paperwork handled: help with all funeral and cremation forms\"},{\"heading\":\"Our Services\",\"layout\":\"cards\",\"icon\":\"candle\",\"body\":\"Meaningful, affordable ways to honor a life.\\n\\n- {home} [Traditional Services](/traditional-services): visitation, funeral and graveside services\\n- {candle} [Cremation Services](/cremation-services): memorial options and permanent resting places\\n- {star} [Personalization](/personalization): photos, music, video and keepsakes\\n- {flag} [Veteran Services](/veteran-services): military honors and VA benefit support\\n- {calendar} [Planning Ahead](/planning-ahead): peace of mind for you and your family\\n- {phone} [Immediate Need](/immediate-need): call us now, day or night\"},{\"heading\":\"Pet Cremation\",\"layout\":\"split-reverse\",\"image\":\"/images/section-succulents.jpg\",\"icon\":\"paw\",\"body\":\"Pets are family, and losing a devoted companion is painful. Cremation can be a voluntary act of love and a way to pay final tribute to a pet.\\n\\n**Our mission:** we care for every animal as we would want our own pet cared for.\\n\\n**Our guarantee:** families receive only their own pet\'s cremated remains.\"}]', '2026-10-18 07:08:50', ''),
(2, 'immediate-need', 'Immediate Need', 'Services', 1, 1, 1, 'Immediate Funeral Assistance', 'If a death has just occurred, call us now. We are available 24 hours a day, 7 days a week.', '[{\"heading\":\"If a Death Has Just Occurred\",\"layout\":\"split\",\"icon\":\"phone\",\"image\":\"/images/contact.jpg\",\"body\":\"Please call us at **(956) 701-3459** and a member of our team will guide you through the first steps, 24 hours a day, 7 days a week.\\n\\nTo begin arrangements we will ask for some information, so it helps to have the following ready.\"},{\"heading\":\"Information We Will Ask For\",\"layout\":\"cards\",\"icon\":\"file\",\"body\":\"- {users} Person who died: Full name, date of birth, date and time of death, and Social Security number\\n- {shield} Preparation and permissions: Whether a doctor or coroner has been notified, the body released, and who gave permission to embalm or cremate\\n- {book} Physician: Name, phone, email and office address of the doctor signing the death certificate\\n- {home} Person legally responsible: Full name, relationship, address, phone numbers and best time to reach them\\n- {calendar} Prearrangements: Whether a prearrangement is already on file with us, and under what name\"},{\"heading\":\"We Are Here For You\",\"layout\":\"banner\",\"icon\":\"heart\",\"image\":\"/images/section-flowers.jpg\",\"body\":\"Call (956) 701-3459 any time, day or night. We are here for you.\"}]', '2026-10-19 13:41:38', '/images/hero-forms.jpg'),
(3, 'services-overview', 'Services Overview', 'Services', 2, 1, 1, 'Services We Provide', 'Personal, affordable options for honoring a loved one in a way that fits who they were.', '[{\"heading\":\"Ways We Can Help You Honor Your Loved One\",\"layout\":\"cards\",\"icon\":\"heart\",\"body\":\"Personal, affordable options that fit who they were.\\n\\n- {flower} [Traditional Services](/traditional-services): Burial or cremation, a funeral service is a key way to honor the person who died and begin healing\\n- {candle} [Cremation Services](/cremation-services): A full funeral service, a memorial service, or a private gathering, with permanent resting places for remains\\n- {star} [Personalization](/personalization): Tribute videos, keepsakes and live streaming for relatives who cannot attend\\n- {flag} [Veteran Services](/veteran-services): We help families obtain veteran benefits and arrange a service suited to a veteran\"},{\"heading\":\"Traditional Services\",\"layout\":\"split\",\"icon\":\"flower\",\"image\":\"/images/traditional-2.jpg\",\"body\":\"Whether the family chooses burial or cremation, a funeral service is a key way to honor the person who died and begin healing. Our service options are meaningful and affordable.\\n\\n[Learn about traditional services →](/traditional-services)\"},{\"heading\":\"Cremation Services\",\"layout\":\"split-reverse\",\"icon\":\"candle\",\"image\":\"/images/cremation.jpg\",\"body\":\"Families who choose cremation can select a full funeral service, a memorial service, or a more private gathering. Permanent resting places are available for cremated remains.\\n\\n[Learn about cremation →](/cremation-services)\"},{\"heading\":\"Personalization\",\"layout\":\"split\",\"icon\":\"star\",\"image\":\"/images/personal.jpg\",\"body\":\"Our funeral directors help design services that are distinctive and reflect your loved one. Options include tribute videos, keepsakes, and live streaming for relatives and friends who cannot attend in person.\\n\\n[See personalization ideas →](/personalization)\"},{\"heading\":\"Veteran Services\",\"layout\":\"split-reverse\",\"icon\":\"flag\",\"image\":\"/images/veteran.jpg\",\"body\":\"Serving those who served our country is a great honor. We help families obtain veteran benefits and arrange a service suited to a veteran.\\n\\n[Veteran benefits →](/veteran-services)\"}]', '2026-10-19 13:41:38', '/images/traditional.jpg'),
(4, 'traditional-services', 'Traditional Services', 'Services', 3, 1, 1, 'Traditional Funeral Services in Laredo, TX', 'A meaningful, dignified farewell that reflects your loved one\'s values, beliefs and influence on others.', '[{\"heading\":\"A Dignified Farewell\",\"layout\":\"split\",\"icon\":\"flower\",\"image\":\"/images/traditional-2.jpg\",\"body\":\"A traditional funeral reflects your loved one\'s values, beliefs and influence on others. It usually has three parts, each of which we personalize with you.\"},{\"heading\":\"The Parts of a Traditional Service\",\"layout\":\"cards\",\"icon\":\"heart\",\"body\":\"- {users} Visitation: A period for family and friends to gather and say goodbye. Add a tribute video, meaningful displays or photographs\\n- {candle} Funeral Service: In our chapel, a church or another venue, with stories, music or scripture. Life celebrants can lead when clergy are not chosen\\n- {flower} Graveside Service: Also called a committal service. It usually follows the funeral service, or can be a small, intimate gathering\"},{\"heading\":\"Contact Us Today\",\"layout\":\"banner\",\"icon\":\"phone\",\"image\":\"/images/section-agave.jpg\",\"body\":\"Let us help you plan every detail and offer guidance and comfort throughout the process.\\n\\nCall (956) 701-3459 any time, day or night. We are here for you.\"}]', '2026-10-19 13:41:38', '/images/traditional.jpg'),
(5, 'cremation-services', 'Cremation Services', 'Services', 4, 1, 1, 'Affordable Cremation in Laredo, TX', 'Several options for a public gathering and for a final resting place.', '[{\"heading\":\"Choose How You Gather\",\"layout\":\"cards\",\"icon\":\"candle\",\"body\":\"- {flower} Funeral Service Then Cremation: A final viewing, visitation and funeral service, followed by cremation instead of burial. Cost includes the service and cremation fees\\n- {candle} Memorial Service: In our chapel, a church or another venue, with stories, music or scripture to honor your loved one\\n- {users} Graveside Service: A committal service that follows the funeral, or a small gathering of the closest family and friends\"},{\"heading\":\"Permanent Memorialization\",\"layout\":\"steps\",\"icon\":\"heart\",\"body\":\"Cremated remains may be kept, placed, buried or scattered.\\n\\n- {home} Keeping an urn at home: A common choice, with a fitting urn of your choosing\\n- {pin} Columbarium niche: A place to visit for comfort and remembrance\\n- {leaf} Burying the urn: An in-ground burial that provides a final resting place\\n- {sun} Scattering: In a location that was special to your loved one\"},{\"heading\":\"Urns and Keepsakes\",\"layout\":\"split\",\"icon\":\"heart\",\"image\":\"/images/urn.jpg\",\"body\":\"From a classic metal urn to keepsake jewelry, our team will help you choose a fitting way to keep your loved one close.\"},{\"heading\":\"A Place to Remember\",\"layout\":\"split-reverse\",\"icon\":\"pin\",\"image\":\"/images/niche.jpg\",\"body\":\"A columbarium niche or a quiet place in nature gives the family somewhere to visit, now and for generations.\"}]', '2026-10-19 13:41:38', '/images/cremation.jpg'),
(6, 'personalization', 'Personalization', 'Services', 5, 1, 1, 'A Personalized Funeral Plan', 'Personalizing a service starts with memories of the person: their hobbies, interests and favorite places.', '[{\"heading\":\"Make It Truly Theirs\",\"layout\":\"split\",\"icon\":\"star\",\"image\":\"/images/personal.jpg\",\"body\":\"Personalizing a service starts with memories of the person: their hobbies, interests and favorite places. Here are some of the ways families make a service their own.\"},{\"heading\":\"Ways to Personalize\",\"layout\":\"cards\",\"icon\":\"heart\",\"body\":\"- {camera} Photos and Albums: Photo collages on easels, monitors with a slideshow, and photos printed in memorial folders, registry books or on urns\\n- {video} Videos: A video of special photos and music shares a life, and becomes a keepsake for generations\\n- {brush} Artwork: Sculptures, drawings or art displayed throughout the funeral home add meaning\\n- {music} Music: Favorite songs, songs they wrote, or family and friends who perform live\\n- {book} Poetry & Literature: Passages from favorite books or poems, read or written by loved ones\"},{\"heading\":\"Music Brings Comfort\",\"layout\":\"banner\",\"icon\":\"music\",\"image\":\"/images/music.jpg\",\"body\":\"Live or recorded music can be calming and comforting. Tell us what they loved and we will help you shape the service.\"}]', '2026-10-19 13:41:38', '/images/personal.jpg'),
(7, 'veteran-services', 'Veteran Services', 'Services', 6, 1, 1, 'Veteran Funeral Services in Laredo, TX', 'We recognize the sacrifices of those who served, and help families complete the paperwork for VA benefits.', '[{\"heading\":\"VA Burial Benefits and Memorial Items\",\"layout\":\"split\",\"icon\":\"flag\",\"image\":\"/images/veteran.jpg\",\"body\":\"VA burial benefits help service members, veterans and their families plan and pay for a burial or memorial service in a VA national cemetery. The VA also provides memorial items to honor military service. We help families complete the paperwork.\"},{\"heading\":\"Who Qualifies?\",\"layout\":\"cards\",\"icon\":\"shield\",\"body\":\"Veterans, service members, spouses and dependents may be eligible if:\\n\\n- {medal} Honorable service: The veteran did not receive a dishonorable discharge\\n- {flag} Died on duty: The service member died on active duty, active duty for training, or inactive duty for training\\n- {users} Spouse or child: The person is the spouse or minor child of a veteran\\n- {home} Dependents: In some cases, the unmarried adult dependent child of a veteran\"},{\"heading\":\"Military Funeral Honors\",\"layout\":\"banner\",\"icon\":\"medal\",\"image\":\"/images/veteran-2.jpg\",\"body\":\"Honors may include \\\"Taps,\\\" a rifle detail, a color guard, and uniformed service members who fold and present the U.S. flag. The burial flag usually goes to the next of kin or a close friend.\"},{\"heading\":\"Applying for Benefits\",\"layout\":\"steps\",\"icon\":\"file\",\"body\":\"- {wallet} Know what is covered: Death benefits can help cover burial, funeral and transportation costs\\n- {clock} Mind the deadline: A non-service-connected burial allowance claim must be filed within two years of the burial or cremation; service-connected claims have no time limit\\n- {file} Submit the claim: Apply online through the VA website, or mail a completed VA Form 21P-530\\n- {flag} Headstone: Free headstones for unmarked graves of eligible veterans use VA Form 10-1330\\n- {phone} Questions: Call the VA at 1-800-827-1000\"}]', '2026-10-19 13:41:38', '/images/veteran-2.jpg'),
(8, 'planning-ahead', 'Planning Ahead', 'Planning Ahead', 1, 1, 1, 'Funeral Planning in Laredo, TX', 'Preplanning gives you peace of mind that your final wishes will be honored.', '[{\"heading\":\"Benefits of Funeral Preplanning\",\"layout\":\"cards\",\"icon\":\"calendar\",\"body\":\"- {heart} Your wishes are known: Stating your wishes in advance helps prevent disagreements among family members\\n- {shield} Peace of mind: We guarantee we will make the arrangements you want, as you directed\\n- {wallet} Flexible funding: More ways to pay, including preneed insurance, life insurance and other options\\n- {users} Relief for your family: More than 150 decisions must be made within a day or two of a death. Make them yourself so loved ones don\'t have to guess\"},{\"heading\":\"Plan on Your Own Time\",\"layout\":\"split\",\"icon\":\"calendar\",\"image\":\"/images/planning.jpg\",\"body\":\"Preplanning only records your wishes. Most families who preplan also prefund, which relieves their family\'s financial burden.\\n\\n[Start planning online →](/plans)\"},{\"heading\":\"Common Questions\",\"layout\":\"accordion\",\"icon\":\"question\",\"body\":\"### What steps are involved?\\nWrite down your wishes, note the type of service and cemetery, then meet with a funeral director to review options and payment methods.\\n\\n### Do I have to pay in advance?\\nNo. Preplanning only records your wishes. Most families who preplan also prefund, which relieves their family\'s financial burden.\\n\\n### Can I transfer plans?\\nYes. Plans made elsewhere can be moved to us, and if you move away we will help transfer your arrangements.\"},{\"heading\":\"Start Today\",\"layout\":\"banner\",\"icon\":\"phone\",\"image\":\"/images/section-succulents.jpg\",\"body\":\"Request your free preplanning guide through our contact page, or call (956) 701-3459.\"}]', '2026-10-19 13:41:38', '/images/planning.jpg'),
(9, 'pre-planning-checklist', 'Pre-Planning Checklist', 'Planning Ahead', 2, 1, 1, 'Pre-Planning Funeral Checklist', 'Preparing your service in advance can ease stress for your family.', '[{\"heading\":\"1. Choose the Type of Service You Want\",\"layout\":\"steps\",\"icon\":\"check\",\"body\":\"- {home} Funeral home: Choose the funeral home and director\\n- {candle} Type of service: Traditional, cremation or donation\\n- {pin} Burial place: If burial, decide where you want to be buried\\n- {star} Caskets and urns: Review the options\\n- {users} Clothing: Select what you want to be dressed in\\n- {pin} Location: Funeral home, religious facility, meaningful building or graveside\\n- {flower} Flowers or donations: Flowers, or donations to a charity\\n- {users} People: Pallbearers and who will officiate or take part\\n- {music} Music: The songs you want played\\n- {book} Obituary: Write it, or note what it should include\"},{\"heading\":\"2. Choose Who Is in Charge\",\"layout\":\"cards\",\"icon\":\"shield\",\"body\":\"- {file} Your will: Make sure someone, ideally your executor, has a copy\\n- {book} Accounts and wishes: Give a trusted person a list of important accounts and your wishes for the service\\n- {shield} Power of attorney: Name someone you trust\\n- {phone} Cancellations: Arrange for someone to cancel utilities and subscriptions\"},{\"heading\":\"3. Choose to Pay in Advance\",\"layout\":\"split\",\"icon\":\"wallet\",\"image\":\"/images/checklist.jpg\",\"body\":\"Paying in advance can benefit you and your survivors financially. When possible, prepay for:\\n\\n- Cemetery services and a burial plot\\n- All funeral arrangements, including casket, urn, flowers, transportation and specialized services\"}]', '2026-10-19 13:41:38', '/images/checklist.jpg'),
(10, 'about-us', 'About Us', 'About', 1, 1, 1, 'About Gámez & Sons', 'A family-run funeral home serving Laredo and Webb County for more than 11 years.', '[{\"heading\":\"Who We Are\",\"layout\":\"split\",\"icon\":\"users\",\"image\":\"/images/about.jpg\",\"body\":\"Gámez & Sons Funeral and Cremation Services is staffed by licensed professionals and is a member of funeral service associations, following Texas Funeral Service Commission standards. We serve Laredo, Rio Bravo, El Cenizo and the greater Webb County area.\"},{\"heading\":\"What Families Can Count On\",\"layout\":\"cards\",\"icon\":\"shield\",\"body\":\"- {users} Family owned: A family-run funeral home serving Webb County for more than 11 years\\n- {shield} Licensed professionals: Texas Funeral Service Commission standards, every time\\n- {clock} Always available: 24 hours a day, 7 days a week\\n- {tag} Affordable: Meaningful services with clear, upfront pricing\"},{\"heading\":\"Our Mission\",\"layout\":\"banner\",\"icon\":\"heart\",\"image\":\"/images/section-flowers.jpg\",\"body\":\"To be the primary provider of funeral and cremation services that help families heal, with compassionate care, high integrity and excellence.\"}]', '2026-10-19 13:41:38', '/images/about.jpg'),
(11, 'our-staff', 'Our Staff', 'About', 2, 1, 1, 'Our Staff and Licensed Professionals', 'Contact any member of our team at any time.', '[{\"heading\":\"Feliciano Gamez IV, Funeral Director in Charge\",\"layout\":\"cards\",\"icon\":\"users\",\"body\":\"Contact any member of our team at any time.\\n\\n- {home} Lifelong Laredo resident: Graduated from Commonwealth Institute of Mortuary Science in 2007\\n- {clock} Over fourteen years: In the funeral industry, overseeing daily operations so every family receives the best possible service\\n- {music} Outside of work: Family, reading and playing guitar\"},{\"heading\":\"Martina G. Gamez, Family Service Counselor Manager\",\"layout\":\"cards\",\"icon\":\"users\",\"body\":\"- {book} 30+ years: Worked for LISD and UISD combined\\n- {calendar} Preneed leader: A licensed preneed agent who helps families prearrange their services, and trains and supports our family service counselors\\n- {music} Music ministry: Active member of the Catholic music ministry in the Diocese of Laredo for 36 years\"},{\"heading\":\"Here When You Need Us\",\"layout\":\"banner\",\"icon\":\"phone\",\"image\":\"/images/section-agave.jpg\",\"body\":\"Call (956) 701-3459 any time, day or night. We are here for you.\"}]', '2026-10-19 13:41:38', '/images/about.jpg'),
(12, 'the-grieving-process', 'The Grieving Process', 'Grief Support', 1, 1, 1, 'Understanding the Grieving Process', 'Everyone handles loss differently, but many people share common feelings while recovering.', '[{\"heading\":\"The Stages of Grief\",\"layout\":\"split\",\"icon\":\"heart\",\"image\":\"/images/grief-2.jpg\",\"body\":\"Reactions to grief are often described as stages. They don\'t follow a strict timeline or order; you may move between them, return to an earlier one, and cycle through them several times.\"},{\"heading\":\"Five Common Feelings\",\"layout\":\"steps\",\"icon\":\"candle\",\"body\":\"- {shield} Denial: Shock, numbness or detachment. A survival response that helps you handle basic tasks in the days after a loss\\n- {flag} Anger: A bridge out of numbness, aimed at doctors, family, the person who died, or God. Allowing yourself to feel it tends to reduce it over time\\n- {question} Guilt (Bargaining): Repeated \\\"if only\\\" and \\\"what if\\\" thoughts, wondering whether you could have changed the outcome\\n- {candle} Depression: Deep sadness and emptiness as the loss sinks in. A normal, necessary response, not a sign of mental illness\\n- {sun} Acceptance: The loss becomes part of your history rather than the center of your life, bringing peace and renewed interest in things you enjoyed\"},{\"heading\":\"How Long Will I Feel This Way?\",\"layout\":\"banner\",\"icon\":\"clock\",\"image\":\"/images/section-succulents.jpg\",\"body\":\"There is no correct amount of time. Many experts agree it is not unusual to take at least a year to move past grief. If grief makes daily life difficult for an extended period, seek professional counseling, or contact us for assistance.\"}]', '2026-10-19 13:41:38', '/images/grief.jpg'),
(13, 'frequent-questions', 'Frequent Questions', 'Resources', 1, 1, 1, 'Frequently Asked Questions', 'Answers to common questions about funeral and cremation services.', '[{\"heading\":\"Common Questions\",\"layout\":\"accordion\",\"icon\":\"question\",\"body\":\"### What services do funeral directors perform?\\nWe support grieving families and arrange cremation, burial or memorial services: transferring the deceased, preparing the body, filing permits and forms, obtaining death certificates, working with cemeteries and crematories, writing and publishing the obituary, booking clergy, music, flowers and transportation, directing the service, and helping with claims such as Social Security and VA benefits.\\n\\n### What is the purpose of a funeral?\\nA funeral gives the living a way to honor the deceased and celebrate their life, a setting to express feelings openly, permission to grieve, and a shared space where people facing the same loss can find strength in one another.\\n\\n### What are the choices for funeral services?\\nFour main types: a traditional funeral, a memorial service, a committal service, and an affirmation or celebration of life service.\\n\\n### Can you still have a funeral if you choose cremation?\\nYes. Cremation and burial only determine what happens to the body. A funeral can still be held to honor and remember the person.\"},{\"heading\":\"What Should I Bring to the Arrangement Conference?\",\"layout\":\"cards\",\"icon\":\"file\",\"body\":\"- {file} Advance directives: A will, disposition directive, or pre-need contract\\n- {flag} Military papers: Discharge papers\\n- {pin} Cemetery property: Details of any cemetery property owned\\n- {camera} Photos: A recent photo and personal items for the viewing\\n- {users} Personal information: Full legal name, address, marital status, Social Security number, date and place of birth, military service, occupation, parents\' names (including mother\'s maiden name) and next of kin\"},{\"heading\":\"Still Have a Question?\",\"layout\":\"banner\",\"icon\":\"phone\",\"image\":\"/images/section-flowers.jpg\",\"body\":\"Call (956) 701-3459 any time, day or night. We are here for you.\"}]', '2026-10-19 13:41:38', '/images/faq.jpg'),
(14, 'contact-us', 'Contact Us', 'About', 3, 1, 1, 'Contact Us', 'Questions about funeral costs or want to schedule an appointment? Call us or send a message.', '[{\"heading\":\"How Can We Help?\",\"layout\":\"cards\",\"icon\":\"phone\",\"body\":\"Reach our staff or a funeral director by phone, email, the form below, or in person. We are available 24 hours a day, 7 days a week.\\n\\n- {phone} Call us: (956) 701-3459, day or night\\n- {mail} Write to us: Use the form below and we will reply quickly\\n- {pin} Visit us: Our team is happy to meet you in person\\n- {clock} Always open: 24 hours a day, 7 days a week\"}]', '2026-10-19 13:41:38', '/images/contact.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plan_id` int DEFAULT NULL,
  `plan_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `user_id` int DEFAULT NULL,
  `stripe_session_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'usd',
  `mode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'test',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stripe_session_id` (`stripe_session_id`),
  KEY `plan_id` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `plans`
--

DROP TABLE IF EXISTS `plans`;
CREATE TABLE IF NOT EXISTS `plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `archived` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `plans`
--

INSERT INTO `plans` (`id`, `user_id`, `name`, `archived`, `created_at`, `updated_at`) VALUES
(1, 2, 'My plan', 0, '2026-10-19 12:39:03', '2026-10-22 06:27:21');

-- --------------------------------------------------------

--
-- Table structure for table `qty_screens`
--

DROP TABLE IF EXISTS `qty_screens`;
CREATE TABLE IF NOT EXISTS `qty_screens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `intro` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `uses_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `uses` text COLLATE utf8mb4_unicode_ci,
  `question` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `note` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `first_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `extra_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `min_qty` int NOT NULL DEFAULT '1',
  `max_qty` int NOT NULL DEFAULT '10',
  `sort_order` int NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `qty_screens`
--

INSERT INTO `qty_screens` (`id`, `name`, `title`, `intro`, `uses_title`, `uses`, `question`, `note`, `first_price`, `extra_price`, `min_qty`, `max_qty`, `sort_order`, `active`) VALUES
(1, 'Certified Death Certificates', 'Certified Death Certificates', 'Certified death certificates are often needed to settle financial and legal matters.', 'Common Uses', 'Insurance claims\nSocial Security\nBank accounts\nProperty transfers\nPension benefits', 'How Many Certified Copies Would You Like?', 'Most families obtain between 5 and 10 copies.', 21.00, 4.00, 1, 10, 11, 1);

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
CREATE TABLE IF NOT EXISTS `questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'single',
  `sort_order` int NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`id`, `title`, `subtitle`, `type`, `sort_order`, `active`) VALUES
(1, 'Who Are You Planning For?', '', 'single', 1, 1),
(2, 'What Type of Arrangement Are You Planning?', '', 'single', 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `review_groups`
--

DROP TABLE IF EXISTS `review_groups`;
CREATE TABLE IF NOT EXISTS `review_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sources` text COLLATE utf8mb4_unicode_ci,
  `sort_order` int NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `review_groups`
--

INSERT INTO `review_groups` (`id`, `label`, `sources`, `sort_order`, `active`) VALUES
(1, 'Arrangement Schedule', '[\"q:2\",\"package\"]', 1, 1),
(2, 'Visitation Selection', '[\"visitation\"]', 2, 1),
(3, 'Rosary / Prayer Service', '[\"choice:1\"]', 3, 1),
(4, 'Funeral Ceremony', '[\"choice:2\",\"ceremony\"]', 4, 1),
(5, 'Memorial Package', '[\"choice:3\"]', 5, 1),
(6, 'Casket', '[\"choice:4\"]', 6, 1),
(7, 'Flowers', '[\"extras:1\"]', 7, 1),
(8, 'Death Certificates', '[\"qty:1\"]', 8, 1),
(9, 'Clergy', '[\"extras:2:3\"]', 9, 1),
(10, 'Escort', '[\"extras:2:4\"]', 10, 1),
(11, 'Obituary', '[\"extras:2:5\"]', 11, 1),
(12, 'Additional Options', '[\"extras:3\"]', 12, 1);

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
CREATE TABLE IF NOT EXISTS `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `name`, `description`, `fee`, `active`, `sort_order`) VALUES
(1, 'Visitation Fee', '', 0.00, 1, 1),
(2, 'Funeral Service Fee', '', 0.00, 1, 2),
(3, 'Graveside Service Fee', '', 0.00, 1, 3),
(4, 'Embalming', '', 0.00, 1, 10),
(5, 'Dressing', '', 0.00, 1, 11),
(6, 'Casketing', '', 0.00, 1, 12),
(7, 'Basic cosmetology', '', 0.00, 1, 13),
(8, 'Handling of remains', '', 0.00, 1, 14);

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
CREATE TABLE IF NOT EXISTS `settings` (
  `key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`key`, `value`) VALUES
('address', '1029 Bob Bullock Loop, Suite 1, Laredo, TX 78043'),
('email', 'fgamez4@gmail.com'),
('facebook', 'https://www.facebook.com/gamezandsons/'),
('footer_note', 'For information on preneed funeral contracts and the trust and insurance funding options available under Texas law, visit www.prepaidfunerals.texas.gov.'),
('home_slides', '[{\"image\":\"/images/slide-1.jpg\",\"title\":\"Serving Families With Compassion, Dignity & Respect\",\"subtitle\":\"Your trusted funeral and cremation provider in Laredo, Rio Bravo, El Cenizo and surrounding Webb County communities.\",\"link\":\"/services-overview\",\"cta\":\"Learn More\"},{\"image\":\"/images/slide-2.jpg\",\"title\":\"Your Loved One Deserves The Best\",\"subtitle\":\"Personalized services that honor their life, their faith and their story.\",\"link\":\"/personalization\",\"cta\":\"Learn More\"},{\"image\":\"/images/slide-3.jpg\",\"title\":\"Traditional Services, Thoughtfully Planned\",\"subtitle\":\"Visitation, funeral and graveside services designed around your family.\",\"link\":\"/traditional-services\",\"cta\":\"Our Services\"},{\"image\":\"/images/slide-4.jpg\",\"title\":\"Plan Ahead, Give Your Family Peace of Mind\",\"subtitle\":\"Record your wishes today so your loved ones are never left to guess.\",\"link\":\"/plan\",\"cta\":\"Start Planning\"}]'),
('hours', 'Available 24 hours a day, 7 days a week'),
('phone', '(956) 701-3459'),
('screen3_title', 'How Would You Like The Events To Be Scheduled?'),
('screen4_title', 'Will There Be A Visitation?'),
('screen7_order', '7'),
('screen7_title', 'What Type Of Funeral Ceremony Will Be Held?'),
('seeded_ceremony', '1'),
('seeded_choice_screen5', '1'),
('seeded_choice_screen6', '1'),
('seeded_choice_screen8', '1'),
('seeded_choice_screen9', '1'),
('seeded_extras10', '1'),
('seeded_extras12', '1'),
('seeded_extras13', '1'),
('seeded_iconic_pages', '1'),
('seeded_other_location_detail', '1'),
('seeded_packages', '1'),
('seeded_qty11', '1'),
('seeded_review14', '1'),
('seeded_screen2', '1'),
('seeded_visitation', '1'),
('site_name', 'Gámez & Sons Funeral and Cremation Services'),
('tagline', 'Serving Families With Compassion, Dignity & Respect');

-- --------------------------------------------------------

--
-- Table structure for table `ui_texts`
--

DROP TABLE IF EXISTS `ui_texts`;
CREATE TABLE IF NOT EXISTS `ui_texts` (
  `k` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `v` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`k`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `profile` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `created_at`, `profile`) VALUES
(1, 'Administrator', 'admin@example.com', '$2a$10$yZZ1IPgNJGObtOZBnNbfJ.MT62aqOuZoWJx5sF7n.VeiKVuBDUJM.', 'admin', '2026-10-18 06:45:11', NULL),
(2, 'Manan', 'modi.manan14@gmail.com', '$2a$10$d1WnXG5NofUPyvMXTyiwG.fHbdi2I4/0iP6/.4VFqpmLPAiuFdyz6', 'user', '2026-10-18 07:11:22', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `visitation_services`
--

DROP TABLE IF EXISTS `visitation_services`;
CREATE TABLE IF NOT EXISTS `visitation_services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `visitation_id` int NOT NULL,
  `service_id` int NOT NULL,
  `applies` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'always',
  `fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `visitation_id` (`visitation_id`),
  KEY `service_id` (`service_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `visitation_services`
--

INSERT INTO `visitation_services` (`id`, `visitation_id`, `service_id`, `applies`, `fee`) VALUES
(28, 1, 4, 'always', 10.00),
(29, 1, 5, 'always', 10.00),
(30, 1, 6, 'always', 10.00),
(31, 1, 7, 'always', 10.00),
(32, 2, 4, 'yes', 10.00),
(33, 2, 8, 'yes', 10.00),
(34, 2, 8, 'no', 10.00),
(35, 3, 4, 'yes', 10.00),
(36, 3, 8, 'yes', 10.00),
(37, 3, 8, 'no', 10.00);

-- --------------------------------------------------------

--
-- Table structure for table `visitation_types`
--

DROP TABLE IF EXISTS `visitation_types`;
CREATE TABLE IF NOT EXISTS `visitation_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `examples` text COLLATE utf8mb4_unicode_ci,
  `followup_title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `visitation_types`
--

INSERT INTO `visitation_types` (`id`, `name`, `description`, `examples`, `followup_title`, `active`, `sort_order`) VALUES
(1, 'Open Casket Visitation', 'Family and friends may gather and view the deceased.', 'Guests visit with family and may approach the casket to pay their respects.\nFor Catholic families, a Rosary is often held during the visitation.', '', 1, 1),
(2, 'Closed Casket Visitation', 'Family and friends may gather while the casket remains closed.', 'Guests spend time with the family during the visitation without public viewing.\nA Rosary or prayer service may still be held.', 'Would You Like Embalming Performed?', 1, 2),
(3, 'No Visitation', 'The first public event will be the funeral ceremony.', 'A funeral ceremony is held without a separate visitation period.', 'Would You Like Embalming Performed?', 1, 3);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `answers`
--
ALTER TABLE `answers`
  ADD CONSTRAINT `fk_answers_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `arrangements`
--
ALTER TABLE `arrangements`
  ADD CONSTRAINT `fk_arrangements_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `fk_carts_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cart_ceremony`
--
ALTER TABLE `cart_ceremony`
  ADD CONSTRAINT `fk_cart_ceremony_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cart_choices`
--
ALTER TABLE `cart_choices`
  ADD CONSTRAINT `fk_cart_choices_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cart_extras`
--
ALTER TABLE `cart_extras`
  ADD CONSTRAINT `fk_cart_extras_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cart_qty`
--
ALTER TABLE `cart_qty`
  ADD CONSTRAINT `fk_cart_qty_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ceremony_addons`
--
ALTER TABLE `ceremony_addons`
  ADD CONSTRAINT `ceremony_addons_ibfk_1` FOREIGN KEY (`ceremony_id`) REFERENCES `ceremony_types` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `choice_options`
--
ALTER TABLE `choice_options`
  ADD CONSTRAINT `choice_options_ibfk_1` FOREIGN KEY (`screen_id`) REFERENCES `choice_screens` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `estimates`
--
ALTER TABLE `estimates`
  ADD CONSTRAINT `fk_estimates_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `extras_choices`
--
ALTER TABLE `extras_choices`
  ADD CONSTRAINT `extras_choices_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `extras_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `extras_items`
--
ALTER TABLE `extras_items`
  ADD CONSTRAINT `extras_items_ibfk_1` FOREIGN KEY (`screen_id`) REFERENCES `extras_screens` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `options`
--
ALTER TABLE `options`
  ADD CONSTRAINT `options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `package_services`
--
ALTER TABLE `package_services`
  ADD CONSTRAINT `package_services_ibfk_1` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `package_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `plans`
--
ALTER TABLE `plans`
  ADD CONSTRAINT `plans_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `visitation_services`
--
ALTER TABLE `visitation_services`
  ADD CONSTRAINT `visitation_services_ibfk_1` FOREIGN KEY (`visitation_id`) REFERENCES `visitation_types` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `visitation_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
