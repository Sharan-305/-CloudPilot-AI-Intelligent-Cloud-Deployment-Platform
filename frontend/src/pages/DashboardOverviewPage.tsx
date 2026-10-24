import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server,
  Activity,
  Cpu,
  ShieldAlert,
  DollarSign,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api';
import { Project, Service, AnomalyEvent, Incident } from '../types';

export const DashboardOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock time-series for dashboard sparkline
  const metricData = [
    { time: '12:00', cpu: 28, latency: 45 },
    { time: '12:15', cpu: 32, latency: 48 },
    { time: '12:30', cpu: 45, latency: 55 },
    { time: '12:45', cpu: 38, latency: 50 },
    { time: '13:00', cpu: 65, latency: 85 },
    { time: '13:15', cpu: 40, latency: 52 },
    { time: '13:30', cpu: 35, latency: 47 },
  ];

  const loadData = async () => {
    try {
      setIsLoading(true);
      const projData = await api.get<Project[]>('/projects');
      setProjects(projData);

      // Try fetching services, anomalies, incidents if endpoints exist or fallback to empty
      try {
        const servData = await api.get<Service[]>('/services');
        setServices(servData);
      } catch {
        setServices([]);
      }

      try {
        const anomData = await api.get<AnomalyEvent[]>('/anomalies');
        setAnomalies(anomData);
      } catch {
        setAnomalies([]);
      }

      try {
        const incData = await api.get<Incident[]>('/incidents');
        setIncidents(incData);
      } catch {
        setIncidents([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const healthyServices = services.filter((s) => s.health_status === 'healthy').length;
  const degradedServices = services.filter((s) => s.health_status === 'degraded').length;
  const unhealthyServices = services.filter((s) => s.health_status === 'unhealthy').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">System Command Overview</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time infrastructure health, container status, and AI monitoring signals
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-[#0B0F19] border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all"
          >
            <Rocket className="w-4 h-4" />
            <span>Deploy Project</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monitored Projects */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Monitored Projects</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{projects.length}</span>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across Docker & Cloud environments</p>
        </div>

        {/* System Health */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Container Health</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{healthyServices || (services.length === 0 ? 'Normal' : healthyServices)}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>{degradedServices}</span>
            </div>
            <div className="flex items-center gap-1 text-rose-400 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>{unhealthyServices}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">Healthy / Degraded / Down</p>
        </div>

        {/* AI Anomaly Radar */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">AI Anomaly Events</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{anomalies.length}</span>
            <span className="text-[11px] text-cyan-400 font-medium">Scikit-learn Model</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Isolation Forest streaming engine</p>
        </div>

        {/* Cost Projection */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Est. Cloud Monthly</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">$42.80</span>
            <span className="text-[11px] text-emerald-400 font-medium">-18% saved</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Right-sizing applied</p>
        </div>
      </div>

      {/* Main Charts & Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0B0F19] border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Cluster Resource Load</h3>
              <p className="text-xs text-slate-400">CPU Usage (%) & Response Latency (ms)</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded bg-cyan-400"></span> CPU %
              </span>
              <span className="flex items-center gap-1.5 text-blue-500">
                <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Latency ms
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricData}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1626',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#cpuGrad)" />
                <Area type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#latGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Launch & Status Panel */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Active Projects</h3>
            <p className="text-xs text-slate-400 mb-4">Quick access to deployment environments</p>

            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-3">No projects created yet</p>
                  <button
                    onClick={() => navigate('/projects')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-blue-600/30 transition-all"
                  >
                    + Create First Project
                  </button>
                </div>
              ) : (
                projects.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/projects`)}
                    className="p-3 rounded-lg bg-navy-850 hover:bg-slate-800/60 border border-slate-800 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{p.environment}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                      Ready
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Docker Daemon:</span>
              <span className="text-emerald-400 font-mono font-medium">unix:///docker.sock</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
