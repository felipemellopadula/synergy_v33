

# Plano: Implementar Funcionalidade de Moodboard para Geração de Imagens

## Resumo do Objetivo

Criar um sistema completo de Moodboards inspirado no Midjourney, onde usuários podem:
1. Criar coleções de até 14 imagens com um nome
2. Selecionar um Moodboard ao gerar imagens para seguir padrões de cor e estilo
3. Disponibilizar para modelos específicos: Nano Banana 2 Pro, FLUX.2 [pro] e Seedream 4.5

---

## Análise do Midjourney (Pesquisa)

O Midjourney implementa Moodboards através do sistema `--profile`:
- **Coleções de 5-14 imagens** que definem uma "assinatura estética"
- O sistema aprende padrões recorrentes: saturação, iluminação, texturas
- Moodboards são salvos com IDs únicos e podem ser aplicados a qualquer prompt
- Diferente de copiar uma única imagem, ele extrai o "vocabulário visual" comum entre as imagens

---

## Arquitetura Proposta

```text
┌─────────────────────────────────────────────────────────────────┐
│                      PÁGINA DE IMAGEM                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐│
│  │ Personagens  │  │  Moodboards  │  │   Área de Geração      ││
│  │   (Painel)   │  │   (Botão)    │  │   + Grid de Imagens    ││
│  └──────────────┘  └───────┬──────┘  └────────────────────────┘│
│                            │                                    │
│                    ┌───────▼───────┐                           │
│                    │ Selector de   │                           │
│                    │ Moodboard     │                           │
│                    │ (Dropdown)    │                           │
│                    └───────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ PÁGINA/MODAL DE │
                    │ GERENCIAMENTO   │
                    │ DE MOODBOARDS   │
                    └─────────────────┘
```

---

## Arquivos a Criar

### 1. Migração de Banco de Dados

**Novas tabelas:**

```sql
-- Tabela principal de moodboards
CREATE TABLE user_moodboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT, -- URL da primeira imagem como preview
  image_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de imagens do moodboard
CREATE TABLE user_moodboard_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moodboard_id UUID NOT NULL REFERENCES user_moodboards(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE user_moodboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_moodboard_images ENABLE ROW LEVEL SECURITY;

-- Policies para moodboards
CREATE POLICY "Users can CRUD own moodboards" ON user_moodboards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies para imagens
CREATE POLICY "Users can CRUD own moodboard images" ON user_moodboard_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_moodboards WHERE id = moodboard_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_moodboards WHERE id = moodboard_id AND user_id = auth.uid())
  );

-- Trigger para atualizar contador e preview
CREATE OR REPLACE FUNCTION update_moodboard_on_image_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_moodboards SET
      image_count = (SELECT COUNT(*) FROM user_moodboard_images WHERE moodboard_id = NEW.moodboard_id),
      preview_url = COALESCE(preview_url, NEW.image_url),
      updated_at = NOW()
    WHERE id = NEW.moodboard_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_moodboards SET
      image_count = (SELECT COUNT(*) FROM user_moodboard_images WHERE moodboard_id = OLD.moodboard_id),
      preview_url = (SELECT image_url FROM user_moodboard_images WHERE moodboard_id = OLD.moodboard_id ORDER BY order_index LIMIT 1),
      updated_at = NOW()
    WHERE id = OLD.moodboard_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_moodboard_on_image_change
AFTER INSERT OR DELETE ON user_moodboard_images
FOR EACH ROW EXECUTE FUNCTION update_moodboard_on_image_change();
```

### 2. `src/hooks/useMoodboards.ts` (NOVO)

Hook para gerenciar moodboards, seguindo o padrão de `useCharacters.ts`:

```typescript
interface Moodboard {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  preview_url: string | null;
  image_count: number;
  created_at: string;
  updated_at: string;
}

interface MoodboardImage {
  id: string;
  moodboard_id: string;
  image_url: string;
  storage_path: string | null;
  order_index: number;
  created_at: string;
}

// Funcionalidades:
- loadMoodboards(): Carregar todos os moodboards do usuário
- loadMoodboardImages(moodboardId): Carregar imagens de um moodboard
- createMoodboard(name, description?): Criar novo moodboard
- updateMoodboard(id, updates): Atualizar nome/descrição
- deleteMoodboard(id): Excluir moodboard e imagens
- addImages(moodboardId, files[]): Upload de até 14 imagens
- removeImage(imageId): Remover imagem individual
- getMoodboardImagesAsBase64(moodboardId, maxCount): Converter para base64 para API
- selectMoodboard(moodboard | null): Selecionar moodboard ativo
```

### 3. `src/components/image/MoodboardPanel.tsx` (NOVO)

Componente para gerenciar moodboards (similar ao CharacterPanel):

