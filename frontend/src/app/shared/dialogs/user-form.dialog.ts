import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalShell } from '../feedback/modal-shell.component';
import { SchoolStore } from '../../core/stores/school.store';
import type { User, UserRole } from '../../core/schemas/user.schema';

export interface UserFormPayload {
  readonly name: string;
  readonly email: string;
  readonly password?: string;
  readonly role: UserRole;
  readonly schoolId: number | null;
}

const ROLE_OPTIONS: readonly { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'teacher', label: 'Enseignant' },
  { value: 'student', label: 'Élève' },
];

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [ModalShell, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-shell
      [open]="open()"
      [title]="dialogTitle()"
      (closed)="closed.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant"
            >Nom</span
          >
          <input
            type="text"
            formControlName="name"
            autocomplete="off"
            class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant"
            >Email</span
          >
          <input
            type="email"
            formControlName="email"
            autocomplete="off"
            class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            {{ user() ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe' }}
          </span>
          <input
            type="password"
            formControlName="password"
            autocomplete="new-password"
            class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
          />
        </label>

        <div class="flex flex-col gap-1.5">
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant"
            >Rôle</span
          >
          <div class="flex flex-wrap gap-2">
            @for (opt of roleOptions; track opt.value) {
              <button
                type="button"
                class="squircle-md px-3 py-1.5 text-xs font-headline font-bold uppercase tracking-widest ghost-border transition-colors"
                [class.bg-primary]="form.controls.role.value === opt.value"
                [class.text-on-primary]="form.controls.role.value === opt.value"
                [class.bg-surface-container]="form.controls.role.value !== opt.value"
                [class.text-on-surface]="form.controls.role.value !== opt.value"
                (click)="form.controls.role.setValue(opt.value)"
              >
                {{ opt.label }}
              </button>
            }
          </div>
        </div>

        <label class="flex flex-col gap-1.5">
          <span class="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant"
            >École (optionnel)</span
          >
          <select
            formControlName="schoolId"
            class="squircle-md bg-surface-container px-4 py-2.5 text-sm text-on-surface ghost-border focus:outline-2 focus:outline-primary"
          >
            <option [ngValue]="null">— Aucune —</option>
            @for (s of schools(); track s.id) {
              <option [ngValue]="s.id">{{ s.name }}</option>
            }
          </select>
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
            [disabled]="!canSubmit()"
          >
            {{ user() ? 'Enregistrer' : 'Créer' }}
          </button>
        </footer>
      </form>
    </app-modal-shell>
  `,
})
export class UserFormDialog {
  readonly open = input<boolean>(false);
  readonly user = input<User | null>(null);
  readonly submitted = output<UserFormPayload>();
  readonly closed = output<void>();

  protected readonly roleOptions = ROLE_OPTIONS;
  protected readonly dialogTitle = computed(() =>
    this.user() ? `Modifier ${this.user()!.name}` : 'Nouvel utilisateur',
  );

  private readonly fb = inject(FormBuilder);
  private readonly schoolStore = inject(SchoolStore);
  protected readonly schools = this.schoolStore.items;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: ['student' as UserRole, Validators.required],
    schoolId: [null as number | null],
  });

  private readonly hydrated = signal(false);

  constructor() {
    effect(() => {
      const u = this.user();
      const isOpen = this.open();
      if (!isOpen) {
        this.hydrated.set(false);
        return;
      }
      this.schoolStore.load().subscribe({ error: () => {} });
      if (this.hydrated()) return;
      if (u) {
        this.form.reset({
          name: u.name,
          email: u.email,
          password: '',
          role: u.role,
          schoolId: u.schoolId ?? null,
        });
        this.form.controls.password.setValidators([Validators.minLength(8)]);
      } else {
        this.form.reset({
          name: '',
          email: '',
          password: '',
          role: 'student',
          schoolId: null,
        });
        this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
      }
      this.form.controls.password.updateValueAndValidity();
      this.hydrated.set(true);
    });
  }

  protected canSubmit(): boolean {
    return this.form.valid;
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    const v = this.form.getRawValue();
    const payload: UserFormPayload = {
      name: v.name.trim(),
      email: v.email.trim(),
      role: v.role,
      schoolId: typeof v.schoolId === 'number' && v.schoolId > 0 ? v.schoolId : null,
    };
    if (v.password && v.password.length > 0) {
      (payload as { password?: string }).password = v.password;
    }
    this.submitted.emit(payload);
  }
}
