const express = require('express')
const router = express.Router()
const { getDb } = require('../db')

router.get('/', (req, res) => {
  const db = getDb()
  const totalContacts = db.prepare('SELECT COUNT(*) as c FROM contacts').get().c
  const totalCampaigns = db.prepare("SELECT COUNT(*) as c FROM campaigns WHERE status='sent'").get().c
  const totalEmailsSent = db.prepare("SELECT COUNT(*) as c FROM emails WHERE status='sent'").get().c
  const totalEmailsFailed = db.prepare("SELECT COUNT(*) as c FROM emails WHERE status='failed'").get().c
  const totalEmailsPending = db.prepare("SELECT COUNT(*) as c FROM emails WHERE status='pending'").get().c
  const collaborationStats = db.prepare('SELECT status, COUNT(*) as count FROM collaborations GROUP BY status').all()
  const recentCampaigns = db.prepare(`
    SELECT c.*, t.name as template_name,
      COUNT(e.id) as total_emails,
      SUM(CASE WHEN e.status='sent' THEN 1 ELSE 0 END) as sent_count
    FROM campaigns c
    LEFT JOIN templates t ON c.template_id=t.id
    LEFT JOIN emails e ON c.id=e.campaign_id
    GROUP BY c.id ORDER BY c.created_at DESC LIMIT 5
  `).all()
  const topContacts = db.prepare(`
    SELECT con.name, con.platform, COUNT(col.id) as collab_count
    FROM contacts con
    LEFT JOIN collaborations col ON con.id=col.contact_id
    GROUP BY con.id ORDER BY collab_count DESC LIMIT 5
  `).all()
  res.json({ totalContacts, totalCampaigns, totalEmailsSent, totalEmailsFailed, totalEmailsPending, collaborationStats, recentCampaigns, topContacts })
})

module.exports = router
