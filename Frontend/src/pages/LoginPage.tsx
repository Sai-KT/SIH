// =============================================================================
// SIH26034 — Login Page
// =============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, AlertCircle, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import type { UserRole } from '../types';
import './LoginPage.css';

const demoAccounts = [
  { label: 'Inspector', email: 'anil.kumar@legalmetrology.gov.in', role: 'INSPECTOR' as UserRole },
  { label: 'Supervisor', email: 'priya.sharma@legalmetrology.gov.in', role: 'SUPERVISOR' as UserRole },
  { label: 'Admin', email: 'rajesh.mehra@legalmetrology.gov.in', role: 'ADMIN' as UserRole },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login, switchRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const role = demoAccounts.find(u => u.email === email)?.role || 'INSPECTOR';
      navigate(role === 'INSPECTOR' ? '/officer' : '/dashboard');
    } catch {
      setError('Invalid credentials. Try a demo account below.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (acc: typeof demoAccounts[0]) => {
    setLoading(true);
    setError('');
    switchRole(acc.role);
    navigate(acc.role === 'INSPECTOR' ? '/officer' : '/dashboard');
    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-panel">
        <div className="login-card animate-fade-in">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-icon">
              <ShieldCheck size={28} />
            </div>
          </div>

          <h1 className="login-title">Legal Metrology<br />Compliance System</h1>
          <p className="login-subtitle">
            Sign in to access the AI-powered inspection platform
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email" className="login-label">Official Email</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@legalmetrology.gov.in"
                  className="login-input"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password" className="login-label">Password</label>
              <div className="login-input-wrap">
                <Lock size={16} className="login-input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="login-input"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(s => !s)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="login-demo">
            <span className="login-demo-label">Quick Demo Access</span>
            <div className="login-demo-buttons">
              {demoAccounts.map(acc => (
                <button
                  key={acc.role}
                  className="login-demo-btn"
                  onClick={() => handleDemoLogin(acc)}
                  disabled={loading}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <p className="login-footer-note">
            Authorized personnel only · Data secured under IT Act 2000
          </p>
        </div>
      </div>

      {/* Right Hero */}
      <div className="login-hero" aria-hidden>
        <div className="login-hero-content">
          <div className="login-hero-badge">Smart India Hackathon 2026</div>
          <h2 className="login-hero-title">
            AI-Powered<br />Packaged Commodity<br />Inspection
          </h2>
          <p className="login-hero-desc">
            Automate extraction, detect violations, and generate compliance reports —
            all in seconds.
          </p>
          <div className="login-stats">
            <div className="login-stat">
              <span className="login-stat-num">94%</span>
              <span className="login-stat-label">AI Accuracy</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-num">3s</span>
              <span className="login-stat-label">Avg. Analysis</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-num">12+</span>
              <span className="login-stat-label">Fields Checked</span>
            </div>
          </div>
        </div>

        <div className="login-hero-decor">
          <div className="decor-circle decor-circle--1" />
          <div className="decor-circle decor-circle--2" />
          <div className="decor-circle decor-circle--3" />
        </div>
      </div>
    </div>
  );
}
