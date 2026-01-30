

# Plano: Adicionar Drag and Drop e Persistir Imagem no Image Editor

## Problemas Identificados

### Problema 1: Drag and Drop não funciona
A zona de upload (linhas 364-374) tem apenas `onClick`:
```tsx
<div
  className="... cursor-pointer hover:border-primary/50 ..."
  onClick={() => fileInputRef.current?.click()}
>
```
Não há handlers para drag events (`onDragOver`, `onDragLeave`, `onDrop`).

### Problema 2: Imagem desaparece ao trocar de aba
O arquivo já persiste `isProcessing` via sessionStorage, mas NÃO persiste:
- `uploadedImage` (a imagem em base64)
- `editedImage` (o resultado da edição)
- `prompt` (o texto digitado)

Quando o componente remonta (troca de aba do navegador, evento auth do Supabase), esses estados são reiniciados.

---

## Solução

Usar a mesma abordagem do `Image2.tsx`:
1. Adicionar estados e handlers para drag and drop
2. Persistir a imagem e dados relacionados em sessionStorage
3. Restaurar ao montar o componente e em `visibilitychange`

---

## Alterações no Arquivo `src/pages/ImageEditor.tsx`

### 1. Adicionar nova key de persistência e funções utilitárias (após linha 27)

```tsx
// Persistência de imagem via sessionStorage
const IMAGE_STATE_KEY = 'imageeditor_uploaded_image';
const EDITED_STATE_KEY = 'imageeditor_edited_image';
const PROMPT_STATE_KEY = 'imageeditor_prompt';

const saveImageState = (uploaded: string | null, edited: string | null, prompt: string) => {
  if (uploaded) {
    sessionStorage.setItem(IMAGE_STATE_KEY, uploaded);
  } else {
    sessionStorage.removeItem(IMAGE_STATE_KEY);
  }
  if (edited) {
    sessionStorage.setItem(EDITED_STATE_KEY, edited);
  } else {
    sessionStorage.removeItem(EDITED_STATE_KEY);
  }
  if (prompt) {
    sessionStorage.setItem(PROMPT_STATE_KEY, prompt);
  } else {
    sessionStorage.removeItem(PROMPT_STATE_KEY);
  }
};

const loadImageState = () => ({
  uploaded: sessionStorage.getItem(IMAGE_STATE_KEY),
  edited: sessionStorage.getItem(EDITED_STATE_KEY),
  prompt: sessionStorage.getItem(PROMPT_STATE_KEY) || '',
});

const clearImageState = () => {
  sessionStorage.removeItem(IMAGE_STATE_KEY);
  sessionStorage.removeItem(EDITED_STATE_KEY);
  sessionStorage.removeItem(PROMPT_STATE_KEY);
};
```

### 2. Adicionar estado para drag (após linha 49)

```tsx
const [isDragging, setIsDragging] = useState(false);
```

### 3. Modificar inicialização dos estados (linhas 33-37)

Inicializar a partir do sessionStorage:
```tsx
const [uploadedImage, setUploadedImage] = useState<string | null>(() => {
  const saved = loadImageState();
  return saved.uploaded;
});
const [prompt, setPrompt] = useState(() => {
  const saved = loadImageState();
  return saved.prompt;
});
const [editedImage, setEditedImage] = useState<string | null>(() => {
  const saved = loadImageState();
  return saved.edited;
});
```

### 4. Adicionar useEffect para persistir mudanças (após linha 54)

```tsx
// Persistir imagem e prompt no sessionStorage
useEffect(() => {
  saveImageState(uploadedImage, editedImage, prompt);
}, [uploadedImage, editedImage, prompt]);

// Restaurar estado ao voltar para a aba
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      const saved = loadImageState();
      if (saved.uploaded && !uploadedImage) {
        setUploadedImage(saved.uploaded);
      }
      if (saved.edited && !editedImage) {
        setEditedImage(saved.edited);
      }
      if (saved.prompt && !prompt) {
        setPrompt(saved.prompt);
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [uploadedImage, editedImage, prompt]);
```

### 5. Adicionar handler de drag and drop (após handleRemoveImage, linha 85)

```tsx
const handleDragOver = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(true);
}, []);

const handleDragLeave = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);
}, []);

const handleDrop = useCallback((e: React.DragEvent) => {
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
    setEditedImage(null);
    setClickMarkers([]);
  };
  reader.readAsDataURL(file);
}, []);
```

### 6. Modificar handleRemoveImage para limpar sessionStorage (linha 74-85)

```tsx
const handleRemoveImage = useCallback(() => {
  setUploadedImage(null);
  setEditedImage(null);
  setClickMarkers([]);
  setPrompt("");
  setRotation(0);
  setVerticalTilt(0);
  setProximity(0);
  clearImageState(); // Limpar persistência
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
}, []);
```

### 7. Adicionar handlers de drag na zona de upload (linhas 364-374)

De:
```tsx
<div
  className="w-full max-w-md aspect-square border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 transition-colors"
  onClick={() => fileInputRef.current?.click()}
>
```

Para:
```tsx
<div
  className={`w-full max-w-md aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${
    isDragging 
      ? "border-primary bg-primary/10" 
      : "border-border hover:border-primary/50"
  }`}
  onClick={() => fileInputRef.current?.click()}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
>
  <Upload className={`h-12 w-12 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
  <div className="text-center">
    <p className="text-foreground font-medium">
      {isDragging ? "Solte a imagem aqui" : "Clique para fazer upload"}
    </p>
    <p className="text-sm text-muted-foreground">ou arraste uma imagem</p>
  </div>
</div>
```

---

## Resumo das Mudanças

| Local | Alteração |
|-------|-----------|
| Linhas 22-27 | Adicionar funções de persistência para imagem |
| Linha 33-37 | Inicializar estados a partir do sessionStorage |
| Linha 49 | Adicionar estado `isDragging` |
| Após linha 54 | Adicionar useEffects para persistir e restaurar |
| Linha 74-85 | Limpar sessionStorage no handleRemoveImage |
| Após linha 85 | Adicionar handlers de drag (handleDragOver, handleDragLeave, handleDrop) |
| Linhas 364-374 | Adicionar props de drag no elemento e feedback visual |

---

## Resultado Esperado

1. **Drag and Drop**: Ao arrastar uma imagem sobre a zona de upload, ela muda de cor (borda roxa, fundo transparente) e o texto muda para "Solte a imagem aqui". Ao soltar, a imagem é carregada.

2. **Persistência**: Ao trocar de aba do navegador e voltar, a imagem permanece visível. O estado é salvo em sessionStorage e restaurado automaticamente.

