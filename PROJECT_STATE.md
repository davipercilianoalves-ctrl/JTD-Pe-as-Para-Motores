PROJECT_STATE.md — Estado atual:

# JTD MOTORS HUB | Última atualização: 27/05/2026

## Etapas
- [x] Etapa 0: Backup e Segurança de Dados — CONCLUÍDA
- [ ] Etapa 1: Dashboard com dados locais — PRÓXIMA
- [ ] Etapa 2: Análise de concorrentes + janelas flutuantes
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
- backup.ts: importData() sem tratamento de QuotaExceededError — corrigido
- backup.ts: getStorageUsage() cálculo impreciso — corrigido para Blob.size
- backup.ts: sem window.location.reload() após restauração — corrigido

## Decisões tomadas
- localStorage mantido no MVP (sem Supabase)
- Supabase entra apenas na Fase 2 (multi-device/múltiplos usuários)
- Stack: React + TanStack + shadcn/ui + Tailwind + localStorage

## Próxima etapa
Etapa 1 — Dashboard com dados locais (produtos, anúncios, kits criados)
