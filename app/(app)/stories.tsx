import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "../../src/hooks/useAppHooks";
import { fetchStories } from "../../src/redux/storiesSlice";

export default function StoriesScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { stories, isLoading } = useAppSelector((state) => state.stories);

  useEffect(() => {
    console.log("[Stories] Fetching stories...");
    dispatch(fetchStories({}));
  }, [dispatch]);

  if (isLoading && stories.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stories</Text>
      <FlatList
        data={stories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.storyCard}
            onPress={() => router.push(`/story/${item.id}`)}
          >
            <Text style={styles.storyTitle}>{item.title}</Text>
            <Text style={styles.storyDesc} numberOfLines={2}>
              {item.description}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No stories yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 16,
  },
  listContent: { paddingBottom: 20 },
  storyCard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  storyDesc: { fontSize: 13, color: "#666666" },
  emptyText: {
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
    marginTop: 40,
  },
});
