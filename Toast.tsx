import React, { useEffect, useState } from "react";
import { ToastState } from "../hooks/useToast";

// simple singleton for global access
declare global {
  interface Window {
    __wp_toast?: {
      push: (msg: ToastState) => void;
      subscribe: (cb: (msgs: ToastState[]) => void) => () => void;
    };
  }
}

if (!window.__wp_toast) {
  let listeners: ((msgs: ToastState[]) => void)[] = [];
  let messages: ToastState[] = [];
  window.__wp_toast = {
    push(msg: ToastState) {
      messages = [...messages, msg];
      listeners.forEach(l => l(messages));
      setTimeout(() => {
        messages = messages.filter(m => m.id !== msg.id);
        listeners.forEach(l => l(messages));
      }, 3500);
    },
    subscribe(cb: (msgs: ToastState[]) => void) {
      listeners.push(cb);
      cb(messages);
      return () => {
        listeners = listeners.filter(l => l !== cb);
      };
    }
  };
}

export const showGlobalToast = (
  message: string,
  type: ToastState["type"] = "info"
): void => {
  const id = Math.random();
  window.__wp_toast?.push({ id, message, type });
};

const Toast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  useEffect(() => {
    const unsub = window.__wp_toast?.subscribe(setToasts);
    return () => {
      if (unsub) unsub();
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        zIndex: 50
      }}
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className="card"
          style={{
            padding: "0.6rem 0.9rem",
            minWidth: "220px",
            borderLeftWidth: "3px",
            borderLeftStyle: "solid",
            borderLeftColor:
              t.type === "error" ? "#ef4444" : t.type === "success" ? "#22c55e" : "#3b82f6",
            fontSize: "0.9rem"
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
};

export default Toast;
