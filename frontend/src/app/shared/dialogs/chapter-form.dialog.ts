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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalShell } from '../feedback/modal-shell.component';
import type { Chapitre } from '../../core/schemas/chapitre.schema';

export interface ChapterFormPayload {
  readonly title: string;
  readonly sortOrder: number;
}

@Component({
  selector: 'app-chapter-form-dialog',
  standalone: true,
  imports: [ModalShell, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-shell [open]="open()" [title]="title()" (closed)="closed.emit()">
      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
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
            >Ordre</span
          >
          <input
            type="number"
            min="1"
            formControlName="sortOrder"
            class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
          />
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
            [disabled]="form.invalid"
          >
            {{ chapitre() ? 'Enregistrer' : 'Créer' }}
          </button>
        </footer>
      </form>
    </app-modal-shell>
  `,
})
export class ChapterFormDialog {
  readonly open = input<boolean>(false);
  readonly chapitre = input<Chapitre | null>(null);
  readonly submitted = output<ChapterFormPayload>();
  readonly closed = output<void>();

  protected readonly title = computed(() =>
    this.chapitre() ? `Modifier ${this.chapitre()!.title}` : 'Nouveau chapitre',
  );

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    sortOrder: [1, [Validators.required, Validators.min(1)]],
  });

  private readonly hydrated = signal(false);
  constructor() {
    effect(() => {
      if (!this.open()) {
        this.hydrated.set(false);
        return;
      }
      if (this.hydrated()) return;
      const c = this.chapitre();
      this.form.reset({
        title: c?.title ?? '',
        sortOrder: c?.sortOrder ?? 1,
      });
      this.hydrated.set(true);
    });
  }

  protected submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.submitted.emit({ title: v.title.trim(), sortOrder: v.sortOrder });
  }
}
