import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ENV } from '@src/constants/env';

type Health = { ok: boolean; latencyMs: number } | null;

async function ping(): Promise<Health> {
  const base = ENV.apiUrl.replace(/\/api\/?$/, '');
  const url = `${base}/up`;
  const start = Date.now();
  try {
    const res = await fetch(url, { method: 'GET' });
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}

export function BackendHealthCard() {
  const [health, setHealth] = useState<Health>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const r = await ping();
      if (alive) setHealth(r);
    };
    void tick();
    const id = setInterval(tick, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const color = health == null ? '#a1a1aa' : health.ok ? '#22c55e' : '#ef4444';
  const label =
    health == null
      ? 'Vérification…'
      : health.ok
        ? `Backend OK · ${health.latencyMs} ms`
        : 'Backend injoignable';

  return (
    <View className="flex-row items-center gap-3 squircle-xl bg-surface-container p-4 ghost-border">
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text className="flex-1 font-headline text-sm font-bold text-on-surface">{label}</Text>
    </View>
  );
}
