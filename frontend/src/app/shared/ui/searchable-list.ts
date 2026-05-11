import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SearchBar } from './search-bar';
import { fuzzyFilter } from '../utils/fuzzy-search';

@Component({
  selector: 'app-searchable-list',
  standalone: true,
  imports: [SearchBar, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <app-search-bar [(value)]="query" [placeholder]="placeholder()" />
      @if (filtered().length === 0) {
        <p class="px-1 py-8 text-center text-sm text-on-surface-variant">
          {{ emptyLabel() }}
        </p>
      } @else {
        <ul role="list" class="flex flex-col gap-2">
          @for (item of filtered(); track trackFn()(item)) {
            <li>
              <ng-container
                *ngTemplateOutlet="itemTpl(); context: { $implicit: item }"
              ></ng-container>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class SearchableList<T> {
  readonly items = input.required<readonly T[]>();
  readonly searchKeys = input.required<readonly string[]>();
  readonly placeholder = input<string>('Rechercher…');
  readonly emptyLabel = input<string>('Aucun résultat.');
  /** Track-by appliqué sur la liste filtrée. Par défaut renvoie la valeur directement. */
  readonly trackFn = input<(item: T) => unknown>((item) => item);

  protected readonly query = signal('');
  protected readonly itemTpl = contentChild.required<TemplateRef<{ $implicit: T }>>('item');

  protected readonly filtered = computed(() =>
    fuzzyFilter(this.items(), this.searchKeys(), this.query()),
  );
}
