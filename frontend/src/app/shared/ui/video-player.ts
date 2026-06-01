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
          (timeupdate)="onTimeUpdate()"
          (seeking)="onSeeking()"
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

  /** Plafond anti-skip : position max vue en lecture continue (secondes). */
  private cap = 0;
  private static readonly SEEK_TOLERANCE = 1;

  constructor() {
    // Réinitialise l'état d'échec ET le plafond dès que la source change.
    effect(() => {
      this.url();
      this.failed.set(false);
      this.cap = 0;
    });
  }

  /** Monte le plafond en lecture continue (ignore les avances anormales). */
  protected onTimeUpdate(): void {
    const v = this.video()?.nativeElement;
    if (!v) return;
    if (v.currentTime <= this.cap + VideoPlayer.SEEK_TOLERANCE) {
      this.cap = Math.max(this.cap, v.currentTime);
    }
  }

  /**
   * Anti-skip par défaut : rejette toute avance au-delà de la position vue,
   * tant que la vidéo n'est pas vue jusqu'au bout. Une fois vue à ~100%, le
   * seek redevient libre. (Sans effet sur le fallback / YouTube en iframe.)
   */
  protected onSeeking(): void {
    const v = this.video()?.nativeElement;
    if (!v || !isFinite(v.duration) || v.duration <= 0) return;
    const fullyWatched = this.cap >= v.duration - 1;
    if (fullyWatched) return;
    if (v.currentTime > this.cap + VideoPlayer.SEEK_TOLERANCE) {
      v.currentTime = this.cap;
    }
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
