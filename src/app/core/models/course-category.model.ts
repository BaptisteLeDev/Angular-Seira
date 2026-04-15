export type CourseCategory = 'dev' | 'design' | 'project' | 'comm' | 'security' | 'data';

export interface CategoryMeta {
  readonly id: CourseCategory;
  readonly label: string;
  readonly icon: string;
  readonly color: string;
}

export const CATEGORY_META: Readonly<Record<CourseCategory, CategoryMeta>> = {
  dev: {
    id: 'dev',
    label: 'Développement',
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
    label: 'Sécurité',
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
