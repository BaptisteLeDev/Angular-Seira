import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/stores/auth.store';

interface QuickAction {
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly routerLink: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  teacher: 'Enseignant',
  student: 'Étudiant',
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly auth = inject(AuthStore);

  protected readonly welcomeName = computed(() => this.auth.user()?.name ?? '');

  protected readonly roleLabel = computed(
    () => ROLE_LABELS[this.auth.user()?.role ?? ''] ?? '',
  );

  protected readonly subtitle = computed(() => {
    if (this.auth.isAdmin()) return 'prêt à administrer ?';
    if (this.auth.isTeacher()) return 'prêt à enseigner ?';
    return 'prêt à apprendre ?';
  });

  protected readonly heroTitle = computed(() => {
    if (this.auth.isAdmin()) return 'Gérez votre plateforme';
    if (this.auth.isTeacher()) return 'Vos classes et matières';
    return 'Maîtriser Angular moderne';
  });

  protected readonly heroDescription = computed(() => {
    if (this.auth.isAdmin()) {
      return 'Administrez les écoles, classes et formations depuis ce tableau de bord.';
    }
    if (this.auth.isTeacher()) {
      return 'Accédez à vos classes et aux formations associées à votre enseignement.';
    }
    return 'Composants standalone, signals, change detection fine — le nouveau socle pour construire des applications performantes.';
  });

  protected readonly quickActions = computed<readonly QuickAction[]>(() => {
    const base: QuickAction = {
      label: 'Parcourir les matières',
      description: 'Explorez le catalogue complet de formations.',
      icon: 'icon-[heroicons--book-open]',
      routerLink: '/formations',
    };

    if (this.auth.isAdmin()) {
      return [
        base,
        {
          label: 'Gérer les écoles',
          description: 'Consultez et administrez tous les établissements.',
          icon: 'icon-[heroicons--building-office-2]',
          routerLink: '/schools',
        },
        {
          label: 'Administration',
          description: 'Accédez aux outils de gestion globale.',
          icon: 'icon-[heroicons--cog-6-tooth]',
          routerLink: '/schools',
        },
      ];
    }

    return [
      base,
      {
        label: 'Mes objectifs',
        description: 'Suivez votre progression hebdomadaire.',
        icon: 'icon-[heroicons--flag]',
        routerLink: '/formations',
      },
      {
        label: 'Session mentor',
        description: 'Réservez un créneau avec un formateur.',
        icon: 'icon-[heroicons--chat-bubble-left-right]',
        routerLink: '/dashboard',
      },
    ];
  });
}
