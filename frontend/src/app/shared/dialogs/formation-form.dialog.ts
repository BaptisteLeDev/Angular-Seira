import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalShell } from '../feedback/modal-shell.component';
import type { Formation } from '../../core/schemas/formation.schema';

export interface FormationFormPayload {
  readonly name: string;
  readonly description: string | null;
  readonly expectedHours: number | null;
}

@Component({
  selector: 'app-formation-form-dialog',
  standalone: true,
  imports: [ModalShell, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-shell [open]="open()" [title]="dialogTitle()" (closed)="closed.emit()">
      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">Nom de la matière</span>
          <input
            type="text"
            formControlName="name"
            autocomplete="off"
            class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
          />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">Description (optionnel)</span>
          <textarea
            formControlName="description"
            rows="3"
            class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
          ></textarea>
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">Volume horaire (h, optionnel)</span>
          <input
            type="number"
            min="0"
            formControlName="expectedHours"
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
            {{ formation() ? 'Enregistrer' : 'Créer' }}
          </button>
        </footer>
      </form>
    </app-modal-shell>
  `,
})
export class FormationFormDialog {
  readonly open = input<boolean>(false);
  readonly formation = input<Formation | null>(null);
  readonly submitted = output<FormationFormPayload>();
  readonly closed = output<void>();

  protected readonly dialogTitle = computed(() =>
    this.formation() ? `Modifier ${this.formation()!.name}` : 'Nouvelle matière',
  );

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    expectedHours: [null as number | null],
  });

  private readonly hydrated = signal(false);

  constructor() {
    effect(() => {
      const f = this.formation();
      if (!this.open()) {
        this.hydrated.set(false);
        return;
      }
      if (this.hydrated()) return;
      this.form.reset({
        name: f?.name ?? '',
        description: f?.description ?? '',
        expectedHours: f?.expectedHours ?? null,
      });
      this.hydrated.set(true);
    });
  }

  protected submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.submitted.emit({
      name: v.name.trim(),
      description: v.description.trim() || null,
      expectedHours: typeof v.expectedHours === 'number' && v.expectedHours >= 0 ? v.expectedHours : null,
    });
  }
}
