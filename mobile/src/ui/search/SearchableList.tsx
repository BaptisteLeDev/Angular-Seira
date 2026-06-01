import { useState } from 'react';
import { FlatList, type ListRenderItem, View } from 'react-native';

import { EmptyState } from '@src/ui/EmptyState';

import { SearchBar } from './SearchBar';
import { useFuzzySearch } from './useFuzzySearch';

type Props<T> = {
  data: readonly T[];
  searchKeys: readonly string[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  placeholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  ItemSeparatorComponent?: React.ComponentType;
  initialQuery?: string;
};

export function SearchableList<T>({
  data,
  searchKeys,
  renderItem,
  keyExtractor,
  placeholder,
  emptyTitle = 'Aucun résultat',
  emptyDescription = 'Essayez un autre terme.',
  ItemSeparatorComponent,
  initialQuery = '',
}: Props<T>) {
  const [query, setQuery] = useState(initialQuery);
  const filtered = useFuzzySearch(data, searchKeys, query);

  return (
    <View className="gap-4">
      <SearchBar value={query} onChangeText={setQuery} placeholder={placeholder} />
      {filtered.length === 0 ? (
        <EmptyState icon="search-outline" title={emptyTitle} description={emptyDescription} />
      ) : (
        <FlatList
          data={filtered as T[]}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemSeparatorComponent}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}
