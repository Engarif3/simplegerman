import React from "react";
import PrepositionSearchList from "../../../src/components/PrepositionSearchList";
import verbData from "../../../src/data/grammar/verbWithPreposition.json";
import type { VerbPrepositionEntry } from "../../../src/data/grammar/types";

export default function VerbWithPrepositionScreen() {
  return (
    <PrepositionSearchList
      title="Verb with Preposition"
      data={verbData as VerbPrepositionEntry[]}
      fieldKey="Verb"
    />
  );
}
