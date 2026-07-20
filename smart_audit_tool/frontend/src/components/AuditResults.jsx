import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, CheckCircle, ChevronDown, Crosshair, Wand2,
  Lock, Hash, Activity, Terminal, Loader2, TrendingDown, Award
} from 'lucide-react';

// =====================================================
// STYLING CONSTANTS
// =====================================================
const SEV_BADGE = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Low: 'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/30',
};

const SEV_RAIL = {
  Critical: 'border-l-red-500',
  High: 'border-l-orange-500',
  Medium: 'border-l-yellow-500',
  Low: 'border-l-[#00D4FF]',
};

const SEV_COLOR = {
  Critical: '#FF3B5C',
  High: '#FF8A3D',
  Medium: '#F5C451',
  Low: '#00D4FF',
};

// =====================================================
// SCORE BREAKDOWN COMPONENT
// =====================================================
const ScoreBreakdown = ({ breakdown, score }) => {
  if (!breakdown || !breakdown.deductions) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gradient-to-br from-[#090D16] to-[#0a1628] border border-[#00D4FF]/20 rounded-xl p-5 shadow-[0_0_20px_rgba(0,212,255,0.1)]"
    >
      <h3 className="text-sm font-bold text-[#00D4FF] mb-4 flex items-center gap-2">
        <TrendingDown size={16} />
        Score Breakdown Analysis
      </h3>

      {/* Base Score */}
      <div className="flex justify-between items-center py-2.5 px-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 mb-3">
        <div className="flex items-center gap-2">
          <Award size={14} className="text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">Base Security Score</span>
        </div>
        <span className="text-sm font-bold text-emerald-400">100</span>
      </div>

      {/* Deductions */}
      <div className="space-y-1.5 mb-3">
        {breakdown.deductions.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex justify-between items-center py-2 px-3 bg-red-500/5 rounded-lg border border-red-500/10 hover:border-red-500/30 transition-all"
          >
            <div className="flex-1 min-w-0 pr-3">
              <p className="text-xs text-white/90 truncate font-medium">{d.item}</p>
              <p className="text-[10px] text-white/40 font-mono">{d.severity} severity</p>
            </div>
            <span className="text-sm font-bold text-red-400 flex-none">{d.points}</span>
          </motion.div>
        ))}
      </div>

      {/* Total Deduction */}
      <div className="flex justify-between items-center py-2.5 px-3 bg-red-500/10 rounded-lg border border-red-500/30 mb-3">
        <span className="text-xs font-bold text-red-400">Total Deduction</span>
        <span className="text-sm font-bold text-red-400">{breakdown.total_deduction}</span>
      </div>

      {/* Final Score */}
      <div className="flex justify-between items-center py-3 px-4 bg-[#00D4FF]/10 rounded-lg border border-[#00D4FF]/30">
        <span className="text-sm font-bold text-[#00D4FF]">Final Security Score</span>
        <span className="text-xl font-bold text-[#00D4FF]">{score}/100</span>
      </div>
    </motion.div>
  );
};

