import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRadioPlayer } from "../context/RadioPlayerContext";
import { useTheme } from "../context/ThemeContext";

// Web's mini player is a draggable floating pill; on mobile, a fixed bar
// anchored above the tab bar (Spotify/Apple Music-style) is the more
// idiomatic pattern, so this trades dragging for a fixed position while
// keeping the same folded/expanded states and playback controls.
const TAB_BAR_HEIGHT = 56;

export default function RadioMiniPlayer() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const insets = useSafeAreaInsets();
  const {
    currentStation,
    currentStream,
    hasNextStation,
    hasPreviousStation,
    isMiniPlayerExpanded,
    isMiniPlayerVisible,
    isPlaying,
    isBuffering,
    playerError,
    playNextStation,
    playPreviousStation,
    setMiniPlayerExpanded,
    setMiniPlayerVisible,
    setVolume,
    stopPlayback,
    togglePlayback,
    volume,
  } = useRadioPlayer();

  if (!currentStation || !isMiniPlayerVisible) return null;

  const bottomOffset = insets.bottom + TAB_BAR_HEIGHT;

  const handleClose = () => {
    stopPlayback();
    setMiniPlayerExpanded(false);
    setMiniPlayerVisible(false);
  };

  if (!isMiniPlayerExpanded) {
    return (
      <View
        style={{ position: "absolute", left: 12, right: 12, bottom: bottomOffset }}
        className={`flex-row items-center gap-3 rounded-full px-3 py-2 shadow-lg ${
          isDark ? "bg-slate-950" : "bg-white"
        }`}
      >
        <TouchableOpacity
          onPress={() => togglePlayback()}
          className="h-11 w-11 items-center justify-center rounded-full bg-orange-500"
        >
          <MaterialCommunityIcons
            name={isPlaying ? "pause" : "play"}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMiniPlayerExpanded(true)}
          className="flex-1"
        >
          <Text className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
            {isBuffering ? "Buffering…" : isPlaying ? "Live" : "Paused"}
          </Text>
          <Text
            numberOfLines={1}
            className="text-sm font-semibold text-gray-900 dark:text-white"
          >
            {currentStation.name}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleClose}
          className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800"
        >
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={isDark ? "#fff" : "#333"}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={{ position: "absolute", left: 12, right: 12, bottom: bottomOffset }}
      className={`rounded-3xl border p-4 shadow-2xl ${
        isDark ? "border-white/10 bg-slate-950" : "border-slate-200 bg-white"
      }`}
    >
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
            Now playing
          </Text>
          <Text
            numberOfLines={1}
            className="mt-1 text-lg font-bold text-gray-900 dark:text-white"
          >
            {currentStation.name}
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
            {currentStation.country}
            {currentStation.state ? `, ${currentStation.state}` : ""}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setMiniPlayerExpanded(false)}
            className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800"
          >
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={isDark ? "#fff" : "#333"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClose}
            className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800"
          >
            <MaterialCommunityIcons
              name="close"
              size={18}
              color={isDark ? "#fff" : "#333"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {playerError ? (
        <Text className="mb-2 text-xs text-rose-500">{playerError}</Text>
      ) : null}

      <View className="mb-3 flex-row items-center justify-between gap-3">
        <TouchableOpacity
          onPress={() => playPreviousStation()}
          disabled={!hasPreviousStation}
          className={`h-11 w-11 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 ${
            !hasPreviousStation ? "opacity-40" : ""
          }`}
        >
          <MaterialCommunityIcons
            name="skip-previous"
            size={22}
            color={isDark ? "#fff" : "#333"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => togglePlayback()}
          className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-orange-500"
        >
          <MaterialCommunityIcons
            name={isPlaying ? "pause" : "play"}
            size={22}
            color="#fff"
          />
          <Text className="text-sm font-semibold text-white">
            {isPlaying ? "Pause" : "Play"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => playNextStation()}
          disabled={!hasNextStation}
          className={`h-11 w-11 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 ${
            !hasNextStation ? "opacity-40" : ""
          }`}
        >
          <MaterialCommunityIcons
            name="skip-next"
            size={22}
            color={isDark ? "#fff" : "#333"}
          />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center gap-2">
        <MaterialCommunityIcons
          name={volume === 0 ? "volume-mute" : "volume-high"}
          size={18}
          color={isDark ? "#94A3B8" : "#666"}
        />
        <Slider
          style={{ flex: 1, height: 32 }}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          minimumTrackTintColor="#F97316"
          maximumTrackTintColor={isDark ? "#334155" : "#DDD"}
          thumbTintColor="#F97316"
          onValueChange={setVolume}
        />
        <Text className="w-9 text-right text-xs font-semibold text-gray-500 dark:text-slate-400">
          {Math.round(volume * 100)}%
        </Text>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
          {currentStream?.codec || "Unknown"}
        </Text>
        <Text className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">
          {currentStream && currentStream.bitrate > 0
            ? `${currentStream.bitrate} kbps`
            : "Variable bitrate"}
        </Text>
      </View>
    </View>
  );
}
