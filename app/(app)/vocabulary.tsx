import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SectionList,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppDispatch, useAppSelector } from "../../src/hooks/useAppHooks";
import { fetchWords } from "../../src/redux/wordsSlice";
import { useDebounce } from "../../src/hooks/useDebounce";
import { favoriteService } from "../../src/services/favoriteService";
import { authService } from "../../src/services/authService";
import {
  partOfSpeechService,
  PartOfSpeech,
} from "../../src/services/partOfSpeechService";
import {
  wordService,
  type WordVocab,
  type WordSuggestion,
} from "../../src/services/wordService";
import WordDetailModal from "../../src/components/WordDetailModal";
import WordTableRow from "../../src/components/WordTableRow";
import WordTableHeader from "../../src/components/WordTableHeader";
import { useTheme } from "../../src/context/ThemeContext";

const WORDS_PER_PAGE = 40;

type SubFilterOption = { value: string; label: string; description: string };

const VERB_SUB_FILTERS: SubFilterOption[] = [
  { value: "modal", label: "Modal Verbs", description: "können, müssen, wollen" },
  { value: "separable", label: "Separable Verbs", description: "aufstehen, ankommen" },
  { value: "reflexive", label: "Reflexive Verbs", description: "sich waschen, sich freuen" },
  { value: "dative", label: "Dative Case", description: "danken dir, helfen mir" },
  { value: "prepositional", label: "Prepositional Verbs", description: "denken an, warten auf" },
  { value: "irregular", label: "Irregular (Strong) Verbs", description: "gehen, sehen, sein" },
];

const PREPOSITION_SUB_FILTERS: SubFilterOption[] = [
  { value: "accusative", label: "Accusative", description: "durch, für, gegen, ohne" },
  { value: "dative", label: "Dative", description: "aus, bei, mit, nach" },
  { value: "genitive", label: "Genitive", description: "während, wegen, trotz" },
  { value: "wechsel", label: "Changeable (Acc./Dat.)", description: "an, auf, in, über" },
];

const ADJECTIVE_SUB_FILTERS: SubFilterOption[] = [
  { value: "prepositional", label: "Prepositional Adjectives", description: "abhängig von, interessiert an" },
];

