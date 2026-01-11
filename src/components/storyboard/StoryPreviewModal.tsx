import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Loader2,
} from 'lucide-react';
import { StoryboardScene } from '@/hooks/useStoryboard';

interface StoryPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenes: StoryboardScene[];
}

export const StoryPreviewModal: React.FC<StoryPreviewModalProps> = ({
  open,
  onOpenChange,
  scenes,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter only scenes with completed videos
  const videoScenes = scenes
    .filter(s => s.video_status === 'completed' && s.video_url)
    .sort((a, b) => a.order_index - b.order_index);

  const currentScene = videoScenes[currentSceneIndex];
  const totalScenes = videoScenes.length;

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCurrentSceneIndex(0);
      setIsPlaying(false);
      setProgress(0);
      setError(null);
    }
  }, [open]);

  // Handle video loading
  useEffect(() => {
    if (!open || !currentScene?.video_url) return;
    setIsLoading(true);
    setError(null);
  }, [open, currentScene?.video_url]);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [isPlaying]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setError('Erro ao carregar vídeo');
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percent);
    }
  }, []);

  // Auto-play next scene when current ends
  const handleEnded = useCallback(() => {
    if (currentSceneIndex < totalScenes - 1) {
      setCurrentSceneIndex(prev => prev + 1);
      setIsPlaying(true);
    } else {
      // Loop back to start
      setCurrentSceneIndex(0);
      setIsPlaying(false);
    }
  }, [currentSceneIndex, totalScenes]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const goToPrevious = useCallback(() => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prev => prev - 1);
    }
  }, [currentSceneIndex]);

  const goToNext = useCallback(() => {
    if (currentSceneIndex < totalScenes - 1) {
      setCurrentSceneIndex(prev => prev + 1);
    }
  }, [currentSceneIndex, totalScenes]);

  const handleSeek = useCallback((value: number[]) => {
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = (value[0] / 100) * videoRef.current.duration;
      setProgress(value[0]);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'Escape':
          onOpenChange(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, togglePlay, goToPrevious, goToNext, toggleMute, toggleFullscreen, onOpenChange]);

  if (videoScenes.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 bg-black border-none overflow-hidden">
        <div ref={containerRef} className="relative w-full flex flex-col bg-black">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-50 text-white bg-black/50 hover:bg-black/70"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Scene indicator */}
          <div className="absolute top-3 left-3 z-50 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
            Cena {currentSceneIndex + 1} de {totalScenes}
          </div>

          {/* Video container */}
          <div className="relative aspect-video bg-black flex items-center justify-center">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <p className="text-white/70">{error}</p>
              </div>
            )}

            <video
              ref={videoRef}
              key={currentScene?.video_url}
              src={currentScene?.video_url || ''}
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
              muted={isMuted}
              playsInline
              onLoadedData={handleLoadedData}
              onError={handleError}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>

          {/* Scene progress dots */}
          <div className="flex items-center justify-center gap-1.5 py-3 bg-black/80">
            {videoScenes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSceneIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSceneIndex
                    ? 'w-6 bg-primary'
                    : idx < currentSceneIndex
                    ? 'w-2 bg-primary/60'
                    : 'w-2 bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="bg-gradient-to-t from-black to-black/80 px-4 py-3 space-y-3">
            {/* Progress bar */}
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="cursor-pointer"
            />

            {/* Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  disabled={currentSceneIndex === 0}
                  className="text-white hover:bg-white/20 disabled:opacity-30"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20 h-12 w-12"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  disabled={currentSceneIndex === totalScenes - 1}
                  className="text-white hover:bg-white/20 disabled:opacity-30"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Scene prompt */}
            {currentScene?.prompt && (
              <p className="text-white/60 text-xs text-center line-clamp-2">
                {currentScene.prompt}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
