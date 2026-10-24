import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket,
  RotateCcw,
  Clock,
  GitCommit,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { DeploymentJob } from '../types';

export const DeploymentHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [deployments, setDeployments] = useState<DeploymentJob[]>([
    {
      id: 'dep-449102',
      project_id: 'proj-1',
      project_name: 'payment-gateway-service',
      commit_hash: '9f2a87b',
      branch: 'main',
      status: 'succeeded',
      trigger_type: 'manual',
      started_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      duration_seconds: 42.1,
    },
    {
      id: 'dep-449101',
      project_id: 'proj-1',
      project_name: 'payment-gateway-service',
      commit_hash: '3e1c90a',
      branch: 'main',
      status: 'failed',
      trigger_type: 'webhook',
      started_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      duration_seconds: 28.5,
      error_message: 'Healthcheck timeout: port 3000 did not respond within 30s',
    },
  ]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    api.get<DeploymentJob[]>('/deployments').then((data) => {
      if (data && data.length > 0) setDeployments(data);
    }).catch(() => {});
  }, []);

  const handleRollback = async (depId: string) => {
    if (!window.confirm(`Deploy this specific build (${depId.slice(0, 8)}) as active revision?`)) return;
    try {
      await api.post(`/deployments/${depId}/rollback`);
      alert('Rollback deployed!');
    } catch (err: any) {
      alert(err?.message || 'Rollback failed');
    }
  };

  const filtered = deployments.filter((d) => {
    const matchesSearch =
      (d.project_name && d.project_name.toLowerCase().includes(search.toLowerCase())) ||
      d.commit_hash.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Deployment Pipeline History</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Audit logs of container image builds, commit revisions, durations, and rollback points
          </p>
        </div>

        <button
          onClick={() => navigate('/deployments/configure')}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all"
        >
          <Rocket className="w-4 h-4" />
          <span>New Deployment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project, commit hash, or deployment ID..."
            className="w-full pl-9 pr-4 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full sm:w-auto"
        >
          <option value="all">All Statuses</option>
          <option value="succeeded">Succeeded</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
          <option value="rolled_back">Rolled Back</option>
        </select>
      </div>

      {/* Table */}
      <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/90 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-navy-850 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-mono">
            <tr>
              <th className="py-2.5 px-3">Deployment ID</th>
              <th className="py-2.5 px-3">Target Project</th>
              <th className="py-2.5 px-3">Commit & Branch</th>
              <th className="py-2.5 px-3">Trigger</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-3 font-mono text-cyan-400 font-semibold">{d.id.slice(0, 10)}</td>
                <td className="py-3 px-3 font-semibold text-slate-200">{d.project_name || 'Container App'}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                    <GitCommit className="w-3.5 h-3.5 text-slate-500" />
                    <span>{d.commit_hash.slice(0, 7)}</span>
                    <span className="text-slate-500">({d.branch})</span>
                  </div>
                </td>
                <td className="py-3 px-3 capitalize text-slate-400">{d.trigger_type}</td>
                <td className="py-3 px-3 font-mono text-slate-400">{d.duration_seconds ? `${d.duration_seconds}s` : '—'}</td>
                <td className="py-3 px-3">
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                      d.status === 'succeeded'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : d.status === 'failed'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigate(`/deployments/${d.id}`)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                    >
                      Logs
                    </button>
                    {d.status === 'succeeded' && (
                      <button
                        onClick={() => handleRollback(d.id)}
                        className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-medium border border-rose-500/20"
                        title="Rollback to this build"
                      >
                        Rollback
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
