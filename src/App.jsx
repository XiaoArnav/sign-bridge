import React, { useState, Suspense, lazy } from 'react'
import { Home, PlusCircle, Map, FileText, Bell, User, Shield, Radio, ShieldCheck, ChevronRight } from 'lucide-react'
import CitizenHome from './pages/CitizenHome.jsx'
import './lib/ingestionEngine.js'

// ── Performance: Lazy load secondary routes so initial homepage load is instant ──
const MapPage = lazy(() => import('./pages/MapPage.jsx'))
const ReportPage = lazy(() => import('./pages/ReportPage.jsx'))
const TrackReportsPage = lazy(() => import('./pages/TrackReportsPage.jsx'))
const AlertsPage = lazy(() => import('./pages/AlertsPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const AuthorityWorkspace = lazy(() => import('./pages/AuthorityWorkspace.jsx'))

function AppleLoadingFallback() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[300px] p-8 bg-[#F5F5F7]">
      <div className="w-7 h-7 rounded-full border-2 border-[#0071E3]/20 border-t-[#0071E3] animate-spin mb-3" />
      <span className="text-xs text-[#6E6E73] font-medium tracking-tight">Loading…</span>
    </div>
  )
}

export default function App() {
  // Navigation states: 'home' | 'map' | 'report' | 'track' | 'alerts' | 'profile' | 'authority'
  const [currentView, setCurrentView] = useState('home')

  const isAuthorityView = currentView === 'authority'

  return (
    <div className="flex flex-col h-screen bg-[#F5F5F7] text-[#1D1D1F] overflow-hidden font-sans select-none">
      {/* ── Desktop Top Navigation (Apple Minimalist Bar >=1024px) ──────── */}
      {!isAuthorityView && (
        <header className="hidden lg:flex items-center justify-between px-8 h-14 bg-white/80 backdrop-blur-md border-b border-[#E5E5EA] sticky top-0 z-40 flex-shrink-0 transition-all">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="w-7 h-7 rounded-lg bg-[#0071E3] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              R
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#1D1D1F] text-base tracking-tight leading-none">RASTA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" title="Live Feed Connected" />
            </div>
          </div>

          {/* Desktop Center Navigation Links */}
          <nav className="flex items-center gap-1 text-sm font-medium">
            {[
              { id: 'home',    label: 'Home' },
              { id: 'map',     label: 'Safety Map' },
              { id: 'track',   label: 'My Reports' },
              { id: 'alerts',  label: 'Alerts' },
              { id: 'profile', label: 'Settings' },
            ].map(({ id, label }) => {
              const isActive = currentView === id
              return (
                <button
                  key={id}
                  onClick={() => setCurrentView(id)}
                  className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer text-[13px] ${
                    isActive
                      ? 'bg-[#1D1D1F] text-white font-semibold'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F2F2F7]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </nav>

          {/* Right Action: Report Hazard + Discreet Staff Link */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('authority')}
              className="text-xs text-[#6E6E73] hover:text-[#1D1D1F] font-medium transition-colors cursor-pointer px-2 py-1"
            >
              Staff Portal →
            </button>
            <button
              onClick={() => setCurrentView('report')}
              className="btn-apple-primary text-xs py-1.5 px-4 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Hazard</span>
            </button>
          </div>
        </header>
      )}

      {/* ── Mobile Top Header (<1024px) ───────────────────────────────── */}
      {!isAuthorityView && (
        <header className="lg:hidden bg-white/80 backdrop-blur-md border-b border-[#E5E5EA] px-4 py-2.5 flex items-center justify-between z-30 flex-shrink-0 sticky top-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="w-6 h-6 rounded-md bg-[#0071E3] flex items-center justify-center text-white font-bold text-xs shadow-sm">
              R
            </div>
            <span className="font-semibold text-[#1D1D1F] text-base tracking-tight leading-none">RASTA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] ml-0.5" />
          </div>

          <button
            onClick={() => setCurrentView('authority')}
            className="text-[11px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] px-2 py-1 rounded-md hover:bg-[#F2F2F7] cursor-pointer"
          >
            Staff
          </button>
        </header>
      )}

      {/* ── Main Dynamic Route Viewport ───────────────────────────────── */}
      <main className="flex-1 overflow-hidden relative">
        <Suspense fallback={<AppleLoadingFallback />}>
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
        </Suspense>
      </main>

      {/* ── Mobile iOS Tab Bar (<1024px) ─────────────────────────────── */}
      {!isAuthorityView && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-[#E5E5EA] flex items-center justify-around py-1 px-2 z-40 safe-bottom-nav shadow-apple-sm">
          {[
            { id: 'map',     label: 'Map',     Icon: Map },
            { id: 'track',   label: 'Reports', Icon: FileText },
            { id: 'report',  label: 'Report',  Icon: PlusCircle, isFab: true },
            { id: 'alerts',  label: 'Alerts',  Icon: Bell },
            { id: 'profile', label: 'Settings',Icon: User },
          ].map(({ id, label, Icon, isFab }) => {
            const isActive = currentView === id

            if (isFab) {
              return (
                <button
                  key={id}
                  onClick={() => setCurrentView('report')}
                  aria-label="Report Road Hazard"
                  className="flex flex-col items-center justify-center cursor-pointer group focus:outline-none -mt-3"
                >
                  <div className="w-11 h-11 rounded-full bg-[#0071E3] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform border-2 border-white">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#0071E3] mt-0.5">Report</span>
                </button>
              )
            }

            return (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                aria-label={label}
                className={`flex flex-col items-center justify-center py-1 px-2 min-h-[44px] text-[10px] font-medium transition-colors cursor-pointer ${
                  isActive ? 'text-[#0071E3] font-semibold' : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" strokeWidth={isActive ? 2.2 : 1.7} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}
