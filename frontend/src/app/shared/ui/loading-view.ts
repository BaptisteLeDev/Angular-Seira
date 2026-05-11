import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Spinner } from './spinner';

@Component({
  selector: 'app-loading-view',
  standalone: true,
  imports: [Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex w-full flex-col items-center justify-center gap-3 py-12 text-on-surface-variant"
      role="status"
      [attr.aria-label]="label()"
    >
      <app-spinner size="lg" tone="primary" />
      @if (label()) {
        <p class="text-sm">{{ label() }}</p>
      }
    </div>
  `,
})
export class LoadingView {
  readonly label = input<string>('Chargement…');
}
