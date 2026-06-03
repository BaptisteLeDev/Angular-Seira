import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
            aria-label="Agrandir le document"
            (click)="open()"
          >
            <span class="icon-[heroicons--arrows-pointing-out] text-base" aria-hidden="true"></span>
          </button>
        </header>
        <iframe
          [src]="safeUrl()"
          class="block h-[480px] w-full border-0"
          [title]="fileName() ?? 'PDF'"
        ></iframe>
      </div>

      <!-- Modal plein écran -->
      @if (fullscreen()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="fileName() ?? 'Document PDF'"
          (click)="close()"
        >
          <div
            class="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden squircle-xl bg-surface-container-lowest ghost-border"
            (click)="$event.stopPropagation()"
          >
            <header class="flex items-center justify-between bg-surface-container-low px-4 py-3">
              <p class="min-w-0 flex-1 truncate pr-3 font-headline text-sm font-bold text-on-surface">
                {{ fileName() ?? 'Document PDF' }}
              </p>
              <button
                type="button"
                class="flex size-9 items-center justify-center squircle-md bg-surface-container-high text-on-surface transition-colors hover:bg-surface-container-highest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="Fermer"
                (click)="close()"
              >
                <span class="icon-[heroicons--x-mark] text-lg" aria-hidden="true"></span>
              </button>
            </header>
            <iframe
              [src]="safeUrl()"
              class="block w-full flex-1 border-0"
              [title]="fileName() ?? 'PDF'"
            ></iframe>
          </div>
        </div>
      }
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
  private readonly http = inject(HttpClient);
  protected readonly fullscreen = signal(false);

  /** Passe à true quand la vraie URL est injoignable, pour basculer sur le placeholder (dev). */
  private readonly failed = signal(false);

  constructor() {
    // On sonde l'URL réelle via HttpClient (intercepteur JWT appliqué → un PDF
    // protégé renvoie 200 au lieu de 401). Seul un 404 bascule sur le
    // placeholder ; 401/403/réseau restent indéterminés (on garde l'URL).
    effect((onCleanup) => {
      const u = this.url();
      this.failed.set(false);
      if (!u || u.length === 0) return;
      const sub = this.http.head(u, { observe: 'response' }).subscribe({
        next: () => {},
        error: (err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 404) {
            this.failed.set(true);
          }
        },
      });
      onCleanup(() => sub.unsubscribe());
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

  protected open(): void {
    this.fullscreen.set(true);
  }

  protected close(): void {
    this.fullscreen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.fullscreen()) this.close();
  }
}
