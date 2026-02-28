const express = require('express')
const router = express.Router()
const { v4: uuid } = require('uuid')
const { getDb } = require('../db')

router.get('/', (req, res) => {
  const db = getDb()
  const { search, platform } = req.query
  let q = 'SELECT * FROM contacts WHERE 1=1'
  const p = []
  if (search) { q += ' AND (name LIKE ? OR email LIKE ?)'; p.push(`%${search}%`, `%${search}%`) }
  if (platform) { q += ' AND platform = ?'; p.push(platform) }
  q += ' ORDER BY created_at DESC'
  const rows = db.prepare(q).all(...p)
  res.json(rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') })))
})

router.get('/:id', (req, res) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json({ ...row, tags: JSON.parse(row.tags || '[]') })
})

router.post('/', (req, res) => {
  const db = getDb()
  const { name, email, platform, followers, niche, tags, notes } = req.body
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' })
  const id = uuid()
  db.prepare('INSERT INTO contacts (id,name,email,platform,followers,niche,tags,notes) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, name, email, platform || '', parseInt(followers) || 0, niche || '', JSON.stringify(tags || []), notes || '')
  const row = db.prepare('SELECT * FROM contacts WHERE id=?').get(id)
  res.status(201).json({ ...row, tags: JSON.parse(row.tags || '[]') })
})

router.put('/:id', (req, res) => {
  const db = getDb()
  const { name, email, platform, followers, niche, tags, notes } = req.body
  db.prepare('UPDATE contacts SET name=?,email=?,platform=?,followers=?,niche=?,tags=?,notes=? WHERE id=?')
    .run(name, email, platform || '', parseInt(followers) || 0, niche || '', JSON.stringify(tags || []), notes || '', req.params.id)
  const row = db.prepare('SELECT * FROM contacts WHERE id=?').get(req.params.id)
  res.json({ ...row, tags: JSON.parse(row.tags || '[]') })
})

router.delete('/:id', (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM contacts WHERE id=?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
