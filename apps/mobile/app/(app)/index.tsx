import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/store/auth';
import { Project } from '../../src/types';
import { COLORS } from '../../src/theme';
import { PrimaryButton, Screen } from '../../src/components/ui';
import { InitialAvatar } from '../../src/components/InitialAvatar';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';

export default function ProjectsHome() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { isDesktop, width } = useBreakpoint();
  const columns = isDesktop ? 2 : 1;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api<{ projects: Project[] }>('/projects', { token }),
    enabled: !!token,
  });

  const projects = data?.projects || [];
  const firstName = user?.name?.split(' ')[0] || 'there';
  const helloSize = width < 480 ? 28 : isDesktop ? 40 : 32;

  return (
    <Screen style={styles.screen} maxWidth={isDesktop ? 1120 : 720}>
      <View style={styles.navBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>I</Text>
          </View>
          <Text style={styles.brandName}>Inn</Text>
        </View>
        <Pressable style={styles.profileBtn} onPress={() => router.push('/(app)/profile')}>
          <InitialAvatar name={user?.name} color={COLORS.blue} size={isDesktop ? 48 : 44} />
        </Pressable>
      </View>

      <Text style={[styles.hello, { fontSize: helloSize }]}>Hey {firstName}</Text>
      <Text style={styles.sub}>Your brand calendars in one place.</Text>

      <View style={styles.toolbar}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{projects.length}</Text>
          <Text style={styles.statLabel}>Projects</Text>
        </View>
        <PrimaryButton
          label="+ New project"
          onPress={() => router.push('/(app)/project/new')}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.lime} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          key={`cols-${columns}`}
          data={projects}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? styles.columnWrap : undefined}
          refreshing={isRefetching}
          onRefresh={refetch}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 48, flexGrow: 1 }}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>
              {projects.length ? 'All projects' : 'Get started'}
            </Text>
          }
          ListEmptyComponent={
            <View style={[styles.emptyCard, isDesktop && styles.emptyCardWide]}>
              <InitialAvatar name="I" color={COLORS.lime} size={56} />
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <Text style={styles.emptyBody}>
                Create a brand calendar, invite your team, and schedule posts.
              </Text>
              <PrimaryButton
                label="Create first project"
                onPress={() => router.push('/(app)/project/new')}
              />
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, columns > 1 && styles.cardInRow]}
              onPress={() => router.push(`/(app)/project/${item.id}`)}
            >
              <InitialAvatar name={item.name} color={item.color || COLORS.lime} size={52} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.meta} numberOfLines={2}>
                  {(item.platforms || []).join(' · ') || 'No platforms'} · {item.role}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 8, flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: COLORS.black,
  },
  brandName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  hello: {
    fontFamily: 'DMSans_700Bold',
    color: COLORS.white,
    letterSpacing: -1,
  },
  sub: {
    fontFamily: 'DMSans_400Regular',
    color: '#A3A3A3',
    marginTop: 6,
    marginBottom: 18,
    fontSize: 15,
  },
  profileBtn: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  toolbar: {
    gap: 12,
    marginBottom: 4,
  },
  statCard: {
    backgroundColor: '#121212',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statNum: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    color: COLORS.white,
  },
  statLabel: {
    fontFamily: 'DMSans_500Medium',
    color: '#A3A3A3',
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    color: '#A3A3A3',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  columnWrap: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  cardInRow: {
    flex: 1,
    marginBottom: 0,
  },
  name: { fontFamily: 'DMSans_700Bold', fontSize: 18, color: COLORS.black },
  meta: {
    fontFamily: 'DMSans_400Regular',
    color: '#4B5563',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  chevron: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    color: '#9CA3AF',
    marginTop: -4,
  },
  emptyCard: {
    backgroundColor: '#121212',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginTop: 8,
  },
  emptyCardWide: {
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  emptyTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: COLORS.white,
    marginTop: 8,
  },
  emptyBody: {
    fontFamily: 'DMSans_400Regular',
    color: '#A3A3A3',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});
