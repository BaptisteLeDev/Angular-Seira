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
import { FormationStore } from '../../../core/stores/formation.store';
import { SchoolStore } from '../../../core/stores/school.store';
import { variantFor, type FormationVariant } from '../../../shared/ui/formation-visual';
import type { Formation } from '../../../core/schemas/formation.schema';

interface FormationView {
  readonly formation: Formation;
  readonly variant: FormationVariant;
}

/**
 * Vue : formations de l'école (filtrées par IRI school).
 * Route  : /schools/:schoolId/formations
 * Accès  : admin only
 */
@Component({
  selector: 'app-school-formations',
  imports: [RouterLink],
  templateUrl: './school-formations.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolFormations implements OnInit {
  protected readonly store = inject(FormationStore);
  protected readonly schoolStore = inject(SchoolStore);

  protected readonly schoolId = input.required<string>();
  protected readonly schoolRef = computed(() => this.schoolId().trim());
  private readonly _resolvedSchoolId = signal<number | null>(null);

  /** Filtre les formations dont l'IRI school correspond à l'école courante. */
  protected readonly formations = computed<readonly FormationView[]>(() => {
    const id = this._resolvedSchoolId();
    if (!id) return [];
    const schoolIri = `/api/schools/${id}`;
    return this.store
      .items()
      .filter((f) => f.school === schoolIri)
      .map((formation) => ({ formation, variant: variantFor(formation.id) }));
  });

  ngOnInit(): void {
    const ref = this.schoolRef();
    const id = Number(ref);

    if (Number.isInteger(id) && id > 0) {
      this._resolvedSchoolId.set(id);
      this.store.load();
      return;
    }

    this.schoolStore.load().subscribe({
      next: (schools) => {
        const school = schools.find((item) => item.slug === ref);
        if (!school) return;
        this._resolvedSchoolId.set(school.id);
        this.store.load();
      },
      error: () => {
        // L'etat d'erreur est deja gere par les stores.
      },
    });

  }
}
