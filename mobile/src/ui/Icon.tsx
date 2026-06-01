import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  name: IoniconName;
  size?: number;
  color?: string;
  className?: string;
};

/**
 * Wrapper mince autour d'Ionicons pour homogénéiser l'usage des icônes
 * (équivalent du `<span class="icon-[heroicons--*]">` côté web).
 */
export function Icon({ name, size = 20, color, className }: Props) {
  return <Ionicons name={name} size={size} color={color} className={className} />;
}

export type { IoniconName };
