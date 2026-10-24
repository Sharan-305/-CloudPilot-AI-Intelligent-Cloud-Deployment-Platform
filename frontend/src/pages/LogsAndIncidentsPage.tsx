import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Terminal,
  ShieldAlert,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Check,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { Incident, DeploymentLog } from '../types';

export const LogsAndIncidentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'logs'>('incidents');
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: 'inc-1',
      project_id: 'proj-1',
      service_id: 'serv-1',
      title: 'Memory Leak Spike triggering OOM Kill',
      severity: 'critical',
      status: 'investigating',
      root_cause: 'Unbounded array accumulation in cache worker process under peak payload',
      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: 'inc-2',
      project_id: 'proj-1',
      service_id: 'serv-1',
      title: 'Container Port 3000 Latency Surge (> 450ms)',
      severity: 'high',
      status: 'resolved',
      root_cause: 'Database connection pool starvation resolved by scaling pool limits',
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      resolved_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
  ]);

  const [logs, setLogs] = useState<DeploymentLog[]>([
    { id: '1', deployment_id: 'd1', timestamp: new Date(Date.now() - 20000).toISOString(), level: 'INFO', message: 'Inbound GET /api/v1/orders HTTP 200 (14ms)', step: 'runtime' },
    { id: '2', deployment_id: 'd1', timestamp: new Date(Date.now() - 15000).toISOString(), level: 'WARNING', message: 'Memory allocation crossed warning threshold: 78% of 512MB quota', step: 'monitoring' },
    { id: '3', deployment_id: 'd1', timestamp: new Date(Date.now() - 10000).toISOString(), level: 'ERROR', message: 'Unhandled promise rejection in worker: DB connection timed out after 5000ms', step: 'runtime' },
    { id: '4', deployment_id: 'd1', timestamp: new Date(Date.now() - 5000).toISOString(), level: 'SUCCESS', message: 'Automatic connection pool recovery succeeded; reconnecting worker socket', step: 'self-healing' },
  ]);

  const [logFilter, setLogFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const resolveIncident = async (incId: string) => {
    try {
      await api.put(`/incidents/${incId}`, { status: 'resolved', resolved_at: new Date().toISOString() });
    } catch {}
    setIncidents((prev) =>
      prev.map((i) => (i.id === incId ? { ...i, status: 'resolved', resolved_at: new Date().toISOString() } : i))
    );
  };

  const filteredLogs = logs.filter((l) => {
    const matchesLevel = logFilter === 'ALL' || l.level === logFilter;
    const matchesSearch = l.message.toLowerCase().includes(search.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Incident Triage & Diagnostic Logs</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Active outages, root cause investigations, and unified live log telemetry
          </p>
        </div>

        <div className="flex rounded-lg bg-[#0B0F19] border border-slate-800 p-1">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 transition-all ${
              activeTab === 'incidents'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Incidents ({incidents.filter((i) => i.status !== 'resolved').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 transition-all ${
              activeTab === 'logs'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Container Logs</span>
          </button>
        </div>
      </div>

      {activeTab === 'incidents' ? (
        /* Incidents View */
        <div className="space-y-4">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                inc.status === 'resolved'
                  ? 'bg-navy-850/50 border-slate-800 opacity-75'
                  : 'bg-[#0B0F19] border-rose-800/40 shadow-sm'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                      inc.severity === 'critical'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                      inc.status === 'resolved'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-blue-950 text-cyan-400 border border-cyan-800 animate-pulse'
                    }`}
                  >
                    {inc.status}
                  </span>
                  <span className="text-slate-500 text-[11px] font-mono">
                    {new Date(inc.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{inc.title}</h4>
                {inc.root_cause && (
                  <p className="text-xs text-slate-400 max-w-2xl">
                    <span className="text-cyan-400 font-semibold">Root Cause:</span> {inc.root_cause}
                  </p>
                )}
              </div>

              <div>
                {inc.status !== 'resolved' ? (
                  <button
                    onClick={() => resolveIncident(inc.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                    <CheckCircle className="w-4 h-4" /> Resolved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Logs Terminal View */
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/90 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search log messages..."
                className="w-full pl-9 pr-4 py-1.5 bg-[#070B14] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {['ALL', 'INFO', 'WARNING', 'ERROR', 'SUCCESS'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLogFilter(lvl)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                    logFilter === lvl
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white bg-slate-800/50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="font-mono text-xs bg-[#070B14] p-4 rounded-lg h-96 overflow-y-auto space-y-2 border border-slate-800/80">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <span className="text-slate-500 text-[10px] shrink-0 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`text-[10px] px-1 rounded uppercase font-bold shrink-0 ${
                    log.level === 'SUCCESS'
                      ? 'bg-emerald-950 text-emerald-400'
                      : log.level === 'ERROR'
                      ? 'bg-rose-950 text-rose-400'
                      : log.level === 'WARNING'
                      ? 'bg-amber-950 text-amber-400'
                      : 'bg-slate-800 text-cyan-400'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
