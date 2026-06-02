const db = require('../config/db');
exports.getSlots = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const { date } = req.query;

    let query = `
      SELECT *
      FROM availability
      WHERE doctor_id = ?
    `;

    const values = [doctorId];

    if (date) {
        // Parse YYYY-MM-DD as a local date to avoid timezone shifts.
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

        const shortDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const dayCode = shortDays[parsedDate.getDay()];

        query += ' AND day_of_week = ?';
        values.push(dayCode);
    }

    query += `
      ORDER BY FIELD(
        day_of_week,
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
        'Sun'
      ),
      time_slot ASC
    `;

    const [slots] = await db.query(query, values);

    res.json(slots);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.addSlot = async (req, res) => {
  try {
    const { doctor_id, day_of_week, time_slot } = req.body;

    const [result] = await db.query(
      `
      INSERT INTO availability
      (doctor_id, day_of_week, time_slot)
      VALUES (?, ?, ?)
      `,
      [doctor_id, day_of_week, time_slot]
    );

    res.status(201).json({
      message: 'Slot added successfully',
      id: result.insertId
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.deleteSlot = async (req, res) => {
  try {
    const slotId = req.params.id;

    await db.query(
      `
      DELETE FROM availability
      WHERE id = ?
      `,
      [slotId]
    );

    res.json({
      message: 'Slot deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};