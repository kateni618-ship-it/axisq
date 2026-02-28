const express = require('express')
const router = express.Router()
const { v4: uuid } = require('uuid')
const { getDb } = require('../db')

router.get('/', (req, res) => {
  const db = getDb()
  res.json(db.prepare('SELECT * FROM templates ORDER BY created_at DESC').all())
})

router.get('/:id', (req, res) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM templates WHERE id=?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(row)
})

router.post('/', (req, res) => {
  const db = getDb()
  const { name, subject, body } = req.body
  if (!name || !subject || !body) return res.status(400).json({ error: 'name, subject, body required' })
  const id = uuid()
  db.prepare('INSERT INTO templates (id,name,subject,body) VALUES (?,?,?,?)').run(id, name, subject, body)
  res.status(201).json(db.prepare('SELECT * FROM templates WHERE id=?').get(id))
})

router.put('/:id', (req, res) => {
  const db = getDb()
  const { name, subject, body } = req.body
  db.prepare('UPDATE templates SET name=?,subject=?,body=? WHERE id=?').run(name, subject, body, req.params.id)
  res.json(db.prepare('SELECT * FROM templates WHERE id=?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM templates WHERE id=?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
