import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="flex items-center gap-3 squircle-xl bg-surface-container px-4 py-3 ghost-border">
      <span
        class="icon-[heroicons--magnifying-glass] text-lg text-on-surface-variant"
        aria-hidden="true"
      ></span>
      <input
        type="search"
        class="flex-1 bg-transparent text-base text-on-surface placeholder:text-on-surface-variant focus:outline-none"
        [placeholder]="placeholder()"
        [autofocus]="autofocus()"
        [(ngModel)]="value"
        autocomplete="off"
        spellcheck="false"
      />
      @if (value()) {
        <button
          type="button"
          class="flex size-6 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:text-on-surface"
          aria-label="Effacer la recherche"
          (click)="value.set('')"
        >
          <span class="icon-[heroicons--x-circle] text-base" aria-hidden="true"></span>
        </button>
      }
    </label>
  `,
})
export class SearchBar {
  readonly value = model<string>('');
  readonly placeholder = input<string>('Rechercher…');
  readonly autofocus = input<boolean>(false);
}
