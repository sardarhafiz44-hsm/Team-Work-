import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Gas, DollarSign, Clock, CheckCircle, AlertTriangle, Network } from 'lucide-react';

const DeploymentPanel = ({ deploymentEstimate, deploymentSimulation, deploymentVisualization, score }) => {
  if (!deploymentEstimate || !deploymentSimulation) {
    return null;
  }

  const isSafeToDeploy = deploymentVisualization.safe_to_deploy;
  const deployColor = isSafeToDeploy ? '#00ff88' : '#FF3B5C';

  return (
    <div className="bg-gradient-to-br from-[#090D16] to-[#0a1628] border border-white/[0.05] rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Rocket className="text-[#00D4FF]" size={20} />
        Deployment Simulator
      </h3>

      {/* Deployment Status */}
      <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: deployColor, backgroundColor: `${deployColor}10` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wider">Deployment Status</p>
            <p className="text-2xl font-bold mt-1" style={{ color: deployColor }}>
              {isSafeToDeploy ? 'READY' : 'NOT SAFE'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60 uppercase tracking-wider">Network</p>
            <p className="text-sm font-semibold text-white mt-1 flex items-center gap-1">
              <Network size={14} />
              {deploymentSimulation.network}
            </p>
          </div>
        </div>
      </div>

      {/* Gas Estimation */}
      <div className="mb-6">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Gas size={14} />
          Gas Estimation
        </p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(deploymentEstimate.deployment_costs).map(([speed, data]) => (
            <div key={speed} className="p-3 bg-black/30 rounded-lg border border-white/[0.03]">
              <p className="text-[10px] text-white/60 uppercase mb-1">{speed}</p>
              <p className="text-sm font-bold text-white">{data.total_gas.toLocaleString()} gas</p>
              <p className="text-xs text-white/60">{data.cost_eth} ETH</p>
              <p className="text-xs text-emerald-400">${data.cost_usd}</p>
              <p className="text-[10px] text-white/40 mt-1">{data.estimated_time}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment Cost */}
      <div className="mb-6 p-4 bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-lg">
        <p className="text-xs text-[#00D4FF] uppercase tracking-wider mb-2">Simulated Deployment Cost</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">${deploymentSimulation.deployment_cost_usd}</span>
          <span className="text-sm text-white/60">({deploymentSimulation.deployment_cost_eth} ETH)</span>
        </div>
        <p className="text-xs text-white/40 mt-1">Gas Used: {deploymentSimulation.gas_used.toLocaleString()} units</p>
      </div>

      {/* Transaction Details */}
      <div className="mb-6 space-y-2">
        <p className="text-xs text-white/40 uppercase tracking-wider">Transaction Details</p>
        <div className="p-3 bg-black/30 rounded-lg border border-white/[0.03] font-mono text-xs">
          <div className="flex justify-between py-1">
            <span className="text-white/60">TX Hash:</span>
            <span className="text-[#00D4FF] truncate ml-2">{deploymentSimulation.transaction_hash.slice(0, 20)}...</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-white/60">Block:</span>
            <span className="text-white">#{deploymentSimulation.block_number.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-white/60">Contract:</span>
            <span className="text-[#00D4FF] truncate ml-2">{deploymentSimulation.contract_address.slice(0, 20)}...</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className={`p-4 rounded-lg border ${isSafeToDeploy ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        <p className={`text-xs font-semibold mb-2 flex items-center gap-2 ${isSafeToDeploy ? 'text-emerald-400' : 'text-red-400'}`}>
          {isSafeToDeploy ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {isSafeToDeploy ? 'Deployment Recommendations' : 'Critical Issues - Do Not Deploy'}
        </p>
        <ul className="space-y-1">
          {deploymentSimulation.recommendations.suggested_actions.map((action, i) => (
            <li key={i} className="text-xs text-white/70 flex items-start gap-2">
              <span className="text-white/40 mt-0.5">•</span>
              {action}
            </li>
          ))}
        </ul>
      </div>

      {/* Deploy Button (Simulated) */}
      <button
        disabled={!isSafeToDeploy}
        className={`w-full mt-6 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
          isSafeToDeploy
            ? 'bg-gradient-to-r from-[#00D4FF] to-[#00ff88] text-black hover:opacity-90'
            : 'bg-white/5 text-white/30 cursor-not-allowed'
        }`}
      >
        <Rocket size={16} />
        {isSafeToDeploy ? 'Deploy to Testnet' : 'Fix Vulnerabilities First'}
      </button>
    </div>
  );
};

export default DeploymentPanel;
