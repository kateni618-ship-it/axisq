import { LayoutDashboard, Users, Send, FileText, GitBranch, Settings, Zap } from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'campaigns', label: 'Campaigns', icon: Send },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
]

export default function Sidebar({ current, onNavigate }) {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full" style={{ backgroundColor: '#1a1d21' }}>
      {/* Workspace Header */}
      <div className="px-4 py-4 border-b border-white/10 cursor-default select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <Zap size={15} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight tracking-tight">axisq</p>
            <p className="text-white/40 text-xs">Influencer Outreach</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/30">Workspace</p>
        <div className="space-y-0.5">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = current === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-sm transition-all ${
                  active
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-white/55 hover:text-white hover:bg-white/8'
                }`}
                style={!active ? {} : {}}
              >
                <Icon size={15} className={active ? 'text-white' : 'text-white/45'} />
                <span>{label}</span>
                {active && <span className="ml-auto w-1 h-1 rounded-full bg-indigo-400" />}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-white/10">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-sm transition-all ${
            current === 'settings' ? 'bg-white/15 text-white font-semibold' : 'text-white/55 hover:text-white hover:bg-white/8'
          }`}
        >
          <Settings size={15} className={current === 'settings' ? 'text-white' : 'text-white/45'} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  )
}
