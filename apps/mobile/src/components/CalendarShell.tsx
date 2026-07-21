import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getYear,
  isSameDay,
  isSameMonth,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { Post } from '../types';
import { COLORS, STATUS_COLORS } from '../theme';
import { CircleIconButton } from './ui';

export type CalendarViewMode = 'day' | 'week' | 'month';

type Props = {
  cursor: Date;
  view: CalendarViewMode;
  posts: Post[];
  projectName: string;
  onChangeCursor: (d: Date) => void;
  onChangeView: (v: CalendarViewMode) => void;
  onOpenFilters: () => void;
  onShare: () => void;
  onPressPost: (p: Post) => void;
  onPressSlot: (d: Date) => void;
  onPressDay: (d: Date, dayPosts: Post[]) => void;
};

function PostCard({
  post,
  onPress,
  compact,
}: {
  post: Post;
  onPress: () => void;
  compact?: boolean;
}) {
  const colors = STATUS_COLORS[post.status] || STATUS_COLORS.draft;
  const start = new Date(post.scheduledAt);
  return (
    <Pressable
      onPress={(e) => {
        e?.stopPropagation?.();
        onPress();
      }}
      style={[
        styles.postCard,
        compact && styles.postCardCompact,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: post.status === 'idea' ? 1.5 : 0,
        },
      ]}
    >
      <Text style={[styles.postTitle, { color: colors.text }, compact && { fontSize: 10 }]} numberOfLines={compact ? 1 : 2}>
        {post.title}
      </Text>
      <Text style={[styles.postTime, { color: colors.text }]} numberOfLines={1}>
        {format(start, 'HH:mm')} · {post.contentType}
      </Text>
    </Pressable>
  );
}

