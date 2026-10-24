import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  AlertTriangle,
  Zap,
  TrendingDown,
  CheckCircle,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { AnomalyEvent, Recommendation } from '../types';

export const AIInsightsPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([
    {
      id: 'anom-1',
      service_id: 'serv-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      metric_name: 'cpu_percent',
      metric_value: 86.4,
      anomaly_score: -0.42,
      severity: 'high',
      description: 'Abnormal CPU spike detected by Isolation Forest. Exceeds historical baseline by 3.2x std-dev.',
      status: 'open',
    },
    {
      id: 'anom-2',
      service_id: 'serv-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      metric_name: 'response_time_ms',
      metric_value: 245.0,
      anomaly_score: -0.38,
      severity: 'medium',
      description: 'Latency degradation anomaly correlating with memory heap expansion.',
      status: 'acknowledged',
    },
  ]);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: 'rec-1',
      project_id: 'proj-1',
      title: 'Right-Size Memory Allocation',
      category: 'resource',
      impact: 'high',
      estimated_savings_monthly: 24.50,
      details: 'Container memory utilization averages 18% over the past 7 days. Reducing memory from 2GB to 512MB saves cost without throttling.',
      is_applied: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'rec-2',
      project_id: 'proj-1',
      title: 'Enable HTTP Keep-Alive & Connection Pooling',
      category: 'performance',
      impact: 'medium',
      estimated_savings_monthly: 12.00,
      details: 'High connection handshake overhead identified during peak traffic. Upstream connection pooling reduces p95 latency by ~28ms.',
      is_applied: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'rec-3',
      project_id: 'proj-1',
      title: 'Consolidate Staging Docker Containers',
      category: 'cost',
      impact: 'high',
      estimated_savings_monthly: 48.00,
      details: 'Idle staging containers consuming dedicated vCPUs during non-business hours. Configure auto-suspend schedule.',
      is_applied: false,
      created_at: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    api.get<AnomalyEvent[]>('/anomalies').then((data) => {
      if (data && data.length > 0) setAnomalies(data);
    }).catch(() => {});

    api.get<Recommendation[]>('/recommendations').then((data) => {
      if (data && data.length > 0) setRecommendations(data);
    }).catch(() => {});
  }, []);

  const handleApplyRecommendation = async (recId: string) => {
    try {
      await api.post(`/recommendations/${recId}/apply`);
    } catch {
      // Optimistic update
    }
    setRecommendations((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, is_applied: true } : r))
    );
  };

  const totalSavings = recommendations
    .filter((r) => !r.is_applied)
    .reduce((sum, r) => sum + r.estimated_savings_monthly, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">AI Insights & Optimization</h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-[10px] font-mono font-semibold text-cyan-400">
              Isolation Forest ML
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Machine learning anomaly detection, root-cause diagnosis, and automated cloud optimization
          </p>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/60 to-cyan-950/60 border border-cyan-800/60 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Available Monthly Savings</p>
            <p className="text-lg font-bold text-emerald-400 font-mono">${totalSavings.toFixed(2)}/mo</p>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div>
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Resource Right-Sizing & Cloud Optimization</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                rec.is_applied
                  ? 'bg-navy-850/60 border-slate-800 opacity-75'
                  : 'bg-[#0B0F19] border-slate-800 hover:border-cyan-500/40 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                      rec.impact === 'high'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                    }`}
                  >
                    {rec.impact} impact
                  </span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    +${rec.estimated_savings_monthly.toFixed(2)}/mo
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-2">{rec.title}</h4>
                <p className="text-xs text-slate-400 mb-4">{rec.details}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 uppercase font-mono font-medium">{rec.category}</span>
                {rec.is_applied ? (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Applied
                  </span>
                ) : (
                  <button
                    onClick={() => handleApplyRecommendation(rec.id)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1"
                  >
                    <span>Apply Fix</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly Detection Events */}
      <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/90 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
              <span>Detected Behavioral Anomalies</span>
            </h3>
            <p className="text-xs text-slate-400">Model-flagged deviations from learned steady-state operating bounds</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-850 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-mono">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Metric</th>
                <th className="py-2.5 px-3">Observed Value</th>
                <th className="py-2.5 px-3">Anomaly Score</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">AI Diagnostic Summary</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {anomalies.map((anom) => (
                <tr key={anom.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {new Date(anom.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-200">{anom.metric_name}</td>
                  <td className="py-3 px-3 font-mono text-cyan-300 font-bold">{anom.metric_value}</td>
                  <td className="py-3 px-3 font-mono text-rose-400">{anom.anomaly_score}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        anom.severity === 'critical' || anom.severity === 'high'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {anom.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 max-w-xs truncate">{anom.description}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {anom.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
