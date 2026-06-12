import { useState, useCallback } from "react";

export interface ToastState {
  id: number;
  message: string;
  type: "info" | "error" | "success";
}

let idCounter = 1;

export const useToastController = () => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastState["type"] = "info") => {
      const id = idCounter++;
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3500);
    },
    [setToasts]
  );

  return { toasts, showToast };
};
