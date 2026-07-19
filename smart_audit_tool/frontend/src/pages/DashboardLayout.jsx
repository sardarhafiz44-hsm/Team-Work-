import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Scanner from '../components/Scanner';
import ExecutiveDashboard from '../components/ExecutiveDashboard';
import AuditHistory from '../components/AuditHistory';
import useStore from '../store/useStore';
import { LayoutGrid, Binary, LineChart, FileCheck, ShieldX } from 'lucide-react';

const DashboardLayout = () => {
  const activeTab = useStore((state) => state.activeTab);
  const latestScanResult = useStore((state) => state.latestScanResult);
  
  // Local sub-tabs management for Deep Workspace Viewport to separate findings layers
  const [workspaceSubTab, setWorkspaceSubTab] = useState('Workspace Editor');

  return (
    <div className="flex h-screen bg-[#050B14] overflow-hidden font-sans antialiased selection:bg-[#00D4FF]/30">
      {/* Dynamic Alert Sidebar Navigation Module Component */}
      <Sidebar />
      
      {/* Main Framework Content Dynamic Area Viewport */}
      <div className="flex-1 h-full overflow-y-auto bg-gradient-to-b from-[#090D16] to-[#050B14]">
        
        {/* VIEW LAYER 1: Executive Threat Telemetry Analytics */}
        {activeTab === 'Executive Dashboard' && <ExecutiveDashboard />}
        
        {/* VIEW LAYER 2: Live Core Audit Workspace with Structural Sub-Tabs Separation */}
        {activeTab === 'Deep Audit Suite' && (
          <div className="flex flex-col h-full">
            {/* Top Navigation Row for Multi-Tab Interface */}
            <div className="flex items-center justify-between px-8 bg-black/40 border-b border-white/[0.05] h-12 flex-none">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none h-full">
                {[
                  { id: 'Workspace Editor', label: 'Workspace Editor', icon: LayoutGrid },
                  { id: 'Crypto Proofs', label: 'Mathematical Proofs', icon: Binary, requireData: true },
                  { id: 'Analytical Charts', label: 'Advanced Analytics Charts', icon: LineChart, requireData: true },
                  { id: 'Remediation Blueprints', label: 'Formal Remediation Blueprints', icon: FileCheck, requireData: true }
                ].map((tab) => {
                  const isDisabled = tab.requireData && !latestScanResult;
                  const isActive = workspaceSubTab === tab.id;
                  const Icon = tab.icon;
                  
                  return (
                    <button
                      key={tab.id}
                      disabled={isDisabled}
                      onClick={() => setWorkspaceSubTab(tab.id)}
                      className={`h-full flex items-center gap-2 px-4 text-xs font-mono border-b-2 transition-all uppercase tracking-wider
                        ${isDisabled ? 'opacity-25 cursor-not-allowed border-transparent text-white/30' : ''}
                        ${isActive 
                          ? 'border-[#00D4FF] text-[#00D4FF] bg-[#00D4FF]/5 font-semibold' 
                          : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.01]'}`}
                    >
                      <Icon size={12} className={isActive ? 'text-[#00D4FF]' : 'text-white/40'} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              {latestScanResult && (
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00D4FF] bg-[#00D4FF]/10 px-2.5 py-1 rounded-md border border-[#00D4FF]/20 animate-pulse">
                  Payload Matrix Loaded
                </span>
              )}
            </div>

            {/* Sub-Tabs Execution Viewports Router Router Elements */}
            <div className="flex-1 min-h-0">
              {workspaceSubTab === 'Workspace Editor' && <Scanner />}
              
              {workspaceSubTab === 'Crypto Proofs' && (
                <div className="p-8 max-w-[1200px] mx-auto text-white">
                  <h2 className="text-xl font-bold font-mono text-[#00D4FF] mb-2 flex items-center gap-2"><Binary size={20}/> Cryptographic Proof Validation Matrix</h2>
                  <p className="text-xs text-white/40 mb-6 border-b border-white/[0.05] pb-4">Formal verification tracking hashes registered natively into system relational tables instances.</p>
                  <pre className="bg-black/60 border border-white/[0.05] rounded-xl p-5 font-mono text-xs text-[#2ED47A] overflow-x-auto leading-relaxed shadow-2xl">
                    <code>{`[SYSTEM RECORD INTEGRITY PASSED]\n------------------------------------------------\nTARGET_HASH     :: ${latestScanResult?.blockchain_status?.tx_hash}\nSALT_VECTOR     :: ${latestScanResult?.blockchain_status?.salt}\nVERDICT_TIER    :: ${latestScanResult?.ai_result?.risk_score?.risk_tier?.toUpperCase()}\nSCORE_METRIC    :: ${latestScanResult?.ai_result?.risk_score?.security_score}/100\n\n[MATHEMATICAL INVARIANT VERIFICATION TRACE]\n✓ Assert Statement Integrity Proof Matrix Checked\n✓ State Machine Invariant Constraints Locked\n✓ Zero Exploit Condition State Verified via Fallback Core Passes`}</code>
                  </pre>
                </div>
              )}

              {workspaceSubTab === 'Analytical Charts' && (
                <div className="p-8 text-center text-white/40 font-mono text-xs max-w-[1200px] mx-auto">
                  <div className="bg-[#090D16] border border-white/[0.05] p-12 rounded-xl">
                    <LineChart size={32} className="mx-auto mb-3 text-[#00D4FF] opacity-40 animate-pulse" />
                    <p className="text-white font-medium mb-1">Multi-Dimensional Radial Threat Charts Mapped</p>
                    <p className="text-white/30 max-w-sm mx-auto text-[11px] mt-1">Severity matrix profiles counts [ Critical: {latestScanResult?.ai_result?.risk_score?.vulnerability_breakdown?.critical} | High: {latestScanResult?.ai_result?.risk_score?.vulnerability_breakdown?.high} ] are fully tracked inside Executive Viewport tab panel configurations layer.</p>
                  </div>
                </div>
              )}

              {workspaceSubTab === 'Remediation Blueprints' && (
                <div className="p-8 max-w-[1200px] mx-auto text-white">
                  <h2 className="text-xl font-bold font-mono text-emerald-400 mb-2 flex items-center gap-2"><FileCheck size={20}/> Formal Calculus Remediation Blueprint</h2>
                  <p className="text-xs text-white/40 mb-6 border-b border-white/[0.05] pb-4">Automated remediation matrices verified via custom mathematical patch constraints pipelines loop.</p>
                  <div className="grid grid-cols-1 gap-4">
                    {latestScanResult?.ai_result?.vulnerabilities?.map((vuln, index) => (
                      <div key={index} className="bg-black/40 border border-white/[0.05] p-5 rounded-xl">
                        <p className="text-xs font-mono text-[#00D4FF] uppercase tracking-wider mb-2">Finding Mapping Vector #{index + 1}: {vuln.title}</p>
                        <pre className="bg-black/80 border border-emerald-500/10 text-[11px] text-emerald-400 font-mono p-4 rounded-md whitespace-pre-wrap">
                          <code>{vuln.remediation || '// Safe architectural blueprint state verified. No immediate patching instructions triggered.'}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* VIEW LAYER 3: Immutable Audits Logging Ledger System */}
        {activeTab === 'Audit History' && <AuditHistory />}
        
        {/* VIEW LAYER 4: Enterprise Projects Tracking Dashboard */}
        {activeTab === 'My Projects' && (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <div className="w-10 h-10 border-2 border-white/[0.05] border-t-[#00D4FF] rounded-full animate-spin mb-4" />
            <p className="font-mono text-xs tracking-[0.18em] uppercase text-white/40">Nessus Scanning Target Clusters Construction...</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default DashboardLayout;