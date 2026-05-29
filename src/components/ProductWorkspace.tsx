import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Star,
  Trash2,
  Copy,
  Check,
  Plus,
  Upload,
  Download,
  ExternalLink,
  ChevronDown,
  X,
  GripVertical,
  Cloud,
  RefreshCw,
  Save,
  Calculator,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  MinusCircle,
  PlusCircle,
  Hash,
  DollarSign,
  Percent,
} from "lucide-react";
import { FloatingKeywordInput, FloatingKeywordCloud } from "./KeywordTools";
import { useStore, useSelectedProduct } from "@/lib/store";
import { useConfirm } from "@/components/ConfirmProvider";
import {
  parseSingleWords,
  parseKeywordTokens,
  canonKeyword,
  emptyPricing,
  type Product,
  type Keyword,
  type TitleVariant,
  type PricingData,
  type CompetitorBlock,
  type MarketplaceData,
  type MarketplaceId,
  type ProductVideo,
  type CostItem,
  type CostGroup,
  type CostKind,
} from "@/lib/types";
import {
  computePricing,
  simulateScenario,
  analyzePrice,
  brl,
  GROUP_LABELS,
  GROUP_ORDER,
  type Alert as PricingAlert,
  type PriceAnalysis,
  type PriceStatus,
  type BreakdownLine,
} from "@/lib/pricing";
import {
  Btn,
  Field,
  SectionTitle,
  TextInput,
  AutoTextArea,
} from "@/components/ui-kit";
import { CustomFieldsPanel } from "@/components/CustomFieldsPanel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ProductWorkspace() { return null; }
