import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import Editor from '@monaco-editor/react';
import useStore from '../store/useStore';
import { Play, ShieldCheck, FileCode2, Loader2, AlertTriangle, Rocket, Zap, CheckCircle } from 'lucide-react';
import axios from 'axios';

const BASE = 'http://127.0.0.1:8000';
const SEV_BADGE = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Low: 'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/30',
};

const Scanner = () => {
  const [filename, setFilename] = useState('MyContract.sol');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const commitScanSuccess = useStore((s) => s.commitScanSuccess);
  const [error, setError] = useState(null);
  const [editorValue, setEditorValue] = useState('');
  const editorRef = useRef(null);

  const handleScan = async () => {
    if (!editorValue.trim()) { setError('Please enter Solidity code first!'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const { data } = await axios.post(`${BASE}/deep-audit`, {
        project_name: "Audit Project", filename, code: editorValue, language: "English"
      }, { timeout: 60000 });
      if (data.status === 'Success') { setResult(data); commitScanSuccess(data); }
      else { setError('Audit failed. Please try again.'); }
    } catch (err) {
      setError('Backend connection failed. Make sure backend is running on port 8000.');
    } finally { setLoading(false); }
  };

  const handleExportPDF = () => {
    if (!result) { alert('No audit results to export!'); return; }
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(0, 212, 255);
    doc.text('SolShield Pro - Audit Report', 20, 20);
    doc.setFontSize(12); doc.setTextColor(0, 0, 0);
    doc.text(`File: ${filename}`, 20, 35);
    doc.text(`Date: ${new Date().toLocaleString()}`, 20, 45);
    const score = result?.ai_result?.risk_score?.security_score ?? 100;
    const tier = result?.ai_result?.risk_score?.risk_tier ?? "Low Risk";
    doc.text(`Security Score: ${score}/100`, 20, 55);
    doc.text(`Risk Level: ${tier}`, 20, 65);
    doc.setFontSize(14); doc.text('Vulnerabilities Found:', 20, 80);
    let yPos = 90;
    const vulns = result?.ai_result?.vulnerabilities ?? [];
    vulns.forEach((v, i) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      doc.setFontSize(11); doc.setTextColor(200, 0, 0);
      doc.text(`${i+1}. [${v.severity || 'Medium'}] ${v.title || 'Unknown'}`, 20, yPos);
      yPos += 7; doc.setTextColor(0, 0, 0); doc.setFontSize(9);
      const desc = v.description || '';
      const splitDesc = doc.splitTextToSize(desc.substring(0, 200), 170);
      doc.text(splitDesc, 20, yPos); yPos += splitDesc.length * 5 + 5;
    });
    doc.save(`SolShield_Audit_${filename.replace('.sol','')}.pdf`);
  };

  const score = result?.ai_result?.risk_score?.security_score ?? 100;
  const tier = result?.ai_result?.risk_score?.risk_tier ?? "Low Risk";
  const vulns = result?.ai_result?.vulnerabilities ?? [];
  const colorCode = result?.ai_result?.risk_score?.ui_metadata?.color_code ?? "#00ff88";
  const ai = result?.ai_result;

  return (
    <div className="min-h-full bg-[#050B14] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-white">SOL</span>
            <span className="text-[#00D4FF]">SHIELD</span>
            <span className="text-white/40 text-lg ml-2">PRO</span>
          </h1>
          <p className="text-white/40 text-sm">AI-Powered Smart Contract Security Auditor</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#090D16] border border-white/[0.05] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 h-12 border-b border-white/[0.05] bg-black/20">
              <div className="flex items-center gap-2">
                <FileCode2 size={16} className="text-[#00D4FF]" />
                <input value={filename} onChange={(e) => setFilename(e.target.value)}
                  className="bg-transparent text-sm font-mono focus:outline-none text-white" />
              </div>
            </div>
            <Editor
              height="400px"
              defaultLanguage="sol"
              value={editorValue}
              onChange={(value) => setEditorValue(value || '')}
              onMount={(editor) => { editorRef.current = editor; }}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: 'JetBrains Mono, monospace',
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 16, bottom: 16 },
              }}
            />
            <div className="p-4 border-t border-white/[0.05]">
              <button onClick={handleScan} disabled={loading}
                className="w-full py-3 rounded-lg font-bold text-sm bg-[#00D4FF] text-black hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                {loading ? 'Auditing...' : 'Execute Deep Audit'}
              </button>
              {result && (
                <button onClick={handleExportPDF}
                  className="w-full mt-2 py-2.5 rounded-lg font-bold text-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center justify-center gap-2">
                  <FileCode2 size={16} /> Export PDF Report
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-400">{error}</div>
            )}
            {!result && !error && (
              <div className="bg-[#090D16] border border-white/[0.05] rounded-xl p-12 text-center">
                <ShieldCheck className="mx-auto mb-3 text-white/20" size={48} />
                <p className="text-white/40 text-sm">Paste Solidity code in the editor and click "Execute Deep Audit"</p>
              </div>
            )}
            {result && (
              <>
                <div className="bg-[#090D16] border border-white/[0.05] rounded-xl p-6 text-center">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Security Score</p>
                  <p className="text-6xl font-bold mb-2" style={{ color: colorCode }}>{score}</p>
                  <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: colorCode }}>{tier}</p>
                </div>

                <div className="bg-[#090D16] border border-white/[0.05] rounded-xl p-6">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-400" />
                    Vulnerabilities Found ({vulns.length})
                  </h3>
                  {vulns.length === 0 ? (
                    <p className="text-emerald-400 text-sm flex items-center gap-2">
                      <CheckCircle size={16} /> No vulnerabilities detected
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {vulns.map((v, i) => (
                        <div key={i} className="p-3 bg-black/30 rounded-lg border border-white/[0.03]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${SEV_BADGE[v.severity] || SEV_BADGE.Medium}`}>
                              {v.severity?.toUpperCase() || 'MEDIUM'}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-white">{v.title}</p>
                          <p className="text-xs text-white/60 mt-1">{v.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-[#090D16] border border-white/[0.05] rounded-xl p-6">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-400" />
                    Deploy Risk Assessment
                  </h3>
                  <div className="p-4 rounded-lg border-2 mb-4" style={{ borderColor: colorCode, backgroundColor: `${colorCode}10` }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider">Recommendation</p>
                        <p className="text-xl font-bold mt-1" style={{ color: colorCode }}>
                          {score < 40 ? 'DO NOT DEPLOY' : score < 70 ? 'TESTNET ONLY' : score < 90 ? 'REVIEW NEEDED' : 'SAFE TO DEPLOY'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/60 uppercase tracking-wider">Score</p>
                        <p className="text-xl font-bold mt-1" style={{ color: colorCode }}>{score}/100</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-white/70 leading-relaxed">
                    {score < 40
                      ? `DO NOT DEPLOY. Found ${vulns.filter(v => v.severity === 'Critical').length} critical and ${vulns.filter(v => v.severity === 'High').length} high severity vulnerabilities.`
                      : score < 70
                      ? `HIGH RISK. Deploy only on testnet. Fix critical issues before mainnet.`
                      : score < 90
                      ? `MEDIUM RISK. Acceptable for testnet. Review before mainnet deployment.`
                      : `LOW RISK. Contract appears secure. Standard monitoring recommended.`}
                  </div>
                </div>

                {ai?.ai_attacks_display && ai.ai_attacks_display.length > 0 && (
                  <div className="bg-[#090D16] border border-red-500/20 rounded-xl p-6">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-400" />
                      AI Attack Simulation ({ai.ai_attacks_display.length} attacks)
                    </h3>
                    <div className="space-y-3">
                      {ai.ai_attacks_display.map((attack, i) => (
                        <div key={i} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-white">{attack.name}</p>
                            <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">{attack.difficulty}</span>
                          </div>
                          <p className="text-xs text-white/60 mb-2">Target: {attack.target}</p>
                          {attack.prerequisites && attack.prerequisites.length > 0 && (
                            <div className="mb-2">
                              <p className="text-[10px] text-white/40 uppercase mb-1">Prerequisites:</p>
                              <div className="flex flex-wrap gap-1">
                                {attack.prerequisites.map((req, j) => (
                                  <span key={j} className="text-[10px] bg-black/30 px-2 py-0.5 rounded text-white/70">{req}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {attack.steps && attack.steps.length > 0 && (
                            <div className="space-y-1 mb-2">
                              {attack.steps.map((step, j) => (
                                <div key={j} className="flex gap-2 text-xs">
                                  <span className="text-red-400 font-bold flex-none">{step.step}.</span>
                                  <div>
                                    <p className="text-white/80">{step.action}</p>
                                    {step.code && <code className="text-[10px] text-emerald-400 bg-black/40 px-2 py-0.5 rounded block mt-0.5">{step.code}</code>}
                                    {step.explanation && <p className="text-white/50 text-[10px] mt-0.5">{step.explanation}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-xs text-red-400">Funds at Risk: ${attack.funds_at_risk?.toLocaleString()}</span>
                            <span className="text-xs text-orange-400">Success: {attack.success_probability}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ai?.compliance && (
                  <div className="bg-[#090D16] border border-[#00D4FF]/20 rounded-xl p-6">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-[#00D4FF]" />
                      ERC Compliance Report
                    </h3>
                    <div className="p-4 rounded-lg border-2 mb-4" style={{
                      borderColor: ai.compliance.compliance_score >= 80 ? '#00ff88' : ai.compliance.compliance_score >= 50 ? '#F5C451' : '#FF3B5C',
                      backgroundColor: `${ai.compliance.compliance_score >= 80 ? '#00ff88' : ai.compliance.compliance_score >= 50 ? '#F5C451' : '#FF3B5C'}10`
                    }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white/60 uppercase">Contract Type</p>
                          <p className="text-xl font-bold mt-1" style={{ color: ai.compliance.compliance_score >= 80 ? '#00ff88' : ai.compliance.compliance_score >= 50 ? '#F5C451' : '#FF3B5C' }}>{ai.compliance.contract_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/60 uppercase">Compliance Score</p>
                          <p className="text-2xl font-bold" style={{ color: ai.compliance.compliance_score >= 80 ? '#00ff88' : ai.compliance.compliance_score >= 50 ? '#F5C451' : '#FF3B5C' }}>{ai.compliance.compliance_score}/100</p>
                        </div>
                      </div>
                    </div>
                    {ai.compliance.standards_checked && ai.compliance.standards_checked.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-white/40 uppercase mb-2">Standards Checked</p>
                        <div className="flex flex-wrap gap-2">
                          {ai.compliance.standards_checked.map((std, i) => (
                            <span key={i} className="text-xs bg-[#00D4FF]/10 text-[#00D4FF] px-3 py-1 rounded-full border border-[#00D4FF]/30">{std}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ai.compliance.missing_functions && ai.compliance.missing_functions.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-red-400 uppercase mb-2">Missing Functions</p>
                        <div className="space-y-1">
                          {ai.compliance.missing_functions.map((func, i) => (
                            <div key={i} className="text-xs bg-red-500/10 border border-red-500/30 rounded px-3 py-2 text-red-400">{func}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {ai.compliance.recommendations && ai.compliance.recommendations.length > 0 && (
                      <div className="p-3 bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-lg">
                        <p className="text-xs text-[#00D4FF] uppercase mb-2">Recommendations</p>
                        <ul className="space-y-1">
                          {ai.compliance.recommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-white/70">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {ai?.gas_analysis && ai.gas_analysis.total_issues > 0 && (
                  <div className="bg-[#090D16] border border-yellow-500/20 rounded-xl p-6">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <Zap size={16} className="text-yellow-400" />
                      Gas Optimization ({ai.gas_analysis.total_issues} issues)
                    </h3>
                    <div className="p-4 rounded-lg border-2 mb-4 border-yellow-500/30 bg-yellow-500/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white/60 uppercase">Potential Savings</p>
                          <p className="text-2xl font-bold text-yellow-400">{ai.gas_analysis.total_savings_gwei.toLocaleString()} gwei</p>
                          <p className="text-xs text-emerald-400">${ai.gas_analysis.total_savings_usd_per_tx}/tx</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/60 uppercase">Optimization Score</p>
                          <p className="text-2xl font-bold text-emerald-400">{ai.gas_analysis.optimization_score}/100</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {ai.gas_analysis.issues.map((issue, i) => (
                        <div key={i} className="p-3 bg-black/30 rounded-lg border border-white/[0.03]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              issue.severity === 'High' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                              issue.severity === 'Medium' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                              'bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/30'
                            }`}>{issue.severity.toUpperCase()}</span>
                            <span className="text-xs text-white/80">{issue.title}</span>
                          </div>
                          <p className="text-xs text-white/60 mb-1">{issue.description}</p>
                          <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/30">
                            <p className="text-[10px] text-emerald-400 uppercase mb-1">Recommendation</p>
                            <p className="text-xs text-white/80">{issue.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ai?.deployment_estimate && (
                  <div className="bg-[#090D16] border border-white/[0.05] rounded-xl p-6">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <Rocket size={16} className="text-[#00D4FF]" />
                      Deployment Simulator
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {Object.entries(ai.deployment_estimate.deployment_costs || {}).map(([speed, data]) => (
                        <div key={speed} className="p-3 bg-black/30 rounded-lg border border-white/[0.03]">
                          <p className="text-[10px] text-white/60 uppercase mb-1 flex items-center gap-1"><Zap size={10} /> {speed}</p>
                          <p className="text-sm font-bold text-white">{data.total_gas?.toLocaleString()} gas</p>
                          <p className="text-xs text-emerald-400">${data.cost_usd}</p>
                        </div>
                      ))}
                    </div>
                    {ai.deployment_simulation?.recommendations && (
                      <div className="p-3 bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded-lg">
                        <p className="text-[10px] text-[#00D4FF] uppercase mb-2">Recommendations</p>
                        <ul className="space-y-1">
                          {ai.deployment_simulation.recommendations.suggested_actions?.map((action, i) => (
                            <li key={i} className="text-xs text-white/70">• {action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanner;