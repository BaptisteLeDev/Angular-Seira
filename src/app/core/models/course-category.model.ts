export type CourseCategory = 'dev' | 'design' | 'project' | 'comm' | 'security' | 'data';

export interface CategoryMeta {
  readonly id: CourseCategory;
  readonly label: string;
  readonly icon: string;
  /** CSS custom property exposed via Tailwind @theme (--color-cat-*). */
  readonly color: string;
}

export const CATEGORY_META: Readonly<Record<CourseCategory, CategoryMeta>> = {
  dev: { id: 'dev', label: 'Développement', icon: 'code', color: 'var(--color-cat-dev)' },
  design: { id: 'design', label: 'Design', icon: 'palette', color: 'var(--color-cat-design)' },
  project: { id: 'project', label: 'Gestion de projet', icon: 'account_tree', color: 'var(--color-cat-project)' },
  comm: { id: 'comm', label: 'Communication', icon: 'forum', color: 'var(--color-cat-comm)' },
  security: { id: 'security', label: 'Sécurité', icon: 'shield', color: 'var(--color-cat-security)' },
  data: { id: 'data', label: 'Data', icon: 'insights', color: 'var(--color-cat-data)' },
};
