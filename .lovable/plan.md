## 1. Sistema de confirmação único (substitui todos os `confirm()`)

Hoje o app usa o `window.confirm()` nativo do navegador em 5 lugares — visual quebra a estética premium. Vou criar um sistema central:

**Novo: `src/components/ConfirmProvider.tsx`**
- Provider montado uma vez em `src/routes/index.tsx`, expõe hook `useConfirm()`.
- Hook devolve uma função assíncrona: `await confirm({ title, message, confirmLabel, tone })`.
- `tone`: `"danger"` (vermelho JTD, ação irreversível) | `"warning"` | `"neutral"`.
- Modal renderizado com Radix Dialog já existente no projeto — overlay escuro, surface elevada, anel metálico, botão de confirmação na cor do tom, atalhos: `Enter` confirma, `Esc` cancela, foco automático.

**Substituições (mesmo texto, agora premium):**
- `ProductWorkspace.tsx:113` — excluir produto (danger)
- `ProductWorkspace.tsx:568` — excluir concorrente (danger)
- `ProductWorkspace.tsx:2198` — excluir vídeo (danger)
- `CustomFieldsPanel.tsx:359` — remover campo customizado (warning)
- `ViralLibraryScreen.tsx:49` — excluir clip viral (danger)

**Ações novas que ganham confirmação (hoje passam direto, mas são destrutivas):**
- Remover keyword (`ProductWorkspace.tsx:420`) — confirmação leve (warning) só se a keyword tiver `uses > 1` ou for favorita; caso contrário remove direto para não atrapalhar o fluxo rápido.
- Limpar imagem principal / deletar imagem (se hoje delete sem confirmar — vou checar e cobrir).
- Apagar todos os custos do pricing — confirm danger.

**Permissões de navegador** (clipboard / file pickers):
- Clipboard hoje é silencioso e funciona — não precisa de modal próprio. Vou adicionar um toast discreto de "copiado" usando o `sonner` que já está no projeto (não interrompe fluxo).
- O app ainda não usa câmera/mic/notificações. Quando essas permissões forem adicionadas no futuro, o `useConfirm()` já estará pronto para envolver o pedido com a caixa premium antes de chamar a API do navegador.

## 2. Sidebar — reconstrução completa

A sidebar atual é funcional mas mistura muita coisa numa coluna só (busca, filtros, lista de produtos, categorias). Em telas estreitas como 1029px ela rouba espaço da workspace. Vou refazer em torno de 3 ideias:

**a) Estrutura em 3 zonas claras**
```
┌─────────────────────┐
│  [logo JTD]   📌    │  ← marca + pin (mesma altura do header da Home)
├─────────────────────┤
│  ⌘ Buscar...        │  ← atalho global (Ctrl+K abre busca grande)
├─────────────────────┤
│  ⌂  Início          │  ← navegação (ícone + label)
│  ▣  Produtos    12  │     contador ao lado
│  🎬  Biblioteca      │
│  ─────────────────  │
│  + Novo produto     │  ← CTA primário vermelho
├─────────────────────┤
│  RECENTES           │  ← lista compacta, só os 8 mais recentes
│  • Pistão CB 300    │     ponto de status colorido
│  • Bico Injetor     │     (verde/amarelo/vermelho/cinza)
│  • ...              │
└─────────────────────┘
   ⚙ Configurações       ← rodapé fixo
```

**b) Comportamento refinado**
- Largura recolhida 56px (era 64), expandida 248px (era 264) — mais respiro para a workspace.
- Hover-to-expand mantém-se, mas com transição mais curta (180ms) e shadow lateral em camada metálica em vez de preto puro.
- Modo recolhido mostra ícones + iniciais dos produtos recentes alinhados verticalmente, com tooltip nativo no hover.
- Filtros (Todos / Favoritos / Categorias) **saem da sidebar** — eles já vivem na Home agora. A sidebar fica enxuta.
- Busca da sidebar abre uma busca global modal (Ctrl+K / ⌘K) — overlay centralizado, mesmo motor de busca da Home (produtos, SKUs, keywords, concorrentes). Resultado clicável.

**c) Visual premium JTD**
- Fundo `--sidebar` mais escuro (já está), separadores de hairline metálica (1px com gradiente prata muito sutil).
- Item ativo: barra vertical de 2px vermelha à esquerda + fundo `surface-elevated`.
- Tipografia: labels em uppercase `[10px] tracking-[0.18em]` para seções, itens em 13px medium.
- Status dot ao lado de cada produto recente (cor do `evaluateProduct` da Home — saudável/atenção/risco/incompleto).

## 3. Arquivos tocados

- `src/components/ConfirmProvider.tsx` — novo (provider + modal + hook)
- `src/components/CommandPalette.tsx` — novo (busca global Ctrl+K)
- `src/routes/index.tsx` — montar `ConfirmProvider` e `CommandPalette` dentro do `StoreProvider`
- `src/components/AppSidebar.tsx` — reescrita estrutural conforme acima
- `src/components/ProductWorkspace.tsx` — trocar `confirm()` por `useConfirm()` em 3 pontos + adicionar confirmação leve em remoção de keyword favorita
- `src/components/CustomFieldsPanel.tsx` — trocar `confirm()` por `useConfirm()`
- `src/components/ViralLibraryScreen.tsx` — trocar `confirm()` por `useConfirm()`
- `src/lib/product-signal.ts` — pequena extração da função `evaluateProduct` (hoje em `HomeScreen`) para reuso na sidebar

## Fora de escopo nesta iteração

- Kit Builder, Purchase Pricing Center, Media Center, Template Center (são features novas, ficam para iterações dedicadas).
- Mudanças na workspace de produto além das 4 trocas de `confirm()` — fluxo operacional intocado.
