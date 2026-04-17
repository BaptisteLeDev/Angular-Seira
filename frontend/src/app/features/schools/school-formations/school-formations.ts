import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormationStore } from '../../../core/stores/formation.store';
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

  protected readonly schoolId$ = input.required<string>();

  /** Filtre les formations dont l'IRI school correspond à l'école courante. */
  protected readonly formations = computed<readonly FormationView[]>(() => {
    const schoolIri = `/api/schools/${Number(this.schoolId$())}`;
    return this.store
      .items()
      .filter((f) => f.school === schoolIri)
      .map((formation) => ({ formation, variant: variantFor(formation.id) }));
  });

  ngOnInit(): void {
    this.store.load();
  }
}
