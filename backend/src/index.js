const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/contacts', require('./routes/contacts'))
app.use('/api/templates', require('./routes/templates'))
app.use('/api/campaigns', require('./routes/campaigns'))
app.use('/api/collaborations', require('./routes/collaborations'))
app.use('/api/stats', require('./routes/stats'))
app.use('/api/settings', require('./routes/settings'))

app.get('/api/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Axisq backend running on http://localhost:${PORT}`)
})
