import React, { useState, useRef, useEffect } from 'react';
import { type LyricSegment, type VideoSettings } from './types';

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

export const LyricVideoEditor: React.FC = () => {
  console.log("🎹🎹🎹🎹🎹🎹🎹");
  console.log("🎹🎹🎹🎹🎹🎹🎹");
  console.log("🎹🎹🎹🎹🎹🎹🎹");
  console.log("🎹🎹🎹🎹🎹🎹🎹");
  console.log("🎹🎹🎹🎹🎹🎹🎹");
  console.log("🎹🎹🎹🎹🎹🎹🎹");
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  // const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Slides contain text and timing markers only
  const [slides, setSlides] = useState<LyricSegment[]>([
    { id: 'slide-1', text: 'Welcome to your new video.\nEdit this paragraph text easily.', startTime: 0, endTime: 5 }
  ]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>('slide-1');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [isSyncModeActive, setIsSyncModeActive] = useState(false);
  const [syncPointerIndex, setSyncPointerIndex] = useState<number>(0);

  // Global Typography and Coordinate Configurations Matrix
  const [settings, setSettings] = useState<VideoSettings>({
    backgroundColor: '#000000',
    textColor: '#ffffff',
    fontSize: 32,
    lineHeight: 1.4, // Default multiplier spacing factor
    xPosition: 50,   // Master default horizontal alignment axis
    yPosition: 50,   // Master default vertical alignment axis
    backgroundImage: null,
  });
  const [isRecording, setIsRecording] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const selectedSlide = slides.find(s => s.id === activeSlideId) || slides[0];

  // Global Canvas Rendering Loop Engine Execution Frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (settings.backgroundImage && bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, canvas.width, canvas.height);
    }

    const slideToRender = slides.find(
      slide => currentTime >= slide.startTime && currentTime <= slide.endTime
    );

    if (slideToRender && slideToRender.text) {
      ctx.fillStyle = settings.textColor;
      ctx.font = `${settings.fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lines = slideToRender.text.split('\n');
      // Calculate dynamic line step metric offset via new functional property handle
      const computedLineHeight = settings.fontSize * settings.lineHeight;
      const startY = (settings.yPosition / 100) * canvas.height - ((lines.length - 1) * computedLineHeight) / 2;

      lines.forEach((line, index) => {
        ctx.fillText(
          line,
          (settings.xPosition / 100) * canvas.width,
          startY + (index * computedLineHeight)
        );
      });
    }
  }, [currentTime, slides, settings]);

  useEffect(() => {
    if (settings.backgroundImage) {
      const img = new Image();
      img.src = settings.backgroundImage;
      img.onload = () => { bgImageRef.current = img; };
    }
  }, [settings.backgroundImage]);

  const updateSlideField = (id: string, field: keyof LyricSegment, value: any) => {
    setSlides(prev => prev.map(slide => slide.id === id ? { ...slide, [field]: value } : slide));
  };

  const addNewSlide = () => {
    const newId = `slide-${Date.now()}`;
    const lastSlide = slides[slides.length - 1];
    const nextStart = lastSlide ? lastSlide.endTime + 0.5 : 0;
    
    const newSlide: LyricSegment = {
      id: newId,
      text: 'New Master Structured Slide Text.',
      startTime: nextStart,
      endTime: nextStart + 4
    };
    setSlides([...slides, newSlide]);
    setActiveSlideId(newId);
  };

  const duplicateSlide = (slide: LyricSegment, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = `slide-dup-${Date.now()}`;
    const duplicate: LyricSegment = {
      ...slide,
      id: newId,
      startTime: slide.endTime + 0.5,
      endTime: slide.endTime + 4.5
    };
    setSlides([...slides, duplicate]);
    setActiveSlideId(newId);
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (index: number, e: React.DragEvent) => {
    console.log("index - ", index);
    e.preventDefault();
  };
  const handleDrop = (index: number) => {
    if (draggedIndex === null) return;
    const updatedSlides = [...slides];
    const [draggedItem] = updatedSlides.splice(draggedIndex, 1);
    updatedSlides.splice(index, 0, draggedItem);
    setSlides(updatedSlides);
    setDraggedIndex(null);
  };

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
    }
  };

  const triggerNextSyncMarker = () => {
    if (!audioRef.current) return;
    const markTime = audioRef.current.currentTime;
    const currentSlide = slides[syncPointerIndex];
    if (currentSlide) {
      updateSlideField(currentSlide.id, 'endTime', markTime);
    }

    const nextIndex = syncPointerIndex + 1;
    if (nextIndex < slides.length) {
      setSyncPointerIndex(nextIndex);
      const nextSlide = slides[nextIndex];
      updateSlideField(nextSlide.id, 'startTime', markTime + 0.05);
      setActiveSlideId(nextSlide.id);
    } else {
      setIsSyncModeActive(false);
      audioRef.current.pause();
      // setIsPlaying(false);
      alert('Live sync configuration session completed successfully!');
    }
  };

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

    const mergedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...destination.stream.getAudioTracks()
    ]);

    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    const recorder = new MediaRecorder(mergedStream, options);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
      const downloadUrl = URL.createObjectURL(blob);
      const anchorNode = document.createElement('a');
      anchorNode.href = downloadUrl;
      anchorNode.download = 'lyric-video.mp4';
      anchorNode.click();
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

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur px-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
          <h2 className="text-md font-semibold tracking-wider text-gray-200 uppercase">Studio Engine Workbench</h2>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleLiveSyncMode} 
            disabled={!audioSrc}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition uppercase ${isSyncModeActive ? 'bg-amber-600 text-white animate-pulse' : 'bg-gray-800 text-amber-400 border border-amber-500/30 hover:bg-gray-700 disabled:opacity-40'}`}
          >
            {isSyncModeActive ? 'Stop Sync Session' : 'Start Live Sync Performance'}
          </button>
          
          <button 
            onClick={runMediaExportPipeline} 
            disabled={isRecording || !audioSrc}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-xs font-semibold tracking-wide rounded-md transition uppercase"
          >
            {isRecording ? 'Encoding System Stream Master...' : 'Export Video MP4'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden w-full">

        {/* LEFT PANEL: PowerPoint Slide Strips (25% Width) */}
        <div className="w-1/4 min-w-[280px] max-w-sm bg-gray-900/70 border-r border-gray-800 flex flex-col h-full">
          <div className="p-4 border-b border-gray-800/80 flex items-center justify-between bg-gray-900">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Slide Sequence</span>
            <button 
              onClick={addNewSlide}
              className="p-1 px-2.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-500/30 text-xs font-bold rounded flex items-center space-x-1 transition"
            >
              <span>+ Add</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {slides.map((slide, idx) => {
              const isCurrentPlayingSlide = currentTime >= slide.startTime && currentTime <= slide.endTime;
              const isCurrentlySelected = slide.id === activeSlideId;

              return (
                <div
                  key={slide.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(idx, e)}
                  onDrop={() => handleDrop(idx)}
                  onClick={() => setActiveSlideId(slide.id)}
                  className={`group relative p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between h-24 select-none ${isCurrentlySelected ? 'bg-blue-950/40 border-blue-500 shadow' : 'bg-gray-950/60 border-gray-800/80 hover:border-gray-700'}`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                    <span className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 font-bold">Slide {idx + 1}</span>
                    <span className={isCurrentPlayingSlide ? 'text-green-400 font-bold' : ''}>
                      {formatTimeToMinutes(slide.startTime)} - {formatTimeToMinutes(slide.endTime)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 font-medium truncate mt-1 line-clamp-2 white-space-pre-wrap">
                    {slide.text || <span className="italic text-gray-600">No content empty slide</span>}
                  </p>

                  <div className="absolute right-2 bottom-2 hidden group-hover:flex space-x-1">
                    <button 
                      onClick={(e) => duplicateSlide(slide, e)}
                      className="p-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 text-[10px] px-1.5 border border-gray-700"
                    >
                      Duplicate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Master Controls and Preview Canvas (75% Width) */}
        <div className="flex-1 bg-gray-950 flex flex-col h-full overflow-y-auto p-6 space-y-6">
          
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-inner relative">
            {isSyncModeActive && (
              <div className="absolute top-6 left-6 right-6 bg-amber-600/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg flex items-center justify-between z-20 shadow-lg border border-amber-400/30">
                <div className="text-xs">
                  <p className="font-bold uppercase tracking-wider">Sync Controller Interface Session Active</p>
                  <p className="text-amber-200 mt-0.5 font-medium">Currently Synchronizing Target Row Slot Index: <span className="underline font-bold">Slide {syncPointerIndex + 1}</span></p>
                </div>
                <button 
                  onClick={triggerNextSyncMarker}
                  className="px-6 py-2 bg-white text-amber-950 font-bold uppercase tracking-widest text-xs rounded hover:bg-amber-50 transition active:scale-95 shadow"
                >
                  👉 TRIGGER NEXT SLIDE MARKER
                </button>
              </div>
            )}

            <canvas 
              ref={canvasRef} 
              width={840} 
              height={420} 
              className="w-full h-auto bg-black rounded-lg border border-gray-950 shadow-2xl aspect-video" 
            />

            <div className="w-full mt-4 bg-gray-950 p-2 rounded-lg border border-gray-800 flex items-center space-x-4">
              {audioSrc ? (
                <audio 
                  ref={audioRef} 
                  src={audioSrc} 
                  onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)} 
                  className="flex-1 bg-transparent accent-blue-500" 
                  controls 
                />
              ) : (
                <div className="flex-1 text-center py-2 text-xs font-medium text-gray-500">
                  Please upload an external audio track inside the file selector below to enable playback timelines.
                </div>
              )}
              <span className="text-xs font-mono px-3 py-1 bg-gray-900 border border-gray-800 text-blue-400 rounded">
                Playback: {formatTimeToMinutes(currentTime)}
              </span>
            </div>
          </div>

          {/* Configuration Grid Splitter */}
          <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Active Selected Slide Settings Form Group */}
            {selectedSlide && (
              <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 shadow-md">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Selected Slide Editor</h3>
                  <span className="text-[10px] text-gray-500 font-mono">Changes only affect active layer</span>
                </div>
                
                <div>
                  <textarea
                    value={selectedSlide.text}
                    onChange={(e) => updateSlideField(selectedSlide.id, 'text', e.target.value)}
                    placeholder="Enter lyrical block strings here..."
                    className="w-full h-24 bg-gray-950 text-white border border-gray-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition resize-none shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">Start Time (mm:ss)</label>
                    <input 
                      type="text" 
                      value={formatTimeToMinutes(selectedSlide.startTime)} 
                      onChange={(e) => updateSlideField(selectedSlide.id, 'startTime', parseMinutesToSeconds(e.target.value))}
                      className="w-full bg-gray-950 text-white font-mono text-xs border border-gray-800 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">End Time (mm:ss)</label>
                    <input 
                      type="text" 
                      value={formatTimeToMinutes(selectedSlide.endTime)} 
                      onChange={(e) => updateSlideField(selectedSlide.id, 'endTime', parseMinutesToSeconds(e.target.value))}
                      className="w-full bg-gray-950 text-white font-mono text-xs border border-gray-800 rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* GLOBAL SETTINGS CONFIGURATION PANEL */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 shadow-md">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest">Global Formatting</h3>
                <span className="text-[10px] text-gray-500 font-mono">Applies to ALL slides</span>
              </div>

              {/* Global Text Sizing Utility Control */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1">
                  <span>Font Size</span>
                  <span className="text-blue-400 font-mono">{settings.fontSize}px</span>
                </div>
                <input
                  type="number"
                  min="2" 
                  max="60" 
                  value={settings.fontSize} 
                  onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value, 10) })} 
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Global Line-Height Multiplier Control */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1">
                  <span>Line Height</span>
                  <span className="text-blue-400 font-mono">{settings.lineHeight}x</span>
                </div>
                <input 
                  type="number"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) => setSettings({ ...settings, lineHeight: parseFloat(e.target.value) })} 
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Global Horizontal X Axis Vector Control */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1">
                  <span>Global X Alignment</span>
                  <span className="text-blue-400 font-mono">{settings.xPosition}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="90" 
                  value={settings.xPosition} 
                  onChange={(e) => setSettings({ ...settings, xPosition: parseInt(e.target.value, 10) })} 
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Global Vertical Y Axis Vector Control */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-1">
                  <span>Global Y Alignment</span>
                  <span className="text-blue-400 font-mono">{settings.yPosition}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="90" 
                  value={settings.yPosition} 
                  onChange={(e) => setSettings({ ...settings, yPosition: parseInt(e.target.value, 10) })} 
                  className="w-full accent-blue-500"
                />
              </div>
            </div>

          </div>

          {/* Bottom Assets Asset Ingestion Control Drawer */}
          <div className="w-full max-w-4xl mx-auto bg-gray-900/40 border border-gray-900 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Audio File</label>
              <input type="file" accept="audio/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setAudioSrc(URL.createObjectURL(file));
              }} className="w-full text-xs text-gray-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-gray-800 file:text-gray-300 hover:file:bg-gray-700 cursor-pointer"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Canvas Graphic Background</label>
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSettings({ ...settings, backgroundImage: URL.createObjectURL(file) });
              }} className="w-full text-xs text-gray-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-gray-800 file:text-gray-300 hover:file:bg-gray-700 cursor-pointer"/>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Text Color</label>
                <input type="color" value={settings.textColor} onChange={(e) => setSettings({ ...settings, textColor: e.target.value })} className="w-full h-7 rounded bg-transparent border-0 cursor-pointer"/>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">BG Base Color</label>
                <input type="color" value={settings.backgroundColor} onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })} className="w-full h-7 rounded bg-transparent border-0 cursor-pointer"/>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
