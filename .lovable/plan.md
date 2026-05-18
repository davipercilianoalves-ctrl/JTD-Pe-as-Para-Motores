## Unified Product Workspace — Structural Rework

Rebuild the product creation flow around ONE central product with marketplace "modes" that adapt the same workspace, plus a custom-field engine where each field is tagged with the marketplaces it belongs to.

### 1. Data model (`src/lib/types.ts`)

Move from per-marketplace silos to a single core product:

```
Product
├── core (shared, single source of truth)
│   ├── name, sku, brand, model, category, supplier
│   ├── compatibility, techSpecs
│   ├── baseShortDescription, baseDescription
│   ├── keywords, competitors
│   ├── pricing, images, videos
│   └── customFields: CustomField[]   ← each field has `marketplaces: MarketplaceId[]`
└── marketplaceOverrides: { [id]: { titleOverride?, descriptionOverride?, hashtags?, extras? } }
```

`CustomField` gains:
- `marketplaces: MarketplaceId[]` — empty = global; otherwise visible only when active mode is in the list
- `scope: "core" | "marketplace"` — core fields sync everywhere; marketplace fields are overrides

Migration converts existing per-marketplace `MarketplaceData` into:
- shared title/description → core
- marketplace-specific titles/notes → overrides
- existing customFields are merged into the global list and tagged with their origin marketplace

### 2. Workspace mode switcher

One top bar inside `ProductWorkspace`:
```
[ Geral ] [ Mercado Livre ] [ Shopee ] [ Amazon ] [ TikTok ]
```
Switching is local state — no route change, no remount. The same sections render; only:
- which custom fields are visible (filtered by tag)
- live character-limit chips (60 ML, 120 Shopee, 200 Amazon, 100 TikTok)
- which override fields appear (title override, hashtags, bullets)
- subtle accent color per mode

### 3. Field engine update (`CustomFieldsPanel`)

- Single panel at end of page (no more per-marketplace duplicates).
- Each field card gets a marketplace-tag selector (chips: ML / Shopee / Amazon / TikTok / Global).
- Filter respects current mode: in "Mercado Livre" mode you only see Global + ML-tagged fields.
- "Global" tag = visible in every mode; sets `marketplaces: []`.
- Drag/drop, widths, focus mode, duplication remain.

### 4. Central sections (rendered once, mode-aware)

- **Identidade** — name, sku, brand, category (always core)
- **Concorrentes / Keywords** — already shared, stays as-is
- **Título & Descrição** — base fields with live counter that swaps limit per mode; "Override para [mode]" toggle reveals a marketplace-specific variant
- **Pricing / Imagens / Vídeos** — unchanged, shared
- **Campos personalizados** — single panel, filtered by mode tag

### 5. Sync rules

- Editing a core field updates that single value → all modes reflect it instantly (they read the same source).
- Override toggle stores `marketplaceOverrides[mode].titleOverride` etc.; clearing it falls back to core.
- No automatic content rewriting (per user's "not aggressive AI" rule).

### 6. Files touched

- `src/lib/types.ts` — new shape + migration of legacy `mercadoLivre/shopee/amazon/tiktok` blocks into core + overrides + tagged customFields
- `src/components/ProductWorkspace.tsx` — remove per-marketplace tabs; add mode switcher; single set of sections; mode-aware limit chips and override toggles
- `src/components/CustomFieldsPanel.tsx` — add marketplace tag selector on each field; filter by active mode
- `src/lib/store.tsx` — only ensure `migrateProduct` covers the new shape (no API changes for callers)

### 7. Migration safety

`migrateProduct` is idempotent and handles three shapes:
1. New shape (core + overrides) — pass through
2. Current shape (per-marketplace blocks + customFields) — fold non-empty titles/descriptions into core (longest wins), tag existing customFields with their origin marketplace
3. Legacy v1 (already covered)

Nothing is deleted destructively; data lost only if user clears overrides explicitly.

### Out of scope (later phases)

- AI-driven cross-marketplace rewriting
- Saveable marketplace profile templates
- Per-mode visual theme beyond accent color

---

Approve and I implement the rework end-to-end in one pass.
