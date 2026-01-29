
# Plano: Remover Botão de Moodboard da Barra Inferior

## Problema

O botão "Moodboard" na barra inferior está ocupando espaço excessivo e "espremendo" os outros controles (seletores de modelo, qualidade, quantidade, etc.).

## Solução

Remover o componente `MoodboardPanel` da barra de controles inferior.

**Nota:** O sistema de moodboards continuará funcionando - o usuário ainda terá acesso:
- Via `SelectedMoodboardBadge` que aparece quando um moodboard está selecionado
- O moodboard selecionado é persistido no localStorage e recarregado automaticamente

---

## Arquivo a Modificar

### `src/pages/Image2.tsx`

**Remover linhas 1104-1119:**

```tsx
// REMOVER este bloco:
{/* Moodboard - apenas para modelos suportados */}
{currentModel?.supportsMoodboard && (
  <MoodboardPanel
    moodboards={moodboards}
    selectedMoodboard={selectedMoodboard}
    moodboardImages={moodboardImages}
    isLoading={isLoadingMoodboards}
    isUploadingImages={isUploadingMoodboardImages}
    onSelectMoodboard={selectMoodboard}
    onCreateMoodboard={createMoodboard}
    onUpdateMoodboard={updateMoodboardData}
    onDeleteMoodboard={deleteMoodboard}
    onAddImages={addMoodboardImages}
    onRemoveImage={removeMoodboardImage}
  />
)}
```

---

## Também Remover (Limpeza)

1. **Import do MoodboardPanel** (linha ~40):
   ```tsx
   import { MoodboardPanel } from '@/components/image/MoodboardPanel';
   ```

2. **Variáveis não utilizadas do useMoodboards hook** - manter apenas o necessário para o `SelectedMoodboardBadge`:
   - Manter: `selectedMoodboard`, `selectMoodboard`, `moodboardImages`, `getMoodboardImagesAsBase64`
   - Remover da desestruturação: `moodboards`, `isLoading: isLoadingMoodboards`, `isUploadingImages: isUploadingMoodboardImages`, `createMoodboard`, `updateMoodboard`, `deleteMoodboard`, `addImages`, `removeImage`

---

## Resultado

| Antes | Depois |
|-------|--------|
| 7 elementos na barra (modelo, qualidade, qtd, anexo, **moodboard**, magic, gerar) | 6 elementos (modelo, qualidade, qtd, anexo, magic, gerar) |
| Barra apertada/espremida | Barra com espaço adequado |
| Acesso ao moodboard pela barra | Acesso apenas pelo badge superior (quando selecionado) |

---

## Consideração Futura

Se o usuário quiser uma forma de gerenciar moodboards sem usar a barra inferior, podemos:
- Adicionar um botão no painel lateral de personagens
- Criar uma página separada de configurações de moodboards
- Adicionar ao menu do header
