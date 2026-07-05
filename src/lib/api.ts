const BASE_URL = ''; // Proxied via Vite/Express locally, or absolute if needed

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('cc_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    localStorage.removeItem('cc_token');
    // We do not reload or alert here to prevent infinite loop or bad UX
  }

  if (!response.ok) {
    let errMsg = `Request failed with status ${response.status}`;
    try {
      const errData = await response.json() as any;
      errMsg = errData.error || errMsg;
    } catch {
      try {
        const text = await response.text();
        if (text) {
          const errData = JSON.parse(text);
          errMsg = errData.error || errMsg;
        }
      } catch {}
    }
    throw new Error(errMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth API
  async login(email: string, password: string): Promise<any> {
    const res = await apiFetch<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) {
      localStorage.setItem('cc_token', res.token);
    }
    return res;
  },

  async register(data: any): Promise<any> {
    const res = await apiFetch<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (res.token) {
      localStorage.setItem('cc_token', res.token);
    }
    return res;
  },

  logout(): void {
    localStorage.removeItem('cc_token');
  },

  async forgotPassword(email: string): Promise<any> {
    return apiFetch<any>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(data: any): Promise<any> {
    return apiFetch<any>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getProfile(): Promise<any> {
    return apiFetch<any>('/api/auth/profile');
  },

  async updateProfile(data: any): Promise<any> {
    return apiFetch<any>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Settings API
  async getSettings(): Promise<any> {
    return apiFetch<any>('/api/settings');
  },

  async updateSettings(data: any): Promise<any> {
    return apiFetch<any>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Projects API
  async getProjects(): Promise<any[]> {
    return apiFetch<any[]>('/api/projects');
  },

  async createProject(data: any): Promise<any> {
    return apiFetch<any>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateProject(id: number, data: any): Promise<any> {
    return apiFetch<any>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteProject(id: number): Promise<any> {
    return apiFetch<any>(`/api/projects/${id}`, {
      method: 'DELETE'
    });
  },

  // Calculations API
  async estimateCost(config: any): Promise<any> {
    return apiFetch<any>('/api/calculations/estimate', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  },

  async saveCalculation(config: any): Promise<any> {
    return apiFetch<any>('/api/calculations', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  },

  async getCalculations(params: { provider?: string; project_id?: string; q?: string; sort_by?: string; order?: string } = {}): Promise<any[]> {
    const urlParams = new URLSearchParams();
    if (params.provider) urlParams.append('provider', params.provider);
    if (params.project_id) urlParams.append('project_id', params.project_id);
    if (params.q) urlParams.append('q', params.q);
    if (params.sort_by) urlParams.append('sort_by', params.sort_by);
    if (params.order) urlParams.append('order', params.order);
    
    const queryStr = urlParams.toString();
    return apiFetch<any[]>(`/api/calculations${queryStr ? '?' + queryStr : ''}`);
  },

  async deleteCalculation(id: number): Promise<any> {
    return apiFetch<any>(`/api/calculations/${id}`, {
      method: 'DELETE'
    });
  },

  // Dashboard API
  async getDashboardStats(): Promise<any> {
    return apiFetch<any>('/api/dashboard/stats');
  },

  // Reports API
  async getReports(): Promise<any[]> {
    return apiFetch<any[]>('/api/reports');
  },

  async generateReport(calculationId: number, fileType: 'PDF' | 'CSV' | 'EXCEL', projectId?: number | null): Promise<any> {
    return apiFetch<any>('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ calculation_id: calculationId, file_type: fileType, project_id: projectId })
    });
  },

  async deleteReport(id: number): Promise<any> {
    return apiFetch<any>(`/api/reports/${id}`, {
      method: 'DELETE'
    });
  },

  // AI Cost Optimization Advisor API
  async getAIOptimization(project: any, customInstructions?: string): Promise<any> {
    return apiFetch<any>('/api/ai/optimize', {
      method: 'POST',
      body: JSON.stringify({ 
        project_id: typeof project === 'object' ? project.id : project, 
        project: typeof project === 'object' ? project : undefined,
        custom_instructions: customInstructions 
      })
    });
  }
};
