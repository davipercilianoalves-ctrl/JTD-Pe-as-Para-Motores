import { createFileRoute } from "@tanstack/react-router";
import { StoreProvider } from "@/lib/store";
import { AppSidebar } from "@/components/AppSidebar";
import { ProductWorkspace } from "@/components/ProductWorkspace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JTD Motors Hub — Workspace de produtos" },
      {
        name: "description",
        content:
          "Sistema completo de criação e gestão de produtos para marketplaces de autopeças e motores.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <StoreProvider>
      <div className="dark flex h-screen w-full overflow-hidden bg-background text-foreground">
        <AppSidebar />
        <ProductWorkspace />
      </div>
    </StoreProvider>
  );
}
