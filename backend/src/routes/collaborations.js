const express = require('express')
const router = express.Router()
const { v4: uuid } = require('uuid')
const { getDb } = require('../db')

router.get('/', (req, res) => {
  const db = getDb()
  const cols = db.prepare(`
    SELECT col.*, con.name as contact_name, con.email as contact_email, con.platform, con.followers,
      cam.name as campaign_name, cam.product as campaign_product
    FROM collaborations col
    JOIN contacts con ON col.contact_id=con.id
    LEFT JOIN campaigns cam ON col.campaign_id=cam.id
    ORDER BY col.updated_at DESC
  `).all()
  const result = cols.map(col => ({
    ...col,
    notes: db.prepare('SELECT * FROM collaboration_notes WHERE collaboration_id=? ORDER BY created_at ASC').all(col.id)
  }))
  res.json(result)
})

router.get('/:id', (req, res) => {
  const db = getDb()
  const col = db.prepare(`
    SELECT col.*, con.name as contact_name, con.email as contact_email, con.platform, con.followers,
      cam.name as campaign_name
    FROM collaborations col
    JOIN contacts con ON col.contact_id=con.id
    LEFT JOIN campaigns cam ON col.campaign_id=cam.id
    WHERE col.id=?
  `).get(req.params.id)
  if (!col) return res.status(404).json({ error: 'Not found' })
  const notes = db.prepare('SELECT * FROM collaboration_notes WHERE collaboration_id=? ORDER BY created_at ASC').all(col.id)
  res.json({ ...col, notes })
})

router.put('/:id', (req, res) => {
  const db = getDb()
  const { status, deal_value, product } = req.body
  db.prepare('UPDATE collaborations SET status=?,deal_value=?,product=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(status, deal_value || null, product || '', req.params.id)
  res.json(db.prepare('SELECT * FROM collaborations WHERE id=?').get(req.params.id))
})

router.post('/:id/notes', (req, res) => {
  const db = getDb()
  const { content } = req.body
  if (!content) return res.status(400).json({ error: 'content required' })
  const id = uuid()
  db.prepare('INSERT INTO collaboration_notes (id,collaboration_id,content) VALUES (?,?,?)').run(id, req.params.id, content)
  db.prepare('UPDATE collaborations SET updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.params.id)
  res.status(201).json(db.prepare('SELECT * FROM collaboration_notes WHERE id=?').get(id))
})

module.exports = router
