import { useState, useEffect } from 'react'
import { api } from '../api'
import { FilePlus, Edit2, Trash2, X, Eye, Code } from 'lucide-react'

function Modal({ open, onClose, title, wide, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-xl shadow-2xl max-h-[92vh] flex flex-col ${wide ? 'w-full max-w-3xl' : 'w-full max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded p-1"><X size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

const VARS = ['{{name}}', '{{email}}', '{{product}}', '{{platform}}']

const DEFAULT_BODY = `<p>Hi {{name}},</p>

<p>I hope this message finds you well! I'm reaching out because I love your content on {{platform}} and think you'd be a perfect fit for our <strong>{{product}}</strong> campaign.</p>

<p>We'd love to collaborate with you and offer:</p>
<ul>
  <li>Competitive compensation</li>
  <li>Free product samples</li>
  <li>Long-term partnership opportunities</li>
</ul>

<p>Would you be open to a quick chat to discuss the details? I'd love to hear your thoughts!</p>

<p>Best regards,<br/>The Team</p>`

const EMPTY = { name: '', subject: '', body: DEFAULT_BODY }

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [deleteId, setDeleteId] = useState(null)
  const [preview, setPreview] = useState(null)
  const [tab, setTab] = useState('edit')

  const load = () => api.get('/templates').then(r => setTemplates(r.data))
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setTab('edit'); setModal(true) }
  const openEdit = t => { setEditing(t); setForm({ name: t.name, subject: t.subject, body: t.body }); setTab('edit'); setModal(true) }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const insertVar = v => {
    setForm(p => ({ ...p, body: p.body + v }))
  }

  const submit = async e => {
    e.preventDefault()
    if (editing) await api.put(`/templates/${editing.id}`, form)
    else await api.post('/templates', form)
    setModal(false); load()
  }

  const doDelete = async () => { await api.delete(`/templates/${deleteId}`); setDeleteId(null); load() }

  const previewHtml = (body) => {
    return body
      .replace(/\{\{name\}\}/g, 'Sarah Johnson')
      .replace(/\{\{email\}\}/g, 'sarah@example.com')
      .replace(/\{\{product\}\}/g, 'Glow Face Serum')
      .replace(/\{\{platform\}\}/g, 'Instagram')
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Templates</h1>
          <p className="text-gray-400 text-sm mt-0.5">{templates.length} email template{templates.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <FilePlus size={14} /> New Template
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{t.name}</h3>
              <div className="flex gap-1 flex-shrink-0 ml-2">
                <button onClick={() => setPreview(t)} className="p-1.5 text-gray-400 hover:text-violet-600 rounded hover:bg-violet-50 transition-colors"><Eye size={13} /></button>
                <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors"><Edit2 size={13} /></button>
                <button onClick={() => setDeleteId(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium mb-1">Subject</p>
            <p className="text-sm text-gray-700 mb-3 truncate">{t.subject}</p>
            <p className="text-xs text-gray-400">{fmtDate(t.created_at)}</p>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400 text-sm">
            No templates yet. Create your first email template!
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Template' : 'New Template'} wide>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Template Name *</label>
              <input required value={form.name} onChange={f('name')} placeholder="e.g. Product Launch Outreach"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subject Line *</label>
              <input required value={form.subject} onChange={f('subject')} placeholder="e.g. Collaboration opportunity for {{name}}"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          {/* Variable chips */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Insert variable:</span>
            {VARS.map(v => (
              <button key={v} type="button" onClick={() => insertVar(v)}
                className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 font-mono transition-colors">
                {v}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div>
            <div className="flex gap-1 mb-2">
              {['edit', 'preview'].map(t => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {t === 'edit' ? <><Code size={11} /> Edit HTML</> : <><Eye size={11} /> Preview</>}
                </button>
              ))}
            </div>
            {tab === 'edit' ? (
              <textarea required value={form.body} onChange={f('body')} rows={14}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                placeholder="Email body (HTML supported)..." />
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 min-h-[280px] bg-white overflow-auto">
                <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: previewHtml(form.body) }} />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
              {editing ? 'Update' : 'Create'} Template
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name || ''} wide>
        {preview && (
          <>
            <p className="text-xs text-gray-500 mb-1">Subject</p>
            <p className="text-sm font-medium text-gray-800 mb-4 p-3 bg-gray-50 rounded-lg">{previewHtml(preview.subject)}</p>
            <p className="text-xs text-gray-500 mb-1">Body preview <span className="text-gray-400">(with sample data)</span></p>
            <div className="border border-gray-200 rounded-lg p-5 bg-white">
              <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: previewHtml(preview.body) }} />
            </div>
          </>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Template">
        <p className="text-gray-600 text-sm mb-5">Are you sure you want to delete this template?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Cancel</button>
          <button onClick={doDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Delete</button>
        </div>
      </Modal>
    </div>
  )
}
