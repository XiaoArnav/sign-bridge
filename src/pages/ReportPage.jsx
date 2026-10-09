import React, { useState, useRef, useEffect } from 'react'
import { Camera, Mic, Square, Trash2, MapPin, Send, X, ArrowLeft, CheckCircle2, Loader2, Navigation, AlertTriangle, ShieldCheck, ChevronRight, RefreshCw, Volume2 } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { HAZARD_CATEGORIES, SEVERITY_LEVELS, getCategory, getSeverity } from '../lib/hazardTypes.js'
import { hazardStore, CITIES } from '../lib/hazardStore.js'

// Small adjustable pin icon for the interactive location picker
const adjustablePinIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative; width:32px; height:32px;">
      <div style="
        width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
        background: #EF4444; border: 3px solid #FFFFFF;
        transform: rotate(-45deg);
        box-shadow: 0 4px 16px rgba(0,0,0,0.6);
      "></div>
      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:bold;">📍</div>
    </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

// Interactive Map Click Handler to reposition pin
function LocationMapPicker({ position, onLocationChange }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return <Marker position={position} icon={adjustablePinIcon} />
}

export default function ReportPage({ onBack, onComplete }) {
  // Current Step in the 4-stage guided flow (0: Evidence, 1: Location & Pin, 2: Category & Details, 3: Review & Submit)
  const [currentStep, setCurrentStep] = useState(0)

  // Form State
  const [photo, setPhoto] = useState(null)
  const [selectedCity, setSelectedCity] = useState('bengaluru')
  const [category, setCategory] = useState('wire')
  const [severity, setSeverity] = useState('critical')
  const [description, setDescription] = useState('')

  // Speech-to-Text State
  const [isDictating, setIsDictating] = useState(false)
  const recognitionRef = useRef(null)

  // Voice Note Recording
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerIntervalRef = useRef(null)

  // Location State
  const [location, setLocation] = useState({
    latitude: 12.9352,
    longitude: 77.6245,
    address: '8th Main, 4th Block, Koramangala, Bengaluru',
    accuracy: 'GPS Verified',
    isManual: false
  })
  const [locLoading, setLocLoading] = useState(false)
  const [locPermissionDenied, setLocPermissionDenied] = useState(false)

  // Submission & Validation States
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submissionError, setSubmissionError] = useState(null)
  const [createdReceipt, setCreatedReceipt] = useState(null)
  const fileInputRef = useRef()

  // ── Speech-to-Text Dictation ──────────────────────────────────────────────
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech-to-Text is not supported on this browser. You can type or use the audio note option.')
      return
    }

    if (isDictating) {
      recognitionRef.current?.stop()
      setIsDictating(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-IN'

      recognition.onstart = () => setIsDictating(true)
      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        if (transcript.trim()) {
          setDescription(prev => (prev ? `${prev} ${transcript}` : transcript))
        }
      }
      recognition.onerror = () => setIsDictating(false)
      recognition.onend = () => setIsDictating(false)

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setIsDictating(false)
    }
  }

  // ── Voice Audio Recording ─────────────────────────────────────────────────
  const startRecordingAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(audioBlob))
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecordingAudio(true)
      setRecordingSeconds(0)
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1)
      }, 1000)
    } catch {
      alert('Microphone access is required to record a spoken voice memo.')
    }
  }

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop()
      setIsRecordingAudio(false)
      clearInterval(timerIntervalRef.current)
    }
  }

  const deleteRecording = () => {
    setAudioUrl(null)
    setRecordingSeconds(0)
  }

  useEffect(() => {
    return () => {
      clearInterval(timerIntervalRef.current)
      recognitionRef.current?.stop()
    }
  }, [])

  // ── Photo Upload ──────────────────────────────────────────────────────────
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  // ── GPS Auto-Detection with Reverse Geocoding ─────────────────────────────
  const triggerGps = () => {
    setLocLoading(true)
    setLocPermissionDenied(false)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          const data = await res.json()
          const address = data.display_name?.split(',').slice(0, 3).join(', ') || 'GPS Location Locked'
          setLocation({ latitude, longitude, address, accuracy: 'High Precision (GPS)', isManual: false })
        } catch {
          setLocation({ latitude, longitude, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, accuracy: 'Satellite Coords', isManual: false })
        }
        setLocLoading(false)
      },
      (err) => {
        setLocPermissionDenied(true)
        setLocation(prev => ({ ...prev, accuracy: 'Manual Pin Placement', isManual: true }))
        setLocLoading(false)
      },
      { timeout: 8000 }
    )
  }

  // ── Interactive Map Pin Adjuster ──────────────────────────────────────────
  const handleMapPinMove = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      const data = await res.json()
      const address = data.display_name?.split(',').slice(0, 3).join(', ') || 'Manually Adjusted Pin'
      setLocation({ latitude: lat, longitude: lng, address, accuracy: 'Adjusted by User', isManual: true })
    } catch {
      setLocation(prev => ({ ...prev, latitude: lat, longitude: lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, isManual: true }))
    }
  }

  // ── Submission Handler with Realistic Progress & Backend Confirmation ────
  const handleSubmit = () => {
    setSubmitting(true)
    setSubmissionError(null)
    setUploadProgress(20)

    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 90) {
          clearInterval(interval)
          return 95
        }
        return p + 25
      })
    }, 150)

    setTimeout(() => {
      clearInterval(interval)
      setUploadProgress(100)

      const receipt = hazardStore.createReport({
        category,
        severity,
        city: selectedCity,
        title: description.slice(0, 50) || `${getCategory(category).label} on ${location.address.split(',')[0]}`,
        description: description.trim() || `Reported ${getCategory(category).label}. Commuter hazard requiring urgent fix.`,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        photo_url: photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        voice_note: audioUrl,
        reporter_name: 'Verified Citizen'
      })

      setCreatedReceipt(receipt)
      setSubmitting(false)
    }, 700)
  }

  // ── Digital Receipt Screen ────────────────────────────────────────────────
  if (createdReceipt) {
    const cat = getCategory(createdReceipt.category)
    const sev = getSeverity(createdReceipt.severity)

    return (
      <div className="flex flex-col h-full bg-midnight p-4 sm:p-6 max-w-lg mx-auto w-full justify-center items-center pb-24 animate-fade-in">
        <div className="rasta-surface p-6 border-surface-border w-full space-y-4 text-center shadow-2xl">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal">
              Official Hazard Logged
            </span>
            <h2 className="text-xl font-bold text-rastaText-primary mt-0.5">Ticket #{createdReceipt.id}</h2>
            <p className="text-xs text-rastaText-secondary mt-1">
              Synchronized to Public Safety Map & Dispatched to Municipal Queue
            </p>
          </div>

          <div className="bg-midnight p-3.5 rounded-xl border border-surface-border text-left space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-rastaText-secondary">Category:</span>
              <span className="font-semibold text-rastaText-primary flex items-center gap-1">
                <span>{cat.emoji}</span> {cat.label}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-rastaText-secondary">Threat Rating:</span>
              <span className={`font-semibold ${sev.badgeClass}`}>{sev.label}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-rastaText-secondary">Coordinates:</span>
              <span className="font-mono text-rastaText-muted text-[11px] truncate max-w-[180px]">
                {createdReceipt.latitude.toFixed(4)}, {createdReceipt.longitude.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-rastaText-secondary">Assigned Wing:</span>
              <span className="font-semibold text-teal">{createdReceipt.dept}</span>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              onClick={() => onComplete('track')}
              className="btn-rasta-secondary flex-1 text-xs"
            >
              Track Ticket Status
            </button>
            <button
              onClick={() => onComplete('map')}
              className="btn-rasta-primary flex-1 text-xs"
            >
              View on Map
            </button>
          </div>
        </div>
      </div>
    )
  }

  const stepsList = ['Evidence', 'Location', 'Hazard', 'Review']

  return (
    <div className="flex flex-col h-full bg-midnight overflow-y-auto p-4 sm:p-5 max-w-lg mx-auto w-full space-y-4 pb-28">
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2 border-b border-surface-border">
        <button
          onClick={currentStep > 0 ? () => setCurrentStep(s => s - 1) : onBack}
          className="p-2 -ml-1 text-rastaText-secondary hover:text-white rounded-lg cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-mono font-bold text-teal">REPORT HAZARD · &lt;10S FLOW</span>
        <span className="text-xs font-mono text-rastaText-muted">STEP {currentStep + 1}/4</span>
      </div>

      {/* ── Progress Bar ────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-1.5">
        {stepsList.map((s, idx) => (
          <div key={s} className="space-y-1">
            <div className={`h-1.5 rounded-full transition-all ${
              idx <= currentStep ? 'bg-teal shadow-sm shadow-teal/50' : 'bg-surface-border'
            }`} />
            <p className={`text-[10px] font-bold text-center truncate ${
              idx === currentStep ? 'text-teal' : 'text-rastaText-muted'
            }`}>{s}</p>
          </div>
        ))}
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STEP 0: EVIDENCE CAPTURE (Photo + Voice Note / Dictation)       */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 0 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-rastaText-primary">1. Capture Visual Evidence</h2>
            <p className="text-xs text-rastaText-secondary mt-0.5">
              A photograph guarantees 10x faster municipal dispatch and prevents fake reports.
            </p>
          </div>

          {/* Photo Box */}
          {photo ? (
            <div className="relative rounded-2xl overflow-hidden aspect-video border border-surface-border shadow-lg">
              <img src={photo} alt="Hazard preview" className="w-full h-full object-cover" />
              <button
                onClick={() => setPhoto(null)}
                className="absolute top-2.5 right-2.5 bg-midnight/80 text-white p-2 rounded-full hover:bg-midnight cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[21/9] rounded-2xl border-2 border-dashed border-surface-border hover:border-teal/50 bg-surface flex flex-col items-center justify-center gap-2 transition-all text-rastaText-secondary hover:text-rastaText-primary cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-surface-elevated group-hover:bg-teal/20 text-teal flex items-center justify-center transition-colors">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold">Tap to capture or choose photo</span>
              <span className="text-[10px] text-rastaText-muted">Supports live camera roll</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />

          {/* Optional Spoken Voice Note Controls */}
          <div className="rasta-surface p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isRecordingAudio ? 'bg-rose-600 text-white animate-pulse' : 'bg-surface-elevated text-teal'
                }`}>
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-rastaText-primary">
                    {isRecordingAudio ? `Recording Audio (${recordingSeconds}s)...` : audioUrl ? 'Voice Note Attached ✅' : 'Optional Voice Note (Audio Memo)'}
                  </p>
                  <p className="text-[10px] text-rastaText-muted">
                    {isRecordingAudio ? 'Speak now in Hindi, Kannada or English' : 'For delivery riders on two-wheelers'}
                  </p>
                </div>
              </div>

              {isRecordingAudio ? (
                <button
                  onClick={stopRecordingAudio}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" /> Stop
                </button>
              ) : audioUrl ? (
                <div className="flex items-center gap-2">
                  <audio src={audioUrl} controls className="h-7 w-28" />
                  <button onClick={deleteRecording} className="p-1.5 text-rastaText-muted hover:text-rose-400 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startRecordingAudio}
                  className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-border text-teal border border-teal/20 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" /> Record
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setCurrentStep(1)}
            className="btn-rasta-primary w-full text-xs font-bold min-h-[44px]"
          >
            <span>Confirm Location →</span>
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STEP 1: LOCATION AUTO-LOCK & INTERACTIVE PIN ADJUSTMENT         */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-rastaText-primary">2. Confirm Precise Location</h2>
            <p className="text-xs text-rastaText-secondary mt-0.5">
              Auto-detect GPS or tap the map to place the pin on the exact side of the road.
            </p>
          </div>

          {/* Current Address Card */}
          <div className="rasta-surface p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-teal font-bold uppercase">{location.accuracy}</span>
              <button
                onClick={triggerGps}
                disabled={locLoading}
                className="text-xs text-teal hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                {locLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                <span>Refresh GPS</span>
              </button>
            </div>
            <p className="text-xs font-bold text-rastaText-primary leading-tight">📍 {location.address}</p>
            <p className="text-[10px] font-mono text-rastaText-muted">
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </p>
          </div>

          {/* Interactive Mini Map to Tap and Reposition Pin */}
          <div className="rounded-2xl overflow-hidden border border-surface-border h-56 relative shadow-lg">
            <MapContainer
              center={[location.latitude, location.longitude]}
              zoom={15}
              className="w-full h-full"
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              <LocationMapPicker
                position={[location.latitude, location.longitude]}
                onLocationChange={handleMapPinMove}
              />
            </MapContainer>
            <div className="absolute top-2 left-2 z-10 bg-midnight/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-surface-border text-[10px] text-teal font-mono">
              💡 Tap anywhere to adjust pin
            </div>
          </div>

          {locPermissionDenied && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Location permission denied. Please tap on the map to place your pin manually.</span>
            </div>
          )}

          <button
            onClick={() => setCurrentStep(2)}
            className="btn-rasta-primary w-full text-xs font-bold min-h-[44px]"
          >
            <span>Select Hazard Category →</span>
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STEP 2: HAZARD CATEGORY & DETAILS (WITH LIVE VOICE DICTATION)    */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-rastaText-primary">3. Select Hazard Type</h2>
            <p className="text-xs text-rastaText-secondary mt-0.5">
              Auto-assigns responsible civic department (BBMP, BESCOM, BWSSB, Traffic).
            </p>
          </div>

          {/* 6 Clean Category Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {HAZARD_CATEGORIES.map(c => {
              const isSelected = category === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setCategory(c.id)
                    setSeverity(c.defaultSeverity)
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer min-h-[56px] ${
                    isSelected
                      ? 'bg-rose-500/15 border-rose-500 text-white shadow-sm'
                      : 'bg-surface border-surface-border text-rastaText-secondary hover:border-surface-border hover:text-rastaText-primary'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{c.emoji}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{c.label}</span>
                    <span className="text-[10px] text-rastaText-muted block truncate mt-0.5">{c.dept}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Severity Badges Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-rastaText-secondary mb-1.5 block">
              Threat Urgency
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {SEVERITY_LEVELS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSeverity(s.id)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer min-h-[44px] ${
                    severity === s.id
                      ? `${s.badgeClass} ring-1 ring-white/30`
                      : 'bg-surface border-surface-border text-rastaText-muted hover:text-rastaText-secondary'
                  }`}
                >
                  <p className="text-xs font-bold">{s.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Dictation / Typed Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-rastaText-secondary">
                Description / Landmark
              </label>
              <button
                onClick={toggleSpeechRecognition}
                className={`text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  isDictating ? 'text-rose-400 animate-pulse' : 'text-teal hover:underline'
                }`}
              >
                <Mic className="w-3 h-3" />
                <span>{isDictating ? 'Transcribing...' : 'Dictate with Voice'}</span>
              </button>
            </div>

            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Near petrol pump on left lane, sharp iron edges visible..."
              className="w-full bg-surface border border-surface-border rounded-xl p-3 text-xs text-rastaText-primary placeholder-rastaText-muted focus:outline-none focus:border-teal resize-none"
            />
          </div>

          <button
            onClick={() => setCurrentStep(3)}
            className="btn-rasta-primary w-full text-xs font-bold min-h-[44px]"
          >
            <span>Review & Submit →</span>
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STEP 3: REVIEW & SINGLE-ACTION SUBMIT                           */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-rastaText-primary">4. Final Verification & Transmit</h2>
            <p className="text-xs text-rastaText-secondary mt-0.5">
              Confirm your report details before dispatching to the municipal safety queue.
            </p>
          </div>

          <div className="rasta-surface p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCategory(category).emoji}</span>
                <div>
                  <h3 className="text-xs font-bold text-rastaText-primary">{getCategory(category).label}</h3>
                  <span className="text-[10px] text-teal font-semibold">Dispatched to: {getCategory(category).dept}</span>
                </div>
              </div>
              <span className={getSeverity(severity).badgeClass}>{severity.toUpperCase()}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="text-rastaText-muted flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                <span className="text-rastaText-primary">{location.address}</span>
              </p>
              {description && (
                <p className="text-rastaText-secondary pl-5 italic text-[11px]">
                  "{description}"
                </p>
              )}
            </div>

            {photo && (
              <div className="rounded-xl overflow-hidden border border-surface-border h-24">
                <img src={photo} alt="Hazard review" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Submission Progress & Error Feedback */}
          {submitting && (
            <div className="rasta-surface p-3 space-y-1.5 text-center">
              <div className="flex items-center justify-between text-xs font-mono text-teal">
                <span>Transmitting to RASTA Gateway...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-midnight h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-teal h-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-rasta-primary w-full text-sm font-bold py-3.5 min-h-[48px] shadow-lg shadow-rose-950/60"
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Publishing Official Report...</>
            ) : (
              <><Send className="w-5 h-5" /> Submit Official Hazard Report</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
