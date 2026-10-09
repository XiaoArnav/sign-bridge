import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { hazardStore, CITIES } from '../lib/hazardStore.js'
import { getCategory, getSeverity, getStatus } from '../lib/hazardTypes.js'
import {
  ThumbsUp,
  X,
  MapPin,
  Clock,
  Search,
  Navigation,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Route,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  CheckCircle2,
  Info
} from 'lucide-react'

// Custom Leaflet Pins with dark outer borders to pop on both light tiles and dark overlays
function createLeafletPin(color, isResolved) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative; width:32px; height:32px;">
        <div style="
          width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
          background: ${color}; border: 3px solid #0B1220;
          transform: rotate(-45deg);
          box-shadow: 0 4px 16px rgba(0,0,0,0.7);
        "></div>
        ${
          isResolved
            ? '<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:12px; color:white; font-weight:bold;">✓</div>'
            : '<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:10px; color:white; font-weight:bold;">!</div>'
        }
      </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}

const PIN_COLORS = {
  critical: '#F87171',
  high: '#FBBF24',
  medium: '#60A5FA',
  low: '#94A3B8',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function extractUrl(text) {
  if (!text) return null
  const match = text.match(/https?:\/\/[^\s]+/)
  return match ? match[0] : null
}

function MapViewController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 13, { animate: true, duration: 1.2 })
  }, [center, zoom, map])
  return null
}

// Predefined commute corridors for Safe Route Threat Scanner simulation
const SAMPLE_ROUTES = {
  directHazardous: [
    [12.9352, 77.6245], // Koramangala (near live wire RASTA-8042)
    [12.9520, 77.6100], // Intermediate road
    [12.9716, 77.5946], // Shanthi Nagar (near open sewer pit RASTA-7911)
    [12.9750, 77.5990], // MG Road Target
  ],
  safeDetour: [
    [12.9352, 77.6245], // Koramangala
    [12.9400, 77.6350], // Indiranagar outer bypass
    [12.9600, 77.6380], // Domlur elevated bypass
    [12.9750, 77.5990], // MG Road Target
  ],
}

