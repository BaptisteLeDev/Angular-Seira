import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/stores/auth.store';
import { HealthCard } from '../../shared/ui/health-card';

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
  imports: [RouterLink, HealthCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly auth = inject(AuthStore);

  protected readonly isAdmin = computed(() => this.auth.isAdmin());
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
        {
          label: 'Écoles',
          description: 'Établissements et classes.',
          icon: 'icon-[heroicons--building-office-2]',
          routerLink: '/schools',
        },
        {
          label: 'Utilisateurs',
          description: 'Admins, professeurs et élèves.',
          icon: 'icon-[heroicons--users]',
          routerLink: '/admin/users',
        },
        {
          label: 'Articles',
          description: 'Tous les contenus.',
          icon: 'icon-[heroicons--document-text]',
          routerLink: '/admin/articles',
        },
        {
          label: 'Suivi global',
          description: 'Progression des élèves par classe.',
          icon: 'icon-[heroicons--chart-bar]',
          routerLink: '/admin/suivi',
        },
      ];
    }

    if (this.auth.isTeacher()) {
      return [
        base,
        {
          label: 'Mes classes',
          description: 'Classes liées à vos formations.',
          icon: 'icon-[heroicons--academic-cap]',
          routerLink: '/teacher/classes',
        },
        {
          label: 'Mes élèves',
          description: 'Vue agrégée des élèves de vos classes.',
          icon: 'icon-[heroicons--user-group]',
          routerLink: '/teacher/students',
        },
        {
          label: 'Suivi des élèves',
          description: 'Progression par matière et par classe.',
          icon: 'icon-[heroicons--chart-bar]',
          routerLink: '/teacher/suivi',
        },
      ];
    }

    return [
      {
        label: 'Mon espace',
        description: 'Ma classe, mes matières, ma progression.',
        icon: 'icon-[heroicons--home-modern]',
        routerLink: '/student',
      },
      base,
      {
        label: 'Ma progression',
        description: 'Suivez votre avancement par matière.',
        icon: 'icon-[heroicons--chart-bar]',
        routerLink: '/progression',
      },
      {
        label: 'Mes paramètres',
        description: 'Gérez votre thème et votre session.',
        icon: 'icon-[heroicons--cog-6-tooth]',
        routerLink: '/settings',
      },
    ];
  });
}
