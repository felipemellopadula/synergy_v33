import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Download,
  Wand2,
  Video,
  Loader2,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StoryboardScene } from '@/hooks/useStoryboard';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// Helper para converter paths relativos em URLs públicas
const getSceneImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const { data } = supabase.storage.from('images').getPublicUrl(url);
  return data.publicUrl;
};

interface SceneFullScreenViewProps {
  scenes: StoryboardScene[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onGenerateImage: (scene: StoryboardScene) => void;
  onGenerateVideo: (scene: StoryboardScene) => void;
  onPreviewVideo: (videoUrl: string) => void;
  isGeneratingImage: boolean;
  isGeneratingVideo: boolean;
  hasReferences: boolean;
}

const imageStatusConfig = {
  pending: { label: 'Sem imagem', icon: ImageIcon, className: 'bg-muted text-muted-foreground' },
  generating: { label: 'Gerando...', icon: Loader2, className: 'bg-blue-500/20 text-blue-600' },
  completed: { label: 'Imagem pronta', icon: CheckCircle, className: 'bg-green-500/20 text-green-600' },
  failed: { label: 'Erro', icon: AlertCircle, className: 'bg-destructive/20 text-destructive' },
};

const videoStatusConfig = {
  pending: { label: 'Pendente', icon: Clock, className: 'bg-muted text-muted-foreground' },
  generating: { label: 'Gerando...', icon: Loader2, className: 'bg-yellow-500/20 text-yellow-600' },
  completed: { label: 'Pronto', icon: CheckCircle, className: 'bg-green-500/20 text-green-600' },
  failed: { label: 'Erro', icon: AlertCircle, className: 'bg-destructive/20 text-destructive' },
};

const SWIPE_THRESHOLD = 50;

export const SceneFullScreenView: React.FC<SceneFullScreenViewProps> = ({
  scenes,
  currentIndex,
  onClose,
  onNavigate,
  onGenerateImage,
  onGenerateVideo,
  onPreviewVideo,
  isGeneratingImage,
  isGeneratingVideo,
  hasReferences,
}) => {
  const scene = scenes[currentIndex];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  if (!scene) return null;

  const hasImage = scene.image_status === 'completed' && (scene.generated_image_url || scene.image_url);
  const hasVideo = scene.video_status === 'completed' && scene.video_url;
  const displayImageUrl = scene.generated_image_url || scene.image_url;
  const canGenerateImage = hasReferences && scene.prompt && scene.image_status !== 'generating';
  const canGenerateVideo = hasImage && scene.video_status !== 'generating';

  const imageStatus = imageStatusConfig[scene.image_status] || imageStatusConfig.pending;
  const videoStatus = videoStatusConfig[scene.video_status];
  const StatusIcon = hasImage ? videoStatus.icon : imageStatus.icon;
  const statusConfig = hasImage ? videoStatus : imageStatus;

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = async () => {
    if (!scene.video_url) return;
    try {
      const response = await fetch(scene.video_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cena-${currentIndex + 1}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar vídeo:', error);
    }
  };

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      if (info.offset.x > SWIPE_THRESHOLD && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (info.offset.x < -SWIPE_THRESHOLD && currentIndex < scenes.length - 1) {
        onNavigate(currentIndex + 1);
      }
    },
    [currentIndex, scenes.length, onNavigate]
  );

  const goToPrevious = () => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  };

  const goToNext = () => {
    if (currentIndex < scenes.length - 1) onNavigate(currentIndex + 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col"
        onClick={onClose}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">
              Cena {currentIndex + 1} de {scenes.length}
            </span>
          </div>

          <Badge className={cn("gap-1", statusConfig.className)}>
            <StatusIcon className={cn(
              "h-3 w-3",
              (scene.image_status === 'generating' || scene.video_status === 'generating') && "animate-spin"
            )} />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Main Content - Swipeable */}
        <motion.div
          className="flex-1 flex items-center justify-center relative overflow-hidden"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-2 z-10 text-white hover:bg-white/10 h-12 w-12"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {currentIndex < scenes.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-2 z-10 text-white hover:bg-white/10 h-12 w-12"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Scene Content */}
          <div className="w-full h-full max-w-3xl mx-auto px-12 flex items-center justify-center">
            {hasVideo ? (
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={scene.video_url!}
                  className="w-full h-full object-contain"
                  loop
                  muted
                  playsInline
                  poster={getSceneImageUrl(displayImageUrl)}
                  onEnded={() => setIsPlaying(false)}
                  onClick={handlePlayPause}
                />
                {/* Play/Pause Overlay */}
                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={handlePlayPause}
                >
                  {!isPlaying && (
                    <div className="bg-black/50 rounded-full p-4">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ) : hasImage ? (
              <img
                src={getSceneImageUrl(displayImageUrl)}
                alt={scene.prompt || `Cena ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <div className="w-full aspect-video bg-muted/20 rounded-lg flex flex-col items-center justify-center text-white/60">
                <Sparkles className="h-16 w-16 mb-4" />
                <span className="text-center px-8">
                  {scene.image_status === 'generating'
                    ? 'Gerando imagem...'
                    : 'Descreva a cena e clique em "Criar Imagem"'}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <div 
          className="p-4 space-y-3 shrink-0 bg-gradient-to-t from-black via-black/80 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Prompt */}
          {scene.prompt && (
            <div 
              className={cn(
                "text-white/80 text-sm text-center cursor-pointer",
                !showFullPrompt && "line-clamp-2"
              )}
              onClick={() => setShowFullPrompt(!showFullPrompt)}
            >
              {scene.prompt}
            </div>
          )}

          {/* Duration + Actions */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge variant="outline" className="text-white border-white/30">
              <Clock className="h-3 w-3 mr-1" />
              {scene.duration}s
            </Badge>

            {/* Generate Image Button */}
            {!hasImage && (
              <Button
                size="sm"
                variant="secondary"
                className="gap-1"
                onClick={() => onGenerateImage(scene)}
                disabled={isGeneratingImage || !canGenerateImage}
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Criar Imagem
                  </>
                )}
              </Button>
            )}

            {/* Generate Video Button */}
            {hasImage && scene.video_status !== 'completed' && (
              <Button
                size="sm"
                variant="secondary"
                className="gap-1"
                onClick={() => onGenerateVideo(scene)}
                disabled={isGeneratingVideo || !canGenerateVideo}
              >
                {isGeneratingVideo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    Gerar Vídeo
                  </>
                )}
              </Button>
            )}

            {/* Video Complete Actions */}
            {hasVideo && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                  Baixar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? 'Pausar' : 'Reproduzir'}
                </Button>
              </>
            )}
          </div>

          {/* Helper Text */}
          {!hasReferences && !hasImage && (
            <p className="text-center text-xs text-amber-400">
              ⚠️ Adicione referências no painel lateral primeiro
            </p>
          )}

          {/* Dots Navigation */}
          <div className="flex justify-center gap-1.5 pt-2">
            {scenes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentIndex 
                    ? "bg-white w-4" 
                    : "bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
