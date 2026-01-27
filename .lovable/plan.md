
# Plano: Implementar Experiencia Premium de Entrada de Prompt com Voz

## Resumo do Objetivo

Criar uma experiencia de entrada de prompt profissional e controlada para as paginas de Imagem e Video, com suporte a entrada por voz (Speech-to-Text), controles de teclado ENTER/SHIFT+ENTER, e prevencao de envios automaticos indesejados.

---

## Analise do Estado Atual

### Pagina de Imagem (`src/pages/Image2.tsx`)
- Usa `<Textarea>` simples para entrada de prompt
- Botao "Generate" ja esta desabilitado quando prompt vazio
- Usa `useButtonDebounce` para prevenir cliques duplos
- **Falta**: suporte a ENTER para enviar, SHIFT+ENTER para quebra de linha, botao de microfone

### Pagina de Video (`src/pages/Video.tsx`)
- Usa `<Textarea>` simples para entrada de prompt
- Botao "Gerar Video" ja esta desabilitado quando prompt vazio
- Usa `useButtonDebounce` para prevenir cliques duplos
- **Falta**: suporte a ENTER para enviar, SHIFT+ENTER para quebra de linha, botao de microfone

### Storyboard (`src/components/storyboard/StoryBuilderInput.tsx`)
- Usa `<Textarea>` para entrada de historia
- Botao "Gerar Cenas" desabilitado quando vazio
- **Falta**: suporte a voz e controles de teclado

---

## Arquivos a Criar

### 1. `src/hooks/useSpeechToText.ts` (NOVO)

Hook reutilizavel para captura de voz com Web Speech API:

```typescript
interface UseSpeechToTextOptions {
  lang?: string;           // 'pt-BR' ou 'en-US'
  continuous?: boolean;    // Gravacao continua
  onResult?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseSpeechToTextReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  error: string | null;
}
```

**Funcionalidades:**
- Detectar suporte do navegador (`window.SpeechRecognition || window.webkitSpeechRecognition`)
- Iniciar/parar gravacao
- Retornar transcricao parcial e final
- Feedback de estado (gravando/parado)
- Tratamento de erros (permissao negada, sem microfone, etc.)

### 2. `src/components/PromptInput.tsx` (NOVO)

Componente reutilizavel de entrada de prompt com todas as funcionalidades:

```typescript
interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
  className?: string;
}
```

**Funcionalidades:**
- Textarea multilinha com auto-resize
- ENTER para enviar (chama onSubmit)
- SHIFT+ENTER para quebra de linha
- Botao de microfone integrado
- Indicador visual de gravacao (borda pulsante, icone animado)
- Tooltip explicativo quando desabilitado durante geracao
- Placeholder configuravel

---

## Arquivos a Modificar

### 3. `src/pages/Image2.tsx`

**Alteracoes:**
- Substituir `<Textarea>` atual pelo novo `<PromptInput>`
- Passar handlers apropriados (value, onChange, onSubmit=generate)
- Manter integracao com `useButtonDebounce`

**Codigo atual (linhas ~960-986):**
```tsx
<Textarea
  placeholder="Describe the scene you imagine"
  value={prompt}
  onChange={(e) => setPrompt(e.target.value)}
  rows={1}
  className={...}
  disabled={isGenerating}
/>
```

**Codigo novo:**
```tsx
<PromptInput
  value={prompt}
  onChange={setPrompt}
  onSubmit={() => debounce(generate)}
  disabled={isDebouncing}
  isGenerating={isGenerating}
  placeholder="Describe the scene you imagine"
/>
```

### 4. `src/pages/Video.tsx`

**Alteracoes:**
- Substituir `<Textarea id="prompt">` pelo novo `<PromptInput>`
- Passar handlers apropriados

**Codigo atual (linhas ~1456-1464):**
```tsx
<Textarea
  id="prompt"
  placeholder="Descreva a cena, movimentos de camera, estilo..."
  value={prompt}
  onChange={(e) => setPrompt(e.target.value)}
  disabled={isProcessing}
/>
```

**Codigo novo:**
```tsx
<PromptInput
  value={prompt}
  onChange={setPrompt}
  onSubmit={() => debounce(startGeneration)}
  disabled={isDebouncing}
  isGenerating={isProcessing}
  placeholder="Descreva a cena, movimentos de camera, estilo..."
/>
```

### 5. `src/components/storyboard/StoryBuilderInput.tsx`

