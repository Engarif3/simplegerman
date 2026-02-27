import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import { fetchWords, fetchAllWords } from "../../src/redux/wordsSlice";
import { favoriteService } from "../../src/services/favoriteService";
import { authService } from "../../src/services/authService";
import type { WordVocab } from "../../src/services/wordService";
import WordDetailModal from "../../src/components/WordDetailModal";

const WORDS_PER_PAGE = 40;

export default function VocabularyScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { words, allWords, isLoading } = useAppSelector((state) => state.words);
  const { user } = useAppSelector((state) => state.auth);

  // State Management
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"word" | "meaning">("word");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [learningMode, setLearningMode] = useState(false);
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const [levels, setLevels] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<any[]>([]); // Topics filtered by selected level
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedWordForModal, setSelectedWordForModal] =
    useState<WordVocab | null>(null);
  const [loadingFavoritesModal, setLoadingFavoritesModal] = useState(false);

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
            console.log("[Vocabulary] Raw favorites response:", favorites);
            const favoriteIds = Array.isArray(favorites)
              ? favorites.map((fav: any) => String(fav.id))
              : favorites?.data?.map((fav: any) => String(fav.id)) || [];
            setFavorites(new Set(favoriteIds));
            console.log(
              "[Vocabulary] Loaded favorites from backend:",
              favoriteIds,
            );
          }
        } catch (error) {
          console.error(
            "[Vocabulary] Could not load user from backend:",
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
        console.log("[Vocabulary] Raw favorites response:", favorites);
        const favoriteIds = Array.isArray(favorites)
          ? favorites.map((fav: any) => String(fav.id))
          : favorites?.data?.map((fav: any) => String(fav.id)) || [];
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

  // Extract unique levels and topics from ALL words (not paginated)
  useEffect(() => {
    if (allWords && allWords.length > 0) {
      console.log(
        "[Vocabulary] Processing ALL words for level/topic extraction, count:",
        allWords.length,
      );
      console.log("[Vocabulary] Sample word:", allWords[0]);

      // CEFR level order
      const cefrOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];

      // Get unique levels - following React JS pattern
      const uniqueLevels: any = {};
      allWords.forEach((w) => {
        if (w.level && w.level.level) {
          const levelValue = w.level.level;
          if (!uniqueLevels[levelValue]) {
            uniqueLevels[levelValue] = {
              id: w.level.id,
              level: levelValue,
              name: levelValue, // For display
            };
          }
        }
      });

      // Sort levels in CEFR order
      const levelsList = Object.values(uniqueLevels).sort((a: any, b: any) => {
        const indexA = cefrOrder.indexOf(a.level);
        const indexB = cefrOrder.indexOf(b.level);

        // If both are in CEFR order, sort by that
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }

        // Fallback to alphabetical
        return String(a.level).localeCompare(String(b.level));
      });

      console.log("[Vocabulary] Unique levels found (sorted):", levelsList);
      setLevels(levelsList);

      // Get unique topics with level information for proper sorting
      const uniqueTopics: { [key: string]: any } = {};
      allWords.forEach((w) => {
        if (w.topic && w.topic.id) {
          // Enrich topic with levelId if not already present
          if (!uniqueTopics[w.topic.id]) {
            uniqueTopics[w.topic.id] = {
              ...w.topic,
              levelId: w.level?.id, // Store the level ID for sorting
            };
          }
        }
      });

      // Create map for sorting: levelId -> level object
      const levelIdToLevelMap = new Map(
        levelsList.map((level: any) => [level.id, level]),
      );

      // Sort topics by levelId, then by ID
      const topicsList = Object.values(uniqueTopics).sort((a, b) => {
        const levelA = levelIdToLevelMap.get(a.levelId);
        const levelB = levelIdToLevelMap.get(b.levelId);

        if (levelA && levelB) {
          if (levelA.id !== levelB.id) {
            return levelA.id - levelB.id;
          }
        }

        // Sort by topic ID if same level
        const aId = typeof a.id === "string" ? parseInt(a.id, 10) : a.id;
        const bId = typeof b.id === "string" ? parseInt(b.id, 10) : b.id;
        return aId - bId;
      });

      console.log("[Vocabulary] Unique topics found:", {
        count: topicsList.length,
        topics: topicsList,
      });
      setTopics(topicsList);
    }
  }, [allWords]);

  // Initialize filteredTopics when topics first loaded
  useEffect(() => {
    console.log("[Vocabulary] Topics state updated:", {
      count: topics.length,
      topics,
    });
    if (topics && topics.length > 0) {
      console.log("[Vocabulary] Initializing filteredTopics with all topics");
      setFilteredTopics(topics);
    }
  }, [topics]);

  // Create level-to-topics map and filter topics based on selected level (matching React JS)
  useEffect(() => {
    console.log("[Vocabulary] Filter effect triggered:", {
      levelsCount: levels?.length,
      topicsCount: topics?.length,
      selectedLevel,
    });

    if (!levels || levels.length === 0 || !topics || topics.length === 0)
      return;

    // Build map of levelId -> Set of topic IDs from topics array (not from words)
    // This ensures all topics show regardless of pagination
    const levelToTopicsMap = new Map<number, Set<string | number>>();

    topics.forEach((topic) => {
      const levelId = topic.levelId;
      if (levelId) {
        if (!levelToTopicsMap.has(levelId)) {
          levelToTopicsMap.set(levelId, new Set());
        }
        levelToTopicsMap.get(levelId)!.add(topic.id);
      }
    });

    console.log("[Vocabulary] Level-to-topics map created:", levelToTopicsMap);

    // Convert levelId to level value for filtering
    const levelIdToLevelValueMap = new Map(
      levels.map((level: any) => [level.id, level.level]),
    );

    // Filter topics based on selected level
    if (selectedLevel === "") {
      // Show all topics
      console.log(
        "[Vocabulary] Selected level is empty, showing all",
        topics.length,
        "topics",
      );
      setFilteredTopics(topics);
    } else {
      // Find the levelId for the selected level
      const selectedLevelId = levels.find(
        (l: any) => l.level === selectedLevel,
      )?.id;

      console.log(
        "[Vocabulary] Filtering for level:",
        selectedLevel,
        "levelId:",
        selectedLevelId,
      );

      if (selectedLevelId) {
        // Show only topics for selected level
        const topicIdsForLevel =
          levelToTopicsMap.get(selectedLevelId) || new Set();
        console.log("[Vocabulary] Topic IDs for this level:", topicIdsForLevel);
        const matchedTopics = topics.filter((topic) =>
          topicIdsForLevel.has(topic.id),
        );
        console.log(
          "[Vocabulary] Filtered topics count:",
          matchedTopics.length,
        );
        setFilteredTopics(matchedTopics);
      }
    }
  }, [levels, topics, selectedLevel]);

  // Debug filteredTopics state changes
  useEffect(() => {
    console.log("[Vocabulary] filteredTopics state updated:", {
      count: filteredTopics.length,
      list: filteredTopics,
      showTopicDropdown,
      selectedLevel,
    });
  }, [filteredTopics, showTopicDropdown]);

  // Initial fetch
  useEffect(() => {
    console.log("[Vocabulary] Fetching words for page:", currentPage);
    dispatch(fetchWords({ limit: WORDS_PER_PAGE, page: currentPage }));
  }, [dispatch, currentPage]);

  // Fetch all words once for topic extraction (not paginated)
  useEffect(() => {
    if (allWords.length === 0) {
      console.log("[Vocabulary] Fetching ALL words for topic/level extraction");
      dispatch(fetchAllWords());
    }
  }, [dispatch, allWords]);

  // Filter and sort words (matching React JS filtering logic)
  const filteredAndSortedWords = useMemo(() => {
    // Use allWords for filtering to ensure we get all words, not just the current page
    // The pagination will happen after filtering
    const wordsToFilter = allWords && allWords.length > 0 ? allWords : words;

    if (!wordsToFilter || wordsToFilter.length === 0) return [];

    let filtered = [...wordsToFilter];

    console.log("[Vocabulary] Starting filter with", filtered.length, "words");

    // Level filter - use word.level?.level (matching React JS)
    if (selectedLevel) {
      filtered = filtered.filter((w) => w.level?.level === selectedLevel);
      console.log("[Vocabulary] After level filter:", filtered.length);
    }

    // Topic filter
    if (selectedTopic) {
      console.log(
        "[Vocabulary] Filtering by topic:",
        selectedTopic,
        "type:",
        typeof selectedTopic,
      );
      filtered = filtered.filter((w) => {
        const match = String(w.topic?.id) === String(selectedTopic);
        return match;
      });
      console.log("[Vocabulary] After topic filter:", filtered.length);
    }

    // Search filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((word) => {
        if (searchType === "word") {
          // Check both singular (value) and plural (pluralForm) - matching React JS
          const singular = String(word.value || "").toLowerCase();
          const plural = String(word.pluralForm || "").toLowerCase();
          return singular.includes(query) || plural.includes(query);
        } else {
          const meaning = String(word.meaning || "").toLowerCase();
          return meaning.includes(query);
        }
      });

      // Sort by relevance
      filtered.sort((a, b) => {
        const getScore = (word: WordVocab) => {
          const val = searchType === "word" ? word.value : word.meaning;
          const str = String(val || "").toLowerCase();
          if (str === query) return 100;
          if (str.startsWith(query)) return 50;
          return 10;
        };
        return getScore(b) - getScore(a);
      });
    } else {
      // Default alphabetical sort - natural order (matching React JS)
      // Extract first alphanumeric character for primary sort
      const getNaturalSortKey = (str: string): [string, string] => {
        const trimmed = str.trim();
        // Find first alphanumeric character
        const alphanumericMatch = trimmed.match(/[a-zA-Z0-9]/);
        const firstAlphanumeric = alphanumericMatch
          ? alphanumericMatch[0].toUpperCase()
          : "\0";
        return [firstAlphanumeric, trimmed.toLowerCase()];
      };

      filtered.sort((a, b) => {
        const aKey = getNaturalSortKey(a.value || "");
        const bKey = getNaturalSortKey(b.value || "");

        // First compare by first alphanumeric character
        if (aKey[0] !== bKey[0]) {
          return aKey[0].localeCompare(bKey[0]);
        }

        // If same first character, use full word comparison
        return aKey[1].localeCompare(bKey[1], "de", { numeric: true });
      });
    }

    return filtered;
  }, [allWords, words, selectedLevel, selectedTopic, searchQuery, searchType]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedWords.length / WORDS_PER_PAGE);
  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * WORDS_PER_PAGE;
    return filteredAndSortedWords.slice(start, start + WORDS_PER_PAGE);
  }, [filteredAndSortedWords, currentPage]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    setCurrentPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setSearchQuery("");
    setSelectedLevel("");
    setSelectedTopic("");
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
              console.error(
                "[toggleFavorite] Could not load user from backend:",
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
    // Handle article - could be string or object
    let article = "";
    if (item.article) {
      if (typeof item.article === "string") {
        const trimmed = item.article.trim();
        article = trimmed || "";
      } else if (typeof item.article === "object") {
        // Try common property names for object articles
        const artObj = item.article as any;
        article =
          artObj.name || artObj.value || artObj.article || artObj.text || "";
      }
    }

    // Handle level - ensure we get the name
    let levelName = "—";
    if (item.level) {
      if (typeof item.level === "object") {
        const levelObj = item.level as any;
        const extracted =
          levelObj.name ||
          levelObj.level ||
          levelObj.value ||
          levelObj.title ||
          levelObj.label ||
          "";
        levelName = String(extracted).trim() || "—";
      } else if (typeof item.level === "string") {
        levelName = String(item.level).trim() || "—";
      }
    }

    const value = item.value ? String(item.value).trim() : "";
    const meaningArray = Array.isArray(item.meaning)
      ? item.meaning
      : item.meaning
        ? [item.meaning]
        : [];
    const meaning =
      meaningArray
        .map((m) => {
          if (!m) return "";
          return String(m).trim();
        })
        .filter((m) => m && m.length > 0)
        .join(", ") || "No meaning";
    const isRevealed = revealedWords.has(item.id);
    const isFavorite = favorites.has(item.id);
    const isEvenRow = index % 2 === 0;

    return (
      <TouchableOpacity
        style={[styles.wordRowTouchable]}
        onPress={() => openWordModal(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.wordRow,
            isEvenRow ? styles.wordRowEven : styles.wordRowOdd,
          ]}
        >
          {/* Article */}
          <View style={styles.colArt}>
            <Text
              style={[styles.cellText, styles.articleText]}
              numberOfLines={1}
            >
              {article}
            </Text>
          </View>

          {/* Word */}
          <View style={styles.colWord}>
            <Text style={[styles.cellText, styles.wordText]} numberOfLines={1}>
              {value}
            </Text>
          </View>

          {/* Meaning */}
          <View style={styles.colMeaning}>
            {learningMode ? (
              <TouchableOpacity
                onPress={() => toggleReveal(item.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cellText,
                    styles.meaningText,
                    { color: isRevealed ? "#00BCD4" : "#AAA" },
                  ]}
                  numberOfLines={1}
                >
                  {isRevealed ? meaning : "?????"}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text
                style={[styles.cellText, styles.meaningText]}
                numberOfLines={1}
              >
                {meaning}
              </Text>
            )}
          </View>

          {/* Level */}
          <View style={styles.colLevel}>
            <Text
              style={[styles.cellText, styles.levelText, { fontSize: 11 }]}
              numberOfLines={1}
            >
              {levelName}
            </Text>
          </View>

          {/* Favorite */}
          <TouchableOpacity
            style={styles.colAction}
            onPress={() => toggleFavorite(item.id)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isFavorite ? "heart" : "heart-outline"}
              size={18}
              color={isFavorite ? "#FF6B6B" : "#CCC"}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>📚 Learn Vocabulary</Text>
          <Text style={styles.headerTitle}>Vocabulary Library</Text>
          <Text style={styles.headerSubtitle}>
            Explore and master German vocabulary with interactive learning tools
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
            color="#666"
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
              <MaterialCommunityIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {/* Level Filter */}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Level:</Text>
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
                color="#666"
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
          {topics.length > 0 && (
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Topic:</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  const newState = !showTopicDropdown;
                  console.log(
                    "[Vocabulary] Topic dropdown toggled:",
                    newState,
                    {
                      filteredTopicsCount: filteredTopics.length,
                      filteredTopics,
                    },
                  );
                  setShowTopicDropdown(newState);
                }}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedTopic
                    ? topics.find((t) => t.id === selectedTopic)?.name ||
                      "Select Topic"
                    : selectedLevel
                      ? `Topics for ${selectedLevel}`
                      : "All Topics"}
                </Text>
                <MaterialCommunityIcons
                  name={showTopicDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#666"
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
                  {filteredTopics.length > 0 ? (
                    filteredTopics.map((topic) => (
                      <TouchableOpacity
                        key={String(topic.id)}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setSelectedTopic(topic.id);
                          setShowTopicDropdown(false);
                          setCurrentPage(1);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selectedTopic === topic.id &&
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
          )}

          {/* Action Row */}
          <View style={styles.actionRow}>
            {(searchQuery || selectedLevel || selectedTopic) && (
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
            <Text style={styles.wordCountText}>
              {paginatedWords.length} words
            </Text>
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
        <View style={styles.tableHeader}>
          <View style={styles.colArt}>
            <Text style={styles.headerText}>Art.</Text>
          </View>
          <View style={styles.colWord}>
            <Text style={styles.headerText}>Word</Text>
          </View>
          <View style={styles.colMeaning}>
            <Text style={styles.headerText}>Meaning</Text>
          </View>
          <View style={styles.colLevel}>
            <Text style={styles.headerText}>Level</Text>
          </View>
          <View style={styles.colAction}>
            <Text style={styles.headerText}>❤️</Text>
          </View>
        </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },

  scrollContainer: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerLabel: {
    fontSize: 11,
    color: "#FF6B6B",
    fontWeight: "700",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },

  // Search Type Row
  searchTypeRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    alignItems: "center",
  },
  typeBtnActive: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
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
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderRadius: 6,
    fontSize: 12,
    color: "#333",
    borderWidth: 1,
    borderColor: "#DDD",
  },

  // Filters
  filtersContainer: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  filterItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  filterValues: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },

  // Dropdown Styles
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  dropdownList: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
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
    borderBottomColor: "#F0F0F0",
  },
  dropdownOptionText: {
    fontSize: 14,
    color: "#666",
  },
  dropdownOptionTextActive: {
    fontWeight: "700",
    color: "#FF6B6B",
  },

  // Action Row
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
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
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    marginRight: 4,
  },
  learnBtnActive: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  learnBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#666",
  },
  learnBtnTextActive: {
    color: "#FFF",
  },
  wordCountText: {
    marginLeft: "auto",
    fontSize: 10,
    fontWeight: "700",
    color: "#666",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    backgroundColor: "#F0F0F0",
  },

  // Table Header
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#F0F0F0",
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B6B",
    alignItems: "center",
    gap: 4,
  },
  headerText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#333",
    textTransform: "uppercase",
  },

  // Column Widths
  colArt: {
    width: 40,
    alignItems: "center",
    marginRight: 4,
  },
  colWord: {
    width: 65,
    alignItems: "flex-start",
    marginRight: 4,
  },
  colMeaning: {
    flex: 1,
    alignItems: "flex-start",
    paddingHorizontal: 6,
    marginRight: 4,
  },
  colLevel: {
    width: 40,
    alignItems: "center",
    marginRight: 4,
  },
  colAction: {
    width: 30,
    alignItems: "center",
  },

  // Word Row
  wordRowTouchable: {
    width: "100%",
  },
  wordRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  wordRowEven: {
    backgroundColor: "#F8F9FF",
  },
  wordRowOdd: {
    backgroundColor: "#FFF",
  },
  cellText: {
    fontSize: 12,
    fontWeight: "500",
  },
  articleText: {
    color: "#FF6B6B",
    fontWeight: "700",
  },
  wordText: {
    color: "#2196F3",
    fontWeight: "600",
  },
  meaningText: {
    color: "#00BCD4",
  },
  levelText: {
    color: "#666",
    fontWeight: "600",
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
    color: "#999",
    marginTop: 12,
  },
  emptyTextSmall: {
    fontSize: 10,
    color: "#BBB",
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
    borderTopColor: "#EEE",
    backgroundColor: "#F5F5F5",
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFF",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FF6B6B",
    marginRight: 4,
  },
  pageBtnDisabled: {
    opacity: 0.5,
    borderColor: "#CCC",
  },
  pageInfo: {
    fontSize: 11,
    color: "#666",
    fontWeight: "700",
  },
});
