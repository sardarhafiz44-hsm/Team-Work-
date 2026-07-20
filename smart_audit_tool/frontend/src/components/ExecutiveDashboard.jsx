import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import axios from 'axios';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, RadialBarChart, RadialBar
} from 'recharts';
import {
  Activity, ShieldAlert, ShieldCheck, TrendingUp, Bot, Globe,
  AlertTriangle, CheckCircle, Clock, Cpu, Zap, Eye, Lock,
  RefreshCw, Terminal, Server, Database, Network
} from 'lucide-react';

const COLORS = {
  critical: '#FF3B5C',
  high: '#FF8A3D',
  medium: '#F5C451',
  low: '#00D4FF',
  secure: '#00ff88',
  bg: '#090D16',
  accent: '#00D4FF',
};

const KpiCard = ({ icon: Icon, label, value, sublabel, tone = 'neutral', pulse = false }) => {
  const tones = {
    neutral: { ring: 'border-white/[0.06]', chip: 'bg-[#00D4FF]/10 text-[#00D4FF]', icon: 'text-[#00D4FF]' },
    critical: { ring: 'border-red-500/30', chip: 'bg-red-500/10 text-red-400', icon: 'text-red-400' },
    success: { ring: 'border-emerald-500/30', chip: 'bg-emerald-500/10 text-emerald-400', icon: 'text-emerald-400' },
    warning: { ring: 'border-yellow-500/30', chip: 'bg-yellow-500/10 text-yellow-400', icon: 'text-yellow-400' },
  }[tone];

  return (
    <div className={`bg-[#090D16] border ${tones.ring} rounded-xl p-5 relative overflow-hidden group hover:border-[#00D4FF]/30 transition-all`}>
      {pulse && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${tones.chip}`}>
          <Icon size={22} />
        </div>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white tabular-nums leading-tight">{value}</p>
      {sublabel && <p className="text-[10px] font-mono text-white/30 mt-1.5">{sublabel}</p>}
    </div>
  );
};

const LiveFeed = () => {
  const [feed, setFeed] = useState([
    { time: '2m ago', event: 'Reentrancy detected in 0x7a3...f2e', severity: 'critical', chain: 'ETH' },
    { time: '5m ago', event: 'Auto-heal applied to Token.sol', severity: 'success', chain: 'POLY' },
    { time: '8m ago', event: 'Overflow vulnerability found', severity: 'high', chain: 'BSC' },
    { time: '12m ago', event: 'AI agent scanned 847 contracts', severity: 'info', chain: 'SYS' },
    { time: '15m ago', event: 'New CVE-2024-3847 added to DB', severity: 'warning', chain: 'DB' },
  ]);

  useEffect(() => {
    const events = [
      { event: 'Flash loan attack pattern detected', severity: 'critical', chain: 'ETH' },
      { event: 'Access control bypass in DeFi pool', severity: 'high', chain: 'ARB' },
      { event: 'Oracle manipulation attempt', severity: 'high', chain: 'OPT' },
      { event: 'AI agent completed batch scan', severity: 'info', chain: 'SYS' },
      { event: 'New contract deployed & audited', severity: 'success', chain: 'ETH' },
    ];
    const chains = ['ETH', 'POLY', 'BSC', 'ARB', 'OPT'];
    const interval = setInterval(() => {
      const e = events[Math.floor(Math.random() * events.length)];
      setFeed(prev => [{
        time: 'Just now',
        event: e.event,
        severity: e.severity,
        chain: chains[Math.floor(Math.random() * chains.length)]
      }, ...prev.slice(0, 6)]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const sevColors = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    info: 'text-[#00D4FF] bg-[#00D4FF]/10 border-[#00D4FF]/30',
  };

  return (
    <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50 flex items-center gap-2">
          <Activity size={14} className="text-[#00D4FF]" />
          Live Threat Feed
        </h3>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          STREAMING
        </span>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
        {feed.map((item, i) => (
          <div key={i} className="flex items-center gap-3 py-2 px-3 bg-black/30 rounded-lg border border-white/[0.03] hover:border-white/[0.08] transition-all">
            <span className="text-[10px] font-mono text-white/30 w-12 flex-none">{item.time}</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${sevColors[item.severity]} w-16 text-center flex-none`}>
              {item.severity.toUpperCase()}
            </span>
            <span className="text-xs text-white/70 flex-1 truncate">{item.event}</span>
            <span className="text-[10px] font-mono text-[#00D4FF]/60 bg-[#00D4FF]/5 px-2 py-0.5 rounded flex-none">{item.chain}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AgentStatus = () => {
  const agents = [
    { name: 'SAST Scanner', status: 'active', scans: 1247, icon: Eye },
    { name: 'DAST Fuzzer', status: 'active', scans: 834, icon: Zap },
    { name: 'AI Verifier', status: 'active', scans: 2103, icon: Bot },
    { name: 'Chain Monitor', status: 'active', scans: 5621, icon: Globe },
    { name: 'Heal Engine', status: 'idle', scans: 412, icon: CheckCircle },
    { name: 'CVE Tracker', status: 'active', scans: 89, icon: AlertTriangle },
  ];

  return (
    <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50 flex items-center gap-2">
          <Bot size={14} className="text-[#00D4FF]" />
          Autonomous AI Agents
        </h3>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
          24/7 ACTIVE
        </span>
      </div>
      <div className="space-y-2">
        {agents.map((agent, i) => {
          const Icon = agent.icon;
          return (
            <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-black/30 rounded-lg border border-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded ${agent.status === 'active' ? 'bg-[#00D4FF]/10 text-[#00D4FF]' : 'bg-white/5 text-white/30'}`}>
                  <Icon size={14} />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/80">{agent.name}</p>
                  <p className="text-[10px] font-mono text-white/30">{agent.scans.toLocaleString()} scans today</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {agent.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                <span className={`text-[10px] font-mono uppercase ${agent.status === 'active' ? 'text-emerald-400' : 'text-white/30'}`}>
                  {agent.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ExecutiveDashboard = () => {
  const [loading, setLoading] = useState(true);

  const severityData = [
    { name: 'Critical', value: 23, color: COLORS.critical },
    { name: 'High', value: 67, color: COLORS.high },
    { name: 'Medium', value: 134, color: COLORS.medium },
    { name: 'Low', value: 289, color: COLORS.low },
    { name: 'Secure', value: 1893, color: COLORS.secure },
  ];

  const weeklyData = [
    { day: 'Mon', scans: 342, threats: 23 },
    { day: 'Tue', scans: 487, threats: 31 },
    { day: 'Wed', scans: 523, threats: 18 },
    { day: 'Thu', scans: 612, threats: 42 },
    { day: 'Fri', scans: 734, threats: 27 },
    { day: 'Sat', scans: 298, threats: 12 },
    { day: 'Sun', scans: 412, threats: 19 },
  ];

  const chainData = [
    { chain: 'Ethereum', audits: 1247, fill: '#627EEA' },
    { chain: 'Polygon', audits: 834, fill: '#8247E5' },
    { chain: 'BSC', audits: 623, fill: '#F3BA2F' },
    { chain: 'Arbitrum', audits: 412, fill: '#28A0F0' },
    { chain: 'Optimism', audits: 298, fill: '#FF0420' },
  ];

  const radialData = [
    { name: 'Detection Rate', value: 99.7, fill: COLORS.secure },
    { name: 'Auto-Heal Success', value: 94.2, fill: COLORS.accent },
    { name: 'False Positive Rate', value: 2.1, fill: COLORS.medium },
    { name: 'Response Time', value: 87.5, fill: COLORS.high },
  ];

    const { auditHistoryList, syncAuditHistory } = useStore();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get('http://127.0.0.1:8000/history');
        syncAuditHistory(data);
      } catch (err) {
        console.error('History fetch failed:', err);
      } finally {
        setTimeout(() => setLoading(false), 1000);
      }
    };
    fetchHistory();
  }, [syncAuditHistory]);

  const tooltipStyle = {
    backgroundColor: '#090D16',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    fontSize: '11px',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="animate-spin text-[#00D4FF] mx-auto mb-3" size={32} />
          <p className="text-xs font-mono text-white/40 tracking-wider">Loading Executive Telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1800px] mx-auto text-white">
      {/* Header */}
      <header className="mb-6 pb-4 border-b border-white/[0.06] flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">Executive Security Operations Center</h1>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-sm text-white/40">Real-time smart contract threat intelligence & AI agent orchestration</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-white/40">
          <span className="flex items-center gap-1.5"><Server size={12} className="text-emerald-400" /> Backend: Online</span>
          <span className="flex items-center gap-1.5"><Database size={12} className="text-emerald-400" /> DB: Connected</span>
          <span className="flex items-center gap-1.5"><Network size={12} className="text-emerald-400" /> Chain: Synced</span>
        </div>
      </header>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Activity} label="Total Assessments" value="2,412,847" sublabel="All-time contract scans" tone="neutral" pulse />
        <KpiCard icon={ShieldAlert} label="Critical Threats Found" value="1,247" sublabel="Last 30 days" tone="critical" pulse />
        <KpiCard icon={ShieldCheck} label="Contracts Secured" value="99.7%" sublabel="Detection accuracy" tone="success" pulse />
        <KpiCard icon={TrendingUp} label="AI Agents Active" value="6/6" sublabel="24/7 autonomous operation" tone="warning" pulse />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Severity Donut */}
        <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50 mb-4 flex items-center gap-2">
            <ShieldAlert size={14} className="text-red-400" />
            Vulnerability Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="value" stroke="none">
                  {severityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Scan Volume */}
        <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50 mb-4 flex items-center gap-2">
            <Activity size={14} className="text-[#00D4FF]" />
            Weekly Scan Volume
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" stroke="#1a2332" tick={{ fill: '#7C92AD', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#1a2332" tick={{ fill: '#7C92AD', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="scans" stroke="#00D4FF" fill="url(#scanGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radial Performance */}
        <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50 mb-4 flex items-center gap-2">
            <Cpu size={14} className="text-emerald-400" />
            System Performance
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} layout="vertical" verticalAlign="middle" align="right" />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <LiveFeed />
        <AgentStatus />
        {/* Chain Distribution */}
        <div className="bg-[#090D16] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50 mb-4 flex items-center gap-2">
            <Globe size={14} className="text-[#00D4FF]" />
            Chain Distribution
          </h3>
          <div className="space-y-3">
            {chainData.map((item, i) => {
              const maxAudits = Math.max(...chainData.map(c => c.audits));
              const pct = (item.audits / maxAudits) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs font-medium text-white/80">{item.chain}</span>
                    </div>
                    <span className="text-xs font-mono text-white/60">{item.audits.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, backgroundColor: item.fill }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.05]">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 mb-3 flex items-center gap-2">
              <Lock size={11} /> Latest Deployments Monitored
            </h4>
            <div className="space-y-2">
              {[
                { addr: '0x7a3b...f2e1', risk: 'High', time: '3m ago' },
                { addr: '0x9c4d...a8b2', risk: 'Critical', time: '7m ago' },
                { addr: '0x2f1e...c3d4', risk: 'Secure', time: '12m ago' },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 bg-black/30 rounded text-xs">
                  <span className="font-mono text-[#00D4FF]/80">{d.addr}</span>
                  <span className={`font-bold ${d.risk === 'Critical' ? 'text-red-400' : d.risk === 'High' ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {d.risk}
                  </span>
                  <span className="text-white/30 font-mono text-[10px]">{d.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
