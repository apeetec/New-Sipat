-- Execute somente em ambiente local/VPS com permissao CREATE DATABASE.
CREATE DATABASE IF NOT EXISTS `sipat_portal`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `sipat_portal`;

SOURCE schema.sql;
