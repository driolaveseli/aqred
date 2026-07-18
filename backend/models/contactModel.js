const pool = require("../config/db");

const ContactMessage = {
  create: (firstName, lastName, email, company, message) =>
    pool.query(
      `INSERT INTO contact_messages (first_name, last_name, email, company, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [firstName, lastName, email, company || null, message]
    ),

  getAll: () =>
    pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC"),

  markRead: (id) =>
    pool.query(
      "UPDATE contact_messages SET status = 'read' WHERE id = $1 RETURNING *",
      [id]
    ),

  getById: (id) =>
    pool.query("SELECT * FROM contact_messages WHERE id = $1", [id]),

  reply: (id, replyMessage, repliedByName) =>
    pool.query(
      `UPDATE contact_messages
       SET status = 'replied', reply_message = $1, replied_at = NOW(), replied_by_name = $2
       WHERE id = $3 RETURNING *`,
      [replyMessage, repliedByName, id]
    ),

  delete: (id) =>
    pool.query("DELETE FROM contact_messages WHERE id = $1 RETURNING *", [id]),
};

module.exports = ContactMessage;
