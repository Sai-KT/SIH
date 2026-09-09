// =============================================================================
// SIH26034 — Officer Shell (Field Mode Layout)
// Minimalist top-bar layout for on-ground Legal Metrology Inspectors.
// Replaces the full AppShell — no sidebar, zero admin chrome.
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, MapPin, Wifi, WifiOff, LayoutDashboard,
  CheckCircle2, AlertTriangle, Clock, Zap, ChevronDown, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { officerService } from '../../services/api';
import type { OfficerTally } from '../../types';
import './OfficerShell.css';

// Known market presets — officer can pick without typing
const MARKET_PRESETS = [
  'Crawford Market, Mumbai',
  'Dadar Market, Mumbai',
  'Masjid Bunder, Mumbai',
  'Dharavi Industrial Area, Mumbai',
  'Kurla Market, Mumbai',
  'Vashi APMC, Navi Mumbai',
  'Mankhurd Wholesale Hub, Mumbai',
];

const STORAGE_KEY_LOCATION = 'officer_sticky_location';

export function OfficerShell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tally, setTally] = useState<OfficerTally | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [location, setLocation] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY_LOCATION) || 'Crawford Market, Mumbai',
  );
  const [locationOpen, setLocationOpen] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const locationRef = useRef<HTMLDivElement>(null);

  // ── Network status
  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // ── Daily tally (poll every 30 s)
  const refreshTally = useCallback(async () => {
    try {
      const t = await officerService.getDailySummary(user?.id);
      setTally(t);
    } catch { /* ignore */ }
  }, [user?.id]);

  useEffect(() => {
    refreshTally();
    const id = setInterval(refreshTally, 30_000);
    return () => clearInterval(id);
  }, [refreshTally]);

  // ── Sticky location persistence
  const applyLocation = (loc: string) => {
    setLocation(loc);
    localStorage.setItem(STORAGE_KEY_LOCATION, loc);
    setLocationOpen(false);
    setCustomLocation('');
  };

  // ── Close location picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const officerBadge = user?.badge_number || 'LMO-MH-042';
  const officerName  = user?.name || 'Field Officer';
  const district     = user?.department?.split(',')[1]?.trim() || 'Mumbai';

  return (
    <div className="officer-shell">
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <header className="officer-topbar">

        {/* Left: brand + badge */}
        <div className="officer-topbar-left">
          <div className="officer-brand">
            <ShieldCheck size={18} className="officer-brand-icon" />
            <span className="officer-brand-text">Field Mode</span>
          </div>
          <div className="officer-badge-chip">
            <span className="officer-badge-num">{officerBadge}</span>
            <span className="officer-badge-sep">·</span>
            <span className="officer-badge-name">{officerName.split(' ')[0]}</span>
            <span className="officer-badge-sep">·</span>
            <span className="officer-badge-district">{district}</span>
          </div>
        </div>

        {/* Center: location selector */}
        <div className="officer-topbar-center">
          <div className="officer-location-wrap" ref={locationRef}>
            <button
              id="officer-location-btn"
              className="officer-location-btn"
              onClick={() => setLocationOpen(o => !o)}
              type="button"
            >
              <MapPin size={14} className="officer-location-icon" />
              <span className="officer-location-text">{location}</span>
              <ChevronDown size={13} className={`officer-location-caret ${locationOpen ? 'open' : ''}`} />
            </button>

            {locationOpen && (
              <div className="officer-location-dropdown" role="listbox" aria-label="Select market location">
                <div className="officer-location-custom">
                  <input
                    type="text"
                    className="officer-location-input"
                    placeholder="Type custom location…"
                    value={customLocation}
                    onChange={e => setCustomLocation(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && customLocation.trim()) {
                        applyLocation(customLocation.trim());
                      }
                    }}
                    autoFocus
                  />
                  {customLocation.trim() && (
                    <button
                      className="officer-location-apply"
                      onClick={() => applyLocation(customLocation.trim())}
                    >
                      Set
                    </button>
                  )}
                </div>
                <div className="officer-location-divider" />
                {MARKET_PRESETS.map(preset => (
                  <button
                    key={preset}
                    className={`officer-location-option ${location === preset ? 'active' : ''}`}
                    role="option"
                    aria-selected={location === preset}
                    onClick={() => applyLocation(preset)}
                  >
                    <MapPin size={12} />
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: tally + sync + nav */}
        <div className="officer-topbar-right">
          {/* Tally counters */}
          {tally && (
            <div className="officer-tally">
              <div className="officer-tally-item officer-tally-total" title="Inspections today">
                <Clock size={12} />
                <span>{tally.total}</span>
              </div>
              <div className="officer-tally-item officer-tally-clear" title="Compliant">
                <CheckCircle2 size={12} />
                <span>{tally.compliant}</span>
              </div>
              <div className="officer-tally-item officer-tally-violation" title="Violations">
                <AlertTriangle size={12} />
                <span>{tally.non_compliant}</span>
              </div>
            </div>
          )}

          {/* Online/Offline indicator */}
          <div
            className={`officer-sync-indicator ${isOnline ? 'online' : 'offline'}`}
            title={isOnline ? 'Connected — records sync automatically' : 'Offline — records queued locally'}
          >
            {isOnline
              ? <><Wifi size={13} /><span>Synced</span></>
              : <><WifiOff size={13} /><span>Offline</span></>
            }
          </div>

          {/* Quick nav */}
          <nav className="officer-nav">
            <NavLink
              to="/officer"
              end
              className={({ isActive }) => `officer-nav-link ${isActive ? 'active' : ''}`}
              title="Officer Overview"
            >
              Overview
            </NavLink>
            <NavLink
              to="/officer/rapid-inspect"
              className={({ isActive }) => `officer-nav-link ${isActive ? 'active' : ''}`}
              title="Rapid Inspect"
            >
              <Zap size={13} />
              Inspect
            </NavLink>
            <NavLink
              to="/officer/history"
              className={({ isActive }) => `officer-nav-link ${isActive ? 'active' : ''}`}
              title="Today's History"
            >
              History
            </NavLink>
          </nav>

          {/* Back to supervisor dashboard */}
          <button
            className="officer-back-btn"
            onClick={() => navigate('/dashboard')}
            title="Switch to Supervisor Dashboard"
            type="button"
          >
            <LayoutDashboard size={14} />
            <span>Admin</span>
          </button>
        </div>
      </header>

      {/* ── Page Content ───────────────────────────────────────────────────── */}
      <main className="officer-content">
        <Outlet context={{ location, tally, refreshTally }} />
      </main>
    </div>
  );
}
