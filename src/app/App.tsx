import React, { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Cloud, LayoutDashboard, FileText, History, Settings, User, LogOut,
  Bell, Search, Moon, Sun, ChevronDown, ChevronRight, ChevronLeft,
  TrendingDown, TrendingUp, DollarSign, Server, Database, Globe,
  Download, Filter, Plus, Trash2, X, Check, ArrowUpRight,
  ArrowDownRight, Zap, Shield, Activity, BarChart2, Menu, Lock, Mail,
  Phone, Building, MapPin, Eye, EyeOff, HardDrive, Wifi, Package,
  AlertTriangle, Info, ChevronUp, RefreshCw, Calculator,
} from "lucide-react";
import { Toaster, toast } from "sonner";

// ═══════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  gstNumber: string;
  country: string;
  passwordHash: string;
  createdAt: string;
  profileImage?: string;
  role: string;
}

interface Calculation {
  id: string;
  userId: string;
  name: string;
  provider: string;
  serviceType: string;
  instanceType: string;
  region: string;
  hours: number;
  storage: number;
  dataTransfer: number;
  instances: number;
  computeCost: number;
  storageCost: number;
  transferCost: number;
  totalMonthly: number;
  annualCost: number;
  savings: number;
  savingsProvider: string;
  createdAt: string;
}

interface UserSettings {
  theme: "dark" | "light";
  currency: string;
  defaultRegion: string;
  defaultProvider: string;
  emailAlerts: boolean;
  weeklyReport: boolean;
  costAlerts: boolean;
  budgetThreshold: number;
  fontSize: string;
}

// ═══════════════════════════════════════════
// CONSTANTS & PRICING ENGINE
// ═══════════════════════════════════════════

const REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "EU West (Ireland)" },
  { value: "eu-central-1", label: "EU Central (Frankfurt)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
  { value: "sa-east-1", label: "South America (São Paulo)" },
];

const COUNTRIES = [
  "United States","United Kingdom","India","Germany","France","Canada","Australia",
  "Japan","Singapore","Brazil","Netherlands","Sweden","Norway","Denmark","Switzerland",
  "Spain","Italy","Mexico","South Korea","New Zealand","South Africa","UAE","Saudi Arabia",
];

const CLOUD_SERVICES: Record<string, Record<string, string[]>> = {
  AWS: {
    "EC2 Instances":     ["t3.micro ($0.0104/hr)","t3.small ($0.0208/hr)","t3.medium ($0.0416/hr)","t3.large ($0.0832/hr)","t3.xlarge ($0.1664/hr)","m5.large ($0.0960/hr)","m5.xlarge ($0.1920/hr)","c5.large ($0.0850/hr)","c5.xlarge ($0.1700/hr)","r5.large ($0.1260/hr)"],
    "RDS Database":      ["db.t3.micro ($0.017/hr)","db.t3.small ($0.034/hr)","db.t3.medium ($0.068/hr)","db.m5.large ($0.171/hr)","db.m5.xlarge ($0.342/hr)"],
    "S3 Storage":        ["Standard ($0.023/GB)","Standard-IA ($0.0125/GB)","Intelligent-Tiering ($0.023/GB)","Glacier ($0.004/GB)"],
    "Lambda Functions":  ["128MB Memory","512MB Memory","1024MB Memory","2048MB Memory"],
  },
  Azure: {
    "Virtual Machines":  ["B1s – 1vCPU/1GB ($0.0104/hr)","B2s – 2vCPU/4GB ($0.0416/hr)","B4ms – 4vCPU/16GB ($0.0832/hr)","D2s_v3 – 2vCPU/8GB ($0.0960/hr)","D4s_v3 – 4vCPU/16GB ($0.1920/hr)","F2s_v2 – 2vCPU/4GB ($0.0850/hr)"],
    "Azure SQL":         ["S0 – 10 DTUs ($15/mo)","S1 – 20 DTUs ($30/mo)","S2 – 50 DTUs ($75/mo)","P1 – 125 DTUs ($465/mo)"],
    "Blob Storage":      ["Hot LRS ($0.0184/GB)","Cool LRS ($0.010/GB)","Archive LRS ($0.00099/GB)"],
    "Azure Functions":   ["Consumption Plan ($0.20/1M req)"],
  },
  GCP: {
    "Compute Engine":    ["e2-micro ($0.0084/hr)","e2-small ($0.0168/hr)","e2-medium ($0.0335/hr)","e2-standard-2 ($0.0671/hr)","n2-standard-2 ($0.0971/hr)","n2-standard-4 ($0.1942/hr)","c2-standard-4 ($0.2088/hr)"],
    "Cloud SQL":         ["db-f1-micro ($0.015/hr)","db-g1-small ($0.050/hr)","db-n1-standard-1 ($0.097/hr)","db-n1-standard-2 ($0.193/hr)"],
    "Cloud Storage":     ["Standard ($0.020/GB)","Nearline ($0.010/GB)","Coldline ($0.004/GB)","Archive ($0.0012/GB)"],
    "Cloud Functions":   ["128MB ($0.0000002/req)","256MB ($0.0000004/req)","512MB ($0.0000008/req)"],
  },
};

// Pricing lookup: [compute_hourly, storage_per_gb, transfer_per_gb]
const PRICE_TABLE: Record<string, Record<string, Record<string, [number, number, number]>>> = {
  AWS: {
    "EC2 Instances":    { "t3.micro ($0.0104/hr)": [0.0104,0,0.09], "t3.small ($0.0208/hr)": [0.0208,0,0.09], "t3.medium ($0.0416/hr)": [0.0416,0,0.09], "t3.large ($0.0832/hr)": [0.0832,0,0.09], "t3.xlarge ($0.1664/hr)": [0.1664,0,0.09], "m5.large ($0.0960/hr)": [0.096,0,0.09], "m5.xlarge ($0.1920/hr)": [0.192,0,0.09], "c5.large ($0.0850/hr)": [0.085,0,0.09], "c5.xlarge ($0.1700/hr)": [0.17,0,0.09], "r5.large ($0.1260/hr)": [0.126,0,0.09] },
    "RDS Database":     { "db.t3.micro ($0.017/hr)": [0.017,0.115,0.09], "db.t3.small ($0.034/hr)": [0.034,0.115,0.09], "db.t3.medium ($0.068/hr)": [0.068,0.115,0.09], "db.m5.large ($0.171/hr)": [0.171,0.115,0.09], "db.m5.xlarge ($0.342/hr)": [0.342,0.115,0.09] },
    "S3 Storage":       { "Standard ($0.023/GB)": [0,0.023,0.09], "Standard-IA ($0.0125/GB)": [0,0.0125,0.09], "Intelligent-Tiering ($0.023/GB)": [0,0.023,0.09], "Glacier ($0.004/GB)": [0,0.004,0.09] },
    "Lambda Functions": { "128MB Memory": [0,0,0.09], "512MB Memory": [0,0,0.09], "1024MB Memory": [0,0,0.09], "2048MB Memory": [0,0,0.09] },
  },
  Azure: {
    "Virtual Machines": { "B1s – 1vCPU/1GB ($0.0104/hr)": [0.0104,0,0.087], "B2s – 2vCPU/4GB ($0.0416/hr)": [0.0416,0,0.087], "B4ms – 4vCPU/16GB ($0.0832/hr)": [0.0832,0,0.087], "D2s_v3 – 2vCPU/8GB ($0.0960/hr)": [0.096,0,0.087], "D4s_v3 – 4vCPU/16GB ($0.1920/hr)": [0.192,0,0.087], "F2s_v2 – 2vCPU/4GB ($0.0850/hr)": [0.085,0,0.087] },
    "Azure SQL":        { "S0 – 10 DTUs ($15/mo)": [0,0,0.087], "S1 – 20 DTUs ($30/mo)": [0,0,0.087], "S2 – 50 DTUs ($75/mo)": [0,0,0.087], "P1 – 125 DTUs ($465/mo)": [0,0,0.087] },
    "Blob Storage":     { "Hot LRS ($0.0184/GB)": [0,0.0184,0.087], "Cool LRS ($0.010/GB)": [0,0.01,0.087], "Archive LRS ($0.00099/GB)": [0,0.00099,0.087] },
    "Azure Functions":  { "Consumption Plan ($0.20/1M req)": [0,0,0.087] },
  },
  GCP: {
    "Compute Engine":   { "e2-micro ($0.0084/hr)": [0.0084,0,0.08], "e2-small ($0.0168/hr)": [0.0168,0,0.08], "e2-medium ($0.0335/hr)": [0.0335,0,0.08], "e2-standard-2 ($0.0671/hr)": [0.0671,0,0.08], "n2-standard-2 ($0.0971/hr)": [0.0971,0,0.08], "n2-standard-4 ($0.1942/hr)": [0.1942,0,0.08], "c2-standard-4 ($0.2088/hr)": [0.2088,0,0.08] },
    "Cloud SQL":        { "db-f1-micro ($0.015/hr)": [0.015,0.17,0.08], "db-g1-small ($0.050/hr)": [0.05,0.17,0.08], "db-n1-standard-1 ($0.097/hr)": [0.097,0.17,0.08], "db-n1-standard-2 ($0.193/hr)": [0.193,0.17,0.08] },
    "Cloud Storage":    { "Standard ($0.020/GB)": [0,0.02,0.08], "Nearline ($0.010/GB)": [0,0.01,0.08], "Coldline ($0.004/GB)": [0,0.004,0.08], "Archive ($0.0012/GB)": [0,0.0012,0.08] },
    "Cloud Functions":  { "128MB ($0.0000002/req)": [0,0,0.08], "256MB ($0.0000004/req)": [0,0,0.08], "512MB ($0.0000008/req)": [0,0,0.08] },
  },
};

