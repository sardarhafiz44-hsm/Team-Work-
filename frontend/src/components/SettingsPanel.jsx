import React, { useState } from 'react';
import {
  Settings, Shield, Key, Palette, Database, Globe, Bell,
  Save, RotateCcw, Eye, EyeOff, Check, ExternalLink, Cpu
} from 'lucide-react';
import axios from 'axios';

const SettingsPanel = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [config, setConfig] = useState({
    projectName: 'Default Project',
    backendUrl: 'http://127.0.0.1:8000',
    language: 'English',
    autoHealEnabled: true,
    blockchainEnabled: false,
    rpcUrl: 'http://127.0.0.1:7545',
    scanTimeout: 35,
    theme: 'dark',
    notifications: true,
    compactMode: false,
  });

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // Persist to localStorage for session
    try {
      localStorage.setItem('solshield_config', JSON.stringify(config));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  const handleReset = () => {
    setConfig({
      projectName: 'Default Project',
      backendUrl: 'http://127.0.0.1:8000',
      language: 'English',
      autoHealEnabled: true,
      blockchainEnabled: false,
      rpcUrl: 'http://127.0.0.1:7545',
      scanTimeout: 35,
      theme: 'dark',
      notifications: true,
      compactMode: false,
    });
    setSaved(false);
  };

  // Load saved config on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('solshield_config');
      if (saved) setConfig(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const SECTIONS = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security & API', icon: Key },
    { id: 'blockchain', label: 'Blockchain', icon: Globe },
    { id: 'display', label: 'Display', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Cpu },
  ];

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-[#00D4FF]' : 'bg-white/10'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5.5 left-0.5' : 'left-0.5'
        }`}
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(0)' }}
      />
    </button>
  );

  return (
    <div className="p-8 max-w-[1200px] mx-auto text-white">
      <header className="mb-6 pb-4 border-b border-white/[0.05]">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <Settings className="text-[#00D4FF]" size={24} />
          Settings
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Configure SolShield Pro engine parameters and preferences
        </p>
      </header>

      <div className="flex gap-6">
        {/* Settings Navigation */}
        <nav className="w-52 flex-none space-y-1">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-[#00D4FF]/10 text-[#00D4FF]'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Icon size={16} className={active ? 'text-[#00D4FF]' : 'text-white/30'} />
                {section.label}
              </button>
            );
          })}
        </nav>

        {/* Settings Content */}
        <div className="flex-1 bg-[#090D16] border border-white/[0.05] rounded-xl p-6">
          {/* GENERAL */}
          {activeSection === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Settings size={18} className="text-[#00D4FF]" /> General Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                    Default Project Name
                  </label>
                  <input
                    type="text"
                    value={config.projectName}
                    onChange={(e) => updateConfig('projectName', e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00D4FF]/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                    Backend API URL
                  </label>
                  <input
                    type="text"
                    value={config.backendUrl}
                    onChange={(e) => updateConfig('backendUrl', e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00D4FF]/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                    Audit Language
                  </label>
                  <select
                    value={config.language}
                    onChange={(e) => updateConfig('language', e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00D4FF]/50"
                  >
                    <option value="English">English</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-white/[0.05]">
                  <div>
                    <p className="text-sm font-medium">Auto-Heal Module</p>
                    <p className="text-[11px] text-white/30">Enable AI-powered automatic vulnerability patching</p>
                  </div>
                  <Toggle checked={config.autoHealEnabled} onChange={(v) => updateConfig('autoHealEnabled', v)} />
                </div>

                <div className="flex items-center justify-between py-3 border-t border-white/[0.05]">
                  <div>
                    <p className="text-sm font-medium">Desktop Notifications</p>
                    <p className="text-[11px] text-white/30">Show alerts for critical findings</p>
                  </div>
                  <Toggle checked={config.notifications} onChange={(v) => updateConfig('notifications', v)} />
                </div>
              </div>
            </div>
          )}

          {/* SECURITY & API */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Key size={18} className="text-[#00D4FF]" /> Security & API Keys
              </h2>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-xs text-yellow-400 font-medium">
                  ⚠️ API keys are stored locally in your browser. Never share your keys.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                    Gemini API Key (Backend)
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="AIzaSy..."
                      className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2.5 pr-12 text-sm text-white font-mono focus:outline-none focus:border-[#00D4FF]/50"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-white/25 mt-1">
                    Configured in backend .env file — GEMINI_API_KEY
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                    WalletConnect Project ID
                  </label>
                  <input
                    type="text"
                    placeholder="Your WalletConnect project ID"
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00D4FF]/50"
                  />
                  <p className="text-[10px] text-white/25 mt-1">
                    Set as VITE_WALLET_CONNECT_PROJECT_ID in frontend .env
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* BLOCKCHAIN */}
          {activeSection === 'blockchain' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Globe size={18} className="text-[#00D4FF]" /> Blockchain Configuration
              </h2>

              <div className="flex items-center justify-between py-3 border-b border-white/[0.05]">
                <div>
                  <p className="text-sm font-medium">On-Chain Audit Recording</p>
                  <p className="text-[11px] text-white/30">Record audit hashes to blockchain for immutability</p>
                </div>
                <Toggle checked={config.blockchainEnabled} onChange={(v) => updateConfig('blockchainEnabled', v)} />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                    RPC Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={config.rpcUrl}
                    onChange={(e) => updateConfig('rpcUrl', e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00D4FF]/50"
                  />
                  <p className="text-[10px] text-white/25 mt-1">
                    Ganache default: http://127.0.0.1:7545
                  </p>
                </div>

                <div className="bg-black/30 border border-white/[0.05] rounded-lg p-4">
                  <p className="text-[11px] font-semibold text-white/50 mb-2">Supported Networks</p>
                  <div className="flex flex-wrap gap-2">
                    {['Ethereum', 'Polygon', 'BSC', 'Arbitrum', 'Optimism'].map((chain) => (
                      <span
                        key={chain}
                        className="px-3 py-1 rounded-md text-[11px] font-medium bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20"
                      >
                        {chain}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DISPLAY */}
          {activeSection === 'display' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Palette size={18} className="text-[#00D4FF]" /> Display Preferences
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/[0.05]">
                  <div>
                    <p className="text-sm font-medium">Compact Mode</p>
                    <p className="text-[11px] text-white/30">Reduce spacing for denser information display</p>
                  </div>
                  <Toggle checked={config.compactMode} onChange={(v) => updateConfig('compactMode', v)} />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                    Scan Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={config.scanTimeout}
                    onChange={(e) => updateConfig('scanTimeout', parseInt(e.target.value) || 35)}
                    min={10}
                    max={120}
                    className="w-32 bg-black/40 border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00D4FF]/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ADVANCED */}
          {activeSection === 'advanced' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Cpu size={18} className="text-[#00D4FF]" /> Advanced Configuration
              </h2>

              <div className="bg-black/40 border border-white/[0.05] rounded-lg p-4">
                <p className="text-[11px] font-semibold text-white/50 mb-3">Engine Status</p>
                <div className="space-y-2">
                  {[
                    { name: 'Slither SAST', status: 'Ready', color: '#2ED47A' },
                    { name: 'Mythril Symbolic', status: 'Ready', color: '#2ED47A' },
                    { name: 'Foundry DAST', status: 'Ready', color: '#2ED47A' },
                    { name: 'AI Formal Verification', status: 'Connected', color: '#2ED47A' },
                    { name: 'Blockchain Ledger', status: config.blockchainEnabled ? 'Active' : 'Disabled', color: config.blockchainEnabled ? '#2ED47A' : '#7C92AD' },
                  ].map((engine) => (
                    <div key={engine.name} className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-white/70">{engine.name}</span>
                      <span className="text-[10px] font-mono font-bold uppercase" style={{ color: engine.color }}>
                        ● {engine.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black/40 border border-white/[0.05] rounded-lg p-4">
                <p className="text-[11px] font-semibold text-white/50 mb-2">System Information</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-white/30">Version</p>
                    <p className="text-white/80 font-mono">1.1.0</p>
                  </div>
                  <div>
                    <p className="text-white/30">AI Model</p>
                    <p className="text-white/80 font-mono">Gemini 1.5 Flash</p>
                  </div>
                  <div>
                    <p className="text-white/30">Database</p>
                    <p className="text-white/80 font-mono">SQLite</p>
                  </div>
                  <div>
                    <p className="text-white/30">Frontend</p>
                    <p className="text-white/80 font-mono">React 19 + Vite</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save / Reset Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-white/[0.05]">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                saved
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#00D4FF] text-[#090D16] hover:brightness-110 shadow-[0_0_20px_rgba(0,212,255,0.2)]'
              }`}
            >
              {saved ? <Check size={15} /> : <Save size={15} />}
              {saved ? 'Settings Saved!' : 'Save Configuration'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors"
            >
              <RotateCcw size={15} />
              Reset Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
