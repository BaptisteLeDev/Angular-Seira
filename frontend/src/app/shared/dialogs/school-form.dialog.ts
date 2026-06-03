import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalShell } from '../feedback/modal-shell.component';
import type { School } from '../../core/schemas/school.schema';

export interface SchoolFormPayload {
  readonly name: string;
  readonly slug: string;
}

@Component({
  selector: 'app-school-form-dialog',
  standalone: true,
  imports: [ModalShell, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-shell [open]="open()" [title]="dialogTitle()" (closed)="closed.emit()">
      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">Nom</span>
          <input
            type="text"
            formControlName="name"
            autocomplete="off"
            class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
          />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">Slug (optionnel)</span>
          <input
            type="text"
            formControlName="slug"
            autocomplete="off"
            placeholder="ex: ecole-du-web"
            class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
          />
        </label>
        <footer class="mt-2 flex justify-end gap-2">
          <button
            type="button"
            class="squircle-md px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            (click)="closed.emit()"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="squircle-md bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            [disabled]="form.invalid"
          >
            {{ school() ? 'Enregistrer' : 'Créer' }}
          </button>
        </footer>
      </form>
    </app-modal-shell>
  `,
})
export class SchoolFormDialog {
  readonly open = input<boolean>(false);
  readonly school = input<School | null>(null);
  readonly submitted = output<SchoolFormPayload>();
  readonly closed = output<void>();

  protected readonly dialogTitle = computed(() =>
    this.school() ? `Modifier ${this.school()!.name}` : 'Nouvelle école',
  );

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: [''],
  });

  private readonly hydrated = signal(false);

  constructor() {
    effect(() => {
      const s = this.school();
      if (!this.open()) {
        this.hydrated.set(false);
        return;
      }
      if (this.hydrated()) return;
      this.form.reset({ name: s?.name ?? '', slug: s?.slug ?? '' });
      this.hydrated.set(true);
    });
  }

  protected submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.submitted.emit({ name: v.name.trim(), slug: v.slug.trim() });
  }
}
