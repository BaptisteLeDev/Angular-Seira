import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (svc.active(); as req) {
      <div
        class="fixed inset-0 z-[70] flex items-center justify-center px-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'confirm-dialog-title'"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          aria-label="Annuler"
          (click)="cancel()"
        ></button>
        <div
          class="relative w-full max-w-md squircle-2xl bg-surface-container p-6 ghost-border shadow-[var(--shadow-elev-2)]"
        >
          <h2
            id="confirm-dialog-title"
            class="font-headline text-lg font-bold text-on-surface"
          >
            {{ req.title }}
          </h2>
          @if (req.message) {
            <p class="mt-2 text-sm text-on-surface-variant">{{ req.message }}</p>
          }
          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="squircle-md px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              (click)="cancel()"
            >
              {{ req.cancelLabel ?? 'Annuler' }}
            </button>
            <button
              #confirmBtn
              type="button"
              class="squircle-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              [class.bg-error]="req.tone === 'danger'"
              [class.text-on-error-container]="req.tone === 'danger'"
              [class.bg-primary]="req.tone !== 'danger'"
              [class.text-on-primary]="req.tone !== 'danger'"
              [class.hover:opacity-90]="true"
              (click)="confirm()"
            >
              {{ req.confirmLabel ?? 'Confirmer' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  protected readonly svc = inject(ConfirmDialogService);
  private readonly confirmBtn = viewChild<ElementRef<HTMLButtonElement>>('confirmBtn');

  constructor() {
    effect(() => {
      if (this.svc.active()) {
        queueMicrotask(() => this.confirmBtn()?.nativeElement.focus());
      }
    });
  }

  protected cancel(): void {
    this.svc.resolveActive(false);
  }

  protected confirm(): void {
    this.svc.resolveActive(true);
  }
}
