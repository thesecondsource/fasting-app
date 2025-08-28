import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Droplets,
  Scale,
  Zap,
  Heart,
  Moon,
  Plus,
  Check,
  Clock,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Search,
  Filter,
  X,
  CreditCard as Edit3,
  Trash2,
  Calendar,
} from 'lucide-react-native';
import { HealthMetrics, JournalEntry } from '@/types';
import { storageService } from '@/utils/storage';
import { dateUtils } from '@/utils/dateUtils';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

const moodEmojis = {
  great: '😄',
  good: '😊',
  okay: '😐',
  bad: '😞',
  terrible: '😢',
};

const moodColors = {
  great: '#10B981',
  good: '#3B82F6',
  okay: '#F59E0B',
  bad: '#EF4444',
  terrible: '#7C2D12',
};

export default function HealthScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'metrics' | 'journal'>('metrics');

  // Health Metrics State
  const [todayMetrics, setTodayMetrics] = useState<HealthMetrics>({
    id: '',
    date: new Date(),
    waterIntake: 0,
    energyLevel: 3,
    mood: 3,
    sleepQuality: 3,
  });

  const [weight, setWeight] = useState('');
  const [weightError, setWeightError] = useState<string | null>(null);
  const [waterInput, setWaterInput] = useState('');
  const [allMetrics, setAllMetrics] = useState<HealthMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [timeUntilUnlock, setTimeUntilUnlock] = useState('');
  const [showTips, setShowTips] = useState(false);

  // Journal State
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');

  // Journal Form State
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [selectedMood, setSelectedMood] =
    useState<JournalEntry['mood']>('okay');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    loadHealthData();
    loadJournalEntries();
    checkLockoutStatus();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isLocked) {
      interval = setInterval(() => {
        updateTimeUntilUnlock();
      }, 60000); // Update every minute
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLocked, lastSaveTime]);

  const checkLockoutStatus = async () => {
    try {
      const lastSave = await storageService.getLastHealthMetricsSave();
      if (lastSave) {
        setLastSaveTime(lastSave);
        const now = new Date();
        const nextMidnight = new Date(lastSave);
        nextMidnight.setDate(nextMidnight.getDate() + 1);
        nextMidnight.setHours(0, 0, 0, 0);

        if (now < nextMidnight) {
          setIsLocked(true);
          updateTimeUntilUnlock();
        }
      }
    } catch (error) {
      console.error('Error checking lockout status:', error);
    }
  };

  const updateTimeUntilUnlock = () => {
    if (!lastSaveTime) return;

    const now = new Date();
    const nextMidnight = new Date(lastSaveTime);
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);

    if (now >= nextMidnight) {
      setIsLocked(false);
      setTimeUntilUnlock('');
      return;
    }

    const timeRemaining = dateUtils.formatTimeRemaining(nextMidnight, now);
    setTimeUntilUnlock(timeRemaining);
  };

  const loadHealthData = async () => {
    try {
      const metrics = await storageService.getHealthMetrics();
      setAllMetrics(metrics);

      // Find today's metrics
      const today = metrics.find((m) => dateUtils.isToday(new Date(m.date)));
      if (today) {
        setTodayMetrics(today);
        setWeight(today.weight?.toString() || '');
        setWaterInput(today.waterIntake.toString());
      }
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJournalEntries = async () => {
    try {
      const entries = await storageService.getJournalEntries();
      setJournalEntries(entries);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }
  };

  const validateWeight = (value: string): string | null => {
    const trimmed = value.trim();

    // REQUIRED: user must enter a weight
    if (trimmed === '') {
      return 'Weight is required.';
    }

    // Format checks
    const validPattern = /^\d*\.?\d+$/; // digits with optional single decimal
    if (!validPattern.test(trimmed)) {
      return 'Only numbers and a single decimal point are allowed.';
    }

    const num = Number(trimmed);
    if (isNaN(num)) {
      return 'Please enter a valid number.';
    }
    if (num <= 0) {
      return 'Weight must be a positive number.';
    }

    return null; // valid
  };

  const handleWeightChange = (text: string) => {
    setWeight(text);
    // Lenient live validation: only check for invalid characters/format
    // to allow intermediate states like "0."
    const validPattern = /^[0-9.]*$/;
    if (text !== '' && !validPattern.test(text)) {
      setWeightError('Only numbers and a decimal point are allowed.');
    } else if ((text.match(/\./g) || []).length > 1) {
      setWeightError('Invalid format (multiple decimal points).');
    } else {
      setWeightError(null); // Clear format error as user types correctly
    }
  };

  const handleSaveRequest = () => {
    if (isLocked) return; // Don't do anything if locked

    // Perform final, strict validation on save
    const finalWeightError = validateWeight(weight);
    if (finalWeightError) {
      setWeightError(finalWeightError); // Show error on the input
      Alert.alert('Invalid Input', finalWeightError);
      return;
    }

    setShowConfirmation(true);
  };

  const confirmSave = async () => {
    setShowConfirmation(false);

    try {
      // Generate consistent ID based on date for same-day updates
      const consistentId = `health_${new Date().toDateString()}`;

      const metrics: HealthMetrics = {
        id: consistentId,
        date: new Date(),
        weight: weight ? parseFloat(weight) : undefined,
        waterIntake: parseInt(waterInput) || 0,
        energyLevel: todayMetrics.energyLevel,
        mood: todayMetrics.mood,
        sleepQuality: todayMetrics.sleepQuality,
      };

      await storageService.saveHealthMetrics(metrics);
      await storageService.saveLastHealthMetricsSave(new Date());

      setShowSuccess(true);
      setIsLocked(true);
      setLastSaveTime(new Date());
      updateTimeUntilUnlock();

      await loadHealthData();
    } catch (error) {
      console.error('Error saving health metrics:', error);
      Alert.alert('Error', 'Failed to save health metrics');
    }
  };

  const closeSuccessModal = () => {
    setShowSuccess(false);
  };

  const updateRating = (
    field: 'energyLevel' | 'mood' | 'sleepQuality',
    value: number
  ) => {
    if (isLocked) return;

    setTodayMetrics((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addWater = (amount: number) => {
    if (isLocked) return;

    const newAmount = (parseInt(waterInput) || 0) + amount;
    setWaterInput(newAmount.toString());
  };

  // Journal Functions
  const resetJournalForm = () => {
    setJournalTitle('');
    setJournalContent('');
    setSelectedMood('okay');
    setTags([]);
    setTagInput('');
    setEditingEntry(null);
  };

  const handleJournalSave = async () => {
    if (!journalTitle.trim() || !journalContent.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    try {
      const entry: JournalEntry = {
        id: editingEntry?.id || Date.now().toString(),
        date: editingEntry?.date || new Date(),
        title: journalTitle.trim(),
        content: journalContent.trim(),
        mood: selectedMood,
        tags: tags.filter((tag) => tag.trim().length > 0),
      };

      if (editingEntry) {
        await storageService.updateJournalEntry(entry);
      } else {
        await storageService.saveJournalEntry(entry);
      }

      await loadJournalEntries();
      setShowJournalModal(false);
      resetJournalForm();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      Alert.alert('Error', 'Failed to save journal entry');
    }
  };

  const handleJournalEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setJournalTitle(entry.title);
    setJournalContent(entry.content);
    setSelectedMood(entry.mood);
    setTags(entry.tags);
    setShowJournalModal(true);
  };

  const handleJournalDelete = (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteJournalEntry(entryId);
              await loadJournalEntries();
            } catch (error) {
              console.error('Error deleting journal entry:', error);
              Alert.alert('Error', 'Failed to delete journal entry');
            }
          },
        },
      ]
    );
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const filteredJournalEntries = journalEntries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesMood =
      selectedMoodFilter === 'all' || entry.mood === selectedMoodFilter;

    return matchesSearch && matchesMood;
  });

  const RatingSelector = ({
    title,
    value,
    onValueChange,
    icon: Icon,
    color,
  }: {
    title: string;
    value: number;
    onValueChange: (value: number) => void;
    icon: any;
    color: string;
  }) => (
    <View style={styles.ratingContainer}>
      <View style={styles.ratingHeader}>
        <Icon size={20} color={color} />
        <Text style={styles.ratingTitle}>{title}</Text>
      </View>
      <View style={styles.ratingButtons}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.ratingButton,
              { borderColor: colors.border },
              value === rating && {
                backgroundColor: color,
                borderColor: color,
              },
              isLocked && styles.disabledButton,
            ]}
            onPress={() => onValueChange(rating)}
            disabled={isLocked}
          >
            <Text
              style={[
                styles.ratingButtonText,
                { color: colors.text },
                value === rating && { color: '#FFFFFF' },
                isLocked && styles.disabledText,
              ]}
            >
              {rating}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading health data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Health & Wellness
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Track your metrics and journal your journey
        </Text>

        {/* Tab Selector */}
        <View
          style={[styles.tabContainer, { backgroundColor: colors.surface }]}
        >
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'metrics' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveTab('metrics')}
          >
            <Heart
              size={16}
              color={activeTab === 'metrics' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'metrics' ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              Metrics
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'journal' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveTab('journal')}
          >
            <BookOpen
              size={16}
              color={activeTab === 'journal' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'journal' ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              Journal
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'metrics' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Scale size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Weight
              </Text>
            </View>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: weightError ? colors.error : colors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={weight}
                onChangeText={handleWeightChange}
                placeholder="Enter weight (kg)"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                editable={!isLocked}
              />
            </View>
            {weightError && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {weightError}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Droplets size={20} color={colors.info} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Water Intake
              </Text>
            </View>
            <View style={styles.waterContainer}>
              <View
                style={[
                  styles.waterInputContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={waterInput}
                  onChangeText={setWaterInput}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  editable={!isLocked}
                />
                <Text
                  style={[styles.waterUnit, { color: colors.textSecondary }]}
                >
                  ml
                </Text>
              </View>
              <View style={styles.waterButtons}>
                <TouchableOpacity
                  style={[
                    styles.waterButton,
                    {
                      backgroundColor: colors.info + '20',
                      borderColor: colors.info + '40',
                    },
                    isLocked && styles.disabledButton,
                  ]}
                  onPress={() => addWater(250)}
                  disabled={isLocked}
                >
                  <Plus size={16} color={colors.info} />
                  <Text
                    style={[styles.waterButtonText, { color: colors.info }]}
                  >
                    250ml
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.waterButton,
                    {
                      backgroundColor: colors.info + '20',
                      borderColor: colors.info + '40',
                    },
                    isLocked && styles.disabledButton,
                  ]}
                  onPress={() => addWater(500)}
                  disabled={isLocked}
                >
                  <Plus size={16} color={colors.info} />
                  <Text
                    style={[styles.waterButtonText, { color: colors.info }]}
                  >
                    500ml
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <RatingSelector
              title="Energy Level"
              value={todayMetrics.energyLevel}
              onValueChange={(value) => updateRating('energyLevel', value)}
              icon={Zap}
              color={colors.warning}
            />
          </View>

          <View style={styles.section}>
            <RatingSelector
              title="Mood"
              value={todayMetrics.mood}
              onValueChange={(value) => updateRating('mood', value)}
              icon={Heart}
              color={colors.error}
            />
          </View>

          <View style={styles.section}>
            <RatingSelector
              title="Sleep Quality"
              value={todayMetrics.sleepQuality}
              onValueChange={(value) => updateRating('sleepQuality', value)}
              icon={Moon}
              color="#8B5CF6"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor:
                  isLocked || !!weightError ? colors.surface : colors.primary,
              },
              (isLocked || !!weightError) && {
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
            onPress={handleSaveRequest}
            // The button is visually disabled but remains tappable to show alerts
          >
            {isLocked ? (
              <>
                <Clock size={16} color={colors.textTertiary} />
                <Text
                  style={[
                    styles.disabledSaveButtonText,
                    { color: colors.textTertiary },
                  ]}
                >
                  Locked until midnight ({timeUntilUnlock})
                </Text>
              </>
            ) : (
              <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>
                Save Today's Metrics
              </Text>
            )}
          </TouchableOpacity>

          {/* Fasting Tips Section */}
          <View style={styles.tipsSection}>
            <TouchableOpacity
              style={[
                styles.tipsHeader,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setShowTips(!showTips)}
            >
              <View style={styles.tipsHeaderContent}>
                <Lightbulb size={20} color={colors.warning} />
                <Text style={[styles.tipsTitle, { color: colors.text }]}>
                  Fasting Tips & Best Practices
                </Text>
              </View>
              {showTips ? (
                <ChevronUp size={20} color={colors.textSecondary} />
              ) : (
                <ChevronDown size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {showTips && (
              <View
                style={[
                  styles.tipsContent,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.tipItem}>
                  <View
                    style={[
                      styles.tipIcon,
                      { backgroundColor: colors.info + '20' },
                    ]}
                  >
                    <Droplets size={16} color={colors.info} />
                  </View>
                  <View style={styles.tipText}>
                    <Text style={[styles.tipTitle, { color: colors.text }]}>
                      Stay Hydrated
                    </Text>
                    <Text
                      style={[
                        styles.tipDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Drink plenty of water during fasting. Aim for 8-10 glasses
                      daily. Herbal teas and black coffee are also allowed.
                    </Text>
                  </View>
                </View>

                <View style={styles.tipItem}>
                  <View
                    style={[
                      styles.tipIcon,
                      { backgroundColor: colors.success + '20' },
                    ]}
                  >
                    <Zap size={16} color={colors.success} />
                  </View>
                  <View style={styles.tipText}>
                    <Text style={[styles.tipTitle, { color: colors.text }]}>
                      Start Gradually
                    </Text>
                    <Text
                      style={[
                        styles.tipDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Begin with shorter fasting windows (12-14 hours) and
                      gradually increase as your body adapts.
                    </Text>
                  </View>
                </View>

                <View style={styles.tipItem}>
                  <View
                    style={[
                      styles.tipIcon,
                      { backgroundColor: colors.warning + '20' },
                    ]}
                  >
                    <Heart size={16} color={colors.warning} />
                  </View>
                  <View style={styles.tipText}>
                    <Text style={[styles.tipTitle, { color: colors.text }]}>
                      Listen to Your Body
                    </Text>
                    <Text
                      style={[
                        styles.tipDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      If you feel dizzy, weak, or unwell, break your fast. Your
                      health comes first.
                    </Text>
                  </View>
                </View>

                <View style={styles.tipItem}>
                  <View
                    style={[
                      styles.tipIcon,
                      { backgroundColor: '#8B5CF6' + '20' },
                    ]}
                  >
                    <Moon size={16} color="#8B5CF6" />
                  </View>
                  <View style={styles.tipText}>
                    <Text style={[styles.tipTitle, { color: colors.text }]}>
                      Quality Sleep
                    </Text>
                    <Text
                      style={[
                        styles.tipDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Maintain 7-9 hours of quality sleep. Poor sleep can affect
                      hunger hormones and make fasting harder.
                    </Text>
                  </View>
                </View>

                <View style={styles.tipItem}>
                  <View
                    style={[
                      styles.tipIcon,
                      { backgroundColor: colors.primary + '20' },
                    ]}
                  >
                    <Scale size={16} color={colors.primary} />
                  </View>
                  <View style={styles.tipText}>
                    <Text style={[styles.tipTitle, { color: colors.text }]}>
                      Break Fast Mindfully
                    </Text>
                    <Text
                      style={[
                        styles.tipDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Start with light, nutritious foods. Avoid overeating and
                      choose whole foods over processed ones.
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.tipWarning,
                    {
                      backgroundColor: colors.error + '10',
                      borderColor: colors.error + '30',
                    },
                  ]}
                >
                  <Text
                    style={[styles.tipWarningText, { color: colors.error }]}
                  >
                    ⚠️ Important: Consult with a healthcare provider before
                    starting any fasting regimen, especially if you have medical
                    conditions, are pregnant, or taking medications.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      ) : null}
      {activeTab === 'journal' ? (
        <View style={styles.journalContainer}>
          <View style={styles.journalHeader}>
            <TouchableOpacity
              style={[
                styles.addJournalButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => setShowJournalModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addJournalButtonText}>New Entry</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.journalSearchContainer}>
            <View
              style={[
                styles.journalSearchInput,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Search size={16} color={colors.textSecondary} />
              <TextInput
                style={[styles.journalSearchText, { color: colors.text }]}
                placeholder="Search entries..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.journalFilterContainer}
              contentContainerStyle={styles.journalFilterContent}
            >
              <TouchableOpacity
                style={[
                  styles.journalFilterButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  selectedMoodFilter === 'all' && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setSelectedMoodFilter('all')}
              >
                <Text
                  style={[
                    styles.journalFilterText,
                    {
                      color:
                        selectedMoodFilter === 'all'
                          ? '#FFFFFF'
                          : colors.textSecondary,
                    },
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>

              {Object.entries(moodEmojis).map(([mood, emoji]) => (
                <TouchableOpacity
                  key={mood}
                  style={[
                    styles.journalFilterButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    selectedMoodFilter === mood && {
                      backgroundColor:
                        moodColors[mood as keyof typeof moodColors],
                      borderColor: moodColors[mood as keyof typeof moodColors],
                    },
                  ]}
                  onPress={() => setSelectedMoodFilter(mood)}
                >
                  <Text style={styles.journalFilterEmoji}>{emoji}</Text>
                  <Text
                    style={[
                      styles.journalFilterText,
                      {
                        color:
                          selectedMoodFilter === mood
                            ? '#FFFFFF'
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {mood.charAt(0).toUpperCase() + mood.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.journalScrollContent}>
            {filteredJournalEntries.length === 0 ? (
              <View style={styles.journalEmptyState}>
                <BookOpen size={48} color={colors.textTertiary} />
                <Text
                  style={[
                    styles.journalEmptyStateText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {searchQuery || selectedMoodFilter !== 'all'
                    ? 'No entries match your search'
                    : 'No journal entries yet'}
                </Text>
                <Text
                  style={[
                    styles.journalEmptyStateSubtext,
                    { color: colors.textTertiary },
                  ]}
                >
                  {searchQuery || selectedMoodFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Start documenting your fasting journey'}
                </Text>
              </View>
            ) : (
              filteredJournalEntries
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((entry) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.journalEntryCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.journalEntryHeader}>
                      <View style={styles.journalEntryInfo}>
                        <Text
                          style={[
                            styles.journalEntryTitle,
                            { color: colors.text },
                          ]}
                        >
                          {entry.title}
                        </Text>
                        <View style={styles.journalEntryMeta}>
                          <Text
                            style={[
                              styles.journalEntryDate,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {dateUtils.formatDate(new Date(entry.date))}
                          </Text>
                          <View style={styles.journalMoodIndicator}>
                            <Text style={styles.journalMoodEmoji}>
                              {moodEmojis[entry.mood]}
                            </Text>
                            <Text
                              style={[
                                styles.journalMoodText,
                                { color: moodColors[entry.mood] },
                              ]}
                            >
                              {entry.mood.charAt(0).toUpperCase() +
                                entry.mood.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.journalEntryActions}>
                        <TouchableOpacity
                          style={[
                            styles.journalActionButton,
                            { backgroundColor: colors.primary + '20' },
                          ]}
                          onPress={() => handleJournalEdit(entry)}
                        >
                          <Edit3 size={14} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.journalActionButton,
                            { backgroundColor: colors.error + '20' },
                          ]}
                          onPress={() => handleJournalDelete(entry.id)}
                        >
                          <Trash2 size={14} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.journalEntryContent,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={3}
                    >
                      {entry.content}
                    </Text>

                    {entry.tags.length > 0 && (
                      <View style={styles.journalTagsContainer}>
                        {entry.tags.map((tag, index) => (
                          <View
                            key={index}
                            style={[
                              styles.journalTag,
                              { backgroundColor: colors.primary + '20' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.journalTagText,
                                { color: colors.primary },
                              ]}
                            >
                              #{tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))
            )}
          </ScrollView>
        </View>
      ) : null}

      {/* Health Metrics Confirmation Modal */}
      {activeTab === 'metrics' && (
        <Modal
          visible={showConfirmation}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConfirmation(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.background },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Confirm Save
              </Text>
              <Text
                style={[styles.modalMessage, { color: colors.textSecondary }]}
              >
                Are you sure you want to save today's health metrics? You won't
                be able to edit them again until tomorrow.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setShowConfirmation(false)}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={confirmSave}
                >
                  <Text
                    style={[styles.confirmButtonText, { color: '#FFFFFF' }]}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Health Metrics Success Modal */}
      {activeTab === 'metrics' && (
        <Modal
          visible={showSuccess}
          transparent={true}
          animationType="fade"
          onRequestClose={closeSuccessModal}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.background },
              ]}
            >
              <View
                style={[
                  styles.successIcon,
                  { backgroundColor: colors.success + '20' },
                ]}
              >
                <Check size={32} color={colors.success} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Success!
              </Text>
              <Text
                style={[styles.modalMessage, { color: colors.textSecondary }]}
              >
                Today's health metrics have been successfully saved.
              </Text>
              <TouchableOpacity
                style={[
                  styles.successButton,
                  { backgroundColor: colors.success },
                ]}
                onPress={closeSuccessModal}
              >
                <Text style={[styles.successButtonText, { color: '#FFFFFF' }]}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Journal Modal */}
      <Modal
        visible={showJournalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowJournalModal(false);
          resetJournalForm();
        }}
      >
        <View style={styles.journalModalOverlay}>
          <View
            style={[
              styles.journalModalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.journalModalHeader}>
              <Text style={[styles.journalModalTitle, { color: colors.text }]}>
                {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowJournalModal(false);
                  resetJournalForm();
                }}
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.journalModalScrollContent}
            >
              <View style={styles.journalFormGroup}>
                <Text style={[styles.journalFormLabel, { color: colors.text }]}>
                  Title
                </Text>
                <TextInput
                  style={[
                    styles.journalFormInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={journalTitle}
                  onChangeText={setJournalTitle}
                  placeholder="Enter a title for your entry"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.journalFormGroup}>
                <Text style={[styles.journalFormLabel, { color: colors.text }]}>
                  How are you feeling?
                </Text>
                <View style={styles.journalMoodSelector}>
                  {Object.entries(moodEmojis).map(([mood, emoji]) => (
                    <TouchableOpacity
                      key={mood}
                      style={[
                        styles.journalMoodOption,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                        selectedMood === mood && {
                          backgroundColor:
                            moodColors[mood as keyof typeof moodColors],
                          borderColor:
                            moodColors[mood as keyof typeof moodColors],
                        },
                      ]}
                      onPress={() =>
                        setSelectedMood(mood as JournalEntry['mood'])
                      }
                    >
                      <Text style={styles.journalMoodOptionEmoji}>{emoji}</Text>
                      <Text
                        style={[
                          styles.journalMoodOptionText,
                          {
                            color:
                              selectedMood === mood
                                ? '#FFFFFF'
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {mood.charAt(0).toUpperCase() + mood.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.journalFormGroup}>
                <Text style={[styles.journalFormLabel, { color: colors.text }]}>
                  Content
                </Text>
                <TextInput
                  style={[
                    styles.journalFormTextArea,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={journalContent}
                  onChangeText={setJournalContent}
                  placeholder="Write about your fasting experience, how you're feeling, challenges, victories..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.journalFormGroup}>
                <Text style={[styles.journalFormLabel, { color: colors.text }]}>
                  Tags
                </Text>
                <View style={styles.journalTagInputContainer}>
                  <TextInput
                    style={[
                      styles.journalTagInput,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder="Add a tag"
                    placeholderTextColor={colors.textTertiary}
                    onSubmitEditing={addTag}
                  />
                  <TouchableOpacity
                    style={[
                      styles.journalAddTagButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={addTag}
                  >
                    <Plus size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {tags.length > 0 && (
                  <View style={styles.journalSelectedTags}>
                    {tags.map((tag, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.journalSelectedTag,
                          { backgroundColor: colors.primary + '20' },
                        ]}
                        onPress={() => removeTag(tag)}
                      >
                        <Text
                          style={[
                            styles.journalSelectedTagText,
                            { color: colors.primary },
                          ]}
                        >
                          #{tag}
                        </Text>
                        <X size={10} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.journalModalActions}>
              <TouchableOpacity
                style={[
                  styles.journalCancelButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setShowJournalModal(false);
                  resetJournalForm();
                }}
              >
                <Text
                  style={[
                    styles.journalCancelButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.journalSaveButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleJournalSave}
              >
                <Text style={styles.journalSaveButtonText}>
                  {editingEntry ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    padding: 16,
    fontSize: 16,
  },
  waterContainer: {
    gap: 12,
  },
  waterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingRight: 16,
  },
  waterUnit: {
    fontSize: 16,
    fontWeight: '500',
  },
  waterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  waterButton: {
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
  },
  waterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingContainer: {
    gap: 12,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledSaveButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successButton: {
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  tipsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContent: {
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 16,
    borderWidth: 1,
    borderTopWidth: 0,
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 12,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  tipText: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  tipWarning: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  tipWarningText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },

  // Journal Styles
  journalContainer: {
    flex: 1,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  addJournalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addJournalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  journalSearchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  journalSearchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    gap: 8,
  },
  journalSearchText: {
    flex: 1,
    fontSize: 14,
  },
  journalFilterContainer: {
    marginBottom: 10,
  },
  journalFilterContent: {
    paddingHorizontal: 4,
    gap: 6,
  },
  journalFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
  },
  journalFilterEmoji: {
    fontSize: 12,
  },
  journalFilterText: {
    fontSize: 11,
    fontWeight: '500',
  },
  journalScrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 0,
  },
  journalEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  journalEmptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  journalEmptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  journalEntryCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  journalEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  journalEntryInfo: {
    flex: 1,
    marginRight: 10,
  },
  journalEntryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  journalEntryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  journalEntryDate: {
    fontSize: 12,
  },
  journalMoodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  journalMoodEmoji: {
    fontSize: 14,
  },
  journalMoodText: {
    fontSize: 11,
    fontWeight: '500',
  },
  journalEntryActions: {
    flexDirection: 'row',
    gap: 6,
  },
  journalActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journalEntryContent: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  journalTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  journalTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  journalTagText: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Journal Modal Styles
  journalModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  journalModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
  },
  journalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  journalModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  journalModalScrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  journalFormGroup: {
    marginBottom: 16,
  },
  journalFormLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  journalFormInput: {
    borderRadius: 12,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  journalFormTextArea: {
    borderRadius: 12,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
    minHeight: 100,
  },
  journalMoodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  journalMoodOption: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 3,
  },
  journalMoodOptionEmoji: {
    fontSize: 16,
  },
  journalMoodOptionText: {
    fontSize: 10,
    fontWeight: '500',
  },
  journalTagInputContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  journalTagInput: {
    flex: 1,
    borderRadius: 10,
    padding: 8,
    fontSize: 14,
    borderWidth: 1,
  },
  journalAddTagButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journalSelectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  journalSelectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  journalSelectedTagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  journalModalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  journalCancelButton: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  journalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  journalSaveButton: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  journalSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
  },
});
