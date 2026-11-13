-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: moodle
-- ------------------------------------------------------
-- Server version	8.0.35

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `data_files`
--

DROP TABLE IF EXISTS `data_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Datatable_id` int NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `path` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_Data_files_Data table_idx` (`Datatable_id`),
  CONSTRAINT `fk_Data_files_Data table` FOREIGN KEY (`Datatable_id`) REFERENCES `data_table` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `data_files`
--

LOCK TABLES `data_files` WRITE;
/*!40000 ALTER TABLE `data_files` DISABLE KEYS */;
INSERT INTO `data_files` VALUES (1,4,'2eae32d6244abc3bee64c7baf50cf1b6.mp4','2eae32d6244abc3bee64c7baf50cf1b6.mp4','uploads\\2eae32d6244abc3bee64c7baf50cf1b6.mp4'),(2,11,'0006 - One Piece.pdf','0006 - One Piece.pdf','uploads\\0006 - One Piece.pdf'),(3,12,'0006 - One Piece.pdf','0006 - One Piece.pdf','uploads\\0006 - One Piece.pdf'),(4,4,'0001.mp4','0001.mp4','uploads\\0001.mp4');
/*!40000 ALTER TABLE `data_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `data_table`
--

DROP TABLE IF EXISTS `data_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_table` (
  `id` int NOT NULL AUTO_INCREMENT,
  `topic` varchar(45) NOT NULL,
  `description` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `link` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `password` varchar(255) DEFAULT NULL,
  `uploaded_by` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_Data_table_users1_idx` (`uploaded_by`),
  CONSTRAINT `fk_Data_table_users1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `data_table`
--

LOCK TABLES `data_table` WRITE;
/*!40000 ALTER TABLE `data_table` DISABLE KEYS */;
INSERT INTO `data_table` VALUES (1,'React Basics','Introduction to React components and props.','link','https://www.youtube.com/','2026-07-24 08:58:05',NULL,3),(4,'Node.js Introduction','Learn about Node.js and Express framework','file',NULL,'2026-07-24 09:05:02',NULL,2),(10,'Client Onboarding Checklist','Steps for onboarding a new client to the portal','link','https://notion.so/example-checklist','2026-07-27 09:22:01',NULL,2),(11,'Sample Storyboard - Kavindu','Draft storyboard for review','file',NULL,'2026-07-27 09:23:10','$2b$10$DUdaEZS275YjF9ZFJ35j7.5ur3xWvupmFz8yrtVv5WKRorylbJbIG',1),(12,'Laojee Tea Campaign Brief','Client brief for the Laojee Tea Sinhala-language promo','file',NULL,'2026-07-27 09:31:08','$2b$10$jCdAAViR8cxkOaJzrfFLAu5LFxyPyhWjXe6VJVGiok4Oe1PtGC24a',1);
/*!40000 ALTER TABLE `data_table` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_requests`
--

DROP TABLE IF EXISTS `password_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `status` enum('pending','approved','denied') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Data_table_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `fk_password_requests_Data_table1_idx` (`Data_table_id`),
  CONSTRAINT `fk_password_requests_Data_table1` FOREIGN KEY (`Data_table_id`) REFERENCES `data_table` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_requests`
--

LOCK TABLES `password_requests` WRITE;
/*!40000 ALTER TABLE `password_requests` DISABLE KEYS */;
INSERT INTO `password_requests` VALUES (7,'Nidula','approved','2026-07-27 09:23:51',11),(8,'Nidula','approved','2026-07-27 09:31:31',12);
/*!40000 ALTER TABLE `password_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` varchar(20) NOT NULL,
  `username` varchar(45) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_admin` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId_UNIQUE` (`userId`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'ADMIN001','Admin','$2b$10$vHM404U1GPpKxWDcEIgjceOGWr6xNe1/0yLszem2wfvvc8t1Ql3oi','2026-07-24 10:05:59',1),(2,'USR-1784891024241','Nidula','$2b$10$Q7SppQkBeHpgNkNVVUd0YOK0QAiGjWvBGm9BB./iThxbC/IMwSv9q','2026-07-24 11:03:44',0),(3,'USR-1784891229099','Nishel','$2b$10$KhWO1ioTjlnS71x7wQnmZu6Qi94Bk4B4VeAb2uPG4O2QJthb2rJ3S','2026-07-24 11:07:09',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-03 16:00:15
