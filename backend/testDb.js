// testDb.js
const pool = require("./config/db");

pool.query("SELECT NOW()", (err, res) => {
  if (err) console.error("Gabim:", err);
  else console.log("Lidhja me DB OK:", res.rows);
  pool.end();
});
