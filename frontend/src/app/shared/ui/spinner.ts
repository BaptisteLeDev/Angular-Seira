import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerTone = 'primary' | 'on-surface' | 'on-primary' | 'error';

@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
      [class.h-4]="size() === 'sm'"
      [class.w-4]="size() === 'sm'"
      [class.h-6]="size() === 'md'"
      [class.w-6]="size() === 'md'"
      [class.h-10]="size() === 'lg'"
      [class.w-10]="size() === 'lg'"
      [class.text-primary]="tone() === 'primary'"
      [class.text-on-surface]="tone() === 'on-surface'"
      [class.text-on-primary]="tone() === 'on-primary'"
      [class.text-error]="tone() === 'error'"
      role="status"
      [attr.aria-label]="label()"
    ></span>
  `,
})
export class Spinner {
  readonly size = input<SpinnerSize>('md');
  readonly tone = input<SpinnerTone>('primary');
  readonly label = input<string>('Chargement en cours');
}
