const db = require('../config/db');

exports.getAllDoctors = async (req, res) => {
  try {
    const { specialty, gender, available } = req.query;

    // IMPORTANT: avoid LEFT JOIN availability unless needed.
    // LEFT JOIN + DISTINCT can explode in size if availability has many rows per doctor,
    // making /api/doctors appear to hang (frontend stuck on loading).
    const shouldFilterByAvailability = available === 'true';

    let query;
    const values = [];

    if (!shouldFilterByAvailability) {
      query = `
        SELECT DISTINCT
          d.id,
          d.user_id,
          d.specialty,
          d.experience_years,
          d.fee,
          d.gender,
          d.hospital,
          d.bio,
          u.avatar_url,
          u.full_name,
          u.email,
          u.phone
        FROM doctors d
        JOIN users u
          ON d.user_id = u.id
        WHERE d.status = 'active'
      `;

      if (specialty) {
        query += ' AND d.specialty = ?';
        values.push(specialty);
      }

      if (gender) {
        query += ' AND d.gender = ?';
        values.push(gender);
      }
    } else {
      // Filter doctors that have at least one availability row.
      query = `
        SELECT DISTINCT
          d.id,
          d.user_id,
          d.specialty,
          d.experience_years,
          d.fee,
          d.gender,
          d.hospital,
          d.bio,
          u.avatar_url,
          u.full_name,
          u.email,
          u.phone
        FROM doctors d
        JOIN users u
          ON d.user_id = u.id
        WHERE d.status = 'active'
          AND EXISTS (
            SELECT 1
            FROM availability a
            WHERE a.doctor_id = d.id
          )
      `;

      if (specialty) {
        query += ' AND d.specialty = ?';
        values.push(specialty);
      }

      if (gender) {
        query += ' AND d.gender = ?';
        values.push(gender);
      }
    }

    const [doctors] = await db.query(query, values);
    res.json(doctors);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const [doctor] = await db.query(
      `
      SELECT
        d.*, 
        u.full_name,
        u.avatar_url,
        u.email,
        u.phone
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
        AND d.status = 'active'
    `,
      [req.params.id]
    );

    if (doctor.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyDoctorProfile = async (req, res) => {
  try {
    const [doctor] = await db.query(
      `
      SELECT
        d.*,
        u.full_name,
        u.avatar_url,
        u.email,
        u.phone
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.user_id = ?
    `,
      [req.user.id]
    );

    if (doctor.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json(doctor[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date query parameter is required' });
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCode = shortDays[parsedDate.getDay()];

    const [slots] = await db.query(
      `
      SELECT *
      FROM availability
      WHERE doctor_id = ?
        AND day_of_week = ?
      ORDER BY time_slot ASC
    `,
      [doctorId, dayCode]
    );

    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addDoctor = async (req, res) => {
  try {
    const {
      user_id,
      specialty,
      experience_years,
      fee,
      gender,
      hospital,
      bio
    } = req.body;

    const [result] = await db.query(
      `
      INSERT INTO doctors
      (
        user_id,
        specialty,
        experience_years,
        fee,
        gender,
        hospital,
        bio
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [user_id, specialty, experience_years, fee, gender, hospital, bio]
    );

    res.status(201).json({
      message: 'Doctor added successfully',
      id: result.insertId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const {
      specialty,
      experience_years,
      fee,
      gender,
      hospital,
      bio
    } = req.body;

    await db.query(
      `
      UPDATE doctors
      SET
        specialty = ?,
        experience_years = ?,
        fee = ?,
        gender = ?,
        hospital = ?,
        bio = ?
      WHERE id = ?
    `,
      [
        specialty,
        experience_years,
        fee,
        gender,
        hospital,
        bio,
        req.params.id
      ]
    );

    res.json({ message: 'Doctor updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    await db.query('DELETE FROM doctors WHERE id = ?', [req.params.id]);
    res.json({ message: 'Doctor deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
