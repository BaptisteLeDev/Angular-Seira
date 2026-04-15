import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface QuickAction {
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly routerLink: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  protected readonly welcomeName = 'Alex';

  protected readonly quickActions: readonly QuickAction[] = [
    {
      label: 'Parcourir les matières',
      description: '3 modules actifs dans votre parcours.',
      icon: 'auto_stories',
      routerLink: '/courses',
    },
    {
      label: 'Mes objectifs',
      description: 'Suivez votre progression hebdomadaire.',
      icon: 'target',
      routerLink: '/courses',
    },
    {
      label: 'Session mentor',
      description: 'Réservez un créneau avec un formateur.',
      icon: 'forum',
      routerLink: '/dashboard',
    },
  ];
}
