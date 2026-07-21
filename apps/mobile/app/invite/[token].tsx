import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/store/auth';
import { COLORS } from '../../src/theme';
import { PrimaryButton, Screen, Subtitle, Title } from '../../src/components/ui';

const PENDING_INVITE_KEY = 'smc_pending_invite';

export default function InviteAcceptScreen() {
  const { token: inviteTokenParam } = useLocalSearchParams<{ token: string }>();
  const inviteToken = Array.isArray(inviteTokenParam) ? inviteTokenParam[0] : inviteTokenParam;
  const { token, hydrated } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('Opening invite…');

  useEffect(() => {
    if (!hydrated || !inviteToken) return;

    (async () => {
      if (!token) {
        await AsyncStorage.setItem(PENDING_INVITE_KEY, inviteToken);
        setMessage('Log in or sign up with the invited email to join this project.');
        setStatus('error');
        return;
      }

      setStatus('loading');
      try {
        const res = await api<{ projectId: string }>(`/invites/${inviteToken}/accept`, {
          method: 'POST',
          token,
        });
        await AsyncStorage.removeItem(PENDING_INVITE_KEY);
        setStatus('ok');
        setMessage('Invite accepted — opening project…');
        setTimeout(() => router.replace(`/(app)/project/${res.projectId}`), 600);
      } catch (e) {
        // Maybe already activated on login/register by email match
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Could not accept invite');
      }
    })();
  }, [hydrated, token, inviteToken, router]);

  return (
    <Screen style={styles.wrap}>
      <Title>Invite</Title>
      <Subtitle>{message}</Subtitle>
      {status === 'loading' ? <ActivityIndicator color={COLORS.lime} style={{ marginTop: 24 }} /> : null}
      {status === 'error' ? (
        <View style={{ marginTop: 24, gap: 10 }}>
          {!token ? (
            <>
              <PrimaryButton label="Create account" onPress={() => router.replace('/(auth)/register')} />
              <PrimaryButton
                label="Log in"
                onPress={() => router.replace('/(auth)/login')}
                color={COLORS.blue}
                textColor={COLORS.white}
              />
            </>
          ) : (
            <PrimaryButton label="Go to projects" onPress={() => router.replace('/(app)')} />
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center' },
});
