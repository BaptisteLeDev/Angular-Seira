import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { ProgressStore } from '../../core/stores/progress.store';
import { WatchSessionService } from '../../core/stores/watch-session.service';
import { buildVideoProgressPayload, computeCap, shouldFlush } from '../../core/utils/video-progress';
import { youtubeVideoId } from '../../core/utils/video-url';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const MAX_RATE = 2;
const POLL_MS = 500;

let apiPromise: Promise<any> | null = null;

/** Charge l'IFrame Player API une seule fois et résout quand elle est prête. */
function loadYouTubeApi(): Promise<any> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return apiPromise;
}

/**
 * Lecteur YouTube contrôlé (anti-triche) via l'IFrame Player API.
 *
 * Applique la même logique que le lecteur natif : plafond anti-skip avec
 * snap-back (`seekTo`), vitesse plafonnée à 2x, suivi de progression et
 * visionnage certifié (watch-sessions). Tout est best-effort.
 */
@Component({
  selector: 'app-youtube-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-hidden squircle-xl bg-black ghost-border">
      <div #host class="aspect-video w-full"></div>
    </div>
  `,
})
export class YoutubePlayer {
  readonly url = input<string | null | undefined>(null);
  /** Id de la Video backend : active le suivi de progression quand renseigné. */
  readonly videoId = input<number | null | undefined>(null);

  private readonly host = viewChild<ElementRef<HTMLDivElement>>('host');
  private readonly progress = inject(ProgressStore);
  private readonly watch = inject(WatchSessionService);

  private player: any = null;
  private poll: ReturnType<typeof setInterval> | null = null;
  private currentKey: string | null = null;
  private cap = 0;
  private lastSent = 0;
  private resumed = false;
  private destroyed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.teardown();
    });

    // (Re)crée le player quand la source change et que l'hôte est dispo.
    effect(() => {
      const id = youtubeVideoId(this.url());
      const hostEl = this.host()?.nativeElement;
      const key = id && hostEl ? `${id}` : null;
      if (key === this.currentKey) return;
      this.currentKey = key;
      this.teardown();
      if (id && hostEl) {
        if (this.videoId() != null) void this.progress.hydrate();
        this.create(hostEl, id);
      }
    });
  }

  private create(hostEl: HTMLElement, ytId: string): void {
    this.cap = 0;
    this.lastSent = 0;
    this.resumed = false;
    void loadYouTubeApi().then((YT) => {
      if (this.destroyed || this.currentKey !== ytId) return;
      this.player = new YT.Player(hostEl, {
        videoId: ytId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => this.onReady(),
          onPlaybackRateChange: () => this.enforceRate(),
        },
      });
    });
  }

  private onReady(): void {
    // Reprise au temps certifié connu.
    const id = this.videoId();
    if (id != null) {
      const saved = this.progress.byVideoId()[id]?.watchedSeconds ?? 0;
      const duration = this.safeDuration();
      if (saved > 0 && duration > 0 && saved < duration - 1) {
        this.player?.seekTo(saved, true);
        this.cap = saved;
        this.lastSent = Math.floor(saved);
      }
    }
    this.resumed = true;
    this.enforceRate();
    this.poll = setInterval(() => this.tick(), POLL_MS);
  }

  private tick(): void {
    if (!this.player || typeof this.player.getCurrentTime !== 'function') return;
    const t = this.player.getCurrentTime() ?? 0;
    const duration = this.safeDuration();
    const before = this.cap;
    const next = computeCap(before, t);
    const fullyWatched = duration > 0 && before >= duration - 1;
    if (next === before && t > before + 1 && !fullyWatched) {
      // Saut avant non autorisé : retour au plafond vu.
      this.player.seekTo(before, true);
    } else {
      this.cap = next;
    }

    const id = this.videoId();
    if (id != null && duration > 0) {
      if (shouldFlush(this.cap, this.lastSent)) this.flush(duration);
      this.watch.track(id, this.cap, duration);
    }
  }

  private flush(duration: number): void {
    const id = this.videoId();
    if (id == null || Math.floor(this.cap) <= this.lastSent) return;
    this.lastSent = Math.floor(this.cap);
    const payload = buildVideoProgressPayload(this.cap, duration, new Date().toISOString());
    this.progress.reportVideo(id, payload).subscribe();
  }

  private enforceRate(): void {
    if (!this.player || typeof this.player.getPlaybackRate !== 'function') return;
    if (this.player.getPlaybackRate() > MAX_RATE) {
      this.player.setPlaybackRate(MAX_RATE);
    }
  }

  private safeDuration(): number {
    const d = typeof this.player?.getDuration === 'function' ? this.player.getDuration() : 0;
    return Number.isFinite(d) && d > 0 ? d : 0;
  }

  private teardown(): void {
    if (this.poll) {
      clearInterval(this.poll);
      this.poll = null;
    }
    if (this.player && typeof this.player.destroy === 'function') {
      this.player.destroy();
    }
    this.player = null;
  }
}
