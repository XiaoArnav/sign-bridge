import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { hazardStore, CITIES } from '../lib/hazardStore.js'
import { getCategory, getSeverity, getStatus } from '../lib/hazardTypes.js'
import { ThumbsUp, X, MapPin, Clock, Search, Layers, Navigation, AlertTriangle, ShieldCheck, Filter, ChevronRight, Route, Compass, CheckCircle2 } from 'lucide-react'

// Custom Leaflet Pins
function createLeafletPin(color, isResolved) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative; width:30px; height:30px;">
        <div style="
          width: 30px; height: 30px; border-radius: 50% 50% 50% 0;
          background: ${color}; border: 2.5px solid #0B1220;
          transform: rotate(-45deg);
          box-shadow: 0 4px 14px rgba(0,0,0,0.6);
        "></div>
        ${isResolved ? '<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:11px; color:white; font-weight:bold;">✓</div>' : ''}
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  })
}

const PIN_COLORS = {
  critical: '#EF4444',
  high: '#F59E0B',
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

function MapViewController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 13, { animate: true, duration: 1.2 })
  }, [center, zoom, map])
  return null
}

// ── Predefined Commute Corridors for Safe Route Copilot Scanner ──────────────
const SAMPLE_ROUTES = {
  directHazardous: [
    [12.9352, 77.6245], // Koramangala (Near Live wire)
    [12.9520, 77.6100], // Intermediate road
    [12.9716, 77.5946], // Shanthi Nagar (Near Open manhole)
    [12.9750, 77.5990], // MG Road Target
  ],
  safeDetour: [
    [12.9352, 77.6245], // Koramangala
    [12.9400, 77.6350], // Indiranagar outer bypass
    [12.9600, 77.6380], // Domlur elevated road
    [12.9750, 77.5990], // MG Road Target
  ]
}

