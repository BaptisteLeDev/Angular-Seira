import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CATEGORY_META, CategoryMeta } from '../../core/models/course-category.model';
import { AuthService } from '../../core/services/auth.service';

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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly categories: readonly CategoryMeta[] = Object.values(CATEGORY_META);
  protected readonly avatarUrl = 'https://cdn.flyonui.com/fy-assets/avatar/avatar-1.png';
  protected readonly beamNodes = this.buildBeamNodes();
  protected readonly userMenuOpen = signal(false);
  protected readonly currentUser = computed(() => this.authService.currentUser());
  protected readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return 'Utilisateur';
    }

    const fullName = `${user.firstName} ${user.lastName}`.trim();
    if (fullName.length > 0) {
      return fullName;
    }

    return user.email;
  });

  protected readonly stats: readonly Stat[] = [
    { value: '24+', label: 'Matières actives', icon: 'icon-[heroicons--book-open]' },
    { value: '180h', label: 'Contenu vidéo', icon: 'icon-[heroicons--play-circle]' },
    { value: '12', label: 'Mentors experts', icon: 'icon-[heroicons--user-group]' },
    { value: '2.4k', label: 'Apprenants', icon: 'icon-[heroicons--academic-cap]' },
  ];

  protected isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  protected toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  protected closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  protected logout(): void {
    this.authService.logout().subscribe({
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

    const anchors = [
      { id: 'dev', x: 16, y: 20 },
      { id: 'design', x: 84, y: 20 },
      { id: 'project', x: 12, y: 52 },
      { id: 'comm', x: 88, y: 52 },
      { id: 'security', x: 24, y: 84 },
      { id: 'data', x: 76, y: 84 },
    ] as const;

    return anchors.map((anchor, index) => {
      const meta = CATEGORY_META[anchor.id];
      const dx = anchor.x - centerX;
      const dy = anchor.y - centerY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      return {
        id: anchor.id,
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        x: anchor.x,
        y: anchor.y,
        length,
        angle,
        delayMs: index * 220,
      };
    });
  }
}
