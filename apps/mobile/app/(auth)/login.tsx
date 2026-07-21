import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Field, PrimaryButton, Screen, GhostButton } from '../../src/components/ui';
import { useAuth } from '../../src/store/auth';
import { COLORS } from '../../src/theme';
import { ApiError } from '../../src/api/client';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

function GoogleSignInButton({ onToken }: { onToken: (idToken: string) => Promise<void> }) {
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  async function onGoogle() {
    try {
      const result = await promptAsync();
      if (result.type === 'success') {
        const idToken = result.params.id_token;
        if (idToken) await onToken(idToken);
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Google sign-in failed';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Google', msg);
    }
  }

  return (
    <PrimaryButton
      label="Continue with Google"
      onPress={onGoogle}
      color={COLORS.blue}
      textColor={COLORS.white}
      disabled={!request}
    />
  );
}

export default function LoginScreen() {
  const { login, loginGoogle } = useAuth();
  const router = useRouter();
  const { isDesktop, width } = useBreakpoint();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const split = isDesktop && width >= 980;

  async function onLogin() {
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Login failed';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Login failed', msg);
    } finally {
      setLoading(false);
    }
  }

  const brand = (
    <View style={[styles.brandBlock, split && styles.brandBlockSplit]}>
      <View style={styles.markRow}>
        <View style={styles.mark}>
          <Text style={styles.markLetter}>I</Text>
        </View>
        <View style={styles.markBlue} />
      </View>
      <Text style={[styles.brand, width < 400 && { fontSize: 34 }]}>Inn</Text>
      <Text style={styles.tagline}>
        Plan every brand’s posts in one place — calendars, team invites, and status at a glance.
      </Text>
    </View>
  );

  const form = (
    <View style={[styles.card, split && styles.cardSplit]}>
      <Text style={styles.cardTitle}>Welcome back</Text>
      <Text style={styles.cardSub}>Log in to open your projects.</Text>
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@brand.com"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />
      <PrimaryButton label="Log in" onPress={onLogin} loading={loading} />
      {GOOGLE_WEB_CLIENT_ID ? <GoogleSignInButton onToken={loginGoogle} /> : null}
      <GhostButton label="New here? Create an account" onPress={() => router.push('/(auth)/register')} />
    </View>
  );

  return (
    <Screen centered maxWidth={split ? 1080 : 480} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, split && styles.scrollSplit]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {split ? (
          <View style={styles.splitRow}>
            {brand}
            {form}
          </View>
        ) : (
          <>
            {brand}
            {form}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 28,
    paddingVertical: 24,
  },
  scrollSplit: {
    gap: 0,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 48,
    width: '100%',
  },
  brandBlock: { paddingTop: 8 },
  brandBlockSplit: {
    flex: 1,
    paddingTop: 0,
    paddingRight: 12,
  },
  markRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLetter: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    color: COLORS.black,
  },
  markBlue: {
    width: 28,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
  },
  brand: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 40,
    color: COLORS.white,
    letterSpacing: -1.5,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: '#A3A3A3',
    marginTop: 10,
    lineHeight: 24,
    maxWidth: 420,
  },
  card: {
    backgroundColor: '#121212',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#222',
    width: '100%',
  },
  cardSplit: {
    flex: 1,
    maxWidth: 440,
    padding: 28,
  },
  cardTitle: {
    fontFamily: 'DMSans_700Bold',
    color: COLORS.white,
    fontSize: 22,
  },
  cardSub: {
    fontFamily: 'DMSans_400Regular',
    color: '#A3A3A3',
    marginTop: 4,
    marginBottom: 16,
  },
});
