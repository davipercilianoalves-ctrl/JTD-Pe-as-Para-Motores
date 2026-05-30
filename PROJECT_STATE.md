PROJECT_STATE.md — Estado atual:

# JTD MOTORS HUB | Última atualização: 29/05/2026

## Etapas
- [x] Etapa 0: Backup e Segurança de Dados — CONCLUÍDA
- [x] Etapa 1: Dashboard com dados locais — CONCLUÍDA
- [x] Etapa 2: Análise de concorrentes + janelas flutuantes — CONCLUÍDA
- [x] Etapa 3: Criação de títulos e descrição — CONCLUÍDA
- [x] Etapa 4: Precificação refinada — CONCLUÍDA
- [x] Etapa 5: Imagens — CONCLUÍDA
- [x] Etapa 6: Vídeo — CONCLUÍDA
- [ ] Etapa 7: Módulo de Kits — PRÓXIMA
- [ ] Etapa 8: Sidebar definitiva + Configurações completas

## Ferramentas configuradas
- [x] Lovable (editor principal)
- [x] Lovable + GitHub (sync automático)
- [x] ChatGPT + GitHub (revisão de código)

## Bugs corrigidos
- backup.ts: 4 correções
- HomeScreen: 5 correções
- ProductWorkspace: múltiplas correções acumuladas
- KeywordTools: drag, SSR window
- TitlesSection: 7 correções
- Precificação: 6 correções
- Imagens: 2 mutações corrigidas
- Vídeo: validação YouTube endurecida

## Decisões tomadas
- localStorage mantido no MVP
- Vídeos: limite 50MB com aviso fixo
- Preview dentro do app via base64
- Validação YouTube: includes("youtube.com") ou ("youtu.be")

## Próxima etapa
Etapa 7 — Módulo de Kits:
criação com produtos existentes, herança de palavras-chave,
todas as funções de anúncio, precificação composta
