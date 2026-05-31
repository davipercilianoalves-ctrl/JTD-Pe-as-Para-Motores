import { useState, useEffect } from "react";

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
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

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

  const update = (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(SETTINGS_EVENT));
      } catch (err) {
        console.error("Failed to save settings:", err);
      }
      return next;
    });
  };

  return { settings, update };
}
