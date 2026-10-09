import React, { useState, useEffect, Suspense, lazy } from 'react'
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
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[300px] p-8 bg-[#FAF9F6]">
      <div className="w-6 h-6 rounded-full border-2 border-[#4F46E5]/20 border-t-[#4F46E5] animate-spin mb-3" />
      <span className="text-xs text-[#626262] font-medium tracking-tight">Loading…</span>
    </div>
  )
}

export default function App() {
  // Navigation states: 'home' | 'map' | 'report' | 'track' | 'alerts' | 'profile' | 'authority'
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').split('?')[0]
      if (['home', 'map', 'report', 'track', 'alerts', 'profile', 'authority'].includes(hash)) {
        return hash
      }
    }
    return 'home'
  })

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').split('?')[0]
      if (['home', 'map', 'report', 'track', 'alerts', 'profile', 'authority'].includes(hash)) {
        setCurrentView(hash)
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  const handleNavigate = (view) => {
    setCurrentView(view)
    if (typeof window !== 'undefined') {
      window.location.hash = view === 'home' ? '' : view
    }
  }

  const isAuthorityView = currentView === 'authority'

  return (
    <div className="flex flex-col h-screen bg-[#FAF9F6] text-[#171717] overflow-hidden font-sans select-none">
      {/* ── Desktop Top Navigation (Sarvam AI Editorial Bar >=1024px) ──────── */}
      {!isAuthorityView && (
        <header className="hidden lg:flex items-center justify-between px-8 h-14 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E7E5E0] sticky top-0 z-40 flex-shrink-0 transition-all">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigate('home')}>
            <div className="w-7 h-7 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold text-xs tracking-wider">
              R
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#171717] text-base tracking-tight leading-none">RASTA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F8B72]" title="Live Feed Connected" />
            </div>
          </div>

          {/* Desktop Center Navigation Links */}
          <nav className="flex items-center gap-1 text-sm font-medium">
            {[
              { id: 'home',    label: 'Home' },
              { id: 'map',     label: 'Safety Map' },
              { id: 'track',   label: 'My Reports' },
              { id: 'alerts',  label: 'Commuter Alerts' },
              { id: 'profile', label: 'Settings' },
            ].map(({ id, label }) => {
              const isActive = currentView === id
              return (
                <button
                  key={id}
                  onClick={() => handleNavigate(id)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-[13px] ${
                    isActive
                      ? 'bg-[#F3F3F0] text-[#171717] font-semibold border border-[#E7E5E0]'
                      : 'text-[#626262] hover:text-[#171717] hover:bg-[#F3F3F0]'
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
              onClick={() => handleNavigate('authority')}
              className="text-xs text-[#626262] hover:text-[#171717] font-medium transition-colors cursor-pointer px-2 py-1"
            >
              Staff Portal →
            </button>
            <button
              onClick={() => handleNavigate('report')}
              className="btn-sarvam-primary text-xs py-1.5 px-3.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Road Hazard</span>
            </button>
          </div>
        </header>
      )}

      {/* ── Mobile Top Header (<1024px) ───────────────────────────────── */}
      {!isAuthorityView && (
        <header className="lg:hidden bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E7E5E0] px-4 py-2.5 flex items-center justify-between z-30 flex-shrink-0 sticky top-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigate('home')}>
            <div className="w-6 h-6 rounded-md bg-[#4F46E5] flex items-center justify-center text-white font-bold text-xs">
              R
            </div>
            <span className="font-semibold text-[#171717] text-base tracking-tight leading-none">RASTA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F8B72] ml-0.5" />
          </div>

          <button
            onClick={() => handleNavigate('authority')}
            className="text-[11px] font-medium text-[#626262] hover:text-[#171717] px-2 py-1 rounded-md hover:bg-[#F3F3F0] cursor-pointer"
          >
            Staff
          </button>
        </header>
      )}

      {/* ── Main Dynamic Route Viewport ───────────────────────────────── */}
      <main className="flex-1 overflow-hidden relative">
        <Suspense fallback={<AppleLoadingFallback />}>
          {currentView === 'home' && <CitizenHome onNavigate={handleNavigate} />}
          {currentView === 'map' && <MapPage onNavigateReport={() => handleNavigate('report')} />}
          {currentView === 'report' && (
            <ReportPage onBack={() => handleNavigate('map')} onComplete={handleNavigate} />
          )}
          {currentView === 'track' && (
            <TrackReportsPage onBack={() => handleNavigate('map')} onNavigateReport={() => handleNavigate('report')} />
          )}
          {currentView === 'alerts' && (
            <AlertsPage onSelectIncident={(id) => handleNavigate('map')} />
          )}
          {currentView === 'profile' && (
            <ProfilePage
              onNavigateAuthority={() => handleNavigate('authority')}
              onNavigateReports={() => handleNavigate('track')}
            />
          )}
          {currentView === 'authority' && (
            <AuthorityWorkspace onBackToCitizen={() => handleNavigate('home')} />
          )}
        </Suspense>
      </main>

      {/* ── Mobile Tab Bar (<1024px) ─────────────────────────────────── */}
      {!isAuthorityView && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-[#E7E5E0] flex items-center justify-around py-1 px-2 z-40 safe-bottom-nav">
          {[
            { id: 'home',    label: 'Home',    Icon: Home },
            { id: 'map',     label: 'Map',     Icon: Map },
            { id: 'report',  label: 'Report',  Icon: PlusCircle, isFab: true },
            { id: 'track',   label: 'Reports', Icon: FileText },
            { id: 'alerts',  label: 'Alerts',  Icon: Bell },
          ].map(({ id, label, Icon, isFab }) => {
            const isActive = currentView === id

            if (isFab) {
              return (
                <button
                  key={id}
                  onClick={() => handleNavigate('report')}
                  aria-label="Report Road Hazard"
                  className="flex flex-col items-center justify-center cursor-pointer group focus:outline-none -mt-3"
                >
                  <div className="w-11 h-11 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white flex items-center justify-center active:scale-95 transition-transform border-2 border-[#FAF9F6]">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#4F46E5] mt-0.5">Report</span>
                </button>
              )
            }

            return (
              <button
                key={id}
                onClick={() => handleNavigate(id)}
                aria-label={label}
                className={`flex flex-col items-center justify-center py-1 px-2 min-h-[44px] text-[10px] font-medium transition-colors cursor-pointer ${
                  isActive ? 'text-[#4F46E5] font-semibold' : 'text-[#858585] hover:text-[#171717]'
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
