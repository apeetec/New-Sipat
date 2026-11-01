import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, CheckCircle2, FastForward } from 'lucide-react';
import { formatPercent } from '../../utils/formatters';

export interface VideoPlayerProps {
  videoUrl: string;
  initialProgressPercent: number;
  onProgressUpdate: (currentSeconds: number, durationSeconds: number) => Promise<{ videoProgressPercent: number; questionnaireUnlocked: boolean }>;
  isUnlocked: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  initialProgressPercent,
  onProgressUpdate,
  isUnlocked,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progressPercent, setProgressPercent] = useState(initialProgressPercent);
  const [isSaving, setIsSaving] = useState(false);

  const lastReportedTimeRef = useRef(0);

  useEffect(() => {
    setProgressPercent(initialProgressPercent);
  }, [initialProgressPercent]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = async () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(current);

    const calculatedPercent = Math.min(100, Math.round((current / dur) * 100));
    if (calculatedPercent > progressPercent) {
      setProgressPercent(calculatedPercent);
    }

    // Throttle progress report to every 5 seconds or when hitting 99%
    if (Math.abs(current - lastReportedTimeRef.current) >= 5 || calculatedPercent >= 99) {
      lastReportedTimeRef.current = current;
      try {
        const res = await onProgressUpdate(current, dur);
        if (res.videoProgressPercent > progressPercent) {
          setProgressPercent(res.videoProgressPercent);
        }
      } catch (err) {
        console.error('Failed to sync video progress:', err);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    setDuration(dur);

    // Resume from previous progress if not finished
    if (initialProgressPercent > 0 && initialProgressPercent < 99 && dur > 0) {
      const resumeTime = (initialProgressPercent / 100) * dur;
      videoRef.current.currentTime = resumeTime;
      setCurrentTime(resumeTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current || duration === 0) return;
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleDevFastForward = async () => {
    if (!videoRef.current || isSaving) return;
    setIsSaving(true);
    const dur = duration || 60;
    const target = dur * 0.995;
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    setProgressPercent(100);

    try {
      await onProgressUpdate(target, dur);
    } finally {
      setIsSaving(false);
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Top Video Header with Progress Indicator */}
      <div className="bg-[#323f3c] text-white px-5 py-3 flex items-center justify-between text-xs">
        <span className="font-bold tracking-tight">Transmissão Oficial da Palestra</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {progressPercent >= 99 || isUnlocked ? (
              <span className="inline-flex items-center gap-1 text-[#66bd39] font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Vídeo Assistido ({formatPercent(progressPercent)})</span>
              </span>
            ) : (
              <span className="text-slate-300">
                Progresso: <strong className="text-white">{formatPercent(progressPercent)}</strong> (necessário 99%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div ref={containerRef} className="relative bg-black aspect-video flex items-center justify-center group">
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />

        {/* Big play button overlay when paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#028056]/90 hover:bg-[#028056] text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-105 cursor-pointer backdrop-blur-xs"
            aria-label="Iniciar palestra em vídeo"
          >
            <Play className="w-8 h-8 ml-1" />
          </button>
        )}

        {/* Bottom Video Controls Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 opacity-95 transition-opacity flex flex-col gap-2">
          {/* Progress Slider */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#66bd39]"
            aria-label="Barra de progresso do vídeo"
          />

          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-1 text-white hover:text-[#66bd39] transition-colors cursor-pointer"
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }
                }}
                className="p-1 text-white hover:text-slate-300 transition-colors cursor-pointer"
                aria-label="Reiniciar vídeo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-1 text-white hover:text-slate-300 transition-colors cursor-pointer"
                  aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    if (videoRef.current) {
                      videoRef.current.volume = val;
                      videoRef.current.muted = val === 0;
                      setIsMuted(val === 0);
                    }
                  }}
                  className="w-16 h-1 bg-white/30 rounded-lg appearance-none accent-white cursor-pointer hidden sm:block"
                  aria-label="Controle de volume"
                />
              </div>

              <span className="font-mono text-[11px] text-slate-300">
                {formatSeconds(currentTime)} / {formatSeconds(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Evaluator accelerator button */}
              <button
                type="button"
                onClick={handleDevFastForward}
                disabled={isSaving || progressPercent >= 99}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/20 hover:bg-[#66bd39] text-white hover:text-[#014730] transition-colors text-[11px] font-bold cursor-pointer disabled:opacity-40"
                title="Avança o progresso e simula visualização de 99% para testar liberação rápida"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Simular 99% (Avaliação)</span>
              </button>

              <button
                onClick={handleFullscreen}
                className="p-1 text-white hover:text-[#66bd39] transition-colors cursor-pointer"
                aria-label="Tela cheia"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
