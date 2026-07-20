import React from 'react';
import Sidebar from './components/Sidebar';
import Scanner from './components/Scanner';
import ExecutiveDashboard from './components/ExecutiveDashboard';
import AuditHistory from './components/AuditHistory';
import MyProjects from './components/MyProjects';
import SettingsPanel from './components/SettingsPanel';
import AnalyticalCharts from './components/AnalyticalCharts';
import useStore from './store/useStore';

function App() {
  const activeTab = useStore((state) => state.activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'Executive Dashboard': return <ExecutiveDashboard />;
      case 'Audit History': return <AuditHistory />;
      case 'Deep Audit Suite': return <Scanner />;
      case 'My Projects': return <MyProjects />;
      case 'Settings': return <SettingsPanel />;
      case 'Analytics': return <AnalyticalCharts />;
      default: return <ExecutiveDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#050B14] overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;