import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Article } from '../../core/schemas/article.schema';
import { EmptyState } from '../ui/empty-state';
import { MarkdownView } from '../ui/markdown-view';
import { PdfViewer } from '../ui/pdf-viewer';
import { VideoPlayer } from '../ui/video-player';

@Component({
  selector: 'app-article-body',
  standalone: true,
  imports: [EmptyState, MarkdownView, PdfViewer, VideoPlayer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5">
      @switch (article().type) {
        @case ('video') {
          <app-video-player [url]="article().sourceUrl" />
        }

        @case ('link') {
          @if (article().sourceUrl; as href) {
            <a
              [href]="href"
              target="_blank"
              rel="noreferrer noopener"
              class="flex items-center gap-4 squircle-xl bg-surface-container p-4 ghost-border transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span
                class="flex size-10 items-center justify-center squircle-lg bg-primary/15 text-primary"
              >
                <span class="icon-[heroicons--link] text-lg" aria-hidden="true"></span>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block font-headline text-base font-bold text-on-surface"
                  >Ouvrir le lien</span
                >
                <span
                  class="block truncate font-mono text-[11px] text-on-surface-variant"
                  >{{ href }}</span
                >
              </span>
              <span
                class="icon-[heroicons--arrow-top-right-on-square] text-base text-on-surface-variant"
                aria-hidden="true"
              ></span>
            </a>
          }
        }

        @case ('pdf') {
          <app-pdf-viewer
            [url]="article().filePath ?? article().sourceUrl"
            [fileName]="article().title"
          />
        }

        @case ('file') {
          @if (article().filePath; as fp) {
            <a
              [href]="fp"
              target="_blank"
              rel="noreferrer noopener"
              class="flex items-center gap-4 squircle-xl bg-surface-container p-4 ghost-border transition-colors hover:bg-surface-container-high"
            >
              <span
                class="flex size-10 items-center justify-center squircle-lg bg-primary/10 text-primary"
              >
                <span class="icon-[heroicons--paper-clip] text-lg" aria-hidden="true"></span>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block font-headline text-base font-bold text-on-surface"
                  >Fichier joint</span
                >
                <span
                  class="block truncate font-mono text-[11px] text-on-surface-variant"
                  >{{ fp }}</span
                >
              </span>
            </a>
          }
        }

        @case ('markdown') {
          @if (body(); as content) {
            <app-markdown-view [source]="content" />
          } @else {
            <app-empty-state
              icon="icon-[heroicons--document-text]"
              title="Contenu en préparation"
              description="Cet article sera enrichi prochainement."
            />
          }
        }

        @default {
          @if (body(); as text) {
            <p class="text-base leading-relaxed text-on-surface">{{ text }}</p>
          }
        }
      }
    </div>
  `,
})
export class ArticleBody {
  readonly article = input.required<Article>();
  protected readonly body = computed(
    () => this.article().content ?? this.article().description ?? null,
  );
}
