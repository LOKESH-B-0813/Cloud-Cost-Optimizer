import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Project, ComparisonItem, Recommendation } from '../types';
import { 
  Cloud, DollarSign, Database, Server, HardDrive, Globe, RefreshCw, 
  Sparkles, Save, CheckCircle, FileText, ChevronDown, ListFilter, AlertCircle, 
  HelpCircle, Sliders, Shield, Activity, GraduationCap, Eye, Layers, BarChart3
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
} from 'chart.js';
import { Bar, Pie, Doughnut, Radar } from 'react-chartjs-2';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
);

const PROVIDER_NAMES_MAP: Record<string, string> = {
  aws: 'Amazon Web Services (AWS)',
  gcp: 'Google Cloud Platform (GCP)',
  azure: 'Microsoft Azure',
  oracle: 'Oracle Cloud Infrastructure (OCI)',
  ibm: 'IBM Cloud',
  alibaba: 'Alibaba Cloud',
  digitalocean: 'DigitalOcean',
  linode: 'Linode / Akamai',
  vultr: 'Vultr',
  hetzner: 'Hetzner Online',
  ovh: 'OVHcloud',
  scaleway: 'Scaleway',
  upcloud: 'UpCloud',
  cloudflare: 'Cloudflare',
  tencent: 'Tencent Cloud',
  huawei: 'Huawei Cloud',
  wasabi: 'Wasabi Technologies',
  backblaze: 'Backblaze B2',
  render: 'Render',
  railway: 'Railway',
  flyio: 'Fly.io',
  hostinger: 'Hostinger Cloud'
};

interface CalculatorProps {
  reopenedCalculation?: any | null;
  clearReopenedCalculation?: () => void;
}

