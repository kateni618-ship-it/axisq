import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { Plus, Send, X, ChevronRight, Users, RefreshCw, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react'

function Modal({ open, onClose, title, wide, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-xl shadow-2xl max-h-[92vh] flex flex-col ${wide ? 'w-full max-w-2xl' : 'w-full max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded p-1"><X size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

const STATUS_CONFIG = {
  draft:   { label: 'Draft',   color: 'bg-gray-100 text-gray-600' },
  sending: { label: 'Sending', color: 'bg-amber-100 text-amber-700' },
  sent:    { label: 'Sent',    color: 'bg-green-100 text-green-700' },
}

const EMAIL_STATUS_ICON = {
  sent:    <CheckCircle size={13} className="text-green-500" />,
  failed:  <AlertCircle size={13} className="text-red-400" />,
  pending: <Clock size={13} className="text-gray-300" />,
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtN(n) {
  if (!n) return '—'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [templates, setTemplates] = useState([])
  const [contacts, setContacts] = useState([])
  const [modal, setModal] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ name: '', template_id: '', product: '' })
  const [contactSearch, setContactSearch] = useState('')
  const [selectedContacts, setSelectedContacts] = useState([])
  const [addingContacts, setAddingContacts] = useState(false)
  const [sending, setSending] = useState(false)
  const pollRef = useRef(null)

  const load = () => api.get('/campaigns').then(r => setCampaigns(r.data))
  const loadDetail = id => api.get(`/campaigns/${id}`).then(r => setDetail(r.data))

  useEffect(() => {
    load()
    api.get('/templates').then(r => setTemplates(r.data))
    api.get('/contacts').then(r => setContacts(r.data))
  }, [])

  useEffect(() => {
    if (detailId) loadDetail(detailId)
    return () => clearInterval(pollRef.current)
  }, [detailId])

  const openDetail = id => { setDetailId(id); setAddingContacts(false); setContactSearch('') }
  const closeDetail = () => { setDetailId(null); setDetail(null); clearInterval(pollRef.current) }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const createCampaign = async e => {
    e.preventDefault()
    await api.post('/campaigns', form)
    setModal(false); setForm({ name: '', template_id: '', product: '' }); load()
  }

  const toggleContact = id => {
    setSelectedContacts(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  const addContacts = async () => {
    if (!selectedContacts.length) return
    await api.post(`/campaigns/${detailId}/contacts`, { contact_ids: selectedContacts })
    setSelectedContacts([]); setAddingContacts(false); loadDetail(detailId)
  }

  const sendCampaign = async () => {
    setSending(true)
    await api.post(`/campaigns/${detailId}/send`)
    load()
    // Poll for completion
    pollRef.current = setInterval(async () => {
      const r = await api.get(`/campaigns/${detailId}`)
      setDetail(r.data)
      if (r.data.status === 'sent') {
        clearInterval(pollRef.current)
        setSending(false)
        load()
      }
    }, 2000)
  }

  const deleteCampaign = async id => {
    if (!confirm('Delete this campaign?')) return
    await api.delete(`/campaigns/${id}`)
    load()
  }

  // Contacts not yet in campaign
  const availableContacts = contacts.filter(c => {
    if (!detail) return true
    const inCampaign = detail.emails?.some(e => e.contact_id === c.id)
    if (inCampaign) return false
    if (contactSearch) return c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.email.toLowerCase().includes(contactSearch.toLowerCase())
    return true
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campaigns</h1>
          <p className="text-gray-400 text-sm mt-0.5">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus size={14} /> New Campaign
        </button>
      </div>

      <div className="space-y-3">
        {campaigns.map(c => {
          const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft
          const pct = c.total_emails > 0 ? Math.round((c.sent_count / c.total_emails) * 100) : 0
          return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                    {c.status === 'sending' && <RefreshCw size={12} className="text-amber-500 animate-spin" />}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Template: {c.template_name || '—'}</span>
                    {c.product && <span>Product: {c.product}</span>}
                    <span>Created {fmtDate(c.created_at)}</span>
                  </div>
                  {c.total_emails > 0 && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-xs">
                        <div className="bg-indigo-500 rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{c.sent_count || 0}/{c.total_emails} sent</span>
                      {(c.failed_count > 0) && <span className="text-xs text-red-400">{c.failed_count} failed</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button onClick={() => openDetail(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 font-medium">
                    <Users size={12} /> Manage
                  </button>
                  <button onClick={() => deleteCampaign(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {campaigns.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">No campaigns yet. Create your first one!</div>
        )}
      </div>

      {/* Create Campaign Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Campaign">
        <form onSubmit={createCampaign} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Campaign Name *</label>
            <input required value={form.name} onChange={f('name')} placeholder="e.g. Summer Glow Launch"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email Template</label>
            <select value={form.template_id} onChange={f('template_id')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-700">
              <option value="">Select template...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Product / Brand</label>
            <input value={form.product} onChange={f('product')} placeholder="e.g. Glow Face Serum"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Create Campaign</button>
          </div>
        </form>
      </Modal>

      {/* Campaign Detail Modal */}
      <Modal open={!!detailId && !!detail} onClose={closeDetail} title={detail?.name || ''} wide>
        {detail && (
          <div>
            {/* Meta */}
            <div className="flex items-center gap-4 mb-5 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              <span>Template: <strong className="text-gray-700">{detail.template_name || '—'}</strong></span>
              {detail.product && <span>Product: <strong className="text-gray-700">{detail.product}</strong></span>}
              <span className={`ml-auto px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[detail.status]?.color || ''}`}>
                {STATUS_CONFIG[detail.status]?.label || detail.status}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mb-5">
              {detail.status === 'draft' && (
                <>
                  <button onClick={() => setAddingContacts(!addingContacts)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 font-medium">
                    <Users size={13} /> Add Contacts
                  </button>
                  <button
                    disabled={!detail.emails?.length || sending}
                    onClick={sendCampaign}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                    <Send size={13} /> Send Campaign
                  </button>
                </>
              )}
              {detail.status === 'sending' && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <RefreshCw size={14} className="animate-spin" /> Sending emails...
                </div>
              )}
            </div>

            {/* Add contacts panel */}
            {addingContacts && (
              <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-4 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">Select contacts to add</p>
                  <button onClick={addContacts} disabled={!selectedContacts.length}
                    className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 font-medium">
                    Add {selectedContacts.length > 0 ? `(${selectedContacts.length})` : ''}
                  </button>
                </div>
                <input value={contactSearch} onChange={e => setContactSearch(e.target.value)} placeholder="Search contacts..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {availableContacts.map(c => (
                    <label key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white cursor-pointer">
                      <input type="checkbox" checked={selectedContacts.includes(c.id)} onChange={() => toggleContact(c.id)}
                        className="rounded border-gray-300 text-indigo-600" />
                      <span className="text-sm text-gray-800">{c.name}</span>
                      <span className="text-xs text-gray-400">{c.email}</span>
                      {c.platform && <span className="text-xs text-gray-400 ml-auto">{c.platform} · {fmtN(c.followers)}</span>}
                    </label>
                  ))}
                  {availableContacts.length === 0 && <p className="text-xs text-gray-400 text-center py-3">No more contacts to add</p>}
                </div>
              </div>
            )}

            {/* Email list */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Recipients ({detail.emails?.length || 0})
                </p>
              </div>
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {(detail.emails || []).map(em => (
                  <div key={em.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{em.contact_name}</p>
                      <p className="text-xs text-gray-400">{em.contact_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {em.status === 'sent' && <span className="text-xs text-gray-400">{fmtDate(em.sent_at)}</span>}
                      {em.error && <span className="text-xs text-red-400 truncate max-w-32" title={em.error}>Error</span>}
                      <div className="flex items-center gap-1">
                        {EMAIL_STATUS_ICON[em.status]}
                        <span className="text-xs text-gray-500 capitalize">{em.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!detail.emails || detail.emails.length === 0) && (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    No recipients yet. Add contacts to this campaign.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
