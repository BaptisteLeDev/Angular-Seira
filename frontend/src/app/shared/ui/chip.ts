import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ChipVariant = 'soft' | 'solid' | 'gradient';
export type ChipCategory = 'dev' | 'design' | 'project' | 'comm' | 'security' | 'data';

@Component({
  selector: 'app-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-1 font-headline text-[10px] font-bold uppercase tracking-widest"
      [style.background-color]="bgColor()"
      [style.background-image]="bgImage()"
      [style.color]="textColor()"
    >
      {{ label() }}
    </span>
  `,
})
export class Chip {
  readonly label = input.required<string>();
  /** Catégorie connue (dev|design|project|comm|security|data) — applique l'accent. */
  readonly category = input<ChipCategory | null>(null);
  /** Couleur libre (hex/CSS) — utilisée si pas de catégorie. */
  readonly color = input<string | null>(null);
  readonly variant = input<ChipVariant>('soft');

  private resolvedColor() {
    const cat = this.category();
    if (cat) return `var(--color-cat-${cat})`;
    return this.color() ?? 'var(--color-primary)';
  }

  protected readonly bgColor = computed(() => {
    const variant = this.variant();
    if (variant === 'gradient') return null;
    if (variant === 'solid') return this.resolvedColor();
    // soft: 15% transparent
    return `color-mix(in srgb, ${this.resolvedColor()} 15%, transparent)`;
  });

  protected readonly bgImage = computed(() => {
    if (this.variant() !== 'gradient') return null;
    const cat = this.category();
    if (cat) return `var(--gradient-cat-${cat})`;
    const c = this.color() ?? 'var(--color-primary)';
    return `linear-gradient(135deg, ${c}, color-mix(in oklab, ${c} 70%, white))`;
  });

  protected readonly textColor = computed(() => {
    const variant = this.variant();
    if (variant === 'soft') return this.resolvedColor();
    return '#ffffff';
  });
}
