import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/stores/auth.store';
import { FORMATION_VARIANTS, type FormationVariant } from '../../shared/ui/formation-visual';

interface Stat {
  readonly value: string;
  readonly label: string;
  readonly icon: string;
}

interface BeamNode {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly color: string;
  readonly x: number;
  readonly y: number;
  readonly length: number;
  readonly angle: number;
  readonly delayMs: number;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly categories: readonly FormationVariant[] = Object.values(FORMATION_VARIANTS);
  protected readonly beamNodes = this.buildBeamNodes();
  /** Initiale de l'utilisateur (remplace l'avatar CDN tiers). */
  protected readonly userInitial = computed(
    () => (this.auth.user()?.name ?? '').trim().charAt(0).toUpperCase() || '?',
  );

  protected readonly userMenuOpen = signal(false);
  protected readonly currentUser = computed(() => this.auth.user());
  protected readonly isAuthenticated = computed(() => this.auth.isAuthenticated());

  protected readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'Utilisateur';
    const fullName = user.name.trim();
    return fullName.length > 0 ? fullName : user.email;
  });

  protected readonly stats: readonly Stat[] = [
    { value: '24+', label: 'Matieres actives', icon: 'icon-[heroicons--book-open]' },
    { value: '180h', label: 'Contenu video', icon: 'icon-[heroicons--play-circle]' },
    { value: '12', label: 'Mentors experts', icon: 'icon-[heroicons--user-group]' },
    { value: '2.4k', label: 'Apprenants', icon: 'icon-[heroicons--academic-cap]' },
  ];

  protected toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  protected closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.userMenuOpen.set(false);
        this.router.navigateByUrl('/login');
      },
      error: () => {
        this.userMenuOpen.set(false);
        this.router.navigateByUrl('/login');
      },
    });
  }

  private buildBeamNodes(): readonly BeamNode[] {
    const centerX = 50;
    const centerY = 50;
    const variantValues = Object.values(FORMATION_VARIANTS);

    const anchors = [
      { x: 16, y: 20 },
      { x: 84, y: 20 },
      { x: 12, y: 52 },
      { x: 88, y: 52 },
      { x: 24, y: 84 },
      { x: 76, y: 84 },
    ] as const;

    return anchors.map((anchor, index) => {
      const variant = variantValues[index % variantValues.length];
      const dx = anchor.x - centerX;
      const dy = anchor.y - centerY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      return {
        id: variant.id,
        label: variant.label,
        icon: variant.icon,
        color: variant.color,
        x: anchor.x,
        y: anchor.y,
        length,
        angle,
        delayMs: index * 220,
      };
    });
  }
}
