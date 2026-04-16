/**
 * Palette visuelle cote front (presentation pure).
 * Aucune dependance au backend : le modele Formation n'a pas de `category`,
 * alors on derive une variante deterministe a partir de l'id pour donner
 * de la variete aux cards sans changer la source de verite.
 */
export type FormationVariantId = 'dev' | 'design' | 'project' | 'comm' | 'security' | 'data';

export interface FormationVariant {
  readonly id: FormationVariantId;
  readonly label: string;
  readonly icon: string;
  readonly color: string;
}

export const FORMATION_VARIANTS: Readonly<Record<FormationVariantId, FormationVariant>> = {
  dev: {
    id: 'dev',
    label: 'Developpement',
    icon: 'icon-[heroicons--code-bracket]',
    color: 'var(--color-cat-dev)',
  },
  design: {
    id: 'design',
    label: 'Design',
    icon: 'icon-[heroicons--paint-brush]',
    color: 'var(--color-cat-design)',
  },
  project: {
    id: 'project',
    label: 'Gestion de projet',
    icon: 'icon-[heroicons--rectangle-group]',
    color: 'var(--color-cat-project)',
  },
  comm: {
    id: 'comm',
    label: 'Communication',
    icon: 'icon-[heroicons--chat-bubble-left-right]',
    color: 'var(--color-cat-comm)',
  },
  security: {
    id: 'security',
    label: 'Securite',
    icon: 'icon-[heroicons--shield-check]',
    color: 'var(--color-cat-security)',
  },
  data: {
    id: 'data',
    label: 'Data',
    icon: 'icon-[heroicons--chart-bar]',
    color: 'var(--color-cat-data)',
  },
};

const VARIANT_IDS: readonly FormationVariantId[] = Object.keys(
  FORMATION_VARIANTS,
) as FormationVariantId[];

/** Derive une variante visuelle stable a partir de l'id de formation. */
export function variantFor(formationId: number): FormationVariant {
  const index = Math.abs(formationId) % VARIANT_IDS.length;
  return FORMATION_VARIANTS[VARIANT_IDS[index]];
}
