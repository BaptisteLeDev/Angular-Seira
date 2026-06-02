import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { youtubeEmbedUrl } from '../../core/utils/video-url';
import { ProgressStore } from '../../core/stores/progress.store';
import { buildVideoProgressPayload, shouldFlush } from '../../core/utils/video-progress';
import { clampPlaybackRate } from '../../core/utils/playback';

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
          (loadedmetadata)="onLoadedMetadata()"
          (play)="onPlay()"
          (pause)="onPause()"
          (ratechange)="onRateChange()"
          (ended)="onEnded()"
        ></video>
      }
    </div>
    @if (!embedUrl()) {
      <p
        class="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant"
        aria-live="polite"
      >
        <span
          class="size-2 rounded-full transition-colors"
          [class.bg-emerald-500]="isPlaying()"
          [class.bg-on-surface-variant]="!isPlaying()"
          aria-hidden="true"
        ></span>
        {{ isPlaying() ? 'En lecture' : 'En pause' }}
      </p>
    }
  `,
})
export class VideoPlayer {
  readonly url = input<string | null | undefined>(null);
  /** Id de la Video liée : active le suivi de progression quand renseigné. */
  readonly videoId = input<number | null | undefined>(null);
  protected readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');

  private readonly sanitizer = inject(DomSanitizer);
  private readonly progress = inject(ProgressStore);

  /** Passe à true quand la vraie URL échoue, pour basculer sur le placeholder. */
  private readonly failed = signal(false);

  /** État de lecture courant (détection lecture active / en pause). */
  protected readonly isPlaying = signal(false);

  /** Plafond anti-skip : position max vue en lecture continue (secondes). */
  private cap = 0;
  /** Dernières secondes envoyées au serveur (anti-spam d'API). */
  private lastSent = 0;
  /** Évite de repositionner la vidéo à chaque chargement. */
  private resumed = false;
  private static readonly SEEK_TOLERANCE = 1;

  constructor() {
    // Réinitialise l'état dès que la source ou la vidéo suivie change.
    effect(() => {
      this.url();
      this.videoId();
      this.failed.set(false);
      this.cap = 0;
      this.lastSent = 0;
      this.resumed = false;
      this.isPlaying.set(false);
    });

    // Hydrate la progression connue (pour la reprise + les tableaux de bord).
    effect(() => {
      if (this.videoId() != null) void this.progress.hydrate();
    });
  }

  /** Le suivi est actif quand une Video est liée et que la vraie source joue. */
  private get trackingEnabled(): boolean {
    return this.videoId() != null && !this.failed() && !this.embedUrl();
  }

  /** Monte le plafond en lecture continue (ignore les avances anormales). */
  protected onTimeUpdate(): void {
    const v = this.video()?.nativeElement;
    if (!v) return;
    if (v.currentTime <= this.cap + VideoPlayer.SEEK_TOLERANCE) {
      this.cap = Math.max(this.cap, v.currentTime);
    }
    if (this.trackingEnabled && shouldFlush(this.cap, this.lastSent)) {
      this.flush();
    }
  }

  /** Reprend la lecture là où l'élève s'était arrêté, si connu. */
  protected onLoadedMetadata(): void {
    if (!this.trackingEnabled || this.resumed) return;
    const v = this.video()?.nativeElement;
    const id = this.videoId();
    if (!v || id == null || !isFinite(v.duration) || v.duration <= 0) return;
    const saved = this.progress.byVideoId()[id]?.watchedSeconds ?? 0;
    if (saved > 0 && saved < v.duration - 1) {
      v.currentTime = saved;
      this.cap = saved;
      this.lastSent = Math.floor(saved);
    }
    this.resumed = true;
  }

  /** Envoie la progression courante au serveur (best-effort). */
  protected flush(): void {
    const v = this.video()?.nativeElement;
    const id = this.videoId();
    if (!this.trackingEnabled || !v || id == null) return;
    if (!isFinite(v.duration) || v.duration <= 0) return;
    if (Math.floor(this.cap) <= this.lastSent) return;
    this.lastSent = Math.floor(this.cap);
    const payload = buildVideoProgressPayload(this.cap, v.duration, new Date().toISOString());
    this.progress.reportVideo(id, payload).subscribe();
  }

  protected onPlay(): void {
    this.isPlaying.set(true);
  }

  protected onPause(): void {
    this.isPlaying.set(false);
    this.flush();
  }

  protected onEnded(): void {
    this.isPlaying.set(false);
    this.flush();
  }

  /** Anti-triche : interdit toute vitesse de lecture au-delà de 2x. */
  protected onRateChange(): void {
    const v = this.video()?.nativeElement;
    if (!v) return;
    const clamped = clampPlaybackRate(v.playbackRate);
    if (v.playbackRate !== clamped) {
      v.playbackRate = clamped;
    }
  }

  /** Met en pause dès que l'onglet passe en arrière-plan (présence active). */
  @HostListener('document:visibilitychange')
  protected onVisibilityChange(): void {
    if (typeof document !== 'undefined' && document.hidden) {
      this.video()?.nativeElement?.pause();
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
