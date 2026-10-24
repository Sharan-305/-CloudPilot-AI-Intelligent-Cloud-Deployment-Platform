import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Rocket, Cpu, Server, Plus, Trash2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Project } from '../types';

export const DeploymentConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get('project');

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectIdParam || '');
  const [port, setPort] = useState<number>(3000);
  const [cpuLimit, setCpuLimit] = useState<string>('0.5');
  const [memoryLimit, setMemoryLimit] = useState<string>('512');
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([
    { key: 'NODE_ENV', value: 'production' },
    { key: 'PORT', value: '3000' }
  ]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Project[]>('/projects').then((data) => {
      setProjects(data);
      if (!selectedProjectId && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    });
  }, []);

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...envVars];
    updated[index][field] = val;
    setEnvVars(updated);
  };

  const handleLaunchDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('Please select a project to deploy');
      return;
    }
    setError(null);
    setIsDeploying(true);

    try {
      const res = await api.post<any>('/deployments', {
        project_id: selectedProjectId,
        port,
        cpu_limit: parseFloat(cpuLimit),
        memory_limit_mb: parseInt(memoryLimit),
        env_vars: Object.fromEntries(envVars.filter(v => v.key.trim()).map(v => [v.key, v.value]))
      });
      navigate(`/deployments/${res.id || selectedProjectId}`);
    } catch (err: any) {
      setError(err?.message || 'Deployment initiation failed');
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Configure Deployment Runtime</h2>
        <p className="text-xs text-slate-400">Specify network bindings, container resource quotas, and runtime environment variables</p>
      </div>

      <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800/90 shadow-xl">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLaunchDeployment} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-navy-850 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.environment}]
                </option>
              ))}
            </select>
          </div>

          {/* Resources & Port */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Container Port</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value) || 80)}
                placeholder="3000"
                className="w-full px-3 py-2 bg-navy-850 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">CPU Quota (Cores)</label>
              <input
                type="text"
                value={cpuLimit}
                onChange={(e) => setCpuLimit(e.target.value)}
                placeholder="0.5"
                className="w-full px-3 py-2 bg-navy-850 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Memory Limit (MB)</label>
              <input
                type="number"
                value={memoryLimit}
                onChange={(e) => setMemoryLimit(e.target.value)}
                placeholder="512"
                className="w-full px-3 py-2 bg-navy-850 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Environment Variables */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">Environment Variables</label>
              <button
                type="button"
                onClick={addEnvVar}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3 h-3" /> Add Variable
              </button>
            </div>

            <div className="space-y-2">
              {envVars.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.key}
                    onChange={(e) => updateEnvVar(idx, 'key', e.target.value)}
                    placeholder="VARIABLE_NAME"
                    className="flex-1 px-3 py-1.5 bg-navy-850 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => updateEnvVar(idx, 'value', e.target.value)}
                    placeholder="value"
                    className="flex-1 px-3 py-1.5 bg-navy-850 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeEnvVar(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isDeploying}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initiating Build Pipeline...</span>
                </>
              ) : (
                <>
                  <span>Trigger Deployment</span>
                  <Rocket className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
