import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Package2,
  Megaphone,
  Layers,
  BarChart2,
  ShoppingCart,
  DollarSign,
  Plug,
  Settings as SettingsIcon,
  Pin,
  Plus,
  LogOut
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfirm } from "@/components/ConfirmProvider";
import { supabase } from "@/lib/supabase";

const PIN_KEY = "jtd:sidebar-pinned";
const COLLAPSED_WIDTH = 56;
const EXPANDED_WIDTH = 216;

export function AppSidebar() {
  const { ui, goHome, openKits, openSettings, createProduct } = useStore();
  const { settings } = useSettings();
  const confirm = useConfirm();
  
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(() => {
    try {
      return localStorage.getItem(PIN_KEY) === "true";
    } catch {
      return false;
    }
  });

  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    if (!pinned) setExpanded(true);
  };

  const handleMouseLeave = () => {
    if (pinned) return;
    leaveTimer.current = setTimeout(() => setExpanded(false), 180);
  };

  const togglePin = () => {
    const next = !pinned;
    setPinned(next);
    if (next) setExpanded(true);
    try {
      localStorage.setItem(PIN_KEY, String(next));
    } catch {}
  };

  const isActuallyExpanded = expanded || pinned;

  const initials = (name: string) =>
    (name || "JT")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "JT";

  const handleComingSoon = () => {
    toast.info("Em breve — disponível na próxima versão");
  };

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: "Deseja sair da sua conta?",
      message: "Você precisará fazer login novamente para acessar seus dados.",
      confirmLabel: "Sair",
      cancelLabel: "Cancelar",
      tone: "danger"
    });

    if (isConfirmed) {
      await supabase.auth.signOut();
    }
  };

  return (
    <div
      className="relative h-screen shrink-0 transition-[width] duration-200 ease-in-out"
      style={{ width: pinned ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
    >
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "absolute inset-y-0 left-0 z-40 flex flex-col bg-black text-white border-r border-white/5",
          "transition-[width] duration-200 ease-in-out will-change-[width]",
          !pinned && isActuallyExpanded && "shadow-[20px_0_50px_rgba(0,0,0,0.8)]"
        )}
        style={{ width: isActuallyExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      >
        {/* Brand Area */}
        <div className="relative flex items-center h-20 px-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div 
              className="h-8 w-8 shrink-0 rounded-[10px] overflow-hidden bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] flex items-center justify-center text-[11px] font-black text-white italic border border-orange-400/30"
              title={settings.companyName || "JT"}
            >
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                initials(settings.companyName)
              )}
            </div>
            
            {isActuallyExpanded && (
              <span className="font-black text-xs uppercase tracking-widest truncate animate-in fade-in duration-500 italic bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                {settings.companyName || "JTD Motors"}
              </span>
            )}
          </div>

          <button
            onClick={togglePin}
            title={pinned ? "Soltar sidebar" : "Fixar sidebar"}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              pinned
                ? "opacity-100 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                : isActuallyExpanded
                  ? "opacity-60 text-neutral-500 hover:text-white hover:opacity-100"
                  : "opacity-0 pointer-events-none"
            )}
          >
            <Pin className={cn("h-3.5 w-3.5", pinned && "fill-current")} />
          </button>
        </div>

        {/* Nav Items */}
        <TooltipProvider delayDuration={0}>
          <nav className="flex flex-col gap-1 px-2 pt-2 overflow-y-auto overflow-x-hidden flex-1 scrollbar-none">
            <SidebarNavItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={ui.view === "home"}
              expanded={isActuallyExpanded}
              onClick={goHome}
            />
            <SidebarNavItem
              icon={Package2}
              label="Produtos"
              active={ui.view === "product"}
              expanded={isActuallyExpanded}
              onClick={goHome}
            />
            <SidebarNavItem
              icon={Megaphone}
              label="Anúncios"
              active={false}
              expanded={isActuallyExpanded}
              onClick={() => {}}
            />
            <SidebarNavItem
              icon={Layers}
              label="Kits"
              active={ui.view === "kits"}
              expanded={isActuallyExpanded}
              onClick={openKits}
            />

            <div className="my-4 mx-3 h-px bg-white/5" />

            <SidebarNavItem
              icon={BarChart2}
              label="Métricas"
              expanded={isActuallyExpanded}
              onClick={handleComingSoon}
              comingSoon
            />
            <SidebarNavItem
              icon={ShoppingCart}
              label="Compras"
              expanded={isActuallyExpanded}
              onClick={handleComingSoon}
              comingSoon
            />
            <SidebarNavItem
              icon={DollarSign}
              label="Vendas"
              expanded={isActuallyExpanded}
              onClick={handleComingSoon}
              comingSoon
            />

            <div className="my-4 mx-3 h-px bg-white/5" />

            <SidebarNavItem
              icon={Plug}
              label="API"
              expanded={isActuallyExpanded}
              onClick={handleComingSoon}
              comingSoon
            />
            <SidebarNavItem
              icon={SettingsIcon}
              label="Configurações"
              active={ui.view === "settings"}
              expanded={isActuallyExpanded}
              onClick={openSettings}
            />
          </nav>
        </TooltipProvider>

        <div className="mt-auto flex flex-col gap-1 p-3 border-t border-white/5 bg-neutral-900/10">
          <button
            onClick={() => createProduct()}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:bg-orange-400 transition-all active:scale-[0.97]",
              isActuallyExpanded ? "h-11 px-4 text-xs font-black uppercase tracking-widest" : "h-11"
            )}
            title="Novo produto"
          >
            <Plus className="h-4 w-4" />
            {isActuallyExpanded && <span>Novo produto</span>}
          </button>

          <button
            onClick={handleLogout}
            className={cn(
              "mt-1 flex items-center gap-2 rounded-xl text-red-500/80 hover:bg-red-500/10 transition-all",
              isActuallyExpanded ? "h-11 px-4 text-xs font-black uppercase tracking-widest" : "h-11 justify-center"
            )}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
            {isActuallyExpanded && <span>Sair</span>}
          </button>
        </div>

        <div className="p-4 border-t border-white/5">
          <div className={cn(
            "text-[9px] uppercase tracking-[0.3em] text-neutral-600 font-bold transition-all italic",
            !isActuallyExpanded && "text-center opacity-40"
          )}>
            {isActuallyExpanded ? "JTD Motors Hub · v1.0" : "v1.0"}
          </div>
        </div>
      </aside>
    </div>
  );
}

