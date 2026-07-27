import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  wordService,
  WordVocab,
  WordListFilters,
  WordListLevel,
  WordListTopic,
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
  async (filters: WordListFilters, { rejectWithValue }) => {
    try {
      return await wordService.getWords(filters);
    } catch (error: any) {
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

export const { clearError, clearWords } = wordsSlice.actions;
export default wordsSlice.reducer;
