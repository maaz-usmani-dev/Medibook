const db = require('../config/db');

exports.getReviews = async (req, res) => {
  try {
    const { doctor_id } = req.query;
    let query = `
      SELECT
        r.id,
        r.doctor_id,
        r.rating,
        r.text,
        r.created_at,
        u.id AS user_id,
        u.full_name,
        u.avatar_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
    `;
    const values = [];

    if (doctor_id) {
      query += ' WHERE r.doctor_id = ?';
      values.push(doctor_id);
    } else {
      query += ' WHERE r.doctor_id IS NULL';
    }

    query += ' ORDER BY r.created_at DESC LIMIT 12';

    const [reviews] = await db.query(query, values);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { doctor_id, rating, text } = req.body;
    const normalizedRating = Number(rating);

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Review text is required.' });
    }

    if (!normalizedRating || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const [insertResult] = await db.query(
      `INSERT INTO reviews (user_id, doctor_id, rating, text) VALUES (?, ?, ?, ?)`,
      [userId, doctor_id || null, normalizedRating, text.trim()]
    );

    if (doctor_id) {
      const [[doctor]] = await db.query(
        `SELECT rating, review_count FROM doctors WHERE id = ?`,
        [doctor_id]
      );

      if (doctor) {
        const existingCount = doctor.review_count || 0;
        const existingRating = Number(doctor.rating) || 0;
        const newCount = existingCount + 1;
        const newRating = ((existingRating * existingCount) + normalizedRating) / newCount;

        await db.query(
          `UPDATE doctors SET rating = ?, review_count = ? WHERE id = ?`,
          [newRating.toFixed(1), newCount, doctor_id]
        );
      }
    }

    const [createdReview] = await db.query(
      `
      SELECT
        r.id,
        r.doctor_id,
        r.rating,
        r.text,
        r.created_at,
        u.id AS user_id,
        u.full_name,
        u.avatar_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
      `,
      [insertResult.insertId]
    );

    res.status(201).json(createdReview[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
