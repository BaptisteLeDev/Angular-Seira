import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClassStore } from '../../../core/stores/class.store';
import { FormationStore } from '../../../core/stores/formation.store';
import { iriToId } from '../../../core/utils/iri';
import { variantFor, type FormationVariant } from '../../../shared/ui/formation-visual';
import type { Formation } from '../../../core/schemas/formation.schema';

interface FormationView {
  readonly formation: Formation;
  readonly variant: FormationVariant;
}

/**
 * Vue : formations allouées à une classe (résolues via FormationStore).
 * Route  : /classes/:classId/formations
 * Accès  : teacher + school + admin
 */
@Component({
  selector: 'app-class-formations',
  imports: [RouterLink],
  templateUrl: './class-formations.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassFormations implements OnInit {
  protected readonly classStore = inject(ClassStore);
  protected readonly formationStore = inject(FormationStore);

  protected readonly classId = input.required<string>();
  protected readonly classroom = computed(() => this.classStore.selected());

  protected readonly isLoading = computed(
    () => this.classStore.isLoading() || this.formationStore.isLoading(),
  );
  protected readonly hasError = computed(
    () => this.classStore.hasError() || this.formationStore.status() === 'error',
  );

  /**
   * Résout les IRIs de subjects de la classe en objets Formation complets.
   * Fusionne les données de ClassStore + FormationStore.
   */
  protected readonly formations = computed<readonly FormationView[]>(() => {
    const cls = this.classroom();
    if (!cls) return [];
    const subjectIds = (cls.subjects ?? []).map((iri) => iriToId(iri));
    if (subjectIds.length === 0) return [];
    return this.formationStore
      .items()
      .filter((f) => subjectIds.includes(f.id))
      .map((formation) => ({ formation, variant: variantFor(formation.id) }));
  });

  ngOnInit(): void {
    const id = Number(this.classId());
    if (id > 0) {
      this.classStore.loadById(id).subscribe();
      this.formationStore.load();
    }
  }
}
