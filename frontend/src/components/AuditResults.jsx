import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle, ChevronDown, Crosshair, Wand2, Lock, Hash, Activity, Terminal, Loader2 } from 'lucide-react';

const SEV_BADGE = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Low: 'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/30',
};

const SEV_RAIL = {
  Critical: 'border-l-red-500', High: 'border-l-orange-500',
  Medium: 'border-l-yellow-500', Low: 'border-l-[#00D4FF]',
};

const AuditResults = ({ data, onAutoHeal, onLocate, healingTitle }) => {
  const score = data.ai_result?.risk_score?.security_score ?? data.ai_result?.risk_score ?? 100;
  const tier = data.ai_result?.risk_score?.risk_tier ?? "Low Risk";
  const uiMetadata = data.ai_result?.risk_score?.ui_metadata ?? { color_code: "#2ED47A" };
  const breakdown = data.ai_result?.risk_score?.vulnerability_breakdown ?? { critical: 0, high: 0, medium: 0, low: 0 };
  const vulns = data.ai_result?.vulnerabilities ?? [];
  const chain = data.blockchain_status || {};

  return (
    <div className="space-y-5 text-white">
      {/* CVSS Metric Block Framework Dashboard Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1 bg-white/[0.01] border border-white/[0.05] rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.05] blur-2xl" style={{ backgroundColor: uiMetadata.color_code }} />
          <p className="relative text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">CVSS Health Score</p>
          <p className="relative text-6xl font-bold tabular-nums" style={{ color: uiMetadata.color_code }}>{score}</p>
          <p className="relative text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: uiMetadata.color_code }}>{tier}</p>
        </div>
        
        <div className="md:col-span-2 bg-white/[0.01] border border-white/[0.05] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 flex items-center gap-1.5 mb-2">
              <Lock size={12} /> Cryptographic Proof Validation · Automated Core
            </p>
            <div className="flex items-center justify-between px-3 py-2 bg-black/40 rounded-md border border-white/[0.05] mb-2">
              <span className="text-[10px] uppercase text-white/30 flex items-center gap-1.5"><Hash size={11} /> Proof Tx Hash</span>
              <code className="text-xs font-mono text-[#00D4FF]/90">
                {chain.tx_hash ? `${chain.tx_hash.slice(0, 24)}…` : 'Processing Ledger Block...'}
              </code>
            </div>
          </div>
          
          {/* Severity Metric Distribution Grid Widget */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {Object.entries(breakdown).map(([key, value]) => (
              <div key={key} className="bg-black/20 border border-white/[0.03] p-1.5 rounded-md">
                <p className="text-[9px] uppercase tracking-wider text-white/40">{key}</p>
                <p className="text-sm font-mono font-bold text-white/80">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit List Component Findings Tree */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white pb-3 mb-3 border-b border-white/[0.05]">
          Targeted Core Findings Vector
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${vulns.length ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
            {vulns.length} findings mapped
          </span>
        </h3>
        
        {vulns.length === 0 ? (
          <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl p-8 text-center">
            <CheckCircle className="mx-auto mb-3 text-emerald-400" size={40} />
            <p className="font-semibold text-white">Mathematical Invariant Conditions Verified</p>
            <p className="text-xs text-white/40 mt-1">Audit sweep engine detected 0 vulnerability vectors inside this file entity context.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vulns.map((vuln, i) => (
              <FindingCard
                key={i}
                vuln={vuln}
                onLocate={() => onLocate(vuln)}
                onAutoHeal={() => onAutoHeal(vuln)}
                healing={healingTitle === vuln.title}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FindingCard = ({ vuln, onLocate, onAutoHeal, healing }) => {
  const [open, setOpen] = useState(false);
  const rail = SEV_RAIL[vuln.severity] || SEV_RAIL.Medium;
  const badge = SEV_BADGE[vuln.severity] || SEV_BADGE.Medium;
  
  return (
    <motion.div layout className={`border-l-2 ${rail} bg-white/[0.01] border-y border-r border-white/[0.05] rounded-r-lg overflow-hidden`}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-white/[0.015] transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badge}`}>{vuln.severity}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{vuln.title}</p>
            <p className="text-[11px] font-mono text-white/30">
              {vuln.affected_lines?.length ? `Lines reference: [ ${vuln.affected_lines.join(', ')} ]` : 'Logical execution matrix flow'}
            </p>
          </div>
        </div>
        <ChevronDown size={18} className={`flex-none text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/[0.05]">
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-white/[0.05]">
              <div className="p-4 md:border-r border-white/[0.05]">
                <p className="text-[10px] uppercase font-semibold text-white/40 flex items-center gap-1.5 mb-2"><Activity size={11} /> Trace Diagnostics</p>
                <p className="text-xs text-white/70 leading-relaxed">{vuln.description}</p>
              </div>
              <div className="p-4 bg-black/20">
                <p className="text-[10px] uppercase font-semibold text-emerald-400 flex items-center gap-1.5 mb-2"><Terminal size={11} /> Mathematical Remediation Blueprint</p>
                <pre className="border border-white/[0.05] bg-black/60 rounded-md p-3 text-[11px] font-mono text-emerald-400/90 whitespace-pre-wrap overflow-x-auto">
                  <code>{vuln.remediation || '// Comprehensive manual security evaluation recommended'}</code>
                </pre>
              </div>
            </div>
            <div className="flex gap-2 p-3 bg-white/[0.005]">
              <button onClick={onLocate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-white/[0.05] text-white/60 hover:text-[#00D4FF] hover:border-[#00D4FF]/40 transition-colors">
                <Crosshair size={13} /> Track code vector
              </button>
              <button onClick={onAutoHeal} disabled={healing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF]/20 disabled:opacity-40 transition-all">
                {healing ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                {healing ? 'Deploying Patch Core…' : 'Execute Auto-Heal'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default AuditResults;