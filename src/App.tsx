import React, { useState, useEffect } from 'react';
import { api } from './lib/api';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Calculator from './components/Calculator';
import CloudProviderComparison from './components/CloudProviderComparison';
import History from './components/History';
import Projects from './components/Projects';
import Reports from './components/Reports';
import ProfileSettings from './components/ProfileSettings';
import AIFinOpsAdvisor from './components/AIFinOpsAdvisor';

import { 
  BarChart3, Calculator as CalcIcon, History as HistIcon, Briefcase, 
  FileText, Settings, LogOut, Cloud, Menu, X, User, ShieldCheck, Layers, Sparkles
} from 'lucide-react';

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [settings, setSettings] = useState<any | null>(null);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'comparison' | 'history' | 'projects' | 'reports' | 'settings' | 'advisor'>('dashboard');
  const [reopenedCalculation, setReopenedCalculation] = useState<any | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const checkSession = async () => {
    const token = localStorage.getItem('cc_token');
    if (!token) {
      setAuthenticated(false);
      setCheckingSession(false);
      return;
    }
    try {
      const prof = await api.getProfile();
      setUser({ id: prof.user_id, email: prof.email });
      setProfile(prof);
      
      const setts = await api.getSettings();
      setSettings(setts);
      setAuthenticated(true);
    } catch {
      localStorage.removeItem('cc_token');
      setAuthenticated(false);
    } finally {
      setCheckingSession(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLoginSuccess = (u: any, p: any, s: any) => {
    setUser(u);
    setProfile(p);
    setSettings(s);
    setAuthenticated(true);
  };

  const handleLogout = () => {
    api.logout();
    setAuthenticated(false);
    setUser(null);
    setProfile(null);
    setSettings(null);
    setActiveTab('dashboard');
  };

  if (checkingSession) {
    return (
      <div id="loading-spinner" className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4">
        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20 animate-bounce">
          <Cloud className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <h3 className="text-white font-extrabold text-sm tracking-widest uppercase">CloudCost<span className="text-blue-400">Optimizer</span></h3>
          <p className="text-xs text-slate-500 font-mono mt-1">Establishing secure SSL database sessions...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: BarChart3 },
    { id: 'advisor', label: 'AI FinOps Advisor', icon: Sparkles },
    { id: 'calculator', label: 'Cost Calculator', icon: CalcIcon },
    { id: 'comparison', label: 'Cloud Provider Comparison', icon: Layers },
    { id: 'history', label: 'Calculation Logs', icon: HistIcon },
    { id: 'projects', label: 'Project Workspace', icon: Briefcase },
    { id: 'reports', label: 'Compiled Reports', icon: FileText },
    { id: 'settings', label: 'Configurations', icon: Settings },
  ] as const;

  return (
    <div id="app-workspace" className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-xs">
      
      {/* Mobile Header Bar */}
      <div id="mobile-header" className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2">
          <Cloud className="w-5 h-5 text-blue-400" />
          <span className="font-extrabold tracking-tight">CloudCost<span className="text-blue-400">Optimizer</span></span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Sidebar Panel (Desktop & Mobile drawer drawer-content) */}
      <div 
        id="sidebar-navigation" 
        className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out bg-slate-900 text-white w-64 p-6 flex flex-col justify-between z-40 shadow-xl shadow-slate-950/20`}
      >
        <div className="space-y-8">
          {/* Sidebar Header Branding logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">CloudOpt <span className="text-blue-400 text-xs align-top font-medium uppercase tracking-wider">Enterprise</span></span>
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="space-y-1.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-[11px] font-semibold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-blue-600/10 border-l-2 border-blue-500 text-white' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Details Card */}
        <div className="space-y-4 border-t border-slate-800 pt-5">
          {profile && (
            <div className="flex items-center space-x-3 p-1">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 font-mono">
                {profile.name ? profile.name[0].toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="font-extrabold text-slate-200 truncate leading-tight">{profile.name}</p>
                <p className="text-[10px] text-slate-500 truncate leading-tight">{profile.company || 'Enterprise Partner'}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3.5 px-4 py-2 bg-slate-800/40 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-xl text-[11px] font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>

      {/* Main Content Workspace Container viewport */}
      <main id="main-scroll-viewport" className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'advisor' && <AIFinOpsAdvisor />}
          {activeTab === 'calculator' && (
            <Calculator 
              reopenedCalculation={reopenedCalculation} 
              clearReopenedCalculation={() => setReopenedCalculation(null)} 
            />
          )}
          {activeTab === 'comparison' && <CloudProviderComparison />}
          {activeTab === 'history' && (
            <History 
              onReopenCalculation={(calc) => {
                setReopenedCalculation(calc);
                setActiveTab('calculator');
              }} 
            />
          )}
          {activeTab === 'projects' && <Projects />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'settings' && <ProfileSettings onProfileUpdate={checkSession} />}
        </div>
      </main>

    </div>
  );
}
