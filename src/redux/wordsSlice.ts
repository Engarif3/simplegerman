import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  wordService,
  WordVocab,
  WordListFilters,
  WordListLevel,
  WordListTopic,
  WordListResponse,
} from "../services/wordService";

export interface WordsState {
  words: WordVocab[];
  levels: WordListLevel[];
  topics: WordListTopic[];
  currentWord: WordVocab | null;
  isLoading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  totalPages: number;
}

const initialState: WordsState = {
  words: [],
  levels: [],
  topics: [],
  currentWord: null,
  isLoading: false,
  error: null,
  total: 0,
  currentPage: 1,
  totalPages: 1,
};

export const fetchWords = createAsyncThunk(
  "words/fetchWords",
  // Passing thunkAPI.signal through lets the caller abort a still-in-flight
  // fetch (see vocabulary.tsx's effect cleanup) instead of leaving it to
  // resolve and overwrite newer state — without this, clicking through
  // several pages/filters quickly stacks up overlapping requests that all
  // eventually complete, each triggering a full re-render.
  async (filters: WordListFilters, { rejectWithValue, signal }) => {
    try {
      return await wordService.getWords(filters, signal);
    } catch (error: any) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        throw error;
      }
      return rejectWithValue(error.message || "Failed to fetch words");
    }
  },
);

export const fetchWord = createAsyncThunk(
  "words/fetchWord",
  async (id: string, { rejectWithValue }) => {
    try {
      return await wordService.getWord(id);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch word");
    }
  },
);

const wordsSlice = createSlice({
  name: "words",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearWords: (state) => {
      state.words = [];
    },
    // Applies an already-fetched page (from vocabulary.tsx's in-memory
    // cache) synchronously — no network round trip, no loading flicker.
    // Mirrors web's WordList.jsx cache-hit path (applyCacheState), which is
    // why revisiting a page there feels instant while mobile previously
    // re-fetched every single page change from scratch.
    hydrateWordsFromCache: (state, action: PayloadAction<WordListResponse>) => {
      state.isLoading = false;
      state.error = null;
      const payload = action.payload;
      state.words = payload.words || [];
      state.total = payload.totalWords || 0;
      state.currentPage = payload.currentPage || 1;
      state.totalPages = payload.totalPages || 1;
      if (payload.levels) state.levels = payload.levels;
      if (payload.topics) state.topics = payload.topics;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWords.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        state.words = payload.words || [];
        state.total = payload.totalWords || 0;
        state.currentPage = payload.currentPage || 1;
        state.totalPages = payload.totalPages || 1;
        if (payload.levels) state.levels = payload.levels;
        if (payload.topics) state.topics = payload.topics;
      })
      .addCase(fetchWords.rejected, (state, action) => {
        // A superseded request (cancelled because a newer page/filter fetch
        // started before it finished) isn't a real failure — leave loading/
        // error state alone so it doesn't flicker or clobber the request
        // that replaced it.
        if (action.meta.aborted) return;
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchWord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWord.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWord = action.payload;
      })
      .addCase(fetchWord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearWords, hydrateWordsFromCache } = wordsSlice.actions;
export default wordsSlice.reducer;
