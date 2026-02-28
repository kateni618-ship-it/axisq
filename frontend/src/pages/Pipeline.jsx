import { useState, useEffect } from 'react'
import { api } from '../api'
import { X, DollarSign, Send, MessageSquare, ChevronRight } from 'lucide-react'

const STAGES = [
  { id: 'contacted',   label: 'Contacted',   color: 'border-blue-200',   dot: 'bg-blue-400',   bg: 'bg-blue-50/50' },
  { id: 'replied',     label: 'Replied',     color: 'border-amber-200',  dot: 'bg-amber-400',  bg: 'bg-amber-50/50' },
  { id: 'negotiating', label: 'Negotiating', color: 'border-orange-200', dot: 'bg-orange-400', bg: 'bg-orange-50/50' },
  { id: 'deal_sent',   label: 'Deal Sent',   color: 'border-violet-200', dot: 'bg-violet-400', bg: 'bg-violet-50/50' },
  { id: 'confirmed',   label: 'Confirmed',   color: 'border-green-200',  dot: 'bg-green-400',  bg: 'bg-green-50/50' },
  { id: 'completed',   label: 'Completed',   color: 'border-emerald-300',dot: 'bg-emerald-500',bg: 'bg-emerald-50/50' },
  { id: 'rejected',    label: 'Rejected',    color: 'border-red-200',    dot: 'bg-red-300',    bg: 'bg-red-50/30' },
]

const PLATFORM_COLORS = {
  Instagram: 'bg-pink-100 text-pink-700',
  YouTube: 'bg-red-100 text-red-700',
  TikTok: 'bg-gray-800 text-white',
  'Twitter/X': 'bg-sky-100 text-sky-700',
  LinkedIn: 'bg-blue-100 text-blue-700',
  Other: 'bg-gray-100 text-gray-600',
}

function fmtN(n) {
  if (!n) return null
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {children}
      </div>
    </div>
  )
}

export default function Pipeline() {
  const [collaborations, setCollaborations] = useState([])
  const [selected, setSelected] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editDeal, setEditDeal] = useState('')

  const load = () => api.get('/collaborations').then(r => setCollaborations(r.data))
  useEffect(() => { load() }, [])

  const openDetail = col => {
    setSelected(col)
    setEditStatus(col.status)
    setEditDeal(col.deal_value || '')
    setNoteText('')
  }

  const saveStatus = async () => {
    await api.put(`/collaborations/${selected.id}`, {
      status: editStatus,
      deal_value: parseFloat(editDeal) || null,
      product: selected.product,
    })
    load()
    // Update selected with new status
    setSelected(p => ({ ...p, status: editStatus, deal_value: parseFloat(editDeal) || null }))
  }

  const addNote = async e => {
    e.preventDefault()
    if (!noteText.trim()) return
    const res = await api.post(`/collaborations/${selected.id}/notes`, { content: noteText })
    setSelected(p => ({ ...p, notes: [...(p.notes || []), res.data] }))
    setNoteText('')
    load()
  }

  const byStage = stage => collaborations.filter(c => c.status === stage)

  const totalDealValue = collaborations
    .filter(c => c.status === 'confirmed' || c.status === 'completed')
    .reduce((sum, c) => sum + (c.deal_value || 0), 0)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pipeline</h1>
            <p className="text-gray-400 text-sm mt-0.5">{collaborations.length} active collaboration{collaborations.length !== 1 ? 's' : ''}</p>
          </div>
          {totalDealValue > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Confirmed deal value</p>
              <p className="text-xl font-bold text-green-600">${totalDealValue.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full" style={{ minWidth: `${STAGES.length * 220}px` }}>
          {STAGES.map(stage => {
            const cards = byStage(stage.id)
            return (
              <div key={stage.id} className="flex-shrink-0 w-52 flex flex-col">
                {/* Column header */}
                <div className={`flex items-center justify-between mb-3 px-1`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stage.dot}`} />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{stage.label}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center">
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className={`flex-1 rounded-xl border-2 ${stage.color} ${stage.bg} p-2 space-y-2 overflow-y-auto kanban-col`}>
                  {cards.map(col => (
                    <div key={col.id}
                      onClick={() => openDetail(col)}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all hover:border-indigo-200 group">
                      <div className="flex items-start justify-between mb-1.5">
                        <p className="text-xs font-semibold text-gray-900 leading-tight">{col.contact_name}</p>
                        <ChevronRight size={11} className="text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-0.5" />
                      </div>
                      {col.platform && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PLATFORM_COLORS[col.platform] || 'bg-gray-100 text-gray-600'}`}>
                          {col.platform}
                          {fmtN(col.followers) && ` · ${fmtN(col.followers)}`}
                        </span>
                      )}
                      {col.campaign_name && (
                        <p className="text-[10px] text-gray-400 mt-1.5 truncate">{col.campaign_name}</p>
                      )}
                      {col.deal_value && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <DollarSign size={10} className="text-green-500" />
                          <span className="text-[10px] font-semibold text-green-600">{col.deal_value.toLocaleString()}</span>
                        </div>
                      )}
                      {col.notes?.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <MessageSquare size={9} className="text-gray-300" />
                          <span className="text-[10px] text-gray-400">{col.notes.length}</span>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-300 mt-1.5">{fmtDate(col.updated_at)}</p>
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <div className="flex items-center justify-center h-16">
                      <p className="text-[11px] text-gray-300">Empty</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900">{selected.contact_name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selected.contact_email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 rounded p-1"><X size={18} /></button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Platform</p>
                  <p className="font-medium text-gray-800">{selected.platform || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Campaign</p>
                  <p className="font-medium text-gray-800 truncate">{selected.campaign_name || '—'}</p>
                </div>
              </div>

              {/* Status + Deal Value */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Update Status</p>
                <div className="flex gap-2">
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" value={editDeal} onChange={e => setEditDeal(e.target.value)} placeholder="Deal value"
                      className="pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-32 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <button onClick={saveStatus} className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 font-medium">
                    Save
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Notes</p>
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {(selected.notes || []).map(note => (
                    <div key={note.id} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-indigo-600">Y</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-gray-700">You</span>
                          <span className="text-[10px] text-gray-400">{fmtDate(note.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    </div>
                  ))}
                  {(!selected.notes || selected.notes.length === 0) && (
                    <p className="text-xs text-gray-400 text-center py-4">No notes yet. Add the first one!</p>
                  )}
                </div>
                <form onSubmit={addNote} className="flex gap-2">
                  <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <button type="submit" disabled={!noteText.trim()} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 text-sm font-medium">
                    <Send size={13} />
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
