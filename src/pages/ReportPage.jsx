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
        background: #0071E3; border: 3px solid #FFFFFF;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
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
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        clearInterval(timerIntervalRef.current)
        setRecordingSeconds(0)
        setIsRecordingAudio(false)
      }

      mediaRecorderRef.current.start()
      setIsRecordingAudio(true)
      setRecordingSeconds(0)

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1)
      }, 1000)
    } catch {
      alert('Microphone permission denied or not available.')
    }
  }

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const deleteRecording = () => {
    setAudioUrl(null)
    setRecordingSeconds(0)
  }

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  // ── Camera Photo Upload ───────────────────────────────────────────────────
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPhoto(reader.result)
      reader.readAsDataURL(file)
    }
  }

  // ── GPS Acquisition ───────────────────────────────────────────────────────
  const triggerGps = () => {
    if (!navigator.geolocation) {
      setLocPermissionDenied(true)
      return
    }

    setLocLoading(true)
    setLocPermissionDenied(false)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const data = await res.json()
          const address = data.display_name?.split(',').slice(0, 3).join(', ') || 'Current GPS Location'
          setLocation({
            latitude: lat,
            longitude: lng,
            address,
            accuracy: `±${Math.round(pos.coords.accuracy || 10)}m accuracy`,
            isManual: false
          })
        } catch {
          setLocation({
            latitude: lat,
            longitude: lng,
            address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            accuracy: 'GPS Locked',
            isManual: false
          })
        }
        setLocLoading(false)
      },
      () => {
        setLocLoading(false)
        setLocPermissionDenied(true)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

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

  // ── Submission Handler ────────────────────────────────────────────────────
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

  // ── Apple-Style Digital Receipt Screen ────────────────────────────────────
  if (createdReceipt) {
    const cat = getCategory(createdReceipt.category)
    const sev = getSeverity(createdReceipt.severity)

    return (
      <div className="flex flex-col h-full bg-[#F5F5F7] p-4 sm:p-6 max-w-lg mx-auto w-full justify-center items-center pb-28 animate-fade-in">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E5EA] shadow-apple-lg w-full space-y-5 text-center">
          <div className="w-16 h-16 bg-[#34C759]/10 text-[#34C759] rounded-2xl flex items-center justify-center mx-auto shadow-apple-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071E3] block">
              Official Hazard Logged
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] mt-1">
              Ticket #{createdReceipt.id}
            </h2>
            <p className="text-xs text-[#6E6E73] mt-1.5 leading-relaxed">
              Synchronized to Public Safety Map and dispatched to municipal response crew.
            </p>
          </div>

          <div className="bg-[#F5F5F7] p-4 rounded-2xl border border-[#E5E5EA] text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#86868B]">Category:</span>
              <span className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                <span>{cat.emoji}</span> {cat.label}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#86868B]">Threat Rating:</span>
              <span className={sev.badgeClass}>{sev.label}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#86868B]">Coordinates:</span>
              <span className="font-mono text-[#6E6E73] text-[11px] truncate max-w-[180px]">
                {createdReceipt.latitude.toFixed(4)}, {createdReceipt.longitude.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#86868B]">Assigned Wing:</span>
              <span className="font-semibold text-[#0071E3]">{createdReceipt.dept}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onComplete('track')}
              className="flex-1 py-3 px-4 rounded-xl border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] font-semibold text-xs transition-colors cursor-pointer"
            >
              Track Ticket Status
            </button>
            <button
              onClick={() => onComplete('map')}
              className="flex-1 py-3 px-4 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs shadow-apple transition-colors cursor-pointer"
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
    <div className="flex flex-col h-full bg-[#F5F5F7] overflow-y-auto px-4 py-6 sm:px-6 max-w-lg mx-auto w-full space-y-5 pb-28">
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
        <button
          onClick={currentStep > 0 ? () => setCurrentStep(s => s - 1) : onBack}
          className="p-2 -ml-2 text-[#6E6E73] hover:text-[#1D1D1F] rounded-lg cursor-pointer transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold text-[#1D1D1F]">Report a Road Hazard</span>
        <span className="text-xs font-medium text-[#86868B]">Step {currentStep + 1} of 4</span>
      </div>

      {/* ── Segmented Progress Bar ──────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-1.5">
        {stepsList.map((s, idx) => (
          <div key={s} className="space-y-1">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx <= currentStep ? 'bg-[#0071E3]' : 'bg-[#E5E5EA]'
              }`}
            />
            <p
              className={`text-[10px] font-medium text-center truncate ${
                idx === currentStep ? 'text-[#0071E3] font-semibold' : 'text-[#86868B]'
              }`}
            >
              {s}
            </p>
          </div>
        ))}
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STEP 0: EVIDENCE CAPTURE (Photo + Voice Note)                   */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 0 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="text-base font-semibold text-[#1D1D1F]">1. Capture Visual Evidence</h2>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              A photograph guarantees rapid municipal dispatch and authenticates your report.
            </p>
          </div>

          {/* Photo Dropzone Card */}
          {photo ? (
            <div className="relative rounded-2xl overflow-hidden aspect-video border border-[#E5E5EA] shadow-apple-sm">
              <img src={photo} alt="Hazard preview" className="w-full h-full object-cover" />
              <button
                onClick={() => setPhoto(null)}
                className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full cursor-pointer transition-all"
                aria-label="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[21/9] rounded-2xl border-2 border-dashed border-[#E5E5EA] hover:border-[#0071E3] bg-white flex flex-col items-center justify-center gap-2 transition-all text-[#6E6E73] hover:text-[#1D1D1F] cursor-pointer group shadow-apple-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-[#0071E3]/10 group-hover:bg-[#0071E3]/15 text-[#0071E3] flex items-center justify-center transition-colors">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-[#1D1D1F]">Tap to capture or choose photo</span>
              <span className="text-[10px] text-[#86868B]">Camera or device gallery</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />

          {/* Optional Voice Note Memo */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5E5EA] shadow-apple-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isRecordingAudio ? 'bg-[#FF3B30] text-white animate-pulse' : 'bg-[#F5F5F7] text-[#0071E3]'
                  }`}
                >
                  <Mic className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1D1D1F]">
                    {isRecordingAudio ? `Recording (${recordingSeconds}s)...` : audioUrl ? 'Voice Note Attached' : 'Voice Memo (Optional)'}
                  </p>
                  <p className="text-[10px] text-[#86868B]">
                    {isRecordingAudio ? 'Speak now in Hindi, Kannada or English' : 'Hands-free voice note for fast description'}
                  </p>
                </div>
              </div>

              {isRecordingAudio ? (
                <button
                  onClick={stopRecordingAudio}
                  className="px-3 py-1.5 rounded-xl bg-[#FF3B30] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" /> Stop
                </button>
              ) : audioUrl ? (
                <div className="flex items-center gap-2">
                  <audio src={audioUrl} controls className="h-7 w-28" />
                  <button onClick={deleteRecording} className="p-1.5 text-[#86868B] hover:text-[#FF3B30] cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startRecordingAudio}
                  className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#0071E3] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Mic className="w-3.5 h-3.5" /> Record
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setCurrentStep(1)}
            className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold py-3.5 rounded-xl shadow-apple transition-colors cursor-pointer min-h-[44px]"
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
            <h2 className="text-base font-semibold text-[#1D1D1F]">2. Confirm Precise Location</h2>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Auto-detect GPS or tap the map to place the pin on the exact side of the road.
            </p>
          </div>

          {/* Current Address Card */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5E5EA] shadow-apple-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#0071E3] uppercase">{location.accuracy}</span>
              <button
                onClick={triggerGps}
                disabled={locLoading}
                className="text-xs text-[#0071E3] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                {locLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                <span>Refresh GPS</span>
              </button>
            </div>
            <p className="text-xs font-semibold text-[#1D1D1F] leading-tight">📍 {location.address}</p>
            <p className="text-[10px] font-mono text-[#86868B]">
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </p>
          </div>

          {/* Interactive Mini Map to Tap and Reposition Pin */}
          <div className="rounded-2xl overflow-hidden border border-[#E5E5EA] h-56 relative shadow-apple-sm">
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
            <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#E5E5EA] text-[10px] text-[#1D1D1F] font-medium shadow-apple-sm">
              💡 Tap anywhere to adjust pin
            </div>
          </div>

          {locPermissionDenied && (
            <div className="p-3 rounded-xl bg-[#FFF4E5] border border-[#FF9500]/30 text-[#C96E00] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Location permission unavailable. Tap the map to set location manually.</span>
            </div>
          )}

          <button
            onClick={() => setCurrentStep(2)}
            className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold py-3.5 rounded-xl shadow-apple transition-colors cursor-pointer min-h-[44px]"
          >
            <span>Select Hazard Category →</span>
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STEP 2: HAZARD CATEGORY & DETAILS (WITH VOICE DICTATION)         */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="text-base font-semibold text-[#1D1D1F]">3. Select Hazard Type</h2>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Routes directly to the responsible municipal department.
            </p>
          </div>

          {/* 6 Category Tiles */}
          <div className="grid grid-cols-2 gap-2.5">
            {HAZARD_CATEGORIES.map(c => {
              const isSelected = category === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setCategory(c.id)
                    setSeverity(c.defaultSeverity)
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-2.5 cursor-pointer min-h-[58px] ${
                    isSelected
                      ? 'bg-[#0071E3]/5 border-[#0071E3] ring-2 ring-[#0071E3]/20 shadow-apple-sm'
                      : 'bg-white border-[#E5E5EA] text-[#6E6E73] hover:border-[#D2D2D7] shadow-apple-sm'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{c.emoji}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-[#1D1D1F] block truncate">{c.label}</span>
                    <span className="text-[10px] text-[#86868B] block truncate mt-0.5">{c.dept}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Threat Urgency */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] mb-1.5 block">
              Threat Urgency
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {SEVERITY_LEVELS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSeverity(s.id)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer min-h-[44px] ${
                    severity === s.id
                      ? `${s.badgeClass} ring-2 ring-black/10 font-bold`
                      : 'bg-white border-[#E5E5EA] text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  <p className="text-xs font-semibold">{s.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Dictation / Typed Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73]">
                Description / Landmark
              </label>
              <button
                onClick={toggleSpeechRecognition}
                className={`text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  isDictating ? 'text-[#FF3B30] animate-pulse' : 'text-[#0071E3] hover:underline'
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
              className="w-full bg-white border border-[#E5E5EA] rounded-xl p-3 text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#0071E3] resize-none shadow-apple-sm transition-colors"
            />
          </div>

          <button
            onClick={() => setCurrentStep(3)}
            className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold py-3.5 rounded-xl shadow-apple transition-colors cursor-pointer min-h-[44px]"
          >
            <span>Review & Submit →</span>
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STEP 3: REVIEW & SUBMIT                                         */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h2 className="text-base font-semibold text-[#1D1D1F]">4. Final Verification & Submit</h2>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Confirm details before dispatching to the municipal safety queue.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E5EA] shadow-apple-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5EA]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCategory(category).emoji}</span>
                <div>
                  <h3 className="text-xs font-semibold text-[#1D1D1F]">{getCategory(category).label}</h3>
                  <span className="text-[10px] text-[#0071E3] font-medium">Wing: {getCategory(category).dept}</span>
                </div>
              </div>
              <span className={getSeverity(severity).badgeClass}>{severity.toUpperCase()}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="text-[#6E6E73] flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0071E3] mt-0.5 flex-shrink-0" />
                <span className="text-[#1D1D1F] font-medium">{location.address}</span>
              </p>
              {description && (
                <p className="text-[#6E6E73] pl-5 italic text-[11px]">
                  "{description}"
                </p>
              )}
            </div>

            {photo && (
              <div className="rounded-xl overflow-hidden border border-[#E5E5EA] h-24">
                <img src={photo} alt="Hazard review" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Submission Progress */}
          {submitting && (
            <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5EA] space-y-1.5 text-center shadow-apple-sm">
              <div className="flex items-center justify-between text-xs font-medium text-[#0071E3]">
                <span>Transmitting to RASTA Gateway...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#F5F5F7] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#0071E3] h-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-sm font-semibold py-3.5 rounded-xl shadow-apple transition-colors cursor-pointer min-h-[48px] flex items-center justify-center gap-2"
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
