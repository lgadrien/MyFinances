-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 12, 2024 at 05:24 PM
-- Server version: 5.7.24
-- PHP Version: 8.0.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `myfinances`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `account_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `account_type` varchar(50) DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`account_id`, `user_id`, `account_type`, `balance`) VALUES
(22, 15, 'Compte courant', '250.00'),
(23, 15, 'Livret A', '1000.00'),
(24, 15, 'Livret jeune', '40.00'),
(25, 16, 'Compte courant', '0.00'),
(26, 16, 'Livret A', '0.00'),
(27, 16, 'Livret jeune', '0.00');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `transaction_id` int(11) NOT NULL,
  `account_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `description` varchar(255) DEFAULT NULL,
  `transaction_type` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`transaction_id`, `account_id`, `amount`, `transaction_date`, `description`, `transaction_type`) VALUES
(16, 22, '250.00', '2024-08-09 19:35:25', 'solde de base', NULL),
(17, 23, '1000.00', '2024-08-09 19:36:53', 'Téléphone + épargne', NULL),
(18, 24, '-1000.00', '2024-08-09 19:37:18', 'Téléphone + épargne', NULL),
(19, 24, '1000.00', '2024-08-09 19:37:30', 'Téléphone + épargne', NULL),
(20, 24, '-1000.00', '2024-08-09 19:39:20', 'test', NULL),
(21, 24, '1000.00', '2024-08-09 19:39:33', 'test', NULL),
(22, 24, '1000.00', '2024-08-09 19:41:18', 'test', NULL),
(23, 24, '1000.00', '2024-08-09 19:41:21', 'test', NULL),
(24, 24, '1000.00', '2024-08-09 19:41:23', 'test', NULL),
(25, 24, '1000.00', '2024-08-09 19:41:24', 'test', NULL),
(26, 24, '1000.00', '2024-08-09 19:41:26', 'test', NULL),
(27, 24, '1000.00', '2024-08-09 19:41:36', 'test', NULL),
(28, 24, '-6000.00', '2024-08-09 19:41:51', 'test', NULL),
(29, NULL, '40.00', '2024-08-09 20:39:00', 'Dépôt initial du livret jeune', NULL),
(30, 22, '40.00', '2024-08-09 20:39:29', 'Dépôt initial du livret jeune', NULL),
(31, 22, '-40.00', '2024-08-09 20:40:05', 'Dépôt initial du livret jeune', NULL),
(32, 24, '-40.00', '2024-08-09 20:40:31', 'Dépôt initial du livret jeune', NULL),
(33, 24, '80.00', '2024-08-09 20:40:40', 'Dépôt initial du livret jeune', NULL),
(34, 22, '-6.00', '2024-08-09 20:56:43', 'Chichis', NULL),
(35, 22, '6.00', '2024-08-09 21:01:06', 'Chichis', NULL),
(36, 22, '2.00', '2024-08-09 21:04:45', 'test', NULL),
(37, 22, '-2.00', '2024-08-09 21:04:55', 'test', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` char(32) NOT NULL,
  `date_of_birth` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `date_of_birth`) VALUES
(15, 'Adrien Le Guen', 'adrien33.leguen@gmail.com', 'Adrien', '2005-03-07'),
(16, 'Marek Shneider', 'MarekS@gmail.com', 'EsthelLPB', '2009-11-17');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`account_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `account_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accounts`
--
ALTER TABLE `accounts`
  ADD CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
