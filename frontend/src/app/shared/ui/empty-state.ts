import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex w-full flex-col items-center justify-center squircle-xl bg-surface-container p-10 text-center ghost-border"
      role="status"
    >
      <span
        class="text-5xl text-on-surface-variant"
        [class]="icon()"
        [style.color]="iconColor()"
        aria-hidden="true"
      ></span>
      <h3 class="mt-4 font-headline text-lg font-bold text-on-surface">{{ title() }}</h3>
      @if (description()) {
        <p class="mt-2 max-w-md text-sm text-on-surface-variant">{{ description() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyState {
  readonly icon = input<string>('icon-[heroicons--inbox]');
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly iconColor = input<string | null>(null);
}
