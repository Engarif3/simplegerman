import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import type { RadioStation, StreamOption } from "../services/radioService";

type PlaySelectionOptions = {
  autoplay?: boolean;
  openMiniPlayer?: boolean;
};

interface RadioPlayerContextValue {
  currentStation: RadioStation | null;
  currentStream: StreamOption | null;
  hasNextStation: boolean;
  hasPreviousStation: boolean;
  isMiniPlayerExpanded: boolean;
  isMiniPlayerVisible: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  playerError: string;
  volume: number;
  playSelection: (
    station: RadioStation,
    stream: StreamOption,
    options?: PlaySelectionOptions,
  ) => Promise<boolean>;
  togglePlayback: () => Promise<boolean>;
  stopPlayback: () => void;
  setQueue: (stations: RadioStation[]) => void;
  playNextStation: () => Promise<boolean>;
  playPreviousStation: () => Promise<boolean>;
  setVolume: (volume: number) => void;
  setMiniPlayerVisible: (visible: boolean) => void;
  setMiniPlayerExpanded: (expanded: boolean) => void;
}

const RadioPlayerContext = createContext<RadioPlayerContextValue | undefined>(
  undefined,
);

const getNextFallbackStream = (
  station: RadioStation | null,
  currentStreamId?: string,
): StreamOption | null => {
  if (!station?.streams?.length) return null;
  const currentIndex = station.streams.findIndex((s) => s.id === currentStreamId);
  if (currentIndex === -1) return null;
  return station.streams[currentIndex + 1] || null;
};

// How long we wait after calling play() for the stream to actually start
// before treating it as failed and falling back to the next bitrate/codec
// option — expo-audio's player doesn't reject a promise on stream failure
// the way a web <audio> element does, so this stands in for that signal.
const STALL_TIMEOUT_MS = 8000;

