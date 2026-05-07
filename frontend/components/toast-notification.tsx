'use client';

import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Global toast store
const toasts: Toast[] = [];
const listeners: Set<(toasts: Toast[]) => void> = new Set();
const timeouts = new Map<string, number>();

export function createToast(
  message: string,
  type: ToastType = 'info',
  duration = 5000
): string {
  const id = Math.random().toString(36).substring(7);
  const toast: Toast = { id, message, type, duration };

  toasts.push(toast);
  notifyListeners();

  if (duration) {
    const timeoutId = window.setTimeout(() => {
      timeouts.delete(id);  // Remove from map
      dismissToast(id);
    }, duration);
    timeouts.set(id, timeoutId);  // Store timeout ID
  }

  return id;
}

export function dismissToast(id: string): void {
  // Clear timeout if it exists
  const timeoutId = timeouts.get(id);
  if (timeoutId !== undefined) {
    window.clearTimeout(timeoutId);
    timeouts.delete(id);
  }

  const index = toasts.findIndex((t) => t.id === id);
  if (index !== -1) {
    toasts.splice(index, 1);
    notifyListeners();
  }
}

// For testing only - clears all toasts
export function clearAllToasts(): void {
  // Clear all pending timeouts
  timeouts.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });
  timeouts.clear();
  
  toasts.length = 0;
  notifyListeners();
}

function notifyListeners(): void {
  listeners.forEach((listener) => {
    listener([...toasts]);
  });
}

export function ToastContainer(): React.ReactElement {
  const [toastList, setToastList] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setToastList);
    return (): void => {
      listeners.delete(setToastList);
    };
  }, []);

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:bottom-5 sm:left-auto sm:right-5 z-50 flex flex-col gap-2.5 sm:max-w-[400px] pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toastList.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}

function ToastItem({ id, message, type }: Toast): React.ReactElement {
  const getIcon = (): string => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  const baseClasses = "flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 rounded-lg bg-white shadow-lg animate-slide-in pointer-events-auto text-xs sm:text-sm leading-normal max-w-full";
  const typeClasses = {
    success: "border-l-4 border-l-emerald-500",
    error: "border-l-4 border-l-red-500",
    warning: "border-l-4 border-l-amber-500",
    info: "border-l-4 border-l-blue-500"
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={`font-bold text-base min-w-6 text-center flex-shrink-0 ${
          type === 'success' ? 'text-emerald-500' :
          type === 'error' ? 'text-red-500' :
          type === 'warning' ? 'text-amber-500' :
          'text-blue-500'
        }`}>{getIcon()}</span>
        <p className="m-0 text-gray-900 break-words flex-1">{message}</p>
      </div>
      <button
        className="bg-none border-none cursor-pointer text-2xl text-gray-400 px-0 py-0 ml-3 flex-shrink-0 transition-colors duration-200 w-6 h-6 flex items-center justify-center hover:text-gray-900 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 rounded-sm"
        onClick={() => {
          dismissToast(id);
        }}
        aria-label="Close notification"
        type="button"
      >
        ×
      </button>
    </div>
  );
}

export function useToast(): {
  success: (message: string) => string;
  error: (message: string) => string;
  warning: (message: string) => string;
  info: (message: string) => string;
} {
  return {
    success: (message: string): string => createToast(message, 'success'),
    error: (message: string): string => createToast(message, 'error', 7000),
    warning: (message: string): string => createToast(message, 'warning'),
    info: (message: string): string => createToast(message, 'info'),
  };
}
