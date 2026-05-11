import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  durationMs: number;
}

interface ToastOptions {
  durationMs?: number;
}

const DEFAULT_DURATION_MS = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string, opts?: ToastOptions): number {
    return this.push('success', message, opts);
  }

  error(message: string, opts?: ToastOptions): number {
    return this.push('error', message, opts);
  }

  info(message: string, opts?: ToastOptions): number {
    return this.push('info', message, opts);
  }

  warning(message: string, opts?: ToastOptions): number {
    return this.push('warning', message, opts);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(tone: ToastTone, message: string, opts?: ToastOptions): number {
    const id = this.nextId++;
    const durationMs = opts?.durationMs ?? DEFAULT_DURATION_MS;
    const toast: Toast = { id, tone, message, durationMs };
    this._toasts.update((list) => [...list, toast]);
    if (durationMs > 0) {
      setTimeout(() => this.dismiss(id), durationMs);
    }
    return id;
  }
}
