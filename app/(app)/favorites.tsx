import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAppSelector } from "../../src/hooks/useAppHooks";
import { favoriteService } from "../../src/services/favoriteService";
import type { WordVocab } from "../../src/services/wordService";
import WordDetailModal from "../../src/components/WordDetailModal";
import ConfirmDialog from "../../src/components/ConfirmDialog";
import WordTableRow from "../../src/components/WordTableRow";
import WordTableHeader from "../../src/components/WordTableHeader";
import { useTheme } from "../../src/context/ThemeContext";

// The /favorite-words/:userId endpoint returns every favorite in one
// response (no server-side pagination) — web paginates 40-per-page
// client-side over that full list, so this mirrors the same page size.
const FAVORITES_PER_PAGE = 40;

export default function FavoritesScreen() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAppSelector((state) => state.auth);
  const [favorites, setFavorites] = useState<WordVocab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordVocab | null>(null);
  const [favoriteActionId, setFavoriteActionId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmWordId, setConfirmWordId] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    if (!user?.id) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      const result = await favoriteService.getFavorites(user.id);
      setFavorites(result);
    } catch {
      setError("Could not load your favorites. Pull down to try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  // Expo Router's tab screens stay mounted once visited, so a plain useEffect
  // only ever fires on the first visit — favoriting a word from Vocabulary
  // and then switching to this tab would keep showing whatever was loaded
  // (or wasn't) the very first time. useFocusEffect re-runs this every time
  // the tab is actually focused, not just on mount.
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites]),
  );

  const totalPages = Math.max(1, Math.ceil(favorites.length / FAVORITES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedFavorites = useMemo(() => {
    const start = (safePage - 1) * FAVORITES_PER_PAGE;
    return favorites.slice(start, start + FAVORITES_PER_PAGE);
  }, [favorites, safePage]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setCurrentPage(1);
    loadFavorites();
  };

  const performRemove = async (wordId: string) => {
    setFavoriteActionId(wordId);
    try {
      await favoriteService.removeFavorite(wordId);
      setFavorites((prev) => prev.filter((w) => w.id !== wordId));
    } catch {
      // leave the item in place — the user can retry the remove tap
    } finally {
      setFavoriteActionId(null);
    }
  };

  // List-row remove asks for confirmation (matches web's dedicated
  // SweetAlert2 "Remove from Favorites?" flow in FavoritesList.jsx).
  const handleRowRemove = (wordId: string) => {
    setConfirmWordId(wordId);
  };

  const handleConfirmRemove = () => {
    const wordId = confirmWordId;
    setConfirmWordId(null);
    if (wordId) performRemove(wordId);
  };

  // The modal's own heart button is a direct toggle — no confirmation and it
  // never closes the modal, so the user can add/remove the same word back
  // and forth while reading its details (matches web's WordListModal
  // FavoriteButton, which just flips state in place).
  const handleModalToggle = async (wordId: string) => {
    setFavoriteActionId(wordId);
    try {
      const isCurrentlyFavorited = favorites.some((w) => w.id === wordId);
      if (isCurrentlyFavorited) {
        await favoriteService.removeFavorite(wordId);
        setFavorites((prev) => prev.filter((w) => w.id !== wordId));
      } else if (selectedWord && selectedWord.id === wordId) {
        await favoriteService.addFavorite(wordId);
        setFavorites((prev) => [...prev, selectedWord]);
      }
    } catch {
      // leave state as-is — the user can retry the toggle
    } finally {
      setFavoriteActionId(null);
    }
  };

  const renderItem = ({ item, index }: { item: WordVocab; index: number }) => (
    <WordTableRow
      word={item}
      index={index}
      isFavorite
      onToggleFavorite={handleRowRemove}
      onPressWord={setSelectedWord}
    />
  );

  const renderPaginationBar = () =>
    totalPages > 1 ? (
      <View className="mb-4 mt-2 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={safePage === 1}
          className={`flex-row items-center rounded-full border px-4 py-2 ${
            isDark ? "border-slate-700" : "border-gray-300"
          } ${safePage === 1 ? "opacity-40" : ""}`}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={18}
            color={isDark ? "#F1F5F9" : "#333"}
          />
          <Text className="ml-1 text-sm font-semibold text-gray-800 dark:text-white">
            Previous
          </Text>
        </TouchableOpacity>

        <Text className="text-xs font-semibold text-gray-500 dark:text-slate-400">
          Page {safePage} of {totalPages}
        </Text>

        <TouchableOpacity
          onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={safePage === totalPages}
          className={`flex-row items-center rounded-full border px-4 py-2 ${
            isDark ? "border-slate-700" : "border-gray-300"
          } ${safePage === totalPages ? "opacity-40" : ""}`}
        >
          <Text className="mr-1 text-sm font-semibold text-gray-800 dark:text-white">
            Next
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={isDark ? "#F1F5F9" : "#333"}
          />
        </TouchableOpacity>
      </View>
    ) : null;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  const isSelectedWordFavorited = selectedWord
    ? favorites.some((w) => w.id === selectedWord.id)
    : false;

  return (
    <View className="flex-1 bg-gray-50 p-4 dark:bg-slate-950">
      {error && (
        <Text className="mb-3 text-center text-sm text-rose-600">{error}</Text>
      )}

      {favorites.length > 0 && (
        <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
          {favorites.length} words saved
        </Text>
      )}

      {renderPaginationBar()}

      {favorites.length > 0 && <WordTableHeader />}

      <FlatList
        data={paginatedFavorites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View className="mt-24 items-center">
            <Text className="mb-2 text-4xl">❤️</Text>
            <Text className="text-base font-semibold text-gray-700 dark:text-slate-300">
              No favorites yet
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-500 dark:text-slate-400">
              Tap the heart on any word to save it here.
            </Text>
          </View>
        }
        ListFooterComponent={renderPaginationBar()}
      />

      <WordDetailModal
        visible={!!selectedWord}
        word={selectedWord}
        onClose={() => setSelectedWord(null)}
        isFavorite={isSelectedWordFavorited}
        onToggleFavorite={handleModalToggle}
        loadingFavorite={
          !!selectedWord && favoriteActionId === selectedWord.id
        }
        isLoggedIn={Boolean(user?.id)}
      />

      <ConfirmDialog
        visible={!!confirmWordId}
        title="Remove from Favorites?"
        message="Are you sure you want to remove this word from your favorites?"
        confirmLabel="Yes, remove it!"
        cancelLabel="Cancel"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmWordId(null)}
      />
    </View>
  );
}
