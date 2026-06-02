import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard, requireRoles } from './core/guards/role.guard';
import type { UserRole } from './core/schemas/user.schema';

/** Helper pour typer `data.roles` sans augmentation de module. */
function roles(...r: UserRole[]): { roles: UserRole[] } {
  return { roles: r };
}

export const routes: Routes = [
  // ── Public ──────────────────────────────────────────────────────────────
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/components/unauthorized/unauthorized').then((m) => m.Unauthorized),
  },

  // ── Authenticated — all roles ────────────────────────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings.page').then((m) => m.Settings),
  },
  {
    path: 'progression',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/progression/progression.page').then((m) => m.Progression),
  },

  // ── Teacher hub (teacher only — l'admin a son propre hub /admin) ─────────
  {
    path: 'teacher',
    ...requireRoles('teacher'),
    loadComponent: () =>
      import('./features/teacher/teacher-hub.page').then((m) => m.TeacherHub),
  },
  {
    path: 'teacher/classes',
    ...requireRoles('teacher'),
    loadComponent: () =>
      import('./features/teacher/teacher-classes.page').then((m) => m.TeacherClasses),
  },
  {
    path: 'teacher/students',
    ...requireRoles('teacher'),
    loadComponent: () =>
      import('./features/teacher/teacher-students.page').then((m) => m.TeacherStudents),
  },

  // ── Formations ───────────────────────────────────────────────────────────
  {
    path: 'formations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/courses/course-list/course-list').then((m) => m.CourseList),
  },
  {
    path: 'formations/:formationId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/courses/course-detail/course-detail').then((m) => m.CourseDetail),
  },
  {
    path: 'formations/:formationId/:articleId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/courses/course-detail/course-detail').then((m) => m.CourseDetail),
  },

  // ── Admin hub + pages ────────────────────────────────────────────────────
  {
    path: 'admin',
    ...requireRoles('admin'),
    loadComponent: () => import('./features/admin/admin-hub.page').then((m) => m.AdminHub),
  },
  {
    path: 'admin/users',
    ...requireRoles('admin'),
    loadComponent: () =>
      import('./features/admin/admin-users.page').then((m) => m.AdminUsers),
  },
  {
    path: 'admin/articles',
    ...requireRoles('admin'),
    loadComponent: () =>
      import('./features/admin/admin-articles.page').then((m) => m.AdminArticles),
  },
  {
    path: 'admin/articles/:formationId',
    ...requireRoles('admin'),
    loadComponent: () =>
      import('./features/admin/admin-articles.page').then((m) => m.AdminArticles),
  },

  // ── Schools — admin only ─────────────────────────────────────────────────
  {
    path: 'schools',
    canActivate: [authGuard, roleGuard],
    data: roles('admin'),
    loadComponent: () =>
      import('./features/schools/school-list/school-list').then((m) => m.SchoolList),
  },

  // ── School detail — admin only ─────────────────────────────────────────
  {
    path: 'schools/:schoolId',
    canActivate: [authGuard, roleGuard],
    data: roles('admin'),
    loadComponent: () =>
      import('./features/schools/school-detail/school-detail').then((m) => m.SchoolDetail),
  },
  {
    path: 'schools/:schoolId/classes',
    canActivate: [authGuard, roleGuard],
    data: roles('admin'),
    loadComponent: () =>
      import('./features/classes/class-list/class-list').then((m) => m.ClassList),
  },
  {
    path: 'schools/:schoolId/formations',
    canActivate: [authGuard, roleGuard],
    data: roles('admin'),
    loadComponent: () =>
      import('./features/schools/school-formations/school-formations').then(
        (m) => m.SchoolFormations,
      ),
  },

  // ── Classes — teacher + admin ───────────────────────────────────────────
  {
    path: 'classes/:classId/students',
    canActivate: [authGuard, roleGuard],
    data: roles('admin', 'teacher'),
    loadComponent: () =>
      import('./features/classes/class-students/class-students').then((m) => m.ClassStudents),
  },
  {
    path: 'classes/:classId/formations',
    canActivate: [authGuard, roleGuard],
    data: roles('admin', 'teacher'),
    loadComponent: () =>
      import('./features/classes/class-formations/class-formations').then(
        (m) => m.ClassFormations,
      ),
  },

  // ── Legacy redirects ─────────────────────────────────────────────────────
  { path: 'courses', redirectTo: 'formations', pathMatch: 'full' },
  { path: 'courses/:id', redirectTo: 'formations', pathMatch: 'full' },

  // ── 404 ──────────────────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/page-not-found/page-not-found').then((m) => m.PageNotFound),
  },
];
