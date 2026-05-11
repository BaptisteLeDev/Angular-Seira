import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

const HOME_ITEM: NavItem = {
  path: '/home',
  label: 'Accueil',
  icon: 'icon-[heroicons--home]',
};
const AUTH_BASE_NAV: readonly NavItem[] = [
  { path: '/dashboard', label: 'Tableau de bord', icon: 'icon-[heroicons--squares-2x2]' },
  { path: '/formations', label: 'Matières', icon: 'icon-[heroicons--book-open]' },
];

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  readonly appTitle = 'MontoMaster';
  protected readonly currentUser = computed(() => this.auth.user());
  protected readonly isAuthenticated = computed(() => this.auth.isAuthenticated());

  /**
   * Navigation adaptée au rôle :
   * - student → base uniquement (dashboard, accueil, formations)
   * - teacher → + Espace prof (mes classes / mes élèves)
   * - admin   → + Admin (CRUD écoles/utilisateurs/articles).
   *             L'admin voit la même base "élève" que tout le monde + l'édition
   *             en plus, mais PAS Espace prof (vue prof réservée aux teachers).
   * Settings ajouté pour tous les rôles authentifiés.
   */
  protected readonly navItems = computed<readonly NavItem[]>(() => {
    const items: NavItem[] = this.auth.isAuthenticated()
      ? [...AUTH_BASE_NAV]
      : [HOME_ITEM];
    if (this.auth.isTeacher()) {
      items.push({
        path: '/teacher',
        label: 'Espace prof',
        icon: 'icon-[heroicons--user-group]',
      });
    }
    if (this.auth.isAdmin()) {
      items.push({
        path: '/admin',
        label: 'Admin',
        icon: 'icon-[heroicons--shield-check]',
      });
    }
    if (this.auth.isAuthenticated()) {
      items.push({
        path: '/settings',
        label: 'Paramètres',
        icon: 'icon-[heroicons--cog-6-tooth]',
      });
    }
    return items;
  });

  protected logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login'),
    });
  }
}
