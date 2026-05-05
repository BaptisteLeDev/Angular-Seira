import { Injectable, signal } from '@angular/core';

export type ConfirmTone = 'default' | 'danger';

export interface ConfirmRequest {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

interface ActiveRequest extends ConfirmRequest {
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly _active = signal<ActiveRequest | null>(null);
  readonly active = this._active.asReadonly();

  confirm(request: ConfirmRequest): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const previous = this._active();
      if (previous) {
        previous.resolve(false);
      }
      this._active.set({ ...request, resolve });
    });
  }

  resolveActive(value: boolean): void {
    const current = this._active();
    if (!current) return;
    current.resolve(value);
    this._active.set(null);
  }
}