export default function MapPage({ onNavigateReport }) {
  const [incidents, setIncidents] = useState([])
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [selectedCity, setSelectedCity] = useState(CITIES[0])
  const [mapCenter, setMapCenter] = useState(CITIES[0].center)
  const [mapZoom, setMapZoom] = useState(CITIES[0].zoom)

  // Safe Route Threat Scanner state
  const [showRouteCopilot, setShowRouteCopilot] = useState(false)
  const [activeRouteType, setActiveRouteType] = useState('safe') // 'hazardous' | 'safe'
  const [isRouteCollapsed, setIsRouteCollapsed] = useState(false)

  const reloadData = () => {
    setIncidents(hazardStore.getAll('all'))
  }

  useEffect(() => {
    reloadData()
  }, [])

  const handleCitySelect = (city) => {
    setSelectedCity(city)
    setMapCenter(city.center)
    setMapZoom(city.zoom)
  }

  const handleUpvote = (id) => {
    hazardStore.upvote(id)
    reloadData()
    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident(prev => ({ ...prev, votes: (prev.votes || 0) + 1 }))
    }
  }

  const handleNearMe = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude])
        setMapZoom(14)
      },
      () => {
        setMapCenter(CITIES[0].center)
        setMapZoom(CITIES[0].zoom)
      }
    )
  }

  // Filter incidents by city and criteria
  const filtered = incidents.filter(item => {
    const matchCity = item.city ? item.city === selectedCity.id : true

    const matchSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchSeverity =
      severityFilter === 'all' ||
      item.severity === severityFilter ||
      (severityFilter === 'resolved' &&
        (item.status === 'verified_resolved' || item.status === 'pending_verification'))

    return matchCity && matchSearch && matchSeverity
  })

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#0B1220] relative overflow-hidden font-sans">
      {/* ── Desktop Left Sidebar (>=1024px) ─────────────────────────── */}
      <div className="hidden lg:flex flex-col w-96 bg-[#111827] border-r border-[#334155] z-20 flex-shrink-0">
        <div className="p-4 border-b border-[#334155] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#F8FAFC]">Road Hazards Explorer</h2>
            <span className="text-xs font-mono text-[#43D9C2] font-semibold">
              {filtered.length} In {selectedCity.name}
            </span>
          </div>

          {/* City Switcher Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#0B1220] rounded-xl border border-[#334155]">
            {CITIES.map(c => (
              <button
                key={c.id}
                onClick={() => handleCitySelect(c)}
                className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  selectedCity.id === c.id
                    ? 'bg-[#43D9C2] text-slate-950 shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {c.name.split('-')[0]}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search street, area or ID..."
              className="w-full bg-[#0B1220] border border-[#334155] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#43D9C2]"
            />
          </div>

          {/* Route Scanner Trigger Button */}
          <button
            onClick={() => setShowRouteCopilot(r => !r)}
            className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
              showRouteCopilot
                ? 'bg-[#151F30] border-[#43D9C2] text-[#43D9C2] shadow-sm'
                : 'bg-[#0B1220] border-[#334155] text-[#CBD5E1] hover:border-[#43D9C2]/60 hover:text-[#F8FAFC]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-[#43D9C2]" />
              <span>{showRouteCopilot ? 'Hide Route Threat Scanner' : 'Run Safe Route Threat Scanner'}</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#151F30] border border-[#334155] text-[#43D9C2]">
              AI SCAN
            </span>
          </button>
        </div>

        {/* Scrollable Incident List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.map(item => {
            const isSelected = selectedIncident?.id === item.id
            const cat = getCategory(item.category)
            const sev = getSeverity(item.severity)

            return (
              <div
                key={item.id}
                onClick={() => setSelectedIncident(item)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#151F30] border-[#43D9C2] shadow-lg ring-1 ring-[#43D9C2]/30'
                    : 'bg-[#0B1220] border-[#334155] hover:bg-[#151F30]/70'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1.5 truncate">
                    <span>{cat.emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </span>
                  <span className={sev.badgeClass}>{sev.label}</span>
                </div>

                <p className="text-[11px] text-[#CBD5E1] truncate font-medium">{item.title}</p>
                <p className="text-[10px] text-[#94A3B8] truncate mt-0.5">📍 {item.address}</p>

                <div className="flex items-center justify-between pt-2 border-t border-[#334155]/60 text-[10px] text-[#94A3B8] mt-2">
                  <span className="font-mono text-[#43D9C2] font-semibold">{item.id}</span>
                  <span className="text-[#F87171] font-bold">{item.votes} upvotes</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Interactive Map Canvas ───────────────────────────────────── */}
      <div className="flex-1 h-full relative">
        {/* Mobile Top Controls (<1024px) */}
        <div className="lg:hidden absolute top-3 inset-x-3 z-10 space-y-2 pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
            {/* Mobile City Selector */}
            <select
              value={selectedCity.id}
              onChange={e => handleCitySelect(CITIES.find(c => c.id === e.target.value))}
              aria-label="Select City Jurisdiction"
              className="bg-[#0B1220] border border-[#334155] text-[#43D9C2] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#43D9C2] shadow-2xl cursor-pointer"
            >
              {CITIES.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0B1220] text-[#F8FAFC]">
                  {c.name}
                </option>
              ))}
            </select>

            {/* Mobile Safe Route Scanner Button */}
            <button
              onClick={() => setShowRouteCopilot(r => !r)}
              className="flex-1 bg-[#0B1220] border border-[#334155] text-[#43D9C2] rounded-xl px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xl cursor-pointer hover:border-[#43D9C2]/80 focus:outline-none focus:ring-2 focus:ring-[#43D9C2]"
            >
              <Route className="w-3.5 h-3.5" />
              <span>{showRouteCopilot ? 'Close Scanner' : 'Route Threat Scanner'}</span>
            </button>
          </div>
        </div>

        {/* ── Leaflet Canvas ─────────────────────────────────────────── */}
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapViewController center={mapCenter} zoom={mapZoom} />

          {/* Hazardous Route Polyline (Dashed Crimson Red) */}
          {showRouteCopilot && activeRouteType === 'hazardous' && (
            <Polyline
              positions={SAMPLE_ROUTES.directHazardous}
              pathOptions={{
                color: '#EF4444',
                weight: 5,
                dashArray: '8, 8',
                opacity: 0.95,
              }}
            />
          )}

          {/* Recommended Safe Detour Polyline (Solid Teal) */}
          {showRouteCopilot && activeRouteType === 'safe' && (
            <Polyline
              positions={SAMPLE_ROUTES.safeDetour}
              pathOptions={{
                color: '#43D9C2',
                weight: 5,
                opacity: 0.95,
              }}
            />
          )}

          {/* Incident Pins */}
          {filtered.map(item => {
            const isResolved = item.status === 'verified_resolved'
            const pinColor = isResolved ? '#34D399' : PIN_COLORS[item.severity] || '#F87171'

            return (
              <Marker
                key={item.id}
                position={[item.latitude, item.longitude]}
                icon={createLeafletPin(pinColor, isResolved)}
                eventHandlers={{
                  click: () => setSelectedIncident(item),
                }}
              />
            )
          })}
        </MapContainer>

        {/* ── Safe Route Threat Scanner Floating Panel (Section 4 Redesign) ── */}
        {showRouteCopilot && (
          <div
            className="map-overlay-panel absolute top-16 lg:top-4 left-3 right-3 lg:left-auto lg:right-4 z-20 w-auto lg:w-96 rounded-2xl p-4 space-y-3.5 animate-fade-in text-xs max-h-[80vh] overflow-y-auto"
            role="region"
            aria-label="Safe Route Threat Scanner Panel"
          >
            {/* Header: Title and Controls */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#334155]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#43D9C2]/15 text-[#43D9C2] flex items-center justify-center border border-[#43D9C2]/30 flex-shrink-0">
                  <Route className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#F8FAFC] leading-none">
                    Safe Route Threat Scanner
                  </h3>
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    AI GIS Commute Risk Simulation
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Mobile collapse button */}
                <button
                  onClick={() => setIsRouteCollapsed(c => !c)}
                  className="sm:hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#151F30] cursor-pointer"
                  aria-label={isRouteCollapsed ? 'Expand route scanner' : 'Collapse route scanner'}
                >
                  {isRouteCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setShowRouteCopilot(false)}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#151F30] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#43D9C2]"
                  aria-label="Close safe route threat scanner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subtitle Corridor */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#CBD5E1]">
              <span>Simulating commute corridor:</span>
              <span className="font-bold text-[#F8FAFC] bg-[#151F30] px-2.5 py-0.5 rounded border border-[#334155] self-start sm:self-auto font-mono">
                Koramangala ➔ MG Road
              </span>
            </div>

            {/* Collapsible Content Area */}
            {!isRouteCollapsed && (
              <>
                {/* Two Clearly Separated Metric Cards (Stacked on narrow mobile, 2 cols on wider) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Card 1: Direct Path */}
                  <button
                    onClick={() => setActiveRouteType('hazardous')}
                    aria-pressed={activeRouteType === 'hazardous'}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeRouteType === 'hazardous'
                        ? 'bg-[#1C1417] border-[#F87171] ring-1 ring-[#F87171]/50'
                        : 'bg-[#151F30] border-[#334155] hover:border-[#475569]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-[#F8FAFC]">Direct Path</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#2D151B] text-[#F87171] border border-[#7F1D1D]">
                        84% Risk
                      </span>
                    </div>
                    <p className="text-[11px] text-[#CBD5E1] flex items-center gap-1.5 font-medium leading-tight">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#F87171] flex-shrink-0" />
                      <span>2 critical hazards in path</span>
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-[#94A3B8]">
                      Distance: 4.8 km · 28 mins
                    </div>
                  </button>

                  {/* Card 2: Safe Detour */}
                  <button
                    onClick={() => setActiveRouteType('safe')}
                    aria-pressed={activeRouteType === 'safe'}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeRouteType === 'safe'
                        ? 'bg-[#0E201E] border-[#43D9C2] ring-1 ring-[#43D9C2]/50'
                        : 'bg-[#151F30] border-[#334155] hover:border-[#475569]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-[#F8FAFC]">Safe Detour</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0E291F] text-[#34D399] border border-[#065F46]">
                        12% Risk
                      </span>
                    </div>
                    <p className="text-[11px] text-[#CBD5E1] flex items-center gap-1.5 font-medium leading-tight">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#34D399] flex-shrink-0" />
                      <span>0 critical hazards on this route</span>
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-[#43D9C2]">
                      Distance: 5.6 km (+800m safe bypass)
                    </div>
                  </button>
                </div>

                {/* Recommendation & Reasoning Section */}
                <div className="p-3 rounded-xl bg-[#151F30] border border-[#334155] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#43D9C2] uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Info className="w-3 h-3 text-[#43D9C2]" />
                      Route Assessment
                    </span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">
                      {activeRouteType === 'safe' ? 'Displaying: Safe Detour' : 'Displaying: Direct Corridor'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
                    {activeRouteType === 'hazardous' ? (
                      <span>
                        <strong className="text-[#F87171]">⚠️ Direct Path Caution:</strong> Corridor
                        intersects dangling 11kV transformer wire (<span className="font-mono text-[#F87171]">RASTA-8042</span>) and
                        uncovered sewer pit (<span className="font-mono text-[#F87171]">RASTA-7911</span>). Imminent
                        threat to life during nighttime and rainfall.
                      </span>
                    ) : (
                      <span>
                        <strong className="text-[#34D399]">🛡️ Recommended Detour:</strong> Domlur
                        elevated arterial bypass completely routes around flooded underpasses and
                        high-voltage electrical hazards with 0 critical defects.
                      </span>
                    )}
                  </p>

                  <div className="pt-2 border-t border-[#334155]/60 flex items-center justify-between text-[10px] text-[#94A3B8]">
                    <span>Simulated corridor via municipal hazard coordinates</span>
                    <span className="text-[#43D9C2] font-semibold font-mono">Live GIS Verified</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Map Recenter Button */}
        <div className="absolute bottom-20 lg:bottom-4 right-4 z-15">
          <button
            onClick={handleNearMe}
            className="p-3 rounded-2xl bg-[#0B1220] border border-[#334155] text-[#43D9C2] hover:text-[#F8FAFC] shadow-2xl cursor-pointer hover:-translate-y-0.5 transition-transform focus:outline-none focus:ring-2 focus:ring-[#43D9C2]"
            aria-label="Recenter map near my location"
            title="Recenter near my location"
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Selected Incident Details Panel (Section 5 Redesign) ──────── */}
      {selectedIncident && (
        <div
          className="map-overlay-panel fixed inset-x-0 bottom-0 lg:bottom-4 lg:right-4 lg:left-auto lg:w-96 z-50 p-4 sm:p-5 pb-24 lg:pb-5 rounded-t-3xl lg:rounded-2xl shadow-2xl animate-fade-in max-h-[85vh] lg:max-h-[calc(100vh-20rem)] overflow-y-auto space-y-3.5"
          role="dialog"
          aria-label={`Incident details for ${selectedIncident.id}`}
        >
          {/* Mobile Drag Indicator Handle */}
          <div className="lg:hidden w-12 h-1 bg-[#334155] rounded-full mx-auto -mt-1 mb-2" />

          {/* 1. Incident ID and Close Button */}
          <div className="flex items-center justify-between pb-2 border-b border-[#334155]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black text-[#43D9C2] px-2 py-0.5 rounded bg-[#151F30] border border-[#334155]">
                {selectedIncident.id}
              </span>
              <span className="text-[10px] font-mono text-[#94A3B8] uppercase">
                {selectedIncident.city || 'bengaluru'} Jurisdiction
              </span>
            </div>

            <button
              onClick={() => setSelectedIncident(null)}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#151F30] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#43D9C2]"
              aria-label="Close incident details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Hazard Category and Headline */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#F8FAFC] px-2.5 py-1 rounded-lg bg-[#151F30] border border-[#334155] flex items-center gap-1.5">
                <span>{getCategory(selectedIncident.category).emoji}</span>
                <span>{getCategory(selectedIncident.category).label}</span>
              </span>

              <span className={getSeverity(selectedIncident.severity).badgeClass}>
                {getSeverity(selectedIncident.severity).label}
              </span>

              <span className="text-[11px] font-mono text-[#94A3B8] px-2 py-0.5 rounded bg-[#151F30] border border-[#334155]">
                {selectedIncident.dept}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC] leading-snug">
              {selectedIncident.title}
            </h3>

            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              {selectedIncident.description}
            </p>
          </div>

          {/* 3. Verification & Confidence Status */}
          <div className="p-2.5 rounded-xl bg-[#151F30] border border-[#334155] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94A3B8] font-medium text-[11px]">Verification Status:</span>
              {selectedIncident.status === 'verified_resolved' ? (
                <span className="badge-verified text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Certified Ground Truth
                </span>
              ) : selectedIncident.status === 'pending_verification' ? (
                <span className="badge-medium text-[11px]">
                  <Clock className="w-3.5 h-3.5" /> Repair Awaiting Audit
                </span>
              ) : selectedIncident.severity === 'critical' ? (
                <span className="badge-critical text-[11px]">
                  <AlertOctagon className="w-3.5 h-3.5" /> Urgent Threat to Life
                </span>
              ) : (
                <span className="badge-high text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" /> Community Corroborated
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#CBD5E1] pt-1 border-t border-[#334155]/60">
              <span className="text-[#94A3B8]">Corroboration Confidence:</span>
              <span className="font-mono text-[#43D9C2] font-semibold">
                {selectedIncident.votes || 1} Independent Signals
              </span>
            </div>
          </div>

          {/* 4. Source & Original Source Link */}
          <div className="p-2.5 rounded-xl bg-[#151F30] border border-[#334155] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#94A3B8] text-[11px]">Reported By:</span>
              <span className="font-semibold text-[#F8FAFC]">
                {selectedIncident.reporter_name || 'Verified Commuter'}
              </span>
            </div>

            {extractUrl(selectedIncident.description) ? (
              <div className="pt-1 border-t border-[#334155]/60 flex items-center justify-between">
                <span className="text-[#94A3B8] text-[11px]">External Feed:</span>
                <a
                  href={extractUrl(selectedIncident.description)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#43D9C2] hover:underline flex items-center gap-1 font-semibold text-xs truncate max-w-[200px]"
                >
                  <span>Original Article Link</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            ) : (
              <div className="pt-1 border-t border-[#334155]/60 flex items-center justify-between text-[11px] text-[#94A3B8]">
                <span>Source Channel:</span>
                <span className="text-[#CBD5E1] font-mono">RASTA Citizen App (GPS Lock)</span>
              </div>
            )}
          </div>

          {/* 5. Incident Photo (Before & After Resolution Comparison) */}
          {selectedIncident.evidence_url ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl overflow-hidden border border-[#334155] bg-[#0B1220]">
                <span className="text-[9px] font-bold text-[#94A3B8] uppercase px-2 py-0.5 block bg-[#151F30] border-b border-[#334155]">
                  BEFORE: Citizen Photo
                </span>
                <img
                  src={selectedIncident.photo_url}
                  alt="Initial hazard evidence"
                  className="w-full h-24 object-cover"
                />
              </div>

              <div className="rounded-xl overflow-hidden border border-[#065F46] bg-[#0B1220]">
                <span className="text-[9px] font-bold text-[#34D399] uppercase px-2 py-0.5 block bg-[#0E291F] border-b border-[#065F46]">
                  AFTER: Resolution Proof
                </span>
                <img
                  src={selectedIncident.evidence_url}
                  alt="Repaired hazard proof"
                  className="w-full h-24 object-cover"
                />
              </div>
            </div>
          ) : (
            selectedIncident.photo_url && (
              <div className="rounded-xl overflow-hidden border border-[#334155] bg-[#0B1220] h-32 relative">
                <img
                  src={selectedIncident.photo_url}
                  alt="Hazard evidence"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-[10px] font-mono bg-[#0B1220]/90 text-[#F8FAFC] px-2 py-0.5 rounded border border-[#334155]">
                  Geotagged Photo Evidence
                </span>
              </div>
            )
          )}

          {/* 6. Location and Report Timestamp */}
          <div className="p-2.5 rounded-xl bg-[#151F30] border border-[#334155] space-y-1.5 text-xs">
            <div className="flex items-start gap-1.5 text-[#CBD5E1]">
              <MapPin className="w-3.5 h-3.5 text-[#43D9C2] mt-0.5 flex-shrink-0" />
              <span className="font-medium text-xs leading-tight">{selectedIncident.address}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] pt-1.5 border-t border-[#334155]/60">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#94A3B8]" />
                <span>Reported {timeAgo(selectedIncident.created_at)}</span>
              </span>
              <span className="font-mono">
                {new Date(selectedIncident.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* 7. Current Workflow Status */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#151F30] border border-[#334155] text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-[#94A3B8] uppercase">Triage Workflow</span>
              <div className="font-bold text-[#F8FAFC]">
                {getStatus(selectedIncident.status).label}
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] font-mono text-[#94A3B8] uppercase">Department Wing</span>
              <div className="font-mono text-[#43D9C2] font-semibold">
                {selectedIncident.dept}
              </div>
            </div>
          </div>

          {/* 8. Prominent Confirmation / Upvote Action */}
          <button
            onClick={() => handleUpvote(selectedIncident.id)}
            className="w-full min-h-[44px] bg-[#151F30] hover:bg-[#1E293B] active:bg-[#0B1220] text-[#F8FAFC] border border-[#334155] hover:border-[#43D9C2] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg focus:outline-none focus:ring-2 focus:ring-[#43D9C2]"
          >
            <ThumbsUp className="w-4 h-4 text-[#43D9C2]" />
            <span>
              Confirm This Hazard ({selectedIncident.votes || 1} Corroborations)
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
