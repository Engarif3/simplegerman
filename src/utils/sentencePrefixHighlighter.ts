import type { WordVocab } from "../services/wordService";

type PrefixWord = Pick<WordVocab, "prefix" | "prefixType">;

export interface SentenceSegment {
  text: string;
  highlighted: boolean;
}

const CONJUNCTION_SEPARATORS = new Set([
  "und",
  "oder",
  "sowie",
  "beziehungsweise",
  "sondern",
  "aber",
  "doch",
  "als",
]);

const MODAL_AUXILIARIES = new Set([
  "kann",
  "kannst",
  "können",
  "könnt",
  "muss",
  "musst",
  "müssen",
  "soll",
  "sollst",
  "sollen",
  "darf",
  "darfst",
  "dürfen",
  "mag",
  "mögen",
  "möchte",
  "will",
  "willst",
  "wollen",
]);

const AUXILIARIES = new Set([
  "werden",
  "wird",
  "wurden",
  "wurde",
  "werde",
  "worden",
  "sein",
  "bin",
  "bist",
  "ist",
  "sind",
  "seid",
  "war",
  "warst",
  "waren",
  "wart",
  "habe",
  "hast",
  "hat",
  "haben",
  "habt",
  "hatte",
  "hattest",
  "hatten",
  "hattet",
  "würde",
  "würdest",
  "würden",
  "würdet",
  "hätte",
  "hättest",
  "hätten",
  "hättet",
]);

// Only highlights for separable verbs (prefixType === "SEPARABLE"). Ported
// 1:1 from the web app's sentencePrefixHighlighter.jsx so mobile sentences
// get the same orange-prefix treatment word-detail already has for the verb
// title itself.
export function highlightPrefixInSentence(
  word: PrefixWord | null | undefined,
  sentence: string,
): SentenceSegment[] {
  if (!word || word.prefixType !== "SEPARABLE" || !word.prefix) {
    return [{ text: sentence, highlighted: false }];
  }

  const prefix = word.prefix.toLowerCase();
  const prefixLength = prefix.length;

  const parts = sentence.split(/(\s+|[.,!?;:])/);

  const isSeparator = (value: string) =>
    value.trim() === "" || /^[.,!?;:]$/.test(value);

  const getNextNonSpaceIndex = (startIndex: number) => {
    let nextIndex = startIndex + 1;
    while (nextIndex < parts.length && parts[nextIndex].trim() === "") {
      nextIndex += 1;
    }
    return nextIndex;
  };

  const getToken = (index: number) => {
    if (index < 0 || index >= parts.length) return "";
    return parts[index].trim().toLowerCase();
  };

  const isClauseEnd = (index: number) => {
    const nextIndex = getNextNonSpaceIndex(index);
    if (nextIndex >= parts.length) return true;
    const nextToken = getToken(nextIndex);
    return (
      /^[,!?;.]$/.test(parts[nextIndex]) ||
      CONJUNCTION_SEPARATORS.has(nextToken)
    );
  };

  const isValidAuxiliaryChain = (index: number) => {
    const nextIndex = getNextNonSpaceIndex(index);
    const nextToken = getToken(nextIndex);
    const nextNextIndex = getNextNonSpaceIndex(nextIndex);
    const nextNextToken = getToken(nextNextIndex);

    if (AUXILIARIES.has(nextToken)) {
      return true;
    }

    if (MODAL_AUXILIARIES.has(nextToken) && AUXILIARIES.has(nextNextToken)) {
      return true;
    }

    return false;
  };

  const segments: SentenceSegment[] = [];

  parts.forEach((part, index) => {
    if (isSeparator(part)) {
      segments.push({ text: part, highlighted: false });
      return;
    }

    const lowerPart = part.toLowerCase();
    const qualifies =
      (isClauseEnd(index) || isValidAuxiliaryChain(index)) &&
      lowerPart.startsWith(prefix);

    if (qualifies) {
      segments.push({ text: part.slice(0, prefixLength), highlighted: true });
      segments.push({ text: part.slice(prefixLength), highlighted: false });
    } else {
      segments.push({ text: part, highlighted: false });
    }
  });

  return segments;
}