// =====================================================
// FINDING CARD COMPONENT
// =====================================================
const FindingCard = ({ vuln, onLocate, onAutoHeal, healing }) => {
  const [open, setOpen] = useState(false);
  const rail = SEV_RAIL[vuln.severity] || SEV_RAIL.Medium;
  const badge = SEV_BADGE[vuln.severity] || SEV_BADGE.Medium;

  return (
    <motion.div
      layout
      className={`border-l-2 ${rail} bg-white/[0.01] border-y border-r border-white/[0.05] rounded-r-lg overflow-hidden hover:bg-white/[0.02] transition-all`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-white/[0.015] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badge}`}>
            {vuln.severity}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{vuln.title}</p>
            <p className="text-[11px] font-mono text-white/30">
              {vuln.affected_lines?.length
                ? `Lines: [ ${vuln.affected_lines.join(', ')} ]`
                : 'Logical execution matrix flow'}
            </p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`flex-none text-white/30 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/[0.05]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-white/[0.05]">
              <div className="p-4 md:border-r border-white/[0.05]">
                <p className="text-[10px] uppercase font-semibold text-white/40 flex items-center gap-1.5 mb-2">
                  <Activity size={11} /> Trace Diagnostics
                </p>
                <p className="text-xs text-white/70 leading-relaxed">{vuln.description}</p>
              </div>
              <div className="p-4 bg-black/20">
                <p className="text-[10px] uppercase font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
                  <Terminal size={11} /> Remediation Blueprint
                </p>
                <pre className="border border-white/[0.05] bg-black/60 rounded-md p-3 text-[11px] font-mono text-emerald-400/90 whitespace-pre-wrap overflow-x-auto">
                  <code>{vuln.remediation || '// Manual security evaluation recommended'}</code>
                </pre>
              </div>
            </div>
            <div className="flex gap-2 p-3 bg-white/[0.005]">
              <button
                onClick={onLocate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-white/[0.05] text-white/60 hover:text-[#00D4FF] hover:border-[#00D4FF]/40 transition-colors"
              >
                <Crosshair size={13} /> Track code vector
              </button>
              <button
                onClick={onAutoHeal}
                disabled={healing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF]/20 disabled:opacity-40 transition-all"
              >
                {healing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Wand2 size={13} />
                )}
                {healing ? 'Deploying Patch…' : 'Execute Auto-Heal'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// =====================================================
// MAIN AUDIT RESULTS COMPONENT
// =====================================================
const AuditResults = ({ data, onAutoHeal, onLocate, healingTitle }) => {
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  const score = data.ai_result?.risk_score?.security_score ?? data.ai_result?.risk_score ?? 100;
  const tier = data.ai_result?.risk_score?.risk_tier ?? "Low Risk";
  const uiMetadata = data.ai_result?.risk_score?.ui_metadata ?? { color_code: "#2ED47A" };
  const breakdown = data.ai_result?.risk_score?.vulnerability_breakdown ?? { critical: 0, high: 0, medium: 0, low: 0 };
  const vulns = data.ai_result?.vulnerabilities ?? [];
  const chain = data.blockchain_status || {};
  const scoreBreakdown = data.ai_result?.risk_score?.score_breakdown;

  return (
    <div className="space-y-5 text-white">
      {/* CVSS Score + Blockchain Proof */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Score Card - Clickable */}
        <div
          className="md:col-span-1 bg-white/[0.01] border border-white/[0.05] rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:border-[#00D4FF]/30 transition-all group"
          onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
        >
          <div
            className="absolute inset-0 opacity-[0.05] blur-2xl group-hover:opacity-[0.1] transition-opacity"
            style={{ backgroundColor: uiMetadata.color_code }}
          />
          <p className="relative text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            CVSS Health Score
          </p>
          <p
            className="relative text-6xl font-bold tabular-nums transition-transform group-hover:scale-105"
            style={{ color: uiMetadata.color_code }}
          >
            {score}
          </p>
          <p
            className="relative text-xs font-semibold uppercase tracking-wider mt-1"
            style={{ color: uiMetadata.color_code }}
          >
            {tier}
          </p>
          <p className="relative text-[9px] font-mono text-white/30 mt-2 flex items-center gap-1">
            <ChevronDown size={10} className={showScoreBreakdown ? 'rotate-180' : ''} />
            Click for breakdown
          </p>
        </div>

        {/* Blockchain Proof + Severity Breakdown */}
        <div className="md:col-span-2 bg-white/[0.01] border border-white/[0.05] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 flex items-center gap-1.5 mb-2">
              <Lock size={12} /> Cryptographic Proof Validation · Automated Core
            </p>
            <div className="flex items-center justify-between px-3 py-2 bg-black/40 rounded-md border border-white/[0.05] mb-2">
              <span className="text-[10px] uppercase text-white/30 flex items-center gap-1.5">
                <Hash size={11} /> Proof Tx Hash
              </span>
              <code className="text-xs font-mono text-[#00D4FF]/90">
                {chain.tx_hash ? `${chain.tx_hash.slice(0, 24)}…` : 'Processing...'}
              </code>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {Object.entries(breakdown).map(([key, value]) => (
              <div key={key} className="bg-black/20 border border-white/[0.03] p-2 rounded-md">
                <p className="text-[9px] uppercase tracking-wider text-white/40">{key}</p>
                <p className="text-lg font-mono font-bold" style={{ color: SEV_COLOR[key] || '#fff' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score Breakdown (Expandable) */}
      <AnimatePresence>
        {showScoreBreakdown && scoreBreakdown && (
          <ScoreBreakdown breakdown={scoreBreakdown} score={score} />
        )}
      </AnimatePresence>

      {/* Findings List */}
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white pb-3 mb-3 border-b border-white/[0.05]">
          Targeted Core Findings Vector
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              vulns.length
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {vulns.length} findings mapped
          </span>
        </h3>

        {vulns.length === 0 ? (
          <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl p-8 text-center">
            <CheckCircle className="mx-auto mb-3 text-emerald-400" size={40} />
            <p className="font-semibold text-white">Mathematical Invariant Conditions Verified</p>
            <p className="text-xs text-white/40 mt-1">
              No vulnerability vectors detected in this contract.
            </p>
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

export default AuditResults;
