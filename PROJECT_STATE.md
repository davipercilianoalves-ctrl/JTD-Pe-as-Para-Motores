PROJECT_STATE.md — Estado atual:

# JTD MOTORS HUB | Última atualização: 29/05/2026

## Etapas
- [x] Etapa 0: Backup e Segurança de Dados — CONCLUÍDA
- [x] Etapa 1: Dashboard com dados locais — CONCLUÍDA
- [x] Etapa 2: Análise de concorrentes + janelas flutuantes — CONCLUÍDA
- [x] Etapa 3: Criação de títulos e descrição — CONCLUÍDA
- [x] Etapa 4: Precificação refinada — CONCLUÍDA
- [ ] Etapa 5: Imagens — PRÓXIMA
- [ ] Etapa 6: Vídeo
- [ ] Etapa 7: Módulo de Kits
- [ ] Etapa 8: Sidebar definitiva + Configurações completas

## Ferramentas configuradas
- [x] Lovable (editor principal)
- [x] Lovable + GitHub (sync automático)
- [x] ChatGPT + GitHub (revisão de código)

## Bugs corrigidos
- backup.ts: 4 correções
- HomeScreen: 5 correções
- ProductWorkspace: duplicatas, parseFloat BR, média preços,
  drag viewport, mobile bottom sheet, auto-resize, mutação direta
- KeywordTools: drag, SSR window
- TitlesSection: contador 3 estados, sem scroll, usedWords,
  mutação, backdrop modal, crash undefined
- Títulos: limite flexível por marketplace
- Template IA: editável, salvo, restaurável
- Precificação: 3 modos, fórmula margem real, prejuízo explícito,
  falso desconto em R$, validação percentuais, proteção div/zero

## Decisões tomadas
- localStorage mantido no MVP
- Margem calculada sobre preço de venda (não markup)
- Limite de títulos padrão por marketplace com override manual
- Template de IA editável e persistido por produto/marketplace

## Próxima etapa
Etapa 5 — Imagens:
grade 12 posições, drag-and-drop, capa, download, confirmação exclusão
