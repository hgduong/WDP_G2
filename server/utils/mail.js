const nodemailer = require("nodemailer");

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const sendMail = async (mailOptions) => {
  const transporter = createTransporter();
  return transporter.sendMail({
    from: process.env.SMTP_USER,
    ...mailOptions,
  });
};

module.exports = {
  sendMail,
};
