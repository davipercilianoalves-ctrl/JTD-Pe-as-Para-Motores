import React, { useState, useRef, useMemo, useEffect } from "react";
import { X, Plus, Copy, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Btn } from "@/components/ui-kit";

export function FloatingKeywordInput({
  initialKeywords,
  onAdd,
  onRemove,
  onClose,
  position,
}: {
  initialKeywords: string[];
  onAdd: (word: string) => void;
  onRemove: (word: string) => void;
  onClose: () => void;
  position: { top: number; left: number };
}) {
  const [text, setText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const [pos, setPos] = useState(() => ({
    x: position.left,
    y: position.top,
  }));
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    dragging.current = true;
    offset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  };

  useEffect(() => {
    if (isMobile) return;
    const handleMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const WINDOW_W = 288;
      const WINDOW_H = 360;
      const newX = e.clientX - offset.current.x;
      const newY = e.clientY - offset.current.y;

      setPos({
        x: Math.max(0, Math.min(window.innerWidth - WINDOW_W, newX)),
        y: Math.max(0, Math.min(window.innerHeight - WINDOW_H, newY)),
      });
    };
    const handleUp = () => {
      dragging.current = false;
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) && !dragging.current) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [onClose, isMobile]);

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-popover border-t border-border rounded-t-xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold uppercase tracking-wider">Palavras-chave</span>
          <button onClick={onClose} className="p-1"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 rounded-lg bg-input/40 px-3 py-2 text-base outline-none border border-border/40"
            placeholder="Adicionar..."
            autoFocus
          />
          <Btn onClick={handleAdd}>Add</Btn>
        </div>
        <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto pb-4">
          {initialKeywords.map((w) => (
            <span key={w} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
              {w}
              <button onClick={() => onRemove(w)}><X className="h-4 w-4" /></button>
            </span>
          ))}
          {initialKeywords.length === 0 && (
            <span className="text-xs text-muted-foreground w-full text-center py-4">Nenhuma palavra extraída</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-72 bg-popover border border-border rounded-xl shadow-xl p-4 flex flex-col gap-3"
      style={{ top: pos.y, left: pos.x }}
    >
      <div 
        className="flex items-center justify-between cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <span className="text-sm font-medium">Palavras-chave</span>
        <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
      </div>
      <div className="flex gap-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 rounded-lg bg-input/40 px-3 py-2 text-sm outline-none"
          placeholder="Adicionar..."
        />
        <Btn size="sm" onClick={handleAdd}>Adicionar</Btn>
      </div>
      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
        {initialKeywords.map((w) => (
          <span key={w} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
            {w}
            <button onClick={() => onRemove(w)}><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function FloatingKeywordCloud({
  keywords,
  onClose,
  productName,
}: {
  keywords: { text: string; source: string }[];
  onClose: () => void;
  productName: string;
}) {
  const [pos, setPos] = useState({ x: window.innerWidth - 350, y: window.innerHeight - 450 });
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    setDragging(true);
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging) return;
      const WINDOW_W = 320;
      const WINDOW_H = 400;
      const newX = e.clientX - offset.current.x;
      const newY = e.clientY - offset.current.y;
      
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - WINDOW_W, newX)),
        y: Math.max(0, Math.min(window.innerHeight - WINDOW_H, newY)),
      });
    };
    const handleUp = () => setDragging(false);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [dragging]);

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-background py-1">
          <span className="font-semibold text-sm">Todas as palavras ({productName})</span>
          <button onClick={onClose} className="p-1"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex flex-wrap gap-2 mb-20">
          {keywords.map((kw, i) => (
            <span key={i} title={kw.source} className="bg-secondary px-3 py-1.5 rounded-lg text-sm">
              {kw.text}
            </span>
          ))}
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Btn className="w-full" onClick={() => navigator.clipboard.writeText(keywords.map(k => k.text).join(", "))}>
            <Copy className="h-4 w-4 mr-2" /> Copiar todas
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed z-50 w-80 bg-background border border-border rounded-xl shadow-2xl flex flex-col max-h-[70vh] overflow-hidden"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="px-4 py-3 border-b flex items-center justify-between cursor-grab" onMouseDown={handleMouseDown}>
        <span className="font-medium text-sm">Todas as palavras ({productName})</span>
        <button onClick={onClose}><X className="h-4 w-4" /></button>
      </div>
      <div className="p-4 overflow-y-auto flex flex-wrap gap-1.5">
        {keywords.map((kw, i) => (
          <span key={i} title={kw.source} className="bg-secondary px-2 py-0.5 rounded text-xs">
            {kw.text}
          </span>
        ))}
      </div>
      <div className="p-3 border-t">
        <Btn size="sm" className="w-full" onClick={() => navigator.clipboard.writeText(keywords.map(k => k.text).join(", "))}>
          <Copy className="h-3.5 w-3.5 mr-1" /> Copiar todas
        </Btn>
      </div>
    </div>
  );
}