export default function MapPage({ onNavigateReport }) {
  const [incidents, setIncidents] = useState([])
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [selectedCity, setSelectedCity] = useState(CITIES[0])
  const [mapCenter, setMapCenter] = useState(CITIES[0].center)
  const [mapZoom, setMapZoom] = useState(CITIES[0].zoom)

  // Safe Route Copilot State
  const [showRouteCopilot, setShowRouteCopilot] = useState(false)
  const [activeRouteType, setActiveRouteType] = useState('safe') // 'hazardous' | 'safe'

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

    const matchSearch = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchSeverity = severityFilter === 'all' ||
      item.severity === severityFilter ||
      (severityFilter === 'resolved' && (item.status === 'verified_resolved' || item.status === 'pending_verification'))

    return matchCity && matchSearch && matchSeverity
  })

  return (
    <div className="flex flex-col lg:flex-row h-full bg-midnight relative overflow-hidden">
      {/* ── Desktop Left Sidebar (>=1024px) ─────────────────────────── */}
      <div className="hidden lg:flex flex-col w-96 bg-surface border-r border-surface-border z-20 flex-shrink-0">
        <div className="p-4 border-b border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-rastaText-primary">Road Hazards Explorer</h2>
            <span className="text-xs font-mono text-teal font-semibold">{filtered.length} In {selectedCity.name}</span>
          </div>

          {/* City Switcher Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-midnight rounded-xl border border-surface-border">
            {CITIES.map(c => (
              <button
                key={c.id}
                onClick={() => handleCitySelect(c)}
                className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  selectedCity.id === c.id ? 'bg-teal text-slate-950 shadow-sm' : 'text-rastaText-muted hover:text-white'
                }`}
              >
                {c.name.split('-')[0]}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-rastaText-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search street, area or ID..."
              className="w-full bg-midnight border border-surface-border rounded-xl pl-9 pr-3 py-2 text-xs text-rastaText-primary placeholder-rastaText-muted focus:outline-none focus:border-teal"
            />
          </div>

          {/* Route Scanner Trigger Pill */}
          <button
            onClick={() => setShowRouteCopilot(r => !r)}
            className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
              showRouteCopilot
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                : 'bg-surface-elevated border-surface-border text-teal hover:border-teal/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4" />
              <span>{showRouteCopilot ? 'Hide Route Threat Copilot' : 'Run Safe Route Copilot'}</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-midnight">AI SCAN</span>
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
                    ? 'bg-surface-elevated border-teal shadow-cyber-lift'
                    : 'bg-midnight/80 border-surface-border hover:bg-surface-elevated/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-rastaText-primary flex items-center gap-1.5 truncate">
                    <span>{cat.emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </span>
                  <span className={sev.badgeClass}>{sev.label}</span>
                </div>

                <p className="text-[11px] text-rastaText-secondary truncate">{item.title}</p>
                <p className="text-[10px] text-rastaText-muted truncate mt-0.5">📍 {item.address}</p>

                <div className="flex items-center justify-between pt-2 border-t border-surface-border/50 text-[10px] text-rastaText-muted mt-2">
                  <span className="font-mono text-teal font-semibold">{item.id}</span>
                  <span className="text-rose-400 font-bold">{item.votes} upvotes</span>
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
              className="bg-surface/95 backdrop-blur-md border border-surface-border text-teal rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none shadow-xl cursor-pointer"
            >
              {CITIES.map(c => (
                <option key={c.id} value={c.id} className="bg-surface text-rastaText-primary">
                  {c.name}
                </option>
              ))}
            </select>

            {/* Mobile Safe Route Copilot Button */}
            <button
              onClick={() => setShowRouteCopilot(r => !r)}
              className="flex-1 bg-surface/95 backdrop-blur-md border border-surface-border text-teal rounded-xl px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xl cursor-pointer"
            >
              <Route className="w-3.5 h-3.5" />
              <span>{showRouteCopilot ? 'Close Copilot' : 'Route Copilot'}</span>
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
            attribution='&copy; OpenStreetMap contributors'
          />
          <MapViewController center={mapCenter} zoom={mapZoom} />

          {/* Hazardous Route Polyline (Dashed Amber/Red) */}
          {showRouteCopilot && activeRouteType === 'hazardous' && (
            <Polyline
              positions={SAMPLE_ROUTES.directHazardous}
              pathOptions={{
                color: '#EF4444',
                weight: 5,
                dashArray: '8, 8',
                opacity: 0.9
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
                opacity: 0.95
              }}
            />
          )}

          {/* Incident Pins */}
          {filtered.map(item => {
            const isResolved = item.status === 'verified_resolved'
            const pinColor = isResolved ? '#34D399' : (PIN_COLORS[item.severity] || '#EF4444')

            return (
              <Marker
                key={item.id}
                position={[item.latitude, item.longitude]}
                icon={createLeafletPin(pinColor, isResolved)}
                eventHandlers={{
                  click: () => setSelectedIncident(item)
                }}
              />
            )
          })}
        </MapContainer>

        {/* ── Safe Route Threat Copilot Overlay Card (Blueprint Section 5) ── */}
        {showRouteCopilot && (
          <div className="absolute top-16 lg:top-4 left-3 right-3 lg:left-auto lg:right-4 z-20 w-auto lg:w-80 bg-surface/95 backdrop-blur-xl border border-surface-border p-3.5 sm:p-4 rounded-2xl shadow-2xl space-y-3 animate-fade-in text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-rastaText-primary">
                <Route className="w-4 h-4 text-teal" />
                <span>Safe Route Threat Scanner</span>
              </div>
              <button onClick={() => setShowRouteCopilot(false)} className="text-rastaText-muted hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-rastaText-secondary">
              Simulating commute corridor: <strong>Koramangala ➔ MG Road</strong>
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveRouteType('hazardous')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeRouteType === 'hazardous'
                    ? 'bg-rose-500/15 border-rose-500/50 text-white'
                    : 'bg-midnight border-surface-border text-rastaText-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Direct Path</span>
                  <span className="badge-critical text-[10px]">84% Risk</span>
                </div>
                <p className="text-[10px] text-rose-400 mt-1">⚠️ 2 Critical Hazards in path</p>
              </button>

              <button
                onClick={() => setActiveRouteType('safe')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeRouteType === 'safe'
                    ? 'bg-teal/15 border-teal/50 text-white'
                    : 'bg-midnight border-surface-border text-rastaText-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">Safe Detour</span>
                  <span className="badge-verified text-[10px]">12% Risk</span>
                </div>
                <p className="text-[10px] text-teal mt-1">✅ 0 Critical hazards bypass</p>
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-midnight border border-surface-border text-[11px] text-rastaText-secondary">
              {activeRouteType === 'hazardous' ? (
                <span>⚠️ Caution: Route intersects dangling transformer cable (RASTA-8042) and open sewer (RASTA-7911).</span>
              ) : (
                <span>🛡️ Recommended: Domlur elevated bypass completely clears flooded underpass and electrical hazard.</span>
              )}
            </div>
          </div>
        )}

        {/* Map Recenter Button */}
        <div className="absolute bottom-20 lg:bottom-4 right-4 z-10">
          <button
            onClick={handleNearMe}
            className="p-3 rounded-2xl bg-surface/95 backdrop-blur-md border border-surface-border text-teal hover:text-white shadow-xl cursor-pointer hover:-translate-y-0.5 transition-transform"
            title="Recenter near my location"
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Incident Detail Bottom Sheet ─────────────────────────────── */}
      {selectedIncident && (
        <div className="absolute bottom-0 inset-x-0 lg:bottom-4 lg:right-4 lg:left-auto lg:w-96 z-50 bg-surface/95 backdrop-blur-xl border border-surface-border p-4 sm:p-5 pb-24 lg:pb-5 rounded-t-3xl lg:rounded-2xl shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{getCategory(selectedIncident.category).emoji}</span>
              <div>
                <span className="text-[10px] font-mono text-teal uppercase font-bold">{selectedIncident.id}</span>
                <h3 className="text-sm font-bold text-rastaText-primary leading-tight">{selectedIncident.title}</h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedIncident(null)}
              className="p-1 rounded-full text-rastaText-muted hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-rastaText-secondary leading-relaxed mb-3">
            {selectedIncident.description}
          </p>

          {/* Photographs: Before / After Proof */}
          {selectedIncident.evidence_url ? (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-xl overflow-hidden border border-surface-border">
                <span className="text-[9px] font-bold text-rastaText-muted uppercase px-1.5 py-0.5 block bg-midnight">Citizen Photo</span>
                <img src={selectedIncident.photo_url} alt="Before" className="w-full h-20 object-cover" />
              </div>
              <div className="rounded-xl overflow-hidden border border-emerald-900/60">
                <span className="text-[9px] font-bold text-emerald-400 uppercase px-1.5 py-0.5 block bg-midnight">Resolution Proof</span>
                <img src={selectedIncident.evidence_url} alt="After" className="w-full h-20 object-cover" />
              </div>
            </div>
          ) : selectedIncident.photo_url && (
            <div className="rounded-xl overflow-hidden border border-surface-border h-28 mb-3">
              <img src={selectedIncident.photo_url} alt="Evidence" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Status & Department */}
          <div className="flex items-center justify-between text-xs py-2 border-y border-surface-border mb-3">
            <div className="flex items-center gap-2">
              <span className={getStatus(selectedIncident.status).badgeClass}>
                {getStatus(selectedIncident.status).label}
              </span>
              <span className="text-rastaText-muted">📍 {selectedIncident.dept}</span>
            </div>
            <span className="text-[11px] text-rastaText-muted">{timeAgo(selectedIncident.created_at)}</span>
          </div>

          {/* Confirmation Action */}
          <button
            onClick={() => handleUpvote(selectedIncident.id)}
            className="btn-rasta-secondary w-full text-xs"
          >
            <ThumbsUp className="w-3.5 h-3.5 text-teal" />
            <span>Confirm Road Hazard ({selectedIncident.votes || 1})</span>
          </button>
        </div>
      )}
    </div>
  )
}
