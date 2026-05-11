import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

export interface DropdownOption<T = unknown> {
  readonly value: T;
  readonly label: string;
  readonly hint?: string;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 squircle-md bg-surface-container px-4 py-2.5 text-left text-sm text-on-surface ghost-border transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        [attr.aria-expanded]="open()"
        [attr.aria-haspopup]="'listbox'"
        (click)="toggle()"
      >
        <span class="min-w-0 flex-1 truncate">
          {{ activeLabel() }}
        </span>
        <span
          class="text-base text-on-surface-variant transition-transform"
          [class.rotate-180]="open()"
          [class]="'icon-[heroicons--chevron-down]'"
          aria-hidden="true"
        ></span>
      </button>

      @if (open()) {
        <ul
          role="listbox"
          class="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto squircle-lg bg-surface-container ghost-border shadow-[var(--shadow-elev-2)]"
        >
          @for (opt of options(); track opt.value) {
            <li role="option" [attr.aria-selected]="isSelected(opt)">
              <button
                type="button"
                class="flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                [class.bg-primary]="isSelected(opt)"
                [class.text-on-primary]="isSelected(opt)"
                [class.text-on-surface]="!isSelected(opt)"
                (click)="select(opt)"
              >
                <span class="min-w-0 flex-1">
                  <span class="block truncate font-medium">{{ opt.label }}</span>
                  @if (opt.hint) {
                    <span
                      class="block truncate text-[11px]"
                      [class.text-on-primary]="isSelected(opt)"
                      [class.text-on-surface-variant]="!isSelected(opt)"
                    >
                      {{ opt.hint }}
                    </span>
                  }
                </span>
                @if (isSelected(opt)) {
                  <span
                    class="icon-[heroicons--check] text-base"
                    aria-hidden="true"
                  ></span>
                }
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class Dropdown<T = unknown> {
  readonly options = input.required<readonly DropdownOption<T>[]>();
  readonly value = model<T | null>(null);
  readonly placeholder = input<string>('— Choisir —');

  protected readonly open = signal(false);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly activeLabel = computed(() => {
    const v = this.value();
    if (v === null || v === undefined) return this.placeholder();
    const opt = this.options().find((o) => o.value === v);
    return opt?.label ?? this.placeholder();
  });

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  protected isSelected(opt: DropdownOption<T>): boolean {
    return this.value() === opt.value;
  }

  protected select(opt: DropdownOption<T>): void {
    this.value.set(opt.value);
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target;
    if (target && !this.host.nativeElement.contains(target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.open.set(false);
  }
}
