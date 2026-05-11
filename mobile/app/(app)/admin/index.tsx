import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';

import { RoleGate } from '@src/ui/RoleGate';
import { ScreenShell } from '@src/ui/ScreenShell';
import { Icon, type IoniconName } from '@src/ui/Icon';

type Card = {
  label: string;
  description: string;
  icon: IoniconName;
  href: Href;
};

const CARDS: readonly Card[] = [
  {
    label: 'Écoles',
    description: 'Toutes les écoles et leurs classes.',
    icon: 'business-outline',
    href: '/admin/schools',
  },
  {
    label: 'Utilisateurs',
    description: 'Admins, professeurs et élèves.',
    icon: 'people-outline',
    href: '/admin/users',
  },
  {
    label: 'Articles',
    description: 'Tous les contenus, groupés par chapitre.',
    icon: 'document-text-outline',
    href: '/admin/articles',
  },
];

export default function AdminHomeScreen() {
  return (
    <RoleGate allowed={['admin']}>
      <ScreenShell
        eyebrow="Administration"
        title="Espace admin"
        subtitle="Gérez les écoles, les utilisateurs et les contenus de la plateforme."
      >
        <View className="gap-4">
          {CARDS.map((card) => (
            <Link key={card.label} href={card.href} asChild>
              <Pressable className="flex-row items-center gap-4 squircle-xl bg-surface-container p-5 ghost-border">
                <View className="size-11 items-center justify-center squircle-lg bg-primary/10">
                  <Icon name={card.icon} size={22} color="#7bd0ff" />
                </View>
                <View className="flex-1">
                  <Text className="font-headline text-base font-bold text-on-surface">
                    {card.label}
                  </Text>
                  <Text className="text-sm text-on-surface-variant">{card.description}</Text>
                </View>
                <Icon name="chevron-forward" size={18} color="#a1a1aa" />
              </Pressable>
            </Link>
          ))}
        </View>
      </ScreenShell>
    </RoleGate>
  );
}
