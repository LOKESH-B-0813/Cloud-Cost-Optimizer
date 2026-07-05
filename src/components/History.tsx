import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Calculation, Project } from '../types';
import { 
  Search, Calendar, ArrowUpDown, Trash2, FileDown, Eye, 
  RefreshCw, Cloud, AlertCircle, HelpCircle, X, CheckCircle,
  Copy, FolderOpen
} from 'lucide-react';

interface HistoryProps {
  onReopenCalculation?: (calc: any) => void;
}

export default function History({ onReopenCalculation }: HistoryProps = {}) {
  const [calculations, setCalculations] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  // Modal spec detail state
  const [selectedCalc, setSelectedCalc] = useState<any | null>(null);

  // Background action states
  const [generatingReportId, setGeneratingReportId] = useState<number | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getCalculations({
        provider: selectedProvider || undefined,
        project_id: selectedProject || undefined,
        q: searchQuery || undefined,
        sort_by: sortBy,
        order: order
      });
      setCalculations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch calculation history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    api.getProjects().then(setProjects).catch(() => {});
  }, [selectedProvider, selectedProject, sortBy, order]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this cost calculation history item? This will rollback its linked project budget spend.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.deleteCalculation(id);
      setSuccess('Calculation deleted from database.');
      setCalculations(prev => prev.filter(c => c.id !== id));
      if (selectedCalc && selectedCalc.id === id) {
        setSelectedCalc(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete historical item.');
    }
  };

  const handleDownload = async (calcId: number, fileType: 'PDF' | 'CSV' | 'EXCEL') => {
    setGeneratingReportId(calcId);
    setError('');
    setSuccess('');
    try {
      const res = await api.generateReport(calcId, fileType);
      setSuccess(`${fileType} report successfully compiled! Downloading...`);
      const downloadUrl = `/api/reports/download/${res.report.id}?token=${localStorage.getItem('cc_token')}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', res.report.file_path || 'report');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError(err.message || 'Failed to compile report.');
    } finally {
      setGeneratingReportId(null);
    }
  };

  const getProviderLogoColor = (code: string) => {
    switch (code.toLowerCase()) {
      case 'aws': return 'bg-orange-500 text-white';
      case 'gcp': return 'bg-blue-500 text-white';
      case 'azure': return 'bg-sky-600 text-white';
      default: return 'bg-slate-700 text-white';
    }
  };

  return (
    <div id="history-viewport" className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Calculation Logs</h1>
          <p className="text-sm text-slate-500">Search, view specs configuration and download compiled reports from previous benchmarks.</p>
        </div>
        <button 
          onClick={fetchHistory}
          className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search controls */}
      <form onSubmit={handleSearchSubmit} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        
        {/* Search input */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search region or provider..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Provider select */}
        <div>
          <select 
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Providers</option>
            <option value="aws">AWS</option>
            <option value="gcp">Google Cloud</option>
            <option value="azure">Azure</option>
            <option value="oracle">Oracle</option>
            <option value="hetzner">Hetzner</option>
          </select>
        </div>

        {/* Project select */}
        <div>
          <select 
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Sort option */}
        <div className="flex space-x-2">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at">Date Created</option>
            <option value="cost">Monthly Cost</option>
            <option value="savings">Estimated Savings</option>
          </select>

          <button 
            type="button"
            onClick={() => setOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

      </form>

      {/* Error/Success feeds */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded text-xs text-red-700 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded text-xs text-emerald-700 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid List */}
      {loading ? (
        <div className="flex flex-col items-center py-12 space-y-3">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-xs font-mono text-slate-400">Loading historical cost index...</span>
        </div>
      ) : calculations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calculations.map((calc: any) => {
            // Find linked project name
            const pName = projects.find(p => p.id === calc.project_id)?.name || 'Sandbox';
            const dateStr = calc.created_at ? new Date(calc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
            return (
              <div key={calc.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                
                {/* Upper block */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${getProviderLogoColor(calc.provider_code)}`}>
                      {calc.provider_code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Region: {calc.region_code}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Project: {pName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block">MONTHLY SPEND</span>
                      <strong className="text-slate-800 text-sm font-bold font-mono">${calc.monthly_cost.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block">MONTHLY SAVED</span>
                      <strong className="text-emerald-600 text-sm font-bold font-mono">${calc.estimated_savings.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Operations links */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                  <button 
                    onClick={() => setSelectedCalc(calc)}
                    className="flex-1 py-1.5 px-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Spec</span>
                  </button>

                  <div className="flex items-center justify-center gap-1.5">
                    {onReopenCalculation && (
                      <>
                        <button 
                          onClick={() => onReopenCalculation(calc)}
                          className="p-1.5 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-blue-600 rounded-lg flex items-center justify-center"
                          title="Reopen in active Cost Calculator"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onReopenCalculation({ ...calc, id: undefined })}
                          className="p-1.5 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 text-purple-600 rounded-lg flex items-center justify-center"
                          title="Duplicate specification template"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleDownload(calc.id, 'PDF')}
                      disabled={generatingReportId === calc.id}
                      className="p-1.5 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-red-500 rounded-lg flex items-center justify-center"
                      title="Download PDF Report"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDownload(calc.id, 'EXCEL')}
                      disabled={generatingReportId === calc.id}
                      className="p-1.5 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-emerald-600 rounded-lg flex items-center justify-center"
                      title="Download Excel Report"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(calc.id)}
                      className="p-1.5 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-500 rounded-lg flex items-center justify-center"
                      title="Delete log"
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
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
          <HelpCircle className="w-12 h-12 text-slate-300 mb-2" />
          <h4 className="font-bold text-slate-700 text-sm">No historical log records found</h4>
          <p className="text-xs max-w-sm mt-1">Submit calculations inside the cloud calculator tab first to save history logs to the MySQL backend.</p>
        </div>
      )}

      {/* Modal spec details view */}
      {selectedCalc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Workload Architecture Specifications</h3>
                <span className="text-[10px] text-slate-400 font-mono">ID: {selectedCalc.id} • Saved: {new Date(selectedCalc.created_at).toLocaleDateString()}</span>
              </div>
              <button 
                onClick={() => setSelectedCalc(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable area */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] text-xs">
              
              {/* Core metrics summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900 text-white rounded-xl">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400">Monthly Committed Cost</span>
                  <p className="text-xl font-black">${selectedCalc.monthly_cost.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400">Benchmark Savings Target</span>
                  <p className="text-xl font-black text-emerald-400">${selectedCalc.estimated_savings.toLocaleString()}</p>
                </div>
              </div>

              {/* Parsed JSON Specs */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">A. Resource Configurations</h4>
                
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border rounded-xl font-medium text-slate-700 space-y-1">
                  {(() => {
                    try {
                      const spec = typeof selectedCalc.configuration === 'string' 
                        ? JSON.parse(selectedCalc.configuration) 
                        : selectedCalc.configuration;
                      return (
                        <>
                          <div>vCPUs: <strong className="text-slate-900 font-mono">{spec.vcpus} cores</strong></div>
                          <div>RAM Memory: <strong className="text-slate-900 font-mono">{spec.ram} GB</strong></div>
                          <div>Hours/Month: <strong className="text-slate-900 font-mono">{spec.hours} hrs</strong></div>
                          <div>Block Storage: <strong className="text-slate-900 font-mono">{spec.storage_gb} GB</strong></div>
                          <div>Object Storage: <strong className="text-slate-900 font-mono">{spec.object_storage_gb} GB</strong></div>
                          <div>Database engine: <strong className="text-slate-900 font-mono">{spec.db_engine}</strong></div>
                          <div>Database vCPUs: <strong className="text-slate-900 font-mono">{spec.db_vcpus}</strong></div>
                          <div>Database RAM: <strong className="text-slate-900 font-mono">{spec.db_ram} GB</strong></div>
                          <div>Load Balancers: <strong className="text-slate-900 font-mono">{spec.load_balancers}</strong></div>
                          <div>Bandwidth egress: <strong className="text-slate-900 font-mono">{spec.bandwidth_gb} GB</strong></div>
                        </>
                      );
                    } catch {
                      return <div className="text-red-500">Failed to parse raw specification config.</div>;
                    }
                  })()}
                </div>
              </div>

              {/* Equivalence benchmarks if available */}
              {selectedCalc.comparison && selectedCalc.comparison.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">B. Equivalents Benchmarked</h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 text-[11px]">
                    {selectedCalc.comparison.map((item: any, cIdx: number) => (
                      <div key={cIdx} className="p-3 flex justify-between items-center hover:bg-slate-50">
                        <span className="font-bold text-slate-800">{item.provider_name}</span>
                        <span className="font-mono text-slate-600">${item.monthly_cost.toLocaleString()}/mo</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              {onReopenCalculation && (
                <button 
                  onClick={() => {
                    onReopenCalculation(selectedCalc);
                    setSelectedCalc(null);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-sm flex items-center space-x-1.5 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Reopen Spec</span>
                </button>
              )}
              <button 
                onClick={() => setSelectedCalc(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs shadow-sm"
              >
                Close Spec
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
