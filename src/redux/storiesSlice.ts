import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  storyService,
  Story,
  CreateStoryRequest,
} from "../services/storyService";

export interface StoriesState {
  stories: Story[];
  currentStory: Story | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: StoriesState = {
  stories: [],
  currentStory: null,
  isLoading: false,
  error: null,
};

export const fetchStories = createAsyncThunk(
  "stories/fetchStories",
  async (
    params: { levelId?: string; limit?: number; offset?: number },
    { rejectWithValue },
  ) => {
    try {
      return await storyService.getStories(
        params.levelId,
        params.limit,
        params.offset,
      );
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch stories");
    }
  },
);

export const fetchStory = createAsyncThunk(
  "stories/fetchStory",
  async (id: string, { rejectWithValue }) => {
    try {
      return await storyService.getStory(id);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch story");
    }
  },
);

export const generateStory = createAsyncThunk(
  "stories/generateStory",
  async (data: CreateStoryRequest, { rejectWithValue }) => {
    try {
      return await storyService.generateStory(data);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to generate story");
    }
  },
);

const storiesSlice = createSlice({
  name: "stories",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchStories.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchStories.fulfilled, (state, action) => {
      state.isLoading = false;
      state.stories = action.payload as Story[];
      console.log("[storiesSlice] Fetched stories:", state.stories.length);
    });
    builder.addCase(fetchStories.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
      console.log("[storiesSlice] Error fetching stories:", state.error);
    });

    builder.addCase(fetchStory.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchStory.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentStory = action.payload;
    });
    builder.addCase(fetchStory.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(generateStory.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(generateStory.fulfilled, (state, action) => {
      state.isLoading = false;
      state.currentStory = action.payload;
      state.stories.unshift(action.payload);
    });
    builder.addCase(generateStory.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError } = storiesSlice.actions;
export default storiesSlice.reducer;
