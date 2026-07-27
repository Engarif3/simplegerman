import type { WordVocab } from "../services/wordService";

// "verb" gets a solid colored background (sky-600 on web); every other
// non-noun tone is web's own "bg-black" badge with only the text color
// varying — matching that exactly (rather than giving every tone its own
// background color) keeps badges from turning into a wall of clashing
// colors in a column this narrow. Noun genders ("der"/"die"/"das"/"der/die",
// the only Article rows actually seeded — see prisma/scripts/create.ts) get
// their own distinct tones instead of one shared "article" tone: with every
// row now showing a colored cell, a single color for all articles made
// every noun's gender look identical, which defeats the point of a German
// vocab table where the article IS the thing to memorize per word.
export type ArticleBadgeTone =
  | "der"
  | "die"
  | "das"
  | "der-die"
  | "article"
  | "verb"
  | "adjective"
  | "adverb"
  | "adjective-adverb"
  | "preposition"
  | "conjunction"
  | "phrase";

export interface ArticleBadgeDisplay {
  text: string;
  tone: ArticleBadgeTone;
  tooltip: string;
}

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getArticleName = (word: Pick<WordVocab, "article">) => {
  if (typeof word.article === "string") return word.article;
  return word.article?.name || word.article?.value || "";
};

// Mirrors the web app's getArticleColumnDisplay (WordTableRow.jsx): nouns show
// their der/die/das article, every other part of speech shows a short
// abbreviated badge instead (this column doubles as the part-of-speech
// indicator, which is why it isn't just "Article").
export function getArticleBadge(
  word: Pick<WordVocab, "article" | "partOfSpeech">,
): ArticleBadgeDisplay {
  const partOfSpeechName = normalizeText(word?.partOfSpeech?.name);
  const articleName = getArticleName(word);

  if (
    !partOfSpeechName ||
    partOfSpeechName === "unknown" ||
    partOfSpeechName === "not specified" ||
    partOfSpeechName === "noun"
  ) {
    const normalizedArticle = normalizeText(articleName);
    if (normalizedArticle === "der") {
      return { text: articleName, tone: "der", tooltip: "Masculine" };
    }
    if (normalizedArticle === "die") {
      return { text: articleName, tone: "die", tooltip: "Feminine" };
    }
    if (normalizedArticle === "das") {
      return { text: articleName, tone: "das", tooltip: "Neuter" };
    }
    if (normalizedArticle === "der/die") {
      return { text: articleName, tone: "der-die", tooltip: "Masculine/Feminine" };
    }
    return { text: articleName, tone: "article", tooltip: "" };
  }

  if (partOfSpeechName === "verb") {
    return { text: "vrb.", tone: "verb", tooltip: "Verb" };
  }

  if (partOfSpeechName === "adjective") {
    return { text: "adj.", tone: "adjective", tooltip: "Adjective" };
  }

  if (partOfSpeechName === "adverb") {
    return { text: "adv.", tone: "adverb", tooltip: "Adverb" };
  }

  if (
    partOfSpeechName === "adjective/adverb" ||
    partOfSpeechName === "adjective / adverb"
  ) {
    return { text: "aj/av", tone: "adjective-adverb", tooltip: "Adjective/Adverb" };
  }

  if (partOfSpeechName === "preposition") {
    return { text: "pre.", tone: "preposition", tooltip: "Preposition" };
  }

  if (partOfSpeechName === "conjunction") {
    return { text: "conj.", tone: "conjunction", tooltip: "Conjunction" };
  }

  if (partOfSpeechName === "phrase") {
    return { text: "phr.", tone: "phrase", tooltip: "Phrase" };
  }

  return { text: articleName, tone: "article", tooltip: "" };
}

export const isVerbWord = (word: Pick<WordVocab, "partOfSpeech">) =>
  normalizeText(word?.partOfSpeech?.name) === "verb";
