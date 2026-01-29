

# Plano: Corrigir Botão de Moodboard Não Abrindo

## Problema Identificado

O botão de Moodboard não responde ao clique porque há uma **cadeia de componentes Radix com `asChild` aninhados** que bloqueia a propagação do evento:

```text
SheetTrigger (asChild) 
  └─> TooltipProvider 
        └─> Tooltip 
              └─> TooltipTrigger (asChild) 
                    └─> Button  ← Clique interceptado, nunca chega ao SheetTrigger
```

Comparando com o `CharacterPanel` (que funciona), a estrutura correta é:
```text
SheetTrigger (asChild) 
  └─> Button  ← Clique funciona diretamente
```

---

## Solução

Remover o aninhamento problemático movendo o Tooltip para **fora** do `SheetTrigger`, ou simplesmente removendo o Tooltip do trigger (mantendo apenas o botão).

### Opção Recomendada: Remover Tooltip do Trigger

Seguir o mesmo padrão do `CharacterPanel` que não usa Tooltip no botão trigger:

---

## Arquivo a Modificar

### `src/components/image/MoodboardPanel.tsx`

**Alterações nas linhas 334-361:**

De (problemático):
```tsx
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetTrigger asChild>
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className={...}>
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Moodboard</span>
            {selectedMoodboard && (...)}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Gerenciar moodboards de estilo</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </SheetTrigger>
  ...
</Sheet>
```

Para (corrigido):
```tsx
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetTrigger asChild>
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "gap-2",
        selectedMoodboard && "border-primary bg-primary/5"
      )}
    >
      <Palette className="h-4 w-4" />
      <span className="hidden sm:inline">Moodboard</span>
      {selectedMoodboard && (
        <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
          {selectedMoodboard.image_count}
        </Badge>
      )}
    </Button>
  </SheetTrigger>
  ...
</Sheet>
```

---

## Resumo das Mudanças

| Antes | Depois |
|-------|--------|
| `SheetTrigger` → `TooltipProvider` → `Tooltip` → `TooltipTrigger` → `Button` | `SheetTrigger` → `Button` |
| Clique bloqueado pelos wrappers de Tooltip | Clique funciona diretamente |

---

## Resultado Esperado

- O botão "Moodboard" abrirá o Sheet lateral ao ser clicado
- O tooltip é removido (trade-off aceitável, pois o botão já tem label "Moodboard" visível)
- Funcionalidade fica consistente com o padrão do `CharacterPanel`

