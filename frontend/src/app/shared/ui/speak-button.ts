import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { stripMarkdown } from '../utils/strip-markdown';

type State = 'idle' | 'speaking' | 'paused';

@Component({
  selector: 'app-speak-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (supported()) {
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex items-center gap-2 squircle-lg bg-primary px-4 py-2.5 text-on-primary transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          [class.size-9]="compact()"
          [class.justify-center]="compact()"
          [class.px-0]="compact()"
          [class.py-0]="compact()"
          [attr.aria-label]="primaryLabel()"
          (click)="onPrimary()"
        >
          <span class="text-base" [class]="primaryIcon()" aria-hidden="true"></span>
          @if (!compact()) {
            <span class="font-headline text-sm font-bold">{{ primaryLabel() }}</span>
          }
        </button>
        @if (state() !== 'idle') {
          <button
            type="button"
            class="flex items-center gap-2 squircle-lg bg-surface-container-high px-3 py-2.5 text-on-surface ghost-border transition-colors hover:bg-surface-container-highest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            [class.size-9]="compact()"
            [class.justify-center]="compact()"
            [class.px-0]="compact()"
            [class.py-0]="compact()"
            aria-label="Arrêter la lecture"
            (click)="stop()"
          >
            <span class="icon-[heroicons--stop] text-base" aria-hidden="true"></span>
            @if (!compact()) {
              <span class="font-headline text-xs font-bold">Stop</span>
            }
          </button>
        }
      </div>
    }
  `,
})
export class SpeakButton {
  readonly text = input.required<string>();
  readonly isMarkdown = input<boolean>(false);
  readonly language = input<string>('fr-FR');
  readonly rate = input<number>(1);
  readonly pitch = input<number>(1);
  readonly label = input<string>('Écouter');
  readonly compact = input<boolean>(false);

  protected readonly state = signal<State>('idle');
  protected readonly supported = computed(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
  );

  protected readonly primaryIcon = computed(() => {
    const s = this.state();
    if (s === 'speaking') return 'icon-[heroicons--pause]';
    if (s === 'paused') return 'icon-[heroicons--play]';
    return 'icon-[heroicons--speaker-wave]';
  });

  protected readonly primaryLabel = computed(() => {
    const s = this.state();
    if (s === 'speaking') return 'Pause';
    if (s === 'paused') return 'Reprendre';
    return this.label();
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.supported()) window.speechSynthesis.cancel();
    });
  }

  protected onPrimary(): void {
    const s = this.state();
    if (s === 'idle') return this.start();
    if (s === 'speaking') {
      window.speechSynthesis.pause();
      this.state.set('paused');
      return;
    }
    window.speechSynthesis.resume();
    this.state.set('speaking');
  }

  protected stop(): void {
    if (!this.supported()) return;
    window.speechSynthesis.cancel();
    this.state.set('idle');
  }

  private start(): void {
    if (!this.supported()) return;
    const payload = this.isMarkdown() ? stripMarkdown(this.text()) : this.text();
    if (!payload) return;
    const u = new SpeechSynthesisUtterance(payload);
    u.lang = this.language();
    u.rate = this.rate();
    u.pitch = this.pitch();
    u.onend = () => this.state.set('idle');
    u.onerror = () => this.state.set('idle');
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    this.state.set('speaking');
  }
}
