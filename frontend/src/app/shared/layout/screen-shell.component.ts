import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BackHeader } from './back-header.component';

@Component({
  selector: 'app-screen-shell',
  standalone: true,
  imports: [BackHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      @if (back()) {
        <app-back-header [title]="null" [fallback]="backFallback()" />
      }
      <header class="mb-8">
        @if (eyebrow()) {
          <p
            class="mb-3 font-headline text-xs font-bold uppercase tracking-[0.3em] text-primary"
          >
            {{ eyebrow() }}
          </p>
        }
        <h1
          class="font-headline text-3xl font-extrabold leading-tight tracking-tight text-on-surface sm:text-4xl"
        >
          {{ title() }}
        </h1>
        @if (subtitle()) {
          <p class="mt-3 max-w-2xl text-base leading-relaxed text-on-surface-variant">
            {{ subtitle() }}
          </p>
        }
      </header>
      <div>
        <ng-content />
      </div>
    </section>
  `,
})
export class ScreenShell {
  readonly eyebrow = input<string | null>(null);
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly back = input<boolean>(false);
  readonly backFallback = input<string | null>(null);
}
