import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Rocket,
  CheckCircle2,
  Clock,
  Terminal,
  RotateCcw,
  ExternalLink,
  Loader2,
  GitCommit,
  Check,
  AlertOctagon,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../services/api';
import { DeploymentJob, DeploymentLog } from '../types';

export const DeploymentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<DeploymentJob | null>(null);
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const fetchStatusAndLogs = async () => {
    if (!id) return;
    try {
      const jobData = await api.get<DeploymentJob>(`/deployments/${id}`);
      setJob(jobData);
      const logData = await api.get<DeploymentLog[]>(`/deployments/${id}/logs`);
      setLogs(logData);
    } catch {
      // If mock/standalone
      if (!job) {
        setJob({
          id: id || 'dep-101',
          project_id: 'proj-1',
          commit_hash: '9f2a87b',
          branch: 'main',
          status: 'running',
          trigger_type: 'manual',
          started_at: new Date(Date.now() - 35000).toISOString(),
          duration_seconds: 35.2,
          project_name: 'payment-gateway-service',
        });
        setLogs([
          { id: '1', deployment_id: id || '1', timestamp: new Date(Date.now() - 35000).toISOString(), level: 'INFO', message: 'Pulling source branch: main from repository...', step: 'clone' },
          { id: '2', deployment_id: id || '1', timestamp: new Date(Date.now() - 25000).toISOString(), level: 'INFO', message: 'Building Docker container image: cloudpilot-payment-gateway:9f2a87b...', step: 'build' },
          { id: '3', deployment_id: id || '1', timestamp: new Date(Date.now() - 15000).toISOString(), level: 'INFO', message: 'Container spun up on network bridge port: 3000', step: 'run' },
          { id: '4', deployment_id: id || '1', timestamp: new Date(Date.now() - 5000).toISOString(), level: 'SUCCESS', message: 'HTTP GET /healthcheck responded 200 OK (latency: 18ms)', step: 'healthcheck' },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndLogs();
    const interval = setInterval(fetchStatusAndLogs, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const handleRollback = async () => {
    if (!window.confirm('Roll back to the previous stable release container?')) return;
    setIsRollingBack(true);
    try {
      await api.post(`/deployments/${id}/rollback`);
      alert('Rollback successfully dispatched!');
      fetchStatusAndLogs();
    } catch (err: any) {
      alert(err?.message || 'Rollback request failed');
    } finally {
      setIsRollingBack(false);
    }
  };

  const steps = [
    { title: 'Source Clone', step: 'clone' },
    { title: 'Docker Build', step: 'build' },
    { title: 'Container Launch', step: 'run' },
    { title: 'Health Verification', step: 'healthcheck' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/deployments')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Deployment #{id?.slice(0, 8)}
              </h2>
              <span
                className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                  job?.status === 'succeeded' || job?.status === 'running'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                    : job?.status === 'failed'
                    ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                    : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800 animate-pulse'
                }`}
              >
                {job?.status || 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Project: <span className="text-slate-200 font-medium">{job?.project_name || 'Container App'}</span> | Commit: <span className="font-mono text-cyan-400">{job?.commit_hash?.slice(0, 7)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRollback}
            disabled={isRollingBack}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRollingBack ? 'animate-spin' : ''}`} />
            <span>Rollback Release</span>
          </button>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span>Open Application</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Step Progress Tracker */}
      <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/90 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Pipeline Pipeline Stages</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {steps.map((s, idx) => {
            const isCompleted = logs.some((l) => l.step === s.step);
            return (
              <div
                key={s.step}
                className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                    : 'bg-navy-850 border-slate-800 text-slate-500'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className="font-medium">{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Terminal Output */}
      <div className="p-5 rounded-xl bg-[#0B0F19] border border-slate-800/90 shadow-lg">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>deployment-build.log</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Auto-streaming live</span>
        </div>

        <div className="font-mono text-xs bg-[#070B14] p-4 rounded-lg h-96 overflow-y-auto space-y-2 border border-slate-800/80">
          {logs.map((log) => (
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
          {job?.status === 'building' && (
            <div className="flex items-center gap-2 text-cyan-400 pt-2 text-[11px]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Building container layers...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
