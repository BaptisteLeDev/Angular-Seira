import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  viewChild,
} from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Vidéo de test publique utilisée en dev quand aucune URL n'est fournie
 * (équivalent web du toggle USE_DEV_VIDEO côté mobile).
 */
const DEV_FALLBACK_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

@Component({
  selector: 'app-video-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (resolvedUrl(); as src) {
      <div class="overflow-hidden squircle-xl bg-black ghost-border">
        <video
          #video
          class="block aspect-video w-full bg-black"
          [src]="src"
          controls
          controlsList="nodownload"
          preload="metadata"
          playsinline
        ></video>
      </div>
    } @else {
      <div
        class="flex flex-col items-center squircle-xl bg-surface-container-low p-6 ghost-border"
      >
        <span
          class="icon-[heroicons--video-camera-slash] text-2xl text-on-surface-variant"
          aria-hidden="true"
        ></span>
        <p class="mt-2 font-mono text-xs text-on-surface-variant">Vidéo indisponible</p>
      </div>
    }
  `,
})
export class VideoPlayer {
  readonly url = input<string | null | undefined>(null);
  protected readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');

  protected readonly resolvedUrl = computed<string | null>(() => {
    const u = this.url();
    if (u && u.length > 0) return u;
    if (!environment.production) return DEV_FALLBACK_VIDEO;
    return null;
  });
}
