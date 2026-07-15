require("dotenv").config();

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not set. Add it to backend/.env (see .env.example)."
  );
}

module.exports = process.env.JWT_SECRET;
