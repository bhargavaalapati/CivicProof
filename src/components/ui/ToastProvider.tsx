"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ToastTone = "success" | "info" | "warning" | "error";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: {
    success: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, { box: string; icon: typeof Info }> = {
  success: {
    box: "bg-slate-950 text-white border-slate-800",
    icon: CheckCircle2,
  },
  info: {
    box: "bg-blue-950 text-white border-blue-800",
    icon: Info,
  },
  warning: {
    box: "bg-amber-50 text-amber-950 border-amber-300",
    icon: AlertTriangle,
  },
  error: {
    box: "bg-red-50 text-red-950 border-red-300",
    icon: AlertTriangle,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((prev) => [...prev.slice(-3), { id, title, description, tone }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const value: ToastContextValue = {
    toast: {
      success: (t, d) => push("success", t, d),
      info: (t, d) => push("info", t, d),
      warning: (t, d) => push("warning", t, d),
      error: (t, d) => push("error", t, d),
    },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 w-[calc(100vw-2rem)] max-w-sm pointer-events-none print:hidden"
      >
        {items.map((item) => {
          const style = TONE_STYLES[item.tone];
          const Icon = style.icon;
          return (
            <div
              key={item.id}
              role="status"
              className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg flex items-start gap-3 transition-all ${style.box}`}
            >
              <Icon className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 min-w-0 text-xs sm:text-sm">
                <p className="font-semibold leading-snug">{item.title}</p>
                {item.description && (
                  <p className="opacity-85 text-xs mt-0.5 leading-snug">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="opacity-70 hover:opacity-100 p-1 -mr-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

const NOOP_TOAST: ToastContextValue["toast"] = {
  success: () => {},
  info: () => {},
  warning: () => {},
  error: () => {},
};

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx ? ctx.toast : NOOP_TOAST;
}