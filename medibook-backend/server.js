// ============================================================
//  MediBook — Entry Point
// ============================================================
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const db       = require('./config/db');

const authRoutes         = require('./routes/auth');
const doctorRoutes       = require('./routes/doctors');
const reviewRoutes       = require('./routes/reviews');
const appointmentRoutes  = require('./routes/appointments');
const availabilityRoutes = require('./routes/availability');
const adminRoutes        = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// ── Ensure password reset and auth schema ─────────────────────
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Password reset table ready');

    await db.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        doctor_id INT DEFAULT NULL,
        rating TINYINT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
      )
    `);
    console.log('Reviews table ready');

    const [columns] = await db.query("SHOW COLUMNS FROM users LIKE 'google_id'");
    if (columns.length === 0) {
      await db.query('ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE');
      console.log('Google ID column added to users table');
    }

    const [avatarColumns] = await db.query("SHOW COLUMNS FROM users LIKE 'avatar_url'");
    if (avatarColumns.length === 0) {
      await db.query('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500)');
      console.log('Avatar URL column added to users table');
    }
  } catch (err) {
    console.error('Failed to initialize auth schema:', err.message);
  }
})();
// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/doctors',      doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/availability', availabilityRoutes);app.use('/api/reviews',      reviewRoutes);app.use('/api/admin',        adminRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ message: 'MediBook API is running 🚀' }));

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
