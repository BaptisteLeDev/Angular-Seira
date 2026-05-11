import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

/**
 * PDF local utilisé comme placeholder en dev (Lorem ipsum), évite les 404
 * backend tant que les fichiers seedés ne sont pas servis.
 */
const DEV_FALLBACK_PDF = '/dev-assets/sample.pdf';
const USE_DEV_FALLBACK_ALWAYS = true;

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

  protected readonly resolvedUrl = computed<string | null>(() => {
    if (!environment.production && USE_DEV_FALLBACK_ALWAYS) return DEV_FALLBACK_PDF;
    const u = this.url();
    if (u && u.length > 0) return u;
    if (!environment.production) return DEV_FALLBACK_PDF;
    return null;
  });

  protected readonly safeUrl = computed<SafeResourceUrl | null>(() => {
    const u = this.resolvedUrl();
    return u ? this.sanitizer.bypassSecurityTrustResourceUrl(u) : null;
  });

  protected toggleFullscreen(): void {
    this.fullscreen.update((v) => !v);
  }
}
