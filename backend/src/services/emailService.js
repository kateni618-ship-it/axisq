const nodemailer = require('nodemailer')
const { getDb } = require('../db')

function getSmtpSettings() {
  const db = getDb()
  const rows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'smtp_%'").all()
  const s = {}
  rows.forEach(r => { s[r.key.replace('smtp_', '')] = r.value })
  return s
}

async function sendEmail({ to, subject, body, from }) {
  const smtp = getSmtpSettings()

  if (!smtp.host || !smtp.user) {
    // Simulate sending when SMTP not configured
    await new Promise(r => setTimeout(r, 80))
    return { success: true, simulated: true }
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: parseInt(smtp.port) || 587,
    secure: smtp.port === '465',
    auth: { user: smtp.user, pass: smtp.password },
  })

  await transporter.sendMail({
    from: from || smtp.from || smtp.user,
    to,
    subject,
    html: body,
  })

  return { success: true }
}

module.exports = { sendEmail }
