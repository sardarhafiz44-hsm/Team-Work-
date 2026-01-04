import React from 'react';
import { ShieldCheck, AlertTriangle, Bug, CheckCircle, ChevronDown, ChevronUp, Clock, FileCode, Zap, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AuditResults = ({ data }) => {
  if (!data) return null;

  // Score Color Helper
  const getScoreColor = (score) => {
    if (score >= 80) return "text-cyber-success border-cyber-success shadow-[0_0_15px_rgba(0,255,157,0.3)]";
    if (score >= 50) return "text-yellow-400 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]";
    return "text-cyber-danger border-cyber-danger shadow-[0_0_15px_rgba(255,0,60,0.3)]";
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* --- TOP ROW: SCORE & STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Score Card */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 bg-gradient-to-br from-black to-gray-900 border border-gray-800 rounded-xl p-6 flex items-center justify-between relative overflow-hidden"
        >
            <div className="relative z-10">
                <h3 className="text-gray-400 text-xs font-mono uppercase tracking-widest mb-1">Audit Score</h3>
                <div className={`text-6xl font-black tracking-tighter ${getScoreColor(data.risk_score).split(' ')[0]}`}>
                    {data.risk_score}
                    <span className="text-2xl text-gray-500 font-medium ml-1">/100</span>
                </div>
                <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
                   {data.risk_score < 80 && <AlertTriangle size={14} className="text-cyber-danger"/>}
                   {data.risk_score >= 80 ? "Contract is Secure" : "Critical Vulnerabilities Detected"}
                </p>
            </div>
            {/* Animated Ring */}
            <div className={`relative z-10 w-24 h-24 rounded-full border-[6px] flex items-center justify-center bg-black/50 backdrop-blur-sm ${getScoreColor(data.risk_score)}`}>
               <ShieldCheck size={42} />
            </div>
            {/* Background Glow */}
            <div className={`absolute right-0 top-0 w-64 h-64 bg-opacity-10 blur-[80px] rounded-full pointer-events-none ${data.risk_score >= 80 ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </motion.div>

        {/* 2. Quick Stats Grid */}
        <div className="grid grid-rows-3 gap-2">
            <div className="bg-cyber-gray border border-gray-800 rounded-lg px-4 flex items-center gap-3">
                <Clock className="text-cyber-primary" size={18} />
                <div>
                    <p className="text-[10px] text-gray-500 uppercase">Scan Duration</p>
                    <p className="text-white font-mono text-sm">1.2s (AI Mode)</p>
                </div>
            </div>
            <div className="bg-cyber-gray border border-gray-800 rounded-lg px-4 flex items-center gap-3">
                <FileCode className="text-cyber-secondary" size={18} />
                <div>
                    <p className="text-[10px] text-gray-500 uppercase">Engine</p>
                    <p className="text-white font-mono text-sm">Gemini Flash 2.0</p>
                </div>
            </div>
            <div className="bg-cyber-gray border border-gray-800 rounded-lg px-4 flex items-center gap-3">
                <Zap className="text-yellow-400" size={18} />
                <div>
                    <p className="text-[10px] text-gray-500 uppercase">Gas Check</p>
                    <p className="text-white font-mono text-sm">Enabled</p>
                </div>
            </div>
        </div>
      </div>

      {/* --- SECTION 2: VULNERABILITIES LIST --- */}
      <div>
        <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Bug className="text-cyber-primary" />
            Security Issues Found
            <span className="bg-cyber-danger text-black text-xs px-2 py-0.5 rounded-full font-bold">
                {data.vulnerabilities?.length || 0}
            </span>
        </h4>

        {/* No Issues State */}
        {(!data.vulnerabilities || data.vulnerabilities.length === 0) && (
            <div className="bg-green-900/10 border border-green-900/30 rounded-xl p-8 text-center">
                <CheckCircle className="mx-auto mb-3 text-cyber-success" size={48} />
                <h3 className="text-xl font-bold text-white">No Issues Found</h3>
                <p className="text-gray-400 text-sm mt-1">Your contract looks safe!</p>
            </div>
        )}

        <div className="space-y-3">
            {data.vulnerabilities?.map((vuln, index) => (
            <VulnerabilityCard key={index} vuln={vuln} />
            ))}
        </div>
      </div>

    </div>
  );
};

// --- SUB-COMPONENT: EXPANDABLE CARD ---
const VulnerabilityCard = ({ vuln }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const severityColors = {
    Critical: "bg-red-500/20 text-red-400 border-red-500/50",
    High: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    Low: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  };

  return (
    <motion.div 
        layout
        className={`border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-cyber-primary ring-1 ring-cyber-primary/50 bg-[#0f0f16]' : 'border-gray-800 bg-cyber-gray hover:border-gray-600'}`}
    >
      {/* CARD HEADER */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-4">
            {/* Severity Badge */}
            <span className={`px-3 py-1 rounded text-xs font-bold border uppercase tracking-wider ${severityColors[vuln.severity] || severityColors.Medium}`}>
                {vuln.severity}
            </span>
            
            <div>
                <h5 className="font-bold text-gray-100 group-hover:text-cyber-primary transition-colors text-base">
                    {vuln.title}
                </h5>
                <div className="flex items-center gap-3 mt-1">
                    {/* UPDATED LINE LOGIC HERE: Shows list of lines if available */}
                    <span className="text-xs text-gray-500 font-mono">
                        Line(s): {vuln.affected_lines ? vuln.affected_lines.join(", ") : vuln.line_number}
                    </span>
                </div>
            </div>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-cyber-primary"/> : <ChevronDown size={20} className="text-gray-500 group-hover:text-white"/>}
      </div>

      {/* EXPANDED CONTENT */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-800 bg-black/30"
          >
            <div className="p-5 space-y-5">
                
                {/* 1. Description */}
                <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-gray-700 pl-4">
                    {vuln.description}
                </p>

                {/* 2. IMPACT */}
                <div className="flex gap-4 bg-red-500/5 border border-red-500/20 p-4 rounded-lg">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h6 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-1">Potential Impact</h6>
                        <p className="text-red-200/80 text-sm">{vuln.impact}</p>
                    </div>
                </div>

                {/* 3. SUGGESTED FIX */}
                <div>
                    <h6 className="text-cyber-success font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Terminal size={14} /> Suggested Fix
                    </h6>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyber-secondary to-cyber-primary rounded-lg blur opacity-20 group-hover:opacity-40 transition"></div>
                        <div className="relative bg-[#050507] p-4 rounded-lg border border-gray-700 overflow-x-auto shadow-inner">
                            <pre className="text-cyber-success font-mono text-xs whitespace-pre-wrap">
                                <code>{vuln.fixed_code_snippet || "// No specific code snippet available"}</code>
                            </pre>
                        </div>
                    </div>
                </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AuditResults;