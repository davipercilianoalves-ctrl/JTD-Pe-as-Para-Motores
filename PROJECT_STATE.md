PROJECT_STATE.md — Estado atual:

# JTD MOTORS HUB | Última atualização: 27/05/2026

## Etapas
- [x] Etapa 0: Backup e Segurança de Dados — CONCLUÍDA
- [x] Etapa 1: Dashboard com dados locais — CONCLUÍDA
- [ ] Etapa 2: Análise de concorrentes + janelas flutuantes — PRÓXIMA
- [ ] Etapa 3: Criação de títulos e descrição
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
- backup.ts: readAppKeys() filtrava chaves por prefixo — corrigido
- backup.ts: importData() sem QuotaExceededError — corrigido
- backup.ts: getStorageUsage() cálculo impreciso — corrigido
- backup.ts: sem reload após restauração — corrigido
- HomeScreen: parseInt salvava NaN — corrigido
- HomeScreen: localStorage sem try/catch — corrigido
- HomeScreen: createdToday com risco de timezone — corrigido
- HomeScreen: sort sem suporte a string ISO — corrigido
- types.ts: createdAt/updatedAt agora aceitam number | string

## Decisões tomadas
- localStorage mantido no MVP
- Supabase entra na Fase 2
- Stack: React + TanStack + shadcn/ui + Tailwind + localStorage

## Próxima etapa
Etapa 2 — Análise de concorrentes com janelas flutuantes de
palavras-chave, análise de preços e lista consolidada
