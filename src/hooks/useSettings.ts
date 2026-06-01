import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";

const SETTINGS_KEY = "jtd:settings";
const SETTINGS_EVENT = "jtd:settings-changed";

export interface AppSettings {
  companyName: string;
  logoUrl: string;
  phone: string;
  email: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  companyName: "",
  logoUrl: "",
  phone: "",
  email: "",
};

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const loadSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("company_name, logo_url, phone, email")
          .eq("id", user.id)
          .single();

        if (error) {
          if (error.code !== "PGRST116") { // single row not found is okay
            console.error("Erro ao carregar configurações:", error);
          }
        } else if (data) {
          const syncedSettings = {
            companyName: data.company_name || "",
            logoUrl: data.logo_url || "",
            phone: data.phone || "",
            email: data.email || "",
          };
          setSettings(syncedSettings);
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(syncedSettings));
        }
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.id]);

  useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
          setSettings(JSON.parse(raw));
        }
      } catch (err) {
        console.error("Failed to sync settings:", err);
      }
    };

    window.addEventListener(SETTINGS_EVENT, handler);
    return () => window.removeEventListener(SETTINGS_EVENT, handler);
  }, []);

  const update = async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(SETTINGS_EVENT));

      if (user?.id) {
        const { error } = await supabase
          .from("profiles")
          .update({
            company_name: next.companyName,
            logo_url: next.logoUrl,
            phone: next.phone,
            email: next.email,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) {
          console.error("Erro ao salvar configurações no Supabase:", error);
          toast.error("Erro ao sincronizar configurações");
        }
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  return { settings, update, loading };
}
