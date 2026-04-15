import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  readonly appTitle = 'SeirAngular';

  protected readonly primaryNav: readonly NavItem[] = [
    { path: '/home', label: 'Accueil', icon: 'icon-[heroicons--home]' },
    { path: '/dashboard', label: 'Tableau de bord', icon: 'icon-[heroicons--squares-2x2]' },
    { path: '/courses', label: 'Matières', icon: 'icon-[heroicons--book-open]' },
  ];
}