```typescript
interface MoodboardPanelProps {
  moodboards: Moodboard[];
  selectedMoodboard: Moodboard | null;
  moodboardImages: MoodboardImage[];
  isLoading: boolean;
  isUploadingImages: boolean;
  onSelectMoodboard: (moodboard: Moodboard | null) => void;
  onCreateMoodboard: (name: string, description?: string) => Promise<Moodboard | null>;
  onUpdateMoodboard: (id: string, updates: Partial<Moodboard>) => Promise<boolean>;
  onDeleteMoodboard: (id: string) => Promise<boolean>;
  onAddImages: (moodboardId: string, files: File[]) => Promise<number>;
  onRemoveImage: (imageId: string) => Promise<boolean>;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
}

// Estrutura visual:
// - Lista de moodboards em cards com preview
// - Ao selecionar, mostra grid de imagens (até 14)
// - Botão para adicionar/remover imagens
// - Badge com contador de imagens
```

### 4. `src/components/image/MoodboardSelector.tsx` (NOVO)

Dropdown simples para selecionar moodboard na área de geração:

```typescript
interface MoodboardSelectorProps {
  moodboards: Moodboard[];
  selectedMoodboard: Moodboard | null;
  onSelect: (moodboard: Moodboard | null) => void;
  disabled?: boolean;
  supportedModels: string[]; // IDs dos modelos suportados
  currentModel: string;
}

// Visual:
// - Select/Dropdown com preview thumbnail
// - Mostra "Nenhum" quando não selecionado
// - Desabilitado se modelo não suporta
// - Tooltip explicando quando desabilitado
```

### 5. `src/components/image/SelectedMoodboardBadge.tsx` (NOVO)

Badge similar ao `SelectedCharacterBadge` para mostrar moodboard ativo:

```typescript
interface SelectedMoodboardBadgeProps {
  moodboard: Moodboard;
  imageCount: number;
  onClear: () => void;
}

// Visual:
// - Badge compacto com nome e preview
// - Botão X para remover seleção
// - Contador de imagens
```

---

## Arquivos a Modificar

### 6. `src/modules/image/config/models.ts`

Adicionar flag de suporte a moodboard:

```typescript
export interface ImageModel {
  id: string;
  label: string;
  maxImages: number;
  supportsMoodboard?: boolean; // NOVO
}

export const MODELS: ImageModel[] = [
  { id: "google:4@2", label: "Google Nano Banana 2 Pro", maxImages: 14, supportsMoodboard: true },
  { id: "google:4@1", label: "Google Nano Banana", maxImages: 2, supportsMoodboard: false },
  { id: "openai:4@1", label: "GPT Image 1.5", maxImages: 6, supportsMoodboard: false },
  { id: "ideogram:4@1", label: "Ideogram 3.0", maxImages: 1, supportsMoodboard: false },
  { id: "runware:108@1", label: "Qwen-Image", maxImages: 0, supportsMoodboard: false },
  { id: "bfl:3@1", label: "FLUX.1 Kontext [max]", maxImages: 1, supportsMoodboard: false },
  { id: "bfl:4@1", label: "FLUX.2 [pro]", maxImages: 10, supportsMoodboard: true },
  { id: "bytedance:seedream@4.5", label: "Seedream 4.5", maxImages: 2, supportsMoodboard: true },
];
```

### 7. `src/pages/Image2.tsx`

Integrar o sistema de moodboards:

**Novos imports e hooks:**
```typescript
import { useMoodboards } from '@/hooks/useMoodboards';
import { MoodboardPanel } from '@/components/image/MoodboardPanel';
import { MoodboardSelector } from '@/components/image/MoodboardSelector';
import { SelectedMoodboardBadge } from '@/components/image/SelectedMoodboardBadge';
```

**Novo estado:**
```typescript
const {
  moodboards,
  selectedMoodboard,
  moodboardImages,
  isLoading: isLoadingMoodboards,
  isUploadingImages: isUploadingMoodboardImages,
  selectMoodboard,
  createMoodboard,
  updateMoodboard,
  deleteMoodboard,
  addImages: addMoodboardImages,
  removeImage: removeMoodboardImage,
  getMoodboardImagesAsBase64,
} = useMoodboards();

const [showMoodboardPanel, setShowMoodboardPanel] = useState(false);
```

**Modificação na função `generate()`:**

Após processar imagens anexadas e personagem, adicionar moodboard:

```typescript
// Se há moodboard selecionado e modelo suporta, adicionar imagens como referência de estilo
const modelConfig = MODELS.find(m => m.id === model);
if (selectedMoodboard && modelConfig?.supportsMoodboard && moodboardImages.length > 0) {
  // Calcular slots disponíveis
  const availableSlots = Math.max(0, maxImages - inputImagesBase64.length);
  
  if (availableSlots > 0) {
    console.log(`🎨 Moodboard "${selectedMoodboard.name}" selecionado. Adicionando até ${availableSlots} referências de estilo...`);
    const moodboardBase64 = await getMoodboardImagesAsBase64(selectedMoodboard.id, availableSlots);
    console.log(`✅ ${moodboardBase64.length} imagens do moodboard adicionadas como referência de estilo`);
    inputImagesBase64.push(...moodboardBase64);
  }
}
```

