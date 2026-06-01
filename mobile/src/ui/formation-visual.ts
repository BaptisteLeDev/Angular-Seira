import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type FormationVariantId =
  | 'dev'
  | 'design'
  | 'project'
  | 'comm'
  | 'security'
  | 'data';

export interface FormationVariant {
  readonly id: FormationVariantId;
  readonly label: string;
  readonly icon: IoniconName;
  readonly color: string;
}

/**
 * Mêmes couleurs que le frontend Angular (palette cat-*).
 * Les icônes Ionicons remplacent les icônes Heroicons côté web.
 */
export const FORMATION_VARIANTS: Readonly<Record<FormationVariantId, FormationVariant>> = {
  dev: {
    id: 'dev',
    label: 'Développement',
    icon: 'code-slash',
    color: '#7bd0ff',
  },
  design: {
    id: 'design',
    label: 'Design',
    icon: 'color-palette',
    color: '#c084fc',
  },
  project: {
    id: 'project',
    label: 'Gestion de projet',
    icon: 'grid',
    color: '#fbbf24',
  },
  comm: {
    id: 'comm',
    label: 'Communication',
    icon: 'chatbubbles',
    color: '#34d399',
  },
  security: {
    id: 'security',
    label: 'Sécurité',
    icon: 'shield-checkmark',
    color: '#f87171',
  },
  data: {
    id: 'data',
    label: 'Data',
    icon: 'bar-chart',
    color: '#818cf8',
  },
};

const VARIANT_IDS: readonly FormationVariantId[] = Object.keys(
  FORMATION_VARIANTS,
) as FormationVariantId[];

export function variantFor(formationId: number): FormationVariant {
  const index = Math.abs(formationId) % VARIANT_IDS.length;
  return FORMATION_VARIANTS[VARIANT_IDS[index]];
}
