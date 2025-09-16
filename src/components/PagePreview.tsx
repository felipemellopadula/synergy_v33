import React from 'react';
import { Card } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface PagePreviewProps {
  className?: string;
}

export const PagePreview: React.FC<PagePreviewProps> = ({ className = "" }) => {
  const currentUrl = window.location.origin;
  
  return (
    <Card className={`mt-3 p-3 bg-muted/50 border-border/50 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-foreground/80">Visualização da Página</h4>
        <a 
          href={currentUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          Abrir
        </a>
      </div>
      <div className="relative bg-background rounded border border-border/30 overflow-hidden">
        <div className="aspect-video">
          <iframe
            src={currentUrl}
            className="w-full h-full border-0 pointer-events-none"
            title="Page Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </Card>
  );
};