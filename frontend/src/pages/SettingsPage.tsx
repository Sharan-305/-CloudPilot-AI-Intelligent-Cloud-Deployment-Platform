import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Server,
  Key,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  User as UserIcon,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CloudConnection, AuditLog } from '../types';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Cloud connection modal/form
  const [isAddingConn, setIsAddingConn] = useState(false);
  const [provider, setProvider] = useState('local_docker');
  const [connName, setConnName] = useState('Local Docker Runtime');
  const [region, setRegion] = useState('us-east-1');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');

  const loadData = async () => {
    try {
      const conns = await api.get<CloudConnection[]>('/cloud-connections');
      setConnections(conns);
    } catch {}

    try {
      const logs = await api.get<AuditLog[]>('/audit-logs');
      setAuditLogs(logs);
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    setProfileMsg(null);

    try {
      await api.put(`/users/${user.id}`, { full_name: fullName });
      await refreshUser();
      setProfileMsg('Profile updated successfully');
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: any) {
      setProfileMsg(err?.message || 'Update failed');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/cloud-connections', {
        provider,
        connection_name: connName,
        region,
        access_key: accessKey || undefined,
        secret_key: secretKey || undefined,
      });
      setIsAddingConn(false);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to add connection');
    }
  };

  const handleDeleteConnection = async (connId: string) => {
    if (!window.confirm('Delete this cloud connection?')) return;
    try {
      await api.delete(`/cloud-connections/${connId}`);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete connection');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">System Settings & Cloud Connections</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Manage cloud provider credentials, role access control, and review platform audit trails
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800/90 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-cyan-400" />
            <span>Profile Information</span>
          </h3>

          {profileMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Role</label>
              <div className="inline-block px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-xs font-bold">
                {user?.role}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-navy-850 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              {isSavingProfile ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Cloud Connections Card */}
        <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800/90 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                <span>Cloud Provider Adapters</span>
              </h3>
              <button
                onClick={() => setIsAddingConn(true)}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Provider
              </button>
            </div>

            <div className="space-y-2.5">
              {connections.length === 0 ? (
                <div className="p-4 rounded-lg bg-navy-850 border border-slate-800 text-xs text-slate-400 text-center">
                  No custom cloud adapters linked yet. Defaulting to local Docker daemon.
                </div>
              ) : (
                connections.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg bg-navy-850 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{c.connection_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {c.provider.toUpperCase()} ({c.region}) — {c.credentials_preview}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteConnection(c.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400 inline mr-1" />
            Credentials are cryptographically masked and stored per least-privilege principles.
          </div>
        </div>
      </div>

      {/* Add Connection Modal */}
      {isAddingConn && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0B0F19] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Add Cloud Provider</h3>
            <p className="text-xs text-slate-400 mb-4">Connect Docker runtime or AWS IAM credentials</p>

            <form onSubmit={handleAddConnection} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-850 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="local_docker">Local Docker Runtime (Socket)</option>
                  <option value="aws">Amazon Web Services (AWS)</option>
                  <option value="gcp">Google Cloud Platform (GCP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Connection Label</label>
                <input
                  type="text"
                  required
                  value={connName}
                  onChange={(e) => setConnName(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-850 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              {provider === 'aws' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">AWS Region</label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="us-east-1"
                      className="w-full px-3 py-2 bg-navy-850 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Access Key ID</label>
                    <input
                      type="text"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      className="w-full px-3 py-2 bg-navy-850 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Secret Access Key</label>
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="••••••••••••••••••••••••"
                      className="w-full px-3 py-2 bg-navy-850 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingConn(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20"
                >
                  Save Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Logs Trail */}
      <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800/90 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Security Audit Trail</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-850 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-mono">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Resource Type</th>
                <th className="py-2.5 px-3">Resource ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-cyan-300 font-semibold">{log.action}</td>
                  <td className="py-2.5 px-3 capitalize text-slate-300">{log.resource_type}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">{log.resource_id?.slice(0, 8) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
