import React, { useState, useEffect } from 'react';
import { Settings, Key, Palette, Globe, Save, RotateCcw, Eye, EyeOff, Check, Cpu } from 'lucide-react';

const SettingsPanel = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState({});

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('solshield_config');
    return saved ? JSON.parse(saved) : {
      projectName: 'Default Project',
      backendUrl: 'http://127.0.0.1:8000',
      language: 'English',
      autoHealEnabled: true,
      notifications: true,
      blockchainEnabled: false,
      rpcUrl: 'http://127.0.0.1:7545',
      scanTimeout: 60,
      compactMode: false,
      apiKeys: {
        groq: '',
        cerebras: '',
        openrouter: '',
        huggingface: ''
      }
    };
  });

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const updateApiKey = (provider, value) => {
    setConfig((prev) => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [provider]: value }
    }));
    setSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('solshield_config', JSON.stringify(config));
      localStorage.setItem('solshield_backend_url', config.backendUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      alert('Settings saved successfully!');
    } catch (e) {
      alert('Failed to save settings');
    }
  };

  const handleReset = () => {
    if (confirm('Reset all settings to default?')) {
      const defaults = {
        projectName: 'Default Project',
        backendUrl: 'http://127.0.0.1:8000',
        language: 'English',
        autoHealEnabled: true,
        notifications: true,
        blockchainEnabled: false,
        rpcUrl: 'http://127.0.0.1:7545',
        scanTimeout: 60,
        compactMode: false,
        apiKeys: { groq: '', cerebras: '', openrouter: '', huggingface: '' }
      };
      setConfig(defaults);
      localStorage.removeItem('solshield_config');
      setSaved(false);
    }
  };

  const Toggle = ({ checked, onChange }) => (
    <button onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-[#00D4FF]' : 'bg-white/10'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : ''}`} />
    </button>
  );

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security & API', icon: Key },
    { id: 'blockchain', label: 'Blockchain', icon: Globe },
    { id: 'display', label: 'Display', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Cpu },
  ];

  return (
    <div className="p-8 max-w-[1400px] mx-auto text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="text-[#00D4FF]" size={32} />
          Settings
        </h1>
        <p className="text-white/40 mt-2">Configure SolShield Pro engine parameters and preferences</p>
      </header>

      <div className="flex gap-8">
        <nav className="w-64 flex-none space-y-2">
          {sections.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeSection === id ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30' : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
              }`}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex-1 bg-[#090D16] border border-white/[0.05] rounded-xl p-8">
          {activeSection === 'general' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Settings size={24} className="text-[#00D4FF]" />
                General Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Default Project Name</label>
                  <input type="text" value={config.projectName} onChange={(e) => updateConfig('projectName', e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00D4FF]/50 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Backend API URL</label>
                  <input type="text" value={config.backendUrl} onChange={(e) => updateConfig('backendUrl', e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00D4FF]/50 transition-colors" />
                  <p className="text-xs text-white/30 mt-2">Default: http://127.0.0.1:8000</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Audit Language</label>
                  <select value={config.language} onChange={(e) => updateConfig('language', e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00D4FF]/50">
                    <option value="English">English</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Chinese">Chinese</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-4 border-t border-white/[0.05]">
                  <div>
                    <p className="text-sm font-medium">Auto-Heal Module</p>
                    <p className="text-xs text-white/30">Enable AI-powered automatic vulnerability patching</p>
                  </div>
                  <Toggle checked={config.autoHealEnabled} onChange={(v) => updateConfig('autoHealEnabled', v)} />
                </div>

                <div className="flex items-center justify-between py-4 border-t border-white/[0.05]">
                  <div>
                    <p className="text-sm font-medium">Desktop Notifications</p>
                    <p className="text-xs text-white/30">Show alerts for critical findings</p>
                  </div>
                  <Toggle checked={config.notifications} onChange={(v) => updateConfig('notifications', v)} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Key size={24} className="text-[#00D4FF]" />
                Security & API Keys
              </h2>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-xs text-yellow-400">⚠️ API keys are stored locally in your browser. Never share your keys!</p>
              </div>

              <div className="space-y-4">
                {Object.entries(config.apiKeys).map(([provider, key]) => (
                  <div key={provider}>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                      {provider.charAt(0).toUpperCase() + provider.slice(1)} API Key
                    </label>
                    <div className="relative">
                      <input type={showApiKeys[provider] ? 'text' : 'password'} value={key}
                        onChange={(e) => updateApiKey(provider, e.target.value)}
                        placeholder={`Enter ${provider} API key...`}
                        className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 pr-12 text-sm text-white font-mono focus:outline-none focus:border-[#00D4FF]/50" />
                      <button onClick={() => setShowApiKeys(prev => ({ ...prev, [provider]: !prev[provider] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                        {showApiKeys[provider] ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'blockchain' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Globe size={24} className="text-[#00D4FF]" />
                Blockchain Configuration
              </h2>

              <div className="flex items-center justify-between py-4 border-b border-white/[0.05]">
                <div>
                  <p className="text-sm font-medium">On-Chain Audit Recording</p>
                  <p className="text-xs text-white/30">Record audit hashes to blockchain for immutability</p>
                </div>
                <Toggle checked={config.blockchainEnabled} onChange={(v) => updateConfig('blockchainEnabled', v)} />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">RPC Endpoint URL</label>
                <input type="text" value={config.rpcUrl} onChange={(e) => updateConfig('rpcUrl', e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00D4FF]/50" />
                <p className="text-xs text-white/30 mt-2">Ganache default: http://127.0.0.1:7545</p>
              </div>

              <div className="bg-black/30 border border-white/[0.05] rounded-lg p-4">
                <p className="text-xs font-semibold text-white/50 mb-3">Supported Networks</p>
                <div className="flex flex-wrap gap-2">
                  {['Ethereum', 'Polygon', 'BSC', 'Arbitrum', 'Optimism', 'Avalanche'].map((chain) => (
                    <span key={chain} className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20">{chain}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'display' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Palette size={24} className="text-[#00D4FF]" />
                Display Preferences
              </h2>

              <div className="flex items-center justify-between py-4 border-b border-white/[0.05]">
                <div>
                  <p className="text-sm font-medium">Compact Mode</p>
                  <p className="text-xs text-white/30">Reduce spacing for denser information display</p>
                </div>
                <Toggle checked={config.compactMode} onChange={(v) => updateConfig('compactMode', v)} />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Scan Timeout (seconds)</label>
                <input type="number" value={config.scanTimeout} onChange={(e) => updateConfig('scanTimeout', parseInt(e.target.value) || 60)}
                  min={10} max={120}
                  className="w-32 bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00D4FF]/50" />
              </div>
            </div>
          )}

          {activeSection === 'advanced' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Cpu size={24} className="text-[#00D4FF]" />
                Advanced Configuration
              </h2>

              <div className="bg-black/40 border border-white/[0.05] rounded-lg p-6">
                <p className="text-sm font-semibold text-white/50 mb-4">Engine Status</p>
                <div className="space-y-3">
                  {[
                    { name: 'Slither SAST', status: 'Active', color: '#00ff88' },
                    { name: 'Groq AI', status: config.apiKeys.groq ? 'Connected' : 'Not Configured', color: config.apiKeys.groq ? '#00ff88' : '#F5C451' },
                    { name: 'Cerebras Cloud', status: config.apiKeys.cerebras ? 'Connected' : 'Not Configured', color: config.apiKeys.cerebras ? '#00ff88' : '#F5C451' },
                    { name: 'OpenRouter', status: config.apiKeys.openrouter ? 'Connected' : 'Not Configured', color: config.apiKeys.openrouter ? '#00ff88' : '#F5C451' },
                    { name: 'HuggingFace', status: config.apiKeys.huggingface ? 'Connected' : 'Not Configured', color: config.apiKeys.huggingface ? '#00ff88' : '#F5C451' },
                    { name: 'Blockchain Ledger', status: config.blockchainEnabled ? 'Active' : 'Disabled', color: config.blockchainEnabled ? '#00ff88' : '#7C92AD' },
                  ].map((engine) => (
                    <div key={engine.name} className="flex items-center justify-between py-2">
                      <span className="text-sm text-white/70">{engine.name}</span>
                      <span className="text-xs font-mono font-bold uppercase" style={{ color: engine.color }}>
                        ● {engine.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black/40 border border-white/[0.05] rounded-lg p-6">
                <p className="text-sm font-semibold text-white/50 mb-4">System Information</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-white/30">Version</p><p className="text-white/80 font-mono">3.0.0</p></div>
                  <div><p className="text-white/30">AI Models</p><p className="text-white/80 font-mono">Groq + Multi-Model</p></div>
                  <div><p className="text-white/30">Database</p><p className="text-white/80 font-mono">SQLite</p></div>
                  <div><p className="text-white/30">Frontend</p><p className="text-white/80 font-mono">React 19 + Vite</p></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8 pt-6 border-t border-white/[0.05]">
            <button onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#00D4FF] text-black hover:brightness-110 shadow-[0_0_20px_rgba(0,212,255,0.3)]'
              }`}>
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? 'Settings Saved!' : 'Save Configuration'}
            </button>
            <button onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors">
              <RotateCcw size={16} />
              Reset Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;