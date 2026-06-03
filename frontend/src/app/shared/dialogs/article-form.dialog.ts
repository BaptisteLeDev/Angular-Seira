import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalShell } from '../feedback/modal-shell.component';
import type { Article, ContentType } from '../../core/schemas/article.schema';
import { isContentPayloadValid } from '../../core/utils/content-validation';

export interface ArticleFormPayload {
  readonly type: ContentType;
  readonly title: string;
  readonly description: string | null;
  readonly content: string | null;
  readonly sourceUrl: string | null;
  readonly filePath: string | null;
  readonly durationSeconds: number | null;
  readonly sortOrder: number;
  readonly isPublished: boolean;
}

const TYPES: readonly { value: ContentType; label: string; icon: string }[] = [
  { value: 'video', label: 'Vidéo', icon: 'icon-[heroicons--play-circle]' },
  { value: 'pdf', label: 'PDF', icon: 'icon-[heroicons--document]' },
  { value: 'markdown', label: 'Article', icon: 'icon-[heroicons--document-text]' },
  { value: 'link', label: 'Lien', icon: 'icon-[heroicons--link]' },
  { value: 'file', label: 'Fichier', icon: 'icon-[heroicons--paper-clip]' },
];

@Component({
  selector: 'app-article-form-dialog',
  standalone: true,
  imports: [ModalShell, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-shell [open]="open()" [title]="title()" (closed)="closed.emit()">
      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant"
            >Type</span
          >
          <div class="flex flex-wrap gap-2">
            @for (t of types; track t.value) {
              <button
                type="button"
                class="inline-flex items-center gap-1.5 squircle-md px-3 py-1.5 text-xs font-headline font-bold uppercase tracking-widest ghost-border transition-colors"
                [class.bg-primary]="form.controls.type.value === t.value"
                [class.text-on-primary]="form.controls.type.value === t.value"
                [class.bg-surface-container]="form.controls.type.value !== t.value"
                [class.text-on-surface]="form.controls.type.value !== t.value"
                (click)="form.controls.type.setValue(t.value)"
              >
                <span class="text-sm" [class]="t.icon" aria-hidden="true"></span>
                {{ t.label }}
              </button>
            }
          </div>
        </div>

        <label class="flex flex-col gap-1.5">
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant"
            >Titre</span
          >
          <input
            type="text"
            formControlName="title"
            class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant"
            >Description (optionnel)</span
          >
          <textarea
            rows="2"
            formControlName="description"
            class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
          ></textarea>
        </label>

        @if (form.controls.type.value === 'markdown') {
          <label class="flex flex-col gap-1.5">
            <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant"
              >Contenu (markdown)</span
            >
            <textarea
              rows="8"
              formControlName="content"
              class="squircle-md bg-surface-container px-4 py-2.5 font-mono text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
            ></textarea>
          </label>
        } @else if (form.controls.type.value === 'video' || form.controls.type.value === 'link') {
          <label class="flex flex-col gap-1.5">
            <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant"
              >URL source</span
            >
            <input
              type="url"
              formControlName="sourceUrl"
              class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
            />
          </label>
        } @else if (form.controls.type.value === 'pdf' || form.controls.type.value === 'file') {
          <label class="flex flex-col gap-1.5">
            <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant"
              >Chemin / URL fichier</span
            >
            <input
              type="text"
              formControlName="filePath"
              class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
            />
          </label>
        }

        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1.5">
            <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant"
              >Durée (sec)</span
            >
            <input
              type="number"
              min="0"
              formControlName="durationSeconds"
              class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
            />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant"
              >Ordre</span
            >
            <input
              type="number"
              min="1"
              formControlName="sortOrder"
              class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
            />
          </label>
        </div>

        <label class="flex items-center gap-2">
          <input type="checkbox" formControlName="isPublished" class="size-4" />
          <span class="text-sm text-on-surface">Publié</span>
        </label>

        <footer class="mt-2 flex justify-end gap-2">
          <button
            type="button"
            class="squircle-md px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"
            (click)="closed.emit()"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="squircle-md bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50 hover:opacity-90"
            [disabled]="form.invalid || typeFieldMissing()"
          >
            {{ article() ? 'Enregistrer' : 'Créer' }}
          </button>
        </footer>
      </form>
    </app-modal-shell>
  `,
})
export class ArticleFormDialog {
  readonly open = input<boolean>(false);
  readonly article = input<Article | null>(null);
  readonly defaultSortOrder = input<number>(1);
  readonly submitted = output<ArticleFormPayload>();
  readonly closed = output<void>();

  protected readonly types = TYPES;
  protected readonly title = computed(() =>
    this.article() ? `Modifier ${this.article()!.title}` : 'Nouveau contenu',
  );

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.nonNullable.group({
    type: ['markdown' as ContentType, Validators.required],
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    content: [''],
    sourceUrl: [''],
    filePath: [''],
    durationSeconds: [0],
    sortOrder: [1, [Validators.required, Validators.min(1)]],
    isPublished: [true],
  });

  // Valeurs réactives du formulaire pour la validation dynamique par type.
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /** Le champ requis par le type courant est manquant (bloque l'envoi → évite un 422). */
  protected readonly typeFieldMissing = computed(() => {
    const v = this.formValue();
    return !isContentPayloadValid(v.type ?? 'markdown', {
      content: v.content,
      sourceUrl: v.sourceUrl,
      filePath: v.filePath,
    });
  });

  private readonly hydrated = signal(false);
  constructor() {
    effect(() => {
      if (!this.open()) {
        this.hydrated.set(false);
        return;
      }
      if (this.hydrated()) return;
      const a = this.article();
      this.form.reset({
        type: a?.type ?? 'markdown',
        title: a?.title ?? '',
        description: a?.description ?? '',
        content: a?.content ?? '',
        sourceUrl: a?.sourceUrl ?? '',
        filePath: a?.filePath ?? '',
        durationSeconds: a?.durationSeconds ?? 0,
        sortOrder: a?.sortOrder ?? this.defaultSortOrder(),
        isPublished: a?.isPublished ?? true,
      });
      this.hydrated.set(true);
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.typeFieldMissing()) return;
    const v = this.form.getRawValue();
    this.submitted.emit({
      type: v.type,
      title: v.title.trim(),
      description: v.description.trim() || null,
      content: v.content.trim() || null,
      sourceUrl: v.sourceUrl.trim() || null,
      filePath: v.filePath.trim() || null,
      durationSeconds: v.durationSeconds > 0 ? v.durationSeconds : null,
      sortOrder: v.sortOrder,
      isPublished: v.isPublished,
    });
  }
}
