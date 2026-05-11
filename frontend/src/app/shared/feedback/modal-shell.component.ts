import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-[68] flex items-stretch justify-center sm:items-center"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          aria-label="Fermer"
          (click)="closed.emit()"
        ></button>
        <div
          class="relative flex w-full flex-col overflow-hidden bg-surface ghost-border sm:max-h-[90vh] sm:max-w-lg sm:squircle-2xl shadow-[var(--shadow-elev-2)]"
        >
          <header
            class="flex items-center justify-between border-b border-outline-variant px-5 py-3"
          >
            <h2 class="font-headline text-base font-bold text-on-surface">{{ title() }}</h2>
            <button
              type="button"
              class="flex size-9 items-center justify-center squircle-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Fermer"
              (click)="closed.emit()"
            >
              <span class="icon-[heroicons--x-mark] text-base" aria-hidden="true"></span>
            </button>
          </header>
          <div class="flex-1 overflow-y-auto p-5">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalShell {
  readonly open = input<boolean>(false);
  readonly title = input.required<string>();
  readonly closed = output<void>();
}
