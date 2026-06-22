const db = require("../config/db");

// GET /api/notifications
// Returns the 50 most recent notifications for the user's company,
// with a per-user `is_read` flag derived from notification_reads.
const getNotifications = async (req, res) => {
  try {
    const { company_id, id: userId } = req.user;
    if (!company_id) return res.json([]); // super_admin has no company

    const result = await db.query(
      `SELECT n.*,
              CASE WHEN nr.user_id IS NOT NULL THEN true ELSE false END AS is_read
       FROM notifications n
       LEFT JOIN notification_reads nr
              ON nr.notification_id = n.id AND nr.user_id = $2
       WHERE n.company_id = $1
       ORDER BY is_read ASC, n.created_at DESC
       LIMIT 50`,
      [company_id, userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    const { id: userId } = req.user;
    await db.query(
      `INSERT INTO notification_reads (notification_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.params.id, userId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    const { company_id, id: userId } = req.user;
    if (!company_id) return res.json({ ok: true });

    await db.query(
      `INSERT INTO notification_reads (notification_id, user_id)
       SELECT n.id, $2 FROM notifications n
       WHERE n.company_id = $1
       ON CONFLICT DO NOTHING`,
      [company_id, userId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getNotifications, markRead, markAllRead };
