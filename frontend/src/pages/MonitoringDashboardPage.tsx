import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Clock,
  AlertTriangle,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import { Service, MetricSample } from '../types';

export const MonitoringDashboardPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'5m' | '15m' | '1h'>('15m');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // High-fidelity telemetry mock data with variation
  const [telemetry, setTelemetry] = useState([
    { time: '14:10', cpu: 24, mem: 42, latency: 45, errors: 0 },
    { time: '14:12', cpu: 28, mem: 43, latency: 48, errors: 0 },
    { time: '14:14', cpu: 35, mem: 44, latency: 52, errors: 0 },
    { time: '14:16', cpu: 82, mem: 68, latency: 195, errors: 3 }, // Spike
    { time: '14:18', cpu: 65, mem: 65, latency: 140, errors: 1 },
    { time: '14:20', cpu: 38, mem: 46, latency: 50, errors: 0 },
    { time: '14:22', cpu: 30, mem: 45, latency: 46, errors: 0 },
  ]);

  useEffect(() => {
    api.get<Service[]>('/services').then((data) => {
      setServices(data);
    }).catch(() => {});
  }, []);

  // Simulate real-time streaming updates
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const last = prev[prev.length - 1];
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}:${now.getSeconds() < 10 ? '0' : ''}${now.getSeconds()}`;
        
        // Minor natural jitter
        const jitter = Math.floor(Math.random() * 8) - 4;
        const newCpu = Math.max(15, Math.min(95, last.cpu + jitter));
        const newLatency = Math.max(30, Math.min(250, last.latency + jitter * 2));
        const newMem = Math.max(40, Math.min(80, last.mem + (Math.random() > 0.5 ? 0.5 : -0.5)));

        const next = [...prev.slice(1), { time: timeStr, cpu: newCpu, mem: Math.round(newMem), latency: newLatency, errors: newCpu > 80 ? 2 : 0 }];
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const latest = telemetry[telemetry.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Live Cluster Monitoring</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Streaming container telemetry, CPU/Memory utilization, and request latency
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              autoRefresh
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{autoRefresh ? 'Streaming Active' : 'Paused'}</span>
          </button>

          <div className="flex rounded-lg bg-[#0B0F19] border border-slate-800 p-0.5">
            {(['5m', '15m', '1h'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  timeRange === range ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Metric Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">CPU Utilization</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{latest.cpu}%</span>
            <span className={`text-[11px] font-semibold ${latest.cpu > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {latest.cpu > 80 ? 'HIGH LOAD' : 'NORMAL'}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                latest.cpu > 80 ? 'bg-rose-500' : latest.cpu > 60 ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${latest.cpu}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Memory Allocation</span>
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{latest.mem}%</span>
            <span className="text-[11px] text-slate-400 font-mono">232 MB / 512 MB</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${latest.mem}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Response Latency (p95)</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{latest.latency} ms</span>
            <span className="text-[11px] text-emerald-400 font-semibold">&lt; 100ms Target</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">Gateway Round-Trip</p>
        </div>

        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Error Rate (5xx)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{latest.errors} err/min</span>
            <span className="text-[11px] text-emerald-400 font-semibold">99.98% Uptime</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">Circuit breaker closed</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Chart */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/90 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-1">CPU Load Curve (%)</h3>
          <p className="text-xs text-slate-400 mb-4">Historical container CPU utilization</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetry}>
                <defs>
                  <linearGradient id="monCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0F1626', border: '1px solid #1E293B', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="cpu" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#monCpu)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Chart */}
        <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/90 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-1">Response Latency (ms)</h3>
          <p className="text-xs text-slate-400 mb-4">Roundtrip response latency across endpoints</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetry}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0F1626', border: '1px solid #1E293B', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
