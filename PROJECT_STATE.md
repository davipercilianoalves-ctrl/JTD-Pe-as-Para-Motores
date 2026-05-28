PROJECT_STATE.md — Estado atual:

# JTD MOTORS HUB | Última atualização: 28/05/2026

## Etapas
- [x] Etapa 0: Backup e Segurança de Dados — CONCLUÍDA
- [x] Etapa 1: Dashboard com dados locais — CONCLUÍDA
- [x] Etapa 2: Análise de concorrentes + janelas flutuantes — CONCLUÍDA
- [ ] Etapa 3: Criação de títulos e descrição — PRÓXIMA
- [ ] Etapa 4: Precificação refinada
- [ ] Etapa 5: Imagens
- [ ] Etapa 6: Vídeo
- [ ] Etapa 7: Módulo de Kits
- [ ] Etapa 8: Sidebar definitiva + Configurações completas

## Ferramentas configuradas
- [x] Lovable (editor principal)
- [x] Lovable + GitHub (sync automático)
- [x] ChatGPT + GitHub (revisão de código)
- [ ] Supabase — fora do MVP
- [ ] N8N/Manus — fora do MVP

## Bugs corrigidos
- backup.ts: 4 correções de segurança e precisão
- HomeScreen: 5 correções de cálculo e estado
- ProductWorkspace: duplicatas, parseFloat BR, média de preços,
  drag com viewport, mobile bottom sheet, auto-resize, mutação direta
- KeywordTools: drag no FloatingKeywordInput, bug SSR de window

## Decisões tomadas
- localStorage mantido no MVP
- Janelas flutuantes viram bottom sheets no mobile
- FloatingKeywordInput movível igual ao FloatingKeywordCloud
- Janela fecha ao clicar fora, exceto durante drag

## Próxima etapa
Etapa 3 — Criação de títulos e descrição:
múltiplos títulos sem scroll, contador de caracteres,
box flutuante de palavras acompanhando, template para IA externa
