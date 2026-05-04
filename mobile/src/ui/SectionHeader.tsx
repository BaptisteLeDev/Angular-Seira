import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

/**
 * Section header pattern: optional mono uppercase eyebrow, display title,
 * optional subtitle, optional right-aligned action slot.
 */
export function SectionHeader({ eyebrow, title, subtitle, action }: Props) {
  return (
    <View className="mb-4 flex-row items-end justify-between gap-3">
      <View className="flex-1">
        {eyebrow ? (
          <Text className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[2.5px] text-primary">
            {eyebrow}
          </Text>
        ) : null}
        <Text className="font-headline text-[22px] font-bold leading-tight tracking-tight text-on-surface">
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 text-[13px] leading-relaxed text-on-surface-variant">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}
