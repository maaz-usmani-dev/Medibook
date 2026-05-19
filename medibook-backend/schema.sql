-- ============================================================
--  MediBook — Database Schema + Seed Data
--  Run: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS medibook;
USE medibook;

-- ─────────────────────────────────────────
--  TABLES
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  full_name       VARCHAR(100)  NOT NULL,
  email           VARCHAR(100)  UNIQUE NOT NULL,
  google_id       VARCHAR(255)  UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  phone           VARCHAR(20),
  date_of_birth   DATE,
  gender          ENUM('Male','Female','Other'),
  role            ENUM('patient','doctor','admin') DEFAULT 'patient',
  is_blocked      BOOLEAN       DEFAULT FALSE,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNIQUE,
  specialty        VARCHAR(100),
  qualification    VARCHAR(200),
  experience_years INT,
  bio              TEXT,
  hospital         VARCHAR(200),
  languages        VARCHAR(200),
  fee              INT,
  gender           ENUM('Male','Female'),
  status           ENUM('active','inactive','review') DEFAULT 'review',
  rating           DECIMAL(2,1) DEFAULT 0,
  review_count     INT          DEFAULT 0,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS availability (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id    INT NOT NULL,
  day_of_week  ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun'),
  time_slot    VARCHAR(10),
  is_active    BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  patient_id       INT NOT NULL,
  doctor_id        INT NOT NULL,
  appointment_date DATE        NOT NULL,
  time_slot        VARCHAR(10) NOT NULL,
  type             ENUM('In-person','Video') DEFAULT 'In-person',
  status           ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  reason           TEXT,
  fee              INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id)  REFERENCES doctors(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
--  SEED DATA
--  Passwords are all: password123
--  Hash generated with bcrypt (10 rounds)
-- ─────────────────────────────────────────

-- Admin
INSERT INTO users (full_name, email, password_hash, phone, gender, role) VALUES
('Super Admin', 'admin@medibook.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', -- password: password123
 '03001234567', 'Male', 'admin');

-- Patients
INSERT INTO users (full_name, email, password_hash, phone, date_of_birth, gender, role) VALUES
('Ali Hassan', 'ali@example.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
 '03211234567', '1995-06-15', 'Male', 'patient'),
('Sara Khan', 'sara@example.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
 '03331234567', '1998-03-22', 'Female', 'patient');

-- Doctors (users first)
INSERT INTO users (full_name, email, password_hash, phone, gender, role) VALUES
('Dr. Kamran Malik', 'kamran@medibook.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
 '03451234567', 'Male', 'doctor'),
('Dr. Ayesha Raza', 'ayesha@medibook.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
 '03461234567', 'Female', 'doctor'),
('Dr. Bilal Chaudhry', 'bilal@medibook.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
 '03471234567', 'Male', 'doctor');

-- Doctor profiles
INSERT INTO doctors (user_id, specialty, qualification, experience_years, bio, hospital, languages, fee, gender, status, rating, review_count)
VALUES
(4, 'Cardiologist', 'MBBS, FCPS (Cardiology)', 12,
 'Experienced cardiologist specialising in interventional procedures and heart disease management.',
 'Shaukat Khanum Memorial Hospital', 'English, Urdu', 3000, 'Male', 'active', 4.8, 142),

(5, 'Dermatologist', 'MBBS, FCPS (Dermatology)', 8,
 'Specialist in skin disorders, cosmetic dermatology, and laser treatments.',
 'Lahore General Hospital', 'English, Urdu, Punjabi', 2500, 'Female', 'active', 4.6, 98),

(6, 'General Physician', 'MBBS, MCPS', 5,
 'General physician providing comprehensive primary care for all age groups.',
 'Services Hospital Lahore', 'English, Urdu', 1500, 'Male', 'active', 4.3, 67);

-- Availability slots
INSERT INTO availability (doctor_id, day_of_week, time_slot) VALUES
(1,'Mon','09:00 AM'),(1,'Mon','10:00 AM'),(1,'Mon','11:00 AM'),
(1,'Wed','09:00 AM'),(1,'Wed','10:00 AM'),
(1,'Fri','02:00 PM'),(1,'Fri','03:00 PM'),

(2,'Tue','10:00 AM'),(2,'Tue','11:00 AM'),(2,'Tue','12:00 PM'),
(2,'Thu','10:00 AM'),(2,'Thu','11:00 AM'),
(2,'Sat','09:00 AM'),(2,'Sat','10:00 AM'),

(3,'Mon','08:00 AM'),(3,'Mon','09:00 AM'),(3,'Mon','10:00 AM'),
(3,'Tue','08:00 AM'),(3,'Tue','09:00 AM'),
(3,'Wed','08:00 AM'),(3,'Thu','08:00 AM'),(3,'Fri','08:00 AM');

-- Sample appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, type, status, reason, fee) VALUES
(2, 1, CURDATE() + INTERVAL 3 DAY, '09:00 AM', 'In-person', 'confirmed', 'Chest pain and shortness of breath', 3000),
(3, 2, CURDATE() + INTERVAL 5 DAY, '10:00 AM', 'Video',      'pending',   'Skin rash on arms',                  2500),
(2, 3, CURDATE() - INTERVAL 7 DAY, '08:00 AM', 'In-person', 'completed', 'Routine check-up',                   1500);
