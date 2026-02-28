import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { UserPlus, Search, Edit2, Trash2, Upload, X } from 'lucide-react'

const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'Twitter/X', 'LinkedIn', 'Facebook', 'Pinterest', 'Twitch', 'Other']
const NICHES = ['Fashion', 'Beauty', 'Tech', 'Gaming', 'Food', 'Travel', 'Fitness', 'Lifestyle', 'Business', 'Education', 'Entertainment', 'Other']

const PLATFORM_COLORS = {
  Instagram: 'bg-pink-100 text-pink-700',
  YouTube: 'bg-red-100 text-red-700',
  TikTok: 'bg-gray-800 text-white',
  'Twitter/X': 'bg-sky-100 text-sky-700',
  LinkedIn: 'bg-blue-100 text-blue-700',
  Facebook: 'bg-indigo-100 text-indigo-700',
  Pinterest: 'bg-rose-100 text-rose-700',
  Twitch: 'bg-purple-100 text-purple-700',
  Other: 'bg-gray-100 text-gray-600',
}

function fmtN(n) {
  if (!n) return '—'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded p-1"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

const EMPTY = { name: '', email: '', platform: '', followers: '', niche: '', tags: [], notes: '' }

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [tagInput, setTagInput] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const fileRef = useRef()

  const load = () => {
    const params = {}
    if (search) params.search = search
    if (filterPlatform) params.platform = filterPlatform
    api.get('/contacts', { params }).then(r => setContacts(r.data))
  }

  useEffect(() => { load() }, [search, filterPlatform])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setTagInput(''); setModal(true) }
  const openEdit = c => {
    setEditing(c)
    setForm({ name: c.name, email: c.email, platform: c.platform || '', followers: c.followers || '', niche: c.niche || '', tags: c.tags || [], notes: c.notes || '' })
    setTagInput('')
    setModal(true)
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) { setForm(p => ({ ...p, tags: [...p.tags, t] })); setTagInput('') }
  }

  const submit = async e => {
    e.preventDefault()
    const data = { ...form, followers: parseInt(form.followers) || 0 }
    if (editing) await api.put(`/contacts/${editing.id}`, data)
    else await api.post('/contacts', data)
    setModal(false); load()
  }

  const doDelete = async () => { await api.delete(`/contacts/${deleteId}`); setDeleteId(null); load() }

  const importCSV = e => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const lines = ev.target.result.trim().split('\n').filter(Boolean)
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const obj = {}; headers.forEach((h, idx) => { obj[h] = vals[idx] || '' })
        if (obj.name && obj.email) { try { await api.post('/contacts', obj) } catch {} }
      }
      load()
    }
    reader.readAsText(file); e.target.value = ''
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Contacts</h1>
          <p className="text-gray-400 text-sm mt-0.5">{contacts.length} influencer{contacts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current.click()} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            <Upload size={14} /> Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <UserPlus size={14} /> Add Contact
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64" />
        </div>
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700">
          <option value="">All platforms</option>
          {PLATFORMS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Name', 'Platform', 'Followers', 'Niche', 'Tags', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {contacts.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>
                </td>
                <td className="px-4 py-3">
                  {c.platform
                    ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLORS[c.platform] || 'bg-gray-100 text-gray-600'}`}>{c.platform}</span>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{fmtN(c.followers)}</td>
                <td className="px-4 py-3 text-gray-600">{c.niche || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {(c.tags || []).slice(0, 3).map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">{t}</span>
                    ))}
                    {(c.tags || []).length > 3 && <span className="text-xs text-gray-400">+{c.tags.length - 3}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors"><Edit2 size={13} /></button>
                    <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-gray-400 text-sm">
                No contacts yet. Add your first influencer or import from CSV.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Contact' : 'Add Contact'}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
              <input required value={form.name} onChange={f('name')} placeholder="Sarah Johnson"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={f('email')} placeholder="sarah@example.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Platform</label>
              <select value={form.platform} onChange={f('platform')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                <option value="">Select...</option>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Followers</label>
              <input type="number" value={form.followers} onChange={f('followers')} placeholder="50000"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Niche</label>
              <select value={form.niche} onChange={f('niche')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                <option value="">Select...</option>
                {NICHES.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tags</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {form.tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                  {t}
                  <button type="button" onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }))}
                    className="hover:text-indigo-800"><X size={9} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Add tag + Enter"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <button type="button" onClick={addTag} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Add</button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={f('notes')} rows={2} placeholder="Any notes about this influencer..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
              {editing ? 'Update' : 'Add'} Contact
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Contact">
        <p className="text-gray-600 text-sm mb-5">This will permanently delete the contact and all associated data.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={doDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Delete</button>
        </div>
      </Modal>
    </div>
  )
}
