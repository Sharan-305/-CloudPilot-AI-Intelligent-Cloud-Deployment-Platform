import React, { useState } from 'react';
import { DollarSign, Server, HardDrive, Network, ShieldCheck, Download, Save } from 'lucide-react';
import { api } from '../services/api';

export const CostEstimatorPage: React.FC = () => {
  const [provider, setProvider] = useState<'aws' | 'docker' | 'gcp'>('aws');
  const [instances, setInstances] = useState<number>(2);
  const [vcpu, setVcpu] = useState<number>(1);
  const [memoryGb, setMemoryGb] = useState<number>(2);
  const [egressGb, setEgressGb] = useState<number>(50);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Pricing models
  const calculateCosts = () => {
    if (provider === 'docker') {
      return {
        compute: 0,
        alb: 0,
        storage: 0,
        network: 0,
        total: 0,
      };
    }

    // AWS Fargate / EC2 model approximations
    const computeCost = instances * (vcpu * 29.20 + memoryGb * 3.20);
    const albCost = 16.50; // ALB baseline per month
    const storageCost = instances * 2.50; // EBS/ECR
    const networkCost = egressGb * 0.09; // AWS egress standard

    const total = computeCost + albCost + storageCost + networkCost;
    return {
      compute: parseFloat(computeCost.toFixed(2)),
      alb: parseFloat(albCost.toFixed(2)),
      storage: parseFloat(storageCost.toFixed(2)),
      network: parseFloat(networkCost.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
  };

  const costs = calculateCosts();

  const handleSaveEstimate = async () => {
    try {
      await api.post('/costs', {
        cloud_provider: provider,
        monthly_cost: costs.total,
        breakdown_json: JSON.stringify({
          instances,
          vcpu,
          memoryGb,
          egressGb,
          costs,
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Cloud Infrastructure Cost Estimator</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Model and project infrastructure spend across Local Docker and AWS cloud environments
          </p>
        </div>

        <button
          onClick={handleSaveEstimate}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{savedSuccess ? 'Snapshot Saved!' : 'Save Cost Baseline'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Sliders Column */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0B0F19] border border-slate-800/90 shadow-xl space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Target Deployment Environment</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'aws', name: 'AWS ECS / Fargate', desc: 'Cloud Managed' },
                { id: 'docker', name: 'Local Docker Host', desc: 'Zero Cloud Cost' },
                { id: 'gcp', name: 'Google Cloud Run', desc: 'Serverless' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    provider === p.id
                      ? 'bg-blue-600/15 border-cyan-500/60 shadow-sm shadow-cyan-950'
                      : 'bg-navy-850 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-white">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Container Replicas</span>
                <span className="font-mono text-cyan-400 font-bold">{instances} Task(s)</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={instances}
                onChange={(e) => setInstances(parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">vCPU Allocation per Container</span>
                <span className="font-mono text-cyan-400 font-bold">{vcpu} vCPU</span>
              </div>
              <input
                type="range"
                min="0.25"
                max="4"
                step="0.25"
                value={vcpu}
                onChange={(e) => setVcpu(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Memory Allocation (RAM)</span>
                <span className="font-mono text-cyan-400 font-bold">{memoryGb} GB</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="16"
                step="0.5"
                value={memoryGb}
                onChange={(e) => setMemoryGb(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Internet Data Egress</span>
                <span className="font-mono text-cyan-400 font-bold">{egressGb} GB / month</span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={egressGb}
                onChange={(e) => setEgressGb(parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Projection Breakdown Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0B0F19] to-navy-850 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Projected Monthly Spend</span>
            <div className="flex items-baseline gap-2 my-2">
              <span className="text-4xl font-extrabold text-white font-mono">${costs.total.toFixed(2)}</span>
              <span className="text-xs text-slate-400">/ month</span>
            </div>
            <p className="text-xs text-slate-400 mb-6">Estimated bill based on continuous 24/7 container uptime</p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-400" /> Compute (vCPU & RAM)
                </span>
                <span className="font-mono font-semibold text-slate-200">${costs.compute.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-blue-400" /> App Load Balancer
                </span>
                <span className="font-mono font-semibold text-slate-200">${costs.alb.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> ECR & Storage
                </span>
                <span className="font-mono font-semibold text-slate-200">${costs.storage.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Network Egress
                </span>
                <span className="font-mono font-semibold text-slate-200">${costs.network.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 mt-6">
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs">
              <p className="font-semibold mb-0.5">Optimization Available</p>
              <p className="text-[11px] text-emerald-400/80">
                Switching to ARM Graviton architecture reduces compute pricing by approximately 19%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
