import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Article } from '../../core/schemas/article.schema';
import { ArticleBody } from './article-body';
import { contentTypeIcon, contentTypeLabel } from '../utils/article-meta';

@Component({
  selector: 'app-article-preview-modal',
  standalone: true,
  imports: [ArticleBody],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (article(); as a) {
      <div
        class="fixed inset-0 z-[65] flex items-stretch justify-center sm:items-center"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="a.title"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          aria-label="Fermer la prévisualisation"
          (click)="closed.emit()"
        ></button>
        <div
          class="relative flex w-full flex-col overflow-hidden bg-surface ghost-border sm:max-h-[90vh] sm:max-w-3xl sm:squircle-2xl"
        >
          <header
            class="flex items-center justify-between border-b border-outline-variant px-5 py-3"
          >
            <div class="flex flex-1 items-center gap-2 text-on-surface-variant">
              <span class="text-sm" [class]="iconFor(a.type)" aria-hidden="true"></span>
              <span
                class="font-headline text-xs font-bold uppercase tracking-[3px]"
              >
                {{ labelFor(a.type) }}
              </span>
            </div>
            <button
              type="button"
              class="flex size-9 items-center justify-center squircle-md bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Fermer"
              (click)="closed.emit()"
            >
              <span class="icon-[heroicons--x-mark] text-base" aria-hidden="true"></span>
            </button>
          </header>
          <div class="flex-1 overflow-y-auto p-5 sm:p-6">
            <h2
              class="mb-2 font-headline text-2xl font-extrabold text-on-surface"
            >
              {{ a.title }}
            </h2>
            @if (a.description) {
              <p class="mb-6 text-base leading-relaxed text-on-surface-variant">
                {{ a.description }}
              </p>
            } @else {
              <div class="mb-4"></div>
            }
            <app-article-body [article]="a" />
          </div>
        </div>
      </div>
    }
  `,
})
export class ArticlePreviewModal {
  readonly article = input<Article | null>(null);
  readonly closed = output<void>();

  protected iconFor(t: Article['type']): string {
    return contentTypeIcon(t);
  }

  protected labelFor(t: Article['type']): string {
    return contentTypeLabel(t);
  }
}
