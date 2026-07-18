// Sends a real email if SMTP is configured, otherwise logs it — same fallback
// used everywhere in this app so the flow is demonstrable without SMTP creds.
const sendMail = async ({ to, subject, html, fallbackLabel }) => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({ from: `"Aqred MIS" <${process.env.SMTP_USER}>`, to, subject, html });
  } else {
    console.log(`[${fallbackLabel}] To: ${to}\n${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}`);
  }
};

module.exports = { sendMail };
