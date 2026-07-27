export interface HighlightSegment {
  text: string;
  highlighted: boolean;
}

// Ported 1:1 from web's highlightConjunctions (duplicated identically across
// CoordinatingConjunction.jsx/SubordinatingConjunction.jsx/ConjunctiveAdverb.jsx/
// Other.jsx) — consolidated here into one shared utility instead of copying
// it four times. Multi-part conjunctions (e.g. "sowohl … als auch") are
// split on the literal " … " separator and each part is matched
// independently anywhere it appears in the sentence.
export function highlightConjunctions(
  sentence: string,
  conjunctionPhrase: string,
): HighlightSegment[] {
  const conjunctionParts = conjunctionPhrase
    .split(" … ")
    .map((part) => part.trim().toLowerCase().split(/\s+/));

  const tokens = sentence.split(/(\s+)/).map((token, index) => ({
    original: token,
    clean: token
      .replace(/[.,!?;:()]/g, "")
      .toLowerCase()
      .trim(),
    index,
    isWhitespace: /^\s+$/.test(token),
  }));

  const nonWhitespaceTokens = tokens.filter((t) => !t.isWhitespace);
  const highlightedIndices = new Set<number>();

  conjunctionParts.forEach((part) => {
    const partLength = part.length;
    for (let i = 0; i <= nonWhitespaceTokens.length - partLength; i++) {
      const sequence = nonWhitespaceTokens
        .slice(i, i + partLength)
        .map((t) => t.clean);

      if (sequence.join(" ") === part.join(" ")) {
        nonWhitespaceTokens
          .slice(i, i + partLength)
          .forEach((t) => highlightedIndices.add(t.index));
      }
    }
  });

  return tokens.map((token) => ({
    text: token.original,
    highlighted: highlightedIndices.has(token.index),
  }));
}
