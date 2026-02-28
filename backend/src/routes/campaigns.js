const express = require('express')
const router = express.Router()
const { v4: uuid } = require('uuid')
const { getDb } = require('../db')
const { sendEmail } = require('../services/emailService')

router.get('/', (req, res) => {
  const db = getDb()
  const rows = db.prepare(`
    SELECT c.*, t.name as template_name,
      COUNT(e.id) as total_emails,
      SUM(CASE WHEN e.status='sent' THEN 1 ELSE 0 END) as sent_count,
      SUM(CASE WHEN e.status='failed' THEN 1 ELSE 0 END) as failed_count
    FROM campaigns c
    LEFT JOIN templates t ON c.template_id = t.id
    LEFT JOIN emails e ON c.id = e.campaign_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all()
  res.json(rows)
})

router.get('/:id', (req, res) => {
  const db = getDb()
  const campaign = db.prepare(`
    SELECT c.*, t.name as template_name, t.subject, t.body
    FROM campaigns c LEFT JOIN templates t ON c.template_id = t.id
    WHERE c.id=?
  `).get(req.params.id)
  if (!campaign) return res.status(404).json({ error: 'Not found' })
  const emails = db.prepare(`
    SELECT e.*, con.name as contact_name, con.email as contact_email, con.platform
    FROM emails e JOIN contacts con ON e.contact_id = con.id
    WHERE e.campaign_id=?
  `).all(req.params.id)
  res.json({ ...campaign, emails })
})

router.post('/', (req, res) => {
  const db = getDb()
  const { name, template_id, product, contact_ids } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  const id = uuid()
  db.prepare('INSERT INTO campaigns (id,name,template_id,product) VALUES (?,?,?,?)')
    .run(id, name, template_id || null, product || '')
  if (contact_ids && contact_ids.length > 0) {
    const ins = db.prepare('INSERT INTO emails (id,campaign_id,contact_id,status) VALUES (?,?,?,?)')
    contact_ids.forEach(cid => ins.run(uuid(), id, cid, 'pending'))
  }
  res.status(201).json(db.prepare('SELECT * FROM campaigns WHERE id=?').get(id))
})

router.post('/:id/contacts', (req, res) => {
  const db = getDb()
  const { contact_ids } = req.body
  if (!contact_ids || !contact_ids.length) return res.status(400).json({ error: 'contact_ids required' })
  const ins = db.prepare('INSERT OR IGNORE INTO emails (id,campaign_id,contact_id,status) VALUES (?,?,?,?)')
  contact_ids.forEach(cid => ins.run(uuid(), req.params.id, cid, 'pending'))
  res.json({ success: true })
})

router.delete('/:id/contacts/:contactId', (req, res) => {
  const db = getDb()
  db.prepare("DELETE FROM emails WHERE campaign_id=? AND contact_id=? AND status='pending'")
    .run(req.params.id, req.params.contactId)
  res.json({ success: true })
})

router.post('/:id/send', async (req, res) => {
  const db = getDb()
  const campaign = db.prepare(`
    SELECT c.*, t.subject, t.body
    FROM campaigns c LEFT JOIN templates t ON c.template_id=t.id
    WHERE c.id=?
  `).get(req.params.id)
  if (!campaign) return res.status(404).json({ error: 'Not found' })
  if (campaign.status === 'sent') return res.status(400).json({ error: 'Already sent' })

  db.prepare("UPDATE campaigns SET status='sending' WHERE id=?").run(campaign.id)
  res.json({ success: true, message: 'Sending started' })

  // Background send
  const emails = db.prepare(`
    SELECT e.*, con.name as contact_name, con.email as contact_email
    FROM emails e JOIN contacts con ON e.contact_id=con.id
    WHERE e.campaign_id=? AND e.status='pending'
  `).all(campaign.id)

  let sent = 0, failed = 0
  for (const em of emails) {
    try {
      const subject = (campaign.subject || '').replace(/\{\{name\}\}/g, em.contact_name).replace(/\{\{product\}\}/g, campaign.product || 'our product')
      const body = (campaign.body || '').replace(/\{\{name\}\}/g, em.contact_name).replace(/\{\{product\}\}/g, campaign.product || 'our product')
      await sendEmail({ to: em.contact_email, subject, body })
      db.prepare("UPDATE emails SET status='sent', sent_at=CURRENT_TIMESTAMP WHERE id=?").run(em.id)
      sent++
      // Auto-create collaboration
      const exists = db.prepare('SELECT id FROM collaborations WHERE contact_id=? AND campaign_id=?').get(em.contact_id, campaign.id)
      if (!exists) {
        db.prepare('INSERT INTO collaborations (id,contact_id,campaign_id,product) VALUES (?,?,?,?)')
          .run(uuid(), em.contact_id, campaign.id, campaign.product || '')
      }
    } catch (err) {
      db.prepare("UPDATE emails SET status='failed', error=? WHERE id=?").run(err.message, em.id)
      failed++
    }
    await new Promise(r => setTimeout(r, 150))
  }

  db.prepare("UPDATE campaigns SET status='sent', sent_at=CURRENT_TIMESTAMP, total_sent=?, total_failed=? WHERE id=?")
    .run(sent, failed, campaign.id)
})

router.put('/:id', (req, res) => {
  const db = getDb()
  const { name, template_id, product } = req.body
  db.prepare('UPDATE campaigns SET name=?,template_id=?,product=? WHERE id=?')
    .run(name, template_id || null, product || '', req.params.id)
  res.json(db.prepare('SELECT * FROM campaigns WHERE id=?').get(req.params.id))
})

router.delete('/:id', (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM emails WHERE campaign_id=?').run(req.params.id)
  db.prepare('DELETE FROM campaigns WHERE id=?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
