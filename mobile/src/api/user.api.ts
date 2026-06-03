import { fetchHydraAll } from './pagination';
import { UserListItemSchema, type UserListItem } from '@src/schemas/user.schema';

type ListParams = {
  role?: 'admin' | 'teacher' | 'student';
  schoolId?: number | null;
};

function toQuery(params: ListParams): string {
  const search = new URLSearchParams();
  if (params.role) search.set('role', params.role);
  if (params.schoolId != null) search.set('school', String(params.schoolId));
  const qs = search.toString();
  return qs.length > 0 ? `?${qs}` : '';
}

export const UserApi = {
  async list(params: ListParams = {}): Promise<UserListItem[]> {
    return fetchHydraAll(`/users${toQuery(params)}`, UserListItemSchema);
  },
};
