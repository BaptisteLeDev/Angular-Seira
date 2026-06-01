import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { youtubeEmbedUrl } from '../../core/utils/video-url';

/**
 * Vidéo de démonstration servie depuis frontend/public/dev-assets. Affichée en
 * fallback dès qu'aucune URL n'est fournie OU que la vraie source échoue (404,
 * format non supporté…), quel que soit l'environnement. Équivalent web du
 * fallback côté mobile.
 */
const FALLBACK_VIDEO = '/dev-assets/sample-video.mp4';

@Component({
  selector: 'app-video-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-hidden squircle-xl bg-black ghost-border">
      @if (embedUrl(); as embed) {
        <!-- Lien YouTube : <video> natif ne sait pas le lire → iframe d'embed. -->
        <iframe
          class="block aspect-video w-full"
          [src]="embed"
          title="Lecteur vidéo"
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowfullscreen
        ></iframe>
      } @else {
        <video
          #video
          class="block aspect-video w-full bg-black"
          [src]="resolvedUrl()"
          controls
          controlsList="nodownload"
          preload="metadata"
          playsinline
          (error)="onError()"
        ></video>
      }
    </div>
  `,
})
export class VideoPlayer {
  readonly url = input<string | null | undefined>(null);
  protected readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');

  private readonly sanitizer = inject(DomSanitizer);

  /** Passe à true quand la vraie URL échoue, pour basculer sur le placeholder. */
  private readonly failed = signal(false);

  constructor() {
    // Réinitialise l'état d'échec dès que la source change.
    effect(() => {
      this.url();
      this.failed.set(false);
    });
  }

  /** URL d'embed YouTube (iframe) si l'URL fournie est un lien YouTube, sinon null. */
  protected readonly embedUrl = computed<SafeResourceUrl | null>(() => {
    const yt = youtubeEmbedUrl(this.url());
    return yt ? this.sanitizer.bypassSecurityTrustResourceUrl(yt) : null;
  });

  protected readonly resolvedUrl = computed<string>(() => {
    if (this.failed()) return FALLBACK_VIDEO;
    const u = this.url();
    // Pas de vraie source → vidéo de démonstration.
    return u && u.length > 0 ? u : FALLBACK_VIDEO;
  });

  protected onError(): void {
    // La vraie URL a échoué : on bascule sur le placeholder (sauf si c'est déjà lui).
    if (this.resolvedUrl() !== FALLBACK_VIDEO) {
      this.failed.set(true);
    }
  }
}
