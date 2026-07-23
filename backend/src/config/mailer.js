import nodemailer from "nodemailer";

import ENV from "./env.js";

const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: ENV.GMAIL_USER,
    pass: ENV.GMAIL_APP_PASSWORD,
  },
});

export default mailer;
