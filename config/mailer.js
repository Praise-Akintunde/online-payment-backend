// mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

function sendResetEmail(to, code) {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject: 'Password Reset Code',
    text: `Your reset code is: ${code}`
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { transporter, sendResetEmail };
