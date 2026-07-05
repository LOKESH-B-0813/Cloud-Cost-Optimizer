import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DashboardStats } from '../types';
import { 
  TrendingDown, Briefcase, FileText, History as HistoryIcon, DollarSign, 
  Layers, Database, Network, Percent, ShieldAlert, CheckCircle, RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 font-mono">Compiling cost metrics from MySQL...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 max-w-2xl mx-auto my-12 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold">Failed to load telemetry</h3>
        <p className="text-sm mt-1 text-red-600 mb-4">{error || "Connection timed out"}</p>
        <button onClick={fetchStats} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">
          Retry Connecting
        </button>
      </div>
    );
  }

  // Calculate Budget Utilization
  const budgetUtilPercent = stats.budget_limit > 0 
    ? Math.min(100, (stats.budget_spent / stats.budget_limit) * 100) 
    : 0;

  // Resource breakdown percentages
  const totalResourceCost = (Object.values(stats.resource_distribution) as number[]).reduce((a, b) => a + b, 0) || 1;
  const resPct = (val: number) => Math.round((val / totalResourceCost) * 100);

  // SVG Chart Dimensions & Computations for spending trends
  const trendMaxSpend = Math.max(...stats.cost_trend.map(d => d.spend), 1);
  const chartHeight = 160;
  const chartWidth = 500;
  const points = stats.cost_trend.map((d, i) => {
    const x = (i / (stats.cost_trend.length - 1)) * chartWidth;
    const y = chartHeight - (d.spend / trendMaxSpend) * (chartHeight - 20);
    return { x, y, label: d.month, val: d.spend, savings: d.savings };
  });

  const polylinePath = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = `${polylinePath} ${points[points.length-1].x},${chartHeight} 0,${chartHeight}`;

  return (
    <div id="dashboard-viewport" className="space-y-8 animate-fade-in">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Executive Cost Telemetry</h1>
          <p className="text-sm text-slate-500">Live multi-cloud expenditure insights and FinOps optimizations.</p>
        </div>
        <button 
          onClick={fetchStats}
          className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Database</span>
        </button>
      </div>

      {/* 4 Bento stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Monthly spend */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-slate-950/10 relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-[-30%] right-[-10%] w-32 h-32 rounded-full bg-blue-500/15 blur-2xl" />
          <div className="flex justify-between items-center z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Committed Spend</span>
            <div className="p-1.5 bg-blue-500/10 rounded text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="z-10">
            <h3 className="text-3xl font-extrabold tracking-tight">${stats.monthly_cost.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <span className="text-blue-400 font-bold">100% Real-Time</span>
              <span>• Active catalogs</span>
            </p>
          </div>
        </div>

        {/* Card 2: Annual RUN RATE */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between h-40">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Annual Run Rate</span>
            <div className="p-1.5 bg-slate-100 rounded text-slate-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">${stats.annual_cost.toLocaleString()}</h3>
            <p className="text-xs text-emerald-600 mt-1 font-semibold flex items-center">
              <span>Avg savings: 24.3% achieved</span>
            </p>
          </div>
        </div>

        {/* Card 3: Estimated Savings */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between h-40">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Benchmark Savings Difference</span>
            <div className="p-1.5 bg-emerald-50 rounded text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight">${stats.estimated_savings.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 mt-1">Savings against absolute cheapest cloud equivalent</p>
          </div>
        </div>

        {/* Card 4: Budgets tracker */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between h-40">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Budget Cap Util</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${budgetUtilPercent > 90 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
              {budgetUtilPercent.toFixed(1)}%
            </span>
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">${stats.budget_spent.toLocaleString()} spent</span>
              <span className="text-slate-400">/ ${stats.budget_limit.toLocaleString()} cap</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${budgetUtilPercent > 90 ? 'bg-red-500' : (budgetUtilPercent > 75 ? 'bg-amber-500' : 'bg-blue-600')}`}
                style={{ width: `${budgetUtilPercent}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Primary Analytics grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cost Trend line chart (SVG based) */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Committed Monthly Expenditure Trend</h4>
              <p className="text-xs text-slate-500">Visualizing aggregate spends vs. benchmark savings over time</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">6 Month Log</span>
          </div>

          <div className="relative pt-4">
            {/* SVG graph */}
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full overflow-visible">
              <defs>
                <linearGradient id="spend-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2={chartWidth} y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e2e8f0" strokeWidth="1.5" />

              {/* Area */}
              <polygon points={areaPath} fill="url(#spend-gradient)" />

              {/* Line */}
              <polyline points={polylinePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />

              {/* Data circles */}
              {points.map((p, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
                  <rect 
                    x={p.x - 40} 
                    y={p.y - 35} 
                    width="80" 
                    height="24" 
                    rx="4" 
                    fill="#1e293b" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity" 
                  />
                  <text 
                    x={p.x} 
                    y={p.y - 20} 
                    fill="#ffffff" 
                    fontSize="10" 
                    textAnchor="middle" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity font-mono font-bold"
                  >
                    ${Math.round(p.val).toLocaleString()}
                  </text>
                </g>
              ))}
            </svg>

            {/* X-Axis labels */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-3">
              {stats.cost_trend.map((d, i) => (
                <span key={i}>{d.month}</span>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full" />
              <span>Actual Cloud Spending (Monthly committed invoice aggregate)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span>Benchmarked Potential FinOps Savings Opportunity</span>
            </div>
          </div>
        </div>

        {/* Cloud Provider Distribution */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Provider Distribution</h4>
            <p className="text-xs text-slate-500">Benchmarked workloads catalog share</p>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Custom SVG clean Donut circle */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="none" 
                  stroke="#2563eb" 
                  strokeWidth="3.2" 
                  strokeDasharray="50 100" 
                  strokeDashoffset="0" 
                />
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="3.2" 
                  strokeDasharray="25 100" 
                  strokeDashoffset="-50" 
                />
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="3.2" 
                  strokeDasharray="15 100" 
                  strokeDashoffset="-75" 
                />
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="3.2" 
                  strokeDasharray="10 100" 
                  strokeDashoffset="-90" 
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-900">{stats.provider_distribution.length}</span>
                <p className="text-[10px] uppercase font-bold text-slate-400">Providers</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {stats.provider_distribution.map((d, i) => {
              const colors = ['bg-blue-600', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
              return (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`} />
                    <span className="font-semibold text-slate-700">{d.name}</span>
                  </div>
                  <span className="font-mono text-slate-500 font-bold">{d.value} runs</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bottom section: Resource cost breakdown vs Project Spend Allocation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Resource Allocation Breakdown */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Resource Type Expenditure Breakdown</h4>
            <p className="text-xs text-slate-500">Horizontal cost allocations by cloud core components</p>
          </div>

          <div className="space-y-4">
            
            {/* Compute */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-slate-700">Compute / VMs / Kubernetes</span>
                </div>
                <span className="text-slate-500 font-mono">${Math.round(stats.resource_distribution.compute).toLocaleString()} ({resPct(stats.resource_distribution.compute)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${resPct(stats.resource_distribution.compute)}%` }} />
              </div>
            </div>

            {/* Storage */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Percent className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-slate-700">Block, Object & Backup Storage</span>
                </div>
                <span className="text-slate-500 font-mono">${Math.round(stats.resource_distribution.storage).toLocaleString()} ({resPct(stats.resource_distribution.storage)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${resPct(stats.resource_distribution.storage)}%` }} />
              </div>
            </div>

            {/* Database */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-slate-700">Database Instances</span>
                </div>
                <span className="text-slate-500 font-mono">${Math.round(stats.resource_distribution.database).toLocaleString()} ({resPct(stats.resource_distribution.database)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${resPct(stats.resource_distribution.database)}%` }} />
              </div>
            </div>

            {/* Networking */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Network className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-slate-700">Bandwidth & CDN transfer</span>
                </div>
                <span className="text-slate-500 font-mono">${Math.round(stats.resource_distribution.networking).toLocaleString()} ({resPct(stats.resource_distribution.networking)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${resPct(stats.resource_distribution.networking)}%` }} />
              </div>
            </div>

            {/* Other */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-700">Load Balancer & Auxiliary Taxes</span>
                </div>
                <span className="text-slate-500 font-mono">${Math.round(stats.resource_distribution.other).toLocaleString()} ({resPct(stats.resource_distribution.other)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500 rounded-full" style={{ width: `${resPct(stats.resource_distribution.other)}%` }} />
              </div>
            </div>

          </div>
        </div>

        {/* Project Spending matrix */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Enterprise Project Allocations</h4>
            <p className="text-xs text-slate-500">Financial caps status linked to calculations</p>
          </div>

          <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto pr-1">
            {stats.project_spend_matrix.map((p, i) => {
              const capPercent = Math.min(100, (p.spent / p.budget) * 100);
              const isOver = p.spent > p.budget;
              return (
                <div key={i} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{p.name}</span>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded font-bold uppercase">{p.provider}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOver ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {isOver ? 'Exceeded' : 'Active'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                    <span>${p.spent.toLocaleString()} spent</span>
                    <span>Budget: ${p.budget.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${capPercent}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
