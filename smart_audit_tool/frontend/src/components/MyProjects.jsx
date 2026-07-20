import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, ShieldCheck, ShieldAlert, Clock, FileCode2, Trash2, Loader2 } from 'lucide-react';
import useStore from '../store/useStore';
import axios from 'axios';

const MyProjects = () => {
  const { auditHistoryList, syncAuditHistory } = useStore();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const fetchAndGroup = async () => {
      try {
        const { data } = await axios.get('http://localhost:8000/history');
        syncAuditHistory(data);

        // Group audits by project_id
        const grouped = {};
        data.forEach((audit) => {
          const pId = audit.project_id || 'default';
          if (!grouped[pId]) {
            grouped[pId] = {
              id: pId,
              name: `Project #${pId}`,
              audits: [],
              avgScore: 0,
              lastScanned: audit.date,
              totalFindings: 0,
            };
          }
          grouped[pId].audits.push(audit);
          const vulns = audit.result?.vulnerabilities || [];
          grouped[pId].totalFindings += vulns.length;
        });

        // Calculate averages
        Object.values(grouped).forEach((p) => {
          const scores = p.audits.map((a) => a.risk_score);
          p.avgScore = scores.length
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 100;
        });

        const projectList = Object.values(grouped).sort(
          (a, b) => new Date(b.lastScanned) - new Date(a.lastScanned)
        );
        setProjects(projectList);
      } catch (err) {
        console.error('Project grouping failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAndGroup();
  }, [syncAuditHistory]);

  const getScoreColor = (score) => {
    if (score >= 90) return '#2ED47A';
    if (score >= 70) return '#F5C451';
    if (score >= 50) return '#FF8A3D';
    return '#FF3B5C';
  };

  const getRiskBadge = (score) => {
    if (score >= 90) return { label: 'SECURE', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    if (score >= 70) return { label: 'LOW RISK', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' };
    if (score >= 50) return { label: 'HIGH RISK', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
    return { label: 'CRITICAL', color: 'bg-red-500/15 text-red-400 border-red-500/30' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40">
        <Loader2 size={32} className="animate-spin text-[#00D4FF] mb-4" />
        <p className="font-mono text-xs tracking-[0.18em] uppercase">Loading project clusters...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto text-white">
      <header className="mb-6 pb-4 border-b border-white/[0.05] flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <FolderKanban className="text-[#00D4FF]" size={24} />
            My Projects
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Grouped audit intelligence across all tracked contract projects
          </p>
        </div>
        <span className="text-[11px] font-mono text-white/30 uppercase tracking-wider">
          {projects.length} project{projects.length !== 1 ? 's' : ''} tracked
        </span>
      </header>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center mb-4">
            <FolderKanban size={28} className="text-[#00D4FF] opacity-50" />
          </div>
          <p className="text-white/60 font-medium mb-1">No projects yet</p>
          <p className="text-white/30 text-sm max-w-sm">
            Run your first deep audit from the Deep Audit Suite to start tracking projects automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => {
            const badge = getRiskBadge(project.avgScore);
            return (
              <div
                key={project.id}
                onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
                className={`bg-[#090D16] border rounded-xl p-5 cursor-pointer transition-all hover:border-[#00D4FF]/30 ${
                  selectedProject === project.id
                    ? 'border-[#00D4FF]/50 shadow-[0_0_20px_rgba(0,212,255,0.1)]'
                    : 'border-white/[0.05]'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${getScoreColor(project.avgScore)}15` }}
                    >
                      <FileCode2 size={18} style={{ color: getScoreColor(project.avgScore) }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{project.name}</h3>
                      <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                        {project.audits.length} audit{project.audits.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-black/30 rounded-lg p-2.5 text-center">
                    <p className="text-[9px] uppercase text-white/30 tracking-wider">Avg Score</p>
                    <p className="text-lg font-bold font-mono" style={{ color: getScoreColor(project.avgScore) }}>
                      {project.avgScore}
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2.5 text-center">
                    <p className="text-[9px] uppercase text-white/30 tracking-wider">Findings</p>
                    <p className="text-lg font-bold font-mono text-white/80">{project.totalFindings}</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2.5 text-center">
                    <p className="text-[9px] uppercase text-white/30 tracking-wider">Files</p>
                    <p className="text-lg font-bold font-mono text-white/80">
                      {new Set(project.audits.map((a) => a.filename)).size}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-white/25 font-mono">
                  <Clock size={11} />
                  Last scanned: {project.lastScanned}
                </div>

                {/* Expanded project detail */}
                {selectedProject === project.id && (
                  <div className="mt-4 pt-4 border-t border-white/[0.05] space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 mb-2">
                      Recent Audits
                    </p>
                    {project.audits.slice(0, 5).map((audit) => (
                      <div
                        key={audit.id}
                        className="flex items-center justify-between py-2 px-3 bg-black/20 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          {audit.risk_score >= 90 ? (
                            <ShieldCheck size={13} className="text-emerald-400" />
                          ) : (
                            <ShieldAlert size={13} className="text-red-400" />
                          )}
                          <span className="text-xs text-white/70">{audit.filename}</span>
                        </div>
                        <span
                          className="text-xs font-mono font-bold"
                          style={{ color: getScoreColor(audit.risk_score) }}
                        >
                          {audit.risk_score}/100
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyProjects;
