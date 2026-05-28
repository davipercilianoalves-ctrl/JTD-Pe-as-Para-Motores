// Backup & restore utilities for the JTD Motors Hub app.
// All app data lives in localStorage — these helpers serialize, validate
// and restore every key without depending on any external service.

// ATENÇÃO: imagens salvas em base64 no localStorage aumentam o
// tamanho em ~37%. Se o app salvar muitas imagens, o armazenamento
// pode atingir o limite rapidamente. Limite seguro: até 2MB de uso.
// Acima de 4MB o risco de falha em backup/importação é alto.

const APP_PREFIX = "jtd";
const APP_NAME = "JTD Motors Hub";
const BACKUP_VERSION = "1.0";
const STORAGE_LIMIT_MB = 5;

export interface BackupFile {
  version: string;
  exportedAt: string;
  appName: string;
  data: Record<string, string>;
}

function readAppKeys(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key);
    if (value !== null) out[key] = value;
  }
  return out;
}

function slugify(s: string): string {
  return (s || "jtd-motors")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "jtd-motors";
}

function todayStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function exportData(companyName = "jtd-motors"): void {
  const payload: BackupFile = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appName: APP_NAME,
    data: readAppKeys(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-${slugify(companyName)}-${todayStamp()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isValidBackup(value: unknown): value is BackupFile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.version !== "string") return false;
  if (!v.data || typeof v.data !== "object") return false;
  for (const [k, val] of Object.entries(v.data as Record<string, unknown>)) {
    if (typeof k !== "string" || typeof val !== "string") return false;
  }
  return true;
}

export async function importData(file: File): Promise<void> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Arquivo inválido ou corrompido");
  }
  if (!isValidBackup(parsed)) {
    throw new Error("Arquivo inválido ou corrompido");
  }
  // Wipe only app-owned keys, then restore.
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(APP_PREFIX)) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
  for (const [k, v] of Object.entries(parsed.data)) {
    try {
      localStorage.setItem(k, v);
    } catch {
      throw new Error(
        "Falha ao restaurar backup. Espaço do navegador excedido."
      );
    }
  }
  window.location.reload();
}

export function getStorageUsage(): { usedMB: number; percent: number } {
  let usedMB = 0;
  try {
    const bytes = new Blob([JSON.stringify(localStorage)]).size;
    usedMB = bytes / (1024 * 1024);
  } catch {
    usedMB = 0;
  }
  const percent = (usedMB / STORAGE_LIMIT_MB) * 100;
  return { usedMB, percent };
}

export const STORAGE_LIMIT = STORAGE_LIMIT_MB;
