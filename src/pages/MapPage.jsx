import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup, useMap } from 'react-leaflet'
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
  Info,
  Loader2,
  Compass,
  Radio
} from 'lucide-react'

// Memoized Leaflet Pins Cache for maximum rendering performance
const pinIconCache = new Map()

function getLeafletPin(color, isResolved) {
  const key = `${color}_${isResolved}`
  if (!pinIconCache.has(key)) {
    pinIconCache.set(
      key,
      L.divIcon({
        className: '',
        html: `
          <div style="position:relative; width:30px; height:30px;">
            <div style="
              width: 30px; height: 30px; border-radius: 50% 50% 50% 0;
              background: ${color}; border: 2.5px solid #FFFFFF;
              transform: rotate(-45deg);
              box-shadow: 0 2px 6px rgba(0,0,0,0.12);
            "></div>
            ${
              isResolved
                ? '<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:12px; color:white; font-weight:bold;">✓</div>'
                : '<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:11px; color:white; font-weight:bold;">!</div>'
            }
          </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      })
    )
  }
  return pinIconCache.get(key)
}

// Distinctive User Location Marker: Pulsing Apple Blue halo + crisp core
const userLocationIcon = L.divIcon({
  className: 'user-location-marker-container',
  html: `
    <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center;">
      <div class="user-location-pulse" style="position:absolute; inset:-8px; border-radius:50%; background:rgba(0, 113, 227, 0.25); pointer-events:none;"></div>
      <div style="position:absolute; inset:-2px; border-radius:50%; background:rgba(0, 113, 227, 0.2);"></div>
      <div style="width:16px; height:16px; border-radius:50%; background:#0071E3; border:3px solid #FFFFFF; box-shadow:0 1px 4px rgba(0,0,0,0.12); position:relative; z-index:2;"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const PIN_COLORS = {
  critical: '#FF3B30', // Apple Red
  high: '#FF9500',     // Apple Amber
  medium: '#0071E3',   // Apple Blue
  low: '#8E8E93',      // Apple Gray
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

  // Live Browser Geolocation & Tracking State
  const [userLocation, setUserLocation] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [geoStatusMessage, setGeoStatusMessage] = useState(null)

  const watchIdRef = useRef(null)
  const messageTimeoutRef = useRef(null)

  const reloadData = () => {
    setIncidents(hazardStore.getAll('all'))
  }

  useEffect(() => {
    reloadData()
  }, [])

  const showStatus = (type, text, duration = 4000) => {
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    setGeoStatusMessage({ type, text })
    if (duration > 0) {
      messageTimeoutRef.current = setTimeout(() => {
        setGeoStatusMessage(null)
      }, duration)
    }
  }

  // ── Browser Geolocation: One-Time Precision Fix ────────────────────────────
  const locateUser = (centerMap = true) => {
    if (!navigator.geolocation) {
      showStatus('error', 'Browser does not support geolocation.', 6000)
      return
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      showStatus('warning', 'Geolocation requires HTTPS security. Please use a secure connection.', 6000)
      return
    }

    setIsLocating(true)
    showStatus('loading', 'Finding your location… Acquiring GPS lock', 0)

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 15000,
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const { latitude, longitude, accuracy, heading, speed } = position.coords
        const newLocation = {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || 0,
          heading: heading || 0,
          speed: speed || 0,
          timestamp: position.timestamp || Date.now(),
        }

        setUserLocation(newLocation)

        if (centerMap) {
          setMapCenter([latitude, longitude])
          setMapZoom(prev => Math.max(prev, 15))
        }

        const accText = accuracy ? ` (±${Math.round(accuracy)}m accuracy)` : ''
        showStatus('success', `Your location is shown on the map${accText}.`, 4000)
      },
      (error) => {
        setIsLocating(false)
        let msg = 'Couldn’t determine your location. Try again or continue using the map.'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location access is blocked. Enable it in your browser settings and try again.'
            break
          case error.POSITION_UNAVAILABLE:
            msg = 'Location information is currently unavailable. Try again outside or check device GPS.'
            break
          case error.TIMEOUT:
            msg = 'Location request timed out. Retrying or continue using the map.'
            break
          default:
            msg = 'Couldn’t determine your location. Try again or continue using the map.'
        }

        showStatus('error', msg, 6000)
      },
      geoOptions
    )
  }

  // ── Optional Continuous Live Tracking Mode ─────────────────────────────────
  const toggleTracking = () => {
    if (isTracking) {
      stopTracking()
      showStatus('info', 'Live location tracking stopped.', 3000)
      return
    }

    if (!navigator.geolocation) {
      showStatus('error', 'Browser does not support geolocation.', 5000)
      return
    }

    setIsTracking(true)
    showStatus('loading', 'Starting continuous live tracking…', 3000)

    locateUser(true)

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords
        setUserLocation({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || 0,
          heading: heading || 0,
          speed: speed || 0,
          timestamp: position.timestamp || Date.now(),
        })
      },
      (error) => {
        console.warn('Geolocation watchPosition error:', error.message)
      },
      geoOptions
    )
  }

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
    }
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
    <div className="flex flex-col lg:flex-row h-full bg-[#F5F5F7] relative overflow-hidden font-sans">
      {/* ── Desktop Left Sidebar (>=1024px) ─────────────────────────── */}
      <div className="hidden lg:flex flex-col w-96 bg-white border-r border-[#E5E5EA] z-20 flex-shrink-0">
        <div className="p-4 border-b border-[#E5E5EA] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1D1D1F]">Road Hazards Explorer</h2>
            <span className="text-xs font-semibold text-[#0071E3]">
              {filtered.length} in {selectedCity.name}
            </span>
          </div>

          {/* Apple-Style Segmented City Switcher */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#F5F5F7] rounded-xl border border-[#E5E5EA]">
            {CITIES.map(c => (
              <button
                key={c.id}
                onClick={() => handleCitySelect(c)}
                className={`py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                  selectedCity.id === c.id
                    ? 'bg-white text-[#1D1D1F] shadow-apple-sm font-semibold'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                {c.name.split('-')[0]}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#86868B] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search street, area or ID..."
              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#0071E3] transition-colors"
            />
          </div>

          {/* Route Threat Scanner Trigger */}
          <button
            onClick={() => setShowRouteCopilot(r => !r)}
            className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${
              showRouteCopilot
                ? 'bg-[#0071E3]/10 border-[#0071E3] text-[#0071E3]'
                : 'bg-white border-[#E5E5EA] text-[#1D1D1F] hover:border-[#0071E3]/50 shadow-apple-sm'
            }`}
          >
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-[#0071E3]" />
              <span>{showRouteCopilot ? 'Hide Route Threat Scanner' : 'Safe Route Threat Scanner'}</span>
            </div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/5 text-[#0071E3]">
              AI SCAN
            </span>
          </button>
        </div>

        {/* Scrollable Incident List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F5F5F7]">
          {filtered.map(item => {
            const isSelected = selectedIncident?.id === item.id
            const cat = getCategory(item.category)
            const sev = getSeverity(item.severity)

            return (
              <div
                key={item.id}
                onClick={() => setSelectedIncident(item)}
                className={`p-3 rounded-xl border transition-all cursor-pointer bg-white ${
                  isSelected
                    ? 'border-[#0071E3] shadow-apple ring-2 ring-[#0071E3]/20'
                    : 'border-[#E5E5EA] hover:border-[#D2D2D7] shadow-apple-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-semibold text-[#1D1D1F] flex items-center gap-1.5 truncate">
                    <span>{cat.emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </span>
                  <span className={sev.badgeClass}>{sev.label}</span>
                </div>

                <p className="text-[11px] text-[#6E6E73] truncate font-medium">{item.title}</p>
                <p className="text-[10px] text-[#86868B] truncate mt-0.5">📍 {item.address}</p>

                <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA] text-[10px] text-[#86868B] mt-2">
                  <span className="font-mono text-[#0071E3] font-medium">{item.id}</span>
                  <span className="text-[#1D1D1F] font-semibold">{item.votes} upvotes</span>
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
              className="bg-white/95 backdrop-blur-md border border-[#E5E5EA] text-[#1D1D1F] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0071E3] shadow-apple cursor-pointer"
            >
              {CITIES.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Mobile Safe Route Scanner Button */}
            <button
              onClick={() => setShowRouteCopilot(r => !r)}
              className="flex-1 bg-white/95 backdrop-blur-md border border-[#E5E5EA] text-[#0071E3] rounded-xl px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-apple cursor-pointer hover:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
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

          {/* Hazardous Route Polyline (Dashed Apple Red) */}
          {showRouteCopilot && activeRouteType === 'hazardous' && (
            <Polyline
              positions={SAMPLE_ROUTES.directHazardous}
              pathOptions={{
                color: '#FF3B30',
                weight: 5,
                dashArray: '8, 8',
                opacity: 0.95,
              }}
            />
          )}

          {/* Recommended Safe Detour Polyline (Solid Apple Green) */}
          {showRouteCopilot && activeRouteType === 'safe' && (
            <Polyline
              positions={SAMPLE_ROUTES.safeDetour}
              pathOptions={{
                color: '#34C759',
                weight: 5,
                opacity: 0.95,
              }}
            />
          )}

          {/* Real Live User Location Marker with Radar Halo & GPS Accuracy Ring */}
          {userLocation && (
            <>
              {userLocation.accuracy > 0 && userLocation.accuracy <= 5000 && (
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={userLocation.accuracy}
                  pathOptions={{
                    color: '#0071E3',
                    fillColor: '#0071E3',
                    fillOpacity: 0.1,
                    weight: 1.5,
                    dashArray: '4, 4',
                  }}
                />
              )}

              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={userLocationIcon}
                zIndexOffset={1000}
              >
                <Popup>
                  <div className="p-1 space-y-1.5 text-xs text-[#1D1D1F]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#0071E3]">
                      <span className="w-2 h-2 rounded-full bg-[#0071E3] animate-pulse"></span>
                      <span>Your Live Position</span>
                    </div>
                    <div className="text-[11px] text-[#6E6E73] font-mono bg-[#F5F5F7] p-1.5 rounded border border-[#E5E5EA]">
                      {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                    </div>
                    {userLocation.accuracy > 0 && (
                      <div className="text-[10px] text-[#86868B]">
                        Accuracy: ±{Math.round(userLocation.accuracy)}m
                      </div>
                    )}
                    <div className="text-[10px] text-[#86868B] pt-1 border-t border-[#E5E5EA] flex items-center justify-between">
                      <span>Status: GPS Locked</span>
                      <span className="text-[#34C759] font-medium font-mono">
                        {new Date(userLocation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* Incident Pins with Memoized Icon Generation */}
          {filtered.map(item => {
            const isResolved = item.status === 'verified_resolved'
            const pinColor = isResolved ? '#34C759' : PIN_COLORS[item.severity] || '#FF3B30'

            return (
              <Marker
                key={item.id}
                position={[item.latitude, item.longitude]}
                icon={getLeafletPin(pinColor, isResolved)}
                eventHandlers={{
                  click: () => setSelectedIncident(item),
                }}
              />
            )
          })}
        </MapContainer>

        {/* ── Safe Route Threat Scanner Floating Panel ─────────────────── */}
        {showRouteCopilot && (
          <div
            className="absolute top-16 lg:top-4 left-3 right-3 lg:left-auto lg:right-4 z-20 w-auto lg:w-96 rounded-2xl p-4.5 space-y-3.5 bg-white/95 backdrop-blur-md shadow-apple-lg border border-[#E5E5EA] text-[#1D1D1F] text-xs max-h-[80vh] overflow-y-auto animate-fade-in"
            role="region"
            aria-label="Safe Route Threat Scanner Panel"
          >
            {/* Header: Title and Controls */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E5E5EA]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center flex-shrink-0">
                  <Route className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#1D1D1F] leading-none">
                    Safe Route Threat Scanner
                  </h3>
                  <span className="text-[10px] text-[#86868B] mt-0.5 block">
                    AI GIS Commute Risk Simulation
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsRouteCollapsed(c => !c)}
                  className="sm:hidden p-1.5 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] cursor-pointer"
                  aria-label={isRouteCollapsed ? 'Expand route scanner' : 'Collapse route scanner'}
                >
                  {isRouteCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setShowRouteCopilot(false)}
                  className="p-1.5 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] cursor-pointer"
                  aria-label="Close safe route threat scanner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subtitle Corridor */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#6E6E73]">
              <span>Simulating commute corridor:</span>
              <span className="font-semibold text-[#1D1D1F] bg-[#F5F5F7] px-2.5 py-0.5 rounded border border-[#E5E5EA] self-start sm:self-auto font-mono">
                Koramangala ➔ MG Road
              </span>
            </div>

            {/* Collapsible Content Area */}
            {!isRouteCollapsed && (
              <>
                {/* Two Clearly Separated Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Card 1: Direct Path */}
                  <button
                    onClick={() => setActiveRouteType('hazardous')}
                    aria-pressed={activeRouteType === 'hazardous'}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeRouteType === 'hazardous'
                        ? 'bg-[#FFF5F5] border-[#FF3B30] ring-2 ring-[#FF3B30]/20'
                        : 'bg-white border-[#E5E5EA] hover:border-[#D2D2D7]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-[#1D1D1F]">Direct Path</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFECEB] text-[#D70015]">
                        84% Risk
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E6E73] flex items-center gap-1.5 font-medium leading-tight">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#FF3B30] flex-shrink-0" />
                      <span>2 critical hazards</span>
                    </p>
                    <div className="mt-2 text-[10px] text-[#86868B]">
                      4.8 km · 28 mins
                    </div>
                  </button>

                  {/* Card 2: Safe Detour */}
                  <button
                    onClick={() => setActiveRouteType('safe')}
                    aria-pressed={activeRouteType === 'safe'}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeRouteType === 'safe'
                        ? 'bg-[#F0FDF4] border-[#34C759] ring-2 ring-[#34C759]/20'
                        : 'bg-white border-[#E5E5EA] hover:border-[#D2D2D7]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-[#1D1D1F]">Safe Detour</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F8EE] text-[#248A3D]">
                        12% Risk
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6E6E73] flex items-center gap-1.5 font-medium leading-tight">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#34C759] flex-shrink-0" />
                      <span>0 critical hazards</span>
                    </p>
                    <div className="mt-2 text-[10px] text-[#34C759] font-medium">
                      5.6 km (+800m safe bypass)
                    </div>
                  </button>
                </div>

                {/* Recommendation & Reasoning Section */}
                <div className="p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#0071E3] uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-[#0071E3]" />
                      Route Assessment
                    </span>
                    <span className="text-[10px] text-[#86868B]">
                      {activeRouteType === 'safe' ? 'Safe Detour' : 'Direct Corridor'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#1D1D1F] leading-relaxed">
                    {activeRouteType === 'hazardous' ? (
                      <span>
                        <strong className="text-[#D70015]">Direct Path Caution:</strong> Corridor intersects dangling 11kV transformer wire (<span className="font-mono text-[#D70015]">RASTA-8042</span>) and uncovered sewer pit (<span className="font-mono text-[#D70015]">RASTA-7911</span>). Imminent threat to life during rainfall.
                      </span>
                    ) : (
                      <span>
                        <strong className="text-[#248A3D]">Recommended Detour:</strong> Domlur elevated arterial bypass routes around flooded underpasses and high-voltage electrical hazards with 0 critical defects.
                      </span>
                    )}
                  </p>

                  <div className="pt-2 border-t border-[#E5E5EA] flex items-center justify-between text-[10px] text-[#86868B]">
                    <span>Simulated via municipal coordinates</span>
                    <span className="text-[#0071E3] font-medium">GIS Verified</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Floating Location Control Stack ─────────────────────────── */}
        <div
          className={`absolute bottom-24 lg:bottom-6 z-40 flex flex-col items-end gap-2.5 transition-all duration-300 ${
            selectedIncident ? 'right-4 lg:right-[26rem]' : 'right-4 lg:right-6'
          }`}
        >
          {/* Status Message / Toast */}
          {geoStatusMessage && (
            <div
              role="status"
              className="px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 max-w-xs shadow-apple-lg bg-white/95 backdrop-blur-md border border-[#E5E5EA] text-[#1D1D1F] animate-fade-in"
            >
              {geoStatusMessage.type === 'loading' && (
                <Loader2 className="w-4 h-4 text-[#0071E3] animate-spin flex-shrink-0" />
              )}
              {geoStatusMessage.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-[#34C759] flex-shrink-0" />
              )}
              {geoStatusMessage.type === 'error' && (
                <AlertTriangle className="w-4 h-4 text-[#FF3B30] flex-shrink-0" />
              )}
              {geoStatusMessage.type === 'warning' && (
                <AlertOctagon className="w-4 h-4 text-[#FF9500] flex-shrink-0" />
              )}
              {geoStatusMessage.type === 'info' && (
                <Info className="w-4 h-4 text-[#0071E3] flex-shrink-0" />
              )}
              <span className="font-medium leading-tight text-[11px] flex-1">
                {geoStatusMessage.text}
              </span>
              <button
                onClick={() => setGeoStatusMessage(null)}
                className="text-[#86868B] hover:text-[#1D1D1F] p-0.5 ml-1 cursor-pointer"
                aria-label="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Control Buttons Cluster */}
          <div className="flex items-center gap-2">
            {/* Live Tracking Mode Pill */}
            <button
              onClick={toggleTracking}
              disabled={isLocating}
              aria-pressed={isTracking}
              aria-label={isTracking ? 'Disable continuous live GPS tracking' : 'Enable continuous live GPS tracking'}
              className={`h-11 px-3.5 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-2 shadow-apple bg-white ${
                isTracking
                  ? 'border-[#0071E3] text-[#0071E3] ring-2 ring-[#0071E3]/20'
                  : 'border-[#E5E5EA] text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isTracking ? 'bg-[#0071E3] animate-ping' : 'bg-[#86868B]'
                }`}
              />
              <span className="text-[11px] font-semibold">{isTracking ? 'Tracking Live' : 'Track Mode'}</span>
            </button>

            {/* Primary Circular "Show My Location" Button (Apple-Inspired White Surface) */}
            <button
              onClick={() => locateUser(true)}
              disabled={isLocating}
              aria-label={isLocating ? 'Acquiring live location…' : 'Show my location'}
              title="Show my location"
              className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-white hover:bg-[#F5F5F7] active:scale-95 border border-[#E5E5EA] hover:border-[#D2D2D7] text-[#0071E3] shadow-apple-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group relative"
            >
              {isLocating ? (
                <Loader2 className="w-5 h-5 text-[#0071E3] animate-spin" />
              ) : isTracking ? (
                <Compass className="w-5 h-5 text-[#0071E3] animate-pulse" />
              ) : (
                <Navigation className="w-5 h-5 transition-transform group-hover:scale-110 fill-[#0071E3]/15" />
              )}

              {userLocation && !isLocating && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#34C759] border-2 border-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Selected Incident Details Panel (Apple Sheet / Floating Card) ── */}
      {selectedIncident && (
        <div
          className="fixed inset-x-0 bottom-0 lg:bottom-4 lg:right-4 lg:left-auto lg:w-96 z-50 p-4 sm:p-5 pb-24 lg:pb-5 rounded-t-3xl lg:rounded-2xl shadow-apple-lg bg-white/95 backdrop-blur-md border border-[#E5E5EA] text-[#1D1D1F] animate-fade-in max-h-[85vh] lg:max-h-[calc(100vh-14rem)] overflow-y-auto space-y-3.5"
          role="dialog"
          aria-label={`Incident details for ${selectedIncident.id}`}
        >
          {/* Mobile Drag Indicator Handle */}
          <div className="lg:hidden w-12 h-1 bg-[#D2D2D7] rounded-full mx-auto -mt-1 mb-2" />

          {/* 1. Incident ID and Close Button */}
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E5EA]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold text-[#0071E3] px-2 py-0.5 rounded bg-[#0071E3]/10">
                {selectedIncident.id}
              </span>
              {selectedIncident.isDemo ? (
                <span className="px-2 py-0.5 rounded-full bg-[#FFF4E5] text-[#C96E00] border border-[#FF9500]/30 text-[10px] font-semibold uppercase">
                  DEMO SIGNAL
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#E8F8EE] text-[#248A3D] border border-[#34C759]/30 text-[10px] font-semibold uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse"></span>
                  <span>LIVE SIGNAL</span>
                </span>
              )}
              <span className="text-[10px] text-[#86868B] uppercase font-medium">
                {selectedIncident.city || 'bengaluru'}
              </span>
            </div>

            <button
              onClick={() => setSelectedIncident(null)}
              className="p-1.5 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] cursor-pointer"
              aria-label="Close incident details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Hazard Category and Headline */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#1D1D1F] px-2.5 py-1 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA] flex items-center gap-1.5">
                <span>{getCategory(selectedIncident.category).emoji}</span>
                <span>{getCategory(selectedIncident.category).label}</span>
              </span>

              <span className={getSeverity(selectedIncident.severity).badgeClass}>
                {getSeverity(selectedIncident.severity).label}
              </span>

              <span className="text-[11px] font-medium text-[#6E6E73] px-2 py-0.5 rounded bg-[#F5F5F7]">
                {selectedIncident.dept}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-semibold text-[#1D1D1F] leading-snug">
              {selectedIncident.title}
            </h3>

            <p className="text-xs text-[#6E6E73] leading-relaxed">
              {selectedIncident.description?.replace(/https?:\/\/[^\s]+/g, '').replace(/CBMi[A-Za-z0-9_-]{20,}/g, '').trim()}
            </p>
          </div>

          {/* 3. Verification & Confidence Status */}
          <div className="p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#86868B] font-medium text-[11px]">Verification Status:</span>
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

            <div className="flex items-center justify-between text-[11px] text-[#1D1D1F] pt-1.5 border-t border-[#E5E5EA]">
              <span className="text-[#86868B]">Corroboration:</span>
              <span className="font-semibold text-[#0071E3]">
                {selectedIncident.votes || 1} Independent Signals
              </span>
            </div>
          </div>

          {/* 4. Source & Original Source Link */}
          <div className="p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#86868B] text-[11px]">Reported By:</span>
              <span className="font-semibold text-[#1D1D1F]">
                {selectedIncident.reporter_name || 'Verified Commuter'}
              </span>
            </div>

            {(selectedIncident.original_url || extractUrl(selectedIncident.description)) ? (
              <div className="pt-1.5 border-t border-[#E5E5EA] flex items-center justify-between">
                <span className="text-[#86868B] text-[11px]">External Feed:</span>
                <a
                  href={selectedIncident.original_url || extractUrl(selectedIncident.description)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0071E3] hover:underline flex items-center gap-1 font-semibold text-xs truncate max-w-[200px]"
                >
                  <span>Original Article Link</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            ) : (
              <div className="pt-1.5 border-t border-[#E5E5EA] flex items-center justify-between text-[11px] text-[#86868B]">
                <span>Source Channel:</span>
                <span className="text-[#1D1D1F] font-medium">RASTA Citizen App (GPS Lock)</span>
              </div>
            )}
          </div>

          {/* 5. Incident Photo (Before & After Resolution Comparison) */}
          {selectedIncident.evidence_url ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7]">
                <span className="text-[9px] font-semibold text-[#86868B] uppercase px-2 py-0.5 block bg-white border-b border-[#E5E5EA]">
                  BEFORE: Citizen Photo
                </span>
                <img
                  src={selectedIncident.photo_url}
                  alt="Initial hazard evidence"
                  className="w-full h-24 object-cover"
                />
              </div>

              <div className="rounded-xl overflow-hidden border border-[#34C759]/30 bg-[#F0FDF4]">
                <span className="text-[9px] font-semibold text-[#248A3D] uppercase px-2 py-0.5 block bg-[#E8F8EE] border-b border-[#34C759]/20">
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
              <div className="rounded-xl overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7] h-32 relative">
                <img
                  src={selectedIncident.photo_url}
                  alt="Hazard evidence"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 text-[10px] font-medium bg-black/70 text-white px-2 py-0.5 rounded">
                  Geotagged Photo Evidence
                </span>
              </div>
            )
          )}

          {/* 6. Location and Report Timestamp */}
          <div className="p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-1.5 text-xs">
            <div className="flex items-start gap-1.5 text-[#1D1D1F]">
              <MapPin className="w-3.5 h-3.5 text-[#0071E3] mt-0.5 flex-shrink-0" />
              <span className="font-medium text-xs leading-tight">{selectedIncident.address}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#86868B] pt-1.5 border-t border-[#E5E5EA]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#86868B]" />
                <span>Reported {timeAgo(selectedIncident.created_at)}</span>
              </span>
              <span className="font-mono text-[#6E6E73]">
                {new Date(selectedIncident.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* 7. Current Workflow Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#86868B] uppercase font-medium">Triage Workflow</span>
              <div className="font-semibold text-[#1D1D1F]">
                {getStatus(selectedIncident.status).label}
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] text-[#86868B] uppercase font-medium">Department Wing</span>
              <div className="font-semibold text-[#0071E3]">
                {selectedIncident.dept}
              </div>
            </div>
          </div>

          {/* 8. Prominent Confirmation / Upvote Action (Apple Blue) */}
          <button
            onClick={() => handleUpvote(selectedIncident.id)}
            className="w-full min-h-[44px] bg-[#0071E3] hover:bg-[#0077ED] active:scale-[0.99] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-apple"
          >
            <ThumbsUp className="w-4 h-4 text-white" />
            <span>
              Confirm This Hazard ({selectedIncident.votes || 1} Corroborations)
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