**UI na área de controles (abaixo do seletor de modelo):**

```tsx
{/* Moodboard Selector - apenas para modelos suportados */}
{modelConfig?.supportsMoodboard && (
  <div className="space-y-2">
    <Label className="flex items-center gap-2">
      <Palette className="h-4 w-4" />
      Moodboard de Estilo
    </Label>
    <div className="flex items-center gap-2">
      <MoodboardSelector
        moodboards={moodboards}
        selectedMoodboard={selectedMoodboard}
        onSelect={selectMoodboard}
        disabled={isGenerating}
        currentModel={model}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowMoodboardPanel(true)}
        disabled={isGenerating}
        title="Gerenciar Moodboards"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  </div>
)}

{/* Badge do Moodboard selecionado */}
{selectedMoodboard && modelConfig?.supportsMoodboard && (
  <SelectedMoodboardBadge
    moodboard={selectedMoodboard}
    imageCount={moodboardImages.length}
    onClear={() => selectMoodboard(null)}
  />
)}
```

**Modal/Sheet para gerenciar moodboards:**

```tsx
{/* Moodboard Panel - Modal/Sheet para gerenciamento */}
<Sheet open={showMoodboardPanel} onOpenChange={setShowMoodboardPanel}>
  <SheetContent side="right" className="w-[400px] sm:w-[540px]">
    <SheetHeader>
      <SheetTitle className="flex items-center gap-2">
        <Palette className="h-5 w-5" />
        Meus Moodboards
      </SheetTitle>
    </SheetHeader>
    <MoodboardPanel
      moodboards={moodboards}
      selectedMoodboard={selectedMoodboard}
      moodboardImages={moodboardImages}
      isLoading={isLoadingMoodboards}
      isUploadingImages={isUploadingMoodboardImages}
      onSelectMoodboard={selectMoodboard}
      onCreateMoodboard={createMoodboard}
      onUpdateMoodboard={updateMoodboard}
      onDeleteMoodboard={deleteMoodboard}
      onAddImages={addMoodboardImages}
      onRemoveImage={removeMoodboardImage}
    />
  </SheetContent>
</Sheet>
```

---

## Fluxo de Uso

```text
1. Usuário clica no botão "Moodboard" ou ícone de configuração
2. Abre Sheet/Modal de gerenciamento de moodboards
3. Usuário cria novo moodboard com nome
4. Faz upload de até 14 imagens
5. Fecha o painel
6. No dropdown de moodboard, seleciona o criado
7. Escreve prompt e gera imagem
8. Sistema injeta as imagens do moodboard como referências de estilo
9. Resultado segue padrões de cor e estilo do moodboard
```

---

## Prioridade de Imagens de Referência

Quando o usuário tem múltiplas fontes de referência:

| Prioridade | Fonte | Descrição |
|------------|-------|-----------|
| 1 | Imagens anexadas | Upload direto do usuário |
| 2 | Master Avatar do Personagem | Se personagem selecionado e Master Avatar existe |
| 3 | Imagens do Personagem | Se personagem selecionado sem Master Avatar |
| 4 | Imagens do Moodboard | Referências de estilo/cor |

O sistema preenche os slots disponíveis respeitando o limite `maxImages` do modelo.

---

## Modelos Suportados

| Modelo | Max Imagens | Suporta Moodboard |
|--------|-------------|-------------------|
| Nano Banana 2 Pro | 14 | Sim |
| FLUX.2 [pro] | 10 | Sim |
| Seedream 4.5 | 2 | Sim |
| Outros | Variável | Não |

---

## Limitações e Validações

1. **Máximo 14 imagens** por moodboard (limite do modelo mais capaz)
2. **Limite de moodboards por usuário**: Considerar 10 moodboards (evitar abuso)
3. **Tamanho de imagem**: Mesma compressão usada para personagens (400KB, 1536px)
4. **Modelo não suportado**: Dropdown desabilitado com tooltip explicativo
5. **Sem imagens no moodboard**: Não injeta nada, funciona como geração normal

---

## Ordem de Implementação

1. **Migração SQL** - Criar tabelas e policies
2. **Hook `useMoodboards.ts`** - Lógica de dados
3. **Componente `MoodboardPanel.tsx`** - UI de gerenciamento
4. **Componente `MoodboardSelector.tsx`** - Dropdown de seleção
5. **Componente `SelectedMoodboardBadge.tsx`** - Badge visual
6. **Atualizar `models.ts`** - Adicionar flag de suporte
7. **Integrar em `Image2.tsx`** - Conectar tudo

---

## Resultado Esperado

- Botão de Moodboard visível na página de imagem (próximo ao seletor de modelo)
- Ao clicar, abre painel lateral para criar/gerenciar moodboards
- Upload de até 14 imagens por moodboard com visualização em grid
- Dropdown de seleção rápida na área de geração
- Badge visual mostrando moodboard ativo
- Imagens do moodboard são injetadas automaticamente como referências de estilo
- Resultado da geração segue padrões visuais do moodboard selecionado

