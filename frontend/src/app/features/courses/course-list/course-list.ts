import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormationStore } from '../../../core/stores/formation.store';
import type { Formation } from '../../../core/schemas/formation.schema';
import { variantFor, type FormationVariant } from '../../../shared/ui/formation-visual';

interface FormationView {
  readonly formation: Formation;
  readonly variant: FormationVariant;
}

@Component({
  selector: 'app-course-list',
  imports: [RouterLink],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseList implements OnInit {
  private readonly store = inject(FormationStore);

  protected readonly isLoading = this.store.isLoading;
  protected readonly errorMessage = this.store.error;

  protected readonly formations = computed<readonly FormationView[]>(() =>
    this.store.items().map((formation) => ({
      formation,
      variant: variantFor(formation.id),
    })),
  );

  /** Matières hors du parcours de l'élève (verrouillées, non cliquables). */
  protected readonly lockedFormations = computed<readonly FormationView[]>(() =>
    this.store.locked().map((formation) => ({
      formation,
      variant: variantFor(formation.id),
    })),
  );

  protected readonly selectedFormationId = signal<number | null>(null);

  protected readonly selectedFormation = computed<FormationView | null>(() => {
    const id = this.selectedFormationId();
    if (id === null) return null;
    return this.formations().find((view) => view.formation.id === id) ?? null;
  });

  ngOnInit(): void {
    this.store.load();
  }

  protected selectFormation(id: number): void {
    this.selectedFormationId.update((current) => (current === id ? null : id));
  }
}
