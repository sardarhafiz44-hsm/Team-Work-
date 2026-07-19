import React from 'react';
import {
  ShieldCheck, LayoutDashboard, FolderKanban, History,
  FileScan, FileDown, Settings, LogOut, AlertTriangle
} from 'lucide-react';
import useStore from '../store/useStore';

const NAV_SECTIONS = [
  {
    label: 'Operations',
    items: [
      { name: 'Executive Dashboard', icon: LayoutDashboard, trackAlerts: false },
      { name: 'Audit History', icon: History, trackAlerts: true },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { name: 'Deep Audit Suite', icon: FileScan, trackAlerts: false },
      { name: 'My Projects', icon: FolderKanban, trackAlerts: false },
    ],
  },
];

const Sidebar = () => {
  const { logout, activeTab, setActiveTab, userRole, auditHistoryList } = useStore();

  // Dynamic Metrics Evaluation: Identify if high threat states are tracked in active history logs
  const containsCriticalThreats = auditHistoryList.some(
    record => record.risk_tier === "Critical Risk" || record.risk_tier === "High Risk"
  );

  return (
    <aside className="w-64 flex-none bg-[#090D16] border-r border-white/[0.05] h-screen flex flex-col font-sans">
      {/* Brand Profile Element Header */}
      <div className="px-5 h-16 flex items-center gap-3 border-b border-white/[0.05]">
        <div className="w-9 h-9 bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.15)]">
          <ShieldCheck className="text-[#00D4FF] w-5 h-5" />
        </div>
        <div className="leading-none">
          <h2 className="text-base font-bold tracking-wide text-white">
            SOL<span className="text-[#00D4FF]">SHIELD</span>
          </h2>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
            Pro Auditor
          </span>
        </div>
      </div>

      {/* Navigation Layer */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map(({ name, icon: Icon, trackAlerts }) => {
                const active = activeTab === name;
                return (
                  <button
                    key={name}
                    onClick={() => setActiveTab(name)}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#00D4FF]
                    ${active
                      ? 'bg-[#00D4FF]/10 text-[#00D4FF]'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.04]'}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Active State Bar Layout Rail */}
                      <span className={`absolute left-0 w-0.5 h-5 rounded-r ${active ? 'bg-[#00D4FF]' : 'bg-transparent'}`} />
                      <Icon size={18} className={active ? 'text-[#00D4FF]' : 'text-white/40 group-hover:text-white/70'} />
                      <span>{name}</span>
                    </div>

                    {/* Dynamic Threat Notification Indicator Badge Component */}
                    {trackAlerts && containsCriticalThreats && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer System Utilities Layout Utility */}
      <div className="px-3 py-4 border-t border-white/[0.05] space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
          <FileDown size={18} className="text-white/40" /> Export Report
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
          <Settings size={18} className="text-white/40" /> Settings
        </button>
        
        <div className="pt-2 mt-2 border-t border-white/[0.05] flex items-center justify-between px-3">
          <div className="leading-tight">
            <p className="text-xs font-medium text-white">{userRole || 'Operator'}</p>
            <p className="text-[10px] font-mono text-white/30">Session active</p>
          </div>
          <button
            onClick={logout}
            aria-label="End session"
            className="p-2 rounded-lg text-red-400/80 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;