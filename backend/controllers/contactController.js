const ContactMessage = require("../models/contactModel");

const MAX_LEN = { name: 100, email: 254, company: 150, message: 5000 };

const submitContact = async (req, res) => {
  const firstName = (req.body.firstName || "").trim();
  const lastName  = (req.body.lastName  || "").trim();
  const email     = (req.body.email     || "").trim();
  const company   = (req.body.company   || "").trim();
  const message   = (req.body.message   || "").trim();

  if (!firstName || !lastName || !email || !message)
    return res.status(400).json({ error: "First name, last name, email, and message are required" });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "Please provide a valid email address" });

  if (
    firstName.length > MAX_LEN.name || lastName.length > MAX_LEN.name ||
    email.length > MAX_LEN.email || company.length > MAX_LEN.company ||
    message.length > MAX_LEN.message
  )
    return res.status(400).json({ error: "One or more fields exceed the maximum length" });

  try {
    await ContactMessage.create(firstName, lastName, email, company, message);
    res.status(201).json({ message: "Message received" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { submitContact };