export default function Calculator({ reopenedCalculation, clearReopenedCalculation }: CalculatorProps = {}) {
  // 15 Logical Section States
  
  // Section 1: Project Information
  const [projectId, setProjectId] = useState<number | null>(null);
  
  // Section 2: Cloud Provider
  const [selectedProvider, setSelectedProvider] = useState('aws');
  
  // Section 3: Region
  const [region, setRegion] = useState('us-east-1');
  
  // Section 4: Compute Resources
  const [vcpus, setVcpus] = useState(4);
  const [ram, setRam] = useState(16);
  const [hours, setHours] = useState(730);

  // Section 5: Storage Resources
  const [storageGb, setStorageGb] = useState(100);
  const [objectStorageGb, setObjectStorageGb] = useState(500);

  // Section 6: Database Services
  const [dbEngine, setDbEngine] = useState('mysql');
  const [dbVcpus, setDbVcpus] = useState(2);
  const [dbRam, setDbRam] = useState(8);

  // Section 7: Networking
  const [bandwidthGb, setBandwidthGb] = useState(1000);

  // Section 8: Load Balancer
  const [loadBalancers, setLoadBalancers] = useState(1);

  // Section 9: Backup
  const [snapshotsGb, setSnapshotsGb] = useState(50);

  // Section 10: CDN
  const [cdnGb, setCndGb] = useState(2000);

  // Section 11: AI Services
  const [enableAI, setEnableAI] = useState(false);
  const [aiTokensMillion, setAiTokensMillion] = useState(5);

  // Section 12: Monitoring
  const [enableMonitoring, setEnableMonitoring] = useState(false);

  // Section 13: Security
  const [enableSecurity, setEnableSecurity] = useState(false);

  // Section 14: Taxes
  const [taxRate, setTaxRate] = useState(18.0);

  // Section 15: Additional Services
  const [enableEnterpriseSupport, setEnableEnterpriseSupport] = useState(false);

  // Form Validation & UI States
  const [projects, setProjects] = useState<Project[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Result States
  const [estimatedResult, setEstimatedResult] = useState<any | null>(null);
  const [savedCalcId, setSavedCalcId] = useState<number | null>(null);
  const [compilingReport, setCompilingReport] = useState(false);

  // Load projects
  useEffect(() => {
    api.getProjects().then(setProjects).catch(() => {});
  }, []);

  // Handle auto-populating from reopened calculation specs
  useEffect(() => {
    if (reopenedCalculation) {
      const config = typeof reopenedCalculation.configuration === 'string'
        ? JSON.parse(reopenedCalculation.configuration)
        : reopenedCalculation.configuration;
      
      if (config) {
        if (reopenedCalculation.project_id) setProjectId(reopenedCalculation.project_id);
        if (reopenedCalculation.provider_code) setSelectedProvider(reopenedCalculation.provider_code);
        if (reopenedCalculation.region_code) setRegion(reopenedCalculation.region_code);
        
        if (config.vcpus !== undefined) setVcpus(config.vcpus);
        if (config.ram !== undefined) setRam(config.ram);
        if (config.hours !== undefined) setHours(config.hours);
        if (config.storage_gb !== undefined) setStorageGb(config.storage_gb);
        if (config.object_storage_gb !== undefined) setObjectStorageGb(config.object_storage_gb);
        if (config.db_engine !== undefined) setDbEngine(config.db_engine);
        if (config.db_vcpus !== undefined) setDbVcpus(config.db_vcpus);
        if (config.db_ram !== undefined) setDbRam(config.db_ram);
        if (config.bandwidth_gb !== undefined) setBandwidthGb(config.bandwidth_gb);
        if (config.load_balancers !== undefined) setLoadBalancers(config.load_balancers);
        if (config.snapshots_gb !== undefined) setSnapshotsGb(config.snapshots_gb);
        if (config.cdn_gb !== undefined) setCndGb(config.cdn_gb);
        if (config.enable_ai !== undefined) setEnableAI(config.enable_ai);
        if (config.ai_tokens_million !== undefined) setAiTokensMillion(config.ai_tokens_million);
        if (config.enable_monitoring !== undefined) setEnableMonitoring(config.enable_monitoring);
        if (config.enable_security !== undefined) setEnableSecurity(config.enable_security);
        if (config.tax_rate !== undefined) setTaxRate(config.tax_rate);
        if (config.enable_enterprise_support !== undefined) setEnableEnterpriseSupport(config.enable_enterprise_support);
        
        setSuccess('Successfully loaded past calculation specifications! Review and adapt input fields below.');
        // Clear previous results to prompt recalculation
        setEstimatedResult(null);
        setSavedCalcId(null);
      }
      if (clearReopenedCalculation) {
        clearReopenedCalculation();
      }
    }
  }, [reopenedCalculation, clearReopenedCalculation]);

  // Validation rules before execution
  const validateForm = () => {
    const errors: string[] = [];

    if (vcpus < 1 || !Number.isInteger(vcpus)) {
      errors.push('Compute Resources: vCPUs must be a positive integer of at least 1.');
    }
    if (ram < 1 || !Number.isInteger(ram)) {
      errors.push('Compute Resources: RAM Memory must be a positive integer of at least 1.');
    }
    if (hours < 0 || hours > 730) {
      errors.push('Compute Resources: Monthly Usage Hours must be a value between 0 and 730.');
    }
    if (storageGb < 0) {
      errors.push('Storage Resources: Block Storage cannot be a negative value.');
    }
    if (objectStorageGb < 0) {
      errors.push('Storage Resources: Object Storage cannot be a negative value.');
    }
    if (dbVcpus < 0) {
      errors.push('Database Services: Database vCPUs cannot be a negative value.');
    }
    if (dbRam < 0) {
      errors.push('Database Services: Database RAM cannot be a negative value.');
    }
    if (bandwidthGb < 0) {
      errors.push('Networking: Egress Bandwidth cannot be negative.');
    }
    if (loadBalancers < 0) {
      errors.push('Load Balancer: Count cannot be negative.');
    }
    if (snapshotsGb < 0) {
      errors.push('Backup: Snapshot Storage size cannot be negative.');
    }
    if (cdnGb < 0) {
      errors.push('CDN: Cache Outflow size cannot be negative.');
    }
    if (enableAI && aiTokensMillion < 0) {
      errors.push('AI Services: Token Count cannot be negative.');
    }
    if (taxRate < 0 || taxRate > 100) {
      errors.push('Taxes: Tax Rate percentage must be between 0% and 100%.');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Compile full-stack JSON payload
  const getPayload = () => {
    // Add premiums/additional costs to variables
    let adjustedVcpu = vcpus;
    let adjustedRam = ram;
    let adjustedBlock = storageGb;
    let adjustedObject = objectStorageGb;

    // Simulate premiums in database structures
    if (enableAI) {
      adjustedVcpu += (aiTokensMillion * 0.5); // estimate extra CPU overhead
    }
    if (enableMonitoring) {
      adjustedRam += 2; // logging tracing agent memory allocation
    }
    if (enableSecurity) {
      adjustedBlock += 20; // local security logs buffer
    }

    return {
      selected_provider: selectedProvider,
      region,
      vcpus: adjustedVcpu,
      ram: adjustedRam,
      hours,
      storage_gb: adjustedBlock,
      object_storage_gb: adjustedObject,
      db_engine: dbEngine,
      db_vcpus: dbVcpus,
      db_ram: dbRam,
      load_balancers: loadBalancers,
      bandwidth_gb: bandwidthGb,
      cdn_gb: cdnGb,
      dns_queries: dnsQueries,
      snapshots_gb: snapshotsGb,
      tax_rate: taxRate / 100.0 // backend pricing service wants rate multiplier, e.g. 0.18
    };
  };

  // Default dns queries constant
  const dnsQueries = 1000000;

  const handleEstimate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      setError('Form validation failed. Please fix highlighted specifications below.');
      return;
    }
    
    setCalculating(true);
    setError('');
    setSuccess('');
    setSavedCalcId(null);
    try {
      const res = await api.estimateCost(getPayload());
      
      // Calculate frontend-only premium adjustments
      let baseMonthly = res.selected_provider_cost.monthly_cost;
      
      // Apply premium modifiers
      let multiplier = 1.0;
      if (enableEnterpriseSupport) multiplier += 0.10; // 10% SLA premium

      let extraFlat = 0.0;
      if (enableAI) extraFlat += 150.0; // Serverless Bedrock/Vertex flat
      if (enableMonitoring) extraFlat += 45.0; // Managed Datadog-like APM
      if (enableSecurity) extraFlat += 29.0; // DDoS WAF shield

      // Adjust comparison listings dynamically
      const adjustedComparison = res.comparison.map((item: any) => {
        let cost = item.monthly_cost * multiplier + extraFlat;
        return {
          ...item,
          monthly_cost: Number(cost.toFixed(2)),
          annual_cost: Number((cost * 12).toFixed(2))
        };
      });

      // Sort comparison cheapest to most expensive
      adjustedComparison.sort((a: any, b: any) => a.monthly_cost - b.monthly_cost);

      const updatedRes = {
        ...res,
        selected_provider_cost: {
          ...res.selected_provider_cost,
          monthly_cost: Number((baseMonthly * multiplier + extraFlat).toFixed(2)),
          annual_cost: Number(((baseMonthly * multiplier + extraFlat) * 12).toFixed(2))
        },
        comparison: adjustedComparison
      };

      setEstimatedResult(updatedRes);
    } catch (err: any) {
      setError(err.message || 'Cost calculation failed.');
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveCalculation = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...getPayload(),
        project_id: projectId
      };
      const res = await api.saveCalculation(payload);
      setSuccess('Workload benchmark successfully recorded in database audit history!');
      if (res.calculation && res.calculation.id) {
        setSavedCalcId(res.calculation.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save calculation.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReport = async (fileType: 'PDF' | 'CSV' | 'EXCEL') => {
    if (!savedCalcId) {
      setError('Please save the calculation first to register its ID for report compilation.');
      return;
    }
    setCompilingReport(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.generateReport(savedCalcId, fileType, projectId);
      setSuccess(`${fileType} report successfully compiled! Triggering download...`);
      const downloadUrl = `/api/reports/download/${res.report.id}?token=${localStorage.getItem('cc_token')}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', res.report.file_path || 'report');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError(err.message || 'Report compilation failed.');
    } finally {
      setCompilingReport(false);
    }
  };

  // Run initial estimation on load
  useEffect(() => {
    handleEstimate();
  }, [selectedProvider, region]);

  // Selected project for stats
  const activeProject = projects.find(p => p.id === projectId);

  // ----------------------------------------------------
  // CHART CONFIGURATIONS (Chart.js via React-ChartJS-2)
  // ----------------------------------------------------

  // 1. Provider Cost Comparison Bar Chart
  const providerComparisonChartData = React.useMemo(() => {
    if (!estimatedResult) return null;
    // Extract top 8 providers from comparison matrix
    const dataSlice = estimatedResult.comparison.slice(0, 8);
    return {
      labels: dataSlice.map((item: any) => item.provider_name.split(' (')[0]),
      datasets: [
        {
          label: 'Estimated Monthly Spend ($)',
          data: dataSlice.map((item: any) => item.monthly_cost),
          backgroundColor: dataSlice.map((item: any) => 
            item.provider_code === selectedProvider 
              ? 'rgba(59, 130, 246, 0.85)' // Blue
              : item.provider_code === estimatedResult.comparison[0].provider_code
              ? 'rgba(16, 185, 129, 0.85)' // Emerald
              : 'rgba(148, 163, 184, 0.45)' // Slate
          ),
          borderColor: dataSlice.map((item: any) => 
            item.provider_code === selectedProvider 
              ? 'rgb(59, 130, 246)'
              : item.provider_code === estimatedResult.comparison[0].provider_code
              ? 'rgb(16, 185, 129)'
              : 'rgb(148, 163, 184)'
          ),
          borderWidth: 1.5,
          borderRadius: 6
        }
      ]
    };
  }, [estimatedResult, selectedProvider]);

  // 2. Monthly vs Annual Cost Comparison
  const monthlyVsAnnualChartData = React.useMemo(() => {
    if (!estimatedResult) return null;
    const selected = estimatedResult.selected_provider_cost;
    const cheapest = estimatedResult.comparison[0];
    return {
      labels: ['Selected Cloud', 'Cheapest Cloud'],
      datasets: [
        {
          label: 'Monthly Cost ($)',
          data: [selected.monthly_cost, cheapest.monthly_cost],
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderRadius: 4
        },
        {
          label: 'Annual Cost / 10 ($)', // Scale down annual to make visual readable on same axes
          data: [selected.annual_cost / 10, cheapest.annual_cost / 10],
          backgroundColor: 'rgba(168, 85, 247, 0.7)',
          borderRadius: 4
        }
      ]
    };
  }, [estimatedResult]);

  // 3. Cost Distribution Pie Chart (Resource breakdown for Selected Provider)
  const costDistributionChartData = React.useMemo(() => {
    if (!estimatedResult) return null;
    const bk = estimatedResult.selected_provider_cost.breakdown;
    
    // Sum premium options for extras
    let extrasCost = (bk.load_balancer || 0) + (bk.dns || 0) + (bk.snapshot_backup || 0) + (bk.tax || 0);
    if (enableAI) extrasCost += 150;
    if (enableMonitoring) extrasCost += 45;
    if (enableSecurity) extrasCost += 29;

    return {
      labels: ['Compute', 'Database', 'Storage (Block/Object)', 'Network/Bandwidth', 'CDN', 'Extras/Taxes'],
      datasets: [
        {
          data: [
            bk.compute || 0,
            bk.database || 0,
            (bk.block_storage || 0) + (bk.object_storage || 0),
            bk.bandwidth || 0,
            bk.cdn || 0,
            extrasCost
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',  // blue
            'rgba(244, 63, 94, 0.7)',   // red
            'rgba(16, 185, 129, 0.7)',  // green
            'rgba(245, 158, 11, 0.7)',  // amber
            'rgba(6, 182, 212, 0.7)',   // cyan
            'rgba(139, 92, 246, 0.7)'   // purple
          ],
          borderWidth: 1
        }
      ]
    };
  }, [estimatedResult, enableAI, enableMonitoring, enableSecurity]);

  // 4. Resource Cost Radar Chart (Strengths & Ratings of Selected vs Cheapest)
  const resourceRadarChartData = React.useMemo(() => {
    if (!estimatedResult) return null;
    const selected = estimatedResult.selected_provider_cost;
    const cheapest = estimatedResult.comparison[0];
    return {
      labels: ['Performance', 'Security', 'Scalability', 'Enterprise Suitability', 'Startup Suitability'],
      datasets: [
        {
          label: `${selected.provider_name.split(' ')[0]} Ratings`,
          data: [selected.ratings.perf, selected.ratings.sec, selected.ratings.scale, selected.ratings.ent, selected.ratings.startup],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1.5
        },
        {
          label: `${cheapest.provider_name.split(' ')[0]} Ratings`,
          data: [cheapest.ratings.perf, cheapest.ratings.sec, cheapest.ratings.scale, cheapest.ratings.ent, cheapest.ratings.startup],
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1.5
        }
      ]
    };
  }, [estimatedResult]);

  // 5. Estimated Savings Chart (Savings over different alternatives)
  const estimatedSavingsChartData = React.useMemo(() => {
    if (!estimatedResult) return null;
    const slice = estimatedResult.comparison.slice(1, 6); // next 5 providers
    return {
      labels: slice.map((item: any) => item.provider_name.split(' ')[0]),
      datasets: [
        {
          label: 'Potential Monthly Savings ($)',
          data: slice.map((item: any) => item.estimated_savings),
          backgroundColor: 'rgba(16, 185, 129, 0.65)',
          borderRadius: 4
        }
      ]
    };
  }, [estimatedResult]);

  // 6. Budget Utilization (Doughnut Chart showing current Project Budget Spent vs Remaining)
  const budgetUtilizationChartData = React.useMemo(() => {
    if (!estimatedResult || !activeProject) return null;
    const spent = Number(activeProject.spent || 0) + estimatedResult.selected_provider_cost.monthly_cost;
    const remaining = Math.max(0, Number(activeProject.budget) - spent);
    return {
      labels: ['Allocated Workload Spent', 'Remaining Budget'],
      datasets: [
        {
          data: [spent, remaining],
          backgroundColor: spent > Number(activeProject.budget) 
            ? ['rgba(239, 68, 68, 0.8)', 'rgba(241, 245, 249, 1)'] // Over budget red
            : ['rgba(59, 130, 246, 0.85)', 'rgba(241, 245, 249, 1)'],
          borderWidth: 1
        }
      ]
    };
  }, [estimatedResult, activeProject]);

  return (
    <div id="calculator-workspace" className="space-y-8 animate-fade-in text-xs">
      
      {/* Header Info */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Multi-Cloud Cost Calculator</h1>
        <p className="text-sm text-slate-500">
          Configure specs inside the 15 logical clusters to audit and compare real-time costs instantly against 22+ active catalogs.
        </p>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: 15 Logical Form Sections (Col span 5) */}
        <form onSubmit={handleEstimate} className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center space-x-2 pb-3.5 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800 text-sm">FinOps Specification Console</span>
          </div>

          {/* Validation Warnings Box */}
          {validationErrors.length > 0 && (
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded text-[11px] text-amber-800 space-y-1 shadow-sm">
              <span className="font-bold block flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Form Validation Mismatches:
              </span>
              <ul className="list-disc pl-4 space-y-0.5">
                {validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
              </ul>
            </div>
          )}

          {/* Logical Steps */}

          {/* 1. Project Information */}
          <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">01. Project Linkage</span>
              <span className="text-[10px] text-blue-600 font-bold">Step 1/15</span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Project workspace</label>
              <select 
                value={projectId || ''}
                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Sandbox Environment (No active Project linkage) --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Budget limit: ${p.budget}/mo)</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Cloud Provider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">02. Cloud Provider</span>
              <span className="text-[10px] text-blue-600 font-bold">Step 2/15</span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Selected Audit Provider</label>
              <select 
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="aws">AWS (Amazon Web Services)</option>
                <option value="gcp">Google Cloud Platform (GCP)</option>
                <option value="azure">Microsoft Azure</option>
                <option value="oracle">Oracle Cloud Infrastructure (OCI)</option>
                <option value="ibm">IBM Cloud</option>
                <option value="alibaba">Alibaba Cloud</option>
                <option value="digitalocean">DigitalOcean</option>
                <option value="linode">Linode / Akamai</option>
                <option value="vultr">Vultr</option>
                <option value="hetzner">Hetzner Online</option>
                <option value="ovh">OVHcloud</option>
                <option value="scaleway">Scaleway</option>
                <option value="upcloud">UpCloud</option>
                <option value="cloudflare">Cloudflare Workers</option>
                <option value="tencent">Tencent Cloud</option>
                <option value="huawei">Huawei Cloud</option>
                <option value="render">Render</option>
                <option value="railway">Railway</option>
                <option value="flyio">Fly.io</option>
                <option value="hostinger">Hostinger Cloud</option>
              </select>
            </div>
          </div>

          {/* 3. Region */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">03. Deployment Region</span>
              <span className="text-[10px] text-blue-600 font-bold">Step 3/15</span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Regional Datacenter Location</label>
              <select 
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="us-east-1">US East (N. Virginia)</option>
                <option value="us-west-2">US West (Oregon)</option>
                <option value="eu-west-1">Europe (Ireland)</option>
                <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                <option value="sa-east-1">South America (São Paulo)</option>
                <option value="eu-central-1">Europe (Frankfurt)</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
              </select>
            </div>
          </div>

          {/* 4. Compute Resources */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">04. Compute Resources</span>
              <span className="text-[10px] text-blue-600 font-bold">Step 4/15</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Compute Core (vCPUs)</label>
                <input 
                  type="number" 
                  value={vcpus}
                  onChange={(e) => setVcpus(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">RAM Memory (GB)</label>
                <input 
                  type="number" 
                  value={ram}
                  onChange={(e) => setRam(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Usage Hours / Month</label>
              <input 
                type="number" 
                value={hours}
                onChange={(e) => setHours(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                min="0"
                max="730"
              />
            </div>
          </div>

          {/* 5. Storage Resources */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">05. Storage Resources</span>
              <span className="text-[10px] text-blue-600 font-bold">Step 5/15</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Block SSD Volume (GB)</label>
                <input 
                  type="number" 
                  value={storageGb}
                  onChange={(e) => setStorageGb(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Object Storage (GB)</label>
                <input 
                  type="number" 
                  value={objectStorageGb}
                  onChange={(e) => setObjectStorageGb(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* 6. Database Services */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">06. Database Services</span>
              <span className="text-[10px] text-blue-600 font-bold">Step 6/15</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['mysql', 'postgresql', 'sqlserver'].map(db => (
                <button 
                  key={db}
                  type="button" 
                  onClick={() => setDbEngine(db)}
                  className={`py-1 py-1.5 border rounded-lg text-[9px] font-bold transition-all ${dbEngine === db ? 'bg-blue-600/10 border-blue-400 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  {db === 'sqlserver' ? 'SQL Server' : db.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Database vCPUs</label>
                <input 
                  type="number" 
                  value={dbVcpus}
                  onChange={(e) => setDbVcpus(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Database RAM (GB)</label>
                <input 
                  type="number" 
                  value={dbRam}
                  onChange={(e) => setDbRam(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* 7. Networking */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">07. Networking</span>
              <span className="text-[10px] text-blue-600 font-bold">Step 7/15</span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Egress Bandwidth (GB)</label>
              <input 
                type="number" 
                value={bandwidthGb}
                onChange={(e) => setBandwidthGb(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                min="0"
              />
            </div>
          </div>

          {/* 8. Load Balancer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">08. Load Balancer</span>
              <span className="text-[10px] text-blue-600 font-bold">Step 8/15</span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Load Balancers Count</label>
              <input 
                type="number" 
                value={loadBalancers}
                onChange={(e) => setLoadBalancers(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                min="0"
              />
            </div>
          </div>

          {/* 9. Backup */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">09. Backup/Snapshots</span>
              <span className="text-[10px] text-blue-600 font-bold">Step 9/15</span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Backup Snaps storage (GB)</label>
              <input 
                type="number" 
                value={snapshotsGb}
                onChange={(e) => setSnapshotsGb(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                min="0"
              />
            </div>
          </div>

          {/* 10. CDN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">10. Content Delivery Network</span>
              <span className="text-[10px] text-blue-600 font-bold">Step 10/15</span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CDN Outflow bandwidth (GB)</label>
              <input 
                type="number" 
                value={cdnGb}
                onChange={(e) => setCndGb(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                min="0"
              />
            </div>
          </div>

          {/* 11. AI Services */}
          <div className="space-y-3 p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 11. AI Services
              </span>
              <span className="text-[10px] text-indigo-600 font-bold">Step 11/15</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-semibold text-[10px]">Enable Generative AI Models (Vertex/Bedrock)</span>
              <input 
                type="checkbox"
                checked={enableAI}
                onChange={(e) => setEnableAI(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </div>
            {enableAI && (
              <div className="pt-2">
                <label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">AI Tokens / Month (Millions)</label>
                <input 
                  type="number" 
                  value={aiTokensMillion}
                  onChange={(e) => setAiTokensMillion(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  min="0"
                />
                <span className="text-[9px] text-slate-400 mt-1 block">Simulates LLM inference call weights on server loads (Adds flat $150/mo + token weight).</span>
              </div>
            )}
          </div>

          {/* 12. Monitoring */}
          <div className="space-y-3 p-3.5 bg-teal-50/40 border border-teal-100 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> 12. Monitoring
              </span>
              <span className="text-[10px] text-teal-600 font-bold">Step 12/15</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-semibold text-[10px]">Add Enterprise Managed Monitoring/APM</span>
              <input 
                type="checkbox"
                checked={enableMonitoring}
                onChange={(e) => setEnableMonitoring(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded"
              />
            </div>
            {enableMonitoring && (
              <span className="text-[9px] text-slate-400 block mt-1 leading-normal">Adds agent telemetry collections, tracing diagnostics, and dashboard alerts (Adds flat $45/mo).</span>
            )}
          </div>

          {/* 13. Security */}
          <div className="space-y-3 p-3.5 bg-red-50/40 border border-red-100 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-500 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> 13. Security
              </span>
              <span className="text-[10px] text-red-600 font-bold">Step 13/15</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-semibold text-[10px]">Enable Advanced DDoS Shield & WAF rules</span>
              <input 
                type="checkbox"
                checked={enableSecurity}
                onChange={(e) => setEnableSecurity(e.target.checked)}
                className="w-4 h-4 text-red-500 rounded"
              />
            </div>
            {enableSecurity && (
              <span className="text-[9px] text-slate-400 block mt-1 leading-normal">Ensures high level security shields, web application firewall rules, and immediate threat scanning (Adds flat $29/mo).</span>
            )}
          </div>

          {/* 14. Taxes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">14. Taxes</span>
              <span className="text-[10px] text-blue-600 font-bold">Step 14/15</span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Local Tax rate percentage (%)</label>
              <input 
                type="number" 
                value={taxRate}
                onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* 15. Additional Services */}
          <div className="space-y-3 p-3.5 bg-amber-50/40 border border-amber-100 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> 15. Additional Services
              </span>
              <span className="text-[10px] text-amber-600 font-bold">Step 15/15</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-semibold text-[10px]">Add 24/7 Gold Enterprise SLA Support</span>
              <input 
                type="checkbox"
                checked={enableEnterpriseSupport}
                onChange={(e) => setEnableEnterpriseSupport(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded"
              />
            </div>
            {enableEnterpriseSupport && (
              <span className="text-[9px] text-slate-400 block mt-1 leading-normal">Guarantees dedicated enterprise engineers response time under 15 minutes (Adds 10% premium across final monthly billing).</span>
            )}
          </div>

          {/* Submit btn */}
          <button 
            type="submit" 
            disabled={calculating}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-all flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
            <span>{calculating ? 'Processing benchmark catalogs...' : 'Calculate Equivalent Costs'}</span>
          </button>
        </form>

        {/* Right Side: Charts Bento Grid & Optimization suggestions (Col span 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded text-xs text-red-700 flex items-start space-x-3 shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded text-xs text-emerald-700 flex items-start space-x-3 shadow-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {/* Dynamic Result Panel */}
          {estimatedResult ? (
            <div className="space-y-6">
              
              {/* Live Cost Totals Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Selected Provider Card */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between h-32">
                  <div className="absolute top-[-30%] right-[-10%] w-24 h-24 rounded-full bg-blue-500/10 blur-xl" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Config Monthly Cost</span>
                    <span className="text-[10px] font-mono font-semibold text-blue-400 uppercase">
                      {PROVIDER_NAMES_MAP[selectedProvider]?.split(' (')[0] || selectedProvider.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-white tracking-tight font-mono">
                      ${estimatedResult.selected_provider_cost.monthly_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1">Annual Run Rate: ${estimatedResult.selected_provider_cost.annual_cost.toLocaleString()}</p>
                  </div>
                </div>

                {/* Optimised Card */}
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col justify-between h-32">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cheapest Equivalent Cloud</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">
                      {estimatedResult.comparison[0].provider_name}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-emerald-600 tracking-tight font-mono">
                      ${estimatedResult.comparison[0].monthly_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h4>
                    <p className="text-[10px] text-slate-600 mt-1 font-semibold">
                      Potential monthly savings: ${estimatedResult.selected_provider_cost.monthly_cost > estimatedResult.comparison[0].monthly_cost ? (estimatedResult.selected_provider_cost.monthly_cost - estimatedResult.comparison[0].monthly_cost).toFixed(2) : "0.00"} (Save up to {(100 - (estimatedResult.comparison[0].monthly_cost / estimatedResult.selected_provider_cost.monthly_cost) * 100).toFixed(1)}%)
                    </p>
                  </div>
                </div>

              </div>

              {/* Chart.js Bento Grid Visualizations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Provider Cost Comparison Bar Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">01. Provider Cost Comparison</span>
                  <div className="h-44 flex items-center justify-center">
                    {providerComparisonChartData && (
                      <Bar 
                        data={providerComparisonChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: { y: { grid: { display: false }, ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 9 } } } }
                        }} 
                      />
                    )}
                  </div>
                </div>

                {/* 2. Monthly vs Annual Cost Comparison */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">02. Monthly vs Annual (Scaled)</span>
                  <div className="h-44 flex items-center justify-center">
                    {monthlyVsAnnualChartData && (
                      <Bar 
                        data={monthlyVsAnnualChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { labels: { boxWidth: 10, font: { size: 9 } } } },
                          scales: { y: { grid: { display: false }, ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 9 } } } }
                        }} 
                      />
                    )}
                  </div>
                </div>

                {/* 3. Cost Distribution Pie Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">03. Selected Cost Distribution</span>
                  <div className="h-44 flex items-center justify-center">
                    {costDistributionChartData && (
                      <Pie 
                        data={costDistributionChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: true, position: 'right', labels: { boxWidth: 8, font: { size: 8 } } } }
                        }} 
                      />
                    )}
                  </div>
                </div>

                {/* 4. Provider Capability Ratings Radar */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">04. Selected vs Cheapest Ratings</span>
                  <div className="h-44 flex items-center justify-center">
                    {resourceRadarChartData && (
                      <Radar 
                        data={resourceRadarChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { labels: { boxWidth: 10, font: { size: 8 } } } },
                          scales: { r: { angleLines: { display: false }, ticks: { display: false } } }
                        }} 
                      />
                    )}
                  </div>
                </div>

                {/* 5. Estimated Savings Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">05. Benchmarked Savings Trend</span>
                  <div className="h-44 flex items-center justify-center">
                    {estimatedSavingsChartData && (
                      <Bar 
                        data={estimatedSavingsChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: { y: { grid: { display: false }, ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 9 } } } }
                        }} 
                      />
                    )}
                  </div>
                </div>

                {/* 6. Budget Utilization Progress */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wider">06. Linked Project Budget Utilization</span>
                  <div className="h-44 flex items-center justify-center">
                    {activeProject ? (
                      budgetUtilizationChartData && (
                        <Doughnut 
                          data={budgetUtilizationChartData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 8 } } } }
                          }} 
                        />
                      )
                    ) : (
                      <div className="text-center text-slate-400 font-medium py-10">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No project selected.<br />Link a project in step 1 to view.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Action sync panel */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>FinOps comparison matrix metrics synced.</span>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={handleSaveCalculation}
                    disabled={saving}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{saving ? 'Saving...' : 'Save Audit Log'}</span>
                  </button>
                  
                  {savedCalcId && (
                    <div className="flex space-x-2 animate-fade-in">
                      <button 
                        onClick={() => handleGenerateReport('PDF')}
                        disabled={compilingReport}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 text-red-500" />
                        <span>PDF</span>
                      </button>
                      <button 
                        onClick={() => handleGenerateReport('EXCEL')}
                        disabled={compilingReport}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Excel</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="font-bold text-slate-800 text-xs">Actionable FinOps Recommendations</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {estimatedResult.recommendations.map((rec: Recommendation, rIdx: number) => {
                    const typeColor = rec.type === 'compute_optimization' ? 'border-blue-200 bg-blue-50/50 text-blue-700' : 'border-indigo-200 bg-indigo-50/50 text-indigo-700';
                    return (
                      <div key={rIdx} className={`p-4 border rounded-xl space-y-2 ${typeColor}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-white border rounded font-semibold">
                              {rec.type.replace('_', ' ')}
                            </span>
                            <h5 className="font-bold text-slate-800 text-xs mt-1.5">{rec.title}</h5>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-600 font-mono block">-${Math.round(rec.potential_savings)}/mo</span>
                            <span className="text-[9px] text-slate-400 font-bold block">POTENTIAL SAVINGS</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed">{rec.description}</p>
                        
                        {rec.reasoning && (
                          <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-100 font-mono leading-relaxed">
                            <span className="font-bold text-slate-700 uppercase">Reasoning:</span> {rec.reasoning}
                          </div>
                        )}

                        <div className="flex space-x-4 text-[9px] font-bold uppercase text-slate-400 pt-1">
                          <span>Complexity: <strong className="text-slate-600">{rec.complexity}</strong></span>
                          <span>Impact: <strong className="text-slate-600">{rec.impact}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
              <HelpCircle className="w-12 h-12 text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700 text-sm">Waiting for spec configurations</h4>
              <p className="text-xs max-w-sm mt-1">Configure your cloud computing resources in the panel on the left and submit to analyze pricing.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
