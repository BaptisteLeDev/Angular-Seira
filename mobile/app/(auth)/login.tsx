import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@src/ui/Icon';
import { useThemeColors } from '@src/ui/useThemeColors';
import { useAuthStore } from '@src/stores/auth.store';

type FormErrors = {
  email?: string;
  password?: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const palette = useThemeColors();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors: FormErrors = {
    email: !email
      ? 'L\'adresse email est obligatoire.'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? 'Format d\'email invalide.'
      : undefined,
    password: !password
      ? 'Le mot de passe est obligatoire.'
      : password.length < 6
      ? '6 caractères minimum.'
      : undefined,
  };

  const isValid = !errors.email && !errors.password;

  async function onSubmit() {
    setTouched({ email: true, password: true });
    if (!isValid || submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await login({ email, password });
      router.replace({ pathname: '/dashboard' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur de connexion.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: palette.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ backgroundColor: palette.background }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-10">
            {/* Brand */}
            <View className="mb-10 items-center">
              <View className="mb-4 size-14 items-center justify-center squircle-xl bg-primary/10">
                <Icon name="sparkles" size={28} color="#7bd0ff" />
              </View>
              <Text className="font-headline text-xs font-bold uppercase tracking-[3px] text-primary">
                MontoMaster
              </Text>
              <Text className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                Connexion
              </Text>
              <Text className="mt-2 text-sm text-on-surface-variant">
                Accédez à votre parcours e-learning.
              </Text>
            </View>

            {/* Card */}
            <View className="squircle-xl bg-surface-container p-6 ghost-border">
              {/* Email */}
              <View className="mb-5">
                <Text className="mb-2 font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Adresse email
                </Text>
                <View className="relative justify-center">
                  <View className="absolute left-4 z-10">
                    <Icon name="mail-outline" size={18} color="#a1a1aa" />
                  </View>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="vous@montomaster.fr"
                    placeholderTextColor="rgba(161,161,170,0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    className="w-full squircle-lg bg-surface-container-lowest py-3 pl-12 pr-4 text-sm text-on-surface ghost-border"
                  />
                </View>
                {touched.email && errors.email ? (
                  <View className="mt-2 flex-row items-center gap-1.5">
                    <Icon name="warning-outline" size={14} color="#f87171" />
                    <Text className="text-xs text-error">{errors.email}</Text>
                  </View>
                ) : null}
              </View>

              {/* Password */}
              <View className="mb-5">
                <Text className="mb-2 font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Mot de passe
                </Text>
                <View className="relative justify-center">
                  <View className="absolute left-4 z-10">
                    <Icon name="lock-closed-outline" size={18} color="#a1a1aa" />
                  </View>
                  <TextInput
                    ref={passwordRef}
                    value={password}
                    onChangeText={setPassword}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(161,161,170,0.5)"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={() => {
                      void onSubmit();
                    }}
                    className="w-full squircle-lg bg-surface-container-lowest py-3 pl-12 pr-12 text-sm text-on-surface ghost-border"
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                    }
                    className="absolute right-3 squircle-sm p-1.5"
                  >
                    <Icon
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#a1a1aa"
                    />
                  </Pressable>
                </View>
                {touched.password && errors.password ? (
                  <View className="mt-2 flex-row items-center gap-1.5">
                    <Icon name="warning-outline" size={14} color="#f87171" />
                    <Text className="text-xs text-error">{errors.password}</Text>
                  </View>
                ) : null}
              </View>

              {/* Mot de passe oublié */}
              <View className="mb-5 flex-row justify-end">
                <Pressable
                  onPress={() =>
                    Alert.alert(
                      'Mot de passe oublié',
                      'Contactez votre établissement pour réinitialiser votre mot de passe.',
                    )
                  }
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text className="text-sm text-primary">Mot de passe oublié ?</Text>
                </Pressable>
              </View>

              {/* Submit */}
              <Pressable
                onPress={onSubmit}
                disabled={!isValid || submitting}
                className={`flex-row items-center justify-center gap-2 squircle-lg bg-primary px-5 py-3 ${
                  !isValid || submitting ? 'opacity-60' : ''
                }`}
                accessibilityRole="button"
              >
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color="#041c27" />
                    <Text className="font-headline text-sm font-bold text-on-primary">
                      Connexion en cours…
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="font-headline text-sm font-bold text-on-primary">
                      Se connecter
                    </Text>
                    <Icon name="arrow-forward" size={16} color="#041c27" />
                  </>
                )}
              </Pressable>

              {submitError ? (
                <View
                  className="mt-5 squircle-lg bg-error-container px-4 py-3"
                  style={{ borderWidth: 1, borderColor: 'rgba(248,113,113,0.5)' }}
                >
                  <Text className="text-sm text-on-error-container">{submitError}</Text>
                </View>
              ) : null}
            </View>

            <View className="mt-6 flex-row items-center justify-center">
              <Text className="text-sm text-on-surface-variant">Pas inscrit ?</Text>
              <Link href="/home" className="ml-1">
                <Text className="text-sm font-medium text-primary">Découvrir MontoMaster</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
