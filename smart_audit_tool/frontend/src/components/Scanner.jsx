import React, { useState } from 'react';
import { Play, ShieldAlert, FileCode, Loader2, Globe, AlertCircle, ArrowRight, ShieldCheck, Plus } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import AuditResults from './AuditResults';

const Scanner = () => {
  // --- STATES ---
  const [code, setCode] = useState('');
  const [filename, setFilename] = useState('MyContract.sol');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null); 
  const [language, setLanguage] = useState('English');
  
  // History States
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  // Searchable Languages
  const allLanguages = [
    "Afrikaans", "Albanian", "Amharic", "Arabic (العربية)", "Armenian",
    "Bengali (বাংলা)", "Chinese (Simplified)", "Dutch (Nederlands)",
    "English", "French (Français)", "German (Deutsch)",
    "Hindi (हिंदी)", "Indonesian", "Italian (Italiano)",
    "Japanese (日本語)", "Korean (한국어)", "Pashto (پښتو)", 
    "Persian (Farsi)", "Portuguese", "Punjabi (پنجابی)",
    "Russian (Русский)", "Sindhi (سنڌي)", "Spanish (Español)", 
    "Turkish (Türkçe)", "Urdu (اردو)", "Vietnamese"
  ];

  const lineNumbers = code.split('\n').map((_, i) => i + 1).join('\n');

  // --- ACTIONS ---

  const fetchHistory = async () => {
    try {
        setLoading(true);
        const response = await axios.get('http://127.0.0.1:8000/history');
        setHistoryData(response.data);
        setShowHistory(true);
        setResult(null);
        setError(null);
    } catch (err) {
        console.error(err);
        alert("Failed to fetch history. Make sure Backend is running!");
    } finally {
        setLoading(false);
    }
  };

  const handleNewScan = () => {
    setShowHistory(false);
    setResult(null);
    setError(null);
    setCode('');
    setFilename('MyContract.sol');
  };

  const handleScan = async (type) => {
    if (!code) return alert("Please enter some Solidity code first!");
    setLoading(true);
    setResult(null);
    setError(null);
    setShowHistory(false);

    try {
      const endpoint = type === 'quick' ? 'http://127.0.0.1:8000/scan' : 'http://127.0.0.1:8000/deep-audit';
      
      const response = await axios.post(endpoint, {
        project_name: "Demo Project",
        filename: filename,
        code: code,
        language: language 
      });
      
      if (response.data.status === "Error") {
        setError(response.data.details); 
      } else {
        const data = response.data.ai_result || response.data.data;
        if (data) {
            setResult(data);
        } else {
            setError("No data received from AI.");
        }
      }

    } catch (err) {
      console.error(err);
      setError("Server Connection Failed!");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item) => {
    setResult(item.result); 
    setShowHistory(false);  
  };

  return (
    // MAIN CONTAINER: Screen Height Fix (h-screen)
    <div className="max-w-[1600px] mx-auto p-4 flex flex-col h-screen overflow-hidden">
      
      {/* --- TOP HEADER --- */}
      <header className="flex-none flex justify-between items-center mb-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyber-primary to-blue-500 rounded-lg flex items-center justify-center shadow-neon">
                <ShieldCheck className="text-black w-6 h-6" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    SolShield <span className="text-cyber-primary text-sm font-mono px-2 py-0.5 border border-cyber-primary/30 rounded bg-cyber-primary/10">AI AUDITOR</span>
                </h1>
            </div>
        </div>

        <div className="flex gap-3">
            <button 
                onClick={fetchHistory}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                    showHistory ? 'bg-cyber-primary text-black' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
            >
                <div className="w-4 h-4 border-2 border-current rounded-full flex items-center justify-center">
                    <div className="w-0.5 h-2 bg-current rotate-45"></div>
                </div>
                History
            </button>

            <button 
                onClick={handleNewScan}
                className="bg-cyber-gray border border-cyber-primary text-cyber-primary px-4 py-2 rounded-lg hover:bg-cyber-primary hover:text-black transition-all font-bold text-sm flex items-center gap-2 shadow-neon"
            >
                <Plus size={16} /> New Scan
            </button>
        </div>
      </header>

      {/* --- MAIN GRID (Flex-1 + min-h-0 is KEY for scrolling) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 pb-4">
        
        {/* LEFT: INPUT */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="bg-cyber-gray border border-gray-800 rounded-xl p-4 shadow-2xl flex flex-col h-full min-h-0"
        >
          {/* Filename & Language Bar (Fixed Height) */}
          <div className="flex-none flex items-center justify-between mb-2 pb-2 border-b border-gray-800">
              <div className="flex items-center gap-3 w-1/2">
                  <FileCode className="text-cyber-secondary w-5 h-5" />
                  <input 
                      type="text" 
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      className="bg-transparent text-white font-mono text-sm focus:outline-none w-full"
                      placeholder="Contract Name.sol"
                  />
              </div>
              <div className="flex items-center gap-2 w-1/2 justify-end relative">
                  <Globe size={16} className="text-gray-400 shrink-0"/>
                  <input 
                      list="world-languages"
                      type="text" 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="bg-black text-cyber-primary text-xs border border-gray-700 rounded px-2 py-1 focus:border-cyber-primary outline-none w-full text-right font-bold placeholder-gray-600 transition-all"
                      placeholder="Type Language..."
                  />
                  <datalist id="world-languages">
                      {allLanguages.map((lang, index) => (
                          <option key={index} value={lang} />
                      ))}
                  </datalist>
              </div>
          </div>

          {/* Code Editor (Flexible Height with Scroll) */}
          <div className="flex-1 flex relative overflow-hidden bg-[#0a0a12] rounded-lg border border-gray-800 focus-within:border-cyber-primary transition-colors min-h-0">
              <div className="bg-[#161622] text-gray-500 font-mono text-sm p-3 text-right select-none border-r border-gray-800 w-12 overflow-hidden leading-6">
                  <pre>{lineNumbers}</pre>
              </div>
              <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 bg-transparent text-gray-300 font-mono text-sm p-3 focus:outline-none resize-none custom-scrollbar leading-6 whitespace-pre h-full"
                  placeholder="// Paste Solidity Code Here..."
                  spellCheck="false"
              ></textarea>
          </div>

          {/* Action Buttons (Fixed Bottom) */}
          <div className="flex-none flex gap-3 mt-4">
              <button 
                  onClick={() => handleScan('quick')}
                  disabled={loading}
                  className="flex-1 bg-cyber-gray border border-cyber-primary text-cyber-primary py-2 rounded-lg hover:bg-cyber-primary hover:text-black transition-all font-bold text-sm flex items-center justify-center gap-2"
              >
                  {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Play size={16} />} 
                  Quick Scan
              </button>
              <button 
                  onClick={() => handleScan('deep')}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-cyber-secondary to-blue-600 text-white py-2 rounded-lg hover:opacity-90 transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-neon"
              >
                 {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <ShieldAlert size={16} />}
                 Deep Audit (AI)
              </button>
          </div>
        </motion.div>

        {/* RIGHT: DASHBOARD */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="bg-cyber-gray border border-gray-800 rounded-xl p-4 shadow-2xl h-full min-h-0 flex flex-col relative"
        >
          {/* Header (Fixed) */}
          <div className="flex-none flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <ShieldAlert className="text-cyber-primary" size={18} />
                  {showHistory ? "Scan History" : "Audit Report"}
              </h3>
          </div>

          {/* Scrollable Content Area (min-h-0 is CRITICAL here) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-2 pb-10">
              {loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-cyber-primary">
                      <Loader2 className="animate-spin w-10 h-10 mb-2" />
                      <p className="text-xs animate-pulse">Analyzing Smart Contract...</p>
                  </div>
              ) : error ? (
                  <div className="text-red-400 p-4 text-center border border-red-500/30 bg-red-500/10 rounded">
                      <AlertCircle className="mx-auto mb-2" />
                      <p className="text-sm font-mono">{error}</p>
                  </div>
              ) : showHistory ? (
                  // HISTORY
                  <div className="space-y-3">
                      <p className="text-gray-500 text-xs mb-2">Last 10 Scans (Click to Open):</p>
                      {historyData.map((item) => (
                          <div 
                              key={item.id} 
                              onClick={() => loadFromHistory(item)}
                              className="bg-[#0a0a12] p-3 rounded border border-gray-800 hover:border-cyber-primary cursor-pointer transition-all group flex justify-between items-center"
                          >
                              <div>
                                  <h4 className="text-white text-sm font-bold font-mono">{item.filename}</h4>
                                  <p className="text-gray-500 text-xs">{item.date}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                      item.risk_score < 50 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                  }`}>
                                      Score: {item.risk_score}
                                  </span>
                                  <ArrowRight size={14} className="text-gray-600 group-hover:text-cyber-primary" />
                              </div>
                          </div>
                      ))}
                      {historyData.length === 0 && <p className="text-gray-500 text-center text-sm">No history found.</p>}
                  </div>
              ) : result ? (
                  // RESULT
                  <AuditResults data={result} />
              ) : (
                  // EMPTY STATE (Ab ye zaroor nazar aye ga)
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                      <ShieldCheck size={64} className="mb-4 text-gray-600" />
                      <p className="text-lg font-bold">Ready to Audit</p>
                      <p className="text-sm">Select Language & Start Deep Audit</p>
                  </div>
              )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Scanner;