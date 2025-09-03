import { memo } from 'react';

interface FastLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FastLoader = memo(({ 
  text = 'Carregando...', 
  size = 'md',
  className = '' 
}: FastLoaderProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeClasses[size]}`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
});

FastLoader.displayName = 'FastLoader';