import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, type ToastTone } from './toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      aria-live="polite"
      aria-atomic="false"
    >
      @for (toast of svc.toasts(); track toast.id) {
        <div
          role="status"
          class="pointer-events-auto flex w-full max-w-sm items-start gap-3 squircle-lg bg-surface-container px-4 py-3 text-sm text-on-surface shadow-[var(--shadow-elev-2)] ghost-border border-l-4"
          [class.border-cat-comm]="toast.tone === 'success'"
          [class.border-error]="toast.tone === 'error'"
          [class.border-cat-project]="toast.tone === 'warning'"
          [class.border-primary]="toast.tone === 'info'"
        >
          <span
            class="mt-0.5 text-lg"
            [class]="iconClass(toast.tone)"
            aria-hidden="true"
          ></span>
          <p class="flex-1 leading-snug">{{ toast.message }}</p>
          <button
            type="button"
            class="squircle-sm -m-1 p-1 text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            (click)="svc.dismiss(toast.id)"
            aria-label="Fermer la notification"
          >
            <span class="icon-[heroicons--x-mark] text-base" aria-hidden="true"></span>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly svc = inject(ToastService);

  protected iconClass(tone: ToastTone): string {
    switch (tone) {
      case 'success':
        return 'icon-[heroicons--check-circle-solid] text-cat-comm';
      case 'error':
        return 'icon-[heroicons--exclamation-circle-solid] text-error';
      case 'warning':
        return 'icon-[heroicons--exclamation-triangle-solid] text-cat-project';
      case 'info':
      default:
        return 'icon-[heroicons--information-circle-solid] text-primary';
    }
  }
}
