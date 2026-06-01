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
  const { ui, products, kits, goHome, openKits, openSettings, createProduct, openProduct } = useStore();
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
      description: "Você precisará fazer login novamente para acessar seus dados.",
      confirmLabel: "Sair",
      cancelLabel: "Cancelar",
      variant: "destructive"
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
          "absolute inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
          "transition-[width] duration-200 ease-in-out will-change-[width]",
          !pinned && isActuallyExpanded && "shadow-[12px_0_48px_-12px_rgba(0,0,0,0.5)]"
        )}
        style={{ width: isActuallyExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      >
        {/* Brand Area */}
        <div className="relative flex items-center h-16 px-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div 
              className="h-[30px] w-[30px] shrink-0 rounded-[8px] overflow-hidden bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary border border-primary/20"
              title={settings.companyName || "JT"}
            >
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                initials(settings.companyName)
              )}
            </div>
            
            {isActuallyExpanded && (
              <span className="font-semibold text-sm truncate animate-in fade-in duration-300">
                {settings.companyName || "JTD Motors"}
              </span>
            )}
          </div>

          <button
            onClick={togglePin}
            title={pinned ? "Soltar sidebar" : "Fixar sidebar"}
            className={cn(
              "p-1 rounded-md transition-all",
              pinned
                ? "opacity-100 text-primary"           // fixado: sempre visível e azul
                : isActuallyExpanded
                  ? "opacity-100 text-muted-foreground hover:text-foreground"  // expandido: visível
                  : "opacity-0 pointer-events-none"    // fechado e não fixado: invisível
            )}
          >
            <Pin className={cn("h-3.5 w-3.5", pinned && "fill-current")} />
          </button>
        </div>

        {/* Nav Items */}
        <TooltipProvider delayDuration={0}>
          <nav className="flex flex-col gap-1 px-2 pt-2">
            <SidebarNavItem
              icon={LayoutDashboard}
              label="Dashboard"
              active={ui.view === "home" && !ui.selectedId}
              expanded={isActuallyExpanded}
              onClick={goHome}
            />
            <SidebarNavItem
              icon={Package2}
              label="Produtos"
              active={ui.view === "home" || ui.view === "product"}
              expanded={isActuallyExpanded}
              onClick={goHome}
            />
            <SidebarNavItem
              icon={Megaphone}
              label="Anúncios"
              active={false}
              expanded={isActuallyExpanded}
              onClick={goHome}
            />
            <SidebarNavItem
              icon={Layers}
              label="Kits"
              active={ui.view === "kits"}
              expanded={isActuallyExpanded}
              onClick={openKits}
            />

            <div className="my-2 mx-2 h-px bg-sidebar-border/50" />

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

            <div className="my-2 mx-2 h-px bg-sidebar-border/50" />

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
            <SidebarNavItem
              icon={LogOut}
              label="Sair"
              expanded={isActuallyExpanded}
              onClick={handleLogout}
              className="mt-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
            />
          </nav>
        </TooltipProvider>


        <div className="mt-auto p-2">
          <button
            onClick={() => createProduct()}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all",
              isActuallyExpanded ? "h-10 px-4 text-sm font-semibold" : "h-10"
            )}
            title="Novo produto"
          >
            <Plus className="h-4 w-4" />
            {isActuallyExpanded && <span>Novo produto</span>}
          </button>
        </div>

        <div className="p-3 border-t border-sidebar-border/50">
          <div className={cn(
            "text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium transition-all",
            !isActuallyExpanded && "text-center"
          )}>
            {isActuallyExpanded ? "JTD Motors Hub · v1.0" : "v1"}
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
        "group relative flex items-center w-full rounded-lg transition-all duration-200",
        expanded ? "h-10 px-3 gap-3" : "h-10 justify-center",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
        className
      )}
    >

      {active && (
        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
      )}
      
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
      
      {expanded && (
        <>
          <span className="flex-1 text-left text-sm truncate animate-in fade-in slide-in-from-left-1 duration-200">
            {label}
          </span>
          {comingSoon && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium animate-in fade-in duration-300 shrink-0">
              Em breve
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
        <TooltipContent side="right" sideOffset={10} className="font-medium text-xs">
          {label} {comingSoon && "(Em breve)"}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
