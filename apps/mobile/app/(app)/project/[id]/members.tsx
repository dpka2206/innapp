import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../../src/api/client';
import { useAuth } from '../../../../src/store/auth';
import { Member } from '../../../../src/types';
import { COLORS } from '../../../../src/theme';
import {
  Chip,
  Field,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
  BackButton,
  GhostButton,
} from '../../../../src/components/ui';

type InviteResult = {
  member: Member;
  inviteUrl?: string | null;
  message?: string;
  emailDelivery?: 'sent' | 'logged' | string;
};

async function copyText(text: string) {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  if (Platform.OS === 'web') {
    window.prompt('Copy invite link:', text);
    return true;
  }
  return false;
}

function notify(title: string, msg: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

function openMailto(to: string, inviteUrl: string, projectHint?: string) {
  const subject = encodeURIComponent(
    projectHint ? `You're invited to ${projectHint}` : `You're invited to a project`
  );
  const body = encodeURIComponent(
    `You've been invited to collaborate on an Inn project.\n\nOpen this link to join (sign up / log in with this same email):\n\n${inviteUrl}\n`
  );
  Linking.openURL(`mailto:${to}?subject=${subject}&body=${body}`);
}

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [lastInviteEmail, setLastInviteEmail] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['members', id],
    queryFn: () =>
      api<{ members: Member[]; emailConfigured?: boolean }>(`/projects/${id}/members`, { token }),
    enabled: !!token && !!id,
  });

  const emailConfigured = !!data?.emailConfigured;

  const invite = useMutation({
    mutationFn: () =>
      api<InviteResult>(`/projects/${id}/members/invites`, {
        method: 'POST',
        token,
        body: JSON.stringify({ email: email.trim(), role }),
      }),
    onSuccess: async (res) => {
      const invitedEmail = email.trim();
      setEmail('');
      qc.invalidateQueries({ queryKey: ['members', id] });

      if (res.member.status === 'active' && !res.inviteUrl) {
        notify(
          'Access updated',
          `${invitedEmail} already has an account. The project is on their home screen now.${
            res.emailDelivery === 'sent' ? ' An email was also sent.' : ' No inbox email was sent (email not configured).'
          }`
        );
        return;
      }

      if (res.inviteUrl) {
        setLastInviteUrl(res.inviteUrl);
        setLastInviteEmail(invitedEmail);
        await copyText(res.inviteUrl);

        if (res.emailDelivery === 'sent') {
          notify(
            'Invite emailed',
            `Email sent to ${invitedEmail}.\n\nBackup link (copied):\n${res.inviteUrl}`
          );
        } else {
          notify(
            'Invite created — email not configured',
            `Access is pending for ${invitedEmail}, but no inbox email was sent yet.\n\nLink copied. Use “Open email app” below to send it yourself, or paste the link to them.\n\n${res.inviteUrl}`
          );
        }
      }
    },
    onError: (e: Error) => notify('Invite failed', e.message),
  });

  const resend = useMutation({
    mutationFn: (memberId: string) =>
      api<{ inviteUrl?: string; emailDelivery?: string }>(
        `/projects/${id}/members/${memberId}/resend`,
        { method: 'POST', token }
      ),
    onSuccess: async (res, memberId) => {
      const member = data?.members.find((m) => m.id === memberId);
      if (res.inviteUrl) {
        setLastInviteUrl(res.inviteUrl);
        setLastInviteEmail(member?.email || null);
        await copyText(res.inviteUrl);
      }
      if (res.emailDelivery === 'sent') {
        notify('Email resent', 'Invite email sent again.');
      } else {
        notify(
          'Link refreshed',
          res.inviteUrl
            ? `No inbox email (not configured).\n\nNew link copied:\n${res.inviteUrl}`
            : 'Invite updated'
        );
      }
    },
  });

  const revoke = useMutation({
    mutationFn: (memberId: string) =>
      api(`/projects/${id}/members/${memberId}`, { method: 'DELETE', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', id] }),
  });

  const changeRole = useMutation({
    mutationFn: ({ memberId, nextRole }: { memberId: string; nextRole: string }) =>
      api(`/projects/${id}/members/${memberId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ role: nextRole }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', id] }),
  });

  return (
    <Screen maxWidth={720}>
      <BackButton label="Calendar" onPress={() => router.back()} />
      <Title>Members</Title>
      <Subtitle>Invite teammates by email. Owner/Admin only.</Subtitle>

      <View style={[styles.banner, emailConfigured ? styles.bannerOk : styles.bannerWarn]}>
        <Text style={styles.bannerTitle}>
          {emailConfigured ? 'Email invites: ON' : 'Email invites: OFF'}
        </Text>
        <Text style={styles.bannerBody}>
          {emailConfigured
            ? 'Invitees get an email with an accept link. Access is also stored in the project.'
            : 'Right now only access is updated in the app. No Gmail/inbox email is sent until you add RESEND_API_KEY. Copy the invite link or use “Open email app” to send it yourself.'}
        </Text>
      </View>

      <View style={styles.card}>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="client@brand.com"
        />
        <Text style={styles.label}>Role</Text>
        <View style={styles.row}>
          {(['admin', 'editor', 'viewer'] as const).map((r) => (
            <Chip
              key={r}
              label={r}
              active={role === r}
              onPress={() => setRole(r)}
              color={COLORS.blue}
            />
          ))}
        </View>
        <PrimaryButton
          label="Invite"
          onPress={() => invite.mutate()}
          loading={invite.isPending}
          disabled={!email.trim()}
        />
        {lastInviteUrl ? (
          <View style={styles.linkBox}>
            <Text style={styles.linkLabel}>Invite link (share this)</Text>
            <Text style={styles.linkText} selectable>
              {lastInviteUrl}
            </Text>
            <PrimaryButton
              compact
              label="Copy link"
              onPress={() => copyText(lastInviteUrl)}
              color={COLORS.blue}
              textColor={COLORS.white}
            />
            {lastInviteEmail ? (
              <PrimaryButton
                compact
                label="Open email app to send"
                onPress={() => openMailto(lastInviteEmail, lastInviteUrl)}
                color={COLORS.lime}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.lime} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={data?.members || []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingTop: 16, gap: 10, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.member}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.user?.name || item.email}</Text>
                <Text style={styles.meta}>
                  {item.email} · {item.role} · {item.status}
                </Text>
                {item.inviteUrl ? (
                  <Text style={styles.pendingLink} selectable>
                    {item.inviteUrl}
                  </Text>
                ) : null}
              </View>
              {item.role !== 'owner' ? (
                <View style={styles.actions}>
                  {item.status === 'pending' ? (
                    <View style={styles.actionRow}>
                      {item.inviteUrl ? (
                        <>
                          <PrimaryButton
                            compact
                            label="Copy"
                            onPress={() => copyText(item.inviteUrl!)}
                            color={COLORS.lime}
                            style={{ flex: 1 }}
                          />
                          <PrimaryButton
                            compact
                            label="Email"
                            onPress={() => openMailto(item.email, item.inviteUrl!)}
                            color={COLORS.blue}
                            textColor={COLORS.white}
                            style={{ flex: 1 }}
                          />
                        </>
                      ) : null}
                      <PrimaryButton
                        compact
                        label="Resend"
                        onPress={() => resend.mutate(item.id)}
                        color={COLORS.black}
                        textColor={COLORS.white}
                        style={{ flex: 1 }}
                      />
                    </View>
                  ) : (
                    <View style={styles.row}>
                      {(['admin', 'editor', 'viewer'] as const).map((r) => (
                        <Chip
                          tone="onLight"
                          key={r}
                          label={r}
                          active={item.role === r}
                          onPress={() => changeRole.mutate({ memberId: item.id, nextRole: r })}
                          color={COLORS.black}
                        />
                      ))}
                    </View>
                  )}
                  <GhostButton light label="Revoke access" onPress={() => revoke.mutate(item.id)} />
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
  },
  bannerWarn: {
    backgroundColor: '#3F2A00',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  bannerOk: {
    backgroundColor: '#052e16',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  bannerTitle: {
    fontFamily: 'DMSans_700Bold',
    color: COLORS.white,
    marginBottom: 6,
  },
  bannerBody: {
    fontFamily: 'DMSans_400Regular',
    color: '#E5E7EB',
    fontSize: 13,
    lineHeight: 19,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  label: { color: '#A3A3A3', fontFamily: 'DMSans_500Medium', marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  member: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  name: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: COLORS.black },
  meta: {
    fontFamily: 'DMSans_400Regular',
    color: '#4B5563',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  pendingLink: {
    marginTop: 8,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.blue,
  },
  actions: { marginTop: 10, gap: 8 },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  linkBox: {
    marginTop: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  linkLabel: { color: COLORS.lime, fontFamily: 'DMSans_700Bold', fontSize: 12 },
  linkText: { color: '#E5E7EB', fontFamily: 'DMSans_400Regular', fontSize: 12 },
});
