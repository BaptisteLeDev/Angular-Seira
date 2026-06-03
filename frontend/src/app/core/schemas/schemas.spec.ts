import { describe, it, expect } from 'vitest';
import { UserSchema } from './user.schema';
import { SchoolSchema } from './school.schema';
import { FormationSchema } from './formation.schema';
import { ChapitreSchema } from './chapitre.schema';

describe('schémas stricts (#50)', () => {
  it('UserSchema rejette un email invalide et un nom vide', () => {
    expect(UserSchema.safeParse({ id: 1, name: '', email: 'x@y.fr', role: 'student' }).success).toBe(false);
    expect(UserSchema.safeParse({ id: 1, name: 'Ada', email: 'pas-un-email', role: 'student' }).success).toBe(false);
    expect(UserSchema.safeParse({ id: 1, name: 'Ada', email: 'a@b.fr', role: 'student' }).success).toBe(true);
  });
  it('SchoolSchema rejette un nom vide', () => {
    expect(SchoolSchema.safeParse({ id: 1, name: '' }).success).toBe(false);
    expect(SchoolSchema.safeParse({ id: 1, name: 'École' }).success).toBe(true);
  });
  it('FormationSchema rejette un nom vide', () => {
    expect(FormationSchema.safeParse({ id: 1, name: '' }).success).toBe(false);
  });
  it('ChapitreSchema rejette un titre vide', () => {
    expect(ChapitreSchema.safeParse({ id: 1, title: '', sortOrder: 0 }).success).toBe(false);
  });
});
