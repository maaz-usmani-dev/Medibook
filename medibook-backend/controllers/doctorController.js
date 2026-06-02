const db = require('../config/db');

exports.getAllDoctors = async (req, res) => {
  try {
    const {
      specialty,
      gender,
      available,
      q,
      city,
      page = 1,
      limit = 12,
    } = req.query;
    const shouldFilterByAvailability = available === 'true';
    const values = [];

    let whereClause = `
      WHERE d.status = 'active'
    `;

    if (specialty) {
      whereClause += ' AND d.specialty = ?';
      values.push(specialty);
    }

    if (gender) {
      whereClause += ' AND d.gender = ?';
      values.push(gender);
    }

    if (city) {
      whereClause += ' AND d.hospital LIKE ?';
      values.push(`%${city}%`);
    }

    if (q) {
      whereClause += ' AND (u.full_name LIKE ? OR d.specialty LIKE ? OR d.hospital LIKE ? OR d.bio LIKE ?)';
      const searchToken = `%${q}%`;
      values.push(searchToken, searchToken, searchToken, searchToken);
    }

    if (shouldFilterByAvailability) {
      whereClause += `
        AND EXISTS (
          SELECT 1
          FROM availability a
          WHERE a.doctor_id = d.id
        )
      `;
    }

    const countQuery = `
      SELECT COUNT(DISTINCT d.id) AS total
      FROM doctors d
      JOIN users u
        ON d.user_id = u.id
      ${whereClause}
    `;

    const [[{ total }]] = await db.query(countQuery, values);

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.max(Number(limit) || 12, 1);
    const offset = (pageNumber - 1) * pageSize;

    const query = `
      SELECT DISTINCT
        d.id,
        d.user_id,
        d.specialty,
        d.experience_years,
        d.fee,
        d.gender,
        d.hospital,
        d.bio,
        d.rating,
        d.review_count,
        u.avatar_url,
        u.full_name,
        u.email,
        u.phone
      FROM doctors d
      JOIN users u
        ON d.user_id = u.id
      ${whereClause}
      ORDER BY d.review_count DESC, d.rating DESC, d.experience_years DESC
      LIMIT ?
      OFFSET ?
    `;

    const [doctors] = await db.query(query, [...values, pageSize, offset]);

    res.json({
      doctors,
      total,
      page: pageNumber,
      limit: pageSize,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
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

    // Parse YYYY-MM-DD as a local date to avoid timezone shifts that
    // can change the day when using `new Date(date)` with a bare ISO string.
    let parsedDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split('-').map(n => parseInt(n, 10));
      parsedDate = new Date(y, m - 1, d);
    } else {
      parsedDate = new Date(date);
    }

    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCode = shortDays[parsedDate.getDay()];

    // Small debug aid when troubleshooting availability issues
    // (can be removed later).
    console.debug(`getDoctorAvailability: doctor=${doctorId} date=${date} day=${dayCode}`);

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
