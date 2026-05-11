import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SkeletonShape = 'rect' | 'circle';

@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="block animate-pulse bg-surface-container-high ghost-border"
      [class.rounded-full]="shape() === 'circle'"
      [class.squircle-lg]="shape() === 'rect' && radius() === 'lg'"
      [class.squircle-xl]="shape() === 'rect' && radius() === 'xl'"
      [class.squircle-md]="shape() === 'rect' && radius() === 'md'"
      [style.height]="height()"
      [style.width]="width()"
      [attr.aria-hidden]="'true'"
    ></span>
  `,
})
export class Skeleton {
  readonly shape = input<SkeletonShape>('rect');
  readonly radius = input<'md' | 'lg' | 'xl'>('lg');
  readonly height = input<string>('1rem');
  readonly width = input<string>('100%');

  protected readonly ariaHidden = computed(() => 'true');
}
