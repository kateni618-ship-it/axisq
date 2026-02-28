const express = require('express')
const router = express.Router()
const { getDb } = require('../db')

router.get('/', (req, res) => {
  const db = getDb()
  const rows = db.prepare('SELECT key, value FROM settings').all()
  const result = {}
  rows.forEach(r => {
    result[r.key] = r.key === 'smtp_password' && r.value ? '***' : r.value
  })
  res.json(result)
})

router.post('/', (req, res) => {
  const db = getDb()
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
  Object.entries(req.body).forEach(([k, v]) => {
    if (k === 'smtp_password' && v === '***') return
    upsert.run(k, v)
  })
  res.json({ success: true })
})

module.exports = router
