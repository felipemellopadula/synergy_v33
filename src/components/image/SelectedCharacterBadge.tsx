import { X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Character } from '@/hooks/useCharacters';

interface SelectedCharacterBadgeProps {
  character: Character;
  onClear: () => void;
  className?: string;
  maxRefsToShow?: number;
}

export const SelectedCharacterBadge = ({
  character,
  onClear,
  className,
  maxRefsToShow = 10,
}: SelectedCharacterBadgeProps) => {
  const refsUsed = Math.min(character.image_count, maxRefsToShow);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full",
              "bg-primary/10 border border-primary/30",
              "animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
              className
            )}
          >
            {/* Avatar */}
            <div className="w-5 h-5 rounded-full overflow-hidden bg-primary/20 shrink-0">
              {character.avatar_url ? (
                <img 
                  src={character.avatar_url} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-3 w-3 text-primary" />
                </div>
              )}
            </div>

            {/* Nome */}
            <span className="text-xs font-medium text-primary truncate max-w-[80px]">
              {character.name}
            </span>

            {/* Contador de refs */}
            <span className="text-[10px] text-muted-foreground">
              ({refsUsed} refs)
            </span>

            {/* Botão de remover */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
              className={cn(
                "p-0.5 rounded-full",
                "hover:bg-primary/20 transition-colors",
                "focus:outline-none focus:ring-1 focus:ring-primary"
              )}
            >
              <X className="h-3 w-3 text-primary/70 hover:text-primary" />
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="text-xs">
            <strong>{character.name}</strong> está selecionado.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {refsUsed} de {character.image_count} imagens serão usadas como 
            referência para manter consistência visual.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
