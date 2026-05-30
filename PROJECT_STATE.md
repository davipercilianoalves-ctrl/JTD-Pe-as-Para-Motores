PROJECT_STATE.md — Estado atual:

# JTD MOTORS HUB | Última atualização: 30/05/2026

## Etapas
- [x] Etapa 0: Backup e Segurança de Dados — CONCLUÍDA
- [x] Etapa 1: Dashboard com dados locais — CONCLUÍDA
- [x] Etapa 2: Análise de concorrentes + janelas flutuantes — CONCLUÍDA
- [x] Etapa 3: Criação de títulos e descrição — CONCLUÍDA
- [x] Etapa 4: Precificação refinada — CONCLUÍDA
- [x] Etapa 5: Imagens — CONCLUÍDA
- [x] Etapa 6: Vídeo — CONCLUÍDA
- [x] Etapa 7: Módulo de Kits — CONCLUÍDA
- [ ] Etapa 8: Sidebar definitiva + Configurações completas — PRÓXIMA

## Ferramentas configuradas
- [x] Lovable (editor principal)
- [x] Lovable + GitHub (sync automático)
- [x] ChatGPT + GitHub (revisão de código)

## Bugs corrigidos
- backup.ts: 4 correções
- HomeScreen: 5 correções
- ProductWorkspace: múltiplas correções
- KeywordTools: drag, SSR window
- TitlesSection: 7 correções
- Precificação: 6 correções
- Imagens: 2 mutações corrigidas
- Vídeo: validação YouTube
- Kits v1: reformulação completa de design e funcionalidades
- Kits v2: palavras-chave, precificação, títulos, descrição

## Decisões tomadas
- localStorage mantido no MVP
- Kits em chave separada "jtd:kits"
- PricingSection exportada e reutilizada no kit
- Fórmula de margem considera taxas percentuais do marketplace
- Palavras herdadas: somente leitura, visual diferente
- Palavras exclusivas: editáveis com deduplicação total

## Próxima etapa
Etapa 8 — Sidebar definitiva + Configurações completas:
hover abre, pino fixa, logo/foto da empresa,
nome editável em Configurações, tema claro/escuro
