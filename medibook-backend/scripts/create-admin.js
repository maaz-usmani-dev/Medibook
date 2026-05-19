#!/usr/bin/env node
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const bcrypt = require('bcryptjs');
const db = require('../config/db');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {};
  args.forEach(a => {
    if (a.startsWith('--email=')) out.email = a.split('=')[1];
    if (a.startsWith('--password=')) out.password = a.split('=')[1];
  });
  return out;
};

const main = async () => {
  const cli = parseArgs();
  const email = cli.email || process.env.ADMIN_EMAIL;
  const password = cli.password || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Usage: set ADMIN_EMAIL and ADMIN_PASSWORD env vars, or pass --email= and --password=');
    process.exit(1);
  }

  try {
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      console.error('A user with that email already exists. Aborting.');
      process.exit(1);
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users (full_name, email, password_hash, role, created_at)
       VALUES (?, ?, ?, 'admin', NOW())`,
      ['Administrator', email, password_hash]
    );

    console.log('Admin user created with id:', result.insertId);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message || err);
    process.exit(1);
  }
};

main();