// Azure SQL flat monthly prices
const AZURE_SQL_MONTHLY: Record<string, number> = {
  "S0 – 10 DTUs ($15/mo)": 15,
  "S1 – 20 DTUs ($30/mo)": 30,
  "S2 – 50 DTUs ($75/mo)": 75,
  "P1 – 125 DTUs ($465/mo)": 465,
};

// Lambda invocation base costs per million
const LAMBDA_BASE: Record<string, number> = {
  "128MB Memory": 0.20,
  "512MB Memory": 0.60,
  "1024MB Memory": 1.00,
  "2048MB Memory": 1.80,
};
const CLOUD_FUNCTIONS_BASE: Record<string, number> = {
  "128MB ($0.0000002/req)": 0.40,
  "256MB ($0.0000004/req)": 0.80,
  "512MB ($0.0000008/req)": 1.20,
};

const PROVIDER_COLORS: Record<string, string> = {
  AWS: "#FF9900",
  Azure: "#0078D4",
  GCP: "#4285F4",
};

const PROVIDER_BG: Record<string, string> = {
  AWS: "rgba(255,153,0,0.12)",
  Azure: "rgba(0,120,212,0.12)",
  GCP: "rgba(66,133,244,0.12)",
};

// ═══════════════════════════════════════════
// STORAGE UTILITIES (localStorage "DB")
// ═══════════════════════════════════════════

const DB_KEYS = {
  users: "cco_users",
  calcs: "cco_calculations",
  session: "cco_session",
  settings: "cco_settings",
  theme: "cco_theme",
};

function dbGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function dbSet<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers(): User[] { return dbGet<User[]>(DB_KEYS.users) || []; }
function saveUsers(users: User[]): void { dbSet(DB_KEYS.users, users); }

function getCalculations(): Calculation[] { return dbGet<Calculation[]>(DB_KEYS.calcs) || []; }
function saveCalculations(calcs: Calculation[]): void { dbSet(DB_KEYS.calcs, calcs); }

function getSession(): string | null { return dbGet<string>(DB_KEYS.session); }
function saveSession(userId: string): void { dbSet(DB_KEYS.session, userId); }
function clearSession(): void { localStorage.removeItem(DB_KEYS.session); }

function getUserById(id: string): User | null {
  return getUsers().find(u => u.id === id) || null;
}

function getUserSettings(userId: string): UserSettings {
  const all = dbGet<Record<string, UserSettings>>(DB_KEYS.settings) || {};
  return all[userId] ?? {
    theme: "dark", currency: "USD", defaultRegion: "us-east-1",
    defaultProvider: "", emailAlerts: true, weeklyReport: false,
    costAlerts: true, budgetThreshold: 1000, fontSize: "medium",
  };
}

function saveUserSettings(userId: string, settings: UserSettings): void {
  const all = dbGet<Record<string, UserSettings>>(DB_KEYS.settings) || {};
  all[userId] = settings;
  dbSet(DB_KEYS.settings, all);
}

// Simple hash (front-end only; production would use bcrypt server-side)
function hashPassword(password: string): string {
  let hash = 0;
  const salted = `cco_salt_${password}_2024`;
  for (let i = 0; i < salted.length; i++) {
    hash = (Math.imul(31, hash) + salted.charCodeAt(i)) | 0;
  }
  return `cco_${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ═══════════════════════════════════════════
// EXPORT UTILITIES
// ═══════════════════════════════════════════

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) { toast.error("No data to export"); return; }
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(","),
    ...data.map(row => headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ];
  downloadBlob(rows.join("\n"), `${filename}.csv`, "text/csv;charset=utf-8;");
  toast.success("CSV downloaded successfully");
}

function exportExcel(data: Record<string, unknown>[], filename: string) {
  if (!data.length) { toast.error("No data to export"); return; }
  const headers = Object.keys(data[0]);
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"/></head><body><table><thead><tr>${headers.map(h => `<th style="background:#6366f1;color:#fff;font-weight:bold;">${h}</th>`).join("")}</tr></thead><tbody>${data.map(row => `<tr>${headers.map(h => `<td>${String(row[h] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  downloadBlob(html, `${filename}.xls`, "application/vnd.ms-excel");
  toast.success("Excel file downloaded");
}

function exportPDF(data: Record<string, unknown>[], title: string) {
  if (!data.length) { toast.error("No data to export"); return; }
  const headers = Object.keys(data[0]);
  const win = window.open("", "_blank");
  if (!win) { toast.error("Allow pop-ups to export PDF"); return; }
  const html = `<!DOCTYPE html><html><head><title>${title}</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;color:#0c0c10;background:#fff;}h1{font-size:22px;font-weight:600;color:#4f46e5;margin-bottom:4px;}p.sub{font-size:12px;color:#71717a;margin-bottom:24px;}table{width:100%;border-collapse:collapse;font-size:12px;}th{background:#4f46e5;color:#fff;padding:10px 12px;text-align:left;font-weight:600;}td{padding:9px 12px;border-bottom:1px solid #e5e7eb;}tr:nth-child(even) td{background:#f8f8fc;}@media print{body{padding:16px;}}</style></head><body><h1>${title}</h1><p class="sub">Generated on ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})} · Cloud Cost Optimizer</p><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${data.map(row=>`<tr>${headers.map(h=>`<td>${String(row[h]??"")}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.print(); }, 500);
  toast.success("PDF report opened for printing");
}

function fmt(val: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(val);
}

function fmtCompact(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return fmt(val);
}

// ═══════════════════════════════════════════
// SVG LOGO
// ═══════════════════════════════════════════

function CloudLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="lg1" x1="6" y1="10" x2="34" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8"/>
          <stop offset="1" stopColor="#6366f1"/>
        </linearGradient>
        <linearGradient id="lg2" x1="10" y1="25" x2="32" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a5b4fc"/>
          <stop offset="1" stopColor="#c7d2fe"/>
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      {/* Cloud body */}
      <path d="M29.5 20.5a5 5 0 00-4.55-6.48 8 8 0 00-15.05 3.23A5.5 5.5 0 008 28.5h20a5 5 0 001.5-8z" fill="url(#lg1)" opacity="0.95"/>
      {/* Trend line inside cloud */}
      <path d="M12 26l4-5 3 3 4-6 3 2" stroke="url(#lg2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"/>
      {/* Dots on trend */}
      <circle cx="12" cy="26" r="1.5" fill="#c7d2fe"/>
      <circle cx="26" cy="20" r="1.5" fill="#c7d2fe"/>
      <circle cx="29" cy="22" r="1.2" fill="#e0e7ff"/>
    </svg>
  );
}

// ═══════════════════════════════════════════
// UI PRIMITIVES
// ═══════════════════════════════════════════

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

