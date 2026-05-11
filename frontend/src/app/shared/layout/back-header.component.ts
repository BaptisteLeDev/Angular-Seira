import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3 pb-2 pt-2">
      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-full bg-surface-container ghost-border text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        (click)="goBack()"
        aria-label="Retour"
      >
        <span class="icon-[heroicons--chevron-left] text-xl" aria-hidden="true"></span>
      </button>
      @if (title()) {
        <h2 class="font-headline text-base font-bold text-on-surface truncate">
          {{ title() }}
        </h2>
      }
    </div>
  `,
})
export class BackHeader {
  readonly title = input<string | null>(null);
  readonly fallback = input<string | null>(null);

  private readonly location = inject(Location);
  private readonly router = inject(Router);

  protected goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else if (this.fallback()) {
      void this.router.navigateByUrl(this.fallback()!);
    }
  }
}
