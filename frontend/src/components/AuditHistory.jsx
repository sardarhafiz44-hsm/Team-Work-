import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { History, ShieldAlert, ShieldCheck, ShieldQuestion, Loader2, ArrowRight } from 'lucide-react';
import useStore from '../store/useStore';
import axios from 'axios';

const tooltipStyle = {
  backgroundColor: '#090D16',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  fontSize: '12px',
};

const shortHash = (h) => h ? `${h.slice(0, 10)}…${h.slice(-6)}` : '—';

const AuditHistory = () => {
  const { auditHistoryList, syncAuditHistory } = useStore();
  const [loading, setLoading] = useState(auditHistoryList.length === 0);

  useEffect(() => {
    const fetchLedgerHistory = async () => {
      try {
        const { data } = await axios.get('http://localhost:8000/history');
        syncAuditHistory(data);
      } catch (err) {
        console.error('Relational history fetch mapping failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedgerHistory();
  }, [syncAuditHistory]);

  const chartData = [...auditHistoryList].reverse().map((log, i) => ({
    scan: `#${i + 1}`,
    score: log.risk_score,
  }));

  return (
    <div className="p-8 max-w-[1600px] mx-auto text-white">
      <header className="mb-6 pb-4 border-b border-white/[0.05] flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <History className="text-[#00D4FF]" size={24} /> Audit History Ledger
          </h1>
          <p className="text-sm text-white/40 mt-1">Immutable relational trace of structural assessments</p>
        </div>
        {loading && (
          <span className="flex items-center gap-2 text-[#00D4FF] font-mono text-[11px] uppercase tracking-wider">
            <Loader2 size={14} className="animate-spin" /> Fetching ledger blocks...
          </span>
        )}
      </header>

      {/* Risk Trend Visual Analytics View */}
      <section className="bg-[#090D16] border border-white/[0.05] rounded-xl p-5 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40 mb-4">
          CVSS Mitigation Posture Performance Trend
        </h3>
        <div className="h-[220px]">
          {!loading && auditHistoryList.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 6, right: 16, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis dataKey="scan" stroke="#10294A" tick={{ fill: '#7C92AD', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#10294A" tick={{ fill: '#7C92AD', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F4F7FB' }} labelStyle={{ color: '#00D4FF', fontWeight: 600 }} />
                <Line type="monotone" dataKey="score" stroke="#00D4FF" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#00D4FF', strokeWidth: 2, stroke: '#090D16' }}
                  activeDot={{ r: 5, fill: '#fff', stroke: '#00D4FF' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-white/20 font-mono text-sm">
              {loading ? 'Analyzing pipeline indexes…' : 'No cryptographic audit entries cataloged.'}
            </div>
          )}
        </div>
      </section>

      {/* Ledger Core Data Component Matrix */}
      <section className="bg-[#090D16] border border-white/[0.05] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Secure Scan Index Ledger</h3>
          <span className="text-[11px] font-mono text-white/20">{auditHistoryList.length} cryptographic logs traced</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01] text-white/30 font-mono text-[10px] uppercase tracking-[0.14em] border-b border-white/[0.05]">
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-5 py-3 font-semibold">Target Hash</th>
                <th className="px-5 py-3 font-semibold">File Object</th>
                <th className="px-5 py-3 font-semibold text-center">CVSS Score</th>
                <th className="px-5 py-3 font-semibold text-center">Threat Posture</th>
                <th className="px-5 py-3 font-semibold text-right">Action Trace</th>
              </tr>
            </thead>
            <tbody>
              {!loading && auditHistoryList.map((log) => (
                <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors">
                  <td className="px-5 py-3.5 text-sm text-white/50 font-mono whitespace-nowrap">{log.date}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-[#00D4FF]/80">{shortHash(log.target_hash)}</td>
                  <td className="px-5 py-3.5 text-sm text-white font-medium">{log.filename}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold font-mono border bg-white/[0.02] border-white/[0.1]">
                      {log.risk_score}/100
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1.5 text-sm font-medium" style={{ color: log.risk_tier.includes('Critical') || log.risk_tier.includes('High') ? '#FF3B5C' : '#2ED47A' }}>
                      {log.risk_tier.includes('Critical') ? <ShieldAlert size={15}/> : <ShieldCheck size={15}/>}
                      {log.risk_tier}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="inline-flex items-center gap-1 text-[#00D4FF] hover:text-white text-sm font-medium transition-colors group">
                      View matrix <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
export default AuditHistory;