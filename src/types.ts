export interface User {
  id: number;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id?: number;
  user_id?: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  gst_number?: string;
  country?: string;
  industry?: string;
  profile_image?: string;
}

export interface Settings {
  id?: number;
  theme: 'light' | 'dark';
  language: string;
  currency: string;
  timezone: string;
  budget_alerts: boolean;
  notification_preferences: string; // Comma separated, e.g. "email,push"
  default_provider: string;
  default_region: string;
}

export interface Project {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  cloud_provider?: string;
  budget: number;
  created_at?: string;
  updated_at?: string;
}

export interface CalculationBreakdown {
  compute: number;
  block_storage: number;
  object_storage: number;
  database: number;
  load_balancer: number;
  bandwidth: number;
  cdn: number;
  dns: number;
  snapshot_backup: number;
  tax: number;
  subtotal: number;
}

export interface SelectedProviderCost {
  provider_code: string;
  provider_name: string;
  logo_url: string;
  compute_service: string;
  storage_service: string;
  database_service: string;
  object_service?: string;
  breakdown: CalculationBreakdown;
  monthly_cost: number;
  annual_cost: number;
  ratings: {
    perf: number;
    sec: number;
    scale: number;
    ent: number;
    startup: number;
  };
}

export interface ComparisonItem {
  provider_code: string;
  provider_name: string;
  logo_url: string;
  compute_service: string;
  storage_service: string;
  database_service: string;
  monthly_cost: number;
  annual_cost: number;
  estimated_savings: number;
  difference_from_selected: number;
  diff_percent: number;
  ranking: number;
  cheapest_option: boolean;
  is_selected: boolean;
  best_perf_dollar: boolean;
  is_recommended: boolean;
  ratings: {
    perf: number;
    sec: number;
    scale: number;
    ent: number;
    startup: number;
  };
}

export interface Recommendation {
  id?: number;
  type: string;
  title: string;
  description: string;
  potential_savings: number;
  complexity: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  reasoning?: string;
}

export interface Calculation {
  id: number;
  user_id: number;
  project_id?: number | null;
  provider_code: string;
  region_code: string;
  configuration: any; // Raw JSON input specs
  monthly_cost: number;
  annual_cost: number;
  estimated_savings: number;
  created_at: string;
  comparison?: ComparisonItem[];
  recommendations?: Recommendation[];
}

export interface Report {
  id: number;
  user_id: number;
  project_id?: number | null;
  calculation_id?: number | null;
  name: string;
  file_path: string;
  file_type: 'PDF' | 'CSV' | 'EXCEL';
  file_size?: string;
  created_at: string;
  download_url?: string;
}

export interface DashboardStats {
  monthly_cost: number;
  annual_cost: number;
  estimated_savings: number;
  project_count: number;
  report_count: number;
  calc_count: number;
  history_count: number;
  budget_limit: number;
  budget_spent: number;
  resource_distribution: {
    compute: number;
    storage: number;
    database: number;
    networking: number;
    other: number;
  };
  provider_distribution: { name: string; value: number }[];
  cost_trend: { month: string; spend: number; savings: number }[];
  savings_trend: { name: string; value: number }[];
  project_spend_matrix: {
    id: number;
    name: string;
    provider: string;
    budget: number;
    spent: number;
  }[];
}
