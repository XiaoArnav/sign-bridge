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
        background: #4F46E5; border: 3px solid #FFFFFF;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(79,70,229,0.3);
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

  // ── Digital Receipt Screen ────────────────────────────────────────────────
  if (createdReceipt) {
    const cat = getCategory(createdReceipt.category)
    const sev = getSeverity(createdReceipt.severity)

    return (
      <div className="flex flex-col h-full bg-[#FAF9F6] p-4 sm:p-8 max-w-xl mx-auto w-full justify-center items-center pb-28 animate-fade-in text-[#171717]">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7E5E0] shadow-sm w-full space-y-5 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-[#15803D] border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5] block">
              Official Hazard Logged
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717] mt-1">
              Ticket #{createdReceipt.id}
            </h2>
            <p className="text-xs text-[#626262] mt-1.5 leading-relaxed">
              Synchronized to Public Safety Map and dispatched to municipal triage queue.
            </p>
          </div>

          <div className="bg-[#F3F3F0] p-4 rounded-2xl border border-[#E7E5E0] text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#858585]">Category:</span>
              <span className="font-bold text-[#171717] flex items-center gap-1.5">
                <span>{cat.emoji}</span> {cat.label}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#858585]">Threat Rating:</span>
              <span className={sev.badgeClass}>{sev.label}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#858585]">Coordinates:</span>
              <span className="font-mono text-[#626262] text-[11px] truncate max-w-[180px]">
                {createdReceipt.latitude.toFixed(4)}, {createdReceipt.longitude.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#858585]">Assigned Wing:</span>
              <span className="font-bold text-[#4F46E5]">{createdReceipt.dept}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onComplete('track')}
              className="flex-1 py-3 px-4 rounded-xl border border-[#E7E5E0] bg-white hover:bg-[#F3F3F0] text-[#171717] font-semibold text-xs transition-colors cursor-pointer"
            >
              Track Ticket Status
            </button>
            <button
              onClick={() => onComplete('map')}
              className="flex-1 py-3 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
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
    <div className="flex flex-col h-full bg-[#FAF9F6] overflow-y-auto px-4 py-8 sm:px-8 max-w-2xl sm:max-w-3xl mx-auto w-full space-y-6 pb-28 text-[#171717]">
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E0]">
        <button
          onClick={currentStep > 0 ? () => setCurrentStep(s => s - 1) : onBack}
          className="p-2 -ml-2 text-[#626262] hover:text-[#171717] rounded-xl cursor-pointer transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-[#171717]">Report a Road Hazard</span>
        <span className="text-xs font-medium text-[#858585]">Step {currentStep + 1} of 4</span>
      </div>

      {/* ── Segmented Progress Bar ──────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2">
        {stepsList.map((s, idx) => (
          <div key={s} className="space-y-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx <= currentStep ? 'bg-[#4F46E5]' : 'bg-[#E7E5E0]'
              }`}
            />
            <p
              className={`text-[10px] font-semibold text-center truncate ${
                idx === currentStep ? 'text-[#4F46E5]' : 'text-[#858585]'
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
        <div className="space-y-5 animate-fade-in">
          <div>
            <h2 className="text-lg font-bold text-[#171717]">1. Capture Visual Evidence</h2>
            <p className="text-xs text-[#626262] mt-1 leading-relaxed">
              A photograph guarantees rapid municipal dispatch and authenticates your hazard report.
            </p>
          </div>

          {/* Photo Dropzone Card */}
          {photo ? (
            <div className="relative rounded-2xl overflow-hidden aspect-video border border-[#E7E5E0] shadow-sm">
              <img src={photo} alt="Hazard preview" className="w-full h-full object-cover" />
              <button
                onClick={() => setPhoto(null)}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full cursor-pointer transition-all"
                aria-label="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[21/9] rounded-2xl border-2 border-dashed border-[#E7E5E0] hover:border-[#4F46E5] bg-white flex flex-col items-center justify-center gap-2 transition-all text-[#626262] hover:text-[#171717] cursor-pointer group shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] group-hover:bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center transition-colors border border-[#E0E7FF]">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#171717]">Tap to capture or choose photo</span>
              <span className="text-[10px] text-[#858585]">Camera or device gallery</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />

          {/* Optional Voice Note Memo */}
          <div className="bg-white p-4.5 rounded-2xl border border-[#E7E5E0] shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isRecordingAudio ? 'bg-rose-500 text-white animate-pulse' : 'bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#171717]">
                    {isRecordingAudio ? `Recording (${recordingSeconds}s)...` : audioUrl ? 'Voice Note Attached' : 'Voice Memo (Optional)'}
                  </p>
                  <p className="text-[10px] text-[#858585]">
                    {isRecordingAudio ? 'Speak now in Hindi, Kannada or English' : 'Hands-free voice note for quick description'}
                  </p>
                </div>
              </div>

              {isRecordingAudio ? (
                <button
                  onClick={stopRecordingAudio}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" /> Stop
                </button>
              ) : audioUrl ? (
                <div className="flex items-center gap-2">
                  <audio src={audioUrl} controls className="h-7 w-28" />
                  <button onClick={deleteRecording} className="p-1.5 text-[#858585] hover:text-[#C62828] cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startRecordingAudio}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F3F3F0] hover:bg-[#E7E5E0] text-[#171717] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-[#E7E5E0]"
                >
                  <Mic className="w-3.5 h-3.5 text-[#4F46E5]" /> Record
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setCurrentStep(1)}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold py-3.5 rounded-xl shadow-sm transition-colors cursor-pointer min-h-[44px]"
          >
            <span>Confirm Location →</span>
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STEP 1: LOCATION AUTO-LOCK & INTERACTIVE PIN ADJUSTMENT         */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h2 className="text-lg font-bold text-[#171717]">2. Confirm Precise Location</h2>
            <p className="text-xs text-[#626262] mt-1 leading-relaxed">
              Auto-detect GPS or tap the map to place the pin on the exact side of the road.
            </p>
          </div>

          {/* Current Address Card */}
          <div className="bg-white p-4.5 rounded-2xl border border-[#E7E5E0] shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#4F46E5] uppercase">{location.accuracy}</span>
              <button
                onClick={triggerGps}
                disabled={locLoading}
                className="text-xs text-[#4F46E5] hover:underline flex items-center gap-1.5 cursor-pointer font-semibold"
              >
                {locLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                <span>Refresh GPS</span>
              </button>
            </div>
            <p className="text-xs font-bold text-[#171717] leading-tight">📍 {location.address}</p>
            <p className="text-[10px] font-mono text-[#858585]">
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </p>
          </div>

          {/* Interactive Mini Map to Tap and Reposition Pin */}
          <div className="rounded-2xl overflow-hidden border border-[#E7E5E0] h-60 relative shadow-sm">
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
            <div className="absolute top-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E7E5E0] text-[10px] text-[#171717] font-semibold shadow-sm">
              💡 Tap anywhere to adjust pin
            </div>
          </div>

          {locPermissionDenied && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[#B7791F] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Location permission unavailable. Tap the map to set location manually.</span>
            </div>
          )}

          <button
            onClick={() => setCurrentStep(2)}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold py-3.5 rounded-xl shadow-sm transition-colors cursor-pointer min-h-[44px]"
          >
            <span>Select Hazard Category →</span>
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STEP 2: HAZARD CATEGORY & DETAILS (WITH VOICE DICTATION)         */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h2 className="text-lg font-bold text-[#171717]">3. Select Hazard Type</h2>
            <p className="text-xs text-[#626262] mt-1 leading-relaxed">
              Routes directly to the responsible municipal department.
            </p>
          </div>

          {/* 6 Category Tiles */}
          <div className="grid grid-cols-2 gap-3">
            {HAZARD_CATEGORIES.map(c => {
              const isSelected = category === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setCategory(c.id)
                    setSeverity(c.defaultSeverity)
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer min-h-[64px] ${
                    isSelected
                      ? 'bg-[#EEF2FF] border-[#4F46E5] ring-2 ring-[#4F46E5]/20 shadow-sm'
                      : 'bg-white border-[#E7E5E0] text-[#626262] hover:border-[#D1CFCA] shadow-sm'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{c.emoji}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#171717] block truncate">{c.label}</span>
                    <span className="text-[10px] text-[#858585] block truncate mt-0.5">{c.dept}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Threat Urgency */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#858585] mb-2 block">
              Threat Urgency
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SEVERITY_LEVELS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSeverity(s.id)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer min-h-[44px] ${
                    severity === s.id
                      ? `${s.badgeClass} ring-2 ring-[#171717]/10 font-bold`
                      : 'bg-white border-[#E7E5E0] text-[#858585] hover:text-[#171717]'
                  }`}
                >
                  <p className="text-xs font-semibold">{s.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Dictation / Typed Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#858585]">
                Description / Landmark
              </label>
              <button
                onClick={toggleSpeechRecognition}
                className={`text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isDictating ? 'text-rose-600 animate-pulse' : 'text-[#4F46E5] hover:underline'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isDictating ? 'Transcribing...' : 'Dictate with Voice'}</span>
              </button>
            </div>

            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Near petrol pump on left lane, exposed wire sparking..."
              className="w-full bg-white border border-[#E7E5E0] rounded-xl p-3.5 text-xs text-[#171717] placeholder-[#858585] focus:outline-none focus:border-[#4F46E5] resize-none shadow-sm transition-colors"
            />
          </div>

          <button
            onClick={() => setCurrentStep(3)}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold py-3.5 rounded-xl shadow-sm transition-colors cursor-pointer min-h-[44px]"
          >
            <span>Review & Submit →</span>
          </button>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* STEP 3: REVIEW & SUBMIT                                         */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <h2 className="text-lg font-bold text-[#171717]">4. Final Verification & Submit</h2>
            <p className="text-xs text-[#626262] mt-1 leading-relaxed">
              Confirm details before dispatching to the municipal safety queue.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E7E5E0] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E0]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategory(category).emoji}</span>
                <div>
                  <h3 className="text-xs font-bold text-[#171717]">{getCategory(category).label}</h3>
                  <span className="text-[10px] text-[#4F46E5] font-semibold">Wing: {getCategory(category).dept}</span>
                </div>
              </div>
              <span className={getSeverity(severity).badgeClass}>{severity.toUpperCase()}</span>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[#626262] flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#4F46E5] mt-0.5 flex-shrink-0" />
                <span className="text-[#171717] font-semibold">{location.address}</span>
              </p>
              {description && (
                <p className="text-[#626262] pl-5 italic text-[11px]">
                  "{description}"
                </p>
              )}
            </div>

            {photo && (
              <div className="rounded-xl overflow-hidden border border-[#E7E5E0] h-28">
                <img src={photo} alt="Hazard review" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Submission Progress */}
          {submitting && (
            <div className="bg-white p-4 rounded-2xl border border-[#E7E5E0] space-y-2 text-center shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-[#4F46E5]">
                <span>Transmitting to RASTA Gateway...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#F3F3F0] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#4F46E5] h-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-bold py-3.5 rounded-xl shadow-sm transition-colors cursor-pointer min-h-[48px] flex items-center justify-center gap-2"
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
