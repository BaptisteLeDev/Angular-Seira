import { useAuthStore } from '@src/stores/auth.store';
import { AdminDashboard } from '@src/features/dashboard/AdminDashboard';
import { TeacherDashboard } from '@src/features/dashboard/TeacherDashboard';
import { StudentDashboard } from '@src/features/dashboard/StudentDashboard';

export default function DashboardScreen() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'teacher') return <TeacherDashboard />;
  return <StudentDashboard />;
}
