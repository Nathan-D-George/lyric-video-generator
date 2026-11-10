import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { type LyricSegment, type VideoSettings } from './features/timeline/types';

// Cookie keys and expiration settings
const PROJECT_COOKIE_KEY = 'kinetic_lyric_project_data';
const CONSENT_COOKIE_KEY = 'kinetic_cookie_consent_accepted';
const COOKIE_EXPIRATION_DAYS = 30;

// Internal storage model stored inside the cookie
interface LocalVideoSession {
  hasActiveProject: boolean;
  audioSrcFilename: string | null;
  settings: VideoSettings;
  slides: LyricSegment[];
  updatedAt: number;
}

// --- TIME UTILITIES ---
const formatTimeToMinutes = (timeInSeconds: number): string => {
  if (isNaN(timeInSeconds)) return '00:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const parseMinutesToSeconds = (minutesString: string): number => {
  const parts = minutesString.split(':');
  if (parts.length !== 2) return 0;
  const mins = parseInt(parts[0], 10) || 0;
  const secs = parseInt(parts[1], 10) || 0;
  return mins * 60 + secs;
};

export default function App() {
  console.log("✅✅✅✅✅✅✅✅✅");
  console.log("✅✅✅✅✅✅✅✅✅");
  console.log("✅✅✅✅✅✅✅✅✅");
  console.log("✅✅✅✅✅✅✅✅✅");
  console.log("✅✅✅✅✅✅✅✅✅");
  console.log("✅✅✅✅✅✅✅✅✅");

  // Navigation States
  const [currentView, setCurrentView] = useState<'home' | 'workbench'>('home');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cookie Consent Banner State
  const [hasConsentedCookies, setHasConsentedCookies] = useState<boolean>(true);
  console.log("hasConsentedCookies", hasConsentedCookies);

  // Core Application Workbench States
  const [hasActiveProject, setHasActiveProject] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioFilename, setAudioFilename] = useState<string | null>(null);
  // const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [slides, setSlides] = useState<LyricSegment[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync Mode Tracking Configurations
  const [isSyncModeActive, setIsSyncModeActive] = useState(false);
  const [syncPointerIndex, setSyncPointerIndex] = useState<number>(0);

  // Global Workspace Visual Customizations
  const [settings, setSettings] = useState<VideoSettings>({
    backgroundColor: '#000000',
    textColor: '#ffffff',
    fontSize: 32,
    lineHeight: 1.4,
    xPosition: 50,
    yPosition: 50,
    backgroundImage: null,
  });
  const [isRecording, setIsRecording] = useState(false);

  // Object Hardware Ref Handles
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const selectedSlide = slides.find(s => s.id === activeSlideId) || slides[0];

  // Initialize and check existing cookies on mount
  useEffect(() => {
    // Check cookie consent state
    const consent = Cookies.get(CONSENT_COOKIE_KEY);
    if (!consent) {
      setHasConsentedCookies(false);
    }

    // Check saved project cookie state
    const savedProjectCookie = Cookies.get(PROJECT_COOKIE_KEY);
    // console.log("🚀 ~ App ~ savedProjectCookie:", savedProjectCookie);
    if (savedProjectCookie) {
      try {
        const sessionData: LocalVideoSession = JSON.parse(savedProjectCookie);
        setHasActiveProject(sessionData.hasActiveProject);
        setSlides(sessionData.slides || []);
        setSettings(sessionData.settings || settings);
        setAudioFilename(sessionData.audioSrcFilename || null);
      } catch (err) {
        console.error("Error parsing stored project cookie:", err);
      }
    }
  }, []);

  // Sync Canvas Viewport to Audio Context Frame Cycles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || currentView !== 'workbench') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (settings.backgroundImage && bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
    }

    const slideToRender = slides.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
    if (slideToRender && slideToRender.text) {
      ctx.fillStyle = settings.textColor;
      ctx.font = `${settings.fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lines = slideToRender.text.split('\n');
      const computedLineHeight = settings.fontSize * settings.lineHeight;
      const startY = (settings.yPosition / 100) * canvas.height - ((lines.length - 1) * computedLineHeight) / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, (settings.xPosition / 100) * canvas.width, startY + (index * computedLineHeight));
      });
    }
    saveProjectToCookie();
  }, [currentTime, slides, settings, currentView]);

  // Image preloader execution context hook
  useEffect(() => {
    if (settings.backgroundImage) {
      const img = new Image();
      img.src = settings.backgroundImage;
      img.onload = () => { bgImageRef.current = img; };
      saveProjectToCookie();
    }
  }, [settings.backgroundImage]);

  // --- COOKIE DATA PERSISTENCE HANDLERS ---
  const saveProjectToCookie = () => {
    try {
      const sessionData: LocalVideoSession = {
        hasActiveProject: true,
        audioSrcFilename: audioFilename,
        settings,
        slides,
        updatedAt: Date.now()
      };
      Cookies.set(PROJECT_COOKIE_KEY, JSON.stringify(sessionData), { expires: COOKIE_EXPIRATION_DAYS });
      setHasActiveProject(true);
    } catch (err) {
      console.error("Failed to save project data to browser cookies", err);
    }
  };

  const clearProjectSessionAndDiscard = () => {
    if (window.confirm("Are you sure you want to discard this project? All saved video progress in your browser cookies will be erased.")) {
      Cookies.remove(PROJECT_COOKIE_KEY);
      setSlides([]);
      setAudioSrc(null);
      setAudioFilename(null);
      setHasActiveProject(false);
      setCurrentView('home');
    }
  };

  const handleAcceptCookies = () => {
    Cookies.set(CONSENT_COOKIE_KEY, 'true', { expires: COOKIE_EXPIRATION_DAYS });
    setHasConsentedCookies(true);
  };

  // --- BUSINESS LOGIC RULES VERIFICATIONS ---
  const handleStartNewVideo = () => {
    if (hasActiveProject) {
      setErrorMessage("Strict Workspace Limit: You already have an active lyric video project saved in your cookies. You must finish or discard your current project before starting a new one.");
      return;
    }
    setErrorMessage(null);
    const initialSlide = [
      { id: 'slide-1', text: 'Welcome to your new video layout.\nEnter paragraph lyrics.', startTime: 0, endTime: 5 }
    ];
    setSlides(initialSlide);
    setActiveSlideId('slide-1');
    setAudioSrc(null);
    setAudioFilename(null);
    setHasActiveProject(true);
    setCurrentView('workbench');

    // Auto-save initial session state
    const sessionData: LocalVideoSession = {
      hasActiveProject: true,
      audioSrcFilename: null,
      settings,
      slides: initialSlide,
      updatedAt: Date.now()
    };
    Cookies.set(PROJECT_COOKIE_KEY, JSON.stringify(sessionData), { expires: COOKIE_EXPIRATION_DAYS });
  };

  const handleContinueProject = () => {
    if (!hasActiveProject) {
      alert("No active session saved in your browser cookies.");
      return;
    }
    if (slides.length > 0) {
      setActiveSlideId(slides[0].id);
    }
    setCurrentView('workbench');
  };

  // --- SLIDE EDITING OPERATIONS MATRIX ---
  const updateSlideField = (id: string, field: keyof LyricSegment, value: any) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addNewSlide = () => {
    const newId = `slide-${Date.now()}`;
    const lastSlide = slides[slides.length - 1];
    const nextStart = lastSlide ? lastSlide.endTime + 0.5 : 0;
    const newSlide: LyricSegment = { id: newId, text: 'New Lyric Line Block.', startTime: nextStart, endTime: nextStart + 4 };
    setSlides([...slides, newSlide]);
    setActiveSlideId(newId);
    saveProjectToCookie();
  };

  const duplicateSlide = (slide: LyricSegment, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = `slide-dup-${Date.now()}`;
    setSlides([...slides, { ...slide, id: newId, startTime: slide.endTime + 0.5, endTime: slide.endTime + 4.5 }]);
    setActiveSlideId(newId);
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDrop = (index: number) => {
    if (draggedIndex === null) return;
    const updated = [...slides];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setSlides(updated);
    setDraggedIndex(null);
  };

  // --- LIVE SYNC CONTROLLER LAYER ---
  const toggleLiveSyncMode = () => {
    if (!audioRef.current || !audioSrc) return;
    if (!isSyncModeActive) {
      setIsSyncModeActive(true);
      setSyncPointerIndex(0);
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      // setIsPlaying(true);
      if (slides.length > 0) {
        updateSlideField(slides[0].id, 'startTime', 0);
        setActiveSlideId(slides[0].id);
      }
    } else {
      setIsSyncModeActive(false);
      audioRef.current.pause();
      // setIsPlaying(false);
      saveProjectToCookie();
    }
  };

  const triggerNextSyncMarker = () => {
    if (!audioRef.current) return;
    const markTime = audioRef.current.currentTime;
    const currentSlide = slides[syncPointerIndex];
    if (currentSlide) updateSlideField(currentSlide.id, 'endTime', markTime);

    const nextIndex = syncPointerIndex + 1;
    if (nextIndex < slides.length) {
      setSyncPointerIndex(nextIndex);
      updateSlideField(slides[nextIndex].id, 'startTime', markTime + 0.05);
      setActiveSlideId(slides[nextIndex].id);
    } else {
      setIsSyncModeActive(false);
      audioRef.current.pause();
      // setIsPlaying(false);
      saveProjectToCookie();
      alert('Live performance sequence synchronization recorded.');
    }
  };

  // --- MP4 RECORDING ENGINE PIPELINE ---
  const runMediaExportPipeline = async () => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio || !audioSrc) return;

    setIsRecording(true);
    recordedChunksRef.current = [];
    const videoStream = canvas.captureStream(30);
    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audio);
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);
    source.connect(audioContext.destination);

    const recorder = new MediaRecorder(new MediaStream([...videoStream.getVideoTracks(), ...destination.stream.getAudioTracks()]), { mimeType: 'video/webm;codecs=vp9,opus' });
    recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'lyric-video.mp4';
      link.click();
      setIsRecording(false);
    };

    mediaRecorderRef.current = recorder;
    audio.currentTime = 0;
    recorder.start();
    audio.play();

    // setIsPlaying(true);

    audio.onended = () => {
      recorder.stop();
      // setIsPlaying(false);
    };
  };

  // ==========================================
  //     RESTRUCTURED RENDERING SUB-FUNCTIONS
  // ==========================================

  const renderGlobalHeader = () => {
    return (
      <header className="h-16 border-b border-gray-800 bg-gray-900/60 backdrop-blur px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('home')}>
          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-md shadow-blue-500/50"></div>
          <span className="text-sm font-bold tracking-widest text-gray-200 uppercase">Kinetic Lyric Studio</span>
        </div>

        {currentView === 'workbench' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleLiveSyncMode}
              disabled={!audioSrc}
              className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wide transition uppercase ${isSyncModeActive ? 'bg-amber-600 text-white animate-pulse' : 'bg-gray-800 text-amber-400 border border-amber-500/30 hover:bg-gray-700 disabled:opacity-40'}`}
            >
              {isSyncModeActive ? 'Stop Sync' : 'Live Sync Performance'}
            </button>
            <button
              onClick={runMediaExportPipeline}
              disabled={isRecording || !audioSrc}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-xs font-bold tracking-wide rounded-md transition uppercase text-white"
            >
              {isRecording ? 'Exporting...' : 'Export Video'}
            </button>
            <button
              onClick={() => setCurrentView('home')}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold tracking-wide rounded-md transition uppercase"
            >
              Home
            </button>
          </div>
        )}
      </header>
    );
  };

  const renderLeftPanel = () => {
    return (
      <div className="w-1/4 min-w-[280px] max-w-sm bg-gray-900/70 border-r border-gray-800 flex flex-col h-full">
        <div className="p-4 border-b border-gray-800/80 flex items-center justify-between bg-gray-900">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Slide Sequence</span>
          <button onClick={addNewSlide} className="p-1 px-2.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-500/30 text-xs font-bold rounded transition">+ Add</button>
        </div>

        {/* Slides Track List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {slides.map((slide, idx) => {
            const isCurrentPlayingSlide = currentTime >= slide.startTime && currentTime <= slide.endTime;
            return (
              <div key={slide.id} draggable onDragStart={() => handleDragStart(idx)} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(idx)} onClick={() => setActiveSlideId(slide.id)} className={`group relative p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between h-24 select-none ${slide.id === activeSlideId ? 'bg-blue-950/40 border-blue-500 shadow' : 'bg-gray-950/60 border-gray-800/80 hover:border-gray-700'}`}>
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                  <span className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 font-bold">Slide {idx + 1}</span>
                  <span className={isCurrentPlayingSlide ? 'text-green-400 font-bold' : ''}>{formatTimeToMinutes(slide.startTime)} - {formatTimeToMinutes(slide.endTime)}</span>
                </div>
                <p className="text-xs text-gray-300 font-medium truncate mt-1 white-space-pre-wrap">{slide.text || <span className="italic text-gray-600">Empty Content</span>}</p>
                <div className="absolute right-2 bottom-2 hidden group-hover:flex space-x-1">
                  <button onClick={e => duplicateSlide(slide, e)} className="p-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 text-[10px] px-1.5 border border-gray-700">Duplicate</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Local Storage & Destruction Actions */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/90 flex flex-col space-y-2">
          <button onClick={saveProjectToCookie} className="w-full py-1.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-[11px] font-bold uppercase tracking-wider text-gray-300 rounded transition shadow-inner">💾 Save to Cookie</button>
          <button onClick={clearProjectSessionAndDiscard} className="w-full py-1.5 bg-red-950/40 border border-red-900/30 hover:bg-red-900/30 text-[11px] font-bold uppercase tracking-wider text-red-400 rounded transition">🗑️ Discard Video Session</button>
        </div>
      </div>
    );
  };

  const renderRightPanel = () => {
    return (
      <div className="flex-1 bg-gray-950 flex flex-col h-full overflow-y-auto px-6 py-4 space-y-6">

        {/* Bottom Local Binary Media Asset Ingestion Drawer */}
        <div className="w-full max-w-4xl mx-auto bg-gray-900/40 border border-gray-900 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Load Local Audio Track</label>
            <input type="file" accept="audio/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setAudioSrc(URL.createObjectURL(file));
                setAudioFilename(file.name);
                saveProjectToCookie();
              }
            }} className="w-full text-xs text-gray-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-gray-800 file:text-gray-300 hover:file:bg-gray-700 cursor-pointer" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Canvas Frame Background</label>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSettings({ ...settings, backgroundImage: URL.createObjectURL(file) });
                saveProjectToCookie();
              }
            }} className="w-full text-xs text-gray-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-gray-800 file:text-gray-300 hover:file:bg-gray-700 cursor-pointer" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Font Color</label>
              <input type="color" value={settings.textColor} onChange={e => setSettings({ ...settings, textColor: e.target.value })} className="w-full h-7 rounded bg-transparent border-0 cursor-pointer" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Canvas Fill</label>
              <input type="color" value={settings.backgroundColor} onChange={e => setSettings({ ...settings, backgroundColor: e.target.value })} className="w-full h-7 rounded bg-transparent border-0 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Canvas Display Viewport Monitor Container Block */}
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center bg-gray-900 border border-gray-800 rounded-xl p-4 relative shadow-inner">
          {isSyncModeActive && (
            <div className="absolute top-6 left-6 right-6 bg-amber-600/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg flex items-center justify-between z-20 shadow-lg border border-amber-400/30">
              <div className="text-xs">
                <p className="font-bold uppercase tracking-wider">Sync Control Layer Tracker Active</p>
                <p className="text-amber-200 mt-0.5 font-medium font-mono">Target Synchronizer Array Index: Slide {syncPointerIndex + 1}</p>
              </div>
              <button onClick={triggerNextSyncMarker} className="px-6 py-2 bg-white text-amber-950 font-bold uppercase tracking-widest text-xs rounded hover:bg-amber-50 active:scale-95 shadow transition">👉 TRIGGER NEXT SLIDE MARKER</button>
            </div>
          )}

          <canvas ref={canvasRef} width={840} height={420} className="w-full h-auto bg-black rounded-lg border border-gray-950 aspect-video shadow-2xl" />

          <div className="w-full mt-4 bg-gray-950 p-2 rounded-lg border border-gray-800 flex items-center space-x-4">
            {audioSrc ? (
              <audio ref={audioRef} src={audioSrc} onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)} className="flex-1 bg-transparent accent-blue-500" controls />
            ) : (
              <div className="flex-1 text-center py-2 text-xs font-medium text-gray-500 font-mono">No active audio track loaded. Upload an MP3/WAV file below.</div>
            )}
            <span className="text-xs font-mono px-3 py-1 bg-gray-900 border border-gray-800 text-blue-400 rounded">Track Index: {formatTimeToMinutes(currentTime)}</span>
          </div>
        </div>

        {/* Dynamic Typography and Positioning Inspector Matrices */}
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {selectedSlide && (
            <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 shadow">
              <textarea value={selectedSlide.text} onChange={e => updateSlideField(selectedSlide.id, 'text', e.target.value)} placeholder="Type multi-line lyric text here..." className="w-full h-24 bg-gray-950 text-white border border-gray-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition shadow-inner resize-none" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Time (mm:ss)</label>
                  <input type="text" value={formatTimeToMinutes(selectedSlide.startTime)} onChange={e => updateSlideField(selectedSlide.id, 'startTime', parseMinutesToSeconds(e.target.value))} className="w-full bg-gray-950 text-white font-mono text-xs border border-gray-800 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Time (mm:ss)</label>
                  <input type="text" value={formatTimeToMinutes(selectedSlide.endTime)} onChange={e => updateSlideField(selectedSlide.id, 'endTime', parseMinutesToSeconds(e.target.value))} className="w-full bg-gray-950 text-white font-mono text-xs border border-gray-800 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 shadow">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest border-b border-gray-800 pb-2">Layout Formatting</h3>
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1"><span>Font Size</span><span className="text-blue-400 font-mono">{settings.fontSize}px</span></div>
              <input type="range" min="16" max="64" value={settings.fontSize} onChange={e => setSettings({ ...settings, fontSize: parseInt(e.target.value, 10) })} className="w-full accent-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1"><span>Line Height</span><span className="text-blue-400 font-mono">{settings.lineHeight}x</span></div>
              <input type="range" min="1.0" max="2.5" step="0.1" value={settings.lineHeight} onChange={e => setSettings({ ...settings, lineHeight: parseFloat(e.target.value) })} className="w-full accent-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1"><span>Global X Axis</span><span className="text-blue-400 font-mono">{settings.xPosition}%</span></div>
              <input type="range" min="10" max="90" value={settings.xPosition} onChange={e => setSettings({ ...settings, xPosition: parseInt(e.target.value, 10) })} className="w-full accent-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1"><span>Global Y Axis</span><span className="text-blue-400 font-mono">{settings.yPosition}%</span></div>
              <input type="range" min="10" max="90" value={settings.yPosition} onChange={e => setSettings({ ...settings, yPosition: parseInt(e.target.value, 10) })} className="w-full accent-blue-500" />
            </div>
          </div>
        </div>

      </div>
    );
  };

  const renderHomeView = () => {
    return (
      <div className="flex-1 overflow-y-auto flex flex-col justify-center items-center px-4 max-w-4xl mx-auto text-center space-y-8 py-12">
        <div className="space-y-4">
          <span className="text-blue-500 font-bold tracking-widest text-xs uppercase bg-blue-950/50 px-3 py-1 border border-blue-900 rounded-full">No Account Required</span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">Create Lyric Videos in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Record Time</span></h2>
          <p className="text-gray-400 text-md max-w-xl mx-auto font-medium leading-relaxed">A high-precision production canvas workspace linking your audio assets with structural text paragraphs. Progress is saved directly to your browser via cookies.</p>
        </div>

        {/* Feature Matrix Explainer Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left pt-2">
          <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
            <div className="text-blue-400 text-lg font-bold">1. Ingest Media</div>
            <p className="text-xs text-gray-400 leading-relaxed">Upload track stems and map layout styling configurations using granular parameter sliders.</p>
          </div>
          <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
            <div className="text-amber-400 text-lg font-bold">2. Live Trigger Sync</div>
            <p className="text-xs text-gray-400 leading-relaxed">Play your song track and execute sync markers in real-time by performing your keyboard clicks.</p>
          </div>
          <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
            <div className="text-green-400 text-lg font-bold">3. Local MP4 Export</div>
            <p className="text-xs text-gray-400 leading-relaxed">Render video streams in real-time directly inside your browser safely and privately.</p>
          </div>
        </div>

        {/* Error Alert Box for Single Video Constraint */}
        {errorMessage && (
          <div className="w-full p-4 bg-red-950/50 border border-red-900/60 text-red-400 text-xs rounded-xl leading-relaxed font-semibold shadow-inner text-left">
            {errorMessage}
          </div>
        )}

        {/* REPLACED LOGIN OPTIONS: Direct Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
          <button
            onClick={handleStartNewVideo}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider uppercase rounded-lg transition shadow-lg shadow-blue-600/20"
          >
            Start New Video
          </button>
          <button
            onClick={handleContinueProject}
            disabled={!hasActiveProject}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-900 disabled:text-gray-600 border border-emerald-500/30 disabled:border-gray-800 text-white font-bold text-xs tracking-wider uppercase rounded-lg transition disabled:cursor-not-allowed"
          >
            {hasActiveProject ? 'Continue Saved Video' : 'No Active Video Saved'}
          </button>
        </div>
      </div>
    );
  };

  const renderCookieConsentBanner = () => {
    if (hasConsentedCookies) return null;

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-800 p-4 z-50 backdrop-blur-md shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-300 space-y-1 text-center sm:text-left">
            <p className="font-bold text-white">🍪 Cookie Progress Retention Notice</p>
            <p className="text-gray-400">This application uses cookies strictly to remember your active lyric video progress and settings without needing user accounts or logins.</p>
          </div>
          <button
            onClick={handleAcceptCookies}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shrink-0"
          >
            Accept & Continue
          </button>
        </div>
      </div>
    );
  };

  // ==========================================
  //         CLEAN WORKSPACE RETURN
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-blue-500/30">
      {renderGlobalHeader()}

      {currentView === 'home' && renderHomeView()}

      {currentView === 'workbench' && (
        <div className="flex flex-1 overflow-hidden w-full">
          {renderLeftPanel()}
          {renderRightPanel()}
        </div>
      )}

      {renderCookieConsentBanner()}
    </div>
  );
}
