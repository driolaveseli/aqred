const express = require("express");
const router = express.Router();
const { submitContact } = require("../controllers/contactController");

// Public — no auth, the marketing site's contact form isn't behind a login
router.post("/", submitContact);

module.exports = router;
