import React, { useState } from 'react'
import { Home, PlusCircle, Map, FileText, Bell, User, ShieldCheck, Radio, ShieldAlert } from 'lucide-react'
import CitizenHome from './pages/CitizenHome.jsx'
import ReportPage from './pages/ReportPage.jsx'
import MapPage from './pages/MapPage.jsx'
import AlertsPage from './pages/AlertsPage.jsx'
import TrackReportsPage from './pages/TrackReportsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import AuthorityWorkspace from './pages/AuthorityWorkspace.jsx'
import './lib/ingestionEngine.js'

export default function App() {
  // Navigation states: 'home' | 'map' | 'report' | 'track' | 'alerts' | 'profile' | 'authority'
  const [currentView, setCurrentView] = useState('home')

  const isAuthorityView = currentView === 'authority'

  return (
    <div className="flex h-screen bg-midnight text-rastaText-primary overflow-hidden font-sans">
      {/* ── Desktop Navigation Sidebar (>=1024px) (Blueprint Section 3 & 4) ── */}
      {!isAuthorityView && (
        <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-surface-border p-4 z-30 flex-shrink-0 justify-between">
          <div className="space-y-6">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
              <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-rose-950/60">
                R
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-base tracking-tight leading-none">RASTA</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-teal-muted text-teal border border-teal/30">
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-rastaText-muted leading-none mt-1">Civic Road Safety Authority</p>
              </div>
            </div>

            {/* Primary Action Button (Desktop) */}
            <button
              onClick={() => setCurrentView('report')}
              className="btn-rasta-primary w-full text-xs shadow-cyber-lift"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Road Hazard</span>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="space-y-1 text-xs font-semibold">
              {[
                { id: 'home',    label: 'Home & Overview', Icon: Home },
                { id: 'map',     label: 'Safety Map',     Icon: Map },
                { id: 'track',   label: 'My Reports',     Icon: FileText },
                { id: 'alerts',  label: 'Commuter Alerts',Icon: Bell },
                { id: 'profile', label: 'Profile & Settings', Icon: User },
              ].map(({ id, label, Icon }) => {
                const isActive = currentView === id
                return (
                  <button
                    key={id}
                    onClick={() => setCurrentView(id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-surface-elevated text-teal border border-surface-border font-bold'
                        : 'text-rastaText-secondary hover:text-white hover:bg-surface-elevated/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Desktop Authority Workspace Switcher */}
          <div className="pt-4 border-t border-surface-border">
            <button
              onClick={() => setCurrentView('authority')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-midnight border border-surface-border hover:border-teal/40 text-xs font-bold text-rastaText-secondary hover:text-teal transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal" />
                <span>Command Center</span>
              </div>
              <span className="text-[10px] text-teal">Admin →</span>
            </button>
          </div>
        </aside>
      )}

      {/* ── Main Viewport Area ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Top Header (<1024px) */}
        {!isAuthorityView && (
          <header className="lg:hidden bg-[#0B1220] border-b border-[#334155] px-4 py-3 flex items-center justify-between z-30 flex-shrink-0">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentView('home')}>
              <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white font-black text-sm">
                R
              </div>
              <div>
                <span className="font-black text-white text-base tracking-tight leading-none">RASTA</span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-teal-muted text-teal border border-teal/30 ml-2">
                  LIVE
                </span>
              </div>
            </div>

            <button
              onClick={() => setCurrentView('authority')}
              className="px-2.5 py-1.5 rounded-lg bg-midnight border border-surface-border text-teal text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </header>
        )}

        {/* Dynamic Route Screen Container */}
        <main className="flex-1 overflow-hidden relative">
          {currentView === 'home' && <CitizenHome onNavigate={setCurrentView} />}
          {currentView === 'map' && <MapPage onNavigateReport={() => setCurrentView('report')} />}
          {currentView === 'report' && (
            <ReportPage onBack={() => setCurrentView('map')} onComplete={setCurrentView} />
          )}
          {currentView === 'track' && (
            <TrackReportsPage onBack={() => setCurrentView('map')} onNavigateReport={() => setCurrentView('report')} />
          )}
          {currentView === 'alerts' && (
            <AlertsPage onSelectIncident={(id) => setCurrentView('map')} />
          )}
          {currentView === 'profile' && (
            <ProfilePage
              onNavigateAuthority={() => setCurrentView('authority')}
              onNavigateReports={() => setCurrentView('track')}
            />
          )}
          {currentView === 'authority' && (
            <AuthorityWorkspace onBackToCitizen={() => setCurrentView('home')} />
          )}
        </main>

        {/* ── Mobile Fixed Bottom Navigation (<1024px) (Blueprint Section 3) ── */}
        {!isAuthorityView && (
          <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-[#0B1220] border-t border-[#334155] flex items-center justify-around py-1.5 px-2 z-40 safe-bottom-nav shadow-2xl">
            {[
              { id: 'map',     label: 'Map',     Icon: Map },
              { id: 'track',   label: 'Reports', Icon: FileText },
              { id: 'report',  label: 'Report',  Icon: PlusCircle, isFab: true },
              { id: 'alerts',  label: 'Alerts',  Icon: Bell },
              { id: 'profile', label: 'Profile', Icon: User },
            ].map(({ id, label, Icon, isFab }) => {
              const isActive = currentView === id

              if (isFab) {
                return (
                  <button
                    key={id}
                    onClick={() => setCurrentView('report')}
                    aria-label="Report Hazard Action"
                    className="flex flex-col items-center -mt-6 cursor-pointer group focus:outline-none"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-950/90 group-hover:scale-105 active:scale-95 transition-transform border-3 border-midnight">
                      <PlusCircle className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-rose-400 mt-0.5">Report</span>
                  </button>
                )
              }

              return (
                <button
                  key={id}
                  onClick={() => setCurrentView(id)}
                  aria-label={label}
                  className={`flex flex-col items-center justify-center py-1 px-2 min-h-[44px] text-[10px] font-bold transition-all cursor-pointer ${
                    isActive ? 'text-teal font-extrabold' : 'text-rastaText-muted hover:text-rastaText-secondary'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-0.5" />
                  <span>{label}</span>
                </button>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  )
}
