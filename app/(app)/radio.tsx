import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../src/context/ThemeContext";
import { useRadioPlayer } from "../../src/context/RadioPlayerContext";
import { radioService } from "../../src/services/radioService";
import type { RadioStation } from "../../src/services/radioService";
import { getDefaultStream } from "../../src/services/radioService";

export default function RadioScreen() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const {
    currentStation,
    isPlaying,
    playSelection,
    togglePlayback,
    setQueue,
    setMiniPlayerVisible,
    setMiniPlayerExpanded,
  } = useRadioPlayer();

  const [stations, setStations] = useState<RadioStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [brokenFavicons, setBrokenFavicons] = useState<Record<string, boolean>>({});

  const loadStations = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await radioService.getStations();
      setStations(result);
      setQueue(result);
    } catch {
      setError("Radio channels could not be loaded right now.");
    } finally {
      setIsLoading(false);
    }
  }, [setQueue]);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  const handlePlayToggle = async (station: RadioStation) => {
    if (currentStation?.id === station.id) {
      await togglePlayback();
      return;
    }

    const stream = getDefaultStream(station);
    if (!stream) return;
    await playSelection(station, stream, { autoplay: true });
    setMiniPlayerVisible(true);
    setMiniPlayerExpanded(false);
  };

  const renderStation = ({ item }: { item: RadioStation }) => {
    const isActive = currentStation?.id === item.id;
    const stream = getDefaultStream(item);
    const showFavicon = Boolean(item.favicon) && !brokenFavicons[item.id];

    return (
      <View
        className={`mb-4 rounded-3xl border p-4 ${
          isDark
            ? "border-white/10 bg-slate-900"
            : "border-slate-200 bg-white"
        }`}
      >
        <View className="flex-row items-start gap-3">
          {showFavicon ? (
            <Image
              source={{ uri: item.favicon }}
              className="h-14 w-14 rounded-2xl bg-white"
              onError={() =>
                setBrokenFavicons((prev) => ({ ...prev, [item.id]: true }))
              }
            />
          ) : (
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15">
              <MaterialCommunityIcons name="radio" size={26} color="#F97316" />
            </View>
          )}

          <View className="min-w-0 flex-1">
            <Text
              numberOfLines={2}
              className="text-base font-bold text-gray-900 dark:text-white"
            >
              {item.name}
            </Text>
            <Text className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
              {item.state || item.country} · {item.language}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => handlePlayToggle(item)}
            className={`h-11 w-11 items-center justify-center rounded-full ${
              isActive && isPlaying ? "bg-rose-500" : "bg-orange-500"
            }`}
          >
            <MaterialCommunityIcons
              name={isActive && isPlaying ? "pause" : "play"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        <View className="mt-3 flex-row flex-wrap gap-2">
          <View className="rounded-full bg-gray-100 px-3 py-1 dark:bg-slate-800">
            <Text className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-300">
              {stream?.codec || "Unknown"}
            </Text>
          </View>
          <View className="rounded-full bg-gray-100 px-3 py-1 dark:bg-slate-800">
            <Text className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-300">
              {stream && stream.bitrate > 0 ? `${stream.bitrate} kbps` : "Variable"}
            </Text>
          </View>
          {item.tags.slice(0, 2).map((tag) => (
            <View
              key={tag}
              className="rounded-full bg-gray-100 px-3 py-1 dark:bg-slate-800"
            >
              <Text className="text-[10px] font-medium text-gray-500 dark:text-slate-400">
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <View className="border-b border-gray-200 px-5 pb-4 pt-3 dark:border-slate-800">
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          📻 Live Radio
        </Text>
        <Text className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          German radio channels for listening practice
        </Text>
        {!isLoading && !error && (
          <Text className="mt-2 text-xs font-semibold text-orange-500">
            {stations.length} stations loaded
          </Text>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-4 text-center text-sm text-rose-500">{error}</Text>
          <TouchableOpacity
            onPress={loadStations}
            className="flex-row items-center gap-2 rounded-full bg-orange-500 px-5 py-3"
          >
            <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
            <Text className="text-sm font-semibold text-white">Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stations}
          keyExtractor={(item) => item.id}
          renderItem={renderStation}
          contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        />
      )}
    </View>
  );
}