**Alteracoes:**
- Substituir `<Textarea>` pelo novo `<PromptInput>`
- Adaptar para contexto de storyboard

---

## Detalhes Tecnicos

### Hook `useSpeechToText.ts`

```typescript
import { useState, useCallback, useRef, useEffect } from 'react';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export function useSpeechToText(lang: string = 'pt-BR') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = lang;

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      setError(event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported, lang]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript('');
    recognitionRef.current.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
    error,
  };
}
```

### Componente `PromptInput.tsx`

```tsx
import React, { useRef, useCallback, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { cn } from '@/lib/utils';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
  className?: string;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isGenerating = false,
  placeholder = 'Descreva sua ideia...',
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isListening, isSupported, startListening, stopListening, transcript } = useSpeechToText();

  // Quando a transcricao muda, adiciona ao prompt
  useEffect(() => {
    if (transcript) {
      onChange(value + (value ? ' ' : '') + transcript);
    }
  }, [transcript]);

  // Handler de teclado: ENTER envia, SHIFT+ENTER quebra linha
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isGenerating && value.trim()) {
        onSubmit();
      }
    }
    // SHIFT+ENTER permite quebra de linha naturalmente (comportamento padrao)
  }, [disabled, isGenerating, value, onSubmit]);

  const toggleMicrophone = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const isDisabled = disabled || isGenerating;

  return (
    <div className="relative w-full">
      <TooltipProvider>
        <Tooltip open={isGenerating ? undefined : false}>
          <TooltipTrigger asChild>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isDisabled}
                className={cn(
                  "resize-none min-h-[44px] pr-20",
                  isGenerating && "cursor-not-allowed opacity-70 border-primary/50 animate-pulse",
                  isListening && "border-red-500 ring-2 ring-red-500/30",
                  className
                )}
              />
              
              {/* Controles internos */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {/* Indicador de geracao */}
                {isGenerating && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                
                {/* Botao de microfone */}
                {isSupported && !isGenerating && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7",
                      isListening && "text-red-500 bg-red-500/10 animate-pulse"
                    )}
                    onClick={toggleMicrophone}
                    disabled={isDisabled}
                    title={isListening ? "Parar gravacao" : "Gravar voz"}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-primary text-primary-foreground">
            <p>Gerando... Aguarde.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Indicador de gravacao */}
      {isListening && (
        <div className="absolute -bottom-6 left-0 text-xs text-red-500 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Gravando... Fale agora
        </div>
      )}
    </div>
  );
};
```

---

## Regras de Comportamento Implementadas

| Regra | Implementacao |
|-------|---------------|
| ENTER envia | `handleKeyDown` verifica `e.key === 'Enter' && !e.shiftKey` |
| SHIFT+ENTER quebra linha | Comportamento padrao do textarea (nao previne) |
| Botao desabilitado quando vazio | `disabled={!value.trim() \|\| isGenerating}` (ja existe) |
| Sem geracao automatica ao colar | Nenhum `onPaste` handler, sem debounce de input |
| Sem geracao ao perder foco | Nenhum `onBlur` handler que dispara geracao |
| Bloqueio de multiplos envios | `useButtonDebounce` + `disabled` durante geracao |
| Feedback visual de gravacao | Borda vermelha pulsante, indicador animado |
| Mensagens de erro amigaveis | Toast via `sonner` para erros de microfone |

---

## Ordem de Implementacao

1. **Criar** `src/hooks/useSpeechToText.ts` - Hook de reconhecimento de voz
2. **Criar** `src/components/PromptInput.tsx` - Componente reutilizavel
3. **Modificar** `src/pages/Image2.tsx` - Integrar novo componente
4. **Modificar** `src/pages/Video.tsx` - Integrar novo componente
5. **Modificar** `src/components/storyboard/StoryBuilderInput.tsx` - Integrar (opcional)

---

## Consideracoes de Compatibilidade

- **Web Speech API**: Suportada em Chrome, Edge, Safari. Firefox tem suporte limitado.
- **Fallback**: Se nao suportado, botao de microfone fica oculto (graceful degradation)
- **Mobile**: Funciona em iOS Safari e Android Chrome
- **Permissoes**: Navegador solicita permissao de microfone na primeira vez

---

## Custos e Impacto

- **Zero custo adicional**: Web Speech API e gratuita (processada pelo navegador)
- **Bundle size**: Minimo (~2KB para o hook e componente)
- **Performance**: Nenhum impacto (evento nativo do navegador)

