import React from "react";
import PrepositionSearchList from "../../../src/components/PrepositionSearchList";
import adjectiveData from "../../../src/data/grammar/adjectiveWithPreposition.json";
import type { AdjectivePrepositionEntry } from "../../../src/data/grammar/types";

export default function AdjectiveWithPrepositionScreen() {
  return (
    <PrepositionSearchList
      title="Adjective with Preposition"
      data={adjectiveData as AdjectivePrepositionEntry[]}
      fieldKey="Adjective"
    />
  );
}
