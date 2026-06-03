import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import { AppSidebar } from "@/components/AppSidebar";
import { ProductWorkspace } from "@/components/ProductWorkspace";
import { HomeScreen } from "@/components/HomeScreen";
import { ViralLibraryScreen } from "@/components/ViralLibraryScreen";
import { SettingsScreen } from "@/components/SettingsScreen";
import { StorageBanner } from "@/components/StorageBanner";
import { ConfirmProvider } from "@/components/ConfirmProvider";
import { CommandPaletteProvider } from "@/components/CommandPalette";
import { KitsScreen } from "@/components/KitsScreen";
import { supabase } from "@/lib/supabase";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { LoadingScreen } from "@/components/LoadingScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JTD Motors Hub — Workspace operacional" },
      {
        name: "description",
        content:
          "Workspace operacional para criação de produtos, análise de concorrentes, SEO, mídia e precificação.",
      },
    ],
  }),
  component: Index,
});


function Index() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jtd:theme") ?? "dark";
      document.documentElement.classList.toggle(
        "dark",
        saved === "dark"
      );
    } catch {}
  }, []);

  if (loading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;

  return (
    <StoreProvider>
      <ConfirmProvider>
        <CommandPaletteProvider>
          <div className="flex h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
            <AppSidebar />
            <div className="flex flex-1 flex-col min-w-0">
              <StorageBanner />
              <Main />
            </div>
          </div>
        </CommandPaletteProvider>
      </ConfirmProvider>
    </StoreProvider>
  );
}



function Main() {
  const { ui, dataLoading } = useStore();

  if (dataLoading) return <LoadingScreen />;

  if (ui.view === "home") return <HomeScreen />;

  if (ui.view === "viral") return <ViralLibraryScreen />;

  if (ui.view === "settings") return <SettingsScreen />;

  if (ui.view === "kits") return <KitsScreen />;

  return <ProductWorkspace />;
}