function MonthPicker({
  visible,
  cursor,
  onClose,
  onSelect,
}: {
  visible: boolean;
  cursor: Date;
  onClose: () => void;
  onSelect: (d: Date) => void;
}) {
  const [year, setYearState] = useState(getYear(cursor));
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => setMonth(setYear(new Date(), year), i)),
    [year]
  );

  useEffect(() => {
    if (visible) setYearState(getYear(cursor));
  }, [visible, cursor]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.pickerBackdrop} onPress={onClose} />
      <View style={styles.pickerSheet}>
        <View style={styles.pickerYearRow}>
          <CircleIconButton label="‹" onPress={() => setYearState((y) => y - 1)} />
          <Text style={styles.pickerYear}>{year}</Text>
          <CircleIconButton label="›" onPress={() => setYearState((y) => y + 1)} />
        </View>
        <View style={styles.pickerGrid}>
          {months.map((m) => {
            const active = isSameMonth(m, cursor) && getYear(cursor) === year;
            return (
              <Pressable
                key={m.toISOString()}
                style={[styles.pickerMonth, active && styles.pickerMonthActive]}
                onPress={() => {
                  onSelect(startOfMonth(m));
                  onClose();
                }}
              >
                <Text style={[styles.pickerMonthText, active && styles.pickerMonthTextActive]}>
                  {format(m, 'MMM')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

export function CalendarShell(props: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const wideHeader = width >= 900;
  const [pickerOpen, setPickerOpen] = useState(false);

  function goPrev() {
    if (props.view === 'month') props.onChangeCursor(subMonths(props.cursor, 1));
    else if (props.view === 'week') props.onChangeCursor(subWeeks(props.cursor, 1));
    else props.onChangeCursor(addDays(props.cursor, -1));
  }
  function goNext() {
    if (props.view === 'month') props.onChangeCursor(addMonths(props.cursor, 1));
    else if (props.view === 'week') props.onChangeCursor(addWeeks(props.cursor, 1));
    else props.onChangeCursor(addDays(props.cursor, 1));
  }

  return (
    <View style={styles.shell}>
      {!compact ? (
        <View style={styles.topBanner}>
          <View style={[styles.blueCard, width < 900 && { width: 120 }]}>
            {['Calendar', 'Posts', 'Team'].map((t) => (
              <View key={t} style={styles.oval}>
                <Text style={styles.ovalText}>{t}</Text>
              </View>
            ))}
          </View>
          <View style={styles.bannerCard}>
            <Text style={styles.bannerEyebrow}>{props.projectName}</Text>
            <Text style={styles.bannerText}>Plan, schedule, and track every post.</Text>
          </View>
        </View>
      ) : (
        <View style={styles.bannerCardNarrow}>
          <Text style={styles.bannerEyebrow}>{props.projectName}</Text>
          <Text style={styles.bannerTextNarrow}>Content calendar</Text>
        </View>
      )}

      <View style={[styles.limePanel, compact && styles.limePanelCompact]}>
        <View style={[styles.calHeader, wideHeader && styles.calHeaderWide]}>
          <View style={[styles.navRow, wideHeader && styles.navRowWide]}>
            <CircleIconButton label="‹" onPress={goPrev} size={38} />
            <Pressable style={styles.monthDropdown} onPress={() => setPickerOpen(true)}>
              <Text style={[styles.monthTitle, compact && { fontSize: 22, lineHeight: 26 }]} numberOfLines={1}>
                {format(props.cursor, 'MMMM')}
              </Text>
              <Text style={styles.monthYear}>{format(props.cursor, 'yyyy')} ▾</Text>
            </Pressable>
            <CircleIconButton label="›" onPress={goNext} size={38} />
          </View>

          <View style={[styles.toggleRow, wideHeader && styles.toggleRowWide]}>
            <View style={styles.toggle}>
              {(['day', 'week', 'month'] as CalendarViewMode[]).map((v) => (
                <Pressable
                  key={v}
                  onPress={() => props.onChangeView(v)}
                  style={[styles.toggleItem, props.view === v && styles.toggleActive]}
                >
                  <Text style={[styles.toggleText, props.view === v && styles.toggleTextActive]}>
                    {v}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.actionRow, wideHeader && styles.actionRowWide]}>
            <Pressable style={styles.actionBtn} onPress={props.onOpenFilters}>
              <Text style={styles.actionBtnText}>Filters</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.actionBtnDark]} onPress={props.onShare}>
              <Text style={[styles.actionBtnText, styles.actionBtnTextDark]}>Share</Text>
            </Pressable>
          </View>
        </View>

        {props.view === 'day' ? (
          <AgendaView {...props} />
        ) : props.view === 'month' ? (
          <MonthView {...props} compact={compact} />
        ) : compact ? (
          <AgendaView {...props} />
        ) : (
          <WeekView {...props} />
        )}
      </View>

      <MonthPicker
        visible={pickerOpen}
        cursor={props.cursor}
        onClose={() => setPickerOpen(false)}
        onSelect={props.onChangeCursor}
      />
    </View>
  );
}

function AgendaView({ cursor, posts, onPressPost, onPressDay, onPressSlot, view }: Props) {
  const days =
    view === 'day'
      ? [cursor]
      : eachDayOfInterval({
          start: startOfWeek(cursor, { weekStartsOn: 1 }),
          end: endOfWeek(cursor, { weekStartsOn: 1 }),
        });

  return (
    <ScrollView style={styles.grid} contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 28 }}>
      {days.map((day) => {
        const dayPosts = posts
          .filter((p) => isSameDay(new Date(p.scheduledAt), day))
          .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
        const isToday = isSameDay(day, new Date());
        return (
          <Pressable
            key={day.toISOString()}
            style={[styles.agendaDay, isToday && styles.agendaDayToday]}
            onPress={() => onPressDay(day, dayPosts)}
          >
            <View style={styles.agendaHeader}>
              <View>
                <Text style={styles.agendaDate}>{format(day, 'EEE d MMM')}</Text>
                <Text style={styles.agendaCount}>
                  {dayPosts.length === 0
                    ? 'Nothing scheduled'
                    : `${dayPosts.length} post${dayPosts.length === 1 ? '' : 's'}`}
                </Text>
              </View>
              <Pressable
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onPressSlot(day);
                }}
                style={styles.addBtn}
              >
                <Text style={styles.addHint}>+ Add</Text>
              </Pressable>
            </View>
            {dayPosts.length > 0 ? (
              <View style={styles.agendaPosts}>
                {dayPosts.map((p) => (
                  <PostCard key={p.id} post={p} onPress={() => onPressPost(p)} />
                ))}
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function WeekView({ cursor, posts, onPressPost, onPressSlot, onPressDay }: Props) {
  const days = eachDayOfInterval({
    start: startOfWeek(cursor, { weekStartsOn: 1 }),
    end: endOfWeek(cursor, { weekStartsOn: 1 }),
  });
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  return (
    <ScrollView style={styles.grid} horizontal={false}>
      <View style={styles.weekHeader}>
        <View style={styles.timeGutter} />
        {days.map((d) => {
          const dayPosts = posts.filter((p) => isSameDay(new Date(p.scheduledAt), d));
          return (
            <Pressable
              key={d.toISOString()}
              style={styles.dayColHead}
              onPress={() => onPressDay(d, dayPosts)}
            >
              <Text style={styles.dayName}>{format(d, 'EEE')}</Text>
              <View style={[styles.dayNum, isSameDay(d, new Date()) && styles.dayNumActive]}>
                <Text
                  style={[styles.dayNumText, isSameDay(d, new Date()) && { color: COLORS.white }]}
                >
                  {format(d, 'd')}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {hours.map((h) => (
        <View key={h} style={styles.hourRow}>
          <Text style={styles.timeLabel}>{`${String(h).padStart(2, '0')}:00`}</Text>
          {days.map((d) => {
            const slotPosts = posts.filter((p) => {
              const dt = new Date(p.scheduledAt);
              return isSameDay(dt, d) && dt.getHours() === h;
            });
            return (
              <Pressable
                key={d.toISOString() + h}
                style={styles.cell}
                onPress={() => {
                  const slot = new Date(d);
                  slot.setHours(h, 0, 0, 0);
                  onPressSlot(slot);
                }}
              >
                {slotPosts.map((p) => (
                  <PostCard key={p.id} post={p} onPress={() => onPressPost(p)} />
                ))}
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

function MonthView({
  cursor,
  posts,
  onPressPost,
  onPressDay,
  compact,
}: Props & { compact?: boolean }) {
  const { height } = useWindowDimensions();
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  const weeks = Math.max(5, Math.ceil(days.length / 7));
  // Fill remaining viewport: reserve space for top nav + banner + calendar chrome
  const chrome = compact ? 240 : 300;
  const cellMinH = Math.max(compact ? 64 : 88, Math.floor((height - chrome) / weeks));

  return (
    <ScrollView
      style={styles.grid}
      contentContainerStyle={{ padding: compact ? 8 : 10, flexGrow: 1 }}
    >
      <View style={styles.monthGrid}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <Text key={d} style={[styles.monthDow, compact && { fontSize: 11 }]}>
            {d}
          </Text>
        ))}
        {days.map((d) => {
          const dayPosts = posts.filter((p) => isSameDay(new Date(p.scheduledAt), d));
          const inMonth = isSameMonth(d, cursor);
          const isToday = isSameDay(d, new Date());
          return (
            <Pressable
              key={d.toISOString()}
              style={[
                styles.monthCell,
                { minHeight: cellMinH },
                compact && styles.monthCellCompact,
                !inMonth && styles.monthCellOutside,
                isToday && styles.monthCellToday,
              ]}
              onPress={() => onPressDay(d, dayPosts)}
            >
              <Text style={[styles.monthDayNum, isToday && styles.monthDayNumToday, !inMonth && styles.monthDayOutside]}>
                {format(d, 'd')}
              </Text>
              <View style={styles.monthDots}>
                {dayPosts.slice(0, compact ? 3 : 4).map((p) => {
                  const c = STATUS_COLORS[p.status] || STATUS_COLORS.draft;
                  return (
                    <View key={p.id} style={styles.typeChip}>
                      <View style={[styles.dot, { backgroundColor: c.bg === '#FFFFFF' ? c.border : c.bg }]} />
                      <Text style={styles.typeChipText} numberOfLines={1}>
                        {p.contentType}
                      </Text>
                    </View>
                  );
                })}
                {dayPosts.length > (compact ? 3 : 4) ? (
                  <Text style={styles.more}>+{dayPosts.length - (compact ? 3 : 4)}</Text>
                ) : null}
              </View>
              {!compact && dayPosts.slice(0, 2).map((p) => (
                <PostCard key={p.id} post={p} onPress={() => onPressPost(p)} compact />
              ))}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, gap: 10, minHeight: 0 },
  topBanner: { flexDirection: 'row', gap: 10, alignItems: 'stretch', flexShrink: 0 },
  blueCard: {
    backgroundColor: COLORS.blue,
    borderRadius: 22,
    padding: 12,
    width: 140,
    justifyContent: 'center',
    gap: 6,
  },
  oval: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  ovalText: {
    color: COLORS.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bannerCard: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  bannerCardNarrow: {
    backgroundColor: '#161616',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    flexShrink: 0,
  },
  bannerEyebrow: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: COLORS.lime,
    marginBottom: 4,
  },
  bannerText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
  },
  bannerTextNarrow: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#9CA3AF',
  },
  limePanel: {
    flex: 1,
    backgroundColor: COLORS.lime,
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 0,
    borderWidth: 1,
    borderColor: '#A8D12A',
  },
  limePanelCompact: {
    borderRadius: 20,
  },
  calHeader: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
    flexShrink: 0,
  },
  calHeaderWide: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navRowWide: {
    flex: 1.2,
    minWidth: 220,
  },
  monthDropdown: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    minWidth: 0,
  },
  monthTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 26,
    color: COLORS.black,
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  monthYear: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: '#1F2937',
    marginTop: 1,
  },
  toggleRow: { alignItems: 'stretch' },
  toggleRowWide: {
    flex: 1,
    minWidth: 200,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: COLORS.black },
  toggleText: {
    fontFamily: 'DMSans_500Medium',
    color: COLORS.black,
    textTransform: 'capitalize',
    fontSize: 13,
  },
  toggleTextActive: { color: COLORS.white },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionRowWide: {
    flex: 0.9,
    minWidth: 180,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  actionBtnDark: {
    backgroundColor: COLORS.black,
    borderColor: COLORS.black,
  },
  actionBtnText: {
    fontFamily: 'DMSans_700Bold',
    color: COLORS.black,
    fontSize: 13,
  },
  actionBtnTextDark: {
    color: COLORS.white,
  },
  grid: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    minHeight: 0,
  },
  weekHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  timeGutter: { width: 52 },
  dayColHead: { flex: 1, alignItems: 'center', paddingVertical: 10, minWidth: 0 },
  dayName: { fontFamily: 'DMSans_500Medium', color: '#6B7280', fontSize: 12 },
  dayNum: {
    marginTop: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumActive: { backgroundColor: COLORS.black },
  dayNumText: { fontFamily: 'DMSans_700Bold', color: COLORS.black },
  hourRow: {
    flexDirection: 'row',
    minHeight: 68,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  timeLabel: {
    width: 52,
    paddingTop: 8,
    paddingLeft: 6,
    fontFamily: 'DMSans_400Regular',
    color: '#6B7280',
    fontSize: 11,
  },
  cell: { flex: 1, padding: 3, gap: 3, borderLeftWidth: 1, borderLeftColor: '#F0F0F0', minWidth: 0 },
  postCard: {
    borderRadius: 12,
    padding: 8,
    marginBottom: 4,
  },
  postCardCompact: { padding: 5, marginBottom: 3 },
  postTitle: { fontFamily: 'DMSans_700Bold', fontSize: 12 },
  postTime: { fontFamily: 'DMSans_400Regular', fontSize: 11, marginTop: 2, opacity: 0.85 },
  agendaDay: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  agendaDayToday: {
    borderColor: COLORS.blue,
    borderWidth: 2,
  },
  agendaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  agendaDate: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: COLORS.black },
  agendaCount: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addHint: { fontFamily: 'DMSans_700Bold', color: COLORS.blue, fontSize: 13 },
  agendaPosts: { marginTop: 10, gap: 6 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 },
  monthDow: {
    width: '14.28%',
    textAlign: 'center',
    fontFamily: 'DMSans_700Bold',
    color: '#4B5563',
    marginBottom: 6,
    fontSize: 12,
  },
  monthCell: {
    width: '14.28%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 6,
    backgroundColor: COLORS.white,
  },
  monthCellCompact: { padding: 4 },
  monthCellOutside: { backgroundColor: '#F3F4F6' },
  monthCellToday: { borderColor: COLORS.blue, borderWidth: 2 },
  monthDayNum: {
    fontFamily: 'DMSans_700Bold',
    marginBottom: 4,
    color: COLORS.black,
    fontSize: 13,
  },
  monthDayNumToday: { color: COLORS.blue },
  monthDayOutside: { color: '#9CA3AF' },
  monthDots: { gap: 2 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  typeChipText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    color: '#111827',
    flexShrink: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  more: { fontSize: 10, color: '#4B5563', fontFamily: 'DMSans_700Bold', marginTop: 2 },
  pickerBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  pickerSheet: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '22%',
    alignSelf: 'center',
    maxWidth: 420,
    width: '92%',
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 20,
  },
  pickerYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerYear: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    color: COLORS.black,
  },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerMonth: {
    width: '30%',
    flexGrow: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  pickerMonthActive: { backgroundColor: COLORS.black },
  pickerMonthText: {
    fontFamily: 'DMSans_700Bold',
    color: COLORS.black,
    fontSize: 15,
  },
  pickerMonthTextActive: { color: COLORS.white },
});
