import { Text, View } from 'react-native';
import type { UserListItem } from '@src/schemas/user.schema';
import { LoadingView } from './LoadingView';
import { ErrorCard } from './ErrorCard';
import { EmptyState } from './EmptyState';
import { Icon } from './Icon';

type Status = 'idle' | 'loading' | 'error';

type Props = {
  items: readonly UserListItem[];
  status: Status;
  error: string | null;
};

export function UserListView({ items, status, error }: Props) {
  if (status === 'loading') return <LoadingView />;
  if (error) return <ErrorCard message={error} />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon="people-outline"
        title="Aucun élève"
        description="Aucun apprenant à afficher pour ce périmètre."
      />
    );
  }
  return (
    <View className="gap-3">
      {items.map((u) => (
        <View
          key={u.id}
          className="flex-row items-center gap-4 squircle-xl bg-surface-container p-4 ghost-border"
        >
          <View className="size-10 items-center justify-center rounded-full bg-primary/10">
            <Icon name="person-outline" size={20} color="#7bd0ff" />
          </View>
          <View className="flex-1">
            <Text className="font-headline text-base font-bold text-on-surface">
              {u.name?.trim() || u.email}
            </Text>
            <Text className="text-sm text-on-surface-variant">{u.email}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
