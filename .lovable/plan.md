
# Plano: Corrigir Botões do Overlay das Imagens na Galeria

## Diagnóstico

Identifiquei o problema correto agora! Você está falando dos botões que aparecem **sobre as imagens na galeria** (ao passar o mouse), NÃO os do modal de tela cheia.

Código problemático (linhas 867-920):

```tsx
<div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
  <p className="text-white text-sm mb-3 line-clamp-2">{img.prompt}</p>
  <div className="flex gap-2">  {/* ← SEM flex-wrap! */}
    <Button>🔒/🌐</Button>    {/* 5 botões em linha */}
    <Button>📋</Button>
    <Button>⬇️</Button>
    <Button>↗️</Button>
    <Button>🗑️</Button>
  </div>
</div>
```

**Problema**: São **5 botões** em uma única linha sem `flex-wrap`. Quando o menu de personagens abre, os cards ficam menores (de 4 colunas para menos espaço) e os botões estouram.

## Solução

### Arquivo: `src/pages/Image2.tsx` (linhas 867-920)

**Mudanças a aplicar:**

1. **Adicionar `flex-wrap`** no container dos botões
2. **Reduzir gap** para `gap-1.5` (menos espaço entre botões)
3. **Reduzir padding** do overlay de `p-4` para `p-2 sm:p-3`
4. **Botões menores** com `h-7` ou `h-8` em vez do padrão

De:
```tsx
<div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
  <p className="text-white text-sm mb-3 line-clamp-2">{img.prompt}</p>
  <div className="flex gap-2">
    <Button size="sm" ...>...</Button>
    {/* 5 botões */}
  </div>
</div>
```

Para:
```tsx
<div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 sm:p-3">
  <p className="text-white text-xs sm:text-sm mb-2 line-clamp-2">{img.prompt}</p>
  <div className="flex flex-wrap gap-1 sm:gap-1.5">
    <Button size="sm" className="h-7 w-7 p-0" ...>...</Button>
    {/* Todos botões com tamanho fixo quadrado */}
  </div>
</div>
```

## Mudanças Detalhadas

| Elemento | Antes | Depois |
|----------|-------|--------|
| Overlay padding | `p-4` | `p-2 sm:p-3` |
| Texto prompt | `text-sm mb-3` | `text-xs sm:text-sm mb-2` |
| Container botões | `flex gap-2` | `flex flex-wrap gap-1 sm:gap-1.5` |
| Cada botão | `size="sm"` (padrão) | `size="icon" className="h-7 w-7"` (quadrado) |

## Resultado Esperado

```text
ANTES (estourado):
┌──────────────────────────┐
│        IMAGEM            │
│                          │
│ faça um gato...          │
│ [🔒][📋][⬇️][↗️][🗑️]    │ ← Botões saem do card!
└──────────────────────────┘

DEPOIS (responsivo):
┌──────────────────────────┐
│        IMAGEM            │
│                          │
│ faça um gato...          │
│ [🔒][📋][⬇️]            │ ← Botões quebram linha
│ [↗️][🗑️]                │    e cabem no card!
└──────────────────────────┘

OU (com espaço suficiente):
┌──────────────────────────┐
│        IMAGEM            │
│                          │
│ faça um gato de bigode   │
│ [🔒][📋][⬇️][↗️][🗑️]   │ ← Todos cabem
└──────────────────────────┘
```

## Resumo

| Arquivo | Linhas | Ação |
|---------|--------|------|
| `Image2.tsx` | 867-920 | Adicionar flex-wrap, reduzir padding/gap, botões compactos |

Os botões agora:
- Terão tamanho fixo quadrado (apenas ícones)
- Podem quebrar em duas linhas se necessário
- Sempre ficam dentro dos limites da imagem
