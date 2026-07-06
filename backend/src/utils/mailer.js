const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

const isConfigured = () => Boolean(env.mail.host && env.mail.user && env.mail.password);

const getTransporter = () => {
  if (!isConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth: { user: env.mail.user, pass: env.mail.password }
    });
  }

  return transporter;
};

const sendReportEmail = async ({ to, subject, text, attachment }) => {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    throw new Error('Email is not configured (missing SMTP_HOST, SMTP_USER or SMTP_PASSWORD)');
  }

  await mailTransporter.sendMail({
    from: env.mail.from,
    to: Array.isArray(to) ? to.join(',') : to,
    subject,
    text,
    attachments: [
      {
        filename: attachment.filename,
        content: attachment.buffer,
        contentType: attachment.contentType
      }
    ]
  });
};

module.exports = {
  isConfigured,
  sendReportEmail
};
