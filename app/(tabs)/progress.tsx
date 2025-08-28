import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  Calendar,
  Award,
  Target,
  Clock,
  ChartBar as BarChart3,
  Activity,
  Zap,
  Heart,
  Moon,
  Lock,
} from 'lucide-react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { FastingSession, HealthMetrics } from '@/types';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { storageService } from '@/utils/storage';
import { dateUtils } from '@/utils/dateUtils';
import { useTheme } from '@/contexts/ThemeContext';
import { PremiumBadge } from '@/components/PremiumBadge';
import { PremiumUpgradeModal } from '@/components/PremiumUpgradeModal';

const screenWidth = Dimensions.get('window').width;

type TimeRange = 'week' | 'month' | '3months';

export default function ProgressScreen() {
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<FastingSession[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics[]>([]);
  const { isPremium } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  // Statistics
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalFasts, setTotalFasts] = useState(0);
  const [averageFastDuration, setAverageFastDuration] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [totalFastingHours, setTotalFastingHours] = useState(0);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const [fastingSessions, healthData] = await Promise.all([
        storageService.getFastingSessions(),
        storageService.getHealthMetrics(),
      ]);

      setSessions(fastingSessions);
      setHealthMetrics(healthData);
      calculateStats(fastingSessions);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planId: string) => {
    setShowUpgradeModal(false);
    // In a real app, this would integrate with RevenueCat or similar
    console.log('Upgrading to plan:', planId);
  };

  const PremiumFeatureOverlay = ({
    children,
    featureName,
  }: {
    children: React.ReactNode;
    featureName: string;
  }) => {
    if (isPremium) {
      return <>{children}</>;
    }

    return (
      <TouchableOpacity
        style={styles.premiumOverlay}
        onPress={() => setShowUpgradeModal(true)}
      >
        <View
          style={[
            styles.premiumOverlayContent,
            { backgroundColor: colors.surface + 'E6' },
          ]}
        >
          <Lock size={32} color={colors.textSecondary} />
          <Text style={[styles.premiumOverlayTitle, { color: colors.text }]}>
            Premium Feature
          </Text>
          <Text
            style={[styles.premiumOverlayText, { color: colors.textSecondary }]}
          >
            Upgrade to unlock {featureName}
          </Text>
          <View style={styles.premiumBadgeContainer}>
            <PremiumBadge size="large" />
          </View>
        </View>
        <View style={styles.blurredContent}>{children}</View>
      </TouchableOpacity>
    );
  };

  const calculateStats = (sessions: FastingSession[]) => {
    const completedSessions = sessions.filter((s) => s.completed);
    const allSessions = sessions;

    setTotalFasts(completedSessions.length);
    setCompletionRate(
      allSessions.length > 0
        ? Math.round((completedSessions.length / allSessions.length) * 100)
        : 0
    );

    // Calculate average duration
    if (completedSessions.length > 0) {
      const avgDuration =
        completedSessions.reduce((sum, session) => sum + session.duration, 0) /
        completedSessions.length;
      setAverageFastDuration(Math.round(avgDuration));
    }

    // Calculate total fasting hours
    const totalHours = completedSessions.reduce(
      (sum, session) => sum + session.duration / 60,
      0
    );
    setTotalFastingHours(Math.round(totalHours));

    // Calculate streaks
    calculateStreaks(completedSessions);
  };

  const calculateStreaks = (sessions: FastingSession[]) => {
    if (sessions.length === 0) return;

    const sortedSessions = [...sessions].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    let current = 0;
    let longest = 0;
    let temp = 0;
    let lastDate: Date | null = null;

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.startTime);
      const dayStart = dateUtils.getDayStart(sessionDate);

      if (!lastDate) {
        temp = 1;
      } else {
        const dayDiff =
          Math.abs(dayStart.getTime() - lastDate.getTime()) /
          (1000 * 60 * 60 * 24);

        if (dayDiff <= 1) {
          temp++;
        } else {
          temp = 1;
        }
      }

      longest = Math.max(longest, temp);
      lastDate = dayStart;

      // Check if this contributes to current streak
      const today = dateUtils.getDayStart(new Date());
      const daysSinceSession =
        Math.abs(today.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceSession <= 1) {
        current = temp;
      }
    }

    setCurrentStreak(current);
    setLongestStreak(longest);
  };

  const getTimeRangeData = () => {
    const now = new Date();
    let startDate: Date;
    let labels: string[];

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        labels = ['6d', '5d', '4d', '3d', '2d', '1d', 'Today'];
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        labels = Array.from({ length: 4 }, (_, i) => `W${4 - i}`);
        break;
      case '3months':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        labels = ['3mo', '2mo', '1mo', 'Now'];
        break;
    }

    return { startDate, labels };
  };

  const getFastingFrequencyData = () => {
    const { startDate, labels } = getTimeRangeData();
    const filteredSessions = sessions.filter(
      (s) => s.completed && new Date(s.startTime) >= startDate
    );

    let data: number[];

    if (timeRange === 'week') {
      data = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return filteredSessions.filter(
          (s) =>
            dateUtils.isToday(new Date(s.startTime)) === dateUtils.isToday(date)
        ).length;
      });
    } else if (timeRange === 'month') {
      data = Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (3 - i) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        return filteredSessions.filter((s) => {
          const sessionDate = new Date(s.startTime);
          return sessionDate >= weekStart && sessionDate < weekEnd;
        }).length;
      });
    } else {
      data = Array.from({ length: 4 }, (_, i) => {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - (3 - i));
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        return filteredSessions.filter((s) => {
          const sessionDate = new Date(s.startTime);
          return sessionDate >= monthStart && sessionDate < monthEnd;
        }).length;
      });
    }

    return { labels, data };
  };

  const getAverageDurationData = () => {
    const { startDate, labels } = getTimeRangeData();
    const filteredSessions = sessions.filter(
      (s) => s.completed && new Date(s.startTime) >= startDate
    );

    let data: number[];

    if (timeRange === 'week') {
      data = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const daySessions = filteredSessions.filter(
          (s) =>
            dateUtils.isToday(new Date(s.startTime)) === dateUtils.isToday(date)
        );

        if (daySessions.length === 0) return 0;
        return Math.round(
          daySessions.reduce((sum, s) => sum + s.duration, 0) /
            daySessions.length /
            60
        );
      });
    } else {
      // Similar logic for month and 3months
      data = labels.map(() => Math.round(averageFastDuration / 60));
    }

    return { labels, data };
  };

  const getFastingMethodDistribution = () => {
    const completedSessions = sessions.filter((s) => s.completed);
    const methodCounts: { [key: string]: number } = {};

    completedSessions.forEach((session) => {
      const methodName = session.method.name;
      methodCounts[methodName] = (methodCounts[methodName] || 0) + 1;
    });

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return Object.entries(methodCounts).map(([name, count], index) => ({
      name,
      count,
      color: colors[index % colors.length],
      legendFontColor: '#1F2937',
      legendFontSize: 14,
    }));
  };

  const getWeightProgressData = () => {
    const weightData = healthMetrics
      .filter((m) => m.weight)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    if (weightData.length === 0) return null;

    return {
      labels: weightData.map((m) =>
        dateUtils.formatDate(new Date(m.date)).slice(0, 5)
      ),
      datasets: [
        {
          data: weightData.map((m) => m.weight!),
          color: () => '#10B981',
          strokeWidth: 2,
        },
      ],
    };
  };

  const getHealthMetricsData = () => {
    const recentMetrics = healthMetrics
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    if (recentMetrics.length === 0) return null;

    return {
      labels: recentMetrics.map((m) =>
        dateUtils.formatDate(new Date(m.date)).slice(0, 5)
      ),
      datasets: [
        {
          data: recentMetrics.map((m) => m.energyLevel),
          color: () => colors.warning,
          strokeWidth: 2,
        },
        {
          data: recentMetrics.map((m) => m.mood),
          color: () => colors.error,
          strokeWidth: 2,
        },
        {
          data: recentMetrics.map((m) => m.sleepQuality),
          color: () => '#8B5CF6',
          strokeWidth: 2,
        },
      ],
    };
  };

  const getEnergyLevelData = () => {
    const recentMetrics = healthMetrics
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    if (recentMetrics.length === 0) return null;

    return {
      labels: recentMetrics.map((m) =>
        dateUtils.formatDate(new Date(m.date)).slice(0, 5)
      ),
      datasets: [
        {
          data: recentMetrics.map((m) => m.energyLevel),
          color: () => colors.warning,
          strokeWidth: 2,
        },
      ],
    };
  };

  const getMoodData = () => {
    const recentMetrics = healthMetrics
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    if (recentMetrics.length === 0) return null;

    return {
      labels: recentMetrics.map((m) =>
        dateUtils.formatDate(new Date(m.date)).slice(0, 5)
      ),
      datasets: [
        {
          data: recentMetrics.map((m) => m.mood),
          color: () => colors.error,
          strokeWidth: 2,
        },
      ],
    };
  };

  const getSleepQualityData = () => {
    const recentMetrics = healthMetrics
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    if (recentMetrics.length === 0) return null;

    return {
      labels: recentMetrics.map((m) =>
        dateUtils.formatDate(new Date(m.date)).slice(0, 5)
      ),
      datasets: [
        {
          data: recentMetrics.map((m) => m.sleepQuality),
          color: () => '#8B5CF6',
          strokeWidth: 2,
        },
      ],
    };
  };

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) =>
      colors.isDarkMode
        ? `rgba(255, 255, 255, ${opacity})`
        : `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#3B82F6',
    },
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading progress...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const frequencyData = getFastingFrequencyData();
  const durationData = getAverageDurationData();
  const methodDistribution = getFastingMethodDistribution();
  const weightData = getWeightProgressData();
  const energyData = getEnergyLevelData();
  const moodData = getMoodData();
  const sleepData = getSleepQualityData();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Your Progress
          </Text>
          <View style={styles.headerContent}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Comprehensive fasting analytics
            </Text>
            {isPremium && (
              <View style={styles.premiumBadgeHeader}>
                <PremiumBadge size="small" />
              </View>
            )}
          </View>
        </View>

        {/* Time Range Selector */}
        <View
          style={[
            styles.timeRangeContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          {(['week', 'month', '3months'] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && { backgroundColor: colors.primary },
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text
                style={[
                  styles.timeRangeButtonText,
                  {
                    color:
                      timeRange === range ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {range === '3months'
                  ? '3 Months'
                  : range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Statistics */}
        <View style={styles.statsGrid}>
          <View
            key="current-streak"
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Award size={20} color={colors.success} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {currentStreak}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Current Streak
            </Text>
          </View>
          <View
            key="longest-streak"
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Target size={20} color={colors.warning} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {longestStreak}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Longest Streak
            </Text>
          </View>
          <View
            key="total-fasts"
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TrendingUp size={20} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {totalFasts}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Fasts
            </Text>
          </View>
          <View
            key="total-hours"
            style={[
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Clock size={20} color="#8B5CF6" />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {totalFastingHours}h
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Hours
            </Text>
          </View>
        </View>

        {/* Additional Stats Row */}
        <View style={styles.additionalStats}>
          <View
            key="avg-duration"
            style={[
              styles.additionalStatCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Activity size={16} color={colors.error} />
            <Text
              style={[
                styles.additionalStatLabel,
                { color: colors.textSecondary },
              ]}
            >
              Avg Duration
            </Text>
            <Text style={[styles.additionalStatValue, { color: colors.text }]}>
              {dateUtils.formatDuration(averageFastDuration)}
            </Text>
          </View>
          <View
            key="success-rate"
            style={[
              styles.additionalStatCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <BarChart3 size={16} color={colors.info} />
            <Text
              style={[
                styles.additionalStatLabel,
                { color: colors.textSecondary },
              ]}
            >
              Success Rate
            </Text>
            <Text style={[styles.additionalStatValue, { color: colors.text }]}>
              {completionRate}%
            </Text>
          </View>
        </View>

        {/* Fasting Frequency Chart */}
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Fasting Frequency
          </Text>
          {Platform.OS === 'web' ? (
            <View
              style={[
                styles.webChartPlaceholder,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <BarChart3 size={48} color={colors.textTertiary} />
              <Text
                style={[styles.webChartText, { color: colors.textSecondary }]}
              >
                Chart available on mobile
              </Text>
              <View style={styles.webDataDisplay}>
                {frequencyData.labels.map((label, index) => (
                  <View
                    key={`frequency-${index}`}
                    style={[
                      styles.webDataItem,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.webDataLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {label}
                    </Text>
                    <Text style={[styles.webDataValue, { color: colors.text }]}>
                      {frequencyData.data[index]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <BarChart
              data={{
                labels: frequencyData.labels,
                datasets: [{ data: frequencyData.data }],
              }}
              width={screenWidth - 40}
              height={200}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              yAxisLabel=""
              yAxisSuffix=""
            />
          )}
        </View>

        {/* Average Duration Chart */}
        <View style={styles.chartContainer}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Average Duration (Hours)
          </Text>
          {Platform.OS === 'web' ? (
            <View
              style={[
                styles.webChartPlaceholder,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Activity size={48} color={colors.textTertiary} />
              <Text
                style={[styles.webChartText, { color: colors.textSecondary }]}
              >
                Chart available on mobile
              </Text>
              <View style={styles.webDataDisplay}>
                {durationData.labels.map((label, index) => (
                  <View
                    key={`duration-${index}`}
                    style={[
                      styles.webDataItem,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.webDataLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {label}
                    </Text>
                    <Text style={[styles.webDataValue, { color: colors.text }]}>
                      {durationData.data[index]}h
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <LineChart
              data={{
                labels: durationData.labels,
                datasets: [
                  {
                    data:
                      durationData.data.length > 0 ? durationData.data : [0],
                  },
                ],
              }}
              width={screenWidth - 40}
              height={200}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#10B981',
                },
              }}
              bezier
              style={styles.chart}
            />
          )}
        </View>

        {/* Fasting Method Distribution */}
        {methodDistribution.length > 0 && (
          <PremiumFeatureOverlay featureName="detailed method analytics">
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Fasting Methods Used
                </Text>
                {!isPremium && <PremiumBadge size="small" />}
              </View>
              {Platform.OS === 'web' ? (
                <View
                  style={[
                    styles.webChartPlaceholder,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Target size={48} color={colors.textTertiary} />
                  <Text
                    style={[
                      styles.webChartText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Chart available on mobile
                  </Text>
                  <View style={styles.webDataDisplay}>
                    {methodDistribution.map((item) => (
                      <View
                        key={`method-${item.name}`}
                        style={[
                          styles.webDataItem,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.colorIndicator,
                            { backgroundColor: item.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.webDataLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={[styles.webDataValue, { color: colors.text }]}
                        >
                          {item.count}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <PieChart
                  data={methodDistribution}
                  width={screenWidth - 40}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="count"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={styles.chart}
                />
              )}
            </View>
          </PremiumFeatureOverlay>
        )}

        {/* Energy Level Chart */}
        {energyData && (
          <PremiumFeatureOverlay featureName="energy level analytics">
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Energy Level (1-5 Scale)
                </Text>
                {!isPremium && <PremiumBadge size="small" />}
              </View>
              {Platform.OS === 'web' ? (
                <View
                  style={[
                    styles.webChartPlaceholder,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Zap size={48} color={colors.textTertiary} />
                  <Text
                    style={[
                      styles.webChartText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Chart available on mobile
                  </Text>
                  <View style={styles.webDataDisplay}>
                    {energyData.labels.map((label, index) => (
                      <View
                        key={`energy-${index}`}
                        style={[
                          styles.webDataItem,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.webDataLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {label}
                        </Text>
                        <Text
                          style={[styles.webDataValue, { color: colors.text }]}
                        >
                          {energyData.datasets[0].data[index]}/5
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <LineChart
                  data={energyData}
                  width={screenWidth - 40}
                  height={200}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: colors.warning,
                    },
                  }}
                  bezier
                  style={styles.chart}
                  yAxisSuffix=""
                  fromZero={true}
                  segments={4}
                />
              )}
            </View>
          </PremiumFeatureOverlay>
        )}

        {/* Mood Chart */}
        {moodData && (
          <PremiumFeatureOverlay featureName="mood analytics">
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Mood (1-5 Scale)
                </Text>
                {!isPremium && <PremiumBadge size="small" />}
              </View>
              {Platform.OS === 'web' ? (
                <View
                  style={[
                    styles.webChartPlaceholder,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Heart size={48} color={colors.textTertiary} />
                  <Text
                    style={[
                      styles.webChartText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Chart available on mobile
                  </Text>
                  <View style={styles.webDataDisplay}>
                    {moodData.labels.map((label, index) => (
                      <View
                        key={`mood-${index}`}
                        style={[
                          styles.webDataItem,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.webDataLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {label}
                        </Text>
                        <Text
                          style={[styles.webDataValue, { color: colors.text }]}
                        >
                          {moodData.datasets[0].data[index]}/5
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <LineChart
                  data={moodData}
                  width={screenWidth - 40}
                  height={200}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: colors.error,
                    },
                  }}
                  bezier
                  style={styles.chart}
                  yAxisSuffix=""
                  fromZero={true}
                  segments={4}
                />
              )}
            </View>
          </PremiumFeatureOverlay>
        )}

        {/* Sleep Quality Chart */}
        {sleepData && (
          <PremiumFeatureOverlay featureName="sleep quality analytics">
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Sleep Quality (1-5 Scale)
                </Text>
                {!isPremium && <PremiumBadge size="small" />}
              </View>
              {Platform.OS === 'web' ? (
                <View
                  style={[
                    styles.webChartPlaceholder,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Moon size={48} color={colors.textTertiary} />
                  <Text
                    style={[
                      styles.webChartText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Chart available on mobile
                  </Text>
                  <View style={styles.webDataDisplay}>
                    {sleepData.labels.map((label, index) => (
                      <View
                        key={`sleep-${index}`}
                        style={[
                          styles.webDataItem,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.webDataLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {label}
                        </Text>
                        <Text
                          style={[styles.webDataValue, { color: colors.text }]}
                        >
                          {sleepData.datasets[0].data[index]}/5
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <LineChart
                  data={sleepData}
                  width={screenWidth - 40}
                  height={200}
                  chartConfig={{
                    ...chartConfig,
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: '#8B5CF6',
                    },
                  }}
                  bezier
                  style={styles.chart}
                  yAxisSuffix=""
                  fromZero={true}
                  segments={4}
                />
              )}
            </View>
          </PremiumFeatureOverlay>
        )}

        {/* Weight Progress */}
        {weightData && (
          <PremiumFeatureOverlay featureName="weight tracking analytics">
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  Weight Progress
                </Text>
                {!isPremium && <PremiumBadge size="small" />}
              </View>
              {Platform.OS === 'web' ? (
                <View
                  style={[
                    styles.webChartPlaceholder,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <TrendingUp size={48} color={colors.textTertiary} />
                  <Text
                    style={[
                      styles.webChartText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Chart available on mobile
                  </Text>
                  <View style={styles.webDataDisplay}>
                    {weightData.labels.map((label, index) => (
                      <View
                        key={`weight-${index}`}
                        style={[
                          styles.webDataItem,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.webDataLabel,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {label}
                        </Text>
                        <Text
                          style={[styles.webDataValue, { color: colors.text }]}
                        >
                          {weightData.datasets[0].data[index]}kg
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <LineChart
                  data={weightData}
                  width={screenWidth - 40}
                  height={200}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: '#10B981',
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              )}
            </View>
          </PremiumFeatureOverlay>
        )}

        {/* Recent Sessions */}
        <View style={styles.recentSessionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Sessions
          </Text>
          {sessions.filter((s) => s.completed).length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color={colors.textTertiary} />
              <Text
                style={[styles.emptyStateText, { color: colors.textSecondary }]}
              >
                No completed fasts yet
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtext,
                  { color: colors.textTertiary },
                ]}
              >
                Start your first fast to see detailed analytics
              </Text>
            </View>
          ) : (
            sessions
              .filter((s) => s.completed)
              .sort(
                (a, b) =>
                  new Date(b.startTime).getTime() -
                  new Date(a.startTime).getTime()
              )
              .slice(0, 5)
              .map((session) => (
                <View
                  key={session.id}
                  style={[
                    styles.sessionCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.sessionHeader}>
                    <Text
                      style={[styles.sessionMethod, { color: colors.primary }]}
                    >
                      {session.method.name}
                    </Text>
                    <Text
                      style={[
                        styles.sessionDate,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {dateUtils.formatDate(new Date(session.startTime))}
                    </Text>
                  </View>
                  <View style={styles.sessionDetails}>
                    <Text
                      style={[
                        styles.sessionTime,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {dateUtils.formatTime(new Date(session.startTime))} -{' '}
                      {dateUtils.formatTime(new Date(session.endTime))}
                    </Text>
                    <Text
                      style={[
                        styles.sessionDuration,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Duration: {dateUtils.formatDuration(session.duration)}
                    </Text>
                  </View>
                </View>
              ))
          )}
        </View>

        <PremiumUpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgrade}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerContent: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  premiumBadgeHeader: {
    marginTop: 4,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  additionalStatCard: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  additionalStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 2,
  },
  additionalStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chart: {
    borderRadius: 16,
  },
  webChartPlaceholder: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    borderWidth: 1,
  },
  webChartText: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 16,
  },
  webDataDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  webDataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  webDataLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  webDataValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  premiumOverlay: {
    position: 'relative',
    marginBottom: 24,
  },
  premiumOverlayContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  premiumOverlayTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  premiumOverlayText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  premiumBadgeContainer: {
    marginTop: 8,
  },
  blurredContent: {
    opacity: 0.3,
  },
  recentSessionsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionMethod: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  sessionDetails: {
    gap: 4,
  },
  sessionTime: {
    fontSize: 14,
  },
  sessionDuration: {
    fontSize: 14,
  },
});
