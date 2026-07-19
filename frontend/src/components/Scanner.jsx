import React, { useState, useRef, useCallback } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import axios from 'axios';
import { Play, ShieldCheck, Maximize2, Minimize2, FileCode2, Loader2, Globe, RotateCcw, FileDown, Check, X, GitCompareArrows } from 'lucide-react';
import AuditResults from './AuditResults';
import useStore from '../store/useStore';
import './solshield-editor.css';

const BASE = 'http://127.0.0.1:8000';
const SEVERITY_CLASS = { Critical: 'ssx-critical', High: 'ssx-high', Medium: 'ssx-medium', Low: 'ssx-low' };
const SEVERITY_HEX = { Critical: '#FF3B5C', High: '#FF8A3D', Medium: '#F5C451', Low: '#00D4FF' };

const Scanner = () => {
  const { isScanLoading, latestScanResult, startScanPipeline, commitScanSuccess, commitScanFailure, activeProjectContext } = useStore();
  const [code, setCode] = useState('');
  const [filename, setFilename] = useState('MyContract.sol');
  const [language, setLanguage] = useState('English');
  const [healingTitle, setHealingTitle] = useState(null);
  const [error, setError] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [pendingPatch, setPendingPatch] = useState(null);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef(null);

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.defineTheme('solshield', {
      base: 'vs-dark', inherit: true, rules: [],
      colors: {
        'editor.background': '#090D16',
        'editorLineNumber.foreground': '#1A365D',
        'editorLineNumber.activeForeground': '#00D4FF',
        'editor.lineHighlightBackground': '#00D4FF0A',
        'diffEditor.insertedTextBackground': '#10B9811A',
        'diffEditor.removedTextBackground': '#EF44441A',
      }
    });
    monaco.editor.setTheme('solshield');
    decorationsRef.current = editor.createDecorationsCollection();
  };

  const applyDecorations = useCallback((vulnerabilities = []) => {
    const monaco = monacoRef.current;
    if (!monaco || !decorationsRef.current) return;
    const decos = [];
    vulnerabilities.forEach((v) => {
      const cls = SEVERITY_CLASS[v.severity] || 'ssx-medium';
      const hex = SEVERITY_HEX[v.severity] || '#F5C451';
      (v.affected_lines || []).forEach((line) => {
        decos.push({
          range: new monaco.Range(line, 1, line, 1),
          options: {
            isWholeLine: true, className: `ssx-line ${cls}`,
            glyphMarginClassName: `ssx-glyph ${cls}`,
            glyphMarginHoverMessage: { value: `**${v.severity}** · ${v.title}` },
            overviewRuler: { color: hex, position: monaco.editor.OverviewRulerLane.Right },
            minimap: { color: hex, position: monaco.editor.MinimapPosition.Inline },
          },
        });
      });
    });
    decorationsRef.current.set(decos);
  }, []);

  const clearDecorations = () => decorationsRef.current?.clear();

  const locateVuln = useCallback((vuln) => {
    const line = vuln.affected_lines?.[0];
    if (line && editorRef.current) {
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
    }
  }, []);

  const runScan = async (mode, sourceOverride) => {
    const source = sourceOverride ?? code;
    if (!source.trim()) { setError('Load target contract bytes inside code workspace panel.'); return; }
    
    startScanPipeline(); setError(null); clearDecorations();
    try {
      const endpoint = mode === 'quick' ? `${BASE}/scan` : `${BASE}/deep-audit`;
      const { data } = await axios.post(endpoint, {
        project_name: activeProjectContext, filename, code: source, language
      }, { timeout: 35000 });
      
      if (data.status === 'Error') { setError(data.details); commitScanFailure(); return; }
      commitScanSuccess(data);
      applyDecorations(data.ai_result?.vulnerabilities);
    } catch (err) {
      setError('Core analysis layer communication crash. Verify local FastAPI microserver engine loop status.');
      commitScanFailure();
    }
  };

  const autoHeal = async (vuln) => {
    setHealingTitle(vuln.title);
    try {
      const { data } = await axios.post(`${BASE}/auto-heal`, {
        code, issue_title: vuln.title, issue_description: vuln.description,
      });
      if (data.fixed_code) setPendingPatch({ code: data.fixed_code, vuln });
      else setError('Remediation instance failed to build logical diff schema patches.');
    } catch (err) {
      setError('Remediation core interface unreachable error trace.');
    } finally {
      setHealingTitle(null);
    }
  };

  const acceptPatch = () => {
    const patched = pendingPatch.code;
    setCode(patched);
    setPendingPatch(null);
    runScan('deep', patched);
  };

  return (
    <div className="h-screen flex flex-col bg-[#090D16] text-white">
      <header className="flex-none flex items-center justify-between h-16 px-8 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Deep Audit Suite</h1>
          <p className="text-xs text-white/40 mt-0.5">Static analysis orchestration matrix with structural AI remediation modules</p>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-5 p-5">
        {/* Editor Panel Engine Viewport */}
        <div className={`bg-white/[0.01] border border-white/[0.05] rounded-xl flex flex-col overflow-hidden ${fullscreen ? 'fixed inset-3 z-50' : 'h-full'}`}>
          <div className="flex items-center justify-between px-4 h-12 border-b border-white/[0.05] bg-black/20 flex-none">
            <div className="flex items-center gap-2 min-w-0">
              <FileCode2 size={16} className="text-[#00D4FF] flex-none" />
              <input value={filename} onChange={(e) => setFilename(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none focus:text-[#00D4FF] w-40" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setCode(''); commitScanSuccess(null); clearDecorations(); }} className="p-1.5 rounded-md text-white/40 hover:text-white"><RotateCcw size={15} /></button>
              <button onClick={() => setFullscreen(!fullscreen)} className="p-1.5 rounded-md text-white/40 hover:text-[#00D4FF]">{fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Editor height="100%" defaultLanguage="sol" language="sol" value={code} onChange={(val) => setCode(val ?? '')} onMount={handleMount}
              options={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', minimap: { enabled: true }, glyphMargin: true, scrollBeyondLastLine: false }} />
          </div>
          <div className="flex gap-3 p-3 border-t border-white/[0.05] bg-black/20 flex-none">
            <button onClick={() => runScan('quick')} disabled={isScanLoading} className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-white/[0.05] hover:bg-white/[0.02]">Quick Scan</button>
            <button onClick={() => runScan('deep')} disabled={isScanLoading} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-[#00D4FF] text-[#090D16] hover:brightness-110 shadow-[0_0_20px_rgba(0,212,255,0.2)]">
              {isScanLoading ? <Loader2 size={15} className="animate-spin" /> : 'Execute Deep Audit'}
            </button>
          </div>
        </div>

        {/* Results Component Viewport Target */}
        <div className="bg-white/[0.01] border border-white/[0.05] rounded-xl overflow-y-auto">
          {error && <div className="m-4 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400 font-mono">{error}</div>}
          {latestScanResult ? (
            <div className="p-5">
              <AuditResults data={latestScanResult} onAutoHeal={autoHeal} onLocate={locateVuln} healingTitle={healingTitle} />
            </div>
          ) : !error && (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 text-white/20">
              <ShieldCheck size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium text-white/40">Audit Engine Pipelines Standing By</p>
              <p className="text-xs mt-1">Load target compiler bytes block configuration layout arrays to visualize findings vector traces.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- Dynamic Code Differential Patch Overlay Box System --- */}
      {pendingPatch && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex flex-col p-4 animate-fadeIn">
          <div className="flex-1 bg-[#090D16] border border-white/[0.05] rounded-xl flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.05] bg-black/40 flex-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <GitCompareArrows size={18} className="text-[#00D4FF]" />
                <div>
                  <p className="text-sm font-semibold truncate">Remediation Core Patch Differential Review</p>
                  <p className="text-[10px] text-white/40">Left Column: Isolated Production Code Environment | Right Column: Proposed System Patch Layout Matrix</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPendingPatch(null)} className="px-3 py-1.5 text-xs font-semibold border border-white/[0.05] rounded-md hover:text-red-400">Discard Patch</button>
                <button onClick={acceptPatch} className="px-3 py-1.5 text-xs font-semibold bg-[#00D4FF] text-[#090D16] rounded-md hover:brightness-110">Accept & Execute Automated Rescan</button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <DiffEditor height="100%" language="sol" original={code} modified={pendingPatch.code}
                onMount={(_, monaco) => monaco.editor.setTheme('solshield')} options={{ readOnly: true, renderSideBySide: true, fontSize: 13 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Scanner;