export default function VocabularyScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { words, levels, topics, total, totalPages, isLoading } =
    useAppSelector((state) => state.words);
  const { user } = useAppSelector((state) => state.auth);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = useMemo(() => createStyles(theme), [theme]);
  const iconMuted = isDark ? "#94A3B8" : "#666";

  // State Management
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchType, setSearchType] = useState<"word" | "meaning">("word");

  // "Did you mean" typo suggestions (mirrors web's WordList.jsx). This runs
  // its own faster, independent debounce so it never slows down or gets
  // entangled with the 300ms table-search debounce above.
  const debouncedSuggestionQuery = useDebounce(searchQuery, 200);
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  // Selecting a suggestion sets searchQuery, which would otherwise
  // re-trigger the suggestion-fetch effect below and pop the dropdown back
  // open (the selected word/meaning matches itself). This suppresses every
  // firing inside a short window after a selection.
  const suppressSuggestionsUntilRef = useRef(0);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedPartOfSpeechId, setSelectedPartOfSpeechId] = useState<
    number | null
  >(null);
  const [selectedVerbFilter, setSelectedVerbFilter] = useState("");
  const [selectedPrepositionFilter, setSelectedPrepositionFilter] = useState("");
  const [selectedAdjectiveFilter, setSelectedAdjectiveFilter] = useState("");
  const [expandedTypeId, setExpandedTypeId] = useState<number | null>(null);
  const [recentOnly, setRecentOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [learningMode, setLearningMode] = useState(false);
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const [partsOfSpeech, setPartsOfSpeech] = useState<PartOfSpeech[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedWordForModal, setSelectedWordForModal] =
    useState<WordVocab | null>(null);
  const [loadingFavoritesModal, setLoadingFavoritesModal] = useState(false);

  const findPosByName = useCallback(
    (name: string) =>
      partsOfSpeech.find((p) => p.name.toLowerCase() === name),
    [partsOfSpeech],
  );
  const verbPos = findPosByName("verb");
  const prepositionPos = findPosByName("preposition");
  const adjectivePos = findPosByName("adjective");

  // Load favorites from backend when user is available
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user || !user.id) {
        console.log(
          "[Vocabulary] No user in Redux, trying to load from backend...",
        );

        // Try to load user from backend regardless of isAuthenticated check
        // The token might exist in SecureStore but just hasn't been checked yet
        try {
          const loadedUser = await authService.getCurrentUser();
          console.log(
            "[Vocabulary] Successfully loaded user from backend:",
            loadedUser,
          );
          if (loadedUser && loadedUser.id) {
            const favorites = await favoriteService.getFavorites(loadedUser.id);
            const favoriteIds = favorites.map((fav) => fav.id);
            setFavorites(new Set(favoriteIds));
            console.log(
              "[Vocabulary] Loaded favorites from backend:",
              favoriteIds,
            );
          }
        } catch (error) {
          // Expected for guests browsing without an account — not an error.
          console.log(
            "[Vocabulary] No authenticated user (guest browsing):",
            error?.response?.status || error?.message,
          );
          console.log("[Vocabulary] Falling back to local storage");
          // Fall back to local storage on error
          try {
            const stored = await AsyncStorage.getItem("vocabulary_favorites");
            if (stored) {
              const favoriteIds = JSON.parse(stored);
              setFavorites(new Set(favoriteIds));
              console.log(
                "[Vocabulary] Loaded favorites from local storage (fallback):",
                favoriteIds,
              );
            }
          } catch (localError) {
            console.error(
              "[Vocabulary] Error loading local favorites:",
              localError,
            );
          }
        }
        return;
      }

      // User is in Redux, load their favorites
      try {
        const favorites = await favoriteService.getFavorites(user.id);
        const favoriteIds = favorites.map((fav) => fav.id);
        setFavorites(new Set(favoriteIds));
        console.log("[Vocabulary] Loaded favorites from backend:", favoriteIds);
      } catch (error) {
        console.error(
          "[Vocabulary] Error loading favorites from backend:",
          error,
        );
        // Fall back to local storage if backend fails
        try {
          const stored = await AsyncStorage.getItem("vocabulary_favorites");
          if (stored) {
            const favoriteIds = JSON.parse(stored);
            setFavorites(new Set(favoriteIds));
            console.log(
              "[Vocabulary] Loaded favorites from local storage (fallback):",
              favoriteIds,
            );
          }
        } catch (localError) {
          console.error(
            "[Vocabulary] Error loading local favorites:",
            localError,
          );
        }
      }
    };
    loadFavorites();
  }, [user]);

  // Part-of-speech options come from a dedicated lookup endpoint — the word
  // list payload only carries the raw partOfSpeechId, never the name.
  useEffect(() => {
    partOfSpeechService
      .getAll()
      .then(setPartsOfSpeech)
      .catch((error) => {
        console.error("[Vocabulary] Failed to load parts of speech:", error);
      });
  }, []);

  // Every filter (level/topic/type/search/recent) is applied server-side in
  // one request. The backend already returns matching levels/topics lookup
  // lists alongside the page of words, so there's never a need to fetch the
  // whole word table client-side just to populate dropdowns — that full
  // scan (up to 10k rows with deep joins) was the actual source of the
  // "Topic/Type options load with a delay" slowness.
  useEffect(() => {
    const selectedPartOfSpeechName =
      selectedPartOfSpeechId !== null
        ? partsOfSpeech
            .find((p) => p.id === selectedPartOfSpeechId)
            ?.name?.toLowerCase()
        : undefined;

    dispatch(
      fetchWords({
        limit: WORDS_PER_PAGE,
        page: currentPage,
        level: selectedLevel || undefined,
        topic: selectedTopic || undefined,
        partOfSpeech: selectedPartOfSpeechName,
        verbFilter: selectedVerbFilter || undefined,
        prepositionFilter: selectedPrepositionFilter || undefined,
        adjectiveFilter: selectedAdjectiveFilter || undefined,
        recentOnly,
        search: debouncedSearchQuery.trim() || undefined,
        searchType,
      }),
    );
  }, [
    dispatch,
    currentPage,
    selectedLevel,
    selectedTopic,
    selectedPartOfSpeechId,
    selectedVerbFilter,
    selectedPrepositionFilter,
    selectedAdjectiveFilter,
    recentOnly,
    debouncedSearchQuery,
    searchType,
    partsOfSpeech,
  ]);

  const paginatedWords = words;

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    setCurrentPage(1);
  }, []);

  // Fetches "did you mean" suggestions off its own debounce, entirely
  // decoupled from the table-fetch pipeline above — a failure or slow
  // response here must never affect the main search. Mirrors web's
  // suggestion effect (WordList.jsx), including filtering down to only
  // isFuzzy results: the table itself already shows plain substring
  // matches live, so a second redundant autocomplete list isn't needed —
  // only actual typo corrections are worth surfacing.
  useEffect(() => {
    const trimmed = debouncedSuggestionQuery.trim();

    if (Date.now() < suppressSuggestionsUntilRef.current) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    if (trimmed.length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    let cancelled = false;
    wordService
      .suggestWords(trimmed, searchType, 8)
      .then((results) => {
        if (cancelled) return;
        const fuzzyOnly = results.filter((item) => item.isFuzzy);
        setSuggestions(fuzzyOnly);
        setSuggestionsOpen(fuzzyOnly.length > 0);
      })
      .catch(() => {
        if (cancelled) return;
        setSuggestions([]);
        setSuggestionsOpen(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSuggestionQuery, searchType]);

  const selectSuggestion = useCallback(
    (suggestion: WordSuggestion) => {
      suppressSuggestionsUntilRef.current = Date.now() + 350;
      const nextSearchValue =
        searchType === "meaning" && suggestion.meaning?.[0]
          ? suggestion.meaning[0]
          : suggestion.value;
      setSearchQuery(nextSearchValue);
      setCurrentPage(1);
      setSuggestions([]);
      setSuggestionsOpen(false);
    },
    [searchType],
  );

  const handleReset = useCallback(() => {
    setSearchQuery("");
    setSelectedLevel("");
    setSelectedTopic("");
    setSelectedPartOfSpeechId(null);
    setSelectedVerbFilter("");
    setSelectedPrepositionFilter("");
    setSelectedAdjectiveFilter("");
    setExpandedTypeId(null);
    setRecentOnly(false);
    setCurrentPage(1);
  }, []);

  const toggleFavorite = useCallback(
    (wordId: string) => {
      const isFavorited = favorites.has(wordId);
      console.log(
        "[toggleFavorite] Toggling favorite for wordId:",
        wordId,
        "isFavorited:",
        isFavorited,
      );

      // Update local state immediately for UI responsiveness
      setFavorites((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(wordId)) {
          newSet.delete(wordId);
        } else {
          newSet.add(wordId);
        }
        return newSet;
      });

      // Persist to local storage
      const persistToStorage = (newFavorites: Set<string>) => {
        AsyncStorage.setItem(
          "vocabulary_favorites",
          JSON.stringify(Array.from(newFavorites)),
        ).catch((e) =>
          console.error("[toggleFavorite] Error saving to storage:", e),
        );
      };

      // Sync with backend
      const syncWithBackend = async (currentUser: any) => {
        if (!currentUser || !currentUser.id) {
          console.warn(
            "[toggleFavorite] No user available, favorite changes persisted locally only",
          );
          return;
        }

        if (isFavorited) {
          // Remove from favorites
          try {
            console.log(
              "[toggleFavorite] Removing favorite from backend for:",
              wordId,
            );
            await favoriteService.removeFavorite(wordId);
            console.log("[toggleFavorite] Successfully removed from backend");
            persistToStorage(updatedFavorites);
          } catch (error) {
            console.error(
              "[toggleFavorite] Error removing from backend:",
              error,
            );
            // Revert local state on error
            setFavorites((prev) => {
              const reverted = new Set(prev);
              reverted.add(wordId);
              return reverted;
            });
          }
        } else {
          // Add to favorites
          try {
            console.log(
              "[toggleFavorite] Adding favorite to backend for:",
              wordId,
            );
            await favoriteService.addFavorite(wordId);
            console.log("[toggleFavorite] Successfully added to backend");
            persistToStorage(updatedFavorites);
          } catch (error) {
            console.error("[toggleFavorite] Error adding to backend:", error);
            // Revert local state on error
            setFavorites((prev) => {
              const reverted = new Set(prev);
              reverted.delete(wordId);
              return reverted;
            });
          }
        }
      };

      // Get updated favorites set
      const updatedFavorites = new Set(favorites);
      if (updatedFavorites.has(wordId)) {
        updatedFavorites.delete(wordId);
      } else {
        updatedFavorites.add(wordId);
      }

      // Try to sync with backend if user is authenticated
      if (user && user.id) {
        syncWithBackend(user);
      } else {
        // Check if user is authenticated
        authService.isAuthenticated().then((isAuth) => {
          console.log("[toggleFavorite] isAuthenticated check result:", isAuth);

          // Always try to load user, even if isAuthenticated says false
          // The token might exist in SecureStore but just hasn't been checked yet
          authService
            .getCurrentUser()
            .then((loadedUser) => {
              console.log(
                "[toggleFavorite] Successfully loaded user from backend:",
                loadedUser,
              );
              syncWithBackend(loadedUser);
            })
            .catch((error) => {
              console.log(
                "[toggleFavorite] No authenticated user (guest browsing):",
                error?.response?.status || error.message,
              );
              console.log(
                "[toggleFavorite] Falling back to local storage persistence",
              );
              persistToStorage(updatedFavorites);
            });
        });
      }
    },
    [favorites, user],
  );

  const toggleReveal = useCallback((wordId: string) => {
    setRevealedWords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(wordId)) {
        newSet.delete(wordId);
      } else {
        newSet.add(wordId);
      }
      return newSet;
    });
  }, []);

  // Modal handlers
  const openWordModal = useCallback((word: WordVocab) => {
    console.log("[Vocabulary] Opening modal for word:", word.id);
    setSelectedWordForModal(word);
    setIsModalVisible(true);
  }, []);

  const closeWordModal = useCallback(() => {
    console.log("[Vocabulary] Closing word modal");
    setIsModalVisible(false);
    setSelectedWordForModal(null);
  }, []);

  const handleToggleFavoriteModal = useCallback(
    async (wordId: string) => {
      setLoadingFavoritesModal(true);
      try {
        await new Promise((resolve) => {
          // Call toggleFavorite and resolve after state updates
          toggleFavorite(wordId);
          // Small delay to ensure state updates
          setTimeout(resolve, 300);
        });
      } finally {
        setLoadingFavoritesModal(false);
      }
    },
    [toggleFavorite],
  );

  const renderWordRow = ({
    item,
    index,
  }: {
    item: WordVocab;
    index: number;
  }) => {
    const isFavorite = favorites.has(item.id);

    return (
      <WordTableRow
        word={item}
        index={index}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onPressWord={openWordModal}
        learningMode={learningMode}
        isRevealed={revealedWords.has(item.id)}
        onRevealToggle={toggleReveal}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Header — Vocabulary is a bottom tab (not a pushed screen), so
            there's no back button here; just centered to match every other
            screen's title style/position. */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📚 Vocabulary</Text>
          <Text style={styles.headerSubtitle}>
            Master German vocabulary
          </Text>
        </View>

        {/* Search Type Selection */}
        <View style={styles.searchTypeRow}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              searchType === "word" && styles.typeBtnActive,
              { marginRight: 8 },
            ]}
            onPress={() => {
              setSearchType("word");
              setCurrentPage(1);
            }}
          >
            <Text
              style={[
                styles.typeBtnText,
                searchType === "word" && styles.typeBtnTextActive,
              ]}
            >
              By Word
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              searchType === "meaning" && styles.typeBtnActive,
            ]}
            onPress={() => {
              setSearchType("meaning");
              setCurrentPage(1);
            }}
          >
            <Text
              style={[
                styles.typeBtnText,
                searchType === "meaning" && styles.typeBtnTextActive,
              ]}
            >
              By Meaning
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={iconMuted}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search by ${searchType}...`}
            placeholderTextColor="#CCC"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <MaterialCommunityIcons name="close" size={20} color={iconMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* "Did you mean" typo suggestions */}
        {suggestionsOpen && suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((suggestion) => {
              const suggestedText =
                searchType === "meaning" && suggestion.meaning?.[0]
                  ? suggestion.meaning[0]
                  : suggestion.value;
              return (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(suggestion)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.suggestionText}>
                    Did you mean{" "}
                    <Text style={styles.suggestionTextHighlight}>
                      {suggestedText}
                    </Text>
                    ?
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {/* Level Filter */}
          <View style={styles.filterItem}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowLevelDropdown(!showLevelDropdown)}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedLevel || "All Levels"}
              </Text>
              <MaterialCommunityIcons
                name={showLevelDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color={iconMuted}
              />
            </TouchableOpacity>
            {showLevelDropdown && (
              <ScrollView
                style={styles.dropdownList}
                scrollEnabled={true}
                nestedScrollEnabled={true}
              >
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSelectedLevel("");
                    setSelectedTopic(""); // Reset topic when level is reset
                    setShowLevelDropdown(false);
                    setCurrentPage(1);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      !selectedLevel && styles.dropdownOptionTextActive,
                    ]}
                  >
                    All Levels
                  </Text>
                </TouchableOpacity>
                {levels && levels.length > 0 ? (
                  levels.map((level, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.dropdownOption}
                        onPress={() => {
                          console.log(
                            "[Vocabulary] Selected level:",
                            level.level,
                          );
                          setSelectedLevel(level.level); // Use level.level (not level.name)
                          setSelectedTopic(""); // Reset topic when level changes
                          setShowLevelDropdown(false);
                          setCurrentPage(1);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selectedLevel === level.level &&
                              styles.dropdownOptionTextActive,
                          ]}
                        >
                          {level.level}
                        </Text>
                      </TouchableOpacity>
                    ))
                ) : (
                  <Text style={styles.dropdownOptionText}>
                    No levels available
                  </Text>
                )}
              </ScrollView>
            )}
          </View>

          {/* Topic Filter */}
          <View style={styles.filterItem}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowTopicDropdown(!showTopicDropdown)}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedTopic ||
                    (selectedLevel
                      ? `Topics for ${selectedLevel}`
                      : "All Topics")}
                </Text>
                <MaterialCommunityIcons
                  name={showTopicDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={iconMuted}
                />
              </TouchableOpacity>
              {showTopicDropdown && (
                <ScrollView
                  style={styles.dropdownList}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                >
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSelectedTopic("");
                      setShowTopicDropdown(false);
                      setCurrentPage(1);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        !selectedTopic && styles.dropdownOptionTextActive,
                      ]}
                    >
                      {selectedLevel
                        ? `Topics for ${selectedLevel}`
                        : "All Topics"}
                    </Text>
                  </TouchableOpacity>
                  {topics.length > 0 ? (
                    topics.map((topic) => (
                      <TouchableOpacity
                        key={String(topic.id)}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setSelectedTopic(topic.name);
                          setShowTopicDropdown(false);
                          setCurrentPage(1);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selectedTopic === topic.name &&
                              styles.dropdownOptionTextActive,
                          ]}
                        >
                          {topic.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.dropdownOptionText}>
                      No topics available
                    </Text>
                  )}
                </ScrollView>
              )}
            </View>

          {/* Type (Part of Speech) Filter */}
            <View style={styles.filterItem}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedVerbFilter
                    ? VERB_SUB_FILTERS.find((f) => f.value === selectedVerbFilter)
                        ?.label || "Verb"
                    : selectedPrepositionFilter
                      ? PREPOSITION_SUB_FILTERS.find(
                          (f) => f.value === selectedPrepositionFilter,
                        )?.label || "Preposition"
                      : selectedAdjectiveFilter
                        ? ADJECTIVE_SUB_FILTERS.find(
                            (f) => f.value === selectedAdjectiveFilter,
                          )?.label || "Adjective"
                        : selectedPartOfSpeechId !== null
                          ? partsOfSpeech.find(
                              (p) => p.id === selectedPartOfSpeechId,
                            )?.name || "All Types"
                          : "All Types"}
                </Text>
                <MaterialCommunityIcons
                  name={showTypeDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={iconMuted}
                />
              </TouchableOpacity>
              {showTypeDropdown && (
                <ScrollView
                  style={styles.dropdownList}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                >
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSelectedPartOfSpeechId(null);
                      setSelectedVerbFilter("");
                      setSelectedPrepositionFilter("");
                      setSelectedAdjectiveFilter("");
                      setExpandedTypeId(null);
                      setShowTypeDropdown(false);
                      setCurrentPage(1);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        selectedPartOfSpeechId === null &&
                          styles.dropdownOptionTextActive,
                      ]}
                    >
                      All Types
                    </Text>
                  </TouchableOpacity>
                  {partsOfSpeech.map((pos) => {
                    const subFilters =
                      pos.id === verbPos?.id
                        ? VERB_SUB_FILTERS
                        : pos.id === prepositionPos?.id
                          ? PREPOSITION_SUB_FILTERS
                          : pos.id === adjectivePos?.id
                            ? ADJECTIVE_SUB_FILTERS
                            : null;
                    const isExpanded = expandedTypeId === pos.id;
                    const activeSubFilterValue =
                      pos.id === verbPos?.id
                        ? selectedVerbFilter
                        : pos.id === prepositionPos?.id
                          ? selectedPrepositionFilter
                          : pos.id === adjectivePos?.id
                            ? selectedAdjectiveFilter
                            : "";
                    const isPlainSelected =
                      selectedPartOfSpeechId === pos.id && !activeSubFilterValue;

                    const selectPlainType = () => {
                      setSelectedPartOfSpeechId(pos.id);
                      setSelectedVerbFilter("");
                      setSelectedPrepositionFilter("");
                      setSelectedAdjectiveFilter("");
                      setShowTypeDropdown(false);
                      setExpandedTypeId(null);
                      setCurrentPage(1);
                    };

                    const selectSubFilter = (value: string) => {
                      setSelectedPartOfSpeechId(pos.id);
                      setSelectedVerbFilter(
                        subFilters === VERB_SUB_FILTERS ? value : "",
                      );
                      setSelectedPrepositionFilter(
                        subFilters === PREPOSITION_SUB_FILTERS ? value : "",
                      );
                      setSelectedAdjectiveFilter(
                        subFilters === ADJECTIVE_SUB_FILTERS ? value : "",
                      );
                      setShowTypeDropdown(false);
                      setExpandedTypeId(null);
                      setCurrentPage(1);
                    };

                    return (
                      <View key={pos.id}>
                        <TouchableOpacity
                          style={styles.dropdownOption}
                          onPress={() =>
                            subFilters
                              ? setExpandedTypeId(isExpanded ? null : pos.id)
                              : selectPlainType()
                          }
                        >
                          <View style={styles.dropdownOptionRow}>
                            <Text
                              style={[
                                styles.dropdownOptionText,
                                isPlainSelected &&
                                  styles.dropdownOptionTextActive,
                              ]}
                            >
                              {pos.name}
                            </Text>
                            {subFilters && (
                              <MaterialCommunityIcons
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={16}
                                color={iconMuted}
                              />
                            )}
                          </View>
                        </TouchableOpacity>

                        {subFilters && isExpanded && (
                          <View style={styles.subFilterContainer}>
                            <TouchableOpacity
                              style={styles.subFilterOption}
                              onPress={selectPlainType}
                            >
                              <Text
                                style={[
                                  styles.dropdownOptionText,
                                  isPlainSelected &&
                                    styles.dropdownOptionTextActive,
                                ]}
                              >
                                All {pos.name}
                              </Text>
                            </TouchableOpacity>
                            {subFilters.map((filter) => {
                              const isActive =
                                activeSubFilterValue === filter.value;
                              return (
                                <TouchableOpacity
                                  key={filter.value}
                                  style={styles.subFilterOption}
                                  onPress={() => selectSubFilter(filter.value)}
                                >
                                  <Text
                                    style={[
                                      styles.dropdownOptionText,
                                      isActive &&
                                        styles.dropdownOptionTextActive,
                                    ]}
                                  >
                                    {filter.label}
                                  </Text>
                                  <Text style={styles.subFilterDescription}>
                                    {filter.description}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            {Boolean(
              searchQuery ||
                selectedLevel ||
                selectedTopic ||
                selectedPartOfSpeechId !== null ||
                selectedVerbFilter ||
                selectedPrepositionFilter ||
                selectedAdjectiveFilter ||
                recentOnly,
            ) && (
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <MaterialCommunityIcons
                  name="refresh"
                  size={14}
                  color="white"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.learnBtn, learningMode && styles.learnBtnActive]}
              onPress={() => {
                setLearningMode(!learningMode);
                setRevealedWords(new Set());
              }}
            >
              <MaterialCommunityIcons
                name={learningMode ? "book-open" : "book"}
                size={14}
                color={learningMode ? "white" : "#666"}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.learnBtnText,
                  learningMode && styles.learnBtnTextActive,
                ]}
              >
                Learn
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.learnBtn, recentOnly && styles.learnBtnActive]}
              onPress={() => {
                setRecentOnly(!recentOnly);
                setCurrentPage(1);
              }}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={recentOnly ? "white" : iconMuted}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.learnBtnText,
                  recentOnly && styles.learnBtnTextActive,
                ]}
              >
                Recent
              </Text>
            </TouchableOpacity>
            <Text style={styles.wordCountText}>{total} words</Text>
          </View>
        </View>

        {/* Pagination - at top */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[
                styles.pageBtn,
                currentPage === 1 && styles.pageBtnDisabled,
              ]}
              onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={18}
                color={currentPage === 1 ? "#CCC" : "#FF6B6B"}
                style={{ marginRight: 4 }}
              />
              <Text style={{ color: currentPage === 1 ? "#CCC" : "#FF6B6B" }}>
                Previous
              </Text>
            </TouchableOpacity>
            <Text style={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </Text>
            <TouchableOpacity
              style={[
                styles.pageBtn,
                currentPage >= totalPages && styles.pageBtnDisabled,
              ]}
              onPress={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage >= totalPages}
            >
              <Text
                style={{
                  color: currentPage >= totalPages ? "#CCC" : "#FF6B6B",
                  marginRight: 4,
                }}
              >
                Next
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={currentPage >= totalPages ? "#CCC" : "#FF6B6B"}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Table Header */}
        <WordTableHeader />

        {/* Words List */}
        {isLoading && paginatedWords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.emptyText}>Loading vocabulary...</Text>
          </View>
        ) : paginatedWords.length === 0 && !isLoading ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="search-web" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No words found</Text>
            {!words || words.length === 0 ? (
              <>
                <Text style={styles.emptyTextSmall}>
                  Total words in store: {words?.length || 0}
                </Text>
                <Text style={styles.emptyTextSmall}>
                  Loading status: {isLoading ? "Loading..." : "Completed"}
                </Text>
              </>
            ) : null}
          </View>
        ) : (
          <FlatList
            data={paginatedWords}
            renderItem={renderWordRow}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Word Detail Modal */}
        <WordDetailModal
          visible={isModalVisible}
          word={selectedWordForModal}
          onClose={closeWordModal}
          isFavorite={
            selectedWordForModal
              ? favorites.has(selectedWordForModal.id)
              : false
          }
          onToggleFavorite={handleToggleFavoriteModal}
          loadingFavorite={loadingFavoritesModal}
        />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: "light" | "dark") => {
  const isDark = theme === "dark";
  const bg = isDark ? "#020617" : "#FFF";
  const panelBg = isDark ? "#0f172a" : "#F5F5F5";
  const cardBg = isDark ? "#0f172a" : "#FFF";
  const border = isDark ? "#1e293b" : "#EEE";
  const borderSubtle = isDark ? "#1e293b" : "#F0F0F0";
  const inputBorder = isDark ? "#334155" : "#DDD";
  const textPrimary = isDark ? "#F1F5F9" : "#333";
  const textMuted = isDark ? "#94A3B8" : "#666";
  const rowEven = isDark ? "#0f172a" : "#F8F9FF";
  const rowOdd = isDark ? "#020617" : "#FFF";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },

    scrollContainer: {
      flex: 1,
    },

    // Header
    header: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: panelBg,
      borderBottomWidth: 1,
      borderBottomColor: border,
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: textPrimary,
      marginBottom: 2,
      textAlign: "center",
    },
    headerSubtitle: {
      fontSize: 11,
      color: textMuted,
      lineHeight: 14,
      textAlign: "center",
    },

    // Search Type Row
    searchTypeRow: {
      flexDirection: "row",
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: panelBg,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    typeBtn: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: inputBorder,
      backgroundColor: cardBg,
      alignItems: "center",
    },
    typeBtnActive: {
      backgroundColor: "#FF6B6B",
      borderColor: "#FF6B6B",
    },
    typeBtnText: {
      fontSize: 11,
      fontWeight: "700",
      color: textMuted,
    },
    typeBtnTextActive: {
      color: "#FFF",
    },

    // Search Bar
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: panelBg,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    searchInput: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: cardBg,
      borderRadius: 6,
      fontSize: 12,
      color: textPrimary,
      borderWidth: 1,
      borderColor: inputBorder,
    },

    // "Did you mean" suggestions
    suggestionsBox: {
      marginHorizontal: 12,
      marginTop: 4,
      backgroundColor: cardBg,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: inputBorder,
      overflow: "hidden",
    },
    suggestionItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    suggestionText: {
      fontSize: 12,
      fontStyle: "italic",
      color: textMuted,
    },
    suggestionTextHighlight: {
      fontWeight: "700",
      color: "#F59E0B",
    },

    // Filters
    filtersContainer: {
      backgroundColor: cardBg,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    filterItem: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: borderSubtle,
    },
    filterValues: {
      flexGrow: 0,
    },
    filterChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: inputBorder,
      backgroundColor: cardBg,
      marginRight: 6,
    },
    filterChipActive: {
      backgroundColor: "#FF6B6B",
      borderColor: "#FF6B6B",
    },
    filterChipText: {
      fontSize: 11,
      fontWeight: "600",
      color: textMuted,
    },

    // Dropdown Styles
    dropdownButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: cardBg,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: inputBorder,
    },
    dropdownButtonText: {
      flex: 1,
      fontSize: 14,
      color: textPrimary,
      fontWeight: "500",
    },
    dropdownList: {
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: inputBorder,
      borderTopWidth: 0,
      borderRadius: 0,
      height: 250,
      marginTop: -1,
      zIndex: 10,
    },
    dropdownOption: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: borderSubtle,
    },
    dropdownOptionText: {
      fontSize: 14,
      color: textMuted,
    },
    dropdownOptionTextActive: {
      fontWeight: "700",
      color: "#FF6B6B",
    },
    dropdownOptionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    subFilterContainer: {
      backgroundColor: isDark ? "#1e293b" : "#F5F5F5",
      paddingLeft: 16,
    },
    subFilterOption: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: borderSubtle,
    },
    subFilterDescription: {
      fontSize: 11,
      color: textMuted,
      marginTop: 2,
      fontStyle: "italic",
    },

    // Action Row
    actionRow: {
      flexDirection: "row",
      paddingHorizontal: 12,
      paddingVertical: 10,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: border,
    },
    resetBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 4,
      backgroundColor: "#FF6B6B",
      marginRight: 4,
    },
    resetBtnText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#FFF",
    },
    learnBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: inputBorder,
      backgroundColor: cardBg,
      marginRight: 4,
    },
    learnBtnActive: {
      backgroundColor: "#FF6B6B",
      borderColor: "#FF6B6B",
    },
    learnBtnText: {
      fontSize: 10,
      fontWeight: "700",
      color: textMuted,
    },
    learnBtnTextActive: {
      color: "#FFF",
    },
    wordCountText: {
      marginLeft: "auto",
      fontSize: 10,
      fontWeight: "700",
      color: textMuted,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 3,
      backgroundColor: panelBg,
    },

    // List and Empty States
    listContent: {
      flexGrow: 1,
      minHeight: 200,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      fontSize: 14,
      color: textMuted,
      marginTop: 12,
    },
    emptyTextSmall: {
      fontSize: 10,
      color: isDark ? "#64748B" : "#BBB",
      marginTop: 6,
    },

    // Pagination
    pagination: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: border,
      backgroundColor: panelBg,
    },
    pageBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: cardBg,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: "#FF6B6B",
      marginRight: 4,
    },
    pageBtnDisabled: {
      opacity: 0.5,
      borderColor: isDark ? "#475569" : "#CCC",
    },
    pageInfo: {
      fontSize: 11,
      color: textMuted,
      fontWeight: "700",
    },
  });
};
