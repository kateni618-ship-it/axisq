import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Campaigns from './pages/Campaigns'
import Templates from './pages/Templates'
import Pipeline from './pages/Pipeline'
import Settings from './pages/Settings'

export default function App() {
  const [page, setPage] = useState('dashboard')

  const pages = {
    dashboard: <Dashboard />,
    contacts: <Contacts />,
    campaigns: <Campaigns />,
    templates: <Templates />,
    pipeline: <Pipeline />,
    settings: <Settings />,
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar current={page} onNavigate={setPage} />
      <main className="flex-1 overflow-auto">
        {pages[page] || <Dashboard />}
      </main>
    </div>
  )
}
