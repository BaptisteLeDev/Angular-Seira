import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SchoolStore } from '../../../core/stores/school.store';
import { ClassStore } from '../../../core/stores/class.store';
import { FormationStore } from '../../../core/stores/formation.store';
import { AuthStore } from '../../../core/stores/auth.store';
import { ToastService } from '../../../shared/feedback/toast.service';
import { ConfirmDialogService } from '../../../shared/feedback/confirm-dialog.service';
import { SchoolFormDialog, type SchoolFormPayload } from '../../../shared/dialogs/school-form.dialog';

/**
 * Vue : détail d'une école + résumé des classes + liens.
 * Route  : /schools/:schoolId
 * Accès  : admin + school (propre école)
 */
@Component({
  selector: 'app-school-detail',
  imports: [RouterLink, SchoolFormDialog],
  templateUrl: './school-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolDetail implements OnInit {
  protected readonly schoolStore = inject(SchoolStore);
  protected readonly classStore = inject(ClassStore);
  protected readonly formationStore = inject(FormationStore);
  protected readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirmSvc = inject(ConfirmDialogService);

  protected readonly schoolId = input.required<string>();
  protected readonly dialogOpen = signal(false);

  protected readonly school = computed(() => this.schoolStore.selected());
  protected readonly classrooms = computed(() => {
    const selected = this.school();
    return selected ? this.classStore.forSchool(selected.id) : [];
  });
  protected readonly schoolFormations = computed(() => {
    const school = this.school();
    if (!school) return [];
    return this.formationStore
      .items()
      .filter((formation) => formation.school === `/api/schools/${school.id}`);
  });
  protected readonly teacherCount = computed(() => {
    const ids = new Set(
      this.schoolFormations()
        .map((formation) => formation.teacher)
        .filter((iri): iri is string => typeof iri === 'string'),
    );
    return ids.size;
  });
  protected readonly isLoading = computed(
    () =>
      this.schoolStore.isLoading() ||
      this.classStore.isLoading() ||
      this.formationStore.isLoading(),
  );
  protected readonly hasError = computed(
    () =>
      this.schoolStore.hasError() ||
      this.classStore.hasError() ||
      this.formationStore.status() === 'error',
  );

  protected onSubmit(payload: SchoolFormPayload): void {
    const current = this.school();
    if (!current) return;
    const body = payload.slug ? { name: payload.name, slug: payload.slug } : { name: payload.name };
    this.schoolStore.update(current.id, body).subscribe({
      next: () => {
        this.dialogOpen.set(false);
        this.toast.success('École mise à jour.');
      },
      error: (err: unknown) =>
        this.toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.'),
    });
  }

  protected async onDelete(): Promise<void> {
    const current = this.school();
    if (!current) return;
    const ok = await this.confirmSvc.confirm({
      title: `Supprimer « ${current.name} » ?`,
      message: 'Cette action est irréversible (suppression logique).',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    this.schoolStore.delete(current.id).subscribe({
      next: () => {
        this.toast.success('École supprimée.');
        void this.router.navigate(['/schools']);
      },
      error: (err: unknown) =>
        this.toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression.'),
    });
  }

  ngOnInit(): void {
    const ref = this.schoolId().trim();
    const id = Number(ref);

    if (Number.isInteger(id) && id > 0) {
      this.schoolStore.loadById(id).subscribe();
      this.classStore.loadBySchool(id).subscribe();
      this.formationStore.load();
      return;
    }

    this.schoolStore.load().subscribe({
      next: (schools) => {
        const school = schools.find((item) => item.slug === ref);
        if (!school) {
          return;
        }
        this.schoolStore.loadById(school.id).subscribe();
        this.classStore.loadBySchool(school.id).subscribe();
        this.formationStore.load();
      },
      error: () => {
        // Le store expose deja l'etat d'erreur consomme par le template.
      },
    });
  }
}
