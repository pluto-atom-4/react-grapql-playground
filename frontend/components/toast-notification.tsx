'use client';

import React, { useEffect, useState } from 'react';
import './toast-notification.css';

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
      className="toast-container"
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

  return (
    <div className={`toast toast-${type}`} role="alert">
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <p className="toast-message">{message}</p>
      </div>
      <button
        className="toast-close"
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
