import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, TrendingDown, CheckCircle } from 'lucide-react';

const DeploySimulation = ({ vulnerabilities, score, attackSimulation }) => {
  // REAL analysis based on actual findings - NO fake numbers!
  const criticalCount = vulnerabilities.filter(v => v.severity === 'Critical').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'High').length;
  const mediumCount = vulnerabilities.filter(v => v.severity === 'Medium').length;
  const lowCount = vulnerabilities.filter(v => v.severity === 'Low').length;

  const riskLevel = score < 40 ? 'CRITICAL' : score < 70 ? 'HIGH' : score < 90 ? 'MEDIUM' : 'LOW';
  const riskColor = score < 40 ? '#FF3B5C' : score < 70 ? '#FF8A3D' : score < 90 ? '#F5C451' : '#00ff88';

  // Show ACTUAL vulnerabilities found - no fake data!
  const actualFindings = vulnerabilities.map((v, i) => ({
    title: v.title,
    severity: v.severity,
    description: v.description,
    lines: v.affected_lines || [],
    remediation: v.remediation
  }));

  return (
    <div className="bg-gradient-to-br from-[#090D16] to-[#0a1628] border border-white/[0.05] rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <AlertTriangle className="text-red-400" size={20} />
        Deploy Risk Assessment
      </h3>

      {/* Risk Level - Based on ACTUAL score */}
      <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: riskColor, backgroundColor: `${riskColor}10` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wider">Deployment Recommendation</p>
            <p className="text-2xl font-bold mt-1" style={{ color: riskColor }}>
              {riskLevel} RISK
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60 uppercase tracking-wider">Security Score</p>
            <p className="text-2xl font-bold mt-1" style={{ color: riskColor }}>
              {score}/100
            </p>
          </div>
        </div>
      </div>

      {/* Actual Vulnerabilities Found - REAL DATA */}
      <div className="space-y-3">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
          Vulnerabilities Detected ({vulnerabilities.length} total)
        </p>
        
        {actualFindings.length === 0 ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-sm text-emerald-400 flex items-center gap-2">
              <CheckCircle size={16} />
              No vulnerabilities detected. Contract appears secure.
            </p>
          </div>
        ) : (
          actualFindings.map((finding, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 bg-black/30 rounded-lg border border-white/[0.03] hover:border-red-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      finding.severity === 'Critical' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                      finding.severity === 'High' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                      finding.severity === 'Medium' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                      'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/30'
                    }`}>
                      {finding.severity.toUpperCase()}
                    </span>
                    {finding.lines.length > 0 && (
                      <span className="text-[10px] text-white/40 font-mono">
                        Lines: {finding.lines.join(', ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{finding.title}</p>
                  <p className="text-xs text-white/60 mt-1 line-clamp-2">{finding.description}</p>
                </div>
              </div>
              {finding.remediation && (
                <div className="mt-2 pt-2 border-t border-white/[0.05]">
                  <p className="text-[10px] text-emerald-400 font-semibold mb-1">Remediation:</p>
                  <p className="text-xs text-white/70">{finding.remediation}</p>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* HONEST Recommendation */}
      <div className="mt-6 p-4 bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-lg">
        <p className="text-xs font-semibold text-[#00D4FF] mb-2 flex items-center gap-2">
          <ShieldAlert size={14} />
          Professional Recommendation
        </p>
        <p className="text-xs text-white/70 leading-relaxed">
          {score < 40
            ? `DO NOT DEPLOY. Found ${criticalCount} critical and ${highCount} high severity vulnerabilities. Fix all issues before deployment.`
            : score < 70
            ? `HIGH RISK. Found ${highCount} high severity issues. Deploy only on testnet. Fix critical issues before mainnet.`
            : score < 90
            ? `MEDIUM RISK. Found ${mediumCount} medium severity issues. Acceptable for testnet. Review before mainnet deployment.`
            : `LOW RISK. Contract appears secure with ${lowCount} low severity findings. Standard monitoring recommended.`}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
          <p className="text-[9px] text-white/40 uppercase">Critical</p>
          <p className="text-lg font-bold text-red-400">{criticalCount}</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 text-center">
          <p className="text-[9px] text-white/40 uppercase">High</p>
          <p className="text-lg font-bold text-orange-400">{highCount}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-center">
          <p className="text-[9px] text-white/40 uppercase">Medium</p>
          <p className="text-lg font-bold text-yellow-400">{mediumCount}</p>
        </div>
        <div className="bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-lg p-2 text-center">
          <p className="text-[9px] text-white/40 uppercase">Low</p>
          <p className="text-lg font-bold text-[#00D4FF]">{lowCount}</p>
        </div>
      </div>
    </div>
  );
};

export default DeploySimulation;
