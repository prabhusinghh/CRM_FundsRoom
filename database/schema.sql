-- Mini ERP + CRM Operations Portal — Database Schema
-- Run: mysql -u root -p erp_crm < database/schema.sql

CREATE DATABASE IF NOT EXISTS erp_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE erp_crm;

-- ---------------------------------------------------------------------------
-- Users & Roles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin','Sales','Warehouse','Accounts') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- CRM: Customers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  business_name VARCHAR(150),
  gst_number VARCHAR(20),
  customer_type ENUM('Retail','Wholesale','Distributor') NOT NULL DEFAULT 'Retail',
  address TEXT,
  status ENUM('Lead','Active','Inactive') NOT NULL DEFAULT 'Lead',
  follow_up_date DATE,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_customer_status (status),
  INDEX idx_customer_mobile (mobile),
  INDEX idx_customer_name (name)
);

CREATE TABLE IF NOT EXISTS customer_followups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  note TEXT NOT NULL,
  follow_up_date DATE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ---------------------------------------------------------------------------
-- Inventory: Products & Stock Movements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(100),
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  current_stock INT NOT NULL DEFAULT 0,
  min_stock_alert INT NOT NULL DEFAULT 0,
  warehouse_location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_stock_non_negative CHECK (current_stock >= 0),
  INDEX idx_product_sku (sku),
  INDEX idx_product_category (category),
  INDEX idx_product_name (name)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity_changed INT NOT NULL,
  movement_type ENUM('IN','OUT') NOT NULL,
  reason VARCHAR(255),
  reference_type VARCHAR(50),   -- 'CHALLAN', 'MANUAL', 'PURCHASE_ORDER'
  reference_id INT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_stock_product (product_id),
  INDEX idx_stock_reference (reference_type, reference_id)
);

-- ---------------------------------------------------------------------------
-- Sales Challans
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challan_counters (
  year INT PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS challans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  challan_number VARCHAR(30) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  total_quantity INT NOT NULL DEFAULT 0,
  status ENUM('Draft','Confirmed','Cancelled') NOT NULL DEFAULT 'Draft',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_challan_status (status),
  INDEX idx_challan_customer (customer_id)
);

CREATE TABLE IF NOT EXISTS challan_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  challan_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name_snapshot VARCHAR(150) NOT NULL,
  product_sku_snapshot VARCHAR(50) NOT NULL,
  unit_price_snapshot DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (challan_id) REFERENCES challans(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_challan_items_challan (challan_id)
);
