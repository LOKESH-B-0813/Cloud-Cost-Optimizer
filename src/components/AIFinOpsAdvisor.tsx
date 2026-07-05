import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { 
  Sparkles, Sliders, ChevronDown, CheckCircle2, AlertTriangle, 
  Cpu, HardDrive, DollarSign, TrendingDown, RefreshCw, Layers, 
  Terminal, ShieldCheck, ArrowRight, Play, Copy, Check
} from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description: string;
  cloud_provider: string;
  budget: number;
  environment: string;
  owner: string;
  active_resources: number;
  health_score: number;
  optimization_score: number;
}

interface Recommendation {
  id: string;
  title: string;
  impact: 'High' | 'Medium' | 'Low';
  category: string;
  current_monthly_spend: number;
  projected_monthly_spend: number;
  savings: number;
  actions: string[];
}

interface OptimizationResult {
  score: number;
  summary: string;
  savings: number;
  recommendations: Recommendation[];
  architecture_insights: string;
}

export default function AIFinOpsAdvisor() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | string>('');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [copiedActionIndex, setCopiedActionIndex] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const projs = await api.getProjects();
      setProjects(projs);
      if (projs.length > 0) {
        setSelectedProjectId(projs[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects for FinOps Advisor:', err);
    }
  };

  const selectedProject = projects.find(p => p.id === Number(selectedProjectId));

  const handleRunAudit = async () => {
    if (!selectedProject) return;
    setLoading(true);
    setResult(null);
    setCompletedSteps({});
    
    const steps = [
      'Scanning connected cloud instances...',
      'Retrieving active resource usage logs...',
      'Parsing monthly billing statements...',
      'Querying regional pricing differentials...',
      'Synthesizing FinOps advisory recommendations via Gemini...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setLoadingStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const rawRes = await api.getAIOptimization(selectedProject, customInstructions);
      setResult(rawRes);
      if (rawRes.recommendations?.length > 0) {
        setExpandedRecId(rawRes.recommendations[0].id);
      }
    } catch (err) {
      console.error('AI optimization failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (recId: string, actionIndex: number) => {
    const key = `${recId}-${actionIndex}`;
    setCompletedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedActionIndex(key);
    setTimeout(() => setCopiedActionIndex(null), 2000);
  };

  return (
    <div id="ai-finops-advisor" className="space-y-8">
      {/* Premium Display Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden text-white shadow-xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/15 border border-indigo-500/25 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider text-indigo-300 uppercase font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Cost Intelligence</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white font-sans">
              AI FinOps Advisor
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              Unlock intelligent, highly tailored resource consolidation paths. This custom AI workspace connects your workload metrics to Gemini's cloud pricing models to discover and automate extreme continuous cost reductions.
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-slate-950/50 border border-slate-800/80 p-4 rounded-2xl h-fit">
            <ShieldCheck className="w-8 h-8 text-indigo-400 animate-pulse shrink-0" />
            <div className="text-left font-mono">
              <span className="text-[9px] text-slate-500 block uppercase font-bold">Audit Status</span>
              <span className="text-xs text-indigo-300 font-extrabold uppercase">GEMINI PRO LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Input Configuration Column */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 h-fit">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4.5 h-4.5 text-indigo-600" />
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Configure Optimization Audit</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Target Project Workspace</label>
              {projects.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 font-mono">
                  No active projects found. Add a project first in the Project Workspace!
                </div>
              ) : (
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setResult(null);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.cloud_provider}) — Budget: ${proj.budget}/mo
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedProject && (
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3.5 font-mono text-[10px]">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/40">
                  <span className="font-bold text-slate-400 uppercase">Resource Parameters</span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[9px] uppercase font-bold">{selectedProject.environment}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-slate-600">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Cloud Platform:</span>
                    <strong className="text-slate-800 text-xs">{selectedProject.cloud_provider}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Budget Allocation:</span>
                    <strong className="text-slate-800 text-xs">${selectedProject.budget}/mo</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Active Nodes:</span>
                    <strong className="text-slate-800 text-xs">{selectedProject.active_resources} Instances</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Owner / Lead:</span>
                    <strong className="text-slate-800 text-xs">{selectedProject.owner}</strong>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Custom Directives & Guidelines (Optional)</label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Focus on database clustering overcompute optimization, or schedule shutdowns for QA environments on weekends..."
                className="w-full h-24 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
              />
              <span className="text-[9px] text-slate-400 mt-1.5 block leading-normal">
                These directives guide the Gemini model parameters to match your company's operational policies exactly.
              </span>
            </div>

            <button
              onClick={handleRunAudit}
              disabled={loading || projects.length === 0}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Initiate AI FinOps Audit</span>
            </button>
          </div>
        </div>

        {/* Right Dashboard Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Default State */}
          {!loading && !result && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[380px] space-y-4">
              <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-500 shadow-md">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="max-w-md">
                <h3 className="font-bold text-slate-700 text-sm">FinOps Advisory Core Active</h3>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Select an active workload project on the left and start the intelligence sequence to receive detailed savings breakdowns and step-by-step resolution actions.
                </p>
              </div>
            </div>
          )}

          {/* Loader State */}
          {loading && (
            <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[380px] space-y-8 shadow-xl">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-2.5 max-w-sm">
                <h4 className="font-bold text-slate-100 text-xs uppercase tracking-widest animate-pulse font-mono">{loadingStep}</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed">
                  Analyzing cost factor metadata indices and preparing cloud consolidation blueprints...
                </p>
              </div>
            </div>
          )}

          {/* Result Dashboard Layout */}
          {result && (
            <div className="space-y-6">
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Health optimization score circle gauge */}
                <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center text-center space-y-4 justify-between">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">FinOps Health Score</span>
                  
                  <div className="relative flex items-center justify-center w-28 h-28">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" className="stroke-slate-100 fill-none" strokeWidth="8" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        className={`stroke-indigo-600 fill-none transition-all duration-1000`} 
                        strokeWidth="8" 
                        strokeDasharray="251.2" 
                        strokeDashoffset={251.2 - (251.2 * result.score) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center font-sans">
                      <span className="text-2xl font-black text-slate-800 font-mono">{result.score}%</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{result.score >= 80 ? 'Optimal' : 'Needs Optimization'}</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 leading-normal">
                    Target optimal tier is <strong className="text-indigo-600">92%+</strong> via spot rules.
                  </span>
                </div>

                {/* Savings summary */}
                <div className="md:col-span-7 bg-indigo-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest block font-mono">Consolidated Monthly Savings</span>
                    <h2 className="text-3xl font-black font-mono tracking-tight text-white">${result.savings.toLocaleString()}/mo</h2>
                    <p className="text-[10.5px] text-indigo-200 leading-relaxed font-sans">{result.summary}</p>
                  </div>
                  
                  <div className="border-t border-indigo-800/80 pt-3.5 flex justify-between items-center text-[10px] font-mono text-indigo-300">
                    <span>Projected Year 1:</span>
                    <strong className="text-emerald-300 text-xs font-black">${(result.savings * 12).toLocaleString()} Save</strong>
                  </div>
                </div>

              </div>

              {/* Actionable Recommendations Header */}
              <div className="space-y-3.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Actionable AI Blueprints</span>

                <div className="space-y-4">
                  {result.recommendations.map((rec) => {
                    const isExpanded = expandedRecId === rec.id;
                    return (
                      <div key={rec.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
                        {/* Header click bar */}
                        <button
                          onClick={() => setExpandedRecId(isExpanded ? null : rec.id)}
                          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-all focus:outline-none"
                        >
                          <div className="space-y-1.5 pr-4 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${
                                rec.impact === 'High' ? 'bg-red-50 text-red-600 border border-red-100' :
                                rec.impact === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                'bg-blue-50 text-blue-600 border border-blue-100'
                              }`}>
                                {rec.impact} Impact
                              </span>
                              <span className="text-[8px] font-bold font-mono text-slate-400 uppercase tracking-widest">
                                Category: {rec.category}
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-xs tracking-tight">{rec.title}</h3>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">Estimated Savings</span>
                              <span className="text-xs font-black text-emerald-600 font-mono">${rec.savings}/mo</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>

                        {/* Expandable recommendations list */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/40 space-y-5">
                            {/* Visual transition comparison bar */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white border border-slate-100 p-3 rounded-xl">
                                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">Current Class Run Rate</span>
                                <span className="text-xs font-extrabold text-slate-600 font-mono">${rec.current_monthly_spend}/mo</span>
                              </div>
                              <div className="bg-white border border-slate-100 p-3 rounded-xl relative overflow-hidden">
                                <div className="absolute right-2 top-2 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] px-1.5 py-0.5 rounded uppercase font-bold">
                                  Save ${rec.savings}
                                </div>
                                <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">Projected Cost Class</span>
                                <span className="text-xs font-black text-indigo-600 font-mono">${rec.projected_monthly_spend}/mo</span>
                              </div>
                            </div>

                            {/* Action lists */}
                            <div className="space-y-2.5">
                              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Step-by-Step Resolution Runbook</span>
                              <div className="space-y-2.5">
                                {rec.actions.map((act, idx) => {
                                  const key = `${rec.id}-${idx}`;
                                  const isDone = completedSteps[key];
                                  const isCopied = copiedActionIndex === key;
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                                        isDone 
                                          ? 'bg-slate-100/50 border-slate-200 opacity-60' 
                                          : 'bg-white border-slate-200/80 shadow-xs'
                                      }`}
                                    >
                                      <div className="flex items-start space-x-3 pr-4 flex-1">
                                        <button 
                                          onClick={() => toggleStep(rec.id, idx)}
                                          className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center transition-all focus:outline-none cursor-pointer ${
                                            isDone 
                                              ? 'bg-emerald-500 border-emerald-600 text-white' 
                                              : 'border-slate-300 hover:border-indigo-500 bg-white'
                                          }`}
                                        >
                                          {isDone && <Check className="w-2.5 h-2.5" />}
                                        </button>
                                        <div className="text-[11px] leading-relaxed">
                                          {/* Detect if action has terminal cmd or action text */}
                                          {act.includes("'") ? (
                                            <div className="space-y-1">
                                              <p className={`text-slate-600 ${isDone ? 'line-through text-slate-400' : ''}`}>
                                                {act.split("'")[0]}
                                              </p>
                                              <code className="block bg-slate-900 text-slate-200 px-2 py-1 rounded font-mono text-[9px] break-all border border-slate-800">
                                                {act.split("'")[1]}
                                              </code>
                                              <p className="text-[10px] text-slate-400">
                                                {act.split("'")[2]}
                                              </p>
                                            </div>
                                          ) : (
                                            <p className={`text-slate-600 ${isDone ? 'line-through text-slate-400' : ''}`}>{act}</p>
                                          )}
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => {
                                          // Copy the terminal cmd if present, or complete text
                                          const cmd = act.includes("'") ? act.split("'")[1] : act;
                                          copyToClipboard(cmd, key);
                                        }}
                                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 focus:outline-none transition-all shrink-0 cursor-pointer"
                                        title="Copy instruction or command"
                                      >
                                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Long Term Architecture Insights Critique */}
              <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3 font-sans">
                <div className="flex items-center space-x-2 border-b border-slate-800/60 pb-2.5">
                  <Terminal className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="font-extrabold text-[10px] uppercase tracking-widest text-slate-200">Architectural Optimization Critique</span>
                </div>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  {result.architecture_insights}
                </p>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
