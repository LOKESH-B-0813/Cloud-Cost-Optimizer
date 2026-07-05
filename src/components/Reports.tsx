import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Report } from '../types';
import { 
  FileText, Download, Trash2, RefreshCw, HelpCircle, 
  AlertCircle, CheckCircle, Calendar, ShieldCheck, Eye, Sparkles
} from 'lucide-react';

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [downloadedIds, setDownloadedIds] = useState<Record<number, boolean>>({});
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getReports();
      setReports(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch compiled reports directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this compiled file from server storage?')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.deleteReport(id);
      setSuccess('Compiled file successfully deleted from server storage.');
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete report.');
    }
  };

  const triggerDownload = (report: Report) => {
    setDownloadedIds(prev => ({ ...prev, [report.id]: true }));
    const downloadUrl = `/api/reports/download/${report.id}?token=${localStorage.getItem('cc_token')}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', report.file_path || 'report');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerate = async (report: Report) => {
    if (!report.calculation_id) {
      setError('Cannot regenerate report: Linked calculation ID is missing.');
      return;
    }
    setRegeneratingId(report.id);
    setError('');
    setSuccess('');
    try {
      const res = await api.generateReport(report.calculation_id, report.file_type, report.project_id);
      setSuccess(`Successfully compiled a fresh ${report.file_type} report for calculation #${report.calculation_id}!`);
      await fetchReports();
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate report.');
    } finally {
      setRegeneratingId(null);
    }
  };

  const getFormatBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CSV': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'EXCEL': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div id="reports-viewport" className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Compiled Reports</h1>
          <p className="text-sm text-slate-500">Examine and download compiled PDF executive summaries, CSV matrices, or Excel models.</p>
        </div>
        <button 
          onClick={fetchReports}
          className="p-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded text-xs text-rose-700 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded text-xs text-emerald-700 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Reports workspace directory */}
      {loading && regeneratingId === null ? (
        <div className="flex flex-col items-center py-12 space-y-3">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-xs font-mono text-slate-400">Syncing enterprise files directory...</span>
        </div>
      ) : reports.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800 text-xs">Available Compiled Exports</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Total: {reports.length} files</span>
          </div>

          <div className="divide-y divide-slate-100">
            {reports.map((report) => {
              const dateStr = report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A';
              const isDownloaded = downloadedIds[report.id] || false;
              const isRegenerating = regeneratingId === report.id;

              return (
                <div key={report.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  
                  {/* Left column details */}
                  <div className="flex items-start space-x-3 text-xs">
                    <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600 flex-shrink-0">
                      <FileText className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-800 text-sm">{report.name}</h4>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200`}>
                          REP-#{report.id}
                        </span>
                        {report.calculation_id && (
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200`}>
                            CALC-#{report.calculation_id}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium flex items-center space-x-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Compiled: {dateStr}</span>
                        <span className="mx-1">•</span>
                        <span>Size: <b className="text-slate-600">{report.file_size || 'Unknown'}</b></span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">Filename: {report.file_path}</span>
                    </div>
                  </div>

                  {/* Right actions & Status */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase font-mono ${getFormatBadge(report.file_type)}`}>
                        {report.file_type}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        isDownloaded ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {isDownloaded ? 'Downloaded' : 'Ready'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Preview (triggers immediate download/open in new tab) */}
                      <button 
                        onClick={() => triggerDownload(report)}
                        className="p-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shadow-sm flex items-center space-x-1"
                        title="Preview report"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                      </button>

                      {/* Download Again */}
                      <button 
                        onClick={() => triggerDownload(report)}
                        className="p-1.5 bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 rounded-lg shadow-sm flex items-center space-x-1"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Regenerate */}
                      <button 
                        onClick={() => handleRegenerate(report)}
                        disabled={isRegenerating}
                        className="p-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg shadow-sm flex items-center space-x-1"
                        title="Regenerate this specific report type"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRegenerating ? 'animate-spin' : ''}`} />
                      </button>

                      {/* Delete */}
                      <button 
                        onClick={() => handleDelete(report.id)}
                        className="p-1.5 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-lg shadow-sm"
                        title="Delete report"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
          <HelpCircle className="w-12 h-12 text-slate-300 mb-2" />
          <h4 className="font-bold text-slate-700 text-sm">No compiled exports compiled</h4>
          <p className="text-xs max-w-sm mt-1">To generate PDF summaries, CSV spreadsheets, or Excel models, click "Save Calculation" in the Calculator tab first, then run your instant export.</p>
        </div>
      )}

    </div>
  );
}
