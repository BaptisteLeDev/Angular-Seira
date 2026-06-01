import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * PDF de démonstration (Lorem ipsum) affiché en fallback dès qu'aucune URL n'est
 * fournie OU que le fichier backend est injoignable (404), quel que soit
 * l'environnement. Servi depuis frontend/public/dev-assets.
 */
const FALLBACK_PDF = '/dev-assets/sample.pdf';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (resolvedUrl(); as url) {
      <div class="overflow-hidden squircle-xl bg-surface-container-lowest ghost-border">
        <header class="flex items-center justify-between bg-surface-container-low px-4 py-3">
          <div class="min-w-0 flex-1 pr-3">
            <p class="truncate font-headline text-sm font-bold text-on-surface">
              {{ fileName() ?? 'Document PDF' }}
            </p>
            <p class="truncate font-mono text-[11px] text-on-surface-variant">{{ url }}</p>
          </div>
          <button
            type="button"
            class="flex size-9 items-center justify-center squircle-md bg-surface-container-high text-on-surface transition-colors hover:bg-surface-container-highest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            [attr.aria-label]="fullscreen() ? 'Quitter le plein écran' : 'Plein écran'"
            (click)="toggleFullscreen()"
          >
            <span
              class="text-base"
              [class]="
                fullscreen()
                  ? 'icon-[heroicons--arrows-pointing-in]'
                  : 'icon-[heroicons--arrows-pointing-out]'
              "
              aria-hidden="true"
            ></span>
          </button>
        </header>
        <iframe
          [src]="safeUrl()"
          class="block w-full border-0"
          [style.height]="fullscreen() ? '80vh' : '480px'"
          [title]="fileName() ?? 'PDF'"
        ></iframe>
      </div>
    } @else {
      <div
        class="flex flex-col items-center squircle-xl bg-surface-container-low p-6 ghost-border"
      >
        <span
          class="icon-[heroicons--document] text-2xl text-on-surface-variant"
          aria-hidden="true"
        ></span>
        <p class="mt-2 font-mono text-xs text-on-surface-variant">Document indisponible</p>
      </div>
    }
  `,
})
export class PdfViewer {
  readonly url = input<string | null | undefined>(null);
  readonly fileName = input<string | null>(null);

  private readonly sanitizer = inject(DomSanitizer);
  protected readonly fullscreen = signal(false);

  /** Passe à true quand la vraie URL est injoignable, pour basculer sur le placeholder (dev). */
  private readonly failed = signal(false);

  constructor() {
    // On sonde l'URL réelle : un 404 bascule sur le placeholder. Une erreur
    // réseau/CORS ne déclenche pas le fallback (on garde l'URL telle quelle, car
    // indéterminée — l'iframe affichera le PDF si l'URL est en réalité valide).
    effect((onCleanup) => {
      const u = this.url();
      this.failed.set(false);
      if (!u || u.length === 0) return;
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });
      fetch(u, { method: 'HEAD' })
        .then((res) => {
          if (!cancelled && !res.ok) this.failed.set(true);
        })
        .catch(() => {
          /* CORS / réseau : indéterminé, on n'active pas le fallback. */
        });
    });
  }

  protected readonly resolvedUrl = computed<string>(() => {
    if (this.failed()) return FALLBACK_PDF;
    const u = this.url();
    // Pas de vraie source → PDF de démonstration.
    return u && u.length > 0 ? u : FALLBACK_PDF;
  });

  protected readonly safeUrl = computed<SafeResourceUrl | null>(() => {
    const u = this.resolvedUrl();
    return u ? this.sanitizer.bypassSecurityTrustResourceUrl(u) : null;
  });

  protected toggleFullscreen(): void {
    this.fullscreen.update((v) => !v);
  }
}
