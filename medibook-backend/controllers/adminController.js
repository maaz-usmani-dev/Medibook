const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
  sendDoctorApprovalNotification,
  sendDoctorAccountCreatedEmail,
} = require('../config/mailer');

exports.getStats = async (req, res) => {
  try {
    const [[users]] = await db.query(
      'SELECT COUNT(*) AS totalUsers FROM users'
    );

    const [[doctors]] = await db.query(
      'SELECT COUNT(*) AS totalDoctors FROM doctors'
    );

    const [[appointments]] = await db.query(
      'SELECT COUNT(*) AS totalAppointments FROM appointments'
    );

    res.json({
      totalUsers: users.totalUsers,
      totalDoctors: doctors.totalDoctors,
      totalAppointments: appointments.totalAppointments
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `
      SELECT
        id,
        full_name,
        email,
        role,
        is_blocked,
        created_at
      FROM users
      ORDER BY created_at DESC
    `
    );

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleBlock = async (req, res) => {
  try {
    const userId = req.params.id;

    const [[user]] = await db.query(
      'SELECT is_blocked FROM users WHERE id = ?',
      [userId]
    );

    const newStatus = !user.is_blocked;

    await db.query(
      'UPDATE users SET is_blocked = ? WHERE id = ?',
      [newStatus, userId]
    );

    res.json({
      message: `User ${newStatus ? 'blocked' : 'unblocked'} successfully`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPendingDoctors = async (req, res) => {
  try {
    const [doctors] = await db.query(
      `
      SELECT
        d.id AS doctor_id,
        u.id AS user_id,
        u.full_name,
        u.email,
        u.phone,
        u.date_of_birth,
        u.gender,
        u.created_at,
        d.specialty,
        d.hospital,
        d.status
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'review'
      ORDER BY u.created_at DESC
      `
    );

    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDoctorStatus = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const status = req.body.status === 'rejected' ? 'inactive' : req.body.status;
    if (!['active', 'inactive', 'review'].includes(status)) {
      return res.status(400).json({ message: 'Invalid doctor status.' });
    }

    const [[doctor]] = await db.query(
      'SELECT d.user_id, u.email, u.full_name FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?',
      [doctorId]
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    await db.query('UPDATE doctors SET status = ? WHERE id = ?', [status, doctorId]);

    try {
      if (status === 'active') {
        await sendDoctorApprovalNotification({
          doctorEmail: doctor.email,
          doctorName: doctor.full_name,
          status: 'approved',
        });
      } else if (status === 'inactive') {
        await sendDoctorApprovalNotification({
          doctorEmail: doctor.email,
          doctorName: doctor.full_name,
          status: 'rejected',
        });
      }
    } catch (mailerError) {
      console.error('Doctor approval notification failed:', mailerError.message);
    }

    res.json({ message: `Doctor status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createDoctorAccount = async (req, res) => {
  const {
    full_name,
    email,
    password,
    phone,
    date_of_birth,
    gender,
    specialty,
    qualification,
    experience_years,
    fee,
    hospital,
    languages,
    bio,
    send_email = true,
  } = req.body;

  if (!full_name || !email || !specialty || !hospital) {
    return res.status(400).json({ message: 'Name, email, specialty, and hospital are required.' });
  }

  const safeGender = ['Male', 'Female', 'Other'].includes(gender) ? gender : null;
  const doctorGender = ['Male', 'Female'].includes(gender) ? gender : null;
  const tempPassword = password || crypto.randomBytes(9).toString('base64url');
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(tempPassword, 10);
    const [userResult] = await connection.query(
      `INSERT INTO users (full_name, email, password_hash, phone, date_of_birth, gender, role)
       VALUES (?, ?, ?, ?, ?, ?, 'doctor')`,
      [full_name, email, password_hash, phone || null, date_of_birth || null, safeGender]
    );

    const [doctorResult] = await connection.query(
      `INSERT INTO doctors
        (user_id, specialty, qualification, experience_years, bio, hospital, languages, fee, gender, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        userResult.insertId,
        specialty,
        qualification || null,
        experience_years || null,
        bio || null,
        hospital,
        languages || null,
        fee || null,
        doctorGender,
      ]
    );

    await connection.commit();

    let emailSent = false;
    if (send_email !== false) {
      try {
        await sendDoctorAccountCreatedEmail({
          doctorEmail: email,
          doctorName: full_name,
          password: tempPassword,
          loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
        });
        emailSent = true;
      } catch (mailerError) {
        console.error('Doctor account email failed:', mailerError.message);
      }
    }

    return res.status(201).json({
      message: 'Doctor account created successfully.',
      doctor: {
        id: doctorResult.insertId,
        user_id: userResult.insertId,
        full_name,
        email,
        specialty,
        hospital,
        status: 'active',
      },
      emailSent,
      temporaryPassword: emailSent ? undefined : tempPassword,
    });
  } catch (err) {
    await connection.rollback();
    console.error('createDoctorAccount error:', err);
    return res.status(500).json({ message: 'Unable to create doctor account.' });
  } finally {
    connection.release();
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const [appointments] = await db.query(
      `
      SELECT
        a.*,
        p.full_name AS patient_name,
        duser.full_name AS doctor_name
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users duser ON d.user_id = duser.id
      ORDER BY a.appointment_date DESC
    `
    );

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