function Button({ variant = "primary", size = "md", loading, icon, children, className, disabled, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed select-none";
  const variants = {
    primary:   "bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white shadow-sm shadow-indigo-500/20",
    secondary: "bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border",
    ghost:     "hover:bg-muted text-muted-foreground hover:text-foreground",
    danger:    "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20",
    outline:   "border border-border hover:bg-muted text-foreground",
  };
  const sizes = {
    xs: "px-2.5 py-1 text-xs h-7",
    sm: "px-3 py-1.5 text-sm h-8",
    md: "px-4 py-2 text-sm h-9",
    lg: "px-5 py-2.5 text-base h-11",
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : icon}
      {children}
    </button>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}
        <input
          className={cn(
            "w-full bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all duration-150",
            "h-9 px-3",
            icon && "pl-9",
            error && "border-red-500/50 focus:ring-red-500/30",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

function Select({ label, error, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>}
      <div className="relative">
        <select
          className={cn(
            "w-full bg-input-background border border-border rounded-lg text-sm text-foreground appearance-none",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all duration-150",
            "h-9 px-3 pr-8 cursor-pointer",
            error && "border-red-500/50",
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"/>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function Badge({ children, variant = "default", className }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info"; className?: string }) {
  const variants = {
    default: "bg-muted text-muted-foreground",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    danger:  "bg-red-500/10 text-red-400 border border-red-500/20",
    info:    "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  };
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium", variants[variant], className)}>{children}</span>;
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-xl", className)}>
      {children}
    </div>
  );
}

function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className={cn("relative z-10 bg-card border border-border rounded-2xl shadow-2xl w-full", maxWidth)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-muted">
            <X className="h-4 w-4"/>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon: Icon, trend, trendVal, color = "indigo" }: {
  title: string; value: string; sub?: string; icon: React.ElementType;
  trend?: "up" | "down" | "neutral"; trendVal?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    red: "bg-red-500/10 text-red-400",
    violet: "bg-violet-500/10 text-violet-400",
  };
  return (
    <Card className="p-5 hover:border-border/80 transition-all duration-200 hover:shadow-lg hover:shadow-black/10">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2.5 rounded-lg", colorMap[color] || colorMap.indigo)}>
          <Icon className="h-4 w-4"/>
        </div>
        {trend && trendVal && (
          <span className={cn("inline-flex items-center gap-1 text-xs font-medium",
            trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-muted-foreground"
          )}>
            {trend === "up" ? <ArrowUpRight className="h-3 w-3"/> : trend === "down" ? <ArrowDownRight className="h-3 w-3"/> : null}
            {trendVal}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-semibold text-foreground font-mono tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </Card>
  );
}

// Custom tooltip for recharts
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-xl p-3 text-xs">
      {label && <p className="text-muted-foreground mb-2 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-foreground">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }}/>
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-medium">${Number(p.value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════

type Page = "dashboard" | "calculator" | "reports" | "history" | "profile" | "settings";

const NAV_ITEMS: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { id: "calculator", label: "Calculator", icon: Calculator },
  { id: "reports",    label: "Reports",    icon: FileText },
  { id: "history",    label: "History",    icon: History },
];

const NAV_BOTTOM: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "profile",  label: "Profile",  icon: User },
  { id: "settings", label: "Settings", icon: Settings },
];

function Sidebar({ current, onChange, collapsed, onToggle }: {
  current: Page; onChange: (p: Page) => void; collapsed: boolean; onToggle: () => void;
}) {
  return (
    <aside className={cn(
      "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-20",
      collapsed ? "w-[60px]" : "w-[220px]"
    )}>
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 h-14 border-b border-sidebar-border shrink-0", collapsed && "justify-center px-0")}>
        <CloudLogo size={28}/>
        {!collapsed && <span className="text-sm font-semibold text-foreground tracking-tight whitespace-nowrap">Cloud Cost Optimizer</span>}
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            title={collapsed ? label : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
              collapsed ? "justify-center" : "",
              current === id
                ? "bg-indigo-500/15 text-indigo-400 font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0"/>
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-2 pb-3 space-y-0.5 border-t border-sidebar-border pt-3">
        {NAV_BOTTOM.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            title={collapsed ? label : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
              collapsed ? "justify-center" : "",
              current === id
                ? "bg-indigo-500/15 text-indigo-400 font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0"/>
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? "Expand" : "Collapse"}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4"/>
            : <><ChevronLeft className="h-4 w-4"/><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════

function Header({ page, user, theme, onToggleTheme, onLogout, onNav }: {
  page: Page; user: User; theme: string; onToggleTheme: () => void; onLogout: () => void; onNav: (p: Page) => void;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [search, setSearch] = useState("");

  const PAGE_TITLES: Record<Page, string> = {
    dashboard: "Dashboard", calculator: "Cost Calculator",
    reports: "Reports", history: "Calculation History",
    profile: "My Profile", settings: "Settings",
  };

  const calcs = getCalculations().filter(c => c.userId === user.id);
  const notifs = calcs.length === 0
    ? [{ msg: "Welcome to Cloud Cost Optimizer!", time: "Just now", type: "info" as const }]
    : [
        { msg: `${calcs.length} calculation${calcs.length > 1 ? "s" : ""} saved`, time: "Recent", type: "info" as const },
        { msg: `Total tracked: ${fmtCompact(calcs.reduce((s, c) => s + c.totalMonthly, 0))}/mo`, time: "Updated", type: "success" as const },
      ];

  return (
    <header className="h-14 flex items-center justify-between px-5 bg-card/50 border-b border-border backdrop-blur-sm shrink-0 relative z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-foreground">{PAGE_TITLES[page]}</h1>
        <div className="hidden md:flex items-center gap-2 bg-input-background border border-border rounded-lg px-3 h-8 w-52">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none w-full"
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button onClick={onToggleTheme} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150">
          {theme === "dark" ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => { setNotifOpen(v => !v); setUserOpen(false); }} className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150">
            <Bell className="h-4 w-4"/>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full"/>
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-popover border border-border rounded-xl shadow-2xl z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Notifications</p>
              </div>
              {notifs.map((n, i) => (
                <div key={i} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                  <p className="text-xs text-foreground">{n.msg}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative ml-1">
          <button onClick={() => { setUserOpen(v => !v); setNotifOpen(false); }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-all duration-150">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:block text-xs font-medium text-foreground max-w-[120px] truncate">{user.name}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground"/>
          </button>
          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-popover border border-border rounded-xl shadow-2xl z-50 py-1">
              <div className="px-3 py-2.5 border-b border-border mb-1">
                <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <button onClick={() => { onNav("profile"); setUserOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                <User className="h-3.5 w-3.5 text-muted-foreground"/>Profile
              </button>
              <button onClick={() => { onNav("settings"); setUserOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                <Settings className="h-3.5 w-3.5 text-muted-foreground"/>Settings
              </button>
              <div className="border-t border-border mt-1 pt-1">
                <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="h-3.5 w-3.5"/>Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════
// AUTH PAGES
// ═══════════════════════════════════════════

function LoginPage({ onLogin, onSwitch }: { onLogin: (user: User) => void; onSwitch: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email address";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!user) { setErrors({ email: "No account found with this email" }); setLoading(false); return; }
      if (user.passwordHash !== hashPassword(password)) { setErrors({ password: "Incorrect password" }); setLoading(false); return; }
      saveSession(user.id);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      onLogin(user);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl">
              <CloudLogo size={36}/>
            </div>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Cloud Cost Optimizer</p>
        </div>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email address" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} icon={<Mail className="h-3.5 w-3.5"/>}/>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={cn("w-full bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 h-9 px-3 pl-9 pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all", errors.password && "border-red-500/50")}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-3.5 w-3.5"/> : <Eye className="h-3.5 w-3.5"/>}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>
            <Button type="submit" variant="primary" size="md" className="w-full mt-2" loading={loading}>
              Sign In
            </Button>
          </form>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Don&apos;t have an account?{" "}
          <button onClick={onSwitch} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Create one</button>
        </p>
      </div>
    </div>
  );
}

function RegisterPage({ onRegister, onSwitch }: { onRegister: (user: User) => void; onSwitch: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", phone: "", company: "", gstNumber: "", country: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().split(" ").length < 2) e.name = "Please enter your full name (first & last)";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    else if (getUsers().some(u => u.email.toLowerCase() === form.email.toLowerCase())) e.email = "Email already registered";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "At least 8 characters required";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.company.trim()) e.company = "Company name is required";
    if (!form.country) e.country = "Please select a country";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const user: User = {
        id: generateId(),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        gstNumber: form.gstNumber.trim(),
        country: form.country,
        passwordHash: hashPassword(form.password),
        createdAt: new Date().toISOString(),
        role: "Administrator",
      };
      const users = getUsers();
      users.push(user);
      saveUsers(users);
      saveSession(user.id);
      toast.success(`Account created! Welcome, ${user.name.split(" ")[0]}.`);
      onRegister(user);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl">
              <CloudLogo size={32}/>
            </div>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Cloud Cost Optimizer — Enterprise Edition</p>
        </div>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3.5">
              <Input label="Full Name" placeholder="Jane Smith" value={form.name} onChange={set("name")} error={errors.name} icon={<User className="h-3.5 w-3.5"/>}/>
              <Input label="Email Address" type="email" placeholder="jane@company.com" value={form.email} onChange={set("email")} error={errors.email} icon={<Mail className="h-3.5 w-3.5"/>}/>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
                    <input type={showPw ? "text" : "password"} placeholder="Min. 8 chars" value={form.password} onChange={set("password")}
                      className={cn("w-full bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 h-9 px-3 pl-9 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all", errors.password && "border-red-500/50")}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPw ? <EyeOff className="h-3 w-3"/> : <Eye className="h-3 w-3"/>}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirm</label>
                  <input type="password" placeholder="Repeat password" value={form.confirm} onChange={set("confirm")}
                    className={cn("w-full bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 h-9 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all", errors.confirm && "border-red-500/50")}
                  />
                  {errors.confirm && <p className="text-xs text-red-400">{errors.confirm}</p>}
                </div>
              </div>
              <Input label="Phone Number" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={set("phone")} error={errors.phone} icon={<Phone className="h-3.5 w-3.5"/>}/>
              <Input label="Company Name" placeholder="Acme Technologies Ltd." value={form.company} onChange={set("company")} error={errors.company} icon={<Building className="h-3.5 w-3.5"/>}/>
              <div className="grid grid-cols-2 gap-3">
                <Input label="GST / Tax Number" placeholder="Optional" value={form.gstNumber} onChange={set("gstNumber")}/>
                <Select label="Country" placeholder="Select country" value={form.country} onChange={set("country") as React.ChangeEventHandler<HTMLSelectElement>}
                  options={COUNTRIES.map(c => ({ value: c, label: c }))} error={errors.country}
                />
              </div>
            </div>
            <Button type="submit" variant="primary" size="md" className="w-full mt-1" loading={loading}>
              Create Account
            </Button>
          </form>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <button onClick={onSwitch} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Sign in</button>
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════

function DashboardPage({ user, onNav }: { user: User; onNav: (p: Page) => void }) {
  const calcs = useMemo(() => getCalculations().filter(c => c.userId === user.id), [user.id]);

  const totalMonthly = calcs.reduce((s, c) => s + c.totalMonthly, 0);
  const totalAnnual = calcs.reduce((s, c) => s + c.annualCost, 0);
  const totalSavings = calcs.reduce((s, c) => s + c.savings, 0);
  const providers = [...new Set(calcs.map(c => c.provider))];

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("en-US", { month: "short" });
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const total = calcs
        .filter(c => c.createdAt.startsWith(monthKey))
        .reduce((s, c) => s + c.totalMonthly, 0);
      months.push({ month: label, cost: parseFloat(total.toFixed(2)), forecast: parseFloat((total * 1.05).toFixed(2)) });
    }
    return months;
  }, [calcs]);

  const providerData = useMemo(() => {
    const agg: Record<string, number> = {};
    calcs.forEach(c => { agg[c.provider] = (agg[c.provider] || 0) + c.totalMonthly; });
    return Object.entries(agg).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
  }, [calcs]);

  const serviceData = useMemo(() => {
    const agg: Record<string, number> = {};
    calcs.forEach(c => { agg[c.serviceType] = (agg[c.serviceType] || 0) + c.totalMonthly; });
    return Object.entries(agg).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
  }, [calcs]);

  const PIE_COLORS = ["#818cf8","#34d399","#fbbf24","#a78bfa","#f87171","#38bdf8"];
  const recent = calcs.slice(-5).reverse();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="p-6 space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">{greeting}, {user.name.split(" ")[0]} 👋</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{user.company} · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Monthly Spend" value={fmtCompact(totalMonthly)} sub={`${calcs.length} service${calcs.length !== 1 ? "s" : ""} tracked`} icon={DollarSign} trend={calcs.length > 0 ? "up" : "neutral"} trendVal={calcs.length > 0 ? "+5.2%" : "–"} color="indigo"/>
        <StatCard title="Annual Projection" value={fmtCompact(totalAnnual)} sub="Based on current usage" icon={BarChart2} trend="neutral" trendVal="Estimated" color="violet"/>
        <StatCard title="Potential Savings" value={fmtCompact(totalSavings)} sub="vs. highest-cost alternative" icon={TrendingDown} trend={totalSavings > 0 ? "up" : "neutral"} trendVal={totalSavings > 0 ? "Identified" : "–"} color="emerald"/>
        <StatCard title="Cloud Providers" value={String(providers.length || 0)} sub={providers.length ? providers.join(", ") : "None configured"} icon={Cloud} color="amber"/>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Monthly Cost Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 6 months · actual vs forecast</p>
            </div>
            <Badge variant="info">Live</Badge>
          </div>
          {calcs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <BarChart2 className="h-8 w-8 text-muted-foreground/30 mb-3"/>
              <p className="text-sm text-muted-foreground">No calculations yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Use the Calculator to add cloud costs</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => onNav("calculator")}>
                <Plus className="h-3.5 w-3.5"/>Open Calculator
              </Button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={monthlyTrend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Area type="monotone" dataKey="cost" name="Actual" stroke="#6366f1" strokeWidth={2} fill="url(#costGrad)"/>
                <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="4 4" fill="none"/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Pie chart */}
        <Card className="p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground">Cost by Service</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Breakdown by type</p>
          </div>
          {serviceData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-dashed border-border flex items-center justify-center mb-3">
                <Package className="h-6 w-6 text-muted-foreground/40"/>
              </div>
              <p className="text-xs text-muted-foreground text-center">No data yet</p>
            </div>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={serviceData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value">
                    {serviceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip content={<ChartTooltip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {serviceData.slice(0, 4).map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}/>
                      <span className="text-xs text-muted-foreground truncate max-w-[100px]">{d.name}</span>
                    </div>
                    <span className="text-xs font-mono text-foreground">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Provider bar + Recent table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground">Spend by Provider</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly allocation</p>
          </div>
          {providerData.length === 0 ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">No provider data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={providerData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Bar dataKey="value" name="Monthly Cost" radius={[4, 4, 0, 0]}>
                  {providerData.map((d, i) => <Cell key={i} fill={PROVIDER_COLORS[d.name] || "#6366f1"}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="lg:col-span-3 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Calculations</h3>
            <Button variant="ghost" size="xs" onClick={() => onNav("history")}>View all <ChevronRight className="h-3 w-3"/></Button>
          </div>
          {recent.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <Calculator className="h-7 w-7 text-muted-foreground/30 mb-3"/>
              <p className="text-sm text-muted-foreground">No calculations yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Start by calculating your cloud costs</p>
              <Button variant="primary" size="sm" className="mt-3" onClick={() => onNav("calculator")}>
                <Plus className="h-3.5 w-3.5"/>New Calculation
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {recent.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: PROVIDER_BG[c.provider], color: PROVIDER_COLORS[c.provider] }}>
                      {c.provider[0]}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{c.name || `${c.provider} ${c.serviceType}`}</p>
                      <p className="text-xs text-muted-foreground">{c.serviceType} · {new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-semibold text-foreground">{fmt(c.totalMonthly)}</p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// CALCULATOR PAGE
// ═══════════════════════════════════════════

interface CalcResult {
  computeCost: number; storageCost: number; transferCost: number;
  totalMonthly: number; annualCost: number;
  savings: number; savingsProvider: string;
  breakdown: { label: string; value: number; pct: number }[];
}

function CalculatorPage({ user }: { user: User }) {
  const [provider, setProvider] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [instanceType, setInstanceType] = useState("");
  const [region, setRegion] = useState("");
  const [hours, setHours] = useState("730");
  const [storage, setStorage] = useState("0");
  const [dataTransfer, setDataTransfer] = useState("0");
  const [instances, setInstances] = useState("1");
  const [invocations, setInvocations] = useState("1");
  const [calcName, setCalcName] = useState("");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const serviceTypes = provider ? Object.keys(CLOUD_SERVICES[provider] || {}) : [];
  const instanceTypes = (provider && serviceType) ? CLOUD_SERVICES[provider]?.[serviceType] || [] : [];

  // Reset downstream on provider change
  const handleProviderChange = (v: string) => { setProvider(v); setServiceType(""); setInstanceType(""); setResult(null); setSaved(false); };
  const handleServiceChange = (v: string) => { setServiceType(v); setInstanceType(""); setResult(null); setSaved(false); };
  const handleInstanceChange = (v: string) => { setInstanceType(v); setResult(null); setSaved(false); };

  const isServerless = (serviceType.toLowerCase().includes("lambda") || serviceType.toLowerCase().includes("functions"));
  const isStorage = serviceType.toLowerCase().includes("storage") || serviceType.toLowerCase().includes("s3") || serviceType.toLowerCase().includes("blob");
  const isAzureSQL = serviceType === "Azure SQL";

  const calculate = () => {
    if (!provider || !serviceType || !instanceType) { toast.error("Please select provider, service, and instance type"); return; }
    const pricing = PRICE_TABLE[provider]?.[serviceType]?.[instanceType];
    if (!pricing) { toast.error("Pricing data not available"); return; }
    const [hourly, storagePerGB, transferPerGB] = pricing;
    const h = parseFloat(hours) || 0;
    const s = parseFloat(storage) || 0;
    const t = parseFloat(dataTransfer) || 0;
    const n = parseInt(instances) || 1;
    const inv = parseFloat(invocations) || 0;

    let computeCost = 0;
    if (isAzureSQL) {
      computeCost = AZURE_SQL_MONTHLY[instanceType] || 0;
    } else if (isServerless) {
      const basePerMillion = LAMBDA_BASE[instanceType] || CLOUD_FUNCTIONS_BASE[instanceType] || 0;
      computeCost = inv * basePerMillion;
    } else if (isStorage) {
      computeCost = 0;
    } else {
      computeCost = hourly * h * n;
    }

    const storageCost = s * storagePerGB;
    const transferCost = t * transferPerGB;
    const totalMonthly = computeCost + storageCost + transferCost;
    const annualCost = totalMonthly * 12;

    // Compute savings vs theoretical highest
    const allProviders = ["AWS", "Azure", "GCP"].filter(p => p !== provider);
    let maxAlt = 0;
    for (const ap of allProviders) {
      const apService = Object.keys(CLOUD_SERVICES[ap] || {})[0];
      if (!apService) continue;
      const apInstance = CLOUD_SERVICES[ap][apService]?.[2];
      if (!apInstance) continue;
      const apPricing = PRICE_TABLE[ap]?.[apService]?.[apInstance];
      if (!apPricing) continue;
      const altCost = apPricing[0] * h * n + s * apPricing[1] + t * apPricing[2];
      if (altCost > maxAlt) maxAlt = altCost;
    }
    const savings = Math.max(0, maxAlt - totalMonthly);
    const savingsProvider = savings > 0 ? (allProviders[0] || "") : "";

    const breakdown = [
      { label: isServerless ? "Function Invocations" : isStorage ? "Storage" : "Compute", value: computeCost, pct: totalMonthly > 0 ? (computeCost / totalMonthly) * 100 : 0 },
      { label: "Storage", value: storageCost, pct: totalMonthly > 0 ? (storageCost / totalMonthly) * 100 : 0 },
      { label: "Data Transfer", value: transferCost, pct: totalMonthly > 0 ? (transferCost / totalMonthly) * 100 : 0 },
    ].filter(b => b.value > 0);

    setResult({ computeCost, storageCost, transferCost, totalMonthly, annualCost, savings, savingsProvider, breakdown });
    setSaved(false);
    toast.success("Calculation complete!");
  };

  const handleSave = () => {
    if (!result) return;
    setSaving(true);
    setTimeout(() => {
      const calc: Calculation = {
        id: generateId(), userId: user.id,
        name: calcName || `${provider} ${serviceType}`,
        provider, serviceType, instanceType,
        region: region || "us-east-1",
        hours: parseFloat(hours) || 0,
        storage: parseFloat(storage) || 0,
        dataTransfer: parseFloat(dataTransfer) || 0,
        instances: parseInt(instances) || 1,
        computeCost: result.computeCost,
        storageCost: result.storageCost,
        transferCost: result.transferCost,
        totalMonthly: result.totalMonthly,
        annualCost: result.annualCost,
        savings: result.savings,
        savingsProvider: result.savingsProvider,
        createdAt: new Date().toISOString(),
      };
      const calcs = getCalculations();
      calcs.push(calc);
      saveCalculations(calcs);
      setSaving(false);
      setSaved(true);
      toast.success("Calculation saved to history!");
    }, 500);
  };

  const reset = () => {
    setProvider(""); setServiceType(""); setInstanceType(""); setRegion("");
    setHours("730"); setStorage("0"); setDataTransfer("0"); setInstances("1");
    setInvocations("1"); setCalcName(""); setResult(null); setSaved(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Estimate monthly and annual costs across AWS, Azure, and GCP</p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset} icon={<RefreshCw className="h-3.5 w-3.5"/>}>Reset</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Config panel */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Cloud Provider & Service</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {["AWS", "Azure", "GCP"].map(p => (
                    <button
                      key={p}
                      onClick={() => handleProviderChange(p)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all duration-150",
                        provider === p
                          ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                          : "border-border hover:border-border/80 hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      <span className="text-lg">{p === "AWS" ? "🟠" : p === "Azure" ? "🔵" : "🟢"}</span>
                      <span className="text-xs font-semibold">{p}</span>
                    </button>
                  ))}
                </div>

                <Select
                  label="Service Type"
                  placeholder="— Select service —"
                  value={serviceType}
                  onChange={e => handleServiceChange(e.target.value)}
                  options={serviceTypes.map(s => ({ value: s, label: s }))}
                  disabled={!provider}
                />

                <Select
                  label="Instance / Tier"
                  placeholder="— Select instance —"
                  value={instanceType}
                  onChange={e => handleInstanceChange(e.target.value)}
                  options={instanceTypes.map(i => ({ value: i, label: i }))}
                  disabled={!serviceType}
                />

                <Select
                  label="Region"
                  placeholder="— Select region —"
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  options={REGIONS.map(r => ({ value: r.value, label: r.label }))}
                />
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Usage Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                {!isStorage && !isServerless && (
                  <>
                    <Input label="Hours / Month" type="number" min="0" max="744" placeholder="730" value={hours} onChange={e => setHours(e.target.value)}/>
                    <Input label="No. of Instances" type="number" min="1" placeholder="1" value={instances} onChange={e => setInstances(e.target.value)}/>
                  </>
                )}
                {isServerless && (
                  <Input label="Invocations (millions/mo)" type="number" min="0" placeholder="1" value={invocations} onChange={e => setInvocations(e.target.value)} className="col-span-2"/>
                )}
                <Input label="Storage (GB)" type="number" min="0" placeholder="0" value={storage} onChange={e => setStorage(e.target.value)}/>
                <Input label="Data Transfer (GB)" type="number" min="0" placeholder="0" value={dataTransfer} onChange={e => setDataTransfer(e.target.value)}/>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Calculation Label</h3>
              <Input placeholder={provider && serviceType ? `${provider} ${serviceType} — ${new Date().toLocaleDateString()}` : "E.g. Production API Servers"} value={calcName} onChange={e => setCalcName(e.target.value)}/>
              <p className="text-xs text-muted-foreground mt-1.5">Optional name to identify this calculation in history</p>
            </Card>

            <Button variant="primary" size="lg" className="w-full" onClick={calculate} disabled={!provider || !serviceType || !instanceType}>
              <Calculator className="h-4 w-4"/>Calculate Costs
            </Button>
          </div>

          {/* Result panel */}
          <div className="lg:col-span-2 space-y-4">
            {!result ? (
              <Card className="p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-indigo-400"/>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Ready to Calculate</p>
                <p className="text-xs text-muted-foreground">Select a provider, service, and instance type, then click Calculate.</p>
              </Card>
            ) : (
              <>
                <Card className="p-5 border-indigo-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Monthly Total</p>
                    <Badge variant="info">{provider}</Badge>
                  </div>
                  <p className="text-3xl font-bold text-foreground font-mono">{fmt(result.totalMonthly)}</p>
                  <p className="text-sm text-muted-foreground mt-1">≈ {fmt(result.annualCost)} <span className="text-xs">/year</span></p>
                </Card>

                <Card className="p-5">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Cost Breakdown</h3>
                  {result.breakdown.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No cost components</p>
                  ) : (
                    <div className="space-y-3">
                      {result.breakdown.map((b, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{b.label}</span>
                            <span className="text-xs font-mono font-medium text-foreground">{fmt(b.value)}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${b.pct}%` }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {result.savings > 0 && (
                  <Card className="p-4 border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-start gap-3">
                      <TrendingDown className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0"/>
                      <div>
                        <p className="text-xs font-semibold text-emerald-400">Potential Savings</p>
                        <p className="text-xs text-muted-foreground mt-0.5">You could save <span className="font-mono font-semibold text-emerald-400">{fmt(result.savings)}/mo</span> vs higher-cost configurations.</p>
                      </div>
                    </div>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={saved ? "secondary" : "primary"}
                    size="md"
                    loading={saving}
                    onClick={handleSave}
                    disabled={saved}
                    className="w-full"
                  >
                    {saved ? <><Check className="h-3.5 w-3.5 text-emerald-400"/>Saved</> : <><Plus className="h-3.5 w-3.5"/>Save</>}
                  </Button>
                  <Button variant="outline" size="md" onClick={() => {
                    if (result) {
                      exportCSV([{
                        "Provider": provider, "Service": serviceType, "Instance": instanceType,
                        "Region": region || "us-east-1", "Hours/Month": hours, "Instances": instances,
                        "Storage (GB)": storage, "Transfer (GB)": dataTransfer,
                        "Compute Cost": result.computeCost.toFixed(2),
                        "Storage Cost": result.storageCost.toFixed(2),
                        "Transfer Cost": result.transferCost.toFixed(2),
                        "Monthly Total": result.totalMonthly.toFixed(2),
                        "Annual Total": result.annualCost.toFixed(2),
                        "Date": new Date().toISOString(),
                      }], "cloud_cost_estimate");
                    }
                  }} className="w-full">
                    <Download className="h-3.5 w-3.5"/>Export
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// REPORTS PAGE
// ═══════════════════════════════════════════

function ReportsPage({ user }: { user: User }) {
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split("T")[0]; });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedProvider, setSelectedProvider] = useState("");

  const allCalcs = useMemo(() => getCalculations().filter(c => c.userId === user.id), [user.id]);

  const filtered = useMemo(() => allCalcs.filter(c => {
    const d = new Date(c.createdAt);
    const from = new Date(dateFrom); const to = new Date(dateTo); to.setDate(to.getDate() + 1);
    if (d < from || d > to) return false;
    if (selectedProvider && c.provider !== selectedProvider) return false;
    return true;
  }), [allCalcs, dateFrom, dateTo, selectedProvider]);

  const totalMonthly = filtered.reduce((s, c) => s + c.totalMonthly, 0);
  const totalAnnual = filtered.reduce((s, c) => s + c.annualCost, 0);
  const totalSavings = filtered.reduce((s, c) => s + c.savings, 0);
  const avgMonthly = filtered.length ? totalMonthly / filtered.length : 0;

  const providerBreakdown = useMemo(() => {
    const agg: Record<string, number> = {};
    filtered.forEach(c => { agg[c.provider] = (agg[c.provider] || 0) + c.totalMonthly; });
    return Object.entries(agg).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
  }, [filtered]);

  const serviceBreakdown = useMemo(() => {
    const agg: Record<string, number> = {};
    filtered.forEach(c => { agg[c.serviceType] = (agg[c.serviceType] || 0) + c.totalMonthly; });
    return Object.entries(agg).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) })).sort((a,b) => b.value - a.value);
  }, [filtered]);

  const PIE_COLORS = ["#818cf8","#34d399","#fbbf24","#a78bfa","#f87171","#38bdf8"];

  const exportData = filtered.map(c => ({
    "Name": c.name, "Provider": c.provider, "Service": c.serviceType,
    "Instance": c.instanceType, "Region": c.region,
    "Hours/Month": c.hours, "Instances": c.instances,
    "Storage (GB)": c.storage, "Transfer (GB)": c.dataTransfer,
    "Compute Cost ($)": c.computeCost.toFixed(2),
    "Storage Cost ($)": c.storageCost.toFixed(2),
    "Transfer Cost ($)": c.transferCost.toFixed(2),
    "Monthly Total ($)": c.totalMonthly.toFixed(2),
    "Annual Total ($)": c.annualCost.toFixed(2),
    "Potential Savings ($)": c.savings.toFixed(2),
    "Date": new Date(c.createdAt).toLocaleDateString(),
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-input-background border border-border rounded-lg text-sm text-foreground h-9 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-input-background border border-border rounded-lg text-sm text-foreground h-9 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"/>
          </div>
          <Select
            label="Provider"
            placeholder="All providers"
            value={selectedProvider}
            onChange={e => setSelectedProvider(e.target.value)}
            options={["AWS","Azure","GCP"].map(p => ({ value: p, label: p }))}
            className="w-36"
          />
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5"/>} onClick={() => exportCSV(exportData, "cloud_cost_report")}>CSV</Button>
            <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5"/>} onClick={() => exportExcel(exportData, "cloud_cost_report")}>Excel</Button>
            <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5"/>} onClick={() => exportPDF(exportData, "Cloud Cost Report")}>PDF</Button>
          </div>
        </div>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Monthly Spend" value={fmtCompact(totalMonthly)} sub={`${filtered.length} calculations`} icon={DollarSign} color="indigo"/>
        <StatCard title="Annual Projection" value={fmtCompact(totalAnnual)} sub="All services combined" icon={TrendingUp} color="violet"/>
        <StatCard title="Avg. Monthly Cost" value={fmtCompact(avgMonthly)} sub="Per calculation" icon={Activity} color="amber"/>
        <StatCard title="Identified Savings" value={fmtCompact(totalSavings)} sub="vs. higher alternatives" icon={TrendingDown} color="emerald"/>
      </div>

      {/* Charts */}
      {filtered.length === 0 ? (
        <Card className="p-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4"/>
          <p className="text-sm font-medium text-foreground">No data for selected filters</p>
          <p className="text-xs text-muted-foreground mt-1">Adjust the date range or provider filter, or add calculations first.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Cost by Provider</h3>
            <p className="text-xs text-muted-foreground mb-4">Monthly spend allocation</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={providerBreakdown} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Bar dataKey="value" name="Monthly Cost" radius={[4, 4, 0, 0]}>
                  {providerBreakdown.map((d, i) => <Cell key={i} fill={PROVIDER_COLORS[d.name] || "#6366f1"}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Cost by Service Type</h3>
            <p className="text-xs text-muted-foreground mb-4">Distribution across service categories</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie data={serviceBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {serviceBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip content={<ChartTooltip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {serviceBreakdown.slice(0, 5).map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}/>
                    <span className="text-xs text-muted-foreground truncate flex-1">{d.name}</span>
                    <span className="text-xs font-mono text-foreground shrink-0">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Detailed Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} record{filtered.length !== 1 ? "s" : ""} found</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["Name","Provider","Service","Monthly Cost","Annual Cost","Savings","Date"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info" className="text-xs" style={{ color: PROVIDER_COLORS[c.provider], background: PROVIDER_BG[c.provider] }}>{c.provider}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.serviceType}</td>
                    <td className="px-4 py-3 font-mono text-foreground">{fmt(c.totalMonthly)}</td>
                    <td className="px-4 py-3 font-mono text-foreground">{fmt(c.annualCost)}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400">{c.savings > 0 ? fmt(c.savings) : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// HISTORY PAGE
// ═══════════════════════════════════════════

function HistoryPage({ user }: { user: User }) {
  const [calcs, setCalcs] = useState<Calculation[]>([]);
  const [search, setSearch] = useState("");
  const [filterProvider, setFilterProvider] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "cost" | "provider">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewCalc, setViewCalc] = useState<Calculation | null>(null);

  const load = useCallback(() => {
    setCalcs(getCalculations().filter(c => c.userId === user.id));
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let data = calcs;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(c => c.name.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q) || c.serviceType.toLowerCase().includes(q));
    }
    if (filterProvider) data = data.filter(c => c.provider === filterProvider);
    data = [...data].sort((a, b) => {
      let diff = 0;
      if (sortBy === "date") diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortBy === "cost") diff = a.totalMonthly - b.totalMonthly;
      else diff = a.provider.localeCompare(b.provider);
      return sortDir === "asc" ? diff : -diff;
    });
    return data;
  }, [calcs, search, filterProvider, sortBy, sortDir]);

  const handleDelete = (id: string) => {
    const all = getCalculations().filter(c => !(c.id === id && c.userId === user.id));
    saveCalculations(all);
    setCalcs(all.filter(c => c.userId === user.id));
    setDeleteId(null);
    toast.success("Calculation deleted");
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <ChevronUp className="h-3 w-3 text-muted-foreground/40"/>;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-indigo-400"/> : <ChevronDown className="h-3 w-3 text-indigo-400"/>;
  };

  const exportData = filtered.map(c => ({
    "Name": c.name, "Provider": c.provider, "Service": c.serviceType,
    "Instance": c.instanceType, "Region": c.region,
    "Monthly Total ($)": c.totalMonthly.toFixed(2),
    "Annual Total ($)": c.annualCost.toFixed(2),
    "Compute ($)": c.computeCost.toFixed(2),
    "Storage ($)": c.storageCost.toFixed(2),
    "Transfer ($)": c.transferCost.toFixed(2),
    "Savings ($)": c.savings.toFixed(2),
    "Created At": new Date(c.createdAt).toLocaleString(),
  }));

  return (
    <div className="p-6 space-y-5">
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-input-background border border-border rounded-lg px-3 h-9 flex-1 min-w-[200px]">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search calculations…"
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none w-full"/>
          </div>
          <Select placeholder="All providers" value={filterProvider} onChange={e => setFilterProvider(e.target.value)}
            options={["AWS","Azure","GCP"].map(p => ({ value: p, label: p }))} className="w-36"/>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" icon={<Download className="h-3.5 w-3.5"/>} onClick={() => exportCSV(exportData, "calc_history")}>CSV</Button>
            <Button variant="ghost" size="sm" icon={<Download className="h-3.5 w-3.5"/>} onClick={() => exportExcel(exportData, "calc_history")}>Excel</Button>
            <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5"/>} onClick={() => exportPDF(exportData, "Calculation History")}>PDF</Button>
          </div>
        </div>
      </Card>

      {/* Stats mini */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{filtered.length}</span> of <span className="font-medium text-foreground">{calcs.length}</span> calculations ·
        Total monthly: <span className="font-mono font-semibold text-foreground ml-1">{fmt(filtered.reduce((s,c) => s+c.totalMonthly, 0))}</span>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4"/>
            <p className="text-sm font-medium text-foreground">{calcs.length === 0 ? "No calculations yet" : "No results match your filter"}</p>
            <p className="text-xs text-muted-foreground mt-1">{calcs.length === 0 ? "Use the Calculator to add your first cost estimate" : "Try adjusting the search or filter"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("provider")}>
                    <div className="flex items-center gap-1">Provider<SortIcon col="provider"/></div>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("cost")}>
                    <div className="flex items-center justify-end gap-1">Monthly<SortIcon col="cost"/></div>
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Annual</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Savings</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("date")}>
                    <div className="flex items-center gap-1">Date<SortIcon col="date"/></div>
                  </th>
                  <th className="px-4 py-3"/>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground max-w-[160px] truncate">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ color: PROVIDER_COLORS[c.provider], background: PROVIDER_BG[c.provider] }}>{c.provider}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[140px] truncate">{c.serviceType}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">{fmt(c.totalMonthly)}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{fmt(c.annualCost)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">{c.savings > 0 ? fmt(c.savings) : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setViewCalc(c)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"><Eye className="h-3.5 w-3.5"/></button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="h-3.5 w-3.5"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete confirm modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Calculation">
        <p className="text-sm text-muted-foreground mb-5">This action cannot be undone. The calculation will be permanently deleted from your history.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={() => deleteId && handleDelete(deleteId)} icon={<Trash2 className="h-3.5 w-3.5"/>}>Delete</Button>
        </div>
      </Modal>

      {/* View details modal */}
      {viewCalc && (
        <Modal open={!!viewCalc} onClose={() => setViewCalc(null)} title="Calculation Details" maxWidth="max-w-md">
          <div className="space-y-3 text-sm">
            {[
              ["Name", viewCalc.name], ["Provider", viewCalc.provider], ["Service", viewCalc.serviceType],
              ["Instance", viewCalc.instanceType], ["Region", viewCalc.region],
              ["Hours/Month", String(viewCalc.hours)], ["Instances", String(viewCalc.instances)],
              ["Storage (GB)", String(viewCalc.storage)], ["Data Transfer (GB)", String(viewCalc.dataTransfer)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium text-foreground">{v}</span>
              </div>
            ))}
            <div className="pt-2 space-y-2">
              {[
                ["Compute Cost", fmt(viewCalc.computeCost)],
                ["Storage Cost", fmt(viewCalc.storageCost)],
                ["Transfer Cost", fmt(viewCalc.transferCost)],
                ["Monthly Total", fmt(viewCalc.totalMonthly)],
                ["Annual Total", fmt(viewCalc.annualCost)],
                ["Potential Savings", fmt(viewCalc.savings)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className={cn("font-mono font-semibold", k === "Monthly Total" || k === "Annual Total" ? "text-foreground" : k === "Potential Savings" ? "text-emerald-400" : "text-muted-foreground")}>{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground pt-2">Created: {new Date(viewCalc.createdAt).toLocaleString()}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════════════════

function ProfilePage({ user, onUpdate }: { user: User; onUpdate: (u: User) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user.name, phone: user.phone, company: user.company, gstNumber: user.gstNumber, country: user.country });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const calcs = getCalculations().filter(c => c.userId === user.id);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().split(" ").length < 2) e.name = "Full name required";
    if (!form.phone.trim()) e.phone = "Phone required";
    if (!form.company.trim()) e.company = "Company required";
    if (!form.country) e.country = "Country required";
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      const users = getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...form };
        saveUsers(users);
        onUpdate(users[idx]);
      }
      setSaving(false);
      setEditing(false);
      toast.success("Profile updated successfully");
    }, 500);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Profile header */}
      <Card className="p-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center text-indigo-400 text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-card"/>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.role} · {user.company}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="success">Active</Badge>
              <span className="text-xs text-muted-foreground">Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} icon={<User className="h-3.5 w-3.5"/>}>Edit Profile</Button>
        </div>
      </Card>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: User,     label: "Full Name",     value: user.name },
          { icon: Mail,     label: "Email Address",  value: user.email },
          { icon: Phone,    label: "Phone Number",   value: user.phone || "Not provided" },
          { icon: Building, label: "Company",        value: user.company },
          { icon: MapPin,   label: "Country",        value: user.country || "Not provided" },
          { icon: Shield,   label: "GST / Tax No.",  value: user.gstNumber || "Not provided" },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-muted-foreground"/>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium text-foreground truncate">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Activity summary */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Account Activity</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-foreground font-mono">{calcs.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Calculations</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-foreground font-mono">{[...new Set(calcs.map(c => c.provider))].length}</p>
            <p className="text-xs text-muted-foreground mt-1">Providers Used</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-foreground font-mono">{fmtCompact(calcs.reduce((s, c) => s + c.totalMonthly, 0))}</p>
            <p className="text-xs text-muted-foreground mt-1">Monthly Tracked</p>
          </div>
        </div>
      </Card>

      {/* Edit modal */}
      <Modal open={editing} onClose={() => { setEditing(false); setErrors({}); }} title="Edit Profile">
        <div className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={set("name")} error={errors.name} icon={<User className="h-3.5 w-3.5"/>}/>
          <Input label="Phone Number" value={form.phone} onChange={set("phone")} error={errors.phone} icon={<Phone className="h-3.5 w-3.5"/>}/>
          <Input label="Company Name" value={form.company} onChange={set("company")} error={errors.company} icon={<Building className="h-3.5 w-3.5"/>}/>
          <Input label="GST / Tax Number" value={form.gstNumber} onChange={set("gstNumber")}/>
          <Select label="Country" placeholder="Select country" value={form.country} onChange={set("country") as React.ChangeEventHandler<HTMLSelectElement>}
            options={COUNTRIES.map(c => ({ value: c, label: c }))} error={errors.country}/>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => { setEditing(false); setErrors({}); }}>Cancel</Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave} icon={<Check className="h-3.5 w-3.5"/>}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200", checked ? "bg-indigo-500" : "bg-muted")}>
      <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200", checked ? "translate-x-[18px]" : "translate-x-0.5")}/>
    </button>
  );
}

function SettingsPage({ user }: { user: User }) {
  const [settings, setSettings] = useState<UserSettings>(() => getUserSettings(user.id));
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const update = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(s => ({ ...s, [key]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      saveUserSettings(user.id, settings);
      setSaving(false);
      toast.success("Settings saved");
    }, 400);
  };

  const handlePwChange = () => {
    const e: Record<string, string> = {};
    if (!pwForm.current) e.current = "Required";
    if (!pwForm.next || pwForm.next.length < 8) e.next = "At least 8 characters";
    if (pwForm.next !== pwForm.confirm) e.confirm = "Passwords do not match";
    setPwErrors(e);
    if (Object.keys(e).length) return;

    const user_ = getUserById(user.id);
    if (!user_ || user_.passwordHash !== hashPassword(pwForm.current)) {
      setPwErrors({ current: "Current password is incorrect" }); return;
    }
    setSavingPw(true);
    setTimeout(() => {
      const users = getUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) { users[idx].passwordHash = hashPassword(pwForm.next); saveUsers(users); }
      setSavingPw(false);
      setPwForm({ current: "", next: "", confirm: "" });
      toast.success("Password changed successfully");
    }, 500);
  };

  const SettingRow = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      {/* Appearance */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Appearance</h3>
        <p className="text-xs text-muted-foreground mb-4">Customize how Cloud Cost Optimizer looks</p>
        <SettingRow label="Dark Mode" desc="Toggle between dark and light interface">
          <Toggle checked={settings.theme === "dark"} onChange={() => {
            const next = settings.theme === "dark" ? "light" : "dark";
            update("theme", next);
            if (next === "dark") document.documentElement.classList.add("dark");
            else document.documentElement.classList.remove("dark");
          }}/>
        </SettingRow>
        <SettingRow label="Font Size" desc="Interface text size">
          <div className="flex gap-1">
            {(["small","medium","large"] as const).map(s => (
              <button key={s} onClick={() => update("fontSize", s)}
                className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all capitalize",
                  settings.fontSize === s ? "bg-indigo-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                )}>
                {s}
              </button>
            ))}
          </div>
        </SettingRow>
      </Card>

      {/* Notifications */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Notifications</h3>
        <p className="text-xs text-muted-foreground mb-4">Manage your notification preferences</p>
        <SettingRow label="Email Alerts" desc="Receive important alerts via email">
          <Toggle checked={settings.emailAlerts} onChange={() => update("emailAlerts", !settings.emailAlerts)}/>
        </SettingRow>
        <SettingRow label="Weekly Report" desc="Weekly cost summary emailed every Monday">
          <Toggle checked={settings.weeklyReport} onChange={() => update("weeklyReport", !settings.weeklyReport)}/>
        </SettingRow>
        <SettingRow label="Cost Threshold Alerts" desc="Alert when spending exceeds budget">
          <Toggle checked={settings.costAlerts} onChange={() => update("costAlerts", !settings.costAlerts)}/>
        </SettingRow>
        {settings.costAlerts && (
          <div className="mt-3">
            <Input label="Monthly Budget Threshold (USD)" type="number" min="0" placeholder="1000" value={String(settings.budgetThreshold)}
              onChange={e => update("budgetThreshold", parseFloat(e.target.value) || 0)}/>
          </div>
        )}
      </Card>

      {/* Preferences */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Preferences</h3>
        <p className="text-xs text-muted-foreground mb-4">Default values for the calculator and reports</p>
        <div className="space-y-4">
          <Select label="Default Currency" value={settings.currency} onChange={e => update("currency", e.target.value)}
            options={[{ value: "USD", label: "USD — US Dollar" },{ value: "EUR", label: "EUR — Euro" },{ value: "GBP", label: "GBP — British Pound" },{ value: "INR", label: "INR — Indian Rupee" },{ value: "JPY", label: "JPY — Japanese Yen" }]}
          />
          <Select label="Default Region" value={settings.defaultRegion} onChange={e => update("defaultRegion", e.target.value)}
            options={REGIONS.map(r => ({ value: r.value, label: r.label }))}/>
          <Select label="Default Provider" placeholder="No default" value={settings.defaultProvider} onChange={e => update("defaultProvider", e.target.value)}
            options={["AWS","Azure","GCP"].map(p => ({ value: p, label: p }))}/>
        </div>
      </Card>

      {/* Security */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">Security</h3>
        <p className="text-xs text-muted-foreground mb-4">Manage your password and account security</p>
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Password</label>
            <input type="password" placeholder="Enter current password" value={pwForm.current}
              onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
              className={cn("w-full bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 h-9 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all", pwErrors.current && "border-red-500/50")}/>
            {pwErrors.current && <p className="text-xs text-red-400">{pwErrors.current}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New Password</label>
            <input type="password" placeholder="Min. 8 characters" value={pwForm.next}
              onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
              className={cn("w-full bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 h-9 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all", pwErrors.next && "border-red-500/50")}/>
            {pwErrors.next && <p className="text-xs text-red-400">{pwErrors.next}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirm New Password</label>
            <input type="password" placeholder="Repeat new password" value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              className={cn("w-full bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 h-9 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all", pwErrors.confirm && "border-red-500/50")}/>
            {pwErrors.confirm && <p className="text-xs text-red-400">{pwErrors.confirm}</p>}
          </div>
          <Button variant="outline" size="sm" loading={savingPw} onClick={handlePwChange} icon={<Lock className="h-3.5 w-3.5"/>}>Change Password</Button>
        </div>
      </Card>

      <Button variant="primary" size="md" loading={saving} onClick={handleSave} icon={<Check className="h-3.5 w-3.5"/>}>Save All Settings</Button>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [booted, setBooted] = useState(false);

  // Initialize theme and session on mount
  useEffect(() => {
    const savedTheme = (localStorage.getItem(DB_KEYS.theme) || "dark") as "dark" | "light";
    setTheme(savedTheme);
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    const sessionId = getSession();
    if (sessionId) {
      const u = getUserById(sessionId);
      if (u) {
        setUser(u);
        const s = getUserSettings(u.id);
        if (s.theme) {
          setTheme(s.theme);
          if (s.theme === "dark") document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
        }
      }
    }
    setBooted(true);
  }, []);

  const handleLogin = (u: User) => setUser(u);
  const handleRegister = (u: User) => setUser(u);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setPage("dashboard");
    setAuthView("login");
    toast.success("Signed out successfully");
  };

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(DB_KEYS.theme, next);
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    if (user) {
      const s = getUserSettings(user.id);
      saveUserSettings(user.id, { ...s, theme: next });
    }
  };

  if (!booted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CloudLogo size={40}/>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-indigo-500/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}/>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-right" richColors/>
        {authView === "login"
          ? <LoginPage onLogin={handleLogin} onSwitch={() => setAuthView("register")}/>
          : <RegisterPage onRegister={handleRegister} onSwitch={() => setAuthView("login")}/>
        }
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors/>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar current={page} onChange={setPage} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)}/>
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header
            page={page} user={user} theme={theme}
            onToggleTheme={handleToggleTheme}
            onLogout={handleLogout}
            onNav={setPage}
          />
          <main className="flex-1 overflow-y-auto">
            {page === "dashboard"  && <DashboardPage user={user} onNav={setPage}/>}
            {page === "calculator" && <CalculatorPage user={user}/>}
            {page === "reports"    && <ReportsPage user={user}/>}
            {page === "history"    && <HistoryPage user={user}/>}
            {page === "profile"    && <ProfilePage user={user} onUpdate={setUser}/>}
            {page === "settings"   && <SettingsPage user={user}/>}
          </main>
        </div>
      </div>
    </>
  );
}
