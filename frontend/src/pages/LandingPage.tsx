import React from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket,
  ShieldCheck,
  BrainCircuit,
  Activity,
  Layers,
  ChevronRight,
  DollarSign,
  Cpu,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-800/80 px-6 sm:px-12 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              CloudPilot <span className="text-cyan-400 font-extrabold text-xs px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">AI</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-6 py-16 sm:py-24 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-8 animate-pulse">
          <BrainCircuit className="w-4 h-4 text-cyan-400" />
          <span>Next-Gen Intelligent Cloud Deployment</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
          Deploy Faster. Monitor Smarter.{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
            Self-Heal Seamlessly.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mb-10 leading-relaxed font-normal">
          CloudPilot AI combines automated container orchestration, real-time telemetry, machine-learning anomaly detection, and cloud cost intelligence in one unified dark command center.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <span>Launch Deployment Console</span>
            <Rocket className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 transition-all"
          >
            Live Demo Login
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated CI/CD Builds</h3>
            <p className="text-sm text-slate-400">
              Seamlessly clone GitHub repositories, generate multi-stage Docker images, verify container health, and trigger instantaneous zero-downtime rollbacks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">ML Anomaly Detection</h3>
            <p className="text-sm text-slate-400">
              Isolation Forest models analyze CPU spikes, memory leaks, latency surges, and error rates to identify anomalies before users experience outages.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Cost & Sizing Optimizer</h3>
            <p className="text-sm text-slate-400">
              Automated resource right-sizing recommendations and real-time cloud cost projections for local Docker workloads and AWS cloud infrastructure.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-slate-800/80 px-6 sm:px-12 flex items-center justify-between text-xs text-slate-500 max-w-7xl mx-auto w-full">
        <span>CloudPilot AI Platform &copy; 2026</span>
        <div className="flex items-center gap-4">
          <span>FastAPI</span>
          <span>•</span>
          <span>React + Vite</span>
          <span>•</span>
          <span>Docker</span>
          <span>•</span>
          <span>Scikit-learn</span>
        </div>
      </footer>
    </div>
  );
};
