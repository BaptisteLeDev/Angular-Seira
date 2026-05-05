import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-fab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="fixed right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-[var(--shadow-elev-2)] transition-all duration-[var(--motion-duration-base)]"
      [class.translate-y-0]="visible()"
      [class.opacity-100]="visible()"
      [class.pointer-events-auto]="visible()"
      [class.translate-y-24]="!visible()"
      [class.opacity-0]="!visible()"
      [class.pointer-events-none]="!visible()"
      [style.bottom.px]="bottom()"
      [attr.aria-label]="ariaLabel()"
      (click)="pressed.emit()"
    >
      <span class="text-xl" [class]="icon()" aria-hidden="true"></span>
    </button>
  `,
})
export class Fab {
  readonly visible = input<boolean>(true);
  readonly icon = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly bottom = input<number>(24);
  readonly pressed = output<void>();
}
