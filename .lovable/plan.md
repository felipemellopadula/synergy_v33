

# Plano: Corrigir a Borda da Sidebar que Não Vai até o Final da Página

## Diagnóstico do Problema

Após análise detalhada do código, identifiquei a causa raiz:

O componente `CharacterPanel` no desktop retorna um **React Fragment** (`<>...</>`) que contém:
1. Um botão flutuante (quando fechado)
2. O `div` da sidebar com `border-r`

**O problema**: React Fragments são "invisíveis" no DOM - eles não criam um elemento HTML real, então não podem receber propriedades CSS como `h-full`.

```text
Cadeia de altura atual (QUEBRADA):
┌─ div.flex.flex-1.overflow-hidden ─────────────────┐
│                                                   │
│  ┌─ div.hidden.lg:block.h-full ────────────────┐  │
│  │                                             │  │
│  │  ┌─ React Fragment (<>...</>) ───────────┐  │  │  ← Fragment não propaga altura!
│  │  │                                       │  │  │
│  │  │  ┌─ div.lg:flex.h-full.border-r ───┐  │  │  │  ← h-full = 100% de NADA
│  │  │  │  Sidebar Content               │  │  │  │
│  │  │  │  ▼ borda para no meio ▼        │  │  │  │
│  │  │  └────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

## Solução

Substituir o Fragment por um `div` com `h-full` para que a altura seja propagada corretamente.

### Arquivo: `src/components/image/CharacterPanel.tsx`

**Alterar linhas 734-757:**

De:
```tsx
return (
  <>
    {/* Botão para reabrir quando fechado */}
    {!isPanelOpen && props.onOpen && (
      <Button ... />
    )}
    
    {/* Sidebar com animação */}
    <div className={cn(
      "hidden lg:flex flex-col h-full border-r ...",
      isPanelOpen ? "w-[280px]" : "w-0"
    )}>
      <CharacterPanelContent {...props} />
    </div>
  </>
);
```

Para:
```tsx
return (
  <div className="h-full relative">
    {/* Botão para reabrir quando fechado */}
    {!isPanelOpen && props.onOpen && (
      <Button ... />
    )}
    
    {/* Sidebar com animação */}
    <div className={cn(
      "lg:flex flex-col h-full border-r ...",
      isPanelOpen ? "w-[280px]" : "w-0"
    )}>
      <CharacterPanelContent {...props} />
    </div>
  </div>
);
```

### Debugging com Console Logs

Também adicionarei console.logs temporários para confirmar as alturas em tempo de execução:

```tsx
// No CharacterPanel, adicionar log no useEffect:
useEffect(() => {
  console.log('[CharacterPanel] Mounted - checking heights');
  const sidebar = document.querySelector('.character-sidebar-debug');
  if (sidebar) {
    const rect = sidebar.getBoundingClientRect();
    console.log('[CharacterPanel] Sidebar height:', rect.height);
    console.log('[CharacterPanel] Parent height:', sidebar.parentElement?.getBoundingClientRect().height);
  }
}, [isPanelOpen]);
```

---

## Cadeia de Altura Corrigida

```text
┌─ div.flex.flex-1.overflow-hidden ─────────────────┐
│                                                   │
│  ┌─ div.hidden.lg:block.h-full ────────────────┐  │
│  │                                             │  │
│  │  ┌─ div.h-full.relative ─────────────────┐  │  │  ← NOVO: div real com h-full
│  │  │                                       │  │  │
│  │  │  ┌─ div.lg:flex.h-full.border-r ───┐  │  │  │  ← agora h-full funciona!
│  │  │  │  Sidebar Content               │  │  │  │
│  │  │  │  ▼ borda vai até o fim ▼       │  │  │  │
│  │  │  └────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

## Resumo das Alterações

| Arquivo | Mudança |
|---------|---------|
| `CharacterPanel.tsx` | Substituir Fragment (`<>`) por `<div className="h-full relative">` |
| `CharacterPanel.tsx` | Remover `hidden` do div interno (agora controlado pelo wrapper de Image2) |
| `CharacterPanel.tsx` | Adicionar console.logs para debug |

## Resultado Esperado

A borda vertical da sidebar de personagens irá do topo até o final da página, sem cortar pela metade.

