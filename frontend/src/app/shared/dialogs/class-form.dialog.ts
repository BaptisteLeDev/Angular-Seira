import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalShell } from '../feedback/modal-shell.component';
import type { Classroom } from '../../core/schemas/class.schema';

export interface ClassFormPayload {
  readonly name: string;
  readonly level: string;
  readonly slug: string;
}

@Component({
  selector: 'app-class-form-dialog',
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
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">Niveau</span>
          <input
            type="text"
            formControlName="level"
            autocomplete="off"
            placeholder="ex: 3e, Terminale, BTS1…"
            class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
          />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">Slug (optionnel)</span>
          <input
            type="text"
            formControlName="slug"
            autocomplete="off"
            placeholder="généré depuis le nom si vide"
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
            {{ classroom() ? 'Enregistrer' : 'Créer' }}
          </button>
        </footer>
      </form>
    </app-modal-shell>
  `,
})
export class ClassFormDialog {
  readonly open = input<boolean>(false);
  readonly classroom = input<Classroom | null>(null);
  readonly submitted = output<ClassFormPayload>();
  readonly closed = output<void>();

  protected readonly dialogTitle = computed(() =>
    this.classroom() ? `Modifier ${this.classroom()!.name}` : 'Nouvelle classe',
  );

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    level: ['', [Validators.required]],
    slug: [''],
  });

  private readonly hydrated = signal(false);

  constructor() {
    effect(() => {
      const c = this.classroom();
      if (!this.open()) {
        this.hydrated.set(false);
        return;
      }
      if (this.hydrated()) return;
      this.form.reset({ name: c?.name ?? '', level: c?.level ?? '', slug: c?.slug ?? '' });
      this.hydrated.set(true);
    });
  }

  protected submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const slug = v.slug.trim() || slugify(v.name);
    this.submitted.emit({ name: v.name.trim(), level: v.level.trim(), slug });
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
