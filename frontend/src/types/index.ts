export type UserRole = 'Admin' | 'Developer' | 'Viewer';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ConnectedRepository {
  id: string;
  project_id: string;
  repo_url: string;
  branch: string;
  auth_type: string;
  is_connected: boolean;
  last_synced_at?: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  environment: 'development' | 'staging' | 'production';
  user_id: string;
  created_at: string;
  updated_at: string;
  repository?: ConnectedRepository;
  services_count?: number;
  deployments_count?: number;
  active_incidents_count?: number;
}

export interface CloudConnection {
  id: string;
  user_id: string;
  provider: string;
  connection_name: string;
  is_connected: boolean;
  region: string;
  credentials_preview?: string;
  created_at: string;
}

export type DeploymentStatus = 'queued' | 'cloning' | 'building' | 'running' | 'succeeded' | 'failed' | 'rolled_back';

export interface DeploymentJob {
  id: string;
  project_id: string;
  commit_hash: string;
  branch: string;
  status: DeploymentStatus;
  trigger_type: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  error_message?: string;
  rollback_from_id?: string;
  project_name?: string;
}

export interface DeploymentLog {
  id: string;
  deployment_id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  message: string;
  step: string;
}

export interface Service {
  id: string;
  project_id: string;
  deployment_id?: string;
  container_id?: string;
  service_name: string;
  port?: number;
  status: 'running' | 'stopped' | 'restarting' | 'degraded';
  health_status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  target_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MetricSample {
  id: string;
  service_id: string;
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  response_time_ms: number;
  request_count: number;
  error_count: number;
  uptime_seconds: number;
}

export interface AnomalyEvent {
  id: string;
  service_id: string;
  timestamp: string;
  metric_name: string;
  metric_value: number;
  anomaly_score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'acknowledged' | 'resolved';
}

export interface Recommendation {
  id: string;
  project_id: string;
  title: string;
  category: 'resource' | 'cost' | 'performance' | 'security';
  impact: 'high' | 'medium' | 'low';
  estimated_savings_monthly: number;
  details: string;
  is_applied: boolean;
  created_at: string;
}

export interface Incident {
  id: string;
  project_id: string;
  service_id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved';
  root_cause?: string;
  resolved_at?: string;
  created_at: string;
}

export interface CostEstimate {
  id: string;
  project_id: string;
  cloud_provider: string;
  monthly_cost: number;
  breakdown_json: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details_json?: string;
  created_at: string;
}
