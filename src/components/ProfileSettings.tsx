import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Profile, Settings } from '../types';
import { 
  User, Shield, Mail, Phone, Briefcase, Building, Globe, Compass, 
  Settings as SettingsIcon, AlertCircle, CheckCircle, RefreshCw, Eye, Sparkles 
} from 'lucide-react';

interface ProfileSettingsProps {
  onProfileUpdate?: () => void;
}

export default function ProfileSettings({ onProfileUpdate }: ProfileSettingsProps) {
  // Profile states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [country, setCountry] = useState('United States');
  const [industry, setIndustry] = useState('Technology');

  // Settings states
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [defaultProvider, setDefaultProvider] = useState('AWS');
  const [defaultRegion, setDefaultRegion] = useState('us-east-1');

  // Status indicators
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProfileAndSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const prof = await api.getProfile();
      setName(prof.name);
      setEmail(prof.email);
      setPhone(prof.phone || '');
      setCompany(prof.company || '');
      setGstNumber(prof.gst_number || '');
      setCountry(prof.country || 'United States');
      setIndustry(prof.industry || 'Technology');

      const setts = await api.getSettings();
      setTheme(setts.theme);
      setLanguage(setts.language);
      setCurrency(setts.currency);
      setTimezone(setts.timezone);
      setBudgetAlerts(setts.budget_alerts);
      setDefaultProvider(setts.default_provider || 'AWS');
      setDefaultRegion(setts.default_region || 'us-east-1');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndSettings();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    setSuccess('');
    try {
      await api.updateProfile({
        name,
        email,
        phone,
        company,
        gst_number: gstNumber,
        country,
        industry
      });
      setSuccess('Enterprise identity updated in the database!');
      if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to save profile details.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setError('');
    setSuccess('');
    try {
      await api.updateSettings({
        theme,
        language,
        currency,
        timezone,
        budget_alerts: budgetAlerts,
        default_provider: defaultProvider,
        default_region: defaultRegion
      });
      setSuccess('Preferences updated. Changes saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
        <span className="text-xs font-mono text-slate-500">Retrieving configuration tables...</span>
      </div>
    );
  }

  return (
    <div id="settings-viewport" className="space-y-8 animate-fade-in text-xs">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Configurations</h1>
        <p className="text-sm text-slate-500">Edit enterprise profile, default provider rules, billing currency, and budget cap preferences.</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 flex items-start space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl text-emerald-700 flex items-start space-x-3 shadow-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Module A: Profile Info Form */}
        <form onSubmit={handleProfileSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">A. Corporate Identity Card</span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Authorized Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
                <input 
                  type="text" 
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">GST / VAT ID</label>
                <input 
                  type="text" 
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Industry Vertical</label>
                <select 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Logistics">Logistics</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Corporate Country</label>
              <input 
                type="text" 
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={savingProfile}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              {savingProfile && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{savingProfile ? 'Updating Identity...' : 'Save Corporate Identity'}</span>
            </button>
          </div>
        </form>

        {/* Module B: Custom Configurations Form */}
        <form onSubmit={handleSettingsSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">B. App & Billing Preferences</span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Billing Currency</label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="JPY">JPY (¥ - Japanese Yen)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Español</option>
                  <option value="German">Deutsch</option>
                  <option value="French">Français</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Default Cloud Provider</label>
                <select 
                  value={defaultProvider}
                  onChange={(e) => setDefaultProvider(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2"
                >
                  <option value="AWS">AWS</option>
                  <option value="GCP">Google Cloud</option>
                  <option value="Azure">Azure</option>
                  <option value="Hetzner">Hetzner</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Default Region</label>
                <select 
                  value={defaultRegion}
                  onChange={(e) => setDefaultRegion(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2"
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Preferred Timezone</label>
              <select 
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              >
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="EST">EST (Eastern Standard Time)</option>
                <option value="PST">PST (Pacific Standard Time)</option>
                <option value="IST">IST (Indian Standard Time)</option>
              </select>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <h5 className="font-bold text-slate-800 text-xs">Email Budget Alerts</h5>
                <p className="text-[10px] text-slate-400 mt-0.5">Receive warnings when spend thresholds hit 80% of project limit.</p>
              </div>
              <input 
                type="checkbox" 
                checked={budgetAlerts}
                onChange={(e) => setBudgetAlerts(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={savingSettings}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              {savingSettings && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>

      </div>

    </div>
  );
}
