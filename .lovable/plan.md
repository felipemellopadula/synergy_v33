

# Correção: Microfone na Página de Imagem

## Problema Identificado

A página de **Imagem** (`src/pages/Image2.tsx`) está configurada com reconhecimento de voz em **inglês** (`lang="en-US"`), enquanto a página de **Vídeo** usa **português** (`lang="pt-BR"`).

Quando você fala em português na página de imagem, o sistema tenta interpretar como inglês, resultando em:
- Transcrição incorreta ou vazia
- Falha no disparo automático da geração
- Comportamento inconsistente comparado à página de vídeo

---

## Solução

Alterar o idioma do componente `PromptInput` na página de imagem de `en-US` para `pt-BR`.

---

## Arquivo a Modificar

**`src/pages/Image2.tsx`** - Linha 963

| Antes | Depois |
|-------|--------|
| `lang="en-US"` | `lang="pt-BR"` |

---

## Alteração Exata

```text
// Linha 963
- lang="en-US"
+ lang="pt-BR"
```

Também vou atualizar o placeholder para português, mantendo consistência:

```text
// Linha 962
- placeholder="Describe the scene you imagine"
+ placeholder="Descreva a cena que você imagina"
```

---

## Resultado Esperado

Após a correção:
- O microfone reconhecerá fala em português corretamente
- A transcrição aparecerá em tempo real no campo
- Ao parar de falar (1.5s de silêncio), a geração será disparada automaticamente
- Comportamento idêntico à página de Vídeo

