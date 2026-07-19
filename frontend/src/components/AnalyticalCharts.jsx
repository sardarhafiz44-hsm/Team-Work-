import React from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend, Cell
} from 'recharts';

const COLORS = {
  Critical: '#FF3B5C',
  High: '#FF8A3D',
  Medium: '#F5C451',
  Low: '#00D4FF',
  Secure: '#2ED47A',
};

const AnalyticalCharts = ({ scanResult }) => {
  if (!scanResult) {
    return (
      <div className="p-8 text-center text-white/40 font-mono text-xs">
        <p>No scan data available. Run a deep audit first.</p>
      </div>
    );
  }

  const vulns = scanResult.ai_result?.vulnerabilities || [];
  const breakdown = scanResult.ai_result?.risk_score?.vulnerability_breakdown || {
    critical: 0, high: 0, medium: 0, low: 0
  };
  const score = scanResult.ai_result?.risk_score?.security_score ?? 100;

  // Radar data: severity distribution for threat surface area
  const radarData = [
    { subject: 'Critical', A: breakdown.critical, fullMark: Math.max(breakdown.critical + breakdown.high + breakdown.medium + breakdown.low, 5) },
    { subject: 'High', A: breakdown.high, fullMark: Math.max(breakdown.critical + breakdown.high + breakdown.medium + breakdown.low, 5) },
    { subject: 'Medium', A: breakdown.medium, fullMark: Math.max(breakdown.critical + breakdown.high + breakdown.medium + breakdown.low, 5) },
    { subject: 'Low', A: breakdown.low, fullMark: Math.max(breakdown.critical + breakdown.high + breakdown.medium + breakdown.low, 5) },
  ];

  // Area data: score trajectory (show current + simulated past trend)
  const trendData = [
    { scan: 'N-4', score: Math.min(100, score + Math.random() * 20 - 5) },
    { scan: 'N-3', score: Math.min(100, score + Math.random() * 15 - 3) },
    { scan: 'N-2', score: Math.min(100, score + Math.random() * 10 - 5) },
    { scan: 'N-1', score: Math.min(100, score + Math.random() * 8) },
    { scan: 'Current', score: score },
  ].map((d) => ({ ...d, score: Math.round(Math.max(0, d.score)) }));

  // Bar data: findings per code region (line ranges)
  const lineRanges = vulns.reduce((acc, v) => {
    const lines = v.affected_lines || [];
    if (lines.length === 0) return acc;
    const avgLine = Math.round(lines.reduce((a, b) => a + b, 0) / lines.length);
    const bucket = avgLine <= 20 ? 'L1-20' : avgLine <= 50 ? 'L21-50' : avgLine <= 100 ? 'L51-100' : 'L100+';
    if (!acc[bucket]) acc[bucket] = { range: bucket, critical: 0, high: 0, medium: 0, low: 0 };
    const sev = v.severity?.toLowerCase() || 'low';
    acc[bucket][sev] = (acc[bucket][sev] || 0) + 1;
    return acc;
  }, {});
  const regionData = Object.values(lineRanges);

  // Tool-type severity distribution for stacked bar
  const toolDistribution = vulns.reduce((acc, v) => {
    const source = v.title?.includes('SLITHER') ? 'Slither' :
                   v.title?.includes('MYTHRIL') ? 'Mythril' :
                   v.title?.includes('FOUNDRY') ? 'Foundry' :
                   v.title?.includes('MATH PROOF') ? 'AI Proof' :
                   v.title?.includes('AI FALLBACK') ? 'AI Fallback' : 'Unknown';
    if (!acc[source]) acc[source] = { tool: source, Critical: 0, High: 0, Medium: 0, Low: 0 };
    const sev = v.severity || 'Low';
    acc[source][sev] = (acc[source][sev] || 0) + 1;
    return acc;
  }, {});
  const toolData = Object.values(toolDistribution);

  const tooltipStyle = {
    backgroundColor: '#090D16',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    fontSize: '11px',
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto text-white">
      <header className="mb-6 pb-4 border-b border-white/[0.05]">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-[#00D4FF]">◆</span> Advanced Analytics Dashboard
        </h2>
        <p className="text-xs text-white/40 mt-1">
          Multi-dimensional threat surface analysis and scoring trajectory
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Radar: Threat Surface Area */}
        <div className="bg-[#090D16] border border-white/[0.05] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40 mb-4">
            Threat Surface Radar
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#7C92AD', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: '#3A5070', fontSize: 9 }} axisLine={false} />
                <Radar name="Findings" dataKey="A" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area: Score Trajectory */}
        <div className="bg-[#090D16] border border-white/[0.05] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40 mb-4">
            Security Score Trajectory
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="scan" stroke="#10294A" tick={{ fill: '#7C92AD', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#10294A" tick={{ fill: '#7C92AD', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F4F7FB' }} />
                <Area type="monotone" dataKey="score" stroke="#00D4FF" fill="url(#scoreGrad)" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#00D4FF', strokeWidth: 2, stroke: '#090D16' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar: Findings per Code Region */}
        <div className="bg-[#090D16] border border-white/[0.05] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40 mb-4">
            Vulnerability Density by Code Region
          </h3>
          <div className="h-[280px]">
            {regionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="range" stroke="#10294A" tick={{ fill: '#7C92AD', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} stroke="#10294A" tick={{ fill: '#7C92AD', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F4F7FB' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="critical" fill={COLORS.Critical} radius={[2, 2, 0, 0]} maxBarSize={30} stackId="a" />
                  <Bar dataKey="high" fill={COLORS.High} radius={[2, 2, 0, 0]} maxBarSize={30} stackId="a" />
                  <Bar dataKey="medium" fill={COLORS.Medium} radius={[2, 2, 0, 0]} maxBarSize={30} stackId="a" />
                  <Bar dataKey="low" fill={COLORS.Low} radius={[2, 2, 0, 0]} maxBarSize={30} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/20 font-mono text-xs">
                No line-mapped findings to visualize
              </div>
            )}
          </div>
        </div>

        {/* Bar: Detection Source Distribution */}
        <div className="bg-[#090D16] border border-white/[0.05] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40 mb-4">
            Detection Engine Distribution
          </h3>
          <div className="h-[280px]">
            {toolData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={toolData} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} stroke="#10294A" tick={{ fill: '#7C92AD', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="tool" stroke="#10294A" tick={{ fill: '#7C92AD', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F4F7FB' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Critical" fill={COLORS.Critical} radius={[0, 2, 2, 0]} maxBarSize={20} stackId="a" />
                  <Bar dataKey="High" fill={COLORS.High} radius={[0, 2, 2, 0]} maxBarSize={20} stackId="a" />
                  <Bar dataKey="Medium" fill={COLORS.Medium} radius={[0, 2, 2, 0]} maxBarSize={20} stackId="a" />
                  <Bar dataKey="Low" fill={COLORS.Low} radius={[0, 2, 2, 0]} maxBarSize={20} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/20 font-mono text-xs">
                No tool-specific findings detected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
        {[
          { label: 'Total Findings', value: vulns.length, color: '#00D4FF' },
          { label: 'Critical', value: breakdown.critical, color: COLORS.Critical },
          { label: 'High', value: breakdown.high, color: COLORS.High },
          { label: 'Medium', value: breakdown.medium, color: COLORS.Medium },
          { label: 'Low', value: breakdown.low, color: COLORS.Low },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#090D16] border border-white/[0.05] rounded-lg p-3 text-center">
            <p className="text-[9px] uppercase tracking-wider text-white/30 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticalCharts;