function SidebarNavItem({
  icon: Icon,
  label,
  active,
  expanded,
  onClick,
  comingSoon,
  className
}: {
  icon: any;
  label: string;
  active?: boolean;
  expanded: boolean;
  onClick: () => void;
  comingSoon?: boolean;
  className?: string;
}) {
  const content = (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center w-full rounded-xl transition-all duration-300",
        expanded ? "h-11 px-4 gap-3" : "h-11 justify-center",
        active
          ? "bg-orange-500/10 text-orange-500 font-black shadow-[inset_0_0_20px_rgba(249,115,22,0.05)]"
          : "text-neutral-500 hover:bg-white/5 hover:text-white",
        className
      )}
    >
      {active && (
        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
      )}
      
      <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", active && "text-orange-500")} />
      
      {expanded && (
        <>
          <span className="flex-1 text-left text-[11px] font-bold uppercase tracking-widest truncate animate-in fade-in slide-in-from-left-1 duration-300">
            {label}
          </span>
          {comingSoon && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-500/60 font-black uppercase tracking-tighter border border-orange-500/20 animate-in fade-in duration-500 shrink-0">
              EM BREVE
            </span>
          )}
        </>
      )}
    </button>
  );

  if (!expanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10} className="font-bold text-[10px] uppercase tracking-widest bg-neutral-900 border-neutral-800 text-white">
          {label} {comingSoon && "(Em breve)"}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
