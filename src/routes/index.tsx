import { createFileRoute } from "@tanstack/react-router";
import { StoreProvider, useStore } from "@/lib/store";
import { AppSidebar } from "@/components/AppSidebar";
import { ProductWorkspace } from "@/components/ProductWorkspace";
import { HomeScreen } from "@/components/HomeScreen";
import { ViralLibraryScreen } from "@/components/ViralLibraryScreen";
import { ConfirmProvider } from "@/components/ConfirmProvider";
import { CommandPaletteProvider } from "@/components/CommandPalette";

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
  return (
    <StoreProvider>
      <ConfirmProvider>
        <CommandPaletteProvider>
          <div className="dark flex h-screen w-full overflow-hidden bg-background text-foreground">
            <AppSidebar />
            <Main />
          </div>
        </CommandPaletteProvider>
      </ConfirmProvider>
    </StoreProvider>
  );
}

function Main() {
  const { ui } = useStore();
  if (ui.view === "home") return <HomeScreen />;
  if (ui.view === "viral") return <ViralLibraryScreen />;
  return <ProductWorkspace />;
}

