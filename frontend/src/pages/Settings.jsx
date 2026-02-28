import { useState, useEffect } from 'react'
import { api } from '../api'
import { Save, Wifi, WifiOff, Info } from 'lucide-react'

export default function Settings() {
  const [form, setForm] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_from: '',
  })
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    api.get('/settings').then(r => {
      setForm(p => ({ ...p, ...r.data }))
    })
  }, [])

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async e => {
    e.preventDefault()
    await api.post('/settings', form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      // Simple test — just verify we can reach the backend settings endpoint
      await api.get('/settings')
      setTestResult({ ok: true, msg: 'Backend connection OK. SMTP will be validated on first send.' })
    } catch {
      setTestResult({ ok: false, msg: 'Cannot reach backend.' })
    }
    setTesting(false)
  }

  const Field = ({ label, name, type = 'text', placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={f(name)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </div>
  )

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Configure your email sending credentials</p>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
        <Info size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-700">
          If SMTP is not configured, campaigns will run in <strong>simulation mode</strong> — emails are marked as sent without actually being delivered. Great for testing!
        </p>
      </div>

      <form onSubmit={save} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-base">SMTP Configuration</h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label="SMTP Host" name="smtp_host" placeholder="smtp.gmail.com" />
          </div>
          <Field label="Port" name="smtp_port" placeholder="587" />
        </div>

        <Field label="Username / Email" name="smtp_user" placeholder="you@gmail.com" />
        <Field label="Password / App Password" name="smtp_password" type="password" placeholder="Your SMTP password" />
        <Field label="From Name / Address" name="smtp_from" placeholder="Your Name <you@gmail.com>" />

        <div className="pt-1 flex items-center gap-3">
          <button type="submit" className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Save size={14} /> {saved ? 'Saved!' : 'Save Settings'}
          </button>
          <button type="button" onClick={testConnection} disabled={testing}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50">
            {testing ? <Wifi size={14} className="animate-pulse" /> : <Wifi size={14} />}
            Test Connection
          </button>
          {testResult && (
            <div className={`flex items-center gap-1.5 text-sm ${testResult.ok ? 'text-green-600' : 'text-red-500'}`}>
              {testResult.ok ? <Wifi size={14} /> : <WifiOff size={14} />}
              {testResult.msg}
            </div>
          )}
        </div>
      </form>

      {/* Tips */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 text-sm mb-3">Quick Setup Guide</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex gap-2"><span className="text-indigo-400 font-mono text-xs mt-0.5">Gmail</span><span>Use App Passwords (2FA required). Host: <code className="bg-gray-100 px-1 rounded text-xs">smtp.gmail.com</code>, Port: <code className="bg-gray-100 px-1 rounded text-xs">587</code></span></div>
          <div className="flex gap-2"><span className="text-indigo-400 font-mono text-xs mt-0.5">Outlook</span><span>Host: <code className="bg-gray-100 px-1 rounded text-xs">smtp.office365.com</code>, Port: <code className="bg-gray-100 px-1 rounded text-xs">587</code></span></div>
          <div className="flex gap-2"><span className="text-indigo-400 font-mono text-xs mt-0.5">SendGrid</span><span>Host: <code className="bg-gray-100 px-1 rounded text-xs">smtp.sendgrid.net</code>, Port: <code className="bg-gray-100 px-1 rounded text-xs">587</code>, User: <code className="bg-gray-100 px-1 rounded text-xs">apikey</code></span></div>
        </div>
      </div>
    </div>
  )
}
