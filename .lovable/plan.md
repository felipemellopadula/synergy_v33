

# Plano: Adicionar Drag and Drop e Persistir Imagem no Inpaint

## Problemas Identificados

### Problema 1: Imagem desaparece ao trocar de aba
O arquivo já persiste `isGenerating` via sessionStorage (linhas 37-42), mas **NÃO persiste**:
- `uploadedImage` (a imagem original em base64)
- `generatedImage` (o resultado do inpaint)
- `prompt` (o texto digitado)

Quando o componente remonta (troca de aba, eventos do Supabase), esses estados são reiniciados para `null`/`""`.

### Problema 2: Drag and Drop não funciona
A zona de upload (linhas 671-693) tem apenas `onClick`:
```tsx
<Button onClick={() => fileInputRef.current?.click()}>
  <Upload /> Fazer upload de imagem
</Button>
<p>Arraste uma imagem ou clique para selecionar</p>  {/* Texto promete drag, mas não funciona! */}
```

Não há handlers para drag events.

---

## Solução

Aplicar a mesma solução do `ImageEditor.tsx`:
1. Adicionar funções de persistência para imagem/prompt
2. Inicializar estados a partir do sessionStorage
3. Adicionar useEffect para persistir mudanças e restaurar ao voltar para aba
4. Adicionar handlers de drag and drop com feedback visual
5. Adicionar estado `isDragging` para feedback visual

---

## Alterações no Arquivo `src/pages/Inpaint.tsx`

### 1. Adicionar novas keys e funções de persistência (após linha 42)

```tsx
// Persistência de imagem via sessionStorage
const UPLOADED_IMAGE_KEY = 'inpaint_uploaded_image';
const GENERATED_IMAGE_KEY = 'inpaint_generated_image';
const PROMPT_KEY = 'inpaint_prompt';

const saveInpaintState = (uploaded: string | null, generated: string | null, promptText: string) => {
  if (uploaded) {
    sessionStorage.setItem(UPLOADED_IMAGE_KEY, uploaded);
  } else {
    sessionStorage.removeItem(UPLOADED_IMAGE_KEY);
  }
  if (generated) {
    sessionStorage.setItem(GENERATED_IMAGE_KEY, generated);
  } else {
    sessionStorage.removeItem(GENERATED_IMAGE_KEY);
  }
  if (promptText) {
    sessionStorage.setItem(PROMPT_KEY, promptText);
  } else {
    sessionStorage.removeItem(PROMPT_KEY);
  }
};

const loadInpaintState = () => ({
  uploaded: sessionStorage.getItem(UPLOADED_IMAGE_KEY),
  generated: sessionStorage.getItem(GENERATED_IMAGE_KEY),
  prompt: sessionStorage.getItem(PROMPT_KEY) || '',
});

const clearInpaintState = () => {
  sessionStorage.removeItem(UPLOADED_IMAGE_KEY);
  sessionStorage.removeItem(GENERATED_IMAGE_KEY);
  sessionStorage.removeItem(PROMPT_KEY);
};
```

### 2. Adicionar estado para drag (após linha 62)

```tsx
const [isDragging, setIsDragging] = useState(false);
```

### 3. Modificar inicialização dos estados (linhas 55-59)

De:
```tsx
const [uploadedImage, setUploadedImage] = useState<string | null>(null);
const [prompt, setPrompt] = useState("");
const [generatedImage, setGeneratedImage] = useState<string | null>(null);
```

Para:
```tsx
const [uploadedImage, setUploadedImage] = useState<string | null>(() => {
  return sessionStorage.getItem(UPLOADED_IMAGE_KEY);
});
const [prompt, setPrompt] = useState(() => {
  return sessionStorage.getItem(PROMPT_KEY) || '';
});
const [generatedImage, setGeneratedImage] = useState<string | null>(() => {
  return sessionStorage.getItem(GENERATED_IMAGE_KEY);
});
```

### 4. Adicionar useEffects para persistir e restaurar (após linha 80)

