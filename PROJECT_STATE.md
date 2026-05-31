PROJECT_STATE.md — ATUALIZADO

# JTD MOTORS HUB | MVP CONCLUÍDO — 31/05/2026

## Etapas MVP — TODAS CONCLUÍDAS
- [x] Etapa 0: Backup e Segurança de Dados
- [x] Etapa 1: Dashboard com dados locais
- [x] Etapa 2: Análise de concorrentes + janelas flutuantes
- [x] Etapa 3: Criação de títulos e descrição
- [x] Etapa 4: Precificação refinada
- [x] Etapa 5: Imagens
- [x] Etapa 6: Vídeo
- [x] Etapa 7: Módulo de Kits
- [x] Etapa 8: Sidebar definitiva + Configurações

## Próximas fases — planejadas

### Fase 2A — Infraestrutura (PRÉ-REQUISITO PARA TUDO)
- [ ] Migração localStorage → Supabase (banco na nuvem)
- [ ] Sistema de autenticação (login + criar conta)
- [ ] Estrutura de usuários e permissões (base para funcionários)
- [ ] Redesign completo do app

### Fase 2B — Gestão de negócio
- [ ] Módulo de Fornecedores
      → Cadastro: nome, localização, tempo de garantia,
        preço de compra por produto
      → Integração automática na criação de produto
      → Histórico de compras por fornecedor
- [ ] Dashboard com dados reais via API Mercado Livre
- [ ] Módulo de Vendas
- [ ] Módulo de Mensagens com alertas (prazo 2h ML)
- [ ] Módulo de Compras com calculadora de custo real
- [ ] Módulo de Métricas por produto e conta
- [ ] Integração API Mercado Livre (OAuth — iniciar processo
      de parceiro ML quando Fase 2A estiver estável)

### Fase 2C — Expansão
- [ ] Multi-marketplace (Shopee, Amazon, TikTok Shop)
- [ ] IA integrada para criação de descrição e título
- [ ] Multi-usuário com níveis de acesso (funcionários)
- [ ] App mobile nativo (iOS + Android)

## Stack atual (MVP)
- React + TanStack Router + shadcn/ui + Tailwind
- localStorage (migrar para Supabase na Fase 2A)
- Vercel/Lovable (hospedagem)

## Stack planejada (Fase 2A+)
- React + TanStack Router + shadcn/ui + Tailwind
- Supabase (banco de dados + autenticação + storage)
- Vercel (hospedagem)
