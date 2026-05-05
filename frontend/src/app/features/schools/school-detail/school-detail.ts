import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SchoolStore } from '../../../core/stores/school.store';
import { ClassStore } from '../../../core/stores/class.store';
import { FormationStore } from '../../../core/stores/formation.store';
import { AuthStore } from '../../../core/stores/auth.store';

/**
 * Vue : détail d'une école + résumé des classes + liens.
 * Route  : /schools/:schoolId
 * Accès  : admin + school (propre école)
 */
@Component({
  selector: 'app-school-detail',
  imports: [RouterLink],
  templateUrl: './school-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolDetail implements OnInit {
  protected readonly schoolStore = inject(SchoolStore);
  protected readonly classStore = inject(ClassStore);
  protected readonly formationStore = inject(FormationStore);
  protected readonly auth = inject(AuthStore);

  protected readonly schoolId = input.required<string>();

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
