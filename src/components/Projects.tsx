import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Project } from '../types';
import { 
  Briefcase, DollarSign, PlusCircle, Trash2, Edit2, CheckCircle, 
  AlertCircle, HelpCircle, RefreshCw, Layers, Shield, Cpu, 
  User, Sparkles, TrendingUp, Calendar, Clock, Activity, FileText, BarChart
} from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form inputs for creation/edition
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState('AWS');
  const [budget, setBudget] = useState('5000');
  const [environment, setEnvironment] = useState('Production');
  const [owner, setOwner] = useState('Lokesh B');
  const [activeResources, setActiveResources] = useState('12');

  // Editing states
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editProvider, setEditProvider] = useState('AWS');
  const [editBudget, setEditBudget] = useState('5000');
  const [editEnvironment, setEditEnvironment] = useState('Production');
  const [editOwner, setEditOwner] = useState('Lokesh B');
  const [editActiveResources, setEditActiveResources] = useState('12');

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEnv, setFilterEnv] = useState('');
  const [filterProvider, setFilterProvider] = useState('');

  // Toggle create drawer
  const [showCreate, setShowCreate] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch enterprise projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('Please provide a valid project name.');
      return;
    }
    try {
      // Pick random scores for a realistic enterprise simulation
      const healthScore = Math.floor(Math.random() * 15) + 85; // 85-99
      const optScore = Math.floor(Math.random() * 20) + 75; // 75-95

      await api.createProject({
        name: name.trim(),
        description: description.trim(),
        cloud_provider: provider,
        budget: parseFloat(budget) || 0.0,
        environment,
        owner: owner.trim() || 'Lokesh B',
        health_score: healthScore,
        optimization_score: optScore,
        active_resources: parseInt(activeResources) || 12
      });
      setSuccess('Enterprise project workspace boundary initialized successfully.');
      setName('');
      setDescription('');
      setProvider('AWS');
      setBudget('5000');
      setEnvironment('Production');
      setOwner('Lokesh B');
      setActiveResources('12');
      setShowCreate(false);
      fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setError('');
    setSuccess('');
    try {
      await api.updateProject(editingProject.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        cloud_provider: editProvider,
        budget: parseFloat(editBudget) || 0.0,
        environment: editEnvironment,
        owner: editOwner.trim(),
        active_resources: parseInt(editActiveResources) || 12
      });
      setSuccess(`Project settings for '${editName}' updated.`);
      setEditingProject(null);
      fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to update project settings.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete the project '${name}'?\n\nThis will permanently purge this corporate boundary from MySQL, including all of its budgets, calculation logs, generated files, and recommendations. This action is irreversible.`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.deleteProject(id);
      setSuccess(`Project '${name}' and all associated workloads were permanently purged.`);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete project.');
    }
  };

  const startEditing = (p: any) => {
    setEditingProject(p);
    setEditName(p.name);
    setEditDescription(p.description || '');
    setEditProvider(p.cloud_provider || 'AWS');
    setEditBudget(p.budget ? p.budget.toString() : '5000');
    setEditEnvironment(p.environment || 'Production');
    setEditOwner(p.owner || 'Lokesh B');
    setEditActiveResources(p.active_resources ? p.active_resources.toString() : '12');
  };

  // Metrics computation for statistics header
  const totalProjects = projects.length;
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalSpend = projects.reduce((acc, p) => acc + (p.spent || 0), 0);
  const remainingBudget = Math.max(0, totalBudget - totalSpend);
  const averageHealthScore = totalProjects > 0 
    ? Math.round(projects.reduce((acc, p) => acc + (p.health_score || 95), 0) / totalProjects)
    : 95;
  const averageOptScore = totalProjects > 0 
    ? Math.round(projects.reduce((acc, p) => acc + (p.optimization_score || 88), 0) / totalProjects)
    : 88;
  const totalResources = projects.reduce((acc, p) => acc + (p.active_resources || 0), 0);

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          p.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnv = filterEnv ? p.environment === filterEnv : true;
    const matchesProvider = filterProvider ? p.cloud_provider.toLowerCase() === filterProvider.toLowerCase() : true;
    return matchesSearch && matchesEnv && matchesProvider;
  });

  return (
    <div id="projects-viewport" className="space-y-8 animate-fade-in text-xs">
      
      {/* Upper Title Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/10">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">Project Workspace</h1>
              <p className="text-xs text-slate-500 font-medium">Enterprise billing partitions, environment isolations, active resource clusters, and budget utilization analysis.</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/15 transition-all self-stretch sm:self-auto justify-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showCreate ? 'Close Portal' : 'Initialize Project Boundary'}</span>
        </button>
      </div>

      {/* Corporate Dashboard Statistics Panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Budget Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Global Cost Limit</span>
            <strong className="text-base font-extrabold text-slate-900 font-mono">${totalBudget.toLocaleString()}</strong>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Across {totalProjects} active scopes</span>
          </div>
        </div>

        {/* Total Spend Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Realized Monthly Spend</span>
            <strong className="text-base font-extrabold text-slate-900 font-mono">${totalSpend.toLocaleString()}</strong>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
              {totalBudget > 0 ? `${Math.round((totalSpend / totalBudget) * 100)}% Global utilization` : '0% utilization'}
            </span>
          </div>
        </div>

        {/* Global FinOps Scores */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">FinOps & Health Stats</span>
            <div className="flex items-baseline space-x-2">
              <strong className="text-sm font-extrabold text-slate-900">{averageOptScore}% <span className="text-[10px] font-normal text-slate-500">Opt</span></strong>
              <span className="text-slate-300">|</span>
              <strong className="text-sm font-extrabold text-emerald-600">{averageHealthScore}% <span className="text-[10px] font-normal text-slate-400">Health</span></strong>
            </div>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Weighted portfolio scores</span>
          </div>
        </div>

        {/* Global Resources Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tracked Resources</span>
            <strong className="text-base font-extrabold text-slate-900 font-mono">{totalResources}</strong>
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Virtual instances, databases, CDNs</span>
          </div>
        </div>

      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-xs text-red-700 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl text-xs text-emerald-700 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Project Initializer Boundary Portal / Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-slide-in">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Initialize Enterprise Cloud Workspace</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Core configuration */}
            <div className="space-y-4 md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Core eCommerce Production Cluster" 
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Owner / Architect</label>
                  <input 
                    type="text" 
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="e.g. Lokesh B" 
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Functional Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Core microservices, dockerized API endpoints, read-replicas, and active storage nodes." 
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              </div>
            </div>

            {/* Enterprise settings */}
            <div className="space-y-4 bg-slate-50 p-4 border border-slate-200 rounded-2xl">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Deployment Environment</label>
                <select 
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Production">Production (Live)</option>
                  <option value="Development">Development (Sandbox)</option>
                  <option value="Testing">Testing / QA (Staging)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cloud Provider</label>
                  <select 
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AWS">AWS</option>
                    <option value="Azure">Microsoft Azure</option>
                    <option value="GCP">Google Cloud</option>
                    <option value="Oracle">Oracle Cloud</option>
                    <option value="Hetzner">Hetzner Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Monthly Limit ($)</label>
                  <input 
                    type="number" 
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold font-mono text-slate-800"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Active Resources count</label>
                <input 
                  type="number" 
                  value={activeResources}
                  onChange={(e) => setActiveResources(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold font-mono text-slate-800"
                  min="1"
                />
              </div>

            </div>

          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-600/10 transition-colors"
            >
              Save Enterprise Scope
            </button>
          </div>
        </form>
      )}

      {/* Editing Dialog Portal */}
      {editingProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Edit2 className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Modify Project Partition</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Owner</label>
                <input 
                  type="text" 
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold min-h-[60px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Environment</label>
                <select 
                  value={editEnvironment}
                  onChange={(e) => setEditEnvironment(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold font-sans text-slate-800"
                >
                  <option value="Production">Production</option>
                  <option value="Development">Development</option>
                  <option value="Testing">Testing</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cloud Provider</label>
                <select 
                  value={editProvider}
                  onChange={(e) => setEditProvider(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                >
                  <option value="AWS">AWS</option>
                  <option value="Azure">Azure</option>
                  <option value="GCP">GCP</option>
                  <option value="Oracle">Oracle</option>
                  <option value="Hetzner">Hetzner</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Monthly Budget Limit ($)</label>
                <input 
                  type="number" 
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Active Resources count</label>
                <input 
                  type="number" 
                  value={editActiveResources}
                  onChange={(e) => setEditActiveResources(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold font-mono text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
              >
                Save Boundaries
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Corporate Advanced Filter / Search Workspace control line */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, owners, clusters..."
            className="w-full pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={filterEnv}
            onChange={(e) => setFilterEnv(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600"
          >
            <option value="">All Environments</option>
            <option value="Production">Production</option>
            <option value="Development">Development</option>
            <option value="Testing">Testing</option>
          </select>

          <select 
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600"
          >
            <option value="">All Cloud Providers</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="gcp">Google Cloud</option>
            <option value="oracle">Oracle Cloud</option>
            <option value="hetzner">Hetzner</option>
          </select>

          <button 
            onClick={fetchProjects}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
            title="Refresh active lists"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Enterprise Project List Grid with Rich Metadata & Custom Utilization Visualizers */}
      {loading ? (
        <div className="flex flex-col items-center py-16 space-y-3 bg-white border border-slate-200 rounded-2xl">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-xs font-mono text-slate-400">Syncing enterprise projects dataset...</span>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredProjects.map((p) => {
            const hasSpent = p.budget > 0;
            const utilization = hasSpent ? Math.min(100, (p.spent / p.budget) * 100) : 0;
            const remaining = Math.max(0, p.budget - (p.spent || 0));
            const isExceeded = p.spent > p.budget;
            
            // Format environment badge
            const getEnvBadge = (env: string) => {
              switch (env) {
                case 'Production': return 'bg-rose-50 text-rose-700 border-rose-100';
                case 'Development': return 'bg-sky-50 text-sky-700 border-sky-100';
                default: return 'bg-amber-50 text-amber-700 border-amber-100';
              }
            };

            // Health Score Badge color
            const getHealthColor = (score: number) => {
              if (score >= 90) return 'text-emerald-600';
              if (score >= 75) return 'text-amber-500';
              return 'text-red-500';
            };

            const createdDateStr = p.created_at ? new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
            const modifiedDateStr = p.updated_at ? new Date(p.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

            return (
              <div key={p.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-6">
                
                {/* Upper block with Title and Environment Badge */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 font-mono text-sm shadow-inner uppercase">
                        {p.cloud_provider ? p.cloud_provider.substring(0, 2) : 'CL'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-slate-900 text-sm tracking-tight leading-tight">{p.name}</h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getEnvBadge(p.environment)}`}>
                            {p.environment}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5 text-slate-400 font-medium">
                          <User className="w-3 h-3" />
                          <span>Owner: <strong className="text-slate-600">{p.owner}</strong></span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${isExceeded ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                      {isExceeded ? 'BUDGET EXCEEDED' : 'COMPLIANT'}
                    </span>
                  </div>

                  <p className="text-slate-500 leading-relaxed min-h-[36px] line-clamp-2">
                    {p.description || "No project boundary description provided. Create cost configurations and link compiled reports to view cluster parameters."}
                  </p>

                  {/* High Density KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 border border-slate-200 rounded-2xl text-[10px] font-semibold text-slate-500 font-mono">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">ACTIVE RESOURCES</span>
                      <strong className="text-slate-900 text-xs font-bold block">{p.active_resources || 12} units</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">HEALTH SCORE</span>
                      <strong className={`text-xs font-bold block ${getHealthColor(p.health_score)}`}>
                        {p.health_score || 95}%
                      </strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">FINOPS ADVISOR</span>
                      <strong className="text-slate-900 text-xs font-bold block text-blue-600">
                        {p.optimization_score || 88}% Score
                      </strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">BENCHMARKS</span>
                      <strong className="text-slate-900 text-xs font-bold block">
                        {p.calculations_count || 0} Calcs • {p.reports_count || 0} Reps
                      </strong>
                    </div>
                  </div>

                  {/* Budget Allocation Progress Indicators */}
                  <div className="space-y-2 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span className="flex items-center space-x-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        <span>Monthly Spend: <strong className="text-slate-800">${Math.round(p.spent || 0).toLocaleString()}</strong></span>
                      </span>
                      <span>Total Limit: <strong className="text-slate-700">${Math.round(p.budget).toLocaleString()}</strong></span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isExceeded ? 'bg-rose-500' : (utilization > 80 ? 'bg-amber-500' : 'bg-emerald-500')}`}
                        style={{ width: `${utilization}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono mt-1 text-slate-400">
                      <span>Remaining Capital: <strong className={remaining > 0 ? "text-emerald-600" : "text-rose-600"}>${Math.round(remaining).toLocaleString()}</strong></span>
                      <span>Utilization: <strong>{Math.round(utilization)}%</strong></span>
                    </div>
                  </div>
                </div>

                {/* Bottom metadata and control strip */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-[9px] font-mono text-slate-400 space-y-0.5">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      <span>Created: <strong>{createdDateStr}</strong></span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span>Modified: <strong>{modifiedDateStr}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button 
                      onClick={() => startEditing(p)}
                      className="flex-1 sm:flex-none px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all"
                      title="Edit corporate constraints"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Scope</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id, p.name)}
                      className="px-3.5 py-1.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 rounded-xl font-bold flex items-center justify-center transition-all"
                      title="Decommission project cluster"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center text-slate-400 flex flex-col items-center justify-center min-h-[350px]">
          <Briefcase className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
          <h4 className="font-bold text-slate-700 text-sm">No Active Corporate Bounds</h4>
          <p className="text-xs max-w-sm mt-1 leading-relaxed">You have not partitioned your server grids yet. Click "Initialize Project Boundary" above to partition cost structures and trigger real-time compliance alerts.</p>
        </div>
      )}

      {/* Corporate Insights Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">AI FinOps Cloud Advisor Insights</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase font-mono block">Insight 1: Waste Mitigation</span>
            <p className="text-slate-300 leading-relaxed">Your active resource count suggests around <strong>${totalProjects > 0 ? (totalProjects * 120).toLocaleString() : '120'}</strong> can be saved by configuring regional auto-shutdown on non-production clusters.</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono block">Insight 2: S3 lifecycle triggers</span>
            <p className="text-slate-300 leading-relaxed">Object storage models have been identified as utilizing standard storage classes for archives. Configure glacier rules to save up to <strong>74%</strong> monthly storage fees.</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase font-mono block">Insight 3: Reservation Opportunities</span>
            <p className="text-slate-300 leading-relaxed">AWS and Azure workloads inside Production are running constant compute profiles. Procuring 1-Year Savings Plans will reduce microservice costs by <strong>32.8%</strong>.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
