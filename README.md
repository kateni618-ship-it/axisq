# axisq

Helps dev/creator/business via batch email outreaching to influencers.

## Features

- **Batch Email Campaigns** — Create campaigns, select influencer contacts, send in bulk
- **Contact Management** — Manage influencers with platform, followers, niche, and tags; CSV import
- **Email Templates** — HTML templates with variable substitution (`{{name}}`, `{{product}}`, etc.)
- **Collaboration Pipeline** — Kanban board tracking deals from Contacted → Completed
- **Dashboard** — Real-time stats on emails sent, delivery rate, pipeline overview
- **SMTP / Simulation** — Plug in your SMTP or run in simulation mode for testing

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS (Slack-inspired dark sidebar UI)
- **Backend**: Node.js + Express
- **Database**: SQLite (via better-sqlite3, auto-created on first run)
- **Email**: Nodemailer

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Start dev servers (backend :3001, frontend :3000)
npm run dev
```

Then open http://localhost:3000

## Project Structure

```
axisq/
├── backend/          # Express API + SQLite
│   └── src/
│       ├── db.js           # Schema + DB setup
│       ├── index.js        # Express server
│       ├── routes/         # contacts, templates, campaigns, collaborations, stats, settings
│       └── services/
│           └── emailService.js
├── frontend/         # React app
│   └── src/
│       ├── pages/    # Dashboard, Contacts, Campaigns, Templates, Pipeline, Settings
│       └── components/
│           └── Sidebar.jsx
└── data/             # SQLite database (auto-created)
```

## Email Variables

Templates support these variables:
- `{{name}}` — Contact name
- `{{email}}` — Contact email
- `{{product}}` — Campaign product
- `{{platform}}` — Contact platform

## SMTP Setup

Configure in Settings page, or leave empty to use simulation mode.
