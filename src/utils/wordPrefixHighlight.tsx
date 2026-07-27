import React from "react";
import { Text, TextStyle, StyleProp, TextProps } from "react-native";
import type { WordVocab } from "../services/wordService";

type PrefixWord = Pick<WordVocab, "value" | "prefix" | "prefixType">;

// Separable German verbs ("aufstehen" -> "auf" + "stehen") show the
// separable prefix in a distinct color everywhere the word appears, mirroring
// the web app's renderWordWithPrefix. Only separable verbs carry a `prefix`,
// so no part-of-speech check is needed here.
export function renderWordWithPrefix(
  word: PrefixWord,
  baseStyle: StyleProp<TextStyle>,
  prefixStyle: StyleProp<TextStyle>,
  extraProps?: TextProps,
): React.ReactElement {
  const wordValue = word.value || "";

  if (word.prefixType === "SEPARABLE" && word.prefix) {
    const parts = wordValue.split(" ");
    let matchIndex = -1;

    for (let i = 0; i < parts.length; i++) {
      if (parts[i].toLowerCase() === "sich") continue;
      if (parts[i].toLowerCase().startsWith(word.prefix.toLowerCase())) {
        matchIndex = i;
        break;
      }
    }

    if (matchIndex !== -1) {
      const matchedPart = parts[matchIndex];
      const prefixPart = matchedPart.slice(0, word.prefix.length);
      const restPart = matchedPart.slice(word.prefix.length);
      const before = parts.slice(0, matchIndex).join(" ");
      const after = parts.slice(matchIndex + 1).join(" ");

      return (
        <Text style={baseStyle} {...extraProps}>
          {before ? `${before} ` : ""}
          <Text style={prefixStyle}>{prefixPart}</Text>
          {restPart}
          {after ? ` ${after}` : ""}
        </Text>
      );
    }
  }

  return (
    <Text style={baseStyle} {...extraProps}>
      {wordValue}
    </Text>
  );
}
