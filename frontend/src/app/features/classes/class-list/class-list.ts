import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClassStore } from '../../../core/stores/class.store';
import { AuthStore } from '../../../core/stores/auth.store';
import { SchoolStore } from '../../../core/stores/school.store';
import { ToastService } from '../../../shared/feedback/toast.service';
import { ConfirmDialogService } from '../../../shared/feedback/confirm-dialog.service';
import { ClassFormDialog, type ClassFormPayload } from '../../../shared/dialogs/class-form.dialog';
import type { Classroom } from '../../../core/schemas/class.schema';

/**
 * Vue : toutes les classes d'une école.
 * Route  : /schools/:schoolId/classes
 * Accès  : admin + school
 */
@Component({
  selector: 'app-class-list',
  imports: [RouterLink, ClassFormDialog],
  templateUrl: './class-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassList implements OnInit {
  protected readonly store = inject(ClassStore);
  protected readonly schoolStore = inject(SchoolStore);
  protected readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly confirmSvc = inject(ConfirmDialogService);

  protected readonly dialogOpen = signal(false);

  protected readonly schoolId = input.required<string>();
  protected readonly schoolRef = computed(() => this.schoolId().trim());
  private readonly _resolvedSchoolId = signal<number | null>(null);
  protected readonly resolvedSchoolId = this._resolvedSchoolId.asReadonly();
  protected readonly classrooms = computed(() => {
    const id = this._resolvedSchoolId();
    return id ? this.store.forSchool(id) : [];
  });

  protected onSubmit(payload: ClassFormPayload): void {
    const schoolId = this._resolvedSchoolId();
    if (!schoolId) return;
    this.store
      .create({ name: payload.name, slug: payload.slug, level: payload.level, school_id: schoolId })
      .subscribe({
        next: (c) => {
          this.dialogOpen.set(false);
          this.toast.success(`Classe « ${c.name} » créée.`);
        },
        error: (err: unknown) =>
          this.toast.error(err instanceof Error ? err.message : 'Erreur lors de la création.'),
      });
  }

  protected async onDelete(classroom: Classroom): Promise<void> {
    const ok = await this.confirmSvc.confirm({
      title: `Supprimer « ${classroom.name} » ?`,
      message: 'Cette action est irréversible (suppression logique).',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    this.store.delete(classroom.id).subscribe({
      next: () => this.toast.success('Classe supprimée.'),
      error: (err: unknown) =>
        this.toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression.'),
    });
  }

  ngOnInit(): void {
    const ref = this.schoolRef();
    const id = Number(ref);

    if (Number.isInteger(id) && id > 0) {
      this._resolvedSchoolId.set(id);
      this.store.loadBySchool(id).subscribe();
      return;
    }

    this.schoolStore.load().subscribe({
      next: (schools) => {
        const school = schools.find((item) => item.slug === ref);
        if (!school) return;
        this._resolvedSchoolId.set(school.id);
        this.store.loadBySchool(school.id).subscribe();
      },
      error: () => {
        // L'etat d'erreur est deja gere par les stores.
      },
    });
  }
}
