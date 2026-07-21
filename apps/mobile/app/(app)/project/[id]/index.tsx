import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  format,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { api } from '../../../../src/api/client';
import { useAuth } from '../../../../src/store/auth';
import { Post, Project } from '../../../../src/types';
import { COLORS, POST_STATUSES, STATUS_COLORS } from '../../../../src/theme';
import { CalendarShell, CalendarViewMode } from '../../../../src/components/CalendarShell';
import { PostSheet } from '../../../../src/components/PostSheet';
import { Chip, PrimaryButton, GhostButton } from '../../../../src/components/ui';
import { useBreakpoint } from '../../../../src/hooks/useBreakpoint';

export default function ProjectCalendarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const { width, isMobile } = useBreakpoint();
  const pad = width < 480 ? 10 : 14;
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<CalendarViewMode>('month');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [platform, setPlatform] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [dayDetail, setDayDetail] = useState<{ date: Date; posts: Post[] } | null>(null);

  const range = useMemo(() => {
    if (view === 'month') {
      return {
        from: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
        to: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
      };
    }
    if (view === 'week') {
      return {
        from: startOfWeek(cursor, { weekStartsOn: 1 }),
        to: endOfWeek(cursor, { weekStartsOn: 1 }),
      };
    }
    const start = new Date(cursor);
    start.setHours(0, 0, 0, 0);
    const end = new Date(cursor);
    end.setHours(23, 59, 59, 999);
    return { from: start, to: end };
  }, [cursor, view]);

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: () => api<{ project: Project }>(`/projects/${id}`, { token }),
    enabled: !!token && !!id,
  });

  const qs = new URLSearchParams({
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  });
  if (platform) qs.set('platform', platform);
  if (status) qs.set('status', status);
  if (type) qs.set('type', type);

  const postsQuery = useQuery({
    queryKey: ['posts', id, qs.toString()],
    queryFn: () => api<{ posts: Post[] }>(`/projects/${id}/posts?${qs}`, { token }),
    enabled: !!token && !!id,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editing?.id) {
        return api(`/projects/${id}/posts/${editing.id}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify(payload),
        });
      }
      return api(`/projects/${id}/posts`, {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts', id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!editing?.id) return;
      return api(`/projects/${id}/posts/${editing.id}`, { method: 'DELETE', token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts', id] }),
  });

  const project = projectQuery.data?.project;
  const canEdit = project?.role === 'owner' || project?.role === 'admin' || project?.role === 'editor';

  function openCreate(d: Date) {
    if (!canEdit || !project) return;
    setDayDetail(null);
    setEditing({
      scheduledAt: d.toISOString(),
      platforms: project.platforms.slice(0, 1),
      status: 'draft',
      contentType: project.contentTypes[0],
      category: project.categories[0],
    });
    setSheetOpen(true);
  }

  if (projectQuery.isLoading || !project) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.lime} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.frame, { paddingHorizontal: pad, paddingTop: isMobile ? 8 : 10, paddingBottom: pad }]}>
        <View style={styles.topBar}>
          <Pressable style={styles.backHit} onPress={() => router.push('/(app)')}>
            <Text style={styles.back}>← Projects</Text>
          </Pressable>
          <View style={styles.topActions}>
            <Pressable
              style={styles.topBtn}
              onPress={() => router.push(`/(app)/project/${id}/settings`)}
            >
              <Text style={styles.link}>Settings</Text>
            </Pressable>
            <Pressable style={styles.fab} onPress={() => openCreate(new Date())}>
              <Text style={styles.fabText}>+</Text>
            </Pressable>
          </View>
        </View>

        <CalendarShell
        cursor={cursor}
        view={view}
        posts={postsQuery.data?.posts || []}
        projectName={project.name}
        onChangeCursor={setCursor}
        onChangeView={setView}
        onOpenFilters={() => setFiltersOpen(true)}
        onShare={() => router.push(`/(app)/project/${id}/members`)}
        onPressPost={(p) => {
          setDayDetail(null);
          setEditing(p);
          setSheetOpen(true);
        }}
        onPressSlot={(d) => openCreate(d)}
        onPressDay={(d, dayPosts) => setDayDetail({ date: d, posts: dayPosts })}
      />

      <PostSheet
        visible={sheetOpen}
        initial={editing}
        categories={project.categories}
        contentTypes={project.contentTypes}
        platforms={project.platforms}
        canEdit={!!canEdit}
        onClose={() => setSheetOpen(false)}
        onSave={async (payload) => {
          try {
            await saveMutation.mutateAsync(payload);
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Save failed';
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Error', msg);
            throw e;
          }
        }}
        onDelete={
          editing?.id
            ? async () => {
                await deleteMutation.mutateAsync();
              }
            : undefined
        }
      />

      <Modal visible={!!dayDetail} transparent animationType="slide" onRequestClose={() => setDayDetail(null)}>
        <Pressable style={styles.filterBackdrop} onPress={() => setDayDetail(null)} />
        <View style={styles.daySheet}>
          <Text style={styles.dayTitle}>
            {dayDetail ? format(dayDetail.date, 'EEEE, d MMMM') : ''}
          </Text>
          <Text style={styles.daySub}>
            {dayDetail?.posts.length
              ? `${dayDetail.posts.length} scheduled`
              : 'Nothing scheduled yet'}
          </Text>
          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 10, paddingVertical: 12 }}>
            {(dayDetail?.posts || []).map((p) => {
              const c = STATUS_COLORS[p.status] || STATUS_COLORS.draft;
              return (
                <Pressable
                  key={p.id}
                  style={[styles.dayPost, { backgroundColor: c.bg, borderColor: c.border }]}
                  onPress={() => {
                    setDayDetail(null);
                    setEditing(p);
                    setSheetOpen(true);
                  }}
                >
                  <Text style={[styles.dayPostTitle, { color: c.text }]}>{p.title}</Text>
                  <Text style={[styles.dayPostMeta, { color: c.text }]}>
                    {format(new Date(p.scheduledAt), 'HH:mm')} · {p.contentType} · {p.status}
                    {p.platforms?.length ? ` · ${p.platforms.join(', ')}` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {canEdit ? (
            <PrimaryButton
              label="Add post this day"
              onPress={() => dayDetail && openCreate(dayDetail.date)}
            />
          ) : null}
          <GhostButton label="Close" onPress={() => setDayDetail(null)} light />
        </View>
      </Modal>

      <Modal visible={filtersOpen} transparent animationType="fade">
        <Pressable style={styles.filterBackdrop} onPress={() => setFiltersOpen(false)} />
        <View style={styles.filterSheet}>
          <Text style={styles.filterTitle}>Filters</Text>
          <Text style={styles.filterLabel}>Platform</Text>
          <View style={styles.row}>
            <Chip tone="onLight" label="All" active={!platform} onPress={() => setPlatform(null)} color={COLORS.black} />
            {project.platforms.map((p) => (
              <Chip
                tone="onLight"
                key={p}
                label={p}
                active={platform === p}
                onPress={() => setPlatform(p)}
                color={COLORS.blue}
              />
            ))}
          </View>
          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.row}>
            <Chip tone="onLight" label="All" active={!status} onPress={() => setStatus(null)} color={COLORS.black} />
            {POST_STATUSES.map((s) => (
              <Chip
                tone="onLight"
                key={s}
                label={s}
                active={status === s}
                onPress={() => setStatus(s)}
                color={COLORS.black}
              />
            ))}
          </View>
          <Text style={styles.filterLabel}>Type</Text>
          <View style={styles.row}>
            <Chip tone="onLight" label="All" active={!type} onPress={() => setType(null)} color={COLORS.black} />
            {project.contentTypes.map((t) => (
              <Chip
                tone="onLight"
                key={t}
                label={t}
                active={type === t}
                onPress={() => setType(t)}
                color={COLORS.blue}
              />
            ))}
          </View>
          <PrimaryButton label="Done" onPress={() => setFiltersOpen(false)} />
        </View>
      </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    width: '100%',
    height: '100%',
  },
  frame: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  backHit: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 12,
  },
  topBtn: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#121212',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  back: { color: '#D1D5DB', fontFamily: 'DMSans_500Medium', fontSize: 15 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  link: { color: COLORS.lime, fontFamily: 'DMSans_700Bold', fontSize: 13 },
  fab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A8D12A',
  },
  fabText: { fontSize: 24, fontFamily: 'DMSans_700Bold', color: COLORS.black, marginTop: -2 },
  filterBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  filterSheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 80,
    alignSelf: 'center',
    maxWidth: 480,
    width: '92%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTitle: { fontFamily: 'DMSans_700Bold', fontSize: 22, marginBottom: 12, color: COLORS.black },
  filterLabel: { fontFamily: 'DMSans_500Medium', color: '#4B5563', marginTop: 8, marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  daySheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    alignSelf: 'center',
    maxWidth: 480,
    width: '92%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    maxHeight: '78%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayTitle: { fontFamily: 'DMSans_700Bold', fontSize: 24, color: COLORS.black },
  daySub: { fontFamily: 'DMSans_500Medium', color: '#4B5563', marginTop: 4 },
  dayPost: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  dayPostTitle: { fontFamily: 'DMSans_700Bold', fontSize: 16 },
  dayPostMeta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginTop: 4,
    textTransform: 'capitalize',
    opacity: 0.9,
  },
});
