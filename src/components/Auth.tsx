import React, { useState } from 'react';
import { api } from '../lib/api';
import { 
  Cloud, Mail, Lock, User, Phone, Briefcase, Building, Globe, Compass, 
  ArrowRight, ShieldCheck, KeyRound, AlertTriangle, CheckCircle 
} from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (user: any, profile: any, settings: any) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [country, setCountry] = useState('United States');
  const [industry, setIndustry] = useState('Technology');
  
  // Password Reset states
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.login(email, password);
      onLoginSuccess(res.user, res.profile, res.settings);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email || !password || !name) {
      setError('Name, Email, and Password are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.register({
        email,
        password,
        name,
        phone,
        company,
        gst_number: gstNumber,
        country,
        industry
      });
      onLoginSuccess(res.user, res.profile, res.settings);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email) {
      setError('Please provide your registered email.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSuccess('Dispatched reset instructions! Use your mock token below to reset.');
      if (res.reset_token) {
        setResetToken(res.reset_token);
        // Automatically switch view to reset after a brief period or let them click
        setTimeout(() => setView('reset'), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Forgot password failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email || !resetToken || !newPassword) {
      setError('Email, Reset Token, and New Password are required.');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword({
        email,
        token: resetToken,
        new_password: newPassword
      });
      setSuccess('Password reset successful! You can now log in.');
      setTimeout(() => {
        setView('login');
        setPassword('');
        clearMessages();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Left side: Modern cloud-computing illustration branding block */}
      <div id="auth-branding" className="md:w-1/2 bg-slate-900 text-white flex flex-col justify-between p-8 md:p-16 relative overflow-hidden">
        {/* Glow vector effect */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/20 blur-[100px] pointer-events-none" />
        
        {/* Header logo */}
        <div className="flex items-center space-x-3 z-10">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-600/20">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">CloudCost<span className="text-blue-400">Optimizer</span></span>
        </div>

        {/* Content Illustration */}
        <div className="my-12 max-w-lg z-10">
          <div className="inline-flex items-center space-x-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FinOps Standard Multi-Cloud Comparison</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6">
            Eliminate cloud waste with deep analytics
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            Perform real-time cost estimations across 25+ cloud providers. Benchmark compute, storage, databases, and bandwidth. Optimize configurations using enterprise FinOps practices.
          </p>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="mt-1 p-1 bg-blue-600/10 rounded text-blue-400">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">Unified Cost Matrix</p>
                <p className="text-xs text-slate-400">Instantly map VM specs to AWS, GCP, Azure, Oracle, Hetzner, etc.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-1 p-1 bg-blue-600/10 rounded text-blue-400">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">Dynamic Recommendation Engine</p>
                <p className="text-xs text-slate-400">Actionable advice covering rightsizing, reserved committing, and lifecycle tiering.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 z-10">
          © 2026 Cloud Cost Optimizer Inc. Fully Compliant REST APIs & Relational Database.
        </div>
      </div>

      {/* Right side: Authentication Forms */}
      <div id="auth-forms" className="md:w-1/2 bg-white flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {view === 'login' && 'Sign in to your account'}
              {view === 'register' && 'Register your enterprise'}
              {view === 'forgot' && 'Reset your credentials'}
              {view === 'reset' && 'Create a new password'}
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              {view === 'login' && "Enter your email and password to access your dashboards."}
              {view === 'register' && "Begin benchmarking cloud resources immediately."}
              {view === 'forgot' && "Confirm your registered email to receive a reset token."}
              {view === 'reset' && "Submit your token and choose a secure new password."}
            </p>
          </div>

          {/* Alert messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded text-sm text-red-700 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded text-sm text-emerald-700 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {/* Login Form */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com" 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setView('forgot'); clearMessages(); }}
                    className="text-xs text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-slate-900/10 disabled:opacity-50"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-sm text-slate-500 mt-6">
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => { setView('register'); clearMessages(); }}
                  className="text-blue-600 hover:text-blue-500 font-semibold"
                >
                  Register Enterprise
                </button>
              </div>
            </form>
          )}

          {/* Register Form */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe" 
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@company.com" 
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters" 
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Phone className="w-3.5 h-3.5" />
                      </span>
                      <input 
                        type="text" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1-555-0199" 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Company Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Briefcase className="w-3.5 h-3.5" />
                      </span>
                      <input 
                        type="text" 
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="My Corp Ltd" 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">GST/VAT Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Building className="w-3.5 h-3.5" />
                      </span>
                      <input 
                        type="text" 
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value)}
                        placeholder="GST99212001" 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Industry</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Compass className="w-3.5 h-3.5" />
                      </span>
                      <select 
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                      >
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="E-Commerce">E-Commerce</option>
                        <option value="Logistics">Logistics</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Country</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Globe className="w-4 h-4" />
                    </span>
                    <input 
                      type="text" 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="United States" 
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-4 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/10 disabled:opacity-50"
              >
                <span>{loading ? 'Creating Account...' : 'Register Enterprise'}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              <div className="text-center text-sm text-slate-500 mt-4">
                Already registered?{' '}
                <button 
                  type="button" 
                  onClick={() => { setView('login'); clearMessages(); }}
                  className="text-blue-600 hover:text-blue-500 font-semibold"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* Forgot Password View */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Registered Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com" 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-slate-900/10 disabled:opacity-50"
              >
                <span>{loading ? 'Processing...' : 'Request Reset Token'}</span>
                <KeyRound className="w-4 h-4" />
              </button>

              <div className="text-center text-sm text-slate-500 mt-6">
                Back to{' '}
                <button 
                  type="button" 
                  onClick={() => { setView('login'); clearMessages(); }}
                  className="text-blue-600 hover:text-blue-500 font-semibold"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* Reset Password View */}
          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com" 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Reset Token</label>
                <input 
                  type="text" 
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste token received" 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-4 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-slate-900/10 disabled:opacity-50"
              >
                <span>{loading ? 'Updating Password...' : 'Update Password'}</span>
                <KeyRound className="w-4 h-4" />
              </button>

              <div className="text-center text-sm text-slate-500 mt-4">
                Know your password?{' '}
                <button 
                  type="button" 
                  onClick={() => { setView('login'); clearMessages(); }}
                  className="text-blue-600 hover:text-blue-500 font-semibold"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

    </div>
  );
}
