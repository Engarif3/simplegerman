import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { wordService, WordVocab } from "../services/wordService";

export interface WordsState {
  words: WordVocab[];
  allWords: WordVocab[]; // All words for topic extraction
  currentWord: WordVocab | null;
  isLoading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  totalPages: number;
}

const initialState: WordsState = {
  words: [],
  allWords: [],
  currentWord: null,
  isLoading: false,
  error: null,
  total: 0,
  currentPage: 1,
  totalPages: 1,
};

export const fetchWords = createAsyncThunk(
  "words/fetchWords",
  async (params: { limit?: number; page?: number }, { rejectWithValue }) => {
    try {
      console.log("[fetchWords] Calling wordService with:", params);
      const response = await wordService.getWords(
        params.limit || 50,
        params.page || 1,
      );
      console.log("[fetchWords] Received response:", response);
      return response;
    } catch (error: any) {
      console.error("[fetchWords] Error:", error);
      return rejectWithValue(error.message || "Failed to fetch words");
    }
  },
);

export const fetchAllWords = createAsyncThunk(
  "words/fetchAllWords",
  async (_, { rejectWithValue }) => {
    try {
      console.log("[fetchAllWords] Fetching all words without pagination");
      const response = await wordService.getAllWords();
      console.log("[fetchAllWords] Received all words:", {
        count: response.length,
        firstWord: response[0],
      });
      return response;
    } catch (error: any) {
      console.error("[fetchAllWords] Error:", error);
      return rejectWithValue(error.message || "Failed to fetch all words");
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

export const searchWords = createAsyncThunk(
  "words/searchWords",
  async (query: string, { rejectWithValue }) => {
    try {
      return await wordService.searchWords(query);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to search words");
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
        const payload = action.payload as any;
        console.log("[wordsSlice.fetchWords.fulfilled] Payload received:", {
          payloadKeys: Object.keys(payload),
          wordsCount: payload.words?.length || 0,
          payload,
        });
        state.words = payload.words || [];
        state.total = payload.totalWords || 0;
        state.currentPage = payload.currentPage || 1;
        state.totalPages = payload.totalPages || 1;
        console.log(
          "[wordsSlice] Fetched words:",
          state.words.length,
          "total:",
          state.total,
        );
      })
      .addCase(fetchWords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.log("[wordsSlice] Error fetching words:", state.error);
      })

      .addCase(fetchAllWords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllWords.fulfilled, (state, action) => {
        state.isLoading = false;
        const words = action.payload as WordVocab[];
        state.allWords = words;
        console.log("[wordsSlice.fetchAllWords.fulfilled]", {
          wordsCount: words.length,
        });
      })
      .addCase(fetchAllWords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.log("[wordsSlice] Error fetching all words:", state.error);
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
      })

      .addCase(searchWords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchWords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.words = action.payload;
        console.log("[wordsSlice] Search results:", state.words.length);
      })
      .addCase(searchWords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearWords } = wordsSlice.actions;
export default wordsSlice.reducer;