export const RadioPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const playerRef = useRef<AudioPlayer | null>(null);
  const currentStationRef = useRef<RadioStation | null>(null);
  const currentStreamRef = useRef<StreamOption | null>(null);
  const stationQueueRef = useRef<RadioStation[]>([]);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [stationQueue, setStationQueue] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [currentStream, setCurrentStream] = useState<StreamOption | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const [volume, setVolumeState] = useState(1);
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(false);
  const [isMiniPlayerExpanded, setIsMiniPlayerExpanded] = useState(false);

  useEffect(() => {
    currentStationRef.current = currentStation;
    currentStreamRef.current = currentStream;
    stationQueueRef.current = stationQueue;
  }, [currentStation, currentStream, stationQueue]);

  const clearStallTimer = () => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  };

  const handleStreamFailure = useCallback(() => {
    const station = currentStationRef.current;
    const stream = currentStreamRef.current;
    const fallbackStream = getNextFallbackStream(station, stream?.id);

    if (station && fallbackStream) {
      const fallbackLabel =
        fallbackStream.bitrate > 0 ? `${fallbackStream.bitrate} kbps` : "variable bitrate";
      setPlayerError(
        `Primary stream failed. Switched to ${fallbackStream.codec} ${fallbackLabel}.`,
      );
      setCurrentStream(fallbackStream);

      const player = playerRef.current;
      if (player) {
        player.replace({ uri: fallbackStream.streamUrl });
        player.play();
      }
      return;
    }

    setIsPlaying(false);
    setPlayerError("This stream could not be played right now.");
  }, []);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "duckOthers",
    }).catch(() => {});

    const player = createAudioPlayer(null, { updateInterval: 500 });
    playerRef.current = player;

    const subscription = player.addListener("playbackStatusUpdate", (status) => {
      setIsPlaying(status.playing);
      setIsBuffering(status.isBuffering);

      if (status.playing) {
        clearStallTimer();
      }
    });

    return () => {
      subscription.remove();
      clearStallTimer();
      player.remove();
      playerRef.current = null;
    };
  }, [handleStreamFailure]);

  useEffect(() => {
    const player = playerRef.current;
    if (player) {
      player.volume = volume;
    }
  }, [volume]);

  const setQueue = useCallback((stations: RadioStation[]) => {
    setStationQueue(stations);

    if (!currentStationRef.current) return;

    const matchedStation = stations.find(
      (station) => station.id === currentStationRef.current?.id,
    );
    if (!matchedStation) return;

    setCurrentStation(matchedStation);

    const matchedStream =
      matchedStation.streams.find((s) => s.id === currentStreamRef.current?.id) ||
      matchedStation.streams[0];
    if (matchedStream) setCurrentStream(matchedStream);
  }, []);

  const playSelection = useCallback(
    async (
      station: RadioStation,
      stream: StreamOption,
      { autoplay = true, openMiniPlayer = false }: PlaySelectionOptions = {},
    ) => {
      const player = playerRef.current;
      if (!station || !stream?.streamUrl || !player) return false;

      clearStallTimer();
      setCurrentStation(station);
      setCurrentStream(stream);
      setPlayerError("");

      if (openMiniPlayer) {
        setIsMiniPlayerVisible(true);
        setIsMiniPlayerExpanded(true);
      }

      try {
        player.replace({ uri: stream.streamUrl });

        if (!autoplay) return true;

        player.play();
        stallTimerRef.current = setTimeout(() => {
          if (!playerRef.current?.playing) {
            handleStreamFailure();
          }
        }, STALL_TIMEOUT_MS);

        return true;
      } catch {
        setIsPlaying(false);
        setPlayerError("Playback was blocked or the stream is unavailable.");
        return false;
      }
    },
    [handleStreamFailure],
  );

  const togglePlayback = useCallback(async () => {
    const player = playerRef.current;
    const station = currentStationRef.current;
    const stream = currentStreamRef.current;

    if (!player || !station || !stream?.streamUrl) return false;

    if (player.playing) {
      player.pause();
      clearStallTimer();
      return true;
    }

    try {
      setPlayerError("");
      player.play();
      stallTimerRef.current = setTimeout(() => {
        if (!playerRef.current?.playing) {
          handleStreamFailure();
        }
      }, STALL_TIMEOUT_MS);
      return true;
    } catch {
      setIsPlaying(false);
      setPlayerError("Playback was blocked or the stream is unavailable.");
      return false;
    }
  }, [handleStreamFailure]);

  const stopPlayback = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.pause();
    clearStallTimer();
    setIsPlaying(false);
    setPlayerError("");
  }, []);

  const currentStationIndex = stationQueue.findIndex(
    (station) => station.id === currentStation?.id,
  );
  const hasPreviousStation = currentStationIndex > 0;
  const hasNextStation =
    currentStationIndex >= 0 && currentStationIndex < stationQueue.length - 1;

  const playStationAtIndex = useCallback(
    async (stationIndex: number) => {
      const nextStation = stationQueueRef.current[stationIndex];
      const nextStream = nextStation?.streams?.[0] || null;
      if (!nextStation || !nextStream) return false;
      return playSelection(nextStation, nextStream, { autoplay: true });
    },
    [playSelection],
  );

  const playPreviousStation = useCallback(async () => {
    if (!hasPreviousStation) return false;
    return playStationAtIndex(currentStationIndex - 1);
  }, [currentStationIndex, hasPreviousStation, playStationAtIndex]);

  const playNextStation = useCallback(async () => {
    if (!hasNextStation) return false;
    return playStationAtIndex(currentStationIndex + 1);
  }, [currentStationIndex, hasNextStation, playStationAtIndex]);

  const setVolume = useCallback((next: number) => setVolumeState(next), []);

  return (
    <RadioPlayerContext.Provider
      value={{
        currentStation,
        currentStream,
        hasNextStation,
        hasPreviousStation,
        isMiniPlayerExpanded,
        isMiniPlayerVisible,
        isPlaying,
        isBuffering,
        playerError,
        volume,
        playSelection,
        togglePlayback,
        stopPlayback,
        setQueue,
        playNextStation,
        playPreviousStation,
        setVolume,
        setMiniPlayerVisible: setIsMiniPlayerVisible,
        setMiniPlayerExpanded: setIsMiniPlayerExpanded,
      }}
    >
      {children}
    </RadioPlayerContext.Provider>
  );
};

export const useRadioPlayer = () => {
  const context = useContext(RadioPlayerContext);
  if (!context) {
    throw new Error("useRadioPlayer must be used within a RadioPlayerProvider");
  }
  return context;
};
