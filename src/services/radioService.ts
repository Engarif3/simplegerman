// Ported 1:1 from the web app's RadioChannels.jsx station-normalization,
// dedupe, and scoring logic so mobile ends up with the same station list,
// grouping, and quality ranking — no backend involvement, this is exactly
// how the web app sources radio data too (radio-browser.info + a hardcoded
// custom-station list).

const RADIO_API_URLS = [
  "https://de1.api.radio-browser.info/json/stations/byname/deutschland",
  "https://de2.api.radio-browser.info/json/stations/byname/deutschland",
];

export interface RawStation {
  stationuuid?: string;
  name?: string;
  url?: string;
  url_resolved?: string;
  homepage?: string;
  favicon?: string;
  country?: string;
  state?: string;
  language?: string;
  tags?: string;
  codec?: string;
  bitrate?: number;
  votes?: number;
  clickcount?: number;
  clicktrend?: number;
  lastcheckok?: number;
  has_extended_info?: boolean;
}

const CUSTOM_STATIONS: RawStation[] = [
  {
    stationuuid: "custom-radio-unicc",
    name: "Radio UNiCC",
    url: "https://stream.radio-unicc.de:8000/unicc_hq.mp3",
    url_resolved: "https://stream.radio-unicc.de:8000/unicc_hq.mp3",
    homepage: "https://www.radio-unicc.de",
    favicon: "",
    country: "Germany",
    state: "Saxony",
    language: "German",
    tags: "campus,student,radio",
    codec: "MP3",
    bitrate: 0,
    votes: 0,
    clickcount: 0,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-1live",
    name: "1LIVE",
    url: "https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3",
    url_resolved:
      "https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3",
    homepage: "https://einslive.de/",
    favicon:
      "https://www1.wdr.de/radio/1live/resources/img/favicon/apple-touch-icon.png",
    country: "Germany",
    state: "North Rhine-Westphalia",
    language: "German",
    tags: "ard,public radio,rock,top 40",
    codec: "MP3",
    bitrate: 128,
    votes: 31736,
    clickcount: 246,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-wdr2",
    name: "WDR 2",
    url: "https://wdr-wdr2-rheinland.icecastssl.wdr.de/wdr/wdr2/rheinland/mp3/128/stream.mp3",
    url_resolved:
      "https://wdr-wdr2-rheinland.icecastssl.wdr.de/wdr/wdr2/rheinland/mp3/128/stream.mp3",
    homepage: "https://www1.wdr.de/radio/wdr2/",
    favicon: "https://www1.wdr.de/resources-v5.139.1/img/favicon/apple-touch-icon.png",
    country: "Germany",
    state: "North Rhine-Westphalia",
    language: "German",
    tags: "music,news,talk",
    codec: "MP3",
    bitrate: 128,
    votes: 6861,
    clickcount: 54,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-wdr4",
    name: "WDR 4",
    url: "https://wdr-wdr4-live.icecastssl.wdr.de/wdr/wdr4/live/mp3/128/stream.mp3",
    url_resolved:
      "https://wdr-wdr4-live.icecastssl.wdr.de/wdr/wdr4/live/mp3/128/stream.mp3",
    homepage: "https://www1.wdr.de/radio/wdr4/index.html",
    favicon: "https://www1.wdr.de/resources/img/favicon/apple-touch-icon.png",
    country: "Germany",
    state: "North Rhine-Westphalia",
    language: "German",
    tags: "schlager,pop,hits",
    codec: "MP3",
    bitrate: 128,
    votes: 5225,
    clickcount: 37,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-wdr5",
    name: "WDR 5",
    url: "https://wdr-wdr5-live.icecastssl.wdr.de/wdr/wdr5/live/mp3/128/stream.mp3",
    url_resolved:
      "https://wdr-wdr5-live.icecastssl.wdr.de/wdr/wdr5/live/mp3/128/stream.mp3",
    homepage: "https://www1.wdr.de/radio/wdr5/",
    favicon:
      "https://www1.wdr.de/resources-v5.134.1/img/favicon/apple-touch-icon.png",
    country: "Germany",
    state: "North Rhine-Westphalia",
    language: "German",
    tags: "information,news,talk",
    codec: "MP3",
    bitrate: 128,
    votes: 23556,
    clickcount: 180,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-ndr2",
    name: "NDR 2",
    url: "https://icecast.ndr.de/ndr/ndr2/niedersachsen/mp3/128/stream.mp3",
    url_resolved: "https://icecast.ndr.de/ndr/ndr2/niedersachsen/mp3/128/stream.mp3",
    homepage: "https://www.ndr.de/ndr2/",
    favicon: "https://www.ndr.de/apple-touch-icon-120x120.png",
    country: "Germany",
    state: "Niedersachsen",
    language: "German",
    tags: "pop,hits",
    codec: "MP3",
    bitrate: 128,
    votes: 4500,
    clickcount: 40,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-ndrinfo",
    name: "NDR Info",
    url: "https://icecast.ndr.de/ndr/ndrinfo/hamburg/mp3/128/stream.mp3",
    url_resolved: "https://icecast.ndr.de/ndr/ndrinfo/hamburg/mp3/128/stream.mp3",
    homepage: "https://www.ndr.de/info/",
    favicon: "https://www.ndr.de/apple-touch-icon-120x120.png",
    country: "Germany",
    state: "Hamburg",
    language: "German",
    tags: "culture,information,news,regional",
    codec: "MP3",
    bitrate: 128,
    votes: 5099,
    clickcount: 50,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-swr3",
    name: "SWR3",
    url: "https://liveradio.swr.de/sw282p3/swr3/play.mp3",
    url_resolved: "https://liveradio.swr.de/sw282p3/swr3/play.mp3",
    homepage: "https://swr3.de/",
    favicon: "https://swr3.de/assets/swr3/icons/apple-touch-icon.png",
    country: "Germany",
    state: "Baden-Württemberg",
    language: "German",
    tags: "news,pop,rock",
    codec: "MP3",
    bitrate: 128,
    votes: 18518,
    clickcount: 289,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-bayern3",
    name: "Bayern 3",
    url: "https://dispatcher.rndfnk.com/br/br3/live/mp3/mid",
    url_resolved: "https://dispatcher.rndfnk.com/br/br3/live/mp3/mid",
    homepage: "https://www.br.de/radio/bayern-3/",
    favicon: "",
    country: "Germany",
    state: "Bavaria",
    language: "German",
    tags: "top 40,pop,hits",
    codec: "MP3",
    bitrate: 96,
    votes: 4200,
    clickcount: 30,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-hr3",
    name: "hr3",
    url: "https://dispatcher.rndfnk.com/hr/hr3/live/mp3/high",
    url_resolved: "https://dispatcher.rndfnk.com/hr/hr3/live/mp3/high",
    homepage: "https://www.hr3.de/",
    favicon: "",
    country: "Germany",
    state: "Hessen",
    language: "German",
    tags: "pop,news",
    codec: "MP3",
    bitrate: 192,
    votes: 3800,
    clickcount: 25,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-mdraktuell",
    name: "MDR Aktuell",
    url: "https://mdr-284340-0.sslcast.mdr.de/mdr/284340/0/mp3/high/stream.mp3",
    url_resolved:
      "https://mdr-284340-0.sslcast.mdr.de/mdr/284340/0/mp3/high/stream.mp3",
    homepage: "https://mdraktuell.de/",
    favicon:
      "https://cdn.mdr.de/resources/global/img/mdrde/favicons/apple-icon-120x120.png",
    country: "Germany",
    state: "Sachsen",
    language: "German",
    tags: "information,news",
    codec: "MP3",
    bitrate: 128,
    votes: 6146,
    clickcount: 38,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-mdrklassik",
    name: "MDR Klassik",
    url: "https://mdr-284350-0.sslcast.mdr.de/mdr/284350/0/mp3/high/stream.mp3",
    url_resolved:
      "https://mdr-284350-0.sslcast.mdr.de/mdr/284350/0/mp3/high/stream.mp3",
    homepage: "https://mdrklassik.de/",
    favicon:
      "https://cdn.mdr.de/resources/global/img/mdrde/favicons/apple-icon-120x120.png",
    country: "Germany",
    state: "Sachsen",
    language: "German",
    tags: "classical",
    codec: "MP3",
    bitrate: 128,
    votes: 5470,
    clickcount: 23,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-radioeins",
    name: "radioeins",
    url: "https://dispatcher.rndfnk.com/rbb/radioeins/live/mp3/128/stream.mp3",
    url_resolved:
      "https://dispatcher.rndfnk.com/rbb/radioeins/live/mp3/128/stream.mp3",
    homepage: "https://www.radioeins.de/",
    favicon: "https://www.radioeins.de/content/dam/rbb/rbb/logos/touch/rad-128.png",
    country: "Germany",
    state: "Berlin",
    language: "German",
    tags: "adult contemporary,alternative,information,rock,talk",
    codec: "MP3",
    bitrate: 128,
    votes: 12128,
    clickcount: 78,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-inforadio",
    name: "Inforadio",
    url: "https://dispatcher.rndfnk.com/rbb/inforadio/live/mp3/mid",
    url_resolved: "https://dispatcher.rndfnk.com/rbb/inforadio/live/mp3/mid",
    homepage: "https://www.inforadio.de/",
    favicon: "https://www.inforadio.de/content/dam/rbb/rbb/logos/touch/inf-128.png",
    country: "Germany",
    state: "Berlin",
    language: "German",
    tags: "information,news",
    codec: "MP3",
    bitrate: 96,
    votes: 11776,
    clickcount: 66,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-antennebayern",
    name: "Antenne Bayern",
    url: "https://mp3channels.webradio.antenne.de/antenne",
    url_resolved: "https://mp3channels.webradio.antenne.de/antenne",
    homepage: "https://www.antenne.de/",
    favicon:
      "https://www.antenne.de/logos/station-antenne-bayern/apple-touch-icon.png",
    country: "Germany",
    state: "Bavaria",
    language: "German",
    tags: "top 40,pop",
    codec: "MP3",
    bitrate: 128,
    votes: 20970,
    clickcount: 69,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-ffh",
    name: "Hit Radio FFH",
    url: "https://mp3.ffh.de/radioffh/hqlivestream.mp3",
    url_resolved: "https://mp3.ffh.de/radioffh/hqlivestream.mp3",
    homepage: "https://www.ffh.de/",
    favicon: "https://www.ffh.de/android-icon.png",
    country: "Germany",
    state: "Hessen",
    language: "German",
    tags: "pop,top 40",
    codec: "MP3",
    bitrate: 128,
    votes: 6632,
    clickcount: 56,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-rockantenne",
    name: "Rock Antenne",
    url: "https://mp3channels.webradio.rockantenne.de/rockantenne",
    url_resolved: "https://mp3channels.webradio.rockantenne.de/rockantenne",
    homepage: "https://www.rockantenne.de/",
    favicon: "https://www.rockantenne.de/logos/rock-antenne/apple-touch-icon.png",
    country: "Germany",
    state: "Bavaria",
    language: "German",
    tags: "rock",
    codec: "MP3",
    bitrate: 128,
    votes: 25284,
    clickcount: 124,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
  {
    stationuuid: "custom-radio-kissfm",
    name: "98.8 Kiss FM",
    url: "https://stream.kissfm.de/kissfm/mp3-128/internetradio/",
    url_resolved: "https://stream.kissfm.de/kissfm/mp3-128/internetradio/",
    homepage: "https://www.kissfm.de/",
    favicon:
      "https://upload.kissfm.de/production/static/1699276434696/icons/icon_64.be8y2280000.png",
    country: "Germany",
    state: "Berlin",
    language: "German",
    tags: "hits,pop",
    codec: "MP3",
    bitrate: 128,
    votes: 5089,
    clickcount: 14,
    clicktrend: 0,
    lastcheckok: 1,
    has_extended_info: false,
  },
];

const normalizeText = (value: unknown) => String(value ?? "").trim();

const toTagList = (value: unknown) =>
  normalizeText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

const getComparableBitrate = (bitrate: number) => (bitrate > 0 ? bitrate : -1);

// Native apps aren't subject to a page's HTTPS mixed-content restrictions
// (unlike the web version, which must reject http:// streams on an https
// page) — any non-empty stream URL is usable here.
const canUseStreamUrl = (streamUrl: string) => normalizeText(streamUrl).length > 0;

const STREAM_SUFFIX_PATTERNS = [
  /\s*\|\s*(?:aac|mp3|opus|ogg|mpeg)\s*\d+\s*k(?:bit\/s|bps)?\s*$/i,
  /\s*\|\s*\d+\s*k(?:bit\/s|bps)?\s*(?:aac|mp3|opus|ogg|mpeg)?\s*$/i,
  /\s*[-|]\s*(?:aac|mp3|opus|ogg|mpeg)\s*$/i,
];

const CHANNEL_ALIAS_RULES: { pattern: RegExp; canonicalName: string }[] = [
  {
    pattern: /^deutschland(?:radio\s+kultur|funk\s+kultur)(?:\s*\|\s*dlf)?$/i,
    canonicalName: "Deutschlandfunk Kultur",
  },
  {
    pattern: /^deutschland(?:funk\s+nachrichten|radio\s+nachrichten)$/i,
    canonicalName: "Deutschlandfunk Nachrichten",
  },
  {
    pattern:
      /^deutschland(?:funk(?:\s+dokumente\s+und\s+debatten)?|radio)(?:\s*\|\s*dlf)?$/i,
    canonicalName: "Deutschlandfunk",
  },
  {
    pattern: /^deutschland(?:funk|radio)\s+nova(?:\s*\|\s*dlf)?$/i,
    canonicalName: "Deutschlandfunk Nova",
  },
  {
    pattern: /^radio\s*b2(?:\s*-\s*deutschland|\s+deutschland)?$/i,
    canonicalName: "Radio B2 Deutschland",
  },
  {
    pattern:
      /^rtl(?:\s+radio)?\s*-?\s*deutschlands\s+hit-radio(?:\s*\/\s*regional(?:\s*rtl)?)?$/i,
    canonicalName: "RTL - Deutschlands Hit-Radio",
  },
  {
    pattern: /^bigfm\s+deutschland(?:\s+original)?$/i,
    canonicalName: "bigFM Deutschland",
  },
];

const BLOCKED_CHANNEL_PATTERNS = [/^nostalgie\s+deutschland\s+80er$/i];

const PREFERRED_LIVE_CHANNELS: Record<
  string,
  { streamUrl: string; codec: string; bitrate: number; streamId: string }
> = {
  Deutschlandfunk: {
    streamUrl: "https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3",
    codec: "MP3",
    bitrate: 128,
    streamId: "preferred-live-dlf",
  },
  "Deutschlandfunk Kultur": {
    streamUrl: "https://st02.sslstream.dlf.de/dlf/02/128/mp3/stream.mp3",
    codec: "MP3",
    bitrate: 128,
    streamId: "preferred-live-dlf-kultur",
  },
  "Deutschlandfunk Nova": {
    streamUrl: "https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3",
    codec: "MP3",
    bitrate: 128,
    streamId: "preferred-live-dlf-nova",
  },
};

const PINNED_CHANNEL_ORDER: Record<string, number> = {
  "radio unicc": 0,
  deutschlandfunk: 1,
  "deutschlandfunk nachrichten": 2,
  "deutschlandfunk kultur": 3,
  "deutschlandfunk nova": 4,
};

const normalizeChannelName = (value: unknown) => {
  let normalizedName = normalizeText(value);

  for (const pattern of STREAM_SUFFIX_PATTERNS) {
    normalizedName = normalizedName.replace(pattern, "").trim();
  }

  normalizedName = normalizedName.replace(/\s*\|\s*$/, "").trim();

  const aliasMatch = CHANNEL_ALIAS_RULES.find(({ pattern }) =>
    pattern.test(normalizedName),
  );

  return aliasMatch?.canonicalName || normalizedName;
};

interface NormalizedStation {
  id: string;
  name: string;
  streamUrl: string;
  homepage: string;
  favicon: string;
  country: string;
  state: string;
  language: string;
  tags: string[];
  codec: string;
  bitrate: number;
  votes: number;
  clickcount: number;
  clicktrend: number;
  hasExtendedInfo: boolean;
}

export interface StreamOption {
  id: string;
  streamUrl: string;
  bitrate: number;
  codec: string;
  votes: number;
  clickcount: number;
  clicktrend: number;
  score: number;
}

export interface RadioStation {
  id: string;
  name: string;
  homepage: string;
  favicon: string;
  country: string;
  state: string;
  language: string;
  tags: string[];
  votes: number;
  clickcount: number;
  clicktrend: number;
  hasExtendedInfo: boolean;
  streams: StreamOption[];
}

const buildStationScore = (station: NormalizedStation) =>
  (station.favicon ? 20 : 0) +
  station.votes * 2 +
  station.clickcount * 3 +
  station.clicktrend * 4 +
  station.bitrate;

const normalizeStation = (station: RawStation): NormalizedStation | null => {
  const streamUrl = normalizeText(station.url_resolved || station.url);
  const rawName = normalizeText(station.name);
  const name = normalizeChannelName(rawName);

  if (
    !streamUrl ||
    !canUseStreamUrl(streamUrl) ||
    !name ||
    station.lastcheckok === 0 ||
    BLOCKED_CHANNEL_PATTERNS.some((pattern) => pattern.test(name))
  ) {
    return null;
  }

  return {
    id:
      normalizeText(station.stationuuid) ||
      `${name.toLowerCase()}-${streamUrl.toLowerCase()}`,
    name,
    streamUrl,
    homepage: normalizeText(station.homepage),
    favicon: normalizeText(station.favicon),
    country: normalizeText(station.country) || "Germany",
    state: normalizeText(station.state),
    language: normalizeText(station.language) || "German",
    tags: toTagList(station.tags),
    codec: normalizeText(station.codec) || "Unknown",
    bitrate: Number(station.bitrate) || 0,
    votes: Number(station.votes) || 0,
    clickcount: Number(station.clickcount) || 0,
    clicktrend: Number(station.clicktrend) || 0,
    hasExtendedInfo: Boolean(station.has_extended_info),
  };
};

const getChannelKey = (station: NormalizedStation) =>
  station.name.toLowerCase().replace(/\s+/g, " ");

const buildStreamOption = (station: NormalizedStation): StreamOption => ({
  id: `${station.id}-${station.codec.toLowerCase()}-${station.bitrate || "variable"}`,
  streamUrl: station.streamUrl,
  bitrate: station.bitrate,
  codec: station.codec,
  votes: station.votes,
  clickcount: station.clickcount,
  clicktrend: station.clicktrend,
  score: buildStationScore(station),
});

const buildPreferredLiveStream = (channelName: string): StreamOption | null => {
  const liveChannel = PREFERRED_LIVE_CHANNELS[channelName];

  if (!liveChannel) {
    return null;
  }

  return {
    id: liveChannel.streamId,
    streamUrl: liveChannel.streamUrl,
    bitrate: liveChannel.bitrate,
    codec: liveChannel.codec,
    votes: 0,
    clickcount: 0,
    clicktrend: 0,
    score: 100000,
  };
};

export const groupStations = (stations: RawStation[]): RadioStation[] => {
  const channelMap = new Map<
    string,
    Omit<RadioStation, "streams"> & { streams: StreamOption[] }
  >();

  for (const rawStation of stations) {
    const station = normalizeStation(rawStation);

    if (!station) {
      continue;
    }

    const channelKey = getChannelKey(station);
    const existingChannel = channelMap.get(channelKey);

    if (!existingChannel) {
      channelMap.set(channelKey, {
        id: channelKey,
        name: station.name,
        homepage: station.homepage,
        favicon: station.favicon,
        country: station.country,
        state: station.state,
        language: station.language,
        tags: [...station.tags],
        votes: station.votes,
        clickcount: station.clickcount,
        clicktrend: station.clicktrend,
        hasExtendedInfo: station.hasExtendedInfo,
        streams: [buildStreamOption(station)],
      });
      continue;
    }

    const currentScore = buildStationScore(station);
    const existingScore =
      existingChannel.votes * 2 +
      existingChannel.clickcount * 3 +
      existingChannel.clicktrend * 4 +
      (existingChannel.favicon ? 20 : 0);

    if (currentScore > existingScore) {
      existingChannel.name = station.name;
      existingChannel.homepage = station.homepage || existingChannel.homepage;
      existingChannel.favicon = station.favicon || existingChannel.favicon;
      existingChannel.country = station.country;
      existingChannel.state = station.state;
      existingChannel.language = station.language;
      existingChannel.votes = station.votes;
      existingChannel.clickcount = station.clickcount;
      existingChannel.clicktrend = station.clicktrend;
      existingChannel.hasExtendedInfo = station.hasExtendedInfo;
    }

    existingChannel.tags = Array.from(
      new Set([...existingChannel.tags, ...station.tags]),
    ).slice(0, 4);

    const nextStream = buildStreamOption(station);
    const existingStreamIndex = existingChannel.streams.findIndex(
      (stream) => stream.bitrate === nextStream.bitrate && stream.codec === nextStream.codec,
    );

    if (existingStreamIndex === -1) {
      existingChannel.streams.push(nextStream);
    } else if (nextStream.score > existingChannel.streams[existingStreamIndex].score) {
      existingChannel.streams[existingStreamIndex] = nextStream;
    }
  }

  return Array.from(channelMap.values())
    .map((channel) => ({
      ...channel,
      streams: (() => {
        const preferredLiveStream = buildPreferredLiveStream(channel.name);
        const baseStreams = [...channel.streams];

        if (preferredLiveStream) {
          const existingStreamIndex = baseStreams.findIndex(
            (stream) => stream.streamUrl === preferredLiveStream.streamUrl,
          );

          if (existingStreamIndex >= 0) {
            baseStreams[existingStreamIndex] = {
              ...baseStreams[existingStreamIndex],
              ...preferredLiveStream,
            };
          } else {
            baseStreams.unshift(preferredLiveStream);
          }
        }

        return baseStreams.sort((left, right) => {
          if (getComparableBitrate(right.bitrate) !== getComparableBitrate(left.bitrate)) {
            return getComparableBitrate(right.bitrate) - getComparableBitrate(left.bitrate);
          }

          return right.score - left.score;
        });
      })(),
    }))
    .sort((left, right) => {
      const leftPinnedRank =
        PINNED_CHANNEL_ORDER[left.name.toLowerCase()] ?? Number.POSITIVE_INFINITY;
      const rightPinnedRank =
        PINNED_CHANNEL_ORDER[right.name.toLowerCase()] ?? Number.POSITIVE_INFINITY;

      if (leftPinnedRank !== rightPinnedRank) {
        return leftPinnedRank - rightPinnedRank;
      }

      if (right.votes !== left.votes) {
        return right.votes - left.votes;
      }

      if (right.clickcount !== left.clickcount) {
        return right.clickcount - left.clickcount;
      }

      const rightTopBitrate = getComparableBitrate(right.streams[0]?.bitrate || 0);
      const leftTopBitrate = getComparableBitrate(left.streams[0]?.bitrate || 0);

      if (rightTopBitrate !== leftTopBitrate) {
        return rightTopBitrate - leftTopBitrate;
      }

      return left.name.localeCompare(right.name);
    });
};

export const getDefaultStream = (channel: RadioStation | null | undefined) =>
  channel?.streams?.[0] || null;

const fetchStationsFromMirror = async (): Promise<RawStation[]> => {
  let lastError: unknown = null;

  for (const url of RADIO_API_URLS) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("All radio mirrors failed.");
};

class RadioService {
  async getStations(): Promise<RadioStation[]> {
    const data = await fetchStationsFromMirror();
    const merged = [...CUSTOM_STATIONS, ...(Array.isArray(data) ? data : [])];
    return groupStations(merged);
  }
}

export const radioService = new RadioService();
