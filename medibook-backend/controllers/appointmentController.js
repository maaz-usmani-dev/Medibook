// ============================================================
//  controllers/appointmentController.js
// ============================================================
const { validationResult } = require('express-validator');
const db     = require('../config/db');
const mailer = require('../config/mailer');

// ── POST /api/appointments — patient books ────────────────────
const bookAppointment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { doctor_id, appointment_date, time_slot, type, reason } = req.body;
  const patient_id = req.user.id;

  try {
    // Check slot not already taken
    const [conflict] = await db.query(
      `SELECT id FROM appointments
       WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status NOT IN ('cancelled')`,
      [doctor_id, appointment_date, time_slot]
    );
    if (conflict.length > 0) {
      return res.status(409).json({ error: 'This time slot is already booked.' });
    }

    // Get doctor fee
    const [docRows] = await db.query('SELECT fee FROM doctors WHERE id = ?', [doctor_id]);
    if (!docRows[0]) return res.status(404).json({ error: 'Doctor not found.' });
    const fee = docRows[0].fee;

    // Insert appointment
    const [result] = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, type, reason, fee)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, doctor_id, appointment_date, time_slot, type || 'In-person', reason || null, fee]
    );

    const appointmentId = result.insertId;

    // Fetch details for the confirmation email
    const [details] = await db.query(
      `SELECT u.full_name AS patient_name, u.email AS patient_email,
              du.full_name AS doctor_name
       FROM users u
       JOIN appointments a ON a.id = ?
       JOIN doctors d ON d.id = a.doctor_id
       JOIN users du ON du.id = d.user_id
       WHERE u.id = ?`,
      [appointmentId, patient_id]
    );

    // Send confirmation email (non-blocking)
    if (details[0]) {
      mailer
        .sendBookingConfirmation({
          patientEmail: details[0].patient_email,
          patientName: details[0].patient_name,
          doctorName: details[0].doctor_name,
          date: appointment_date,
          timeSlot: time_slot,
          type: type || 'In-person',
          fee,
        })
        .catch((mailerError) => {
          console.error('Booking confirmation email failed:', mailerError.message);
        });
    }

    return res.status(201).json({ message: 'Appointment booked.', id: appointmentId });
  } catch (err) {
    console.error('bookAppointment error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── GET /api/appointments/my ──────────────────────────────────
// Returns appointments for the logged-in patient or doctor
const getMyAppointments = async (req, res) => {
  const { id, role } = req.user;
  try {
    let sql, params;

    if (role === 'patient') {
      sql = `
        SELECT a.*, d.specialty, du.full_name AS doctor_name
        FROM appointments a
        JOIN doctors d  ON a.doctor_id  = d.id
        JOIN users   du ON d.user_id    = du.id
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date DESC
      `;
      params = [id];
    } else if (role === 'doctor') {
      sql = `
        SELECT a.*, pu.full_name AS patient_name, pu.phone AS patient_phone
        FROM appointments a
        JOIN users pu ON a.patient_id = pu.id
        JOIN doctors d ON a.doctor_id = d.id
        WHERE d.user_id = ?
        ORDER BY a.appointment_date DESC
      `;
      params = [id];
    } else {
      return res.status(403).json({ error: 'Use /api/admin/appointments for admin.' });
    }

    const [appointments] = await db.query(sql, params);
    return res.json(appointments);
  } catch (err) {
    console.error('getMyAppointments error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── GET /api/appointments/:id — specific appointment for owner/admin ─────
const getAppointmentById = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const [rows] = await db.query(
      `SELECT a.id, a.appointment_date, a.time_slot, a.type, a.status, a.reason, a.fee,
              a.patient_id, a.doctor_id,
              du.full_name AS doctor_name, d.specialty, d.hospital, d.fee AS doctor_fee,
              pu.full_name AS patient_name, pu.email AS patient_email
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users du ON d.user_id = du.id
       JOIN users pu ON a.patient_id = pu.id
       WHERE a.id = ?`,
      [appointmentId]
    );

    const appointment = rows[0];
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });

    if (req.user.role === 'patient' && appointment.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    if (req.user.role === 'doctor') {
      const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
      if (!doctorRows[0] || doctorRows[0].id !== appointment.doctor_id) {
        return res.status(403).json({ error: 'Forbidden.' });
      }
    }

    return res.json({
      id: appointment.id,
      appointment_date: appointment.appointment_date,
      time_slot: appointment.time_slot,
      type: appointment.type,
      status: appointment.status,
      reason: appointment.reason,
      fee: appointment.fee,
      doctor: {
        id: appointment.doctor_id,
        name: appointment.doctor_name,
        specialty: appointment.specialty,
        hospital: appointment.hospital,
        fee: appointment.doctor_fee,
      },
      patient: {
        id: appointment.patient_id,
        name: appointment.patient_name,
        email: appointment.patient_email,
      },
    });
  } catch (err) {
    console.error('getAppointmentById error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── PUT /api/appointments/:id/status — doctor or admin ────────
const updateStatus = async (req, res) => {
  const { status } = req.body;
  const allowed     = ['confirmed', 'cancelled', 'completed'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const [rows] = await db.query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Appointment not found.' });

    if (req.user.role === 'patient') {
      if (rows[0].patient_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden.' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ error: 'Patients can only cancel appointments.' });
      }
    }

    // Doctors can only update their own appointments
    if (req.user.role === 'doctor') {
      const [doc] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
      if (!doc[0] || doc[0].id !== rows[0].doctor_id) {
        return res.status(403).json({ error: 'Forbidden.' });
      }
    }

    await db.query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
    return res.json({ message: `Appointment ${status}.` });
  } catch (err) {
    console.error('updateStatus error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

// ── PUT /api/appointments/:id/reschedule — patient only ───────
const rescheduleAppointment = async (req, res) => {
  const { appointment_date, time_slot } = req.body;

  if (!appointment_date || !time_slot) {
    return res.status(400).json({ error: 'New date and time_slot are required.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Appointment not found.' });
    if (rows[0].patient_id !== req.user.id) return res.status(403).json({ error: 'Forbidden.' });
    if (rows[0].status === 'completed' || rows[0].status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot reschedule a completed or cancelled appointment.' });
    }

    // Check new slot availability
    const [conflict] = await db.query(
      `SELECT id FROM appointments
       WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ?
       AND status NOT IN ('cancelled') AND id != ?`,
      [rows[0].doctor_id, appointment_date, time_slot, req.params.id]
    );
    if (conflict.length > 0) {
      return res.status(409).json({ error: 'Requested slot is not available.' });
    }

    await db.query(
      'UPDATE appointments SET appointment_date = ?, time_slot = ?, status = "pending" WHERE id = ?',
      [appointment_date, time_slot, req.params.id]
    );

    return res.json({ message: 'Appointment rescheduled.' });
  } catch (err) {
    console.error('rescheduleAppointment error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { bookAppointment, getMyAppointments, getAppointmentById, updateStatus, rescheduleAppointment };
