import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-error-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="alert"
      class="squircle-xl bg-error-container p-5"
      style="border: 1px solid color-mix(in srgb, var(--color-error) 50%, transparent);"
    >
      <h3 class="font-headline text-lg font-bold text-on-error-container">{{ title() }}</h3>
      <p class="mt-2 text-sm text-on-error-container">{{ message() }}</p>
    </div>
  `,
})
export class ErrorCard {
  readonly title = input<string>('Erreur de chargement');
  readonly message = input.required<string>();
}
