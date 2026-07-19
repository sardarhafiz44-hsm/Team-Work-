import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, ShieldAlert, ShieldCheck, TrendingUp, Loader2 } from 'lucide-react';
import useStore from '../store/useStore';
import axios from 'axios';

const tooltipStyle = {
  backgroundColor: '#090D16',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  fontSize: '12px',
};

const KpiCard = ({ icon: Icon, label, value, tone, sublabel, loading }) => {
  const tones = {
    neutral: { ring: 'border-white/[0.05]', chip: 'bg-[#00D4FF]/10 text-[#00D4FF]' },
    critical: { ring: 'border-red-500/30', chip: 'bg-red-500/10 text-red-400' },
    success: { ring: 'border-emerald-500/30', chip: 'bg-emerald-500/10 text-emerald-400' },
  }[tone] || {};

  return (
    <div className={`bg-[#090D16] border ${tones.ring} rounded-xl p-5 flex items-center gap-4`}>
      <div className={`p-3 rounded-lg ${tones.chip}`}><Icon size={26} /></div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{label}</p>
        <p className="text-3xl font-bold text-white tabular-nums leading-tight">
          {loading ? <span className="text-white/20">—</span> : value}
        </p>
        {sublabel && <p className="text-[11px] font-mono text-white/30 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
};

const ExecutiveDashboard = () => {
  const { auditHistoryList, syncAuditHistory } = useStore();
  const [loading, setLoading] = useState(auditHistoryList.length === 0);
  const [metrics, setMetrics] = useState({
    totalScans: 0, criticalThreats: 0, contractsSecured: 0, avgRisk: 0, severityData: [], scanVolumeData: []
  });

  useEffect(() => {
    const processTelemetryData = (logs) => {
      let criticalCount = 0, securedCount = 0, riskSum = 0;
      const sev = { Critical: 0, High: 0, Medium: 0, Low: 0 };
      const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const volume = Object.fromEntries(order.map((d) => [d, 0]));

      logs.forEach((scan) => {
        riskSum += scan.risk_score ?? 0;
        if (scan.risk_score === 100) securedCount++;
        if (scan.risk_tier === "Critical Risk" || scan.risk_tier === "High Risk") criticalCount++;

        const vulns = scan.result?.vulnerabilities || [];
        vulns.forEach((v) => {
          const s = v.severity ? v.severity.charAt(0).toUpperCase() + v.severity.slice(1).toLowerCase() : 'Low';
          if (sev[s] !== undefined) sev[s]++;
        });

        if (scan.date) {
          const d = dayIndex[new Date(scan.date).getDay()];
          if (d && volume[d] !== undefined) volume[d]++;
        }
      });

      let severityData = [
        { name: 'Critical', value: sev.Critical, color: '#FF3B5C' },
        { name: 'High', value: sev.High, color: '#FF8A3D' },
        { name: 'Medium', value: sev.Medium, color: '#F5C451' },
        { name: 'Low', value: sev.Low, color: '#00D4FF' },
      ].filter((x) => x.value > 0);

      if (!severityData.length) severityData = [{ name: 'Secure Infrastructure', value: 1, color: '#2ED47A' }];

      setMetrics({
        totalScans: logs.length,
        criticalThreats: criticalCount,
        contractsSecured: securedCount,
        avgRisk: logs.length ? Math.round(riskSum / logs.length) : 0,
        severityData,
        scanVolumeData: order.map((day) => ({ day, scans: volume[day] }))
      });
    };

    const fetchHistoryLogs = async () => {
      try {
        const { data } = await axios.get('http://localhost:8000/history');
        syncAuditHistory(data);
        processTelemetryData(data);
      } catch (err) {
        console.error('Telemetry matrix sync metrics loading crashed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryLogs();
  }, [syncAuditHistory]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto text-white">
      <header className="mb-6 pb-4 border-b border-white/[0.05] flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Threat Analytics Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Real-time compiler insights telemetry arrays</p>
        </div>
        <span className={`flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider ${loading ? 'text-[#00D4FF]' : 'text-white/30'}`}>
          {loading ? <><Loader2 size={14} className="animate-spin" /> Syncing network vectors...</> : <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Secure Live Stream</>}
        </span>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Activity} label="Total Assessments" value={metrics.totalScans} tone="neutral" sublabel="Historical sweeps counter" loading={loading} />
        <KpiCard icon={ShieldAlert} label="High Threat Alerts" value={metrics.criticalThreats} tone="critical" sublabel="Isolated exploit surfaces" loading={loading} />
        <KpiCard icon={ShieldCheck} label="Flawless Validations" value={metrics.contractsSecured} tone="success" sublabel="Score 100/100 blocks" loading={loading} />
        <KpiCard icon={TrendingUp} label="Mean Security Score" value={`${metrics.avgRisk}/100`} tone="neutral" sublabel="Average mathematical posture" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-[#090D16] border border-white/[0.05] p-5 rounded-xl flex flex-col">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40 mb-4">Exploit Distribution Framework</h3>
          <div className="flex-1 min-h-[260px]">
            {!loading && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.severityData} innerRadius={70} outerRadius={104} paddingAngle={3} dataKey="value" stroke="none">
                    {metrics.severityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F4F7FB' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#7C92AD' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-[#090D16] border border-white/[0.05] p-5 rounded-xl flex flex-col">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40 mb-4">Pipeline Sweep Volume Trend</h3>
          <div className="flex-1 min-h-[260px]">
            {!loading && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.scanVolumeData} barCategoryGap="35%">
                  <XAxis dataKey="day" stroke="#10294A" tick={{ fill: '#7C92AD', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} stroke="#10294A" tick={{ fill: '#7C92AD', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.01)' }} contentStyle={tooltipStyle} />
                  <Bar dataKey="scans" fill="#00D4FF" radius={[3, 3, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ExecutiveDashboard;