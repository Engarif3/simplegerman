export interface ClauseEntry {
  conjunction: string;
  meaning: string;
  examples: string[];
  type?: string;
  ruleName?: string;
  rules?: string[];
}

export interface VerbPrepositionEntry {
  Pronoun?: string;
  Verb: string;
  Preposition: string;
  Kasus: string;
  Beispielsatz: string;
  Übersetzung: string;
  Meaning: string;
}

export interface AdjectivePrepositionEntry {
  Pronoun?: string;
  Adjective: string;
  Preposition: string;
  Kasus: string;
  Beispielsatz: string;
  Übersetzung: string;
  Meaning: string;
}

export interface PerfectPastVerb {
  Präsens: string;
  meaning: string;
  Präteritum: string;
  PräteritumSentence: string;
  Perfekt: string;
  PerfektSentence: string;
}

export interface PerfectPastGroup {
  name: string;
  verbs: PerfectPastVerb[];
}

export interface GehenVerb {
  word: string;
  meaning: string;
  sentences: { present: string; past: string; perfect: string; modal: string };
}
