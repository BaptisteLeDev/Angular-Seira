import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/stores/auth.store';

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
  private readonly auth = inject(AuthStore);

  protected readonly welcomeName = computed(() => this.auth.user()?.name ?? '');

  protected readonly quickActions: readonly QuickAction[] = [
    {
      label: 'Parcourir les matieres',
      description: '3 modules actifs dans votre parcours.',
      icon: 'icon-[heroicons--book-open]',
      routerLink: '/formations',
    },
    {
      label: 'Mes objectifs',
      description: 'Suivez votre progression hebdomadaire.',
      icon: 'icon-[heroicons--flag]',
      routerLink: '/formations',
    },
    {
      label: 'Session mentor',
      description: 'Reservez un creneau avec un formateur.',
      icon: 'icon-[heroicons--chat-bubble-left-right]',
      routerLink: '/dashboard',
    },
  ];
}