```tsx
// Persistir imagem e prompt no sessionStorage
useEffect(() => {
  saveInpaintState(uploadedImage, generatedImage, prompt);
}, [uploadedImage, generatedImage, prompt]);

// Restaurar estado ao voltar para a aba
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      const saved = loadInpaintState();
      if (saved.uploaded && !uploadedImage) {
        setUploadedImage(saved.uploaded);
      }
      if (saved.generated && !generatedImage) {
        setGeneratedImage(saved.generated);
      }
      if (saved.prompt && !prompt) {
        setPrompt(saved.prompt);
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [uploadedImage, generatedImage, prompt]);
```

### 5. Adicionar handlers de drag and drop (após handleDeleteImage, linha 396)

```tsx
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(true);
};

const handleDragLeave = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);

  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith("image/")) {
    toast.error("Por favor, arraste uma imagem válida");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    setUploadedImage(event.target?.result as string);
    setGeneratedImage(null);
  };
  reader.readAsDataURL(file);
};
```

### 6. Modificar handleDeleteImage para limpar sessionStorage (linha 385-396)

Adicionar `clearInpaintState()`:
```tsx
const handleDeleteImage = () => {
  setUploadedImage(null);
  setGeneratedImage(null);
  const canvas = fabricCanvasRef.current;
  if (canvas) {
    canvas.clear();
    canvas.backgroundColor = "#1a1a1a";
    canvas.renderAll();
  }
  setHistory([]);
  setHistoryIndex(-1);
  setPrompt(""); // Limpar prompt também
  clearInpaintState(); // Limpar persistência
};
```

### 7. Adicionar handlers de drag na zona de upload (linhas 671-693)

De:
```tsx
{!uploadedImage && (
  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#0d0d0d]">
    <input ... />
    <Button onClick={() => fileInputRef.current?.click()}>
      <Upload /> Fazer upload de imagem
    </Button>
    <p>Arraste uma imagem ou clique para selecionar</p>
  </div>
)}
```

Para:
```tsx
{!uploadedImage && (
  <div 
    className={`absolute inset-0 flex flex-col items-center justify-center z-20 transition-colors ${
      isDragging 
        ? "bg-primary/10 border-2 border-dashed border-primary" 
        : "bg-[#0d0d0d]"
    }`}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
  >
    <input ... />
    <Button 
      variant="outline"
      size="lg"
      onClick={() => fileInputRef.current?.click()}
      className={`gap-2 border-dashed border-2 bg-transparent ${
        isDragging 
          ? "border-primary text-primary" 
          : "border-white/20 hover:border-primary/50"
      }`}
    >
      <Upload className="w-5 h-5" />
      {isDragging ? "Solte a imagem aqui" : "Fazer upload de imagem"}
    </Button>
    <p className="text-muted-foreground text-sm mt-3">
      {isDragging ? "Solte para carregar" : "Arraste uma imagem ou clique para selecionar"}
    </p>
  </div>
)}
```

---

## Resumo das Mudanças

| Local | Alteração |
|-------|-----------|
| Após linha 42 | Adicionar funções de persistência (save/load/clear) |
| Linha 55-59 | Inicializar estados a partir do sessionStorage |
| Após linha 62 | Adicionar estado `isDragging` |
| Após linha 80 | Adicionar useEffects para persistir e restaurar |
| Linha 385-396 | Limpar sessionStorage e prompt no handleDeleteImage |
| Após linha 396 | Adicionar handlers de drag (handleDragOver, handleDragLeave, handleDrop) |
| Linhas 671-693 | Adicionar props de drag no elemento e feedback visual |

---

## Resultado Esperado

1. **Persistência**: Ao trocar de aba do navegador e voltar, a imagem permanece visível. O estado é salvo em sessionStorage e restaurado automaticamente.

2. **Drag and Drop**: Ao arrastar uma imagem sobre a zona de upload:
   - O fundo muda para um tom roxo transparente
   - Aparece uma borda tracejada roxa
   - O texto muda para "Solte a imagem aqui"
   - Ao soltar, a imagem é carregada no canvas

