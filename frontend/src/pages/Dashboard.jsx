import { useState, useEffect } from 'react'
import { api } from '../api'
import { Users, Send, Mail, TrendingUp, Clock } from 'lucide-react'

const STAGE_CONFIG = {
  contacted:   { label: 'Contacted',   color: 'bg-blue-100 text-blue-700' },
  replied:     { label: 'Replied',     color: 'bg-amber-100 text-amber-700' },
  negotiating: { label: 'Negotiating', color: 'bg-orange-100 text-orange-700' },
  deal_sent:   { label: 'Deal Sent',   color: 'bg-purple-100 text-purple-700' },
  confirmed:   { label: 'Confirmed',   color: 'bg-green-100 text-green-700' },
  completed:   { label: 'Completed',   color: 'bg-emerald-100 text-emerald-700' },
  rejected:    { label: 'Rejected',    color: 'bg-red-100 text-red-700' },
}

const STATUS_STYLE = {
  sent:    'bg-green-100 text-green-700',
  sending: 'bg-amber-100 text-amber-700',
  draft:   'bg-gray-100 text-gray-600',
}

function Stat({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${accent}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  if (!stats) return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
      Loading...
    </div>
  )

  const total = stats.totalEmailsSent + stats.totalEmailsFailed
  const successRate = total > 0 ? Math.round((stats.totalEmailsSent / total) * 100) : null

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Your influencer outreach at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        <Stat label="Total Contacts" value={stats.totalContacts} icon={Users} accent="bg-blue-50 text-blue-500" />
        <Stat label="Campaigns Sent" value={stats.totalCampaigns} icon={Send} accent="bg-violet-50 text-violet-500" />
        <Stat label="Emails Sent" value={stats.totalEmailsSent} sub={`${stats.totalEmailsFailed} failed`} icon={Mail} accent="bg-indigo-50 text-indigo-500" />
        <Stat
          label="Delivery Rate"
          value={successRate !== null ? `${successRate}%` : '—'}
          sub={total > 0 ? `${total} total sent` : 'No emails yet'}
          icon={TrendingUp}
          accent="bg-green-50 text-green-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Pipeline overview */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Pipeline Overview</h3>
          <div className="space-y-2.5">
            {Object.entries(STAGE_CONFIG).map(([key, cfg]) => {
              const stat = stats.collaborationStats.find(s => s.status === key)
              if (!stat) return null
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-sm font-semibold text-gray-700">{stat.count}</span>
                </div>
              )
            })}
            {stats.collaborationStats.length === 0 && (
              <p className="text-xs text-gray-400">No collaborations yet. Send your first campaign!</p>
            )}
          </div>
        </div>

        {/* Recent campaigns */}
        <div className="col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Recent Campaigns</h3>
          {stats.recentCampaigns.length === 0 ? (
            <p className="text-xs text-gray-400">No campaigns yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentCampaigns.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.template_name || 'No template'} · {fmtDate(c.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className="text-xs text-gray-500">{c.sent_count || 0}/{c.total_emails || 0} sent</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[c.status] || 'bg-gray-100 text-gray-600'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
